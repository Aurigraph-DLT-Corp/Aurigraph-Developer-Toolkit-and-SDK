package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Base class for integration tests
 * Stream 2: Integration Test Framework Foundation
 *
 * Provides common setup and utilities for integration testing:
 * - Test lifecycle management
 * - Shared test utilities
 * - Cleanup mechanisms
 * - Performance tracking
 */
@QuarkusTest
public abstract class IntegrationTestBase {

    protected AtomicInteger testCounter;
    protected long testStartTime;

    @BeforeEach
    void baseSetUp() {
        testCounter = new AtomicInteger(0);
        testStartTime = System.currentTimeMillis();
    }

    @AfterEach
    void baseTearDown() {
        long duration = System.currentTimeMillis() - testStartTime;
        System.out.println("Test completed in " + duration + "ms");
    }

    /**
     * Wait for async operation with timeout
     */
    protected void waitFor(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Assert operation completes within timeout
     */
    protected void assertCompletesWithin(Runnable operation, long timeoutMs) {
        long start = System.currentTimeMillis();
        operation.run();
        long duration = System.currentTimeMillis() - start;

        if (duration > timeoutMs) {
            throw new AssertionError(
                "Operation took " + duration + "ms, expected < " + timeoutMs + "ms");
        }
    }
}
