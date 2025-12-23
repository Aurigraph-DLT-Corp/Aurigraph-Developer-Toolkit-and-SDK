package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Represents a dividend distribution event
 */
public class DividendDistribution {
    private final String distributionId;
    private final String tokenId;
    private final BigDecimal totalAmount;
    private final BigDecimal dividendPerShare;
    private final String source;
    private final Instant distributionDate;
    private List<DividendPayment> payments;

    public DividendDistribution(String distributionId, String tokenId, BigDecimal totalAmount,
                               BigDecimal dividendPerShare, String source, Instant distributionDate) {
        this.distributionId = distributionId;
        this.tokenId = tokenId;
        this.totalAmount = totalAmount;
        this.dividendPerShare = dividendPerShare;
        this.source = source;
        this.distributionDate = distributionDate;
        this.payments = new ArrayList<>();
    }

    public void setPayments(List<DividendPayment> payments) {
        this.payments = new ArrayList<>(payments);
    }

    public void addPayment(DividendPayment payment) {
        this.payments.add(payment);
    }

    public int getPaymentCount() {
        return payments.size();
    }

    public BigDecimal getTotalPaid() {
        return payments.stream()
            .map(DividendPayment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Getters
    public String getDistributionId() { return distributionId; }
    public String getTokenId() { return tokenId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getDividendPerShare() { return dividendPerShare; }
    public String getSource() { return source; }
    public Instant getDistributionDate() { return distributionDate; }
    public List<DividendPayment> getPayments() { return List.copyOf(payments); }
}