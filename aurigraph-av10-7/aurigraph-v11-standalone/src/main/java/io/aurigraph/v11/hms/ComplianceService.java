package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.ComplianceInfo;
import io.aurigraph.v11.hms.models.ComplianceViolation;
import io.aurigraph.v11.hms.models.HealthcareAsset;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Compliance validation service for HIPAA and GDPR
 */
@ApplicationScoped
public class ComplianceService {

    /**
     * Validate compliance for a healthcare asset
     */
    public ComplianceValidationResult validateCompliance(HealthcareAsset asset) {
        Log.infof("Validating compliance for asset: %s", asset.getAssetId());

        List<String> errors = new ArrayList<>();
        List<ComplianceViolation> violations = new ArrayList<>();
        ComplianceInfo complianceInfo = asset.getComplianceInfo();

        // Check if compliance info exists
        if (complianceInfo == null) {
            errors.add("No compliance information provided");
            return new ComplianceValidationResult(false, errors, violations);
        }

        // HIPAA Validation
        if (!validateHIPAA(asset, complianceInfo, errors, violations)) {
            Log.warnf("HIPAA validation failed for asset %s", asset.getAssetId());
        }

        // GDPR Validation
        if (!validateGDPR(asset, complianceInfo, errors, violations)) {
            Log.warnf("GDPR validation failed for asset %s", asset.getAssetId());
        }

        // Validate consent
        if (!validateConsent(complianceInfo, errors, violations)) {
            Log.warnf("Consent validation failed for asset %s", asset.getAssetId());
        }

        // Validate data encryption
        if (!validateEncryption(asset, errors, violations)) {
            Log.warnf("Encryption validation failed for asset %s", asset.getAssetId());
        }

        // Fraud detection
        if (detectFraud(asset, complianceInfo)) {
            violations.add(new ComplianceViolation(
                "FRAUD_DETECTED",
                "Potential fraudulent activity detected",
                ComplianceViolation.ViolationSeverity.CRITICAL
            ));
            errors.add("Fraud detection alert triggered");
            Log.errorf("FRAUD DETECTED for asset %s", asset.getAssetId());
        }

        // Update compliance info with violations
        complianceInfo.getViolations().addAll(violations);
        complianceInfo.setLastAuditTimestamp(Instant.now());

        boolean isValid = errors.isEmpty();
        if (isValid) {
            Log.infof("Compliance validation passed for asset %s", asset.getAssetId());
        } else {
            Log.warnf("Compliance validation failed for asset %s with %d errors",
                asset.getAssetId(), errors.size());
        }

        return new ComplianceValidationResult(isValid, errors, violations);
    }

    /**
     * Validate HIPAA compliance
     */
    private boolean validateHIPAA(HealthcareAsset asset, ComplianceInfo complianceInfo,
                                 List<String> errors, List<ComplianceViolation> violations) {
        boolean valid = true;

        // Check if HIPAA compliance is claimed
        if (!complianceInfo.isHipaaCompliant()) {
            errors.add("Asset is not marked as HIPAA compliant");
            violations.add(new ComplianceViolation(
                "HIPAA_NOT_COMPLIANT",
                "Asset does not meet HIPAA compliance requirements",
                ComplianceViolation.ViolationSeverity.HIGH
            ));
            valid = false;
        }

        // Check jurisdiction (HIPAA applies to US)
        if (complianceInfo.getJurisdiction() != null &&
            !complianceInfo.getJurisdiction().equals("US")) {
            // Log but don't fail for non-US jurisdictions
            Log.infof("Asset %s is not in US jurisdiction, HIPAA may not apply", asset.getAssetId());
        }

        // Check encryption requirement
        if (!asset.isEncrypted()) {
            errors.add("HIPAA requires PHI to be encrypted");
            violations.add(new ComplianceViolation(
                "HIPAA_ENCRYPTION_REQUIRED",
                "Protected Health Information (PHI) must be encrypted at rest",
                ComplianceViolation.ViolationSeverity.HIGH
            ));
            valid = false;
        }

        // Check access controls (metadata should include access permissions)
        if (asset.getMetadata() == null || !asset.getMetadata().containsKey("access_controls")) {
            errors.add("HIPAA requires documented access controls");
            violations.add(new ComplianceViolation(
                "HIPAA_ACCESS_CONTROLS_MISSING",
                "Access control documentation is required for HIPAA compliance",
                ComplianceViolation.ViolationSeverity.MEDIUM
            ));
            valid = false;
        }

        // Check audit trail
        if (asset.getMetadata() == null || !asset.getMetadata().containsKey("audit_trail")) {
            Log.warnf("Asset %s is missing audit trail metadata", asset.getAssetId());
            complianceInfo.addComplianceFlag("MISSING_AUDIT_TRAIL");
        }

        return valid;
    }

    /**
     * Validate GDPR compliance
     */
    private boolean validateGDPR(HealthcareAsset asset, ComplianceInfo complianceInfo,
                                List<String> errors, List<ComplianceViolation> violations) {
        boolean valid = true;

        // Check if GDPR compliance is claimed
        if (!complianceInfo.isGdprCompliant()) {
            errors.add("Asset is not marked as GDPR compliant");
            violations.add(new ComplianceViolation(
                "GDPR_NOT_COMPLIANT",
                "Asset does not meet GDPR compliance requirements",
                ComplianceViolation.ViolationSeverity.HIGH
            ));
            valid = false;
        }

        // Check for lawful basis of processing
        if (asset.getMetadata() == null || !asset.getMetadata().containsKey("lawful_basis")) {
            errors.add("GDPR requires documented lawful basis for processing");
            violations.add(new ComplianceViolation(
                "GDPR_LAWFUL_BASIS_MISSING",
                "Lawful basis for data processing must be documented",
                ComplianceViolation.ViolationSeverity.HIGH
            ));
            valid = false;
        }

        // Check data minimization principle
        if (asset.getMetadata() != null && asset.getMetadata().size() > 20) {
            Log.warnf("Asset %s may violate GDPR data minimization principle (excessive metadata)",
                asset.getAssetId());
            complianceInfo.addComplianceFlag("GDPR_DATA_MINIMIZATION_CONCERN");
        }

        // Check right to erasure capability
        if (asset.getMetadata() == null || !asset.getMetadata().containsKey("erasure_capable")) {
            Log.warnf("Asset %s may not support GDPR right to erasure", asset.getAssetId());
            complianceInfo.addComplianceFlag("GDPR_ERASURE_CAPABILITY_UNCLEAR");
        }

        return valid;
    }

    /**
     * Validate consent
     */
    private boolean validateConsent(ComplianceInfo complianceInfo, List<String> errors,
                                   List<ComplianceViolation> violations) {
        boolean valid = true;

        // Check consent signature
        if (complianceInfo.getConsentSignature() == null ||
            complianceInfo.getConsentSignature().isEmpty()) {
            errors.add("Patient consent signature is required");
            violations.add(new ComplianceViolation(
                "CONSENT_SIGNATURE_MISSING",
                "Patient consent signature is missing",
                ComplianceViolation.ViolationSeverity.CRITICAL
            ));
            valid = false;
        }

        // Check consent timestamp
        if (complianceInfo.getConsentTimestamp() == null) {
            errors.add("Consent timestamp is required");
            violations.add(new ComplianceViolation(
                "CONSENT_TIMESTAMP_MISSING",
                "Consent timestamp is missing",
                ComplianceViolation.ViolationSeverity.HIGH
            ));
            valid = false;
        }

        // Check if consent is recent (within 2 years)
        if (complianceInfo.getConsentTimestamp() != null) {
            Instant twoYearsAgo = Instant.now().minusSeconds(2 * 365 * 24 * 60 * 60L);
            if (complianceInfo.getConsentTimestamp().isBefore(twoYearsAgo)) {
                errors.add("Consent may be expired (older than 2 years)");
                violations.add(new ComplianceViolation(
                    "CONSENT_EXPIRED",
                    "Patient consent is older than 2 years and may need renewal",
                    ComplianceViolation.ViolationSeverity.MEDIUM
                ));
                valid = false;
            }
        }

        return valid;
    }

    /**
     * Validate encryption
     */
    private boolean validateEncryption(HealthcareAsset asset, List<String> errors,
                                      List<ComplianceViolation> violations) {
        boolean valid = true;

        if (!asset.isEncrypted()) {
            errors.add("Healthcare data must be encrypted");
            violations.add(new ComplianceViolation(
                "ENCRYPTION_REQUIRED",
                "Healthcare data must be encrypted at rest and in transit",
                ComplianceViolation.ViolationSeverity.CRITICAL
            ));
            valid = false;
        }

        if (asset.isEncrypted() &&
            (asset.getEncryptionKeyId() == null || asset.getEncryptionKeyId().isEmpty())) {
            errors.add("Encryption key ID is missing");
            violations.add(new ComplianceViolation(
                "ENCRYPTION_KEY_ID_MISSING",
                "Encrypted data must have an associated encryption key ID",
                ComplianceViolation.ViolationSeverity.HIGH
            ));
            valid = false;
        }

        return valid;
    }

    /**
     * Detect potential fraud
     */
    private boolean detectFraud(HealthcareAsset asset, ComplianceInfo complianceInfo) {
        // Fraud detection logic (simplified for demo)

        // Check for duplicate asset IDs with different owners (simple check)
        // In production, this would query a database

        // Check for suspicious patterns in metadata
        if (asset.getMetadata() != null) {
            // Check for known fraud indicators
            if (asset.getMetadata().containsKey("fraud_flag")) {
                return true;
            }

            // Check for suspicious timestamps (future dates)
            if (asset.getCreatedAt().isAfter(Instant.now())) {
                Log.warnf("Asset %s has future creation timestamp - potential fraud",
                    asset.getAssetId());
                return true;
            }
        }

        // Check for missing critical compliance fields
        if (complianceInfo.getConsentSignature() == null &&
            complianceInfo.getConsentTimestamp() == null &&
            !complianceInfo.isHipaaCompliant() &&
            !complianceInfo.isGdprCompliant()) {
            Log.warnf("Asset %s is missing all compliance fields - potential fraud",
                asset.getAssetId());
            return true;
        }

        return false;
    }

    /**
     * Perform compliance audit
     */
    public ComplianceAuditReport performAudit(HealthcareAsset asset) {
        Log.infof("Performing compliance audit for asset: %s", asset.getAssetId());

        ComplianceValidationResult validationResult = validateCompliance(asset);

        ComplianceAuditReport report = new ComplianceAuditReport(
            asset.getAssetId(),
            Instant.now(),
            validationResult.isValid(),
            validationResult.getErrors(),
            validationResult.getViolations(),
            asset.getComplianceInfo()
        );

        Log.infof("Compliance audit completed for asset %s: %s",
            asset.getAssetId(), validationResult.isValid() ? "PASSED" : "FAILED");

        return report;
    }

    // Result classes
    public static class ComplianceValidationResult {
        private final boolean valid;
        private final List<String> errors;
        private final List<ComplianceViolation> violations;

        public ComplianceValidationResult(boolean valid, List<String> errors,
                                         List<ComplianceViolation> violations) {
            this.valid = valid;
            this.errors = errors;
            this.violations = violations;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public List<ComplianceViolation> getViolations() {
            return violations;
        }
    }

    public static class ComplianceAuditReport {
        private final String assetId;
        private final Instant auditTimestamp;
        private final boolean passed;
        private final List<String> errors;
        private final List<ComplianceViolation> violations;
        private final ComplianceInfo complianceInfo;

        public ComplianceAuditReport(String assetId, Instant auditTimestamp, boolean passed,
                                    List<String> errors, List<ComplianceViolation> violations,
                                    ComplianceInfo complianceInfo) {
            this.assetId = assetId;
            this.auditTimestamp = auditTimestamp;
            this.passed = passed;
            this.errors = errors;
            this.violations = violations;
            this.complianceInfo = complianceInfo;
        }

        // Getters
        public String getAssetId() { return assetId; }
        public Instant getAuditTimestamp() { return auditTimestamp; }
        public boolean isPassed() { return passed; }
        public List<String> getErrors() { return errors; }
        public List<ComplianceViolation> getViolations() { return violations; }
        public ComplianceInfo getComplianceInfo() { return complianceInfo; }
    }
}
