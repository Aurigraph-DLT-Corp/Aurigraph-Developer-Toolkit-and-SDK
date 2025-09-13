package io.aurigraph.v11.performance;

import java.util.concurrent.atomic.AtomicLong;
import java.util.List;

/**
 * Lock-free ring buffer implementation for ultra-high performance
 * Uses atomic operations and memory barriers for thread safety
 */
public class LockFreeRingBuffer {
    
    private final TransactionEntry[] buffer;
    private final int mask;
    private final AtomicLong writeIndex = new AtomicLong(0);
    private final AtomicLong readIndex = new AtomicLong(0);
    
    public LockFreeRingBuffer(int size) {
        // Ensure size is power of 2
        int actualSize = 1;
        while (actualSize < size) {
            actualSize <<= 1;
        }
        
        this.buffer = new TransactionEntry[actualSize];
        this.mask = actualSize - 1;
    }
    
    /**
     * Offer transaction entry to buffer (non-blocking)
     */
    public boolean offer(TransactionEntry entry) {
        long currentWrite = writeIndex.get();
        long currentRead = readIndex.get();
        
        // Check if buffer is full
        if (currentWrite - currentRead >= buffer.length) {
            return false;
        }
        
        // Try to claim write position
        if (writeIndex.compareAndSet(currentWrite, currentWrite + 1)) {
            int index = (int) (currentWrite & mask);
            buffer[index] = entry;
            return true;
        }
        
        return false;
    }
    
    /**
     * Poll transaction entry from buffer (non-blocking)
     */
    public TransactionEntry poll() {
        long currentRead = readIndex.get();
        long currentWrite = writeIndex.get();
        
        // Check if buffer is empty
        if (currentRead >= currentWrite) {
            return null;
        }
        
        // Try to claim read position
        if (readIndex.compareAndSet(currentRead, currentRead + 1)) {
            int index = (int) (currentRead & mask);
            TransactionEntry entry = buffer[index];
            buffer[index] = null; // Clear reference
            return entry;
        }
        
        return null;
    }
    
    /**
     * Drain up to maxElements into the provided list
     */
    public int drainTo(List<TransactionEntry> list, int maxElements) {
        int drained = 0;
        
        while (drained < maxElements) {
            TransactionEntry entry = poll();
            if (entry == null) {
                break;
            }
            list.add(entry);
            drained++;
        }
        
        return drained;
    }
    
    /**
     * Get current buffer size
     */
    public int size() {
        long write = writeIndex.get();
        long read = readIndex.get();
        return (int) Math.max(0, write - read);
    }
    
    /**
     * Check if buffer is empty
     */
    public boolean isEmpty() {
        return readIndex.get() >= writeIndex.get();
    }
    
    /**
     * Check if buffer is full
     */
    public boolean isFull() {
        long write = writeIndex.get();
        long read = readIndex.get();
        return (write - read) >= buffer.length;
    }
    
    /**
     * Get buffer capacity
     */
    public int capacity() {
        return buffer.length;
    }
}