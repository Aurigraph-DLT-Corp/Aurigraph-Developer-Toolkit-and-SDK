package io.aurigraph.v11.nodes;

import io.aurigraph.v11.nodes.BusinessNode.TransactionRequest;
import io.aurigraph.v11.nodes.BusinessNode.TransactionResult;
import io.aurigraph.v11.nodes.BusinessNode.WorkflowState;
import io.aurigraph.v11.nodes.BusinessNode.AuditEntry;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * BusinessNodeService - Service for managing BusinessNode instances.
 *
 * Extends GenericNodeService to provide business-specific functionality:
 * - Transaction submission and routing
 * - Smart contract management
 * - Workflow orchestration
 * - Cross-node audit logging
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class BusinessNodeService extends GenericNodeService<BusinessNode> {

    private static final Logger LOG = Logger.getLogger(BusinessNodeService.class);

    // Transaction routing strategy
    private volatile String preferredNodeId = null;

    // Global contract registry for cross-node access
    private final Map<String, String> contractToNodeMapping = new ConcurrentHashMap<>();

    @Override
    protected BusinessNode createNode(String nodeId) {
        return new BusinessNode(nodeId);
    }

    @Override
    protected void doInit() {
        LOG.info("BusinessNodeService initialized");
    }

    @Override
    protected void doCleanup() {
        preferredNodeId = null;
        contractToNodeMapping.clear();
        LOG.info("BusinessNodeService cleaned up");
    }

    // ============================================
    // TRANSACTION ROUTING
    // ============================================

    /**
     * Submit a transaction with automatic routing to best available node
     */
    public CompletableFuture<TransactionResult> submitTransaction(TransactionRequest request) {
        BusinessNode node = selectNodeForTransaction(request);
        if (node == null) {
            CompletableFuture<TransactionResult> failed = new CompletableFuture<>();
            failed.completeExceptionally(new IllegalStateException("No available business nodes"));
            return failed;
        }

        LOG.debugf("Routing transaction %s to node %s", request.getTransactionId(), node.getNodeId());
        return node.submitTransaction(request);
    }

    /**
     * Submit a transaction to a specific node
     */
    public CompletableFuture<TransactionResult> submitTransaction(String nodeId, TransactionRequest request) {
        BusinessNode node = getNode(nodeId);
        if (node == null || !node.isRunning()) {
            CompletableFuture<TransactionResult> failed = new CompletableFuture<>();
            failed.completeExceptionally(new IllegalArgumentException("Node not available: " + nodeId));
            return failed;
        }
        return node.submitTransaction(request);
    }

    /**
     * Select the best node for a transaction
     */
    private BusinessNode selectNodeForTransaction(TransactionRequest request) {
        // If transaction targets a specific contract, route to that node
        if (request.getContractId() != null) {
            String contractNodeId = contractToNodeMapping.get(request.getContractId());
            if (contractNodeId != null) {
                BusinessNode node = getNode(contractNodeId);
                if (node != null && node.isRunning()) {
                    return node;
                }
            }
        }

        // Check preferred node
        if (preferredNodeId != null) {
            BusinessNode preferred = getNode(preferredNodeId);
            if (preferred != null && preferred.isRunning() && preferred.isHealthy()) {
                return preferred;
            }
        }

        // Select least loaded healthy node
        return getAllNodes().values().stream()
            .filter(n -> n.isRunning() && n.isHealthy())
            .min(Comparator.comparingInt(BusinessNode::getPendingTransactionCount))
            .orElse(null);
    }

    /**
     * Set preferred node for transaction routing
     */
    public void setPreferredNode(String nodeId) {
        this.preferredNodeId = nodeId;
        LOG.infof("Set preferred transaction node: %s", nodeId);
    }

    // ============================================
    // CONTRACT MANAGEMENT
    // ============================================

    /**
     * Register a contract on a specific node
     */
    public Uni<Boolean> registerContract(String nodeId, String contractId, String code, Map<String, Object> initialState) {
        return Uni.createFrom().item(() -> {
            BusinessNode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }

            node.registerContract(contractId, code, initialState);
            contractToNodeMapping.put(contractId, nodeId);
            LOG.infof("Registered contract %s on node %s", contractId, nodeId);
            return true;
        });
    }

    /**
     * Execute a contract across the network
     */
    public Uni<Long> executeContract(String contractId, Map<String, Object> params) {
        return Uni.createFrom().item(() -> {
            String nodeId = contractToNodeMapping.get(contractId);
            if (nodeId == null) {
                throw new IllegalArgumentException("Contract not registered: " + contractId);
            }

            BusinessNode node = getNode(nodeId);
            if (node == null || !node.isRunning()) {
                throw new IllegalStateException("Contract node not available: " + nodeId);
            }

            return node.executeContract(contractId, params);
        });
    }

    /**
     * Get contract state from any node
     */
    public Map<String, Object> getContractState(String contractId) {
        String nodeId = contractToNodeMapping.get(contractId);
        if (nodeId == null) {
            return null;
        }

        BusinessNode node = getNode(nodeId);
        if (node == null) {
            return null;
        }

        return node.getContractState(contractId);
    }

    /**
     * List all registered contracts
     */
    public Map<String, String> getAllContracts() {
        return Map.copyOf(contractToNodeMapping);
    }

    // ============================================
    // WORKFLOW MANAGEMENT
    // ============================================

    /**
     * Start a workflow on the best available node
     */
    public Uni<String> startWorkflow(String workflowType, Map<String, Object> params) {
        return Uni.createFrom().item(() -> {
            BusinessNode node = selectNodeForTransaction(null);
            if (node == null) {
                throw new IllegalStateException("No available business nodes");
            }
            return node.startWorkflow(workflowType, params);
        });
    }

    /**
     * Start a workflow on a specific node
     */
    public Uni<String> startWorkflow(String nodeId, String workflowType, Map<String, Object> params) {
        return Uni.createFrom().item(() -> {
            BusinessNode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            return node.startWorkflow(workflowType, params);
        });
    }

    /**
     * Complete a workflow step
     */
    public Uni<Boolean> completeWorkflowStep(String nodeId, String workflowId, String stepId, Map<String, Object> result) {
        return Uni.createFrom().item(() -> {
            BusinessNode node = getNode(nodeId);
            if (node == null) {
                throw new IllegalArgumentException("Node not found: " + nodeId);
            }
            node.completeWorkflowStep(workflowId, stepId, result);
            return true;
        });
    }

    /**
     * Get workflow status from a node
     */
    public WorkflowState getWorkflowStatus(String nodeId, String workflowId) {
        BusinessNode node = getNode(nodeId);
        if (node == null) {
            return null;
        }
        return node.getWorkflowStatus(workflowId);
    }

    // ============================================
    // AUDIT & LOGGING
    // ============================================

    /**
     * Get consolidated audit log from all nodes
     */
    public List<AuditEntry> getConsolidatedAuditLog(int limit) {
        List<AuditEntry> allEntries = new ArrayList<>();

        for (BusinessNode node : getAllNodes().values()) {
            allEntries.addAll(node.getAuditLog(limit));
        }

        // Sort by timestamp descending and limit
        allEntries.sort((a, b) -> b.timestamp.compareTo(a.timestamp));

        return allEntries.subList(0, Math.min(limit, allEntries.size()));
    }

    /**
     * Get audit log from a specific node
     */
    public List<AuditEntry> getNodeAuditLog(String nodeId, int limit) {
        BusinessNode node = getNode(nodeId);
        if (node == null) {
            return List.of();
        }
        return node.getAuditLog(limit);
    }

    // ============================================
    // METRICS & STATUS
    // ============================================

    /**
     * Get network-wide business node statistics
     */
    public Map<String, Object> getNetworkStats() {
        Map<String, Object> stats = new ConcurrentHashMap<>();

        long totalExecuted = getAllNodes().values().stream()
            .mapToLong(BusinessNode::getExecutedTransactionCount)
            .sum();

        long totalFailed = getAllNodes().values().stream()
            .mapToLong(BusinessNode::getFailedTransactionCount)
            .sum();

        long totalContracts = getAllNodes().values().stream()
            .mapToLong(BusinessNode::getRegisteredContractCount)
            .sum();

        long totalWorkflows = getAllNodes().values().stream()
            .mapToLong(BusinessNode::getActiveWorkflowCount)
            .sum();

        double avgTps = getAllNodes().values().stream()
            .mapToDouble(BusinessNode::getCurrentTps)
            .average()
            .orElse(0);

        double avgLatency = getAllNodes().values().stream()
            .mapToDouble(BusinessNode::getAverageLatencyMs)
            .average()
            .orElse(0);

        stats.put("totalNodes", getNodeCount());
        stats.put("runningNodes", getRunningNodeCount());
        stats.put("healthyNodes", getHealthyNodeCount());
        stats.put("totalExecutedTransactions", totalExecuted);
        stats.put("totalFailedTransactions", totalFailed);
        stats.put("totalRegisteredContracts", totalContracts);
        stats.put("contractNodeMappings", contractToNodeMapping.size());
        stats.put("totalActiveWorkflows", totalWorkflows);
        stats.put("averageTps", avgTps);
        stats.put("averageLatencyMs", avgLatency);
        stats.put("preferredNode", preferredNodeId);

        // Calculate failure rate
        long total = totalExecuted + totalFailed;
        double failureRate = total > 0 ? (double) totalFailed / total : 0;
        stats.put("networkFailureRate", failureRate);

        return stats;
    }

    /**
     * Get total TPS across all business nodes
     */
    public double getTotalTps() {
        return getAllNodes().values().stream()
            .filter(BusinessNode::isRunning)
            .mapToDouble(BusinessNode::getCurrentTps)
            .sum();
    }
}
