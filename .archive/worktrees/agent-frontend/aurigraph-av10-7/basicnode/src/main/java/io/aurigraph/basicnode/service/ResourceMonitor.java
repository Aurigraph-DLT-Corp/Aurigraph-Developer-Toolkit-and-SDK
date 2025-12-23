package io.aurigraph.basicnode.service;

import io.aurigraph.basicnode.model.ResourceMetrics;

import jakarta.enterprise.context.ApplicationScoped;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * Resource Monitor - Tracks memory, CPU, and performance metrics
 */
@ApplicationScoped
public class ResourceMonitor {
    
    private static final Logger logger = Logger.getLogger(ResourceMonitor.class.getName());
    
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    
    private ResourceMetrics currentMetrics;
    private ScheduledExecutorService scheduler;
    private boolean monitoring = false;
    
    public void startMonitoring() {
        if (monitoring) return;
        
        this.currentMetrics = new ResourceMetrics();
        this.scheduler = Executors.newScheduledThreadPool(1);
        
        // Update metrics every 5 seconds
        scheduler.scheduleAtFixedRate(this::updateMetrics, 0, 5, TimeUnit.SECONDS);
        
        this.monitoring = true;
        logger.info("📊 Resource monitoring started");
    }
    
    private void updateMetrics() {
        try {
            // Memory metrics
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
            long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
            double memoryUsageMB = usedMemory / (1024.0 * 1024.0);
            double memoryPercentage = (double) usedMemory / maxMemory * 100;
            
            // CPU metrics
            double cpuUsage = osBean.getProcessCpuLoad() * 100;
            if (cpuUsage < 0) cpuUsage = 0; // Handle unavailable metric
            
            // System load
            double systemLoad = osBean.getSystemLoadAverage();
            
            // Update current metrics
            currentMetrics.setMemoryUsageMB(memoryUsageMB);
            currentMetrics.setMemoryPercentage(memoryPercentage);
            currentMetrics.setCpuUsagePercent(cpuUsage);
            currentMetrics.setSystemLoad(systemLoad);
            currentMetrics.setLastUpdated(System.currentTimeMillis());
            
            // Log warnings if limits exceeded
            if (memoryUsageMB > 512) {
                logger.warning("⚠️ Memory usage exceeds 512MB limit: " + String.format("%.1f", memoryUsageMB) + "MB");
            }
            
            if (cpuUsage > 200) { // 2 cores = 200%
                logger.warning("⚠️ CPU usage exceeds 2 core limit: " + String.format("%.1f", cpuUsage) + "%");
            }
            
            // Optimize resources if needed
            if (memoryUsageMB > 400 || cpuUsage > 150) {
                optimizeResources();
            }
            
        } catch (Exception e) {
            logger.severe("❌ Error updating metrics: " + e.getMessage());
        }
    }
    
    private void optimizeResources() {
        try {
            // Trigger garbage collection if memory is high
            if (currentMetrics.getMemoryUsageMB() > 400) {
                System.gc();
                logger.info("🧹 Triggered garbage collection for memory optimization");
            }
            
            // Log optimization actions
            logger.info("⚡ Resource optimization triggered");
            
        } catch (Exception e) {
            logger.warning("❌ Resource optimization failed: " + e.getMessage());
        }
    }
    
    public ResourceMetrics getCurrentMetrics() {
        if (currentMetrics == null) {
            // Return empty metrics if monitoring not started
            return new ResourceMetrics();
        }
        return currentMetrics;
    }
    
    public boolean isWithinLimits() {
        if (currentMetrics == null) return true;
        
        return currentMetrics.getMemoryUsageMB() <= 512 && 
               currentMetrics.getCpuUsagePercent() <= 200;
    }
    
    public String getPerformanceReport() {
        if (currentMetrics == null) return "Monitoring not started";
        
        return String.format(
            "Memory: %.1fMB (%.1f%%), CPU: %.1f%%, System Load: %.2f",
            currentMetrics.getMemoryUsageMB(),
            currentMetrics.getMemoryPercentage(),
            currentMetrics.getCpuUsagePercent(),
            currentMetrics.getSystemLoad()
        );
    }
    
    public void stopMonitoring() {
        if (scheduler != null) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(2, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
            }
        }
        
        monitoring = false;
        logger.info("📊 Resource monitoring stopped");
    }
}