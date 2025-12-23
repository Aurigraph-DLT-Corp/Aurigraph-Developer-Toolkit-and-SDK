package io.aurigraph.v11.contracts.rwa.compliance.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * Sanctions Screening Record Model for Aurigraph V11 - LevelDB Compatible
 *
 * Stores sanctions screening records for RWA compliance monitoring.
 *
 * LevelDB Storage: Uses screeningId as primary key
 * JSON Serializable: All fields stored as JSON in LevelDB
 *
 * @version 4.0.0 (LevelDB Migration - Oct 8, 2025)
 * @since AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
public class SanctionsScreeningRecord {

    @JsonProperty("screeningId")
    public String screeningId;

    @JsonProperty("entityId")
    public String entityId;

    @JsonProperty("entityType")
    public String entityType; // USER, ADDRESS, TRANSACTION

    @JsonProperty("entityName")
    public String entityName;

    @JsonProperty("blockchainAddress")
    public String blockchainAddress;

    @JsonProperty("matchStatus")
    public String matchStatus; // NO_MATCH, POTENTIAL_MATCH, CONFIRMED_MATCH

    @JsonProperty("matchConfidence")
    public Double matchConfidence;

    @JsonProperty("sanctionsLists")
    public String sanctionsLists; // JSON serialized list of matched sanctions lists

    @JsonProperty("matchedEntities")
    public String matchedEntities; // JSON serialized list of matched entities

    @JsonProperty("riskLevel")
    public String riskLevel;

    @JsonProperty("blocked")
    public Boolean blocked;

    @JsonProperty("createdAt")
    public LocalDateTime createdAt;

    @JsonProperty("reviewedAt")
    public LocalDateTime reviewedAt;

    @JsonProperty("reviewedBy")
    public String reviewedBy;

    @JsonProperty("reviewNotes")
    public String reviewNotes;

    @JsonProperty("metadata")
    public String metadata;

    // Lifecycle methods
    public void ensureCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
