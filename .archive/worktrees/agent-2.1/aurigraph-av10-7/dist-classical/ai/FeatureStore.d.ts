import { EventEmitter } from 'events';
export interface FeatureDefinition {
    name: string;
    type: 'numerical' | 'categorical' | 'text' | 'timestamp' | 'boolean';
    description: string;
    source: string;
    transformation?: FeatureTransformation;
    validation?: FeatureValidation;
    metadata: FeatureMetadata;
}
export interface FeatureTransformation {
    type: 'normalize' | 'standardize' | 'log' | 'sqrt' | 'polynomial' | 'one_hot' | 'embedding' | 'binning' | 'rolling' | 'diff' | 'lag';
    parameters: Record<string, any>;
    dependencies: string[];
    code?: string;
}
export interface FeatureValidation {
    required: boolean;
    minValue?: number;
    maxValue?: number;
    allowedValues?: any[];
    regex?: string;
    customValidation?: string;
}
export interface FeatureMetadata {
    createdAt: number;
    updatedAt: number;
    version: string;
    owner: string;
    tags: string[];
    dataQuality: {
        completeness: number;
        uniqueness: number;
        consistency: number;
        validity: number;
    };
    usage: {
        models: string[];
        lastUsed: number;
        usageCount: number;
    };
}
export interface FeatureGroup {
    name: string;
    description: string;
    features: string[];
    source: DataSource;
    refreshSchedule?: string;
    retentionDays: number;
    version: string;
    status: 'active' | 'deprecated' | 'archived';
}
export interface DataSource {
    type: 'database' | 'api' | 'file' | 'stream' | 'kafka' | 's3';
    connection: Record<string, any>;
    query?: string;
    schema: Record<string, string>;
    updateFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}
export interface FeatureVector {
    entityId: string;
    timestamp: number;
    features: Record<string, any>;
    version: string;
    computedAt: number;
}
export interface FeatureStatistics {
    featureName: string;
    count: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    percentiles?: Record<string, number>;
    nullCount: number;
    uniqueCount: number;
    distribution: Record<string, number>;
    correlations?: Record<string, number>;
    drift?: DriftMetrics;
}
export interface DriftMetrics {
    psiScore: number;
    klDivergence: number;
    wasserstein: number;
    drift: boolean;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
}
export interface FeatureLineage {
    featureName: string;
    upstream: string[];
    downstream: string[];
    transformations: FeatureTransformation[];
    dataflow: DataFlowNode[];
}
export interface DataFlowNode {
    id: string;
    type: 'source' | 'transformation' | 'aggregation' | 'join' | 'filter' | 'sink';
    operation: string;
    parameters: Record<string, any>;
    dependencies: string[];
}
export interface FeatureRequest {
    features: string[];
    entities: string[];
    timestamp?: number;
    pointInTime?: boolean;
    format: 'dataframe' | 'tensor' | 'json' | 'csv';
}
export interface FeatureResponse {
    data: any;
    metadata: {
        features: string[];
        entities: string[];
        timestamp: number;
        version: string;
        computationTime: number;
    };
}
export interface TechnicalIndicator {
    name: string;
    type: 'momentum' | 'trend' | 'volatility' | 'volume' | 'overlap';
    period: number;
    parameters: Record<string, any>;
    calculation: (data: number[], params: any) => number[];
}
export declare class FeatureStore extends EventEmitter {
    private logger;
    private isInitialized;
    private featureDefinitions;
    private featureGroups;
    private featureStatistics;
    private featureLineage;
    private featureCache;
    private dataCache;
    private computedFeatures;
    private streamProcessors;
    private realTimeFeatures;
    private eventQueue;
    private technicalIndicators;
    private config;
    private metrics;
    constructor();
    initialize(): Promise<void>;
    registerFeature(definition: Omit<FeatureDefinition, 'metadata'>): Promise<void>;
    createFeatureGroup(name: string, description: string, features: string[], source: DataSource): Promise<void>;
    computeFeatures(featureNames: string[], entityId: string, timestamp?: number, rawData?: Record<string, any>): Promise<FeatureVector>;
    batchComputeFeatures(featureNames: string[], entityIds: string[], timestamp?: number): Promise<FeatureVector[]>;
    getFeatures(request: FeatureRequest): Promise<FeatureResponse>;
    processRealTimeEvent(event: Record<string, any>): Promise<void>;
    calculateRSI(prices: number[], period?: number): number[];
    calculateMACD(prices: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
        macd: number[];
        signal: number[];
        histogram: number[];
    };
    calculateBollingerBands(prices: number[], period?: number, stdDev?: number): {
        upper: number[];
        middle: number[];
        lower: number[];
    };
    createPolynomialFeatures(values: number[], degree?: number): number[][];
    createInteractionFeatures(feature1: number[], feature2: number[]): number[];
    createRollingFeatures(values: number[], window: number, operation?: 'mean' | 'std' | 'min' | 'max' | 'sum'): number[];
    createLagFeatures(values: number[], lags: number[]): Record<string, number[]>;
    calculateFeatureStatistics(featureName: string): Promise<FeatureStatistics>;
    detectDataDrift(featureName: string, referenceData: number[], currentData: number[]): Promise<DriftMetrics>;
    getFeatureDefinition(name: string): FeatureDefinition | undefined;
    getFeatureDefinitions(filter?: Partial<FeatureDefinition>): FeatureDefinition[];
    getFeatureGroup(name: string): FeatureGroup | undefined;
    getFeatureStatistics(name: string): FeatureStatistics | undefined;
    getFeatureLineage(name: string): FeatureLineage | undefined;
    getMetrics(): typeof this.metrics;
    private initializeStorage;
    private loadFeatureDefinitions;
    private initializeTechnicalIndicators;
    private setupRealTimeProcessing;
    private startMonitoring;
    private initializeFeaturePipelines;
    private computeSingleFeature;
    private getRawData;
    private applyTransformation;
    private normalize;
    private standardize;
    private calculateRollingMean;
    private storeFeatureVector;
    private updateMetrics;
    private formatFeatureResponse;
    private convertToTensor;
    private convertToCSV;
    private processEventQueue;
    private processEvent;
    private getRelevantFeatures;
    private isFeatureRelevant;
    private performQualityChecks;
    private updatePerformanceMetrics;
    private cleanupCache;
    private initializeFeatureStatistics;
    private initializeFeatureLineage;
    private getFeatureData;
    private calculateSMA;
    private calculateEMA;
    private calculatePSI;
    private calculateKLDivergence;
    private calculateWassersteinDistance;
    private createBins;
    private createHistogram;
}
//# sourceMappingURL=FeatureStore.d.ts.map