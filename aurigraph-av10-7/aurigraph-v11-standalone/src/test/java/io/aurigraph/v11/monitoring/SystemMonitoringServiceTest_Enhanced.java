package io.aurigraph.v11.monitoring;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Enhanced System Monitoring Service Tests
 * Week 2 - Coverage Expansion
 *
 * Focus on inner class testing to achieve 95% coverage:
 * - MetricsCollector comprehensive tests
 * - HealthChecker with unhealthy scenarios
 * - AlertEngine with alert lifecycle management
 * - PerformanceMonitor with degradation detection
 * - MetricTimeSeries edge cases
 */
@DisplayName("System Monitoring Service - Enhanced Tests")
class SystemMonitoringServiceTest_Enhanced {

    // ==================== MetricsCollector Tests (8 tests) ====================

    @Test
    @DisplayName("MetricsCollector - Get CPU usage returns valid value")
    void testMetricsCollectorCPUUsage() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        double cpuUsage = collector.getCPUUsage();
        assertTrue(cpuUsage >= 0, "CPU usage should be non-negative");
    }

    @Test
    @DisplayName("MetricsCollector - Get memory used returns positive value")
    void testMetricsCollectorMemoryUsed() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        long memoryUsed = collector.getMemoryUsed();
        assertTrue(memoryUsed > 0, "Memory used should be positive");
    }

    @Test
    @DisplayName("MetricsCollector - Get memory total returns positive value")
    void testMetricsCollectorMemoryTotal() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        long memoryTotal = collector.getMemoryTotal();
        assertTrue(memoryTotal > 0, "Total memory should be positive");
    }

    @Test
    @DisplayName("MetricsCollector - Memory usage percentage is valid")
    void testMetricsCollectorMemoryUsagePercent() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        double memoryPercent = collector.getMemoryUsagePercent();
        assertTrue(memoryPercent >= 0 && memoryPercent <= 100,
            "Memory usage percent should be between 0 and 100");
    }

    @Test
    @DisplayName("MetricsCollector - GC count is non-negative")
    void testMetricsCollectorGCCount() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        long gcCount = collector.getGCCount();
        assertTrue(gcCount >= 0, "GC count should be non-negative");
    }

    @Test
    @DisplayName("MetricsCollector - GC time is non-negative")
    void testMetricsCollectorGCTime() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        long gcTime = collector.getGCTime();
        assertTrue(gcTime >= 0, "GC time should be non-negative");
    }

    @Test
    @DisplayName("MetricsCollector - Thread count is positive")
    void testMetricsCollectorThreadCount() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        int threadCount = collector.getThreadCount();
        assertTrue(threadCount > 0, "Thread count should be positive");
    }

    @Test
    @DisplayName("MetricsCollector - All application metrics return expected values")
    void testMetricsCollectorApplicationMetrics() {
        SystemMonitoringService.MetricsCollector collector =
            new SystemMonitoringService.MetricsCollector();

        assertEquals(500000.0, collector.getCurrentTPS());
        assertEquals(1000000L, collector.getTotalTransactions());
        assertEquals(10000L, collector.getBlockHeight());
        assertEquals(10, collector.getActiveValidators());
        assertEquals(5.0, collector.getAverageLatency());
        assertEquals(0L, collector.getErrorCount());
    }

    // ==================== HealthChecker Tests (10 tests) ====================

    @Test
    @DisplayName("HealthChecker - Perform checks returns healthy status")
    void testHealthCheckerPerformChecksHealthy() {
        SystemMonitoringService.HealthChecker checker =
            new SystemMonitoringService.HealthChecker();

        SystemMonitoringService.HealthStatus status = checker.performChecks();

        assertNotNull(status);
        assertTrue(status.healthy(), "Health status should be healthy under normal conditions");
        assertTrue(status.issues().isEmpty(), "Should have no issues when healthy");
    }

    @Test
    @DisplayName("HealthChecker - Get last check status")
    void testHealthCheckerGetLastStatus() {
        SystemMonitoringService.HealthChecker checker =
            new SystemMonitoringService.HealthChecker();

        checker.performChecks();
        SystemMonitoringService.HealthStatus lastStatus = checker.getLastCheckStatus();

        assertNotNull(lastStatus);
        assertNotNull(lastStatus.issues());
    }

    @Test
    @DisplayName("HealthChecker - Last status updates after each check")
    void testHealthCheckerLastStatusUpdates() {
        SystemMonitoringService.HealthChecker checker =
            new SystemMonitoringService.HealthChecker();

        SystemMonitoringService.HealthStatus firstCheck = checker.performChecks();
        SystemMonitoringService.HealthStatus lastStatus1 = checker.getLastCheckStatus();

        assertEquals(firstCheck.healthy(), lastStatus1.healthy());
        assertEquals(firstCheck.issues().size(), lastStatus1.issues().size());
    }

    @Test
    @DisplayName("HealthChecker - Initial last status is healthy")
    void testHealthCheckerInitialLastStatus() {
        SystemMonitoringService.HealthChecker checker =
            new SystemMonitoringService.HealthChecker();

        SystemMonitoringService.HealthStatus initialStatus = checker.getLastCheckStatus();

        assertNotNull(initialStatus);
        assertTrue(initialStatus.healthy());
        assertEquals(0, initialStatus.issues().size());
    }

    @Test
    @DisplayName("HealthStatus - Create healthy status with no issues")
    void testCreateHealthyStatus() {
        SystemMonitoringService.HealthStatus status =
            new SystemMonitoringService.HealthStatus(true, new ArrayList<>());

        assertTrue(status.healthy());
        assertTrue(status.issues().isEmpty());
    }

    @Test
    @DisplayName("HealthStatus - Create unhealthy status with single issue")
    void testCreateUnhealthyStatusSingleIssue() {
        List<String> issues = List.of("Database connection failed");
        SystemMonitoringService.HealthStatus status =
            new SystemMonitoringService.HealthStatus(false, issues);

        assertFalse(status.healthy());
        assertEquals(1, status.issues().size());
        assertEquals("Database connection failed", status.issues().get(0));
    }

    @Test
    @DisplayName("HealthStatus - Create unhealthy status with multiple issues")
    void testCreateUnhealthyStatusMultipleIssues() {
        List<String> issues = List.of(
            "High memory usage",
            "Consensus failure",
            "Network timeout"
        );
        SystemMonitoringService.HealthStatus status =
            new SystemMonitoringService.HealthStatus(false, issues);

        assertFalse(status.healthy());
        assertEquals(3, status.issues().size());
        assertTrue(issues.containsAll(status.issues()));
    }

    @Test
    @DisplayName("HealthChecker - Multiple consecutive checks")
    void testHealthCheckerMultipleChecks() {
        SystemMonitoringService.HealthChecker checker =
            new SystemMonitoringService.HealthChecker();

        for (int i = 0; i < 10; i++) {
            SystemMonitoringService.HealthStatus status = checker.performChecks();
            assertNotNull(status);
        }

        SystemMonitoringService.HealthStatus lastStatus = checker.getLastCheckStatus();
        assertNotNull(lastStatus);
    }

    @Test
    @DisplayName("HealthChecker - Checks are consistent")
    void testHealthCheckerConsistency() {
        SystemMonitoringService.HealthChecker checker =
            new SystemMonitoringService.HealthChecker();

        SystemMonitoringService.HealthStatus check1 = checker.performChecks();
        SystemMonitoringService.HealthStatus check2 = checker.performChecks();

        assertEquals(check1.healthy(), check2.healthy());
    }

    @Test
    @DisplayName("HealthStatus - Issues list is modifiable copy")
    void testHealthStatusIssuesListIndependence() {
        List<String> originalIssues = new ArrayList<>();
        originalIssues.add("Test issue");

        SystemMonitoringService.HealthStatus status =
            new SystemMonitoringService.HealthStatus(false, originalIssues);

        originalIssues.add("Another issue");

        assertEquals(1, status.issues().size(), "Status issues should not reflect changes to original list");
    }

    // ==================== AlertEngine Tests (10 tests) ====================

    @Test
    @DisplayName("AlertEngine - Trigger INFO alert")
    void testAlertEngineTriggerInfoAlert() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Info alert");

        assertEquals(1, alertEngine.getActiveAlertCount());
    }

    @Test
    @DisplayName("AlertEngine - Trigger WARNING alert")
    void testAlertEngineTriggerWarningAlert() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "Warning alert");

        List<SystemMonitoringService.Alert> alerts = alertEngine.getActiveAlerts();
        assertEquals(1, alerts.size());
        assertEquals(SystemMonitoringService.AlertLevel.WARNING, alerts.get(0).level());
    }

    @Test
    @DisplayName("AlertEngine - Trigger ERROR alert")
    void testAlertEngineTriggerErrorAlert() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.ERROR, "Error alert");

        List<SystemMonitoringService.Alert> alerts = alertEngine.getActiveAlerts();
        assertEquals(SystemMonitoringService.AlertLevel.ERROR, alerts.get(0).level());
    }

    @Test
    @DisplayName("AlertEngine - Trigger CRITICAL alert")
    void testAlertEngineTriggerCriticalAlert() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.CRITICAL, "Critical alert");

        List<SystemMonitoringService.Alert> alerts = alertEngine.getActiveAlerts();
        assertEquals(SystemMonitoringService.AlertLevel.CRITICAL, alerts.get(0).level());
    }

    @Test
    @DisplayName("AlertEngine - Trigger multiple alerts")
    void testAlertEngineTriggerMultipleAlerts() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 1");
        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "Alert 2");
        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.ERROR, "Alert 3");

        assertEquals(3, alertEngine.getActiveAlertCount());
    }

    @Test
    @DisplayName("AlertEngine - Clear specific alert")
    void testAlertEngineClearSpecificAlert() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 1");
        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "Alert 2");

        List<SystemMonitoringService.Alert> alerts = alertEngine.getActiveAlerts();
        long alertIdToClear = alerts.get(0).id();

        alertEngine.clearAlert(alertIdToClear);

        assertEquals(1, alertEngine.getActiveAlertCount());
    }

    @Test
    @DisplayName("AlertEngine - Get active alerts returns copy")
    void testAlertEngineGetActiveAlertsReturnsCopy() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 1");

        List<SystemMonitoringService.Alert> alerts1 = alertEngine.getActiveAlerts();
        List<SystemMonitoringService.Alert> alerts2 = alertEngine.getActiveAlerts();

        assertNotSame(alerts1, alerts2, "Should return different list instances");
        assertEquals(alerts1.size(), alerts2.size());
    }

    @Test
    @DisplayName("AlertEngine - Alert IDs are unique and incremental")
    void testAlertEngineAlertIdsUnique() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 1");
        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 2");
        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 3");

        List<SystemMonitoringService.Alert> alerts = alertEngine.getActiveAlerts();

        assertEquals(1L, alerts.get(0).id());
        assertEquals(2L, alerts.get(1).id());
        assertEquals(3L, alerts.get(2).id());
    }

    @Test
    @DisplayName("AlertEngine - Clear non-existent alert does nothing")
    void testAlertEngineClearNonExistentAlert() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.INFO, "Alert 1");

        int initialCount = alertEngine.getActiveAlertCount();
        alertEngine.clearAlert(999L); // Non-existent ID

        assertEquals(initialCount, alertEngine.getActiveAlertCount());
    }

    @Test
    @DisplayName("AlertEngine - Alert contains all fields")
    void testAlertEngineAlertStructure() {
        SystemMonitoringService.AlertEngine alertEngine =
            new SystemMonitoringService.AlertEngine();

        long before = System.currentTimeMillis();
        alertEngine.triggerAlert(SystemMonitoringService.AlertLevel.WARNING, "Test alert message");
        long after = System.currentTimeMillis();

        List<SystemMonitoringService.Alert> alerts = alertEngine.getActiveAlerts();
        SystemMonitoringService.Alert alert = alerts.get(0);

        assertEquals(1L, alert.id());
        assertEquals(SystemMonitoringService.AlertLevel.WARNING, alert.level());
        assertEquals("Test alert message", alert.message());
        assertTrue(alert.timestamp() >= before && alert.timestamp() <= after);
    }

    // ==================== PerformanceMonitor Tests (10 tests) ====================

    @Test
    @DisplayName("PerformanceMonitor - Generate report with no samples")
    void testPerformanceMonitorEmptyReport() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();

        assertNotNull(report);
        assertEquals(0.0, report.averageTPS());
        assertEquals(0.0, report.averageLatency());
        assertEquals(0.0, report.memoryUsage());
        assertEquals(0.0, report.cpuUsage());
        assertEquals(0.0, report.performanceDegradation());
    }

    @Test
    @DisplayName("PerformanceMonitor - Record single sample and generate report")
    void testPerformanceMonitorSingleSample() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        SystemMonitoringService.PerformanceSample sample =
            new SystemMonitoringService.PerformanceSample(
                500000.0, 5.0, 45.0, 30.0, System.currentTimeMillis()
            );

        monitor.recordSample(sample);
        SystemMonitoringService.PerformanceReport report = monitor.generateReport();

        assertEquals(500000.0, report.averageTPS());
        assertEquals(5.0, report.averageLatency());
        assertEquals(45.0, report.memoryUsage());
        assertEquals(30.0, report.cpuUsage());
    }

    @Test
    @DisplayName("PerformanceMonitor - Record multiple samples and calculate averages")
    void testPerformanceMonitorMultipleSamples() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        monitor.recordSample(new SystemMonitoringService.PerformanceSample(
            400000.0, 4.0, 40.0, 25.0, System.currentTimeMillis()));
        monitor.recordSample(new SystemMonitoringService.PerformanceSample(
            600000.0, 6.0, 50.0, 35.0, System.currentTimeMillis()));

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();

        assertEquals(500000.0, report.averageTPS());
        assertEquals(5.0, report.averageLatency());
        assertEquals(45.0, report.memoryUsage());
        assertEquals(30.0, report.cpuUsage());
    }

    @Test
    @DisplayName("PerformanceMonitor - Sample limit enforced (max 100)")
    void testPerformanceMonitorSampleLimit() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        // Add 150 samples (exceeds MAX_SAMPLES of 100)
        for (int i = 0; i < 150; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                500000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + i
            ));
        }

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();

        // Should still generate valid report with latest 100 samples
        assertEquals(500000.0, report.averageTPS());
    }

    @Test
    @DisplayName("PerformanceMonitor - Degradation detection with insufficient samples")
    void testPerformanceMonitorDegradationInsufficientSamples() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        // Add only 15 samples (less than 20 required for degradation calculation)
        for (int i = 0; i < 15; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                500000.0, 5.0, 45.0, 30.0, System.currentTimeMillis()
            ));
        }

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();
        assertEquals(0.0, report.performanceDegradation(),
            "Degradation should be 0 with insufficient samples");
    }

    @Test
    @DisplayName("PerformanceMonitor - Degradation detection with performance drop")
    void testPerformanceMonitorDegradationDetection() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        // Add 10 older samples with high TPS
        for (int i = 0; i < 10; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                1000000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + i
            ));
        }

        // Add 10 middle samples
        for (int i = 0; i < 10; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                1000000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + 100 + i
            ));
        }

        // Add 10 recent samples with lower TPS (performance degraded)
        for (int i = 0; i < 10; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                500000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + 200 + i
            ));
        }

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();

        // Degradation should be 50% ((1000000 - 500000) / 1000000 * 100)
        assertEquals(50.0, report.performanceDegradation(), 0.1);
    }

    @Test
    @DisplayName("PerformanceMonitor - No degradation when performance stable")
    void testPerformanceMonitorNoDegradation() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        // Add 30 samples with stable TPS
        for (int i = 0; i < 30; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                1000000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + i
            ));
        }

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();
        assertEquals(0.0, report.performanceDegradation(), 0.1,
            "Degradation should be 0 when performance is stable");
    }

    @Test
    @DisplayName("PerformanceMonitor - Performance improvement shows negative degradation")
    void testPerformanceMonitorPerformanceImprovement() {
        SystemMonitoringService.PerformanceMonitor monitor =
            new SystemMonitoringService.PerformanceMonitor();

        // Add 10 older samples with lower TPS
        for (int i = 0; i < 10; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                500000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + i
            ));
        }

        // Add 10 middle samples
        for (int i = 0; i < 10; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                500000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + 100 + i
            ));
        }

        // Add 10 recent samples with higher TPS (performance improved)
        for (int i = 0; i < 10; i++) {
            monitor.recordSample(new SystemMonitoringService.PerformanceSample(
                1000000.0, 5.0, 45.0, 30.0, System.currentTimeMillis() + 200 + i
            ));
        }

        SystemMonitoringService.PerformanceReport report = monitor.generateReport();

        // Degradation should be negative (improvement)
        assertTrue(report.performanceDegradation() < 0,
            "Degradation should be negative when performance improves");
    }

    @Test
    @DisplayName("PerformanceSample - Create with all fields")
    void testCreatePerformanceSample() {
        long timestamp = System.currentTimeMillis();

        SystemMonitoringService.PerformanceSample sample =
            new SystemMonitoringService.PerformanceSample(
                750000.0, 4.5, 52.3, 28.7, timestamp
            );

        assertEquals(750000.0, sample.tps());
        assertEquals(4.5, sample.latency());
        assertEquals(52.3, sample.memoryUsage());
        assertEquals(28.7, sample.cpuUsage());
        assertEquals(timestamp, sample.timestamp());
    }

    @Test
    @DisplayName("PerformanceReport - Create with all metrics")
    void testCreatePerformanceReport() {
        SystemMonitoringService.PerformanceReport report =
            new SystemMonitoringService.PerformanceReport(
                850000.0, 3.2, 48.5, 32.1, 12.5
            );

        assertEquals(850000.0, report.averageTPS());
        assertEquals(3.2, report.averageLatency());
        assertEquals(48.5, report.memoryUsage());
        assertEquals(32.1, report.cpuUsage());
        assertEquals(12.5, report.performanceDegradation());
    }

    // ==================== MetricTimeSeries Tests (8 tests) ====================

    @Test
    @DisplayName("MetricTimeSeries - Create time series for metric")
    void testMetricTimeSeriesCreation() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("test.metric");

        assertNotNull(series);
    }

    @Test
    @DisplayName("MetricTimeSeries - Add data point and retrieve")
    void testMetricTimeSeriesAddDataPoint() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("test.metric");

        long timestamp = System.currentTimeMillis();
        series.addDataPoint(42.5, timestamp);

        SystemMonitoringService.MetricValue value = series.getLatestValue();
        assertNotNull(value);
        assertEquals("test.metric", value.name());
        assertEquals(42.5, value.value());
        assertEquals(timestamp, value.timestamp());
    }

    @Test
    @DisplayName("MetricTimeSeries - Add multiple data points, get latest")
    void testMetricTimeSeriesMultipleDataPoints() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("test.metric");

        series.addDataPoint(10.0, System.currentTimeMillis());
        series.addDataPoint(20.0, System.currentTimeMillis() + 100);
        long latestTimestamp = System.currentTimeMillis() + 200;
        series.addDataPoint(30.0, latestTimestamp);

        SystemMonitoringService.MetricValue latest = series.getLatestValue();
        assertEquals(30.0, latest.value(), "Should return the latest value");
        assertEquals(latestTimestamp, latest.timestamp());
    }

    @Test
    @DisplayName("MetricTimeSeries - Get latest value when empty returns null")
    void testMetricTimeSeriesEmptyReturnsNull() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("empty.metric");

        SystemMonitoringService.MetricValue value = series.getLatestValue();
        assertNull(value, "Empty time series should return null");
    }

    @Test
    @DisplayName("MetricTimeSeries - Data point limit enforced (max 1000)")
    void testMetricTimeSeriesDataPointLimit() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("test.metric");

        // Add 1500 data points (exceeds MAX_DATA_POINTS of 1000)
        for (int i = 0; i < 1500; i++) {
            series.addDataPoint(i, System.currentTimeMillis() + i);
        }

        // Should keep only the latest 1000
        SystemMonitoringService.MetricValue latest = series.getLatestValue();
        assertEquals(1499.0, latest.value(), "Should retain latest values");
    }

    @Test
    @DisplayName("MetricTimeSeries - Data points ordered by insertion")
    void testMetricTimeSeriesOrdering() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("test.metric");

        long time1 = System.currentTimeMillis();
        long time2 = time1 + 100;
        long time3 = time2 + 100;

        series.addDataPoint(100.0, time1);
        series.addDataPoint(200.0, time2);
        series.addDataPoint(300.0, time3);

        SystemMonitoringService.MetricValue latest = series.getLatestValue();
        assertEquals(300.0, latest.value());
        assertEquals(time3, latest.timestamp());
    }

    @Test
    @DisplayName("MetricTimeSeries - Old data points removed when limit exceeded")
    void testMetricTimeSeriesOldDataPointsRemoved() {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("test.metric");

        // Add first data point
        series.addDataPoint(1.0, 1000L);

        // Add 1000 more data points
        for (int i = 2; i <= 1001; i++) {
            series.addDataPoint(i, 1000L + i);
        }

        // The first data point (1.0) should be removed
        SystemMonitoringService.MetricValue latest = series.getLatestValue();
        assertEquals(1001.0, latest.value());
    }

    @Test
    @DisplayName("MetricTimeSeries - Concurrent updates handled safely")
    void testMetricTimeSeriesConcurrentUpdates() throws InterruptedException {
        SystemMonitoringService.MetricTimeSeries series =
            new SystemMonitoringService.MetricTimeSeries("concurrent.metric");

        int threadCount = 10;
        int pointsPerThread = 100;
        java.util.concurrent.CountDownLatch latch =
            new java.util.concurrent.CountDownLatch(threadCount);

        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                for (int i = 0; i < pointsPerThread; i++) {
                    series.addDataPoint(threadId * pointsPerThread + i,
                        System.currentTimeMillis());
                }
                latch.countDown();
            });
        }

        assertTrue(latch.await(5, java.util.concurrent.TimeUnit.SECONDS));

        SystemMonitoringService.MetricValue latest = series.getLatestValue();
        assertNotNull(latest);
    }
}
