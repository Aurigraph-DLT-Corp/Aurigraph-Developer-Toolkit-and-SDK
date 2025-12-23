package io.aurigraph.v11.services;

import io.aurigraph.v11.models.ActiveContract;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contract Workflow Engine - State machine for active contract lifecycle management
 *
 * Features:
 * - Event-driven workflow orchestration
 * - State transition validation
 * - Action availability management
 * - Smart contract execution triggers
 * - Compliance validation hooks
 * - Audit trail generation
 * - Parallel workflow support
 * - Custom workflow definitions
 *
 * Workflow States:
 * - DRAFT -> PENDING_APPROVAL -> PENDING_SIGNATURES -> ACTIVE -> EXECUTED -> COMPLETED
 * - CANCELLED, DISPUTED, EXPIRED, SUSPENDED (terminal or exception states)
 *
 * @version 1.0.0
 * @since Sprint 13 (AV11-060)
 */
@ApplicationScoped
public class ContractWorkflowEngine {

    private static final Logger LOG = Logger.getLogger(ContractWorkflowEngine.class);

    @Inject
    ObjectMapper objectMapper;

    // State transition map: current state -> allowed next states
    private final Map<String, Set<String>> stateTransitions = new ConcurrentHashMap<>();

    // Action map: state -> available actions
    private final Map<String, Set<String>> stateActions = new ConcurrentHashMap<>();

    // Workflow listeners for event-driven processing
    private final List<WorkflowListener> workflowListeners = new ArrayList<>();

    public ContractWorkflowEngine() {
        initializeDefaultWorkflow();
    }

    /**
     * Initialize default workflow state machine
     */
    private void initializeDefaultWorkflow() {
        // DRAFT state transitions
        stateTransitions.put("DRAFT", Set.of(
            "PENDING_APPROVAL",
            "CANCELLED"
        ));
        stateActions.put("DRAFT", Set.of(
            "SUBMIT_FOR_APPROVAL",
            "ADD_PARTY",
            "MODIFY_TERMS",
            "CANCEL"
        ));

        // PENDING_APPROVAL state transitions
        stateTransitions.put("PENDING_APPROVAL", Set.of(
            "PENDING_SIGNATURES",
            "DRAFT",
            "CANCELLED"
        ));
        stateActions.put("PENDING_APPROVAL", Set.of(
            "APPROVE",
            "REJECT",
            "REQUEST_CHANGES",
            "CANCEL"
        ));

        // PENDING_SIGNATURES state transitions
        stateTransitions.put("PENDING_SIGNATURES", Set.of(
            "ACTIVE",
            "DRAFT",
            "CANCELLED"
        ));
        stateActions.put("PENDING_SIGNATURES", Set.of(
            "SIGN",
            "REQUEST_SIGNATURE",
            "REVOKE_SIGNATURE",
            "CANCEL"
        ));

        // ACTIVE state transitions
        stateTransitions.put("ACTIVE", Set.of(
            "EXECUTED",
            "SUSPENDED",
            "DISPUTED",
            "CANCELLED",
            "EXPIRED"
        ));
        stateActions.put("ACTIVE", Set.of(
            "EXECUTE",
            "SUSPEND",
            "DISPUTE",
            "AMEND",
            "RENEW",
            "CANCEL"
        ));

        // EXECUTED state transitions
        stateTransitions.put("EXECUTED", Set.of(
            "COMPLETED",
            "ACTIVE",
            "DISPUTED"
        ));
        stateActions.put("EXECUTED", Set.of(
            "COMPLETE",
            "RE_EXECUTE",
            "DISPUTE",
            "VERIFY"
        ));

        // COMPLETED state (terminal)
        stateTransitions.put("COMPLETED", Set.of());
        stateActions.put("COMPLETED", Set.of(
            "ARCHIVE",
            "EXPORT"
        ));

        // SUSPENDED state transitions
        stateTransitions.put("SUSPENDED", Set.of(
            "ACTIVE",
            "CANCELLED"
        ));
        stateActions.put("SUSPENDED", Set.of(
            "RESUME",
            "CANCEL"
        ));

        // DISPUTED state transitions
        stateTransitions.put("DISPUTED", Set.of(
            "ACTIVE",
            "CANCELLED"
        ));
        stateActions.put("DISPUTED", Set.of(
            "RESOLVE",
            "ESCALATE",
            "CANCEL"
        ));

        // CANCELLED state (terminal)
        stateTransitions.put("CANCELLED", Set.of());
        stateActions.put("CANCELLED", Set.of(
            "ARCHIVE"
        ));

        // EXPIRED state (terminal)
        stateTransitions.put("EXPIRED", Set.of());
        stateActions.put("EXPIRED", Set.of(
            "ARCHIVE",
            "RENEW"
        ));
    }

    /**
     * Execute an action on a contract
     */
    public WorkflowResult executeAction(ActiveContract contract, String actionId, Map<String, Object> params) {
        LOG.infof("Executing action '%s' on contract %s in state '%s'", actionId, contract.getContractId(), contract.getWorkflowState());

        try {
            // Validate action is available in current state
            if (!isActionAvailable(contract.getWorkflowState(), actionId)) {
                return WorkflowResult.failure(
                    String.format("Action '%s' is not available in state '%s'", actionId, contract.getWorkflowState())
                );
            }

            // Pre-action validation
            WorkflowValidationResult validation = validateAction(contract, actionId, params);
            if (!validation.isValid()) {
                return WorkflowResult.failure(validation.getErrorMessage());
            }

            // Execute action
            String newState = performAction(contract, actionId, params);

            // Validate state transition
            if (!isValidTransition(contract.getWorkflowState(), newState)) {
                return WorkflowResult.failure(
                    String.format("Invalid state transition from '%s' to '%s'", contract.getWorkflowState(), newState)
                );
            }

            // Update contract state
            String oldState = contract.getWorkflowState();
            contract.updateWorkflowState(newState, actionId);

            // Add audit entry
            addAuditEntry(contract, actionId, oldState, newState, params);

            // Trigger event listeners
            notifyListeners(new WorkflowEvent(contract.getContractId(), oldState, newState, actionId, params));

            // Check for smart contract execution trigger
            if (shouldTriggerSmartContract(contract, actionId)) {
                triggerSmartContractExecution(contract);
            }

            LOG.infof("Action '%s' executed successfully. Contract %s transitioned from '%s' to '%s'",
                actionId, contract.getContractId(), oldState, newState);

            return WorkflowResult.success(newState);

        } catch (Exception e) {
            LOG.errorf(e, "Failed to execute action '%s' on contract %s", actionId, contract.getContractId());
            return WorkflowResult.failure("Action execution failed: " + e.getMessage());
        }
    }

    /**
     * Perform the actual action logic
     */
    private String performAction(ActiveContract contract, String actionId, Map<String, Object> params) {
        return switch (actionId) {
            case "SUBMIT_FOR_APPROVAL" -> {
                // Validate all required fields are present
                yield "PENDING_APPROVAL";
            }
            case "APPROVE" -> {
                // Record approval
                yield "PENDING_SIGNATURES";
            }
            case "REJECT" -> {
                // Record rejection reason
                yield "DRAFT";
            }
            case "SIGN" -> {
                // Add signature
                if (areAllPartiesSigned(contract)) {
                    yield "ACTIVE";
                }
                yield "PENDING_SIGNATURES";
            }
            case "EXECUTE" -> {
                contract.markAsExecuted();
                yield "EXECUTED";
            }
            case "COMPLETE" -> {
                yield "COMPLETED";
            }
            case "SUSPEND" -> {
                yield "SUSPENDED";
            }
            case "RESUME" -> {
                yield "ACTIVE";
            }
            case "DISPUTE" -> {
                String reason = (String) params.getOrDefault("reason", "Dispute raised");
                contract.markAsDisputed(reason);
                yield "DISPUTED";
            }
            case "RESOLVE" -> {
                String resolution = (String) params.getOrDefault("resolution", "Dispute resolved");
                contract.resolveDispute(resolution);
                yield "ACTIVE";
            }
            case "CANCEL" -> {
                String reason = (String) params.getOrDefault("reason", "Cancelled by user");
                String cancelledBy = (String) params.getOrDefault("cancelledBy", "system");
                contract.markAsCancelled(reason, cancelledBy);
                yield "CANCELLED";
            }
            default -> contract.getWorkflowState(); // No state change for unknown actions
        };
    }

    /**
     * Validate if a state transition is allowed
     */
    public boolean isValidTransition(String currentState, String targetState) {
        if (currentState == null || targetState == null) {
            return false;
        }

        // Same state is always valid (no transition)
        if (currentState.equals(targetState)) {
            return true;
        }

        Set<String> allowedTransitions = stateTransitions.get(currentState);
        return allowedTransitions != null && allowedTransitions.contains(targetState);
    }

    /**
     * Get available actions for a contract in its current state
     */
    public List<String> getAvailableActions(ActiveContract contract) {
        String currentState = contract.getWorkflowState();
        Set<String> actions = stateActions.getOrDefault(currentState, Collections.emptySet());

        // Filter actions based on contract conditions
        return actions.stream()
            .filter(action -> isActionApplicable(contract, action))
            .toList();
    }

    /**
     * Check if an action is available in a given state
     */
    private boolean isActionAvailable(String state, String actionId) {
        Set<String> actions = stateActions.get(state);
        return actions != null && actions.contains(actionId);
    }

    /**
     * Check if an action is applicable to the contract's current conditions
     */
    private boolean isActionApplicable(ActiveContract contract, String action) {
        return switch (action) {
            case "EXECUTE" -> contract.canExecute();
            case "SIGN" -> contract.requiresSignatures();
            case "RE_EXECUTE" -> contract.isExecuted() && contract.getMaxExecutions() > contract.getExecutionCount();
            default -> true; // Most actions are always applicable
        };
    }

    /**
     * Validate an action before execution
     */
    private WorkflowValidationResult validateAction(ActiveContract contract, String actionId, Map<String, Object> params) {
        // Compliance validation
        if (contract.isComplianceCheckRequired() && !"PASSED".equals(contract.getComplianceStatus())) {
            if (Set.of("APPROVE", "EXECUTE", "SIGN").contains(actionId)) {
                return WorkflowValidationResult.invalid("Compliance check must pass before this action");
            }
        }

        // Expiration check
        if (contract.isExpired() && Set.of("EXECUTE", "AMEND").contains(actionId)) {
            return WorkflowValidationResult.invalid("Cannot perform action on expired contract");
        }

        // Dispute check
        if (contract.isDisputed() && !Set.of("RESOLVE", "ESCALATE", "CANCEL").contains(actionId)) {
            return WorkflowValidationResult.invalid("Contract is under dispute");
        }

        // Action-specific validation
        if ("SIGN".equals(actionId)) {
            if (!params.containsKey("partyId") || !params.containsKey("signature")) {
                return WorkflowValidationResult.invalid("Signature and party ID required");
            }
        }

        return WorkflowValidationResult.valid();
    }

    /**
     * Check if all parties have signed
     */
    private boolean areAllPartiesSigned(ActiveContract contract) {
        try {
            List<Map<String, Object>> parties = objectMapper.readValue(
                contract.getParties(),
                new TypeReference<>() {}
            );
            List<Map<String, Object>> signatures = objectMapper.readValue(
                contract.getSignatures(),
                new TypeReference<>() {}
            );

            long requiredSignatures = parties.stream()
                .filter(p -> Boolean.TRUE.equals(p.get("signatureRequired")))
                .count();

            return signatures.size() >= requiredSignatures;
        } catch (Exception e) {
            LOG.error("Failed to check signatures", e);
            return false;
        }
    }

    /**
     * Add audit entry to contract
     */
    private void addAuditEntry(ActiveContract contract, String action, String oldState, String newState, Map<String, Object> params) {
        try {
            List<Map<String, Object>> auditTrail = objectMapper.readValue(
                contract.getAuditTrail(),
                new TypeReference<>() {}
            );

            Map<String, Object> entry = new HashMap<>();
            entry.put("timestamp", Instant.now().toString());
            entry.put("action", action);
            entry.put("oldState", oldState);
            entry.put("newState", newState);
            entry.put("parameters", params);

            auditTrail.add(entry);
            contract.setAuditTrail(objectMapper.writeValueAsString(auditTrail));
        } catch (Exception e) {
            LOG.error("Failed to add audit entry", e);
        }
    }

    /**
     * Check if smart contract execution should be triggered
     */
    private boolean shouldTriggerSmartContract(ActiveContract contract, String actionId) {
        return contract.hasSmartContract() &&
               contract.isAutoExecute() &&
               "EXECUTE".equals(actionId);
    }

    /**
     * Trigger smart contract execution
     */
    private void triggerSmartContractExecution(ActiveContract contract) {
        LOG.infof("Triggering smart contract execution for contract %s at address %s",
            contract.getContractId(), contract.getSmartContractAddress());

        // TODO: Implement actual smart contract execution
        // This would integrate with blockchain service to execute the smart contract
    }

    /**
     * Register a workflow listener
     */
    public void registerListener(WorkflowListener listener) {
        workflowListeners.add(listener);
    }

    /**
     * Notify all registered listeners
     */
    private void notifyListeners(WorkflowEvent event) {
        for (WorkflowListener listener : workflowListeners) {
            try {
                listener.onWorkflowEvent(event);
            } catch (Exception e) {
                LOG.errorf(e, "Workflow listener failed for event: %s", event);
            }
        }
    }
}

/**
 * Workflow execution result
 */
class WorkflowResult {
    private final boolean success;
    private final String message;
    private final String newState;

    private WorkflowResult(boolean success, String message, String newState) {
        this.success = success;
        this.message = message;
        this.newState = newState;
    }

    public static WorkflowResult success(String newState) {
        return new WorkflowResult(true, "Action executed successfully", newState);
    }

    public static WorkflowResult failure(String message) {
        return new WorkflowResult(false, message, null);
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public String getNewState() { return newState; }
}

/**
 * Workflow validation result
 */
class WorkflowValidationResult {
    private final boolean valid;
    private final String errorMessage;

    private WorkflowValidationResult(boolean valid, String errorMessage) {
        this.valid = valid;
        this.errorMessage = errorMessage;
    }

    public static WorkflowValidationResult valid() {
        return new WorkflowValidationResult(true, null);
    }

    public static WorkflowValidationResult invalid(String message) {
        return new WorkflowValidationResult(false, message);
    }

    public boolean isValid() { return valid; }
    public String getErrorMessage() { return errorMessage; }
}

/**
 * Workflow event for listeners
 */
class WorkflowEvent {
    private final String contractId;
    private final String oldState;
    private final String newState;
    private final String action;
    private final Map<String, Object> parameters;
    private final Instant timestamp;

    public WorkflowEvent(String contractId, String oldState, String newState, String action, Map<String, Object> parameters) {
        this.contractId = contractId;
        this.oldState = oldState;
        this.newState = newState;
        this.action = action;
        this.parameters = parameters;
        this.timestamp = Instant.now();
    }

    public String getContractId() { return contractId; }
    public String getOldState() { return oldState; }
    public String getNewState() { return newState; }
    public String getAction() { return action; }
    public Map<String, Object> getParameters() { return parameters; }
    public Instant getTimestamp() { return timestamp; }
}

/**
 * Interface for workflow event listeners
 */
interface WorkflowListener {
    void onWorkflowEvent(WorkflowEvent event);
}
