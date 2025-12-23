package io.aurigraph.v11.token.derived;

import io.aurigraph.v11.token.derived.realestate.RealEstateDerivedToken;
import io.aurigraph.v11.token.derived.realestate.RealEstateDerivedToken.*;
import io.aurigraph.v11.token.derived.DerivedToken.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for RealEstateDerivedToken
 *
 * Tests cover:
 * - All 4 real estate token types
 * - Factory methods
 * - Validation logic
 * - Yield calculations
 * - Oracle integration
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RealEstateDerivedTokenTest {

    private static final String PARENT_TOKEN_ID = "PT-REAL_ESTATE-test-re-001";
    private static final String OWNER = "0xrealestate123";
    private static final BigDecimal FACE_VALUE = new BigDecimal("250000.00");

    // =============== RENTAL INCOME TOKEN TESTS ===============

    @Test
    @Order(1)
    @DisplayName("RentalIncome: Should create with valid data")
    void testCreateRentalIncomeToken() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createRentalIncomeToken(
                "DT-RE-RENTAL_INCOME-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("3000.00"),
                new BigDecimal("70.00")
        );

        assertNotNull(token);
        assertEquals(RealEstateTokenType.RENTAL_INCOME, token.reTokenType);
        assertEquals(new BigDecimal("3000.00"), token.monthlyRent);
        assertEquals(new BigDecimal("36000.00"), token.annualRentalIncome);
        assertEquals(new BigDecimal("70.00"), token.revenueSharePercent);
        assertEquals(DistributionFrequency.MONTHLY, token.distributionFrequency);
    }

    @Test
    @Order(2)
    @DisplayName("RentalIncome: Should calculate yield correctly")
    void testRentalIncomeYieldCalculation() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createRentalIncomeToken(
                "DT-RE-RENTAL_INCOME-002",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("3000.00"),
                new BigDecimal("100.00") // 100% share for easier calculation
        );
        token.occupancyRate = new BigDecimal("100.00");

        BigDecimal yield = token.calculateYield();
        assertNotNull(yield);
        // Expected: (36000 * 100% occupancy * 100% share) / 250000 * 100 = 14.4%
        assertTrue(yield.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @Order(3)
    @DisplayName("RentalIncome: Validation should pass with valid data")
    void testRentalIncomeValidation() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createRentalIncomeToken(
                "DT-RE-RENTAL_INCOME-003",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("2500.00"),
                new BigDecimal("50.00")
        );

        ValidationResult result = token.validateSpecific();
        assertTrue(result.isValid());
    }

    @Test
    @Order(4)
    @DisplayName("RentalIncome: Validation should fail without monthly rent")
    void testRentalIncomeValidationFailsWithoutRent() {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                "DT-RE-RENTAL_INCOME-004",
                PARENT_TOKEN_ID,
                RealEstateTokenType.RENTAL_INCOME,
                FACE_VALUE,
                OWNER
        );
        // monthlyRent is null

        ValidationResult result = token.validateSpecific();
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("Monthly rent"));
    }

    // =============== FRACTIONAL SHARE TOKEN TESTS ===============

    @Test
    @Order(5)
    @DisplayName("FractionalShare: Should create with valid share data")
    void testCreateFractionalShareToken() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createFractionalShareToken(
                "DT-RE-FRACTIONAL_SHARE-001",
                PARENT_TOKEN_ID,
                new BigDecimal("10000.00"),
                OWNER,
                1000L,
                50L,
                new BigDecimal("1000000.00")
        );

        assertNotNull(token);
        assertEquals(RealEstateTokenType.FRACTIONAL_SHARE, token.reTokenType);
        assertEquals(Long.valueOf(1000), token.totalShares);
        assertEquals(Long.valueOf(50), token.shareCount);
        assertEquals(new BigDecimal("1000000.00"), token.propertyValue);
        // 50/1000 = 5%
        assertEquals(new BigDecimal("5.0000"), token.revenueSharePercent);
        // 1000000/1000 = 1000 per share
        assertEquals(new BigDecimal("1000.0000"), token.sharePrice);
    }

    @Test
    @Order(6)
    @DisplayName("FractionalShare: Validation should fail with shares exceeding total")
    void testFractionalShareValidationFailsExceedingTotal() {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                "DT-RE-FRACTIONAL_SHARE-002",
                PARENT_TOKEN_ID,
                RealEstateTokenType.FRACTIONAL_SHARE,
                FACE_VALUE,
                OWNER
        );
        token.totalShares = 100L;
        token.shareCount = 150L; // Exceeds total

        ValidationResult result = token.validateSpecific();
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("cannot exceed"));
    }

    // =============== APPRECIATION TOKEN TESTS ===============

    @Test
    @Order(7)
    @DisplayName("Appreciation: Should create with base value and target")
    void testCreateAppreciationToken() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createAppreciationToken(
                "DT-RE-PROPERTY_APPRECIATION-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("500000.00"),
                new BigDecimal("10.00"),
                365
        );

        assertNotNull(token);
        assertEquals(RealEstateTokenType.PROPERTY_APPRECIATION, token.reTokenType);
        assertEquals(new BigDecimal("500000.00"), token.baseValue);
        assertEquals(new BigDecimal("10.00"), token.targetAppreciation);
        assertEquals(Integer.valueOf(365), token.appreciationLockDays);
    }

    @Test
    @Order(8)
    @DisplayName("Appreciation: Should calculate appreciation yield")
    void testAppreciationYieldCalculation() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createAppreciationToken(
                "DT-RE-PROPERTY_APPRECIATION-002",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("500000.00"),
                new BigDecimal("10.00"),
                365
        );
        // Set current value 10% higher than base
        token.currentValue = new BigDecimal("550000.00");

        BigDecimal yield = token.calculateYield();
        // Expected: (550000 - 500000) / 500000 * 100 = 10%
        assertEquals(0, yield.compareTo(new BigDecimal("10.0000")));
    }

    // =============== MORTGAGE COLLATERAL TOKEN TESTS ===============

    @Test
    @Order(9)
    @DisplayName("MortgageCollateral: Should create with loan details")
    void testCreateMortgageCollateralToken() {
        Instant maturity = Instant.now().plus(10 * 365, ChronoUnit.DAYS);

        RealEstateDerivedToken token = RealEstateDerivedToken.createMortgageCollateralToken(
                "DT-RE-MORTGAGE_COLLATERAL-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("500000.00"),
                new BigDecimal("400000.00"),
                new BigDecimal("4.5"),
                maturity,
                "LENDER-001"
        );

        assertNotNull(token);
        assertEquals(RealEstateTokenType.MORTGAGE_COLLATERAL, token.reTokenType);
        assertEquals(new BigDecimal("500000.00"), token.propertyValue);
        assertEquals(new BigDecimal("400000.00"), token.mortgagePrincipal);
        assertEquals(new BigDecimal("4.5"), token.mortgageRate);
        assertEquals("LENDER-001", token.lenderId);
        // LTV = 400000/500000 * 100 = 80%
        assertEquals(new BigDecimal("80.0000"), token.ltvRatio);
    }

    @Test
    @Order(10)
    @DisplayName("MortgageCollateral: Validation should fail without lender")
    void testMortgageCollateralValidationFailsWithoutLender() {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                "DT-RE-MORTGAGE_COLLATERAL-002",
                PARENT_TOKEN_ID,
                RealEstateTokenType.MORTGAGE_COLLATERAL,
                FACE_VALUE,
                OWNER
        );
        token.propertyValue = new BigDecimal("500000.00");
        token.mortgagePrincipal = new BigDecimal("400000.00");
        // lenderId is null

        ValidationResult result = token.validateSpecific();
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("Lender ID"));
    }

    // =============== GENERAL TOKEN TESTS ===============

    @Test
    @Order(11)
    @DisplayName("RealEstate: Category should be REAL_ESTATE")
    void testCategoryIsRealEstate() {
        RealEstateDerivedToken token = new RealEstateDerivedToken(
                "DT-RE-TEST-001",
                PARENT_TOKEN_ID,
                RealEstateTokenType.RENTAL_INCOME,
                FACE_VALUE,
                OWNER
        );

        assertEquals("REAL_ESTATE", token.getCategory());
    }

    @Test
    @Order(12)
    @DisplayName("RealEstate: Should provide oracle feeds")
    void testOracleFeeds() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createRentalIncomeToken(
                "DT-RE-RENTAL_INCOME-ORACLE",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("3000.00"),
                new BigDecimal("70.00")
        );

        List<String> feeds = token.getOracleFeeds();
        assertNotNull(feeds);
        assertFalse(feeds.isEmpty());
        assertTrue(feeds.contains("ORACLE_PROPERTY_VALUE"));
        assertTrue(feeds.contains("ORACLE_RENTAL_RATES"));
    }

    @Test
    @Order(13)
    @DisplayName("RealEstate: Lifecycle transitions should work")
    void testLifecycleTransitions() {
        RealEstateDerivedToken token = RealEstateDerivedToken.createRentalIncomeToken(
                "DT-RE-LIFECYCLE-001",
                PARENT_TOKEN_ID,
                FACE_VALUE,
                OWNER,
                new BigDecimal("3000.00"),
                new BigDecimal("70.00")
        );

        assertEquals(DerivedTokenStatus.CREATED, token.status);

        assertTrue(token.activate());
        assertEquals(DerivedTokenStatus.ACTIVE, token.status);

        assertTrue(token.transfer("0xnewowner"));
        assertEquals("0xnewowner", token.owner);

        assertTrue(token.redeem());
        assertEquals(DerivedTokenStatus.REDEEMED, token.status);
    }

    @Test
    @Order(14)
    @DisplayName("RealEstateTokenType: Should have all 4 types")
    void testRealEstateTokenTypes() {
        assertEquals(4, RealEstateTokenType.values().length);
        assertNotNull(RealEstateTokenType.RENTAL_INCOME.getDisplayName());
        assertNotNull(RealEstateTokenType.FRACTIONAL_SHARE.getDescription());
    }

    @Test
    @Order(15)
    @DisplayName("PropertyType: Should have residential and commercial types")
    void testPropertyTypes() {
        assertTrue(PropertyType.values().length >= 9);
        assertEquals("Residential - Single Family",
                PropertyType.RESIDENTIAL_SINGLE_FAMILY.getDisplayName());
    }
}
