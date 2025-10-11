package io.aurigraph.v11.execution;

import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * JMH Benchmark for ParallelTransactionExecutor
 * Tests the performance improvement from hash-based conflict detection
 *
 * Run with: ./mvnw test -Dtest=ParallelExecutorBenchmark
 */
@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Warmup(iterations = 3, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 5, time = 2, timeUnit = TimeUnit.SECONDS)
@Fork(1)
public class ParallelExecutorBenchmark {

    private ParallelTransactionExecutor executor;
    private List<ParallelTransactionExecutor.TransactionTask> smallBatch;
    private List<ParallelTransactionExecutor.TransactionTask> mediumBatch;
    private List<ParallelTransactionExecutor.TransactionTask> largeBatch;

    @Setup
    public void setup() {
        executor = new ParallelTransactionExecutor();

        // Create different batch sizes with varying conflict patterns
        smallBatch = createTransactions(1000, 0.1);   // 1K transactions, 10% conflict rate
        mediumBatch = createTransactions(10000, 0.1); // 10K transactions, 10% conflict rate
        largeBatch = createTransactions(50000, 0.1);  // 50K transactions, 10% conflict rate
    }

    /**
     * Benchmark small batch (1K transactions)
     */
    @Benchmark
    public void benchmarkSmallBatch() {
        executor.executeParallel(smallBatch);
    }

    /**
     * Benchmark medium batch (10K transactions)
     */
    @Benchmark
    public void benchmarkMediumBatch() {
        executor.executeParallel(mediumBatch);
    }

    /**
     * Benchmark large batch (50K transactions)
     */
    @Benchmark
    public void benchmarkLargeBatch() {
        executor.executeParallel(largeBatch);
    }

    /**
     * Create transactions with controlled conflict patterns
     */
    private List<ParallelTransactionExecutor.TransactionTask> createTransactions(
            int count, double conflictRate) {

        List<ParallelTransactionExecutor.TransactionTask> transactions = new ArrayList<>();
        Random random = new Random(42); // Fixed seed for reproducibility
        int addressSpace = (int) (count / conflictRate); // Control conflict rate

        for (int i = 0; i < count; i++) {
            Set<String> readSet = new HashSet<>();
            Set<String> writeSet = new HashSet<>();

            // Create read/write sets with controlled overlap
            for (int j = 0; j < 3; j++) { // 3 addresses per transaction
                int addressId = random.nextInt(addressSpace);

                if (random.nextBoolean()) {
                    readSet.add("addr-" + addressId);
                } else {
                    writeSet.add("addr-" + addressId);
                }
            }

            ParallelTransactionExecutor.TransactionTask task =
                new ParallelTransactionExecutor.TransactionTask(
                    "tx-" + i,
                    readSet,
                    writeSet,
                    1,
                    () -> {} // No-op execution
                );

            transactions.add(task);
        }

        return transactions;
    }

    /**
     * Main method to run benchmark
     */
    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
                .include(ParallelExecutorBenchmark.class.getSimpleName())
                .shouldFailOnError(true)
                .build();

        new Runner(opt).run();
    }
}
