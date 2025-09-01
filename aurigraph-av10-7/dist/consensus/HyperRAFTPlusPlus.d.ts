import { EventEmitter } from 'events';
import { QuantumCryptoManager } from '../crypto/QuantumCryptoManager';
import { ZKProofSystem } from '../zk/ZKProofSystem';
import { AIOptimizer } from '../ai/AIOptimizer';
export interface ConsensusConfig {
    nodeId: string;
    validators: string[];
    electionTimeout: number;
    heartbeatInterval: number;
    batchSize: number;
    pipelineDepth: number;
    parallelThreads: number;
    zkProofsEnabled: boolean;
    aiOptimizationEnabled: boolean;
    quantumSecure: boolean;
}
export interface ConsensusState {
    term: number;
    leader: string | null;
    state: 'follower' | 'candidate' | 'leader';
    commitIndex: number;
    lastApplied: number;
    throughput: number;
    latency: number;
}
export interface Transaction {
    id: string;
    hash: string;
    data: any;
    timestamp: number;
    zkProof?: any;
    signature?: string;
}
export interface Block {
    height: number;
    hash: string;
    previousHash: string;
    transactions: Transaction[];
    timestamp: number;
    validator: string;
    consensusProof: any;
    zkAggregateProof?: any;
}
export declare class HyperRAFTPlusPlus extends EventEmitter {
    private logger;
    private config;
    private state;
    private quantumCrypto;
    private zkProofSystem;
    private aiOptimizer;
    private transactionPool;
    private executionThreads;
    private pipelineStages;
    private performanceMetrics;
    private adaptiveTimeout;
    private predictiveLeaderElection;
    private parallelValidation;
    private recursiveProofAggregation;
    constructor(config: ConsensusConfig, quantumCrypto: QuantumCryptoManager, zkProofSystem: ZKProofSystem, aiOptimizer: AIOptimizer);
    initialize(): Promise<void>;
    private initializeExecutionThreads;
    private setupPipelineStages;
    private initializeAIOptimization;
    private startConsensus;
    private becomeFollower;
    private becomeLeader;
    private initializeLeaderOptimizations;
    private startElectionTimer;
    private startElection;
    private requestVotes;
    private startHeartbeat;
    private sendHeartbeat;
    processTransactionBatch(transactions: Transaction[]): Promise<Block>;
    private validateTransactions;
    private validateSingleTransaction;
    private generateZKProofs;
    private executeTransactions;
    private executeTransactionChunk;
    private commitState;
    private aggregateProofs;
    private calculateBlockHash;
    private calculateMerkleRoot;
    private updatePerformanceMetrics;
    private startPerformanceMonitoring;
    private optimizePerformance;
    stop(): Promise<void>;
    getMetrics(): any;
}
//# sourceMappingURL=HyperRAFTPlusPlus.d.ts.map