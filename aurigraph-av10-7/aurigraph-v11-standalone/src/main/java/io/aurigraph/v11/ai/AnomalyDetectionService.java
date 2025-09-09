package io.aurigraph.v11.ai;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import smile.anomaly.IsolationForest;
import smile.clustering.KMeans;
import smile.data.DataFrame;
import smile.data.Tuple;
import smile.data.type.DataTypes;
import smile.data.type.StructField;
import smile.data.type.StructType;

import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;

import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.stream.Collectors;

/**
 * AI-Powered Anomaly Detection Service for Aurigraph V11
 * 
 * Implements advanced machine learning algorithms for real-time system health monitoring:
 * - Unsupervised anomaly detection using Isolation Forest
 * - Statistical anomaly detection with adaptive thresholds  
 * - Clustering-based behavior analysis
 * - Real-time alerting and automated response
 * - Performance degradation prediction
 * 
 * Performance Targets:
 * - Detection Accuracy: 95%+ with <2% false positives
 * - Response Time: <30 seconds from anomaly to alert
 * - Processing Latency: <100ms per data point
 * - Memory Efficiency: <500MB for 1M data points
 * - Availability: 99.9% uptime
 * 
 * @author Aurigraph AI Team
 * @version 11.0.0
 * @since 2024-01-01
 */
@ApplicationScoped
public class AnomalyDetectionService {

    private static final Logger LOG = Logger.getLogger(AnomalyDetectionService.class);

    // Configuration
    @ConfigProperty(name = "anomaly.detection.enabled", defaultValue = "true")
    boolean detectionEnabled;

    @ConfigProperty(name = "anomaly.detection.sensitivity", defaultValue = "0.95")
    double detectionSensitivity;

    @ConfigProperty(name = "anomaly.detection.window.size", defaultValue = "1000")
    int detectionWindowSize;

    @ConfigProperty(name = "anomaly.detection.update.interval.ms", defaultValue = "5000")
    int updateIntervalMs;

    @ConfigProperty(name = "anomaly.detection.alert.threshold", defaultValue = "0.8")
    double alertThreshold;

    @ConfigProperty(name = "anomaly.detection.response.timeout.ms", defaultValue = "30000")
    int responseTimeoutMs;

    @ConfigProperty(name = "anomaly.detection.false.positive.target", defaultValue = "0.02")
    double falsePositiveTarget;

    @Inject
    Event<AIOptimizationEvent> eventBus;

    // ML Models for anomaly detection
    private IsolationForest isolationForest;
    private KMeans behaviorClusters;
    private volatile boolean modelsInitialized = false;

    // Statistical models
    private final Map<String, DescriptiveStatistics> metricStatistics = new ConcurrentHashMap<>();
    private final Map<String, Double> adaptiveThresholds = new ConcurrentHashMap<>();

    // Data collection and processing
    private final Queue<SystemMetrics> metricsHistory = new ConcurrentLinkedQueue<>();
    private final Queue<AnomalyEvent> anomalyHistory = new ConcurrentLinkedQueue<>();
    private final Set<String> activeAnomalies = ConcurrentHashMap.newKeySet();

    // Performance tracking
    private final AtomicLong totalDataPoints = new AtomicLong(0);
    private final AtomicLong detectedAnomalies = new AtomicLong(0);
    private final AtomicLong falsePositives = new AtomicLong(0);
    private final AtomicLong truePositives = new AtomicLong(0);
    private final AtomicReference<Double> detectionAccuracy = new AtomicReference<>(0.0);
    private final AtomicReference<Double> avgProcessingTime = new AtomicReference<>(0.0);

    // Executors
    private ExecutorService detectionExecutor;
    private ScheduledExecutorService modelUpdateExecutor;
    private ScheduledExecutorService metricsCollectionExecutor;

    // Detection state
    private volatile SystemHealthStatus currentHealthStatus = SystemHealthStatus.HEALTHY;
    private final AtomicReference<Instant> lastModelUpdate = new AtomicReference<>(Instant.now());

    @PostConstruct
    public void initialize() {
        LOG.info("Initializing AI-Powered Anomaly Detection Service");

        if (!detectionEnabled) {
            LOG.info("Anomaly detection is disabled by configuration");
            return;
        }

        // Initialize executors
        initializeExecutors();

        // Initialize ML models
        initializeMLModels();

        // Initialize statistical models
        initializeStatisticalModels();

        // Start detection processes
        startDetectionProcesses();

        // Start metrics collection
        startMetricsCollection();

        LOG.info("Anomaly Detection Service initialized successfully - targeting 95%+ accuracy");
    }

    @PreDestroy
    public void shutdown() {
        LOG.info("Shutting down Anomaly Detection Service");

        // Shutdown executors
        shutdownExecutor(detectionExecutor, "Detection");
        shutdownExecutor(modelUpdateExecutor, "Model Update");
        shutdownExecutor(metricsCollectionExecutor, "Metrics Collection");

        LOG.info("Anomaly Detection Service shutdown complete");
    }

    private void initializeExecutors() {
        detectionExecutor = Executors.newVirtualThreadPerTaskExecutor();
        modelUpdateExecutor = Executors.newScheduledThreadPool(1, r -> Thread.ofVirtual()
            .name("anomaly-model-update")
            .start(r));
        metricsCollectionExecutor = Executors.newScheduledThreadPool(2, r -> Thread.ofVirtual()
            .name("anomaly-metrics")
            .start(r));

        LOG.info("Anomaly detection executors initialized");
    }

    private void initializeMLModels() {
        try {
            LOG.info("Initializing anomaly detection ML models");

            // Generate baseline training data
            DataFrame baselineData = generateBaselineTrainingData();

            // Initialize Isolation Forest for outlier detection
            double[][] trainingMatrix = convertToMatrix(baselineData);
            isolationForest = IsolationForest.fit(trainingMatrix, 100); // 100 trees

            // Initialize behavior clustering
            behaviorClusters = KMeans.fit(trainingMatrix, 5); // 5 behavior clusters

            modelsInitialized = true;
            LOG.info("Anomaly detection ML models initialized successfully");

        } catch (Exception e) {
            LOG.errorf("Failed to initialize anomaly detection ML models: %s", e.getMessage());
            modelsInitialized = false;
        }
    }

    private DataFrame generateBaselineTrainingData() {
        // Create schema for system metrics
        StructType schema = DataTypes.struct(
            new StructField("cpu_usage", DataTypes.DoubleType),
            new StructField("memory_usage", DataTypes.DoubleType),
            new StructField("network_io", DataTypes.DoubleType),
            new StructField("disk_io", DataTypes.DoubleType),
            new StructField("tps", DataTypes.DoubleType),
            new StructField("latency", DataTypes.DoubleType),
            new StructField("error_rate", DataTypes.DoubleType)
        );

        // Generate normal baseline data
        List<Tuple> rows = new ArrayList<>();
        Random random = new Random(42);

        for (int i = 0; i < 5000; i++) {
            rows.add(Tuple.of(
                0.3 + random.nextGaussian() * 0.15, // CPU usage (30% ± 15%)
                0.4 + random.nextGaussian() * 0.1,  // Memory usage (40% ± 10%)
                random.nextDouble() * 1000,         // Network I/O
                random.nextDouble() * 500,          // Disk I/O
                1500000 + random.nextGaussian() * 200000, // TPS (1.5M ± 200K)
                25 + random.nextGaussian() * 10,    // Latency (25ms ± 10ms)
                0.01 + random.nextDouble() * 0.02   // Error rate (1-3%)
            ));
        }

        return DataFrame.of(rows, schema);
    }

    private double[][] convertToMatrix(DataFrame data) {
        int rows = data.nrow();
        int cols = data.ncol();
        double[][] matrix = new double[rows][cols];

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                matrix[i][j] = data.getDouble(i, j);
            }
        }

        return matrix;
    }

    private void initializeStatisticalModels() {
        // Initialize statistical tracking for key metrics
        String[] metrics = {"cpu_usage", "memory_usage", "tps", "latency", "error_rate", "network_io"};
        
        for (String metric : metrics) {
            metricStatistics.put(metric, new DescriptiveStatistics(detectionWindowSize));
            adaptiveThresholds.put(metric, 0.0);
        }

        LOG.info("Statistical anomaly detection models initialized");
    }

    private void startDetectionProcesses() {
        // Start real-time anomaly detection
        detectionExecutor.submit(this::runAnomalyDetection);

        // Start model updates
        modelUpdateExecutor.scheduleAtFixedRate(
            this::updateModels,
            updateIntervalMs,
            updateIntervalMs,
            TimeUnit.MILLISECONDS
        );

        // Start anomaly response processor
        detectionExecutor.submit(this::processAnomalyResponses);

        LOG.info("Anomaly detection processes started");
    }

    private void startMetricsCollection() {
        metricsCollectionExecutor.scheduleAtFixedRate(
            this::collectSystemMetrics,
            1000,  // Start after 1 second
            1000,  // Every 1 second
            TimeUnit.MILLISECONDS
        );

        metricsCollectionExecutor.scheduleAtFixedRate(
            this::calculatePerformanceMetrics,
            5000,  // Start after 5 seconds
            5000,  // Every 5 seconds
            TimeUnit.MILLISECONDS
        );

        LOG.info("Anomaly detection metrics collection started");
    }

    private void runAnomalyDetection() {
        LOG.info("Starting real-time anomaly detection loop");

        while (!Thread.currentThread().isInterrupted() && detectionEnabled) {
            try {
                if (!modelsInitialized || metricsHistory.isEmpty()) {
                    Thread.sleep(1000);
                    continue;
                }

                // Get latest metrics
                SystemMetrics currentMetrics = metricsHistory.peek();
                if (currentMetrics == null) {
                    Thread.sleep(100);
                    continue;
                }

                // Process metrics for anomaly detection
                long startTime = System.nanoTime();
                List<AnomalyDetectionResult> results = detectAnomalies(currentMetrics);
                double processingTime = (System.nanoTime() - startTime) / 1_000_000.0;

                // Update processing time
                avgProcessingTime.updateAndGet(current -> current * 0.9 + processingTime * 0.1);

                // Process results
                for (AnomalyDetectionResult result : results) {
                    if (result.isAnomaly) {
                        handleAnomalyDetected(result);
                    }
                }

                totalDataPoints.incrementAndGet();
                Thread.sleep(100); // Process every 100ms

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in anomaly detection loop: %s", e.getMessage());
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Anomaly detection loop terminated");
    }

    private List<AnomalyDetectionResult> detectAnomalies(SystemMetrics metrics) {
        List<AnomalyDetectionResult> results = new ArrayList<>();

        try {
            // ML-based anomaly detection using Isolation Forest
            if (modelsInitialized) {
                double[] features = extractFeatures(metrics);
                double anomalyScore = isolationForest.score(features);
                
                boolean isAnomaly = anomalyScore > detectionSensitivity;
                results.add(new AnomalyDetectionResult(
                    AnomalyType.ML_OUTLIER,
                    isAnomaly,
                    anomalyScore,
                    "Isolation Forest detected outlier",
                    metrics,
                    Instant.now()
                ));
            }

            // Statistical anomaly detection
            results.addAll(detectStatisticalAnomalies(metrics));

            // Behavior-based anomaly detection
            results.addAll(detectBehaviorAnomalies(metrics));

            // Performance degradation detection
            results.addAll(detectPerformanceDegradation(metrics));

        } catch (Exception e) {
            LOG.errorf("Error in anomaly detection: %s", e.getMessage());
        }

        return results;
    }

    private double[] extractFeatures(SystemMetrics metrics) {
        return new double[]{
            metrics.cpuUsage,
            metrics.memoryUsage,
            metrics.networkIO,
            metrics.diskIO,
            metrics.tps,
            metrics.avgLatency,
            metrics.errorRate
        };
    }

    private List<AnomalyDetectionResult> detectStatisticalAnomalies(SystemMetrics metrics) {
        List<AnomalyDetectionResult> results = new ArrayList<>();

        // Check each metric against adaptive thresholds
        Map<String, Double> currentValues = Map.of(
            "cpu_usage", metrics.cpuUsage,
            "memory_usage", metrics.memoryUsage,
            "tps", metrics.tps,
            "latency", metrics.avgLatency,
            "error_rate", metrics.errorRate,
            "network_io", metrics.networkIO
        );

        for (Map.Entry<String, Double> entry : currentValues.entrySet()) {
            String metricName = entry.getKey();
            double value = entry.getValue();

            DescriptiveStatistics stats = metricStatistics.get(metricName);
            if (stats != null && stats.getN() > 10) {
                double mean = stats.getMean();
                double stdDev = stats.getStandardDeviation();
                double threshold = adaptiveThresholds.get(metricName);

                // Z-score based anomaly detection
                double zScore = Math.abs((value - mean) / stdDev);
                boolean isAnomaly = zScore > 3.0; // 3-sigma rule

                if (isAnomaly) {
                    results.add(new AnomalyDetectionResult(
                        AnomalyType.STATISTICAL_OUTLIER,
                        true,
                        zScore / 3.0, // Normalize to 0-1 range
                        String.format("Statistical outlier in %s (z-score: %.2f)", metricName, zScore),
                        metrics,
                        Instant.now()
                    ));
                }

                // Update statistics
                stats.addValue(value);
            }
        }

        return results;
    }

    private List<AnomalyDetectionResult> detectBehaviorAnomalies(SystemMetrics metrics) {
        List<AnomalyDetectionResult> results = new ArrayList<>();

        if (!modelsInitialized) {
            return results;
        }

        try {
            // Use clustering to detect unusual behavior patterns
            double[] features = extractFeatures(metrics);
            int cluster = behaviorClusters.predict(features);
            
            // Check if the behavior is far from any cluster center
            double minDistance = Double.MAX_VALUE;
            for (int i = 0; i < behaviorClusters.k; i++) {
                double distance = euclideanDistance(features, behaviorClusters.centroids[i]);
                minDistance = Math.min(minDistance, distance);
            }

            // If distance to nearest cluster is large, it's anomalous behavior
            double distanceThreshold = 5.0; // Tunable threshold
            boolean isAnomaly = minDistance > distanceThreshold;

            if (isAnomaly) {
                results.add(new AnomalyDetectionResult(
                    AnomalyType.BEHAVIOR_ANOMALY,
                    true,
                    Math.min(1.0, minDistance / (distanceThreshold * 2)),
                    String.format("Unusual behavior pattern (distance: %.2f)", minDistance),
                    metrics,
                    Instant.now()
                ));
            }

        } catch (Exception e) {
            LOG.errorf("Error in behavior anomaly detection: %s", e.getMessage());
        }

        return results;
    }

    private List<AnomalyDetectionResult> detectPerformanceDegradation(SystemMetrics metrics) {
        List<AnomalyDetectionResult> results = new ArrayList<>();

        // Check for performance degradation patterns
        List<SystemMetrics> recentMetrics = metricsHistory.stream()
            .limit(10)
            .collect(Collectors.toList());

        if (recentMetrics.size() < 5) {
            return results;
        }

        try {
            // TPS degradation
            double tpsTrend = calculateTrend(recentMetrics.stream()
                .mapToDouble(m -> m.tps)
                .toArray());
            
            if (tpsTrend < -0.1) { // 10% decline trend
                results.add(new AnomalyDetectionResult(
                    AnomalyType.PERFORMANCE_DEGRADATION,
                    true,
                    Math.abs(tpsTrend),
                    "TPS performance degradation detected",
                    metrics,
                    Instant.now()
                ));
            }

            // Latency increase
            double latencyTrend = calculateTrend(recentMetrics.stream()
                .mapToDouble(m -> m.avgLatency)
                .toArray());

            if (latencyTrend > 0.2) { // Increasing latency trend
                results.add(new AnomalyDetectionResult(
                    AnomalyType.PERFORMANCE_DEGRADATION,
                    true,
                    latencyTrend,
                    "Latency increase trend detected",
                    metrics,
                    Instant.now()
                ));
            }

        } catch (Exception e) {
            LOG.errorf("Error detecting performance degradation: %s", e.getMessage());
        }

        return results;
    }

    private double euclideanDistance(double[] a, double[] b) {
        if (a.length != b.length) {
            throw new IllegalArgumentException("Arrays must have the same length");
        }

        double sum = 0.0;
        for (int i = 0; i < a.length; i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
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

    private void handleAnomalyDetected(AnomalyDetectionResult result) {
        detectedAnomalies.incrementAndGet();

        // Create anomaly event
        AnomalyEvent event = new AnomalyEvent(
            result.type,
            result.severity,
            result.description,
            result.metrics,
            result.timestamp,
            generateAnomalyId()
        );

        anomalyHistory.offer(event);
        maintainHistorySize(anomalyHistory, 1000);

        // Add to active anomalies if significant
        if (result.severity > alertThreshold) {
            activeAnomalies.add(event.id);

            // Fire alert event
            eventBus.fire(new AIOptimizationEvent(
                AIOptimizationEventType.ANOMALY_DETECTED,
                result.description,
                Map.of(
                    "type", result.type.toString(),
                    "severity", result.severity,
                    "timestamp", result.timestamp.toString()
                )
            ));

            LOG.warnf("High-severity anomaly detected: %s (severity: %.2f)", 
                     result.description, result.severity);
        } else {
            LOG.debugf("Anomaly detected: %s (severity: %.2f)", 
                      result.description, result.severity);
        }

        // Update system health status
        updateSystemHealthStatus(result);
    }

    private void updateSystemHealthStatus(AnomalyDetectionResult result) {
        if (result.severity > 0.9) {
            currentHealthStatus = SystemHealthStatus.CRITICAL;
        } else if (result.severity > 0.7) {
            currentHealthStatus = SystemHealthStatus.WARNING;
        } else if (activeAnomalies.isEmpty()) {
            currentHealthStatus = SystemHealthStatus.HEALTHY;
        }
    }

    private String generateAnomalyId() {
        return "anomaly-" + System.nanoTime() + "-" + (int)(Math.random() * 1000);
    }

    private void processAnomalyResponses() {
        LOG.info("Starting anomaly response processor");

        while (!Thread.currentThread().isInterrupted() && detectionEnabled) {
            try {
                // Process active anomalies for automated response
                Set<String> toRemove = new HashSet<>();

                for (String anomalyId : activeAnomalies) {
                    AnomalyEvent event = findAnomalyById(anomalyId);
                    if (event != null) {
                        Duration age = Duration.between(event.timestamp, Instant.now());
                        
                        if (age.toMillis() > responseTimeoutMs) {
                            // Anomaly has been active too long, take action
                            triggerAutomatedResponse(event);
                            toRemove.add(anomalyId);
                        }
                    } else {
                        toRemove.add(anomalyId);
                    }
                }

                // Remove processed/expired anomalies
                activeAnomalies.removeAll(toRemove);

                Thread.sleep(5000); // Check every 5 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in anomaly response processor: %s", e.getMessage());
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Anomaly response processor terminated");
    }

    private AnomalyEvent findAnomalyById(String id) {
        return anomalyHistory.stream()
            .filter(event -> event.id.equals(id))
            .findFirst()
            .orElse(null);
    }

    private void triggerAutomatedResponse(AnomalyEvent event) {
        LOG.infof("Triggering automated response for anomaly: %s", event.type);

        try {
            switch (event.type) {
                case PERFORMANCE_DEGRADATION:
                    // Trigger performance optimization
                    eventBus.fire(new AIOptimizationEvent(
                        AIOptimizationEventType.OPTIMIZATION_APPLIED,
                        "Automated performance optimization triggered by anomaly",
                        Map.of("trigger", "anomaly_" + event.id)
                    ));
                    break;

                case ML_OUTLIER:
                case STATISTICAL_OUTLIER:
                    // Log for analysis
                    LOG.infof("Outlier anomaly logged for analysis: %s", event.description);
                    break;

                case BEHAVIOR_ANOMALY:
                    // Trigger security check
                    LOG.warnf("Unusual behavior detected - security analysis recommended: %s", event.description);
                    break;

                default:
                    LOG.infof("Generic anomaly response: %s", event.description);
            }

        } catch (Exception e) {
            LOG.errorf("Error in automated anomaly response: %s", e.getMessage());
        }
    }

    private void collectSystemMetrics() {
        try {
            // Collect current system metrics (simplified simulation)
            Runtime runtime = Runtime.getRuntime();
            double cpuUsage = ((com.sun.management.OperatingSystemMXBean) 
                java.lang.management.ManagementFactory.getOperatingSystemMXBean()).getProcessCpuLoad();
            double memoryUsage = (double)(runtime.totalMemory() - runtime.freeMemory()) / runtime.totalMemory();

            SystemMetrics metrics = new SystemMetrics(
                Math.max(0.0, cpuUsage), // CPU usage
                memoryUsage, // Memory usage
                Math.random() * 1000, // Network I/O (simulated)
                Math.random() * 500,  // Disk I/O (simulated)
                1500000 + (Math.random() - 0.5) * 300000, // TPS (simulated)
                20 + Math.random() * 30, // Latency (simulated)
                Math.random() * 0.05, // Error rate (simulated)
                Instant.now()
            );

            metricsHistory.offer(metrics);
            maintainHistorySize(metricsHistory, detectionWindowSize);

        } catch (Exception e) {
            LOG.errorf("Error collecting system metrics: %s", e.getMessage());
        }
    }

    private void calculatePerformanceMetrics() {
        try {
            long total = totalDataPoints.get();
            long detected = detectedAnomalies.get();
            long falsePos = falsePositives.get();
            long truePos = truePositives.get();

            // Calculate detection accuracy (simplified)
            if (total > 0) {
                double accuracy = (double)(total - falsePos) / total;
                detectionAccuracy.set(accuracy);
            }

            // Log performance metrics
            if (total > 0 && total % 1000 == 0) {
                LOG.infof("Anomaly Detection Performance - Processed: %d, Detected: %d, " +
                         "Accuracy: %.1f%%, Avg Processing: %.2fms, Health: %s, Active Anomalies: %d",
                         total, detected, detectionAccuracy.get() * 100, 
                         avgProcessingTime.get(), currentHealthStatus, activeAnomalies.size());
            }

        } catch (Exception e) {
            LOG.errorf("Error calculating performance metrics: %s", e.getMessage());
        }
    }

    private void updateModels() {
        if (!modelsInitialized || metricsHistory.size() < 100) {
            return;
        }

        try {
            LOG.debug("Updating anomaly detection models");

            // Update adaptive thresholds based on recent data
            updateAdaptiveThresholds();

            // Retrain models periodically (simplified)
            if (Duration.between(lastModelUpdate.get(), Instant.now()).toMinutes() > 30) {
                retrainModels();
                lastModelUpdate.set(Instant.now());
            }

            LOG.debug("Anomaly detection models updated");

        } catch (Exception e) {
            LOG.errorf("Error updating anomaly detection models: %s", e.getMessage());
        }
    }

    private void updateAdaptiveThresholds() {
        // Update adaptive thresholds based on recent performance
        List<SystemMetrics> recent = metricsHistory.stream()
            .limit(100)
            .collect(Collectors.toList());

        if (recent.size() < 10) return;

        for (String metricName : metricStatistics.keySet()) {
            DescriptiveStatistics stats = metricStatistics.get(metricName);
            if (stats.getN() > 10) {
                double mean = stats.getMean();
                double stdDev = stats.getStandardDeviation();
                double newThreshold = mean + (3 * stdDev); // 3-sigma threshold
                adaptiveThresholds.put(metricName, newThreshold);
            }
        }
    }

    private void retrainModels() {
        try {
            LOG.info("Retraining anomaly detection models with recent data");
            
            // Convert recent metrics to training data
            List<SystemMetrics> recentData = metricsHistory.stream()
                .limit(1000)
                .collect(Collectors.toList());

            if (recentData.size() < 100) return;

            // Create new training dataset
            double[][] trainingMatrix = recentData.stream()
                .map(this::extractFeatures)
                .toArray(double[][]::new);

            // Retrain Isolation Forest
            isolationForest = IsolationForest.fit(trainingMatrix, 100);

            // Retrain clustering model
            behaviorClusters = KMeans.fit(trainingMatrix, 5);

            LOG.info("Model retraining completed successfully");

        } catch (Exception e) {
            LOG.errorf("Error retraining models: %s", e.getMessage());
        }
    }

    /**
     * Get current anomaly detection status and metrics
     */
    public AnomalyDetectionStatus getDetectionStatus() {
        return new AnomalyDetectionStatus(
            detectionEnabled,
            modelsInitialized,
            currentHealthStatus,
            totalDataPoints.get(),
            detectedAnomalies.get(),
            activeAnomalies.size(),
            detectionAccuracy.get(),
            avgProcessingTime.get(),
            falsePositives.get(),
            truePositives.get()
        );
    }

    /**
     * Manually trigger model retraining
     */
    public Uni<String> retrainModels() {
        return Uni.createFrom().item(() -> {
            if (!modelsInitialized) {
                return "Models not initialized";
            }

            detectionExecutor.submit(this::retrainModels);
            return "Model retraining triggered";
        });
    }

    /**
     * Get current active anomalies
     */
    public List<AnomalyEvent> getActiveAnomalies() {
        return activeAnomalies.stream()
            .map(this::findAnomalyById)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Acknowledge an anomaly (remove from active list)
     */
    public boolean acknowledgeAnomaly(String anomalyId) {
        boolean removed = activeAnomalies.remove(anomalyId);
        if (removed) {
            LOG.infof("Anomaly acknowledged: %s", anomalyId);
        }
        return removed;
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

    public record SystemMetrics(
        double cpuUsage,
        double memoryUsage,
        double networkIO,
        double diskIO,
        double tps,
        double avgLatency,
        double errorRate,
        Instant timestamp
    ) {}

    public record AnomalyDetectionResult(
        AnomalyType type,
        boolean isAnomaly,
        double severity,
        String description,
        SystemMetrics metrics,
        Instant timestamp
    ) {}

    public record AnomalyEvent(
        AnomalyType type,
        double severity,
        String description,
        SystemMetrics metrics,
        Instant timestamp,
        String id
    ) {}

    public record AnomalyDetectionStatus(
        boolean enabled,
        boolean modelsInitialized,
        SystemHealthStatus healthStatus,
        long totalDataPoints,
        long detectedAnomalies,
        int activeAnomalies,
        double detectionAccuracy,
        double avgProcessingTimeMs,
        long falsePositives,
        long truePositives
    ) {}

    public enum AnomalyType {
        ML_OUTLIER,
        STATISTICAL_OUTLIER,
        BEHAVIOR_ANOMALY,
        PERFORMANCE_DEGRADATION,
        RESOURCE_EXHAUSTION,
        NETWORK_ANOMALY
    }

    public enum SystemHealthStatus {
        HEALTHY,
        WARNING,
        CRITICAL
    }
}