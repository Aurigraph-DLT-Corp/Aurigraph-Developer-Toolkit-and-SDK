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
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for BusinessNode
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node lifecycle (start/stop/restart)
 * - Transaction processing
 * - Smart contract management
 * - Workflow orchestration
 * - Audit logging
 * - Health checks and metrics
 */
@DisplayName("BusinessNode Tests")
class BusinessNodeTest {

    private BusinessNode business;
    private static final String NODE_ID = "business-test-1";

    @BeforeEach
    void setUp() {
        business = new BusinessNode(NODE_ID);
    }

    @AfterEach
    void tearDown() {
        if (business != null && business.isRunning()) {
            business.stop();
        }
    }

    // ============================================
    // NODE LIFECYCLE TESTS
    // ============================================

    @Nested
    @DisplayName("Lifecycle Tests")
    class LifecycleTests {

        @Test
        @DisplayName("Should create business node with correct ID")
        void shouldCreateNodeWithCorrectId() {
            assertEquals(NODE_ID, business.getNodeId());
        }

        @Test
        @DisplayName("Should start business node successfully")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartNodeSuccessfully() {
            assertFalse(business.isRunning());
            business.start();
            assertTrue(business.isRunning());
        }

        @Test
        @DisplayName("Should stop business node successfully")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldStopNodeSuccessfully() {
            business.start();
            assertTrue(business.isRunning());
            business.stop();
            assertFalse(business.isRunning());
        }

        @Test
        @DisplayName("Should restart business node successfully")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldRestartNodeSuccessfully() {
            business.start();
            assertTrue(business.isRunning());
            business.restart();
            assertTrue(business.isRunning());
        }

        @Test
        @DisplayName("Should handle multiple start calls gracefully")
        void shouldHandleMultipleStartCalls() {
            business.start();
            business.start(); // Second call should be safe
            assertTrue(business.isRunning());
        }
    }

    // ============================================
    // TRANSACTION PROCESSING TESTS
    // ============================================

    @Nested
    @DisplayName("Transaction Processing Tests")
    class TransactionProcessingTests {

        @BeforeEach
        void startNode() {
            business.start();
        }

        @Test
        @DisplayName("Should submit transaction successfully")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSubmitTransactionSuccessfully() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "tx-001",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = business.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertTrue(result.isSuccess());
            assertEquals("tx-001", result.getTransactionId());
        }

        @Test
        @DisplayName("Should reject transaction with null ID")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldRejectTransactionWithNullId() throws Exception {
            TransactionRequest request = new TransactionRequest(
                null,
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = business.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertFalse(result.isSuccess());
            assertEquals("Validation failed", result.getMessage());
        }

        @Test
        @DisplayName("Should reject transaction with empty ID")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldRejectTransactionWithEmptyId() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            CompletableFuture<TransactionResult> future = business.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertFalse(result.isSuccess());
        }

        @Test
        @DisplayName("Should reject transaction with excessive gas limit")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldRejectTransactionWithExcessiveGasLimit() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "tx-002",
                null,
                new HashMap<>(),
                new HashMap<>(),
                100_000_000L // Exceeds MAX_GAS_LIMIT
            );

            CompletableFuture<TransactionResult> future = business.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertFalse(result.isSuccess());
        }

        @Test
        @DisplayName("Should process transaction with state updates")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldProcessTransactionWithStateUpdates() throws Exception {
            Map<String, Object> stateUpdates = new HashMap<>();
            stateUpdates.put("balance", 1000);
            stateUpdates.put("nonce", 1);

            TransactionRequest request = new TransactionRequest(
                "tx-003",
                null,
                new HashMap<>(),
                stateUpdates,
                5000L
            );

            CompletableFuture<TransactionResult> future = business.submitTransaction(request);
            TransactionResult result = future.get(3, TimeUnit.SECONDS);

            assertTrue(result.isSuccess());
        }

        @Test
        @DisplayName("Should process multiple concurrent transactions")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldProcessMultipleConcurrentTransactions() throws Exception {
            int numTransactions = 10;
            @SuppressWarnings("unchecked")
            CompletableFuture<TransactionResult>[] futures = new CompletableFuture[numTransactions];

            for (int i = 0; i < numTransactions; i++) {
                TransactionRequest request = new TransactionRequest(
                    "tx-concurrent-" + i,
                    null,
                    new HashMap<>(),
                    new HashMap<>(),
                    1000L
                );
                futures[i] = business.submitTransaction(request);
            }

            CompletableFuture.allOf(futures).get(8, TimeUnit.SECONDS);

            int successCount = 0;
            for (CompletableFuture<TransactionResult> future : futures) {
                if (future.get().isSuccess()) {
                    successCount++;
                }
            }

            assertEquals(numTransactions, successCount);
        }
    }

    // ============================================
    // CONTRACT MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Contract Management Tests")
    class ContractManagementTests {

        @BeforeEach
        void startNode() {
            business.start();
        }

        @Test
        @DisplayName("Should register contract")
        void shouldRegisterContract() {
            Map<String, Object> initialState = new HashMap<>();
            initialState.put("owner", "0x1234");
            initialState.put("totalSupply", 1000000);

            assertDoesNotThrow(() ->
                business.registerContract("contract-001", "pragma solidity...", initialState)
            );
        }

        @Test
        @DisplayName("Should execute registered contract")
        void shouldExecuteRegisteredContract() {
            Map<String, Object> initialState = new HashMap<>();
            initialState.put("balance", 1000);

            business.registerContract("contract-002", "code", initialState);

            Map<String, Object> params = new HashMap<>();
            params.put("amount", 100);

            long gasUsed = business.executeContract("contract-002", params);
            assertTrue(gasUsed > 0);
        }

        @Test
        @DisplayName("Should throw exception for non-existent contract")
        void shouldThrowExceptionForNonExistentContract() {
            assertThrows(IllegalArgumentException.class, () ->
                business.executeContract("non-existent", new HashMap<>())
            );
        }

        @Test
        @DisplayName("Should get contract state")
        void shouldGetContractState() {
            Map<String, Object> initialState = new HashMap<>();
            initialState.put("key1", "value1");
            initialState.put("key2", 42);

            business.registerContract("contract-003", "code", initialState);

            Map<String, Object> state = business.getContractState("contract-003");
            assertNotNull(state);
            assertEquals("value1", state.get("key1"));
            assertEquals(42, state.get("key2"));
        }

        @Test
        @DisplayName("Should return null for non-existent contract state")
        void shouldReturnNullForNonExistentContractState() {
            Map<String, Object> state = business.getContractState("non-existent");
            assertNull(state);
        }

        @Test
        @DisplayName("Should update contract state on execution")
        void shouldUpdateContractStateOnExecution() {
            Map<String, Object> initialState = new HashMap<>();
            initialState.put("counter", 0);

            business.registerContract("contract-004", "code", initialState);

            Map<String, Object> params = new HashMap<>();
            params.put("counter", 1);

            business.executeContract("contract-004", params);

            Map<String, Object> state = business.getContractState("contract-004");
            assertEquals(1, state.get("counter"));
        }

        @Test
        @DisplayName("Should calculate gas based on params size")
        void shouldCalculateGasBasedOnParamsSize() {
            business.registerContract("contract-005", "code", new HashMap<>());

            Map<String, Object> smallParams = new HashMap<>();
            smallParams.put("a", 1);

            Map<String, Object> largeParams = new HashMap<>();
            for (int i = 0; i < 10; i++) {
                largeParams.put("key" + i, "value" + i);
            }

            long smallGas = business.executeContract("contract-005", smallParams);
            long largeGas = business.executeContract("contract-005", largeParams);

            assertTrue(largeGas > smallGas);
        }
    }

    // ============================================
    // WORKFLOW TESTS
    // ============================================

    @Nested
    @DisplayName("Workflow Tests")
    class WorkflowTests {

        @BeforeEach
        void startNode() {
            business.start();
        }

        @Test
        @DisplayName("Should start workflow")
        void shouldStartWorkflow() {
            Map<String, Object> params = new HashMap<>();
            params.put("initiator", "user1");

            String workflowId = business.startWorkflow("approval", params);

            assertNotNull(workflowId);
            assertFalse(workflowId.isEmpty());
        }

        @Test
        @DisplayName("Should get workflow status")
        void shouldGetWorkflowStatus() {
            Map<String, Object> params = new HashMap<>();
            params.put("type", "kyc");

            String workflowId = business.startWorkflow("verification", params);
            WorkflowState state = business.getWorkflowStatus(workflowId);

            assertNotNull(state);
            assertEquals(workflowId, state.workflowId);
            assertEquals("verification", state.workflowType);
            assertNotNull(state.startedAt);
        }

        @Test
        @DisplayName("Should complete workflow step")
        void shouldCompleteWorkflowStep() {
            String workflowId = business.startWorkflow("multistep", new HashMap<>());

            Map<String, Object> result = new HashMap<>();
            result.put("approved", true);

            business.completeWorkflowStep(workflowId, "step1", result);

            WorkflowState state = business.getWorkflowStatus(workflowId);
            assertTrue(state.completedSteps.contains("step1"));
            assertEquals(true, state.results.get("approved"));
        }

        @Test
        @DisplayName("Should return null for non-existent workflow")
        void shouldReturnNullForNonExistentWorkflow() {
            WorkflowState state = business.getWorkflowStatus("non-existent");
            assertNull(state);
        }

        @Test
        @DisplayName("Should handle null params for workflow step")
        void shouldHandleNullParamsForWorkflowStep() {
            String workflowId = business.startWorkflow("test", new HashMap<>());
            assertDoesNotThrow(() ->
                business.completeWorkflowStep(workflowId, "step1", null)
            );
        }
    }

    // ============================================
    // AUDIT LOG TESTS
    // ============================================

    @Nested
    @DisplayName("Audit Log Tests")
    class AuditLogTests {

        @BeforeEach
        void startNode() {
            business.start();
        }

        @Test
        @DisplayName("Should record audit entries for transactions")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldRecordAuditEntriesForTransactions() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "tx-audit-1",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            business.submitTransaction(request).get(3, TimeUnit.SECONDS);

            List<AuditEntry> entries = business.getAuditLog(10);
            assertFalse(entries.isEmpty());
        }

        @Test
        @DisplayName("Should record audit entries for contracts")
        void shouldRecordAuditEntriesForContracts() {
            business.registerContract("contract-audit", "code", new HashMap<>());

            List<AuditEntry> entries = business.getAuditLog(10);
            boolean hasContractEntry = entries.stream()
                .anyMatch(e -> e.action.equals("CONTRACT_REGISTERED"));
            assertTrue(hasContractEntry);
        }

        @Test
        @DisplayName("Should record audit entries for workflows")
        void shouldRecordAuditEntriesForWorkflows() {
            business.startWorkflow("audit-test", new HashMap<>());

            List<AuditEntry> entries = business.getAuditLog(10);
            boolean hasWorkflowEntry = entries.stream()
                .anyMatch(e -> e.action.equals("WORKFLOW_STARTED"));
            assertTrue(hasWorkflowEntry);
        }

        @Test
        @DisplayName("Should limit audit log entries")
        void shouldLimitAuditLogEntries() {
            for (int i = 0; i < 20; i++) {
                business.registerContract("contract-" + i, "code", new HashMap<>());
            }

            List<AuditEntry> entries = business.getAuditLog(5);
            assertEquals(5, entries.size());
        }

        @Test
        @DisplayName("Should include timestamp in audit entries")
        void shouldIncludeTimestampInAuditEntries() {
            business.registerContract("contract-time", "code", new HashMap<>());

            List<AuditEntry> entries = business.getAuditLog(1);
            assertFalse(entries.isEmpty());
            assertNotNull(entries.get(0).timestamp);
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
            business.start();

            NodeHealth health = business.healthCheck().await().indefinitely();
            assertNotNull(health);
            assertTrue(health.isHealthy());
        }

        @Test
        @DisplayName("Should include components in health check")
        void shouldIncludeComponentsInHealthCheck() {
            business.start();

            NodeHealth health = business.healthCheck().await().indefinitely();
            assertNotNull(health.getComponentChecks());
            assertTrue(health.getComponentChecks().containsKey("transactionQueue"));
            assertTrue(health.getComponentChecks().containsKey("contracts"));
            assertTrue(health.getComponentChecks().containsKey("activeExecutions"));
        }

        @Test
        @DisplayName("Should include uptime in health check")
        void shouldIncludeUptimeInHealthCheck() throws InterruptedException {
            business.start();
            Thread.sleep(100);

            NodeHealth health = business.healthCheck().await().indefinitely();
            assertTrue(health.getUptimeSeconds() >= 0);
        }
    }

    // ============================================
    // METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Metrics Tests")
    class MetricsTests {

        @BeforeEach
        void startNode() {
            business.start();
        }

        @Test
        @DisplayName("Should return valid metrics")
        void shouldReturnValidMetrics() {
            NodeMetrics metrics = business.getMetrics().await().indefinitely();
            assertNotNull(metrics);
        }

        @Test
        @DisplayName("Should include custom metrics")
        void shouldIncludeCustomMetrics() {
            NodeMetrics metrics = business.getMetrics().await().indefinitely();
            assertNotNull(metrics.getCustomMetrics());
            assertTrue(metrics.getCustomMetrics().containsKey("executedTransactions"));
            assertTrue(metrics.getCustomMetrics().containsKey("failedTransactions"));
            assertTrue(metrics.getCustomMetrics().containsKey("pendingTransactions"));
            assertTrue(metrics.getCustomMetrics().containsKey("registeredContracts"));
        }

        @Test
        @DisplayName("Should track executed transactions in metrics")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldTrackExecutedTransactionsInMetrics() throws Exception {
            TransactionRequest request = new TransactionRequest(
                "tx-metrics-1",
                null,
                new HashMap<>(),
                new HashMap<>(),
                1000L
            );

            business.submitTransaction(request).get(3, TimeUnit.SECONDS);

            // Give time for metrics to update
            Thread.sleep(100);

            NodeMetrics metrics = business.getMetrics().await().indefinitely();
            long executed = ((Number) metrics.getCustomMetrics().get("executedTransactions")).longValue();
            assertTrue(executed >= 1);
        }

        @Test
        @DisplayName("Should track registered contracts in metrics")
        void shouldTrackRegisteredContractsInMetrics() {
            business.registerContract("c1", "code", new HashMap<>());
            business.registerContract("c2", "code", new HashMap<>());

            NodeMetrics metrics = business.getMetrics().await().indefinitely();
            int contracts = ((Number) metrics.getCustomMetrics().get("registeredContracts")).intValue();
            assertEquals(2, contracts);
        }

        @Test
        @DisplayName("Should calculate TPS")
        void shouldCalculateTps() throws InterruptedException {
            business.start();
            Thread.sleep(100); // Give some uptime

            NodeMetrics metrics = business.getMetrics().await().indefinitely();
            assertTrue(metrics.getRequestsPerSecond() >= 0);
        }
    }

    // ============================================
    // TRANSACTION REQUEST/RESULT TESTS
    // ============================================

    @Nested
    @DisplayName("TransactionRequest/Result Tests")
    class TransactionRequestResultTests {

        @Test
        @DisplayName("TransactionRequest should store all fields")
        void transactionRequestShouldStoreAllFields() {
            Map<String, Object> payload = Map.of("key", "value");
            Map<String, Object> stateUpdates = Map.of("state", "updated");

            TransactionRequest request = new TransactionRequest(
                "tx-id",
                "contract-id",
                payload,
                stateUpdates,
                5000L
            );

            assertEquals("tx-id", request.getTransactionId());
            assertEquals("contract-id", request.getContractId());
            assertEquals(payload, request.getPayload());
            assertEquals(stateUpdates, request.getStateUpdates());
            assertEquals(5000L, request.getGasLimit());
        }

        @Test
        @DisplayName("TransactionResult should contain success info")
        void transactionResultShouldContainSuccessInfo() {
            TransactionResult result = new TransactionResult(
                "tx-id",
                true,
                "Success",
                21000L
            );

            assertEquals("tx-id", result.getTransactionId());
            assertTrue(result.isSuccess());
            assertEquals("Success", result.getMessage());
            assertEquals(21000L, result.getGasUsed());
        }
    }
}
