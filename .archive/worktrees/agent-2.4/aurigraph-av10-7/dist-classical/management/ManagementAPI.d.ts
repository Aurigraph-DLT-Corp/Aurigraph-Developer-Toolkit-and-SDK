export declare class ManagementAPI {
    private logger;
    private app;
    private server;
    private wss;
    private channelManager;
    private clients;
    private demoActive;
    private demoInterval;
    private demoStats;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private startDemo;
    private stopDemo;
    private getDemoStats;
    private getManagementDashboardHTML;
    start(port?: number): Promise<void>;
    private broadcast;
    stop(): Promise<void>;
}
//# sourceMappingURL=ManagementAPI.d.ts.map