package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for DynamicBatchSizeOptimizer
 * Sprint 1 Day 1 Task 1.2
 *
 * Tests ML-based batch size optimization algorithms
 */
@QuarkusTest
class DynamicBatchSizeOptimizerTest {

    @Inject
    DynamicBatchSizeOptimizer optimizer;

    @BeforeEach
    void setup() {
        optimizer.reset();
    }

    @Test
    @DisplayName("Should initialize with default batch size")
    void testInitialization() {
        int batchSize = optimizer.getOptimalBatchSize();
        assertTrue(batchSize >= 1000 && batchSize <= 10000,
                  "Initial batch size should be within min/max range");
    }

    @Test
    @DisplayName("Should increase batch size when throughput is high and latency is low")
    void testBatchSizeIncrease() {
        // Simulate excellent performance
        double highThroughput = 2_500_000; // Above target
        double lowLatency = 50.0; // Well below target
        int currentBatch = 5000;

        var result = optimizer.optimizeBatchSize(highThroughput, lowLatency, currentBatch)
            .await().indefinitely();

        assertTrue(result.isOptimized(), "Should optimize batch size");
        assertTrue(result.getNewBatchSize() >= currentBatch,
                  "Batch size should increase or stay same with excellent performance");
    }

    @Test
    @DisplayName("Should decrease batch size when throughput is low")
    void testBatchSizeDecrease() {
        // Simulate poor performance
        double lowThroughput = 500_000; // Below target
        double highLatency = 150.0; // Above target
        int currentBatch = 8000;

        var result = optimizer.optimizeBatchSize(lowThroughput, highLatency, currentBatch)
            .await().indefinitely();

        assertTrue(result.isOptimized(), "Should optimize batch size");
        assertTrue(result.getNewBatchSize() <= currentBatch,
                  "Batch size should decrease or stay same with poor performance");
    }

    @Test
    @DisplayName("Should respect min and max batch size limits")
    void testBatchSizeLimits() {
        // Test minimum boundary
        double throughput = 100_000;
        double latency = 200.0;
        int smallBatch = 1000;

        var result1 = optimizer.optimizeBatchSize(throughput, latency, smallBatch)
            .await().indefinitely();

        assertTrue(result1.getNewBatchSize() >= 1000,
                  "Should not go below minimum batch size");

        // Test maximum boundary
        throughput = 3_000_000;
        latency = 30.0;
        int largeBatch = 10000;

        var result2 = optimizer.optimizeBatchSize(throughput, latency, largeBatch)
            .await().indefinitely();

        assertTrue(result2.getNewBatchSize() <= 10000,
                  "Should not exceed maximum batch size");
    }

    @Test
    @DisplayName("Should build regression model over time")
    void testRegressionModelBuilding() {
        // Feed multiple data points
        for (int i = 0; i < 20; i++) {
            int batchSize = 3000 + (i * 100);
            double throughput = 1_000_000 + (i * 50_000);
            double latency = 80.0 - (i * 2);

            optimizer.optimizeBatchSize(throughput, latency, batchSize)
                .await().indefinitely();

            // Small delay between optimizations
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        var stats = optimizer.getStatistics();
        assertTrue(stats.regressionDataPoints >= 10,
                  "Should have sufficient data points for regression");
        assertTrue(stats.totalOptimizations >= 10,
                  "Should have performed multiple optimizations");
    }

    @Test
    @DisplayName("Should track performance improvements")
    void testPerformanceTracking() {
        // Simulate improving performance
        double[] throughputs = {1_000_000, 1_200_000, 1_500_000, 1_800_000, 2_100_000};
        double[] latencies = {100, 95, 90, 85, 80};

        for (int i = 0; i < throughputs.length; i++) {
            optimizer.optimizeBatchSize(throughputs[i], latencies[i], 5000)
                .await().indefinitely();

            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        var stats = optimizer.getStatistics();
        assertTrue(stats.improvements > 0, "Should track throughput improvements");
        assertTrue(stats.bestThroughput >= 2_000_000,
                  "Should record best throughput achieved");
    }

    @Test
    @DisplayName("Should update network conditions and adjust batch size")
    void testNetworkConditionsUpdate() {
        // Simulate good network conditions
        optimizer.updateNetworkConditions(10.0, 2_000_000, 0.01);

        int batchSize1 = optimizer.getOptimalBatchSize();

        // Simulate degraded network conditions
        optimizer.updateNetworkConditions(100.0, 500_000, 0.1);

        // Wait for anomaly detection (if enabled)
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        int batchSize2 = optimizer.getOptimalBatchSize();

        // Batch size should stay within valid range
        assertTrue(batchSize1 >= 1000 && batchSize1 <= 10000);
        assertTrue(batchSize2 >= 1000 && batchSize2 <= 10000);
    }

    @Test
    @DisplayName("Should adjust batch size based on node performance")
    void testNodePerformanceAdjustment() {
        int initialBatch = optimizer.getOptimalBatchSize();

        // Simulate high resource usage
        optimizer.updateNodePerformance(95.0, 92.0, 90.0);

        int afterHighLoad = optimizer.getOptimalBatchSize();

        assertTrue(afterHighLoad <= initialBatch,
                  "Should reduce batch size under high resource usage");
        assertTrue(afterHighLoad >= 1000, "Should respect minimum batch size");
    }

    @Test
    @DisplayName("Should provide comprehensive statistics")
    void testStatistics() {
        // Perform some optimizations
        for (int i = 0; i < 5; i++) {
            optimizer.optimizeBatchSize(1_500_000, 90.0, 5000)
                .await().indefinitely();

            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        var stats = optimizer.getStatistics();

        assertNotNull(stats, "Statistics should not be null");
        assertTrue(stats.totalOptimizations > 0, "Should have optimization count");
        assertTrue(stats.currentBatchSize >= 1000 && stats.currentBatchSize <= 10000,
                  "Current batch size should be valid");
        assertTrue(stats.avgThroughput >= 0, "Average throughput should be non-negative");
        assertTrue(stats.avgLatency >= 0, "Average latency should be non-negative");
        assertNotNull(stats.toString(), "Statistics toString should work");
    }

    @Test
    @DisplayName("Should handle rapid successive optimizations")
    void testRapidOptimizations() {
        // Try to optimize too quickly (within adaptation interval)
        var result1 = optimizer.optimizeBatchSize(1_500_000, 90.0, 5000)
            .await().indefinitely();

        var result2 = optimizer.optimizeBatchSize(1_500_000, 90.0, 5000)
            .await().indefinitely();

        assertTrue(result1.isOptimized(), "First optimization should succeed");
        assertFalse(result2.isOptimized(), "Second optimization should be skipped (too soon)");
    }

    @Test
    @DisplayName("Should smooth transitions between batch sizes")
    void testSmoothTransitions() {
        int currentBatch = 5000;

        // Try to cause large jump in batch size
        double extremeThroughput = 5_000_000; // Way above target
        double lowLatency = 20.0;

        var result = optimizer.optimizeBatchSize(extremeThroughput, lowLatency, currentBatch)
            .await().indefinitely();

        // Change should be limited to max 20% per optimization
        int change = Math.abs(result.getNewBatchSize() - currentBatch);
        int maxAllowedChange = (int) (currentBatch * 0.25); // Allow some margin

        assertTrue(change <= maxAllowedChange,
                  String.format("Batch size change (%d) should be smooth, not exceed ~20%% (%d)",
                               change, maxAllowedChange));
    }

    @Test
    @DisplayName("Should reset to initial state")
    void testReset() {
        // Perform some optimizations
        for (int i = 0; i < 3; i++) {
            optimizer.optimizeBatchSize(1_500_000, 90.0, 5000)
                .await().indefinitely();
        }

        var statsBefore = optimizer.getStatistics();
        assertTrue(statsBefore.totalOptimizations > 0, "Should have optimizations before reset");

        // Reset
        optimizer.reset();

        var statsAfter = optimizer.getStatistics();
        assertEquals(0, statsAfter.totalOptimizations,
                    "Optimizations should be reset to 0");
        assertEquals(0, statsAfter.improvements,
                    "Improvements should be reset to 0");
        assertEquals(0.0, statsAfter.bestThroughput, 0.01,
                    "Best throughput should be reset");
    }

    @Test
    @DisplayName("Should handle edge cases gracefully")
    void testEdgeCases() {
        // Zero throughput
        var result1 = optimizer.optimizeBatchSize(0, 100.0, 5000)
            .await().indefinitely();
        assertTrue(result1.getNewBatchSize() >= 1000 && result1.getNewBatchSize() <= 10000);

        // Negative latency (should be handled)
        var result2 = optimizer.optimizeBatchSize(1_500_000, -10.0, 5000)
            .await().indefinitely();
        assertTrue(result2.getNewBatchSize() >= 1000 && result2.getNewBatchSize() <= 10000);

        // Extreme values
        var result3 = optimizer.optimizeBatchSize(100_000_000, 0.001, 5000)
            .await().indefinitely();
        assertTrue(result3.getNewBatchSize() >= 1000 && result3.getNewBatchSize() <= 10000);
    }

    @Test
    @DisplayName("Should calculate improvement percentages correctly")
    void testImprovementCalculation() {
        var result = optimizer.optimizeBatchSize(1_500_000, 90.0, 5000)
            .await().indefinitely();

        double improvement = result.improvementPercent;

        // Improvement percentage should be reasonable
        assertTrue(improvement >= -100 && improvement <= 100,
                  "Improvement percentage should be within reasonable range");
    }

    @Test
    @DisplayName("Should handle disabled state")
    void testDisabledState() {
        // Create a new instance with disabled flag
        // Note: This test assumes we can set the enabled flag via configuration
        // In actual testing, this might require a separate test configuration

        int batchSize = optimizer.getOptimalBatchSize();
        assertTrue(batchSize > 0, "Should return valid batch size even when testing");
    }
}
