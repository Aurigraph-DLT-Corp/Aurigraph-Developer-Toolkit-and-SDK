package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.aurigraph.v11.nodes.BusinessNode.TransactionRequest;
import io.aurigraph.v11.nodes.BusinessNode.TransactionResult;
import io.aurigraph.v11.nodes.BusinessNode.WorkflowState;
import io.aurigraph.v11.nodes.BusinessNode.AuditEntry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for BusinessNodeService
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node lifecycle management
 * - Transaction routing
 * - Contract management
 * - Workflow orchestration
 * - Audit logging
 * - Network statistics
 */
@DisplayName("BusinessNodeService Tests")
class BusinessNodeServiceTest {

    private BusinessNodeService service;

    @BeforeEach
    void setUp() {
        service = new BusinessNodeService();
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
        @DisplayName("Should create and register business node")
        void shouldCreateAndRegisterBusinessNode() {
            BusinessNode node = service.createAndRegister("business-1").await().indefinitely();

            assertNotNull(node);
            assertEquals("business-1", node.getNodeId());
            assertTrue(service.hasNode("business-1"));
        }

        @Test
        @DisplayName("Should throw exception for duplicate node ID")
        void shouldThrowExceptionForDuplicateNodeId() {
            service.createAndRegister("business-dup").await().indefinitely();

            assertThrows(Exception.class, () ->
                service.createAndRegister("business-dup").await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should start business node")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartBusinessNode() {
            service.createAndRegister("business-start").await().indefinitely();
            Boolean result = service.start("business-start").await().indefinitely();

            assertTrue(result);
            assertTrue(service.getNode("business-start").isRunning());
        }

        @Test
        @DisplayName("Should stop business node")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldStopBusinessNode() {
            service.createAndRegister("business-stop").await().indefinitely();
            service.start("business-stop").await().indefinitely();
            Boolean result = service.stop("business-stop").await().indefinitely();

            assertTrue(result);
            assertFalse(service.getNode("business-stop").isRunning());
        }

        @Test
        @DisplayName("Should restart business node")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldRestartBusinessNode() {
            service.createAndRegister("business-restart").await().indefinitely();
            service.start("business-restart").await().indefinitely();
            Boolean result = service.restart("business-restart").await().indefinitely();

            assertTrue(result);
            assertTrue(service.getNode("business-restart").isRunning());
        }

        @Test
        @DisplayName("Should remove business node")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldRemoveBusinessNode() {
            service.createAndRegister("business-remove").await().indefinitely();
            service.start("business-remove").await().indefinitely();
            Boolean result = service.remove("business-remove").await().indefinitely();

            assertTrue(result);
            assertFalse(service.hasNode("business-remove"));
        }
    }

    // ============================================
    // TRANSACTION ROUTING TESTS
    // ============================================

    @Nested
    @DisplayName("Transaction Routing Tests")
    class TransactionRoutingTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 3; i++) {
                service.createAndRegister("tx-node-" + i).await().indefinitely();
                service.start("tx-node-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should submit transaction with automatic routing")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSubmitTransactionWithAutomaticRouting() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "tx-routed-1",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = service.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertTrue(result.isSuccess());
        }

        @Test
        @DisplayName("Should submit transaction to specific node")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSubmitTransactionToSpecificNode() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "tx-specific-1",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = service.submitTransaction("tx-node-0", request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertTrue(result.isSuccess());
        }

        @Test
        @DisplayName("Should fail for non-existent node")
        void shouldFailForNonExistentNode() {
            TransactionRequest request = new TransactionRequest(
                "tx-fail",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = service.submitTransaction("non-existent", request);
            assertThrows(Exception.class, () -> future.get(1, TimeUnit.SECONDS));
        }

        @Test
        @DisplayName("Should set preferred node for routing")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSetPreferredNodeForRouting() throws Exception {
            service.setPreferredNode("tx-node-1");

            TransactionRequest request = new TransactionRequest(
                "tx-preferred",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            // Transaction should be routed to preferred node
            CompletableFuture<TransactionResult> future = service.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertTrue(result.isSuccess());
        }

        @Test
        @DisplayName("Should route to contract node")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldRouteToContractNode() throws Exception {
            // Register contract on specific node
            service.registerContract("tx-node-0", "contract-routing", "code", new HashMap<>())
                .await().indefinitely();

            TransactionRequest request = new TransactionRequest(
                "tx-contract-route",
                "contract-routing",
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = service.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertTrue(result.isSuccess());
        }
    }

    // ============================================
    // CONTRACT MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Contract Management Tests")
    class ContractManagementTests {

        @BeforeEach
        void setupNodes() {
            service.createAndRegister("contract-node").await().indefinitely();
            service.start("contract-node").await().indefinitely();
        }

        @Test
        @DisplayName("Should register contract on node")
        void shouldRegisterContractOnNode() {
            Map<String, Object> initialState = new HashMap<>();
            initialState.put("owner", "user1");

            Boolean result = service.registerContract(
                "contract-node",
                "contract-1",
                "pragma solidity...",
                initialState
            ).await().indefinitely();

            assertTrue(result);
        }

        @Test
        @DisplayName("Should throw exception for non-existent node")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.registerContract("non-existent", "contract", "code", new HashMap<>())
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should execute contract")
        void shouldExecuteContract() {
            service.registerContract("contract-node", "exec-contract", "code", new HashMap<>())
                .await().indefinitely();

            Map<String, Object> params = new HashMap<>();
            params.put("value", 100);

            Long gasUsed = service.executeContract("exec-contract", params).await().indefinitely();
            assertTrue(gasUsed > 0);
        }

        @Test
        @DisplayName("Should throw exception for unregistered contract")
        void shouldThrowExceptionForUnregisteredContract() {
            assertThrows(Exception.class, () ->
                service.executeContract("unregistered", new HashMap<>()).await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get contract state")
        void shouldGetContractState() {
            Map<String, Object> initialState = new HashMap<>();
            initialState.put("key", "value");

            service.registerContract("contract-node", "state-contract", "code", initialState)
                .await().indefinitely();

            Map<String, Object> state = service.getContractState("state-contract");
            assertNotNull(state);
            assertEquals("value", state.get("key"));
        }

        @Test
        @DisplayName("Should return null for non-existent contract")
        void shouldReturnNullForNonExistentContract() {
            Map<String, Object> state = service.getContractState("non-existent");
            assertNull(state);
        }

        @Test
        @DisplayName("Should get all contracts")
        void shouldGetAllContracts() {
            service.registerContract("contract-node", "c1", "code", new HashMap<>())
                .await().indefinitely();
            service.registerContract("contract-node", "c2", "code", new HashMap<>())
                .await().indefinitely();

            Map<String, String> contracts = service.getAllContracts();
            assertEquals(2, contracts.size());
            assertTrue(contracts.containsKey("c1"));
            assertTrue(contracts.containsKey("c2"));
        }
    }

    // ============================================
    // WORKFLOW MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Workflow Management Tests")
    class WorkflowManagementTests {

        @BeforeEach
        void setupNodes() {
            service.createAndRegister("workflow-node").await().indefinitely();
            service.start("workflow-node").await().indefinitely();
        }

        @Test
        @DisplayName("Should start workflow with automatic node selection")
        void shouldStartWorkflowWithAutomaticNodeSelection() {
            Map<String, Object> params = new HashMap<>();
            params.put("type", "approval");

            String workflowId = service.startWorkflow("approval-workflow", params).await().indefinitely();
            assertNotNull(workflowId);
            assertFalse(workflowId.isEmpty());
        }

        @Test
        @DisplayName("Should start workflow on specific node")
        void shouldStartWorkflowOnSpecificNode() {
            Map<String, Object> params = new HashMap<>();
            params.put("initiator", "user1");

            String workflowId = service.startWorkflow("workflow-node", "kyc-workflow", params)
                .await().indefinitely();

            assertNotNull(workflowId);
        }

        @Test
        @DisplayName("Should throw exception for non-existent node")
        void shouldThrowExceptionForNonExistentNode() {
            assertThrows(Exception.class, () ->
                service.startWorkflow("non-existent", "workflow", new HashMap<>())
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should complete workflow step")
        void shouldCompleteWorkflowStep() {
            String workflowId = service.startWorkflow("workflow-node", "step-workflow", new HashMap<>())
                .await().indefinitely();

            Map<String, Object> result = new HashMap<>();
            result.put("approved", true);

            Boolean completed = service.completeWorkflowStep(
                "workflow-node",
                workflowId,
                "step-1",
                result
            ).await().indefinitely();

            assertTrue(completed);
        }

        @Test
        @DisplayName("Should get workflow status")
        void shouldGetWorkflowStatus() {
            String workflowId = service.startWorkflow("workflow-node", "status-workflow", new HashMap<>())
                .await().indefinitely();

            WorkflowState state = service.getWorkflowStatus("workflow-node", workflowId);
            assertNotNull(state);
            assertEquals(workflowId, state.workflowId);
            assertEquals("status-workflow", state.workflowType);
        }

        @Test
        @DisplayName("Should return null for non-existent workflow")
        void shouldReturnNullForNonExistentWorkflow() {
            WorkflowState state = service.getWorkflowStatus("workflow-node", "non-existent");
            assertNull(state);
        }
    }

    // ============================================
    // AUDIT LOGGING TESTS
    // ============================================

    @Nested
    @DisplayName("Audit Logging Tests")
    class AuditLoggingTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 2; i++) {
                service.createAndRegister("audit-node-" + i).await().indefinitely();
                service.start("audit-node-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should get consolidated audit log")
        void shouldGetConsolidatedAuditLog() {
            // Generate some audit entries
            service.registerContract("audit-node-0", "audit-c1", "code", new HashMap<>())
                .await().indefinitely();
            service.registerContract("audit-node-1", "audit-c2", "code", new HashMap<>())
                .await().indefinitely();

            List<AuditEntry> entries = service.getConsolidatedAuditLog(10);
            assertNotNull(entries);
            assertFalse(entries.isEmpty());
        }

        @Test
        @DisplayName("Should limit audit log entries")
        void shouldLimitAuditLogEntries() {
            // Generate many entries
            for (int i = 0; i < 20; i++) {
                service.registerContract("audit-node-0", "limit-c-" + i, "code", new HashMap<>())
                    .await().indefinitely();
            }

            List<AuditEntry> entries = service.getConsolidatedAuditLog(5);
            assertEquals(5, entries.size());
        }

        @Test
        @DisplayName("Should get node-specific audit log")
        void shouldGetNodeSpecificAuditLog() {
            service.registerContract("audit-node-0", "specific-c1", "code", new HashMap<>())
                .await().indefinitely();

            List<AuditEntry> entries = service.getNodeAuditLog("audit-node-0", 10);
            assertNotNull(entries);
            assertFalse(entries.isEmpty());
        }

        @Test
        @DisplayName("Should return empty list for non-existent node")
        void shouldReturnEmptyListForNonExistentNode() {
            List<AuditEntry> entries = service.getNodeAuditLog("non-existent", 10);
            assertTrue(entries.isEmpty());
        }
    }

    // ============================================
    // HEALTH & METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Health & Metrics Tests")
    class HealthMetricsTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 2; i++) {
                service.createAndRegister("health-b-" + i).await().indefinitely();
                service.start("health-b-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should get node health")
        void shouldGetNodeHealth() {
            NodeHealth health = service.healthCheck("health-b-0").await().indefinitely();

            assertNotNull(health);
            assertTrue(health.isHealthy());
        }

        @Test
        @DisplayName("Should get node metrics")
        void shouldGetNodeMetrics() {
            NodeMetrics metrics = service.getMetrics("health-b-0").await().indefinitely();

            assertNotNull(metrics);
            assertNotNull(metrics.getCustomMetrics());
        }

        @Test
        @DisplayName("Should get all nodes health")
        void shouldGetAllNodesHealth() {
            Map<String, NodeHealth> healthMap = service.healthCheckAll().await().indefinitely();

            assertEquals(2, healthMap.size());
        }

        @Test
        @DisplayName("Should get total TPS")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetTotalTps() throws InterruptedException {
            Thread.sleep(100); // Give nodes some uptime

            double totalTps = service.getTotalTps();
            assertTrue(totalTps >= 0);
        }
    }

    // ============================================
    // NETWORK STATISTICS TESTS
    // ============================================

    @Nested
    @DisplayName("Network Statistics Tests")
    class NetworkStatisticsTests {

        @BeforeEach
        void setupNodes() {
            for (int i = 0; i < 3; i++) {
                service.createAndRegister("stats-b-" + i).await().indefinitely();
                service.start("stats-b-" + i).await().indefinitely();
            }
        }

        @Test
        @DisplayName("Should get network statistics")
        void shouldGetNetworkStatistics() {
            Map<String, Object> stats = service.getNetworkStats();

            assertNotNull(stats);
            assertEquals(3, stats.get("totalNodes"));
            assertEquals(3L, stats.get("runningNodes"));
            assertTrue((Long) stats.get("healthyNodes") >= 0);
            assertNotNull(stats.get("totalExecutedTransactions"));
            assertNotNull(stats.get("networkFailureRate"));
        }

        @Test
        @DisplayName("Should track contracts in stats")
        void shouldTrackContractsInStats() {
            service.registerContract("stats-b-0", "stats-c1", "code", new HashMap<>())
                .await().indefinitely();
            service.registerContract("stats-b-1", "stats-c2", "code", new HashMap<>())
                .await().indefinitely();

            Map<String, Object> stats = service.getNetworkStats();
            int contractMappings = (Integer) stats.get("contractNodeMappings");
            assertEquals(2, contractMappings);
        }

        @Test
        @DisplayName("Should track average TPS")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldTrackAverageTps() throws InterruptedException {
            Thread.sleep(100);

            Map<String, Object> stats = service.getNetworkStats();
            double avgTps = (Double) stats.get("averageTps");
            assertTrue(avgTps >= 0);
        }

        @Test
        @DisplayName("Should track preferred node")
        void shouldTrackPreferredNode() {
            service.setPreferredNode("stats-b-1");

            Map<String, Object> stats = service.getNetworkStats();
            assertEquals("stats-b-1", stats.get("preferredNode"));
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
            service.createAndRegister("accessor-b-test").await().indefinitely();

            BusinessNode node = service.getNode("accessor-b-test");
            assertNotNull(node);
            assertEquals("accessor-b-test", node.getNodeId());
        }

        @Test
        @DisplayName("Should return null for non-existent node")
        void shouldReturnNullForNonExistentNode() {
            BusinessNode node = service.getNode("non-existent");
            assertNull(node);
        }

        @Test
        @DisplayName("Should get all nodes")
        void shouldGetAllNodes() {
            service.createAndRegister("all-b-1").await().indefinitely();
            service.createAndRegister("all-b-2").await().indefinitely();

            Map<String, BusinessNode> nodes = service.getAllNodes();
            assertEquals(2, nodes.size());
        }

        @Test
        @DisplayName("Should get node count")
        void shouldGetNodeCount() {
            service.createAndRegister("count-b-1").await().indefinitely();
            service.createAndRegister("count-b-2").await().indefinitely();
            service.createAndRegister("count-b-3").await().indefinitely();

            assertEquals(3, service.getNodeCount());
        }

        @Test
        @DisplayName("Should check if node exists")
        void shouldCheckIfNodeExists() {
            service.createAndRegister("exists-b-test").await().indefinitely();

            assertTrue(service.hasNode("exists-b-test"));
            assertFalse(service.hasNode("does-not-exist"));
        }

        @Test
        @DisplayName("Should get running node count")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldGetRunningNodeCount() {
            service.createAndRegister("running-b-1").await().indefinitely();
            service.createAndRegister("running-b-2").await().indefinitely();
            service.start("running-b-1").await().indefinitely();

            assertEquals(1, service.getRunningNodeCount());
        }

        @Test
        @DisplayName("Should get healthy node count")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldGetHealthyNodeCount() {
            service.createAndRegister("healthy-b-1").await().indefinitely();
            service.start("healthy-b-1").await().indefinitely();

            assertEquals(1, service.getHealthyNodeCount());
        }
    }
}
