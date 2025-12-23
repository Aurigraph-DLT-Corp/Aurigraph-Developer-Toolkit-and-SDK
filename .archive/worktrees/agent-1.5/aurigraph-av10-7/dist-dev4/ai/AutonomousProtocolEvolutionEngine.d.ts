/**
 * AV10-9: Autonomous Protocol Evolution Engine
 * AGV9-711: Self-evolving protocol optimization system
 *
 * This engine uses AI/ML to continuously analyze protocol performance,
 * identify optimization opportunities, and autonomously evolve protocol
 * parameters to achieve optimal performance, security, and scalability.
 */
import { EventEmitter } from 'events';
import { AIOptimizer } from './AIOptimizer';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../consensus/HyperRAFTPlusPlusV2';
export interface ProtocolEvolutionConfig {
    evolutionInterval: number;
    learningRate: number;
    maxParameterChange: number;
    evolutionThreshold: number;
    safetyMode: boolean;
    quantumEvolution: boolean;
    multiObjectiveOptimization: boolean;
}
export interface ProtocolParameter {
    name: string;
    currentValue: number;
    minValue: number;
    maxValue: number;
    importance: number;
    lastChanged: Date;
    changeHistory: ParameterChange[];
    optimizationTarget: 'minimize' | 'maximize' | 'stabilize';
}
export interface ParameterChange {
    timestamp: Date;
    oldValue: number;
    newValue: number;
    reason: string;
    performanceImpact: number;
    rollbackRequired: boolean;
}
export interface EvolutionMetrics {
    evolutionCycle: number;
    timestamp: Date;
    overallPerformance: number;
    throughput: number;
    latency: number;
    energyEfficiency: number;
    securityScore: number;
    stabilityScore: number;
    parametersEvolved: number;
    improvementScore: number;
}
export interface EvolutionObjective {
    name: string;
    weight: number;
    currentScore: number;
    targetScore: number;
    metric: string;
    optimizationDirection: 'minimize' | 'maximize' | 'stabilize';
}
export declare class AutonomousProtocolEvolutionEngine extends EventEmitter {
    private logger;
    private aiOptimizer;
    private quantumCrypto;
    private consensus;
    private config;
    private parameters;
    private objectives;
    private evolutionHistory;
    private isEvolutionActive;
    private evolutionInterval?;
    private performancePredictionModel;
    private parameterOptimizationModel;
    private riskAssessmentModel;
    private currentCycle;
    private lastEvolution;
    private evolutionQueue;
    private rollbackStack;
    constructor(aiOptimizer: AIOptimizer, quantumCrypto: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2, config?: Partial<ProtocolEvolutionConfig>);
    private initializeParameters;
    private initializeObjectives;
    private initializeAIModels;
    startEvolution(): Promise<void>;
    stopEvolution(): Promise<void>;
    private executeEvolutionCycle;
    private collectPerformanceMetrics;
    private analyzePerformanceTrends;
    private calculateTrend;
    private identifyOptimizationOpportunities;
    private generateEvolutionCandidates;
    private generateThroughputCandidates;
    private generateLatencyCandidates;
    private generateRefreshCandidates;
    private assessEvolutionRisks;
    private selectOptimalEvolutions;
    private executeParameterEvolutions;
    private applyConsensusParameterChange;
    private validateEvolutionResults;
    private calculateOverallPerformanceScore;
    private updateAIModels;
    private calculateEvolutionMetrics;
    rollbackLastEvolution(): Promise<void>;
    getEvolutionMetrics(): EvolutionMetrics[];
    getCurrentParameters(): Map<string, ProtocolParameter>;
    getEvolutionConfig(): ProtocolEvolutionConfig;
    updateEvolutionConfig(config: Partial<ProtocolEvolutionConfig>): void;
    getEvolutionStatus(): any;
    private geneticAlgorithm?;
    private ethicsValidator?;
    private communityConsensus?;
    private initializeRevolutionaryComponents;
    performGeneticEvolution(): Promise<EvolutionResult>;
    private applyGeneticMutations;
    private measureGeneticEvolutionImpact;
    private updateProtocolParameter;
    private getCurrentPerformanceMetrics;
    private getBaselineMetrics;
    startGeneticEvolution(): Promise<void>;
    stopGeneticEvolution(): void;
    getGeneticEvolutionStatus(): GeneticEvolutionStatus;
}
interface EvolutionResult {
    success: boolean;
    evolutionCycle: number;
    timestamp: Date;
    totalMutations?: number;
    ethicallyApproved?: number;
    communityApproved?: number;
    appliedMutations?: number;
    performanceImprovement?: number;
    participationRate?: number;
    consensusScore?: number;
    ethicsScore?: number;
    evolutionTime: number;
    error?: string;
}
interface GeneticEvolutionStatus {
    isActive: boolean;
    currentCycle: number;
    lastEvolution: Date;
    totalParameters: number;
    geneticAlgorithmStatus: string;
    ethicsValidationRate: number;
    communityParticipation: number;
    evolutionHistory: EvolutionMetrics[];
}
export {};
//# sourceMappingURL=AutonomousProtocolEvolutionEngine.d.ts.map