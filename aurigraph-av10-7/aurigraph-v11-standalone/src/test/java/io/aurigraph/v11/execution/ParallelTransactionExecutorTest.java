package io.aurigraph.v11.execution;

import io.aurigraph.v11.execution.ParallelTransactionExecutor.TransactionTask;
import io.aurigraph.v11.execution.ParallelTransactionExecutor.ExecutionResult;
import io.aurigraph.v11.execution.ParallelTransactionExecutor.ExecutionStatistics;
import io.aurigraph.v11.execution.ParallelTransactionExecutor.GroupingAlgorithm;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for ParallelTransactionExecutor
 * Sprint 1 - Test Coverage Enhancement (AV11-344)
 * Target: 89% -> 95% coverage
 *
 * Tests cover:
 * - Parallel execution
 * - Dependency graph analysis
 * - Conflict detection and resolution
 * - Transaction scheduling
 * - Grouping algorithms (Legacy, Optimized Hash, Union-Find)
 * - Statistics and metrics
 */
@DisplayName("ParallelTransactionExecutor Tests")
class ParallelTransactionExecutorTest {

    private ParallelTransactionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new ParallelTransactionExecutor();
        // Reset to default algorithm
        ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
    }

    @AfterEach
    void tearDown() {
        executor.shutdown();
    }

    // ============================================
    // BASIC EXECUTION TESTS
    // ============================================

    @Nested
    @DisplayName("Basic Execution Tests")
    class BasicExecutionTests {

        @Test
        @DisplayName("Should execute empty transaction list")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldExecuteEmptyTransactionList() {
            ExecutionResult result = executor.executeParallel(new ArrayList<>());

            assertNotNull(result);
            assertEquals(0, result.successCount());
            assertEquals(0, result.failedCount());
        }

        @Test
        @DisplayName("Should execute single transaction")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldExecuteSingleTransaction() {
            AtomicInteger counter = new AtomicInteger(0);

            List<TransactionTask> tasks = List.of(
                createTask("tx-1", Set.of("addr-1"), Set.of("addr-2"), counter::incrementAndGet)
            );

            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(1, result.successCount());
            assertEquals(0, result.failedCount());
            assertEquals(1, counter.get());
        }

        @Test
        @DisplayName("Should execute multiple independent transactions")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldExecuteMultipleIndependentTransactions() {
            AtomicInteger counter = new AtomicInteger(0);

            List<TransactionTask> tasks = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                int index = i;
                tasks.add(createTask(
                    "tx-" + i,
                    Set.of("read-" + i),
                    Set.of("write-" + i),
                    () -> {
                        counter.incrementAndGet();
                    }
                ));
            }

            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(10, result.successCount());
            assertEquals(0, result.failedCount());
            assertEquals(10, counter.get());
        }

        @Test
        @DisplayName("Should measure execution time")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldMeasureExecutionTime() {
            List<TransactionTask> tasks = List.of(
                createTask("tx-1", Set.of(), Set.of("a"), () -> {
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                })
            );

            ExecutionResult result = executor.executeParallel(tasks);

            assertTrue(result.executionTimeMs() > 0);
        }

        @Test
        @DisplayName("Should calculate TPS")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldCalculateTps() {
            List<TransactionTask> tasks = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                int index = i;
                tasks.add(createTask("tx-" + i, Set.of("r" + i), Set.of("w" + i), () -> {}));
            }

            ExecutionResult result = executor.executeParallel(tasks);

            assertTrue(result.tps() > 0);
        }
    }

    // ============================================
    // CONFLICT DETECTION TESTS
    // ============================================

    @Nested
    @DisplayName("Conflict Detection Tests")
    class ConflictDetectionTests {

        @Test
        @DisplayName("Should detect write-write conflicts")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldDetectWriteWriteConflicts() {
            AtomicInteger counter = new AtomicInteger(0);

            // Both write to same address
            List<TransactionTask> tasks = List.of(
                createTask("tx-1", Set.of(), Set.of("shared-addr"), counter::incrementAndGet),
                createTask("tx-2", Set.of(), Set.of("shared-addr"), counter::incrementAndGet)
            );

            ExecutionResult result = executor.executeParallel(tasks);

            // Both should eventually execute (with dependency handling)
            assertEquals(2, result.successCount() + result.failedCount() + result.conflictCount());
        }

        @Test
        @DisplayName("Should detect read-write conflicts")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldDetectReadWriteConflicts() {
            AtomicInteger counter = new AtomicInteger(0);

            // tx-1 reads, tx-2 writes to same address
            List<TransactionTask> tasks = List.of(
                createTask("tx-1", Set.of("shared-addr"), Set.of(), counter::incrementAndGet),
                createTask("tx-2", Set.of(), Set.of("shared-addr"), counter::incrementAndGet)
            );

            ExecutionResult result = executor.executeParallel(tasks);

            // Both should be processed (conflicts handled by grouping)
            assertTrue(result.successCount() + result.failedCount() >= 1);
        }

        @Test
        @DisplayName("Should detect write-read conflicts")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldDetectWriteReadConflicts() {
            AtomicInteger counter = new AtomicInteger(0);

            // tx-1 writes, tx-2 reads from same address
            List<TransactionTask> tasks = List.of(
                createTask("tx-1", Set.of(), Set.of("shared-addr"), counter::incrementAndGet),
                createTask("tx-2", Set.of("shared-addr"), Set.of(), counter::incrementAndGet)
            );

            ExecutionResult result = executor.executeParallel(tasks);

            assertTrue(result.successCount() >= 1);
        }

        @Test
        @DisplayName("Should allow non-conflicting read-read access")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldAllowNonConflictingReadReadAccess() {
            AtomicInteger counter = new AtomicInteger(0);

            // Both read from same address - no conflict
            List<TransactionTask> tasks = List.of(
                createTask("tx-1", Set.of("shared-addr"), Set.of("write-1"), counter::incrementAndGet),
                createTask("tx-2", Set.of("shared-addr"), Set.of("write-2"), counter::incrementAndGet)
            );

            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(2, result.successCount());
        }
    }

    // ============================================
    // GROUPING ALGORITHM TESTS
    // ============================================

    @Nested
    @DisplayName("Grouping Algorithm Tests")
    class GroupingAlgorithmTests {

        @Test
        @DisplayName("Should set and get grouping algorithm")
        void shouldSetAndGetGroupingAlgorithm() {
            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.LEGACY);
            assertEquals(GroupingAlgorithm.LEGACY, ParallelTransactionExecutor.getGroupingAlgorithm());

            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.OPTIMIZED_HASH);
            assertEquals(GroupingAlgorithm.OPTIMIZED_HASH, ParallelTransactionExecutor.getGroupingAlgorithm());

            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
            assertEquals(GroupingAlgorithm.UNION_FIND, ParallelTransactionExecutor.getGroupingAlgorithm());
        }

        @Test
        @DisplayName("Should execute with LEGACY algorithm")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldExecuteWithLegacyAlgorithm() {
            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.LEGACY);

            List<TransactionTask> tasks = createTestTasks(10);
            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(10, result.successCount());
        }

        @Test
        @DisplayName("Should execute with OPTIMIZED_HASH algorithm")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldExecuteWithOptimizedHashAlgorithm() {
            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.OPTIMIZED_HASH);

            List<TransactionTask> tasks = createTestTasks(10);
            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(10, result.successCount());
        }

        @Test
        @DisplayName("Should execute with UNION_FIND algorithm")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldExecuteWithUnionFindAlgorithm() {
            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);

            List<TransactionTask> tasks = createTestTasks(10);
            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(10, result.successCount());
        }

        @Test
        @DisplayName("All algorithms should produce same result")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void allAlgorithmsShouldProduceSameResult() {
            List<TransactionTask> tasks = createTestTasks(50);

            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.LEGACY);
            ExecutionResult legacyResult = executor.executeParallel(tasks);

            tasks = createTestTasks(50);
            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.OPTIMIZED_HASH);
            ExecutionResult hashResult = executor.executeParallel(tasks);

            tasks = createTestTasks(50);
            ParallelTransactionExecutor.setGroupingAlgorithm(GroupingAlgorithm.UNION_FIND);
            ExecutionResult unionFindResult = executor.executeParallel(tasks);

            // All should succeed
            assertEquals(50, legacyResult.successCount());
            assertEquals(50, hashResult.successCount());
            assertEquals(50, unionFindResult.successCount());
        }
    }

    // ============================================
    // UNION-FIND TESTS
    // ============================================

    @Nested
    @DisplayName("Union-Find Tests")
    class UnionFindTests {

        private ParallelTransactionExecutor.UnionFind unionFind;

        @BeforeEach
        void setUp() {
            unionFind = new ParallelTransactionExecutor.UnionFind(10);
        }

        @Test
        @DisplayName("Should initialize with correct component count")
        void shouldInitializeWithCorrectComponentCount() {
            assertEquals(10, unionFind.getComponentCount());
        }

        @Test
        @DisplayName("Should find root of element")
        void shouldFindRootOfElement() {
            for (int i = 0; i < 10; i++) {
                assertEquals(i, unionFind.find(i));
            }
        }

        @Test
        @DisplayName("Should union two elements")
        void shouldUnionTwoElements() {
            assertTrue(unionFind.union(0, 1));
            assertTrue(unionFind.connected(0, 1));
            assertEquals(9, unionFind.getComponentCount());
        }

        @Test
        @DisplayName("Should return false when unioning same set")
        void shouldReturnFalseWhenUnioningSameSet() {
            unionFind.union(0, 1);
            assertFalse(unionFind.union(0, 1));
        }

        @Test
        @DisplayName("Should check if elements are connected")
        void shouldCheckIfElementsAreConnected() {
            assertFalse(unionFind.connected(0, 1));
            unionFind.union(0, 1);
            assertTrue(unionFind.connected(0, 1));
        }

        @Test
        @DisplayName("Should handle transitive connections")
        void shouldHandleTransitiveConnections() {
            unionFind.union(0, 1);
            unionFind.union(1, 2);
            assertTrue(unionFind.connected(0, 2));
            assertEquals(8, unionFind.getComponentCount());
        }

        @Test
        @DisplayName("Should handle multiple unions")
        void shouldHandleMultipleUnions() {
            for (int i = 0; i < 9; i++) {
                unionFind.union(i, i + 1);
            }
            assertEquals(1, unionFind.getComponentCount());

            // All elements should be connected
            for (int i = 0; i < 10; i++) {
                assertTrue(unionFind.connected(0, i));
            }
        }
    }

    // ============================================
    // CONFLICT RESOLVER TESTS
    // ============================================

    @Nested
    @DisplayName("Conflict Resolver Tests")
    class ConflictResolverTests {

        private ParallelTransactionExecutor.ConflictResolver conflictResolver;

        @BeforeEach
        void setUp() {
            conflictResolver = new ParallelTransactionExecutor.ConflictResolver();
        }

        @Test
        @DisplayName("Should detect conflict on active write")
        void shouldDetectConflictOnActiveWrite() {
            TransactionTask task1 = createTask("tx-1", Set.of(), Set.of("addr-1"), () -> {});
            TransactionTask task2 = createTask("tx-2", Set.of(), Set.of("addr-1"), () -> {});

            conflictResolver.acquireLocks(task1);
            assertTrue(conflictResolver.hasConflict(task2));
        }

        @Test
        @DisplayName("Should detect conflict on active read")
        void shouldDetectConflictOnActiveRead() {
            TransactionTask task1 = createTask("tx-1", Set.of("addr-1"), Set.of(), () -> {});
            TransactionTask task2 = createTask("tx-2", Set.of(), Set.of("addr-1"), () -> {});

            conflictResolver.acquireLocks(task1);
            assertTrue(conflictResolver.hasConflict(task2));
        }

        @Test
        @DisplayName("Should not detect conflict after release")
        void shouldNotDetectConflictAfterRelease() {
            TransactionTask task1 = createTask("tx-1", Set.of(), Set.of("addr-1"), () -> {});
            TransactionTask task2 = createTask("tx-2", Set.of(), Set.of("addr-1"), () -> {});

            conflictResolver.acquireLocks(task1);
            conflictResolver.releaseLocks(task1);

            assertFalse(conflictResolver.hasConflict(task2));
        }

        @Test
        @DisplayName("Should allow concurrent reads")
        void shouldAllowConcurrentReads() {
            TransactionTask task1 = createTask("tx-1", Set.of("addr-1"), Set.of("write-1"), () -> {});
            TransactionTask task2 = createTask("tx-2", Set.of("addr-1"), Set.of("write-2"), () -> {});

            conflictResolver.acquireLocks(task1);
            assertFalse(conflictResolver.hasConflict(task2));
        }
    }

    // ============================================
    // TRANSACTION SCHEDULER TESTS
    // ============================================

    @Nested
    @DisplayName("Transaction Scheduler Tests")
    class TransactionSchedulerTests {

        private ParallelTransactionExecutor.TransactionScheduler scheduler;

        @BeforeEach
        void setUp() {
            scheduler = new ParallelTransactionExecutor.TransactionScheduler();
        }

        @Test
        @DisplayName("Should optimize schedule by priority")
        void shouldOptimizeScheduleByPriority() {
            List<TransactionTask> tasks = List.of(
                createTaskWithPriority("tx-low", 1),
                createTaskWithPriority("tx-high", 10),
                createTaskWithPriority("tx-med", 5)
            );

            List<TransactionTask> optimized = scheduler.optimizeSchedule(tasks);

            assertEquals("tx-high", optimized.get(0).id);
            assertEquals("tx-med", optimized.get(1).id);
            assertEquals("tx-low", optimized.get(2).id);
        }

        @Test
        @DisplayName("Should handle empty list")
        void shouldHandleEmptyList() {
            List<TransactionTask> optimized = scheduler.optimizeSchedule(new ArrayList<>());
            assertTrue(optimized.isEmpty());
        }
    }

    // ============================================
    // STATISTICS TESTS
    // ============================================

    @Nested
    @DisplayName("Statistics Tests")
    class StatisticsTests {

        @Test
        @DisplayName("Should get initial statistics")
        void shouldGetInitialStatistics() {
            ExecutionStatistics stats = executor.getStatistics();

            assertNotNull(stats);
            assertEquals(0, stats.totalExecuted());
            assertEquals(0, stats.totalConflicts());
            assertEquals(0, stats.totalBatches());
        }

        @Test
        @DisplayName("Should update statistics after execution")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldUpdateStatisticsAfterExecution() {
            List<TransactionTask> tasks = createTestTasks(10);
            executor.executeParallel(tasks);

            ExecutionStatistics stats = executor.getStatistics();

            assertTrue(stats.totalExecuted() > 0);
            assertTrue(stats.totalBatches() > 0);
            assertTrue(stats.averageTPS() >= 0);
        }

        @Test
        @DisplayName("Should accumulate statistics over multiple executions")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldAccumulateStatisticsOverMultipleExecutions() {
            executor.executeParallel(createTestTasks(10));
            executor.executeParallel(createTestTasks(10));
            executor.executeParallel(createTestTasks(10));

            ExecutionStatistics stats = executor.getStatistics();

            assertTrue(stats.totalExecuted() >= 30);
            assertTrue(stats.totalBatches() >= 3);
        }
    }

    // ============================================
    // EXECUTION RESULT TESTS
    // ============================================

    @Nested
    @DisplayName("Execution Result Tests")
    class ExecutionResultTests {

        @Test
        @DisplayName("ExecutionResult should contain all fields")
        void executionResultShouldContainAllFields() {
            List<TransactionTask> tasks = createTestTasks(5);
            ExecutionResult result = executor.executeParallel(tasks);

            assertTrue(result.successCount() >= 0);
            assertTrue(result.failedCount() >= 0);
            assertTrue(result.conflictCount() >= 0);
            assertTrue(result.executionTimeMs() >= 0);
            assertTrue(result.tps() >= 0);
        }

        @Test
        @DisplayName("Should report failed transactions")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldReportFailedTransactions() {
            List<TransactionTask> tasks = List.of(
                createTask("tx-fail", Set.of(), Set.of("addr"), () -> {
                    throw new RuntimeException("Intentional failure");
                })
            );

            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(1, result.failedCount());
        }
    }

    // ============================================
    // TRANSACTION TASK TESTS
    // ============================================

    @Nested
    @DisplayName("Transaction Task Tests")
    class TransactionTaskTests {

        @Test
        @DisplayName("TransactionTask should contain all fields")
        void transactionTaskShouldContainAllFields() {
            Set<String> readSet = Set.of("read-addr");
            Set<String> writeSet = Set.of("write-addr");
            AtomicInteger counter = new AtomicInteger(0);

            TransactionTask task = new TransactionTask(
                "tx-test", readSet, writeSet, 5, counter::incrementAndGet
            );

            assertEquals("tx-test", task.id);
            assertEquals(readSet, task.readSet);
            assertEquals(writeSet, task.writeSet);
            assertEquals(5, task.priority);
        }

        @Test
        @DisplayName("TransactionTask should execute")
        void transactionTaskShouldExecute() {
            AtomicInteger counter = new AtomicInteger(0);

            TransactionTask task = new TransactionTask(
                "tx-exec", Set.of(), Set.of(), 1, counter::incrementAndGet
            );

            task.execute();

            assertEquals(1, counter.get());
        }
    }

    // ============================================
    // LARGE BATCH TESTS
    // ============================================

    @Nested
    @DisplayName("Large Batch Tests")
    class LargeBatchTests {

        @Test
        @DisplayName("Should handle large batch of independent transactions")
        @Timeout(value = 30, unit = TimeUnit.SECONDS)
        void shouldHandleLargeBatchOfIndependentTransactions() {
            List<TransactionTask> tasks = createTestTasks(1000);

            ExecutionResult result = executor.executeParallel(tasks);

            assertEquals(1000, result.successCount());
            assertTrue(result.tps() > 0);
        }

        @Test
        @DisplayName("Should handle large batch with conflicts")
        @Timeout(value = 30, unit = TimeUnit.SECONDS)
        void shouldHandleLargeBatchWithConflicts() {
            List<TransactionTask> tasks = new ArrayList<>();

            // Half write to same addresses (conflicts)
            for (int i = 0; i < 500; i++) {
                tasks.add(createTask(
                    "tx-conflict-" + i,
                    Set.of("shared-read"),
                    Set.of("shared-write-" + (i % 10)),
                    () -> {}
                ));
            }

            // Half independent
            for (int i = 0; i < 500; i++) {
                tasks.add(createTask(
                    "tx-indep-" + i,
                    Set.of("read-" + i),
                    Set.of("write-" + i),
                    () -> {}
                ));
            }

            ExecutionResult result = executor.executeParallel(tasks);

            // Most should succeed, some might have conflicts
            assertTrue(result.successCount() + result.failedCount() + result.conflictCount() == 1000);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private TransactionTask createTask(String id, Set<String> readSet, Set<String> writeSet, Runnable execution) {
        return new TransactionTask(id, readSet, writeSet, 1, execution);
    }

    private TransactionTask createTaskWithPriority(String id, int priority) {
        return new TransactionTask(id, Set.of(), Set.of(id), priority, () -> {});
    }

    private List<TransactionTask> createTestTasks(int count) {
        List<TransactionTask> tasks = new ArrayList<>();
        AtomicInteger counter = new AtomicInteger(0);

        for (int i = 0; i < count; i++) {
            int index = i;
            tasks.add(new TransactionTask(
                "tx-" + i,
                Set.of("read-" + i),
                Set.of("write-" + i),
                1,
                counter::incrementAndGet
            ));
        }

        return tasks;
    }
}
