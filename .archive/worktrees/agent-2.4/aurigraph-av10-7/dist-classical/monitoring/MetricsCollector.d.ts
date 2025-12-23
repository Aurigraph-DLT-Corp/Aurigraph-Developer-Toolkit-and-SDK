import { EventEmitter } from 'events';
export interface MetricPoint {
    timestamp: number;
    value: number;
    metadata?: Record<string, any>;
}
export interface TimeSeriesMetric {
    name: string;
    modelId?: string;
    dataPoints: MetricPoint[];
    aggregations: {
        mean: number;
        median: number;
        stdDev: number;
        min: number;
        max: number;
        percentiles: Record<number, number>;
    };
}
export interface DriftAnalysis {
    modelId: string;
    hasDrift: boolean;
    driftType: 'data' | 'concept' | 'prediction';
    driftScore: number;
    threshold: number;
    confidence: number;
    description: string;
    recommendations: string[];
    affectedFeatures: string[];
    impactedPredictions: number;
    comparisonWindow: {
        baseline: {
            start: number;
            end: number;
        };
        current: {
            start: number;
            end: number;
        };
    };
    statisticalTests: {
        ks_test: {
            statistic: number;
            pValue: number;
        };
        chi_square: {
            statistic: number;
            pValue: number;
        };
        kl_divergence: number;
        psi: number;
        wasserstein_distance: number;
    };
}
export interface PerformanceMetrics {
    modelId: string;
    timestamp: number;
    predictions: {
        total: number;
        successful: number;
        failed: number;
        avgLatency: number;
        throughput: number;
    };
    accuracy: {
        overall: number;
        byClass: Record<string, number>;
        confusionMatrix: number[][];
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        gpuUsage?: number;
        diskIO: number;
        networkIO: number;
    };
    errors: {
        rate: number;
        types: Record<string, number>;
        criticalErrors: number;
    };
}
export interface FeatureMonitoring {
    featureName: string;
    modelId: string;
    statistics: {
        current: FeatureStatistics;
        baseline: FeatureStatistics;
        drift: {
            score: number;
            threshold: number;
            isDrifting: boolean;
            method: 'psi' | 'kl_divergence' | 'wasserstein' | 'ks_test';
        };
    };
    qualityMetrics: {
        completeness: number;
        uniqueness: number;
        consistency: number;
        validity: number;
        freshness: number;
    };
    alerts: FeatureAlert[];
}
export interface FeatureStatistics {
    count: number;
    mean: number;
    median: number;
    mode: number | string;
    stdDev: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    min: number;
    max: number;
    quartiles: [number, number, number];
    percentiles: Record<number, number>;
    nullCount: number;
    uniqueCount: number;
    distribution: Record<string | number, number>;
    entropy: number;
}
export interface FeatureAlert {
    type: 'drift' | 'quality' | 'anomaly' | 'schema';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    threshold: number;
    actualValue: number;
    recommendation: string;
}
export interface ModelHealthScore {
    modelId: string;
    overallScore: number;
    components: {
        accuracy: {
            score: number;
            weight: number;
        };
        latency: {
            score: number;
            weight: number;
        };
        throughput: {
            score: number;
            weight: number;
        };
        stability: {
            score: number;
            weight: number;
        };
        drift: {
            score: number;
            weight: number;
        };
        resourceEfficiency: {
            score: number;
            weight: number;
        };
    };
    trend: 'improving' | 'stable' | 'degrading';
    recommendations: string[];
    alertLevel: 'none' | 'info' | 'warning' | 'critical';
}
export interface AlertRule {
    id: string;
    name: string;
    modelId?: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq' | 'ne' | 'in_range' | 'out_range';
    threshold: number | [number, number];
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldownPeriod: number;
    actions: AlertAction[];
    lastTriggered?: number;
}
export interface AlertAction {
    type: 'email' | 'webhook' | 'auto_retrain' | 'scale_resources' | 'log';
    config: Record<string, any>;
}
export interface MetricsCollectorConfig {
    collectionInterval: number;
    retentionDays: number;
    batchSize: number;
    driftDetection: {
        enabled: boolean;
        windowSize: number;
        threshold: number;
        methods: string[];
    };
    alerting: {
        enabled: boolean;
        rules: AlertRule[];
    };
    featureMonitoring: {
        enabled: boolean;
        trackingInterval: number;
        qualityThresholds: Record<string, number>;
    };
}
export declare class MetricsCollector extends EventEmitter {
    private logger;
    private isStarted;
    private timeSeriesData;
    private performanceMetrics;
    private featureMonitoring;
    private modelHealthScores;
    private alertRules;
    private baselineData;
    private referenceDistributions;
    private metricsCollectionInterval;
    private driftDetectionInterval;
    private healthScoreInterval;
    private alertCheckInterval;
    private config;
    private collectionStats;
    constructor();
    start(): Promise<void>;
    collectMetric(name: string, value: number, modelId?: string, metadata?: Record<string, any>): Promise<void>;
    collectPerformanceMetrics(modelId: string, metrics: Omit<PerformanceMetrics, 'modelId' | 'timestamp'>): Promise<void>;
    monitorFeature(featureName: string, modelId: string, values: number[], baseline?: number[]): Promise<void>;
    analyzeDrift(modelId: string, currentData?: any[], baselineData?: any[]): Promise<DriftAnalysis>;
    calculateModelHealthScore(modelId: string): Promise<ModelHealthScore>;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): void;
    private checkAlerts;
    private triggerAlert;
    private executeAlertAction;
    getMetric(name: string, modelId?: string): TimeSeriesMetric | undefined;
    getModelHealthScore(modelId: string): ModelHealthScore | undefined;
    getFeatureMonitoring(featureName: string, modelId: string): FeatureMonitoring | undefined;
    getCollectionStats(): any;
    getMetricsReport(modelId?: string, timeRange?: {
        start: number;
        end: number;
    }): Promise<any>;
    private initializeDefaultAlertRules;
    private startMetricsCollection;
    private startDriftDetection;
    private startHealthScoreCalculation;
    private startAlertChecking;
    private performPeriodicMaintenance;
    private updateAggregations;
    private calculateFeatureStatistics;
    private calculateFeatureDrift;
    private calculateFeatureQuality;
    private generateFeatureAlerts;
    private performStatisticalTests;
    private calculateDriftScores;
    private aggregateDriftScores;
    private calculatePSI;
    private calculateKLDivergence;
    private calculateWassersteinDistance;
    private performKSTest;
    private performKSTestTensorFlow;
    private calculateAccuracyScore;
    private calculateLatencyScore;
    private calculateThroughputScore;
    private calculateStabilityScore;
    private calculateDriftHealthScore;
    private calculateResourceEfficiencyScore;
    private calculateResourceScore;
    private calculateCoefficientOfVariation;
    private calculateHistogram;
    private calculateMedian;
    private calculateMode;
    private calculateQuartiles;
    private calculatePercentiles;
    private calculateSkewness;
    private calculateKurtosis;
    private calculateDistribution;
    private calculateEntropy;
    private calculateConsistency;
    private calculateValidity;
    private getRecentModelData;
    private getRecentPerformanceMetrics;
    private createEmptyFeatureStatistics;
    private createNoDriftAnalysis;
    private createErrorDriftAnalysis;
    private createDefaultHealthScore;
    private identifyDriftType;
    private calculateDriftConfidence;
    private generateDriftDescription;
    private generateDriftRecommendations;
    private identifyAffectedFeatures;
    private estimateImpactedPredictions;
    private calculateHealthTrend;
    private generateHealthRecommendations;
    private determineAlertLevel;
    private evaluateAlertCondition;
    private sendWebhook;
    stop(): Promise<void>;
}
//# sourceMappingURL=MetricsCollector.d.ts.map