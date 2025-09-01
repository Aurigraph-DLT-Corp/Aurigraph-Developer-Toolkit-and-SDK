import { NodeConfig, ValidatorConfig, BasicNodeConfig, ASMConfig } from '../node/types';
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
export declare class ConfigManager {
    private logger;
    private config;
    constructor();
    loadConfiguration(): Promise<void>;
    private loadNodeConfig;
    private loadValidatorConfig;
    private loadBasicNodeConfig;
    private loadASMConfig;
    private loadNetworkConfig;
    private loadConsensusConfig;
    private loadShardingConfig;
    private loadStorageConfig;
    private loadApiConfig;
    private loadSecurityConfig;
    private loadMonitoringConfig;
    private validateConfiguration;
    private getDefaultConfig;
    getConfig(): AurigraphConfig;
    getNodeConfig(): NodeConfig;
    getNetworkConfig(): NetworkConfig;
    getConsensusConfig(): ConsensusConfig;
    getShardingConfig(): ShardingConfig;
    getStorageConfig(): StorageConfig;
    getApiConfig(): ApiConfig;
    getSecurityConfig(): SecurityConfig;
    getMonitoringConfig(): MonitoringConfig;
    getValidatorConfig(): ValidatorConfig | undefined;
    getBasicNodeConfig(): BasicNodeConfig | undefined;
    getASMConfig(): ASMConfig | undefined;
}
//# sourceMappingURL=ConfigManager.d.ts.map