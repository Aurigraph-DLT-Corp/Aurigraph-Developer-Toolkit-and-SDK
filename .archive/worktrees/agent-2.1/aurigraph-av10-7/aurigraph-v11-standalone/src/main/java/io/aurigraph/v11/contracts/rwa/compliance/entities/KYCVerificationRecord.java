package io.aurigraph.v11.contracts.rwa.compliance.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * KYC Verification Record Model for Aurigraph V11 - LevelDB Compatible
 *
 * Stores KYC verification records for RWA compliance monitoring.
 *
 * LevelDB Storage: Uses verificationId as primary key
 * JSON Serializable: All fields stored as JSON in LevelDB
 *
 * @version 4.0.0 (LevelDB Migration - Oct 8, 2025)
 * @since AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
public class KYCVerificationRecord {

    @JsonProperty("verificationId")
    public String verificationId;

    @JsonProperty("userId")
    public String userId;

    @JsonProperty("address")
    public String address;

    @JsonProperty("jurisdiction")
    public String jurisdiction;

    @JsonProperty("provider")
    public String provider;

    @JsonProperty("verificationStatus")
    public String verificationStatus;

    @JsonProperty("riskLevel")
    public String riskLevel;

    @JsonProperty("createdAt")
    public LocalDateTime createdAt;

    @JsonProperty("expiresAt")
    public LocalDateTime expiresAt;

    @JsonProperty("updatedAt")
    public LocalDateTime updatedAt;

    @JsonProperty("documentTypes")
    public String documentTypes; // JSON serialized list

    @JsonProperty("verificationNotes")
    public String verificationNotes;

    @JsonProperty("metadata")
    public String metadata; // JSON serialized metadata

    // Lifecycle methods
    public void ensureCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    public void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }
}
