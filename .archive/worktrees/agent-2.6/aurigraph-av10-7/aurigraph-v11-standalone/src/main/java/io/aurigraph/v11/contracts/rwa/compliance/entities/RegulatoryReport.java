package io.aurigraph.v11.contracts.rwa.compliance.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * Regulatory Report Model for Aurigraph V11 - LevelDB Compatible
 *
 * Stores regulatory reports (CTR, SAR, etc.) for RWA compliance monitoring.
 *
 * LevelDB Storage: Uses reportId as primary key
 * JSON Serializable: All fields stored as JSON in LevelDB
 *
 * @version 4.0.0 (LevelDB Migration - Oct 8, 2025)
 * @since AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
public class RegulatoryReport {

    @JsonProperty("reportId")
    public String reportId;

    @JsonProperty("reportType")
    public String reportType; // CTR, SAR, TRANSACTION_REPORT, AUDIT_REPORT

    @JsonProperty("jurisdiction")
    public String jurisdiction;

    @JsonProperty("filingPeriodStart")
    public LocalDateTime filingPeriodStart;

    @JsonProperty("filingPeriodEnd")
    public LocalDateTime filingPeriodEnd;

    @JsonProperty("status")
    public String status; // DRAFT, PENDING_REVIEW, APPROVED, SUBMITTED, REJECTED

    @JsonProperty("createdAt")
    public LocalDateTime createdAt;

    @JsonProperty("updatedAt")
    public LocalDateTime updatedAt;

    @JsonProperty("submittedAt")
    public LocalDateTime submittedAt;

    @JsonProperty("submittedBy")
    public String submittedBy;

    @JsonProperty("approvedAt")
    public LocalDateTime approvedAt;

    @JsonProperty("approvedBy")
    public String approvedBy;

    @JsonProperty("filingReference")
    public String filingReference;

    @JsonProperty("regulatorName")
    public String regulatorName;

    @JsonProperty("reportData")
    public String reportData; // JSON serialized report content

    @JsonProperty("transactionCount")
    public Integer transactionCount;

    @JsonProperty("totalVolume")
    public String totalVolume;

    @JsonProperty("suspiciousActivityCount")
    public Integer suspiciousActivityCount;

    @JsonProperty("attachments")
    public String attachments; // JSON serialized list of attachment references

    @JsonProperty("notes")
    public String notes;

    @JsonProperty("metadata")
    public String metadata;

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
