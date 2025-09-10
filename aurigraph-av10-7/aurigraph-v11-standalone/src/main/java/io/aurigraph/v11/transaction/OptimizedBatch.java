package io.aurigraph.v11.transaction;

import java.time.Instant;
import java.util.List;

/**
 * Optimized batch of transactions for high-performance processing
 */
public class OptimizedBatch {
    private final List<Transaction> transactions;
    private final int batchSize;
    private final double optimizationScore;
    private final Instant createdAt;
    
    public OptimizedBatch(List<Transaction> transactions, int batchSize, double optimizationScore) {
        this.transactions = transactions;
        this.batchSize = batchSize;
        this.optimizationScore = optimizationScore;
        this.createdAt = Instant.now();
    }
    
    // Getters
    public List<Transaction> getTransactions() { return transactions; }
    public int getBatchSize() { return batchSize; }
    public double getOptimizationScore() { return optimizationScore; }
    public Instant getCreatedAt() { return createdAt; }
}