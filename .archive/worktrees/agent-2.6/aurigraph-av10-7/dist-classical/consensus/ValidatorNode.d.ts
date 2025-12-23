import { QuantumCryptoManager } from '../crypto/QuantumCryptoManager';
import { VizorMonitoringService } from '../monitoring/VizorDashboard';
import { EventEmitter } from 'events';
export interface ChannelTransaction {
    id: string;
    channelId: string;
    fromNode: string;
    toNode: string;
    encryptedPayload: Buffer;
    signature: string;
    timestamp: Date;
    nonce: string;
}
export interface ValidatorConfig {
    nodeId: string;
    stakingAmount: number;
    channels: string[];
    maxThroughput: number;
    quantumSecurity: boolean;
}
export interface ConsensusRound {
    roundId: string;
    leaderId: string;
    transactions: ChannelTransaction[];
    startTime: Date;
    participants: string[];
    status: 'proposing' | 'voting' | 'committed' | 'failed';
}
export declare class ValidatorNode extends EventEmitter {
    private logger;
    private nodeId;
    private config;
    private quantumCrypto;
    private vizorMonitoring;
    private currentRound;
    private stake;
    private channels;
    private isLeader;
    private consensusState;
    private transactionQueue;
    constructor(config: ValidatorConfig, quantumCrypto: QuantumCryptoManager, vizorMonitoring: VizorMonitoringService);
    initialize(): Promise<void>;
    processChannelTransaction(transaction: ChannelTransaction): Promise<boolean>;
    proposeConsensusRound(): Promise<ConsensusRound>;
    voteOnRound(round: ConsensusRound, approve: boolean): Promise<void>;
    commitRound(round: ConsensusRound): Promise<void>;
    private finalizeChannelTransaction;
    addUserToChannel(channelId: string, userNodeId: string): void;
    removeUserFromChannel(channelId: string, userNodeId: string): void;
    private startConsensusParticipation;
    private startMetricsCollection;
    getStatus(): any;
    stop(): Promise<void>;
}
//# sourceMappingURL=ValidatorNode.d.ts.map