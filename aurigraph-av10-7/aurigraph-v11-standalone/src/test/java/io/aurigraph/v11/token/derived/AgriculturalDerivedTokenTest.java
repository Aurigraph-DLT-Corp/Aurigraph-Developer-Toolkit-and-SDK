package io.aurigraph.v11.token.derived;

import io.aurigraph.v11.token.derived.agricultural.AgriculturalDerivedToken;
import io.aurigraph.v11.token.derived.agricultural.AgriculturalDerivedToken.*;
import io.aurigraph.v11.token.derived.DerivedToken.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for AgriculturalDerivedToken
 *
 * Tests cover:
 * - All 4 agricultural token types
 * - Factory methods
 * - USDA oracle integration
 * - Validation logic
 * - Yield calculations
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AgriculturalDerivedTokenTest {

    private static final String PARENT_TOKEN_ID = "PT-COMMODITY-test-ag-001";
    private static final String OWNER = "0xfarmer123";
    private static final String FARM_ID = "FARM-IA-001";
    private static final BigDecimal FACE_VALUE = new BigDecimal("100000.00");

    // =============== CROP YIELD TOKEN TESTS ===============

    @Test
    @Order(1)
    @DisplayName("CropYield: Should create with valid crop data")
    void testCreateCropYieldToken() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCropYieldToken(
                "DT-AG-CROP_YIELD-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.CORN,
                2025,
                new BigDecimal("500.00"),
                new BigDecimal("180.00")
        );

        assertNotNull(token);
        assertEquals(AgriculturalTokenType.CROP_YIELD, token.agTokenType);
        assertEquals(FARM_ID, token.farmId);
        assertEquals(CropType.CORN, token.cropType);
        assertEquals(Integer.valueOf(2025), token.harvestYear);
        assertEquals(new BigDecimal("500.00"), token.totalAcreage);
        assertEquals(new BigDecimal("180.00"), token.expectedYieldPerAcre);
        // Expected yield: 500 * 180 = 90000 bushels
        assertEquals(new BigDecimal("90000.0000"), token.totalExpectedYield);
    }

    @Test
    @Order(2)
    @DisplayName("CropYield: Should calculate yield variance")
    void testCropYieldVarianceCalculation() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCropYieldToken(
                "DT-AG-CROP_YIELD-002",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.SOYBEANS,
                2025,
                new BigDecimal("1000.00"),
                new BigDecimal("50.00")
        );
        // Actual yield 10% higher
        token.actualYieldPerAcre = new BigDecimal("55.00");

        BigDecimal yield = token.calculateYield();
        // Expected: (55 - 50) / 50 * 100 = 10%
        assertEquals(0, yield.compareTo(new BigDecimal("10.0000")));
    }

    @Test
    @Order(3)
    @DisplayName("CropYield: Validation should pass with valid data")
    void testCropYieldValidation() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCropYieldToken(
                "DT-AG-CROP_YIELD-003",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.WHEAT,
                2025,
                new BigDecimal("200.00"),
                new BigDecimal("60.00")
        );

        ValidationResult result = token.validateSpecific();
        assertTrue(result.isValid());
    }

    @Test
    @Order(4)
    @DisplayName("CropYield: Validation should fail without farm ID")
    void testCropYieldValidationFailsWithoutFarmId() {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                "DT-AG-CROP_YIELD-004",
                PARENT_TOKEN_ID,
                AgriculturalTokenType.CROP_YIELD,
                FACE_VALUE,
                OWNER
        );
        token.cropType = CropType.CORN;
        token.harvestYear = 2025;
        token.expectedYieldPerAcre = new BigDecimal("180.00");
        // farmId is null

        ValidationResult result = token.validateSpecific();
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("Farm ID"));
    }

    // =============== HARVEST REVENUE TOKEN TESTS ===============

    @Test
    @Order(5)
    @DisplayName("HarvestRevenue: Should create with price data")
    void testCreateHarvestRevenueToken() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createHarvestRevenueToken(
                "DT-AG-HARVEST_REVENUE-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.CORN,
                2025,
                new BigDecimal("90000.00"),
                new BigDecimal("5.50"),
                new BigDecimal("80.00")
        );

        assertNotNull(token);
        assertEquals(AgriculturalTokenType.HARVEST_REVENUE, token.agTokenType);
        assertEquals(new BigDecimal("90000.00"), token.totalExpectedYield);
        assertEquals(new BigDecimal("5.50"), token.pricePerUnit);
        // Expected revenue: 90000 * 5.50 = 495000
        assertEquals(new BigDecimal("495000.00"), token.expectedRevenue);
        assertEquals(new BigDecimal("80.00"), token.revenueSharePercent);
    }

    @Test
    @Order(6)
    @DisplayName("HarvestRevenue: Should calculate revenue return")
    void testHarvestRevenueReturnCalculation() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createHarvestRevenueToken(
                "DT-AG-HARVEST_REVENUE-002",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.SOYBEANS,
                2025,
                new BigDecimal("50000.00"),
                new BigDecimal("12.00"),
                new BigDecimal("100.00")
        );
        // Actual revenue 20% higher
        token.actualRevenue = new BigDecimal("720000.00"); // 50000 * 14.40

        BigDecimal yield = token.calculateYield();
        // Expected: (720000 - 600000) / 600000 * 100 = 20%
        assertEquals(0, yield.compareTo(new BigDecimal("20.0000")));
    }

    // =============== CARBON SEQUESTRATION TOKEN TESTS ===============

    @Test
    @Order(7)
    @DisplayName("CarbonSequestration: Should create with carbon data")
    void testCreateCarbonSequestrationToken() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCarbonSequestrationToken(
                "DT-AG-CARBON_SEQUESTRATION-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                new BigDecimal("1000.00"),
                2025,
                VerificationStandard.VERRA_VCS,
                new BigDecimal("25.00")
        );

        assertNotNull(token);
        assertEquals(AgriculturalTokenType.CARBON_SEQUESTRATION, token.agTokenType);
        assertEquals(new BigDecimal("1000.00"), token.co2eTonnes);
        assertEquals(Integer.valueOf(2025), token.vintageYear);
        assertEquals(VerificationStandard.VERRA_VCS, token.verificationStandard);
        assertEquals(new BigDecimal("25.00"), token.carbonPricePerTonne);
        // Current value: 1000 * 25 = 25000
        assertEquals(new BigDecimal("25000.00"), token.currentValue);
    }

    @Test
    @Order(8)
    @DisplayName("CarbonSequestration: Should calculate carbon return")
    void testCarbonReturnCalculation() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCarbonSequestrationToken(
                "DT-AG-CARBON_SEQUESTRATION-002",
                PARENT_TOKEN_ID,
                new BigDecimal("20000.00"),
                OWNER,
                FARM_ID,
                new BigDecimal("1000.00"),
                2025,
                VerificationStandard.GOLD_STANDARD,
                new BigDecimal("30.00")
        );

        BigDecimal yield = token.calculateYield();
        // Expected: (1000 * 30) / 20000 * 100 = 150%
        assertEquals(0, yield.compareTo(new BigDecimal("150.0000")));
    }

    @Test
    @Order(9)
    @DisplayName("CarbonSequestration: Validation should fail without verification")
    void testCarbonValidationFailsWithoutVerification() {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                "DT-AG-CARBON_SEQUESTRATION-003",
                PARENT_TOKEN_ID,
                AgriculturalTokenType.CARBON_SEQUESTRATION,
                FACE_VALUE,
                OWNER
        );
        token.co2eTonnes = new BigDecimal("500.00");
        token.vintageYear = 2025;
        // verificationStandard is null

        ValidationResult result = token.validateSpecific();
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("Verification standard"));
    }

    // =============== WATER RIGHTS TOKEN TESTS ===============

    @Test
    @Order(10)
    @DisplayName("WaterRights: Should create with allocation data")
    void testCreateWaterRightsToken() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createWaterRightsToken(
                "DT-AG-WATER_RIGHTS-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                WaterRightType.PRIOR_APPROPRIATION,
                new BigDecimal("1500.00"),
                "Colorado River"
        );

        assertNotNull(token);
        assertEquals(AgriculturalTokenType.WATER_RIGHTS, token.agTokenType);
        assertEquals(WaterRightType.PRIOR_APPROPRIATION, token.waterRightType);
        assertEquals(new BigDecimal("1500.00"), token.waterAllocationAcreFeet);
        assertEquals("Colorado River", token.waterSource);
    }

    @Test
    @Order(11)
    @DisplayName("WaterRights: Validation should fail without water source")
    void testWaterRightsValidationFailsWithoutSource() {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                "DT-AG-WATER_RIGHTS-002",
                PARENT_TOKEN_ID,
                AgriculturalTokenType.WATER_RIGHTS,
                FACE_VALUE,
                OWNER
        );
        token.waterRightType = WaterRightType.GROUNDWATER;
        token.waterAllocationAcreFeet = new BigDecimal("1000.00");
        // waterSource is null

        ValidationResult result = token.validateSpecific();
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("Water source"));
    }

    // =============== GENERAL TOKEN TESTS ===============

    @Test
    @Order(12)
    @DisplayName("Agricultural: Category should be AGRICULTURAL")
    void testCategoryIsAgricultural() {
        AgriculturalDerivedToken token = new AgriculturalDerivedToken(
                "DT-AG-TEST-001",
                PARENT_TOKEN_ID,
                AgriculturalTokenType.CROP_YIELD,
                FACE_VALUE,
                OWNER
        );

        assertEquals("AGRICULTURAL", token.getCategory());
    }

    @Test
    @Order(13)
    @DisplayName("Agricultural: Should provide USDA oracle feeds")
    void testOracleFeeds() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCropYieldToken(
                "DT-AG-CROP_YIELD-ORACLE",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.CORN,
                2025,
                new BigDecimal("500.00"),
                new BigDecimal("180.00")
        );

        List<String> feeds = token.getOracleFeeds();
        assertNotNull(feeds);
        assertFalse(feeds.isEmpty());
        assertTrue(feeds.contains("ORACLE_USDA_NASS"));
        assertTrue(feeds.contains("ORACLE_WEATHER"));
        assertTrue(feeds.contains("ORACLE_CORN_FUTURES"));
    }

    @Test
    @Order(14)
    @DisplayName("Agricultural: Lifecycle transitions should work")
    void testLifecycleTransitions() {
        AgriculturalDerivedToken token = AgriculturalDerivedToken.createCropYieldToken(
                "DT-AG-LIFECYCLE-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                FARM_ID,
                CropType.CORN,
                2025,
                new BigDecimal("500.00"),
                new BigDecimal("180.00")
        );

        assertEquals(DerivedTokenStatus.CREATED, token.status);

        assertTrue(token.activate());
        assertEquals(DerivedTokenStatus.ACTIVE, token.status);

        assertTrue(token.expire());
        assertEquals(DerivedTokenStatus.EXPIRED, token.status);
    }

    @Test
    @Order(15)
    @DisplayName("CropType: Should have default units")
    void testCropTypeUnits() {
        assertEquals("bu", CropType.CORN.getDefaultUnit());
        assertEquals("tons", CropType.HAY.getDefaultUnit());
        assertEquals("lbs", CropType.ALMONDS.getDefaultUnit());
    }

    @Test
    @Order(16)
    @DisplayName("VerificationStandard: Should have codes")
    void testVerificationStandardCodes() {
        assertEquals("Verra VCS", VerificationStandard.VERRA_VCS.getCode());
        assertEquals("Verified Carbon Standard", VerificationStandard.VERRA_VCS.getFullName());
    }

    @Test
    @Order(17)
    @DisplayName("WaterRightType: Should have descriptions")
    void testWaterRightTypes() {
        assertEquals("First in time, first in right",
                WaterRightType.PRIOR_APPROPRIATION.getDescription());
        assertEquals(6, WaterRightType.values().length);
    }

    @Test
    @Order(18)
    @DisplayName("AgriculturalTokenType: Should have all 4 types")
    void testAgriculturalTokenTypes() {
        assertEquals(4, AgriculturalTokenType.values().length);
        assertNotNull(AgriculturalTokenType.CROP_YIELD.getDisplayName());
        assertNotNull(AgriculturalTokenType.CARBON_SEQUESTRATION.getDescription());
    }
}
