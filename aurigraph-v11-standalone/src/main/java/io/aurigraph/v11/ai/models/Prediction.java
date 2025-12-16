package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Instant;

/**
 * Individual prediction result
 */
@Schema(description = "Prediction Result")
public class Prediction {

    @JsonProperty("timestamp")
    @Schema(description = "Timestamp for this prediction")
    private Instant timestamp;

    @JsonProperty("predictedValue")
    @Schema(description = "Predicted value", example = "12500.75")
    private double predictedValue;

    @JsonProperty("confidence")
    @Schema(description = "Prediction confidence (0-1)", example = "0.94")
    private double confidence;

    @JsonProperty("lowerBound")
    @Schema(description = "Lower confidence bound", example = "11250.68")
    private double lowerBound;

    @JsonProperty("upperBound")
    @Schema(description = "Upper confidence bound", example = "13750.83")
    private double upperBound;

    // Constructors
    public Prediction() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Instant timestamp;
        private double predictedValue;
        private double confidence;
        private double lowerBound;
        private double upperBound;

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder predictedValue(double predictedValue) {
            this.predictedValue = predictedValue;
            return this;
        }

        public Builder confidence(double confidence) {
            this.confidence = confidence;
            return this;
        }

        public Builder lowerBound(double lowerBound) {
            this.lowerBound = lowerBound;
            return this;
        }

        public Builder upperBound(double upperBound) {
            this.upperBound = upperBound;
            return this;
        }

        public Prediction build() {
            Prediction prediction = new Prediction();
            prediction.timestamp = this.timestamp;
            prediction.predictedValue = this.predictedValue;
            prediction.confidence = this.confidence;
            prediction.lowerBound = this.lowerBound;
            prediction.upperBound = this.upperBound;
            return prediction;
        }
    }

    // Getters and Setters
    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public double getPredictedValue() {
        return predictedValue;
    }

    public void setPredictedValue(double predictedValue) {
        this.predictedValue = predictedValue;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public double getLowerBound() {
        return lowerBound;
    }

    public void setLowerBound(double lowerBound) {
        this.lowerBound = lowerBound;
    }

    public double getUpperBound() {
        return upperBound;
    }

    public void setUpperBound(double upperBound) {
        this.upperBound = upperBound;
    }
}
