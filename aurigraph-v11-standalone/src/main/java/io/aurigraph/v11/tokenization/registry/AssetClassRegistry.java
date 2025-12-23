package io.aurigraph.v11.tokenization.registry;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.logging.Log;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Multi-Asset Class Registry for Composite Token Management.
 *
 * <p>This registry provides a centralized management system for tokenized assets
 * across multiple asset classes. Each asset class maintains its own Merkle tree
 * for cryptographic verification and proof generation.</p>
 *
 * <h2>Supported Asset Classes:</h2>
 * <ul>
 *   <li>{@link AssetClass#REAL_ESTATE} - Real estate properties and land</li>
 *   <li>{@link AssetClass#VEHICLE} - Vehicles including cars, aircraft, vessels</li>
 *   <li>{@link AssetClass#COMMODITY} - Physical commodities (gold, oil, etc.)</li>
 *   <li>{@link AssetClass#INTELLECTUAL_PROPERTY} - Patents, trademarks, copyrights</li>
 *   <li>{@link AssetClass#FINANCIAL} - Financial instruments (bonds, equities)</li>
 * </ul>
 *
 * <h2>Performance Characteristics:</h2>
 * <ul>
 *   <li>Token registration: &lt;100ms for 1K tokens</li>
 *   <li>Merkle proof generation: O(log n)</li>
 *   <li>Cross-registry queries: &lt;50ms</li>
 * </ul>
 *
 * @author Aurigraph DLT Platform - Sprint 8-9
 * @version 12.0.0
 * @since 2025-12-23
 * @see OptimizedMerkleTreeBuilder
 * @see RegistryAnalyticsAggregator
 */
@ApplicationScoped
public class AssetClassRegistry {

    /**
     * Enumeration of supported asset classes in the registry.
     */
    public enum AssetClass {
        /** Real estate properties including residential, commercial, and land */
        REAL_ESTATE("RE", "Real Estate", BigDecimal.valueOf(0.001)),

        /** Vehicles including automobiles, aircraft, and marine vessels */
        VEHICLE("VH", "Vehicle", BigDecimal.valueOf(0.002)),

        /** Physical commodities such as precious metals, energy, and agricultural products */
        COMMODITY("CM", "Commodity", BigDecimal.valueOf(0.0015)),

        /** Intellectual property including patents, trademarks, and copyrights */
        INTELLECTUAL_PROPERTY("IP", "Intellectual Property", BigDecimal.valueOf(0.003)),

        /** Financial instruments including bonds, equities, and derivatives */
        FINANCIAL("FN", "Financial", BigDecimal.valueOf(0.001));

        private final String code;
        private final String displayName;
        private final BigDecimal baseTransactionFee;

        AssetClass(String code, String displayName, BigDecimal baseTransactionFee) {
            this.code = code;
            this.displayName = displayName;
            this.baseTransactionFee = baseTransactionFee;
        }

        /**
         * Returns the short code for this asset class.
         * @return the asset class code
         */
        public String getCode() {
            return code;
        }

        /**
         * Returns the human-readable display name.
         * @return the display name
         */
        public String getDisplayName() {
            return displayName;
        }

        /**
         * Returns the base transaction fee for this asset class.
         * @return the base fee as BigDecimal
         */
        public BigDecimal getBaseTransactionFee() {
            return baseTransactionFee;
        }

        /**
         * Finds an asset class by its code.
         * @param code the asset class code
         * @return Optional containing the asset class if found
         */
        public static Optional<AssetClass> fromCode(String code) {
            return Arrays.stream(values())
                    .filter(ac -> ac.code.equalsIgnoreCase(code))
                    .findFirst();
        }
    }

    /**
     * Represents a registered token in the registry.
     */
    public static class RegisteredToken {
        private final String tokenId;
        private final AssetClass assetClass;
        private final String assetId;
        private final BigDecimal valuation;
        private final String ownerAddress;
        private final Instant registrationTime;
        private final Map<String, String> metadata;
        private String merkleLeafHash;
        private boolean verified;

        /**
         * Creates a new registered token.
         * @param tokenId unique token identifier
         * @param assetClass the asset class
         * @param assetId underlying asset identifier
         * @param valuation current valuation
         * @param ownerAddress owner's blockchain address
         * @param metadata additional token metadata
         */
        public RegisteredToken(String tokenId, AssetClass assetClass, String assetId,
                               BigDecimal valuation, String ownerAddress, Map<String, String> metadata) {
            this.tokenId = Objects.requireNonNull(tokenId, "tokenId cannot be null");
            this.assetClass = Objects.requireNonNull(assetClass, "assetClass cannot be null");
            this.assetId = Objects.requireNonNull(assetId, "assetId cannot be null");
            this.valuation = Objects.requireNonNull(valuation, "valuation cannot be null");
            this.ownerAddress = Objects.requireNonNull(ownerAddress, "ownerAddress cannot be null");
            this.registrationTime = Instant.now();
            this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
            this.verified = false;
        }

        // Getters
        public String getTokenId() { return tokenId; }
        public AssetClass getAssetClass() { return assetClass; }
        public String getAssetId() { return assetId; }
        public BigDecimal getValuation() { return valuation; }
        public String getOwnerAddress() { return ownerAddress; }
        public Instant getRegistrationTime() { return registrationTime; }
        public Map<String, String> getMetadata() { return Collections.unmodifiableMap(metadata); }
        public String getMerkleLeafHash() { return merkleLeafHash; }
        public boolean isVerified() { return verified; }

        void setMerkleLeafHash(String hash) { this.merkleLeafHash = hash; }
        void setVerified(boolean verified) { this.verified = verified; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            RegisteredToken that = (RegisteredToken) o;
            return tokenId.equals(that.tokenId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(tokenId);
        }
    }

    /**
     * Result of a token registration operation.
     */
    public static class RegistrationResult {
        private final boolean success;
        private final String tokenId;
        private final String merkleRoot;
        private final String message;
        private final long processingTimeMs;

        /**
         * Creates a successful registration result.
         */
        public static RegistrationResult success(String tokenId, String merkleRoot, long processingTimeMs) {
            return new RegistrationResult(true, tokenId, merkleRoot, "Registration successful", processingTimeMs);
        }

        /**
         * Creates a failed registration result.
         */
        public static RegistrationResult failure(String message) {
            return new RegistrationResult(false, null, null, message, 0);
        }

        private RegistrationResult(boolean success, String tokenId, String merkleRoot,
                                   String message, long processingTimeMs) {
            this.success = success;
            this.tokenId = tokenId;
            this.merkleRoot = merkleRoot;
            this.message = message;
            this.processingTimeMs = processingTimeMs;
        }

        public boolean isSuccess() { return success; }
        public String getTokenId() { return tokenId; }
        public String getMerkleRoot() { return merkleRoot; }
        public String getMessage() { return message; }
        public long getProcessingTimeMs() { return processingTimeMs; }
    }

    // Registry storage - one map per asset class
    private final Map<AssetClass, ConcurrentHashMap<String, RegisteredToken>> registries;

    // Merkle trees per asset class
    private final Map<AssetClass, OptimizedMerkleTreeBuilder> merkleTrees;

    // Statistics counters
    private final Map<AssetClass, AtomicLong> registrationCounts;
    private final AtomicLong totalRegistrations;
    private final AtomicLong totalValueLocked;

    @Inject
    OptimizedMerkleTreeBuilder merkleTreeBuilder;

    /**
     * Constructs a new AssetClassRegistry with initialized storage for all asset classes.
     */
    public AssetClassRegistry() {
        this.registries = new EnumMap<>(AssetClass.class);
        this.merkleTrees = new EnumMap<>(AssetClass.class);
        this.registrationCounts = new EnumMap<>(AssetClass.class);
        this.totalRegistrations = new AtomicLong(0);
        this.totalValueLocked = new AtomicLong(0);

        // Initialize storage for each asset class
        for (AssetClass assetClass : AssetClass.values()) {
            registries.put(assetClass, new ConcurrentHashMap<>());
            merkleTrees.put(assetClass, new OptimizedMerkleTreeBuilder());
            registrationCounts.put(assetClass, new AtomicLong(0));
        }

        Log.info("AssetClassRegistry initialized with " + AssetClass.values().length + " asset classes");
    }

    /**
     * Registers a new token in the appropriate asset class registry.
     *
     * @param token the token to register
     * @return registration result with success status and Merkle root
     * @throws IllegalArgumentException if token is null or invalid
     */
    public RegistrationResult registerToken(RegisteredToken token) {
        Objects.requireNonNull(token, "Token cannot be null");
        long startTime = System.nanoTime();

        // Validate token
        if (!validateToken(token)) {
            return RegistrationResult.failure("Token validation failed");
        }

        AssetClass assetClass = token.getAssetClass();
        ConcurrentHashMap<String, RegisteredToken> registry = registries.get(assetClass);

        // Check for duplicate
        if (registry.containsKey(token.getTokenId())) {
            return RegistrationResult.failure("Token already registered: " + token.getTokenId());
        }

        // Generate Merkle leaf hash
        OptimizedMerkleTreeBuilder merkleTree = merkleTrees.get(assetClass);
        String leafHash = merkleTree.addLeaf(token.getTokenId(), token.getValuation());
        token.setMerkleLeafHash(leafHash);
        token.setVerified(true);

        // Register token
        registry.put(token.getTokenId(), token);

        // Update statistics
        registrationCounts.get(assetClass).incrementAndGet();
        totalRegistrations.incrementAndGet();
        totalValueLocked.addAndGet(token.getValuation().longValue());

        long processingTime = (System.nanoTime() - startTime) / 1_000_000;
        Log.debugf("Token %s registered in %dms", token.getTokenId(), processingTime);

        return RegistrationResult.success(token.getTokenId(), merkleTree.getMerkleRoot(), processingTime);
    }

    /**
     * Registers multiple tokens in a batch operation.
     *
     * @param tokens list of tokens to register
     * @return list of registration results
     */
    public List<RegistrationResult> registerTokenBatch(List<RegisteredToken> tokens) {
        Objects.requireNonNull(tokens, "Tokens list cannot be null");

        if (tokens.isEmpty()) {
            return Collections.emptyList();
        }

        long startTime = System.nanoTime();
        List<RegistrationResult> results = new ArrayList<>(tokens.size());

        // Group tokens by asset class for efficient Merkle tree updates
        Map<AssetClass, List<RegisteredToken>> groupedTokens = tokens.stream()
                .collect(Collectors.groupingBy(RegisteredToken::getAssetClass));

        for (Map.Entry<AssetClass, List<RegisteredToken>> entry : groupedTokens.entrySet()) {
            AssetClass assetClass = entry.getKey();
            List<RegisteredToken> classTokens = entry.getValue();

            OptimizedMerkleTreeBuilder merkleTree = merkleTrees.get(assetClass);
            ConcurrentHashMap<String, RegisteredToken> registry = registries.get(assetClass);

            // Batch add to Merkle tree
            for (RegisteredToken token : classTokens) {
                if (!validateToken(token)) {
                    results.add(RegistrationResult.failure("Validation failed: " + token.getTokenId()));
                    continue;
                }

                if (registry.containsKey(token.getTokenId())) {
                    results.add(RegistrationResult.failure("Duplicate: " + token.getTokenId()));
                    continue;
                }

                String leafHash = merkleTree.addLeaf(token.getTokenId(), token.getValuation());
                token.setMerkleLeafHash(leafHash);
                token.setVerified(true);
                registry.put(token.getTokenId(), token);

                registrationCounts.get(assetClass).incrementAndGet();
                totalRegistrations.incrementAndGet();
                totalValueLocked.addAndGet(token.getValuation().longValue());
            }

            // Rebuild Merkle tree once per asset class
            merkleTree.rebuildTree();
            String merkleRoot = merkleTree.getMerkleRoot();

            long processingTime = (System.nanoTime() - startTime) / 1_000_000;
            for (RegisteredToken token : classTokens) {
                if (token.isVerified()) {
                    results.add(RegistrationResult.success(token.getTokenId(), merkleRoot, processingTime));
                }
            }
        }

        long totalTime = (System.nanoTime() - startTime) / 1_000_000;
        Log.infof("Batch registered %d tokens in %dms", tokens.size(), totalTime);

        return results;
    }

    /**
     * Retrieves a token by its ID from any asset class.
     *
     * @param tokenId the token identifier
     * @return Optional containing the token if found
     */
    public Optional<RegisteredToken> getToken(String tokenId) {
        Objects.requireNonNull(tokenId, "tokenId cannot be null");

        for (ConcurrentHashMap<String, RegisteredToken> registry : registries.values()) {
            RegisteredToken token = registry.get(tokenId);
            if (token != null) {
                return Optional.of(token);
            }
        }
        return Optional.empty();
    }

    /**
     * Retrieves a token from a specific asset class.
     *
     * @param assetClass the asset class to search
     * @param tokenId the token identifier
     * @return Optional containing the token if found
     */
    public Optional<RegisteredToken> getToken(AssetClass assetClass, String tokenId) {
        Objects.requireNonNull(assetClass, "assetClass cannot be null");
        Objects.requireNonNull(tokenId, "tokenId cannot be null");

        return Optional.ofNullable(registries.get(assetClass).get(tokenId));
    }

    /**
     * Returns all tokens in a specific asset class.
     *
     * @param assetClass the asset class
     * @return unmodifiable collection of tokens
     */
    public Collection<RegisteredToken> getTokensByClass(AssetClass assetClass) {
        Objects.requireNonNull(assetClass, "assetClass cannot be null");
        return Collections.unmodifiableCollection(registries.get(assetClass).values());
    }

    /**
     * Returns all tokens owned by a specific address.
     *
     * @param ownerAddress the owner's blockchain address
     * @return list of tokens owned by the address
     */
    public List<RegisteredToken> getTokensByOwner(String ownerAddress) {
        Objects.requireNonNull(ownerAddress, "ownerAddress cannot be null");

        return registries.values().stream()
                .flatMap(registry -> registry.values().stream())
                .filter(token -> token.getOwnerAddress().equals(ownerAddress))
                .collect(Collectors.toList());
    }

    /**
     * Generates a Merkle proof for a specific token.
     *
     * @param tokenId the token identifier
     * @return Optional containing the Merkle proof if token exists
     */
    public Optional<List<String>> getMerkleProof(String tokenId) {
        Optional<RegisteredToken> tokenOpt = getToken(tokenId);
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }

        RegisteredToken token = tokenOpt.get();
        OptimizedMerkleTreeBuilder merkleTree = merkleTrees.get(token.getAssetClass());
        return Optional.of(merkleTree.generateProof(tokenId));
    }

    /**
     * Verifies a token's inclusion in the Merkle tree.
     *
     * @param tokenId the token identifier
     * @param proof the Merkle proof
     * @return true if the proof is valid
     */
    public boolean verifyMerkleProof(String tokenId, List<String> proof) {
        Optional<RegisteredToken> tokenOpt = getToken(tokenId);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        RegisteredToken token = tokenOpt.get();
        OptimizedMerkleTreeBuilder merkleTree = merkleTrees.get(token.getAssetClass());
        return merkleTree.verifyProof(tokenId, proof, merkleTree.getMerkleRoot());
    }

    /**
     * Returns the Merkle root for a specific asset class.
     *
     * @param assetClass the asset class
     * @return the current Merkle root
     */
    public String getMerkleRoot(AssetClass assetClass) {
        Objects.requireNonNull(assetClass, "assetClass cannot be null");
        return merkleTrees.get(assetClass).getMerkleRoot();
    }

    /**
     * Returns the count of registered tokens for an asset class.
     *
     * @param assetClass the asset class
     * @return the token count
     */
    public long getTokenCount(AssetClass assetClass) {
        Objects.requireNonNull(assetClass, "assetClass cannot be null");
        return registrationCounts.get(assetClass).get();
    }

    /**
     * Returns the total count of all registered tokens.
     *
     * @return total token count across all asset classes
     */
    public long getTotalTokenCount() {
        return totalRegistrations.get();
    }

    /**
     * Returns the total value locked across all registries.
     *
     * @return total value as BigDecimal
     */
    public BigDecimal getTotalValueLocked() {
        return BigDecimal.valueOf(totalValueLocked.get());
    }

    /**
     * Returns value locked for a specific asset class.
     *
     * @param assetClass the asset class
     * @return total value locked in the asset class
     */
    public BigDecimal getValueLockedByClass(AssetClass assetClass) {
        Objects.requireNonNull(assetClass, "assetClass cannot be null");
        return registries.get(assetClass).values().stream()
                .map(RegisteredToken::getValuation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Returns registry statistics for all asset classes.
     *
     * @return map of asset class to statistics
     */
    public Map<AssetClass, RegistryStatistics> getStatistics() {
        Map<AssetClass, RegistryStatistics> stats = new EnumMap<>(AssetClass.class);

        for (AssetClass assetClass : AssetClass.values()) {
            ConcurrentHashMap<String, RegisteredToken> registry = registries.get(assetClass);
            BigDecimal totalValue = registry.values().stream()
                    .map(RegisteredToken::getValuation)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            stats.put(assetClass, new RegistryStatistics(
                    assetClass,
                    registry.size(),
                    totalValue,
                    merkleTrees.get(assetClass).getMerkleRoot(),
                    merkleTrees.get(assetClass).getTreeHeight()
            ));
        }

        return stats;
    }

    /**
     * Validates a token before registration.
     */
    private boolean validateToken(RegisteredToken token) {
        if (token.getTokenId() == null || token.getTokenId().isBlank()) {
            Log.warn("Token validation failed: empty tokenId");
            return false;
        }
        if (token.getValuation() == null || token.getValuation().signum() <= 0) {
            Log.warn("Token validation failed: invalid valuation");
            return false;
        }
        if (token.getOwnerAddress() == null || token.getOwnerAddress().isBlank()) {
            Log.warn("Token validation failed: empty ownerAddress");
            return false;
        }
        return true;
    }

    /**
     * Statistics for a single asset class registry.
     */
    public static class RegistryStatistics {
        private final AssetClass assetClass;
        private final long tokenCount;
        private final BigDecimal totalValue;
        private final String merkleRoot;
        private final int treeHeight;

        public RegistryStatistics(AssetClass assetClass, long tokenCount, BigDecimal totalValue,
                                  String merkleRoot, int treeHeight) {
            this.assetClass = assetClass;
            this.tokenCount = tokenCount;
            this.totalValue = totalValue;
            this.merkleRoot = merkleRoot;
            this.treeHeight = treeHeight;
        }

        public AssetClass getAssetClass() { return assetClass; }
        public long getTokenCount() { return tokenCount; }
        public BigDecimal getTotalValue() { return totalValue; }
        public String getMerkleRoot() { return merkleRoot; }
        public int getTreeHeight() { return treeHeight; }
    }
}
