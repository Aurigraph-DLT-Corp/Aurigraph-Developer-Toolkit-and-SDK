package io.aurigraph.v11.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Analytics Service
 *
 * Provides comprehensive analytics for transactions, volume, distribution, and performance.
 * Supports time-series data for dashboard visualizations (Recharts compatible).
 *
 * Sprint 14 - Story 1 (AV11-062)
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 14
 */
@ApplicationScoped
public class AnalyticsService {

    private static final Logger LOG = Logger.getLogger(AnalyticsService.class);

    @Inject
    TimeSeriesAggregator timeSeriesAggregator;

    @Inject
    MetricsAggregator metricsAggregator;

    // In-memory analytics cache (in production, use Redis/PostgreSQL)
    private final Map<String, AnalyticsSnapshot> analyticsCache = new ConcurrentHashMap<>();
    private final AtomicLong totalTransactionCount = new AtomicLong(0);
    private final AtomicLong totalTransactionVolume = new AtomicLong(0);

    /**
     * Get comprehensive analytics for the specified period
     *
     * @param period Time period: "24h", "7d", "30d"
     * @return Analytics data
     */
    public Uni<AnalyticsResponse> getAnalytics(String period) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Fetching analytics for period: %s", period);

            Instant endTime = Instant.now();
            Instant startTime = calculateStartTime(endTime, period);

            // Aggregate all analytics
            AnalyticsResponse response = new AnalyticsResponse();
            response.period = period;
            response.startTime = startTime;
            response.endTime = endTime;

            // Transaction metrics
            response.totalTransactions = calculateTotalTransactions(startTime, endTime);
            response.averageTPS = calculateAverageTPS(startTime, endTime);
            response.peakTPS = calculatePeakTPS(startTime, endTime);

            // Volume metrics
            response.totalVolume = calculateTotalVolume(startTime, endTime);
            response.averageTransactionSize = calculateAverageTransactionSize(startTime, endTime);

            // Performance metrics
            response.averageLatency = calculateAverageLatency(startTime, endTime);
            response.p99Latency = calculateP99Latency(startTime, endTime);

            // Time-series data for charts
            response.transactionTimeSeries = getTransactionTimeSeries(startTime, endTime, period);
            response.volumeTimeSeries = getVolumeTimeSeries(startTime, endTime, period);
            response.tpsTimeSeries = getTPSTimeSeries(startTime, endTime, period);
            response.latencyTimeSeries = getLatencyTimeSeries(startTime, endTime, period);

            LOG.infof("Analytics computed: %d transactions, %.2f TPS",
                      response.totalTransactions, response.averageTPS);

            return response;
        });
    }

    /**
     * Get volume analytics with time-series breakdown
     *
     * @param period Time period
     * @return Volume analytics
     */
    public Uni<VolumeAnalyticsResponse> getVolumeAnalytics(String period) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Fetching volume analytics for period: %s", period);

            Instant endTime = Instant.now();
            Instant startTime = calculateStartTime(endTime, period);

            VolumeAnalyticsResponse response = new VolumeAnalyticsResponse();
            response.period = period;
            response.totalVolume = calculateTotalVolume(startTime, endTime);
            response.averageVolume = calculateAverageVolume(startTime, endTime);
            response.peakVolume = calculatePeakVolume(startTime, endTime);

            // Volume breakdown by type
            response.volumeByType = getVolumeByType(startTime, endTime);

            // Time-series volume data
            response.volumeTimeSeries = getVolumeTimeSeries(startTime, endTime, period);

            // Growth metrics
            response.volumeGrowth = calculateVolumeGrowth(startTime, endTime, period);
            response.volumeGrowthRate = calculateVolumeGrowthRate(startTime, endTime, period);

            return response;
        });
    }

    /**
     * Get distribution analytics (tokens, assets, users)
     *
     * @return Distribution analytics
     */
    public Uni<DistributionAnalyticsResponse> getDistributionAnalytics() {
        return Uni.createFrom().item(() -> {
            LOG.info("Fetching distribution analytics");

            DistributionAnalyticsResponse response = new DistributionAnalyticsResponse();

            // Token distribution
            response.tokenDistribution = getTokenDistribution();
            response.topTokenHolders = getTopTokenHolders(10);

            // Asset distribution
            response.assetDistribution = getAssetDistribution();
            response.assetsByType = getAssetsByType();

            // User distribution
            response.activeUsers = getActiveUserCount();
            response.newUsers = getNewUserCount();
            response.userGrowth = getUserGrowthRate();

            // Geographic distribution
            response.geographicDistribution = getGeographicDistribution();

            return response;
        });
    }

    /**
     * Get performance analytics with detailed metrics
     *
     * @param period Time period
     * @return Performance analytics
     */
    public Uni<PerformanceAnalyticsResponse> getPerformanceAnalytics(String period) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Fetching performance analytics for period: %s", period);

            Instant endTime = Instant.now();
            Instant startTime = calculateStartTime(endTime, period);

            PerformanceAnalyticsResponse response = new PerformanceAnalyticsResponse();
            response.period = period;

            // TPS metrics
            response.averageTPS = calculateAverageTPS(startTime, endTime);
            response.peakTPS = calculatePeakTPS(startTime, endTime);
            response.minTPS = calculateMinTPS(startTime, endTime);
            response.tpsTimeSeries = getTPSTimeSeries(startTime, endTime, period);

            // Latency metrics
            response.averageLatency = calculateAverageLatency(startTime, endTime);
            response.p50Latency = calculateP50Latency(startTime, endTime);
            response.p95Latency = calculateP95Latency(startTime, endTime);
            response.p99Latency = calculateP99Latency(startTime, endTime);
            response.latencyTimeSeries = getLatencyTimeSeries(startTime, endTime, period);

            // Throughput metrics
            response.totalThroughput = calculateTotalThroughput(startTime, endTime);
            response.averageThroughput = calculateAverageThroughput(startTime, endTime);
            response.throughputTimeSeries = getThroughputTimeSeries(startTime, endTime, period);

            // Resource utilization
            response.cpuUtilization = getCPUUtilization();
            response.memoryUtilization = getMemoryUtilization();
            response.networkUtilization = getNetworkUtilization();

            return response;
        });
    }

    /**
     * Aggregate metrics for a specific time range
     *
     * @param startTime Start time
     * @param endTime End time
     * @return Aggregated metrics
     */
    public Uni<AggregatedMetrics> aggregateMetrics(Instant startTime, Instant endTime) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Aggregating metrics from %s to %s", startTime, endTime);

            AggregatedMetrics metrics = new AggregatedMetrics();
            metrics.startTime = startTime;
            metrics.endTime = endTime;

            metrics.transactionCount = calculateTotalTransactions(startTime, endTime);
            metrics.totalVolume = calculateTotalVolume(startTime, endTime);
            metrics.averageTPS = calculateAverageTPS(startTime, endTime);
            metrics.averageLatency = calculateAverageLatency(startTime, endTime);

            return metrics;
        });
    }

    // Private helper methods

    private Instant calculateStartTime(Instant endTime, String period) {
        return switch (period) {
            case "24h" -> endTime.minus(24, ChronoUnit.HOURS);
            case "7d" -> endTime.minus(7, ChronoUnit.DAYS);
            case "30d" -> endTime.minus(30, ChronoUnit.DAYS);
            default -> endTime.minus(24, ChronoUnit.HOURS);
        };
    }

    private long calculateTotalTransactions(Instant startTime, Instant endTime) {
        // In production, query from database
        return metricsAggregator.getTransactionCountBetween(startTime, endTime);
    }

    private double calculateAverageTPS(Instant startTime, Instant endTime) {
        long transactions = calculateTotalTransactions(startTime, endTime);
        long seconds = ChronoUnit.SECONDS.between(startTime, endTime);
        return seconds > 0 ? (double) transactions / seconds : 0.0;
    }

    private double calculatePeakTPS(Instant startTime, Instant endTime) {
        List<TPSDataPoint> tpsSeries = getTPSTimeSeries(startTime, endTime, "1h");
        return tpsSeries.stream()
                .mapToDouble(dp -> dp.tps)
                .max()
                .orElse(0.0);
    }

    private double calculateMinTPS(Instant startTime, Instant endTime) {
        List<TPSDataPoint> tpsSeries = getTPSTimeSeries(startTime, endTime, "1h");
        return tpsSeries.stream()
                .mapToDouble(dp -> dp.tps)
                .min()
                .orElse(0.0);
    }

    private long calculateTotalVolume(Instant startTime, Instant endTime) {
        return metricsAggregator.getTransactionVolumeBetween(startTime, endTime);
    }

    private double calculateAverageVolume(Instant startTime, Instant endTime) {
        long volume = calculateTotalVolume(startTime, endTime);
        long transactions = calculateTotalTransactions(startTime, endTime);
        return transactions > 0 ? (double) volume / transactions : 0.0;
    }

    private long calculatePeakVolume(Instant startTime, Instant endTime) {
        List<VolumeDataPoint> volumeSeries = getVolumeTimeSeries(startTime, endTime, "1h");
        return volumeSeries.stream()
                .mapToLong(dp -> dp.volume)
                .max()
                .orElse(0L);
    }

    private double calculateAverageTransactionSize(Instant startTime, Instant endTime) {
        return calculateAverageVolume(startTime, endTime);
    }

    private double calculateAverageLatency(Instant startTime, Instant endTime) {
        return metricsAggregator.getAverageLatencyBetween(startTime, endTime);
    }

    private double calculateP50Latency(Instant startTime, Instant endTime) {
        return metricsAggregator.getPercentileLatency(startTime, endTime, 50);
    }

    private double calculateP95Latency(Instant startTime, Instant endTime) {
        return metricsAggregator.getPercentileLatency(startTime, endTime, 95);
    }

    private double calculateP99Latency(Instant startTime, Instant endTime) {
        return metricsAggregator.getPercentileLatency(startTime, endTime, 99);
    }

    private long calculateTotalThroughput(Instant startTime, Instant endTime) {
        return calculateTotalVolume(startTime, endTime);
    }

    private double calculateAverageThroughput(Instant startTime, Instant endTime) {
        long throughput = calculateTotalThroughput(startTime, endTime);
        long seconds = ChronoUnit.SECONDS.between(startTime, endTime);
        return seconds > 0 ? (double) throughput / seconds : 0.0;
    }

    private List<TransactionDataPoint> getTransactionTimeSeries(Instant startTime, Instant endTime, String period) {
        return timeSeriesAggregator.aggregateTransactions(startTime, endTime, getResolution(period));
    }

    private List<VolumeDataPoint> getVolumeTimeSeries(Instant startTime, Instant endTime, String period) {
        return timeSeriesAggregator.aggregateVolume(startTime, endTime, getResolution(period));
    }

    private List<TPSDataPoint> getTPSTimeSeries(Instant startTime, Instant endTime, String period) {
        return timeSeriesAggregator.aggregateTPS(startTime, endTime, getResolution(period));
    }

    private List<LatencyDataPoint> getLatencyTimeSeries(Instant startTime, Instant endTime, String period) {
        return timeSeriesAggregator.aggregateLatency(startTime, endTime, getResolution(period));
    }

    private List<ThroughputDataPoint> getThroughputTimeSeries(Instant startTime, Instant endTime, String period) {
        return timeSeriesAggregator.aggregateThroughput(startTime, endTime, getResolution(period));
    }

    private Map<String, Long> getVolumeByType(Instant startTime, Instant endTime) {
        Map<String, Long> volumeByType = new HashMap<>();
        volumeByType.put("TRANSFER", metricsAggregator.getVolumeByType("TRANSFER", startTime, endTime));
        volumeByType.put("STAKE", metricsAggregator.getVolumeByType("STAKE", startTime, endTime));
        volumeByType.put("SWAP", metricsAggregator.getVolumeByType("SWAP", startTime, endTime));
        volumeByType.put("CONTRACT", metricsAggregator.getVolumeByType("CONTRACT", startTime, endTime));
        return volumeByType;
    }

    private double calculateVolumeGrowth(Instant startTime, Instant endTime, String period) {
        Instant previousStart = calculateStartTime(startTime, period);
        long currentVolume = calculateTotalVolume(startTime, endTime);
        long previousVolume = calculateTotalVolume(previousStart, startTime);
        return currentVolume - previousVolume;
    }

    private double calculateVolumeGrowthRate(Instant startTime, Instant endTime, String period) {
        Instant previousStart = calculateStartTime(startTime, period);
        long currentVolume = calculateTotalVolume(startTime, endTime);
        long previousVolume = calculateTotalVolume(previousStart, startTime);

        if (previousVolume == 0) return 0.0;
        return ((double) (currentVolume - previousVolume) / previousVolume) * 100.0;
    }

    private Map<String, Long> getTokenDistribution() {
        // In production, query from blockchain state
        return metricsAggregator.getTokenDistribution();
    }

    private List<TokenHolder> getTopTokenHolders(int limit) {
        return metricsAggregator.getTopTokenHolders(limit);
    }

    private Map<String, Long> getAssetDistribution() {
        return metricsAggregator.getAssetDistribution();
    }

    private Map<String, Long> getAssetsByType() {
        return metricsAggregator.getAssetsByType();
    }

    private long getActiveUserCount() {
        return metricsAggregator.getActiveUserCount();
    }

    private long getNewUserCount() {
        return metricsAggregator.getNewUserCount();
    }

    private double getUserGrowthRate() {
        return metricsAggregator.getUserGrowthRate();
    }

    private Map<String, Long> getGeographicDistribution() {
        return metricsAggregator.getGeographicDistribution();
    }

    private double getCPUUtilization() {
        return metricsAggregator.getCPUUtilization();
    }

    private double getMemoryUtilization() {
        return metricsAggregator.getMemoryUtilization();
    }

    private double getNetworkUtilization() {
        return metricsAggregator.getNetworkUtilization();
    }

    private String getResolution(String period) {
        return switch (period) {
            case "24h" -> "1h";
            case "7d" -> "6h";
            case "30d" -> "1d";
            default -> "1h";
        };
    }

    // Response DTOs

    public static class AnalyticsResponse {
        public String period;
        public Instant startTime;
        public Instant endTime;
        public long totalTransactions;
        public double averageTPS;
        public double peakTPS;
        public long totalVolume;
        public double averageTransactionSize;
        public double averageLatency;
        public double p99Latency;
        public List<TransactionDataPoint> transactionTimeSeries;
        public List<VolumeDataPoint> volumeTimeSeries;
        public List<TPSDataPoint> tpsTimeSeries;
        public List<LatencyDataPoint> latencyTimeSeries;
    }

    public static class VolumeAnalyticsResponse {
        public String period;
        public long totalVolume;
        public double averageVolume;
        public long peakVolume;
        public Map<String, Long> volumeByType;
        public List<VolumeDataPoint> volumeTimeSeries;
        public double volumeGrowth;
        public double volumeGrowthRate;
    }

    public static class DistributionAnalyticsResponse {
        public Map<String, Long> tokenDistribution;
        public List<TokenHolder> topTokenHolders;
        public Map<String, Long> assetDistribution;
        public Map<String, Long> assetsByType;
        public long activeUsers;
        public long newUsers;
        public double userGrowth;
        public Map<String, Long> geographicDistribution;
    }

    public static class PerformanceAnalyticsResponse {
        public String period;
        public double averageTPS;
        public double peakTPS;
        public double minTPS;
        public List<TPSDataPoint> tpsTimeSeries;
        public double averageLatency;
        public double p50Latency;
        public double p95Latency;
        public double p99Latency;
        public List<LatencyDataPoint> latencyTimeSeries;
        public long totalThroughput;
        public double averageThroughput;
        public List<ThroughputDataPoint> throughputTimeSeries;
        public double cpuUtilization;
        public double memoryUtilization;
        public double networkUtilization;
    }

    public static class AggregatedMetrics {
        public Instant startTime;
        public Instant endTime;
        public long transactionCount;
        public long totalVolume;
        public double averageTPS;
        public double averageLatency;
    }

    public static class TransactionDataPoint {
        public Instant timestamp;
        public long count;

        public TransactionDataPoint(Instant timestamp, long count) {
            this.timestamp = timestamp;
            this.count = count;
        }
    }

    public static class VolumeDataPoint {
        public Instant timestamp;
        public long volume;

        public VolumeDataPoint(Instant timestamp, long volume) {
            this.timestamp = timestamp;
            this.volume = volume;
        }
    }

    public static class TPSDataPoint {
        public Instant timestamp;
        public double tps;

        public TPSDataPoint(Instant timestamp, double tps) {
            this.timestamp = timestamp;
            this.tps = tps;
        }
    }

    public static class LatencyDataPoint {
        public Instant timestamp;
        public double latency;
        public double p95;
        public double p99;

        public LatencyDataPoint(Instant timestamp, double latency, double p95, double p99) {
            this.timestamp = timestamp;
            this.latency = latency;
            this.p95 = p95;
            this.p99 = p99;
        }
    }

    public static class ThroughputDataPoint {
        public Instant timestamp;
        public long throughput;

        public ThroughputDataPoint(Instant timestamp, long throughput) {
            this.timestamp = timestamp;
            this.throughput = throughput;
        }
    }

    public static class TokenHolder {
        public String address;
        public String token;
        public long balance;
        public double percentage;

        public TokenHolder(String address, String token, long balance, double percentage) {
            this.address = address;
            this.token = token;
            this.balance = balance;
            this.percentage = percentage;
        }
    }

    private static class AnalyticsSnapshot {
        Instant timestamp;
        long transactionCount;
        long volume;
        double averageTPS;
        double averageLatency;
    }
}
