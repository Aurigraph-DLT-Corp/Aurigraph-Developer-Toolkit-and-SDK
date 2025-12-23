export declare class AurigraphRWAPlatform {
    private app;
    private assetRegistry;
    private auditManager;
    private reportingEngine;
    private multiAssetManager;
    private complianceEngine;
    private mcpServer;
    private mcpRouter;
    private port;
    constructor(port?: number);
    private initializeComponents;
    private setupMiddleware;
    private setupRoutes;
    private initializePlatformData;
    start(): Promise<void>;
    stop(): Promise<void>;
    getComponents(): any;
}
//# sourceMappingURL=index-rwa.d.ts.map