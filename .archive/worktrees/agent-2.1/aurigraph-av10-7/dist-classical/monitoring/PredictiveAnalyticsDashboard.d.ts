import { PredictiveAnalyticsEngine } from '../ai/PredictiveAnalyticsEngine';
import { MetricsCollector } from './MetricsCollector';
export interface MLModelMetrics {
    modelId: string;
    modelType: 'asset_valuation' | 'market_trend' | 'risk_assessment' | 'performance_forecast' | 'anomaly_detection';
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingTime: number;
    lastUpdate: number;
    predictionLatency: number;
    throughput: number;
    errorRate: number;
    driftScore: number;
    confidenceDistribution: number[];
    featureImportance: Record<string, number>;
}
export interface PredictionMetrics {
    totalPredictions: number;
    successfulPredictions: number;
    failedPredictions: number;
    avgLatency: number;
    medianLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughputPerSecond: number;
    cacheHitRate: number;
    concurrentRequests: number;
    queueLength: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface ModelDriftAlert {
    modelId: string;
    driftType: 'data' | 'concept' | 'prediction';
    severity: 'low' | 'medium' | 'high' | 'critical';
    driftScore: number;
    threshold: number;
    detectedAt: number;
    description: string;
    recommendations: string[];
    autoRemediation: boolean;
    affectedFeatures: string[];
    impactedPredictions: number;
}
export interface FeatureAnalytics {
    featureName: string;
    importance: number;
    stability: number;
    correlation: number;
    distribution: {
        mean: number;
        median: number;
        stdDev: number;
        min: number;
        max: number;
        percentiles: Record<string, number>;
    };
    driftMetrics: {
        kl_divergence: number;
        psi: number;
        wasserstein_distance: number;
    };
    categoricalStats?: {
        uniqueValues: string[];
        frequencies: Record<string, number>;
        entropy: number;
    };
}
export interface RealTimeAnalytics {
    timestamp: number;
    activeModels: number;
    totalPredictions: number;
    avgAccuracy: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
    alertCount: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    resourceUsage: {
        cpu: number;
        memory: number;
        gpu?: number;
        disk: number;
    };
    networkMetrics: {
        requestsPerSecond: number;
        responseTime: number;
        errorRate: number;
    };
}
export interface AnalyticsDashboardConfig {
    refreshInterval: number;
    alertThresholds: {
        accuracy: number;
        latency: number;
        driftScore: number;
        errorRate: number;
    };
    visualization: {
        chartUpdateInterval: number;
        dataRetentionDays: number;
        maxDataPoints: number;
    };
    realTimeFeatures: {
        enabled: boolean;
        batchSize: number;
        streamingInterval: number;
    };
}
export declare class PredictiveAnalyticsDashboard {
    private logger;
    private app;
    private server;
    private wss;
    private clients;
    private analyticsEngine;
    private metricsCollector;
    private modelMetrics;
    private predictionMetrics;
    private driftAlerts;
    private featureAnalytics;
    private realTimeAnalytics;
    private historicalData;
    private metricsInterval;
    private alertCheckInterval;
    private driftDetectionInterval;
    private clientBroadcastInterval;
    private config;
    private performanceMetrics;
    constructor(analyticsEngine: PredictiveAnalyticsEngine, metricsCollector: MetricsCollector);
    private initializePredictionMetrics;
    private initializeRealTimeAnalytics;
    private setupRoutes;
    private setupEventListeners;
    start(port?: number): Promise<void>;
    private startBackgroundProcesses;
    private collectAndUpdateMetrics;
    private collectModelMetrics;
    private updateModelMetrics;
    private checkForAlerts;
    private performDriftDetection;
    private createAlert;
    private handleDriftAlert;
    private executeAutoRemediation;
    private handleDataDrift;
    private handleConceptDrift;
    private handlePredictionDrift;
    private broadcastToClients;
    private broadcastAlert;
    private sendInitialData;
    private handleWebSocketMessage;
    private handleGetModelDetails;
    private getDashboardHTML;
    private calculateAvgAccuracy;
    private assessSystemHealth;
    private getAlertCounts;
    private getResourceUsage;
    private getNetworkMetrics;
    private updateHistoricalData;
    private inferModelType;
    private calculateModelAccuracy;
    private calculateModelPrecision;
    private calculateModelRecall;
    private calculateF1Score;
    private getModelLatency;
    private getModelThroughput;
    private getModelErrorRate;
    private calculateDriftScore;
    private getConfidenceDistribution;
    private getFeatureImportance;
    private storeHistoricalDataPoint;
    private discoverNewModels;
    private getTopDriftingFeatures;
    private categorizeDriftSeverity;
    private getRecentPredictions;
    private getModelPerformanceTrend;
    private triggerModelRetrain;
    private updateFeaturePreprocessing;
    private optimizeModelHyperparameters;
    private finetuneModel;
    private acknowledgeAlert;
    private updateConfig;
    private updatePredictionMetrics;
    private updatePerformanceMetrics;
    stop(): Promise<void>;
}
//# sourceMappingURL=PredictiveAnalyticsDashboard.d.ts.map