package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

/**
 * Base test class providing common utilities and setup for all Aurigraph V11 tests.
 * 
 * Features:
 * - Common test setup and teardown
 * - Performance measurement utilities
 * - Assertion helpers with AssertJ
 * - Logging utilities
 * - Timeout and performance validation
 * 
 * Usage: Extend this class in your test classes to inherit common functionality.
 */
@QuarkusTest
@ExtendWith(MockitoExtension.class)
public abstract class BaseTest {
    
    protected final Logger logger = LoggerFactory.getLogger(getClass());
    
    // Performance testing constants
    protected static final int DEFAULT_TIMEOUT_SECONDS = 30;
    protected static final int PERFORMANCE_TIMEOUT_SECONDS = 120;
    protected static final long MIN_TPS_THRESHOLD = 10000L; // Minimum 10K TPS for basic tests
    protected static final long HIGH_TPS_THRESHOLD = 100000L; // 100K TPS for performance tests
    protected static final long TARGET_TPS_THRESHOLD = 500000L; // 500K TPS for advanced tests
    
    // Test execution tracking
    private Instant testStartTime;
    private String currentTestName;
    
    @BeforeEach
    void baseSetUp() {
        testStartTime = Instant.now();
        currentTestName = getCurrentTestMethodName();
        logger.info("Starting test: {} at {}", currentTestName, testStartTime);
        
        // Perform common setup
        setupTestEnvironment();
    }
    
    @AfterEach
    void baseTearDown() {
        Instant testEndTime = Instant.now();
        long durationMs = ChronoUnit.MILLIS.between(testStartTime, testEndTime);
        
        logger.info("Completed test: {} in {} ms", currentTestName, durationMs);
        
        // Performance warning for slow tests
        if (durationMs > TimeUnit.SECONDS.toMillis(DEFAULT_TIMEOUT_SECONDS)) {
            logger.warn("Test {} took longer than expected: {} ms", currentTestName, durationMs);
        }
        
        // Perform common cleanup
        cleanupTestEnvironment();
    }
    
    /**
     * Override this method to perform test-specific setup
     */
    protected void setupTestEnvironment() {
        // Default implementation - override in subclasses
    }
    
    /**
     * Override this method to perform test-specific cleanup
     */
    protected void cleanupTestEnvironment() {
        // Default implementation - override in subclasses
    }
    
    /**
     * Measures the execution time of a runnable and returns the duration in milliseconds
     */
    protected long measureExecutionTime(Runnable operation) {
        Instant start = Instant.now();
        operation.run();
        Instant end = Instant.now();
        return ChronoUnit.MILLIS.between(start, end);
    }
    
    /**
     * Calculates TPS (Transactions Per Second) given iteration count and duration
     */
    protected double calculateTPS(long iterations, long durationMs) {
        if (durationMs == 0) return Double.MAX_VALUE;
        return (double) iterations * 1000.0 / durationMs;
    }
    
    /**
     * Validates that TPS meets the minimum threshold
     */
    protected void assertTpsThreshold(double actualTps, long expectedMinTps) {
        assertThat(actualTps)
            .as("TPS should meet minimum threshold")
            .isGreaterThanOrEqualTo(expectedMinTps);
    }
    
    /**
     * Validates that TPS meets the minimum threshold with custom message
     */
    protected void assertTpsThreshold(double actualTps, long expectedMinTps, String message) {
        assertThat(actualTps)
            .as(message)
            .isGreaterThanOrEqualTo(expectedMinTps);
    }
    
    /**
     * Validates execution time is within acceptable bounds
     */
    protected void assertExecutionTime(long actualMs, long maxExpectedMs) {
        assertThat(actualMs)
            .as("Execution time should be within acceptable bounds")
            .isLessThanOrEqualTo(maxExpectedMs);
    }
    
    /**
     * Validates execution time is within acceptable bounds with custom message
     */
    protected void assertExecutionTime(long actualMs, long maxExpectedMs, String message) {
        assertThat(actualMs)
            .as(message)
            .isLessThanOrEqualTo(maxExpectedMs);
    }
    
    /**
     * Creates a performance summary for logging
     */
    protected String createPerformanceSummary(long iterations, long durationMs, double tps) {
        return String.format("Performance Summary - Iterations: %d, Duration: %d ms, TPS: %.2f", 
                           iterations, durationMs, tps);
    }
    
    /**
     * Logs performance metrics
     */
    protected void logPerformanceMetrics(long iterations, long durationMs) {
        double tps = calculateTPS(iterations, durationMs);
        String summary = createPerformanceSummary(iterations, durationMs, tps);
        logger.info(summary);
        
        // Log performance level
        if (tps >= TARGET_TPS_THRESHOLD) {
            logger.info("EXCELLENT performance: {} TPS", String.format("%.2f", tps));
        } else if (tps >= HIGH_TPS_THRESHOLD) {
            logger.info("GOOD performance: {} TPS", String.format("%.2f", tps));
        } else if (tps >= MIN_TPS_THRESHOLD) {
            logger.info("ACCEPTABLE performance: {} TPS", String.format("%.2f", tps));
        } else {
            logger.warn("POOR performance: {} TPS (below minimum threshold)", String.format("%.2f", tps));
        }
    }
    
    /**
     * Validates that a reactive operation completes successfully
     */
    protected <T> T awaitResult(io.smallrye.mutiny.Uni<T> uni) {
        return uni.await().atMost(java.time.Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS));
    }
    
    /**
     * Validates that a reactive operation completes successfully with custom timeout
     */
    protected <T> T awaitResult(io.smallrye.mutiny.Uni<T> uni, int timeoutSeconds) {
        return uni.await().atMost(java.time.Duration.ofSeconds(timeoutSeconds));
    }
    
    /**
     * Asserts that a string is not null or empty
     */
    protected void assertNotNullOrEmpty(String value, String fieldName) {
        assertThat(value)
            .as("%s should not be null or empty", fieldName)
            .isNotNull()
            .isNotEmpty();
    }
    
    /**
     * Asserts that a value is positive
     */
    protected void assertPositive(long value, String fieldName) {
        assertThat(value)
            .as("%s should be positive", fieldName)
            .isPositive();
    }
    
    /**
     * Asserts that a value is non-negative
     */
    protected void assertNonNegative(long value, String fieldName) {
        assertThat(value)
            .as("%s should be non-negative", fieldName)
            .isNotNegative();
    }
    
    /**
     * Gets the current test method name
     */
    private String getCurrentTestMethodName() {
        return Thread.currentThread().getStackTrace()[4].getMethodName();
    }
    
    /**
     * Creates a test ID for tracking
     */
    protected String createTestId() {
        return currentTestName + "-" + System.currentTimeMillis();
    }
    
    /**
     * Sleeps for the specified duration without throwing InterruptedException
     */
    protected void sleep(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.warn("Sleep interrupted", e);
        }
    }
    
    /**
     * Validates system readiness for performance testing
     */
    protected void validateSystemReadiness() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        
        logger.info("System Memory - Max: {} MB, Total: {} MB, Free: {} MB", 
                   maxMemory / 1024 / 1024, 
                   totalMemory / 1024 / 1024, 
                   freeMemory / 1024 / 1024);
                   
        // Ensure we have sufficient memory for testing
        assertThat(freeMemory)
            .as("System should have sufficient free memory for testing")
            .isGreaterThan(100 * 1024 * 1024); // At least 100MB free
    }
}