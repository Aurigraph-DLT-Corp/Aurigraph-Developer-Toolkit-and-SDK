import { EventEmitter } from 'events';
import { FeatureDefinition } from './FeatureStore';
import { StreamingDataPoint } from './RealTimePredictionPipeline';
export interface PredictiveAnalyticsConfig {
    enableQuantumOptimization: boolean;
    enableRealTimeStreaming: boolean;
    enableModelVersioning: boolean;
    enableFeatureStore: boolean;
    maxConcurrentPredictions: number;
    predictionLatencyTarget: number;
    accuracyTarget: number;
    modelUpdateFrequency: number;
    featureRefreshRate: number;
}
export interface AIInfrastructureStatus {
    components: {
        neuralEngine: boolean;
        aiOptimizer: boolean;
        quantumOptimizer: boolean;
        predictiveEngine: boolean;
        modelRegistry: boolean;
        featureStore: boolean;
        realTimePipeline: boolean;
    };
    performance: {
        totalPredictions: number;
        avgLatency: number;
        accuracy: number;
        throughput: number;
        errorRate: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        gpuUsage: number;
        diskUsage: number;
    };
    health: 'healthy' | 'degraded' | 'critical';
}
export interface IntegratedPredictionRequest {
    id: string;
    type: 'asset_valuation' | 'market_analysis' | 'risk_assessment' | 'performance_optimization' | 'anomaly_detection';
    data: Record<string, any>;
    options: {
        useQuantumOptimization?: boolean;
        useEnsemble?: boolean;
        useRealTime?: boolean;
        confidenceThreshold?: number;
        maxLatency?: number;
    };
    callback?: (result: IntegratedPredictionResult) => void;
}
export interface IntegratedPredictionResult {
    requestId: string;
    type: string;
    prediction: any;
    confidence: number;
    latency: number;
    timestamp: number;
    metadata: {
        models: string[];
        features: string[];
        optimizations: string[];
        dataQuality: number;
    };
    insights: {
        keyFactors: string[];
        recommendations: string[];
        riskLevel: 'low' | 'medium' | 'high';
        alternativeScenarios: any[];
    };
}
export declare class AV1026PredictiveAnalyticsIntegration extends EventEmitter {
    private logger;
    private isInitialized;
    private neuralEngine;
    private aiOptimizer;
    private legacyNeuralEngine;
    private quantumOptimizer;
    private predictiveEngine;
    private modelRegistry;
    private featureStore;
    private realTimePipeline;
    private config;
    private isHealthy;
    private metrics;
    constructor();
    initialize(config?: Partial<PredictiveAnalyticsConfig>): Promise<void>;
    predict(request: IntegratedPredictionRequest): Promise<IntegratedPredictionResult>;
    batchPredict(requests: IntegratedPredictionRequest[]): Promise<IntegratedPredictionResult[]>;
    processStreamingData(data: StreamingDataPoint): Promise<void>;
    trainNewModel(modelType: string, trainingData: any, configuration: any): Promise<string>;
    registerFeature(definition: Omit<FeatureDefinition, 'metadata'>): Promise<void>;
    getSystemStatus(): AIInfrastructureStatus;
    getMetrics(): {
        totalRequests: number;
        successfulPredictions: number;
        totalLatency: number;
        avgLatency: number;
        accuracy: number;
        throughput: number;
        errorCount: number;
        quantumOptimizations: number;
        realTimeProcessed: number;
        modelTrainingTime: number;
    };
    private initializeExistingInfrastructure;
    private initializeNewComponents;
    private setupIntegrations;
    private setupEventHandlers;
    private setupDataFlows;
    private setupOptimizationIntegrations;
    private setupQuantumIntegration;
    private setupAIOptimizerIntegration;
    private setupMonitoring;
    private startAutomatedOptimization;
    private validateRequest;
    private prepareFeatures;
    private selectPredictionStrategy;
    private executeQuantumOptimizedPrediction;
    private executeEnsemblePrediction;
    private executeRealTimePrediction;
    private executeStandardPrediction;
    private generateInsights;
    private updateMetrics;
    private getRequiredFeatures;
    private mapToModelType;
    private updateSystemMetrics;
    private performHealthChecks;
    private determineHealthStatus;
    private emitSystemStatus;
    private performAutomatedModelUpdate;
    private refreshFeatures;
    private handleABTestResult;
    private handleDataDrift;
    private handlePipelineAlert;
    private handleTrainingCompleted;
}
//# sourceMappingURL=AV10-26-PredictiveAnalyticsIntegration.d.ts.map