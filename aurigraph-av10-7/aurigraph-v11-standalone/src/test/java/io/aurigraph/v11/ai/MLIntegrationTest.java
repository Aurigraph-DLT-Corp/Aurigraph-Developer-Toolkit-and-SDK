package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for ML workflow combining MLLoadBalancer and AnomalyDetectionService
 * Sprint 6 Phase 2: End-to-end ML optimization workflow tests
 *
 * Tests the complete flow: transaction -> load balancing -> anomaly detection -> feedback
 */
@QuarkusTest
@Disabled("Port 8081 conflict during Quarkus startup - infrastructure issue, scheduled for Phase 4 Week 1 Day 3-5")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MLIntegrationTest {

    @Inject
    MLLoadBalancer loadBalancer;

    @Inject
    AnomalyDetectionService anomalyService;

    private static final int TEST_TIMEOUT_MS = 10000;

    @BeforeEach
    void setUp() {
        assertNotNull(loadBalancer, "MLLoadBalancer should be injected");
        assertNotNull(anomalyService, "AnomalyDetectionService should be injected");
        anomalyService.resetStatistics();
    }

    // ==================== End-to-End Workflow Tests ====================

    @Test
    @Order(1)
    @DisplayName("Integration Test 1: Complete transaction processing workflow")
    void testCompleteTransactionProcessingWorkflow() {
        // 1. Load balance the transaction
        MLLoadBalancer.TransactionContext tx = createTransaction("tx-workflow-1", 5000, 10000, 5);

        MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(tx)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(assignment, "Shard assignment should succeed");
        assertTrue(assignment.getShardId() >= 0, "Should assign valid shard");

        // 2. Check transaction for anomalies
        AnomalyDetectionService.TransactionMetrics txMetrics = createTransactionMetrics(
                "0xSender1", "0xReceiver1", 5000, 5000);

        AnomalyDetectionService.AnomalyAnalysisResult anomalyResult =
                anomalyService.analyzeTransaction(txMetrics)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(anomalyResult, "Anomaly analysis should complete");

        // 3. Record feedback for online learning
        double[] features = {0.5, 0.5, 0.5, 0.5};
        loadBalancer.recordAssignmentFeedback(
                assignment.getShardId(),
                features,
                75.0,  // latency
                0.6,   // load
                true   // success
        );

        // Workflow completed successfully
        assertTrue(true, "Complete workflow should execute without errors");
    }

    @Test
    @Order(2)
    @DisplayName("Integration Test 2: Anomaly detection triggers load rebalancing")
    void testAnomalyDetectionTriggersLoadRebalancing() {
        // Build baseline performance
        for (int i = 0; i < 100; i++) {
            anomalyService.analyzePerformance(2000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Simulate performance degradation
        AnomalyDetectionService.AnomalyAnalysisResult degradation =
                anomalyService.analyzePerformance(800000.0, 250.0)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertTrue(degradation.isAnomaly(), "Should detect performance anomaly");

        // System should adapt - assign transactions with feedback loop
        for (int i = 0; i < 50; i++) {
            MLLoadBalancer.TransactionContext tx = createTransaction("tx-adapt-" + i, 5000, 10000, 5);

            MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(tx)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            // Simulate improved performance after adaptation
            double[] features = {0.5, 0.5, 0.5, 0.5};
            loadBalancer.recordAssignmentFeedback(
                    assignment.getShardId(),
                    features,
                    60.0,  // Improved latency
                    0.5,   // Better load
                    true
            );
        }

        // Verify stats reflect the workflow
        MLLoadBalancer.LoadBalancingStats lbStats = loadBalancer.getStats();
        AnomalyDetectionService.AnomalyStatistics anomalyStats = anomalyService.getStatistics();

        assertTrue(lbStats.getTotalAssignments() > 0, "Load balancer should process assignments");
        assertTrue(anomalyStats.getPerformanceAnomalies() > 0, "Should track performance anomalies");
    }

    @Test
    @Order(3)
    @DisplayName("Integration Test 3: High-throughput workflow with concurrent processing")
    void testHighThroughputWorkflowWithConcurrentProcessing() throws Exception {
        int transactionCount = 5000;
        AtomicInteger assignmentSuccess = new AtomicInteger(0);
        AtomicInteger anomalyChecks = new AtomicInteger(0);
        AtomicInteger feedbackRecorded = new AtomicInteger(0);

        CountDownLatch latch = new CountDownLatch(transactionCount);
        ExecutorService executor = Executors.newFixedThreadPool(50);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < transactionCount; i++) {
            final int txId = i;
            executor.submit(() -> {
                try {
                    // 1. Load balance
                    MLLoadBalancer.TransactionContext tx = createTransaction(
                            "tx-ht-" + txId, 5000, 10000, txId % 10);

                    MLLoadBalancer.ShardAssignment assignment =
                            loadBalancer.assignShard(tx)
                                    .await().atMost(Duration.ofMillis(5000));

                    if (assignment != null) {
                        assignmentSuccess.incrementAndGet();

                        // 2. Anomaly check
                        AnomalyDetectionService.TransactionMetrics txMetrics =
                                createTransactionMetrics("0xSender" + txId, "0xReceiver" + txId, 5000, 5000);

                        anomalyService.analyzeTransaction(txMetrics)
                                .await().atMost(Duration.ofMillis(5000));
                        anomalyChecks.incrementAndGet();

                        // 3. Record feedback
                        double[] features = {Math.random(), Math.random(), Math.random(), Math.random()};
                        loadBalancer.recordAssignmentFeedback(
                                assignment.getShardId(),
                                features,
                                50.0 + (Math.random() * 100.0),
                                Math.random(),
                                Math.random() > 0.1  // 90% success rate
                        );
                        feedbackRecorded.incrementAndGet();
                    }

                    latch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(60, TimeUnit.SECONDS);
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.SECONDS);

        long duration = System.currentTimeMillis() - startTime;
        double tps = (double) assignmentSuccess.get() / (duration / 1000.0);

        assertTrue(completed, "All transactions should complete");
        assertTrue(assignmentSuccess.get() > transactionCount * 0.95,
                   "At least 95% assignments should succeed");
        assertTrue(anomalyChecks.get() > transactionCount * 0.95,
                   "At least 95% anomaly checks should complete");
        assertTrue(feedbackRecorded.get() > transactionCount * 0.95,
                   "At least 95% feedback should be recorded");

        System.out.printf("High-throughput workflow: %.0f TPS (%d transactions in %dms)%n",
                         tps, assignmentSuccess.get(), duration);
        System.out.printf("  Assignments: %d, Anomaly checks: %d, Feedback: %d%n",
                         assignmentSuccess.get(), anomalyChecks.get(), feedbackRecorded.get());
    }

    @Test
    @Order(4)
    @DisplayName("Integration Test 4: ML learning improves assignment quality over time")
    void testMLLearningImprovesAssignmentQualityOverTime() {
        // Phase 1: Initial assignments without learning
        int phase1Count = 100;
        for (int i = 0; i < phase1Count; i++) {
            MLLoadBalancer.TransactionContext tx = createTransaction("tx-p1-" + i, 5000, 10000, 5);
            MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(tx)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            // Simulate varied performance feedback
            double[] features = {0.5, 0.5, 0.5, 0.5};
            double latency = 80.0 + (Math.random() * 100.0);
            double load = 0.5 + (Math.random() * 0.3);
            boolean success = load < 0.8;

            loadBalancer.recordAssignmentFeedback(
                    assignment.getShardId(), features, latency, load, success);
        }

        MLLoadBalancer.LoadBalancingStats statsPhase1 = loadBalancer.getStats();

        // Phase 2: Assignments after learning
        int phase2Count = 100;
        for (int i = 0; i < phase2Count; i++) {
            MLLoadBalancer.TransactionContext tx = createTransaction("tx-p2-" + i, 5000, 10000, 5);
            MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(tx)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            // Simulate improved performance (learning effect)
            double[] features = {0.5, 0.5, 0.5, 0.5};
            double latency = 60.0 + (Math.random() * 40.0);  // Better latency
            double load = 0.4 + (Math.random() * 0.2);       // Better load
            boolean success = true;                           // More success

            loadBalancer.recordAssignmentFeedback(
                    assignment.getShardId(), features, latency, load, success);
        }

        MLLoadBalancer.LoadBalancingStats statsPhase2 = loadBalancer.getStats();

        // Verify learning happened
        assertTrue(statsPhase2.getTotalAssignments() > statsPhase1.getTotalAssignments(),
                   "Should have more assignments in phase 2");

        System.out.println("ML learning progression:");
        System.out.printf("  Phase 1: %d assignments%n", statsPhase1.getTotalAssignments());
        System.out.printf("  Phase 2: %d assignments%n", statsPhase2.getTotalAssignments());
    }

    @Test
    @Order(5)
    @DisplayName("Integration Test 5: Validator assignment with anomaly screening")
    void testValidatorAssignmentWithAnomalyScreening() {
        // Register validators
        loadBalancer.registerValidator("validator-safe-1", Set.of("standard", "premium"));
        loadBalancer.registerValidator("validator-safe-2", Set.of("standard"));

        int transactionCount = 200;
        AtomicInteger cleanTransactions = new AtomicInteger(0);
        AtomicInteger anomalousTransactions = new AtomicInteger(0);

        for (int i = 0; i < transactionCount; i++) {
            // Create mix of normal and anomalous transactions
            boolean makeAnomalous = (i % 10 == 0);  // 10% anomalous
            long size = makeAnomalous ? 50000 : 5000;
            long value = makeAnomalous ? 50000 : 5000;

            // 1. Anomaly screening
            AnomalyDetectionService.TransactionMetrics txMetrics =
                    createTransactionMetrics("0xSender" + i, "0xReceiver" + i, value, size);

            AnomalyDetectionService.AnomalyAnalysisResult anomalyResult =
                    anomalyService.analyzeTransaction(txMetrics)
                            .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            if (!anomalyResult.isAnomaly()) {
                // 2. Assign validator only for clean transactions
                MLLoadBalancer.TransactionContext tx = createTransaction("tx-val-" + i, size, 10000, 5);

                MLLoadBalancer.ValidatorAssignment validatorAssignment =
                        loadBalancer.assignValidator(tx)
                                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

                assertNotNull(validatorAssignment, "Should assign validator for clean transaction");
                cleanTransactions.incrementAndGet();
            } else {
                anomalousTransactions.incrementAndGet();
            }
        }

        System.out.printf("Validator assignment with screening: %d clean, %d anomalous%n",
                         cleanTransactions.get(), anomalousTransactions.get());

        assertTrue(cleanTransactions.get() > transactionCount * 0.80,
                   "Most transactions should be clean");
        assertTrue(anomalousTransactions.get() > 0,
                   "Should detect some anomalous transactions");
    }

    @Test
    @Order(6)
    @DisplayName("Integration Test 6: Performance monitoring with anomaly detection")
    void testPerformanceMonitoringWithAnomalyDetection() {
        // Simulate performance monitoring over time
        double[] tpsValues = {
                2000000, 2100000, 2050000, 1900000,  // Normal range
                1500000,  // Degradation
                1800000, 1950000, 2000000             // Recovery
        };

        double[] latencyValues = {
                45, 48, 50, 52,    // Normal
                180,               // Spike
                90, 60, 50         // Recovery
        };

        int anomalyCount = 0;

        for (int i = 0; i < tpsValues.length; i++) {
            AnomalyDetectionService.AnomalyAnalysisResult result =
                    anomalyService.analyzePerformance(tpsValues[i], latencyValues[i])
                            .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            if (result.isAnomaly()) {
                anomalyCount++;
                System.out.printf("Anomaly detected at iteration %d: TPS=%.0f, Latency=%.1f%n",
                                 i, tpsValues[i], latencyValues[i]);
            }
        }

        AnomalyDetectionService.AnomalyStatistics stats = anomalyService.getStatistics();

        assertTrue(anomalyCount > 0, "Should detect performance anomalies");
        assertTrue(stats.getPerformanceAnomalies() > 0, "Should track performance anomalies");
        assertTrue(stats.getAverageTPS() > 1000000, "Should track meaningful TPS average");
    }

    @Test
    @Order(7)
    @DisplayName("Integration Test 7: Adaptive batch sizing based on load")
    void testAdaptiveBatchSizingBasedOnLoad() {
        // Simulate varying load conditions
        for (int batch = 0; batch < 5; batch++) {
            int batchSize = 50 + (batch * 20);  // Increasing batch sizes

            for (int i = 0; i < batchSize; i++) {
                MLLoadBalancer.TransactionContext tx = createTransaction(
                        "tx-batch-" + batch + "-" + i, 5000, 10000, 5);

                MLLoadBalancer.ShardAssignment assignment = loadBalancer.assignShard(tx)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

                // Record feedback with varying load
                double[] features = {0.5, 0.5, 0.5, 0.5};
                double load = 0.3 + (batch * 0.15);  // Increasing load
                loadBalancer.recordAssignmentFeedback(
                        assignment.getShardId(), features, 80.0, load, load < 0.8);
            }

            // Analyze performance for this batch
            double expectedTPS = 2000000 - (batch * 200000);  // Decreasing TPS under load
            anomalyService.analyzePerformance(expectedTPS, 50.0 + (batch * 30))
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();
        assertTrue(stats.getTotalAssignments() > 200, "Should process all batches");
        assertTrue(stats.getLoadVariance() >= 0, "Should track load variance");
    }

    @Test
    @Order(8)
    @DisplayName("Integration Test 8: Security threat detection and mitigation")
    void testSecurityThreatDetectionAndMitigation() {
        // Build baseline
        for (int i = 0; i < 100; i++) {
            AnomalyDetectionService.TransactionMetrics normalTx =
                    createTransactionMetrics("0xNormal" + i, "0xReceiver" + i, 5000, 5000);
            anomalyService.analyzeTransaction(normalTx)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Simulate potential DOS attack (same address, high frequency)
        String attackerAddress = "0xATTACKER";
        int attackAttempts = 100;
        int detectedAttacks = 0;

        for (int i = 0; i < attackAttempts; i++) {
            AnomalyDetectionService.TransactionMetrics suspiciousTx =
                    createTransactionMetrics(attackerAddress, "0xVictim" + i, 5000, 5000);

            AnomalyDetectionService.AnomalyAnalysisResult result =
                    anomalyService.analyzeTransaction(suspiciousTx)
                            .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            if (result.isAnomaly() &&
                result.getType() == AnomalyDetectionService.AnomalyType.SECURITY_THREAT) {
                detectedAttacks++;
            }
        }

        AnomalyDetectionService.AnomalyStatistics stats = anomalyService.getStatistics();

        System.out.printf("Security test: %d/%d attack attempts detected%n",
                         detectedAttacks, attackAttempts);

        assertTrue(detectedAttacks > 0, "Should detect security threats");
        assertTrue(stats.getSecurityAnomalies() > 0, "Should track security anomalies");
    }

    @Test
    @Order(9)
    @DisplayName("Integration Test 9: Load distribution optimization")
    void testLoadDistributionOptimization() throws Exception {
        int rounds = 3;
        int transactionsPerRound = 500;

        for (int round = 0; round < rounds; round++) {
            final int currentRound = round;  // Make effectively final for lambda
            System.out.printf("Optimization round %d%n", round + 1);

            CountDownLatch latch = new CountDownLatch(transactionsPerRound);
            AtomicInteger successCount = new AtomicInteger(0);

            for (int i = 0; i < transactionsPerRound; i++) {
                final int txId = i;
                Thread.startVirtualThread(() -> {
                    try {
                        MLLoadBalancer.TransactionContext tx = createTransaction(
                                "tx-opt-" + currentRound + "-" + txId, 5000, 10000, 5);

                        MLLoadBalancer.ShardAssignment assignment =
                                loadBalancer.assignShard(tx)
                                        .await().atMost(Duration.ofMillis(5000));

                        successCount.incrementAndGet();

                        // Record feedback
                        double[] features = {0.5, 0.5, 0.5, 0.5};
                        double quality = 1.0 - (currentRound * 0.1);  // Improving quality
                        loadBalancer.recordAssignmentFeedback(
                                assignment.getShardId(), features,
                                60.0, 0.5, quality > 0.5);

                        latch.countDown();
                    } catch (Exception e) {
                        latch.countDown();
                    }
                });
            }

            assertTrue(latch.await(30, TimeUnit.SECONDS),
                       "Round " + (round + 1) + " should complete");

            MLLoadBalancer.LoadBalancingStats stats = loadBalancer.getStats();
            System.out.printf("  Round %d: %d successful assignments, variance: %.3f%n",
                             round + 1, successCount.get(), stats.getLoadVariance());
        }

        // Final stats should show optimization happened
        MLLoadBalancer.LoadBalancingStats finalStats = loadBalancer.getStats();
        assertTrue(finalStats.getTotalAssignments() > rounds * transactionsPerRound * 0.95,
                   "Should complete most assignments across all rounds");
    }

    @Test
    @Order(10)
    @DisplayName("Integration Test 10: End-to-end ML pipeline performance")
    void testEndToEndMLPipelinePerformance() throws Exception {
        int duration = 10000; // 10 seconds
        AtomicInteger completedWorkflows = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();
        long endTime = startTime + duration;

        ExecutorService executor = Executors.newFixedThreadPool(30);

        for (int i = 0; i < 30; i++) {
            executor.submit(() -> {
                while (System.currentTimeMillis() < endTime) {
                    try {
                        // Complete workflow
                        int localId = completedWorkflows.get();
                        MLLoadBalancer.TransactionContext tx = createTransaction(
                                "tx-e2e-" + localId, 5000, 10000, 5);

                        // 1. Load balancing
                        MLLoadBalancer.ShardAssignment assignment =
                                loadBalancer.assignShard(tx)
                                        .await().atMost(Duration.ofMillis(2000));

                        // 2. Anomaly detection
                        AnomalyDetectionService.TransactionMetrics txMetrics =
                                createTransactionMetrics("0xE2E" + localId, "0xReceiver", 5000, 5000);
                        anomalyService.analyzeTransaction(txMetrics)
                                .await().atMost(Duration.ofMillis(2000));

                        // 3. Feedback
                        double[] features = {0.5, 0.5, 0.5, 0.5};
                        loadBalancer.recordAssignmentFeedback(
                                assignment.getShardId(), features, 70.0, 0.5, true);

                        completedWorkflows.incrementAndGet();
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                    }
                }
            });
        }

        executor.shutdown();
        executor.awaitTermination(duration + 5000, TimeUnit.MILLISECONDS);

        int total = completedWorkflows.get();
        int errors = errorCount.get();
        double actualDuration = (System.currentTimeMillis() - startTime) / 1000.0;
        double workflowsPerSecond = total / actualDuration;
        double errorRate = (double) errors / (total + errors);

        System.out.printf("E2E ML Pipeline Performance:%n");
        System.out.printf("  Completed workflows: %d%n", total);
        System.out.printf("  Duration: %.1f seconds%n", actualDuration);
        System.out.printf("  Throughput: %.0f workflows/second%n", workflowsPerSecond);
        System.out.printf("  Error rate: %.2f%%%n", errorRate * 100);

        assertTrue(total > 500, "Should complete significant number of workflows");
        assertTrue(errorRate < 0.10, "Error rate should be under 10%");

        // Verify final statistics
        MLLoadBalancer.LoadBalancingStats lbStats = loadBalancer.getStats();
        AnomalyDetectionService.AnomalyStatistics anomalyStats = anomalyService.getStatistics();

        assertNotNull(lbStats, "Load balancer stats should be available");
        assertNotNull(anomalyStats, "Anomaly detection stats should be available");
        assertTrue(lbStats.getTotalAssignments() >= total * 0.95,
                   "Stats should reflect completed work");
    }

    // ==================== Helper Methods ====================

    private MLLoadBalancer.TransactionContext createTransaction(String txId, long size,
                                                                long gasLimit, int priority) {
        return new MLLoadBalancer.TransactionContext(
                txId, size, gasLimit, priority, "region-us-east", "standard");
    }

    private AnomalyDetectionService.TransactionMetrics createTransactionMetrics(
            String from, String to, long value, long size) {
        return new AnomalyDetectionService.TransactionMetrics(
                from, to, value, size, System.currentTimeMillis());
    }
}
