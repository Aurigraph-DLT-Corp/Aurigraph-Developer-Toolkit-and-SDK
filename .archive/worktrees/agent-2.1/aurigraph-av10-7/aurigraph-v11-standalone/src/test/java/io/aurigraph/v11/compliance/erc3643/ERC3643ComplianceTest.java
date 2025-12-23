package io.aurigraph.v11.compliance.erc3643;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ERC-3643 compliance framework
 * Tests Identity Registry, Transfer Manager, and Compliance Registry
 *
 * Coverage: >80% of compliance components
 */
@DisplayName("ERC-3643 Compliance Framework Tests")
public class ERC3643ComplianceTest {

    private IdentityRegistry identityRegistry;
    private TransferManager transferManager;
    private ComplianceRegistry complianceRegistry;

    private String testAddress;
    private String testAddress2;
    private String testTokenId;

    @BeforeEach
    void setUp() {
        identityRegistry = new IdentityRegistry();
        transferManager = new TransferManager();
        transferManager.identityRegistry = identityRegistry;
        complianceRegistry = new ComplianceRegistry();

        testAddress = "0x1234567890abcdef1234567890abcdef12345678";
        testAddress2 = "0xabcdef1234567890abcdef1234567890abcdef12";
        testTokenId = "TOKEN-" + UUID.randomUUID();
    }

    // ===== Identity Registry Tests =====

    @Test
    @DisplayName("Should register valid identity")
    void testRegisterIdentity() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "US", "DOC-HASH-123", "KYC-Provider"
        );

        IdentityRegistry.IdentityRecord record = identityRegistry.registerIdentity(
            testAddress, verification
        );

        assertNotNull(record);
        assertEquals(testAddress, record.getAddress());
        assertEquals("ENHANCED", record.getKycLevel());
        assertEquals("US", record.getCountry());
    }

    @Test
    @DisplayName("Should reject null address registration")
    void testRegisterNullAddress() {
        IdentityVerification verification = new IdentityVerification(
            null, "ENHANCED", "US", "DOC-HASH", "Provider"
        );

        assertThrows(IllegalArgumentException.class, () ->
            identityRegistry.registerIdentity(null, verification)
        );
    }

    @Test
    @DisplayName("Should validate KYC verified identity")
    void testValidIdentity() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "CERTIFIED", "US", "DOC-HASH", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, verification);

        assertTrue(identityRegistry.isValidIdentity(testAddress));
    }

    @Test
    @DisplayName("Should reject unregistered address")
    void testUnregisteredIdentity() {
        assertFalse(identityRegistry.isValidIdentity("0xunknown"));
    }

    @Test
    @DisplayName("Should revoke identity")
    void testRevokeIdentity() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "US", "DOC-HASH", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, verification);

        assertTrue(identityRegistry.isValidIdentity(testAddress));
        assertTrue(identityRegistry.revokeIdentity(testAddress, "Fraud"));
        assertFalse(identityRegistry.isValidIdentity(testAddress));
    }

    @Test
    @DisplayName("Should restore revoked identity")
    void testRestoreIdentity() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "US", "DOC-HASH", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, verification);
        identityRegistry.revokeIdentity(testAddress, "Test");

        assertTrue(identityRegistry.restoreIdentity(testAddress));
        assertTrue(identityRegistry.isValidIdentity(testAddress));
    }

    @Test
    @DisplayName("Should restrict country")
    void testCountryRestriction() {
        assertFalse(identityRegistry.isCountryRestricted("KP"));
        identityRegistry.restrictCountry("KP");
        assertTrue(identityRegistry.isCountryRestricted("KP"));
    }

    @Test
    @DisplayName("Should reject identity from restricted country")
    void testRestrictedCountryIdentity() {
        identityRegistry.restrictCountry("RU");

        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "RU", "DOC-HASH", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, verification);

        assertFalse(identityRegistry.isValidIdentity(testAddress));
    }

    @Test
    @DisplayName("Should handle expired identity")
    void testExpiredIdentity() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "US", "DOC-HASH", "Provider"
        );
        verification.setDocumentExpiryDate(Instant.now().minusSeconds(86400)); // Yesterday

        identityRegistry.registerIdentity(testAddress, verification);
        assertFalse(identityRegistry.isValidIdentity(testAddress));
    }

    @Test
    @DisplayName("Should batch register identities")
    void testBatchRegisterIdentities() {
        List<String> addresses = List.of(testAddress, testAddress2);
        List<IdentityVerification> verifications = List.of(
            new IdentityVerification(testAddress, "ENHANCED", "US", "HASH1", "Provider"),
            new IdentityVerification(testAddress2, "CERTIFIED", "UK", "HASH2", "Provider")
        );

        var results = identityRegistry.batchRegisterIdentities(addresses, verifications);

        assertEquals(2, results.size());
        assertTrue(identityRegistry.isValidIdentity(testAddress));
        assertTrue(identityRegistry.isValidIdentity(testAddress2));
    }

    @Test
    @DisplayName("Should get registry statistics")
    void testGetRegistryStats() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "US", "DOC-HASH", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, verification);

        var stats = identityRegistry.getStats();
        assertTrue(stats.getTotalRegistered() >= 1);
        assertTrue(stats.getActiveIdentities() >= 1);
    }

    // ===== Transfer Manager Tests =====

    @Test
    @DisplayName("Should allow transfer between verified identities")
    void testAllowTransferBetweenVerified() {
        // Register both parties
        IdentityVerification from = new IdentityVerification(
            testAddress, "ENHANCED", "US", "HASH1", "Provider"
        );
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, from);
        identityRegistry.registerIdentity(testAddress2, to);

        TransferManager.TransferResult result = transferManager.canTransfer(
            testTokenId, testAddress, testAddress2, new BigDecimal("100")
        );

        assertTrue(result.isAllowed());
    }

    @Test
    @DisplayName("Should reject transfer from unverified sender")
    void testRejectUnverifiedSender() {
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress2, to);

        TransferManager.TransferResult result = transferManager.canTransfer(
            testTokenId, "0xunverified", testAddress2, new BigDecimal("100")
        );

        assertFalse(result.isAllowed());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.contains("Sender not KYC verified")));
    }

    @Test
    @DisplayName("Should enforce minimum transfer amount")
    void testMinimumTransferAmount() {
        IdentityVerification from = new IdentityVerification(
            testAddress, "ENHANCED", "US", "HASH1", "Provider"
        );
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, from);
        identityRegistry.registerIdentity(testAddress2, to);

        TransferManager.TransferRules rules = new TransferManager.TransferRules(testTokenId);
        rules.setMinimumTransferAmount(new BigDecimal("1000"));
        transferManager.setTransferRules(testTokenId, rules);

        TransferManager.TransferResult result = transferManager.canTransfer(
            testTokenId, testAddress, testAddress2, new BigDecimal("100")
        );

        assertFalse(result.isAllowed());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.contains("below minimum")));
    }

    @Test
    @DisplayName("Should enforce maximum transfer amount")
    void testMaximumTransferAmount() {
        IdentityVerification from = new IdentityVerification(
            testAddress, "ENHANCED", "US", "HASH1", "Provider"
        );
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, from);
        identityRegistry.registerIdentity(testAddress2, to);

        TransferManager.TransferRules rules = new TransferManager.TransferRules(testTokenId);
        rules.setMaximumTransferAmount(new BigDecimal("50"));
        transferManager.setTransferRules(testTokenId, rules);

        TransferManager.TransferResult result = transferManager.canTransfer(
            testTokenId, testAddress, testAddress2, new BigDecimal("100")
        );

        assertFalse(result.isAllowed());
    }

    @Test
    @DisplayName("Should enforce whitelist requirement")
    void testWhitelistRequirement() {
        IdentityVerification from = new IdentityVerification(
            testAddress, "ENHANCED", "US", "HASH1", "Provider"
        );
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, from);
        identityRegistry.registerIdentity(testAddress2, to);

        TransferManager.TransferRules rules = new TransferManager.TransferRules(testTokenId);
        rules.setWhitelistRequired(true);
        rules.addToWhitelist(testAddress);
        rules.addToWhitelist(testAddress2);
        transferManager.setTransferRules(testTokenId, rules);

        TransferManager.TransferResult result = transferManager.canTransfer(
            testTokenId, testAddress, testAddress2, new BigDecimal("100")
        );

        assertTrue(result.isAllowed());
    }

    @Test
    @DisplayName("Should reject transfer from locked token")
    void testLockedToken() {
        IdentityVerification from = new IdentityVerification(
            testAddress, "ENHANCED", "US", "HASH1", "Provider"
        );
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, from);
        identityRegistry.registerIdentity(testAddress2, to);

        transferManager.lockToken(testTokenId);

        TransferManager.TransferResult result = transferManager.canTransfer(
            testTokenId, testAddress, testAddress2, new BigDecimal("100")
        );

        assertFalse(result.isAllowed());
    }

    @Test
    @DisplayName("Should get transfer statistics")
    void testTransferStats() {
        IdentityVerification from = new IdentityVerification(
            testAddress, "ENHANCED", "US", "HASH1", "Provider"
        );
        IdentityVerification to = new IdentityVerification(
            testAddress2, "ENHANCED", "US", "HASH2", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, from);
        identityRegistry.registerIdentity(testAddress2, to);

        transferManager.canTransfer(testTokenId, testAddress, testAddress2, new BigDecimal("100"));

        TransferManager.TransferStats stats = transferManager.getStats();
        assertTrue(stats.getTotalTransfers() > 0);
        assertTrue(stats.getApprovalRate() >= 0);
    }

    // ===== Compliance Registry Tests =====

    @Test
    @DisplayName("Should register compliance record")
    void testRegisterComplianceRecord() {
        ComplianceRegistry.ComplianceRecord record = new ComplianceRegistry.ComplianceRecord(
            testTokenId, "US"
        );
        record.addRule("SEC_REGULATION_D");

        ComplianceRegistry.ComplianceRecord registered =
            complianceRegistry.registerCompliance(testTokenId, record);

        assertNotNull(registered);
        assertEquals(testTokenId, registered.getTokenId());
        assertEquals("US", registered.getJurisdiction());
    }

    @Test
    @DisplayName("Should add certification to compliance record")
    void testAddCertification() {
        ComplianceRegistry.ComplianceRecord record = new ComplianceRegistry.ComplianceRecord(
            testTokenId, "US"
        );
        complianceRegistry.registerCompliance(testTokenId, record);

        ComplianceRegistry.Certification cert = new ComplianceRegistry.Certification(
            "ISO-27001",
            "BSI",
            Instant.now(),
            Instant.now().plusSeconds(31536000),
            "CERT-HASH"
        );
        complianceRegistry.addCertification(testTokenId, cert);

        ComplianceRegistry.ComplianceRecord retrieved = complianceRegistry.getCompliance(testTokenId);
        assertEquals(1, retrieved.getCertifications().size());
    }

    @Test
    @DisplayName("Should detect expired certification")
    void testExpiredCertification() {
        ComplianceRegistry.ComplianceRecord record = new ComplianceRegistry.ComplianceRecord(
            testTokenId, "US"
        );
        complianceRegistry.registerCompliance(testTokenId, record);

        ComplianceRegistry.Certification expiredCert = new ComplianceRegistry.Certification(
            "ISO-27001",
            "BSI",
            Instant.now().minusSeconds(31536000),
            Instant.now().minusSeconds(86400), // Expired
            "CERT-HASH"
        );
        complianceRegistry.addCertification(testTokenId, expiredCert);

        assertTrue(expiredCert.isExpired());
    }

    @Test
    @DisplayName("Should get compliance statistics")
    void testComplianceStats() {
        ComplianceRegistry.ComplianceRecord record = new ComplianceRegistry.ComplianceRecord(
            testTokenId, "US"
        );
        complianceRegistry.registerCompliance(testTokenId, record);

        var stats = complianceRegistry.getStats();
        assertTrue(stats.getTotalRecords() >= 1);
    }

    @Test
    @DisplayName("Should register compliance module")
    void testRegisterComplianceModule() {
        ComplianceRegistry.ComplianceModule module = new ComplianceRegistry.ComplianceModule() {
            @Override
            public String getName() { return "TEST-MODULE"; }

            @Override
            public boolean validate(ComplianceRegistry.ComplianceRecord record) { return true; }

            @Override
            public String getLastError() { return null; }
        };

        complianceRegistry.registerModule("test-module", module);
        assertEquals(1, complianceRegistry.getModules().size());
    }

    @ParameterizedTest
    @ValueSource(strings = {"SEC_REGULATION_D", "REGULATION_S", "ACCREDITED_INVESTOR"})
    @DisplayName("Should support multiple regulatory rules")
    void testMultipleRules(String rule) {
        ComplianceRegistry.ComplianceRecord record = new ComplianceRegistry.ComplianceRecord(
            testTokenId, "US"
        );
        record.addRule(rule);

        assertTrue(record.hasRule(rule));
    }

    @Test
    @DisplayName("Should clear identity registry for testing")
    void testClearRegistry() {
        IdentityVerification verification = new IdentityVerification(
            testAddress, "ENHANCED", "US", "DOC-HASH", "Provider"
        );
        identityRegistry.registerIdentity(testAddress, verification);

        assertTrue(identityRegistry.isValidIdentity(testAddress));
        identityRegistry.clear();
        assertFalse(identityRegistry.isValidIdentity(testAddress));
    }
}
