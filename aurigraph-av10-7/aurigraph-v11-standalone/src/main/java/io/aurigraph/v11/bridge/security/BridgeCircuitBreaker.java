package io.aurigraph.v11.bridge.security;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import io.quarkus.logging.Log;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Bridge Circuit Breaker - Gap 1.1 Security Hardening
 *
 * Implements a circuit breaker pattern for the cross-chain bridge to prevent
 * cascading failures and protect against validation attacks.
 *
 * State Machine:
 * - CLOSED: Normal operation, bridge is active
 * - OPEN: Bridge halted due to validation failures, blocks all transfers
 * - HALF_OPEN: Testing state, allows limited transfers to check recovery
 *
 * Triggers:
 * - 3+ failed validations in 5 minutes triggers OPEN state
 * - Alert mechanism on circuit break
 * - Manual reset capability for operators
 *
 * Security Features:
 * - Thread-safe state management
 * - Sliding window failure tracking
 * - Configurable thresholds
 * - Audit logging for all state transitions
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 * @since 2025-12-20
 */
@ApplicationScoped
public class BridgeCircuitBreaker {

    /**
     * Circuit breaker states
     */
    public enum CircuitState {
        /** Normal operation - all transfers allowed */
        CLOSED,
        /** Bridge halted - no transfers allowed */
        OPEN,
        /** Recovery testing - limited transfers allowed */
        HALF_OPEN
    }

    // Configuration properties
    @ConfigProperty(name = "bridge.circuit.failure.threshold", defaultValue = "3")
    int failureThreshold;

    @ConfigProperty(name = "bridge.circuit.window.minutes", defaultValue = "5")
    int windowMinutes;

    @ConfigProperty(name = "bridge.circuit.open.duration.seconds", defaultValue = "300")
    int openDurationSeconds;

    @ConfigProperty(name = "bridge.circuit.half.open.max.attempts", defaultValue = "3")
    int halfOpenMaxAttempts;

    @ConfigProperty(name = "bridge.circuit.alert.enabled", defaultValue = "true")
    boolean alertEnabled;

    // State management
    private final AtomicReference<CircuitState> currentState = new AtomicReference<>(CircuitState.CLOSED);
    private final ConcurrentLinkedDeque<FailureRecord> failureWindow = new ConcurrentLinkedDeque<>();
    private final AtomicInteger halfOpenAttempts = new AtomicInteger(0);
    private final AtomicReference<Instant> openedAt = new AtomicReference<>(null);
    private final AtomicReference<Instant> lastStateChange = new AtomicReference<>(Instant.now());
    private final ReentrantReadWriteLock stateLock = new ReentrantReadWriteLock();

    // Metrics
    private final AtomicInteger totalFailures = new AtomicInteger(0);
    private final AtomicInteger totalSuccesses = new AtomicInteger(0);
    private final AtomicInteger circuitBreakCount = new AtomicInteger(0);
    private final AtomicInteger manualResetCount = new AtomicInteger(0);

    // Alert listeners
    private final ConcurrentLinkedDeque<CircuitBreakerAlertListener> alertListeners = new ConcurrentLinkedDeque<>();

    /**
     * Check if the circuit breaker allows a transfer operation.
     *
     * @return true if transfer is allowed, false otherwise
     */
    public boolean allowTransfer() {
        stateLock.readLock().lock();
        try {
            CircuitState state = currentState.get();

            switch (state) {
                case CLOSED:
                    return true;

                case OPEN:
                    // Check if enough time has passed to transition to HALF_OPEN
                    if (shouldTransitionToHalfOpen()) {
                        transitionToHalfOpen();
                        return true; // Allow first HALF_OPEN attempt
                    }
                    return false;

                case HALF_OPEN:
                    // Allow limited attempts in HALF_OPEN state
                    int attempts = halfOpenAttempts.incrementAndGet();
                    return attempts <= halfOpenMaxAttempts;

                default:
                    Log.warnf("Unknown circuit state: %s", state);
                    return false;
            }
        } finally {
            stateLock.readLock().unlock();
        }
    }

    /**
     * Record a successful validation. Helps close the circuit from HALF_OPEN state.
     *
     * @param transactionId The transaction ID for audit logging
     */
    public void recordSuccess(String transactionId) {
        totalSuccesses.incrementAndGet();

        stateLock.writeLock().lock();
        try {
            CircuitState state = currentState.get();

            if (state == CircuitState.HALF_OPEN) {
                // Success in HALF_OPEN means we can close the circuit
                int attempts = halfOpenAttempts.get();
                if (attempts >= 1) {
                    transitionToClosed();
                    Log.infof("Circuit breaker closed after successful validation. Transaction: %s", transactionId);
                }
            }
        } finally {
            stateLock.writeLock().unlock();
        }
    }

    /**
     * Record a failed validation. May trigger circuit to open.
     *
     * @param transactionId The transaction ID for audit logging
     * @param reason The reason for the failure
     */
    public void recordFailure(String transactionId, String reason) {
        totalFailures.incrementAndGet();

        Instant now = Instant.now();
        FailureRecord failure = new FailureRecord(transactionId, reason, now);
        failureWindow.addLast(failure);

        // Clean up old failures outside the window
        Instant windowStart = now.minus(Duration.ofMinutes(windowMinutes));
        while (!failureWindow.isEmpty() && failureWindow.peekFirst().timestamp().isBefore(windowStart)) {
            failureWindow.pollFirst();
        }

        stateLock.writeLock().lock();
        try {
            CircuitState state = currentState.get();

            switch (state) {
                case CLOSED:
                    // Check if we need to open the circuit
                    if (failureWindow.size() >= failureThreshold) {
                        transitionToOpen(reason);
                    }
                    break;

                case HALF_OPEN:
                    // Failure in HALF_OPEN immediately opens the circuit again
                    transitionToOpen(reason);
                    Log.warnf("Circuit breaker re-opened due to failure in HALF_OPEN state. Transaction: %s, Reason: %s",
                        transactionId, reason);
                    break;

                case OPEN:
                    // Already open, just log
                    Log.debugf("Failure recorded while circuit is OPEN. Transaction: %s", transactionId);
                    break;
            }
        } finally {
            stateLock.writeLock().unlock();
        }
    }

    /**
     * Manually reset the circuit breaker to CLOSED state.
     * This is an operator action that should be used with caution.
     *
     * @param operatorId The ID of the operator performing the reset
     * @param reason The reason for manual reset
     * @return true if reset was successful, false if already closed
     */
    public boolean manualReset(String operatorId, String reason) {
        stateLock.writeLock().lock();
        try {
            CircuitState previousState = currentState.get();

            if (previousState == CircuitState.CLOSED) {
                Log.infof("Manual reset attempted but circuit is already CLOSED. Operator: %s", operatorId);
                return false;
            }

            // Clear failure window
            failureWindow.clear();
            halfOpenAttempts.set(0);
            openedAt.set(null);

            // Transition to CLOSED
            currentState.set(CircuitState.CLOSED);
            lastStateChange.set(Instant.now());
            manualResetCount.incrementAndGet();

            Log.warnf("Circuit breaker manually reset by operator %s. Previous state: %s, Reason: %s",
                operatorId, previousState, reason);

            // Notify listeners
            notifyStateChange(previousState, CircuitState.CLOSED,
                String.format("Manual reset by operator %s: %s", operatorId, reason));

            return true;
        } finally {
            stateLock.writeLock().unlock();
        }
    }

    /**
     * Get the current state of the circuit breaker.
     *
     * @return The current circuit state
     */
    public CircuitState getState() {
        return currentState.get();
    }

    /**
     * Get detailed status of the circuit breaker.
     *
     * @return CircuitBreakerStatus object with full details
     */
    public CircuitBreakerStatus getStatus() {
        stateLock.readLock().lock();
        try {
            return new CircuitBreakerStatus(
                currentState.get(),
                failureWindow.size(),
                failureThreshold,
                windowMinutes,
                openedAt.get(),
                lastStateChange.get(),
                halfOpenAttempts.get(),
                halfOpenMaxAttempts,
                totalFailures.get(),
                totalSuccesses.get(),
                circuitBreakCount.get(),
                manualResetCount.get(),
                openDurationSeconds,
                calculateRemainingOpenTime()
            );
        } finally {
            stateLock.readLock().unlock();
        }
    }

    /**
     * Get recent failures within the monitoring window.
     *
     * @return List of recent failure records
     */
    public List<FailureRecord> getRecentFailures() {
        return List.copyOf(failureWindow);
    }

    /**
     * Register an alert listener for circuit breaker state changes.
     *
     * @param listener The listener to register
     */
    public void addAlertListener(CircuitBreakerAlertListener listener) {
        if (listener != null) {
            alertListeners.add(listener);
        }
    }

    /**
     * Remove an alert listener.
     *
     * @param listener The listener to remove
     */
    public void removeAlertListener(CircuitBreakerAlertListener listener) {
        alertListeners.remove(listener);
    }

    // Private helper methods

    private boolean shouldTransitionToHalfOpen() {
        Instant opened = openedAt.get();
        if (opened == null) {
            return false;
        }

        Instant now = Instant.now();
        Duration elapsed = Duration.between(opened, now);
        return elapsed.getSeconds() >= openDurationSeconds;
    }

    private void transitionToOpen(String reason) {
        CircuitState previousState = currentState.get();
        currentState.set(CircuitState.OPEN);
        openedAt.set(Instant.now());
        lastStateChange.set(Instant.now());
        halfOpenAttempts.set(0);
        circuitBreakCount.incrementAndGet();

        String message = String.format(
            "Circuit breaker OPENED. Failures in window: %d, Threshold: %d, Reason: %s",
            failureWindow.size(), failureThreshold, reason
        );

        Log.errorf(message);
        notifyStateChange(previousState, CircuitState.OPEN, message);
    }

    private void transitionToHalfOpen() {
        stateLock.writeLock().lock();
        try {
            if (currentState.get() != CircuitState.OPEN) {
                return;
            }

            CircuitState previousState = currentState.get();
            currentState.set(CircuitState.HALF_OPEN);
            lastStateChange.set(Instant.now());
            halfOpenAttempts.set(0);

            String message = String.format(
                "Circuit breaker transitioning to HALF_OPEN. Open duration: %d seconds",
                openDurationSeconds
            );

            Log.infof(message);
            notifyStateChange(previousState, CircuitState.HALF_OPEN, message);
        } finally {
            stateLock.writeLock().unlock();
        }
    }

    private void transitionToClosed() {
        CircuitState previousState = currentState.get();
        currentState.set(CircuitState.CLOSED);
        lastStateChange.set(Instant.now());
        openedAt.set(null);
        halfOpenAttempts.set(0);
        failureWindow.clear();

        String message = "Circuit breaker CLOSED. Normal operation resumed.";

        Log.infof(message);
        notifyStateChange(previousState, CircuitState.CLOSED, message);
    }

    private void notifyStateChange(CircuitState previousState, CircuitState newState, String message) {
        if (!alertEnabled) {
            return;
        }

        CircuitBreakerAlert alert = new CircuitBreakerAlert(
            previousState,
            newState,
            message,
            Instant.now(),
            failureWindow.size(),
            failureThreshold
        );

        for (CircuitBreakerAlertListener listener : alertListeners) {
            try {
                listener.onCircuitStateChange(alert);
            } catch (Exception e) {
                Log.errorf("Failed to notify circuit breaker alert listener: %s", e.getMessage());
            }
        }
    }

    private Long calculateRemainingOpenTime() {
        if (currentState.get() != CircuitState.OPEN) {
            return null;
        }

        Instant opened = openedAt.get();
        if (opened == null) {
            return null;
        }

        long elapsedSeconds = Duration.between(opened, Instant.now()).getSeconds();
        long remaining = openDurationSeconds - elapsedSeconds;
        return remaining > 0 ? remaining : 0;
    }

    // Inner classes / records

    /**
     * Record of a validation failure
     */
    public record FailureRecord(
        String transactionId,
        String reason,
        Instant timestamp
    ) {}

    /**
     * Detailed status of the circuit breaker
     */
    public record CircuitBreakerStatus(
        CircuitState state,
        int currentFailureCount,
        int failureThreshold,
        int windowMinutes,
        Instant openedAt,
        Instant lastStateChange,
        int halfOpenAttempts,
        int halfOpenMaxAttempts,
        int totalFailures,
        int totalSuccesses,
        int circuitBreakCount,
        int manualResetCount,
        int openDurationSeconds,
        Long remainingOpenTimeSeconds
    ) {
        /**
         * Check if the circuit is allowing transfers
         */
        public boolean isAllowingTransfers() {
            return state == CircuitState.CLOSED || state == CircuitState.HALF_OPEN;
        }

        /**
         * Calculate the failure rate
         */
        public double getFailureRate() {
            int total = totalFailures + totalSuccesses;
            if (total == 0) return 0.0;
            return (double) totalFailures / total * 100.0;
        }
    }

    /**
     * Alert for circuit breaker state changes
     */
    public record CircuitBreakerAlert(
        CircuitState previousState,
        CircuitState newState,
        String message,
        Instant timestamp,
        int failuresInWindow,
        int failureThreshold
    ) {
        /**
         * Check if this is a critical alert (circuit opened)
         */
        public boolean isCritical() {
            return newState == CircuitState.OPEN;
        }
    }

    /**
     * Listener interface for circuit breaker alerts
     */
    public interface CircuitBreakerAlertListener {
        void onCircuitStateChange(CircuitBreakerAlert alert);
    }
}
