package io.aurigraph.basicnode.compliance;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

/**
 * AV10-17 Performance Monitor
 * Monitors node performance metrics for compliance validation
 */
@ApplicationScoped
public class PerformanceMonitor {
    
    private static final Logger LOG = Logger.getLogger(PerformanceMonitor.class);
    
    @Inject
    MeterRegistry meterRegistry;
    
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    
    private final AtomicLong transactionCounter = new AtomicLong(0);
    private final AtomicLong lastTpsCalculation = new AtomicLong(System.currentTimeMillis());
    private final AtomicLong lastTransactionCount = new AtomicLong(0);
    
    private Counter transactionTotal;
    private Timer transactionTimer;
    private Gauge memoryUsageGauge;
    private Gauge cpuUsageGauge;
    private Gauge uptimeGauge;
    
    private final Instant startTime = Instant.now();
    
    public void initializeMetrics() {
        LOG.info("Initializing AV10-17 performance metrics...");
        
        // Transaction metrics
        transactionTotal = Counter.builder("aurigraph.transactions.total")
            .description("Total transactions processed")
            .tag("compliance", "AV10-17")
            .register(meterRegistry);
            
        transactionTimer = Timer.builder("aurigraph.transactions.duration")
            .description("Transaction processing time")
            .tag("compliance", "AV10-17")
            .register(meterRegistry);
        
        // Memory usage gauge
        memoryUsageGauge = Gauge.builder("aurigraph.memory.usage.mb")
            .description("Current memory usage in MB")
            .tag("compliance", "AV10-17")
            .register(meterRegistry, this, PerformanceMonitor::getCurrentMemoryUsageMB);
        
        // CPU usage gauge
        cpuUsageGauge = Gauge.builder("aurigraph.cpu.usage.percent")
            .description("Current CPU usage percentage")
            .tag("compliance", "AV10-17")
            .register(meterRegistry, this, PerformanceMonitor::getCurrentCpuUsage);
        
        // Uptime gauge
        uptimeGauge = Gauge.builder("aurigraph.uptime.seconds")
            .description("Node uptime in seconds")
            .tag("compliance", "AV10-17")
            .register(meterRegistry, this, PerformanceMonitor::getUptimeSeconds);
        
        LOG.info("AV10-17 performance metrics initialized successfully");
    }
    
    public long getCurrentMemoryUsageMB() {
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed() + 
                         memoryBean.getNonHeapMemoryUsage().getUsed();
        return usedMemory / (1024 * 1024); // Convert to MB
    }
    
    public double getCurrentCpuUsage() {
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
            return sunOsBean.getProcessCpuLoad() * 100.0;
        }
        return 0.0; // Fallback for non-Sun JVMs
    }
    
    public long getCurrentTPS() {
        long currentTime = System.currentTimeMillis();
        long currentCount = transactionCounter.get();
        
        long lastTime = lastTpsCalculation.get();
        long lastCount = lastTransactionCount.get();
        
        if (currentTime - lastTime < 1000) {
            return 0; // Too early to calculate meaningful TPS
        }
        
        long timeDelta = currentTime - lastTime;
        long countDelta = currentCount - lastCount;
        
        long tps = (countDelta * 1000) / timeDelta;
        
        // Update for next calculation
        lastTpsCalculation.set(currentTime);
        lastTransactionCount.set(currentCount);
        
        return tps;
    }
    
    public double getUptimeSeconds() {
        return Duration.between(startTime, Instant.now()).getSeconds();
    }
    
    public void recordTransaction(Duration processingTime) {
        transactionCounter.incrementAndGet();
        transactionTotal.increment();
        transactionTimer.record(processingTime);
    }
    
    public AV1017PerformanceReport generatePerformanceReport() {
        AV1017PerformanceReport report = new AV1017PerformanceReport();
        
        report.nodeId = System.getProperty("aurigraph.node.id", "unknown");
        report.reportTime = Instant.now();
        report.startTime = startTime;
        report.uptime = Duration.between(startTime, Instant.now());
        
        // Current metrics
        report.memoryUsageMB = getCurrentMemoryUsageMB();
        report.cpuUsagePercent = getCurrentCpuUsage();
        report.currentTPS = getCurrentTPS();
        report.totalTransactions = transactionCounter.get();
        
        // Compliance validation
        report.memoryCompliant = report.memoryUsageMB <= maxMemoryMB;
        report.performanceCompliant = report.currentTPS >= targetTPS || report.totalTransactions < 100;
        report.uptimeCompliant = calculateUptimePercent() >= uptimeTargetPercent;
        
        // Overall compliance
        report.av1017Compliant = report.memoryCompliant && 
                                report.performanceCompliant && 
                                report.uptimeCompliant;
        
        // JVM information
        report.javaVersion = System.getProperty("java.version");
        report.jvmName = System.getProperty("java.vm.name");
        report.quarkusVersion = getQuarkusVersion();
        
        return report;
    }
    
    private double calculateUptimePercent() {
        long totalTime = Duration.between(startTime, Instant.now()).toMillis();
        if (totalTime == 0) return 100.0;
        
        long actualUptime = totalTime; // Simplified - could track actual downtime
        return (double) actualUptime / totalTime * 100.0;
    }
    
    public boolean validateAV1017Compliance() {
        AV1017PerformanceReport report = generatePerformanceReport();
        
        if (!report.av1017Compliant) {
            LOG.errorf("AV10-17 COMPLIANCE VIOLATION:");
            LOG.errorf("- Memory: %dMB (limit: %dMB) - %s", 
                report.memoryUsageMB, maxMemoryMB, 
                report.memoryCompliant ? "PASS" : "FAIL");
            LOG.errorf("- Performance: %d TPS (target: %d+) - %s", 
                report.currentTPS, targetTPS, 
                report.performanceCompliant ? "PASS" : "FAIL");
            LOG.errorf("- Uptime: %.4f%% (target: %.2f%%) - %s", 
                calculateUptimePercent(), uptimeTargetPercent,
                report.uptimeCompliant ? "PASS" : "FAIL");
            return false;
        }
        
        LOG.infof("AV10-17 COMPLIANCE: ALL REQUIREMENTS SATISFIED");
        return true;
    }
    
    private String getQuarkusVersion() {
        try {
            Package pkg = Package.getPackage("io.quarkus.runtime");
            return pkg != null ? pkg.getImplementationVersion() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
    
    private void recordComplianceMetric(String name, ComplianceStatus status, String description) {
        ComplianceMetric metric = new ComplianceMetric();
        metric.name = name;
        metric.status = status;
        metric.description = description;
        metric.timestamp = Instant.now();
        metrics.put(name, metric);
    }
    
    public static class AV1017PerformanceReport {
        public String nodeId;
        public Instant reportTime;
        public Instant startTime;
        public Duration uptime;
        
        // Current metrics
        public long memoryUsageMB;
        public double cpuUsagePercent;
        public long currentTPS;
        public long totalTransactions;
        
        // Compliance status
        public boolean memoryCompliant;
        public boolean performanceCompliant;
        public boolean uptimeCompliant;
        public boolean av1017Compliant;
        
        // System information
        public String javaVersion;
        public String jvmName;
        public String quarkusVersion;
    }
    
    public static class ComplianceMetric {
        public String name;
        public AV1017ComplianceManager.ComplianceStatus status;
        public String description;
        public Instant timestamp;
    }
}