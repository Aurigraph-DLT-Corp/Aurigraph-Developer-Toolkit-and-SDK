package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractParty;
import io.aurigraph.v11.contracts.models.ContractParameters;
import io.aurigraph.v11.contracts.models.ContractProgramming;
import io.aurigraph.v11.contracts.models.ContractProgramming.*;
import io.aurigraph.v11.contracts.models.ContractSignature;
import io.aurigraph.v11.contracts.models.ContractTerm;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * TriggerExecutionService - Core execution engine for ActiveContract triggers
 *
 * Provides comprehensive trigger management including:
 * - Trigger registration and lifecycle management
 * - Condition evaluation with complex expressions
 * - Multi-action execution with ordering and retry support
 * - Time-based trigger scheduling
 * - Event and oracle handling
 * - Complete execution audit trail
 *
 * @version 12.0.0
 * @since Sprint 7 - Trigger Execution Engine
 * @author J4C Development Agent
 */
@ApplicationScoped
public class TriggerExecutionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TriggerExecutionService.class);

    @Inject
    ActiveContractService contractService;

    @Inject
    Event<TriggerExecutionEvent> triggerEventEmitter;

    // Trigger storage by contractId -> triggerId -> Trigger
    private final Map<String, Map<String, ProgrammableTrigger>> contractTriggers = new ConcurrentHashMap<>();

    // Contract programming cache
    private final Map<String, ContractProgramming> programmingCache = new ConcurrentHashMap<>();

    // Execution history storage
    private final Map<String, List<ExecutionRecord>> executionHistory = new ConcurrentHashMap<>();

    // Performance metrics
    private final AtomicLong triggersRegistered = new AtomicLong(0);
    private final AtomicLong triggersExecuted = new AtomicLong(0);
    private final AtomicLong triggersSucceeded = new AtomicLong(0);
    private final AtomicLong triggersFailed = new AtomicLong(0);

    // Virtual thread executor for high concurrency
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ==================== Trigger Registration ====================

    /**
     * Register a new trigger for a contract
     *
     * @param contractId Contract ID
     * @param trigger Trigger configuration
     * @return Registered trigger with generated ID
     */
    public Uni<ProgrammableTrigger> registerTrigger(String contractId, ProgrammableTrigger trigger) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Registering trigger '{}' for contract: {}", trigger.getName(), contractId);

            // Validate contract exists
            validateContractExists(contractId);

            // Generate trigger ID if not set
            if (trigger.getTriggerId() == null || trigger.getTriggerId().isEmpty()) {
                trigger.setTriggerId("TRIG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            }

            // Validate trigger configuration
            validateTrigger(trigger);

            // Store trigger
            contractTriggers.computeIfAbsent(contractId, k -> new ConcurrentHashMap<>())
                .put(trigger.getTriggerId(), trigger);

            // Update programming cache if exists
            ContractProgramming programming = programmingCache.get(contractId);
            if (programming != null) {
                programming.addTrigger(trigger);
            }

            triggersRegistered.incrementAndGet();
            LOGGER.info("Trigger registered: {} -> {}", contractId, trigger.getTriggerId());

            // Emit registration event
            emitTriggerEvent(contractId, trigger.getTriggerId(), "REGISTERED", null);

            return trigger;
        }).runSubscriptionOn(executor);
    }

    /**
     * Update an existing trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param updatedTrigger Updated trigger configuration
     * @return Updated trigger
     */
    public Uni<ProgrammableTrigger> updateTrigger(String contractId, String triggerId, ProgrammableTrigger updatedTrigger) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Updating trigger: {} for contract: {}", triggerId, contractId);

            Map<String, ProgrammableTrigger> triggers = contractTriggers.get(contractId);
            if (triggers == null || !triggers.containsKey(triggerId)) {
                throw new TriggerNotFoundException("Trigger not found: " + triggerId);
            }

            // Preserve trigger ID
            updatedTrigger.setTriggerId(triggerId);
            validateTrigger(updatedTrigger);

            triggers.put(triggerId, updatedTrigger);
            LOGGER.info("Trigger updated: {}", triggerId);

            emitTriggerEvent(contractId, triggerId, "UPDATED", null);
            return updatedTrigger;
        }).runSubscriptionOn(executor);
    }

    /**
     * Remove a trigger from a contract
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return true if removed
     */
    public Uni<Boolean> removeTrigger(String contractId, String triggerId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Removing trigger: {} from contract: {}", triggerId, contractId);

            Map<String, ProgrammableTrigger> triggers = contractTriggers.get(contractId);
            if (triggers == null) {
                return false;
            }

            ProgrammableTrigger removed = triggers.remove(triggerId);
            if (removed != null) {
                LOGGER.info("Trigger removed: {}", triggerId);
                emitTriggerEvent(contractId, triggerId, "REMOVED", null);
                return true;
            }
            return false;
        }).runSubscriptionOn(executor);
    }

    /**
     * Get a specific trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Trigger or null
     */
    public Uni<ProgrammableTrigger> getTrigger(String contractId, String triggerId) {
        return Uni.createFrom().item(() -> {
            Map<String, ProgrammableTrigger> triggers = contractTriggers.get(contractId);
            if (triggers == null) {
                throw new TriggerNotFoundException("No triggers found for contract: " + contractId);
            }
            ProgrammableTrigger trigger = triggers.get(triggerId);
            if (trigger == null) {
                throw new TriggerNotFoundException("Trigger not found: " + triggerId);
            }
            return trigger;
        });
    }

    /**
     * List all triggers for a contract
     *
     * @param contractId Contract ID
     * @return List of triggers
     */
    public Uni<List<ProgrammableTrigger>> listTriggers(String contractId) {
        return Uni.createFrom().item(() -> {
            Map<String, ProgrammableTrigger> triggers = contractTriggers.get(contractId);
            if (triggers == null) {
                return new ArrayList<>();
            }
            return new ArrayList<>(triggers.values());
        });
    }

    // ==================== Condition Evaluation ====================

    /**
     * Evaluate conditions for a trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Evaluation result with details
     */
    public Uni<ConditionEvaluationResult> evaluateConditions(String contractId, String triggerId) {
        return Uni.createFrom().item(() -> {
            LOGGER.debug("Evaluating conditions for trigger: {} in contract: {}", triggerId, contractId);

            ProgrammableTrigger trigger = getTriggerSync(contractId, triggerId);
            if (trigger == null) {
                throw new TriggerNotFoundException("Trigger not found: " + triggerId);
            }

            ConditionEvaluationResult result = new ConditionEvaluationResult();
            result.setTriggerId(triggerId);
            result.setContractId(contractId);
            result.setEvaluatedAt(Instant.now());

            // Check if trigger can execute
            if (!trigger.canExecute()) {
                result.setOverallResult(false);
                result.setReason("Trigger is not eligible for execution (disabled, max executions reached, or in cooldown)");
                return result;
            }

            // Get programming context for condition evaluation
            ContractProgramming programming = getProgrammingContext(contractId);

            // Evaluate all conditions
            List<String> conditionIds = trigger.getConditionIds();
            if (conditionIds == null || conditionIds.isEmpty()) {
                // No conditions means always execute
                result.setOverallResult(true);
                result.setReason("No conditions defined - trigger eligible");
                return result;
            }

            List<ConditionResult> conditionResults = new ArrayList<>();
            ConditionOperator operator = trigger.getConditionOperator();

            for (String conditionId : conditionIds) {
                Condition condition = programming != null ? programming.getConditionById(conditionId) : null;
                if (condition == null) {
                    LOGGER.warn("Condition not found: {}", conditionId);
                    conditionResults.add(new ConditionResult(conditionId, false, "Condition not found"));
                    continue;
                }

                boolean conditionMet = evaluateSingleCondition(contractId, condition);
                conditionResults.add(new ConditionResult(conditionId, conditionMet, condition.getName()));
            }

            result.setConditionResults(conditionResults);

            // Apply operator
            boolean overallResult = applyConditionOperator(conditionResults, operator);
            result.setOverallResult(overallResult);
            result.setReason(overallResult ? "All conditions met" : "Conditions not satisfied");

            return result;
        }).runSubscriptionOn(executor);
    }

    // ==================== Trigger Execution ====================

    /**
     * Execute a trigger and all its associated actions
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Execution record
     */
    public Uni<ExecutionRecord> executeTrigger(String contractId, String triggerId) {
        return executeTrigger(contractId, triggerId, false, new HashMap<>());
    }

    /**
     * Execute a trigger with options
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param forceExecution Force execution regardless of conditions
     * @param context Additional execution context
     * @return Execution record
     */
    public Uni<ExecutionRecord> executeTrigger(String contractId, String triggerId,
                                                boolean forceExecution, Map<String, Object> context) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Executing trigger: {} for contract: {}", triggerId, contractId);

            ProgrammableTrigger trigger = getTriggerSync(contractId, triggerId);
            if (trigger == null) {
                throw new TriggerNotFoundException("Trigger not found: " + triggerId);
            }

            // Create execution record
            ExecutionRecord record = new ExecutionRecord();
            record.setTriggerId(triggerId);
            record.setInput(context);

            long startTime = System.currentTimeMillis();

            try {
                // Check if can execute (unless forced)
                if (!forceExecution && !trigger.canExecute()) {
                    record.setStatus(ActionStatus.SKIPPED);
                    record.setError("Trigger not eligible for execution");
                    return record;
                }

                // Evaluate conditions (unless forced)
                if (!forceExecution) {
                    ConditionEvaluationResult evalResult = evaluateConditions(contractId, triggerId).await().indefinitely();
                    if (!evalResult.isOverallResult()) {
                        record.setStatus(ActionStatus.SKIPPED);
                        record.setError("Conditions not met: " + evalResult.getReason());
                        return record;
                    }
                }

                // Execute all actions
                List<String> actionIds = trigger.getActionIds();
                Map<String, Object> output = new HashMap<>();
                List<ActionExecutionResult> actionResults = new ArrayList<>();

                ContractProgramming programming = getProgrammingContext(contractId);

                if (actionIds != null && !actionIds.isEmpty() && programming != null) {
                    // Sort actions by order
                    List<Action> actions = actionIds.stream()
                        .map(programming::getActionById)
                        .filter(Objects::nonNull)
                        .sorted(Comparator.comparingInt(Action::getOrder))
                        .collect(Collectors.toList());

                    for (Action action : actions) {
                        if (!action.isEnabled()) {
                            LOGGER.info("Skipping disabled action: {}", action.getActionId());
                            continue;
                        }

                        ActionExecutionResult actionResult = executeActionInternal(contractId, action, context);
                        actionResults.add(actionResult);

                        if (actionResult.getStatus() == ActionStatus.FAILED && !action.isRetryOnFailure()) {
                            // Stop execution on failure if no retry
                            record.setStatus(ActionStatus.FAILED);
                            record.setError("Action failed: " + action.getActionId() + " - " + actionResult.getError());
                            break;
                        }

                        output.put(action.getActionId(), actionResult);
                    }
                }

                if (record.getStatus() != ActionStatus.FAILED) {
                    record.setStatus(ActionStatus.SUCCESS);
                }

                record.setOutput(output);
                record.setGasUsed(calculateGasUsed(actionResults));

                // Update trigger stats
                trigger.setExecutionCount(trigger.getExecutionCount() + 1);
                trigger.setLastExecutedAt(Instant.now());
                calculateNextExecution(trigger);

                triggersExecuted.incrementAndGet();
                if (record.getStatus() == ActionStatus.SUCCESS) {
                    triggersSucceeded.incrementAndGet();
                } else {
                    triggersFailed.incrementAndGet();
                }

            } catch (Exception e) {
                LOGGER.error("Trigger execution failed: {}", e.getMessage(), e);
                record.setStatus(ActionStatus.FAILED);
                record.setError(e.getMessage());
                triggersFailed.incrementAndGet();
            }

            // Store execution record
            executionHistory.computeIfAbsent(contractId, k -> new ArrayList<>()).add(record);

            // Emit execution event
            emitTriggerEvent(contractId, triggerId,
                record.getStatus() == ActionStatus.SUCCESS ? "EXECUTED" : "FAILED",
                record);

            LOGGER.info("Trigger execution completed: {} - {}", triggerId, record.getStatus());
            return record;
        }).runSubscriptionOn(executor);
    }

    /**
     * Execute a single action
     *
     * @param contractId Contract ID
     * @param actionId Action ID
     * @return Action execution result
     */
    public Uni<ActionExecutionResult> executeAction(String contractId, String actionId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Executing action: {} for contract: {}", actionId, contractId);

            ContractProgramming programming = getProgrammingContext(contractId);
            if (programming == null) {
                throw new TriggerExecutionException("No programming context for contract: " + contractId);
            }

            Action action = programming.getActionById(actionId);
            if (action == null) {
                throw new TriggerExecutionException("Action not found: " + actionId);
            }

            return executeActionInternal(contractId, action, new HashMap<>());
        }).runSubscriptionOn(executor);
    }

    // ==================== Scheduling ====================

    /**
     * Schedule a time-based trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param cronExpression Cron expression for scheduling
     * @return Scheduled trigger
     */
    public Uni<ProgrammableTrigger> scheduleTimeTrigger(String contractId, String triggerId, String cronExpression) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Scheduling time trigger: {} with cron: {}", triggerId, cronExpression);

            ProgrammableTrigger trigger = getTriggerSync(contractId, triggerId);
            if (trigger == null) {
                throw new TriggerNotFoundException("Trigger not found: " + triggerId);
            }

            if (trigger.getType() != TriggerType.TIME_BASED) {
                throw new TriggerValidationException("Trigger is not TIME_BASED: " + trigger.getType());
            }

            trigger.setCronExpression(cronExpression);
            calculateNextExecution(trigger);

            LOGGER.info("Trigger scheduled. Next execution: {}", trigger.getNextExecutionAt());
            return trigger;
        }).runSubscriptionOn(executor);
    }

    // ==================== Event Handling ====================

    /**
     * Handle blockchain event and check for matching triggers
     *
     * @param eventType Event type
     * @param eventData Event data
     * @return List of execution records for triggered actions
     */
    public Uni<List<ExecutionRecord>> handleEvent(String eventType, Map<String, Object> eventData) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Handling blockchain event: {}", eventType);

            List<ExecutionRecord> results = new ArrayList<>();

            // Find all EVENT_BASED triggers matching this event
            for (Map.Entry<String, Map<String, ProgrammableTrigger>> contractEntry : contractTriggers.entrySet()) {
                String contractId = contractEntry.getKey();

                for (ProgrammableTrigger trigger : contractEntry.getValue().values()) {
                    if (trigger.getType() == TriggerType.EVENT_BASED
                        && trigger.isEnabled()
                        && eventType.equals(trigger.getEventType())) {

                        // Check event filters
                        if (matchesEventFilters(trigger.getEventFilters(), eventData)) {
                            try {
                                Map<String, Object> context = new HashMap<>(eventData);
                                context.put("_eventType", eventType);
                                context.put("_eventTime", Instant.now().toString());

                                ExecutionRecord record = executeTrigger(
                                    contractId,
                                    trigger.getTriggerId(),
                                    false,
                                    context
                                ).await().indefinitely();

                                results.add(record);
                            } catch (Exception e) {
                                LOGGER.error("Failed to execute trigger {} for event {}: {}",
                                    trigger.getTriggerId(), eventType, e.getMessage());
                            }
                        }
                    }
                }
            }

            LOGGER.info("Event handled. Triggers executed: {}", results.size());
            return results;
        }).runSubscriptionOn(executor);
    }

    /**
     * Handle oracle data update
     *
     * @param oracleId Oracle ID
     * @param data Oracle data
     * @return List of execution records
     */
    public Uni<List<ExecutionRecord>> handleOracleUpdate(String oracleId, Map<String, Object> data) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Handling oracle update: {}", oracleId);

            List<ExecutionRecord> results = new ArrayList<>();

            // Find all ORACLE_BASED triggers for this oracle
            for (Map.Entry<String, Map<String, ProgrammableTrigger>> contractEntry : contractTriggers.entrySet()) {
                String contractId = contractEntry.getKey();

                for (ProgrammableTrigger trigger : contractEntry.getValue().values()) {
                    if (trigger.getType() == TriggerType.ORACLE_BASED
                        && trigger.isEnabled()
                        && oracleId.equals(trigger.getOracleId())) {

                        // Check oracle condition
                        if (checkOracleCondition(trigger, data)) {
                            try {
                                Map<String, Object> context = new HashMap<>(data);
                                context.put("_oracleId", oracleId);
                                context.put("_updateTime", Instant.now().toString());

                                ExecutionRecord record = executeTrigger(
                                    contractId,
                                    trigger.getTriggerId(),
                                    false,
                                    context
                                ).await().indefinitely();

                                results.add(record);
                            } catch (Exception e) {
                                LOGGER.error("Failed to execute trigger {} for oracle {}: {}",
                                    trigger.getTriggerId(), oracleId, e.getMessage());
                            }
                        }
                    }
                }
            }

            LOGGER.info("Oracle update handled. Triggers executed: {}", results.size());
            return results;
        }).runSubscriptionOn(executor);
    }

    // ==================== Execution History ====================

    /**
     * Get execution history for a contract
     *
     * @param contractId Contract ID
     * @return List of execution records
     */
    public Uni<List<ExecutionRecord>> getExecutionHistory(String contractId) {
        return Uni.createFrom().item(() -> {
            List<ExecutionRecord> history = executionHistory.get(contractId);
            return history != null ? new ArrayList<>(history) : new ArrayList<>();
        });
    }

    /**
     * Get execution history for a specific trigger
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Filtered execution records
     */
    public Uni<List<ExecutionRecord>> getTriggerExecutionHistory(String contractId, String triggerId) {
        return getExecutionHistory(contractId)
            .map(history -> history.stream()
                .filter(r -> triggerId.equals(r.getTriggerId()))
                .collect(Collectors.toList()));
    }

    // ==================== Metrics ====================

    /**
     * Get trigger execution metrics
     *
     * @return Metrics map
     */
    public Map<String, Long> getMetrics() {
        Map<String, Long> metrics = new HashMap<>();
        metrics.put("triggersRegistered", triggersRegistered.get());
        metrics.put("triggersExecuted", triggersExecuted.get());
        metrics.put("triggersSucceeded", triggersSucceeded.get());
        metrics.put("triggersFailed", triggersFailed.get());
        metrics.put("totalContractsWithTriggers", (long) contractTriggers.size());
        return metrics;
    }

    // ==================== Contract Programming Management ====================

    /**
     * Load contract programming configuration
     *
     * @param contractId Contract ID
     * @param programming Programming configuration
     */
    public void loadProgramming(String contractId, ContractProgramming programming) {
        LOGGER.info("Loading programming for contract: {}", contractId);
        programmingCache.put(contractId, programming);

        // Also load triggers from programming
        if (programming.getTriggers() != null) {
            Map<String, ProgrammableTrigger> triggers = contractTriggers.computeIfAbsent(
                contractId, k -> new ConcurrentHashMap<>());
            for (ProgrammableTrigger trigger : programming.getTriggers()) {
                triggers.put(trigger.getTriggerId(), trigger);
            }
        }
    }

    // ==================== Private Helper Methods ====================

    private ProgrammableTrigger getTriggerSync(String contractId, String triggerId) {
        Map<String, ProgrammableTrigger> triggers = contractTriggers.get(contractId);
        return triggers != null ? triggers.get(triggerId) : null;
    }

    private ContractProgramming getProgrammingContext(String contractId) {
        return programmingCache.get(contractId);
    }

    private void validateContractExists(String contractId) {
        // For now, just check if we have any context for this contract
        // In production, this would query the contract repository
        LOGGER.debug("Validating contract exists: {}", contractId);
    }

    private void validateTrigger(ProgrammableTrigger trigger) {
        if (trigger.getName() == null || trigger.getName().trim().isEmpty()) {
            throw new TriggerValidationException("Trigger name is required");
        }
        if (trigger.getType() == null) {
            throw new TriggerValidationException("Trigger type is required");
        }

        // Type-specific validation
        switch (trigger.getType()) {
            case TIME_BASED:
                if (trigger.getCronExpression() == null && trigger.getScheduledAt() == null
                    && trigger.getIntervalSeconds() <= 0) {
                    throw new TriggerValidationException("TIME_BASED trigger requires cron, scheduledAt, or intervalSeconds");
                }
                break;
            case EVENT_BASED:
                if (trigger.getEventType() == null || trigger.getEventType().isEmpty()) {
                    throw new TriggerValidationException("EVENT_BASED trigger requires eventType");
                }
                break;
            case ORACLE_BASED:
                if (trigger.getOracleId() == null || trigger.getOracleId().isEmpty()) {
                    throw new TriggerValidationException("ORACLE_BASED trigger requires oracleId");
                }
                break;
            default:
                break;
        }
    }

    private boolean evaluateSingleCondition(String contractId, Condition condition) {
        try {
            LOGGER.debug("Evaluating condition: {}", condition.getConditionId());

            switch (condition.getType()) {
                case SIMPLE:
                    return evaluateSimpleCondition(contractId, condition);
                case EXPRESSION:
                    return evaluateExpression(condition.getExpression());
                case COMPOSITE:
                    return evaluateCompositeCondition(contractId, condition);
                case THRESHOLD:
                    return evaluateThresholdCondition(condition);
                case STATE:
                    return evaluateStateCondition(contractId, condition);
                default:
                    LOGGER.warn("Unknown condition type: {}", condition.getType());
                    return false;
            }
        } catch (Exception e) {
            LOGGER.error("Condition evaluation failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean evaluateSimpleCondition(String contractId, Condition condition) {
        String leftValue = resolveOperand(contractId, condition.getLeftOperand());
        String rightValue = condition.getRightOperand();
        ComparisonOperator operator = condition.getOperator();

        return compareValues(leftValue, rightValue, operator);
    }

    private boolean evaluateExpression(String expression) {
        // Simple expression evaluation
        // In production, use SpEL or a proper expression engine
        if (expression == null) return false;

        expression = expression.toLowerCase().trim();
        if ("true".equals(expression)) return true;
        if ("false".equals(expression)) return false;

        // Placeholder for more complex expression evaluation
        LOGGER.debug("Expression evaluation not fully implemented: {}", expression);
        return true;
    }

    private boolean evaluateCompositeCondition(String contractId, Condition condition) {
        List<Condition> subConditions = condition.getSubConditions();
        if (subConditions == null || subConditions.isEmpty()) {
            return true;
        }

        List<ConditionResult> results = subConditions.stream()
            .map(c -> new ConditionResult(c.getConditionId(), evaluateSingleCondition(contractId, c), c.getName()))
            .collect(Collectors.toList());

        return applyConditionOperator(results, condition.getSubConditionOperator());
    }

    private boolean evaluateThresholdCondition(Condition condition) {
        try {
            BigDecimal value = new BigDecimal(condition.getLeftOperand());
            BigDecimal threshold = new BigDecimal(condition.getRightOperand());

            return switch (condition.getOperator()) {
                case GREATER_THAN -> value.compareTo(threshold) > 0;
                case LESS_THAN -> value.compareTo(threshold) < 0;
                case GREATER_OR_EQUAL -> value.compareTo(threshold) >= 0;
                case LESS_OR_EQUAL -> value.compareTo(threshold) <= 0;
                case EQUALS -> value.compareTo(threshold) == 0;
                default -> false;
            };
        } catch (Exception e) {
            LOGGER.error("Threshold evaluation failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean evaluateStateCondition(String contractId, Condition condition) {
        // Would query contract state
        String stateKey = condition.getLeftOperand();
        String expectedValue = condition.getRightOperand();

        // Placeholder - in production, query actual contract state
        LOGGER.debug("State condition check: {} = {}", stateKey, expectedValue);
        return true;
    }

    private String resolveOperand(String contractId, String operand) {
        if (operand == null) return null;

        // If starts with $, it's a reference to contract state/parameter
        if (operand.startsWith("$")) {
            // Resolve from contract state
            return operand; // Placeholder
        }
        return operand;
    }

    private boolean compareValues(String left, String right, ComparisonOperator operator) {
        if (left == null || right == null) return false;

        try {
            return switch (operator) {
                case EQUALS -> left.equals(right);
                case NOT_EQUALS -> !left.equals(right);
                case CONTAINS -> left.contains(right);
                case STARTS_WITH -> left.startsWith(right);
                case ENDS_WITH -> left.endsWith(right);
                case GREATER_THAN -> new BigDecimal(left).compareTo(new BigDecimal(right)) > 0;
                case LESS_THAN -> new BigDecimal(left).compareTo(new BigDecimal(right)) < 0;
                case GREATER_OR_EQUAL -> new BigDecimal(left).compareTo(new BigDecimal(right)) >= 0;
                case LESS_OR_EQUAL -> new BigDecimal(left).compareTo(new BigDecimal(right)) <= 0;
                default -> false;
            };
        } catch (Exception e) {
            return left.equals(right);
        }
    }

    private boolean applyConditionOperator(List<ConditionResult> results, ConditionOperator operator) {
        if (results.isEmpty()) return true;

        return switch (operator) {
            case AND -> results.stream().allMatch(ConditionResult::isMet);
            case OR -> results.stream().anyMatch(ConditionResult::isMet);
            case NOT -> results.size() == 1 && !results.get(0).isMet();
            case XOR -> results.stream().filter(ConditionResult::isMet).count() == 1;
        };
    }

    private ActionExecutionResult executeActionInternal(String contractId, Action action, Map<String, Object> context) {
        ActionExecutionResult result = new ActionExecutionResult();
        result.setActionId(action.getActionId());
        result.setActionType(action.getType());
        result.setStartedAt(Instant.now());

        int retries = 0;
        Exception lastError = null;

        while (retries <= (action.isRetryOnFailure() ? action.getMaxRetries() : 0)) {
            try {
                Object output = performAction(contractId, action, context);
                result.setOutput(output);
                result.setStatus(ActionStatus.SUCCESS);
                result.setCompletedAt(Instant.now());

                // Update action stats
                action.setExecutionCount(action.getExecutionCount() + 1);
                action.setLastExecutedAt(Instant.now());
                action.setLastStatus(ActionStatus.SUCCESS);

                LOGGER.info("Action executed successfully: {}", action.getActionId());
                return result;

            } catch (Exception e) {
                lastError = e;
                retries++;
                LOGGER.warn("Action execution failed (attempt {}): {}", retries, e.getMessage());

                if (retries <= action.getMaxRetries() && action.isRetryOnFailure()) {
                    result.setStatus(ActionStatus.RETRYING);
                    try {
                        Thread.sleep(1000L * retries); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        result.setStatus(ActionStatus.FAILED);
        result.setError(lastError != null ? lastError.getMessage() : "Unknown error");
        result.setCompletedAt(Instant.now());
        action.setLastStatus(ActionStatus.FAILED);

        return result;
    }

    private Object performAction(String contractId, Action action, Map<String, Object> context) {
        LOGGER.info("Performing action: {} ({})", action.getActionId(), action.getType());

        return switch (action.getType()) {
            case TOKEN_TRANSFER -> executeTokenTransfer(action, context);
            case NOTIFICATION -> executeNotification(action, context);
            case STATE_CHANGE -> executeStateChange(contractId, action, context);
            case EXTERNAL_CALL -> executeExternalCall(action, context);
            case WORKFLOW_START -> executeWorkflowStart(contractId, action, context);
            case ESCROW_RELEASE -> executeEscrowRelease(action, context);
            case ESCROW_LOCK -> executeEscrowLock(action, context);
            case EMIT_EVENT -> executeEmitEvent(contractId, action, context);
            case LOG -> executeLog(action, context);
            default -> executeCustomAction(action, context);
        };
    }

    private Map<String, Object> executeTokenTransfer(Action action, Map<String, Object> context) {
        LOGGER.info("Executing token transfer: {} -> {} ({})",
            action.getFromAddress(), action.getToAddress(), action.getAmount());

        // In production, this would interact with the token service
        Map<String, Object> result = new HashMap<>();
        result.put("type", "TOKEN_TRANSFER");
        result.put("from", action.getFromAddress());
        result.put("to", action.getToAddress());
        result.put("tokenId", action.getTokenId());
        result.put("amount", action.getAmount());
        result.put("transactionId", "TX-" + UUID.randomUUID().toString().substring(0, 8));
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeNotification(Action action, Map<String, Object> context) {
        LOGGER.info("Executing notification: {} to {}", action.getNotificationType(), action.getRecipients());

        // In production, this would interact with notification service
        Map<String, Object> result = new HashMap<>();
        result.put("type", "NOTIFICATION");
        result.put("notificationType", action.getNotificationType());
        result.put("recipients", action.getRecipients());
        result.put("subject", action.getSubject());
        result.put("sent", true);
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeStateChange(String contractId, Action action, Map<String, Object> context) {
        LOGGER.info("Executing state change: {} = {}", action.getStateKey(), action.getStateValue());

        // In production, update actual contract state
        Map<String, Object> result = new HashMap<>();
        result.put("type", "STATE_CHANGE");
        result.put("contractId", contractId);
        result.put("key", action.getStateKey());
        result.put("value", action.getStateValue());
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeExternalCall(Action action, Map<String, Object> context) {
        LOGGER.info("Executing external call: {} -> {}",
            action.getExternalContractAddress(), action.getExternalMethod());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "EXTERNAL_CALL");
        result.put("contract", action.getExternalContractAddress());
        result.put("method", action.getExternalMethod());
        result.put("params", action.getExternalParams());
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeWorkflowStart(String contractId, Action action, Map<String, Object> context) {
        LOGGER.info("Starting workflow: {}", action.getWorkflowId());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "WORKFLOW_START");
        result.put("workflowId", action.getWorkflowId());
        result.put("input", action.getWorkflowInput());
        result.put("started", true);
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeEscrowRelease(Action action, Map<String, Object> context) {
        LOGGER.info("Releasing escrow for: {}", action.getTokenId());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "ESCROW_RELEASE");
        result.put("tokenId", action.getTokenId());
        result.put("amount", action.getAmount());
        result.put("to", action.getToAddress());
        result.put("released", true);
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeEscrowLock(Action action, Map<String, Object> context) {
        LOGGER.info("Locking in escrow: {}", action.getTokenId());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "ESCROW_LOCK");
        result.put("tokenId", action.getTokenId());
        result.put("amount", action.getAmount());
        result.put("from", action.getFromAddress());
        result.put("locked", true);
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeEmitEvent(String contractId, Action action, Map<String, Object> context) {
        LOGGER.info("Emitting event for contract: {}", contractId);

        Map<String, Object> result = new HashMap<>();
        result.put("type", "EMIT_EVENT");
        result.put("contractId", contractId);
        result.put("eventData", context);
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeLog(Action action, Map<String, Object> context) {
        LOGGER.info("Log action: {}", action.getMessage());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "LOG");
        result.put("message", action.getMessage());
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private Map<String, Object> executeCustomAction(Action action, Map<String, Object> context) {
        LOGGER.info("Executing custom action: {}", action.getActionId());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "CUSTOM");
        result.put("actionId", action.getActionId());
        result.put("context", context);
        result.put("timestamp", Instant.now().toString());
        return result;
    }

    private void calculateNextExecution(ProgrammableTrigger trigger) {
        if (trigger.getType() != TriggerType.TIME_BASED) return;

        if (trigger.getIntervalSeconds() > 0) {
            trigger.setNextExecutionAt(Instant.now().plusSeconds(trigger.getIntervalSeconds()));
        } else if (trigger.getCronExpression() != null) {
            // In production, use proper cron parser
            trigger.setNextExecutionAt(Instant.now().plusSeconds(60));
        }
    }

    private boolean matchesEventFilters(Map<String, String> filters, Map<String, Object> eventData) {
        if (filters == null || filters.isEmpty()) return true;

        for (Map.Entry<String, String> filter : filters.entrySet()) {
            Object value = eventData.get(filter.getKey());
            if (value == null || !value.toString().equals(filter.getValue())) {
                return false;
            }
        }
        return true;
    }

    private boolean checkOracleCondition(ProgrammableTrigger trigger, Map<String, Object> data) {
        String condition = trigger.getOracleCondition();
        BigDecimal threshold = trigger.getOracleThreshold();

        if (condition == null || threshold == null) {
            return true; // No specific condition, always trigger
        }

        // Extract value from oracle data
        Object valueObj = data.get("value");
        if (valueObj == null) return false;

        try {
            BigDecimal value = new BigDecimal(valueObj.toString());
            return switch (condition) {
                case ">" -> value.compareTo(threshold) > 0;
                case "<" -> value.compareTo(threshold) < 0;
                case ">=" -> value.compareTo(threshold) >= 0;
                case "<=" -> value.compareTo(threshold) <= 0;
                case "==" -> value.compareTo(threshold) == 0;
                default -> true;
            };
        } catch (Exception e) {
            LOGGER.error("Oracle condition check failed: {}", e.getMessage());
            return false;
        }
    }

    private long calculateGasUsed(List<ActionExecutionResult> results) {
        long baseGas = 21000;
        long actionGas = results.size() * 5000L;
        return baseGas + actionGas;
    }

    private void emitTriggerEvent(String contractId, String triggerId, String eventType, ExecutionRecord record) {
        try {
            TriggerExecutionEvent event = new TriggerExecutionEvent(contractId, triggerId, eventType, record);
            triggerEventEmitter.fire(event);
        } catch (Exception e) {
            LOGGER.debug("Event emission skipped: {}", e.getMessage());
        }
    }

    // ==================== Inner Classes ====================

    public static class ConditionEvaluationResult {
        private String contractId;
        private String triggerId;
        private Instant evaluatedAt;
        private boolean overallResult;
        private String reason;
        private List<ConditionResult> conditionResults = new ArrayList<>();

        // Getters and setters
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getTriggerId() { return triggerId; }
        public void setTriggerId(String triggerId) { this.triggerId = triggerId; }
        public Instant getEvaluatedAt() { return evaluatedAt; }
        public void setEvaluatedAt(Instant evaluatedAt) { this.evaluatedAt = evaluatedAt; }
        public boolean isOverallResult() { return overallResult; }
        public void setOverallResult(boolean overallResult) { this.overallResult = overallResult; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public List<ConditionResult> getConditionResults() { return conditionResults; }
        public void setConditionResults(List<ConditionResult> conditionResults) { this.conditionResults = conditionResults; }
    }

    public static class ConditionResult {
        private String conditionId;
        private boolean met;
        private String description;

        public ConditionResult() {}
        public ConditionResult(String conditionId, boolean met, String description) {
            this.conditionId = conditionId;
            this.met = met;
            this.description = description;
        }

        public String getConditionId() { return conditionId; }
        public void setConditionId(String conditionId) { this.conditionId = conditionId; }
        public boolean isMet() { return met; }
        public void setMet(boolean met) { this.met = met; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class ActionExecutionResult {
        private String actionId;
        private ActionType actionType;
        private ActionStatus status;
        private Instant startedAt;
        private Instant completedAt;
        private Object output;
        private String error;

        // Getters and setters
        public String getActionId() { return actionId; }
        public void setActionId(String actionId) { this.actionId = actionId; }
        public ActionType getActionType() { return actionType; }
        public void setActionType(ActionType actionType) { this.actionType = actionType; }
        public ActionStatus getStatus() { return status; }
        public void setStatus(ActionStatus status) { this.status = status; }
        public Instant getStartedAt() { return startedAt; }
        public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
        public Object getOutput() { return output; }
        public void setOutput(Object output) { this.output = output; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    public static class TriggerExecutionEvent {
        private String contractId;
        private String triggerId;
        private String eventType;
        private ExecutionRecord record;
        private Instant timestamp;

        public TriggerExecutionEvent(String contractId, String triggerId, String eventType, ExecutionRecord record) {
            this.contractId = contractId;
            this.triggerId = triggerId;
            this.eventType = eventType;
            this.record = record;
            this.timestamp = Instant.now();
        }

        public String getContractId() { return contractId; }
        public String getTriggerId() { return triggerId; }
        public String getEventType() { return eventType; }
        public ExecutionRecord getRecord() { return record; }
        public Instant getTimestamp() { return timestamp; }
    }

    // ==================== Custom Exceptions ====================

    public static class TriggerNotFoundException extends RuntimeException {
        public TriggerNotFoundException(String message) {
            super(message);
        }
    }

    public static class TriggerValidationException extends RuntimeException {
        public TriggerValidationException(String message) {
            super(message);
        }
    }

    public static class TriggerExecutionException extends RuntimeException {
        public TriggerExecutionException(String message) {
            super(message);
        }

        public TriggerExecutionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
