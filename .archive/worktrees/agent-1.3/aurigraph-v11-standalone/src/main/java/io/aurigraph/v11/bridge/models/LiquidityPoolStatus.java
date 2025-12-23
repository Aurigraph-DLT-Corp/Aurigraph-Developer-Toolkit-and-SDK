package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;
import java.util.Map;

public class LiquidityPoolStatus {
    private String poolId;
    private Map<String, BigDecimal> assetBalances;
    private BigDecimal totalValueLocked;
    private double utilizationRate;
    private boolean isActive;
    
    public LiquidityPoolStatus(String poolId, Map<String, BigDecimal> assetBalances, 
                             BigDecimal totalValueLocked, double utilizationRate, boolean isActive) {
        this.poolId = poolId;
        this.assetBalances = assetBalances;
        this.totalValueLocked = totalValueLocked;
        this.utilizationRate = utilizationRate;
        this.isActive = isActive;
    }
    
    // Getters
    public String getPoolId() { return poolId; }
    public Map<String, BigDecimal> getAssetBalances() { return assetBalances; }
    public BigDecimal getTotalValueLocked() { return totalValueLocked; }
    public double getUtilizationRate() { return utilizationRate; }
    public boolean isActive() { return isActive; }
}