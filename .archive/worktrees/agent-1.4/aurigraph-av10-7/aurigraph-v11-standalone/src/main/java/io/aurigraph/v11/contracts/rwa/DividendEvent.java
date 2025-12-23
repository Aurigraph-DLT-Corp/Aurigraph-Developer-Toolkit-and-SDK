package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Represents a dividend distribution event
 */
public class DividendEvent {
    private final String eventId;
    private final String tokenId;
    private final BigDecimal grossAmount;
    private final BigDecimal netAmount;
    private final String source;
    private final DividendType dividendType;
    private final Instant distributionDate;
    private final DividendConfiguration configuration;

    public DividendEvent(String eventId, String tokenId, BigDecimal grossAmount, BigDecimal netAmount,
                        String source, DividendType dividendType, Instant distributionDate,
                        DividendConfiguration configuration) {
        this.eventId = eventId;
        this.tokenId = tokenId;
        this.grossAmount = grossAmount;
        this.netAmount = netAmount;
        this.source = source;
        this.dividendType = dividendType;
        this.distributionDate = distributionDate;
        this.configuration = configuration;
    }

    public BigDecimal getTaxWithheld() {
        return grossAmount.subtract(netAmount);
    }

    // Getters
    public String getEventId() { return eventId; }
    public String getTokenId() { return tokenId; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public String getSource() { return source; }
    public DividendType getDividendType() { return dividendType; }
    public Instant getDistributionDate() { return distributionDate; }
    public DividendConfiguration getConfiguration() { return configuration; }
}