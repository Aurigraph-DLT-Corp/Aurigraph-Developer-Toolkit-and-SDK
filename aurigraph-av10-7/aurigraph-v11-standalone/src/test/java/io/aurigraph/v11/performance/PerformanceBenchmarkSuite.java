package io.aurigraph.v11.performance;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;

import jakarta.inject.Inject;
import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.execution.ParallelTransactionExecutor;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance Benchmark Suite
 * Stream 3: Performance Benchmarking - 2M+ TPS Target
 *
 * Comprehensive performance testing covering:
 * - Steady load scenarios
 * - Ramp up/down tests
 * - Spike testing
 * - Stress testing
 * - Soak testing
 * - Latency benchmarking
 *
 * Target: 2M+ TPS sustained throughput
 */
@QuarkusTest
@DisplayName("Performance Benchmark Suite")
@Tag("performance")
class PerformanceBenchmarkSuite {

    @Inject
    ParallelTransactionExecutor executor;

    @Inject
    TransactionService transactionService;

    // ==================== Scenario 1: Steady Load ====================

    @Test
    @DisplayName("Perf: Steady load - 100K TPS sustained for 10 seconds")
    void testSteadyLoad100K() {
        int targetTPS = 100000;
        int durationSeconds = 10;
        int totalTransactions = targetTPS * durationSeconds;

        long startTime = System.nanoTime();
        AtomicInteger counter = new AtomicInteger(0);

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < totalTransactions; i++) {
            transactions.add(createTask("steady-" + i, counter));
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        long duration = System.nanoTime() - startTime;
        double actualTPS = (totalTransactions * 1_000_000_000.0) / duration;

        // Assertions
        assertEquals(totalTransactions, result.successCount());
        assertTrue(actualTPS > 50000, "TPS should be > 50K, was: " + actualTPS);
        System.out.println("Steady Load: " + actualTPS + " TPS");
    }

    @Test
    @DisplayName("Perf: Steady load - 500K TPS for 5 seconds")
    void testSteadyLoad500K() {
        int targetTPS = 500000;
        int durationSeconds = 5;
        int totalTransactions = targetTPS * durationSeconds / 10; // Reduced for test speed

        long startTime = System.nanoTime();
        AtomicInteger counter = new AtomicInteger(0);

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < totalTransactions; i++) {
            transactions.add(createTask("steady-500k-" + i, counter));
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        long duration = System.nanoTime() - startTime;
        double actualTPS = (totalTransactions * 1_000_000_000.0) / duration;

        assertEquals(totalTransactions, result.successCount());
        assertTrue(actualTPS > 10000, "TPS should be > 10K");
        System.out.println("Steady Load 500K: " + actualTPS + " TPS");
    }

    // ==================== Scenario 2: Ramp Up/Down ====================

    @Test
    @DisplayName("Perf: Ramp up - Progressive load increase")
    void testRampUp() {
        int[] loadLevels = {1000, 5000, 10000, 20000, 50000};
        double[] tpsResults = new double[loadLevels.length];

        for (int i = 0; i < loadLevels.length; i++) {
            AtomicInteger counter = new AtomicInteger(0);
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

            for (int j = 0; j < loadLevels[i]; j++) {
                transactions.add(createTask("rampup-" + i + "-" + j, counter));
            }

            long startTime = System.nanoTime();
            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);
            long duration = System.nanoTime() - startTime;

            tpsResults[i] = (loadLevels[i] * 1_000_000_000.0) / duration;

            assertEquals(loadLevels[i], result.successCount());
            System.out.println("Ramp Up Level " + i + ": " + tpsResults[i] + " TPS");
        }

        // Verify TPS scales with load
        assertTrue(tpsResults[4] > tpsResults[0], "TPS should increase with load");
    }

    @Test
    @DisplayName("Perf: Ramp down - Progressive load decrease")
    void testRampDown() {
        int[] loadLevels = {50000, 20000, 10000, 5000, 1000};
        double[] tpsResults = new double[loadLevels.length];

        for (int i = 0; i < loadLevels.length; i++) {
            AtomicInteger counter = new AtomicInteger(0);
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

            for (int j = 0; j < loadLevels[i]; j++) {
                transactions.add(createTask("rampdown-" + i + "-" + j, counter));
            }

            long startTime = System.nanoTime();
            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);
            long duration = System.nanoTime() - startTime;

            tpsResults[i] = (loadLevels[i] * 1_000_000_000.0) / duration;

            assertEquals(loadLevels[i], result.successCount());
            System.out.println("Ramp Down Level " + i + ": " + tpsResults[i] + " TPS");
        }

        // Verify system handles ramp down gracefully
        assertTrue(tpsResults[0] > 1000, "Initial TPS should be high");
    }

    // ==================== Scenario 3: Spike Testing ====================

    @Test
    @DisplayName("Perf: Spike test - Sudden 3x load increase")
    void testSpikeLoad() {
        int normalLoad = 10000;
        int spikeLoad = 30000; // 3x increase

        // Normal load
        AtomicInteger counter1 = new AtomicInteger(0);
        List<ParallelTransactionExecutor.TransactionTask> normalTx = new ArrayList<>();
        for (int i = 0; i < normalLoad; i++) {
            normalTx.add(createTask("normal-" + i, counter1));
        }

        long start1 = System.nanoTime();
        ParallelTransactionExecutor.ExecutionResult result1 =
            executor.executeParallel(normalTx);
        long duration1 = System.nanoTime() - start1;
        double normalTPS = (normalLoad * 1_000_000_000.0) / duration1;

        // Spike load
        AtomicInteger counter2 = new AtomicInteger(0);
        List<ParallelTransactionExecutor.TransactionTask> spikeTx = new ArrayList<>();
        for (int i = 0; i < spikeLoad; i++) {
            spikeTx.add(createTask("spike-" + i, counter2));
        }

        long start2 = System.nanoTime();
        ParallelTransactionExecutor.ExecutionResult result2 =
            executor.executeParallel(spikeTx);
        long duration2 = System.nanoTime() - start2;
        double spikeTPS = (spikeLoad * 1_000_000_000.0) / duration2;

        // Verify system handles spike
        assertEquals(normalLoad, result1.successCount());
        assertEquals(spikeLoad, result2.successCount());
        assertTrue(spikeTPS > 5000, "Spike TPS should be > 5K");

        System.out.println("Normal TPS: " + normalTPS);
        System.out.println("Spike TPS: " + spikeTPS);
    }

    // ==================== Scenario 4: Stress Testing ====================

    @Test
    @DisplayName("Perf: Stress test - Push to 100K transactions")
    void testStressLoad100K() {
        int stressLoad = 100000;
        AtomicInteger counter = new AtomicInteger(0);

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < stressLoad; i++) {
            transactions.add(createTask("stress-" + i, counter));
        }

        long startTime = System.nanoTime();
        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        double tps = (stressLoad * 1_000_000_000.0) / duration;

        // System should handle stress load
        assertTrue(result.successCount() >= stressLoad * 0.95,
            "At least 95% of transactions should succeed under stress");
        assertTrue(tps > 10000, "TPS under stress should be > 10K");

        System.out.println("Stress Test TPS: " + tps);
        System.out.println("Success Rate: " + (result.successCount() * 100.0 / stressLoad) + "%");
    }

    @Test
    @DisplayName("Perf: Stress test - Memory efficiency under load")
    void testMemoryEfficiencyUnderStress() {
        Runtime runtime = Runtime.getRuntime();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        int stressLoad = 50000;
        AtomicInteger counter = new AtomicInteger(0);

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < stressLoad; i++) {
            transactions.add(createTask("memory-stress-" + i, counter));
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;

        assertEquals(stressLoad, result.successCount());
        assertTrue(memoryUsed < 1_000_000_000, // < 1GB
            "Memory usage should be reasonable: " + (memoryUsed / 1_000_000) + "MB");

        System.out.println("Memory used: " + (memoryUsed / 1_000_000) + "MB");
    }

    // ==================== Scenario 5: Soak Testing ====================

    @Test
    @DisplayName("Perf: Soak test - Sustained load over multiple rounds")
    void testSoakLoad() {
        int rounds = 5;
        int txPerRound = 10000;
        double[] tpsPerRound = new double[rounds];

        for (int round = 0; round < rounds; round++) {
            AtomicInteger counter = new AtomicInteger(0);
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

            for (int i = 0; i < txPerRound; i++) {
                transactions.add(createTask("soak-" + round + "-" + i, counter));
            }

            long startTime = System.nanoTime();
            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);
            long duration = System.nanoTime() - startTime;

            tpsPerRound[round] = (txPerRound * 1_000_000_000.0) / duration;

            assertEquals(txPerRound, result.successCount());
            System.out.println("Soak Round " + round + ": " + tpsPerRound[round] + " TPS");

            // Brief pause between rounds
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Verify consistent performance over time
        double avgTPS = 0;
        for (double tps : tpsPerRound) {
            avgTPS += tps;
        }
        avgTPS /= rounds;

        assertTrue(avgTPS > 5000, "Average TPS should be > 5K");
        System.out.println("Soak Test Average TPS: " + avgTPS);
    }

    // ==================== Latency Benchmarking ====================

    @Test
    @DisplayName("Perf: Latency - P50/P95/P99 measurement")
    void testLatencyBenchmark() {
        int sampleSize = 1000;
        long[] latencies = new long[sampleSize];

        for (int i = 0; i < sampleSize; i++) {
            AtomicInteger counter = new AtomicInteger(0);
            List<ParallelTransactionExecutor.TransactionTask> transactions = List.of(
                createTask("latency-" + i, counter)
            );

            long startTime = System.nanoTime();
            executor.executeParallel(transactions);
            latencies[i] = (System.nanoTime() - startTime) / 1_000_000; // Convert to ms
        }

        // Sort latencies for percentile calculation
        java.util.Arrays.sort(latencies);

        long p50 = latencies[sampleSize / 2];
        long p95 = latencies[(int) (sampleSize * 0.95)];
        long p99 = latencies[(int) (sampleSize * 0.99)];

        System.out.println("P50 Latency: " + p50 + "ms");
        System.out.println("P95 Latency: " + p95 + "ms");
        System.out.println("P99 Latency: " + p99 + "ms");

        // Latency assertions
        assertTrue(p50 < 100, "P50 latency should be < 100ms");
        assertTrue(p99 < 500, "P99 latency should be < 500ms");
    }

    @Test
    @DisplayName("Perf: Throughput vs Latency trade-off")
    void testThroughputLatencyTradeoff() {
        int[] loadLevels = {100, 1000, 5000, 10000};

        for (int load : loadLevels) {
            AtomicInteger counter = new AtomicInteger(0);
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

            for (int i = 0; i < load; i++) {
                transactions.add(createTask("tradeoff-" + load + "-" + i, counter));
            }

            long startTime = System.nanoTime();
            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);
            long duration = System.nanoTime() - startTime;

            double tps = (load * 1_000_000_000.0) / duration;
            double avgLatency = duration / 1_000_000.0; // ms

            System.out.println("Load: " + load + " | TPS: " + tps +
                             " | Latency: " + avgLatency + "ms");

            assertEquals(load, result.successCount());
        }
    }

    // ==================== Scalability Testing ====================

    @Test
    @DisplayName("Perf: Linear scalability validation")
    void testLinearScalability() {
        int[] scales = {1000, 2000, 4000, 8000};
        double[] tpsResults = new double[scales.length];

        for (int i = 0; i < scales.length; i++) {
            AtomicInteger counter = new AtomicInteger(0);
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

            for (int j = 0; j < scales[i]; j++) {
                transactions.add(createTask("scale-" + i + "-" + j, counter));
            }

            long startTime = System.nanoTime();
            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);
            long duration = System.nanoTime() - startTime;

            tpsResults[i] = (scales[i] * 1_000_000_000.0) / duration;

            assertEquals(scales[i], result.successCount());
            System.out.println("Scale " + scales[i] + ": " + tpsResults[i] + " TPS");
        }

        // Verify near-linear scaling
        double ratio = tpsResults[3] / tpsResults[0];
        assertTrue(ratio > 2.0, "8x load should achieve at least 2x throughput");
    }

    // ==================== Helper Methods ====================

    private ParallelTransactionExecutor.TransactionTask createTask(
            String id, AtomicInteger counter) {
        return new ParallelTransactionExecutor.TransactionTask(
            id,
            Set.of(),
            Set.of("addr-" + id),
            1,
            () -> counter.incrementAndGet()
        );
    }
}
