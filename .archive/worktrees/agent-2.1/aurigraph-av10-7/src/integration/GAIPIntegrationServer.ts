/**
 * GAIP Integration Server
 * 
 * Standalone server for GAIP-Aurigraph integration.
 * Provides REST API and WebSocket endpoints for GAIP agents to interact with Aurigraph blockchain.
 */

import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import expressWs from 'express-ws';
import { Logger } from '../core/Logger';
import { GAIPIntegrationModule } from './GAIPIntegrationModule';
import { GAIPDataCaptureMiddleware } from './GAIPDataCaptureMiddleware';
import { AuditTrailManager } from '../rwa/audit/AuditTrailManager';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { ZKProofSystem } from '../zk/ZKProofSystem';
import { CollectiveIntelligenceNetwork } from '../ai/CollectiveIntelligenceNetwork';
import { CrossChainBridge } from '../crosschain/CrossChainBridge';
import { ConfigManager } from '../core/ConfigManager';

export interface ServerConfig {
    port: number;
    gaipEndpoint?: string;
    gaipApiKey?: string;
    aurigraphNodeUrl?: string;
    aurigraphChainId?: string;
    corsOrigins?: string[];
    enableWebSocket?: boolean;
    enableMetrics?: boolean;
}

export class GAIPIntegrationServer {
    private app: Application;
    private server: http.Server;
    private logger: Logger;
    private integrationModule: GAIPIntegrationModule;
    private middleware: GAIPDataCaptureMiddleware;
    private config: ServerConfig;
    private isRunning: boolean = false;

    constructor(config?: ServerConfig) {
        this.logger = new Logger('GAIPServer');
        this.config = config || this.getDefaultConfig();
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Enable WebSocket if configured
        if (this.config.enableWebSocket) {
            expressWs(this.app, this.server);
        }

        this.initialize();
    }

    private getDefaultConfig(): ServerConfig {
        return {
            port: parseInt(process.env.GAIP_INTEGRATION_PORT || '3005'),
            gaipEndpoint: process.env.GAIP_ENDPOINT || 'http://localhost:3000',
            gaipApiKey: process.env.GAIP_API_KEY,
            aurigraphNodeUrl: process.env.AURIGRAPH_NODE_URL || 'http://localhost:8181',
            aurigraphChainId: process.env.AURIGRAPH_CHAIN_ID || 'aurigraph-av10',
            corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
            enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
            enableMetrics: process.env.ENABLE_METRICS !== 'false'
        };
    }

    private async initialize(): Promise<void> {
        try {
            this.logger.info('🚀 Initializing GAIP Integration Server');

            // Initialize core components
            const configManager = new ConfigManager();
            const auditManager = new AuditTrailManager();
            const cryptoManager = new QuantumCryptoManagerV2(configManager.getConfig());
            const zkProofSystem = new ZKProofSystem(cryptoManager);
            const collectiveIntelligence = new CollectiveIntelligenceNetwork(cryptoManager);
            
            // Initialize cross-chain bridge if available
            let crossChainBridge: CrossChainBridge | undefined;
            try {
                crossChainBridge = new CrossChainBridge(cryptoManager);
            } catch (error) {
                this.logger.warn('Cross-chain bridge not available, continuing without it');
            }

            // Initialize integration module
            this.integrationModule = new GAIPIntegrationModule(
                {
                    gaipEndpoint: this.config.gaipEndpoint!,
                    gaipApiKey: this.config.gaipApiKey,
                    aurigraphNodeUrl: this.config.aurigraphNodeUrl!,
                    aurigraphChainId: this.config.aurigraphChainId!,
                    captureMode: 'FULL',
                    encryptionEnabled: true,
                    zkProofsEnabled: true,
                    crossChainVerification: !!crossChainBridge,
                    retentionDays: 365,
                    batchSize: 100,
                    realTimeStreaming: true
                },
                auditManager,
                cryptoManager,
                zkProofSystem,
                collectiveIntelligence,
                crossChainBridge
            );

            // Initialize middleware
            this.middleware = new GAIPDataCaptureMiddleware(this.integrationModule);

            // Setup Express middleware
            this.setupExpressMiddleware();

            // Setup routes
            this.setupRoutes();

            // Setup error handling
            this.setupErrorHandling();

            this.logger.info('✅ GAIP Integration Server initialized');
        } catch (error) {
            this.logger.error(`Failed to initialize server: ${error}`);
            throw error;
        }
    }

    private setupExpressMiddleware(): void {
        // CORS configuration
        this.app.use(cors({
            origin: this.config.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-gaip-api-key', 'x-gaip-agent-id', 'x-gaip-session-id']
        }));

        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            this.logger.debug(`${req.method} ${req.path}`);
            next();
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'GAIP-Aurigraph Integration Server',
                version: '1.0.0',
                uptime: process.uptime(),
                timestamp: Date.now()
            });
        });
    }

    private setupRoutes(): void {
        // Mount GAIP integration routes
        this.app.use('/api/v1/gaip', this.middleware.getRouter());

        // Additional admin routes
        this.app.get('/api/v1/admin/status', this.getServerStatus.bind(this));
        this.app.post('/api/v1/admin/reset', this.resetServer.bind(this));
        
        // Metrics endpoint
        if (this.config.enableMetrics) {
            this.app.get('/metrics', this.getPrometheusMetrics.bind(this));
        }

        // Documentation
        this.app.get('/api/v1/docs', this.getApiDocumentation.bind(this));
    }

    private setupErrorHandling(): void {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.path,
                method: req.method
            });
        });

        // Error handler
        this.app.use((err: any, req: any, res: any, next: any) => {
            this.logger.error(`Server error: ${err.message}`);
            res.status(err.status || 500).json({
                error: err.message || 'Internal server error',
                timestamp: Date.now()
            });
        });
    }

    private getServerStatus(req: express.Request, res: express.Response): void {
        const metrics = this.integrationModule.getMetrics();
        
        res.json({
            status: 'operational',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            metrics: Object.fromEntries(metrics),
            config: {
                port: this.config.port,
                gaipEndpoint: this.config.gaipEndpoint,
                aurigraphChainId: this.config.aurigraphChainId,
                webSocketEnabled: this.config.enableWebSocket,
                metricsEnabled: this.config.enableMetrics
            },
            timestamp: Date.now()
        });
    }

    private async resetServer(req: express.Request, res: express.Response): Promise<void> {
        try {
            // Reinitialize integration module
            await this.initialize();
            
            res.json({
                success: true,
                message: 'Server reset successfully',
                timestamp: Date.now()
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to reset server',
                details: error.message
            });
        }
    }

    private getPrometheusMetrics(req: express.Request, res: express.Response): void {
        const metrics = this.integrationModule.getMetrics();
        
        let prometheusFormat = '';
        
        // Convert to Prometheus format
        for (const [key, value] of metrics) {
            const metricName = `gaip_integration_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`;
            prometheusFormat += `# TYPE ${metricName} gauge\n`;
            prometheusFormat += `${metricName} ${value}\n`;
        }
        
        // Add process metrics
        const memUsage = process.memoryUsage();
        prometheusFormat += `# TYPE process_memory_heap_used_bytes gauge\n`;
        prometheusFormat += `process_memory_heap_used_bytes ${memUsage.heapUsed}\n`;
        
        prometheusFormat += `# TYPE process_uptime_seconds gauge\n`;
        prometheusFormat += `process_uptime_seconds ${process.uptime()}\n`;
        
        res.set('Content-Type', 'text/plain');
        res.send(prometheusFormat);
    }

    private getApiDocumentation(req: express.Request, res: express.Response): void {
        const docs = {
            title: 'GAIP-Aurigraph Integration API',
            version: '1.0.0',
            description: 'API for integrating GAIP analyses with Aurigraph blockchain',
            baseUrl: `http://localhost:${this.config.port}/api/v1`,
            endpoints: {
                analysis: {
                    start: {
                        method: 'POST',
                        path: '/gaip/analysis/start',
                        description: 'Start a new analysis capture session',
                        body: {
                            name: 'string',
                            description: 'string',
                            agents: 'array'
                        }
                    },
                    complete: {
                        method: 'POST',
                        path: '/gaip/analysis/:id/complete',
                        description: 'Complete an analysis and record on blockchain',
                        body: {
                            results: 'object'
                        }
                    },
                    status: {
                        method: 'GET',
                        path: '/gaip/analysis/:id/status',
                        description: 'Get analysis status'
                    },
                    report: {
                        method: 'GET',
                        path: '/gaip/analysis/:id/report',
                        description: 'Generate comprehensive analysis report'
                    },
                    export: {
                        method: 'GET',
                        path: '/gaip/analysis/:id/export',
                        description: 'Export analysis data',
                        query: {
                            format: 'JSON | CSV | BLOCKCHAIN'
                        }
                    }
                },
                datapoints: {
                    capture: {
                        method: 'POST',
                        path: '/gaip/datapoint',
                        description: 'Capture a single datapoint',
                        body: {
                            analysisId: 'string',
                            dataType: 'INPUT | PROCESSING | OUTPUT',
                            category: 'string',
                            value: 'any',
                            source: 'object',
                            metadata: 'object',
                            privacy: 'object'
                        }
                    },
                    batch: {
                        method: 'POST',
                        path: '/gaip/datapoints/batch',
                        description: 'Capture batch of datapoints',
                        body: {
                            analysisId: 'string',
                            datapoints: 'array'
                        }
                    },
                    query: {
                        method: 'GET',
                        path: '/gaip/datapoints',
                        description: 'Query captured datapoints',
                        query: {
                            analysisId: 'string',
                            agentId: 'string',
                            dataType: 'string',
                            startTime: 'number',
                            endTime: 'number',
                            limit: 'number'
                        }
                    },
                    verify: {
                        method: 'GET',
                        path: '/gaip/verify/:datapointId',
                        description: 'Verify datapoint integrity on blockchain'
                    }
                },
                websocket: {
                    stream: {
                        path: '/gaip/stream',
                        description: 'WebSocket endpoint for real-time datapoint streaming',
                        messages: {
                            START_ANALYSIS: 'Start new analysis',
                            DATAPOINT: 'Stream datapoint',
                            COMPLETE_ANALYSIS: 'Complete analysis'
                        }
                    }
                },
                admin: {
                    status: {
                        method: 'GET',
                        path: '/admin/status',
                        description: 'Get server status and metrics'
                    },
                    reset: {
                        method: 'POST',
                        path: '/admin/reset',
                        description: 'Reset server and reinitialize components'
                    }
                },
                monitoring: {
                    health: {
                        method: 'GET',
                        path: '/health',
                        description: 'Health check endpoint'
                    },
                    metrics: {
                        method: 'GET',
                        path: '/metrics',
                        description: 'Prometheus-compatible metrics endpoint'
                    }
                }
            },
            authentication: {
                type: 'API Key',
                header: 'x-gaip-api-key',
                description: 'Required for all GAIP endpoints'
            },
            rateLimit: {
                requests: 1000,
                window: '1 minute',
                description: 'Rate limiting per API key'
            }
        };

        res.json(docs);
    }

    /**
     * Start the server
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('Server is already running');
            return;
        }

        return new Promise((resolve) => {
            this.server.listen(this.config.port, () => {
                this.isRunning = true;
                this.logger.info(`🌐 GAIP Integration Server started on port ${this.config.port}`);
                this.logger.info(`📡 WebSocket: ${this.config.enableWebSocket ? 'Enabled' : 'Disabled'}`);
                this.logger.info(`📊 Metrics: ${this.config.enableMetrics ? 'Enabled' : 'Disabled'}`);
                this.logger.info(`🔗 Aurigraph Chain: ${this.config.aurigraphChainId}`);
                this.logger.info(`📝 API Documentation: http://localhost:${this.config.port}/api/v1/docs`);
                resolve();
            });
        });
    }

    /**
     * Stop the server
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            this.logger.warn('Server is not running');
            return;
        }

        return new Promise((resolve) => {
            this.server.close(() => {
                this.isRunning = false;
                this.logger.info('✅ GAIP Integration Server stopped');
                resolve();
            });
        });
    }

    /**
     * Get server instance
     */
    public getApp(): Application {
        return this.app;
    }

    /**
     * Get integration module
     */
    public getIntegrationModule(): GAIPIntegrationModule {
        return this.integrationModule;
    }
}

// Standalone server startup
if (require.main === module) {
    const server = new GAIPIntegrationServer();
    
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down GAIP Integration Server...');
        await server.stop();
        process.exit(0);
    });
}