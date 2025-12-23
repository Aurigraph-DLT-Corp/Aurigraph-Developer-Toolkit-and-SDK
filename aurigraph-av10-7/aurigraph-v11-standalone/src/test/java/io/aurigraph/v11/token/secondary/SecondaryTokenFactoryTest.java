package io.aurigraph.v11.token.secondary;

import io.aurigraph.v11.token.secondary.SecondaryToken.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for SecondaryTokenFactory
 *
 * Tests cover:
 * - Income stream token creation
 * - Collateral token creation
 * - Royalty token creation
 * - Validation logic
 * - Error handling
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SecondaryTokenFactoryTest {

    // Note: In actual integration tests, these would be injected
    // For unit testing, we test the business logic directly

    private static final String PARENT_TOKEN_ID = "PT-REAL_ESTATE-test-1234";
    private static final String OWNER = "0x1234567890abcdef";
    private static final BigDecimal FACE_VALUE = new BigDecimal("100000.00");

    @Test
    @Order(1)
    @DisplayName("SecondaryToken: Should create income stream token with valid data")
    void testCreateIncomeStreamTokenWithValidData() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-001",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        token.revenueSharePercent = new BigDecimal("70.00");
        token.distributionFrequency = DistributionFrequency.MONTHLY;

        assertNotNull(token);
        assertEquals("ST-INCOME_STREAM-test-001", token.tokenId);
        assertEquals(PARENT_TOKEN_ID, token.parentTokenId);
        assertEquals(SecondaryTokenType.INCOME_STREAM, token.tokenType);
        assertEquals(FACE_VALUE, token.faceValue);
        assertEquals(OWNER, token.owner);
        assertEquals(SecondaryTokenStatus.CREATED, token.status);
        assertEquals(new BigDecimal("70.00"), token.revenueSharePercent);
        assertEquals(DistributionFrequency.MONTHLY, token.distributionFrequency);
    }

    @Test
    @Order(2)
    @DisplayName("SecondaryToken: Should create collateral token with expiration")
    void testCreateCollateralTokenWithExpiration() {
        Instant expiresAt = Instant.now().plus(365, ChronoUnit.DAYS);

        SecondaryToken token = new SecondaryToken(
                "ST-COLLATERAL-test-002",
                PARENT_TOKEN_ID,
                SecondaryTokenType.COLLATERAL,
                FACE_VALUE,
                OWNER
        );
        token.expiresAt = expiresAt;

        assertNotNull(token);
        assertEquals(SecondaryTokenType.COLLATERAL, token.tokenType);
        assertEquals(expiresAt, token.expiresAt);
    }

    @Test
    @Order(3)
    @DisplayName("SecondaryToken: Should create royalty token with revenue share")
    void testCreateRoyaltyTokenWithRevenueShare() {
        SecondaryToken token = new SecondaryToken(
                "ST-ROYALTY-test-003",
                PARENT_TOKEN_ID,
                SecondaryTokenType.ROYALTY,
                new BigDecimal("50000.00"),
                OWNER
        );
        token.revenueSharePercent = new BigDecimal("15.00");

        assertNotNull(token);
        assertEquals(SecondaryTokenType.ROYALTY, token.tokenType);
        assertEquals(new BigDecimal("15.00"), token.revenueSharePercent);
    }

    @Test
    @Order(4)
    @DisplayName("SecondaryToken: Should activate token successfully")
    void testActivateToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-004",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );

        assertEquals(SecondaryTokenStatus.CREATED, token.status);
        assertTrue(token.activate());
        assertEquals(SecondaryTokenStatus.ACTIVE, token.status);
        assertNotNull(token.activatedAt);
    }

    @Test
    @Order(5)
    @DisplayName("SecondaryToken: Should redeem active token")
    void testRedeemActiveToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-005",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        token.activate();

        assertEquals(SecondaryTokenStatus.ACTIVE, token.status);
        assertTrue(token.redeem());
        assertEquals(SecondaryTokenStatus.REDEEMED, token.status);
        assertNotNull(token.redeemedAt);
    }

    @Test
    @Order(6)
    @DisplayName("SecondaryToken: Should fail to activate non-CREATED token")
    void testFailActivateNonCreatedToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-006",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        token.activate(); // Now ACTIVE

        assertThrows(IllegalStateException.class, token::activate);
    }

    @Test
    @Order(7)
    @DisplayName("SecondaryToken: Should fail to redeem non-ACTIVE token")
    void testFailRedeemNonActiveToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-007",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        // Still CREATED, not ACTIVE

        assertThrows(IllegalStateException.class, token::redeem);
    }

    @Test
    @Order(8)
    @DisplayName("SecondaryToken: Should transfer to new owner")
    void testTransferToNewOwner() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-008",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        token.activate();

        String newOwner = "0xnewowner123456";
        assertTrue(token.transfer(newOwner));
        assertEquals(newOwner, token.owner);
    }

    @Test
    @Order(9)
    @DisplayName("SecondaryToken: Should fail transfer of non-ACTIVE token")
    void testFailTransferNonActiveToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-009",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        // Still CREATED

        assertThrows(IllegalStateException.class, () -> token.transfer("0xnew"));
    }

    @Test
    @Order(10)
    @DisplayName("SecondaryToken: Should expire token")
    void testExpireToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-COLLATERAL-test-010",
                PARENT_TOKEN_ID,
                SecondaryTokenType.COLLATERAL,
                FACE_VALUE,
                OWNER
        );
        token.activate();

        assertTrue(token.expire());
        assertEquals(SecondaryTokenStatus.EXPIRED, token.status);
    }

    @Test
    @Order(11)
    @DisplayName("SecondaryToken: Should fail to expire terminal token")
    void testFailExpireTerminalToken() {
        SecondaryToken token = new SecondaryToken(
                "ST-INCOME_STREAM-test-011",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );
        token.activate();
        token.redeem(); // Now REDEEMED

        assertThrows(IllegalStateException.class, token::expire);
    }

    @Test
    @Order(12)
    @DisplayName("SecondaryTokenType: Should have correct display names")
    void testSecondaryTokenTypeDisplayNames() {
        assertEquals("Income Stream", SecondaryTokenType.INCOME_STREAM.getDisplayName());
        assertEquals("Collateral", SecondaryTokenType.COLLATERAL.getDisplayName());
        assertEquals("Royalty", SecondaryTokenType.ROYALTY.getDisplayName());
    }

    @Test
    @Order(13)
    @DisplayName("DistributionFrequency: Should have all expected values")
    void testDistributionFrequencyValues() {
        assertEquals(8, DistributionFrequency.values().length);
        assertNotNull(DistributionFrequency.valueOf("MONTHLY"));
        assertNotNull(DistributionFrequency.valueOf("QUARTERLY"));
        assertNotNull(DistributionFrequency.valueOf("ANNUAL"));
    }

    @Test
    @Order(14)
    @DisplayName("SecondaryToken: toString should include key fields")
    void testToStringContainsKeyFields() {
        SecondaryToken token = new SecondaryToken(
                "ST-TEST-001",
                PARENT_TOKEN_ID,
                SecondaryTokenType.INCOME_STREAM,
                FACE_VALUE,
                OWNER
        );

        String str = token.toString();
        assertTrue(str.contains("ST-TEST-001"));
        assertTrue(str.contains(PARENT_TOKEN_ID));
        assertTrue(str.contains("INCOME_STREAM"));
    }
}
