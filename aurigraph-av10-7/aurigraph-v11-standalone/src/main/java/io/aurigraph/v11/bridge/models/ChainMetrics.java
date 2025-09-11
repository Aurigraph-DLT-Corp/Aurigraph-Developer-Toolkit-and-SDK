package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Chain-specific metrics for analytics
 */
public class ChainMetrics {
    private final String chainId;
    private final AtomicLong transactionCount = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private BigDecimal totalVolume = BigDecimal.ZERO;
    private long totalProcessingTime = 0;
    private final Map<String, BigDecimal> targetChains = new ConcurrentHashMap<>();
    
    public ChainMetrics(String chainId) {
        this.chainId = chainId;
    }
    
    public void recordTransaction(BridgeTransaction transaction) {
        transactionCount.incrementAndGet();
        totalVolume = totalVolume.add(transaction.getAmount());
        
        if (transaction.getStatus() == BridgeStatus.COMPLETED) {
            successfulTransactions.incrementAndGet();
        }
        
        // Record target chain volume
        String targetChain = transaction.getTargetChain();
        targetChains.merge(targetChain, transaction.getAmount(), BigDecimal::add);
    }
    
    // Getters
    public String getChainId() { return chainId; }
    public long getTransactionCount() { return transactionCount.get(); }
    public BigDecimal getTotalVolume() { return totalVolume; }
    public double getSuccessRate() {
        long total = transactionCount.get();
        return total == 0 ? 100.0 : (double) successfulTransactions.get() / total * 100.0;
    }
    public long getAverageProcessingTime() {
        long count = transactionCount.get();
        return count == 0 ? 0 : totalProcessingTime / count;
    }
    public Map<String, BigDecimal> getTargetChains() { return targetChains; }
}