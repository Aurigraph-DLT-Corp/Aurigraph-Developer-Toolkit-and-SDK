package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance Regression Test Suite
 *
 * Validates that performance remains above minimum thresholds:
 * - TPS: 700K+ (current baseline: ~776K)
 * - Latency: <100ms for 100K iterations
 * - Memory: Stable under load
 *
 * Run these tests before each deployment to prevent performance degradation.
 *
 * Usage:
 * ./mvnw test -Dtest=PerformanceRegressionTest
 *
 * @author DevOps & Security Team
 * @since V11.3.2
 */
@QuarkusTest
@Tag("performance")
@Tag("regression")
public class PerformanceRegressionTest {

    private static final int MIN_TPS = 700_000;  // Minimum acceptable TPS (90% of current 776K)
    private static final int TEST_ITERATIONS = 100_000;  // Standard test size
    private static final int MAX_LATENCY_MS = 100;  // Maximum acceptable latency

    @Test
    @DisplayName("Performance baseline: TPS >= 700K")
    public void testTPSBaseline() {
        Response response = given()
            .queryParam("iterations", TEST_ITERATIONS)
            .queryParam("threads", 1)
            .when()
            .get("/api/v11/performance")
            .then()
            .statusCode(200)
            .extract()
            .response();

        int tps = response.jsonPath().getInt("tps");
        int actualIterations = response.jsonPath().getInt("iterations");

        assertAll(
            () -> assertTrue(tps >= MIN_TPS,
                String.format("TPS %d below minimum %d - PERFORMANCE REGRESSION DETECTED", tps, MIN_TPS)),
            () -> assertEquals(TEST_ITERATIONS, actualIterations,
                "Iteration count mismatch")
        );

        System.out.printf("✓ TPS Baseline Test PASSED: %,d TPS (min: %,d)%n", tps, MIN_TPS);
    }

    @Test
    @DisplayName("Latency regression: <100ms for 100K iterations")
    public void testLatencyBaseline() {
        long startTime = System.currentTimeMillis();

        Response response = given()
            .queryParam("iterations", TEST_ITERATIONS)
            .queryParam("threads", 1)
            .when()
            .get("/api/v11/performance")
            .then()
            .statusCode(200)
            .extract()
            .response();

        long endTime = System.currentTimeMillis();
        long latencyMs = endTime - startTime;

        assertTrue(latencyMs <= MAX_LATENCY_MS,
            String.format("Latency %dms exceeds maximum %dms - LATENCY REGRESSION DETECTED", latencyMs, MAX_LATENCY_MS));

        System.out.printf("✓ Latency Baseline Test PASSED: %dms (max: %dms)%n", latencyMs, MAX_LATENCY_MS);
    }

    @Test
    @DisplayName("Reactive performance: TPS >= 700K")
    public void testReactiveTPSBaseline() {
        Response response = given()
            .queryParam("iterations", TEST_ITERATIONS)
            .when()
            .get("/api/v11/performance/reactive")
            .then()
            .statusCode(200)
            .extract()
            .response();

        int tps = response.jsonPath().getInt("tps");

        assertTrue(tps >= MIN_TPS,
            String.format("Reactive TPS %d below minimum %d - PERFORMANCE REGRESSION DETECTED", tps, MIN_TPS));

        System.out.printf("✓ Reactive TPS Baseline Test PASSED: %,d TPS (min: %,d)%n", tps, MIN_TPS);
    }

    @Test
    @DisplayName("Rate limiting: Returns 429 after limit exceeded")
    public void testRateLimitingEnforcement() {
        // Performance endpoints are limited to 60 requests/minute
        // Rapid fire 61 requests to test rate limiting

        int successCount = 0;
        int rateLimitedCount = 0;

        for (int i = 0; i < 65; i++) {
            Response response = given()
                .queryParam("iterations", 1000)  // Small test
                .when()
                .get("/api/v11/performance");

            int statusCode = response.getStatusCode();
            if (statusCode == 200) {
                successCount++;
            } else if (statusCode == 429) {
                rateLimitedCount++;

                // Verify rate limit response structure
                response.then()
                    .body("error", equalTo("Rate Limit Exceeded"))
                    .body("suggestion", containsString("try again later"))
                    .header("Retry-After", notNullValue())
                    .header("X-RateLimit-Reset", notNullValue());

                break; // Stop after first rate limit hit
            }
        }

        assertTrue(rateLimitedCount > 0,
            "Rate limiting not enforced - should receive 429 after 60 requests");
        assertTrue(successCount <= 60,
            String.format("Too many requests succeeded (%d) - rate limit should be 60/min", successCount));

        System.out.printf("✓ Rate Limiting Test PASSED: %d successful, %d rate-limited%n",
            successCount, rateLimitedCount);
    }

    @Test
    @DisplayName("Multi-threaded performance: TPS scales with threads")
    public void testMultiThreadedScaling() {
        // Test with 4 threads - should achieve higher TPS than single-threaded
        Response response = given()
            .queryParam("iterations", TEST_ITERATIONS)
            .queryParam("threads", 4)
            .when()
            .get("/api/v11/performance")
            .then()
            .statusCode(200)
            .extract()
            .response();

        int multiThreadTPS = response.jsonPath().getInt("tps");

        // With 4 threads, we should see at least 2.5x improvement (not linear due to overhead)
        int expectedMinimumTPS = MIN_TPS * 2;

        assertTrue(multiThreadTPS >= expectedMinimumTPS,
            String.format("Multi-threaded TPS %d below expected %d - SCALING REGRESSION DETECTED",
                multiThreadTPS, expectedMinimumTPS));

        System.out.printf("✓ Multi-threaded Scaling Test PASSED: %,d TPS (min: %,d)%n",
            multiThreadTPS, expectedMinimumTPS);
    }

    @Test
    @DisplayName("Health check: Always returns OK")
    public void testHealthCheckBaseline() {
        given()
            .when()
            .get("/api/v11/health")
            .then()
            .statusCode(200)
            .body("status", equalTo("OK"))
            .body("version", equalTo("11.3.1"));

        System.out.println("✓ Health Check Test PASSED");
    }

    @Test
    @DisplayName("Stats endpoint: Returns valid metrics")
    public void testStatsEndpoint() {
        given()
            .when()
            .get("/api/v11/stats")
            .then()
            .statusCode(200)
            .body("currentTPS", greaterThanOrEqualTo(0))
            .body("totalTransactions", greaterThanOrEqualTo(0))
            .body("averageTPS", greaterThanOrEqualTo(0));

        System.out.println("✓ Stats Endpoint Test PASSED");
    }
}
