package io.aurigraph.v11.ai;

import java.time.Instant;
import java.util.Map;

/**
 * AI Optimization Event for Aurigraph V11
 * 
 * Represents events generated during AI-driven optimization processes
 * for monitoring and coordination between AI optimization components.
 * 
 * @author Aurigraph AI Team
 * @version 11.0.0
 * @since 2024-01-01
 */
public record AIOptimizationEvent(
    AIOptimizationEventType type,
    String message,
    Map<String, Object> data,
    Instant timestamp,
    String source,
    String correlationId
) {
    
    public AIOptimizationEvent(AIOptimizationEventType type, String message, Map<String, Object> data) {
        this(type, message, data, Instant.now(), "AIOptimizationService", generateCorrelationId());
    }
    
    private static String generateCorrelationId() {
        return "ai-opt-" + System.nanoTime() + "-" + (int)(Math.random() * 1000);
    }
}

/**
 * Types of AI optimization events
 */
public enum AIOptimizationEventType {
    // Core optimization events
    OPTIMIZATION_APPLIED,
    MODEL_UPDATED,
    ANOMALY_DETECTED,
    BOTTLENECK_PREDICTED,
    SCALING_TRIGGERED,
    CONFIGURATION_CHANGED,
    LEARNING_COMPLETED,
    ERROR_OCCURRED,
    
    // Model training and deployment events
    MODEL_DEPLOYED,
    MODEL_AB_TEST_STARTED,
    MODEL_AB_TEST_COMPLETED,
    MODEL_ROLLBACK_INITIATED,
    MODEL_VALIDATION_COMPLETED,
    MODEL_PERFORMANCE_DEGRADED,
    MODEL_RETRAINING_STARTED,
    MODEL_RETRAINING_COMPLETED,
    
    // Performance optimization events
    THROUGHPUT_OPTIMIZATION_APPLIED,
    LATENCY_OPTIMIZATION_APPLIED,
    RESOURCE_OPTIMIZATION_APPLIED,
    BATCH_SIZE_OPTIMIZED,
    THREAD_POOL_OPTIMIZED,
    
    // Prediction and analytics events
    PREDICTIVE_SCALING_TRIGGERED,
    WORKLOAD_PATTERN_DETECTED,
    PERFORMANCE_REGRESSION_DETECTED,
    CAPACITY_LIMIT_PREDICTED,
    
    // Alert and monitoring events
    ALERT_GENERATED,
    METRIC_THRESHOLD_EXCEEDED,
    SYSTEM_HEALTH_DEGRADED,
    PERFORMANCE_TARGET_MISSED,
    
    // Integration events
    AI_SERVICE_STARTED,
    AI_SERVICE_STOPPED,
    AI_INTEGRATION_COMPLETED,
    AI_COMPONENT_SYNCHRONIZED,
    
    // Data and training events
    TRAINING_DATA_UPDATED,
    FEATURE_EXTRACTION_COMPLETED,
    MODEL_ACCURACY_IMPROVED,
    MODEL_ACCURACY_DEGRADED
}