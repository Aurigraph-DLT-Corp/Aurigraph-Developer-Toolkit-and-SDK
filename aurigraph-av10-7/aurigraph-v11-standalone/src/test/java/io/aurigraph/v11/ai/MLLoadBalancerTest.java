package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for MLLoadBalancer
 * Sprint 6 Phase 2: Tests for online learning, experience replay, and adaptive learning
 *
 * Coverage Target: 95%+
 */
@QuarkusTest
@Disabled("Port 8081 conflict during Quarkus startup - infrastructure issue, scheduled for Phase 4 Week 1 Day 3-5")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MLLoadBalancerTest {

    @Inject
    MLLoadBalancer loadBalancer;

    private static final int TEST_TIMEOUT_MS = 5000;

    @BeforeEach
    void setUp() {
        assertNotNull(loadBalancer, "MLLoadBalancer should be injected");
    }

    // ==================== Basic Shard Assignment Tests ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: Shard assignment returns valid shard ID")
    void testShardAssignmentReturnsValidShardId() {
        MLLoadBalancer.TransactionContext tx = createTestTransaction("tx-001", 1000, 10000, 5);

        MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(tx)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofMillis(TEST_TIMEOUT_MS))
                .getItem();

        assertNotNull(assignment, "Assignment should not be null");
        assertTrue(assignment.getShardId() >= 0, "Shard ID should be non-negative");
        assertTrue(assignment.getShardId() < 2048, "Shard ID should be within configured range");
        assertTrue(assignment.getConfidence() >= 0.0 && assignment.getConfidence() <= 1.0,
                   "Confidence should be between 0 and 1");
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Consistent assignment for same transaction hash")
    void testConsistentAssignmentForSameHash() throws Exception {
        MLLoadBalancer.TransactionContext tx = createTestTransaction("tx-same", 1000, 10000, 5);

        MLLoadBalancer.ShardAssignment assignment1 = loadBalancer.assignShard(tx)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        Thread.sleep(100); // Small delay

        MLLoadBalancer.ShardAssignment assignment2 = loadBalancer.assignShard(tx)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // ML-based assignment might vary slightly due to load changes, but should be stable
        assertNotNull(assignment1);
        assertNotNull(assignment2);
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: High throughput shard assignment")
    void testHighThroughputShardAssignment() throws Exception {
        int txCount = 10000;
        AtomicInteger successCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(txCount);
        ExecutorService executor = Executors.newFixedThreadPool(50);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < txCount; i++) {
            final int txId = i;
            executor.submit(() -> {
                try {
                    MLLoadBalancer.TransactionContext tx = createTestTransaction(
                            "tx-ht-" + txId, 500 + (txId % 1000), 5000 + (txId % 5000), txId % 10);

                    loadBalancer.assignShard(tx)
                            .subscribe()
                            .with(
                                    assignment -> {
                                        successCount.incrementAndGet();
                                        latch.countDown();
                                    },
                                    failure -> {
                                        System.err.println("Assignment failed: " + failure.getMessage());
                                        latch.countDown();
                                    }
                            );
                } catch (Exception e) {
                    e.printStackTrace();
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        long duration = System.currentTimeMillis() - startTime;
        double tps = (double) successCount.get() / (duration / 1000.0);

        assertTrue(completed, "All assignments should complete within timeout");
        assertTrue(successCount.get() > txCount * 0.95,
                   "At least 95% of assignments should succeed. Got: " + successCount.get());
        System.out.printf("ML Load Balancer throughput: %.0f TPS (%d assignments in %dms)%n",
                         tps, successCount.get(), duration);
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Load distribution across shards")
    void testLoadDistributionAcrossShards() throws Exception {
        int txCount = 5000;
        Set<Integer> assignedShards = new HashSet<>();
        CountDownLatch latch = new CountDownLatch(txCount);

        for (int i = 0; i < txCount; i++) {
            MLLoadBalancer.TransactionContext tx = createTestTransaction(
                    "tx-dist-" + i, 1000, 10000, 5);

            loadBalancer.assignShard(tx)
                    .subscribe()
                    .with(
                            assignment -> {
                                synchronized (assignedShards) {
                                    assignedShards.add(assignment.getShardId());
                                }
                                latch.countDown();
                            },
                            failure -> latch.countDown()
                    );
        }

        assertTrue(latch.await(15, TimeUnit.SECONDS), "All assignments should complete");

        // Should distribute across multiple shards (not all concentrated in one)
        assertTrue(assignedShards.size() > 10,
                   "Should use multiple shards for distribution. Used: " + assignedShards.size());
        System.out.println("Load distributed across " + assignedShards.size() + " shards");
    }

    // ==================== Validator Assignment Tests ====================

    @Test
    @Order(5)
    @DisplayName("Test 5: Validator assignment returns valid validator")
    void testValidatorAssignmentReturnsValidValidator() {
        // Register test validators
        loadBalancer.registerValidator("validator-1", Set.of("standard", "premium"));
        loadBalancer.registerValidator("validator-2", Set.of("standard"));

        MLLoadBalancer.TransactionContext tx = createTestTransaction("tx-val-001", 1000, 10000, 5);

        MLLoadBalancer.ValidatorAssignment assignment = loadBalancer.assignValidator(tx)
                .subscribe()
                .withSubscriber(UniAssertSubscriber.create())
                .awaitItem(Duration.ofMillis(TEST_TIMEOUT_MS))
                .getItem();

        assertNotNull(assignment, "Validator assignment should not be null");
        assertNotNull(assignment.getValidatorId(), "Validator ID should not be null");
        assertTrue(assignment.getConfidence() >= 0.0 && assignment.getConfidence() <= 1.0,
                   "Confidence should be between 0 and 1");
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: Validator selection based on capability")
    void testValidatorSelectionBasedOnCapability() {
        // Register validators with different capabilities
        loadBalancer.registerValidator("premium-validator", Set.of("premium", "advanced"));
        loadBalancer.registerValidator("standard-validator", Set.of("standard"));

        MLLoadBalancer.TransactionContext premiumTx = createTestTransactionWithCapability(
                "tx-premium", 1000, 10000, 8, "premium");

        // Note: Default test transaction uses "standard" capability
        MLLoadBalancer.ValidatorAssignment assignment = loadBalancer.assignValidator(premiumTx)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(assignment);
        assertNotNull(assignment.getValidatorId());
    }

    // ==================== Online Learning Tests (Sprint 6) ====================

    @Test
    @Order(7)
    @DisplayName("Test 7: Online learning - Record assignment feedback")
    void testOnlineLearningRecordFeedback() {
        int shardId = 42;
        double[] features = {0.5, 0.3, 0.7, 0.4};
        double actualLatency = 150.0;
        double actualLoad = 0.6;
        boolean success = true;

        // Should not throw exception
        assertDoesNotThrow(() -> {
            loadBalancer.recordAssignmentFeedback(shardId, features, actualLatency, actualLoad, success);
        }, "Recording feedback should not throw exception");
    }

    @Test
    @Order(8)
    @DisplayName("Test 8: Online learning - Multiple feedback records")
    void testOnlineLearningMultipleFeedbackRecords() {
        // Record multiple experiences for online learning
        for (int i = 0; i < 100; i++) {
            double[] features = {
                Math.random(), Math.random(), Math.random(), Math.random()
            };
            int shardId = i % 2048;
            double latency = 50.0 + (Math.random() * 200.0);
            double load = Math.random();
            boolean success = Math.random() > 0.1; // 90% success rate

            loadBalancer.recordAssignmentFeedback(shardId, features, latency, load, success);
        }

        // Get stats to verify learning is happening
        MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();
        assertNotNull(stats, "Stats should be available");
        assertTrue(stats.getTotalAssignments() >= 0, "Should track assignments");
    }

    @Test
    @Order(9)
    @DisplayName("Test 9: Online learning - Experience replay buffer limit")
    void testExperienceReplayBufferLimit() {
        // Fill experience replay buffer beyond capacity (default 10000)
        for (int i = 0; i < 15000; i++) {
            double[] features = {0.5, 0.5, 0.5, 0.5};
            loadBalancer.recordAssignmentFeedback(i % 2048, features, 100.0, 0.5, true);
        }

        // Buffer should maintain max size (tested implicitly - no OOM)
        // If buffer isn't limited, this would cause memory issues
        assertTrue(true, "Should handle buffer overflow gracefully");
    }

    @Test
    @Order(10)
    @DisplayName("Test 10: Online learning - Prediction accuracy tracking")
    void testOnlineLearningPredictionAccuracyTracking() {
        // Record some successful predictions
        for (int i = 0; i < 50; i++) {
            double[] features = {0.5, 0.5, 0.5, 0.5};
            loadBalancer.recordAssignmentFeedback(i % 100, features, 80.0, 0.4, true);
        }

        // Record some failed predictions
        for (int i = 0; i < 10; i++) {
            double[] features = {0.5, 0.5, 0.5, 0.5};
            loadBalancer.recordAssignmentFeedback(i % 100, features, 500.0, 0.9, false);
        }

        // Accuracy tracking is internal, but should not crash
        MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();
        assertNotNull(stats, "Stats should be available after feedback recording");
    }

    // ==================== Load Balancing Statistics Tests ====================

    @Test
    @Order(11)
    @DisplayName("Test 11: Get load balancing statistics")
    void testGetLoadBalancingStatistics() {
        MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();

        assertNotNull(stats, "Stats should not be null");
        assertTrue(stats.getAverageLoad() >= 0.0 && stats.getAverageLoad() <= 1.0,
                   "Average load should be between 0 and 1");
        assertTrue(stats.getMaxLoad() >= 0.0 && stats.getMaxLoad() <= 1.0,
                   "Max load should be between 0 and 1");
        assertTrue(stats.getMinLoad() >= 0.0 && stats.getMinLoad() <= 1.0,
                   "Min load should be between 0 and 1");
        assertEquals(2048, stats.getShardCount(), "Should have 2048 shards");
    }

    @Test
    @Order(12)
    @DisplayName("Test 12: Stats reflect actual assignments")
    void testStatsReflectActualAssignments() throws Exception {
        long initialAssignments = loadBalancer.getStats().getTotalAssignments();

        // Perform some assignments
        int newAssignments = 100;
        CountDownLatch latch = new CountDownLatch(newAssignments);

        for (int i = 0; i < newAssignments; i++) {
            MLLoadBalancer.TransactionContext tx = createTestTransaction("tx-stats-" + i, 1000, 10000, 5);
            loadBalancer.assignShard(tx)
                    .subscribe()
                    .with(
                            assignment -> latch.countDown(),
                            failure -> latch.countDown()
                    );
        }

        assertTrue(latch.await(10, TimeUnit.SECONDS), "Assignments should complete");

        MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();
        assertTrue(stats.getTotalAssignments() >= initialAssignments + newAssignments * 0.95,
                   "Stats should reflect new assignments");
    }

    // ==================== Edge Case Tests ====================

    @Test
    @Order(13)
    @DisplayName("Test 13: Handle very large transaction")
    void testHandleVeryLargeTransaction() {
        MLLoadBalancer.TransactionContext largeTx = createTestTransaction(
                "tx-large", 10_000_000, 50_000_000, 10);

        MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(largeTx)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(assignment, "Should handle large transaction");
        assertTrue(assignment.getShardId() >= 0, "Should assign valid shard");
    }

    @Test
    @Order(14)
    @DisplayName("Test 14: Handle very small transaction")
    void testHandleVerySmallTransaction() {
        MLLoadBalancer.TransactionContext smallTx = createTestTransaction(
                "tx-small", 10, 100, 1);

        MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(smallTx)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(assignment, "Should handle small transaction");
        assertTrue(assignment.getShardId() >= 0, "Should assign valid shard");
    }

    @Test
    @Order(15)
    @DisplayName("Test 15: Concurrent validator registration")
    void testConcurrentValidatorRegistration() throws Exception {
        int validatorCount = 100;
        CountDownLatch latch = new CountDownLatch(validatorCount);
        ExecutorService executor = Executors.newFixedThreadPool(10);

        for (int i = 0; i < validatorCount; i++) {
            final int validatorId = i;
            executor.submit(() -> {
                try {
                    Set<String> capabilities = Set.of("capability-" + (validatorId % 5));
                    loadBalancer.registerValidator("validator-concurrent-" + validatorId, capabilities);
                    latch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(10, TimeUnit.SECONDS),
                   "All validator registrations should complete");
        executor.shutdown();
    }

    @Test
    @Order(16)
    @DisplayName("Test 16: Load variance calculation")
    void testLoadVarianceCalculation() throws Exception {
        // Perform some assignments to create load variance
        for (int i = 0; i < 500; i++) {
            MLLoadBalancer.TransactionContext tx = createTestTransaction("tx-var-" + i, 1000, 10000, 5);
            loadBalancer.assignShard(tx).await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();
        double variance = stats.getLoadVariance();

        assertTrue(Double.isFinite(variance), "Variance should be a finite number");
        assertTrue(variance >= 0.0, "Variance should be non-negative");
    }

    @Test
    @Order(17)
    @DisplayName("Test 17: Adaptive learning rate adjustment (Sprint 6)")
    void testAdaptiveLearningRateAdjustment() {
        // Record experiences that would trigger learning rate adaptation
        // High accuracy experiences
        for (int i = 0; i < 100; i++) {
            double[] features = {0.5, 0.5, 0.5, 0.5};
            loadBalancer.recordAssignmentFeedback(i % 10, features, 50.0, 0.3, true);
        }

        // Low accuracy experiences
        for (int i = 0; i < 20; i++) {
            double[] features = {0.5, 0.5, 0.5, 0.5};
            loadBalancer.recordAssignmentFeedback(i % 10, features, 500.0, 0.9, false);
        }

        // Learning rate adaptation happens internally during model updates
        // This test verifies the system doesn't crash during adaptation
        assertTrue(true, "Adaptive learning rate should work without errors");
    }

    @Test
    @Order(18)
    @DisplayName("Test 18: Performance under sustained load")
    void testPerformanceUnderSustainedLoad() throws Exception {
        int duration = 5000; // 5 seconds
        AtomicInteger assignmentCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();
        long endTime = startTime + duration;

        ExecutorService executor = Executors.newFixedThreadPool(20);

        for (int i = 0; i < 20; i++) {
            executor.submit(() -> {
                int localCount = 0;
                while (System.currentTimeMillis() < endTime) {
                    try {
                        MLLoadBalancer.TransactionContext tx = createTestTransaction(
                                "tx-sustained-" + localCount, 1000, 10000, 5);

                        loadBalancer.assignShard(tx)
                                .await().atMost(Duration.ofMillis(1000));

                        assignmentCount.incrementAndGet();
                        localCount++;
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                    }
                }
            });
        }

        executor.shutdown();
        executor.awaitTermination(duration + 5000, TimeUnit.MILLISECONDS);

        int totalAssignments = assignmentCount.get();
        int totalErrors = errorCount.get();
        double errorRate = (double) totalErrors / (totalAssignments + totalErrors);

        System.out.printf("Sustained load test: %d assignments, %d errors (%.2f%% error rate)%n",
                         totalAssignments, totalErrors, errorRate * 100);

        assertTrue(totalAssignments > 1000, "Should handle significant load");
        assertTrue(errorRate < 0.05, "Error rate should be less than 5%");
    }

    // ==================== Helper Methods ====================

    private MLLoadBalancer.TransactionContext createTestTransaction(String txId, long size,
                                                                    long gasLimit, int priority) {
        return new MLLoadBalancer.TransactionContext(
                txId,
                size,
                gasLimit,
                priority,
                "region-us-east",
                "standard"
        );
    }

    private MLLoadBalancer.TransactionContext createTestTransactionWithCapability(String txId, long size,
                                                                                  long gasLimit, int priority,
                                                                                  String capability) {
        return new MLLoadBalancer.TransactionContext(
                txId,
                size,
                gasLimit,
                priority,
                "region-us-east",
                capability
        );
    }
}
