import { EventEmitter } from 'events';
export declare class AIOptimizer extends EventEmitter {
    private logger;
    private models;
    private optimizationEnabled;
    private isRunning;
    private optimizationInterval;
    constructor();
    start(): Promise<void>;
    private loadModels;
    private startOptimizationLoop;
    private performOptimization;
    private collectMetrics;
    private optimizeLatency;
    private optimizeZKProofs;
    optimizeConsensusParameters(params: any): Promise<any>;
    predictBestLeader(validators: string[], metrics: any): Promise<any>;
    analyzePerformance(metrics: any): Promise<any>;
    enablePredictiveOrdering(): Promise<void>;
    getMetrics(): Promise<any>;
    stop(): Promise<void>;
    isOptimizationEnabled(): boolean;
}
//# sourceMappingURL=AIOptimizer.d.ts.map