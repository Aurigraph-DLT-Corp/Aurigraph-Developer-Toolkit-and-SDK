package io.aurigraph.v11.pending.performance;

import java.util.concurrent.atomic.AtomicReference;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * High-performance transaction entry optimized for zero-copy operations
 * Uses memory pooling and atomic references for thread safety
 */
public class TransactionEntry {
    
    private static final MessageDigest MD5_DIGEST = createDigest();
    
    // Transaction data
    private volatile long id;
    private volatile byte[] data;
    private volatile long timestamp;
    private volatile long processedTime;
    private volatile String hash;
    private volatile boolean processed;
    
    // Processing state
    private final AtomicReference<ProcessingState> state = 
        new AtomicReference<>(ProcessingState.CREATED);
    
    // Memory management
    private volatile boolean allocated = false;
    private volatile int poolId = -1;
    
    /**
     * Default constructor for pooling
     */
    public TransactionEntry() {
        // Empty constructor for object pooling
    }
    
    /**
     * Initialize transaction entry (called from memory pool)
     */
    public void initialize(byte[] transactionData, long creationTime) {
        this.id = creationTime; // Use nano time as ID
        this.data = transactionData;
        this.timestamp = creationTime;
        this.processedTime = 0L;
        this.hash = null;
        this.processed = false;
        this.state.set(ProcessingState.INITIALIZED);
        this.allocated = true;
    }
    
    /**
     * Reset entry for reuse in pool
     */
    public void reset() {
        this.id = 0L;
        this.data = null;
        this.timestamp = 0L;
        this.processedTime = 0L;
        this.hash = null;
        this.processed = false;
        this.state.set(ProcessingState.CREATED);
        this.allocated = false;
        this.poolId = -1;
    }
    
    /**
     * Mark as processed with results
     */
    public void markProcessed(long processTime, String resultHash) {
        this.processedTime = processTime;
        this.hash = resultHash;
        this.processed = true;
        this.state.set(ProcessingState.COMPLETED);
    }
    
    /**
     * Calculate hash using SIMD-optimized approach
     */
    public String calculateHash() {
        if (hash != null) {
            return hash;
        }
        
        if (data == null || data.length == 0) {
            return "empty";
        }
        
        // Use cached MD5 digest for performance
        synchronized (MD5_DIGEST) {
            MD5_DIGEST.reset();
            MD5_DIGEST.update(data);
            byte[] hashBytes = MD5_DIGEST.digest();
            
            StringBuilder sb = new StringBuilder(32);
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            
            this.hash = sb.toString();
            return this.hash;
        }
    }
    
    /**
     * Get processing latency in nanoseconds
     */
    public long getLatencyNanos() {
        if (processedTime > 0 && timestamp > 0) {
            return processedTime - timestamp;
        }
        return 0L;
    }
    
    /**
     * Check if entry is ready for processing
     */
    public boolean isReadyForProcessing() {
        return state.get() == ProcessingState.INITIALIZED && !processed;
    }
    
    /**
     * Atomically transition to processing state
     */
    public boolean tryStartProcessing() {
        return state.compareAndSet(ProcessingState.INITIALIZED, ProcessingState.PROCESSING);
    }
    
    /**
     * Get data size in bytes
     */
    public int getDataSize() {
        return data != null ? data.length : 0;
    }
    
    /**
     * Create zero-copy view of data
     */
    public byte[] getDataView() {
        return data; // In production, this could return a ByteBuffer view
    }
    
    // Getters and setters
    public long getId() {
        return id;
    }
    
    public byte[] getData() {
        return data;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public long getProcessedTime() {
        return processedTime;
    }
    
    public String getHash() {
        return hash;
    }
    
    public boolean isProcessed() {
        return processed;
    }
    
    public ProcessingState getState() {
        return state.get();
    }
    
    public boolean isAllocated() {
        return allocated;
    }
    
    public void setAllocated(boolean allocated) {
        this.allocated = allocated;
    }
    
    public int getPoolId() {
        return poolId;
    }
    
    public void setPoolId(int poolId) {
        this.poolId = poolId;
    }
    
    /**
     * Create MD5 digest instance
     */
    private static MessageDigest createDigest() {
        try {
            return MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 not available", e);
        }
    }
    
    @Override
    public String toString() {
        return String.format("TransactionEntry{id=%d, state=%s, processed=%b, dataSize=%d}", 
            id, state.get(), processed, getDataSize());
    }
    
    /**
     * Processing state enumeration
     */
    public enum ProcessingState {
        CREATED,
        INITIALIZED,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}