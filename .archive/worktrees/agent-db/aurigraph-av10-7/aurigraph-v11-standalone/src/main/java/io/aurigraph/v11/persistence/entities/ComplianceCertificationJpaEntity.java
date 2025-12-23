package io.aurigraph.v11.persistence.entities;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Compliance Certification JPA Entity
 *
 * Multi-level compliance certification system supporting:
 * - Level 1: Basic compliance (KYC, basic documentation)
 * - Level 2: Standard compliance (AML, sanctions screening)
 * - Level 3: Enhanced compliance (GDPR, SOC2 Type II)
 * - Level 4: Premium compliance (FDA, industry-specific)
 * - Level 5: Enterprise compliance (custom frameworks, multi-jurisdiction)
 *
 * Features:
 * - Certificate lifecycle management
 * - Automatic expiry tracking and renewal
 * - Multi-party verification workflow
 * - Document storage and audit trail
 * - Regulatory framework mapping
 * - Risk scoring and assessment
 *
 * Performance Targets:
 * - Write: <100ms for certificate issuance
 * - Query: <50ms for certificate validation
 * - Bulk Operations: 200+ certificates/second
 *
 * @since V11.4.4
 */
@Entity
@Table(name = "compliance_certification", indexes = {
    @Index(name = "idx_compliance_cert_id", columnList = "certificate_id", unique = true),
    @Index(name = "idx_compliance_level", columnList = "compliance_level"),
    @Index(name = "idx_compliance_type", columnList = "certification_type"),
    @Index(name = "idx_compliance_entity", columnList = "entity_id"),
    @Index(name = "idx_compliance_status", columnList = "status"),
    @Index(name = "idx_compliance_issued", columnList = "issued_at"),
    @Index(name = "idx_compliance_expiry", columnList = "expires_at"),
    @Index(name = "idx_compliance_framework", columnList = "regulatory_framework")
})
public class ComplianceCertificationJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "certificate_id", nullable = false, unique = true, length = 255)
    private String certificateId;

    @Column(name = "compliance_level", nullable = false)
    private Integer complianceLevel;

    @Column(name = "certification_type", nullable = false, length = 100)
    private String certificationType;

    @Column(name = "entity_id", nullable = false, length = 255)
    private String entityId;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_name", length = 500)
    private String entityName;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "regulatory_framework", nullable = false, length = 100)
    private String regulatoryFramework;

    @Column(name = "issuer_id", nullable = false, length = 255)
    private String issuerId;

    @Column(name = "issuer_name", length = 500)
    private String issuerName;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "renewable", nullable = false)
    private Boolean renewable = true;

    @Column(name = "auto_renew", nullable = false)
    private Boolean autoRenew = false;

    @Column(name = "renewed_from_id", columnDefinition = "UUID")
    private UUID renewedFromId;

    @Column(name = "renewed_to_id", columnDefinition = "UUID")
    private UUID renewedToId;

    @Type(JsonBinaryType.class)
    @Column(name = "certification_criteria", columnDefinition = "jsonb")
    private Map<String, Object> certificationCriteria;

    @Type(JsonBinaryType.class)
    @Column(name = "assessment_results", columnDefinition = "jsonb")
    private Map<String, Object> assessmentResults;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private java.math.BigDecimal riskScore;

    @Column(name = "risk_level", length = 50)
    private String riskLevel;

    @Type(JsonBinaryType.class)
    @Column(name = "risk_factors", columnDefinition = "jsonb")
    private Map<String, Object> riskFactors;

    @Type(JsonBinaryType.class)
    @Column(name = "verification_documents", columnDefinition = "jsonb")
    private Map<String, Object> verificationDocuments;

    @Column(name = "document_hash", length = 255)
    private String documentHash;

    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verified_by", length = 255)
    private String verifiedBy;

    @Type(JsonBinaryType.class)
    @Column(name = "verifier_signatures", columnDefinition = "jsonb")
    private Map<String, Object> verifierSignatures;

    @Column(name = "blockchain_tx_hash", length = 255)
    private String blockchainTxHash;

    @Column(name = "smart_contract_address", length = 255)
    private String smartContractAddress;

    @Type(JsonBinaryType.class)
    @Column(name = "compliance_checks", columnDefinition = "jsonb")
    private Map<String, Object> complianceChecks;

    @Column(name = "kyc_verified", nullable = false)
    private Boolean kycVerified = false;

    @Column(name = "aml_verified", nullable = false)
    private Boolean amlVerified = false;

    @Column(name = "sanctions_checked", nullable = false)
    private Boolean sanctionsChecked = false;

    @Column(name = "pep_checked", nullable = false)
    private Boolean pepChecked = false;

    @Column(name = "last_check_date")
    private Instant lastCheckDate;

    @Column(name = "next_check_date")
    private Instant nextCheckDate;

    @Type(JsonBinaryType.class)
    @Column(name = "audit_trail", columnDefinition = "jsonb")
    private Map<String, Object> auditTrail;

    @Type(JsonBinaryType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "revoked", nullable = false)
    private Boolean revoked = false;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by", length = 255)
    private String revokedBy;

    @Column(name = "revocation_reason", columnDefinition = "TEXT")
    private String revocationReason;

    @Column(name = "suspended", nullable = false)
    private Boolean suspended = false;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @Column(name = "suspension_reason", columnDefinition = "TEXT")
    private String suspensionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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

    public String getCertificateId() {
        return certificateId;
    }

    public void setCertificateId(String certificateId) {
        this.certificateId = certificateId;
    }

    public Integer getComplianceLevel() {
        return complianceLevel;
    }

    public void setComplianceLevel(Integer complianceLevel) {
        this.complianceLevel = complianceLevel;
    }

    public String getCertificationType() {
        return certificationType;
    }

    public void setCertificationType(String certificationType) {
        this.certificationType = certificationType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRegulatoryFramework() {
        return regulatoryFramework;
    }

    public void setRegulatoryFramework(String regulatoryFramework) {
        this.regulatoryFramework = regulatoryFramework;
    }

    public String getIssuerId() {
        return issuerId;
    }

    public void setIssuerId(String issuerId) {
        this.issuerId = issuerId;
    }

    public String getIssuerName() {
        return issuerName;
    }

    public void setIssuerName(String issuerName) {
        this.issuerName = issuerName;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(Instant issuedAt) {
        this.issuedAt = issuedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getRenewable() {
        return renewable;
    }

    public void setRenewable(Boolean renewable) {
        this.renewable = renewable;
    }

    public Boolean getAutoRenew() {
        return autoRenew;
    }

    public void setAutoRenew(Boolean autoRenew) {
        this.autoRenew = autoRenew;
    }

    public UUID getRenewedFromId() {
        return renewedFromId;
    }

    public void setRenewedFromId(UUID renewedFromId) {
        this.renewedFromId = renewedFromId;
    }

    public UUID getRenewedToId() {
        return renewedToId;
    }

    public void setRenewedToId(UUID renewedToId) {
        this.renewedToId = renewedToId;
    }

    public Map<String, Object> getCertificationCriteria() {
        return certificationCriteria;
    }

    public void setCertificationCriteria(Map<String, Object> certificationCriteria) {
        this.certificationCriteria = certificationCriteria;
    }

    public Map<String, Object> getAssessmentResults() {
        return assessmentResults;
    }

    public void setAssessmentResults(Map<String, Object> assessmentResults) {
        this.assessmentResults = assessmentResults;
    }

    public java.math.BigDecimal getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(java.math.BigDecimal riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Map<String, Object> getRiskFactors() {
        return riskFactors;
    }

    public void setRiskFactors(Map<String, Object> riskFactors) {
        this.riskFactors = riskFactors;
    }

    public Map<String, Object> getVerificationDocuments() {
        return verificationDocuments;
    }

    public void setVerificationDocuments(Map<String, Object> verificationDocuments) {
        this.verificationDocuments = verificationDocuments;
    }

    public String getDocumentHash() {
        return documentHash;
    }

    public void setDocumentHash(String documentHash) {
        this.documentHash = documentHash;
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

    public Map<String, Object> getVerifierSignatures() {
        return verifierSignatures;
    }

    public void setVerifierSignatures(Map<String, Object> verifierSignatures) {
        this.verifierSignatures = verifierSignatures;
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

    public Map<String, Object> getComplianceChecks() {
        return complianceChecks;
    }

    public void setComplianceChecks(Map<String, Object> complianceChecks) {
        this.complianceChecks = complianceChecks;
    }

    public Boolean getKycVerified() {
        return kycVerified;
    }

    public void setKycVerified(Boolean kycVerified) {
        this.kycVerified = kycVerified;
    }

    public Boolean getAmlVerified() {
        return amlVerified;
    }

    public void setAmlVerified(Boolean amlVerified) {
        this.amlVerified = amlVerified;
    }

    public Boolean getSanctionsChecked() {
        return sanctionsChecked;
    }

    public void setSanctionsChecked(Boolean sanctionsChecked) {
        this.sanctionsChecked = sanctionsChecked;
    }

    public Boolean getPepChecked() {
        return pepChecked;
    }

    public void setPepChecked(Boolean pepChecked) {
        this.pepChecked = pepChecked;
    }

    public Instant getLastCheckDate() {
        return lastCheckDate;
    }

    public void setLastCheckDate(Instant lastCheckDate) {
        this.lastCheckDate = lastCheckDate;
    }

    public Instant getNextCheckDate() {
        return nextCheckDate;
    }

    public void setNextCheckDate(Instant nextCheckDate) {
        this.nextCheckDate = nextCheckDate;
    }

    public Map<String, Object> getAuditTrail() {
        return auditTrail;
    }

    public void setAuditTrail(Map<String, Object> auditTrail) {
        this.auditTrail = auditTrail;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Boolean getRevoked() {
        return revoked;
    }

    public void setRevoked(Boolean revoked) {
        this.revoked = revoked;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    public String getRevokedBy() {
        return revokedBy;
    }

    public void setRevokedBy(String revokedBy) {
        this.revokedBy = revokedBy;
    }

    public String getRevocationReason() {
        return revocationReason;
    }

    public void setRevocationReason(String revocationReason) {
        this.revocationReason = revocationReason;
    }

    public Boolean getSuspended() {
        return suspended;
    }

    public void setSuspended(Boolean suspended) {
        this.suspended = suspended;
    }

    public Instant getSuspendedAt() {
        return suspendedAt;
    }

    public void setSuspendedAt(Instant suspendedAt) {
        this.suspendedAt = suspendedAt;
    }

    public String getSuspensionReason() {
        return suspensionReason;
    }

    public void setSuspensionReason(String suspensionReason) {
        this.suspensionReason = suspensionReason;
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
}
