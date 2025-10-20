package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.lessThan;
import java.util.concurrent.TimeUnit;

@QuarkusTest
class AurigraphResourceTest {
    
    @Test
    @DisplayName("Health endpoint should return healthy status")
    void testHealthEndpoint() {
        given()
            .when().get("/api/v11/health")
            .then()
                .statusCode(200)
                .body("status", is("HEALTHY"))
                .body("version", is("11.0.0-standalone"))
                .body("platform", is("Java/Quarkus/GraalVM"));
    }
    
    @Test
    @DisplayName("System info endpoint should return platform details")
    void testSystemInfoEndpoint() {
        given()
            .when().get("/api/v11/info")
            .then()
                .statusCode(200)
                .body("platform.name", is("Aurigraph V11"))
                .body("platform.version", is("11.3.0"))
                .body("features.consensus", is("HyperRAFT++"))
                .body("features.api_version", is("v11"));
    }
    
    @Test
    @DisplayName("Basic performance test should achieve reasonable TPS")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testBasicPerformance() {
        given()
            .queryParam("iterations", 10000)
            .queryParam("threads", 4)
            .when().get("/api/v11/performance")
            .then()
                .statusCode(200)
                .body("iterations", is(10000))
                .body("threadCount", is(4))
                .body("transactionsPerSecond", greaterThan(100000.0f)); // At least 100K TPS
    }
    
    @ParameterizedTest
    @ValueSource(ints = {1000, 5000, 10000})
    @DisplayName("Performance test with various iteration counts")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testPerformanceWithVariousIterations(int iterations) {
        given()
            .queryParam("iterations", iterations)
            .queryParam("threads", 8)
            .when().get("/api/v11/performance")
            .then()
                .statusCode(200)
                .body("iterations", is(iterations))
                .body("transactionsPerSecond", greaterThan(10000.0f)); // At least 10K TPS (relaxed for test environment variability)
    }
    
    @Test
    @DisplayName("Reactive performance test should work")
    @Timeout(value = 45, unit = TimeUnit.SECONDS)
    void testReactivePerformance() {
        given()
            .queryParam("iterations", 5000)
            .when().get("/api/v11/performance/reactive")
            .then()
                .statusCode(200)
                .body("iterations", is(5000))
                .body("optimizations", containsString("Reactive"))
                .body("transactionsPerSecond", greaterThan(10000.0f));
    }
    
    @Test
    @DisplayName("Transaction stats should provide system metrics")
    void testTransactionStats() {
        given()
            .when().get("/api/v11/stats")
            .then()
                .statusCode(200)
                .body("shardCount", greaterThan(0))
                .body("availableProcessors", greaterThan(0))
                .body("consensusAlgorithm", is("HyperRAFT++"));
    }
    
    @Test
    @DisplayName("High-load performance test (targeting 2M+ TPS preparation)")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testHighLoadPerformance() {
        // This test prepares for the 2M+ TPS requirement
        // Currently testing with smaller numbers but validating the path
        given()
            .queryParam("iterations", 50000)
            .queryParam("threads", 32)
            .when().get("/api/v11/performance")
            .then()
                .statusCode(200)
                .body("iterations", is(50000))
                .body("threadCount", is(32))
                .body("durationMs", lessThan(5000.0f)) // Should complete in under 5 seconds
                .body("transactionsPerSecond", greaterThan(500000.0f)); // Approaching target
    }
}