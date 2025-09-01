"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsistentHashPartitioner = void 0;
class ConsistentHashPartitioner {
    virtualNodes;
    ring = new Map();
    constructor(virtualNodes = 150) {
        this.virtualNodes = virtualNodes;
    }
    addShard(shardId) {
        for (let i = 0; i < this.virtualNodes; i++) {
            const hash = this.hashFunction(`${shardId}-${i}`);
            this.ring.set(hash, shardId);
        }
    }
    async assignTransaction(tx) {
        const key = this.generateShardKey(tx);
        const hash = this.hashFunction(key);
        let minDistance = Number.MAX_SAFE_INTEGER;
        let targetShard = 'shard-0';
        for (const [ringHash, shardId] of this.ring.entries()) {
            const distance = ringHash >= hash ? ringHash - hash : Number.MAX_SAFE_INTEGER - hash + ringHash;
            if (distance < minDistance) {
                minDistance = distance;
                targetShard = shardId;
            }
        }
        return targetShard;
    }
    getShardForAddress(address) {
        const hash = this.hashFunction(address);
        let minDistance = Number.MAX_SAFE_INTEGER;
        let targetShard = 'shard-0';
        for (const [ringHash, shardId] of this.ring.entries()) {
            const distance = ringHash >= hash ? ringHash - hash : Number.MAX_SAFE_INTEGER - hash + ringHash;
            if (distance < minDistance) {
                minDistance = distance;
                targetShard = shardId;
            }
        }
        return targetShard;
    }
    updateShardWeights(sourceShard, targetShard, percentage) {
        // Update virtual node distribution based on load balancing
    }
    generateShardKey(tx) {
        if (tx.type === 'ASSET_OPERATION') {
            return `asset:${tx.data?.assetId || tx.txId}`;
        }
        return `user:${tx.sender}`;
    }
    hashFunction(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
exports.ConsistentHashPartitioner = ConsistentHashPartitioner;
//# sourceMappingURL=ConsistentHashPartitioner.js.map