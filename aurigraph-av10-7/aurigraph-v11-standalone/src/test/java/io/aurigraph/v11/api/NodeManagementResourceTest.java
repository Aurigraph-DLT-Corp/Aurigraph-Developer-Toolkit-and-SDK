package io.aurigraph.v11.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for NodeManagementResource
 * Tests the /api/v11/nodes endpoint
 *
 * Coverage target: 95%+
 */
@QuarkusTest
@DisplayName("Node Management API Tests")
public class NodeManagementResourceTest {

    @Test
    @DisplayName("GET /api/v11/nodes - Should return 200 with node list")
    public void testGetNodes_Success() {
        given()
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .body("nodes", notNullValue())
                .body("totalNodes", greaterThan(0))
                .body("page", is(0))
                .body("size", is(20))
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/nodes with pagination - Should return correct page")
    public void testGetNodes_WithPagination() {
        given()
            .queryParam("page", 1)
            .queryParam("size", 10)
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .body("page", is(1))
                .body("size", is(10))
                .body("nodes.size()", lessThanOrEqualTo(10));
    }

    @Test
    @DisplayName("GET /api/v11/nodes with status filter - Should return filtered nodes")
    public void testGetNodes_WithStatusFilter() {
        given()
            .queryParam("status", "ACTIVE")
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .body("nodes", notNullValue())
                .body("nodes[0].status", is("ACTIVE"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes with type filter - Should return filtered nodes")
    public void testGetNodes_WithTypeFilter() {
        given()
            .queryParam("type", "VALIDATOR")
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .body("nodes", notNullValue())
                .body("nodes[0].nodeType", is("VALIDATOR"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes with invalid pagination - Should return 400")
    public void testGetNodes_InvalidPagination() {
        given()
            .queryParam("page", -1)
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(400)
                .body("error", is("Invalid pagination parameters"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes/{nodeId} - Should return node details")
    public void testGetNode_Success() {
        given()
            .pathParam("nodeId", "validator-000")
            .when()
                .get("/api/v11/nodes/{nodeId}")
            .then()
                .statusCode(200)
                .body("nodeId", is("validator-000"))
                .body("nodeType", notNullValue())
                .body("status", notNullValue())
                .body("resourceUsage", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/nodes/{nodeId} - Should return 404 for non-existent node")
    public void testGetNode_NotFound() {
        given()
            .pathParam("nodeId", "non-existent-node")
            .when()
                .get("/api/v11/nodes/{nodeId}")
            .then()
                .statusCode(404)
                .body("error", is("Node not found"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes/summary - Should return summary statistics")
    public void testGetNodesSummary_Success() {
        given()
            .when()
                .get("/api/v11/nodes/summary")
            .then()
                .statusCode(200)
                .body("totalNodes", greaterThan(0))
                .body("activeNodes", greaterThanOrEqualTo(0))
                .body("byType", notNullValue())
                .body("byStatus", notNullValue())
                .body("averageSyncProgress", greaterThanOrEqualTo(0.0))
                .body("timestamp", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/nodes - Should return nodes with resource usage")
    public void testGetNodes_ResourceUsage() {
        Response response = given()
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .extract().response();

        // Verify resource usage structure
        assertEquals(20, (int) response.path("nodes.size()"));
        assertNotNull(response.path("nodes[0].resourceUsage.cpuPercent"));
        assertNotNull(response.path("nodes[0].resourceUsage.memoryPercent"));
        assertNotNull(response.path("nodes[0].resourceUsage.diskPercent"));
        assertNotNull(response.path("nodes[0].resourceUsage.networkPercent"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes - Should return nodes with location data")
    public void testGetNodes_LocationData() {
        Response response = given()
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .extract().response();

        // Verify location structure
        assertNotNull(response.path("nodes[0].location.country"));
        assertNotNull(response.path("nodes[0].location.region"));
        assertNotNull(response.path("nodes[0].location.city"));
        assertNotNull(response.path("nodes[0].location.latitude"));
        assertNotNull(response.path("nodes[0].location.longitude"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes - Should have proper pagination metadata")
    public void testGetNodes_PaginationMetadata() {
        given()
            .queryParam("page", 0)
            .queryParam("size", 10)
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .body("totalPages", greaterThan(0))
                .body("hasNext", notNullValue())
                .body("hasPrevious", notNullValue());
    }

    @Test
    @DisplayName("GET /api/v11/nodes - Should return nodes with sync progress")
    public void testGetNodes_SyncProgress() {
        Response response = given()
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .extract().response();

        // Verify sync progress is valid percentage
        Double syncProgress = response.path("nodes[0].syncProgress");
        assertNotNull(syncProgress);
        assertTrue(syncProgress >= 0 && syncProgress <= 100);
    }

    @Test
    @DisplayName("GET /api/v11/nodes - Should return nodes with uptime")
    public void testGetNodes_Uptime() {
        Response response = given()
            .when()
                .get("/api/v11/nodes")
            .then()
                .statusCode(200)
                .extract().response();

        // Verify uptime is present and valid
        Long uptimeSeconds = response.path("nodes[0].uptimeSeconds");
        assertNotNull(uptimeSeconds);
        assertTrue(uptimeSeconds >= 0);
    }

    @Test
    @DisplayName("GET /api/v11/nodes/summary - Should have node type breakdown")
    public void testGetNodesSummary_TypeBreakdown() {
        Response response = given()
            .when()
                .get("/api/v11/nodes/summary")
            .then()
                .statusCode(200)
                .extract().response();

        // Verify type breakdown
        assertNotNull(response.path("byType.validators"));
        assertNotNull(response.path("byType.apiNodes"));
        assertNotNull(response.path("byType.businessNodes"));
        assertNotNull(response.path("byType.channelNodes"));
    }

    @Test
    @DisplayName("GET /api/v11/nodes/summary - Should have status breakdown")
    public void testGetNodesSummary_StatusBreakdown() {
        Response response = given()
            .when()
                .get("/api/v11/nodes/summary")
            .then()
                .statusCode(200)
                .extract().response();

        // Verify status breakdown
        assertNotNull(response.path("byStatus.active"));
        assertNotNull(response.path("byStatus.syncing"));
        assertNotNull(response.path("byStatus.offline"));
    }
}
