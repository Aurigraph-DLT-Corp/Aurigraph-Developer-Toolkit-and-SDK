package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.MonitoringService;
import io.aurigraph.v11.grpc.MetricsRequest;
import io.aurigraph.v11.grpc.MetricsResponse;
import io.aurigraph.v11.grpc.Metric;
import io.aurigraph.v11.grpc.StreamMetricsRequest;
import io.aurigraph.v11.grpc.PerformanceStats;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.Multi;
import com.google.protobuf.Empty;
import com.google.protobuf.Timestamp;
import org.jboss.logging.Logger;

import java.lang.management.*;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * gRPC Monitoring Service Implementation
 * Sprint 2 - Task 9: Implement MonitoringService gRPC (P1, 13 story points)
 *
 * Provides real-time monitoring capabilities via gRPC:
 * - GetMetrics(): Retrieve specific metrics
 * - StreamMetrics(): Real-time metric streaming
 * - GetPerformanceStats(): Comprehensive performance statistics
 *
 * @version 11.3.0
 * @author Aurigraph V11 Team - Backend Development Agent (BDA)
 */
@GrpcService
public class MonitoringServiceImpl implements MonitoringService {

    private static final Logger LOG = Logger.getLogger(MonitoringServiceImpl.class);

    // JVM monitoring beans
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
    private final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

    // Performance tracking
    private long totalTransactions = 0;
    private long successfulTransactions = 0;
    private long failedTransactions = 0;
    private double currentTPS = 0.0;
    private double peakTPS = 0.0;
    private final List<Long> latencies = new ArrayList<>();

    /**
     * Get specific metrics
     * Sprint 2 Task 9 - Endpoint 1/3
     */
    @Override
    public Uni<MetricsResponse> getMetrics(MetricsRequest request) {
        LOG.infof("GetMetrics called with %d metric names", request.getMetricNamesCount());

        return Uni.createFrom().item(() -> {
            List<Metric> metrics = new ArrayList<>();
            Instant now = Instant.now();
            Timestamp timestamp = Timestamp.newBuilder()
                .setSeconds(now.getEpochSecond())
                .setNanos(now.getNano())
                .build();

            // If no specific metrics requested, return all default metrics
            List<String> requestedMetrics = request.getMetricNamesCount() > 0
                ? request.getMetricNamesList()
                : getDefaultMetricNames();

            for (String metricName : requestedMetrics) {
                Metric metric = collectMetric(metricName, timestamp);
                if (metric != null) {
                    metrics.add(metric);
                }
            }

            LOG.infof("Returning %d metrics", metrics.size());

            return MetricsResponse.newBuilder()
                .addAllMetrics(metrics)
                .build();
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Stream metrics in real-time
     * Sprint 2 Task 9 - Endpoint 2/3 (Streaming)
     */
    @Override
    public Multi<Metric> streamMetrics(StreamMetricsRequest request) {
        int intervalSeconds = request.getIntervalSeconds() > 0
            ? request.getIntervalSeconds()
            : 5; // Default 5 seconds

        LOG.infof("StreamMetrics called with interval=%d seconds, metrics=%d",
            intervalSeconds, request.getMetricNamesCount());

        List<String> requestedMetrics = request.getMetricNamesCount() > 0
            ? request.getMetricNamesList()
            : getDefaultMetricNames();

        return Multi.createFrom().ticks()
            .every(Duration.ofSeconds(intervalSeconds))
            .onItem().transform(tick -> {
                Instant now = Instant.now();
                Timestamp timestamp = Timestamp.newBuilder()
                    .setSeconds(now.getEpochSecond())
                    .setNanos(now.getNano())
                    .build();

                // Return first metric in the list (streaming one at a time)
                String metricName = requestedMetrics.get((int) (tick % requestedMetrics.size()));
                return collectMetric(metricName, timestamp);
            })
            .filter(metric -> metric != null)
            .runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get comprehensive performance statistics
     * Sprint 2 Task 9 - Endpoint 3/3
     */
    @Override
    public Uni<PerformanceStats> getPerformanceStats(Empty request) {
        LOG.debug("GetPerformanceStats called");

        return Uni.createFrom().item(() -> {
            // Calculate statistics
            double avgLatency = latencies.isEmpty() ? 0.0
                : latencies.stream().mapToLong(Long::longValue).average().orElse(0.0);

            double p95Latency = calculatePercentile(latencies, 0.95);
            double p99Latency = calculatePercentile(latencies, 0.99);

            // Memory stats
            MemoryUsage heapMemory = memoryBean.getHeapMemoryUsage();
            long maxMemory = heapMemory.getMax();
            long usedMemory = heapMemory.getUsed();
            double memoryUsagePercent = maxMemory > 0
                ? (usedMemory * 100.0) / maxMemory
                : 0.0;

            // CPU stats (approximate)
            double cpuUsage = osBean.getSystemLoadAverage() / osBean.getAvailableProcessors() * 100.0;
            if (cpuUsage < 0) cpuUsage = 0.0; // Not available on some platforms

            // Update current TPS (mock calculation)
            updateTPS();

            // Create timestamp for measured_at field
            Instant now = Instant.now();
            Timestamp measuredAt = Timestamp.newBuilder()
                .setSeconds(now.getEpochSecond())
                .setNanos(now.getNano())
                .build();

            PerformanceStats stats = PerformanceStats.newBuilder()
                .setCurrentTps(currentTPS)
                .setPeakTps(peakTPS)
                .setAverageLatencyMs(avgLatency)
                .setP95LatencyMs(p95Latency)
                .setP99LatencyMs(p99Latency)
                .setTotalTransactions(totalTransactions)
                .setSuccessfulTransactions(successfulTransactions)
                .setFailedTransactions(failedTransactions)
                .setCpuUsagePercent(cpuUsage)
                .setMemoryUsagePercent(memoryUsagePercent)
                .setActiveConnections(threadBean.getThreadCount()) // Using thread count as proxy for connections
                .setMeasuredAt(measuredAt)
                .build();

            LOG.debugf("Performance stats: TPS=%.2f, Memory=%.2f%%, CPU=%.2f%%",
                currentTPS, memoryUsagePercent, cpuUsage);

            return stats;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Collect a specific metric by name
     */
    private Metric collectMetric(String metricName, Timestamp timestamp) {
        try {
            double value = 0.0;
            Map<String, String> labels = new HashMap<>();

            switch (metricName.toLowerCase()) {
                case "cpu_usage":
                    value = osBean.getSystemLoadAverage() / osBean.getAvailableProcessors() * 100.0;
                    if (value < 0) value = 0.0;
                    labels.put("unit", "percent");
                    break;

                case "memory_used":
                    value = memoryBean.getHeapMemoryUsage().getUsed() / (1024.0 * 1024.0); // MB
                    labels.put("unit", "MB");
                    break;

                case "memory_max":
                    value = memoryBean.getHeapMemoryUsage().getMax() / (1024.0 * 1024.0); // MB
                    labels.put("unit", "MB");
                    break;

                case "memory_usage_percent":
                    long max = memoryBean.getHeapMemoryUsage().getMax();
                    long used = memoryBean.getHeapMemoryUsage().getUsed();
                    value = max > 0 ? (used * 100.0) / max : 0.0;
                    labels.put("unit", "percent");
                    break;

                case "thread_count":
                    value = threadBean.getThreadCount();
                    labels.put("unit", "threads");
                    break;

                case "uptime":
                    value = runtimeBean.getUptime() / 1000.0; // seconds
                    labels.put("unit", "seconds");
                    break;

                case "current_tps":
                    updateTPS();
                    value = currentTPS;
                    labels.put("unit", "tps");
                    break;

                case "peak_tps":
                    value = peakTPS;
                    labels.put("unit", "tps");
                    break;

                case "total_transactions":
                    value = totalTransactions;
                    labels.put("unit", "count");
                    break;

                case "available_processors":
                    value = osBean.getAvailableProcessors();
                    labels.put("unit", "count");
                    break;

                default:
                    LOG.warnf("Unknown metric: %s", metricName);
                    return null;
            }

            return Metric.newBuilder()
                .setName(metricName)
                .setValue(value)
                .setTimestamp(timestamp)
                .putAllLabels(labels)
                .build();

        } catch (Exception e) {
            LOG.errorf(e, "Error collecting metric: %s", metricName);
            return null;
        }
    }

    /**
     * Get default metric names to return when no specific metrics requested
     */
    private List<String> getDefaultMetricNames() {
        return List.of(
            "cpu_usage",
            "memory_usage_percent",
            "thread_count",
            "current_tps",
            "total_transactions",
            "uptime"
        );
    }

    /**
     * Calculate percentile latency
     */
    private double calculatePercentile(List<Long> values, double percentile) {
        if (values.isEmpty()) return 0.0;

        List<Long> sorted = new ArrayList<>(values);
        sorted.sort(Long::compareTo);

        int index = (int) Math.ceil(percentile * sorted.size()) - 1;
        if (index < 0) index = 0;
        if (index >= sorted.size()) index = sorted.size() - 1;

        return sorted.get(index);
    }

    /**
     * Update TPS calculation (mock for now, will integrate with actual transaction service)
     */
    private void updateTPS() {
        // Mock TPS calculation - will be replaced with actual metrics
        currentTPS = Math.random() * 100000; // Simulated TPS
        if (currentTPS > peakTPS) {
            peakTPS = currentTPS;
        }
    }

    /**
     * Record transaction for metrics tracking
     * Will be called by TransactionService
     */
    public void recordTransaction(boolean success, long latencyMs) {
        totalTransactions++;
        if (success) {
            successfulTransactions++;
        } else {
            failedTransactions++;
        }

        latencies.add(latencyMs);

        // Keep only last 1000 latencies to prevent memory bloat
        if (latencies.size() > 1000) {
            latencies.remove(0);
        }
    }
}
