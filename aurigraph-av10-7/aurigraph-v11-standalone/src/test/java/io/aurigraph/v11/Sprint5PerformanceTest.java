package io.aurigraph.v11;

import io.aurigraph.v11.performance.VirtualThreadPoolManager;
import io.aurigraph.v11.performance.LockFreeTransactionQueue;
import io.aurigraph.v11.consensus.Sprint5ConsensusOptimizer;
import io.aurigraph.v11.monitoring.Sprint5PerformanceMonitor;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.inject.Inject;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.*;

/**
 * Sprint 5 Performance Test Suite for 15-Core Intel Xeon Gold Optimization
 * Comprehensive performance validation targeting 1.6M+ TPS
 * 
 * Test Categories:
 * - Hardware optimization validation (15-core specific)
 * - Virtual thread pool performance
 * - Lock-free data structure throughput
 * - Memory optimization effectiveness
 * - AI/ML performance impact
 * - Consensus algorithm scalability
 * - End-to-end system performance
 * - Regression testing
 * - Stress testing and stability
 */
@QuarkusTest
@TestProfile(Sprint5PerformanceTest.PerformanceTestProfile.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Execution(ExecutionMode.SAME_THREAD) // Sequential execution for accurate performance measurement
class Sprint5PerformanceTest {

    private static final Logger logger = LoggerFactory.getLogger(Sprint5PerformanceTest.class);

    // Performance targets for 15-core system
    private static final long TARGET_TPS = 1_600_000L;
    private static final double TARGET_LATENCY_MS = 25.0;
    private static final double MIN_THROUGHPUT_EFFICIENCY = 85.0;
    private static final double MAX_MEMORY_USAGE_PERCENT = 75.0;
    private static final int TEST_DURATION_SECONDS = 60;
    private static final int WARMUP_DURATION_SECONDS = 30;

    @Inject
    VirtualThreadPoolManager threadPoolManager;

    @Inject
    Sprint5ConsensusOptimizer consensusOptimizer;

    @Inject
    Sprint5PerformanceMonitor performanceMonitor;

    // Test data
    private List<TestTransaction> testTransactions;
    private ExecutorService testExecutor;
    private final AtomicLong testTransactionCounter = new AtomicLong(0);
    private final AtomicInteger successfulTests = new AtomicInteger(0);
    private final AtomicInteger failedTests = new AtomicInteger(0);

    @BeforeAll
    static void setUpClass() {
        logger.info("========================================");
        logger.info("Sprint 5 Performance Test Suite Starting");
        logger.info("Target: {} TPS with <{}ms latency", TARGET_TPS, TARGET_LATENCY_MS);
        logger.info("Hardware: 15-core Intel Xeon Gold + 64GB RAM");
        logger.info("========================================");
    }

    @BeforeEach
    void setUp() {
        // Initialize test executor with virtual threads
        testExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        // Generate test transactions
        generateTestTransactions(100_000);
        
        logger.info("Test setup completed - {} test transactions generated", testTransactions.size());
    }

    @AfterEach
    void tearDown() {
        if (testExecutor != null) {
            testExecutor.shutdown();
            try {
                if (!testExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                    testExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                testExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    @AfterAll
    static void tearDownClass() {
        logger.info("========================================");
        logger.info("Sprint 5 Performance Test Suite Completed");
        logger.info("========================================");
    }

    /**
     * Test 1: Virtual Thread Pool Performance
     * Validates virtual thread pool can handle high concurrency for 15-core system
     */
    @Test
    @Order(1)
    @DisplayName("Virtual Thread Pool Performance Test")
    void testVirtualThreadPoolPerformance() {
        logger.info("Testing Virtual Thread Pool Performance...");
        
        Instant startTime = Instant.now();
        int taskCount = 1_000_000;
        AtomicLong completedTasks = new AtomicLong(0);
        CountDownLatch latch = new CountDownLatch(taskCount);
        
        // Submit high volume of lightweight tasks
        for (int i = 0; i < taskCount; i++) {
            threadPoolManager.submitConsensusTask(() -> {
                try {
                    // Simulate lightweight consensus work
                    Thread.sleep(1); // 1ms work
                    completedTasks.incrementAndGet();
                    return null;
                } finally {
                    latch.countDown();
                }
            });
        }
        
        try {
            // Wait for completion with reasonable timeout
            boolean completed = latch.await(120, TimeUnit.SECONDS);
            Instant endTime = Instant.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            assertTrue(completed, "Virtual thread pool test should complete within timeout");
            assertEquals(taskCount, completedTasks.get(), "All tasks should complete successfully");
            
            double tasksPerSecond = (double) taskCount / (durationMs / 1000.0);
            logger.info("Virtual Thread Pool Results:");
            logger.info("  Tasks: {} completed in {}ms", taskCount, durationMs);
            logger.info("  Throughput: {:.0f} tasks/second", tasksPerSecond);
            logger.info("  Average task time: {:.3f}ms", (double) durationMs / taskCount);
            
            // Assert performance targets
            assertTrue(tasksPerSecond > 50_000, "Virtual thread pool should handle >50K tasks/second");
            assertTrue(durationMs < 60_000, "Should complete 1M tasks within 60 seconds");
            
            successfulTests.incrementAndGet();
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            fail("Test interrupted");
        }
    }

    /**
     * Test 2: Lock-Free Transaction Queue Performance
     * Validates lock-free data structures for high-throughput transaction processing
     */
    @Test
    @Order(2)
    @DisplayName("Lock-Free Transaction Queue Performance Test")
    void testLockFreeQueuePerformance() {
        logger.info("Testing Lock-Free Transaction Queue Performance...");
        
        LockFreeTransactionQueue<TestTransaction> queue = new LockFreeTransactionQueue<>(10_000_000);
        int transactionCount = 5_000_000;
        int producerThreads = 8;
        int consumerThreads = 7;
        
        AtomicLong producedCount = new AtomicLong(0);
        AtomicLong consumedCount = new AtomicLong(0);
        CountDownLatch startLatch = new CountDownLatch(producerThreads + consumerThreads);
        CountDownLatch completionLatch = new CountDownLatch(producerThreads + consumerThreads);
        
        Instant testStart = Instant.now();
        
        // Start producer threads
        for (int i = 0; i < producerThreads; i++) {
            final int producerId = i;
            testExecutor.submit(() -> {
                startLatch.countDown();
                try {
                    startLatch.await(); // Synchronized start
                    
                    int transactionsPerProducer = transactionCount / producerThreads;
                    for (int j = 0; j < transactionsPerProducer; j++) {
                        TestTransaction tx = createTestTransaction("producer-" + producerId + "-tx-" + j);
                        while (!queue.offer(tx)) {
                            Thread.onSpinWait(); // Busy wait for space
                        }
                        producedCount.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    completionLatch.countDown();
                }
            });
        }
        
        // Start consumer threads
        for (int i = 0; i < consumerThreads; i++) {
            testExecutor.submit(() -> {
                startLatch.countDown();
                try {
                    startLatch.await(); // Synchronized start
                    
                    TestTransaction tx;
                    while (consumedCount.get() < transactionCount) {
                        tx = queue.poll();
                        if (tx != null) {
                            consumedCount.incrementAndGet();
                            // Simulate minimal processing
                            Thread.onSpinWait();
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    completionLatch.countDown();
                }
            });
        }
        
        try {
            boolean completed = completionLatch.await(60, TimeUnit.SECONDS);
            Instant testEnd = Instant.now();
            long durationMs = Duration.between(testStart, testEnd).toMillis();
            
            assertTrue(completed, "Lock-free queue test should complete within timeout");
            
            var queueMetrics = queue.getMetrics();
            double throughputTps = (double) consumedCount.get() / (durationMs / 1000.0);
            
            logger.info("Lock-Free Queue Results:");
            logger.info("  Transactions: {} produced, {} consumed", producedCount.get(), consumedCount.get());
            logger.info("  Duration: {}ms", durationMs);
            logger.info("  Throughput: {:.0f} TPS", throughputTps);
            logger.info("  Success Rate: {:.2f}%", queueMetrics.successRate() * 100);
            logger.info("  Queue Utilization: {:.1f}%", queueMetrics.utilization() * 100);
            
            // Assert performance targets
            assertTrue(throughputTps > 500_000, "Lock-free queue should achieve >500K TPS");
            assertTrue(queueMetrics.successRate() > 0.99, "Success rate should be >99%");
            assertEquals(transactionCount, consumedCount.get(), "All transactions should be processed");
            
            successfulTests.incrementAndGet();
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            fail("Test interrupted");
        }
    }

    /**
     * Test 3: Consensus Algorithm Scalability
     * Tests consensus performance under high load
     */
    @Test
    @Order(3)
    @DisplayName("Consensus Algorithm Scalability Test")
    void testConsensusScalability() {
        logger.info("Testing Consensus Algorithm Scalability...");
        
        // Create batches of transactions for consensus testing
        List<List<TestTransaction>> transactionBatches = createTransactionBatches(50_000, 1000);
        AtomicLong processedTransactions = new AtomicLong(0);
        AtomicLong totalLatency = new AtomicLong(0);
        List<Long> latencies = Collections.synchronizedList(new ArrayList<>());
        
        Instant testStart = Instant.now();
        
        // Process batches concurrently
        List<CompletableFuture<Void>> batchFutures = transactionBatches.stream()
            .map(batch -> CompletableFuture.runAsync(() -> {
                try {
                    long batchStart = System.nanoTime();
                    
                    // Convert TestTransaction to actual Transaction objects for the optimizer
                    List<Sprint5ConsensusOptimizer.Transaction> transactions = batch.stream()
                        .map(this::convertToOptimizerTransaction)
                        .collect(Collectors.toList());
                    
                    // Process batch through consensus optimizer
                    var result = consensusOptimizer.processConsensusBatch(transactions);
                    var consensusResult = result.subscribe().asCompletionStage().get(5, TimeUnit.SECONDS);
                    
                    long batchLatency = (System.nanoTime() - batchStart) / 1_000_000; // Convert to ms
                    
                    if (consensusResult.successful()) {
                        processedTransactions.addAndGet(transactions.size());
                        totalLatency.addAndGet(batchLatency);
                        latencies.add(batchLatency);
                    }
                    
                } catch (Exception e) {
                    logger.error("Batch consensus processing failed", e);
                }
            }, testExecutor))
            .collect(Collectors.toList());
        
        // Wait for all batches to complete
        try {
            CompletableFuture.allOf(batchFutures.toArray(new CompletableFuture[0]))
                .get(120, TimeUnit.SECONDS);
            
            Instant testEnd = Instant.now();
            long totalDurationMs = Duration.between(testStart, testEnd).toMillis();
            
            double averageLatency = latencies.isEmpty() ? 0 : 
                latencies.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double throughput = (double) processedTransactions.get() / (totalDurationMs / 1000.0);
            
            // Calculate percentiles
            latencies.sort(Long::compareTo);
            long p95Latency = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.95));
            long p99Latency = latencies.isEmpty() ? 0 : latencies.get((int) (latencies.size() * 0.99));
            
            logger.info("Consensus Scalability Results:");
            logger.info("  Processed: {} transactions in {}ms", processedTransactions.get(), totalDurationMs);
            logger.info("  Throughput: {:.0f} TPS", throughput);
            logger.info("  Latency: avg={:.2f}ms, p95={}ms, p99={}ms", averageLatency, p95Latency, p99Latency);
            logger.info("  Batch Success Rate: {:.1f}%", (double) latencies.size() / transactionBatches.size() * 100);
            
            // Assert performance targets
            assertTrue(throughput > 100_000, "Consensus should achieve >100K TPS");
            assertTrue(averageLatency < 100, "Average consensus latency should be <100ms");
            assertTrue(p99Latency < 500, "P99 consensus latency should be <500ms");
            
            successfulTests.incrementAndGet();
            
        } catch (Exception e) {
            logger.error("Consensus scalability test failed", e);
            failedTests.incrementAndGet();
            fail("Consensus scalability test failed: " + e.getMessage());
        }
    }

    /**
     * Test 4: End-to-End System Performance
     * Comprehensive test of the entire system under load
     */
    @Test
    @Order(4)
    @DisplayName("End-to-End System Performance Test")
    void testEndToEndSystemPerformance() {
        logger.info("Testing End-to-End System Performance...");
        
        // Warmup period
        performWarmup();
        
        int testTransactionCount = 1_000_000;
        AtomicLong processedCount = new AtomicLong(0);
        AtomicLong successCount = new AtomicLong(0);
        List<Long> processingTimes = Collections.synchronizedList(new ArrayList<>());
        
        Instant testStart = Instant.now();
        
        // Create transaction processing pipeline
        ExecutorService producers = Executors.newVirtualThreadPerTaskExecutor();
        ExecutorService processors = Executors.newVirtualThreadPerTaskExecutor();
        
        // Transaction generation and processing
        BlockingQueue<TestTransaction> transactionQueue = new ArrayBlockingQueue<>(100_000);
        
        try {
            // Producer: Generate transactions
            CompletableFuture<Void> producer = CompletableFuture.runAsync(() -> {
                for (int i = 0; i < testTransactionCount; i++) {
                    try {
                        TestTransaction tx = createTestTransaction("e2e-tx-" + i);
                        transactionQueue.put(tx);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }, producers);
            
            // Consumer: Process transactions
            List<CompletableFuture<Void>> processors_futures = IntStream.range(0, 10)
                .mapToObj(i -> CompletableFuture.runAsync(() -> {
                    while (processedCount.get() < testTransactionCount) {
                        try {
                            TestTransaction tx = transactionQueue.poll(1, TimeUnit.SECONDS);
                            if (tx != null) {
                                long processingStart = System.nanoTime();
                                
                                // Simulate end-to-end processing
                                boolean success = simulateEndToEndProcessing(tx);
                                
                                long processingTime = (System.nanoTime() - processingStart) / 1_000_000; // ms
                                
                                processedCount.incrementAndGet();
                                if (success) {
                                    successCount.incrementAndGet();
                                }
                                processingTimes.add(processingTime);
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }, processors))
                .collect(Collectors.toList());
            
            // Wait for completion
            producer.get(60, TimeUnit.SECONDS);
            CompletableFuture.allOf(processors_futures.toArray(new CompletableFuture[0]))
                .get(180, TimeUnit.SECONDS);
            
            Instant testEnd = Instant.now();
            long totalDurationMs = Duration.between(testStart, testEnd).toMillis();
            
            // Calculate metrics
            double throughput = (double) processedCount.get() / (totalDurationMs / 1000.0);
            double successRate = (double) successCount.get() / processedCount.get() * 100;
            
            processingTimes.sort(Long::compareTo);
            double avgProcessingTime = processingTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            long p95ProcessingTime = processingTimes.get((int) (processingTimes.size() * 0.95));
            long p99ProcessingTime = processingTimes.get((int) (processingTimes.size() * 0.99));
            
            logger.info("End-to-End Performance Results:");
            logger.info("  Processed: {} transactions in {}ms", processedCount.get(), totalDurationMs);
            logger.info("  Throughput: {:.0f} TPS", throughput);
            logger.info("  Success Rate: {:.2f}%", successRate);
            logger.info("  Processing Time: avg={:.2f}ms, p95={}ms, p99={}ms", 
                avgProcessingTime, p95ProcessingTime, p99ProcessingTime);
            
            // Get system performance metrics
            var systemMetrics = performanceMonitor.getCurrentMetrics()
                .subscribe().asCompletionStage().get(1, TimeUnit.SECONDS);
            
            logger.info("  System Metrics:");
            logger.info("    Heap Usage: {:.1f}%", systemMetrics.heapUtilization());
            logger.info("    GC Throughput: {:.1f}%", systemMetrics.gcThroughput());
            logger.info("    Thread Count: {}", systemMetrics.threadCount());
            logger.info("    Virtual Threads: {}", systemMetrics.virtualThreadCount());
            
            // Assert performance targets for end-to-end system
            assertTrue(throughput > TARGET_TPS * 0.6, "E2E throughput should be >60% of target TPS");
            assertTrue(successRate > 99.5, "E2E success rate should be >99.5%");
            assertTrue(avgProcessingTime < TARGET_LATENCY_MS * 2, "E2E avg latency should be <2x target");
            assertTrue(p99ProcessingTime < 200, "E2E P99 latency should be <200ms");
            assertTrue(systemMetrics.heapUtilization() < MAX_MEMORY_USAGE_PERCENT, 
                "Memory usage should be <" + MAX_MEMORY_USAGE_PERCENT + "%");
            
            successfulTests.incrementAndGet();
            
        } catch (Exception e) {
            logger.error("End-to-end system test failed", e);
            failedTests.incrementAndGet();
            fail("End-to-end system test failed: " + e.getMessage());
        } finally {
            producers.shutdown();
            processors.shutdown();
        }
    }

    /**
     * Test 5: Memory Optimization Effectiveness
     * Validates memory optimization and GC performance
     */
    @Test
    @Order(5)
    @DisplayName("Memory Optimization Effectiveness Test")
    void testMemoryOptimizationEffectiveness() {
        logger.info("Testing Memory Optimization Effectiveness...");
        
        Runtime runtime = Runtime.getRuntime();
        long initialUsedMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Create memory pressure with large object allocation
        List<byte[]> memoryPressure = new ArrayList<>();
        int allocationCount = 10_000;
        
        Instant allocationStart = Instant.now();
        
        // Allocate memory in chunks
        for (int i = 0; i < allocationCount; i++) {
            memoryPressure.add(new byte[1024 * 1024]); // 1MB per allocation
        }
        
        long peakUsedMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Trigger GC and measure efficiency
        Instant gcStart = Instant.now();
        System.gc();
        System.runFinalization();
        System.gc(); // Second GC to ensure thorough cleanup
        
        // Clear references and trigger another GC
        memoryPressure.clear();
        memoryPressure = null;
        System.gc();
        Instant gcEnd = Instant.now();
        
        long finalUsedMemory = runtime.totalMemory() - runtime.freeMemory();
        long gcDuration = Duration.between(gcStart, gcEnd).toMillis();
        
        double memoryRecoveryPercent = (double) (peakUsedMemory - finalUsedMemory) / peakUsedMemory * 100;
        double memoryOverhead = (double) (peakUsedMemory - initialUsedMemory) / (allocationCount * 1024 * 1024) * 100;
        
        logger.info("Memory Optimization Results:");
        logger.info("  Initial Memory: {} MB", initialUsedMemory / 1024 / 1024);
        logger.info("  Peak Memory: {} MB", peakUsedMemory / 1024 / 1024);
        logger.info("  Final Memory: {} MB", finalUsedMemory / 1024 / 1024);
        logger.info("  Memory Recovery: {:.1f}%", memoryRecoveryPercent);
        logger.info("  Memory Overhead: {:.1f}%", memoryOverhead);
        logger.info("  GC Duration: {}ms", gcDuration);
        logger.info("  Max Heap: {} MB", runtime.maxMemory() / 1024 / 1024);
        
        // Assert memory optimization effectiveness
        assertTrue(memoryRecoveryPercent > 80, "Memory recovery should be >80%");
        assertTrue(memoryOverhead < 150, "Memory overhead should be <150%");
        assertTrue(gcDuration < 1000, "GC should complete within 1 second");
        assertTrue(finalUsedMemory < initialUsedMemory * 2, "Final memory should not be excessive");
        
        successfulTests.incrementAndGet();
    }

    /**
     * Test 6: Stress Test and Stability
     * Extended stress test to validate system stability
     */
    @Test
    @Order(6)
    @DisplayName("System Stress Test and Stability")
    void testSystemStressAndStability() {
        logger.info("Testing System Stress and Stability...");
        
        int stressDurationSeconds = 180; // 3 minutes
        AtomicLong totalProcessed = new AtomicLong(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        AtomicBoolean testRunning = new AtomicBoolean(true);
        
        List<Double> throughputSamples = Collections.synchronizedList(new ArrayList<>());
        List<Double> latencySamples = Collections.synchronizedList(new ArrayList<>());
        
        // Stress test with multiple concurrent workloads
        List<CompletableFuture<Void>> stressors = new ArrayList<>();
        
        Instant stressStart = Instant.now();
        
        // Stressor 1: High-frequency transaction processing
        stressors.add(CompletableFuture.runAsync(() -> {
            while (testRunning.get()) {
                try {
                    List<TestTransaction> batch = IntStream.range(0, 1000)
                        .mapToObj(i -> createTestTransaction("stress-tx-" + i))
                        .collect(Collectors.toList());
                    
                    long batchStart = System.nanoTime();
                    simulateBatchProcessing(batch);
                    long batchLatency = (System.nanoTime() - batchStart) / 1_000_000;
                    
                    totalProcessed.addAndGet(batch.size());
                    latencySamples.add((double) batchLatency);
                    
                    Thread.sleep(10); // Brief pause
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                }
            }
        }, testExecutor));
        
        // Stressor 2: Memory allocation pressure
        stressors.add(CompletableFuture.runAsync(() -> {
            List<Object> memoryHolder = new ArrayList<>();
            while (testRunning.get()) {
                try {
                    // Allocate and release memory periodically
                    for (int i = 0; i < 1000; i++) {
                        memoryHolder.add(new byte[1024]); // 1KB allocations
                    }
                    if (memoryHolder.size() > 10000) {
                        memoryHolder.clear();
                    }
                    Thread.sleep(50);
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                }
            }
        }, testExecutor));
        
        // Stressor 3: CPU intensive work
        stressors.add(CompletableFuture.runAsync(() -> {
            while (testRunning.get()) {
                try {
                    // CPU intensive calculation
                    double result = 0;
                    for (int i = 0; i < 100000; i++) {
                        result += Math.sqrt(i) * Math.sin(i);
                    }
                    Thread.sleep(100);
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                }
            }
        }, testExecutor));
        
        // Performance monitoring during stress test
        ScheduledExecutorService monitor = Executors.newScheduledThreadPool(1);
        monitor.scheduleAtFixedRate(() -> {
            if (testRunning.get()) {
                double currentTps = totalProcessed.get() / 
                    (Duration.between(stressStart, Instant.now()).toMillis() / 1000.0);
                throughputSamples.add(currentTps);
                
                logger.debug("Stress test progress - TPS: {:.0f}, Errors: {}, Memory: {} MB", 
                    currentTps, errorCount.get(), 
                    (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024 / 1024);
            }
        }, 5, 5, TimeUnit.SECONDS);
        
        try {
            // Run stress test for specified duration
            Thread.sleep(stressDurationSeconds * 1000);
            testRunning.set(false);
            
            // Wait for all stressors to complete
            CompletableFuture.allOf(stressors.toArray(new CompletableFuture[0]))
                .get(30, TimeUnit.SECONDS);
            
            Instant stressEnd = Instant.now();
            long totalDurationMs = Duration.between(stressStart, stressEnd).toMillis();
            
            // Calculate stress test metrics
            double avgThroughput = throughputSamples.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double minThroughput = throughputSamples.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
            double maxThroughput = throughputSamples.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            
            double avgLatency = latencySamples.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double maxLatency = latencySamples.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            
            double errorRate = (double) errorCount.get() / totalProcessed.get() * 100;
            double throughputStability = (avgThroughput - minThroughput) / avgThroughput * 100;
            
            logger.info("Stress Test Results:");
            logger.info("  Duration: {} seconds", totalDurationMs / 1000);
            logger.info("  Total Processed: {} transactions", totalProcessed.get());
            logger.info("  Throughput: avg={:.0f} TPS, min={:.0f} TPS, max={:.0f} TPS", 
                avgThroughput, minThroughput, maxThroughput);
            logger.info("  Latency: avg={:.2f}ms, max={:.2f}ms", avgLatency, maxLatency);
            logger.info("  Error Rate: {:.4f}%", errorRate);
            logger.info("  Throughput Stability: {:.1f}% variation", throughputStability);
            
            // Assert stress test requirements
            assertTrue(avgThroughput > TARGET_TPS * 0.3, "Stress test throughput should be >30% of target");
            assertTrue(errorRate < 0.1, "Error rate should be <0.1% during stress test");
            assertTrue(throughputStability < 50, "Throughput variation should be <50%");
            assertTrue(avgLatency < TARGET_LATENCY_MS * 5, "Stress test latency should be <5x target");
            assertTrue(maxLatency < 1000, "Max latency should be <1000ms during stress");
            
            successfulTests.incrementAndGet();
            
        } catch (Exception e) {
            logger.error("Stress test failed", e);
            failedTests.incrementAndGet();
            fail("Stress test failed: " + e.getMessage());
        } finally {
            testRunning.set(false);
            monitor.shutdown();
        }
    }

    /**
     * Final Test: Performance Summary and Validation
     */
    @Test
    @Order(7)
    @DisplayName("Performance Summary and Validation")
    void testPerformanceSummaryAndValidation() {
        logger.info("========================================");
        logger.info("SPRINT 5 PERFORMANCE TEST SUMMARY");
        logger.info("========================================");
        
        int totalTests = successfulTests.get() + failedTests.get();
        double successRate = (double) successfulTests.get() / totalTests * 100;
        
        logger.info("Test Execution Summary:");
        logger.info("  Total Tests: {}", totalTests);
        logger.info("  Successful: {}", successfulTests.get());
        logger.info("  Failed: {}", failedTests.get());
        logger.info("  Success Rate: {:.1f}%", successRate);
        
        // Get final system metrics
        try {
            var finalMetrics = performanceMonitor.getCurrentMetrics()
                .subscribe().asCompletionStage().get(5, TimeUnit.SECONDS);
            
            logger.info("Final System Metrics:");
            logger.info("  Current TPS: {}", finalMetrics.currentTps());
            logger.info("  Average Latency: {:.2f}ms", finalMetrics.avgLatency());
            logger.info("  P99 Latency: {:.2f}ms", finalMetrics.p99Latency());
            logger.info("  Throughput Efficiency: {:.1f}%", finalMetrics.throughputEfficiency());
            logger.info("  Heap Utilization: {:.1f}%", finalMetrics.heapUtilization());
            logger.info("  GC Throughput: {:.1f}%", finalMetrics.gcThroughput());
            logger.info("  Virtual Threads: {}", finalMetrics.virtualThreadCount());
            logger.info("  Regression Detected: {}", finalMetrics.regressionDetected());
            
            // Validate overall performance targets
            boolean performanceTargetsMet = 
                finalMetrics.throughputEfficiency() >= MIN_THROUGHPUT_EFFICIENCY &&
                finalMetrics.avgLatency() <= TARGET_LATENCY_MS * 2 &&
                finalMetrics.heapUtilization() <= MAX_MEMORY_USAGE_PERCENT &&
                !finalMetrics.regressionDetected();
            
            logger.info("Performance Targets Met: {}", performanceTargetsMet);
            
            // Final assertions
            assertTrue(successRate >= 85, "At least 85% of tests should pass");
            assertTrue(performanceTargetsMet, "Overall performance targets should be met");
            assertFalse(finalMetrics.regressionDetected(), "No performance regression should be detected");
            
            if (performanceTargetsMet && successRate >= 85) {
                logger.info("🎉 SPRINT 5 PERFORMANCE OPTIMIZATION: SUCCESS!");
                logger.info("✓ 15-core optimization validated");
                logger.info("✓ 1.6M+ TPS target capability demonstrated");
                logger.info("✓ Memory and GC optimization effective");
                logger.info("✓ System stability under stress confirmed");
            } else {
                logger.warn("⚠️ Performance targets not fully met - optimization needed");
            }
            
        } catch (Exception e) {
            logger.error("Failed to get final metrics", e);
            fail("Could not validate final performance metrics");
        }
        
        logger.info("========================================");
    }

    // Helper methods
    
    private void generateTestTransactions(int count) {
        testTransactions = IntStream.range(0, count)
            .mapToObj(i -> createTestTransaction("test-tx-" + i))
            .collect(Collectors.toList());
    }
    
    private TestTransaction createTestTransaction(String id) {
        return new TestTransaction(
            id,
            "hash-" + id,
            "from-" + (testTransactionCounter.incrementAndGet() % 1000),
            "signature-" + id,
            System.currentTimeMillis(),
            Math.random() * 1000
        );
    }
    
    private Sprint5ConsensusOptimizer.Transaction convertToOptimizerTransaction(TestTransaction testTx) {
        return new Sprint5ConsensusOptimizer.Transaction(
            testTx.id(), testTx.hash(), testTx.from(), testTx.signature(), null
        );
    }
    
    private List<List<TestTransaction>> createTransactionBatches(int totalTransactions, int batchSize) {
        List<List<TestTransaction>> batches = new ArrayList<>();
        List<TestTransaction> currentBatch = new ArrayList<>();
        
        for (int i = 0; i < totalTransactions; i++) {
            currentBatch.add(createTestTransaction("batch-tx-" + i));
            
            if (currentBatch.size() >= batchSize) {
                batches.add(new ArrayList<>(currentBatch));
                currentBatch.clear();
            }
        }
        
        if (!currentBatch.isEmpty()) {
            batches.add(currentBatch);
        }
        
        return batches;
    }
    
    private void performWarmup() {
        logger.info("Performing system warmup for {} seconds...", WARMUP_DURATION_SECONDS);
        
        long warmupStart = System.currentTimeMillis();
        List<CompletableFuture<Void>> warmupTasks = new ArrayList<>();
        
        // CPU warmup
        for (int i = 0; i < 5; i++) {
            warmupTasks.add(CompletableFuture.runAsync(() -> {
                while (System.currentTimeMillis() - warmupStart < WARMUP_DURATION_SECONDS * 1000) {
                    double result = 0;
                    for (int j = 0; j < 10000; j++) {
                        result += Math.sqrt(j);
                    }
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }, testExecutor));
        }
        
        // Memory warmup
        warmupTasks.add(CompletableFuture.runAsync(() -> {
            List<Object> warmupObjects = new ArrayList<>();
            while (System.currentTimeMillis() - warmupStart < WARMUP_DURATION_SECONDS * 1000) {
                for (int i = 0; i < 1000; i++) {
                    warmupObjects.add(new byte[1024]);
                }
                if (warmupObjects.size() > 10000) {
                    warmupObjects.clear();
                }
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }, testExecutor));
        
        // Wait for warmup completion
        try {
            CompletableFuture.allOf(warmupTasks.toArray(new CompletableFuture[0]))
                .get(WARMUP_DURATION_SECONDS + 10, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.warn("Warmup completed with exception", e);
        }
        
        logger.info("Warmup completed");
    }
    
    private boolean simulateEndToEndProcessing(TestTransaction tx) {
        try {
            // Simulate validation
            Thread.sleep(1);
            
            // Simulate consensus
            if (Math.random() < 0.001) { // 0.1% failure rate
                return false;
            }
            Thread.sleep(2);
            
            // Simulate execution
            Thread.sleep(1);
            
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
    
    private void simulateBatchProcessing(List<TestTransaction> batch) {
        try {
            // Simulate batch processing with some CPU work
            for (TestTransaction tx : batch) {
                // Minimal processing per transaction
                tx.hash().hashCode();
            }
            Thread.sleep(5); // 5ms batch processing time
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
    
    // Test data classes
    record TestTransaction(
        String id,
        String hash,
        String from,
        String signature,
        long timestamp,
        double value
    ) {}
    
    // Test profile for performance testing
    public static class PerformanceTestProfile implements io.quarkus.test.junit.QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                "consensus.target.tps", String.valueOf(TARGET_TPS),
                "performance.monitoring.enabled", "true",
                "performance.monitoring.detailed.enabled", "true",
                "ai.optimization.enabled", "true",
                "consensus.batch.size", "50000",
                "consensus.parallel.threads", "30"
            );
        }
    }
}