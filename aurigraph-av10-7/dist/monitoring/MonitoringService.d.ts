import { EventEmitter } from 'events';
export declare class MonitoringService extends EventEmitter {
    private logger;
    private metrics;
    constructor();
    start(): Promise<void>;
    private initializePrometheusMetrics;
    private setupOpenTelemetry;
    private startMetricsCollection;
    private collectMetrics;
    recordTransaction(tx: any): void;
    recordBlock(block: any): void;
    getMetrics(): any;
    stop(): Promise<void>;
}
//# sourceMappingURL=MonitoringService.d.ts.map