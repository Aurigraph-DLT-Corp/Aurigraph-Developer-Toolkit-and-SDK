/**
 * Aurigraph V10 - gRPC Client for Testing
 */
import * as grpc from '@grpc/grpc-js';
/**
 * gRPC Client for testing Aurigraph services
 */
export declare class AurigraphGrpcClient {
    private client;
    private healthClient;
    private quantumClient;
    private aiClient;
    private bridgeClient;
    constructor(serverAddress?: string);
    private createClientCredentials;
    /**
     * Test health endpoint
     */
    getHealth(): Promise<any>;
    /**
     * Test metrics endpoint
     */
    getMetrics(metricNames?: string[]): Promise<any>;
    /**
     * Submit a test transaction
     */
    submitTransaction(txData: {
        from?: string;
        to?: string;
        amount?: number;
        type?: string;
    }): Promise<any>;
    /**
     * Submit batch transactions
     */
    submitBatchTransactions(count?: number): Promise<any>;
    /**
     * Subscribe to blocks (streaming)
     */
    subscribeBlocks(fromBlock?: number): grpc.ClientReadableStream<any>;
    /**
     * Test quantum key generation
     */
    generateQuantumKeyPair(algorithm?: string): Promise<any>;
    /**
     * Submit AI task
     */
    submitAITask(taskType?: string): Promise<any>;
    /**
     * Stream AI task updates
     */
    streamTaskUpdates(taskId: string): grpc.ClientReadableStream<any>;
    /**
     * Test cross-chain bridge
     */
    initiateBridge(sourceChain?: string, targetChain?: string): Promise<any>;
    /**
     * List supported chains
     */
    listSupportedChains(): Promise<any>;
    /**
     * Close all connections
     */
    close(): void;
}
/**
 * Test runner for gRPC client
 */
export declare function runGrpcTests(): Promise<void>;
//# sourceMappingURL=client.d.ts.map