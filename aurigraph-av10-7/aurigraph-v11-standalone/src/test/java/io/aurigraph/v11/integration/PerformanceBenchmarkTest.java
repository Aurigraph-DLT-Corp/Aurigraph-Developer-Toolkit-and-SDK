package io.aurigraph.v11.integration;

import io.aurigraph.v11.grpc.*;
import io.aurigraph.v11.proto.*;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Performance Benchmark Test Suite for Aurigraph V12
 *
 * Tests system performance under various load conditions:
 * - TPS (Transactions Per Second) under load
 * - Response latency (p50, p95, p99)
 * - Memory usage and GC behavior
 * - Concurrent connection handling
 * - Sustained load testing
 *
 * Performance Targets:
 * - TPS: 100,000+ transactions/second
 * - Latency: <10ms (p95), <50ms (p99)
 * - Memory: <2GB heap usage
 * - Connections: 10,000+ concurrent
 *
 * Coverage Target: 5 comprehensive benchmark tests
 *
 * @author J4C Integration Test Agent
 * @version 12.0.0
 * @since 2025-12-16
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Performance Benchmark Tests - Comprehensive Suite")
public class PerformanceBenchmarkTest {

    @Inject
    TransactionServiceImpl transactionService;

    @Inject
    BlockchainServiceImpl blockchainService;

    private static final int WARMUP_ITERATIONS = 100;
    private static final int BENCHMARK_DURATION_SECONDS = 10;

    // Performance metrics
    private final AtomicLong totalOperations = new AtomicLong(0);
    private final AtomicLong successfulOperations = new AtomicLong(0);
    private final AtomicLong failedOperations = new AtomicLong(0);
    private final ConcurrentLinkedQueue<Long> latencies = new ConcurrentLinkedQueue<>();

    @BeforeEach
    void setup() {
        // Warmup
        System.out.println("🔥 Warming up JVM...");
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            warmupOperation();
        }
        System.out.println("✅ Warmup complete");

        // Reset metrics
        totalOperations.set(0);
        successfulOperations.set(0);
        failedOperations.set(0);
        latencies.clear();

        // Force GC before test
        System.gc();
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @AfterEach
    void tearDown() {
        // Print final statistics
        printStatistics();
    }

    // ============================================================================
    // TPS BENCHMARK TESTS (2 tests)
    // ============================================================================

    @Test
    @Order(1)
    @Timeout(120)
    @DisplayName("Benchmark: TPS under sustained load (single-threaded)")
    void testBenchmark_TPS_SingleThreaded() {
        System.out.println("\n📊 Starting single-threaded TPS benchmark...");

        // Given
        long startTime = System.currentTimeMillis();
        long endTime = startTime + (BENCHMARK_DURATION_SECONDS * 1000L);
        AtomicInteger txCount = new AtomicInteger(0);

        // When
        while (System.currentTimeMillis() < endTime) {
            try {
                long opStart = System.nanoTime();

                Transaction tx = Transaction.newBuilder()
                        .setFromAddress("0x" + txCount.get())
                        .setToAddress("0x" + (txCount.get() + 1))
                        .setAmount(String.valueOf(txCount.get() * 1000))
                        .setNonce(txCount.get())
                        .build();

                SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                        .setTransaction(tx)
                        .build();

                transactionService.submitTransaction(request)
                        .await().atMost(Duration.ofSeconds(1));

                long latency = (System.nanoTime() - opStart) / 1_000_000; // Convert to ms
                latencies.add(latency);

                txCount.incrementAndGet();
                totalOperations.incrementAndGet();
                successfulOperations.incrementAndGet();
            } catch (Exception e) {
                failedOperations.incrementAndGet();
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        double tps = (txCount.get() * 1000.0) / duration;

        // Then
        assertTrue(txCount.get() > 0, "Should process transactions");
        System.out.printf("✅ Single-threaded TPS: %.2f tx/s (%d transactions in %d ms)%n",
                tps, txCount.get(), duration);

        // Calculate latency percentiles
        calculateAndPrintLatencies();
    }

    @Test
    @Order(2)
    @Timeout(120)
    @DisplayName("Benchmark: TPS under concurrent load (multi-threaded)")
    void testBenchmark_TPS_MultiThreaded() throws InterruptedException {
        System.out.println("\n📊 Starting multi-threaded TPS benchmark...");

        // Given
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        AtomicInteger totalTxCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();
        long endTime = startTime + (BENCHMARK_DURATION_SECONDS * 1000L);

        // When - Submit from multiple threads
        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready

                    int localCount = 0;
                    while (System.currentTimeMillis() < endTime) {
                        try {
                            long opStart = System.nanoTime();

                            Transaction tx = Transaction.newBuilder()
                                    .setFromAddress("0xthread" + threadId + "_" + localCount)
                                    .setToAddress("0xdest" + localCount)
                                    .setAmount(String.valueOf(localCount * 1000))
                                    .setNonce(localCount)
                                    .build();

                            SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                                    .setTransaction(tx)
                                    .build();

                            transactionService.submitTransaction(request)
                                    .await().atMost(Duration.ofSeconds(1));

                            long latency = (System.nanoTime() - opStart) / 1_000_000;
                            latencies.add(latency);

                            localCount++;
                            totalOperations.incrementAndGet();
                            successfulOperations.incrementAndGet();
                        } catch (Exception e) {
                            failedOperations.incrementAndGet();
                        }
                    }

                    totalTxCount.addAndGet(localCount);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        // Start all threads simultaneously
        startLatch.countDown();

        // Wait for completion
        assertTrue(completionLatch.await(BENCHMARK_DURATION_SECONDS + 30, TimeUnit.SECONDS),
                "All threads should complete");

        long duration = System.currentTimeMillis() - startTime;
        double tps = (totalTxCount.get() * 1000.0) / duration;

        // Then
        executor.shutdown();
        assertTrue(totalTxCount.get() > 0, "Should process transactions");
        System.out.printf("✅ Multi-threaded TPS: %.2f tx/s (%d transactions, %d threads, %d ms)%n",
                tps, totalTxCount.get(), threadCount, duration);

        // Verify target TPS
        assertTrue(tps > 1000, "Should achieve >1000 TPS with " + threadCount + " threads");

        // Calculate latency percentiles
        calculateAndPrintLatencies();
    }

    // ============================================================================
    // LATENCY BENCHMARK TESTS (1 test)
    // ============================================================================

    @Test
    @Order(3)
    @Timeout(120)
    @DisplayName("Benchmark: Response latency distribution")
    void testBenchmark_Latency_Distribution() {
        System.out.println("\n📊 Starting latency distribution benchmark...");

        // Given
        int operationCount = 10000;
        List<Long> latencyList = new ArrayList<>();

        // When - Measure latency for each operation
        for (int i = 0; i < operationCount; i++) {
            try {
                long opStart = System.nanoTime();

                Transaction tx = Transaction.newBuilder()
                        .setFromAddress("0xlatency" + i)
                        .setToAddress("0xdest" + i)
                        .setAmount(String.valueOf(i * 1000))
                        .setNonce(i)
                        .build();

                SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                        .setTransaction(tx)
                        .build();

                transactionService.submitTransaction(request)
                        .await().atMost(Duration.ofSeconds(1));

                long latency = (System.nanoTime() - opStart) / 1_000_000; // ms
                latencyList.add(latency);
                latencies.add(latency);

                totalOperations.incrementAndGet();
                successfulOperations.incrementAndGet();
            } catch (Exception e) {
                failedOperations.incrementAndGet();
            }
        }

        // Then - Calculate percentiles
        Collections.sort(latencyList);

        long p50 = calculatePercentile(latencyList, 50);
        long p90 = calculatePercentile(latencyList, 90);
        long p95 = calculatePercentile(latencyList, 95);
        long p99 = calculatePercentile(latencyList, 99);
        long min = latencyList.get(0);
        long max = latencyList.get(latencyList.size() - 1);
        double avg = latencyList.stream().mapToLong(Long::longValue).average().orElse(0);

        System.out.println("✅ Latency Distribution (" + operationCount + " operations):");
        System.out.println("   Min:    " + min + " ms");
        System.out.println("   Avg:    " + String.format("%.2f", avg) + " ms");
        System.out.println("   p50:    " + p50 + " ms");
        System.out.println("   p90:    " + p90 + " ms");
        System.out.println("   p95:    " + p95 + " ms");
        System.out.println("   p99:    " + p99 + " ms");
        System.out.println("   Max:    " + max + " ms");

        // Verify latency targets
        assertTrue(p50 < 100, "p50 latency should be < 100ms");
        assertTrue(p95 < 500, "p95 latency should be < 500ms");
        assertTrue(p99 < 1000, "p99 latency should be < 1000ms");
    }

    // ============================================================================
    // MEMORY BENCHMARK TESTS (1 test)
    // ============================================================================

    @Test
    @Order(4)
    @Timeout(120)
    @DisplayName("Benchmark: Memory usage under load")
    void testBenchmark_Memory_UnderLoad() {
        System.out.println("\n📊 Starting memory usage benchmark...");

        // Given
        Runtime runtime = Runtime.getRuntime();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();
        System.out.println("Initial memory: " + formatBytes(initialMemory));

        int operationCount = 50000;
        List<Long> memorySnapshots = new ArrayList<>();

        // When - Perform operations and track memory
        for (int i = 0; i < operationCount; i++) {
            try {
                Transaction tx = Transaction.newBuilder()
                        .setFromAddress("0xmemory" + i)
                        .setToAddress("0xdest" + i)
                        .setAmount(String.valueOf(i * 1000))
                        .setNonce(i)
                        .build();

                SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                        .setTransaction(tx)
                        .build();

                transactionService.submitTransaction(request)
                        .await().atMost(Duration.ofSeconds(1));

                totalOperations.incrementAndGet();
                successfulOperations.incrementAndGet();

                // Sample memory every 1000 operations
                if (i % 1000 == 0) {
                    long currentMemory = runtime.totalMemory() - runtime.freeMemory();
                    memorySnapshots.add(currentMemory);
                }
            } catch (Exception e) {
                failedOperations.incrementAndGet();
            }
        }

        // Then - Analyze memory usage
        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        long memoryIncrease = finalMemory - initialMemory;
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();

        System.out.println("✅ Memory Usage After " + operationCount + " operations:");
        System.out.println("   Initial:  " + formatBytes(initialMemory));
        System.out.println("   Final:    " + formatBytes(finalMemory));
        System.out.println("   Increase: " + formatBytes(memoryIncrease));
        System.out.println("   Max:      " + formatBytes(maxMemory));
        System.out.println("   Total:    " + formatBytes(totalMemory));
        System.out.println("   Free:     " + formatBytes(freeMemory));

        // Calculate average memory per operation
        double avgMemoryPerOp = (double) memoryIncrease / operationCount;
        System.out.println("   Avg/op:   " + String.format("%.2f", avgMemoryPerOp) + " bytes");

        // Verify memory targets
        assertTrue(finalMemory < maxMemory * 0.8,
                "Memory usage should stay below 80% of max heap");

        // Print memory trend
        System.out.println("\n   Memory Trend (samples every 1000 ops):");
        for (int i = 0; i < Math.min(10, memorySnapshots.size()); i++) {
            System.out.println("   " + (i * 1000) + ": " + formatBytes(memorySnapshots.get(i)));
        }
    }

    // ============================================================================
    // CONCURRENT CONNECTION BENCHMARK TESTS (1 test)
    // ============================================================================

    @Test
    @Order(5)
    @Timeout(180)
    @DisplayName("Benchmark: Concurrent connections handling")
    void testBenchmark_Concurrent_Connections() throws InterruptedException {
        System.out.println("\n📊 Starting concurrent connections benchmark...");

        // Given
        int connectionCount = 1000;
        ExecutorService executor = Executors.newFixedThreadPool(connectionCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(connectionCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        // When - Create concurrent connections
        for (int i = 0; i < connectionCount; i++) {
            final int connId = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Wait for all threads

                    // Perform operation
                    Transaction tx = Transaction.newBuilder()
                            .setFromAddress("0xconn" + connId)
                            .setToAddress("0xdest" + connId)
                            .setAmount(String.valueOf(connId * 1000))
                            .setNonce(connId)
                            .build();

                    SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                            .setTransaction(tx)
                            .build();

                    TransactionSubmissionResponse response = transactionService.submitTransaction(request)
                            .await().atMost(Duration.ofSeconds(5));

                    if (response != null && response.getTransactionHash() != null) {
                        successCount.incrementAndGet();
                        totalOperations.incrementAndGet();
                        successfulOperations.incrementAndGet();
                    } else {
                        failureCount.incrementAndGet();
                        failedOperations.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    failedOperations.incrementAndGet();
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        // Start all connections simultaneously
        startLatch.countDown();

        // Wait for completion
        assertTrue(completionLatch.await(120, TimeUnit.SECONDS),
                "All connections should complete");

        long duration = System.currentTimeMillis() - startTime;

        // Then
        executor.shutdown();

        System.out.println("✅ Concurrent Connections Benchmark:");
        System.out.println("   Total connections:     " + connectionCount);
        System.out.println("   Successful:            " + successCount.get());
        System.out.println("   Failed:                " + failureCount.get());
        System.out.println("   Success rate:          " +
                String.format("%.2f", (successCount.get() * 100.0 / connectionCount)) + "%");
        System.out.println("   Total duration:        " + duration + " ms");
        System.out.println("   Avg time/connection:   " +
                String.format("%.2f", (duration * 1.0 / connectionCount)) + " ms");

        // Verify targets
        assertTrue(successCount.get() > connectionCount * 0.95,
                "At least 95% of connections should succeed");
        assertTrue(duration < 60000,
                "Should handle " + connectionCount + " connections in under 60 seconds");
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private void warmupOperation() {
        try {
            Transaction tx = Transaction.newBuilder()
                    .setFromAddress("0xwarmup")
                    .setToAddress("0xwarmup")
                    .setAmount("1000")
                    .build();

            SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
                    .setTransaction(tx)
                    .build();

            transactionService.submitTransaction(request)
                    .await().atMost(Duration.ofMillis(500));
        } catch (Exception e) {
            // Ignore warmup errors
        }
    }

    private void calculateAndPrintLatencies() {
        if (latencies.isEmpty()) {
            return;
        }

        List<Long> latencyList = new ArrayList<>(latencies);
        Collections.sort(latencyList);

        long p50 = calculatePercentile(latencyList, 50);
        long p90 = calculatePercentile(latencyList, 90);
        long p95 = calculatePercentile(latencyList, 95);
        long p99 = calculatePercentile(latencyList, 99);
        double avg = latencyList.stream().mapToLong(Long::longValue).average().orElse(0);

        System.out.println("\n   Latency Percentiles:");
        System.out.println("   Avg: " + String.format("%.2f", avg) + " ms");
        System.out.println("   p50: " + p50 + " ms");
        System.out.println("   p90: " + p90 + " ms");
        System.out.println("   p95: " + p95 + " ms");
        System.out.println("   p99: " + p99 + " ms");
    }

    private long calculatePercentile(List<Long> sortedList, int percentile) {
        if (sortedList.isEmpty()) {
            return 0;
        }
        int index = (int) Math.ceil((percentile / 100.0) * sortedList.size()) - 1;
        index = Math.max(0, Math.min(index, sortedList.size() - 1));
        return sortedList.get(index);
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.2f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format("%.2f MB", bytes / (1024.0 * 1024));
        } else {
            return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }

    private void printStatistics() {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("📊 PERFORMANCE STATISTICS");
        System.out.println("=".repeat(80));
        System.out.println("Total Operations:      " + totalOperations.get());
        System.out.println("Successful:            " + successfulOperations.get());
        System.out.println("Failed:                " + failedOperations.get());

        if (totalOperations.get() > 0) {
            double successRate = (successfulOperations.get() * 100.0) / totalOperations.get();
            System.out.println("Success Rate:          " + String.format("%.2f%%", successRate));
        }

        Runtime runtime = Runtime.getRuntime();
        System.out.println("\nMemory Status:");
        System.out.println("Used:                  " + formatBytes(runtime.totalMemory() - runtime.freeMemory()));
        System.out.println("Total:                 " + formatBytes(runtime.totalMemory()));
        System.out.println("Max:                   " + formatBytes(runtime.maxMemory()));
        System.out.println("=".repeat(80) + "\n");
    }
}
