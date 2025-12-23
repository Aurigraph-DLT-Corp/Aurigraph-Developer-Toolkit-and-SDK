package io.aurigraph.v11.websocket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Registry Update Message DTO
 *
 * Real-time WebSocket message for registry updates.
 * Broadcast when registry entries are registered, verified, or status changed.
 *
 * @version 11.5.0
 * @since 2025-11-14
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RegistryUpdateMessage {

    public enum Action {
        REGISTERED,
        STATUS_CHANGED,
        VERIFIED,
        UPDATED,
        DELETED
    }

    private String messageId;
    private String registryType;
    private String entryId;
    private Action action;
    private Instant timestamp;
    private String status;
    private String name;
    private String verificationStatus;
    private Map<String, Object> details;

    public RegistryUpdateMessage() {
        this.messageId = "msg_" + java.util.UUID.randomUUID().toString();
        this.timestamp = Instant.now();
    }

    public RegistryUpdateMessage(String registryType, String entryId, Action action) {
        this();
        this.registryType = registryType;
        this.entryId = entryId;
        this.action = action;
    }

    // Getters and setters
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getRegistryType() { return registryType; }
    public void setRegistryType(String registryType) { this.registryType = registryType; }

    public String getEntryId() { return entryId; }
    public void setEntryId(String entryId) { this.entryId = entryId; }

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
}
