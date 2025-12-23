import { readFileSync } from 'fs';
import { Logger } from '../utils/Logger';
import { NodeConfig, NodeType, ValidatorConfig, BasicNodeConfig, ASMConfig } from '../node/types';

export interface AurigraphConfig {
  node: NodeConfig;
  network: NetworkConfig;
  consensus: ConsensusConfig;
  sharding: ShardingConfig;
  storage: StorageConfig;
  api: ApiConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface NetworkConfig {
  networkId: string;
  chainId: number;
  port: number;
  p2pPort: number;
  maxPeers: number;
  bootstrapNodes: string[];
}

export interface ConsensusConfig {
  algorithm: string;
  nodeId: string;
  validators: string[];
  electionTimeout: number;
  heartbeatInterval: number;
  batchSize: number;
  pipelineDepth: number;
}

export interface ShardingConfig {
  enabled: boolean;
  shardCount: number;
  virtualNodes: number;
  autoRebalance: boolean;
  rebalanceInterval: number;
  maxLoadRatio: number;
}

export interface StorageConfig {
  mongodb: MongoDBConfig;
  redis: RedisConfig;
  hazelcast: HazelcastConfig;
}

export interface MongoDBConfig {
  uri: string;
  replicaSet?: string;
  sharding: boolean;
  maxPoolSize: number;
}

export interface RedisConfig {
  url: string;
  cluster: boolean;
  maxRetriesPerRequest: number;
}

export interface HazelcastConfig {
  enabled: boolean;
  clusterName: string;
  maxSize: string;
}

export interface ApiConfig {
  enabled: boolean;
  port: number;
  prefix: string;
  cors: boolean;
  rateLimiting: boolean;
  graphql: GraphQLConfig;
  grpc: GRPCConfig;
}

export interface GraphQLConfig {
  enabled: boolean;
  port: number;
  playground: boolean;
}

export interface GRPCConfig {
  enabled: boolean;
  port: number;
}

export interface SecurityConfig {
  ntru: NTRUConfig;
  pki: PKIConfig;
  encryption: EncryptionConfig;
}

export interface NTRUConfig {
  enabled: boolean;
  securityLevel: number;
  keyRotationInterval: number;
}

export interface PKIConfig {
  enabled: boolean;
  caPath: string;
  certPath: string;
  keyPath: string;
}

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsPort: number;
  telemetryEnabled: boolean;
  telemetryEndpoint: string;
}

export class ConfigManager {
  private logger: Logger;
  private config: AurigraphConfig;

  constructor() {
    this.logger = new Logger('ConfigManager');
    this.config = this.getDefaultConfig();
  }

  async loadConfiguration(): Promise<void> {
    this.logger.info('Loading configuration...');

    this.config = {
      node: this.loadNodeConfig(),
      network: this.loadNetworkConfig(),
      consensus: this.loadConsensusConfig(),
      sharding: this.loadShardingConfig(),
      storage: this.loadStorageConfig(),
      api: this.loadApiConfig(),
      security: this.loadSecurityConfig(),
      monitoring: this.loadMonitoringConfig()
    };

    this.validateConfiguration();
    this.logger.info('Configuration loaded successfully');
  }

  private loadNodeConfig(): NodeConfig {
    const nodeType = (process.env.NODE_TYPE as NodeType) || NodeType.BASIC;
    
    const baseConfig: NodeConfig = {
      nodeId: process.env.NODE_ID || `node-${Date.now()}`,
      nodeType: nodeType,
      nodeName: process.env.NODE_NAME || `aurigraph-${nodeType}-${Date.now()}`,
      nodePort: parseInt(process.env.NODE_PORT || '8080'),
      networkId: process.env.NETWORK_ID || 'aurigraph-mainnet',
      consensusEnabled: process.env.CONSENSUS_ENABLED === 'true'
    };

    switch (nodeType) {
      case NodeType.VALIDATOR:
        baseConfig.validatorConfig = this.loadValidatorConfig();
        break;
      case NodeType.BASIC:
        baseConfig.basicNodeConfig = this.loadBasicNodeConfig();
        break;
      case NodeType.ASM:
        baseConfig.asmConfig = this.loadASMConfig();
        break;
    }

    return baseConfig;
  }

  private loadValidatorConfig(): ValidatorConfig {
    return {
      stake: BigInt(process.env.VALIDATOR_STAKE || '1000000'),
      rewardAddress: process.env.REWARD_ADDRESS || '',
      consensusKey: process.env.CONSENSUS_KEY || '',
      validatorSetSize: parseInt(process.env.VALIDATOR_SET_SIZE || '4'),
      blockProductionEnabled: process.env.BLOCK_PRODUCTION_ENABLED !== 'false',
      shardAssignments: (process.env.SHARD_ASSIGNMENTS || '').split(',').filter(s => s.length > 0)
    };
  }

  private loadBasicNodeConfig(): BasicNodeConfig {
    return {
      dockerized: process.env.DOCKERIZED === 'true',
      apiEnabled: process.env.API_ENABLED !== 'false',
      lightClient: process.env.LIGHT_CLIENT === 'true',
      maxConnections: parseInt(process.env.MAX_CONNECTIONS || '100')
    };
  }

  private loadASMConfig(): ASMConfig {
    return {
      iamEnabled: process.env.IAM_ENABLED === 'true',
      caEnabled: process.env.CA_ENABLED === 'true',
      registryEnabled: process.env.REGISTRY_ENABLED === 'true',
      monitoringEnabled: process.env.MONITORING_ENABLED !== 'false',
      adminPrivileges: process.env.ADMIN_PRIVILEGES === 'true'
    };
  }

  private loadNetworkConfig(): NetworkConfig {
    return {
      networkId: process.env.NETWORK_ID || 'aurigraph-mainnet',
      chainId: parseInt(process.env.CHAIN_ID || '1'),
      port: parseInt(process.env.NETWORK_PORT || '30303'),
      p2pPort: parseInt(process.env.P2P_PORT || '30304'),
      maxPeers: parseInt(process.env.MAX_PEERS || '50'),
      bootstrapNodes: (process.env.BOOTSTRAP_NODES || '').split(',').filter(n => n.length > 0)
    };
  }

  private loadConsensusConfig(): ConsensusConfig {
    return {
      algorithm: process.env.CONSENSUS_ALGORITHM || 'RAFT',
      nodeId: process.env.NODE_ID || `node-${Date.now()}`,
      validators: (process.env.VALIDATORS || '').split(',').filter(v => v.length > 0),
      electionTimeout: parseInt(process.env.RAFT_ELECTION_TIMEOUT_MS || '150'),
      heartbeatInterval: parseInt(process.env.RAFT_HEARTBEAT_INTERVAL_MS || '50'),
      batchSize: parseInt(process.env.BATCH_SIZE || '10000'),
      pipelineDepth: parseInt(process.env.PIPELINE_DEPTH || '3')
    };
  }

  private loadShardingConfig(): ShardingConfig {
    return {
      enabled: process.env.SHARDING_ENABLED !== 'false',
      shardCount: parseInt(process.env.SHARD_COUNT || '16'),
      virtualNodes: parseInt(process.env.VIRTUAL_NODES || '150'),
      autoRebalance: process.env.AUTO_REBALANCE !== 'false',
      rebalanceInterval: parseInt(process.env.REBALANCE_INTERVAL_MS || '300000'),
      maxLoadRatio: parseFloat(process.env.MAX_LOAD_RATIO || '1.5')
    };
  }

  private loadStorageConfig(): StorageConfig {
    return {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aurigraph',
        replicaSet: process.env.MONGODB_REPLICA_SET,
        sharding: process.env.MONGODB_SHARDING === 'true',
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10')
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        cluster: process.env.REDIS_CLUSTER === 'true',
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3')
      },
      hazelcast: {
        enabled: process.env.HAZELCAST_ENABLED !== 'false',
        clusterName: process.env.HAZELCAST_CLUSTER_NAME || 'aurigraph-cluster',
        maxSize: process.env.HAZELCAST_MAX_SIZE || '32GB'
      }
    };
  }

  private loadApiConfig(): ApiConfig {
    return {
      enabled: process.env.API_ENABLED !== 'false',
      port: parseInt(process.env.API_PORT || '3000'),
      prefix: process.env.API_PREFIX || '/api/v9',
      cors: process.env.API_CORS !== 'false',
      rateLimiting: process.env.API_RATE_LIMITING !== 'false',
      graphql: {
        enabled: process.env.GRAPHQL_ENABLED === 'true',
        port: parseInt(process.env.GRAPHQL_PORT || '4000'),
        playground: process.env.GRAPHQL_PLAYGROUND !== 'false'
      },
      grpc: {
        enabled: process.env.GRPC_ENABLED === 'true',
        port: parseInt(process.env.GRPC_PORT || '50051')
      }
    };
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      ntru: {
        enabled: process.env.NTRU_ENABLED !== 'false',
        securityLevel: parseInt(process.env.NTRU_SECURITY_LEVEL || '256'),
        keyRotationInterval: parseInt(process.env.NTRU_KEY_ROTATION_INTERVAL || '86400000')
      },
      pki: {
        enabled: process.env.PKI_ENABLED === 'true',
        caPath: process.env.CA_CERTIFICATE_PATH || './certs/ca.crt',
        certPath: process.env.NODE_CERTIFICATE_PATH || './certs/node.crt',
        keyPath: process.env.NODE_PRIVATE_KEY_PATH || './certs/node.key'
      },
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM || 'AES-256-GCM',
        keySize: parseInt(process.env.ENCRYPTION_KEY_SIZE || '256')
      }
    };
  }

  private loadMonitoringConfig(): MonitoringConfig {
    return {
      enabled: process.env.METRICS_ENABLED !== 'false',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
      telemetryEnabled: process.env.TELEMETRY_ENABLED === 'true',
      telemetryEndpoint: process.env.TELEMETRY_ENDPOINT || ''
    };
  }

  private validateConfiguration(): void {
    if (!this.config.node.nodeId) {
      throw new Error('Node ID is required');
    }

    if (this.config.node.nodeType === NodeType.VALIDATOR && this.config.consensus.validators.length === 0) {
      this.logger.warn('No validators specified for validator node');
    }

    if (this.config.sharding.enabled && this.config.sharding.shardCount < 1) {
      throw new Error('Shard count must be at least 1 when sharding is enabled');
    }
  }

  private getDefaultConfig(): AurigraphConfig {
    return {
      node: {
        nodeId: `node-${Date.now()}`,
        nodeType: NodeType.BASIC,
        nodeName: `aurigraph-basic-${Date.now()}`,
        nodePort: 8080,
        networkId: 'aurigraph-mainnet',
        consensusEnabled: false
      },
      network: {
        networkId: 'aurigraph-mainnet',
        chainId: 1,
        port: 30303,
        p2pPort: 30304,
        maxPeers: 50,
        bootstrapNodes: []
      },
      consensus: {
        algorithm: 'RAFT',
        nodeId: `node-${Date.now()}`,
        validators: [],
        electionTimeout: 150,
        heartbeatInterval: 50,
        batchSize: 10000,
        pipelineDepth: 3
      },
      sharding: {
        enabled: true,
        shardCount: 16,
        virtualNodes: 150,
        autoRebalance: true,
        rebalanceInterval: 300000,
        maxLoadRatio: 1.5
      },
      storage: {
        mongodb: {
          uri: 'mongodb://localhost:27017/aurigraph',
          sharding: false,
          maxPoolSize: 10
        },
        redis: {
          url: 'redis://localhost:6379',
          cluster: false,
          maxRetriesPerRequest: 3
        },
        hazelcast: {
          enabled: false,
          clusterName: 'aurigraph-cluster',
          maxSize: '32GB'
        }
      },
      api: {
        enabled: true,
        port: 3000,
        prefix: '/api/v9',
        cors: true,
        rateLimiting: true,
        graphql: {
          enabled: false,
          port: 4000,
          playground: true
        },
        grpc: {
          enabled: false,
          port: 50051
        }
      },
      security: {
        ntru: {
          enabled: true,
          securityLevel: 256,
          keyRotationInterval: 86400000
        },
        pki: {
          enabled: false,
          caPath: './certs/ca.crt',
          certPath: './certs/node.crt',
          keyPath: './certs/node.key'
        },
        encryption: {
          algorithm: 'AES-256-GCM',
          keySize: 256
        }
      },
      monitoring: {
        enabled: true,
        metricsPort: 9090,
        telemetryEnabled: false,
        telemetryEndpoint: ''
      }
    };
  }

  getConfig(): AurigraphConfig {
    return this.config;
  }

  getNodeConfig(): NodeConfig {
    return this.config.node;
  }

  getNetworkConfig(): NetworkConfig {
    return this.config.network;
  }

  getConsensusConfig(): ConsensusConfig {
    return this.config.consensus;
  }

  getShardingConfig(): ShardingConfig {
    return this.config.sharding;
  }

  getStorageConfig(): StorageConfig {
    return this.config.storage;
  }

  getApiConfig(): ApiConfig {
    return this.config.api;
  }

  getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }

  getValidatorConfig(): ValidatorConfig | undefined {
    return this.config.node.validatorConfig;
  }

  getBasicNodeConfig(): BasicNodeConfig | undefined {
    return this.config.node.basicNodeConfig;
  }

  getASMConfig(): ASMConfig | undefined {
    return this.config.node.asmConfig;
  }
}