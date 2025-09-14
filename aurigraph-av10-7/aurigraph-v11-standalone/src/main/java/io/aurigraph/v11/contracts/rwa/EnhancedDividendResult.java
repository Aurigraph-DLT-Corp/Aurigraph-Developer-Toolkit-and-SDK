package io.aurigraph.v11.contracts.rwa;

import java.util.List;

/**
 * Result of enhanced dividend distribution operation
 */
public class EnhancedDividendResult {
    private final boolean success;
    private final String message;
    private final DividendEvent event;
    private final List<EnhancedDividendPayment> payments;
    private final long processingTime;

    public EnhancedDividendResult(boolean success, String message, DividendEvent event,
                                 List<EnhancedDividendPayment> payments, long processingTime) {
        this.success = success;
        this.message = message;
        this.event = event;
        this.payments = payments;
        this.processingTime = processingTime;
    }

    public int getTotalPayments() {
        return payments.size();
    }

    public long getReinvestmentCount() {
        return payments.stream()
            .filter(EnhancedDividendPayment::isReinvestmentSelected)
            .count();
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public DividendEvent getEvent() { return event; }
    public List<EnhancedDividendPayment> getPayments() { return payments; }
    public long getProcessingTime() { return processingTime; }
}