import { QuantumCryptoManager } from '../crypto/QuantumCryptoManager';
import { VizorMonitoringService } from '../monitoring/VizorDashboard';
import { ChannelTransaction } from '../consensus/ValidatorNode';
import { EventEmitter } from 'events';
export interface UserNode {
    nodeId: string;
    publicKey: string;
    channels: Set<string>;
    lastSeen: Date;
    encryptionCapabilities: string[];
}
export interface EncryptedMessage {
    messageId: string;
    channelId: string;
    fromNode: string;
    toNode: string;
    encryptedContent: Buffer;
    signature: string;
    timestamp: Date;
    nonce: string;
}
export interface NetworkChannel {
    id: string;
    name: string;
    userNodes: Set<string>;
    validators: Set<string>;
    encryptionKey: Buffer;
    maxThroughput: number;
    created: Date;
}
export declare class ChannelManager extends EventEmitter {
    private logger;
    private userNodes;
    private channels;
    private channelKeys;
    private messageQueue;
    private quantumCrypto;
    private vizorMonitoring;
    private processingInterval;
    constructor(quantumCrypto: QuantumCryptoManager, vizorMonitoring: VizorMonitoringService);
    initialize(): Promise<void>;
    createSecureChannel(channelId: string, userNodeIds: string[]): Promise<void>;
    registerUserNode(userNodeId: string, channelId: string): Promise<void>;
    encryptAndRouteTransaction(fromNodeId: string, toNodeId: string, channelId: string, transactionData: any): Promise<ChannelTransaction>;
    decryptTransactionForValidator(transaction: ChannelTransaction, validatorId: string): Promise<any>;
    private startMessageProcessing;
    private startChannelMetrics;
    getChannelStatus(channelId: string): any;
    getAllChannelStatuses(): any[];
    stop(): Promise<void>;
}
//# sourceMappingURL=ChannelManager.d.ts.map