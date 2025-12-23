/**
 * AV10-32: Optimal Node Density Manager
 * Intelligent network topology optimization for maximum performance and reliability
 */
import { EventEmitter } from 'events';
export interface NodeInfo {
    id: string;
    type: NodeType;
    region: string;
    coordinates: Coordinates;
    capacity: NodeCapacity;
    performance: NodePerformance;
    connections: Connection[];
    health: NodeHealth;
    specialization: NodeSpecialization[];
    resources: NodeResources;
}
export interface NodeCapacity {
    maxTPS: number;
    maxConnections: number;
    storageCapacity: number;
    computePower: number;
    bandwidth: number;
    availableSlots: number;
}
export interface NodePerformance {
    currentTPS: number;
    avgLatency: number;
    uptime: number;
    reliability: number;
    loadFactor: number;
    errorRate: number;
}
export interface Connection {
    targetNodeId: string;
    type: ConnectionType;
    latency: number;
    bandwidth: number;
    reliability: number;
    established: Date;
}
export interface NodeHealth {
    status: NodeStatus;
    lastHealthCheck: Date;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUtilization: number;
    temperature: number;
    alerts: HealthAlert[];
}
export interface NodeSpecialization {
    type: SpecializationType;
    proficiency: number;
    resources: string[];
}
export interface NodeResources {
    cpu: ResourceInfo;
    memory: ResourceInfo;
    storage: ResourceInfo;
    network: ResourceInfo;
    gpu?: ResourceInfo;
}
export interface ResourceInfo {
    total: number;
    used: number;
    available: number;
    unit: string;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude?: number;
}
export interface HealthAlert {
    id: string;
    level: AlertLevel;
    message: string;
    timestamp: Date;
    resolved: boolean;
}
export interface NetworkTopology {
    nodes: NodeInfo[];
    connections: NetworkConnection[];
    regions: RegionInfo[];
    clusters: NodeCluster[];
    performance: NetworkPerformance;
}
export interface NetworkConnection {
    source: string;
    target: string;
    type: ConnectionType;
    quality: ConnectionQuality;
    metrics: ConnectionMetrics;
}
export interface ConnectionQuality {
    latency: number;
    jitter: number;
    packetLoss: number;
    bandwidth: number;
    stability: number;
}
export interface ConnectionMetrics {
    dataTransferred: number;
    packetsTransmitted: number;
    errorsDetected: number;
    lastUpdated: Date;
}
export interface RegionInfo {
    id: string;
    name: string;
    coordinates: Coordinates;
    nodeCount: number;
    totalCapacity: NodeCapacity;
    regulations: string[];
    networkQuality: number;
}
export interface NodeCluster {
    id: string;
    region: string;
    nodes: string[];
    purpose: ClusterPurpose;
    loadBalance: LoadBalanceConfig;
    redundancy: RedundancyConfig;
}
export interface LoadBalanceConfig {
    algorithm: LoadBalanceAlgorithm;
    weights: Record<string, number>;
    thresholds: Record<string, number>;
}
export interface RedundancyConfig {
    minimumNodes: number;
    backupNodes: string[];
    failoverTimeout: number;
    consensusRequired: number;
}
export interface NetworkPerformance {
    totalTPS: number;
    avgLatency: number;
    networkReliability: number;
    consensusTime: number;
    scalability: number;
    efficiency: number;
}
export interface OptimizationResult {
    improvements: Improvement[];
    newTopology: NetworkTopology;
    estimatedGains: PerformanceGains;
    migrationPlan: MigrationStep[];
    cost: OptimizationCost;
}
export interface Improvement {
    type: ImprovementType;
    description: string;
    impact: number;
    priority: Priority;
    resources: string[];
}
export interface PerformanceGains {
    tpsImprovement: number;
    latencyReduction: number;
    reliabilityIncrease: number;
    costReduction: number;
    energyEfficiency: number;
}
export interface MigrationStep {
    id: string;
    type: MigrationType;
    description: string;
    dependencies: string[];
    estimatedTime: number;
    riskLevel: RiskLevel;
    rollbackPlan: string;
}
export interface OptimizationCost {
    computational: number;
    network: number;
    storage: number;
    maintenance: number;
    total: number;
    currency: string;
}
export declare enum NodeType {
    VALIDATOR = "VALIDATOR",
    FULL_NODE = "FULL_NODE",
    LIGHT_NODE = "LIGHT_NODE",
    ARCHIVE_NODE = "ARCHIVE_NODE",
    BRIDGE_NODE = "BRIDGE_NODE",
    API_NODE = "API_NODE",
    CONSENSUS_NODE = "CONSENSUS_NODE",
    SHARD_NODE = "SHARD_NODE"
}
export declare enum ConnectionType {
    DIRECT = "DIRECT",
    RELAYED = "RELAYED",
    MESH = "MESH",
    STAR = "STAR",
    HYBRID = "HYBRID"
}
export declare enum NodeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE",
    DEGRADED = "DEGRADED",
    FAILED = "FAILED",
    SYNCING = "SYNCING",
    UPGRADING = "UPGRADING"
}
export declare enum SpecializationType {
    CONSENSUS = "CONSENSUS",
    STORAGE = "STORAGE",
    COMPUTE = "COMPUTE",
    NETWORK = "NETWORK",
    SECURITY = "SECURITY",
    ANALYTICS = "ANALYTICS",
    BRIDGE = "BRIDGE",
    API = "API"
}
export declare enum AlertLevel {
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export declare enum ClusterPurpose {
    CONSENSUS = "CONSENSUS",
    STORAGE = "STORAGE",
    COMPUTE = "COMPUTE",
    BRIDGE = "BRIDGE",
    API = "API",
    BACKUP = "BACKUP"
}
export declare enum LoadBalanceAlgorithm {
    ROUND_ROBIN = "ROUND_ROBIN",
    WEIGHTED = "WEIGHTED",
    LEAST_CONNECTIONS = "LEAST_CONNECTIONS",
    RESOURCE_BASED = "RESOURCE_BASED",
    LATENCY_BASED = "LATENCY_BASED",
    ADAPTIVE = "ADAPTIVE"
}
export declare enum ImprovementType {
    ADD_NODE = "ADD_NODE",
    REMOVE_NODE = "REMOVE_NODE",
    RELOCATE_NODE = "RELOCATE_NODE",
    UPGRADE_NODE = "UPGRADE_NODE",
    OPTIMIZE_CONNECTIONS = "OPTIMIZE_CONNECTIONS",
    REBALANCE_LOAD = "REBALANCE_LOAD",
    ADJUST_CAPACITY = "ADJUST_CAPACITY"
}
export declare enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum MigrationType {
    NODE_ADDITION = "NODE_ADDITION",
    NODE_REMOVAL = "NODE_REMOVAL",
    NODE_RELOCATION = "NODE_RELOCATION",
    CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
    CAPACITY_ADJUSTMENT = "CAPACITY_ADJUSTMENT",
    CONNECTION_OPTIMIZATION = "CONNECTION_OPTIMIZATION"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
/**
 * Optimal Node Density Manager
 * Manages network topology optimization for maximum performance
 */
export declare class OptimalNodeDensityManager extends EventEmitter {
    private logger;
    private nodes;
    private topology;
    private optimizationEngine;
    private healthMonitor;
    private performanceAnalyzer;
    private migrationExecutor;
    private costCalculator;
    private readonly CONFIG;
    constructor();
    private initializeManager;
    private initializeTopology;
    private initializeRegions;
    private createEmptyCapacity;
    private deployInitialNodes;
    private createOptimalNode;
    private selectOptimalNodeType;
    private calculateOptimalCoordinates;
    private calculateOptimalCapacity;
    private initializePerformance;
    private initializeHealth;
    private selectSpecializations;
    private initializeResources;
    addNode(node: NodeInfo): void;
    private updateRegionCapacity;
    private optimizeConnections;
    private findOptimalConnections;
    private calculateDistance;
    private toRadians;
    private estimateConnectionQuality;
    private createConnection;
    private selectConnectionType;
    private createNodeClusters;
    private groupNodesByRegion;
    private calculateNodeWeights;
    private startHealthMonitoring;
    private performHealthChecks;
    private checkNodeHealth;
    private updateResourceUtilization;
    private checkHealthAlerts;
    private updateNodeStatus;
    private startPerformanceAnalysis;
    private analyzeNetworkPerformance;
    private estimateConsensusTime;
    private calculateScalabilityScore;
    private calculateNetworkEfficiency;
    private calculateTotalResources;
    private calculateUtilizedResources;
    private startOptimizationLoop;
    optimizeNetworkTopology(): Promise<OptimizationResult>;
    private analyzeScalingNeeds;
    private analyzeLoadBalancing;
    private calculateLoadVariance;
    private analyzeConnectionOptimization;
    private analyzeNodeRelocation;
    private findBetterLocation;
    private calculateAverageDistance;
    private calculateEstimatedGains;
    private createMigrationPlan;
    private getMigrationType;
    private estimateMigrationTime;
    private assessRiskLevel;
    private createRollbackPlan;
    private simulateOptimizations;
    private findLeastLoadedRegion;
    private calculateRegionLoad;
    private findMostUnderutilizedNode;
    private recalculateTopologyPerformance;
    /**
     * Public API methods
     */
    getNetworkTopology(): NetworkTopology;
    getNodeInfo(nodeId: string): NodeInfo | null;
    getRegionInfo(regionId: string): RegionInfo | null;
    addNodeToRegion(regionId: string, nodeType: NodeType): Promise<NodeInfo>;
    removeNode(nodeId: string): Promise<boolean>;
    getNetworkPerformance(): NetworkPerformance;
    executeOptimization(optimizationResult: OptimizationResult): Promise<boolean>;
    /**
     * Stop the density manager
     */
    stop(): void;
}
export declare const optimalNodeDensityManager: OptimalNodeDensityManager;
//# sourceMappingURL=AV10-32-OptimalNodeDensityManager.d.ts.map