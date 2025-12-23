"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const MCPInterface_1 = require("./MCPInterface");
const ReportingEngine_1 = require("../reporting/ReportingEngine");
class MCPServer {
    app;
    mcpInterface;
    reportingEngine;
    port;
    constructor(assetRegistry, auditManager, multiAssetManager, port = 3020) {
        this.app = (0, express_1.default)();
        this.port = port;
        this.mcpInterface = new MCPInterface_1.MCPInterface(assetRegistry, auditManager);
        this.reportingEngine = new ReportingEngine_1.ReportingEngine(auditManager, assetRegistry, multiAssetManager);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:3000', 'https://dashboard.aurigraph.io'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-ID', 'X-Signature']
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 60 * 1000, // 1 minute
            max: 100, // 100 requests per minute per IP
            message: {
                error: {
                    code: 429,
                    message: 'Rate limit exceeded. Please try again later.'
                }
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/rwa/v2', limiter);
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
        // Security headers
        this.app.use((req, res, next) => {
            res.header('X-Content-Type-Options', 'nosniff');
            res.header('X-Frame-Options', 'DENY');
            res.header('X-XSS-Protection', '1; mode=block');
            res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:;");
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: Date.now(),
                version: '2.0.0',
                uptime: process.uptime()
            });
        });
        // API documentation
        this.app.get('/api/rwa/v2/docs', (req, res) => {
            res.json(this.mcpInterface.getAPIDocumentation());
        });
        // MCP request endpoint
        this.app.post('/api/rwa/v2/request', async (req, res) => {
            try {
                const mcpRequest = {
                    id: req.body.id || require('crypto').randomUUID(),
                    method: req.body.method,
                    params: req.body.params || {},
                    apiKey: req.headers['x-api-key'] || req.body.apiKey,
                    timestamp: req.body.timestamp || Date.now(),
                    signature: req.headers['x-signature'] || req.body.signature,
                    version: req.body.version || '2.0',
                    clientId: req.headers['x-client-id'] || req.body.clientId
                };
                const response = await this.mcpInterface.processRequest(mcpRequest);
                res.status(response.error ? 400 : 200).json(response);
            }
            catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Internal server error'
                    },
                    timestamp: Date.now()
                });
            }
        });
        // Batch request endpoint
        this.app.post('/api/rwa/v2/batch', async (req, res) => {
            try {
                const requests = req.body.requests;
                if (!Array.isArray(requests) || requests.length === 0) {
                    return res.status(400).json({
                        error: {
                            code: 400,
                            message: 'Invalid batch request format'
                        }
                    });
                }
                if (requests.length > 10) {
                    return res.status(400).json({
                        error: {
                            code: 400,
                            message: 'Batch size cannot exceed 10 requests'
                        }
                    });
                }
                const responses = await Promise.all(requests.map(request => this.mcpInterface.processRequest(request)));
                res.json({
                    responses,
                    timestamp: Date.now(),
                    batchSize: requests.length
                });
            }
            catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Batch processing error'
                    }
                });
            }
        });
        // WebSocket endpoint for real-time updates
        this.app.get('/api/rwa/v2/ws', (req, res) => {
            res.json({
                message: 'WebSocket endpoint for real-time MCP updates',
                upgrade: 'ws://localhost:' + this.port + '/api/rwa/v2/stream',
                protocols: ['aurigraph-mcp-v2']
            });
        });
        // Client statistics endpoint
        this.app.get('/api/rwa/v2/clients/:clientId?/statistics', async (req, res) => {
            try {
                const clientId = req.params.clientId;
                const statistics = await this.mcpInterface.getClientStatistics(clientId);
                res.json(statistics);
            }
            catch (error) {
                res.status(404).json({
                    error: {
                        code: 404,
                        message: error instanceof Error ? error.message : 'Client not found'
                    }
                });
            }
        });
        // Dashboard metrics endpoint
        this.app.get('/api/rwa/v2/dashboard/metrics', async (req, res) => {
            try {
                const metrics = await this.reportingEngine.getDashboardMetrics();
                res.json(metrics);
            }
            catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Failed to get metrics'
                    }
                });
            }
        });
        // Asset class capabilities endpoint
        this.app.get('/api/rwa/v2/capabilities', async (req, res) => {
            res.json({
                supportedAssetClasses: [
                    'REAL_ESTATE',
                    'CARBON_CREDITS',
                    'COMMODITIES',
                    'INTELLECTUAL_PROPERTY',
                    'ART_COLLECTIBLES',
                    'INFRASTRUCTURE'
                ],
                tokenizationModels: [
                    'fractional',
                    'digitalTwin',
                    'compound',
                    'yieldBearing'
                ],
                supportedJurisdictions: ['US', 'EU', 'SG', 'UK', 'CA'],
                complianceFrameworks: ['SEC', 'MiCA', 'MAS', 'FCA', 'CSA'],
                features: {
                    realTimeMonitoring: true,
                    crossJurisdictionCompliance: true,
                    aiOptimization: true,
                    digitalTwins: true,
                    fractionalOwnership: true,
                    yieldGeneration: true,
                    auditTrail: true,
                    regulatoryReporting: true
                },
                limits: {
                    maxAssetValue: 1000000000, // $1B
                    maxTokenSupply: 1000000000,
                    maxAssetsPerClient: 10000,
                    maxTokenizationsPerDay: 1000
                }
            });
        });
        // Client registration endpoint (admin only)
        this.app.post('/api/rwa/v2/admin/clients/register', async (req, res) => {
            try {
                // In production, this would require admin authentication
                const registration = await this.mcpInterface.registerClient({
                    name: req.body.name,
                    permissions: req.body.permissions,
                    compliance: req.body.compliance
                });
                res.json({
                    clientId: registration.clientId,
                    apiKey: registration.apiKey,
                    publicKey: registration.publicKey,
                    status: 'REGISTERED'
                });
            }
            catch (error) {
                res.status(400).json({
                    error: {
                        code: 400,
                        message: error instanceof Error ? error.message : 'Registration failed'
                    }
                });
            }
        });
        // Error handling middleware
        this.app.use((error, req, res, next) => {
            console.error('MCP Server Error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: 'Internal server error',
                        requestId: req.headers['x-request-id'] || 'unknown'
                    },
                    timestamp: Date.now()
                });
            }
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: {
                    code: 404,
                    message: 'Endpoint not found',
                    path: req.originalUrl
                },
                timestamp: Date.now()
            });
        });
    }
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🚀 Aurigraph RWA MCP Server started on port ${this.port}`);
                console.log(`📚 API Documentation: http://localhost:${this.port}/api/rwa/v2/docs`);
                console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
                console.log(`🔌 MCP Endpoint: http://localhost:${this.port}/api/rwa/v2/request`);
                resolve();
            });
        });
    }
    async stop() {
        // Graceful shutdown logic would go here
        console.log('🛑 MCP Server shutting down gracefully...');
    }
    getServerStats() {
        return {
            port: this.port,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            activeConnections: 0, // Would track WebSocket connections
            requestsProcessed: 0, // Would track from audit logs
            lastStartup: Date.now() - (process.uptime() * 1000)
        };
    }
}
exports.MCPServer = MCPServer;
//# sourceMappingURL=MCPServer.js.map