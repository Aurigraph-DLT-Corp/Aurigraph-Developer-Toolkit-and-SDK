import { EventEmitter } from 'events';
import { ConfigManager } from '../core/ConfigManager';
import { NetworkManager } from '../core/NetworkManager';
import { MonitoringService } from '../monitoring/MonitoringService';
import { ValidatorNode } from './ValidatorNode';
import { BasicNode } from './BasicNode';
import { ASMNode } from './ASMNode';
import { Logger } from '../utils/Logger';
import { NodeType, NodeStatus } from './types';

export class AurigraphNode extends EventEmitter {
  private logger: Logger;
  private configManager: ConfigManager;
  private networkManager: NetworkManager;
  private monitoringService: MonitoringService;
  private nodeImplementation?: ValidatorNode | BasicNode | ASMNode;
  private status: NodeStatus = NodeStatus.INITIALIZING;

  constructor(
    configManager: ConfigManager,
    networkManager: NetworkManager,
    monitoringService: MonitoringService
  ) {
    super();
    this.logger = new Logger('AurigraphNode');
    this.configManager = configManager;
    this.networkManager = networkManager;
    this.monitoringService = monitoringService;
  }

  async start(): Promise<void> {
    this.logger.info('Starting Aurigraph Node...');
    
    const nodeConfig = this.configManager.getNodeConfig();
    
    switch (nodeConfig.nodeType) {
      case NodeType.VALIDATOR:
        this.nodeImplementation = new ValidatorNode(
          this.configManager,
          this.networkManager,
          this.monitoringService
        );
        break;
      
      case NodeType.BASIC:
        this.nodeImplementation = new BasicNode(
          this.configManager,
          this.networkManager,
          this.monitoringService
        );
        break;
      
      case NodeType.ASM:
        this.nodeImplementation = new ASMNode(
          this.configManager,
          this.networkManager,
          this.monitoringService
        );
        break;
      
      default:
        throw new Error(`Unknown node type: ${nodeConfig.nodeType}`);
    }

    await this.nodeImplementation.initialize();
    await this.nodeImplementation.start();
    
    this.status = NodeStatus.RUNNING;
    this.emit('started');
    
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Aurigraph Node...');
    
    this.status = NodeStatus.STOPPING;
    
    if (this.nodeImplementation) {
      await this.nodeImplementation.stop();
    }
    
    await this.networkManager.disconnect();
    await this.monitoringService.stop();
    
    this.status = NodeStatus.STOPPED;
    this.emit('stopped');
  }

  private setupEventHandlers(): void {
    if (!this.nodeImplementation) return;

    this.nodeImplementation.on('transaction', (tx) => {
      this.monitoringService.recordTransaction(tx);
    });

    this.nodeImplementation.on('block', (block) => {
      this.monitoringService.recordBlock(block);
    });

    this.nodeImplementation.on('consensus', (event) => {
      this.monitoringService.recordConsensusEvent(event);
    });

    this.nodeImplementation.on('error', (error) => {
      this.logger.error('Node error:', error);
      this.monitoringService.recordError(error);
    });
  }

  private startHealthCheck(): void {
    setInterval(async () => {
      if (this.nodeImplementation && this.status === NodeStatus.RUNNING) {
        const health = await this.nodeImplementation.getHealth();
        this.monitoringService.recordHealthCheck(health);
        
        if (!health.healthy) {
          this.logger.warn('Node health check failed:', health);
          this.emit('unhealthy', health);
        }
      }
    }, 10000);
  }

  getStatus(): NodeStatus {
    return this.status;
  }

  async getNodeInfo(): Promise<any> {
    if (!this.nodeImplementation) {
      throw new Error('Node not initialized');
    }
    
    return this.nodeImplementation.getNodeInfo();
  }
}