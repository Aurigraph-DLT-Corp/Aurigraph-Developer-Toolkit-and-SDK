import 'reflect-metadata';
declare class AV18Platform {
    private logger;
    private container;
    private av18Node;
    private monitoringAPI;
    private complianceEngine;
    private isRunning;
    constructor();
    private setupDependencyInjection;
    initialize(): Promise<void>;
    private initializeCoreServices;
    private initializeComplianceEngine;
    start(): Promise<void>;
    private displayStartupInfo;
    private startRealTimeMonitoring;
    private displayRealTimeMetrics;
    stop(): Promise<void>;
    private cleanup;
    getStatus(): any;
    generateStatusReport(): Promise<any>;
}
export { AV18Platform };
//# sourceMappingURL=index-av18.d.ts.map