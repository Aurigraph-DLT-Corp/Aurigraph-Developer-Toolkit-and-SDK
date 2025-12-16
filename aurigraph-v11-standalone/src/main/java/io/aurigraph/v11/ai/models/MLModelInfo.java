package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * ML Model Information
 */
@Schema(description = "Machine Learning Model Information")
public class MLModelInfo {

    @JsonProperty("id")
    @Schema(description = "Unique model identifier", example = "MODEL-TTP-001")
    private String id;

    @JsonProperty("name")
    @Schema(description = "Human-readable model name", example = "Transaction Throughput Predictor")
    private String name;

    @JsonProperty("type")
    @Schema(description = "Model type", example = "REGRESSION", enumeration = {"REGRESSION", "CLASSIFICATION", "TIME_SERIES", "REINFORCEMENT_LEARNING", "UNSUPERVISED"})
    private String type;

    @JsonProperty("description")
    @Schema(description = "Detailed model description")
    private String description;

    @JsonProperty("accuracy")
    @Schema(description = "Model accuracy percentage", example = "94.2")
    private double accuracy;

    @JsonProperty("version")
    @Schema(description = "Model version", example = "2.3.1")
    private String version;

    @JsonProperty("lastTrained")
    @Schema(description = "Timestamp of last training")
    private Instant lastTrained;

    @JsonProperty("trainingDataSize")
    @Schema(description = "Number of training samples", example = "1500000")
    private long trainingDataSize;

    @JsonProperty("features")
    @Schema(description = "List of input features")
    private List<String> features;

    @JsonProperty("status")
    @Schema(description = "Model status", example = "ACTIVE", enumeration = {"ACTIVE", "TRAINING", "DEPRECATED", "DISABLED"})
    private String status;

    @JsonProperty("metrics")
    @Schema(description = "Performance metrics")
    private Map<String, Object> metrics;

    // Constructors
    public MLModelInfo() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String type;
        private String description;
        private double accuracy;
        private String version;
        private Instant lastTrained;
        private long trainingDataSize;
        private List<String> features;
        private String status;
        private Map<String, Object> metrics;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder accuracy(double accuracy) {
            this.accuracy = accuracy;
            return this;
        }

        public Builder version(String version) {
            this.version = version;
            return this;
        }

        public Builder lastTrained(Instant lastTrained) {
            this.lastTrained = lastTrained;
            return this;
        }

        public Builder trainingDataSize(long trainingDataSize) {
            this.trainingDataSize = trainingDataSize;
            return this;
        }

        public Builder features(List<String> features) {
            this.features = features;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder metrics(Map<String, Object> metrics) {
            this.metrics = metrics;
            return this;
        }

        public MLModelInfo build() {
            MLModelInfo model = new MLModelInfo();
            model.id = this.id;
            model.name = this.name;
            model.type = this.type;
            model.description = this.description;
            model.accuracy = this.accuracy;
            model.version = this.version;
            model.lastTrained = this.lastTrained;
            model.trainingDataSize = this.trainingDataSize;
            model.features = this.features;
            model.status = this.status;
            model.metrics = this.metrics;
            return model;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Instant getLastTrained() {
        return lastTrained;
    }

    public void setLastTrained(Instant lastTrained) {
        this.lastTrained = lastTrained;
    }

    public long getTrainingDataSize() {
        return trainingDataSize;
    }

    public void setTrainingDataSize(long trainingDataSize) {
        this.trainingDataSize = trainingDataSize;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, Object> getMetrics() {
        return metrics;
    }

    public void setMetrics(Map<String, Object> metrics) {
        this.metrics = metrics;
    }
}
