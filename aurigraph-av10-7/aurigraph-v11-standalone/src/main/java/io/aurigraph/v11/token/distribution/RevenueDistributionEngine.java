package io.aurigraph.v11.token.distribution;

import io.aurigraph.v11.token.derived.DerivedToken;
import io.aurigraph.v11.token.derived.DerivedToken.DerivedTokenStatus;
import io.aurigraph.v11.token.derived.DerivedToken.DistributionFrequency;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * RevenueDistributionEngine - Manages revenue distribution for derived tokens
 *
 * This engine provides:
 * - Multi-party distribution (configurable splits for investors, managers, platform)
 * - Schedule management with multiple frequencies
 * - Automatic distribution processing
 * - Distribution history and audit trails
 * - Pro-rata calculations for fractional shares
 *
 * Default distribution:
 * - 70% to token holders (investors)
 * - 25% to asset manager
 * - 5% to platform
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 * @since Sprint 2 (Week 2)
 */
@ApplicationScoped
public class RevenueDistributionEngine {

    private static final Logger logger = Logger.getLogger(RevenueDistributionEngine.class.getName());

    // Default distribution percentages
    public static final BigDecimal DEFAULT_INVESTOR_SHARE = new BigDecimal("70.00");
    public static final BigDecimal DEFAULT_MANAGER_SHARE = new BigDecimal("25.00");
    public static final BigDecimal DEFAULT_PLATFORM_SHARE = new BigDecimal("5.00");

    @Inject
    EntityManager entityManager;

    // =============== DISTRIBUTION CONFIGURATION ===============

    /**
     * Distribution configuration for a token or asset
     */
    public record DistributionConfig(
            String assetId,
            BigDecimal investorSharePercent,
            BigDecimal managerSharePercent,
            BigDecimal platformSharePercent,
            String managerAddress,
            String platformAddress,
            DistributionFrequency frequency,
            int distributionDayOfMonth,
            boolean autoDistribute
    ) {
        public DistributionConfig {
            // Validate shares sum to 100%
            BigDecimal total = investorSharePercent.add(managerSharePercent).add(platformSharePercent);
            if (total.compareTo(BigDecimal.valueOf(100)) != 0) {
                throw new IllegalArgumentException("Distribution shares must sum to 100%, got: " + total);
            }
        }

        public static DistributionConfig defaultConfig(String assetId, String managerAddress) {
            return new DistributionConfig(
                    assetId,
                    DEFAULT_INVESTOR_SHARE,
                    DEFAULT_MANAGER_SHARE,
                    DEFAULT_PLATFORM_SHARE,
                    managerAddress,
                    "platform-treasury",
                    DistributionFrequency.MONTHLY,
                    1, // First of month
                    true
            );
        }
    }

    // =============== DISTRIBUTION CALCULATION ===============

    /**
     * Calculate distribution amounts for a given revenue
     */
    public DistributionBreakdown calculateDistribution(
            BigDecimal totalRevenue,
            DistributionConfig config,
            List<TokenHolder> tokenHolders) {

        if (totalRevenue == null || totalRevenue.signum() <= 0) {
            throw new IllegalArgumentException("Total revenue must be positive");
        }

        // Calculate gross shares
        BigDecimal investorGross = totalRevenue.multiply(config.investorSharePercent)
                .divide(BigDecimal.valueOf(100), 18, RoundingMode.HALF_UP);
        BigDecimal managerGross = totalRevenue.multiply(config.managerSharePercent)
                .divide(BigDecimal.valueOf(100), 18, RoundingMode.HALF_UP);
        BigDecimal platformGross = totalRevenue.multiply(config.platformSharePercent)
                .divide(BigDecimal.valueOf(100), 18, RoundingMode.HALF_UP);

        // Calculate individual investor distributions
        List<InvestorDistribution> investorDistributions = calculateInvestorDistributions(
                investorGross, tokenHolders);

        return new DistributionBreakdown(
                config.assetId,
                totalRevenue,
                investorGross,
                managerGross,
                platformGross,
                config.managerAddress,
                config.platformAddress,
                investorDistributions,
                Instant.now()
        );
    }

    /**
     * Calculate pro-rata distributions for each investor
     */
    private List<InvestorDistribution> calculateInvestorDistributions(
            BigDecimal investorGross,
            List<TokenHolder> tokenHolders) {

        if (tokenHolders == null || tokenHolders.isEmpty()) {
            return Collections.emptyList();
        }

        // Calculate total ownership
        BigDecimal totalOwnership = tokenHolders.stream()
                .map(TokenHolder::ownershipPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate each investor's share
        List<InvestorDistribution> distributions = new ArrayList<>();
        BigDecimal distributedTotal = BigDecimal.ZERO;

        for (int i = 0; i < tokenHolders.size(); i++) {
            TokenHolder holder = tokenHolders.get(i);
            BigDecimal share;

            // Last investor gets remainder to avoid rounding issues
            if (i == tokenHolders.size() - 1) {
                share = investorGross.subtract(distributedTotal);
            } else {
                share = investorGross.multiply(holder.ownershipPercent())
                        .divide(totalOwnership, 18, RoundingMode.HALF_DOWN);
                distributedTotal = distributedTotal.add(share);
            }

            distributions.add(new InvestorDistribution(
                    holder.tokenId(),
                    holder.ownerAddress(),
                    holder.ownershipPercent(),
                    share
            ));
        }

        return distributions;
    }

    // =============== DISTRIBUTION PROCESSING ===============

    /**
     * Process distributions for tokens due for payment
     */
    @Transactional
    public List<DistributionResult> processScheduledDistributions() {
        List<DerivedToken> dueTokens = DerivedToken.findDueForDistribution();
        List<DistributionResult> results = new ArrayList<>();

        for (DerivedToken token : dueTokens) {
            try {
                DistributionResult result = processTokenDistribution(token);
                results.add(result);
            } catch (Exception e) {
                logger.severe("Distribution failed for token " + token.tokenId + ": " + e.getMessage());
                results.add(DistributionResult.failure(token.tokenId, e.getMessage()));
            }
        }

        return results;
    }

    /**
     * Process distribution for a specific token
     */
    @Transactional
    public DistributionResult processTokenDistribution(DerivedToken token) {
        if (token.status != DerivedTokenStatus.ACTIVE) {
            return DistributionResult.failure(token.tokenId, "Token not active");
        }

        // This would integrate with actual revenue sources in production
        BigDecimal distributionAmount = token.calculateDistributionAmount(
                calculateTokenRevenue(token)
        );

        if (distributionAmount.signum() <= 0) {
            return DistributionResult.failure(token.tokenId, "No revenue to distribute");
        }

        // Record the distribution
        token.recordDistribution(distributionAmount);
        token.persist();

        logger.info("Distributed " + distributionAmount + " for token " + token.tokenId);

        return DistributionResult.success(token.tokenId, distributionAmount, Instant.now());
    }

    /**
     * Calculate revenue for a token (placeholder - would integrate with oracles)
     */
    private BigDecimal calculateTokenRevenue(DerivedToken token) {
        // In production, this would fetch from revenue tracking system
        // For now, calculate based on face value and yield
        BigDecimal yield = token.calculateYield();
        if (yield.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return token.faceValue.multiply(yield)
                .divide(BigDecimal.valueOf(100), 18, RoundingMode.HALF_UP);
    }

    // =============== SCHEDULE MANAGEMENT ===============

    /**
     * Get next distribution date for a frequency
     */
    public Instant calculateNextDistributionDate(
            DistributionFrequency frequency,
            Instant lastDistribution) {

        if (lastDistribution == null) {
            lastDistribution = Instant.now();
        }

        return switch (frequency) {
            case DAILY -> lastDistribution.plus(1, ChronoUnit.DAYS);
            case WEEKLY -> lastDistribution.plus(7, ChronoUnit.DAYS);
            case BIWEEKLY -> lastDistribution.plus(14, ChronoUnit.DAYS);
            case MONTHLY -> lastDistribution.plus(30, ChronoUnit.DAYS);
            case QUARTERLY -> lastDistribution.plus(90, ChronoUnit.DAYS);
            case SEMI_ANNUAL -> lastDistribution.plus(180, ChronoUnit.DAYS);
            case ANNUAL -> lastDistribution.plus(365, ChronoUnit.DAYS);
            case ON_DEMAND -> null;
        };
    }

    /**
     * Check if distribution is due
     */
    public boolean isDistributionDue(DerivedToken token) {
        if (token.status != DerivedTokenStatus.ACTIVE) {
            return false;
        }
        if (token.nextDistributionAt == null) {
            return token.lastDistributionAt == null; // First distribution
        }
        return Instant.now().isAfter(token.nextDistributionAt);
    }

    /**
     * Get all tokens due for distribution
     */
    public List<DerivedToken> getTokensDueForDistribution() {
        return DerivedToken.findDueForDistribution();
    }

    // =============== BATCH OPERATIONS ===============

    /**
     * Execute batch distribution for an asset
     */
    @Transactional
    public BatchDistributionResult executeBatchDistribution(
            String parentTokenId,
            BigDecimal totalRevenue,
            DistributionConfig config) {

        List<DerivedToken> tokens = DerivedToken.findByParentTokenId(parentTokenId);

        // Filter active tokens
        List<DerivedToken> activeTokens = tokens.stream()
                .filter(t -> t.status == DerivedTokenStatus.ACTIVE)
                .collect(Collectors.toList());

        if (activeTokens.isEmpty()) {
            return new BatchDistributionResult(
                    parentTokenId,
                    0,
                    0,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    Collections.emptyList(),
                    "No active tokens found"
            );
        }

        // Create token holders list
        List<TokenHolder> holders = activeTokens.stream()
                .map(t -> new TokenHolder(
                        t.tokenId,
                        t.owner,
                        t.revenueSharePercent != null ? t.revenueSharePercent : BigDecimal.ZERO
                ))
                .collect(Collectors.toList());

        // Calculate distribution
        DistributionBreakdown breakdown = calculateDistribution(totalRevenue, config, holders);

        // Process distributions
        List<DistributionResult> results = new ArrayList<>();
        BigDecimal successfullyDistributed = BigDecimal.ZERO;
        int successCount = 0;

        for (InvestorDistribution dist : breakdown.investorDistributions) {
            DerivedToken token = activeTokens.stream()
                    .filter(t -> t.tokenId.equals(dist.tokenId))
                    .findFirst()
                    .orElse(null);

            if (token != null) {
                try {
                    token.recordDistribution(dist.amount);
                    token.persist();
                    results.add(DistributionResult.success(dist.tokenId, dist.amount, Instant.now()));
                    successfullyDistributed = successfullyDistributed.add(dist.amount);
                    successCount++;
                } catch (Exception e) {
                    results.add(DistributionResult.failure(dist.tokenId, e.getMessage()));
                }
            }
        }

        return new BatchDistributionResult(
                parentTokenId,
                activeTokens.size(),
                successCount,
                totalRevenue,
                successfullyDistributed,
                results,
                null
        );
    }

    // =============== QUERY METHODS ===============

    /**
     * Get distribution history for a token
     */
    public List<DistributionRecord> getDistributionHistory(String tokenId, int limit) {
        // In production, this would query a distribution_history table
        // For now, return based on token's total distributed
        DerivedToken token = DerivedToken.findByTokenId(tokenId);
        if (token == null || token.totalDistributed == null ||
            token.totalDistributed.signum() == 0) {
            return Collections.emptyList();
        }

        // Create a summary record
        return List.of(new DistributionRecord(
                UUID.randomUUID().toString(),
                tokenId,
                token.totalDistributed,
                token.lastDistributionAt,
                "COMPLETED"
        ));
    }

    /**
     * Get aggregate distribution stats for an asset
     */
    public DistributionStats getDistributionStats(String parentTokenId) {
        List<DerivedToken> tokens = DerivedToken.findByParentTokenId(parentTokenId);

        BigDecimal totalDistributed = tokens.stream()
                .map(t -> t.totalDistributed != null ? t.totalDistributed : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeCount = tokens.stream()
                .filter(t -> t.status == DerivedTokenStatus.ACTIVE)
                .count();

        Instant lastDistribution = tokens.stream()
                .map(t -> t.lastDistributionAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

        Instant nextDistribution = tokens.stream()
                .filter(t -> t.status == DerivedTokenStatus.ACTIVE)
                .map(t -> t.nextDistributionAt)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);

        return new DistributionStats(
                parentTokenId,
                tokens.size(),
                activeCount,
                totalDistributed,
                lastDistribution,
                nextDistribution
        );
    }

    // =============== RECORD TYPES ===============

    public record TokenHolder(
            String tokenId,
            String ownerAddress,
            BigDecimal ownershipPercent
    ) {}

    public record InvestorDistribution(
            String tokenId,
            String ownerAddress,
            BigDecimal ownershipPercent,
            BigDecimal amount
    ) {}

    public record DistributionBreakdown(
            String assetId,
            BigDecimal totalRevenue,
            BigDecimal investorTotal,
            BigDecimal managerAmount,
            BigDecimal platformAmount,
            String managerAddress,
            String platformAddress,
            List<InvestorDistribution> investorDistributions,
            Instant calculatedAt
    ) {}

    public record DistributionResult(
            String tokenId,
            boolean success,
            BigDecimal amount,
            Instant distributedAt,
            String errorMessage
    ) {
        public static DistributionResult success(String tokenId, BigDecimal amount, Instant at) {
            return new DistributionResult(tokenId, true, amount, at, null);
        }

        public static DistributionResult failure(String tokenId, String error) {
            return new DistributionResult(tokenId, false, BigDecimal.ZERO, null, error);
        }
    }

    public record BatchDistributionResult(
            String parentTokenId,
            int totalTokens,
            int successCount,
            BigDecimal totalRevenue,
            BigDecimal distributedAmount,
            List<DistributionResult> results,
            String errorMessage
    ) {
        public boolean isFullySuccessful() {
            return totalTokens == successCount;
        }

        public int getFailureCount() {
            return totalTokens - successCount;
        }
    }

    public record DistributionRecord(
            String distributionId,
            String tokenId,
            BigDecimal amount,
            Instant distributedAt,
            String status
    ) {}

    public record DistributionStats(
            String parentTokenId,
            long totalTokens,
            long activeTokens,
            BigDecimal totalDistributed,
            Instant lastDistribution,
            Instant nextDistribution
    ) {}
}
