package io.aurigraph.v11.performance;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.grpc.HighPerformanceGrpcService;
import io.aurigraph.v11.TransactionService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.HdrHistogram.Histogram;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.IntStream;

/**
 * Comprehensive Performance Benchmark Suite for Aurigraph V11
 * 
 * Validates AV11-4002 requirements:
 * - TPS Target: 2M+ sustained transactions per second
 * - Latency: P50 <10ms, P95 <50ms, P99 <100ms
 * - Consensus: Leader election <500ms
 * - Network: 10,000+ concurrent connections
 * - Memory: <256MB base usage
 * 
 * Test Infrastructure:
 * - JUnit 5 with parameterized tests
 * - HdrHistogram for accurate latency measurement
 * - Virtual threads for maximum concurrency
 * - JMeter integration for load generation
 * - Comprehensive performance reporting
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class PerformanceBenchmarkSuite {

    private static final Logger LOG = Logger.getLogger(PerformanceBenchmarkSuite.class);

    // Performance targets from AV11-4002
    private static final long TARGET_TPS = 2_000_000L;
    private static final long TARGET_P50_LATENCY_MS = 10L;
    private static final long TARGET_P95_LATENCY_MS = 50L;
    private static final long TARGET_P99_LATENCY_MS = 100L;
    private static final long TARGET_LEADER_ELECTION_MS = 500L;
    private static final int TARGET_CONCURRENT_CONNECTIONS = 10_000;
    private static final long TARGET_MEMORY_USAGE_MB = 256L;

    // Test configuration
    private static final int WARMUP_ITERATIONS = 10_000;
    private static final int BENCHMARK_DURATION_SECONDS = 60;
    private static final int[] LOAD_LEVELS = {1000, 10_000, 100_000, 500_000, 1_000_000, 2_000_000};

    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    HighPerformanceGrpcService grpcService;

    @Inject
    TransactionService transactionService;

    @Inject
    LoadTestRunner loadTestRunner;

    @Inject
    NetworkPerformanceTest networkTest;

    @Inject
    ConsensusTestHarness consensusHarness;

    @Inject
    PerformanceReporter performanceReporter;

    // Performance tracking
    private final AtomicLong totalTransactions = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicReference<Instant> testStartTime = new AtomicReference<>();
    private final Histogram latencyHistogram = new Histogram(1, TimeUnit.MINUTES.toMicros(1), 3);
    
    // Virtual thread executor for maximum concurrency
    private ExecutorService performanceExecutor;

    @BeforeAll
    static void setupSuite() {
        LOG.info("=".repeat(80));
        LOG.info("AURIGRAPH V11 PERFORMANCE BENCHMARK SUITE");
        LOG.info("Validating AV11-4002: 2M+ TPS High-Performance Architecture");
        LOG.info("=".repeat(80));
    }

    @BeforeEach
    void setup() {
        performanceExecutor = Executors.newVirtualThreadPerTaskExecutor();
        testStartTime.set(Instant.now());
        totalTransactions.set(0);
        successfulTransactions.set(0);
        latencyHistogram.reset();
        
        LOG.info("Performance test setup completed");
    }

    @AfterEach
    void cleanup() {
        if (performanceExecutor != null && !performanceExecutor.isShutdown()) {
            performanceExecutor.shutdown();
            try {
                if (!performanceExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                    performanceExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                performanceExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    @Test
    @Order(1)
    @DisplayName("System Warmup and Baseline Performance")
    void testSystemWarmup() {
        LOG.info("Starting system warmup with " + WARMUP_ITERATIONS + " transactions");
        
        Instant startTime = Instant.now();
        
        // Warmup with sequential processing
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            String txId = "warmup_" + i;
            transactionService.processTransaction(txId, Math.random() * 1000);
        }
        
        Duration warmupDuration = Duration.between(startTime, Instant.now());
        double warmupTps = WARMUP_ITERATIONS / (warmupDuration.toMillis() / 1000.0);
        
        LOG.infof("Warmup completed: %d transactions in %dms (%.0f TPS)", 
                 WARMUP_ITERATIONS, warmupDuration.toMillis(), warmupTps);
        
        // Verify basic functionality
        Assertions.assertTrue(warmupTps > 1000, "Warmup TPS should exceed 1000");
        Assertions.assertTrue(warmupDuration.toSeconds() < 60, "Warmup should complete within 60 seconds");
        
        performanceReporter.recordWarmupMetrics(warmupTps, warmupDuration);
    }

    @ParameterizedTest
    @ValueSource(ints = {1000, 10_000, 100_000, 500_000, 1_000_000})
    @Order(2)
    @DisplayName("Graduated Load Testing")
    void testGraduatedLoad(int targetTps) {
        LOG.infof("Starting graduated load test: %d TPS target", targetTps);
        
        Duration testDuration = Duration.ofSeconds(30);
        int totalTransactions = targetTps * (int) testDuration.getSeconds();
        
        PerformanceTestResult result = runLoadTest(targetTps, testDuration, totalTransactions);
        
        // Validate results
        validatePerformanceResult(result, targetTps);
        
        performanceReporter.recordLoadTestResult(targetTps, result);
        
        LOG.infof("Graduated load test completed: %d TPS achieved %.0f TPS (%.1f%% of target)", 
                 targetTps, result.actualTps(), (result.actualTps() / targetTps) * 100);
    }

    @Test
    @Order(3)
    @DisplayName("Peak Performance Test - 2M+ TPS Target")
    void testPeakPerformance() {
        LOG.info("Starting PEAK PERFORMANCE TEST - 2M+ TPS Target");
        
        Duration testDuration = Duration.ofSeconds(BENCHMARK_DURATION_SECONDS);
        int totalTransactions = (int) (TARGET_TPS * testDuration.getSeconds());
        
        PerformanceTestResult result = runLoadTest((int) TARGET_TPS, testDuration, totalTransactions);
        
        // Critical validation for 2M+ TPS target
        LOG.infof("PEAK PERFORMANCE RESULTS:");
        LOG.infof("  Target TPS: %d", TARGET_TPS);
        LOG.infof("  Actual TPS: %.0f", result.actualTps());
        LOG.infof("  Achievement: %.1f%%", (result.actualTps() / TARGET_TPS) * 100);
        LOG.infof("  P50 Latency: %.1fms (target <%dms)", result.p50LatencyMs(), TARGET_P50_LATENCY_MS);
        LOG.infof("  P95 Latency: %.1fms (target <%dms)", result.p95LatencyMs(), TARGET_P95_LATENCY_MS);
        LOG.infof("  P99 Latency: %.1fms (target <%dms)", result.p99LatencyMs(), TARGET_P99_LATENCY_MS);
        LOG.infof("  Success Rate: %.2f%%", result.successRate());
        LOG.infof("  Memory Usage: %dMB", result.memoryUsageMb());
        
        // Critical assertions for AV11-4002 compliance
        Assertions.assertTrue(result.actualTps() >= TARGET_TPS, 
            String.format("TPS target not met: %.0f < %d", result.actualTps(), TARGET_TPS));
        
        Assertions.assertTrue(result.p50LatencyMs() <= TARGET_P50_LATENCY_MS,
            String.format("P50 latency target not met: %.1fms > %dms", result.p50LatencyMs(), TARGET_P50_LATENCY_MS));
        
        Assertions.assertTrue(result.p95LatencyMs() <= TARGET_P95_LATENCY_MS,
            String.format("P95 latency target not met: %.1fms > %dms", result.p95LatencyMs(), TARGET_P95_LATENCY_MS));
        
        Assertions.assertTrue(result.p99LatencyMs() <= TARGET_P99_LATENCY_MS,
            String.format("P99 latency target not met: %.1fms > %dms", result.p99LatencyMs(), TARGET_P99_LATENCY_MS));
        
        Assertions.assertTrue(result.successRate() >= 99.9,
            String.format("Success rate target not met: %.2f%% < 99.9%%", result.successRate()));
        
        Assertions.assertTrue(result.memoryUsageMb() <= TARGET_MEMORY_USAGE_MB,
            String.format("Memory usage target not met: %dMB > %dMB", result.memoryUsageMb(), TARGET_MEMORY_USAGE_MB));
        
        performanceReporter.recordPeakPerformanceResult(result);
        
        if (result.actualTps() >= TARGET_TPS) {
            LOG.info("🚀 PEAK PERFORMANCE TARGET ACHIEVED! 🚀");
        }
    }

    @Test
    @Order(4)
    @DisplayName("Consensus Performance Test")
    void testConsensusPerformance() {
        LOG.info("Starting consensus performance validation");
        
        ConsensusPerformanceResult result = consensusHarness.runConsensusPerformanceTest();
        
        LOG.infof("Consensus Performance Results:");
        LOG.infof("  Leader Election Time: %dms (target <%dms)", 
                 result.leaderElectionTimeMs(), TARGET_LEADER_ELECTION_MS);
        LOG.infof("  Consensus TPS: %.0f", result.consensusTps());
        LOG.infof("  Block Finalization: %.1fms average", result.avgBlockFinalizationMs());
        LOG.infof("  Validation Success Rate: %.2f%%", result.validationSuccessRate());
        
        // Validate consensus performance targets
        Assertions.assertTrue(result.leaderElectionTimeMs() <= TARGET_LEADER_ELECTION_MS,
            String.format("Leader election too slow: %dms > %dms", 
                         result.leaderElectionTimeMs(), TARGET_LEADER_ELECTION_MS));
        
        Assertions.assertTrue(result.consensusTps() >= 100_000,
            String.format("Consensus TPS too low: %.0f < 100000", result.consensusTps()));
        
        Assertions.assertTrue(result.validationSuccessRate() >= 99.99,
            String.format("Validation success rate too low: %.2f%% < 99.99%%", result.validationSuccessRate()));
        
        performanceReporter.recordConsensusPerformance(result);
    }

    @Test
    @Order(5)
    @DisplayName("Network Performance Test")
    void testNetworkPerformance() {
        LOG.info("Starting network performance validation");
        
        NetworkPerformanceResult result = networkTest.runNetworkPerformanceTest(TARGET_CONCURRENT_CONNECTIONS);
        
        LOG.infof("Network Performance Results:");
        LOG.infof("  Concurrent Connections: %d (target >=%d)", 
                 result.maxConcurrentConnections(), TARGET_CONCURRENT_CONNECTIONS);
        LOG.infof("  Connection Establishment: %.1fms average", result.avgConnectionTimeMs());
        LOG.infof("  Network Throughput: %.0f MB/s", result.networkThroughputMbps());
        LOG.infof("  gRPC Latency: %.1fms P99", result.grpcLatencyP99Ms());
        
        // Validate network performance targets
        Assertions.assertTrue(result.maxConcurrentConnections() >= TARGET_CONCURRENT_CONNECTIONS,
            String.format("Concurrent connections target not met: %d < %d", 
                         result.maxConcurrentConnections(), TARGET_CONCURRENT_CONNECTIONS));
        
        Assertions.assertTrue(result.avgConnectionTimeMs() <= 100,
            String.format("Connection time too slow: %.1fms > 100ms", result.avgConnectionTimeMs()));
        
        Assertions.assertTrue(result.grpcLatencyP99Ms() <= 200,
            String.format("gRPC latency too high: %.1fms > 200ms", result.grpcLatencyP99Ms()));
        
        performanceReporter.recordNetworkPerformance(result);
    }

    @Test
    @Order(6)
    @DisplayName("Stress Test - Beyond Limits")
    void testStressConditions() {
        LOG.info("Starting stress test - pushing beyond normal limits");
        
        // Test with 150% of target load
        int stressTargetTps = (int) (TARGET_TPS * 1.5);
        Duration testDuration = Duration.ofSeconds(30);
        
        PerformanceTestResult result = runLoadTest(stressTargetTps, testDuration, 
                                                  stressTargetTps * (int) testDuration.getSeconds());
        
        LOG.infof("Stress Test Results:");
        LOG.infof("  Stress Target: %d TPS", stressTargetTps);
        LOG.infof("  Achieved: %.0f TPS", result.actualTps());
        LOG.infof("  System Stability: %s", result.successRate() > 95 ? "STABLE" : "DEGRADED");
        LOG.infof("  Recovery Time: <5s expected");
        
        // Under stress, we expect some degradation but system should remain stable
        Assertions.assertTrue(result.actualTps() >= TARGET_TPS,
            "System should maintain at least baseline performance under stress");
        
        Assertions.assertTrue(result.successRate() >= 95.0,
            "Success rate should remain above 95% even under stress");
        
        performanceReporter.recordStressTestResult(stressTargetTps, result);
    }

    @Test
    @Order(7)
    @DisplayName("Endurance Test - Sustained Performance")
    void testEndurancePerformance() {
        LOG.info("Starting endurance test - sustained performance validation");
        
        Duration enduranceDuration = Duration.ofMinutes(10); // 10-minute sustained test
        int sustainedTps = (int) (TARGET_TPS * 0.8); // 80% of peak for sustainability
        
        List<PerformanceTestResult> enduranceResults = new ArrayList<>();
        
        // Run multiple 1-minute intervals
        for (int interval = 1; interval <= 10; interval++) {
            LOG.infof("Endurance interval %d/10", interval);
            
            PerformanceTestResult intervalResult = runLoadTest(sustainedTps, Duration.ofMinutes(1), 
                                                              sustainedTps * 60);
            enduranceResults.add(intervalResult);
            
            LOG.infof("Interval %d: %.0f TPS, %.1fms P99 latency", 
                     interval, intervalResult.actualTps(), intervalResult.p99LatencyMs());
        }
        
        // Analyze endurance results
        double avgTps = enduranceResults.stream().mapToDouble(PerformanceTestResult::actualTps).average().orElse(0);
        double maxP99Latency = enduranceResults.stream().mapToDouble(PerformanceTestResult::p99LatencyMs).max().orElse(0);
        double minSuccessRate = enduranceResults.stream().mapToDouble(PerformanceTestResult::successRate).min().orElse(100);
        
        LOG.infof("Endurance Test Summary:");
        LOG.infof("  Average TPS: %.0f", avgTps);
        LOG.infof("  Max P99 Latency: %.1fms", maxP99Latency);
        LOG.infof("  Min Success Rate: %.2f%%", minSuccessRate);
        
        // Validate endurance performance
        Assertions.assertTrue(avgTps >= sustainedTps * 0.95,
            String.format("Sustained performance degradation: %.0f < %.0f", avgTps, sustainedTps * 0.95));
        
        Assertions.assertTrue(maxP99Latency <= TARGET_P99_LATENCY_MS * 2,
            String.format("Latency degradation over time: %.1fms > %dms", maxP99Latency, TARGET_P99_LATENCY_MS * 2));
        
        Assertions.assertTrue(minSuccessRate >= 99.0,
            String.format("Success rate degradation: %.2f%% < 99.0%%", minSuccessRate));
        
        performanceReporter.recordEnduranceResults(enduranceResults);
    }

    @AfterAll
    static void generateFinalReport() {
        LOG.info("=".repeat(80));
        LOG.info("PERFORMANCE BENCHMARK SUITE COMPLETED");
        LOG.info("Generating comprehensive performance report...");
        LOG.info("=".repeat(80));
    }

    /**
     * Core load test execution method
     */
    private PerformanceTestResult runLoadTest(int targetTps, Duration duration, int totalTransactions) {
        Instant testStart = Instant.now();
        AtomicLong completed = new AtomicLong(0);
        AtomicLong successful = new AtomicLong(0);
        Histogram testHistogram = new Histogram(1, TimeUnit.MINUTES.toMicros(1), 3);
        
        // Calculate optimal thread count and batch size
        int threadCount = Math.min(targetTps / 1000, 1000); // Max 1000 threads
        int transactionsPerThread = totalTransactions / threadCount;
        
        LOG.infof("Load test configuration: %d threads, %d tx/thread", threadCount, transactionsPerThread);
        
        // Create virtual threads for maximum concurrency
        CompletableFuture<Void>[] futures = new CompletableFuture[threadCount];
        
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            futures[t] = CompletableFuture.runAsync(() -> {
                for (int i = 0; i < transactionsPerThread; i++) {
                    long txStart = System.nanoTime();
                    
                    try {
                        String txId = String.format("perf_%d_%d", threadId, i);
                        transactionService.processTransaction(txId, Math.random() * 1000);
                        
                        successful.incrementAndGet();
                        
                        long latencyMicros = (System.nanoTime() - txStart) / 1000;
                        testHistogram.recordValue(latencyMicros);
                        
                    } catch (Exception e) {
                        LOG.warnf("Transaction failed: %s", e.getMessage());
                    } finally {
                        completed.incrementAndGet();
                    }
                }
            }, performanceExecutor);
        }
        
        // Wait for completion or timeout
        try {
            CompletableFuture.allOf(futures).get(duration.toSeconds() + 30, TimeUnit.SECONDS);
        } catch (Exception e) {
            LOG.warnf("Load test interrupted: %s", e.getMessage());
            // Cancel remaining futures
            Arrays.stream(futures).forEach(f -> f.cancel(true));
        }
        
        Instant testEnd = Instant.now();
        Duration actualDuration = Duration.between(testStart, testEnd);
        
        // Calculate metrics
        long totalCompleted = completed.get();
        long totalSuccessful = successful.get();
        double actualTps = totalCompleted / (actualDuration.toMillis() / 1000.0);
        double successRate = (totalSuccessful * 100.0) / totalCompleted;
        
        double p50LatencyMs = testHistogram.getValueAtPercentile(50.0) / 1000.0;
        double p95LatencyMs = testHistogram.getValueAtPercentile(95.0) / 1000.0;
        double p99LatencyMs = testHistogram.getValueAtPercentile(99.0) / 1000.0;
        
        // Memory usage
        Runtime runtime = Runtime.getRuntime();
        long memoryUsageMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        
        return new PerformanceTestResult(
            targetTps,
            actualTps,
            p50LatencyMs,
            p95LatencyMs,
            p99LatencyMs,
            successRate,
            totalCompleted,
            totalSuccessful,
            actualDuration,
            memoryUsageMb
        );
    }

    private void validatePerformanceResult(PerformanceTestResult result, int targetTps) {
        // Allow 10% variance for graduated load tests
        double minAcceptableTps = targetTps * 0.9;
        
        Assertions.assertTrue(result.actualTps() >= minAcceptableTps,
            String.format("TPS below acceptable threshold: %.0f < %.0f", result.actualTps(), minAcceptableTps));
        
        Assertions.assertTrue(result.successRate() >= 99.5,
            String.format("Success rate too low: %.2f%% < 99.5%%", result.successRate()));
    }

    /**
     * Performance test result record
     */
    public record PerformanceTestResult(
        int targetTps,
        double actualTps,
        double p50LatencyMs,
        double p95LatencyMs,
        double p99LatencyMs,
        double successRate,
        long totalTransactions,
        long successfulTransactions,
        Duration testDuration,
        long memoryUsageMb
    ) {}

    /**
     * Consensus performance result record
     */
    public record ConsensusPerformanceResult(
        long leaderElectionTimeMs,
        double consensusTps,
        double avgBlockFinalizationMs,
        double validationSuccessRate
    ) {}

    /**
     * Network performance result record
     */
    public record NetworkPerformanceResult(
        int maxConcurrentConnections,
        double avgConnectionTimeMs,
        double networkThroughputMbps,
        double grpcLatencyP99Ms
    ) {}
}