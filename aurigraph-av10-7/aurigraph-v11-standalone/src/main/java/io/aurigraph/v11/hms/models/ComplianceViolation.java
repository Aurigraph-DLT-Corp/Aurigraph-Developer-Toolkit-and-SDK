package io.aurigraph.v11.hms.models;

import java.time.Instant;

/**
 * Compliance violation record
 */
public class ComplianceViolation {
    private String violationType;
    private String description;
    private Instant detectedTimestamp;
    private ViolationSeverity severity;
    private boolean resolved;
    private Instant resolvedTimestamp;
    private String resolutionNotes;

    public ComplianceViolation() {
        this.detectedTimestamp = Instant.now();
        this.resolved = false;
    }

    public ComplianceViolation(String violationType, String description, ViolationSeverity severity) {
        this.violationType = violationType;
        this.description = description;
        this.severity = severity;
        this.detectedTimestamp = Instant.now();
        this.resolved = false;
    }

    // Getters and Setters
    public String getViolationType() {
        return violationType;
    }

    public void setViolationType(String violationType) {
        this.violationType = violationType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getDetectedTimestamp() {
        return detectedTimestamp;
    }

    public void setDetectedTimestamp(Instant detectedTimestamp) {
        this.detectedTimestamp = detectedTimestamp;
    }

    public ViolationSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(ViolationSeverity severity) {
        this.severity = severity;
    }

    public boolean isResolved() {
        return resolved;
    }

    public void setResolved(boolean resolved) {
        this.resolved = resolved;
        if (resolved && this.resolvedTimestamp == null) {
            this.resolvedTimestamp = Instant.now();
        }
    }

    public Instant getResolvedTimestamp() {
        return resolvedTimestamp;
    }

    public void setResolvedTimestamp(Instant resolvedTimestamp) {
        this.resolvedTimestamp = resolvedTimestamp;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public enum ViolationSeverity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
