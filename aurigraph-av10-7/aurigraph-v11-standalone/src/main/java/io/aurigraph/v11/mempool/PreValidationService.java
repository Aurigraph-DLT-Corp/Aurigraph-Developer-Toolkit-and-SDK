package io.aurigraph.v11.mempool;

import io.aurigraph.v11.crypto.ParallelSignatureVerifier;
import io.aurigraph.v11.crypto.ParallelSignatureVerifier.SignatureAlgorithm;
import io.aurigraph.v11.crypto.ParallelSignatureVerifier.VerificationRequest;
import io.aurigraph.v11.crypto.ParallelSignatureVerifier.VerificationResult;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.PublicKey;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Mempool Pre-Validation Service
 * Sprint 5: Performance Optimization - Gap 5.2
 *
 * Implements mempool pre-validation with:
 * - Validate transactions upon mempool entry
 * - Pre-compute state dependencies
 * - Priority queue based on gas price and dependencies
 * - Parallel pre-validation workers
 * - Virtual thread-based concurrent processing
 *
 * Performance Targets:
 * - 500K+ pre-validations per second
 * - <5ms average pre-validation latency
 * - Efficient dependency graph construction
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
@ApplicationScoped
public class PreValidationService {

    private static final Logger LOG = Logger.getLogger(PreValidationService.class);

    // Configuration
    @ConfigProperty(name = "mempool.prevalidation.workers", defaultValue = "0")
    int validationWorkers; // 0 = virtual threads

    @ConfigProperty(name = "mempool.capacity", defaultValue = "500000")
    int mempoolCapacity;

    @ConfigProperty(name = "mempool.batch.size", defaultValue = "1000")
    int batchSize;

    @ConfigProperty(name = "mempool.min.gas.price", defaultValue = "1")
    long minGasPrice;

    @ConfigProperty(name = "mempool.max.tx.size", defaultValue = "131072")
    int maxTransactionSize; // 128KB

    @ConfigProperty(name = "mempool.nonce.window", defaultValue = "100")
    int nonceWindow;

    @ConfigProperty(name = "mempool.dependency.cache.size", defaultValue = "100000")
    int dependencyCacheSize;

    // Injected services
    @Inject
    ParallelSignatureVerifier signatureVerifier;

    // Transaction storage - priority queue ordered by gas price
    private PriorityBlockingQueue<MempoolEntry> pendingTransactions;

    // Transaction lookup
    private ConcurrentHashMap<String, MempoolEntry> transactionMap;

    // Sender nonce tracking
    private ConcurrentHashMap<String, NavigableSet<Long>> senderNonces;

    // Dependency graph
    private ConcurrentHashMap<String, Set<String>> dependencyGraph;
    private ConcurrentHashMap<String, Set<String>> dependentGraph;

    // Address to transaction mapping for dependency computation
    private ConcurrentHashMap<String, Set<String>> readAddressIndex;
    private ConcurrentHashMap<String, Set<String>> writeAddressIndex;

    // Execution services
    private ExecutorService validationExecutor;
    private ScheduledExecutorService maintenanceExecutor;

    // Metrics
    private final AtomicLong totalReceived = new AtomicLong(0);
    private final AtomicLong totalValidated = new AtomicLong(0);
    private final AtomicLong totalRejected = new AtomicLong(0);
    private final AtomicLong totalEvicted = new AtomicLong(0);
    private final AtomicLong totalDependenciesComputed = new AtomicLong(0);
    private final AtomicLong totalValidationTimeNanos = new AtomicLong(0);

    // State
    private volatile boolean running = false;

    @PostConstruct
    public void initialize() {
        // Initialize priority queue (higher gas price = higher priority)
        pendingTransactions = new PriorityBlockingQueue<>(
            mempoolCapacity / 10, // Initial capacity
            Comparator.comparingLong(MempoolEntry::getEffectivePriority).reversed()
        );

        // Initialize maps
        transactionMap = new ConcurrentHashMap<>(mempoolCapacity);
        senderNonces = new ConcurrentHashMap<>();
        dependencyGraph = new ConcurrentHashMap<>(dependencyCacheSize);
        dependentGraph = new ConcurrentHashMap<>(dependencyCacheSize);
        readAddressIndex = new ConcurrentHashMap<>();
        writeAddressIndex = new ConcurrentHashMap<>();

        // Initialize validation executor
        if (validationWorkers <= 0) {
            validationExecutor = Executors.newVirtualThreadPerTaskExecutor();
            LOG.info("PreValidationService using virtual threads");
        } else {
            validationExecutor = Executors.newFixedThreadPool(validationWorkers,
                Thread.ofVirtual().name("prevalidator-", 0).factory());
            LOG.infof("PreValidationService using %d virtual threads", validationWorkers);
        }

        // Initialize maintenance executor
        maintenanceExecutor = Executors.newScheduledThreadPool(2,
            Thread.ofVirtual().name("mempool-maint-", 0).factory());

        // Schedule periodic cleanup
        maintenanceExecutor.scheduleAtFixedRate(
            this::cleanupExpiredTransactions, 30, 30, TimeUnit.SECONDS);

        // Schedule metrics reporting
        maintenanceExecutor.scheduleAtFixedRate(
            this::reportMetrics, 10, 10, TimeUnit.SECONDS);

        running = true;
        LOG.infof("PreValidationService initialized: capacity=%d, batchSize=%d, minGas=%d",
            mempoolCapacity, batchSize, minGasPrice);
    }

    @PreDestroy
    public void shutdown() {
        running = false;

        validationExecutor.shutdown();
        maintenanceExecutor.shutdown();

        try {
            if (!validationExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                validationExecutor.shutdownNow();
            }
            if (!maintenanceExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                maintenanceExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            validationExecutor.shutdownNow();
            maintenanceExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        // Clear all data structures
        pendingTransactions.clear();
        transactionMap.clear();
        senderNonces.clear();
        dependencyGraph.clear();
        dependentGraph.clear();

        LOG.info("PreValidationService shutdown complete");
    }

    /**
     * Submit a transaction for pre-validation
     * Validates and adds to mempool if valid
     *
     * @param transaction Transaction to validate
     * @return PreValidationResult with validation status
     */
    public PreValidationResult submit(PendingTransaction transaction) {
        if (!running) {
            return PreValidationResult.rejected(transaction.transactionId, "Service not running");
        }

        totalReceived.incrementAndGet();
        long startTime = System.nanoTime();

        // Basic validation
        ValidationError basicError = performBasicValidation(transaction);
        if (basicError != null) {
            totalRejected.incrementAndGet();
            return PreValidationResult.rejected(transaction.transactionId, basicError.message);
        }

        // Check capacity
        if (transactionMap.size() >= mempoolCapacity) {
            // Try to evict lower priority transaction
            if (!evictLowestPriority(transaction)) {
                totalRejected.incrementAndGet();
                return PreValidationResult.rejected(transaction.transactionId, "Mempool full");
            }
        }

        // Signature verification (async if verifier available)
        if (transaction.signature != null && transaction.publicKey != null) {
            VerificationResult sigResult = verifySignature(transaction);
            if (!sigResult.valid) {
                totalRejected.incrementAndGet();
                return PreValidationResult.rejected(transaction.transactionId,
                    "Invalid signature: " + sigResult.errorMessage);
            }
        }

        // Nonce validation
        ValidationError nonceError = validateNonce(transaction);
        if (nonceError != null) {
            totalRejected.incrementAndGet();
            return PreValidationResult.rejected(transaction.transactionId, nonceError.message);
        }

        // Compute dependencies
        Set<String> dependencies = computeDependencies(transaction);
        totalDependenciesComputed.addAndGet(dependencies.size());

        // Create mempool entry
        MempoolEntry entry = new MempoolEntry(
            transaction,
            Instant.now(),
            dependencies,
            ValidationStatus.VALIDATED
        );

        // Add to mempool
        transactionMap.put(transaction.transactionId, entry);
        pendingTransactions.offer(entry);

        // Update indices
        updateIndices(transaction, true);
        updateNonceTracking(transaction.sender, transaction.nonce);

        long durationNanos = System.nanoTime() - startTime;
        totalValidated.incrementAndGet();
        totalValidationTimeNanos.addAndGet(durationNanos);

        return PreValidationResult.accepted(
            transaction.transactionId,
            entry.priority,
            dependencies,
            durationNanos
        );
    }

    /**
     * Submit multiple transactions for batch pre-validation
     *
     * @param transactions List of transactions
     * @return BatchPreValidationResult with all results
     */
    public BatchPreValidationResult submitBatch(List<PendingTransaction> transactions) {
        if (!running) {
            return BatchPreValidationResult.failure("Service not running");
        }

        long startTime = System.nanoTime();

        // Validate in parallel
        List<CompletableFuture<PreValidationResult>> futures = transactions.stream()
            .map(tx -> CompletableFuture.supplyAsync(() -> submit(tx), validationExecutor))
            .toList();

        List<PreValidationResult> results = futures.stream()
            .map(future -> {
                try {
                    return future.get(5, TimeUnit.SECONDS);
                } catch (Exception e) {
                    return PreValidationResult.rejected("unknown", "Validation timeout");
                }
            })
            .toList();

        long durationNanos = System.nanoTime() - startTime;

        int acceptedCount = (int) results.stream()
            .filter(r -> r.status == ValidationStatus.VALIDATED)
            .count();

        double tps = (transactions.size() * 1_000_000_000.0) / durationNanos;

        return new BatchPreValidationResult(results, acceptedCount,
            transactions.size() - acceptedCount, durationNanos, tps);
    }

    /**
     * Get transactions ready for block inclusion
     * Returns transactions with all dependencies satisfied
     *
     * @param maxCount Maximum number of transactions to return
     * @return List of ready transactions ordered by priority
     */
    public List<PendingTransaction> getReadyTransactions(int maxCount) {
        List<PendingTransaction> ready = new ArrayList<>();
        Set<String> included = new HashSet<>();

        // Process priority queue
        List<MempoolEntry> entries = new ArrayList<>();
        pendingTransactions.drainTo(entries);

        for (MempoolEntry entry : entries) {
            if (ready.size() >= maxCount) {
                // Re-add remaining entries
                pendingTransactions.addAll(entries.subList(entries.indexOf(entry), entries.size()));
                break;
            }

            // Check if all dependencies are satisfied
            boolean dependenciesSatisfied = entry.dependencies.isEmpty() ||
                entry.dependencies.stream().allMatch(included::contains);

            if (dependenciesSatisfied) {
                ready.add(entry.transaction);
                included.add(entry.transaction.transactionId);
            } else {
                // Re-add to queue for later
                pendingTransactions.offer(entry);
            }
        }

        return ready;
    }

    /**
     * Get transactions for a specific sender ordered by nonce
     *
     * @param sender Sender address
     * @return List of transactions ordered by nonce
     */
    public List<PendingTransaction> getTransactionsBySender(String sender) {
        return transactionMap.values().stream()
            .filter(e -> e.transaction.sender.equals(sender))
            .sorted(Comparator.comparingLong(e -> e.transaction.nonce))
            .map(e -> e.transaction)
            .toList();
    }

    /**
     * Remove a transaction from the mempool
     *
     * @param transactionId Transaction ID to remove
     * @return true if removed, false if not found
     */
    public boolean remove(String transactionId) {
        MempoolEntry entry = transactionMap.remove(transactionId);
        if (entry == null) {
            return false;
        }

        // Remove from queue
        pendingTransactions.remove(entry);

        // Update indices
        updateIndices(entry.transaction, false);

        // Remove from nonce tracking
        NavigableSet<Long> nonces = senderNonces.get(entry.transaction.sender);
        if (nonces != null) {
            nonces.remove(entry.transaction.nonce);
        }

        // Remove from dependency graph
        dependencyGraph.remove(transactionId);
        dependentGraph.values().forEach(set -> set.remove(transactionId));

        return true;
    }

    /**
     * Remove multiple transactions (e.g., after block inclusion)
     *
     * @param transactionIds List of transaction IDs to remove
     * @return Number of transactions removed
     */
    public int removeBatch(List<String> transactionIds) {
        int removed = 0;
        for (String txId : transactionIds) {
            if (remove(txId)) {
                removed++;
            }
        }
        return removed;
    }

    /**
     * Get transaction by ID
     *
     * @param transactionId Transaction ID
     * @return Transaction or null if not found
     */
    public PendingTransaction getTransaction(String transactionId) {
        MempoolEntry entry = transactionMap.get(transactionId);
        return entry != null ? entry.transaction : null;
    }

    /**
     * Check if a transaction exists in the mempool
     */
    public boolean contains(String transactionId) {
        return transactionMap.containsKey(transactionId);
    }

    /**
     * Get current mempool size
     */
    public int size() {
        return transactionMap.size();
    }

    /**
     * Get mempool statistics
     */
    public MempoolStats getStats() {
        // Calculate statistics
        long total = totalReceived.get();
        long validated = totalValidated.get();
        long rejected = totalRejected.get();
        long evicted = totalEvicted.get();

        double avgValidationMs = validated > 0 ?
            (totalValidationTimeNanos.get() / 1_000_000.0) / validated : 0;

        double acceptanceRate = total > 0 ?
            (validated * 100.0) / total : 100.0;

        // Calculate gas statistics
        LongSummaryStatistics gasStats = transactionMap.values().stream()
            .mapToLong(e -> e.transaction.gasPrice)
            .summaryStatistics();

        return new MempoolStats(
            transactionMap.size(),
            mempoolCapacity,
            total,
            validated,
            rejected,
            evicted,
            totalDependenciesComputed.get(),
            avgValidationMs,
            acceptanceRate,
            gasStats.getMin(),
            gasStats.getMax(),
            gasStats.getAverage()
        );
    }

    // Private implementation methods

    private ValidationError performBasicValidation(PendingTransaction tx) {
        // Check transaction ID
        if (tx.transactionId == null || tx.transactionId.isEmpty()) {
            return new ValidationError("MISSING_TX_ID", "Transaction ID is required");
        }

        // Check for duplicate
        if (transactionMap.containsKey(tx.transactionId)) {
            return new ValidationError("DUPLICATE", "Transaction already in mempool");
        }

        // Check sender
        if (tx.sender == null || tx.sender.isEmpty()) {
            return new ValidationError("MISSING_SENDER", "Sender address is required");
        }

        // Check gas price
        if (tx.gasPrice < minGasPrice) {
            return new ValidationError("LOW_GAS", "Gas price below minimum: " + minGasPrice);
        }

        // Check transaction size
        if (tx.data != null && tx.data.length > maxTransactionSize) {
            return new ValidationError("TX_TOO_LARGE", "Transaction exceeds maximum size: " + maxTransactionSize);
        }

        return null; // No error
    }

    private ValidationError validateNonce(PendingTransaction tx) {
        NavigableSet<Long> senderNonceSet = senderNonces.get(tx.sender);

        if (senderNonceSet != null && !senderNonceSet.isEmpty()) {
            Long lowestNonce = senderNonceSet.first();
            Long highestNonce = senderNonceSet.last();

            // Check if nonce is within acceptable window
            if (tx.nonce < lowestNonce) {
                return new ValidationError("NONCE_TOO_LOW",
                    "Nonce " + tx.nonce + " is lower than pending: " + lowestNonce);
            }

            if (tx.nonce > highestNonce + nonceWindow) {
                return new ValidationError("NONCE_TOO_HIGH",
                    "Nonce " + tx.nonce + " too far ahead of pending: " + highestNonce);
            }

            // Check for duplicate nonce
            if (senderNonceSet.contains(tx.nonce)) {
                return new ValidationError("DUPLICATE_NONCE",
                    "Nonce " + tx.nonce + " already exists for sender");
            }
        }

        return null; // No error
    }

    private VerificationResult verifySignature(PendingTransaction tx) {
        if (signatureVerifier == null) {
            // No verifier available, assume valid
            return VerificationResult.success(tx.transactionId, 0);
        }

        VerificationRequest request = VerificationRequest.builder()
            .transactionId(tx.transactionId)
            .algorithm(tx.signatureAlgorithm != null ?
                tx.signatureAlgorithm : SignatureAlgorithm.DILITHIUM)
            .data(tx.getSignableData())
            .signature(tx.signature)
            .publicKey(tx.publicKey)
            .build();

        return signatureVerifier.verify(request);
    }

    private Set<String> computeDependencies(PendingTransaction tx) {
        Set<String> dependencies = new HashSet<>();

        // Same-sender nonce dependency
        NavigableSet<Long> senderNonceSet = senderNonces.get(tx.sender);
        if (senderNonceSet != null) {
            Long previousNonce = senderNonceSet.lower(tx.nonce);
            if (previousNonce != null) {
                // Find transaction with previous nonce
                transactionMap.values().stream()
                    .filter(e -> e.transaction.sender.equals(tx.sender) &&
                                e.transaction.nonce == previousNonce)
                    .findFirst()
                    .ifPresent(e -> dependencies.add(e.transaction.transactionId));
            }
        }

        // Read-write dependencies
        if (tx.readSet != null) {
            for (String addr : tx.readSet) {
                Set<String> writers = writeAddressIndex.get(addr);
                if (writers != null) {
                    dependencies.addAll(writers);
                }
            }
        }

        // Remove self if present
        dependencies.remove(tx.transactionId);

        // Update dependency graphs
        if (!dependencies.isEmpty()) {
            dependencyGraph.put(tx.transactionId, new HashSet<>(dependencies));
            for (String depId : dependencies) {
                dependentGraph.computeIfAbsent(depId, k -> ConcurrentHashMap.newKeySet())
                    .add(tx.transactionId);
            }
        }

        return dependencies;
    }

    private void updateIndices(PendingTransaction tx, boolean add) {
        if (add) {
            if (tx.readSet != null) {
                for (String addr : tx.readSet) {
                    readAddressIndex.computeIfAbsent(addr, k -> ConcurrentHashMap.newKeySet())
                        .add(tx.transactionId);
                }
            }
            if (tx.writeSet != null) {
                for (String addr : tx.writeSet) {
                    writeAddressIndex.computeIfAbsent(addr, k -> ConcurrentHashMap.newKeySet())
                        .add(tx.transactionId);
                }
            }
        } else {
            if (tx.readSet != null) {
                for (String addr : tx.readSet) {
                    Set<String> readers = readAddressIndex.get(addr);
                    if (readers != null) {
                        readers.remove(tx.transactionId);
                    }
                }
            }
            if (tx.writeSet != null) {
                for (String addr : tx.writeSet) {
                    Set<String> writers = writeAddressIndex.get(addr);
                    if (writers != null) {
                        writers.remove(tx.transactionId);
                    }
                }
            }
        }
    }

    private void updateNonceTracking(String sender, long nonce) {
        senderNonces.computeIfAbsent(sender, k -> new ConcurrentSkipListSet<>()).add(nonce);
    }

    private boolean evictLowestPriority(PendingTransaction newTx) {
        // Find lowest priority transaction
        MempoolEntry lowest = transactionMap.values().stream()
            .min(Comparator.comparingLong(MempoolEntry::getEffectivePriority))
            .orElse(null);

        if (lowest != null && lowest.getEffectivePriority() < newTx.gasPrice) {
            remove(lowest.transaction.transactionId);
            totalEvicted.incrementAndGet();
            return true;
        }

        return false;
    }

    private void cleanupExpiredTransactions() {
        if (!running) return;

        try {
            // Remove transactions older than 5 minutes
            Instant cutoff = Instant.now().minusSeconds(300);
            int removed = 0;

            Iterator<Map.Entry<String, MempoolEntry>> iterator =
                transactionMap.entrySet().iterator();

            while (iterator.hasNext()) {
                Map.Entry<String, MempoolEntry> entry = iterator.next();
                if (entry.getValue().submittedAt.isBefore(cutoff)) {
                    iterator.remove();
                    pendingTransactions.remove(entry.getValue());
                    removed++;
                }
            }

            if (removed > 0) {
                totalEvicted.addAndGet(removed);
                LOG.debugf("Cleaned up %d expired transactions", removed);
            }
        } catch (Exception e) {
            LOG.error("Error cleaning up expired transactions", e);
        }
    }

    private void reportMetrics() {
        if (!running) return;

        try {
            MempoolStats stats = getStats();
            LOG.debugf("Mempool: size=%d/%d, validated=%d, rejected=%d, avgValidation=%.2fms",
                stats.currentSize, stats.capacity, stats.totalValidated,
                stats.totalRejected, stats.averageValidationMs);
        } catch (Exception e) {
            LOG.debug("Error reporting metrics: " + e.getMessage());
        }
    }

    // Data classes

    /**
     * Pending transaction for mempool
     */
    public static class PendingTransaction {
        public final String transactionId;
        public final String sender;
        public final String recipient;
        public final long nonce;
        public final long gasPrice;
        public final long gasLimit;
        public final long value;
        public final byte[] data;
        public final byte[] signature;
        public final PublicKey publicKey;
        public final SignatureAlgorithm signatureAlgorithm;
        public final Set<String> readSet;
        public final Set<String> writeSet;
        public final Map<String, Object> metadata;

        public PendingTransaction(String transactionId, String sender, String recipient,
                                 long nonce, long gasPrice, long gasLimit, long value,
                                 byte[] data, byte[] signature, PublicKey publicKey,
                                 SignatureAlgorithm sigAlgo, Set<String> readSet,
                                 Set<String> writeSet, Map<String, Object> metadata) {
            this.transactionId = transactionId;
            this.sender = sender;
            this.recipient = recipient;
            this.nonce = nonce;
            this.gasPrice = gasPrice;
            this.gasLimit = gasLimit;
            this.value = value;
            this.data = data;
            this.signature = signature;
            this.publicKey = publicKey;
            this.signatureAlgorithm = sigAlgo;
            this.readSet = readSet;
            this.writeSet = writeSet;
            this.metadata = metadata;
        }

        public byte[] getSignableData() {
            // In production, this would properly serialize the transaction
            return (transactionId + sender + recipient + nonce + gasPrice + value)
                .getBytes();
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String transactionId;
            private String sender;
            private String recipient = "";
            private long nonce = 0;
            private long gasPrice = 1;
            private long gasLimit = 21000;
            private long value = 0;
            private byte[] data = new byte[0];
            private byte[] signature;
            private PublicKey publicKey;
            private SignatureAlgorithm signatureAlgorithm;
            private Set<String> readSet = new HashSet<>();
            private Set<String> writeSet = new HashSet<>();
            private Map<String, Object> metadata = new HashMap<>();

            public Builder transactionId(String id) { this.transactionId = id; return this; }
            public Builder sender(String sender) { this.sender = sender; return this; }
            public Builder recipient(String recipient) { this.recipient = recipient; return this; }
            public Builder nonce(long nonce) { this.nonce = nonce; return this; }
            public Builder gasPrice(long gasPrice) { this.gasPrice = gasPrice; return this; }
            public Builder gasLimit(long gasLimit) { this.gasLimit = gasLimit; return this; }
            public Builder value(long value) { this.value = value; return this; }
            public Builder data(byte[] data) { this.data = data; return this; }
            public Builder signature(byte[] sig) { this.signature = sig; return this; }
            public Builder publicKey(PublicKey key) { this.publicKey = key; return this; }
            public Builder signatureAlgorithm(SignatureAlgorithm algo) { this.signatureAlgorithm = algo; return this; }
            public Builder readSet(Set<String> set) { this.readSet = set; return this; }
            public Builder writeSet(Set<String> set) { this.writeSet = set; return this; }
            public Builder addRead(String addr) { this.readSet.add(addr); return this; }
            public Builder addWrite(String addr) { this.writeSet.add(addr); return this; }
            public Builder metadata(Map<String, Object> meta) { this.metadata = meta; return this; }

            public PendingTransaction build() {
                return new PendingTransaction(transactionId, sender, recipient, nonce,
                    gasPrice, gasLimit, value, data, signature, publicKey, signatureAlgorithm,
                    readSet, writeSet, metadata);
            }
        }
    }

    /**
     * Validation status
     */
    public enum ValidationStatus {
        PENDING,
        VALIDATED,
        REJECTED,
        EXPIRED
    }

    /**
     * Validation error
     */
    private static class ValidationError {
        final String code;
        final String message;

        ValidationError(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }

    /**
     * Mempool entry
     */
    private static class MempoolEntry {
        final PendingTransaction transaction;
        final Instant submittedAt;
        final Set<String> dependencies;
        final ValidationStatus status;
        final long priority;

        MempoolEntry(PendingTransaction tx, Instant submittedAt,
                    Set<String> dependencies, ValidationStatus status) {
            this.transaction = tx;
            this.submittedAt = submittedAt;
            this.dependencies = dependencies;
            this.status = status;
            this.priority = tx.gasPrice;
        }

        long getEffectivePriority() {
            // Priority decreases with age and dependency count
            long agePenalty = java.time.Duration.between(submittedAt, Instant.now()).toSeconds();
            long depPenalty = dependencies.size() * 10;
            return priority - agePenalty - depPenalty;
        }
    }

    /**
     * Pre-validation result
     */
    public static class PreValidationResult {
        public final String transactionId;
        public final ValidationStatus status;
        public final long priority;
        public final Set<String> dependencies;
        public final long validationNanos;
        public final String errorMessage;

        private PreValidationResult(String txId, ValidationStatus status, long priority,
                                   Set<String> dependencies, long nanos, String error) {
            this.transactionId = txId;
            this.status = status;
            this.priority = priority;
            this.dependencies = dependencies != null ? dependencies : Collections.emptySet();
            this.validationNanos = nanos;
            this.errorMessage = error;
        }

        public static PreValidationResult accepted(String txId, long priority,
                                                   Set<String> deps, long nanos) {
            return new PreValidationResult(txId, ValidationStatus.VALIDATED, priority, deps, nanos, null);
        }

        public static PreValidationResult rejected(String txId, String error) {
            return new PreValidationResult(txId, ValidationStatus.REJECTED, 0, null, 0, error);
        }

        public double getValidationMs() {
            return validationNanos / 1_000_000.0;
        }
    }

    /**
     * Batch pre-validation result
     */
    public static class BatchPreValidationResult {
        public final List<PreValidationResult> results;
        public final int acceptedCount;
        public final int rejectedCount;
        public final long durationNanos;
        public final double tps;
        public final String errorMessage;

        public BatchPreValidationResult(List<PreValidationResult> results, int accepted,
                                        int rejected, long nanos, double tps) {
            this.results = results;
            this.acceptedCount = accepted;
            this.rejectedCount = rejected;
            this.durationNanos = nanos;
            this.tps = tps;
            this.errorMessage = null;
        }

        public static BatchPreValidationResult failure(String error) {
            return new BatchPreValidationResult(Collections.emptyList(), 0, 0, 0, 0);
        }

        public double getDurationMs() {
            return durationNanos / 1_000_000.0;
        }
    }

    /**
     * Mempool statistics
     */
    public static class MempoolStats {
        public final int currentSize;
        public final int capacity;
        public final long totalReceived;
        public final long totalValidated;
        public final long totalRejected;
        public final long totalEvicted;
        public final long totalDependencies;
        public final double averageValidationMs;
        public final double acceptanceRate;
        public final long minGasPrice;
        public final long maxGasPrice;
        public final double avgGasPrice;

        public MempoolStats(int currentSize, int capacity, long received, long validated,
                           long rejected, long evicted, long dependencies, double avgValidation,
                           double acceptRate, long minGas, long maxGas, double avgGas) {
            this.currentSize = currentSize;
            this.capacity = capacity;
            this.totalReceived = received;
            this.totalValidated = validated;
            this.totalRejected = rejected;
            this.totalEvicted = evicted;
            this.totalDependencies = dependencies;
            this.averageValidationMs = avgValidation;
            this.acceptanceRate = acceptRate;
            this.minGasPrice = minGas;
            this.maxGasPrice = maxGas;
            this.avgGasPrice = avgGas;
        }

        public double getUtilization() {
            return (currentSize * 100.0) / capacity;
        }

        @Override
        public String toString() {
            return String.format(
                "MempoolStats{size=%d/%d (%.1f%%), validated=%d, rejected=%d, " +
                "avgValidation=%.2fms, acceptRate=%.1f%%, gasRange=[%d-%d]}",
                currentSize, capacity, getUtilization(),
                totalValidated, totalRejected, averageValidationMs, acceptanceRate,
                minGasPrice, maxGasPrice
            );
        }
    }
}
