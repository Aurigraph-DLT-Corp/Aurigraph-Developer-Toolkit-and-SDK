package io.aurigraph.v11.performance;

import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;
import org.jboss.logging.Logger;

/**
 * High-performance batch processor for transaction processing
 * Optimized for 100K+ transaction batches with minimal latency
 */
public class BatchProcessor {
    
    private static final Logger LOG = Logger.getLogger(BatchProcessor.class);
    
    // Batch processing parameters
    private static final int MAX_BATCH_SIZE = 100_000;
    private static final int MIN_BATCH_SIZE = 1_000;
    private static final int PARALLEL_WORKERS = Runtime.getRuntime().availableProcessors() * 2;
    
    // Processing infrastructure
    private final ForkJoinPool processingPool;
    private final ExecutorService batchExecutor;
    
    // Performance metrics
    private final LongAdder batchesProcessed = new LongAdder();
    private final LongAdder transactionsProcessed = new LongAdder();
    private final AtomicLong totalProcessingTime = new AtomicLong(0);
    private final AtomicLong peakBatchThroughput = new AtomicLong(0);
    
    // Batch optimization
    private volatile int optimalBatchSize = 50_000;
    private volatile long lastOptimization = System.nanoTime();
    
    /**
     * Create batch processor with optimized configuration
     */
    public BatchProcessor() {
        // Create work-stealing pool for CPU-intensive tasks
        this.processingPool = new ForkJoinPool(
            PARALLEL_WORKERS,
            ForkJoinPool.defaultForkJoinWorkerThreadFactory,
            null,
            true // Enable async mode for better throughput
        );
        
        // Create virtual thread executor for I/O tasks
        this.batchExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        LOG.info("BatchProcessor initialized with {} workers, optimal batch size: {}", 
            PARALLEL_WORKERS, optimalBatchSize);
    }
    
    /**
     * Process batch with optimal parallelization
     */
    public CompletableFuture<BatchResult> processBatch(List<TransactionEntry> batch, int shardId) {
        if (batch.isEmpty()) {
            return CompletableFuture.completedFuture(
                new BatchResult(0, 0, 0, 0, 0)
            );
        }
        
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                BatchResult result = processBatchInternal(batch, shardId);
                
                // Update metrics
                long processingTime = System.nanoTime() - startTime;
                updateMetrics(batch.size(), processingTime);
                
                return result;
                
            } catch (Exception e) {
                LOG.warn("Batch processing failed for shard {}: {}", shardId, e.getMessage());
                return new BatchResult(0, batch.size(), 0, 0, 0);
            }
            
        }, batchExecutor);
    }
    
    /**
     * Internal batch processing with work-stealing parallelism
     */
    private BatchResult processBatchInternal(List<TransactionEntry> batch, int shardId) {
        int batchSize = batch.size();
        
        // Determine optimal chunking strategy
        int chunkSize = calculateOptimalChunkSize(batchSize);
        int chunks = (batchSize + chunkSize - 1) / chunkSize;
        
        // Process chunks in parallel using work-stealing
        List<CompletableFuture<ChunkResult>> chunkFutures = new ArrayList<>(chunks);
        
        for (int i = 0; i < chunks; i++) {
            int startIdx = i * chunkSize;
            int endIdx = Math.min(startIdx + chunkSize, batchSize);
            List<TransactionEntry> chunk = batch.subList(startIdx, endIdx);
            
            CompletableFuture<ChunkResult> chunkFuture = CompletableFuture.supplyAsync(
                () -> processChunk(chunk, shardId, i),
                processingPool
            );
            
            chunkFutures.add(chunkFuture);
        }
        
        // Collect results from all chunks
        return collectChunkResults(chunkFutures);
    }
    
    /**
     * Process individual chunk
     */
    private ChunkResult processChunk(List<TransactionEntry> chunk, int shardId, int chunkId) {
        long startTime = System.nanoTime();
        int processed = 0;
        int failed = 0;
        long totalLatency = 0;
        
        for (TransactionEntry entry : chunk) {
            if (entry == null) continue;
            
            try {
                if (entry.tryStartProcessing()) {
                    // Calculate hash and mark processed
                    String hash = entry.calculateHash();
                    long processTime = System.nanoTime();
                    entry.markProcessed(processTime, hash);
                    
                    processed++;
                    totalLatency += entry.getLatencyNanos();
                } else {
                    failed++;
                }
            } catch (Exception e) {
                failed++;
            }
        }
        
        long processingTime = System.nanoTime() - startTime;
        
        return new ChunkResult(processed, failed, processingTime, totalLatency);
    }
    
    /**
     * Collect and aggregate chunk results
     */
    private BatchResult collectChunkResults(List<CompletableFuture<ChunkResult>> chunkFutures) {
        int totalProcessed = 0;
        int totalFailed = 0;
        long totalProcessingTime = 0;
        long totalLatency = 0;
        
        try {
            // Wait for all chunks to complete with timeout
            CompletableFuture<Void> allChunks = CompletableFuture.allOf(
                chunkFutures.toArray(new CompletableFuture[0])
            );
            
            allChunks.get(5, TimeUnit.SECONDS); // 5 second timeout
            
            // Aggregate results
            for (CompletableFuture<ChunkResult> future : chunkFutures) {
                ChunkResult result = future.get();
                totalProcessed += result.processed();
                totalFailed += result.failed();
                totalProcessingTime = Math.max(totalProcessingTime, result.processingTime());
                totalLatency += result.totalLatency();
            }
            
        } catch (TimeoutException e) {
            LOG.warn("Batch processing timeout - some chunks may not have completed");
            totalFailed += chunkFutures.size(); // Count incomplete chunks as failed
        } catch (Exception e) {
            LOG.error("Error collecting chunk results: {}", e.getMessage());
            totalFailed += chunkFutures.size();
        }
        
        long avgLatency = totalProcessed > 0 ? totalLatency / totalProcessed : 0;
        
        return new BatchResult(totalProcessed, totalFailed, totalProcessingTime, totalLatency, avgLatency);
    }
    
    /**
     * Calculate optimal chunk size based on batch size and system resources
     */
    private int calculateOptimalChunkSize(int batchSize) {
        // Base chunk size on number of available workers
        int baseChunkSize = Math.max(batchSize / (PARALLEL_WORKERS * 2), MIN_BATCH_SIZE / 10);
        
        // Ensure chunk size is reasonable
        return Math.min(Math.max(baseChunkSize, 100), 10_000);
    }
    
    /**
     * Update performance metrics and optimize batch size
     */
    private void updateMetrics(int batchSize, long processingTime) {
        batchesProcessed.increment();
        transactionsProcessed.add(batchSize);
        totalProcessingTime.addAndGet(processingTime);
        
        // Calculate throughput
        long throughput = processingTime > 0 ? 
            (batchSize * 1_000_000_000L) / processingTime : 0;
        
        if (throughput > peakBatchThroughput.get()) {
            peakBatchThroughput.set(throughput);
        }
        
        // Periodic batch size optimization
        long currentTime = System.nanoTime();
        if (currentTime - lastOptimization > 10_000_000_000L) { // 10 seconds
            optimizeBatchSize(throughput);
            lastOptimization = currentTime;
        }
    }
    
    /**
     * Optimize batch size based on performance feedback
     */
    private void optimizeBatchSize(long currentThroughput) {
        long peakThroughput = peakBatchThroughput.get();
        
        if (currentThroughput >= peakThroughput * 0.9) {
            // Performance is good - try larger batches
            if (optimalBatchSize < MAX_BATCH_SIZE) {
                optimalBatchSize = Math.min(optimalBatchSize * 11 / 10, MAX_BATCH_SIZE);
                LOG.debug("Increased optimal batch size to {}", optimalBatchSize);
            }
        } else if (currentThroughput < peakThroughput * 0.7) {
            // Performance degraded - try smaller batches
            if (optimalBatchSize > MIN_BATCH_SIZE) {
                optimalBatchSize = Math.max(optimalBatchSize * 9 / 10, MIN_BATCH_SIZE);
                LOG.debug("Decreased optimal batch size to {}", optimalBatchSize);
            }
        }
    }
    
    /**
     * Get current batch processor statistics
     */
    public BatchProcessorStats getStats() {
        long totalBatches = batchesProcessed.sum();
        long totalTransactions = transactionsProcessed.sum();
        long avgProcessingTime = totalBatches > 0 ? 
            totalProcessingTime.get() / totalBatches : 0;
        
        return new BatchProcessorStats(
            totalBatches,
            totalTransactions,
            avgProcessingTime / 1_000_000, // Convert to milliseconds
            peakBatchThroughput.get(),
            optimalBatchSize,
            PARALLEL_WORKERS,
            processingPool.getActiveThreadCount(),
            processingPool.getQueuedTaskCount()
        );
    }
    
    /**
     * Shutdown batch processor
     */
    public void shutdown() {
        LOG.info("Shutting down batch processor");
        
        batchExecutor.shutdown();
        processingPool.shutdown();
        
        try {
            if (!batchExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                batchExecutor.shutdownNow();
            }
            if (!processingPool.awaitTermination(5, TimeUnit.SECONDS)) {
                processingPool.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            batchExecutor.shutdownNow();
            processingPool.shutdownNow();
        }
        
        LOG.info("Batch processor shutdown complete");
    }
    
    // Result records
    private record ChunkResult(
        int processed,
        int failed,
        long processingTime,
        long totalLatency
    ) {}
    
    public record BatchResult(
        int processed,
        int failed,
        long processingTime,
        long totalLatency,
        long avgLatency
    ) {
        
        public double getSuccessRate() {
            int total = processed + failed;
            return total > 0 ? (double) processed / total : 0.0;
        }
        
        public long getThroughput() {
            return processingTime > 0 ? 
                (processed * 1_000_000_000L) / processingTime : 0;
        }
    }
    
    public record BatchProcessorStats(
        long totalBatches,
        long totalTransactions,
        long avgProcessingTimeMs,
        long peakThroughput,
        int optimalBatchSize,
        int parallelWorkers,
        int activeThreads,
        long queuedTasks
    ) {
        
        public double getAvgBatchSize() {
            return totalBatches > 0 ? (double) totalTransactions / totalBatches : 0.0;
        }
        
        public double getThreadUtilization() {
            return parallelWorkers > 0 ? (double) activeThreads / parallelWorkers : 0.0;
        }
        
        @Override
        public String toString() {
            return String.format(
                "BatchProcessor{batches=%d, transactions=%d, avgTime=%dms, peak=%d TPS, batchSize=%d}", 
                totalBatches, totalTransactions, avgProcessingTimeMs, peakThroughput, optimalBatchSize
            );
        }
    }
}