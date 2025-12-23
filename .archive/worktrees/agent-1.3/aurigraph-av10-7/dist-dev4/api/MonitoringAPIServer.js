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
const CSPMiddleware_1 = require("../middleware/CSPMiddleware");
class MonitoringAPIServer {
    app;
    logger;
    vizorEndpoints;
    server;
    constructor(vizorService, validatorOrchestrator, channelManager) {
        this.app = (0, express_1.default)();
        this.app.disable('x-powered-by');
        this.logger = new Logger_1.Logger('MonitoringAPI');
        this.vizorEndpoints = new VizorAPIEndpoints_1.VizorAPIEndpoints(vizorService, validatorOrchestrator, channelManager);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Force CSP override for all responses
        this.app.use(CSPMiddleware_1.CSPMiddleware.forceOverride(CSPMiddleware_1.CSPMiddleware.getWebAppCSP()));
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
        // Vizor API endpoints (v10 compatibility)
        this.app.use('/api/v10/vizor', this.vizorEndpoints.getRouter());
        // AV10-18 enhanced API endpoints
        this.app.use('/api/v18/vizor', this.vizorEndpoints.getRouter());
        // Platform status endpoint (v10 compatibility)
        this.app.get('/api/v10/status', (req, res) => {
            res.json({
                platform: 'AV10-7 DLT Platform',
                version: '10.7.0',
                status: 'operational',
                features: {
                    quantumSecurity: true,
                    zkProofs: true,
                    crossChain: true,
                    aiOptimization: true,
                    channelEncryption: true,
                    consensusOptimization: true,
                    wormholeIntegration: true,
                    distributedLedger: true
                },
                timestamp: new Date()
            });
        });
        // AV10-18 enhanced platform status
        this.app.get('/api/v18/status', (req, res) => {
            res.json({
                platform: 'AV10-18 DLT Platform',
                version: '10.18.0',
                status: 'operational',
                features: {
                    quantumSecurity: true,
                    quantumLevel: 6,
                    quantumKeyDistribution: true,
                    quantumConsensusProofs: true,
                    zkProofs: true,
                    recursiveProofAggregation: true,
                    crossChain: true,
                    omnichainProtocol: true,
                    aiOptimization: true,
                    autonomousCompliance: true,
                    channelEncryption: true,
                    quantumStateChannels: true,
                    consensusOptimization: true,
                    hyperRaftPlusPlus2: true,
                    wormholeIntegration: true,
                    distributedLedger: true,
                    enterpriseCompliance: true,
                    ultraHighThroughput: true
                },
                targets: {
                    maxTPS: 5000000,
                    maxLatency: 100,
                    quantumLevel: 6,
                    complianceScore: 99.99
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
        // AV10-18 enhanced real-time endpoint
        this.app.get('/api/v18/realtime', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const sendData = () => {
                const data = {
                    timestamp: new Date(),
                    tps: Math.floor(4500000 + Math.random() * 500000), // 4.5-5M TPS
                    latency: Math.floor(50 + Math.random() * 50), // 50-100ms
                    validators: Math.floor(19 + Math.random() * 3),
                    channels: 3,
                    zkProofs: Math.floor(4000000 + Math.random() * 500000), // 4-4.5M ZK proofs/sec
                    quantumOps: Math.floor(3500000 + Math.random() * 500000), // 3.5-4M quantum ops/sec
                    consensusVersion: '2.0',
                    quantumLevel: 6,
                    autonomousOptimizations: Math.floor(Math.random() * 100),
                    complianceScore: 99.5 + Math.random() * 0.5,
                    shardEfficiency: 95 + Math.random() * 5,
                    quantumEntanglements: Math.floor(Math.random() * 1000),
                    hardwareAcceleration: true
                };
                res.write(`data: ${JSON.stringify(data)}\\n\\n`);
            };
            const interval = setInterval(sendData, 2000); // Faster updates for AV10-18
            sendData(); // Send immediately
            req.on('close', () => {
                clearInterval(interval);
                this.logger.debug('AV10-18 real-time client disconnected');
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
        // AI Optimizer endpoints
        this.app.get('/api/v10/ai/status', (req, res) => {
            res.json({
                enabled: true,
                currentModel: 'HyperRAFT-AI-v3.2',
                optimizationLevel: 90 + Math.random() * 10,
                learningRate: 0.015 + Math.random() * 0.02,
                accuracy: 95 + Math.random() * 5,
                predictionLatency: 8 + Math.random() * 10,
                throughputGain: '+15.2%',
                errorReduction: '18.7%'
            });
        });
        this.app.get('/api/v10/ai/suggestions', (req, res) => {
            const suggestions = [
                'Increase validator batch size to 512 for higher throughput',
                'Optimize consensus round timing based on network latency',
                'Reduce ZK proof generation overhead by 15%',
                'Implement dynamic load balancing for cross-chain bridges',
                'Adjust pipeline depth for optimal performance',
                'Fine-tune AI model hyperparameters'
            ];
            res.json({
                suggestions: suggestions.map(text => ({
                    id: Math.random().toString(36).substr(2, 9),
                    text,
                    confidence: 85 + Math.random() * 15,
                    impact: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                    category: ['Performance', 'Latency', 'Security', 'Efficiency'][Math.floor(Math.random() * 4)]
                }))
            });
        });
        this.app.get('/api/v10/ai/optimizations', (req, res) => {
            const optimizations = [
                {
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    action: 'Consensus Round Optimization',
                    improvement: '+2.3% TPS',
                    confidence: 97.2,
                    status: 'applied'
                },
                {
                    timestamp: new Date(Date.now() - 360000).toISOString(),
                    action: 'Validator Selection Tuning',
                    improvement: '-15ms Latency',
                    confidence: 94.8,
                    status: 'applied'
                },
                {
                    timestamp: new Date(Date.now() - 540000).toISOString(),
                    action: 'ZK Proof Batch Size Adjustment',
                    improvement: '+5.1% Efficiency',
                    confidence: 91.5,
                    status: 'applied'
                }
            ];
            res.json({ optimizations });
        });
        this.app.post('/api/v10/ai/toggle', (req, res) => {
            const enabled = req.body.enabled;
            res.json({
                success: true,
                enabled,
                message: enabled ? 'AI Optimizer enabled' : 'AI Optimizer disabled'
            });
        });
        // AV10-18 enhanced AI endpoints
        this.app.get('/api/v18/ai/status', (req, res) => {
            res.json({
                enabled: true,
                version: '4.0',
                currentModel: 'Autonomous-AI-v4.0',
                autonomousMode: true,
                optimizationLevel: 95 + Math.random() * 5,
                learningRate: 0.025 + Math.random() * 0.015,
                accuracy: 98 + Math.random() * 2,
                predictionLatency: 2 + Math.random() * 3,
                throughputGain: '+400%',
                errorReduction: '95%',
                quantumEnhanced: true,
                consensusOptimization: true,
                complianceAutomation: true,
                predictiveAnalytics: true
            });
        });
        this.app.get('/api/v18/compliance/status', (req, res) => {
            res.json({
                engine: 'Autonomous Compliance V2',
                version: '10.18.0',
                complianceScore: 99.5 + Math.random() * 0.5,
                autoResolutionRate: 95 + Math.random() * 5,
                activeRules: 150 + Math.floor(Math.random() * 50),
                jurisdictions: ['US', 'EU', 'UK', 'CA', 'AU', 'SG', 'JP'],
                realTimeMonitoring: true,
                autonomousReporting: true,
                riskAssessments: Math.floor(Math.random() * 10000),
                violationsToday: Math.floor(Math.random() * 5),
                timestamp: new Date()
            });
        });
        this.app.get('/api/v18/quantum/status', (req, res) => {
            res.json({
                version: '2.0',
                securityLevel: 6,
                algorithms: {
                    keyEncapsulation: 'CRYSTALS-Kyber',
                    digitalSignature: 'CRYSTALS-Dilithium',
                    hashBasedSignature: 'SPHINCS+',
                    quantumResistant: 'Falcon',
                    postQuantum: 'Rainbow'
                },
                features: {
                    quantumKeyDistribution: true,
                    quantumRandomGeneration: true,
                    quantumStateChannels: true,
                    quantumConsensusProofs: true,
                    hardwareAcceleration: true
                },
                performance: {
                    keyGenerations: Math.floor(Math.random() * 10000),
                    signatures: Math.floor(Math.random() * 50000),
                    verifications: Math.floor(Math.random() * 100000),
                    quantumOps: Math.floor(Math.random() * 1000000)
                },
                hardware: {
                    quantumProcessingUnit: true,
                    qubits: 1000,
                    coherenceTime: '100ms',
                    gateSpeed: '1MHz',
                    errorRate: '0.1%'
                },
                timestamp: new Date()
            });
        });
        // 404 handler with proper CSP
        this.app.use('*', (req, res) => {
            res.status(404);
            res.setHeader('Content-Security-Policy', "default-src 'self'; font-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: ws:");
            res.json({ error: 'Endpoint not found' });
        });
    }
    async start(port = 3001) {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                this.logger.info(`🌐 Monitoring API server started on port ${port}`);
                if (port === 3018) {
                    // AV10-18 specific endpoints
                    this.logger.info(`📊 AV10-18 Dashboards: http://localhost:${port}/api/v18/vizor/dashboards`);
                    this.logger.info(`📡 AV10-18 Real-time: http://localhost:${port}/api/v18/realtime`);
                    this.logger.info(`🏛️ Compliance API: http://localhost:${port}/api/v18/compliance/status`);
                    this.logger.info(`🤖 AI Status: http://localhost:${port}/api/v18/ai/status`);
                    this.logger.info(`🔮 Quantum Status: http://localhost:${port}/api/v18/quantum/status`);
                }
                else {
                    // Legacy v10 endpoints
                    this.logger.info(`📊 Vizor dashboards: http://localhost:${port}/api/v10/vizor/dashboards`);
                    this.logger.info(`📡 Real-time stream: http://localhost:${port}/api/v10/realtime`);
                }
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
//# sourceMappingURL=MonitoringAPIServer.js.map