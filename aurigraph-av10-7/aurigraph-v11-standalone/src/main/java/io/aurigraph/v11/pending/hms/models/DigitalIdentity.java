package io.aurigraph.v11.pending.hms.models;

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
 * Digital identity model for Aurigraph V11 HMS and CBDC systems
 * 
 * Features:
 * - Self-sovereign identity (SSI) support
 * - Zero-knowledge identity proofs
 * - Multi-factor authentication
 * - Biometric verification
 * - Cross-system interoperability
 * - Privacy-preserving credentials
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DigitalIdentity(
    
    @JsonProperty("identity_id")
    @NotBlank(message = "Identity ID is required")
    @Pattern(regexp = "^DID:[A-Z0-9]{12}-[A-Z0-9]{8}$", message = "Invalid digital identity format")
    String identityId,
    
    @JsonProperty("subject_id")
    @NotBlank(message = "Subject ID is required")
    String subjectId,
    
    @JsonProperty("identity_type")
    @NotNull(message = "Identity type is required")
    IdentityType identityType,
    
    @JsonProperty("verification_method")
    @NotNull(message = "Verification method is required")
    VerificationMethod verificationMethod,
    
    @JsonProperty("biometric_data")
    @NotNull(message = "Biometric data is required")
    BiometricData biometricData,
    
    @JsonProperty("credentials")
    @NotNull(message = "Credentials list is required")
    List<VerifiableCredential> credentials,
    
    @JsonProperty("authentication_factors")
    @NotNull(message = "Authentication factors required")
    AuthenticationFactors authenticationFactors,
    
    @JsonProperty("privacy_settings")
    @NotNull(message = "Privacy settings required")
    IdentityPrivacySettings privacySettings,
    
    @JsonProperty("reputation_score")
    @NotNull(message = "Reputation score is required")
    ReputationScore reputationScore,
    
    @JsonProperty("kyc_compliance")
    @NotNull(message = "KYC compliance data required")
    KYCCompliance kycCompliance,
    
    @JsonProperty("cross_system_links")
    @NotNull(message = "Cross-system links required")
    Map<String, String> crossSystemLinks,
    
    @JsonProperty("blockchain_anchors")
    @NotNull(message = "Blockchain anchors required")
    List<BlockchainAnchor> blockchainAnchors,
    
    @JsonProperty("access_permissions")
    @NotNull(message = "Access permissions required")
    AccessPermissions accessPermissions,
    
    @JsonProperty("identity_metadata")
    @NotNull(message = "Identity metadata required")
    IdentityMetadata identityMetadata,
    
    @JsonProperty("created_timestamp")
    @NotNull(message = "Created timestamp required")
    LocalDateTime createdTimestamp,
    
    @JsonProperty("last_verified")
    @NotNull(message = "Last verified timestamp required")
    LocalDateTime lastVerified,
    
    @JsonProperty("expiration_date")
    LocalDateTime expirationDate,
    
    @JsonProperty("status")
    @NotNull(message = "Identity status required")
    IdentityStatus status
) {
    
    /**
     * Verification method for identity authentication
     */
    public record VerificationMethod(
        @JsonProperty("primary_method")
        AuthMethod primaryMethod,
        
        @JsonProperty("backup_methods")
        List<AuthMethod> backupMethods,
        
        @JsonProperty("multi_factor_required")
        boolean multiFactorRequired,
        
        @JsonProperty("biometric_required")
        boolean biometricRequired,
        
        @JsonProperty("minimum_assurance_level")
        AssuranceLevel minimumAssuranceLevel,
        
        @JsonProperty("verification_history")
        List<VerificationEvent> verificationHistory
    ) {}
    
    /**
     * Verification event in identity history
     */
    public record VerificationEvent(
        @JsonProperty("event_id")
        String eventId,
        
        @JsonProperty("verification_type")
        String verificationType,
        
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("verifier_id")
        String verifierId,
        
        @JsonProperty("success")
        boolean success,
        
        @JsonProperty("confidence_score")
        double confidenceScore,
        
        @JsonProperty("method_used")
        AuthMethod methodUsed
    ) {}
    
    /**
     * Encrypted biometric data for identity verification
     */
    public record BiometricData(
        @JsonProperty("fingerprint_hash")
        String fingerprintHash,
        
        @JsonProperty("facial_recognition_hash")
        String facialRecognitionHash,
        
        @JsonProperty("voice_print_hash")
        String voicePrintHash,
        
        @JsonProperty("iris_scan_hash")
        String irisScanHash,
        
        @JsonProperty("behavioral_patterns")
        Map<String, String> behavioralPatterns,
        
        @JsonProperty("liveness_detection")
        boolean livenessDetection,
        
        @JsonProperty("biometric_template_protection")
        TemplateProtection templateProtection,
        
        @JsonProperty("quality_scores")
        Map<String, Double> qualityScores,
        
        @JsonProperty("anti_spoofing_enabled")
        boolean antiSpoofingEnabled
    ) {}
    
    /**
     * Biometric template protection mechanism
     */
    public record TemplateProtection(
        @JsonProperty("protection_scheme")
        String protectionScheme,
        
        @JsonProperty("transformation_key")
        String transformationKey,
        
        @JsonProperty("irreversible")
        boolean irreversible,
        
        @JsonProperty("renewable")
        boolean renewable,
        
        @JsonProperty("privacy_preserving")
        boolean privacyPreserving
    ) {}
    
    /**
     * W3C Verifiable Credential
     */
    public record VerifiableCredential(
        @JsonProperty("credential_id")
        String credentialId,
        
        @JsonProperty("issuer_did")
        String issuerDid,
        
        @JsonProperty("subject_did")
        String subjectDid,
        
        @JsonProperty("credential_type")
        String credentialType,
        
        @JsonProperty("claims")
        Map<String, Object> claims,
        
        @JsonProperty("issued_date")
        LocalDateTime issuedDate,
        
        @JsonProperty("expiration_date")
        LocalDateTime expirationDate,
        
        @JsonProperty("proof")
        CredentialProof proof,
        
        @JsonProperty("revocation_registry")
        String revocationRegistry,
        
        @JsonProperty("schema_version")
        String schemaVersion,
        
        @JsonProperty("credential_status")
        CredentialStatus credentialStatus
    ) {}
    
    /**
     * Cryptographic proof for verifiable credential
     */
    public record CredentialProof(
        @JsonProperty("type")
        String type,
        
        @JsonProperty("created")
        LocalDateTime created,
        
        @JsonProperty("verification_method")
        String verificationMethod,
        
        @JsonProperty("proof_purpose")
        String proofPurpose,
        
        @JsonProperty("signature")
        String signature,
        
        @JsonProperty("zero_knowledge_proof")
        String zeroKnowledgeProof,
        
        @JsonProperty("merkle_proof")
        List<String> merkleProof
    ) {}
    
    /**
     * Multi-factor authentication configuration
     */
    public record AuthenticationFactors(
        @JsonProperty("something_you_know")
        KnowledgeFactor knowledgeFactor,
        
        @JsonProperty("something_you_have")
        PossessionFactor possessionFactor,
        
        @JsonProperty("something_you_are")
        InherenceFactor inherenceFactor,
        
        @JsonProperty("somewhere_you_are")
        LocationFactor locationFactor,
        
        @JsonProperty("adaptive_authentication")
        AdaptiveAuth adaptiveAuth,
        
        @JsonProperty("risk_based_auth")
        RiskBasedAuth riskBasedAuth
    ) {}
    
    /**
     * Knowledge-based authentication factor
     */
    public record KnowledgeFactor(
        @JsonProperty("password_hash")
        String passwordHash,
        
        @JsonProperty("security_questions")
        List<SecurityQuestion> securityQuestions,
        
        @JsonProperty("cognitive_challenges")
        List<String> cognitiveChallenges,
        
        @JsonProperty("strength_score")
        double strengthScore
    ) {}
    
    /**
     * Security question for knowledge-based auth
     */
    public record SecurityQuestion(
        @JsonProperty("question_id")
        String questionId,
        
        @JsonProperty("question_hash")
        String questionHash,
        
        @JsonProperty("answer_hash")
        String answerHash,
        
        @JsonProperty("entropy_score")
        double entropyScore
    ) {}
    
    /**
     * Possession-based authentication factor
     */
    public record PossessionFactor(
        @JsonProperty("device_tokens")
        List<String> deviceTokens,
        
        @JsonProperty("hardware_keys")
        List<String> hardwareKeys,
        
        @JsonProperty("mobile_app_certificates")
        List<String> mobileAppCertificates,
        
        @JsonProperty("trusted_devices")
        List<TrustedDevice> trustedDevices
    ) {}
    
    /**
     * Trusted device information
     */
    public record TrustedDevice(
        @JsonProperty("device_id")
        String deviceId,
        
        @JsonProperty("device_fingerprint")
        String deviceFingerprint,
        
        @JsonProperty("device_type")
        String deviceType,
        
        @JsonProperty("last_used")
        LocalDateTime lastUsed,
        
        @JsonProperty("trust_score")
        double trustScore,
        
        @JsonProperty("geolocation")
        String geolocation
    ) {}
    
    /**
     * Inherence-based authentication factor (biometrics)
     */
    public record InherenceFactor(
        @JsonProperty("biometric_templates")
        List<String> biometricTemplates,
        
        @JsonProperty("behavioral_patterns")
        Map<String, String> behavioralPatterns,
        
        @JsonProperty("continuous_auth")
        boolean continuousAuth,
        
        @JsonProperty("liveness_required")
        boolean livenessRequired,
        
        @JsonProperty("quality_threshold")
        double qualityThreshold
    ) {}
    
    /**
     * Location-based authentication factor
     */
    public record LocationFactor(
        @JsonProperty("trusted_locations")
        List<TrustedLocation> trustedLocations,
        
        @JsonProperty("geofencing_enabled")
        boolean geofencingEnabled,
        
        @JsonProperty("location_history")
        List<LocationEvent> locationHistory,
        
        @JsonProperty("anomaly_detection")
        boolean anomalyDetection
    ) {}
    
    /**
     * Trusted location for authentication
     */
    public record TrustedLocation(
        @JsonProperty("location_id")
        String locationId,
        
        @JsonProperty("latitude")
        double latitude,
        
        @JsonProperty("longitude")
        double longitude,
        
        @JsonProperty("radius_meters")
        int radiusMeters,
        
        @JsonProperty("location_name")
        String locationName,
        
        @JsonProperty("trust_level")
        TrustLevel trustLevel
    ) {}
    
    /**
     * Location event in authentication history
     */
    public record LocationEvent(
        @JsonProperty("event_id")
        String eventId,
        
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("latitude")
        double latitude,
        
        @JsonProperty("longitude")
        double longitude,
        
        @JsonProperty("accuracy_meters")
        double accuracyMeters,
        
        @JsonProperty("authentication_result")
        boolean authenticationResult
    ) {}
    
    /**
     * Adaptive authentication configuration
     */
    public record AdaptiveAuth(
        @JsonProperty("enabled")
        boolean enabled,
        
        @JsonProperty("ml_model_version")
        String mlModelVersion,
        
        @JsonProperty("risk_factors")
        List<String> riskFactors,
        
        @JsonProperty("threshold_low")
        double thresholdLow,
        
        @JsonProperty("threshold_high")
        double thresholdHigh,
        
        @JsonProperty("step_up_required")
        boolean stepUpRequired
    ) {}
    
    /**
     * Risk-based authentication
     */
    public record RiskBasedAuth(
        @JsonProperty("risk_engine_version")
        String riskEngineVersion,
        
        @JsonProperty("risk_score")
        double riskScore,
        
        @JsonProperty("risk_factors")
        Map<String, Double> riskFactors,
        
        @JsonProperty("velocity_checks")
        VelocityChecks velocityChecks,
        
        @JsonProperty("behavioral_analysis")
        BehavioralAnalysis behavioralAnalysis
    ) {}
    
    /**
     * Velocity checks for suspicious activity
     */
    public record VelocityChecks(
        @JsonProperty("login_velocity")
        int loginVelocity,
        
        @JsonProperty("transaction_velocity")
        int transactionVelocity,
        
        @JsonProperty("location_changes")
        int locationChanges,
        
        @JsonProperty("device_changes")
        int deviceChanges,
        
        @JsonProperty("time_window_minutes")
        int timeWindowMinutes
    ) {}
    
    /**
     * Behavioral analysis for authentication
     */
    public record BehavioralAnalysis(
        @JsonProperty("typing_patterns")
        Map<String, Double> typingPatterns,
        
        @JsonProperty("mouse_movements")
        Map<String, Double> mouseMovements,
        
        @JsonProperty("usage_patterns")
        Map<String, Double> usagePatterns,
        
        @JsonProperty("anomaly_score")
        double anomalyScore,
        
        @JsonProperty("baseline_established")
        boolean baselineEstablished
    ) {}
    
    /**
     * Identity privacy settings
     */
    public record IdentityPrivacySettings(
        @JsonProperty("selective_disclosure")
        boolean selectiveDisclosure,
        
        @JsonProperty("zero_knowledge_proofs")
        boolean zeroKnowledgeProofs,
        
        @JsonProperty("pseudonymization")
        boolean pseudonymization,
        
        @JsonProperty("data_minimization")
        boolean dataMinimization,
        
        @JsonProperty("consent_management")
        ConsentManagement consentManagement,
        
        @JsonProperty("privacy_budget")
        double privacyBudget,
        
        @JsonProperty("correlation_resistance")
        boolean correlationResistance
    ) {}
    
    /**
     * Consent management for identity data
     */
    public record ConsentManagement(
        @JsonProperty("granular_consent")
        Map<String, Boolean> granularConsent,
        
        @JsonProperty("consent_expiry")
        Map<String, LocalDateTime> consentExpiry,
        
        @JsonProperty("withdrawal_mechanism")
        boolean withdrawalMechanism,
        
        @JsonProperty("audit_trail")
        List<ConsentEvent> auditTrail
    ) {}
    
    /**
     * Consent event in audit trail
     */
    public record ConsentEvent(
        @JsonProperty("event_id")
        String eventId,
        
        @JsonProperty("consent_type")
        String consentType,
        
        @JsonProperty("action")
        ConsentAction action,
        
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("requestor_id")
        String requestorId,
        
        @JsonProperty("purpose")
        String purpose
    ) {}
    
    /**
     * Reputation scoring system
     */
    public record ReputationScore(
        @JsonProperty("overall_score")
        double overallScore,
        
        @JsonProperty("trust_score")
        double trustScore,
        
        @JsonProperty("reliability_score")
        double reliabilityScore,
        
        @JsonProperty("verification_score")
        double verificationScore,
        
        @JsonProperty("activity_score")
        double activityScore,
        
        @JsonProperty("endorsements")
        List<Endorsement> endorsements,
        
        @JsonProperty("violations")
        List<Violation> violations,
        
        @JsonProperty("score_history")
        List<ScoreSnapshot> scoreHistory
    ) {}
    
    /**
     * Identity endorsement from trusted source
     */
    public record Endorsement(
        @JsonProperty("endorser_id")
        String endorserId,
        
        @JsonProperty("endorsement_type")
        String endorsementType,
        
        @JsonProperty("strength")
        double strength,
        
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("expiry_date")
        LocalDateTime expiryDate,
        
        @JsonProperty("proof")
        String proof
    ) {}
    
    /**
     * Reputation violation record
     */
    public record Violation(
        @JsonProperty("violation_id")
        String violationId,
        
        @JsonProperty("violation_type")
        ViolationType violationType,
        
        @JsonProperty("severity")
        Severity severity,
        
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("resolved")
        boolean resolved,
        
        @JsonProperty("resolution_date")
        LocalDateTime resolutionDate
    ) {}
    
    /**
     * Score snapshot for history tracking
     */
    public record ScoreSnapshot(
        @JsonProperty("timestamp")
        LocalDateTime timestamp,
        
        @JsonProperty("score")
        double score,
        
        @JsonProperty("factors")
        Map<String, Double> factors,
        
        @JsonProperty("reason")
        String reason
    ) {}
    
    /**
     * KYC (Know Your Customer) compliance data
     */
    public record KYCCompliance(
        @JsonProperty("kyc_status")
        KYCStatus kycStatus,
        
        @JsonProperty("verification_level")
        VerificationLevel verificationLevel,
        
        @JsonProperty("identity_documents")
        List<IdentityDocument> identityDocuments,
        
        @JsonProperty("address_verification")
        AddressVerification addressVerification,
        
        @JsonProperty("source_of_funds")
        SourceOfFunds sourceOfFunds,
        
        @JsonProperty("pep_screening")
        PEPScreening pepScreening,
        
        @JsonProperty("sanctions_screening")
        SanctionsScreening sanctionsScreening,
        
        @JsonProperty("aml_checks")
        AMLChecks amlChecks,
        
        @JsonProperty("compliance_date")
        LocalDateTime complianceDate,
        
        @JsonProperty("review_due_date")
        LocalDateTime reviewDueDate
    ) {}
    
    /**
     * Identity document for KYC verification
     */
    public record IdentityDocument(
        @JsonProperty("document_id")
        String documentId,
        
        @JsonProperty("document_type")
        DocumentType documentType,
        
        @JsonProperty("issuing_authority")
        String issuingAuthority,
        
        @JsonProperty("document_number")
        String documentNumber,
        
        @JsonProperty("expiry_date")
        LocalDateTime expiryDate,
        
        @JsonProperty("verification_status")
        DocumentVerificationStatus verificationStatus,
        
        @JsonProperty("biometric_match")
        boolean biometricMatch,
        
        @JsonProperty("document_hash")
        String documentHash
    ) {}
    
    /**
     * Address verification for KYC
     */
    public record AddressVerification(
        @JsonProperty("verified_address")
        String verifiedAddress,
        
        @JsonProperty("verification_method")
        AddressVerificationMethod verificationMethod,
        
        @JsonProperty("verification_date")
        LocalDateTime verificationDate,
        
        @JsonProperty("supporting_documents")
        List<String> supportingDocuments,
        
        @JsonProperty("verification_status")
        VerificationStatus verificationStatus
    ) {}
    
    /**
     * Source of funds verification
     */
    public record SourceOfFunds(
        @JsonProperty("primary_source")
        String primarySource,
        
        @JsonProperty("employment_details")
        String employmentDetails,
        
        @JsonProperty("estimated_annual_income")
        Double estimatedAnnualIncome,
        
        @JsonProperty("supporting_documents")
        List<String> supportingDocuments,
        
        @JsonProperty("verification_status")
        VerificationStatus verificationStatus
    ) {}
    
    /**
     * Politically Exposed Person (PEP) screening
     */
    public record PEPScreening(
        @JsonProperty("pep_status")
        PEPStatus pepStatus,
        
        @JsonProperty("screening_date")
        LocalDateTime screeningDate,
        
        @JsonProperty("screening_provider")
        String screeningProvider,
        
        @JsonProperty("matches_found")
        List<String> matchesFound,
        
        @JsonProperty("risk_rating")
        RiskRating riskRating
    ) {}
    
    /**
     * Sanctions list screening
     */
    public record SanctionsScreening(
        @JsonProperty("screening_result")
        ScreeningResult screeningResult,
        
        @JsonProperty("screening_date")
        LocalDateTime screeningDate,
        
        @JsonProperty("lists_checked")
        List<String> listsChecked,
        
        @JsonProperty("matches_found")
        List<String> matchesFound,
        
        @JsonProperty("false_positive_probability")
        double falsePositiveProbability
    ) {}
    
    /**
     * Anti-Money Laundering (AML) checks
     */
    public record AMLChecks(
        @JsonProperty("aml_status")
        AMLStatus amlStatus,
        
        @JsonProperty("transaction_monitoring")
        boolean transactionMonitoring,
        
        @JsonProperty("suspicious_activity")
        List<String> suspiciousActivity,
        
        @JsonProperty("reporting_obligations")
        List<String> reportingObligations,
        
        @JsonProperty("risk_assessment")
        RiskAssessment riskAssessment
    ) {}
    
    /**
     * Risk assessment for AML compliance
     */
    public record RiskAssessment(
        @JsonProperty("risk_score")
        double riskScore,
        
        @JsonProperty("risk_factors")
        Map<String, Double> riskFactors,
        
        @JsonProperty("mitigation_measures")
        List<String> mitigationMeasures,
        
        @JsonProperty("monitoring_frequency")
        MonitoringFrequency monitoringFrequency
    ) {}
    
    /**
     * Blockchain anchor for identity verification
     */
    public record BlockchainAnchor(
        @JsonProperty("blockchain_network")
        String blockchainNetwork,
        
        @JsonProperty("anchor_hash")
        String anchorHash,
        
        @JsonProperty("block_height")
        long blockHeight,
        
        @JsonProperty("timestamp")
        long timestamp,
        
        @JsonProperty("verification_method")
        String verificationMethod,
        
        @JsonProperty("merkle_proof")
        List<String> merkleProof
    ) {}
    
    /**
     * Access permissions for identity data
     */
    public record AccessPermissions(
        @JsonProperty("data_controllers")
        Set<String> dataControllers,
        
        @JsonProperty("data_processors")
        Set<String> dataProcessors,
        
        @JsonProperty("permission_matrix")
        Map<String, Set<String>> permissionMatrix,
        
        @JsonProperty("delegation_allowed")
        boolean delegationAllowed,
        
        @JsonProperty("revocation_mechanism")
        boolean revocationMechanism
    ) {}
    
    /**
     * Identity metadata and versioning
     */
    public record IdentityMetadata(
        @JsonProperty("schema_version")
        String schemaVersion,
        
        @JsonProperty("identity_version")
        String identityVersion,
        
        @JsonProperty("last_updated")
        LocalDateTime lastUpdated,
        
        @JsonProperty("update_history")
        List<String> updateHistory,
        
        @JsonProperty("interoperability_score")
        double interoperabilityScore,
        
        @JsonProperty("standards_compliance")
        Map<String, Boolean> standardsCompliance
    ) {}
    
    // Enums
    
    public enum IdentityType {
        INDIVIDUAL,
        ORGANIZATION,
        DEVICE,
        SERVICE,
        GOVERNMENT,
        HEALTHCARE_PROVIDER
    }
    
    public enum IdentityStatus {
        PENDING,
        VERIFIED,
        ACTIVE,
        SUSPENDED,
        REVOKED,
        EXPIRED
    }
    
    public enum AuthMethod {
        PASSWORD,
        BIOMETRIC,
        HARDWARE_TOKEN,
        MOBILE_APP,
        SMS_OTP,
        EMAIL_OTP,
        PUSH_NOTIFICATION,
        SMART_CARD
    }
    
    public enum AssuranceLevel {
        LOW,
        MODERATE,
        HIGH,
        VERY_HIGH
    }
    
    public enum CredentialStatus {
        VALID,
        SUSPENDED,
        REVOKED,
        EXPIRED
    }
    
    public enum TrustLevel {
        LOW,
        MEDIUM,
        HIGH,
        MAXIMUM
    }
    
    public enum ConsentAction {
        GRANTED,
        DENIED,
        WITHDRAWN,
        MODIFIED,
        EXPIRED
    }
    
    public enum ViolationType {
        FRAUD,
        IMPERSONATION,
        DATA_BREACH,
        UNAUTHORIZED_ACCESS,
        POLICY_VIOLATION
    }
    
    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
    
    public enum KYCStatus {
        NOT_STARTED,
        IN_PROGRESS,
        PENDING_REVIEW,
        APPROVED,
        REJECTED,
        EXPIRED
    }
    
    public enum VerificationLevel {
        BASIC,
        ENHANCED,
        PREMIUM,
        INSTITUTIONAL
    }
    
    public enum DocumentType {
        PASSPORT,
        DRIVERS_LICENSE,
        NATIONAL_ID,
        BIRTH_CERTIFICATE,
        UTILITY_BILL,
        BANK_STATEMENT
    }
    
    public enum DocumentVerificationStatus {
        NOT_VERIFIED,
        VERIFIED,
        FAILED,
        EXPIRED,
        SUSPICIOUS
    }
    
    public enum AddressVerificationMethod {
        UTILITY_BILL,
        BANK_STATEMENT,
        GOVERNMENT_LETTER,
        GEOLOCATION,
        POSTAL_SERVICE
    }
    
    public enum VerificationStatus {
        PENDING,
        VERIFIED,
        FAILED,
        EXPIRED
    }
    
    public enum PEPStatus {
        NOT_PEP,
        CURRENT_PEP,
        FORMER_PEP,
        FAMILY_MEMBER,
        CLOSE_ASSOCIATE
    }
    
    public enum RiskRating {
        LOW,
        MEDIUM,
        HIGH,
        EXTREME
    }
    
    public enum ScreeningResult {
        CLEAR,
        POTENTIAL_MATCH,
        CONFIRMED_MATCH,
        ERROR
    }
    
    public enum AMLStatus {
        CLEAR,
        UNDER_REVIEW,
        SUSPICIOUS,
        REPORTED
    }
    
    public enum MonitoringFrequency {
        REAL_TIME,
        DAILY,
        WEEKLY,
        MONTHLY,
        QUARTERLY,
        ANNUALLY
    }
    
    /**
     * Validate digital identity integrity
     */
    public boolean isValid() {
        return identityId != null && 
               !identityId.isEmpty() &&
               status == IdentityStatus.VERIFIED &&
               (expirationDate == null || LocalDateTime.now().isBefore(expirationDate)) &&
               kycCompliance != null &&
               kycCompliance.kycStatus() == KYCStatus.APPROVED;
    }
    
    /**
     * Check if identity has required verification level
     */
    public boolean hasVerificationLevel(VerificationLevel required) {
        return kycCompliance != null &&
               kycCompliance.verificationLevel() != null &&
               kycCompliance.verificationLevel().ordinal() >= required.ordinal();
    }
    
    /**
     * Get overall trust score combining reputation and verification
     */
    public double getTrustScore() {
        double reputationWeight = 0.6;
        double verificationWeight = 0.4;
        
        double repScore = reputationScore != null ? reputationScore.overallScore() : 0.0;
        double verScore = kycCompliance != null ? 
            (kycCompliance.verificationLevel().ordinal() + 1) * 0.25 : 0.0;
        
        return (repScore * reputationWeight) + (verScore * verificationWeight);
    }
    
    /**
     * Check if identity requires re-verification
     */
    public boolean requiresReVerification() {
        if (kycCompliance == null) return true;
        
        LocalDateTime reviewDue = kycCompliance.reviewDueDate();
        return reviewDue != null && LocalDateTime.now().isAfter(reviewDue);
    }
    
    /**
     * Generate zero-knowledge proof for identity claim
     */
    public String generateZKProof(String claim) {
        // In real implementation, this would generate actual ZK proofs
        return "zkp_" + claim.hashCode() + "_" + identityId.hashCode();
    }
    
    /**
     * Get privacy-preserving identity summary
     */
    public IdentitySummary getPrivacySummary() {
        return new IdentitySummary(
            identityId,
            identityType,
            getTrustScore(),
            kycCompliance != null ? kycCompliance.verificationLevel() : VerificationLevel.BASIC,
            status,
            lastVerified
        );
    }
    
    public record IdentitySummary(
        String identityId,
        IdentityType identityType,
        double trustScore,
        VerificationLevel verificationLevel,
        IdentityStatus status,
        LocalDateTime lastVerified
    ) {}
}