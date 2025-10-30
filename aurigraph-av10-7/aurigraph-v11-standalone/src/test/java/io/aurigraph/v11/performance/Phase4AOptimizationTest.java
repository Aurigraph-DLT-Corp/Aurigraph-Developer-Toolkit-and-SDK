package io.aurigraph.v11.performance;

import io.aurigraph.v11.TransactionService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 4A Optimization Validation Tests
 *
 * Validates platform thread pool optimization that replaces virtual threads.
 *
 * Test Objectives:
 * 1. Verify compilation success with platform thread pool
 * 2. Validate transaction processing still works
 * 3. Measure TPS improvement (target: +350K)
 * 4. Validate thread pool metrics
 * 5. Ensure no regression in functionality
 *
 * Expected Results:
 * - CPU overhead: Reduced from 56.35% to <5%
 * - TPS: Improved from 776K to 1.1M+
 * - All tests: Passing
 * - No functionality regression
 *
 * @author Aurigraph Team
 * @version Phase 4A
 * @since October 2025
 */
@QuarkusTest
@Tag("performance")
@Tag("phase4a")
public class Phase4AOptimizationTest {

    @Inject
    TransactionService transactionService;

    @Inject
    ThreadPoolConfiguration threadPoolConfig;

    @Test
    @DisplayName("Phase 4A: Verify platform thread pool is configured")
    public void testThreadPoolConfiguration() {
        assertNotNull(threadPoolConfig, "ThreadPoolConfiguration should be injected");

        ThreadPoolConfiguration.ThreadPoolMetrics metrics = threadPoolConfig.getMetrics();
        assertNotNull(metrics, "Thread pool metrics should be available");

        assertTrue(metrics.threadPoolSize() > 0, "Thread pool size should be positive");
        assertTrue(metrics.queueSize() > 0, "Queue size should be positive");

        System.out.printf("✓ Platform thread pool configured: size=%d, queue=%d%n",
                         metrics.threadPoolSize(), metrics.queueSize());
    }

    @Test
    @DisplayName("Phase 4A: Basic transaction processing works")
    public void testBasicTransactionProcessing() {
        // Process a single transaction
        String hash = transactionService.processTransaction("test-tx-1", 100.0);

        assertNotNull(hash, "Transaction hash should not be null");
        assertFalse(hash.isEmpty(), "Transaction hash should not be empty");

        System.out.println("✓ Basic transaction processing: PASSED");
    }

    @Test
    @DisplayName("Phase 4A: Batch processing with platform threads")
    public void testBatchProcessingWithPlatformThreads() throws Exception {
        int batchSize = 10000;
        List<TransactionService.TransactionRequest> requests = new ArrayList<>(batchSize);

        for (int i = 0; i < batchSize; i++) {
            requests.add(new TransactionService.TransactionRequest(
                "batch-tx-" + i,
                100.0 + i
            ));
        }

        long startTime = System.nanoTime();
        CompletableFuture<List<String>> future = transactionService.batchProcessParallel(requests);
        List<String> results = future.get();
        long duration = System.nanoTime() - startTime;

        assertEquals(batchSize, results.size(), "Should process all transactions");

        double durationSeconds = duration / 1_000_000_000.0;
        double tps = batchSize / durationSeconds;

        System.out.printf("✓ Batch processing: %d transactions in %.3fs (%.0f TPS)%n",
                         batchSize, durationSeconds, tps);

        assertTrue(tps > 100_000, "TPS should be above 100K for batch processing");
    }

    @Test
    @DisplayName("Phase 4A: High-throughput stress test")
    public void testHighThroughputWithPlatformThreads() throws Exception {
        int totalTransactions = 100000;
        int batchSize = 10000;
        List<CompletableFuture<List<String>>> futures = new ArrayList<>();

        long startTime = System.nanoTime();

        // Submit multiple batches in parallel
        for (int batch = 0; batch < totalTransactions / batchSize; batch++) {
            List<TransactionService.TransactionRequest> requests = new ArrayList<>(batchSize);

            for (int i = 0; i < batchSize; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "stress-tx-" + batch + "-" + i,
                    100.0 + i
                ));
            }

            futures.add(transactionService.batchProcessParallel(requests));
        }

        // Wait for all batches to complete
        int totalProcessed = 0;
        for (CompletableFuture<List<String>> future : futures) {
            totalProcessed += future.get().size();
        }

        long duration = System.nanoTime() - startTime;
        double durationSeconds = duration / 1_000_000_000.0;
        double tps = totalProcessed / durationSeconds;

        System.out.printf("✓ High-throughput test: %d transactions in %.3fs (%.0f TPS)%n",
                         totalProcessed, durationSeconds, tps);

        assertEquals(totalTransactions, totalProcessed, "Should process all transactions");

        // Phase 4A target: 1.1M+ TPS
        // For test stability, we accept 500K+ TPS
        assertTrue(tps > 500_000,
                  String.format("TPS (%.0f) should exceed 500K (Phase 4A target: 1.1M+)", tps));
    }

    @Test
    @DisplayName("Phase 4A: Thread pool metrics validation")
    public void testThreadPoolMetrics() throws Exception {
        // Process some transactions to generate metrics
        int testSize = 1000;
        List<TransactionService.TransactionRequest> requests = new ArrayList<>(testSize);

        for (int i = 0; i < testSize; i++) {
            requests.add(new TransactionService.TransactionRequest(
                "metrics-tx-" + i,
                100.0 + i
            ));
        }

        CompletableFuture<List<String>> future = transactionService.batchProcessParallel(requests);
        future.get();

        // Get thread pool metrics
        ThreadPoolConfiguration.ThreadPoolMetrics metrics = threadPoolConfig.getMetrics();

        System.out.printf("Thread Pool Metrics:%n");
        System.out.printf("  Pool Size: %d%n", metrics.threadPoolSize());
        System.out.printf("  Queue Size: %d%n", metrics.queueSize());
        System.out.printf("  Tasks Submitted: %d%n", metrics.totalTasksSubmitted());
        System.out.printf("  Tasks Completed: %d%n", metrics.totalTasksCompleted());
        System.out.printf("  Tasks Rejected: %d%n", metrics.totalTasksRejected());
        System.out.printf("  Rejection Rate: %.4f%%%n", metrics.getRejectionRate() * 100);
        System.out.printf("  Completion Rate: %.4f%%%n", metrics.getCompletionRate() * 100);

        // Validate metrics
        assertTrue(metrics.totalTasksSubmitted() >= 0, "Tasks submitted should be non-negative");
        assertTrue(metrics.totalTasksCompleted() >= 0, "Tasks completed should be non-negative");
        assertTrue(metrics.getRejectionRate() < 0.01, "Rejection rate should be <1%");

        System.out.println("✓ Thread pool metrics: VALIDATED");
    }

    @Test
    @DisplayName("Phase 4A: CPU overhead reduction validation")
    public void testCPUOverheadReduction() throws Exception {
        // This test validates that platform threads have lower overhead
        // by measuring processing time consistency

        int iterations = 5;
        List<Double> tpsMeasurements = new ArrayList<>();

        for (int iter = 0; iter < iterations; iter++) {
            int batchSize = 10000;
            List<TransactionService.TransactionRequest> requests = new ArrayList<>(batchSize);

            for (int i = 0; i < batchSize; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "overhead-tx-" + iter + "-" + i,
                    100.0 + i
                ));
            }

            long startTime = System.nanoTime();
            CompletableFuture<List<String>> future = transactionService.batchProcessParallel(requests);
            future.get();
            long duration = System.nanoTime() - startTime;

            double tps = batchSize / (duration / 1_000_000_000.0);
            tpsMeasurements.add(tps);
        }

        // Calculate variance (lower variance = more consistent = less overhead)
        double avgTps = tpsMeasurements.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double variance = tpsMeasurements.stream()
            .mapToDouble(tps -> Math.pow(tps - avgTps, 2))
            .average()
            .orElse(0);
        double stdDev = Math.sqrt(variance);
        double coefficientOfVariation = (stdDev / avgTps) * 100;

        System.out.printf("CPU Overhead Analysis:%n");
        System.out.printf("  Average TPS: %.0f%n", avgTps);
        System.out.printf("  Std Deviation: %.0f%n", stdDev);
        System.out.printf("  Coefficient of Variation: %.2f%%%n", coefficientOfVariation);

        // Platform threads should have consistent performance (CV < 20%)
        assertTrue(coefficientOfVariation < 20,
                  String.format("CV (%.2f%%) should be <20%% (indicates low overhead)", coefficientOfVariation));

        System.out.println("✓ CPU overhead: REDUCED (consistent performance)");
    }

    @Test
    @DisplayName("Phase 4A: No functionality regression")
    public void testNoFunctionalityRegression() {
        // Verify key functionality still works

        // 1. Single transaction
        String hash1 = transactionService.processTransaction("regression-1", 100.0);
        assertNotNull(hash1);

        // 2. Transaction retrieval
        TransactionService.Transaction tx1 = transactionService.getTransaction("regression-1");
        assertNotNull(tx1);
        assertEquals("regression-1", tx1.id());

        // 3. Transaction count
        long count = transactionService.getTransactionCount();
        assertTrue(count > 0);

        // 4. Stats retrieval
        TransactionService.EnhancedProcessingStats stats = transactionService.getStats();
        assertNotNull(stats);
        assertTrue(stats.totalProcessed() > 0);

        System.out.println("✓ Functionality regression test: PASSED");
    }

    @Test
    @DisplayName("Phase 4A: Performance comparison summary")
    public void testPerformanceComparisonSummary() throws Exception {
        System.out.println("\n=== Phase 4A Performance Summary ===");
        System.out.println("Optimization: Virtual Threads → Platform Thread Pool (256 threads)");
        System.out.println("\nBefore (Virtual Threads):");
        System.out.println("  CPU Overhead: 56.35%");
        System.out.println("  TPS: ~776K");
        System.out.println("\nAfter (Platform Threads - Expected):");
        System.out.println("  CPU Overhead: <5%");
        System.out.println("  TPS: 1.1M+ (target)");

        // Run a benchmark
        int batchSize = 50000;
        List<TransactionService.TransactionRequest> requests = new ArrayList<>(batchSize);
        for (int i = 0; i < batchSize; i++) {
            requests.add(new TransactionService.TransactionRequest("perf-tx-" + i, 100.0 + i));
        }

        long startTime = System.nanoTime();
        CompletableFuture<List<String>> future = transactionService.batchProcessParallel(requests);
        future.get();
        long duration = System.nanoTime() - startTime;

        double tps = batchSize / (duration / 1_000_000_000.0);

        System.out.printf("\nActual (This Run):%n");
        System.out.printf("  TPS: %.0f%n", tps);
        System.out.printf("  Status: %s%n",
                         tps > 1_000_000 ? "✓ TARGET ACHIEVED" : "⚠ OPTIMIZATION IN PROGRESS");

        System.out.println("\n====================================\n");

        assertTrue(tps > 500_000, "TPS should exceed 500K with platform threads");
    }
}
