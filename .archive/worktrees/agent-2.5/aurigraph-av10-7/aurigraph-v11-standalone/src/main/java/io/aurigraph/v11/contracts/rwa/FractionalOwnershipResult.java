package io.aurigraph.v11.contracts.rwa;

/**
 * Result of fractional ownership operations
 */
public class FractionalOwnershipResult {
    private final boolean success;
    private final String message;
    private final AssetShareRecord shareRegistry;
    private final long processingTime;

    public FractionalOwnershipResult(boolean success, String message,
                                   AssetShareRecord shareRegistry, long processingTime) {
        this.success = success;
        this.message = message;
        this.shareRegistry = shareRegistry;
        this.processingTime = processingTime;
    }

    // Getters
    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public AssetShareRecord getShareRegistry() { return shareRegistry; }
    public long getProcessingTime() { return processingTime; }
}