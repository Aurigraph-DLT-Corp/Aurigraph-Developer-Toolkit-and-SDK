package io.aurigraph.v11.persistence.entities;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Generic Registry Entry JPA Entity
 *
 * Multi-purpose registry for various blockchain artifacts:
 * - Smart contracts (addresses, ABIs, versions)
 * - Token contracts (ERC-20, ERC-721, custom)
 * - Oracle endpoints and data feeds
 * - External system integrations
 * - Configuration registries
 * - Feature flags and toggles
 *
 * Features:
 * - Flexible key-value storage with JSONB
 * - Hierarchical organization (parent-child relationships)
 * - Version tracking and history
 * - Status management (active, deprecated, archived)
 * - Multi-tenant support
 *
 * Performance Targets:
 * - Write: <50ms for registry entry creation/update
 * - Query: <30ms for key-based lookups
 * - Bulk Operations: 1000+ entries/second
 *
 * @since V11.4.4
 */
@Entity
@Table(name = "registry_entry", indexes = {
    @Index(name = "idx_registry_key", columnList = "registry_key", unique = true),
    @Index(name = "idx_registry_type", columnList = "entry_type"),
    @Index(name = "idx_registry_category", columnList = "category"),
    @Index(name = "idx_registry_status", columnList = "status"),
    @Index(name = "idx_registry_parent", columnList = "parent_id"),
    @Index(name = "idx_registry_created", columnList = "created_at"),
    @Index(name = "idx_registry_tenant", columnList = "tenant_id")
})
public class RegistryEntryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "registry_key", nullable = false, unique = true, length = 500)
    private String registryKey;

    @Column(name = "entry_type", nullable = false, length = 100)
    private String entryType;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Type(JsonBinaryType.class)
    @Column(name = "value", columnDefinition = "jsonb")
    private Map<String, Object> value;

    @Type(JsonBinaryType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "parent_id", columnDefinition = "UUID")
    private UUID parentId;

    @Column(name = "priority", nullable = false)
    private Integer priority = 0;

    @Column(name = "tags", length = 1000)
    private String tags;

    @Column(name = "blockchain_address", length = 255)
    private String blockchainAddress;

    @Column(name = "smart_contract_abi", columnDefinition = "TEXT")
    private String smartContractAbi;

    @Column(name = "deployed_at")
    private Instant deployedAt;

    @Column(name = "deprecated_at")
    private Instant deprecatedAt;

    @Column(name = "deprecation_reason", columnDefinition = "TEXT")
    private String deprecationReason;

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

    public String getRegistryKey() {
        return registryKey;
    }

    public void setRegistryKey(String registryKey) {
        this.registryKey = registryKey;
    }

    public String getEntryType() {
        return entryType;
    }

    public void setEntryType(String entryType) {
        this.entryType = entryType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getValue() {
        return value;
    }

    public void setValue(Map<String, Object> value) {
        this.value = value;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getParentId() {
        return parentId;
    }

    public void setParentId(UUID parentId) {
        this.parentId = parentId;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getBlockchainAddress() {
        return blockchainAddress;
    }

    public void setBlockchainAddress(String blockchainAddress) {
        this.blockchainAddress = blockchainAddress;
    }

    public String getSmartContractAbi() {
        return smartContractAbi;
    }

    public void setSmartContractAbi(String smartContractAbi) {
        this.smartContractAbi = smartContractAbi;
    }

    public Instant getDeployedAt() {
        return deployedAt;
    }

    public void setDeployedAt(Instant deployedAt) {
        this.deployedAt = deployedAt;
    }

    public Instant getDeprecatedAt() {
        return deprecatedAt;
    }

    public void setDeprecatedAt(Instant deprecatedAt) {
        this.deprecatedAt = deprecatedAt;
    }

    public String getDeprecationReason() {
        return deprecationReason;
    }

    public void setDeprecationReason(String deprecationReason) {
        this.deprecationReason = deprecationReason;
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
}
