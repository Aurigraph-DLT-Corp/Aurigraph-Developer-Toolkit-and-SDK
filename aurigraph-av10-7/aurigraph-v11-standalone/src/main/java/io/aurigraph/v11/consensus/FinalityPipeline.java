package io.aurigraph.v11.consensus;

import io.aurigraph.v11.consensus.dag.DAGNode;
import io.aurigraph.v11.consensus.dag.DAGTransactionGraph;
import io.aurigraph.v11.crypto.ParallelSignatureVerifier;
import io.aurigraph.v11.execution.OptimisticExecutor;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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
import java.util.function.Consumer;

/**
 * Finality Pipeline for High-Performance Transaction Processing
 * Sprint 5: Performance Optimization - Finality Pipeline Optimization
 *
 * Implements pipelined finality processing with:
 * - Parallel block proposal and validation
 * - Async commit with immediate acknowledgment
 * - Staged pipeline: Validation -> Ordering -> Execution -> Finality
 * - Virtual thread-based concurrent processing
 *
 * Performance Targets:
 * - 5M+ TPS throughput
 * - <100ms finality latency (P99)
 * - <50ms average finality latency
 *
 * Pipeline Stages:
 * 1. VALIDATION: Signature verification, basic validation
 * 2. ORDERING: DAG insertion, topological ordering
 * 3. EXECUTION: Optimistic pre-execution, state changes
 * 4. FINALITY: Consensus confirmation, state commit
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
@ApplicationScoped
public class FinalityPipeline {

    private static final Logger LOG = Logger.getLogger(FinalityPipeline.class);

    // Configuration
    @ConfigProperty(name = "finality.pipeline.stages", defaultValue = "4")
    int pipelineStages;

    @ConfigProperty(name = "finality.pipeline.batch.size", defaultValue = "1000")
    int batchSize;

    @ConfigProperty(name = "finality.target.latency.ms", defaultValue = "100")
    long targetLatencyMs;

    @ConfigProperty(name = "finality.parallel.batches", defaultValue = "10")
    int parallelBatches;

    @ConfigProperty(name = "finality.confirmation.threshold", defaultValue = "0.67")
    double confirmationThreshold;

    @ConfigProperty(name = "finality.pipeline.timeout.ms", defaultValue = "5000")
    long pipelineTimeoutMs;

    // Injected services
    @Inject
    ParallelSignatureVerifier signatureVerifier;

    @Inject
    DAGTransactionGraph dagGraph;

    @Inject
    OptimisticExecutor optimisticExecutor;

    // Pipeline stages
    private BlockingQueue<PipelineItem> validationQueue;
    private BlockingQueue<PipelineItem> orderingQueue;
    private BlockingQueue<PipelineItem> executionQueue;
    private BlockingQueue<PipelineItem> finalityQueue;

    // Completed transactions
    private ConcurrentHashMap<String, FinalizedTransaction> finalizedTransactions;

    // Pending acknowledgments
    private ConcurrentHashMap<String, CompletableFuture<FinalityResult>> pendingAcks;

    // Finality callbacks
    private List<Consumer<FinalizedTransaction>> finalityCallbacks;

    // Execution services
    private ExecutorService pipelineExecutor;
    private ScheduledExecutorService monitorExecutor;
    private volatile boolean running = false;

    // Metrics
    private final AtomicLong totalReceived = new AtomicLong(0);
    private final AtomicLong totalFinalized = new AtomicLong(0);
    private final AtomicLong totalFailed = new AtomicLong(0);
    private final AtomicLong totalValidationTimeNanos = new AtomicLong(0);
    private final AtomicLong totalOrderingTimeNanos = new AtomicLong(0);
    private final AtomicLong totalExecutionTimeNanos = new AtomicLong(0);
    private final AtomicLong totalFinalityTimeNanos = new AtomicLong(0);
    private final AtomicLong totalEndToEndTimeNanos = new AtomicLong(0);

    // Latency tracking
    private final AtomicReference<LatencyHistogram> latencyHistogram =
        new AtomicReference<>(new LatencyHistogram());

    @PostConstruct
    public void initialize() {
        // Initialize queues with capacity for parallel processing
        int queueCapacity = batchSize * parallelBatches * 2;
        validationQueue = new LinkedBlockingQueue<>(queueCapacity);
        orderingQueue = new LinkedBlockingQueue<>(queueCapacity);
        executionQueue = new LinkedBlockingQueue<>(queueCapacity);
        finalityQueue = new LinkedBlockingQueue<>(queueCapacity);

        // Initialize storage
        finalizedTransactions = new ConcurrentHashMap<>();
        pendingAcks = new ConcurrentHashMap<>();
        finalityCallbacks = new CopyOnWriteArrayList<>();

        // Initialize pipeline executor with virtual threads
        pipelineExecutor = Executors.newVirtualThreadPerTaskExecutor();

        // Initialize monitor executor
        monitorExecutor = Executors.newScheduledThreadPool(2,
            Thread.ofVirtual().name("finality-monitor-", 0).factory());

        running = true;

        // Start pipeline stage workers
        startPipelineWorkers();

        // Start metrics collection
        monitorExecutor.scheduleAtFixedRate(
            this::collectMetrics, 1, 1, TimeUnit.SECONDS);

        // Start latency histogram update
        monitorExecutor.scheduleAtFixedRate(
            this::updateLatencyHistogram, 5, 5, TimeUnit.SECONDS);

        LOG.infof("FinalityPipeline initialized: stages=%d, batch=%d, targetLatency=%dms",
            pipelineStages, batchSize, targetLatencyMs);
    }

    @PreDestroy
    public void shutdown() {
        running = false;

        pipelineExecutor.shutdown();
        monitorExecutor.shutdown();

        try {
            if (!pipelineExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                pipelineExecutor.shutdownNow();
            }
            if (!monitorExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                monitorExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            pipelineExecutor.shutdownNow();
            monitorExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        // Fail all pending acknowledgments
        pendingAcks.values().forEach(future ->
            future.complete(FinalityResult.failure("Pipeline shutdown")));

        LOG.info("FinalityPipeline shutdown complete");
    }

    /**
     * Submit a transaction to the finality pipeline
     * Returns immediately with a future for the finality result
     *
     * @param transaction Transaction to finalize
     * @return CompletableFuture that completes when transaction is finalized
     */
    public CompletableFuture<FinalityResult> submit(TransactionData transaction) {
        if (!running) {
            return CompletableFuture.completedFuture(
                FinalityResult.failure("Pipeline not running"));
        }

        totalReceived.incrementAndGet();
        String txId = transaction.transactionId;

        // Create pending acknowledgment
        CompletableFuture<FinalityResult> resultFuture = new CompletableFuture<>();
        pendingAcks.put(txId, resultFuture);

        // Create pipeline item
        PipelineItem item = new PipelineItem(
            transaction,
            PipelineStage.VALIDATION,
            Instant.now()
        );

        // Submit to validation stage
        try {
            boolean offered = validationQueue.offer(item, 1, TimeUnit.SECONDS);
            if (!offered) {
                pendingAcks.remove(txId);
                return CompletableFuture.completedFuture(
                    FinalityResult.failure("Validation queue full"));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            pendingAcks.remove(txId);
            return CompletableFuture.completedFuture(
                FinalityResult.failure("Interrupted"));
        }

        // Set timeout
        CompletableFuture.delayedExecutor(pipelineTimeoutMs, TimeUnit.MILLISECONDS)
            .execute(() -> {
                CompletableFuture<FinalityResult> pending = pendingAcks.remove(txId);
                if (pending != null && !pending.isDone()) {
                    pending.complete(FinalityResult.timeout(txId, pipelineTimeoutMs));
                }
            });

        return resultFuture;
    }

    /**
     * Submit a batch of transactions
     *
     * @param transactions List of transactions
     * @return BatchFinalityResult with individual futures
     */
    public BatchFinalityResult submitBatch(List<TransactionData> transactions) {
        long startTime = System.nanoTime();

        List<CompletableFuture<FinalityResult>> futures = transactions.stream()
            .map(this::submit)
            .toList();

        // Wait for all to complete with timeout
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            futures.toArray(new CompletableFuture[0]));

        List<FinalityResult> results;
        try {
            allFutures.get(pipelineTimeoutMs * 2, TimeUnit.MILLISECONDS);
            results = futures.stream()
                .map(CompletableFuture::join)
                .toList();
        } catch (Exception e) {
            results = futures.stream()
                .map(f -> f.getNow(FinalityResult.failure("Batch timeout")))
                .toList();
        }

        long durationNanos = System.nanoTime() - startTime;
        int successCount = (int) results.stream().filter(r -> r.success).count();
        double tps = (transactions.size() * 1_000_000_000.0) / durationNanos;
        double avgLatencyMs = (durationNanos / 1_000_000.0) / transactions.size();

        return new BatchFinalityResult(
            results, successCount, transactions.size() - successCount,
            durationNanos, tps, avgLatencyMs
        );
    }

    /**
     * Register a callback for finality notifications
     *
     * @param callback Consumer called when transactions are finalized
     */
    public void onFinality(Consumer<FinalizedTransaction> callback) {
        finalityCallbacks.add(callback);
    }

    /**
     * Get a finalized transaction by ID
     */
    public FinalizedTransaction getFinalizedTransaction(String transactionId) {
        return finalizedTransactions.get(transactionId);
    }

    /**
     * Check if a transaction is finalized
     */
    public boolean isFinalized(String transactionId) {
        return finalizedTransactions.containsKey(transactionId);
    }

    /**
     * Get pipeline metrics
     */
    public PipelineMetrics getMetrics() {
        long received = totalReceived.get();
        long finalized = totalFinalized.get();
        long failed = totalFailed.get();

        double avgValidationMs = finalized > 0 ?
            (totalValidationTimeNanos.get() / 1_000_000.0) / finalized : 0;
        double avgOrderingMs = finalized > 0 ?
            (totalOrderingTimeNanos.get() / 1_000_000.0) / finalized : 0;
        double avgExecutionMs = finalized > 0 ?
            (totalExecutionTimeNanos.get() / 1_000_000.0) / finalized : 0;
        double avgFinalityMs = finalized > 0 ?
            (totalFinalityTimeNanos.get() / 1_000_000.0) / finalized : 0;
        double avgEndToEndMs = finalized > 0 ?
            (totalEndToEndTimeNanos.get() / 1_000_000.0) / finalized : 0;

        LatencyHistogram histogram = latencyHistogram.get();

        return new PipelineMetrics(
            received, finalized, failed,
            validationQueue.size(), orderingQueue.size(),
            executionQueue.size(), finalityQueue.size(),
            avgValidationMs, avgOrderingMs, avgExecutionMs, avgFinalityMs,
            avgEndToEndMs, histogram.getP50(), histogram.getP95(),
            histogram.getP99(), histogram.getP999(),
            calculateThroughput()
        );
    }

    // Private pipeline implementation

    private void startPipelineWorkers() {
        // Start multiple workers per stage for parallel processing
        int workersPerStage = Math.max(4, Runtime.getRuntime().availableProcessors());

        for (int i = 0; i < workersPerStage; i++) {
            pipelineExecutor.submit(this::validationWorker);
            pipelineExecutor.submit(this::orderingWorker);
            pipelineExecutor.submit(this::executionWorker);
            pipelineExecutor.submit(this::finalityWorker);
        }

        LOG.infof("Started %d workers per pipeline stage", workersPerStage);
    }

    private void validationWorker() {
        while (running) {
            try {
                // Process in batches for efficiency
                List<PipelineItem> batch = new ArrayList<>(batchSize);
                PipelineItem first = validationQueue.poll(100, TimeUnit.MILLISECONDS);

                if (first == null) continue;

                batch.add(first);
                validationQueue.drainTo(batch, batchSize - 1);

                // Process batch
                for (PipelineItem item : batch) {
                    processValidation(item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.error("Error in validation worker", e);
            }
        }
    }

    private void orderingWorker() {
        while (running) {
            try {
                List<PipelineItem> batch = new ArrayList<>(batchSize);
                PipelineItem first = orderingQueue.poll(100, TimeUnit.MILLISECONDS);

                if (first == null) continue;

                batch.add(first);
                orderingQueue.drainTo(batch, batchSize - 1);

                for (PipelineItem item : batch) {
                    processOrdering(item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.error("Error in ordering worker", e);
            }
        }
    }

    private void executionWorker() {
        while (running) {
            try {
                List<PipelineItem> batch = new ArrayList<>(batchSize);
                PipelineItem first = executionQueue.poll(100, TimeUnit.MILLISECONDS);

                if (first == null) continue;

                batch.add(first);
                executionQueue.drainTo(batch, batchSize - 1);

                for (PipelineItem item : batch) {
                    processExecution(item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.error("Error in execution worker", e);
            }
        }
    }

    private void finalityWorker() {
        while (running) {
            try {
                List<PipelineItem> batch = new ArrayList<>(batchSize);
                PipelineItem first = finalityQueue.poll(100, TimeUnit.MILLISECONDS);

                if (first == null) continue;

                batch.add(first);
                finalityQueue.drainTo(batch, batchSize - 1);

                for (PipelineItem item : batch) {
                    processFinality(item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.error("Error in finality worker", e);
            }
        }
    }

    private void processValidation(PipelineItem item) {
        long startTime = System.nanoTime();
        String txId = item.transaction.transactionId;

        try {
            // Perform signature verification if signature verifier available
            boolean valid = true;
            if (signatureVerifier != null && item.transaction.signature != null) {
                var request = ParallelSignatureVerifier.VerificationRequest.builder()
                    .transactionId(txId)
                    .algorithm(item.transaction.signatureAlgorithm)
                    .data(item.transaction.data)
                    .signature(item.transaction.signature)
                    .publicKey(item.transaction.publicKey)
                    .build();

                var result = signatureVerifier.verify(request);
                valid = result.valid;
            }

            long durationNanos = System.nanoTime() - startTime;
            item.validationTimeNanos = durationNanos;
            totalValidationTimeNanos.addAndGet(durationNanos);

            if (valid) {
                item.stage = PipelineStage.ORDERING;
                orderingQueue.offer(item);
            } else {
                failTransaction(item, "Signature verification failed");
            }
        } catch (Exception e) {
            failTransaction(item, "Validation error: " + e.getMessage());
        }
    }

    private void processOrdering(PipelineItem item) {
        long startTime = System.nanoTime();
        String txId = item.transaction.transactionId;

        try {
            // Add to DAG for ordering
            if (dagGraph != null) {
                DAGNode node = DAGNode.builder()
                    .transactionId(txId)
                    .transactionData(item.transaction.data)
                    .sender(item.transaction.sender)
                    .nonce(item.transaction.nonce)
                    .readSet(item.transaction.readSet)
                    .writeSet(item.transaction.writeSet)
                    .build();

                DAGTransactionGraph.AddResult result = dagGraph.addNode(node);
                if (!result.success) {
                    failTransaction(item, "DAG ordering failed: " + result.errorMessage);
                    return;
                }

                item.dagNode = node;
                item.conflicts = result.conflictingTransactions;
            }

            long durationNanos = System.nanoTime() - startTime;
            item.orderingTimeNanos = durationNanos;
            totalOrderingTimeNanos.addAndGet(durationNanos);

            item.stage = PipelineStage.EXECUTION;
            executionQueue.offer(item);

        } catch (Exception e) {
            failTransaction(item, "Ordering error: " + e.getMessage());
        }
    }

    private void processExecution(PipelineItem item) {
        long startTime = System.nanoTime();
        String txId = item.transaction.transactionId;

        try {
            // Pre-execute using optimistic executor
            if (optimisticExecutor != null) {
                var context = OptimisticExecutor.TransactionContext.builder()
                    .transactionId(txId)
                    .data(item.transaction.data)
                    .readSet(item.transaction.readSet)
                    .writeSet(item.transaction.writeSet)
                    .build();

                var result = optimisticExecutor.preExecute(context);

                if (result.status == OptimisticExecutor.PreExecutionStatus.FAILURE) {
                    failTransaction(item, "Execution failed: " + result.errorMessage);
                    return;
                }

                item.executionResult = result.result;
            }

            long durationNanos = System.nanoTime() - startTime;
            item.executionTimeNanos = durationNanos;
            totalExecutionTimeNanos.addAndGet(durationNanos);

            item.stage = PipelineStage.FINALITY;
            finalityQueue.offer(item);

        } catch (Exception e) {
            failTransaction(item, "Execution error: " + e.getMessage());
        }
    }

    private void processFinality(PipelineItem item) {
        long startTime = System.nanoTime();
        String txId = item.transaction.transactionId;

        try {
            // Simulate consensus confirmation
            // In production, this would involve actual consensus protocol
            boolean confirmed = simulateConsensusConfirmation(item);

            if (!confirmed) {
                failTransaction(item, "Consensus not reached");
                return;
            }

            // Commit the execution
            if (optimisticExecutor != null) {
                optimisticExecutor.commit(txId);
            }

            // Finalize in DAG
            if (dagGraph != null && item.dagNode != null) {
                dagGraph.finalizeNode(txId);
            }

            long durationNanos = System.nanoTime() - startTime;
            item.finalityTimeNanos = durationNanos;
            totalFinalityTimeNanos.addAndGet(durationNanos);

            // Calculate total latency
            long endToEndNanos = Duration.between(item.submittedAt, Instant.now()).toNanos();
            totalEndToEndTimeNanos.addAndGet(endToEndNanos);

            // Create finalized transaction
            FinalizedTransaction finalized = new FinalizedTransaction(
                txId,
                item.transaction,
                item.executionResult,
                item.submittedAt,
                Instant.now(),
                endToEndNanos,
                item.validationTimeNanos,
                item.orderingTimeNanos,
                item.executionTimeNanos,
                item.finalityTimeNanos
            );

            // Store finalized transaction
            finalizedTransactions.put(txId, finalized);
            totalFinalized.incrementAndGet();

            // Record latency
            latencyHistogram.get().record(endToEndNanos / 1_000_000.0);

            // Complete the pending acknowledgment
            CompletableFuture<FinalityResult> pending = pendingAcks.remove(txId);
            if (pending != null) {
                pending.complete(FinalityResult.success(finalized));
            }

            // Notify callbacks
            for (Consumer<FinalizedTransaction> callback : finalityCallbacks) {
                try {
                    callback.accept(finalized);
                } catch (Exception e) {
                    LOG.warn("Finality callback error: " + e.getMessage());
                }
            }

            LOG.debugf("Finalized %s in %.2fms (validation=%.2fms, ordering=%.2fms, " +
                      "execution=%.2fms, finality=%.2fms)",
                txId, endToEndNanos / 1_000_000.0,
                item.validationTimeNanos / 1_000_000.0,
                item.orderingTimeNanos / 1_000_000.0,
                item.executionTimeNanos / 1_000_000.0,
                item.finalityTimeNanos / 1_000_000.0);

        } catch (Exception e) {
            failTransaction(item, "Finality error: " + e.getMessage());
        }
    }

    private boolean simulateConsensusConfirmation(PipelineItem item) {
        // In production, this would:
        // 1. Broadcast to validators
        // 2. Collect votes
        // 3. Check if threshold reached
        // For now, simulate with high success rate
        return ThreadLocalRandom.current().nextDouble() < 0.999;
    }

    private void failTransaction(PipelineItem item, String reason) {
        totalFailed.incrementAndGet();
        String txId = item.transaction.transactionId;

        // Rollback if needed
        if (optimisticExecutor != null) {
            optimisticExecutor.rollback(txId);
        }

        // Complete pending acknowledgment with failure
        CompletableFuture<FinalityResult> pending = pendingAcks.remove(txId);
        if (pending != null) {
            pending.complete(FinalityResult.failure(reason));
        }

        LOG.debugf("Transaction %s failed at %s: %s", txId, item.stage, reason);
    }

    private double calculateThroughput() {
        // Calculate TPS based on recent finalizations
        // This is a simplified calculation
        return totalFinalized.get() > 0 ?
            totalFinalized.get() / (System.currentTimeMillis() / 1000.0) : 0;
    }

    private void collectMetrics() {
        // Metrics collection task
        PipelineMetrics metrics = getMetrics();
        LOG.debugf("Pipeline: finalized=%d, failed=%d, avgLatency=%.2fms, P99=%.2fms, tps=%.0f",
            metrics.totalFinalized, metrics.totalFailed, metrics.avgEndToEndMs,
            metrics.latencyP99, metrics.throughput);
    }

    private void updateLatencyHistogram() {
        // Reset histogram periodically for fresh percentile calculations
        latencyHistogram.set(new LatencyHistogram());
    }

    // Data classes

    /**
     * Pipeline stages
     */
    public enum PipelineStage {
        VALIDATION,
        ORDERING,
        EXECUTION,
        FINALITY,
        COMPLETED,
        FAILED
    }

    /**
     * Transaction data for pipeline
     */
    public static class TransactionData {
        public final String transactionId;
        public final String sender;
        public final long nonce;
        public final byte[] data;
        public final byte[] signature;
        public final java.security.PublicKey publicKey;
        public final ParallelSignatureVerifier.SignatureAlgorithm signatureAlgorithm;
        public final Set<String> readSet;
        public final Set<String> writeSet;
        public final Map<String, Object> metadata;

        public TransactionData(String transactionId, String sender, long nonce,
                              byte[] data, byte[] signature, java.security.PublicKey publicKey,
                              ParallelSignatureVerifier.SignatureAlgorithm sigAlgo,
                              Set<String> readSet, Set<String> writeSet,
                              Map<String, Object> metadata) {
            this.transactionId = transactionId;
            this.sender = sender;
            this.nonce = nonce;
            this.data = data;
            this.signature = signature;
            this.publicKey = publicKey;
            this.signatureAlgorithm = sigAlgo;
            this.readSet = readSet != null ? readSet : Collections.emptySet();
            this.writeSet = writeSet != null ? writeSet : Collections.emptySet();
            this.metadata = metadata != null ? metadata : Collections.emptyMap();
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String transactionId;
            private String sender;
            private long nonce;
            private byte[] data = new byte[0];
            private byte[] signature;
            private java.security.PublicKey publicKey;
            private ParallelSignatureVerifier.SignatureAlgorithm signatureAlgorithm;
            private Set<String> readSet = new HashSet<>();
            private Set<String> writeSet = new HashSet<>();
            private Map<String, Object> metadata = new HashMap<>();

            public Builder transactionId(String id) { this.transactionId = id; return this; }
            public Builder sender(String sender) { this.sender = sender; return this; }
            public Builder nonce(long nonce) { this.nonce = nonce; return this; }
            public Builder data(byte[] data) { this.data = data; return this; }
            public Builder signature(byte[] sig) { this.signature = sig; return this; }
            public Builder publicKey(java.security.PublicKey key) { this.publicKey = key; return this; }
            public Builder signatureAlgorithm(ParallelSignatureVerifier.SignatureAlgorithm algo) {
                this.signatureAlgorithm = algo; return this;
            }
            public Builder readSet(Set<String> set) { this.readSet = set; return this; }
            public Builder writeSet(Set<String> set) { this.writeSet = set; return this; }
            public Builder addRead(String addr) { this.readSet.add(addr); return this; }
            public Builder addWrite(String addr) { this.writeSet.add(addr); return this; }
            public Builder metadata(Map<String, Object> meta) { this.metadata = meta; return this; }

            public TransactionData build() {
                return new TransactionData(transactionId, sender, nonce, data, signature,
                    publicKey, signatureAlgorithm, readSet, writeSet, metadata);
            }
        }
    }

    /**
     * Pipeline item tracking a transaction through stages
     */
    private static class PipelineItem {
        final TransactionData transaction;
        final Instant submittedAt;
        PipelineStage stage;
        long validationTimeNanos;
        long orderingTimeNanos;
        long executionTimeNanos;
        long finalityTimeNanos;
        DAGNode dagNode;
        Set<String> conflicts;
        OptimisticExecutor.ExecutionResult executionResult;

        PipelineItem(TransactionData transaction, PipelineStage stage, Instant submittedAt) {
            this.transaction = transaction;
            this.stage = stage;
            this.submittedAt = submittedAt;
        }
    }

    /**
     * Finalized transaction with timing details
     */
    public static class FinalizedTransaction {
        public final String transactionId;
        public final TransactionData transaction;
        public final OptimisticExecutor.ExecutionResult executionResult;
        public final Instant submittedAt;
        public final Instant finalizedAt;
        public final long endToEndNanos;
        public final long validationNanos;
        public final long orderingNanos;
        public final long executionNanos;
        public final long finalityNanos;

        public FinalizedTransaction(String txId, TransactionData tx,
                                   OptimisticExecutor.ExecutionResult result,
                                   Instant submitted, Instant finalized,
                                   long e2e, long validation, long ordering,
                                   long execution, long finality) {
            this.transactionId = txId;
            this.transaction = tx;
            this.executionResult = result;
            this.submittedAt = submitted;
            this.finalizedAt = finalized;
            this.endToEndNanos = e2e;
            this.validationNanos = validation;
            this.orderingNanos = ordering;
            this.executionNanos = execution;
            this.finalityNanos = finality;
        }

        public double getEndToEndMs() {
            return endToEndNanos / 1_000_000.0;
        }
    }

    /**
     * Finality result
     */
    public static class FinalityResult {
        public final boolean success;
        public final String transactionId;
        public final FinalizedTransaction finalizedTransaction;
        public final String errorMessage;
        public final boolean timeout;

        private FinalityResult(boolean success, String txId, FinalizedTransaction finalized,
                              String error, boolean timeout) {
            this.success = success;
            this.transactionId = txId;
            this.finalizedTransaction = finalized;
            this.errorMessage = error;
            this.timeout = timeout;
        }

        public static FinalityResult success(FinalizedTransaction finalized) {
            return new FinalityResult(true, finalized.transactionId, finalized, null, false);
        }

        public static FinalityResult failure(String error) {
            return new FinalityResult(false, null, null, error, false);
        }

        public static FinalityResult timeout(String txId, long timeoutMs) {
            return new FinalityResult(false, txId, null,
                "Timeout after " + timeoutMs + "ms", true);
        }
    }

    /**
     * Batch finality result
     */
    public static class BatchFinalityResult {
        public final List<FinalityResult> results;
        public final int successCount;
        public final int failedCount;
        public final long durationNanos;
        public final double tps;
        public final double avgLatencyMs;

        public BatchFinalityResult(List<FinalityResult> results, int success,
                                  int failed, long duration, double tps, double avgLatency) {
            this.results = results;
            this.successCount = success;
            this.failedCount = failed;
            this.durationNanos = duration;
            this.tps = tps;
            this.avgLatencyMs = avgLatency;
        }

        public double getDurationMs() {
            return durationNanos / 1_000_000.0;
        }
    }

    /**
     * Latency histogram for percentile calculations
     */
    private static class LatencyHistogram {
        private final List<Double> samples = new CopyOnWriteArrayList<>();

        void record(double latencyMs) {
            samples.add(latencyMs);
        }

        double getP50() { return getPercentile(50); }
        double getP95() { return getPercentile(95); }
        double getP99() { return getPercentile(99); }
        double getP999() { return getPercentile(99.9); }

        private double getPercentile(double percentile) {
            if (samples.isEmpty()) return 0;

            List<Double> sorted = new ArrayList<>(samples);
            Collections.sort(sorted);

            int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
            index = Math.max(0, Math.min(index, sorted.size() - 1));
            return sorted.get(index);
        }
    }

    /**
     * Pipeline metrics
     */
    public static class PipelineMetrics {
        public final long totalReceived;
        public final long totalFinalized;
        public final long totalFailed;
        public final int validationQueueSize;
        public final int orderingQueueSize;
        public final int executionQueueSize;
        public final int finalityQueueSize;
        public final double avgValidationMs;
        public final double avgOrderingMs;
        public final double avgExecutionMs;
        public final double avgFinalityMs;
        public final double avgEndToEndMs;
        public final double latencyP50;
        public final double latencyP95;
        public final double latencyP99;
        public final double latencyP999;
        public final double throughput;

        public PipelineMetrics(long received, long finalized, long failed,
                              int valQueue, int ordQueue, int execQueue, int finQueue,
                              double avgVal, double avgOrd, double avgExec, double avgFin,
                              double avgE2E, double p50, double p95, double p99, double p999,
                              double tps) {
            this.totalReceived = received;
            this.totalFinalized = finalized;
            this.totalFailed = failed;
            this.validationQueueSize = valQueue;
            this.orderingQueueSize = ordQueue;
            this.executionQueueSize = execQueue;
            this.finalityQueueSize = finQueue;
            this.avgValidationMs = avgVal;
            this.avgOrderingMs = avgOrd;
            this.avgExecutionMs = avgExec;
            this.avgFinalityMs = avgFin;
            this.avgEndToEndMs = avgE2E;
            this.latencyP50 = p50;
            this.latencyP95 = p95;
            this.latencyP99 = p99;
            this.latencyP999 = p999;
            this.throughput = tps;
        }

        public boolean meetsTarget(long targetLatencyMs) {
            return latencyP99 < targetLatencyMs;
        }

        @Override
        public String toString() {
            return String.format(
                "PipelineMetrics{finalized=%d, failed=%d, avgLatency=%.2fms, " +
                "P50=%.2fms, P99=%.2fms, P99.9=%.2fms, tps=%.0f}",
                totalFinalized, totalFailed, avgEndToEndMs,
                latencyP50, latencyP99, latencyP999, throughput
            );
        }
    }
}
