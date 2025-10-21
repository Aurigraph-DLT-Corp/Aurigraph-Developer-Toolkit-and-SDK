package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end integration tests for HMS workflows
 */
@QuarkusTest
public class HMSIntegrationTest {

    @Inject
    HMSIntegrationService hmsService;

    @Inject
    VerificationService verificationService;

    @Inject
    ComplianceService complianceService;

    /**
     * Test complete workflow: tokenization -> verification -> transfer
     */
    @Test
    public void testCompleteWorkflow() {
        // Step 1: Create and tokenize a medical record
        MedicalRecord medicalRecord = createCompliantMedicalRecord("MR-WORKFLOW-001");
        HMSIntegrationService.TokenizationResult tokenResult =
            hmsService.tokenizeAsset(medicalRecord).await().indefinitely();

        assertTrue(tokenResult.isSuccess());
        String assetId = tokenResult.getAssetId();
        String tokenId = tokenResult.getTokenId();

        // Step 2: Register verifiers
        for (int i = 1; i <= 3; i++) {
            VerificationService.VerifierInfo verifier = new VerificationService.VerifierInfo(
                "WORKFLOW-VERIFIER-" + i,
                "Workflow Verifier " + i,
                "Test Organization",
                Arrays.asList("Cert-A"),
                Arrays.asList("Healthcare")
            );
            verificationService.registerVerifier(verifier).await().indefinitely();
        }

        // Step 3: Request verification (Tier 3 requires 3 verifiers)
        VerificationService.VerificationResult verificationRequest =
            hmsService.requestVerification(assetId, "REQUESTER-WORKFLOW", VerificationTier.TIER_3)
                .await().indefinitely();

        String verificationId = verificationRequest.getVerificationId();
        assertNotNull(verificationId);

        // Step 4: Verifiers submit votes
        for (int i = 1; i <= 3; i++) {
            VerificationService.VoteResult voteResult =
                verificationService.submitVote(
                    verificationId,
                    "WORKFLOW-VERIFIER-" + i,
                    true,
                    "Approved by verifier " + i
                ).await().indefinitely();
            assertTrue(voteResult.isSuccess());
        }

        // Step 5: Check verification status
        VerificationStatus status = verificationService.getVerificationStatus(assetId);
        assertEquals(VerificationStatus.APPROVED, status);

        // Step 6: Transfer asset
        HMSIntegrationService.TransferResult transferResult =
            hmsService.transferAsset(
                assetId,
                "OWNER-WORKFLOW",
                "NEW-OWNER-WORKFLOW",
                "AUTH-SIGNATURE-WORKFLOW"
            ).await().indefinitely();

        assertTrue(transferResult.isSuccess());
        assertEquals("NEW-OWNER-WORKFLOW", transferResult.getNewOwner());

        // Step 7: Verify final state
        HMSIntegrationService.AssetStatusInfo finalStatus =
            hmsService.getAssetStatus(assetId).await().indefinitely();

        assertEquals("NEW-OWNER-WORKFLOW", finalStatus.getCurrentOwner());
        assertEquals(VerificationStatus.APPROVED, finalStatus.getVerificationStatus());
    }

    /**
     * Test multi-asset batch tokenization with verification
     */
    @Test
    public void testBatchTokenizationAndVerification() {
        // Create multiple assets
        MedicalRecord record1 = createCompliantMedicalRecord("MR-BATCH-001");
        Prescription record2 = createCompliantPrescription("RX-BATCH-001");
        DiagnosticReport record3 = createCompliantDiagnosticReport("DR-BATCH-001");

        // Batch tokenize
        HMSIntegrationService.BatchTokenizationResult batchResult =
            hmsService.batchTokenizeAssets(Arrays.asList(record1, record2, record3))
                .await().indefinitely();

        assertTrue(batchResult.isSuccess());
        assertEquals(3, batchResult.getTotalSucceeded());

        // Register verifier
        VerificationService.VerifierInfo verifier = new VerificationService.VerifierInfo(
            "BATCH-VERIFIER",
            "Batch Verifier",
            "Test Organization",
            Arrays.asList("Cert-A"),
            Arrays.asList("Healthcare")
        );
        verificationService.registerVerifier(verifier).await().indefinitely();

        // Request verification for each
        for (HMSIntegrationService.TokenizationResult result : batchResult.getResults()) {
            VerificationService.VerificationResult verificationRequest =
                hmsService.requestVerification(
                    result.getAssetId(),
                    "BATCH-REQUESTER",
                    VerificationTier.TIER_1
                ).await().indefinitely();

            String verificationId = verificationRequest.getVerificationId();

            // Approve
            VerificationService.VoteResult voteResult =
                verificationService.submitVote(
                    verificationId,
                    "BATCH-VERIFIER",
                    true,
                    "Batch approved"
                ).await().indefinitely();

            assertTrue(voteResult.isSuccess());
            assertTrue(voteResult.isConsensusReached());
        }
    }

    /**
     * Test compliance validation workflow
     */
    @Test
    public void testComplianceValidationWorkflow() {
        // Create record
        MedicalRecord compliantRecord = createCompliantMedicalRecord("MR-COMP-WORKFLOW-001");

        // Validate compliance before tokenization
        ComplianceService.ComplianceValidationResult validationResult =
            complianceService.validateCompliance(compliantRecord);

        assertTrue(validationResult.isValid());

        // Tokenize
        HMSIntegrationService.TokenizationResult tokenResult =
            hmsService.tokenizeAsset(compliantRecord).await().indefinitely();

        assertTrue(tokenResult.isSuccess());

        // Perform audit
        ComplianceService.ComplianceAuditReport auditReport =
            complianceService.performAudit(compliantRecord);

        assertTrue(auditReport.isPassed());
        assertNotNull(auditReport.getAuditTimestamp());
    }

    /**
     * Test failed verification workflow
     */
    @Test
    public void testFailedVerificationWorkflow() {
        // Create and tokenize asset
        MedicalRecord medicalRecord = createCompliantMedicalRecord("MR-FAIL-001");
        HMSIntegrationService.TokenizationResult tokenResult =
            hmsService.tokenizeAsset(medicalRecord).await().indefinitely();

        assertTrue(tokenResult.isSuccess());
        String assetId = tokenResult.getAssetId();

        // Register verifiers
        for (int i = 1; i <= 3; i++) {
            VerificationService.VerifierInfo verifier = new VerificationService.VerifierInfo(
                "FAIL-VERIFIER-" + i,
                "Fail Verifier " + i,
                "Test Organization",
                Arrays.asList("Cert-A"),
                Arrays.asList("Healthcare")
            );
            verificationService.registerVerifier(verifier).await().indefinitely();
        }

        // Request verification
        VerificationService.VerificationResult verificationRequest =
            hmsService.requestVerification(assetId, "FAIL-REQUESTER", VerificationTier.TIER_3)
                .await().indefinitely();

        String verificationId = verificationRequest.getVerificationId();

        // All verifiers reject
        for (int i = 1; i <= 3; i++) {
            verificationService.submitVote(
                verificationId,
                "FAIL-VERIFIER-" + i,
                false,
                "Rejected due to concerns"
            ).await().indefinitely();
        }

        // Check status - should be rejected
        VerificationStatus status = verificationService.getVerificationStatus(assetId);
        assertEquals(VerificationStatus.REJECTED, status);

        // Try to transfer - should fail due to failed verification
        HMSIntegrationService.TransferResult transferResult =
            hmsService.transferAsset(
                assetId,
                "OWNER-FAIL",
                "NEW-OWNER",
                "AUTH-SIGNATURE"
            ).await().indefinitely();

        assertFalse(transferResult.isSuccess());
        assertNotNull(transferResult.getErrorMessage());
    }

    /**
     * Test high-value asset with Tier 4 verification (5 verifiers)
     */
    @Test
    public void testHighValueAssetWorkflow() {
        // Create high-value asset
        MedicalRecord highValueRecord = createCompliantMedicalRecord("MR-HIGHVALUE-001");
        HMSIntegrationService.TokenizationResult tokenResult =
            hmsService.tokenizeAsset(highValueRecord).await().indefinitely();

        assertTrue(tokenResult.isSuccess());
        String assetId = tokenResult.getAssetId();

        // Register 5 verifiers for Tier 4
        for (int i = 1; i <= 5; i++) {
            VerificationService.VerifierInfo verifier = new VerificationService.VerifierInfo(
                "HIGHVALUE-VERIFIER-" + i,
                "High Value Verifier " + i,
                "Elite Organization",
                Arrays.asList("Cert-A", "Cert-B", "Cert-C"),
                Arrays.asList("Healthcare", "Compliance", "Security")
            );
            verificationService.registerVerifier(verifier).await().indefinitely();
        }

        // Request Tier 4 verification
        VerificationService.VerificationResult verificationRequest =
            hmsService.requestVerification(assetId, "HIGHVALUE-REQUESTER", VerificationTier.TIER_4)
                .await().indefinitely();

        assertEquals(5, verificationRequest.getRequiredVerifiers());
        String verificationId = verificationRequest.getVerificationId();

        // 4 approve, 1 rejects (80% approval > 51% threshold)
        for (int i = 1; i <= 4; i++) {
            verificationService.submitVote(
                verificationId,
                "HIGHVALUE-VERIFIER-" + i,
                true,
                "Approved"
            ).await().indefinitely();
        }

        VerificationService.VoteResult lastVote =
            verificationService.submitVote(
                verificationId,
                "HIGHVALUE-VERIFIER-5",
                false,
                "Minor concerns"
            ).await().indefinitely();

        assertTrue(lastVote.isConsensusReached());
        assertTrue(lastVote.isApproved()); // 80% > 51%

        // Verification details
        VerificationService.VerificationDetails details =
            verificationService.getVerificationDetails(verificationId).await().indefinitely();

        assertEquals(5, details.getReceivedVotes());
        assertTrue(details.isConsensusReached());
        assertEquals(0.8, details.getApprovalRate(), 0.01);
    }

    /**
     * Test statistics aggregation
     */
    @Test
    public void testStatisticsAggregation() {
        // Create and tokenize multiple assets
        for (int i = 0; i < 5; i++) {
            MedicalRecord record = createCompliantMedicalRecord("MR-STATS-" + i);
            hmsService.tokenizeAsset(record).await().indefinitely();
        }

        // Get statistics
        HMSIntegrationService.HMSStatistics stats =
            hmsService.getStatistics().await().indefinitely();

        assertTrue(stats.getTotalAssets() >= 5);
        assertTrue(stats.getTotalTokenizations() >= 5);
        assertNotNull(stats.getAssetsByType());
        assertNotNull(stats.getVerificationStatistics());
    }

    // Helper methods
    private MedicalRecord createCompliantMedicalRecord(String assetId) {
        MedicalRecord record = new MedicalRecord(assetId, "PATIENT-" + assetId, "PROVIDER-" + assetId);
        record.setOwner("OWNER-" + assetId);
        record.setEncrypted(true);
        record.setEncryptionKeyId("ENC-KEY-" + assetId);
        record.setDiagnosis("Test Diagnosis");

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-" + assetId);
        info.setConsentTimestamp(Instant.now());
        info.setJurisdiction("US");
        record.setComplianceInfo(info);

        record.addMetadata("access_controls", "role-based");
        record.addMetadata("audit_trail", "enabled");
        record.addMetadata("lawful_basis", "consent");

        return record;
    }

    private Prescription createCompliantPrescription(String assetId) {
        Prescription prescription = new Prescription(assetId, "PATIENT-" + assetId, "PRESCRIBER-" + assetId);
        prescription.setOwner("OWNER-" + assetId);
        prescription.setEncrypted(true);
        prescription.setEncryptionKeyId("ENC-KEY-" + assetId);

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-" + assetId);
        info.setConsentTimestamp(Instant.now());
        info.setJurisdiction("US");
        prescription.setComplianceInfo(info);

        prescription.addMetadata("access_controls", "role-based");
        prescription.addMetadata("audit_trail", "enabled");
        prescription.addMetadata("lawful_basis", "consent");

        return prescription;
    }

    private DiagnosticReport createCompliantDiagnosticReport(String assetId) {
        DiagnosticReport report = new DiagnosticReport(
            assetId,
            "PATIENT-" + assetId,
            "PROVIDER-" + assetId,
            "X-Ray"
        );
        report.setOwner("OWNER-" + assetId);
        report.setEncrypted(true);
        report.setEncryptionKeyId("ENC-KEY-" + assetId);
        report.setFindings("Test Findings");

        ComplianceInfo info = new ComplianceInfo();
        info.setHipaaCompliant(true);
        info.setGdprCompliant(true);
        info.setConsentSignature("CONSENT-" + assetId);
        info.setConsentTimestamp(Instant.now());
        info.setJurisdiction("US");
        report.setComplianceInfo(info);

        report.addMetadata("access_controls", "role-based");
        report.addMetadata("audit_trail", "enabled");
        report.addMetadata("lawful_basis", "consent");

        return report;
    }
}
