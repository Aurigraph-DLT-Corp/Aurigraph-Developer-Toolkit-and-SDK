package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.util.Map;

/**
 * Request model for predictions
 */
@Schema(description = "Prediction Request")
public class PredictionRequest {

    @JsonProperty("modelId")
    @Schema(description = "ML model identifier to use for predictions", required = true, example = "MODEL-TTP-001")
    private String modelId;

    @JsonProperty("inputData")
    @Schema(description = "Input data for prediction", required = true)
    private Map<String, Object> inputData;

    @JsonProperty("horizon")
    @Schema(description = "Forecast horizon (number of future time steps)", required = true, example = "24")
    private int horizon;

    // Constructors
    public PredictionRequest() {
    }

    public PredictionRequest(String modelId, Map<String, Object> inputData, int horizon) {
        this.modelId = modelId;
        this.inputData = inputData;
        this.horizon = horizon;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String modelId;
        private Map<String, Object> inputData;
        private int horizon;

        public Builder modelId(String modelId) {
            this.modelId = modelId;
            return this;
        }

        public Builder inputData(Map<String, Object> inputData) {
            this.inputData = inputData;
            return this;
        }

        public Builder horizon(int horizon) {
            this.horizon = horizon;
            return this;
        }

        public PredictionRequest build() {
            return new PredictionRequest(modelId, inputData, horizon);
        }
    }

    // Getters and Setters
    public String getModelId() {
        return modelId;
    }

    public void setModelId(String modelId) {
        this.modelId = modelId;
    }

    public Map<String, Object> getInputData() {
        return inputData;
    }

    public void setInputData(Map<String, Object> inputData) {
        this.inputData = inputData;
    }

    public int getHorizon() {
        return horizon;
    }

    public void setHorizon(int horizon) {
        this.horizon = horizon;
    }
}
