package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Instant;

/**
 * Response model for AI optimization
 */
@Schema(description = "AI Optimization Response")
public class OptimizationResponse {

    @JsonProperty("optimizationId")
    @Schema(description = "Unique identifier for the optimization process", example = "OPT-A1B2C3D4")
    private String optimizationId;

    @JsonProperty("status")
    @Schema(description = "Current status of optimization", example = "INITIATED", enumeration = {"INITIATED", "RUNNING", "COMPLETED", "FAILED"})
    private String status;

    @JsonProperty("targetMetric")
    @Schema(description = "Target metric being optimized", example = "throughput")
    private String targetMetric;

    @JsonProperty("estimatedTimeSeconds")
    @Schema(description = "Estimated time to completion in seconds", example = "120")
    private long estimatedTimeSeconds;

    @JsonProperty("progress")
    @Schema(description = "Optimization progress percentage (0-100)", example = "45.5")
    private double progress;

    @JsonProperty("startedAt")
    @Schema(description = "Timestamp when optimization started")
    private Instant startedAt;

    @JsonProperty("message")
    @Schema(description = "Human-readable status message", example = "AI optimization process initiated successfully")
    private String message;

    // Constructors
    public OptimizationResponse() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String optimizationId;
        private String status;
        private String targetMetric;
        private long estimatedTimeSeconds;
        private double progress;
        private Instant startedAt;
        private String message;

        public Builder optimizationId(String optimizationId) {
            this.optimizationId = optimizationId;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder targetMetric(String targetMetric) {
            this.targetMetric = targetMetric;
            return this;
        }

        public Builder estimatedTimeSeconds(long estimatedTimeSeconds) {
            this.estimatedTimeSeconds = estimatedTimeSeconds;
            return this;
        }

        public Builder progress(double progress) {
            this.progress = progress;
            return this;
        }

        public Builder startedAt(Instant startedAt) {
            this.startedAt = startedAt;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public OptimizationResponse build() {
            OptimizationResponse response = new OptimizationResponse();
            response.optimizationId = this.optimizationId;
            response.status = this.status;
            response.targetMetric = this.targetMetric;
            response.estimatedTimeSeconds = this.estimatedTimeSeconds;
            response.progress = this.progress;
            response.startedAt = this.startedAt;
            response.message = this.message;
            return response;
        }
    }

    // Getters and Setters
    public String getOptimizationId() {
        return optimizationId;
    }

    public void setOptimizationId(String optimizationId) {
        this.optimizationId = optimizationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTargetMetric() {
        return targetMetric;
    }

    public void setTargetMetric(String targetMetric) {
        this.targetMetric = targetMetric;
    }

    public long getEstimatedTimeSeconds() {
        return estimatedTimeSeconds;
    }

    public void setEstimatedTimeSeconds(long estimatedTimeSeconds) {
        this.estimatedTimeSeconds = estimatedTimeSeconds;
    }

    public double getProgress() {
        return progress;
    }

    public void setProgress(double progress) {
        this.progress = progress;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
