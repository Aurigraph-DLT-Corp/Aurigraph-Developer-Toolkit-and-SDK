package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance and Load Testing Suite
 *
 * TEST COVERAGE:
 * 1. Load Tests - 1,000 concurrent requests per endpoint
 * 2. Stress Tests - Peak load scenarios
 * 3. Latency Tests - Response time <200ms
 * 4. Throughput Tests - Requests per second
 * 5. Concurrency Tests - Thread safety validation
 *
 * METRICS TRACKED:
 * - Average latency
 * - P95, P99 latency percentiles
 * - Success rate
 * - Throughput (requests/second)
 * - Error rate
 *
 * @author QA Performance Specialist
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Performance & Load Testing Suite")
public class PerformanceTests {

    private static final int CONCURRENT_REQUESTS = 1000;
    private static final int WARMUP_REQUESTS = 100;
    private static final int LATENCY_THRESHOLD_MS = 200;

    private static final ExecutorService executor = Executors.newFixedThreadPool(50);
    private static PerformanceMetrics overallMetrics;

    @BeforeAll
    public static void setupPerformanceTests() {
        overallMetrics = new PerformanceMetrics();
        System.out.println("=".repeat(80));
        System.out.println("PERFORMANCE TEST SUITE");
        System.out.println("=".repeat(80));
        System.out.println("Concurrent Requests:  " + CONCURRENT_REQUESTS);
        System.out.println("Latency Threshold:    " + LATENCY_THRESHOLD_MS + "ms");
        System.out.println("Thread Pool Size:     50");
        System.out.println("=".repeat(80));
    }

    @AfterAll
    public static void tearDownPerformanceTests() {
        executor.shutdown();
        printPerformanceReport();
    }

    private static void printPerformanceReport() {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("PERFORMANCE TEST REPORT");
        System.out.println("=".repeat(80));

        // Null check to prevent NullPointerException
        if (overallMetrics == null) {
            System.out.println("WARNING: Performance metrics not initialized. Tests may have been skipped or failed during setup.");
            System.out.println("=".repeat(80));
            return;
        }

        System.out.println(String.format("Total Requests:       %,d", overallMetrics.totalRequests.get()));
        System.out.println(String.format("Successful Requests:  %,d", overallMetrics.successfulRequests.get()));
        System.out.println(String.format("Failed Requests:      %,d", overallMetrics.failedRequests.get()));
        System.out.println(String.format("Success Rate:         %.2f%%", overallMetrics.getSuccessRate()));
        System.out.println(String.format("Average Latency:      %.2fms", overallMetrics.getAverageLatency()));
        System.out.println(String.format("P95 Latency:          %dms", overallMetrics.getP95Latency()));
        System.out.println(String.format("P99 Latency:          %dms", overallMetrics.getP99Latency()));
        System.out.println(String.format("Max Latency:          %dms", overallMetrics.maxLatency.get()));
        System.out.println(String.format("Min Latency:          %dms", overallMetrics.minLatency.get()));
        System.out.println(String.format("Throughput:           %.2f req/s", overallMetrics.getThroughput()));
        System.out.println("=".repeat(80));
    }

    // ==================== WARMUP ====================

    @Test
    @Order(1)
    @DisplayName("WARMUP: Warm up test endpoints")
    public void warmupEndpoints() throws InterruptedException {
        System.out.println("\nWarming up endpoints with " + WARMUP_REQUESTS + " requests...");

        for (int i = 0; i < WARMUP_REQUESTS; i++) {
            given()
                .when().get("/api/v11/info")
                .then().statusCode(200);
        }

        Thread.sleep(1000); // Allow system to stabilize
        System.out.println("Warmup complete.");
    }

    // ==================== LOAD TESTS ====================

    @Test
    @Order(2)
    @DisplayName("LOAD: Network Topology - 1,000 concurrent requests")
    public void loadTestNetworkTopology() throws Exception {
        LoadTestResult result = executeLoadTest(
            "Network Topology",
            () -> given().when().get("/api/v11/blockchain/network/topology")
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(3)
    @DisplayName("LOAD: Block Search - 1,000 concurrent requests")
    public void loadTestBlockSearch() throws Exception {
        LoadTestResult result = executeLoadTest(
            "Block Search",
            () -> given()
                .queryParam("limit", 10)
                .when().get("/api/v11/blockchain/blocks/search")
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(4)
    @DisplayName("LOAD: Validator Performance - 1,000 concurrent requests")
    public void loadTestValidatorPerformance() throws Exception {
        LoadTestResult result = executeLoadTest(
            "Validator Performance",
            () -> {
                String validatorId = TestDataBuilder.generateValidatorId();
                return given()
                    .pathParam("id", validatorId)
                    .when().get("/api/v11/validators/{id}/performance");
            }
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(5)
    @DisplayName("LOAD: AI Model Metrics - 1,000 concurrent requests")
    public void loadTestAIModelMetrics() throws Exception {
        LoadTestResult result = executeLoadTest(
            "AI Model Metrics",
            () -> {
                String modelId = TestDataBuilder.generateModelId();
                return given()
                    .pathParam("id", modelId)
                    .when().get("/api/v11/ai/models/{id}/metrics");
            }
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(6)
    @DisplayName("LOAD: Bridge Status - 1,000 concurrent requests")
    public void loadTestBridgeStatus() throws Exception {
        LoadTestResult result = executeLoadTest(
            "Bridge Status",
            () -> given().when().get("/api/v11/bridge/operational/status")
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(7)
    @DisplayName("LOAD: RWA Assets - 1,000 concurrent requests")
    public void loadTestRWAAssets() throws Exception {
        LoadTestResult result = executeLoadTest(
            "RWA Assets",
            () -> given()
                .queryParam("limit", 20)
                .when().get("/api/v11/rwa/assets")
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(8)
    @DisplayName("LOAD: Consensus Rounds - 1,000 concurrent requests")
    public void loadTestConsensusRounds() throws Exception {
        LoadTestResult result = executeLoadTest(
            "Consensus Rounds",
            () -> given()
                .queryParam("limit", 15)
                .when().get("/api/v11/consensus/rounds")
        );

        validateLoadTestResult(result);
    }

    @Test
    @Order(9)
    @DisplayName("LOAD: Custom Metrics - 1,000 concurrent requests")
    public void loadTestCustomMetrics() throws Exception {
        LoadTestResult result = executeLoadTest(
            "Custom Metrics",
            () -> given().when().get("/api/v11/metrics/custom")
        );

        validateLoadTestResult(result);
    }

    // ==================== STRESS TESTS ====================

    @Test
    @Order(10)
    @DisplayName("STRESS: Transaction Submit - High volume")
    public void stressTestTransactionSubmit() throws Exception {
        int stressRequests = 500; // Lower for POST requests

        LoadTestResult result = executeLoadTest(
            "Transaction Submit (Stress)",
            () -> {
                var requestBody = TestDataBuilder.createTransactionSubmitRequest(null, null, 1000.0);
                return given()
                    .contentType(ContentType.JSON)
                    .body(requestBody)
                    .when().post("/api/v11/blockchain/transactions/submit");
            },
            stressRequests
        );

        // Stress test has relaxed criteria
        assertTrue(result.successRate >= 90.0,
            "Stress test success rate should be >= 90%: " + result.successRate);
        assertTrue(result.averageLatency < 500,
            "Stress test average latency should be < 500ms: " + result.averageLatency);
    }

    @Test
    @Order(11)
    @DisplayName("STRESS: Bridge Transfer - High volume")
    public void stressTestBridgeTransfer() throws Exception {
        int stressRequests = 500;

        LoadTestResult result = executeLoadTest(
            "Bridge Transfer (Stress)",
            () -> {
                var requestBody = TestDataBuilder.createBridgeTransferRequest(
                    "ethereum", "polygon", "USDC", 1000.0);
                return given()
                    .contentType(ContentType.JSON)
                    .body(requestBody)
                    .when().post("/api/v11/bridge/transfers/initiate");
            },
            stressRequests
        );

        assertTrue(result.successRate >= 90.0);
        assertTrue(result.averageLatency < 500);
    }

    // ==================== LATENCY TESTS ====================

    @Test
    @Order(12)
    @DisplayName("LATENCY: All GET endpoints under 200ms")
    public void latencyTestAllGETEndpoints() {
        Map<String, Long> endpointLatencies = new HashMap<>();

        // Test all major GET endpoints
        endpointLatencies.put("Network Topology", measureLatency(
            () -> given().get("/api/v11/blockchain/network/topology")));

        endpointLatencies.put("Block Search", measureLatency(
            () -> given().queryParam("limit", 10).get("/api/v11/blockchain/blocks/search")));

        endpointLatencies.put("Security Audit", measureLatency(
            () -> given().queryParam("limit", 20).get("/api/v11/security/audit-logs")));

        endpointLatencies.put("Bridge Status", measureLatency(
            () -> given().get("/api/v11/bridge/operational/status")));

        endpointLatencies.put("RWA Assets", measureLatency(
            () -> given().queryParam("limit", 20).get("/api/v11/rwa/assets")));

        endpointLatencies.put("Consensus Rounds", measureLatency(
            () -> given().queryParam("limit", 15).get("/api/v11/consensus/rounds")));

        endpointLatencies.put("Custom Metrics", measureLatency(
            () -> given().get("/api/v11/metrics/custom")));

        // Print latency report
        System.out.println("\nLatency Report:");
        endpointLatencies.forEach((endpoint, latency) -> {
            String status = latency < LATENCY_THRESHOLD_MS ? "✓ PASS" : "✗ FAIL";
            System.out.println(String.format("  %s: %dms %s", endpoint, latency, status));
            assertTrue(latency < LATENCY_THRESHOLD_MS,
                endpoint + " latency should be < " + LATENCY_THRESHOLD_MS + "ms: " + latency + "ms");
        });
    }

    // ==================== HELPER METHODS ====================

    private LoadTestResult executeLoadTest(String testName, RequestSupplier requestSupplier)
            throws Exception {
        return executeLoadTest(testName, requestSupplier, CONCURRENT_REQUESTS);
    }

    private LoadTestResult executeLoadTest(String testName, RequestSupplier requestSupplier,
            int requestCount) throws Exception {

        System.out.println("\nExecuting load test: " + testName);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        List<Long> latencies = Collections.synchronizedList(new ArrayList<>());

        long startTime = System.currentTimeMillis();

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (int i = 0; i < requestCount; i++) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                long reqStart = System.currentTimeMillis();
                try {
                    Response response = requestSupplier.get();
                    long reqEnd = System.currentTimeMillis();
                    long latency = reqEnd - reqStart;

                    latencies.add(latency);

                    // Defensive null check for overallMetrics
                    if (overallMetrics != null) {
                        overallMetrics.latencies.add(latency);
                        overallMetrics.totalRequests.incrementAndGet();

                        if (response.statusCode() >= 200 && response.statusCode() < 300) {
                            successCount.incrementAndGet();
                            overallMetrics.successfulRequests.incrementAndGet();
                        } else {
                            failCount.incrementAndGet();
                            overallMetrics.failedRequests.incrementAndGet();
                        }

                        overallMetrics.updateLatencyStats(latency);
                    } else {
                        // Track local metrics even if overall metrics are null
                        if (response.statusCode() >= 200 && response.statusCode() < 300) {
                            successCount.incrementAndGet();
                        } else {
                            failCount.incrementAndGet();
                        }
                    }
                } catch (Exception e) {
                    failCount.incrementAndGet();
                    if (overallMetrics != null) {
                        overallMetrics.failedRequests.incrementAndGet();
                        overallMetrics.totalRequests.incrementAndGet();
                    }
                }
            }, executor);

            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        long endTime = System.currentTimeMillis();
        double durationSeconds = (endTime - startTime) / 1000.0;

        // Defensive null check for overallMetrics
        if (overallMetrics != null) {
            overallMetrics.totalDuration.addAndGet((endTime - startTime));
        }

        LoadTestResult result = new LoadTestResult(
            testName,
            requestCount,
            successCount.get(),
            failCount.get(),
            latencies,
            durationSeconds
        );

        printLoadTestResult(result);
        return result;
    }

    private void validateLoadTestResult(LoadTestResult result) {
        assertTrue(result.successRate >= 95.0,
            result.testName + " success rate should be >= 95%: " + result.successRate);
        assertTrue(result.averageLatency < LATENCY_THRESHOLD_MS,
            result.testName + " average latency should be < " + LATENCY_THRESHOLD_MS + "ms: " + result.averageLatency);
    }

    private void printLoadTestResult(LoadTestResult result) {
        System.out.println("  Total Requests:   " + result.totalRequests);
        System.out.println("  Successful:       " + result.successCount);
        System.out.println("  Failed:           " + result.failCount);
        System.out.println("  Success Rate:     " + String.format("%.2f%%", result.successRate));
        System.out.println("  Average Latency:  " + String.format("%.2fms", result.averageLatency));
        System.out.println("  P95 Latency:      " + result.p95Latency + "ms");
        System.out.println("  P99 Latency:      " + result.p99Latency + "ms");
        System.out.println("  Throughput:       " + String.format("%.2f req/s", result.throughput));
    }

    private long measureLatency(RequestSupplier requestSupplier) {
        long start = System.nanoTime();
        requestSupplier.get();
        long end = System.nanoTime();
        return (end - start) / 1_000_000; // Convert to milliseconds
    }

    @FunctionalInterface
    private interface RequestSupplier {
        Response get();
    }

    // ==================== DATA CLASSES ====================

    private static class LoadTestResult {
        final String testName;
        final int totalRequests;
        final int successCount;
        final int failCount;
        final double successRate;
        final double averageLatency;
        final long p95Latency;
        final long p99Latency;
        final double throughput;

        LoadTestResult(String testName, int totalRequests, int successCount, int failCount,
                      List<Long> latencies, double durationSeconds) {
            this.testName = testName;
            this.totalRequests = totalRequests;
            this.successCount = successCount;
            this.failCount = failCount;
            this.successRate = (successCount * 100.0) / totalRequests;
            this.averageLatency = latencies.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0);

            List<Long> sortedLatencies = new ArrayList<>(latencies);
            Collections.sort(sortedLatencies);

            int p95Index = (int) (sortedLatencies.size() * 0.95);
            int p99Index = (int) (sortedLatencies.size() * 0.99);

            this.p95Latency = sortedLatencies.isEmpty() ? 0 : sortedLatencies.get(Math.min(p95Index, sortedLatencies.size() - 1));
            this.p99Latency = sortedLatencies.isEmpty() ? 0 : sortedLatencies.get(Math.min(p99Index, sortedLatencies.size() - 1));
            this.throughput = totalRequests / durationSeconds;
        }
    }

    private static class PerformanceMetrics {
        final AtomicInteger totalRequests = new AtomicInteger(0);
        final AtomicInteger successfulRequests = new AtomicInteger(0);
        final AtomicInteger failedRequests = new AtomicInteger(0);
        final AtomicLong totalDuration = new AtomicLong(0);
        final AtomicLong maxLatency = new AtomicLong(0);
        final AtomicLong minLatency = new AtomicLong(Long.MAX_VALUE);
        final List<Long> latencies = Collections.synchronizedList(new ArrayList<>());

        void updateLatencyStats(long latency) {
            maxLatency.updateAndGet(max -> Math.max(max, latency));
            minLatency.updateAndGet(min -> Math.min(min, latency));
        }

        double getSuccessRate() {
            return totalRequests.get() > 0 ?
                (successfulRequests.get() * 100.0) / totalRequests.get() : 0;
        }

        double getAverageLatency() {
            return latencies.isEmpty() ? 0 :
                latencies.stream().mapToLong(Long::longValue).average().orElse(0);
        }

        long getP95Latency() {
            if (latencies.isEmpty()) return 0;
            List<Long> sorted = new ArrayList<>(latencies);
            Collections.sort(sorted);
            int index = (int) (sorted.size() * 0.95);
            return sorted.get(Math.min(index, sorted.size() - 1));
        }

        long getP99Latency() {
            if (latencies.isEmpty()) return 0;
            List<Long> sorted = new ArrayList<>(latencies);
            Collections.sort(sorted);
            int index = (int) (sorted.size() * 0.99);
            return sorted.get(Math.min(index, sorted.size() - 1));
        }

        double getThroughput() {
            double durationSeconds = totalDuration.get() / 1000.0;
            return durationSeconds > 0 ? totalRequests.get() / durationSeconds : 0;
        }
    }
}
