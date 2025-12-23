import { EventEmitter } from 'events';
import { Asset } from '../registry/AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface YieldBearingToken {
    tokenId: string;
    assetId: string;
    totalSupply: number;
    yieldConfiguration: YieldConfiguration;
    stakingPools: StakingPool[];
    distributionHistory: YieldDistribution[];
    performance: YieldPerformance;
    governance: YieldGovernance;
    created: Date;
}
export interface YieldConfiguration {
    baseYieldRate: number;
    yieldSources: YieldSource[];
    distributionFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    compoundingEnabled: boolean;
    autoReinvestment: boolean;
    yieldCurrency: string;
    minimumHoldingPeriod: number;
}
export interface YieldSource {
    sourceId: string;
    type: 'RENTAL_INCOME' | 'DIVIDEND' | 'INTEREST' | 'CAPITAL_APPRECIATION' | 'STAKING_REWARDS' | 'FEE_SHARING';
    description: string;
    expectedYield: number;
    volatility: number;
    reliability: number;
    lastPayment: Date;
    nextPayment: Date;
}
export interface StakingPool {
    poolId: string;
    name: string;
    minStakeAmount: number;
    lockupPeriod: number;
    yieldMultiplier: number;
    totalStaked: number;
    availableCapacity: number;
    participants: Map<string, StakePosition>;
    created: Date;
}
export interface StakePosition {
    userId: string;
    amount: number;
    stakedDate: Date;
    unlockDate: Date;
    accruedYield: number;
    compoundedYield: number;
    status: 'ACTIVE' | 'UNLOCKING' | 'WITHDRAWN';
}
export interface YieldDistribution {
    distributionId: string;
    tokenId: string;
    totalYield: number;
    yieldPerToken: number;
    distributionDate: Date;
    recipients: YieldRecipient[];
    sourcesUsed: string[];
    feeDeducted: number;
    netDistribution: number;
    processed: boolean;
}
export interface YieldRecipient {
    userId: string;
    tokenBalance: number;
    baseYield: number;
    bonusYield: number;
    totalYield: number;
    reinvested: boolean;
    taxWithheld?: number;
}
export interface YieldPerformance {
    currentAPY: number;
    historicalAPY: number[];
    totalYieldDistributed: number;
    averageYieldPerToken: number;
    yieldVolatility: number;
    consistencyScore: number;
    performanceVsBenchmark: number;
    lastCalculated: Date;
}
export interface YieldGovernance {
    yieldRateVoting: boolean;
    distributionVoting: boolean;
    stakingParameterVoting: boolean;
    feeVoting: boolean;
    proposalThreshold: number;
    votingPeriod: number;
    implementationDelay: number;
}
export interface CompoundingStrategy {
    enabled: boolean;
    frequency: 'CONTINUOUS' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    compoundingRate: number;
    feeStructure: CompoundingFee[];
    autoOptimization: boolean;
}
export interface CompoundingFee {
    threshold: number;
    feeRate: number;
    description: string;
}
export declare class YieldTokenizer extends EventEmitter {
    private yieldTokens;
    private yieldTokensByAsset;
    private stakingPools;
    private distributionQueue;
    private cryptoManager;
    private consensus;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    createYieldToken(asset: Asset, yieldConfig: YieldConfiguration): Promise<string>;
    private createDefaultStakingPools;
    stakeTokens(tokenId: string, userId: string, amount: number, poolId: string): Promise<string>;
    calculateYieldDistribution(tokenId: string): Promise<YieldDistribution>;
    processYieldDistribution(distribution: YieldDistribution): Promise<void>;
    unstakeTokens(stakeId: string, userId: string): Promise<{
        amount: number;
        yield: number;
    }>;
    private calculateSourceYield;
    calculateAPY(tokenId: string): Promise<number>;
    private calculateCompoundAPY;
    createCustomStakingPool(tokenId: string, poolConfig: {
        name: string;
        minStake: number;
        lockupDays: number;
        yieldMultiplier: number;
        capacity: number;
    }): Promise<string>;
    private startYieldDistributionEngine;
    private processScheduledDistributions;
    private isDistributionDue;
    getYieldProjection(tokenId: string, amount: number, days: number): Promise<{
        projectedYield: number;
        dailyYield: number;
        compoundedYield: number;
        effectiveAPY: number;
    }>;
    getStakingOptions(tokenId: string): Promise<StakingPool[]>;
    getUserStakePositions(userId: string): Promise<{
        poolId: string;
        position: StakePosition;
    }[]>;
    getYieldToken(tokenId: string): Promise<YieldBearingToken | null>;
    getYieldStats(): Promise<{
        totalTokens: number;
        totalValueStaked: number;
        totalYieldDistributed: number;
        averageAPY: number;
        activeStakers: number;
    }>;
    private generateYieldTokenId;
    private generatePoolId;
    private generateStakeId;
    private generateDistributionId;
}
//# sourceMappingURL=YieldTokenizer.d.ts.map