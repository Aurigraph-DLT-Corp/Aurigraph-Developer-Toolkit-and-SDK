package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Enhanced dividend payment with tax and reinvestment features
 */
public class EnhancedDividendPayment {
    private final String recipientAddress;
    private final int shareCount;
    private final BigDecimal grossAmount;
    private final BigDecimal taxWithheld;
    private final Instant paymentDate;
    private final boolean reinvestmentSelected;
    private BigDecimal reinvestedShares;
    private boolean paid;

    public EnhancedDividendPayment(String recipientAddress, int shareCount, BigDecimal grossAmount,
                                  Instant paymentDate, BigDecimal taxWithheld, boolean reinvestmentSelected) {
        this.recipientAddress = recipientAddress;
        this.shareCount = shareCount;
        this.grossAmount = grossAmount;
        this.taxWithheld = taxWithheld;
        this.paymentDate = paymentDate;
        this.reinvestmentSelected = reinvestmentSelected;
        this.reinvestedShares = BigDecimal.ZERO;
        this.paid = false;
    }

    public BigDecimal getNetAmount() {
        return grossAmount.subtract(taxWithheld);
    }

    public void markAsPaid() {
        this.paid = true;
    }

    public void setReinvestedShares(BigDecimal shares) {
        this.reinvestedShares = shares;
    }

    // Getters
    public String getRecipientAddress() { return recipientAddress; }
    public int getShareCount() { return shareCount; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getTaxWithheld() { return taxWithheld; }
    public Instant getPaymentDate() { return paymentDate; }
    public boolean isReinvestmentSelected() { return reinvestmentSelected; }
    public BigDecimal getReinvestedShares() { return reinvestedShares; }
    public boolean isPaid() { return paid; }

    @Override
    public String toString() {
        return String.format("EnhancedDividendPayment{recipient='%s', shares=%d, gross=%s, net=%s, reinvest=%s}",
            recipientAddress, shareCount, grossAmount, getNetAmount(), reinvestmentSelected);
    }
}