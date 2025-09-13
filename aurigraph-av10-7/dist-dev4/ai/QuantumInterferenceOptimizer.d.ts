import { EventEmitter } from 'events';
import { PredictionResult } from './AdvancedNeuralNetworkEngine';
export interface QuantumInterferencePattern {
    patternId: string;
    dimensions: number;
    amplitudes: Float32Array;
    phases: Float32Array;
    constructiveNodes: number[];
    destructiveNodes: number[];
    coherenceMatrix: Float32Array;
    entanglementMap: Map<string, number>;
    optimality: number;
    timestamp: number;
}
export interface RealityPath {
    pathId: string;
    dimensions: string[];
    probability: number;
    stability: number;
    interferenceScore: number;
    quantumWeight: number;
    predictedOutcome: any;
    confidence: number;
    alternativePaths: string[];
    mlPrediction: PredictionResult;
}
export interface QuantumState {
    stateId: string;
    superposition: Complex[];
    entangled: boolean;
    measured: boolean;
    coherenceTime: number;
    fidelity: number;
    decoherenceRate: number;
    quantumNumbers: number[];
    waveFunction: Float32Array;
    probability: number;
}
export interface Complex {
    real: number;
    imaginary: number;
}
export interface OptimizationResult {
    optimizedPattern: QuantumInterferencePattern;
    selectedReality: RealityPath;
    performanceGain: number;
    convergenceTime: number;
    confidenceScore: number;
    alternatives: RealityPath[];
    mlInsights: any;
}
export interface QuantumAnalytics {
    interferenceEfficiency: number;
    realitySelectionAccuracy: number;
    quantumCoherence: number;
    decoherenceRate: number;
    optimizationConvergence: number;
    mlModelPerformance: number;
    predictiveAccuracy: number;
    adaptationRate: number;
    dimensionalStability: number;
    parallelUniverseUtilization: number;
}
export interface ReinforcementLearningConfig {
    agentType: 'DQN' | 'A3C' | 'PPO' | 'SAC' | 'DDPG';
    stateSpaceDimensions: number;
    actionSpaceDimensions: number;
    learningRate: number;
    discountFactor: number;
    explorationRate: number;
    explorationDecay: number;
    memorySize: number;
    batchSize: number;
    targetUpdateFrequency: number;
    episodeLength: number;
    quantumRewardFunction: string;
}
export interface QuantumErrorCorrection {
    errorSyndromes: Float32Array;
    correctionCodes: Uint8Array;
    logicalQubits: number;
    physicalQubits: number;
    threshold: number;
    correctionRate: number;
    stabilizers: Float32Array;
    recoveryOperations: string[];
}
export interface PredictiveModel {
    modelId: string;
    modelType: 'LSTM' | 'Transformer' | 'CNN' | 'GAN' | 'VAE';
    inputShape: number[];
    outputShape: number[];
    accuracy: number;
    loss: number;
    trainingEpochs: number;
    predictionHorizon: number;
    confidence: number;
    lastUpdated: number;
}
export declare class QuantumInterferenceOptimizer extends EventEmitter {
    private logger;
    private neuralEngine;
    private isInitialized;
    private isOptimizing;
    private interferencePredictor;
    private realitySelector;
    private quantumStateOptimizer;
    private decoherencePredictor;
    private errorCorrector;
    private rlAgent;
    private rlConfig;
    private interferencePatterns;
    private realityPaths;
    private quantumStates;
    private optimizationHistory;
    private analytics;
    private performanceMetrics;
    private predictionCache;
    private optimizationQueue;
    private quantumMemoryBank;
    private adaptiveController;
    private multiUniverseCoordinator;
    private quantumDashboard;
    constructor();
    private initializeAnalytics;
    private initializeMetrics;
    initialize(): Promise<void>;
    private buildInterferencePredictionModel;
    private buildRealitySelectionModel;
    private buildQuantumStateOptimizer;
    private buildDecoherencePredictor;
    private buildErrorCorrectionModel;
    private initializeRLAgent;
    optimizeInterferencePattern(inputPattern: Partial<QuantumInterferencePattern>): Promise<OptimizationResult>;
    private encodeInterferencePattern;
    private extractRealityFeatures;
    private createOptimizedPattern;
    private createOptimalReality;
    private calculatePerformanceGain;
    private generateMLInsights;
    private calculateAmplitudeImprovement;
    private calculatePhaseAlignment;
    private calculateCoherenceEnhancement;
    private calculateEntanglementEntropy;
    private generateAlternativeRealities;
    selectOptimalReality(realities: RealityPath[]): Promise<RealityPath>;
    private calculateSelectionAccuracy;
    predictQuantumState(currentState: Partial<QuantumState>, timeHorizon?: number): Promise<QuantumState>;
    private encodeQuantumState;
    private decodeQuantumState;
    private prepareDecoherenceInput;
    private extractStateFeatures;
    private calculatePredictionAccuracy;
    performAutonomousErrorCorrection(errorSyndrome: QuantumErrorCorrection): Promise<QuantumErrorCorrection>;
    private prepareSyndromeImage;
    private decodeCorrectionOperations;
    private applyCorrectionOperations;
    private calculateCorrectionEffectiveness;
    private updateAnalytics;
    private cacheOptimizationResult;
    private startOptimizationEngine;
    private processOptimizationTask;
    private startPerformanceMonitoring;
    private collectPerformanceMetrics;
    private logPerformanceMetrics;
    private startAdaptivelearning;
    private retrainModelsIfNeeded;
    private adaptiveRetraining;
    private generateTrainingDataFromResults;
    private startRealTimeAnalytics;
    private quantumInterferenceLoss;
    private quantumStateLoss;
    private quantumCoherenceMetric;
    private realityStabilityMetric;
    private quantumFidelityMetric;
    private generateInterferenceTrainingData;
    private generateRealityTrainingData;
    private generateQuantumStateTrainingData;
    private generateDecoherenceTrainingData;
    private generateErrorCorrectionTrainingData;
    private loadPreTrainedModels;
    private handleRLAction;
    private handleRLEpisode;
    getAnalytics(): Promise<QuantumAnalytics>;
    getPerformanceMetrics(): Promise<QuantumPerformanceMetrics>;
    getOptimizationHistory(limit?: number): Promise<OptimizationResult[]>;
    addOptimizationTask(pattern: Partial<QuantumInterferencePattern>, priority?: number, callback?: (error: Error | null, result: OptimizationResult | null) => void): Promise<void>;
    clearOptimizationQueue(): Promise<void>;
    exportModel(modelName: string, path: string): Promise<void>;
    shutdown(): Promise<void>;
}
interface QuantumPerformanceMetrics {
    optimizationsPerSecond: number;
    averageOptimizationTime: number;
    realitySelectionLatency: number;
    interferenceCalculationTime: number;
    mlInferenceTime: number;
    memoryUsage: number;
    gpuUtilization: number;
    quantumEfficiency: number;
    cacheHitRate: number;
    parallelProcessingUtilization: number;
}
export default QuantumInterferenceOptimizer;
//# sourceMappingURL=QuantumInterferenceOptimizer.d.ts.map