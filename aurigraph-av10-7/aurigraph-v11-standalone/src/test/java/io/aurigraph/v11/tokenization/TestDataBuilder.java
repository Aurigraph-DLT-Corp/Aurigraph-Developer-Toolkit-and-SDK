package io.aurigraph.v11.tokenization;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Comprehensive test data builder for Aurigraph V11 Tokenization tests.
 *
 * Provides fluent builders for:
 * - Assets (Real Estate, Commodities, Securities, Digital Assets)
 * - Aggregation Pools (various weighting strategies)
 * - Distributions (multiple models: waterfall, tiered, pro-rata, consciousness-weighted)
 * - Primary Tokens and Fractional Ownership
 * - Token Holders and Balances
 *
 * Usage:
 * ```java
 * Asset realEstate = testDataBuilder.assetBuilder()
 *     .name("Luxury Condo")
 *     .type(AssetType.REAL_ESTATE)
 *     .value(BigDecimal.valueOf(5_000_000))
 *     .build();
 *
 * AggregationPool pool = testDataBuilder.poolBuilder()
 *     .name("Real Estate Index")
 *     .assets(Arrays.asList(realEstate))
 *     .weightingStrategy(WeightingStrategy.MARKET_CAP)
 *     .build();
 * ```
 *
 * @author Quality Assurance Agent (QAA)
 * @version 1.0
 * @since Phase 1 - Foundation Testing
 */
public class TestDataBuilder {

    private final Random random = new Random();

    // ==================== Asset Builders ====================

    /**
     * Creates a fluent builder for Asset entities
     */
    public AssetBuilder assetBuilder() {
        return new AssetBuilder();
    }

    /**
     * Generates a list of test assets with specified count
     */
    public List<Asset> generateAssets(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> assetBuilder()
                .name("Test Asset " + i)
                .type(randomAssetType())
                .value(randomValue(100_000, 10_000_000))
                .build())
            .collect(Collectors.toList());
    }

    /**
     * Generates a list of real estate assets
     */
    public List<Asset> generateRealEstateAssets(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> assetBuilder()
                .name("Real Estate Property " + i)
                .type(AssetType.REAL_ESTATE)
                .value(randomValue(500_000, 50_000_000))
                .metadata(Map.of(
                    "location", randomLocation(),
                    "squareFeet", String.valueOf(random.nextInt(10000) + 1000),
                    "yearBuilt", String.valueOf(random.nextInt(50) + 1975)
                ))
                .build())
            .collect(Collectors.toList());
    }

    // ==================== Pool Builders ====================

    /**
     * Creates a fluent builder for AggregationPool entities
     */
    public PoolBuilder poolBuilder() {
        return new PoolBuilder();
    }

    /**
     * Creates a test aggregation pool with specified number of assets
     */
    public AggregationPool createTestPool(int assetCount) {
        return poolBuilder()
            .name("Test Pool " + UUID.randomUUID().toString().substring(0, 8))
            .assets(generateAssets(assetCount))
            .weightingStrategy(WeightingStrategy.EQUAL)
            .state(PoolState.ACTIVE)
            .build();
    }

    // ==================== Distribution Builders ====================

    /**
     * Creates a fluent builder for Distribution entities
     */
    public DistributionBuilder distributionBuilder() {
        return new DistributionBuilder();
    }

    // ==================== Token Builders ====================

    /**
     * Creates a fluent builder for PrimaryToken entities
     */
    public PrimaryTokenBuilder primaryTokenBuilder() {
        return new PrimaryTokenBuilder();
    }

    /**
     * Creates a fluent builder for FractionalOwnership entities
     */
    public FractionalOwnershipBuilder fractionalOwnershipBuilder() {
        return new FractionalOwnershipBuilder();
    }

    // ==================== Holder Data Generators ====================

    /**
     * Generates a list of token holders with balances
     */
    public List<TokenHolder> generateHolders(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> TokenHolder.builder()
                .holderId("holder-" + String.format("%08d", i))
                .address("0x" + generateHexString(40))
                .balance(randomBalance())
                .joinedAt(Instant.now().minusSeconds(random.nextInt(365 * 24 * 3600)))
                .build())
            .collect(Collectors.toList());
    }

    /**
     * Generates holders with tiered balances (whales, dolphins, shrimp)
     */
    public List<TokenHolder> generateTieredHolders(int count) {
        List<TokenHolder> holders = new ArrayList<>();

        // 5% whales (100K+ tokens)
        int whaleCount = (int) (count * 0.05);
        for (int i = 0; i < whaleCount; i++) {
            holders.add(TokenHolder.builder()
                .holderId("whale-" + i)
                .balance(randomValue(100_000, 1_000_000))
                .tier(HolderTier.WHALE)
                .build());
        }

        // 20% dolphins (10K-100K tokens)
        int dolphinCount = (int) (count * 0.20);
        for (int i = 0; i < dolphinCount; i++) {
            holders.add(TokenHolder.builder()
                .holderId("dolphin-" + i)
                .balance(randomValue(10_000, 100_000))
                .tier(HolderTier.DOLPHIN)
                .build());
        }

        // 75% shrimp (<10K tokens)
        int shrimpCount = count - whaleCount - dolphinCount;
        for (int i = 0; i < shrimpCount; i++) {
            holders.add(TokenHolder.builder()
                .holderId("shrimp-" + i)
                .balance(randomValue(10, 10_000))
                .tier(HolderTier.SHRIMP)
                .build());
        }

        Collections.shuffle(holders);
        return holders;
    }

    // ==================== Helper Methods ====================

    private AssetType randomAssetType() {
        AssetType[] types = AssetType.values();
        return types[random.nextInt(types.length)];
    }

    private BigDecimal randomValue(long min, long max) {
        long value = min + (long) (random.nextDouble() * (max - min));
        return BigDecimal.valueOf(value);
    }

    private BigDecimal randomBalance() {
        return randomValue(10, 100_000);
    }

    private String randomLocation() {
        String[] cities = {"New York", "San Francisco", "Los Angeles", "Miami", "Chicago", "Seattle", "Austin"};
        return cities[random.nextInt(cities.length)];
    }

    private String generateHexString(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(Integer.toHexString(random.nextInt(16)));
        }
        return sb.toString();
    }

    // ==================== Fluent Builders ====================

    public static class AssetBuilder {
        private String id = UUID.randomUUID().toString();
        private String name = "Test Asset";
        private AssetType type = AssetType.REAL_ESTATE;
        private BigDecimal value = BigDecimal.valueOf(1_000_000);
        private Map<String, String> metadata = new HashMap<>();
        private Instant createdAt = Instant.now();

        public AssetBuilder id(String id) {
            this.id = id;
            return this;
        }

        public AssetBuilder name(String name) {
            this.name = name;
            return this;
        }

        public AssetBuilder type(AssetType type) {
            this.type = type;
            return this;
        }

        public AssetBuilder value(BigDecimal value) {
            this.value = value;
            return this;
        }

        public AssetBuilder metadata(Map<String, String> metadata) {
            this.metadata = metadata;
            return this;
        }

        public Asset build() {
            return new Asset(id, name, type, value, metadata, createdAt);
        }
    }

    public static class PoolBuilder {
        private String poolId = UUID.randomUUID().toString();
        private String name = "Test Pool";
        private List<Asset> assets = new ArrayList<>();
        private WeightingStrategy weightingStrategy = WeightingStrategy.EQUAL;
        private PoolState state = PoolState.ACTIVE;
        private Instant createdAt = Instant.now();

        public PoolBuilder poolId(String poolId) {
            this.poolId = poolId;
            return this;
        }

        public PoolBuilder name(String name) {
            this.name = name;
            return this;
        }

        public PoolBuilder assets(List<Asset> assets) {
            this.assets = assets;
            return this;
        }

        public PoolBuilder weightingStrategy(WeightingStrategy strategy) {
            this.weightingStrategy = strategy;
            return this;
        }

        public PoolBuilder state(PoolState state) {
            this.state = state;
            return this;
        }

        public AggregationPool build() {
            return new AggregationPool(poolId, name, assets, weightingStrategy, state, createdAt);
        }
    }

    public static class DistributionBuilder {
        private String distributionId = UUID.randomUUID().toString();
        private String poolId = UUID.randomUUID().toString();
        private Map<String, BigDecimal> holderPayments = new HashMap<>();
        private Instant timestamp = Instant.now();
        private DistributionModel model = DistributionModel.PRO_RATA;

        public DistributionBuilder distributionId(String distributionId) {
            this.distributionId = distributionId;
            return this;
        }

        public DistributionBuilder poolId(String poolId) {
            this.poolId = poolId;
            return this;
        }

        public DistributionBuilder holderPayments(Map<String, BigDecimal> payments) {
            this.holderPayments = payments;
            return this;
        }

        public DistributionBuilder model(DistributionModel model) {
            this.model = model;
            return this;
        }

        public Distribution build() {
            return new Distribution(distributionId, poolId, holderPayments, timestamp, model);
        }
    }

    public static class PrimaryTokenBuilder {
        private String tokenId = UUID.randomUUID().toString();
        private String assetId = UUID.randomUUID().toString();
        private Instant createdAt = Instant.now();
        private String merkleRoot;

        public PrimaryTokenBuilder tokenId(String tokenId) {
            this.tokenId = tokenId;
            return this;
        }

        public PrimaryTokenBuilder assetId(String assetId) {
            this.assetId = assetId;
            return this;
        }

        public PrimaryTokenBuilder merkleRoot(String merkleRoot) {
            this.merkleRoot = merkleRoot;
            return this;
        }

        public PrimaryToken build() {
            return new PrimaryToken(tokenId, assetId, merkleRoot, createdAt);
        }
    }

    public static class FractionalOwnershipBuilder {
        private String fractionalId = UUID.randomUUID().toString();
        private String primaryTokenId;
        private long totalFractions = 1_000_000;
        private long availableFractions = 1_000_000;
        private BigDecimal fractionPrice = BigDecimal.valueOf(1.0);

        public FractionalOwnershipBuilder fractionalId(String fractionalId) {
            this.fractionalId = fractionalId;
            return this;
        }

        public FractionalOwnershipBuilder primaryTokenId(String primaryTokenId) {
            this.primaryTokenId = primaryTokenId;
            return this;
        }

        public FractionalOwnershipBuilder totalFractions(long totalFractions) {
            this.totalFractions = totalFractions;
            return this;
        }

        public FractionalOwnershipBuilder availableFractions(long availableFractions) {
            this.availableFractions = availableFractions;
            return this;
        }

        public FractionalOwnershipBuilder fractionPrice(BigDecimal fractionPrice) {
            this.fractionPrice = fractionPrice;
            return this;
        }

        public FractionalOwnership build() {
            return new FractionalOwnership(fractionalId, primaryTokenId, totalFractions, availableFractions, fractionPrice);
        }
    }

    // ==================== Data Classes (Temporary - to be replaced by actual models) ====================

    public record Asset(String id, String name, AssetType type, BigDecimal value, Map<String, String> metadata, Instant createdAt) {
        public static AssetBuilder builder() {
            return new TestDataBuilder().new AssetBuilder();
        }
    }

    public record AggregationPool(String poolId, String name, List<Asset> assets, WeightingStrategy weightingStrategy, PoolState state, Instant createdAt) {
        public static PoolBuilder builder() {
            return new TestDataBuilder().new PoolBuilder();
        }
    }

    public record Distribution(String distributionId, String poolId, Map<String, BigDecimal> holderPayments, Instant timestamp, DistributionModel model) {
        public static DistributionBuilder builder() {
            return new TestDataBuilder().new DistributionBuilder();
        }
    }

    public record PrimaryToken(String tokenId, String assetId, String merkleRoot, Instant createdAt) {
        public static PrimaryTokenBuilder builder() {
            return new TestDataBuilder().new PrimaryTokenBuilder();
        }
    }

    public record FractionalOwnership(String fractionalId, String primaryTokenId, long totalFractions, long availableFractions, BigDecimal fractionPrice) {
        public static FractionalOwnershipBuilder builder() {
            return new TestDataBuilder().new FractionalOwnershipBuilder();
        }
    }

    public record TokenHolder(String holderId, String address, BigDecimal balance, Instant joinedAt, HolderTier tier) {
        public static TokenHolderBuilder builder() {
            return new TokenHolderBuilder();
        }

        public static class TokenHolderBuilder {
            private String holderId;
            private String address;
            private BigDecimal balance;
            private Instant joinedAt = Instant.now();
            private HolderTier tier = HolderTier.SHRIMP;

            public TokenHolderBuilder holderId(String holderId) {
                this.holderId = holderId;
                return this;
            }

            public TokenHolderBuilder address(String address) {
                this.address = address;
                return this;
            }

            public TokenHolderBuilder balance(BigDecimal balance) {
                this.balance = balance;
                return this;
            }

            public TokenHolderBuilder joinedAt(Instant joinedAt) {
                this.joinedAt = joinedAt;
                return this;
            }

            public TokenHolderBuilder tier(HolderTier tier) {
                this.tier = tier;
                return this;
            }

            public TokenHolder build() {
                return new TokenHolder(holderId, address, balance, joinedAt, tier);
            }
        }
    }

    // ==================== Enums ====================

    public enum AssetType {
        REAL_ESTATE,
        COMMODITIES,
        SECURITIES,
        DIGITAL_ASSETS,
        INTELLECTUAL_PROPERTY
    }

    public enum WeightingStrategy {
        EQUAL,
        MARKET_CAP,
        VOLATILITY_ADJUSTED,
        CUSTOM
    }

    public enum PoolState {
        PENDING,
        ACTIVE,
        SUSPENDED,
        CLOSED
    }

    public enum DistributionModel {
        PRO_RATA,
        WATERFALL,
        TIERED,
        CONSCIOUSNESS_WEIGHTED
    }

    public enum HolderTier {
        WHALE,      // 100K+ tokens
        DOLPHIN,    // 10K-100K tokens
        SHRIMP      // <10K tokens
    }
}
