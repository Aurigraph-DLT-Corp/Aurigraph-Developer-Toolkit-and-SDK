/**
 * AV10-37: Quantum Portfolio Optimizer
 * Advanced quantum computing algorithms for portfolio optimization
 *
 * Features:
 * - Quantum portfolio optimization using variational quantum eigensolver (VQE)
 * - Quantum risk assessment with entanglement analysis
 * - Multi-objective optimization with quantum advantage
 * - Real-time quantum state monitoring
 */
import { EventEmitter } from 'events';
export interface QuantumPortfolioState {
    tokenId: string;
    quantumState: 'SUPERPOSITION' | 'ENTANGLED' | 'COLLAPSED' | 'OPTIMIZED';
    coherenceLevel: number;
    entanglementStrength: number;
    quantumAdvantage: number;
    riskProfile: QuantumRiskProfile;
    optimizationResults: OptimizationResults;
    lastQuantumUpdate: number;
}
export interface QuantumRiskProfile {
    quantumVolatility: number;
    entanglementRisk: number;
    coherenceStability: number;
    quantumCorrelatios: Map<string, number>;
    riskVector: number[];
}
export interface OptimizationResults {
    expectedReturn: number;
    quantumVariance: number;
    sharpeRatio: number;
    maxDrawdown: number;
    quantumAlpha: number;
    optimizationScore: number;
}
export interface QuantumOptimizationConfig {
    enableVQE: boolean;
    quantumCircuitDepth: number;
    entanglementThreshold: number;
    coherenceTimeMs: number;
    optimizationIterations: number;
    riskTolerance: number;
    quantumAdvantageTarget: number;
}
/**
 * Quantum Portfolio Optimizer
 * Leverages quantum computing for superior portfolio optimization
 */
export declare class QuantumPortfolioOptimizer extends EventEmitter {
    private quantumStates;
    private optimizationConfig;
    private quantumCircuits;
    private coherenceMonitorInterval;
    constructor(config: QuantumOptimizationConfig);
    /**
     * Initialize quantum optimization framework
     */
    private initializeQuantumFramework;
    /**
     * Optimize portfolio using quantum algorithms
     */
    optimizePortfolio(tokenIds: string[], targetReturn: number, riskConstraints: RiskConstraints): Promise<QuantumOptimizationResult>;
    /**
     * Initialize quantum states for tokens
     */
    private initializeQuantumStates;
    /**
     * Create entangled quantum circuit
     */
    private createEntangledCircuit;
    /**
     * Execute Variational Quantum Eigensolver (VQE)
     */
    private executeVQE;
    /**
     * Perform quantum risk assessment
     */
    private performQuantumRiskAssessment;
    /**
     * Calculate quantum advantage
     */
    private calculateQuantumAdvantage;
    /**
     * Generate optimal portfolio weights
     */
    private generateOptimalWeights;
    /**
     * Start coherence monitoring
     */
    private startCoherenceMonitoring;
    /**
     * Monitor quantum coherence of all states
     */
    private monitorQuantumCoherence;
    /**
     * Calculate quantum volatility
     */
    private calculateQuantumVolatility;
    /**
     * Shutdown quantum optimizer
     */
    shutdown(): void;
    private generateQuantumRiskProfile;
    private getInitialOptimizationResults;
    private generateVQEParameters;
    private measureExpectationValue;
    private calculateExpectedReturn;
    private calculateVariance;
    private calculateOverallCoherence;
    private generateEntanglementMap;
    private calculateEntanglementRisk;
    private calculateCorrelationRisk;
    private calculateOverallRisk;
    private buildCorrelationMatrix;
    private calculateRiskScore;
}
interface RiskConstraints {
    maxVariance?: number;
    maxDrawdown?: number;
    minSharpeRatio?: number;
}
interface QuantumOptimizationResult {
    tokenIds: string[];
    portfolioWeights: Map<string, number>;
    expectedReturn: number;
    quantumRisk: number;
    quantumAdvantage: number;
    sharpeRatio: number;
    optimizationScore: number;
    quantumStates: QuantumPortfolioState[];
    coherenceLevel: number;
    entanglementMap: Map<string, string[]>;
    timestamp: number;
}
export {};
//# sourceMappingURL=QuantumPortfolioOptimizer.d.ts.map