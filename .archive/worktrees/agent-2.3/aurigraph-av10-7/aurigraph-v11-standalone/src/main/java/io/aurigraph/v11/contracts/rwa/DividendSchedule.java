package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Configuration for automated dividend distribution schedule
 */
public class DividendSchedule {
    private final String tokenId;
    private final DistributionFrequency distributionFrequency;
    private final BigDecimal minimumDividendAmount;
    private final Instant startDate;
    private final Instant endDate; // Optional
    private final boolean autoDistribute;

    public DividendSchedule(String tokenId, DistributionFrequency distributionFrequency,
                           BigDecimal minimumDividendAmount, Instant startDate, Instant endDate,
                           boolean autoDistribute) {
        this.tokenId = tokenId;
        this.distributionFrequency = distributionFrequency;
        this.minimumDividendAmount = minimumDividendAmount;
        this.startDate = startDate;
        this.endDate = endDate;
        this.autoDistribute = autoDistribute;
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public DistributionFrequency getDistributionFrequency() { return distributionFrequency; }
    public BigDecimal getMinimumDividendAmount() { return minimumDividendAmount; }
    public Instant getStartDate() { return startDate; }
    public Instant getEndDate() { return endDate; }
    public boolean isAutoDistribute() { return autoDistribute; }
}