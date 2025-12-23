import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { Shard } from './Shard';
import { ConsistentHashPartitioner } from './ConsistentHashPartitioner';
import { CrossShardCoordinator } from './CrossShardCoordinator';
import { ShardingConfig, Transaction, TransactionResult } from './types';

export class ShardManager extends EventEmitter {
  private logger: Logger;
  private config: ShardingConfig;
  private shards: Map<string, Shard> = new Map();
  private partitioner: ConsistentHashPartitioner;
  private crossShardCoordinator: CrossShardCoordinator;
  private rebalanceInterval?: NodeJS.Timeout;

  constructor(config: ShardingConfig) {
    super();
    this.logger = new Logger('ShardManager');
    this.config = config;
    this.partitioner = new ConsistentHashPartitioner(config.virtualNodes);
    this.crossShardCoordinator = new CrossShardCoordinator(this);
  }

  async initialize(): Promise<void> {
    this.logger.info(`Initializing ShardManager with ${this.config.shardCount} shards...`);
    
    for (let i = 0; i < this.config.shardCount; i++) {
      const shardId = `shard-${i}`;
      const shard = new Shard(shardId, this.config);
      await shard.initialize();
      this.shards.set(shardId, shard);
      this.partitioner.addShard(shardId);
    }
    
    this.logger.info('ShardManager initialized');
  }

  async start(): Promise<void> {
    this.logger.info('Starting ShardManager...');
    
    for (const shard of this.shards.values()) {
      await shard.start();
    }
    
    if (this.config.autoRebalance) {
      this.startRebalancing();
    }
    
    this.logger.info('ShardManager started');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping ShardManager...');
    
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
    }
    
    for (const shard of this.shards.values()) {
      await shard.stop();
    }
    
    this.logger.info('ShardManager stopped');
  }

  async processTransaction(tx: Transaction): Promise<TransactionResult> {
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

  private isCrossShardTransaction(tx: Transaction): boolean {
    if (!tx.inputs || !tx.outputs) return false;
    
    const inputShards = new Set<string>();
    const outputShards = new Set<string>();
    
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

  private startRebalancing(): void {
    this.rebalanceInterval = setInterval(async () => {
      await this.rebalanceShards();
    }, this.config.rebalanceInterval);
  }

  async rebalanceShards(): Promise<void> {
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

  private async collectShardMetrics(): Promise<Map<string, any>> {
    const metrics = new Map<string, any>();
    
    for (const [shardId, shard] of this.shards) {
      const shardMetrics = await shard.getMetrics();
      metrics.set(shardId, shardMetrics);
    }
    
    return metrics;
  }

  private async createRebalancePlan(metrics: Map<string, any>): Promise<any> {
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

  private calculateAverageLoad(metrics: Map<string, any>): number {
    let totalLoad = 0;
    for (const shardMetrics of metrics.values()) {
      totalLoad += shardMetrics.load;
    }
    return totalLoad / metrics.size;
  }

  private findLeastLoadedShard(metrics: Map<string, any>): string {
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

  private async executeMigration(operation: any): Promise<void> {
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

  getShard(shardId: string): Shard | undefined {
    return this.shards.get(shardId);
  }

  getAllShards(): Shard[] {
    return Array.from(this.shards.values());
  }

  getShardCount(): number {
    return this.shards.size;
  }

  async getShardForTransaction(tx: Transaction): Promise<string> {
    return await this.partitioner.assignTransaction(tx);
  }
}