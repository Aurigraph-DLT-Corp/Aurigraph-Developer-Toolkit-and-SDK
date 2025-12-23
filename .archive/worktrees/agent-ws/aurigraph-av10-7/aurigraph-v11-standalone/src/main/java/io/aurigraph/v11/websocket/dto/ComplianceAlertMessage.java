package io.aurigraph.v11.websocket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Compliance Alert Message DTO
 *
 * Real-time WebSocket message for compliance alerts.
 * Broadcast for certification expiry, issuance, renewal, and critical compliance events.
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ComplianceAlertMessage {

    public enum Severity {
        INFO,
        WARNING,
        CRITICAL
    }

    public enum Action {
        EXPIRING,
        EXPIRED,
        ISSUED,
        RENEWED,
        REVOKED,
        VERIFICATION_FAILED
    }

    private String messageId;
    private String entityId;
    private String certificationId;
    private Severity severity;
    private Action action;
    private Instant timestamp;
    private String certificationType;
    private String complianceLevel;
    private String message;
    private Instant expiryDate;
    private Map<String, Object> details;

    public ComplianceAlertMessage() {
        this.messageId = "msg_" + java.util.UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    public ComplianceAlertMessage(String entityId, String certificationId, Severity severity, Action action) {
        this();
        this.entityId = entityId;
        this.certificationId = certificationId;
        this.severity = severity;
        this.action = action;
    }

    // Getters and setters
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getCertificationId() { return certificationId; }
    public void setCertificationId(String certificationId) { this.certificationId = certificationId; }

    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getCertificationType() { return certificationType; }
    public void setCertificationType(String certificationType) { this.certificationType = certificationType; }

    public String getComplianceLevel() { return complianceLevel; }
    public void setComplianceLevel(String complianceLevel) { this.complianceLevel = complianceLevel; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Instant expiryDate) { this.expiryDate = expiryDate; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
}
