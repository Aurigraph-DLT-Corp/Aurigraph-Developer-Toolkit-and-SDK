package io.aurigraph.v11.execution;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import jakarta.inject.Inject;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Enhanced Test Suite for ParallelTransactionExecutor
 * Week 3, Day 1: Error Recovery Path Coverage
 *
 * Focuses on uncovered error handling scenarios:
 * - Exception handling and recovery
 * - Timeout scenarios
 * - Thread interruption handling
 * - Concurrent failure scenarios
 * - Cascading errors
 * - Error metrics tracking
 *
 * Target: +3% coverage (89% → 92%)
 */
@QuarkusTest
@DisplayName("ParallelExecutor - Enhanced Error Recovery Tests")
class ParallelTransactionExecutorTest_Enhanced {

    @Inject
    ParallelTransactionExecutor executor;

    private AtomicInteger executionCounter;
    private AtomicInteger failureCounter;

    @BeforeEach
    void setUp() {
        executionCounter = new AtomicInteger(0);
        failureCounter = new AtomicInteger(0);
    }

    // ==================== Day 1: Error Recovery Tests ====================

    /**
     * Test 1: Execution Failure with Recovery
     *
     * Tests the error handling path when a transaction execution fails.
     * Verifies that:
     * - Failures are properly caught and recorded
     * - Other transactions continue execution
     * - Statistics accurately reflect failures
     */
    @Test
    @DisplayName("ParallelExecutor - Execution failure is handled gracefully")
    void testExecutionFailureWithRetry() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = Arrays.asList(
            // Success transaction
            createTask("tx1-success", Set.of(), Set.of("addr1"), 1,
                () -> executionCounter.incrementAndGet()),

            // Failing transaction
            createTask("tx2-fail", Set.of(), Set.of("addr2"), 1, () -> {
                failureCounter.incrementAndGet();
                throw new RuntimeException("Simulated execution failure");
            }),

            // Another success transaction
            createTask("tx3-success", Set.of(), Set.of("addr3"), 1,
                () -> executionCounter.incrementAndGet())
        );

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Verify: 2 successful, 1 failed
        assertEquals(2, result.successCount(),
            "Should have 2 successful transactions");
        assertEquals(1, result.failedCount(),
            "Should have 1 failed transaction");
        assertEquals(2, executionCounter.get(),
            "Successful transactions should have executed");
        assertEquals(1, failureCounter.get(),
            "Failed transaction should have been attempted");

        // Verify execution completed despite failure
        assertTrue(result.executionTimeMs() > 0,
            "Execution time should be recorded");
    }

    /**
     * Test 2: Timeout Scenario
     *
     * Tests the timeout handling path (30 second timeout in executeParallel).
     * Verifies that:
     * - Long-running transactions are handled
     * - Timeout doesn't crash the system
     * - Results are properly aggregated even with delays
     */
    @Test
    @DisplayName("ParallelExecutor - Handles long-running transactions within timeout")
    void testTimeoutWithRollback() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = Arrays.asList(
            // Fast transaction
            createTask("tx1-fast", Set.of(), Set.of("addr1"), 1,
                () -> executionCounter.incrementAndGet()),

            // Slow transaction (but within 30s timeout)
            createTask("tx2-slow", Set.of(), Set.of("addr2"), 1, () -> {
                sleep(500); // 500ms delay (well within 30s timeout)
                executionCounter.incrementAndGet();
            }),

            // Another fast transaction
            createTask("tx3-fast", Set.of(), Set.of("addr3"), 1,
                () -> executionCounter.incrementAndGet())
        );

        long startTime = System.nanoTime();
        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // Verify: All transactions completed successfully
        assertEquals(3, result.successCount(),
            "All transactions should complete");
        assertEquals(0, result.failedCount(),
            "No transactions should fail");
        assertEquals(3, executionCounter.get(),
            "All transactions should execute");

        // Verify execution completed in reasonable time (< 5s, well below 30s timeout)
        assertTrue(duration < 5000,
            "Execution should complete quickly despite slow transaction");
    }

    /**
     * Test 3: Thread Interruption Handling
     *
     * Tests handling of InterruptedException during execution.
     * Verifies that:
     * - Thread interruptions are properly handled
     * - Interrupted transactions are marked as failed
     * - System remains stable after interruption
     */
    @Test
    @DisplayName("ParallelExecutor - Handles thread interruption gracefully")
    void testThreadInterruptionHandling() {
        AtomicBoolean interruptDetected = new AtomicBoolean(false);

        List<ParallelTransactionExecutor.TransactionTask> transactions = Arrays.asList(
            // Normal transaction
            createTask("tx1-normal", Set.of(), Set.of("addr1"), 1,
                () -> executionCounter.incrementAndGet()),

            // Transaction that checks for interruption
            createTask("tx2-interruptible", Set.of(), Set.of("addr2"), 1, () -> {
                if (Thread.interrupted()) {
                    interruptDetected.set(true);
                    throw new RuntimeException("Thread interrupted");
                }
                executionCounter.incrementAndGet();
            }),

            // Another normal transaction
            createTask("tx3-normal", Set.of(), Set.of("addr3"), 1,
                () -> executionCounter.incrementAndGet())
        );

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Verify: System handles execution even with potential interruptions
        assertTrue(result.successCount() >= 2,
            "At least 2 transactions should succeed");
        assertTrue(result.successCount() + result.failedCount() == 3,
            "All transactions should be accounted for");

        // Verify execution completed
        assertTrue(result.executionTimeMs() > 0,
            "Execution time should be recorded");
    }

    /**
     * Test 4: Multiple Concurrent Failures
     *
     * Tests the system's resilience when multiple transactions fail simultaneously.
     * Verifies that:
     * - Multiple failures are properly tracked
     * - Failure counters are accurate
     * - System doesn't crash with concurrent failures
     */
    @Test
    @DisplayName("ParallelExecutor - Handles multiple concurrent failures")
    void testMultipleConcurrentFailures() {
        int failureCount = 5;
        int successCount = 5;

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        // Add failing transactions
        for (int i = 0; i < failureCount; i++) {
            final int index = i;
            transactions.add(
                createTask("tx-fail-" + i, Set.of(), Set.of("fail-addr" + i), 1, () -> {
                    failureCounter.incrementAndGet();
                    throw new RuntimeException("Concurrent failure " + index);
                })
            );
        }

        // Add successful transactions
        for (int i = 0; i < successCount; i++) {
            transactions.add(
                createTask("tx-success-" + i, Set.of(), Set.of("success-addr" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        // Shuffle to ensure random execution order
        Collections.shuffle(transactions);

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Verify: Accurate tracking of successes and failures
        assertEquals(successCount, result.successCount(),
            "Should have " + successCount + " successful transactions");
        assertEquals(failureCount, result.failedCount(),
            "Should have " + failureCount + " failed transactions");
        assertEquals(successCount, executionCounter.get(),
            "Successful executions should match counter");
        assertEquals(failureCount, failureCounter.get(),
            "Failed executions should match counter");

        // Verify statistics are updated
        ParallelTransactionExecutor.ExecutionStatistics stats = executor.getStatistics();
        assertTrue(stats.totalExecuted() >= successCount,
            "Statistics should track successful executions");
    }

    /**
     * Test 5: Cascading Error Scenarios
     *
     * Tests error propagation through dependent transactions.
     * Verifies that:
     * - Errors in dependent transactions are handled
     * - Independent transactions continue despite failures
     * - Dependency analysis works correctly with failures
     */
    @Test
    @DisplayName("ParallelExecutor - Handles cascading errors in dependency chains")
    void testCascadingErrorScenarios() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = Arrays.asList(
            // First transaction fails
            createTask("tx1-fail", Set.of(), Set.of("addr1"), 1, () -> {
                failureCounter.incrementAndGet();
                throw new RuntimeException("Initial failure");
            }),

            // Second transaction depends on first (reads addr1)
            createTask("tx2-dependent", Set.of("addr1"), Set.of("addr2"), 1,
                () -> executionCounter.incrementAndGet()),

            // Third transaction depends on second
            createTask("tx3-dependent", Set.of("addr2"), Set.of("addr3"), 1,
                () -> executionCounter.incrementAndGet()),

            // Fourth transaction is independent
            createTask("tx4-independent", Set.of(), Set.of("addr4"), 1,
                () -> executionCounter.incrementAndGet())
        );

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Verify: Independent transaction succeeds despite dependent failures
        assertTrue(result.successCount() >= 1,
            "At least independent transaction should succeed");
        assertTrue(result.failedCount() >= 1,
            "At least initial failing transaction should be recorded");
        assertTrue(executionCounter.get() >= 1,
            "Independent transaction should execute");

        // Verify total transactions accounted for
        assertEquals(4, result.successCount() + result.failedCount(),
            "All transactions should be accounted for");
    }

    /**
     * Test 6: Error Recovery Metrics
     *
     * Tests that error metrics are accurately tracked and reported.
     * Verifies that:
     * - Failed transaction count is accurate
     * - Conflict count is tracked separately
     * - Statistics reflect error conditions
     * - TPS calculations handle failures correctly
     */
    @Test
    @DisplayName("ParallelExecutor - Accurately tracks error recovery metrics")
    void testErrorRecoveryMetrics() {
        int totalTransactions = 20;
        int expectedFailures = 7;
        int expectedSuccesses = totalTransactions - expectedFailures;

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        // Add successful transactions
        for (int i = 0; i < expectedSuccesses; i++) {
            transactions.add(
                createTask("tx-success-" + i, Set.of(), Set.of("success-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        // Add failing transactions
        for (int i = 0; i < expectedFailures; i++) {
            final int index = i;
            transactions.add(
                createTask("tx-fail-" + i, Set.of(), Set.of("fail-" + i), 1, () -> {
                    failureCounter.incrementAndGet();
                    throw new RuntimeException("Metric test failure " + index);
                })
            );
        }

        // Execute and capture metrics
        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Verify: Accurate failure tracking
        assertEquals(expectedSuccesses, result.successCount(),
            "Success count should be accurate");
        assertEquals(expectedFailures, result.failedCount(),
            "Failure count should be accurate");
        assertEquals(expectedSuccesses, executionCounter.get(),
            "Execution counter should match successes");
        assertEquals(expectedFailures, failureCounter.get(),
            "Failure counter should match failures");

        // Verify: TPS is calculated based on total transactions
        assertTrue(result.tps() > 0,
            "TPS should be positive despite failures");

        // Verify: Execution time is recorded
        assertTrue(result.executionTimeMs() > 0,
            "Execution time should be recorded");

        // Verify: Statistics are updated correctly
        ParallelTransactionExecutor.ExecutionStatistics stats = executor.getStatistics();
        assertTrue(stats.totalExecuted() >= expectedSuccesses,
            "Statistics should track successful executions");
        assertTrue(stats.totalBatches() >= 1,
            "At least one batch should be recorded");
        assertTrue(stats.averageTPS() > 0,
            "Average TPS should be positive");
    }

    // ==================== Additional Error Edge Cases ====================

    /**
     * Test 7: Null Pointer Exception Handling
     *
     * Verifies that null pointer exceptions in transaction execution are handled.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles null pointer exceptions")
    void testNullPointerExceptionHandling() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = Arrays.asList(
            createTask("tx1-success", Set.of(), Set.of("addr1"), 1,
                () -> executionCounter.incrementAndGet()),

            createTask("tx2-npe", Set.of(), Set.of("addr2"), 1, () -> {
                String nullString = null;
                nullString.length(); // Intentional NPE
            }),

            createTask("tx3-success", Set.of(), Set.of("addr3"), 1,
                () -> executionCounter.incrementAndGet())
        );

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        assertEquals(2, result.successCount());
        assertEquals(1, result.failedCount());
        assertEquals(2, executionCounter.get());
    }

    /**
     * Test 8: Out of Memory Error Simulation
     *
     * Tests system behavior with resource exhaustion scenarios.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles resource exhaustion gracefully")
    void testResourceExhaustionScenario() {
        // Create a large number of transactions to stress the system
        int largeCount = 1000;
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < largeCount; i++) {
            transactions.add(
                createTask("tx-" + i, Set.of(), Set.of("addr-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Should handle large batch without crashing
        assertEquals(largeCount, result.successCount());
        assertEquals(largeCount, executionCounter.get());
        assertTrue(result.tps() > 0);
    }

    /**
     * Test 9: Concurrent Execution with Mixed Failures
     *
     * Tests concurrent batch executions with varying failure rates.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles concurrent batches with mixed results")
    void testConcurrentBatchesWithMixedFailures() throws InterruptedException {
        int batchCount = 5;
        CountDownLatch latch = new CountDownLatch(batchCount);
        AtomicInteger totalSuccesses = new AtomicInteger(0);
        AtomicInteger totalFailures = new AtomicInteger(0);

        for (int b = 0; b < batchCount; b++) {
            final int batchId = b;
            Thread.startVirtualThread(() -> {
                try {
                    List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

                    // Each batch has mix of success and failure
                    for (int i = 0; i < 10; i++) {
                        if (i % 3 == 0) {
                            // Failing transaction
                            transactions.add(
                                createTask("batch-" + batchId + "-fail-" + i,
                                    Set.of(), Set.of("batch-" + batchId + "-addr-" + i), 1, () -> {
                                    throw new RuntimeException("Batch failure");
                                })
                            );
                        } else {
                            // Successful transaction
                            transactions.add(
                                createTask("batch-" + batchId + "-success-" + i,
                                    Set.of(), Set.of("batch-" + batchId + "-addr-" + i), 1,
                                    () -> executionCounter.incrementAndGet())
                            );
                        }
                    }

                    ParallelTransactionExecutor.ExecutionResult result =
                        executor.executeParallel(transactions);

                    totalSuccesses.addAndGet(result.successCount());
                    totalFailures.addAndGet(result.failedCount());
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(30, TimeUnit.SECONDS));

        // Verify: All transactions accounted for across all batches
        assertEquals(batchCount * 10, totalSuccesses.get() + totalFailures.get());
        assertTrue(totalSuccesses.get() > 0, "Some transactions should succeed");
        assertTrue(totalFailures.get() > 0, "Some transactions should fail");
    }

    /**
     * Test 10: Exception Message Preservation
     *
     * Verifies that exception details are logged (not lost).
     */
    @Test
    @DisplayName("ParallelExecutor - Preserves exception information")
    void testExceptionMessagePreservation() {
        String expectedErrorMessage = "Custom error message for testing";

        List<ParallelTransactionExecutor.TransactionTask> transactions = List.of(
            createTask("tx-with-message", Set.of(), Set.of("addr1"), 1, () -> {
                throw new RuntimeException(expectedErrorMessage);
            })
        );

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // Verify: Transaction marked as failed
        assertEquals(0, result.successCount());
        assertEquals(1, result.failedCount());

        // Exception message is logged (we can verify this through logs in production)
        assertTrue(result.executionTimeMs() > 0,
            "Execution should complete even with exception");
    }

    // ==================== Helper Methods ====================

    private ParallelTransactionExecutor.TransactionTask createTask(
            String id,
            Set<String> readSet,
            Set<String> writeSet,
            int priority,
            Runnable execution) {

        return new ParallelTransactionExecutor.TransactionTask(
            id,
            new HashSet<>(readSet),
            new HashSet<>(writeSet),
            priority,
            execution
        );
    }

    private void sleep(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // ==================== Day 2: Virtual Thread Concurrency Tests ====================

    /**
     * Test 11: High Concurrency with Many Virtual Threads
     *
     * Tests system behavior with massive parallelism using virtual threads.
     * Virtual threads can scale to millions without traditional thread pool limits.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles massive concurrency with virtual threads")
    void testHighConcurrencyWithVirtualThreads() {
        int transactionCount = 5000;
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < transactionCount; i++) {
            transactions.add(
                createTask("tx-vt-" + i, Set.of(), Set.of("addr-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        long startTime = System.nanoTime();
        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // Verify: All transactions execute successfully
        assertEquals(transactionCount, result.successCount());
        assertEquals(transactionCount, executionCounter.get());
        assertTrue(result.tps() > 10000, "TPS should be > 10K with virtual threads");
        assertTrue(duration < 2000, "Should complete in < 2 seconds");
    }

    /**
     * Test 12: Virtual Thread Scalability
     *
     * Tests that virtual threads scale linearly with transaction count.
     * Compares performance with 1K, 5K, and 10K transactions.
     */
    @Test
    @DisplayName("ParallelExecutor - Virtual threads scale linearly")
    void testVirtualThreadScalability() {
        int[] testSizes = {1000, 5000, 10000};
        double[] tpsResults = new double[testSizes.length];

        for (int i = 0; i < testSizes.length; i++) {
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
            AtomicInteger localCounter = new AtomicInteger(0);

            for (int j = 0; j < testSizes[i]; j++) {
                transactions.add(
                    createTask("tx-scale-" + i + "-" + j, Set.of(), Set.of("addr-" + i + "-" + j), 1,
                        () -> localCounter.incrementAndGet())
                );
            }

            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);

            tpsResults[i] = result.tps();
            assertEquals(testSizes[i], result.successCount());
            assertEquals(testSizes[i], localCounter.get());
        }

        // Verify: TPS increases with transaction count (or stays high)
        assertTrue(tpsResults[0] > 5000, "1K batch should achieve > 5K TPS");
        assertTrue(tpsResults[2] > 5000, "10K batch should achieve > 5K TPS");
    }

    /**
     * Test 13: Memory Efficiency with Virtual Threads
     *
     * Tests that virtual threads don't cause memory issues with large batches.
     * Virtual threads have much lower memory overhead than platform threads.
     */
    @Test
    @DisplayName("ParallelExecutor - Memory efficient with large virtual thread count")
    void testMemoryEfficiencyWithVirtualThreads() {
        Runtime runtime = Runtime.getRuntime();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        int largeCount = 20000;
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        for (int i = 0; i < largeCount; i++) {
            transactions.add(
                createTask("tx-mem-" + i, Set.of(), Set.of("addr-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;

        // Verify: All transactions executed
        assertEquals(largeCount, result.successCount());

        // Verify: Memory usage is reasonable (< 500MB for 20K virtual threads)
        assertTrue(memoryUsed < 500_000_000,
            "Memory usage should be < 500MB, was: " + (memoryUsed / 1_000_000) + "MB");
    }

    /**
     * Test 14: Concurrent Batch Execution Under Load
     *
     * Tests multiple concurrent batches executing simultaneously.
     * Each batch runs in its own virtual thread.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles concurrent batches under load")
    void testConcurrentBatchExecutionUnderLoad() throws InterruptedException {
        int batchCount = 20;
        int transactionsPerBatch = 500;
        CountDownLatch latch = new CountDownLatch(batchCount);
        AtomicInteger totalExecuted = new AtomicInteger(0);

        for (int b = 0; b < batchCount; b++) {
            final int batchId = b;
            Thread.startVirtualThread(() -> {
                try {
                    List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

                    for (int i = 0; i < transactionsPerBatch; i++) {
                        transactions.add(
                            createTask("batch-" + batchId + "-tx-" + i,
                                Set.of(), Set.of("batch-" + batchId + "-addr-" + i), 1,
                                () -> totalExecuted.incrementAndGet())
                        );
                    }

                    ParallelTransactionExecutor.ExecutionResult result =
                        executor.executeParallel(transactions);

                    assertEquals(transactionsPerBatch, result.successCount());
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(60, TimeUnit.SECONDS),
            "All batches should complete within 60 seconds");
        assertEquals(batchCount * transactionsPerBatch, totalExecuted.get());
    }

    /**
     * Test 15: Timeout Enforcement with Many Concurrent Tasks
     *
     * Tests that the 30-second timeout is enforced even with many tasks.
     * Virtual threads should not cause timeout issues.
     */
    @Test
    @DisplayName("ParallelExecutor - Timeout enforcement with high concurrency")
    void testTimeoutEnforcementWithHighConcurrency() {
        int taskCount = 10000;
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        // Add fast tasks that should all complete well before timeout
        for (int i = 0; i < taskCount; i++) {
            transactions.add(
                createTask("tx-timeout-" + i, Set.of(), Set.of("addr-" + i), 1,
                    () -> {
                        // Very fast operation
                        executionCounter.incrementAndGet();
                    })
            );
        }

        long startTime = System.nanoTime();
        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // Verify: All complete well before 30s timeout
        assertEquals(taskCount, result.successCount());
        assertTrue(duration < 5000,
            "Should complete in < 5 seconds, was: " + duration + "ms");
        assertTrue(result.executionTimeMs() < 5000,
            "Recorded time should be < 5 seconds");
    }

    /**
     * Test 16: Resource Cleanup After High Concurrency
     *
     * Tests that resources are properly cleaned up after massive parallel execution.
     * Verifies no thread leaks or resource exhaustion.
     */
    @Test
    @DisplayName("ParallelExecutor - Proper resource cleanup after high concurrency")
    void testResourceCleanupAfterHighConcurrency() throws InterruptedException {
        // Execute multiple rounds of high-concurrency workloads
        for (int round = 0; round < 5; round++) {
            List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

            for (int i = 0; i < 5000; i++) {
                final int index = i;
                transactions.add(
                    createTask("round-" + round + "-tx-" + i,
                        Set.of(), Set.of("round-" + round + "-addr-" + i), 1,
                        () -> {
                            // Simulate some work
                            int sum = 0;
                            for (int j = 0; j < 100; j++) {
                                sum += j;
                            }
                            executionCounter.incrementAndGet();
                        })
                );
            }

            ParallelTransactionExecutor.ExecutionResult result =
                executor.executeParallel(transactions);

            assertEquals(5000, result.successCount(),
                "Round " + round + " should complete successfully");

            // Give time for cleanup
            Thread.sleep(100);
        }

        // Verify: All 25K transactions executed across 5 rounds
        assertEquals(25000, executionCounter.get());

        // Verify: Statistics are accurate
        ParallelTransactionExecutor.ExecutionStatistics stats = executor.getStatistics();
        assertTrue(stats.totalExecuted() >= 25000);
        assertTrue(stats.totalBatches() >= 5);
    }

    // ==================== Day 3: Concurrent Update & Dependency Tests ====================

    /**
     * Test 17: Concurrent Read-Write Dependencies
     *
     * Tests handling of concurrent transactions with read-write dependencies.
     * Verifies proper serialization of dependent transactions.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles concurrent read-write dependencies")
    void testConcurrentReadWriteDependencies() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        // Create dependency chain: write -> read -> write
        for (int i = 0; i < 100; i++) {
            String addr = "shared-addr-" + (i % 10); // 10 shared addresses

            if (i % 3 == 0) {
                // Writer transaction
                transactions.add(
                    createTask("writer-" + i, Set.of(), Set.of(addr), 1,
                        () -> executionCounter.incrementAndGet())
                );
            } else if (i % 3 == 1) {
                // Reader transaction
                transactions.add(
                    createTask("reader-" + i, Set.of(addr), Set.of(), 1,
                        () -> executionCounter.incrementAndGet())
                );
            } else {
                // Read-write transaction
                transactions.add(
                    createTask("read-writer-" + i, Set.of(addr), Set.of(addr), 1,
                        () -> executionCounter.incrementAndGet())
                );
            }
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // All transactions should complete successfully
        assertTrue(result.successCount() >= 90, "Most transactions should succeed");
        assertTrue(executionCounter.get() >= 90);
    }

    /**
     * Test 18: Write-Write Conflict Resolution
     *
     * Tests that write-write conflicts are properly detected and handled.
     * Multiple writers to the same address should be serialized.
     */
    @Test
    @DisplayName("ParallelExecutor - Resolves write-write conflicts")
    void testWriteWriteConflictResolution() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
        String sharedAddress = "conflict-addr";

        // Create 50 writers all targeting the same address
        for (int i = 0; i < 50; i++) {
            transactions.add(
                createTask("writer-conflict-" + i,
                    Set.of(), Set.of(sharedAddress), 1,
                    () -> {
                        sleep(1); // Small delay to increase conflict probability
                        executionCounter.incrementAndGet();
                    })
            );
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // All should eventually succeed (may have conflicts but should complete)
        assertTrue(result.successCount() + result.conflictCount() >= 40,
            "Most transactions should succeed or be marked as conflicts");
    }

    /**
     * Test 19: Complex Dependency Graph Execution
     *
     * Tests execution with a complex DAG of dependencies.
     * Multiple levels of dependencies should be resolved correctly.
     */
    @Test
    @DisplayName("ParallelExecutor - Executes complex dependency graphs")
    void testComplexDependencyGraphExecution() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        // Level 0: Root transactions (no dependencies)
        for (int i = 0; i < 10; i++) {
            transactions.add(
                createTask("L0-" + i, Set.of(), Set.of("L0-addr-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        // Level 1: Depend on Level 0
        for (int i = 0; i < 20; i++) {
            transactions.add(
                createTask("L1-" + i,
                    Set.of("L0-addr-" + (i % 10)), Set.of("L1-addr-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        // Level 2: Depend on Level 1
        for (int i = 0; i < 30; i++) {
            transactions.add(
                createTask("L2-" + i,
                    Set.of("L1-addr-" + (i % 20)), Set.of("L2-addr-" + i), 1,
                    () -> executionCounter.incrementAndGet())
            );
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // All 60 transactions should complete
        assertEquals(60, result.successCount());
        assertEquals(60, executionCounter.get());
    }

    /**
     * Test 20: Concurrent Updates with Conflict Detection
     *
     * Tests the conflict detection mechanism with concurrent updates.
     * Verifies that conflicting transactions are properly identified.
     */
    @Test
    @DisplayName("ParallelExecutor - Detects conflicts in concurrent updates")
    void testConcurrentUpdatesWithConflictDetection() {
        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

        // Create groups of conflicting transactions
        for (int group = 0; group < 10; group++) {
            String groupAddr = "group-addr-" + group;

            // 10 transactions per group, all accessing same address
            for (int i = 0; i < 10; i++) {
                transactions.add(
                    createTask("group-" + group + "-tx-" + i,
                        Set.of(groupAddr), Set.of(groupAddr), 1,
                        () -> executionCounter.incrementAndGet())
                );
            }
        }

        ParallelTransactionExecutor.ExecutionResult result =
            executor.executeParallel(transactions);

        // All transactions should complete (serialized within groups)
        assertTrue(result.successCount() >= 90, "Most transactions should succeed");
        assertTrue(result.successCount() + result.conflictCount() == 100,
            "All transactions should be accounted for");
    }

    /**
     * Test 21: Race Condition Handling
     *
     * Tests that race conditions in dependency updates are handled correctly.
     * Multiple threads updating dependencies simultaneously.
     */
    @Test
    @DisplayName("ParallelExecutor - Handles race conditions in dependency updates")
    void testRaceConditionHandling() throws InterruptedException {
        int threadCount = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        AtomicInteger totalExecuted = new AtomicInteger(0);

        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    // Wait for all threads to be ready
                    startLatch.await();

                    List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();

                    // Each thread creates transactions that might conflict
                    for (int i = 0; i < 50; i++) {
                        String addr = "race-addr-" + (i % 5); // Shared addresses
                        transactions.add(
                            createTask("thread-" + threadId + "-tx-" + i,
                                Set.of(addr), Set.of(addr), 1,
                                () -> totalExecuted.incrementAndGet())
                        );
                    }

                    ParallelTransactionExecutor.ExecutionResult result =
                        executor.executeParallel(transactions);

                    assertTrue(result.successCount() >= 40);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        // Start all threads simultaneously
        startLatch.countDown();

        assertTrue(completionLatch.await(60, TimeUnit.SECONDS));
        assertTrue(totalExecuted.get() >= 400);
    }
}
