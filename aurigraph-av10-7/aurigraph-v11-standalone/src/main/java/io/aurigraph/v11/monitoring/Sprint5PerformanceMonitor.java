package io.aurigraph.v11.monitoring;

import io.aurigraph.v11.performance.VirtualThreadPoolManager;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import java.lang.management.*;
import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.stream.Collectors;

/**
 * Sprint 5 Performance Monitor for 15-Core Intel Xeon Gold
 * Comprehensive monitoring system for 1.6M+ TPS performance tracking
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Hardware-specific monitoring (15-core optimized)
 * - Memory and GC optimization tracking
 * - NUMA-aware performance analysis
 * - AI/ML performance correlation
 * - Advanced alerting and threshold management
 * - Performance regression detection
 * - Automated performance tuning recommendations
 */
@ApplicationScoped
@Named("sprint5PerformanceMonitor")
public class Sprint5PerformanceMonitor {

    private static final Logger logger = LoggerFactory.getLogger(Sprint5PerformanceMonitor.class);

    @Inject
    VirtualThreadPoolManager threadPoolManager;

    @ConfigProperty(name = "performance.hardware.cores", defaultValue = "15")
    int hardwareCores;

    @ConfigProperty(name = "consensus.target.tps", defaultValue = "1600000")
    long targetTps;

    @ConfigProperty(name = "performance.monitoring.interval.ms", defaultValue = "1000")
    long monitoringIntervalMs;

    @ConfigProperty(name = "performance.monitoring.detailed.enabled", defaultValue = "false")
    boolean detailedMonitoringEnabled;

    // JMX Beans for system monitoring
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();
    private final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
    private final ClassLoadingMXBean classLoadingBean = ManagementFactory.getClassLoadingMXBean();
    
    // Performance metrics storage
    private final Map<String, MetricTimeSeries> metrics = new ConcurrentHashMap<>();
    private final AtomicLong metricsCollectionCount = new AtomicLong(0);
    
    // Real-time performance counters
    private final AtomicReference<PerformanceSnapshot> currentSnapshot = new AtomicReference<>();
    private final AtomicReference<PerformanceSnapshot> previousSnapshot = new AtomicReference<>();
    
    // Hardware-specific monitoring
    private final AtomicLongArray perCoreUsage = new AtomicLongArray(hardwareCores);
    private final AtomicLongArray perCoreContextSwitches = new AtomicLongArray(hardwareCores);
    private final AtomicLongArray numaNodeMemoryUsage = new AtomicLongArray(2); // Assume 2 NUMA nodes
    
    // Advanced performance metrics
    private final AtomicLong totalTransactionsProcessed = new AtomicLong(0);
    private final AtomicLong currentTps = new AtomicLong(0);
    private final AtomicLong peakTps = new AtomicLong(0);
    private final AtomicReference<Double> avgLatency = new AtomicReference<>(0.0);
    private final AtomicReference<Double> p99Latency = new AtomicReference<>(0.0);
    private final AtomicReference<Double> throughputEfficiency = new AtomicReference<>(0.0);
    
    // Memory optimization tracking
    private final AtomicLong heapUtilization = new AtomicLong(0);
    private final AtomicLong offHeapUtilization = new AtomicLong(0);
    private final AtomicLong directMemoryUtilization = new AtomicLong(0);
    private final AtomicLong gcPauseTime = new AtomicLong(0);
    private final AtomicLong gcThroughput = new AtomicLong(0);
    
    // Thread and concurrency monitoring
    private final AtomicInteger activeVirtualThreads = new AtomicInteger(0);
    private final AtomicInteger blockedThreads = new AtomicInteger(0);
    private final AtomicLong threadContentionTime = new AtomicLong(0);
    private final AtomicLong lockContentionCount = new AtomicLong(0);
    
    // Performance regression detection
    private final Queue<PerformanceSnapshot> historyWindow = new ConcurrentLinkedQueue<>();
    private final AtomicBoolean regressionDetected = new AtomicBoolean(false);
    private final AtomicReference<String> regressionReason = new AtomicReference<>("");
    
    // Monitoring tasks
    private final ScheduledExecutorService monitoringScheduler = Executors.newScheduledThreadPool(3);
    private ScheduledFuture<?> metricsCollectionTask;
    private ScheduledFuture<?> performanceAnalysisTask;
    private ScheduledFuture<?> alertingTask;

    @PostConstruct
    public void initialize() {
        logger.info("Initializing Sprint 5 Performance Monitor for {}-core system (target: {} TPS)", 
            hardwareCores, targetTps);
        
        // Initialize metric time series
        initializeMetrics();
        
        // Start monitoring tasks
        startMetricsCollection();
        startPerformanceAnalysis();
        startAlerting();
        
        logger.info("Performance monitoring initialized - collection interval: {}ms", monitoringIntervalMs);
    }

    private void initializeMetrics() {
        // Core performance metrics
        metrics.put("tps", new MetricTimeSeries("tps", "Transactions Per Second", 1000));
        metrics.put("latency_avg", new MetricTimeSeries("latency_avg", "Average Latency (ms)", 1000));
        metrics.put("latency_p99", new MetricTimeSeries("latency_p99", "99th Percentile Latency (ms)", 1000));
        metrics.put("throughput_efficiency", new MetricTimeSeries("throughput_efficiency", "Throughput Efficiency (%)", 1000));
        
        // Memory metrics
        metrics.put("heap_usage", new MetricTimeSeries("heap_usage", "Heap Usage (%)", 1000));
        metrics.put("heap_used_mb", new MetricTimeSeries("heap_used_mb", "Heap Used (MB)", 1000));
        metrics.put("heap_committed_mb", new MetricTimeSeries("heap_committed_mb", "Heap Committed (MB)", 1000));
        metrics.put("direct_memory_mb", new MetricTimeSeries("direct_memory_mb", "Direct Memory (MB)", 1000));
        metrics.put("metaspace_mb", new MetricTimeSeries("metaspace_mb", "Metaspace (MB)", 1000));
        
        // GC metrics
        metrics.put("gc_pause_time", new MetricTimeSeries("gc_pause_time", "GC Pause Time (ms)", 1000));
        metrics.put("gc_throughput", new MetricTimeSeries("gc_throughput", "GC Throughput (%)", 1000));
        metrics.put("gc_frequency", new MetricTimeSeries("gc_frequency", "GC Frequency (per min)", 1000));
        
        // CPU and system metrics
        metrics.put("cpu_usage", new MetricTimeSeries("cpu_usage", "CPU Usage (%)", 1000));
        metrics.put("system_load", new MetricTimeSeries("system_load", "System Load Average", 1000));
        metrics.put("context_switches", new MetricTimeSeries("context_switches", "Context Switches", 1000));
        
        // Thread metrics
        metrics.put("thread_count", new MetricTimeSeries("thread_count", "Thread Count", 1000));
        metrics.put("virtual_thread_count", new MetricTimeSeries("virtual_thread_count", "Virtual Thread Count", 1000));
        metrics.put("blocked_thread_count", new MetricTimeSeries("blocked_thread_count", "Blocked Thread Count", 1000));
        
        // Network and I/O metrics
        metrics.put("network_throughput", new MetricTimeSeries("network_throughput", "Network Throughput (MB/s)", 1000));
        metrics.put("disk_io", new MetricTimeSeries("disk_io", "Disk I/O (MB/s)", 1000));
        
        // Hardware-specific metrics
        for (int i = 0; i < hardwareCores; i++) {
            metrics.put("core_" + i + "_usage", new MetricTimeSeries("core_" + i + "_usage", "Core " + i + " Usage (%)", 500));
        }
        
        for (int i = 0; i < 2; i++) { // Assume 2 NUMA nodes
            metrics.put("numa_" + i + "_memory", new MetricTimeSeries("numa_" + i + "_memory", "NUMA Node " + i + " Memory (MB)", 500));
        }
        
        logger.info("Initialized {} metric time series", metrics.size());
    }

    private void startMetricsCollection() {
        metricsCollectionTask = monitoringScheduler.scheduleAtFixedRate(
            this::collectMetrics, 0, monitoringIntervalMs, TimeUnit.MILLISECONDS);
        
        logger.info("Started metrics collection task");
    }

    private void startPerformanceAnalysis() {
        performanceAnalysisTask = monitoringScheduler.scheduleAtFixedRate(
            this::performanceAnalysis, 5000, 5000, TimeUnit.MILLISECONDS);
        
        logger.info("Started performance analysis task");
    }

    private void startAlerting() {
        alertingTask = monitoringScheduler.scheduleAtFixedRate(
            this::checkAlerts, 10000, 10000, TimeUnit.MILLISECONDS);
        
        logger.info("Started alerting task");
    }

    private void collectMetrics() {
        try {
            long startTime = System.nanoTime();
            
            // Create new performance snapshot
            PerformanceSnapshot snapshot = createPerformanceSnapshot();
            
            // Update current and previous snapshots
            previousSnapshot.set(currentSnapshot.getAndSet(snapshot));
            
            // Store metrics in time series
            updateMetricTimeSeries(snapshot);
            
            // Update atomic counters for fast access
            updateAtomicCounters(snapshot);
            
            // Increment collection counter
            metricsCollectionCount.incrementAndGet();
            
            long collectionTime = (System.nanoTime() - startTime) / 1_000_000;
            
            if (detailedMonitoringEnabled) {
                logger.debug("Metrics collection completed in {}ms", collectionTime);
            }
            
        } catch (Exception e) {
            logger.error("Error during metrics collection", e);
        }
    }

    private PerformanceSnapshot createPerformanceSnapshot() {
        Instant timestamp = Instant.now();
        
        // Memory metrics
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();
        
        // GC metrics
        long totalGcTime = gcBeans.stream().mapToLong(GarbageCollectorMXBean::getCollectionTime).sum();
        long totalGcCount = gcBeans.stream().mapToLong(GarbageCollectorMXBean::getCollectionCount).sum();
        
        // Thread metrics
        int threadCount = threadBean.getThreadCount();
        int peakThreadCount = threadBean.getPeakThreadCount();
        int daemonThreadCount = threadBean.getDaemonThreadCount();
        
        // System metrics
        double systemLoadAverage = osBean.getSystemLoadAverage();
        double processCpuUsage = getProcessCpuUsage();
        
        // Calculate derived metrics
        double heapUtilizationPercent = (double) heapUsage.getUsed() / heapUsage.getMax() * 100;
        double gcThroughputPercent = calculateGcThroughput(totalGcTime);
        
        // Hardware-specific metrics (simulated for now)
        Map<String, Double> perCoreMetrics = collectPerCoreMetrics();
        Map<String, Double> numaMetrics = collectNumaMetrics();
        
        return new PerformanceSnapshot(
            timestamp,
            currentTps.get(),
            avgLatency.get(),
            p99Latency.get(),
            throughputEfficiency.get(),
            heapUsage.getUsed() / 1024 / 1024, // MB
            heapUsage.getCommitted() / 1024 / 1024, // MB
            heapUsage.getMax() / 1024 / 1024, // MB
            heapUtilizationPercent,
            nonHeapUsage.getUsed() / 1024 / 1024, // MB
            totalGcTime,
            totalGcCount,
            gcThroughputPercent,
            threadCount,
            peakThreadCount,
            daemonThreadCount,
            activeVirtualThreads.get(),
            blockedThreads.get(),
            processCpuUsage,
            systemLoadAverage,
            perCoreMetrics,
            numaMetrics,
            runtimeBean.getUptime(),
            classLoadingBean.getLoadedClassCount()
        );
    }

    private double getProcessCpuUsage() {
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
            return sunOsBean.getProcessCpuLoad() * 100;
        }
        return -1; // Unknown
    }

    private double calculateGcThroughput(long totalGcTime) {
        long uptime = runtimeBean.getUptime();
        if (uptime == 0) return 100.0;
        return Math.max(0, (1.0 - (double) totalGcTime / uptime) * 100);
    }

    private Map<String, Double> collectPerCoreMetrics() {
        Map<String, Double> metrics = new HashMap<>();
        
        // Simulate per-core usage metrics (in real implementation, would use JNI or platform-specific APIs)
        for (int i = 0; i < hardwareCores; i++) {
            double usage = Math.random() * 100; // Placeholder
            metrics.put("core_" + i + "_usage", usage);
            perCoreUsage.set(i, (long) usage);
        }
        
        return metrics;
    }

    private Map<String, Double> collectNumaMetrics() {
        Map<String, Double> metrics = new HashMap<>();
        
        // Simulate NUMA memory metrics
        for (int i = 0; i < 2; i++) {
            double memoryUsage = Math.random() * 16384; // MB
            metrics.put("numa_" + i + "_memory", memoryUsage);
            numaNodeMemoryUsage.set(i, (long) memoryUsage);
        }
        
        return metrics;
    }

    private void updateMetricTimeSeries(PerformanceSnapshot snapshot) {
        // Update all metric time series
        metrics.get("tps").addValue(snapshot.timestamp(), snapshot.transactionsPerSecond());
        metrics.get("latency_avg").addValue(snapshot.timestamp(), snapshot.averageLatency());
        metrics.get("latency_p99").addValue(snapshot.timestamp(), snapshot.p99Latency());
        metrics.get("throughput_efficiency").addValue(snapshot.timestamp(), snapshot.throughputEfficiency());
        
        metrics.get("heap_usage").addValue(snapshot.timestamp(), snapshot.heapUtilizationPercent());
        metrics.get("heap_used_mb").addValue(snapshot.timestamp(), snapshot.heapUsedMb());
        metrics.get("heap_committed_mb").addValue(snapshot.timestamp(), snapshot.heapCommittedMb());
        
        metrics.get("gc_pause_time").addValue(snapshot.timestamp(), snapshot.totalGcTime());
        metrics.get("gc_throughput").addValue(snapshot.timestamp(), snapshot.gcThroughputPercent());
        
        metrics.get("cpu_usage").addValue(snapshot.timestamp(), snapshot.processCpuUsage());
        metrics.get("system_load").addValue(snapshot.timestamp(), snapshot.systemLoadAverage());
        
        metrics.get("thread_count").addValue(snapshot.timestamp(), snapshot.threadCount());
        metrics.get("virtual_thread_count").addValue(snapshot.timestamp(), snapshot.virtualThreadCount());
        metrics.get("blocked_thread_count").addValue(snapshot.timestamp(), snapshot.blockedThreadCount());
        
        // Update per-core metrics
        for (Map.Entry<String, Double> entry : snapshot.perCoreMetrics().entrySet()) {
            MetricTimeSeries series = metrics.get(entry.getKey());
            if (series != null) {
                series.addValue(snapshot.timestamp(), entry.getValue());
            }
        }
        
        // Update NUMA metrics
        for (Map.Entry<String, Double> entry : snapshot.numaMetrics().entrySet()) {
            MetricTimeSeries series = metrics.get(entry.getKey());
            if (series != null) {
                series.addValue(snapshot.timestamp(), entry.getValue());
            }
        }
    }

    private void updateAtomicCounters(PerformanceSnapshot snapshot) {
        currentTps.set(snapshot.transactionsPerSecond());
        peakTps.updateAndGet(current -> Math.max(current, snapshot.transactionsPerSecond()));
        avgLatency.set(snapshot.averageLatency());
        p99Latency.set(snapshot.p99Latency());
        throughputEfficiency.set(snapshot.throughputEfficiency());
        
        heapUtilization.set((long) snapshot.heapUtilizationPercent());
        gcPauseTime.set(snapshot.totalGcTime());
        gcThroughput.set((long) snapshot.gcThroughputPercent());
        
        activeVirtualThreads.set(snapshot.virtualThreadCount());
        blockedThreads.set(snapshot.blockedThreadCount());
    }

    private void performanceAnalysis() {
        try {
            PerformanceSnapshot current = currentSnapshot.get();
            PerformanceSnapshot previous = previousSnapshot.get();
            
            if (current == null || previous == null) {
                return; // Not enough data yet
            }
            
            // Add to history window (keep last 60 snapshots = 5 minutes at 5s intervals)
            historyWindow.offer(current);
            while (historyWindow.size() > 60) {
                historyWindow.poll();
            }
            
            // Detect performance regressions
            detectPerformanceRegression(current, previous);
            
            // Calculate performance trends
            calculatePerformanceTrends();
            
            // Update efficiency metrics
            updateEfficiencyMetrics(current);
            
            if (detailedMonitoringEnabled) {
                logDetailedAnalysis(current);
            }
            
        } catch (Exception e) {
            logger.error("Error during performance analysis", e);
        }
    }

    private void detectPerformanceRegression(PerformanceSnapshot current, PerformanceSnapshot previous) {
        boolean hasRegression = false;
        StringBuilder reasons = new StringBuilder();
        
        // Check TPS regression (>20% decrease)
        if (current.transactionsPerSecond() < previous.transactionsPerSecond() * 0.8) {
            hasRegression = true;
            reasons.append("TPS decreased by ")
                .append(String.format("%.1f%%", 
                    (1.0 - (double) current.transactionsPerSecond() / previous.transactionsPerSecond()) * 100))
                .append("; ");
        }
        
        // Check latency regression (>50% increase)
        if (current.averageLatency() > previous.averageLatency() * 1.5) {
            hasRegression = true;
            reasons.append("Latency increased by ")
                .append(String.format("%.1f%%", 
                    ((current.averageLatency() / previous.averageLatency()) - 1.0) * 100))
                .append("; ");
        }
        
        // Check memory pressure (>90% heap usage)
        if (current.heapUtilizationPercent() > 90) {
            hasRegression = true;
            reasons.append("High heap usage: ")
                .append(String.format("%.1f%%", current.heapUtilizationPercent()))
                .append("; ");
        }
        
        // Check GC pressure (>10% time spent in GC)
        if (current.gcThroughputPercent() < 90) {
            hasRegression = true;
            reasons.append("High GC overhead: ")
                .append(String.format("%.1f%% throughput", current.gcThroughputPercent()))
                .append("; ");
        }
        
        regressionDetected.set(hasRegression);
        regressionReason.set(reasons.toString());
        
        if (hasRegression && !regressionDetected.getAndSet(true)) {
            logger.warn("Performance regression detected: {}", reasons.toString());
        }
    }

    private void calculatePerformanceTrends() {
        if (historyWindow.size() < 10) return; // Need at least 10 samples
        
        List<PerformanceSnapshot> history = new ArrayList<>(historyWindow);
        
        // Calculate TPS trend
        double[] tpsValues = history.stream().mapToDouble(PerformanceSnapshot::transactionsPerSecond).toArray();
        double tpsTrend = calculateTrend(tpsValues);
        
        // Calculate latency trend
        double[] latencyValues = history.stream().mapToDouble(PerformanceSnapshot::averageLatency).toArray();
        double latencyTrend = calculateTrend(latencyValues);
        
        // Log trends if significant
        if (Math.abs(tpsTrend) > 0.05) { // 5% trend
            logger.info("TPS trend: {:.1f}% over last {} samples", tpsTrend * 100, history.size());
        }
        
        if (Math.abs(latencyTrend) > 0.05) { // 5% trend
            logger.info("Latency trend: {:.1f}% over last {} samples", latencyTrend * 100, history.size());
        }
    }

    private double calculateTrend(double[] values) {
        if (values.length < 2) return 0.0;
        
        // Simple linear trend calculation
        double firstValue = values[0];
        double lastValue = values[values.length - 1];
        
        return (lastValue - firstValue) / firstValue;
    }

    private void updateEfficiencyMetrics(PerformanceSnapshot current) {
        // Calculate throughput efficiency (actual TPS vs target TPS)
        double efficiency = Math.min(100.0, (double) current.transactionsPerSecond() / targetTps * 100);
        throughputEfficiency.set(efficiency);
        
        // Update hardware utilization efficiency
        double avgCoreUsage = current.perCoreMetrics().values().stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
        
        // Optimal core usage is around 75-85%
        double coreEfficiency = avgCoreUsage > 85 ? 85 / avgCoreUsage * 100 : 
                               avgCoreUsage < 75 ? avgCoreUsage / 75 * 100 : 100;
        
        if (detailedMonitoringEnabled) {
            logger.debug("Efficiency metrics - Throughput: {:.1f}%, Core: {:.1f}%", 
                efficiency, coreEfficiency);
        }
    }

    private void logDetailedAnalysis(PerformanceSnapshot current) {
        logger.debug("Detailed Performance Analysis:");
        logger.debug("  TPS: {} (target: {}, efficiency: {:.1f}%)", 
            current.transactionsPerSecond(), targetTps, throughputEfficiency.get());
        logger.debug("  Latency: avg={:.2f}ms, p99={:.2f}ms", 
            current.averageLatency(), current.p99Latency());
        logger.debug("  Memory: heap={:.1f}% ({} MB used), GC throughput={:.1f}%", 
            current.heapUtilizationPercent(), current.heapUsedMb(), current.gcThroughputPercent());
        logger.debug("  CPU: process={:.1f}%, system load={:.2f}", 
            current.processCpuUsage(), current.systemLoadAverage());
        logger.debug("  Threads: total={}, virtual={}, blocked={}", 
            current.threadCount(), current.virtualThreadCount(), current.blockedThreadCount());
    }

    private void checkAlerts() {
        try {
            PerformanceSnapshot current = currentSnapshot.get();
            if (current == null) return;
            
            // Performance alerts
            if (current.transactionsPerSecond() < targetTps * 0.7) {
                logger.warn("ALERT: TPS significantly below target - current: {}, target: {}", 
                    current.transactionsPerSecond(), targetTps);
            }
            
            if (current.averageLatency() > 100) {
                logger.warn("ALERT: High average latency - {:.2f}ms", current.averageLatency());
            }
            
            if (current.p99Latency() > 500) {
                logger.warn("ALERT: Very high P99 latency - {:.2f}ms", current.p99Latency());
            }
            
            // Memory alerts
            if (current.heapUtilizationPercent() > 90) {
                logger.error("CRITICAL: High heap usage - {:.1f}%", current.heapUtilizationPercent());
            } else if (current.heapUtilizationPercent() > 80) {
                logger.warn("WARNING: Elevated heap usage - {:.1f}%", current.heapUtilizationPercent());
            }
            
            // GC alerts
            if (current.gcThroughputPercent() < 90) {
                logger.warn("ALERT: Low GC throughput - {:.1f}%", current.gcThroughputPercent());
            }
            
            // CPU alerts
            if (current.processCpuUsage() > 95) {
                logger.warn("ALERT: High CPU usage - {:.1f}%", current.processCpuUsage());
            }
            
            // Thread alerts
            if (current.blockedThreadCount() > 100) {
                logger.warn("ALERT: High blocked thread count - {}", current.blockedThreadCount());
            }
            
            // Regression alert
            if (regressionDetected.get()) {
                logger.error("REGRESSION DETECTED: {}", regressionReason.get());
            }
            
        } catch (Exception e) {
            logger.error("Error during alert checking", e);
        }
    }

    /**
     * Get current performance metrics summary
     */
    public Uni<PerformanceMetricsSummary> getCurrentMetrics() {
        return Uni.createFrom().item(() -> {
            PerformanceSnapshot current = currentSnapshot.get();
            if (current == null) {
                return new PerformanceMetricsSummary(0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0, false);
            }
            
            return new PerformanceMetricsSummary(
                current.transactionsPerSecond(),
                current.averageLatency(),
                current.p99Latency(),
                throughputEfficiency.get(),
                current.heapUtilizationPercent(),
                current.gcThroughputPercent(),
                current.threadCount(),
                current.virtualThreadCount(),
                regressionDetected.get()
            );
        });
    }

    /**
     * Get detailed metric time series data
     */
    public Uni<Map<String, List<MetricDataPoint>>> getMetricTimeSeries(Duration timeRange) {
        return Uni.createFrom().item(() -> {
            Instant cutoff = Instant.now().minus(timeRange);
            
            Map<String, List<MetricDataPoint>> result = new HashMap<>();
            
            for (Map.Entry<String, MetricTimeSeries> entry : metrics.entrySet()) {
                String metricName = entry.getKey();
                MetricTimeSeries series = entry.getValue();
                
                List<MetricDataPoint> dataPoints = series.getDataPoints(cutoff);
                result.put(metricName, dataPoints);
            }
            
            return result;
        });
    }

    /**
     * Get performance recommendations based on current metrics
     */
    public Uni<List<PerformanceRecommendation>> getPerformanceRecommendations() {
        return Uni.createFrom().item(() -> {
            List<PerformanceRecommendation> recommendations = new ArrayList<>();
            PerformanceSnapshot current = currentSnapshot.get();
            
            if (current == null) {
                return recommendations;
            }
            
            // TPS recommendations
            if (current.transactionsPerSecond() < targetTps * 0.8) {
                recommendations.add(new PerformanceRecommendation(
                    "THROUGHPUT",
                    "Increase batch size and parallelism",
                    "Current TPS is " + (100 - current.transactionsPerSecond() * 100 / targetTps) + "% below target",
                    RecommendationPriority.HIGH
                ));
            }
            
            // Memory recommendations
            if (current.heapUtilizationPercent() > 80) {
                recommendations.add(new PerformanceRecommendation(
                    "MEMORY",
                    "Consider increasing heap size or optimizing object allocation",
                    "Heap usage at " + String.format("%.1f%%", current.heapUtilizationPercent()),
                    current.heapUtilizationPercent() > 90 ? RecommendationPriority.CRITICAL : RecommendationPriority.HIGH
                ));
            }
            
            // GC recommendations
            if (current.gcThroughputPercent() < 95) {
                recommendations.add(new PerformanceRecommendation(
                    "GC",
                    "Tune GC parameters for better throughput",
                    "GC throughput at " + String.format("%.1f%%", current.gcThroughputPercent()),
                    RecommendationPriority.MEDIUM
                ));
            }
            
            // Thread recommendations
            if (current.blockedThreadCount() > current.threadCount() * 0.1) {
                recommendations.add(new PerformanceRecommendation(
                    "THREADS",
                    "Investigate thread contention and optimize synchronization",
                    current.blockedThreadCount() + " blocked threads detected",
                    RecommendationPriority.MEDIUM
                ));
            }
            
            return recommendations;
        });
    }

    @PreDestroy
    public void shutdown() {
        logger.info("Shutting down Sprint 5 Performance Monitor");
        
        if (metricsCollectionTask != null) {
            metricsCollectionTask.cancel(false);
        }
        
        if (performanceAnalysisTask != null) {
            performanceAnalysisTask.cancel(false);
        }
        
        if (alertingTask != null) {
            alertingTask.cancel(false);
        }
        
        monitoringScheduler.shutdown();
        
        try {
            if (!monitoringScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                monitoringScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            monitoringScheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        
        logger.info("Performance Monitor shutdown completed");
    }

    // Data classes and records
    public record PerformanceSnapshot(
        Instant timestamp,
        long transactionsPerSecond,
        double averageLatency,
        double p99Latency,
        double throughputEfficiency,
        long heapUsedMb,
        long heapCommittedMb,
        long heapMaxMb,
        double heapUtilizationPercent,
        long nonHeapUsedMb,
        long totalGcTime,
        long totalGcCount,
        double gcThroughputPercent,
        int threadCount,
        int peakThreadCount,
        int daemonThreadCount,
        int virtualThreadCount,
        int blockedThreadCount,
        double processCpuUsage,
        double systemLoadAverage,
        Map<String, Double> perCoreMetrics,
        Map<String, Double> numaMetrics,
        long uptimeMs,
        int loadedClassCount
    ) {}

    public record PerformanceMetricsSummary(
        long currentTps,
        double avgLatency,
        double p99Latency,
        double throughputEfficiency,
        double heapUtilization,
        double gcThroughput,
        int threadCount,
        int virtualThreadCount,
        boolean regressionDetected
    ) {}

    public record MetricDataPoint(Instant timestamp, double value) {}

    public record PerformanceRecommendation(
        String category,
        String recommendation,
        String reason,
        RecommendationPriority priority
    ) {}

    public enum RecommendationPriority {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    private static class MetricTimeSeries {
        private final String name;
        private final String description;
        private final Queue<MetricDataPoint> dataPoints;
        private final int maxSize;

        public MetricTimeSeries(String name, String description, int maxSize) {
            this.name = name;
            this.description = description;
            this.maxSize = maxSize;
            this.dataPoints = new ConcurrentLinkedQueue<>();
        }

        public void addValue(Instant timestamp, double value) {
            dataPoints.offer(new MetricDataPoint(timestamp, value));
            
            // Remove old data points
            while (dataPoints.size() > maxSize) {
                dataPoints.poll();
            }
        }

        public List<MetricDataPoint> getDataPoints(Instant since) {
            return dataPoints.stream()
                .filter(dp -> dp.timestamp().isAfter(since))
                .collect(Collectors.toList());
        }

        public String getName() { return name; }
        public String getDescription() { return description; }
    }
}