import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../consensus/HyperRAFTPlusPlusV2';
export interface DLTNodeConfig {
    nodeId: string;
    nodeType: 'VALIDATOR' | 'FULL' | 'LIGHT' | 'ARCHIVE' | 'BRIDGE';
    networkId: string;
    port: number;
    maxConnections: number;
    enableSharding: boolean;
    shardId?: string;
    consensusRole: 'LEADER' | 'FOLLOWER' | 'OBSERVER';
    quantumSecurity: boolean;
    storageType: 'MEMORY' | 'DISK' | 'DISTRIBUTED';
    resourceLimits: NodeResourceLimits;
}
export interface NodeResourceLimits {
    maxMemoryMB: number;
    maxDiskGB: number;
    maxCPUPercent: number;
    maxNetworkMBps: number;
    maxTransactionsPerSec: number;
}
export interface DLTNodeStatus {
    nodeId: string;
    status: 'STARTING' | 'SYNCING' | 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
    uptime: number;
    syncProgress: number;
    blockHeight: number;
    peerCount: number;
    transactionPool: number;
    resourceUsage: ResourceUsage;
    lastUpdate: Date;
}
export interface ResourceUsage {
    memoryUsageMB: number;
    diskUsageGB: number;
    cpuUsagePercent: number;
    networkUsageMBps: number;
    transactionsPerSec: number;
}
export interface PeerConnection {
    peerId: string;
    address: string;
    port: number;
    status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'BANNED';
    latency: number;
    lastSeen: Date;
    version: string;
}
export interface Transaction {
    id: string;
    from: string;
    to: string;
    amount: number;
    fee: number;
    data: any;
    signature: string;
    timestamp: Date;
    blockHeight?: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}
export interface Block {
    hash: string;
    previousHash: string;
    height: number;
    timestamp: Date;
    transactions: Transaction[];
    merkleRoot: string;
    stateRoot: string;
    validator: string;
    signature: string;
    gasUsed: number;
    gasLimit: number;
}
export declare class EnhancedDLTNode {
    private logger;
    private config;
    private status;
    private peers;
    private transactionPool;
    private blockchain;
    private cryptoManager;
    private consensus;
    private nodeMetrics;
    constructor(config: DLTNodeConfig, cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    initialize(): Promise<void>;
    processTransaction(transaction: Transaction): Promise<boolean>;
    createBlock(transactions: Transaction[]): Promise<Block>;
    connectToPeer(peerAddress: string, port: number): Promise<boolean>;
    syncWithNetwork(): Promise<void>;
    private initializeNetworking;
    private initializeStorage;
    private initializeSharding;
    private startConsensusParticipation;
    private validateTransaction;
    private calculateBlockHash;
    private calculateMerkleRoot;
    private calculateStateRoot;
    private calculateGasUsed;
    private syncWithPeer;
    private startResourceMonitoring;
    private checkResourceLimits;
    private startPeerDiscovery;
    private generateRandomPeerAddress;
    getStatus(): DLTNodeStatus;
    getConfig(): DLTNodeConfig;
    getPeers(): PeerConnection[];
    getTransactionPool(): Transaction[];
    getBlockchain(): Block[];
    getMetrics(): any;
    shutdown(): Promise<void>;
    enableSharding(shardId: string): Promise<void>;
    joinNetwork(networkId: string, bootstrapPeers: string[]): Promise<void>;
    upgradeNodeType(newType: DLTNodeConfig['nodeType']): Promise<void>;
    enableCrossChainBridge(): Promise<void>;
    enableQuantumFeatures(): Promise<void>;
    banPeer(peerId: string, reason: string): Promise<void>;
    unbanPeer(peerId: string): Promise<void>;
    getNetworkTopology(): any;
    optimizePerformance(): Promise<void>;
}
//# sourceMappingURL=EnhancedDLTNode.d.ts.map