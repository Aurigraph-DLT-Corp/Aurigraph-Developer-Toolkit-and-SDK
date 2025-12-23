package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Pool for managing dividend distributions for fractional ownership
 */
public class DividendPool {
    private final String tokenId;
    private final BigDecimal assetValue;
    private final Instant createdAt;
    private final List<DividendDistribution> distributions;
    private BigDecimal totalDividendsDistributed;

    public DividendPool(String tokenId, BigDecimal assetValue) {
        this.tokenId = tokenId;
        this.assetValue = assetValue;
        this.createdAt = Instant.now();
        this.distributions = new ArrayList<>();
        this.totalDividendsDistributed = BigDecimal.ZERO;
    }

    public void addDistribution(DividendDistribution distribution) {
        distributions.add(distribution);
        totalDividendsDistributed = totalDividendsDistributed.add(distribution.getTotalAmount());
    }

    public BigDecimal calculateYieldRate() {
        if (assetValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return totalDividendsDistributed.divide(assetValue, 4, java.math.RoundingMode.HALF_UP)
                                       .multiply(new BigDecimal(100));
    }

    public List<DividendDistribution> getDistributionsForPeriod(Instant fromDate, Instant toDate) {
        return distributions.stream()
            .filter(dist -> !dist.getDistributionDate().isBefore(fromDate) && 
                           !dist.getDistributionDate().isAfter(toDate))
            .toList();
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public BigDecimal getAssetValue() { return assetValue; }
    public Instant getCreatedAt() { return createdAt; }
    public List<DividendDistribution> getDistributions() { return List.copyOf(distributions); }
    public BigDecimal getTotalDividendsDistributed() { return totalDividendsDistributed; }
    public int getDistributionCount() { return distributions.size(); }
}