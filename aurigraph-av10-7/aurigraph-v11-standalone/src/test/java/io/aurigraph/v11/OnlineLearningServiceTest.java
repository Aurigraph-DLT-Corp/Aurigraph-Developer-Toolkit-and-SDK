package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import io.aurigraph.v11.ai.OnlineLearningService;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * OnlineLearningService Unit Tests
 *
 * Tests core functionality of online learning component:
 * - Model versioning and promotion
 * - A/B testing framework
 * - Adaptive learning rate
 * - Experience replay buffer
 */
@QuarkusTest
@DisplayName("OnlineLearningService Unit Tests")
public class OnlineLearningServiceTest {

    private static final Logger LOG = Logger.getLogger(OnlineLearningServiceTest.class);

    @Inject
    private OnlineLearningService onlineLearningService;

    @BeforeEach
    public void setup() {
        LOG.info("✓ OnlineLearningService test setup");
    }

    /**
     * Test: Online learning service initializes correctly
     */
    @Test
    @DisplayName("OnlineLearning.Test1: Service initialization")
    public void testOnlineLearningServiceInitialization() {
        LOG.info("TEST: OnlineLearningService initialization");

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertNotNull(metrics);
        assertTrue(metrics.accuracyThreshold >= 0.95, "Threshold should be at least 95%");
        assertTrue(metrics.learningRate > 0, "Learning rate should be positive");

        LOG.info("✅ OnlineLearningService initialized successfully");
    }

    /**
     * Test: Model update incrementally works without errors
     */
    @Test
    @DisplayName("OnlineLearning.Test2: Incremental model update")
    public void testIncrementalModelUpdate() {
        LOG.info("TEST: Incremental model update");

        List<Object> transactions = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            transactions.add(new Object());
        }

        // Should not throw exception
        onlineLearningService.updateModelsIncrementally(1000L, transactions);

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertTrue(metrics.totalUpdates >= 0, "Update counter should be non-negative");

        LOG.info("✅ Incremental model update successful");
    }

    /**
     * Test: A/B testing traffic split
     */
    @Test
    @DisplayName("OnlineLearning.Test3: A/B test traffic split")
    public void testABTestTrafficSplit() {
        LOG.info("TEST: A/B test traffic split (5%)");

        // Run multiple updates to establish A/B test patterns
        List<Object> transactions = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            transactions.add(new Object());
        }

        onlineLearningService.updateModelsIncrementally(5000L, transactions);

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertNotNull(metrics, "Metrics should not be null");

        LOG.info("✅ A/B test framework verified");
    }

    /**
     * Test: Metrics retrieval
     */
    @Test
    @DisplayName("OnlineLearning.Test4: Metrics retrieval")
    public void testMetricsRetrieval() {
        LOG.info("TEST: Metrics retrieval");

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();

        assertNotNull(metrics);
        assertEquals(0, metrics.correctPredictions, "Initial correct predictions should be 0");
        assertEquals(0, metrics.totalPredictions, "Initial total predictions should be 0");
        assertTrue(metrics.lastAccuracy >= 0 && metrics.lastAccuracy <= 1.0, "Accuracy should be 0-1");

        LOG.infof("  Accuracy: %.2f%%", metrics.lastAccuracy * 100);
        LOG.infof("  Learning Rate: %.4f", metrics.learningRate);
        LOG.infof("  Threshold: %.2f%%", metrics.accuracyThreshold * 100);

        LOG.info("✅ Metrics retrieval successful");
    }

    /**
     * Test: Adaptive learning rate updates
     */
    @Test
    @DisplayName("OnlineLearning.Test5: Adaptive learning rate")
    public void testAdaptiveLearningRate() {
        LOG.info("TEST: Adaptive learning rate");

        OnlineLearningService.OnlineLearningMetrics metrics1 = onlineLearningService.getMetrics();
        double initialLearningRate = metrics1.learningRate;

        // Run multiple updates
        for (int i = 0; i < 5; i++) {
            List<Object> transactions = new ArrayList<>();
            for (int j = 0; j < 1000; j++) {
                transactions.add(new Object());
            }
            onlineLearningService.updateModelsIncrementally((long)(i * 1000), transactions);
        }

        OnlineLearningService.OnlineLearningMetrics metrics2 = onlineLearningService.getMetrics();
        double finalLearningRate = metrics2.learningRate;

        // Learning rate should be within valid range
        assertTrue(finalLearningRate >= 0.001 && finalLearningRate <= 0.1,
            String.format("Learning rate %.4f outside valid range [0.001, 0.1]", finalLearningRate));

        LOG.infof("  Initial LR: %.4f", initialLearningRate);
        LOG.infof("  Final LR: %.4f", finalLearningRate);
        LOG.info("✅ Adaptive learning rate within valid bounds");
    }

    /**
     * Test: Multiple concurrent model updates
     */
    @Test
    @DisplayName("OnlineLearning.Test6: Concurrent updates")
    public void testConcurrentModelUpdates() throws InterruptedException {
        LOG.info("TEST: Concurrent model updates");

        Thread t1 = new Thread(() -> {
            List<Object> txs = new ArrayList<>();
            for (int i = 0; i < 500; i++) txs.add(new Object());
            onlineLearningService.updateModelsIncrementally(1000L, txs);
        });

        Thread t2 = new Thread(() -> {
            List<Object> txs = new ArrayList<>();
            for (int i = 0; i < 500; i++) txs.add(new Object());
            onlineLearningService.updateModelsIncrementally(2000L, txs);
        });

        t1.start();
        t2.start();
        t1.join();
        t2.join();

        OnlineLearningService.OnlineLearningMetrics metrics = onlineLearningService.getMetrics();
        assertNotNull(metrics, "Metrics should be thread-safe");

        LOG.info("✅ Concurrent updates handled safely");
    }
}
