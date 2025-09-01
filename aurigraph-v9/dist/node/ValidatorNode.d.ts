import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
import { NetworkManager } from '../core/NetworkManager';
import { MonitoringService } from '../monitoring/MonitoringService';
import { NodeHealth, NodeInfo } from './types';
export declare class ValidatorNode extends EventEmitter {
    private logger;
    private configManager;
    private networkManager;
    private monitoringService;
    private consensus;
    private shardManager;
    private transactionProcessor;
    private blockProducer;
    private stateManager;
    private startTime;
    constructor(configManager: ConfigManager, networkManager: NetworkManager, monitoringService: MonitoringService);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    private joinValidatorSet;
    private leaveValidatorSet;
    private setupConsensusHandlers;
    private setupTransactionHandlers;
    private setupBlockHandlers;
    getHealth(): Promise<NodeHealth>;
    getNodeInfo(): Promise<NodeInfo>;
}
//# sourceMappingURL=ValidatorNode.d.ts.map