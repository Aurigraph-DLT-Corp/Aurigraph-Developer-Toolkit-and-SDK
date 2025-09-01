import { EventEmitter } from 'events';
import { Shard } from './Shard';
import { ShardingConfig, Transaction, TransactionResult } from './types';
export declare class ShardManager extends EventEmitter {
    private logger;
    private config;
    private shards;
    private partitioner;
    private crossShardCoordinator;
    private rebalanceInterval?;
    constructor(config: ShardingConfig);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    processTransaction(tx: Transaction): Promise<TransactionResult>;
    private isCrossShardTransaction;
    private startRebalancing;
    rebalanceShards(): Promise<void>;
    private collectShardMetrics;
    private createRebalancePlan;
    private calculateAverageLoad;
    private findLeastLoadedShard;
    private executeMigration;
    getShard(shardId: string): Shard | undefined;
    getAllShards(): Shard[];
    getShardCount(): number;
    getShardForTransaction(tx: Transaction): Promise<string>;
}
//# sourceMappingURL=ShardManager.d.ts.map