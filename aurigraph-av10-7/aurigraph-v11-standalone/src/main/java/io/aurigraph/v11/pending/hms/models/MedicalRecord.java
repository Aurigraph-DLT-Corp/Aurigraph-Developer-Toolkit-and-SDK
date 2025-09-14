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
 * Immutable medical record stored on blockchain for Aurigraph V11 HMS
 * 
 * Features:
 * - Cryptographic integrity validation
 * - Zero-knowledge medical proofs
 * - Interoperability standards (FHIR R4)
 * - Privacy-preserving medical analytics
 * - Automated compliance verification
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MedicalRecord(
    
    @JsonProperty("record_id")
    @NotBlank(message = "Medical record ID is required")
    @Pattern(regexp = "^MED-[A-Z0-9]{8}-[A-Z0-9]{4}$", message = "Invalid medical record ID format")
    String recordId,
    
    @JsonProperty("patient_id")
    @NotBlank(message = "Patient ID is required")
    String patientId,
    
    @JsonProperty("healthcare_provider_id")
    @NotBlank(message = "Healthcare provider ID is required")
    String healthcareProviderId,
    
    @JsonProperty("medical_data")
    @NotNull(message = "Medical data is required")
    EncryptedMedicalData medicalData,
    
    @JsonProperty("diagnosis_codes")
    @NotNull(message = "Diagnosis codes required")
    List<DiagnosisCode> diagnosisCodes,
    
    @JsonProperty("treatment_plan")
    @NotNull(message = "Treatment plan required")
    TreatmentPlan treatmentPlan,
    
    @JsonProperty("medications")
    @NotNull(message = "Medications list required")
    List<Medication> medications,
    
    @JsonProperty("vitals")
    @NotNull(message = "Vitals data required")
    VitalSigns vitals,
    
    @JsonProperty("lab_results")
    @NotNull(message = "Lab results list required")
    List<LabResult> labResults,
    
    @JsonProperty("imaging_studies")
    @NotNull(message = "Imaging studies list required")
    List<ImagingStudy> imagingStudies,
    
    @JsonProperty("clinical_notes")
    @NotNull(message = "Clinical notes required")
    ClinicalNotes clinicalNotes,
    
    @JsonProperty("fhir_resource")
    @NotNull(message = "FHIR resource required")
    FHIRResource fhirResource,
    
    @JsonProperty("privacy_annotations")
    @NotNull(message = "Privacy annotations required")
    PrivacyAnnotations privacyAnnotations,
    
    @JsonProperty("blockchain_proof")
    @NotNull(message = "Blockchain proof required")
    BlockchainProof blockchainProof,
    
    @JsonProperty("record_metadata")
    @NotNull(message = "Record metadata required")
    RecordMetadata recordMetadata,
    
    @JsonProperty("created_timestamp")
    @NotNull(message = "Created timestamp required")
    LocalDateTime createdTimestamp,
    
    @JsonProperty("last_modified")
    @NotNull(message = "Last modified timestamp required")
    LocalDateTime lastModified,
    
    @JsonProperty("record_status")
    @NotNull(message = "Record status required")
    MedicalRecordStatus recordStatus
) {
    
    /**
     * Encrypted medical data with homomorphic encryption support
     */
    public record EncryptedMedicalData(
        @JsonProperty("encrypted_content")
        String encryptedContent,
        
        @JsonProperty("content_hash")
        String contentHash,
        
        @JsonProperty("encryption_metadata")
        EncryptionMetadata encryptionMetadata,
        
        @JsonProperty("homomorphic_operations")
        List<String> homomorphicOperations,
        
        @JsonProperty("zero_knowledge_proofs")
        Map<String, String> zeroKnowledgeProofs
    ) {}
    
    /**
     * Encryption metadata and key management
     */
    public record EncryptionMetadata(
        @JsonProperty("algorithm")
        String algorithm,
        
        @JsonProperty("key_version")
        String keyVersion,
        
        @JsonProperty("initialization_vector")
        String initializationVector,
        
        @JsonProperty("authenticated_encryption")
        boolean authenticatedEncryption,
        
        @JsonProperty("key_derivation_function")
        String keyDerivationFunction,
        
        @JsonProperty("homomorphic_scheme")
        String homomorphicScheme
    ) {}
    
    /**
     * ICD-10/ICD-11 diagnosis codes with confidence scores
     */
    public record DiagnosisCode(
        @JsonProperty("code")
        String code,
        
        @JsonProperty("system")
        String system, // ICD-10, ICD-11, SNOMED CT
        
        @JsonProperty("description")
        String description,
        
        @JsonProperty("confidence_score")
        double confidenceScore,
        
        @JsonProperty("ai_assisted")
        boolean aiAssisted,
        
        @JsonProperty("verification_status")
        VerificationStatus verificationStatus,
        
        @JsonProperty("onset_date")
        LocalDateTime onsetDate,
        
        @JsonProperty("resolution_date")
        LocalDateTime resolutionDate
    ) {}
    
    /**
     * Comprehensive treatment plan with AI recommendations
     */
    public record TreatmentPlan(
        @JsonProperty("plan_id")
        String planId,
        
        @JsonProperty("primary_goals")
        List<String> primaryGoals,
        
        @JsonProperty("interventions")
        List<Intervention> interventions,
        
        @JsonProperty("expected_outcomes")
        List<String> expectedOutcomes,
        
        @JsonProperty("timeline")
        TreatmentTimeline timeline,
        
        @JsonProperty("ai_recommendations")
        List<AIRecommendation> aiRecommendations,
        
        @JsonProperty("care_team")
        List<String> careTeam,
        
        @JsonProperty("patient_preferences")
        String patientPreferences
    ) {}
    
    /**
     * Medical intervention details
     */
    public record Intervention(
        @JsonProperty("intervention_type")
        InterventionType interventionType,
        
        @JsonProperty("description")
        String description,
        
        @JsonProperty("frequency")
        String frequency,
        
        @JsonProperty("duration")
        String duration,
        
        @JsonProperty("priority")
        Priority priority,
        
        @JsonProperty("expected_outcome")
        String expectedOutcome
    ) {}
    
    /**
     * Treatment timeline with milestones
     */
    public record TreatmentTimeline(
        @JsonProperty("start_date")
        LocalDateTime startDate,
        
        @JsonProperty("expected_end_date")
        LocalDateTime expectedEndDate,
        
        @JsonProperty("milestones")
        List<Milestone> milestones,
        
        @JsonProperty("review_dates")
        List<LocalDateTime> reviewDates
    ) {}
    
    /**
     * Treatment milestone
     */
    public record Milestone(
        @JsonProperty("milestone_id")
        String milestoneId,
        
        @JsonProperty("description")
        String description,
        
        @JsonProperty("target_date")
        LocalDateTime targetDate,
        
        @JsonProperty("achieved")
        boolean achieved,
        
        @JsonProperty("achievement_date")
        LocalDateTime achievementDate
    ) {}
    
    /**
     * AI-generated treatment recommendation
     */
    public record AIRecommendation(
        @JsonProperty("recommendation_id")
        String recommendationId,
        
        @JsonProperty("ai_model_version")
        String aiModelVersion,
        
        @JsonProperty("recommendation")
        String recommendation,
        
        @JsonProperty("confidence_score")
        double confidenceScore,
        
        @JsonProperty("evidence_level")
        EvidenceLevel evidenceLevel,
        
        @JsonProperty("supporting_studies")
        List<String> supportingStudies,
        
        @JsonProperty("contraindications")
        List<String> contraindications
    ) {}
    
    /**
     * Patient medication with adherence tracking
     */
    public record Medication(
        @JsonProperty("medication_id")
        String medicationId,
        
        @JsonProperty("name")
        String name,
        
        @JsonProperty("generic_name")
        String genericName,
        
        @JsonProperty("dosage")
        String dosage,
        
        @JsonProperty("frequency")
        String frequency,
        
        @JsonProperty("route")
        String route,
        
        @JsonProperty("start_date")
        LocalDateTime startDate,
        
        @JsonProperty("end_date")
        LocalDateTime endDate,
        
        @JsonProperty("prescribing_provider")
        String prescribingProvider,
        
        @JsonProperty("adherence_rate")
        double adherenceRate,
        
        @JsonProperty("side_effects")
        List<String> sideEffects,
        
        @JsonProperty("drug_interactions")
        List<String> drugInteractions
    ) {}
    
    /**
     * Vital signs with normal ranges
     */
    public record VitalSigns(
        @JsonProperty("measurement_time")
        LocalDateTime measurementTime,
        
        @JsonProperty("blood_pressure_systolic")
        Integer bloodPressureSystolic,
        
        @JsonProperty("blood_pressure_diastolic")
        Integer bloodPressureDiastolic,
        
        @JsonProperty("heart_rate")
        Integer heartRate,
        
        @JsonProperty("temperature")
        Double temperature,
        
        @JsonProperty("respiratory_rate")
        Integer respiratoryRate,
        
        @JsonProperty("oxygen_saturation")
        Double oxygenSaturation,
        
        @JsonProperty("height_cm")
        Double heightCm,
        
        @JsonProperty("weight_kg")
        Double weightKg,
        
        @JsonProperty("bmi")
        Double bmi,
        
        @JsonProperty("pain_scale")
        Integer painScale
    ) {}
    
    /**
     * Laboratory test result
     */
    public record LabResult(
        @JsonProperty("test_id")
        String testId,
        
        @JsonProperty("test_name")
        String testName,
        
        @JsonProperty("result_value")
        String resultValue,
        
        @JsonProperty("reference_range")
        String referenceRange,
        
        @JsonProperty("unit_of_measure")
        String unitOfMeasure,
        
        @JsonProperty("abnormal_flag")
        AbnormalFlag abnormalFlag,
        
        @JsonProperty("test_date")
        LocalDateTime testDate,
        
        @JsonProperty("lab_name")
        String labName,
        
        @JsonProperty("ordering_provider")
        String orderingProvider,
        
        @JsonProperty("clinical_significance")
        String clinicalSignificance
    ) {}
    
    /**
     * Medical imaging study
     */
    public record ImagingStudy(
        @JsonProperty("study_id")
        String studyId,
        
        @JsonProperty("modality")
        ImagingModality modality,
        
        @JsonProperty("body_part")
        String bodyPart,
        
        @JsonProperty("study_date")
        LocalDateTime studyDate,
        
        @JsonProperty("radiologist")
        String radiologist,
        
        @JsonProperty("findings")
        String findings,
        
        @JsonProperty("impression")
        String impression,
        
        @JsonProperty("image_urls")
        List<String> imageUrls,
        
        @JsonProperty("ai_analysis")
        AIAnalysis aiAnalysis,
        
        @JsonProperty("quality_metrics")
        Map<String, Double> qualityMetrics
    ) {}
    
    /**
     * AI analysis of medical imaging
     */
    public record AIAnalysis(
        @JsonProperty("ai_model")
        String aiModel,
        
        @JsonProperty("analysis_results")
        Map<String, Double> analysisResults,
        
        @JsonProperty("anomaly_detection")
        List<String> anomalyDetection,
        
        @JsonProperty("confidence_scores")
        Map<String, Double> confidenceScores,
        
        @JsonProperty("radiologist_review_required")
        boolean radiologistReviewRequired
    ) {}
    
    /**
     * Clinical notes with NLP processing
     */
    public record ClinicalNotes(
        @JsonProperty("subjective")
        String subjective,
        
        @JsonProperty("objective")
        String objective,
        
        @JsonProperty("assessment")
        String assessment,
        
        @JsonProperty("plan")
        String plan,
        
        @JsonProperty("provider_signature")
        String providerSignature,
        
        @JsonProperty("nlp_entities")
        Map<String, List<String>> nlpEntities,
        
        @JsonProperty("sentiment_analysis")
        SentimentAnalysis sentimentAnalysis,
        
        @JsonProperty("key_phrases")
        List<String> keyPhrases
    ) {}
    
    /**
     * NLP sentiment analysis of clinical notes
     */
    public record SentimentAnalysis(
        @JsonProperty("overall_sentiment")
        String overallSentiment,
        
        @JsonProperty("confidence_score")
        double confidenceScore,
        
        @JsonProperty("emotional_indicators")
        Map<String, Double> emotionalIndicators
    ) {}
    
    /**
     * FHIR R4 resource compliance
     */
    public record FHIRResource(
        @JsonProperty("resource_type")
        String resourceType,
        
        @JsonProperty("fhir_version")
        String fhirVersion,
        
        @JsonProperty("resource_json")
        String resourceJson,
        
        @JsonProperty("validation_status")
        FHIRValidationStatus validationStatus,
        
        @JsonProperty("interoperability_score")
        double interoperabilityScore
    ) {}
    
    /**
     * Privacy annotations for selective disclosure
     */
    public record PrivacyAnnotations(
        @JsonProperty("sensitivity_level")
        SensitivityLevel sensitivityLevel,
        
        @JsonProperty("redaction_rules")
        Map<String, RedactionRule> redactionRules,
        
        @JsonProperty("sharing_restrictions")
        Set<String> sharingRestrictions,
        
        @JsonProperty("anonymization_applied")
        boolean anonymizationApplied,
        
        @JsonProperty("differential_privacy_budget")
        double differentialPrivacyBudget
    ) {}
    
    /**
     * Data redaction rule for privacy
     */
    public record RedactionRule(
        @JsonProperty("field_path")
        String fieldPath,
        
        @JsonProperty("redaction_type")
        RedactionType redactionType,
        
        @JsonProperty("replacement_value")
        String replacementValue,
        
        @JsonProperty("access_level_required")
        String accessLevelRequired
    ) {}
    
    /**
     * Blockchain immutability proof
     */
    public record BlockchainProof(
        @JsonProperty("record_hash")
        String recordHash,
        
        @JsonProperty("merkle_proof")
        List<String> merkleProof,
        
        @JsonProperty("block_timestamp")
        long blockTimestamp,
        
        @JsonProperty("consensus_signatures")
        List<String> consensusSignatures,
        
        @JsonProperty("integrity_verified")
        boolean integrityVerified,
        
        @JsonProperty("tamper_evidence")
        String tamperEvidence
    ) {}
    
    /**
     * Record metadata and versioning
     */
    public record RecordMetadata(
        @JsonProperty("version")
        String version,
        
        @JsonProperty("revision_history")
        List<String> revisionHistory,
        
        @JsonProperty("data_sources")
        Set<String> dataSources,
        
        @JsonProperty("quality_score")
        double qualityScore,
        
        @JsonProperty("completeness_score")
        double completenessScore,
        
        @JsonProperty("accuracy_score")
        double accuracyScore,
        
        @JsonProperty("timeliness_score")
        double timelinessScore
    ) {}
    
    // Enums
    
    public enum MedicalRecordStatus {
        DRAFT,
        ACTIVE,
        AMENDED,
        ARCHIVED,
        DELETED,
        ERROR
    }
    
    public enum VerificationStatus {
        UNVERIFIED,
        PROVISIONAL,
        CONFIRMED,
        REFUTED,
        UNKNOWN
    }
    
    public enum InterventionType {
        MEDICATION,
        SURGERY,
        THERAPY,
        LIFESTYLE,
        MONITORING,
        CONSULTATION
    }
    
    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT,
        CRITICAL
    }
    
    public enum EvidenceLevel {
        LEVEL_1A,
        LEVEL_1B,
        LEVEL_2A,
        LEVEL_2B,
        LEVEL_3,
        LEVEL_4,
        LEVEL_5
    }
    
    public enum AbnormalFlag {
        NORMAL,
        HIGH,
        LOW,
        CRITICAL_HIGH,
        CRITICAL_LOW,
        ABNORMAL
    }
    
    public enum ImagingModality {
        CT,
        MRI,
        XRAY,
        ULTRASOUND,
        PET,
        MAMMOGRAPHY,
        NUCLEAR_MEDICINE
    }
    
    public enum FHIRValidationStatus {
        VALID,
        WARNING,
        ERROR,
        FATAL
    }
    
    public enum SensitivityLevel {
        PUBLIC,
        INTERNAL,
        CONFIDENTIAL,
        RESTRICTED,
        TOP_SECRET
    }
    
    public enum RedactionType {
        COMPLETE,
        PARTIAL,
        HASH,
        GENERALIZE,
        SUPPRESS
    }
    
    /**
     * Validate medical record integrity
     */
    public boolean isValid() {
        return recordId != null && 
               !recordId.isEmpty() &&
               patientId != null &&
               medicalData != null &&
               blockchainProof != null &&
               blockchainProof.integrityVerified();
    }
    
    /**
     * Calculate overall data quality score
     */
    public double getDataQualityScore() {
        if (recordMetadata == null) {
            return 0.0;
        }
        
        return (recordMetadata.qualityScore() + 
                recordMetadata.completenessScore() + 
                recordMetadata.accuracyScore() + 
                recordMetadata.timelinessScore()) / 4.0;
    }
    
    /**
     * Check if record requires AI review
     */
    public boolean requiresAIReview() {
        if (treatmentPlan == null || treatmentPlan.aiRecommendations() == null) {
            return false;
        }
        
        return treatmentPlan.aiRecommendations().stream()
            .anyMatch(rec -> rec.confidenceScore() < 0.8);
    }
    
    /**
     * Get privacy-compliant summary
     */
    public MedicalRecordSummary getPrivacySummary(String requestorRole) {
        if (privacyAnnotations == null) {
            return null;
        }
        
        // Apply privacy rules based on requestor role
        boolean showDetails = privacyAnnotations.sensitivityLevel().ordinal() <= 2 ||
                             "PHYSICIAN".equals(requestorRole) ||
                             "RESEARCHER".equals(requestorRole);
        
        return new MedicalRecordSummary(
            recordId,
            showDetails ? diagnosisCodes : List.of(),
            showDetails ? vitals : null,
            recordMetadata != null ? recordMetadata.qualityScore() : 0.0,
            recordStatus
        );
    }
    
    public record MedicalRecordSummary(
        String recordId,
        List<DiagnosisCode> diagnosisCodes,
        VitalSigns vitals,
        double qualityScore,
        MedicalRecordStatus status
    ) {}
}