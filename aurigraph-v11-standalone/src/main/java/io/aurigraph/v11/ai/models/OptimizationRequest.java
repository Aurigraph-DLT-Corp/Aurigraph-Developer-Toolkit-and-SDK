package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.util.Map;

/**
 * Request model for AI optimization
 */
@Schema(description = "AI Optimization Request")
public class OptimizationRequest {

    @JsonProperty("targetMetric")
    @Schema(description = "Target metric to optimize (e.g., 'throughput', 'latency', 'cost')", required = true, example = "throughput")
    private String targetMetric;

    @JsonProperty("parameters")
    @Schema(description = "Optimization parameters and their current values", required = true)
    private Map<String, Object> parameters;

    @JsonProperty("constraints")
    @Schema(description = "Constraints to respect during optimization", required = true)
    private Map<String, Object> constraints;

    // Constructors
    public OptimizationRequest() {
    }

    public OptimizationRequest(String targetMetric, Map<String, Object> parameters, Map<String, Object> constraints) {
        this.targetMetric = targetMetric;
        this.parameters = parameters;
        this.constraints = constraints;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String targetMetric;
        private Map<String, Object> parameters;
        private Map<String, Object> constraints;

        public Builder targetMetric(String targetMetric) {
            this.targetMetric = targetMetric;
            return this;
        }

        public Builder parameters(Map<String, Object> parameters) {
            this.parameters = parameters;
            return this;
        }

        public Builder constraints(Map<String, Object> constraints) {
            this.constraints = constraints;
            return this;
        }

        public OptimizationRequest build() {
            return new OptimizationRequest(targetMetric, parameters, constraints);
        }
    }

    // Getters and Setters
    public String getTargetMetric() {
        return targetMetric;
    }

    public void setTargetMetric(String targetMetric) {
        this.targetMetric = targetMetric;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
    }

    public Map<String, Object> getConstraints() {
        return constraints;
    }

    public void setConstraints(Map<String, Object> constraints) {
        this.constraints = constraints;
    }
}
