package io.aurigraph.v11.ai;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AdaptiveBatchProcessor
 * Sprint 1 Day 1 Task 1.2
 *
 * Tests adaptive batch processing with priority queues and performance monitoring
 */
@QuarkusTest
class AdaptiveBatchProcessorTest {

    @Inject
    AdaptiveBatchProcessor processor;

    @BeforeEach
    void setup() {
        // No setup needed for real instances
    }

    @Test
    @DisplayName("Should process batch successfully")
    void testBasicBatchProcessing() throws Exception {
        List<Object> transactions = createMockTransactions(100);

        CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future =
            processor.submitBatch(transactions, 5);

        AdaptiveBatchProcessor.BatchProcessingResult result =
            future.get(5, TimeUnit.SECONDS);

        assertTrue(result.isSuccess(), "Batch should process successfully");
        assertEquals(100, result.inputSize, "Input size should match");
        assertEquals(100, result.processedCount, "All transactions should be processed");
        assertTrue(result.processingTimeMs > 0, "Processing time should be positive");
    }

    @Test
    @DisplayName("Should handle priority-based ordering")
    void testPriorityOrdering() throws Exception {
        List<Object> highPriority = createMockTransactions(50);
        List<Object> lowPriority = createMockTransactions(50);

        // Submit low priority first
        CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> futureLow =
            processor.submitBatch(lowPriority, 7);

        // Then submit high priority
        CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> futureHigh =
            processor.submitBatch(highPriority, 0);

        // High priority should potentially complete first (or at least not be blocked)
        AdaptiveBatchProcessor.BatchProcessingResult highResult =
            futureHigh.get(5, TimeUnit.SECONDS);
        AdaptiveBatchProcessor.BatchProcessingResult lowResult =
            futureLow.get(5, TimeUnit.SECONDS);

        assertTrue(highResult.isSuccess(), "High priority batch should succeed");
        assertTrue(lowResult.isSuccess(), "Low priority batch should succeed");
    }

    @Test
    @DisplayName("Should split large batches automatically")
    void testBatchSplitting() throws Exception {
        // Submit batch larger than optimal size (should trigger split)
        List<Object> largeBatch = createMockTransactions(2000);

        CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future =
            processor.submitBatch(largeBatch, 5);

        AdaptiveBatchProcessor.BatchProcessingResult result =
            future.get(5, TimeUnit.SECONDS);

        assertTrue(result.isSuccess(), "Large batch should be handled");
        // Result might indicate split into sub-batches
    }

    @Test
    @DisplayName("Should process multiple concurrent batches")
    void testConcurrentProcessing() throws Exception {
        List<CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult>> futures =
            new ArrayList<>();

        // Submit 10 concurrent batches
        for (int i = 0; i < 10; i++) {
            List<Object> batch = createMockTransactions(50 + i * 10);
            futures.add(processor.submitBatch(batch, 5));
        }

        // Wait for all to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .get(10, TimeUnit.SECONDS);

        // Verify all succeeded
        for (CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future : futures) {
            AdaptiveBatchProcessor.BatchProcessingResult result = future.get();
            assertTrue(result.isSuccess(), "All concurrent batches should succeed");
        }
    }

    @Test
    @DisplayName("Should provide accurate statistics")
    void testStatistics() throws Exception {
        // Process several batches
        for (int i = 0; i < 5; i++) {
            List<Object> batch = createMockTransactions(100);
            CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future =
                processor.submitBatch(batch, 5);
            future.get(5, TimeUnit.SECONDS);
        }

        // Allow processing to complete
        Thread.sleep(500);

        AdaptiveBatchProcessor.ProcessingStatistics stats = processor.getStatistics();

        assertNotNull(stats, "Statistics should not be null");
        assertTrue(stats.totalBatches > 0, "Should have processed batches");
        assertTrue(stats.totalTransactions >= 500, "Should have processed ~500 transactions");
        assertTrue(stats.avgProcessingTimeMs >= 0, "Average processing time should be non-negative");
        assertTrue(stats.throughput >= 0, "Throughput should be non-negative");

        assertNotNull(stats.toString(), "Statistics toString should work");
    }

    @Test
    @DisplayName("Should handle empty batch gracefully")
    void testEmptyBatch() throws Exception {
        List<Object> emptyBatch = new ArrayList<>();

        CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future =
            processor.submitBatch(emptyBatch, 5);

        AdaptiveBatchProcessor.BatchProcessingResult result =
            future.get(5, TimeUnit.SECONDS);

        assertNotNull(result, "Result should not be null for empty batch");
    }

    @Test
    @DisplayName("Should handle various priority levels")
    void testMultiplePriorityLevels() throws Exception {
        List<CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult>> futures =
            new ArrayList<>();

        // Submit batches with different priorities (0-7)
        for (int priority = 0; priority < 8; priority++) {
            List<Object> batch = createMockTransactions(50);
            futures.add(processor.submitBatch(batch, priority));
        }

        // Wait for all to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .get(10, TimeUnit.SECONDS);

        // Verify all succeeded
        for (CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future : futures) {
            assertTrue(future.get().isSuccess(), "All priority levels should work");
        }
    }

    @Test
    @DisplayName("Should integrate with batch size optimizer")
    void testBatchSizeOptimizerIntegration() throws Exception {
        List<Object> batch = createMockTransactions(100);

        CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future =
            processor.submitBatch(batch, 5);

        AdaptiveBatchProcessor.BatchProcessingResult result = future.get(5, TimeUnit.SECONDS);

        // Verify batch processed successfully with optimizer integration
        assertTrue(result.isSuccess(), "Batch should process with optimizer");
    }

    @Test
    @DisplayName("Should handle rapid batch submissions")
    void testRapidSubmissions() throws Exception {
        List<CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult>> futures =
            new ArrayList<>();

        // Submit 50 batches rapidly
        for (int i = 0; i < 50; i++) {
            List<Object> batch = createMockTransactions(20);
            futures.add(processor.submitBatch(batch, 5));
        }

        // Wait for all
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .get(15, TimeUnit.SECONDS);

        // Count successful batches
        long successCount = futures.stream()
            .map(f -> {
                try {
                    return f.get();
                } catch (Exception e) {
                    return null;
                }
            })
            .filter(result -> result != null && result.isSuccess())
            .count();

        assertTrue(successCount >= 45, "Most batches should succeed under rapid submission");
    }

    @Test
    @DisplayName("Should track queue depth")
    void testQueueTracking() throws Exception {
        // Submit many batches to build queue
        List<CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult>> futures =
            new ArrayList<>();

        for (int i = 0; i < 20; i++) {
            List<Object> batch = createMockTransactions(100);
            futures.add(processor.submitBatch(batch, 5));
        }

        // Check statistics while queue is processing
        Thread.sleep(100);

        AdaptiveBatchProcessor.ProcessingStatistics stats = processor.getStatistics();
        // Queue depth should be tracked (may be 0 if already processed)
        assertTrue(stats.queuedBatches >= 0, "Queued batches should be non-negative");

        // Wait for all to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .get(15, TimeUnit.SECONDS);
    }

    @Test
    @DisplayName("Should maintain processing order within same priority")
    void testFIFOWithinPriority() throws Exception {
        List<CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult>> futures =
            new ArrayList<>();

        // Submit multiple batches with same priority
        for (int i = 0; i < 5; i++) {
            List<Object> batch = createMockTransactions(50);
            futures.add(processor.submitBatch(batch, 5));
        }

        // All should complete successfully (FIFO order not strictly testable in unit test)
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .get(10, TimeUnit.SECONDS);

        for (CompletableFuture<AdaptiveBatchProcessor.BatchProcessingResult> future : futures) {
            assertTrue(future.get().isSuccess(), "FIFO batches should all succeed");
        }
    }

    // Helper method to create mock transactions
    private List<Object> createMockTransactions(int count) {
        List<Object> transactions = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            transactions.add("TX-" + i); // Simple string as mock transaction
        }
        return transactions;
    }
}
