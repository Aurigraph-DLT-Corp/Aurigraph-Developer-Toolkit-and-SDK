package io.aurigraph.v11.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Active Contract Entity - Represents executable contracts with triple-entry accounting
 *
 * Features:
 * - Multi-party contract management
 * - Workflow state machine integration
 * - Smart contract binding
 * - Compliance and jurisdiction support
 * - Triple-entry accounting integration
 * - Audit trail and event tracking
 *
 * @version 1.0.0
 * @since Sprint 13 (AV11-060)
 */
@Entity
@Table(name = "active_contracts", indexes = {
    @Index(name = "idx_contract_id", columnList = "contractId", unique = true),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_contract_type", columnList = "contractType"),
    @Index(name = "idx_created_at", columnList = "createdAt"),
    @Index(name = "idx_expires_at", columnList = "expiresAt"),
    @Index(name = "idx_jurisdiction", columnList = "jurisdiction"),
    @Index(name = "idx_smart_contract", columnList = "smartContractAddress")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveContract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JsonProperty("id")
    private UUID id;

    @Column(name = "contractId", nullable = false, unique = true, length = 128)
    @JsonProperty("contractId")
    private String contractId;

    @Column(name = "contractType", nullable = false, length = 64)
    @JsonProperty("contractType")
    private String contractType; // ESCROW, LOAN, SWAP, DERIVATIVE, INSURANCE, SUPPLY_CHAIN, etc.

    @Column(name = "contractName", length = 256)
    @JsonProperty("contractName")
    private String contractName;

    @Column(name = "contractDescription", columnDefinition = "TEXT")
    @JsonProperty("contractDescription")
    private String contractDescription;

    /**
     * Parties involved in the contract stored as JSON array
     * Format: [{"partyId": "...", "address": "...", "role": "...", "signatureRequired": true}, ...]
     */
    @Column(name = "parties", columnDefinition = "TEXT", nullable = false)
    @JsonProperty("parties")
    private String parties; // JSON array

    /**
     * Legal document hash for immutable reference
     */
    @Column(name = "legalDocumentHash", length = 128)
    @JsonProperty("legalDocumentHash")
    private String legalDocumentHash;

    /**
     * Smart contract address binding to blockchain contract
     */
    @Column(name = "smartContractAddress", length = 128)
    @JsonProperty("smartContractAddress")
    private String smartContractAddress;

    /**
     * Contract status in workflow
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @JsonProperty("status")
    @Builder.Default
    private ContractStatus status = ContractStatus.DRAFT;

    /**
     * Terms and conditions stored as JSON
     * Format: {"paymentTerms": {...}, "deliveryTerms": {...}, "penaltyTerms": {...}}
     */
    @Column(name = "terms", columnDefinition = "TEXT")
    @JsonProperty("terms")
    private String terms; // JSON object

    /**
     * Workflow state for contract lifecycle management
     */
    @Column(name = "workflowState", length = 64)
    @JsonProperty("workflowState")
    @Builder.Default
    private String workflowState = "DRAFT";

    /**
     * Current action in workflow
     */
    @Column(name = "currentAction", length = 64)
    @JsonProperty("currentAction")
    private String currentAction;

    /**
     * Next available actions in workflow (JSON array)
     */
    @Column(name = "availableActions", columnDefinition = "TEXT")
    @JsonProperty("availableActions")
    private String availableActions; // JSON array

    /**
     * Timestamps
     */
    @Column(name = "createdAt", nullable = false)
    @JsonProperty("createdAt")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updatedAt")
    @JsonProperty("updatedAt")
    private Instant updatedAt;

    @Column(name = "executedAt")
    @JsonProperty("executedAt")
    private Instant executedAt;

    @Column(name = "expiresAt")
    @JsonProperty("expiresAt")
    private Instant expiresAt;

    @Column(name = "cancelledAt")
    @JsonProperty("cancelledAt")
    private Instant cancelledAt;

    /**
     * Compliance and jurisdiction
     */
    @Column(name = "complianceCheckRequired")
    @JsonProperty("complianceCheckRequired")
    @Builder.Default
    private boolean complianceCheckRequired = true;

    @Column(name = "complianceStatus", length = 32)
    @JsonProperty("complianceStatus")
    @Builder.Default
    private String complianceStatus = "PENDING"; // PENDING, PASSED, FAILED

    @Column(name = "jurisdiction", length = 64)
    @JsonProperty("jurisdiction")
    private String jurisdiction; // US, EU, UK, etc.

    @Column(name = "regulatoryFramework", length = 128)
    @JsonProperty("regulatoryFramework")
    private String regulatoryFramework; // SEC, MiFID II, etc.

    /**
     * Financial details
     */
    @Column(name = "contractValue", precision = 36, scale = 18)
    @JsonProperty("contractValue")
    private BigDecimal contractValue;

    @Column(name = "currency", length = 16)
    @JsonProperty("currency")
    @Builder.Default
    private String currency = "USD";

    @Column(name = "collateralRequired")
    @JsonProperty("collateralRequired")
    @Builder.Default
    private boolean collateralRequired = false;

    @Column(name = "collateralAmount", precision = 36, scale = 18)
    @JsonProperty("collateralAmount")
    private BigDecimal collateralAmount;

    @Column(name = "collateralCurrency", length = 16)
    @JsonProperty("collateralCurrency")
    private String collateralCurrency;

    /**
     * Execution parameters
     */
    @Column(name = "autoExecute")
    @JsonProperty("autoExecute")
    @Builder.Default
    private boolean autoExecute = false;

    @Column(name = "executionTrigger", columnDefinition = "TEXT")
    @JsonProperty("executionTrigger")
    private String executionTrigger; // JSON condition

    @Column(name = "executionCount")
    @JsonProperty("executionCount")
    @Builder.Default
    private long executionCount = 0L;

    @Column(name = "maxExecutions")
    @JsonProperty("maxExecutions")
    @Builder.Default
    private long maxExecutions = 1L;

    /**
     * Dispute handling
     */
    @Column(name = "disputed")
    @JsonProperty("disputed")
    @Builder.Default
    private boolean disputed = false;

    @Column(name = "disputeReason", columnDefinition = "TEXT")
    @JsonProperty("disputeReason")
    private String disputeReason;

    @Column(name = "disputedAt")
    @JsonProperty("disputedAt")
    private Instant disputedAt;

    @Column(name = "disputeResolution", columnDefinition = "TEXT")
    @JsonProperty("disputeResolution")
    private String disputeResolution;

    /**
     * Cancellation details
     */
    @Column(name = "cancellationReason", columnDefinition = "TEXT")
    @JsonProperty("cancellationReason")
    private String cancellationReason;

    @Column(name = "cancelledBy", length = 128)
    @JsonProperty("cancelledBy")
    private String cancelledBy;

    /**
     * Audit trail stored as JSON array
     * Format: [{"timestamp": "...", "action": "...", "actor": "...", "details": "..."}, ...]
     */
    @Column(name = "auditTrail", columnDefinition = "TEXT")
    @JsonProperty("auditTrail")
    @Builder.Default
    private String auditTrail = "[]"; // JSON array

    /**
     * Events log stored as JSON array
     */
    @Column(name = "events", columnDefinition = "TEXT")
    @JsonProperty("events")
    @Builder.Default
    private String events = "[]"; // JSON array

    /**
     * Signatures stored as JSON array
     * Format: [{"partyId": "...", "signature": "...", "timestamp": "...", "publicKey": "..."}, ...]
     */
    @Column(name = "signatures", columnDefinition = "TEXT")
    @JsonProperty("signatures")
    @Builder.Default
    private String signatures = "[]"; // JSON array

    /**
     * Metadata for extensibility (JSON object)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    @JsonProperty("metadata")
    @Builder.Default
    private String metadata = "{}"; // JSON object

    /**
     * Template reference
     */
    @Column(name = "templateId", length = 128)
    @JsonProperty("templateId")
    private String templateId;

    @Column(name = "templateVersion", length = 32)
    @JsonProperty("templateVersion")
    private String templateVersion;

    /**
     * Triple-entry accounting linkage
     */
    @Column(name = "linkedLedgerEntries", columnDefinition = "TEXT")
    @JsonProperty("linkedLedgerEntries")
    @Builder.Default
    private String linkedLedgerEntries = "[]"; // JSON array of ledger entry IDs

    /**
     * Smart contract execution data
     */
    @Column(name = "smartContractData", columnDefinition = "TEXT")
    @JsonProperty("smartContractData")
    private String smartContractData; // JSON object with contract-specific data

    @Column(name = "smartContractVersion", length = 32)
    @JsonProperty("smartContractVersion")
    private String smartContractVersion;

    /**
     * Risk assessment
     */
    @Column(name = "riskLevel", length = 16)
    @JsonProperty("riskLevel")
    @Builder.Default
    private String riskLevel = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "riskScore", precision = 5, scale = 2)
    @JsonProperty("riskScore")
    @Builder.Default
    private BigDecimal riskScore = BigDecimal.ZERO;

    @Column(name = "riskFactors", columnDefinition = "TEXT")
    @JsonProperty("riskFactors")
    private String riskFactors; // JSON array

    /**
     * Notification settings
     */
    @Column(name = "notificationsEnabled")
    @JsonProperty("notificationsEnabled")
    @Builder.Default
    private boolean notificationsEnabled = true;

    @Column(name = "notificationRecipients", columnDefinition = "TEXT")
    @JsonProperty("notificationRecipients")
    private String notificationRecipients; // JSON array

    /**
     * Performance tracking
     */
    @Column(name = "performanceMetrics", columnDefinition = "TEXT")
    @JsonProperty("performanceMetrics")
    private String performanceMetrics; // JSON object

    @Column(name = "slaCompliance")
    @JsonProperty("slaCompliance")
    @Builder.Default
    private boolean slaCompliance = true;

    /**
     * Lifecycle methods
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = ContractStatus.DRAFT;
        }
        if (workflowState == null) {
            workflowState = "DRAFT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Utility methods
     */
    public boolean isActive() {
        return status == ContractStatus.ACTIVE;
    }

    public boolean isExecuted() {
        return status == ContractStatus.EXECUTED;
    }

    public boolean isCancelled() {
        return status == ContractStatus.CANCELLED;
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public boolean requiresSignatures() {
        return status == ContractStatus.DRAFT || status == ContractStatus.PENDING_SIGNATURES;
    }

    public boolean canExecute() {
        return status == ContractStatus.ACTIVE &&
               !disputed &&
               !isExpired() &&
               (maxExecutions <= 0 || executionCount < maxExecutions);
    }

    public boolean hasSmartContract() {
        return smartContractAddress != null && !smartContractAddress.isEmpty();
    }

    /**
     * Business logic methods
     */
    public void markAsExecuted() {
        this.status = ContractStatus.EXECUTED;
        this.executedAt = Instant.now();
        this.executionCount++;
        this.updatedAt = Instant.now();
    }

    public void markAsCancelled(String reason, String cancelledBy) {
        this.status = ContractStatus.CANCELLED;
        this.cancelledAt = Instant.now();
        this.cancellationReason = reason;
        this.cancelledBy = cancelledBy;
        this.updatedAt = Instant.now();
    }

    public void markAsDisputed(String reason) {
        this.disputed = true;
        this.disputeReason = reason;
        this.disputedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void resolveDispute(String resolution) {
        this.disputed = false;
        this.disputeResolution = resolution;
        this.updatedAt = Instant.now();
    }

    public void updateWorkflowState(String newState, String action) {
        this.workflowState = newState;
        this.currentAction = action;
        this.updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ActiveContract that = (ActiveContract) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(contractId, that.contractId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, contractId);
    }

    @Override
    public String toString() {
        return String.format("ActiveContract{id=%s, contractId='%s', type='%s', status=%s, value=%s %s, parties=%s}",
            id, contractId, contractType, status, contractValue, currency,
            parties != null ? "present" : "none");
    }
}

/**
 * Contract Status Enum
 */
enum ContractStatus {
    DRAFT,              // Initial state, being created
    PENDING_APPROVAL,   // Waiting for approval
    PENDING_SIGNATURES, // Waiting for party signatures
    ACTIVE,            // Fully signed and active
    EXECUTED,          // Successfully executed
    COMPLETED,         // Execution completed
    CANCELLED,         // Cancelled before execution
    DISPUTED,          // Under dispute
    EXPIRED,           // Past expiration date
    SUSPENDED          // Temporarily suspended
}
