package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import java.time.Instant;
import java.util.*;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Ricardian Contract entity - combines legal prose with executable code
 * Features quantum-safe signatures and multi-party execution
 */
public class RicardianContract {
    
    @JsonProperty("contractId")
    private String contractId;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("version")
    private String version = "1.0.0";
    
    @JsonProperty("legalText")
    private String legalText; // Human-readable legal prose
    
    @JsonProperty("executableCode")
    private String executableCode; // Smart contract code
    
    @JsonProperty("contractType")
    private String contractType; // RWA, Carbon, RealEstate, etc.
    
    @JsonProperty("assetType")
    private String assetType;
    
    @JsonProperty("jurisdiction")
    private String jurisdiction;
    
    @JsonProperty("parties")
    private List<ContractParty> parties = new ArrayList<>(); // Changed to ContractParty
    
    @JsonProperty("terms")
    private List<ContractTerm> terms = new ArrayList<>();
    
    @JsonProperty("triggers")
    private List<ContractTrigger> triggers = new ArrayList<>();
    
    @JsonProperty("signatures")
    private List<ContractSignature> signatures;
    
    @JsonProperty("status")
    private ContractStatus status;
    
    @JsonProperty("createdAt")
    private Instant createdAt;
    
    @JsonProperty("updatedAt")
    private Instant updatedAt;
    
    @JsonProperty("activatedAt")
    private Instant activatedAt;
    
    @JsonProperty("lastExecutedAt")
    private Instant lastExecutedAt;
    
    @JsonProperty("executionCount")
    private long executionCount;
    
    @JsonProperty("templateId")
    private String templateId;
    
    @JsonProperty("metadata")
    private Map<String, String> metadata;
    
    @JsonProperty("enforceabilityScore")
    private double enforceabilityScore;
    
    @JsonProperty("riskAssessment")
    private String riskAssessment;
    
    @JsonProperty("auditTrail")
    private List<String> auditTrail = new ArrayList<>();
    
    @JsonProperty("executions")
    private List<ExecutionResult> executions = new ArrayList<>();
    
    @JsonProperty("quantumSafe")
    private boolean quantumSafe = true; // All contracts use quantum-safe crypto

    // Default constructor
    public RicardianContract() {
        this.signatures = new ArrayList<>();
        this.metadata = new HashMap<>();
        this.executionCount = 0;
    }

    // Builder pattern
    public static RicardianContractBuilder builder() {
        return new RicardianContractBuilder();
    }

    // Getters and setters
    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public String getLegalText() { return legalText; }
    public void setLegalText(String legalText) { this.legalText = legalText; }
    
    public String getExecutableCode() { return executableCode; }
    public void setExecutableCode(String executableCode) { this.executableCode = executableCode; }
    
    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }
    
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    
    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
    
    public List<ContractParty> getParties() { return parties; }
    public void setParties(List<ContractParty> parties) { this.parties = parties; }
    
    public List<ContractTerm> getTerms() { return terms; }
    public void setTerms(List<ContractTerm> terms) { this.terms = terms; }
    
    public List<ContractTrigger> getTriggers() { return triggers; }
    public void setTriggers(List<ContractTrigger> triggers) { this.triggers = triggers; }
    
    public List<ContractSignature> getSignatures() { return signatures; }
    public void setSignatures(List<ContractSignature> signatures) { this.signatures = signatures; }
    
    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus status) { this.status = status; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    
    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }
    
    public Instant getLastExecutedAt() { return lastExecutedAt; }
    public void setLastExecutedAt(Instant lastExecutedAt) { this.lastExecutedAt = lastExecutedAt; }
    
    public long getExecutionCount() { return executionCount; }
    public void setExecutionCount(long executionCount) { this.executionCount = executionCount; }
    
    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }
    
    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
    
    public double getEnforceabilityScore() { return enforceabilityScore; }
    public void setEnforceabilityScore(double enforceabilityScore) { this.enforceabilityScore = enforceabilityScore; }
    
    public String getRiskAssessment() { return riskAssessment; }
    public void setRiskAssessment(String riskAssessment) { this.riskAssessment = riskAssessment; }
    
    public List<String> getAuditTrail() { return auditTrail; }
    public void setAuditTrail(List<String> auditTrail) { this.auditTrail = auditTrail; }
    
    public List<ExecutionResult> getExecutions() { return executions; }
    public void setExecutions(List<ExecutionResult> executions) { this.executions = executions; }
    
    public boolean isQuantumSafe() { return quantumSafe; }
    public void setQuantumSafe(boolean quantumSafe) { this.quantumSafe = quantumSafe; }

    // Utility methods
    public boolean isActive() {
        return status == ContractStatus.ACTIVE;
    }

    public boolean isFullySigned() {
        Set<String> requiredSigners = new HashSet<>();
        for (ContractParty party : parties) {
            if (party.isSignatureRequired()) {
                requiredSigners.add(party.getAddress());
            }
        }
        
        Set<String> actualSigners = new HashSet<>();
        for (ContractSignature signature : signatures) {
            actualSigners.add(signature.getSignerAddress());
        }
        
        return actualSigners.containsAll(requiredSigners);
    }

    public ContractSignature getSignatureByAddress(String address) {
        return signatures.stream()
            .filter(sig -> address.equals(sig.getSignerAddress()))
            .findFirst()
            .orElse(null);
    }

    public void addMetadata(String key, String value) {
        if (metadata == null) {
            metadata = new HashMap<>();
        }
        metadata.put(key, value);
    }
    
    // Additional methods needed by SmartContractService
    public void addParty(ContractParty party) {
        if (parties == null) {
            parties = new ArrayList<>();
        }
        parties.add(party);
    }
    
    public void addTerm(ContractTerm term) {
        if (terms == null) {
            terms = new ArrayList<>();
        }
        terms.add(term);
    }
    
    public void addSignature(ContractSignature signature) {
        if (signatures == null) {
            signatures = new ArrayList<>();
        }
        signatures.add(signature);
    }
    
    public void addExecution(ExecutionResult execution) {
        if (executions == null) {
            executions = new ArrayList<>();
        }
        executions.add(execution);
    }
    
    public void addAuditEntry(String entry) {
        if (auditTrail == null) {
            auditTrail = new ArrayList<>();
        }
        auditTrail.add(entry);
    }
    
    public ContractParty getPartyById(String partyId) {
        if (parties == null) return null;
        return parties.stream()
            .filter(party -> partyId.equals(party.getPartyId()))
            .findFirst()
            .orElse(null);
    }
    
    public ContractTrigger getTriggerById(String triggerId) {
        if (triggers == null) return null;
        return triggers.stream()
            .filter(trigger -> triggerId.equals(trigger.getTriggerId()))
            .findFirst()
            .orElse(null);
    }

    @Override
    public String toString() {
        return String.format("RicardianContract{id='%s', type='%s', status=%s, parties=%d, signatures=%d}",
            contractId, contractType, status, parties != null ? parties.size() : 0, signatures.size());
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

    // Builder class
    public static class RicardianContractBuilder {
        private RicardianContract contract = new RicardianContract();
        
        public RicardianContractBuilder contractId(String contractId) {
            contract.contractId = contractId;
            return this;
        }
        
        public RicardianContractBuilder legalText(String legalText) {
            contract.legalText = legalText;
            return this;
        }
        
        public RicardianContractBuilder executableCode(String executableCode) {
            contract.executableCode = executableCode;
            return this;
        }
        
        public RicardianContractBuilder contractType(String contractType) {
            contract.contractType = contractType;
            return this;
        }
        
        public RicardianContractBuilder parties(List<ContractParty> parties) {
            contract.parties = parties;
            return this;
        }
        
        public RicardianContractBuilder signatures(List<ContractSignature> signatures) {
            contract.signatures = signatures;
            return this;
        }
        
        public RicardianContractBuilder status(ContractStatus status) {
            contract.status = status;
            return this;
        }
        
        public RicardianContractBuilder createdAt(Instant createdAt) {
            contract.createdAt = createdAt;
            return this;
        }
        
        public RicardianContractBuilder activatedAt(Instant activatedAt) {
            contract.activatedAt = activatedAt;
            return this;
        }
        
        public RicardianContractBuilder templateId(String templateId) {
            contract.templateId = templateId;
            return this;
        }
        
        public RicardianContractBuilder metadata(Map<String, String> metadata) {
            contract.metadata = metadata;
            return this;
        }
        
        public RicardianContractBuilder version(String version) {
            contract.version = version;
            return this;
        }
        
        public RicardianContract build() {
            // Validate required fields
            if (contract.contractId == null || contract.contractId.trim().isEmpty()) {
                throw new IllegalArgumentException("Contract ID is required");
            }
            if (contract.legalText == null || contract.legalText.trim().isEmpty()) {
                throw new IllegalArgumentException("Legal text is required");
            }
            if (contract.executableCode == null || contract.executableCode.trim().isEmpty()) {
                throw new IllegalArgumentException("Executable code is required");
            }
            if (contract.parties == null || contract.parties.isEmpty()) {
                throw new IllegalArgumentException("At least one party is required");
            }
            
            // Set defaults
            if (contract.signatures == null) {
                contract.signatures = new ArrayList<>();
            }
            if (contract.metadata == null) {
                contract.metadata = new HashMap<>();
            }
            if (contract.status == null) {
                contract.status = ContractStatus.DRAFT;
            }
            if (contract.createdAt == null) {
                contract.createdAt = Instant.now();
            }
            
            return contract;
        }
    }
}

/**
 * Contract signature with quantum-safe cryptography
 */
class ContractSignature {
    @JsonProperty("partyId")
    private String partyId;
    
    @JsonProperty("signerAddress")
    private String signerAddress;
    
    @JsonProperty("signature")
    private String signature; // Quantum-safe signature (Dilithium)
    
    @JsonProperty("publicKey")
    private String publicKey; // Quantum-safe public key
    
    @JsonProperty("signedAt")
    private Instant signedAt;
    
    @JsonProperty("timestamp")
    private Instant timestamp;
    
    @JsonProperty("signatureType")
    private String signatureType = "CRYSTALS-Dilithium";
    
    @JsonProperty("algorithm")
    private String algorithm = "CRYSTALS-Dilithium"; // Default quantum-safe algorithm
    
    @JsonProperty("witnessedBy")
    private List<String> witnessedBy = new ArrayList<>();
    
    @JsonProperty("metadata")
    private Map<String, String> metadata;

    // Constructors
    public ContractSignature() {
        this.metadata = new HashMap<>();
    }

    public ContractSignature(String signerAddress, String signature, String publicKey) {
        this();
        this.signerAddress = signerAddress;
        this.signature = signature;
        this.publicKey = publicKey;
        this.signedAt = Instant.now();
    }

    // Getters and setters
    public String getPartyId() { return partyId; }
    public void setPartyId(String partyId) { this.partyId = partyId; }
    
    public String getSignerAddress() { return signerAddress; }
    public void setSignerAddress(String signerAddress) { this.signerAddress = signerAddress; }
    
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
    
    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    
    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
    
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    
    public String getSignatureType() { return signatureType; }
    public void setSignatureType(String signatureType) { this.signatureType = signatureType; }
    
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    
    public List<String> getWitnessedBy() { return witnessedBy; }
    public void setWitnessedBy(List<String> witnessedBy) { this.witnessedBy = witnessedBy; }
    
    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    @Override
    public String toString() {
        return String.format("ContractSignature{signer='%s', algorithm='%s', signedAt=%s}",
            signerAddress, algorithm, signedAt);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ContractSignature that = (ContractSignature) o;
        return Objects.equals(signerAddress, that.signerAddress) &&
               Objects.equals(signature, that.signature);
    }

    @Override
    public int hashCode() {
        return Objects.hash(signerAddress, signature);
    }
}
