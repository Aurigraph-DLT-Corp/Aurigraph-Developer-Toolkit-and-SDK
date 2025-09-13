import { EventEmitter } from 'events';
import { PredictiveAnalyticsEngine } from './PredictiveAnalyticsEngine';
import { ModelRegistry } from './ModelRegistry';
import { FeatureStore } from './FeatureStore';
export interface StreamingDataPoint {
    id: string;
    timestamp: number;
    entityId: string;
    data: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    type: 'market_data' | 'asset_data' | 'transaction' | 'iot_sensor' | 'user_action';
}
export interface PredictionRequest {
    requestId: string;
    entityId: string;
    modelType: 'asset_valuation' | 'market_trend' | 'risk_assessment' | 'performance_forecast' | 'anomaly_detection';
    features: Record<string, any>;
    options: {
        ensemble: boolean;
        confidence: boolean;
        explanation: boolean;
        caching: boolean;
    };
    callback?: (result: PredictionResult) => void;
}
export interface PredictionResult {
    requestId: string;
    entityId: string;
    modelType: string;
    prediction: any;
    confidence: number;
    latency: number;
    timestamp: number;
    explanation?: ModelExplanation;
    metadata: {
        modelVersion: string;
        featureVersion: string;
        processingNode: string;
        cacheHit: boolean;
    };
}
export interface ModelExplanation {
    featureImportance: Record<string, number>;
    shap: Record<string, number>;
    confidence: {
        factors: string[];
        score: number;
        range: {
            min: number;
            max: number;
        };
    };
    alternatives: Array<{
        prediction: any;
        probability: number;
    }>;
}
export interface StreamingWindow {
    windowId: string;
    size: number;
    overlap: number;
    data: StreamingDataPoint[];
    aggregations: Record<string, number>;
    lastUpdate: number;
}
export interface PipelineStage {
    name: string;
    type: 'filter' | 'transform' | 'aggregate' | 'predict' | 'enrich' | 'validate';
    function: (data: any) => Promise<any>;
    parallel: boolean;
    batchSize: number;
    timeout: number;
    retries: number;
}
export interface PipelineMetrics {
    throughput: number;
    latency: {
        p50: number;
        p95: number;
        p99: number;
        avg: number;
    };
    accuracy: number;
    errorRate: number;
    cacheHitRate: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        gpu: number;
    };
    queueDepth: number;
    backpressure: boolean;
}
export interface CircuitBreaker {
    name: string;
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    state: 'closed' | 'open' | 'half_open';
    failures: number;
    successes: number;
    lastFailureTime: number;
}
export declare class RealTimePredictionPipeline extends EventEmitter {
    private logger;
    private isInitialized;
    private analyticsEngine;
    private modelRegistry;
    private featureStore;
    private inputQueue;
    private predictionQueue;
    private resultQueue;
    private streamingWindows;
    private windowProcessors;
    private stages;
    private workers;
    private predictionCache;
    private featureCache;
    private modelCache;
    private circuitBreakers;
    private healthChecks;
    private metrics;
    private config;
    constructor(analyticsEngine: PredictiveAnalyticsEngine, modelRegistry: ModelRegistry, featureStore: FeatureStore);
    initialize(): Promise<void>;
    processStreamingData(dataPoint: StreamingDataPoint): Promise<void>;
    makePrediction(request: PredictionRequest): Promise<PredictionResult>;
    batchPredict(requests: PredictionRequest[]): Promise<PredictionResult[]>;
    getStreamingWindow(windowId: string): StreamingWindow | undefined;
    createStreamingWindow(windowId: string, size?: number, overlap?: number): void;
    addPipelineStage(stage: PipelineStage): void;
    removePipelineStage(stageName: string): void;
    getMetrics(): PipelineMetrics;
    getQueueDepth(): number;
    getCircuitBreakerStatus(): Record<string, string>;
    private setupPipelineStages;
    private initializeStreamingWindows;
    private setupCircuitBreakers;
    private createCircuitBreaker;
    private startWorkers;
    private createWorker;
    private getWorkerProcessor;
    private startProcessingLoop;
    private startMonitoring;
    private setupHealthChecks;
    private processImmediately;
    private updateStreamingWindows;
    private getRelevantWindows;
    private updateWindowAggregations;
    private processWindow;
    private analyzeWindowData;
    private detectTrend;
    private detectStreamingAnomalies;
    private executeStage;
    private validateData;
    private enrichFeatures;
    private transformFeatures;
    private executePrediction;
    private generateCacheKey;
    private generatePrediction;
    private calculateConfidence;
    private generateExplanation;
    private inferModelType;
    private getRequiredFeatures;
    private applyFeatureTransformations;
    private processInputQueue;
    private processPredictionQueue;
    private processResultQueue;
    private updateMetrics;
    private calculateThroughput;
    private updateLatencyMetrics;
    private updateErrorRate;
    private updateCacheMetrics;
    private updateResourceUsage;
    private updatePredictionMetrics;
    private recordSuccess;
    private recordFailure;
    private checkCircuitBreakers;
    private performHealthChecks;
    private cleanupCaches;
    private emitMetrics;
}
//# sourceMappingURL=RealTimePredictionPipeline.d.ts.map