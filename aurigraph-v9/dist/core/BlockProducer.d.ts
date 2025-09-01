import { EventEmitter } from 'events';
import { RAFTConsensus } from '../consensus/RAFTConsensus';
import { TransactionProcessor } from './TransactionProcessor';
import { StateManager } from './StateManager';
export declare class BlockProducer extends EventEmitter {
    private logger;
    private blockProductionEnabled;
    constructor(consensus: RAFTConsensus, transactionProcessor: TransactionProcessor, stateManager: StateManager);
    start(): Promise<void>;
    stop(): Promise<void>;
    enableBlockProduction(): void;
    disableBlockProduction(): void;
}
//# sourceMappingURL=BlockProducer.d.ts.map