"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardManager = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const Shard_1 = require("./Shard");
const ConsistentHashPartitioner_1 = require("./ConsistentHashPartitioner");
const CrossShardCoordinator_1 = require("./CrossShardCoordinator");
class ShardManager extends events_1.EventEmitter {
    logger;
    config;
    shards = new Map();
    partitioner;
    crossShardCoordinator;
    rebalanceInterval;
    constructor(config) {
        super();
        this.logger = new Logger_1.Logger('ShardManager');
        this.config = config;
        this.partitioner = new ConsistentHashPartitioner_1.ConsistentHashPartitioner(config.virtualNodes);
        this.crossShardCoordinator = new CrossShardCoordinator_1.CrossShardCoordinator(this);
    }
    async initialize() {
        this.logger.info(`Initializing ShardManager with ${this.config.shardCount} shards...`);
        for (let i = 0; i < this.config.shardCount; i++) {
            const shardId = `shard-${i}`;
            const shard = new Shard_1.Shard(shardId, this.config);
            await shard.initialize();
            this.shards.set(shardId, shard);
            this.partitioner.addShard(shardId);
        }
        this.logger.info('ShardManager initialized');
    }
    async start() {
        this.logger.info('Starting ShardManager...');
        for (const shard of this.shards.values()) {
            await shard.start();
        }
        if (this.config.autoRebalance) {
            this.startRebalancing();
        }
        this.logger.info('ShardManager started');
    }
    async stop() {
        this.logger.info('Stopping ShardManager...');
        if (this.rebalanceInterval) {
            clearInterval(this.rebalanceInterval);
        }
        for (const shard of this.shards.values()) {
            await shard.stop();
        }
        this.logger.info('ShardManager stopped');
    }
    async processTransaction(tx) {
        const targetShard = await this.partitioner.assignTransaction(tx);
        if (this.isCrossShardTransaction(tx)) {
            return await this.crossShardCoordinator.executeTransaction(tx);
        }
        const shard = this.shards.get(targetShard);
        if (!shard) {
            throw new Error(`Shard ${targetShard} not found`);
        }
        return await shard.processTransaction(tx);
    }
    isCrossShardTransaction(tx) {
        if (!tx.inputs || !tx.outputs)
            return false;
        const inputShards = new Set();
        const outputShards = new Set();
        for (const input of tx.inputs) {
            const shardId = this.partitioner.getShardForAddress(input.address);
            inputShards.add(shardId);
        }
        for (const output of tx.outputs) {
            const shardId = this.partitioner.getShardForAddress(output.address);
            outputShards.add(shardId);
        }
        const allShards = new Set([...inputShards, ...outputShards]);
        return allShards.size > 1;
    }
    startRebalancing() {
        this.rebalanceInterval = setInterval(async () => {
            await this.rebalanceShards();
        }, this.config.rebalanceInterval);
    }
    async rebalanceShards() {
        this.logger.info('Starting shard rebalancing...');
        const loadMetrics = await this.collectShardMetrics();
        const rebalancePlan = await this.createRebalancePlan(loadMetrics);
        if (rebalancePlan.operations.length === 0) {
            this.logger.info('No rebalancing needed');
            return;
        }
        for (const operation of rebalancePlan.operations) {
            await this.executeMigration(operation);
        }
        this.logger.info('Shard rebalancing completed');
    }
    async collectShardMetrics() {
        const metrics = new Map();
        for (const [shardId, shard] of this.shards) {
            const shardMetrics = await shard.getMetrics();
            metrics.set(shardId, shardMetrics);
        }
        return metrics;
    }
    async createRebalancePlan(metrics) {
        const operations = [];
        const avgLoad = this.calculateAverageLoad(metrics);
        for (const [shardId, shardMetrics] of metrics) {
            const loadRatio = shardMetrics.load / avgLoad;
            if (loadRatio > this.config.maxLoadRatio) {
                const targetShard = this.findLeastLoadedShard(metrics);
                operations.push({
                    type: 'migrate',
                    source: shardId,
                    target: targetShard,
                    percentage: (loadRatio - 1.0) * 100
                });
            }
        }
        return { operations };
    }
    calculateAverageLoad(metrics) {
        let totalLoad = 0;
        for (const shardMetrics of metrics.values()) {
            totalLoad += shardMetrics.load;
        }
        return totalLoad / metrics.size;
    }
    findLeastLoadedShard(metrics) {
        let minLoad = Infinity;
        let targetShard = '';
        for (const [shardId, shardMetrics] of metrics) {
            if (shardMetrics.load < minLoad) {
                minLoad = shardMetrics.load;
                targetShard = shardId;
            }
        }
        return targetShard;
    }
    async executeMigration(operation) {
        this.logger.info(`Migrating data from ${operation.source} to ${operation.target}`);
        const sourceShard = this.shards.get(operation.source);
        const targetShard = this.shards.get(operation.target);
        if (!sourceShard || !targetShard) {
            throw new Error('Invalid migration operation');
        }
        const dataToMigrate = await sourceShard.selectDataForMigration(operation.percentage);
        await targetShard.importData(dataToMigrate);
        await sourceShard.removeData(dataToMigrate);
        this.partitioner.updateShardWeights(operation.source, operation.target, operation.percentage);
    }
    getShard(shardId) {
        return this.shards.get(shardId);
    }
    getAllShards() {
        return Array.from(this.shards.values());
    }
    getShardCount() {
        return this.shards.size;
    }
    async getShardForTransaction(tx) {
        return await this.partitioner.assignTransaction(tx);
    }
}
exports.ShardManager = ShardManager;
//# sourceMappingURL=ShardManager.js.map