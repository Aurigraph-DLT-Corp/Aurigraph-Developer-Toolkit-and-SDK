package io.aurigraph.v11.persistence.entities;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Smart Contract JPA Entity
 *
 * Tracks deployed smart contracts and their lifecycle:
 * - Contract deployment and versioning
 * - ABI (Application Binary Interface) storage
 * - Contract state and execution history
 * - Asset associations and ownership
 * - Gas usage and performance metrics
 * - Upgrade and migration tracking
 *
 * Features:
 * - Full contract lifecycle management
 * - Version control and upgrade paths
 * - Event and transaction history
 * - Security audit trail
 * - Cross-chain contract registry
 *
 * Performance Targets:
 * - Write: <100ms for contract registration
 * - Query: <50ms for contract lookup by address
 * - Bulk Operations: 500+ contracts/second
 *
 * @since V11.4.4
 */
@Entity
@Table(name = "smart_contract", indexes = {
    @Index(name = "idx_contract_address", columnList = "contract_address", unique = true),
    @Index(name = "idx_contract_type", columnList = "contract_type"),
    @Index(name = "idx_contract_status", columnList = "status"),
    @Index(name = "idx_contract_owner", columnList = "owner_id"),
    @Index(name = "idx_contract_deployed", columnList = "deployed_at"),
    @Index(name = "idx_contract_version", columnList = "version"),
    @Index(name = "idx_contract_chain", columnList = "blockchain_network")
})
public class SmartContractJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "contract_address", nullable = false, unique = true, length = 255)
    private String contractAddress;

    @Column(name = "contract_type", nullable = false, length = 100)
    private String contractType;

    @Column(name = "contract_name", nullable = false, length = 500)
    private String contractName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "version", nullable = false, length = 50)
    private String version;

    @Column(name = "blockchain_network", nullable = false, length = 100)
    private String blockchainNetwork;

    @Column(name = "compiler_version", length = 100)
    private String compilerVersion;

    @Column(name = "bytecode", columnDefinition = "TEXT")
    private String bytecode;

    @Column(name = "source_code", columnDefinition = "TEXT")
    private String sourceCode;

    @Type(JsonBinaryType.class)
    @Column(name = "abi", columnDefinition = "jsonb")
    private Map<String, Object> abi;

    @Column(name = "deployment_tx_hash", length = 255)
    private String deploymentTxHash;

    @Column(name = "deployed_at")
    private Instant deployedAt;

    @Column(name = "deployed_by", length = 255)
    private String deployedBy;

    @Column(name = "owner_id", length = 255)
    private String ownerId;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verified_by", length = 255)
    private String verifiedBy;

    @Type(JsonBinaryType.class)
    @Column(name = "constructor_args", columnDefinition = "jsonb")
    private Map<String, Object> constructorArgs;

    @Type(JsonBinaryType.class)
    @Column(name = "deployment_config", columnDefinition = "jsonb")
    private Map<String, Object> deploymentConfig;

    @Column(name = "gas_used")
    private Long gasUsed;

    @Column(name = "deployment_cost_eth", precision = 30, scale = 18)
    private java.math.BigDecimal deploymentCostEth;

    @Column(name = "is_upgradeable", nullable = false)
    private Boolean isUpgradeable = false;

    @Column(name = "proxy_address", length = 255)
    private String proxyAddress;

    @Column(name = "implementation_address", length = 255)
    private String implementationAddress;

    @Column(name = "previous_version_id", columnDefinition = "UUID")
    private UUID previousVersionId;

    @Column(name = "upgraded_to_id", columnDefinition = "UUID")
    private UUID upgradedToId;

    @Type(JsonBinaryType.class)
    @Column(name = "linked_assets", columnDefinition = "jsonb")
    private List<String> linkedAssets;

    @Type(JsonBinaryType.class)
    @Column(name = "events_emitted", columnDefinition = "jsonb")
    private Map<String, Object> eventsEmitted;

    @Type(JsonBinaryType.class)
    @Column(name = "security_audit", columnDefinition = "jsonb")
    private Map<String, Object> securityAudit;

    @Column(name = "audit_status", length = 50)
    private String auditStatus;

    @Column(name = "audited_at")
    private Instant auditedAt;

    @Column(name = "audited_by", length = 255)
    private String auditedBy;

    @Type(JsonBinaryType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "paused", nullable = false)
    private Boolean paused = false;

    @Column(name = "paused_at")
    private Instant pausedAt;

    @Column(name = "paused_by", length = 255)
    private String pausedBy;

    @Column(name = "deactivated", nullable = false)
    private Boolean deactivated = false;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;

    @Column(name = "deactivation_reason", columnDefinition = "TEXT")
    private String deactivationReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "tenant_id", length = 255)
    private String tenantId;

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

    public String getContractAddress() {
        return contractAddress;
    }

    public void setContractAddress(String contractAddress) {
        this.contractAddress = contractAddress;
    }

    public String getContractType() {
        return contractType;
    }

    public void setContractType(String contractType) {
        this.contractType = contractType;
    }

    public String getContractName() {
        return contractName;
    }

    public void setContractName(String contractName) {
        this.contractName = contractName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getBlockchainNetwork() {
        return blockchainNetwork;
    }

    public void setBlockchainNetwork(String blockchainNetwork) {
        this.blockchainNetwork = blockchainNetwork;
    }

    public String getCompilerVersion() {
        return compilerVersion;
    }

    public void setCompilerVersion(String compilerVersion) {
        this.compilerVersion = compilerVersion;
    }

    public String getBytecode() {
        return bytecode;
    }

    public void setBytecode(String bytecode) {
        this.bytecode = bytecode;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }

    public Map<String, Object> getAbi() {
        return abi;
    }

    public void setAbi(Map<String, Object> abi) {
        this.abi = abi;
    }

    public String getDeploymentTxHash() {
        return deploymentTxHash;
    }

    public void setDeploymentTxHash(String deploymentTxHash) {
        this.deploymentTxHash = deploymentTxHash;
    }

    public Instant getDeployedAt() {
        return deployedAt;
    }

    public void setDeployedAt(Instant deployedAt) {
        this.deployedAt = deployedAt;
    }

    public String getDeployedBy() {
        return deployedBy;
    }

    public void setDeployedBy(String deployedBy) {
        this.deployedBy = deployedBy;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public Map<String, Object> getConstructorArgs() {
        return constructorArgs;
    }

    public void setConstructorArgs(Map<String, Object> constructorArgs) {
        this.constructorArgs = constructorArgs;
    }

    public Map<String, Object> getDeploymentConfig() {
        return deploymentConfig;
    }

    public void setDeploymentConfig(Map<String, Object> deploymentConfig) {
        this.deploymentConfig = deploymentConfig;
    }

    public Long getGasUsed() {
        return gasUsed;
    }

    public void setGasUsed(Long gasUsed) {
        this.gasUsed = gasUsed;
    }

    public java.math.BigDecimal getDeploymentCostEth() {
        return deploymentCostEth;
    }

    public void setDeploymentCostEth(java.math.BigDecimal deploymentCostEth) {
        this.deploymentCostEth = deploymentCostEth;
    }

    public Boolean getIsUpgradeable() {
        return isUpgradeable;
    }

    public void setIsUpgradeable(Boolean isUpgradeable) {
        this.isUpgradeable = isUpgradeable;
    }

    public String getProxyAddress() {
        return proxyAddress;
    }

    public void setProxyAddress(String proxyAddress) {
        this.proxyAddress = proxyAddress;
    }

    public String getImplementationAddress() {
        return implementationAddress;
    }

    public void setImplementationAddress(String implementationAddress) {
        this.implementationAddress = implementationAddress;
    }

    public UUID getPreviousVersionId() {
        return previousVersionId;
    }

    public void setPreviousVersionId(UUID previousVersionId) {
        this.previousVersionId = previousVersionId;
    }

    public UUID getUpgradedToId() {
        return upgradedToId;
    }

    public void setUpgradedToId(UUID upgradedToId) {
        this.upgradedToId = upgradedToId;
    }

    public List<String> getLinkedAssets() {
        return linkedAssets;
    }

    public void setLinkedAssets(List<String> linkedAssets) {
        this.linkedAssets = linkedAssets;
    }

    public Map<String, Object> getEventsEmitted() {
        return eventsEmitted;
    }

    public void setEventsEmitted(Map<String, Object> eventsEmitted) {
        this.eventsEmitted = eventsEmitted;
    }

    public Map<String, Object> getSecurityAudit() {
        return securityAudit;
    }

    public void setSecurityAudit(Map<String, Object> securityAudit) {
        this.securityAudit = securityAudit;
    }

    public String getAuditStatus() {
        return auditStatus;
    }

    public void setAuditStatus(String auditStatus) {
        this.auditStatus = auditStatus;
    }

    public Instant getAuditedAt() {
        return auditedAt;
    }

    public void setAuditedAt(Instant auditedAt) {
        this.auditedAt = auditedAt;
    }

    public String getAuditedBy() {
        return auditedBy;
    }

    public void setAuditedBy(String auditedBy) {
        this.auditedBy = auditedBy;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Boolean getPaused() {
        return paused;
    }

    public void setPaused(Boolean paused) {
        this.paused = paused;
    }

    public Instant getPausedAt() {
        return pausedAt;
    }

    public void setPausedAt(Instant pausedAt) {
        this.pausedAt = pausedAt;
    }

    public String getPausedBy() {
        return pausedBy;
    }

    public void setPausedBy(String pausedBy) {
        this.pausedBy = pausedBy;
    }

    public Boolean getDeactivated() {
        return deactivated;
    }

    public void setDeactivated(Boolean deactivated) {
        this.deactivated = deactivated;
    }

    public Instant getDeactivatedAt() {
        return deactivatedAt;
    }

    public void setDeactivatedAt(Instant deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }

    public String getDeactivationReason() {
        return deactivationReason;
    }

    public void setDeactivationReason(String deactivationReason) {
        this.deactivationReason = deactivationReason;
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

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
