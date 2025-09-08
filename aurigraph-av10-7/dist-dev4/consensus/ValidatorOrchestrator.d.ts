import { ChannelTransaction } from './ValidatorNode';
import { QuantumCryptoManager } from '../crypto/QuantumCryptoManager';
import { VizorMonitoringService } from '../monitoring/VizorDashboard';
import { EventEmitter } from 'events';
export interface NetworkChannel {
    id: string;
    name: string;
    userNodes: Set<string>;
    validators: Set<string>;
    encryptionKey: Buffer;
    maxThroughput: number;
    created: Date;
}
export declare class ValidatorOrchestrator extends EventEmitter {
    private logger;
    private validators;
    private channels;
    private quantumCrypto;
    private vizorMonitoring;
    private consensusRounds;
    private leaderElectionInterval;
    constructor(quantumCrypto: QuantumCryptoManager, vizorMonitoring: VizorMonitoringService);
    initialize(): Promise<void>;
    createChannel(channelId: string, name: string, maxThroughput: number): Promise<NetworkChannel>;
    addUserToChannel(channelId: string, userNodeId: string): Promise<void>;
    routeChannelTransaction(transaction: ChannelTransaction): Promise<boolean>;
    private handleConsensusProposal;
    private handleConsensusVote;
    private handleConsensusCommit;
    private handleTransactionFinalized;
    private startLeaderElection;
    getNetworkStatus(): any;
    stop(): Promise<void>;
}
//# sourceMappingURL=ValidatorOrchestrator.d.ts.map