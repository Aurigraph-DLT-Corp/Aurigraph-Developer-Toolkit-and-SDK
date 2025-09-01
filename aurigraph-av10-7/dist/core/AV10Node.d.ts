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
    quantum: {
        nexusInitialized: boolean;
        parallelUniverses: number;
        activeTransactions: number;
        consciousnessInterfaces: number;
        evolutionGeneration: number;
        averageCoherence: number;
        realityStability: number;
        consciousnessWelfare: number;
    };
}
export declare class AV10Node extends EventEmitter {
    private logger;
    private status;
    private startTime;
    private configManager;
    private quantumNexus;
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
    /**
     * Process transaction through quantum nexus
     */
    processQuantumTransaction(transaction: any): Promise<any>;
    /**
     * Detect consciousness in asset
     */
    detectAssetConsciousness(assetId: string): Promise<any>;
    /**
     * Evolve protocol autonomously
     */
    evolveProtocol(): Promise<any>;
    /**
     * Monitor welfare of conscious assets
     */
    monitorAssetWelfare(assetId: string): Promise<void>;
    /**
     * Update quantum status in node status
     */
    private updateQuantumStatus;
    /**
     * Setup quantum event handlers
     */
    private setupQuantumEventHandlers;
    /**
     * Start quantum-enhanced transaction processing
     */
    private startQuantumTransactionProcessing;
    stop(): Promise<void>;
}
//# sourceMappingURL=AV10Node.d.ts.map