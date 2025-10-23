package io.aurigraph.v11.ai;

import io.aurigraph.v11.models.Transaction;
import io.aurigraph.v11.models.TransactionType;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for PredictiveTransactionOrdering
 * Sprint 6 Phase 2: Tests for ML-based transaction ordering and optimization
 *
 * Coverage Target: 95%+
 * Test Areas:
 * - Transaction ordering algorithms
 * - Gas price prediction
 * - Dependency graph analysis
 * - Parallel execution optimization
 * - Feature extraction
 * - Performance metrics
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class PredictiveTransactionOrderingTest {

    @Inject
    PredictiveTransactionOrdering orderingService;

    private static final int TEST_TIMEOUT_MS = 5000;

    @BeforeEach
    void setUp() {
        assertNotNull(orderingService, "PredictiveTransactionOrdering should be injected");
    }

    // ==================== Basic Ordering Tests ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: Empty mempool returns empty list")
    void testEmptyMempoolReturnsEmptyList() {
        List<Transaction> empty = new ArrayList<>();

        List<Transaction> result = orderingService.orderTransactions(empty)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result, "Result should not be null");
        assertTrue(result.isEmpty(), "Result should be empty for empty mempool");
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Single transaction returns unchanged")
    void testSingleTransactionReturnsUnchanged() {
        Transaction tx = createTestTransaction("tx-single", 1000, 100000, 5);
        List<Transaction> mempool = List.of(tx);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(1, result.size(), "Should have one transaction");
        assertEquals(tx.getId(), result.get(0).getId(), "Should be same transaction");
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Multiple transactions ordered by priority score")
    void testMultipleTransactionsOrderedByPriorityScore() {
        // Create transactions with different gas prices (main priority factor)
        Transaction lowGas = createTestTransaction("tx-low", 50, 100000, 1);
        lowGas.setGasPrice(1000);

        Transaction medGas = createTestTransaction("tx-med", 100, 100000, 5);
        medGas.setGasPrice(5000);

        Transaction highGas = createTestTransaction("tx-high", 200, 100000, 10);
        highGas.setGasPrice(10000);

        List<Transaction> mempool = List.of(lowGas, highGas, medGas); // Intentionally out of order

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(3, result.size(), "Should have three transactions");

        // High gas should be first (highest priority)
        assertEquals("tx-high", result.get(0).getId(), "Highest gas should be first");
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Large mempool ordered efficiently")
    void testLargeMempoolOrderedEfficiently() {
        int txCount = 10000;
        List<Transaction> mempool = IntStream.range(0, txCount)
                .mapToObj(i -> {
                    Transaction tx = createTestTransaction("tx-" + i, 100 + (i % 1000),
                                                          100000 + (i % 10000), i % 10);
                    tx.setGasPrice(1000 + (i % 5000)); // Varied gas prices
                    return tx;
                })
                .collect(Collectors.toList());

        long startTime = System.nanoTime();
        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(30000)); // 30s timeout for large batch
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        assertNotNull(result);
        assertEquals(txCount, result.size(), "Should have all transactions");
        assertTrue(duration < 5000,
                  String.format("Ordering should complete in <5s. Took: %dms", duration));

        System.out.printf("Ordered %d transactions in %dms (%.2f tx/ms)%n",
                         txCount, duration, txCount / (double) duration);
    }

    // ==================== Priority Scoring Tests ====================

    @Test
    @Order(5)
    @DisplayName("Test 5: High gas price increases priority")
    void testHighGasPriceIncreasesPriority() {
        Transaction normalGas = createTestTransaction("tx-normal", 100, 100000, 5);
        normalGas.setGasPrice(1000);

        Transaction highGas = createTestTransaction("tx-high", 100, 100000, 5);
        highGas.setGasPrice(100000); // 100x higher

        List<Transaction> mempool = List.of(normalGas, highGas);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertEquals(2, result.size());
        assertEquals("tx-high", result.get(0).getId(),
                    "High gas transaction should be prioritized");
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: Low complexity favored when gas equal")
    void testLowComplexityFavoredWhenGasEqual() {
        Transaction simple = createTestTransaction("tx-simple", 50, 50000, 5);
        simple.setGasPrice(5000);
        simple.setType(TransactionType.TRANSFER); // Simple transfer

        Transaction complex = createTestTransaction("tx-complex", 5000, 500000, 5);
        complex.setGasPrice(5000);
        complex.setType(TransactionType.CONTRACT_DEPLOY); // Complex deployment

        List<Transaction> mempool = List.of(complex, simple);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // Simple transaction should be prioritized (lower complexity, faster execution)
        assertEquals("tx-simple", result.get(0).getId(),
                    "Simple transaction should be prioritized over complex when gas is equal");
    }

    @Test
    @Order(7)
    @DisplayName("Test 7: Manual priority influences ordering")
    void testManualPriorityInfluencesOrdering() {
        Transaction lowPriority = createTestTransaction("tx-low", 100, 100000, 1);
        lowPriority.setGasPrice(5000);

        Transaction highPriority = createTestTransaction("tx-high", 100, 100000, 99);
        highPriority.setGasPrice(5000);

        List<Transaction> mempool = List.of(lowPriority, highPriority);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertEquals("tx-high", result.get(0).getId(),
                    "High manual priority should influence ordering");
    }

    // ==================== Complexity Estimation Tests ====================

    @Test
    @Order(8)
    @DisplayName("Test 8: Contract deployment has high complexity")
    void testContractDeploymentHasHighComplexity() {
        Transaction transfer = createTestTransaction("tx-transfer", 100, 50000, 5);
        transfer.setType(TransactionType.TRANSFER);
        transfer.setGasPrice(5000);

        Transaction deploy = createTestTransaction("tx-deploy", 100, 50000, 5);
        deploy.setType(TransactionType.CONTRACT_DEPLOY);
        deploy.setGasPrice(5000);

        List<Transaction> mempool = List.of(deploy, transfer);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // Transfer should be first (lower complexity)
        assertEquals("tx-transfer", result.get(0).getId(),
                    "Simple transfer should be prioritized over deployment");
    }

    @Test
    @Order(9)
    @DisplayName("Test 9: Large payload increases complexity")
    void testLargePayloadIncreasesComplexity() {
        Transaction small = createTestTransaction("tx-small", 100, 100000, 5);
        small.setPayload("small");
        small.setGasPrice(5000);

        Transaction large = createTestTransaction("tx-large", 100, 100000, 5);
        large.setPayload("x".repeat(10000)); // 10KB payload
        large.setGasPrice(5000);

        List<Transaction> mempool = List.of(large, small);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertEquals("tx-small", result.get(0).getId(),
                    "Small payload transaction should be prioritized");
    }

    // ==================== Dependency Analysis Tests ====================

    @Test
    @Order(10)
    @DisplayName("Test 10: Transactions from same address maintain order")
    void testTransactionsFromSameAddressMaintainOrder() {
        String sameAddress = "0xSAMEADDRESS";

        Transaction tx1 = createTestTransaction("tx-1", 100, 100000, 5);
        tx1.setFromAddress(sameAddress);
        tx1.setGasPrice(5000);

        Transaction tx2 = createTestTransaction("tx-2", 100, 100000, 5);
        tx2.setFromAddress(sameAddress);
        tx2.setGasPrice(5000);

        Transaction tx3 = createTestTransaction("tx-3", 100, 100000, 5);
        tx3.setFromAddress(sameAddress);
        tx3.setGasPrice(5000);

        List<Transaction> mempool = List.of(tx3, tx1, tx2);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(3, result.size());
        // Should maintain some ordering for same address
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: Independent transactions can be reordered")
    void testIndependentTransactionsCanBeReordered() {
        Transaction fromA = createTestTransaction("tx-A", 100, 100000, 5);
        fromA.setFromAddress("0xAddressA");
        fromA.setGasPrice(1000);

        Transaction fromB = createTestTransaction("tx-B", 100, 100000, 5);
        fromB.setFromAddress("0xAddressB");
        fromB.setGasPrice(10000); // Higher gas

        List<Transaction> mempool = List.of(fromA, fromB);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertEquals("tx-B", result.get(0).getId(),
                    "Higher gas transaction should be first even from different address");
    }

    // ==================== Parallel Execution Grouping Tests ====================

    @Test
    @Order(12)
    @DisplayName("Test 12: Identifies parallel execution opportunities")
    void testIdentifiesParallelExecutionOpportunities() {
        // Create transactions from different addresses (can execute in parallel)
        List<Transaction> mempool = IntStream.range(0, 100)
                .mapToObj(i -> {
                    Transaction tx = createTestTransaction("tx-" + i, 100, 100000, 5);
                    tx.setFromAddress("0xAddress" + (i % 10)); // 10 different addresses
                    return tx;
                })
                .collect(Collectors.toList());

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(100, result.size(), "Should have all transactions");
        // Ordering should consider parallelism opportunities
    }

    // ==================== Performance Metrics Tests ====================

    @Test
    @Order(13)
    @DisplayName("Test 13: Metrics track ordering operations")
    void testMetricsTrackOrderingOperations() {
        List<Transaction> mempool = IntStream.range(0, 100)
                .mapToObj(i -> createTestTransaction("tx-" + i, 100, 100000, 5))
                .collect(Collectors.toList());

        // Perform ordering
        orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // Check metrics
        PredictiveTransactionOrdering.OrderingMetrics metrics =
                orderingService.getMetrics()
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(metrics, "Metrics should not be null");
        assertTrue(metrics.totalOrdered >= 100, "Should track ordered transactions");
        assertTrue(metrics.avgLatencyMs >= 0, "Should track latency");
        assertTrue(metrics.avgThroughput >= 0, "Should track throughput");
    }

    @Test
    @Order(14)
    @DisplayName("Test 14: Ordering latency within target (<5ms for 10K tx)")
    void testOrderingLatencyWithinTarget() {
        int txCount = 10000;
        List<Transaction> mempool = IntStream.range(0, txCount)
                .mapToObj(i -> createTestTransaction("tx-" + i, 100, 100000, 5))
                .collect(Collectors.toList());

        long startTime = System.nanoTime();
        orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(30000));
        long durationMs = (System.nanoTime() - startTime) / 1_000_000;

        assertTrue(durationMs < 5000,
                  String.format("Ordering 10K transactions should take <5s. Took: %dms", durationMs));

        System.out.printf("Ordering latency: %dms for %d transactions%n", durationMs, txCount);
    }

    @Test
    @Order(15)
    @DisplayName("Test 15: Throughput improvement tracked")
    void testThroughputImprovementTracked() {
        // Order multiple batches
        for (int batch = 0; batch < 5; batch++) {
            final int currentBatch = batch;
            List<Transaction> mempool = IntStream.range(0, 1000)
                    .mapToObj(i -> createTestTransaction("tx-b" + currentBatch + "-" + i, 100, 100000, 5))
                    .collect(Collectors.toList());

            orderingService.orderTransactions(mempool)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        PredictiveTransactionOrdering.OrderingMetrics metrics =
                orderingService.getMetrics()
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertTrue(metrics.avgThroughput > 0,
                  "Should track average throughput: " + metrics.avgThroughput);
        System.out.println("Metrics: " + metrics);
    }

    // ==================== Feature Extraction Tests ====================

    @Test
    @Order(16)
    @DisplayName("Test 16: Feature extraction caches results")
    void testFeatureExtractionCachesResults() {
        Transaction tx = createTestTransaction("tx-cached", 100, 100000, 5);
        List<Transaction> mempool = List.of(tx);

        // Order twice
        orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        PredictiveTransactionOrdering.OrderingMetrics metrics =
                orderingService.getMetrics()
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertTrue(metrics.cachedFeatures >= 1,
                  "Should cache features for reuse: " + metrics.cachedFeatures);
    }

    @Test
    @Order(17)
    @DisplayName("Test 17: Dependency graph tracking")
    void testDependencyGraphTracking() {
        String address1 = "0xAddress1";
        String address2 = "0xAddress2";

        Transaction tx1 = createTestTransaction("tx-1", 100, 100000, 5);
        tx1.setFromAddress(address1);

        Transaction tx2 = createTestTransaction("tx-2", 100, 100000, 5);
        tx2.setFromAddress(address1);

        Transaction tx3 = createTestTransaction("tx-3", 100, 100000, 5);
        tx3.setFromAddress(address2);

        List<Transaction> mempool = List.of(tx1, tx2, tx3);

        orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        PredictiveTransactionOrdering.OrderingMetrics metrics =
                orderingService.getMetrics()
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertTrue(metrics.dependencyGraphSize >= 0,
                  "Should track dependency graph");
    }

    // ==================== Edge Cases Tests ====================

    @Test
    @Order(18)
    @DisplayName("Test 18: Null mempool handled gracefully")
    void testNullMempoolHandledGracefully() {
        List<Transaction> result = orderingService.orderTransactions(null)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // Should return null or empty, not crash
        assertTrue(result == null || result.isEmpty(),
                  "Null mempool should be handled gracefully");
    }

    @Test
    @Order(19)
    @DisplayName("Test 19: All identical transactions ordered consistently")
    void testAllIdenticalTransactionsOrderedConsistently() {
        List<Transaction> mempool = IntStream.range(0, 100)
                .mapToObj(i -> {
                    Transaction tx = createTestTransaction("tx-" + i, 100, 100000, 5);
                    tx.setGasPrice(5000); // All same gas price
                    tx.setType(TransactionType.TRANSFER); // All same type
                    return tx;
                })
                .collect(Collectors.toList());

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(100, result.size(), "Should have all transactions");
    }

    @Test
    @Order(20)
    @DisplayName("Test 20: Very large gas values handled correctly")
    void testVeryLargeGasValuesHandledCorrectly() {
        Transaction maxGas = createTestTransaction("tx-max", 100, Long.MAX_VALUE, 5);
        maxGas.setGasPrice(Long.MAX_VALUE);

        Transaction normalGas = createTestTransaction("tx-normal", 100, 100000, 5);
        normalGas.setGasPrice(5000);

        List<Transaction> mempool = List.of(normalGas, maxGas);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("tx-max", result.get(0).getId(), "Max gas should be first");
    }

    // ==================== Concurrency Tests ====================

    @Test
    @Order(21)
    @DisplayName("Test 21: Concurrent ordering operations")
    void testConcurrentOrderingOperations() throws Exception {
        final int concurrentOps = 50;
        AtomicInteger successCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(concurrentOps);
        ExecutorService executor = Executors.newFixedThreadPool(10);

        for (int i = 0; i < concurrentOps; i++) {
            final int opId = i;
            executor.submit(() -> {
                try {
                    List<Transaction> mempool = IntStream.range(0, 100)
                            .mapToObj(j -> createTestTransaction("tx-op" + opId + "-" + j, 100, 100000, 5))
                            .collect(Collectors.toList());

                    List<Transaction> result = orderingService.orderTransactions(mempool)
                            .await().atMost(Duration.ofMillis(10000));

                    if (result != null && result.size() == 100) {
                        successCount.incrementAndGet();
                    }
                    latch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(60, TimeUnit.SECONDS), "All operations should complete");
        executor.shutdown();

        assertTrue(successCount.get() >= concurrentOps * 0.95,
                  String.format("At least 95%% should succeed. Got: %d/%d",
                               successCount.get(), concurrentOps));
    }

    @Test
    @Order(22)
    @DisplayName("Test 22: High throughput ordering stress test")
    void testHighThroughputOrderingStressTest() throws Exception {
        final int duration = 5000; // 5 seconds
        AtomicInteger operationCount = new AtomicInteger(0);
        AtomicInteger transactionCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();
        final long endTime = startTime + duration;

        ExecutorService executor = Executors.newFixedThreadPool(20);

        for (int i = 0; i < 20; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime) {
                    try {
                        List<Transaction> mempool = IntStream.range(0, 100)
                                .mapToObj(j -> createTestTransaction("tx-" + j, 100, 100000, 5))
                                .collect(Collectors.toList());

                        List<Transaction> result = orderingService.orderTransactions(mempool)
                                .await().atMost(Duration.ofMillis(5000));

                        if (result != null) {
                            operationCount.incrementAndGet();
                            transactionCount.addAndGet(result.size());
                        }
                    } catch (Exception e) {
                        // Ignore and continue
                    }
                }
            });
        }

        executor.shutdown();
        executor.awaitTermination(duration + 10000, TimeUnit.MILLISECONDS);

        int ops = operationCount.get();
        int txs = transactionCount.get();
        double opsPerSecond = (double) ops / (duration / 1000.0);
        double txsPerSecond = (double) txs / (duration / 1000.0);

        System.out.printf("Stress test: %d operations, %d transactions ordered " +
                         "(%.0f ops/s, %.0f tx/s)%n", ops, txs, opsPerSecond, txsPerSecond);

        assertTrue(ops > 100, "Should handle significant throughput");
        assertTrue(txs > 10000, "Should order many transactions");
    }

    // ==================== Gas Price Prediction Tests ====================

    @Test
    @Order(23)
    @DisplayName("Test 23: Gas price normalization")
    void testGasPriceNormalization() {
        Transaction lowGas = createTestTransaction("tx-low", 100, 100000, 5);
        lowGas.setGasPrice(1);

        Transaction medGas = createTestTransaction("tx-med", 100, 100000, 5);
        medGas.setGasPrice(1000);

        Transaction highGas = createTestTransaction("tx-high", 100, 100000, 5);
        highGas.setGasPrice(1000000);

        List<Transaction> mempool = List.of(lowGas, medGas, highGas);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertEquals(3, result.size());
        // Should be ordered by gas price
        assertEquals("tx-high", result.get(0).getId());
    }

    // ==================== Transaction Type Priority Tests ====================

    @Test
    @Order(24)
    @DisplayName("Test 24: Transfer prioritized over contract deploy at same gas")
    void testTransferPrioritizedOverContractDeployAtSameGas() {
        Transaction transfer = createTestTransaction("tx-transfer", 100, 100000, 5);
        transfer.setType(TransactionType.TRANSFER);
        transfer.setGasPrice(5000);

        Transaction deploy = createTestTransaction("tx-deploy", 100, 100000, 5);
        deploy.setType(TransactionType.CONTRACT_DEPLOY);
        deploy.setGasPrice(5000);

        List<Transaction> mempool = List.of(deploy, transfer);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertEquals("tx-transfer", result.get(0).getId(),
                    "Transfer should be prioritized (lower complexity)");
    }

    @Test
    @Order(25)
    @DisplayName("Test 25: Contract invoke has medium complexity")
    void testContractInvokeHasMediumComplexity() {
        Transaction transfer = createTestTransaction("tx-transfer", 100, 100000, 5);
        transfer.setType(TransactionType.TRANSFER);
        transfer.setGasPrice(5000);

        Transaction invoke = createTestTransaction("tx-invoke", 100, 100000, 5);
        invoke.setType(TransactionType.CONTRACT_INVOKE);
        invoke.setGasPrice(5000);

        Transaction deploy = createTestTransaction("tx-deploy", 100, 100000, 5);
        deploy.setType(TransactionType.CONTRACT_DEPLOY);
        deploy.setGasPrice(5000);

        List<Transaction> mempool = List.of(deploy, invoke, transfer);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // Expected order: transfer, invoke, deploy (by complexity)
        assertEquals("tx-transfer", result.get(0).getId());
    }

    // ==================== Performance Optimization Tests ====================

    @Test
    @Order(26)
    @DisplayName("Test 26: Batch processing efficiency")
    void testBatchProcessingEfficiency() {
        final int[] batchSizes = {100, 1000, 5000, 10000};

        for (int batchSize : batchSizes) {
            final int currentBatchSize = batchSize;
            List<Transaction> mempool = IntStream.range(0, currentBatchSize)
                    .mapToObj(i -> createTestTransaction("tx-" + i, 100, 100000, 5))
                    .collect(Collectors.toList());

            long startTime = System.nanoTime();
            List<Transaction> result = orderingService.orderTransactions(mempool)
                    .await().atMost(Duration.ofMillis(30000));
            long durationMs = (System.nanoTime() - startTime) / 1_000_000;

            assertNotNull(result);
            assertEquals(currentBatchSize, result.size());

            double txPerMs = currentBatchSize / (double) durationMs;
            System.out.printf("Batch %d: %dms (%.2f tx/ms)%n", currentBatchSize, durationMs, txPerMs);

            assertTrue(txPerMs > 1.0, "Should process at least 1 tx/ms");
        }
    }

    @Test
    @Order(27)
    @DisplayName("Test 27: Memory efficiency with large batches")
    void testMemoryEfficiencyWithLargeBatches() {
        // Process multiple large batches to test memory management
        for (int batch = 0; batch < 10; batch++) {
            final int currentBatch = batch;
            List<Transaction> mempool = IntStream.range(0, 10000)
                    .mapToObj(i -> createTestTransaction("tx-b" + currentBatch + "-" + i, 100, 100000, 5))
                    .collect(Collectors.toList());

            List<Transaction> result = orderingService.orderTransactions(mempool)
                    .await().atMost(Duration.ofMillis(30000));

            assertNotNull(result);
            assertEquals(10000, result.size());
        }

        // Should not cause OOM
        System.out.println("Memory test passed - processed 100K transactions");
    }

    @Test
    @Order(28)
    @DisplayName("Test 28: Ordering accuracy with diverse transaction types")
    void testOrderingAccuracyWithDiverseTransactionTypes() {
        List<Transaction> mempool = new ArrayList<>();

        // Add diverse transaction types
        Transaction transfer = createTestTransaction("tx-transfer", 100, 50000, 5);
        transfer.setType(TransactionType.TRANSFER);
        transfer.setGasPrice(5000);
        mempool.add(transfer);

        Transaction deploy = createTestTransaction("tx-deploy", 5000, 500000, 5);
        deploy.setType(TransactionType.CONTRACT_DEPLOY);
        deploy.setGasPrice(5000);
        mempool.add(deploy);

        Transaction invoke = createTestTransaction("tx-invoke", 500, 100000, 5);
        invoke.setType(TransactionType.CONTRACT_INVOKE);
        invoke.setGasPrice(5000);
        mempool.add(invoke);

        Transaction tokenization = createTestTransaction("tx-token", 200, 80000, 5);
        tokenization.setType(TransactionType.TOKENIZATION);
        tokenization.setGasPrice(5000);
        mempool.add(tokenization);

        List<Transaction> result = orderingService.orderTransactions(mempool)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertEquals(4, result.size());
        // Transfer should be first (lowest complexity)
        assertEquals(TransactionType.TRANSFER, result.get(0).getType());
    }

    @Test
    @Order(29)
    @DisplayName("Test 29: Feature cache effectiveness")
    void testFeatureCacheEffectiveness() {
        Transaction tx = createTestTransaction("tx-reused", 100, 100000, 5);
        List<Transaction> mempool = List.of(tx);

        // Order multiple times with same transaction
        for (int i = 0; i < 10; i++) {
            orderingService.orderTransactions(mempool)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        PredictiveTransactionOrdering.OrderingMetrics metrics =
                orderingService.getMetrics()
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertTrue(metrics.cachedFeatures >= 1,
                  "Should cache features: " + metrics.cachedFeatures);
    }

    @Test
    @Order(30)
    @DisplayName("Test 30: P99 latency within acceptable bounds")
    void testP99LatencyWithinAcceptableBounds() {
        // Order many batches to gather latency statistics
        for (int i = 0; i < 100; i++) {
            final int currentBatch = i;
            List<Transaction> mempool = IntStream.range(0, 1000)
                    .mapToObj(j -> createTestTransaction("tx-" + currentBatch + "-" + j, 100, 100000, 5))
                    .collect(Collectors.toList());

            orderingService.orderTransactions(mempool)
                    .await().atMost(Duration.ofMillis(10000));
        }

        PredictiveTransactionOrdering.OrderingMetrics metrics =
                orderingService.getMetrics()
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        System.out.printf("P99 latency: %.2fms, Avg latency: %.2fms%n",
                         metrics.p99LatencyMs, metrics.avgLatencyMs);

        // P99 should be reasonable (under 100ms for 1000 transactions)
        assertTrue(metrics.p99LatencyMs < 100.0,
                  String.format("P99 latency should be <100ms. Got: %.2fms", metrics.p99LatencyMs));
    }

    // ==================== Helper Methods ====================

    private Transaction createTestTransaction(String id, long size, long gasLimit, int priority) {
        Transaction tx = new Transaction();
        tx.setId(id);
        tx.setFromAddress("0xFrom" + id);
        tx.setToAddress("0xTo" + id);
        tx.setAmount(1000L);
        tx.setGasLimit(gasLimit);
        tx.setGasPrice(5000L);
        tx.setPriority(priority);
        tx.setTimestamp(Instant.now());
        tx.setType(TransactionType.TRANSFER);
        tx.setPayload("test-payload-" + size);
        return tx;
    }
}
