/**
 * AV10-34: Advanced Network Topology Management
 *
 * Network Infrastructure Agent for intelligent network topology
 * optimization and management with self-optimizing capabilities.
 *
 * Features:
 * - Self-optimizing network topology
 * - Advanced routing algorithms
 * - Network health monitoring
 * - Automatic network partitioning resistance
 * - Dynamic load balancing
 * - Real-time network analytics
 * - Adaptive mesh networking
 * - Quantum-safe network protocols
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
export interface NetworkNode {
    id: string;
    type: 'VALIDATOR' | 'FULL' | 'LIGHT' | 'RELAY' | 'BRIDGE' | 'GATEWAY';
    address: string;
    port: number;
    publicKey: string;
    region: string;
    zone: string;
    status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'MAINTENANCE' | 'UNREACHABLE';
    capabilities: NetworkCapabilities;
    metrics: NetworkMetrics;
    connections: Map<string, Connection>;
    reputation: number;
    trustScore: number;
    lastSeen: Date;
    firstSeen: Date;
    metadata: Record<string, any>;
}
export interface NetworkCapabilities {
    maxConnections: number;
    bandwidthMBps: number;
    supportedProtocols: string[];
    supportsSharding: boolean;
    supportsCrossChain: boolean;
    supportsQuantumCrypto: boolean;
    supportsConsensus: boolean;
    storageCapacityGB: number;
    computePowerGHZ: number;
}
export interface NetworkMetrics {
    latencyMs: number;
    throughputMBps: number;
    packetsPerSecond: number;
    connectionCount: number;
    uptime: number;
    errorRate: number;
    cpuUtilization: number;
    memoryUtilization: number;
    networkUtilization: number;
    consensusParticipation: number;
    lastUpdate: Date;
}
export interface Connection {
    targetNodeId: string;
    protocol: 'TCP' | 'UDP' | 'QUIC' | 'WEBSOCKET' | 'QUANTUM_TUNNEL';
    status: 'ESTABLISHED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
    quality: number;
    latencyMs: number;
    bandwidthMBps: number;
    packetsLost: number;
    packetsTotal: number;
    encryption: boolean;
    compressionRatio: number;
    established: Date;
    lastActivity: Date;
    metadata: Record<string, any>;
}
export interface NetworkTopology {
    id: string;
    name: string;
    type: 'MESH' | 'STAR' | 'HYBRID' | 'HIERARCHICAL' | 'RING';
    nodes: Map<string, NetworkNode>;
    connections: Connection[];
    partitions: NetworkPartition[];
    metrics: TopologyMetrics;
    optimizationScore: number;
    resilienceScore: number;
    efficiency: number;
    created: Date;
    lastOptimized: Date;
}
export interface NetworkPartition {
    id: string;
    nodeIds: string[];
    size: number;
    connectivity: number;
    isolatedFrom: string[];
    bridgeNodes: string[];
    detected: Date;
    resolved?: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface TopologyMetrics {
    nodeCount: number;
    connectionCount: number;
    averageLatency: number;
    averageThroughput: number;
    networkDiameter: number;
    clusteringCoefficient: number;
    partitionCount: number;
    redundancy: number;
    loadBalance: number;
    faultTolerance: number;
    communicationEfficiency: number;
    energyEfficiency: number;
}
export interface RoutingTable {
    nodeId: string;
    routes: Map<string, Route>;
    version: number;
    lastUpdate: Date;
}
export interface Route {
    destination: string;
    nextHop: string;
    hopCount: number;
    latencyMs: number;
    bandwidth: number;
    reliability: number;
    cost: number;
    expiry: Date;
    metadata: Record<string, any>;
}
export interface NetworkOptimizationConfig {
    enableAutoOptimization: boolean;
    optimizationInterval: number;
    targetLatency: number;
    targetThroughput: number;
    maxConnections: number;
    topology: {
        preferredType: 'MESH' | 'STAR' | 'HYBRID' | 'HIERARCHICAL';
        maxHops: number;
        redundancyFactor: number;
        balancingStrategy: 'ROUND_ROBIN' | 'LEAST_LOADED' | 'LATENCY_BASED' | 'ADAPTIVE';
    };
    routing: {
        algorithm: 'SHORTEST_PATH' | 'LOAD_BALANCED' | 'FAULT_TOLERANT' | 'ADAPTIVE';
        updateInterval: number;
        convergenceTimeout: number;
        enableBGP: boolean;
        enableOSPF: boolean;
    };
    monitoring: {
        healthCheckInterval: number;
        metricsCollectionInterval: number;
        anomalyDetectionEnabled: boolean;
        predictiveAnalysisEnabled: boolean;
    };
    security: {
        enableQuantumEncryption: boolean;
        requireMutualAuth: boolean;
        maxTrustScore: number;
        quarantineThreshold: number;
    };
    performance: {
        enableCompression: boolean;
        enableCaching: boolean;
        maxPacketSize: number;
        tcpWindowSize: number;
        congestionControl: 'CUBIC' | 'BBR' | 'ADAPTIVE';
    };
}
export interface NetworkEvent {
    id: string;
    timestamp: Date;
    type: 'NODE_JOIN' | 'NODE_LEAVE' | 'CONNECTION_ESTABLISHED' | 'CONNECTION_LOST' | 'PARTITION_DETECTED' | 'PARTITION_RESOLVED' | 'OPTIMIZATION_COMPLETED' | 'PERFORMANCE_DEGRADATION' | 'SECURITY_ALERT';
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    nodeId?: string;
    description: string;
    impact: string;
    resolution?: string;
    metadata: Record<string, any>;
}
export declare class AdvancedNetworkTopologyManager extends EventEmitter {
    private logger;
    private quantumCrypto;
    private config;
    private topology;
    private routingTables;
    private events;
    private optimizationHistory;
    private healthCheckInterval;
    private metricsInterval;
    private optimizationInterval;
    private routingUpdateInterval;
    private isOptimizing;
    constructor(quantumCrypto: QuantumCryptoManagerV2, config?: Partial<NetworkOptimizationConfig>);
    initialize(): Promise<void>;
    addNode(nodeConfig: Partial<NetworkNode>): Promise<string>;
    removeNode(nodeId: string): Promise<boolean>;
    establishConnection(sourceNodeId: string, targetNodeId: string, protocol?: Connection['protocol']): Promise<boolean>;
    optimizeTopology(): Promise<boolean>;
    detectNetworkPartitions(): Promise<NetworkPartition[]>;
    getTopology(): NetworkTopology;
    getNode(nodeId: string): NetworkNode | undefined;
    getNodes(): NetworkNode[];
    getConnections(): Connection[];
    getRoutingTable(nodeId: string): RoutingTable | undefined;
    getNetworkEvents(limit?: number): NetworkEvent[];
    getOptimizationHistory(limit?: number): typeof this.optimizationHistory;
    getSystemStatus(): any;
    getPerformanceMetrics(): any;
    private initializeTopology;
    private discoverNetworkTopology;
    private initializeRouting;
    private updateRoutingTables;
    private updateRoutingTableForNode;
    private calculateHopCount;
    private calculateRouteBandwidth;
    private calculateRouteReliability;
    private getDefaultCapabilities;
    private getInitialMetrics;
    private getInitialTopologyMetrics;
    private calculateTopologyMetrics;
    private calculateNetworkDiameter;
    private calculateClusteringCoefficient;
    private calculateRedundancy;
    private countAlternativePaths;
    private calculateLoadBalance;
    private calculateFaultTolerance;
    private calculateCommunicationEfficiency;
    private calculateEnergyEfficiency;
    private calculateOptimizationScore;
    private calculateResilienceScore;
    private calculateEfficiencyScore;
    private calculateNetworkHealth;
    private findConnectedComponent;
    private calculatePartitionConnectivity;
    private findBridgeNodes;
    private arePartitionsConnected;
    private resolveNetworkPartitions;
    private optimizeAllNodeConnections;
    private optimizeNodeConnections;
    private findOptimalConnectionCandidates;
    private balanceNetworkLoad;
    private improveFaultTolerance;
    private optimizeRoutingPaths;
    private findBetterPath;
    private removeRedundantConnections;
    private wouldConnectionRemovalCausePartition;
    private recordEvent;
    private startHealthMonitoring;
    private startMetricsCollection;
    private detectPerformanceAnomalies;
    private startRoutingUpdates;
    private startAutoOptimization;
    private shouldTriggerOptimization;
    stop(): Promise<void>;
}
//# sourceMappingURL=AdvancedNetworkTopologyManager.d.ts.map