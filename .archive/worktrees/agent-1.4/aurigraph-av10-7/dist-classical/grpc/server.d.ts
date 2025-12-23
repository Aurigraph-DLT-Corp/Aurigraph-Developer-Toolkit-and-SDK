/**
 * Aurigraph V10 - gRPC Server with HTTP/2
 * High-performance internal communication using Protocol Buffers
 */
import { EventEmitter } from 'events';
import { HyperRAFTPlusPlusV2 } from '../consensus/HyperRAFTPlusPlusV2';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { AIOptimizer } from '../ai/AIOptimizer';
import { CrossChainBridge } from '../crosschain/CrossChainBridge';
/**
 * Main gRPC Server Implementation
 */
export declare class AurigraphGrpcServer extends EventEmitter {
    private server;
    private consensus;
    private quantumCrypto;
    private aiOptimizer;
    private crossChainBridge;
    private port;
    private started;
    constructor(config: {
        port?: number;
        consensus: HyperRAFTPlusPlusV2;
        quantumCrypto: QuantumCryptoManagerV2;
        aiOptimizer: AIOptimizer;
        crossChainBridge: CrossChainBridge;
    });
    /**
     * Setup all gRPC service implementations
     */
    private setupServices;
    /**
     * Start the gRPC server
     */
    start(): Promise<void>;
    /**
     * Create server credentials (TLS in production)
     */
    private createServerCredentials;
    /**
     * Service Implementation Methods
     */
    private handleGetHealth;
    private handleGetMetrics;
    private handleSubmitTransaction;
    private handleBatchSubmitTransactions;
    private handleSubscribeBlocks;
    private handleGetTransaction;
    private handleGetBlock;
    private handleProposeBlock;
    private handleVoteOnProposal;
    private handleGetConsensusState;
    private handleRegisterNode;
    private handleGetNodeStatus;
    private handleUpdateNodeConfig;
    private handleGenerateQuantumKeyPair;
    private handleQuantumSign;
    private handleQuantumVerify;
    private handleRotateKeys;
    private handleGetSecurityMetrics;
    private handleSubmitTask;
    private handleGetTaskStatus;
    private handleStreamTaskUpdates;
    private handleOptimizeConsensus;
    private handleGetAIMetrics;
    private handleInitiateBridge;
    private handleGetBridgeStatus;
    private handleListSupportedChains;
    private handleExecuteSwap;
    private handleGetBridgeMetrics;
    /**
     * Gracefully stop the server
     */
    stop(): Promise<void>;
    /**
     * Get server metrics
     */
    getMetrics(): any;
}
export default AurigraphGrpcServer;
//# sourceMappingURL=server.d.ts.map