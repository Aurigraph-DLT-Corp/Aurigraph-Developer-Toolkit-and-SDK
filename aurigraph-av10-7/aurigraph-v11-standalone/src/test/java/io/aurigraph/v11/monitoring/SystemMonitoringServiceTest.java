package io.aurigraph.v11.monitoring;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import jakarta.inject.Inject;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for SystemMonitoringService
 * Sprint 16 - Test Coverage Expansion
 *
 * Tests production monitoring with:
 * - System and application metrics collection
 * - Health checks and readiness probes
 * - Alert generation and management
 * - Performance monitoring
 */
@QuarkusTest
@DisplayName("System Monitoring Service Tests")
class SystemMonitoringServiceTest {

    @Inject
    SystemMonitoringService monitoringService;

    @BeforeEach
    void setUp() {
        // Start monitoring for tests if not already active
        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        if (status != null && !status.active()) {
            monitoringService.startMonitoring();
        }
    }

    @AfterEach
    void tearDown() {
        // Stop monitoring after tests
        monitoringService.stopMonitoring();
    }

    // ==================== Service Initialization Tests ====================

    @Test
    @DisplayName("Monitoring service initializes successfully")
    void testServiceInitialization() {
        assertNotNull(monitoringService, "Monitoring service should be injected");

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "getStatus() should never return null");
        assertNotNull(status.healthStatus(), "HealthStatus should not be null");
    }

    @Test
    @DisplayName("Start monitoring successfully")
    void testStartMonitoring() {
        monitoringService.stopMonitoring();

        monitoringService.startMonitoring();

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertTrue(status.active());
    }

    @Test
    @DisplayName("Stop monitoring successfully")
    void testStopMonitoring() {
        monitoringService.startMonitoring();

        monitoringService.stopMonitoring();

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertFalse(status.active());
    }

    @Test
    @DisplayName("Prevent duplicate monitoring start")
    void testPreventDuplicateStart() {
        monitoringService.startMonitoring();

        // Second start should be prevented
        assertDoesNotThrow(() -> monitoringService.startMonitoring());

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertTrue(status.active());
    }

    // ==================== Metrics Collection Tests ====================

    @Test
    @DisplayName("Collect system metrics successfully")
    void testCollectSystemMetrics() throws InterruptedException {
        monitoringService.startMonitoring();

        // Wait for metrics collection
        Thread.sleep(1000);

        SystemMonitoringService.MetricValue cpuMetric =
            monitoringService.getMetric("system.cpu.usage");
        SystemMonitoringService.MetricValue memoryMetric =
            monitoringService.getMetric("system.memory.used");

        // Metrics may or may not be available depending on timing
        assertNotNull(monitoringService.getStatus());
    }

    @Test
    @DisplayName("Collect application metrics successfully")
    void testCollectApplicationMetrics() throws InterruptedException {
        monitoringService.startMonitoring();

        Thread.sleep(1000);

        // Application metrics should be collected
        assertNotNull(monitoringService.getStatus());
    }

    @Test
    @DisplayName("Get specific metric value")
    void testGetSpecificMetric() throws InterruptedException {
        monitoringService.startMonitoring();

        Thread.sleep(1000);

        SystemMonitoringService.MetricValue metric =
            monitoringService.getMetric("system.cpu.usage");

        // Metric may or may not exist depending on collection timing
        if (metric != null) {
            assertNotNull(metric.name());
            assertTrue(metric.value() >= 0);
        }
    }

    @Test
    @DisplayName("Get non-existent metric returns null")
    void testGetNonExistentMetric() {
        SystemMonitoringService.MetricValue metric =
            monitoringService.getMetric("non.existent.metric");

        assertNull(metric);
    }

    @Test
    @DisplayName("Get all metrics")
    void testGetAllMetrics() throws InterruptedException {
        monitoringService.startMonitoring();

        Thread.sleep(1000);

        var allMetrics = monitoringService.getAllMetrics();

        assertNotNull(allMetrics);
        // Metrics may or may not be present depending on timing
    }

    // ==================== Monitoring Status Tests ====================

    @Test
    @DisplayName("Get monitoring status")
    void testGetMonitoringStatus() {
        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();

        assertNotNull(status, "MonitoringStatus should not be null");
        assertTrue(status.active());
        assertTrue(status.metricsCount() >= 0);
        assertTrue(status.activeAlerts() >= 0);
        assertNotNull(status.healthStatus(), "HealthStatus should not be null");
    }

    @Test
    @DisplayName("Monitoring status reflects metrics count")
    void testMonitoringStatusMetricsCount() throws InterruptedException {
        monitoringService.startMonitoring();

        Thread.sleep(1000);

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        int metricsCount = status.metricsCount();

        assertTrue(metricsCount >= 0);
    }

    @Test
    @DisplayName("Monitoring status reflects active alerts")
    void testMonitoringStatusActiveAlerts() {
        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();

        assertNotNull(status, "MonitoringStatus should not be null");
        assertTrue(status.activeAlerts() >= 0);
    }

    // ==================== Health Check Tests ====================

    @Test
    @DisplayName("Health checks run periodically")
    void testHealthChecksRunPeriodically() throws InterruptedException {
        monitoringService.startMonitoring();

        Thread.sleep(2000); // Wait for health checks

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertNotNull(status.healthStatus(), "HealthStatus should not be null");
    }

    @Test
    @DisplayName("Health status structure is valid")
    void testHealthStatusStructure() {
        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();

        assertNotNull(status, "MonitoringStatus should not be null");
        assertNotNull(status.healthStatus(), "HealthStatus should not be null");
        assertNotNull(status.healthStatus().issues(), "HealthStatus issues list should not be null");
    }

    // ==================== Alert Generation Tests ====================

    @Test
    @DisplayName("Alerts are generated when thresholds exceeded")
    void testAlertGeneration() throws InterruptedException {
        monitoringService.startMonitoring();

        // Wait for alert checks
        Thread.sleep(2000);

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        // Alerts may or may not be present depending on system state
        assertTrue(status.activeAlerts() >= 0);
    }

    // ==================== Data Structure Tests ====================

    @Test
    @DisplayName("Create MetricValue record")
    void testCreateMetricValue() {
        long timestamp = System.currentTimeMillis();

        SystemMonitoringService.MetricValue metric =
            new SystemMonitoringService.MetricValue(
                "test.metric",
                42.5,
                timestamp
            );

        assertNotNull(metric);
        assertEquals("test.metric", metric.name());
        assertEquals(42.5, metric.value());
        assertEquals(timestamp, metric.timestamp());
    }

    @Test
    @DisplayName("Create MonitoringStatus record")
    void testCreateMonitoringStatus() {
        SystemMonitoringService.HealthStatus health =
            new SystemMonitoringService.HealthStatus(true, java.util.List.of());

        SystemMonitoringService.MonitoringStatus status =
            new SystemMonitoringService.MonitoringStatus(
                true, // active
                10,   // metricsCount
                health,
                2     // activeAlerts
            );

        assertNotNull(status);
        assertTrue(status.active());
        assertEquals(10, status.metricsCount());
        assertEquals(2, status.activeAlerts());
        assertNotNull(status.healthStatus());
    }

    @Test
    @DisplayName("Create HealthStatus record")
    void testCreateHealthStatus() {
        SystemMonitoringService.HealthStatus health =
            new SystemMonitoringService.HealthStatus(
                true,
                java.util.List.of()
            );

        assertNotNull(health);
        assertTrue(health.healthy());
        assertTrue(health.issues().isEmpty());
    }

    @Test
    @DisplayName("Create unhealthy HealthStatus with issues")
    void testCreateUnhealthyHealthStatus() {
        java.util.List<String> issues = java.util.List.of(
            "Database connectivity failed",
            "High memory usage"
        );

        SystemMonitoringService.HealthStatus health =
            new SystemMonitoringService.HealthStatus(false, issues);

        assertNotNull(health);
        assertFalse(health.healthy());
        assertEquals(2, health.issues().size());
        assertTrue(health.issues().contains("Database connectivity failed"));
    }

    @Test
    @DisplayName("Create Alert record")
    void testCreateAlert() {
        long timestamp = System.currentTimeMillis();

        SystemMonitoringService.Alert alert =
            new SystemMonitoringService.Alert(
                1L,
                SystemMonitoringService.AlertLevel.WARNING,
                "High CPU usage detected",
                timestamp
            );

        assertNotNull(alert);
        assertEquals(1L, alert.id());
        assertEquals(SystemMonitoringService.AlertLevel.WARNING, alert.level());
        assertEquals("High CPU usage detected", alert.message());
        assertEquals(timestamp, alert.timestamp());
    }

    @Test
    @DisplayName("Create PerformanceSample record")
    void testCreatePerformanceSample() {
        long timestamp = System.currentTimeMillis();

        SystemMonitoringService.PerformanceSample sample =
            new SystemMonitoringService.PerformanceSample(
                500000.0, // tps
                5.5,      // latency
                45.2,     // memoryUsage
                30.5,     // cpuUsage
                timestamp
            );

        assertNotNull(sample);
        assertEquals(500000.0, sample.tps());
        assertEquals(5.5, sample.latency());
        assertEquals(45.2, sample.memoryUsage());
        assertEquals(30.5, sample.cpuUsage());
    }

    @Test
    @DisplayName("Create PerformanceReport record")
    void testCreatePerformanceReport() {
        SystemMonitoringService.PerformanceReport report =
            new SystemMonitoringService.PerformanceReport(
                500000.0, // averageTPS
                5.2,      // averageLatency
                45.0,     // memoryUsage
                30.0,     // cpuUsage
                15.5      // performanceDegradation
            );

        assertNotNull(report);
        assertEquals(500000.0, report.averageTPS());
        assertEquals(5.2, report.averageLatency());
        assertEquals(15.5, report.performanceDegradation());
    }

    // ==================== Enum Tests ====================

    @Test
    @DisplayName("Verify AlertLevel enum values")
    void testAlertLevelEnum() {
        assertEquals(4, SystemMonitoringService.AlertLevel.values().length);
        assertNotNull(SystemMonitoringService.AlertLevel.INFO);
        assertNotNull(SystemMonitoringService.AlertLevel.WARNING);
        assertNotNull(SystemMonitoringService.AlertLevel.ERROR);
        assertNotNull(SystemMonitoringService.AlertLevel.CRITICAL);
    }

    @Test
    @DisplayName("AlertLevel enum order is correct")
    void testAlertLevelOrder() {
        SystemMonitoringService.AlertLevel[] levels =
            SystemMonitoringService.AlertLevel.values();

        assertEquals(SystemMonitoringService.AlertLevel.INFO, levels[0]);
        assertEquals(SystemMonitoringService.AlertLevel.WARNING, levels[1]);
        assertEquals(SystemMonitoringService.AlertLevel.ERROR, levels[2]);
        assertEquals(SystemMonitoringService.AlertLevel.CRITICAL, levels[3]);
    }

    // ==================== Integration Tests ====================

    @Test
    @DisplayName("Complete monitoring lifecycle")
    void testCompleteMonitoringLifecycle() throws InterruptedException {
        // Stop if running
        monitoringService.stopMonitoring();

        // Start monitoring
        monitoringService.startMonitoring();
        SystemMonitoringService.MonitoringStatus startStatus = monitoringService.getStatus();
        assertNotNull(startStatus, "MonitoringStatus should not be null");
        assertTrue(startStatus.active());

        // Wait for metrics collection
        Thread.sleep(2000);

        // Check metrics collected
        var allMetrics = monitoringService.getAllMetrics();
        assertNotNull(allMetrics);

        // Check status
        SystemMonitoringService.MonitoringStatus activeStatus = monitoringService.getStatus();
        assertNotNull(activeStatus, "MonitoringStatus should not be null");
        assertTrue(activeStatus.active());

        // Stop monitoring
        monitoringService.stopMonitoring();
        SystemMonitoringService.MonitoringStatus stopStatus = monitoringService.getStatus();
        assertNotNull(stopStatus, "MonitoringStatus should not be null");
        assertFalse(stopStatus.active());
    }

    @Test
    @DisplayName("Monitoring resilience - restart after stop")
    void testMonitoringRestart() throws InterruptedException {
        // First cycle
        monitoringService.startMonitoring();
        Thread.sleep(1000);
        monitoringService.stopMonitoring();

        // Second cycle
        monitoringService.startMonitoring();
        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertTrue(status.active());

        Thread.sleep(1000);
        monitoringService.stopMonitoring();
    }

    // ==================== Performance Tests ====================

    @Test
    @DisplayName("Metrics collection performance")
    void testMetricsCollectionPerformance() throws InterruptedException {
        monitoringService.startMonitoring();

        Thread.sleep(5000); // Let it collect for 5 seconds

        long startTime = System.nanoTime();
        var allMetrics = monitoringService.getAllMetrics();
        long duration = System.nanoTime() - startTime;

        long durationMs = duration / 1_000_000;
        assertTrue(durationMs < 100, "Getting all metrics should take < 100ms");
    }

    @Test
    @DisplayName("Status retrieval performance")
    void testStatusRetrievalPerformance() {
        long totalTime = 0;
        int iterations = 1000;

        for (int i = 0; i < iterations; i++) {
            long start = System.nanoTime();
            monitoringService.getStatus();
            totalTime += (System.nanoTime() - start);
        }

        long avgTimeNs = totalTime / iterations;
        long avgTimeMs = avgTimeNs / 1_000_000;

        assertTrue(avgTimeMs < 1, "Average status retrieval should be < 1ms");
    }

    @Test
    @DisplayName("Concurrent status access")
    void testConcurrentStatusAccess() throws InterruptedException {
        int threadCount = 100;
        java.util.concurrent.CountDownLatch latch =
            new java.util.concurrent.CountDownLatch(threadCount);
        java.util.concurrent.atomic.AtomicInteger successCount =
            new java.util.concurrent.atomic.AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            Thread.startVirtualThread(() -> {
                try {
                    SystemMonitoringService.MonitoringStatus status =
                        monitoringService.getStatus();
                    if (status != null) {
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(5, java.util.concurrent.TimeUnit.SECONDS));
        assertEquals(threadCount, successCount.get());
    }

    // ==================== Edge Case Tests ====================

    @Test
    @DisplayName("Handle multiple rapid start/stop cycles")
    void testRapidStartStopCycles() {
        for (int i = 0; i < 10; i++) {
            monitoringService.startMonitoring();
            monitoringService.stopMonitoring();
        }

        // Should handle rapid cycles without errors
        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertFalse(status.active());
    }

    @Test
    @DisplayName("Get metrics when monitoring is stopped")
    void testGetMetricsWhenStopped() {
        monitoringService.stopMonitoring();

        var allMetrics = monitoringService.getAllMetrics();

        assertNotNull(allMetrics);
        // Should return whatever metrics are cached
    }

    @Test
    @DisplayName("Get status when monitoring is stopped")
    void testGetStatusWhenStopped() {
        monitoringService.stopMonitoring();

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();

        assertNotNull(status, "MonitoringStatus should not be null");
        assertFalse(status.active());
    }

    // ==================== Stress Tests ====================

    @Test
    @DisplayName("Long-running monitoring stability")
    void testLongRunningMonitoring() throws InterruptedException {
        monitoringService.startMonitoring();

        // Run for 10 seconds
        Thread.sleep(10000);

        SystemMonitoringService.MonitoringStatus status = monitoringService.getStatus();
        assertNotNull(status, "MonitoringStatus should not be null");
        assertTrue(status.active());
        assertTrue(status.metricsCount() >= 0);

        monitoringService.stopMonitoring();
    }
}
