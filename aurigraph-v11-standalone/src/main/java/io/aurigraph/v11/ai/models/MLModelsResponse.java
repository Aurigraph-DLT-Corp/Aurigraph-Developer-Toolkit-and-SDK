package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response model for ML models list
 */
@Schema(description = "ML Models List Response")
public class MLModelsResponse {

    @JsonProperty("totalModels")
    @Schema(description = "Total number of available models", example = "5")
    private int totalModels;

    @JsonProperty("activeModels")
    @Schema(description = "Number of active models", example = "5")
    private int activeModels;

    @JsonProperty("models")
    @Schema(description = "List of ML model information")
    private List<MLModelInfo> models;

    @JsonProperty("retrievedAt")
    @Schema(description = "Timestamp when data was retrieved")
    private Instant retrievedAt;

    // Constructors
    public MLModelsResponse() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalModels;
        private int activeModels;
        private List<MLModelInfo> models;
        private Instant retrievedAt;

        public Builder totalModels(int totalModels) {
            this.totalModels = totalModels;
            return this;
        }

        public Builder activeModels(int activeModels) {
            this.activeModels = activeModels;
            return this;
        }

        public Builder models(List<MLModelInfo> models) {
            this.models = models;
            return this;
        }

        public Builder retrievedAt(Instant retrievedAt) {
            this.retrievedAt = retrievedAt;
            return this;
        }

        public MLModelsResponse build() {
            MLModelsResponse response = new MLModelsResponse();
            response.totalModels = this.totalModels;
            response.activeModels = this.activeModels;
            response.models = this.models;
            response.retrievedAt = this.retrievedAt;
            return response;
        }
    }

    // Getters and Setters
    public int getTotalModels() {
        return totalModels;
    }

    public void setTotalModels(int totalModels) {
        this.totalModels = totalModels;
    }

    public int getActiveModels() {
        return activeModels;
    }

    public void setActiveModels(int activeModels) {
        this.activeModels = activeModels;
    }

    public List<MLModelInfo> getModels() {
        return models;
    }

    public void setModels(List<MLModelInfo> models) {
        this.models = models;
    }

    public Instant getRetrievedAt() {
        return retrievedAt;
    }

    public void setRetrievedAt(Instant retrievedAt) {
        this.retrievedAt = retrievedAt;
    }
}
