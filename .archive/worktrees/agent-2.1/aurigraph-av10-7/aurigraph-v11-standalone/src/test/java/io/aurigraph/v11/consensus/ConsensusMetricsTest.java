package io.aurigraph.v11.consensus;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ConsensusMetrics class
 *
 * Tests metric tracking, calculation, and thread safety
 * Target: 95%+ coverage
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ConsensusMetricsTest {

    private ConsensusMetrics metrics;

    @BeforeEach
    void setUp() {
        metrics = new ConsensusMetrics();
    }

    // ==================== Election Metrics Tests ====================

    @Test
    @Order(1)
    @DisplayName("Record election should track success")
    void testRecordSuccessfulElection() {
        // When: Recording successful election
        metrics.recordElection(true, 150);

        // Then: Metrics should reflect the election
        var snapshot = metrics.getSnapshot();
        assertEquals(1, snapshot.totalElections);
        assertEquals(1, snapshot.successfulElections);
        assertEquals(0, snapshot.failedElections);
        assertEquals(150.0, snapshot.avgElectionTimeMs, 0.01);
        assertEquals(150, snapshot.minElectionTimeMs);
        assertEquals(150, snapshot.maxElectionTimeMs);
    }

    @Test
    @Order(2)
    @DisplayName("Record election should track failure")
    void testRecordFailedElection() {
        // When: Recording failed election
        metrics.recordElection(false, 200);

        // Then: Metrics should reflect the failure
        var snapshot = metrics.getSnapshot();
        assertEquals(1, snapshot.totalElections);
        assertEquals(0, snapshot.successfulElections);
        assertEquals(1, snapshot.failedElections);
        assertEquals(200.0, snapshot.avgElectionTimeMs, 0.01);
    }

    @Test
    @Order(3)
    @DisplayName("Multiple elections should calculate average correctly")
    void testMultipleElections() {
        // When: Recording multiple elections
        metrics.recordElection(true, 100);
        metrics.recordElection(true, 200);
        metrics.recordElection(false, 300);

        // Then: Should calculate correct averages
        var snapshot = metrics.getSnapshot();
        assertEquals(3, snapshot.totalElections);
        assertEquals(2, snapshot.successfulElections);
        assertEquals(1, snapshot.failedElections);
        assertEquals(200.0, snapshot.avgElectionTimeMs, 0.01); // (100+200+300)/3
        assertEquals(100, snapshot.minElectionTimeMs);
        assertEquals(300, snapshot.maxElectionTimeMs);
    }

    @Test
    @Order(4)
    @DisplayName("Election success rate should be calculated correctly")
    void testElectionSuccessRate() {
        // Given: Mix of successful and failed elections
        metrics.recordElection(true, 100);
        metrics.recordElection(true, 100);
        metrics.recordElection(false, 100);

        // When: Getting success rate
        double successRate = metrics.getElectionSuccessRate();

        // Then: Should be 2/3
        assertEquals(0.666, successRate, 0.01);
    }

    // ==================== Proposal Metrics Tests ====================

    @Test
    @Order(5)
    @DisplayName("Record proposal should track metrics")
    void testRecordProposal() {
        // When: Recording proposals
        metrics.recordProposal(true, 10);
        metrics.recordProposal(true, 20);
        metrics.recordProposal(false, 30);

        // Then: Metrics should be accurate
        var snapshot = metrics.getSnapshot();
        assertEquals(3, snapshot.totalProposals);
        assertEquals(2, snapshot.successfulProposals);
        assertEquals(20.0, snapshot.avgProposalTimeMs, 0.01);
        assertEquals(10, snapshot.minProposalTimeMs);
        assertEquals(30, snapshot.maxProposalTimeMs);
    }

    @Test
    @Order(6)
    @DisplayName("Proposal success rate should be calculated correctly")
    void testProposalSuccessRate() {
        // Given: Mix of successful and failed proposals
        metrics.recordProposal(true, 10);
        metrics.recordProposal(true, 10);
        metrics.recordProposal(true, 10);
        metrics.recordProposal(false, 10);

        // When: Getting success rate
        double successRate = metrics.getProposalSuccessRate();

        // Then: Should be 3/4
        assertEquals(0.75, successRate, 0.01);
    }

    // ==================== Commit Metrics Tests ====================

    @Test
    @Order(7)
    @DisplayName("Record commit should track metrics")
    void testRecordCommit() {
        // When: Recording commits
        metrics.recordCommit(true, 5);
        metrics.recordCommit(true, 15);
        metrics.recordCommit(false, 25);

        // Then: Metrics should be accurate
        var snapshot = metrics.getSnapshot();
        assertEquals(3, snapshot.totalCommits);
        assertEquals(2, snapshot.successfulCommits);
        assertEquals(15.0, snapshot.avgCommitTimeMs, 0.01);
        assertEquals(5, snapshot.minCommitTimeMs);
        assertEquals(25, snapshot.maxCommitTimeMs);
    }

    @Test
    @Order(8)
    @DisplayName("Commit success rate should be calculated correctly")
    void testCommitSuccessRate() {
        // Given: All successful commits
        metrics.recordCommit(true, 10);
        metrics.recordCommit(true, 10);
        metrics.recordCommit(true, 10);

        // When: Getting success rate
        double successRate = metrics.getCommitSuccessRate();

        // Then: Should be 100%
        assertEquals(1.0, successRate, 0.01);
    }

    // ==================== Validation Metrics Tests ====================

    @Test
    @Order(9)
    @DisplayName("Record validation should track transactions")
    void testRecordValidation() {
        // When: Recording validations with transaction counts
        metrics.recordValidation(true, 50, 100);
        metrics.recordValidation(true, 60, 200);

        // Then: Should track total transactions
        var snapshot = metrics.getSnapshot();
        assertEquals(2, snapshot.totalValidations);
        assertEquals(2, snapshot.successfulValidations);
        assertEquals(300, snapshot.totalTransactionsProcessed);
        assertEquals(55.0, snapshot.avgValidationTimeMs, 0.01);
    }

    @Test
    @Order(10)
    @DisplayName("Failed validations should not count transactions")
    void testFailedValidationNoTransactions() {
        // When: Recording failed validation
        metrics.recordValidation(false, 100, 0);

        // Then: Should not count transactions
        var snapshot = metrics.getSnapshot();
        assertEquals(1, snapshot.totalValidations);
        assertEquals(0, snapshot.successfulValidations);
        assertEquals(0, snapshot.totalTransactionsProcessed);
    }

    @Test
    @Order(11)
    @DisplayName("Validation success rate should be calculated correctly")
    void testValidationSuccessRate() {
        // Given: Mix of validations
        metrics.recordValidation(true, 10, 100);
        metrics.recordValidation(true, 10, 100);
        metrics.recordValidation(false, 10, 0);
        metrics.recordValidation(false, 10, 0);

        // When: Getting success rate
        double successRate = metrics.getValidationSuccessRate();

        // Then: Should be 50%
        assertEquals(0.5, successRate, 0.01);
    }

    // ==================== Throughput Tests ====================

    @Test
    @Order(12)
    @DisplayName("TPS should be calculated over time")
    void testThroughputCalculation() throws InterruptedException {
        // When: Recording transactions over time
        metrics.recordValidation(true, 10, 1000);
        Thread.sleep(100); // Brief pause
        metrics.recordValidation(true, 10, 1000);

        // Then: Current TPS should be non-zero
        long tps = metrics.getCurrentTPS();
        assertTrue(tps > 0, "TPS should be greater than 0");
    }

    // ==================== Min/Max Tracking Tests ====================

    @Test
    @Order(13)
    @DisplayName("Min and max times should be tracked correctly")
    void testMinMaxTracking() {
        // When: Recording various durations
        metrics.recordElection(true, 500);
        metrics.recordElection(true, 100);
        metrics.recordElection(true, 300);
        metrics.recordElection(true, 50);
        metrics.recordElection(true, 400);

        // Then: Min and max should be correct
        var snapshot = metrics.getSnapshot();
        assertEquals(50, snapshot.minElectionTimeMs);
        assertEquals(500, snapshot.maxElectionTimeMs);
    }

    @Test
    @Order(14)
    @DisplayName("Min should handle zero correctly")
    void testMinWithNoData() {
        // When: Getting snapshot with no data
        var snapshot = metrics.getSnapshot();

        // Then: Min values should be 0 (not Long.MAX_VALUE)
        assertEquals(0, snapshot.minElectionTimeMs);
        assertEquals(0, snapshot.minProposalTimeMs);
        assertEquals(0, snapshot.minCommitTimeMs);
    }

    // ==================== Reset Tests ====================

    @Test
    @Order(15)
    @DisplayName("Reset should clear all metrics")
    void testReset() {
        // Given: Metrics with data
        metrics.recordElection(true, 100);
        metrics.recordProposal(true, 50);
        metrics.recordCommit(true, 25);
        metrics.recordValidation(true, 75, 1000);

        var beforeReset = metrics.getSnapshot();
        assertTrue(beforeReset.totalElections > 0);
        assertTrue(beforeReset.totalProposals > 0);

        // When: Resetting metrics
        metrics.reset();

        // Then: All metrics should be zero
        var afterReset = metrics.getSnapshot();
        assertEquals(0, afterReset.totalElections);
        assertEquals(0, afterReset.successfulElections);
        assertEquals(0, afterReset.failedElections);
        assertEquals(0, afterReset.totalProposals);
        assertEquals(0, afterReset.successfulProposals);
        assertEquals(0, afterReset.totalCommits);
        assertEquals(0, afterReset.successfulCommits);
        assertEquals(0, afterReset.totalValidations);
        assertEquals(0, afterReset.successfulValidations);
        assertEquals(0, afterReset.totalTransactionsProcessed);
    }

    // ==================== Snapshot Tests ====================

    @Test
    @Order(16)
    @DisplayName("Snapshot should be immutable")
    void testSnapshotImmutability() {
        // Given: Some metrics
        metrics.recordElection(true, 100);

        // When: Taking multiple snapshots
        var snapshot1 = metrics.getSnapshot();
        metrics.recordElection(true, 200);
        var snapshot2 = metrics.getSnapshot();

        // Then: First snapshot should be unchanged
        assertEquals(1, snapshot1.totalElections);
        assertEquals(2, snapshot2.totalElections);
        assertNotEquals(snapshot1.totalElections, snapshot2.totalElections);
    }

    @Test
    @Order(17)
    @DisplayName("Snapshot should have timestamp")
    void testSnapshotTimestamp() {
        // When: Taking snapshot
        var snapshot = metrics.getSnapshot();

        // Then: Should have valid timestamps
        assertNotNull(snapshot.timestamp);
        assertNotNull(snapshot.metricsStartTime);
        assertTrue(snapshot.timestamp.isAfter(snapshot.metricsStartTime) ||
                   snapshot.timestamp.equals(snapshot.metricsStartTime));
    }

    @Test
    @Order(18)
    @DisplayName("Snapshot toString should provide formatted output")
    void testSnapshotToString() {
        // Given: Some metrics
        metrics.recordElection(true, 100);
        metrics.recordProposal(true, 50);
        metrics.recordCommit(true, 25);

        // When: Converting to string
        var snapshot = metrics.getSnapshot();
        String output = snapshot.toString();

        // Then: Should contain key information
        assertNotNull(output);
        assertTrue(output.contains("elections="));
        assertTrue(output.contains("proposals="));
        assertTrue(output.contains("commits="));
    }

    // ==================== Average Calculation Tests ====================

    @Test
    @Order(19)
    @DisplayName("Average methods should handle zero totals")
    void testAverageWithZeroTotals() {
        // When: Getting averages with no data
        double avgElection = metrics.getAvgElectionTime();
        double avgProposal = metrics.getAvgProposalTime();
        double avgCommit = metrics.getAvgCommitTime();
        double avgValidation = metrics.getAvgValidationTime();

        // Then: Should all be zero
        assertEquals(0.0, avgElection, 0.01);
        assertEquals(0.0, avgProposal, 0.01);
        assertEquals(0.0, avgCommit, 0.01);
        assertEquals(0.0, avgValidation, 0.01);
    }

    @Test
    @Order(20)
    @DisplayName("Success rate methods should handle zero totals")
    void testSuccessRatesWithZeroTotals() {
        // When: Getting success rates with no data
        double electionRate = metrics.getElectionSuccessRate();
        double proposalRate = metrics.getProposalSuccessRate();
        double commitRate = metrics.getCommitSuccessRate();
        double validationRate = metrics.getValidationSuccessRate();

        // Then: Should all be zero
        assertEquals(0.0, electionRate, 0.01);
        assertEquals(0.0, proposalRate, 0.01);
        assertEquals(0.0, commitRate, 0.01);
        assertEquals(0.0, validationRate, 0.01);
    }

    // ==================== Concurrent Access Test ====================

    @Test
    @Order(21)
    @DisplayName("Metrics should be thread-safe")
    void testThreadSafety() throws InterruptedException {
        // Given: Multiple threads recording metrics
        int numThreads = 10;
        int operationsPerThread = 100;
        Thread[] threads = new Thread[numThreads];

        // When: Running concurrent operations
        for (int i = 0; i < numThreads; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < operationsPerThread; j++) {
                    metrics.recordElection(true, 100);
                    metrics.recordProposal(true, 50);
                    metrics.recordCommit(true, 25);
                    metrics.recordValidation(true, 75, 10);
                }
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Then: Total counts should be correct
        var snapshot = metrics.getSnapshot();
        assertEquals(numThreads * operationsPerThread, snapshot.totalElections);
        assertEquals(numThreads * operationsPerThread, snapshot.totalProposals);
        assertEquals(numThreads * operationsPerThread, snapshot.totalCommits);
        assertEquals(numThreads * operationsPerThread, snapshot.totalValidations);
        assertEquals(numThreads * operationsPerThread * 10, snapshot.totalTransactionsProcessed);
    }
}
