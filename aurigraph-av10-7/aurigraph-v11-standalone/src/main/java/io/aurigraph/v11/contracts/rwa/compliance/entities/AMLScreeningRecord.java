package io.aurigraph.v11.contracts.rwa.compliance.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * AML Screening Record Model for Aurigraph V11 - LevelDB Compatible
 *
 * Stores AML screening records for RWA compliance monitoring.
 *
 * LevelDB Storage: Uses screeningId as primary key
 * JSON Serializable: All fields stored as JSON in LevelDB
 *
 * @version 4.0.0 (LevelDB Migration - Oct 8, 2025)
 * @since AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
public class AMLScreeningRecord {

    @JsonProperty("screeningId")
    public String screeningId;

    @JsonProperty("userId")
    public String userId;

    @JsonProperty("jurisdiction")
    public String jurisdiction;

    @JsonProperty("riskScore")
    public Integer riskScore;

    @JsonProperty("riskLevel")
    public String riskLevel;

    @JsonProperty("pepStatus")
    public Boolean pepStatus;

    @JsonProperty("sanctionsHit")
    public Boolean sanctionsHit;

    @JsonProperty("adverseMedia")
    public Boolean adverseMedia;

    @JsonProperty("screeningStatus")
    public String screeningStatus;

    @JsonProperty("createdAt")
    public LocalDateTime createdAt;

    @JsonProperty("nextReviewDate")
    public LocalDateTime nextReviewDate;

    @JsonProperty("flags")
    public String flags; // JSON serialized list of flags

    @JsonProperty("notes")
    public String notes;

    @JsonProperty("metadata")
    public String metadata;

    // Lifecycle methods
    public void ensureCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
