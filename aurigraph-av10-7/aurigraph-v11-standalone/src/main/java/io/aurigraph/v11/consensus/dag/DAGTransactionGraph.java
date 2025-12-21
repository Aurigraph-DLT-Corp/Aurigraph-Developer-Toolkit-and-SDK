package io.aurigraph.v11.consensus.dag;

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
import java.util.stream.Collectors;

/**
 * DAG-Based Transaction Ordering Graph
 * Sprint 5: Performance Optimization - DAG-Based Transaction Ordering
 *
 * Implements a Directed Acyclic Graph for transaction ordering with:
 * - Parallel transaction validation when no conflicts
 * - Topological sorting for final ordering
 * - Conflict detection between transactions
 * - High-performance concurrent operations
 *
 * Performance Targets:
 * - 5M+ TPS throughput
 * - <100ms finality latency
 * - <10ms conflict detection
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
@ApplicationScoped
public class DAGTransactionGraph {

    private static final Logger LOG = Logger.getLogger(DAGTransactionGraph.class);

    // Configuration
    @ConfigProperty(name = "dag.finality.weight.threshold", defaultValue = "100")
    long finalityWeightThreshold;

    @ConfigProperty(name = "dag.max.depth", defaultValue = "1000")
    int maxDepth;

    @ConfigProperty(name = "dag.parallel.validation.threads", defaultValue = "0")
    int parallelValidationThreads; // 0 = use virtual threads

    @ConfigProperty(name = "dag.prune.interval.seconds", defaultValue = "60")
    int pruneIntervalSeconds;

    @ConfigProperty(name = "dag.max.pending.nodes", defaultValue = "1000000")
    int maxPendingNodes;

    // Node storage
    private final ConcurrentHashMap<String, DAGNode> nodes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DAGNode> pendingNodes = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DAGNode> finalizedNodes = new ConcurrentHashMap<>();

    // Address index for conflict detection
    private final ConcurrentHashMap<String, Set<String>> writeAddressIndex = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<String>> readAddressIndex = new ConcurrentHashMap<>();

    // Tips (nodes with no children)
    private final Set<String> tips = ConcurrentHashMap.newKeySet();

    // Roots (nodes with no parents)
    private final Set<String> roots = ConcurrentHashMap.newKeySet();

    // Execution services
    private ExecutorService validationExecutor;
    private ScheduledExecutorService maintenanceExecutor;

    // Metrics
    private final AtomicLong totalNodesAdded = new AtomicLong(0);
    private final AtomicLong totalNodesFinalized = new AtomicLong(0);
    private final AtomicLong totalConflictsDetected = new AtomicLong(0);
    private final AtomicLong totalParallelValidations = new AtomicLong(0);
    private final AtomicReference<Instant> lastFinalityTimestamp = new AtomicReference<>(Instant.now());
    private volatile double averageFinalityMs = 0.0;

    // State
    private volatile boolean running = false;

    @PostConstruct
    public void initialize() {
        // Initialize validation executor
        if (parallelValidationThreads <= 0) {
            validationExecutor = Executors.newVirtualThreadPerTaskExecutor();
            LOG.info("DAG validation using virtual threads");
        } else {
            validationExecutor = Executors.newFixedThreadPool(parallelValidationThreads,
                Thread.ofVirtual().name("dag-validator-", 0).factory());
            LOG.infof("DAG validation using %d virtual threads", parallelValidationThreads);
        }

        // Initialize maintenance executor
        maintenanceExecutor = Executors.newScheduledThreadPool(2,
            Thread.ofVirtual().name("dag-maintenance-", 0).factory());

        // Schedule periodic pruning
        maintenanceExecutor.scheduleAtFixedRate(
            this::pruneOldNodes,
            pruneIntervalSeconds,
            pruneIntervalSeconds,
            TimeUnit.SECONDS
        );

        // Schedule metrics reporting
        maintenanceExecutor.scheduleAtFixedRate(
            this::reportMetrics,
            10, 10, TimeUnit.SECONDS
        );

        running = true;
        LOG.infof("DAGTransactionGraph initialized with finality threshold=%d, maxDepth=%d",
            finalityWeightThreshold, maxDepth);
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
            if (!maintenanceExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                maintenanceExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            validationExecutor.shutdownNow();
            maintenanceExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        LOG.info("DAGTransactionGraph shutdown complete");
    }

    /**
     * Add a new transaction node to the DAG
     * Automatically resolves parent references and updates indices
     *
     * @param node The DAGNode to add
     * @return AddResult with success status and any conflicts
     */
    public AddResult addNode(DAGNode node) {
        if (!running) {
            return AddResult.failure("DAG not running");
        }

        if (node == null) {
            return AddResult.failure("Node cannot be null");
        }

        String txId = node.getTransactionId();

        // Check for duplicates
        if (nodes.containsKey(txId) || pendingNodes.containsKey(txId) || finalizedNodes.containsKey(txId)) {
            return AddResult.failure("Duplicate transaction: " + txId);
        }

        // Check pending capacity
        if (pendingNodes.size() >= maxPendingNodes) {
            return AddResult.failure("Maximum pending nodes reached");
        }

        // Resolve parent references
        Set<DAGNode> resolvedParents = new HashSet<>();
        Set<String> missingParents = new HashSet<>();

        for (String parentId : node.getParentIds()) {
            DAGNode parent = getNode(parentId);
            if (parent != null) {
                resolvedParents.add(parent);
                node.addParent(parent);
            } else {
                missingParents.add(parentId);
            }
        }

        // Check for conflicts
        Set<String> conflictingTxIds = detectConflicts(node);
        if (!conflictingTxIds.isEmpty()) {
            totalConflictsDetected.incrementAndGet();
            // Still add, but mark as conflicting
            node.markConflicting();
        }

        // Check depth limit
        if (node.getDepth() > maxDepth) {
            return AddResult.failure("Maximum depth exceeded: " + node.getDepth());
        }

        // Add to appropriate storage
        if (missingParents.isEmpty()) {
            nodes.put(txId, node);
        } else {
            pendingNodes.put(txId, node);
        }

        // Update indices
        updateAddressIndices(node, true);

        // Update tips/roots
        updateTipsAndRoots(node);

        totalNodesAdded.incrementAndGet();

        return AddResult.success(txId, conflictingTxIds, missingParents);
    }

    /**
     * Add multiple nodes in batch for high throughput
     *
     * @param nodeList List of nodes to add
     * @return BatchAddResult with per-node results
     */
    public BatchAddResult addNodesBatch(List<DAGNode> nodeList) {
        if (!running) {
            return BatchAddResult.failure("DAG not running");
        }

        long startTime = System.nanoTime();
        List<AddResult> results = new ArrayList<>(nodeList.size());
        int successCount = 0;
        int conflictCount = 0;

        // Process in parallel using virtual threads
        List<CompletableFuture<AddResult>> futures = nodeList.stream()
            .map(node -> CompletableFuture.supplyAsync(() -> addNode(node), validationExecutor))
            .toList();

        for (CompletableFuture<AddResult> future : futures) {
            try {
                AddResult result = future.get(1, TimeUnit.SECONDS);
                results.add(result);
                if (result.success) {
                    successCount++;
                    if (!result.conflictingTransactions.isEmpty()) {
                        conflictCount++;
                    }
                }
            } catch (Exception e) {
                results.add(AddResult.failure("Execution error: " + e.getMessage()));
            }
        }

        long durationNanos = System.nanoTime() - startTime;
        double tps = (successCount * 1_000_000_000.0) / durationNanos;

        return new BatchAddResult(results, successCount, conflictCount, durationNanos, tps);
    }

    /**
     * Get a node by transaction ID
     */
    public DAGNode getNode(String transactionId) {
        DAGNode node = nodes.get(transactionId);
        if (node == null) {
            node = finalizedNodes.get(transactionId);
        }
        if (node == null) {
            node = pendingNodes.get(transactionId);
        }
        return node;
    }

    /**
     * Detect conflicts with existing nodes
     * Uses address indices for O(1) lookup per address
     */
    public Set<String> detectConflicts(DAGNode node) {
        Set<String> conflicts = new HashSet<>();

        // Check write-write conflicts
        for (String addr : node.getWriteSet()) {
            Set<String> writers = writeAddressIndex.get(addr);
            if (writers != null) {
                for (String txId : writers) {
                    if (!txId.equals(node.getTransactionId())) {
                        DAGNode other = getNode(txId);
                        if (other != null && !other.isFinalized()) {
                            conflicts.add(txId);
                        }
                    }
                }
            }
        }

        // Check read-write conflicts (new node reads, existing writes)
        for (String addr : node.getReadSet()) {
            Set<String> writers = writeAddressIndex.get(addr);
            if (writers != null) {
                for (String txId : writers) {
                    if (!txId.equals(node.getTransactionId())) {
                        DAGNode other = getNode(txId);
                        if (other != null && !other.isFinalized()) {
                            conflicts.add(txId);
                        }
                    }
                }
            }
        }

        // Check write-read conflicts (new node writes, existing reads)
        for (String addr : node.getWriteSet()) {
            Set<String> readers = readAddressIndex.get(addr);
            if (readers != null) {
                for (String txId : readers) {
                    if (!txId.equals(node.getTransactionId())) {
                        DAGNode other = getNode(txId);
                        if (other != null && !other.isFinalized()) {
                            conflicts.add(txId);
                        }
                    }
                }
            }
        }

        return conflicts;
    }

    /**
     * Get non-conflicting nodes that can be validated in parallel
     * Uses topological ordering and conflict detection
     */
    public List<List<DAGNode>> getParallelValidationBatches() {
        List<List<DAGNode>> batches = new ArrayList<>();
        Set<String> processed = new HashSet<>();

        // Get all ready nodes (pending validation)
        List<DAGNode> readyNodes = nodes.values().stream()
            .filter(DAGNode::isReady)
            .sorted()
            .collect(Collectors.toList());

        while (!readyNodes.isEmpty()) {
            List<DAGNode> currentBatch = new ArrayList<>();
            Set<String> batchAddresses = new HashSet<>();

            for (DAGNode node : readyNodes) {
                if (processed.contains(node.getTransactionId())) {
                    continue;
                }

                // Check if node's parents are processed
                boolean parentsReady = node.getParentIds().stream()
                    .allMatch(pid -> {
                        DAGNode parent = getNode(pid);
                        return parent == null || parent.isValid();
                    });

                if (!parentsReady) {
                    continue;
                }

                // Check for conflicts with current batch
                boolean hasConflict = false;
                for (String addr : node.getReadSet()) {
                    if (batchAddresses.contains(addr)) {
                        // Check if any write in batch
                        for (DAGNode batchNode : currentBatch) {
                            if (batchNode.getWriteSet().contains(addr)) {
                                hasConflict = true;
                                break;
                            }
                        }
                    }
                    if (hasConflict) break;
                }

                if (!hasConflict) {
                    for (String addr : node.getWriteSet()) {
                        if (batchAddresses.contains(addr)) {
                            hasConflict = true;
                            break;
                        }
                    }
                }

                if (!hasConflict) {
                    currentBatch.add(node);
                    processed.add(node.getTransactionId());
                    batchAddresses.addAll(node.getReadSet());
                    batchAddresses.addAll(node.getWriteSet());
                }
            }

            if (currentBatch.isEmpty()) {
                break; // No more progress possible
            }

            batches.add(currentBatch);
            readyNodes = readyNodes.stream()
                .filter(n -> !processed.contains(n.getTransactionId()))
                .collect(Collectors.toList());
        }

        totalParallelValidations.addAndGet(batches.size());
        return batches;
    }

    /**
     * Perform topological sort of all nodes
     * Uses Kahn's algorithm for O(V+E) complexity
     */
    public List<DAGNode> topologicalSort() {
        List<DAGNode> sorted = new ArrayList<>();
        Map<String, Integer> inDegree = new HashMap<>();
        Queue<DAGNode> queue = new LinkedList<>();

        // Calculate in-degrees
        for (DAGNode node : nodes.values()) {
            String txId = node.getTransactionId();
            inDegree.put(txId, node.getParentCount());
            if (node.getParentCount() == 0) {
                queue.offer(node);
            }
        }

        while (!queue.isEmpty()) {
            DAGNode node = queue.poll();
            sorted.add(node);

            for (DAGNode child : node.getChildren()) {
                String childId = child.getTransactionId();
                int newDegree = inDegree.get(childId) - 1;
                inDegree.put(childId, newDegree);
                if (newDegree == 0) {
                    queue.offer(child);
                }
            }
        }

        // Check for cycles
        if (sorted.size() != nodes.size()) {
            LOG.warnf("Cycle detected in DAG: sorted %d of %d nodes", sorted.size(), nodes.size());
        }

        return sorted;
    }

    /**
     * Get nodes ready for finalization
     */
    public List<DAGNode> getReadyForFinalization() {
        return nodes.values().stream()
            .filter(node -> node.canFinalize(finalityWeightThreshold))
            .sorted()
            .collect(Collectors.toList());
    }

    /**
     * Finalize a node and move to finalized storage
     */
    public boolean finalizeNode(String transactionId) {
        DAGNode node = nodes.get(transactionId);
        if (node == null) {
            return false;
        }

        if (node.finalize(node.getCumulativeWeight())) {
            // Move to finalized storage
            nodes.remove(transactionId);
            finalizedNodes.put(transactionId, node);

            // Update indices
            updateAddressIndices(node, false);

            // Update tips
            tips.remove(transactionId);

            // Update metrics
            totalNodesFinalized.incrementAndGet();
            lastFinalityTimestamp.set(Instant.now());

            double latencyMs = node.getFinalizationLatencyMs();
            if (latencyMs >= 0) {
                // Exponential moving average
                averageFinalityMs = (averageFinalityMs * 0.9) + (latencyMs * 0.1);
            }

            LOG.debugf("Finalized node %s with weight %d in %.2fms",
                transactionId, node.getCumulativeWeight(), latencyMs);

            return true;
        }
        return false;
    }

    /**
     * Finalize all ready nodes
     */
    public int finalizeReadyNodes() {
        List<DAGNode> ready = getReadyForFinalization();
        int count = 0;
        for (DAGNode node : ready) {
            if (finalizeNode(node.getTransactionId())) {
                count++;
            }
        }
        return count;
    }

    /**
     * Propagate weight updates from tips to roots
     */
    public void propagateWeights() {
        // Traverse from tips upward, updating cumulative weights
        Set<String> visited = new HashSet<>();
        Queue<DAGNode> queue = new LinkedList<>();

        // Start from tips
        for (String tipId : tips) {
            DAGNode tip = getNode(tipId);
            if (tip != null) {
                queue.offer(tip);
            }
        }

        while (!queue.isEmpty()) {
            DAGNode node = queue.poll();
            String txId = node.getTransactionId();

            if (visited.contains(txId)) {
                continue;
            }
            visited.add(txId);

            // Calculate cumulative weight
            long weight = node.calculateCumulativeWeight();

            // Add parents to queue
            for (DAGNode parent : node.getParents()) {
                if (!visited.contains(parent.getTransactionId())) {
                    queue.offer(parent);
                }
            }
        }
    }

    /**
     * Get current tips (nodes with no children)
     */
    public Set<DAGNode> getTips() {
        return tips.stream()
            .map(this::getNode)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    }

    /**
     * Get current roots (nodes with no parents)
     */
    public Set<DAGNode> getRoots() {
        return roots.stream()
            .map(this::getNode)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    }

    /**
     * Get the width of the DAG (number of tips)
     */
    public int getWidth() {
        return tips.size();
    }

    /**
     * Get the maximum depth of the DAG
     */
    public int getMaxDepth() {
        return nodes.values().stream()
            .mapToInt(DAGNode::getDepth)
            .max()
            .orElse(0);
    }

    /**
     * Get DAG statistics
     */
    public DAGStats getStats() {
        return new DAGStats(
            nodes.size(),
            pendingNodes.size(),
            finalizedNodes.size(),
            tips.size(),
            roots.size(),
            getMaxDepth(),
            totalNodesAdded.get(),
            totalNodesFinalized.get(),
            totalConflictsDetected.get(),
            totalParallelValidations.get(),
            averageFinalityMs
        );
    }

    // Private helper methods

    private void updateAddressIndices(DAGNode node, boolean add) {
        String txId = node.getTransactionId();

        if (add) {
            for (String addr : node.getWriteSet()) {
                writeAddressIndex.computeIfAbsent(addr, k -> ConcurrentHashMap.newKeySet()).add(txId);
            }
            for (String addr : node.getReadSet()) {
                readAddressIndex.computeIfAbsent(addr, k -> ConcurrentHashMap.newKeySet()).add(txId);
            }
        } else {
            for (String addr : node.getWriteSet()) {
                Set<String> writers = writeAddressIndex.get(addr);
                if (writers != null) {
                    writers.remove(txId);
                }
            }
            for (String addr : node.getReadSet()) {
                Set<String> readers = readAddressIndex.get(addr);
                if (readers != null) {
                    readers.remove(txId);
                }
            }
        }
    }

    private void updateTipsAndRoots(DAGNode node) {
        String txId = node.getTransactionId();

        // New node is a tip (has no children yet)
        tips.add(txId);

        // Remove parents from tips (they now have children)
        for (DAGNode parent : node.getParents()) {
            tips.remove(parent.getTransactionId());
        }

        // If node has no parents, it's a root
        if (!node.hasParents()) {
            roots.add(txId);
        }
    }

    private void pruneOldNodes() {
        if (!running) return;

        try {
            // Prune finalized nodes older than 1 hour
            Instant cutoff = Instant.now().minus(Duration.ofHours(1));
            int pruned = 0;

            Iterator<Map.Entry<String, DAGNode>> iterator = finalizedNodes.entrySet().iterator();
            while (iterator.hasNext()) {
                Map.Entry<String, DAGNode> entry = iterator.next();
                if (entry.getValue().getFinalityTimestamp() != null &&
                    entry.getValue().getFinalityTimestamp().isBefore(cutoff)) {
                    iterator.remove();
                    pruned++;
                }
            }

            if (pruned > 0) {
                LOG.debugf("Pruned %d old finalized nodes", pruned);
            }
        } catch (Exception e) {
            LOG.error("Error during node pruning", e);
        }
    }

    private void reportMetrics() {
        if (!running) return;

        try {
            DAGStats stats = getStats();
            LOG.debugf("DAG Stats: active=%d, pending=%d, finalized=%d, width=%d, depth=%d, avgFinality=%.2fms",
                stats.activeNodes, stats.pendingNodes, stats.finalizedNodes,
                stats.width, stats.depth, stats.averageFinalityMs);
        } catch (Exception e) {
            LOG.debug("Error reporting metrics: " + e.getMessage());
        }
    }

    // Result classes

    /**
     * Result of adding a single node
     */
    public static class AddResult {
        public final boolean success;
        public final String transactionId;
        public final Set<String> conflictingTransactions;
        public final Set<String> missingParents;
        public final String errorMessage;

        private AddResult(boolean success, String transactionId,
                         Set<String> conflicts, Set<String> missing, String error) {
            this.success = success;
            this.transactionId = transactionId;
            this.conflictingTransactions = conflicts != null ? conflicts : Collections.emptySet();
            this.missingParents = missing != null ? missing : Collections.emptySet();
            this.errorMessage = error;
        }

        public static AddResult success(String txId, Set<String> conflicts, Set<String> missing) {
            return new AddResult(true, txId, conflicts, missing, null);
        }

        public static AddResult failure(String error) {
            return new AddResult(false, null, null, null, error);
        }
    }

    /**
     * Result of batch adding nodes
     */
    public static class BatchAddResult {
        public final List<AddResult> results;
        public final int successCount;
        public final int conflictCount;
        public final long durationNanos;
        public final double tps;
        public final String errorMessage;

        public BatchAddResult(List<AddResult> results, int successCount, int conflictCount,
                            long durationNanos, double tps) {
            this.results = results;
            this.successCount = successCount;
            this.conflictCount = conflictCount;
            this.durationNanos = durationNanos;
            this.tps = tps;
            this.errorMessage = null;
        }

        public static BatchAddResult failure(String error) {
            BatchAddResult result = new BatchAddResult(Collections.emptyList(), 0, 0, 0, 0);
            return result;
        }
    }

    /**
     * DAG statistics
     */
    public static class DAGStats {
        public final int activeNodes;
        public final int pendingNodes;
        public final int finalizedNodes;
        public final int width;
        public final int depth;
        public final long totalAdded;
        public final long totalFinalized;
        public final long totalConflicts;
        public final long parallelBatches;
        public final double averageFinalityMs;

        public DAGStats(int activeNodes, int pendingNodes, int finalizedNodes,
                       int width, int depth, int maxDepth,
                       long totalAdded, long totalFinalized,
                       long totalConflicts, long parallelBatches,
                       double averageFinalityMs) {
            this.activeNodes = activeNodes;
            this.pendingNodes = pendingNodes;
            this.finalizedNodes = finalizedNodes;
            this.width = width;
            this.depth = maxDepth;
            this.totalAdded = totalAdded;
            this.totalFinalized = totalFinalized;
            this.totalConflicts = totalConflicts;
            this.parallelBatches = parallelBatches;
            this.averageFinalityMs = averageFinalityMs;
        }

        @Override
        public String toString() {
            return String.format(
                "DAGStats{active=%d, pending=%d, finalized=%d, width=%d, depth=%d, " +
                "totalAdded=%d, totalFinalized=%d, conflicts=%d, avgFinality=%.2fms}",
                activeNodes, pendingNodes, finalizedNodes, width, depth,
                totalAdded, totalFinalized, totalConflicts, averageFinalityMs
            );
        }
    }
}
