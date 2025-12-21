package io.aurigraph.v11.compliance.mica;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for MiCA Compliance Module
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MiCAComplianceModuleTest {

    @Inject
    MiCAComplianceModule complianceModule;

    @Inject
    MiCAAssetClassification assetClassification;

    private static final String TEST_TOKEN_ID = "TEST-TOKEN-001";

    @Test
    @Order(1)
    @DisplayName("Test E-Money Token Classification")
    void testEMoneyTokenClassification() {
        MiCAComplianceModule.IssuerInfo issuerInfo = createEMoneyIssuerInfo();

        var assetClass = assetClassification.classifyAsset(TEST_TOKEN_ID + "-EMT", issuerInfo);

        assertEquals(MiCAAssetClassification.AssetClass.E_MONEY_TOKEN, assetClass);
    }

    @Test
    @Order(2)
    @DisplayName("Test Asset-Referenced Token Classification")
    void testAssetReferencedTokenClassification() {
        MiCAComplianceModule.IssuerInfo issuerInfo = createARTIssuerInfo();

        var assetClass = assetClassification.classifyAsset(TEST_TOKEN_ID + "-ART", issuerInfo);

        assertEquals(MiCAAssetClassification.AssetClass.ASSET_REFERENCED_TOKEN, assetClass);
    }

    @Test
    @Order(3)
    @DisplayName("Test Utility Token Classification")
    void testUtilityTokenClassification() {
        MiCAComplianceModule.IssuerInfo issuerInfo = createUtilityIssuerInfo();

        var assetClass = assetClassification.classifyAsset(TEST_TOKEN_ID + "-UT", issuerInfo);

        assertEquals(MiCAAssetClassification.AssetClass.UTILITY_TOKEN, assetClass);
    }

    @Test
    @Order(4)
    @DisplayName("Test Compliance Check - Compliant Token")
    void testComplianceCheckCompliant() {
        String tokenId = "COMPLIANT-TOKEN-001";
        MiCAComplianceModule.IssuerInfo issuerInfo = createCompliantIssuerInfo();

        // Register whitepaper
        MiCAComplianceModule.WhitepaperRecord whitepaper = createCompleteWhitepaper();
        complianceModule.registerWhitepaper(tokenId, whitepaper);

        // Register reserve
        MiCAComplianceModule.ReserveRecord reserve = createCompliantReserve();
        complianceModule.registerReserve(tokenId, reserve);

        // Perform compliance check
        var result = complianceModule.performComplianceCheck(tokenId, issuerInfo);

        assertNotNull(result);
        assertEquals(tokenId, result.getTokenId());
        assertNotNull(result.getAssetClass());
        assertNotNull(result.getCheckTimestamp());
    }

    @Test
    @Order(5)
    @DisplayName("Test Whitepaper Compliance Check - Missing Fields")
    void testWhitepaperComplianceMissingFields() {
        String tokenId = "INCOMPLETE-WP-TOKEN";

        // Register incomplete whitepaper
        MiCAComplianceModule.WhitepaperRecord whitepaper = new MiCAComplianceModule.WhitepaperRecord();
        whitepaper.setPublicationDate(LocalDate.now());
        whitepaper.setHasIssuerInfo(true);
        // Missing other required fields
        complianceModule.registerWhitepaper(tokenId, whitepaper);

        var result = complianceModule.checkWhitepaperCompliance(
            tokenId, MiCAAssetClassification.AssetClass.UTILITY_TOKEN);

        assertFalse(result.isCompliant());
        assertFalse(result.getViolations().isEmpty());
    }

    @Test
    @Order(6)
    @DisplayName("Test Reserve Compliance Check - Below Threshold")
    void testReserveComplianceBelowThreshold() {
        String tokenId = "LOW-RESERVE-TOKEN";

        MiCAComplianceModule.ReserveRecord reserve = new MiCAComplianceModule.ReserveRecord();
        reserve.setReserveRatio(BigDecimal.valueOf(95)); // Below 100%
        reserve.setCirculatingValue(BigDecimal.valueOf(1000000));
        reserve.setHasQualifiedAssets(true);
        reserve.setHasCustodialArrangement(true);
        reserve.setIsSegregated(true);
        reserve.setHasQuarterlyDisclosure(true);
        complianceModule.registerReserve(tokenId, reserve);

        var result = complianceModule.checkReserveCompliance(
            tokenId, MiCAAssetClassification.AssetClass.ASSET_REFERENCED_TOKEN);

        assertFalse(result.isCompliant());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.contains("Reserve ratio")));
    }

    @Test
    @Order(7)
    @DisplayName("Test Governance Requirements Check")
    void testGovernanceRequirementsCheck() {
        MiCAComplianceModule.IssuerInfo issuerInfo = new MiCAComplianceModule.IssuerInfo();
        issuerInfo.setManagementBodySize(2); // Below minimum of 3
        issuerInfo.setHasGoodReputeRequirements(true);
        issuerInfo.setHasKnowledgeAndExperience(true);

        var result = complianceModule.checkGovernanceRequirements(issuerInfo);

        assertFalse(result.isCompliant());
        assertTrue(result.getViolations().stream()
            .anyMatch(v -> v.contains("Management body")));
    }

    @Test
    @Order(8)
    @DisplayName("Test Capital Requirements Check - EMT")
    void testCapitalRequirementsEMT() {
        MiCAComplianceModule.IssuerInfo issuerInfo = new MiCAComplianceModule.IssuerInfo();
        issuerInfo.setOwnFunds(BigDecimal.valueOf(500000)); // Above minimum
        issuerInfo.setHasQualifyingCapital(true);
        issuerInfo.setHasProfessionalLiabilityInsurance(true);
        issuerInfo.setAverageReserveValue(BigDecimal.valueOf(10000000));

        var result = complianceModule.checkCapitalRequirements(
            issuerInfo, MiCAAssetClassification.AssetClass.E_MONEY_TOKEN);

        assertTrue(result.isCompliant());
        assertNotNull(result.getRequiredCapital());
        assertNotNull(result.getActualCapital());
    }

    @Test
    @Order(9)
    @DisplayName("Test Compliance Statistics")
    void testComplianceStatistics() {
        var stats = complianceModule.getStats();

        assertNotNull(stats);
        assertTrue(stats.getTotalTokens() >= 0);
        assertTrue(stats.getComplianceRate() >= 0 && stats.getComplianceRate() <= 100);
    }

    @Test
    @Order(10)
    @DisplayName("Test Audit Trail")
    void testAuditTrail() {
        var auditTrail = complianceModule.getAuditTrail();

        assertNotNull(auditTrail);
        // Should have entries from previous tests
        assertTrue(auditTrail.size() > 0);

        var firstEntry = auditTrail.get(0);
        assertNotNull(firstEntry.getEventType());
        assertNotNull(firstEntry.getTimestamp());
    }

    @Test
    @Order(11)
    @DisplayName("Test Classification Requirements Retrieval")
    void testClassificationRequirements() {
        var emtReq = assetClassification.getRequirements(
            MiCAAssetClassification.AssetClass.E_MONEY_TOKEN);

        assertNotNull(emtReq);
        assertTrue(emtReq.isAuthorizationRequired());
        assertTrue(emtReq.isWhitepaperRequired());
        assertTrue(emtReq.isReserveRequired());
        assertFalse(emtReq.getRequirements().isEmpty());
    }

    // ============ Helper Methods ============

    private MiCAComplianceModule.IssuerInfo createEMoneyIssuerInfo() {
        MiCAComplianceModule.IssuerInfo info = new MiCAComplianceModule.IssuerInfo();
        info.setIssuerId("ISSUER-001");
        info.setIssuerName("Test EMT Issuer");
        info.setFiatCurrencyReferenced(true);
        info.setReferencedFiatCurrency("EUR");
        info.setHasReferencedAssets(false);
        info.setEMoneyInstitution(true);
        info.setTokenType("E_MONEY");
        return info;
    }

    private MiCAComplianceModule.IssuerInfo createARTIssuerInfo() {
        MiCAComplianceModule.IssuerInfo info = new MiCAComplianceModule.IssuerInfo();
        info.setIssuerId("ISSUER-002");
        info.setIssuerName("Test ART Issuer");
        info.setFiatCurrencyReferenced(false);
        info.setHasReferencedAssets(true);
        info.setTokenType("STABLECOIN");
        return info;
    }

    private MiCAComplianceModule.IssuerInfo createUtilityIssuerInfo() {
        MiCAComplianceModule.IssuerInfo info = new MiCAComplianceModule.IssuerInfo();
        info.setIssuerId("ISSUER-003");
        info.setIssuerName("Test Utility Issuer");
        info.setFiatCurrencyReferenced(false);
        info.setHasReferencedAssets(false);
        info.setTokenType("UTILITY");
        return info;
    }

    private MiCAComplianceModule.IssuerInfo createCompliantIssuerInfo() {
        MiCAComplianceModule.IssuerInfo info = new MiCAComplianceModule.IssuerInfo();
        info.setIssuerId("COMPLIANT-ISSUER-001");
        info.setIssuerName("Compliant Test Issuer");
        info.setAuthorized(true);
        info.setAuthorizationNumber("AUTH-2024-001");
        info.setAuthorizedDate(LocalDate.now().minusMonths(6));
        info.setHasEURegisteredOffice(true);
        info.setHasBusinessContinuityPlan(true);
        info.setHasInternalControls(true);
        info.setHasInformationSecurity(true);
        info.setHasComplaintHandling(true);
        info.setHasConflictOfInterestPolicy(true);
        info.setManagementBodySize(5);
        info.setHasGoodReputeRequirements(true);
        info.setHasKnowledgeAndExperience(true);
        info.setHasDiversityPolicy(true);
        info.setHasAuditCommittee(true);
        info.setHasRiskManagementFunction(true);
        info.setHasComplianceFunction(true);
        info.setOwnFunds(BigDecimal.valueOf(500000));
        info.setAverageReserveValue(BigDecimal.valueOf(10000000));
        info.setHasQualifyingCapital(true);
        info.setHasProfessionalLiabilityInsurance(true);
        info.setTokenType("UTILITY");
        return info;
    }

    private MiCAComplianceModule.WhitepaperRecord createCompleteWhitepaper() {
        MiCAComplianceModule.WhitepaperRecord wp = new MiCAComplianceModule.WhitepaperRecord();
        wp.setPublicationDate(LocalDate.now().minusDays(30));
        wp.setHasIssuerInfo(true);
        wp.setHasProjectDescription(true);
        wp.setHasRightsAndObligations(true);
        wp.setHasTechnologyDescription(true);
        wp.setHasRiskDisclosure(true);
        wp.setHasOfferInfo(true);
        wp.setHasReserveAssetComposition(true);
        wp.setHasCustodyArrangements(true);
        wp.setHasEMoneyAuthorization(true);
        wp.setHasRedemptionConditions(true);
        return wp;
    }

    private MiCAComplianceModule.ReserveRecord createCompliantReserve() {
        MiCAComplianceModule.ReserveRecord reserve = new MiCAComplianceModule.ReserveRecord();
        reserve.setReserveRatio(BigDecimal.valueOf(105)); // Above 100%
        reserve.setCirculatingValue(BigDecimal.valueOf(10000000));
        reserve.setLastAuditDate(LocalDate.now().minusDays(30));
        reserve.setHasQualifiedAssets(true);
        reserve.setHasCustodialArrangement(true);
        reserve.setIsSegregated(true);
        reserve.setHasQuarterlyDisclosure(true);
        reserve.setHasEnhancedLiquidity(true);
        reserve.setHasRecoveryPlan(true);
        return reserve;
    }
}
