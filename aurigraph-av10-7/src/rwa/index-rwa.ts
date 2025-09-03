import express from 'express';
import cors from 'cors';
import { AssetRegistry } from './registry/AssetRegistry';
import { AuditTrailManager } from './audit/AuditTrailManager';
import { ReportingEngine } from './reporting/ReportingEngine';
import { MultiAssetClassManager } from './registry/MultiAssetClassManager';
import { FractionalTokenizer } from './tokenization/FractionalTokenizer';
import { DigitalTwinTokenizer } from './tokenization/DigitalTwinTokenizer';
import { CompoundTokenizer } from './tokenization/CompoundTokenizer';
import { YieldTokenizer } from './tokenization/YieldTokenizer';
import { CrossJurisdictionEngine } from './compliance/CrossJurisdictionEngine';
import { MCPServer } from './mcp/MCPServer';
import { MCPRouter } from './mcp/MCPRouter';

export class AurigraphRWAPlatform {
    private app: express.Application;
    private assetRegistry!: AssetRegistry;
    private auditManager!: AuditTrailManager;
    private reportingEngine!: ReportingEngine;
    private multiAssetManager!: MultiAssetClassManager;
    private complianceEngine!: CrossJurisdictionEngine;
    private mcpServer!: MCPServer;
    private mcpRouter!: MCPRouter;
    private port: number;

    constructor(port: number = 3020) {
        this.port = port;
        this.app = express();
        this.initializeComponents();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private initializeComponents(): void {
        console.log('🔧 Initializing AV10-20 RWA Platform Components...');
        
        this.auditManager = new AuditTrailManager();
        this.assetRegistry = new AssetRegistry({} as any, {} as any);
        this.multiAssetManager = new MultiAssetClassManager(this.assetRegistry);
        this.reportingEngine = new ReportingEngine(this.auditManager, this.assetRegistry, this.multiAssetManager);
        this.complianceEngine = new CrossJurisdictionEngine(this.assetRegistry);
        this.mcpServer = new MCPServer(this.assetRegistry, this.auditManager, this.multiAssetManager, this.port);
        this.mcpRouter = new MCPRouter(this.assetRegistry, this.auditManager, this.multiAssetManager);

        console.log('✅ All components initialized successfully');
    }

    private setupMiddleware(): void {
        this.app.use(cors({
            origin: ['http://localhost:3000', 'https://dashboard.aurigraph.io'],
            credentials: true
        }));

        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });

        // Security headers
        this.app.use((req, res, next) => {
            res.header('X-Content-Type-Options', 'nosniff');
            res.header('X-Frame-Options', 'DENY');
            res.header('X-XSS-Protection', '1; mode=block');
            next();
        });
    }

    private setupRoutes(): void {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                platform: 'AV10-20 RWA',
                version: '20.0.0',
                timestamp: Date.now(),
                components: {
                    assetRegistry: 'operational',
                    auditManager: 'operational',
                    reportingEngine: 'operational',
                    complianceEngine: 'operational',
                    mcpInterface: 'operational'
                }
            });
        });

        // Platform status
        this.app.get('/status', async (req, res) => {
            try {
                const metrics = await this.reportingEngine.getDashboardMetrics();
                const auditMetrics = this.auditManager.getAuditMetrics();
                
                res.json({
                    platform: {
                        name: 'Aurigraph RWA Tokenization Platform',
                        version: '20.0.0',
                        compliance: 'AV10-17',
                        uptime: process.uptime(),
                        status: 'OPERATIONAL'
                    },
                    metrics,
                    audit: auditMetrics,
                    lastUpdated: Date.now()
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get platform status',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Mount MCP router
        this.app.use('/api/rwa/v2', this.mcpRouter.getRouter());

        // Asset registry routes
        this.app.get('/api/assets', async (req, res) => {
            try {
                const assets = await this.assetRegistry.getAllAssets();
                res.json({ assets, count: assets.length });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get assets',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        this.app.get('/api/assets/:assetId', async (req, res) => {
            try {
                const asset = await this.assetRegistry.getAsset(req.params.assetId);
                if (!asset) {
                    return res.status(404).json({ error: 'Asset not found' });
                }
                res.json(asset);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get asset',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Dashboard metrics
        this.app.get('/api/dashboard/metrics', async (req, res) => {
            try {
                const metrics = await this.reportingEngine.getDashboardMetrics();
                res.json(metrics);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get dashboard metrics',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Audit trail query
        this.app.post('/api/audit/query', async (req, res) => {
            try {
                const events = await this.auditManager.queryAuditTrail(req.body);
                res.json({ events, count: events.length });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to query audit trail',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Generate reports
        this.app.post('/api/reports/generate', async (req, res) => {
            try {
                const { type, startTime, endTime, jurisdiction, filters } = req.body;
                const report = await this.auditManager.generateReport(
                    type,
                    startTime || Date.now() - (30 * 24 * 60 * 60 * 1000),
                    endTime || Date.now(),
                    jurisdiction || 'US',
                    filters || {}
                );
                res.json(report);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to generate report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Export reports
        this.app.post('/api/reports/:reportId/export', async (req, res) => {
            try {
                const { format } = req.body;
                // This would export from cached reports
                res.json({
                    reportId: req.params.reportId,
                    format,
                    downloadUrl: `/api/reports/${req.params.reportId}/download?format=${format}`,
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to export report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Compliance check
        this.app.post('/api/compliance/check', async (req, res) => {
            try {
                const result = await this.complianceEngine.checkCompliance(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to check compliance',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Platform initialization endpoint
        this.app.post('/api/initialize', async (req, res) => {
            try {
                await this.initializePlatformData();
                res.json({
                    status: 'INITIALIZED',
                    message: 'Platform initialized with sample data',
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to initialize platform',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Error handling
        this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('RWA Platform Error:', error);
            
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal server error',
                    timestamp: Date.now(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                });
            }
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                timestamp: Date.now()
            });
        });
    }

    private async initializePlatformData(): Promise<void> {
        console.log('📊 Initializing platform with sample data...');

        // Create sample real estate asset
        const realEstateAssetId = await this.assetRegistry.createAsset({
            name: 'Premium Office Complex - Manhattan',
            description: 'Grade A office building in Manhattan financial district',
            assetClass: 'REAL_ESTATE',
            metadata: {
                address: '100 Wall Street, New York, NY 10005',
                totalSqFt: 850000,
                floors: 35,
                occupancyRate: 95,
                tenants: ['Goldman Sachs', 'JP Morgan', 'BlackRock'],
                yearBuilt: 2015,
                lastRenovation: 2022
            },
            valuation: {
                currentValue: 500000000,
                currency: 'USD',
                valuationMethod: 'INCOME_APPROACH',
                valuationDate: Date.now(),
                appraiser: 'CBRE Valuations'
            },
            compliance: {
                jurisdiction: 'US',
                regulatoryFramework: 'SEC',
                kycRequired: true,
                amlRequired: true
            }
        });

        // Create sample carbon credit asset
        const carbonAssetId = await this.assetRegistry.createAsset({
            name: 'Amazon Rainforest Conservation Project',
            description: 'REDD+ certified carbon offset project protecting 50,000 hectares',
            assetClass: 'CARBON_CREDITS',
            metadata: {
                location: 'Acre State, Brazil',
                hectares: 50000,
                verificationStandard: 'VERRA_VCS',
                projectId: 'VCS-1234',
                expectedCredits: 2500000,
                vintage: 2024,
                monitoring: {
                    satellites: true,
                    groundSensors: true,
                    dronePatrols: true
                }
            },
            valuation: {
                currentValue: 37500000,
                currency: 'USD',
                valuationMethod: 'MARKET_APPROACH',
                valuationDate: Date.now(),
                appraiser: 'Carbon Credit Valuations Inc'
            }
        });

        // Tokenize the real estate asset
        const fractionalTokenizer = new FractionalTokenizer(this.assetRegistry, this.auditManager);
        await fractionalTokenizer.tokenizeAsset(realEstateAssetId, {
            totalTokens: 500000000, // $1 per token
            minimumInvestment: 10000,
            investorLimit: 499,
            yieldDistribution: {
                frequency: 'QUARTERLY',
                expectedYield: 7.5,
                distributionMethod: 'PROPORTIONAL'
            }
        });

        // Create digital twin for carbon credit asset  
        const digitalTwinTokenizer = new DigitalTwinTokenizer(this.assetRegistry, this.auditManager);
        await digitalTwinTokenizer.createDigitalTwin(carbonAssetId, {
            iotIntegration: {
                sensorTypes: ['CO2_MONITORING', 'FOREST_HEALTH', 'BIODIVERSITY'],
                dataFrequency: 'HOURLY',
                monitoringDuration: 365 * 10 // 10 years
            },
            verificationProtocol: {
                standard: 'VERRA_VCS',
                auditFrequency: 'QUARTERLY',
                thirdPartyVerification: true
            }
        });

        console.log('✅ Sample data initialized successfully');
        console.log(`🏢 Real Estate Asset: ${realEstateAssetId}`);
        console.log(`🌱 Carbon Credit Asset: ${carbonAssetId}`);
    }

    async start(): Promise<void> {
        return new Promise((resolve) => {
            this.app.listen(this.port, async () => {
                console.log('🚀 Aurigraph AV10-20 RWA Platform Started');
                console.log('=========================================');
                console.log(`🌐 Platform API: http://localhost:${this.port}`);
                console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
                console.log(`📊 Status: http://localhost:${this.port}/status`);
                console.log(`🔌 MCP API: http://localhost:${this.port}/api/rwa/v2`);
                console.log(`📚 MCP Docs: http://localhost:${this.port}/api/rwa/v2/docs`);
                console.log(`📡 Real-time Stream: http://localhost:${this.port}/api/rwa/v2/events`);
                
                // Log platform startup
                await this.auditManager.logEvent(
                    'RWA_PLATFORM_STARTED',
                    'SYSTEM',
                    'MEDIUM',
                    'rwa-platform',
                    'PLATFORM',
                    'STARTUP',
                    {
                        version: '20.0.0',
                        port: this.port,
                        componentsLoaded: [
                            'AssetRegistry',
                            'AuditTrailManager', 
                            'ReportingEngine',
                            'MultiAssetClassManager',
                            'CrossJurisdictionEngine',
                            'MCPServer'
                        ]
                    },
                    { nodeId: 'rwa-platform-main' }
                );

                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        console.log('🛑 Shutting down RWA Platform gracefully...');
        
        await this.auditManager.logEvent(
            'RWA_PLATFORM_SHUTDOWN',
            'SYSTEM',
            'MEDIUM',
            'rwa-platform',
            'PLATFORM',
            'SHUTDOWN',
            {
                uptime: process.uptime(),
                gracefulShutdown: true
            },
            { nodeId: 'rwa-platform-main' }
        );

        if (this.mcpServer) {
            await this.mcpServer.stop();
        }
    }

    getComponents(): any {
        return {
            assetRegistry: this.assetRegistry,
            auditManager: this.auditManager,
            reportingEngine: this.reportingEngine,
            multiAssetManager: this.multiAssetManager,
            complianceEngine: this.complianceEngine,
            mcpServer: this.mcpServer
        };
    }
}

// Start the platform if this file is run directly
if (require.main === module) {
    const platform = new AurigraphRWAPlatform();
    
    platform.start().then(() => {
        console.log('🎉 AV10-20 RWA Platform is ready for integration!');
        console.log('');
        console.log('🔗 Integration Examples:');
        console.log('  - Portfolio managers can use /api/rwa/v2/portfolio endpoints');
        console.log('  - Real estate platforms can tokenize via /api/rwa/v2/tokenization');
        console.log('  - Carbon credit marketplaces can create digital twins');
        console.log('  - DeFi protocols can use compound tokenization');
        console.log('  - Compliance teams can access /api/rwa/v2/compliance endpoints');
        console.log('');
        console.log('📡 Real-time updates available via Server-Sent Events at /api/rwa/v2/events');
    }).catch(error => {
        console.error('❌ Failed to start RWA Platform:', error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await platform.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await platform.stop();
        process.exit(0);
    });
}