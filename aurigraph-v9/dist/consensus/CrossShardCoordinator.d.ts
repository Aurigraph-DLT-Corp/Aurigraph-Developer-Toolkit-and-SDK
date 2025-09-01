import { ShardManager } from './ShardManager';
import { Transaction, TransactionResult } from './types';
export declare class CrossShardCoordinator {
    private logger;
    private shardManager;
    constructor(shardManager: ShardManager);
    executeTransaction(tx: Transaction): Promise<TransactionResult>;
}
//# sourceMappingURL=CrossShardCoordinator.d.ts.map