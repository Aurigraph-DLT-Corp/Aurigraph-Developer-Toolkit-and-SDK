package io.aurigraph.v11.bridge.models;

public class AtomicSwapResult {
    private final String swapId;
    private final SwapStatus status;
    private final byte[] secret;
    private final byte[] hashLock;
    private final long estimatedTime;
    
    public AtomicSwapResult(String swapId, SwapStatus status, byte[] secret, byte[] hashLock, long estimatedTime) {
        this.swapId = swapId;
        this.status = status;
        this.secret = secret;
        this.hashLock = hashLock;
        this.estimatedTime = estimatedTime;
    }
    
    // Getters
    public String getSwapId() { return swapId; }
    public SwapStatus getStatus() { return status; }
    public byte[] getSecret() { return secret; }
    public byte[] getHashLock() { return hashLock; }
    public long getEstimatedTime() { return estimatedTime; }
}