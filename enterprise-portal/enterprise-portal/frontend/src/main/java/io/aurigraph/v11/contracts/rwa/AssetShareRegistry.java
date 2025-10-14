package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for managing fractional shares of an asset
 */
public class AssetShareRegistry {
    private final String tokenId;
    private final String assetId;
    private final int totalShares;
    private final BigDecimal shareValue;
    private BigDecimal currentSharePrice;
    private final String originalOwner;
    private final Instant createdAt;
    private final Map<String, ShareHolder> shareHolders;

    public AssetShareRegistry(String tokenId, String assetId, int totalShares, 
                             BigDecimal shareValue, BigDecimal currentSharePrice, String originalOwner) {
        this.tokenId = tokenId;
        this.assetId = assetId;
        this.totalShares = totalShares;
        this.shareValue = shareValue;
        this.currentSharePrice = currentSharePrice;
        this.originalOwner = originalOwner;
        this.createdAt = Instant.now();
        this.shareHolders = new ConcurrentHashMap<>();
    }

    public void addShareHolder(ShareHolder holder) {
        shareHolders.put(holder.getAddress(), holder);
    }

    public void removeShareHolder(String address) {
        shareHolders.remove(address);
    }

    public ShareHolder getShareHolder(String address) {
        return shareHolders.get(address);
    }

    public Collection<ShareHolder> getShareHolders() {
        return shareHolders.values();
    }

    public int getActiveShareHolderCount() {
        return (int) shareHolders.values().stream()
            .filter(holder -> holder.getShareCount() > 0)
            .count();
    }

    public void updateSharePrice(BigDecimal newPrice) {
        this.currentSharePrice = newPrice;
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public String getAssetId() { return assetId; }
    public int getTotalShares() { return totalShares; }
    public BigDecimal getShareValue() { return shareValue; }
    public BigDecimal getCurrentSharePrice() { return currentSharePrice; }
    public String getOriginalOwner() { return originalOwner; }
    public Instant getCreatedAt() { return createdAt; }
}