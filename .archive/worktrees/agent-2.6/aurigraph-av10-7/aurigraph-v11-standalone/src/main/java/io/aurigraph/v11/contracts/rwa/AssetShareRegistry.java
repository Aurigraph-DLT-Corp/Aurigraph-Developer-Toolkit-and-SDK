package io.aurigraph.v11.contracts.rwa;

import io.aurigraph.v11.merkle.MerkleProof;
import io.aurigraph.v11.merkle.MerkleTreeRegistry;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Asset Share Registry Service with Merkle Tree Support
 *
 * Registry for managing fractional shares of an asset with cryptographic verification.
 * Provides shareholder tracking, share validation, and Merkle tree-based integrity.
 *
 * Features:
 * - Fractional share ownership tracking
 * - Shareholder management
 * - Share validation (total shares integrity)
 * - Merkle tree cryptographic verification
 * - Proof generation and verification
 * - Dividend distribution tracking
 *
 * @version 11.5.0
 * @since 2025-10-25 - AV11-457: AssetShareRegistry Merkle Tree
 */
@ApplicationScoped
public class AssetShareRegistry extends MerkleTreeRegistry<AssetShareRecord> {

    private static final Logger LOGGER = LoggerFactory.getLogger(AssetShareRegistry.class);

    @Override
    protected String serializeValue(AssetShareRecord record) {
        return String.format("%s|%s|%d|%s|%s|%d|%d",
            record.getTokenId(),
            record.getAssetId(),
            record.getTotalShares(),
            record.getShareValue(),
            record.getCurrentSharePrice(),
            record.getActiveShareHolderCount(),
            record.getAllocatedShares()
        );
    }

    /**
     * Register a new asset share record
     */
    public Uni<AssetShareRecord> registerAssetShares(AssetShareRecord record) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Registering asset shares: {} ({} total shares)",
                record.getAssetId(), record.getTotalShares());

            record.setCreatedAt(Instant.now());

            return record;
        }).flatMap(r -> add(r.getTokenId(), r).map(success -> r));
    }

    /**
     * Get asset share record
     */
    public Uni<AssetShareRecord> getAssetShares(String tokenId) {
        return get(tokenId).onItem().ifNull().failWith(() ->
            new AssetShareNotFoundException("Asset shares not found: " + tokenId));
    }

    /**
     * Add shareholder to an asset
     */
    public Uni<AssetShareRecord> addShareHolder(String tokenId, ShareHolder holder) {
        return getAssetShares(tokenId).map(record -> {
            // Validate total shares
            int newTotal = record.getAllocatedShares() + holder.getShareCount();
            if (newTotal > record.getTotalShares()) {
                throw new ShareAllocationException(
                    String.format("Cannot allocate %d shares. Total: %d, Allocated: %d, Available: %d",
                        holder.getShareCount(),
                        record.getTotalShares(),
                        record.getAllocatedShares(),
                        record.getTotalShares() - record.getAllocatedShares()
                    )
                );
            }

            record.addShareHolder(holder);
            registry.put(tokenId, record);
            LOGGER.info("Added shareholder {} with {} shares to asset {}",
                holder.getAddress(), holder.getShareCount(), tokenId);
            return record;
        });
    }

    /**
     * Remove shareholder from an asset
     */
    public Uni<AssetShareRecord> removeShareHolder(String tokenId, String holderAddress) {
        return getAssetShares(tokenId).map(record -> {
            record.removeShareHolder(holderAddress);
            registry.put(tokenId, record);
            LOGGER.info("Removed shareholder {} from asset {}", holderAddress, tokenId);
            return record;
        });
    }

    /**
     * Transfer shares between holders
     */
    public Uni<AssetShareRecord> transferShares(String tokenId, String fromAddress,
                                               String toAddress, int shareCount) {
        return getAssetShares(tokenId).map(record -> {
            ShareHolder fromHolder = record.getShareHolder(fromAddress);
            if (fromHolder == null) {
                throw new ShareHolderNotFoundException("From holder not found: " + fromAddress);
            }

            if (fromHolder.getShareCount() < shareCount) {
                throw new InsufficientSharesException(
                    String.format("Insufficient shares. Holder has %d, trying to transfer %d",
                        fromHolder.getShareCount(), shareCount)
                );
            }

            // Reduce shares from sender
            fromHolder.reduceShares(shareCount);

            // Add shares to recipient
            ShareHolder toHolder = record.getShareHolder(toAddress);
            if (toHolder == null) {
                toHolder = new ShareHolder(toAddress, shareCount, Instant.now());
                record.addShareHolder(toHolder);
            } else {
                toHolder.addShares(shareCount);
            }

            registry.put(tokenId, record);
            LOGGER.info("Transferred {} shares from {} to {} in asset {}",
                shareCount, fromAddress, toAddress, tokenId);
            return record;
        });
    }

    /**
     * Update share price
     */
    public Uni<AssetShareRecord> updateSharePrice(String tokenId, BigDecimal newPrice) {
        return getAssetShares(tokenId).map(record -> {
            record.updateSharePrice(newPrice);
            registry.put(tokenId, record);
            LOGGER.info("Updated share price for asset {} to {}", tokenId, newPrice);
            return record;
        });
    }

    /**
     * Distribute dividends to shareholders
     */
    public Uni<Map<String, BigDecimal>> distributeDividends(String tokenId, BigDecimal totalDividend) {
        return getAssetShares(tokenId).map(record -> {
            Map<String, BigDecimal> distribution = new HashMap<>();
            BigDecimal dividendPerShare = totalDividend.divide(
                new BigDecimal(record.getTotalShares()),
                6,
                BigDecimal.ROUND_HALF_UP
            );

            for (ShareHolder holder : record.getShareHolders()) {
                BigDecimal holderDividend = dividendPerShare.multiply(new BigDecimal(holder.getShareCount()));
                holder.addDividendReceived(holderDividend);
                distribution.put(holder.getAddress(), holderDividend);
            }

            registry.put(tokenId, record);
            LOGGER.info("Distributed {} in dividends to {} shareholders in asset {}",
                totalDividend, distribution.size(), tokenId);
            return distribution;
        });
    }

    /**
     * Get shareholders by asset
     */
    public Uni<Collection<ShareHolder>> getShareHolders(String tokenId) {
        return getAssetShares(tokenId).map(AssetShareRecord::getShareHolders);
    }

    /**
     * Validate share allocation integrity
     */
    public Uni<ShareValidationResult> validateShareAllocation(String tokenId) {
        return getAssetShares(tokenId).map(record -> {
            int allocatedShares = record.getAllocatedShares();
            int totalShares = record.getTotalShares();
            boolean valid = allocatedShares <= totalShares;

            return new ShareValidationResult(
                valid,
                totalShares,
                allocatedShares,
                totalShares - allocatedShares,
                valid ? "Share allocation is valid" : "Share allocation exceeds total shares"
            );
        });
    }

    /**
     * Generate Merkle proof for an asset share record
     */
    public Uni<MerkleProof.ProofData> getProof(String tokenId) {
        return generateProof(tokenId).map(MerkleProof::toProofData);
    }

    /**
     * Verify a Merkle proof
     */
    public Uni<VerificationResponse> verifyMerkleProof(MerkleProof.ProofData proofData) {
        return verifyProof(proofData.toMerkleProof()).map(valid ->
            new VerificationResponse(valid, valid ? "Proof verified successfully" : "Invalid proof")
        );
    }

    /**
     * Get current Merkle root hash
     */
    public Uni<RootHashResponse> getMerkleRootHash() {
        return getRootHash().flatMap(rootHash ->
            getTreeStats().map(stats -> new RootHashResponse(
                rootHash,
                Instant.now(),
                stats.getEntryCount(),
                stats.getTreeHeight()
            ))
        );
    }

    /**
     * Get Merkle tree statistics
     */
    public Uni<MerkleTreeStats> getMerkleTreeStats() {
        return getTreeStats();
    }

    /**
     * Get registry statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalAssets", registry.size());
        int totalShareHolders = registry.values().stream()
                .mapToInt(AssetShareRecord::getActiveShareHolderCount)
                .sum();
        stats.put("totalShareHolders", totalShareHolders);

        BigDecimal totalValue = registry.values().stream()
                .map(r -> r.getCurrentSharePrice().multiply(new BigDecimal(r.getTotalShares())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalAssetValue", totalValue);

        return stats;
    }

    // Custom Exceptions
    public static class AssetShareNotFoundException extends RuntimeException {
        public AssetShareNotFoundException(String message) {
            super(message);
        }
    }

    public static class ShareAllocationException extends RuntimeException {
        public ShareAllocationException(String message) {
            super(message);
        }
    }

    public static class ShareHolderNotFoundException extends RuntimeException {
        public ShareHolderNotFoundException(String message) {
            super(message);
        }
    }

    public static class InsufficientSharesException extends RuntimeException {
        public InsufficientSharesException(String message) {
            super(message);
        }
    }

    // Response Classes
    public static class VerificationResponse {
        private final boolean valid;
        private final String message;

        public VerificationResponse(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }

    public static class RootHashResponse {
        private final String rootHash;
        private final Instant timestamp;
        private final int entryCount;
        private final int treeHeight;

        public RootHashResponse(String rootHash, Instant timestamp, int entryCount, int treeHeight) {
            this.rootHash = rootHash;
            this.timestamp = timestamp;
            this.entryCount = entryCount;
            this.treeHeight = treeHeight;
        }

        public String getRootHash() {
            return rootHash;
        }

        public Instant getTimestamp() {
            return timestamp;
        }

        public int getEntryCount() {
            return entryCount;
        }

        public int getTreeHeight() {
            return treeHeight;
        }
    }

    public static class ShareValidationResult {
        private final boolean valid;
        private final int totalShares;
        private final int allocatedShares;
        private final int availableShares;
        private final String message;

        public ShareValidationResult(boolean valid, int totalShares, int allocatedShares,
                                    int availableShares, String message) {
            this.valid = valid;
            this.totalShares = totalShares;
            this.allocatedShares = allocatedShares;
            this.availableShares = availableShares;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public int getTotalShares() {
            return totalShares;
        }

        public int getAllocatedShares() {
            return allocatedShares;
        }

        public int getAvailableShares() {
            return availableShares;
        }

        public String getMessage() {
            return message;
        }
    }
}

/**
 * Asset Share Record Model
 */
class AssetShareRecord {
    private String tokenId;
    private String assetId;
    private int totalShares;
    private BigDecimal shareValue;
    private BigDecimal currentSharePrice;
    private String originalOwner;
    private Instant createdAt;
    private final Map<String, ShareHolder> shareHolders = new HashMap<>();

    public AssetShareRecord() {}

    public AssetShareRecord(String tokenId, String assetId, int totalShares,
                           BigDecimal shareValue, BigDecimal currentSharePrice, String originalOwner) {
        this.tokenId = tokenId;
        this.assetId = assetId;
        this.totalShares = totalShares;
        this.shareValue = shareValue;
        this.currentSharePrice = currentSharePrice;
        this.originalOwner = originalOwner;
        this.createdAt = Instant.now();
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

    public int getAllocatedShares() {
        return shareHolders.values().stream()
            .mapToInt(ShareHolder::getShareCount)
            .sum();
    }

    public void updateSharePrice(BigDecimal newPrice) {
        this.currentSharePrice = newPrice;
    }

    // Getters and Setters
    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }

    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }

    public int getTotalShares() { return totalShares; }
    public void setTotalShares(int totalShares) { this.totalShares = totalShares; }

    public BigDecimal getShareValue() { return shareValue; }
    public void setShareValue(BigDecimal shareValue) { this.shareValue = shareValue; }

    public BigDecimal getCurrentSharePrice() { return currentSharePrice; }
    public void setCurrentSharePrice(BigDecimal currentSharePrice) { this.currentSharePrice = currentSharePrice; }

    public String getOriginalOwner() { return originalOwner; }
    public void setOriginalOwner(String originalOwner) { this.originalOwner = originalOwner; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}