package io.aurigraph.v11.performance;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import jakarta.inject.Inject;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Advanced Performance Service
 * Tests 2M+ TPS capability and system resilience
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdvancedPerformanceTest {

    @Inject
    AdvancedPerformanceService performanceService;

    @BeforeEach
    void setUp() {
        // Ensure service is started for each test
        if (performanceService != null) {
            performanceService.start();
            
            // Wait for initialization
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @AfterEach
    void tearDown() {
        if (performanceService != null) {
            performanceService.stop();
        }
    }

    /**
     * Test service initialization
     */
    @Test
    @Order(1)
    void testServiceInitialization() {
        assertNotNull(performanceService, "Performance service should be injected");
        
        AdvancedPerformanceService.PerformanceSnapshot metrics = performanceService.getCurrentMetrics();
        assertNotNull(metrics, "Metrics should be available");
        
        // Service should be ready to process transactions
        assertTrue(metrics.currentTPS() >= 0, "Current TPS should be non-negative");
        assertTrue(metrics.peakTPS() >= 0, "Peak TPS should be non-negative");
    }

    /**
     * Test single transaction submission
     */
    @Test
    @Order(2)
    void testSingleTransactionSubmission() throws Exception {
        byte[] testData = "test_transaction_data".getBytes();
        
        CompletableFuture<AdvancedPerformanceService.TransactionResult> future = 
            performanceService.submitTransaction(testData).subscribeAsCompletionStage();
        
        AdvancedPerformanceService.TransactionResult result = future.get(5, TimeUnit.SECONDS);
        
        assertNotNull(result, "Transaction result should not be null");
        assertTrue(result.transactionId() > 0, "Transaction ID should be positive");
        assertTrue(result.success(), "Transaction should be successful");
        assertNotNull(result.status(), "Status should not be null");
    }

    /**
     * Test batch transaction processing
     */
    @Test
    @Order(3)
    void testBatchTransactionProcessing() throws Exception {
        int batchSize = 1000;
        List<byte[]> transactions = generateTestTransactions(batchSize);
        
        List<AdvancedPerformanceService.TransactionResult> results = 
            performanceService.submitBatch(transactions)
                .collect().asList()
                .await().atMost(java.time.Duration.ofSeconds(10));
        
        assertEquals(batchSize, results.size(), "Should process all transactions in batch");
        
        long successCount = results.stream().mapToLong(r -> r.success() ? 1 : 0).sum();
        assertTrue(successCount >= batchSize * 0.95, "At least 95% of transactions should succeed");
        
        // Verify performance metrics updated
        AdvancedPerformanceService.PerformanceSnapshot metrics = performanceService.getCurrentMetrics();
        assertTrue(metrics.totalTransactions() >= batchSize, "Total transactions should be updated");
    }

    /**
     * Test high throughput performance (100K TPS target)
     */
    @Test
    @Order(4)
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testHighThroughputPerformance() throws Exception {
        int targetTPS = 100_000;
        int duration = 10; // seconds
        
        CompletableFuture<AdvancedPerformanceService.BenchmarkResult> benchmarkFuture = 
            performanceService.runBenchmark(duration, targetTPS)
                .subscribeAsCompletionStage();
        
        AdvancedPerformanceService.BenchmarkResult result = benchmarkFuture.get(35, TimeUnit.SECONDS);
        
        assertNotNull(result, "Benchmark result should not be null");
        assertTrue(result.achievedTPS() > 0, "Should achieve positive TPS");
        assertTrue(result.totalTransactions() > 0, "Should process transactions");
        assertTrue(result.successRate() > 0.9, "Success rate should be >90%");
        
        System.out.printf("High Throughput Test: Achieved %,d TPS (target: %,d TPS)%n", 
            result.achievedTPS(), targetTPS);
        
        // Should achieve at least 50% of target for this test
        assertTrue(result.achievedTPS() >= targetTPS * 0.5, 
            "Should achieve at least 50% of target TPS");
    }

    /**
     * Test ultra-high throughput performance (1M+ TPS target)
     */
    @Test
    @Order(5)
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testUltraHighThroughputPerformance() throws Exception {
        int targetTPS = 1_000_000;
        int duration = 15; // seconds
        
        CompletableFuture<AdvancedPerformanceService.BenchmarkResult> benchmarkFuture = 
            performanceService.runBenchmark(duration, targetTPS)
                .subscribeAsCompletionStage();
        
        AdvancedPerformanceService.BenchmarkResult result = benchmarkFuture.get(65, TimeUnit.SECONDS);
        
        assertNotNull(result, "Benchmark result should not be null");
        assertTrue(result.achievedTPS() > 0, "Should achieve positive TPS");
        assertTrue(result.totalTransactions() > 100_000, "Should process >100K transactions");
        assertTrue(result.successRate() > 0.85, "Success rate should be >85%");
        
        System.out.printf("Ultra High Throughput Test: Achieved %,d TPS (target: %,d TPS)%n", 
            result.achievedTPS(), targetTPS);
        
        // Should achieve at least 30% of 1M TPS target
        assertTrue(result.achievedTPS() >= 300_000, 
            "Should achieve at least 300K TPS");
    }

    /**
     * Test maximum performance (2M+ TPS target)
     */
    @Test
    @Order(6)
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testMaximumPerformance() throws Exception {
        int targetTPS = 2_000_000;
        int duration = 20; // seconds
        
        System.out.println("Starting maximum performance test - targeting 2M+ TPS");
        
        CompletableFuture<AdvancedPerformanceService.BenchmarkResult> benchmarkFuture = 
            performanceService.runBenchmark(duration, targetTPS)
                .subscribeAsCompletionStage();
        
        AdvancedPerformanceService.BenchmarkResult result = benchmarkFuture.get(125, TimeUnit.SECONDS);
        
        assertNotNull(result, "Benchmark result should not be null");
        assertTrue(result.achievedTPS() > 0, "Should achieve positive TPS");
        assertTrue(result.totalTransactions() > 500_000, "Should process >500K transactions");
        assertTrue(result.successRate() > 0.80, "Success rate should be >80%");
        
        System.out.printf("Maximum Performance Test: Achieved %,d TPS (target: %,d TPS)%n", 
            result.achievedTPS(), targetTPS);
        System.out.printf("Processed %,d transactions with %.2f%% success rate%n", 
            result.totalTransactions(), result.successRate() * 100);
        
        // Primary goal: achieve at least 1M TPS
        assertTrue(result.achievedTPS() >= 1_000_000, 
            "Should achieve at least 1M TPS");
        
        // Stretch goal: achieve 2M+ TPS
        if (result.achievedTPS() >= 2_000_000) {
            System.out.println("🎉 ACHIEVED 2M+ TPS TARGET! 🎉");
        } else {
            System.out.printf("Achieved %,d TPS - target is %,d TPS (%.1f%% of target)%n",
                result.achievedTPS(), targetTPS, 
                (double) result.achievedTPS() / targetTPS * 100);
        }
    }

    /**
     * Test sustained performance over time
     */
    @Test
    @Order(7)
    @Timeout(value = 180, unit = TimeUnit.SECONDS)
    void testSustainedPerformance() throws Exception {
        int targetTPS = 500_000; // More conservative for sustained test
        int duration = 60; // 1 minute sustained
        
        System.out.println("Starting sustained performance test - 1 minute duration");
        
        CompletableFuture<AdvancedPerformanceService.BenchmarkResult> benchmarkFuture = 
            performanceService.runBenchmark(duration, targetTPS)
                .subscribeAsCompletionStage();
        
        AdvancedPerformanceService.BenchmarkResult result = benchmarkFuture.get(185, TimeUnit.SECONDS);
        
        assertNotNull(result, "Benchmark result should not be null");
        assertTrue(result.achievedTPS() > 0, "Should achieve positive TPS");
        assertTrue(result.totalTransactions() > 1_000_000, "Should process >1M transactions");
        assertTrue(result.successRate() > 0.90, "Success rate should be >90% for sustained test");
        
        System.out.printf("Sustained Performance Test: Achieved %,d TPS over %d seconds%n", 
            result.achievedTPS(), duration);
        
        // Should maintain at least 200K TPS for sustained operation
        assertTrue(result.achievedTPS() >= 200_000, 
            "Should maintain at least 200K TPS for sustained operation");
    }

    /**
     * Test concurrent transaction processing
     */
    @ParameterizedTest
    @ValueSource(ints = {10, 50, 100})
    @Order(8)
    void testConcurrentProcessing(int concurrentThreads) throws Exception {
        int transactionsPerThread = 1000;
        
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < concurrentThreads; i++) {
            final int threadId = i;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    for (int j = 0; j < transactionsPerThread; j++) {
                        String data = String.format("thread_%d_tx_%d", threadId, j);
                        performanceService.submitTransaction(data.getBytes())
                            .await().atMost(java.time.Duration.ofSeconds(5));
                    }
                } catch (Exception e) {
                    throw new RuntimeException("Thread " + threadId + " failed", e);
                }
            });
            futures.add(future);
        }
        
        // Wait for all threads to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .get(60, TimeUnit.SECONDS);
        
        long elapsed = System.currentTimeMillis() - startTime;
        int totalTransactions = concurrentThreads * transactionsPerThread;
        long achievedTPS = (totalTransactions * 1000L) / elapsed;
        
        System.out.printf("Concurrent Test (%d threads): %,d TPS, %d total transactions in %d ms%n", 
            concurrentThreads, achievedTPS, totalTransactions, elapsed);
        
        assertTrue(achievedTPS > 0, "Should achieve positive TPS with concurrent processing");
    }

    /**
     * Test memory pool efficiency
     */
    @Test
    @Order(9)
    void testMemoryPoolEfficiency() {
        // Submit many transactions to stress memory pools
        int transactionCount = 10000;
        
        for (int i = 0; i < transactionCount; i++) {
            String data = "memory_test_" + i;
            performanceService.submitTransaction(data.getBytes());
        }
        
        // Allow processing time
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Verify system is still responsive
        AdvancedPerformanceService.PerformanceSnapshot metrics = performanceService.getCurrentMetrics();
        assertNotNull(metrics, "Should still be able to get metrics");
        assertTrue(metrics.totalTransactions() >= transactionCount, 
            "Should have processed the transactions");
        
        // Memory usage should be reasonable
        Runtime runtime = Runtime.getRuntime();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        double memoryUsage = (double) usedMemory / maxMemory;
        
        System.out.printf("Memory usage: %.2f%% (%,d / %,d bytes)%n", 
            memoryUsage * 100, usedMemory, maxMemory);
        
        assertTrue(memoryUsage < 0.8, "Memory usage should be <80% after processing");
    }

    /**
     * Test system resilience under stress
     */
    @Test
    @Order(10)
    @Timeout(value = 90, unit = TimeUnit.SECONDS)
    void testSystemResilience() throws Exception {
        // Multiple concurrent benchmarks
        List<CompletableFuture<AdvancedPerformanceService.BenchmarkResult>> futures = new ArrayList<>();
        
        for (int i = 0; i < 3; i++) {
            CompletableFuture<AdvancedPerformanceService.BenchmarkResult> future = 
                performanceService.runBenchmark(15, 100_000)
                    .subscribeAsCompletionStage();
            futures.add(future);
        }
        
        // Wait for all to complete
        List<AdvancedPerformanceService.BenchmarkResult> results = new ArrayList<>();
        for (CompletableFuture<AdvancedPerformanceService.BenchmarkResult> future : futures) {
            results.add(future.get(95, TimeUnit.SECONDS));
        }
        
        // All benchmarks should complete successfully
        assertEquals(3, results.size(), "All benchmarks should complete");
        
        for (int i = 0; i < results.size(); i++) {
            AdvancedPerformanceService.BenchmarkResult result = results.get(i);
            assertTrue(result.achievedTPS() > 0, "Benchmark " + i + " should achieve positive TPS");
            assertTrue(result.successRate() > 0.7, "Benchmark " + i + " should have >70% success rate");
        }
        
        // System should still be responsive
        AdvancedPerformanceService.PerformanceSnapshot metrics = performanceService.getCurrentMetrics();
        assertNotNull(metrics, "Should still be able to get metrics after stress test");
        
        System.out.println("System resilience test completed - system remained stable");
    }

    /**
     * Generate test transactions with varying sizes
     */
    private List<byte[]> generateTestTransactions(int count) {
        List<byte[]> transactions = new ArrayList<>(count);
        ThreadLocalRandom random = ThreadLocalRandom.current();
        
        for (int i = 0; i < count; i++) {
            int size = 64 + random.nextInt(192); // 64-256 bytes
            String data = "test_tx_" + i + "_" + System.currentTimeMillis();
            
            // Pad to desired size
            StringBuilder sb = new StringBuilder(data);
            while (sb.length() < size) {
                sb.append("_data");
            }
            
            transactions.add(sb.toString().getBytes());
        }
        
        return transactions;
    }
}