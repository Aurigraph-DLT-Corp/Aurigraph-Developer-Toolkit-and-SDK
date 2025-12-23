import { EventEmitter } from 'events';
import * as tf from '@tensorflow/tfjs-node';
export interface NeuralNetworkConfiguration {
    architecture: {
        inputDimensions: number[];
        hiddenLayers: number[];
        outputDimensions: number;
        activationFunction: string;
        optimizerType: string;
        learningRate: number;
        batchSize: number;
        epochs: number;
    };
    trainingConfig: {
        validationSplit: number;
        earlyStopping: boolean;
        patience: number;
        verbose: number;
        shuffle: boolean;
        callbacks: string[];
    };
    distributedTraining: {
        enabled: boolean;
        workers: number;
        parallelization: string;
        allReduce: boolean;
        gradientCompression: boolean;
    };
    quantumIntegration: {
        enabled: boolean;
        quantumLayers: number;
        entanglementDepth: number;
        quantumOptimizer: boolean;
    };
    performanceTargets: {
        accuracy: number;
        trainingTime: number;
        inferenceTime: number;
        memoryUsage: number;
        throughput: number;
    };
}
export interface NetworkArchitecture {
    layers: LayerDefinition[];
    connections: ConnectionDefinition[];
    optimizers: OptimizerDefinition[];
    lossFunction: string;
    metrics: string[];
}
export interface LayerDefinition {
    name: string;
    type: 'dense' | 'conv2d' | 'lstm' | 'attention' | 'transformer' | 'quantum' | 'residual';
    units?: number;
    activation?: string;
    inputShape?: number[];
    filters?: number;
    kernelSize?: number[];
    strides?: number[];
    padding?: string;
    dropout?: number;
    batchNorm?: boolean;
    quantumGates?: string[];
    attentionHeads?: number;
    feedForward?: number;
}
export interface ConnectionDefinition {
    from: string;
    to: string;
    weight?: number;
    trainable?: boolean;
    regularization?: string;
}
export interface OptimizerDefinition {
    type: 'adam' | 'sgd' | 'rmsprop' | 'adamw' | 'quantum-adam' | 'evolutionary';
    learningRate: number;
    beta1?: number;
    beta2?: number;
    epsilon?: number;
    momentum?: number;
    decay?: number;
    clipNorm?: number;
    quantumEnhanced?: boolean;
}
export interface TrainingMetrics {
    epoch: number;
    loss: number;
    accuracy: number;
    validationLoss?: number;
    validationAccuracy?: number;
    learningRate: number;
    batchTime: number;
    memoryUsage: number;
    gradientNorm: number;
    quantumCoherence?: number;
}
export interface PredictionResult {
    predictions: number[][];
    confidence: number[];
    uncertainty: number[];
    quantumCoherence?: number;
    inferenceTime: number;
    modelVersion: string;
}
export interface ModelPerformance {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    loss: number;
    trainingTime: number;
    inferenceTime: number;
    modelSize: number;
    parameterCount: number;
    flops: number;
    memoryUsage: number;
    quantumEfficiency?: number;
}
export declare class AdvancedNeuralNetworkEngine extends EventEmitter {
    private logger;
    private config;
    private isInitialized;
    private isTraining;
    private model;
    private architecture;
    private trainingHistory;
    private modelPerformance;
    private quantumLayers;
    private distributedStrategy;
    private evolutionaryOptimizer;
    private attentionMechanisms;
    private transferLearningModels;
    private gpuAcceleration;
    private tpuAcceleration;
    private quantization;
    private pruning;
    private knowledgeDistillation;
    private inferencePipeline;
    private batchProcessor;
    private streamProcessor;
    constructor(config?: Partial<NeuralNetworkConfiguration>);
    initialize(): Promise<void>;
    trainModel(trainData: tf.Tensor, trainLabels: tf.Tensor, validationData?: {
        data: tf.Tensor;
        labels: tf.Tensor;
    }): Promise<ModelPerformance>;
    predict(inputData: tf.Tensor): Promise<PredictionResult>;
    transferLearning(sourceModelPath: string, targetLayers: string[], freezeLayers?: boolean): Promise<void>;
    optimizeModel(): Promise<void>;
    saveModel(path: string): Promise<void>;
    loadModel(path: string): Promise<void>;
    getModelInfo(): {
        config: NeuralNetworkConfiguration;
        architecture: NetworkArchitecture | null;
        performance: ModelPerformance | null;
        trainingHistory: TrainingMetrics[];
        isTraining: boolean;
    };
    performHyperparameterOptimization(searchSpace: Record<string, any>, trials?: number): Promise<any>;
    private initializeTensorFlowBackend;
    private setupHardwareAcceleration;
    private setupDistributedTraining;
    private setupQuantumIntegration;
    private createNetworkArchitecture;
    private buildModel;
    private createLayer;
    private createOptimizer;
    private setupAdvancedOptimizers;
    private setupInferencePipeline;
    private setupPerformanceMonitoring;
    private createTrainingCallbacks;
    private storeTrainingHistory;
    private evaluateModelPerformance;
    private calculateConfidence;
    private estimateUncertainty;
    private trainWithQuantumEnhancement;
    private predictWithQuantumEnhancement;
    private calculateAdvancedMetrics;
    private calculateModelSize;
    private calculateFLOPs;
    private calculateMemoryUsage;
    private getModelVersion;
    private rebuildModelWithTransferLayers;
    private applyQuantization;
    private applyPruning;
    private applyKnowledgeDistillation;
    private optimizeInferencePipeline;
    private saveModelMetadata;
    private loadModelMetadata;
    private sampleHyperparameters;
    private updateConfigWithHyperparams;
}
//# sourceMappingURL=AdvancedNeuralNetworkEngine.d.ts.map