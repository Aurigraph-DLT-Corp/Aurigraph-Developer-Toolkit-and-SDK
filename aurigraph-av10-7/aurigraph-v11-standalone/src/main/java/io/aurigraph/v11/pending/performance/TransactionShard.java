package io.aurigraph.v11.pending.performance;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * Transaction shard for parallel processing
 * Each shard operates independently to maximize throughput
 */
public class TransactionShard {
    
    private final int shardId;
    private final LockFreeRingBuffer ringBuffer;
    private final MemoryPool memoryPool;
    
    // Shard-specific metrics
    private final LongAdder transactionsProcessed = new LongAdder();
    private final LongAdder transactionsFailed = new LongAdder();
    private final AtomicLong lastProcessedTime = new AtomicLong(0);
    private final AtomicLong peakThroughput = new AtomicLong(0);
    
    // Performance tracking
    private volatile long startTime = System.nanoTime();
    private volatile boolean active = false;
    
    /**
     * Create transaction shard
     */
    public TransactionShard(int shardId, LockFreeRingBuffer ringBuffer, MemoryPool memoryPool) {
        this.shardId = shardId;
        this.ringBuffer = ringBuffer;
        this.memoryPool = memoryPool;
    }
    
    /**
     * Activate shard processing
     */
    public void activate() {
        this.active = true;
        this.startTime = System.nanoTime();
    }
    
    /**
     * Deactivate shard processing
     */
    public void deactivate() {
        this.active = false;
    }
    
    /**
     * Process single transaction
     */
    public boolean processTransaction(TransactionEntry entry) {
        if (!active || entry == null) {
            return false;
        }
        
        try {
            // Mark processing start
            if (!entry.tryStartProcessing()) {
                return false;
            }
            
            long processingStart = System.nanoTime();
            
            // Simulate transaction processing with hash calculation
            String hash = entry.calculateHash();
            
            // Mark as processed
            entry.markProcessed(System.nanoTime(), hash);
            
            // Update metrics
            transactionsProcessed.increment();
            lastProcessedTime.set(System.nanoTime());
            
            // Update peak throughput if needed
            updatePeakThroughput();
            
            return true;
            
        } catch (Exception e) {
            transactionsFailed.increment();
            return false;
        }
    }
    
    /**
     * Update peak throughput calculation
     */
    private void updatePeakThroughput() {
        long currentTime = System.nanoTime();
        long elapsed = currentTime - startTime;
        
        if (elapsed > 1_000_000_000L) { // 1 second
            long processed = transactionsProcessed.sum();
            long throughput = (processed * 1_000_000_000L) / elapsed;
            
            if (throughput > peakThroughput.get()) {
                peakThroughput.set(throughput);
            }
        }
    }
    
    /**
     * Get shard statistics
     */
    public ShardStats getStats() {
        long currentTime = System.nanoTime();
        long uptime = currentTime - startTime;
        long processed = transactionsProcessed.sum();
        long failed = transactionsFailed.sum();
        long currentThroughput = 0;
        
        if (uptime > 0) {
            currentThroughput = (processed * 1_000_000_000L) / uptime;
        }
        
        return new ShardStats(
            shardId,
            processed,
            failed,
            currentThroughput,
            peakThroughput.get(),
            ringBuffer.size(),
            ringBuffer.capacity(),
            memoryPool.size(),
            memoryPool.maxSize(),
            uptime / 1_000_000, // Convert to milliseconds
            active
        );
    }
    
    /**
     * Reset shard metrics
     */
    public void resetMetrics() {
        transactionsProcessed.reset();
        transactionsFailed.reset();
        peakThroughput.set(0);
        lastProcessedTime.set(0);
        startTime = System.nanoTime();
    }
    
    /**
     * Get current throughput
     */
    public long getCurrentThroughput() {
        long currentTime = System.nanoTime();
        long elapsed = currentTime - startTime;
        
        if (elapsed <= 0) {
            return 0;
        }
        
        long processed = transactionsProcessed.sum();
        return (processed * 1_000_000_000L) / elapsed;
    }
    
    /**
     * Check if shard is healthy
     */
    public boolean isHealthy() {
        return active && 
               !ringBuffer.isFull() && 
               !memoryPool.isEmpty() &&
               (transactionsFailed.sum() * 100 / Math.max(transactionsProcessed.sum(), 1)) < 5; // <5% failure rate
    }
    
    // Getters
    public int getShardId() {
        return shardId;
    }
    
    public LockFreeRingBuffer getRingBuffer() {
        return ringBuffer;
    }
    
    public MemoryPool getMemoryPool() {
        return memoryPool;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public long getTransactionsProcessed() {
        return transactionsProcessed.sum();
    }
    
    public long getTransactionsFailed() {
        return transactionsFailed.sum();
    }
    
    public long getLastProcessedTime() {
        return lastProcessedTime.get();
    }
    
    public long getPeakThroughput() {
        return peakThroughput.get();
    }
    
    /**
     * Shard statistics record
     */
    public record ShardStats(
        int shardId,
        long transactionsProcessed,
        long transactionsFailed,
        long currentThroughput,
        long peakThroughput,
        int queueSize,
        int queueCapacity,
        int poolSize,
        int poolCapacity,
        long uptimeMs,
        boolean active
    ) {
        
        public double getSuccessRate() {
            long total = transactionsProcessed + transactionsFailed;
            return total > 0 ? (double) transactionsProcessed / total : 1.0;
        }
        
        public double getQueueUtilization() {
            return queueCapacity > 0 ? (double) queueSize / queueCapacity : 0.0;
        }
        
        public double getPoolUtilization() {
            return poolCapacity > 0 ? (double) poolSize / poolCapacity : 0.0;
        }
        
        public boolean isHealthy() {
            return active && 
                   getSuccessRate() > 0.95 && 
                   getQueueUtilization() < 0.9 && 
                   getPoolUtilization() > 0.1;
        }
        
        @Override
        public String toString() {
            return String.format(
                "Shard-%d: %d TPS (peak: %d), processed: %d, failed: %d (%.2f%% success)", 
                shardId, currentThroughput, peakThroughput, 
                transactionsProcessed, transactionsFailed, getSuccessRate() * 100
            );
        }
    }
}