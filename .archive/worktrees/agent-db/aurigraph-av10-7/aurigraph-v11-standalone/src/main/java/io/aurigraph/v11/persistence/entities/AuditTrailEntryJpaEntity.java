package io.aurigraph.v11.persistence.entities;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Audit Trail Entry JPA Entity
 *
 * Complete immutable audit log for all asset-related operations:
 * - CRUD operations on assets
 * - Ownership transfers and custody changes
 * - Status transitions and lifecycle events
 * - Smart contract interactions
 * - Compliance checks and verifications
 * - System and user actions
 *
 * Features:
 * - Immutable records (append-only, no updates/deletes)
 * - Cryptographic integrity (hash chains)
 * - Complete before/after state capture
 * - User and system attribution
 * - Regulatory compliance support (GDPR, SOC2, FDA)
 *
 * Performance Targets:
 * - Write: <50ms for audit entry creation
 * - Query: <100ms for audit trail retrieval
 * - Bulk Write: 2000+ entries/second
 *
 * @since V11.4.4
 */
@Entity
@Table(name = "audit_trail_entry", indexes = {
    @Index(name = "idx_audit_asset_id", columnList = "asset_id"),
    @Index(name = "idx_audit_action_type", columnList = "action_type"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_entity_type", columnList = "entity_type"),
    @Index(name = "idx_audit_entity_id", columnList = "entity_id"),
    @Index(name = "idx_audit_severity", columnList = "severity")
})
public class AuditTrailEntryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    private AssetTraceJpaEntity asset;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 255)
    private String entityId;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "action_description", columnDefinition = "TEXT")
    private String actionDescription;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp;

    @Column(name = "user_id", length = 255)
    private String userId;

    @Column(name = "user_name", length = 500)
    private String userName;

    @Column(name = "user_role", length = 100)
    private String userRole;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "session_id", length = 255)
    private String sessionId;

    @Type(JsonBinaryType.class)
    @Column(name = "before_state", columnDefinition = "jsonb")
    private Map<String, Object> beforeState;

    @Type(JsonBinaryType.class)
    @Column(name = "after_state", columnDefinition = "jsonb")
    private Map<String, Object> afterState;

    @Type(JsonBinaryType.class)
    @Column(name = "changes", columnDefinition = "jsonb")
    private Map<String, Object> changes;

    @Type(JsonBinaryType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "severity", length = 50)
    private String severity;

    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "blockchain_tx_hash", length = 255)
    private String blockchainTxHash;

    @Column(name = "previous_entry_hash", length = 255)
    private String previousEntryHash;

    @Column(name = "entry_hash", length = 255)
    private String entryHash;

    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "compliance_tags", length = 500)
    private String complianceTags;

    @Column(name = "tenant_id", length = 255)
    private String tenantId;

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        timestamp = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public AssetTraceJpaEntity getAsset() {
        return asset;
    }

    public void setAsset(AssetTraceJpaEntity asset) {
        this.asset = asset;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getActionDescription() {
        return actionDescription;
    }

    public void setActionDescription(String actionDescription) {
        this.actionDescription = actionDescription;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Map<String, Object> getBeforeState() {
        return beforeState;
    }

    public void setBeforeState(Map<String, Object> beforeState) {
        this.beforeState = beforeState;
    }

    public Map<String, Object> getAfterState() {
        return afterState;
    }

    public void setAfterState(Map<String, Object> afterState) {
        this.afterState = afterState;
    }

    public Map<String, Object> getChanges() {
        return changes;
    }

    public void setChanges(Map<String, Object> changes) {
        this.changes = changes;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getBlockchainTxHash() {
        return blockchainTxHash;
    }

    public void setBlockchainTxHash(String blockchainTxHash) {
        this.blockchainTxHash = blockchainTxHash;
    }

    public String getPreviousEntryHash() {
        return previousEntryHash;
    }

    public void setPreviousEntryHash(String previousEntryHash) {
        this.previousEntryHash = previousEntryHash;
    }

    public String getEntryHash() {
        return entryHash;
    }

    public void setEntryHash(String entryHash) {
        this.entryHash = entryHash;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getComplianceTags() {
        return complianceTags;
    }

    public void setComplianceTags(String complianceTags) {
        this.complianceTags = complianceTags;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
