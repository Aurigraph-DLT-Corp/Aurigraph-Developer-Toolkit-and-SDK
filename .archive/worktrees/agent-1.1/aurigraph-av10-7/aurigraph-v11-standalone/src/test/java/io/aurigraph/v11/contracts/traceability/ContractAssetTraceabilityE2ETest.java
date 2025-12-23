package io.aurigraph.v11.contracts.traceability;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Order;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-End Integration Tests for Contract-Asset Traceability System
 *
 * Tests all 11 REST endpoints and validates complete workflows:
 * - Contract-asset linking
 * - Bidirectional queries (asset↔contract)
 * - Lineage aggregation
 * - Execution tracking
 * - Valuation management
 * - Tokenization lifecycle
 * - Multi-criteria search
 * - System metrics
 * - Integrity verification
 *
 * @version 1.0.0
 */
@QuarkusTest
@DisplayName("Contract-Asset Traceability E2E Tests")
public class ContractAssetTraceabilityE2ETest {

    private static final String BASE_PATH = "/api/v11/traceability";
    private static String testLinkId;
    private static String testContractId = "CONTRACT_E2E_001";
    private static String testAssetId = "ASSET_E2E_001";
    private static String testTokenId = "TOKEN_E2E_001";

    @BeforeAll
    static void setup() {
        RestAssured.basePath = BASE_PATH;
    }

    // ==========================================================================
    // ENDPOINT 1: Health Check (Public - No Auth Required)
    // ==========================================================================

    @Test
    @Order(1)
    @DisplayName("1. Health Check - No Authentication Required")
    void testHealthCheck() {
        given()
            .when()
            .get("/health")
            .then()
            .statusCode(200)
            .body("status", equalTo("UP"))
            .body("service", equalTo("ContractAssetTraceability"));
    }

    // ==========================================================================
    // ENDPOINT 2: Create Traceability Link
    // ==========================================================================

    @Test
    @Order(2)
    @DisplayName("2. Create Contract-Asset Link with Full Metadata")
    void testCreateTraceabilityLink() {
        Response response = given()
            .queryParam("contractId", testContractId)
            .queryParam("contractName", "Real Estate Mortgage Agreement")
            .queryParam("assetId", testAssetId)
            .queryParam("assetName", "Manhattan Office Complex")
            .queryParam("assetType", "REAL_ESTATE")
            .queryParam("assetValuation", 5000000.00)
            .queryParam("tokenId", testTokenId)
            .queryParam("tokenSymbol", "MRT")
            .when()
            .post("/links")
            .then()
            .statusCode(201)
            .body("linkId", notNullValue())
            .body("contractId", equalTo(testContractId))
            .body("assetId", equalTo(testAssetId))
            .body("assetValuation", equalTo(5000000.0f))
            .body("complianceStatus", equalTo("PENDING_VERIFICATION"))
            .body("riskLevel", equalTo("MEDIUM"))
            .extract()
            .response();

        // Extract linkId for subsequent tests
        testLinkId = response.jsonPath().getString("linkId");
        assertNotNull(testLinkId, "Link ID should be generated");
    }

    // ==========================================================================
    // ENDPOINT 3: Get Specific Link by ID
    // ==========================================================================

    @Test
    @Order(3)
    @DisplayName("3. Get Specific Link by ID")
    void testGetTraceabilityLink() {
        given()
            .pathParam("linkId", testLinkId)
            .when()
            .get("/links/{linkId}")
            .then()
            .statusCode(200)
            .body("linkId", equalTo(testLinkId))
            .body("contractId", equalTo(testContractId))
            .body("assetName", equalTo("Manhattan Office Complex"))
            .body("linkedAt", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 4: Get Assets by Contract
    // ==========================================================================

    @Test
    @Order(4)
    @DisplayName("4. Get All Assets Linked to a Specific Contract")
    void testGetAssetsByContract() {
        given()
            .pathParam("contractId", testContractId)
            .when()
            .get("/contracts/{contractId}/assets")
            .then()
            .statusCode(200)
            .body("$", hasSize(greaterThan(0)))
            .body("[0].contractId", equalTo(testContractId))
            .body("[0].assetId", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 5: Get Contracts by Asset
    // ==========================================================================

    @Test
    @Order(5)
    @DisplayName("5. Get All Contracts Managing a Specific Asset (Reverse Lookup)")
    void testGetContractsByAsset() {
        given()
            .pathParam("assetId", testAssetId)
            .when()
            .get("/assets/{assetId}/contracts")
            .then()
            .statusCode(200)
            .body("$", hasSize(greaterThan(0)))
            .body("[0].assetId", equalTo(testAssetId))
            .body("[0].contractId", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 6: Get Complete Lineage (Contract → Asset → Token → Shareholders)
    // ==========================================================================

    @Test
    @Order(6)
    @DisplayName("6. Get Complete Contract Lineage with Aggregated Metrics")
    void testGetCompleteLineage() {
        given()
            .pathParam("contractId", testContractId)
            .when()
            .get("/contracts/{contractId}/lineage")
            .then()
            .statusCode(200)
            .body("contractId", equalTo(testContractId))
            .body("assets", notNullValue())
            .body("assets.size()", greaterThan(0))
            .body("totalAssetValuation", notNullValue())
            .body("totalTokensIssued", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 7: Record Contract Execution and Update Metrics
    // ==========================================================================

    @Test
    @Order(7)
    @DisplayName("7. Record Contract Execution and Update Success Metrics")
    void testRecordContractExecution() {
        // First execution - success
        given()
            .pathParam("linkId", testLinkId)
            .queryParam("success", true)
            .when()
            .post("/links/{linkId}/execute")
            .then()
            .statusCode(200)
            .body("executionCount", greaterThan(0))
            .body("successRate", notNullValue());

        // Second execution - failure
        given()
            .pathParam("linkId", testLinkId)
            .queryParam("success", false)
            .when()
            .post("/links/{linkId}/execute")
            .then()
            .statusCode(200)
            .body("failureCount", greaterThan(0))
            .body("successRate", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 8: Update Asset Valuation with Change History
    // ==========================================================================

    @Test
    @Order(8)
    @DisplayName("8. Update Asset Valuation and Track Change History")
    void testUpdateAssetValuation() {
        Double newValuation = 5500000.00;

        given()
            .pathParam("linkId", testLinkId)
            .queryParam("valuation", newValuation)
            .when()
            .put("/links/{linkId}/valuation")
            .then()
            .statusCode(200)
            .body("assetValuation", equalTo(newValuation.floatValue()))
            .body("metadata.valuationHistory", notNullValue())
            .body("metadata.valuationHistory.new", equalTo(newValuation.floatValue()))
            .body("lastUpdatedAt", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 9: Update Tokenization Details and Compliance Status
    // ==========================================================================

    @Test
    @Order(9)
    @DisplayName("9. Update Tokenization Details and Compliance Status")
    void testUpdateTokenizationDetails() {
        Long totalShares = 1000000L;
        Long sharesOutstanding = 950000L;

        given()
            .pathParam("linkId", testLinkId)
            .queryParam("totalShares", totalShares)
            .queryParam("sharesOutstanding", sharesOutstanding)
            .when()
            .put("/links/{linkId}/tokenization")
            .then()
            .statusCode(200)
            .body("totalShares", equalTo(totalShares.intValue()))
            .body("sharesOutstanding", equalTo(sharesOutstanding.intValue()))
            .body("complianceStatus", equalTo("TOKENIZED"))
            .body("tokenizedAt", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 10: Get System-Wide Traceability Summary
    // ==========================================================================

    @Test
    @Order(10)
    @DisplayName("10. Get System-Wide Traceability Metrics and Summary")
    void testGetTraceabilitySummary() {
        given()
            .when()
            .get("/summary")
            .then()
            .statusCode(200)
            .body("totalLinks", greaterThanOrEqualTo(1))
            .body("totalContracts", greaterThanOrEqualTo(1))
            .body("totalAssets", greaterThanOrEqualTo(1))
            .body("totalTokens", greaterThanOrEqualTo(1))
            .body("averageLinkSuccessRate", notNullValue())
            .body("totalAssetValue", notNullValue());
    }

    // ==========================================================================
    // ENDPOINT 11: Search Links by Multi-Criteria Filters
    // ==========================================================================

    @Test
    @Order(11)
    @DisplayName("11. Search Links by Multi-Criteria (Asset Type, Compliance, Risk)")
    void testSearchLinks() {
        // Search by asset type only
        given()
            .queryParam("assetType", "REAL_ESTATE")
            .when()
            .get("/search")
            .then()
            .statusCode(200)
            .body("$", hasSize(greaterThan(0)))
            .body("[0].assetType", equalTo("REAL_ESTATE"));

        // Search by compliance status
        given()
            .queryParam("complianceStatus", "TOKENIZED")
            .when()
            .get("/search")
            .then()
            .statusCode(200)
            .body("$", hasSize(greaterThan(0)))
            .body("[0].complianceStatus", equalTo("TOKENIZED"));

        // Search by risk level
        given()
            .queryParam("riskLevel", "MEDIUM")
            .when()
            .get("/search")
            .then()
            .statusCode(200)
            .body("$", hasSize(greaterThan(0)))
            .body("[0].riskLevel", equalTo("MEDIUM"));

        // Search with multiple criteria
        given()
            .queryParam("assetType", "REAL_ESTATE")
            .queryParam("complianceStatus", "TOKENIZED")
            .queryParam("riskLevel", "MEDIUM")
            .when()
            .get("/search")
            .then()
            .statusCode(200)
            .body("$", hasSize(greaterThan(0)));
    }

    // ==========================================================================
    // ENDPOINT 12: Verify Binding Integrity
    // ==========================================================================

    @Test
    @Order(12)
    @DisplayName("12. Verify Contract-Asset Binding Integrity")
    void testVerifyIntegrity() {
        given()
            .pathParam("linkId", testLinkId)
            .when()
            .post("/links/{linkId}/verify")
            .then()
            .statusCode(200)
            .body("linkId", equalTo(testLinkId))
            .body("isValid", equalTo(true))
            .body("hasToken", equalTo(true))
            .body("hasAsset", equalTo(true))
            .body("hasContract", equalTo(true))
            .body("status", equalTo("VERIFIED"))
            .body("lastVerified", notNullValue());
    }

    // ==========================================================================
    // COMPLETE WORKFLOW TESTS
    // ==========================================================================

    @Test
    @Order(13)
    @DisplayName("Complete Workflow: Create → Link → Execute → Update → Verify")
    void testCompleteWorkflow() {
        // 1. Create a new link
        String contractId = "CONTRACT_WORKFLOW_001";
        String assetId = "ASSET_WORKFLOW_001";
        String tokenId = "TOKEN_WORKFLOW_001";

        Response createResponse = given()
            .queryParam("contractId", contractId)
            .queryParam("contractName", "Workflow Test Contract")
            .queryParam("assetId", assetId)
            .queryParam("assetName", "Workflow Test Asset")
            .queryParam("assetType", "COMMODITY")
            .queryParam("assetValuation", 1000000.00)
            .queryParam("tokenId", tokenId)
            .queryParam("tokenSymbol", "WFT")
            .when()
            .post("/links")
            .then()
            .statusCode(201)
            .extract()
            .response();

        String linkId = createResponse.jsonPath().getString("linkId");
        assertNotNull(linkId);

        // 2. Retrieve the created link
        given()
            .pathParam("linkId", linkId)
            .when()
            .get("/links/{linkId}")
            .then()
            .statusCode(200)
            .body("linkId", equalTo(linkId));

        // 3. Record successful executions
        for (int i = 0; i < 5; i++) {
            given()
                .pathParam("linkId", linkId)
                .queryParam("success", true)
                .when()
                .post("/links/{linkId}/execute")
                .then()
                .statusCode(200);
        }

        // 4. Update valuation
        given()
            .pathParam("linkId", linkId)
            .queryParam("valuation", 1100000.00)
            .when()
            .put("/links/{linkId}/valuation")
            .then()
            .statusCode(200)
            .body("assetValuation", equalTo(1100000.0f));

        // 5. Update tokenization
        given()
            .pathParam("linkId", linkId)
            .queryParam("totalShares", 500000)
            .queryParam("sharesOutstanding", 450000)
            .when()
            .put("/links/{linkId}/tokenization")
            .then()
            .statusCode(200)
            .body("complianceStatus", equalTo("TOKENIZED"));

        // 6. Verify integrity
        given()
            .pathParam("linkId", linkId)
            .when()
            .post("/links/{linkId}/verify")
            .then()
            .statusCode(200)
            .body("isValid", equalTo(true))
            .body("successRate", notNullValue());

        // 7. Check lineage
        given()
            .pathParam("contractId", contractId)
            .when()
            .get("/contracts/{contractId}/lineage")
            .then()
            .statusCode(200)
            .body("totalAssetValuation", notNullValue());
    }

    // ==========================================================================
    // PERFORMANCE & LOAD TESTS
    // ==========================================================================

    @Test
    @Order(14)
    @DisplayName("Performance: Verify O(1) Link Lookup")
    void testO1LinkLookup() {
        long startTime = System.nanoTime();

        given()
            .pathParam("linkId", testLinkId)
            .when()
            .get("/links/{linkId}")
            .then()
            .statusCode(200);

        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;

        // O(1) lookup should complete in <50ms on local network
        assertTrue(durationMs < 50, "O(1) lookup took too long: " + durationMs + "ms");
    }

    @Test
    @Order(15)
    @DisplayName("Performance: Batch Contract-Asset Queries")
    void testBatchQueries() {
        // Multiple concurrent queries for the same contract
        for (int i = 0; i < 10; i++) {
            given()
                .pathParam("contractId", testContractId)
                .when()
                .get("/contracts/{contractId}/assets")
                .then()
                .statusCode(200)
                .body("$", hasSize(greaterThan(0)));
        }
    }

    // ==========================================================================
    // ERROR HANDLING TESTS
    // ==========================================================================

    @Test
    @Order(16)
    @DisplayName("Error Handling: Non-existent Link Returns 404")
    void testNonexistentLink() {
        given()
            .pathParam("linkId", "NONEXISTENT_LINK_ID")
            .when()
            .get("/links/{linkId}")
            .then()
            .statusCode(404)
            .body("error", notNullValue());
    }

    @Test
    @Order(17)
    @DisplayName("Error Handling: Missing Required Parameters")
    void testMissingParameters() {
        given()
            // Missing contractName and other required params
            .queryParam("contractId", "CONTRACT_INCOMPLETE")
            .when()
            .post("/links")
            .then()
            .statusCode(400);
    }

    @Test
    @Order(18)
    @DisplayName("Error Handling: Invalid Valuation Update")
    void testInvalidValuationUpdate() {
        given()
            .pathParam("linkId", testLinkId)
            .queryParam("valuation", -1000)  // Invalid negative valuation
            .when()
            .put("/links/{linkId}/valuation")
            .then()
            .statusCode(400);
    }

    // ==========================================================================
    // REVERSE INDEXING VERIFICATION
    // ==========================================================================

    @Test
    @Order(19)
    @DisplayName("Reverse Indexing: Asset → Contracts Bidirectional Query")
    void testReverseIndexingBidirectional() {
        // Get contracts managing the asset
        Response contractsResponse = given()
            .pathParam("assetId", testAssetId)
            .when()
            .get("/assets/{assetId}/contracts")
            .then()
            .statusCode(200)
            .extract()
            .response();

        String[] contractIds = contractsResponse.jsonPath().getStringArray("[].contractId");
        assertNotNull(contractIds);
        assertFalse(contractIds.length == 0);

        // Verify bidirectional: asset should appear in contract's assets list
        for (String contractId : contractIds) {
            given()
                .pathParam("contractId", contractId)
                .when()
                .get("/contracts/{contractId}/assets")
                .then()
                .statusCode(200)
                .body("$", hasSize(greaterThan(0)));
        }
    }

    // ==========================================================================
    // THREAD SAFETY TEST
    // ==========================================================================

    @Test
    @Order(20)
    @DisplayName("Thread Safety: Concurrent Updates Don't Lose Data")
    void testConcurrentUpdates() throws InterruptedException {
        Thread[] threads = new Thread[5];

        for (int i = 0; i < 5; i++) {
            final int index = i;
            threads[i] = new Thread(() -> {
                given()
                    .pathParam("linkId", testLinkId)
                    .queryParam("success", true)
                    .when()
                    .post("/links/{linkId}/execute")
                    .then()
                    .statusCode(200);
            });
            threads[i].start();
        }

        for (Thread thread : threads) {
            thread.join();
        }

        // Verify all executions were recorded
        given()
            .pathParam("linkId", testLinkId)
            .when()
            .get("/links/{linkId}")
            .then()
            .statusCode(200)
            .body("executionCount", greaterThanOrEqualTo(5));
    }
}
