package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

public class BridgeEstimate {
    private BigDecimal totalFee;
    private BigDecimal estimatedSlippage;
    private long estimatedTime;
    private BigDecimal estimatedReceiveAmount;
    private boolean liquidityAvailable;
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private BridgeEstimate estimate = new BridgeEstimate();
        
        public Builder totalFee(BigDecimal totalFee) { estimate.totalFee = totalFee; return this; }
        public Builder estimatedSlippage(BigDecimal slippage) { estimate.estimatedSlippage = slippage; return this; }
        public Builder estimatedTime(long time) { estimate.estimatedTime = time; return this; }
        public Builder estimatedReceiveAmount(BigDecimal amount) { estimate.estimatedReceiveAmount = amount; return this; }
        public Builder liquidityAvailable(boolean available) { estimate.liquidityAvailable = available; return this; }
        
        public BridgeEstimate build() { return estimate; }
    }
    
    // Getters
    public BigDecimal getTotalFee() { return totalFee; }
    public BigDecimal getEstimatedSlippage() { return estimatedSlippage; }
    public long getEstimatedTime() { return estimatedTime; }
    public BigDecimal getEstimatedReceiveAmount() { return estimatedReceiveAmount; }
    public boolean isLiquidityAvailable() { return liquidityAvailable; }
}