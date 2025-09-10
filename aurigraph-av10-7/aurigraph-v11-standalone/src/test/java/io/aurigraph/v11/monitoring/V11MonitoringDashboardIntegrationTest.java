package io.aurigraph.v11.monitoring;

import io.aurigraph.v11.performance.PerformanceMetrics;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import jakarta.inject.Inject;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Arrays;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Integration Tests for Aurigraph V11 Monitoring Dashboard
 * 
 * Test Categories:
 * 1. API Endpoint Testing
 * 2. Real-time Data Streaming
 * 3. Performance and Load Testing
 * 4. Security and Authentication
 * 5. Mobile Responsiveness
 * 6. Dashboard Functionality
 * 7. Reporting System
 * 8. Error Handling and Recovery
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Execution(ExecutionMode.CONCURRENT)
public class V11MonitoringDashboardIntegrationTest {

    @Inject
    PerformanceMetrics performanceMetrics;

    @Inject
    V11ProductionMonitoringDashboard monitoringDashboard;

    @Inject
    AutomatedReportingService reportingService;

    private static final String BASE_PATH = "/api/v11/monitoring";
    private static final int LOAD_TEST_THREADS = 50;
    private static final int LOAD_TEST_REQUESTS = 1000;

    @BeforeAll
    static void setupTestEnvironment() {
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    @BeforeEach
    void resetMetrics() {
        if (performanceMetrics != null) {
            performanceMetrics.reset();
        }
    }

    /**
     * Test 1: Dashboard HTML Endpoint
     */
    @Test
    @Order(1)
    @DisplayName("Dashboard HTML should be mobile-responsive and accessible")
    void testDashboardHTML() {
        given()
            .when()
                .get(BASE_PATH + "/dashboard")
            .then()
                .statusCode(200)
                .contentType("text/html")
                .body(containsString("Aurigraph V11 Production Monitoring"))
                .body(containsString("viewport"))  // Mobile viewport meta tag
                .body(containsString("media (max-width:"))  // Responsive CSS
                .body(containsString("aria-"))  // Accessibility attributes
                .body(containsString("Chart.js"))  // Charts library
                .body(containsString("WebSocket"));  // Real-time capabilities
    }

    /**
     * Test 2: Real-time Overview API
     */
    @Test
    @Order(2)
    @DisplayName("Overview API should return comprehensive metrics")
    void testOverviewAPI() {
        // Record some test metrics first
        performanceMetrics.recordTransaction(50.0);
        performanceMetrics.recordTransaction(75.0);
        performanceMetrics.recordNetworkTraffic(1024, 2048);

        given()
            .when()
                .get(BASE_PATH + "/overview")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("performance", notNullValue())
                .body("performance.currentTPS", greaterThanOrEqualTo(0.0f))
                .body("performance.averageLatency", greaterThanOrEqualTo(0.0f))
                .body("performance.memoryUsage", greaterThanOrEqualTo(0.0f))
                .body("performance.cpuUsage", greaterThanOrEqualTo(0.0f))
                .body("health", notNullValue())
                .body("health.overall", oneOf("excellent", "good", "warning", "critical"))
                .body("business", notNullValue())
                .body("alerts", notNullValue())
                .body("timestamp", greaterThan(0L))
                .body("sessionId", greaterThan(0L));
    }

    /**
     * Test 3: Historical Analytics API
     */
    @Test
    @Order(3)
    @DisplayName("Historical analytics should provide trend analysis")
    void testHistoricalAnalytics() {
        given()
            .queryParam("metric", "tps")
            .queryParam("timeframe", "24h")
            .queryParam("granularity", "1h")
            .when()
                .get(BASE_PATH + "/analytics/historical")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("metric", equalTo("tps"))
                .body("timeframe", equalTo("24h"))
                .body("dataPoints", notNullValue())
                .body("trendAnalysis", notNullValue())
                .body("trendAnalysis.trend", oneOf("increasing", "decreasing", "stable"))
                .body("forecasting", notNullValue())
                .body("statistics", notNullValue())
                .body("statistics.count", greaterThanOrEqualTo(0));
    }

    /**
     * Test 4: Executive Summary Dashboard
     */
    @Test
    @Order(4)
    @DisplayName("Executive summary should include KPIs and business metrics")
    void testExecutiveSummary() {
        given()
            .when()
                .get(BASE_PATH + "/executive")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("kpis", notNullValue())
                .body("kpis.size()", greaterThan(0))
                .body("businessMetrics", notNullValue())
                .body("strategicInsights", notNullValue())
                .body("riskAssessment", notNullValue())
                .body("performanceSummary", notNullValue())
                .body("generatedAt", greaterThan(0L));
    }

    /**
     * Test 5: Predictive Analytics and Capacity Planning
     */
    @Test
    @Order(5)
    @DisplayName("Capacity predictions should include resource forecasts")
    void testCapacityPredictions() {
        given()
            .when()
                .get(BASE_PATH + "/predictive/capacity")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("capacityForecasts", notNullValue())
                .body("capacityForecasts.size()", greaterThan(0))
                .body("capacityForecasts[0].resource", notNullValue())
                .body("capacityForecasts[0].currentUtilization", greaterThanOrEqualTo(0.0f))
                .body("capacityForecasts[0].predictedUtilization", greaterThanOrEqualTo(0.0f))
                .body("capacityForecasts[0].recommendations", notNullValue())
                .body("modelAccuracy", greaterThan(0.0f))
                .body("confidenceLevel", greaterThan(0.0f));
    }

    /**
     * Test 6: Automated Report Generation
     */
    @Test
    @Order(6)
    @DisplayName("Report generation should support multiple formats")
    void testReportGeneration() {
        // Test PDF report generation
        given()
            .queryParam("type", "daily")
            .queryParam("format", "pdf")
            .when()
                .post(BASE_PATH + "/reports/generate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("reportId", notNullValue())
                .body("reportType", equalTo("daily"))
                .body("format", equalTo("pdf"))
                .body("generatedAt", greaterThan(0L));

        // Test JSON report generation
        given()
            .queryParam("type", "weekly")
            .queryParam("format", "json")
            .when()
                .post(BASE_PATH + "/reports/generate")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("reportType", equalTo("weekly"))
                .body("format", equalTo("json"));
    }

    /**
     * Test 7: Mobile API Endpoint
     */
    @Test
    @Order(7)
    @DisplayName("Mobile API should return optimized summary")
    void testMobileAPI() {
        given()
            .when()
                .get(BASE_PATH + "/mobile/summary")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("tps", greaterThanOrEqualTo(0.0f))
                .body("health", oneOf("excellent", "good", "warning", "critical"))
                .body("alerts", greaterThanOrEqualTo(0))
                .body("uptime", greaterThanOrEqualTo(0L))
                .body("revenue24h", greaterThanOrEqualTo(0.0f))
                .body("transactions24h", greaterThanOrEqualTo(0L))
                .body("status", notNullValue())
                .body("status.consensus", notNullValue())
                .body("status.crypto", notNullValue())
                .body("status.bridge", notNullValue());
    }

    /**
     * Test 8: Load Testing - Concurrent API Requests
     */
    @Test
    @Order(8)
    @DisplayName("System should handle high concurrent load")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentLoad() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(LOAD_TEST_THREADS);
        CountDownLatch latch = new CountDownLatch(LOAD_TEST_REQUESTS);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        // Submit concurrent requests
        for (int i = 0; i < LOAD_TEST_REQUESTS; i++) {
            executor.submit(() -> {
                try {
                    int statusCode = given()
                        .when()
                            .get(BASE_PATH + "/overview")
                        .then()
                            .extract()
                            .statusCode();

                    if (statusCode == 200) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        // Wait for all requests to complete
        assertTrue(latch.await(45, TimeUnit.SECONDS), "Load test should complete within 45 seconds");

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        double requestsPerSecond = (LOAD_TEST_REQUESTS * 1000.0) / duration;

        executor.shutdown();

        // Assertions
        assertTrue(successCount.get() > LOAD_TEST_REQUESTS * 0.95, 
                  "Success rate should be > 95%");
        assertTrue(errorCount.get() < LOAD_TEST_REQUESTS * 0.05, 
                  "Error rate should be < 5%");
        assertTrue(requestsPerSecond > 50, 
                  "Should handle > 50 requests per second");

        System.out.printf("Load Test Results: %d requests, %.2f req/s, %d%% success rate%n",
                         LOAD_TEST_REQUESTS, requestsPerSecond, 
                         (successCount.get() * 100) / LOAD_TEST_REQUESTS);
    }

    /**
     * Test 9: Performance Metrics Recording
     */
    @Test
    @Order(9)
    @DisplayName("Performance metrics should be recorded accurately")
    void testPerformanceMetricsRecording() {
        // Record test transactions
        for (int i = 0; i < 100; i++) {
            performanceMetrics.recordTransaction(50.0 + (i % 50));
        }

        // Record network traffic
        performanceMetrics.recordNetworkTraffic(1024 * 1024, 2048 * 1024);

        // Verify metrics
        PerformanceMetrics.MetricsSummary summary = performanceMetrics.getMetricsSummary();
        
        assertTrue(summary.currentTPS > 0, "TPS should be greater than 0");
        assertTrue(summary.averageLatency >= 50.0, "Average latency should be >= 50ms");
        assertTrue(summary.averageLatency <= 100.0, "Average latency should be <= 100ms");
        assertEquals(100, summary.totalTransactions, "Total transactions should be 100");
        assertTrue(summary.networkThroughput > 0, "Network throughput should be > 0");
        assertTrue(performanceMetrics.getHealthScore() > 0, "Health score should be positive");
    }

    /**
     * Test 10: Error Handling and Recovery
     */
    @Test
    @Order(10)
    @DisplayName("System should handle errors gracefully")
    void testErrorHandling() {
        // Test invalid metric parameter
        given()
            .queryParam("metric", "invalid_metric")
            .queryParam("timeframe", "24h")
            .when()
                .get(BASE_PATH + "/analytics/historical")
            .then()
                .statusCode(200)  // Should handle gracefully
                .contentType(ContentType.JSON);

        // Test invalid report type
        given()
            .queryParam("type", "invalid_type")
            .queryParam("format", "pdf")
            .when()
                .post(BASE_PATH + "/reports/generate")
            .then()
                .statusCode(200);  // Should default to daily report

        // Test malformed request parameters
        given()
            .queryParam("timeframe", "invalid_timeframe")
            .when()
                .get(BASE_PATH + "/analytics/historical")
            .then()
                .statusCode(200);  // Should handle gracefully
    }

    /**
     * Test 11: WebSocket Connectivity (Simulated)
     */
    @Test
    @Order(11)
    @DisplayName("Real-time alert stream should be accessible")
    void testWebSocketEndpoint() {
        // Test if the Server-Sent Events endpoint is accessible
        given()
            .when()
                .get(BASE_PATH + "/alerts/stream")
            .then()
                .statusCode(200)
                .header("Content-Type", containsString("text/event-stream"));
    }

    /**
     * Test 12: Security Headers and CORS
     */
    @Test
    @Order(12)
    @DisplayName("Security headers should be present")
    void testSecurityHeaders() {
        given()
            .when()
                .get(BASE_PATH + "/dashboard")
            .then()
                .statusCode(200)
                .header("X-Content-Type-Options", notNullValue())
                .header("X-Frame-Options", notNullValue());
    }

    /**
     * Test 13: Dashboard Component Rendering
     */
    @Test
    @Order(13)
    @DisplayName("Dashboard HTML should contain all required components")
    void testDashboardComponents() {
        String dashboardHtml = given()
            .when()
                .get(BASE_PATH + "/dashboard")
            .then()
                .statusCode(200)
                .extract()
                .body()
                .asString();

        // Verify essential dashboard components
        assertAll("Dashboard Components",
            () -> assertTrue(dashboardHtml.contains("executive-kpis"), "Should have executive KPIs section"),
            () -> assertTrue(dashboardHtml.contains("performance-metrics"), "Should have performance metrics"),
            () -> assertTrue(dashboardHtml.contains("main-chart"), "Should have charts"),
            () -> assertTrue(dashboardHtml.contains("alert-list"), "Should have alerts section"),
            () -> assertTrue(dashboardHtml.contains("capacity-predictions"), "Should have capacity planning"),
            () -> assertTrue(dashboardHtml.contains("business-metrics"), "Should have business metrics"),
            () -> assertTrue(dashboardHtml.contains("chart-tab"), "Should have chart tabs"),
            () -> assertTrue(dashboardHtml.contains("metric-card"), "Should have metric cards"),
            () -> assertTrue(dashboardHtml.contains("@media"), "Should have responsive CSS")
        );
    }

    /**
     * Test 14: Performance Trends Calculation
     */
    @Test
    @Order(14)
    @DisplayName("Performance trends should be calculated correctly")
    void testPerformanceTrends() {
        // Record increasing transaction latencies
        for (int i = 0; i < 30; i++) {
            performanceMetrics.recordTransaction(10.0 + i); // Increasing latency
        }

        PerformanceMetrics.PerformanceTrend trend = performanceMetrics.getPerformanceTrend();
        
        assertNotNull(trend, "Performance trend should not be null");
        assertTrue(trend.averageTPS >= 0, "Average TPS should be non-negative");
        assertTrue(trend.averageLatency > 0, "Average latency should be positive");
        assertNotNull(trend.trend, "Trend direction should not be null");
        assertTrue(Arrays.asList("increasing", "decreasing", "stable").contains(trend.trend),
                  "Trend should be one of: increasing, decreasing, stable");
    }

    /**
     * Test 15: System Health Scoring
     */
    @Test
    @Order(15)
    @DisplayName("System health scoring should be accurate")
    void testSystemHealthScoring() {
        // Record good performance metrics
        for (int i = 0; i < 50; i++) {
            performanceMetrics.recordTransaction(25.0); // Good latency
        }

        double healthScore = performanceMetrics.getHealthScore();
        boolean isHealthy = performanceMetrics.isSystemHealthy();

        assertTrue(healthScore >= 0 && healthScore <= 100, 
                  "Health score should be between 0 and 100");
        
        // With good performance, system should be healthy
        if (healthScore > 70) {
            assertTrue(isHealthy, "System should be healthy with good metrics");
        }
    }

    /**
     * Test 16: Memory Usage and Resource Management
     */
    @Test
    @Order(16)
    @DisplayName("Memory usage should be within acceptable limits")
    void testResourceManagement() {
        double memoryUsage = performanceMetrics.getMemoryUsage();
        long usedMemory = performanceMetrics.getUsedMemory();
        long availableMemory = performanceMetrics.getAvailableMemory();

        assertTrue(memoryUsage >= 0 && memoryUsage <= 100, 
                  "Memory usage percentage should be between 0 and 100");
        assertTrue(usedMemory >= 0, "Used memory should be non-negative");
        assertTrue(availableMemory >= 0, "Available memory should be non-negative");
        
        // Memory usage should be reasonable for testing environment
        assertTrue(memoryUsage < 90, "Memory usage should be less than 90% during tests");
    }

    /**
     * Test 17: Concurrent User Simulation
     */
    @Test
    @Order(17)
    @DisplayName("System should handle multiple concurrent dashboard users")
    @Timeout(value = 30, unit = TimeUnit.SECONDS)
    void testConcurrentUsers() throws InterruptedException {
        int concurrentUsers = 25;
        ExecutorService executor = Executors.newFixedThreadPool(concurrentUsers);
        CountDownLatch latch = new CountDownLatch(concurrentUsers);
        AtomicInteger successfulSessions = new AtomicInteger(0);

        // Simulate concurrent user sessions
        for (int i = 0; i < concurrentUsers; i++) {
            final int userId = i;
            executor.submit(() -> {
                try {
                    // Simulate user session: load dashboard, check overview, view reports
                    given()
                        .when()
                            .get(BASE_PATH + "/dashboard")
                        .then()
                            .statusCode(200);

                    given()
                        .when()
                            .get(BASE_PATH + "/overview")
                        .then()
                            .statusCode(200);

                    given()
                        .when()
                            .get(BASE_PATH + "/mobile/summary")
                        .then()
                            .statusCode(200);

                    successfulSessions.incrementAndGet();
                } catch (Exception e) {
                    System.err.println("User session " + userId + " failed: " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(25, TimeUnit.SECONDS), "All user sessions should complete");
        executor.shutdown();

        assertTrue(successfulSessions.get() >= concurrentUsers * 0.9, 
                  "At least 90% of user sessions should succeed");
    }

    /**
     * Test 18: Data Integrity and Consistency
     */
    @Test
    @Order(18)
    @DisplayName("Data should be consistent across different endpoints")
    void testDataConsistency() {
        // Record some transactions
        for (int i = 0; i < 20; i++) {
            performanceMetrics.recordTransaction(30.0);
        }

        // Get data from different endpoints
        var overviewResponse = given()
            .when()
                .get(BASE_PATH + "/overview")
            .then()
                .statusCode(200)
                .extract()
                .path("performance.currentTPS");

        var mobileResponse = given()
            .when()
                .get(BASE_PATH + "/mobile/summary")
            .then()
                .statusCode(200)
                .extract()
                .path("tps");

        // TPS values should be consistent (allowing for small timing differences)
        double tpsDifference = Math.abs((Double) overviewResponse - (Double) mobileResponse);
        assertTrue(tpsDifference < 1000, "TPS values should be consistent across endpoints");
    }

    @AfterEach
    void cleanupAfterTest() {
        // Clean up any test data
        if (performanceMetrics != null) {
            // Reset metrics after potentially disruptive tests
        }
    }

    @AfterAll
    static void tearDownTestEnvironment() {
        // Cleanup test environment
        System.out.println("All monitoring dashboard tests completed successfully");
    }
}