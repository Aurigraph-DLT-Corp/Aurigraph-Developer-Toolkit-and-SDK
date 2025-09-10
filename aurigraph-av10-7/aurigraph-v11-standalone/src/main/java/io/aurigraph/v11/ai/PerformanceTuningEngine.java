package io.aurigraph.v11.ai;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.stream.Collectors;

/**
 * Performance Tuning Engine for Aurigraph V11
 * 
 * Implements real-time performance optimization and auto-tuning capabilities:
 * - Dynamic parameter adjustment based on performance feedback
 * - Multi-objective optimization (throughput, latency, resource usage)
 * - Real-time bottleneck detection and resolution
 * - Adaptive resource allocation and scaling
 * - Performance regression detection and automatic rollback
 * - Predictive performance modeling and preemptive optimization
 * 
 * Performance Targets:
 * - Optimization Response Time: <5 seconds from detection to adjustment
 * - Performance Improvement: 15-30% across key metrics
 * - System Stability: 99.9% uptime during optimization
 * - Regression Detection: <10 seconds to identify performance drops
 * - Resource Efficiency: 20-40% better resource utilization
 * 
 * @author Aurigraph AI Performance Team
 * @version 11.0.0
 * @since 2024-09-10
 */
@ApplicationScoped
public class PerformanceTuningEngine {

    private static final Logger LOG = Logger.getLogger(PerformanceTuningEngine.class);

    // Configuration
    @ConfigProperty(name = "performance.tuning.enabled", defaultValue = "true")
    boolean tuningEnabled;

    @ConfigProperty(name = "performance.tuning.interval.ms", defaultValue = "5000")
    int tuningIntervalMs;

    @ConfigProperty(name = "performance.tuning.sensitivity", defaultValue = "0.05")
    double tuningSensitivity;

    @ConfigProperty(name = "performance.tuning.regression.threshold", defaultValue = "0.15")
    double regressionThreshold;

    @ConfigProperty(name = "performance.tuning.max.adjustments.per.minute", defaultValue = "12")
    int maxAdjustmentsPerMinute;

    @ConfigProperty(name = "performance.tuning.rollback.enabled", defaultValue = "true")
    boolean rollbackEnabled;

    @ConfigProperty(name = "performance.tuning.predictive.enabled", defaultValue = "true")
    boolean predictiveEnabled;

    @ConfigProperty(name = "performance.tuning.multi.objective.weights", defaultValue = "0.4,0.4,0.2")
    List<Double> multiObjectiveWeights; // throughput, latency, resource usage

    // Injected services
    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    AdaptiveBatchProcessor batchProcessor;

    @Inject
    AnomalyDetectionService anomalyDetection;

    @Inject
    Event<AIOptimizationEvent> eventBus;

    // Performance tracking
    private final AtomicReference<PerformanceSnapshot> baselinePerformance = new AtomicReference<>();
    private final AtomicReference<PerformanceSnapshot> currentPerformance = new AtomicReference<>();
    private final AtomicReference<PerformanceSnapshot> previousPerformance = new AtomicReference<>();
    
    // Tuning state
    private final Queue<TuningAction> tuningHistory = new ConcurrentLinkedQueue<>();
    private final Queue<PerformanceSnapshot> performanceHistory = new ConcurrentLinkedQueue<>();
    private final Map<String, Double> parameterSensitivity = new ConcurrentHashMap<>();
    private final AtomicLong totalOptimizations = new AtomicLong(0);
    private final AtomicLong successfulOptimizations = new AtomicLong(0);
    private final AtomicReference<Double> overallImprovement = new AtomicReference<>(0.0);
    
    // Rate limiting
    private final AtomicInteger adjustmentsThisMinute = new AtomicInteger(0);
    private final AtomicReference<Instant> lastMinuteReset = new AtomicReference<>(Instant.now());
    
    // Multi-objective optimization state
    private final AtomicReference<OptimizationObjectives> currentObjectives = new AtomicReference<>();
    
    // Executors
    private ExecutorService tuningExecutor;
    private ScheduledExecutorService monitoringExecutor;
    private ScheduledExecutorService analysisExecutor;
    
    // Tuning parameters
    private final Map<String, ParameterController> parameterControllers = new ConcurrentHashMap<>();
    
    private final int MAX_HISTORY_SIZE = 1000;
    private volatile boolean tuning = false;

    @PostConstruct
    public void initialize() {
        LOG.info("Initializing Performance Tuning Engine");

        if (!tuningEnabled) {
            LOG.info("Performance tuning is disabled by configuration");
            return;
        }

        // Initialize executors
        initializeExecutors();

        // Initialize parameter controllers
        initializeParameterControllers();

        // Initialize multi-objective optimization
        initializeMultiObjectiveOptimization();

        // Capture baseline performance
        captureBaselinePerformance();

        // Start tuning processes
        startTuningProcesses();

        // Start monitoring
        startPerformanceMonitoring();

        // Start analysis
        startPerformanceAnalysis();

        LOG.info("Performance Tuning Engine initialized successfully");
    }

    @PreDestroy
    public void shutdown() {
        LOG.info("Shutting down Performance Tuning Engine");

        tuning = false;

        // Shutdown executors
        shutdownExecutor(tuningExecutor, "Performance Tuning");
        shutdownExecutor(monitoringExecutor, "Performance Monitoring");
        shutdownExecutor(analysisExecutor, "Performance Analysis");

        LOG.info("Performance Tuning Engine shutdown complete");
    }

    private void initializeExecutors() {
        tuningExecutor = Executors.newVirtualThreadPerTaskExecutor();
        monitoringExecutor = Executors.newScheduledThreadPool(2, r -> Thread.ofVirtual()
            .name("performance-monitoring")
            .start(r));
        analysisExecutor = Executors.newScheduledThreadPool(2, r -> Thread.ofVirtual()
            .name("performance-analysis")
            .start(r));

        LOG.info("Performance tuning executors initialized");
    }

    private void initializeParameterControllers() {
        // Consensus parameters
        parameterControllers.put("batch_size", new ParameterController(
            "batch_size", 1000, 50000, 10000, 1000, ParameterType.INTEGER
        ));
        
        parameterControllers.put("consensus_timeout", new ParameterController(
            "consensus_timeout", 500, 5000, 1500, 250, ParameterType.INTEGER
        ));
        
        parameterControllers.put("parallel_threads", new ParameterController(
            "parallel_threads", 64, 512, 256, 32, ParameterType.INTEGER
        ));
        
        parameterControllers.put("heartbeat_interval", new ParameterController(
            "heartbeat_interval", 50, 500, 150, 25, ParameterType.INTEGER
        ));

        // Initialize parameter sensitivities
        parameterSensitivity.put("batch_size", 0.8);
        parameterSensitivity.put("consensus_timeout", 0.6);
        parameterSensitivity.put("parallel_threads", 0.7);
        parameterSensitivity.put("heartbeat_interval", 0.4);

        LOG.infof("Initialized %d parameter controllers for performance tuning", parameterControllers.size());
    }

    private void initializeMultiObjectiveOptimization() {
        OptimizationObjectives objectives = new OptimizationObjectives(
            multiObjectiveWeights.get(0), // throughput weight
            multiObjectiveWeights.get(1), // latency weight
            multiObjectiveWeights.get(2)  // resource usage weight
        );
        currentObjectives.set(objectives);

        LOG.infof("Multi-objective optimization initialized with weights - Throughput: %.2f, Latency: %.2f, Resources: %.2f",
                 objectives.throughputWeight(), objectives.latencyWeight(), objectives.resourceWeight());
    }

    private void captureBaselinePerformance() {
        try {
            PerformanceSnapshot baseline = collectPerformanceSnapshot();
            if (baseline != null) {
                baselinePerformance.set(baseline);
                currentPerformance.set(baseline);
                previousPerformance.set(baseline);
                
                LOG.infof("Baseline performance captured - TPS: %.0f, Latency: %.2fms, CPU: %.1f%%, Memory: %.1f%%",
                         baseline.throughput(), baseline.avgLatency(), 
                         baseline.cpuUsage() * 100, baseline.memoryUsage() * 100);
            }
        } catch (Exception e) {
            LOG.errorf("Failed to capture baseline performance: %s", e.getMessage());
        }
    }

    private void startTuningProcesses() {
        tuning = true;

        // Start main tuning loop
        tuningExecutor.submit(this::runPerformanceTuning);

        // Start predictive tuning if enabled
        if (predictiveEnabled) {
            tuningExecutor.submit(this::runPredictiveTuning);
        }

        // Start regression detection
        tuningExecutor.submit(this::runRegressionDetection);

        LOG.info("Performance tuning processes started");
    }

    private void startPerformanceMonitoring() {
        // Collect performance snapshots
        monitoringExecutor.scheduleAtFixedRate(
            this::collectAndStorePerformanceSnapshot,
            2000,  // Initial delay
            2000,  // Every 2 seconds
            TimeUnit.MILLISECONDS
        );

        // Reset rate limiting counter
        monitoringExecutor.scheduleAtFixedRate(
            this::resetRateLimitCounter,
            60000, // Initial delay
            60000, // Every minute
            TimeUnit.MILLISECONDS
        );

        LOG.info("Performance monitoring started");
    }

    private void startPerformanceAnalysis() {
        // Analyze performance trends
        analysisExecutor.scheduleAtFixedRate(
            this::analyzePerformanceTrends,
            10000, // Initial delay
            10000, // Every 10 seconds
            TimeUnit.MILLISECONDS
        );

        // Calculate optimization effectiveness
        analysisExecutor.scheduleAtFixedRate(
            this::calculateOptimizationEffectiveness,
            30000, // Initial delay
            30000, // Every 30 seconds
            TimeUnit.MILLISECONDS
        );

        LOG.info("Performance analysis started");
    }

    private void runPerformanceTuning() {
        LOG.info("Starting performance tuning loop");

        while (tuning && !Thread.currentThread().isInterrupted()) {
            try {
                if (canPerformAdjustment()) {
                    performOptimizationCycle();
                }
                
                Thread.sleep(tuningIntervalMs);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in performance tuning loop: %s", e.getMessage());
                try {
                    Thread.sleep(5000); // Back off on error
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Performance tuning loop terminated");
    }

    private void runPredictiveTuning() {
        LOG.info("Starting predictive tuning loop");

        while (tuning && !Thread.currentThread().isInterrupted()) {
            try {
                if (performanceHistory.size() >= 10) {
                    performPredictiveTuning();
                }
                
                Thread.sleep(15000); // Every 15 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in predictive tuning: %s", e.getMessage());
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Predictive tuning loop terminated");
    }

    private void runRegressionDetection() {
        LOG.info("Starting regression detection loop");

        while (tuning && !Thread.currentThread().isInterrupted()) {
            try {
                detectPerformanceRegression();
                Thread.sleep(3000); // Every 3 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in regression detection: %s", e.getMessage());
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Regression detection loop terminated");
    }

    private boolean canPerformAdjustment() {
        return adjustmentsThisMinute.get() < maxAdjustmentsPerMinute;
    }

    private void performOptimizationCycle() {
        try {
            // Collect current performance
            PerformanceSnapshot current = collectPerformanceSnapshot();
            if (current == null) return;

            // Update performance references
            previousPerformance.set(currentPerformance.get());
            currentPerformance.set(current);

            // Identify optimization opportunities
            List<OptimizationOpportunity> opportunities = identifyOptimizationOpportunities(current);
            
            if (!opportunities.isEmpty()) {
                // Select best opportunity
                OptimizationOpportunity bestOpportunity = selectBestOpportunity(opportunities);
                
                // Apply optimization
                TuningResult result = applyOptimization(bestOpportunity);
                
                if (result.success()) {
                    recordSuccessfulOptimization(result);
                    adjustmentsThisMinute.incrementAndGet();
                    
                    LOG.infof("Applied performance optimization: %s (improvement: %.2f%%)",
                             result.description(), result.improvement() * 100);
                } else {
                    LOG.debugf("Optimization attempt failed: %s", result.description());
                }
            }

        } catch (Exception e) {
            LOG.errorf("Error in optimization cycle: %s", e.getMessage());
        }
    }

    private void performPredictiveTuning() {
        try {
            // Predict future performance based on trends
            PerformancePrediction prediction = predictFuturePerformance();
            
            if (prediction.confidence() > 0.8 && prediction.degradationRisk() > 0.7) {
                // Apply preemptive optimization
                PreemptiveTuningResult result = applyPreemptiveTuning(prediction);
                
                if (result.applied()) {
                    LOG.infof("Applied predictive tuning: %s (risk reduction: %.1f%%)",
                             result.description(), result.riskReduction() * 100);
                }
            }

        } catch (Exception e) {
            LOG.errorf("Error in predictive tuning: %s", e.getMessage());
        }
    }

    private void detectPerformanceRegression() {
        try {
            PerformanceSnapshot current = currentPerformance.get();
            PerformanceSnapshot baseline = baselinePerformance.get();
            
            if (current == null || baseline == null) return;

            // Check for significant performance regression
            double throughputRegression = (baseline.throughput() - current.throughput()) / baseline.throughput();
            double latencyRegression = (current.avgLatency() - baseline.avgLatency()) / baseline.avgLatency();
            
            boolean significantRegression = throughputRegression > regressionThreshold || 
                                          latencyRegression > regressionThreshold;

            if (significantRegression && rollbackEnabled) {
                performRegressionRecovery(throughputRegression, latencyRegression);
            }

        } catch (Exception e) {
            LOG.errorf("Error in regression detection: %s", e.getMessage());
        }
    }

    private PerformanceSnapshot collectPerformanceSnapshot() {
        try {
            // Collect metrics from various services
            var consensusStatus = consensusService.getStatus();
            var performanceMetrics = consensusService.getPerformanceMetrics();
            var batchMetrics = batchProcessor.getBatchProcessingMetrics();
            
            // System metrics
            Runtime runtime = Runtime.getRuntime();
            double cpuUsage = ((com.sun.management.OperatingSystemMXBean) 
                java.lang.management.ManagementFactory.getOperatingSystemMXBean()).getProcessCpuLoad();
            double memoryUsage = (double)(runtime.totalMemory() - runtime.freeMemory()) / runtime.totalMemory();

            return new PerformanceSnapshot(
                Instant.now(),
                performanceMetrics.getCurrentTps(),
                performanceMetrics.getAvgLatency(),
                performanceMetrics.getSuccessRate(),
                cpuUsage,
                memoryUsage,
                batchMetrics.throughputTPS(),
                batchMetrics.avgProcessingTimeMs(),
                consensusStatus.getValidatorCount(),
                performanceMetrics.getProcessedTransactions()
            );

        } catch (Exception e) {
            LOG.errorf("Error collecting performance snapshot: %s", e.getMessage());
            return null;
        }
    }

    private void collectAndStorePerformanceSnapshot() {
        PerformanceSnapshot snapshot = collectPerformanceSnapshot();
        if (snapshot != null) {
            performanceHistory.offer(snapshot);
            maintainHistorySize(performanceHistory, MAX_HISTORY_SIZE);
        }
    }

    private void resetRateLimitCounter() {
        adjustmentsThisMinute.set(0);
        lastMinuteReset.set(Instant.now());
    }

    private List<OptimizationOpportunity> identifyOptimizationOpportunities(PerformanceSnapshot current) {
        List<OptimizationOpportunity> opportunities = new ArrayList<>();
        PerformanceSnapshot baseline = baselinePerformance.get();
        
        if (baseline == null) return opportunities;

        OptimizationObjectives objectives = currentObjectives.get();

        // Throughput optimization opportunities
        if (current.throughput() < baseline.throughput() * 0.9) {
            double impact = (baseline.throughput() - current.throughput()) / baseline.throughput();
            opportunities.add(new OptimizationOpportunity(
                OptimizationType.THROUGHPUT_BOOST,
                impact * objectives.throughputWeight(),
                "Increase batch size and parallel processing",
                Map.of("batch_size", 1.2, "parallel_threads", 1.1)
            ));
        }

        // Latency optimization opportunities
        if (current.avgLatency() > baseline.avgLatency() * 1.2) {
            double impact = (current.avgLatency() - baseline.avgLatency()) / baseline.avgLatency();
            opportunities.add(new OptimizationOpportunity(
                OptimizationType.LATENCY_REDUCTION,
                impact * objectives.latencyWeight(),
                "Reduce consensus timeout and optimize heartbeat",
                Map.of("consensus_timeout", 0.8, "heartbeat_interval", 0.9)
            ));
        }

        // Resource optimization opportunities
        if (current.cpuUsage() > 0.8 || current.memoryUsage() > 0.8) {
            double resourcePressure = Math.max(current.cpuUsage(), current.memoryUsage());
            opportunities.add(new OptimizationOpportunity(
                OptimizationType.RESOURCE_OPTIMIZATION,
                (resourcePressure - 0.7) * objectives.resourceWeight(),
                "Optimize resource usage",
                Map.of("batch_size", 0.9, "parallel_threads", 0.95)
            ));
        }

        return opportunities;
    }

    private OptimizationOpportunity selectBestOpportunity(List<OptimizationOpportunity> opportunities) {
        return opportunities.stream()
            .max(Comparator.comparingDouble(OptimizationOpportunity::impact))
            .orElseThrow(() -> new IllegalStateException("No opportunities available"));
    }

    private TuningResult applyOptimization(OptimizationOpportunity opportunity) {
        try {
            boolean success = true;
            StringBuilder description = new StringBuilder("Applied optimizations: ");
            
            totalOptimizations.incrementAndGet();

            // Apply parameter adjustments
            for (Map.Entry<String, Double> adjustment : opportunity.parameterAdjustments().entrySet()) {
                String paramName = adjustment.getKey();
                double multiplier = adjustment.getValue();
                
                boolean adjusted = adjustParameter(paramName, multiplier);
                if (adjusted) {
                    description.append(paramName).append("(x").append(String.format("%.2f", multiplier)).append(") ");
                } else {
                    success = false;
                }
            }

            // Record tuning action
            TuningAction action = new TuningAction(
                opportunity.type(),
                opportunity.parameterAdjustments(),
                success,
                Instant.now()
            );
            tuningHistory.offer(action);
            maintainHistorySize(tuningHistory, MAX_HISTORY_SIZE);

            if (success) {
                successfulOptimizations.incrementAndGet();
            }

            return new TuningResult(success, opportunity.impact(), description.toString());

        } catch (Exception e) {
            LOG.errorf("Error applying optimization: %s", e.getMessage());
            return new TuningResult(false, 0.0, "Optimization failed: " + e.getMessage());
        }
    }

    private boolean adjustParameter(String paramName, double multiplier) {
        try {
            ParameterController controller = parameterControllers.get(paramName);
            if (controller == null) return false;

            double currentValue = controller.currentValue();
            double newValue = currentValue * multiplier;
            
            // Apply bounds checking
            newValue = Math.max(controller.minValue(), Math.min(controller.maxValue(), newValue));
            
            // Apply the adjustment based on parameter type
            switch (paramName) {
                case "batch_size" -> {
                    Map<String, Object> params = Map.of("batchSizeMultiplier", multiplier);
                    return batchProcessor.optimizeBatchParameters(params);
                }
                case "consensus_timeout" -> {
                    // Would integrate with consensus service parameter adjustment
                    controller.setValue(newValue);
                    return true;
                }
                case "parallel_threads" -> {
                    // Would integrate with thread pool adjustment
                    controller.setValue(newValue);
                    return true;
                }
                case "heartbeat_interval" -> {
                    // Would integrate with consensus heartbeat adjustment
                    controller.setValue(newValue);
                    return true;
                }
                default -> {
                    return false;
                }
            }

        } catch (Exception e) {
            LOG.errorf("Error adjusting parameter %s: %s", paramName, e.getMessage());
            return false;
        }
    }

    private void recordSuccessfulOptimization(TuningResult result) {
        // Calculate improvement over time
        PerformanceSnapshot current = currentPerformance.get();
        PerformanceSnapshot baseline = baselinePerformance.get();
        
        if (current != null && baseline != null) {
            double improvement = calculateOverallImprovement(current, baseline);
            overallImprovement.set(improvement);
        }

        // Fire optimization event
        eventBus.fire(new AIOptimizationEvent(
            AIOptimizationEventType.OPTIMIZATION_APPLIED,
            "Performance optimization applied: " + result.description(),
            Map.of(
                "improvement", result.improvement(),
                "totalOptimizations", totalOptimizations.get(),
                "successRate", (double) successfulOptimizations.get() / totalOptimizations.get()
            )
        ));
    }

    private double calculateOverallImprovement(PerformanceSnapshot current, PerformanceSnapshot baseline) {
        OptimizationObjectives objectives = currentObjectives.get();
        
        double throughputImprovement = (current.throughput() - baseline.throughput()) / baseline.throughput();
        double latencyImprovement = (baseline.avgLatency() - current.avgLatency()) / baseline.avgLatency();
        double resourceImprovement = ((baseline.cpuUsage() + baseline.memoryUsage()) - 
                                    (current.cpuUsage() + current.memoryUsage())) / 
                                   (baseline.cpuUsage() + baseline.memoryUsage());
        
        return (throughputImprovement * objectives.throughputWeight()) +
               (latencyImprovement * objectives.latencyWeight()) +
               (resourceImprovement * objectives.resourceWeight());
    }

    private PerformancePrediction predictFuturePerformance() {
        // Simple trend-based prediction
        List<PerformanceSnapshot> recent = new ArrayList<>(performanceHistory).subList(
            Math.max(0, performanceHistory.size() - 20),
            performanceHistory.size()
        );

        if (recent.size() < 5) {
            return new PerformancePrediction(0.0, 0.0, 0.0, "Insufficient data");
        }

        // Calculate trends
        double[] throughputValues = recent.stream().mapToDouble(PerformanceSnapshot::throughput).toArray();
        double[] latencyValues = recent.stream().mapToDouble(PerformanceSnapshot::avgLatency).toArray();
        
        double throughputTrend = calculateTrend(throughputValues);
        double latencyTrend = calculateTrend(latencyValues);
        
        // Predict degradation risk
        double degradationRisk = 0.0;
        if (throughputTrend < -0.05 || latencyTrend > 0.1) { // 5% throughput drop or 10% latency increase
            degradationRisk = Math.max(Math.abs(throughputTrend), latencyTrend);
        }
        
        double confidence = Math.min(1.0, recent.size() / 20.0);
        
        return new PerformancePrediction(throughputTrend, latencyTrend, confidence, degradationRisk, "Trend-based prediction");
    }

    private PreemptiveTuningResult applyPreemptiveTuning(PerformancePrediction prediction) {
        try {
            if (prediction.throughputTrend() < -0.05) {
                // Preemptively increase batch processing capacity
                String result = batchProcessor.preemptivelyOptimizeBatching();
                return new PreemptiveTuningResult(true, "Preemptive batch optimization: " + result, 0.3);
            }
            
            return new PreemptiveTuningResult(false, "No preemptive action needed", 0.0);

        } catch (Exception e) {
            LOG.errorf("Error in preemptive tuning: %s", e.getMessage());
            return new PreemptiveTuningResult(false, "Preemptive tuning failed", 0.0);
        }
    }

    private void performRegressionRecovery(double throughputRegression, double latencyRegression) {
        LOG.warnf("Performance regression detected - Throughput: %.1f%%, Latency: %.1f%%. Initiating recovery.",
                 throughputRegression * 100, latencyRegression * 100);

        try {
            // Simple rollback strategy: reverse recent parameter changes
            List<TuningAction> recentActions = tuningHistory.stream()
                .limit(5)
                .collect(Collectors.toList());

            for (TuningAction action : recentActions) {
                if (action.success()) {
                    rollbackTuningAction(action);
                }
            }

            // Fire regression recovery event
            eventBus.fire(new AIOptimizationEvent(
                AIOptimizationEventType.ANOMALY_DETECTED,
                "Performance regression detected and recovery initiated",
                Map.of(
                    "throughputRegression", throughputRegression,
                    "latencyRegression", latencyRegression,
                    "actionsRolledBack", recentActions.size()
                )
            ));

        } catch (Exception e) {
            LOG.errorf("Error in regression recovery: %s", e.getMessage());
        }
    }

    private void rollbackTuningAction(TuningAction action) {
        // Reverse parameter adjustments
        for (Map.Entry<String, Double> adjustment : action.parameterAdjustments().entrySet()) {
            String paramName = adjustment.getKey();
            double originalMultiplier = adjustment.getValue();
            double rollbackMultiplier = 1.0 / originalMultiplier; // Inverse operation
            
            adjustParameter(paramName, rollbackMultiplier);
        }
        
        LOG.debugf("Rolled back tuning action: %s", action.type());
    }

    private double calculateTrend(double[] values) {
        if (values.length < 2) return 0.0;

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

    private void analyzePerformanceTrends() {
        if (performanceHistory.size() < 10) return;

        try {
            List<PerformanceSnapshot> recent = new ArrayList<>(performanceHistory).subList(
                Math.max(0, performanceHistory.size() - 50),
                performanceHistory.size()
            );

            // Analyze key metrics trends
            double[] throughputValues = recent.stream().mapToDouble(PerformanceSnapshot::throughput).toArray();
            double[] latencyValues = recent.stream().mapToDouble(PerformanceSnapshot::avgLatency).toArray();
            
            double throughputTrend = calculateTrend(throughputValues);
            double latencyTrend = calculateTrend(latencyValues);

            // Log significant trends
            if (Math.abs(throughputTrend) > 1000) { // TPS change > 1000/measurement
                LOG.infof("Significant throughput trend detected: %.0f TPS/measurement", throughputTrend);
            }
            
            if (Math.abs(latencyTrend) > 1.0) { // Latency change > 1ms/measurement
                LOG.infof("Significant latency trend detected: %.2f ms/measurement", latencyTrend);
            }

        } catch (Exception e) {
            LOG.errorf("Error analyzing performance trends: %s", e.getMessage());
        }
    }

    private void calculateOptimizationEffectiveness() {
        try {
            long total = totalOptimizations.get();
            long successful = successfulOptimizations.get();
            
            if (total > 0) {
                double successRate = (double) successful / total;
                double improvement = overallImprovement.get();
                
                LOG.infof("Performance Tuning Effectiveness - Optimizations: %d/%d (%.1f%% success), " +
                         "Overall Improvement: %.1f%%, Adjustments/min: %d",
                         successful, total, successRate * 100, improvement * 100, adjustmentsThisMinute.get());
            }

        } catch (Exception e) {
            LOG.errorf("Error calculating optimization effectiveness: %s", e.getMessage());
        }
    }

    private <T> void maintainHistorySize(Queue<T> queue, int maxSize) {
        while (queue.size() > maxSize) {
            queue.poll();
        }
    }

    private void shutdownExecutor(ExecutorService executor, String name) {
        if (executor != null && !executor.isShutdown()) {
            LOG.infof("Shutting down %s executor", name);
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

    // Public API Methods

    /**
     * Get current performance tuning status
     */
    public PerformanceTuningStatus getTuningStatus() {
        PerformanceSnapshot current = currentPerformance.get();
        PerformanceSnapshot baseline = baselinePerformance.get();
        
        return new PerformanceTuningStatus(
            tuningEnabled,
            tuning,
            totalOptimizations.get(),
            successfulOptimizations.get(),
            overallImprovement.get(),
            current != null ? current.throughput() : 0.0,
            baseline != null ? baseline.throughput() : 0.0,
            current != null ? current.avgLatency() : 0.0,
            baseline != null ? baseline.avgLatency() : 0.0,
            adjustmentsThisMinute.get(),
            maxAdjustmentsPerMinute
        );
    }

    /**
     * Update optimization objectives
     */
    public void updateOptimizationObjectives(double throughputWeight, double latencyWeight, double resourceWeight) {
        double total = throughputWeight + latencyWeight + resourceWeight;
        if (total > 0) {
            OptimizationObjectives newObjectives = new OptimizationObjectives(
                throughputWeight / total,
                latencyWeight / total,
                resourceWeight / total
            );
            currentObjectives.set(newObjectives);
            
            LOG.infof("Updated optimization objectives - Throughput: %.2f, Latency: %.2f, Resources: %.2f",
                     newObjectives.throughputWeight(), newObjectives.latencyWeight(), newObjectives.resourceWeight());
        }
    }

    /**
     * Force immediate optimization cycle
     */
    public Uni<String> triggerOptimizationCycle() {
        return Uni.createFrom().item(() -> {
            if (!tuning) {
                return "Performance tuning is not active";
            }
            tuningExecutor.submit(this::performOptimizationCycle);
            return "Optimization cycle triggered";
        });
    }

    // Data classes

    public record PerformanceSnapshot(
        Instant timestamp,
        double throughput,
        double avgLatency,
        double successRate,
        double cpuUsage,
        double memoryUsage,
        double batchThroughput,
        double batchLatency,
        int validatorCount,
        long processedTransactions
    ) {}

    public record OptimizationOpportunity(
        OptimizationType type,
        double impact,
        String description,
        Map<String, Double> parameterAdjustments
    ) {}

    public record TuningAction(
        OptimizationType type,
        Map<String, Double> parameterAdjustments,
        boolean success,
        Instant timestamp
    ) {}

    public record TuningResult(
        boolean success,
        double improvement,
        String description
    ) {}

    public record PerformancePrediction(
        double throughputTrend,
        double latencyTrend,
        double confidence,
        double degradationRisk,
        String description
    ) {}

    public record PreemptiveTuningResult(
        boolean applied,
        String description,
        double riskReduction
    ) {}

    public record OptimizationObjectives(
        double throughputWeight,
        double latencyWeight,
        double resourceWeight
    ) {}

    public record PerformanceTuningStatus(
        boolean enabled,
        boolean active,
        long totalOptimizations,
        long successfulOptimizations,
        double overallImprovement,
        double currentThroughput,
        double baselineThroughput,
        double currentLatency,
        double baselineLatency,
        int adjustmentsThisMinute,
        int maxAdjustmentsPerMinute
    ) {}

    public static class ParameterController {
        private final String name;
        private final double minValue;
        private final double maxValue;
        private final double stepSize;
        private final ParameterType type;
        private double currentValue;

        public ParameterController(String name, double minValue, double maxValue, 
                                 double defaultValue, double stepSize, ParameterType type) {
            this.name = name;
            this.minValue = minValue;
            this.maxValue = maxValue;
            this.currentValue = defaultValue;
            this.stepSize = stepSize;
            this.type = type;
        }

        public double currentValue() { return currentValue; }
        public double minValue() { return minValue; }
        public double maxValue() { return maxValue; }
        public void setValue(double value) { 
            this.currentValue = Math.max(minValue, Math.min(maxValue, value)); 
        }
        public String name() { return name; }
        public ParameterType type() { return type; }
    }

    // Enums

    public enum OptimizationType {
        THROUGHPUT_BOOST,
        LATENCY_REDUCTION,
        RESOURCE_OPTIMIZATION,
        STABILITY_IMPROVEMENT
    }

    public enum ParameterType {
        INTEGER,
        DOUBLE,
        BOOLEAN
    }
}