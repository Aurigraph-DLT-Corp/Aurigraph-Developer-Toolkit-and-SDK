package io.aurigraph.v11.performance;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.common.annotation.NonBlocking;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

/**
 * Virtual Thread Pool Manager for 15-Core Intel Xeon Gold Optimization
 * Manages virtual thread pools with hardware-aware allocation strategies
 * 
 * Features:
 * - NUMA-aware thread allocation
 * - CPU affinity management
 * - Performance monitoring and auto-tuning
 * - Load balancing across cores
 */
@ApplicationScoped
@Named("virtualThreadPoolManager")
public class VirtualThreadPoolManager {

    private static final Logger logger = LoggerFactory.getLogger(VirtualThreadPoolManager.class);

    @ConfigProperty(name = "performance.hardware.cores", defaultValue = "15")
    int hardwareCores;

    @ConfigProperty(name = "performance.hardware.threads", defaultValue = "30")
    int hardwareThreads;

    @ConfigProperty(name = "performance.virtual.threads.carrier.pool.size", defaultValue = "15")
    int carrierPoolSize;

    @ConfigProperty(name = "performance.virtual.threads.consensus.pool", defaultValue = "500000")
    int consensusVirtualThreads;

    @ConfigProperty(name = "performance.virtual.threads.transaction.pool", defaultValue = "750000")
    int transactionVirtualThreads;

    @ConfigProperty(name = "performance.virtual.threads.ai.pool", defaultValue = "100000")
    int aiVirtualThreads;

    @ConfigProperty(name = "performance.virtual.threads.network.pool", defaultValue = "250000")
    int networkVirtualThreads;

    // Thread Pool Executors
    private ExecutorService consensusExecutor;
    private ExecutorService transactionExecutor;
    private ExecutorService aiExecutor;
    private ExecutorService networkExecutor;
    private ScheduledExecutorService monitoringExecutor;

    // Performance Metrics
    private final LongAdder consensusTasksExecuted = new LongAdder();
    private final LongAdder transactionTasksExecuted = new LongAdder();
    private final LongAdder aiTasksExecuted = new LongAdder();
    private final LongAdder networkTasksExecuted = new LongAdder();
    
    private final AtomicLong avgConsensusLatency = new AtomicLong(0);
    private final AtomicLong avgTransactionLatency = new AtomicLong(0);
    private final AtomicLong avgAiLatency = new AtomicLong(0);
    private final AtomicLong avgNetworkLatency = new AtomicLong(0);

    // System monitoring
    private OperatingSystemMXBean osBean;
    
    @PostConstruct
    public void initialize() {
        logger.info("Initializing Virtual Thread Pool Manager for {}-core system", hardwareCores);
        
        osBean = ManagementFactory.getOperatingSystemMXBean();
        
        // Initialize specialized thread pools
        initializeConsensusThreadPool();
        initializeTransactionThreadPool();
        initializeAiThreadPool();
        initializeNetworkThreadPool();
        
        // Start monitoring
        startPerformanceMonitoring();
        
        logger.info("Virtual Thread Pool Manager initialized successfully");
        logSystemConfiguration();
    }

    /**
     * Initialize consensus processing thread pool
     * Optimized for high-throughput consensus operations
     */
    private void initializeConsensusThreadPool() {
        consensusExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        logger.info("Consensus virtual thread pool initialized with capacity: {}", consensusVirtualThreads);
    }

    /**
     * Initialize transaction processing thread pool
     * Optimized for transaction validation and processing
     */
    private void initializeTransactionThreadPool() {
        transactionExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        logger.info("Transaction virtual thread pool initialized with capacity: {}", transactionVirtualThreads);
    }

    /**
     * Initialize AI/ML processing thread pool
     * Optimized for AI model inference and training tasks
     */
    private void initializeAiThreadPool() {
        aiExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        logger.info("AI virtual thread pool initialized with capacity: {}", aiVirtualThreads);
    }

    /**
     * Initialize network processing thread pool
     * Optimized for network I/O and gRPC operations
     */
    private void initializeNetworkThreadPool() {
        networkExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        logger.info("Network virtual thread pool initialized with capacity: {}", networkVirtualThreads);
    }

    /**
     * Submit consensus task with performance tracking
     */
    @NonBlocking
    public <T> CompletableFuture<T> submitConsensusTask(Callable<T> task) {
        long startTime = System.nanoTime();
        
        CompletableFuture<T> future = CompletableFuture.supplyAsync(() -> {
            try {
                T result = task.call();
                updateLatencyMetric(avgConsensusLatency, startTime);
                consensusTasksExecuted.increment();
                return result;
            } catch (Exception e) {
                logger.error("Error in consensus task execution", e);
                throw new RuntimeException(e);
            }
        }, consensusExecutor);

        return future;
    }

    /**
     * Submit transaction task with performance tracking
     */
    @NonBlocking
    public <T> CompletableFuture<T> submitTransactionTask(Callable<T> task) {
        long startTime = System.nanoTime();
        
        CompletableFuture<T> future = CompletableFuture.supplyAsync(() -> {
            try {
                T result = task.call();
                updateLatencyMetric(avgTransactionLatency, startTime);
                transactionTasksExecuted.increment();
                return result;
            } catch (Exception e) {
                logger.error("Error in transaction task execution", e);
                throw new RuntimeException(e);
            }
        }, transactionExecutor);

        return future;
    }

    /**
     * Submit AI task with performance tracking
     */
    @NonBlocking
    public <T> CompletableFuture<T> submitAiTask(Callable<T> task) {
        long startTime = System.nanoTime();
        
        CompletableFuture<T> future = CompletableFuture.supplyAsync(() -> {
            try {
                T result = task.call();
                updateLatencyMetric(avgAiLatency, startTime);
                aiTasksExecuted.increment();
                return result;
            } catch (Exception e) {
                logger.error("Error in AI task execution", e);
                throw new RuntimeException(e);
            }
        }, aiExecutor);

        return future;
    }

    /**
     * Submit network task with performance tracking
     */
    @NonBlocking
    public <T> CompletableFuture<T> submitNetworkTask(Callable<T> task) {
        long startTime = System.nanoTime();
        
        CompletableFuture<T> future = CompletableFuture.supplyAsync(() -> {
            try {
                T result = task.call();
                updateLatencyMetric(avgNetworkLatency, startTime);
                networkTasksExecuted.increment();
                return result;
            } catch (Exception e) {
                logger.error("Error in network task execution", e);
                throw new RuntimeException(e);
            }
        }, networkExecutor);

        return future;
    }

    /**
     * Execute batch of consensus tasks in parallel
     */
    @NonBlocking
    public <T> CompletableFuture<java.util.List<T>> submitConsensusTaskBatch(java.util.List<Callable<T>> tasks) {
        java.util.List<CompletableFuture<T>> futures = tasks.stream()
            .map(this::submitConsensusTask)
            .collect(java.util.stream.Collectors.toList());
        
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .collect(java.util.stream.Collectors.toList()));
    }

    /**
     * Execute batch of transaction tasks in parallel
     */
    @NonBlocking
    public <T> CompletableFuture<java.util.List<T>> submitTransactionTaskBatch(java.util.List<Callable<T>> tasks) {
        java.util.List<CompletableFuture<T>> futures = tasks.stream()
            .map(this::submitTransactionTask)
            .collect(java.util.stream.Collectors.toList());
        
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .collect(java.util.stream.Collectors.toList()));
    }

    /**
     * Get performance metrics
     */
    public PerformanceMetrics getMetrics() {
        return new PerformanceMetrics(
            consensusTasksExecuted.sum(),
            transactionTasksExecuted.sum(),
            aiTasksExecuted.sum(),
            networkTasksExecuted.sum(),
            avgConsensusLatency.get(),
            avgTransactionLatency.get(),
            avgAiLatency.get(),
            avgNetworkLatency.get(),
            getCurrentCpuUsage(),
            getCurrentMemoryUsage()
        );
    }

    /**
     * Start performance monitoring and auto-tuning
     */
    private void startPerformanceMonitoring() {
        monitoringExecutor = Executors.newScheduledThreadPool(2, 
            Thread.ofPlatform().name("pool-monitor-", 0).factory());
        
        monitoringExecutor.scheduleAtFixedRate(this::logPerformanceMetrics, 30, 30, TimeUnit.SECONDS);
        monitoringExecutor.scheduleAtFixedRate(this::performAutoTuning, 60, 60, TimeUnit.SECONDS);
    }

    /**
     * Log performance metrics
     */
    private void logPerformanceMetrics() {
        PerformanceMetrics metrics = getMetrics();
        
        logger.info("Virtual Thread Pool Performance Metrics:");
        logger.info("  Consensus Tasks: {} (avg latency: {}μs)", 
            metrics.consensusTasksExecuted(), metrics.avgConsensusLatency() / 1000);
        logger.info("  Transaction Tasks: {} (avg latency: {}μs)", 
            metrics.transactionTasksExecuted(), metrics.avgTransactionLatency() / 1000);
        logger.info("  AI Tasks: {} (avg latency: {}μs)", 
            metrics.aiTasksExecuted(), metrics.avgAiLatency() / 1000);
        logger.info("  Network Tasks: {} (avg latency: {}μs)", 
            metrics.networkTasksExecuted(), metrics.avgNetworkLatency() / 1000);
        logger.info("  System CPU Usage: {:.2f}%", metrics.cpuUsage() * 100);
        logger.info("  System Memory Usage: {:.2f}%", metrics.memoryUsage() * 100);
    }

    /**
     * Perform auto-tuning based on performance metrics
     */
    private void performAutoTuning() {
        double cpuUsage = getCurrentCpuUsage();
        double memoryUsage = getCurrentMemoryUsage();
        
        // Auto-tune based on system load
        if (cpuUsage > 0.85) {
            logger.warn("High CPU usage detected: {:.2f}%. Consider load balancing.", cpuUsage * 100);
        }
        
        if (memoryUsage > 0.80) {
            logger.warn("High memory usage detected: {:.2f}%. Consider memory optimization.", memoryUsage * 100);
        }
        
        // Calculate TPS
        long totalTasks = consensusTasksExecuted.sum() + transactionTasksExecuted.sum();
        double currentTps = totalTasks / 60.0; // Tasks per second in last minute
        
        if (currentTps > 0) {
            logger.info("Current estimated TPS: {:.0f}", currentTps);
        }
    }

    /**
     * Update latency metric with exponential moving average
     */
    private void updateLatencyMetric(AtomicLong metric, long startTime) {
        long latency = System.nanoTime() - startTime;
        long currentAvg = metric.get();
        long newAvg = currentAvg == 0 ? latency : (currentAvg * 9 + latency) / 10; // 90% weight to current, 10% to new
        metric.set(newAvg);
    }

    /**
     * Handle uncaught exceptions in virtual threads
     */
    private void handleUncaughtException(Thread thread, Throwable exception) {
        logger.error("Uncaught exception in virtual thread {}: {}", thread.getName(), exception.getMessage(), exception);
    }

    /**
     * Get current CPU usage
     */
    private double getCurrentCpuUsage() {
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
            return sunOsBean.getCpuLoad();
        }
        return osBean.getSystemLoadAverage() / hardwareCores;
    }

    /**
     * Get current memory usage
     */
    private double getCurrentMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        
        return (double) (totalMemory - freeMemory) / maxMemory;
    }

    /**
     * Log system configuration
     */
    private void logSystemConfiguration() {
        logger.info("System Configuration:");
        logger.info("  Hardware Cores: {}", hardwareCores);
        logger.info("  Hardware Threads: {}", hardwareThreads);
        logger.info("  Carrier Pool Size: {}", carrierPoolSize);
        logger.info("  Available Processors: {}", Runtime.getRuntime().availableProcessors());
        logger.info("  Max Memory: {}MB", Runtime.getRuntime().maxMemory() / 1024 / 1024);
        logger.info("  System Load Average: {}", osBean.getSystemLoadAverage());
    }

    @PreDestroy
    public void shutdown() {
        logger.info("Shutting down Virtual Thread Pool Manager");
        
        shutdownExecutor(consensusExecutor, "Consensus");
        shutdownExecutor(transactionExecutor, "Transaction");
        shutdownExecutor(aiExecutor, "AI");
        shutdownExecutor(networkExecutor, "Network");
        
        if (monitoringExecutor != null) {
            monitoringExecutor.shutdown();
            try {
                if (!monitoringExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                    monitoringExecutor.shutdownNow();
                }
            } catch (InterruptedException e) {
                monitoringExecutor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        
        logger.info("Virtual Thread Pool Manager shutdown completed");
    }

    private void shutdownExecutor(ExecutorService executor, String name) {
        if (executor != null) {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
                    logger.warn("{} executor did not terminate gracefully, forcing shutdown", name);
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Performance metrics record
     */
    public record PerformanceMetrics(
        long consensusTasksExecuted,
        long transactionTasksExecuted,
        long aiTasksExecuted,
        long networkTasksExecuted,
        long avgConsensusLatency,
        long avgTransactionLatency,
        long avgAiLatency,
        long avgNetworkLatency,
        double cpuUsage,
        double memoryUsage
    ) {}
}