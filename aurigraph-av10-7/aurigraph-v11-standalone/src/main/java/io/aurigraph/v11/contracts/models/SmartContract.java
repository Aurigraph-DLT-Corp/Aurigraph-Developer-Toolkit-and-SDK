package io.aurigraph.v11.contracts.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Smart Contract Entity for Aurigraph V11
 *
 * Represents a Ricardian smart contract with RWA (Real-World Asset) support.
 * Supports contract lifecycle management, digital twins, and multi-party agreements.
 *
 * @version 3.8.0 (Phase 2)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "smart_contracts", indexes = {
    @Index(name = "idx_contract_id", columnList = "contractId", unique = true),
    @Index(name = "idx_owner", columnList = "owner"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_type", columnList = "contractType"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class SmartContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contractId", nullable = false, unique = true, length = 66)
    private String contractId;

    @Column(name = "owner", nullable = false, length = 66)
    private String owner;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "contractType", nullable = false, length = 50)
    private ContractType contractType;

    @Column(name = "sourceCode", columnDefinition = "TEXT")
    private String sourceCode;

    @Column(name = "bytecode", columnDefinition = "TEXT")
    private String bytecode;

    @Column(name = "abiDefinition", columnDefinition = "TEXT")
    private String abiDefinition;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ContractStatus status;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "templateId", length = 66)
    private String templateId;

    @Column(name = "parentContractId", length = 66)
    private String parentContractId;

    // Financial fields
    @Column(name = "value", precision = 36, scale = 18)
    private BigDecimal value;

    @Column(name = "currency", length = 10)
    private String currency = "AUR";

    // RWA (Real-World Asset) fields
    @Column(name = "assetId", length = 100)
    private String assetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "assetType", length = 50)
    private AssetType assetType;

    @Column(name = "isRWA", nullable = false)
    private Boolean isRWA = false;

    @Column(name = "isDigitalTwin", nullable = false)
    private Boolean isDigitalTwin = false;

    // Verification and security
    @Column(name = "isVerified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "verificationHash", length = 66)
    private String verificationHash;

    @Column(name = "securityAuditStatus", length = 30)
    private String securityAuditStatus;

    // Timestamps
    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt")
    private Instant updatedAt;

    @Column(name = "deployedAt")
    private Instant deployedAt;

    @Column(name = "completedAt")
    private Instant completedAt;

    @Column(name = "expiresAt")
    private Instant expiresAt;

    // Execution metrics
    @Column(name = "executionCount", nullable = false)
    private Long executionCount = 0L;

    @Column(name = "gasUsed", nullable = false)
    private Long gasUsed = 0L;

    @Column(name = "lastExecutedAt")
    private Instant lastExecutedAt;

    // Multi-party support
    @ElementCollection
    @CollectionTable(name = "contract_parties", joinColumns = @JoinColumn(name = "contract_id"))
    @Column(name = "party_address")
    private List<String> parties = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "contract_tags", joinColumns = @JoinColumn(name = "contract_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    // Compliance and regulatory
    @Column(name = "jurisdiction", length = 10)
    private String jurisdiction;

    @Column(name = "complianceStatus", length = 30)
    private String complianceStatus;

    @Column(name = "kycVerified", nullable = false)
    private Boolean kycVerified = false;

    @Column(name = "amlChecked", nullable = false)
    private Boolean amlChecked = false;

    // Metadata
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "ipfsHash", length = 100)
    private String ipfsHash;

    // ==================== CONSTRUCTORS ====================

    public SmartContract() {
        this.createdAt = Instant.now();
        this.status = ContractStatus.DRAFT;
    }

    public SmartContract(String contractId, String owner, String name, ContractType contractType) {
        this();
        this.contractId = contractId;
        this.owner = owner;
        this.name = name;
        this.contractType = contractType;
    }

    // ==================== LIFECYCLE METHODS ====================

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = ContractStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Deploy the contract (move from DRAFT to DEPLOYED state)
     */
    public void deploy() {
        if (status != ContractStatus.DRAFT && status != ContractStatus.COMPILED) {
            throw new IllegalStateException("Cannot deploy contract in state: " + status);
        }
        this.status = ContractStatus.DEPLOYED;
        this.deployedAt = Instant.now();
    }

    /**
     * Activate the contract
     */
    public void activate() {
        if (status != ContractStatus.DEPLOYED) {
            throw new IllegalStateException("Cannot activate contract in state: " + status);
        }
        this.status = ContractStatus.ACTIVE;
    }

    /**
     * Complete the contract
     */
    public void complete() {
        if (status != ContractStatus.ACTIVE) {
            throw new IllegalStateException("Cannot complete contract in state: " + status);
        }
        this.status = ContractStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    /**
     * Terminate the contract
     */
    public void terminate() {
        this.status = ContractStatus.TERMINATED;
    }

    /**
     * Record contract execution
     */
    public void recordExecution(long gasConsumed) {
        this.executionCount++;
        this.gasUsed += gasConsumed;
        this.lastExecutedAt = Instant.now();
    }

    /**
     * Check if contract is active and can be executed
     */
    public boolean isExecutable() {
        return status == ContractStatus.ACTIVE &&
               (expiresAt == null || expiresAt.isAfter(Instant.now()));
    }

    /**
     * Check if contract has expired
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(Instant.now());
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ContractType getContractType() { return contractType; }
    public void setContractType(ContractType contractType) { this.contractType = contractType; }

    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }

    public String getBytecode() { return bytecode; }
    public void setBytecode(String bytecode) { this.bytecode = bytecode; }

    public String getAbiDefinition() { return abiDefinition; }
    public void setAbiDefinition(String abiDefinition) { this.abiDefinition = abiDefinition; }

    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus status) { this.status = status; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public String getParentContractId() { return parentContractId; }
    public void setParentContractId(String parentContractId) { this.parentContractId = parentContractId; }

    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }

    public AssetType getAssetType() { return assetType; }
    public void setAssetType(AssetType assetType) { this.assetType = assetType; }

    public Boolean getIsRWA() { return isRWA; }
    public void setIsRWA(Boolean isRWA) { this.isRWA = isRWA; }

    public Boolean getIsDigitalTwin() { return isDigitalTwin; }
    public void setIsDigitalTwin(Boolean isDigitalTwin) { this.isDigitalTwin = isDigitalTwin; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public String getVerificationHash() { return verificationHash; }
    public void setVerificationHash(String verificationHash) { this.verificationHash = verificationHash; }

    public String getSecurityAuditStatus() { return securityAuditStatus; }
    public void setSecurityAuditStatus(String securityAuditStatus) { this.securityAuditStatus = securityAuditStatus; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getDeployedAt() { return deployedAt; }
    public void setDeployedAt(Instant deployedAt) { this.deployedAt = deployedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Long getExecutionCount() { return executionCount; }
    public void setExecutionCount(Long executionCount) { this.executionCount = executionCount; }

    public Long getGasUsed() { return gasUsed; }
    public void setGasUsed(Long gasUsed) { this.gasUsed = gasUsed; }

    public Instant getLastExecutedAt() { return lastExecutedAt; }
    public void setLastExecutedAt(Instant lastExecutedAt) { this.lastExecutedAt = lastExecutedAt; }

    public List<String> getParties() { return parties; }
    public void setParties(List<String> parties) { this.parties = parties; }

    public void addParty(String partyAddress) {
        if (!this.parties.contains(partyAddress)) {
            this.parties.add(partyAddress);
        }
    }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public void addTag(String tag) {
        if (!this.tags.contains(tag)) {
            this.tags.add(tag);
        }
    }

    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }

    public String getComplianceStatus() { return complianceStatus; }
    public void setComplianceStatus(String complianceStatus) { this.complianceStatus = complianceStatus; }

    public Boolean getKycVerified() { return kycVerified; }
    public void setKycVerified(Boolean kycVerified) { this.kycVerified = kycVerified; }

    public Boolean getAmlChecked() { return amlChecked; }
    public void setAmlChecked(Boolean amlChecked) { this.amlChecked = amlChecked; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getIpfsHash() { return ipfsHash; }
    public void setIpfsHash(String ipfsHash) { this.ipfsHash = ipfsHash; }

    // ==================== ENUM DEFINITIONS ====================

    public enum ContractType {
        RICARDIAN,
        RWA_TOKENIZATION,
        DIGITAL_TWIN,
        STANDARD,
        TEMPLATE,
        ESCROW,
        MULTI_PARTY,
        FRACTIONAL_OWNERSHIP
    }

    @Override
    public String toString() {
        return String.format("SmartContract{id=%d, contractId='%s', name='%s', type=%s, status=%s, owner='%s'}",
                id, contractId, name, contractType, status, owner);
    }
}
