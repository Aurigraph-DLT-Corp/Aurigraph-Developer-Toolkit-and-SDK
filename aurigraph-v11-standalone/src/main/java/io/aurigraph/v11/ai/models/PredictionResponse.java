package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Response model for predictions
 */
@Schema(description = "Prediction Response")
public class PredictionResponse {

    @JsonProperty("predictionId")
    @Schema(description = "Unique prediction identifier", example = "PRED-X1Y2Z3A4")
    private String predictionId;

    @JsonProperty("modelId")
    @Schema(description = "Model used for predictions", example = "MODEL-TTP-001")
    private String modelId;

    @JsonProperty("predictions")
    @Schema(description = "List of predictions")
    private List<Prediction> predictions;

    @JsonProperty("averageConfidence")
    @Schema(description = "Average confidence across all predictions", example = "0.92")
    private double averageConfidence;

    @JsonProperty("horizon")
    @Schema(description = "Forecast horizon used", example = "24")
    private int horizon;

    @JsonProperty("metadata")
    @Schema(description = "Additional prediction metadata")
    private Map<String, Object> metadata;

    @JsonProperty("generatedAt")
    @Schema(description = "Timestamp when predictions were generated")
    private Instant generatedAt;

    // Constructors
    public PredictionResponse() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String predictionId;
        private String modelId;
        private List<Prediction> predictions;
        private double averageConfidence;
        private int horizon;
        private Map<String, Object> metadata;
        private Instant generatedAt;

        public Builder predictionId(String predictionId) {
            this.predictionId = predictionId;
            return this;
        }

        public Builder modelId(String modelId) {
            this.modelId = modelId;
            return this;
        }

        public Builder predictions(List<Prediction> predictions) {
            this.predictions = predictions;
            return this;
        }

        public Builder averageConfidence(double averageConfidence) {
            this.averageConfidence = averageConfidence;
            return this;
        }

        public Builder horizon(int horizon) {
            this.horizon = horizon;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public Builder generatedAt(Instant generatedAt) {
            this.generatedAt = generatedAt;
            return this;
        }

        public PredictionResponse build() {
            PredictionResponse response = new PredictionResponse();
            response.predictionId = this.predictionId;
            response.modelId = this.modelId;
            response.predictions = this.predictions;
            response.averageConfidence = this.averageConfidence;
            response.horizon = this.horizon;
            response.metadata = this.metadata;
            response.generatedAt = this.generatedAt;
            return response;
        }
    }

    // Getters and Setters
    public String getPredictionId() {
        return predictionId;
    }

    public void setPredictionId(String predictionId) {
        this.predictionId = predictionId;
    }

    public String getModelId() {
        return modelId;
    }

    public void setModelId(String modelId) {
        this.modelId = modelId;
    }

    public List<Prediction> getPredictions() {
        return predictions;
    }

    public void setPredictions(List<Prediction> predictions) {
        this.predictions = predictions;
    }

    public double getAverageConfidence() {
        return averageConfidence;
    }

    public void setAverageConfidence(double averageConfidence) {
        this.averageConfidence = averageConfidence;
    }

    public int getHorizon() {
        return horizon;
    }

    public void setHorizon(int horizon) {
        this.horizon = horizon;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }
}
