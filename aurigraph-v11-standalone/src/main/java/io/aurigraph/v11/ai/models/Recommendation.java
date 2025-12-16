package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

/**
 * AI Recommendation model
 */
@Schema(description = "AI Optimization Recommendation")
public class Recommendation {

    @JsonProperty("id")
    @Schema(description = "Unique recommendation identifier", example = "REC-001")
    private String id;

    @JsonProperty("type")
    @Schema(description = "Recommendation type", example = "PERFORMANCE")
    private String type;

    @JsonProperty("title")
    @Schema(description = "Short recommendation title", example = "Optimize Block Gas Limit")
    private String title;

    @JsonProperty("description")
    @Schema(description = "Detailed description of the recommendation")
    private String description;

    @JsonProperty("action")
    @Schema(description = "Recommended action to take")
    private String action;

    @JsonProperty("impact")
    @Schema(description = "Expected impact of implementing the recommendation")
    private String impact;

    @JsonProperty("priority")
    @Schema(description = "Recommendation priority", example = "HIGH", enumeration = {"CRITICAL", "HIGH", "MEDIUM", "LOW"})
    private String priority;

    @JsonProperty("estimatedEffort")
    @Schema(description = "Estimated effort to implement", example = "2 hours")
    private String estimatedEffort;

    @JsonProperty("potentialSavings")
    @Schema(description = "Potential cost savings or value", example = "12500.0")
    private double potentialSavings;

    @JsonProperty("confidence")
    @Schema(description = "AI confidence in recommendation (0-1)", example = "0.94")
    private double confidence;

    @JsonProperty("category")
    @Schema(description = "Recommendation category", example = "PERFORMANCE")
    private String category;

    // Constructors
    public Recommendation() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String type;
        private String title;
        private String description;
        private String action;
        private String impact;
        private String priority;
        private String estimatedEffort;
        private double potentialSavings;
        private double confidence;
        private String category;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder action(String action) {
            this.action = action;
            return this;
        }

        public Builder impact(String impact) {
            this.impact = impact;
            return this;
        }

        public Builder priority(String priority) {
            this.priority = priority;
            return this;
        }

        public Builder estimatedEffort(String estimatedEffort) {
            this.estimatedEffort = estimatedEffort;
            return this;
        }

        public Builder potentialSavings(double potentialSavings) {
            this.potentialSavings = potentialSavings;
            return this;
        }

        public Builder confidence(double confidence) {
            this.confidence = confidence;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Recommendation build() {
            Recommendation rec = new Recommendation();
            rec.id = this.id;
            rec.type = this.type;
            rec.title = this.title;
            rec.description = this.description;
            rec.action = this.action;
            rec.impact = this.impact;
            rec.priority = this.priority;
            rec.estimatedEffort = this.estimatedEffort;
            rec.potentialSavings = this.potentialSavings;
            rec.confidence = this.confidence;
            rec.category = this.category;
            return rec;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getImpact() {
        return impact;
    }

    public void setImpact(String impact) {
        this.impact = impact;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getEstimatedEffort() {
        return estimatedEffort;
    }

    public void setEstimatedEffort(String estimatedEffort) {
        this.estimatedEffort = estimatedEffort;
    }

    public double getPotentialSavings() {
        return potentialSavings;
    }

    public void setPotentialSavings(double potentialSavings) {
        this.potentialSavings = potentialSavings;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
