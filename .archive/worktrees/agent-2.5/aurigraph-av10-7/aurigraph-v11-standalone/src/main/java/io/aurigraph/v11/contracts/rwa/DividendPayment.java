package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Represents a dividend payment to a specific shareholder
 */
public class DividendPayment {
    private final String recipientAddress;
    private final int shareCount;
    private final BigDecimal amount;
    private final Instant paymentDate;
    private boolean paid;

    public DividendPayment(String recipientAddress, int shareCount, BigDecimal amount, Instant paymentDate) {
        this.recipientAddress = recipientAddress;
        this.shareCount = shareCount;
        this.amount = amount;
        this.paymentDate = paymentDate;
        this.paid = false;
    }

    public void markAsPaid() {
        this.paid = true;
    }

    public BigDecimal getDividendPerShare() {
        if (shareCount == 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(new BigDecimal(shareCount), 8, java.math.RoundingMode.HALF_UP);
    }

    // Getters
    public String getRecipientAddress() { return recipientAddress; }
    public int getShareCount() { return shareCount; }
    public BigDecimal getAmount() { return amount; }
    public Instant getPaymentDate() { return paymentDate; }
    public boolean isPaid() { return paid; }

    @Override
    public String toString() {
        return String.format("DividendPayment{recipient='%s', shares=%d, amount=%s, paid=%s}",
            recipientAddress, shareCount, amount, paid);
    }
}