"use strict";
/**
 * GAIP Data Capture Middleware
 *
 * Express middleware for capturing and routing GAIP datapoints to the Aurigraph blockchain.
 * Provides REST API endpoints for GAIP agents to submit analysis data in real-time.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAIPDataCaptureMiddleware = void 0;
const express_1 = require("express");
const Logger_1 = require("../core/Logger");
const uuid_1 = require("uuid");
class GAIPDataCaptureMiddleware {
    logger;
    integrationModule;
    router;
    activeSessions = new Map();
    rateLimiter = new Map();
    constructor(integrationModule) {
        this.logger = new Logger_1.Logger('GAIPMiddleware');
        this.integrationModule = integrationModule;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        // Analysis management endpoints
        this.router.post('/analysis/start', this.authenticate, this.startAnalysis.bind(this));
        this.router.post('/analysis/:id/complete', this.authenticate, this.completeAnalysis.bind(this));
        this.router.get('/analysis/:id/status', this.authenticate, this.getAnalysisStatus.bind(this));
        // Datapoint capture endpoints
        this.router.post('/datapoint', this.authenticate, this.captureDatapoint.bind(this));
        this.router.post('/datapoints/batch', this.authenticate, this.captureBatch.bind(this));
        this.router.get('/datapoints', this.authenticate, this.queryDatapoints.bind(this));
        // Verification endpoints
        this.router.get('/verify/:datapointId', this.verifyDatapoint.bind(this));
        this.router.get('/analysis/:id/report', this.getAnalysisReport.bind(this));
        this.router.get('/analysis/:id/export', this.exportAnalysis.bind(this));
        // WebSocket endpoint for real-time streaming
        this.router.ws('/stream', this.handleWebSocketConnection.bind(this));
        // Health check
        this.router.get('/health', this.healthCheck.bind(this));
        // Metrics
        this.router.get('/metrics', this.getMetrics.bind(this));
    }
    /**
     * Authentication middleware
     */
    async authenticate(req, res, next) {
        const apiKey = req.headers['x-gaip-api-key'];
        const agentId = req.headers['x-gaip-agent-id'];
        if (!apiKey) {
            res.status(401).json({ error: 'API key required' });
            return;
        }
        // Validate API key (would check against actual GAIP auth service)
        const isValid = await this.validateApiKey(apiKey);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }
        // Check rate limiting
        if (this.isRateLimited(agentId || apiKey)) {
            res.status(429).json({ error: 'Rate limit exceeded' });
            return;
        }
        // Set context
        req.gaipContext = {
            agentId: agentId || 'unknown',
            sessionId: req.headers['x-gaip-session-id'] || (0, uuid_1.v4)(),
            authenticated: true
        };
        next();
    }
    /**
     * Start a new analysis capture session
     */
    async startAnalysis(req, res) {
        try {
            const { name, description, agents } = req.body;
            const analysisId = (0, uuid_1.v4)();
            await this.integrationModule.startAnalysisCapture(analysisId, name, description, agents || [{ id: req.gaipContext?.agentId, type: 'GAIP', role: 'ANALYZER', version: '1.0' }]);
            // Create session
            this.activeSessions.set(analysisId, {
                startTime: Date.now(),
                agentId: req.gaipContext?.agentId,
                datapointCount: 0
            });
            res.json({
                success: true,
                analysisId,
                message: 'Analysis capture started',
                timestamp: Date.now()
            });
            this.logger.info(`Analysis started: ${analysisId} by agent ${req.gaipContext?.agentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to start analysis: ${error}`);
            res.status(500).json({ error: 'Failed to start analysis' });
        }
    }
    /**
     * Complete an analysis
     */
    async completeAnalysis(req, res) {
        try {
            const { id } = req.params;
            const { results } = req.body;
            const transactionId = await this.integrationModule.completeAnalysis(id, results);
            // Clean up session
            this.activeSessions.delete(id);
            res.json({
                success: true,
                analysisId: id,
                transactionId,
                message: 'Analysis completed and recorded on blockchain',
                timestamp: Date.now()
            });
            this.logger.info(`Analysis completed: ${id}`);
        }
        catch (error) {
            this.logger.error(`Failed to complete analysis: ${error}`);
            res.status(500).json({ error: 'Failed to complete analysis' });
        }
    }
    /**
     * Get analysis status
     */
    async getAnalysisStatus(req, res) {
        try {
            const { id } = req.params;
            const session = this.activeSessions.get(id);
            if (!session) {
                res.status(404).json({ error: 'Analysis not found' });
                return;
            }
            res.json({
                analysisId: id,
                status: 'IN_PROGRESS',
                startTime: session.startTime,
                datapointCount: session.datapointCount,
                agentId: session.agentId
            });
        }
        catch (error) {
            this.logger.error(`Failed to get analysis status: ${error}`);
            res.status(500).json({ error: 'Failed to get analysis status' });
        }
    }
    /**
     * Capture a single datapoint
     */
    async captureDatapoint(req, res) {
        try {
            const datapoint = {
                id: (0, uuid_1.v4)(),
                timestamp: Date.now(),
                analysisId: req.body.analysisId,
                agentId: req.gaipContext?.agentId || 'unknown',
                dataType: req.body.dataType || 'INPUT',
                category: req.body.category || 'GENERAL',
                source: req.body.source || {
                    type: 'API',
                    identifier: 'gaip-middleware',
                    version: '1.0'
                },
                value: req.body.value,
                metadata: {
                    confidence: req.body.confidence,
                    accuracy: req.body.accuracy,
                    processingTime: req.body.processingTime,
                    transformations: req.body.transformations || [],
                    dependencies: req.body.dependencies || [],
                    validations: req.body.validations || []
                },
                privacy: {
                    level: req.body.privacyLevel || 'PUBLIC',
                    zkProof: req.body.zkProof || false,
                    encrypted: req.body.encrypted || false,
                    redacted: req.body.redacted || false
                },
                blockchain: {}
            };
            await this.integrationModule.captureDatapoint(datapoint);
            // Update session
            const session = this.activeSessions.get(datapoint.analysisId);
            if (session) {
                session.datapointCount++;
            }
            res.json({
                success: true,
                datapointId: datapoint.id,
                message: 'Datapoint captured',
                timestamp: datapoint.timestamp
            });
            this.logger.debug(`Datapoint captured: ${datapoint.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to capture datapoint: ${error}`);
            res.status(500).json({ error: 'Failed to capture datapoint' });
        }
    }
    /**
     * Capture batch of datapoints
     */
    async captureBatch(req, res) {
        try {
            const { analysisId, datapoints } = req.body;
            if (!Array.isArray(datapoints)) {
                res.status(400).json({ error: 'Datapoints must be an array' });
                return;
            }
            const capturedIds = [];
            for (const dpData of datapoints) {
                const datapoint = {
                    id: (0, uuid_1.v4)(),
                    timestamp: Date.now(),
                    analysisId,
                    agentId: req.gaipContext?.agentId || 'unknown',
                    ...dpData,
                    blockchain: {}
                };
                await this.integrationModule.captureDatapoint(datapoint);
                capturedIds.push(datapoint.id);
            }
            // Update session
            const session = this.activeSessions.get(analysisId);
            if (session) {
                session.datapointCount += datapoints.length;
            }
            res.json({
                success: true,
                count: capturedIds.length,
                datapointIds: capturedIds,
                message: 'Batch captured successfully',
                timestamp: Date.now()
            });
            this.logger.info(`Batch captured: ${capturedIds.length} datapoints`);
        }
        catch (error) {
            this.logger.error(`Failed to capture batch: ${error}`);
            res.status(500).json({ error: 'Failed to capture batch' });
        }
    }
    /**
     * Query datapoints
     */
    async queryDatapoints(req, res) {
        try {
            const filter = {
                analysisId: req.query.analysisId,
                agentId: req.query.agentId,
                dataType: req.query.dataType,
                startTime: req.query.startTime ? parseInt(req.query.startTime) : undefined,
                endTime: req.query.endTime ? parseInt(req.query.endTime) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : 100
            };
            const datapoints = await this.integrationModule.queryDatapoints(filter);
            res.json({
                success: true,
                count: datapoints.length,
                datapoints,
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error(`Failed to query datapoints: ${error}`);
            res.status(500).json({ error: 'Failed to query datapoints' });
        }
    }
    /**
     * Verify datapoint integrity
     */
    async verifyDatapoint(req, res) {
        try {
            const { datapointId } = req.params;
            const verification = await this.integrationModule.verifyDatapointIntegrity(datapointId);
            res.json({
                success: true,
                datapointId,
                verification,
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error(`Failed to verify datapoint: ${error}`);
            res.status(500).json({ error: 'Failed to verify datapoint' });
        }
    }
    /**
     * Get analysis report
     */
    async getAnalysisReport(req, res) {
        try {
            const { id } = req.params;
            const report = await this.integrationModule.generateAnalysisReport(id);
            res.json({
                success: true,
                analysisId: id,
                report,
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error(`Failed to generate report: ${error}`);
            res.status(500).json({ error: 'Failed to generate report' });
        }
    }
    /**
     * Export analysis data
     */
    async exportAnalysis(req, res) {
        try {
            const { id } = req.params;
            const format = req.query.format || 'JSON';
            const data = await this.integrationModule.exportAnalysisData(id, format);
            if (format === 'CSV') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="analysis-${id}.csv"`);
            }
            else {
                res.setHeader('Content-Type', 'application/json');
            }
            res.send(data);
        }
        catch (error) {
            this.logger.error(`Failed to export analysis: ${error}`);
            res.status(500).json({ error: 'Failed to export analysis' });
        }
    }
    /**
     * Handle WebSocket connections for real-time streaming
     */
    handleWebSocketConnection(ws, req) {
        const sessionId = (0, uuid_1.v4)();
        this.logger.info(`WebSocket connection established: ${sessionId}`);
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                switch (data.type) {
                    case 'START_ANALYSIS':
                        await this.handleStreamStartAnalysis(ws, data);
                        break;
                    case 'DATAPOINT':
                        await this.handleStreamDatapoint(ws, data);
                        break;
                    case 'COMPLETE_ANALYSIS':
                        await this.handleStreamCompleteAnalysis(ws, data);
                        break;
                    default:
                        ws.send(JSON.stringify({ error: 'Unknown message type' }));
                }
            }
            catch (error) {
                this.logger.error(`WebSocket error: ${error}`);
                ws.send(JSON.stringify({ error: 'Processing error' }));
            }
        });
        ws.on('close', () => {
            this.logger.info(`WebSocket connection closed: ${sessionId}`);
        });
    }
    async handleStreamStartAnalysis(ws, data) {
        const analysisId = (0, uuid_1.v4)();
        await this.integrationModule.startAnalysisCapture(analysisId, data.name, data.description, data.agents);
        ws.send(JSON.stringify({
            type: 'ANALYSIS_STARTED',
            analysisId,
            timestamp: Date.now()
        }));
    }
    async handleStreamDatapoint(ws, data) {
        const datapoint = {
            id: (0, uuid_1.v4)(),
            timestamp: Date.now(),
            ...data.datapoint,
            blockchain: {}
        };
        await this.integrationModule.captureDatapoint(datapoint);
        ws.send(JSON.stringify({
            type: 'DATAPOINT_CAPTURED',
            datapointId: datapoint.id,
            timestamp: Date.now()
        }));
    }
    async handleStreamCompleteAnalysis(ws, data) {
        const transactionId = await this.integrationModule.completeAnalysis(data.analysisId, data.results);
        ws.send(JSON.stringify({
            type: 'ANALYSIS_COMPLETED',
            analysisId: data.analysisId,
            transactionId,
            timestamp: Date.now()
        }));
    }
    /**
     * Health check endpoint
     */
    healthCheck(req, res) {
        res.json({
            status: 'healthy',
            service: 'GAIP-Aurigraph Integration',
            activeSessions: this.activeSessions.size,
            timestamp: Date.now()
        });
    }
    /**
     * Get metrics
     */
    getMetrics(req, res) {
        const metrics = this.integrationModule.getMetrics();
        res.json({
            metrics: Object.fromEntries(metrics),
            activeSessions: this.activeSessions.size,
            timestamp: Date.now()
        });
    }
    /**
     * Validate API key
     */
    async validateApiKey(apiKey) {
        // In production, this would validate against GAIP auth service
        // For now, we'll accept any non-empty key
        return apiKey && apiKey.length > 0;
    }
    /**
     * Check rate limiting
     */
    isRateLimited(identifier) {
        const now = Date.now();
        const lastRequest = this.rateLimiter.get(identifier) || 0;
        if (now - lastRequest < 100) { // 100ms between requests
            return true;
        }
        this.rateLimiter.set(identifier, now);
        return false;
    }
    /**
     * Get Express router
     */
    getRouter() {
        return this.router;
    }
}
exports.GAIPDataCaptureMiddleware = GAIPDataCaptureMiddleware;
//# sourceMappingURL=GAIPDataCaptureMiddleware.js.map