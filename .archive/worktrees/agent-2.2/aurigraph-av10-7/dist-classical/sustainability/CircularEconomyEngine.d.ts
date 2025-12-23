/**
 * AV10-13: Circular Economy Engine Implementation
 * AGV9-715: Comprehensive sustainability and circular economy optimization system
 *
 * This engine implements circular economy principles for the DLT platform,
 * optimizing resource utilization, waste reduction, energy efficiency,
 * carbon footprint minimization, and sustainable asset lifecycle management.
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { AssetRegistry } from '../rwa/registry/AssetRegistry';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
export declare enum SustainabilityMetric {
    CARBON_FOOTPRINT = "CARBON_FOOTPRINT",
    ENERGY_EFFICIENCY = "ENERGY_EFFICIENCY",
    RESOURCE_UTILIZATION = "RESOURCE_UTILIZATION",
    WASTE_REDUCTION = "WASTE_REDUCTION",
    CIRCULAR_INDEX = "CIRCULAR_INDEX",
    REGENERATION_RATE = "REGENERATION_RATE",
    BIODIVERSITY_IMPACT = "BIODIVERSITY_IMPACT",
    SOCIAL_IMPACT = "SOCIAL_IMPACT"
}
export declare enum CircularStrategy {
    REDUCE = "REDUCE",// Minimize resource consumption
    REUSE = "REUSE",// Extend asset lifecycle
    RECYCLE = "RECYCLE",// Transform waste into resources
    RECOVER = "RECOVER",// Energy recovery from waste
    REDESIGN = "REDESIGN",// Optimize for circularity
    REGENERATE = "REGENERATE",// Restore natural systems
    REDISTRIBUTE = "REDISTRIBUTE",// Optimize resource allocation
    REFURBISH = "REFURBISH"
}
export declare enum SustainabilityGoal {
    CARBON_NEUTRAL = "CARBON_NEUTRAL",
    ZERO_WASTE = "ZERO_WASTE",
    RENEWABLE_ENERGY = "RENEWABLE_ENERGY",
    CIRCULAR_MATERIALS = "CIRCULAR_MATERIALS",
    BIODIVERSITY_POSITIVE = "BIODIVERSITY_POSITIVE",
    SOCIAL_EQUITY = "SOCIAL_EQUITY",
    RESILIENT_SYSTEMS = "RESILIENT_SYSTEMS"
}
export interface ResourceFlow {
    id: string;
    name: string;
    type: 'material' | 'energy' | 'data' | 'financial' | 'social';
    source: string;
    destination: string;
    quantity: number;
    unit: string;
    carbonIntensity: number;
    energyIntensity: number;
    wasteFactor: number;
    circularityScore: number;
    creationDate: Date;
    expectedLifespan: number;
    actualUtilization: number;
    recyclingPotential: number;
    environmentalImpact: Map<SustainabilityMetric, number>;
    socialImpact: {
        jobsCreated: number;
        communityBenefit: number;
        equityScore: number;
    };
    metadata: Map<string, any>;
}
export interface CircularLoop {
    id: string;
    name: string;
    description: string;
    inputs: ResourceFlow[];
    processes: CircularProcess[];
    outputs: ResourceFlow[];
    feedback: ResourceFlow[];
    efficiency: number;
    circularityIndex: number;
    impactReduction: number;
    costEffectiveness: number;
    strategies: CircularStrategy[];
    goals: SustainabilityGoal[];
    constraints: {
        maxCarbonFootprint: number;
        minEfficiency: number;
        maxCost: number;
        timeConstraints: number;
    };
    isActive: boolean;
    lastOptimized: Date;
    optimizationHistory: Array<{
        timestamp: Date;
        changes: string[];
        improvement: number;
        strategy: CircularStrategy;
    }>;
}
export interface CircularProcess {
    id: string;
    name: string;
    type: 'production' | 'consumption' | 'transformation' | 'disposal' | 'recovery';
    inputRequirements: Map<string, number>;
    outputGeneration: Map<string, number>;
    byproducts: Map<string, number>;
    energyConsumption: number;
    carbonEmissions: number;
    wasteGeneration: number;
    waterUsage: number;
    efficiency: number;
    scalability: number;
    flexibility: number;
    resilience: number;
    optimizationModel: {
        algorithm: string;
        parameters: Map<string, number>;
        trainingData: any[];
        accuracy: number;
    };
}
export interface SustainabilityReport {
    reportId: string;
    timestamp: Date;
    period: {
        start: Date;
        end: Date;
    };
    overallCircularityIndex: number;
    carbonFootprint: number;
    energyEfficiency: number;
    wasteReduction: number;
    resourceUtilization: number;
    metrics: Map<SustainabilityMetric, {
        current: number;
        target: number;
        improvement: number;
        trend: 'improving' | 'stable' | 'declining';
    }>;
    goalProgress: Map<SustainabilityGoal, {
        progress: number;
        timeToTarget: number;
        confidence: number;
    }>;
    recommendations: Array<{
        strategy: CircularStrategy;
        description: string;
        expectedImpact: number;
        implementationCost: number;
        paybackPeriod: number;
        priority: 'high' | 'medium' | 'low';
    }>;
    benchmarks: {
        industryAverage: number;
        bestPractice: number;
        platformPerformance: number;
        relativeToBenchmark: number;
    };
}
export interface CircularEconomyConfig {
    optimizationInterval: number;
    targetCircularityIndex: number;
    carbonNeutralityTarget: Date;
    enableAIOptimization: boolean;
    enablePredictiveAnalytics: boolean;
    enableRealTimeMonitoring: boolean;
    sustainabilityReportingFrequency: number;
    stakeholderNotifications: boolean;
}
export declare class CircularEconomyEngine extends EventEmitter {
    private logger;
    private quantumCrypto;
    private assetRegistry;
    private performanceMonitor;
    private config;
    private resourceFlows;
    private circularLoops;
    private circularProcesses;
    private currentMetrics;
    private sustainabilityReports;
    private optimizationInterval?;
    private monitoringInterval?;
    private optimizationModel;
    private sustainabilityGoals;
    private impactHistory;
    constructor(quantumCrypto: QuantumCryptoManagerV2, assetRegistry: AssetRegistry, performanceMonitor: PerformanceMonitor, config?: Partial<CircularEconomyConfig>);
    private initializeSustainabilityGoals;
    private initializeCircularProcesses;
    private createCircularProcess;
    private initializeResourceFlows;
    private createResourceFlow;
    private startMonitoring;
    private updateCurrentMetrics;
    private executeOptimizationCycle;
    private analyzeCurrentPerformance;
    private calculateImprovementPotential;
    private analyzeTrends;
    private calculateMetricTrend;
    private identifyOptimizationOpportunities;
    private generateOptimizationStrategies;
    private selectOptimalStrategies;
    private implementOptimizations;
    private applyStrategy;
    private optimizeEnergyConsumption;
    private implementRecyclingPrograms;
    private optimizeResourceReuse;
    private implementCircularDesign;
    private refurbishProcesses;
    private recordOptimizationImpact;
    private updateOptimizationModels;
    private calculateModelAccuracy;
    generateSustainabilityReport(): SustainabilityReport;
    private calculateImprovement;
    private getTrendDirection;
    private getPreviousMetricValue;
    private calculateGoalConfidence;
    private calculateProgressRate;
    private generateRecommendations;
    getCurrentMetrics(): Map<SustainabilityMetric, number>;
    getResourceFlows(): ResourceFlow[];
    getCircularLoops(): CircularLoop[];
    getCircularProcesses(): CircularProcess[];
    getSustainabilityReports(): SustainabilityReport[];
    getLatestReport(): SustainabilityReport | undefined;
    getImpactHistory(): typeof this.impactHistory;
    getSustainabilityGoals(): Map<SustainabilityGoal, any>;
    updateSustainabilityGoal(goal: SustainabilityGoal, config: {
        target: number;
        deadline: Date;
        priority: number;
    }): void;
    updateConfig(newConfig: Partial<CircularEconomyConfig>): void;
    getConfig(): CircularEconomyConfig;
    getOptimizationModel(): typeof this.optimizationModel;
    createCircularLoop(loopData: Partial<CircularLoop> & {
        id: string;
        name: string;
    }): Promise<CircularLoop>;
    activateCircularLoop(loopId: string): void;
    deactivateCircularLoop(loopId: string): void;
    getSystemStatus(): any;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=CircularEconomyEngine.d.ts.map