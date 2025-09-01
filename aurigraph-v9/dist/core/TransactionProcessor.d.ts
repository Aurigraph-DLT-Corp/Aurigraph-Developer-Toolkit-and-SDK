import { EventEmitter } from 'events';
import { ShardManager } from '../consensus/ShardManager';
import { StateManager } from './StateManager';
import { Transaction } from '../consensus/types';
export declare class TransactionProcessor extends EventEmitter {
    private logger;
    constructor(shardManager: ShardManager, stateManager: StateManager);
    start(): Promise<void>;
    stop(): Promise<void>;
    processTransaction(tx: Transaction): Promise<void>;
    getPoolSize(): number;
}
//# sourceMappingURL=TransactionProcessor.d.ts.map