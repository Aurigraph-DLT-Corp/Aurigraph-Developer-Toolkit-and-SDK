import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import { ModelPerformance } from './AdvancedNeuralNetworkEngine';
export interface ModelMetadata {
    id: string;
    name: string;
    version: string;
    type: 'asset_valuation' | 'market_trend' | 'risk_assessment' | 'performance_forecast' | 'anomaly_detection';
    algorithm: 'lstm' | 'arima' | 'prophet' | 'random_forest' | 'xgboost' | 'neural_network' | 'transformer' | 'ensemble';
    createdAt: number;
    updatedAt: number;
    author: string;
    description: string;
    tags: string[];
    status: 'active' | 'deprecated' | 'archived' | 'training' | 'testing' | 'failed';
    environment: 'development' | 'staging' | 'production';
}
export interface ModelArtifact {
    id: string;
    modelId: string;
    version: string;
    filePath: string;
    fileSize: number;
    checksum: string;
    uploadedAt: number;
    downloadCount: number;
    storageType: 'local' | 's3' | 'gcs' | 'azure';
    compressionType: 'none' | 'gzip' | 'brotli';
}
export interface ModelConfiguration {
    hyperparameters: Record<string, any>;
    architecture: {
        layers: number;
        units: number[];
        activations: string[];
        dropoutRates: number[];
    };
    training: {
        epochs: number;
        batchSize: number;
        learningRate: number;
        optimizer: string;
        lossFunction: string;
        metrics: string[];
        earlyStopping: boolean;
        patience: number;
    };
    preprocessing: {
        normalization: string;
        featureSelection: string[];
        windowSize?: number;
        targetEncoding?: string;
    };
    validation: {
        splitRatio: number;
        crossValidation: boolean;
        folds: number;
        stratified: boolean;
    };
}
export interface ModelExperiment {
    id: string;
    name: string;
    modelId: string;
    configuration: ModelConfiguration;
    performance: ModelPerformance;
    metrics: Record<string, number>;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    logs: ExperimentLog[];
    artifacts: string[];
}
export interface ExperimentLog {
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: Record<string, any>;
}
export interface ModelVersion {
    version: string;
    modelId: string;
    parentVersion?: string;
    changes: string[];
    performance: ModelPerformance;
    configuration: ModelConfiguration;
    createdAt: number;
    isActive: boolean;
    rollbackEnabled: boolean;
}
export interface ABTestConfiguration {
    id: string;
    name: string;
    modelA: string;
    modelB: string;
    trafficSplit: number;
    metrics: string[];
    startTime: number;
    endTime: number;
    status: 'draft' | 'running' | 'completed' | 'paused';
    significanceLevel: number;
    minimumSampleSize: number;
}
export interface ABTestResult {
    testId: string;
    modelA: {
        modelId: string;
        version: string;
        metrics: Record<string, number>;
        sampleSize: number;
    };
    modelB: {
        modelId: string;
        version: string;
        metrics: Record<string, number>;
        sampleSize: number;
    };
    winner: 'A' | 'B' | 'tie' | 'inconclusive';
    pValue: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    effect: number;
    recommendation: string;
    completedAt: number;
}
export interface ModelDeployment {
    id: string;
    modelId: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    endpoint: string;
    replicas: number;
    resources: {
        cpu: string;
        memory: string;
        gpu?: string;
    };
    scaling: {
        minReplicas: number;
        maxReplicas: number;
        targetCPU: number;
        targetMemory: number;
    };
    status: 'pending' | 'deploying' | 'active' | 'failed' | 'terminating';
    deployedAt: number;
    healthCheck: {
        endpoint: string;
        interval: number;
        timeout: number;
        retries: number;
    };
}
export interface ModelMonitoring {
    modelId: string;
    version: string;
    environment: string;
    metrics: {
        latency: number[];
        throughput: number[];
        errorRate: number[];
        accuracy: number[];
        drift: number[];
    };
    alerts: ModelAlert[];
    lastUpdated: number;
}
export interface ModelAlert {
    id: string;
    modelId: string;
    type: 'performance_degradation' | 'data_drift' | 'concept_drift' | 'error_spike' | 'resource_limit';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    actualValue: number;
    triggeredAt: number;
    resolvedAt?: number;
    actions: string[];
}
export declare class ModelRegistry extends EventEmitter {
    private logger;
    private isInitialized;
    private models;
    private versions;
    private artifacts;
    private configurations;
    private loadedModels;
    private experiments;
    private abTests;
    private abResults;
    private deployments;
    private monitoring;
    private alerts;
    private metrics;
    private config;
    constructor();
    initialize(): Promise<void>;
    registerModel(metadata: Omit<ModelMetadata, 'id' | 'createdAt' | 'updatedAt'>, model: tf.LayersModel, configuration: ModelConfiguration): Promise<string>;
    updateModel(modelId: string, model: tf.LayersModel, changes: string[], configuration?: ModelConfiguration): Promise<string>;
    loadModel(modelId: string, version?: string): Promise<tf.LayersModel>;
    deleteModel(modelId: string, force?: boolean): Promise<void>;
    createModelVersion(modelId: string, version: string, configuration: ModelConfiguration, changes?: string[], parentVersion?: string): Promise<void>;
    rollbackModel(modelId: string, targetVersion: string): Promise<void>;
    createExperiment(name: string, modelId: string, configuration: ModelConfiguration): Promise<string>;
    updateExperiment(experimentId: string, updates: Partial<ModelExperiment>): Promise<void>;
    logExperiment(experimentId: string, level: ExperimentLog['level'], message: string, data?: Record<string, any>): Promise<void>;
    createABTest(name: string, modelA: string, modelB: string, trafficSplit?: number, metrics?: string[], duration?: number): Promise<string>;
    startABTest(testId: string): Promise<void>;
    completeABTest(testId: string, results: Omit<ABTestResult, 'testId' | 'completedAt'>): Promise<void>;
    deployModel(modelId: string, version: string, environment: ModelDeployment['environment'], config?: Partial<ModelDeployment>): Promise<string>;
    updateModelMetrics(modelId: string, version: string, environment: string, metrics: Partial<ModelMonitoring['metrics']>): Promise<void>;
    private checkMetricAlerts;
    private createAlert;
    private getAlertActions;
    getModel(modelId: string): ModelMetadata | undefined;
    getModels(filter?: Partial<ModelMetadata>): ModelMetadata[];
    getModelVersions(modelId: string): ModelVersion[];
    getActiveVersion(modelId: string): ModelVersion | undefined;
    getExperiment(experimentId: string): ModelExperiment | undefined;
    getExperiments(modelId?: string): ModelExperiment[];
    getDeployments(environment?: string): ModelDeployment[];
    getAlerts(modelId?: string): ModelAlert[];
    getMetrics(): typeof this.metrics;
    private initializeStorage;
    private loadExistingModels;
    private startMonitoring;
    private setupCleanupTasks;
    private setupBackupSystem;
    private generateModelId;
    private generateExperimentId;
    private generateABTestId;
    private generateDeploymentId;
    private saveModelArtifact;
    private getModelArtifact;
    private incrementVersion;
    private cleanupOldVersions;
    private checkModelHealth;
    private cleanupExpiredAlerts;
    private performCleanup;
    private performBackup;
    private updateGlobalMetrics;
}
//# sourceMappingURL=ModelRegistry.d.ts.map