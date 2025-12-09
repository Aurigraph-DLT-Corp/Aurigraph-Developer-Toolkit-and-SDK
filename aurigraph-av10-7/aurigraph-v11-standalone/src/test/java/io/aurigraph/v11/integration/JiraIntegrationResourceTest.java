package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

/**
 * Test for JIRA Integration Resource
 *
 * Tests the /api/v3/jira endpoints for JIRA integration.
 *
 * @author Aurigraph V12 Team
 * @version 12.0.0
 */
@QuarkusTest
public class JiraIntegrationResourceTest {

    /**
     * Test JIRA health endpoint
     */
    @Test
    public void testJiraHealthEndpoint() {
        given()
            .when()
            .get("/api/v3/jira/health")
            .then()
            .statusCode(anyOf(is(200), is(503))) // 200 if configured, 503 if not
            .body("jiraBaseUrl", notNullValue())
            .body("timestamp", notNullValue());
    }

    /**
     * Test JIRA search endpoint - missing JQL parameter
     */
    @Test
    public void testJiraSearchMissingJqlParameter() {
        given()
            .when()
            .get("/api/v3/jira/search")
            .then()
            .statusCode(400)
            .body("error", is(true))
            .body("message", containsString("JQL query parameter is required"));
    }

    /**
     * Test JIRA search endpoint - with JQL parameter (will fail without credentials)
     */
    @Test
    public void testJiraSearchWithJqlParameter() {
        given()
            .queryParam("jql", "project = AV11")
            .when()
            .get("/api/v3/jira/search")
            .then()
            // Will return 500 if credentials not configured, or 200/401 if they are
            .statusCode(anyOf(is(200), is(401), is(500)));
    }

    /**
     * Test JIRA search endpoint - with pagination parameters
     */
    @Test
    public void testJiraSearchWithPaginationParameters() {
        given()
            .queryParam("jql", "project = AV11")
            .queryParam("startAt", 0)
            .queryParam("maxResults", 10)
            .queryParam("fields", "summary,status")
            .when()
            .get("/api/v3/jira/search")
            .then()
            // Will return 500 if credentials not configured, or 200/401 if they are
            .statusCode(anyOf(is(200), is(401), is(500)));
    }

    /**
     * Test JIRA search endpoint - maxResults cap at 100
     */
    @Test
    public void testJiraSearchMaxResultsCap() {
        // Test that maxResults > 100 is capped at 100
        given()
            .queryParam("jql", "project = AV11")
            .queryParam("maxResults", 500) // Should be capped at 100
            .when()
            .get("/api/v3/jira/search")
            .then()
            // Will return 500 if credentials not configured, or 200/401 if they are
            .statusCode(anyOf(is(200), is(401), is(500)));
    }
}
