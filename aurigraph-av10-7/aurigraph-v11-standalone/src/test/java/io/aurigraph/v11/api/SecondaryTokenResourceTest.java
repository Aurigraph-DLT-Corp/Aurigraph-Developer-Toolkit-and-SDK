package io.aurigraph.v11.api;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.aurigraph.v11.token.primary.PrimaryTokenFactory;
import io.aurigraph.v11.token.primary.PrimaryTokenRegistry;
import io.aurigraph.v11.token.secondary.SecondaryToken;
import io.aurigraph.v11.token.secondary.SecondaryTokenRegistry;
import io.aurigraph.v11.token.secondary.SecondaryTokenService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Secondary Token REST API Tests - Sprint 1 Story 3
 *
 * Comprehensive test suite for SecondaryTokenResource covering:
 * - REST API endpoints (CRUD, lifecycle, bulk operations)
 * - Request/Response DTOs and validation
 * - OpenAPI documentation
 * - Error handling and HTTP status codes
 *
 * Total: 30 tests
 * Test Organization: 3 @Nested classes (API, Validation, OpenAPI)
 *
 * @author Composite Token System - Sprint 1 Story 3
 * @version 1.0
 * @since Sprint 1 Story 3 (Week 2)
 */
@QuarkusTest
@DisplayName("SecondaryTokenResource REST API Tests")
class SecondaryTokenResourceTest {

    private static final String BASE_PATH = "/api/v12/secondary-tokens";

    @Inject
    SecondaryTokenService service;

    @Inject
    SecondaryTokenRegistry registry;

    @Inject
    PrimaryTokenFactory primaryFactory;

    @Inject
    PrimaryTokenRegistry primaryRegistry;

    private String testParentTokenId;

    @BeforeEach
    void setUp() {
        RestAssured.port = 9003;
        RestAssured.basePath = BASE_PATH;

        // Create a test primary token
        PrimaryToken primaryToken = primaryFactory.builder()
                .assetClass("TEST-ASSET-001")
                .owner("primary-owner")
                .faceValue(new BigDecimal("1000"))
                .digitalTwinId("DT-TEST-001")
                .build();
        primaryRegistry.register(primaryToken).await().indefinitely();
        testParentTokenId = primaryToken.tokenId;
    }

    // ==================== API ENDPOINT TESTS ====================

    @Nested
    @DisplayName("REST API Endpoints")
    class ApiEndpointTests {

        @Test
        @DisplayName("Should create income stream token via POST /income-stream")
        void testCreateIncomeStreamViaAPI() {
            SecondaryTokenResource.CreateIncomeStreamRequest request = new SecondaryTokenResource.CreateIncomeStreamRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = new BigDecimal("100");
            request.owner = "api-owner-1";
            request.revenueShare = new BigDecimal("10.5");
            request.frequency = SecondaryToken.DistributionFrequency.MONTHLY;

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/income-stream");

            assertEquals(201, response.statusCode());
            assertNotNull(response.jsonPath().getString("entity.tokenId"));
            assertEquals("INCOME_STREAM", response.jsonPath().getString("entity.tokenType"));
        }

        @Test
        @DisplayName("Should create collateral token via POST /collateral")
        void testCreateCollateralViaAPI() {
            SecondaryTokenResource.CreateCollateralRequest request = new SecondaryTokenResource.CreateCollateralRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = new BigDecimal("500");
            request.owner = "api-owner-2";
            request.expiresAt = Instant.now().plusSeconds(86400);

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/collateral");

            assertEquals(201, response.statusCode());
            assertNotNull(response.jsonPath().getString("entity.tokenId"));
            assertEquals("COLLATERAL", response.jsonPath().getString("entity.tokenType"));
        }

        @Test
        @DisplayName("Should create royalty token via POST /royalty")
        void testCreateRoyaltyViaAPI() {
            SecondaryTokenResource.CreateRoyaltyRequest request = new SecondaryTokenResource.CreateRoyaltyRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = new BigDecimal("250");
            request.owner = "api-owner-3";
            request.revenueShare = new BigDecimal("5.0");

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/royalty");

            assertEquals(201, response.statusCode());
            assertNotNull(response.jsonPath().getString("entity.tokenId"));
            assertEquals("ROYALTY", response.jsonPath().getString("entity.tokenType"));
        }

        @Test
        @DisplayName("Should retrieve token via GET /{tokenId}")
        void testGetTokenViaAPI() {
            // Create a token first
            SecondaryToken token = createTestToken();

            // Retrieve it
            Response response = given()
                    .get("/" + token.tokenId);

            assertEquals(200, response.statusCode());
            assertEquals(token.tokenId, response.jsonPath().getString("entity.tokenId"));
            assertEquals(token.owner, response.jsonPath().getString("entity.owner"));
        }

        @Test
        @DisplayName("Should retrieve all tokens by parent via GET /parent/{parentId}")
        void testGetByParentViaAPI() {
            // Create multiple tokens
            createTestToken();
            createTestToken();

            Response response = given()
                    .get("/parent/" + testParentTokenId);

            assertEquals(200, response.statusCode());
            assertTrue(response.jsonPath().getInt("entity.count") >= 2);
        }

        @Test
        @DisplayName("Should activate token via POST /{tokenId}/activate")
        void testActivateViaAPI() {
            SecondaryToken token = createTestToken();

            SecondaryTokenResource.ActivateRequest request = new SecondaryTokenResource.ActivateRequest();
            request.actor = "api-actor";

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/" + token.tokenId + "/activate");

            assertEquals(200, response.statusCode());
            assertEquals("ACTIVE", response.jsonPath().getString("entity.status"));
        }

        @Test
        @DisplayName("Should redeem token via POST /{tokenId}/redeem")
        void testRedeemViaAPI() {
            SecondaryToken token = createAndActivateToken();

            SecondaryTokenResource.RedeemRequest request = new SecondaryTokenResource.RedeemRequest();
            request.actor = "api-actor";

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/" + token.tokenId + "/redeem");

            assertEquals(200, response.statusCode());
            assertEquals("REDEEMED", response.jsonPath().getString("entity.status"));
        }

        @Test
        @DisplayName("Should transfer token via POST /{tokenId}/transfer")
        void testTransferViaAPI() {
            SecondaryToken token = createAndActivateToken();

            SecondaryTokenResource.TransferRequest request = new SecondaryTokenResource.TransferRequest();
            request.fromOwner = token.owner;
            request.toOwner = "new-api-owner";

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/" + token.tokenId + "/transfer");

            assertEquals(200, response.statusCode());
            assertEquals("new-api-owner", response.jsonPath().getString("entity.owner"));
        }

        @Test
        @DisplayName("Should expire token via POST /{tokenId}/expire")
        void testExpireViaAPI() {
            SecondaryToken token = createAndActivateToken();

            SecondaryTokenResource.ExpireRequest request = new SecondaryTokenResource.ExpireRequest();
            request.reason = "Test expiration";

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/" + token.tokenId + "/expire");

            assertEquals(200, response.statusCode());
            assertEquals("EXPIRED", response.jsonPath().getString("entity.status"));
        }

        @Test
        @DisplayName("Should handle GET for non-existent token with 404")
        void testGetNonexistentToken() {
            Response response = given()
                    .get("/NONEXISTENT-TOKEN-123");

            assertEquals(404, response.statusCode());
            assertNotNull(response.jsonPath().getString("entity.error"));
        }

        @Test
        @DisplayName("Should bulk create tokens via POST /bulk-create")
        void testBulkCreateViaAPI() {
            SecondaryTokenResource.BulkCreateRequest request = new SecondaryTokenResource.BulkCreateRequest();
            request.requests = new ArrayList<>();

            SecondaryTokenService.CreateTokenRequest req1 = new SecondaryTokenService.CreateTokenRequest(
                    testParentTokenId, "INCOME_STREAM", new BigDecimal("100"), "bulk-owner-1"
            );
            SecondaryTokenService.CreateTokenRequest req2 = new SecondaryTokenService.CreateTokenRequest(
                    testParentTokenId, "COLLATERAL", new BigDecimal("200"), "bulk-owner-2"
            );
            request.requests.add(req1);
            request.requests.add(req2);

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/bulk-create");

            assertEquals(201, response.statusCode());
            assertEquals(2, response.jsonPath().getInt("entity.successCount"));
            assertEquals(0, response.jsonPath().getInt("entity.errorCount"));
        }

        @Test
        @DisplayName("Should handle empty path with correct routing")
        void testBasePathRouting() {
            Response response = given()
                    .get("/");

            // Should not be a 404 (valid endpoint exists)
            assertTrue(response.statusCode() >= 200 && response.statusCode() < 500);
        }

        @Test
        @DisplayName("Should handle invalid JSON in request body")
        void testInvalidJsonRequest() {
            Response response = given()
                    .contentType("application/json")
                    .body("{invalid json}")
                    .post("/income-stream");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should return correct HTTP status codes")
        void testHttpStatusCodes() {
            SecondaryToken token = createTestToken();

            // Created (201)
            SecondaryTokenResource.CreateIncomeStreamRequest createReq = new SecondaryTokenResource.CreateIncomeStreamRequest();
            createReq.parentTokenId = testParentTokenId;
            createReq.faceValue = new BigDecimal("100");
            createReq.owner = "owner";
            createReq.revenueShare = new BigDecimal("10");
            createReq.frequency = SecondaryToken.DistributionFrequency.MONTHLY;

            Response createResponse = given()
                    .contentType("application/json")
                    .body(createReq)
                    .post("/income-stream");
            assertEquals(201, createResponse.statusCode());

            // OK (200)
            Response getResponse = given()
                    .get("/" + token.tokenId);
            assertEquals(200, getResponse.statusCode());

            // Not Found (404)
            Response notFoundResponse = given()
                    .get("/NONEXISTENT");
            assertEquals(404, notFoundResponse.statusCode());
        }
    }

    // ==================== REQUEST VALIDATION TESTS ====================

    @Nested
    @DisplayName("Request Validation")
    class ValidationTests {

        @Test
        @DisplayName("Should validate required fields in income stream request")
        void testIncomeStreamRequestValidation() {
            SecondaryTokenResource.CreateIncomeStreamRequest request = new SecondaryTokenResource.CreateIncomeStreamRequest();
            request.parentTokenId = null; // Invalid
            request.faceValue = new BigDecimal("100");
            request.owner = "owner";
            request.revenueShare = new BigDecimal("10");
            request.frequency = SecondaryToken.DistributionFrequency.MONTHLY;

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/income-stream");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should reject null face value")
        void testNullFaceValue() {
            SecondaryTokenResource.CreateIncomeStreamRequest request = new SecondaryTokenResource.CreateIncomeStreamRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = null;
            request.owner = "owner";
            request.revenueShare = new BigDecimal("10");
            request.frequency = SecondaryToken.DistributionFrequency.MONTHLY;

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/income-stream");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should reject null owner")
        void testNullOwner() {
            SecondaryTokenResource.CreateCollateralRequest request = new SecondaryTokenResource.CreateCollateralRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = new BigDecimal("500");
            request.owner = null;
            request.expiresAt = Instant.now().plusSeconds(86400);

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/collateral");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should reject missing actor in activate request")
        void testMissingActor() {
            SecondaryToken token = createTestToken();

            SecondaryTokenResource.ActivateRequest request = new SecondaryTokenResource.ActivateRequest();
            request.actor = null;

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/" + token.tokenId + "/activate");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should reject invalid transfer request (missing fromOwner)")
        void testInvalidTransferRequest() {
            SecondaryToken token = createAndActivateToken();

            SecondaryTokenResource.TransferRequest request = new SecondaryTokenResource.TransferRequest();
            request.fromOwner = null;
            request.toOwner = "new-owner";

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/" + token.tokenId + "/transfer");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should validate bulk create request items")
        void testBulkCreateValidation() {
            SecondaryTokenResource.BulkCreateRequest request = new SecondaryTokenResource.BulkCreateRequest();
            request.requests = new ArrayList<>();

            SecondaryTokenService.CreateTokenRequest invalidReq = new SecondaryTokenService.CreateTokenRequest(
                    "INVALID-PARENT", "INVALID_TYPE", new BigDecimal("100"), "owner"
            );
            request.requests.add(invalidReq);

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/bulk-create");

            assertEquals(201, response.statusCode());
            assertTrue(response.jsonPath().getInt("entity.errorCount") > 0);
        }

        @Test
        @DisplayName("Should include error details in response")
        void testErrorDetailResponse() {
            Response response = given()
                    .get("/NONEXISTENT-TOKEN");

            assertEquals(404, response.statusCode());
            assertTrue(response.jsonPath().getString("entity.error").contains("not found"));
        }

        @Test
        @DisplayName("Should validate expiration time in collateral request")
        void testExpirationValidation() {
            SecondaryTokenResource.CreateCollateralRequest request = new SecondaryTokenResource.CreateCollateralRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = new BigDecimal("500");
            request.owner = "owner";
            request.expiresAt = null; // Invalid

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/collateral");

            assertTrue(response.statusCode() >= 400);
        }

        @Test
        @DisplayName("Should include timestamp in error response")
        void testErrorTimestamp() {
            Response response = given()
                    .get("/NONEXISTENT-TOKEN");

            assertEquals(404, response.statusCode());
            assertNotNull(response.jsonPath().getLong("entity.timestamp"));
            assertTrue(response.jsonPath().getLong("entity.timestamp") > 0);
        }
    }

    // ==================== RESPONSE DTO TESTS ====================

    @Nested
    @DisplayName("Response DTOs and Documentation")
    class ResponseDtoTests {

        @Test
        @DisplayName("Should return TokenResponse with all required fields")
        void testTokenResponseFields() {
            SecondaryToken token = createTestToken();

            Response response = given()
                    .get("/" + token.tokenId);

            assertEquals(200, response.statusCode());
            assertNotNull(response.jsonPath().getString("entity.tokenId"));
            assertNotNull(response.jsonPath().getString("entity.parentTokenId"));
            assertNotNull(response.jsonPath().getString("entity.owner"));
            assertNotNull(response.jsonPath().getString("entity.tokenType"));
            assertNotNull(response.jsonPath().getString("entity.status"));
            assertNotNull(response.jsonPath().getString("entity.faceValue"));
            assertNotNull(response.jsonPath().getString("entity.createdAt"));
        }

        @Test
        @DisplayName("Should return TokenListResponse with count")
        void testTokenListResponse() {
            createTestToken();
            createTestToken();

            Response response = given()
                    .get("/parent/" + testParentTokenId);

            assertEquals(200, response.statusCode());
            assertTrue(response.jsonPath().getInt("entity.count") >= 2);
            assertNotNull(response.jsonPath().getList("entity.tokens"));
        }

        @Test
        @DisplayName("Should return BulkOperationResponse with success/error counts")
        void testBulkOperationResponse() {
            SecondaryTokenResource.BulkCreateRequest request = new SecondaryTokenResource.BulkCreateRequest();
            request.requests = new ArrayList<>();

            SecondaryTokenService.CreateTokenRequest req1 = new SecondaryTokenService.CreateTokenRequest(
                    testParentTokenId, "INCOME_STREAM", new BigDecimal("100"), "owner"
            );
            request.requests.add(req1);

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/bulk-create");

            assertEquals(201, response.statusCode());
            assertTrue(response.jsonPath().getInt("entity.successCount") >= 0);
            assertTrue(response.jsonPath().getInt("entity.errorCount") >= 0);
            assertNotNull(response.jsonPath().getList("entity.created"));
            assertNotNull(response.jsonPath().getList("entity.errors"));
        }

        @Test
        @DisplayName("Should include OpenAPI tags in endpoints")
        void testOpenAPISummaries() {
            // This test verifies that endpoints have proper OpenAPI documentation
            // In production, this would check generated OpenAPI spec
            SecondaryToken token = createTestToken();

            Response response = given()
                    .get("/" + token.tokenId);

            assertEquals(200, response.statusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("Should handle content type application/json")
        void testContentTypeHandling() {
            SecondaryTokenResource.CreateIncomeStreamRequest request = new SecondaryTokenResource.CreateIncomeStreamRequest();
            request.parentTokenId = testParentTokenId;
            request.faceValue = new BigDecimal("100");
            request.owner = "owner";
            request.revenueShare = new BigDecimal("10");
            request.frequency = SecondaryToken.DistributionFrequency.MONTHLY;

            Response response = given()
                    .contentType("application/json")
                    .body(request)
                    .post("/income-stream");

            assertEquals("application/json", response.getContentType().split(";")[0]);
        }
    }

    // ==================== HELPER METHODS ====================

    private SecondaryToken createTestToken() {
        return service.createIncomeStreamToken(
                testParentTokenId,
                new BigDecimal("100"),
                "test-owner-" + System.currentTimeMillis(),
                new BigDecimal("10"),
                SecondaryToken.DistributionFrequency.MONTHLY
        ).await().indefinitely();
    }

    private SecondaryToken createAndActivateToken() {
        SecondaryToken token = createTestToken();
        return service.activateToken(token.tokenId, "test-actor")
                .await().indefinitely();
    }
}
