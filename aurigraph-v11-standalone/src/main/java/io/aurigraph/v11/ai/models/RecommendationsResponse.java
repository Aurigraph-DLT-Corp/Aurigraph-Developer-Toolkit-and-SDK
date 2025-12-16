package io.aurigraph.v11.ai.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response model for recommendations
 */
@Schema(description = "AI Recommendations Response")
public class RecommendationsResponse {

    @JsonProperty("totalRecommendations")
    @Schema(description = "Total number of recommendations", example = "6")
    private int totalRecommendations;

    @JsonProperty("category")
    @Schema(description = "Filter category applied", example = "PERFORMANCE")
    private String category;

    @JsonProperty("recommendations")
    @Schema(description = "List of AI recommendations")
    private List<Recommendation> recommendations;

    @JsonProperty("generatedAt")
    @Schema(description = "Timestamp when recommendations were generated")
    private Instant generatedAt;

    @JsonProperty("validUntil")
    @Schema(description = "Timestamp when recommendations expire")
    private Instant validUntil;

    // Constructors
    public RecommendationsResponse() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalRecommendations;
        private String category;
        private List<Recommendation> recommendations;
        private Instant generatedAt;
        private Instant validUntil;

        public Builder totalRecommendations(int totalRecommendations) {
            this.totalRecommendations = totalRecommendations;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder recommendations(List<Recommendation> recommendations) {
            this.recommendations = recommendations;
            return this;
        }

        public Builder generatedAt(Instant generatedAt) {
            this.generatedAt = generatedAt;
            return this;
        }

        public Builder validUntil(Instant validUntil) {
            this.validUntil = validUntil;
            return this;
        }

        public RecommendationsResponse build() {
            RecommendationsResponse response = new RecommendationsResponse();
            response.totalRecommendations = this.totalRecommendations;
            response.category = this.category;
            response.recommendations = this.recommendations;
            response.generatedAt = this.generatedAt;
            response.validUntil = this.validUntil;
            return response;
        }
    }

    // Getters and Setters
    public int getTotalRecommendations() {
        return totalRecommendations;
    }

    public void setTotalRecommendations(int totalRecommendations) {
        this.totalRecommendations = totalRecommendations;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<Recommendation> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<Recommendation> recommendations) {
        this.recommendations = recommendations;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public Instant getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(Instant validUntil) {
        this.validUntil = validUntil;
    }
}
