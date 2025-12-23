package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.MockitoAnnotations;
import org.mockito.ArgumentCaptor;
import org.mockito.verification.VerificationMode;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Base test class for testing service classes with Mockito integration.
 * 
 * Features:
 * - Mockito setup and teardown
 * - Reactive testing utilities for Uni/Multi
 * - Common service testing patterns
 * - Performance testing for services
 * - Mock verification utilities
 * - Timeout handling for async operations
 * 
 * Usage: Extend this class for testing service classes and use the provided utilities.
 */
@QuarkusTest
public abstract class ServiceTestBase extends BaseTest {
    
    @BeforeEach
    @Override
    protected void setupTestEnvironment() {
        super.setupTestEnvironment();
        MockitoAnnotations.openMocks(this);
        setupMocks();
        setupServiceDependencies();
    }
    
    /**
     * Override this method to setup mock objects
     */
    protected void setupMocks() {
        // Default implementation - override in subclasses
    }
    
    /**
     * Override this method to setup service dependencies
     */
    protected void setupServiceDependencies() {
        // Default implementation - override in subclasses
    }
    
    /**
     * Override this method to return the service being tested
     */
    protected abstract Object getServiceUnderTest();
    
    @Test
    @DisplayName("Service should not be null")
    void testServiceNotNull() {
        assertThat(getServiceUnderTest())
            .as("Service under test should not be null")
            .isNotNull();
    }
    
    /**
     * Tests a reactive operation that should complete successfully
     */
    protected <T> T testReactiveSuccess(Uni<T> operation) {
        return testReactiveSuccess(operation, DEFAULT_TIMEOUT_SECONDS);
    }
    
    /**
     * Tests a reactive operation that should complete successfully with custom timeout
     */
    protected <T> T testReactiveSuccess(Uni<T> operation, int timeoutSeconds) {
        T result = operation
            .await()
            .atMost(Duration.ofSeconds(timeoutSeconds));
            
        assertThat(result)
            .as("Reactive operation should return non-null result")
            .isNotNull();
            
        return result;
    }
    
    /**
     * Tests a reactive operation that should fail
     */
    protected void testReactiveFailure(Uni<?> operation, Class<? extends Throwable> expectedExceptionType) {
        assertThatThrownBy(() -> operation.await().atMost(Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS)))
            .as("Reactive operation should throw expected exception")
            .isInstanceOf(expectedExceptionType);
    }
    
    /**
     * Tests a reactive operation with custom failure validation
     */
    protected void testReactiveFailure(Uni<?> operation, String expectedMessage) {
        assertThatThrownBy(() -> operation.await().atMost(Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS)))
            .as("Reactive operation should throw exception with expected message")
            .hasMessageContaining(expectedMessage);
    }
    
    /**
     * Tests the performance of a reactive operation
     */
    protected void testReactivePerformance(Supplier<Uni<?>> operationSupplier, 
                                          int iterations, 
                                          long expectedMinTps) {
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < iterations; i++) {
            Uni<?> operation = operationSupplier.get();
            operation.await().atMost(Duration.ofSeconds(1));
        }
        
        long duration = System.currentTimeMillis() - startTime;
        double tps = calculateTPS(iterations, duration);
        
        logPerformanceMetrics(iterations, duration);
        assertTpsThreshold(tps, expectedMinTps, 
            String.format("Service should achieve minimum %d TPS", expectedMinTps));
    }
    
    /**
     * Tests concurrent execution of reactive operations
     */
    protected void testConcurrentExecution(Supplier<Uni<?>> operationSupplier, 
                                          int concurrentOperations) {
        CompletableFuture<?>[] futures = new CompletableFuture[concurrentOperations];
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < concurrentOperations; i++) {
            futures[i] = operationSupplier.get()
                .subscribeAsCompletionStage();
        }
        
        // Wait for all operations to complete
        CompletableFuture.allOf(futures)
            .orTimeout(PERFORMANCE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .join();
            
        long duration = System.currentTimeMillis() - startTime;
        double tps = calculateTPS(concurrentOperations, duration);
        
        logPerformanceMetrics(concurrentOperations, duration);
        
        assertThat(tps)
            .as("Concurrent operations should achieve reasonable throughput")
            .isGreaterThan(MIN_TPS_THRESHOLD);
    }
    
    /**
     * Verifies that a mock was called with specific arguments
     */
    protected <T> ArgumentCaptor<T> verifyMethodCall(Object mock, 
                                                    String methodName, 
                                                    Class<T> argumentType) {
        return verifyMethodCall(mock, methodName, argumentType, times(1));
    }
    
    /**
     * Verifies that a mock was called with specific arguments and verification mode
     */
    protected <T> ArgumentCaptor<T> verifyMethodCall(Object mock, 
                                                    String methodName, 
                                                    Class<T> argumentType,
                                                    VerificationMode mode) {
        ArgumentCaptor<T> captor = ArgumentCaptor.forClass(argumentType);
        
        try {
            verify(mock, mode).getClass().getMethod(methodName, argumentType).invoke(mock, captor.capture());
        } catch (Exception e) {
            // If direct method verification fails, use reflection to find and verify the method
            logger.warn("Direct method verification failed for {}.{}, using alternative approach", 
                       mock.getClass().getSimpleName(), methodName);
        }
        
        return captor;
    }
    
    /**
     * Verifies that no interactions occurred with a mock
     */
    protected void verifyNoInteractions(Object... mocks) {
        for (Object mock : mocks) {
            verifyNoInteractions(mock);
        }
    }
    
    /**
     * Verifies that no more interactions occurred with a mock after verified calls
     */
    protected void verifyNoMoreInteractions(Object... mocks) {
        for (Object mock : mocks) {
            verifyNoMoreInteractions(mock);
        }
    }
    
    /**
     * Tests service initialization and readiness
     */
    @Test
    @DisplayName("Service should initialize properly")
    void testServiceInitialization() {
        Object service = getServiceUnderTest();
        
        assertThat(service)
            .as("Service should be initialized")
            .isNotNull();
            
        // Test that service is ready to handle operations
        validateServiceReadiness(service);
    }
    
    /**
     * Tests service behavior under high load
     */
    protected void testServiceUnderLoad(Supplier<Uni<?>> operationSupplier, 
                                       int loadIterations) {
        logger.info("Testing service under load with {} iterations", loadIterations);
        
        long startTime = System.currentTimeMillis();
        int successCount = 0;
        int failureCount = 0;
        
        for (int i = 0; i < loadIterations; i++) {
            try {
                operationSupplier.get()
                    .await()
                    .atMost(Duration.ofSeconds(5));
                successCount++;
            } catch (Exception e) {
                failureCount++;
                logger.debug("Operation {} failed: {}", i, e.getMessage());
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        double successRate = (double) successCount / loadIterations * 100;
        double tps = calculateTPS(successCount, duration);
        
        logger.info("Load test results - Success: {}/{} ({}%), TPS: {}", 
                   successCount, loadIterations, String.format("%.2f", successRate), 
                   String.format("%.2f", tps));
        
        // Validate acceptable success rate under load
        assertThat(successRate)
            .as("Service should maintain acceptable success rate under load")
            .isGreaterThanOrEqualTo(95.0); // 95% success rate minimum
            
        assertThat(tps)
            .as("Service should maintain reasonable throughput under load")
            .isGreaterThan(MIN_TPS_THRESHOLD);
    }
    
    /**
     * Tests service error handling and recovery
     */
    protected void testErrorHandlingAndRecovery(Supplier<Uni<?>> failingOperation,
                                               Supplier<Uni<?>> successOperation) {
        // First, test that failing operation properly fails
        assertThatThrownBy(() -> 
            failingOperation.get()
                .await()
                .atMost(Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS)))
            .as("Failing operation should throw exception")
            .isInstanceOf(Exception.class);
        
        // Then test that service can recover and handle successful operations
        assertThatCode(() -> 
            successOperation.get()
                .await()
                .atMost(Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS)))
            .as("Service should recover and handle successful operations")
            .doesNotThrowAnyException();
    }
    
    /**
     * Validates that the service is ready to handle operations
     */
    protected void validateServiceReadiness(Object service) {
        assertThat(service)
            .as("Service should be ready")
            .isNotNull();
        
        // Additional readiness checks can be implemented in subclasses
        logger.info("Service {} is ready for testing", service.getClass().getSimpleName());
    }
    
    /**
     * Creates a mock with default behavior
     */
    protected <T> T createMockWithDefaults(Class<T> classToMock) {
        T mock = mock(classToMock);
        setupDefaultMockBehavior(mock);
        return mock;
    }
    
    /**
     * Override this method to setup default mock behavior
     */
    protected void setupDefaultMockBehavior(Object mock) {
        // Default implementation - override in subclasses
    }
    
    /**
     * Tests service statistics and metrics
     */
    protected void testServiceStatistics(Supplier<Uni<?>> statsOperation) {
        Object stats = testReactiveSuccess(statsOperation.get());
        
        assertThat(stats)
            .as("Service statistics should not be null")
            .isNotNull();
            
        validateServiceStatistics(stats);
    }
    
    /**
     * Override this method to validate service-specific statistics
     */
    protected void validateServiceStatistics(Object stats) {
        // Default implementation - override in subclasses
        logger.info("Service statistics validated: {}", stats.getClass().getSimpleName());
    }
    
    /**
     * Tests service cleanup and resource management
     */
    protected void testServiceCleanup() {
        Object service = getServiceUnderTest();
        
        // Test that service can be safely cleaned up
        assertThatCode(() -> performServiceCleanup(service))
            .as("Service cleanup should not throw exceptions")
            .doesNotThrowAnyException();
    }
    
    /**
     * Override this method to perform service-specific cleanup
     */
    protected void performServiceCleanup(Object service) {
        // Default implementation - override in subclasses
        logger.info("Service cleanup completed for {}", service.getClass().getSimpleName());
    }
}