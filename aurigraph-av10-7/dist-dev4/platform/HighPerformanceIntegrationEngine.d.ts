import { EventEmitter } from 'events';
export interface IntegrationMetrics {
    performanceStats: {
        averageLatency: number;
        peakThroughput: number;
        currentTPS: number;
        memoryUsage: number;
        cpuUtilization: number;
        networkBandwidth: number;
    };
    securityStats: {
        quantumOperationsPerSec: number;
        ntruOperationsPerSec: number;
        encryptionLatency: number;
        keyRotationCount: number;
        threatDetectionCount: number;
        complianceScore: number;
    };
    consensusStats: {
        blockConfirmationTime: number;
        validatorParticipation: number;
        consensusAccuracy: number;
        forkResolutionTime: number;
        networkSynchronization: number;
    };
    aiOptimizationStats: {
        optimizationCycles: number;
        performanceGains: number;
        predictionAccuracy: number;
        resourceOptimization: number;
        anomalyDetectionRate: number;
    };
}
export interface PlatformConfiguration {
    performanceTargets: {
        targetTPS: number;
        maxLatency: number;
        minUptime: number;
        memoryLimit: number;
        cpuThreshold: number;
    };
    securityRequirements: {
        encryptionStrength: number;
        keyRotationInterval: number;
        quantumResistance: boolean;
        auditCompliance: boolean;
        threatDetection: boolean;
    };
    scalingParameters: {
        autoScaling: boolean;
        loadBalancing: boolean;
        failoverEnabled: boolean;
        replicationFactor: number;
        shardingEnabled: boolean;
    };
    monitoringConfig: {
        metricsInterval: number;
        alertThresholds: Record<string, number>;
        dashboardEnabled: boolean;
        logLevel: string;
        auditEnabled: boolean;
    };
}
export interface ComponentHealth {
    componentName: string;
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DOWN';
    lastHealthCheck: number;
    responseTime: number;
    errorRate: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    customMetrics?: Record<string, any>;
}
export interface IntegrationEvent {
    eventType: string;
    source: string;
    timestamp: number;
    data: any;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    tags?: string[];
}
export declare class HighPerformanceIntegrationEngine extends EventEmitter {
    private logger;
    private config;
    private isInitialized;
    private isRunning;
    private quantumCrypto;
    private ntruEngine;
    private consensus;
    private dltNode;
    private prometheusExporter;
    private aiOptimizer;
    private metrics;
    private componentHealth;
    private eventHistory;
    private performanceOptimizer;
    private loadBalancer;
    private autoScaler;
    private healthChecker;
    constructor(config?: Partial<PlatformConfiguration>);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getIntegrationMetrics(): Promise<IntegrationMetrics>;
    getComponentHealth(): Promise<Map<string, ComponentHealth>>;
    getSystemStatus(): Promise<{
        status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DOWN';
        uptime: number;
        metrics: IntegrationMetrics;
        componentHealth: ComponentHealth[];
        recentEvents: IntegrationEvent[];
    }>;
    optimizePerformance(): Promise<void>;
    scaleResources(direction: 'UP' | 'DOWN', factor?: number): Promise<void>;
    private initializeMetrics;
    private initializeCoreComponents;
    private setupPerformanceOptimization;
    private setupLoadBalancingAndScaling;
    private setupMonitoringAndHealthChecks;
    private setupEventHandling;
    private startIntegrationServices;
    private startCoreComponents;
    private startPerformanceMonitoring;
    private activateOptimization;
    private enableAutoScaling;
    private startHealthMonitoring;
    private updateComponentHealth;
    private emitIntegrationEvent;
    private updatePerformanceMetrics;
    private performHealthChecks;
    private checkScalingTriggers;
    private startCrossComponentCommunication;
    private startDataSynchronization;
    private startSecurityCoordination;
    private applyOptimizations;
    private scaleUp;
    private scaleDown;
    private stopCoreComponents;
    private stopPerformanceMonitoring;
    private deactivateOptimization;
    private disableAutoScaling;
    private stopHealthMonitoring;
    private getUptime;
    private handlePerformanceDegradation;
    private handleSecurityThreat;
    private handleComponentFailure;
    private handleScalingTrigger;
}
//# sourceMappingURL=HighPerformanceIntegrationEngine.d.ts.map