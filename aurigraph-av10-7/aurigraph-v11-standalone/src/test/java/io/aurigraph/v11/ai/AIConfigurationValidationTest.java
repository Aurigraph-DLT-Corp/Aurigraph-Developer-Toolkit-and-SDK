package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import org.eclipse.microprofile.config.ConfigProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Configuration Validation Test Suite for AI Optimization System
 * 
 * Validates that all AI configuration properties are properly loaded
 * and have reasonable values for production deployment.
 * 
 * @author Aurigraph AI Team
 * @version 11.0.0
 * @since 2024-09-10
 */
@QuarkusTest
@DisplayName("AI Configuration Validation Tests")
public class AIConfigurationValidationTest {

    @Nested
    @DisplayName("Core AI Configuration Tests")
    class CoreConfigurationTests {

        @Test
        @DisplayName("Should load all required AI configuration properties")
        void shouldLoadAllRequiredProperties() {
            var config = ConfigProvider.getConfig();
            
            // Core AI settings
            assertTrue(config.getOptionalValue("ai.consensus.optimizer.enabled", Boolean.class).orElse(false));
            assertTrue(config.getOptionalValue("ai.predictive.ordering.enabled", Boolean.class).orElse(false));
            assertTrue(config.getOptionalValue("ai.anomaly.detection.enabled", Boolean.class).orElse(false));
            assertTrue(config.getOptionalValue("ai.adaptive.batching.enabled", Boolean.class).orElse(false));
            
            // Target performance values should be present
            assertTrue(config.getOptionalValue("ai.consensus.target.tps", Long.class).orElse(0L) > 0);
            assertTrue(config.getOptionalValue("ai.consensus.target.latency.ms", Integer.class).orElse(0) > 0);
        }

        @Test
        @DisplayName("Should have realistic performance targets")
        void shouldHaveRealisticPerformanceTargets() {
            var config = ConfigProvider.getConfig();
            
            // TPS should be in reasonable range (100K - 10M)
            long targetTps = config.getOptionalValue("ai.consensus.target.tps", Long.class).orElse(0L);
            assertTrue(targetTps >= 100_000, "Target TPS should be at least 100K");
            assertTrue(targetTps <= 10_000_000, "Target TPS should be at most 10M");
            
            // Latency should be reasonable (10ms - 1000ms)
            int targetLatency = config.getOptionalValue("ai.consensus.target.latency.ms", Integer.class).orElse(0);
            assertTrue(targetLatency >= 10, "Target latency should be at least 10ms");
            assertTrue(targetLatency <= 1000, "Target latency should be at most 1000ms");
            
            // Success rate should be high (95% - 100%)
            double targetSuccessRate = config.getOptionalValue("ai.consensus.target.success.rate", Double.class).orElse(0.0);
            assertTrue(targetSuccessRate >= 0.95, "Target success rate should be at least 95%");
            assertTrue(targetSuccessRate <= 1.0, "Target success rate should be at most 100%");
        }
    }

    @Nested
    @DisplayName("Machine Learning Configuration Tests")
    class MachineLearningConfigurationTests {

        @Test
        @DisplayName("Should have valid neural network configuration")
        void shouldHaveValidNeuralNetworkConfig() {
            var config = ConfigProvider.getConfig();
            
            // Learning rate should be in valid range
            double learningRate = config.getOptionalValue("ai.ml.learning.rate", Double.class).orElse(0.0);
            assertTrue(learningRate > 0.0001, "Learning rate should be greater than 0.0001");
            assertTrue(learningRate < 0.1, "Learning rate should be less than 0.1");
            
            // Epochs should be reasonable
            int epochs = config.getOptionalValue("ai.ml.epochs", Integer.class).orElse(0);
            assertTrue(epochs >= 10, "Epochs should be at least 10");
            assertTrue(epochs <= 10000, "Epochs should be at most 10000");
            
            // Batch size should be reasonable
            int batchSize = config.getOptionalValue("ai.ml.batch.size", Integer.class).orElse(0);
            assertTrue(batchSize >= 1, "ML batch size should be at least 1");
            assertTrue(batchSize <= 1024, "ML batch size should be at most 1024");
        }

        @Test
        @DisplayName("Should have valid ensemble model configuration")
        void shouldHaveValidEnsembleConfig() {
            var config = ConfigProvider.getConfig();
            
            // Random forest trees
            int rfTrees = config.getOptionalValue("ai.ml.random.forest.trees", Integer.class).orElse(0);
            assertTrue(rfTrees >= 10, "Random forest should have at least 10 trees");
            assertTrue(rfTrees <= 1000, "Random forest should have at most 1000 trees");
            
            // Gradient boost iterations
            int gbIterations = config.getOptionalValue("ai.ml.gradient.boost.iterations", Integer.class).orElse(0);
            assertTrue(gbIterations >= 10, "Gradient boost should have at least 10 iterations");
            assertTrue(gbIterations <= 1000, "Gradient boost should have at most 1000 iterations");
        }

        @Test
        @DisplayName("Should have valid LSTM configuration")
        void shouldHaveValidLSTMConfig() {
            var config = ConfigProvider.getConfig();
            
            // Sequence length
            int seqLength = config.getOptionalValue("ai.ml.lstm.sequence.length", Integer.class).orElse(0);
            assertTrue(seqLength >= 10, "LSTM sequence length should be at least 10");
            assertTrue(seqLength <= 1000, "LSTM sequence length should be at most 1000");
            
            // Prediction window
            int predWindow = config.getOptionalValue("ai.consensus.prediction.window.size", Integer.class).orElse(0);
            assertTrue(predWindow >= 10, "Prediction window should be at least 10");
            assertTrue(predWindow <= 500, "Prediction window should be at most 500");
        }
    }

    @Nested
    @DisplayName("Reinforcement Learning Configuration Tests")
    class ReinforcementLearningConfigurationTests {

        @Test
        @DisplayName("Should have valid RL parameters")
        void shouldHaveValidRLParameters() {
            var config = ConfigProvider.getConfig();
            
            // Exploration rate
            double explorationRate = config.getOptionalValue("ai.rl.exploration.rate", Double.class).orElse(-1.0);
            assertTrue(explorationRate >= 0.0, "Exploration rate should be non-negative");
            assertTrue(explorationRate <= 1.0, "Exploration rate should be at most 1.0");
            
            // Learning rate
            double rlLearningRate = config.getOptionalValue("ai.rl.learning.rate", Double.class).orElse(-1.0);
            assertTrue(rlLearningRate > 0.0, "RL learning rate should be positive");
            assertTrue(rlLearningRate <= 1.0, "RL learning rate should be at most 1.0");
            
            // Discount factor
            double discountFactor = config.getOptionalValue("ai.rl.discount.factor", Double.class).orElse(-1.0);
            assertTrue(discountFactor >= 0.0, "Discount factor should be non-negative");
            assertTrue(discountFactor <= 1.0, "Discount factor should be at most 1.0");
        }

        @Test
        @DisplayName("Should have epsilon decay configuration")
        void shouldHaveEpsilonDecayConfig() {
            var config = ConfigProvider.getConfig();
            
            // Epsilon decay
            double epsilonDecay = config.getOptionalValue("ai.rl.epsilon.decay", Double.class).orElse(-1.0);
            assertTrue(epsilonDecay > 0.9, "Epsilon decay should be greater than 0.9");
            assertTrue(epsilonDecay <= 1.0, "Epsilon decay should be at most 1.0");
            
            // Minimum epsilon
            double minEpsilon = config.getOptionalValue("ai.rl.min.epsilon", Double.class).orElse(-1.0);
            assertTrue(minEpsilon >= 0.001, "Minimum epsilon should be at least 0.001");
            assertTrue(minEpsilon <= 0.1, "Minimum epsilon should be at most 0.1");
        }
    }

    @Nested
    @DisplayName("Anomaly Detection Configuration Tests")
    class AnomalyDetectionConfigurationTests {

        @Test
        @DisplayName("Should have valid anomaly detection thresholds")
        void shouldHaveValidThresholds() {
            var config = ConfigProvider.getConfig();
            
            // Main anomaly threshold
            double anomalyThreshold = config.getOptionalValue("ai.consensus.anomaly.threshold", Double.class).orElse(0.0);
            assertTrue(anomalyThreshold >= 0.8, "Anomaly threshold should be at least 80%");
            assertTrue(anomalyThreshold <= 1.0, "Anomaly threshold should be at most 100%");
            
            // Contamination rate for isolation forest
            double contamination = config.getOptionalValue("ai.anomaly.detection.contamination.rate", Double.class).orElse(-1.0);
            assertTrue(contamination > 0.0, "Contamination rate should be positive");
            assertTrue(contamination < 0.1, "Contamination rate should be less than 10%");
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "ai.anomaly.throughput.degradation.threshold",
            "ai.anomaly.latency.spike.threshold", 
            "ai.anomaly.success.rate.degradation.threshold",
            "ai.anomaly.resource.utilization.threshold"
        })
        @DisplayName("Should have specific anomaly thresholds configured")
        void shouldHaveSpecificAnomalyThresholds(String propertyName) {
            var config = ConfigProvider.getConfig();
            
            double threshold = config.getOptionalValue(propertyName, Double.class).orElse(-1.0);
            assertTrue(threshold > 0.0, propertyName + " should be positive");
            assertTrue(threshold <= 10.0, propertyName + " should be reasonable (<=10)");
        }
    }

    @Nested
    @DisplayName("System Resource Configuration Tests")
    class SystemResourceConfigurationTests {

        @Test
        @DisplayName("Should have valid thread pool configuration")
        void shouldHaveValidThreadPoolConfig() {
            var config = ConfigProvider.getConfig();
            
            // Main thread pool
            int threadPoolSize = config.getOptionalValue("ai.resources.thread.pool.size", Integer.class).orElse(0);
            assertTrue(threadPoolSize >= 16, "Thread pool should have at least 16 threads");
            assertTrue(threadPoolSize <= 1024, "Thread pool should have at most 1024 threads");
            
            // AI processing threads
            int aiThreads = config.getOptionalValue("ai.executor.ai.processing.threads", Integer.class).orElse(0);
            assertTrue(aiThreads >= 8, "AI processing should have at least 8 threads");
            assertTrue(aiThreads <= 256, "AI processing should have at most 256 threads");
        }

        @Test
        @DisplayName("Should have valid memory configuration")
        void shouldHaveValidMemoryConfig() {
            var config = ConfigProvider.getConfig();
            
            // Memory limit
            int memoryLimit = config.getOptionalValue("ai.resources.memory.limit.mb", Integer.class).orElse(0);
            assertTrue(memoryLimit >= 512, "Memory limit should be at least 512MB");
            assertTrue(memoryLimit <= 32768, "Memory limit should be at most 32GB");
            
            // Disk cache size
            int diskCache = config.getOptionalValue("ai.resources.disk.cache.size.mb", Integer.class).orElse(0);
            assertTrue(diskCache >= 100, "Disk cache should be at least 100MB");
            assertTrue(diskCache <= 10240, "Disk cache should be at most 10GB");
        }
    }

    @Nested
    @DisplayName("Timing and Interval Configuration Tests")
    class TimingConfigurationTests {

        @Test
        @DisplayName("Should have valid optimization intervals")
        void shouldHaveValidOptimizationIntervals() {
            var config = ConfigProvider.getConfig();
            
            // Model update interval
            int modelUpdateInterval = config.getOptionalValue("ai.consensus.model.update.interval.ms", Integer.class).orElse(0);
            assertTrue(modelUpdateInterval >= 10000, "Model update interval should be at least 10 seconds");
            assertTrue(modelUpdateInterval <= 3600000, "Model update interval should be at most 1 hour");
            
            // Batch optimization interval
            int batchInterval = config.getOptionalValue("ai.batch.optimization.interval.ms", Integer.class).orElse(0);
            assertTrue(batchInterval >= 100, "Batch optimization interval should be at least 100ms");
            assertTrue(batchInterval <= 60000, "Batch optimization interval should be at most 1 minute");
        }

        @Test
        @DisplayName("Should have valid monitoring intervals")
        void shouldHaveValidMonitoringIntervals() {
            var config = ConfigProvider.getConfig();
            
            // System monitoring interval
            int monitoringInterval = config.getOptionalValue("ai.monitoring.interval.ms", Integer.class).orElse(0);
            assertTrue(monitoringInterval >= 1000, "Monitoring interval should be at least 1 second");
            assertTrue(monitoringInterval <= 60000, "Monitoring interval should be at most 1 minute");
            
            // Health check interval
            int healthCheckInterval = config.getOptionalValue("ai.monitoring.health.check.interval.ms", Integer.class).orElse(0);
            assertTrue(healthCheckInterval >= 5000, "Health check interval should be at least 5 seconds");
            assertTrue(healthCheckInterval <= 300000, "Health check interval should be at most 5 minutes");
        }
    }

    @Nested
    @DisplayName("Batch Processing Configuration Tests")
    class BatchProcessingConfigurationTests {

        @Test
        @DisplayName("Should have valid batch size configuration")
        void shouldHaveValidBatchSizeConfig() {
            var config = ConfigProvider.getConfig();
            
            // Minimum batch size
            int minBatchSize = config.getOptionalValue("ai.batch.min.size", Integer.class).orElse(0);
            assertTrue(minBatchSize >= 100, "Minimum batch size should be at least 100");
            assertTrue(minBatchSize <= 10000, "Minimum batch size should be at most 10000");
            
            // Maximum batch size
            int maxBatchSize = config.getOptionalValue("ai.batch.max.size", Integer.class).orElse(0);
            assertTrue(maxBatchSize >= minBatchSize, "Maximum batch size should be >= minimum");
            assertTrue(maxBatchSize <= 100000, "Maximum batch size should be at most 100000");
            
            // Target batch size should be between min and max
            int targetBatchSize = config.getOptionalValue("ai.batch.target.size", Integer.class).orElse(0);
            assertTrue(targetBatchSize >= minBatchSize, "Target batch size should be >= minimum");
            assertTrue(targetBatchSize <= maxBatchSize, "Target batch size should be <= maximum");
        }

        @Test
        @DisplayName("Should have valid batch timeout configuration")
        void shouldHaveValidBatchTimeoutConfig() {
            var config = ConfigProvider.getConfig();
            
            int batchTimeout = config.getOptionalValue("ai.batch.timeout.ms", Integer.class).orElse(0);
            assertTrue(batchTimeout >= 10, "Batch timeout should be at least 10ms");
            assertTrue(batchTimeout <= 10000, "Batch timeout should be at most 10 seconds");
        }
    }

    @Nested
    @DisplayName("Security and Data Configuration Tests")
    class SecurityConfigurationTests {

        @Test
        @DisplayName("Should have security features properly configured")
        void shouldHaveSecurityFeaturesConfigured() {
            var config = ConfigProvider.getConfig();
            
            // Model encryption should be enabled for production
            boolean modelEncryption = config.getOptionalValue("ai.security.model.encryption.enabled", Boolean.class).orElse(false);
            assertTrue(modelEncryption, "Model encryption should be enabled for security");
            
            // Data anonymization should be enabled
            boolean dataAnonymization = config.getOptionalValue("ai.security.data.anonymization.enabled", Boolean.class).orElse(false);
            assertTrue(dataAnonymization, "Data anonymization should be enabled for privacy");
            
            // Audit logging should be enabled
            boolean auditLogging = config.getOptionalValue("ai.security.audit.logging.enabled", Boolean.class).orElse(false);
            assertTrue(auditLogging, "Audit logging should be enabled for compliance");
        }

        @Test
        @DisplayName("Should have data retention policies configured")
        void shouldHaveDataRetentionPolicies() {
            var config = ConfigProvider.getConfig();
            
            // Training data retention
            int retentionDays = config.getOptionalValue("ai.training.data.retention.days", Integer.class).orElse(0);
            assertTrue(retentionDays >= 7, "Data retention should be at least 7 days");
            assertTrue(retentionDays <= 365, "Data retention should be at most 365 days");
            
            // Metrics retention
            int metricsRetention = config.getOptionalValue("ai.monitoring.metrics.retention.hours", Integer.class).orElse(0);
            assertTrue(metricsRetention >= 24, "Metrics retention should be at least 24 hours");
            assertTrue(metricsRetention <= 8760, "Metrics retention should be at most 1 year");
        }
    }

    @Nested
    @DisplayName("Integration Configuration Tests")
    class IntegrationConfigurationTests {

        @Test
        @DisplayName("Should have integration services enabled")
        void shouldHaveIntegrationServicesEnabled() {
            var config = ConfigProvider.getConfig();
            
            // Key integration points should be enabled
            assertTrue(config.getOptionalValue("ai.integration.consensus.service.enabled", Boolean.class).orElse(false));
            assertTrue(config.getOptionalValue("ai.integration.enabled", Boolean.class).orElse(false));
            
            // Sync interval should be reasonable
            int syncInterval = config.getOptionalValue("ai.integration.sync.interval.ms", Integer.class).orElse(0);
            assertTrue(syncInterval >= 100, "Sync interval should be at least 100ms");
            assertTrue(syncInterval <= 10000, "Sync interval should be at most 10 seconds");
        }

        @Test
        @DisplayName("Should have circuit breaker configuration")
        void shouldHaveCircuitBreakerConfig() {
            var config = ConfigProvider.getConfig();
            
            // Circuit breaker should be enabled
            boolean circuitBreakerEnabled = config.getOptionalValue("ai.integration.circuit.breaker.enabled", Boolean.class).orElse(false);
            assertTrue(circuitBreakerEnabled, "Circuit breaker should be enabled for resilience");
            
            // Failure threshold should be reasonable
            int failureThreshold = config.getOptionalValue("ai.integration.circuit.breaker.failure.threshold", Integer.class).orElse(0);
            assertTrue(failureThreshold >= 3, "Circuit breaker failure threshold should be at least 3");
            assertTrue(failureThreshold <= 20, "Circuit breaker failure threshold should be at most 20");
        }
    }

    @Nested
    @DisplayName("Development and Debug Configuration Tests")
    class DevelopmentConfigurationTests {

        @Test
        @DisplayName("Should have appropriate debug configuration for environment")
        void shouldHaveAppropriateDebugConfig() {
            var config = ConfigProvider.getConfig();
            
            // In test environment, debug can be enabled or disabled
            boolean debugEnabled = config.getOptionalValue("ai.debug.enabled", Boolean.class).orElse(false);
            // This is acceptable in either state for testing
            
            String logLevel = config.getOptionalValue("ai.debug.log.level", String.class).orElse("info");
            assertTrue(logLevel.equals("debug") || logLevel.equals("info") || logLevel.equals("warn") || logLevel.equals("error"),
                      "Log level should be a valid level: debug, info, warn, or error");
        }

        @Test
        @DisplayName("Should have test mode configuration")
        void shouldHaveTestModeConfig() {
            var config = ConfigProvider.getConfig();
            
            // Test mode configuration should be available
            boolean testModeEnabled = config.getOptionalValue("ai.test.mode.enabled", Boolean.class).orElse(false);
            // Can be either enabled or disabled in tests
            
            boolean benchmarkMode = config.getOptionalValue("ai.test.benchmark.mode.enabled", Boolean.class).orElse(false);
            // Can be either enabled or disabled in tests
        }
    }

    @Test
    @DisplayName("Should have all critical AI configuration properties present")
    void shouldHaveAllCriticalPropertiesPresent() {
        var config = ConfigProvider.getConfig();
        
        // List of absolutely critical properties that must be present
        String[] criticalProperties = {
            "ai.consensus.optimizer.enabled",
            "ai.consensus.target.tps",
            "ai.ml.learning.rate",
            "ai.resources.thread.pool.size",
            "ai.monitoring.enabled",
            "ai.security.model.encryption.enabled"
        };
        
        for (String property : criticalProperties) {
            assertTrue(config.getOptionalValue(property, String.class).isPresent(),
                      "Critical property " + property + " must be present in configuration");
        }
    }
}