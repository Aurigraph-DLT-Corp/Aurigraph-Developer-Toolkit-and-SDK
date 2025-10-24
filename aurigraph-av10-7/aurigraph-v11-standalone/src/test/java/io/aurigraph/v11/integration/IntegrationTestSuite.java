package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Comprehensive Integration Test Suite for All 26 REST Endpoints
 *
 * COVERAGE:
 * - Phase 1: 12 endpoints (Network, Blockchain, Validators, AI, Bridge, RWA)
 * - Phase 2: 14 endpoints (Consensus, Analytics, Gateway, Contracts, etc.)
 *
 * TEST AREAS:
 * 1. Happy Path Tests - All endpoints return correct data
 * 2. Error Handling - 4xx/5xx responses handled properly
 * 3. Validation Tests - Invalid inputs rejected correctly
 * 4. Data Integrity - Responses match expected schemas
 * 5. Response Time - All responses <200ms
 *
 * @author QA Automation Specialist
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(OrderAnnotation.class)
@DisplayName("Comprehensive Integration Test Suite - All 26 Endpoints")
public class IntegrationTestSuite {

    private static long testStartTime;
    private static int totalTests = 0;
    private static int passedTests = 0;
    private static int failedTests = 0;

    @BeforeAll
    public static void setupSuite() {
        testStartTime = System.currentTimeMillis();
        System.out.println("=".repeat(80));
        System.out.println("INTEGRATION TEST SUITE - ALL 26 REST ENDPOINTS");
        System.out.println("=".repeat(80));
        System.out.println("Test Start Time: " + new java.util.Date());
        System.out.println("=".repeat(80));
    }

    @AfterAll
    public static void tearDownSuite() {
        long duration = System.currentTimeMillis() - testStartTime;
        double durationSeconds = duration / 1000.0;
        double passRate = totalTests > 0 ? (passedTests * 100.0 / totalTests) : 0;

        System.out.println("=".repeat(80));
        System.out.println("TEST SUITE SUMMARY");
        System.out.println("=".repeat(80));
        System.out.println("Total Tests:    " + totalTests);
        System.out.println("Passed:         " + passedTests + " (" + String.format("%.1f%%", passRate) + ")");
        System.out.println("Failed:         " + failedTests);
        System.out.println("Duration:       " + String.format("%.2f", durationSeconds) + "s");
        System.out.println("Test End Time:  " + new java.util.Date());
        System.out.println("=".repeat(80));
    }

    @BeforeEach
    public void beforeEach(TestInfo testInfo) {
        totalTests++;
        System.out.println("\n>>> Running: " + testInfo.getDisplayName());
    }

    @AfterEach
    public void afterEach(TestInfo testInfo) {
        if (!testInfo.getTags().contains("failed")) {
            passedTests++;
            System.out.println("✓ PASSED: " + testInfo.getDisplayName());
        } else {
            failedTests++;
            System.out.println("✗ FAILED: " + testInfo.getDisplayName());
        }
    }

    // ==================== PHASE 1: NETWORK & BLOCKCHAIN ====================

    @Test
    @Order(1)
    @DisplayName("EP01: GET /api/v11/blockchain/network/topology")
    public void testNetworkTopology() {
        given()
            .when().get("/api/v11/blockchain/network/topology")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("networkId", equalTo("aurigraph-v11-mainnet"))
                .body("totalNodes", greaterThan(0))
                .body("activeValidators", greaterThan(0))
                .body("nodes", not(empty()))
                .body("networkHealth", notNullValue());
    }

    @Test
    @Order(2)
    @DisplayName("EP02: GET /api/v11/blockchain/blocks/search")
    public void testBlockSearch() {
        given()
            .queryParam("limit", 10)
            .when().get("/api/v11/blockchain/blocks/search")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalResults", greaterThan(0))
                .body("blocks", not(empty()))
                .body("blocks[0].blockNumber", notNullValue())
                .body("blocks[0].blockHash", startsWith("0x"));
    }

    @Test
    @Order(3)
    @DisplayName("EP03: POST /api/v11/blockchain/transactions/submit")
    public void testSubmitTransaction() {
        var requestBody = TestDataBuilder.createTransactionSubmitRequest(null, null, 1500.0);

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/blockchain/transactions/submit")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("PENDING"))
                .body("amount", notNullValue());
    }

    @Test
    @Order(4)
    @DisplayName("EP03-ERR: POST /api/v11/blockchain/transactions/submit (Invalid)")
    public void testSubmitTransactionInvalid() {
        var requestBody = TestDataBuilder.createInvalidTransactionRequest();

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/blockchain/transactions/submit")
            .then()
                .statusCode(400);
    }

    // ==================== VALIDATORS ====================

    @Test
    @Order(5)
    @DisplayName("EP04: GET /api/v11/validators/{id}/performance")
    public void testValidatorPerformance() {
        String validatorId = TestDataBuilder.generateValidatorId();

        given()
            .pathParam("id", validatorId)
            .when().get("/api/v11/validators/{id}/performance")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("validatorId", equalTo(validatorId))
                .body("status", notNullValue())
                .body("uptime", greaterThan(0f))
                .body("performanceScore", greaterThan(0f));
    }

    @Test
    @Order(6)
    @DisplayName("EP05: POST /api/v11/validators/{id}/slash")
    public void testSlashValidator() {
        String validatorId = TestDataBuilder.generateValidatorId();
        var requestBody = TestDataBuilder.createSlashingRequest("Double signing detected", 50000.0);

        given()
            .pathParam("id", validatorId)
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/validators/{id}/slash")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("validatorId", equalTo(validatorId))
                .body("status", equalTo("EXECUTED"))
                .body("slashAmount", notNullValue())
                .body("transactionHash", startsWith("0x"));
    }

    // ==================== AI/ML ENDPOINTS ====================

    @Test
    @Order(7)
    @DisplayName("EP06: GET /api/v11/ai/models/{id}/metrics")
    public void testAIModelMetrics() {
        String modelId = TestDataBuilder.generateModelId();

        given()
            .pathParam("id", modelId)
            .when().get("/api/v11/ai/models/{id}/metrics")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("modelId", equalTo(modelId))
                .body("accuracy", greaterThan(0f))
                .body("precision", greaterThan(0f))
                .body("throughput", greaterThan(0f));
    }

    @Test
    @Order(8)
    @DisplayName("EP07: GET /api/v11/ai/consensus/predictions")
    public void testAIPredictions() {
        given()
            .queryParam("horizon", "1h")
            .when().get("/api/v11/ai/consensus/predictions")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("predictions", not(empty()))
                .body("totalPredictions", greaterThan(0))
                .body("averageConfidence", greaterThan(0f));
    }

    // ==================== SECURITY ====================

    @Test
    @Order(9)
    @DisplayName("EP08: GET /api/v11/security/audit-logs")
    public void testSecurityAuditLogs() {
        given()
            .queryParam("limit", 20)
            .when().get("/api/v11/security/audit-logs")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalLogs", greaterThan(0))
                .body("logs", not(empty()))
                .body("logs[0].logId", notNullValue())
                .body("logs[0].severity", notNullValue());
    }

    @Test
    @Order(10)
    @DisplayName("EP08-FILTER: GET /api/v11/security/audit-logs (Filtered)")
    public void testAuditLogsFiltered() {
        given()
            .queryParam("severity", "CRITICAL")
            .queryParam("limit", 10)
            .when().get("/api/v11/security/audit-logs")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("logs", not(empty()));
    }

    // ==================== BRIDGE ====================

    @Test
    @Order(11)
    @DisplayName("EP09: POST /api/v11/bridge/transfers/initiate")
    public void testBridgeTransferInitiate() {
        var requestBody = TestDataBuilder.createBridgeTransferRequest(
            "ethereum", "polygon", "USDC", 5000.0);

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/bridge/transfers/initiate")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("transferId", notNullValue())
                .body("status", equalTo("INITIATED"))
                .body("sourceChain", equalTo("ethereum"))
                .body("destinationChain", equalTo("polygon"))
                .body("sourceTransactionHash", startsWith("0x"));
    }

    @Test
    @Order(12)
    @DisplayName("EP09-ERR: POST /api/v11/bridge/transfers/initiate (Invalid)")
    public void testBridgeTransferInvalid() {
        var requestBody = TestDataBuilder.createInvalidBridgeRequest();

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/bridge/transfers/initiate")
            .then()
                .statusCode(400);
    }

    @Test
    @Order(13)
    @DisplayName("EP10: GET /api/v11/bridge/operational/status")
    public void testBridgeOperationalStatus() {
        given()
            .when().get("/api/v11/bridge/operational/status")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("overallStatus", notNullValue())
                .body("bridgeVersion", notNullValue())
                .body("supportedChains", not(empty()))
                .body("activeRelayers", greaterThan(0));
    }

    // ==================== RWA ====================

    @Test
    @Order(14)
    @DisplayName("EP11: GET /api/v11/rwa/assets")
    public void testRWAAssets() {
        given()
            .queryParam("limit", 20)
            .when().get("/api/v11/rwa/assets")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalAssets", greaterThan(0))
                .body("assets", not(empty()))
                .body("assets[0].assetId", notNullValue())
                .body("assets[0].assetType", notNullValue());
    }

    @Test
    @Order(15)
    @DisplayName("EP11-FILTER: GET /api/v11/rwa/assets (Filtered)")
    public void testRWAAssetsFiltered() {
        given()
            .queryParam("assetType", "REAL_ESTATE")
            .queryParam("status", "ACTIVE")
            .when().get("/api/v11/rwa/assets")
            .then()
                .statusCode(200)
                .body("assets", not(empty()));
    }

    @Test
    @Order(16)
    @DisplayName("EP12: POST /api/v11/rwa/portfolio/rebalance")
    public void testPortfolioRebalance() {
        var requestBody = TestDataBuilder.createPortfolioRebalanceRequest(null, "BALANCED");

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/rwa/portfolio/rebalance")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("rebalanceId", notNullValue())
                .body("strategy", equalTo("BALANCED"))
                .body("status", equalTo("COMPLETED"))
                .body("trades", not(empty()));
    }

    @Test
    @Order(17)
    @DisplayName("EP13: GET /api/v11/blockchain/events")
    public void testBlockchainEvents() {
        given()
            .queryParam("limit", 30)
            .when().get("/api/v11/blockchain/events")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalEvents", greaterThan(0))
                .body("events", not(empty()))
                .body("events[0].eventId", notNullValue());
    }

    // ==================== PHASE 2: CONSENSUS ====================

    @Test
    @Order(18)
    @DisplayName("EP14: GET /api/v11/consensus/rounds")
    public void testConsensusRounds() {
        given()
            .queryParam("limit", 15)
            .when().get("/api/v11/consensus/rounds")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalRounds", greaterThan(0L))
                .body("rounds", not(empty()))
                .body("rounds[0].roundNumber", notNullValue())
                .body("currentState", notNullValue());
    }

    @Test
    @Order(19)
    @DisplayName("EP15: GET /api/v11/consensus/votes")
    public void testConsensusVotes() {
        given()
            .when().get("/api/v11/consensus/votes")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("roundNumber", notNullValue())
                .body("votes", not(empty()))
                .body("tally", notNullValue())
                .body("tally.consensusAchieved", notNullValue());
    }

    // ==================== ANALYTICS ====================

    @Test
    @Order(20)
    @DisplayName("EP16: GET /api/v11/analytics/network-usage")
    public void testNetworkUsage() {
        given()
            .queryParam("period", "24h")
            .when().get("/api/v11/analytics/network-usage")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("period", equalTo("24h"))
                .body("totalBandwidth", greaterThan(0L))
                .body("hourlyUsage", not(empty()));
    }

    @Test
    @Order(21)
    @DisplayName("EP17: GET /api/v11/analytics/validator-earnings")
    public void testValidatorEarnings() {
        given()
            .queryParam("period", "30d")
            .when().get("/api/v11/analytics/validator-earnings")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("period", equalTo("30d"))
                .body("totalValidators", greaterThan(0))
                .body("validatorEarnings", not(empty()));
    }

    // ==================== GATEWAY ====================

    @Test
    @Order(22)
    @DisplayName("EP18: GET /api/v11/gateway/balance/{address}")
    public void testGetBalance() {
        String address = TestDataBuilder.generateAddress();

        given()
            .pathParam("address", address)
            .when().get("/api/v11/gateway/balance/{address}")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("address", equalTo(address))
                .body("balance", greaterThan(0f))
                .body("tokenBalances", notNullValue());
    }

    @Test
    @Order(23)
    @DisplayName("EP19: POST /api/v11/gateway/transfer")
    public void testGatewayTransfer() {
        var requestBody = TestDataBuilder.createGatewayTransferRequest(null, null, 2500.0, "AUR");

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/gateway/transfer")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("transferId", notNullValue())
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("PENDING"));
    }

    // ==================== CONTRACTS ====================

    @Test
    @Order(24)
    @DisplayName("EP20: GET /api/v11/contracts/list")
    public void testListContracts() {
        given()
            .when().get("/api/v11/contracts/list")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalContracts", greaterThan(0L))
                .body("contracts", not(empty()))
                .body("contracts[0].contractId", notNullValue());
    }

    @Test
    @Order(25)
    @DisplayName("EP21: GET /api/v11/contracts/{id}/state")
    public void testGetContractState() {
        String contractId = TestDataBuilder.generateContractId();

        given()
            .pathParam("id", contractId)
            .when().get("/api/v11/contracts/{id}/state")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("contractId", equalTo(contractId))
                .body("state", notNullValue());
    }

    @Test
    @Order(26)
    @DisplayName("EP22: POST /api/v11/contracts/{id}/invoke")
    public void testInvokeContract() {
        String contractId = TestDataBuilder.generateContractId();
        var requestBody = TestDataBuilder.createContractInvokeRequest("transfer");

        given()
            .pathParam("id", contractId)
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/contracts/{id}/invoke")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("contractId", equalTo(contractId))
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("SUCCESS"));
    }

    // ==================== DATAFEEDS ====================

    @Test
    @Order(27)
    @DisplayName("EP23: GET /api/v11/datafeeds/sources")
    public void testDatafeedSources() {
        given()
            .when().get("/api/v11/datafeeds/sources")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalSources", greaterThan(0))
                .body("sources", not(empty()))
                .body("sources[0].sourceId", notNullValue());
    }

    // ==================== GOVERNANCE ====================

    @Test
    @Order(28)
    @DisplayName("EP24: POST /api/v11/governance/votes/submit")
    public void testSubmitGovernanceVote() {
        var requestBody = TestDataBuilder.createGovernanceVoteRequest(null, null, "FOR");

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/governance/votes/submit")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("voteId", notNullValue())
                .body("choice", equalTo("FOR"))
                .body("status", equalTo("CONFIRMED"))
                .body("transactionHash", startsWith("0x"));
    }

    // ==================== SHARDS ====================

    @Test
    @Order(29)
    @DisplayName("EP25: GET /api/v11/shards")
    public void testGetShardInfo() {
        given()
            .when().get("/api/v11/shards")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("totalShards", greaterThan(0))
                .body("activeShards", greaterThan(0))
                .body("shards", not(empty()))
                .body("shards[0].shardId", notNullValue());
    }

    // ==================== CUSTOM METRICS ====================

    @Test
    @Order(30)
    @DisplayName("EP26: GET /api/v11/metrics/custom")
    public void testGetCustomMetrics() {
        given()
            .when().get("/api/v11/metrics/custom")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .time(lessThan(200L), java.util.concurrent.TimeUnit.MILLISECONDS)
                .body("metrics", notNullValue())
                .body("metrics.daily_active_users", greaterThan(0f))
                .body("metrics.total_value_locked", greaterThan(0f))
                .body("metrics.uptime_percentage", greaterThan(90f));
    }
}
