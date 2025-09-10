package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

public class LiquidityAnalysis {
    private final boolean liquidityAvailable;
    private final BigDecimal estimatedSlippage;
    private final BigDecimal availableLiquidity;
    
    public LiquidityAnalysis(boolean liquidityAvailable, BigDecimal estimatedSlippage, BigDecimal availableLiquidity) {
        this.liquidityAvailable = liquidityAvailable;
        this.estimatedSlippage = estimatedSlippage;
        this.availableLiquidity = availableLiquidity;
    }
    
    // Getters
    public boolean isLiquidityAvailable() { return liquidityAvailable; }
    public BigDecimal getEstimatedSlippage() { return estimatedSlippage; }
    public BigDecimal getAvailableLiquidity() { return availableLiquidity; }
}