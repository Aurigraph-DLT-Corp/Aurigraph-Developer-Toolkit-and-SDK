"use strict";
/**
 * GAIP Integration Server
 *
 * Standalone server for GAIP-Aurigraph integration.
 * Provides REST API and WebSocket endpoints for GAIP agents to interact with Aurigraph blockchain.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAIPIntegrationServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const express_ws_1 = __importDefault(require("express-ws"));
const Logger_1 = require("../core/Logger");
const GAIPIntegrationModule_1 = require("./GAIPIntegrationModule");
const GAIPDataCaptureMiddleware_1 = require("./GAIPDataCaptureMiddleware");
const AuditTrailManager_1 = require("../rwa/audit/AuditTrailManager");
const QuantumCryptoManagerV2_1 = require("../crypto/QuantumCryptoManagerV2");
const ZKProofSystem_1 = require("../zk/ZKProofSystem");
const CollectiveIntelligenceNetwork_1 = require("../ai/CollectiveIntelligenceNetwork");
const CrossChainBridge_1 = require("../crosschain/CrossChainBridge");
const ConfigManager_1 = require("../core/ConfigManager");
class GAIPIntegrationServer {
    app;
    server;
    logger;
    integrationModule;
    middleware;
    config;
    isRunning = false;
    constructor(config) {
        this.logger = new Logger_1.Logger('GAIPServer');
        this.config = config || this.getDefaultConfig();
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        // Enable WebSocket if configured
        if (this.config.enableWebSocket) {
            (0, express_ws_1.default)(this.app, this.server);
        }
        this.initialize();
    }
    getDefaultConfig() {
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
    async initialize() {
        try {
            this.logger.info('🚀 Initializing GAIP Integration Server');
            // Initialize core components
            const configManager = new ConfigManager_1.ConfigManager();
            const auditManager = new AuditTrailManager_1.AuditTrailManager();
            const cryptoManager = new QuantumCryptoManagerV2_1.QuantumCryptoManagerV2(configManager.getConfig());
            const zkProofSystem = new ZKProofSystem_1.ZKProofSystem(cryptoManager);
            const collectiveIntelligence = new CollectiveIntelligenceNetwork_1.CollectiveIntelligenceNetwork(cryptoManager);
            // Initialize cross-chain bridge if available
            let crossChainBridge;
            try {
                crossChainBridge = new CrossChainBridge_1.CrossChainBridge(cryptoManager);
            }
            catch (error) {
                this.logger.warn('Cross-chain bridge not available, continuing without it');
            }
            // Initialize integration module
            this.integrationModule = new GAIPIntegrationModule_1.GAIPIntegrationModule({
                gaipEndpoint: this.config.gaipEndpoint,
                gaipApiKey: this.config.gaipApiKey,
                aurigraphNodeUrl: this.config.aurigraphNodeUrl,
                aurigraphChainId: this.config.aurigraphChainId,
                captureMode: 'FULL',
                encryptionEnabled: true,
                zkProofsEnabled: true,
                crossChainVerification: !!crossChainBridge,
                retentionDays: 365,
                batchSize: 100,
                realTimeStreaming: true
            }, auditManager, cryptoManager, zkProofSystem, collectiveIntelligence, crossChainBridge);
            // Initialize middleware
            this.middleware = new GAIPDataCaptureMiddleware_1.GAIPDataCaptureMiddleware(this.integrationModule);
            // Setup Express middleware
            this.setupExpressMiddleware();
            // Setup routes
            this.setupRoutes();
            // Setup error handling
            this.setupErrorHandling();
            this.logger.info('✅ GAIP Integration Server initialized');
        }
        catch (error) {
            this.logger.error(`Failed to initialize server: ${error}`);
            throw error;
        }
    }
    setupExpressMiddleware() {
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: this.config.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-gaip-api-key', 'x-gaip-agent-id', 'x-gaip-session-id']
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
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
    setupRoutes() {
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
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.path,
                method: req.method
            });
        });
        // Error handler
        this.app.use((err, req, res, next) => {
            this.logger.error(`Server error: ${err.message}`);
            res.status(err.status || 500).json({
                error: err.message || 'Internal server error',
                timestamp: Date.now()
            });
        });
    }
    getServerStatus(req, res) {
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
    async resetServer(req, res) {
        try {
            // Reinitialize integration module
            await this.initialize();
            res.json({
                success: true,
                message: 'Server reset successfully',
                timestamp: Date.now()
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to reset server',
                details: error.message
            });
        }
    }
    getPrometheusMetrics(req, res) {
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
    getApiDocumentation(req, res) {
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
    async start() {
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
    async stop() {
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
    getApp() {
        return this.app;
    }
    /**
     * Get integration module
     */
    getIntegrationModule() {
        return this.integrationModule;
    }
}
exports.GAIPIntegrationServer = GAIPIntegrationServer;
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
//# sourceMappingURL=GAIPIntegrationServer.js.map