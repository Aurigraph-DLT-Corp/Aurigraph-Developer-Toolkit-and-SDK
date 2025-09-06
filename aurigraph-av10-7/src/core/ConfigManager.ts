import { injectable } from 'inversify';
import { readFileSync, existsSync } from 'fs';
import { Logger } from './Logger';

export interface AV10Config {
  node: NodeConfig;
  consensus: ConsensusConfig;
  network: NetworkConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
  crosschain: CrossChainConfig;
  ai: AIConfig;
}

export interface NodeConfig {
  nodeId?: string;
  nodeType: 'validator' | 'full' | 'light' | 'bridge';
  dataDir: string;
  apiPort: number;
  grpcPort: number;
}

export interface ConsensusConfig {
  algorithm: 'HyperRAFT++';
  validators: string[];
  electionTimeout: number;
  heartbeatInterval: number;
  batchSize: number;
  pipelineDepth: number;
  parallelThreads: number;
  zkProofsEnabled: boolean;
  aiOptimizationEnabled: boolean;
  quantumSecure: boolean;
}

export interface NetworkConfig {
  port: number;
  maxPeers: number;
  bootstrapNodes: string[];
  enableDiscovery: boolean;
}

export interface SecurityConfig {
  quantumLevel: number;
  zkProofsRequired: boolean;
  homomorphicEncryption: boolean;
  multiPartyComputation: boolean;
}

export interface PerformanceConfig {
  targetTPS: number;
  maxBatchSize: number;
  parallelExecution: boolean;
  cacheSize: number;
}

export interface CrossChainConfig {
  enabled: boolean;
  supportedChains: string[];
  bridgeValidators: number;
}

export interface AIConfig {
  enabled: boolean;
  modelPath: string;
  optimizationInterval: number;
  predictiveConsensus: boolean;
}

@injectable()
export class ConfigManager {
  private logger: Logger;
  private config: AV10Config;
  
  constructor() {
    this.logger = new Logger('ConfigManager');
    this.config = this.getDefaultConfig();
  }
  
  async initialize(): Promise<void> {
    await this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    this.logger.info('Loading AV10-7 configuration...');
    
    // Try to load from file
    const configPath = process.env.CONFIG_PATH || './config/av10-7.json';
    if (existsSync(configPath)) {
      try {
        const fileContent = readFileSync(configPath, 'utf-8');
        const fileConfig = JSON.parse(fileContent);
        this.config = { ...this.config, ...fileConfig };
        this.logger.info('Configuration loaded from file');
      } catch (error: unknown) {
        this.logger.warn('Failed to load config file, using defaults', error);
      }
    }
    
    // Override with environment variables
    this.loadEnvironmentOverrides();
    
    // Validate configuration
    this.validateConfiguration();
    
    this.logger.info('Configuration loaded successfully');
  }
  
  private getDefaultConfig(): AV10Config {
    return {
      node: {
        nodeType: 'validator',
        dataDir: './data',
        apiPort: 3000,
        grpcPort: 50051
      },
      consensus: {
        algorithm: 'HyperRAFT++',
        validators: [],
        electionTimeout: 150,
        heartbeatInterval: 50,
        batchSize: 10000,
        pipelineDepth: 5,
        parallelThreads: 256,
        zkProofsEnabled: true,
        aiOptimizationEnabled: true,
        quantumSecure: true
      },
      network: {
        port: 30303,
        maxPeers: 1000,
        bootstrapNodes: [],
        enableDiscovery: true
      },
      security: {
        quantumLevel: 5,
        zkProofsRequired: true,
        homomorphicEncryption: true,
        multiPartyComputation: true
      },
      performance: {
        targetTPS: 1000000,
        maxBatchSize: 50000,
        parallelExecution: true,
        cacheSize: 10000
      },
      crosschain: {
        enabled: true,
        supportedChains: [
          'ethereum', 'polygon', 'bsc', 'avalanche',
          'solana', 'polkadot', 'cosmos', 'near', 'algorand'
        ],
        bridgeValidators: 21
      },
      ai: {
        enabled: true,
        modelPath: './models',
        optimizationInterval: 5000,
        predictiveConsensus: true
      }
    };
  }
  
  private loadEnvironmentOverrides(): void {
    if (process.env.NODE_ID) {
      this.config.node.nodeId = process.env.NODE_ID;
    }
    
    if (process.env.NODE_TYPE) {
      this.config.node.nodeType = process.env.NODE_TYPE as any;
    }
    
    if (process.env.API_PORT) {
      this.config.node.apiPort = parseInt(process.env.API_PORT);
    }
    
    if (process.env.TARGET_TPS) {
      this.config.performance.targetTPS = parseInt(process.env.TARGET_TPS);
    }
    
    if (process.env.QUANTUM_LEVEL) {
      this.config.security.quantumLevel = parseInt(process.env.QUANTUM_LEVEL);
    }
    
    if (process.env.AI_ENABLED) {
      this.config.ai.enabled = process.env.AI_ENABLED === 'true';
    }
  }
  
  private validateConfiguration(): void {
    if (this.config.performance.targetTPS < 1000) {
      this.logger.warn('Target TPS is below 1000, performance may be suboptimal');
    }
    
    if (this.config.security.quantumLevel < 3) {
      throw new Error('Quantum security level must be at least 3');
    }
    
    if (this.config.consensus.parallelThreads < 1) {
      throw new Error('Parallel threads must be at least 1');
    }
  }
  
  getConfig(): AV10Config {
    return this.config;
  }
  
  get(path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let current = this.config as any;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  async getNodeConfig(): Promise<NodeConfig> {
    return this.config.node;
  }
  
  getConsensusConfig(): ConsensusConfig {
    return this.config.consensus;
  }
  
  getNetworkConfig(): NetworkConfig {
    return this.config.network;
  }
  
  getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }
  
  getPerformanceConfig(): PerformanceConfig {
    return this.config.performance;
  }
  
  getCrossChainConfig(): CrossChainConfig {
    return this.config.crosschain;
  }
  
  getAIConfig(): AIConfig {
    return this.config.ai;
  }
}