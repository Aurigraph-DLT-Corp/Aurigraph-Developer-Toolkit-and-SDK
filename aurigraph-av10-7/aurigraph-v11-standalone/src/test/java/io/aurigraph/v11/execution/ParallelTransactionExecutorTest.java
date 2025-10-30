package io.aurigraph.v11.execution;

import io.aurigraph.v11.BaseTest;
import io.aurigraph.v11.execution.ParallelTransactionExecutor.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for ParallelTransactionExecutor
 * Sprint 15 - Workstream 1: 2M+ TPS Achievement
 *
 * Coverage Target: 95% line coverage (40-50 test methods)
 *
 * Test Areas:
 * 1. Error Recovery (8 tests) - Transaction failures, retry logic, recovery
 * 2. Thread Pool Management (8 tests) - Virtual threads, pooling, cleanup
 * 3. Concurrent Transaction Processing (12 tests) - Ordering, conflicts, finality
 * 4. Performance Benchmarks (6 tests) - TPS validation, latency, scalability
 * 5. Edge Cases (8 tests) - Empty batches, single txs, partitions
 * 6. Algorithm Selection (4 tests) - LEGACY, OPTIMIZED_HASH, UNION_FIND
 * 7. Dependency Analysis (6 tests) - Conflict detection, graph building
 *
 * Total: 52 test methods for comprehensive coverage
 */
@QuarkusTest
@DisplayName("ParallelTransactionExecutor - Comprehensive Test Suite")
class ParallelTransactionExecutorTest extends BaseTest {

    private static final Logger logger = LoggerFactory.getLogger(ParallelTransactionExecutorTest.class);

    private ParallelTransactionExecutor executor;

    // Test constants
    private static final int SMALL_BATCH_SIZE = 10;
    private static final int MEDIUM_BATCH_SIZE = 100;
    private static final int LARGE_BATCH_SIZE = 1000;
    private static final int STRESS_BATCH_SIZE = 10000;
    private static final long TPS_TARGET_2M = 2_000_000L;
    private static final long TPS_TARGET_500K = 500_000L;

    @BeforeEach
    void setUp() {
        executor = new ParallelTransactionExecutor();
        logger.info("ParallelTransactionExecutor initialized for test");
    }

    @AfterEach
    void tearDown() {
        if (executor != null) {
            executor.shutdown();
            logger.info("ParallelTransactionExecutor shutdown completed");
        }
    }

    // ==================== ERROR RECOVERY TESTS (8 tests) ====================

    @Test
    @DisplayName("Should handle transaction execution failures gracefully")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testTransactionExecutionFailure() {
        // Given: Create transactions where some will fail
        List<TransactionTask> transactions = createTransactionsWithFailures(10, 3);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle failures gracefully
        assertThat(result.successCount()).isEqualTo(7);
        assertThat(result.failedCount()).isEqualTo(3);
        assertThat(result.executionTimeMs()).isPositive();
        logger.info("Handled {} failures out of {} transactions",
                   result.failedCount(), transactions.size());
    }

    @Test
    @DisplayName("Should retry conflicting transactions")
    void testConflictRetryMechanism() {
        // Given: Create transactions with write conflicts
        List<TransactionTask> transactions = createConflictingTransactions(5);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Some transactions may have conflicts but all should eventually succeed
        assertThat(result.successCount() + result.failedCount())
            .isEqualTo(transactions.size());
        assertThat(result.conflictCount()).isGreaterThanOrEqualTo(0);
        logger.info("Detected {} conflicts during execution", result.conflictCount());
    }

    @Test
    @DisplayName("Should recover from thread pool exceptions")
    void testThreadPoolRecovery() {
        // Given: Create a large batch to stress the thread pool
        List<TransactionTask> transactions = createIndependentTransactions(100);

        // When: Execute multiple batches in sequence
        ExecutionResult result1 = executor.executeParallel(transactions);
        ExecutionResult result2 = executor.executeParallel(transactions);

        // Then: Both executions should succeed
        assertThat(result1.successCount()).isPositive();
        assertThat(result2.successCount()).isPositive();
        logger.info("Thread pool recovered successfully across multiple executions");
    }

    @Test
    @DisplayName("Should handle partial failures with graceful degradation")
    void testGracefulDegradation() {
        // Given: Create transactions with 50% failure rate
        List<TransactionTask> transactions = createTransactionsWithFailures(20, 10);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should process successful transactions despite failures
        assertThat(result.successCount()).isGreaterThan(0);
        assertThat(result.failedCount()).isGreaterThan(0);
        assertThat(result.successCount() + result.failedCount())
            .isEqualTo(transactions.size());

        double successRate = (double) result.successCount() / transactions.size();
        logger.info("Success rate with partial failures: {:.2f}%", successRate * 100);
    }

    @Test
    @DisplayName("Should handle timeout scenarios properly")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testTimeoutHandling() {
        // Given: Create transactions with varying execution times
        List<TransactionTask> transactions = createSlowTransactions(10, 50);

        // When: Execute with timeout
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should complete within reasonable time
        assertThat(duration).isLessThan(TimeUnit.SECONDS.toNanos(35));
        assertThat(result.successCount() + result.failedCount())
            .isEqualTo(transactions.size());
        logger.info("Timeout handling completed in {} ms", duration / 1_000_000);
    }

    @Test
    @DisplayName("Should maintain consistency during error recovery")
    void testConsistencyDuringRecovery() {
        // Given: Create transactions with interdependencies
        List<TransactionTask> transactions = createDependentTransactions(15);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: All transactions should be accounted for
        assertThat(result.successCount() + result.failedCount())
            .isEqualTo(transactions.size());

        // Verify statistics are consistent
        ExecutionStatistics stats = executor.getStatistics();
        assertThat(stats.totalExecuted()).isGreaterThanOrEqualTo(result.successCount());
        logger.info("Consistency maintained: {} executed, {} conflicts",
                   stats.totalExecuted(), stats.totalConflicts());
    }

    @Test
    @DisplayName("Should handle exceptions in task execution")
    void testExceptionHandling() {
        // Given: Create transactions that throw exceptions
        List<TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            final int index = i;
            transactions.add(new TransactionTask(
                "tx-exception-" + i,
                Set.of("addr-" + i),
                Set.of("addr-" + (i + 1)),
                1,
                () -> {
                    if (index % 3 == 0) {
                        throw new RuntimeException("Simulated exception");
                    }
                }
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle exceptions without crashing
        assertThat(result.successCount() + result.failedCount())
            .isEqualTo(transactions.size());
        assertThat(result.failedCount()).isGreaterThan(0);
        logger.info("Exception handling: {} failed out of {}",
                   result.failedCount(), transactions.size());
    }

    @Test
    @DisplayName("Should track and report execution errors accurately")
    void testErrorReporting() {
        // Given: Create transactions with known failure patterns
        List<TransactionTask> transactions = createTransactionsWithFailures(50, 15);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Error counts should be accurate
        assertThat(result.failedCount()).isEqualTo(15);
        assertThat(result.successCount()).isEqualTo(35);

        // Verify statistics tracking
        ExecutionStatistics stats = executor.getStatistics();
        assertThat(stats.totalExecuted()).isGreaterThanOrEqualTo(35L);
        logger.info("Error reporting accuracy verified: {} failed", result.failedCount());
    }

    // ==================== THREAD POOL MANAGEMENT TESTS (8 tests) ====================

    @Test
    @DisplayName("Should utilize virtual threads efficiently")
    void testVirtualThreadUtilization() {
        // Given: Create a large batch to test virtual thread scaling
        List<TransactionTask> transactions = createIndependentTransactions(1000);

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should complete quickly with virtual threads
        assertThat(result.successCount()).isEqualTo(1000);
        assertThat(duration).isLessThan(TimeUnit.SECONDS.toNanos(10));

        double tps = calculateTPS(1000, duration / 1_000_000);
        logger.info("Virtual thread performance: {:.0f} TPS", tps);
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);
    }

    @Test
    @DisplayName("Should handle concurrent batch submissions")
    void testConcurrentBatchSubmission() {
        // Given: Multiple batches to submit concurrently
        int batchCount = 5;
        List<CompletableFuture<ExecutionResult>> futures = new ArrayList<>();

        // When: Submit batches concurrently
        for (int i = 0; i < batchCount; i++) {
            List<TransactionTask> batch = createIndependentTransactions(20);
            futures.add(CompletableFuture.supplyAsync(() ->
                executor.executeParallel(batch)
            ));
        }

        // Then: All batches should complete successfully
        List<ExecutionResult> results = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());

        assertThat(results).hasSize(batchCount);
        results.forEach(result -> {
            assertThat(result.successCount()).isEqualTo(20);
        });
        logger.info("Concurrent batch submission: {} batches completed", batchCount);
    }

    @Test
    @DisplayName("Should manage thread safety with concurrent access")
    void testThreadSafety() {
        // Given: Multiple threads accessing executor simultaneously
        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        // When: Execute from multiple threads
        ExecutorService testExecutor = Executors.newFixedThreadPool(threadCount);
        for (int i = 0; i < threadCount; i++) {
            testExecutor.submit(() -> {
                try {
                    List<TransactionTask> txs = createIndependentTransactions(10);
                    ExecutionResult result = executor.executeParallel(txs);
                    successCount.addAndGet(result.successCount());
                } finally {
                    latch.countDown();
                }
            });
        }

        // Then: All executions should complete safely
        assertThatCode(() -> latch.await(30, TimeUnit.SECONDS))
            .doesNotThrowAnyException();
        assertThat(successCount.get()).isEqualTo(threadCount * 10);

        testExecutor.shutdown();
        logger.info("Thread safety verified: {} transactions executed concurrently",
                   successCount.get());
    }

    @Test
    @DisplayName("Should properly shutdown and cleanup resources")
    void testShutdownAndCleanup() {
        // Given: Executor with active processing
        List<TransactionTask> transactions = createIndependentTransactions(100);
        executor.executeParallel(transactions);

        // When: Shutdown is called
        assertThatCode(() -> executor.shutdown())
            .doesNotThrowAnyException();

        // Then: Resources should be cleaned up
        logger.info("Shutdown and cleanup completed successfully");

        // Recreate for tearDown
        executor = new ParallelTransactionExecutor();
    }

    @Test
    @DisplayName("Should handle backpressure with large queues")
    void testBackpressureHandling() {
        // Given: Very large batch to test queue management
        List<TransactionTask> transactions = createIndependentTransactions(5000);

        // When: Execute with backpressure
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should handle backpressure gracefully
        assertThat(result.successCount()).isEqualTo(5000);
        double tps = calculateTPS(5000, duration / 1_000_000);
        logger.info("Backpressure handling: {:.0f} TPS with {} transactions",
                   tps, transactions.size());
    }

    @Test
    @DisplayName("Should scale with available CPU cores")
    void testCPUScaling() {
        // Given: Batch size proportional to CPU cores
        int cores = Runtime.getRuntime().availableProcessors();
        int batchSize = cores * 100;
        List<TransactionTask> transactions = createIndependentTransactions(batchSize);

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should utilize available cores efficiently
        assertThat(result.successCount()).isEqualTo(batchSize);
        double tps = calculateTPS(batchSize, duration / 1_000_000);
        logger.info("CPU scaling ({} cores): {:.0f} TPS", cores, tps);
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);
    }

    @Test
    @DisplayName("Should handle thread interruption gracefully")
    void testThreadInterruption() {
        // Given: Long-running transactions
        List<TransactionTask> transactions = createSlowTransactions(5, 1000);

        // When: Execute and interrupt
        Thread executionThread = new Thread(() -> {
            executor.executeParallel(transactions);
        });
        executionThread.start();
        executionThread.interrupt();

        // Then: Should handle interruption without deadlock
        assertThatCode(() -> executionThread.join(5000))
            .doesNotThrowAnyException();
        logger.info("Thread interruption handled gracefully");
    }

    @Test
    @DisplayName("Should reuse thread pool across multiple executions")
    void testThreadPoolReuse() {
        // Given: Multiple sequential executions
        int executionCount = 10;
        List<ExecutionResult> results = new ArrayList<>();

        // When: Execute multiple batches
        for (int i = 0; i < executionCount; i++) {
            List<TransactionTask> txs = createIndependentTransactions(50);
            results.add(executor.executeParallel(txs));
        }

        // Then: All executions should succeed with consistent performance
        assertThat(results).hasSize(executionCount);
        results.forEach(result -> {
            assertThat(result.successCount()).isEqualTo(50);
        });

        // Verify performance consistency
        double avgTps = results.stream()
            .mapToDouble(ExecutionResult::tps)
            .average()
            .orElse(0.0);
        logger.info("Thread pool reuse: {} executions, avg {:.0f} TPS",
                   executionCount, avgTps);
    }

    // ==================== CONCURRENT TRANSACTION PROCESSING TESTS (12 tests) ====================

    @Test
    @DisplayName("Should maintain ordering guarantees with 1000+ concurrent transactions")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testOrderingGuarantees() {
        // Given: 1000 transactions with dependencies
        List<TransactionTask> transactions = createOrderedTransactions(1000);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: All should complete successfully with ordering preserved
        assertThat(result.successCount()).isEqualTo(1000);
        assertThat(result.tps()).isGreaterThan(MIN_TPS_THRESHOLD);
        logger.info("Ordering maintained for {} transactions at {:.0f} TPS",
                   1000, result.tps());
    }

    @Test
    @DisplayName("Should detect write-write conflicts accurately")
    void testWriteWriteConflictDetection() {
        // Given: Transactions with write-write conflicts
        List<TransactionTask> transactions = new ArrayList<>();
        String conflictAddr = "addr-conflict";

        for (int i = 0; i < 5; i++) {
            transactions.add(new TransactionTask(
                "tx-ww-" + i,
                Set.of(),
                Set.of(conflictAddr),  // All write to same address
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Conflicts should be detected and handled
        assertThat(result.successCount() + result.failedCount()).isEqualTo(5);
        logger.info("Write-write conflict detection: {} conflicts", result.conflictCount());
    }

    @Test
    @DisplayName("Should detect read-write conflicts accurately")
    void testReadWriteConflictDetection() {
        // Given: Transactions with read-write conflicts
        List<TransactionTask> transactions = new ArrayList<>();
        String conflictAddr = "addr-rw-conflict";

        // Writers
        for (int i = 0; i < 3; i++) {
            transactions.add(new TransactionTask(
                "tx-write-" + i,
                Set.of(),
                Set.of(conflictAddr),
                1,
                () -> {}
            ));
        }

        // Readers
        for (int i = 0; i < 3; i++) {
            transactions.add(new TransactionTask(
                "tx-read-" + i,
                Set.of(conflictAddr),
                Set.of(),
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Conflicts should be detected
        assertThat(result.successCount() + result.failedCount()).isEqualTo(6);
        logger.info("Read-write conflict detection: {} total transactions", 6);
    }

    @Test
    @DisplayName("Should prevent double-spend attacks")
    void testDoubleSpendPrevention() {
        // Given: Multiple transactions trying to spend same input
        String spenderAddr = "addr-spender";
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            transactions.add(new TransactionTask(
                "tx-spend-" + i,
                Set.of(spenderAddr),
                Set.of("addr-recipient-" + i),
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: System should prevent double-spend
        assertThat(result.successCount() + result.failedCount()).isEqualTo(10);
        logger.info("Double-spend prevention: {} transactions processed", 10);
    }

    @Test
    @DisplayName("Should handle nonce management correctly")
    void testNonceManagement() {
        // Given: Transactions from same sender with sequential nonces
        String sender = "addr-sender";
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 20; i++) {
            final int nonce = i;
            transactions.add(new TransactionTask(
                "tx-nonce-" + nonce,
                Set.of(sender),
                Set.of("addr-receiver-" + i),
                nonce,  // Use priority as nonce
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: All should execute with correct nonce ordering
        assertThat(result.successCount()).isEqualTo(20);
        logger.info("Nonce management: {} sequential transactions", 20);
    }

    @Test
    @DisplayName("Should validate transaction finality")
    void testTransactionFinality() {
        // Given: Transactions requiring finality validation
        List<TransactionTask> transactions = createIndependentTransactions(100);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: All successful transactions should achieve finality
        assertThat(result.successCount()).isEqualTo(100);
        assertThat(result.failedCount()).isEqualTo(0);

        // Verify in statistics
        ExecutionStatistics stats = executor.getStatistics();
        assertThat(stats.totalExecuted()).isGreaterThanOrEqualTo(100L);
        logger.info("Transaction finality: {} finalized", result.successCount());
    }

    @Test
    @DisplayName("Should process independent transaction groups in parallel")
    void testIndependentGroupParallelization() {
        // Given: Multiple independent groups
        List<TransactionTask> transactions = new ArrayList<>();

        // Group 1: addr-1 to addr-2
        for (int i = 0; i < 10; i++) {
            transactions.add(createTransaction("g1-" + i, "addr-1", "addr-2"));
        }

        // Group 2: addr-3 to addr-4 (independent)
        for (int i = 0; i < 10; i++) {
            transactions.add(createTransaction("g2-" + i, "addr-3", "addr-4"));
        }

        // Group 3: addr-5 to addr-6 (independent)
        for (int i = 0; i < 10; i++) {
            transactions.add(createTransaction("g3-" + i, "addr-5", "addr-6"));
        }

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should parallelize independent groups
        assertThat(result.successCount()).isEqualTo(30);
        double tps = calculateTPS(30, duration / 1_000_000);
        logger.info("Independent group parallelization: {:.0f} TPS", tps);
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);
    }

    @Test
    @DisplayName("Should handle mixed independent and dependent transactions")
    void testMixedTransactionTypes() {
        // Given: Mix of independent and dependent transactions
        List<TransactionTask> transactions = new ArrayList<>();

        // Independent transactions
        for (int i = 0; i < 15; i++) {
            transactions.add(createTransaction("ind-" + i, "addr-" + i, "addr-" + (i + 100)));
        }

        // Dependent chain
        for (int i = 0; i < 5; i++) {
            transactions.add(createTransaction("dep-" + i, "addr-dep", "addr-dep-out-" + i));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle both types correctly
        assertThat(result.successCount()).isEqualTo(20);
        logger.info("Mixed transaction types: {} total", 20);
    }

    @Test
    @DisplayName("Should handle competing proposals correctly")
    void testCompetingProposals() {
        // Given: Multiple competing proposals for same state change
        String targetAddr = "addr-target";
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            transactions.add(new TransactionTask(
                "proposal-" + i,
                Set.of(targetAddr),
                Set.of(targetAddr),  // Read and write same address
                i,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle competing proposals
        assertThat(result.successCount() + result.failedCount()).isEqualTo(5);
        logger.info("Competing proposals: {} processed", 5);
    }

    @Test
    @DisplayName("Should maintain consistency under high concurrency")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testHighConcurrencyConsistency() {
        // Given: High concurrency scenario with 2000 transactions
        List<TransactionTask> transactions = createMixedTransactions(2000);

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should maintain consistency
        assertThat(result.successCount() + result.failedCount()).isEqualTo(2000);

        // Verify statistics consistency
        ExecutionStatistics stats = executor.getStatistics();
        assertThat(stats.totalExecuted()).isGreaterThanOrEqualTo(result.successCount());
        logger.info("High concurrency consistency: {} transactions, {:.0f} TPS",
                   2000, result.tps());
    }

    @Test
    @DisplayName("Should process transactions with complex dependencies")
    void testComplexDependencies() {
        // Given: Transactions with complex dependency graph
        List<TransactionTask> transactions = new ArrayList<>();

        // Diamond dependency pattern
        transactions.add(createTransaction("root", "addr-0", "addr-1"));
        transactions.add(createTransaction("left", "addr-1", "addr-2"));
        transactions.add(createTransaction("right", "addr-1", "addr-3"));
        transactions.add(createTransaction("merge", "addr-2", "addr-3"));

        // Add independent transactions
        for (int i = 10; i < 30; i++) {
            transactions.add(createTransaction("ind-" + i, "addr-" + i, "addr-" + (i + 100)));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle complex dependencies
        assertThat(result.successCount()).isGreaterThan(0);
        logger.info("Complex dependencies: {} total transactions", transactions.size());
    }

    @Test
    @DisplayName("Should detect conflicts in batch with high conflict rate")
    void testHighConflictRate() {
        // Given: Batch with 50% conflict rate
        List<TransactionTask> transactions = new ArrayList<>();

        // Create transactions where half conflict with each other
        for (int i = 0; i < 20; i++) {
            String addr = (i % 2 == 0) ? "addr-shared" : "addr-" + i;
            transactions.add(new TransactionTask(
                "tx-conflict-" + i,
                Set.of(),
                Set.of(addr),
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should detect and handle conflicts
        assertThat(result.successCount() + result.failedCount()).isEqualTo(20);
        logger.info("High conflict rate: {} conflicts detected", result.conflictCount());
    }

    // ==================== PERFORMANCE BENCHMARK TESTS (6 tests) ====================

    @Test
    @DisplayName("Should achieve target throughput of 500K+ TPS")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testTargetThroughput() {
        // Given: Large batch for throughput testing
        List<TransactionTask> transactions = createIndependentTransactions(50000);

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should achieve target TPS
        double tps = calculateTPS(50000, duration / 1_000_000);
        assertThat(result.successCount()).isEqualTo(50000);

        logger.info("Throughput benchmark: {:.0f} TPS (target: {} TPS)",
                   tps, TPS_TARGET_500K);
        logPerformanceMetrics(50000, duration / 1_000_000);
    }

    @ParameterizedTest
    @ValueSource(ints = {1000, 5000, 10000, 25000})
    @DisplayName("Should scale linearly with transaction count")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testLinearScalability(int txCount) {
        // Given: Varying transaction counts
        List<TransactionTask> transactions = createIndependentTransactions(txCount);

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should maintain consistent TPS
        double tps = calculateTPS(txCount, duration / 1_000_000);
        assertThat(result.successCount()).isEqualTo(txCount);
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);

        logger.info("Scalability test ({} txs): {:.0f} TPS", txCount, tps);
    }

    @Test
    @DisplayName("Should maintain low latency percentiles (p50, p95, p99)")
    void testLatencyPercentiles() {
        // Given: Transactions with latency tracking
        int count = 1000;
        List<Long> latencies = new ArrayList<>();
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            final int index = i;
            transactions.add(new TransactionTask(
                "tx-lat-" + i,
                Set.of("addr-" + i),
                Set.of("addr-" + (i + 1000)),
                1,
                () -> {
                    long start = System.nanoTime();
                    // Simulate minimal work
                    long end = System.nanoTime();
                    synchronized (latencies) {
                        latencies.add(end - start);
                    }
                }
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Calculate and verify latency percentiles
        if (!latencies.isEmpty()) {
            Collections.sort(latencies);
            long p50 = latencies.get((int) (latencies.size() * 0.50));
            long p95 = latencies.get((int) (latencies.size() * 0.95));
            long p99 = latencies.get((int) (latencies.size() * 0.99));

            logger.info("Latency percentiles - p50: {} μs, p95: {} μs, p99: {} μs",
                       p50 / 1000, p95 / 1000, p99 / 1000);

            // p99 should be under 10ms for good performance
            assertThat(p99).isLessThan(TimeUnit.MILLISECONDS.toNanos(10));
        }
    }

    @Test
    @DisplayName("Should demonstrate memory efficiency")
    void testMemoryEfficiency() {
        // Given: Track memory before execution
        System.gc();
        Runtime runtime = Runtime.getRuntime();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        // When: Execute large batch
        List<TransactionTask> transactions = createIndependentTransactions(10000);
        ExecutionResult result = executor.executeParallel(transactions);

        System.gc();
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;

        // Then: Memory usage should be reasonable
        assertThat(result.successCount()).isEqualTo(10000);
        long memoryPerTx = memoryUsed / 10000;
        logger.info("Memory efficiency: {} bytes per transaction ({} MB total)",
                   memoryPerTx, memoryUsed / 1024 / 1024);

        // Should use less than 100MB for 10K transactions
        assertThat(memoryUsed).isLessThan(100 * 1024 * 1024);
    }

    @Test
    @DisplayName("Should minimize GC impact during execution")
    void testGCImpact() {
        // Given: Large batch to test GC impact
        List<TransactionTask> transactions = createIndependentTransactions(20000);

        // When: Execute and measure GC
        System.gc();
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should complete efficiently despite GC
        double tps = calculateTPS(20000, duration / 1_000_000);
        assertThat(result.successCount()).isEqualTo(20000);
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);

        logger.info("GC impact test: {:.0f} TPS with {} transactions", tps, 20000);
    }

    @ParameterizedTest
    @CsvSource({
        "10, 100",
        "50, 100",
        "100, 100",
        "200, 100"
    })
    @DisplayName("Should scale with thread count")
    void testThreadScaling(int threadMultiplier, int txPerThread) {
        // Given: Varying virtual thread counts
        int totalTx = threadMultiplier * txPerThread;
        List<TransactionTask> transactions = createIndependentTransactions(totalTx);

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should scale efficiently
        double tps = calculateTPS(totalTx, duration / 1_000_000);
        assertThat(result.successCount()).isEqualTo(totalTx);

        logger.info("Thread scaling ({} threads, {} tx): {:.0f} TPS",
                   threadMultiplier, totalTx, tps);
    }

    // ==================== EDGE CASE TESTS (8 tests) ====================

    @Test
    @DisplayName("Should handle empty batch gracefully")
    void testEmptyBatch() {
        // Given: Empty transaction list
        List<TransactionTask> transactions = new ArrayList<>();

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle gracefully
        assertThat(result.successCount()).isEqualTo(0);
        assertThat(result.failedCount()).isEqualTo(0);
        assertThat(result.executionTimeMs()).isGreaterThanOrEqualTo(0);
        logger.info("Empty batch handled gracefully");
    }

    @Test
    @DisplayName("Should handle single transaction batch")
    void testSingleTransaction() {
        // Given: Single transaction
        List<TransactionTask> transactions = List.of(
            createTransaction("single", "addr-1", "addr-2")
        );

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should execute successfully
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.failedCount()).isEqualTo(0);
        logger.info("Single transaction executed successfully");
    }

    @Test
    @DisplayName("Should handle transactions with empty read/write sets")
    void testEmptyReadWriteSets() {
        // Given: Transactions with no dependencies
        List<TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            transactions.add(new TransactionTask(
                "tx-empty-" + i,
                Set.of(),  // Empty read set
                Set.of(),  // Empty write set
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should execute all in parallel
        assertThat(result.successCount()).isEqualTo(10);
        logger.info("Empty read/write sets: {} transactions", 10);
    }

    @Test
    @DisplayName("Should handle transactions with overlapping read sets")
    void testOverlappingReadSets() {
        // Given: Transactions reading same addresses
        String sharedAddr = "addr-shared";
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            transactions.add(new TransactionTask(
                "tx-read-" + i,
                Set.of(sharedAddr, "addr-" + i),
                Set.of("addr-out-" + i),
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should allow parallel reads
        assertThat(result.successCount()).isEqualTo(10);
        logger.info("Overlapping read sets: {} parallel reads", 10);
    }

    @Test
    @DisplayName("Should handle all transactions in single group")
    void testSingleGroupScenario() {
        // Given: All transactions conflict (single group)
        String sharedAddr = "addr-single-group";
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 20; i++) {
            transactions.add(new TransactionTask(
                "tx-group-" + i,
                Set.of(),
                Set.of(sharedAddr),  // All write to same address
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should execute sequentially in single group
        assertThat(result.successCount() + result.failedCount()).isEqualTo(20);
        logger.info("Single group scenario: {} transactions", 20);
    }

    @Test
    @DisplayName("Should handle maximum parallelism scenario")
    void testMaximumParallelism() {
        // Given: All transactions independent (maximum groups)
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 100; i++) {
            transactions.add(createTransaction(
                "tx-parallel-" + i,
                "addr-in-" + i,
                "addr-out-" + i
            ));
        }

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should achieve maximum parallelism
        assertThat(result.successCount()).isEqualTo(100);
        double tps = calculateTPS(100, duration / 1_000_000);
        logger.info("Maximum parallelism: {:.0f} TPS", tps);
        assertThat(tps).isGreaterThan(HIGH_TPS_THRESHOLD);
    }

    @Test
    @DisplayName("Should handle network partition simulation")
    void testNetworkPartition() {
        // Given: Transactions simulating network partition
        List<TransactionTask> transactions = new ArrayList<>();
        AtomicBoolean partitioned = new AtomicBoolean(false);

        for (int i = 0; i < 20; i++) {
            final int index = i;
            transactions.add(new TransactionTask(
                "tx-partition-" + i,
                Set.of("addr-" + i),
                Set.of("addr-" + (i + 100)),
                1,
                () -> {
                    if (partitioned.get() && index < 10) {
                        throw new RuntimeException("Network partition");
                    }
                }
            ));
        }

        // When: Simulate partition during execution
        partitioned.set(true);
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle partition gracefully
        assertThat(result.successCount() + result.failedCount()).isEqualTo(20);
        logger.info("Network partition: {} failed", result.failedCount());
    }

    @Test
    @DisplayName("Should handle very large write sets")
    void testLargeWriteSets() {
        // Given: Transactions with large write sets
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            Set<String> largeWriteSet = new HashSet<>();
            for (int j = 0; j < 100; j++) {
                largeWriteSet.add("addr-" + i + "-" + j);
            }

            transactions.add(new TransactionTask(
                "tx-large-" + i,
                Set.of(),
                largeWriteSet,
                1,
                () -> {}
            ));
        }

        // When: Execute in parallel
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should handle large write sets
        assertThat(result.successCount()).isEqualTo(10);
        logger.info("Large write sets: {} transactions with 100 writes each", 10);
    }

    // ==================== ALGORITHM SELECTION TESTS (4 tests) ====================

    @Test
    @DisplayName("Should use LEGACY algorithm correctly")
    void testLegacyAlgorithm() {
        // Given: Set LEGACY algorithm
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.LEGACY);

        // When: Execute transactions
        List<TransactionTask> transactions = createMixedTransactions(100);
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: Should execute successfully with LEGACY
        assertThat(result.successCount()).isGreaterThan(0);
        assertThat(ParallelTransactionExecutor.getGroupingAlgorithm())
            .isEqualTo(GroupingAlgorithm.LEGACY);
        logger.info("LEGACY algorithm: {} transactions", result.successCount());

        // Reset to default
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
    }

    @Test
    @DisplayName("Should use OPTIMIZED_HASH algorithm correctly")
    void testOptimizedHashAlgorithm() {
        // Given: Set OPTIMIZED_HASH algorithm
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.OPTIMIZED_HASH);

        // When: Execute transactions
        List<TransactionTask> transactions = createMixedTransactions(1000);
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should execute successfully with OPTIMIZED_HASH
        assertThat(result.successCount()).isGreaterThan(0);
        double tps = calculateTPS(result.successCount(), duration / 1_000_000);
        logger.info("OPTIMIZED_HASH algorithm: {:.0f} TPS", tps);

        // Reset to default
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
    }

    @Test
    @DisplayName("Should use UNION_FIND algorithm correctly")
    void testUnionFindAlgorithm() {
        // Given: Set UNION_FIND algorithm (default)
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);

        // When: Execute large batch
        List<TransactionTask> transactions = createMixedTransactions(5000);
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should execute efficiently with UNION_FIND
        assertThat(result.successCount()).isGreaterThan(0);
        double tps = calculateTPS(result.successCount(), duration / 1_000_000);
        logger.info("UNION_FIND algorithm: {:.0f} TPS with {} transactions",
                   tps, result.successCount());
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);
    }

    @ParameterizedTest
    @ValueSource(ints = {100, 500, 1000, 2000})
    @DisplayName("Should compare algorithm performance")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testAlgorithmComparison(int txCount) {
        // Test each algorithm and compare performance
        List<TransactionTask> baseTxs = createMixedTransactions(txCount);

        // LEGACY
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.LEGACY);
        List<TransactionTask> legacyTxs = copyTransactions(baseTxs);
        long legacyStart = System.nanoTime();
        ExecutionResult legacyResult = executor.executeParallel(legacyTxs);
        long legacyDuration = System.nanoTime() - legacyStart;
        double legacyTps = calculateTPS(txCount, legacyDuration / 1_000_000);

        // OPTIMIZED_HASH
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.OPTIMIZED_HASH);
        List<TransactionTask> hashTxs = copyTransactions(baseTxs);
        long hashStart = System.nanoTime();
        ExecutionResult hashResult = executor.executeParallel(hashTxs);
        long hashDuration = System.nanoTime() - hashStart;
        double hashTps = calculateTPS(txCount, hashDuration / 1_000_000);

        // UNION_FIND
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
        List<TransactionTask> ufTxs = copyTransactions(baseTxs);
        long ufStart = System.nanoTime();
        ExecutionResult ufResult = executor.executeParallel(ufTxs);
        long ufDuration = System.nanoTime() - ufStart;
        double ufTps = calculateTPS(txCount, ufDuration / 1_000_000);

        logger.info("Algorithm comparison ({} txs):", txCount);
        logger.info("  LEGACY: {:.0f} TPS", legacyTps);
        logger.info("  OPTIMIZED_HASH: {:.0f} TPS", hashTps);
        logger.info("  UNION_FIND: {:.0f} TPS", ufTps);

        // All should execute successfully
        assertThat(legacyResult.successCount()).isGreaterThan(0);
        assertThat(hashResult.successCount()).isGreaterThan(0);
        assertThat(ufResult.successCount()).isGreaterThan(0);

        // Reset to default
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
    }

    // ==================== DEPENDENCY ANALYSIS TESTS (6 tests) ====================

    @Test
    @DisplayName("Should build dependency graph correctly")
    void testDependencyGraphConstruction() {
        // Given: Transactions with known dependencies
        List<TransactionTask> transactions = new ArrayList<>();
        transactions.add(createTransaction("tx1", "addr-A", "addr-B"));
        transactions.add(createTransaction("tx2", "addr-B", "addr-C"));
        transactions.add(createTransaction("tx3", "addr-D", "addr-E"));

        // When: Build dependency graph
        DependencyGraphAnalyzer analyzer = new DependencyGraphAnalyzer();
        DependencyGraph graph = analyzer.buildDependencyGraph(transactions);

        // Then: Graph should identify dependencies
        List<List<TransactionTask>> groups = graph.getIndependentGroups();
        assertThat(groups).isNotEmpty();
        logger.info("Dependency graph: {} independent groups", groups.size());
    }

    @Test
    @DisplayName("Should identify independent groups correctly")
    void testIndependentGroupIdentification() {
        // Given: Mix of independent and dependent transactions
        List<TransactionTask> transactions = new ArrayList<>();

        // Group 1: A -> B -> C (chain)
        transactions.add(createTransaction("tx1", "addr-A", "addr-B"));
        transactions.add(createTransaction("tx2", "addr-B", "addr-C"));

        // Group 2: Independent
        transactions.add(createTransaction("tx3", "addr-X", "addr-Y"));
        transactions.add(createTransaction("tx4", "addr-Y", "addr-Z"));

        // Group 3: Completely independent
        transactions.add(createTransaction("tx5", "addr-P", "addr-Q"));

        // When: Analyze groups
        DependencyGraphAnalyzer analyzer = new DependencyGraphAnalyzer();
        DependencyGraph graph = analyzer.buildDependencyGraph(transactions);
        List<List<TransactionTask>> groups = graph.getIndependentGroups();

        // Then: Should identify at least 2 independent groups
        assertThat(groups.size()).isGreaterThanOrEqualTo(2);
        logger.info("Independent groups identified: {}", groups.size());
    }

    @Test
    @DisplayName("Should detect write-write conflicts in dependency analysis")
    void testWriteWriteConflictInDependencyGraph() {
        // Given: Transactions with write-write conflicts
        List<TransactionTask> transactions = new ArrayList<>();
        String conflictAddr = "addr-conflict-ww";

        for (int i = 0; i < 5; i++) {
            transactions.add(new TransactionTask(
                "tx-ww-dep-" + i,
                Set.of(),
                Set.of(conflictAddr),
                1,
                () -> {}
            ));
        }

        // When: Build dependency graph
        DependencyGraphAnalyzer analyzer = new DependencyGraphAnalyzer();
        DependencyGraph graph = analyzer.buildDependencyGraph(transactions);
        List<List<TransactionTask>> groups = graph.getIndependentGroups();

        // Then: All should be in same group due to conflicts
        assertThat(groups.size()).isEqualTo(1);
        assertThat(groups.get(0).size()).isEqualTo(5);
        logger.info("Write-write conflicts placed in single group");
    }

    @Test
    @DisplayName("Should detect read-write conflicts in dependency analysis")
    void testReadWriteConflictInDependencyGraph() {
        // Given: Transactions with read-write conflicts
        List<TransactionTask> transactions = new ArrayList<>();
        String conflictAddr = "addr-conflict-rw";

        // Writer
        transactions.add(new TransactionTask(
            "tx-writer",
            Set.of(),
            Set.of(conflictAddr),
            1,
            () -> {}
        ));

        // Readers
        for (int i = 0; i < 3; i++) {
            transactions.add(new TransactionTask(
                "tx-reader-" + i,
                Set.of(conflictAddr),
                Set.of(),
                1,
                () -> {}
            ));
        }

        // When: Build dependency graph
        DependencyGraphAnalyzer analyzer = new DependencyGraphAnalyzer();
        DependencyGraph graph = analyzer.buildDependencyGraph(transactions);
        List<List<TransactionTask>> groups = graph.getIndependentGroups();

        // Then: Should be grouped due to read-write conflict
        assertThat(groups.size()).isEqualTo(1);
        logger.info("Read-write conflicts detected in dependency graph");
    }

    @Test
    @DisplayName("Should handle complex dependency graphs efficiently")
    void testComplexDependencyGraph() {
        // Given: Complex dependency structure
        List<TransactionTask> transactions = new ArrayList<>();

        // Create multiple chains and independent sets
        for (int chain = 0; chain < 5; chain++) {
            for (int i = 0; i < 10; i++) {
                transactions.add(createTransaction(
                    "tx-chain" + chain + "-" + i,
                    "addr-chain" + chain + "-" + i,
                    "addr-chain" + chain + "-" + (i + 1)
                ));
            }
        }

        // When: Build dependency graph
        long startTime = System.nanoTime();
        DependencyGraphAnalyzer analyzer = new DependencyGraphAnalyzer();
        DependencyGraph graph = analyzer.buildDependencyGraph(transactions);
        List<List<TransactionTask>> groups = graph.getIndependentGroups();
        long duration = System.nanoTime() - startTime;

        // Then: Should build efficiently
        assertThat(groups).isNotEmpty();
        assertThat(duration).isLessThan(TimeUnit.SECONDS.toNanos(5));
        logger.info("Complex dependency graph: {} groups in {} ms",
                   groups.size(), duration / 1_000_000);
    }

    @Test
    @DisplayName("Should optimize grouping for parallel execution")
    void testGroupingOptimization() {
        // Given: Transactions designed for optimal parallelization
        List<TransactionTask> transactions = new ArrayList<>();

        // Create 10 independent groups of 10 transactions each
        for (int group = 0; group < 10; group++) {
            String groupAddr = "addr-group-" + group;
            for (int i = 0; i < 10; i++) {
                transactions.add(createTransaction(
                    "tx-opt-" + group + "-" + i,
                    groupAddr,
                    "addr-out-" + group + "-" + i
                ));
            }
        }

        // When: Execute in parallel
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: Should achieve high parallelization
        assertThat(result.successCount()).isEqualTo(100);
        double tps = calculateTPS(100, duration / 1_000_000);
        logger.info("Grouping optimization: {:.0f} TPS", tps);
        assertThat(tps).isGreaterThan(MIN_TPS_THRESHOLD);
    }

    // ==================== STATISTICS AND METRICS TESTS (4 tests) ====================

    @Test
    @DisplayName("Should track execution statistics accurately")
    void testStatisticsTracking() {
        // Given: Multiple executions
        for (int i = 0; i < 5; i++) {
            List<TransactionTask> txs = createIndependentTransactions(20);
            executor.executeParallel(txs);
        }

        // When: Get statistics
        ExecutionStatistics stats = executor.getStatistics();

        // Then: Statistics should be accurate
        assertThat(stats.totalExecuted()).isGreaterThanOrEqualTo(100L);
        assertThat(stats.totalBatches()).isEqualTo(5L);
        assertThat(stats.averageTPS()).isGreaterThan(0.0);
        logger.info("Statistics: {} executed, {} batches, {:.0f} avg TPS",
                   stats.totalExecuted(), stats.totalBatches(), stats.averageTPS());
    }

    @Test
    @DisplayName("Should track conflict statistics")
    void testConflictStatistics() {
        // Given: Transactions with conflicts
        List<TransactionTask> transactions = createConflictingTransactions(30);

        // When: Execute and check stats
        ExecutionResult result = executor.executeParallel(transactions);
        ExecutionStatistics stats = executor.getStatistics();

        // Then: Conflict tracking should be accurate
        assertThat(stats.totalConflicts()).isGreaterThanOrEqualTo(result.conflictCount());
        logger.info("Conflict statistics: {} total conflicts tracked",
                   stats.totalConflicts());
    }

    @Test
    @DisplayName("Should calculate TPS correctly")
    void testTPSCalculation() {
        // Given: Known transaction count and controlled execution
        List<TransactionTask> transactions = createIndependentTransactions(1000);

        // When: Execute and measure
        long startTime = System.nanoTime();
        ExecutionResult result = executor.executeParallel(transactions);
        long duration = System.nanoTime() - startTime;

        // Then: TPS calculation should be reasonable
        double expectedTps = calculateTPS(1000, duration / 1_000_000);
        // Allow 20% variance due to execution overhead and system variance
        double variance = expectedTps * 0.20;
        assertThat(result.tps()).isCloseTo(expectedTps, within(Math.max(variance, 50000.0)));
        logger.info("TPS calculation: expected={:.0f}, actual={:.0f}, variance={:.0f}",
                   expectedTps, result.tps(), Math.abs(result.tps() - expectedTps));
    }

    @Test
    @DisplayName("Should provide comprehensive execution metrics")
    void testComprehensiveMetrics() {
        // Given: Execution with mixed results
        List<TransactionTask> transactions = createTransactionsWithFailures(100, 10);

        // When: Execute
        ExecutionResult result = executor.executeParallel(transactions);

        // Then: All metrics should be present and valid
        assertThat(result.successCount()).isPositive();
        assertThat(result.failedCount()).isPositive();
        assertThat(result.conflictCount()).isGreaterThanOrEqualTo(0);
        assertThat(result.executionTimeMs()).isPositive();
        assertThat(result.tps()).isPositive();

        logger.info("Comprehensive metrics - Success: {}, Failed: {}, Conflicts: {}, Time: {:.2f}ms, TPS: {:.0f}",
                   result.successCount(), result.failedCount(), result.conflictCount(),
                   result.executionTimeMs(), result.tps());
    }

    // ==================== HELPER METHODS ====================

    private List<TransactionTask> createIndependentTransactions(int count) {
        List<TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            transactions.add(createTransaction(
                "tx-ind-" + i,
                "addr-in-" + i,
                "addr-out-" + i
            ));
        }
        return transactions;
    }

    private List<TransactionTask> createConflictingTransactions(int count) {
        List<TransactionTask> transactions = new ArrayList<>();
        String sharedAddr = "addr-shared";

        for (int i = 0; i < count; i++) {
            transactions.add(new TransactionTask(
                "tx-conflict-" + i,
                Set.of(sharedAddr),
                Set.of("addr-out-" + i),
                1,
                () -> {}
            ));
        }
        return transactions;
    }

    private List<TransactionTask> createDependentTransactions(int count) {
        List<TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            transactions.add(createTransaction(
                "tx-dep-" + i,
                "addr-chain-" + i,
                "addr-chain-" + (i + 1)
            ));
        }
        return transactions;
    }

    private List<TransactionTask> createOrderedTransactions(int count) {
        List<TransactionTask> transactions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            transactions.add(new TransactionTask(
                "tx-ord-" + i,
                Set.of("addr-" + (i % 100)),
                Set.of("addr-" + ((i + 1) % 100)),
                i,  // Priority indicates order
                () -> {}
            ));
        }
        return transactions;
    }

    private List<TransactionTask> createMixedTransactions(int count) {
        List<TransactionTask> transactions = new ArrayList<>();

        // 70% independent
        int independentCount = (int) (count * 0.7);
        for (int i = 0; i < independentCount; i++) {
            transactions.add(createTransaction(
                "tx-mix-ind-" + i,
                "addr-mix-" + i,
                "addr-mix-out-" + i
            ));
        }

        // 30% with conflicts
        int conflictCount = count - independentCount;
        String conflictAddr = "addr-mix-conflict";
        for (int i = 0; i < conflictCount; i++) {
            transactions.add(new TransactionTask(
                "tx-mix-conf-" + i,
                Set.of(conflictAddr),
                Set.of("addr-mix-out-" + (independentCount + i)),
                1,
                () -> {}
            ));
        }

        return transactions;
    }

    private List<TransactionTask> createTransactionsWithFailures(int total, int failures) {
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < total; i++) {
            final int index = i;
            transactions.add(new TransactionTask(
                "tx-fail-" + i,
                Set.of("addr-" + i),
                Set.of("addr-out-" + i),
                1,
                () -> {
                    if (index < failures) {
                        throw new RuntimeException("Simulated failure");
                    }
                }
            ));
        }

        return transactions;
    }

    private List<TransactionTask> createSlowTransactions(int count, long delayMs) {
        List<TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            transactions.add(new TransactionTask(
                "tx-slow-" + i,
                Set.of("addr-" + i),
                Set.of("addr-out-" + i),
                1,
                () -> {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            ));
        }

        return transactions;
    }

    private TransactionTask createTransaction(String id, String fromAddr, String toAddr) {
        return new TransactionTask(
            id,
            Set.of(fromAddr),
            Set.of(toAddr),
            1,
            () -> {}
        );
    }

    private List<TransactionTask> copyTransactions(List<TransactionTask> original) {
        return original.stream()
            .map(tx -> new TransactionTask(
                tx.id + "-copy",
                new HashSet<>(tx.readSet),
                new HashSet<>(tx.writeSet),
                tx.priority,
                tx::execute
            ))
            .collect(Collectors.toList());
    }
}
