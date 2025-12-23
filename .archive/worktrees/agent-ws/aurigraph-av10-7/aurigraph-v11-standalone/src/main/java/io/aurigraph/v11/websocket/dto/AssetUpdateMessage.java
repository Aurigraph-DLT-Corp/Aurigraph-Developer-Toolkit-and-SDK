package io.aurigraph.v11.websocket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Asset Update Message DTO
 *
 * Real-time WebSocket message for asset traceability updates.
 * Broadcast when assets are created, transferred, verified, or status changed.
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssetUpdateMessage {

    public enum Action {
        CREATED,
        TRANSFERRED,
        VERIFIED,
        STATUS_CHANGED,
        AUDIT_ADDED,
        UPDATED
    }

    private String messageId;
    private String traceId;
    private String assetId;
    private Action action;
    private Instant timestamp;
    private String assetType;
    private String currentOwner;
    private Double valuation;
    private String complianceStatus;
    private Map<String, Object> details;

    public AssetUpdateMessage() {
        this.messageId = "msg_" + java.util.UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    public AssetUpdateMessage(String traceId, String assetId, Action action) {
        this();
        this.traceId = traceId;
        this.assetId = assetId;
        this.action = action;
    }

    // Getters and setters
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }

    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }

    public String getCurrentOwner() { return currentOwner; }
    public void setCurrentOwner(String currentOwner) { this.currentOwner = currentOwner; }

    public Double getValuation() { return valuation; }
    public void setValuation(Double valuation) { this.valuation = valuation; }

    public String getComplianceStatus() { return complianceStatus; }
    public void setComplianceStatus(String complianceStatus) { this.complianceStatus = complianceStatus; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
}
