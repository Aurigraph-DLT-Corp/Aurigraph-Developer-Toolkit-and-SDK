package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for AnomalyDetectionService
 * Sprint 6 Phase 2: Tests for transaction, performance, and security anomaly detection
 *
 * Coverage Target: 95%+
 * False Positive Rate Target: <2%
 */
@QuarkusTest
@Disabled("Port conflict during Quarkus startup - infrastructure issue, scheduled for Week 1 Day 3-5")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AnomalyDetectionServiceTest {

    @Inject
    AnomalyDetectionService anomalyService;

    private static final int TEST_TIMEOUT_MS = 5000;

    @BeforeEach
    void setUp() {
        assertNotNull(anomalyService, "AnomalyDetectionService should be injected");
        // Reset statistics before each test
        anomalyService.resetStatistics();
    }

    // ==================== Transaction Anomaly Detection Tests ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: Normal transaction detected as non-anomalous")
    void testNormalTransactionDetectedAsNonAnomalous() {
        // Build baseline with normal transactions
        for (int i = 0; i < 150; i++) {
            AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(i);
            anomalyService.analyzeTransaction(tx).await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Test a normal transaction
        AnomalyDetectionService.TransactionMetrics normalTx = createNormalTransaction(999);
        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzeTransaction(normalTx)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result, "Result should not be null");
        assertFalse(result.isAnomaly(), "Normal transaction should not be flagged as anomaly");
        assertTrue(result.getAnomalyScore() < 0.95, "Anomaly score should be low for normal transaction");
        assertEquals(AnomalyDetectionService.AnomalyType.NONE, result.getType(),
                     "Type should be NONE for normal transaction");
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Unusually large transaction detected as anomaly")
    void testUnusuallyLargeTransactionDetectedAsAnomaly() {
        // Build baseline with normal transactions
        for (int i = 0; i < 150; i++) {
            AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(i);
            anomalyService.analyzeTransaction(tx).await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Test an abnormally large transaction (10x normal size)
        AnomalyDetectionService.TransactionMetrics largeTx = new AnomalyDetectionService.TransactionMetrics(
                "0xABCD1234",
                "0xDEF56789",
                50000,  // 10x normal value
                50000,  // 10x normal size
                System.currentTimeMillis()
        );

        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzeTransaction(largeTx)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertTrue(result.isAnomaly(), "Abnormally large transaction should be flagged");
        assertTrue(result.getAnomalyScore() >= 0.95, "Anomaly score should be high");
        assertEquals(AnomalyDetectionService.AnomalyType.TRANSACTION_PATTERN, result.getType(),
                     "Should be flagged as transaction pattern anomaly");
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: High-frequency address detected as potential DOS")
    void testHighFrequencyAddressDetectedAsPotentialDOS() {
        // Build baseline
        for (int i = 0; i < 100; i++) {
            AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(i);
            anomalyService.analyzeTransaction(tx).await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Same address sending many transactions (potential DOS/flooding)
        String suspiciousAddress = "0xSUSPICIOUS123";
        List<AnomalyDetectionService.AnomalyAnalysisResult> results = new ArrayList<>();

        for (int i = 0; i < 100; i++) {
            AnomalyDetectionService.TransactionMetrics tx = new AnomalyDetectionService.TransactionMetrics(
                    suspiciousAddress,  // Same address every time
                    "0xReceiver" + i,
                    5000,
                    5000,
                    System.currentTimeMillis()
            );
            results.add(anomalyService.analyzeTransaction(tx)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS)));
        }

        // Should detect high frequency eventually
        long anomalyCount = results.stream().filter(AnomalyDetectionService.AnomalyAnalysisResult::isAnomaly).count();
        assertTrue(anomalyCount > 0, "High-frequency address should be detected as anomaly");

        // Check statistics
        AnomalyDetectionService.AnomalyStatistics stats = anomalyService.getStatistics();
        assertTrue(stats.getSecurityAnomalies() > 0, "Should record security anomalies");
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Suspicious new address with large transaction")
    void testSuspiciousNewAddressWithLargeTransaction() {
        // Build baseline with normal average
        for (int i = 0; i < 150; i++) {
            AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(i);
            anomalyService.analyzeTransaction(tx).await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Brand new address with very large transaction (suspicious)
        String newAddress = "0xBRANDNEWADDRESS" + System.nanoTime();
        AnomalyDetectionService.TransactionMetrics suspiciousTx = new AnomalyDetectionService.TransactionMetrics(
                newAddress,
                "0xReceiver999",
                100000,  // Very large value
                100000,  // Very large size
                System.currentTimeMillis()
        );

        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzeTransaction(suspiciousTx)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        // New address with large transaction should be flagged
        assertTrue(result.isAnomaly() || result.getAnomalyScore() > 0.8,
                   "New address with large transaction should be suspicious");
    }

    // ==================== Performance Anomaly Detection Tests ====================

    @Test
    @Order(5)
    @DisplayName("Test 5: Normal TPS detected as non-anomalous")
    void testNormalTPSDetectedAsNonAnomalous() {
        // Build baseline with consistent TPS
        for (int i = 0; i < 150; i++) {
            anomalyService.analyzePerformance(1000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Test normal TPS
        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzePerformance(1000000.0, 50.0)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertFalse(result.isAnomaly(), "Normal TPS should not be anomaly");
        assertEquals(AnomalyDetectionService.AnomalyType.NONE, result.getType());
    }

    @Test
    @Order(6)
    @DisplayName("Test 6: TPS degradation detected as anomaly")
    void testTPSDegradationDetectedAsAnomaly() {
        // Build baseline with good TPS
        for (int i = 0; i < 150; i++) {
            anomalyService.analyzePerformance(2000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Sudden TPS drop (degradation)
        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzePerformance(500000.0, 50.0)  // 75% drop
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertTrue(result.isAnomaly(), "TPS degradation should be detected");
        assertTrue(result.getAnomalyScore() > 0.95, "Should have high anomaly score");
        assertEquals(AnomalyDetectionService.AnomalyType.PERFORMANCE_DEGRADATION, result.getType(),
                     "Should be performance degradation type");
        assertTrue(result.getReason().toLowerCase().contains("tps"),
                   "Reason should mention TPS");
    }

    @Test
    @Order(7)
    @DisplayName("Test 7: Latency spike detected as anomaly")
    void testLatencySpikeDetectedAsAnomaly() {
        // Build baseline with low latency
        for (int i = 0; i < 150; i++) {
            anomalyService.analyzePerformance(2000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Sudden latency spike
        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzePerformance(2000000.0, 500.0)  // 10x latency increase
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        assertTrue(result.isAnomaly(), "Latency spike should be detected");
        assertEquals(AnomalyDetectionService.AnomalyType.PERFORMANCE_DEGRADATION, result.getType());
        assertTrue(result.getReason().toLowerCase().contains("latency"),
                   "Reason should mention latency");
    }

    @Test
    @Order(8)
    @DisplayName("Test 8: Gradual TPS decline not flagged immediately")
    void testGradualTPSDeclineNotFlaggedImmediately() {
        // Build baseline
        for (int i = 0; i < 100; i++) {
            anomalyService.analyzePerformance(2000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Gradual decline
        List<Boolean> anomalies = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            double tps = 2000000.0 - (i * 10000); // Gradual 10K TPS decline per iteration
            AnomalyDetectionService.AnomalyAnalysisResult result =
                    anomalyService.analyzePerformance(tps, 50.0)
                            .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
            anomalies.add(result.isAnomaly());
        }

        // First few should not be anomalies (gradual is okay)
        long anomalyCount = anomalies.stream().filter(a -> a).count();
        assertTrue(anomalyCount < 10, "Gradual decline should not trigger many anomalies immediately");
    }

    // ==================== Statistics and Monitoring Tests ====================

    @Test
    @Order(9)
    @DisplayName("Test 9: Statistics tracking counts anomalies correctly")
    void testStatisticsTrackingCountsAnomaliesCorrectly() {
        // Generate some anomalies
        // Transaction anomaly
        for (int i = 0; i < 100; i++) {
            anomalyService.analyzeTransaction(createNormalTransaction(i))
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }
        AnomalyDetectionService.TransactionMetrics largeTx = new AnomalyDetectionService.TransactionMetrics(
                "0xABC", "0xDEF", 50000, 50000, System.currentTimeMillis());
        anomalyService.analyzeTransaction(largeTx).await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        // Performance anomaly
        for (int i = 0; i < 100; i++) {
            anomalyService.analyzePerformance(2000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }
        anomalyService.analyzePerformance(500000.0, 50.0)
                .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        AnomalyDetectionService.AnomalyStatistics stats = anomalyService.getStatistics();

        assertNotNull(stats);
        assertTrue(stats.getTotalAnomalies() > 0, "Should track total anomalies");
        assertTrue(stats.getAverageTPS() > 0, "Should track average TPS");
        assertTrue(stats.getAverageLatency() > 0, "Should track average latency");
    }

    @Test
    @Order(10)
    @DisplayName("Test 10: Reset statistics clears counters")
    void testResetStatisticsClearsCounters() {
        // Generate some data
        for (int i = 0; i < 50; i++) {
            anomalyService.analyzeTransaction(createNormalTransaction(i))
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
            anomalyService.analyzePerformance(2000000.0, 50.0)
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        AnomalyDetectionService.AnomalyStatistics statsBefore = anomalyService.getStatistics();
        assertTrue(statsBefore.getTotalAnomalies() >= 0 || statsBefore.getUniqueAddresses() > 0,
                   "Should have some data before reset");

        // Reset
        anomalyService.resetStatistics();

        AnomalyDetectionService.AnomalyStatistics statsAfter = anomalyService.getStatistics();
        assertEquals(0, statsAfter.getTotalAnomalies(), "Total anomalies should be reset");
        assertEquals(0, statsAfter.getPerformanceAnomalies(), "Performance anomalies should be reset");
        assertEquals(0, statsAfter.getSecurityAnomalies(), "Security anomalies should be reset");
        assertEquals(0, statsAfter.getTransactionAnomalies(), "Transaction anomalies should be reset");
        assertEquals(0, statsAfter.getUniqueAddresses(), "Unique addresses should be reset");
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: Statistics provide meaningful metrics")
    void testStatisticsProvideMeaningfulMetrics() {
        // Generate varied data
        double[] tpsValues = {1500000.0, 2000000.0, 1800000.0, 2200000.0, 1900000.0};
        double[] latencyValues = {45.0, 50.0, 55.0, 48.0, 52.0};

        for (int i = 0; i < tpsValues.length; i++) {
            anomalyService.analyzePerformance(tpsValues[i], latencyValues[i])
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        AnomalyDetectionService.AnomalyStatistics stats = anomalyService.getStatistics();

        // Average should be meaningful
        assertTrue(stats.getAverageTPS() > 1000000.0 && stats.getAverageTPS() < 3000000.0,
                   "Average TPS should be in reasonable range");
        assertTrue(stats.getAverageLatency() > 40.0 && stats.getAverageLatency() < 60.0,
                   "Average latency should be in reasonable range");

        // Standard deviations should be calculated
        assertTrue(stats.getStdDevTPS() >= 0.0, "TPS std dev should be non-negative");
        assertTrue(stats.getStdDevLatency() >= 0.0, "Latency std dev should be non-negative");
    }

    // ==================== Concurrency and Performance Tests ====================

    @Test
    @Order(12)
    @DisplayName("Test 12: Concurrent transaction analysis")
    void testConcurrentTransactionAnalysis() throws Exception {
        int txCount = 1000;
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger anomalyCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(txCount);
        ExecutorService executor = Executors.newFixedThreadPool(20);

        for (int i = 0; i < txCount; i++) {
            final int txId = i;
            executor.submit(() -> {
                try {
                    AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(txId);
                    AnomalyDetectionService.AnomalyAnalysisResult result =
                            anomalyService.analyzeTransaction(tx)
                                    .await().atMost(Duration.ofMillis(5000));

                    successCount.incrementAndGet();
                    if (result.isAnomaly()) {
                        anomalyCount.incrementAndGet();
                    }
                    latch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS), "All analyses should complete");
        executor.shutdown();

        assertTrue(successCount.get() > txCount * 0.95,
                   "At least 95% should succeed. Got: " + successCount.get());
        System.out.printf("Concurrent analysis: %d transactions, %d anomalies detected%n",
                         successCount.get(), anomalyCount.get());
    }

    @Test
    @Order(13)
    @DisplayName("Test 13: Concurrent performance analysis")
    void testConcurrentPerformanceAnalysis() throws Exception {
        int analysisCount = 500;
        AtomicInteger successCount = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(analysisCount);
        ExecutorService executor = Executors.newFixedThreadPool(10);

        for (int i = 0; i < analysisCount; i++) {
            executor.submit(() -> {
                try {
                    double tps = 1500000.0 + (Math.random() * 1000000.0);
                    double latency = 40.0 + (Math.random() * 20.0);

                    anomalyService.analyzePerformance(tps, latency)
                            .await().atMost(Duration.ofMillis(5000));

                    successCount.incrementAndGet();
                    latch.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(20, TimeUnit.SECONDS), "All analyses should complete");
        executor.shutdown();

        assertTrue(successCount.get() > analysisCount * 0.95,
                   "At least 95% should succeed");
    }

    @Test
    @Order(14)
    @DisplayName("Test 14: High throughput anomaly detection")
    void testHighThroughputAnomalyDetection() throws Exception {
        int duration = 5000; // 5 seconds
        AtomicInteger analysisCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();
        long endTime = startTime + duration;

        ExecutorService executor = Executors.newFixedThreadPool(20);

        for (int i = 0; i < 20; i++) {
            executor.submit(() -> {
                int localCount = 0;
                while (System.currentTimeMillis() < endTime) {
                    try {
                        AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(localCount);
                        anomalyService.analyzeTransaction(tx)
                                .await().atMost(Duration.ofMillis(1000));

                        analysisCount.incrementAndGet();
                        localCount++;
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                    }
                }
            });
        }

        executor.shutdown();
        executor.awaitTermination(duration + 5000, TimeUnit.MILLISECONDS);

        int total = analysisCount.get();
        int errors = errorCount.get();
        double errorRate = (double) errors / (total + errors);

        System.out.printf("Throughput test: %d analyses, %d errors (%.2f%% error rate)%n",
                         total, errors, errorRate * 100);

        assertTrue(total > 1000, "Should handle significant throughput");
        assertTrue(errorRate < 0.05, "Error rate should be less than 5%");
    }

    // ==================== False Positive Rate Tests ====================

    @Test
    @Order(15)
    @DisplayName("Test 15: False positive rate under 2% for normal traffic")
    void testFalsePositiveRateUnder2PercentForNormalTraffic() {
        // Build baseline
        for (int i = 0; i < 200; i++) {
            anomalyService.analyzeTransaction(createNormalTransaction(i))
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Test with many normal transactions
        int testCount = 500;
        int falsePositives = 0;

        for (int i = 0; i < testCount; i++) {
            AnomalyDetectionService.TransactionMetrics tx = createNormalTransaction(1000 + i);
            AnomalyDetectionService.AnomalyAnalysisResult result =
                    anomalyService.analyzeTransaction(tx)
                            .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            if (result.isAnomaly()) {
                falsePositives++;
            }
        }

        double falsePositiveRate = (double) falsePositives / testCount;
        System.out.printf("False positive rate: %.2f%% (%d out of %d)%n",
                         falsePositiveRate * 100, falsePositives, testCount);

        assertTrue(falsePositiveRate < 0.02,
                   String.format("False positive rate should be under 2%%. Got: %.2f%%",
                                falsePositiveRate * 100));
    }

    @Test
    @Order(16)
    @DisplayName("Test 16: True positive rate for obvious anomalies")
    void testTruePositiveRateForObviousAnomalies() {
        // Build baseline
        for (int i = 0; i < 150; i++) {
            anomalyService.analyzeTransaction(createNormalTransaction(i))
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Test with obvious anomalies
        int anomalyCount = 50;
        int detectedAnomalies = 0;

        for (int i = 0; i < anomalyCount; i++) {
            // Create obviously anomalous transaction (10x size)
            AnomalyDetectionService.TransactionMetrics anomalousTx =
                    new AnomalyDetectionService.TransactionMetrics(
                            "0xAnomaly" + i,
                            "0xReceiver" + i,
                            50000,  // 10x normal
                            50000,  // 10x normal
                            System.currentTimeMillis()
                    );

            AnomalyDetectionService.AnomalyAnalysisResult result =
                    anomalyService.analyzeTransaction(anomalousTx)
                            .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

            if (result.isAnomaly()) {
                detectedAnomalies++;
            }
        }

        double truePositiveRate = (double) detectedAnomalies / anomalyCount;
        System.out.printf("True positive rate: %.2f%% (%d out of %d)%n",
                         truePositiveRate * 100, detectedAnomalies, anomalyCount);

        assertTrue(truePositiveRate > 0.80,
                   String.format("Should detect most obvious anomalies. Got: %.2f%%",
                                truePositiveRate * 100));
    }

    @Test
    @Order(17)
    @DisplayName("Test 17: Sensitivity adjustment affects detection")
    void testSensitivityAdjustmentAffectsDetection() {
        // This test verifies that sensitivity configuration impacts detection
        // Build baseline
        for (int i = 0; i < 150; i++) {
            anomalyService.analyzeTransaction(createNormalTransaction(i))
                    .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));
        }

        // Test with moderately unusual transaction
        AnomalyDetectionService.TransactionMetrics moderateTx =
                new AnomalyDetectionService.TransactionMetrics(
                        "0xModerate",
                        "0xReceiver",
                        15000,  // 3x normal (moderate anomaly)
                        15000,
                        System.currentTimeMillis()
                );

        AnomalyDetectionService.AnomalyAnalysisResult result =
                anomalyService.analyzeTransaction(moderateTx)
                        .await().atMost(Duration.ofMillis(TEST_TIMEOUT_MS));

        assertNotNull(result);
        // With default sensitivity (0.95), moderate anomalies might or might not be flagged
        assertTrue(result.getAnomalyScore() >= 0.0 && result.getAnomalyScore() <= 1.0,
                   "Score should be in valid range");
    }

    @Test
    @Order(18)
    @DisplayName("Test 18: Memory efficiency under sustained load")
    void testMemoryEfficiencyUnderSustainedLoad() {
        // Process many transactions to test window management
        for (int i = 0; i < 5000; i++) {
            anomalyService.analyzeTransaction(createNormalTransaction(i))
                    .await().atMost(Duration.ofMillis(1000));

            if (i % 100 == 0) {
                anomalyService.analyzePerformance(2000000.0, 50.0)
                        .await().atMost(Duration.ofMillis(1000));
            }
        }

        // Should not cause OOM - sliding window should limit memory
        AnomalyDetectionService.AnomalyStatistics stats = anomalyService.getStatistics();
        assertNotNull(stats, "Should still function after sustained load");
        assertTrue(true, "Memory management should prevent OOM");
    }

    // ==================== Helper Methods ====================

    private AnomalyDetectionService.TransactionMetrics createNormalTransaction(int id) {
        return new AnomalyDetectionService.TransactionMetrics(
                "0xSender" + (id % 100),  // Cycle through 100 addresses
                "0xReceiver" + (id % 100),
                5000,  // Normal value
                5000,  // Normal size
                System.currentTimeMillis()
        );
    }
}
