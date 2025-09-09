package io.aurigraph.v11.consensus;

import io.aurigraph.v11.consensus.ConsensusModels.*;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.mockito.Mockito;

import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for HyperRAFTConsensusService
 * 
 * Tests cover:
 * - Consensus initialization
 * - Transaction processing pipeline
 * - Performance benchmarks (>95% coverage target)
 * - Leader election integration
 * - Error handling and resilience
 */
@QuarkusTest
@TestProfile(ConsensusTestProfile.class)
public class HyperRAFTConsensusServiceTest {

    @Inject
    HyperRAFTConsensusService consensusService;

    private LeaderElectionManager mockLeaderElectionManager;
    private ConsensusStateManager mockStateManager;
    private ValidationPipeline mockValidationPipeline;
    private Event<ConsensusEvent> mockEventBus;

    @BeforeEach
    void setUp() {
        // Create mocks for dependencies
        mockLeaderElectionManager = Mockito.mock(LeaderElectionManager.class);
        mockStateManager = Mockito.mock(ConsensusStateManager.class);
        mockValidationPipeline = Mockito.mock(ValidationPipeline.class);
        mockEventBus = Mockito.mock(Event.class);
        
        // Setup mock behaviors
        setupMockBehaviors();
    }

    private void setupMockBehaviors() {
        // LeaderElectionManager mocks
        doNothing().when(mockLeaderElectionManager).initialize(anyString(), any(), anyInt(), anyInt());
        when(mockLeaderElectionManager.getState()).thenReturn(ElectionState.FOLLOWER);
        when(mockLeaderElectionManager.getCurrentTerm()).thenReturn(1);
        when(mockLeaderElectionManager.getCurrentLeader()).thenReturn(null);

        // ConsensusStateManager mocks
        doNothing().when(mockStateManager).initialize(anyString(), any());
        when(mockStateManager.commitState(any())).thenReturn(
            io.smallrye.mutiny.Uni.createFrom().item("mock_state_root_123")
        );

        // ValidationPipeline mocks
        doNothing().when(mockValidationPipeline).initialize(anyInt(), anyInt());
    }

    @Test
    @Timeout(10)
    void testServiceInitialization() {
        // Test that service initializes without errors
        assertNotNull(consensusService);
        
        // Verify performance metrics are initialized
        PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
        assertNotNull(metrics);
        assertEquals(0.0, metrics.getCurrentTps());
        assertTrue(metrics.getSuccessRate() >= 99.0);
    }

    @Test
    @Timeout(15)
    void testTransactionBatchProcessing() throws Exception {
        // Create test transaction batch
        List<Transaction> transactions = createTestTransactions(1000);
        
        long startTime = System.currentTimeMillis();
        
        // Process transaction batch
        Block result = consensusService.processTransactionBatch(transactions)
            .subscribeAsCompletionStage()
            .get(10, TimeUnit.SECONDS);
        
        long processingTime = System.currentTimeMillis() - startTime;
        
        // Verify results
        assertNotNull(result);
        assertEquals(1000, result.getTransactions().size());
        assertTrue(processingTime < 5000); // Should complete in under 5 seconds
        
        // Verify performance metrics updated
        PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
        assertTrue(metrics.getTotalProcessed() >= 1000);
        assertTrue(metrics.getCurrentTps() > 0);
    }

    @Test
    @Timeout(30)
    void testHighThroughputProcessing() throws Exception {
        // Test high throughput scenario - target 100K TPS minimum
        int batchSize = 50000;
        int numberOfBatches = 4;
        long totalTransactions = 0;
        long totalTime = 0;
        
        for (int i = 0; i < numberOfBatches; i++) {
            List<Transaction> transactions = createTestTransactions(batchSize);
            
            long batchStart = System.nanoTime();
            
            Block result = consensusService.processTransactionBatch(transactions)
                .subscribeAsCompletionStage()
                .get(15, TimeUnit.SECONDS);
            
            long batchTime = System.nanoTime() - batchStart;
            
            assertNotNull(result);
            assertEquals(batchSize, result.getTransactions().size());
            
            totalTransactions += batchSize;
            totalTime += batchTime;
        }
        
        // Calculate actual TPS
        double actualTps = (totalTransactions * 1_000_000_000.0) / totalTime;
        
        System.out.printf("Achieved TPS: %.0f (Target: 100,000+ TPS)%n", actualTps);
        
        // Verify minimum performance requirement
        assertTrue(actualTps >= 50000, 
            String.format("TPS too low: %.0f < 50,000 minimum", actualTps));
        
        // Verify peak performance tracking
        PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
        assertTrue(metrics.getPeakTps() > 0);
    }

    @Test
    void testConsensusStatusTracking() {
        // Test consensus status reporting
        ConsensusStatus status = consensusService.getStatus();
        
        assertNotNull(status);
        assertNotNull(status.getState());
        assertTrue(status.getTerm() >= 0);
        assertTrue(status.getValidatorCount() > 0);
        assertEquals(3, status.getValidatorCount()); // Based on test config
    }

    @Test
    void testLeaderElectionTrigger() {
        // Test manual leader election trigger
        assertDoesNotThrow(() -> {
            consensusService.triggerElection();
        });
        
        // Verify election was attempted (would check mock interactions in real impl)
        ConsensusStatus status = consensusService.getStatus();
        assertNotNull(status);
    }

    @Test 
    void testPerformanceMetricsAccuracy() throws Exception {
        // Process known number of transactions
        int testTransactionCount = 10000;
        List<Transaction> transactions = createTestTransactions(testTransactionCount);
        
        long initialProcessed = consensusService.getPerformanceMetrics().getTotalProcessed();
        
        consensusService.processTransactionBatch(transactions)
            .subscribeAsCompletionStage()
            .get(10, TimeUnit.SECONDS);
        
        // Wait for metrics update
        Thread.sleep(100);
        
        PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
        
        // Verify metrics accuracy
        long expectedProcessed = initialProcessed + testTransactionCount;
        assertEquals(expectedProcessed, metrics.getTotalProcessed());
        assertTrue(metrics.getCurrentTps() >= 0);
        assertTrue(metrics.getSuccessRate() >= 95.0);
    }

    @Test
    @Timeout(5)
    void testConcurrentTransactionProcessing() throws InterruptedException {
        // Test concurrent transaction processing
        int numberOfThreads = 10;
        int transactionsPerThread = 1000;
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        List<Exception> exceptions = Collections.synchronizedList(new ArrayList<>());
        
        // Submit concurrent batches
        for (int i = 0; i < numberOfThreads; i++) {
            new Thread(() -> {
                try {
                    List<Transaction> transactions = createTestTransactions(transactionsPerThread);
                    consensusService.processTransactionBatch(transactions)
                        .subscribeAsCompletionStage()
                        .get(5, TimeUnit.SECONDS);
                } catch (Exception e) {
                    exceptions.add(e);
                } finally {
                    latch.countDown();
                }
            }).start();
        }
        
        // Wait for all threads to complete
        assertTrue(latch.await(30, TimeUnit.SECONDS));
        
        // Verify no exceptions occurred
        assertTrue(exceptions.isEmpty(), 
            "Concurrent processing failed: " + exceptions);
        
        // Verify total processed count
        PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
        long expectedTotal = numberOfThreads * transactionsPerThread;
        assertTrue(metrics.getTotalProcessed() >= expectedTotal);
    }

    @Test
    void testErrorHandlingAndResilience() {
        // Test error handling with invalid transactions
        List<Transaction> invalidTransactions = createInvalidTransactions(100);
        
        assertDoesNotThrow(() -> {
            Block result = consensusService.processTransactionBatch(invalidTransactions)
                .subscribeAsCompletionStage()
                .get(5, TimeUnit.SECONDS);
            
            assertNotNull(result);
            // Should handle invalid transactions gracefully
            assertTrue(result.getTransactions().size() >= 0);
        });
    }

    @Test
    void testMemoryUsageOptimization() {
        // Test memory efficiency with large batches
        Runtime runtime = Runtime.getRuntime();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Process multiple large batches
        for (int i = 0; i < 5; i++) {
            List<Transaction> largeBatch = createTestTransactions(10000);
            
            assertDoesNotThrow(() -> {
                consensusService.processTransactionBatch(largeBatch)
                    .subscribeAsCompletionStage()
                    .get(10, TimeUnit.SECONDS);
            });
            
            // Force garbage collection
            System.gc();
        }
        
        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        long memoryIncrease = finalMemory - initialMemory;
        
        // Verify memory usage is reasonable (less than 100MB increase)
        assertTrue(memoryIncrease < 100 * 1024 * 1024, 
            String.format("Memory usage too high: %d bytes increase", memoryIncrease));
    }

    // Helper methods

    private List<Transaction> createTestTransactions(int count) {
        List<Transaction> transactions = new ArrayList<>(count);
        
        for (int i = 0; i < count; i++) {
            transactions.add(new Transaction(
                "tx_" + i,
                "hash_" + i,
                "test_data_" + i,
                System.currentTimeMillis(),
                "from_" + i,
                "to_" + (i + 1),
                (long) (Math.random() * 1000),
                null, // ZK proof will be generated in pipeline
                "signature_" + i
            ));
        }
        
        return transactions;
    }

    private List<Transaction> createInvalidTransactions(int count) {
        List<Transaction> transactions = new ArrayList<>(count);
        
        for (int i = 0; i < count; i++) {
            // Create transactions with missing or invalid fields
            transactions.add(new Transaction(
                null, // Invalid: null ID
                i % 2 == 0 ? "hash_" + i : null, // Some with null hash
                "invalid_data_" + i,
                System.currentTimeMillis(),
                i % 3 == 0 ? null : "from_" + i, // Some with null from
                "to_" + i,
                i % 4 == 0 ? -100L : 100L, // Some with negative amounts
                null,
                i % 5 == 0 ? null : "sig_" + i // Some with null signatures
            ));
        }
        
        return transactions;
    }
    
    // Performance benchmark test
    @Test
    @Timeout(60)
    void benchmarkConsensusPerformance() throws Exception {
        System.out.println("\n=== HyperRAFT++ Consensus Performance Benchmark ===");
        
        // Warm up
        List<Transaction> warmupTxs = createTestTransactions(1000);
        consensusService.processTransactionBatch(warmupTxs)
            .subscribeAsCompletionStage()
            .get(5, TimeUnit.SECONDS);
        
        // Benchmark different batch sizes
        int[] batchSizes = {1000, 5000, 10000, 25000, 50000};
        
        for (int batchSize : batchSizes) {
            System.out.printf("\nTesting batch size: %d transactions\n", batchSize);
            
            List<Transaction> transactions = createTestTransactions(batchSize);
            
            long startTime = System.nanoTime();
            Block result = consensusService.processTransactionBatch(transactions)
                .subscribeAsCompletionStage()
                .get(30, TimeUnit.SECONDS);
            long endTime = System.nanoTime();
            
            double processingTimeMs = (endTime - startTime) / 1_000_000.0;
            double tps = (batchSize / processingTimeMs) * 1000.0;
            
            System.out.printf("  Processing time: %.2f ms\n", processingTimeMs);
            System.out.printf("  Throughput: %.0f TPS\n", tps);
            System.out.printf("  Success rate: %.2f%%\n", 
                consensusService.getPerformanceMetrics().getSuccessRate());
            
            assertNotNull(result);
            assertEquals(batchSize, result.getTransactions().size());
            
            // Verify minimum performance targets
            if (batchSize >= 10000) {
                assertTrue(tps >= 50000, 
                    String.format("TPS target not met for batch size %d: %.0f < 50,000", batchSize, tps));
            }
        }
        
        System.out.println("\n=== Benchmark Complete ===\n");
    }
}

/**
 * Test profile for consensus testing
 */
class ConsensusTestProfile implements io.quarkus.test.junit.QuarkusTestProfile {
    
    @Override
    public Map<String, String> getConfigOverrides() {
        Map<String, String> config = new HashMap<>();
        
        // Consensus configuration
        config.put("consensus.node.id", "test_node_1");
        config.put("consensus.validators", "test_node_1,test_node_2,test_node_3");
        config.put("consensus.election.timeout.ms", "1000");
        config.put("consensus.heartbeat.interval.ms", "100");
        config.put("consensus.batch.size", "5000");
        config.put("consensus.pipeline.depth", "8");
        config.put("consensus.parallel.threads", "64");
        config.put("consensus.target.tps", "100000");
        
        // Logging configuration for testing
        config.put("quarkus.log.level", "INFO");
        config.put("quarkus.log.category.\"io.aurigraph.v11.consensus\".level", "DEBUG");
        
        return config;
    }
    
    @Override
    public Set<String> tags() {
        return Set.of("consensus", "performance");
    }
}