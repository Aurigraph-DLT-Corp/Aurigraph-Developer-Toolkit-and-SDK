import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
export interface ParallelUniverseConfig {
    universeId: string;
    dimensionality: number;
    quantumState: 'superposition' | 'entangled' | 'collapsed' | 'decoherent';
    probabilityAmplitude: number;
    coherenceTime: number;
    fidelity: number;
    entangledWith: string[];
    shardCapacity: number;
    processingPower: number;
}
export interface QuantumShardConfig {
    shardId: string;
    universeId: string;
    quantumState: any;
    transactionPool: Map<string, QuantumTransaction>;
    validators: string[];
    performanceMetrics: ShardPerformanceMetrics;
    entanglementRegistry: Map<string, QuantumEntanglement>;
    interferencePattern: InterferencePattern;
}
export interface QuantumTransaction {
    id: string;
    hash: string;
    data: any;
    timestamp: number;
    quantumSignature: string;
    universeRoute: string[];
    interferenceWeight: number;
    collapseThreshold: number;
    entangledTransactions: string[];
    realityProbability: number;
    shardDestination: string[];
}
export interface ShardPerformanceMetrics {
    tps: number;
    averageLatency: number;
    quantumCoherence: number;
    entanglementStability: number;
    realityCollapseRate: number;
    interferenceOptimization: number;
    universeCrossingTime: number;
    dimensionalRouting: number;
}
export interface QuantumEntanglement {
    id: string;
    participants: string[];
    strength: number;
    coherenceTime: number;
    fidelity: number;
    state: 'entangled' | 'separable' | 'mixed';
    measurementHistory: QuantumMeasurement[];
    timestamp: number;
}
export interface QuantumMeasurement {
    timestamp: number;
    measuredState: string;
    observer: string;
    collapsed: boolean;
    probabilityBefore: number;
    probabilityAfter: number;
}
export interface InterferencePattern {
    patternId: string;
    amplitudes: number[];
    phases: number[];
    constructiveInterference: number[];
    destructiveInterference: number[];
    optimalPath: string;
    pathProbabilities: Map<string, number>;
}
export interface RealityCollapseEvent {
    timestamp: number;
    triggeredBy: string;
    affectedUniverses: string[];
    collapseType: 'spontaneous' | 'measurement' | 'decoherence' | 'consensus';
    finalState: any;
    probabilityDistribution: Map<string, number>;
    observers: string[];
}
export interface CrossUniverseBridge {
    bridgeId: string;
    sourceUniverse: string;
    targetUniverse: string;
    capacity: number;
    latency: number;
    throughput: number;
    quantumTunnel: QuantumTunnel;
    stabilityIndex: number;
    active: boolean;
}
export interface QuantumTunnel {
    tunnelId: string;
    entryPoint: string;
    exitPoint: string;
    quantumState: any;
    coherenceLength: number;
    transmissionFidelity: number;
    decoherenceRate: number;
}
export interface MultiDimensionalRoute {
    routeId: string;
    dimensions: string[];
    totalDistance: number;
    quantumWeight: number;
    interferenceFactors: number[];
    expectedLatency: number;
    reliability: number;
    alternativePaths: string[];
}
export interface QuantumShardingMetrics {
    totalShards: number;
    activeUniverses: number;
    globalTPS: number;
    averageUniverseLatency: number;
    quantumCoherenceIndex: number;
    realityStabilityIndex: number;
    crossUniverseTraffic: number;
    interferenceOptimizationRatio: number;
    dimensionalRoutingEfficiency: number;
    decoherenceRate: number;
    performanceImprovement: number;
}
export declare class ParallelUniverse extends EventEmitter {
    private logger;
    private config;
    private shards;
    private quantumCrypto;
    private entanglements;
    private interferenceEngine;
    private realityCollapseHistory;
    private crossUniverseBridges;
    private performanceMetrics;
    private parentManager?;
    constructor(config: ParallelUniverseConfig, quantumCrypto: QuantumCryptoManagerV2, parentManager?: QuantumShardManager);
    private initializeMetrics;
    initialize(): Promise<void>;
    private initializeQuantumState;
    private createQuantumShards;
    private createQuantumShardState;
    private generateInterferencePattern;
    private calculateOptimalPath;
    private createShardEntanglement;
    private establishCrossUniverseBridges;
    private createQuantumTunnel;
    private initializeInterferencePatterns;
    private startCoherenceMonitoring;
    private monitorQuantumCoherence;
    private handleQuantumDecoherence;
    private monitorEntanglementStability;
    processTransaction(transaction: QuantumTransaction): Promise<boolean>;
    private selectOptimalShard;
    private calculateInterferenceScore;
    private calculateTransactionPhase;
    private calculatePathPhase;
    private calculateQuantumWeight;
    private calculateQuantumOptimization;
    private calculateSignatureStrength;
    private calculateEntropy;
    private calculateEntanglementScore;
    private processEntangledTransactions;
    private synchronizeQuantumStates;
    private updateInterferencePatterns;
    triggerRealityCollapse(trigger: string): Promise<RealityCollapseEvent>;
    private determineCollapsedState;
    private selectDominantShard;
    private determineCollapseType;
    private calculateShardProbability;
    getUniverseMetrics(): ShardPerformanceMetrics;
    getShardCount(): number;
    getEntanglementCount(): number;
    getBridgeCount(): number;
}
export declare class InterdimensionalBridge extends EventEmitter {
    private logger;
    private config;
    private quantumTunnel;
    private throughputMonitor;
    private stabilityController;
    constructor(config: CrossUniverseBridge);
    initialize(): Promise<void>;
    private initializeQuantumTunnel;
    transmitTransaction(transaction: QuantumTransaction, targetUniverse: string): Promise<boolean>;
    private calculateDynamicCapacity;
    private attemptCapacityExpansion;
    private optimizeTransactionForTransmission;
    private validateTransmissionIntegrity;
    private captureQuantumState;
    private recordQuantumEntanglement;
    private enhanceQuantumSignature;
    private optimizeInterferenceWeight;
    private verifyQuantumSignature;
    private transmitThroughTunnel;
    getStabilityIndex(): Promise<number>;
    getBridgeMetrics(): any;
}
export declare class QuantumRouter extends EventEmitter {
    private logger;
    private routes;
    private universeTopology;
    private routingTable;
    private performanceMetrics;
    constructor();
    private initializeRoutingMetrics;
    initialize(universeTopology: Map<string, string[]>): Promise<void>;
    private buildRoutingTable;
    private calculateOptimalRoute;
    private calculateRouteDimensions;
    private findIntermediateDimensions;
    private calculateTotalDistance;
    private calculateDimensionDistance;
    private calculateQuantumWeight;
    private calculateInterferenceFactors;
    private calculateExpectedLatency;
    private calculateRouteReliability;
    private findAlternativePaths;
    private initializeRouteOptimization;
    private optimizeRoutes;
    routeTransaction(transaction: QuantumTransaction, targetUniverse: string): Promise<MultiDimensionalRoute | null>;
    private determineSourceUniverse;
    private startPerformanceMonitoring;
    private logRoutingMetrics;
    private resetMetrics;
    getRoutingMetrics(): RoutingMetrics;
    getRouteCount(): number;
    getTopology(): Map<string, string[]>;
}
interface RoutingMetrics {
    routingDecisionsPerSec: number;
    averageRoutingLatency: number;
    routingSuccessRate: number;
    pathOptimizationRate: number;
    dimensionalHops: number;
    routingEfficiency: number;
}
export declare class QuantumShardManager extends EventEmitter {
    private logger;
    private quantumCrypto;
    private parallelUniverses;
    private interdimensionalBridges;
    private quantumRouter;
    private config;
    private performanceMetrics;
    private realityStabilizer;
    private quantumErrorCorrection;
    private metricsCollector;
    private performanceOptimizer;
    private globalTransactionPool;
    private processingQueue;
    private batchProcessor;
    constructor(quantumCrypto: QuantumCryptoManagerV2, config?: QuantumShardingConfig);
    private getDefaultConfig;
    private initializeMetrics;
    initialize(): Promise<void>;
    private createParallelUniverses;
    private generateEntanglementList;
    private establishInterdimensionalBridges;
    private createQuantumTunnel;
    private initializeQuantumRouter;
    private startPerformanceMonitoring;
    private monitorQuantumCoherence;
    private monitorRealityStability;
    private handleCoherenceLoss;
    private handleRealityInstability;
    private recalibrateQuantumStates;
    private startTransactionProcessing;
    private processTransactionBatch;
    addTransaction(transaction: QuantumTransaction): Promise<boolean>;
    createQuantumTransaction(data: any): Promise<QuantumTransaction>;
    private handleUniverseTransaction;
    private handleRealityCollapse;
    private handleBridgeTransmission;
    private handleTransactionRouting;
    private collectPerformanceMetrics;
    private optimizePerformance;
    private applyOptimizations;
    private adjustShardConfiguration;
    private rebalanceUniverseLoad;
    private optimizeQuantumRouting;
    getGlobalMetrics(): Promise<QuantumShardingMetrics>;
    getUniverseStatus(): Promise<any[]>;
    getBridgeStatus(): Promise<any[]>;
    getRoutingStatus(): Promise<any>;
    private optimizePreCollapseState;
    private determineCrossUniverseCollapse;
    private calculateShardProbability;
    private calculateEnhancedShardProbability;
    private calculateQuantumInterference;
    private identifyAffectedUniverses;
    private determineEnhancedCollapseType;
    private extractCollapsePerformanceMetrics;
    private executeEnhancedCollapse;
    private optimizeShardInterference;
    private stabilizeShardEntanglements;
    private calculateQuantumWeight;
    private calculateSignatureStrength;
    private calculateEntropy;
    private precalculateQuantumWeights;
    private calculateUniverseCollapseEffect;
    private findCorrelatedUniverses;
    private calculateAverageEntanglementStrength;
    private calculateGlobalQuantumOptimization;
    private applyCollapseToShard;
    private updatePostCollapseMetrics;
    private optimizePostCollapseState;
    private monitorGlobalQuantumCoherence;
    private measureUniverseCoherence;
    private calculateShardCoherence;
    private performCoherenceRestoration;
    private restoreShardCoherence;
    getQuantumCoherenceStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
interface QuantumShardingConfig {
    universeCount: number;
    shardsPerUniverse: number;
    batchSize: number;
    maxLatency: number;
    targetTPS: number;
    coherenceThreshold: number;
    entanglementStrength: number;
    realityStabilityThreshold: number;
    quantumErrorCorrectionEnabled: boolean;
    performanceOptimizationEnabled: boolean;
    adaptiveShardingEnabled: boolean;
    crossUniverseCommunicationEnabled: boolean;
    dimensionalRoutingEnabled: boolean;
}
export default QuantumShardManager;
//# sourceMappingURL=QuantumShardManager.d.ts.map