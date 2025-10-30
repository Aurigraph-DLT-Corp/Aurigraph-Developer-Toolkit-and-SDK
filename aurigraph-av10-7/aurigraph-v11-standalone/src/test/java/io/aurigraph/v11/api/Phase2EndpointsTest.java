package io.aurigraph.v11.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Phase 2 Endpoints Test Suite
 *
 * Tests for 14 Phase 2 endpoints:
 * 14-15. Consensus (rounds, votes)
 * 16-17. Analytics (network usage, validator earnings)
 * 18-19. Gateway (balance, transfer)
 * 20-22. Contracts (list, state, invoke)
 * 23. Datafeeds (sources)
 * 24. Governance (votes)
 * 25. Shards (information)
 * 26. Custom Metrics
 */
@QuarkusTest
public class Phase2EndpointsTest {

    // ==================== CONSENSUS ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/consensus/rounds")
    public void testConsensusRounds() {
        given()
            .queryParam("limit", 15)
            .when().get("/api/v11/consensus/rounds")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalRounds", greaterThan(0L))
                .body("rounds", not(empty()))
                .body("rounds[0].roundNumber", notNullValue())
                .body("rounds[0].leaderNodeId", notNullValue())
                .body("currentState", notNullValue());
    }

    @Test
    @DisplayName("Test GET /api/v11/consensus/votes")
    public void testConsensusVotes() {
        given()
            .when().get("/api/v11/consensus/votes")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("roundNumber", notNullValue())
                .body("votes", not(empty()))
                .body("tally", notNullValue())
                .body("tally.consensusAchieved", notNullValue())
                .body("statistics", notNullValue());
    }

    @Test
    @DisplayName("Test consensus votes for specific round")
    public void testConsensusVotesForRound() {
        given()
            .queryParam("roundNumber", 7500000)
            .when().get("/api/v11/consensus/votes")
            .then()
                .statusCode(200)
                .body("roundNumber", equalTo(7500000));
    }

    // ==================== ANALYTICS ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/analytics/network-usage")
    public void testNetworkUsage() {
        given()
            .queryParam("period", "24h")
            .when().get("/api/v11/analytics/network-usage")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("period", equalTo("24h"))
                .body("totalBandwidth", greaterThan(0L))
                .body("totalConnections", greaterThan(0))
                .body("averageLatency", greaterThan(0f))
                .body("hourlyUsage", not(empty()));
    }

    @Test
    @DisplayName("Test GET /api/v11/analytics/validator-earnings")
    public void testValidatorEarnings() {
        given()
            .queryParam("period", "30d")
            .when().get("/api/v11/analytics/validator-earnings")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("period", equalTo("30d"))
                .body("totalValidators", greaterThan(0))
                .body("validatorEarnings", not(empty()))
                .body("validatorEarnings[0].validatorId", notNullValue())
                .body("validatorEarnings[0].totalRewards", greaterThan(0f));
    }

    @Test
    @DisplayName("Test validator earnings for specific validator")
    public void testValidatorEarningsSpecific() {
        given()
            .queryParam("validatorId", "validator-001")
            .when().get("/api/v11/analytics/validator-earnings")
            .then()
                .statusCode(200)
                .body("validatorEarnings", hasSize(1))
                .body("validatorEarnings[0].validatorId", equalTo("validator-001"));
    }

    // ==================== GATEWAY ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/gateway/balance/{address}")
    public void testGetBalance() {
        given()
            .pathParam("address", "0xabcd1234efgh5678")
            .when().get("/api/v11/gateway/balance/{address}")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("address", equalTo("0xabcd1234efgh5678"))
                .body("balance", greaterThan(0f))
                .body("availableBalance", greaterThan(0f))
                .body("tokenBalances", notNullValue())
                .body("tokenBalances.AUR", greaterThan(0f));
    }

    @Test
    @DisplayName("Test POST /api/v11/gateway/transfer")
    public void testGatewayTransfer() {
        String requestBody = """
            {
                "from": "0xsender123",
                "to": "0xrecipient456",
                "amount": 2500.0,
                "asset": "AUR"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/gateway/transfer")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("transferId", notNullValue())
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("PENDING"))
                .body("amount", equalTo(2500.0f));
    }

    // ==================== CONTRACT ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/contracts/list")
    public void testListContracts() {
        given()
            .when().get("/api/v11/contracts/list")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalContracts", greaterThan(0L))
                .body("contracts", not(empty()))
                .body("contracts[0].contractId", notNullValue())
                .body("contracts[0].address", startsWith("0x"))
                .body("contracts[0].type", notNullValue());
    }

    @Test
    @DisplayName("Test list contracts with filters")
    public void testListContractsWithFilters() {
        given()
            .queryParam("type", "TOKEN")
            .queryParam("status", "ACTIVE")
            .when().get("/api/v11/contracts/list")
            .then()
                .statusCode(200)
                .body("contracts", not(empty()));
    }

    @Test
    @DisplayName("Test GET /api/v11/contracts/{id}/state")
    public void testGetContractState() {
        given()
            .pathParam("id", "contract-000001")
            .when().get("/api/v11/contracts/{id}/state")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("contractId", equalTo("contract-000001"))
                .body("state", notNullValue())
                .body("state.totalSupply", notNullValue());
    }

    @Test
    @DisplayName("Test POST /api/v11/contracts/{id}/invoke")
    public void testInvokeContract() {
        String requestBody = """
            {
                "method": "transfer",
                "params": {
                    "to": "0xrecipient",
                    "amount": 1000
                }
            }
            """;

        given()
            .pathParam("id", "contract-000001")
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/contracts/{id}/invoke")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("contractId", equalTo("contract-000001"))
                .body("method", equalTo("transfer"))
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("SUCCESS"))
                .body("gasUsed", greaterThan(0L));
    }

    // ==================== DATAFEED ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/datafeeds/sources")
    public void testDatafeedSources() {
        given()
            .when().get("/api/v11/datafeeds/sources")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalSources", greaterThan(0))
                .body("sources", not(empty()))
                .body("sources[0].sourceId", notNullValue())
                .body("sources[0].name", notNullValue())
                .body("sources[0].type", notNullValue())
                .body("sources[0].status", notNullValue());
    }

    // ==================== GOVERNANCE ENDPOINTS ====================

    @Test
    @DisplayName("Test POST /api/v11/governance/votes/submit")
    public void testSubmitGovernanceVote() {
        String requestBody = """
            {
                "proposalId": "proposal-12345",
                "voterId": "voter-67890",
                "choice": "FOR"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
            .when().post("/api/v11/governance/votes/submit")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("voteId", notNullValue())
                .body("proposalId", equalTo("proposal-12345"))
                .body("voterId", equalTo("voter-67890"))
                .body("choice", equalTo("FOR"))
                .body("votingPower", greaterThan(0f))
                .body("transactionHash", startsWith("0x"))
                .body("status", equalTo("CONFIRMED"));
    }

    // ==================== SHARD ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/shards")
    public void testGetShardInfo() {
        given()
            .when().get("/api/v11/shards")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("totalShards", greaterThan(0))
                .body("activeShards", greaterThan(0))
                .body("shards", not(empty()))
                .body("shards[0].shardId", notNullValue())
                .body("shards[0].status", notNullValue())
                .body("shards[0].validators", greaterThan(0))
                .body("shards[0].currentBlock", greaterThan(0L))
                .body("shards[0].averageTPS", greaterThan(0f));
    }

    // ==================== CUSTOM METRICS ENDPOINTS ====================

    @Test
    @DisplayName("Test GET /api/v11/metrics/custom")
    public void testGetCustomMetrics() {
        given()
            .when().get("/api/v11/metrics/custom")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("metrics", notNullValue())
                .body("metrics.daily_active_users", greaterThan(0f))
                .body("metrics.total_value_locked", greaterThan(0f))
                .body("metrics.transaction_volume_24h", greaterThan(0f))
                .body("metrics.platform_revenue_24h", greaterThan(0f))
                .body("metrics.uptime_percentage", greaterThan(90f));
    }

    @Test
    @DisplayName("Test custom metrics with category filter")
    public void testCustomMetricsWithCategory() {
        given()
            .queryParam("category", "performance")
            .when().get("/api/v11/metrics/custom")
            .then()
                .statusCode(200)
                .body("metrics", notNullValue());
    }

    // ==================== COMPREHENSIVE INTEGRATION TESTS ====================

    @Test
    @DisplayName("Test all Phase 2 endpoints are accessible")
    public void testAllPhase2EndpointsAccessible() {
        // Consensus
        given().get("/api/v11/consensus/rounds").then().statusCode(200);
        given().get("/api/v11/consensus/votes").then().statusCode(200);

        // Analytics
        given().get("/api/v11/analytics/network-usage").then().statusCode(200);
        given().get("/api/v11/analytics/validator-earnings").then().statusCode(200);

        // Gateway
        given().get("/api/v11/gateway/balance/0xtest123").then().statusCode(200);

        // Contracts
        given().get("/api/v11/contracts/list").then().statusCode(200);
        given().get("/api/v11/contracts/contract-001/state").then().statusCode(200);

        // Datafeeds
        given().get("/api/v11/datafeeds/sources").then().statusCode(200);

        // Shards
        given().get("/api/v11/shards").then().statusCode(200);

        // Custom Metrics
        given().get("/api/v11/metrics/custom").then().statusCode(200);
    }
}
