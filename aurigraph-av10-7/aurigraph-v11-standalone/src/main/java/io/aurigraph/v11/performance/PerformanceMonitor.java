package io.aurigraph.v11.performance;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;

import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

/**
 * Real-time performance monitoring and metrics collection
 * Provides detailed insights into 2M+ TPS performance characteristics
 */
@ApplicationScoped
public class PerformanceMonitor {
    
    private static final Logger LOG = Logger.getLogger(PerformanceMonitor.class);
    
    @Inject
    MeterRegistry meterRegistry;
    
    @Inject
    AdvancedPerformanceService performanceService;
    
    // Monitoring configuration
    private static final int MONITORING_INTERVAL_SECONDS = 1;
    private static final int HISTORY_SIZE = 300; // 5 minutes at 1-second intervals
    
    // Monitoring infrastructure
    private final ScheduledExecutorService monitoringExecutor = 
        Executors.newScheduledThreadPool(2);
    private volatile boolean monitoring = false;
    
    // Metrics storage
    private final List<PerformanceSnapshot> performanceHistory = 
        new ArrayList<>(HISTORY_SIZE);
    private final AtomicLong lastSnapshotTime = new AtomicLong(0);
    
    // Micrometer metrics
    private Gauge currentTPSGauge;
    private Gauge peakTPSGauge;
    private Counter totalTransactionsCounter;
    private Timer transactionLatencyTimer;
    private Gauge memoryUsageGauge;
    private Gauge queueUtilizationGauge;
    
    // Performance thresholds
    private static final long TARGET_TPS = 2_000_000L;
    private static final long WARNING_TPS = 1_000_000L;
    private static final double MAX_MEMORY_UTILIZATION = 0.8;
    private static final double MAX_QUEUE_UTILIZATION = 0.7;
    
    /**
     * Start performance monitoring
     */
    public void startMonitoring() {
        if (monitoring) {
            LOG.warn("Performance monitoring already running");
            return;
        }
        
        LOG.info("Starting advanced performance monitoring");
        monitoring = true;
        
        // Register Micrometer metrics
        registerMetrics();
        
        // Start periodic monitoring
        monitoringExecutor.scheduleAtFixedRate(
            this::collectPerformanceMetrics,
            0, MONITORING_INTERVAL_SECONDS, TimeUnit.SECONDS
        );
        
        // Start alerting monitor
        monitoringExecutor.scheduleAtFixedRate(
            this::checkPerformanceAlerts,
            30, 30, TimeUnit.SECONDS // Check every 30 seconds
        );
        
        LOG.info("Performance monitoring started successfully");
    }
    
    /**
     * Stop performance monitoring
     */
    public void stopMonitoring() {
        if (!monitoring) {
            return;
        }
        
        LOG.info("Stopping performance monitoring");
        monitoring = false;
        
        monitoringExecutor.shutdown();
        try {
            if (!monitoringExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                monitoringExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            monitoringExecutor.shutdownNow();
        }
        
        LOG.info("Performance monitoring stopped");
    }
    
    /**
     * Register Micrometer metrics
     */
    private void registerMetrics() {
        currentTPSGauge = Gauge.builder("aurigraph.performance.current_tps")
            .description("Current transactions per second")
            .register(meterRegistry, this, PerformanceMonitor::getCurrentTPS);
        
        peakTPSGauge = Gauge.builder("aurigraph.performance.peak_tps")
            .description("Peak transactions per second achieved")
            .register(meterRegistry, this, PerformanceMonitor::getPeakTPS);
        
        totalTransactionsCounter = Counter.builder("aurigraph.performance.total_transactions")
            .description("Total transactions processed")
            .register(meterRegistry);
        
        transactionLatencyTimer = Timer.builder("aurigraph.performance.transaction_latency")
            .description("Transaction processing latency")
            .register(meterRegistry);
        
        memoryUsageGauge = Gauge.builder("aurigraph.performance.memory_usage")
            .description("Current memory usage percentage")
            .register(meterRegistry, this, PerformanceMonitor::getMemoryUsage);
        
        queueUtilizationGauge = Gauge.builder("aurigraph.performance.queue_utilization")
            .description("Transaction queue utilization")
            .register(meterRegistry, this, PerformanceMonitor::getQueueUtilization);
    }
    
    /**
     * Collect performance metrics periodically
     */
    private void collectPerformanceMetrics() {
        try {
            long currentTime = System.currentTimeMillis();
            
            AdvancedPerformanceService.PerformanceSnapshot snapshot = 
                performanceService.getCurrentMetrics();
            
            if (snapshot != null) {
                // Store in history
                synchronized (performanceHistory) {
                    performanceHistory.add(new PerformanceSnapshot(
                        currentTime,
                        snapshot.currentTPS(),
                        snapshot.peakTPS(),
                        snapshot.totalTransactions(),
                        snapshot.processedTransactions(),
                        snapshot.memoryUsage(),
                        calculateLatency(),
                        calculateQueueUtilization()
                    ));
                    
                    // Maintain history size
                    while (performanceHistory.size() > HISTORY_SIZE) {
                        performanceHistory.remove(0);
                    }
                }
                
                // Update counters
                updateCounters(snapshot);
                
                lastSnapshotTime.set(currentTime);
                
                // Log significant performance milestones
                logPerformanceMilestones(snapshot);
            }
            
        } catch (Exception e) {
            LOG.error("Error collecting performance metrics: " + e.getMessage());
        }
    }
    
    /**
     * Update metric counters
     */
    private void updateCounters(AdvancedPerformanceService.PerformanceSnapshot snapshot) {
        // Update transaction counter (increment by difference)
        static long lastTotalTransactions = 0;
        long currentTotal = snapshot.totalTransactions();
        if (currentTotal > lastTotalTransactions) {
            totalTransactionsCounter.increment(currentTotal - lastTotalTransactions);
            lastTotalTransactions = currentTotal;
        }
        
        // Record latency sample
        if (snapshot.latency() != null) {
            transactionLatencyTimer.record(snapshot.latency().avgNanos(), TimeUnit.NANOSECONDS);
        }
    }
    
    /**
     * Check for performance alerts
     */
    private void checkPerformanceAlerts() {
        try {
            AdvancedPerformanceService.PerformanceSnapshot current = 
                performanceService.getCurrentMetrics();
            
            if (current == null) {
                LOG.warn("ALERT: Performance service not responding");
                return;
            }
            
            // TPS alerts
            if (current.currentTPS() < WARNING_TPS) {
                LOG.warn("ALERT: Performance below warning threshold - Current: " + 
                    formatNumber(current.currentTPS()) + " TPS, Target: " + 
                    formatNumber(TARGET_TPS) + " TPS");
            }
            
            // Memory alerts
            double memoryUtilization = getMemoryUsage();
            if (memoryUtilization > MAX_MEMORY_UTILIZATION) {
                LOG.warn("ALERT: High memory utilization - " + 
                    String.format("%.1f%%", memoryUtilization * 100));
            }
            
            // Queue alerts
            double queueUtilization = getQueueUtilization();
            if (queueUtilization > MAX_QUEUE_UTILIZATION) {
                LOG.warn("ALERT: High queue utilization - " + 
                    String.format("%.1f%%", queueUtilization * 100));
            }
            
            // Success rate alerts
            long total = current.totalTransactions();
            long processed = current.processedTransactions();
            if (total > 0 && processed > 0) {
                double successRate = (double) processed / total;
                if (successRate < 0.95) {
                    LOG.warn("ALERT: Low success rate - " + 
                        String.format("%.2f%%", successRate * 100));
                }
            }
            
        } catch (Exception e) {
            LOG.error("Error checking performance alerts: " + e.getMessage());
        }
    }
    
    /**
     * Log significant performance milestones
     */
    private void logPerformanceMilestones(AdvancedPerformanceService.PerformanceSnapshot snapshot) {
        long currentTPS = snapshot.currentTPS();
        
        if (currentTPS >= TARGET_TPS && snapshot.peakTPS() >= TARGET_TPS) {
            LOG.info("🎉 MILESTONE: Achieved target performance of " + 
                formatNumber(TARGET_TPS) + "+ TPS! Current: " + 
                formatNumber(currentTPS) + " TPS");
        } else if (currentTPS >= 1_500_000) {
            LOG.info("⚡ HIGH PERFORMANCE: " + formatNumber(currentTPS) + " TPS achieved");
        } else if (currentTPS >= 1_000_000) {
            LOG.info("🚀 Exceeded 1M TPS: " + formatNumber(currentTPS) + " TPS");
        }
    }
    
    /**
     * Get current performance dashboard
     */
    public PerformanceDashboard getDashboard() {
        synchronized (performanceHistory) {
            List<PerformanceSnapshot> recentHistory = new ArrayList<>(performanceHistory);
            
            return new PerformanceDashboard(
                recentHistory,
                calculateAverageMetrics(),
                getSystemHealth(),
                getPredictedPerformance()
            );
        }
    }
    
    /**
     * Calculate average metrics over recent history
     */
    private AverageMetrics calculateAverageMetrics() {
        synchronized (performanceHistory) {
            if (performanceHistory.isEmpty()) {
                return new AverageMetrics(0, 0, 0, 0, 0);
            }
            
            long totalTPS = 0;
            long totalMemory = 0;
            double totalLatency = 0;
            double totalQueueUtil = 0;
            int count = performanceHistory.size();
            
            for (PerformanceSnapshot snapshot : performanceHistory) {
                totalTPS += snapshot.currentTPS();
                totalMemory += snapshot.memoryUsage();
                totalLatency += snapshot.latencyMs();
                totalQueueUtil += snapshot.queueUtilization();
            }
            
            return new AverageMetrics(
                totalTPS / count,
                totalMemory / count,
                totalLatency / count,
                totalQueueUtil / count,
                count
            );
        }
    }
    
    /**
     * Get system health status
     */
    private SystemHealth getSystemHealth() {
        AdvancedPerformanceService.PerformanceSnapshot current = 
            performanceService.getCurrentMetrics();
        
        if (current == null) {
            return new SystemHealth("CRITICAL", "Service not responding", 0);
        }
        
        // Calculate health score (0-100)
        int healthScore = 100;
        
        // TPS health (40% weight)
        double tpsRatio = (double) current.currentTPS() / TARGET_TPS;
        int tpsScore = (int) Math.min(100, tpsRatio * 100);
        healthScore = (int) (healthScore * 0.6 + tpsScore * 0.4);
        
        // Memory health (20% weight)
        double memUsage = getMemoryUsage();
        int memScore = (int) Math.max(0, 100 - (memUsage * 100));
        healthScore = (int) (healthScore * 0.8 + memScore * 0.2);
        
        // Success rate health (20% weight)
        long total = current.totalTransactions();
        long processed = current.processedTransactions();
        double successRate = total > 0 ? (double) processed / total : 1.0;
        int successScore = (int) (successRate * 100);
        healthScore = (int) (healthScore * 0.8 + successScore * 0.2);
        
        // Queue health (20% weight)
        double queueUtil = getQueueUtilization();
        int queueScore = (int) Math.max(0, 100 - (queueUtil * 100));
        healthScore = (int) (healthScore * 0.8 + queueScore * 0.2);
        
        String status;
        String message;
        
        if (healthScore >= 90) {
            status = "EXCELLENT";
            message = "System performing at optimal levels";
        } else if (healthScore >= 75) {
            status = "GOOD";
            message = "System performing well";
        } else if (healthScore >= 50) {
            status = "DEGRADED";
            message = "System performance below optimal";
        } else if (healthScore >= 25) {
            status = "WARNING";
            message = "System performance significantly degraded";
        } else {
            status = "CRITICAL";
            message = "System performance critically low";
        }
        
        return new SystemHealth(status, message, healthScore);
    }
    
    /**
     * Predict future performance based on trends
     */
    private PredictedPerformance getPredictedPerformance() {
        synchronized (performanceHistory) {
            if (performanceHistory.size() < 10) {
                return new PredictedPerformance(0, 0, "Insufficient data");
            }
            
            // Simple linear regression for TPS trend
            List<PerformanceSnapshot> recent = performanceHistory.subList(
                Math.max(0, performanceHistory.size() - 60), performanceHistory.size());
            
            long sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            int n = recent.size();
            
            for (int i = 0; i < n; i++) {
                long x = i;
                long y = recent.get(i).currentTPS();
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumXX += x * x;
            }
            
            double slope = (n * sumXY - sumX * sumY) / (double) (n * sumXX - sumX * sumX);
            double intercept = (sumY - slope * sumX) / (double) n;
            
            // Predict TPS in 60 seconds
            long predictedTPS = (long) (intercept + slope * (n + 60));
            
            String trend;
            if (Math.abs(slope) < 1000) {
                trend = "STABLE";
            } else if (slope > 0) {
                trend = "INCREASING";
            } else {
                trend = "DECREASING";
            }
            
            return new PredictedPerformance(predictedTPS, slope, trend);
        }
    }
    
    // Helper methods for Micrometer gauges
    private double getCurrentTPS() {
        AdvancedPerformanceService.PerformanceSnapshot snapshot = 
            performanceService.getCurrentMetrics();
        return snapshot != null ? snapshot.currentTPS() : 0;
    }
    
    private double getPeakTPS() {
        AdvancedPerformanceService.PerformanceSnapshot snapshot = 
            performanceService.getCurrentMetrics();
        return snapshot != null ? snapshot.peakTPS() : 0;
    }
    
    private double getMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        return (double) usedMemory / maxMemory;
    }
    
    private double getQueueUtilization() {
        // Simplified queue utilization calculation
        // In production, this would query actual queue metrics
        return Math.random() * 0.5; // Simulated 0-50% utilization
    }
    
    private double calculateLatency() {
        // Simplified latency calculation
        // In production, this would use actual latency measurements
        return 1.0; // 1ms average latency
    }
    
    private String formatNumber(long number) {
        if (number >= 1_000_000) {
            return String.format("%.1fM", number / 1_000_000.0);
        } else if (number >= 1_000) {
            return String.format("%.1fK", number / 1_000.0);
        } else {
            return String.valueOf(number);
        }
    }
    
    // Data classes
    public record PerformanceSnapshot(
        long timestamp,
        long currentTPS,
        long peakTPS,
        long totalTransactions,
        long processedTransactions,
        long memoryUsage,
        double latencyMs,
        double queueUtilization
    ) {}
    
    public record PerformanceDashboard(
        List<PerformanceSnapshot> history,
        AverageMetrics averages,
        SystemHealth health,
        PredictedPerformance prediction
    ) {}
    
    public record AverageMetrics(
        long avgTPS,
        long avgMemoryUsage,
        double avgLatencyMs,
        double avgQueueUtilization,
        int sampleCount
    ) {}
    
    public record SystemHealth(
        String status,
        String message,
        int healthScore
    ) {}
    
    public record PredictedPerformance(
        long predictedTPSIn60s,
        double tpsSlope,
        String trend
    ) {}
}