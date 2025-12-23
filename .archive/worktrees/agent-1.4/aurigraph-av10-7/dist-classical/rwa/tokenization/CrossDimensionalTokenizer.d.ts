/**
 * AV10-10: Cross-Dimensional Tokenizer Implementation
 * AGV9-712: Advanced multi-dimensional asset tokenization system
 *
 * This tokenizer enables tokenization of assets that exist across multiple
 * dimensions, reality layers, and conceptual spaces. It supports physical,
 * digital, conceptual, temporal, and quantum-probabilistic assets.
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { AssetRegistry } from '../registry/AssetRegistry';
export declare enum DimensionType {
    PHYSICAL = "PHYSICAL",// Real-world physical assets
    DIGITAL = "DIGITAL",// Pure digital assets
    CONCEPTUAL = "CONCEPTUAL",// Ideas, IP, concepts
    TEMPORAL = "TEMPORAL",// Time-based assets
    QUANTUM = "QUANTUM",// Quantum state assets
    PROBABILISTIC = "PROBABILISTIC",// Probability-based assets
    HYBRID = "HYBRID"
}
export declare enum RealityLayer {
    BASE_REALITY = "BASE_REALITY",// Physical world
    AUGMENTED = "AUGMENTED",// AR layer
    VIRTUAL = "VIRTUAL",// VR/Metaverse
    DIGITAL_TWIN = "DIGITAL_TWIN",// IoT/Digital twins
    CONCEPTUAL_SPACE = "CONCEPTUAL_SPACE",// Abstract concepts
    QUANTUM_SPACE = "QUANTUM_SPACE"
}
export interface DimensionalCoordinate {
    dimension: DimensionType;
    layer: RealityLayer;
    coordinates: number[];
    confidence: number;
    entanglement?: string[];
}
export interface CrossDimensionalAsset {
    id: string;
    name: string;
    description: string;
    dimensions: DimensionalCoordinate[];
    primaryDimension: DimensionType;
    primaryLayer: RealityLayer;
    properties: Map<string, Map<DimensionType, any>>;
    quantumState?: {
        superposition: boolean;
        entangled: boolean;
        coherence: number;
        measurementHistory: Array<{
            dimension: DimensionType;
            timestamp: Date;
            result: any;
            observer: string;
        }>;
    };
    temporalProperties?: {
        timeDependent: boolean;
        temporalAnchors: Array<{
            timestamp: Date;
            dimension: DimensionType;
            state: any;
        }>;
        futureProjections: Array<{
            timestamp: Date;
            probability: number;
            projectedState: any;
        }>;
    };
    interactions: Array<{
        targetAssetId: string;
        interactionType: 'ENTANGLEMENT' | 'REFLECTION' | 'PROJECTION' | 'RESONANCE';
        strength: number;
        dimensions: DimensionType[];
    }>;
    creator: string;
    creationDate: Date;
    lastModified: Date;
    version: string;
    integrity: {
        hash: string;
        quantumSignature?: string;
        zkProof?: any;
    };
}
export interface CrossDimensionalToken {
    tokenId: string;
    assetId: string;
    dimensionalValue: Map<DimensionType, {
        value: number;
        currency: string;
        confidence: number;
    }>;
    dimensionalOwnership: Map<DimensionType, {
        owner: string;
        shares: number;
        restrictions: string[];
    }>;
    behaviorRules: {
        crossDimensionalTransfer: boolean;
        quantumSuperposition: boolean;
        temporalStaking: boolean;
        probabilisticSplitting: boolean;
        dimensionalCollapse: {
            enabled: boolean;
            triggerConditions: string[];
            collapseTarget: DimensionType;
        };
    };
    tokenStandard: string;
    mintDate: Date;
    totalSupply: number;
    currentSupply: number;
    quantumProperties?: {
        entangledTokens: string[];
        coherenceTime: number;
        decoherenceRate: number;
    };
}
export interface DimensionalTransactionRequest {
    from: string;
    to: string;
    tokenId: string;
    amount: number;
    sourceDimension: DimensionType;
    targetDimension: DimensionType;
    preserveQuantumState?: boolean;
    temporalLock?: {
        lockUntil: Date;
        releaseConditions: string[];
    };
    probabilityDistribution?: {
        outcomes: Array<{
            dimension: DimensionType;
            probability: number;
            amount: number;
        }>;
    };
}
export interface TokenizationConfig {
    enableQuantumSuperposition: boolean;
    enableTemporalProjection: boolean;
    enableProbabilisticSplitting: boolean;
    maxDimensions: number;
    decoherenceProtection: boolean;
    quantumErrorCorrection: boolean;
}
export declare class CrossDimensionalTokenizer extends EventEmitter {
    private logger;
    private quantumCrypto;
    private assetRegistry;
    private zkProofSystem;
    private config;
    private crossDimensionalAssets;
    private crossDimensionalTokens;
    private dimensionalTransactions;
    private quantumStates;
    private entanglementRegistry;
    private coherenceMonitor?;
    private dimensionalPhysics;
    constructor(quantumCrypto: QuantumCryptoManagerV2, assetRegistry: AssetRegistry, config?: Partial<TokenizationConfig>);
    private initializeDimensionalPhysics;
    private getDimensionalStability;
    private getCoherenceDecayRate;
    private getEntanglementCapacity;
    private startCoherenceMonitoring;
    private monitorQuantumCoherence;
    private handleQuantumDecoherence;
    createCrossDimensionalAsset(name: string, description: string, creator: string, dimensions: DimensionalCoordinate[], properties: Map<string, Map<DimensionType, any>>): Promise<CrossDimensionalAsset>;
    private calculateAssetHash;
    private hashMapStructure;
    tokenizeCrossDimensionalAsset(assetId: string, totalSupply: number, tokenStandard?: string): Promise<CrossDimensionalToken>;
    private getDimensionalCurrency;
    executeCrossDimensionalTransaction(request: DimensionalTransactionRequest): Promise<string>;
    private executeDimensionalTransformation;
    private preserveQuantumStateInTransaction;
    private executeProbabilisticTransaction;
    private calculateQuantumEntanglement;
    private calculateDimensionalResonance;
    private calculateCoordinateSimilarity;
    private calculateProbabilityInterference;
    private transformPhysicalToDigital;
    private transformDigitalToQuantum;
    private transformQuantumToProbabilistic;
    getCrossDimensionalAsset(assetId: string): CrossDimensionalAsset | undefined;
    getCrossDimensionalToken(tokenId: string): CrossDimensionalToken | undefined;
    getAllCrossDimensionalAssets(): CrossDimensionalAsset[];
    getAllCrossDimensionalTokens(): CrossDimensionalToken[];
    getAssetsByDimension(dimension: DimensionType): CrossDimensionalAsset[];
    getTokensByDimension(dimension: DimensionType): CrossDimensionalToken[];
    getQuantumEntanglements(assetId: string): string[];
    measureQuantumAsset(assetId: string, observer: string): Promise<any>;
    getDimensionalStatistics(): any;
    updateConfig(config: Partial<TokenizationConfig>): void;
    getConfig(): TokenizationConfig;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=CrossDimensionalTokenizer.d.ts.map