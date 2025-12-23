/**
 * GAIP Data Capture Middleware
 *
 * Express middleware for capturing and routing GAIP datapoints to the Aurigraph blockchain.
 * Provides REST API endpoints for GAIP agents to submit analysis data in real-time.
 */
import { Request, Router } from 'express';
import { GAIPIntegrationModule } from './GAIPIntegrationModule';
export interface GAIPRequest extends Request {
    gaipContext?: {
        analysisId?: string;
        agentId?: string;
        sessionId?: string;
        authenticated?: boolean;
    };
}
export declare class GAIPDataCaptureMiddleware {
    private logger;
    private integrationModule;
    private router;
    private activeSessions;
    private rateLimiter;
    constructor(integrationModule: GAIPIntegrationModule);
    private setupRoutes;
    /**
     * Authentication middleware
     */
    private authenticate;
    /**
     * Start a new analysis capture session
     */
    private startAnalysis;
    /**
     * Complete an analysis
     */
    private completeAnalysis;
    /**
     * Get analysis status
     */
    private getAnalysisStatus;
    /**
     * Capture a single datapoint
     */
    private captureDatapoint;
    /**
     * Capture batch of datapoints
     */
    private captureBatch;
    /**
     * Query datapoints
     */
    private queryDatapoints;
    /**
     * Verify datapoint integrity
     */
    private verifyDatapoint;
    /**
     * Get analysis report
     */
    private getAnalysisReport;
    /**
     * Export analysis data
     */
    private exportAnalysis;
    /**
     * Handle WebSocket connections for real-time streaming
     */
    private handleWebSocketConnection;
    private handleStreamStartAnalysis;
    private handleStreamDatapoint;
    private handleStreamCompleteAnalysis;
    /**
     * Health check endpoint
     */
    private healthCheck;
    /**
     * Get metrics
     */
    private getMetrics;
    /**
     * Validate API key
     */
    private validateApiKey;
    /**
     * Check rate limiting
     */
    private isRateLimited;
    /**
     * Get Express router
     */
    getRouter(): Router;
}
//# sourceMappingURL=GAIPDataCaptureMiddleware.d.ts.map