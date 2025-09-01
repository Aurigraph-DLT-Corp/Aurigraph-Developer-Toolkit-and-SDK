import { EventEmitter } from 'events';
export interface NodeStatus {
    nodeId: string;
    version: string;
    status: 'initializing' | 'running' | 'syncing' | 'stopped';
    consensusRole: 'leader' | 'follower' | 'candidate';
    performance: {
        tps: number;
        peakTps: number;
        latency: number;
        uptime: number;
    };
    network: {
        peers: number;
        chains: number;
        bandwidth: number;
    };
    security: {
        level: number;
        zkProofsEnabled: boolean;
        quantumSecure: boolean;
    };
}
export declare class AV10Node extends EventEmitter {
    private logger;
    private status;
    private startTime;
    private configManager;
    private consensus;
    private quantumCrypto;
    private zkProofSystem;
    private crossChainBridge;
    private aiOptimizer;
    private networkOrchestrator;
    private monitoringService;
    constructor();
    start(): Promise<void>;
    private generateNodeId;
    private initializeConsensus;
    private startTransactionProcessing;
    private processPendingTransactions;
    private processBlock;
    private storeBlock;
    private updateCrossChainState;
    private setupEventHandlers;
    private startPerformanceMonitoring;
    private updateStatus;
    private updatePerformanceMetrics;
    private logPerformance;
    submitTransaction(transaction: any): Promise<any>;
    bridgeAsset(params: any): Promise<any>;
    getStatus(): NodeStatus;
    getMetrics(): Promise<any>;
    stop(): Promise<void>;
}
//# sourceMappingURL=AV10Node.d.ts.map