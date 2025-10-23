package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive API Endpoint Test Suite
 * Tests all 26 endpoints (12 Phase 1 + 14 Phase 2)
 * Uses REST Assured for fluent API testing
 */
@QuarkusTest
@DisplayName("Comprehensive API Endpoint Tests")
public class ComprehensiveApiEndpointTest {

    private static final String BASE_PATH = "/api/v11";

    @BeforeEach
    void setup() {
        RestAssured.basePath = BASE_PATH;
        RestAssured.port = 9003;
    }

    // ==================== PHASE 1: HIGH-PRIORITY ENDPOINTS (12) ====================

    @Nested
    @DisplayName("Phase 1: High-Priority Endpoints")
    class Phase1HighPriorityTests {

        @Nested
        @DisplayName("AI Endpoints")
        class AIEndpointTests {

            @Test
            @DisplayName("POST /ai/optimize - Optimize model")
            void testOptimizeModel() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"modelId\":\"model123\",\"targetTps\":2000000,\"strategy\":\"aggressive\"}")
                .when()
                    .post("/ai/optimize")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("status", notNullValue())
                    .body("optimizationLevel", notNullValue());
            }

            @Test
            @DisplayName("GET /ai/models - Get all models")
            void testGetAIModels() {
                given()
                .when()
                    .get("/ai/models")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("models", notNullValue());
            }

            @Test
            @DisplayName("GET /ai/performance - Get AI performance metrics")
            void testGetAIPerformance() {
                given()
                .when()
                    .get("/ai/performance")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("avgLatency", greaterThan(0F));
            }
        }

        @Nested
        @DisplayName("RWA Endpoints")
        class RWAEndpointTests {

            @Test
            @DisplayName("POST /rwa/transfer - Transfer RWA assets")
            void testRWATransfer() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"fromAddress\":\"addr1\",\"toAddress\":\"addr2\",\"tokenId\":\"token1\",\"amount\":\"100\",\"fee\":\"1\"}")
                .when()
                    .post("/rwa/transfer")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("transactionId", notNullValue())
                    .body("status", equalTo("PENDING"));
            }

            @Test
            @DisplayName("GET /rwa/tokens - List all RWA tokens")
            void testListRWATokens() {
                given()
                .when()
                    .get("/rwa/tokens")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("tokens", notNullValue());
            }

            @Test
            @DisplayName("GET /rwa/status - Get RWA registry status")
            void testGetRWAStatus() {
                given()
                .when()
                    .get("/rwa/status")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("totalTokens", greaterThanOrEqualTo(0));
            }
        }

        @Nested
        @DisplayName("Bridge Endpoints")
        class BridgeEndpointTests {

            @Test
            @DisplayName("POST /bridge/validate - Validate bridge transaction")
            void testValidateBridgeTransaction() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"transactionHash\":\"0xabc123\",\"sourceChain\":\"ethereum\",\"targetChain\":\"bsc\",\"amount\":\"100\",\"metadata\":\"\"}")
                .when()
                    .post("/bridge/validate")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("transactionHash", notNullValue())
                    .body("isValid", notNullValue());
            }

            @Test
            @DisplayName("GET /bridge/stats - Get bridge statistics")
            void testGetBridgeStats() {
                given()
                .when()
                    .get("/bridge/stats")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("totalTransfers", greaterThanOrEqualTo(0));
            }

            @Test
            @DisplayName("GET /bridge/supported-chains - Get supported chains")
            void testGetSupportedChains() {
                given()
                .when()
                    .get("/bridge/supported-chains")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("totalChains", greaterThan(0))
                    .body("chains", notNullValue());
            }
        }
    }

    // ==================== PHASE 2: MEDIUM-PRIORITY ENDPOINTS (14) ====================

    @Nested
    @DisplayName("Phase 2: Medium-Priority Endpoints")
    class Phase2MediumPriorityTests {

        @Nested
        @DisplayName("AI Medium-Priority Endpoints")
        class AIMediumTests {

            @Test
            @DisplayName("GET /ai/status - Get AI system status")
            void testGetAIStatus() {
                given()
                .when()
                    .get("/ai/status")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("systemStatus", notNullValue())
                    .body("uptime", greaterThan(0L));
            }

            @Test
            @DisplayName("GET /ai/training/status - Get training progress")
            void testGetTrainingStatus() {
                given()
                .when()
                    .get("/ai/training/status")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("trainingProgress", greaterThanOrEqualTo(0));
            }

            @Test
            @DisplayName("POST /ai/models/{id}/config - Configure model")
            void testConfigureModel() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"learningRate\":0.001,\"optimizer\":\"adam\",\"epochs\":100}")
                .when()
                    .post("/ai/models/model123/config")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("modelId", notNullValue())
                    .body("configStatus", equalTo("APPLIED"));
            }
        }

        @Nested
        @DisplayName("Security Medium-Priority Endpoints")
        class SecurityMediumTests {

            @Test
            @DisplayName("GET /security/keys/{id} - Get key details")
            void testGetKeyDetails() {
                given()
                .when()
                    .get("/security/keys/key123")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("keyId", notNullValue());
            }

            @Test
            @DisplayName("DELETE /security/keys/{id} - Delete key")
            void testDeleteKey() {
                given()
                .when()
                    .delete("/security/keys/key123")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("status", notNullValue());
            }

            @Test
            @DisplayName("GET /security/vulnerabilities - Get vulnerability scan results")
            void testGetVulnerabilities() {
                given()
                .when()
                    .get("/security/vulnerabilities")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("vulnerabilityCount", greaterThanOrEqualTo(0));
            }

            @Test
            @DisplayName("POST /security/scan - Initiate security scan")
            void testInitiateScan() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"scanType\":\"FULL\",\"modules\":[]}")
                .when()
                    .post("/security/scan")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("scanId", notNullValue())
                    .body("status", equalTo("INITIATED"));
            }
        }

        @Nested
        @DisplayName("RWA Medium-Priority Endpoints")
        class RWAMediumTests {

            @Test
            @DisplayName("GET /rwa/valuation - Get asset valuations")
            void testGetValuation() {
                given()
                .when()
                    .get("/rwa/valuation")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("totalValuation", notNullValue());
            }

            @Test
            @DisplayName("POST /rwa/portfolio - Create portfolio")
            void testCreatePortfolio() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"portfolioName\":\"Portfolio1\",\"assets\":[\"ASSET1\",\"ASSET2\"],\"allocation\":{\"ASSET1\":60,\"ASSET2\":40}}")
                .when()
                    .post("/rwa/portfolio")
                .then()
                    .statusCode(201)
                    .contentType(ContentType.JSON)
                    .body("portfolioId", notNullValue());
            }

            @Test
            @DisplayName("GET /rwa/compliance/{tokenId} - Check compliance")
            void testGetCompliance() {
                given()
                .when()
                    .get("/rwa/compliance/token123")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("tokenId", notNullValue())
                    .body("isCompliant", notNullValue());
            }

            @Test
            @DisplayName("POST /rwa/fractional - Create fractional shares")
            void testCreateFractional() {
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"tokenId\":\"token123\",\"shares\":1000,\"sharePrice\":\"10.50\"}")
                .when()
                    .post("/rwa/fractional")
                .then()
                    .statusCode(201)
                    .contentType(ContentType.JSON)
                    .body("fractionalId", notNullValue());
            }

            @Test
            @DisplayName("GET /rwa/dividends - Get dividend information")
            void testGetDividends() {
                given()
                .when()
                    .get("/rwa/dividends")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("totalDividends", notNullValue());
            }
        }

        @Nested
        @DisplayName("Bridge Medium-Priority Endpoints")
        class BridgeMediumTests {

            @Test
            @DisplayName("GET /bridge/liquidity - Get liquidity status")
            void testGetLiquidity() {
                given()
                .when()
                    .get("/bridge/liquidity")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("totalLiquidity", notNullValue())
                    .body("utilizationRate", greaterThanOrEqualTo(0.0));
            }

            @Test
            @DisplayName("GET /bridge/fees - Get current fees")
            void testGetFees() {
                given()
                .when()
                    .get("/bridge/fees")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("baseFee", greaterThan(0.0))
                    .body("averageFee", greaterThan(0.0));
            }

            @Test
            @DisplayName("GET /bridge/transfers/{txId} - Get transfer details")
            void testGetTransferDetails() {
                given()
                .when()
                    .get("/bridge/transfers/tx123")
                .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("transactionId", notNullValue())
                    .body("status", notNullValue());
            }
        }
    }

    // ==================== CORE HEALTH & INFO ENDPOINTS ====================

    @Nested
    @DisplayName("Core Health & Info Endpoints")
    class CoreEndpointTests {

        @Test
        @DisplayName("GET /health - Check service health")
        void testHealthCheck() {
            given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", notNullValue());
        }

        @Test
        @DisplayName("GET /info - Get service information")
        void testServiceInfo() {
            given()
            .when()
                .get("/info")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("version", notNullValue())
                .body("timestamp", notNullValue());
        }
    }

    // ==================== PERFORMANCE TESTS ====================

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Verify endpoint response times < 500ms")
        void testResponseTimePerformance() {
            given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .time(lessThan(500L), java.util.concurrent.TimeUnit.MILLISECONDS);
        }

        @Test
        @DisplayName("Verify GET endpoints return JSON content")
        void testContentTypeConsistency() {
            given()
            .when()
                .get("/ai/models")
            .then()
                .contentType(ContentType.JSON);
        }

        @Test
        @DisplayName("Verify POST endpoints return proper status codes")
        void testPOSTStatusCodes() {
            given()
                .contentType(ContentType.JSON)
                .body("{\"modelId\":\"test\",\"targetTps\":1000000,\"strategy\":\"balanced\"}")
            .when()
                .post("/ai/optimize")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(201)));
        }
    }
}
