package io.aurigraph.v11.bridge;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Status of a liquidity pool in the cross-chain bridge
 */
public class LiquidityPoolStatus {
    private final String poolId;
    private final String chainId;
    private final String assetId;
    private final BigDecimal totalLiquidity;
    private final BigDecimal availableLiquidity;
    private final BigDecimal lockedLiquidity;
    private final double utilizationRate;
    private final boolean isActive;
    private final Instant lastUpdated;
    private final Map<String, Object> metadata;
    
    public LiquidityPoolStatus(String poolId, String chainId, String assetId,
                              BigDecimal totalLiquidity, BigDecimal availableLiquidity,
                              BigDecimal lockedLiquidity, boolean isActive,
                              Map<String, Object> metadata) {
        this.poolId = poolId;
        this.chainId = chainId;
        this.assetId = assetId;
        this.totalLiquidity = totalLiquidity;
        this.availableLiquidity = availableLiquidity;
        this.lockedLiquidity = lockedLiquidity;
        this.utilizationRate = totalLiquidity.compareTo(BigDecimal.ZERO) > 0 
            ? lockedLiquidity.divide(totalLiquidity, 4, java.math.RoundingMode.HALF_UP).doubleValue() 
            : 0.0;
        this.isActive = isActive;
        this.lastUpdated = Instant.now();
        this.metadata = metadata;
    }
    
    // Getters
    public String getPoolId() { return poolId; }
    public String getChainId() { return chainId; }
    public String getAssetId() { return assetId; }
    public BigDecimal getTotalLiquidity() { return totalLiquidity; }
    public BigDecimal getAvailableLiquidity() { return availableLiquidity; }
    public BigDecimal getLockedLiquidity() { return lockedLiquidity; }
    public double getUtilizationRate() { return utilizationRate; }
    public boolean isActive() { return isActive; }
    public Instant getLastUpdated() { return lastUpdated; }
    public Map<String, Object> getMetadata() { return metadata; }
}