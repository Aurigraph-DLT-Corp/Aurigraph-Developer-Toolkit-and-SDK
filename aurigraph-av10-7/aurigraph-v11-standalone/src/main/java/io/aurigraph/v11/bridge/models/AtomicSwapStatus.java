package io.aurigraph.v11.bridge.models;

public class AtomicSwapStatus {
    private String swapId;
    private SwapStatus status;
    private String errorMessage;
    private long createdAt;
    private long completedAt;
    
    public AtomicSwapStatus(String swapId, SwapStatus status) {
        this.swapId = swapId;
        this.status = status;
        this.createdAt = System.currentTimeMillis();
    }
    
    // Getters and Setters
    public String getSwapId() { return swapId; }
    public SwapStatus getStatus() { return status; }
    public void setStatus(SwapStatus status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public long getCreatedAt() { return createdAt; }
    public long getCompletedAt() { return completedAt; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
}