package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;

/**
 * Projection of future dividend payments
 */
public class DividendProjection {
    private final String tokenId;
    private final BigDecimal averageMonthlyDividend;
    private final BigDecimal projectedTotal;
    private final BigDecimal annualizedYield;
    private final int projectionMonths;

    public DividendProjection(String tokenId, BigDecimal averageMonthlyDividend, BigDecimal projectedTotal,
                             BigDecimal annualizedYield, int projectionMonths) {
        this.tokenId = tokenId;
        this.averageMonthlyDividend = averageMonthlyDividend;
        this.projectedTotal = projectedTotal;
        this.annualizedYield = annualizedYield;
        this.projectionMonths = projectionMonths;
    }

    public BigDecimal getYieldPercentage() {
        // Convert to percentage (assuming annualizedYield is already calculated)
        return annualizedYield.multiply(new BigDecimal(100));
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public BigDecimal getAverageMonthlyDividend() { return averageMonthlyDividend; }
    public BigDecimal getProjectedTotal() { return projectedTotal; }
    public BigDecimal getAnnualizedYield() { return annualizedYield; }
    public int getProjectionMonths() { return projectionMonths; }
}