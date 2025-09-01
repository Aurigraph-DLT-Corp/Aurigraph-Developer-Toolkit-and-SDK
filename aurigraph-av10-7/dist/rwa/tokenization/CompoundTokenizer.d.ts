import { EventEmitter } from 'events';
import { AssetType } from '../registry/AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface CompoundToken {
    tokenId: string;
    name: string;
    description: string;
    assets: AssetAllocation[];
    rebalancingStrategy: RebalancingStrategy;
    performance: CompoundPerformance;
    riskMetrics: CompoundRiskMetrics;
    distribution: DistributionPolicy;
    governance: GovernanceRules;
    created: Date;
    lastRebalanced: Date;
}
export interface AssetAllocation {
    assetId: string;
    assetType: AssetType;
    targetWeight: number;
    currentWeight: number;
    targetValue: number;
    currentValue: number;
    shares: number;
    lastUpdated: Date;
}
export interface RebalancingStrategy {
    type: 'PERIODIC' | 'THRESHOLD' | 'MOMENTUM' | 'MEAN_REVERSION' | 'AI_OPTIMIZED';
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    threshold: number;
    constraints: RebalancingConstraint[];
    aiModel?: string;
    lastExecution: Date;
    nextExecution: Date;
}
export interface RebalancingConstraint {
    type: 'MIN_WEIGHT' | 'MAX_WEIGHT' | 'MAX_TURNOVER' | 'COST_LIMIT';
    assetType?: AssetType;
    value: number;
    description: string;
}
export interface CompoundPerformance {
    totalValue: number;
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    alpha: number;
    performanceHistory: PerformancePoint[];
    benchmarkComparison: BenchmarkComparison;
}
export interface PerformancePoint {
    date: Date;
    value: number;
    return: number;
    benchmark: number;
}
export interface BenchmarkComparison {
    benchmarkName: string;
    outperformance: number;
    correlation: number;
    trackingError: number;
    informationRatio: number;
}
export interface CompoundRiskMetrics {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    valueAtRisk: number;
    conditionalVaR: number;
    concentrationRisk: number;
    liquidityRisk: number;
    correlationMatrix: Map<string, Map<string, number>>;
    riskContribution: Map<string, number>;
    stressTestResults: StressTestResult[];
}
export interface StressTestResult {
    scenario: string;
    description: string;
    impact: number;
    probability: number;
    mitigationStrategies: string[];
}
export interface DistributionPolicy {
    type: 'ACCUMULATING' | 'DISTRIBUTING' | 'HYBRID';
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    distributionRatio: number;
    reinvestmentOption: boolean;
    taxOptimization: boolean;
}
export interface GovernanceRules {
    votingThreshold: number;
    proposalThreshold: number;
    executionDelay: number;
    vetoPowers: string[];
    votingPeriod: number;
    quorum: number;
}
export interface IndexBasket {
    name: string;
    description: string;
    assetTypes: AssetType[];
    selectionCriteria: SelectionCriteria;
    weightingMethod: 'MARKET_CAP' | 'EQUAL_WEIGHT' | 'RISK_PARITY' | 'FUNDAMENTAL';
    rebalanceFrequency: string;
}
export interface SelectionCriteria {
    minMarketCap?: number;
    minLiquidity?: number;
    maxVolatility?: number;
    qualityScore?: number;
    geographicLimits?: string[];
    sectorLimits?: Map<string, number>;
}
export declare class CompoundTokenizer extends EventEmitter {
    private compoundTokens;
    private indexBaskets;
    private assetPrices;
    private cryptoManager;
    private consensus;
    private aiOptimizer;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    private initializeIndexBaskets;
    createCompoundToken(name: string, assets: {
        assetId: string;
        targetWeight: number;
    }[], strategy: Partial<RebalancingStrategy>): Promise<string>;
    investInCompound(tokenId: string, investorId: string, amount: number): Promise<string>;
    rebalancePortfolio(tokenId: string, forced?: boolean): Promise<boolean>;
    private isRebalancingDue;
    private calculateCurrentWeights;
    private calculateRebalancingActions;
    private executeRebalancingActions;
    createIndexToken(basketId: string, initialCapital: number): Promise<string>;
    private selectAssetsForIndex;
    private meetsCriteria;
    private calculateIndexWeights;
    calculateNAV(tokenId: string): Promise<number>;
    private updatePerformanceMetrics;
    private calculateAdvancedMetrics;
    private calculateBetaAlpha;
    private calculateConcentrationRisk;
    private calculateNextRebalance;
    private getAssetPrice;
    private getAssetType;
    private getBenchmarkReturn;
    private scheduleRebalancing;
    private generateCompoundTokenId;
    getCompoundToken(tokenId: string): Promise<CompoundToken | null>;
    getCompoundTokens(): Promise<CompoundToken[]>;
}
//# sourceMappingURL=CompoundTokenizer.d.ts.map