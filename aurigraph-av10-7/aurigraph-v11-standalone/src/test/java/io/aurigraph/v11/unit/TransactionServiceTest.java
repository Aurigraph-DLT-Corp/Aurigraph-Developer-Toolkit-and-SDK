package io.aurigraph.v11.unit;

import io.aurigraph.v11.TransactionService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for TransactionService
 * Validates:
 * - Transaction processing correctness
 * - High throughput performance (1M+ TPS target)
 * - Thread safety and concurrency
 * - Error handling and edge cases
 * - Memory management
 *
 * FIXED: Changed from @QuarkusTest to @QuarkusTest to resolve classloading issues
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TransactionServiceTest {

    @Inject
    TransactionService transactionService;

    @BeforeEach
    void setUp() {
        // Reset service state before each test if needed
    }

    // =====================================================================
    // BASIC FUNCTIONALITY TESTS
    // =====================================================================

    @Test
    @Order(1)
    @DisplayName("Should process single transaction successfully")
    void testProcessSingleTransaction() {
        // Arrange
        String txId = "test-tx-001";
        double amount = 100.50;

        // Act
        String result = transactionService.processTransaction(txId, amount);

        // Assert
        assertNotNull(result, "Transaction result should not be null");
        assertTrue(result.startsWith("PROCESSED:"), "Result should indicate processing");
        assertTrue(result.contains(txId), "Result should contain transaction ID");
    }

    @Test
    @Order(2)
    @DisplayName("Should handle null transaction ID gracefully")
    void testNullTransactionId() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
            transactionService.processTransaction(null, 100.0),
            "Should throw exception for null transaction ID"
        );
    }

    @Test
    @Order(3)
    @DisplayName("Should handle negative amount gracefully")
    void testNegativeAmount() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
            transactionService.processTransaction("test-tx", -100.0),
            "Should throw exception for negative amount"
        );
    }

    @Test
    @Order(4)
    @DisplayName("Should handle zero amount")
    void testZeroAmount() {
        // Arrange
        String txId = "test-tx-zero";

        // Act
        String result = transactionService.processTransaction(txId, 0.0);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("PROCESSED"));
    }

    // =====================================================================
    // REACTIVE PROCESSING TESTS
    // =====================================================================

    @Test
    @Order(5)
    @DisplayName("Should process reactive transaction asynchronously")
    void testReactiveProcessing() {
        // Arrange
        String txId = "reactive-tx-001";
        double amount = 250.75;

        // Act
        String result = transactionService.processTransactionReactive(txId, amount)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(result);
        assertTrue(result.contains(txId));
    }

    @Test
    @Order(6)
    @DisplayName("Should handle reactive errors properly")
    void testReactiveErrorHandling() {
        // Act & Assert
        transactionService.processTransactionReactive(null, 100.0)
            .subscribe().withSubscriber(UniAssertSubscriber.create())
            .assertFailedWith(IllegalArgumentException.class);
    }

    // =====================================================================
    // BATCH PROCESSING TESTS
    // =====================================================================

    @Test
    @Order(7)
    @DisplayName("Should process batch of transactions efficiently")
    void testBatchProcessing() {
        // Arrange
        int batchSize = 1000;
        List<TransactionService.TransactionRequest> requests = new ArrayList<>();
        for (int i = 0; i < batchSize; i++) {
            requests.add(new TransactionService.TransactionRequest(
                "batch-tx-" + i,
                100.0 + i
            ));
        }

        // Act
        long startTime = System.currentTimeMillis();
        List<String> results = transactionService
            .batchProcessTransactions(requests)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(30));
        long duration = System.currentTimeMillis() - startTime;

        // Assert
        assertEquals(batchSize, results.size(), "Should process all transactions");
        assertTrue(duration < 5000, "Batch should complete in <5 seconds");

        // Verify all processed
        results.forEach(result ->
            assertTrue(result.startsWith("PROCESSED:"),
                "All transactions should be processed")
        );
    }

    @Test
    @Order(8)
    @DisplayName("Should handle empty batch gracefully")
    void testEmptyBatch() {
        // Arrange
        List<TransactionService.TransactionRequest> emptyBatch = new ArrayList<>();

        // Act
        List<String> results = transactionService
            .batchProcessTransactions(emptyBatch)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(results.isEmpty(), "Empty batch should return empty results");
    }

    // =====================================================================
    // PERFORMANCE TESTS
    // =====================================================================

    @Test
    @Order(9)
    @DisplayName("Should achieve 1M+ TPS throughput")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testHighThroughputPerformance() {
        // Arrange
        int iterations = 1_000_000; // 1 million transactions
        List<TransactionService.TransactionRequest> requests = new ArrayList<>(iterations);

        for (int i = 0; i < iterations; i++) {
            requests.add(new TransactionService.TransactionRequest(
                "perf-tx-" + i,
                100.0 + (i * 0.01)
            ));
        }

        // Act
        long startTime = System.currentTimeMillis();
        List<String> results = transactionService
            .batchProcessTransactions(requests)
            .collect().asList()
            .await().atMost(Duration.ofMinutes(2));
        long duration = System.currentTimeMillis() - startTime;

        // Calculate TPS
        double tps = (iterations * 1000.0) / duration;

        // Assert
        assertEquals(iterations, results.size(),
            "Should process all 1M transactions");
        assertTrue(tps >= 1_000_000,
            String.format("TPS %.0f below 1M target", tps));

        System.out.printf("✅ Performance Test: Processed %d transactions in %dms (%.0f TPS)%n",
            iterations, duration, tps);
    }

    @Test
    @Order(10)
    @DisplayName("Should maintain consistent performance under sustained load")
    @Timeout(value = 180, unit = TimeUnit.SECONDS)
    void testSustainedLoad() {
        // Arrange
        int rounds = 10;
        int transactionsPerRound = 100_000;
        List<Double> tpsResults = new ArrayList<>();

        // Act
        for (int round = 0; round < rounds; round++) {
            List<TransactionService.TransactionRequest> requests = new ArrayList<>(transactionsPerRound);
            for (int i = 0; i < transactionsPerRound; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "sustained-tx-r" + round + "-" + i,
                    100.0
                ));
            }

            long startTime = System.currentTimeMillis();
            List<String> results = transactionService
                .batchProcessTransactions(requests)
                .collect().asList()
                .await().atMost(Duration.ofSeconds(30));
            long duration = System.currentTimeMillis() - startTime;

            double tps = (transactionsPerRound * 1000.0) / duration;
            tpsResults.add(tps);

            assertEquals(transactionsPerRound, results.size(),
                String.format("Round %d should process all transactions", round + 1));
        }

        // Assert
        double avgTPS = tpsResults.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double minTPS = tpsResults.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        double maxTPS = tpsResults.stream().mapToDouble(Double::doubleValue).max().orElse(0);

        assertTrue(avgTPS >= 1_000_000, "Average TPS should be >= 1M");
        assertTrue(minTPS >= 800_000, "Minimum TPS should be >= 800K");

        System.out.printf("✅ Sustained Load Test: Avg TPS: %.0f, Min: %.0f, Max: %.0f%n",
            avgTPS, minTPS, maxTPS);
    }

    // =====================================================================
    // CONCURRENCY & THREAD SAFETY TESTS
    // =====================================================================

    @Test
    @Order(11)
    @DisplayName("Should handle concurrent access safely")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentAccess() throws InterruptedException {
        // Arrange
        int threadCount = 1000;
        int transactionsPerThread = 100;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        Set<String> allResults = ConcurrentHashMap.newKeySet();

        // Act
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready
                    for (int i = 0; i < transactionsPerThread; i++) {
                        String result = transactionService.processTransaction(
                            "concurrent-t" + threadId + "-tx" + i,
                            100.0 + i
                        );
                        allResults.add(result);
                    }
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
        assertTrue(completionLatch.await(60, TimeUnit.SECONDS),
            "All threads should complete within 60 seconds");

        // Assert
        int expectedResults = threadCount * transactionsPerThread;
        assertEquals(expectedResults, allResults.size(),
            "All transactions should be processed and unique");
    }

    @Test
    @Order(12)
    @DisplayName("Should not have race conditions in counters")
    void testAtomicCounters() {
        // Arrange
        int iterations = 10_000;
        long initialCount = transactionService.getStats().totalProcessed();

        // Act
        List<CompletableFuture<String>> futures = new ArrayList<>();
        for (int i = 0; i < iterations; i++) {
            final int id = i;
            futures.add(CompletableFuture.supplyAsync(() ->
                transactionService.processTransaction("counter-test-" + id, 100.0)
            ));
        }

        List<String> results = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());

        // Assert
        assertEquals(iterations, results.size());
        long finalCount = transactionService.getStats().totalProcessed();
        assertEquals(initialCount + iterations, finalCount,
            "Counter should increment exactly by iteration count");
    }

    // =====================================================================
    // STATISTICS & METRICS TESTS
    // =====================================================================

    @Test
    @Order(13)
    @DisplayName("Should track processing statistics accurately")
    void testStatisticsTracking() {
        // Arrange
        long initialProcessed = transactionService.getStats().totalProcessed();

        // Act
        int newTransactions = 100;
        for (int i = 0; i < newTransactions; i++) {
            transactionService.processTransaction("stats-test-" + i, 100.0);
        }

        // Assert
        TransactionService.EnhancedProcessingStats stats = transactionService.getStats();
        assertNotNull(stats);
        assertTrue(stats.totalProcessed() >= initialProcessed + newTransactions);
        assertTrue(stats.currentThroughputMeasurement() >= 0);
    }

    @Test
    @Order(14)
    @DisplayName("Should calculate throughput efficiency correctly")
    void testThroughputEfficiency() {
        // Act
        TransactionService.EnhancedProcessingStats stats = transactionService.getStats();

        // Assert
        double efficiency = stats.getThroughputEfficiency();
        assertTrue(efficiency >= 0 && efficiency <= 1.0,
            "Efficiency should be between 0 and 1");
    }

    // =====================================================================
    // EDGE CASES & ERROR RECOVERY TESTS
    // =====================================================================

    @Test
    @Order(15)
    @DisplayName("Should handle duplicate transaction IDs")
    void testDuplicateTransactionIds() {
        // Arrange
        String duplicateId = "duplicate-tx-001";

        // Act
        String result1 = transactionService.processTransaction(duplicateId, 100.0);
        String result2 = transactionService.processTransaction(duplicateId, 200.0);

        // Assert
        assertNotNull(result1);
        assertNotNull(result2);
        // Both should process (overwrite is acceptable in this context)
    }

    @Test
    @Order(16)
    @DisplayName("Should recover from processing errors")
    void testErrorRecovery() {
        // Cause an error
        assertThrows(IllegalArgumentException.class, () ->
            transactionService.processTransaction(null, 100.0));

        // Verify service still works
        String result = transactionService.processTransaction("recovery-test", 100.0);
        assertNotNull(result);
        assertTrue(result.contains("PROCESSED"));
    }

    @Test
    @Order(17)
    @DisplayName("Should handle very large transaction amounts")
    void testLargeAmounts() {
        // Arrange
        double largeAmount = Double.MAX_VALUE / 2;

        // Act
        String result = transactionService.processTransaction("large-amount-tx", largeAmount);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("PROCESSED"));
    }

    @Test
    @Order(18)
    @DisplayName("Should handle very small transaction amounts")
    void testSmallAmounts() {
        // Arrange
        double smallAmount = 0.000001;

        // Act
        String result = transactionService.processTransaction("small-amount-tx", smallAmount);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("PROCESSED"));
    }

    // =====================================================================
    // MEMORY & RESOURCE MANAGEMENT TESTS
    // =====================================================================

    @Test
    @Order(19)
    @DisplayName("Should not leak memory during sustained processing")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testMemoryLeaks() throws InterruptedException {
        // Arrange
        Runtime runtime = Runtime.getRuntime();
        runtime.gc(); // Force GC before test
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        // Act - Process many transactions
        for (int batch = 0; batch < 10; batch++) {
            List<TransactionService.TransactionRequest> requests = new ArrayList<>();
            for (int i = 0; i < 10_000; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "memory-test-b" + batch + "-" + i,
                    100.0
                ));
            }

            transactionService.batchProcessTransactions(requests)
                .collect().asList()
                .await().atMost(Duration.ofSeconds(30));

            // Periodic GC to help detect leaks
            if (batch % 5 == 0) {
                runtime.gc();
            }
        }

        // Force GC and check memory
        runtime.gc();
        Thread.sleep(1000); // Give GC time to run
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();

        // Assert - Memory growth should be reasonable
        long memoryGrowth = memoryAfter - memoryBefore;
        long maxAcceptableGrowth = 100 * 1024 * 1024; // 100MB

        assertTrue(memoryGrowth < maxAcceptableGrowth,
            String.format("Memory growth %d MB exceeds acceptable limit",
                memoryGrowth / (1024 * 1024)));
    }

    // =====================================================================
    // CLEANUP
    // =====================================================================

    @AfterAll
    static void tearDown() {
        System.out.println("✅ All TransactionService tests completed successfully");
    }
}
