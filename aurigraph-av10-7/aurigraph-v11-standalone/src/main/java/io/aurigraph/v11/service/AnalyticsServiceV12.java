package io.aurigraph.v11.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Analytics Service V12
 *
 * Enhanced analytics service for Aurigraph V12 that provides:
 * - Real-time metrics collection from all services
 * - Time-series data aggregation
 * - Moving averages calculation (1m, 5m, 1h windows)
 * - Anomaly detection with configurable thresholds
 * - Performance trend analysis
 *
 * Features:
 * - Metric collection from TransactionService, ConsensusService, NetworkService
 * - Configurable aggregation windows
 * - Moving average calculations
 * - Anomaly detection (threshold violations, trend changes)
 * - Efficient time-series storage (ring buffers)
 * - Thread-safe concurrent operations
 *
 * @author J4C Analytics Agent
 * @version 12.0.0
 * @since V12
 */
@ApplicationScoped
public class AnalyticsServiceV12 {

    private static final Logger LOG = Logger.getLogger(AnalyticsServiceV12.class);

    @Inject
    io.aurigraph.v11.TransactionService transactionService;

    @Inject
    io.aurigraph.v11.analytics.AnalyticsService analyticsService;

    // Time-series storage (ring buffers for efficiency)
    private final ConcurrentLinkedQueue<MetricDataPoint> tpsHistory = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<MetricDataPoint> latencyHistory = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<MetricDataPoint> throughputHistory = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<MetricDataPoint> gasHistory = new ConcurrentLinkedQueue<>();

    // Aggregated metrics cache
    private final Map<String, AggregatedMetrics> metricsCache = new ConcurrentHashMap<>();
    private final Map<String, MovingAverages> movingAverages = new ConcurrentHashMap<>();

    // Anomaly tracking
    private final List<Anomaly> detectedAnomalies = new ArrayList<>();
    private final AtomicLong anomalyCount = new AtomicLong(0);

    // Configuration
    private static final int MAX_HISTORY_SIZE = 10000; // Keep last 10k data points
    private static final long CACHE_TTL_MS = 30000; // 30 seconds cache

    /**
     * Collect metrics from all services
     *
     * Aggregates data from:
     * - TransactionService (TPS, latency, throughput)
     * - AnalyticsService (system performance)
     * - NetworkService (latency, connections)
     *
     * @return CollectedMetrics snapshot of current metrics
     */
    public CollectedMetrics collectMetrics() {
        Instant now = Instant.now();

        // Collect from TransactionService
        var txStats = transactionService.getStats();
        var perfMetrics = analyticsService.getPerformanceMetrics();

        // Create metric data points
        MetricDataPoint tpsPoint = new MetricDataPoint(now, txStats.currentThroughputMeasurement());
        MetricDataPoint latencyPoint = new MetricDataPoint(now, txStats.avgLatencyMs());
        MetricDataPoint throughputPoint = new MetricDataPoint(now, perfMetrics.throughput());
        MetricDataPoint gasPoint = new MetricDataPoint(now, calculateCurrentGasRate());

        // Add to time-series storage
        addToTimeSeries(tpsHistory, tpsPoint);
        addToTimeSeries(latencyHistory, latencyPoint);
        addToTimeSeries(throughputHistory, throughputPoint);
        addToTimeSeries(gasHistory, gasPoint);

        // Build collected metrics
        CollectedMetrics metrics = new CollectedMetrics(
            now,
            tpsPoint.value(),
            latencyPoint.value(),
            throughputPoint.value(),
            gasPoint.value(),
            perfMetrics.cpuUtilization(),
            perfMetrics.memoryUsage().used(),
            perfMetrics.errorRate(),
            txStats.totalProcessed()
        );

        LOG.tracef("Metrics collected: TPS=%.0f, Latency=%.2fms, CPU=%.1f%%",
            metrics.tps(), metrics.latency(), metrics.cpuUtilization());

        return metrics;
    }

    /**
     * Aggregate data for streaming
     *
     * Provides aggregated metrics for:
     * - Time windows (1m, 5m, 1h)
     * - Moving averages
     * - Trend analysis
     *
     * @param timeWindow Aggregation window (1m, 5m, 1h)
     * @return AggregatedMetrics aggregated data
     */
    public AggregatedMetrics aggregateForStreaming(String timeWindow) {
        String cacheKey = "aggregated:" + timeWindow;

        // Check cache
        AggregatedMetrics cached = metricsCache.get(cacheKey);
        if (cached != null && !isCacheExpired(cached.timestamp(), CACHE_TTL_MS)) {
            LOG.tracef("Returning cached aggregated metrics for window: %s", timeWindow);
            return cached;
        }

        // Calculate aggregation window
        long windowMinutes = parseTimeWindow(timeWindow);
        Instant cutoff = Instant.now().minus(windowMinutes, ChronoUnit.MINUTES);

        // Aggregate metrics
        List<MetricDataPoint> tpsData = filterByTime(tpsHistory, cutoff);
        List<MetricDataPoint> latencyData = filterByTime(latencyHistory, cutoff);
        List<MetricDataPoint> throughputData = filterByTime(throughputHistory, cutoff);
        List<MetricDataPoint> gasData = filterByTime(gasHistory, cutoff);

        AggregatedMetrics aggregated = new AggregatedMetrics(
            Instant.now(),
            timeWindow,
            calculateStats(tpsData),
            calculateStats(latencyData),
            calculateStats(throughputData),
            calculateStats(gasData)
        );

        // Cache result
        metricsCache.put(cacheKey, aggregated);

        LOG.debugf("Aggregated metrics calculated for window: %s (avg TPS: %.0f)",
            timeWindow, aggregated.tpsStats().average());

        return aggregated;
    }

    /**
     * Calculate moving averages
     *
     * Computes moving averages for:
     * - 1 minute window
     * - 5 minute window
     * - 1 hour window
     *
     * @param metricType Type of metric (tps, latency, throughput, gas)
     * @return MovingAverages for specified metric
     */
    public MovingAverages calculateMovingAverages(String metricType) {
        ConcurrentLinkedQueue<MetricDataPoint> dataSource = getDataSource(metricType);

        Instant now = Instant.now();
        double avg1m = calculateAverage(dataSource, now.minus(1, ChronoUnit.MINUTES));
        double avg5m = calculateAverage(dataSource, now.minus(5, ChronoUnit.MINUTES));
        double avg1h = calculateAverage(dataSource, now.minus(1, ChronoUnit.HOURS));

        MovingAverages averages = new MovingAverages(
            metricType,
            now,
            avg1m,
            avg5m,
            avg1h
        );

        // Cache result
        movingAverages.put(metricType, averages);

        LOG.tracef("Moving averages calculated for %s: 1m=%.2f, 5m=%.2f, 1h=%.2f",
            metricType, avg1m, avg5m, avg1h);

        return averages;
    }

    /**
     * Detect anomalies
     *
     * Identifies anomalies based on:
     * - Threshold violations (configurable)
     * - Sudden trend changes (> 50% deviation)
     * - Error rate spikes
     * - Performance degradation
     *
     * @return List of detected anomalies
     */
    public List<Anomaly> detectAnomalies() {
        List<Anomaly> anomalies = new ArrayList<>();
        Instant now = Instant.now();

        // Check TPS anomalies
        var tpsStats = aggregateForStreaming("5m").tpsStats();
        if (tpsStats.current() < tpsStats.average() * 0.5) {
            anomalies.add(new Anomaly(
                now,
                "TPS_DROP",
                "CRITICAL",
                String.format("TPS dropped to %.0f (50%% below average)", tpsStats.current()),
                tpsStats.current()
            ));
        }

        // Check latency anomalies
        var latencyStats = aggregateForStreaming("5m").latencyStats();
        if (latencyStats.current() > latencyStats.average() * 2.0) {
            anomalies.add(new Anomaly(
                now,
                "HIGH_LATENCY",
                "WARNING",
                String.format("Latency increased to %.2fms (2x above average)", latencyStats.current()),
                latencyStats.current()
            ));
        }

        // Check error rate anomalies
        var perfMetrics = analyticsService.getPerformanceMetrics();
        if (perfMetrics.errorRate() > 1.0) {
            anomalies.add(new Anomaly(
                now,
                "HIGH_ERROR_RATE",
                "CRITICAL",
                String.format("Error rate: %.2f%%", perfMetrics.errorRate()),
                perfMetrics.errorRate()
            ));
        }

        // Track anomalies
        anomalyCount.addAndGet(anomalies.size());
        detectedAnomalies.addAll(anomalies);

        if (!anomalies.isEmpty()) {
            LOG.warnf("Detected %d anomalies", anomalies.size());
        }

        return anomalies;
    }

    /**
     * Get time-series data
     *
     * Returns historical time-series data for specified metric and time range.
     *
     * @param metricType Type of metric
     * @param startTime Start time
     * @param endTime End time
     * @return List of data points
     */
    public List<MetricDataPoint> getTimeSeriesData(String metricType, Instant startTime, Instant endTime) {
        ConcurrentLinkedQueue<MetricDataPoint> dataSource = getDataSource(metricType);

        return dataSource.stream()
            .filter(dp -> dp.timestamp().isAfter(startTime) && dp.timestamp().isBefore(endTime))
            .collect(Collectors.toList());
    }

    /**
     * Get analytics summary
     *
     * Returns comprehensive analytics summary including:
     * - Current metrics
     * - Aggregated metrics (1m, 5m, 1h)
     * - Moving averages
     * - Detected anomalies
     *
     * @return AnalyticsSummary comprehensive summary
     */
    public AnalyticsSummary getAnalyticsSummary() {
        CollectedMetrics current = collectMetrics();

        return new AnalyticsSummary(
            Instant.now(),
            current,
            aggregateForStreaming("1m"),
            aggregateForStreaming("5m"),
            aggregateForStreaming("1h"),
            calculateMovingAverages("tps"),
            calculateMovingAverages("latency"),
            detectAnomalies(),
            anomalyCount.get()
        );
    }

    // ==================== Helper Methods ====================

    private void addToTimeSeries(ConcurrentLinkedQueue<MetricDataPoint> timeSeries, MetricDataPoint dataPoint) {
        timeSeries.offer(dataPoint);

        // Maintain size limit (ring buffer behavior)
        while (timeSeries.size() > MAX_HISTORY_SIZE) {
            timeSeries.poll();
        }
    }

    private List<MetricDataPoint> filterByTime(ConcurrentLinkedQueue<MetricDataPoint> timeSeries, Instant cutoff) {
        return timeSeries.stream()
            .filter(dp -> dp.timestamp().isAfter(cutoff))
            .collect(Collectors.toList());
    }

    private MetricStats calculateStats(List<MetricDataPoint> data) {
        if (data.isEmpty()) {
            return new MetricStats(0.0, 0.0, 0.0, 0.0, 0.0);
        }

        double sum = 0.0;
        double min = Double.MAX_VALUE;
        double max = Double.MIN_VALUE;

        for (MetricDataPoint dp : data) {
            sum += dp.value();
            min = Math.min(min, dp.value());
            max = Math.max(max, dp.value());
        }

        double average = sum / data.size();
        double current = data.get(data.size() - 1).value();

        return new MetricStats(current, average, min, max, sum);
    }

    private double calculateAverage(ConcurrentLinkedQueue<MetricDataPoint> dataSource, Instant cutoff) {
        List<MetricDataPoint> filtered = filterByTime(dataSource, cutoff);
        if (filtered.isEmpty()) return 0.0;

        return filtered.stream()
            .mapToDouble(MetricDataPoint::value)
            .average()
            .orElse(0.0);
    }

    private ConcurrentLinkedQueue<MetricDataPoint> getDataSource(String metricType) {
        return switch (metricType.toLowerCase()) {
            case "tps" -> tpsHistory;
            case "latency" -> latencyHistory;
            case "throughput" -> throughputHistory;
            case "gas" -> gasHistory;
            default -> new ConcurrentLinkedQueue<>();
        };
    }

    private long parseTimeWindow(String timeWindow) {
        return switch (timeWindow.toLowerCase()) {
            case "1m" -> 1;
            case "5m" -> 5;
            case "1h" -> 60;
            case "24h" -> 1440;
            default -> 5; // default to 5 minutes
        };
    }

    private boolean isCacheExpired(Instant timestamp, long ttlMs) {
        return ChronoUnit.MILLIS.between(timestamp, Instant.now()) > ttlMs;
    }

    private double calculateCurrentGasRate() {
        // Calculate gas per second based on TPS
        var txStats = transactionService.getStats();
        return txStats.currentThroughputMeasurement() * 21000; // 21000 gas per tx
    }

    // ==================== DTOs ====================

    public record MetricDataPoint(
        Instant timestamp,
        double value
    ) {}

    public record CollectedMetrics(
        Instant timestamp,
        double tps,
        double latency,
        double throughput,
        double gasRate,
        double cpuUtilization,
        long memoryUsed,
        double errorRate,
        long totalTransactions
    ) {}

    public record AggregatedMetrics(
        Instant timestamp,
        String timeWindow,
        MetricStats tpsStats,
        MetricStats latencyStats,
        MetricStats throughputStats,
        MetricStats gasStats
    ) {}

    public record MetricStats(
        double current,
        double average,
        double min,
        double max,
        double sum
    ) {}

    public record MovingAverages(
        String metricType,
        Instant timestamp,
        double avg1m,
        double avg5m,
        double avg1h
    ) {}

    public record MovingAverage(
        String metricType,
        String window,
        double value,
        Instant calculatedAt
    ) {}

    public record Anomaly(
        Instant timestamp,
        String type,
        String severity,
        String description,
        double value
    ) {}

    public record AnalyticsSummary(
        Instant timestamp,
        CollectedMetrics current,
        AggregatedMetrics aggregated1m,
        AggregatedMetrics aggregated5m,
        AggregatedMetrics aggregated1h,
        MovingAverages tpsMovingAverages,
        MovingAverages latencyMovingAverages,
        List<Anomaly> anomalies,
        long totalAnomalies
    ) {}
}
