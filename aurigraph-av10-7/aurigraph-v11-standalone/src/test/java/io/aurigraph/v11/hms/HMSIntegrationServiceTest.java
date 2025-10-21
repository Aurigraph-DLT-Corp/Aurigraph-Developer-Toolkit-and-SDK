package io.aurigraph.v11.hms;

import io.aurigraph.v11.hms.models.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HMSIntegrationService
 */
@QuarkusTest
public class HMSIntegrationServiceTest {

    @Inject
    HMSIntegrationService hmsService;

    @Inject
    ComplianceService complianceService;

    private MedicalRecord testMedicalRecord;
    private Prescription testPrescription;
    private DiagnosticReport testDiagnosticReport;

    @BeforeEach
    public void setup() {
        // Create test medical record
        testMedicalRecord = new MedicalRecord("MR-TEST-001", "PATIENT-001", "PROVIDER-001");
        testMedicalRecord.setDiagnosis("Test Diagnosis");
        testMedicalRecord.setOwner("OWNER-001");
        testMedicalRecord.setEncrypted(true);
        testMedicalRecord.setEncryptionKeyId("ENC-KEY-TEST-001");

        ComplianceInfo complianceInfo = new ComplianceInfo();
        complianceInfo.setHipaaCompliant(true);
        complianceInfo.setGdprCompliant(true);
        complianceInfo.setConsentSignature("TEST-SIGNATURE-001");
        complianceInfo.setConsentTimestamp(Instant.now());
        complianceInfo.setJurisdiction("US");
        testMedicalRecord.setComplianceInfo(complianceInfo);
        testMedicalRecord.addMetadata("access_controls", "role-based");
        testMedicalRecord.addMetadata("audit_trail", "enabled");

        // Create test prescription
        testPrescription = new Prescription("RX-TEST-001", "PATIENT-002", "PRESCRIBER-001");
        testPrescription.setOwner("OWNER-002");
        testPrescription.setEncrypted(true);
        testPrescription.setEncryptionKeyId("ENC-KEY-TEST-002");
        testPrescription.setComplianceInfo(complianceInfo);
        testPrescription.addMetadata("access_controls", "role-based");
        testPrescription.addMetadata("audit_trail", "enabled");

        // Create test diagnostic report
        testDiagnosticReport = new DiagnosticReport("DR-TEST-001", "PATIENT-003", "PROVIDER-002", "X-Ray");
        testDiagnosticReport.setOwner("OWNER-003");
        testDiagnosticReport.setEncrypted(true);
        testDiagnosticReport.setEncryptionKeyId("ENC-KEY-TEST-003");
        testDiagnosticReport.setComplianceInfo(complianceInfo);
        testDiagnosticReport.addMetadata("access_controls", "role-based");
        testDiagnosticReport.addMetadata("audit_trail", "enabled");
    }

    @Test
    public void testTokenizeMedicalRecord() {
        HMSIntegrationService.TokenizationResult result =
            hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getTokenId());
        assertEquals("MR-TEST-001", result.getAssetId());
        assertNotNull(result.getTransactionHash());
        assertTrue(result.getBlockNumber() > 0);
    }

    @Test
    public void testTokenizePrescription() {
        HMSIntegrationService.TokenizationResult result =
            hmsService.tokenizeAsset(testPrescription).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getTokenId());
        assertEquals("RX-TEST-001", result.getAssetId());
    }

    @Test
    public void testTokenizeDiagnosticReport() {
        HMSIntegrationService.TokenizationResult result =
            hmsService.tokenizeAsset(testDiagnosticReport).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getTokenId());
        assertEquals("DR-TEST-001", result.getAssetId());
    }

    @Test
    public void testTokenizeAssetWithoutCompliance() {
        MedicalRecord invalidRecord = new MedicalRecord("MR-INVALID-001", "PATIENT-004", "PROVIDER-003");
        invalidRecord.setOwner("OWNER-004");
        // No compliance info set - should fail

        HMSIntegrationService.TokenizationResult result =
            hmsService.tokenizeAsset(invalidRecord).await().indefinitely();

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    public void testBatchTokenization() {
        List<HealthcareAsset> assets = new ArrayList<>();
        assets.add(testMedicalRecord);
        assets.add(testPrescription);
        assets.add(testDiagnosticReport);

        HMSIntegrationService.BatchTokenizationResult result =
            hmsService.batchTokenizeAssets(assets).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals(3, result.getTotalRequested());
        assertEquals(3, result.getTotalSucceeded());
        assertEquals(0, result.getTotalFailed());
        assertTrue(result.getProcessingTimeMs() > 0);
    }

    @Test
    public void testGetAsset() {
        // First tokenize
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        // Then retrieve
        Optional<HealthcareAsset> result =
            hmsService.getAsset("MR-TEST-001").await().indefinitely();

        assertTrue(result.isPresent());
        assertEquals("MR-TEST-001", result.get().getAssetId());
        assertEquals(AssetType.MEDICAL_RECORD, result.get().getAssetType());
    }

    @Test
    public void testGetNonExistentAsset() {
        Optional<HealthcareAsset> result =
            hmsService.getAsset("NONEXISTENT").await().indefinitely();

        assertFalse(result.isPresent());
    }

    @Test
    public void testGetAssetStatus() {
        // First tokenize
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        // Get status
        HMSIntegrationService.AssetStatusInfo status =
            hmsService.getAssetStatus("MR-TEST-001").await().indefinitely();

        assertNotNull(status);
        assertEquals("MR-TEST-001", status.getAssetId());
        assertNotNull(status.getTokenId());
        assertEquals("OWNER-001", status.getCurrentOwner());
        assertNotNull(status.getState());
    }

    @Test
    public void testTransferAsset() {
        // First tokenize
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        // Transfer
        HMSIntegrationService.TransferResult result =
            hmsService.transferAsset(
                "MR-TEST-001",
                "OWNER-001",
                "OWNER-NEW",
                "AUTH-SIGNATURE-001"
            ).await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getTransferId());
        assertEquals("OWNER-NEW", result.getNewOwner());
    }

    @Test
    public void testTransferAssetInvalidOwner() {
        // First tokenize
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        // Try to transfer with wrong owner
        HMSIntegrationService.TransferResult result =
            hmsService.transferAsset(
                "MR-TEST-001",
                "WRONG-OWNER",
                "OWNER-NEW",
                "AUTH-SIGNATURE-001"
            ).await().indefinitely();

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    public void testTransferAssetMissingSignature() {
        // First tokenize
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        // Try to transfer without signature
        HMSIntegrationService.TransferResult result =
            hmsService.transferAsset(
                "MR-TEST-001",
                "OWNER-001",
                "OWNER-NEW",
                null
            ).await().indefinitely();

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    public void testGetStatistics() {
        // Tokenize some assets
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();
        hmsService.tokenizeAsset(testPrescription).await().indefinitely();
        hmsService.tokenizeAsset(testDiagnosticReport).await().indefinitely();

        HMSIntegrationService.HMSStatistics stats =
            hmsService.getStatistics().await().indefinitely();

        assertNotNull(stats);
        assertTrue(stats.getTotalAssets() >= 3);
        assertTrue(stats.getTotalTokens() >= 3);
        assertTrue(stats.getTotalTokenizations() >= 3);
        assertNotNull(stats.getAssetsByType());
    }

    @Test
    public void testEncryptionKeyGeneration() {
        MedicalRecord unencryptedRecord = new MedicalRecord("MR-UNENC-001", "PATIENT-005", "PROVIDER-004");
        unencryptedRecord.setOwner("OWNER-005");

        ComplianceInfo complianceInfo = new ComplianceInfo();
        complianceInfo.setHipaaCompliant(true);
        complianceInfo.setGdprCompliant(true);
        complianceInfo.setConsentSignature("TEST-SIGNATURE-002");
        complianceInfo.setConsentTimestamp(Instant.now());
        unencryptedRecord.setComplianceInfo(complianceInfo);
        unencryptedRecord.addMetadata("access_controls", "role-based");
        unencryptedRecord.addMetadata("audit_trail", "enabled");

        // Asset is not encrypted initially
        assertFalse(unencryptedRecord.isEncrypted());

        HMSIntegrationService.TokenizationResult result =
            hmsService.tokenizeAsset(unencryptedRecord).await().indefinitely();

        assertTrue(result.isSuccess());
        // Service should have encrypted it
        assertTrue(unencryptedRecord.isEncrypted());
        assertNotNull(unencryptedRecord.getEncryptionKeyId());
    }

    @Test
    public void testDailyTokenizationCounter() {
        HMSIntegrationService.HMSStatistics statsBefore =
            hmsService.getStatistics().await().indefinitely();

        long dailyBefore = statsBefore.getDailyTokenizations();

        // Tokenize an asset
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();

        HMSIntegrationService.HMSStatistics statsAfter =
            hmsService.getStatistics().await().indefinitely();

        long dailyAfter = statsAfter.getDailyTokenizations();

        assertTrue(dailyAfter > dailyBefore);
    }

    @Test
    public void testAssetsByTypeStatistics() {
        // Tokenize different types
        hmsService.tokenizeAsset(testMedicalRecord).await().indefinitely();
        hmsService.tokenizeAsset(testPrescription).await().indefinitely();
        hmsService.tokenizeAsset(testDiagnosticReport).await().indefinitely();

        HMSIntegrationService.HMSStatistics stats =
            hmsService.getStatistics().await().indefinitely();

        assertNotNull(stats.getAssetsByType());
        assertTrue(stats.getAssetsByType().containsKey(AssetType.MEDICAL_RECORD));
        assertTrue(stats.getAssetsByType().containsKey(AssetType.PRESCRIPTION));
        assertTrue(stats.getAssetsByType().containsKey(AssetType.DIAGNOSTIC_REPORT));
    }

    @Test
    public void testConcurrentTokenization() throws InterruptedException {
        List<Thread> threads = new ArrayList<>();
        int numThreads = 10;

        for (int i = 0; i < numThreads; i++) {
            final int index = i;
            Thread thread = new Thread(() -> {
                MedicalRecord record = new MedicalRecord(
                    "MR-CONCURRENT-" + index,
                    "PATIENT-" + index,
                    "PROVIDER-" + index
                );
                record.setOwner("OWNER-" + index);
                record.setEncrypted(true);
                record.setEncryptionKeyId("ENC-KEY-" + index);

                ComplianceInfo complianceInfo = new ComplianceInfo();
                complianceInfo.setHipaaCompliant(true);
                complianceInfo.setGdprCompliant(true);
                complianceInfo.setConsentSignature("SIGNATURE-" + index);
                complianceInfo.setConsentTimestamp(Instant.now());
                record.setComplianceInfo(complianceInfo);
                record.addMetadata("access_controls", "role-based");
                record.addMetadata("audit_trail", "enabled");

                hmsService.tokenizeAsset(record).await().indefinitely();
            });
            threads.add(thread);
            thread.start();
        }

        for (Thread thread : threads) {
            thread.join();
        }

        HMSIntegrationService.HMSStatistics stats =
            hmsService.getStatistics().await().indefinitely();

        assertTrue(stats.getTotalTokenizations() >= numThreads);
    }
}
