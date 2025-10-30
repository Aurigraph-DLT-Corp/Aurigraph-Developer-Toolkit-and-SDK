package io.aurigraph.v11.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Phase 1 Endpoints Test Suite
 *
 * Tests for 12 critical Phase 1 endpoints:
 * 1. Network Topology
 * 2. Block Search
 * 3. Transaction Submit
 * 4. Validator Performance
 * 5. Validator Slashing
 * 6. AI Model Metrics
 * 7. AI Predictions
 * 8. Security Audit Logs
 * 9. Bridge Transfers
 * 10. Bridge Status
 * 11. RWA Assets
 * 12. Portfolio Rebalance
 */
@QuarkusTest
public class Phase1EndpointsTest {

    // ==================== ENDPOINT 1: Network Topology ====================

    @Test
    @DisplayName("Test GET /api/v11/blockchain/network/topology")
    public void testNetworkTopology() {
        given()
            .when().get("/api/v11/blockchain/network/topology")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("networkId", equalTo("aurigraph-v11-mainnet"))
                .body("totalNodes", greaterThan(0))
                .body("activeValidators", greaterThan(0))
                .body("nodes", not(empty()))
                .body("connections", not(empty()))
                .body("networkHealth", equalTo("HEALTHY"));
    }

    // ==================== ENDPOINT 2: Block Search ====================

    @Test
    @DisplayName("Test GET /api/v11/blockchain/blocks/search")
    public void testBlockSearch() {
        given()
            .queryParam("limit", 10)
            .when().get("/api/v11/blockchain/blocks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalResults", greaterThan(0))
                .body("blocks", not(empty()))
                .body("blocks[0].blockNumber", notNullValue())
                .body("blocks[0].blockHash", startsWith("0x"));
    }

    @Test
    @DisplayName("Test block search with filters")
    public void testBlockSearchWithFilters() {
        given()
            .queryParam("minTransactions", 100)
            .queryParam("limit", 5)
            .when().get("/api/v11/blockchain/blocks/search")
            .then()
                .statusCode(200)
                .body("blocks", not(empty()));
    }

    // ==================== ENDPOINT 3: Transaction Submit ====================

    @Test
    @DisplayName("Test POST /api/v11/blockchain/transactions/submit")
    public void testSubmitTransaction() {
        String requestBody = """
            {
                "from": "0xabcd1234",
                "to": "0xefgh5678",
                "amount": 1000.50,
                "gasLimit": 21000
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/blockchain/transactions/submit")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("PENDING"))
                .body("amount", equalTo(1000.50f));
    }

    @Test
    @DisplayName("Test transaction submit with invalid data")
    public void testSubmitTransactionInvalid() {
        String requestBody = """
            {
                "from": "0xabcd1234",
                "amount": -100
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/blockchain/transactions/submit")
            .then()
                .statusCode(400);
    }

    // ==================== ENDPOINT 4: Validator Performance ====================

    @Test
    @DisplayName("Test GET /api/v11/validators/{id}/performance")
    public void testValidatorPerformance() {
        given()
            .pathParam("id", "validator-001")
            .when().get("/api/v11/validators/{id}/performance")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("validatorId", equalTo("validator-001"))
                .body("status", notNullValue())
                .body("uptime", greaterThan(0f))
                .body("performanceScore", greaterThan(0f))
                .body("historicalPerformance", not(empty()));
    }

    // ==================== ENDPOINT 5: Validator Slashing ====================

    @Test
    @DisplayName("Test POST /api/v11/validators/{id}/slash")
    public void testSlashValidator() {
        String requestBody = """
            {
                "reason": "Double signing detected",
                "slashAmount": 50000.0,
                "evidence": "Block evidence hash",
                "proposer": "governance-committee"
            }
            """;

        given()
            .pathParam("id", "validator-042")
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/validators/{id}/slash")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("validatorId", equalTo("validator-042"))
                .body("status", equalTo("EXECUTED"))
                .body("slashAmount", equalTo(50000.0f))
                .body("transactionHash", startsWith("0x"));
    }

    // ==================== ENDPOINT 6: AI Model Metrics ====================

    @Test
    @DisplayName("Test GET /api/v11/ai/models/{id}/metrics")
    public void testAIModelMetrics() {
        given()
            .pathParam("id", "consensus-optimizer-v3")
            .when().get("/api/v11/ai/models/{id}/metrics")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("modelId", equalTo("consensus-optimizer-v3"))
                .body("accuracy", greaterThan(0f))
                .body("precision", greaterThan(0f))
                .body("throughput", greaterThan(0f))
                .body("historicalMetrics", not(empty()));
    }

    // ==================== ENDPOINT 7: AI Predictions ====================

    @Test
    @DisplayName("Test GET /api/v11/ai/consensus/predictions")
    public void testAIPredictions() {
        given()
            .queryParam("horizon", "1h")
            .when().get("/api/v11/ai/consensus/predictions")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("predictions", not(empty()))
                .body("totalPredictions", greaterThan(0))
                .body("averageConfidence", greaterThan(0f))
                .body("predictions[0].type", notNullValue())
                .body("predictions[0].confidence", greaterThan(0f));
    }

    // ==================== ENDPOINT 8: Security Audit Logs ====================

    @Test
    @DisplayName("Test GET /api/v11/security/audit-logs")
    public void testSecurityAuditLogs() {
        given()
            .queryParam("limit", 20)
            .when().get("/api/v11/security/audit-logs")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalLogs", greaterThan(0))
                .body("logs", not(empty()))
                .body("summary", notNullValue())
                .body("logs[0].logId", notNullValue())
                .body("logs[0].severity", notNullValue());
    }

    @Test
    @DisplayName("Test audit logs with severity filter")
    public void testAuditLogsWithFilter() {
        given()
            .queryParam("severity", "CRITICAL")
            .queryParam("limit", 10)
            .when().get("/api/v11/security/audit-logs")
            .then()
                .statusCode(200)
                .body("logs", not(empty()));
    }

    // ==================== ENDPOINT 9: Bridge Transfers ====================

    @Test
    @DisplayName("Test POST /api/v11/bridge/transfers/initiate")
    public void testBridgeTransfer() {
        String requestBody = """
            {
                "sourceChain": "ethereum",
                "destinationChain": "polygon",
                "asset": "USDC",
                "amount": 5000.0,
                "senderAddress": "0x1234abcd",
                "recipientAddress": "0x5678efgh"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/bridge/transfers/initiate")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("transferId", notNullValue())
                .body("status", equalTo("INITIATED"))
                .body("sourceChain", equalTo("ethereum"))
                .body("destinationChain", equalTo("polygon"))
                .body("amount", equalTo(5000.0f))
                .body("sourceTransactionHash", startsWith("0x"));
    }

    @Test
    @DisplayName("Test bridge transfer with invalid data")
    public void testBridgeTransferInvalid() {
        String requestBody = """
            {
                "sourceChain": "ethereum",
                "amount": -100
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/bridge/transfers/initiate")
            .then()
                .statusCode(400);
    }

    // ==================== ENDPOINT 10: Bridge Status ====================

    @Test
    @DisplayName("Test GET /api/v11/bridge/operational/status")
    public void testBridgeStatus() {
        given()
            .when().get("/api/v11/bridge/operational/status")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("overallStatus", notNullValue())
                .body("bridgeVersion", notNullValue())
                .body("supportedChains", not(empty()))
                .body("activeRelayers", greaterThan(0))
                .body("activeValidators", greaterThan(0))
                .body("liquidityPools", notNullValue());
    }

    // ==================== ENDPOINT 11: RWA Assets ====================

    @Test
    @DisplayName("Test GET /api/v11/rwa/assets")
    public void testRWAAssets() {
        given()
            .queryParam("limit", 20)
            .when().get("/api/v11/rwa/assets")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalAssets", greaterThan(0))
                .body("assets", not(empty()))
                .body("summary", notNullValue())
                .body("assets[0].assetId", notNullValue())
                .body("assets[0].assetType", notNullValue())
                .body("assets[0].totalValue", greaterThan(0f));
    }

    @Test
    @DisplayName("Test RWA assets with filters")
    public void testRWAAssetsWithFilters() {
        given()
            .queryParam("assetType", "REAL_ESTATE")
            .queryParam("status", "ACTIVE")
            .when().get("/api/v11/rwa/assets")
            .then()
                .statusCode(200)
                .body("assets", not(empty()));
    }

    // ==================== ENDPOINT 12: Portfolio Rebalance ====================

    @Test
    @DisplayName("Test POST /api/v11/rwa/portfolio/rebalance")
    public void testPortfolioRebalance() {
        String requestBody = """
            {
                "userId": "user-12345",
                "strategy": "BALANCED"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/rwa/portfolio/rebalance")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("rebalanceId", notNullValue())
                .body("userId", equalTo("user-12345"))
                .body("strategy", equalTo("BALANCED"))
                .body("status", equalTo("COMPLETED"))
                .body("currentPortfolio", notNullValue())
                .body("targetPortfolio", notNullValue())
                .body("trades", not(empty()));
    }

    @Test
    @DisplayName("Test portfolio rebalance with aggressive strategy")
    public void testPortfolioRebalanceAggressive() {
        String requestBody = """
            {
                "userId": "user-67890",
                "strategy": "AGGRESSIVE"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/rwa/portfolio/rebalance")
            .then()
                .statusCode(200)
                .body("strategy", equalTo("AGGRESSIVE"))
                .body("riskScore", greaterThan(60f));
    }

    // ==================== ENDPOINT 13: Blockchain Events ====================

    @Test
    @DisplayName("Test GET /api/v11/blockchain/events")
    public void testBlockchainEvents() {
        given()
            .queryParam("limit", 30)
            .when().get("/api/v11/blockchain/events")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalEvents", greaterThan(0))
                .body("events", not(empty()))
                .body("events[0].eventId", notNullValue())
                .body("events[0].eventType", notNullValue())
                .body("hasMore", notNullValue());
    }

    @Test
    @DisplayName("Test blockchain events with type filter")
    public void testBlockchainEventsWithFilter() {
        given()
            .queryParam("eventType", "BLOCK_CREATED")
            .queryParam("limit", 10)
            .when().get("/api/v11/blockchain/events")
            .then()
                .statusCode(200)
                .body("events", not(empty()));
    }
}
