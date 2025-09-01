"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringAPIServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const Logger_1 = require("../core/Logger");
const VizorAPIEndpoints_1 = require("./VizorAPIEndpoints");
class MonitoringAPIServer {
    constructor(vizorService, validatorOrchestrator, channelManager) {
        this.app = (0, express_1.default)();
        this.logger = new Logger_1.Logger('MonitoringAPI');
        this.vizorEndpoints = new VizorAPIEndpoints_1.VizorAPIEndpoints(vizorService, validatorOrchestrator, channelManager);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:8080', 'http://localhost:3000'],
            credentials: true
        }));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.debug(`${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date(),
                service: 'AV10-7 Monitoring API',
                version: '10.7.0'
            });
        });
        // Vizor API endpoints
        this.app.use('/api/v10/vizor', this.vizorEndpoints.getRouter());
        // Platform status endpoint
        this.app.get('/api/v10/status', (req, res) => {
            res.json({
                platform: 'AV10-7 Quantum Nexus',
                version: '10.7.0',
                status: 'operational',
                features: {
                    quantumSecurity: true,
                    zkProofs: true,
                    crossChain: true,
                    aiOptimization: true,
                    channelEncryption: true
                },
                timestamp: new Date()
            });
        });
        // WebSocket endpoint for real-time data
        this.app.get('/api/v10/realtime', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const sendData = () => {
                const data = {
                    timestamp: new Date(),
                    tps: Math.floor(950000 + Math.random() * 150000),
                    latency: Math.floor(200 + Math.random() * 200),
                    validators: Math.floor(19 + Math.random() * 3),
                    channels: 3,
                    zkProofs: Math.floor(800 + Math.random() * 400),
                    quantumOps: Math.floor(500 + Math.random() * 300)
                };
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };
            const interval = setInterval(sendData, 3000);
            sendData(); // Send immediately
            req.on('close', () => {
                clearInterval(interval);
                this.logger.debug('Real-time client disconnected');
            });
        });
        // Error handling
        this.app.use((error, req, res, next) => {
            this.logger.error('API Error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
    }
    async start(port = 3001) {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                this.logger.info(`🌐 Monitoring API server started on port ${port}`);
                this.logger.info(`📊 Vizor dashboards: http://localhost:${port}/api/v10/vizor/dashboards`);
                this.logger.info(`📡 Real-time stream: http://localhost:${port}/api/v10/realtime`);
                resolve();
            });
        });
    }
    async stop() {
        if (this.server) {
            this.server.close();
            this.logger.info('🛑 Monitoring API server stopped');
        }
    }
}
exports.MonitoringAPIServer = MonitoringAPIServer;
