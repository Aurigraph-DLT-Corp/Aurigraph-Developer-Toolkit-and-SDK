package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.aurigraph.v11.demo.models.NodeStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for ValidatorNode
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node lifecycle (start/stop/restart)
 * - Consensus operations (block validation, voting)
 * - Mempool management
 * - Staking operations
 * - Leader election
 * - Peer management
 * - Health checks and metrics
 */
@DisplayName("ValidatorNode Tests")
class ValidatorNodeTest {

    private ValidatorNode validator;
    private static final String NODE_ID = "validator-test-1";

    @BeforeEach
    void setUp() {
        validator = new ValidatorNode(NODE_ID);
    }

    @AfterEach
    void tearDown() {
        if (validator != null && validator.isRunning()) {
            validator.stop();
        }
    }

    // ============================================
    // NODE LIFECYCLE TESTS
    // ============================================

    @Nested
    @DisplayName("Lifecycle Tests")
    class LifecycleTests {

        @Test
        @DisplayName("Should create validator node with correct ID")
        void shouldCreateNodeWithCorrectId() {
            assertEquals(NODE_ID, validator.getNodeId());
        }

        @Test
        @DisplayName("Should start validator node successfully")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartNodeSuccessfully() {
            assertFalse(validator.isRunning());
            validator.start();
            assertTrue(validator.isRunning());
        }

        @Test
        @DisplayName("Should stop validator node successfully")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStopNodeSuccessfully() {
            validator.start();
            assertTrue(validator.isRunning());
            validator.stop();
            assertFalse(validator.isRunning());
        }

        @Test
        @DisplayName("Should restart validator node successfully")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldRestartNodeSuccessfully() {
            validator.start();
            assertTrue(validator.isRunning());
            validator.restart();
            assertTrue(validator.isRunning());
        }

        @Test
        @DisplayName("Should handle multiple start calls gracefully")
        void shouldHandleMultipleStartCalls() {
            validator.start();
            validator.start(); // Second call should be safe
            assertTrue(validator.isRunning());
        }

        @Test
        @DisplayName("Should handle stop when not running")
        void shouldHandleStopWhenNotRunning() {
            assertFalse(validator.isRunning());
            assertDoesNotThrow(() -> validator.stop());
        }
    }

    // ============================================
    // CONSENSUS OPERATIONS TESTS
    // ============================================

    @Nested
    @DisplayName("Consensus Tests")
    class ConsensusTests {

        @BeforeEach
        void startValidator() {
            validator.start();
        }

        @Test
        @DisplayName("Should validate valid transaction")
        void shouldValidateValidTransaction() {
            assertTrue(validator.validateTransaction("tx-001"));
            assertTrue(validator.validateTransaction("tx-002"));
        }

        @Test
        @DisplayName("Should reject null transaction")
        void shouldRejectNullTransaction() {
            assertFalse(validator.validateTransaction(null));
        }

        @Test
        @DisplayName("Should reject empty transaction")
        void shouldRejectEmptyTransaction() {
            assertFalse(validator.validateTransaction(""));
        }

        @Test
        @DisplayName("Should validate block with transactions")
        void shouldValidateBlockWithTransactions() {
            List<String> transactions = Arrays.asList("tx-1", "tx-2", "tx-3");
            assertTrue(validator.validateBlock(1L, transactions));
            assertEquals(3, validator.getValidatedTransactions());
        }

        @Test
        @DisplayName("Should reject block with invalid transactions")
        void shouldRejectBlockWithInvalidTransactions() {
            List<String> transactions = Arrays.asList("tx-1", "", "tx-3");
            assertFalse(validator.validateBlock(1L, transactions));
        }

        @Test
        @DisplayName("Should vote on block")
        void shouldVoteOnBlock() {
            validator.voteOnBlock(1L, "voter-1", true);
            validator.voteOnBlock(1L, "voter-2", true);
            // Votes are recorded (verified via quorum check)
        }

        @Test
        @DisplayName("Should not have quorum with insufficient votes")
        void shouldNotHaveQuorumWithInsufficientVotes() {
            // With no peers, only self votes
            validator.voteOnBlock(1L, validator.getNodeId(), true);
            assertFalse(validator.hasQuorum(1L));
        }

        @Test
        @DisplayName("Should achieve quorum with sufficient votes")
        void shouldAchieveQuorumWithSufficientVotes() {
            // Add 2 peers (3 total validators)
            validator.connectPeer("peer-1");
            validator.connectPeer("peer-2");

            // 3 validators, need 2/3 = 67%, so 2 votes required
            validator.voteOnBlock(1L, validator.getNodeId(), true);
            validator.voteOnBlock(1L, "peer-1", true);
            assertTrue(validator.hasQuorum(1L));
        }

        @Test
        @DisplayName("Should track current block height")
        void shouldTrackCurrentBlockHeight() {
            assertEquals(0, validator.getCurrentBlockHeight());
            validator.validateBlock(1L, List.of("tx-1"));
            // Block height is managed internally during proposal
        }
    }

    // ============================================
    // MEMPOOL TESTS
    // ============================================

    @Nested
    @DisplayName("Mempool Tests")
    class MempoolTests {

        @BeforeEach
        void startValidator() {
            validator.start();
        }

        @Test
        @DisplayName("Should add transaction to mempool")
        void shouldAddTransactionToMempool() {
            assertEquals(0, validator.getMempoolSize());
            assertTrue(validator.addToMempool("tx-001"));
            assertEquals(1, validator.getMempoolSize());
        }

        @Test
        @DisplayName("Should add multiple transactions to mempool")
        void shouldAddMultipleTransactionsToMempool() {
            validator.addToMempool("tx-001");
            validator.addToMempool("tx-002");
            validator.addToMempool("tx-003");
            assertEquals(3, validator.getMempoolSize());
        }

        @Test
        @DisplayName("Should track mempool size correctly")
        void shouldTrackMempoolSizeCorrectly() {
            for (int i = 0; i < 100; i++) {
                validator.addToMempool("tx-" + i);
            }
            assertEquals(100, validator.getMempoolSize());
        }
    }

    // ============================================
    // STAKING TESTS
    // ============================================

    @Nested
    @DisplayName("Staking Tests")
    class StakingTests {

        @Test
        @DisplayName("Should stake tokens")
        void shouldStakeTokens() {
            assertEquals(BigDecimal.ZERO, validator.getStakedAmount());
            validator.stake(new BigDecimal("1000"));
            assertEquals(new BigDecimal("1000"), validator.getStakedAmount());
        }

        @Test
        @DisplayName("Should accumulate staked tokens")
        void shouldAccumulateStakedTokens() {
            validator.stake(new BigDecimal("1000"));
            validator.stake(new BigDecimal("500"));
            assertEquals(new BigDecimal("1500"), validator.getStakedAmount());
        }

        @Test
        @DisplayName("Should unstake tokens")
        void shouldUnstakeTokens() {
            validator.stake(new BigDecimal("1000"));
            validator.unstake(new BigDecimal("400"));
            assertEquals(new BigDecimal("600"), validator.getStakedAmount());
        }

        @Test
        @DisplayName("Should not unstake more than staked")
        void shouldNotUnstakeMoreThanStaked() {
            validator.stake(new BigDecimal("1000"));
            validator.unstake(new BigDecimal("2000")); // Should be ignored
            assertEquals(new BigDecimal("1000"), validator.getStakedAmount());
        }

        @Test
        @DisplayName("Should unstake exact amount staked")
        void shouldUnstakeExactAmountStaked() {
            validator.stake(new BigDecimal("1000"));
            validator.unstake(new BigDecimal("1000"));
            assertEquals(BigDecimal.ZERO, validator.getStakedAmount());
        }
    }

    // ============================================
    // LEADER ELECTION TESTS
    // ============================================

    @Nested
    @DisplayName("Leader Election Tests")
    class LeaderElectionTests {

        @BeforeEach
        void startValidator() {
            validator.start();
        }

        @Test
        @DisplayName("Should not be leader initially")
        void shouldNotBeLeaderInitially() {
            assertFalse(validator.isLeader());
        }

        @Test
        @DisplayName("Should become leader")
        void shouldBecomeLeader() {
            validator.becomeLeader();
            assertTrue(validator.isLeader());
        }

        @Test
        @DisplayName("Should step down as leader")
        void shouldStepDownAsLeader() {
            validator.becomeLeader();
            assertTrue(validator.isLeader());
            validator.stepDown();
            assertFalse(validator.isLeader());
        }

        @Test
        @DisplayName("Should handle step down when not leader")
        void shouldHandleStepDownWhenNotLeader() {
            assertFalse(validator.isLeader());
            assertDoesNotThrow(() -> validator.stepDown());
            assertFalse(validator.isLeader());
        }
    }

    // ============================================
    // PEER MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Peer Management Tests")
    class PeerManagementTests {

        @BeforeEach
        void startValidator() {
            validator.start();
        }

        @Test
        @DisplayName("Should connect to peer")
        void shouldConnectToPeer() {
            assertEquals(0, validator.getConnectedPeers().size());
            validator.connectPeer("peer-1");
            assertEquals(1, validator.getConnectedPeers().size());
            assertTrue(validator.getConnectedPeers().contains("peer-1"));
        }

        @Test
        @DisplayName("Should connect to multiple peers")
        void shouldConnectToMultiplePeers() {
            validator.connectPeer("peer-1");
            validator.connectPeer("peer-2");
            validator.connectPeer("peer-3");
            assertEquals(3, validator.getConnectedPeers().size());
        }

        @Test
        @DisplayName("Should disconnect from peer")
        void shouldDisconnectFromPeer() {
            validator.connectPeer("peer-1");
            validator.connectPeer("peer-2");
            assertEquals(2, validator.getConnectedPeers().size());

            validator.disconnectPeer("peer-1");
            assertEquals(1, validator.getConnectedPeers().size());
            assertFalse(validator.getConnectedPeers().contains("peer-1"));
        }

        @Test
        @DisplayName("Should handle duplicate peer connection")
        void shouldHandleDuplicatePeerConnection() {
            validator.connectPeer("peer-1");
            validator.connectPeer("peer-1"); // Duplicate
            assertEquals(1, validator.getConnectedPeers().size());
        }

        @Test
        @DisplayName("Should return unmodifiable peer set")
        void shouldReturnUnmodifiablePeerSet() {
            validator.connectPeer("peer-1");
            Set<String> peers = validator.getConnectedPeers();
            assertThrows(UnsupportedOperationException.class, () -> peers.add("peer-2"));
        }
    }

    // ============================================
    // HEALTH CHECK TESTS
    // ============================================

    @Nested
    @DisplayName("Health Check Tests")
    class HealthCheckTests {

        @Test
        @DisplayName("Should report healthy when running")
        void shouldReportHealthyWhenRunning() {
            validator.start();
            validator.stake(new BigDecimal("1000")); // Need stake for health
            validator.connectPeer("peer-1");
            validator.connectPeer("peer-2");
            validator.connectPeer("peer-3"); // Need 3 peers for health

            NodeHealth health = validator.healthCheck().await().indefinitely();
            assertNotNull(health);
            assertTrue(health.isHealthy());
        }

        @Test
        @DisplayName("Should include uptime in health check")
        void shouldIncludeUptimeInHealthCheck() throws InterruptedException {
            validator.start();
            Thread.sleep(100); // Wait a bit

            NodeHealth health = validator.healthCheck().await().indefinitely();
            assertTrue(health.getUptimeSeconds() >= 0);
        }

        @Test
        @DisplayName("Should include components in health check")
        void shouldIncludeComponentsInHealthCheck() {
            validator.start();
            NodeHealth health = validator.healthCheck().await().indefinitely();

            assertNotNull(health.getComponentChecks());
            assertTrue(health.getComponentChecks().containsKey("consensus"));
            assertTrue(health.getComponentChecks().containsKey("mempool"));
            assertTrue(health.getComponentChecks().containsKey("peers"));
            assertTrue(health.getComponentChecks().containsKey("staking"));
        }
    }

    // ============================================
    // METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Metrics Tests")
    class MetricsTests {

        @BeforeEach
        void startValidator() {
            validator.start();
        }

        @Test
        @DisplayName("Should return valid metrics")
        void shouldReturnValidMetrics() {
            NodeMetrics metrics = validator.getMetrics().await().indefinitely();
            assertNotNull(metrics);
        }

        @Test
        @DisplayName("Should include custom metrics")
        void shouldIncludeCustomMetrics() {
            NodeMetrics metrics = validator.getMetrics().await().indefinitely();
            assertNotNull(metrics.getCustomMetrics());
            assertTrue(metrics.getCustomMetrics().containsKey("blockHeight"));
            assertTrue(metrics.getCustomMetrics().containsKey("validatedTransactions"));
            assertTrue(metrics.getCustomMetrics().containsKey("isLeader"));
            assertTrue(metrics.getCustomMetrics().containsKey("mempoolSize"));
        }

        @Test
        @DisplayName("Should track validated transactions in metrics")
        void shouldTrackValidatedTransactionsInMetrics() {
            validator.validateBlock(1L, Arrays.asList("tx-1", "tx-2", "tx-3"));

            NodeMetrics metrics = validator.getMetrics().await().indefinitely();
            assertEquals(3L, metrics.getCustomMetrics().get("validatedTransactions"));
        }

        @Test
        @DisplayName("Should track mempool size in metrics")
        void shouldTrackMempoolSizeInMetrics() {
            validator.addToMempool("tx-1");
            validator.addToMempool("tx-2");

            NodeMetrics metrics = validator.getMetrics().await().indefinitely();
            assertEquals(2, metrics.getCustomMetrics().get("mempoolSize"));
        }

        @Test
        @DisplayName("Should track connected peers in metrics")
        void shouldTrackConnectedPeersInMetrics() {
            validator.connectPeer("peer-1");
            validator.connectPeer("peer-2");

            NodeMetrics metrics = validator.getMetrics().await().indefinitely();
            assertEquals(2, metrics.getCustomMetrics().get("connectedPeers"));
        }

        @Test
        @DisplayName("Should track staked amount in metrics")
        void shouldTrackStakedAmountInMetrics() {
            validator.stake(new BigDecimal("5000"));

            NodeMetrics metrics = validator.getMetrics().await().indefinitely();
            assertEquals("5000", metrics.getCustomMetrics().get("stakedAmount"));
        }

        @Test
        @DisplayName("Should track leader status in metrics")
        void shouldTrackLeaderStatusInMetrics() {
            NodeMetrics metrics1 = validator.getMetrics().await().indefinitely();
            assertFalse((Boolean) metrics1.getCustomMetrics().get("isLeader"));

            validator.becomeLeader();
            NodeMetrics metrics2 = validator.getMetrics().await().indefinitely();
            assertTrue((Boolean) metrics2.getCustomMetrics().get("isLeader"));
        }
    }

    // ============================================
    // REPUTATION TESTS
    // ============================================

    @Nested
    @DisplayName("Reputation Tests")
    class ReputationTests {

        @Test
        @DisplayName("Should have initial reputation score of 100")
        void shouldHaveInitialReputationScore() {
            assertEquals(100, validator.getReputationScore());
        }
    }
}
