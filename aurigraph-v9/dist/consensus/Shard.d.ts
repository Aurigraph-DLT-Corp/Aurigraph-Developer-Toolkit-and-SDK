import { ShardingConfig, Transaction, TransactionResult } from './types';
export declare class Shard {
    private logger;
    private shardId;
    private config;
    constructor(shardId: string, config: ShardingConfig);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    processTransaction(tx: Transaction): Promise<TransactionResult>;
    getMetrics(): Promise<any>;
    selectDataForMigration(percentage: number): Promise<any[]>;
    importData(data: any[]): Promise<void>;
    removeData(data: any[]): Promise<void>;
}
//# sourceMappingURL=Shard.d.ts.map