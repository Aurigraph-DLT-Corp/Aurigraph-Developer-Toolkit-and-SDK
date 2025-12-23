/**
 * AV10-37: Quantum-Enhanced Compound Token Portfolio System
 *
 * Implementation of RWAT-COMPOUND with quantum optimization algorithms,
 * quantum-safe security, and advanced AI-driven portfolio management.
 *
 * This extends the base CompoundTokenizer with revolutionary quantum features:
 * - Quantum portfolio optimization using quantum annealing
 * - Quantum risk assessment with superposition analysis
 * - Quantum-safe cryptographic security for all operations
 * - AI-driven rebalancing with quantum machine learning
 */
import { CompoundTokenizer, RebalancingStrategy } from './CompoundTokenizer';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { CollectiveIntelligenceNetwork } from '../../ai/CollectiveIntelligenceNetwork';
export interface QuantumPortfolioState {
    tokenId: string;
    quantumState: 'SUPERPOSITION' | 'ENTANGLED' | 'COLLAPSED' | 'OPTIMIZED';
    coherenceLevel: number;
    quantumAdvantage: number;
    entangledAssets: string[];
    collapseProbability: number;
    quantumRiskMetrics: QuantumRiskAssessment;
    lastQuantumOptimization: Date;
}
export interface QuantumRiskAssessment {
    quantumVaR: number;
    quantumCVaR: number;
    entanglementRisk: number;
    coherenceRisk: number;
    quantumCorrelations: Map<string, number>;
    superpositionBenefits: number;
    quantumHedgeEffectiveness: number;
}
export interface QuantumOptimizationResult {
    optimizationId: string;
    algorithmUsed: 'QUANTUM_ANNEALING' | 'QAOA' | 'VQE' | 'QUANTUM_APPROXIMATE';
    quantumAdvantage: number;
    optimalWeights: Map<string, number>;
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
    quantumCorrections: QuantumCorrection[];
    processingTime: number;
    qubitsUsed: number;
    circuitDepth: number;
}
export interface QuantumCorrection {
    type: 'INTERFERENCE' | 'ENTANGLEMENT' | 'SUPERPOSITION' | 'DECOHERENCE';
    magnitude: number;
    confidence: number;
    description: string;
    appliedTo: string[];
}
export interface QuantumRebalancingStrategy extends RebalancingStrategy {
    quantumEnabled: boolean;
    quantumAlgorithm: 'ANNEALING' | 'QAOA' | 'HYBRID';
    coherenceThreshold: number;
    entanglementTargets: string[];
    quantumBudget: number;
    classicalFallback: boolean;
}
export declare class QuantumEnhancedCompoundTokenizer extends CompoundTokenizer {
    private quantumCrypto;
    private aiNetwork;
    private quantumStates;
    private quantumOptimizations;
    private quantumHedges;
    private readonly COHERENCE_DECAY_RATE;
    private readonly ENTANGLEMENT_THRESHOLD;
    private readonly QUANTUM_ADVANTAGE_THRESHOLD;
    constructor(quantumCrypto: QuantumCryptoManagerV2, aiNetwork: CollectiveIntelligenceNetwork);
    private initializeQuantumSystems;
    /**
     * Create a quantum-enhanced compound token with advanced optimization
     */
    createQuantumCompoundToken(name: string, assets: {
        assetId: string;
        targetWeight: number;
    }[], strategy: QuantumRebalancingStrategy, quantumParameters?: {
        enableSuperposition?: boolean;
        targetCoherence?: number;
        entanglementPairs?: string[][];
    }): Promise<string>;
    /**
     * Perform quantum portfolio optimization
     */
    performQuantumOptimization(tokenId: string): Promise<QuantumOptimizationResult>;
    /**
     * Calculate quantum risk assessment
     */
    private calculateQuantumRisk;
    /**
     * Simulate quantum annealing optimization
     */
    private runQuantumAnnealing;
    /**
     * Classical optimization for comparison
     */
    private runClassicalOptimization;
    /**
     * Calculate quantum advantage
     */
    private calculateQuantumAdvantage;
    /**
     * Apply quantum optimization results to portfolio
     */
    private applyQuantumOptimization;
    /**
     * Quantum-enhanced rebalancing
     */
    private performQuantumRebalancing;
    /**
     * Calculate quantum rebalancing actions
     */
    private calculateQuantumRebalancingActions;
    /**
     * Execute quantum rebalancing actions
     */
    private executeQuantumRebalancingActions;
    /**
     * Create quantum entanglement between assets
     */
    private createQuantumEntanglement;
    /**
     * Enable quantum security for token operations
     */
    private enableQuantumSecurity;
    /**
     * Monitor quantum state degradation and maintain coherence
     */
    private startQuantumStateMonitoring;
    /**
     * Restore quantum coherence
     */
    private performQuantumRecoherence;
    private setupQuantumOptimizer;
    private setupQuantumRiskAnalyzer;
    private setupQuantumEntanglement;
    /**
     * Get quantum portfolio analytics
     */
    getQuantumAnalytics(tokenId: string): QuantumPortfolioAnalytics | null;
    private generateQuantumRecommendations;
}
interface QuantumPortfolioAnalytics {
    tokenId: string;
    quantumState: string;
    coherenceLevel: number;
    quantumAdvantage: number;
    entangledAssets: string[];
    quantumRisk: QuantumRiskAssessment;
    optimizationHistory: QuantumOptimizationResult[];
    recommendations: QuantumRecommendation[];
}
interface QuantumRecommendation {
    type: 'COHERENCE_RESTORATION' | 'QUANTUM_EXPANSION' | 'ENTANGLEMENT_OPTIMIZATION' | 'RISK_MITIGATION';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    expectedBenefit: string;
}
export {};
//# sourceMappingURL=QuantumEnhancedCompoundTokenizer.d.ts.map