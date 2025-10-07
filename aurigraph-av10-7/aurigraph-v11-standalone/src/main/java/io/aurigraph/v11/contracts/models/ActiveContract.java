package io.aurigraph.v11.contracts.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Active Contract Entity
 *
 * Represents contracts that are currently active in the system.
 * Tracks lifecycle events, parties involved, and execution status.
 *
 * @version 3.8.0 (Phase 2 Day 10)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "active_contracts", indexes = {
    @Index(name = "idx_active_contract_id", columnList = "contractId", unique = true),
    @Index(name = "idx_active_status", columnList = "status"),
    @Index(name = "idx_active_creator", columnList = "creatorAddress"),
    @Index(name = "idx_active_expires_at", columnList = "expiresAt")
})
public class ActiveContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contractId", nullable = false, unique = true, length = 66)
    private String contractId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ActiveContractStatus status;

    @Column(name = "creatorAddress", nullable = false, length = 66)
    private String creatorAddress;

    @Column(name = "contractType", length = 50)
    private String contractType;

    // Timestamps
    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "activatedAt")
    private Instant activatedAt;

    @Column(name = "completedAt")
    private Instant completedAt;

    @Column(name = "terminatedAt")
    private Instant terminatedAt;

    @Column(name = "expiresAt")
    private Instant expiresAt;

    @Column(name = "lastEventAt")
    private Instant lastEventAt;

    @Column(name = "updatedAt")
    private Instant updatedAt;

    // Parties
    @ElementCollection
    @CollectionTable(name = "active_contract_parties", joinColumns = @JoinColumn(name = "contract_id"))
    @Column(name = "party_address")
    private List<String> parties = new ArrayList<>();

    // Execution details
    @Column(name = "executionCount", nullable = false)
    private Long executionCount = 0L;

    @Column(name = "eventCount", nullable = false)
    private Long eventCount = 0L;

    @Column(name = "lastExecutionAt")
    private Instant lastExecutionAt;

    @Column(name = "lastExecutionStatus", length = 50)
    private String lastExecutionStatus;

    // Metadata
    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    // Notifications
    @Column(name = "notificationEnabled", nullable = false)
    private Boolean notificationEnabled = true;

    @Column(name = "notificationRecipients", columnDefinition = "TEXT")
    private String notificationRecipients;

    // ==================== CONSTRUCTORS ====================

    public ActiveContract() {
        this.createdAt = Instant.now();
        this.status = ActiveContractStatus.PENDING;
        this.executionCount = 0L;
        this.eventCount = 0L;
    }

    public ActiveContract(String contractId, String name, String creatorAddress) {
        this();
        this.contractId = contractId;
        this.name = name;
        this.creatorAddress = creatorAddress;
    }

    // ==================== LIFECYCLE METHODS ====================

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Activate the contract
     */
    public void activate() {
        if (status != ActiveContractStatus.PENDING) {
            throw new IllegalStateException("Only PENDING contracts can be activated");
        }
        this.status = ActiveContractStatus.ACTIVE;
        this.activatedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Complete the contract
     */
    public void complete() {
        if (status != ActiveContractStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE contracts can be completed");
        }
        this.status = ActiveContractStatus.COMPLETED;
        this.completedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Terminate the contract
     */
    public void terminate(String reason) {
        if (status == ActiveContractStatus.COMPLETED || status == ActiveContractStatus.TERMINATED) {
            throw new IllegalStateException("Contract is already finalized");
        }
        this.status = ActiveContractStatus.TERMINATED;
        this.terminatedAt = Instant.now();
        this.updatedAt = Instant.now();
        this.metadata = (this.metadata != null ? this.metadata + "\n" : "") + "Termination reason: " + reason;
    }

    /**
     * Pause the contract
     */
    public void pause() {
        if (status != ActiveContractStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE contracts can be paused");
        }
        this.status = ActiveContractStatus.PAUSED;
        this.updatedAt = Instant.now();
    }

    /**
     * Resume the contract
     */
    public void resume() {
        if (status != ActiveContractStatus.PAUSED) {
            throw new IllegalStateException("Only PAUSED contracts can be resumed");
        }
        this.status = ActiveContractStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }

    /**
     * Record an execution
     */
    public void recordExecution(String executionStatus) {
        this.executionCount++;
        this.lastExecutionAt = Instant.now();
        this.lastExecutionStatus = executionStatus;
        this.updatedAt = Instant.now();
    }

    /**
     * Record an event
     */
    public void recordEvent() {
        this.eventCount++;
        this.lastEventAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Add a party to the contract
     */
    public void addParty(String partyAddress) {
        if (!this.parties.contains(partyAddress)) {
            this.parties.add(partyAddress);
            this.updatedAt = Instant.now();
        }
    }

    /**
     * Remove a party from the contract
     */
    public void removeParty(String partyAddress) {
        if (this.parties.remove(partyAddress)) {
            this.updatedAt = Instant.now();
        }
    }

    /**
     * Check if contract is expired
     */
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    /**
     * Check if contract is active
     */
    public boolean isActive() {
        return status == ActiveContractStatus.ACTIVE && !isExpired();
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ActiveContractStatus getStatus() { return status; }
    public void setStatus(ActiveContractStatus status) { this.status = status; }

    public String getCreatorAddress() { return creatorAddress; }
    public void setCreatorAddress(String creatorAddress) { this.creatorAddress = creatorAddress; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getTerminatedAt() { return terminatedAt; }
    public void setTerminatedAt(Instant terminatedAt) { this.terminatedAt = terminatedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getLastEventAt() { return lastEventAt; }
    public void setLastEventAt(Instant lastEventAt) { this.lastEventAt = lastEventAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<String> getParties() { return parties; }
    public void setParties(List<String> parties) { this.parties = parties; }

    public Long getExecutionCount() { return executionCount; }
    public void setExecutionCount(Long executionCount) { this.executionCount = executionCount; }

    public Long getEventCount() { return eventCount; }
    public void setEventCount(Long eventCount) { this.eventCount = eventCount; }

    public Instant getLastExecutionAt() { return lastExecutionAt; }
    public void setLastExecutionAt(Instant lastExecutionAt) { this.lastExecutionAt = lastExecutionAt; }

    public String getLastExecutionStatus() { return lastExecutionStatus; }
    public void setLastExecutionStatus(String lastExecutionStatus) { this.lastExecutionStatus = lastExecutionStatus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public Boolean getNotificationEnabled() { return notificationEnabled; }
    public void setNotificationEnabled(Boolean notificationEnabled) { this.notificationEnabled = notificationEnabled; }

    public String getNotificationRecipients() { return notificationRecipients; }
    public void setNotificationRecipients(String notificationRecipients) { this.notificationRecipients = notificationRecipients; }

    // ==================== ENUM DEFINITIONS ====================

    public enum ActiveContractStatus {
        PENDING,        // Created but not yet activated
        ACTIVE,         // Currently active and executing
        PAUSED,         // Temporarily paused
        COMPLETED,      // Successfully completed
        TERMINATED,     // Terminated before completion
        EXPIRED         // Expired without completion
    }

    @Override
    public String toString() {
        return String.format("ActiveContract{id=%d, contractId='%s', name='%s', status=%s, parties=%d}",
                id, contractId, name, status, parties.size());
    }
}
