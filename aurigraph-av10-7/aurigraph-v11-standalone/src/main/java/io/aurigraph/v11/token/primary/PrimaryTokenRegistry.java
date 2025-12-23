package io.aurigraph.v11.token.primary;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Primary Token Registry - Sprint 1 Implementation
 *
 * Provides a centralized, high-performance registry for primary tokens with:
 * - Multi-index support (tokenId, owner, assetClass, status)
 * - Merkle tree verification for integrity
 * - In-memory caching for sub-5ms lookups
 * - Performance metrics and consistency reporting
 *
 * Performance Requirements:
 * - Registration (1,000 tokens): < 100ms
 * - Lookup by ID: < 5ms
 * - Consistency check: < 500ms
 *
 * @author Composite Token System - Sprint 1
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@ApplicationScoped
public class PrimaryTokenRegistry {

    private static final Logger LOG = Logger.getLogger(PrimaryTokenRegistry.class);

    @Inject
    PrimaryTokenMerkleService merkleService;

    @Inject
    PrimaryTokenFactory.PrimaryTokenRepository repository;

    // =============== INDEXES ===============

    // Primary index: tokenId → RegistryEntry
    private final ConcurrentHashMap<String, RegistryEntry> tokenIndex = new ConcurrentHashMap<>();

    // Owner index: owner → Set<tokenId>
    private final ConcurrentHashMap<String, Set<String>> ownerIndex = new ConcurrentHashMap<>();

    // Asset class index: assetClass → Set<tokenId>
    private final ConcurrentHashMap<String, Set<String>> assetClassIndex = new ConcurrentHashMap<>();

    // Status index: status → Set<tokenId>
    private final ConcurrentHashMap<PrimaryToken.PrimaryTokenStatus, Set<String>> statusIndex = new ConcurrentHashMap<>();

    // =============== MERKLE TRACKING ===============

    private PrimaryTokenMerkleService.MerkleTree registryTree;
    private String registryMerkleRoot = "";
    private Instant lastTreeUpdate;

    // =============== PERFORMANCE METRICS ===============

    private long registrationCount = 0;
    private long lookupCount = 0;
    private long totalLookupTimeNs = 0;
    private long statusUpdateCount = 0;
    private long consistencyCheckCount = 0;

    /**
     * Register a new primary token in the registry
     *
     * @param token The primary token to register
     * @return Uni containing the registry entry
     */
    @Transactional
    public Uni<RegistryEntry> register(PrimaryToken token) {
        return Uni.createFrom().item(() -> {
            if (token == null) {
                throw new IllegalArgumentException("Token cannot be null");
            }

            if (tokenIndex.containsKey(token.tokenId)) {
                throw new IllegalStateException("Token already registered: " + token.tokenId);
            }

            // Create registry entry
            RegistryEntry entry = new RegistryEntry(
                    token.tokenId,
                    token.owner,
                    token.assetClass,
                    token.status,
                    token.faceValue,
                    merkleService.hashPrimaryToken(token),
                    Instant.now()
            );

            // Add to primary index
            tokenIndex.put(token.tokenId, entry);

            // Update owner index
            ownerIndex.computeIfAbsent(token.owner, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            // Update asset class index
            assetClassIndex.computeIfAbsent(token.assetClass, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            // Update status index
            statusIndex.computeIfAbsent(token.status, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            registrationCount++;

            LOG.debugf("Registered primary token: %s (owner: %s, class: %s)",
                    token.tokenId, token.owner, token.assetClass);

            return entry;
        });
    }

    /**
     * Lookup a token by token ID (< 5ms target)
     *
     * @param tokenId The token ID to lookup
     * @return Uni containing the registry entry
     */
    public Uni<RegistryEntry> lookup(String tokenId) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            RegistryEntry entry = tokenIndex.get(tokenId);

            long duration = System.nanoTime() - startTime;
            synchronized (this) {
                lookupCount++;
                totalLookupTimeNs += duration;
            }

            if (entry == null) {
                LOG.debugf("Token lookup: %s - NOT FOUND", tokenId);
            }

            return entry;
        });
    }

    /**
     * Lookup all tokens by owner
     *
     * @param owner The owner address
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> lookupByOwner(String owner) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = ownerIndex.get(owner);
            if (tokenIds == null || tokenIds.isEmpty()) {
                return new ArrayList<>();
            }

            return tokenIds.stream()
                    .map(tokenIndex::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Lookup all tokens by asset class
     *
     * @param assetClass The asset class
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> lookupByAssetClass(String assetClass) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = assetClassIndex.get(assetClass);
            if (tokenIds == null || tokenIds.isEmpty()) {
                return new ArrayList<>();
            }

            return tokenIds.stream()
                    .map(tokenIndex::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Lookup all tokens by status
     *
     * @param status The token status
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> lookupByStatus(PrimaryToken.PrimaryTokenStatus status) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = statusIndex.get(status);
            if (tokenIds == null || tokenIds.isEmpty()) {
                return new ArrayList<>();
            }

            return tokenIds.stream()
                    .map(tokenIndex::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Update token status and rebuild index
     *
     * @param tokenId The token ID
     * @param newStatus The new status
     * @return Uni containing updated registry entry
     */
    @Transactional
    public Uni<RegistryEntry> updateStatus(String tokenId, PrimaryToken.PrimaryTokenStatus newStatus) {
        return Uni.createFrom().item(() -> {
            RegistryEntry entry = tokenIndex.get(tokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            // Remove from old status index
            Set<String> oldStatusSet = statusIndex.get(entry.status);
            if (oldStatusSet != null) {
                oldStatusSet.remove(tokenId);
            }

            // Update entry
            entry.status = newStatus;
            entry.lastUpdated = Instant.now();

            // Add to new status index
            statusIndex.computeIfAbsent(newStatus, k -> ConcurrentHashMap.newKeySet())
                    .add(tokenId);

            statusUpdateCount++;

            LOG.debugf("Updated token %s status to %s", tokenId, newStatus);

            return entry;
        });
    }

    /**
     * Update token owner (on transfer)
     *
     * @param tokenId The token ID
     * @param newOwner The new owner address
     * @return Uni containing updated registry entry
     */
    @Transactional
    public Uni<RegistryEntry> updateOwner(String tokenId, String newOwner) {
        return Uni.createFrom().item(() -> {
            RegistryEntry entry = tokenIndex.get(tokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            // Remove from old owner index
            Set<String> oldOwnerSet = ownerIndex.get(entry.owner);
            if (oldOwnerSet != null) {
                oldOwnerSet.remove(tokenId);
            }

            // Update entry
            entry.owner = newOwner;
            entry.lastUpdated = Instant.now();

            // Add to new owner index
            ownerIndex.computeIfAbsent(newOwner, k -> ConcurrentHashMap.newKeySet())
                    .add(tokenId);

            LOG.debugf("Updated token %s owner to %s", tokenId, newOwner);

            return entry;
        });
    }

    /**
     * Generate a Merkle proof for a token
     *
     * @param tokenId The token ID to generate proof for
     * @return Uni containing the registry proof
     */
    public Uni<RegistryProof> generateProof(String tokenId) {
        return Uni.createFrom().item(() -> {
            RegistryEntry entry = tokenIndex.get(tokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            if (registryTree == null || registryTree.leafCount == 0) {
                throw new IllegalStateException("Registry tree not built");
            }

            PrimaryTokenMerkleService.MerkleProof proof =
                    merkleService.generateProofByTokenHash(registryTree, entry.merkleHash);

            if (proof == null) {
                throw new IllegalStateException("Could not generate proof for token: " + tokenId);
            }

            return new RegistryProof(tokenId, entry.merkleHash, registryMerkleRoot, proof);
        });
    }

    /**
     * Verify a registry proof
     *
     * @param proof The registry proof to verify
     * @return true if the proof is valid
     */
    public boolean verifyProof(RegistryProof proof) {
        if (proof == null || proof.merkleProof == null) {
            return false;
        }
        return merkleService.verifyProof(proof.merkleProof);
    }

    /**
     * Get registry statistics
     *
     * @return RegistryStats with counts by category
     */
    public RegistryStats getStats() {
        return new RegistryStats(
                tokenIndex.size(),
                (int) statusIndex.getOrDefault(PrimaryToken.PrimaryTokenStatus.CREATED, Collections.emptySet()).size(),
                (int) statusIndex.getOrDefault(PrimaryToken.PrimaryTokenStatus.VERIFIED, Collections.emptySet()).size(),
                (int) statusIndex.getOrDefault(PrimaryToken.PrimaryTokenStatus.TRANSFERRED, Collections.emptySet()).size(),
                (int) statusIndex.getOrDefault(PrimaryToken.PrimaryTokenStatus.RETIRED, Collections.emptySet()).size(),
                ownerIndex.size(),
                assetClassIndex.size()
        );
    }

    /**
     * Get registry performance metrics
     *
     * @return RegistryMetrics with performance data
     */
    public RegistryMetrics getMetrics() {
        synchronized (this) {
            return new RegistryMetrics(
                    registrationCount,
                    lookupCount,
                    lookupCount > 0 ? totalLookupTimeNs / lookupCount / 1_000 : 0,
                    tokenIndex.size(),
                    registryMerkleRoot,
                    lastTreeUpdate
            );
        }
    }

    /**
     * Validate registry consistency
     *
     * @return Uni containing consistency report
     */
    public Uni<ConsistencyReport> validateConsistency() {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            List<PrimaryToken> allTokens = tokenIndex.values().stream()
                    .map(entry -> new PrimaryToken(
                            entry.tokenId,
                            "DT-" + entry.tokenId,
                            entry.assetClass,
                            entry.faceValue,
                            entry.owner
                    ))
                    .collect(Collectors.toList());

            PrimaryTokenMerkleService.MerkleTree computedTree = merkleService.buildPrimaryTokenTree(allTokens);

            int inconsistentCount = 0;
            List<String> issues = new ArrayList<>();

            if (!computedTree.root.equals(registryMerkleRoot)) {
                inconsistentCount++;
                issues.add("Root mismatch");
            }

            if (tokenIndex.size() != computedTree.leafCount) {
                inconsistentCount++;
                issues.add("Leaf count mismatch");
            }

            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                consistencyCheckCount++;
            }

            boolean consistent = inconsistentCount == 0;
            LOG.infof("Registry consistency check: %s in %dms",
                    consistent ? "CONSISTENT" : "INCONSISTENT", duration);

            return new ConsistencyReport(
                    tokenIndex.size(),
                    tokenIndex.size() - inconsistentCount,
                    inconsistentCount,
                    registryMerkleRoot,
                    issues,
                    Instant.now(),
                    duration
            );
        });
    }

    /**
     * Bulk register multiple tokens (< 100ms for 1K tokens)
     *
     * @param tokens List of tokens to register
     * @return Uni containing list of registry entries
     */
    @Transactional
    public Uni<List<RegistryEntry>> bulkRegister(List<PrimaryToken> tokens) {
        return Uni.createFrom().item(() -> {
            List<RegistryEntry> entries = new ArrayList<>();

            for (PrimaryToken token : tokens) {
                if (!tokenIndex.containsKey(token.tokenId)) {
                    RegistryEntry entry = new RegistryEntry(
                            token.tokenId,
                            token.owner,
                            token.assetClass,
                            token.status,
                            token.faceValue,
                            merkleService.hashPrimaryToken(token),
                            Instant.now()
                    );

                    tokenIndex.put(token.tokenId, entry);
                    ownerIndex.computeIfAbsent(token.owner, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);
                    assetClassIndex.computeIfAbsent(token.assetClass, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);
                    statusIndex.computeIfAbsent(token.status, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);

                    entries.add(entry);
                    registrationCount++;
                }
            }

            // Rebuild registry tree after bulk operation
            rebuildRegistryTree(tokens);

            LOG.infof("Bulk registered %d primary tokens", entries.size());

            return entries;
        });
    }

    /**
     * Rebuild the registry Merkle tree
     */
    private void rebuildRegistryTree(List<PrimaryToken> tokens) {
        if (tokens != null && !tokens.isEmpty()) {
            registryTree = merkleService.buildPrimaryTokenTree(tokens);
            registryMerkleRoot = registryTree.root;
            lastTreeUpdate = Instant.now();
            merkleService.cacheTokenTree("registry", registryTree);
        }
    }

    /**
     * Clear all registry data and caches
     */
    public void clear() {
        tokenIndex.clear();
        ownerIndex.clear();
        assetClassIndex.clear();
        statusIndex.clear();
        registryTree = null;
        registryMerkleRoot = "";
        merkleService.clearTokenTreeCache();
        LOG.info("Cleared primary token registry");
    }

    // =============== INNER CLASSES ===============

    /**
     * Registry entry for a primary token
     */
    public static class RegistryEntry {
        public String tokenId;
        public String owner;
        public String assetClass;
        public PrimaryToken.PrimaryTokenStatus status;
        public java.math.BigDecimal faceValue;
        public String merkleHash;
        public Instant registeredAt;
        public Instant lastUpdated;

        public RegistryEntry(String tokenId, String owner, String assetClass,
                           PrimaryToken.PrimaryTokenStatus status, java.math.BigDecimal faceValue,
                           String merkleHash, Instant registeredAt) {
            this.tokenId = tokenId;
            this.owner = owner;
            this.assetClass = assetClass;
            this.status = status;
            this.faceValue = faceValue;
            this.merkleHash = merkleHash;
            this.registeredAt = registeredAt;
            this.lastUpdated = registeredAt;
        }

        @Override
        public String toString() {
            return String.format("RegistryEntry{id=%s, owner=%s, class=%s, status=%s}",
                    tokenId, owner, assetClass, status);
        }
    }

    /**
     * Merkle proof with registry context
     */
    public static class RegistryProof {
        public final String tokenId;
        public final String tokenHash;
        public final String registryRoot;
        public final PrimaryTokenMerkleService.MerkleProof merkleProof;
        public final Instant generatedAt;

        public RegistryProof(String tokenId, String tokenHash, String registryRoot,
                           PrimaryTokenMerkleService.MerkleProof merkleProof) {
            this.tokenId = tokenId;
            this.tokenHash = tokenHash;
            this.registryRoot = registryRoot;
            this.merkleProof = merkleProof;
            this.generatedAt = Instant.now();
        }

        @Override
        public String toString() {
            return String.format("RegistryProof{token=%s, depth=%d}", tokenId, merkleProof.getProofLength());
        }
    }

    /**
     * Registry statistics
     */
    public static class RegistryStats {
        public final int totalTokens;
        public final int createdTokens;
        public final int verifiedTokens;
        public final int transferredTokens;
        public final int retiredTokens;
        public final int uniqueOwners;
        public final int assetClassCount;

        public RegistryStats(int totalTokens, int createdTokens, int verifiedTokens,
                           int transferredTokens, int retiredTokens, int uniqueOwners, int assetClassCount) {
            this.totalTokens = totalTokens;
            this.createdTokens = createdTokens;
            this.verifiedTokens = verifiedTokens;
            this.transferredTokens = transferredTokens;
            this.retiredTokens = retiredTokens;
            this.uniqueOwners = uniqueOwners;
            this.assetClassCount = assetClassCount;
        }

        @Override
        public String toString() {
            return String.format("RegistryStats{total=%d, verified=%d, transferred=%d, retired=%d}",
                    totalTokens, verifiedTokens, transferredTokens, retiredTokens);
        }
    }

    /**
     * Registry performance metrics
     */
    public static class RegistryMetrics {
        public final long registrationCount;
        public final long lookupCount;
        public final long avgLookupTimeUs;
        public final int registrySize;
        public final String merkleRoot;
        public final Instant lastUpdate;

        public RegistryMetrics(long registrationCount, long lookupCount, long avgLookupTimeUs,
                             int registrySize, String merkleRoot, Instant lastUpdate) {
            this.registrationCount = registrationCount;
            this.lookupCount = lookupCount;
            this.avgLookupTimeUs = avgLookupTimeUs;
            this.registrySize = registrySize;
            this.merkleRoot = merkleRoot;
            this.lastUpdate = lastUpdate;
        }

        @Override
        public String toString() {
            return String.format("RegistryMetrics{size=%d, regs=%d, lookups=%d (%dµs avg)}",
                    registrySize, registrationCount, lookupCount, avgLookupTimeUs);
        }
    }

    /**
     * Registry consistency report
     */
    public static class ConsistencyReport {
        public final int totalTokens;
        public final int consistentTokens;
        public final int inconsistentTokens;
        public final String registryRoot;
        public final List<String> issues;
        public final Instant generatedAt;
        public final long durationMs;

        public ConsistencyReport(int totalTokens, int consistentTokens, int inconsistentTokens,
                               String registryRoot, List<String> issues, Instant generatedAt, long durationMs) {
            this.totalTokens = totalTokens;
            this.consistentTokens = consistentTokens;
            this.inconsistentTokens = inconsistentTokens;
            this.registryRoot = registryRoot;
            this.issues = new ArrayList<>(issues);
            this.generatedAt = generatedAt;
            this.durationMs = durationMs;
        }

        @Override
        public String toString() {
            return String.format("ConsistencyReport{total=%d, consistent=%d, issues=%d}",
                    totalTokens, consistentTokens, issues.size());
        }
    }
}
