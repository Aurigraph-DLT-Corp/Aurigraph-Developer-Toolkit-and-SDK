/**
 * Advanced Neural Network Engine for Aurigraph DLT Platform
 * Provides deep learning capabilities for consensus optimization, performance prediction,
 * asset valuation, and autonomous decision making.
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
export declare enum NetworkType {
    FEED_FORWARD = "FEED_FORWARD",
    CONVOLUTIONAL = "CONVOLUTIONAL",
    RECURRENT = "RECURRENT",
    LSTM = "LSTM",
    GRU = "GRU",
    TRANSFORMER = "TRANSFORMER",
    GAN = "GAN",
    AUTOENCODER = "AUTOENCODER",
    QUANTUM_NEURAL = "QUANTUM_NEURAL"
}
export declare enum ActivationFunction {
    RELU = "RELU",
    LEAKY_RELU = "LEAKY_RELU",
    SIGMOID = "SIGMOID",
    TANH = "TANH",
    SOFTMAX = "SOFTMAX",
    SWISH = "SWISH",
    GELU = "GELU",
    QUANTUM_ACTIVATION = "QUANTUM_ACTIVATION"
}
export declare enum LossFunction {
    MEAN_SQUARED_ERROR = "MEAN_SQUARED_ERROR",
    CROSS_ENTROPY = "CROSS_ENTROPY",
    BINARY_CROSS_ENTROPY = "BINARY_CROSS_ENTROPY",
    HUBER_LOSS = "HUBER_LOSS",
    QUANTUM_LOSS = "QUANTUM_LOSS"
}
export declare enum OptimizerType {
    SGD = "SGD",
    ADAM = "ADAM",
    ADAMW = "ADAMW",
    RMSprop = "RMSprop",
    ADAGRAD = "ADAGRAD",
    QUANTUM_OPTIMIZER = "QUANTUM_OPTIMIZER"
}
export interface NeuralLayer {
    id: string;
    type: 'dense' | 'conv2d' | 'lstm' | 'gru' | 'attention' | 'quantum';
    inputSize: number;
    outputSize: number;
    activation: ActivationFunction;
    weights: Float32Array;
    biases: Float32Array;
    gradients?: {
        weights: Float32Array;
        biases: Float32Array;
    };
    dropout?: number;
    batchNormalization?: boolean;
    quantumEntanglement?: boolean;
}
export interface NetworkArchitecture {
    id: string;
    name: string;
    type: NetworkType;
    layers: NeuralLayer[];
    optimizer: OptimizerType;
    lossFunction: LossFunction;
    learningRate: number;
    batchSize: number;
    epochs: number;
    regularization?: {
        l1: number;
        l2: number;
        dropout: number;
    };
    quantumEnhanced: boolean;
}
export interface TrainingData {
    inputs: Float32Array[];
    targets: Float32Array[];
    weights?: Float32Array[];
    metadata?: Map<string, any>;
}
export interface TrainingMetrics {
    epoch: number;
    loss: number;
    accuracy: number;
    valLoss?: number;
    valAccuracy?: number;
    learningRate: number;
    timestamp: Date;
    convergence?: number;
}
export interface PredictionResult {
    predictions: Float32Array;
    confidence: number;
    uncertainty?: Float32Array;
    quantumProbabilities?: Float32Array;
    attention?: Float32Array[];
    metadata?: Map<string, any>;
}
export interface ModelExport {
    architecture: NetworkArchitecture;
    weights: {
        layerId: string;
        weights: number[];
        biases: number[];
    }[];
    trainingHistory: TrainingMetrics[];
    version: string;
    checksum: string;
    quantumSignature?: string;
}
export declare class NeuralNetworkEngine extends EventEmitter {
    private logger;
    private quantumCrypto?;
    private networks;
    private trainingHistory;
    private activeTraining;
    private computeContext;
    private transferLearning;
    private ensembleModels;
    private continualLearning;
    constructor(quantumCrypto?: QuantumCryptoManagerV2, useGPU?: boolean);
    private initializeWebGL;
    private initializeQuantumProcessor;
    private initializeBuiltInNetworks;
    private createLayer;
    createNetwork(architecture: NetworkArchitecture): void;
    trainNetwork(networkId: string, trainingData: TrainingData, validationData?: TrainingData, callbacks?: {
        onEpochComplete?: (epoch: number, metrics: TrainingMetrics) => void;
        onTrainingComplete?: (history: TrainingMetrics[]) => void;
        onBatchComplete?: (batch: number, loss: number) => void;
    }): Promise<TrainingMetrics[]>;
    private trainEpoch;
    private shuffleIndices;
    private forwardPass;
    private computeLayerActivation;
    private computeDenseLayer;
    private computeConvolutionalLayer;
    private computeLSTMLayer;
    private computeGRULayer;
    private computeAttentionLayer;
    private computeQuantumLayer;
    private applyActivation;
    private sigmoid;
    private tanh;
    private calculateLoss;
    private calculateAccuracy;
    private backwardPass;
    private updateWeights;
    private updateWeightsSGD;
    private updateWeightsAdam;
    private updateWeightsRMSprop;
    private updateWeightsQuantum;
    private shouldEarlyStop;
    private calculateConvergence;
    predict(networkId: string, inputs: Float32Array[]): Promise<PredictionResult>;
    private calculateQuantumProbabilities;
    getNetwork(networkId: string): NetworkArchitecture | undefined;
    getAllNetworks(): NetworkArchitecture[];
    getTrainingHistory(networkId: string): TrainingMetrics[];
    stopTraining(networkId: string): void;
    exportModel(networkId: string): Promise<ModelExport>;
    private calculateModelChecksum;
    private hashWeights;
    importModel(modelData: ModelExport): Promise<void>;
    getSystemStatus(): any;
    cleanup(): void;
}
//# sourceMappingURL=NeuralNetworkEngine.d.ts.map