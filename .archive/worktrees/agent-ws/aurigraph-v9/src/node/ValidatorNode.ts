import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
import { NetworkManager } from '../core/NetworkManager';
import { MonitoringService } from '../monitoring/MonitoringService';
import { RAFTConsensus } from '../consensus/RAFTConsensus';
import { ShardManager } from '../consensus/ShardManager';
import { TransactionProcessor } from '../core/TransactionProcessor';
import { BlockProducer } from '../core/BlockProducer';
import { StateManager } from '../core/StateManager';
import { Logger } from '../utils/Logger';
import { NodeHealth, NodeInfo, NodeType } from './types';

export class ValidatorNode extends EventEmitter {
  private logger: Logger;
  private configManager: ConfigManager;
  private networkManager: NetworkManager;
  private monitoringService: MonitoringService;
  private consensus: RAFTConsensus;
  private shardManager: ShardManager;
  private transactionProcessor: TransactionProcessor;
  private blockProducer: BlockProducer;
  private stateManager: StateManager;
  private startTime: Date;

  constructor(
    configManager: ConfigManager,
    networkManager: NetworkManager,
    monitoringService: MonitoringService
  ) {
    super();
    this.logger = new Logger('ValidatorNode');
    this.configManager = configManager;
    this.networkManager = networkManager;
    this.monitoringService = monitoringService;
    this.startTime = new Date();

    this.stateManager = new StateManager(configManager);
    
    const consensusConfig = configManager.getConsensusConfig();
    this.consensus = new RAFTConsensus(consensusConfig);
    
    const shardingConfig = configManager.getShardingConfig();
    this.shardManager = new ShardManager(shardingConfig);
    
    this.transactionProcessor = new TransactionProcessor(
      this.shardManager,
      this.stateManager
    );
    
    this.blockProducer = new BlockProducer(
      this.consensus,
      this.transactionProcessor,
      this.stateManager
    );
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Validator Node...');
    
    await this.stateManager.initialize();
    await this.shardManager.initialize();
    await this.consensus.initialize();
    
    this.setupConsensusHandlers();
    this.setupTransactionHandlers();
    this.setupBlockHandlers();
    
    this.logger.info('Validator Node initialized');
  }

  async start(): Promise<void> {
    this.logger.info('Starting Validator Node...');
    
    await this.consensus.start();
    await this.shardManager.start();
    await this.blockProducer.start();
    await this.transactionProcessor.start();
    
    await this.joinValidatorSet();
    
    this.logger.info('Validator Node started');
    this.emit('started');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Validator Node...');
    
    await this.leaveValidatorSet();
    
    await this.blockProducer.stop();
    await this.transactionProcessor.stop();
    await this.shardManager.stop();
    await this.consensus.stop();
    
    this.logger.info('Validator Node stopped');
    this.emit('stopped');
  }

  private async joinValidatorSet(): Promise<void> {
    const validatorConfig = this.configManager.getValidatorConfig();
    
    if (!validatorConfig) {
      throw new Error('Validator configuration not found');
    }
    
    const joinRequest = {
      nodeId: this.configManager.getNodeConfig().nodeId,
      stake: validatorConfig.stake,
      rewardAddress: validatorConfig.rewardAddress,
      consensusKey: validatorConfig.consensusKey,
      timestamp: Date.now()
    };
    
    await this.consensus.requestJoinValidatorSet(joinRequest);
    this.logger.info('Joined validator set');
  }

  private async leaveValidatorSet(): Promise<void> {
    const nodeId = this.configManager.getNodeConfig().nodeId;
    await this.consensus.requestLeaveValidatorSet(nodeId);
    this.logger.info('Left validator set');
  }

  private setupConsensusHandlers(): void {
    this.consensus.on('leader', () => {
      this.logger.info('Node elected as leader');
      this.blockProducer.enableBlockProduction();
      this.emit('leader');
    });

    this.consensus.on('follower', () => {
      this.logger.info('Node is follower');
      this.blockProducer.disableBlockProduction();
      this.emit('follower');
    });

    this.consensus.on('consensus-achieved', (result) => {
      this.emit('consensus', result);
      this.monitoringService.recordConsensusEvent({
        type: 'consensus-achieved',
        data: result
      });
    });
  }

  private setupTransactionHandlers(): void {
    this.transactionProcessor.on('transaction-validated', (tx) => {
      this.emit('transaction', tx);
    });

    this.transactionProcessor.on('transaction-executed', (result) => {
      this.stateManager.applyStateTransition(result.stateTransition);
    });

    this.networkManager.on('transaction', async (tx) => {
      await this.transactionProcessor.processTransaction(tx);
    });
  }

  private setupBlockHandlers(): void {
    this.blockProducer.on('block-produced', async (block) => {
      await this.consensus.proposeBlock(block);
      this.emit('block', block);
    });

    this.consensus.on('block-committed', async (block) => {
      await this.stateManager.commitBlock(block);
      await this.networkManager.broadcastBlock(block);
    });
  }

  async getHealth(): Promise<NodeHealth> {
    const nodeConfig = this.configManager.getNodeConfig();
    const consensusHealth = await this.consensus.getHealth();
    const stateHealth = await this.stateManager.getHealth();
    
    return {
      healthy: consensusHealth.healthy && stateHealth.healthy,
      uptime: Date.now() - this.startTime.getTime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsage: process.cpuUsage().user / 1000000,
      diskUsage: stateHealth.diskUsage,
      networkLatency: await this.networkManager.getAverageLatency(),
      consensusParticipation: consensusHealth.participation,
      lastBlockHeight: stateHealth.lastBlockHeight,
      peersConnected: await this.networkManager.getPeerCount(),
      transactionPoolSize: this.transactionProcessor.getPoolSize()
    };
  }

  async getNodeInfo(): Promise<NodeInfo> {
    const nodeConfig = this.configManager.getNodeConfig();
    const chainInfo = await this.stateManager.getChainInfo();
    const peers = await this.networkManager.getPeers();
    
    return {
      nodeId: nodeConfig.nodeId,
      nodeType: NodeType.VALIDATOR,
      version: '9.0.0',
      networkId: nodeConfig.networkId,
      chainId: chainInfo.chainId,
      genesisHash: chainInfo.genesisHash,
      currentBlockHeight: chainInfo.currentBlockHeight,
      currentBlockHash: chainInfo.currentBlockHash,
      peers: peers,
      capabilities: [
        'consensus',
        'block-production',
        'transaction-validation',
        'state-management',
        'sharding',
        'high-throughput'
      ]
    };
  }
}