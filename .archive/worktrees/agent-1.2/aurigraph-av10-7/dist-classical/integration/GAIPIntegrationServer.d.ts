/**
 * GAIP Integration Server
 *
 * Standalone server for GAIP-Aurigraph integration.
 * Provides REST API and WebSocket endpoints for GAIP agents to interact with Aurigraph blockchain.
 */
import { Application } from 'express';
import { GAIPIntegrationModule } from './GAIPIntegrationModule';
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
export declare class GAIPIntegrationServer {
    private app;
    private server;
    private logger;
    private integrationModule;
    private middleware;
    private config;
    private isRunning;
    constructor(config?: ServerConfig);
    private getDefaultConfig;
    private initialize;
    private setupExpressMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private getServerStatus;
    private resetServer;
    private getPrometheusMetrics;
    private getApiDocumentation;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    /**
     * Get server instance
     */
    getApp(): Application;
    /**
     * Get integration module
     */
    getIntegrationModule(): GAIPIntegrationModule;
}
//# sourceMappingURL=GAIPIntegrationServer.d.ts.map