/**
 * Carbon Negative Operations Engine for Aurigraph DLT Platform
 * Implements comprehensive carbon negativity operations including carbon capture,
 * sequestration, offset management, renewable energy integration, and net-negative targeting.
 *
 * AV10-12: AGV9-714: Carbon Negative Operations Engine Implementation
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { CircularEconomyEngine } from './CircularEconomyEngine';
import { NeuralNetworkEngine } from '../ai/NeuralNetworkEngine';
export declare enum CarbonOperationType {
    DIRECT_CAPTURE = "DIRECT_CAPTURE",
    BIOLOGICAL_SEQUESTRATION = "BIOLOGICAL_SEQUESTRATION",
    GEOLOGICAL_STORAGE = "GEOLOGICAL_STORAGE",
    OCEAN_CAPTURE = "OCEAN_CAPTURE",
    MINERALIZATION = "MINERALIZATION",
    RENEWABLE_GENERATION = "RENEWABLE_GENERATION",
    EFFICIENCY_OPTIMIZATION = "EFFICIENCY_OPTIMIZATION",
    CARBON_UTILIZATION = "CARBON_UTILIZATION"
}
export declare enum CarbonCreditType {
    REMOVAL_CREDIT = "REMOVAL_CREDIT",
    AVOIDANCE_CREDIT = "AVOIDANCE_CREDIT",
    REDUCTION_CREDIT = "REDUCTION_CREDIT",
    NATURE_BASED = "NATURE_BASED",
    TECHNOLOGY_BASED = "TECHNOLOGY_BASED",
    HYBRID = "HYBRID"
}
export declare enum SequestrationMethod {
    FOREST_MANAGEMENT = "FOREST_MANAGEMENT",
    SOIL_ENHANCEMENT = "SOIL_ENHANCEMENT",
    BIOCHAR_APPLICATION = "BIOCHAR_APPLICATION",
    ALGAE_CULTIVATION = "ALGAE_CULTIVATION",
    DIRECT_AIR_CAPTURE = "DIRECT_AIR_CAPTURE",
    ENHANCED_WEATHERING = "ENHANCED_WEATHERING",
    BLUE_CARBON = "BLUE_CARBON",
    INDUSTRIAL_CAPTURE = "INDUSTRIAL_CAPTURE",
    GEOLOGICAL_STORAGE = "GEOLOGICAL_STORAGE"
}
export declare enum RenewableEnergyType {
    SOLAR_PV = "SOLAR_PV",
    WIND_ONSHORE = "WIND_ONSHORE",
    WIND_OFFSHORE = "WIND_OFFSHORE",
    HYDROELECTRIC = "HYDROELECTRIC",
    GEOTHERMAL = "GEOTHERMAL",
    BIOMASS = "BIOMASS",
    HYDROGEN = "HYDROGEN",
    NUCLEAR = "NUCLEAR"
}
export interface CarbonBudget {
    id: string;
    scope: 'global' | 'platform' | 'node' | 'transaction' | 'process';
    totalBudget: number;
    remainingBudget: number;
    usedBudget: number;
    startDate: Date;
    endDate: Date;
    currentPeriod: string;
    emissionTarget: number;
    removalTarget: number;
    netTarget: number;
    actualEmissions: number;
    actualRemovals: number;
    netCarbon: number;
    projectedNet: number;
    isExceeded: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    daysToExceedance: number;
    allocation: Map<string, {
        allocated: number;
        consumed: number;
        remaining: number;
        efficiency: number;
    }>;
}
export interface CarbonOperation {
    id: string;
    type: CarbonOperationType;
    name: string;
    description: string;
    capacity: number;
    currentRate: number;
    efficiency: number;
    uptime: number;
    cost: number;
    revenue: number;
    roi: number;
    paybackPeriod: number;
    carbonImpact: number;
    energyRequirement: number;
    waterUsage: number;
    landUse: number;
    location: {
        latitude: number;
        longitude: number;
        country: string;
        region: string;
    };
    isActive: boolean;
    startDate: Date;
    lastMaintenance: Date;
    performanceHistory: Array<{
        timestamp: Date;
        carbonRate: number;
        efficiency: number;
        issues: string[];
    }>;
    connectedSystems: string[];
    dataStreams: Map<string, any>;
    verificationStandard: string;
    lastVerification: Date;
    certificationLevel: string;
    monitoringFrequency: number;
    metadata: Map<string, any>;
}
export interface CarbonCredit {
    id: string;
    type: CarbonCreditType;
    method: SequestrationMethod;
    quantity: number;
    vintage: number;
    price: number;
    currency: string;
    standard: string;
    registry: string;
    certificateNumber: string;
    verifier: string;
    verificationDate: Date;
    projectId: string;
    projectName: string;
    projectType: string;
    geography: {
        country: string;
        region: string;
        coordinates: [number, number];
    };
    issuanceDate: Date;
    expiryDate?: Date;
    retirementDate?: Date;
    status: 'active' | 'retired' | 'cancelled' | 'expired';
    currentOwner: string;
    originalOwner: string;
    transferHistory: Array<{
        from: string;
        to: string;
        timestamp: Date;
        price: number;
        quantity: number;
    }>;
    cobenefits: {
        biodiversity: number;
        waterQuality: number;
        soilHealth: number;
        airQuality: number;
        socialImpact: number;
        economicDevelopment: number;
    };
    riskProfile: {
        permanence: number;
        additionality: number;
        leakage: number;
        reversal: number;
    };
}
export interface RenewableEnergySource {
    id: string;
    type: RenewableEnergyType;
    name: string;
    installedCapacity: number;
    currentGeneration: number;
    capacityFactor: number;
    annualGeneration: number;
    location: {
        latitude: number;
        longitude: number;
        elevation: number;
        timezone: string;
    };
    efficiency: number;
    availability: number;
    degradation: number;
    lifespan: number;
    lcoe: number;
    capex: number;
    opex: number;
    carbonAvoidance: number;
    waterUsage: number;
    landUse: number;
    materialIntensity: Map<string, number>;
    storageCapacity: number;
    gridIntegration: boolean;
    demandResponse: boolean;
    smartGridEnabled: boolean;
    weatherDependency: number;
    predictabilityScore: number;
    forecastAccuracy: number;
    isOperational: boolean;
    maintenanceSchedule: Date[];
    performanceHistory: Array<{
        timestamp: Date;
        generation: number;
        efficiency: number;
        weather: any;
    }>;
}
export interface CarbonSink {
    id: string;
    type: 'natural' | 'engineered' | 'hybrid';
    method: SequestrationMethod;
    totalCapacity: number;
    currentStored: number;
    sequestrationRate: number;
    permanence: number;
    area: number;
    location: {
        latitude: number;
        longitude: number;
        depth?: number;
        ecosystem?: string;
    };
    measurementMethods: string[];
    monitoringFrequency: number;
    lastMeasurement: Date;
    verificationProtocol: string;
    biodiversityIndex: number;
    waterCycleImpact: number;
    soilHealthImprovement: number;
    airQualityImprovement: number;
    riskAssessment: {
        climateRisk: number;
        geologicalRisk: number;
        biologicalRisk: number;
        managementRisk: number;
    };
    developmentCost: number;
    maintenanceCost: number;
    revenueGeneration: number;
    sequestrationHistory: Array<{
        timestamp: Date;
        carbonStored: number;
        rate: number;
        conditions: any;
    }>;
    isActive: boolean;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}
export interface NetZeroStrategy {
    id: string;
    name: string;
    scope: string;
    targetDate: Date;
    baselineEmissions: number;
    currentEmissions: number;
    targetEmissions: number;
    emissionReductionRate: number;
    requiredRemovals: number;
    plannedRemovals: number;
    removalCapacity: number;
    milestones: Array<{
        date: Date;
        emissionTarget: number;
        removalTarget: number;
        netTarget: number;
        progress: number;
        achieved: boolean;
    }>;
    emissionReductions: Array<{
        activity: string;
        sector: string;
        reductionPotential: number;
        cost: number;
        timeframe: string;
        implementation: number;
    }>;
    removalProjects: Array<{
        projectId: string;
        method: SequestrationMethod;
        capacity: number;
        cost: number;
        timeline: string;
        riskLevel: string;
    }>;
    totalInvestment: number;
    annualCost: number;
    carbonPrice: number;
    financingStrategy: string;
    risks: Array<{
        type: string;
        probability: number;
        impact: number;
        mitigation: string;
    }>;
    progress: {
        emissionReduction: number;
        removalDevelopment: number;
        overall: number;
        confidence: number;
    };
}
export interface CarbonNegativeMetrics {
    totalEmissions: number;
    totalRemovals: number;
    netCarbon: number;
    carbonIntensity: number;
    removalEfficiency: number;
    energyEfficiency: number;
    operationalCarbon: number;
    embodiedCarbon: number;
    carbonReductionRate: number;
    removalCapacityGrowth: number;
    netZeroProgress: number;
    carbonNegativeProgress: number;
    carbonCostPerTransaction: number;
    carbonROI: number;
    carbonPriceRealized: number;
    renewableEnergyPercentage: number;
    carbonOperationsUptime: number;
    verificationRate: number;
    offsetRatio: number;
}
export declare class CarbonNegativeOperationsEngine extends EventEmitter {
    private logger;
    private quantumCrypto?;
    private circularEconomy?;
    private neuralNetwork?;
    private carbonBudgets;
    private carbonOperations;
    private carbonCredits;
    private renewableEnergy;
    private carbonSinks;
    private netZeroStrategies;
    private config;
    private metrics;
    private isRunning;
    private budgetCycle;
    private operationsCycle;
    private optimizationCycle;
    private reportingCycle;
    constructor(quantumCrypto?: QuantumCryptoManagerV2, circularEconomy?: CircularEconomyEngine, neuralNetwork?: NeuralNetworkEngine);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initializeCarbonBudgets;
    private initializeCarbonOperations;
    private initializeRenewableEnergy;
    private initializeCarbonSinks;
    private initializeNetZeroStrategies;
    private initializeAIModels;
    private startOperationalCycles;
    private updateCarbonBudgets;
    private calculateCurrentEmissions;
    private calculateCurrentRemovals;
    private projectFutureNetCarbon;
    private assessBudgetRisk;
    private calculateDaysToExceedance;
    private monitorCarbonOperations;
    private calculateOperationEfficiency;
    private calculateOperationUptime;
    private checkMaintenanceNeeds;
    private monitorRenewableEnergy;
    private calculateRenewableGeneration;
    private getSimulatedWeather;
    private monitorCarbonSinks;
    private calculateSinkSequestrationRate;
    private getHealthFactor;
    private assessSinkHealth;
    private getSinkConditions;
    private optimizeCarbonOperations;
    private optimizeOperationParameters;
    private optimizeRenewableEnergyDispatch;
    private optimizeCarbonSinkManagement;
    private updateNetZeroProgress;
    private performAIOptimization;
    private generateAITrainingData;
    private applyAIRecommendations;
    private applyEmissionReductionMeasures;
    private applyRemovalOptimizations;
    private updatePlatformMetrics;
    private generatePerformanceReport;
    private generateRecommendations;
    registerCarbonOperation(operation: Omit<CarbonOperation, 'id' | 'performanceHistory' | 'dataStreams' | 'metadata'>): Promise<string>;
    createCarbonCredit(credit: Omit<CarbonCredit, 'id' | 'transferHistory'>): Promise<string>;
    addRenewableEnergySource(source: Omit<RenewableEnergySource, 'id' | 'performanceHistory'>): Promise<string>;
    registerCarbonSink(sink: Omit<CarbonSink, 'id' | 'sequestrationHistory'>): Promise<string>;
    getCarbonMetrics(): CarbonNegativeMetrics;
    getCarbonBudgets(): Map<string, CarbonBudget>;
    getCarbonOperations(): Map<string, CarbonOperation>;
    getRenewableEnergySources(): Map<string, RenewableEnergySource>;
    getCarbonSinks(): Map<string, CarbonSink>;
    getNetZeroStrategies(): Map<string, NetZeroStrategy>;
    getEngineStatus(): any;
    private generateFinalReport;
    private persistOperationalData;
}
//# sourceMappingURL=CarbonNegativeOperationsEngine.d.ts.map