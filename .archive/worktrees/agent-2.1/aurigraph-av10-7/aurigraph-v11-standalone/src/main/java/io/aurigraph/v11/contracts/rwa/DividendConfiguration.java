package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;

/**
 * Configuration for dividend distribution
 */
public class DividendConfiguration {
    private final boolean withholdTax;
    private final BigDecimal taxRate;
    private final boolean allowReinvestment;
    private final BigDecimal reinvestmentDiscountRate;
    private final boolean notifyHolders;
    private final int paymentDelayDays;

    // Default constructor with standard values
    public DividendConfiguration() {
        this(false, BigDecimal.ZERO, true, BigDecimal.ZERO, true, 0);
    }

    public DividendConfiguration(boolean withholdTax, BigDecimal taxRate, boolean allowReinvestment,
                                BigDecimal reinvestmentDiscountRate, boolean notifyHolders, 
                                int paymentDelayDays) {
        this.withholdTax = withholdTax;
        this.taxRate = taxRate;
        this.allowReinvestment = allowReinvestment;
        this.reinvestmentDiscountRate = reinvestmentDiscountRate;
        this.notifyHolders = notifyHolders;
        this.paymentDelayDays = paymentDelayDays;
    }

    // Getters
    public boolean isWithholdTax() { return withholdTax; }
    public BigDecimal getTaxRate() { return taxRate; }
    public boolean isAllowReinvestment() { return allowReinvestment; }
    public BigDecimal getReinvestmentDiscountRate() { return reinvestmentDiscountRate; }
    public boolean isNotifyHolders() { return notifyHolders; }
    public int getPaymentDelayDays() { return paymentDelayDays; }
}