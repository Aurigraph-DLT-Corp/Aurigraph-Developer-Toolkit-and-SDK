package io.aurigraph.v11.persistence.entities;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Ownership Record JPA Entity
 *
 * Tracks ownership transfers and custody chain for assets including:
 * - Complete ownership history with timestamps
 * - Transfer metadata (reason, price, verification status)
 * - Multi-party transfer support (escrow, intermediaries)
 * - Digital signatures for non-repudiation
 * - Regulatory compliance documentation
 *
 * Features:
 * - Immutable ownership records (no updates after creation)
 * - Cryptographic verification of transfers
 * - Support for complex transfer scenarios (fractional ownership, leases)
 * - Audit trail integration
 *
 * Performance Targets:
 * - Write: <100ms for ownership record creation
 * - Query: <50ms for ownership history retrieval
 * - Bulk Import: 500+ records/second
 *
 * @since V11.4.4
 */
@Entity
@Table(name = "ownership_record", indexes = {
    @Index(name = "idx_ownership_asset_id", columnList = "asset_id"),
    @Index(name = "idx_ownership_from_owner", columnList = "from_owner_id"),
    @Index(name = "idx_ownership_to_owner", columnList = "to_owner_id"),
    @Index(name = "idx_ownership_transfer_date", columnList = "transfer_date"),
    @Index(name = "idx_ownership_status", columnList = "status"),
    @Index(name = "idx_ownership_tx_hash", columnList = "blockchain_tx_hash")
})
public class OwnershipRecordJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private AssetTraceJpaEntity asset;

    @Column(name = "from_owner_id", length = 255)
    private String fromOwnerId;

    @Column(name = "from_owner_name", length = 500)
    private String fromOwnerName;

    @Column(name = "to_owner_id", nullable = false, length = 255)
    private String toOwnerId;

    @Column(name = "to_owner_name", length = 500)
    private String toOwnerName;

    @Column(name = "transfer_date", nullable = false)
    private Instant transferDate;

    @Column(name = "transfer_type", nullable = false, length = 50)
    private String transferType;

    @Column(name = "transfer_reason", columnDefinition = "TEXT")
    private String transferReason;

    @Column(name = "transfer_price", precision = 19, scale = 2)
    private BigDecimal transferPrice;

    @Column(name = "currency_code", length = 10)
    private String currencyCode;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "verification_status", length = 50)
    private String verificationStatus;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verified_by", length = 255)
    private String verifiedBy;

    @Column(name = "from_owner_signature", columnDefinition = "TEXT")
    private String fromOwnerSignature;

    @Column(name = "to_owner_signature", columnDefinition = "TEXT")
    private String toOwnerSignature;

    @Column(name = "witness_signature", columnDefinition = "TEXT")
    private String witnessSignature;

    @Column(name = "escrow_agent_id", length = 255)
    private String escrowAgentId;

    @Column(name = "escrow_release_date")
    private Instant escrowReleaseDate;

    @Column(name = "blockchain_tx_hash", length = 255)
    private String blockchainTxHash;

    @Column(name = "smart_contract_address", length = 255)
    private String smartContractAddress;

    @Type(JsonBinaryType.class)
    @Column(name = "transfer_metadata", columnDefinition = "jsonb")
    private Map<String, Object> transferMetadata;

    @Type(JsonBinaryType.class)
    @Column(name = "compliance_documents", columnDefinition = "jsonb")
    private Map<String, Object> complianceDocuments;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", length = 255)
    private String createdBy;

    @Column(name = "tenant_id", length = 255)
    private String tenantId;

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
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

    public String getFromOwnerId() {
        return fromOwnerId;
    }

    public void setFromOwnerId(String fromOwnerId) {
        this.fromOwnerId = fromOwnerId;
    }

    public String getFromOwnerName() {
        return fromOwnerName;
    }

    public void setFromOwnerName(String fromOwnerName) {
        this.fromOwnerName = fromOwnerName;
    }

    public String getToOwnerId() {
        return toOwnerId;
    }

    public void setToOwnerId(String toOwnerId) {
        this.toOwnerId = toOwnerId;
    }

    public String getToOwnerName() {
        return toOwnerName;
    }

    public void setToOwnerName(String toOwnerName) {
        this.toOwnerName = toOwnerName;
    }

    public Instant getTransferDate() {
        return transferDate;
    }

    public void setTransferDate(Instant transferDate) {
        this.transferDate = transferDate;
    }

    public String getTransferType() {
        return transferType;
    }

    public void setTransferType(String transferType) {
        this.transferType = transferType;
    }

    public String getTransferReason() {
        return transferReason;
    }

    public void setTransferReason(String transferReason) {
        this.transferReason = transferReason;
    }

    public BigDecimal getTransferPrice() {
        return transferPrice;
    }

    public void setTransferPrice(BigDecimal transferPrice) {
        this.transferPrice = transferPrice;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public String getFromOwnerSignature() {
        return fromOwnerSignature;
    }

    public void setFromOwnerSignature(String fromOwnerSignature) {
        this.fromOwnerSignature = fromOwnerSignature;
    }

    public String getToOwnerSignature() {
        return toOwnerSignature;
    }

    public void setToOwnerSignature(String toOwnerSignature) {
        this.toOwnerSignature = toOwnerSignature;
    }

    public String getWitnessSignature() {
        return witnessSignature;
    }

    public void setWitnessSignature(String witnessSignature) {
        this.witnessSignature = witnessSignature;
    }

    public String getEscrowAgentId() {
        return escrowAgentId;
    }

    public void setEscrowAgentId(String escrowAgentId) {
        this.escrowAgentId = escrowAgentId;
    }

    public Instant getEscrowReleaseDate() {
        return escrowReleaseDate;
    }

    public void setEscrowReleaseDate(Instant escrowReleaseDate) {
        this.escrowReleaseDate = escrowReleaseDate;
    }

    public String getBlockchainTxHash() {
        return blockchainTxHash;
    }

    public void setBlockchainTxHash(String blockchainTxHash) {
        this.blockchainTxHash = blockchainTxHash;
    }

    public String getSmartContractAddress() {
        return smartContractAddress;
    }

    public void setSmartContractAddress(String smartContractAddress) {
        this.smartContractAddress = smartContractAddress;
    }

    public Map<String, Object> getTransferMetadata() {
        return transferMetadata;
    }

    public void setTransferMetadata(Map<String, Object> transferMetadata) {
        this.transferMetadata = transferMetadata;
    }

    public Map<String, Object> getComplianceDocuments() {
        return complianceDocuments;
    }

    public void setComplianceDocuments(Map<String, Object> complianceDocuments) {
        this.complianceDocuments = complianceDocuments;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
