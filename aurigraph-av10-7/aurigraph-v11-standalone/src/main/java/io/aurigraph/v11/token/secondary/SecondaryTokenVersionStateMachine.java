package io.aurigraph.v11.token.secondary;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Secondary Token Version State Machine - Sprint 1 Task 1.4 (AV11-601)
 *
 * Enforces valid state transitions for secondary token versions during
 * their lifecycle management. Implements state entry/exit actions, timeout
 * rules, and transition validation.
 *
 * <h3>State Diagram</h3>
 * <pre>
 * CREATED → PENDING_VVB → APPROVED → ACTIVE → REPLACED → ARCHIVED
 *                ↓                              ↓
 *              REJECTED                     EXPIRED
 * </pre>
 *
 * <h3>State Transition Rules</h3>
 * <ul>
 *   <li>CREATED → PENDING_VVB: Always allowed (submit for verification)</li>
 *   <li>CREATED → ARCHIVED: Only if changeType != OWNERSHIP</li>
 *   <li>PENDING_VVB → APPROVED: Only if VVB approved</li>
 *   <li>PENDING_VVB → REJECTED: Only if VVB rejected</li>
 *   <li>PENDING_VVB → ARCHIVED: Only if cancelled</li>
 *   <li>APPROVED → ACTIVE: Always allowed (activation)</li>
 *   <li>ACTIVE → REPLACED: Always allowed (superseded by new version)</li>
 *   <li>ACTIVE → EXPIRED: Always allowed (time-based expiration)</li>
 *   <li>REPLACED → ARCHIVED: Always allowed (cleanup)</li>
 *   <li>EXPIRED → ARCHIVED: Always allowed (cleanup)</li>
 * </ul>
 *
 * <h3>State Timeouts</h3>
 * <ul>
 *   <li>CREATED: 30 days → Auto-archive</li>
 *   <li>PENDING_VVB: 7 days → Auto-reject</li>
 *   <li>APPROVED: No timeout</li>
 *   <li>ACTIVE: No timeout (unless parent token expires)</li>
 * </ul>
 *
 * <h3>Performance Requirements</h3>
 * <ul>
 *   <li>canTransition(): &lt; 1ms (O(1) lookup)</li>
 *   <li>getValidTransitions(): &lt; 1ms (O(1) lookup)</li>
 *   <li>validateTransition(): &lt; 1ms (O(1) lookup + validation)</li>
 * </ul>
 *
 * @author Composite Token System - Sprint 1 Task 1.4
 * @version 1.0
 * @since Sprint 1 Task 1.4 (Week 1)
 */
@ApplicationScoped
public class SecondaryTokenVersionStateMachine {

    private static final Logger LOG = Logger.getLogger(SecondaryTokenVersionStateMachine.class);

    /**
     * State transition map: fromStatus → Set<toStatus>
     * Immutable map for O(1) lookups
     */
    private static final Map<SecondaryTokenVersionStatus, Set<SecondaryTokenVersionStatus>> STATE_TRANSITIONS;

    /**
     * State timeout map: status → Duration
     * Defines how long a version can remain in each state
     */
    private static final Map<SecondaryTokenVersionStatus, Duration> STATE_TIMEOUTS;

    static {
        // Initialize state transitions (immutable)
        Map<SecondaryTokenVersionStatus, Set<SecondaryTokenVersionStatus>> transitions = new EnumMap<>(SecondaryTokenVersionStatus.class);

        transitions.put(SecondaryTokenVersionStatus.CREATED,
            EnumSet.of(SecondaryTokenVersionStatus.PENDING_VVB, SecondaryTokenVersionStatus.ARCHIVED));

        transitions.put(SecondaryTokenVersionStatus.PENDING_VVB,
            EnumSet.of(SecondaryTokenVersionStatus.APPROVED, SecondaryTokenVersionStatus.REJECTED, SecondaryTokenVersionStatus.ARCHIVED));

        transitions.put(SecondaryTokenVersionStatus.APPROVED,
            EnumSet.of(SecondaryTokenVersionStatus.ACTIVE));

        transitions.put(SecondaryTokenVersionStatus.ACTIVE,
            EnumSet.of(SecondaryTokenVersionStatus.REPLACED, SecondaryTokenVersionStatus.EXPIRED));

        transitions.put(SecondaryTokenVersionStatus.REPLACED,
            EnumSet.of(SecondaryTokenVersionStatus.ARCHIVED));

        transitions.put(SecondaryTokenVersionStatus.EXPIRED,
            EnumSet.of(SecondaryTokenVersionStatus.ARCHIVED));

        transitions.put(SecondaryTokenVersionStatus.REJECTED,
            EnumSet.noneOf(SecondaryTokenVersionStatus.class)); // Terminal state

        transitions.put(SecondaryTokenVersionStatus.ARCHIVED,
            EnumSet.noneOf(SecondaryTokenVersionStatus.class)); // Terminal state

        STATE_TRANSITIONS = Collections.unmodifiableMap(transitions);

        // Initialize state timeouts
        Map<SecondaryTokenVersionStatus, Duration> timeouts = new EnumMap<>(SecondaryTokenVersionStatus.class);
        timeouts.put(SecondaryTokenVersionStatus.CREATED, Duration.ofDays(30));
        timeouts.put(SecondaryTokenVersionStatus.PENDING_VVB, Duration.ofDays(7));
        timeouts.put(SecondaryTokenVersionStatus.APPROVED, Duration.ZERO); // No timeout
        timeouts.put(SecondaryTokenVersionStatus.ACTIVE, Duration.ZERO); // No timeout
        timeouts.put(SecondaryTokenVersionStatus.REPLACED, Duration.ZERO); // No timeout
        timeouts.put(SecondaryTokenVersionStatus.EXPIRED, Duration.ZERO); // No timeout
        timeouts.put(SecondaryTokenVersionStatus.REJECTED, Duration.ZERO); // Terminal
        timeouts.put(SecondaryTokenVersionStatus.ARCHIVED, Duration.ZERO); // Terminal

        STATE_TIMEOUTS = Collections.unmodifiableMap(timeouts);
    }

    @Inject
    Event<StateTransitionEvent> stateTransitionEvent;

    /**
     * Get all valid transitions from a given status
     *
     * @param currentStatus The current status
     * @return Set of valid next statuses (unmodifiable)
     */
    public Set<SecondaryTokenVersionStatus> getValidTransitions(SecondaryTokenVersionStatus currentStatus) {
        if (currentStatus == null) {
            return Collections.emptySet();
        }
        Set<SecondaryTokenVersionStatus> transitions = STATE_TRANSITIONS.get(currentStatus);
        return transitions != null ? transitions : Collections.emptySet();
    }

    /**
     * Check if a state transition is valid
     *
     * @param fromStatus Current status
     * @param toStatus Target status
     * @return true if transition is allowed, false otherwise
     */
    public boolean canTransition(SecondaryTokenVersionStatus fromStatus, SecondaryTokenVersionStatus toStatus) {
        if (fromStatus == null || toStatus == null) {
            return false;
        }
        if (fromStatus == toStatus) {
            return false; // No self-transitions
        }
        Set<SecondaryTokenVersionStatus> validTransitions = getValidTransitions(fromStatus);
        return validTransitions.contains(toStatus);
    }

    /**
     * Validate a state transition, throwing exception if invalid
     *
     * @param fromStatus Current status
     * @param toStatus Target status
     * @throws IllegalStateException if transition is not allowed
     */
    public void validateTransition(SecondaryTokenVersionStatus fromStatus, SecondaryTokenVersionStatus toStatus) {
        if (!canTransition(fromStatus, toStatus)) {
            String reason = getTransitionReason(fromStatus, toStatus);
            throw new IllegalStateException(
                String.format("Invalid state transition from %s to %s: %s", fromStatus, toStatus, reason)
            );
        }
    }

    /**
     * Execute entry actions when entering a new state
     *
     * @param status The state being entered
     * @param version The token version transitioning (use VersionAdapter)
     */
    public void onEntryState(SecondaryTokenVersionStatus status, VersionAdapter version) {
        if (status == null || version == null) {
            return;
        }

        LOG.infof("Entering state %s for version %s", status, version.versionId);

        switch (status) {
            case CREATED:
                version.createdAt = Instant.now();
                break;

            case PENDING_VVB:
                version.submittedForVVBAt = Instant.now();
                LOG.infof("Version %s submitted for VVB verification", version.versionId);
                break;

            case APPROVED:
                version.approvedAt = Instant.now();
                fireStateTransitionEvent(version, SecondaryTokenVersionStatus.PENDING_VVB, status, "VVB Approved");
                break;

            case ACTIVE:
                version.activatedAt = Instant.now();
                fireStateTransitionEvent(version, SecondaryTokenVersionStatus.APPROVED, status, "Version Activated");
                LOG.infof("Version %s is now ACTIVE", version.versionId);
                break;

            case REPLACED:
                version.replacedAt = Instant.now();
                fireStateTransitionEvent(version, SecondaryTokenVersionStatus.ACTIVE, status, "Version Replaced");
                break;

            case EXPIRED:
                version.expiredAt = Instant.now();
                fireStateTransitionEvent(version, SecondaryTokenVersionStatus.ACTIVE, status, "Version Expired");
                break;

            case REJECTED:
                version.rejectedAt = Instant.now();
                fireStateTransitionEvent(version, SecondaryTokenVersionStatus.PENDING_VVB, status, "VVB Rejected");
                LOG.warnf("Version %s was REJECTED by VVB", version.versionId);
                break;

            case ARCHIVED:
                version.archivedAt = Instant.now();
                LOG.infof("Version %s archived", version.versionId);
                break;
        }

        version.updatedAt = Instant.now();
    }

    /**
     * Execute exit actions when leaving a state
     *
     * @param status The state being exited
     * @param version The token version transitioning (use VersionAdapter)
     */
    public void onExitState(SecondaryTokenVersionStatus status, VersionAdapter version) {
        if (status == null || version == null) {
            return;
        }

        LOG.infof("Exiting state %s for version %s", status, version.versionId);

        switch (status) {
            case PENDING_VVB:
                // Cancel any pending VVB submissions if timeout
                if (isTimeoutExpired(version, status)) {
                    LOG.warnf("Version %s timed out in PENDING_VVB state", version.versionId);
                    // Additional cleanup logic can be added here
                }
                break;

            case CREATED:
                // Log if version created but never submitted
                if (isTimeoutExpired(version, status)) {
                    LOG.warnf("Version %s timed out in CREATED state", version.versionId);
                }
                break;

            case ACTIVE:
                // Version is being superseded or expired
                LOG.infof("Version %s leaving ACTIVE state", version.versionId);
                break;

            default:
                // No special exit actions for other states
                break;
        }
    }

    /**
     * Get timeout duration for a given state
     *
     * @param status The status to check
     * @return Duration for the timeout, or Duration.ZERO if no timeout
     */
    public Duration getStateTimeout(SecondaryTokenVersionStatus status) {
        if (status == null) {
            return Duration.ZERO;
        }
        return STATE_TIMEOUTS.getOrDefault(status, Duration.ZERO);
    }

    /**
     * Check if a version has exceeded its timeout in the current state
     *
     * @param version The token version to check (use VersionAdapter)
     * @param currentStatus The current status of the version
     * @return true if timeout expired, false otherwise
     */
    public boolean isTimeoutExpired(VersionAdapter version, SecondaryTokenVersionStatus currentStatus) {
        if (version == null || currentStatus == null) {
            return false;
        }

        Duration timeout = getStateTimeout(currentStatus);
        if (timeout.isZero()) {
            return false; // No timeout configured
        }

        Instant stateEntryTime = getStateEntryTime(version, currentStatus);
        if (stateEntryTime == null) {
            return false;
        }

        Instant now = Instant.now();
        Duration elapsed = Duration.between(stateEntryTime, now);
        return elapsed.compareTo(timeout) > 0;
    }

    /**
     * Get human-readable reason for transition allowance/disallowance
     *
     * @param fromStatus Current status
     * @param toStatus Target status
     * @return Description of transition rule
     */
    public String getTransitionReason(SecondaryTokenVersionStatus fromStatus, SecondaryTokenVersionStatus toStatus) {
        if (fromStatus == null || toStatus == null) {
            return "Invalid status: fromStatus or toStatus is null";
        }

        if (fromStatus == toStatus) {
            return "Self-transitions are not allowed";
        }

        if (!STATE_TRANSITIONS.containsKey(fromStatus)) {
            return "Unknown source state: " + fromStatus;
        }

        Set<SecondaryTokenVersionStatus> validTransitions = getValidTransitions(fromStatus);
        if (validTransitions.contains(toStatus)) {
            return String.format("Valid transition: %s allows transition to %s", fromStatus, toStatus);
        }

        // Provide specific reasons for invalid transitions
        if (fromStatus == SecondaryTokenVersionStatus.CREATED) {
            if (toStatus == SecondaryTokenVersionStatus.ARCHIVED) {
                return "CREATED → ARCHIVED allowed only if changeType != OWNERSHIP";
            }
            return "From CREATED, can only transition to PENDING_VVB or ARCHIVED";
        }

        if (fromStatus == SecondaryTokenVersionStatus.PENDING_VVB) {
            return "From PENDING_VVB, can only transition to APPROVED, REJECTED, or ARCHIVED";
        }

        if (fromStatus == SecondaryTokenVersionStatus.APPROVED) {
            return "From APPROVED, can only transition to ACTIVE";
        }

        if (fromStatus == SecondaryTokenVersionStatus.ACTIVE) {
            return "From ACTIVE, can only transition to REPLACED or EXPIRED";
        }

        if (fromStatus == SecondaryTokenVersionStatus.REPLACED || fromStatus == SecondaryTokenVersionStatus.EXPIRED) {
            return String.format("From %s, can only transition to ARCHIVED", fromStatus);
        }

        if (fromStatus == SecondaryTokenVersionStatus.REJECTED || fromStatus == SecondaryTokenVersionStatus.ARCHIVED) {
            return String.format("%s is a terminal state - no transitions allowed", fromStatus);
        }

        return String.format("Transition from %s to %s is not defined in state machine", fromStatus, toStatus);
    }

    /**
     * Get the timestamp when the version entered its current state
     */
    private Instant getStateEntryTime(VersionAdapter version, SecondaryTokenVersionStatus status) {
        switch (status) {
            case CREATED: return version.createdAt;
            case PENDING_VVB: return version.submittedForVVBAt;
            case APPROVED: return version.approvedAt;
            case ACTIVE: return version.activatedAt;
            case REPLACED: return version.replacedAt;
            case EXPIRED: return version.expiredAt;
            case REJECTED: return version.rejectedAt;
            case ARCHIVED: return version.archivedAt;
            default: return null;
        }
    }

    /**
     * Fire CDI event for state transition
     */
    private void fireStateTransitionEvent(VersionAdapter version,
                                         SecondaryTokenVersionStatus fromStatus,
                                         SecondaryTokenVersionStatus toStatus,
                                         String reason) {
        StateTransitionEvent event = new StateTransitionEvent(
            version.versionId,
            fromStatus,
            toStatus,
            version.actorId,
            reason,
            Instant.now()
        );
        stateTransitionEvent.fire(event);
    }

    // =============== INNER CLASSES ===============

    /**
     * State transition context for tracking transitions
     */
    public static class TransitionContext {
        public final SecondaryTokenVersionStatus fromStatus;
        public final SecondaryTokenVersionStatus toStatus;
        public final String actor;
        public final String reason;
        public final Instant timestamp;

        public TransitionContext(SecondaryTokenVersionStatus fromStatus,
                                SecondaryTokenVersionStatus toStatus,
                                String actor,
                                String reason,
                                Instant timestamp) {
            this.fromStatus = fromStatus;
            this.toStatus = toStatus;
            this.actor = actor;
            this.reason = reason;
            this.timestamp = timestamp;
        }

        @Override
        public String toString() {
            return String.format("TransitionContext{%s → %s, actor=%s, reason=%s, time=%s}",
                fromStatus, toStatus, actor, reason, timestamp);
        }
    }

    /**
     * State timeout configuration
     */
    public static class StateTimeout {
        public final SecondaryTokenVersionStatus status;
        public final Duration duration;
        public final String action;

        public StateTimeout(SecondaryTokenVersionStatus status, Duration duration, String action) {
            this.status = status;
            this.duration = duration;
            this.action = action;
        }

        @Override
        public String toString() {
            return String.format("StateTimeout{status=%s, duration=%s, action=%s}",
                status, duration, action);
        }
    }

    /**
     * CDI Event: State Transition
     */
    public static class StateTransitionEvent {
        public final String versionId;
        public final SecondaryTokenVersionStatus fromStatus;
        public final SecondaryTokenVersionStatus toStatus;
        public final String actor;
        public final String reason;
        public final Instant timestamp;

        public StateTransitionEvent(String versionId,
                                   SecondaryTokenVersionStatus fromStatus,
                                   SecondaryTokenVersionStatus toStatus,
                                   String actor,
                                   String reason,
                                   Instant timestamp) {
            this.versionId = versionId;
            this.fromStatus = fromStatus;
            this.toStatus = toStatus;
            this.actor = actor;
            this.reason = reason;
            this.timestamp = timestamp;
        }

        @Override
        public String toString() {
            return String.format("StateTransitionEvent{versionId=%s, %s → %s, actor=%s, reason=%s}",
                versionId, fromStatus, toStatus, actor, reason);
        }
    }

    /**
     * Adapter for SecondaryTokenVersion entity
     * Wraps the actual entity to provide state machine operations
     */
    public static class VersionAdapter {
        public String versionId;
        public String actorId;
        public VersionChangeType changeType;

        // State entry timestamps
        public Instant createdAt;
        public Instant submittedForVVBAt;
        public Instant approvedAt;
        public Instant activatedAt;
        public Instant replacedAt;
        public Instant expiredAt;
        public Instant rejectedAt;
        public Instant archivedAt;
        public Instant updatedAt;

        public VersionAdapter(String versionId) {
            this.versionId = versionId;
            this.createdAt = Instant.now();
        }

        /**
         * Create adapter from actual SecondaryTokenVersion entity
         */
        public static VersionAdapter fromEntity(SecondaryTokenVersion version) {
            VersionAdapter adapter = new VersionAdapter(version.id.toString());
            adapter.actorId = version.createdBy;
            adapter.changeType = version.changeType;
            adapter.createdAt = version.createdAt.toInstant();
            adapter.updatedAt = version.createdAt.toInstant();
            return adapter;
        }
    }
}
