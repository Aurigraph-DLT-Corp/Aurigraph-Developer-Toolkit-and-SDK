package io.aurigraph.v11.performance;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReferenceArray;
import java.util.concurrent.locks.LockSupport;

/**
 * High-performance lock-free transaction queue optimized for 15-core systems
 * Uses ring buffer with atomic operations for maximum throughput
 * 
 * Key Features:
 * - Lock-free MPMC (Multi-Producer Multi-Consumer) implementation
 * - Cache-line aligned slots to prevent false sharing
 * - Optimistic spinning with backoff for low latency
 * - Support for batch operations
 * - Memory ordering guarantees for consistency
 */
public class LockFreeTransactionQueue<T> {
    
    private static final Logger logger = LoggerFactory.getLogger(LockFreeTransactionQueue.class);
    
    // Cache line size - typically 64 bytes on modern CPUs
    private static final int CACHE_LINE_SIZE = 64;
    
    // Ring buffer size - must be power of 2
    private final int capacity;
    private final int mask;
    
    // Atomic ring buffer for transactions
    private final AtomicReferenceArray<Slot<T>> buffer;
    
    // Head and tail pointers with cache line padding
    private final PaddedAtomicLong head = new PaddedAtomicLong(0);
    private final PaddedAtomicLong tail = new PaddedAtomicLong(0);
    
    // Metrics
    private final AtomicLong totalEnqueued = new AtomicLong(0);
    private final AtomicLong totalDequeued = new AtomicLong(0);
    private final AtomicLong enqueueFails = new AtomicLong(0);
    private final AtomicLong dequeueFails = new AtomicLong(0);
    
    // Backoff configuration for spinning
    private final int maxSpins = 1000;
    private final int maxYields = 100;
    private final long maxParkNanos = 1000;

    /**
     * Constructor
     * @param capacity Must be power of 2 for performance
     */
    public LockFreeTransactionQueue(int capacity) {
        if ((capacity & (capacity - 1)) != 0) {
            throw new IllegalArgumentException("Capacity must be power of 2");
        }
        
        this.capacity = capacity;
        this.mask = capacity - 1;
        this.buffer = new AtomicReferenceArray<>(capacity);
        
        // Initialize all slots
        for (int i = 0; i < capacity; i++) {
            buffer.set(i, new Slot<>(i));
        }
        
        logger.info("Lock-free transaction queue initialized with capacity: {}", capacity);
    }

    /**
     * Enqueue a transaction (non-blocking)
     * @param item Transaction to enqueue
     * @return true if successfully enqueued, false if queue is full
     */
    public boolean offer(T item) {
        if (item == null) {
            throw new NullPointerException("Item cannot be null");
        }
        
        long currentTail = tail.get();
        int attempts = 0;
        int spins = 0, yields = 0;
        
        while (attempts < maxSpins) {
            int index = (int) (currentTail & mask);
            Slot<T> slot = buffer.get(index);
            
            if (slot.sequence.get() == currentTail) {
                // Try to claim this slot
                if (tail.compareAndSet(currentTail, currentTail + 1)) {
                    slot.item = item;
                    // Release the slot for consumers
                    slot.sequence.set(currentTail + 1);
                    totalEnqueued.incrementAndGet();
                    return true;
                }
            }
            
            // Backoff strategy
            currentTail = tail.get();
            
            if (++spins < maxSpins) {
                // Busy wait with CPU hint
                Thread.onSpinWait();
            } else if (++yields < maxYields) {
                Thread.yield();
                spins = 0;
            } else {
                // Park for a short time
                LockSupport.parkNanos(maxParkNanos);
                spins = yields = 0;
            }
            
            attempts++;
        }
        
        enqueueFails.incrementAndGet();
        return false;
    }

    /**
     * Dequeue a transaction (non-blocking)
     * @return Transaction if available, null if queue is empty
     */
    public T poll() {
        long currentHead = head.get();
        int attempts = 0;
        int spins = 0, yields = 0;
        
        while (attempts < maxSpins) {
            int index = (int) (currentHead & mask);
            Slot<T> slot = buffer.get(index);
            long sequence = slot.sequence.get();
            
            if (sequence == currentHead + 1) {
                // Try to claim this slot
                if (head.compareAndSet(currentHead, currentHead + 1)) {
                    T item = slot.item;
                    slot.item = null; // Help GC
                    // Release the slot for producers
                    slot.sequence.set(currentHead + capacity);
                    totalDequeued.incrementAndGet();
                    return item;
                }
            } else if (sequence < currentHead + 1) {
                // Queue is empty
                dequeueFails.incrementAndGet();
                return null;
            }
            
            // Backoff strategy
            currentHead = head.get();
            
            if (++spins < maxSpins) {
                Thread.onSpinWait();
            } else if (++yields < maxYields) {
                Thread.yield();
                spins = 0;
            } else {
                LockSupport.parkNanos(maxParkNanos);
                spins = yields = 0;
            }
            
            attempts++;
        }
        
        dequeueFails.incrementAndGet();
        return null;
    }

    /**
     * Batch enqueue operation for better throughput
     * @param items Array of items to enqueue
     * @param count Number of items to enqueue
     * @return Number of items successfully enqueued
     */
    public int offerBatch(T[] items, int count) {
        if (items == null || count <= 0) {
            return 0;
        }
        
        int enqueued = 0;
        for (int i = 0; i < count; i++) {
            if (offer(items[i])) {
                enqueued++;
            } else {
                break; // Queue is full, stop trying
            }
        }
        
        return enqueued;
    }

    /**
     * Batch dequeue operation for better throughput
     * @param items Array to store dequeued items
     * @param maxCount Maximum number of items to dequeue
     * @return Number of items actually dequeued
     */
    public int pollBatch(T[] items, int maxCount) {
        if (items == null || maxCount <= 0) {
            return 0;
        }
        
        int dequeued = 0;
        for (int i = 0; i < maxCount; i++) {
            T item = poll();
            if (item != null) {
                items[i] = item;
                dequeued++;
            } else {
                break; // Queue is empty, stop trying
            }
        }
        
        return dequeued;
    }

    /**
     * Get current queue size (approximate)
     */
    public int size() {
        long currentHead = head.get();
        long currentTail = tail.get();
        return (int) Math.max(0, currentTail - currentHead);
    }

    /**
     * Check if queue is empty (approximate)
     */
    public boolean isEmpty() {
        return head.get() >= tail.get();
    }

    /**
     * Check if queue is full (approximate)
     */
    public boolean isFull() {
        return size() >= capacity;
    }

    /**
     * Get queue metrics
     */
    public QueueMetrics getMetrics() {
        return new QueueMetrics(
            totalEnqueued.get(),
            totalDequeued.get(),
            enqueueFails.get(),
            dequeueFails.get(),
            size(),
            capacity
        );
    }

    /**
     * Reset metrics (for testing/monitoring)
     */
    public void resetMetrics() {
        totalEnqueued.set(0);
        totalDequeued.set(0);
        enqueueFails.set(0);
        dequeueFails.set(0);
    }

    /**
     * Slot in the ring buffer with cache line padding
     */
    private static final class Slot<T> {
        // Padding to prevent false sharing
        private long p1, p2, p3, p4, p5, p6, p7 = 7L;
        
        volatile T item;
        final AtomicLong sequence = new AtomicLong();
        
        // More padding to prevent false sharing
        private long p8, p9, p10, p11, p12, p13, p14 = 14L;
        
        Slot(long initialSequence) {
            sequence.set(initialSequence);
        }
    }

    /**
     * Padded atomic long to prevent false sharing
     */
    private static final class PaddedAtomicLong extends AtomicLong {
        // Padding to prevent false sharing
        private long p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14 = 14L;
        
        PaddedAtomicLong(long initialValue) {
            super(initialValue);
        }
    }

    /**
     * Queue performance metrics
     */
    public record QueueMetrics(
        long totalEnqueued,
        long totalDequeued,
        long enqueueFails,
        long dequeueFails,
        int currentSize,
        int capacity
    ) {
        public double throughput() {
            return totalEnqueued + totalDequeued;
        }
        
        public double successRate() {
            long totalOps = totalEnqueued + totalDequeued + enqueueFails + dequeueFails;
            return totalOps > 0 ? (double) (totalEnqueued + totalDequeued) / totalOps : 0.0;
        }
        
        public double utilization() {
            return (double) currentSize / capacity;
        }
    }
}