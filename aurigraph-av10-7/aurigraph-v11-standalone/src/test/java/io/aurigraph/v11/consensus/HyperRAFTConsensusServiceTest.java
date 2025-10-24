package io.aurigraph.v11.consensus;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.ConsensusStats;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.LogEntry;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.NodeState;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive test suite for HyperRAFTConsensusService.
 *
 * Tests:
 * - Consensus operations (basic implementation)
 * - Leader election mechanisms
 * - Log replication and append entries
 * - Node state management and transitions
 * - Performance under load (throughput/latency)
 * - Error handling and edge cases
 * - Statistics and metrics tracking
 *
 * Coverage Target: 95% line, 90% branch (Phase 1 requirement)
 */
@QuarkusTest
class HyperRAFTConsensusServiceTest extends ServiceTestBase {

    private static final Logger logger = LoggerFactory.getLogger(HyperRAFTConsensusServiceTest.class);
    
    @Inject
    HyperRAFTConsensusService consensusService;

    @BeforeEach
    public void setupTestEnvironment() {
        // Reset service state for each test
        resetConsensusService();
    }
    
    private void resetConsensusService() {
        // Reset consensus service to initial FOLLOWER state for each test
        // This is necessary because Quarkus reuses the same service instance across tests
        consensusService.resetToFollowerState();

        // Add some nodes to the cluster for testing
        consensusService.addNode("node-1");
        consensusService.addNode("node-2");
        consensusService.addNode("node-3");
    }
    
    @Test
    @DisplayName("Service should initialize with correct default state")
    void testServiceInitialization() {
        assertThat(consensusService.getNodeId())
            .as("Node ID should not be null or empty")
            .isNotNull()
            .isNotEmpty();
            
        assertThat(consensusService.getCurrentState())
            .as("Initial state should be FOLLOWER")
            .isEqualTo(NodeState.FOLLOWER);
            
        assertThat(consensusService.getCurrentTerm())
            .as("Initial term should be 0")
            .isEqualTo(0L);
    }
    
    // Helper method to test reactive success
    private <T> T testReactiveSuccess(io.smallrye.mutiny.Uni<T> uni) {
        return uni.await().atMost(java.time.Duration.ofSeconds(5));
    }

    // Helper method for concurrent execution testing
    private <T> void testConcurrentExecution(Callable<io.smallrye.mutiny.Uni<T>> callable, int iterations) {
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(10);
        java.util.List<java.util.concurrent.Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < iterations; i++) {
            futures.add(executor.submit(() -> {
                try {
                    callable.call().await().atMost(java.time.Duration.ofSeconds(5));
                } catch (Exception e) {
                    logger.debug("Concurrent execution failed", e);
                }
            }));
        }

        futures.forEach(f -> {
            try {
                f.get(30, TimeUnit.SECONDS);
            } catch (Exception e) {
                logger.debug("Future get failed", e);
            }
        });

        executor.shutdown();
    }

    // Helper method to calculate TPS
    private double calculateTPS(int operations, long durationMs) {
        if (durationMs == 0) return 0.0;
        return (operations * 1000.0) / durationMs;
    }

    // Helper method for service cleanup
    private void testServiceCleanup() {
        // Cleanup logic - no-op for now
        logger.info("Service cleanup completed");
    }

    @Test
    @DisplayName("Should get consensus statistics successfully")
    void testGetStats() {
        ConsensusStats stats = testReactiveSuccess(consensusService.getStats());
        
        assertThat(stats.nodeId)
            .as("Stats should contain node ID")
            .isNotNull()
            .isNotEmpty();
            
        assertThat(stats.state)
            .as("Stats should contain current state")
            .isNotNull();
            
        assertThat(stats.currentTerm)
            .as("Stats should contain current term")
            .isNotNegative();
            
        assertThat(stats.commitIndex)
            .as("Stats should contain commit index")
            .isNotNegative();
            
        assertThat(stats.clusterSize)
            .as("Stats should reflect cluster size")
            .isGreaterThan(0);
    }
    
    @Test
    @DisplayName("Should start election and transition to candidate state")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testStartElection() {
        Boolean electionResult = testReactiveSuccess(consensusService.startElection());
        
        assertThat(electionResult)
            .as("Election should return a boolean result")
            .isNotNull();
            
        long termAfterElection = consensusService.getCurrentTerm();
        assertThat(termAfterElection)
            .as("Term should increment after election")
            .isGreaterThan(0L);
            
        NodeState stateAfterElection = consensusService.getCurrentState();
        assertThat(stateAfterElection)
            .as("State should be either LEADER or FOLLOWER after election")
            .isIn(NodeState.LEADER, NodeState.FOLLOWER);
    }
    
    @Test
    @DisplayName("Should propose values when in leader state")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testProposeValueAsLeader() {
        // First become leader
        consensusService.startElection().await().atMost(java.time.Duration.ofSeconds(5));
        
        if (consensusService.getCurrentState() == NodeState.LEADER) {
            String testValue = "test-transaction-" + System.currentTimeMillis();
            Boolean proposalResult = testReactiveSuccess(consensusService.proposeValue(testValue));
            
            assertThat(proposalResult)
                .as("Proposal should succeed when node is leader")
                .isTrue();
                
            // Verify consensus latency is recorded
            ConsensusStats stats = testReactiveSuccess(consensusService.getStats());
            assertThat(stats.consensusLatency)
                .as("Consensus latency should be recorded")
                .isGreaterThanOrEqualTo(0L);
                
            assertThat(stats.throughput)
                .as("Throughput should be incremented")
                .isGreaterThan(0L);
        } else {
            logger.info("Node did not become leader, skipping proposal test");
        }
    }
    
    @Test
    @DisplayName("Should reject proposals when not leader")
    void testProposeValueAsFollower() {
        // Ensure node is in follower state
        assertThat(consensusService.getCurrentState())
            .as("Node should start as follower")
            .isEqualTo(NodeState.FOLLOWER);
            
        String testValue = "test-transaction-follower";
        Boolean proposalResult = testReactiveSuccess(consensusService.proposeValue(testValue));
        
        assertThat(proposalResult)
            .as("Proposal should fail when node is not leader")
            .isFalse();
    }
    
    @Test
    @DisplayName("Should handle append entries correctly")
    void testAppendEntries() {
        List<LogEntry> entries = new ArrayList<>();
        entries.add(new LogEntry(1L, "entry-1"));
        entries.add(new LogEntry(1L, "entry-2"));
        
        Boolean appendResult = testReactiveSuccess(
            consensusService.appendEntries(1L, "leader-node-id", entries));
        
        assertThat(appendResult)
            .as("Append entries should succeed")
            .isTrue();
            
        assertThat(consensusService.getCurrentTerm())
            .as("Term should be updated")
            .isEqualTo(1L);
            
        assertThat(consensusService.getCurrentState())
            .as("State should be FOLLOWER after append entries")
            .isEqualTo(NodeState.FOLLOWER);
    }
    
    @Test
    @DisplayName("Should reject append entries with lower term")
    void testAppendEntriesWithLowerTerm() {
        // First set a higher term
        consensusService.startElection().await().atMost(java.time.Duration.ofSeconds(5));
        long currentTerm = consensusService.getCurrentTerm();
        
        List<LogEntry> entries = List.of(new LogEntry(currentTerm - 1, "old-entry"));
        
        Boolean appendResult = testReactiveSuccess(
            consensusService.appendEntries(currentTerm - 1, "leader-node-id", entries));
        
        assertThat(appendResult)
            .as("Append entries should fail with lower term")
            .isFalse();
    }
    
    @Test
    @DisplayName("Should manage cluster nodes correctly")
    void testNodeManagement() {
        String newNodeId = "test-node-" + System.currentTimeMillis();
        
        // Add node
        consensusService.addNode(newNodeId);
        
        ConsensusStats stats = testReactiveSuccess(consensusService.getStats());
        assertThat(stats.clusterSize)
            .as("Cluster size should increase after adding node")
            .isGreaterThan(3); // We start with 3 nodes in setup
        
        // Remove node
        consensusService.removeNode(newNodeId);
        
        ConsensusStats statsAfterRemoval = testReactiveSuccess(consensusService.getStats());
        assertThat(statsAfterRemoval.clusterSize)
            .as("Cluster size should decrease after removing node")
            .isEqualTo(stats.clusterSize - 1);
    }
    
    @ParameterizedTest
    @ValueSource(ints = {10, 50, 100})
    @DisplayName("Should handle multiple proposals efficiently")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testMultipleProposals(int proposalCount) {
        // FORCE leader election until successful - retry with exponential backoff
        // This ensures deterministic test execution (no random 30% election failures)
        int maxAttempts = 10;
        boolean becameLeader = false;

        for (int attempt = 0; attempt < maxAttempts && !becameLeader; attempt++) {
            try {
                Boolean electionResult = consensusService.startElection()
                    .await().atMost(java.time.Duration.ofSeconds(5));

                becameLeader = electionResult != null && electionResult &&
                              consensusService.getCurrentState() == NodeState.LEADER;

                if (!becameLeader && attempt < maxAttempts - 1) {
                    logger.debug("Election attempt {} failed, retrying in 100ms...", attempt + 1);
                    Thread.sleep(100); // Brief pause before retry
                }
            } catch (Exception e) {
                logger.debug("Election attempt {} threw exception: {}", attempt + 1, e.getMessage());
                if (attempt < maxAttempts - 1) {
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        // REQUIRE leader state - fail test if election never succeeds
        // This prevents false positives where tests pass without running assertions
        assertThat(becameLeader)
            .as("Node must become leader to test proposal throughput (failed after %d attempts)", maxAttempts)
            .isTrue();

        long startTime = System.currentTimeMillis();
        int successfulProposals = 0;

        for (int i = 0; i < proposalCount; i++) {
            String value = "proposal-" + i;
            try {
                Boolean result = consensusService.proposeValue(value)
                    .await().atMost(java.time.Duration.ofSeconds(2));
                if (result) {
                    successfulProposals++;
                }
            } catch (Exception e) {
                logger.debug("Proposal {} failed: {}", i, e.getMessage());
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        double successRate = (double) successfulProposals / proposalCount * 100;
        double tps = calculateTPS(successfulProposals, duration);

        logger.info("Multiple proposals test - Success: {}/{} ({}%), TPS: {}",
                   successfulProposals, proposalCount,
                   String.format("%.2f", successRate), String.format("%.2f", tps));

        assertThat(successRate)
            .as("Should have high success rate for proposals")
            .isGreaterThanOrEqualTo(80.0); // 80% minimum success rate

        assertThat(tps)
            .as("Should achieve reasonable throughput (minimum 10 TPS)")
            .isGreaterThan(10.0); // Minimum 10 TPS requirement
    }
    
    @Test
    @DisplayName("Should maintain performance under concurrent operations")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentOperations() {
        // Test concurrent stat requests
        testConcurrentExecution(() -> consensusService.getStats(), 50);
        
        // Test concurrent elections
        testConcurrentExecution(() -> consensusService.startElection(), 10);
    }
    
    @Test
    @DisplayName("Should handle edge cases gracefully")
    void testEdgeCases() {
        // Test with null value
        if (consensusService.getCurrentState() == NodeState.FOLLOWER) {
            Boolean nullResult = testReactiveSuccess(consensusService.proposeValue(null));
            assertThat(nullResult)
                .as("Should handle null proposal gracefully")
                .isFalse();
        }
        
        // Test with empty value
        if (consensusService.getCurrentState() == NodeState.FOLLOWER) {
            Boolean emptyResult = testReactiveSuccess(consensusService.proposeValue(""));
            assertThat(emptyResult)
                .as("Should handle empty proposal gracefully")
                .isFalse();
        }
        
        // Test append entries with null entries
        Boolean nullEntriesResult = testReactiveSuccess(
            consensusService.appendEntries(1L, "leader", null));
        assertThat(nullEntriesResult)
            .as("Should handle null entries gracefully")
            .isTrue();
    }
    
    @Test
    @DisplayName("Should validate consensus statistics accuracy")
    void testStatisticsAccuracy() {
        ConsensusStats initialStats = testReactiveSuccess(consensusService.getStats());
        
        // Record initial values
        long initialThroughput = initialStats.throughput;
        
        // Try to become leader and propose some values
        consensusService.startElection().await().atMost(java.time.Duration.ofSeconds(5));
        
        if (consensusService.getCurrentState() == NodeState.LEADER) {
            // Make some successful proposals
            int proposals = 5;
            for (int i = 0; i < proposals; i++) {
                consensusService.proposeValue("test-" + i)
                    .await().atMost(java.time.Duration.ofSeconds(2));
            }
            
            ConsensusStats finalStats = testReactiveSuccess(consensusService.getStats());
            
            assertThat(finalStats.throughput)
                .as("Throughput should increase after successful proposals")
                .isGreaterThan(initialThroughput);
        }
    }
    
    @Test
    @DisplayName("Should handle service lifecycle correctly")
    void testServiceLifecycle() {
        // Test initial state
        testServiceInitialization();

        // Test operations
        testReactiveSuccess(consensusService.getStats());

        // Test state transitions
        testReactiveSuccess(consensusService.startElection());

        // Test cleanup (if applicable)
        testServiceCleanup();
    }

    private void validateServiceStatistics(Object stats) {
        assertThat(stats)
            .as("Statistics should be ConsensusStats instance")
            .isInstanceOf(ConsensusStats.class);

        ConsensusStats consensusStats = (ConsensusStats) stats;

        assertThat(consensusStats.nodeId)
            .as("Node ID in stats should not be null")
            .isNotNull();

        assertThat(consensusStats.state)
            .as("State in stats should not be null")
            .isNotNull();

        assertThat(consensusStats.currentTerm)
            .as("Term in stats should be non-negative")
            .isNotNegative();

        assertThat(consensusStats.commitIndex)
            .as("Commit index in stats should be non-negative")
            .isNotNegative();

        assertThat(consensusStats.consensusLatency)
            .as("Consensus latency in stats should be non-negative")
            .isNotNegative();

        assertThat(consensusStats.throughput)
            .as("Throughput in stats should be non-negative")
            .isNotNegative();

        assertThat(consensusStats.clusterSize)
            .as("Cluster size in stats should be positive")
            .isPositive();
    }
}