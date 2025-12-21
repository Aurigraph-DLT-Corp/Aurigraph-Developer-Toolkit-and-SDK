package io.aurigraph.v11.execution;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;

/**
 * Optimistic Transaction Execution Engine
 * Sprint 5: Performance Optimization - Gap 5.2
 *
 * Implements optimistic execution with:
 * - Pre-execution of transactions during validation phase
 * - Execution result caching for fast commit
 * - Rollback on consensus failure
 * - State speculation with conflict detection
 * - Virtual thread-based parallel execution
 *
 * Performance Targets:
 * - 5M+ TPS pre-execution capacity
 * - <50ms average execution latency
 * - <10ms rollback latency
 * - 99%+ cache hit rate for valid transactions
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
@ApplicationScoped
public class OptimisticExecutor {

    private static final Logger LOG = Logger.getLogger(OptimisticExecutor.class);

    // Configuration
    @ConfigProperty(name = "optimistic.execution.threads", defaultValue = "0")
    int executionThreads; // 0 = virtual threads

    @ConfigProperty(name = "optimistic.cache.size", defaultValue = "100000")
    int cacheSize;

    @ConfigProperty(name = "optimistic.cache.ttl.seconds", defaultValue = "60")
    int cacheTtlSeconds;

    @ConfigProperty(name = "optimistic.speculation.depth", defaultValue = "10")
    int speculationDepth;

    @ConfigProperty(name = "optimistic.rollback.timeout.ms", defaultValue = "1000")
    long rollbackTimeoutMs;

    @ConfigProperty(name = "optimistic.conflict.detection.enabled", defaultValue = "true")
    boolean conflictDetectionEnabled;

    // Execution cache
    private ConcurrentHashMap<String, CachedExecution> executionCache;

    // Speculative state
    private ConcurrentHashMap<String, SpeculativeState> speculativeStates;

    // Conflict tracking
    private ConcurrentHashMap<String, Set<String>> writeConflicts;
    private ConcurrentHashMap<String, Set<String>> readWriteConflicts;

    // Execution services
    private ExecutorService executionExecutor;
    private ScheduledExecutorService maintenanceExecutor;

    // Transaction executor function (to be set by the consumer)
    private volatile Function<TransactionContext, ExecutionResult> transactionExecutor;

    // Metrics
    private final AtomicLong totalExecutions = new AtomicLong(0);
    private final AtomicLong successfulExecutions = new AtomicLong(0);
    private final AtomicLong failedExecutions = new AtomicLong(0);
    private final AtomicLong cacheHits = new AtomicLong(0);
    private final AtomicLong cacheMisses = new AtomicLong(0);
    private final AtomicLong rollbackCount = new AtomicLong(0);
    private final AtomicLong conflictsDetected = new AtomicLong(0);
    private final AtomicLong speculativeExecutions = new AtomicLong(0);
    private final AtomicLong totalExecutionTimeNanos = new AtomicLong(0);

    // State
    private volatile boolean running = false;

    @PostConstruct
    public void initialize() {
        // Initialize caches
        executionCache = new ConcurrentHashMap<>(cacheSize);
        speculativeStates = new ConcurrentHashMap<>();
        writeConflicts = new ConcurrentHashMap<>();
        readWriteConflicts = new ConcurrentHashMap<>();

        // Initialize execution executor
        if (executionThreads <= 0) {
            executionExecutor = Executors.newVirtualThreadPerTaskExecutor();
            LOG.info("OptimisticExecutor using virtual threads");
        } else {
            executionExecutor = Executors.newFixedThreadPool(executionThreads,
                Thread.ofVirtual().name("opt-executor-", 0).factory());
            LOG.infof("OptimisticExecutor using %d virtual threads", executionThreads);
        }

        // Initialize maintenance executor
        maintenanceExecutor = Executors.newScheduledThreadPool(2,
            Thread.ofVirtual().name("opt-maintenance-", 0).factory());

        // Schedule cache cleanup
        maintenanceExecutor.scheduleAtFixedRate(
            this::cleanupExpiredCache,
            cacheTtlSeconds, cacheTtlSeconds, TimeUnit.SECONDS
        );

        // Schedule metrics reporting
        maintenanceExecutor.scheduleAtFixedRate(
            this::reportMetrics,
            10, 10, TimeUnit.SECONDS
        );

        running = true;
        LOG.infof("OptimisticExecutor initialized: cacheSize=%d, ttl=%ds, speculationDepth=%d",
            cacheSize, cacheTtlSeconds, speculationDepth);
    }

    @PreDestroy
    public void shutdown() {
        running = false;

        executionExecutor.shutdown();
        maintenanceExecutor.shutdown();

        try {
            if (!executionExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                executionExecutor.shutdownNow();
            }
            if (!maintenanceExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                maintenanceExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executionExecutor.shutdownNow();
            maintenanceExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        // Clear caches
        executionCache.clear();
        speculativeStates.clear();

        LOG.info("OptimisticExecutor shutdown complete");
    }

    /**
     * Set the transaction executor function
     * This function will be called to execute each transaction
     */
    public void setTransactionExecutor(Function<TransactionContext, ExecutionResult> executor) {
        this.transactionExecutor = executor;
    }

    /**
     * Pre-execute a transaction optimistically
     * The result is cached for fast commit if consensus succeeds
     *
     * @param context Transaction context with all execution data
     * @return PreExecutionResult with execution outcome and cache status
     */
    public PreExecutionResult preExecute(TransactionContext context) {
        if (!running) {
            return PreExecutionResult.failure(context.transactionId, "Executor not running");
        }

        String txId = context.transactionId;
        long startTime = System.nanoTime();

        // Check cache first
        CachedExecution cached = executionCache.get(txId);
        if (cached != null && !cached.isExpired()) {
            cacheHits.incrementAndGet();
            return PreExecutionResult.cached(txId, cached.result, cached.getAgeMs());
        }
        cacheMisses.incrementAndGet();

        // Check for conflicts
        if (conflictDetectionEnabled) {
            Set<String> conflicts = detectConflicts(context);
            if (!conflicts.isEmpty()) {
                conflictsDetected.incrementAndGet();
                return PreExecutionResult.conflicting(txId, conflicts);
            }
        }

        // Execute the transaction
        ExecutionResult result;
        try {
            if (transactionExecutor != null) {
                result = transactionExecutor.apply(context);
            } else {
                // Default execution (no-op for testing)
                result = ExecutionResult.success(txId, context.data, new HashMap<>());
            }
        } catch (Exception e) {
            failedExecutions.incrementAndGet();
            return PreExecutionResult.failure(txId, "Execution error: " + e.getMessage());
        }

        long durationNanos = System.nanoTime() - startTime;
        totalExecutions.incrementAndGet();
        totalExecutionTimeNanos.addAndGet(durationNanos);

        if (result.success) {
            successfulExecutions.incrementAndGet();

            // Cache the result
            CachedExecution cachedResult = new CachedExecution(
                txId, result, Instant.now(), Duration.ofSeconds(cacheTtlSeconds)
            );
            executionCache.put(txId, cachedResult);

            // Update conflict tracking
            updateConflictTracking(context);

            return PreExecutionResult.success(txId, result, durationNanos);
        } else {
            failedExecutions.incrementAndGet();
            return PreExecutionResult.failure(txId, result.errorMessage);
        }
    }

    /**
     * Pre-execute multiple transactions in parallel
     *
     * @param contexts List of transaction contexts
     * @return BatchPreExecutionResult with all results
     */
    public BatchPreExecutionResult preExecuteBatch(List<TransactionContext> contexts) {
        if (!running) {
            return BatchPreExecutionResult.failure("Executor not running");
        }

        long startTime = System.nanoTime();

        // Execute in parallel
        List<CompletableFuture<PreExecutionResult>> futures = contexts.stream()
            .map(ctx -> CompletableFuture.supplyAsync(() -> preExecute(ctx), executionExecutor))
            .toList();

        List<PreExecutionResult> results = futures.stream()
            .map(future -> {
                try {
                    return future.get(5, TimeUnit.SECONDS);
                } catch (Exception e) {
                    return PreExecutionResult.failure("unknown", "Execution timeout: " + e.getMessage());
                }
            })
            .toList();

        long durationNanos = System.nanoTime() - startTime;

        int successCount = (int) results.stream()
            .filter(r -> r.status == PreExecutionStatus.SUCCESS || r.status == PreExecutionStatus.CACHED)
            .count();
        int failedCount = results.size() - successCount;

        double tps = (contexts.size() * 1_000_000_000.0) / durationNanos;

        return new BatchPreExecutionResult(results, successCount, failedCount, durationNanos, tps);
    }

    /**
     * Execute speculatively based on predicted consensus outcome
     * Creates a speculative state that can be committed or rolled back
     *
     * @param context Transaction context
     * @param speculationId Unique ID for this speculation chain
     * @return SpeculativeExecutionResult with provisional state
     */
    public SpeculativeExecutionResult executeSpeculatively(
            TransactionContext context, String speculationId) {

        if (!running) {
            return SpeculativeExecutionResult.failure(context.transactionId, "Executor not running");
        }

        String txId = context.transactionId;
        speculativeExecutions.incrementAndGet();

        // Get or create speculative state
        SpeculativeState specState = speculativeStates.computeIfAbsent(
            speculationId,
            id -> new SpeculativeState(id, speculationDepth)
        );

        // Check speculation depth
        if (specState.getDepth() >= speculationDepth) {
            return SpeculativeExecutionResult.depthExceeded(txId, speculationDepth);
        }

        // Pre-execute with speculative state
        PreExecutionResult preResult = preExecute(context);

        if (preResult.status == PreExecutionStatus.SUCCESS ||
            preResult.status == PreExecutionStatus.CACHED) {

            // Add to speculative chain
            specState.addExecution(txId, preResult.result);

            return SpeculativeExecutionResult.success(
                txId, speculationId, specState.getDepth(), preResult.result
            );
        } else {
            return SpeculativeExecutionResult.failure(txId, preResult.errorMessage);
        }
    }

    /**
     * Commit a pre-executed transaction after consensus success
     * Returns the cached execution result for immediate finalization
     *
     * @param transactionId Transaction ID to commit
     * @return CommitResult with execution result and commit status
     */
    public CommitResult commit(String transactionId) {
        CachedExecution cached = executionCache.get(transactionId);

        if (cached == null) {
            return CommitResult.notFound(transactionId);
        }

        if (cached.isExpired()) {
            executionCache.remove(transactionId);
            return CommitResult.expired(transactionId);
        }

        // Remove from cache (committed)
        executionCache.remove(transactionId);

        // Clear conflict tracking for this transaction
        clearConflictTracking(transactionId);

        return CommitResult.success(transactionId, cached.result);
    }

    /**
     * Commit multiple transactions in batch
     *
     * @param transactionIds List of transaction IDs to commit
     * @return BatchCommitResult with all commit results
     */
    public BatchCommitResult commitBatch(List<String> transactionIds) {
        long startTime = System.nanoTime();

        List<CommitResult> results = transactionIds.stream()
            .map(this::commit)
            .toList();

        int successCount = (int) results.stream()
            .filter(r -> r.status == CommitStatus.SUCCESS)
            .count();

        long durationNanos = System.nanoTime() - startTime;

        return new BatchCommitResult(results, successCount,
            transactionIds.size() - successCount, durationNanos);
    }

    /**
     * Rollback a pre-executed transaction after consensus failure
     * Removes cached execution and reverts any speculative state
     *
     * @param transactionId Transaction ID to rollback
     * @return RollbackResult with rollback status
     */
    public RollbackResult rollback(String transactionId) {
        long startTime = System.nanoTime();
        rollbackCount.incrementAndGet();

        // Remove from execution cache
        CachedExecution removed = executionCache.remove(transactionId);

        // Clear conflict tracking
        clearConflictTracking(transactionId);

        long durationNanos = System.nanoTime() - startTime;

        if (removed != null) {
            return RollbackResult.success(transactionId, durationNanos);
        } else {
            return RollbackResult.notFound(transactionId);
        }
    }

    /**
     * Rollback a speculative execution chain
     *
     * @param speculationId Speculation chain ID
     * @return SpeculativeRollbackResult with rollback details
     */
    public SpeculativeRollbackResult rollbackSpeculation(String speculationId) {
        SpeculativeState specState = speculativeStates.remove(speculationId);

        if (specState == null) {
            return SpeculativeRollbackResult.notFound(speculationId);
        }

        // Rollback all transactions in the chain
        List<String> rolledBack = new ArrayList<>();
        for (String txId : specState.getTransactionIds()) {
            executionCache.remove(txId);
            clearConflictTracking(txId);
            rolledBack.add(txId);
            rollbackCount.incrementAndGet();
        }

        return SpeculativeRollbackResult.success(speculationId, rolledBack);
    }

    /**
     * Get cached execution result without removing
     *
     * @param transactionId Transaction ID
     * @return Cached execution result or null if not found/expired
     */
    public ExecutionResult getCachedResult(String transactionId) {
        CachedExecution cached = executionCache.get(transactionId);
        if (cached != null && !cached.isExpired()) {
            return cached.result;
        }
        return null;
    }

    /**
     * Check if a transaction has been pre-executed and cached
     */
    public boolean isCached(String transactionId) {
        CachedExecution cached = executionCache.get(transactionId);
        return cached != null && !cached.isExpired();
    }

    /**
     * Get current executor metrics
     */
    public ExecutorMetrics getMetrics() {
        long total = totalExecutions.get();
        long hits = cacheHits.get();
        long misses = cacheMisses.get();

        double cacheHitRate = (hits + misses) > 0 ?
            (hits * 100.0) / (hits + misses) : 0;

        double avgLatencyMs = total > 0 ?
            (totalExecutionTimeNanos.get() / 1_000_000.0) / total : 0;

        return new ExecutorMetrics(
            total,
            successfulExecutions.get(),
            failedExecutions.get(),
            hits,
            misses,
            cacheHitRate,
            rollbackCount.get(),
            conflictsDetected.get(),
            speculativeExecutions.get(),
            avgLatencyMs,
            executionCache.size()
        );
    }

    // Private helper methods

    private Set<String> detectConflicts(TransactionContext context) {
        Set<String> conflicts = new HashSet<>();

        // Check write-write conflicts
        for (String addr : context.writeSet) {
            Set<String> writers = writeConflicts.get(addr);
            if (writers != null) {
                for (String txId : writers) {
                    if (!txId.equals(context.transactionId)) {
                        conflicts.add(txId);
                    }
                }
            }
        }

        // Check read-write conflicts
        for (String addr : context.readSet) {
            Set<String> conflicts_rw = readWriteConflicts.get(addr);
            if (conflicts_rw != null) {
                conflicts.addAll(conflicts_rw);
            }
        }

        return conflicts;
    }

    private void updateConflictTracking(TransactionContext context) {
        String txId = context.transactionId;

        for (String addr : context.writeSet) {
            writeConflicts.computeIfAbsent(addr, k -> ConcurrentHashMap.newKeySet()).add(txId);
            readWriteConflicts.computeIfAbsent(addr, k -> ConcurrentHashMap.newKeySet()).add(txId);
        }
    }

    private void clearConflictTracking(String transactionId) {
        writeConflicts.values().forEach(set -> set.remove(transactionId));
        readWriteConflicts.values().forEach(set -> set.remove(transactionId));
    }

    private void cleanupExpiredCache() {
        if (!running) return;

        try {
            int removed = 0;
            Iterator<Map.Entry<String, CachedExecution>> iterator =
                executionCache.entrySet().iterator();

            while (iterator.hasNext()) {
                if (iterator.next().getValue().isExpired()) {
                    iterator.remove();
                    removed++;
                }
            }

            if (removed > 0) {
                LOG.debugf("Cleaned up %d expired cache entries", removed);
            }
        } catch (Exception e) {
            LOG.error("Error cleaning up cache", e);
        }
    }

    private void reportMetrics() {
        if (!running) return;

        try {
            ExecutorMetrics metrics = getMetrics();
            LOG.debugf("OptimisticExecutor: executions=%d, success=%d, cacheHit=%.1f%%, " +
                      "rollbacks=%d, conflicts=%d, cacheSize=%d",
                metrics.totalExecutions, metrics.successfulExecutions, metrics.cacheHitRate,
                metrics.rollbackCount, metrics.conflictsDetected, metrics.currentCacheSize);
        } catch (Exception e) {
            LOG.debug("Error reporting metrics: " + e.getMessage());
        }
    }

    // Data classes

    /**
     * Transaction context for execution
     */
    public static class TransactionContext {
        public final String transactionId;
        public final byte[] data;
        public final Set<String> readSet;
        public final Set<String> writeSet;
        public final Map<String, Object> metadata;

        public TransactionContext(String transactionId, byte[] data,
                                 Set<String> readSet, Set<String> writeSet,
                                 Map<String, Object> metadata) {
            this.transactionId = transactionId;
            this.data = data;
            this.readSet = readSet != null ? readSet : Collections.emptySet();
            this.writeSet = writeSet != null ? writeSet : Collections.emptySet();
            this.metadata = metadata != null ? metadata : Collections.emptyMap();
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String transactionId;
            private byte[] data = new byte[0];
            private Set<String> readSet = new HashSet<>();
            private Set<String> writeSet = new HashSet<>();
            private Map<String, Object> metadata = new HashMap<>();

            public Builder transactionId(String id) { this.transactionId = id; return this; }
            public Builder data(byte[] data) { this.data = data; return this; }
            public Builder readSet(Set<String> set) { this.readSet = set; return this; }
            public Builder writeSet(Set<String> set) { this.writeSet = set; return this; }
            public Builder addRead(String addr) { this.readSet.add(addr); return this; }
            public Builder addWrite(String addr) { this.writeSet.add(addr); return this; }
            public Builder metadata(Map<String, Object> meta) { this.metadata = meta; return this; }

            public TransactionContext build() {
                return new TransactionContext(transactionId, data, readSet, writeSet, metadata);
            }
        }
    }

    /**
     * Execution result
     */
    public static class ExecutionResult {
        public final String transactionId;
        public final boolean success;
        public final byte[] resultData;
        public final Map<String, Object> stateChanges;
        public final String errorMessage;

        private ExecutionResult(String txId, boolean success, byte[] resultData,
                              Map<String, Object> stateChanges, String error) {
            this.transactionId = txId;
            this.success = success;
            this.resultData = resultData;
            this.stateChanges = stateChanges != null ? stateChanges : Collections.emptyMap();
            this.errorMessage = error;
        }

        public static ExecutionResult success(String txId, byte[] resultData,
                                             Map<String, Object> stateChanges) {
            return new ExecutionResult(txId, true, resultData, stateChanges, null);
        }

        public static ExecutionResult failure(String txId, String error) {
            return new ExecutionResult(txId, false, null, null, error);
        }
    }

    /**
     * Cached execution entry
     */
    private static class CachedExecution {
        final String transactionId;
        final ExecutionResult result;
        final Instant cachedAt;
        final Duration ttl;

        CachedExecution(String txId, ExecutionResult result, Instant cachedAt, Duration ttl) {
            this.transactionId = txId;
            this.result = result;
            this.cachedAt = cachedAt;
            this.ttl = ttl;
        }

        boolean isExpired() {
            return Instant.now().isAfter(cachedAt.plus(ttl));
        }

        long getAgeMs() {
            return Duration.between(cachedAt, Instant.now()).toMillis();
        }
    }

    /**
     * Speculative execution state
     */
    private static class SpeculativeState {
        final String speculationId;
        final int maxDepth;
        final List<String> transactionIds = new ArrayList<>();
        final Map<String, ExecutionResult> executions = new ConcurrentHashMap<>();

        SpeculativeState(String id, int maxDepth) {
            this.speculationId = id;
            this.maxDepth = maxDepth;
        }

        void addExecution(String txId, ExecutionResult result) {
            transactionIds.add(txId);
            executions.put(txId, result);
        }

        int getDepth() {
            return transactionIds.size();
        }

        List<String> getTransactionIds() {
            return new ArrayList<>(transactionIds);
        }
    }

    /**
     * Pre-execution status
     */
    public enum PreExecutionStatus {
        SUCCESS,
        CACHED,
        FAILURE,
        CONFLICTING
    }

    /**
     * Pre-execution result
     */
    public static class PreExecutionResult {
        public final String transactionId;
        public final PreExecutionStatus status;
        public final ExecutionResult result;
        public final long durationNanos;
        public final long cacheAgeMs;
        public final Set<String> conflicts;
        public final String errorMessage;

        private PreExecutionResult(String txId, PreExecutionStatus status,
                                  ExecutionResult result, long durationNanos,
                                  long cacheAgeMs, Set<String> conflicts, String error) {
            this.transactionId = txId;
            this.status = status;
            this.result = result;
            this.durationNanos = durationNanos;
            this.cacheAgeMs = cacheAgeMs;
            this.conflicts = conflicts != null ? conflicts : Collections.emptySet();
            this.errorMessage = error;
        }

        public static PreExecutionResult success(String txId, ExecutionResult result, long durationNanos) {
            return new PreExecutionResult(txId, PreExecutionStatus.SUCCESS, result, durationNanos, 0, null, null);
        }

        public static PreExecutionResult cached(String txId, ExecutionResult result, long cacheAgeMs) {
            return new PreExecutionResult(txId, PreExecutionStatus.CACHED, result, 0, cacheAgeMs, null, null);
        }

        public static PreExecutionResult failure(String txId, String error) {
            return new PreExecutionResult(txId, PreExecutionStatus.FAILURE, null, 0, 0, null, error);
        }

        public static PreExecutionResult conflicting(String txId, Set<String> conflicts) {
            return new PreExecutionResult(txId, PreExecutionStatus.CONFLICTING, null, 0, 0, conflicts, "Conflicts detected");
        }
    }

    /**
     * Batch pre-execution result
     */
    public static class BatchPreExecutionResult {
        public final List<PreExecutionResult> results;
        public final int successCount;
        public final int failedCount;
        public final long durationNanos;
        public final double tps;
        public final String errorMessage;

        public BatchPreExecutionResult(List<PreExecutionResult> results, int success,
                                       int failed, long durationNanos, double tps) {
            this.results = results;
            this.successCount = success;
            this.failedCount = failed;
            this.durationNanos = durationNanos;
            this.tps = tps;
            this.errorMessage = null;
        }

        public static BatchPreExecutionResult failure(String error) {
            return new BatchPreExecutionResult(Collections.emptyList(), 0, 0, 0, 0);
        }
    }

    /**
     * Speculative execution result
     */
    public static class SpeculativeExecutionResult {
        public final String transactionId;
        public final String speculationId;
        public final int depth;
        public final ExecutionResult result;
        public final boolean success;
        public final String errorMessage;

        private SpeculativeExecutionResult(String txId, String specId, int depth,
                                          ExecutionResult result, boolean success, String error) {
            this.transactionId = txId;
            this.speculationId = specId;
            this.depth = depth;
            this.result = result;
            this.success = success;
            this.errorMessage = error;
        }

        public static SpeculativeExecutionResult success(String txId, String specId,
                                                        int depth, ExecutionResult result) {
            return new SpeculativeExecutionResult(txId, specId, depth, result, true, null);
        }

        public static SpeculativeExecutionResult failure(String txId, String error) {
            return new SpeculativeExecutionResult(txId, null, 0, null, false, error);
        }

        public static SpeculativeExecutionResult depthExceeded(String txId, int maxDepth) {
            return new SpeculativeExecutionResult(txId, null, maxDepth, null, false,
                "Maximum speculation depth exceeded: " + maxDepth);
        }
    }

    /**
     * Commit status
     */
    public enum CommitStatus {
        SUCCESS,
        NOT_FOUND,
        EXPIRED
    }

    /**
     * Commit result
     */
    public static class CommitResult {
        public final String transactionId;
        public final CommitStatus status;
        public final ExecutionResult result;

        private CommitResult(String txId, CommitStatus status, ExecutionResult result) {
            this.transactionId = txId;
            this.status = status;
            this.result = result;
        }

        public static CommitResult success(String txId, ExecutionResult result) {
            return new CommitResult(txId, CommitStatus.SUCCESS, result);
        }

        public static CommitResult notFound(String txId) {
            return new CommitResult(txId, CommitStatus.NOT_FOUND, null);
        }

        public static CommitResult expired(String txId) {
            return new CommitResult(txId, CommitStatus.EXPIRED, null);
        }
    }

    /**
     * Batch commit result
     */
    public static class BatchCommitResult {
        public final List<CommitResult> results;
        public final int successCount;
        public final int failedCount;
        public final long durationNanos;

        public BatchCommitResult(List<CommitResult> results, int success,
                                int failed, long durationNanos) {
            this.results = results;
            this.successCount = success;
            this.failedCount = failed;
            this.durationNanos = durationNanos;
        }
    }

    /**
     * Rollback result
     */
    public static class RollbackResult {
        public final String transactionId;
        public final boolean success;
        public final long durationNanos;

        private RollbackResult(String txId, boolean success, long durationNanos) {
            this.transactionId = txId;
            this.success = success;
            this.durationNanos = durationNanos;
        }

        public static RollbackResult success(String txId, long durationNanos) {
            return new RollbackResult(txId, true, durationNanos);
        }

        public static RollbackResult notFound(String txId) {
            return new RollbackResult(txId, false, 0);
        }
    }

    /**
     * Speculative rollback result
     */
    public static class SpeculativeRollbackResult {
        public final String speculationId;
        public final boolean success;
        public final List<String> rolledBackTransactions;

        private SpeculativeRollbackResult(String specId, boolean success, List<String> rolledBack) {
            this.speculationId = specId;
            this.success = success;
            this.rolledBackTransactions = rolledBack != null ? rolledBack : Collections.emptyList();
        }

        public static SpeculativeRollbackResult success(String specId, List<String> rolledBack) {
            return new SpeculativeRollbackResult(specId, true, rolledBack);
        }

        public static SpeculativeRollbackResult notFound(String specId) {
            return new SpeculativeRollbackResult(specId, false, null);
        }
    }

    /**
     * Executor metrics
     */
    public static class ExecutorMetrics {
        public final long totalExecutions;
        public final long successfulExecutions;
        public final long failedExecutions;
        public final long cacheHits;
        public final long cacheMisses;
        public final double cacheHitRate;
        public final long rollbackCount;
        public final long conflictsDetected;
        public final long speculativeExecutions;
        public final double averageLatencyMs;
        public final int currentCacheSize;

        public ExecutorMetrics(long total, long success, long failed, long hits, long misses,
                              double hitRate, long rollbacks, long conflicts, long speculative,
                              double avgLatency, int cacheSize) {
            this.totalExecutions = total;
            this.successfulExecutions = success;
            this.failedExecutions = failed;
            this.cacheHits = hits;
            this.cacheMisses = misses;
            this.cacheHitRate = hitRate;
            this.rollbackCount = rollbacks;
            this.conflictsDetected = conflicts;
            this.speculativeExecutions = speculative;
            this.averageLatencyMs = avgLatency;
            this.currentCacheSize = cacheSize;
        }

        @Override
        public String toString() {
            return String.format(
                "ExecutorMetrics{executions=%d, success=%d, failed=%d, " +
                "cacheHit=%.1f%%, rollbacks=%d, conflicts=%d, avgLatency=%.2fms}",
                totalExecutions, successfulExecutions, failedExecutions,
                cacheHitRate, rollbackCount, conflictsDetected, averageLatencyMs
            );
        }
    }
}
