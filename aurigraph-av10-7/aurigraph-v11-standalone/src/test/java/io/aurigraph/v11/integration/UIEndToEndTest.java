package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@QuarkusTest
public class UIEndToEndTest {

    @Test
    @DisplayName("Verify Platform Status API for Dashboard")
    public void testPlatformStatusEndpoint() {
        given()
                .when().get("/api/v11/status")
                .then()
                .statusCode(200)
                .body("status", notNullValue())
                .body("version", notNullValue());
    }

    @Test
    @DisplayName("Verify Performance Metrics API for Dashboard Charts")
    public void testPerformanceMetricsEndpoint() {
        given()
                .when().get("/api/v11/performance/metrics")
                .then()
                .statusCode(200)
                .body("currentTPS", greaterThanOrEqualTo(0.0f))
                .body("totalTransactions", greaterThanOrEqualTo(0));
    }

    @Test
    @DisplayName("Verify Data Feed Registry for Feed Manager UI")
    public void testDataFeedsEndpoint() {
        given()
                .when().get("/api/v11/datafeeds")
                .then()
                .statusCode(200)
                .body("feeds", notNullValue());
    }

    @Test
    @DisplayName("Verify Asset Token Stats for Token Dashboard")
    public void testTokenStatsEndpoint() {
        given()
                .when().get("/api/v11/feed-tokens/stats")
                .then()
                .statusCode(200)
                .body("totalMarketCap", notNullValue());
    }

    @Test
    @DisplayName("Verify Static UI Resources Availability")
    public void testUIResourceAvailability() {
        // Dashboard
        RestAssured.get("/dashboard.html").then().statusCode(200);
        // Feed Manager
        RestAssured.get("/datafeed-ui.html").then().statusCode(200);
        // Token Dashboard
        RestAssured.get("/feed-tokens-ui.html").then().statusCode(200);
        // Common Styles
        RestAssured.get("/styles.css").then().statusCode(200);
    }
}
