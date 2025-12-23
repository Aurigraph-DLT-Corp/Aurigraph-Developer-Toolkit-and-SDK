package io.aurigraph.v11.consensus;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * Consensus metrics tracking for HyperRAFT++ optimization
 *
 * Tracks key consensus performance indicators:
 * - Leader election duration
 * - Block proposal time
 * - Block commit time
 * - Transaction validation throughput
 * - Consensus success/failure rates
 *
 * Thread-safe metrics using atomic operations
 */
@ApplicationScoped
public class ConsensusMetrics {

    // Election metrics
    private final LongAdder totalElections = new LongAdder();
    private final LongAdder successfulElections = new LongAdder();
    private final LongAdder failedElections = new LongAdder();
    private final AtomicLong totalElectionTimeMs = new AtomicLong(0);
    private final AtomicLong minElectionTimeMs = new AtomicLong(Long.MAX_VALUE);
    private final AtomicLong maxElectionTimeMs = new AtomicLong(0);

    // Block proposal metrics
    private final LongAdder totalProposals = new LongAdder();
    private final LongAdder successfulProposals = new LongAdder();
    private final AtomicLong totalProposalTimeMs = new AtomicLong(0);
    private final AtomicLong minProposalTimeMs = new AtomicLong(Long.MAX_VALUE);
    private final AtomicLong maxProposalTimeMs = new AtomicLong(0);

    // Block commit metrics
    private final LongAdder totalCommits = new LongAdder();
    private final LongAdder successfulCommits = new LongAdder();
    private final AtomicLong totalCommitTimeMs = new AtomicLong(0);
    private final AtomicLong minCommitTimeMs = new AtomicLong(Long.MAX_VALUE);
    private final AtomicLong maxCommitTimeMs = new AtomicLong(0);

    // Validation metrics
    private final LongAdder totalValidations = new LongAdder();
    private final LongAdder successfulValidations = new LongAdder();
    private final AtomicLong totalValidationTimeMs = new AtomicLong(0);

    // Throughput metrics
    private final LongAdder totalTransactionsProcessed = new LongAdder();
    private final AtomicLong lastThroughputCheck = new AtomicLong(0);  // Initialize to 0 for first update
    private final AtomicLong currentTPS = new AtomicLong(0);

    // Start time
    private final Instant startTime = Instant.now();

    /**
     * Record a leader election
     */
    public void recordElection(boolean successful, long durationMs) {
        totalElections.increment();

        if (successful) {
            successfulElections.increment();
        } else {
            failedElections.increment();
        }

        totalElectionTimeMs.addAndGet(durationMs);

        // Update min/max
        updateMin(minElectionTimeMs, durationMs);
        updateMax(maxElectionTimeMs, durationMs);
    }

    /**
     * Record a block proposal
     */
    public void recordProposal(boolean successful, long durationMs) {
        totalProposals.increment();

        if (successful) {
            successfulProposals.increment();
        }

        totalProposalTimeMs.addAndGet(durationMs);
        updateMin(minProposalTimeMs, durationMs);
        updateMax(maxProposalTimeMs, durationMs);
    }

    /**
     * Record a block commit
     */
    public void recordCommit(boolean successful, long durationMs) {
        totalCommits.increment();

        if (successful) {
            successfulCommits.increment();
        }

        totalCommitTimeMs.addAndGet(durationMs);
        updateMin(minCommitTimeMs, durationMs);
        updateMax(maxCommitTimeMs, durationMs);
    }

    /**
     * Record transaction validation
     */
    public void recordValidation(boolean successful, long durationMs, int txCount) {
        totalValidations.increment();

        if (successful) {
            successfulValidations.increment();
            totalTransactionsProcessed.add(txCount);
        }

        totalValidationTimeMs.addAndGet(durationMs);

        // Update TPS calculation
        updateThroughput();
    }

    /**
     * Update current TPS calculation
     */
    private void updateThroughput() {
        long now = System.currentTimeMillis();
        long last = lastThroughputCheck.get();

        // First initialization: set start time
        if (last == 0) {
            lastThroughputCheck.compareAndSet(0, now);
            return;
        }

        long elapsed = now - last;

        // Update TPS every second (or if we have any transactions)
        if (elapsed >= 1000 || (elapsed > 0 && totalTransactionsProcessed.sum() > 0 && elapsed >= 50)) {
            if (lastThroughputCheck.compareAndSet(last, now)) {
                long txCount = totalTransactionsProcessed.sum();
                long elapsedSeconds = Math.max(1, elapsed / 1000);

                // Calculate incremental TPS: transactions since last check / elapsed seconds
                // For short durations, calculate proportionally
                if (elapsed < 1000 && txCount > 0) {
                    currentTPS.set((txCount * 1000) / Math.max(1, elapsed));
                } else {
                    currentTPS.set(txCount / elapsedSeconds);
                }
            }
        }
    }

    private void updateMin(AtomicLong minValue, long newValue) {
        long current;
        do {
            current = minValue.get();
            if (newValue >= current) {
                break;
            }
        } while (!minValue.compareAndSet(current, newValue));
    }

    private void updateMax(AtomicLong maxValue, long newValue) {
        long current;
        do {
            current = maxValue.get();
            if (newValue <= current) {
                break;
            }
        } while (!maxValue.compareAndSet(current, newValue));
    }

    /**
     * Get comprehensive metrics snapshot
     */
    public MetricsSnapshot getSnapshot() {
        return new MetricsSnapshot(
            // Election metrics
            totalElections.sum(),
            successfulElections.sum(),
            failedElections.sum(),
            getAvgElectionTime(),
            minElectionTimeMs.get() == Long.MAX_VALUE ? 0 : minElectionTimeMs.get(),
            maxElectionTimeMs.get(),

            // Proposal metrics
            totalProposals.sum(),
            successfulProposals.sum(),
            getAvgProposalTime(),
            minProposalTimeMs.get() == Long.MAX_VALUE ? 0 : minProposalTimeMs.get(),
            maxProposalTimeMs.get(),

            // Commit metrics
            totalCommits.sum(),
            successfulCommits.sum(),
            getAvgCommitTime(),
            minCommitTimeMs.get() == Long.MAX_VALUE ? 0 : minCommitTimeMs.get(),
            maxCommitTimeMs.get(),

            // Validation metrics
            totalValidations.sum(),
            successfulValidations.sum(),
            getAvgValidationTime(),

            // Throughput
            totalTransactionsProcessed.sum(),
            currentTPS.get(),

            startTime
        );
    }

    public double getAvgElectionTime() {
        long total = totalElections.sum();
        return total > 0 ? (double) totalElectionTimeMs.get() / total : 0.0;
    }

    public double getAvgProposalTime() {
        long total = totalProposals.sum();
        return total > 0 ? (double) totalProposalTimeMs.get() / total : 0.0;
    }

    public double getAvgCommitTime() {
        long total = totalCommits.sum();
        return total > 0 ? (double) totalCommitTimeMs.get() / total : 0.0;
    }

    public double getAvgValidationTime() {
        long total = totalValidations.sum();
        return total > 0 ? (double) totalValidationTimeMs.get() / total : 0.0;
    }

    public long getCurrentTPS() {
        return currentTPS.get();
    }

    public double getElectionSuccessRate() {
        long total = totalElections.sum();
        return total > 0 ? (double) successfulElections.sum() / total : 0.0;
    }

    public double getProposalSuccessRate() {
        long total = totalProposals.sum();
        return total > 0 ? (double) successfulProposals.sum() / total : 0.0;
    }

    public double getCommitSuccessRate() {
        long total = totalCommits.sum();
        return total > 0 ? (double) successfulCommits.sum() / total : 0.0;
    }

    public double getValidationSuccessRate() {
        long total = totalValidations.sum();
        return total > 0 ? (double) successfulValidations.sum() / total : 0.0;
    }

    /**
     * Immutable snapshot of metrics at a point in time
     */
    public static class MetricsSnapshot {
        // Election metrics
        public final long totalElections;
        public final long successfulElections;
        public final long failedElections;
        public final double avgElectionTimeMs;
        public final long minElectionTimeMs;
        public final long maxElectionTimeMs;

        // Proposal metrics
        public final long totalProposals;
        public final long successfulProposals;
        public final double avgProposalTimeMs;
        public final long minProposalTimeMs;
        public final long maxProposalTimeMs;

        // Commit metrics
        public final long totalCommits;
        public final long successfulCommits;
        public final double avgCommitTimeMs;
        public final long minCommitTimeMs;
        public final long maxCommitTimeMs;

        // Validation metrics
        public final long totalValidations;
        public final long successfulValidations;
        public final double avgValidationTimeMs;

        // Throughput
        public final long totalTransactionsProcessed;
        public final long currentTPS;

        public final Instant timestamp;
        public final Instant metricsStartTime;

        public MetricsSnapshot(
            long totalElections, long successfulElections, long failedElections,
            double avgElectionTimeMs, long minElectionTimeMs, long maxElectionTimeMs,
            long totalProposals, long successfulProposals, double avgProposalTimeMs,
            long minProposalTimeMs, long maxProposalTimeMs,
            long totalCommits, long successfulCommits, double avgCommitTimeMs,
            long minCommitTimeMs, long maxCommitTimeMs,
            long totalValidations, long successfulValidations, double avgValidationTimeMs,
            long totalTransactionsProcessed, long currentTPS,
            Instant metricsStartTime
        ) {
            this.totalElections = totalElections;
            this.successfulElections = successfulElections;
            this.failedElections = failedElections;
            this.avgElectionTimeMs = avgElectionTimeMs;
            this.minElectionTimeMs = minElectionTimeMs;
            this.maxElectionTimeMs = maxElectionTimeMs;

            this.totalProposals = totalProposals;
            this.successfulProposals = successfulProposals;
            this.avgProposalTimeMs = avgProposalTimeMs;
            this.minProposalTimeMs = minProposalTimeMs;
            this.maxProposalTimeMs = maxProposalTimeMs;

            this.totalCommits = totalCommits;
            this.successfulCommits = successfulCommits;
            this.avgCommitTimeMs = avgCommitTimeMs;
            this.minCommitTimeMs = minCommitTimeMs;
            this.maxCommitTimeMs = maxCommitTimeMs;

            this.totalValidations = totalValidations;
            this.successfulValidations = successfulValidations;
            this.avgValidationTimeMs = avgValidationTimeMs;

            this.totalTransactionsProcessed = totalTransactionsProcessed;
            this.currentTPS = currentTPS;

            this.timestamp = Instant.now();
            this.metricsStartTime = metricsStartTime;
        }

        @Override
        public String toString() {
            return String.format(
                "ConsensusMetrics{" +
                "elections=%d (%.1f%% success, avg=%.2fms, min=%dms, max=%dms), " +
                "proposals=%d (%.1f%% success, avg=%.2fms), " +
                "commits=%d (%.1f%% success, avg=%.2fms, min=%dms, max=%dms), " +
                "validations=%d (%.1f%% success, avg=%.2fms), " +
                "txProcessed=%d, currentTPS=%d}",
                totalElections, (double) successfulElections / Math.max(1, totalElections) * 100,
                avgElectionTimeMs, minElectionTimeMs, maxElectionTimeMs,
                totalProposals, (double) successfulProposals / Math.max(1, totalProposals) * 100,
                avgProposalTimeMs,
                totalCommits, (double) successfulCommits / Math.max(1, totalCommits) * 100,
                avgCommitTimeMs, minCommitTimeMs, maxCommitTimeMs,
                totalValidations, (double) successfulValidations / Math.max(1, totalValidations) * 100,
                avgValidationTimeMs,
                totalTransactionsProcessed, currentTPS
            );
        }
    }

    /**
     * Reset all metrics (for testing only)
     */
    public void reset() {
        totalElections.reset();
        successfulElections.reset();
        failedElections.reset();
        totalElectionTimeMs.set(0);
        minElectionTimeMs.set(Long.MAX_VALUE);
        maxElectionTimeMs.set(0);

        totalProposals.reset();
        successfulProposals.reset();
        totalProposalTimeMs.set(0);
        minProposalTimeMs.set(Long.MAX_VALUE);
        maxProposalTimeMs.set(0);

        totalCommits.reset();
        successfulCommits.reset();
        totalCommitTimeMs.set(0);
        minCommitTimeMs.set(Long.MAX_VALUE);
        maxCommitTimeMs.set(0);

        totalValidations.reset();
        successfulValidations.reset();
        totalValidationTimeMs.set(0);

        totalTransactionsProcessed.reset();
        currentTPS.set(0);
        lastThroughputCheck.set(System.currentTimeMillis());
    }
}
