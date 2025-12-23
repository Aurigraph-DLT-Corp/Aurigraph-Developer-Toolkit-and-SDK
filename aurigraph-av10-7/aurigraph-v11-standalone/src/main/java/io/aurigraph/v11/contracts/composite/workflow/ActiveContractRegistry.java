package io.aurigraph.v11.contracts.composite.workflow;

import io.aurigraph.v11.merkle.MerkleTreeRegistry;
import io.aurigraph.v11.merkle.MerkleProof;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Active Contract Registry with Merkle Tree Support
 *
 * High-performance registry for managing 1M+ active contracts with:
 * - Merkle tree-based cryptographic verification
 * - Multi-dimensional indexing (by owner, type, status, date)
 * - Proof generation for contract existence and state
 * - Analytics and aggregation queries
 * - Batch operations support
 *
 * Performance Targets:
 * - Contract lookup: <10ms
 * - Proof generation: <50ms
 * - Batch operations: 10,000+ contracts/second
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-04: Contract Registry (Sprint 5-7)
 */
@ApplicationScoped
public class ActiveContractRegistry extends MerkleTreeRegistry<ActiveContractRegistry.ContractEntry> {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActiveContractRegistry.class);

    // Secondary indexes
    private final Map<String, Set<String>> ownerIndex = new ConcurrentHashMap<>();
    private final Map<ContractType, Set<String>> typeIndex = new ConcurrentHashMap<>();
    private final Map<ContractStatus, Set<String>> statusIndex = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> assetTypeIndex = new ConcurrentHashMap<>();
    private final Map<String, String> compositeTokenIndex = new ConcurrentHashMap<>(); // compositeId -> contractId

    // Analytics cache
    private volatile RegistryAnalytics cachedAnalytics;
    private volatile Instant analyticsLastUpdated;
    private static final Duration ANALYTICS_CACHE_TTL = Duration.ofMinutes(1);

    // Metrics
    private final AtomicLong registrations = new AtomicLong(0);
    private final AtomicLong updates = new AtomicLong(0);
    private final AtomicLong queries = new AtomicLong(0);
    private final AtomicLong proofGenerations = new AtomicLong(0);

    /**
     * Initialize Active Contract Registry
     */
    public ActiveContractRegistry() {
        super();
        LOGGER.info("ActiveContractRegistry initialized");
    }

    @Override
    protected String serializeValue(ContractEntry entry) {
        return String.format("%s|%s|%s|%s|%s|%s|%s|%s|%s|%s",
            entry.getContractId(),
            entry.getOwnerId(),
            entry.getContractType(),
            entry.getStatus(),
            entry.getCreatedAt(),
            entry.getUpdatedAt(),
            entry.getCompositeTokenId(),
            entry.getAssetType(),
            entry.getValuation(),
            entry.getContentHash()
        );
    }

    /**
     * Register a new contract
     *
     * @param entry Contract entry to register
     * @return Registered contract
     */
    public Uni<ContractEntry> registerContract(ContractEntry entry) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Registering contract: {} (owner: {})", entry.getContractId(), entry.getOwnerId());

            // Set timestamps
            if (entry.getCreatedAt() == null) {
                entry.setCreatedAt(Instant.now());
            }
            entry.setUpdatedAt(Instant.now());
            entry.setVersion(1L);

            // Calculate content hash
            entry.setContentHash(calculateContentHash(entry));

            return entry;
        }).flatMap(e -> add(e.getContractId(), e)
            .map(success -> {
                // Update indexes
                addToIndex(ownerIndex, e.getOwnerId(), e.getContractId());
                addToIndex(typeIndex, e.getContractType(), e.getContractId());
                addToIndex(statusIndex, e.getStatus(), e.getContractId());
                if (e.getAssetType() != null) {
                    addToIndex(assetTypeIndex, e.getAssetType(), e.getContractId());
                }
                if (e.getCompositeTokenId() != null) {
                    compositeTokenIndex.put(e.getCompositeTokenId(), e.getContractId());
                }

                registrations.incrementAndGet();
                invalidateAnalyticsCache();

                LOGGER.info("Contract registered: {} (root: {})",
                    e.getContractId(), currentRootHash != null ? currentRootHash.substring(0, 16) : "N/A");
                return e;
            }))
            .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update a contract entry
     *
     * @param contractId Contract identifier
     * @param updates    Updates to apply
     * @return Updated contract
     */
    public Uni<ContractEntry> updateContract(String contractId, Map<String, Object> updates) {
        return get(contractId)
            .onItem().ifNull().failWith(() -> new ContractNotFoundException("Contract not found: " + contractId))
            .map(entry -> {
                ContractStatus oldStatus = entry.getStatus();

                // Apply updates
                if (updates.containsKey("status")) {
                    entry.setStatus(ContractStatus.valueOf((String) updates.get("status")));
                }
                if (updates.containsKey("valuation")) {
                    entry.setValuation((BigDecimal) updates.get("valuation"));
                }
                if (updates.containsKey("metadata")) {
                    entry.getMetadata().putAll((Map<String, Object>) updates.get("metadata"));
                }

                entry.setUpdatedAt(Instant.now());
                entry.setVersion(entry.getVersion() + 1);
                entry.setContentHash(calculateContentHash(entry));

                // Update status index if changed
                if (oldStatus != entry.getStatus()) {
                    removeFromIndex(statusIndex, oldStatus, contractId);
                    addToIndex(statusIndex, entry.getStatus(), contractId);
                }

                registry.put(contractId, entry);
                rebuildMerkleTree();

                this.updates.incrementAndGet();
                invalidateAnalyticsCache();

                LOGGER.debug("Contract updated: {} v{}", contractId, entry.getVersion());
                return entry;
            });
    }

    /**
     * Change contract status
     *
     * @param contractId Contract identifier
     * @param newStatus  New status
     * @param changedBy  User making the change
     * @param reason     Reason for change
     * @return Updated contract
     */
    public Uni<ContractEntry> changeStatus(String contractId, ContractStatus newStatus,
                                            String changedBy, String reason) {
        return get(contractId)
            .onItem().ifNull().failWith(() -> new ContractNotFoundException("Contract not found: " + contractId))
            .map(entry -> {
                ContractStatus oldStatus = entry.getStatus();

                // Remove from old status index
                removeFromIndex(statusIndex, oldStatus, contractId);

                // Update status
                entry.setStatus(newStatus);
                entry.setUpdatedAt(Instant.now());
                entry.setVersion(entry.getVersion() + 1);
                entry.setContentHash(calculateContentHash(entry));

                // Record status change
                entry.addStatusChange(new StatusChange(oldStatus, newStatus, changedBy, reason, Instant.now()));

                // Add to new status index
                addToIndex(statusIndex, newStatus, contractId);

                registry.put(contractId, entry);
                rebuildMerkleTree();

                invalidateAnalyticsCache();

                LOGGER.info("Contract {} status changed: {} -> {} by {}", contractId, oldStatus, newStatus, changedBy);
                return entry;
            });
    }

    /**
     * Get contract by ID
     *
     * @param contractId Contract identifier
     * @return Contract entry
     */
    public Uni<ContractEntry> getContract(String contractId) {
        queries.incrementAndGet();
        return get(contractId)
            .onItem().ifNull().failWith(() -> new ContractNotFoundException("Contract not found: " + contractId));
    }

    /**
     * Get contract by composite token ID
     *
     * @param compositeTokenId Composite token identifier
     * @return Contract entry
     */
    public Uni<ContractEntry> getContractByCompositeToken(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            queries.incrementAndGet();
            String contractId = compositeTokenIndex.get(compositeTokenId);
            if (contractId == null) {
                throw new ContractNotFoundException("No contract found for composite token: " + compositeTokenId);
            }
            return registry.get(contractId);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts by owner
     *
     * @param ownerId Owner identifier
     * @return List of contracts
     */
    public Uni<List<ContractEntry>> getContractsByOwner(String ownerId) {
        return Uni.createFrom().item(() -> {
            queries.incrementAndGet();
            Set<String> contractIds = ownerIndex.getOrDefault(ownerId, Collections.emptySet());
            return contractIds.stream()
                .map(registry::get)
                .filter(Objects::nonNull)
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts by type
     *
     * @param type Contract type
     * @return List of contracts
     */
    public Uni<List<ContractEntry>> getContractsByType(ContractType type) {
        return Uni.createFrom().item(() -> {
            queries.incrementAndGet();
            Set<String> contractIds = typeIndex.getOrDefault(type, Collections.emptySet());
            return contractIds.stream()
                .map(registry::get)
                .filter(Objects::nonNull)
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts by status
     *
     * @param status Contract status
     * @return List of contracts
     */
    public Uni<List<ContractEntry>> getContractsByStatus(ContractStatus status) {
        return Uni.createFrom().item(() -> {
            queries.incrementAndGet();
            Set<String> contractIds = statusIndex.getOrDefault(status, Collections.emptySet());
            return contractIds.stream()
                .map(registry::get)
                .filter(Objects::nonNull)
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get contracts by asset type
     *
     * @param assetType Asset type
     * @return List of contracts
     */
    public Uni<List<ContractEntry>> getContractsByAssetType(String assetType) {
        return Uni.createFrom().item(() -> {
            queries.incrementAndGet();
            Set<String> contractIds = assetTypeIndex.getOrDefault(assetType, Collections.emptySet());
            return contractIds.stream()
                .map(registry::get)
                .filter(Objects::nonNull)
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Query contracts with filters
     *
     * @param query Query parameters
     * @return Query result
     */
    public Uni<QueryResult> queryContracts(ContractQuery query) {
        return Uni.createFrom().item(() -> {
            queries.incrementAndGet();
            long startTime = System.nanoTime();

            // Start with all contracts or filtered set
            List<ContractEntry> results;
            if (query.getOwnerId() != null) {
                Set<String> ids = ownerIndex.getOrDefault(query.getOwnerId(), Collections.emptySet());
                results = ids.stream().map(registry::get).filter(Objects::nonNull).collect(Collectors.toList());
            } else if (query.getContractType() != null) {
                Set<String> ids = typeIndex.getOrDefault(query.getContractType(), Collections.emptySet());
                results = ids.stream().map(registry::get).filter(Objects::nonNull).collect(Collectors.toList());
            } else if (query.getStatus() != null) {
                Set<String> ids = statusIndex.getOrDefault(query.getStatus(), Collections.emptySet());
                results = ids.stream().map(registry::get).filter(Objects::nonNull).collect(Collectors.toList());
            } else {
                results = new ArrayList<>(registry.values());
            }

            // Apply additional filters
            if (query.getStatus() != null && query.getOwnerId() != null) {
                ContractStatus status = query.getStatus();
                results = results.stream()
                    .filter(c -> c.getStatus() == status)
                    .collect(Collectors.toList());
            }
            if (query.getMinValuation() != null) {
                BigDecimal min = query.getMinValuation();
                results = results.stream()
                    .filter(c -> c.getValuation() != null && c.getValuation().compareTo(min) >= 0)
                    .collect(Collectors.toList());
            }
            if (query.getMaxValuation() != null) {
                BigDecimal max = query.getMaxValuation();
                results = results.stream()
                    .filter(c -> c.getValuation() != null && c.getValuation().compareTo(max) <= 0)
                    .collect(Collectors.toList());
            }
            if (query.getCreatedAfter() != null) {
                Instant after = query.getCreatedAfter();
                results = results.stream()
                    .filter(c -> c.getCreatedAt().isAfter(after))
                    .collect(Collectors.toList());
            }
            if (query.getCreatedBefore() != null) {
                Instant before = query.getCreatedBefore();
                results = results.stream()
                    .filter(c -> c.getCreatedAt().isBefore(before))
                    .collect(Collectors.toList());
            }

            // Sort
            if (query.getSortBy() != null) {
                Comparator<ContractEntry> comparator = switch (query.getSortBy()) {
                    case "createdAt" -> Comparator.comparing(ContractEntry::getCreatedAt);
                    case "updatedAt" -> Comparator.comparing(ContractEntry::getUpdatedAt);
                    case "valuation" -> Comparator.comparing(c -> c.getValuation() != null ? c.getValuation() : BigDecimal.ZERO);
                    default -> Comparator.comparing(ContractEntry::getContractId);
                };
                if (query.isSortDescending()) {
                    comparator = comparator.reversed();
                }
                results.sort(comparator);
            }

            int totalCount = results.size();

            // Pagination
            int offset = query.getOffset();
            int limit = query.getLimit() > 0 ? query.getLimit() : 100;
            if (offset > 0) {
                results = results.stream().skip(offset).collect(Collectors.toList());
            }
            if (limit > 0) {
                results = results.stream().limit(limit).collect(Collectors.toList());
            }

            long queryTime = (System.nanoTime() - startTime) / 1_000_000;

            return new QueryResult(results, totalCount, offset, limit, queryTime);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Generate Merkle proof for a contract
     *
     * @param contractId Contract identifier
     * @return Proof data
     */
    public Uni<ContractProof> generateContractProof(String contractId) {
        proofGenerations.incrementAndGet();
        return generateProof(contractId).map(proof -> {
            ContractEntry entry = registry.get(contractId);
            return new ContractProof(
                contractId,
                entry != null ? entry.getContentHash() : null,
                currentRootHash,
                proof.toProofData(),
                Instant.now()
            );
        });
    }

    /**
     * Verify a contract proof
     *
     * @param proof Proof to verify
     * @return true if valid
     */
    public Uni<Boolean> verifyContractProof(ContractProof proof) {
        return verifyProof(proof.proofData().toMerkleProof());
    }

    /**
     * Get registry analytics
     *
     * @return Registry analytics
     */
    public Uni<RegistryAnalytics> getAnalytics() {
        return Uni.createFrom().item(() -> {
            // Return cached if valid
            if (cachedAnalytics != null && analyticsLastUpdated != null &&
                Instant.now().isBefore(analyticsLastUpdated.plus(ANALYTICS_CACHE_TTL))) {
                return cachedAnalytics;
            }

            // Calculate analytics
            long totalContracts = registry.size();

            Map<ContractStatus, Long> byStatus = new EnumMap<>(ContractStatus.class);
            for (ContractStatus status : ContractStatus.values()) {
                byStatus.put(status, (long) statusIndex.getOrDefault(status, Collections.emptySet()).size());
            }

            Map<ContractType, Long> byType = new EnumMap<>(ContractType.class);
            for (ContractType type : ContractType.values()) {
                byType.put(type, (long) typeIndex.getOrDefault(type, Collections.emptySet()).size());
            }

            BigDecimal totalValuation = registry.values().stream()
                .filter(c -> c.getValuation() != null)
                .map(ContractEntry::getValuation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal averageValuation = totalContracts > 0 ?
                totalValuation.divide(BigDecimal.valueOf(totalContracts), 2, java.math.RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

            long uniqueOwners = ownerIndex.size();
            long activeContracts = statusIndex.getOrDefault(ContractStatus.ACTIVE, Collections.emptySet()).size();

            Map<String, Long> byAssetType = new HashMap<>();
            for (Map.Entry<String, Set<String>> entry : assetTypeIndex.entrySet()) {
                byAssetType.put(entry.getKey(), (long) entry.getValue().size());
            }

            // Recent activity
            Instant oneDayAgo = Instant.now().minus(Duration.ofDays(1));
            long contractsLast24h = registry.values().stream()
                .filter(c -> c.getCreatedAt().isAfter(oneDayAgo))
                .count();

            cachedAnalytics = new RegistryAnalytics(
                totalContracts,
                byStatus,
                byType,
                byAssetType,
                totalValuation,
                averageValuation,
                uniqueOwners,
                activeContracts,
                contractsLast24h,
                currentRootHash,
                Instant.now()
            );
            analyticsLastUpdated = Instant.now();

            return cachedAnalytics;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Batch register contracts
     *
     * @param entries List of contracts to register
     * @return Batch result
     */
    public Uni<BatchResult> batchRegister(List<ContractEntry> entries) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            int success = 0;
            int failed = 0;
            List<String> errors = new ArrayList<>();

            for (ContractEntry entry : entries) {
                try {
                    if (entry.getCreatedAt() == null) {
                        entry.setCreatedAt(Instant.now());
                    }
                    entry.setUpdatedAt(Instant.now());
                    entry.setVersion(1L);
                    entry.setContentHash(calculateContentHash(entry));

                    registry.put(entry.getContractId(), entry);

                    // Update indexes
                    addToIndex(ownerIndex, entry.getOwnerId(), entry.getContractId());
                    addToIndex(typeIndex, entry.getContractType(), entry.getContractId());
                    addToIndex(statusIndex, entry.getStatus(), entry.getContractId());
                    if (entry.getAssetType() != null) {
                        addToIndex(assetTypeIndex, entry.getAssetType(), entry.getContractId());
                    }
                    if (entry.getCompositeTokenId() != null) {
                        compositeTokenIndex.put(entry.getCompositeTokenId(), entry.getContractId());
                    }

                    success++;
                } catch (Exception e) {
                    failed++;
                    errors.add(entry.getContractId() + ": " + e.getMessage());
                }
            }

            // Rebuild Merkle tree once
            rebuildMerkleTree();

            registrations.addAndGet(success);
            invalidateAnalyticsCache();

            long processingTime = (System.nanoTime() - startTime) / 1_000_000;

            LOGGER.info("Batch registered {} contracts ({} failed) in {}ms", success, failed, processingTime);

            return new BatchResult(success, failed, errors, processingTime);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get registry metrics
     *
     * @return Map of metrics
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalContracts", registry.size());
        metrics.put("registrations", registrations.get());
        metrics.put("updates", this.updates.get());
        metrics.put("queries", queries.get());
        metrics.put("proofGenerations", proofGenerations.get());
        metrics.put("merkleRootHash", currentRootHash != null ? currentRootHash.substring(0, 32) + "..." : null);
        metrics.put("treeRebuildCount", treeRebuildCount);
        metrics.put("lastTreeUpdate", lastTreeUpdate);
        metrics.put("indexedOwners", ownerIndex.size());
        metrics.put("indexedAssetTypes", assetTypeIndex.size());
        return metrics;
    }

    // ========== Private Helper Methods ==========

    private <K> void addToIndex(Map<K, Set<String>> index, K key, String contractId) {
        if (key != null) {
            index.computeIfAbsent(key, k -> ConcurrentHashMap.newKeySet()).add(contractId);
        }
    }

    private <K> void removeFromIndex(Map<K, Set<String>> index, K key, String contractId) {
        if (key != null) {
            Set<String> ids = index.get(key);
            if (ids != null) {
                ids.remove(contractId);
            }
        }
    }

    private void invalidateAnalyticsCache() {
        cachedAnalytics = null;
        analyticsLastUpdated = null;
    }

    private String calculateContentHash(ContractEntry entry) {
        String content = String.format("%s|%s|%s|%s|%s|%s|%s",
            entry.getContractId(),
            entry.getOwnerId(),
            entry.getContractType(),
            entry.getStatus(),
            entry.getCompositeTokenId(),
            entry.getValuation(),
            entry.getVersion()
        );
        return sha256(content);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // ========== Nested Classes and Records ==========

    /**
     * Contract entry in the registry
     */
    public static class ContractEntry {
        private String contractId;
        private String ownerId;
        private ContractType contractType;
        private ContractStatus status;
        private String compositeTokenId;
        private String assetType;
        private BigDecimal valuation;
        private String contentHash;
        private Instant createdAt;
        private Instant updatedAt;
        private Long version;
        private Map<String, Object> metadata = new HashMap<>();
        private List<StatusChange> statusHistory = new ArrayList<>();

        // Getters and Setters
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        public ContractType getContractType() { return contractType; }
        public void setContractType(ContractType contractType) { this.contractType = contractType; }
        public ContractStatus getStatus() { return status; }
        public void setStatus(ContractStatus status) { this.status = status; }
        public String getCompositeTokenId() { return compositeTokenId; }
        public void setCompositeTokenId(String compositeTokenId) { this.compositeTokenId = compositeTokenId; }
        public String getAssetType() { return assetType; }
        public void setAssetType(String assetType) { this.assetType = assetType; }
        public BigDecimal getValuation() { return valuation; }
        public void setValuation(BigDecimal valuation) { this.valuation = valuation; }
        public String getContentHash() { return contentHash; }
        public void setContentHash(String contentHash) { this.contentHash = contentHash; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public Long getVersion() { return version; }
        public void setVersion(Long version) { this.version = version; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
        public List<StatusChange> getStatusHistory() { return statusHistory; }

        public void addStatusChange(StatusChange change) {
            if (statusHistory == null) statusHistory = new ArrayList<>();
            statusHistory.add(change);
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private ContractEntry entry = new ContractEntry();

            public Builder contractId(String contractId) { entry.contractId = contractId; return this; }
            public Builder ownerId(String ownerId) { entry.ownerId = ownerId; return this; }
            public Builder contractType(ContractType type) { entry.contractType = type; return this; }
            public Builder status(ContractStatus status) { entry.status = status; return this; }
            public Builder compositeTokenId(String id) { entry.compositeTokenId = id; return this; }
            public Builder assetType(String assetType) { entry.assetType = assetType; return this; }
            public Builder valuation(BigDecimal valuation) { entry.valuation = valuation; return this; }

            public ContractEntry build() {
                if (entry.contractId == null) {
                    entry.contractId = "AC-" + UUID.randomUUID().toString().substring(0, 8);
                }
                if (entry.status == null) {
                    entry.status = ContractStatus.DRAFT;
                }
                return entry;
            }
        }
    }

    /**
     * Status change record
     */
    public record StatusChange(
        ContractStatus fromStatus,
        ContractStatus toStatus,
        String changedBy,
        String reason,
        Instant timestamp
    ) {}

    /**
     * Contract query parameters
     */
    public static class ContractQuery {
        private String ownerId;
        private ContractType contractType;
        private ContractStatus status;
        private String assetType;
        private BigDecimal minValuation;
        private BigDecimal maxValuation;
        private Instant createdAfter;
        private Instant createdBefore;
        private String sortBy;
        private boolean sortDescending;
        private int offset;
        private int limit = 100;

        // Getters and setters
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        public ContractType getContractType() { return contractType; }
        public void setContractType(ContractType contractType) { this.contractType = contractType; }
        public ContractStatus getStatus() { return status; }
        public void setStatus(ContractStatus status) { this.status = status; }
        public String getAssetType() { return assetType; }
        public void setAssetType(String assetType) { this.assetType = assetType; }
        public BigDecimal getMinValuation() { return minValuation; }
        public void setMinValuation(BigDecimal minValuation) { this.minValuation = minValuation; }
        public BigDecimal getMaxValuation() { return maxValuation; }
        public void setMaxValuation(BigDecimal maxValuation) { this.maxValuation = maxValuation; }
        public Instant getCreatedAfter() { return createdAfter; }
        public void setCreatedAfter(Instant createdAfter) { this.createdAfter = createdAfter; }
        public Instant getCreatedBefore() { return createdBefore; }
        public void setCreatedBefore(Instant createdBefore) { this.createdBefore = createdBefore; }
        public String getSortBy() { return sortBy; }
        public void setSortBy(String sortBy) { this.sortBy = sortBy; }
        public boolean isSortDescending() { return sortDescending; }
        public void setSortDescending(boolean sortDescending) { this.sortDescending = sortDescending; }
        public int getOffset() { return offset; }
        public void setOffset(int offset) { this.offset = offset; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
    }

    /**
     * Query result
     */
    public record QueryResult(
        List<ContractEntry> contracts,
        int totalCount,
        int offset,
        int limit,
        long queryTimeMs
    ) {}

    /**
     * Contract proof
     */
    public record ContractProof(
        String contractId,
        String contentHash,
        String merkleRoot,
        MerkleProof.ProofData proofData,
        Instant generatedAt
    ) {}

    /**
     * Registry analytics
     */
    public record RegistryAnalytics(
        long totalContracts,
        Map<ContractStatus, Long> byStatus,
        Map<ContractType, Long> byType,
        Map<String, Long> byAssetType,
        BigDecimal totalValuation,
        BigDecimal averageValuation,
        long uniqueOwners,
        long activeContracts,
        long contractsLast24h,
        String currentMerkleRoot,
        Instant calculatedAt
    ) {}

    /**
     * Batch operation result
     */
    public record BatchResult(
        int success,
        int failed,
        List<String> errors,
        long processingTimeMs
    ) {}

    // ========== Enums ==========

    public enum ContractType {
        STANDARD, RWA_CARBON, RWA_REAL_ESTATE, RWA_COMMODITY, RWA_SECURITY, DEFI, GOVERNANCE
    }

    public enum ContractStatus {
        DRAFT, PENDING_APPROVAL, ACTIVE, SUSPENDED, EXPIRED, TERMINATED
    }

    // ========== Exceptions ==========

    public static class ContractNotFoundException extends RuntimeException {
        public ContractNotFoundException(String message) { super(message); }
    }
}
