package io.aurigraph.v11.contracts.composite.workflow;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Predicate;

/**
 * Workflow State Machine Engine for Composite Token Contracts
 *
 * Implements a thread-safe, high-performance state machine for contract lifecycle management.
 * State transitions follow the pattern: DRAFT -> PENDING_APPROVAL -> ACTIVE <-> SUSPENDED -> TERMINATED
 *
 * Features:
 * - Complex multi-thread safe state machine with atomic transitions
 * - Pre/Post transition hooks for extensible behavior
 * - Transition validation with configurable guards
 * - Complete audit trail for all state changes
 * - Event-driven architecture with async notification
 * - Performance target: <100ms state transition latency
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-01: Workflow State Machine (Sprint 5-7)
 */
@ApplicationScoped
public class WorkflowEngine {

    private static final Logger LOGGER = LoggerFactory.getLogger(WorkflowEngine.class);

    // State machine configuration
    private final Map<WorkflowState, Set<WorkflowState>> validTransitions = new EnumMap<>(WorkflowState.class);
    private final Map<TransitionKey, List<TransitionGuard>> transitionGuards = new ConcurrentHashMap<>();
    private final Map<TransitionKey, List<TransitionHook>> preTransitionHooks = new ConcurrentHashMap<>();
    private final Map<TransitionKey, List<TransitionHook>> postTransitionHooks = new ConcurrentHashMap<>();

    // Workflow instance storage
    private final Map<String, WorkflowInstance> instances = new ConcurrentHashMap<>();
    private final Map<String, List<WorkflowEvent>> eventHistory = new ConcurrentHashMap<>();

    // Thread-safety for state transitions
    private final Map<String, ReentrantReadWriteLock> instanceLocks = new ConcurrentHashMap<>();

    // Performance metrics
    private final AtomicLong totalTransitions = new AtomicLong(0);
    private final AtomicLong successfulTransitions = new AtomicLong(0);
    private final AtomicLong failedTransitions = new AtomicLong(0);
    private final AtomicLong averageTransitionTimeNs = new AtomicLong(0);

    // Event listeners
    private final List<WorkflowEventListener> eventListeners = new ArrayList<>();

    @Inject
    BusinessRulesEngine rulesEngine;

    /**
     * Construct WorkflowEngine with default state machine configuration
     */
    public WorkflowEngine() {
        initializeStateMachine();
        LOGGER.info("WorkflowEngine initialized with {} valid states", WorkflowState.values().length);
    }

    /**
     * Initialize the state machine with valid transitions
     */
    private void initializeStateMachine() {
        // DRAFT can only go to PENDING_APPROVAL
        validTransitions.put(WorkflowState.DRAFT, EnumSet.of(WorkflowState.PENDING_APPROVAL, WorkflowState.TERMINATED));

        // PENDING_APPROVAL can go to ACTIVE or back to DRAFT or TERMINATED
        validTransitions.put(WorkflowState.PENDING_APPROVAL, EnumSet.of(WorkflowState.ACTIVE, WorkflowState.DRAFT, WorkflowState.TERMINATED));

        // ACTIVE can go to SUSPENDED or TERMINATED
        validTransitions.put(WorkflowState.ACTIVE, EnumSet.of(WorkflowState.SUSPENDED, WorkflowState.TERMINATED));

        // SUSPENDED can go back to ACTIVE or to TERMINATED
        validTransitions.put(WorkflowState.SUSPENDED, EnumSet.of(WorkflowState.ACTIVE, WorkflowState.TERMINATED));

        // TERMINATED is a final state
        validTransitions.put(WorkflowState.TERMINATED, EnumSet.noneOf(WorkflowState.class));

        LOGGER.debug("State machine transitions configured: {}", validTransitions);
    }

    /**
     * Create a new workflow instance
     *
     * @param workflowId Unique identifier for the workflow
     * @param entityId   Entity (contract/token) this workflow manages
     * @param entityType Type of entity (CONTRACT, TOKEN, etc.)
     * @param createdBy  User/system that created the workflow
     * @return Created workflow instance
     */
    public Uni<WorkflowInstance> createWorkflow(String workflowId, String entityId,
                                                  EntityType entityType, String createdBy) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Creating workflow: {} for entity: {} ({})", workflowId, entityId, entityType);

            if (instances.containsKey(workflowId)) {
                throw new WorkflowException("Workflow already exists: " + workflowId);
            }

            WorkflowInstance instance = new WorkflowInstance();
            instance.setWorkflowId(workflowId);
            instance.setEntityId(entityId);
            instance.setEntityType(entityType);
            instance.setCurrentState(WorkflowState.DRAFT);
            instance.setCreatedAt(Instant.now());
            instance.setUpdatedAt(Instant.now());
            instance.setCreatedBy(createdBy);
            instance.setVersion(1L);
            instance.setMetadata(new HashMap<>());

            // Initialize lock for this instance
            instanceLocks.put(workflowId, new ReentrantReadWriteLock());

            // Store instance
            instances.put(workflowId, instance);
            eventHistory.put(workflowId, new ArrayList<>());

            // Record creation event
            recordEvent(workflowId, WorkflowEventType.CREATED, null, WorkflowState.DRAFT, createdBy, null);

            LOGGER.info("Workflow created successfully: {} in state {}", workflowId, WorkflowState.DRAFT);
            return instance;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Transition workflow to a new state
     *
     * @param workflowId   Workflow identifier
     * @param targetState  Target state
     * @param triggeredBy  User/system triggering the transition
     * @param reason       Reason for the transition
     * @param context      Additional context for the transition
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> transition(String workflowId, WorkflowState targetState,
                                             String triggeredBy, String reason, Map<String, Object> context) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            totalTransitions.incrementAndGet();

            LOGGER.info("Transitioning workflow {} to state {}", workflowId, targetState);

            ReentrantReadWriteLock lock = instanceLocks.get(workflowId);
            if (lock == null) {
                throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
            }

            lock.writeLock().lock();
            try {
                WorkflowInstance instance = instances.get(workflowId);
                if (instance == null) {
                    throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
                }

                WorkflowState currentState = instance.getCurrentState();

                // Validate transition
                if (!isValidTransition(currentState, targetState)) {
                    failedTransitions.incrementAndGet();
                    throw new InvalidTransitionException(
                        String.format("Invalid transition from %s to %s", currentState, targetState));
                }

                // Check transition guards
                TransitionKey key = new TransitionKey(currentState, targetState);
                List<TransitionGuard> guards = transitionGuards.getOrDefault(key, Collections.emptyList());
                for (TransitionGuard guard : guards) {
                    if (!guard.evaluate(instance, context)) {
                        failedTransitions.incrementAndGet();
                        throw new TransitionGuardException("Transition guard failed: " + guard.getName());
                    }
                }

                // Execute pre-transition hooks
                List<TransitionHook> preHooks = preTransitionHooks.getOrDefault(key, Collections.emptyList());
                for (TransitionHook hook : preHooks) {
                    hook.execute(instance, currentState, targetState, context);
                }

                // Perform state transition
                WorkflowState previousState = instance.getCurrentState();
                instance.setCurrentState(targetState);
                instance.setUpdatedAt(Instant.now());
                instance.setVersion(instance.getVersion() + 1);
                instance.setLastTransitionBy(triggeredBy);
                instance.setLastTransitionReason(reason);

                // Add to state history
                instance.addStateHistoryEntry(new StateHistoryEntry(
                    previousState, targetState, triggeredBy, reason, Instant.now()
                ));

                // Execute post-transition hooks
                List<TransitionHook> postHooks = postTransitionHooks.getOrDefault(key, Collections.emptyList());
                for (TransitionHook hook : postHooks) {
                    hook.execute(instance, previousState, targetState, context);
                }

                // Record transition event
                recordEvent(workflowId, WorkflowEventType.TRANSITION, previousState, targetState, triggeredBy, reason);

                // Notify listeners
                notifyListeners(new WorkflowEvent(
                    workflowId, WorkflowEventType.TRANSITION, previousState, targetState,
                    triggeredBy, reason, Instant.now()
                ));

                successfulTransitions.incrementAndGet();

                // Update performance metrics
                long transitionTime = System.nanoTime() - startTime;
                updateAverageTransitionTime(transitionTime);

                LOGGER.info("Workflow {} transitioned from {} to {} in {}ms",
                    workflowId, previousState, targetState, transitionTime / 1_000_000);

                return instance;

            } finally {
                lock.writeLock().unlock();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Submit workflow for approval
     *
     * @param workflowId  Workflow identifier
     * @param submittedBy User submitting for approval
     * @param approvers   List of required approvers
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> submitForApproval(String workflowId, String submittedBy, List<String> approvers) {
        return Uni.createFrom().item(() -> {
            WorkflowInstance instance = instances.get(workflowId);
            if (instance == null) {
                throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
            }

            // Set required approvers
            instance.setRequiredApprovers(new ArrayList<>(approvers));
            instance.setApprovals(new HashMap<>());
            instance.getMetadata().put("submittedForApprovalAt", Instant.now().toString());
            instance.getMetadata().put("submittedForApprovalBy", submittedBy);

            return instance;
        }).flatMap(instance -> transition(workflowId, WorkflowState.PENDING_APPROVAL, submittedBy,
            "Submitted for approval", Map.of("approvers", instance.getRequiredApprovers())));
    }

    /**
     * Approve workflow
     *
     * @param workflowId  Workflow identifier
     * @param approver    Approver identifier
     * @param comments    Approval comments
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> approve(String workflowId, String approver, String comments) {
        return Uni.createFrom().item(() -> {
            ReentrantReadWriteLock lock = instanceLocks.get(workflowId);
            if (lock == null) {
                throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
            }

            lock.writeLock().lock();
            try {
                WorkflowInstance instance = instances.get(workflowId);
                if (instance == null) {
                    throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
                }

                if (instance.getCurrentState() != WorkflowState.PENDING_APPROVAL) {
                    throw new WorkflowException("Workflow is not pending approval: " + instance.getCurrentState());
                }

                // Check if approver is in required approvers
                if (instance.getRequiredApprovers() != null &&
                    !instance.getRequiredApprovers().isEmpty() &&
                    !instance.getRequiredApprovers().contains(approver)) {
                    throw new WorkflowException("User is not an authorized approver: " + approver);
                }

                // Record approval
                ApprovalRecord approval = new ApprovalRecord(approver, true, comments, Instant.now());
                instance.getApprovals().put(approver, approval);
                instance.setUpdatedAt(Instant.now());

                // Record event
                recordEvent(workflowId, WorkflowEventType.APPROVED, null, null, approver, comments);

                return instance;
            } finally {
                lock.writeLock().unlock();
            }
        }).flatMap(instance -> {
            // Check if all required approvals are obtained
            if (isFullyApproved(instance)) {
                return transition(workflowId, WorkflowState.ACTIVE, "system",
                    "All required approvals obtained", Map.of());
            }
            return Uni.createFrom().item(instance);
        });
    }

    /**
     * Reject workflow during approval
     *
     * @param workflowId  Workflow identifier
     * @param rejectedBy  User rejecting the workflow
     * @param reason      Rejection reason
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> reject(String workflowId, String rejectedBy, String reason) {
        return Uni.createFrom().item(() -> {
            ReentrantReadWriteLock lock = instanceLocks.get(workflowId);
            if (lock == null) {
                throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
            }

            lock.writeLock().lock();
            try {
                WorkflowInstance instance = instances.get(workflowId);
                if (instance == null) {
                    throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
                }

                // Record rejection
                ApprovalRecord rejection = new ApprovalRecord(rejectedBy, false, reason, Instant.now());
                instance.getApprovals().put(rejectedBy, rejection);
                instance.setRejectedBy(rejectedBy);
                instance.setRejectionReason(reason);
                instance.setRejectedAt(Instant.now());

                // Record event
                recordEvent(workflowId, WorkflowEventType.REJECTED, null, null, rejectedBy, reason);

                return instance;
            } finally {
                lock.writeLock().unlock();
            }
        }).flatMap(instance -> transition(workflowId, WorkflowState.DRAFT, rejectedBy,
            "Rejected: " + reason, Map.of()));
    }

    /**
     * Suspend an active workflow
     *
     * @param workflowId   Workflow identifier
     * @param suspendedBy  User suspending the workflow
     * @param reason       Suspension reason
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> suspend(String workflowId, String suspendedBy, String reason) {
        return transition(workflowId, WorkflowState.SUSPENDED, suspendedBy, reason, Map.of("suspendedBy", suspendedBy));
    }

    /**
     * Resume a suspended workflow
     *
     * @param workflowId  Workflow identifier
     * @param resumedBy   User resuming the workflow
     * @param reason      Resume reason
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> resume(String workflowId, String resumedBy, String reason) {
        return transition(workflowId, WorkflowState.ACTIVE, resumedBy, reason, Map.of("resumedBy", resumedBy));
    }

    /**
     * Terminate a workflow
     *
     * @param workflowId    Workflow identifier
     * @param terminatedBy  User terminating the workflow
     * @param reason        Termination reason
     * @return Updated workflow instance
     */
    public Uni<WorkflowInstance> terminate(String workflowId, String terminatedBy, String reason) {
        return Uni.createFrom().item(() -> {
            WorkflowInstance instance = instances.get(workflowId);
            if (instance != null) {
                instance.setTerminatedAt(Instant.now());
                instance.setTerminatedBy(terminatedBy);
                instance.setTerminationReason(reason);
            }
            return instance;
        }).flatMap(instance -> transition(workflowId, WorkflowState.TERMINATED, terminatedBy, reason, Map.of()));
    }

    /**
     * Get workflow instance by ID
     *
     * @param workflowId Workflow identifier
     * @return Workflow instance
     */
    public Uni<WorkflowInstance> getWorkflow(String workflowId) {
        return Uni.createFrom().item(() -> {
            WorkflowInstance instance = instances.get(workflowId);
            if (instance == null) {
                throw new WorkflowNotFoundException("Workflow not found: " + workflowId);
            }
            return instance;
        });
    }

    /**
     * Get workflow by entity ID
     *
     * @param entityId Entity identifier
     * @return List of workflows for the entity
     */
    public Uni<List<WorkflowInstance>> getWorkflowsByEntity(String entityId) {
        return Uni.createFrom().item(() ->
            instances.values().stream()
                .filter(i -> i.getEntityId().equals(entityId))
                .toList()
        );
    }

    /**
     * Get workflows by state
     *
     * @param state Workflow state to filter by
     * @return List of workflows in the given state
     */
    public Uni<List<WorkflowInstance>> getWorkflowsByState(WorkflowState state) {
        return Uni.createFrom().item(() ->
            instances.values().stream()
                .filter(i -> i.getCurrentState() == state)
                .toList()
        );
    }

    /**
     * Get event history for a workflow
     *
     * @param workflowId Workflow identifier
     * @return List of workflow events
     */
    public Uni<List<WorkflowEvent>> getEventHistory(String workflowId) {
        return Uni.createFrom().item(() -> {
            List<WorkflowEvent> history = eventHistory.get(workflowId);
            return history != null ? new ArrayList<>(history) : new ArrayList<>();
        });
    }

    /**
     * Register a transition guard
     *
     * @param fromState Source state
     * @param toState   Target state
     * @param guard     Guard to register
     */
    public void registerTransitionGuard(WorkflowState fromState, WorkflowState toState, TransitionGuard guard) {
        TransitionKey key = new TransitionKey(fromState, toState);
        transitionGuards.computeIfAbsent(key, k -> new ArrayList<>()).add(guard);
        LOGGER.debug("Registered transition guard for {} -> {}: {}", fromState, toState, guard.getName());
    }

    /**
     * Register a pre-transition hook
     *
     * @param fromState Source state
     * @param toState   Target state
     * @param hook      Hook to register
     */
    public void registerPreTransitionHook(WorkflowState fromState, WorkflowState toState, TransitionHook hook) {
        TransitionKey key = new TransitionKey(fromState, toState);
        preTransitionHooks.computeIfAbsent(key, k -> new ArrayList<>()).add(hook);
        LOGGER.debug("Registered pre-transition hook for {} -> {}", fromState, toState);
    }

    /**
     * Register a post-transition hook
     *
     * @param fromState Source state
     * @param toState   Target state
     * @param hook      Hook to register
     */
    public void registerPostTransitionHook(WorkflowState fromState, WorkflowState toState, TransitionHook hook) {
        TransitionKey key = new TransitionKey(fromState, toState);
        postTransitionHooks.computeIfAbsent(key, k -> new ArrayList<>()).add(hook);
        LOGGER.debug("Registered post-transition hook for {} -> {}", fromState, toState);
    }

    /**
     * Add an event listener
     *
     * @param listener Event listener to add
     */
    public void addEventListener(WorkflowEventListener listener) {
        eventListeners.add(listener);
    }

    /**
     * Remove an event listener
     *
     * @param listener Event listener to remove
     */
    public void removeEventListener(WorkflowEventListener listener) {
        eventListeners.remove(listener);
    }

    /**
     * Check if a transition is valid
     *
     * @param fromState Source state
     * @param toState   Target state
     * @return true if transition is valid
     */
    public boolean isValidTransition(WorkflowState fromState, WorkflowState toState) {
        Set<WorkflowState> allowed = validTransitions.get(fromState);
        return allowed != null && allowed.contains(toState);
    }

    /**
     * Get valid transitions from a state
     *
     * @param state Current state
     * @return Set of valid target states
     */
    public Set<WorkflowState> getValidTransitions(WorkflowState state) {
        return validTransitions.getOrDefault(state, EnumSet.noneOf(WorkflowState.class));
    }

    /**
     * Get workflow engine metrics
     *
     * @return Map of metrics
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalWorkflows", instances.size());
        metrics.put("totalTransitions", totalTransitions.get());
        metrics.put("successfulTransitions", successfulTransitions.get());
        metrics.put("failedTransitions", failedTransitions.get());
        metrics.put("averageTransitionTimeMs", averageTransitionTimeNs.get() / 1_000_000.0);

        // Count by state
        Map<WorkflowState, Long> byState = new EnumMap<>(WorkflowState.class);
        for (WorkflowState state : WorkflowState.values()) {
            long count = instances.values().stream()
                .filter(i -> i.getCurrentState() == state)
                .count();
            byState.put(state, count);
        }
        metrics.put("workflowsByState", byState);

        return metrics;
    }

    // ========== Private Helper Methods ==========

    private boolean isFullyApproved(WorkflowInstance instance) {
        if (instance.getRequiredApprovers() == null || instance.getRequiredApprovers().isEmpty()) {
            return true; // No approvers required
        }

        Map<String, ApprovalRecord> approvals = instance.getApprovals();
        if (approvals == null) {
            return false;
        }

        for (String approver : instance.getRequiredApprovers()) {
            ApprovalRecord record = approvals.get(approver);
            if (record == null || !record.approved()) {
                return false;
            }
        }

        return true;
    }

    private void recordEvent(String workflowId, WorkflowEventType eventType,
                            WorkflowState fromState, WorkflowState toState,
                            String triggeredBy, String details) {
        WorkflowEvent event = new WorkflowEvent(
            workflowId, eventType, fromState, toState, triggeredBy, details, Instant.now()
        );
        eventHistory.computeIfAbsent(workflowId, k -> new ArrayList<>()).add(event);
    }

    private void notifyListeners(WorkflowEvent event) {
        for (WorkflowEventListener listener : eventListeners) {
            try {
                listener.onEvent(event);
            } catch (Exception e) {
                LOGGER.error("Error notifying workflow listener: {}", e.getMessage());
            }
        }
    }

    private void updateAverageTransitionTime(long transitionTimeNs) {
        long currentAvg = averageTransitionTimeNs.get();
        long count = successfulTransitions.get();
        if (count > 0) {
            long newAvg = (currentAvg * (count - 1) + transitionTimeNs) / count;
            averageTransitionTimeNs.set(newAvg);
        }
    }

    // ========== Nested Classes and Enums ==========

    /**
     * Workflow states for contract lifecycle
     */
    public enum WorkflowState {
        DRAFT("Draft", "Initial state before submission"),
        PENDING_APPROVAL("Pending Approval", "Awaiting approval from designated approvers"),
        ACTIVE("Active", "Contract is active and operational"),
        SUSPENDED("Suspended", "Contract is temporarily suspended"),
        TERMINATED("Terminated", "Contract has been terminated (final state)");

        private final String displayName;
        private final String description;

        WorkflowState(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
        public boolean isFinal() { return this == TERMINATED; }
        public boolean isActive() { return this == ACTIVE; }
    }

    /**
     * Entity types that can have workflows
     */
    public enum EntityType {
        CONTRACT, TOKEN, COMPOSITE_TOKEN, ASSET, DOCUMENT
    }

    /**
     * Workflow event types
     */
    public enum WorkflowEventType {
        CREATED, TRANSITION, APPROVED, REJECTED, SUSPENDED, RESUMED, TERMINATED
    }

    /**
     * Key for transition-specific guards and hooks
     */
    private record TransitionKey(WorkflowState from, WorkflowState to) {}

    /**
     * Workflow instance representing an active workflow
     */
    public static class WorkflowInstance {
        private String workflowId;
        private String entityId;
        private EntityType entityType;
        private WorkflowState currentState;
        private Instant createdAt;
        private Instant updatedAt;
        private String createdBy;
        private String lastTransitionBy;
        private String lastTransitionReason;
        private Long version;
        private Map<String, Object> metadata;
        private List<String> requiredApprovers;
        private Map<String, ApprovalRecord> approvals;
        private String rejectedBy;
        private String rejectionReason;
        private Instant rejectedAt;
        private String terminatedBy;
        private String terminationReason;
        private Instant terminatedAt;
        private List<StateHistoryEntry> stateHistory = new ArrayList<>();

        // Getters and Setters
        public String getWorkflowId() { return workflowId; }
        public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }
        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }
        public EntityType getEntityType() { return entityType; }
        public void setEntityType(EntityType entityType) { this.entityType = entityType; }
        public WorkflowState getCurrentState() { return currentState; }
        public void setCurrentState(WorkflowState currentState) { this.currentState = currentState; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
        public String getLastTransitionBy() { return lastTransitionBy; }
        public void setLastTransitionBy(String lastTransitionBy) { this.lastTransitionBy = lastTransitionBy; }
        public String getLastTransitionReason() { return lastTransitionReason; }
        public void setLastTransitionReason(String lastTransitionReason) { this.lastTransitionReason = lastTransitionReason; }
        public Long getVersion() { return version; }
        public void setVersion(Long version) { this.version = version; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
        public List<String> getRequiredApprovers() { return requiredApprovers; }
        public void setRequiredApprovers(List<String> requiredApprovers) { this.requiredApprovers = requiredApprovers; }
        public Map<String, ApprovalRecord> getApprovals() { return approvals; }
        public void setApprovals(Map<String, ApprovalRecord> approvals) { this.approvals = approvals; }
        public String getRejectedBy() { return rejectedBy; }
        public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }
        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
        public Instant getRejectedAt() { return rejectedAt; }
        public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }
        public String getTerminatedBy() { return terminatedBy; }
        public void setTerminatedBy(String terminatedBy) { this.terminatedBy = terminatedBy; }
        public String getTerminationReason() { return terminationReason; }
        public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }
        public Instant getTerminatedAt() { return terminatedAt; }
        public void setTerminatedAt(Instant terminatedAt) { this.terminatedAt = terminatedAt; }
        public List<StateHistoryEntry> getStateHistory() { return stateHistory; }

        public void addStateHistoryEntry(StateHistoryEntry entry) {
            if (stateHistory == null) {
                stateHistory = new ArrayList<>();
            }
            stateHistory.add(entry);
        }
    }

    /**
     * State history entry for audit trail
     */
    public record StateHistoryEntry(
        WorkflowState fromState,
        WorkflowState toState,
        String changedBy,
        String reason,
        Instant timestamp
    ) {}

    /**
     * Approval record for workflow approvals
     */
    public record ApprovalRecord(
        String approverId,
        boolean approved,
        String comments,
        Instant timestamp
    ) {}

    /**
     * Workflow event for notifications and history
     */
    public record WorkflowEvent(
        String workflowId,
        WorkflowEventType eventType,
        WorkflowState fromState,
        WorkflowState toState,
        String triggeredBy,
        String details,
        Instant timestamp
    ) {}

    /**
     * Interface for transition guards
     */
    @FunctionalInterface
    public interface TransitionGuard {
        boolean evaluate(WorkflowInstance instance, Map<String, Object> context);
        default String getName() { return "Anonymous Guard"; }
    }

    /**
     * Interface for transition hooks
     */
    @FunctionalInterface
    public interface TransitionHook {
        void execute(WorkflowInstance instance, WorkflowState fromState,
                     WorkflowState toState, Map<String, Object> context);
    }

    /**
     * Interface for workflow event listeners
     */
    @FunctionalInterface
    public interface WorkflowEventListener {
        void onEvent(WorkflowEvent event);
    }

    // ========== Custom Exceptions ==========

    public static class WorkflowException extends RuntimeException {
        public WorkflowException(String message) { super(message); }
    }

    public static class WorkflowNotFoundException extends WorkflowException {
        public WorkflowNotFoundException(String message) { super(message); }
    }

    public static class InvalidTransitionException extends WorkflowException {
        public InvalidTransitionException(String message) { super(message); }
    }

    public static class TransitionGuardException extends WorkflowException {
        public TransitionGuardException(String message) { super(message); }
    }
}
