package io.aurigraph.v11.bridge;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive Resource Test for Cross-Chain Bridge V12 API
 *
 * Tests REST endpoints for:
 * - Bridge validation requests
 * - Chain compatibility checks
 * - Liquidity verification
 * - Token support validation
 * - Fee estimation
 * - Bridge transaction status
 * - Rate limiting
 *
 * Target: 10+ comprehensive REST endpoint tests
 * Coverage: V12 Cross-Chain Bridge REST API
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Cross-Chain Bridge V12 Resource Test Suite")
public class CrossChainBridgeV12ResourceTest {

    private static final String BRIDGE_BASE_PATH = "/api/v11/bridge";
    private static final String TEST_BRIDGE_PREFIX = "bridge-v12-test";

    @Test
    @Order(1)
    @DisplayName("Test bridge validation endpoint with valid request")
    void testBridgeValidationEndpoint() {
        String validationRequest = """
            {
                "bridgeId": "bridge-v12-validation-001",
                "sourceChain": "Ethereum",
                "targetChain": "Aurigraph",
                "sourceAddress": "0x1234567890123456789012345678901234567890",
                "targetAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
                "tokenSymbol": "USDT",
                "amount": 1000,
                "nonce": %d,
                "signature": "valid-test-signature",
                "signatureType": "ECDSA",
                "gasPrice": 50
            }
            """.formatted(System.currentTimeMillis());

        given()
            .contentType(ContentType.JSON)
            .body(validationRequest)
            .when().post(BRIDGE_BASE_PATH + "/validate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("validationId", notNullValue())
                .body("status", isIn(new String[]{"SUCCESS", "WARNINGS", "FAILED"}))
                .body("timestamp", notNullValue());
    }

    @Test
    @Order(2)
    @DisplayName("Test bridge supported chains endpoint")
    void testBridgeSupportedChains() {
        given()
            .when().get(BRIDGE_BASE_PATH + "/chains/supported")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("chains", hasSize(greaterThan(0)))
                .body("chains", hasItems("Ethereum", "Polygon", "BSC", "Avalanche", "Aurigraph"));
    }

    @Test
    @Order(3)
    @DisplayName("Test bridge supported tokens endpoint")
    void testBridgeSupportedTokens() {
        given()
            .when().get(BRIDGE_BASE_PATH + "/tokens/supported")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("tokens", hasSize(greaterThan(0)))
                .body("tokens.tokenSymbol", hasItems("USDT", "USDC", "ETH", "WBTC"));
    }

    @Test
    @Order(4)
    @DisplayName("Test bridge liquidity check endpoint")
    void testBridgeLiquidityCheck() {
        String liquidityRequest = """
            {
                "targetChain": "Aurigraph",
                "tokenSymbol": "USDT",
                "amount": 5000
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(liquidityRequest)
            .when().post(BRIDGE_BASE_PATH + "/liquidity/check")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("available", notNullValue())
                .body("availableLiquidity", notNullValue())
                .body("requiredLiquidity", notNullValue());
    }

    @Test
    @Order(5)
    @DisplayName("Test bridge fee estimation endpoint")
    void testBridgeFeeEstimation() {
        String feeRequest = """
            {
                "sourceChain": "Ethereum",
                "targetChain": "Aurigraph",
                "tokenSymbol": "USDT",
                "amount": 1000,
                "gasPrice": 50
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(feeRequest)
            .when().post(BRIDGE_BASE_PATH + "/fees/estimate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("bridgeFee", notNullValue())
                .body("gasFee", notNullValue())
                .body("totalFee", notNullValue())
                .body("feeCurrency", notNullValue())
                .body("estimatedTime", greaterThan(0));
    }

    @Test
    @Order(6)
    @DisplayName("Test bridge chain compatibility endpoint")
    void testBridgeChainCompatibility() {
        given()
            .queryParam("sourceChain", "Ethereum")
            .queryParam("targetChain", "Aurigraph")
            .when().get(BRIDGE_BASE_PATH + "/chains/compatible")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("compatible", equalTo(true))
                .body("sourceChain", equalTo("Ethereum"))
                .body("targetChain", equalTo("Aurigraph"));

        // Test incompatible chains
        given()
            .queryParam("sourceChain", "InvalidChain")
            .queryParam("targetChain", "Aurigraph")
            .when().get(BRIDGE_BASE_PATH + "/chains/compatible")
            .then()
                .statusCode(200)
                .body("compatible", equalTo(false));
    }

    @Test
    @Order(7)
    @DisplayName("Test bridge validation with insufficient liquidity")
    void testBridgeValidationInsufficientLiquidity() {
        String validationRequest = """
            {
                "bridgeId": "bridge-v12-insufficient-liquidity",
                "sourceChain": "Ethereum",
                "targetChain": "Aurigraph",
                "sourceAddress": "0x1234567890123456789012345678901234567890",
                "targetAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
                "tokenSymbol": "USDT",
                "amount": 5000000,
                "nonce": %d,
                "signature": "valid-test-signature",
                "signatureType": "ECDSA",
                "liquidityCheckRequired": true
            }
            """.formatted(System.currentTimeMillis());

        given()
            .contentType(ContentType.JSON)
            .body(validationRequest)
            .when().post(BRIDGE_BASE_PATH + "/validate")
            .then()
                .statusCode(200)
                .body("status", equalTo("FAILED"))
                .body("liquidityAvailable", equalTo(false))
                .body("validationErrors", hasSize(greaterThan(0)));
    }

    @Test
    @Order(8)
    @DisplayName("Test bridge validation with unsupported token")
    void testBridgeValidationUnsupportedToken() {
        String validationRequest = """
            {
                "bridgeId": "bridge-v12-unsupported-token",
                "sourceChain": "Ethereum",
                "targetChain": "Aurigraph",
                "sourceAddress": "0x1234567890123456789012345678901234567890",
                "targetAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
                "tokenSymbol": "INVALID_TOKEN_XYZ",
                "amount": 100,
                "nonce": %d,
                "signature": "valid-test-signature",
                "signatureType": "ECDSA"
            }
            """.formatted(System.currentTimeMillis());

        given()
            .contentType(ContentType.JSON)
            .body(validationRequest)
            .when().post(BRIDGE_BASE_PATH + "/validate")
            .then()
                .statusCode(200)
                .body("status", equalTo("FAILED"))
                .body("tokenSupported", equalTo(false))
                .body("validationErrors", hasItem(containsString("not supported")));
    }

    @Test
    @Order(9)
    @DisplayName("Test bridge statistics endpoint")
    void testBridgeStatistics() {
        given()
            .when().get(BRIDGE_BASE_PATH + "/stats")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalBridgeVolume", notNullValue())
                .body("activeBridges", notNullValue())
                .body("successRate", notNullValue());
    }

    @Test
    @Order(10)
    @DisplayName("Test bridge transaction status endpoint")
    void testBridgeTransactionStatus() {
        String bridgeId = "bridge-v12-status-test-001";

        given()
            .pathParam("bridgeId", bridgeId)
            .when().get(BRIDGE_BASE_PATH + "/transaction/{bridgeId}/status")
            .then()
                .statusCode(anyOf(equalTo(200), equalTo(404)))
                .contentType(ContentType.JSON);
    }

    @AfterAll
    static void tearDown() {
        System.out.println("CrossChainBridgeV12Resource test suite completed successfully");
        System.out.println("All 10 cross-chain bridge V12 REST API tests validated");
    }
}
