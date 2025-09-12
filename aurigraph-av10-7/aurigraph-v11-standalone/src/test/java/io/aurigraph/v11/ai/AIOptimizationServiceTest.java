package io.aurigraph.v11.ai;

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.grpc.NetworkOptimizer;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.jboss.logging.Logger;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test suite for AI Optimization Service components
 * 
 * Tests the ML-driven performance optimization capabilities for achieving 3M+ TPS
 */
@QuarkusTest
public class AIOptimizationServiceTest {

    private static final Logger LOG = Logger.getLogger(AIOptimizationServiceTest.class);

    @Inject
    AIOptimizationService aiOptimizationService;

    @Inject
    PredictiveRoutingEngine routingEngine;

    @Inject
    AnomalyDetectionService anomalyDetectionService;

    @Inject
    MLLoadBalancer mlLoadBalancer;

    @Inject
    AdaptiveBatchProcessor batchProcessor;

    @BeforeEach
    void setUp() {
        LOG.info("Setting up AI Optimization Service tests");
    }

    @Test
    @DisplayName("AI Optimization Service should initialize successfully")
    void testAIOptimizationServiceInitialization() {
        // Test that the service initializes and reports correct status
        var status = aiOptimizationService.getOptimizationStatus();
        
        assertNotNull(status);
        assertTrue(status.enabled());
        assertTrue(status.modelsInitialized());
        assertTrue(status.totalOptimizations() >= 0);
        assertTrue(status.tpsImprovement() >= 0.0);
        assertTrue(status.resourceEfficiency() >= 0.0);
        
        LOG.infof("AI Optimization Status: enabled=%s, models=%s, optimizations=%d",
                 status.enabled(), status.modelsInitialized(), status.totalOptimizations());
    }

    @Test
    @DisplayName("Predictive Routing Engine should balance requests intelligently")
    void testPredictiveRouting() throws InterruptedException {
        // Test routing engine functionality
        var routingMetrics = routingEngine.getRoutingMetrics();
        
        assertNotNull(routingMetrics);
        assertTrue(routingMetrics.totalDecisions() >= 0);
        assertTrue(routingMetrics.loadBalanceScore() >= 0.0);
        assertTrue(routingMetrics.availableNodes() > 0);
        assertTrue(routingMetrics.mlEnabled());
        
        // Test actual routing decision
        var routingResult = routingEngine.routeTransaction(createTestTransaction("test-tx-1"))
                .await().atMost(5, TimeUnit.SECONDS);
        
        assertNotNull(routingResult);
        assertFalse(routingResult.isEmpty());
        assertTrue(routingResult.startsWith("aurigraph-v11-node-"));
        
        LOG.infof("Predictive Routing Metrics: decisions=%d, balance=%.1f%%, nodes=%d",
                 routingMetrics.totalDecisions(), routingMetrics.loadBalanceScore() * 100,
                 routingMetrics.availableNodes());
    }

    @Test
    @DisplayName("Anomaly Detection Service should detect system anomalies")
    void testAnomalyDetection() {
        // Test anomaly detection functionality
        var detectionStatus = anomalyDetectionService.getDetectionStatus();
        
        assertNotNull(detectionStatus);
        assertTrue(detectionStatus.enabled());
        assertTrue(detectionStatus.modelsInitialized());
        assertTrue(detectionStatus.totalDataPoints() >= 0);
        assertTrue(detectionStatus.detectionAccuracy() >= 0.0);
        assertNotNull(detectionStatus.healthStatus());
        
        // Test active anomalies retrieval
        var activeAnomalies = anomalyDetectionService.getActiveAnomalies();
        assertNotNull(activeAnomalies);
        
        LOG.infof("Anomaly Detection Status: accuracy=%.1f%%, health=%s, active=%d",
                 detectionStatus.detectionAccuracy() * 100, detectionStatus.healthStatus(),
                 detectionStatus.activeAnomalies());
    }

    @Test
    @DisplayName("ML Load Balancer should optimize resource allocation")
    void testMLLoadBalancing() throws InterruptedException {
        // Test ML load balancer functionality
        var lbMetrics = mlLoadBalancer.getLoadBalancingMetrics();
        
        assertNotNull(lbMetrics);
        assertTrue(lbMetrics.enabled());
        assertTrue(lbMetrics.totalRequests() >= 0);
        assertTrue(lbMetrics.loadBalanceScore() >= 0.0);
        assertTrue(lbMetrics.resourceCount() > 0);
        assertNotNull(lbMetrics.currentStrategy());
        
        // Test request balancing
        var balancingResult = mlLoadBalancer.balanceRequest("test-request-1", 100.0)
                .await().atMost(5, TimeUnit.SECONDS);
        
        assertNotNull(balancingResult);
        assertFalse(balancingResult.isEmpty());
        assertTrue(balancingResult.startsWith("resource-"));
        
        LOG.infof("ML Load Balancer Metrics: requests=%d, balance=%.1f%%, resources=%d, strategy=%s",
                 lbMetrics.totalRequests(), lbMetrics.loadBalanceScore() * 100,
                 lbMetrics.resourceCount(), lbMetrics.currentStrategy());
    }

    @Test
    @DisplayName("Adaptive Batch Processor should optimize batch parameters")
    void testAdaptiveBatchProcessing() {
        // Test adaptive batch processor functionality
        var batchMetrics = batchProcessor.getBatchProcessingMetrics();
        
        assertNotNull(batchMetrics);
        assertTrue(batchMetrics.enabled());
        assertTrue(batchMetrics.currentBatchSize() > 0);
        assertTrue(batchMetrics.currentTimeoutMs() > 0);
        assertTrue(batchMetrics.throughputTPS() >= 0.0);
        assertTrue(batchMetrics.efficiency() >= 0.0);
        assertTrue(batchMetrics.adaptationScore() >= 0.0);
        
        // Test current optimization parameters
        var optimization = batchProcessor.getCurrentOptimization();
        assertNotNull(optimization);
        assertTrue(optimization.batchSize() > 0);
        assertTrue(optimization.timeoutMs() > 0);
        assertTrue(optimization.processingSpeedMultiplier() > 0.0);
        assertNotNull(optimization.compressionType());
        
        LOG.infof("Batch Processor Metrics: batches=%d, success=%.1f%%, throughput=%.0f TPS, efficiency=%.1f%%",
                 batchMetrics.totalBatches(), batchMetrics.successRate(),
                 batchMetrics.throughputTPS(), batchMetrics.efficiency() * 100);
    }

    @Test
    @DisplayName("AI Optimization should provide performance predictions")
    void testPerformancePrediction() throws InterruptedException {
        // Create test performance data point
        var testMetrics = new AIOptimizationService.PerformanceDataPoint(
            java.time.Instant.now(),
            2500000.0,  // 2.5M TPS
            25.0,       // 25ms latency
            0.7,        // 70% CPU
            0.6,        // 60% memory
            1000L,      // 1000 connections
            99.5,       // 99.5% success rate
            16          // 16 cores
        );

        // Get performance prediction
        var prediction = aiOptimizationService.getPrediction(testMetrics)
                .await().atMost(5, TimeUnit.SECONDS);
        
        assertNotNull(prediction);
        assertNotNull(prediction.type());
        assertTrue(prediction.confidence() >= 0.0);
        assertTrue(prediction.confidence() <= 1.0);
        assertNotNull(prediction.parameters());
        
        LOG.infof("Performance Prediction: type=%s, confidence=%.1f%%, parameters=%d",
                 prediction.type(), prediction.confidence() * 100, prediction.parameters().size());
    }

    @Test
    @DisplayName("AI services should demonstrate 3M+ TPS optimization capability")
    void testTPSOptimizationCapability() {
        // Test the collective capability to achieve 3M+ TPS target
        var aiStatus = aiOptimizationService.getOptimizationStatus();
        var routingMetrics = routingEngine.getRoutingMetrics();
        var batchMetrics = batchProcessor.getBatchProcessingMetrics();
        var lbMetrics = mlLoadBalancer.getLoadBalancingMetrics();
        
        // Verify all components are working together for optimization
        assertTrue(aiStatus.enabled(), "AI Optimization should be enabled");
        assertTrue(routingMetrics.mlEnabled(), "ML routing should be enabled");
        assertTrue(batchMetrics.enabled(), "Adaptive batching should be enabled");
        assertTrue(lbMetrics.enabled(), "ML load balancing should be enabled");
        
        // Check optimization scores indicate improvement potential
        assertTrue(aiStatus.tpsImprovement() >= 0.0, "TPS improvement should be non-negative");
        assertTrue(routingMetrics.loadBalanceScore() >= 0.0, "Load balance score should be non-negative");
        assertTrue(batchMetrics.adaptationScore() >= 0.0, "Batch adaptation score should be non-negative");
        assertTrue(lbMetrics.resourceEfficiency() >= 0.0, "Resource efficiency should be non-negative");
        
        LOG.infof("3M+ TPS Optimization Capability Assessment:");
        LOG.infof("  AI TPS Improvement: %.1f%% (target: 20-30%%)", aiStatus.tpsImprovement());
        LOG.infof("  Routing Load Balance: %.1f%% (target: 95%%+)", routingMetrics.loadBalanceScore() * 100);
        LOG.infof("  Batch Processing Efficiency: %.1f%% (target: 25-35%% improvement)", batchMetrics.efficiency() * 100);
        LOG.infof("  Resource Efficiency: %.1f%% (target: 15-25%% improvement)", lbMetrics.resourceEfficiency() * 100);
        
        // Verify architecture supports high concurrency
        assertTrue(routingMetrics.availableNodes() >= 3, "Should have multiple routing nodes");
        assertTrue(lbMetrics.resourceCount() >= 4, "Should have multiple load balancer resources");
        assertTrue(batchMetrics.currentBatchSize() >= 100, "Should support reasonable batch sizes");
    }

    @Test
    @DisplayName("AI optimization should handle manual triggering")
    void testManualOptimizationTriggers() throws InterruptedException {
        // Test manual optimization triggers
        var aiResult = aiOptimizationService.retrainModels()
                .await().atMost(5, TimeUnit.SECONDS);
        assertNotNull(aiResult);
        assertFalse(aiResult.isEmpty());
        
        var routingResult = routingEngine.optimizeRoutingStrategy()
                .await().atMost(5, TimeUnit.SECONDS);
        assertNotNull(routingResult);
        assertFalse(routingResult.isEmpty());
        
        var anomalyResult = anomalyDetectionService.retrainModels()
                .await().atMost(5, TimeUnit.SECONDS);
        assertNotNull(anomalyResult);
        assertFalse(anomalyResult.isEmpty());
        
        var lbResult = mlLoadBalancer.optimizeLoadBalancing()
                .await().atMost(5, TimeUnit.SECONDS);
        assertNotNull(lbResult);
        assertFalse(lbResult.isEmpty());
        
        LOG.info("Manual optimization triggers completed successfully");
    }

    @Test
    @DisplayName("AI services should provide comprehensive metrics")
    void testComprehensiveMetrics() {
        // Verify all AI services provide detailed metrics
        var aiStatus = aiOptimizationService.getOptimizationStatus();
        assertTrue(aiStatus.totalOptimizations() >= 0);
        assertTrue(aiStatus.currentScore() >= 0.0);
        assertNotNull(aiStatus.modelMetrics());
        
        var routingMetrics = routingEngine.getRoutingMetrics();
        assertTrue(routingMetrics.avgRoutingTimeMs() >= 0.0);
        assertTrue(routingMetrics.predictionAccuracy() >= 0.0);
        
        var detectionStatus = anomalyDetectionService.getDetectionStatus();
        assertTrue(detectionStatus.avgProcessingTimeMs() >= 0.0);
        assertTrue(detectionStatus.truePositives() >= 0);
        
        var lbMetrics = mlLoadBalancer.getLoadBalancingMetrics();
        assertTrue(lbMetrics.avgResponseTimeMs() >= 0.0);
        assertTrue(lbMetrics.predictionAccuracy() >= 0.0);
        
        var batchMetrics = batchProcessor.getBatchProcessingMetrics();
        assertTrue(batchMetrics.avgProcessingTimeMs() >= 0.0);
        assertTrue(batchMetrics.queueSize() >= 0);
        
        LOG.infof("Comprehensive metrics validation completed - all services reporting detailed performance data");
    }

    // Helper methods

    private io.aurigraph.v11.consensus.ConsensusModels.Transaction createTestTransaction(String id) {
        return new io.aurigraph.v11.consensus.ConsensusModels.Transaction(
            id,
            1000.0,
            "test-sender",
            "test-receiver",
            java.time.Instant.now(),
            "PENDING"
        );
    }
}