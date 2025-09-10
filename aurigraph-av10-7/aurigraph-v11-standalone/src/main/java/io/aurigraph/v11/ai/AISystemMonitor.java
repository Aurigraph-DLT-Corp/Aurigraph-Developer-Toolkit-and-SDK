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

import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.stream.Collectors;

/**
 * AI System Monitor and Metrics Dashboard for Aurigraph V11
 * 
 * Provides comprehensive monitoring and metrics collection for all AI components:
 * - Real-time AI system health monitoring
 * - Performance metrics aggregation and analysis
 * - AI component status tracking and alerting
 * - Resource utilization monitoring for AI workloads
 * - ML model performance tracking and regression detection
 * - Automated health checks and diagnostics
 * - Integration with external monitoring systems
 * 
 * Performance Targets:
 * - Monitoring Latency: <500ms for metrics collection
 * - Dashboard Update Frequency: Every 5 seconds
 * - Metrics Retention: 24 hours of detailed metrics
 * - Alert Response Time: <10 seconds for critical issues
 * - System Health Check Interval: Every 30 seconds
 * - Memory Overhead: <100MB for monitoring infrastructure
 * 
 * @author Aurigraph AI Monitoring Team
 * @version 11.0.0
 * @since 2024-09-10
 */
@ApplicationScoped
public class AISystemMonitor {

    private static final Logger LOG = Logger.getLogger(AISystemMonitor.class);

    // Configuration
    @ConfigProperty(name = "ai.system.monitor.enabled", defaultValue = "true")
    boolean monitoringEnabled;

    @ConfigProperty(name = "ai.system.monitor.metrics.interval.ms", defaultValue = "5000")
    int metricsIntervalMs;

    @ConfigProperty(name = "ai.system.monitor.health.check.interval.ms", defaultValue = "30000")
    int healthCheckIntervalMs;

    @ConfigProperty(name = "ai.system.monitor.alert.threshold.cpu", defaultValue = "0.8")
    double cpuAlertThreshold;

    @ConfigProperty(name = "ai.system.monitor.alert.threshold.memory", defaultValue = "0.85")
    double memoryAlertThreshold;

    @ConfigProperty(name = "ai.system.monitor.alert.threshold.error.rate", defaultValue = "0.05")
    double errorRateAlertThreshold;

    @ConfigProperty(name = "ai.system.monitor.metrics.retention.hours", defaultValue = "24")
    int metricsRetentionHours;

    // Injected AI services
    @Inject
    AIConsensusOptimizer consensusOptimizer;

    @Inject
    PredictiveTransactionOrdering transactionOrdering;

    @Inject
    AnomalyDetectionService anomalyDetection;

    @Inject
    AdaptiveBatchProcessor batchProcessor;

    @Inject
    PerformanceTuningEngine performanceTuning;

    @Inject
    AIModelTrainingPipeline trainingPipeline;

    @Inject
    Event<AIOptimizationEvent> eventBus;

    // Monitoring state
    private final Map<String, AIComponentHealth> componentHealth = new ConcurrentHashMap<>();
    private final Queue<AISystemMetrics> metricsHistory = new ConcurrentLinkedQueue<>();
    private final Map<String, Queue<ComponentMetrics>> componentMetricsHistory = new ConcurrentHashMap<>();
    private final AtomicReference<AISystemStatus> currentSystemStatus = new AtomicReference<>(AISystemStatus.INITIALIZING);
    
    // Performance tracking
    private final AtomicReference<Double> overallSystemHealth = new AtomicReference<>(100.0);
    private final AtomicLong totalAIOperations = new AtomicLong(0);
    private final AtomicLong successfulAIOperations = new AtomicLong(0);
    private final AtomicReference<Double> avgAIResponseTime = new AtomicReference<>(0.0);
    private final AtomicReference<Double> systemThroughputImprovement = new AtomicReference<>(0.0);
    
    // Alert tracking
    private final Map<String, Alert> activeAlerts = new ConcurrentHashMap<>();
    private final Queue<Alert> alertHistory = new ConcurrentLinkedQueue<>();
    
    // Executors
    private ExecutorService monitoringExecutor;
    private ScheduledExecutorService scheduledExecutor;
    
    private volatile boolean monitoring = false;
    private final int MAX_METRICS_HISTORY = 17280; // 24 hours at 5-second intervals

    @PostConstruct
    public void initialize() {
        LOG.info("Initializing AI System Monitor");

        if (!monitoringEnabled) {
            LOG.info("AI system monitoring is disabled by configuration");
            return;
        }

        // Initialize executors
        initializeExecutors();

        // Initialize component monitoring
        initializeComponentMonitoring();

        // Start monitoring processes
        startMonitoring();

        // Start health checks
        startHealthChecks();

        // Start alerting
        startAlertingSystem();

        currentSystemStatus.set(AISystemStatus.RUNNING);
        LOG.info("AI System Monitor initialized successfully");
    }

    @PreDestroy
    public void shutdown() {
        LOG.info("Shutting down AI System Monitor");

        monitoring = false;
        currentSystemStatus.set(AISystemStatus.SHUTTING_DOWN);

        // Shutdown executors
        shutdownExecutor(monitoringExecutor, "Monitoring");
        shutdownExecutor(scheduledExecutor, "Scheduled");

        currentSystemStatus.set(AISystemStatus.STOPPED);
        LOG.info("AI System Monitor shutdown complete");
    }

    private void initializeExecutors() {
        monitoringExecutor = Executors.newVirtualThreadPerTaskExecutor();
        scheduledExecutor = Executors.newScheduledThreadPool(4, r -> Thread.ofVirtual()
            .name("ai-system-monitor")
            .start(r));

        LOG.info("AI system monitor executors initialized");
    }

    private void initializeComponentMonitoring() {
        // Initialize health tracking for each AI component
        String[] components = {
            "consensus_optimizer", "transaction_ordering", "anomaly_detection",
            "batch_processor", "performance_tuning", "model_training"
        };

        for (String component : components) {
            componentHealth.put(component, new AIComponentHealth(
                component, ComponentStatus.STARTING, 100.0, Instant.now(), "Initializing"
            ));
            componentMetricsHistory.put(component, new ConcurrentLinkedQueue<>());
        }

        LOG.infof("Initialized monitoring for %d AI components", components.length);
    }

    private void startMonitoring() {
        monitoring = true;

        // Start metrics collection
        scheduledExecutor.scheduleAtFixedRate(
            this::collectSystemMetrics,
            1000,  // Initial delay
            metricsIntervalMs,
            TimeUnit.MILLISECONDS
        );

        // Start component monitoring
        scheduledExecutor.scheduleAtFixedRate(
            this::monitorAIComponents,
            2000,  // Initial delay
            metricsIntervalMs,
            TimeUnit.MILLISECONDS
        );

        // Start metrics cleanup
        scheduledExecutor.scheduleAtFixedRate(
            this::cleanupOldMetrics,
            600000, // Every 10 minutes
            600000,
            TimeUnit.MILLISECONDS
        );

        LOG.info("AI system monitoring started");
    }

    private void startHealthChecks() {
        scheduledExecutor.scheduleAtFixedRate(
            this::performSystemHealthCheck,
            5000,  // Initial delay
            healthCheckIntervalMs,
            TimeUnit.MILLISECONDS
        );

        LOG.info("AI system health checks started");
    }

    private void startAlertingSystem() {
        // Start alert processing
        monitoringExecutor.submit(this::processAlerts);

        // Start alert cleanup
        scheduledExecutor.scheduleAtFixedRate(
            this::cleanupOldAlerts,
            300000, // Every 5 minutes
            300000,
            TimeUnit.MILLISECONDS
        );

        LOG.info("AI system alerting started");
    }

    private void collectSystemMetrics() {
        try {
            // Collect overall system metrics
            AISystemMetrics systemMetrics = gatherSystemMetrics();
            
            if (systemMetrics != null) {
                metricsHistory.offer(systemMetrics);
                maintainMetricsSize(metricsHistory, MAX_METRICS_HISTORY);
                
                // Update system health score
                updateSystemHealthScore(systemMetrics);
            }

        } catch (Exception e) {
            LOG.errorf("Error collecting system metrics: %s", e.getMessage());
        }
    }

    private AISystemMetrics gatherSystemMetrics() {
        try {
            // Collect JVM metrics
            Runtime runtime = Runtime.getRuntime();
            double cpuUsage = ((com.sun.management.OperatingSystemMXBean) 
                java.lang.management.ManagementFactory.getOperatingSystemMXBean()).getProcessCpuLoad();
            double memoryUsage = (double)(runtime.totalMemory() - runtime.freeMemory()) / runtime.totalMemory();
            
            // Collect AI system specific metrics
            long totalOperations = calculateTotalAIOperations();
            long successfulOperations = calculateSuccessfulAIOperations();
            double successRate = totalOperations > 0 ? (double)successfulOperations / totalOperations : 1.0;
            double avgResponseTime = calculateAverageAIResponseTime();
            
            return new AISystemMetrics(
                Instant.now(),
                cpuUsage,
                memoryUsage,
                totalOperations,
                successfulOperations,
                successRate,
                avgResponseTime,
                overallSystemHealth.get(),
                componentHealth.size(),
                (int)componentHealth.values().stream().filter(h -> h.status() == ComponentStatus.HEALTHY).count()
            );

        } catch (Exception e) {
            LOG.errorf("Error gathering system metrics: %s", e.getMessage());
            return null;
        }
    }

    private long calculateTotalAIOperations() {
        try {
            long total = 0;
            
            // Sum up operations from all AI components
            var consensusStatus = consensusOptimizer.getOptimizationStatus();
            total += consensusStatus.totalOptimizations();
            
            var orderingMetrics = transactionOrdering.getOrderingMetrics();
            total += orderingMetrics.totalOrderingDecisions();
            
            var detectionStatus = anomalyDetection.getDetectionStatus();
            total += detectionStatus.totalDataPoints();
            
            var batchMetrics = batchProcessor.getBatchProcessingMetrics();
            total += batchMetrics.totalBatches();
            
            var tuningStatus = performanceTuning.getTuningStatus();
            total += tuningStatus.totalOptimizations();
            
            return total;

        } catch (Exception e) {
            LOG.debugf("Error calculating total AI operations: %s", e.getMessage());
            return totalAIOperations.get();
        }
    }

    private long calculateSuccessfulAIOperations() {
        try {
            long successful = 0;
            
            // Sum up successful operations from all AI components
            var consensusStatus = consensusOptimizer.getOptimizationStatus();
            successful += consensusStatus.successfulOptimizations();
            
            var orderingMetrics = transactionOrdering.getOrderingMetrics();
            successful += orderingMetrics.successfulOrderings();
            
            var detectionStatus = anomalyDetection.getDetectionStatus();
            successful += detectionStatus.truePositives();
            
            var batchMetrics = batchProcessor.getBatchProcessingMetrics();
            successful += batchMetrics.successfulBatches();
            
            var tuningStatus = performanceTuning.getTuningStatus();
            successful += tuningStatus.successfulOptimizations();
            
            return successful;

        } catch (Exception e) {
            LOG.debugf("Error calculating successful AI operations: %s", e.getMessage());
            return successfulAIOperations.get();
        }
    }

    private double calculateAverageAIResponseTime() {
        try {
            List<Double> responseTimes = new ArrayList<>();
            
            // Collect response times from all AI components
            var orderingMetrics = transactionOrdering.getOrderingMetrics();
            responseTimes.add(orderingMetrics.avgOrderingTimeUs() / 1000.0); // Convert to ms
            
            var detectionStatus = anomalyDetection.getDetectionStatus();
            responseTimes.add(detectionStatus.avgProcessingTimeMs());
            
            var batchMetrics = batchProcessor.getBatchProcessingMetrics();
            responseTimes.add(batchMetrics.avgProcessingTimeMs());
            
            return responseTimes.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        } catch (Exception e) {
            LOG.debugf("Error calculating average AI response time: %s", e.getMessage());
            return avgAIResponseTime.get();
        }
    }

    private void updateSystemHealthScore(AISystemMetrics metrics) {
        // Calculate overall system health score (0-100)
        double healthScore = 100.0;
        
        // CPU health component (0-30 points)
        if (metrics.cpuUsage() > cpuAlertThreshold) {
            healthScore -= (metrics.cpuUsage() - cpuAlertThreshold) * 30 / (1.0 - cpuAlertThreshold);
        }
        
        // Memory health component (0-30 points)
        if (metrics.memoryUsage() > memoryAlertThreshold) {
            healthScore -= (metrics.memoryUsage() - memoryAlertThreshold) * 30 / (1.0 - memoryAlertThreshold);
        }
        
        // Success rate health component (0-25 points)
        if (metrics.successRate() < 0.95) {
            healthScore -= (0.95 - metrics.successRate()) * 25 / 0.95;
        }
        
        // Component health component (0-15 points)
        double componentHealthRatio = (double)metrics.healthyComponents() / metrics.totalComponents();
        if (componentHealthRatio < 1.0) {
            healthScore -= (1.0 - componentHealthRatio) * 15;
        }
        
        healthScore = Math.max(0.0, Math.min(100.0, healthScore));
        overallSystemHealth.set(healthScore);
        
        // Update system status based on health score
        updateSystemStatus(healthScore);
    }

    private void updateSystemStatus(double healthScore) {
        AISystemStatus newStatus;
        
        if (healthScore >= 90) {
            newStatus = AISystemStatus.HEALTHY;
        } else if (healthScore >= 70) {
            newStatus = AISystemStatus.WARNING;
        } else if (healthScore >= 50) {
            newStatus = AISystemStatus.DEGRADED;
        } else {
            newStatus = AISystemStatus.CRITICAL;
        }
        
        AISystemStatus currentStatus = currentSystemStatus.get();
        if (currentStatus != newStatus) {
            currentSystemStatus.set(newStatus);
            
            LOG.infof("AI System status changed: %s -> %s (health score: %.1f%%)",
                     currentStatus, newStatus, healthScore);
            
            // Fire status change event
            eventBus.fire(new AIOptimizationEvent(
                AIOptimizationEventType.SYSTEM_STATUS_CHANGED,
                "AI system status changed to: " + newStatus,
                Map.of(
                    "previousStatus", currentStatus.toString(),
                    "newStatus", newStatus.toString(),
                    "healthScore", healthScore
                )
            ));
        }
    }

    private void monitorAIComponents() {
        try {
            // Monitor each AI component
            monitorComponent("consensus_optimizer", this::getConsensusOptimizerHealth);
            monitorComponent("transaction_ordering", this::getTransactionOrderingHealth);
            monitorComponent("anomaly_detection", this::getAnomalyDetectionHealth);
            monitorComponent("batch_processor", this::getBatchProcessorHealth);
            monitorComponent("performance_tuning", this::getPerformanceTuningHealth);
            monitorComponent("model_training", this::getModelTrainingHealth);

        } catch (Exception e) {
            LOG.errorf("Error monitoring AI components: %s", e.getMessage());
        }
    }

    private void monitorComponent(String componentName, ComponentHealthProvider healthProvider) {
        try {
            AIComponentHealth health = healthProvider.getHealth();
            componentHealth.put(componentName, health);
            
            // Store component metrics
            ComponentMetrics metrics = new ComponentMetrics(
                componentName,
                health.status(),
                health.healthScore(),
                health.lastUpdate(),
                calculateComponentResponseTime(componentName),
                calculateComponentThroughput(componentName)
            );
            
            Queue<ComponentMetrics> history = componentMetricsHistory.get(componentName);
            history.offer(metrics);
            maintainMetricsSize(history, 1000); // Keep last 1000 measurements per component

        } catch (Exception e) {
            LOG.errorf("Error monitoring component %s: %s", componentName, e.getMessage());
            
            // Mark component as unhealthy
            componentHealth.put(componentName, new AIComponentHealth(
                componentName, ComponentStatus.ERROR, 0.0, Instant.now(),
                "Monitoring error: " + e.getMessage()
            ));
        }
    }

    private AIComponentHealth getConsensusOptimizerHealth() {
        try {
            var status = consensusOptimizer.getOptimizationStatus();
            
            double healthScore = 100.0;
            if (status.totalOptimizations() > 0) {
                double successRate = (double)status.successfulOptimizations() / status.totalOptimizations();
                healthScore = successRate * 100;
            }
            
            ComponentStatus componentStatus = status.enabled() && status.modelsInitialized() 
                ? (healthScore > 80 ? ComponentStatus.HEALTHY : ComponentStatus.DEGRADED)
                : ComponentStatus.DISABLED;
            
            return new AIComponentHealth(
                "consensus_optimizer",
                componentStatus,
                healthScore,
                Instant.now(),
                String.format("Optimizations: %d/%d", status.successfulOptimizations(), status.totalOptimizations())
            );

        } catch (Exception e) {
            return new AIComponentHealth(
                "consensus_optimizer", ComponentStatus.ERROR, 0.0, Instant.now(), e.getMessage()
            );
        }
    }

    private AIComponentHealth getTransactionOrderingHealth() {
        try {
            var metrics = transactionOrdering.getOrderingMetrics();
            
            double healthScore = 100.0;
            if (metrics.totalOrderingDecisions() > 0) {
                double successRate = (double)metrics.successfulOrderings() / metrics.totalOrderingDecisions();
                healthScore = successRate * 100;
            }
            
            ComponentStatus status = metrics.mlModelsActive() 
                ? (healthScore > 80 ? ComponentStatus.HEALTHY : ComponentStatus.DEGRADED)
                : ComponentStatus.DISABLED;
            
            return new AIComponentHealth(
                "transaction_ordering",
                status,
                healthScore,
                Instant.now(),
                String.format("Orderings: %d/%d (%.1f μs avg)", 
                             metrics.successfulOrderings(), metrics.totalOrderingDecisions(), 
                             metrics.avgOrderingTimeUs())
            );

        } catch (Exception e) {
            return new AIComponentHealth(
                "transaction_ordering", ComponentStatus.ERROR, 0.0, Instant.now(), e.getMessage()
            );
        }
    }

    private AIComponentHealth getAnomalyDetectionHealth() {
        try {
            var status = anomalyDetection.getDetectionStatus();
            
            double healthScore = status.detectionAccuracy();
            ComponentStatus componentStatus = status.enabled() && status.modelsInitialized()
                ? (healthScore > 90 ? ComponentStatus.HEALTHY : ComponentStatus.DEGRADED)
                : ComponentStatus.DISABLED;
            
            return new AIComponentHealth(
                "anomaly_detection",
                componentStatus,
                healthScore,
                Instant.now(),
                String.format("Accuracy: %.1f%%, Active anomalies: %d", 
                             healthScore, status.activeAnomalies())
            );

        } catch (Exception e) {
            return new AIComponentHealth(
                "anomaly_detection", ComponentStatus.ERROR, 0.0, Instant.now(), e.getMessage()
            );
        }
    }

    private AIComponentHealth getBatchProcessorHealth() {
        try {
            var metrics = batchProcessor.getBatchProcessingMetrics();
            
            double healthScore = metrics.successRate();
            ComponentStatus status = metrics.enabled()
                ? (healthScore > 95 ? ComponentStatus.HEALTHY : ComponentStatus.DEGRADED)
                : ComponentStatus.DISABLED;
            
            return new AIComponentHealth(
                "batch_processor",
                status,
                healthScore,
                Instant.now(),
                String.format("Batches: %d/%d (%.1f%% success), Efficiency: %.1f%%", 
                             metrics.successfulBatches(), metrics.totalBatches(), 
                             healthScore, metrics.efficiency() * 100)
            );

        } catch (Exception e) {
            return new AIComponentHealth(
                "batch_processor", ComponentStatus.ERROR, 0.0, Instant.now(), e.getMessage()
            );
        }
    }

    private AIComponentHealth getPerformanceTuningHealth() {
        try {
            var status = performanceTuning.getTuningStatus();
            
            double healthScore = 100.0;
            if (status.totalOptimizations() > 0) {
                double successRate = (double)status.successfulOptimizations() / status.totalOptimizations();
                healthScore = successRate * 100;
                
                // Bonus for positive improvement
                if (status.overallImprovement() > 0) {
                    healthScore = Math.min(100.0, healthScore + status.overallImprovement() * 10);
                }
            }
            
            ComponentStatus componentStatus = status.enabled() && status.active()
                ? (healthScore > 80 ? ComponentStatus.HEALTHY : ComponentStatus.DEGRADED)
                : ComponentStatus.DISABLED;
            
            return new AIComponentHealth(
                "performance_tuning",
                componentStatus,
                healthScore,
                Instant.now(),
                String.format("Optimizations: %d/%d, Improvement: %.1f%%", 
                             status.successfulOptimizations(), status.totalOptimizations(),
                             status.overallImprovement() * 100)
            );

        } catch (Exception e) {
            return new AIComponentHealth(
                "performance_tuning", ComponentStatus.ERROR, 0.0, Instant.now(), e.getMessage()
            );
        }
    }

    private AIComponentHealth getModelTrainingHealth() {
        try {
            var status = trainingPipeline.getPipelineStatus();
            
            double healthScore = 100.0;
            if (status.totalTrainingCycles() > 0) {
                double successRate = (double)status.successfulTrainingCycles() / status.totalTrainingCycles();
                healthScore = successRate * 100;
            }
            
            ComponentStatus componentStatus = status.enabled() && status.active()
                ? (healthScore > 85 ? ComponentStatus.HEALTHY : ComponentStatus.DEGRADED)
                : ComponentStatus.DISABLED;
            
            return new AIComponentHealth(
                "model_training",
                componentStatus,
                healthScore,
                Instant.now(),
                String.format("Training cycles: %d/%d, Active A/B tests: %d", 
                             status.successfulTrainingCycles(), status.totalTrainingCycles(),
                             status.activeABTests())
            );

        } catch (Exception e) {
            return new AIComponentHealth(
                "model_training", ComponentStatus.ERROR, 0.0, Instant.now(), e.getMessage()
            );
        }
    }

    private double calculateComponentResponseTime(String componentName) {
        // Calculate component-specific response times
        try {
            return switch (componentName) {
                case "transaction_ordering" -> transactionOrdering.getOrderingMetrics().avgOrderingTimeUs() / 1000.0;
                case "anomaly_detection" -> anomalyDetection.getDetectionStatus().avgProcessingTimeMs();
                case "batch_processor" -> batchProcessor.getBatchProcessingMetrics().avgProcessingTimeMs();
                case "model_training" -> trainingPipeline.getPipelineStatus().averageTrainingTimeMs();
                default -> 0.0;
            };
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double calculateComponentThroughput(String componentName) {
        // Calculate component-specific throughput metrics
        try {
            return switch (componentName) {
                case "consensus_optimizer" -> {
                    var status = consensusOptimizer.getOptimizationStatus();
                    yield status.totalOptimizations() / Math.max(1.0, 
                        Duration.between(Instant.now().minusMinutes(1), Instant.now()).getSeconds());
                }
                case "transaction_ordering" -> {
                    var metrics = transactionOrdering.getOrderingMetrics();
                    yield metrics.totalOrderingDecisions() / Math.max(1.0,
                        Duration.between(Instant.now().minusMinutes(1), Instant.now()).getSeconds());
                }
                case "batch_processor" -> batchProcessor.getBatchProcessingMetrics().throughputTPS();
                default -> 0.0;
            };
        } catch (Exception e) {
            return 0.0;
        }
    }

    private void performSystemHealthCheck() {
        try {
            // Perform comprehensive system health check
            Map<String, Boolean> healthChecks = new HashMap<>();
            
            // Check each component
            for (Map.Entry<String, AIComponentHealth> entry : componentHealth.entrySet()) {
                String component = entry.getKey();
                AIComponentHealth health = entry.getValue();
                
                boolean isHealthy = health.status() == ComponentStatus.HEALTHY && 
                                  health.healthScore() > 70;
                healthChecks.put(component, isHealthy);
                
                // Generate alerts for unhealthy components
                if (!isHealthy && health.status() != ComponentStatus.DISABLED) {
                    generateComponentAlert(component, health);
                }
            }
            
            // Check system-wide metrics
            AISystemMetrics latestMetrics = getLatestSystemMetrics();
            if (latestMetrics != null) {
                checkSystemAlerts(latestMetrics);
            }
            
            // Log health check results
            long healthyComponents = healthChecks.values().stream().mapToLong(h -> h ? 1 : 0).sum();
            LOG.debugf("System health check: %d/%d components healthy, overall health: %.1f%%",
                      healthyComponents, healthChecks.size(), overallSystemHealth.get());

        } catch (Exception e) {
            LOG.errorf("Error in system health check: %s", e.getMessage());
        }
    }

    private void checkSystemAlerts(AISystemMetrics metrics) {
        // Check CPU usage
        if (metrics.cpuUsage() > cpuAlertThreshold) {
            generateAlert("HIGH_CPU_USAGE", AlertLevel.WARNING,
                String.format("High CPU usage detected: %.1f%%", metrics.cpuUsage() * 100));
        }
        
        // Check memory usage
        if (metrics.memoryUsage() > memoryAlertThreshold) {
            generateAlert("HIGH_MEMORY_USAGE", AlertLevel.WARNING,
                String.format("High memory usage detected: %.1f%%", metrics.memoryUsage() * 100));
        }
        
        // Check success rate
        if (metrics.successRate() < (1.0 - errorRateAlertThreshold)) {
            generateAlert("LOW_SUCCESS_RATE", AlertLevel.CRITICAL,
                String.format("Low AI success rate detected: %.1f%%", metrics.successRate() * 100));
        }
        
        // Check overall system health
        if (overallSystemHealth.get() < 50) {
            generateAlert("CRITICAL_SYSTEM_HEALTH", AlertLevel.CRITICAL,
                String.format("Critical system health: %.1f%%", overallSystemHealth.get()));
        }
    }

    private void generateComponentAlert(String componentName, AIComponentHealth health) {
        String alertId = "COMPONENT_UNHEALTHY_" + componentName.toUpperCase();
        AlertLevel level = health.status() == ComponentStatus.ERROR ? AlertLevel.CRITICAL : AlertLevel.WARNING;
        
        generateAlert(alertId, level,
            String.format("Component %s is unhealthy: %s (health: %.1f%%)", 
                         componentName, health.status(), health.healthScore()));
    }

    private void generateAlert(String alertId, AlertLevel level, String message) {
        Alert existingAlert = activeAlerts.get(alertId);
        
        if (existingAlert == null) {
            Alert newAlert = new Alert(alertId, level, message, Instant.now(), 1);
            activeAlerts.put(alertId, newAlert);
            alertHistory.offer(newAlert);
            
            LOG.warnf("Alert generated: [%s] %s", level, message);
            
            // Fire alert event
            eventBus.fire(new AIOptimizationEvent(
                AIOptimizationEventType.ALERT_GENERATED,
                "Alert: " + message,
                Map.of(
                    "alertId", alertId,
                    "level", level.toString(),
                    "message", message
                )
            ));
        } else {
            // Update existing alert
            existingAlert.incrementOccurrences();
        }
    }

    private void processAlerts() {
        LOG.info("Starting alert processing");
        
        while (monitoring && !Thread.currentThread().isInterrupted()) {
            try {
                // Process and potentially resolve alerts
                Set<String> resolvedAlerts = new HashSet<>();
                
                for (Map.Entry<String, Alert> entry : activeAlerts.entrySet()) {
                    String alertId = entry.getKey();
                    Alert alert = entry.getValue();
                    
                    if (shouldResolveAlert(alertId, alert)) {
                        resolvedAlerts.add(alertId);
                        LOG.infof("Alert resolved: [%s] %s", alert.level(), alert.message());
                        
                        // Fire alert resolution event
                        eventBus.fire(new AIOptimizationEvent(
                            AIOptimizationEventType.ALERT_RESOLVED,
                            "Alert resolved: " + alert.message(),
                            Map.of("alertId", alertId, "duration", Duration.between(alert.timestamp(), Instant.now()).getSeconds())
                        ));
                    }
                }
                
                // Remove resolved alerts
                for (String alertId : resolvedAlerts) {
                    activeAlerts.remove(alertId);
                }
                
                Thread.sleep(10000); // Check every 10 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error processing alerts: %s", e.getMessage());
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        LOG.info("Alert processing terminated");
    }

    private boolean shouldResolveAlert(String alertId, Alert alert) {
        // Check if conditions that triggered the alert have been resolved
        try {
            AISystemMetrics latestMetrics = getLatestSystemMetrics();
            if (latestMetrics == null) return false;
            
            return switch (alertId) {
                case "HIGH_CPU_USAGE" -> latestMetrics.cpuUsage() < cpuAlertThreshold * 0.9;
                case "HIGH_MEMORY_USAGE" -> latestMetrics.memoryUsage() < memoryAlertThreshold * 0.9;
                case "LOW_SUCCESS_RATE" -> latestMetrics.successRate() > (1.0 - errorRateAlertThreshold * 0.5);
                case "CRITICAL_SYSTEM_HEALTH" -> overallSystemHealth.get() > 70;
                default -> {
                    if (alertId.startsWith("COMPONENT_UNHEALTHY_")) {
                        String componentName = alertId.substring("COMPONENT_UNHEALTHY_".length()).toLowerCase();
                        AIComponentHealth health = componentHealth.get(componentName);
                        yield health != null && health.status() == ComponentStatus.HEALTHY;
                    }
                    yield false;
                }
            };
        } catch (Exception e) {
            return false;
        }
    }

    private AISystemMetrics getLatestSystemMetrics() {
        return metricsHistory.stream()
            .reduce((first, second) -> second)
            .orElse(null);
    }

    private void cleanupOldMetrics() {
        try {
            Instant cutoff = Instant.now().minus(Duration.ofHours(metricsRetentionHours));
            
            // Clean up system metrics
            metricsHistory.removeIf(metrics -> metrics.timestamp().isBefore(cutoff));
            
            // Clean up component metrics
            for (Queue<ComponentMetrics> componentMetrics : componentMetricsHistory.values()) {
                componentMetrics.removeIf(metrics -> metrics.timestamp().isBefore(cutoff));
            }
            
            LOG.debugf("Cleaned up metrics older than %d hours", metricsRetentionHours);

        } catch (Exception e) {
            LOG.errorf("Error cleaning up old metrics: %s", e.getMessage());
        }
    }

    private void cleanupOldAlerts() {
        try {
            Instant cutoff = Instant.now().minus(Duration.ofHours(24));
            
            alertHistory.removeIf(alert -> alert.timestamp().isBefore(cutoff));
            
        } catch (Exception e) {
            LOG.errorf("Error cleaning up old alerts: %s", e.getMessage());
        }
    }

    private <T> void maintainMetricsSize(Queue<T> queue, int maxSize) {
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

    // Public API methods

    /**
     * Get current AI system dashboard data
     */
    public AISystemDashboard getDashboard() {
        AISystemMetrics latestMetrics = getLatestSystemMetrics();
        
        return new AISystemDashboard(
            currentSystemStatus.get(),
            overallSystemHealth.get(),
            latestMetrics,
            new HashMap<>(componentHealth),
            activeAlerts.size(),
            new ArrayList<>(activeAlerts.values()),
            calculateTotalAIOperations(),
            calculateSuccessfulAIOperations(),
            systemThroughputImprovement.get()
        );
    }

    /**
     * Get component-specific metrics history
     */
    public List<ComponentMetrics> getComponentMetricsHistory(String componentName, int limit) {
        Queue<ComponentMetrics> history = componentMetricsHistory.get(componentName);
        if (history == null) {
            return Collections.emptyList();
        }
        
        return history.stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get system metrics history
     */
    public List<AISystemMetrics> getSystemMetricsHistory(int limit) {
        return metricsHistory.stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    /**
     * Get active alerts
     */
    public List<Alert> getActiveAlerts() {
        return new ArrayList<>(activeAlerts.values());
    }

    /**
     * Manually resolve an alert
     */
    public boolean resolveAlert(String alertId) {
        Alert removed = activeAlerts.remove(alertId);
        if (removed != null) {
            LOG.infof("Alert manually resolved: %s", alertId);
            eventBus.fire(new AIOptimizationEvent(
                AIOptimizationEventType.ALERT_RESOLVED,
                "Alert manually resolved: " + removed.message(),
                Map.of("alertId", alertId, "manual", true)
            ));
        }
        return removed != null;
    }

    // Data classes and interfaces

    @FunctionalInterface
    private interface ComponentHealthProvider {
        AIComponentHealth getHealth();
    }

    public record AISystemMetrics(
        Instant timestamp,
        double cpuUsage,
        double memoryUsage,
        long totalOperations,
        long successfulOperations,
        double successRate,
        double avgResponseTimeMs,
        double systemHealth,
        int totalComponents,
        int healthyComponents
    ) {}

    public record AIComponentHealth(
        String componentName,
        ComponentStatus status,
        double healthScore,
        Instant lastUpdate,
        String statusMessage
    ) {}

    public record ComponentMetrics(
        String componentName,
        ComponentStatus status,
        double healthScore,
        Instant timestamp,
        double responseTimeMs,
        double throughput
    ) {}

    public record Alert(
        String id,
        AlertLevel level,
        String message,
        Instant timestamp,
        AtomicInteger occurrences
    ) {
        public Alert(String id, AlertLevel level, String message, Instant timestamp, int occurrences) {
            this(id, level, message, timestamp, new AtomicInteger(occurrences));
        }
        
        public void incrementOccurrences() {
            occurrences.incrementAndGet();
        }
        
        public int getOccurrences() {
            return occurrences.get();
        }
    }

    public record AISystemDashboard(
        AISystemStatus systemStatus,
        double overallHealth,
        AISystemMetrics latestMetrics,
        Map<String, AIComponentHealth> componentHealth,
        int activeAlertsCount,
        List<Alert> recentAlerts,
        long totalOperations,
        long successfulOperations,
        double throughputImprovement
    ) {}

    // Enums

    public enum AISystemStatus {
        INITIALIZING,
        RUNNING,
        HEALTHY,
        WARNING,
        DEGRADED,
        CRITICAL,
        SHUTTING_DOWN,
        STOPPED
    }

    public enum ComponentStatus {
        STARTING,
        HEALTHY,
        WARNING,
        DEGRADED,
        ERROR,
        DISABLED
    }

    public enum AlertLevel {
        INFO,
        WARNING,
        ERROR,
        CRITICAL
    }
}