import { Transaction } from './types';
export declare class ConsistentHashPartitioner {
    private virtualNodes;
    private ring;
    constructor(virtualNodes?: number);
    addShard(shardId: string): void;
    assignTransaction(tx: Transaction): Promise<string>;
    getShardForAddress(address: string): string;
    updateShardWeights(sourceShard: string, targetShard: string, percentage: number): void;
    private generateShardKey;
    private hashFunction;
}
//# sourceMappingURL=ConsistentHashPartitioner.d.ts.map