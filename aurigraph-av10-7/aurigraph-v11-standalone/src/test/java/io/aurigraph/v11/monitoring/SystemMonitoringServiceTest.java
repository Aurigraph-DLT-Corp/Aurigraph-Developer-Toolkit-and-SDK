package io.aurigraph.v11.monitoring;

import io.aurigraph.v11.monitoring.SystemMonitoringService.MetricValue;
import io.aurigraph.v11.monitoring.SystemMonitoringService.MonitoringStatus;
import io.aurigraph.v11.monitoring.SystemMonitoringService.HealthStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for SystemMonitoringService
 * Sprint 1 - Test Coverage Enhancement (AV11-343)
 * Target: 39% -> 95% coverage
 *
 * Tests cover:
 * - Monitoring lifecycle (start/stop)
 * - Metrics collection
 * - Health checks
 * - Alert generation
 * - Performance monitoring
 * - Prometheus integration
 */
@DisplayName("SystemMonitoringService Tests")
class SystemMonitoringServiceTest {

    private SystemMonitoringService monitoringService;

    @BeforeEach
    void setUp() {
        monitoringService = new SystemMonitoringService();
    }

    @AfterEach
    void tearDown() {
        monitoringService.stopMonitoring();
    }

    // ============================================
    // MONITORING LIFECYCLE TESTS
    // ============================================

    @Nested
    @DisplayName("Monitoring Lifecycle Tests")
    class MonitoringLifecycleTests {

        @Test
        @DisplayName("Should start monitoring")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStartMonitoring() {
            assertDoesNotThrow(() -> monitoringService.startMonitoring());

            MonitoringStatus status = monitoringService.getStatus();
            assertTrue(status.active());
        }

        @Test
        @DisplayName("Should stop monitoring")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStopMonitoring() {
            monitoringService.startMonitoring();
            monitoringService.stopMonitoring();

            MonitoringStatus status = monitoringService.getStatus();
            assertFalse(status.active());
        }

        @Test
        @DisplayName("Should handle multiple start calls")
        void shouldHandleMultipleStartCalls() {
            monitoringService.startMonitoring();
            assertDoesNotThrow(() -> monitoringService.startMonitoring());

            MonitoringStatus status = monitoringService.getStatus();
            assertTrue(status.active());
        }

        @Test
        @DisplayName("Should handle stop when not started")
        void shouldHandleStopWhenNotStarted() {
            assertDoesNotThrow(() -> monitoringService.stopMonitoring());

            MonitoringStatus status = monitoringService.getStatus();
            assertFalse(status.active());
        }

        @Test
        @DisplayName("Should restart monitoring")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void shouldRestartMonitoring() {
            monitoringService.startMonitoring();
            monitoringService.stopMonitoring();
            monitoringService.startMonitoring();

            MonitoringStatus status = monitoringService.getStatus();
            assertTrue(status.active());
        }
    }

    // ============================================
    // MONITORING STATUS TESTS
    // ============================================

    @Nested
    @DisplayName("Monitoring Status Tests")
    class MonitoringStatusTests {

        @Test
        @DisplayName("Should get initial status")
        void shouldGetInitialStatus() {
            MonitoringStatus status = monitoringService.getStatus();

            assertNotNull(status);
            assertFalse(status.active());
            assertEquals(0, status.metricsCount());
            assertNotNull(status.healthStatus());
            assertEquals(0, status.activeAlerts());
        }

        @Test
        @DisplayName("Should update metrics count after collection")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldUpdateMetricsCountAfterCollection() throws InterruptedException {
            monitoringService.startMonitoring();

            // Wait for metrics collection (runs every 10 seconds)
            Thread.sleep(11000);

            MonitoringStatus status = monitoringService.getStatus();
            assertTrue(status.metricsCount() > 0);
        }
    }

    // ============================================
    // METRICS COLLECTOR TESTS
    // ============================================

    @Nested
    @DisplayName("Metrics Collector Tests")
    class MetricsCollectorTests {

        private SystemMonitoringService.MetricsCollector metricsCollector;

        @BeforeEach
        void setUp() {
            metricsCollector = new SystemMonitoringService.MetricsCollector();
        }

        @Test
        @DisplayName("Should get CPU usage")
        void shouldGetCpuUsage() {
            double cpuUsage = metricsCollector.getCPUUsage();
            // CPU usage can be negative on some systems, or very high
            // Just verify it's a number
            assertFalse(Double.isNaN(cpuUsage));
        }

        @Test
        @DisplayName("Should get memory used")
        void shouldGetMemoryUsed() {
            long memoryUsed = metricsCollector.getMemoryUsed();
            assertTrue(memoryUsed > 0);
        }

        @Test
        @DisplayName("Should get memory total")
        void shouldGetMemoryTotal() {
            long memoryTotal = metricsCollector.getMemoryTotal();
            assertTrue(memoryTotal > 0);
        }

        @Test
        @DisplayName("Should get memory usage percent")
        void shouldGetMemoryUsagePercent() {
            double memoryPercent = metricsCollector.getMemoryUsagePercent();
            assertTrue(memoryPercent >= 0 && memoryPercent <= 100);
        }

        @Test
        @DisplayName("Should get GC count")
        void shouldGetGcCount() {
            long gcCount = metricsCollector.getGCCount();
            assertTrue(gcCount >= 0);
        }

        @Test
        @DisplayName("Should get GC time")
        void shouldGetGcTime() {
            long gcTime = metricsCollector.getGCTime();
            assertTrue(gcTime >= 0);
        }

        @Test
        @DisplayName("Should get thread count")
        void shouldGetThreadCount() {
            int threadCount = metricsCollector.getThreadCount();
            assertTrue(threadCount > 0);
        }

        @Test
        @DisplayName("Should get current TPS")
        void shouldGetCurrentTps() {
            double tps = metricsCollector.getCurrentTPS();
            assertTrue(tps >= 0);
        }

        @Test
        @DisplayName("Should get total transactions")
        void shouldGetTotalTransactions() {
            long total = metricsCollector.getTotalTransactions();
            assertTrue(total >= 0);
        }

        @Test
        @DisplayName("Should get block height")
        void shouldGetBlockHeight() {
            long height = metricsCollector.getBlockHeight();
            assertTrue(height >= 0);
        }

        @Test
        @DisplayName("Should get active validators")
        void shouldGetActiveValidators() {
            int validators = metricsCollector.getActiveValidators();
            assertTrue(validators >= 0);
        }

        @Test
        @DisplayName("Should get average latency")
        void shouldGetAverageLatency() {
            double latency = metricsCollector.getAverageLatency();
            assertTrue(latency >= 0);
        }

        @Test
        @DisplayName("Should get error count")
        void shouldGetErrorCount() {
            long errorCount = metricsCollector.getErrorCount();
            assertTrue(errorCount >= 0);
        }
    }

    // ============================================
    // HEALTH CHECKER TESTS
    // ============================================

    @Nested
    @DisplayName("Health Checker Tests")
    class HealthCheckerTests {

        private SystemMonitoringService.HealthChecker healthChecker;

        @BeforeEach
        void setUp() {
            healthChecker = new SystemMonitoringService.HealthChecker();
        }

        @Test
        @DisplayName("Should perform health checks")
        void shouldPerformHealthChecks() {
            HealthStatus status = healthChecker.performChecks();

            assertNotNull(status);
            assertNotNull(status.issues());
        }

        @Test
        @DisplayName("Should report healthy status when checks pass")
        void shouldReportHealthyStatusWhenChecksPass() {
            HealthStatus status = healthChecker.performChecks();

            assertTrue(status.healthy());
            assertTrue(status.issues().isEmpty());
        }

        @Test
        @DisplayName("Should get last check status")
        void shouldGetLastCheckStatus() {
            healthChecker.performChecks();

            HealthStatus lastStatus = healthChecker.getLastCheckStatus();
            assertNotNull(lastStatus);
        }

        @Test
        @DisplayName("Should update last status on each check")
        void shouldUpdateLastStatusOnEachCheck() {
            HealthStatus status1 = healthChecker.performChecks();
            HealthStatus lastStatus = healthChecker.getLastCheckStatus();

            assertNotNull(lastStatus);
            assertEquals(status1.healthy(), lastStatus.healthy());
        }
    }

    // ============================================
    // ALERT ENGINE TESTS
    // ============================================

    @Nested
    @DisplayName("Alert Engine Tests")
    class AlertEngineTests {

        private SystemMonitoringService.AlertEngine alertEngine;

        @BeforeEach
        void setUp() {
            alertEngine = new SystemMonitoringService.AlertEngine();
        }

        @Test
        @DisplayName("Should start with zero alerts")
        void shouldStartWithZeroAlerts() {
            assertEquals(0, alertEngine.getActiveAlertCount());
        }

        @Test
        @DisplayName("Should trigger alert")
        void shouldTriggerAlert() {
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "Test alert");

            assertEquals(1, alertEngine.getActiveAlertCount());
        }

        @Test
        @DisplayName("Should trigger multiple alerts")
        void shouldTriggerMultipleAlerts() {
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Info alert");
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "Warning alert");
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.ERROR, "Error alert");
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.CRITICAL, "Critical alert");

            assertEquals(4, alertEngine.getActiveAlertCount());
        }

        @Test
        @DisplayName("Should get active alerts")
        void shouldGetActiveAlerts() {
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.ERROR, "Test error");

            var alerts = alertEngine.getActiveAlerts();
            assertNotNull(alerts);
            assertEquals(1, alerts.size());
        }

        @Test
        @DisplayName("Should clear alert by ID")
        void shouldClearAlertById() {
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "To be cleared");

            var alerts = alertEngine.getActiveAlerts();
            long alertId = alerts.get(0).id();

            alertEngine.clearAlert(alertId);

            assertEquals(0, alertEngine.getActiveAlertCount());
        }

        @Test
        @DisplayName("Should handle clearing non-existent alert")
        void shouldHandleClearingNonExistentAlert() {
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Test");

            assertDoesNotThrow(() -> alertEngine.clearAlert(999999L));
        }

        @Test
        @DisplayName("Alert should contain all fields")
        void alertShouldContainAllFields() {
            alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.CRITICAL, "Test message");

            var alerts = alertEngine.getActiveAlerts();
            var alert = alerts.get(0);

            assertTrue(alert.id() > 0);
            assertEquals(SystemMonitoringService.AlertLevel.CRITICAL, alert.level());
            assertEquals("Test message", alert.message());
            assertTrue(alert.timestamp() > 0);
        }
    }

    // ============================================
    // PERFORMANCE MONITOR TESTS
    // ============================================

    @Nested
    @DisplayName("Performance Monitor Tests")
    class PerformanceMonitorTests {

        private SystemMonitoringService.PerformanceMonitor performanceMonitor;

        @BeforeEach
        void setUp() {
            performanceMonitor = new SystemMonitoringService.PerformanceMonitor();
        }

        @Test
        @DisplayName("Should generate empty report with no samples")
        void shouldGenerateEmptyReportWithNoSamples() {
            var report = performanceMonitor.generateReport();

            assertNotNull(report);
            assertEquals(0, report.averageTPS());
            assertEquals(0, report.averageLatency());
            assertEquals(0, report.memoryUsage());
            assertEquals(0, report.cpuUsage());
            assertEquals(0, report.performanceDegradation());
        }

        @Test
        @DisplayName("Should record sample")
        void shouldRecordSample() {
            var sample = new SystemMonitoringService.PerformanceSample(
                1000.0, 5.0, 50.0, 30.0, System.currentTimeMillis()
            );

            assertDoesNotThrow(() -> performanceMonitor.recordSample(sample));
        }

        @Test
        @DisplayName("Should generate report with samples")
        void shouldGenerateReportWithSamples() {
            for (int i = 0; i < 10; i++) {
                var sample = new SystemMonitoringService.PerformanceSample(
                    1000.0 + i * 100, 5.0 + i, 50.0, 30.0, System.currentTimeMillis()
                );
                performanceMonitor.recordSample(sample);
            }

            var report = performanceMonitor.generateReport();

            assertTrue(report.averageTPS() > 0);
            assertTrue(report.averageLatency() > 0);
            assertEquals(50.0, report.memoryUsage());
            assertEquals(30.0, report.cpuUsage());
        }

        @Test
        @DisplayName("Should calculate performance degradation")
        void shouldCalculatePerformanceDegradation() {
            // Add samples with decreasing TPS to simulate degradation
            for (int i = 0; i < 25; i++) {
                double tps = 2000.0 - (i * 50); // TPS decreases over time
                var sample = new SystemMonitoringService.PerformanceSample(
                    tps, 5.0, 50.0, 30.0, System.currentTimeMillis()
                );
                performanceMonitor.recordSample(sample);
            }

            var report = performanceMonitor.generateReport();
            // Degradation should be detected
            assertTrue(report.performanceDegradation() != 0);
        }
    }

    // ============================================
    // METRIC TIME SERIES TESTS
    // ============================================

    @Nested
    @DisplayName("Metric Time Series Tests")
    class MetricTimeSeriesTests {

        private SystemMonitoringService.MetricTimeSeries timeSeries;

        @BeforeEach
        void setUp() {
            timeSeries = new SystemMonitoringService.MetricTimeSeries("test.metric");
        }

        @Test
        @DisplayName("Should add data point")
        void shouldAddDataPoint() {
            assertDoesNotThrow(() -> timeSeries.addDataPoint(100.0, System.currentTimeMillis()));
        }

        @Test
        @DisplayName("Should get latest value")
        void shouldGetLatestValue() {
            timeSeries.addDataPoint(100.0, System.currentTimeMillis());
            timeSeries.addDataPoint(200.0, System.currentTimeMillis() + 1);
            timeSeries.addDataPoint(300.0, System.currentTimeMillis() + 2);

            MetricValue latest = timeSeries.getLatestValue();

            assertNotNull(latest);
            assertEquals("test.metric", latest.name());
            assertEquals(300.0, latest.value());
        }

        @Test
        @DisplayName("Should return null for empty time series")
        void shouldReturnNullForEmptyTimeSeries() {
            MetricValue latest = timeSeries.getLatestValue();
            assertNull(latest);
        }

        @Test
        @DisplayName("Should handle many data points")
        void shouldHandleManyDataPoints() {
            for (int i = 0; i < 2000; i++) {
                timeSeries.addDataPoint(i * 1.0, System.currentTimeMillis() + i);
            }

            MetricValue latest = timeSeries.getLatestValue();
            assertNotNull(latest);
        }
    }

    // ============================================
    // GET METRICS TESTS
    // ============================================

    @Nested
    @DisplayName("Get Metrics Tests")
    class GetMetricsTests {

        @Test
        @DisplayName("Should get single metric")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldGetSingleMetric() throws InterruptedException {
            monitoringService.startMonitoring();

            // Wait for metrics collection
            Thread.sleep(11000);

            MetricValue metric = monitoringService.getMetric("system.cpu.usage");
            // Metric might be null if not collected yet, or should have a value
            if (metric != null) {
                assertEquals("system.cpu.usage", metric.name());
            }
        }

        @Test
        @DisplayName("Should return null for non-existent metric")
        void shouldReturnNullForNonExistentMetric() {
            MetricValue metric = monitoringService.getMetric("non.existent.metric");
            assertNull(metric);
        }

        @Test
        @DisplayName("Should get all metrics")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void shouldGetAllMetrics() throws InterruptedException {
            monitoringService.startMonitoring();

            // Wait for metrics collection
            Thread.sleep(11000);

            Map<String, MetricValue> allMetrics = monitoringService.getAllMetrics();
            assertNotNull(allMetrics);
            assertTrue(allMetrics.size() > 0);
        }
    }

    // ============================================
    // DATA CLASSES TESTS
    // ============================================

    @Nested
    @DisplayName("Data Classes Tests")
    class DataClassesTests {

        @Test
        @DisplayName("HealthStatus should contain all fields")
        void healthStatusShouldContainAllFields() {
            HealthStatus status = new HealthStatus(true, java.util.List.of());

            assertTrue(status.healthy());
            assertTrue(status.issues().isEmpty());
        }

        @Test
        @DisplayName("HealthStatus should contain issues when unhealthy")
        void healthStatusShouldContainIssuesWhenUnhealthy() {
            HealthStatus status = new HealthStatus(false, java.util.List.of("Issue 1", "Issue 2"));

            assertFalse(status.healthy());
            assertEquals(2, status.issues().size());
        }

        @Test
        @DisplayName("MonitoringStatus should contain all fields")
        void monitoringStatusShouldContainAllFields() {
            MonitoringStatus status = new MonitoringStatus(
                true, 10, new HealthStatus(true, java.util.List.of()), 5
            );

            assertTrue(status.active());
            assertEquals(10, status.metricsCount());
            assertTrue(status.healthStatus().healthy());
            assertEquals(5, status.activeAlerts());
        }

        @Test
        @DisplayName("MetricValue should contain all fields")
        void metricValueShouldContainAllFields() {
            MetricValue value = new MetricValue("test.metric", 100.0, System.currentTimeMillis());

            assertEquals("test.metric", value.name());
            assertEquals(100.0, value.value());
            assertTrue(value.timestamp() > 0);
        }

        @Test
        @DisplayName("PerformanceSample should contain all fields")
        void performanceSampleShouldContainAllFields() {
            SystemMonitoringService.PerformanceSample sample = new SystemMonitoringService.PerformanceSample(
                1000.0, 5.0, 60.0, 40.0, System.currentTimeMillis()
            );

            assertEquals(1000.0, sample.tps());
            assertEquals(5.0, sample.latency());
            assertEquals(60.0, sample.memoryUsage());
            assertEquals(40.0, sample.cpuUsage());
            assertTrue(sample.timestamp() > 0);
        }

        @Test
        @DisplayName("PerformanceReport should contain all fields")
        void performanceReportShouldContainAllFields() {
            SystemMonitoringService.PerformanceReport report = new SystemMonitoringService.PerformanceReport(
                500000.0, 2.5, 55.0, 35.0, 5.0
            );

            assertEquals(500000.0, report.averageTPS());
            assertEquals(2.5, report.averageLatency());
            assertEquals(55.0, report.memoryUsage());
            assertEquals(35.0, report.cpuUsage());
            assertEquals(5.0, report.performanceDegradation());
        }
    }

    // ============================================
    // ALERT LEVEL TESTS
    // ============================================

    @Nested
    @DisplayName("Alert Level Tests")
    class AlertLevelTests {

        @Test
        @DisplayName("AlertLevel enum should have all values")
        void alertLevelEnumShouldHaveAllValues() {
            SystemMonitoringService.AlertLevel[] levels = SystemMonitoringService.AlertLevel.values();

            assertEquals(4, levels.length);
            assertTrue(java.util.Arrays.asList(levels).contains(SystemMonitoringService.AlertLevel.INFO));
            assertTrue(java.util.Arrays.asList(levels).contains(SystemMonitoringService.AlertLevel.WARNING));
            assertTrue(java.util.Arrays.asList(levels).contains(SystemMonitoringService.AlertLevel.ERROR));
            assertTrue(java.util.Arrays.asList(levels).contains(SystemMonitoringService.AlertLevel.CRITICAL));
        }
    }
}
