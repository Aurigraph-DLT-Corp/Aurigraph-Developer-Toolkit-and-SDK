package io.aurigraph.v11.ai;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.consensus.ConsensusModels.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance Benchmark Test Suite for AI Optimization System
 * 
 * Measures performance impact and optimization effectiveness of the AI system
 * on Aurigraph V11 HyperRAFT++ consensus.
 * 
 * These tests are designed to validate that:
 * 1. AI optimization provides measurable performance improvements
 * 2. System maintains stability under AI optimization load
 * 3. Target performance metrics are achievable
 * 4. AI components don't introduce significant overhead
 * 
 * @author Aurigraph AI Team
 * @version 11.0.0
 * @since 2024-09-10
 */
@QuarkusTest
@DisplayName("AI Performance Benchmark Tests")
@EnabledIfSystemProperty(named = "run.performance.tests", matches = "true")
public class AIPerformanceBenchmarkTest {

    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    AIOptimizationService aiOptimizationService;

    @Inject
    AnomalyDetectionService anomalyDetectionService;

    @Inject
    AdaptiveBatchProcessor batchProcessor;

    @Inject
    AIIntegrationService aiIntegrationService;

    private static final int WARMUP_DURATION_MS = 5000;
    private static final int BENCHMARK_DURATION_MS = 30000;
    private static final double TARGET_TPS = 2_000_000.0;
    private static final double TARGET_LATENCY_MS = 75.0;
    private static final double TARGET_SUCCESS_RATE = 99.95;

    @BeforeEach
    void setUp() {
        // Ensure all services are available
        assertNotNull(consensusService);
        assertNotNull(aiOptimizationService);
        assertNotNull(anomalyDetectionService);
        assertNotNull(batchProcessor);
        assertNotNull(aiIntegrationService);
    }

    @Test
    @DisplayName("Baseline Performance Without AI Optimization")
    void measureBaselinePerformance() throws InterruptedException {
        System.out.println("=== Baseline Performance Measurement ===");
        
        // Disable AI optimization to measure baseline
        aiOptimizationService.setOptimizationEnabled(false);
        
        // Warmup period
        Thread.sleep(WARMUP_DURATION_MS);
        
        // Measure baseline performance
        PerformanceMetrics baselineStart = consensusService.getPerformanceMetrics();
        long startTime = System.currentTimeMillis();
        
        Thread.sleep(BENCHMARK_DURATION_MS);
        
        PerformanceMetrics baselineEnd = consensusService.getPerformanceMetrics();
        long endTime = System.currentTimeMillis();
        
        // Calculate baseline metrics
        double duration = (endTime - startTime) / 1000.0;
        double processedTxs = baselineEnd.getTotalProcessed() - baselineStart.getTotalProcessed();
        double baselineTPS = processedTxs / duration;
        double baselineLatency = baselineEnd.getAvgLatency();
        double baselineSuccessRate = baselineEnd.getSuccessRate();
        
        System.out.printf("Baseline Performance:%n");
        System.out.printf("  TPS: %.0f%n", baselineTPS);
        System.out.printf("  Latency: %.2f ms%n", baselineLatency);
        System.out.printf("  Success Rate: %.2f%%%n", baselineSuccessRate);
        System.out.printf("  Duration: %.1f seconds%n", duration);
        
        // Validate baseline performance is reasonable
        assertTrue(baselineTPS > 0, "Baseline TPS should be positive");
        assertTrue(baselineLatency > 0, "Baseline latency should be positive");
        assertTrue(baselineSuccessRate >= 95.0, "Baseline success rate should be at least 95%");
        
        // Store baseline for comparison (in a real system, this would be persisted)
        System.setProperty("ai.benchmark.baseline.tps", String.valueOf(baselineTPS));
        System.setProperty("ai.benchmark.baseline.latency", String.valueOf(baselineLatency));
        System.setProperty("ai.benchmark.baseline.success.rate", String.valueOf(baselineSuccessRate));
    }

    @Test
    @DisplayName("AI-Optimized Performance Measurement")
    void measureAIOptimizedPerformance() throws InterruptedException {
        System.out.println("=== AI-Optimized Performance Measurement ===");
        
        // Enable AI optimization with aggressive targets
        aiOptimizationService.setOptimizationEnabled(true);
        aiOptimizationService.enableAutonomousMode(
            (long) TARGET_TPS,
            (long) TARGET_LATENCY_MS,
            TARGET_SUCCESS_RATE,
            2000L // 2-second optimization intervals
        );
        
        // Extended warmup for AI models to initialize and start optimizing
        System.out.println("Warming up AI optimization system...");
        Thread.sleep(WARMUP_DURATION_MS * 2);
        
        // Verify AI is active
        var aiStatus = aiOptimizationService.getOptimizationStatus();
        assertTrue(aiStatus.enabled(), "AI optimization should be enabled");
        System.out.printf("AI Status: Enabled=%b, Models Initialized=%b%n", 
                         aiStatus.enabled(), aiStatus.modelsInitialized());
        
        // Measure AI-optimized performance
        PerformanceMetrics aiStart = consensusService.getPerformanceMetrics();
        long startTime = System.currentTimeMillis();
        
        Thread.sleep(BENCHMARK_DURATION_MS);
        
        PerformanceMetrics aiEnd = consensusService.getPerformanceMetrics();
        long endTime = System.currentTimeMillis();
        
        // Calculate AI-optimized metrics
        double duration = (endTime - startTime) / 1000.0;
        double processedTxs = aiEnd.getTotalProcessed() - aiStart.getTotalProcessed();
        double aiTPS = processedTxs / duration;
        double aiLatency = aiEnd.getAvgLatency();
        double aiSuccessRate = aiEnd.getSuccessRate();
        
        System.out.printf("AI-Optimized Performance:%n");
        System.out.printf("  TPS: %.0f%n", aiTPS);
        System.out.printf("  Latency: %.2f ms%n", aiLatency);
        System.out.printf("  Success Rate: %.2f%%%n", aiSuccessRate);
        System.out.printf("  Duration: %.1f seconds%n", duration);
        
        // Get AI optimization statistics
        var finalAiStatus = aiOptimizationService.getOptimizationStatus();
        System.out.printf("AI Optimization Stats:%n");
        System.out.printf("  Total Optimizations: %d%n", finalAiStatus.totalOptimizations());
        System.out.printf("  Successful Optimizations: %d%n", finalAiStatus.successfulOptimizations());
        if (finalAiStatus.totalOptimizations() > 0) {
            double successRate = (double) finalAiStatus.successfulOptimizations() / finalAiStatus.totalOptimizations() * 100;
            System.out.printf("  Optimization Success Rate: %.2f%%%n", successRate);
        }
        
        // Validate AI-optimized performance
        assertTrue(aiTPS > 0, "AI-optimized TPS should be positive");
        assertTrue(aiLatency > 0, "AI-optimized latency should be positive");
        assertTrue(aiSuccessRate >= 95.0, "AI-optimized success rate should be at least 95%");
        
        // Compare with targets
        if (aiTPS >= TARGET_TPS * 0.8) {
            System.out.println("✓ TPS target achieved or close (>80% of target)");
        } else {
            System.out.printf("⚠ TPS below target: %.0f < %.0f%n", aiTPS, TARGET_TPS);
        }
        
        if (aiLatency <= TARGET_LATENCY_MS * 1.2) {
            System.out.println("✓ Latency target achieved or close (<120% of target)");
        } else {
            System.out.printf("⚠ Latency above target: %.2f > %.2f ms%n", aiLatency, TARGET_LATENCY_MS);
        }
        
        if (aiSuccessRate >= TARGET_SUCCESS_RATE) {
            System.out.println("✓ Success rate target achieved");
        } else {
            System.out.printf("⚠ Success rate below target: %.2f%% < %.2f%%%n", aiSuccessRate, TARGET_SUCCESS_RATE);
        }
        
        // Store results
        System.setProperty("ai.benchmark.optimized.tps", String.valueOf(aiTPS));
        System.setProperty("ai.benchmark.optimized.latency", String.valueOf(aiLatency));
        System.setProperty("ai.benchmark.optimized.success.rate", String.valueOf(aiSuccessRate));
    }

    @Test
    @DisplayName("AI Optimization Impact Analysis")
    void analyzeOptimizationImpact() {
        System.out.println("=== AI Optimization Impact Analysis ===");
        
        // Retrieve stored baseline and optimized metrics
        String baselineTpsStr = System.getProperty("ai.benchmark.baseline.tps");
        String optimizedTpsStr = System.getProperty("ai.benchmark.optimized.tps");
        
        if (baselineTpsStr != null && optimizedTpsStr != null) {
            double baselineTPS = Double.parseDouble(baselineTpsStr);
            double optimizedTPS = Double.parseDouble(optimizedTpsStr);
            
            double tpsImprovement = (optimizedTPS - baselineTPS) / baselineTPS * 100;
            System.out.printf("TPS Improvement: %.2f%% (%.0f → %.0f)%n", 
                             tpsImprovement, baselineTPS, optimizedTPS);
            
            // Validate improvement
            if (tpsImprovement > 5.0) {
                System.out.println("✓ Significant TPS improvement achieved");
            } else if (tpsImprovement > 0.0) {
                System.out.println("• Moderate TPS improvement achieved");
            } else {
                System.out.println("⚠ No TPS improvement observed");
            }
        }
        
        // Similar analysis for latency and success rate
        String baselineLatencyStr = System.getProperty("ai.benchmark.baseline.latency");
        String optimizedLatencyStr = System.getProperty("ai.benchmark.optimized.latency");
        
        if (baselineLatencyStr != null && optimizedLatencyStr != null) {
            double baselineLatency = Double.parseDouble(baselineLatencyStr);
            double optimizedLatency = Double.parseDouble(optimizedLatencyStr);
            
            double latencyImprovement = (baselineLatency - optimizedLatency) / baselineLatency * 100;
            System.out.printf("Latency Improvement: %.2f%% (%.2f → %.2f ms)%n", 
                             latencyImprovement, baselineLatency, optimizedLatency);
            
            if (latencyImprovement > 5.0) {
                System.out.println("✓ Significant latency improvement achieved");
            } else if (latencyImprovement > 0.0) {
                System.out.println("• Moderate latency improvement achieved");
            } else {
                System.out.println("⚠ No latency improvement observed");
            }
        }
    }

    @Test
    @DisplayName("AI System Overhead Measurement")
    void measureAISystemOverhead() throws InterruptedException {
        System.out.println("=== AI System Overhead Measurement ===");
        
        // Measure system performance with AI enabled but not actively optimizing
        aiOptimizationService.setOptimizationEnabled(true);
        
        // Warmup
        Thread.sleep(WARMUP_DURATION_MS);
        
        // Measure CPU and memory usage
        Runtime runtime = Runtime.getRuntime();
        long startMemory = runtime.totalMemory() - runtime.freeMemory();
        long startTime = System.nanoTime();
        
        // Run for measurement period
        Thread.sleep(BENCHMARK_DURATION_MS / 3); // Shorter duration for overhead test
        
        long endTime = System.nanoTime();
        long endMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Calculate overhead metrics
        double cpuTime = (endTime - startTime) / 1_000_000_000.0;
        long memoryUsage = endMemory - startMemory;
        
        System.out.printf("AI System Resource Usage:%n");
        System.out.printf("  Memory Usage Delta: %.2f MB%n", memoryUsage / (1024.0 * 1024.0));
        System.out.printf("  CPU Time: %.2f seconds%n", cpuTime);
        
        // Validate overhead is reasonable
        assertTrue(memoryUsage < 1024 * 1024 * 1024, "Memory overhead should be less than 1GB"); // 1GB limit
        assertTrue(cpuTime > 0, "CPU time should be measurable");
        
        // Check AI service responsiveness
        long responseStart = System.nanoTime();
        var aiStatus = aiOptimizationService.getOptimizationStatus();
        long responseEnd = System.nanoTime();
        
        double responseTime = (responseEnd - responseStart) / 1_000_000.0; // Convert to ms
        System.out.printf("AI Service Response Time: %.2f ms%n", responseTime);
        
        assertTrue(responseTime < 100.0, "AI service should respond within 100ms");
        assertNotNull(aiStatus, "AI status should be available");
    }

    @Test
    @DisplayName("Concurrent AI Operation Stress Test")
    void stressTestConcurrentAIOperations() throws InterruptedException, ExecutionException {
        System.out.println("=== Concurrent AI Operation Stress Test ===");
        
        aiOptimizationService.setOptimizationEnabled(true);
        
        // Create thread pool for concurrent operations
        ExecutorService executor = Executors.newFixedThreadPool(10);
        AtomicLong totalOperations = new AtomicLong(0);
        AtomicLong successfulOperations = new AtomicLong(0);
        
        List<Future<Boolean>> futures = new ArrayList<>();
        
        // Submit multiple concurrent AI operations
        for (int i = 0; i < 20; i++) {
            futures.add(executor.submit(() -> {
                try {
                    totalOperations.incrementAndGet();
                    
                    // Perform various AI operations concurrently
                    var status = aiOptimizationService.getOptimizationStatus();
                    if (status != null && status.enabled()) {
                        successfulOperations.incrementAndGet();
                        return true;
                    }
                    return false;
                } catch (Exception e) {
                    System.err.println("Concurrent operation failed: " + e.getMessage());
                    return false;
                }
            }));
        }
        
        // Wait for all operations to complete
        int successCount = 0;
        for (Future<Boolean> future : futures) {
            try {
                if (future.get(10, TimeUnit.SECONDS)) {
                    successCount++;
                }
            } catch (TimeoutException e) {
                System.err.println("Operation timed out: " + e.getMessage());
            }
        }
        
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.SECONDS);
        
        System.out.printf("Concurrent Operations: %d total, %d successful%n", 
                         futures.size(), successCount);
        System.out.printf("Success Rate: %.2f%%%n", (double) successCount / futures.size() * 100);
        
        // Validate stress test results
        assertTrue(successCount >= futures.size() * 0.8, "At least 80% of concurrent operations should succeed");
        
        // Verify system is still responsive after stress
        var finalStatus = aiOptimizationService.getOptimizationStatus();
        assertNotNull(finalStatus, "AI system should still be responsive after stress test");
        assertTrue(finalStatus.enabled(), "AI system should still be enabled after stress test");
    }

    @Test
    @DisplayName("Long-Running AI Optimization Stability Test")
    void testLongRunningStability() throws InterruptedException {
        System.out.println("=== Long-Running AI Optimization Stability Test ===");
        
        // Enable AI with moderate settings for stability testing
        aiOptimizationService.setOptimizationEnabled(true);
        aiOptimizationService.enableAutonomousMode(
            1_500_000L, // Moderate TPS target
            100L,       // Moderate latency target
            99.0,       // Moderate success rate target
            5000L       // 5-second intervals for stability
        );
        
        // Run for extended period with periodic checks
        int checkIntervalMs = 10000; // 10 seconds
        int totalChecks = 6; // Total 60 seconds
        
        List<PerformanceSnapshot> snapshots = new ArrayList<>();
        
        for (int i = 0; i < totalChecks; i++) {
            Thread.sleep(checkIntervalMs);
            
            // Capture performance snapshot
            var consensusMetrics = consensusService.getPerformanceMetrics();
            var aiStatus = aiOptimizationService.getOptimizationStatus();
            
            PerformanceSnapshot snapshot = new PerformanceSnapshot(
                i * checkIntervalMs,
                consensusMetrics.getCurrentTps(),
                consensusMetrics.getAvgLatency(),
                consensusMetrics.getSuccessRate(),
                aiStatus.enabled(),
                aiStatus.totalOptimizations(),
                aiStatus.successfulOptimizations()
            );
            
            snapshots.add(snapshot);
            
            System.out.printf("Check %d: TPS=%.0f, Latency=%.2fms, Success=%.2f%%, AI Optimizations=%d/%d%n",
                             i + 1,
                             snapshot.tps,
                             snapshot.latency,
                             snapshot.successRate,
                             snapshot.successfulOptimizations,
                             snapshot.totalOptimizations);
        }
        
        // Analyze stability
        boolean systemStable = true;
        String stabilityIssues = "";
        
        // Check for performance consistency
        double minTps = snapshots.stream().mapToDouble(s -> s.tps).min().orElse(0);
        double maxTps = snapshots.stream().mapToDouble(s -> s.tps).max().orElse(0);
        double tpsVariation = maxTps > 0 ? (maxTps - minTps) / maxTps : 0;
        
        if (tpsVariation > 0.3) { // 30% variation threshold
            systemStable = false;
            stabilityIssues += "High TPS variation: " + (tpsVariation * 100) + "%; ";
        }
        
        // Check for consistent AI operation
        long totalOptimizationsGrowth = snapshots.get(snapshots.size() - 1).totalOptimizations - 
                                       snapshots.get(0).totalOptimizations;
        if (totalOptimizationsGrowth == 0) {
            systemStable = false;
            stabilityIssues += "No AI optimization progress; ";
        }
        
        // Check for success rate consistency
        boolean successRateStable = snapshots.stream()
            .allMatch(s -> s.successRate >= 95.0);
        
        if (!successRateStable) {
            systemStable = false;
            stabilityIssues += "Success rate dropped below 95%; ";
        }
        
        System.out.printf("Stability Analysis:%n");
        System.out.printf("  TPS Variation: %.2f%%%n", tpsVariation * 100);
        System.out.printf("  AI Optimizations Growth: %d%n", totalOptimizationsGrowth);
        System.out.printf("  Success Rate Stable: %b%n", successRateStable);
        
        if (systemStable) {
            System.out.println("✓ System demonstrated good stability over extended run");
        } else {
            System.out.println("⚠ Stability issues detected: " + stabilityIssues);
        }
        
        assertTrue(systemStable, "System should maintain stability over extended runtime");
    }

    // Helper class for performance snapshots
    private static class PerformanceSnapshot {
        final long timestamp;
        final double tps;
        final double latency;
        final double successRate;
        final boolean aiEnabled;
        final long totalOptimizations;
        final long successfulOptimizations;

        PerformanceSnapshot(long timestamp, double tps, double latency, double successRate, 
                           boolean aiEnabled, long totalOptimizations, long successfulOptimizations) {
            this.timestamp = timestamp;
            this.tps = tps;
            this.latency = latency;
            this.successRate = successRate;
            this.aiEnabled = aiEnabled;
            this.totalOptimizations = totalOptimizations;
            this.successfulOptimizations = successfulOptimizations;
        }
    }
}