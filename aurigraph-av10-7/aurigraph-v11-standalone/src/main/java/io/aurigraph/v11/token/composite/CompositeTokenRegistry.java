package io.aurigraph.v11.token.composite;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.aurigraph.v11.token.secondary.SecondaryToken;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Composite Token Registry - Sprint 3-4 Implementation
 *
 * Provides a centralized registry for composite tokens with:
 * - Merkle tree verification for integrity
 * - Compliance-aware lookups and filtering
 * - Caching for high-performance queries
 * - Audit trail and consistency reporting
 *
 * Registry Features:
 * - Register and track all composite tokens
 * - Merkle root validation on every operation
 * - Compliance status filtering (KYC, AML, jurisdiction)
 * - Contract binding tracking
 * - Historical state queries
 *
 * Performance Requirements:
 * - Lookup by ID: < 5ms
 * - Compliance check: < 20ms
 * - Registry consistency report: < 500ms
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 * @since Sprint 3 (Week 8)
 */
@ApplicationScoped
public class CompositeTokenRegistry {

    private static final Logger LOG = Logger.getLogger(CompositeTokenRegistry.class);

    @Inject
    CompositeMerkleService merkleService;

    @Inject
    VVBConsensusService vvbService;

    // In-memory index for fast lookups
    private final ConcurrentHashMap<String, RegistryEntry> registryIndex = new ConcurrentHashMap<>();

    // Index by owner for efficient owner queries
    private final ConcurrentHashMap<String, Set<String>> ownerIndex = new ConcurrentHashMap<>();

    // Index by contract for contract-bound lookups
    private final ConcurrentHashMap<String, String> contractIndex = new ConcurrentHashMap<>();

    // Compliance cache
    private final ConcurrentHashMap<String, ComplianceStatus> complianceCache = new ConcurrentHashMap<>();

    // Registry Merkle tree for global consistency
    private CompositeMerkleService.MerkleTree registryTree;
    private String registryMerkleRoot;
    private Instant lastTreeUpdate;

    // Performance metrics
    private long lookupCount = 0;
    private long totalLookupTime = 0;
    private long registrationCount = 0;
    private long complianceCheckCount = 0;
    private long consistencyCheckCount = 0;

    /**
     * Register a new composite token in the registry
     *
     * @param compositeToken The composite token to register
     * @return Uni containing the registry entry
     */
    @Transactional
    public Uni<RegistryEntry> register(CompositeToken compositeToken) {
        return Uni.createFrom().item(() -> {
            if (compositeToken == null) {
                throw new IllegalArgumentException("Composite token cannot be null");
            }

            if (registryIndex.containsKey(compositeToken.compositeTokenId)) {
                throw new IllegalStateException("Token already registered: " + compositeToken.compositeTokenId);
            }

            // Verify Merkle root integrity
            if (!verifyMerkleIntegrity(compositeToken)) {
                throw new IllegalStateException("Merkle root integrity check failed");
            }

            // Create registry entry
            RegistryEntry entry = new RegistryEntry(
                    compositeToken.compositeTokenId,
                    compositeToken.primaryTokenId,
                    compositeToken.getSecondaryTokenIdList(),
                    compositeToken.owner,
                    compositeToken.merkleRoot,
                    compositeToken.status,
                    compositeToken.totalValue,
                    Instant.now()
            );

            // Update indexes
            registryIndex.put(compositeToken.compositeTokenId, entry);
            ownerIndex.computeIfAbsent(compositeToken.owner, k -> ConcurrentHashMap.newKeySet())
                     .add(compositeToken.compositeTokenId);

            if (compositeToken.boundContractId != null) {
                contractIndex.put(compositeToken.boundContractId, compositeToken.compositeTokenId);
                entry.boundContractId = compositeToken.boundContractId;
            }

            // Rebuild registry Merkle tree
            rebuildRegistryTree();

            synchronized (this) {
                registrationCount++;
            }

            LOG.infof("Registered composite token: %s (owner: %s, value: %s)",
                    compositeToken.compositeTokenId, compositeToken.owner, compositeToken.totalValue);

            return entry;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Lookup a composite token by ID
     *
     * @param compositeTokenId The token ID to lookup
     * @return Uni containing the registry entry, or null if not found
     */
    public Uni<RegistryEntry> lookup(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            RegistryEntry entry = registryIndex.get(compositeTokenId);

            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                lookupCount++;
                totalLookupTime += duration;
            }

            return entry;
        });
    }

    /**
     * Lookup composite tokens by owner with compliance filtering
     *
     * @param owner The owner address
     * @param complianceFilter Optional compliance filter
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> lookupByOwner(String owner, ComplianceFilter complianceFilter) {
        return Uni.createFrom().item(() -> {
            Set<String> tokenIds = ownerIndex.get(owner);
            if (tokenIds == null || tokenIds.isEmpty()) {
                return Collections.emptyList();
            }

            List<RegistryEntry> entries = new ArrayList<>();
            for (String tokenId : tokenIds) {
                RegistryEntry entry = registryIndex.get(tokenId);
                if (entry != null) {
                    // Apply compliance filter if provided
                    if (complianceFilter == null || passesComplianceFilter(entry, complianceFilter)) {
                        entries.add(entry);
                    }
                }
            }

            return entries;
        });
    }

    /**
     * Lookup composite token by bound contract ID
     *
     * @param contractId The contract ID
     * @return Uni containing the registry entry, or null if not found
     */
    public Uni<RegistryEntry> lookupByContract(String contractId) {
        return Uni.createFrom().item(() -> {
            String compositeTokenId = contractIndex.get(contractId);
            if (compositeTokenId == null) {
                return null;
            }
            return registryIndex.get(compositeTokenId);
        });
    }

    /**
     * Find all composite tokens by status
     *
     * @param status The status to filter by
     * @return Uni containing list of registry entries
     */
    public Uni<List<RegistryEntry>> findByStatus(CompositeToken.CompositeTokenStatus status) {
        return Uni.createFrom().item(() -> {
            return registryIndex.values().stream()
                    .filter(e -> e.status == status)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Find all verified tokens ready for binding
     *
     * @return Uni containing list of verified tokens
     */
    public Uni<List<RegistryEntry>> findVerifiedAndUnbound() {
        return Uni.createFrom().item(() -> {
            return registryIndex.values().stream()
                    .filter(e -> e.status == CompositeToken.CompositeTokenStatus.VERIFIED)
                    .filter(e -> e.boundContractId == null)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Check compliance status for a composite token
     *
     * @param compositeTokenId The token ID to check
     * @return Uni containing the compliance status
     */
    public Uni<ComplianceStatus> checkCompliance(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            synchronized (this) {
                complianceCheckCount++;
            }

            // Check cache first
            ComplianceStatus cached = complianceCache.get(compositeTokenId);
            if (cached != null && !cached.isExpired()) {
                return cached;
            }

            RegistryEntry entry = registryIndex.get(compositeTokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + compositeTokenId);
            }

            // Load primary token for KYC/AML checks
            PrimaryToken primary = PrimaryToken.findByTokenId(entry.primaryTokenId);
            if (primary == null) {
                return new ComplianceStatus(compositeTokenId, false, "Primary token not found", null);
            }

            // Perform compliance checks
            ComplianceResult result = performComplianceChecks(entry, primary);

            ComplianceStatus status = new ComplianceStatus(
                    compositeTokenId,
                    result.passed,
                    result.message,
                    result.details
            );

            // Cache the result
            complianceCache.put(compositeTokenId, status);

            LOG.debugf("Compliance check for %s: %s", compositeTokenId, result.passed ? "PASSED" : "FAILED");

            return status;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update registry entry when token status changes
     *
     * @param compositeTokenId The token ID
     * @param newStatus The new status
     * @return Uni containing the updated entry
     */
    @Transactional
    public Uni<RegistryEntry> updateStatus(
            String compositeTokenId,
            CompositeToken.CompositeTokenStatus newStatus) {

        return Uni.createFrom().item(() -> {
            RegistryEntry entry = registryIndex.get(compositeTokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + compositeTokenId);
            }

            entry.status = newStatus;
            entry.lastUpdated = Instant.now();

            // Invalidate compliance cache
            complianceCache.remove(compositeTokenId);

            // Rebuild registry tree
            rebuildRegistryTree();

            LOG.infof("Updated composite token %s status to %s", compositeTokenId, newStatus);

            return entry;
        });
    }

    /**
     * Record contract binding
     *
     * @param compositeTokenId The composite token ID
     * @param contractId The contract ID to bind
     * @return Uni containing the updated entry
     */
    @Transactional
    public Uni<RegistryEntry> recordBinding(String compositeTokenId, String contractId) {
        return Uni.createFrom().item(() -> {
            RegistryEntry entry = registryIndex.get(compositeTokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + compositeTokenId);
            }

            if (entry.boundContractId != null) {
                throw new IllegalStateException("Token already bound to contract: " + entry.boundContractId);
            }

            entry.boundContractId = contractId;
            entry.status = CompositeToken.CompositeTokenStatus.BOUND;
            entry.lastUpdated = Instant.now();

            contractIndex.put(contractId, compositeTokenId);

            // Invalidate compliance cache
            complianceCache.remove(compositeTokenId);

            LOG.infof("Bound composite token %s to contract %s", compositeTokenId, contractId);

            return entry;
        });
    }

    /**
     * Generate a Merkle proof for a registered token
     *
     * @param compositeTokenId The token ID
     * @return Uni containing the Merkle proof
     */
    public Uni<RegistryProof> generateProof(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            RegistryEntry entry = registryIndex.get(compositeTokenId);
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + compositeTokenId);
            }

            if (registryTree == null) {
                rebuildRegistryTree();
            }

            // Find leaf index
            List<String> sortedIds = new ArrayList<>(registryIndex.keySet());
            Collections.sort(sortedIds);
            int leafIndex = sortedIds.indexOf(compositeTokenId);

            // Generate proof
            CompositeMerkleService.MerkleProof merkleProof = merkleService.generateProof(registryTree, leafIndex);

            return new RegistryProof(
                    compositeTokenId,
                    entry.tokenMerkleRoot,
                    registryMerkleRoot,
                    merkleProof,
                    Instant.now()
            );
        });
    }

    /**
     * Verify a registry proof
     *
     * @param proof The proof to verify
     * @return true if the proof is valid
     */
    public boolean verifyProof(RegistryProof proof) {
        if (proof == null || proof.merkleProof == null) {
            return false;
        }
        return merkleService.verifyProof(proof.merkleProof);
    }

    /**
     * Generate a consistency report for the registry
     *
     * @return Uni containing the consistency report
     */
    public Uni<ConsistencyReport> generateConsistencyReport() {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            synchronized (this) {
                consistencyCheckCount++;
            }

            int totalTokens = registryIndex.size();
            int verifiedTokens = 0;
            int boundTokens = 0;
            int inconsistentTokens = 0;
            List<String> issues = new ArrayList<>();
            BigDecimal totalValue = BigDecimal.ZERO;

            for (RegistryEntry entry : registryIndex.values()) {
                // Verify Merkle root
                CompositeToken token = CompositeToken.findByCompositeTokenId(entry.compositeTokenId);
                if (token != null) {
                    if (!entry.tokenMerkleRoot.equals(token.merkleRoot)) {
                        inconsistentTokens++;
                        issues.add("Merkle root mismatch: " + entry.compositeTokenId);
                    }

                    if (token.status == CompositeToken.CompositeTokenStatus.VERIFIED) {
                        verifiedTokens++;
                    }
                    if (token.status == CompositeToken.CompositeTokenStatus.BOUND) {
                        boundTokens++;
                    }

                    totalValue = totalValue.add(token.totalValue != null ? token.totalValue : BigDecimal.ZERO);
                } else {
                    inconsistentTokens++;
                    issues.add("Token not found in database: " + entry.compositeTokenId);
                }
            }

            // Verify registry tree
            if (registryTree != null) {
                String computedRoot = registryTree.root;
                if (!computedRoot.equals(registryMerkleRoot)) {
                    issues.add("Registry Merkle root inconsistency");
                }
            }

            long duration = (System.nanoTime() - startTime) / 1_000_000;

            ConsistencyReport report = new ConsistencyReport(
                    totalTokens,
                    verifiedTokens,
                    boundTokens,
                    inconsistentTokens,
                    totalValue,
                    registryMerkleRoot,
                    issues,
                    Instant.now(),
                    duration
            );

            LOG.infof("Generated consistency report: %d tokens, %d issues in %dms",
                    totalTokens, issues.size(), duration);

            return report;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get registry statistics
     */
    public RegistryStats getStats() {
        int total = registryIndex.size();
        int verified = 0;
        int bound = 0;
        int pending = 0;

        for (RegistryEntry entry : registryIndex.values()) {
            switch (entry.status) {
                case VERIFIED -> verified++;
                case BOUND -> bound++;
                case PENDING_VERIFICATION -> pending++;
            }
        }

        return new RegistryStats(total, verified, bound, pending, ownerIndex.size());
    }

    /**
     * Get performance metrics
     */
    public RegistryMetrics getMetrics() {
        synchronized (this) {
            return new RegistryMetrics(
                    lookupCount,
                    lookupCount > 0 ? totalLookupTime / lookupCount : 0,
                    registrationCount,
                    complianceCheckCount,
                    consistencyCheckCount,
                    registryIndex.size(),
                    complianceCache.size()
            );
        }
    }

    /**
     * Clear all caches
     */
    public void clearCaches() {
        complianceCache.clear();
        LOG.info("Registry caches cleared");
    }

    // =============== PRIVATE HELPER METHODS ===============

    private boolean verifyMerkleIntegrity(CompositeToken token) {
        if (token.merkleRoot == null || token.merkleRoot.isEmpty()) {
            return false;
        }

        // Load tokens and recompute
        PrimaryToken primary = PrimaryToken.findByTokenId(token.primaryTokenId);
        if (primary == null) {
            return false;
        }

        List<String> secondaryHashes = new ArrayList<>();
        for (String secondaryId : token.getSecondaryTokenIdList()) {
            SecondaryToken secondary = SecondaryToken.findByTokenId(secondaryId);
            if (secondary != null) {
                secondaryHashes.add(merkleService.sha256Hash(secondary.tokenId + secondary.faceValue));
            }
        }

        String primaryHash = merkleService.sha256Hash(primary.tokenId + primary.faceValue);
        CompositeMerkleService.MerkleTree tree = merkleService.buildCompositeTree(
                primaryHash, secondaryHashes, token.bindingProofHash);

        return tree.root.equals(token.merkleRoot);
    }

    private void rebuildRegistryTree() {
        List<String> sortedIds = new ArrayList<>(registryIndex.keySet());
        Collections.sort(sortedIds);

        List<String> leaves = new ArrayList<>();
        for (String id : sortedIds) {
            RegistryEntry entry = registryIndex.get(id);
            leaves.add(entry.tokenMerkleRoot);
        }

        if (!leaves.isEmpty()) {
            registryTree = merkleService.buildMerkleTree(leaves);
            registryMerkleRoot = registryTree.root;
            lastTreeUpdate = Instant.now();
        }
    }

    private boolean passesComplianceFilter(RegistryEntry entry, ComplianceFilter filter) {
        if (filter.requiredStatus != null && entry.status != filter.requiredStatus) {
            return false;
        }
        if (filter.mustBeBound && entry.boundContractId == null) {
            return false;
        }
        if (filter.minValue != null && entry.totalValue.compareTo(filter.minValue) < 0) {
            return false;
        }
        if (filter.maxValue != null && entry.totalValue.compareTo(filter.maxValue) > 0) {
            return false;
        }
        return true;
    }

    private ComplianceResult performComplianceChecks(RegistryEntry entry, PrimaryToken primary) {
        List<String> issues = new ArrayList<>();

        // Check primary token status
        if (primary.status == PrimaryToken.PrimaryTokenStatus.RETIRED) {
            issues.add("Primary token is retired");
        }

        // Check owner verification (simplified - would integrate with KYC service)
        if (primary.owner == null || primary.owner.trim().isEmpty()) {
            issues.add("Owner not verified");
        }

        // Check compliance metadata
        if (primary.complianceMetadata == null) {
            issues.add("Missing compliance metadata");
        }

        // Check VVB verification status
        if (entry.status == CompositeToken.CompositeTokenStatus.CREATED ||
            entry.status == CompositeToken.CompositeTokenStatus.PENDING_VERIFICATION) {
            issues.add("Token not yet verified by VVB");
        }

        boolean passed = issues.isEmpty();
        String message = passed ? "All compliance checks passed" : "Compliance issues found: " + issues.size();

        return new ComplianceResult(passed, message, issues);
    }

    // =============== INNER CLASSES ===============

    /**
     * Registry entry for indexed storage
     */
    public static class RegistryEntry {
        public final String compositeTokenId;
        public final String primaryTokenId;
        public final List<String> secondaryTokenIds;
        public String owner;
        public String tokenMerkleRoot;
        public CompositeToken.CompositeTokenStatus status;
        public BigDecimal totalValue;
        public String boundContractId;
        public final Instant registeredAt;
        public Instant lastUpdated;

        public RegistryEntry(String compositeTokenId, String primaryTokenId,
                            List<String> secondaryTokenIds, String owner,
                            String tokenMerkleRoot, CompositeToken.CompositeTokenStatus status,
                            BigDecimal totalValue, Instant registeredAt) {
            this.compositeTokenId = compositeTokenId;
            this.primaryTokenId = primaryTokenId;
            this.secondaryTokenIds = new ArrayList<>(secondaryTokenIds);
            this.owner = owner;
            this.tokenMerkleRoot = tokenMerkleRoot;
            this.status = status;
            this.totalValue = totalValue;
            this.registeredAt = registeredAt;
            this.lastUpdated = registeredAt;
        }
    }

    /**
     * Compliance filter for queries
     */
    public static class ComplianceFilter {
        public CompositeToken.CompositeTokenStatus requiredStatus;
        public boolean mustBeBound;
        public BigDecimal minValue;
        public BigDecimal maxValue;
        public List<String> allowedJurisdictions;

        public ComplianceFilter() {}

        public static ComplianceFilter verifiedOnly() {
            ComplianceFilter filter = new ComplianceFilter();
            filter.requiredStatus = CompositeToken.CompositeTokenStatus.VERIFIED;
            return filter;
        }

        public static ComplianceFilter boundOnly() {
            ComplianceFilter filter = new ComplianceFilter();
            filter.mustBeBound = true;
            return filter;
        }
    }

    /**
     * Compliance status
     */
    public static class ComplianceStatus {
        public final String compositeTokenId;
        public final boolean compliant;
        public final String message;
        public final List<String> issues;
        public final Instant checkedAt;

        public ComplianceStatus(String compositeTokenId, boolean compliant,
                               String message, List<String> issues) {
            this.compositeTokenId = compositeTokenId;
            this.compliant = compliant;
            this.message = message;
            this.issues = issues != null ? new ArrayList<>(issues) : new ArrayList<>();
            this.checkedAt = Instant.now();
        }

        public boolean isExpired() {
            return ChronoUnit.MINUTES.between(checkedAt, Instant.now()) > 15;
        }
    }

    /**
     * Internal compliance result
     */
    private static class ComplianceResult {
        final boolean passed;
        final String message;
        final List<String> details;

        ComplianceResult(boolean passed, String message, List<String> details) {
            this.passed = passed;
            this.message = message;
            this.details = details;
        }
    }

    /**
     * Registry proof containing Merkle verification data
     */
    public static class RegistryProof {
        public final String compositeTokenId;
        public final String tokenMerkleRoot;
        public final String registryMerkleRoot;
        public final CompositeMerkleService.MerkleProof merkleProof;
        public final Instant generatedAt;

        public RegistryProof(String compositeTokenId, String tokenMerkleRoot,
                            String registryMerkleRoot,
                            CompositeMerkleService.MerkleProof merkleProof,
                            Instant generatedAt) {
            this.compositeTokenId = compositeTokenId;
            this.tokenMerkleRoot = tokenMerkleRoot;
            this.registryMerkleRoot = registryMerkleRoot;
            this.merkleProof = merkleProof;
            this.generatedAt = generatedAt;
        }
    }

    /**
     * Consistency report for registry health
     */
    public static class ConsistencyReport {
        public final int totalTokens;
        public final int verifiedTokens;
        public final int boundTokens;
        public final int inconsistentTokens;
        public final BigDecimal totalValue;
        public final String registryMerkleRoot;
        public final List<String> issues;
        public final Instant generatedAt;
        public final long generationTimeMs;

        public ConsistencyReport(int totalTokens, int verifiedTokens, int boundTokens,
                                int inconsistentTokens, BigDecimal totalValue,
                                String registryMerkleRoot, List<String> issues,
                                Instant generatedAt, long generationTimeMs) {
            this.totalTokens = totalTokens;
            this.verifiedTokens = verifiedTokens;
            this.boundTokens = boundTokens;
            this.inconsistentTokens = inconsistentTokens;
            this.totalValue = totalValue;
            this.registryMerkleRoot = registryMerkleRoot;
            this.issues = new ArrayList<>(issues);
            this.generatedAt = generatedAt;
            this.generationTimeMs = generationTimeMs;
        }

        public boolean isHealthy() {
            return inconsistentTokens == 0 && issues.isEmpty();
        }
    }

    /**
     * Registry statistics
     */
    public static class RegistryStats {
        public final int totalTokens;
        public final int verifiedTokens;
        public final int boundTokens;
        public final int pendingTokens;
        public final int uniqueOwners;

        public RegistryStats(int totalTokens, int verifiedTokens, int boundTokens,
                            int pendingTokens, int uniqueOwners) {
            this.totalTokens = totalTokens;
            this.verifiedTokens = verifiedTokens;
            this.boundTokens = boundTokens;
            this.pendingTokens = pendingTokens;
            this.uniqueOwners = uniqueOwners;
        }
    }

    /**
     * Performance metrics
     */
    public static class RegistryMetrics {
        public final long lookupCount;
        public final long avgLookupTimeMs;
        public final long registrationCount;
        public final long complianceCheckCount;
        public final long consistencyCheckCount;
        public final int registrySize;
        public final int cacheSize;

        public RegistryMetrics(long lookupCount, long avgLookupTimeMs, long registrationCount,
                              long complianceCheckCount, long consistencyCheckCount,
                              int registrySize, int cacheSize) {
            this.lookupCount = lookupCount;
            this.avgLookupTimeMs = avgLookupTimeMs;
            this.registrationCount = registrationCount;
            this.complianceCheckCount = complianceCheckCount;
            this.consistencyCheckCount = consistencyCheckCount;
            this.registrySize = registrySize;
            this.cacheSize = cacheSize;
        }

        @Override
        public String toString() {
            return String.format("RegistryMetrics{lookups=%d (%dms avg), registrations=%d, size=%d}",
                    lookupCount, avgLookupTimeMs, registrationCount, registrySize);
        }
    }
}
