package io.aurigraph.v11.contracts.rwa;

/**
 * Result of dividend distribution operation
 */
public class DividendDistributionResult {
    private final boolean success;
    private final String message;
    private final DividendDistribution distribution;
    private final long processingTime;

    public DividendDistributionResult(boolean success, String message, 
                                    DividendDistribution distribution, long processingTime) {
        this.success = success;
        this.message = message;
        this.distribution = distribution;
        this.processingTime = processingTime;
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public DividendDistribution getDistribution() { return distribution; }
    public long getProcessingTime() { return processingTime; }
}