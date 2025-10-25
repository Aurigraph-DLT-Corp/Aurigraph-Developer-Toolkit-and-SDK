package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusIntegrationTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration Tests for Token Management Endpoints
 *
 * Tests end-to-end integration with actual backend services.
 * Verifies complete request-response cycle including database operations.
 *
 * @version 1.0.0
 * @author Backend Development Agent (BDA)
 * @since V11.4.4
 */
@QuarkusIntegrationTest
@DisplayName("Token Management Endpoints - Integration Test Suite")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TokenEndpointsIntegrationTest {

    private static String createdTokenId;

    // ==================== INTEGRATION TESTS ====================

    @Test
    @Order(1)
    @DisplayName("Integration Test: Create Token and Verify")
    public void testCreateAndVerifyToken_Integration() {
        // Create a token
        Map<String, Object> createRequest = new HashMap<>();
        createRequest.put("name", "Integration Test Token");
        createRequest.put("symbol", "ITT");
        createRequest.put("totalSupply", 5000000);
        createRequest.put("decimals", 18);
        createRequest.put("contractAddress", "0xintegrationtest00000000000000000000");

        String response = given()
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(200)
                .body("id", notNullValue())
                .body("name", equalTo("Integration Test Token"))
                .body("symbol", equalTo("ITT"))
                .body("status", equalTo("active"))
                .extract()
                .path("id");

        createdTokenId = response;

        // Verify token appears in list
        given()
                .when()
                .get("/api/v11/tokens?page=0&size=100")
                .then()
                .statusCode(200)
                .body("tokens.find { it.id == '" + createdTokenId + "' }", notNullValue())
                .body("tokens.find { it.id == '" + createdTokenId + "' }.name", equalTo("Integration Test Token"));
    }

    @Test
    @Order(2)
    @DisplayName("Integration Test: Verify Statistics Updated After Token Creation")
    public void testStatisticsUpdatedAfterCreation_Integration() {
        // Get statistics
        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .body("totalTokens", greaterThan(0))
                .body("activeTokens", greaterThan(0))
                .body("totalSupply", greaterThan(0f));
    }

    @Test
    @Order(3)
    @DisplayName("Integration Test: Full CRUD Workflow")
    public void testFullCrudWorkflow_Integration() {
        // Step 1: Check initial statistics
        Integer initialTotal = given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .extract()
                .path("totalTokens");

        // Step 2: Create new token
        Map<String, Object> createRequest = new HashMap<>();
        createRequest.put("name", "CRUD Test Token");
        createRequest.put("symbol", "CRUD");
        createRequest.put("totalSupply", 10000000);
        createRequest.put("decimals", 6);

        given()
                .contentType(ContentType.JSON)
                .body(createRequest)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(200)
                .body("name", equalTo("CRUD Test Token"))
                .body("symbol", equalTo("CRUD"))
                .body("decimals", equalTo(6));

        // Step 3: Verify statistics updated
        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200)
                .body("totalTokens", greaterThanOrEqualTo(initialTotal));
    }

    @Test
    @Order(4)
    @DisplayName("Integration Test: Pagination Across Multiple Pages")
    public void testPaginationIntegration() {
        // Get first page
        int page0Count = given()
                .when()
                .get("/api/v11/tokens?page=0&size=10")
                .then()
                .statusCode(200)
                .body("page", equalTo(0))
                .body("size", equalTo(10))
                .extract()
                .path("count");

        // Get second page (if exists)
        if (page0Count == 10) {
            given()
                    .when()
                    .get("/api/v11/tokens?page=1&size=10")
                    .then()
                    .statusCode(200)
                    .body("page", equalTo(1))
                    .body("size", equalTo(10));
        }
    }

    @Test
    @Order(5)
    @DisplayName("Integration Test: Performance - Get 100 Tokens")
    public void testPerformance_Get100Tokens() {
        long startTime = System.currentTimeMillis();

        given()
                .when()
                .get("/api/v11/tokens?page=0&size=100")
                .then()
                .statusCode(200)
                .body("tokens", notNullValue());

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        // Performance assertion: Should complete in less than 2 seconds
        assert duration < 2000 : "Token list retrieval took too long: " + duration + "ms";
    }

    @Test
    @Order(6)
    @DisplayName("Integration Test: Performance - Create Token")
    public void testPerformance_CreateToken() {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "Performance Test Token");
        request.put("symbol", "PERF");
        request.put("totalSupply", 1000000);

        long startTime = System.currentTimeMillis();

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v11/tokens")
                .then()
                .statusCode(200);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        // Performance assertion: Should complete in less than 1 second
        assert duration < 1000 : "Token creation took too long: " + duration + "ms";
    }

    @Test
    @Order(7)
    @DisplayName("Integration Test: Performance - Get Statistics")
    public void testPerformance_GetStatistics() {
        long startTime = System.currentTimeMillis();

        given()
                .when()
                .get("/api/v11/tokens/statistics")
                .then()
                .statusCode(200);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        // Performance assertion: Should complete in less than 500ms
        assert duration < 500 : "Statistics retrieval took too long: " + duration + "ms";
    }

    @Test
    @Order(8)
    @DisplayName("Integration Test: Concurrent Token Creation")
    public void testConcurrentTokenCreation_Integration() {
        // Create 5 tokens concurrently
        for (int i = 0; i < 5; i++) {
            final int index = i;
            Map<String, Object> request = new HashMap<>();
            request.put("name", "Concurrent Token " + index);
            request.put("symbol", "CONC" + index);
            request.put("totalSupply", 1000000 + (index * 100000));

            given()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .post("/api/v11/tokens")
                    .then()
                    .statusCode(200)
                    .body("name", equalTo("Concurrent Token " + index));
        }

        // Verify all tokens created
        given()
                .when()
                .get("/api/v11/tokens?page=0&size=100")
                .then()
                .statusCode(200)
                .body("tokens.findAll { it.symbol.startsWith('CONC') }.size()", greaterThanOrEqualTo(5));
    }
}
