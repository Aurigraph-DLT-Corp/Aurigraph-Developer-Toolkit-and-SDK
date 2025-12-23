export declare class VizorRealtimeDashboard {
    private logger;
    private app;
    private server;
    private wss;
    private clients;
    private metricsInterval;
    private transactionInterval;
    private currentMetrics;
    private transactions;
    private nodes;
    private blockchainData;
    constructor();
    private initializeMetrics;
    private initializeNodes;
    private setupRoutes;
    private getDashboardHTML;
    private generateTransaction;
    private updateMetrics;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=VizorRealtimeDashboard.d.ts.map