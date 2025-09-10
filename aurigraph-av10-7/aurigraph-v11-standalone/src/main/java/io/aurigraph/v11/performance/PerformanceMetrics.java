package io.aurigraph.v11.performance;

import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.DoubleAdder;

/**
 * Aurigraph V11 Performance Metrics Collector
 * 
 * Comprehensive performance monitoring for:
 * - Transaction throughput (TPS)
 * - System resource utilization
 * - Network performance
 * - Memory management
 * - Latency tracking
 */
@ApplicationScoped
public class PerformanceMetrics {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceMetrics.class);

    // JVM Management Beans
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();

    // Performance Counters
    private final AtomicLong totalTransactions = new AtomicLong(0);
    private final AtomicLong startTime = new AtomicLong(System.currentTimeMillis());
    private final DoubleAdder latencySum = new DoubleAdder();
    private final AtomicLong latencyCount = new AtomicLong(0);
    private final AtomicLong networkBytesIn = new AtomicLong(0);
    private final AtomicLong networkBytesOut = new AtomicLong(0);
    private final AtomicLong errorCount = new AtomicLong(0);

    // Recent performance tracking (sliding window)
    private final int WINDOW_SIZE = 60; // 60 seconds
    private final long[] recentTPS = new long[WINDOW_SIZE];
    private final double[] recentLatency = new double[WINDOW_SIZE];
    private int windowIndex = 0;
    private long lastWindowUpdate = System.currentTimeMillis();

    /**
     * Get current transactions per second
     */
    public double getCurrentTPS() {
        long currentTime = System.currentTimeMillis();
        long elapsedTime = currentTime - startTime.get();
        
        if (elapsedTime == 0) return 0;
        
        return (totalTransactions.get() * 1000.0) / elapsedTime;
    }

    /**
     * Get average latency in milliseconds
     */
    public double getAverageLatency() {
        long count = latencyCount.get();
        if (count == 0) return 0;
        
        return latencySum.sum() / count;
    }

    /**
     * Get current memory usage percentage
     */
    public double getMemoryUsage() {
        long used = memoryBean.getHeapMemoryUsage().getUsed();
        long max = memoryBean.getHeapMemoryUsage().getMax();
        
        if (max == -1) {
            // If max is undefined, use committed memory
            max = memoryBean.getHeapMemoryUsage().getCommitted();
        }
        
        return max > 0 ? (used * 100.0) / max : 0;
    }

    /**
     * Get current CPU usage percentage
     */
    public double getCpuUsage() {
        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOsBean = 
                (com.sun.management.OperatingSystemMXBean) osBean;
            return sunOsBean.getProcessCpuLoad() * 100.0;
        }
        
        // Fallback for non-Sun JVMs
        return osBean.getSystemLoadAverage() * 10; // Rough approximation
    }

    /**
     * Get network throughput in bytes per second
     */
    public double getNetworkThroughput() {
        long currentTime = System.currentTimeMillis();
        long elapsedTime = currentTime - startTime.get();
        
        if (elapsedTime == 0) return 0;
        
        long totalBytes = networkBytesIn.get() + networkBytesOut.get();
        return (totalBytes * 1000.0) / elapsedTime;
    }

    /**
     * Get error rate as percentage
     */
    public double getErrorRate() {
        long total = totalTransactions.get();
        if (total == 0) return 0;
        
        return (errorCount.get() * 100.0) / total;
    }

    /**
     * Get peak TPS in the last minute
     */
    public double getPeakTPS() {
        return java.util.Arrays.stream(recentTPS).max().orElse(0);
    }

    /**
     * Get minimum latency in the last minute
     */
    public double getMinLatency() {
        return java.util.Arrays.stream(recentLatency)
                .filter(l -> l > 0)
                .min()
                .orElse(0);
    }

    /**
     * Get maximum latency in the last minute
     */
    public double getMaxLatency() {
        return java.util.Arrays.stream(recentLatency).max().orElse(0);
    }

    /**
     * Get 95th percentile latency
     */
    public double getP95Latency() {
        double[] sortedLatencies = java.util.Arrays.stream(recentLatency)
                .filter(l -> l > 0)
                .sorted()
                .toArray();
        
        if (sortedLatencies.length == 0) return 0;
        
        int index = (int) Math.ceil(0.95 * sortedLatencies.length) - 1;
        return sortedLatencies[Math.max(0, index)];
    }

    /**
     * Get 99th percentile latency
     */
    public double getP99Latency() {
        double[] sortedLatencies = java.util.Arrays.stream(recentLatency)
                .filter(l -> l > 0)
                .sorted()
                .toArray();
        
        if (sortedLatencies.length == 0) return 0;
        
        int index = (int) Math.ceil(0.99 * sortedLatencies.length) - 1;
        return sortedLatencies[Math.max(0, index)];
    }

    /**
     * Get system uptime in seconds
     */
    public long getUptime() {
        return (System.currentTimeMillis() - startTime.get()) / 1000;
    }

    /**
     * Get available memory in bytes
     */
    public long getAvailableMemory() {
        return memoryBean.getHeapMemoryUsage().getMax() - memoryBean.getHeapMemoryUsage().getUsed();
    }

    /**
     * Get total heap memory in bytes
     */
    public long getTotalMemory() {
        return memoryBean.getHeapMemoryUsage().getMax();
    }

    /**
     * Get used heap memory in bytes
     */
    public long getUsedMemory() {
        return memoryBean.getHeapMemoryUsage().getUsed();
    }

    /**
     * Get GC time percentage
     */
    public double getGCTime() {
        return ManagementFactory.getGarbageCollectorMXBeans().stream()
                .mapToLong(gc -> gc.getCollectionTime())
                .sum() * 100.0 / getUptime() / 1000;
    }

    /**
     * Get thread count
     */
    public int getThreadCount() {
        return ManagementFactory.getThreadMXBean().getThreadCount();
    }

    /**
     * Get loaded class count
     */
    public int getLoadedClassCount() {
        return ManagementFactory.getClassLoadingMXBean().getLoadedClassCount();
    }

    // Recording methods for transaction processing

    /**
     * Record a successful transaction with latency
     */
    public void recordTransaction(double latencyMs) {
        totalTransactions.incrementAndGet();
        latencySum.add(latencyMs);
        latencyCount.incrementAndGet();
        
        updateSlidingWindow();
        
        logger.debug("Recorded transaction with latency: {}ms", latencyMs);
    }

    /**
     * Record a failed transaction
     */
    public void recordError() {
        errorCount.incrementAndGet();
        totalTransactions.incrementAndGet();
        
        logger.debug("Recorded transaction error. Total errors: {}", errorCount.get());
    }

    /**
     * Record network traffic
     */
    public void recordNetworkTraffic(long bytesIn, long bytesOut) {
        networkBytesIn.addAndGet(bytesIn);
        networkBytesOut.addAndGet(bytesOut);
    }

    /**
     * Reset all metrics
     */
    public void reset() {
        totalTransactions.set(0);
        startTime.set(System.currentTimeMillis());
        latencySum.reset();
        latencyCount.set(0);
        networkBytesIn.set(0);
        networkBytesOut.set(0);
        errorCount.set(0);
        
        // Clear sliding window
        java.util.Arrays.fill(recentTPS, 0);
        java.util.Arrays.fill(recentLatency, 0);
        windowIndex = 0;
        lastWindowUpdate = System.currentTimeMillis();
        
        logger.info("Performance metrics reset");
    }

    /**
     * Get comprehensive metrics summary
     */
    public MetricsSummary getMetricsSummary() {
        return new MetricsSummary(
            getCurrentTPS(),
            getAverageLatency(),
            getMemoryUsage(),
            getCpuUsage(),
            getNetworkThroughput(),
            getErrorRate(),
            getPeakTPS(),
            getP95Latency(),
            getP99Latency(),
            getUptime(),
            totalTransactions.get(),
            errorCount.get()
        );
    }

    /**
     * Performance metrics summary class
     */
    public static class MetricsSummary {
        public final double currentTPS;
        public final double averageLatency;
        public final double memoryUsage;
        public final double cpuUsage;
        public final double networkThroughput;
        public final double errorRate;
        public final double peakTPS;
        public final double p95Latency;
        public final double p99Latency;
        public final long uptime;
        public final long totalTransactions;
        public final long totalErrors;

        public MetricsSummary(double currentTPS, double averageLatency, double memoryUsage,
                             double cpuUsage, double networkThroughput, double errorRate,
                             double peakTPS, double p95Latency, double p99Latency,
                             long uptime, long totalTransactions, long totalErrors) {
            this.currentTPS = currentTPS;
            this.averageLatency = averageLatency;
            this.memoryUsage = memoryUsage;
            this.cpuUsage = cpuUsage;
            this.networkThroughput = networkThroughput;
            this.errorRate = errorRate;
            this.peakTPS = peakTPS;
            this.p95Latency = p95Latency;
            this.p99Latency = p99Latency;
            this.uptime = uptime;
            this.totalTransactions = totalTransactions;
            this.totalErrors = totalErrors;
        }

        @Override
        public String toString() {
            return String.format(
                "MetricsSummary{TPS=%.2f, Latency=%.2fms, Memory=%.1f%%, CPU=%.1f%%, Errors=%.3f%%, Uptime=%ds}",
                currentTPS, averageLatency, memoryUsage, cpuUsage, errorRate, uptime
            );
        }
    }

    // Private helper methods

    private void updateSlidingWindow() {
        long currentTime = System.currentTimeMillis();
        
        // Update window every second
        if (currentTime - lastWindowUpdate >= 1000) {
            windowIndex = (windowIndex + 1) % WINDOW_SIZE;
            recentTPS[windowIndex] = (long) getCurrentTPS();
            recentLatency[windowIndex] = getAverageLatency();
            lastWindowUpdate = currentTime;
        }
    }

    /**
     * Get performance trend over the last minute
     */
    public PerformanceTrend getPerformanceTrend() {
        double avgTPS = java.util.Arrays.stream(recentTPS).average().orElse(0);
        double avgLatency = java.util.Arrays.stream(recentLatency)
                .filter(l -> l > 0)
                .average()
                .orElse(0);
        
        // Calculate trend direction
        int halfWindow = WINDOW_SIZE / 2;
        double firstHalfTPS = java.util.Arrays.stream(recentTPS, 0, halfWindow).average().orElse(0);
        double secondHalfTPS = java.util.Arrays.stream(recentTPS, halfWindow, WINDOW_SIZE).average().orElse(0);
        
        String tpsTrend = secondHalfTPS > firstHalfTPS * 1.05 ? "increasing" :
                         secondHalfTPS < firstHalfTPS * 0.95 ? "decreasing" : "stable";
        
        return new PerformanceTrend(avgTPS, avgLatency, tpsTrend);
    }

    /**
     * Performance trend information
     */
    public static class PerformanceTrend {
        public final double averageTPS;
        public final double averageLatency;
        public final String trend;

        public PerformanceTrend(double averageTPS, double averageLatency, String trend) {
            this.averageTPS = averageTPS;
            this.averageLatency = averageLatency;
            this.trend = trend;
        }

        @Override
        public String toString() {
            return String.format("PerformanceTrend{TPS=%.2f (%s), Latency=%.2fms}", 
                               averageTPS, trend, averageLatency);
        }
    }

    /**
     * Check if system is healthy based on performance metrics
     */
    public boolean isSystemHealthy() {
        return getCurrentTPS() > 100000 && // At least 100K TPS
               getAverageLatency() < 500 && // Less than 500ms latency
               getMemoryUsage() < 90 &&     // Less than 90% memory usage
               getCpuUsage() < 95 &&        // Less than 95% CPU usage
               getErrorRate() < 5.0;        // Less than 5% error rate
    }

    /**
     * Get system health score (0-100)
     */
    public double getHealthScore() {
        double tpsScore = Math.min(100, getCurrentTPS() / 10000); // 1M TPS = 100 points
        double latencyScore = Math.max(0, 100 - getAverageLatency() / 5); // 500ms = 0 points
        double memoryScore = Math.max(0, 100 - getMemoryUsage());
        double cpuScore = Math.max(0, 100 - getCpuUsage());
        double errorScore = Math.max(0, 100 - getErrorRate() * 20);
        
        return (tpsScore + latencyScore + memoryScore + cpuScore + errorScore) / 5.0;
    }

    /**
     * Log current performance metrics
     */
    public void logCurrentMetrics() {
        MetricsSummary summary = getMetricsSummary();
        logger.info("Performance Metrics: {}", summary);
        logger.info("Health Score: {:.1f}/100", getHealthScore());
        logger.info("System Healthy: {}", isSystemHealthy());
    }
}