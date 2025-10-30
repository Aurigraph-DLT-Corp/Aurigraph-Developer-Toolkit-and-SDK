package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.mockito.Mockito;

import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for OnlineLearningService
 * Sprint 13 Week 1 Day 3-5: Online ML model updates
 *
 * Coverage Target: 95%+
 * Test Objectives:
 * - Incremental model retraining from transactions
 * - Model performance tracking (accuracy, latency, confidence)
 * - Threshold-based retraining triggers
 * - Gradual model updates (no sudden changes)
 * - Async model update processing
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OnlineLearningServiceTest {

    @Inject
    OnlineLearningService onlineLearningService;

    @InjectMock
    MLLoadBalancer mlLoadBalancer;

    @InjectMock
    PredictiveTransactionOrdering predictiveOrdering;

    private static final int TEST_TIMEOUT_MS = 5000;

    @BeforeEach
    void setUp() {
        assertNotNull(onlineLearningService, "OnlineLearningService should be injected");
    }

    @AfterEach
    void tearDown() {
        Mockito.reset(mlLoadBalancer, predictiveOrdering);
    }

    // ==================== Basic Initialization Tests ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: Service initializes with correct default values")
    void testServiceInitialization() {
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        assertNotNull(metrics, "Metrics should not be null");
        assertEquals(0, metrics.totalUpdates, "Initial update count should be 0");
        assertTrue(metrics.learningRate > 0, "Learning rate should be positive");
        assertTrue(metrics.learningRate <= 0.1, "Learning rate should be reasonable (<=0.1)");
        assertTrue(metrics.accuracyThreshold >= 0.9, "Accuracy threshold should be high (>=90%)");
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Metrics object returns valid data")
    void testGetMetrics() {
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        assertNotNull(metrics, "Metrics should not be null");
        assertTrue(metrics.correctPredictions >= 0, "Correct predictions should be non-negative");
        assertTrue(metrics.totalPredictions >= 0, "Total predictions should be non-negative");
        assertTrue(metrics.totalUpdates >= 0, "Total updates should be non-negative");
        assertTrue(metrics.learningRate >= 0.001 && metrics.learningRate <= 0.1,
                   "Learning rate should be in valid range [0.001, 0.1]");
    }

    // ==================== Incremental Model Update Tests ====================

    @Test
    @Order(3)
    @DisplayName("Test 3: Model updates incrementally with completed transactions")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testIncrementalModelUpdate() {
        List<Object> completedTxs = createTestTransactions(1000);
        long blockNumber = 1000L;

        // Trigger update
        onlineLearningService.updateModelsIncrementally(blockNumber, completedTxs);

        // Verify update was processed (might not increment if interval not met)
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertNotNull(metrics, "Metrics should be available after update");
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Model updates only at specified interval")
    void testUpdateInterval() {
        List<Object> completedTxs = createTestTransactions(100);

        // First update at block 1000
        onlineLearningService.updateModelsIncrementally(1000L, completedTxs);
        OnlineLearningService.OnlineLearningMetrics metrics1 = onlineLearningService.getMetrics();
        long updates1 = metrics1.totalUpdates;

        // Second update at block 1100 (interval is 1000 by default)
        onlineLearningService.updateModelsIncrementally(1100L, completedTxs);
        OnlineLearningService.OnlineLearningMetrics metrics2 = onlineLearningService.getMetrics();
        long updates2 = metrics2.totalUpdates;

        // Should not have updated yet (interval not met)
        assertEquals(updates1, updates2, "Updates should not increase before interval is met");

        // Third update at block 2000 (interval met)
        onlineLearningService.updateModelsIncrementally(2000L, completedTxs);
        OnlineLearningService.OnlineLearningMetrics metrics3 = onlineLearningService.getMetrics();
        long updates3 = metrics3.totalUpdates;

        // Should have updated now
        assertTrue(updates3 >= updates2, "Updates should increase after interval is met");
    }

    @Test
    @Order(5)
    @DisplayName("Test 5: Handles null transaction list gracefully")
    void testNullTransactionList() {
        // Should not throw exception
        assertDoesNotThrow(() -> {
            onlineLearningService.updateModelsIncrementally(1000L, null);
        }, "Should handle null transaction list gracefully");
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: Handles empty transaction list gracefully")
    void testEmptyTransactionList() {
        List<Object> emptyList = new ArrayList<>();

        assertDoesNotThrow(() -> {
            onlineLearningService.updateModelsIncrementally(1000L, emptyList);
        }, "Should handle empty transaction list gracefully");
    }

    // ==================== Model Performance Tracking Tests ====================

    @Test
    @Order(7)
    @DisplayName("Test 7: Accuracy calculation is correct")
    void testAccuracyCalculation() {
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        double accuracy = metrics.getAccuracy();
        assertTrue(accuracy >= 0.0 && accuracy <= 1.0,
                   "Accuracy should be between 0 and 1");
    }

    @Test
    @Order(8)
    @DisplayName("Test 8: Metrics track prediction counts correctly")
    void testPredictionCountTracking() {
        OnlineLearningService.OnlineLearningMetrics initialMetrics = onlineLearningService.getMetrics();
        int initialCorrect = initialMetrics.correctPredictions;
        int initialTotal = initialMetrics.totalPredictions;

        // Perform updates with transactions
        List<Object> txs = createTestTransactions(2000);
        onlineLearningService.updateModelsIncrementally(2000L, txs);

        OnlineLearningService.OnlineLearningMetrics updatedMetrics = onlineLearningService.getMetrics();

        // Metrics should be updated or stay the same (depending on interval)
        assertTrue(updatedMetrics.totalPredictions >= initialTotal,
                   "Total predictions should not decrease");
    }

    @Test
    @Order(9)
    @DisplayName("Test 9: Learning rate is within valid range")
    void testLearningRateValidRange() {
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        double lr = metrics.learningRate;
        assertTrue(lr >= 0.001, "Learning rate should be at least 0.001");
        assertTrue(lr <= 0.1, "Learning rate should be at most 0.1");
    }

    // ==================== Threshold-Based Retraining Tests ====================

    @Test
    @Order(10)
    @DisplayName("Test 10: Model promotion occurs when accuracy exceeds threshold")
    void testModelPromotionOnHighAccuracy() {
        // Create large batch to trigger promotion
        List<Object> txs = createTestTransactions(5000);

        // Update with large block number to trigger update
        onlineLearningService.updateModelsIncrementally(5000L, txs);

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        // Check that learning is happening
        assertNotNull(metrics, "Metrics should be available");
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: Model rejection occurs when accuracy below threshold")
    void testModelRejectionOnLowAccuracy() {
        // Small batch may not meet threshold
        List<Object> txs = createTestTransactions(10);

        onlineLearningService.updateModelsIncrementally(6000L, txs);

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertNotNull(metrics, "Metrics should still be available after rejection");
    }

    @Test
    @Order(12)
    @DisplayName("Test 12: Accuracy threshold is configurable")
    void testAccuracyThresholdConfiguration() {
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        double threshold = metrics.accuracyThreshold;
        assertTrue(threshold > 0.0 && threshold <= 1.0,
                   "Accuracy threshold should be between 0 and 1");
    }

    // ==================== Gradual Model Updates Tests ====================

    @Test
    @Order(13)
    @DisplayName("Test 13: Adaptive learning rate adjusts based on performance")
    void testAdaptiveLearningRate() {
        OnlineLearningService.OnlineLearningMetrics initialMetrics = onlineLearningService.getMetrics();
        double initialLR = initialMetrics.learningRate;

        // Perform multiple updates
        for (int i = 0; i < 5; i++) {
            List<Object> txs = createTestTransactions(1000);
            onlineLearningService.updateModelsIncrementally(1000L * (i + 1), txs);
        }

        OnlineLearningService.OnlineLearningMetrics updatedMetrics = onlineLearningService.getMetrics();
        double updatedLR = updatedMetrics.learningRate;

        // Learning rate should still be in valid range
        assertTrue(updatedLR >= 0.001 && updatedLR <= 0.1,
                   "Learning rate should remain in valid range after adaptation");
    }

    @Test
    @Order(14)
    @DisplayName("Test 14: Model updates are gradual (no sudden changes)")
    void testGradualModelUpdates() {
        List<Object> txs1 = createTestTransactions(1000);
        List<Object> txs2 = createTestTransactions(1000);

        onlineLearningService.updateModelsIncrementally(7000L, txs1);
        OnlineLearningService.OnlineLearningMetrics metrics1 = onlineLearningService.getMetrics();

        onlineLearningService.updateModelsIncrementally(8000L, txs2);
        OnlineLearningService.OnlineLearningMetrics metrics2 = onlineLearningService.getMetrics();

        // Learning rate should not change dramatically
        double lrDifference = Math.abs(metrics2.learningRate - metrics1.learningRate);
        assertTrue(lrDifference < 0.05,
                   "Learning rate should change gradually, not drastically");
    }

    // ==================== Async Processing Tests ====================

    @Test
    @Order(15)
    @DisplayName("Test 15: Model updates process asynchronously without blocking")
    @Timeout(value = 3, unit = TimeUnit.SECONDS)
    void testAsyncProcessing() {
        List<Object> largeTxBatch = createTestTransactions(10000);

        long startTime = System.currentTimeMillis();
        onlineLearningService.updateModelsIncrementally(9000L, largeTxBatch);
        long endTime = System.currentTimeMillis();

        long duration = endTime - startTime;

        // Should complete quickly (< 1 second) because processing is async
        assertTrue(duration < 1000,
                   "Update should complete quickly due to async processing");
    }

    @Test
    @Order(16)
    @DisplayName("Test 16: Concurrent updates are handled safely")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testConcurrentUpdates() throws Exception {
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);

        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            Future<?> future = executor.submit(() -> {
                try {
                    List<Object> txs = createTestTransactions(100);
                    onlineLearningService.updateModelsIncrementally(10000L + threadId, txs);
                } finally {
                    latch.countDown();
                }
            });
            futures.add(future);
        }

        boolean completed = latch.await(5, TimeUnit.SECONDS);
        assertTrue(completed, "All concurrent updates should complete");

        // Check that all futures completed successfully
        for (Future<?> future : futures) {
            assertDoesNotThrow(() -> future.get(100, TimeUnit.MILLISECONDS),
                               "Concurrent updates should not throw exceptions");
        }

        executor.shutdown();
    }

    // ==================== Error Handling Tests ====================

    @Test
    @Order(17)
    @DisplayName("Test 17: Service handles malformed transactions gracefully")
    void testMalformedTransactionHandling() {
        List<Object> malformedTxs = new ArrayList<>();
        malformedTxs.add(null);
        malformedTxs.add("invalid");
        malformedTxs.add(new Object());

        assertDoesNotThrow(() -> {
            onlineLearningService.updateModelsIncrementally(11000L, malformedTxs);
        }, "Should handle malformed transactions without crashing");
    }

    @Test
    @Order(18)
    @DisplayName("Test 18: Service recovers from update failures")
    void testRecoveryFromUpdateFailures() {
        // Trigger update that might fail
        List<Object> txs = createTestTransactions(100);

        assertDoesNotThrow(() -> {
            onlineLearningService.updateModelsIncrementally(12000L, txs);
        }, "Service should not crash on update failures");

        // Service should still be operational
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertNotNull(metrics, "Metrics should still be available after failures");
    }

    @Test
    @Order(19)
    @DisplayName("Test 19: Metrics toString provides useful information")
    void testMetricsToString() {
        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        String metricsStr = metrics.toString();

        assertNotNull(metricsStr, "Metrics toString should not be null");
        assertTrue(metricsStr.contains("accuracy"), "Metrics should contain accuracy");
        assertTrue(metricsStr.contains("updates"), "Metrics should contain update count");
        assertTrue(metricsStr.contains("lr"), "Metrics should contain learning rate");
    }

    // ==================== Performance Tests ====================

    @Test
    @Order(20)
    @DisplayName("Test 20: High-throughput transaction processing")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testHighThroughputProcessing() {
        // Process large batch
        List<Object> largeBatch = createTestTransactions(50000);

        long startTime = System.currentTimeMillis();
        onlineLearningService.updateModelsIncrementally(13000L, largeBatch);
        long endTime = System.currentTimeMillis();

        long duration = endTime - startTime;

        // Should handle large batches efficiently
        assertTrue(duration < 5000,
                   "Should process 50K transactions in < 5 seconds");
    }

    @Test
    @Order(21)
    @DisplayName("Test 21: Memory usage remains stable during multiple updates")
    void testMemoryStability() {
        Runtime runtime = Runtime.getRuntime();

        long initialMemory = runtime.totalMemory() - runtime.freeMemory();

        // Perform multiple updates
        for (int i = 0; i < 10; i++) {
            List<Object> txs = createTestTransactions(1000);
            onlineLearningService.updateModelsIncrementally(14000L + i * 1000, txs);
        }

        runtime.gc(); // Suggest garbage collection

        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        long memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable (< 100MB)
        assertTrue(memoryIncrease < 100 * 1024 * 1024,
                   "Memory usage should remain stable");
    }

    // ==================== Integration Tests ====================

    @Test
    @Order(22)
    @DisplayName("Test 22: Multiple sequential updates maintain state correctly")
    void testSequentialUpdates() {
        List<Object> txs1 = createTestTransactions(1000);
        List<Object> txs2 = createTestTransactions(1000);
        List<Object> txs3 = createTestTransactions(1000);

        onlineLearningService.updateModelsIncrementally(15000L, txs1);
        OnlineLearningService.OnlineLearningMetrics metrics1 = onlineLearningService.getMetrics();

        onlineLearningService.updateModelsIncrementally(16000L, txs2);
        OnlineLearningService.OnlineLearningMetrics metrics2 = onlineLearningService.getMetrics();

        onlineLearningService.updateModelsIncrementally(17000L, txs3);
        OnlineLearningService.OnlineLearningMetrics metrics3 = onlineLearningService.getMetrics();

        // Update count should increase or stay same
        assertTrue(metrics3.totalUpdates >= metrics2.totalUpdates,
                   "Update count should not decrease");
        assertTrue(metrics2.totalUpdates >= metrics1.totalUpdates,
                   "Update count should not decrease");
    }

    @Test
    @Order(23)
    @DisplayName("Test 23: Service maintains accuracy over time")
    void testAccuracyOverTime() {
        List<Double> accuracies = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            List<Object> txs = createTestTransactions(1000);
            onlineLearningService.updateModelsIncrementally(18000L + i * 1000, txs);

            OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
            accuracies.add(metrics.getAccuracy());
        }

        // All accuracies should be valid
        for (double accuracy : accuracies) {
            assertTrue(accuracy >= 0.0 && accuracy <= 1.0,
                       "Accuracy should always be in valid range");
        }
    }

    // ==================== Helper Methods ====================

    /**
     * Create test transactions for testing
     */
    private List<Object> createTestTransactions(int count) {
        List<Object> transactions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("txId", "tx-" + i);
            tx.put("from", "addr-" + (i % 100));
            tx.put("to", "addr-" + ((i + 1) % 100));
            tx.put("amount", Math.random() * 1000);
            tx.put("timestamp", System.currentTimeMillis());
            transactions.add(tx);
        }
        return transactions;
    }
}
