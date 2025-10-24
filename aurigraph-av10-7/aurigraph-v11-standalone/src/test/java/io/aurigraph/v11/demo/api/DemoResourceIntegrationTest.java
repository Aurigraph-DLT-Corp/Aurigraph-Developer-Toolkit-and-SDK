package io.aurigraph.v11.demo.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.config.RestAssuredConfig;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Demo API Integration Test Suite
 * Tests all demo management endpoints with database persistence
 *
 * Covers:
 * - Demo CRUD operations (Create, Read, Update, Delete)
 * - Demo lifecycle (Start, Stop, Extend)
 * - Transaction management
 * - Database persistence via Flyway migrations
 *
 * Base Path: /api/demos
 * Port: Dynamic (assigned by Quarkus)
 */
@QuarkusTest
@DisplayName("Demo API Integration Tests")
public class DemoResourceIntegrationTest {

    private static final String BASE_PATH = "/api/demos";

    @BeforeEach
    void setup() {
        // RestAssured is automatically configured by @QuarkusTest with dynamic port
        RestAssured.basePath = BASE_PATH;
        RestAssured.config = RestAssuredConfig.config()
            .connectionConfig(io.restassured.config.ConnectionConfig.connectionConfig()
                .closeIdleConnectionsAfterEachResponse())
            .httpClient(io.restassured.config.HttpClientConfig.httpClientConfig()
                .setParam("http.socket.timeout", 120000)
                .setParam("http.connection.timeout", 120000));
    }

    // ==================== CREATE DEMO TESTS ====================

    @Nested
    @DisplayName("Create Demo Operations")
    class CreateDemoTests {

        @Test
        @DisplayName("POST /api/demos - Create new demo successfully")
        void testCreateDemoSuccess() {
            String requestBody = "{\n" +
                    "  \"demoName\": \"Integration Test Demo\",\n" +
                    "  \"userEmail\": \"test@example.com\",\n" +
                    "  \"userName\": \"Test User\",\n" +
                    "  \"description\": \"Demo created by integration test\",\n" +
                    "  \"channels\": [],\n" +
                    "  \"validators\": [],\n" +
                    "  \"businessNodes\": [],\n" +
                    "  \"slimNodes\": []\n" +
                    "}";

            given()
                    .contentType(ContentType.JSON)
                    .body(requestBody)
                    .when()
                    .post()
                    .then()
                    .statusCode(201)
                    .contentType(ContentType.JSON)
                    .body("id", notNullValue())
                    .body("demoName", equalTo("Integration Test Demo"))
                    .body("userEmail", equalTo("test@example.com"))
                    .body("status", notNullValue());
        }

        @Test
        @DisplayName("POST /api/demos - Create demo with admin flag")
        void testCreateAdminDemo() {
            String requestBody = "{\n" +
                    "  \"demoName\": \"Admin Demo Test\",\n" +
                    "  \"userEmail\": \"admin@example.com\",\n" +
                    "  \"userName\": \"Admin User\",\n" +
                    "  \"description\": \"Admin demo for testing\",\n" +
                    "  \"channels\": [],\n" +
                    "  \"validators\": [],\n" +
                    "  \"businessNodes\": [],\n" +
                    "  \"slimNodes\": []\n" +
                    "}";

            given()
                    .contentType(ContentType.JSON)
                    .queryParam("isAdmin", "true")
                    .body(requestBody)
                    .when()
                    .post()
                    .then()
                    .statusCode(201)
                    .body("isAdminDemo", equalTo(true));
        }

        @Test
        @DisplayName("POST /api/demos - Create demo with custom duration")
        void testCreateDemoWithDuration() {
            String requestBody = "{\n" +
                    "  \"demoName\": \"Duration Test Demo\",\n" +
                    "  \"userEmail\": \"duration@example.com\",\n" +
                    "  \"userName\": \"Duration User\",\n" +
                    "  \"description\": \"Demo with custom duration\",\n" +
                    "  \"channels\": [],\n" +
                    "  \"validators\": [],\n" +
                    "  \"businessNodes\": [],\n" +
                    "  \"slimNodes\": []\n" +
                    "}";

            given()
                    .contentType(ContentType.JSON)
                    .queryParam("durationMinutes", "30")
                    .body(requestBody)
                    .when()
                    .post()
                    .then()
                    .statusCode(201)
                    .body("durationMinutes", equalTo(30));
        }
    }

    // ==================== READ DEMO TESTS ====================

    @Nested
    @DisplayName("Read Demo Operations")
    class ReadDemoTests {

        @Test
        @DisplayName("GET /api/demos - List all demos")
        void testGetAllDemos() {
            given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("$", instanceOf(java.util.List.class));
        }

        @Test
        @DisplayName("GET /api/demos/active - List active demos")
        void testGetActiveDemos() {
            given()
                    .when()
                    .get("/active")
                    .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("$", instanceOf(java.util.List.class));
        }

        @Test
        @DisplayName("GET /api/demos/{id} - Get demo by ID - Returns sample demo")
        void testGetDemoById() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Get specific demo
            given()
                    .when()
                    .get("/" + demoId)
                    .then()
                    .statusCode(200)
                    .contentType(ContentType.JSON)
                    .body("id", equalTo(demoId))
                    .body("demoName", notNullValue())
                    .body("status", notNullValue());
        }

        @Test
        @DisplayName("GET /api/demos/{id} - Get non-existent demo returns 404")
        void testGetNonExistentDemo() {
            given()
                    .when()
                    .get("/nonexistent-id-12345")
                    .then()
                    .statusCode(404);
        }
    }

    // ==================== UPDATE DEMO TESTS ====================

    @Nested
    @DisplayName("Update Demo Operations")
    class UpdateDemoTests {

        @Test
        @DisplayName("PUT /api/demos/{id} - Update demo merkle root")
        void testUpdateDemoMerkleRoot() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Update merkle root
            given()
                    .contentType(ContentType.JSON)
                    .body("{\"merkleRoot\": \"0xabcdef123456\"}")
                    .when()
                    .put("/" + demoId)
                    .then()
                    .statusCode(200)
                    .body("id", equalTo(demoId));
        }
    }

    // ==================== DEMO LIFECYCLE TESTS ====================

    @Nested
    @DisplayName("Demo Lifecycle Operations")
    class DemoLifecycleTests {

        @Test
        @DisplayName("POST /api/demos/{id}/start - Start demo")
        void testStartDemo() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Start demo
            given()
                    .when()
                    .post("/" + demoId + "/start")
                    .then()
                    .statusCode(200)
                    .body("status", notNullValue());
        }

        @Test
        @DisplayName("POST /api/demos/{id}/stop - Stop demo")
        void testStopDemo() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Stop demo
            given()
                    .when()
                    .post("/" + demoId + "/stop")
                    .then()
                    .statusCode(200)
                    .body("status", notNullValue());
        }

        @Test
        @DisplayName("POST /api/demos/{id}/extend - Extend demo duration (admin only)")
        void testExtendDemo() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Extend demo
            given()
                    .queryParam("minutes", "15")
                    .queryParam("isAdmin", "true")
                    .when()
                    .post("/" + demoId + "/extend")
                    .then()
                    .statusCode(200)
                    .body("expiresAt", notNullValue());
        }

        @Test
        @DisplayName("POST /api/demos/{id}/extend - Non-admin cannot extend")
        void testExtendDemoNonAdmin() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Try to extend without admin flag - should fail
            given()
                    .queryParam("minutes", "15")
                    .queryParam("isAdmin", "false")
                    .when()
                    .post("/" + demoId + "/extend")
                    .then()
                    .statusCode(403);  // Forbidden - admin only
        }
    }

    // ==================== TRANSACTION TESTS ====================

    @Nested
    @DisplayName("Demo Transaction Operations")
    class DemoTransactionTests {

        @Test
        @DisplayName("POST /api/demos/{id}/transactions - Add transactions to demo")
        void testAddTransactions() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Add transactions
            given()
                    .queryParam("count", "10")
                    .when()
                    .post("/" + demoId + "/transactions")
                    .then()
                    .statusCode(200)
                    .body("transactionCount", greaterThanOrEqualTo(10));
        }

        @Test
        @DisplayName("POST /api/demos/{id}/transactions - Add transactions with merkle root")
        void testAddTransactionsWithMerkleRoot() {
            // Get first available demo
            String demoId = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("[0].id");

            // Add transactions with merkle root
            given()
                    .queryParam("count", "5")
                    .queryParam("merkleRoot", "0x123456789abcdef")
                    .when()
                    .post("/" + demoId + "/transactions")
                    .then()
                    .statusCode(200)
                    .body("merkleRoot", notNullValue());
        }
    }

    // ==================== DELETE DEMO TESTS ====================

    @Nested
    @DisplayName("Delete Demo Operations")
    class DeleteDemoTests {

        @Test
        @DisplayName("DELETE /api/demos/{id} - Delete demo")
        void testDeleteDemo() {
            // Create a demo first
            String requestBody = "{\n" +
                    "  \"demoName\": \"Demo to Delete\",\n" +
                    "  \"userEmail\": \"delete@example.com\",\n" +
                    "  \"userName\": \"Delete User\",\n" +
                    "  \"description\": \"This demo will be deleted\",\n" +
                    "  \"channels\": [],\n" +
                    "  \"validators\": [],\n" +
                    "  \"businessNodes\": [],\n" +
                    "  \"slimNodes\": []\n" +
                    "}";

            String demoId = given()
                    .contentType(ContentType.JSON)
                    .body(requestBody)
                    .when()
                    .post()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("id");

            // Delete the demo
            given()
                    .when()
                    .delete("/" + demoId)
                    .then()
                    .statusCode(204);

            // Verify deletion
            given()
                    .when()
                    .get("/" + demoId)
                    .then()
                    .statusCode(404);
        }
    }

    // ==================== PERSISTENCE TESTS ====================

    @Nested
    @DisplayName("Demo Persistence Tests")
    class PersistenceTests {

        @Test
        @DisplayName("Demos persist across API calls (in-database)")
        void testDemoPersistence() {
            // Get initial demo count
            int initialCount = given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .extract()
                    .jsonPath()
                    .getList("$")
                    .size();

            // Create a new demo
            String requestBody = "{\n" +
                    "  \"demoName\": \"Persistence Test Demo\",\n" +
                    "  \"userEmail\": \"persistence@example.com\",\n" +
                    "  \"userName\": \"Persistence User\",\n" +
                    "  \"description\": \"Testing persistence\",\n" +
                    "  \"channels\": [],\n" +
                    "  \"validators\": [],\n" +
                    "  \"businessNodes\": [],\n" +
                    "  \"slimNodes\": []\n" +
                    "}";

            String createdId = given()
                    .contentType(ContentType.JSON)
                    .body(requestBody)
                    .when()
                    .post()
                    .then()
                    .statusCode(200)
                    .extract()
                    .path("id");

            // Verify it appears in list
            given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .body("$", hasSize(greaterThan(initialCount)))
                    .body("id", hasItem(createdId));

            // Verify it can be retrieved directly
            given()
                    .when()
                    .get("/" + createdId)
                    .then()
                    .statusCode(200)
                    .body("id", equalTo(createdId));
        }

        @Test
        @DisplayName("Sample demos from database bootstrap are available")
        void testSampleDemosExist() {
            given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .body("$", hasSize(greaterThanOrEqualTo(3)))  // At least 3 sample demos
                    .body("demoName", hasItems(
                            containsString("Supply Chain"),
                            containsString("Healthcare"),
                            containsString("Financial")
                    ));
        }
    }

    // ==================== ERROR HANDLING TESTS ====================

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Invalid demo data returns 400")
        void testInvalidDemoCreation() {
            String invalidRequest = "{\n" +
                    "  \"demoName\": \"\",\n" +
                    "  \"userEmail\": \"invalid\",\n" +
                    "  \"userName\": \"\"\n" +
                    "}";

            given()
                    .contentType(ContentType.JSON)
                    .body(invalidRequest)
                    .when()
                    .post()
                    .then()
                    .statusCode(anyOf(
                            equalTo(400),  // Bad request
                            equalTo(422)   // Unprocessable entity
                    ));
        }

        @Test
        @DisplayName("Operations on non-existent demo return 404")
        void testOperationOnNonExistentDemo() {
            given()
                    .when()
                    .post("/nonexistent-demo-id/start")
                    .then()
                    .statusCode(404);
        }
    }

    // ==================== PERFORMANCE TESTS ====================

    @Nested
    @DisplayName("API Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("GET /api/demos - Response time < 500ms")
        void testGetDemosPerformance() {
            given()
                    .when()
                    .get()
                    .then()
                    .statusCode(200)
                    .time(lessThan(500L), java.util.concurrent.TimeUnit.MILLISECONDS);
        }

        @Test
        @DisplayName("POST /api/demos - Creation response time < 1000ms")
        void testCreateDemoPerformance() {
            String requestBody = "{\n" +
                    "  \"demoName\": \"Performance Test\",\n" +
                    "  \"userEmail\": \"perf@example.com\",\n" +
                    "  \"userName\": \"Perf User\",\n" +
                    "  \"description\": \"Performance test\",\n" +
                    "  \"channels\": [],\n" +
                    "  \"validators\": [],\n" +
                    "  \"businessNodes\": [],\n" +
                    "  \"slimNodes\": []\n" +
                    "}";

            given()
                    .contentType(ContentType.JSON)
                    .body(requestBody)
                    .when()
                    .post()
                    .then()
                    .statusCode(200)
                    .time(lessThan(1000L), java.util.concurrent.TimeUnit.MILLISECONDS);
        }
    }
}
