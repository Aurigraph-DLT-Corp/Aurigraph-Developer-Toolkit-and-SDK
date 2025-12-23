package io.aurigraph.v11.persistence.entities;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Asset Traceability JPA Entity
 *
 * Tracks complete asset lifecycle from creation to disposal including:
 * - Asset identification and classification
 * - Ownership history and transfers
 * - Location tracking with geospatial data
 * - Status transitions and lifecycle events
 * - Audit trail integration
 * - Regulatory compliance metadata
 *
 * Features:
 * - UUID primary key for global uniqueness
 * - JSONB metadata for flexible schema evolution
 * - Bidirectional relationships for ownership and audit trails
 * - Optimized indexes for common query patterns
 * - Support for multi-tenant deployments
 *
 * Performance Targets:
 * - Query: <50ms for asset lookups by ID
 * - Write: <100ms for asset creation/updates
 * - Bulk Operations: 1000+ assets/second
 *
 * @since V11.4.4
 */
@Entity
@Table(name = "asset_trace", indexes = {
    @Index(name = "idx_asset_trace_asset_id", columnList = "asset_id"),
    @Index(name = "idx_asset_trace_asset_type", columnList = "asset_type"),
    @Index(name = "idx_asset_trace_status", columnList = "status"),
    @Index(name = "idx_asset_trace_owner", columnList = "current_owner_id"),
    @Index(name = "idx_asset_trace_created", columnList = "created_at"),
    @Index(name = "idx_asset_trace_location", columnList = "current_location"),
    @Index(name = "idx_asset_trace_batch", columnList = "batch_id"),
    @Index(name = "idx_asset_trace_serial", columnList = "serial_number")
})
public class AssetTraceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "asset_id", nullable = false, unique = true, length = 255)
    private String assetId;

    @Column(name = "asset_type", nullable = false, length = 100)
    private String assetType;

    @Column(name = "asset_name", nullable = false, length = 500)
    private String assetName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "serial_number", length = 255)
    private String serialNumber;

    @Column(name = "batch_id", length = 255)
    private String batchId;

    @Column(name = "manufacturer", length = 255)
    private String manufacturer;

    @Column(name = "manufacture_date")
    private Instant manufactureDate;

    @Column(name = "expiry_date")
    private Instant expiryDate;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "current_owner_id", length = 255)
    private String currentOwnerId;

    @Column(name = "current_location", length = 500)
    private String currentLocation;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "quantity", precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "value_usd", precision = 19, scale = 2)
    private BigDecimal valueUsd;

    @Column(name = "currency_code", length = 10)
    private String currencyCode;

    @Column(name = "chain_of_custody_verified", nullable = false)
    private Boolean chainOfCustodyVerified = false;

    @Column(name = "compliance_status", length = 50)
    private String complianceStatus;

    @Column(name = "regulatory_framework", length = 100)
    private String regulatoryFramework;

    @Type(JsonBinaryType.class)
    @Column(name = "custom_attributes", columnDefinition = "jsonb")
    private Map<String, Object> customAttributes;

    @Type(JsonBinaryType.class)
    @Column(name = "sensors_data", columnDefinition = "jsonb")
    private Map<String, Object> sensorsData;

    @Type(JsonBinaryType.class)
    @Column(name = "certifications", columnDefinition = "jsonb")
    private List<String> certifications;

    @Column(name = "blockchain_tx_hash", length = 255)
    private String blockchainTxHash;

    @Column(name = "smart_contract_address", length = 255)
    private String smartContractAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by", length = 255)
    private String createdBy;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

    @Column(name = "tenant_id", length = 255)
    private String tenantId;

    @Column(name = "archived", nullable = false)
    private Boolean archived = false;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OwnershipRecordJpaEntity> ownershipHistory;

    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AuditTrailEntryJpaEntity> auditTrail;

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public String getAssetName() {
        return assetName;
    }

    public void setAssetName(String assetName) {
        this.assetName = assetName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getBatchId() {
        return batchId;
    }

    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public Instant getManufactureDate() {
        return manufactureDate;
    }

    public void setManufactureDate(Instant manufactureDate) {
        this.manufactureDate = manufactureDate;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCurrentOwnerId() {
        return currentOwnerId;
    }

    public void setCurrentOwnerId(String currentOwnerId) {
        this.currentOwnerId = currentOwnerId;
    }

    public String getCurrentLocation() {
        return currentLocation;
    }

    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }

    public BigDecimal getValueUsd() {
        return valueUsd;
    }

    public void setValueUsd(BigDecimal valueUsd) {
        this.valueUsd = valueUsd;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public Boolean getChainOfCustodyVerified() {
        return chainOfCustodyVerified;
    }

    public void setChainOfCustodyVerified(Boolean chainOfCustodyVerified) {
        this.chainOfCustodyVerified = chainOfCustodyVerified;
    }

    public String getComplianceStatus() {
        return complianceStatus;
    }

    public void setComplianceStatus(String complianceStatus) {
        this.complianceStatus = complianceStatus;
    }

    public String getRegulatoryFramework() {
        return regulatoryFramework;
    }

    public void setRegulatoryFramework(String regulatoryFramework) {
        this.regulatoryFramework = regulatoryFramework;
    }

    public Map<String, Object> getCustomAttributes() {
        return customAttributes;
    }

    public void setCustomAttributes(Map<String, Object> customAttributes) {
        this.customAttributes = customAttributes;
    }

    public Map<String, Object> getSensorsData() {
        return sensorsData;
    }

    public void setSensorsData(Map<String, Object> sensorsData) {
        this.sensorsData = sensorsData;
    }

    public List<String> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<String> certifications) {
        this.certifications = certifications;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Boolean getArchived() {
        return archived;
    }

    public void setArchived(Boolean archived) {
        this.archived = archived;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }

    public List<OwnershipRecordJpaEntity> getOwnershipHistory() {
        return ownershipHistory;
    }

    public void setOwnershipHistory(List<OwnershipRecordJpaEntity> ownershipHistory) {
        this.ownershipHistory = ownershipHistory;
    }

    public List<AuditTrailEntryJpaEntity> getAuditTrail() {
        return auditTrail;
    }

    public void setAuditTrail(List<AuditTrailEntryJpaEntity> auditTrail) {
        this.auditTrail = auditTrail;
    }
}
