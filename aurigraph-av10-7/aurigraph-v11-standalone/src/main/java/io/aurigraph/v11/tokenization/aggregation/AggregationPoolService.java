package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.aurigraph.v11.tokenization.aggregation.models.Token;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Core Aggregation Pool Service
 * Manages creation, management, and lifecycle of aggregation pools
 *
 * Performance Targets:
 * - Pool creation: <5 seconds
 * - Asset validation: <1s per 100 assets
 * - Merkle generation: <500ms per 100 assets
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation - Week 1-2
 */
@ApplicationScoped
public class AggregationPoolService {

    @Inject
    AssetCompositionValidator assetValidator;

    @Inject
    MerkleTreeService merkleService;

    @Inject
    WeightingStrategyEngine weightingEngine;

    // Pool registry (in-memory for Phase 1, will use persistent storage in Phase 2)
    private final Map<String, AggregationPool> poolRegistry = new ConcurrentHashMap<>();

    /**
     * Create a new aggregation pool
     *
     * @param assets List of assets to aggregate (2-1000 assets)
     * @param weightingStrategy Strategy for asset weighting
     * @param governanceModel Governance model for pool
     * @param distributionConfig Distribution configuration
     * @param creatorAddress Pool creator address
     * @return Pool creation result with performance metrics
     */
    public Uni<PoolCreationResult> createAggregatedPool(
            List<Asset> assets,
            Token.WeightingStrategy weightingStrategy,
            Token.GovernanceModel governanceModel,
            Token.DistributionConfig distributionConfig,
            String creatorAddress) {

        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            long validationStart = System.nanoTime();

            // Validate asset composition (target: <1s per 100 assets)
            AssetValidationResult validationResult = assetValidator.validateAssetComposition(assets);
            long validationEnd = System.nanoTime();

            if (!validationResult.isValid()) {
                throw new InvalidAssetCompositionException(
                    "Asset composition validation failed: " + validationResult.getErrors());
            }

            long weightingStart = System.nanoTime();
            // Calculate weights based on strategy
            List<Asset> weightedAssets = weightingEngine.calculateWeights(assets, weightingStrategy);
            long weightingEnd = System.nanoTime();

            long merkleStart = System.nanoTime();
            // Generate Merkle root for asset composition (target: <500ms per 100 assets)
            String merkleRoot = merkleService.generateMerkleRoot(weightedAssets);
            long merkleEnd = System.nanoTime();

            long poolSetupStart = System.nanoTime();
            // Generate deterministic pool address
            String poolAddress = generatePoolAddress(weightedAssets, creatorAddress);

            // Calculate total value locked
            BigDecimal totalValueLocked = weightedAssets.stream()
                .map(Asset::getCurrentValuation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Create initial token supply (1M tokens initially)
            BigDecimal initialSupply = BigDecimal.valueOf(1_000_000);
            BigDecimal tokenPrice = totalValueLocked.divide(initialSupply, 8, RoundingMode.HALF_UP);

            // Build aggregation token
            Token poolToken = Token.builder()
                .tokenId(UUID.randomUUID().toString())
                .poolAddress(poolAddress)
                .symbol(generatePoolSymbol(weightingStrategy))
                .name(generatePoolName(assets, weightingStrategy))
                .totalSupply(initialSupply)
                .circulatingSupply(initialSupply)
                .currentPrice(tokenPrice)
                .totalValueLocked(totalValueLocked)
                .merkleRoot(merkleRoot)
                .weightingStrategy(weightingStrategy)
                .governanceModel(governanceModel)
                .createdAt(Instant.now())
                .lastRebalanced(Instant.now())
                .creatorAddress(creatorAddress)
                .distributionConfig(distributionConfig)
                .underlyingAssets(weightedAssets.stream()
                    .map(Asset::getAssetId)
                    .collect(Collectors.toList()))
                .status(Token.PoolStatus.ACTIVE)
                .build();

            // Create aggregation pool
            AggregationPool pool = AggregationPool.builder()
                .poolAddress(poolAddress)
                .token(poolToken)
                .assets(weightedAssets)
                .holders(new ConcurrentHashMap<>())
                .createdAt(Instant.now())
                .build();

            // Initialize holder registry with creator
            pool.getHolders().put(creatorAddress, initialSupply);

            // Register pool
            poolRegistry.put(poolAddress, pool);
            long poolSetupEnd = System.nanoTime();

            long totalTime = System.nanoTime() - startTime;

            Log.infof("Created aggregation pool %s with %d assets, TVL: %s, in %.2f ms",
                poolAddress, assets.size(), totalValueLocked, totalTime / 1_000_000.0);

            // Performance metrics
            PerformanceMetrics metrics = PerformanceMetrics.builder()
                .validationTimeNanos(validationEnd - validationStart)
                .weightingTimeNanos(weightingEnd - weightingStart)
                .merkleTimeNanos(merkleEnd - merkleStart)
                .poolSetupTimeNanos(poolSetupEnd - poolSetupStart)
                .totalTimeNanos(totalTime)
                .assetCount(assets.size())
                .build();

            return PoolCreationResult.builder()
                .success(true)
                .poolAddress(poolAddress)
                .token(poolToken)
                .merkleRoot(merkleRoot)
                .metrics(metrics)
                .message("Pool created successfully")
                .build();

        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get pool by address
     */
    public Uni<Optional<AggregationPool>> getPool(String poolAddress) {
        return Uni.createFrom().item(() -> Optional.ofNullable(poolRegistry.get(poolAddress)))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all active pools
     */
    public Uni<List<AggregationPool>> getAllPools() {
        return Uni.createFrom().item(() -> {
            List<AggregationPool> pools = new ArrayList<>(poolRegistry.values());
            return pools;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get pool statistics
     */
    public Uni<PoolStatistics> getPoolStatistics(String poolAddress) {
        return Uni.createFrom().item(() -> {
            AggregationPool pool = poolRegistry.get(poolAddress);
            if (pool == null) {
                throw new PoolNotFoundException("Pool not found: " + poolAddress);
            }

            return PoolStatistics.builder()
                .poolAddress(poolAddress)
                .assetCount(pool.getAssets().size())
                .holderCount(pool.getHolders().size())
                .totalValueLocked(pool.getToken().getTotalValueLocked())
                .tokenPrice(pool.getToken().getCurrentPrice())
                .totalSupply(pool.getToken().getTotalSupply())
                .circulatingSupply(pool.getToken().getCirculatingSupply())
                .createdAt(pool.getCreatedAt())
                .build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private String generatePoolAddress(List<Asset> assets, String creator) {
        // Deterministic address generation from asset composition + creator
        String assetIds = assets.stream()
            .map(Asset::getAssetId)
            .sorted()
            .collect(Collectors.joining(","));
        return "POOL-" + UUID.nameUUIDFromBytes((assetIds + creator).getBytes()).toString();
    }

    private String generatePoolSymbol(Token.WeightingStrategy strategy) {
        return "AGG-" + strategy.name().substring(0, 3) + "-" + System.currentTimeMillis() % 1000;
    }

    private String generatePoolName(List<Asset> assets, Token.WeightingStrategy strategy) {
        String assetTypes = assets.stream()
            .map(Asset::getAssetType)
            .distinct()
            .limit(3)
            .collect(Collectors.joining("/"));
        return "Aggregated Pool (" + assetTypes + ") - " + strategy.name();
    }

    // Supporting classes

    /**
     * Aggregation pool data structure
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AggregationPool {
        private String poolAddress;
        private Token token;
        private List<Asset> assets;
        private Map<String, BigDecimal> holders; // address -> token balance
        private Instant createdAt;
        private Instant lastDistribution;
    }

    /**
     * Pool creation result
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PoolCreationResult {
        private boolean success;
        private String poolAddress;
        private Token token;
        private String merkleRoot;
        private PerformanceMetrics metrics;
        private String message;
    }

    /**
     * Performance metrics for pool creation
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PerformanceMetrics {
        private long validationTimeNanos;
        private long weightingTimeNanos;
        private long merkleTimeNanos;
        private long poolSetupTimeNanos;
        private long totalTimeNanos;
        private int assetCount;

        public double getTotalTimeMs() {
            return totalTimeNanos / 1_000_000.0;
        }

        public boolean meetsTarget() {
            // Target: <5 seconds for pool creation
            return getTotalTimeMs() < 5000.0;
        }
    }

    /**
     * Pool statistics
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PoolStatistics {
        private String poolAddress;
        private int assetCount;
        private int holderCount;
        private BigDecimal totalValueLocked;
        private BigDecimal tokenPrice;
        private BigDecimal totalSupply;
        private BigDecimal circulatingSupply;
        private Instant createdAt;
    }

    /**
     * Asset validation result
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AssetValidationResult {
        private boolean valid;
        private List<String> errors;
    }

    // Exceptions

    public static class InvalidAssetCompositionException extends RuntimeException {
        public InvalidAssetCompositionException(String message) {
            super(message);
        }
    }

    public static class PoolNotFoundException extends RuntimeException {
        public PoolNotFoundException(String message) {
            super(message);
        }
    }
}
