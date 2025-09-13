package io.aurigraph.v11.hms.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * HIPAA-compliant patient record model for Aurigraph V11 HMS
 * 
 * Features:
 * - Zero-knowledge proof compatible structure
 * - Homomorphic encryption support
 * - Immutable audit trail
 * - Consent management integration
 * - Privacy-preserving analytics
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PatientRecord(
    
    @JsonProperty("patient_id")
    @NotBlank(message = "Patient ID is required")
    @Pattern(regexp = "^PAT-[A-Z0-9]{8}-[A-Z0-9]{4}$", message = "Invalid patient ID format")
    String patientId,
    
    @JsonProperty("digital_identity_hash")
    @NotBlank(message = "Digital identity hash is required")
    String digitalIdentityHash,
    
    @JsonProperty("healthcare_provider_id")
    @NotBlank(message = "Healthcare provider ID is required")
    String healthcareProviderId,
    
    @JsonProperty("encrypted_demographics")
    @NotNull(message = "Encrypted demographics required")
    EncryptedData encryptedDemographics,
    
    @JsonProperty("medical_records")
    @NotNull(message = "Medical records list required")
    List<String> medicalRecordIds,
    
    @JsonProperty("consent_preferences")
    @NotNull(message = "Consent preferences required")
    ConsentPreferences consentPreferences,
    
    @JsonProperty("access_control")
    @NotNull(message = "Access control required")
    AccessControl accessControl,
    
    @JsonProperty("privacy_settings")
    @NotNull(message = "Privacy settings required")
    PrivacySettings privacySettings,
    
    @JsonProperty("blockchain_metadata")
    @NotNull(message = "Blockchain metadata required")
    BlockchainMetadata blockchainMetadata,
    
    @JsonProperty("hipaa_compliance")
    @NotNull(message = "HIPAA compliance status required")
    HIPAACompliance hipaaCompliance,
    
    @JsonProperty("audit_trail")
    @NotNull(message = "Audit trail required")
    List<AuditEntry> auditTrail,
    
    @JsonProperty("created_timestamp")
    @NotNull(message = "Created timestamp required")
    LocalDateTime createdTimestamp,
    
    @JsonProperty("last_updated")
    @NotNull(message = "Last updated timestamp required")
    LocalDateTime lastUpdated,
    
    @JsonProperty("expiration_date")
    LocalDateTime expirationDate,
    
    @JsonProperty("status")
    @NotNull(message = "Record status required")
    RecordStatus status
) {
    
    /**
     * Encrypted patient demographics and PII
     */
    public record EncryptedData(
        @JsonProperty("encrypted_payload")
        String encryptedPayload,
        
        @JsonProperty("encryption_algorithm")
        String encryptionAlgorithm,
        
        @JsonProperty("key_derivation_function")
        String keyDerivationFunction,
        
        @JsonProperty("homomorphic_key")
        String homomorphicKey,
        
        @JsonProperty("zero_knowledge_proof")
        String zeroKnowledgeProof
    ) {}
    
    /**
     * Patient consent preferences for data usage
     */
    public record ConsentPreferences(
        @JsonProperty("data_sharing_consent")
        DataSharingLevel dataSharingConsent,
        
        @JsonProperty("research_participation")
        boolean researchParticipation,
        
        @JsonProperty("analytics_consent")
        boolean analyticsConsent,
        
        @JsonProperty("cross_provider_sharing")
        boolean crossProviderSharing,
        
        @JsonProperty("emergency_access")
        boolean emergencyAccess,
        
        @JsonProperty("ai_processing_consent")
        boolean aiProcessingConsent,
        
        @JsonProperty("consent_signature")
        String consentSignature,
        
        @JsonProperty("consent_timestamp")
        LocalDateTime consentTimestamp,
        
        @JsonProperty("consent_version")
        String consentVersion
    ) {}
    
    /**
     * Role-based access control for patient data
     */
    public record AccessControl(
        @JsonProperty("authorized_providers")
        Set<String> authorizedProviders,
        
        @JsonProperty("authorized_researchers")
        Set<String> authorizedResearchers,
        
        @JsonProperty("emergency_contacts")
        Set<String> emergencyContacts,
        
        @JsonProperty("access_levels")
        Map<String, AccessLevel> accessLevels,
        
        @JsonProperty("access_expiry")
        Map<String, LocalDateTime> accessExpiry,
        
        @JsonProperty("multi_sig_required")
        boolean multiSigRequired,
        
        @JsonProperty("required_signatures")
        int requiredSignatures
    ) {}
    
    /**
     * Privacy-preserving settings and configurations
     */
    public record PrivacySettings(
        @JsonProperty("data_minimization")
        boolean dataMinimization,
        
        @JsonProperty("pseudonymization_level")
        PseudonymizationLevel pseudonymizationLevel,
        
        @JsonProperty("differential_privacy")
        boolean differentialPrivacy,
        
        @JsonProperty("privacy_budget")
        double privacyBudget,
        
        @JsonProperty("data_retention_days")
        int dataRetentionDays,
        
        @JsonProperty("automatic_deletion")
        boolean automaticDeletion,
        
        @JsonProperty("geographic_restrictions")
        Set<String> geographicRestrictions
    ) {}
    
    /**
     * Blockchain-specific metadata and proofs
     */
    public record BlockchainMetadata(
        @JsonProperty("block_hash")
        String blockHash,
        
        @JsonProperty("transaction_hash")
        String transactionHash,
        
        @JsonProperty("merkle_root")
        String merkleRoot,
        
        @JsonProperty("consensus_proof")
        String consensusProof,
        
        @JsonProperty("immutability_hash")
        String immutabilityHash,
        
        @JsonProperty("network_timestamp")
        long networkTimestamp,
        
        @JsonProperty("block_height")
        long blockHeight,
        
        @JsonProperty("validator_signatures")
        List<String> validatorSignatures
    ) {}
    
    /**
     * HIPAA compliance status and certifications
     */
    public record HIPAACompliance(
        @JsonProperty("compliance_status")
        ComplianceStatus complianceStatus,
        
        @JsonProperty("risk_assessment_score")
        double riskAssessmentScore,
        
        @JsonProperty("encryption_compliance")
        boolean encryptionCompliance,
        
        @JsonProperty("access_log_compliance")
        boolean accessLogCompliance,
        
        @JsonProperty("audit_trail_compliance")
        boolean auditTrailCompliance,
        
        @JsonProperty("data_integrity_compliance")
        boolean dataIntegrityCompliance,
        
        @JsonProperty("breach_notification_ready")
        boolean breachNotificationReady,
        
        @JsonProperty("last_compliance_check")
        LocalDateTime lastComplianceCheck,
        
        @JsonProperty("compliance_certification")
        String complianceCertification
    ) {}
    
    /**
     * Immutable audit trail entry
     */
    public record AuditEntry(
        @JsonProperty("entry_id")
        String entryId,
        
        @JsonProperty("action_type")
        String actionType,
        
        @JsonProperty("actor_id")
        String actorId,
        
        @JsonProperty("actor_role")
        String actorRole,
        
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("data_accessed")
        Set<String> dataAccessed,
        
        @JsonProperty("purpose")
        String purpose,
        
        @JsonProperty("ip_address")
        String ipAddress,
        
        @JsonProperty("session_id")
        String sessionId,
        
        @JsonProperty("integrity_hash")
        String integrityHash
    ) {}
    
    // Enums
    
    public enum DataSharingLevel {
        NONE,
        PROVIDER_ONLY,
        NETWORK_PROVIDERS,
        RESEARCH_APPROVED,
        FULL_CONSENT
    }
    
    public enum AccessLevel {
        READ_ONLY,
        READ_WRITE,
        ADMIN,
        EMERGENCY,
        RESEARCH,
        ANALYTICS
    }
    
    public enum PseudonymizationLevel {
        NONE,
        BASIC,
        ENHANCED,
        MAXIMUM
    }
    
    public enum ComplianceStatus {
        COMPLIANT,
        NON_COMPLIANT,
        UNDER_REVIEW,
        REMEDIATION_REQUIRED
    }
    
    public enum RecordStatus {
        ACTIVE,
        INACTIVE,
        ARCHIVED,
        DELETED,
        SUSPENDED
    }
    
    /**
     * Validate record integrity and compliance
     */
    public boolean isValid() {
        return patientId != null && 
               !patientId.isEmpty() &&
               digitalIdentityHash != null &&
               encryptedDemographics != null &&
               consentPreferences != null &&
               hipaaCompliance != null &&
               hipaaCompliance.complianceStatus() == ComplianceStatus.COMPLIANT;
    }
    
    /**
     * Check if record has expired
     */
    public boolean isExpired() {
        return expirationDate != null && 
               LocalDateTime.now().isAfter(expirationDate);
    }
    
    /**
     * Check if user has access to this record
     */
    public boolean hasAccess(String userId, AccessLevel requiredLevel) {
        if (accessControl == null || accessControl.accessLevels() == null) {
            return false;
        }
        
        AccessLevel userLevel = accessControl.accessLevels().get(userId);
        if (userLevel == null) {
            return false;
        }
        
        // Check expiry
        LocalDateTime expiry = accessControl.accessExpiry().get(userId);
        if (expiry != null && LocalDateTime.now().isAfter(expiry)) {
            return false;
        }
        
        return userLevel.ordinal() >= requiredLevel.ordinal();
    }
    
    /**
     * Get privacy-preserving hash for analytics
     */
    public String getAnalyticsHash() {
        if (privacySettings == null || !privacySettings.differentialPrivacy()) {
            return null;
        }
        
        return digitalIdentityHash.substring(0, 16) + "***PRIVACY***";
    }
    
    /**
     * Generate compliance summary
     */
    public ComplianceSummary getComplianceSummary() {
        if (hipaaCompliance == null) {
            return new ComplianceSummary(false, 0.0, "No compliance data");
        }
        
        return new ComplianceSummary(
            hipaaCompliance.complianceStatus() == ComplianceStatus.COMPLIANT,
            hipaaCompliance.riskAssessmentScore(),
            "HIPAA compliance: " + hipaaCompliance.complianceStatus()
        );
    }
    
    public record ComplianceSummary(
        boolean isCompliant,
        double riskScore,
        String summary
    ) {}
}