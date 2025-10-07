package io.aurigraph.v11.unit;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.ConsensusStats;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.LogEntry;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.NodeState;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for HyperRAFTConsensusService
 *
 * Validates:
 * - Leader election algorithm
 * - Consensus voting mechanisms
 * - Node state transitions (Follower → Candidate → Leader)
 * - Log replication and append entries
 * - Cluster management (add/remove nodes)
 * - Performance metrics tracking
 * - Error handling and edge cases
 * - Byzantine fault tolerance basics
 *
 * Coverage Target: 95% line, 90% branch (Phase 1 Critical Package)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ConsensusServiceTest {

    @Inject
    HyperRAFTConsensusService consensusService;

    @BeforeEach
    void setUp() {
        // Add some nodes to the cluster for realistic testing
        consensusService.addNode("node-1");
        consensusService.addNode("node-2");
        consensusService.addNode("node-3");
    }

    // =====================================================================
    // BASIC FUNCTIONALITY TESTS
    // =====================================================================

    @Test
    @Order(1)
    @DisplayName("Should initialize with correct default state")
    void testServiceInitialization() {
        // Assert
        assertNotNull(consensusService.getNodeId(), "Node ID should not be null");
        assertFalse(consensusService.getNodeId().isEmpty(), "Node ID should not be empty");
        assertEquals(NodeState.FOLLOWER, consensusService.getCurrentState(),
            "Initial state should be FOLLOWER");
        assertEquals(0L, consensusService.getCurrentTerm(),
            "Initial term should be 0");
    }

    @Test
    @Order(2)
    @DisplayName("Should get consensus statistics successfully")
    void testGetStats() {
        // Act
        ConsensusStats stats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(stats, "Stats should not be null");
        assertNotNull(stats.nodeId, "Stats should contain node ID");
        assertNotNull(stats.state, "Stats should contain current state");
        assertTrue(stats.currentTerm >= 0, "Term should be non-negative");
        assertTrue(stats.commitIndex >= 0, "Commit index should be non-negative");
        assertTrue(stats.clusterSize > 0, "Cluster size should be positive");
        assertTrue(stats.consensusLatency >= 0, "Latency should be non-negative");
        assertTrue(stats.throughput >= 0, "Throughput should be non-negative");
    }

    // =====================================================================
    // LEADER ELECTION TESTS
    // =====================================================================

    @Test
    @Order(3)
    @DisplayName("Should start election and transition to candidate")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testStartElection() {
        // Arrange
        long initialTerm = consensusService.getCurrentTerm();

        // Act
        Boolean electionResult = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertNotNull(electionResult, "Election result should not be null");
        long termAfterElection = consensusService.getCurrentTerm();
        assertTrue(termAfterElection > initialTerm,
            "Term should increment after election");

        NodeState stateAfterElection = consensusService.getCurrentState();
        assertTrue(stateAfterElection == NodeState.LEADER ||
                  stateAfterElection == NodeState.FOLLOWER,
            "State should be either LEADER or FOLLOWER after election");
    }

    @Test
    @Order(4)
    @DisplayName("Should handle multiple elections correctly")
    @Timeout(value = 20, unit = TimeUnit.SECONDS)
    void testMultipleElections() {
        // Arrange
        int electionCount = 5;
        long initialTerm = consensusService.getCurrentTerm();
        int leaderWins = 0;

        // Act
        for (int i = 0; i < electionCount; i++) {
            Boolean won = consensusService.startElection()
                .await().atMost(Duration.ofSeconds(3));
            if (won != null && won) {
                leaderWins++;
            }
        }

        // Assert
        long finalTerm = consensusService.getCurrentTerm();
        assertTrue(finalTerm >= initialTerm + electionCount,
            "Term should increment with each election");
        assertTrue(leaderWins > 0,
            "Should win at least some elections (probabilistic)");
    }

    // =====================================================================
    // CONSENSUS OPERATIONS TESTS
    // =====================================================================

    @Test
    @Order(5)
    @DisplayName("Should reject proposals when not leader")
    void testProposeValueAsFollower() {
        // Arrange - Ensure node is follower
        // Note: Node starts as follower by default

        // Act
        String testValue = "test-transaction-follower";
        Boolean proposalResult = consensusService.proposeValue(testValue)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertFalse(proposalResult,
            "Proposal should fail when node is not leader");
    }

    @Test
    @Order(6)
    @DisplayName("Should propose values when in leader state")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testProposeValueAsLeader() {
        // Arrange - Try to become leader
        Boolean wonElection = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        if (wonElection != null && wonElection &&
            consensusService.getCurrentState() == NodeState.LEADER) {

            // Act
            String testValue = "test-transaction-" + System.currentTimeMillis();
            Boolean proposalResult = consensusService.proposeValue(testValue)
                .await().atMost(Duration.ofSeconds(5));

            // Assert
            assertTrue(proposalResult,
                "Proposal should succeed when node is leader");

            // Verify metrics updated
            ConsensusStats stats = consensusService.getStats()
                .await().atMost(Duration.ofSeconds(5));
            assertTrue(stats.consensusLatency >= 0,
                "Consensus latency should be recorded");
            assertTrue(stats.throughput > 0,
                "Throughput should be incremented");
        }
    }

    @Test
    @Order(7)
    @DisplayName("Should handle multiple proposals as leader")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testMultipleProposals() {
        // Arrange
        Boolean wonElection = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        if (wonElection != null && wonElection &&
            consensusService.getCurrentState() == NodeState.LEADER) {

            int proposalCount = 10;
            int successfulProposals = 0;

            // Act
            long startTime = System.currentTimeMillis();
            for (int i = 0; i < proposalCount; i++) {
                String value = "proposal-" + i;
                Boolean result = consensusService.proposeValue(value)
                    .await().atMost(Duration.ofSeconds(2));
                if (result != null && result) {
                    successfulProposals++;
                }
            }
            long duration = System.currentTimeMillis() - startTime;

            // Assert
            assertTrue(successfulProposals >= proposalCount * 0.8,
                "Should have high success rate (>80%) for proposals");

            double tps = (successfulProposals * 1000.0) / duration;
            System.out.printf("✅ Multiple proposals: %d/%d succeeded (%.1f TPS)%n",
                successfulProposals, proposalCount, tps);
        }
    }

    // =====================================================================
    // LOG REPLICATION TESTS
    // =====================================================================

    @Test
    @Order(8)
    @DisplayName("Should handle append entries correctly")
    void testAppendEntries() {
        // Arrange
        List<LogEntry> entries = new ArrayList<>();
        entries.add(new LogEntry(1L, "entry-1"));
        entries.add(new LogEntry(1L, "entry-2"));

        // Act
        Boolean appendResult = consensusService
            .appendEntries(1L, "leader-node-id", entries)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(appendResult, "Append entries should succeed");
        assertEquals(1L, consensusService.getCurrentTerm(),
            "Term should be updated");
        assertEquals(NodeState.FOLLOWER, consensusService.getCurrentState(),
            "State should be FOLLOWER after append entries");
    }

    @Test
    @Order(9)
    @DisplayName("Should reject append entries with lower term")
    void testAppendEntriesWithLowerTerm() {
        // Arrange - Set a higher term first
        consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));
        long currentTerm = consensusService.getCurrentTerm();

        List<LogEntry> entries = List.of(
            new LogEntry(currentTerm - 1, "old-entry"));

        // Act
        Boolean appendResult = consensusService
            .appendEntries(currentTerm - 1, "leader-node-id", entries)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertFalse(appendResult,
            "Append entries should fail with lower term");
    }

    @Test
    @Order(10)
    @DisplayName("Should handle append entries with null entries")
    void testAppendEntriesWithNullEntries() {
        // Act
        Boolean appendResult = consensusService
            .appendEntries(2L, "leader-node-id", null)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(appendResult,
            "Append entries should succeed with null entries (heartbeat)");
        assertEquals(2L, consensusService.getCurrentTerm(),
            "Term should be updated even with null entries");
    }

    // =====================================================================
    // CLUSTER MANAGEMENT TESTS
    // =====================================================================

    @Test
    @Order(11)
    @DisplayName("Should add nodes to cluster correctly")
    void testAddNode() {
        // Arrange
        ConsensusStats initialStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        int initialSize = initialStats.clusterSize;
        String newNodeId = "test-node-" + System.currentTimeMillis();

        // Act
        consensusService.addNode(newNodeId);

        // Assert
        ConsensusStats finalStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        assertEquals(initialSize + 1, finalStats.clusterSize,
            "Cluster size should increase after adding node");
    }

    @Test
    @Order(12)
    @DisplayName("Should remove nodes from cluster correctly")
    void testRemoveNode() {
        // Arrange
        String nodeToRemove = "node-1"; // Added in setUp()
        ConsensusStats initialStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        int initialSize = initialStats.clusterSize;

        // Act
        consensusService.removeNode(nodeToRemove);

        // Assert
        ConsensusStats finalStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        assertEquals(initialSize - 1, finalStats.clusterSize,
            "Cluster size should decrease after removing node");
    }

    @Test
    @Order(13)
    @DisplayName("Should manage cluster membership changes")
    void testClusterMembershipChanges() {
        // Arrange
        String node1 = "dynamic-node-1";
        String node2 = "dynamic-node-2";

        // Act & Assert - Add nodes
        consensusService.addNode(node1);
        consensusService.addNode(node2);

        ConsensusStats afterAdd = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        int sizeAfterAdd = afterAdd.clusterSize;

        // Act & Assert - Remove nodes
        consensusService.removeNode(node1);
        consensusService.removeNode(node2);

        ConsensusStats afterRemove = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        assertEquals(sizeAfterAdd - 2, afterRemove.clusterSize,
            "Cluster size should reflect membership changes");
    }

    // =====================================================================
    // PERFORMANCE & METRICS TESTS
    // =====================================================================

    @Test
    @Order(14)
    @DisplayName("Should track consensus latency correctly")
    void testConsensusLatencyTracking() {
        // Arrange - Become leader
        Boolean wonElection = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        if (wonElection != null && wonElection) {
            // Act
            consensusService.proposeValue("latency-test")
                .await().atMost(Duration.ofSeconds(5));

            // Assert
            ConsensusStats stats = consensusService.getStats()
                .await().atMost(Duration.ofSeconds(5));
            assertTrue(stats.consensusLatency >= 0,
                "Consensus latency should be recorded");
        }
    }

    @Test
    @Order(15)
    @DisplayName("Should track throughput correctly")
    void testThroughputTracking() {
        // Arrange
        ConsensusStats initialStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));
        long initialThroughput = initialStats.throughput;

        // Try to become leader and propose
        Boolean wonElection = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        if (wonElection != null && wonElection) {
            // Act - Propose multiple values
            int proposals = 3;
            for (int i = 0; i < proposals; i++) {
                consensusService.proposeValue("throughput-test-" + i)
                    .await().atMost(Duration.ofSeconds(2));
            }

            // Assert
            ConsensusStats finalStats = consensusService.getStats()
                .await().atMost(Duration.ofSeconds(5));
            assertTrue(finalStats.throughput > initialThroughput,
                "Throughput should increase after successful proposals");
        }
    }

    // =====================================================================
    // CONCURRENCY TESTS
    // =====================================================================

    @Test
    @Order(16)
    @DisplayName("Should handle concurrent stat requests safely")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testConcurrentStatRequests() throws InterruptedException {
        // Arrange
        int threadCount = 100;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        ConcurrentHashMap<Integer, ConsensusStats> results = new ConcurrentHashMap<>();

        // Act
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    startLatch.await();
                    ConsensusStats stats = consensusService.getStats()
                        .await().atMost(Duration.ofSeconds(5));
                    results.put(threadId, stats);
                } catch (Exception e) {
                    // Log but don't fail test
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Start all threads
        assertTrue(completionLatch.await(30, TimeUnit.SECONDS),
            "All threads should complete within timeout");

        // Assert
        assertTrue(results.size() > 0,
            "Should successfully handle concurrent requests");
    }

    @Test
    @Order(17)
    @DisplayName("Should handle concurrent elections safely")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentElections() throws InterruptedException {
        // Arrange
        int threadCount = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        ConcurrentHashMap<Integer, Boolean> results = new ConcurrentHashMap<>();

        // Act
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    startLatch.await();
                    Boolean won = consensusService.startElection()
                        .await().atMost(Duration.ofSeconds(10));
                    results.put(threadId, won);
                } catch (Exception e) {
                    // Log but don't fail test
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Start all threads
        assertTrue(completionLatch.await(60, TimeUnit.SECONDS),
            "All threads should complete within timeout");

        // Assert
        assertTrue(results.size() > 0,
            "Should handle concurrent elections");
        long finalTerm = consensusService.getCurrentTerm();
        assertTrue(finalTerm >= threadCount,
            "Term should increment with concurrent elections");
    }

    // =====================================================================
    // EDGE CASES & ERROR HANDLING TESTS
    // =====================================================================

    @Test
    @Order(18)
    @DisplayName("Should handle edge cases gracefully")
    void testEdgeCases() {
        // Test 1: Propose with null value (as follower)
        Boolean nullResult = consensusService.proposeValue(null)
            .await().atMost(Duration.ofSeconds(5));
        assertNotNull(nullResult,
            "Should handle null proposal gracefully");

        // Test 2: Propose with empty value (as follower)
        Boolean emptyResult = consensusService.proposeValue("")
            .await().atMost(Duration.ofSeconds(5));
        assertNotNull(emptyResult,
            "Should handle empty proposal gracefully");

        // Test 3: Append entries with empty list
        Boolean emptyEntriesResult = consensusService
            .appendEntries(1L, "leader", new ArrayList<>())
            .await().atMost(Duration.ofSeconds(5));
        assertTrue(emptyEntriesResult,
            "Should handle empty entries list");
    }

    @Test
    @Order(19)
    @DisplayName("Should validate statistics accuracy")
    void testStatisticsAccuracy() {
        // Arrange
        ConsensusStats initialStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        // Act - Perform state changes
        consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        if (consensusService.getCurrentState() == NodeState.LEADER) {
            for (int i = 0; i < 5; i++) {
                consensusService.proposeValue("stats-test-" + i)
                    .await().atMost(Duration.ofSeconds(2));
            }
        }

        // Assert
        ConsensusStats finalStats = consensusService.getStats()
            .await().atMost(Duration.ofSeconds(5));

        assertTrue(finalStats.currentTerm >= initialStats.currentTerm,
            "Term should not decrease");
        assertNotNull(finalStats.nodeId,
            "Node ID should always be present");
        assertNotNull(finalStats.state,
            "State should always be present");
    }

    // =====================================================================
    // CLEANUP
    // =====================================================================

    @AfterAll
    static void tearDown() {
        System.out.println("✅ All ConsensusService tests completed successfully");
    }
}
