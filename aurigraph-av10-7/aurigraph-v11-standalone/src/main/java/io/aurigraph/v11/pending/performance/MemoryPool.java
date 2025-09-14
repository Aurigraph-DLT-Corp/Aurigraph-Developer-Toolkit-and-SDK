package io.aurigraph.v11.pending.performance;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * High-performance memory pool for TransactionEntry objects
 * Minimizes garbage collection by reusing objects
 */
public class MemoryPool {
    
    private final ConcurrentLinkedQueue<TransactionEntry> pool = new ConcurrentLinkedQueue<>();
    private final int maxSize;
    private final AtomicInteger currentSize = new AtomicInteger(0);
    private final AtomicLong allocations = new AtomicLong(0);
    private final AtomicLong deallocations = new AtomicLong(0);
    private final AtomicLong poolHits = new AtomicLong(0);
    private final AtomicLong poolMisses = new AtomicLong(0);
    
    /**
     * Create memory pool with specified maximum size
     */
    public MemoryPool(int maxSize) {
        this.maxSize = maxSize;
        preAllocateEntries();
    }
    
    /**
     * Pre-allocate entries for better performance
     */
    private void preAllocateEntries() {
        int preAllocateCount = Math.min(maxSize / 4, 1000); // 25% or 1000 max
        
        for (int i = 0; i < preAllocateCount; i++) {
            TransactionEntry entry = new TransactionEntry();
            entry.setPoolId(hashCode());
            pool.offer(entry);
            currentSize.incrementAndGet();
        }
    }
    
    /**
     * Allocate transaction entry from pool
     */
    public TransactionEntry allocate() {
        TransactionEntry entry = pool.poll();
        
        if (entry != null) {
            // Pool hit - reuse existing entry
            currentSize.decrementAndGet();
            poolHits.incrementAndGet();
            entry.setAllocated(true);
        } else {
            // Pool miss - create new entry
            entry = new TransactionEntry();
            entry.setPoolId(hashCode());
            entry.setAllocated(true);
            poolMisses.incrementAndGet();
        }
        
        allocations.incrementAndGet();
        return entry;
    }
    
    /**
     * Deallocate transaction entry back to pool
     */
    public void deallocate(TransactionEntry entry) {
        if (entry == null || !entry.isAllocated()) {
            return;
        }
        
        // Reset entry for reuse
        entry.reset();
        entry.setPoolId(hashCode());
        
        // Return to pool if not at capacity
        if (currentSize.get() < maxSize) {
            if (pool.offer(entry)) {
                currentSize.incrementAndGet();
            }
        }
        
        deallocations.incrementAndGet();
    }
    
    /**
     * Force garbage collection of unused entries
     */
    public void cleanup() {
        int targetSize = Math.min(currentSize.get() / 2, maxSize / 4);
        
        while (currentSize.get() > targetSize) {
            TransactionEntry entry = pool.poll();
            if (entry == null) {
                break;
            }
            currentSize.decrementAndGet();
        }
    }
    
    /**
     * Get pool statistics
     */
    public PoolStats getStats() {
        return new PoolStats(
            currentSize.get(),
            maxSize,
            allocations.get(),
            deallocations.get(),
            poolHits.get(),
            poolMisses.get(),
            calculateHitRate()
        );
    }
    
    /**
     * Calculate pool hit rate
     */
    private double calculateHitRate() {
        long hits = poolHits.get();
        long misses = poolMisses.get();
        long total = hits + misses;
        
        if (total == 0) {
            return 0.0;
        }
        
        return (double) hits / total;
    }
    
    /**
     * Get current pool size
     */
    public int size() {
        return currentSize.get();
    }
    
    /**
     * Get maximum pool size
     */
    public int maxSize() {
        return maxSize;
    }
    
    /**
     * Check if pool is empty
     */
    public boolean isEmpty() {
        return currentSize.get() == 0;
    }
    
    /**
     * Check if pool is full
     */
    public boolean isFull() {
        return currentSize.get() >= maxSize;
    }
    
    /**
     * Reset pool statistics
     */
    public void resetStats() {
        allocations.set(0);
        deallocations.set(0);
        poolHits.set(0);
        poolMisses.set(0);
    }
    
    /**
     * Pool statistics record
     */
    public record PoolStats(
        int currentSize,
        int maxSize,
        long allocations,
        long deallocations,
        long poolHits,
        long poolMisses,
        double hitRate
    ) {
        
        public double getUtilization() {
            return maxSize > 0 ? (double) currentSize / maxSize : 0.0;
        }
        
        public boolean isHealthy() {
            return hitRate > 0.8 && getUtilization() < 0.9;
        }
        
        @Override
        public String toString() {
            return String.format(
                "PoolStats{size=%d/%d (%.1f%%), hits=%d, misses=%d, hitRate=%.2f%%}", 
                currentSize, maxSize, getUtilization() * 100, 
                poolHits, poolMisses, hitRate * 100
            );
        }
    }
}