package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

public class SwapPair {
    private String sourceChain;
    private String targetChain;
    private String sourceAsset;
    private String targetAsset;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private BigDecimal feePercentage;
    private long estimatedTime;
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private SwapPair pair = new SwapPair();
        
        public Builder sourceChain(String sourceChain) { pair.sourceChain = sourceChain; return this; }
        public Builder targetChain(String targetChain) { pair.targetChain = targetChain; return this; }
        public Builder sourceAsset(String sourceAsset) { pair.sourceAsset = sourceAsset; return this; }
        public Builder targetAsset(String targetAsset) { pair.targetAsset = targetAsset; return this; }
        public Builder minAmount(BigDecimal minAmount) { pair.minAmount = minAmount; return this; }
        public Builder maxAmount(BigDecimal maxAmount) { pair.maxAmount = maxAmount; return this; }
        public Builder feePercentage(BigDecimal feePercentage) { pair.feePercentage = feePercentage; return this; }
        public Builder estimatedTime(long estimatedTime) { pair.estimatedTime = estimatedTime; return this; }
        
        public SwapPair build() { return pair; }
    }
    
    // Getters
    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getSourceAsset() { return sourceAsset; }
    public String getTargetAsset() { return targetAsset; }
    public BigDecimal getMinAmount() { return minAmount; }
    public BigDecimal getMaxAmount() { return maxAmount; }
    public BigDecimal getFeePercentage() { return feePercentage; }
    public long getEstimatedTime() { return estimatedTime; }
}