package io.aurigraph.v11.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Time Series Aggregator
 *
 * Aggregates metrics into time-series data for analytics and visualization.
 * Supports multiple resolutions (hourly, daily, weekly) and gap filling.
 *
 * Sprint 14 - Story 1 (AV11-062)
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 14
 */
@ApplicationScoped
public class TimeSeriesAggregator {

    private static final Logger LOG = Logger.getLogger(TimeSeriesAggregator.class);

    @Inject
    MetricsAggregator metricsAggregator;

    // Time-series data cache
    private final Map<String, List<DataPoint>> timeSeriesCache = new ConcurrentHashMap<>();

    /**
     * Aggregate transaction counts into time-series
     *
     * @param startTime Start time
     * @param endTime End time
     * @param resolution Resolution ("1h", "6h", "1d")
     * @return Time-series data points
     */
    public List<AnalyticsService.TransactionDataPoint> aggregateTransactions(
            Instant startTime, Instant endTime, String resolution) {
        LOG.infof("Aggregating transactions: %s to %s, resolution: %s", startTime, endTime, resolution);

        List<Instant> timePoints = generateTimePoints(startTime, endTime, resolution);
        Duration window = parseResolution(resolution);

        return timePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);
                    long count = metricsAggregator.getTransactionCountBetween(timestamp, windowEnd);
                    return new AnalyticsService.TransactionDataPoint(timestamp, count);
                })
                .collect(Collectors.toList());
    }

    /**
     * Aggregate volume into time-series
     *
     * @param startTime Start time
     * @param endTime End time
     * @param resolution Resolution
     * @return Volume time-series
     */
    public List<AnalyticsService.VolumeDataPoint> aggregateVolume(
            Instant startTime, Instant endTime, String resolution) {
        LOG.infof("Aggregating volume: %s to %s, resolution: %s", startTime, endTime, resolution);

        List<Instant> timePoints = generateTimePoints(startTime, endTime, resolution);
        Duration window = parseResolution(resolution);

        return timePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);
                    long volume = metricsAggregator.getTransactionVolumeBetween(timestamp, windowEnd);
                    return new AnalyticsService.VolumeDataPoint(timestamp, volume);
                })
                .collect(Collectors.toList());
    }

    /**
     * Aggregate TPS (Transactions Per Second) into time-series
     *
     * @param startTime Start time
     * @param endTime End time
     * @param resolution Resolution
     * @return TPS time-series
     */
    public List<AnalyticsService.TPSDataPoint> aggregateTPS(
            Instant startTime, Instant endTime, String resolution) {
        LOG.infof("Aggregating TPS: %s to %s, resolution: %s", startTime, endTime, resolution);

        List<Instant> timePoints = generateTimePoints(startTime, endTime, resolution);
        Duration window = parseResolution(resolution);

        return timePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);
                    long count = metricsAggregator.getTransactionCountBetween(timestamp, windowEnd);
                    long seconds = window.getSeconds();
                    double tps = seconds > 0 ? (double) count / seconds : 0.0;
                    return new AnalyticsService.TPSDataPoint(timestamp, tps);
                })
                .collect(Collectors.toList());
    }

    /**
     * Aggregate latency metrics into time-series
     *
     * @param startTime Start time
     * @param endTime End time
     * @param resolution Resolution
     * @return Latency time-series
     */
    public List<AnalyticsService.LatencyDataPoint> aggregateLatency(
            Instant startTime, Instant endTime, String resolution) {
        LOG.infof("Aggregating latency: %s to %s, resolution: %s", startTime, endTime, resolution);

        List<Instant> timePoints = generateTimePoints(startTime, endTime, resolution);
        Duration window = parseResolution(resolution);

        return timePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);
                    double avgLatency = metricsAggregator.getAverageLatencyBetween(timestamp, windowEnd);
                    double p95 = metricsAggregator.getPercentileLatency(timestamp, windowEnd, 95);
                    double p99 = metricsAggregator.getPercentileLatency(timestamp, windowEnd, 99);
                    return new AnalyticsService.LatencyDataPoint(timestamp, avgLatency, p95, p99);
                })
                .collect(Collectors.toList());
    }

    /**
     * Aggregate throughput into time-series
     *
     * @param startTime Start time
     * @param endTime End time
     * @param resolution Resolution
     * @return Throughput time-series
     */
    public List<AnalyticsService.ThroughputDataPoint> aggregateThroughput(
            Instant startTime, Instant endTime, String resolution) {
        LOG.infof("Aggregating throughput: %s to %s, resolution: %s", startTime, endTime, resolution);

        List<Instant> timePoints = generateTimePoints(startTime, endTime, resolution);
        Duration window = parseResolution(resolution);

        return timePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);
                    long volume = metricsAggregator.getTransactionVolumeBetween(timestamp, windowEnd);
                    return new AnalyticsService.ThroughputDataPoint(timestamp, volume);
                })
                .collect(Collectors.toList());
    }

    /**
     * Aggregate generic metric into time-series
     *
     * @param metricName Metric name
     * @param startTime Start time
     * @param endTime End time
     * @param resolution Resolution
     * @return Generic time-series data
     */
    public List<DataPoint> aggregate(String metricName, Instant startTime, Instant endTime, String resolution) {
        LOG.infof("Aggregating metric '%s': %s to %s, resolution: %s",
                  metricName, startTime, endTime, resolution);

        List<Instant> timePoints = generateTimePoints(startTime, endTime, resolution);
        Duration window = parseResolution(resolution);

        return timePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);
                    double value = metricsAggregator.getMetricValue(metricName, timestamp, windowEnd);
                    return new DataPoint(timestamp, value);
                })
                .collect(Collectors.toList());
    }

    /**
     * Group time-series data by hour
     *
     * @param data Input data points
     * @return Hourly grouped data
     */
    public List<DataPoint> groupByHour(List<DataPoint> data) {
        LOG.info("Grouping data by hour");

        Map<Instant, List<DataPoint>> hourlyGroups = data.stream()
                .collect(Collectors.groupingBy(dp -> dp.timestamp.truncatedTo(ChronoUnit.HOURS)));

        return hourlyGroups.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    double avgValue = entry.getValue().stream()
                            .mapToDouble(dp -> dp.value)
                            .average()
                            .orElse(0.0);
                    return new DataPoint(entry.getKey(), avgValue);
                })
                .collect(Collectors.toList());
    }

    /**
     * Group time-series data by day
     *
     * @param data Input data points
     * @return Daily grouped data
     */
    public List<DataPoint> groupByDay(List<DataPoint> data) {
        LOG.info("Grouping data by day");

        Map<Instant, List<DataPoint>> dailyGroups = data.stream()
                .collect(Collectors.groupingBy(dp -> dp.timestamp.truncatedTo(ChronoUnit.DAYS)));

        return dailyGroups.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    double avgValue = entry.getValue().stream()
                            .mapToDouble(dp -> dp.value)
                            .average()
                            .orElse(0.0);
                    return new DataPoint(entry.getKey(), avgValue);
                })
                .collect(Collectors.toList());
    }

    /**
     * Group time-series data by week
     *
     * @param data Input data points
     * @return Weekly grouped data
     */
    public List<DataPoint> groupByWeek(List<DataPoint> data) {
        LOG.info("Grouping data by week");

        // Group by week (Monday as start of week)
        Map<Instant, List<DataPoint>> weeklyGroups = data.stream()
                .collect(Collectors.groupingBy(dp -> {
                    Instant truncated = dp.timestamp.truncatedTo(ChronoUnit.DAYS);
                    long dayOfWeek = (truncated.toEpochMilli() / (24 * 60 * 60 * 1000)) % 7;
                    long daysToMonday = dayOfWeek;
                    return truncated.minus(daysToMonday, ChronoUnit.DAYS);
                }));

        return weeklyGroups.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    double avgValue = entry.getValue().stream()
                            .mapToDouble(dp -> dp.value)
                            .average()
                            .orElse(0.0);
                    return new DataPoint(entry.getKey(), avgValue);
                })
                .collect(Collectors.toList());
    }

    /**
     * Fill gaps in time-series data with interpolated values
     *
     * @param data Input data with potential gaps
     * @param resolution Resolution for gap detection
     * @return Data with gaps filled
     */
    public List<DataPoint> fillGaps(List<DataPoint> data, String resolution) {
        if (data.isEmpty()) {
            return data;
        }

        LOG.infof("Filling gaps in time-series data, resolution: %s", resolution);

        List<DataPoint> sorted = data.stream()
                .sorted(Comparator.comparing(dp -> dp.timestamp))
                .collect(Collectors.toList());

        List<DataPoint> filled = new ArrayList<>();
        Duration window = parseResolution(resolution);

        for (int i = 0; i < sorted.size(); i++) {
            filled.add(sorted.get(i));

            if (i < sorted.size() - 1) {
                Instant current = sorted.get(i).timestamp;
                Instant next = sorted.get(i + 1).timestamp;
                long gapSeconds = ChronoUnit.SECONDS.between(current, next);
                long windowSeconds = window.getSeconds();

                // If gap is larger than expected, fill with interpolated values
                if (gapSeconds > windowSeconds * 1.5) {
                    int gapCount = (int) (gapSeconds / windowSeconds) - 1;
                    double currentValue = sorted.get(i).value;
                    double nextValue = sorted.get(i + 1).value;
                    double step = (nextValue - currentValue) / (gapCount + 1);

                    for (int j = 1; j <= gapCount; j++) {
                        Instant gapTime = current.plusSeconds(windowSeconds * j);
                        double gapValue = currentValue + (step * j);
                        filled.add(new DataPoint(gapTime, gapValue));
                    }
                }
            }
        }

        return filled.stream()
                .sorted(Comparator.comparing(dp -> dp.timestamp))
                .collect(Collectors.toList());
    }

    /**
     * Calculate moving average over time-series data
     *
     * @param data Input data points
     * @param windowSize Window size for moving average
     * @return Smoothed data with moving average
     */
    public List<DataPoint> calculateMovingAverage(List<DataPoint> data, int windowSize) {
        if (data.isEmpty() || windowSize < 1) {
            return data;
        }

        LOG.infof("Calculating moving average with window size: %d", windowSize);

        List<DataPoint> sorted = data.stream()
                .sorted(Comparator.comparing(dp -> dp.timestamp))
                .collect(Collectors.toList());

        List<DataPoint> smoothed = new ArrayList<>();

        for (int i = 0; i < sorted.size(); i++) {
            int start = Math.max(0, i - windowSize + 1);
            int end = i + 1;

            double average = sorted.subList(start, end).stream()
                    .mapToDouble(dp -> dp.value)
                    .average()
                    .orElse(0.0);

            smoothed.add(new DataPoint(sorted.get(i).timestamp, average));
        }

        return smoothed;
    }

    /**
     * Downsample time-series data by taking every nth point
     *
     * @param data Input data
     * @param factor Downsampling factor
     * @return Downsampled data
     */
    public List<DataPoint> downsample(List<DataPoint> data, int factor) {
        if (factor <= 1) {
            return data;
        }

        LOG.infof("Downsampling data by factor: %d", factor);

        List<DataPoint> sorted = data.stream()
                .sorted(Comparator.comparing(dp -> dp.timestamp))
                .collect(Collectors.toList());

        List<DataPoint> downsampled = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i += factor) {
            downsampled.add(sorted.get(i));
        }

        return downsampled;
    }

    /**
     * Resample time-series data to a different resolution
     *
     * @param data Input data
     * @param newResolution Target resolution
     * @return Resampled data
     */
    public List<DataPoint> resample(List<DataPoint> data, String newResolution) {
        LOG.infof("Resampling data to resolution: %s", newResolution);

        if (data.isEmpty()) {
            return data;
        }

        Duration window = parseResolution(newResolution);
        List<DataPoint> sorted = data.stream()
                .sorted(Comparator.comparing(dp -> dp.timestamp))
                .collect(Collectors.toList());

        Instant startTime = sorted.get(0).timestamp;
        Instant endTime = sorted.get(sorted.size() - 1).timestamp;

        List<Instant> newTimePoints = generateTimePoints(startTime, endTime, newResolution);

        return newTimePoints.stream()
                .map(timestamp -> {
                    Instant windowEnd = timestamp.plus(window);

                    // Average all points within this window
                    double average = sorted.stream()
                            .filter(dp -> !dp.timestamp.isBefore(timestamp) && dp.timestamp.isBefore(windowEnd))
                            .mapToDouble(dp -> dp.value)
                            .average()
                            .orElse(0.0);

                    return new DataPoint(timestamp, average);
                })
                .filter(dp -> dp.value != 0.0) // Remove empty windows
                .collect(Collectors.toList());
    }

    // Private helper methods

    private List<Instant> generateTimePoints(Instant startTime, Instant endTime, String resolution) {
        Duration window = parseResolution(resolution);
        List<Instant> points = new ArrayList<>();

        Instant current = startTime.truncatedTo(getChronoUnit(resolution));
        while (current.isBefore(endTime)) {
            points.add(current);
            current = current.plus(window);
        }

        return points;
    }

    private Duration parseResolution(String resolution) {
        return switch (resolution) {
            case "1m" -> Duration.ofMinutes(1);
            case "5m" -> Duration.ofMinutes(5);
            case "15m" -> Duration.ofMinutes(15);
            case "30m" -> Duration.ofMinutes(30);
            case "1h" -> Duration.ofHours(1);
            case "6h" -> Duration.ofHours(6);
            case "12h" -> Duration.ofHours(12);
            case "1d" -> Duration.ofDays(1);
            case "7d" -> Duration.ofDays(7);
            default -> Duration.ofHours(1);
        };
    }

    private ChronoUnit getChronoUnit(String resolution) {
        return switch (resolution) {
            case "1m", "5m", "15m", "30m" -> ChronoUnit.MINUTES;
            case "1h", "6h", "12h" -> ChronoUnit.HOURS;
            case "1d", "7d" -> ChronoUnit.DAYS;
            default -> ChronoUnit.HOURS;
        };
    }

    // Data Transfer Objects

    public static class DataPoint {
        public Instant timestamp;
        public double value;

        public DataPoint(Instant timestamp, double value) {
            this.timestamp = timestamp;
            this.value = value;
        }
    }
}
