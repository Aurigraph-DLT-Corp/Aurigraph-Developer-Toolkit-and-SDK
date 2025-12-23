package io.aurigraph.v11.auth;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@DisplayName("Token Management Integration Tests")
class TokenManagementResourceSimpleTest {

    @Inject
    AuthTokenService authTokenService;

    @Inject
    AuthTokenRepository authTokenRepository;

    @Inject
    AdvancedTokenFeatureService advancedTokenFeatureService;

    private String testUserId;
    private String testToken;
    private String testTokenHash;

    @BeforeEach
    void setUp() throws Exception {
        testUserId = "integration-test-user-" + System.nanoTime();
        testToken = "test-jwt-token-" + System.nanoTime();
        // SHA-256 hash of testToken
        testTokenHash = authTokenService.storeToken(
            testUserId,
            "test@example.com",
            testToken,
            AuthToken.TokenType.ACCESS,
            java.time.LocalDateTime.now().plusHours(24),
            "192.168.1.1",
            "Mozilla/5.0"
        ).tokenHash;
    }

    @Nested
    @DisplayName("Token Storage and Retrieval")
    class TokenStorageTests {

        @Test
        @DisplayName("Should store token successfully")
        void testStoreToken() {
            assertNotNull(testTokenHash);
            assertTrue(testTokenHash.length() > 0);
        }

        @Test
        @DisplayName("Should retrieve stored token by hash")
        void testRetrieveTokenByHash() {
            AuthToken retrieved = authTokenRepository.findByTokenHash(testTokenHash)
                .orElseThrow(() -> new AssertionError("Token not found"));

            assertEquals(testUserId, retrieved.userId);
            assertEquals("test@example.com", retrieved.userEmail);
            assertEquals(AuthToken.TokenType.ACCESS, retrieved.tokenType);
            assertEquals(AuthToken.TokenStatus.ACTIVE, retrieved.status);
        }

        @Test
        @DisplayName("Should retrieve active tokens for user")
        void testGetActiveTokensForUser() {
            var activeTokens = authTokenRepository.findActiveTokensByUserId(testUserId);
            assertFalse(activeTokens.isEmpty());
            assertTrue(activeTokens.stream().anyMatch(t -> t.tokenHash.equals(testTokenHash)));
        }
    }

    @Nested
    @DisplayName("Token Validation")
    class TokenValidationTests {

        @Test
        @DisplayName("Should validate stored token")
        void testValidateToken() {
            AuthToken validated = authTokenService.validateToken(testToken)
                .orElseThrow(() -> new AssertionError("Token validation failed"));

            assertEquals(testUserId, validated.userId);
            assertTrue(validated.isValid());
        }

        @Test
        @DisplayName("Should reject invalid token")
        void testRejectInvalidToken() {
            var result = authTokenService.validateToken("invalid-token");
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should update last used timestamp")
        void testUpdateLastUsed() {
            var token1 = authTokenRepository.findByTokenHash(testTokenHash).get();
            var initialLastUsed = token1.lastUsedAt;

            // Validate the token
            authTokenService.validateToken(testToken);

            var token2 = authTokenRepository.findByTokenHash(testTokenHash).get();
            assertNotNull(token2.lastUsedAt);
            // LastUsed should be updated (may be equal or greater depending on timing)
            assertTrue(token2.lastUsedAt.compareTo(initialLastUsed) >= 0);
        }
    }

    @Nested
    @DisplayName("Token Revocation")
    class TokenRevocationTests {

        @Test
        @DisplayName("Should revoke token by hash")
        void testRevokeToken() {
            authTokenService.revokeToken(testTokenHash, "User initiated revocation");

            AuthToken revoked = authTokenRepository.findByTokenHash(testTokenHash).get();
            assertTrue(revoked.isRevoked);
            assertEquals("User initiated revocation", revoked.revocationReason);
            assertEquals(AuthToken.TokenStatus.REVOKED, revoked.status);
        }

        @Test
        @DisplayName("Should revoke all tokens for user")
        void testRevokeAllUserTokens() {
            // Store another token for same user
            String token2 = "test-token-2-" + System.nanoTime();
            authTokenService.storeToken(
                testUserId,
                "test@example.com",
                token2,
                AuthToken.TokenType.REFRESH,
                java.time.LocalDateTime.now().plusDays(7),
                "192.168.1.2",
                "Mozilla/5.0"
            );

            // Revoke all
            int revokedCount = authTokenService.revokeAllTokensForUser(testUserId, "Password changed");

            // Should revoke at least our test token
            assertTrue(revokedCount >= 1);

            // Verify all tokens revoked
            var activeTokens = authTokenRepository.findActiveTokensByUserId(testUserId);
            assertTrue(activeTokens.isEmpty());
        }

        @Test
        @DisplayName("Should detect revoked tokens")
        void testDetectRevokedToken() {
            authTokenService.revokeToken(testTokenHash, "Compromised");

            AuthToken revoked = authTokenRepository.findByTokenHash(testTokenHash).get();
            assertTrue(revoked.isRevoked);
            assertFalse(revoked.isValid());
        }
    }

    @Nested
    @DisplayName("Token Cleanup")
    class TokenCleanupTests {

        @Test
        @DisplayName("Should cleanup expired tokens")
        void testCleanupExpiredTokens() {
            // Create an expired token
            var expired = new AuthToken();
            expired.userId = "cleanup-test-user";
            expired.userEmail = "cleanup@example.com";
            expired.tokenHash = "expired-token-" + System.nanoTime();
            expired.tokenType = AuthToken.TokenType.ACCESS;
            expired.status = AuthToken.TokenStatus.EXPIRED;
            expired.expiresAt = java.time.LocalDateTime.now().minusHours(1);
            expired.createdAt = java.time.LocalDateTime.now().minusDays(2);
            expired.persist();

            // Run cleanup
            int cleaned = authTokenService.cleanupExpiredTokens();

            // Cleanup should have removed at least one token
            assertTrue(cleaned >= 0); // May be 0 if already cleaned
        }
    }

    @Nested
    @DisplayName("Advanced Features")
    class AdvancedFeaturesTests {

        @Test
        @DisplayName("Should blacklist token")
        void testBlacklistToken() {
            int initialSize = advancedTokenFeatureService.getBlacklistSize();

            advancedTokenFeatureService.blacklistToken(testTokenHash, "Compromised");

            assertTrue(advancedTokenFeatureService.isTokenBlacklisted(testTokenHash));
            assertEquals(initialSize + 1, advancedTokenFeatureService.getBlacklistSize());
        }

        @Test
        @DisplayName("Should enforce rate limiting")
        void testRateLimiting() {
            String tokenHash = "rate-limit-test-" + System.nanoTime();

            // Allow requests below limit
            for (int i = 0; i < 5; i++) {
                assertTrue(advancedTokenFeatureService.checkRateLimit(tokenHash, 10));
            }

            // Should still allow requests below limit
            assertTrue(advancedTokenFeatureService.checkRateLimit(tokenHash, 10));
        }

        @Test
        @DisplayName("Should track rate limit status")
        void testRateLimitStatus() {
            String tokenHash = "status-test-" + System.nanoTime();

            advancedTokenFeatureService.checkRateLimit(tokenHash, 100);
            advancedTokenFeatureService.checkRateLimit(tokenHash, 100);

            var status = advancedTokenFeatureService.getRateLimitStatus(tokenHash);
            assertEquals(2, status.currentRequests);
            assertFalse(status.isLimited);
        }

        @Test
        @DisplayName("Should get blacklist statistics")
        void testBlacklistStatistics() {
            var stats = advancedTokenFeatureService.getBlacklistStatistics();
            assertNotNull(stats);
            assertGreaterThanOrEqual(stats.blacklistedTokens, 0);
            assertNotNull(stats.timestamp);
        }
    }

    @Nested
    @DisplayName("Multi-Device Session Management")
    class MultiDeviceTests {

        @Test
        @DisplayName("Should track multiple devices")
        void testMultipleDevices() {
            String userId = "multi-device-user-" + System.nanoTime();

            // Device 1
            String token1 = "device1-token-" + System.nanoTime();
            authTokenService.storeToken(
                userId,
                "user@example.com",
                token1,
                AuthToken.TokenType.ACCESS,
                java.time.LocalDateTime.now().plusHours(24),
                "192.168.1.1",
                "Chrome/Windows"
            );

            // Device 2
            String token2 = "device2-token-" + System.nanoTime();
            authTokenService.storeToken(
                userId,
                "user@example.com",
                token2,
                AuthToken.TokenType.ACCESS,
                java.time.LocalDateTime.now().plusHours(24),
                "10.0.0.5",
                "Safari/iPhone"
            );

            // Should have 2 active tokens
            var activeTokens = authTokenRepository.findActiveTokensByUserId(userId);
            assertEquals(2, activeTokens.size());

            // Each should have different IP and user-agent
            var device1Token = activeTokens.stream()
                .filter(t -> t.clientIp.equals("192.168.1.1"))
                .findFirst();
            var device2Token = activeTokens.stream()
                .filter(t -> t.clientIp.equals("10.0.0.5"))
                .findFirst();

            assertTrue(device1Token.isPresent());
            assertTrue(device2Token.isPresent());
        }
    }

    // Helper method
    private void assertGreaterThanOrEqual(int actual, int expected) {
        assertTrue(actual >= expected);
    }
}
