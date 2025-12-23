package io.aurigraph.v11.auth;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@DisplayName("Advanced Token Features Tests")
class AdvancedTokenFeatureServiceTest {

    @Inject
    AdvancedTokenFeatureService advancedTokenFeatureService;

    @Inject
    AuthTokenService authTokenService;

    private AuthToken testToken;

    @BeforeEach
    void setUp() {
        // Create a test token
        testToken = new AuthToken();
        testToken.tokenId = "test-token-" + System.nanoTime();
        testToken.userId = "test-user-" + System.nanoTime();
        testToken.userEmail = "test@example.com";
        testToken.tokenHash = "test-hash-" + System.nanoTime();
        testToken.tokenType = AuthToken.TokenType.ACCESS;
        testToken.status = AuthToken.TokenStatus.ACTIVE;
        testToken.metadata = "{\"scopes\": [\"read:profile\", \"read:tokens\"], \"geo_restriction\": \"US\"}";
    }

    @Nested
    @DisplayName("Token Blacklist Tests")
    class TokenBlacklistTests {

        @Test
        @DisplayName("Should add token to blacklist")
        void testBlacklistToken() {
            int initialSize = advancedTokenFeatureService.getBlacklistSize();
            advancedTokenFeatureService.blacklistToken(testToken.tokenHash, "Compromised");

            assertTrue(advancedTokenFeatureService.isTokenBlacklisted(testToken.tokenHash));
            assertEquals(initialSize + 1, advancedTokenFeatureService.getBlacklistSize());
        }

        @Test
        @DisplayName("Should detect blacklisted tokens")
        void testIsTokenBlacklisted() {
            advancedTokenFeatureService.blacklistToken(testToken.tokenHash, "Test blacklist");

            assertTrue(advancedTokenFeatureService.isTokenBlacklisted(testToken.tokenHash));
            assertFalse(advancedTokenFeatureService.isTokenBlacklisted("non-blacklisted-token"));
        }

        @Test
        @DisplayName("Should remove token from blacklist")
        void testRemoveFromBlacklist() {
            advancedTokenFeatureService.blacklistToken(testToken.tokenHash, "Test");
            assertTrue(advancedTokenFeatureService.isTokenBlacklisted(testToken.tokenHash));

            advancedTokenFeatureService.removeTokenFromBlacklist(testToken.tokenHash);
            assertFalse(advancedTokenFeatureService.isTokenBlacklisted(testToken.tokenHash));
        }

        @Test
        @DisplayName("Should get blacklist statistics")
        void testGetBlacklistStatistics() {
            advancedTokenFeatureService.blacklistToken("token-1", "Reason 1");
            advancedTokenFeatureService.blacklistToken("token-2", "Reason 2");

            AdvancedTokenFeatureService.BlacklistStatistics stats = advancedTokenFeatureService.getBlacklistStatistics();
            assertNotNull(stats);
            assertGreaterThanOrEqual(stats.blacklistedTokens, 2);
            assertNotNull(stats.timestamp);
        }
    }

    @Nested
    @DisplayName("Token Scopes Tests")
    class TokenScopesTests {

        @Test
        @DisplayName("Should verify token has specific scope")
        void testHasScope() {
            boolean hasReadProfile = advancedTokenFeatureService.hasScope(
                testToken,
                AdvancedTokenFeatureService.TokenScope.READ_PROFILE
            );
            assertTrue(hasReadProfile);
        }

        @Test
        @DisplayName("Should detect missing scope")
        void testMissingScope() {
            boolean hasAdminTokens = advancedTokenFeatureService.hasScope(
                testToken,
                AdvancedTokenFeatureService.TokenScope.ADMIN_TOKENS
            );
            assertFalse(hasAdminTokens);
        }

        @Test
        @DisplayName("Should verify any scope from list")
        void testHasAnyScope() {
            boolean hasAnyScope = advancedTokenFeatureService.hasAnyScope(
                testToken,
                AdvancedTokenFeatureService.TokenScope.ADMIN_SYSTEM,
                AdvancedTokenFeatureService.TokenScope.READ_PROFILE
            );
            assertTrue(hasAnyScope);
        }

        @Test
        @DisplayName("Should verify all scopes from list")
        void testHasAllScopes() {
            // Token has read:profile and read:tokens, but not all including admin scopes
            boolean hasAllScopes = advancedTokenFeatureService.hasAllScopes(
                testToken,
                AdvancedTokenFeatureService.TokenScope.READ_PROFILE,
                AdvancedTokenFeatureService.TokenScope.READ_TOKENS
            );
            assertTrue(hasAllScopes);
        }

        @Test
        @DisplayName("Should fail when not all scopes present")
        void testMissingRequiredScope() {
            boolean hasAllScopes = advancedTokenFeatureService.hasAllScopes(
                testToken,
                AdvancedTokenFeatureService.TokenScope.READ_PROFILE,
                AdvancedTokenFeatureService.TokenScope.ADMIN_SYSTEM
            );
            assertFalse(hasAllScopes);
        }
    }

    @Nested
    @DisplayName("Geo-Restriction Tests")
    class GeoRestrictionTests {

        @Test
        @DisplayName("Should allow location if no restriction")
        void testNoGeoRestriction() {
            AuthToken unrestricted = new AuthToken();
            unrestricted.metadata = "{}";

            boolean allowed = advancedTokenFeatureService.isLocationAllowed(unrestricted, "JP");
            assertTrue(allowed);
        }

        @Test
        @DisplayName("Should allow whitelisted country")
        void testAllowWhitelistedCountry() {
            boolean allowed = advancedTokenFeatureService.isLocationAllowed(testToken, "US");
            assertTrue(allowed);
        }

        @Test
        @DisplayName("Should deny non-whitelisted country")
        void testDenyNonWhitelistedCountry() {
            boolean allowed = advancedTokenFeatureService.isLocationAllowed(testToken, "CN");
            assertFalse(allowed);
        }

        @Test
        @DisplayName("Should allow ALL restriction to any country")
        void testAllowAllRestriction() {
            AuthToken allAllowed = new AuthToken();
            allAllowed.metadata = "{\"geo_restriction\": \"ALL\"}";

            boolean allowed = advancedTokenFeatureService.isLocationAllowed(allAllowed, "BR");
            assertTrue(allowed);
        }
    }

    @Nested
    @DisplayName("Device Consistency Tests")
    class DeviceConsistencyTests {

        @Test
        @DisplayName("Should verify device consistency")
        void testDeviceConsistent() {
            testToken.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
            testToken.clientIp = "192.168.1.1";

            boolean consistent = advancedTokenFeatureService.isDeviceConsistent(
                testToken,
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "192.168.1.1"
            );
            assertTrue(consistent);
        }

        @Test
        @DisplayName("Should detect user-agent mismatch")
        void testUserAgentMismatch() {
            testToken.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
            testToken.clientIp = "192.168.1.1";

            boolean consistent = advancedTokenFeatureService.isDeviceConsistent(
                testToken,
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                "192.168.1.1"
            );
            assertFalse(consistent);
        }

        @Test
        @DisplayName("Should allow IP address changes")
        void testIpAddressChange() {
            testToken.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
            testToken.clientIp = "192.168.1.1";

            boolean consistent = advancedTokenFeatureService.isDeviceConsistent(
                testToken,
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "10.0.0.1"  // Different IP but same user-agent
            );
            assertTrue(consistent);  // IP changes are allowed (proxy, mobile)
        }
    }

    @Nested
    @DisplayName("Rate Limiting Tests")
    class RateLimitingTests {

        @Test
        @DisplayName("Should allow requests under limit")
        void testRateLimitAllowed() {
            String tokenHash = "test-token-rate-limit";

            for (int i = 0; i < 10; i++) {
                boolean allowed = advancedTokenFeatureService.checkRateLimit(tokenHash, 1000);
                assertTrue(allowed, "Request " + (i + 1) + " should be allowed");
            }
        }

        @Test
        @DisplayName("Should enforce rate limit")
        void testRateLimitExceeded() {
            String tokenHash = "test-token-rate-limit-strict";
            int limit = 5;

            // Fill the limit
            for (int i = 0; i < limit; i++) {
                assertTrue(advancedTokenFeatureService.checkRateLimit(tokenHash, limit));
            }

            // Exceed the limit
            boolean allowed = advancedTokenFeatureService.checkRateLimit(tokenHash, limit);
            assertFalse(allowed);
        }

        @Test
        @DisplayName("Should provide rate limit status")
        void testGetRateLimitStatus() {
            String tokenHash = "test-token-rate-status";

            // Make some requests
            advancedTokenFeatureService.checkRateLimit(tokenHash, 100);
            advancedTokenFeatureService.checkRateLimit(tokenHash, 100);

            AdvancedTokenFeatureService.TokenRateLimitStatus status =
                advancedTokenFeatureService.getRateLimitStatus(tokenHash);

            assertNotNull(status);
            assertEquals(2, status.currentRequests);
            assertGreater(status.secondsRemaining, 0);
            assertFalse(status.isLimited);
        }

        @Test
        @DisplayName("Should reset rate limit")
        void testResetRateLimit() {
            String tokenHash = "test-token-reset";

            // Make request to set up rate limit
            advancedTokenFeatureService.checkRateLimit(tokenHash, 100);

            // Reset
            advancedTokenFeatureService.resetRateLimit(tokenHash);

            // Status should show 0 requests
            AdvancedTokenFeatureService.TokenRateLimitStatus status =
                advancedTokenFeatureService.getRateLimitStatus(tokenHash);

            assertEquals(0, status.currentRequests);
        }
    }

    @Nested
    @DisplayName("Bulk Token Operations")
    class BulkTokenOperationsTests {

        @Test
        @DisplayName("Should blacklist all user tokens")
        void testBlacklistUserTokens() {
            String userId = "bulk-test-user-" + System.nanoTime();

            // This would need a mock or test database setup
            // For now, we test that the method exists and is callable
            assertDoesNotThrow(() -> {
                advancedTokenFeatureService.blacklistUserTokens(userId, "Test reason");
            });
        }
    }

    // Helper assertions
    private void assertGreaterThanOrEqual(int actual, int expected) {
        assertTrue(actual >= expected, actual + " should be >= " + expected);
    }

    private void assertGreater(long actual, long expected) {
        assertTrue(actual > expected, actual + " should be > " + expected);
    }
}
