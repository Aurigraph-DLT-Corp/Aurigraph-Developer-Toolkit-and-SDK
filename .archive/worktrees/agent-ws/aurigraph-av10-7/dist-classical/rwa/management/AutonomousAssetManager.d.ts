/**
 * Autonomous Asset Manager for Aurigraph DLT Platform
 * Implements intelligent, autonomous asset management including portfolio optimization,
 * risk management, performance monitoring, automated trading, and lifecycle management.
 *
 * AV10-15: AGV9-717: Autonomous Asset Manager Implementation
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { AssetRegistry, AssetType } from '../registry/AssetRegistry';
import { NeuralNetworkEngine } from '../../ai/NeuralNetworkEngine';
import { CollectiveIntelligenceNetwork } from '../../ai/CollectiveIntelligenceNetwork';
export declare enum ManagementStrategy {
    CONSERVATIVE = "CONSERVATIVE",
    BALANCED = "BALANCED",
    AGGRESSIVE = "AGGRESSIVE",
    INCOME_FOCUSED = "INCOME_FOCUSED",
    GROWTH_FOCUSED = "GROWTH_FOCUSED",
    ESG_FOCUSED = "ESG_FOCUSED",
    YIELD_OPTIMIZATION = "YIELD_OPTIMIZATION",
    RISK_PARITY = "RISK_PARITY"
}
export declare enum AutomationLevel {
    MANUAL = "MANUAL",
    SEMI_AUTONOMOUS = "SEMI_AUTONOMOUS",
    FULLY_AUTONOMOUS = "FULLY_AUTONOMOUS",
    AI_DRIVEN = "AI_DRIVEN"
}
export declare enum RiskLevel {
    VERY_LOW = "VERY_LOW",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    VERY_HIGH = "VERY_HIGH"
}
export declare enum AssetAction {
    BUY = "BUY",
    SELL = "SELL",
    HOLD = "HOLD",
    REBALANCE = "REBALANCE",
    TOKENIZE = "TOKENIZE",
    FRACTIONALIZE = "FRACTIONALIZE",
    LIQUIDATE = "LIQUIDATE",
    HEDGE = "HEDGE"
}
export interface Portfolio {
    id: string;
    name: string;
    owner: string;
    description: string;
    strategy: ManagementStrategy;
    automationLevel: AutomationLevel;
    riskTolerance: RiskLevel;
    investmentObjective: string;
    timeHorizon: number;
    assets: Map<string, AssetAllocation>;
    totalValue: number;
    currency: string;
    targetAllocation: Map<AssetType, number>;
    currentAllocation: Map<AssetType, number>;
    allocationTolerance: number;
    performance: PortfolioPerformance;
    riskMetrics: RiskMetrics;
    riskLimits: RiskLimits;
    automationRules: AutomationRule[];
    rebalancingFrequency: number;
    lastRebalancing: Date;
    isActive: boolean;
    created: Date;
    lastUpdated: Date;
    metadata: Map<string, any>;
}
export interface AssetAllocation {
    assetId: string;
    quantity: number;
    currentValue: number;
    purchaseValue: number;
    purchaseDate: Date;
    allocation: number;
    targetAllocation: number;
    performance: AssetPerformance;
    riskContribution: number;
    liquidityScore: number;
}
export interface PortfolioPerformance {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    volatility: number;
    beta: number;
    alpha: number;
    trackingError: number;
    informationRatio: number;
    dailyReturns: number[];
    monthlyReturns: number[];
    yearlyReturns: number[];
    benchmark: string;
    benchmarkReturn: number;
    outperformance: number;
    timeWeightedReturn: number;
    moneyWeightedReturn: number;
    lastCalculated: Date;
}
export interface AssetPerformance {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    maxDrawdown: number;
    calmarRatio: number;
    priceHistory: Array<{
        date: Date;
        price: number;
        volume?: number;
    }>;
    sharpeRatio: number;
    treynorRatio: number;
    jensenAlpha: number;
    yieldRate?: number;
    growthRate?: number;
    valuationMultiple?: number;
    lastUpdated: Date;
}
export interface RiskMetrics {
    valueAtRisk: number;
    expectedShortfall: number;
    portfolioVolatility: number;
    correlationMatrix: Map<string, Map<string, number>>;
    concentrationRisk: number;
    liquidityRisk: number;
    counterpartyRisk: number;
    operationalRisk: number;
    systematicRisk: number;
    specificRisk: number;
    factorExposures: Map<string, number>;
    stressTestResults: Map<string, number>;
    scenarioAnalysis: Map<string, number>;
    lastCalculated: Date;
}
export interface RiskLimits {
    maxPositionSize: number;
    maxSectorExposure: number;
    maxVaR: number;
    maxDrawdown: number;
    maxLeverage: number;
    minLiquidity: number;
    maxConcentration: number;
    assetLimits: Map<AssetType, {
        maxAllocation: number;
        minAllocation: number;
        maxSingleAsset: number;
    }>;
}
export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    type: 'REBALANCING' | 'RISK_MANAGEMENT' | 'OPPORTUNITY' | 'MAINTENANCE';
    triggers: TriggerCondition[];
    actions: AutomatedAction[];
    priority: number;
    enabled: boolean;
    lastTriggered?: Date;
    executionCount: number;
    successRate: number;
    maxExecutionValue: number;
    cooldownPeriod: number;
    requiresApproval: boolean;
    metadata: Map<string, any>;
}
export interface TriggerCondition {
    type: 'PRICE' | 'ALLOCATION' | 'RISK' | 'TIME' | 'PERFORMANCE' | 'MARKET';
    metric: string;
    operator: 'GT' | 'LT' | 'EQ' | 'GTE' | 'LTE' | 'CHANGE';
    threshold: number;
    timeframe?: number;
    confidence: number;
}
export interface AutomatedAction {
    type: AssetAction;
    assetId?: string;
    assetType?: AssetType;
    quantity?: number;
    percentage?: number;
    targetPrice?: number;
    maxSlippage?: number;
    timeframe?: number;
    splitOrder?: boolean;
}
export interface RebalancingSession {
    id: string;
    portfolioId: string;
    startTime: Date;
    endTime?: Date;
    status: 'PENDING' | 'ANALYZING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
    currentAllocation: Map<AssetType, number>;
    targetAllocation: Map<AssetType, number>;
    requiredTrades: TradeInstruction[];
    optimizationObjective: 'MINIMIZE_COST' | 'MINIMIZE_RISK' | 'MAXIMIZE_RETURN' | 'MINIMIZE_TRACKING_ERROR';
    constraints: RebalancingConstraint[];
    completedTrades: CompletedTrade[];
    totalCost: number;
    slippage: number;
    performanceImpact: number;
    riskImpact: number;
    metadata: Map<string, any>;
}
export interface TradeInstruction {
    assetId: string;
    action: AssetAction;
    quantity: number;
    targetPrice?: number;
    maxSlippage: number;
    timeframe: number;
    priority: number;
    parentOrder?: string;
}
export interface CompletedTrade {
    instructionId: string;
    assetId: string;
    action: AssetAction;
    quantity: number;
    executionPrice: number;
    totalValue: number;
    fees: number;
    slippage: number;
    executionTime: Date;
    marketImpact: number;
}
export interface RebalancingConstraint {
    type: 'MAX_TURNOVER' | 'MAX_COST' | 'MIN_TRADE_SIZE' | 'MAX_TRADES' | 'TIME_LIMIT';
    value: number;
    hardLimit: boolean;
}
export interface MarketData {
    assetId: string;
    timestamp: Date;
    price: number;
    bidPrice: number;
    askPrice: number;
    spread: number;
    volume: number;
    movingAverages: Map<number, number>;
    rsi: number;
    macd: {
        line: number;
        signal: number;
        histogram: number;
    };
    bollingerBands: {
        upper: number;
        middle: number;
        lower: number;
    };
    dividend?: number;
    pe_ratio?: number;
    market_cap?: number;
    impliedVolatility?: number;
    creditRating?: string;
    sentiment?: number;
    momentum?: number;
    qualityScore?: number;
    metadata: Map<string, any>;
}
export interface OptimizationResult {
    objective: string;
    optimalAllocation: Map<string, number>;
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
    constraintsSatisfied: boolean;
    constraintViolations: string[];
    sensitivity: Map<string, number>;
    robustness: number;
    requiredTrades: TradeInstruction[];
    estimatedCost: number;
    timestamp: Date;
}
export declare class AutonomousAssetManager extends EventEmitter {
    private logger;
    private quantumCrypto?;
    private assetRegistry?;
    private neuralNetwork?;
    private collectiveIntelligence?;
    private portfolios;
    private marketData;
    private rebalancingSessions;
    private optimizationCache;
    private config;
    private isRunning;
    private marketDataCycle;
    private portfolioAnalysisCycle;
    private optimizationCycle;
    private automationCycle;
    constructor(quantumCrypto?: QuantumCryptoManagerV2, assetRegistry?: AssetRegistry, neuralNetwork?: NeuralNetworkEngine, collectiveIntelligence?: CollectiveIntelligenceNetwork);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initializeAIModels;
    private initializeMarketDataFeeds;
    private initializeDefaultPortfolios;
    private startOperationalCycles;
    private refreshMarketData;
    private getAssetVolatility;
    private analyzePortfolios;
    private updatePortfolioValuation;
    private getAssetType;
    private calculatePerformanceMetrics;
    private assessRiskMetrics;
    private getLiquidityScore;
    private checkAutomationTriggers;
    private evaluateRuleTriggers;
    private evaluateTriggerCondition;
    private executeAutomationRule;
    private executeAutomatedAction;
    private optimizePortfolios;
    private optimizePortfolio;
    private getOptimizationObjective;
    private performAIOptimization;
    private prepareOptimizationFeatures;
    private convertPredictionToAllocation;
    private performTraditionalOptimization;
    private calculateExpectedReturn;
    private calculateExpectedRisk;
    private generateTradeInstructions;
    private estimateTradingCosts;
    private applyOptimization;
    createPortfolio(portfolioId: string, config: {
        name: string;
        owner: string;
        description: string;
        strategy: ManagementStrategy;
        automationLevel: AutomationLevel;
        riskTolerance: RiskLevel;
        investmentObjective: string;
        timeHorizon: number;
        targetAllocation: Map<AssetType, number>;
    }): Promise<string>;
    private createDefaultAutomationRules;
    private getRebalancingFrequency;
    addAssetToPortfolio(portfolioId: string, assetId: string, quantity: number, purchasePrice?: number): Promise<void>;
    executeTrade(portfolioId: string, assetId: string, action: AssetAction, quantity: number, targetPrice?: number): Promise<void>;
    initiateRebalancing(portfolioId: string, trigger?: string): Promise<string>;
    private processRebalancing;
    getPortfolios(): Map<string, Portfolio>;
    getPortfolio(portfolioId: string): Portfolio | undefined;
    getMarketData(): Map<string, MarketData>;
    getOptimizationResults(): Map<string, OptimizationResult>;
    getRebalancingSessions(): Map<string, RebalancingSession>;
    getManagerStatus(): any;
    private executeAutomationRules;
    private requestApproval;
    private requestOptimizationApproval;
    private completePendingOperations;
    private persistState;
}
//# sourceMappingURL=AutonomousAssetManager.d.ts.map