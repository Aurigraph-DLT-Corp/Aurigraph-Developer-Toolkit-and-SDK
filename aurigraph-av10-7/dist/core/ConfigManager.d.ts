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
export declare class ConfigManager {
    private logger;
    private config;
    constructor();
    initialize(): Promise<void>;
    loadConfiguration(): Promise<void>;
    private getDefaultConfig;
    private loadEnvironmentOverrides;
    private validateConfiguration;
    getConfig(): AV10Config;
    get(path: string, defaultValue?: any): any;
    getNodeConfig(): Promise<NodeConfig>;
    getConsensusConfig(): ConsensusConfig;
    getNetworkConfig(): NetworkConfig;
    getSecurityConfig(): SecurityConfig;
    getPerformanceConfig(): PerformanceConfig;
    getCrossChainConfig(): CrossChainConfig;
    getAIConfig(): AIConfig;
}
//# sourceMappingURL=ConfigManager.d.ts.map