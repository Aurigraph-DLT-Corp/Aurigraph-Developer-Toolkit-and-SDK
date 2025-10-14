package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import java.time.Instant;
import java.util.*;
import io.aurigraph.v11.contracts.models.ContractSignature;

/**
 * Ricardian Contract - Legal prose + Smart Contract logic
 * Combines human-readable legal agreement with machine-executable code
 */
public class RicardianContract {

    private String contractId;
    private String legalProse;
    private String smartContractCode;
    private ContractStatus status;
    private List<ContractParty> parties;
    private Map<String, Object> parameters;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String contractType;
    private String version;
    private boolean immutable;
    private String templateId;
    private Map<String, String> metadata;
    private List<ContractSignature> signatures;

    // Default constructor
    public RicardianContract() {
        this.contractId = UUID.randomUUID().toString();
        this.status = ContractStatus.DRAFT;
        this.parties = new ArrayList<>();
        this.parameters = new HashMap<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.version = "1.0.0";
        this.immutable = false;
        this.metadata = new HashMap<>();
        this.signatures = new ArrayList<>();
    }

    // Full constructor
    public RicardianContract(String contractId, String legalProse, String smartContractCode,
                            ContractStatus status, List<ContractParty> parties) {
        this.contractId = contractId != null ? contractId : UUID.randomUUID().toString();
        this.legalProse = legalProse;
        this.smartContractCode = smartContractCode;
        this.status = status != null ? status : ContractStatus.DRAFT;
        this.parties = parties != null ? parties : new ArrayList<>();
        this.parameters = new HashMap<>();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.version = "1.0.0";
        this.immutable = false;
    }

    // Getters and Setters
    public String getContractId() {
        return contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

    public String getLegalProse() {
        return legalProse;
    }

    public void setLegalProse(String legalProse) {
        this.legalProse = legalProse;
    }

    public String getSmartContractCode() {
        return smartContractCode;
    }

    public void setSmartContractCode(String smartContractCode) {
        this.smartContractCode = smartContractCode;
    }

    public ContractStatus getStatus() {
        return status;
    }

    public void setStatus(ContractStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public List<ContractParty> getParties() {
        return parties;
    }

    public void setParties(List<ContractParty> parties) {
        this.parties = parties;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Object> parameters) {
        this.parameters = parameters;
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

    public String getContractType() {
        return contractType;
    }

    public void setContractType(String contractType) {
        this.contractType = contractType;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public boolean isImmutable() {
        return immutable;
    }

    public void setImmutable(boolean immutable) {
        this.immutable = immutable;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public List<ContractSignature> getSignatures() {
        return signatures;
    }

    public void setSignatures(List<ContractSignature> signatures) {
        this.signatures = signatures;
    }

    // Business methods
    public void addParty(ContractParty party) {
        if (!this.parties.contains(party)) {
            this.parties.add(party);
            this.updatedAt = Instant.now();
        }
    }

    public void addParameter(String key, Object value) {
        this.parameters.put(key, value);
        this.updatedAt = Instant.now();
    }

    public boolean isActive() {
        return this.status == ContractStatus.ACTIVE;
    }

    public boolean isDraft() {
        return this.status == ContractStatus.DRAFT;
    }

    public boolean isExecuted() {
        return this.status == ContractStatus.EXECUTED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RicardianContract that = (RicardianContract) o;
        return Objects.equals(contractId, that.contractId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(contractId);
    }

    @Override
    public String toString() {
        return "RicardianContract{" +
                "contractId='" + contractId + '\'' +
                ", status=" + status +
                ", contractType='" + contractType + '\'' +
                ", parties=" + parties.size() +
                ", version='" + version + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
