package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.AbstractNode;
import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/**
 * BusinessNode - Executes business logic and smart contract operations.
 *
 * Consolidated implementation for business nodes including:
 * - Transaction execution
 * - Smart contract (Ricardian) processing
 * - Workflow orchestration
 * - Business metrics tracking
 * - Audit logging
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public class BusinessNode extends AbstractNode {

    private static final Logger LOG = Logger.getLogger(BusinessNode.class);

    // Configuration
    private static final int MAX_CONCURRENT_TRANSACTIONS = 10_000;
    private static final long CONTRACT_EXECUTION_TIMEOUT_MS = 5_000;
    private static final long MAX_GAS_LIMIT = 10_000_000;
    private static final int STATE_CACHE_SIZE_MB = 1024;

    // State
    private final AtomicLong executedTransactions = new AtomicLong(0);
    private final AtomicLong executedContracts = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);
    private final AtomicLong totalGasUsed = new AtomicLong(0);

    // Transaction queue
    private final BlockingQueue<TransactionRequest> transactionQueue =
        new LinkedBlockingQueue<>(MAX_CONCURRENT_TRANSACTIONS);
    private final AtomicInteger pendingTransactions = new AtomicInteger(0);

    // Contract registry
    private final Map<String, ContractState> contracts = new ConcurrentHashMap<>();
    private final Map<String, WorkflowState> workflows = new ConcurrentHashMap<>();

    // State cache
    private final Map<String, Object> stateCache = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong totalExecutionTimeNs = new AtomicLong(0);
    private final AtomicInteger activeExecutions = new AtomicInteger(0);

    // Audit log
    private final List<AuditEntry> auditLog = Collections.synchronizedList(new ArrayList<>());
    private static final int MAX_AUDIT_ENTRIES = 10_000;

    // Executor for transaction processing
    private ExecutorService transactionExecutor;
    private ScheduledExecutorService metricsExecutor;

    public BusinessNode(String nodeId) {
        super(nodeId, io.aurigraph.v11.demo.models.NodeType.BUSINESS);
    }

    @Override
    protected Uni<Void> doStart() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Starting BusinessNode %s", getNodeId());

            // Initialize transaction executor with virtual threads if available
            transactionExecutor = Executors.newFixedThreadPool(
                Runtime.getRuntime().availableProcessors() * 2,
                r -> {
                    Thread t = new Thread(r, "business-tx-" + getNodeId());
                    t.setDaemon(true);
                    return t;
                }
            );

            // Start transaction processing workers
            for (int i = 0; i < Runtime.getRuntime().availableProcessors(); i++) {
                transactionExecutor.submit(this::processTransactionQueue);
            }

            // Initialize metrics executor
            metricsExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "business-metrics-" + getNodeId());
                t.setDaemon(true);
                return t;
            });

            // Schedule metrics collection
            metricsExecutor.scheduleAtFixedRate(
                this::collectMetrics,
                60,
                60,
                TimeUnit.SECONDS
            );

            LOG.infof("BusinessNode %s started successfully", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<Void> doStop() {
        return Uni.createFrom().item(() -> {
            LOG.infof("Stopping BusinessNode %s", getNodeId());

            if (transactionExecutor != null) {
                transactionExecutor.shutdown();
                try {
                    if (!transactionExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                        transactionExecutor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    transactionExecutor.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }

            if (metricsExecutor != null) {
                metricsExecutor.shutdown();
            }

            LOG.infof("BusinessNode %s stopped", getNodeId());
            return null;
        });
    }

    @Override
    protected Uni<NodeHealth> doHealthCheck() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> components = new HashMap<>();
            components.put("transactionQueue", pendingTransactions.get() < MAX_CONCURRENT_TRANSACTIONS * 0.9);
            components.put("contracts", contracts.size());
            components.put("stateCache", stateCache.size() < STATE_CACHE_SIZE_MB * 1000);
            components.put("activeExecutions", activeExecutions.get());
            components.put("failureRate", getFailureRate() < 0.05); // Less than 5%

            boolean healthy = components.values().stream()
                .allMatch(v -> v instanceof Boolean ? (Boolean) v : true);

            return new NodeHealth(
                healthy ? io.aurigraph.v11.demo.models.NodeStatus.RUNNING : io.aurigraph.v11.demo.models.NodeStatus.ERROR,
                healthy,
                getUptimeSeconds(),
                components
            );
        });
    }

    @Override
    protected Uni<NodeMetrics> doGetMetrics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> customMetrics = new HashMap<>();
            customMetrics.put("executedTransactions", executedTransactions.get());
            customMetrics.put("executedContracts", executedContracts.get());
            customMetrics.put("failedTransactions", failedTransactions.get());
            customMetrics.put("pendingTransactions", pendingTransactions.get());
            customMetrics.put("totalGasUsed", totalGasUsed.get());
            customMetrics.put("activeExecutions", activeExecutions.get());
            customMetrics.put("registeredContracts", contracts.size());
            customMetrics.put("activeWorkflows", workflows.size());
            customMetrics.put("stateCacheSize", stateCache.size());
            customMetrics.put("failureRate", getFailureRate());

            // Calculate TPS and latency
            long uptime = getUptimeSeconds();
            double tps = uptime > 0 ? (double) executedTransactions.get() / uptime : 0;
            double avgLatency = executedTransactions.get() > 0
                ? (double) totalExecutionTimeNs.get() / executedTransactions.get() / 1_000_000
                : 0;

            return new NodeMetrics(tps, avgLatency, 0, 0, customMetrics);
        });
    }

    // ============================================
    // TRANSACTION PROCESSING
    // ============================================

    /**
     * Submit a transaction for execution
     */
    public CompletableFuture<TransactionResult> submitTransaction(TransactionRequest request) {
        CompletableFuture<TransactionResult> future = new CompletableFuture<>();

        if (pendingTransactions.get() >= MAX_CONCURRENT_TRANSACTIONS) {
            future.completeExceptionally(new RejectedExecutionException("Transaction queue full"));
            return future;
        }

        request.setResultFuture(future);
        if (transactionQueue.offer(request)) {
            pendingTransactions.incrementAndGet();
            audit("TX_SUBMITTED", request.getTransactionId(), "Transaction submitted");
        } else {
            future.completeExceptionally(new RejectedExecutionException("Failed to queue transaction"));
        }

        return future;
    }

    /**
     * Process transactions from the queue
     */
    private void processTransactionQueue() {
        while (isRunning()) {
            try {
                TransactionRequest request = transactionQueue.poll(1, TimeUnit.SECONDS);
                if (request != null) {
                    executeTransaction(request);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf(e, "Error processing transaction");
            }
        }
    }

    /**
     * Execute a single transaction
     */
    private void executeTransaction(TransactionRequest request) {
        activeExecutions.incrementAndGet();
        long startTime = System.nanoTime();

        try {
            // Validate transaction
            if (!validateTransaction(request)) {
                failedTransactions.incrementAndGet();
                request.getResultFuture().complete(new TransactionResult(
                    request.getTransactionId(), false, "Validation failed", 0));
                audit("TX_FAILED", request.getTransactionId(), "Validation failed");
                return;
            }

            // Execute contract if applicable
            long gasUsed = 0;
            if (request.getContractId() != null) {
                gasUsed = executeContract(request.getContractId(), request.getPayload());
                executedContracts.incrementAndGet();
            }

            // Update state
            updateState(request);

            // Complete transaction
            executedTransactions.incrementAndGet();
            totalGasUsed.addAndGet(gasUsed);

            request.getResultFuture().complete(new TransactionResult(
                request.getTransactionId(), true, "Success", gasUsed));
            audit("TX_EXECUTED", request.getTransactionId(), "Transaction executed successfully");

        } catch (Exception e) {
            failedTransactions.incrementAndGet();
            request.getResultFuture().completeExceptionally(e);
            audit("TX_ERROR", request.getTransactionId(), e.getMessage());

        } finally {
            pendingTransactions.decrementAndGet();
            activeExecutions.decrementAndGet();
            totalExecutionTimeNs.addAndGet(System.nanoTime() - startTime);
        }
    }

    /**
     * Validate a transaction
     */
    private boolean validateTransaction(TransactionRequest request) {
        if (request.getTransactionId() == null || request.getTransactionId().isEmpty()) {
            return false;
        }
        if (request.getGasLimit() > MAX_GAS_LIMIT) {
            return false;
        }
        return true;
    }

    /**
     * Update state after transaction
     */
    private void updateState(TransactionRequest request) {
        if (request.getStateUpdates() != null) {
            stateCache.putAll(request.getStateUpdates());
        }
    }

    // ============================================
    // CONTRACT MANAGEMENT
    // ============================================

    /**
     * Register a contract
     */
    public void registerContract(String contractId, String code, Map<String, Object> initialState) {
        ContractState contract = new ContractState(contractId, code, initialState);
        contracts.put(contractId, contract);
        audit("CONTRACT_REGISTERED", contractId, "Contract registered");
        LOG.infof("Registered contract: %s", contractId);
    }

    /**
     * Execute a contract
     */
    public long executeContract(String contractId, Map<String, Object> params) {
        ContractState contract = contracts.get(contractId);
        if (contract == null) {
            throw new IllegalArgumentException("Contract not found: " + contractId);
        }

        // Simulate gas consumption
        long gasUsed = 21_000 + (params != null ? params.size() * 1000L : 0);

        // Update contract state
        if (params != null) {
            contract.state.putAll(params);
        }
        contract.executionCount++;
        contract.lastExecuted = Instant.now();

        return Math.min(gasUsed, MAX_GAS_LIMIT);
    }

    /**
     * Get contract state
     */
    public Map<String, Object> getContractState(String contractId) {
        ContractState contract = contracts.get(contractId);
        return contract != null ? Collections.unmodifiableMap(contract.state) : null;
    }

    // ============================================
    // WORKFLOW MANAGEMENT
    // ============================================

    /**
     * Start a workflow
     */
    public String startWorkflow(String workflowType, Map<String, Object> params) {
        String workflowId = UUID.randomUUID().toString();
        WorkflowState workflow = new WorkflowState(workflowId, workflowType, params);
        workflows.put(workflowId, workflow);
        audit("WORKFLOW_STARTED", workflowId, "Workflow started: " + workflowType);
        return workflowId;
    }

    /**
     * Complete a workflow step
     */
    public void completeWorkflowStep(String workflowId, String stepId, Map<String, Object> result) {
        WorkflowState workflow = workflows.get(workflowId);
        if (workflow != null) {
            workflow.completedSteps.add(stepId);
            if (result != null) {
                workflow.results.putAll(result);
            }
            audit("WORKFLOW_STEP_COMPLETED", workflowId, "Step completed: " + stepId);
        }
    }

    /**
     * Get workflow status
     */
    public WorkflowState getWorkflowStatus(String workflowId) {
        return workflows.get(workflowId);
    }

    // ============================================
    // AUDIT LOGGING
    // ============================================

    /**
     * Add audit entry
     */
    private void audit(String action, String entityId, String details) {
        if (auditLog.size() >= MAX_AUDIT_ENTRIES) {
            auditLog.remove(0);
        }
        auditLog.add(new AuditEntry(action, entityId, details));
    }

    /**
     * Get recent audit entries
     */
    public List<AuditEntry> getAuditLog(int limit) {
        int start = Math.max(0, auditLog.size() - limit);
        return new ArrayList<>(auditLog.subList(start, auditLog.size()));
    }

    // ============================================
    // METRICS
    // ============================================

    /**
     * Collect metrics periodically
     */
    private void collectMetrics() {
        LOG.debugf("BusinessNode %s metrics - TPS: %.2f, Pending: %d, Contracts: %d",
            getNodeId(),
            (double) executedTransactions.get() / getUptimeSeconds(),
            pendingTransactions.get(),
            contracts.size());
    }

    /**
     * Get failure rate
     */
    private double getFailureRate() {
        long total = executedTransactions.get() + failedTransactions.get();
        return total > 0 ? (double) failedTransactions.get() / total : 0;
    }

    // ============================================
    // PUBLIC GETTERS FOR METRICS
    // ============================================

    public long getExecutedTransactionCount() {
        return executedTransactions.get();
    }

    public long getFailedTransactionCount() {
        return failedTransactions.get();
    }

    public int getPendingTransactionCount() {
        return pendingTransactions.get();
    }

    public long getExecutedContractCount() {
        return executedContracts.get();
    }

    public int getRegisteredContractCount() {
        return contracts.size();
    }

    public int getActiveWorkflowCount() {
        return workflows.size();
    }

    public double getCurrentTps() {
        long uptime = getUptimeSeconds();
        return uptime > 0 ? (double) executedTransactions.get() / uptime : 0;
    }

    public double getAverageLatencyMs() {
        return executedTransactions.get() > 0
            ? (double) totalExecutionTimeNs.get() / executedTransactions.get() / 1_000_000
            : 0;
    }

    // ============================================
    // INNER CLASSES
    // ============================================

    public static class TransactionRequest {
        private final String transactionId;
        private final String contractId;
        private final Map<String, Object> payload;
        private final Map<String, Object> stateUpdates;
        private final long gasLimit;
        private CompletableFuture<TransactionResult> resultFuture;

        public TransactionRequest(String transactionId, String contractId,
                Map<String, Object> payload, Map<String, Object> stateUpdates, long gasLimit) {
            this.transactionId = transactionId;
            this.contractId = contractId;
            this.payload = payload;
            this.stateUpdates = stateUpdates;
            this.gasLimit = gasLimit;
        }

        public String getTransactionId() { return transactionId; }
        public String getContractId() { return contractId; }
        public Map<String, Object> getPayload() { return payload; }
        public Map<String, Object> getStateUpdates() { return stateUpdates; }
        public long getGasLimit() { return gasLimit; }
        public CompletableFuture<TransactionResult> getResultFuture() { return resultFuture; }
        public void setResultFuture(CompletableFuture<TransactionResult> future) { this.resultFuture = future; }
    }

    public static class TransactionResult {
        private final String transactionId;
        private final boolean success;
        private final String message;
        private final long gasUsed;

        public TransactionResult(String transactionId, boolean success, String message, long gasUsed) {
            this.transactionId = transactionId;
            this.success = success;
            this.message = message;
            this.gasUsed = gasUsed;
        }

        public String getTransactionId() { return transactionId; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public long getGasUsed() { return gasUsed; }
    }

    private static class ContractState {
        final String contractId;
        final String code;
        final Map<String, Object> state;
        int executionCount = 0;
        Instant lastExecuted;

        ContractState(String contractId, String code, Map<String, Object> initialState) {
            this.contractId = contractId;
            this.code = code;
            this.state = new ConcurrentHashMap<>(initialState != null ? initialState : Map.of());
        }
    }

    public static class WorkflowState {
        public final String workflowId;
        public final String workflowType;
        public final Map<String, Object> params;
        public final List<String> completedSteps = new ArrayList<>();
        public final Map<String, Object> results = new ConcurrentHashMap<>();
        public final Instant startedAt = Instant.now();

        WorkflowState(String workflowId, String workflowType, Map<String, Object> params) {
            this.workflowId = workflowId;
            this.workflowType = workflowType;
            this.params = params != null ? new HashMap<>(params) : new HashMap<>();
        }
    }

    public static class AuditEntry {
        public final Instant timestamp = Instant.now();
        public final String action;
        public final String entityId;
        public final String details;

        AuditEntry(String action, String entityId, String details) {
            this.action = action;
            this.entityId = entityId;
            this.details = details;
        }
    }
}
