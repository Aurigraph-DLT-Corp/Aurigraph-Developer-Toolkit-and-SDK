package io.aurigraph.v11.ai;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.TransactionService;
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
 * AI Integration Service for Aurigraph V11
 * 
 * Central orchestration service that integrates all AI components with the core blockchain system:
 * - Coordinates AI-driven consensus optimization with HyperRAFT++ engine
 * - Integrates predictive transaction ordering with transaction processing
 * - Connects anomaly detection with security and monitoring systems
 * - Orchestrates performance tuning with system resource management
 * - Manages AI model lifecycle and deployment coordination
 * - Provides unified API for AI system management and monitoring
 * 
 * Integration Goals:
 * - Seamless AI enhancement of core blockchain operations
 * - Zero-downtime AI model updates and optimizations
 * - Intelligent failover and graceful degradation
 * - Real-time performance feedback loops
 * - Coordinated multi-component optimization
 * - 20-30% overall system performance improvement
 * 
 * @author Aurigraph AI Integration Team
 * @version 11.0.0
 * @since 2024-09-10
 */
@ApplicationScoped
public class AIIntegrationService {

    private static final Logger LOG = Logger.getLogger(AIIntegrationService.class);

    // Configuration
    @ConfigProperty(name = "ai.integration.enabled", defaultValue = "true")
    boolean integrationEnabled;

    @ConfigProperty(name = "ai.integration.coordination.interval.ms", defaultValue = "10000")
    int coordinationIntervalMs;

    @ConfigProperty(name = "ai.integration.failover.enabled", defaultValue = "true")
    boolean failoverEnabled;

    @ConfigProperty(name = "ai.integration.performance.target.improvement", defaultValue = "0.25")
    double targetPerformanceImprovement;

    @ConfigProperty(name = "ai.integration.optimization.cooldown.ms", defaultValue = "30000")
    int optimizationCooldownMs;

    @ConfigProperty(name = "ai.integration.graceful.degradation.enabled", defaultValue = "true")
    boolean gracefulDegradationEnabled;

    // Injected services
    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    TransactionService transactionService;

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
    AISystemMonitor systemMonitor;

    @Inject
    Event<AIOptimizationEvent> eventBus;

    // Integration state
    private final AtomicReference<IntegrationStatus> currentStatus = new AtomicReference<>(IntegrationStatus.INITIALIZING);
    private final Map<String, ComponentIntegration> componentIntegrations = new ConcurrentHashMap<>();
    private final AtomicReference<Instant> lastOptimization = new AtomicReference<>(Instant.now());
    
    // Performance tracking
    private final AtomicReference<PerformanceBaseline> baseline = new AtomicReference<>();
    private final AtomicReference<PerformanceBaseline> currentPerformance = new AtomicReference<>();
    private final AtomicReference<Double> overallImprovement = new AtomicReference<>(0.0);
    
    // Coordination state
    private final Queue<CoordinationAction> coordinationQueue = new ConcurrentLinkedQueue<>();
    private final Map<String, OptimizationContext> activeOptimizations = new ConcurrentHashMap<>();
    
    // Executors
    private ExecutorService integrationExecutor;
    private ScheduledExecutorService coordinationExecutor;
    
    private volatile boolean integrating = false;

    @PostConstruct
    public void initialize() {
        LOG.info("Initializing AI Integration Service");

        if (!integrationEnabled) {
            LOG.info("AI integration is disabled by configuration");
            currentStatus.set(IntegrationStatus.DISABLED);
            return;
        }

        try {
            // Initialize executors
            initializeExecutors();

            // Initialize component integrations
            initializeComponentIntegrations();

            // Capture baseline performance
            captureBaselinePerformance();

            // Start integration processes
            startIntegrationProcesses();

            // Start coordination
            startCoordination();

            currentStatus.set(IntegrationStatus.ACTIVE);
            LOG.info("AI Integration Service initialized successfully");

        } catch (Exception e) {
            LOG.errorf("Failed to initialize AI Integration Service: %s", e.getMessage());
            currentStatus.set(IntegrationStatus.ERROR);
        }
    }

    @PreDestroy
    public void shutdown() {
        LOG.info("Shutting down AI Integration Service");

        currentStatus.set(IntegrationStatus.SHUTTING_DOWN);
        integrating = false;

        // Shutdown executors
        shutdownExecutor(integrationExecutor, "Integration");
        shutdownExecutor(coordinationExecutor, "Coordination");

        currentStatus.set(IntegrationStatus.STOPPED);
        LOG.info("AI Integration Service shutdown complete");
    }

    private void initializeExecutors() {
        integrationExecutor = Executors.newVirtualThreadPerTaskExecutor();
        coordinationExecutor = Executors.newScheduledThreadPool(3, r -> Thread.ofVirtual()
            .name("ai-integration-coordination")
            .start(r));

        LOG.info("AI integration executors initialized");
    }

    private void initializeComponentIntegrations() {
        // Initialize integration contexts for each AI component
        componentIntegrations.put("consensus_optimizer", new ComponentIntegration(
            "consensus_optimizer", IntegrationMode.ACTIVE, 1.0, Instant.now()
        ));
        
        componentIntegrations.put("transaction_ordering", new ComponentIntegration(
            "transaction_ordering", IntegrationMode.ACTIVE, 1.0, Instant.now()
        ));
        
        componentIntegrations.put("anomaly_detection", new ComponentIntegration(
            "anomaly_detection", IntegrationMode.ACTIVE, 1.0, Instant.now()
        ));
        
        componentIntegrations.put("batch_processor", new ComponentIntegration(
            "batch_processor", IntegrationMode.ACTIVE, 1.0, Instant.now()
        ));
        
        componentIntegrations.put("performance_tuning", new ComponentIntegration(
            "performance_tuning", IntegrationMode.ACTIVE, 1.0, Instant.now()
        ));

        LOG.infof("Initialized integration for %d AI components", componentIntegrations.size());
    }

    private void captureBaselinePerformance() {
        try {
            // Capture baseline performance from core services
            var consensusMetrics = consensusService.getPerformanceMetrics();
            var batchMetrics = batchProcessor.getBatchProcessingMetrics();
            
            PerformanceBaseline baselineMetrics = new PerformanceBaseline(
                consensusMetrics.getCurrentTps(),
                consensusMetrics.getAvgLatency(),
                consensusMetrics.getSuccessRate(),
                batchMetrics.throughputTPS(),
                batchMetrics.avgProcessingTimeMs(),
                Instant.now()
            );
            
            baseline.set(baselineMetrics);
            currentPerformance.set(baselineMetrics);
            
            LOG.infof("Baseline performance captured - TPS: %.0f, Latency: %.2fms, Success: %.2f%%",
                     baselineMetrics.consensusTps(), baselineMetrics.consensusLatency(), 
                     baselineMetrics.successRate() * 100);

        } catch (Exception e) {
            LOG.errorf("Failed to capture baseline performance: %s", e.getMessage());
        }
    }

    private void startIntegrationProcesses() {
        integrating = true;

        // Start main integration loop
        integrationExecutor.submit(this::runIntegrationLoop);

        // Start performance monitoring
        integrationExecutor.submit(this::monitorIntegratedPerformance);

        // Start component health monitoring
        integrationExecutor.submit(this::monitorComponentHealth);

        LOG.info("AI integration processes started");
    }

    private void startCoordination() {
        // Start coordination scheduler
        coordinationExecutor.scheduleAtFixedRate(
            this::performCoordination,
            coordinationIntervalMs,
            coordinationIntervalMs,
            TimeUnit.MILLISECONDS
        );

        // Start optimization coordination
        coordinationExecutor.scheduleAtFixedRate(
            this::coordinateOptimizations,
            15000, // Every 15 seconds
            15000,
            TimeUnit.MILLISECONDS
        );

        LOG.info("AI system coordination started");
    }

    private void runIntegrationLoop() {
        LOG.info("Starting AI integration loop");

        while (integrating && !Thread.currentThread().isInterrupted()) {
            try {
                // Process coordination queue
                processCoordinationQueue();
                
                // Check for integration opportunities
                checkIntegrationOpportunities();
                
                // Update integration status
                updateIntegrationStatus();
                
                Thread.sleep(5000); // Integration loop every 5 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in integration loop: %s", e.getMessage());
                try {
                    Thread.sleep(10000); // Back off on error
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("AI integration loop terminated");
    }

    private void monitorIntegratedPerformance() {
        LOG.info("Starting integrated performance monitoring");

        while (integrating && !Thread.currentThread().isInterrupted()) {
            try {
                // Collect current performance metrics
                PerformanceBaseline current = collectCurrentPerformance();
                if (current != null) {
                    currentPerformance.set(current);
                    
                    // Calculate improvement
                    PerformanceBaseline baselineMetrics = baseline.get();
                    if (baselineMetrics != null) {
                        double improvement = calculateOverallImprovement(baselineMetrics, current);
                        overallImprovement.set(improvement);
                        
                        // Log performance updates periodically
                        if (System.currentTimeMillis() % 60000 < 5000) { // Every minute
                            LOG.infof("Integrated AI Performance - Improvement: %.1f%% " +
                                     "(TPS: %.0f->%.0f, Latency: %.2f->%.2fms)",
                                     improvement * 100,
                                     baselineMetrics.consensusTps(), current.consensusTps(),
                                     baselineMetrics.consensusLatency(), current.consensusLatency());
                        }
                    }
                }
                
                Thread.sleep(10000); // Monitor every 10 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in integrated performance monitoring: %s", e.getMessage());
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Integrated performance monitoring terminated");
    }

    private void monitorComponentHealth() {
        LOG.info("Starting component health monitoring");

        while (integrating && !Thread.currentThread().isInterrupted()) {
            try {
                // Monitor each component integration
                for (Map.Entry<String, ComponentIntegration> entry : componentIntegrations.entrySet()) {
                    String componentName = entry.getKey();
                    ComponentIntegration integration = entry.getValue();
                    
                    ComponentHealthStatus health = checkComponentHealth(componentName);
                    
                    if (health.isHealthy() != (integration.mode() == IntegrationMode.ACTIVE)) {
                        handleComponentHealthChange(componentName, integration, health);
                    }
                }
                
                Thread.sleep(30000); // Check every 30 seconds

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOG.errorf("Error in component health monitoring: %s", e.getMessage());
                try {
                    Thread.sleep(30000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        LOG.info("Component health monitoring terminated");
    }

    private void processCoordinationQueue() {
        while (!coordinationQueue.isEmpty()) {
            CoordinationAction action = coordinationQueue.poll();
            if (action != null) {
                executeCoordinationAction(action);
            }
        }
    }

    private void checkIntegrationOpportunities() {
        try {
            // Check for opportunities to enhance integration
            
            // 1. Cross-component optimization opportunities
            if (canPerformCrossComponentOptimization()) {
                scheduleCoordinatedOptimization();
            }
            
            // 2. Model deployment coordination
            checkForModelDeploymentOpportunities();
            
            // 3. Resource rebalancing opportunities
            checkForResourceRebalancingOpportunities();

        } catch (Exception e) {
            LOG.errorf("Error checking integration opportunities: %s", e.getMessage());
        }
    }

    private boolean canPerformCrossComponentOptimization() {
        Instant lastOpt = lastOptimization.get();
        return Duration.between(lastOpt, Instant.now()).toMillis() > optimizationCooldownMs;
    }

    private void scheduleCoordinatedOptimization() {
        CoordinationAction action = new CoordinationAction(
            CoordinationType.CROSS_COMPONENT_OPTIMIZATION,
            "Coordinated optimization across AI components",
            Instant.now(),
            Map.of("components", "all")
        );
        
        coordinationQueue.offer(action);
        LOG.debug("Scheduled coordinated optimization");
    }

    private void checkForModelDeploymentOpportunities() {
        // Check if any models are ready for coordinated deployment
        try {
            var trainingStatus = trainingPipeline.getPipelineStatus();
            if (trainingStatus.activeABTests() > 0) {
                LOG.debug("A/B tests active - coordinating model deployments");
            }
        } catch (Exception e) {
            LOG.debugf("Error checking model deployment opportunities: %s", e.getMessage());
        }
    }

    private void checkForResourceRebalancingOpportunities() {
        // Check if AI workloads need resource rebalancing
        try {
            var dashboard = systemMonitor.getDashboard();
            if (dashboard.overallHealth() < 80) {
                LOG.debug("System health below threshold - checking resource rebalancing");
            }
        } catch (Exception e) {
            LOG.debugf("Error checking resource rebalancing opportunities: %s", e.getMessage());
        }
    }

    private void updateIntegrationStatus() {
        try {
            // Determine current integration status based on component health
            long healthyComponents = componentIntegrations.values().stream()
                .mapToLong(integration -> integration.mode() == IntegrationMode.ACTIVE ? 1 : 0)
                .sum();
            
            double healthRatio = (double) healthyComponents / componentIntegrations.size();
            
            IntegrationStatus newStatus;
            if (healthRatio >= 1.0) {
                newStatus = IntegrationStatus.ACTIVE;
            } else if (healthRatio >= 0.8) {
                newStatus = IntegrationStatus.PARTIALLY_ACTIVE;
            } else if (healthRatio >= 0.5) {
                newStatus = IntegrationStatus.DEGRADED;
            } else {
                newStatus = IntegrationStatus.ERROR;
            }
            
            IntegrationStatus currentStatusValue = currentStatus.get();
            if (currentStatusValue != newStatus) {
                currentStatus.set(newStatus);
                LOG.infof("AI integration status changed: %s -> %s", currentStatusValue, newStatus);
            }

        } catch (Exception e) {
            LOG.errorf("Error updating integration status: %s", e.getMessage());
        }
    }

    private void performCoordination() {
        try {
            // Perform regular coordination tasks
            
            // 1. Synchronize optimization objectives
            synchronizeOptimizationObjectives();
            
            // 2. Coordinate resource allocation
            coordinateResourceAllocation();
            
            // 3. Update component integration weights
            updateComponentIntegrationWeights();

        } catch (Exception e) {
            LOG.errorf("Error in coordination: %s", e.getMessage());
        }
    }

    private void coordinateOptimizations() {
        try {
            // Coordinate optimizations across components to avoid conflicts
            
            // Check active optimizations
            cleanupCompletedOptimizations();
            
            // Start new coordinated optimizations if needed
            if (activeOptimizations.isEmpty() && shouldStartCoordinatedOptimization()) {
                startCoordinatedOptimization();
            }

        } catch (Exception e) {
            LOG.errorf("Error coordinating optimizations: %s", e.getMessage());
        }
    }

    private void synchronizeOptimizationObjectives() {
        // Ensure all AI components have aligned optimization objectives
        double throughputWeight = 0.4;
        double latencyWeight = 0.4;
        double resourceWeight = 0.2;
        
        try {
            // Update consensus optimizer objectives
            consensusOptimizer.updateOptimizationObjectives(throughputWeight, latencyWeight, resourceWeight);
            
            // Update transaction ordering objectives  
            transactionOrdering.updateOrderingObjectives(throughputWeight, 0.3, latencyWeight);
            
            // Update performance tuning objectives
            performanceTuning.updateOptimizationObjectives(throughputWeight, latencyWeight, resourceWeight);
            
        } catch (Exception e) {
            LOG.debugf("Error synchronizing optimization objectives: %s", e.getMessage());
        }
    }

    private void coordinateResourceAllocation() {
        // Coordinate resource allocation across AI components
        try {
            var dashboard = systemMonitor.getDashboard();
            
            if (dashboard.latestMetrics() != null) {
                double cpuUsage = dashboard.latestMetrics().cpuUsage();
                double memoryUsage = dashboard.latestMetrics().memoryUsage();
                
                if (cpuUsage > 0.8 || memoryUsage > 0.8) {
                    // Request resource optimization
                    CoordinationAction action = new CoordinationAction(
                        CoordinationType.RESOURCE_REBALANCING,
                        "High resource usage detected - rebalancing AI workloads",
                        Instant.now(),
                        Map.of("cpu_usage", cpuUsage, "memory_usage", memoryUsage)
                    );
                    coordinationQueue.offer(action);
                }
            }
        } catch (Exception e) {
            LOG.debugf("Error coordinating resource allocation: %s", e.getMessage());
        }
    }

    private void updateComponentIntegrationWeights() {
        // Update integration weights based on component performance
        for (Map.Entry<String, ComponentIntegration> entry : componentIntegrations.entrySet()) {
            String componentName = entry.getKey();
            ComponentIntegration integration = entry.getValue();
            
            double newWeight = calculateComponentWeight(componentName);
            
            if (Math.abs(newWeight - integration.weight()) > 0.1) {
                ComponentIntegration updatedIntegration = new ComponentIntegration(
                    componentName, integration.mode(), newWeight, Instant.now()
                );
                componentIntegrations.put(componentName, updatedIntegration);
                
                LOG.debugf("Updated integration weight for %s: %.2f -> %.2f",
                          componentName, integration.weight(), newWeight);
            }
        }
    }

    private double calculateComponentWeight(String componentName) {
        // Calculate integration weight based on component performance
        try {
            return switch (componentName) {
                case "consensus_optimizer" -> {
                    var status = consensusOptimizer.getOptimizationStatus();
                    yield status.totalOptimizations() > 0 ? 
                        (double) status.successfulOptimizations() / status.totalOptimizations() : 1.0;
                }
                case "transaction_ordering" -> {
                    var metrics = transactionOrdering.getOrderingMetrics();
                    yield metrics.totalOrderingDecisions() > 0 ?
                        (double) metrics.successfulOrderings() / metrics.totalOrderingDecisions() : 1.0;
                }
                case "anomaly_detection" -> {
                    var status = anomalyDetection.getDetectionStatus();
                    yield status.detectionAccuracy() / 100.0;
                }
                case "batch_processor" -> {
                    var metrics = batchProcessor.getBatchProcessingMetrics();
                    yield metrics.successRate() / 100.0;
                }
                case "performance_tuning" -> {
                    var status = performanceTuning.getTuningStatus();
                    yield status.totalOptimizations() > 0 ?
                        (double) status.successfulOptimizations() / status.totalOptimizations() : 1.0;
                }
                default -> 1.0;
            };
        } catch (Exception e) {
            return 1.0;
        }
    }

    private ComponentHealthStatus checkComponentHealth(String componentName) {
        try {
            var dashboard = systemMonitor.getDashboard();
            var componentHealth = dashboard.componentHealth().get(componentName);
            
            if (componentHealth != null) {
                return new ComponentHealthStatus(
                    componentHealth.status() == AISystemMonitor.ComponentStatus.HEALTHY,
                    componentHealth.healthScore(),
                    componentHealth.statusMessage()
                );
            }
            
            return new ComponentHealthStatus(false, 0.0, "Component not found in monitoring");

        } catch (Exception e) {
            return new ComponentHealthStatus(false, 0.0, "Health check failed: " + e.getMessage());
        }
    }

    private void handleComponentHealthChange(String componentName, ComponentIntegration integration, ComponentHealthStatus health) {
        if (health.isHealthy() && integration.mode() != IntegrationMode.ACTIVE) {
            // Component is healthy - activate integration
            activateComponentIntegration(componentName);
        } else if (!health.isHealthy() && integration.mode() == IntegrationMode.ACTIVE) {
            // Component is unhealthy - deactivate or degrade integration
            if (gracefulDegradationEnabled) {
                degradeComponentIntegration(componentName, health.message());
            } else {
                deactivateComponentIntegration(componentName, health.message());
            }
        }
    }

    private void activateComponentIntegration(String componentName) {
        ComponentIntegration updated = new ComponentIntegration(
            componentName, IntegrationMode.ACTIVE, 1.0, Instant.now()
        );
        componentIntegrations.put(componentName, updated);
        
        LOG.infof("Activated integration for component: %s", componentName);
        
        fireIntegrationEvent("COMPONENT_INTEGRATION_ACTIVATED", componentName, Map.of());
    }

    private void degradeComponentIntegration(String componentName, String reason) {
        ComponentIntegration updated = new ComponentIntegration(
            componentName, IntegrationMode.DEGRADED, 0.5, Instant.now()
        );
        componentIntegrations.put(componentName, updated);
        
        LOG.warnf("Degraded integration for component %s: %s", componentName, reason);
        
        fireIntegrationEvent("COMPONENT_INTEGRATION_DEGRADED", componentName, Map.of("reason", reason));
    }

    private void deactivateComponentIntegration(String componentName, String reason) {
        ComponentIntegration updated = new ComponentIntegration(
            componentName, IntegrationMode.DISABLED, 0.0, Instant.now()
        );
        componentIntegrations.put(componentName, updated);
        
        LOG.errorf("Deactivated integration for component %s: %s", componentName, reason);
        
        fireIntegrationEvent("COMPONENT_INTEGRATION_DEACTIVATED", componentName, Map.of("reason", reason));
    }

    private void executeCoordinationAction(CoordinationAction action) {
        try {
            LOG.debugf("Executing coordination action: %s", action.description());
            
            switch (action.type()) {
                case CROSS_COMPONENT_OPTIMIZATION -> executeCrossComponentOptimization(action);
                case MODEL_DEPLOYMENT -> executeModelDeployment(action);
                case RESOURCE_REBALANCING -> executeResourceRebalancing(action);
                case FAILOVER -> executeFailover(action);
                default -> LOG.warnf("Unknown coordination action type: %s", action.type());
            }

        } catch (Exception e) {
            LOG.errorf("Error executing coordination action %s: %s", action.type(), e.getMessage());
        }
    }

    private void executeCrossComponentOptimization(CoordinationAction action) {
        OptimizationContext context = new OptimizationContext(
            "cross_component_" + System.currentTimeMillis(),
            List.of("consensus_optimizer", "transaction_ordering", "batch_processor", "performance_tuning"),
            Instant.now()
        );
        
        activeOptimizations.put(context.id(), context);
        lastOptimization.set(Instant.now());
        
        // Trigger optimizations in sequence to avoid conflicts
        integrationExecutor.submit(() -> {
            try {
                // Consensus optimization
                consensusOptimizer.triggerModelRetraining();
                Thread.sleep(5000);
                
                // Transaction ordering optimization
                transactionOrdering.updateOrderingObjectives(0.4, 0.3, 0.3);
                Thread.sleep(5000);
                
                // Batch processing optimization
                batchProcessor.preemptivelyOptimizeBatching();
                Thread.sleep(5000);
                
                // Performance tuning
                performanceTuning.triggerOptimizationCycle();
                
                LOG.info("Cross-component optimization completed");
                
            } catch (Exception e) {
                LOG.errorf("Error in cross-component optimization: %s", e.getMessage());
            } finally {
                activeOptimizations.remove(context.id());
            }
        });
    }

    private void executeModelDeployment(CoordinationAction action) {
        LOG.info("Executing coordinated model deployment");
        // Implementation would coordinate model deployments across components
    }

    private void executeResourceRebalancing(CoordinationAction action) {
        LOG.info("Executing resource rebalancing");
        // Implementation would rebalance resources across AI components
    }

    private void executeFailover(CoordinationAction action) {
        LOG.info("Executing AI component failover");
        // Implementation would handle component failover scenarios
    }

    private void cleanupCompletedOptimizations() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(5));
        
        Set<String> toRemove = activeOptimizations.entrySet().stream()
            .filter(entry -> entry.getValue().startTime().isBefore(cutoff))
            .map(Map.Entry::getKey)
            .collect(Collectors.toSet());
        
        for (String id : toRemove) {
            activeOptimizations.remove(id);
        }
    }

    private boolean shouldStartCoordinatedOptimization() {
        PerformanceBaseline current = currentPerformance.get();
        PerformanceBaseline baselineMetrics = baseline.get();
        
        if (current == null || baselineMetrics == null) return false;
        
        // Start optimization if performance has degraded significantly
        double currentImprovement = calculateOverallImprovement(baselineMetrics, current);
        
        return currentImprovement < targetPerformanceImprovement * 0.8;
    }

    private void startCoordinatedOptimization() {
        CoordinationAction action = new CoordinationAction(
            CoordinationType.CROSS_COMPONENT_OPTIMIZATION,
            "Performance degradation detected - starting coordinated optimization",
            Instant.now(),
            Map.of("trigger", "performance_degradation")
        );
        
        coordinationQueue.offer(action);
        LOG.info("Started coordinated optimization due to performance degradation");
    }

    private PerformanceBaseline collectCurrentPerformance() {
        try {
            var consensusMetrics = consensusService.getPerformanceMetrics();
            var batchMetrics = batchProcessor.getBatchProcessingMetrics();
            
            return new PerformanceBaseline(
                consensusMetrics.getCurrentTps(),
                consensusMetrics.getAvgLatency(),
                consensusMetrics.getSuccessRate(),
                batchMetrics.throughputTPS(),
                batchMetrics.avgProcessingTimeMs(),
                Instant.now()
            );

        } catch (Exception e) {
            LOG.debugf("Error collecting current performance: %s", e.getMessage());
            return null;
        }
    }

    private double calculateOverallImprovement(PerformanceBaseline baseline, PerformanceBaseline current) {
        double tpsImprovement = (current.consensusTps() - baseline.consensusTps()) / baseline.consensusTps();
        double latencyImprovement = (baseline.consensusLatency() - current.consensusLatency()) / baseline.consensusLatency();
        double throughputImprovement = (current.batchThroughput() - baseline.batchThroughput()) / baseline.batchThroughput();
        
        // Weighted average of improvements
        return (tpsImprovement * 0.4) + (latencyImprovement * 0.3) + (throughputImprovement * 0.3);
    }

    private void fireIntegrationEvent(String eventType, String componentName, Map<String, Object> data) {
        eventBus.fire(new AIOptimizationEvent(
            AIOptimizationEventType.OPTIMIZATION_APPLIED, // Use existing event type
            "AI Integration: " + eventType + " for " + componentName,
            Map.of(
                "eventType", eventType,
                "component", componentName,
                "data", data
            )
        ));
    }

    private void shutdownExecutor(ExecutorService executor, String name) {
        if (executor != null && !executor.isShutdown()) {
            LOG.infof("Shutting down %s executor", name);
            executor.shutdown();
            try {
                if (!executor.awaitTermination(15, TimeUnit.SECONDS)) {
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
     * Get current AI integration status
     */
    public AIIntegrationStatus getIntegrationStatus() {
        PerformanceBaseline current = currentPerformance.get();
        PerformanceBaseline baselineMetrics = baseline.get();
        
        return new AIIntegrationStatus(
            currentStatus.get(),
            integrationEnabled,
            integrating,
            new HashMap<>(componentIntegrations),
            overallImprovement.get(),
            current != null ? current.consensusTps() : 0.0,
            baselineMetrics != null ? baselineMetrics.consensusTps() : 0.0,
            activeOptimizations.size(),
            coordinationQueue.size()
        );
    }

    /**
     * Trigger manual coordination cycle
     */
    public Uni<String> triggerCoordination() {
        return Uni.createFrom().item(() -> {
            if (!integrating) {
                return "AI integration is not active";
            }
            coordinationExecutor.submit(this::performCoordination);
            return "Coordination cycle triggered";
        });
    }

    /**
     * Force component integration mode change
     */
    public boolean setComponentIntegrationMode(String componentName, IntegrationMode mode) {
        ComponentIntegration current = componentIntegrations.get(componentName);
        if (current == null) {
            return false;
        }
        
        ComponentIntegration updated = new ComponentIntegration(
            componentName, mode, current.weight(), Instant.now()
        );
        componentIntegrations.put(componentName, updated);
        
        LOG.infof("Component %s integration mode set to: %s", componentName, mode);
        fireIntegrationEvent("INTEGRATION_MODE_CHANGED", componentName, 
            Map.of("oldMode", current.mode(), "newMode", mode));
        
        return true;
    }

    // Data classes and records

    public record PerformanceBaseline(
        double consensusTps,
        double consensusLatency,
        double successRate,
        double batchThroughput,
        double batchLatency,
        Instant timestamp
    ) {}

    public record ComponentIntegration(
        String componentName,
        IntegrationMode mode,
        double weight,
        Instant lastUpdate
    ) {}

    public record ComponentHealthStatus(
        boolean isHealthy,
        double healthScore,
        String message
    ) {}

    public record CoordinationAction(
        CoordinationType type,
        String description,
        Instant timestamp,
        Map<String, Object> parameters
    ) {}

    public record OptimizationContext(
        String id,
        List<String> involvedComponents,
        Instant startTime
    ) {}

    public record AIIntegrationStatus(
        IntegrationStatus status,
        boolean enabled,
        boolean active,
        Map<String, ComponentIntegration> componentIntegrations,
        double overallImprovement,
        double currentTps,
        double baselineTps,
        int activeOptimizations,
        int pendingCoordinations
    ) {}

    // Enums

    public enum IntegrationStatus {
        INITIALIZING,
        ACTIVE,
        PARTIALLY_ACTIVE,
        DEGRADED,
        ERROR,
        DISABLED,
        SHUTTING_DOWN,
        STOPPED
    }

    public enum IntegrationMode {
        ACTIVE,
        DEGRADED,
        DISABLED,
        FAILOVER
    }

    public enum CoordinationType {
        CROSS_COMPONENT_OPTIMIZATION,
        MODEL_DEPLOYMENT,
        RESOURCE_REBALANCING,
        FAILOVER
    }
}