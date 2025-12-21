package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for ValidatorNodeService
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node lifecycle management
 * - Consensus coordination
 * - Leader election
 * - Staking operations
 * - Peer management
 * - Mempool operations
 * - Network statistics
 */
@DisplayName("ValidatorNodeService Tests")
class ValidatorNodeServiceTest {

    private ValidatorNodeService service;

    @BeforeEach
    void setUp() {
        service = new ValidatorNodeService();
        service.init();
    }

    @AfterEach
    void tearDown() {
        service.cleanup();
    }

    // ============================================
    // NODE LIFECYCLE TESTS
    // ============================================

    @Nested
    @DisplayName("Node Lifecycle Tests")
    class NodeLifecycleTests {

        @Test
        @DisplayName("Should create and register validator node")
        void shouldCreateAndRegisterValidatorNode() {
            ValidatorNode node = service.createAndRegister("validator-1").await().indefinitely();

            assertNotNull(node);
            assertEquals("validator-1", node.getNodeId());
            assertTrue(service.hasNode("validator-1"));
        }

        @Test
        @DisplayName("Should throw exception for duplicate node ID")
        void shouldThrowExceptionForDuplicateNodeId() {
            service.createAndRegister("validator-dup").await().indefinitely();

            assertThrows(Exception.class, () ->
                service.createAndRegister("validator-dup").await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should start validator node")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartValidatorNode() {
            service.createAndRegister("validator-start").await().indefinitely();
            Boolean result = service.start("validator-start").await().indefinitely();

            assertTrue(result);
            assertTrue(service.getNode("validator-start").isRunning());
        }

        @Test
        @DisplayName("Should stop validator node")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldStopValidatorNode() {
            service.createAndRegister("validator-stop").await().indefinitely();
            service.start("validator-stop").await().indefinitely();
            Boolean result = service.stop("validator-stop").await().indefinitely();

            assertTrue(result);
            assertFalse(service.getNode("validator-stop").isRunning());
        }

        @Test
        @DisplayName("Should restart validator node")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldRestartValidatorNode() {
            service.createAndRegister("validator-restart").await().indefinitely();
            service.start("validator-restart").await().indefinitely();
            Boolean result = service.restart("validator-restart").await().indefinitely();

            assertTrue(result);
            assertTrue(service.getNode("validator-restart").isRunning());
        }

        @Test
        @DisplayName("Should remove validator node")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldRemoveValidatorNode() {
            service.createAndRegister("validator-remove").await().indefinitely();
            service.start("validator-remove").await().indefinitely();
            Boolean result = service.remove("validator-remove").await().indefinitely();

            assertTrue(result);
            assertFalse(service.hasNode("validator-remove"));
        }

        @Test
        @DisplayName("Should throw exception for non-existent node operations")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.start("non-existent").await().indefinitely()
            );
        }
    }

    // ============================================
    // LEADER ELECTION TESTS
    // ============================================

    @Nested
    @DisplayName("Leader Election Tests")
    class LeaderElectionTests {

        @BeforeEach
        void setupValidators() {
            createAndStartValidator("v1", new BigDecimal("1000"));
            createAndStartValidator("v2", new BigDecimal("2000"));
            createAndStartValidator("v3", new BigDecimal("1500"));
        }

        private void createAndStartValidator(String id, BigDecimal stake) {
            ValidatorNode node = service.createAndRegister(id).await().indefinitely();
            node.stake(stake);
            service.start(id).await().indefinitely();
        }

        @Test
        @DisplayName("Should elect leader with highest stake")
        void shouldElectLeaderWithHighestStake() {
            String leaderId = service.electLeader().await().indefinitely();

            assertEquals("v2", leaderId); // v2 has highest stake (2000)
            assertTrue(service.getNode("v2").isLeader());
        }

        @Test
        @DisplayName("Should get current leader")
        void shouldGetCurrentLeader() {
            service.electLeader().await().indefinitely();

            ValidatorNode leader = service.getLeader();
            assertNotNull(leader);
            assertEquals("v2", leader.getNodeId());
        }

        @Test
        @DisplayName("Should return null when no leader elected")
        void shouldReturnNullWhenNoLeaderElected() {
            ValidatorNode leader = service.getLeader();
            assertNull(leader);
        }

        @Test
        @DisplayName("Should step down current leader on new election")
        void shouldStepDownCurrentLeaderOnNewElection() {
            service.electLeader().await().indefinitely();
            assertTrue(service.getNode("v2").isLeader());

            // Change stakes
            service.getNode("v1").stake(new BigDecimal("5000"));
            service.electLeader().await().indefinitely();

            assertFalse(service.getNode("v2").isLeader());
            assertTrue(service.getNode("v1").isLeader());
        }
    }

    // ============================================
    // CONSENSUS TESTS
    // ============================================

    @Nested
    @DisplayName("Consensus Tests")
    class ConsensusTests {

        @BeforeEach
        void setupValidators() {
            for (int i = 0; i < 3; i++) {
                ValidatorNode node = service.createAndRegister("v" + i).await().indefinitely();
                node.stake(new BigDecimal("1000"));
                service.start("v" + i).await().indefinitely();
            }
            service.electLeader().await().indefinitely();
        }

        @Test
        @DisplayName("Should propose block through leader")
        void shouldProposeBlockThroughLeader() {
            List<String> transactions = Arrays.asList("tx-1", "tx-2", "tx-3");
            Boolean result = service.proposeBlock(transactions).await().indefinitely();

            assertTrue(result);
        }

        @Test
        @DisplayName("Should fail to propose block without leader")
        void shouldFailToProposeBlockWithoutLeader() {
            // Stop all validators to remove leader
            ValidatorNode leader = service.getLeader();
            if (leader != null) {
                leader.stepDown();
            }

            ValidatorNodeService newService = new ValidatorNodeService();
            newService.init();

            List<String> transactions = Arrays.asList("tx-1", "tx-2");
            Boolean result = newService.proposeBlock(transactions).await().indefinitely();

            assertFalse(result);
            newService.cleanup();
        }

        @Test
        @DisplayName("Should vote on block")
        void shouldVoteOnBlock() {
            Boolean quorumReached = service.voteOnBlock(1L, true).await().indefinitely();
            // With 3 validators, all voting yes should reach quorum
            assertTrue(quorumReached);
        }
    }

    // ============================================
    // STAKING TESTS
    // ============================================

    @Nested
    @DisplayName("Staking Tests")
    class StakingTests {

        @Test
        @DisplayName("Should stake tokens on validator")
        void shouldStakeTokensOnValidator() {
            service.createAndRegister("staking-test").await().indefinitely();

            Boolean result = service.stake("staking-test", new BigDecimal("5000")).await().indefinitely();

            assertTrue(result);
            assertEquals(new BigDecimal("5000"), service.getNode("staking-test").getStakedAmount());
        }

        @Test
        @DisplayName("Should unstake tokens from validator")
        void shouldUnstakeTokensFromValidator() {
            service.createAndRegister("unstaking-test").await().indefinitely();
            service.stake("unstaking-test", new BigDecimal("5000")).await().indefinitely();

            Boolean result = service.unstake("unstaking-test", new BigDecimal("2000")).await().indefinitely();

            assertTrue(result);
            assertEquals(new BigDecimal("3000"), service.getNode("unstaking-test").getStakedAmount());
        }

        @Test
        @DisplayName("Should get total staked amount")
        void shouldGetTotalStakedAmount() {
            service.createAndRegister("s1").await().indefinitely();
            service.createAndRegister("s2").await().indefinitely();

            service.stake("s1", new BigDecimal("1000")).await().indefinitely();
            service.stake("s2", new BigDecimal("2000")).await().indefinitely();

            BigDecimal total = service.getTotalStaked();
            assertEquals(new BigDecimal("3000"), total);
        }

        @Test
        @DisplayName("Should throw exception for staking on non-existent node")
        void shouldThrowExceptionForStakingOnNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.stake("non-existent", new BigDecimal("1000")).await().indefinitely()
            );
        }
    }

    // ============================================
    // PEER MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Peer Management Tests")
    class PeerManagementTests {

        @BeforeEach
        void setupValidators() {
            for (int i = 0; i < 3; i++) {
                service.createAndRegister("peer-v" + i).await().indefinitely();
                service.start("peer-v" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should connect all peers")
        void shouldConnectAllPeers() {
            Integer connections = service.connectAllPeers().await().indefinitely();

            // 3 validators, each connects to 2 others = 6 total connections
            assertEquals(6, connections);
        }

        @Test
        @DisplayName("Should get peers for validator")
        void shouldGetPeersForValidator() {
            service.connectAllPeers().await().indefinitely();

            Set<String> peers = service.getPeers("peer-v0");
            assertEquals(2, peers.size());
            assertTrue(peers.contains("peer-v1"));
            assertTrue(peers.contains("peer-v2"));
        }

        @Test
        @DisplayName("Should return empty set for non-existent validator")
        void shouldReturnEmptySetForNonExistentValidator() {
            Set<String> peers = service.getPeers("non-existent");
            assertTrue(peers.isEmpty());
        }
    }

    // ============================================
    // MEMPOOL TESTS
    // ============================================

    @Nested
    @DisplayName("Mempool Tests")
    class MempoolTests {

        @BeforeEach
        void setupValidators() {
            for (int i = 0; i < 3; i++) {
                service.createAndRegister("mempool-v" + i).await().indefinitely();
                service.start("mempool-v" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should broadcast transaction to all mempools")
        void shouldBroadcastTransactionToAllMempools() {
            Integer added = service.broadcastToMempool("tx-broadcast").await().indefinitely();

            assertEquals(3, added);
        }

        @Test
        @DisplayName("Should get total mempool size")
        void shouldGetTotalMempoolSize() {
            service.broadcastToMempool("tx-1").await().indefinitely();
            service.broadcastToMempool("tx-2").await().indefinitely();

            int totalSize = service.getTotalMempoolSize();
            assertEquals(6, totalSize); // 2 transactions * 3 validators
        }
    }

    // ============================================
    // HEALTH & METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Health & Metrics Tests")
    class HealthMetricsTests {

        @BeforeEach
        void setupValidators() {
            for (int i = 0; i < 2; i++) {
                ValidatorNode node = service.createAndRegister("health-v" + i).await().indefinitely();
                node.stake(new BigDecimal("1000"));
                // Add peers for health
                node.connectPeer("peer-1");
                node.connectPeer("peer-2");
                node.connectPeer("peer-3");
                service.start("health-v" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should get node health")
        void shouldGetNodeHealth() {
            NodeHealth health = service.healthCheck("health-v0").await().indefinitely();

            assertNotNull(health);
            assertTrue(health.isHealthy());
        }

        @Test
        @DisplayName("Should get node metrics")
        void shouldGetNodeMetrics() {
            NodeMetrics metrics = service.getMetrics("health-v0").await().indefinitely();

            assertNotNull(metrics);
            assertNotNull(metrics.getCustomMetrics());
        }

        @Test
        @DisplayName("Should get all nodes health")
        void shouldGetAllNodesHealth() {
            Map<String, NodeHealth> healthMap = service.healthCheckAll().await().indefinitely();

            assertEquals(2, healthMap.size());
            healthMap.values().forEach(h -> assertTrue(h.isHealthy()));
        }

        @Test
        @DisplayName("Should get all nodes metrics")
        void shouldGetAllNodesMetrics() {
            Map<String, NodeMetrics> metricsMap = service.getMetricsAll().await().indefinitely();

            assertEquals(2, metricsMap.size());
        }
    }

    // ============================================
    // NETWORK STATISTICS TESTS
    // ============================================

    @Nested
    @DisplayName("Network Statistics Tests")
    class NetworkStatisticsTests {

        @BeforeEach
        void setupValidators() {
            for (int i = 0; i < 3; i++) {
                ValidatorNode node = service.createAndRegister("stats-v" + i).await().indefinitely();
                node.stake(new BigDecimal("1000"));
                // Add peers for health
                node.connectPeer("peer-1");
                node.connectPeer("peer-2");
                node.connectPeer("peer-3");
                service.start("stats-v" + i).await().indefinitely();
            }
            service.connectAllPeers().await().indefinitely();
            service.electLeader().await().indefinitely();
        }

        @Test
        @DisplayName("Should get network statistics")
        void shouldGetNetworkStatistics() {
            Map<String, Object> stats = service.getNetworkStats();

            assertNotNull(stats);
            assertEquals(3, stats.get("totalValidators"));
            assertEquals(3L, stats.get("runningValidators"));
            assertTrue((Long) stats.get("healthyValidators") >= 0);
            assertNotNull(stats.get("totalStaked"));
            assertNotNull(stats.get("currentLeader"));
        }

        @Test
        @DisplayName("Should track validated transactions in stats")
        void shouldTrackValidatedTransactionsInStats() {
            // Validate some transactions
            service.getNode("stats-v0").validateBlock(1L, Arrays.asList("tx-1", "tx-2"));

            Map<String, Object> stats = service.getNetworkStats();
            long totalValidated = (Long) stats.get("totalValidatedTransactions");
            assertTrue(totalValidated >= 2);
        }
    }

    // ============================================
    // ACCESSOR TESTS
    // ============================================

    @Nested
    @DisplayName("Accessor Tests")
    class AccessorTests {

        @Test
        @DisplayName("Should get node by ID")
        void shouldGetNodeById() {
            service.createAndRegister("accessor-test").await().indefinitely();

            ValidatorNode node = service.getNode("accessor-test");
            assertNotNull(node);
            assertEquals("accessor-test", node.getNodeId());
        }

        @Test
        @DisplayName("Should return null for non-existent node")
        void shouldReturnNullForNonExistentNode() {
            ValidatorNode node = service.getNode("non-existent");
            assertNull(node);
        }

        @Test
        @DisplayName("Should get all nodes")
        void shouldGetAllNodes() {
            service.createAndRegister("all-1").await().indefinitely();
            service.createAndRegister("all-2").await().indefinitely();

            Map<String, ValidatorNode> nodes = service.getAllNodes();
            assertEquals(2, nodes.size());
        }

        @Test
        @DisplayName("Should get node count")
        void shouldGetNodeCount() {
            service.createAndRegister("count-1").await().indefinitely();
            service.createAndRegister("count-2").await().indefinitely();
            service.createAndRegister("count-3").await().indefinitely();

            assertEquals(3, service.getNodeCount());
        }

        @Test
        @DisplayName("Should check if node exists")
        void shouldCheckIfNodeExists() {
            service.createAndRegister("exists-test").await().indefinitely();

            assertTrue(service.hasNode("exists-test"));
            assertFalse(service.hasNode("does-not-exist"));
        }

        @Test
        @DisplayName("Should get running node count")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldGetRunningNodeCount() {
            service.createAndRegister("running-1").await().indefinitely();
            service.createAndRegister("running-2").await().indefinitely();
            service.start("running-1").await().indefinitely();

            assertEquals(1, service.getRunningNodeCount());
        }

        @Test
        @DisplayName("Should get healthy node count")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldGetHealthyNodeCount() {
            ValidatorNode node = service.createAndRegister("healthy-1").await().indefinitely();
            node.stake(new BigDecimal("1000"));
            node.connectPeer("peer-1");
            node.connectPeer("peer-2");
            node.connectPeer("peer-3");
            service.start("healthy-1").await().indefinitely();

            assertEquals(1, service.getHealthyNodeCount());
        }
    }
}
