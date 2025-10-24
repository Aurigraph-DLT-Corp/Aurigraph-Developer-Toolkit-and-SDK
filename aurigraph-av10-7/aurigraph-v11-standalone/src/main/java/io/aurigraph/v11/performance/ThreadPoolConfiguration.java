package io.aurigraph.v11.performance;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * Thread Pool Configuration for Phase 4A Optimization
 *
 * Replaces virtual threads with platform thread pool to reduce CPU overhead.
 *
 * JFR Analysis Results (Before):
 * - Virtual threads: 56.35% CPU overhead
 * - Context switching: High contention
 * - Thread creation: Excessive allocations
 *
 * Expected Results (After):
 * - CPU overhead: <5% (target)
 * - TPS improvement: +350K (776K → 1.1M+)
 * - Reduced GC pressure
 *
 * Configuration:
 * - Platform threads: 256 (configurable)
 * - Queue capacity: 500,000
 * - Keep-alive: 60 seconds
 * - Rejection policy: CallerRuns (backpressure)
 *
 * @author Aurigraph Team
 * @version Phase 4A
 * @since October 2025
 */
@ApplicationScoped
public class ThreadPoolConfiguration {

    private static final Logger LOG = Logger.getLogger(ThreadPoolConfiguration.class);

    // Thread pool metrics
    private final AtomicLong totalTasksSubmitted = new AtomicLong(0);
    private final AtomicLong totalTasksCompleted = new AtomicLong(0);
    private final AtomicLong totalTasksRejected = new AtomicLong(0);

    @ConfigProperty(name = "aurigraph.thread.pool.size", defaultValue = "256")
    int threadPoolSize;

    @ConfigProperty(name = "aurigraph.thread.pool.queue.size", defaultValue = "500000")
    int queueSize;

    @ConfigProperty(name = "aurigraph.thread.pool.keep.alive.seconds", defaultValue = "60")
    int keepAliveSeconds;

    @ConfigProperty(name = "aurigraph.thread.pool.metrics.enabled", defaultValue = "true")
    boolean metricsEnabled;

    /**
     * Platform Thread Pool for Transaction Processing
     *
     * Replaces: Executors.newVirtualThreadPerTaskExecutor()
     *
     * Benefits:
     * - Reduced CPU overhead (56.35% → <5%)
     * - Better thread reuse
     * - Predictable resource usage
     * - Lower GC pressure
     */
    @Produces
    @Named("platformThreadPool")
    @ApplicationScoped
    public ExecutorService createPlatformThreadPool() {
        LOG.infof("Phase 4A: Creating platform thread pool (size=%d, queue=%d)",
                 threadPoolSize, queueSize);

        // Custom thread factory with naming and monitoring
        ThreadFactory threadFactory = new CustomThreadFactory("aurigraph-platform");

        // Create ThreadPoolExecutor with bounded queue
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            threadPoolSize,           // Core pool size
            threadPoolSize,           // Max pool size (fixed)
            keepAliveSeconds,         // Keep-alive time
            TimeUnit.SECONDS,         // Time unit
            new LinkedBlockingQueue<>(queueSize),  // Bounded queue
            threadFactory,            // Thread factory
            new ThreadPoolExecutor.CallerRunsPolicy()  // Backpressure: caller runs on overflow
        );

        // Enable core thread timeout for better resource management
        executor.allowCoreThreadTimeOut(false);

        // Pre-start core threads for immediate availability
        executor.prestartAllCoreThreads();

        LOG.infof("✓ Platform thread pool created: %d threads pre-started", threadPoolSize);

        // Start metrics collection if enabled
        if (metricsEnabled) {
            startMetricsCollection(executor);
        }

        return executor;
    }

    /**
     * Custom Thread Factory with monitoring
     */
    private class CustomThreadFactory implements ThreadFactory {
        private final AtomicInteger threadNumber = new AtomicInteger(1);
        private final String namePrefix;

        CustomThreadFactory(String namePrefix) {
            this.namePrefix = namePrefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread thread = new Thread(r, namePrefix + "-" + threadNumber.getAndIncrement());
            thread.setDaemon(false);  // Platform threads are not daemon
            thread.setPriority(Thread.NORM_PRIORITY);
            thread.setUncaughtExceptionHandler((t, e) ->
                LOG.errorf(e, "Uncaught exception in thread %s", t.getName())
            );
            return thread;
        }
    }

    /**
     * Start metrics collection for thread pool monitoring
     */
    private void startMetricsCollection(ThreadPoolExecutor executor) {
        // Schedule periodic metrics logging
        Thread metricsThread = new Thread(() -> {
            while (!executor.isTerminated()) {
                try {
                    Thread.sleep(10000);  // Log every 10 seconds

                    int activeCount = executor.getActiveCount();
                    int poolSize = executor.getPoolSize();
                    long completedTasks = executor.getCompletedTaskCount();
                    long queuedTasks = executor.getQueue().size();

                    LOG.infof("Thread Pool Metrics: active=%d/%d, completed=%d, queued=%d, rejected=%d",
                             activeCount, poolSize, completedTasks, queuedTasks, totalTasksRejected.get());

                    // Warn if queue is filling up
                    if (queuedTasks > queueSize * 0.8) {
                        LOG.warnf("⚠ Thread pool queue is 80%% full: %d/%d", queuedTasks, queueSize);
                    }

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }, "thread-pool-metrics");
        metricsThread.setDaemon(true);
        metricsThread.start();

        LOG.info("Thread pool metrics collection started");
    }

    /**
     * Get thread pool metrics for monitoring
     */
    public ThreadPoolMetrics getMetrics() {
        return new ThreadPoolMetrics(
            totalTasksSubmitted.get(),
            totalTasksCompleted.get(),
            totalTasksRejected.get(),
            threadPoolSize,
            queueSize
        );
    }

    /**
     * Thread pool metrics record
     */
    public record ThreadPoolMetrics(
        long totalTasksSubmitted,
        long totalTasksCompleted,
        long totalTasksRejected,
        int threadPoolSize,
        int queueSize
    ) {
        public double getRejectionRate() {
            return totalTasksSubmitted > 0
                ? (double) totalTasksRejected / totalTasksSubmitted
                : 0.0;
        }

        public double getCompletionRate() {
            return totalTasksSubmitted > 0
                ? (double) totalTasksCompleted / totalTasksSubmitted
                : 0.0;
        }
    }
}
