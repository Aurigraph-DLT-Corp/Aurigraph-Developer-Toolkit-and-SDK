"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YieldTokenizer = void 0;
const events_1 = require("events");
class YieldTokenizer extends events_1.EventEmitter {
    constructor(cryptoManager, consensus) {
        super();
        this.yieldTokens = new Map();
        this.yieldTokensByAsset = new Map();
        this.stakingPools = new Map();
        this.distributionQueue = [];
        this.cryptoManager = cryptoManager;
        this.consensus = consensus;
        this.startYieldDistributionEngine();
    }
    async createYieldToken(asset, yieldConfig) {
        if (asset.verification.status !== 'VERIFIED') {
            throw new Error('Asset must be verified before yield token creation');
        }
        if (this.yieldTokensByAsset.has(asset.id)) {
            throw new Error('Yield token already exists for this asset');
        }
        const tokenId = this.generateYieldTokenId(asset);
        const yieldToken = {
            tokenId,
            assetId: asset.id,
            totalSupply: 1000000, // 1M tokens
            yieldConfiguration: yieldConfig,
            stakingPools: [],
            distributionHistory: [],
            performance: {
                currentAPY: yieldConfig.baseYieldRate,
                historicalAPY: [yieldConfig.baseYieldRate],
                totalYieldDistributed: 0,
                averageYieldPerToken: 0,
                yieldVolatility: 0,
                consistencyScore: 100,
                performanceVsBenchmark: 0,
                lastCalculated: new Date()
            },
            governance: {
                yieldRateVoting: true,
                distributionVoting: true,
                stakingParameterVoting: true,
                feeVoting: true,
                proposalThreshold: 5, // 5% of tokens
                votingPeriod: 7, // 7 days
                implementationDelay: 3 // 3 days
            },
            created: new Date()
        };
        // Create default staking pools
        await this.createDefaultStakingPools(tokenId);
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'YIELD_TOKEN_CREATION',
            data: { assetId: asset.id, tokenId, yieldRate: yieldConfig.baseYieldRate },
            timestamp: Date.now()
        });
        this.yieldTokens.set(tokenId, yieldToken);
        this.yieldTokensByAsset.set(asset.id, tokenId);
        this.emit('yieldTokenCreated', { tokenId, assetId: asset.id });
        return tokenId;
    }
    async createDefaultStakingPools(tokenId) {
        const pools = [
            {
                name: 'Flexible Staking',
                minStakeAmount: 100,
                lockupPeriod: 0,
                yieldMultiplier: 1.0,
                capacity: 500000
            },
            {
                name: '30-Day Lock',
                minStakeAmount: 500,
                lockupPeriod: 30,
                yieldMultiplier: 1.2,
                capacity: 300000
            },
            {
                name: '90-Day Lock',
                minStakeAmount: 1000,
                lockupPeriod: 90,
                yieldMultiplier: 1.5,
                capacity: 200000
            },
            {
                name: '365-Day Lock',
                minStakeAmount: 5000,
                lockupPeriod: 365,
                yieldMultiplier: 2.0,
                capacity: 100000
            }
        ];
        for (const poolConfig of pools) {
            const poolId = this.generatePoolId(tokenId, poolConfig.name);
            const pool = {
                poolId,
                name: poolConfig.name,
                minStakeAmount: poolConfig.minStakeAmount,
                lockupPeriod: poolConfig.lockupPeriod,
                yieldMultiplier: poolConfig.yieldMultiplier,
                totalStaked: 0,
                availableCapacity: poolConfig.capacity,
                participants: new Map(),
                created: new Date()
            };
            this.stakingPools.set(poolId, pool);
            const token = this.yieldTokens.get(tokenId);
            if (token) {
                token.stakingPools.push(pool);
            }
        }
    }
    async stakeTokens(tokenId, userId, amount, poolId) {
        const token = this.yieldTokens.get(tokenId);
        const pool = this.stakingPools.get(poolId);
        if (!token || !pool) {
            throw new Error('Token or staking pool not found');
        }
        if (amount < pool.minStakeAmount) {
            throw new Error(`Minimum stake amount is ${pool.minStakeAmount}`);
        }
        if (amount > pool.availableCapacity) {
            throw new Error(`Pool capacity exceeded. Available: ${pool.availableCapacity}`);
        }
        const stakeId = this.generateStakeId();
        const unlockDate = new Date(Date.now() + pool.lockupPeriod * 24 * 60 * 60 * 1000);
        const position = {
            userId,
            amount,
            stakedDate: new Date(),
            unlockDate,
            accruedYield: 0,
            compoundedYield: 0,
            status: 'ACTIVE'
        };
        pool.participants.set(stakeId, position);
        pool.totalStaked += amount;
        pool.availableCapacity -= amount;
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'YIELD_TOKEN_STAKE',
            data: { tokenId, userId, amount, poolId, lockupDays: pool.lockupPeriod },
            timestamp: Date.now()
        });
        this.emit('tokensStaked', { tokenId, userId, amount, poolId, stakeId });
        return stakeId;
    }
    async calculateYieldDistribution(tokenId) {
        const token = this.yieldTokens.get(tokenId);
        if (!token) {
            throw new Error('Yield token not found');
        }
        // Calculate total yield from all sources
        let totalYield = 0;
        const sourcesUsed = [];
        for (const source of token.yieldConfiguration.yieldSources) {
            const sourceYield = await this.calculateSourceYield(source, token);
            totalYield += sourceYield;
            sourcesUsed.push(source.sourceId);
        }
        // Apply fees (typically 1-2%)
        const feeRate = 0.02; // 2% management fee
        const feeDeducted = totalYield * feeRate;
        const netDistribution = totalYield - feeDeducted;
        // Calculate yield per token
        const yieldPerToken = netDistribution / token.totalSupply;
        const distribution = {
            distributionId: this.generateDistributionId(),
            tokenId,
            totalYield,
            yieldPerToken,
            distributionDate: new Date(),
            recipients: [],
            sourcesUsed,
            feeDeducted,
            netDistribution,
            processed: false
        };
        return distribution;
    }
    async processYieldDistribution(distribution) {
        const token = this.yieldTokens.get(distribution.tokenId);
        if (!token)
            return;
        // Calculate recipients from all staking pools
        for (const pool of token.stakingPools) {
            for (const [stakeId, position] of pool.participants.entries()) {
                if (position.status !== 'ACTIVE')
                    continue;
                const baseYield = distribution.yieldPerToken * position.amount;
                const bonusYield = baseYield * (pool.yieldMultiplier - 1.0);
                const totalYield = baseYield + bonusYield;
                const recipient = {
                    userId: position.userId,
                    tokenBalance: position.amount,
                    baseYield,
                    bonusYield,
                    totalYield,
                    reinvested: token.yieldConfiguration.autoReinvestment
                };
                distribution.recipients.push(recipient);
                // Update position with accrued yield
                position.accruedYield += totalYield;
                if (token.yieldConfiguration.compoundingEnabled) {
                    position.compoundedYield += totalYield;
                }
            }
        }
        // Process distribution
        distribution.processed = true;
        token.distributionHistory.push(distribution);
        // Update performance metrics
        token.performance.totalYieldDistributed += distribution.netDistribution;
        token.performance.averageYieldPerToken = token.performance.totalYieldDistributed / token.totalSupply;
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'YIELD_DISTRIBUTION_PROCESSED',
            data: {
                tokenId: distribution.tokenId,
                totalYield: distribution.totalYield,
                recipients: distribution.recipients.length
            },
            timestamp: Date.now()
        });
        this.emit('yieldDistributed', {
            tokenId: distribution.tokenId,
            totalYield: distribution.totalYield,
            recipients: distribution.recipients.length
        });
    }
    async unstakeTokens(stakeId, userId) {
        const pool = Array.from(this.stakingPools.values()).find(p => p.participants.has(stakeId));
        if (!pool) {
            throw new Error('Stake position not found');
        }
        const position = pool.participants.get(stakeId);
        if (!position || position.userId !== userId) {
            throw new Error('Invalid stake position or user mismatch');
        }
        if (position.status !== 'ACTIVE') {
            throw new Error('Stake position is not active');
        }
        // Check lockup period
        if (new Date() < position.unlockDate) {
            throw new Error(`Tokens locked until ${position.unlockDate.toISOString()}`);
        }
        // Calculate final yield
        const finalYield = position.accruedYield + position.compoundedYield;
        // Update pool
        pool.totalStaked -= position.amount;
        pool.availableCapacity += position.amount;
        position.status = 'WITHDRAWN';
        // Submit to consensus
        await this.consensus.submitTransaction({
            type: 'YIELD_TOKEN_UNSTAKE',
            data: { stakeId, userId, amount: position.amount, yield: finalYield },
            timestamp: Date.now()
        });
        this.emit('tokensUnstaked', { stakeId, userId, amount: position.amount, yield: finalYield });
        return { amount: position.amount, yield: finalYield };
    }
    async calculateSourceYield(source, token) {
        // Simulate yield calculation from different sources
        const baseAmount = token.performance.totalYieldDistributed || 100000; // Base calculation amount
        switch (source.type) {
            case 'RENTAL_INCOME':
                // Simulate monthly rental income
                return baseAmount * (source.expectedYield / 100) / 12;
            case 'DIVIDEND':
                // Simulate quarterly dividend
                return baseAmount * (source.expectedYield / 100) / 4;
            case 'INTEREST':
                // Simulate daily compound interest
                return baseAmount * (source.expectedYield / 100) / 365;
            case 'CAPITAL_APPRECIATION':
                // Simulate asset appreciation (volatile)
                const volatilityFactor = 1 + (Math.random() - 0.5) * (source.volatility / 100);
                return baseAmount * (source.expectedYield / 100) * volatilityFactor / 12;
            case 'STAKING_REWARDS':
                // Simulate blockchain staking rewards
                return baseAmount * (source.expectedYield / 100) / 365;
            case 'FEE_SHARING':
                // Simulate platform fee sharing
                return baseAmount * (source.expectedYield / 100) / 12;
            default:
                return 0;
        }
    }
    async calculateAPY(tokenId) {
        const token = this.yieldTokens.get(tokenId);
        if (!token)
            return 0;
        // Calculate based on recent distribution history
        if (token.distributionHistory.length === 0) {
            return token.yieldConfiguration.baseYieldRate;
        }
        // Get last 12 distributions (assuming monthly)
        const recentDistributions = token.distributionHistory
            .slice(-12)
            .filter(d => d.processed);
        if (recentDistributions.length === 0) {
            return token.yieldConfiguration.baseYieldRate;
        }
        const totalYield = recentDistributions.reduce((sum, d) => sum + d.yieldPerToken, 0);
        const periodsPerYear = 12; // Monthly distributions
        const actualPeriods = recentDistributions.length;
        // Annualize the yield
        const annualizedYield = (totalYield * periodsPerYear) / actualPeriods;
        // Apply compounding if enabled
        if (token.yieldConfiguration.compoundingEnabled) {
            return this.calculateCompoundAPY(annualizedYield, periodsPerYear);
        }
        return annualizedYield;
    }
    calculateCompoundAPY(periodicRate, periodsPerYear) {
        // Compound Annual Percentage Yield calculation
        const ratePerPeriod = periodicRate / periodsPerYear / 100;
        return (Math.pow(1 + ratePerPeriod, periodsPerYear) - 1) * 100;
    }
    async createCustomStakingPool(tokenId, poolConfig) {
        const token = this.yieldTokens.get(tokenId);
        if (!token) {
            throw new Error('Yield token not found');
        }
        const poolId = this.generatePoolId(tokenId, poolConfig.name);
        const pool = {
            poolId,
            name: poolConfig.name,
            minStakeAmount: poolConfig.minStake,
            lockupPeriod: poolConfig.lockupDays,
            yieldMultiplier: poolConfig.yieldMultiplier,
            totalStaked: 0,
            availableCapacity: poolConfig.capacity,
            participants: new Map(),
            created: new Date()
        };
        this.stakingPools.set(poolId, pool);
        token.stakingPools.push(pool);
        this.emit('stakingPoolCreated', { tokenId, poolId, name: poolConfig.name });
        return poolId;
    }
    startYieldDistributionEngine() {
        // Process yield distributions every hour
        setInterval(async () => {
            await this.processScheduledDistributions();
        }, 60 * 60 * 1000); // 1 hour
    }
    async processScheduledDistributions() {
        for (const token of this.yieldTokens.values()) {
            if (this.isDistributionDue(token)) {
                const distribution = await this.calculateYieldDistribution(token.tokenId);
                this.distributionQueue.push(distribution);
            }
        }
        // Process queued distributions
        while (this.distributionQueue.length > 0) {
            const distribution = this.distributionQueue.shift();
            await this.processYieldDistribution(distribution);
        }
    }
    isDistributionDue(token) {
        const lastDistribution = token.distributionHistory[token.distributionHistory.length - 1];
        if (!lastDistribution)
            return true; // First distribution
        const daysSinceLastDistribution = (Date.now() - lastDistribution.distributionDate.getTime()) / (24 * 60 * 60 * 1000);
        switch (token.yieldConfiguration.distributionFrequency) {
            case 'DAILY': return daysSinceLastDistribution >= 1;
            case 'WEEKLY': return daysSinceLastDistribution >= 7;
            case 'MONTHLY': return daysSinceLastDistribution >= 30;
            case 'QUARTERLY': return daysSinceLastDistribution >= 90;
            default: return false;
        }
    }
    async getYieldProjection(tokenId, amount, days) {
        const token = this.yieldTokens.get(tokenId);
        if (!token) {
            throw new Error('Yield token not found');
        }
        const currentAPY = await this.calculateAPY(tokenId);
        const dailyRate = currentAPY / 365 / 100;
        const projectedYield = amount * dailyRate * days;
        const compoundedYield = token.yieldConfiguration.compoundingEnabled
            ? amount * (Math.pow(1 + dailyRate, days) - 1)
            : projectedYield;
        return {
            projectedYield,
            dailyYield: amount * dailyRate,
            compoundedYield,
            effectiveAPY: currentAPY
        };
    }
    async getStakingOptions(tokenId) {
        const token = this.yieldTokens.get(tokenId);
        return token ? token.stakingPools : [];
    }
    async getUserStakePositions(userId) {
        const positions = [];
        for (const [poolId, pool] of this.stakingPools.entries()) {
            for (const [stakeId, position] of pool.participants.entries()) {
                if (position.userId === userId) {
                    positions.push({ poolId, position });
                }
            }
        }
        return positions;
    }
    async getYieldToken(tokenId) {
        return this.yieldTokens.get(tokenId) || null;
    }
    async getYieldStats() {
        const stats = {
            totalTokens: this.yieldTokens.size,
            totalValueStaked: 0,
            totalYieldDistributed: 0,
            averageAPY: 0,
            activeStakers: new Set()
        };
        let totalAPY = 0;
        for (const token of this.yieldTokens.values()) {
            stats.totalYieldDistributed += token.performance.totalYieldDistributed;
            const tokenAPY = await this.calculateAPY(token.tokenId);
            totalAPY += tokenAPY;
            for (const pool of token.stakingPools) {
                stats.totalValueStaked += pool.totalStaked;
                for (const position of pool.participants.values()) {
                    if (position.status === 'ACTIVE') {
                        stats.activeStakers.add(position.userId);
                    }
                }
            }
        }
        stats.averageAPY = this.yieldTokens.size > 0 ? totalAPY / this.yieldTokens.size : 0;
        return {
            ...stats,
            activeStakers: stats.activeStakers.size
        };
    }
    generateYieldTokenId(asset) {
        const timestamp = Date.now();
        const hash = this.cryptoManager.hashData(asset.id);
        return `YT-${timestamp}-${hash.substring(0, 8)}`;
    }
    generatePoolId(tokenId, name) {
        const hash = this.cryptoManager.hashData(`${tokenId}-${name}`);
        return `POOL-${hash.substring(0, 12)}`;
    }
    generateStakeId() {
        return `STAKE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    generateDistributionId() {
        return `DIST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
}
exports.YieldTokenizer = YieldTokenizer;
