package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ComplianceService
 */
@QuarkusTest
public class ComplianceServiceTest {

    @Inject
    ComplianceService complianceService;

    private MedicalRecord compliantRecord;
    private MedicalRecord nonCompliantRecord;

    @BeforeEach
    public void setup() {
        // Create compliant record
        compliantRecord = new MedicalRecord("MR-COMP-001", "PATIENT-001", "PROVIDER-001");
        compliantRecord.setOwner("OWNER-001");
        compliantRecord.setEncrypted(true);
        compliantRecord.setEncryptionKeyId("ENC-KEY-001");

        ComplianceInfo compliantInfo = new ComplianceInfo();
        compliantInfo.setHipaaCompliant(true);
        compliantInfo.setGdprCompliant(true);
        compliantInfo.setConsentSignature("CONSENT-SIGNATURE-001");
        compliantInfo.setConsentTimestamp(Instant.now());
        compliantInfo.setJurisdiction("US");
        compliantRecord.setComplianceInfo(compliantInfo);
        compliantRecord.addMetadata("access_controls", "role-based");
        compliantRecord.addMetadata("audit_trail", "enabled");
        compliantRecord.addMetadata("lawful_basis", "consent");

        // Create non-compliant record
        nonCompliantRecord = new MedicalRecord("MR-NONCOMP-001", "PATIENT-002", "PROVIDER-002");
        nonCompliantRecord.setOwner("OWNER-002");
        // Not encrypted, missing compliance info
    }

    @Test
    public void testValidateCompliantAsset() {
        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(compliantRecord);

        assertNotNull(result);
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getViolations().isEmpty());
    }

    @Test
    public void testValidateNonCompliantAsset() {
        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(nonCompliantRecord);

        assertNotNull(result);
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    public void testHIPAAValidation() {
        MedicalRecord hipaaRecord = new MedicalRecord("MR-HIPAA-001", "PATIENT-003", "PROVIDER-003");
        hipaaRecord.setOwner("OWNER-003");
        hipaaRecord.setEncrypted(true);
        hipaaRecord.setEncryptionKeyId("ENC-KEY-002");

        ComplianceInfo hipaaInfo = new ComplianceInfo();
        hipaaInfo.setHipaaCompliant(true);
        hipaaInfo.setGdprCompliant(false); // Only HIPAA
        hipaaInfo.setConsentSignature("CONSENT-002");
        hipaaInfo.setConsentTimestamp(Instant.now());
        hipaaInfo.setJurisdiction("US");
        hipaaRecord.setComplianceInfo(hipaaInfo);
        hipaaRecord.addMetadata("access_controls", "role-based");
        hipaaRecord.addMetadata("audit_trail", "enabled");
        hipaaRecord.addMetadata("lawful_basis", "consent");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(hipaaRecord);

        // Should pass HIPAA but may have GDPR issues
        assertNotNull(result);
    }

    @Test
    public void testGDPRValidation() {
        MedicalRecord gdprRecord = new MedicalRecord("MR-GDPR-001", "PATIENT-004", "PROVIDER-004");
        gdprRecord.setOwner("OWNER-004");
        gdprRecord.setEncrypted(true);
        gdprRecord.setEncryptionKeyId("ENC-KEY-003");

        ComplianceInfo gdprInfo = new ComplianceInfo();
        gdprInfo.setHipaaCompliant(false); // Only GDPR
        gdprInfo.setGdprCompliant(true);
        gdprInfo.setConsentSignature("CONSENT-003");
        gdprInfo.setConsentTimestamp(Instant.now());
        gdprInfo.setJurisdiction("EU");
        gdprRecord.setComplianceInfo(gdprInfo);
        gdprRecord.addMetadata("access_controls", "role-based");
        gdprRecord.addMetadata("audit_trail", "enabled");
        gdprRecord.addMetadata("lawful_basis", "consent");
        gdprRecord.addMetadata("erasure_capable", "true");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(gdprRecord);

        assertNotNull(result);
    }

    @Test
    public void testEncryptionValidation() {
        MedicalRecord unencryptedRecord = new MedicalRecord("MR-UNENC-001", "PATIENT-005", "PROVIDER-005");
        unencryptedRecord.setOwner("OWNER-005");
        // Not encrypted

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-004");
        info.setConsentTimestamp(Instant.now());
        unencryptedRecord.setComplianceInfo(info);
        unencryptedRecord.addMetadata("access_controls", "role-based");
        unencryptedRecord.addMetadata("audit_trail", "enabled");
        unencryptedRecord.addMetadata("lawful_basis", "consent");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(unencryptedRecord);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(e -> e.contains("encrypted")));
    }

    @Test
    public void testConsentValidation() {
        MedicalRecord noConsentRecord = new MedicalRecord("MR-NOCON-001", "PATIENT-006", "PROVIDER-006");
        noConsentRecord.setOwner("OWNER-006");
        noConsentRecord.setEncrypted(true);
        noConsentRecord.setEncryptionKeyId("ENC-KEY-004");

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        // Missing consent signature and timestamp
        noConsentRecord.setComplianceInfo(info);
        noConsentRecord.addMetadata("access_controls", "role-based");
        noConsentRecord.addMetadata("audit_trail", "enabled");
        noConsentRecord.addMetadata("lawful_basis", "consent");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(noConsentRecord);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(e -> e.contains("consent")));
    }

    @Test
    public void testExpiredConsent() {
        MedicalRecord expiredConsentRecord = new MedicalRecord("MR-EXPCON-001", "PATIENT-007", "PROVIDER-007");
        expiredConsentRecord.setOwner("OWNER-007");
        expiredConsentRecord.setEncrypted(true);
        expiredConsentRecord.setEncryptionKeyId("ENC-KEY-005");

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-005");
        // Consent from 3 years ago
        info.setConsentTimestamp(Instant.now().minusSeconds(3 * 365 * 24 * 60 * 60L));
        expiredConsentRecord.setComplianceInfo(info);
        expiredConsentRecord.addMetadata("access_controls", "role-based");
        expiredConsentRecord.addMetadata("audit_trail", "enabled");
        expiredConsentRecord.addMetadata("lawful_basis", "consent");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(expiredConsentRecord);

        assertFalse(result.isValid());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.getViolationType().equals("CONSENT_EXPIRED")));
    }

    @Test
    public void testMissingAccessControls() {
        MedicalRecord noAccessRecord = new MedicalRecord("MR-NOACC-001", "PATIENT-008", "PROVIDER-008");
        noAccessRecord.setOwner("OWNER-008");
        noAccessRecord.setEncrypted(true);
        noAccessRecord.setEncryptionKeyId("ENC-KEY-006");

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-006");
        info.setConsentTimestamp(Instant.now());
        noAccessRecord.setComplianceInfo(info);
        // Missing access_controls metadata
        noAccessRecord.addMetadata("audit_trail", "enabled");
        noAccessRecord.addMetadata("lawful_basis", "consent");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(noAccessRecord);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(e -> e.contains("access control")));
    }

    @Test
    public void testMissingLawfulBasis() {
        MedicalRecord noLawfulBasisRecord = new MedicalRecord("MR-NOLB-001", "PATIENT-009", "PROVIDER-009");
        noLawfulBasisRecord.setOwner("OWNER-009");
        noLawfulBasisRecord.setEncrypted(true);
        noLawfulBasisRecord.setEncryptionKeyId("ENC-KEY-007");

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-007");
        info.setConsentTimestamp(Instant.now());
        noLawfulBasisRecord.setComplianceInfo(info);
        noLawfulBasisRecord.addMetadata("access_controls", "role-based");
        noLawfulBasisRecord.addMetadata("audit_trail", "enabled");
        // Missing lawful_basis for GDPR

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(noLawfulBasisRecord);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(e -> e.contains("lawful basis")));
    }

    @Test
    public void testFraudDetection() {
        MedicalRecord fraudRecord = new MedicalRecord("MR-FRAUD-001", "PATIENT-010", "PROVIDER-010");
        fraudRecord.setOwner("OWNER-010");
        fraudRecord.setEncrypted(true);
        fraudRecord.setEncryptionKeyId("ENC-KEY-008");

        ComplianceInfo info = new ComplianceInfo();
        // All compliance fields missing - suspicious
        fraudRecord.setComplianceInfo(info);
        fraudRecord.addMetadata("fraud_flag", "true"); // Explicit fraud marker

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(fraudRecord);

        assertFalse(result.isValid());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.getViolationType().equals("FRAUD_DETECTED")));
    }

    @Test
    public void testPerformAudit() {
        ComplianceService.ComplianceAuditReport report =
            complianceService.performAudit(compliantRecord);

        assertNotNull(report);
        assertEquals("MR-COMP-001", report.getAssetId());
        assertNotNull(report.getAuditTimestamp());
        assertTrue(report.isPassed());
        assertTrue(report.getErrors().isEmpty());
    }

    @Test
    public void testPerformAuditNonCompliant() {
        ComplianceService.ComplianceAuditReport report =
            complianceService.performAudit(nonCompliantRecord);

        assertNotNull(report);
        assertEquals("MR-NONCOMP-001", report.getAssetId());
        assertNotNull(report.getAuditTimestamp());
        assertFalse(report.isPassed());
        assertFalse(report.getErrors().isEmpty());
    }

    @Test
    public void testViolationSeverity() {
        // Create record with critical violation
        MedicalRecord criticalRecord = new MedicalRecord("MR-CRIT-001", "PATIENT-011", "PROVIDER-011");
        criticalRecord.setOwner("OWNER-011");
        criticalRecord.setEncrypted(false); // Critical: no encryption

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setConsentSignature("CONSENT-008");
        info.setConsentTimestamp(Instant.now());
        criticalRecord.setComplianceInfo(info);

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(criticalRecord);

        assertFalse(result.isValid());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.getSeverity() == ComplianceViolation.ViolationSeverity.CRITICAL));
    }

    @Test
    public void testComplianceInfoUpdate() {
        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(compliantRecord);

        // Check that last audit timestamp was updated
        assertNotNull(compliantRecord.getComplianceInfo().getLastAuditTimestamp());
    }

    @Test
    public void testMissingEncryptionKeyId() {
        MedicalRecord noKeyIdRecord = new MedicalRecord("MR-NOKEYID-001", "PATIENT-012", "PROVIDER-012");
        noKeyIdRecord.setOwner("OWNER-012");
        noKeyIdRecord.setEncrypted(true);
        // Missing encryption key ID

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-009");
        info.setConsentTimestamp(Instant.now());
        noKeyIdRecord.setComplianceInfo(info);
        noKeyIdRecord.addMetadata("access_controls", "role-based");
        noKeyIdRecord.addMetadata("audit_trail", "enabled");
        noKeyIdRecord.addMetadata("lawful_basis", "consent");

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(noKeyIdRecord);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(e -> e.contains("key ID")));
    }

    @Test
    public void testNoComplianceInfo() {
        MedicalRecord noInfoRecord = new MedicalRecord("MR-NOINFO-001", "PATIENT-013", "PROVIDER-013");
        noInfoRecord.setOwner("OWNER-013");
        noInfoRecord.setEncrypted(true);
        noInfoRecord.setEncryptionKeyId("ENC-KEY-009");
        // No compliance info set

        ComplianceService.ComplianceValidationResult result =
            complianceService.validateCompliance(noInfoRecord);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(e -> e.contains("No compliance information")));
    }
}
