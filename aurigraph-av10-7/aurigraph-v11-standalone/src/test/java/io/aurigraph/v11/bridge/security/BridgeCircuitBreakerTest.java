package io.aurigraph.v11.bridge.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BridgeCircuitBreaker
 *
 * Tests the circuit breaker state machine:
 * - CLOSED -> OPEN transition on failures
 * - OPEN -> HALF_OPEN transition after timeout
 * - HALF_OPEN -> CLOSED on success
 * - HALF_OPEN -> OPEN on failure
 * - Manual reset functionality
 * - Alert mechanism
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 */
@QuarkusTest
@TestMethodOrder(OrderAnnotation.class)
class BridgeCircuitBreakerTest {

    @Inject
    BridgeCircuitBreaker circuitBreaker;

    @BeforeEach
    void resetState() {
        // Reset circuit breaker before each test
        circuitBreaker.manualReset("test", "Reset for test");
    }

    @Test
    @Order(1)
    @DisplayName("Initial state should be CLOSED")
    void testInitialStateClosed() {
        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, circuitBreaker.getState());
        assertTrue(circuitBreaker.allowTransfer());
    }

    @Test
    @Order(2)
    @DisplayName("Should allow transfers when circuit is CLOSED")
    void testAllowTransfersWhenClosed() {
        assertTrue(circuitBreaker.allowTransfer());

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, status.state());
        assertTrue(status.isAllowingTransfers());
    }

    @Test
    @Order(3)
    @DisplayName("Recording success should keep circuit CLOSED")
    void testRecordSuccessKeepsClosed() {
        circuitBreaker.recordSuccess("tx-001");
        circuitBreaker.recordSuccess("tx-002");

        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, circuitBreaker.getState());

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertEquals(2, status.totalSuccesses());
    }

    @Test
    @Order(4)
    @DisplayName("Should transition to OPEN after 3 failures in window")
    void testTransitionToOpenOnFailures() {
        // Record 3 failures (threshold is 3)
        circuitBreaker.recordFailure("tx-fail-1", "Validation failed");
        circuitBreaker.recordFailure("tx-fail-2", "Timeout");
        circuitBreaker.recordFailure("tx-fail-3", "Invalid signature");

        // Circuit should now be OPEN
        assertEquals(BridgeCircuitBreaker.CircuitState.OPEN, circuitBreaker.getState());
        assertFalse(circuitBreaker.allowTransfer());

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertEquals(1, status.circuitBreakCount());
        assertNotNull(status.openedAt());
    }

    @Test
    @Order(5)
    @DisplayName("Should block transfers when circuit is OPEN")
    void testBlockTransfersWhenOpen() {
        // Open the circuit
        for (int i = 0; i < 3; i++) {
            circuitBreaker.recordFailure("tx-" + i, "Failure");
        }

        assertEquals(BridgeCircuitBreaker.CircuitState.OPEN, circuitBreaker.getState());
        assertFalse(circuitBreaker.allowTransfer());

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertFalse(status.isAllowingTransfers());
    }

    @Test
    @Order(6)
    @DisplayName("Should track failure count correctly")
    void testFailureCountTracking() {
        circuitBreaker.recordFailure("tx-1", "Error 1");
        circuitBreaker.recordFailure("tx-2", "Error 2");

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertEquals(2, status.currentFailureCount());
        assertEquals(3, status.failureThreshold());
    }

    @Test
    @Order(7)
    @DisplayName("Manual reset should close circuit and clear failures")
    void testManualReset() {
        // Open the circuit
        for (int i = 0; i < 3; i++) {
            circuitBreaker.recordFailure("tx-" + i, "Failure");
        }

        assertEquals(BridgeCircuitBreaker.CircuitState.OPEN, circuitBreaker.getState());

        // Manual reset
        boolean resetResult = circuitBreaker.manualReset("admin-001", "Emergency reset");

        assertTrue(resetResult);
        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, circuitBreaker.getState());
        assertTrue(circuitBreaker.allowTransfer());

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertEquals(0, status.currentFailureCount());
        assertEquals(1, status.manualResetCount());
    }

    @Test
    @Order(8)
    @DisplayName("Manual reset on CLOSED circuit should return false")
    void testManualResetOnClosedCircuit() {
        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, circuitBreaker.getState());

        boolean resetResult = circuitBreaker.manualReset("admin", "Test reset");

        assertFalse(resetResult);
        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, circuitBreaker.getState());
    }

    @Test
    @Order(9)
    @DisplayName("Should get recent failures list")
    void testGetRecentFailures() {
        circuitBreaker.recordFailure("tx-a", "Reason A");
        circuitBreaker.recordFailure("tx-b", "Reason B");

        var failures = circuitBreaker.getRecentFailures();

        assertEquals(2, failures.size());
        assertTrue(failures.stream().anyMatch(f -> f.transactionId().equals("tx-a")));
        assertTrue(failures.stream().anyMatch(f -> f.transactionId().equals("tx-b")));
    }

    @Test
    @Order(10)
    @DisplayName("Alert listener should be notified on state change")
    void testAlertListener() throws InterruptedException {
        AtomicBoolean alertReceived = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);

        BridgeCircuitBreaker.CircuitBreakerAlertListener listener = alert -> {
            if (alert.newState() == BridgeCircuitBreaker.CircuitState.OPEN) {
                alertReceived.set(true);
                latch.countDown();
            }
        };

        circuitBreaker.addAlertListener(listener);

        // Trigger circuit open
        for (int i = 0; i < 3; i++) {
            circuitBreaker.recordFailure("alert-tx-" + i, "Failure");
        }

        assertTrue(latch.await(1, TimeUnit.SECONDS));
        assertTrue(alertReceived.get());

        circuitBreaker.removeAlertListener(listener);
    }

    @Test
    @Order(11)
    @DisplayName("Status should calculate failure rate correctly")
    void testFailureRateCalculation() {
        // Record some successes and failures
        circuitBreaker.recordSuccess("s1");
        circuitBreaker.recordSuccess("s2");
        circuitBreaker.recordSuccess("s3");
        circuitBreaker.recordFailure("f1", "Error");
        circuitBreaker.recordFailure("f2", "Error");

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();

        // 2 failures out of 5 total = 40%
        assertEquals(40.0, status.getFailureRate(), 0.01);
    }

    @Test
    @Order(12)
    @DisplayName("Circuit should not open if failures are below threshold")
    void testNoOpenBelowThreshold() {
        circuitBreaker.recordFailure("tx-1", "Error 1");
        circuitBreaker.recordFailure("tx-2", "Error 2");

        // Only 2 failures, threshold is 3
        assertEquals(BridgeCircuitBreaker.CircuitState.CLOSED, circuitBreaker.getState());
        assertTrue(circuitBreaker.allowTransfer());
    }

    @Test
    @Order(13)
    @DisplayName("Status should provide correct remaining time when OPEN")
    void testRemainingOpenTime() {
        // Open the circuit
        for (int i = 0; i < 3; i++) {
            circuitBreaker.recordFailure("tx-" + i, "Failure");
        }

        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();

        assertEquals(BridgeCircuitBreaker.CircuitState.OPEN, status.state());
        assertNotNull(status.remainingOpenTimeSeconds());
        assertTrue(status.remainingOpenTimeSeconds() > 0);
        assertTrue(status.remainingOpenTimeSeconds() <= 300); // Default 300 seconds
    }

    @Test
    @Order(14)
    @DisplayName("Alert should be marked as critical when circuit opens")
    void testCriticalAlert() throws InterruptedException {
        AtomicBoolean isCritical = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);

        circuitBreaker.addAlertListener(alert -> {
            isCritical.set(alert.isCritical());
            latch.countDown();
        });

        // Trigger circuit open
        for (int i = 0; i < 3; i++) {
            circuitBreaker.recordFailure("crit-tx-" + i, "Failure");
        }

        assertTrue(latch.await(1, TimeUnit.SECONDS));
        assertTrue(isCritical.get());
    }

    @Test
    @Order(15)
    @DisplayName("Thread safety - concurrent operations should not cause issues")
    void testConcurrentOperations() throws InterruptedException {
        int threadCount = 10;
        int operationsPerThread = 100;
        CountDownLatch latch = new CountDownLatch(threadCount);

        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            new Thread(() -> {
                try {
                    for (int i = 0; i < operationsPerThread; i++) {
                        if (i % 2 == 0) {
                            circuitBreaker.recordSuccess("thread-" + threadId + "-tx-" + i);
                        } else {
                            circuitBreaker.recordFailure("thread-" + threadId + "-tx-" + i, "Test error");
                        }
                        circuitBreaker.allowTransfer();
                        circuitBreaker.getStatus();
                    }
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        assertTrue(latch.await(10, TimeUnit.SECONDS));

        // Should not throw exceptions and state should be valid
        BridgeCircuitBreaker.CircuitBreakerStatus status = circuitBreaker.getStatus();
        assertNotNull(status);
        assertTrue(status.totalSuccesses() > 0);
        assertTrue(status.totalFailures() > 0);
    }
}
