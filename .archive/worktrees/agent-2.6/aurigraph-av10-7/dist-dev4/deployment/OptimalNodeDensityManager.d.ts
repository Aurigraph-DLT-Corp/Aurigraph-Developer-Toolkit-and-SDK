/**
 * AV10-32: Optimal Node Density Manager
 *
 * Advanced DevOps & Deployment Agent for resource-based auto-scaling
 * and optimal node density management in Docker containers.
 *
 * Features:
 * - Automatic resource detection and monitoring
 * - Optimal node count calculation (80-90% resource utilization)
 * - Dynamic node spawning/termination
 * - Support for 10-50+ nodes per container
 * - Real-time performance optimization
 * - Advanced container orchestration
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
export interface SystemResources {
    totalMemoryGB: number;
    availableMemoryGB: number;
    memoryUtilization: number;
    cpuCores: number;
    cpuUtilization: number;
    diskSpaceGB: number;
    availableDiskGB: number;
    diskUtilization: number;
    networkBandwidthMBps: number;
    containerLimits?: ContainerLimits;
}
export interface ContainerLimits {
    maxMemoryGB: number;
    maxCpuCores: number;
    maxDiskGB: number;
    maxNetworkMBps: number;
}
export interface NodeDensityConfig {
    targetMemoryUtilization: number;
    targetCpuUtilization: number;
    targetDiskUtilization: number;
    minNodesPerContainer: number;
    maxNodesPerContainer: number;
    nodeResourceRequirements: {
        memoryMB: number;
        cpuCores: number;
        diskMB: number;
        networkMBps: number;
    };
    scalingPolicy: {
        scaleUpThreshold: number;
        scaleDownThreshold: number;
        cooldownPeriodMs: number;
        enableAggressiveScaling: boolean;
        enablePredictiveScaling: boolean;
    };
    healthChecks: {
        enabled: boolean;
        intervalMs: number;
        failureThreshold: number;
        successThreshold: number;
        timeoutMs: number;
    };
}
export interface NodeInstance {
    id: string;
    type: 'VALIDATOR' | 'FULL' | 'LIGHT' | 'ARCHIVE' | 'BRIDGE';
    port: number;
    p2pPort: number;
    containerId: string;
    pid?: number;
    status: 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'ERROR';
    resourceUsage: {
        memoryMB: number;
        cpuPercent: number;
        diskMB: number;
        networkMBps: number;
    };
    performance: {
        tps: number;
        latencyMs: number;
        uptime: number;
        errorRate: number;
    };
    healthScore: number;
    lastHealthCheck: Date;
    createdAt: Date;
    metadata: Record<string, any>;
}
export interface DensityMetrics {
    totalNodes: number;
    activeNodes: number;
    optimalNodeCount: number;
    currentDensity: number;
    optimalDensity: number;
    resourceEfficiency: number;
    scalingRecommendation: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN' | 'OPTIMIZE';
    performanceScore: number;
    costEfficiency: number;
}
export interface ScalingEvent {
    timestamp: Date;
    action: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMIZE' | 'EMERGENCY_SCALE';
    trigger: string;
    nodesBefore: number;
    nodesAfter: number;
    reasonCode: string;
    executionTimeMs: number;
    success: boolean;
    errorMessage?: string;
}
export declare class OptimalNodeDensityManager extends EventEmitter {
    private logger;
    private quantumCrypto;
    private config;
    private nodes;
    private systemResources;
    private densityMetrics;
    private scalingHistory;
    private lastScalingAction;
    private monitoringInterval;
    private healthCheckInterval;
    private nextNodePort;
    private nextP2PPort;
    private isScaling;
    constructor(quantumCrypto: QuantumCryptoManagerV2, config?: Partial<NodeDensityConfig>);
    initialize(): Promise<void>;
    detectSystemResources(): Promise<SystemResources>;
    calculateOptimalDensity(): Promise<DensityMetrics>;
    scaleToOptimal(): Promise<boolean>;
    scaleUp(nodeCount: number): Promise<boolean>;
    scaleDown(nodeCount: number): Promise<boolean>;
    createNode(type?: NodeInstance['type']): Promise<NodeInstance | null>;
    terminateNode(nodeId: string): Promise<boolean>;
    optimizeNodeAllocation(): Promise<boolean>;
    getDensityMetrics(): DensityMetrics | null;
    getSystemResources(): SystemResources | null;
    getNodes(): Map<string, NodeInstance>;
    getNode(nodeId: string): NodeInstance | undefined;
    getActiveNodes(): NodeInstance[];
    getScalingHistory(): ScalingEvent[];
    getPerformanceMetrics(): any;
    private getCpuUtilization;
    private getDiskSpace;
    private getContainerLimits;
    private getBottleneckResource;
    private launchNodeProcess;
    private shutdownNodeProcess;
    private restartNode;
    private updateNodeResourceUsage;
    private rebalanceWorkload;
    private startResourceMonitoring;
    private startHealthChecks;
    stop(): Promise<void>;
    private buildDockerCommand;
    private executeDockerCommand;
    private waitForNodeHealth;
    private checkDockerContainerStatus;
    private checkNodeHealthEndpoint;
    private shutdownDockerContainer;
    private removeDockerContainer;
    private ensureDockerNetwork;
    getNodeDensityStatus(): Promise<{
        systemResources: SystemResources | null;
        densityMetrics: DensityMetrics | null;
        nodes: NodeInstance[];
        scalingHistory: ScalingEvent[];
        performanceMetrics: any;
    }>;
    forceScaling(action: 'SCALE_UP' | 'SCALE_DOWN' | 'OPTIMIZE', nodeCount?: number): Promise<boolean>;
    createSpecificNode(type: NodeInstance['type'], customConfig?: Partial<NodeInstance>): Promise<NodeInstance | null>;
    getDetailedNodeMetrics(nodeId: string): Promise<any>;
    private getDockerContainerStats;
    private calculateNodeResourceEfficiency;
    private calculateNodePerformanceRating;
}
//# sourceMappingURL=OptimalNodeDensityManager.d.ts.map