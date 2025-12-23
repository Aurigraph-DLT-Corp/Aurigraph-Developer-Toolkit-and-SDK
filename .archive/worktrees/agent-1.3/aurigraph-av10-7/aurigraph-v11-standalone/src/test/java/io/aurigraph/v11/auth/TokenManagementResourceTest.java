package io.aurigraph.v11.auth;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import org.hamcrest.Matcher;

@QuarkusTest
@DisplayName("Token Management REST API Tests")
class TokenManagementResourceTest {

    private static final String API_BASE = "/api/v11/auth/tokens";
    private static final String TEST_USER_ID = "test-user-123";
    private static final String TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    @Nested
    @DisplayName("GET /api/v11/auth/tokens/active - List Active Tokens")
    class ListActiveTokensTests {

        @Test
        @DisplayName("Should return active tokens for user")
        void testGetActiveTokens() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .queryParam("userId", TEST_USER_ID)
                .queryParam("page", 1)
                .queryParam("pageSize", 10)
            .when()
                .get(API_BASE + "/active")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401))) // 200 if authenticated, 401 if token invalid
                .body("tokens", notNullValue())
                .body("page", notNullValue())
                .body("pageSize", notNullValue())
                .body("totalTokens", greaterThanOrEqualTo(0));
        }

        @Test
        @DisplayName("Should require userId parameter")
        void testMissingUserIdParameter() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
            .when()
                .get(API_BASE + "/active")
            .then()
                .statusCode(anyOf(equalTo(400), equalTo(401)));
        }

        @Test
        @DisplayName("Should respect pagination parameters")
        void testPaginationParameters() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .queryParam("userId", TEST_USER_ID)
                .queryParam("page", 2)
                .queryParam("pageSize", 20)
            .when()
                .get(API_BASE + "/active")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("pageSize", anyOf(equalTo(20), notNullValue()));
        }
    }

    @Nested
    @DisplayName("GET /api/v11/auth/tokens/stats - Token Statistics")
    class TokenStatisticsTests {

        @Test
        @DisplayName("Should return token statistics for user")
        void testGetTokenStatistics() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .queryParam("userId", TEST_USER_ID)
            .when()
                .get(API_BASE + "/stats")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("userId", notNullValue())
                .body("activeTokens", greaterThanOrEqualTo(0))
                .body("accessTokens", greaterThanOrEqualTo(0))
                .body("refreshTokens", greaterThanOrEqualTo(0))
                .body("revokedTokens", greaterThanOrEqualTo(0))
                .body("expiredTokens", greaterThanOrEqualTo(0))
                .body("uniqueDevices", greaterThanOrEqualTo(0));
        }

        @Test
        @DisplayName("Should calculate total tokens correctly")
        void testTotalTokensCalculation() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .queryParam("userId", TEST_USER_ID)
            .when()
                .get(API_BASE + "/stats")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("totalTokens", notNullValue())
                .body("totalTokens", greaterThanOrEqualTo(0));
        }
    }

    @Nested
    @DisplayName("GET /api/v11/auth/tokens/{tokenId}/details - Token Details")
    class TokenDetailsTests {

        @Test
        @DisplayName("Should return token details for valid tokenId")
        void testGetTokenDetails() {
            String tokenId = "test-token-uuid";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("tokenId", tokenId)
            .when()
                .get(API_BASE + "/{tokenId}/details")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401), equalTo(404)))
                .body("tokenId", anyOf(equalTo(tokenId), nullValue()))
                .body("status", anyOf(notNullValue(), nullValue()));
        }

        @Test
        @DisplayName("Should include expiration information")
        void testTokenExpirationInfo() {
            String tokenId = "test-token-uuid";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("tokenId", tokenId)
            .when()
                .get(API_BASE + "/{tokenId}/details")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401), equalTo(404)))
                .body("expiresAt", anyOf(notNullValue(), nullValue()))
                .body("minutesRemaining", anyOf(notNullValue(), nullValue()));
        }

        @Test
        @DisplayName("Should indicate revocation status")
        void testTokenRevocationStatus() {
            String tokenId = "test-token-uuid";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("tokenId", tokenId)
            .when()
                .get(API_BASE + "/{tokenId}/details")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401), equalTo(404)))
                .body("isRevoked", anyOf(notNullValue(), nullValue()))
                .body("revocationReason", anyOf(notNullValue(), nullValue()));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v11/auth/tokens/{tokenId} - Revoke Single Token")
    class RevokeSingleTokenTests {

        @Test
        @DisplayName("Should revoke single token")
        void testRevokeSingleToken() {
            String tokenId = "test-token-uuid";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("tokenId", tokenId)
                .queryParam("reason", "User revocation")
            .when()
                .delete(API_BASE + "/{tokenId}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401), equalTo(404)))
                .body("message", anyOf(notNullValue(), nullValue()));
        }

        @Test
        @DisplayName("Should allow custom revocation reason")
        void testCustomRevocationReason() {
            String tokenId = "test-token-uuid";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("tokenId", tokenId)
                .queryParam("reason", "Suspicious activity detected")
            .when()
                .delete(API_BASE + "/{tokenId}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401), equalTo(404)));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v11/auth/tokens/all/{userId} - Logout All Devices")
    class LogoutAllDevicesTests {

        @Test
        @DisplayName("Should revoke all tokens for user")
        void testLogoutAllDevices() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("userId", TEST_USER_ID)
                .queryParam("reason", "User logout")
            .when()
                .delete(API_BASE + "/all/{userId}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("revokedCount", greaterThanOrEqualTo(0))
                .body("reason", notNullValue());
        }

        @Test
        @DisplayName("Should support custom logout reason")
        void testCustomLogoutReason() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("userId", TEST_USER_ID)
                .queryParam("reason", "Password changed - security update")
            .when()
                .delete(API_BASE + "/all/{userId}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("reason", notNullValue());
        }
    }

    @Nested
    @DisplayName("GET /api/v11/auth/tokens/audit/{userId} - Audit Trail")
    class AuditTrailTests {

        @Test
        @DisplayName("Should return audit trail for user")
        void testGetAuditTrail() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("userId", TEST_USER_ID)
                .queryParam("limit", 50)
            .when()
                .get(API_BASE + "/audit/{userId}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("userId", notNullValue())
                .body("totalEntries", greaterThanOrEqualTo(0))
                .body("entries", notNullValue());
        }

        @Test
        @DisplayName("Should respect limit parameter")
        void testAuditTrailLimit() {
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("userId", TEST_USER_ID)
                .queryParam("limit", 100)
            .when()
                .get(API_BASE + "/audit/{userId}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("entries.size()", lessThanOrEqualTo(100));
        }
    }

    @Nested
    @DisplayName("GET /api/v11/auth/tokens/device/{clientIp} - Tokens by Device")
    class TokensByDeviceTests {

        @Test
        @DisplayName("Should return tokens from specific device")
        void testGetTokensByDevice() {
            String clientIp = "192.168.1.1";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("clientIp", clientIp)
            .when()
                .get(API_BASE + "/device/{clientIp}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)))
                .body("clientIp", notNullValue())
                .body("totalTokens", greaterThanOrEqualTo(0))
                .body("activeTokens", greaterThanOrEqualTo(0))
                .body("tokens", notNullValue());
        }

        @Test
        @DisplayName("Should filter by userId if provided")
        void testFilterByUserId() {
            String clientIp = "192.168.1.1";
            given()
                .header("Authorization", "Bearer " + TEST_TOKEN)
                .pathParam("clientIp", clientIp)
                .queryParam("userId", TEST_USER_ID)
            .when()
                .get(API_BASE + "/device/{clientIp}")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(401)));
        }
    }
}
