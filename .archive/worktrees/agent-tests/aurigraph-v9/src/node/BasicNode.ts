import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
import { NetworkManager } from '../core/NetworkManager';
import { MonitoringService } from '../monitoring/MonitoringService';
import { Logger } from '../utils/Logger';
import { NodeHealth, NodeInfo, NodeType } from './types';

export class BasicNode extends EventEmitter {
  private logger: Logger;

  constructor(
    configManager: ConfigManager,
    networkManager: NetworkManager,
    monitoringService: MonitoringService
  ) {
    super();
    this.logger = new Logger('BasicNode');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Basic Node...');
  }

  async start(): Promise<void> {
    this.logger.info('Starting Basic Node...');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Basic Node...');
  }

  async getHealth(): Promise<NodeHealth> {
    return {
      healthy: true,
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
      lastBlockHeight: 0,
      peersConnected: 0,
      transactionPoolSize: 0
    };
  }

  async getNodeInfo(): Promise<NodeInfo> {
    return {
      nodeId: 'basic-1',
      nodeType: NodeType.BASIC,
      version: '9.0.0',
      networkId: 'aurigraph-mainnet',
      chainId: 1,
      genesisHash: '',
      currentBlockHeight: 0,
      currentBlockHash: '',
      peers: [],
      capabilities: ['api-access', 'transaction-relay']
    };
  }
}