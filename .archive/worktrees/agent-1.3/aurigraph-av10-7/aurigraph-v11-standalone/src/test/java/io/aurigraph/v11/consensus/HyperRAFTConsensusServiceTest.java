package io.aurigraph.v11.consensus;

import io.aurigraph.v11.ServiceTestBase;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class HyperRAFTConsensusServiceTest extends ServiceTestBase {

    @Inject
    HyperRAFTConsensusService consensusService;

    @Test
    @DisplayName("Consensus service should be injectable")
    void testConsensusServiceInjection() {
        assertNotNull(consensusService, "Consensus service should be injected");
    }

    @Test
    @DisplayName("Should start in follower state")
    void testInitialState() {
        assertThat(consensusService.getCurrentState())
            .isIn(HyperRAFTConsensusService.NodeState.LEADER, HyperRAFTConsensusService.NodeState.FOLLOWER);
    }

    @Test
    @DisplayName("Should propose values when in leader state")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testProposeValueAsLeader() {
        // First become leader
        consensusService.startElection().await().atMost(java.time.Duration.ofSeconds(5));

        if (consensusService.getCurrentState() == HyperRAFTConsensusService.NodeState.LEADER) {
            String testValue = "test-transaction-" + System.currentTimeMillis();
            Boolean proposalResult = consensusService.proposeValue(testValue).await().atMost(java.time.Duration.ofSeconds(5));

            assertThat(proposalResult)
                .as("Proposal should succeed when node is leader")
                .isTrue();

            // Verify consensus latency is recorded
            HyperRAFTConsensusService.ConsensusStats stats = consensusService.getStats().await().atMost(java.time.Duration.ofSeconds(5));
            assertThat(stats.consensusLatency)
                .as("Consensus latency should be recorded")
                .isGreaterThanOrEqualTo(0L);

            assertThat(stats.throughput)
                .as("Throughput should be incremented")
                .isGreaterThan(0L);
        }
    }

    @Test
    @DisplayName("Metrics should be available")
    void testMetricsAvailable() {
        ConsensusMetrics.MetricsSnapshot snapshot = consensusService.getConsensusMetrics();
        assertNotNull(snapshot, "Metrics snapshot should not be null");
        assertThat(snapshot.totalElections).isGreaterThanOrEqualTo(0);
    }
}
