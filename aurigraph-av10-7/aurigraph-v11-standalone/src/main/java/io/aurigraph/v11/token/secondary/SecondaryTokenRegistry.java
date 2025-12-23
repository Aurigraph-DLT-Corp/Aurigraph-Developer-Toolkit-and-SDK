package io.aurigraph.v11.token.secondary;

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
 * Secondary Token Registry - Sprint 1 Story 3 Implementation
 *
 * Provides a centralized, high-performance registry for secondary tokens with:
 * - 5-index support (tokenId, parentTokenId, owner, tokenType, status)
 * - Parent-child relationship queries
 * - Merkle tree verification for integrity
 * - In-memory caching for sub-5ms lookups
 * - Performance metrics and consistency reporting
 *
 * Key Difference from Primary Registry:
 * - Adds parentTokenId index to track parent-child relationships
 * - Includes tokenType instead of assetClass
 * - Supports parent validation for cascade operations
 *
 * Performance Requirements:
 * - Registration (1,000 tokens): < 100ms
 * - Lookup by ID: < 5ms (all 5 indexes)
 * - Consistency check: < 500ms
 *
 * @author Composite Token System - Sprint 1 Story 3
 * @version 1.0
 * @since Sprint 1 Story 3 (Week 2)
 */
@ApplicationScoped
public class SecondaryTokenRegistry {

    private static final Logger LOG = Logger.getLogger(SecondaryTokenRegistry.class);

    @Inject
    SecondaryTokenMerkleService merkleService;

    @Inject
    SecondaryTokenFactory.SecondaryTokenRepository repository;

    @Inject
    SecondaryTokenVersioningService versioningService;

    // =============== INDEXES (5 TOTAL) ===============

    // Primary index: tokenId → RegistryEntry
    private final ConcurrentHashMap<String, RegistryEntry> tokenIndex = new ConcurrentHashMap<>();

    // Parent index: parentTokenId → Set<tokenId> (NEW - tracks parent-child relationships)
    private final ConcurrentHashMap<String, Set<String>> parentIndex = new ConcurrentHashMap<>();

    // Owner index: owner → Set<tokenId>
    private final ConcurrentHashMap<String, Set<String>> ownerIndex = new ConcurrentHashMap<>();

    // Type index: tokenType → Set<tokenId>
    private final ConcurrentHashMap<SecondaryToken.SecondaryTokenType, Set<String>> typeIndex = new ConcurrentHashMap<>();

    // Status index: status → Set<tokenId>
    private final ConcurrentHashMap<SecondaryToken.SecondaryTokenStatus, Set<String>> statusIndex = new ConcurrentHashMap<>();

    // =============== MERKLE TRACKING ===============

    private SecondaryTokenMerkleService.MerkleTree registryTree;
    private String registryMerkleRoot = "";
    private Instant lastTreeUpdate;

    // =============== PERFORMANCE METRICS ===============

    private long registrationCount = 0;
    private long lookupCount = 0;
    private long totalLookupTimeNs = 0;
    private long statusUpdateCount = 0;
    private long consistencyCheckCount = 0;

    /**
     * Register a new secondary token in the registry
     *
     * @param token The secondary token to register
     * @return Uni containing the registry entry
     */
    @Transactional
    public Uni<RegistryEntry> register(SecondaryToken token) {
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
                    token.parentTokenId,
                    token.owner,
                    token.tokenType,
                    token.status,
                    token.faceValue,
                    merkleService.hashSecondaryToken(token),
                    Instant.now()
            );

            // Add to primary index
            tokenIndex.put(token.tokenId, entry);

            // Add to parent index (NEW)
            parentIndex.computeIfAbsent(token.parentTokenId, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            // Add to owner index
            ownerIndex.computeIfAbsent(token.owner, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            // Add to type index
            typeIndex.computeIfAbsent(token.tokenType, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            // Add to status index
            statusIndex.computeIfAbsent(token.status, k -> ConcurrentHashMap.newKeySet())
                    .add(token.tokenId);

            registrationCount++;

            LOG.debugf("Registered secondary token: %s (parent: %s, owner: %s, type: %s)",
                    token.tokenId, token.parentTokenId, token.owner, token.tokenType);

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
     * Lookup all tokens by parent (NEW - enables parent-child queries)
     *
     * @param parentTokenId The parent token ID
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> lookupByParent(String parentTokenId) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = parentIndex.get(parentTokenId);
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
     * Lookup all tokens by type
     *
     * @param tokenType The token type
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> lookupByType(SecondaryToken.SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = typeIndex.get(tokenType);
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
    public Uni<List<RegistryEntry>> lookupByStatus(SecondaryToken.SecondaryTokenStatus status) {
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
     * Count tokens by parent (for cascade validation)
     *
     * @param parentTokenId The parent token ID
     * @return Uni containing the count
     */
    public Uni<Long> countByParent(String parentTokenId) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = parentIndex.get(parentTokenId);
            return tokenIds == null ? 0L : (long) tokenIds.size();
        });
    }

    /**
     * Count active tokens by parent (for cascade validation on retirement)
     *
     * @param parentTokenId The parent token ID
     * @return Uni containing the count of active tokens
     */
    public Uni<Long> countActiveByParent(String parentTokenId) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = parentIndex.get(parentTokenId);
            if (tokenIds == null || tokenIds.isEmpty()) {
                return 0L;
            }

            return tokenIds.stream()
                    .map(tokenIndex::get)
                    .filter(Objects::nonNull)
                    .filter(entry -> entry.status == SecondaryToken.SecondaryTokenStatus.ACTIVE)
                    .count();
        });
    }

    /**
     * Get children of a parent by type (filter query)
     *
     * @param parentTokenId The parent token ID
     * @param tokenType The token type to filter
     * @return Uni containing list of children of given type
     */
    public Uni<List<RegistryEntry>> getChildrenByType(String parentTokenId, SecondaryToken.SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() -> {
            Set<String> parentChildren = parentIndex.get(parentTokenId);
            if (parentChildren == null || parentChildren.isEmpty()) {
                return new ArrayList<>();
            }

            return parentChildren.stream()
                    .map(tokenIndex::get)
                    .filter(Objects::nonNull)
                    .filter(entry -> entry.tokenType == tokenType)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Validate parent token exists (before creating secondary)
     *
     * @param parentTokenId The parent token ID to validate
     * @return Uni<Boolean> true if parent exists
     */
    public Uni<Boolean> validateParentExists(String parentTokenId) {
        return Uni.createFrom().item(() -> {
            // In a real implementation, would check PrimaryTokenRegistry
            // For now, return true if we have children registered
            Set<String> children = parentIndex.get(parentTokenId);
            return children != null && !children.isEmpty();
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
    public Uni<RegistryEntry> updateStatus(String tokenId, SecondaryToken.SecondaryTokenStatus newStatus) {
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

            LOG.debugf("Updated secondary token %s status to %s", tokenId, newStatus);

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

            LOG.debugf("Updated secondary token %s owner to %s", tokenId, newOwner);

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

            SecondaryTokenMerkleService.MerkleProof proof =
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
                (int) statusIndex.getOrDefault(SecondaryToken.SecondaryTokenStatus.CREATED, Collections.emptySet()).size(),
                (int) statusIndex.getOrDefault(SecondaryToken.SecondaryTokenStatus.ACTIVE, Collections.emptySet()).size(),
                (int) statusIndex.getOrDefault(SecondaryToken.SecondaryTokenStatus.REDEEMED, Collections.emptySet()).size(),
                (int) statusIndex.getOrDefault(SecondaryToken.SecondaryTokenStatus.EXPIRED, Collections.emptySet()).size(),
                ownerIndex.size(),
                typeIndex.size(),
                parentIndex.size()
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

            List<SecondaryToken> allTokens = tokenIndex.values().stream()
                    .map(entry -> {
                        SecondaryToken token = new SecondaryToken();
                        token.tokenId = entry.tokenId;
                        token.parentTokenId = entry.parentTokenId;
                        token.owner = entry.owner;
                        token.tokenType = entry.tokenType;
                        token.status = entry.status;
                        token.faceValue = entry.faceValue;
                        return token;
                    })
                    .collect(Collectors.toList());

            SecondaryTokenMerkleService.MerkleTree computedTree = merkleService.buildSecondaryTokenTree(allTokens);

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
            LOG.infof("Secondary token registry consistency check: %s in %dms",
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
    public Uni<List<RegistryEntry>> bulkRegister(List<SecondaryToken> tokens) {
        return Uni.createFrom().item(() -> {
            List<RegistryEntry> entries = new ArrayList<>();

            for (SecondaryToken token : tokens) {
                if (!tokenIndex.containsKey(token.tokenId)) {
                    RegistryEntry entry = new RegistryEntry(
                            token.tokenId,
                            token.parentTokenId,
                            token.owner,
                            token.tokenType,
                            token.status,
                            token.faceValue,
                            merkleService.hashSecondaryToken(token),
                            Instant.now()
                    );

                    tokenIndex.put(token.tokenId, entry);
                    parentIndex.computeIfAbsent(token.parentTokenId, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);
                    ownerIndex.computeIfAbsent(token.owner, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);
                    typeIndex.computeIfAbsent(token.tokenType, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);
                    statusIndex.computeIfAbsent(token.status, k -> ConcurrentHashMap.newKeySet())
                            .add(token.tokenId);

                    entries.add(entry);
                    registrationCount++;
                }
            }

            // Rebuild registry tree after bulk operation
            rebuildRegistryTree(tokens);

            LOG.infof("Bulk registered %d secondary tokens", entries.size());

            return entries;
        });
    }

    /**
     * Rebuild the registry Merkle tree
     */
    private void rebuildRegistryTree(List<SecondaryToken> tokens) {
        if (tokens != null && !tokens.isEmpty()) {
            registryTree = merkleService.buildSecondaryTokenTree(tokens);
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
        parentIndex.clear();
        ownerIndex.clear();
        typeIndex.clear();
        statusIndex.clear();
        registryTree = null;
        registryMerkleRoot = "";
        merkleService.clearCache();
        LOG.info("Cleared secondary token registry");
    }

    // =============== VERSION-AWARE QUERY METHODS (SPRINT 1 ENHANCEMENT) ===============

    /**
     * Get all versions of a secondary token ordered by version number
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing list of all versions
     */
    public Uni<List<SecondaryTokenVersion>> getVersionChain(String secondaryTokenId) {
        return versioningService.getVersionChain(java.util.UUID.fromString(secondaryTokenId));
    }

    /**
     * Get the active (current) version of a secondary token
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing the active version
     */
    public Uni<SecondaryTokenVersion> getActiveVersion(String secondaryTokenId) {
        return versioningService.getActiveVersion(java.util.UUID.fromString(secondaryTokenId));
    }

    /**
     * Count total versions for a secondary token
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing the count
     */
    public Uni<Long> countVersionsByToken(String secondaryTokenId) {
        return versioningService.countVersionsByToken(java.util.UUID.fromString(secondaryTokenId));
    }

    /**
     * Get versions of a token by status
     *
     * @param secondaryTokenId The secondary token ID
     * @param status The version status filter
     * @return Uni containing list of versions with given status
     */
    public Uni<List<SecondaryTokenVersion>> getVersionsByStatus(String secondaryTokenId,
                                                                SecondaryTokenVersionStatus status) {
        return versioningService.getVersionsByStatus(java.util.UUID.fromString(secondaryTokenId), status);
    }

    /**
     * Get version history with audit trail for a token
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing list of versions in chronological order
     */
    public Uni<List<SecondaryTokenVersion>> getVersionHistory(String secondaryTokenId) {
        // Get all versions in chronological order (oldest to newest)
        return versioningService.getVersionChain(java.util.UUID.fromString(secondaryTokenId));
    }

    /**
     * Get all versions pending VVB approval
     *
     * @return Uni containing list of versions awaiting VVB approval
     */
    public Uni<List<SecondaryTokenVersion>> getVersionsNeedingVVB() {
        return versioningService.getVersionsNeedingVVB();
    }

    /**
     * Validate version integrity (merkle hash verification)
     *
     * @param versionId The version ID to validate
     * @return Uni<Boolean> true if version integrity is valid
     */
    public Uni<Boolean> validateVersionIntegrity(String versionId) {
        return versioningService.validateVersionIntegrity(java.util.UUID.fromString(versionId));
    }

    /**
     * Get registry version statistics (summary of versions across all tokens)
     *
     * @return VersionRegistryStats with version counts and metrics
     */
    public VersionRegistryStats getVersionStats() {
        long totalVersions = 0;
        long activeVersions = 0;
        long pendingVVBVersions = 0;
        long archivedVersions = 0;

        // Query version counts from database if available
        // For now, return structure with placeholder values
        return new VersionRegistryStats(totalVersions, activeVersions, pendingVVBVersions, archivedVersions);
    }

    // =============== INNER CLASSES ===============

    /**
     * Registry entry for a secondary token
     */
    public static class RegistryEntry {
        public String tokenId;
        public String parentTokenId;
        public String owner;
        public SecondaryToken.SecondaryTokenType tokenType;
        public SecondaryToken.SecondaryTokenStatus status;
        public java.math.BigDecimal faceValue;
        public String merkleHash;
        public Instant registeredAt;
        public Instant lastUpdated;

        public RegistryEntry(String tokenId, String parentTokenId, String owner,
                           SecondaryToken.SecondaryTokenType tokenType,
                           SecondaryToken.SecondaryTokenStatus status, java.math.BigDecimal faceValue,
                           String merkleHash, Instant registeredAt) {
            this.tokenId = tokenId;
            this.parentTokenId = parentTokenId;
            this.owner = owner;
            this.tokenType = tokenType;
            this.status = status;
            this.faceValue = faceValue;
            this.merkleHash = merkleHash;
            this.registeredAt = registeredAt;
            this.lastUpdated = registeredAt;
        }

        @Override
        public String toString() {
            return String.format("RegistryEntry{id=%s, parent=%s, owner=%s, type=%s, status=%s}",
                    tokenId, parentTokenId, owner, tokenType, status);
        }
    }

    /**
     * Merkle proof with registry context
     */
    public static class RegistryProof {
        public final String tokenId;
        public final String tokenHash;
        public final String registryRoot;
        public final SecondaryTokenMerkleService.MerkleProof merkleProof;
        public final Instant generatedAt;

        public RegistryProof(String tokenId, String tokenHash, String registryRoot,
                           SecondaryTokenMerkleService.MerkleProof merkleProof) {
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
        public final int activeTokens;
        public final int redeemedTokens;
        public final int expiredTokens;
        public final int uniqueOwners;
        public final int tokenTypeCount;
        public final int uniqueParents;

        public RegistryStats(int totalTokens, int createdTokens, int activeTokens,
                           int redeemedTokens, int expiredTokens, int uniqueOwners,
                           int tokenTypeCount, int uniqueParents) {
            this.totalTokens = totalTokens;
            this.createdTokens = createdTokens;
            this.activeTokens = activeTokens;
            this.redeemedTokens = redeemedTokens;
            this.expiredTokens = expiredTokens;
            this.uniqueOwners = uniqueOwners;
            this.tokenTypeCount = tokenTypeCount;
            this.uniqueParents = uniqueParents;
        }

        @Override
        public String toString() {
            return String.format("RegistryStats{total=%d, active=%d, redeemed=%d, expired=%d, parents=%d}",
                    totalTokens, activeTokens, redeemedTokens, expiredTokens, uniqueParents);
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

    /**
     * Version registry statistics (Sprint 1 Enhancement)
     * Tracks version counts across all secondary tokens
     */
    public static class VersionRegistryStats {
        public final long totalVersions;
        public final long activeVersions;
        public final long pendingVVBVersions;
        public final long archivedVersions;
        public final Instant generatedAt;

        public VersionRegistryStats(long totalVersions, long activeVersions, long pendingVVBVersions, long archivedVersions) {
            this.totalVersions = totalVersions;
            this.activeVersions = activeVersions;
            this.pendingVVBVersions = pendingVVBVersions;
            this.archivedVersions = archivedVersions;
            this.generatedAt = Instant.now();
        }

        @Override
        public String toString() {
            return String.format("VersionRegistryStats{total=%d, active=%d, pendingVVB=%d, archived=%d}",
                    totalVersions, activeVersions, pendingVVBVersions, archivedVersions);
        }
    }
}
