import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import { AdvancedNeuralNetworkEngine, ModelPerformance } from '../ai/AdvancedNeuralNetworkEngine';
import { DigitalTwinEngine, IoTDataPoint } from './DigitalTwinEngine';
import { IoTDataManager } from './IoTDataManager';
export interface PredictiveModel {
    id: string;
    name: string;
    type: 'forecasting' | 'anomaly_detection' | 'risk_assessment' | 'maintenance_prediction' | 'value_prediction';
    algorithm: 'lstm' | 'arima' | 'prophet' | 'transformer' | 'reinforcement_learning' | 'ensemble';
    model: tf.LayersModel | null;
    status: 'training' | 'ready' | 'updating' | 'error';
    accuracy: number;
    lastTraining: number;
    nextTraining: number;
    trainingData: number[][];
    configuration: ModelConfiguration;
    performance: ModelPerformance | null;
    quantumEnhanced: boolean;
}
export interface ModelConfiguration {
    inputFeatures: string[];
    outputFeatures: string[];
    windowSize: number;
    predictionHorizon: number;
    updateFrequency: number;
    minDataPoints: number;
    hyperparameters: Record<string, any>;
    preprocessing: PreprocessingConfig;
    postprocessing: PostprocessingConfig;
}
export interface PreprocessingConfig {
    normalization: 'minmax' | 'zscore' | 'robust' | 'none';
    missingValueStrategy: 'interpolate' | 'forward_fill' | 'drop' | 'zero';
    outlierDetection: boolean;
    outlierThreshold: number;
    featureEngineering: string[];
}
export interface PostprocessingConfig {
    confidenceThreshold: number;
    smoothing: boolean;
    ensembleMethod: 'voting' | 'weighted' | 'stacking' | 'none';
    uncertaintyQuantification: boolean;
}
export interface PredictiveInsight {
    id: string;
    assetId: string;
    timestamp: number;
    type: 'forecast' | 'anomaly' | 'risk' | 'maintenance' | 'optimization';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    confidence: number;
    impact: number;
    recommendations: string[];
    data: {
        predicted: number[];
        actual: number[];
        confidence_intervals: number[][];
        factors: string[];
        correlations: Record<string, number>;
    };
    model: string;
    horizon: number;
    metadata: Record<string, any>;
}
export interface RiskAssessment {
    assetId: string;
    timestamp: number;
    overallRisk: number;
    riskFactors: RiskFactor[];
    mitigation: MitigationStrategy[];
    prediction: {
        timeline: number[];
        riskLevels: number[];
        confidence: number[];
    };
}
export interface RiskFactor {
    factor: string;
    impact: number;
    probability: number;
    category: 'operational' | 'financial' | 'environmental' | 'technical' | 'regulatory';
    trend: 'increasing' | 'decreasing' | 'stable';
}
export interface MitigationStrategy {
    id: string;
    description: string;
    priority: number;
    cost: number;
    effectiveness: number;
    timeline: string;
    resources: string[];
}
export interface MaintenancePrediction {
    assetId: string;
    deviceId: string;
    timestamp: number;
    maintenanceType: 'preventive' | 'corrective' | 'emergency' | 'optimization';
    probability: number;
    timeToMaintenance: number;
    costEstimate: number;
    impactAssessment: {
        downtime: number;
        productionLoss: number;
        safetyRisk: number;
        operationalRisk: number;
    };
    recommendations: MaintenanceRecommendation[];
}
export interface MaintenanceRecommendation {
    action: string;
    priority: number;
    urgency: 'immediate' | 'urgent' | 'scheduled' | 'optional';
    resources: string[];
    duration: number;
    cost: number;
    benefits: string[];
}
export interface AssetValuation {
    assetId: string;
    timestamp: number;
    currentValue: number;
    predictedValue: number[];
    valueDrivers: ValueDriver[];
    volatility: number;
    confidence: number;
    timeHorizon: number[];
    scenarios: ValuationScenario[];
}
export interface ValueDriver {
    factor: string;
    contribution: number;
    trend: string;
    confidence: number;
}
export interface ValuationScenario {
    name: string;
    probability: number;
    value: number[];
    assumptions: string[];
}
export interface PredictiveAnalyticsConfiguration {
    models: {
        forecasting: {
            enabled: boolean;
            algorithms: string[];
            horizon: number;
            updateFrequency: number;
        };
        anomalyDetection: {
            enabled: boolean;
            sensitivity: number;
            algorithms: string[];
            realTime: boolean;
        };
        riskAssessment: {
            enabled: boolean;
            factors: string[];
            updateInterval: number;
            threshold: number;
        };
        maintenance: {
            enabled: boolean;
            algorithms: string[];
            leadTime: number;
            costOptimization: boolean;
        };
        valuePredicton: {
            enabled: boolean;
            factors: string[];
            marketData: boolean;
            scenarios: string[];
        };
    };
    performance: {
        maxLatency: number;
        accuracy: number;
        memory: number;
        throughput: number;
        parallelProcessing: boolean;
    };
    realTime: {
        enabled: boolean;
        streamProcessing: boolean;
        batchSize: number;
        processingInterval: number;
    };
    quantumEnhancement: {
        enabled: boolean;
        algorithms: string[];
        coherenceTime: number;
    };
    distributedProcessing: {
        enabled: boolean;
        workers: number;
        loadBalancing: boolean;
    };
}
export interface AnalyticsMetrics {
    totalModels: number;
    activeModels: number;
    predictionsMade: number;
    averageLatency: number;
    averageAccuracy: number;
    modelRetrainingCount: number;
    anomaliesDetected: number;
    riskAlertsGenerated: number;
    maintenancePredicted: number;
    valuePredictionAccuracy: number;
    processingThroughput: number;
    memoryUsage: number;
    quantumCoherence: number;
    uptime: number;
}
export interface ReinforcementLearningAgent {
    id: string;
    assetId: string;
    environment: EnvironmentState;
    policy: PolicyNetwork;
    valueFunction: ValueNetwork;
    experience: ExperienceReplay;
    performance: AgentPerformance;
}
export interface EnvironmentState {
    state: number[];
    reward: number;
    done: boolean;
    info: Record<string, any>;
}
export interface PolicyNetwork {
    model: tf.LayersModel;
    optimizer: tf.Optimizer;
    loss: number;
}
export interface ValueNetwork {
    model: tf.LayersModel;
    optimizer: tf.Optimizer;
    loss: number;
}
export interface ExperienceReplay {
    buffer: Experience[];
    capacity: number;
    batchSize: number;
}
export interface Experience {
    state: number[];
    action: number;
    reward: number;
    nextState: number[];
    done: boolean;
}
export interface AgentPerformance {
    episodeRewards: number[];
    averageReward: number;
    learningCurve: number[];
    explorationRate: number;
}
export declare class PredictiveAnalyticsEngine extends EventEmitter {
    private logger;
    private config;
    private neuralEngine;
    private digitalTwinEngine;
    private iotDataManager;
    private models;
    private insights;
    private riskAssessments;
    private maintenancePredictions;
    private assetValuations;
    private dataStream;
    private processingQueue;
    private isProcessing;
    private forecastingModels;
    private anomalyModels;
    private riskModels;
    private maintenanceModels;
    private valueModels;
    private rlAgents;
    private metrics;
    private startTime;
    private isInitialized;
    private ensembleModels;
    private quantumProcessors;
    private streamProcessors;
    constructor(config: PredictiveAnalyticsConfiguration, neuralEngine: AdvancedNeuralNetworkEngine);
    initialize(digitalTwinEngine?: DigitalTwinEngine, iotDataManager?: IoTDataManager): Promise<void>;
    private initializeForecastingModels;
    private createForecastingModel;
    private initializeAnomalyDetectionModels;
    private createAnomalyDetectionModel;
    private initializeRiskAssessmentModels;
    private createRiskAssessmentModel;
    private initializeMaintenanceModels;
    private createMaintenanceModel;
    private initializeValuePredictionModels;
    private createValuePredictionModel;
    private initializeReinforcementLearning;
    private createRLAgent;
    private initializeQuantumProcessing;
    private initializeDistributedProcessing;
    private setupDigitalTwinIntegration;
    private setupIoTDataIntegration;
    private startRealTimeProcessing;
    private processRealTimeData;
    private processBatchPredictions;
    generateForecasts(data: IoTDataPoint[]): Promise<PredictiveInsight[]>;
    private forecastValue;
    detectAnomalies(data: IoTDataPoint[]): Promise<PredictiveInsight[]>;
    private detectAnomaly;
    assessRisks(data: IoTDataPoint[]): Promise<RiskAssessment[]>;
    private assessAssetRisk;
    predictMaintenance(data: IoTDataPoint[]): Promise<MaintenancePrediction[]>;
    private predictDeviceMaintenance;
    predictValues(data: IoTDataPoint[]): Promise<AssetValuation[]>;
    private predictAssetValue;
    private startModelMaintenance;
    private performModelMaintenance;
    private retrainModel;
    private monitorModelPerformance;
    private startMetricsCollection;
    private updateMetrics;
    private prepareForecastingFeatures;
    private prepareAnomalyFeatures;
    private prepareRiskFeatures;
    private prepareMaintenanceFeatures;
    private prepareValueFeatures;
    private calculateMean;
    private calculateStdDev;
    private calculateTrend;
    private calculateVolatility;
    private calculateAnomalyScore;
    private calculateAnomalySeverity;
    private calculateAnomalyImpact;
    private generateAnomalyRecommendations;
    private calculateAnomalyCorrelations;
    private generateRiskFactors;
    private generateMitigationStrategies;
    private determineMaintenanceType;
    private estimateMaintenanceCost;
    private assessMaintenanceImpact;
    private generateMaintenanceRecommendations;
    private generateValueDrivers;
    private calculateValueVolatility;
    private generateValuationScenarios;
    private calculateConfidenceIntervals;
    private groupDataByAsset;
    private groupDataByDevice;
    private collectTrainingData;
    private prepareTrainingData;
    private getActiveModelsCount;
    private handleIoTData;
    private processAnomalyAlert;
    private processValueUpdate;
    private processDeviceAlert;
    private updateProcessingMetrics;
    private updateLatencyMetrics;
    generateInsight(assetId: string, type: PredictiveInsight['type']): Promise<PredictiveInsight | null>;
    private convertRiskToInsight;
    private convertMaintenanceToInsight;
    private generateOptimizationInsight;
    private getOptimizationFromAgent;
    private prepareRLState;
    getRiskAssessment(assetId: string): RiskAssessment | undefined;
    getMaintenancePrediction(assetId: string, deviceId: string): MaintenancePrediction | undefined;
    getAssetValuation(assetId: string): AssetValuation | undefined;
    getInsights(assetId?: string, type?: PredictiveInsight['type'], limit?: number): PredictiveInsight[];
    getMetrics(): AnalyticsMetrics;
    getModelStatus(): Array<{
        id: string;
        name: string;
        status: string;
        accuracy: number;
    }>;
    shutdown(): Promise<void>;
}
export default PredictiveAnalyticsEngine;
//# sourceMappingURL=PredictiveAnalyticsEngine.d.ts.map