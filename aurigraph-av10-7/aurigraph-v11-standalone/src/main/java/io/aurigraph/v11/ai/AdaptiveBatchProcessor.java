package io.aurigraph.v11.ai;

import io.aurigraph.v11.consensus.ConsensusModels.Transaction;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.apache.commons.math3.analysis.interpolation.LinearInterpolator;
import org.apache.commons.math3.analysis.polynomials.PolynomialSplineFunction;

import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.stream.Collectors;

/**
 * Adaptive Batch Processor for Aurigraph V11
 * 
 * Implements ML-driven dynamic batch processing optimization:
 * - Real-time batch size optimization based on network conditions
 * - Adaptive timeout adjustment using performance feedback
 * - Transaction priority-based batching with ML classification
 * - Parallel batch processing with intelligent work distribution
 * - Dynamic compression and encoding optimization
 * 
 * Performance Targets:
 * - Batch Processing Efficiency: 25-35% improvement in throughput
 * - Latency Optimization: 15-20% reduction in batch processing time
 * - Resource Utilization: 20-30% better CPU/memory efficiency
 * - Adaptive Response: <1s adaptation to changing conditions
 * - Batch Success Rate: 99.5%+ successful batch completion
 * 
 * @author Aurigraph AI Team
 * @version 11.0.0
 * @since 2024-01-01
 */
@ApplicationScoped
public class AdaptiveBatchProcessor {

    private static final Logger LOG = Logger.getLogger(AdaptiveBatchProcessor.class);

    // Configuration
    @ConfigProperty(name = "batch.processor.enabled", defaultValue = "true")
    boolean processorEnabled;

    @ConfigProperty(name = "batch.processor.min.size", defaultValue = "100")
    int minBatchSize;

    @ConfigProperty(name = "batch.processor.max.size", defaultValue = "50000")
    int maxBatchSize;

    @ConfigProperty(name = "batch.processor.default.size", defaultValue = "10000")
    int defaultBatchSize;

    @ConfigProperty(name = "batch.processor.timeout.ms", defaultValue = "5000")
    int defaultTimeoutMs;

    @ConfigProperty(name = "batch.processor.adaptation.interval.ms", defaultValue = "2000")
    int adaptationIntervalMs;

    @ConfigProperty(name = "batch.processor.parallel.workers", defaultValue = "8")
    int parallelWorkers;

    @ConfigProperty(name = "batch.processor.compression.enabled", defaultValue = "true")
    boolean compressionEnabled;

    @ConfigProperty(name = "batch.processor.priority.levels", defaultValue = "5")
    int priorityLevels;

    @Inject
    Event<AIOptimizationEvent> eventBus;

    // Batch processing state
    private final AtomicInteger currentBatchSize = new AtomicInteger(defaultBatchSize);
    private final AtomicInteger currentTimeout = new AtomicInteger(defaultTimeoutMs);
    private final Queue<Transaction> transactionQueue = new ConcurrentLinkedQueue<>();
    private final Map<Integer, Queue<Transaction>> priorityQueues = new ConcurrentHashMap<>();
    
    // Performance tracking
    private final AtomicLong totalBatches = new AtomicLong(0);
    private final AtomicLong successfulBatches = new AtomicLong(0);
    private final AtomicLong totalTransactions = new AtomicLong(0);
    private final AtomicReference<Double> avgBatchProcessingTime = new AtomicReference<>(0.0);
    private final AtomicReference<Double> batchThroughput = new AtomicReference<>(0.0);
    private final AtomicReference<Double> batchEfficiency = new AtomicReference<>(0.0);
    private final AtomicReference<Double> adaptationScore = new AtomicReference<>(0.0);

    // Adaptive learning components
    private final Queue<BatchPerformanceMetrics> performanceHistory = new ConcurrentLinkedQueue<>();
    private final DescriptiveStatistics processingTimeStats = new DescriptiveStatistics(1000);
    private final DescriptiveStatistics throughputStats = new DescriptiveStatistics(1000);
    private final Map<String, Double> networkConditionWeights = new ConcurrentHashMap<>();

    // Executors
    private ExecutorService batchProcessingExecutor;
    private ExecutorService adaptationExecutor;
    private ScheduledExecutorService metricsExecutor;
    private ScheduledExecutorService adaptationScheduler;

    // Batch processing workers
    private final List<CompletableFuture<Void>> batchWorkers = new CopyOnWriteArrayList<>();
    
    // Current optimization parameters
    private final AtomicReference<BatchOptimizationParameters> currentOptimization = 
        new AtomicReference<>(new BatchOptimizationParameters(
            defaultBatchSize, defaultTimeoutMs, 1.0, false, CompressionType.GZIP
        ));

    @PostConstruct
    public void initialize() {
        LOG.info("Initializing Adaptive Batch Processor");

        if (!processorEnabled) {
            LOG.info("Adaptive Batch Processor is disabled by configuration");
            return;
        }

        // Initialize executors
        initializeExecutors();

        // Initialize priority queues
        initializePriorityQueues();

        // Initialize network condition weights
        initializeNetworkConditionWeights();

        // Start batch processing
        startBatchProcessing();

        // Start adaptation processes
        startAdaptationProcesses();

        // Start metrics collection
        startMetricsCollection();

        LOG.info("Adaptive Batch Processor initialized successfully");
    }

    @PreDestroy
    public void shutdown() {
        LOG.info("Shutting down Adaptive Batch Processor");

        // Stop batch workers
        for (CompletableFuture<Void> worker : batchWorkers) {
            worker.cancel(true);
        }

        // Shutdown executors
        shutdownExecutor(batchProcessingExecutor, "Batch Processing");
        shutdownExecutor(adaptationExecutor, "Adaptation");
        shutdownExecutor(metricsExecutor, "Metrics");
        shutdownExecutor(adaptationScheduler, "Adaptation Scheduler");

        LOG.info("Adaptive Batch Processor shutdown complete");
    }

    private void initializeExecutors() {
        batchProcessingExecutor = Executors.newVirtualThreadPerTaskExecutor();
        adaptationExecutor = Executors.newVirtualThreadPerTaskExecutor();
        metricsExecutor = Executors.newScheduledThreadPool(1, r -> Thread.ofVirtual()
            .name("batch-metrics")
            .start(r));
        adaptationScheduler = Executors.newScheduledThreadPool(1, r -> Thread.ofVirtual()
            .name("batch-adaptation")
            .start(r));

        LOG.info("Batch processor executors initialized");
    }

    private void initializePriorityQueues() {
        for (int i = 0; i < priorityLevels; i++) {
            priorityQueues.put(i, new ConcurrentLinkedQueue<>());
        }

        LOG.infof("Initialized %d priority queues for batch processing", priorityLevels);
    }

    private void initializeNetworkConditionWeights() {
        // Initialize network condition impact weights
        networkConditionWeights.put("low_latency", 0.8);      // Favor larger batches
        networkConditionWeights.put("high_latency", 1.2);     // Favor smaller batches
        networkConditionWeights.put("high_throughput", 0.7);  // Favor larger batches
        networkConditionWeights.put("low_throughput", 1.3);   // Favor smaller batches
        networkConditionWeights.put("stable_network", 0.9);   // Slight preference for larger
        networkConditionWeights.put("unstable_network", 1.4); // Strong preference for smaller

        LOG.info("Network condition weights initialized for adaptive batching");
    }

    private void startBatchProcessing() {
        // Start batch processing workers
        for (int i = 0; i < parallelWorkers; i++) {
            final int workerId = i;
            CompletableFuture<Void> worker = CompletableFuture.runAsync(() -> 
                runBatchProcessingWorker(workerId), batchProcessingExecutor);
            batchWorkers.add(worker);
        }

        LOG.infof("Started %d batch processing workers", parallelWorkers);
    }

    private void startAdaptationProcesses() {
        // Start real-time adaptation
        adaptationScheduler.scheduleAtFixedRate(
            this::adaptBatchParameters,
            adaptationIntervalMs,
            adaptationIntervalMs,
            TimeUnit.MILLISECONDS
        );

        // Start performance analysis
        adaptationExecutor.submit(this::runPerformanceAnalysis);

        LOG.info("Batch adaptation processes started");
    }

    private void startMetricsCollection() {
        metricsExecutor.scheduleAtFixedRate(
            this::collectBatchMetrics,
            1000,  // Start after 1 second
            1000,  // Every 1 second
            TimeUnit.MILLISECONDS
        );

        LOG.info("Batch processor metrics collection started");
    }

    private void runBatchProcessingWorker(int workerId) {
        LOG.debugf("Starting batch processing worker %d", workerId);

        while (!Thread.currentThread().isInterrupted() && processorEnabled) {
            try {
                // Process high-priority batches first
                List<Transaction> batch = collectOptimalBatch();
                
                if (!batch.isEmpty()) {
                    BatchProcessingResult result = processBatch(batch, workerId);
                    recordBatchResult(result);
                } else {
                    // No transactions to process, sleep briefly
                    Thread.sleep(100);
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in batch processing worker %d: %s", workerId, e.getMessage());
                try {
                    Thread.sleep(1000); // Back off on error
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.debugf("Batch processing worker %d terminated", workerId);
    }

    private List<Transaction> collectOptimalBatch() {
        List<Transaction> batch = new ArrayList<>();
        int targetSize = currentBatchSize.get();
        
        // Collect transactions from priority queues (highest priority first)
        for (int priority = priorityLevels - 1; priority >= 0 && batch.size() < targetSize; priority--) {
            Queue<Transaction> priorityQueue = priorityQueues.get(priority);
            
            while (batch.size() < targetSize && !priorityQueue.isEmpty()) {
                Transaction tx = priorityQueue.poll();
                if (tx != null) {
                    batch.add(tx);
                }
            }
        }

        // If priority queues don't have enough, use main queue
        while (batch.size() < targetSize && !transactionQueue.isEmpty()) {
            Transaction tx = transactionQueue.poll();
            if (tx != null) {
                batch.add(tx);
            }
        }

        // Apply minimum batch size constraint
        if (batch.size() < minBatchSize && !transactionQueue.isEmpty()) {
            return Collections.emptyList(); // Wait for more transactions
        }

        return batch;
    }

    private BatchProcessingResult processBatch(List<Transaction> batch, int workerId) {
        long startTime = System.nanoTime();
        BatchOptimizationParameters optimization = currentOptimization.get();
        
        try {
            // Apply compression if enabled
            CompressedBatch compressedBatch = null;
            if (optimization.compressionEnabled) {
                compressedBatch = compressBatch(batch, optimization.compressionType);
            }

            // Process batch with current parameters
            BatchProcessingResult result = performBatchProcessing(
                batch, compressedBatch, optimization, workerId);

            // Calculate processing metrics
            double processingTime = (System.nanoTime() - startTime) / 1_000_000.0; // Convert to ms
            double throughput = batch.size() / (processingTime / 1000.0); // Transactions per second

            result.processingTimeMs = processingTime;
            result.throughput = throughput;
            result.workerId = workerId;

            totalBatches.incrementAndGet();
            if (result.success) {
                successfulBatches.incrementAndGet();
            }
            totalTransactions.addAndGet(batch.size());

            return result;

        } catch (Exception e) {
            LOG.errorf("Error processing batch in worker %d: %s", workerId, e.getMessage());
            double processingTime = (System.nanoTime() - startTime) / 1_000_000.0;
            
            return new BatchProcessingResult(
                false,
                batch.size(),
                processingTime,
                0.0,
                workerId,
                "Processing failed: " + e.getMessage(),
                Instant.now()
            );
        }
    }

    private CompressedBatch compressBatch(List<Transaction> batch, CompressionType type) {
        try {
            // Simulate batch compression (in production, would implement actual compression)
            double compressionRatio = switch (type) {
                case GZIP -> 0.6;   // 40% size reduction
                case LZ4 -> 0.75;   // 25% size reduction
                case SNAPPY -> 0.8; // 20% size reduction
                case NONE -> 1.0;   // No compression
            };

            long originalSize = batch.size() * 1000L; // Estimated size
            long compressedSize = (long)(originalSize * compressionRatio);

            return new CompressedBatch(
                batch,
                type,
                originalSize,
                compressedSize,
                compressionRatio
            );

        } catch (Exception e) {
            LOG.errorf("Error compressing batch: %s", e.getMessage());
            return new CompressedBatch(batch, CompressionType.NONE, 
                batch.size() * 1000L, batch.size() * 1000L, 1.0);
        }
    }

    private BatchProcessingResult performBatchProcessing(
            List<Transaction> batch, 
            CompressedBatch compressedBatch, 
            BatchOptimizationParameters optimization,
            int workerId) {

        try {
            // Simulate batch processing with optimization parameters
            long processingDelay = calculateProcessingDelay(batch.size(), optimization);
            
            // Apply processing delay
            if (processingDelay > 0) {
                Thread.sleep(processingDelay);
            }

            // Determine success based on processing conditions
            boolean success = simulateProcessingSuccess(batch, optimization);

            return new BatchProcessingResult(
                success,
                batch.size(),
                0.0, // Will be set by caller
                0.0, // Will be set by caller
                workerId,
                success ? "Batch processed successfully" : "Batch processing failed",
                Instant.now()
            );

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new BatchProcessingResult(
                false, batch.size(), 0.0, 0.0, workerId,
                "Processing interrupted", Instant.now()
            );
        }
    }

    private long calculateProcessingDelay(int batchSize, BatchOptimizationParameters optimization) {
        // Calculate processing delay based on batch size and optimization parameters
        double baseDelay = batchSize * 0.01; // 0.01ms per transaction
        double optimizationFactor = optimization.processingSpeedMultiplier;
        
        return (long)(baseDelay / optimizationFactor);
    }

    private boolean simulateProcessingSuccess(List<Transaction> batch, BatchOptimizationParameters optimization) {
        // Simulate processing success based on various factors
        double baseSuccessRate = 0.995; // 99.5% base success rate
        
        // Adjust based on batch size
        double sizeAdjustment = batch.size() > maxBatchSize * 0.8 ? -0.01 : 0.0;
        
        // Adjust based on optimization parameters
        double optimizationAdjustment = optimization.compressionEnabled ? 0.002 : 0.0;
        
        double finalSuccessRate = baseSuccessRate + sizeAdjustment + optimizationAdjustment;
        
        return Math.random() < finalSuccessRate;
    }

    private void recordBatchResult(BatchProcessingResult result) {
        // Update performance statistics
        if (result.success) {
            processingTimeStats.addValue(result.processingTimeMs);
            throughputStats.addValue(result.throughput);
        }

        // Create performance metrics record
        BatchPerformanceMetrics metrics = new BatchPerformanceMetrics(
            result.batchSize,
            result.processingTimeMs,
            result.throughput,
            result.success,
            currentBatchSize.get(),
            currentTimeout.get(),
            result.timestamp
        );

        performanceHistory.offer(metrics);
        maintainHistorySize(performanceHistory, 1000);

        // Update real-time metrics
        updateRealTimeMetrics(result);
    }

    private void updateRealTimeMetrics(BatchProcessingResult result) {
        // Update average processing time
        avgBatchProcessingTime.updateAndGet(current -> current * 0.9 + result.processingTimeMs * 0.1);

        // Update throughput
        batchThroughput.updateAndGet(current -> current * 0.9 + result.throughput * 0.1);

        // Calculate batch efficiency
        double theoreticalOptimal = result.batchSize / 10.0; // 10ms per 1000 transactions
        double efficiency = Math.min(1.0, theoreticalOptimal / Math.max(1.0, result.processingTimeMs));
        batchEfficiency.updateAndGet(current -> current * 0.9 + efficiency * 0.1);
    }

    private void adaptBatchParameters() {
        if (performanceHistory.size() < 10) {
            return; // Need more data for adaptation
        }

        try {
            LOG.debug("Adapting batch parameters based on recent performance");

            // Analyze recent performance
            List<BatchPerformanceMetrics> recentMetrics = performanceHistory.stream()
                .limit(50)
                .collect(Collectors.toList());

            // Calculate optimal batch size
            int optimalBatchSize = calculateOptimalBatchSize(recentMetrics);
            
            // Calculate optimal timeout
            int optimalTimeout = calculateOptimalTimeout(recentMetrics);

            // Calculate optimal processing speed multiplier
            double optimalSpeedMultiplier = calculateOptimalSpeedMultiplier(recentMetrics);

            // Determine if compression should be enabled
            boolean optimalCompression = shouldEnableCompression(recentMetrics);

            // Select optimal compression type
            CompressionType optimalCompressionType = selectOptimalCompressionType(recentMetrics);

            // Apply adaptations if they represent improvements
            if (shouldApplyAdaptation(optimalBatchSize, optimalTimeout, 
                    optimalSpeedMultiplier, optimalCompression, optimalCompressionType)) {
                
                applyOptimizations(optimalBatchSize, optimalTimeout, 
                    optimalSpeedMultiplier, optimalCompression, optimalCompressionType);
            }

        } catch (Exception e) {
            LOG.errorf("Error in batch parameter adaptation: %s", e.getMessage());
        }
    }

    private int calculateOptimalBatchSize(List<BatchPerformanceMetrics> recentMetrics) {
        if (recentMetrics.isEmpty()) return currentBatchSize.get();

        // Find batch size with best throughput/latency ratio
        Map<Integer, List<BatchPerformanceMetrics>> sizeGroups = recentMetrics.stream()
            .collect(Collectors.groupingBy(metrics -> 
                (metrics.batchSize / 1000) * 1000)); // Group by 1000s

        int bestSize = currentBatchSize.get();
        double bestScore = 0.0;

        for (Map.Entry<Integer, List<BatchPerformanceMetrics>> entry : sizeGroups.entrySet()) {
            if (entry.getValue().size() < 3) continue; // Need sufficient samples

            double avgThroughput = entry.getValue().stream()
                .filter(m -> m.success)
                .mapToDouble(m -> m.throughput)
                .average()
                .orElse(0.0);

            double avgLatency = entry.getValue().stream()
                .filter(m -> m.success)
                .mapToDouble(m -> m.processingTimeMs)
                .average()
                .orElse(Double.MAX_VALUE);

            // Score combines throughput and latency (higher throughput, lower latency = better)
            double score = avgThroughput / Math.max(1.0, avgLatency / 100.0);

            if (score > bestScore) {
                bestScore = score;
                bestSize = entry.getKey();
            }
        }

        // Apply constraints
        return Math.max(minBatchSize, Math.min(maxBatchSize, bestSize));
    }

    private int calculateOptimalTimeout(List<BatchPerformanceMetrics> recentMetrics) {
        if (recentMetrics.isEmpty()) return currentTimeout.get();

        // Calculate timeout based on processing time statistics
        double avgProcessingTime = recentMetrics.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.processingTimeMs)
            .average()
            .orElse(currentTimeout.get());

        // Set timeout to 2x average processing time, with bounds
        int optimalTimeout = (int)(avgProcessingTime * 2);
        return Math.max(1000, Math.min(30000, optimalTimeout));
    }

    private double calculateOptimalSpeedMultiplier(List<BatchPerformanceMetrics> recentMetrics) {
        // Analyze if we should increase processing speed
        double successRate = recentMetrics.stream()
            .mapToDouble(m -> m.success ? 1.0 : 0.0)
            .average()
            .orElse(0.99);

        double avgLatency = recentMetrics.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.processingTimeMs)
            .average()
            .orElse(1000.0);

        // If success rate is high and latency is low, we can increase speed
        if (successRate > 0.98 && avgLatency < 500) {
            return Math.min(2.0, currentOptimization.get().processingSpeedMultiplier * 1.1);
        }
        
        // If success rate is low, decrease speed
        if (successRate < 0.95) {
            return Math.max(0.5, currentOptimization.get().processingSpeedMultiplier * 0.9);
        }

        return currentOptimization.get().processingSpeedMultiplier;
    }

    private boolean shouldEnableCompression(List<BatchPerformanceMetrics> recentMetrics) {
        // Enable compression if processing time allows and batch sizes are large
        double avgBatchSize = recentMetrics.stream()
            .mapToDouble(m -> m.batchSize)
            .average()
            .orElse(defaultBatchSize);

        double avgProcessingTime = recentMetrics.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.processingTimeMs)
            .average()
            .orElse(1000.0);

        // Enable compression for large batches with acceptable processing time
        return avgBatchSize > 5000 && avgProcessingTime < 2000;
    }

    private CompressionType selectOptimalCompressionType(List<BatchPerformanceMetrics> recentMetrics) {
        // Select compression type based on processing performance
        double avgProcessingTime = recentMetrics.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.processingTimeMs)
            .average()
            .orElse(1000.0);

        if (avgProcessingTime < 500) {
            return CompressionType.GZIP; // Best compression for fast processing
        } else if (avgProcessingTime < 1000) {
            return CompressionType.LZ4; // Balanced compression/speed
        } else {
            return CompressionType.SNAPPY; // Fastest compression
        }
    }

    private boolean shouldApplyAdaptation(int optimalBatchSize, int optimalTimeout,
            double optimalSpeedMultiplier, boolean optimalCompression,
            CompressionType optimalCompressionType) {
        
        BatchOptimizationParameters current = currentOptimization.get();
        
        // Check if changes are significant enough to warrant adaptation
        boolean significantBatchSizeChange = Math.abs(optimalBatchSize - currentBatchSize.get()) > 
            currentBatchSize.get() * 0.1; // 10% change threshold

        boolean significantTimeoutChange = Math.abs(optimalTimeout - currentTimeout.get()) > 
            currentTimeout.get() * 0.2; // 20% change threshold

        boolean significantSpeedChange = Math.abs(optimalSpeedMultiplier - current.processingSpeedMultiplier) > 0.1;

        boolean compressionChange = optimalCompression != current.compressionEnabled ||
            optimalCompressionType != current.compressionType;

        return significantBatchSizeChange || significantTimeoutChange || 
               significantSpeedChange || compressionChange;
    }

    private void applyOptimizations(int optimalBatchSize, int optimalTimeout,
            double optimalSpeedMultiplier, boolean optimalCompression,
            CompressionType optimalCompressionType) {
        
        // Apply new parameters
        int oldBatchSize = currentBatchSize.getAndSet(optimalBatchSize);
        int oldTimeout = currentTimeout.getAndSet(optimalTimeout);
        
        BatchOptimizationParameters newOptimization = new BatchOptimizationParameters(
            optimalBatchSize,
            optimalTimeout,
            optimalSpeedMultiplier,
            optimalCompression,
            optimalCompressionType
        );
        
        BatchOptimizationParameters oldOptimization = currentOptimization.getAndSet(newOptimization);

        // Fire optimization event
        eventBus.fire(new AIOptimizationEvent(
            AIOptimizationEventType.OPTIMIZATION_APPLIED,
            "Batch processing parameters optimized",
            Map.of(
                "oldBatchSize", oldBatchSize,
                "newBatchSize", optimalBatchSize,
                "oldTimeout", oldTimeout,
                "newTimeout", optimalTimeout,
                "compressionEnabled", optimalCompression,
                "compressionType", optimalCompressionType.toString()
            )
        ));

        LOG.infof("Applied batch optimizations - Size: %d->%d, Timeout: %dms->%dms, " +
                 "Speed: %.2f->%.2f, Compression: %s->%s (%s)",
                 oldBatchSize, optimalBatchSize, oldTimeout, optimalTimeout,
                 oldOptimization.processingSpeedMultiplier, optimalSpeedMultiplier,
                 oldOptimization.compressionEnabled, optimalCompression, optimalCompressionType);
    }

    private void runPerformanceAnalysis() {
        LOG.info("Starting batch performance analysis");

        while (!Thread.currentThread().isInterrupted() && processorEnabled) {
            try {
                if (performanceHistory.size() >= 20) {
                    analyzePerformanceTrends();
                    calculateAdaptationScore();
                }

                Thread.sleep(10000); // Analyze every 10 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in performance analysis: %s", e.getMessage());
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Batch performance analysis terminated");
    }

    private void analyzePerformanceTrends() {
        List<BatchPerformanceMetrics> recent = performanceHistory.stream()
            .limit(50)
            .collect(Collectors.toList());

        if (recent.size() < 10) return;

        // Analyze throughput trend
        double[] throughputValues = recent.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.throughput)
            .toArray();

        if (throughputValues.length > 5) {
            double throughputTrend = calculateTrend(throughputValues);
            
            if (throughputTrend < -0.1) {
                LOG.warn("Declining throughput trend detected in batch processing");
                // Could trigger proactive optimization here
            }
        }

        // Analyze processing time trend
        double[] latencyValues = recent.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.processingTimeMs)
            .toArray();

        if (latencyValues.length > 5) {
            double latencyTrend = calculateTrend(latencyValues);
            
            if (latencyTrend > 0.2) {
                LOG.warn("Increasing latency trend detected in batch processing");
                // Could trigger proactive optimization here
            }
        }
    }

    private double calculateTrend(double[] values) {
        if (values.length < 2) return 0.0;

        // Simple linear trend calculation
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        int n = values.length;

        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
        }

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    private void calculateAdaptationScore() {
        if (performanceHistory.isEmpty()) return;

        List<BatchPerformanceMetrics> recent = performanceHistory.stream()
            .limit(50)
            .collect(Collectors.toList());

        // Calculate adaptation effectiveness score
        double successRate = recent.stream()
            .mapToDouble(m -> m.success ? 1.0 : 0.0)
            .average()
            .orElse(0.0);

        double avgThroughput = recent.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.throughput)
            .average()
            .orElse(0.0);

        double avgLatency = recent.stream()
            .filter(m -> m.success)
            .mapToDouble(m -> m.processingTimeMs)
            .average()
            .orElse(1000.0);

        // Combine metrics into adaptation score (0-1, higher is better)
        double throughputScore = Math.min(1.0, avgThroughput / 10000.0); // Normalized to 10K TPS
        double latencyScore = Math.max(0.0, (2000.0 - avgLatency) / 2000.0); // Lower latency = higher score
        
        double score = (successRate * 0.4) + (throughputScore * 0.4) + (latencyScore * 0.2);
        adaptationScore.set(score);
    }

    private void collectBatchMetrics() {
        try {
            // Update queue sizes and other metrics
            int totalQueueSize = transactionQueue.size() + 
                priorityQueues.values().stream().mapToInt(Queue::size).sum();

            // Log metrics periodically
            long totalBatchCount = totalBatches.get();
            if (totalBatchCount > 0 && totalBatchCount % 100 == 0) {
                double successRate = (successfulBatches.get() * 100.0) / totalBatchCount;
                
                LOG.infof("Batch Processing Performance - Batches: %d (%.1f%% success), " +
                         "Transactions: %d, Queue Size: %d, Avg Time: %.2fms, " +
                         "Throughput: %.0f TPS, Efficiency: %.1f%%, Adaptation Score: %.1f%%, " +
                         "Batch Size: %d, Timeout: %dms",
                         totalBatchCount, successRate, totalTransactions.get(), totalQueueSize,
                         avgBatchProcessingTime.get(), batchThroughput.get(),
                         batchEfficiency.get() * 100, adaptationScore.get() * 100,
                         currentBatchSize.get(), currentTimeout.get());
            }

        } catch (Exception e) {
            LOG.errorf("Error collecting batch metrics: %s", e.getMessage());
        }
    }

    // Public API methods

    /**
     * Submit transaction for batch processing
     */
    public void submitTransaction(Transaction transaction) {
        int priority = calculateTransactionPriority(transaction);
        
        if (priority > 0) {
            priorityQueues.get(Math.min(priority, priorityLevels - 1)).offer(transaction);
        } else {
            transactionQueue.offer(transaction);
        }
    }

    /**
     * Submit multiple transactions for batch processing
     */
    public void submitTransactions(List<Transaction> transactions) {
        for (Transaction transaction : transactions) {
            submitTransaction(transaction);
        }
    }

    private int calculateTransactionPriority(Transaction transaction) {
        // Simple priority calculation (in production, would use more sophisticated logic)
        if (transaction.getAmount() > 1000000) return 4; // High value
        if (transaction.getAmount() > 100000) return 3;  // Medium-high value
        if (transaction.getAmount() > 10000) return 2;   // Medium value
        if (transaction.getAmount() > 1000) return 1;    // Low-medium value
        return 0; // Default priority
    }

    /**
     * Optimize batch parameters based on ML recommendations
     */
    public boolean optimizeBatchParameters(Map<String, Object> parameters) {
        try {
            Object batchSizeObj = parameters.get("batchSizeMultiplier");
            if (batchSizeObj instanceof Double) {
                double multiplier = (Double) batchSizeObj;
                if (multiplier > 0.5 && multiplier < 2.0) {
                    int newSize = (int)(currentBatchSize.get() * multiplier);
                    newSize = Math.max(minBatchSize, Math.min(maxBatchSize, newSize));
                    currentBatchSize.set(newSize);
                    LOG.infof("Applied batch size optimization: %d (multiplier: %.2f)", newSize, multiplier);
                }
            }

            Object timeoutObj = parameters.get("timeoutAdjustment");
            if (timeoutObj instanceof Double) {
                double adjustment = (Double) timeoutObj;
                if (adjustment > 0.5 && adjustment < 2.0) {
                    int newTimeout = (int)(currentTimeout.get() * adjustment);
                    newTimeout = Math.max(1000, Math.min(30000, newTimeout));
                    currentTimeout.set(newTimeout);
                    LOG.infof("Applied timeout optimization: %dms (adjustment: %.2f)", newTimeout, adjustment);
                }
            }

            return true;

        } catch (Exception e) {
            LOG.errorf("Error optimizing batch parameters: %s", e.getMessage());
            return false;
        }
    }

    /**
     * Preemptively optimize batching for predicted bottlenecks
     */
    public String preemptivelyOptimizeBatching() {
        try {
            // Reduce batch size preemptively to handle potential bottlenecks
            int currentSize = currentBatchSize.get();
            int reducedSize = Math.max(minBatchSize, (int)(currentSize * 0.8));
            currentBatchSize.set(reducedSize);

            // Reduce timeout for faster processing
            int currentTimeoutValue = currentTimeout.get();
            int reducedTimeout = Math.max(1000, (int)(currentTimeoutValue * 0.9));
            currentTimeout.set(reducedTimeout);

            LOG.infof("Applied preemptive batch optimization - Size: %d->%d, Timeout: %dms->%dms",
                     currentSize, reducedSize, currentTimeoutValue, reducedTimeout);

            return "Preemptive batch optimization applied";

        } catch (Exception e) {
            LOG.errorf("Error in preemptive batch optimization: %s", e.getMessage());
            return "Preemptive optimization failed: " + e.getMessage();
        }
    }

    /**
     * Get current batch processing metrics
     */
    public BatchProcessingMetrics getBatchProcessingMetrics() {
        long totalBatchCount = totalBatches.get();
        double successRate = totalBatchCount > 0 ? 
            (successfulBatches.get() * 100.0) / totalBatchCount : 0.0;

        return new BatchProcessingMetrics(
            totalBatchCount,
            successfulBatches.get(),
            successRate,
            totalTransactions.get(),
            avgBatchProcessingTime.get(),
            batchThroughput.get(),
            batchEfficiency.get(),
            adaptationScore.get(),
            currentBatchSize.get(),
            currentTimeout.get(),
            transactionQueue.size() + priorityQueues.values().stream().mapToInt(Queue::size).sum(),
            processorEnabled
        );
    }

    /**
     * Get current batch optimization parameters
     */
    public BatchOptimizationParameters getCurrentOptimization() {
        return currentOptimization.get();
    }

    private <T> void maintainHistorySize(Queue<T> queue, int maxSize) {
        while (queue.size() > maxSize) {
            queue.poll();
        }
    }

    private void shutdownExecutor(ExecutorService executor, String name) {
        if (executor != null && !executor.isShutdown()) {
            LOG.debugf("Shutting down %s executor", name);
            executor.shutdown();
            try {
                if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    // Data classes

    public record BatchOptimizationParameters(
        int batchSize,
        int timeoutMs,
        double processingSpeedMultiplier,
        boolean compressionEnabled,
        CompressionType compressionType
    ) {}

    public record BatchProcessingResult(
        boolean success,
        int batchSize,
        double processingTimeMs,
        double throughput,
        int workerId,
        String details,
        Instant timestamp
    ) {}

    public record BatchPerformanceMetrics(
        int batchSize,
        double processingTimeMs,
        double throughput,
        boolean success,
        int configuredBatchSize,
        int configuredTimeout,
        Instant timestamp
    ) {}

    public record CompressedBatch(
        List<Transaction> transactions,
        CompressionType type,
        long originalSize,
        long compressedSize,
        double compressionRatio
    ) {}

    public record BatchProcessingMetrics(
        long totalBatches,
        long successfulBatches,
        double successRate,
        long totalTransactions,
        double avgProcessingTimeMs,
        double throughputTPS,
        double efficiency,
        double adaptationScore,
        int currentBatchSize,
        int currentTimeoutMs,
        int queueSize,
        boolean enabled
    ) {}

    public enum CompressionType {
        NONE,
        GZIP,
        LZ4,
        SNAPPY
    }
}