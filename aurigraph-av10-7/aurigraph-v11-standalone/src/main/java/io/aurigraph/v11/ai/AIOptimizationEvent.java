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
    OPTIMIZATION_APPLIED,
    MODEL_UPDATED,
    ANOMALY_DETECTED,
    BOTTLENECK_PREDICTED,
    SCALING_TRIGGERED,
    CONFIGURATION_CHANGED,
    LEARNING_COMPLETED,
    ERROR_OCCURRED
}