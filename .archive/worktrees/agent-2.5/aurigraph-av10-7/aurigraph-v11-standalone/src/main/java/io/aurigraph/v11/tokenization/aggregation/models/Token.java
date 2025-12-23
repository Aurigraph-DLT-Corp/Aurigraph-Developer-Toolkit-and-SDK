package io.aurigraph.v11.tokenization.aggregation.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Represents an aggregation pool token
 * Composite token representing 2-1000+ underlying assets
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Token {

    /**
     * Unique token identifier (deterministic, derived from pool composition)
     */
    private String tokenId;

    /**
     * Pool address (smart contract address for aggregation pool)
     */
    private String poolAddress;

    /**
     * Token symbol (e.g., "AGG-CARBON-001")
     */
    private String symbol;

    /**
     * Token name (human-readable)
     */
    private String name;

    /**
     * Total supply of tokens
     */
    private BigDecimal totalSupply;

    /**
     * Circulating supply (total - locked)
     */
    private BigDecimal circulatingSupply;

    /**
     * Current token price in base currency
     */
    private BigDecimal currentPrice;

    /**
     * Total value locked in pool (sum of all asset valuations)
     */
    private BigDecimal totalValueLocked;

    /**
     * Merkle root of asset composition (SHA3-256)
     */
    private String merkleRoot;

    /**
     * Weighting strategy used for pool composition
     */
    private WeightingStrategy weightingStrategy;

    /**
     * Governance model for pool
     */
    private GovernanceModel governanceModel;

    /**
     * Pool creation timestamp
     */
    private Instant createdAt;

    /**
     * Last rebalancing timestamp
     */
    private Instant lastRebalanced;

    /**
     * Pool creator address
     */
    private String creatorAddress;

    /**
     * Distribution parameters
     */
    private DistributionConfig distributionConfig;

    /**
     * List of underlying asset IDs
     */
    private List<String> underlyingAssets;

    /**
     * Pool status
     */
    private PoolStatus status;

    /**
     * Calculate net asset value per token
     */
    public BigDecimal calculateNAV() {
        if (totalSupply == null || totalSupply.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return totalValueLocked.divide(totalSupply, 8, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Check if pool requires rebalancing based on drift threshold
     */
    public boolean requiresRebalancing(long maxDriftMinutes) {
        if (lastRebalanced == null) {
            return true;
        }
        Instant threshold = Instant.now().minusSeconds(maxDriftMinutes * 60);
        return lastRebalanced.isBefore(threshold);
    }

    /**
     * Weighting strategies for aggregation pools
     */
    public enum WeightingStrategy {
        EQUAL_WEIGHT,
        MARKET_CAP_WEIGHT,
        VOLATILITY_ADJUSTED,
        CUSTOM
    }

    /**
     * Governance models
     */
    public enum GovernanceModel {
        SIMPLE_MAJORITY,
        SUPERMAJORITY,
        WEIGHTED_VOTING,
        QUADRATIC_VOTING
    }

    /**
     * Pool status
     */
    public enum PoolStatus {
        ACTIVE,
        PAUSED,
        REBALANCING,
        LIQUIDATING,
        TERMINATED
    }

    /**
     * Distribution configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributionConfig {
        private DistributionModel model;
        private DistributionFrequency frequency;
        private BigDecimal minDistributionAmount;
        private boolean autoDistribute;

        public enum DistributionModel {
            SCHEDULED,
            EVENT_TRIGGERED,
            CONTINUOUS
        }

        public enum DistributionFrequency {
            DAILY,
            WEEKLY,
            MONTHLY,
            QUARTERLY,
            ANNUAL
        }
    }
}
