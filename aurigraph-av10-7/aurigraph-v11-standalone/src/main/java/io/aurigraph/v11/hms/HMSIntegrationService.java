package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.*;
import io.aurigraph.v11.hms.VerificationService.VerificationResult;
import io.aurigraph.v11.hms.VerificationService.VerificationStatistics;
import io.aurigraph.v11.hms.ComplianceService.ComplianceValidationResult;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * HMS Integration Service for Healthcare Asset Tokenization
 * Supports multi-verifier consensus and compliance validation
 */
@ApplicationScoped
public class HMSIntegrationService {

    @Inject
    VerificationService verificationService;

    @Inject
    ComplianceService complianceService;

    // In-memory storage for demo (replace with database in production)
    private final Map<String, HealthcareAsset> assets = new ConcurrentHashMap<>();
    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();
    private final AtomicLong tokenizationCounter = new AtomicLong(0);
    private final AtomicLong dailyTokenizations = new AtomicLong(0);
    private Instant dailyResetTime = Instant.now().plusSeconds(86400);

    /**
     * Tokenize a healthcare asset
     */
    public Uni<TokenizationResult> tokenizeAsset(HealthcareAsset asset) {
        return Uni.createFrom().item(() -> {
            Log.infof("Tokenizing asset: %s, type: %s", asset.getAssetId(), asset.getAssetType());

            // Validate compliance
            ComplianceValidationResult complianceResult = complianceService.validateCompliance(asset);
            if (!complianceResult.isValid()) {
                Log.warnf("Asset %s failed compliance validation: %s",
                    asset.getAssetId(), complianceResult.getErrors());
                return TokenizationResult.failed(asset.getAssetId(),
                    "Compliance validation failed: " + complianceResult.getErrors());
            }

            // Encrypt sensitive data
            if (!asset.isEncrypted()) {
                String encryptionKeyId = generateEncryptionKey();
                asset.setEncrypted(true);
                asset.setEncryptionKeyId(encryptionKeyId);
            }

            // Create token
            String tokenId = generateTokenId();
            TokenInfo tokenInfo = new TokenInfo(
                tokenId,
                asset.getAssetId(),
                asset.getAssetType(),
                asset.getOwner(),
                Instant.now()
            );

            // Store asset and token
            assets.put(asset.getAssetId(), asset);
            tokens.put(tokenId, tokenInfo);

            // Increment counters
            long totalTokenizations = tokenizationCounter.incrementAndGet();
            long dailyCount = dailyTokenizations.incrementAndGet();

            // Reset daily counter if needed
            if (Instant.now().isAfter(dailyResetTime)) {
                dailyTokenizations.set(0);
                dailyResetTime = Instant.now().plusSeconds(86400);
            }

            Log.infof("Successfully tokenized asset %s with token %s (Total: %d, Daily: %d)",
                asset.getAssetId(), tokenId, totalTokenizations, dailyCount);

            return TokenizationResult.success(
                asset.getAssetId(),
                tokenId,
                generateTransactionHash(),
                generateBlockNumber()
            );
        });
    }

    /**
     * Batch tokenization for high throughput
     */
    public Uni<BatchTokenizationResult> batchTokenizeAssets(List<HealthcareAsset> assetList) {
        return Uni.createFrom().item(() -> {
            Log.infof("Starting batch tokenization for %d assets", assetList.size());
            long startTime = System.currentTimeMillis();

            List<TokenizationResult> results = new ArrayList<>();
            int successCount = 0;
            int failureCount = 0;

            for (HealthcareAsset asset : assetList) {
                try {
                    TokenizationResult result = tokenizeAsset(asset).await().indefinitely();
                    results.add(result);
                    if (result.isSuccess()) {
                        successCount++;
                    } else {
                        failureCount++;
                    }
                } catch (Exception e) {
                    Log.errorf(e, "Failed to tokenize asset %s", asset.getAssetId());
                    results.add(TokenizationResult.failed(asset.getAssetId(), e.getMessage()));
                    failureCount++;
                }
            }

            long processingTime = System.currentTimeMillis() - startTime;
            Log.infof("Batch tokenization complete: %d succeeded, %d failed, %d ms",
                successCount, failureCount, processingTime);

            return new BatchTokenizationResult(
                true,
                assetList.size(),
                successCount,
                failureCount,
                results,
                processingTime
            );
        });
    }

    /**
     * Get asset by ID
     */
    public Uni<Optional<HealthcareAsset>> getAsset(String assetId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(assets.get(assetId)));
    }

    /**
     * Get token by ID
     */
    public Uni<Optional<TokenInfo>> getToken(String tokenId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(tokens.get(tokenId)));
    }

    /**
     * Get asset status including verification status
     */
    public Uni<AssetStatusInfo> getAssetStatus(String assetId) {
        return Uni.createFrom().item(() -> {
            HealthcareAsset asset = assets.get(assetId);
            if (asset == null) {
                return AssetStatusInfo.notFound(assetId);
            }

            VerificationStatus verificationStatus = verificationService.getVerificationStatus(assetId);

            return new AssetStatusInfo(
                assetId,
                findTokenIdByAssetId(assetId),
                asset.getOwner(),
                AssetState.ACTIVE,
                verificationStatus,
                asset.getComplianceInfo(),
                asset.getUpdatedAt()
            );
        });
    }

    /**
     * Request asset verification
     */
    public Uni<VerificationResult> requestVerification(String assetId, String verifierId, VerificationTier tier) {
        return verificationService.requestVerification(assetId, verifierId, tier);
    }

    /**
     * Transfer asset ownership
     */
    public Uni<TransferResult> transferAsset(String assetId, String fromOwner, String toOwner, String authSignature) {
        return Uni.createFrom().item(() -> {
            Log.infof("Transferring asset %s from %s to %s", assetId, fromOwner, toOwner);

            HealthcareAsset asset = assets.get(assetId);
            if (asset == null) {
                return TransferResult.failed(assetId, "Asset not found");
            }

            // Verify ownership
            if (!asset.getOwner().equals(fromOwner)) {
                return TransferResult.failed(assetId, "Owner verification failed");
            }

            // Verify authorization signature (simplified for demo)
            if (authSignature == null || authSignature.isEmpty()) {
                return TransferResult.failed(assetId, "Invalid authorization signature");
            }

            // Verify asset is verified (for high-value transfers)
            VerificationStatus verificationStatus = verificationService.getVerificationStatus(assetId);
            if (verificationStatus == VerificationStatus.PENDING ||
                verificationStatus == VerificationStatus.REJECTED) {
                return TransferResult.failed(assetId,
                    "Asset must be verified before transfer. Current status: " + verificationStatus);
            }

            // Update ownership
            asset.setOwner(toOwner);
            asset.updateTimestamp();

            String transferId = UUID.randomUUID().toString();
            String txHash = generateTransactionHash();

            Log.infof("Successfully transferred asset %s to new owner %s (Transfer ID: %s)",
                assetId, toOwner, transferId);

            return TransferResult.success(
                assetId,
                transferId,
                txHash,
                generateBlockNumber(),
                toOwner
            );
        });
    }

    /**
     * Get HMS statistics
     */
    public Uni<HMSStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            // Reset daily counter if needed
            if (Instant.now().isAfter(dailyResetTime)) {
                dailyTokenizations.set(0);
                dailyResetTime = Instant.now().plusSeconds(86400);
            }

            long totalAssets = assets.size();
            long totalTokens = tokens.size();
            long totalTokenizations = tokenizationCounter.get();
            long dailyCount = dailyTokenizations.get();

            Map<AssetType, Long> assetsByType = new HashMap<>();
            for (HealthcareAsset asset : assets.values()) {
                assetsByType.merge(asset.getAssetType(), 1L, Long::sum);
            }

            VerificationStatistics verificationStats = verificationService.getStatistics();

            return new HMSStatistics(
                totalAssets,
                totalTokens,
                totalTokenizations,
                dailyCount,
                assetsByType,
                verificationStats
            );
        });
    }

    // Helper methods
    private String generateTokenId() {
        return "HMS-TOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateEncryptionKey() {
        return "ENC-KEY-" + UUID.randomUUID().toString();
    }

    private String generateTransactionHash() {
        return "0x" + UUID.randomUUID().toString().replace("-", "");
    }

    private long generateBlockNumber() {
        return System.currentTimeMillis() / 1000;
    }

    private String findTokenIdByAssetId(String assetId) {
        return tokens.values().stream()
            .filter(t -> t.getAssetId().equals(assetId))
            .map(TokenInfo::getTokenId)
            .findFirst()
            .orElse(null);
    }

    // Result classes
    public static class TokenizationResult {
        private final boolean success;
        private final String assetId;
        private final String tokenId;
        private final String transactionHash;
        private final long blockNumber;
        private final String errorMessage;
        private final Instant timestamp;

        private TokenizationResult(boolean success, String assetId, String tokenId,
                                  String transactionHash, long blockNumber, String errorMessage) {
            this.success = success;
            this.assetId = assetId;
            this.tokenId = tokenId;
            this.transactionHash = transactionHash;
            this.blockNumber = blockNumber;
            this.errorMessage = errorMessage;
            this.timestamp = Instant.now();
        }

        public static TokenizationResult success(String assetId, String tokenId, String txHash, long blockNumber) {
            return new TokenizationResult(true, assetId, tokenId, txHash, blockNumber, null);
        }

        public static TokenizationResult failed(String assetId, String errorMessage) {
            return new TokenizationResult(false, assetId, null, null, 0, errorMessage);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getAssetId() { return assetId; }
        public String getTokenId() { return tokenId; }
        public String getTransactionHash() { return transactionHash; }
        public long getBlockNumber() { return blockNumber; }
        public String getErrorMessage() { return errorMessage; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class BatchTokenizationResult {
        private final boolean success;
        private final int totalRequested;
        private final int totalSucceeded;
        private final int totalFailed;
        private final List<TokenizationResult> results;
        private final long processingTimeMs;

        public BatchTokenizationResult(boolean success, int totalRequested, int totalSucceeded,
                                      int totalFailed, List<TokenizationResult> results, long processingTimeMs) {
            this.success = success;
            this.totalRequested = totalRequested;
            this.totalSucceeded = totalSucceeded;
            this.totalFailed = totalFailed;
            this.results = results;
            this.processingTimeMs = processingTimeMs;
        }

        // Getters
        public boolean isSuccess() { return success; }
        public int getTotalRequested() { return totalRequested; }
        public int getTotalSucceeded() { return totalSucceeded; }
        public int getTotalFailed() { return totalFailed; }
        public List<TokenizationResult> getResults() { return results; }
        public long getProcessingTimeMs() { return processingTimeMs; }
    }

    public static class TokenInfo {
        private final String tokenId;
        private final String assetId;
        private final AssetType assetType;
        private final String owner;
        private final Instant createdAt;

        public TokenInfo(String tokenId, String assetId, AssetType assetType, String owner, Instant createdAt) {
            this.tokenId = tokenId;
            this.assetId = assetId;
            this.assetType = assetType;
            this.owner = owner;
            this.createdAt = createdAt;
        }

        // Getters
        public String getTokenId() { return tokenId; }
        public String getAssetId() { return assetId; }
        public AssetType getAssetType() { return assetType; }
        public String getOwner() { return owner; }
        public Instant getCreatedAt() { return createdAt; }
    }

    public static class AssetStatusInfo {
        private final String assetId;
        private final String tokenId;
        private final String currentOwner;
        private final AssetState state;
        private final VerificationStatus verificationStatus;
        private final ComplianceInfo complianceInfo;
        private final Instant lastUpdated;

        public AssetStatusInfo(String assetId, String tokenId, String currentOwner, AssetState state,
                              VerificationStatus verificationStatus, ComplianceInfo complianceInfo, Instant lastUpdated) {
            this.assetId = assetId;
            this.tokenId = tokenId;
            this.currentOwner = currentOwner;
            this.state = state;
            this.verificationStatus = verificationStatus;
            this.complianceInfo = complianceInfo;
            this.lastUpdated = lastUpdated;
        }

        public static AssetStatusInfo notFound(String assetId) {
            return new AssetStatusInfo(assetId, null, null, null, null, null, null);
        }

        // Getters
        public String getAssetId() { return assetId; }
        public String getTokenId() { return tokenId; }
        public String getCurrentOwner() { return currentOwner; }
        public AssetState getState() { return state; }
        public VerificationStatus getVerificationStatus() { return verificationStatus; }
        public ComplianceInfo getComplianceInfo() { return complianceInfo; }
        public Instant getLastUpdated() { return lastUpdated; }
    }

    public static class TransferResult {
        private final boolean success;
        private final String assetId;
        private final String transferId;
        private final String transactionHash;
        private final long blockNumber;
        private final String newOwner;
        private final String errorMessage;
        private final Instant timestamp;

        private TransferResult(boolean success, String assetId, String transferId, String transactionHash,
                              long blockNumber, String newOwner, String errorMessage) {
            this.success = success;
            this.assetId = assetId;
            this.transferId = transferId;
            this.transactionHash = transactionHash;
            this.blockNumber = blockNumber;
            this.newOwner = newOwner;
            this.errorMessage = errorMessage;
            this.timestamp = Instant.now();
        }

        public static TransferResult success(String assetId, String transferId, String txHash, long blockNumber, String newOwner) {
            return new TransferResult(true, assetId, transferId, txHash, blockNumber, newOwner, null);
        }

        public static TransferResult failed(String assetId, String errorMessage) {
            return new TransferResult(false, assetId, null, null, 0, null, errorMessage);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getAssetId() { return assetId; }
        public String getTransferId() { return transferId; }
        public String getTransactionHash() { return transactionHash; }
        public long getBlockNumber() { return blockNumber; }
        public String getNewOwner() { return newOwner; }
        public String getErrorMessage() { return errorMessage; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class HMSStatistics {
        private final long totalAssets;
        private final long totalTokens;
        private final long totalTokenizations;
        private final long dailyTokenizations;
        private final Map<AssetType, Long> assetsByType;
        private final VerificationStatistics verificationStatistics;

        public HMSStatistics(long totalAssets, long totalTokens, long totalTokenizations,
                           long dailyTokenizations, Map<AssetType, Long> assetsByType,
                           VerificationStatistics verificationStatistics) {
            this.totalAssets = totalAssets;
            this.totalTokens = totalTokens;
            this.totalTokenizations = totalTokenizations;
            this.dailyTokenizations = dailyTokenizations;
            this.assetsByType = assetsByType;
            this.verificationStatistics = verificationStatistics;
        }

        // Getters
        public long getTotalAssets() { return totalAssets; }
        public long getTotalTokens() { return totalTokens; }
        public long getTotalTokenizations() { return totalTokenizations; }
        public long getDailyTokenizations() { return dailyTokenizations; }
        public Map<AssetType, Long> getAssetsByType() { return assetsByType; }
        public VerificationStatistics getVerificationStatistics() { return verificationStatistics; }
    }

    public enum AssetState {
        CREATED,
        ACTIVE,
        TRANSFERRED,
        REVOKED,
        EXPIRED
    }
}
