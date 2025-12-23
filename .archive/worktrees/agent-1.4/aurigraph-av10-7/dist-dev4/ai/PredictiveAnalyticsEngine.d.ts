import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
import { AdvancedNeuralNetworkEngine } from './AdvancedNeuralNetworkEngine';
export interface AssetValuationModel {
    id: string;
    assetClass: string;
    model: tf.LayersModel;
    features: string[];
    accuracy: number;
    lastUpdate: number;
    predictions: Map<string, AssetValuationPrediction>;
}
export interface AssetValuationPrediction {
    assetId: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    horizon: number;
    factors: Record<string, number>;
    timestamp: number;
    volatility: number;
    trend: 'bullish' | 'bearish' | 'neutral';
}
export interface MarketTrendAnalysis {
    marketId: string;
    timeframe: string;
    patterns: MarketPattern[];
    sentiment: number;
    volatility: number;
    volume: number;
    support: number;
    resistance: number;
    prediction: 'up' | 'down' | 'sideways';
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
}
export interface MarketPattern {
    type: 'head_and_shoulders' | 'triangle' | 'flag' | 'cup_and_handle' | 'double_top' | 'double_bottom';
    confidence: number;
    duration: number;
    target: number;
    breakoutLevel: number;
    isComplete: boolean;
}
export interface RiskAssessment {
    portfolioId: string;
    overallRisk: number;
    riskFactors: RiskFactor[];
    concentration: number;
    correlation: number;
    volatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
    sortino: number;
    beta: number;
    var: number;
    expectedShortfall: number;
    recommendations: string[];
}
export interface RiskFactor {
    type: 'market' | 'credit' | 'liquidity' | 'operational' | 'regulatory' | 'technical';
    level: number;
    impact: number;
    probability: number;
    description: string;
    mitigation: string[];
}
export interface PerformanceForecast {
    systemId: string;
    metric: string;
    current: number;
    predicted: number;
    horizon: number;
    confidence: number;
    factors: string[];
    optimizations: OptimizationRecommendation[];
    alertThreshold: number;
}
export interface OptimizationRecommendation {
    type: 'scaling' | 'caching' | 'indexing' | 'architecture' | 'hardware';
    priority: number;
    impact: number;
    effort: number;
    description: string;
    implementation: string;
}
export interface AnomalyDetection {
    id: string;
    type: 'fraud' | 'error' | 'performance' | 'security' | 'data_quality';
    severity: number;
    confidence: number;
    description: string;
    affectedEntities: string[];
    rootCause: string;
    recommendations: string[];
    autoRemediation: boolean;
    timestamp: number;
}
export interface MLModelConfig {
    type: 'lstm' | 'arima' | 'prophet' | 'random_forest' | 'xgboost' | 'neural_network' | 'transformer' | 'ensemble';
    parameters: Record<string, any>;
    features: string[];
    target: string;
    windowSize: number;
    horizon: number;
    updateFrequency: number;
    validationSplit: number;
    earlyStoppingPatience: number;
}
export interface FeatureEngineering {
    rawFeatures: string[];
    engineeredFeatures: string[];
    transformations: FeatureTransformation[];
    selectionCriteria: string[];
    importance: Record<string, number>;
}
export interface FeatureTransformation {
    name: string;
    type: 'polynomial' | 'log' | 'sqrt' | 'interaction' | 'rolling' | 'diff' | 'seasonal' | 'technical_indicator';
    parameters: Record<string, any>;
    inputFeatures: string[];
    outputFeature: string;
}
export interface PredictionPipeline {
    id: string;
    name: string;
    models: string[];
    preprocessing: string[];
    postprocessing: string[];
    ensemble: boolean;
    realtime: boolean;
    batchSize: number;
    latencyTarget: number;
    throughputTarget: number;
}
export declare class PredictiveAnalyticsEngine extends EventEmitter {
    private logger;
    private isInitialized;
    private neuralEngine;
    private assetValuationModels;
    private marketTrendModels;
    private riskAssessmentModels;
    private performanceModels;
    private anomalyModels;
    private predictionCache;
    private modelPerformanceCache;
    private featureStore;
    private streamingPipelines;
    private realTimeQueue;
    private batchProcessor;
    private config;
    private metrics;
    constructor(neuralEngine: AdvancedNeuralNetworkEngine);
    initialize(): Promise<void>;
    predictAssetValuation(assetId: string, assetClass: string, features: Record<string, number>, horizon?: number): Promise<AssetValuationPrediction>;
    analyzeMarketTrends(marketId: string, timeframe: string, historicalData: number[][]): Promise<MarketTrendAnalysis>;
    assessRisk(portfolioId: string, assets: Array<{
        id: string;
        weight: number;
        returns: number[];
        value: number;
    }>): Promise<RiskAssessment>;
    forecastPerformance(systemId: string, metric: string, historicalData: number[], horizon?: number): Promise<PerformanceForecast>;
    detectAnomalies(dataPoints: Record<string, number>[], threshold?: number): Promise<AnomalyDetection[]>;
    ensemblePrediction(modelTypes: string[], features: Record<string, number>, predictionType: 'asset_valuation' | 'market_trend' | 'risk_assessment' | 'performance_forecast'): Promise<any>;
    processRealTimeStream(data: Record<string, any>): Promise<void>;
    updateModel(modelId: string, newModelData: tf.LayersModel): Promise<void>;
    getModelPerformance(): Promise<Record<string, any>>;
    private initializeAssetValuationModels;
    private initializeMarketTrendModels;
    private initializeRiskAssessmentModels;
    private initializePerformanceModels;
    private initializeAnomalyDetectionModels;
    private createAssetValuationModel;
    private createMarketTrendModel;
    private createRiskAssessmentModel;
    private createPerformanceModel;
    private createAnomalyDetectionModel;
    private createCreditRiskModel;
    private createFraudDetectionModel;
    private setupFeatureEngineering;
    private setupTechnicalIndicators;
    private setupTemporalFeatures;
    private setupStatisticalFeatures;
    private setupStreamingPipelines;
    private startRealTimeProcessing;
    private processBatch;
    private processRealTimeItem;
    private setupPerformanceMonitoring;
    private prepareFeatures;
    private calculatePredictionConfidence;
    private calculateVolatility;
    private analyzeTrend;
    private extractPredictionFactors;
    private cacheResult;
    private updateMetrics;
    private detectMarketPatterns;
    private calculateMarketSentiment;
    private calculateMarketVolatility;
    private calculateAverageVolume;
    private calculateSupportResistance;
    private interpretTrendPrediction;
    private assessMarketRisk;
    private calculatePortfolioReturns;
    private calculateCorrelationMatrix;
    private calculateConcentration;
    private calculatePortfolioVolatility;
    private calculateMaxDrawdown;
    private calculateSharpeRatio;
    private calculateSortinoRatio;
    private calculateBeta;
    private calculateVaR;
    private calculateExpectedShortfall;
    private identifyRiskFactors;
    private generateRiskRecommendations;
    private averageCorrelation;
    private createSequences;
    private calculateForecastConfidence;
    private calculateVariance;
    private identifyPerformanceFactors;
    private generateOptimizationRecommendations;
    private calculateAlertThreshold;
    private classifyAnomalyType;
    private calculateAnomalySeverity;
    private identifyRootCause;
    private generateAnomalyRecommendations;
    private generateAnomalyDescription;
    private identifyAffectedEntities;
    private predictWithSpecificModel;
    private combineEnsemblePredictions;
    private weightedAverage;
    private majorityVoting;
    private stackingCombination;
    private clearModelCache;
    private getAssetClassFeatures;
    getSystemStatus(): {
        status: string;
        modelsActive: number;
        predictionsToday: number;
        uptime: number;
    };
    getAllModels(): any[];
    getFeatureStore(): Map<string, any>;
    getPerformanceMetrics(): any;
    assessPortfolioRisk(portfolioId: string, assets: any[], riskProfile: string): Promise<any>;
    initializeAssetModels(assetId: string, assetType: string, metadata: any): Promise<void>;
    processRealtimeData(assetId: string, telemetry: any, timestamp: number): Promise<void>;
    applyQuantumOptimizations(assetId: string, optimizations: any): Promise<void>;
    retrainModel(modelId: string, trainingData: any, hyperparameters: any): Promise<void>;
    private calculateCacheHitRate;
    private calculateAverageLatency;
    private startTime;
}
//# sourceMappingURL=PredictiveAnalyticsEngine.d.ts.map