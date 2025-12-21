package io.aurigraph.v11.metrics;

import io.aurigraph.v11.consensus.FinalityPipeline;
import io.aurigraph.v11.consensus.dag.DAGTransactionGraph;
import io.aurigraph.v11.crypto.ParallelSignatureVerifier;
import io.aurigraph.v11.execution.OptimisticExecutor;
import io.aurigraph.v11.mempool.PreValidationService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.ThreadMXBean;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Sprint 5 Performance Metrics Collector
 * Sprint 5: Performance Optimization - Comprehensive Performance Tracking
 *
 * Aggregates metrics from all Sprint 5 components:
 * - DAG Transaction Graph: depth, width, conflicts, finalization rate
 * - Parallel Signature Verifier: throughput, latency, success rate
 * - Optimistic Executor: cache hit rate, rollback rate, execution latency
 * - Pre-Validation Service: validation throughput, acceptance rate
 * - Finality Pipeline: end-to-end latency, TPS, stage latencies
 *
 * Performance Targets:
 * - 5M+ TPS throughput
 * - <100ms finality latency (P99)
 * - <50ms average finality latency
 * - 99%+ signature verification success
 * - 95%+ cache hit rate
 *
 * @version 1.0.0
 * @since Sprint 5 (December 2025)
 */
@ApplicationScoped
public class Sprint5PerformanceMetrics {

    private static final Logger LOG = Logger.getLogger(Sprint5PerformanceMetrics.class);

    // Configuration
    @ConfigProperty(name = "metrics.collection.interval.ms", defaultValue = "1000")
    long collectionIntervalMs;

    @ConfigProperty(name = "metrics.sliding.window.seconds", defaultValue = "60")
    int slidingWindowSeconds;

    @ConfigProperty(name = "metrics.target.tps", defaultValue = "5000000")
    long targetTps;

    @ConfigProperty(name = "metrics.target.finality.ms", defaultValue = "100")
    long targetFinalityMs;

    // Injected components
    @Inject
    DAGTransactionGraph dagGraph;

    @Inject
    ParallelSignatureVerifier signatureVerifier;

    @Inject
    OptimisticExecutor optimisticExecutor;

    @Inject
    PreValidationService preValidationService;

    @Inject
    FinalityPipeline finalityPipeline;

    // JMX beans for system metrics
    private final MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
    private final ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();

    // Metrics storage
    private final ConcurrentLinkedQueue<MetricsSnapshot> snapshotHistory = new ConcurrentLinkedQueue<>();
    private final AtomicReference<AggregatedMetrics> currentMetrics = new AtomicReference<>();

    // TPS calculation
    private final AtomicLong[] tpsWindow = new AtomicLong[60]; // 60-second window
    private int tpsWindowIndex = 0;

    // Latency histogram
    private final LatencyHistogram finalityLatencyHistogram = new LatencyHistogram();
    private final LatencyHistogram signatureLatencyHistogram = new LatencyHistogram();
    private final LatencyHistogram executionLatencyHistogram = new LatencyHistogram();

    // Execution services
    private ScheduledExecutorService metricsExecutor;
    private volatile boolean running = false;

    // Tracking
    private Instant startTime;
    private final AtomicLong totalTransactionsProcessed = new AtomicLong(0);

    @PostConstruct
    public void initialize() {
        // Initialize TPS window
        for (int i = 0; i < tpsWindow.length; i++) {
            tpsWindow[i] = new AtomicLong(0);
        }

        // Initialize current metrics
        currentMetrics.set(new AggregatedMetrics());

        // Initialize executor
        metricsExecutor = Executors.newScheduledThreadPool(2,
            Thread.ofVirtual().name("sprint5-metrics-", 0).factory());

        startTime = Instant.now();
        running = true;

        // Schedule periodic collection
        metricsExecutor.scheduleAtFixedRate(
            this::collectMetrics, 0, collectionIntervalMs, TimeUnit.MILLISECONDS);

        // Schedule TPS window update
        metricsExecutor.scheduleAtFixedRate(
            this::updateTpsWindow, 1, 1, TimeUnit.SECONDS);

        // Schedule snapshot cleanup
        metricsExecutor.scheduleAtFixedRate(
            this::cleanupOldSnapshots, 60, 60, TimeUnit.SECONDS);

        LOG.infof("Sprint5PerformanceMetrics initialized: target=%dM TPS, finality<%dms",
            targetTps / 1_000_000, targetFinalityMs);
    }

    @PreDestroy
    public void shutdown() {
        running = false;

        metricsExecutor.shutdown();
        try {
            if (!metricsExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                metricsExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            metricsExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        LOG.info("Sprint5PerformanceMetrics shutdown complete");
    }

    /**
     * Record a transaction completion for TPS calculation
     */
    public void recordTransaction() {
        totalTransactionsProcessed.incrementAndGet();
        tpsWindow[tpsWindowIndex].incrementAndGet();
    }

    /**
     * Record multiple transaction completions
     */
    public void recordTransactions(int count) {
        totalTransactionsProcessed.addAndGet(count);
        tpsWindow[tpsWindowIndex].addAndGet(count);
    }

    /**
     * Record finality latency
     */
    public void recordFinalityLatency(double latencyMs) {
        finalityLatencyHistogram.record(latencyMs);
    }

    /**
     * Record signature verification latency
     */
    public void recordSignatureLatency(double latencyMs) {
        signatureLatencyHistogram.record(latencyMs);
    }

    /**
     * Record execution latency
     */
    public void recordExecutionLatency(double latencyMs) {
        executionLatencyHistogram.record(latencyMs);
    }

    /**
     * Get current aggregated metrics
     */
    public AggregatedMetrics getMetrics() {
        return currentMetrics.get();
    }

    /**
     * Get current TPS (transactions per second)
     */
    public double getCurrentTps() {
        long sum = 0;
        for (AtomicLong counter : tpsWindow) {
            sum += counter.get();
        }
        return sum / (double) tpsWindow.length;
    }

    /**
     * Get peak TPS achieved
     */
    public double getPeakTps() {
        long max = 0;
        for (AtomicLong counter : tpsWindow) {
            max = Math.max(max, counter.get());
        }
        return max;
    }

    /**
     * Check if meeting performance targets
     */
    public boolean meetsTargets() {
        AggregatedMetrics metrics = currentMetrics.get();
        return metrics.tps >= targetTps &&
               metrics.finalityP99Ms < targetFinalityMs &&
               metrics.errorRate < 0.001;
    }

    /**
     * Get performance summary
     */
    public String getSummary() {
        AggregatedMetrics m = currentMetrics.get();
        return String.format(
            "Sprint5 Metrics: TPS=%.2fM/%.2fM (%.1f%%), Finality P99=%.1fms/<%dms, " +
            "SigVerify=%.0f/s, CacheHit=%.1f%%, DAG depth=%d width=%d",
            m.tps / 1_000_000.0, targetTps / 1_000_000.0, (m.tps * 100.0 / targetTps),
            m.finalityP99Ms, targetFinalityMs,
            m.signatureVerificationsPerSecond, m.cacheHitRate,
            m.dagDepth, m.dagWidth
        );
    }

    /**
     * Get detailed report
     */
    public String getDetailedReport() {
        AggregatedMetrics m = currentMetrics.get();
        StringBuilder sb = new StringBuilder();
        sb.append("=== Sprint 5 Performance Report ===\n\n");

        // Overall
        sb.append(String.format("Uptime: %s\n", formatDuration(Duration.between(startTime, Instant.now()))));
        sb.append(String.format("Total Transactions: %,d\n\n", totalTransactionsProcessed.get()));

        // Throughput
        sb.append("--- Throughput ---\n");
        sb.append(String.format("Current TPS: %.2fM\n", m.tps / 1_000_000.0));
        sb.append(String.format("Peak TPS: %.2fM\n", m.peakTps / 1_000_000.0));
        sb.append(String.format("Target TPS: %.2fM\n", targetTps / 1_000_000.0));
        sb.append(String.format("Achievement: %.1f%%\n\n", m.tps * 100.0 / targetTps));

        // Finality
        sb.append("--- Finality Latency ---\n");
        sb.append(String.format("P50: %.2fms\n", m.finalityP50Ms));
        sb.append(String.format("P95: %.2fms\n", m.finalityP95Ms));
        sb.append(String.format("P99: %.2fms (target: <%dms)\n", m.finalityP99Ms, targetFinalityMs));
        sb.append(String.format("P99.9: %.2fms\n", m.finalityP999Ms));
        sb.append(String.format("Average: %.2fms\n\n", m.avgFinalityMs));

        // DAG
        sb.append("--- DAG Transaction Graph ---\n");
        sb.append(String.format("Active Nodes: %,d\n", m.dagActiveNodes));
        sb.append(String.format("Pending Nodes: %,d\n", m.dagPendingNodes));
        sb.append(String.format("Finalized Nodes: %,d\n", m.dagFinalizedNodes));
        sb.append(String.format("Depth: %d\n", m.dagDepth));
        sb.append(String.format("Width: %d\n", m.dagWidth));
        sb.append(String.format("Conflicts Detected: %,d\n\n", m.dagConflicts));

        // Signature Verification
        sb.append("--- Signature Verification ---\n");
        sb.append(String.format("Verifications/sec: %.0f\n", m.signatureVerificationsPerSecond));
        sb.append(String.format("Success Rate: %.2f%%\n", m.signatureSuccessRate));
        sb.append(String.format("Average Latency: %.2fms\n\n", m.avgSignatureLatencyMs));

        // Optimistic Execution
        sb.append("--- Optimistic Execution ---\n");
        sb.append(String.format("Cache Hit Rate: %.2f%%\n", m.cacheHitRate));
        sb.append(String.format("Rollback Rate: %.4f%%\n", m.rollbackRate));
        sb.append(String.format("Conflicts Detected: %,d\n", m.executionConflicts));
        sb.append(String.format("Average Latency: %.2fms\n\n", m.avgExecutionLatencyMs));

        // Pre-Validation
        sb.append("--- Pre-Validation Service ---\n");
        sb.append(String.format("Mempool Size: %,d\n", m.mempoolSize));
        sb.append(String.format("Acceptance Rate: %.2f%%\n", m.mempoolAcceptanceRate));
        sb.append(String.format("Average Validation: %.2fms\n\n", m.avgPreValidationMs));

        // System Resources
        sb.append("--- System Resources ---\n");
        sb.append(String.format("CPU Utilization: %.1f%%\n", m.cpuUtilization * 100));
        sb.append(String.format("Heap Memory: %.1fMB / %.1fMB\n", m.heapUsedMB, m.heapMaxMB));
        sb.append(String.format("Active Threads: %d\n", m.activeThreads));
        sb.append(String.format("Error Rate: %.4f%%\n\n", m.errorRate * 100));

        // Grade
        sb.append("--- Performance Grade ---\n");
        sb.append(String.format("Grade: %s\n", m.getPerformanceGrade()));
        sb.append(String.format("Meets Targets: %s\n", meetsTargets() ? "YES" : "NO"));

        return sb.toString();
    }

    // Private implementation

    private void collectMetrics() {
        if (!running) return;

        try {
            AggregatedMetrics metrics = new AggregatedMetrics();

            // TPS metrics
            metrics.tps = getCurrentTps();
            metrics.peakTps = getPeakTps();

            // DAG metrics
            if (dagGraph != null) {
                DAGTransactionGraph.DAGStats dagStats = dagGraph.getStats();
                metrics.dagActiveNodes = dagStats.activeNodes;
                metrics.dagPendingNodes = dagStats.pendingNodes;
                metrics.dagFinalizedNodes = dagStats.finalizedNodes;
                metrics.dagWidth = dagStats.width;
                metrics.dagDepth = dagStats.depth;
                metrics.dagConflicts = dagStats.totalConflicts;
                metrics.avgFinalityMs = dagStats.averageFinalityMs;
            }

            // Signature verification metrics
            if (signatureVerifier != null) {
                ParallelSignatureVerifier.VerificationMetrics sigMetrics =
                    signatureVerifier.getMetrics();
                metrics.signatureVerificationsPerSecond = sigMetrics.verificationsPerSecond;
                metrics.signatureSuccessRate = sigMetrics.successRate;
                metrics.avgSignatureLatencyMs = sigMetrics.averageLatencyMs;
            }

            // Optimistic executor metrics
            if (optimisticExecutor != null) {
                OptimisticExecutor.ExecutorMetrics execMetrics = optimisticExecutor.getMetrics();
                metrics.cacheHitRate = execMetrics.cacheHitRate;
                metrics.rollbackRate = execMetrics.totalExecutions > 0 ?
                    (execMetrics.rollbackCount * 100.0) / execMetrics.totalExecutions : 0;
                metrics.executionConflicts = execMetrics.conflictsDetected;
                metrics.avgExecutionLatencyMs = execMetrics.averageLatencyMs;
            }

            // Pre-validation metrics
            if (preValidationService != null) {
                PreValidationService.MempoolStats mempoolStats = preValidationService.getStats();
                metrics.mempoolSize = mempoolStats.currentSize;
                metrics.mempoolCapacity = mempoolStats.capacity;
                metrics.mempoolAcceptanceRate = mempoolStats.acceptanceRate;
                metrics.avgPreValidationMs = mempoolStats.averageValidationMs;
            }

            // Finality pipeline metrics
            if (finalityPipeline != null) {
                FinalityPipeline.PipelineMetrics pipelineMetrics = finalityPipeline.getMetrics();
                metrics.totalFinalized = pipelineMetrics.totalFinalized;
                metrics.totalFailed = pipelineMetrics.totalFailed;
                metrics.finalityP50Ms = pipelineMetrics.latencyP50;
                metrics.finalityP95Ms = pipelineMetrics.latencyP95;
                metrics.finalityP99Ms = pipelineMetrics.latencyP99;
                metrics.finalityP999Ms = pipelineMetrics.latencyP999;
                if (metrics.avgFinalityMs == 0) {
                    metrics.avgFinalityMs = pipelineMetrics.avgEndToEndMs;
                }
            }

            // System metrics
            metrics.heapUsedMB = memoryMXBean.getHeapMemoryUsage().getUsed() / (1024.0 * 1024.0);
            metrics.heapMaxMB = memoryMXBean.getHeapMemoryUsage().getMax() / (1024.0 * 1024.0);
            metrics.activeThreads = threadMXBean.getThreadCount();
            metrics.cpuUtilization = getSystemCpuLoad();

            // Error rate
            long total = metrics.totalFinalized + metrics.totalFailed;
            metrics.errorRate = total > 0 ? (double) metrics.totalFailed / total : 0;

            // Timestamp
            metrics.timestamp = Instant.now();

            // Update current metrics
            currentMetrics.set(metrics);

            // Store snapshot
            snapshotHistory.offer(new MetricsSnapshot(metrics));

        } catch (Exception e) {
            LOG.error("Error collecting metrics", e);
        }
    }

    private void updateTpsWindow() {
        tpsWindowIndex = (tpsWindowIndex + 1) % tpsWindow.length;
        tpsWindow[tpsWindowIndex].set(0);
    }

    private void cleanupOldSnapshots() {
        Instant cutoff = Instant.now().minusSeconds(slidingWindowSeconds * 2L);
        while (!snapshotHistory.isEmpty() &&
               snapshotHistory.peek().timestamp.isBefore(cutoff)) {
            snapshotHistory.poll();
        }
    }

    private double getSystemCpuLoad() {
        try {
            var osBean = ManagementFactory.getOperatingSystemMXBean();
            if (osBean instanceof com.sun.management.OperatingSystemMXBean sunBean) {
                return sunBean.getCpuLoad();
            }
        } catch (Exception e) {
            // Ignore
        }
        return 0.0;
    }

    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }

    // Data classes

    /**
     * Aggregated metrics from all Sprint 5 components
     */
    public static class AggregatedMetrics {
        // Throughput
        public double tps;
        public double peakTps;

        // DAG metrics
        public int dagActiveNodes;
        public int dagPendingNodes;
        public int dagFinalizedNodes;
        public int dagWidth;
        public int dagDepth;
        public long dagConflicts;

        // Signature verification
        public double signatureVerificationsPerSecond;
        public double signatureSuccessRate;
        public double avgSignatureLatencyMs;

        // Optimistic execution
        public double cacheHitRate;
        public double rollbackRate;
        public long executionConflicts;
        public double avgExecutionLatencyMs;

        // Pre-validation
        public int mempoolSize;
        public int mempoolCapacity;
        public double mempoolAcceptanceRate;
        public double avgPreValidationMs;

        // Finality
        public long totalFinalized;
        public long totalFailed;
        public double finalityP50Ms;
        public double finalityP95Ms;
        public double finalityP99Ms;
        public double finalityP999Ms;
        public double avgFinalityMs;

        // System
        public double heapUsedMB;
        public double heapMaxMB;
        public int activeThreads;
        public double cpuUtilization;
        public double errorRate;

        // Timestamp
        public Instant timestamp;

        public String getPerformanceGrade() {
            double achievement = (tps / 5_000_000.0) * 100.0;

            if (achievement >= 100.0 && finalityP99Ms < 100) return "EXCEPTIONAL (5M+ TPS, <100ms P99)";
            if (achievement >= 80.0 && finalityP99Ms < 150) return "EXCELLENT (4M+ TPS, <150ms P99)";
            if (achievement >= 60.0 && finalityP99Ms < 200) return "GOOD (3M+ TPS, <200ms P99)";
            if (achievement >= 40.0 && finalityP99Ms < 300) return "ACCEPTABLE (2M+ TPS, <300ms P99)";
            return "NEEDS IMPROVEMENT";
        }

        @Override
        public String toString() {
            return String.format(
                "AggregatedMetrics{tps=%.2fM, finality_p99=%.1fms, cacheHit=%.1f%%, " +
                "dagDepth=%d, dagWidth=%d, mempoolSize=%d}",
                tps / 1_000_000.0, finalityP99Ms, cacheHitRate, dagDepth, dagWidth, mempoolSize
            );
        }
    }

    /**
     * Metrics snapshot for historical tracking
     */
    private static class MetricsSnapshot {
        final Instant timestamp;
        final double tps;
        final double finalityP99Ms;
        final int dagDepth;

        MetricsSnapshot(AggregatedMetrics metrics) {
            this.timestamp = metrics.timestamp;
            this.tps = metrics.tps;
            this.finalityP99Ms = metrics.finalityP99Ms;
            this.dagDepth = metrics.dagDepth;
        }
    }

    /**
     * Latency histogram for percentile calculations
     */
    private static class LatencyHistogram {
        private final List<Double> samples = new CopyOnWriteArrayList<>();
        private static final int MAX_SAMPLES = 10000;

        void record(double latencyMs) {
            if (samples.size() >= MAX_SAMPLES) {
                samples.subList(0, samples.size() / 2).clear();
            }
            samples.add(latencyMs);
        }

        double getP50() { return getPercentile(50); }
        double getP95() { return getPercentile(95); }
        double getP99() { return getPercentile(99); }
        double getP999() { return getPercentile(99.9); }

        double getAverage() {
            if (samples.isEmpty()) return 0;
            return samples.stream().mapToDouble(d -> d).average().orElse(0);
        }

        private double getPercentile(double percentile) {
            if (samples.isEmpty()) return 0;

            List<Double> sorted = new ArrayList<>(samples);
            Collections.sort(sorted);

            int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
            index = Math.max(0, Math.min(index, sorted.size() - 1));
            return sorted.get(index);
        }
    }
}
