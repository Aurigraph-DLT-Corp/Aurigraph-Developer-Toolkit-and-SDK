package io.aurigraph.v11.bridge.performance;

import io.aurigraph.v11.bridge.models.*;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Parallel Bridge Processing Engine
 * 
 * Features:
 * - Concurrent transaction processing
 * - Intelligent batch optimization
 * - Dynamic thread pool scaling
 * - Performance metrics collection
 * - Load balancing across chains
 * - Transaction prioritization
 */
@ApplicationScoped
public class ParallelBridgeProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(ParallelBridgeProcessor.class);
    
    // Thread pools for different processing stages
    private ExecutorService validationPool;
    private ExecutorService processingPool;
    private ExecutorService completionPool;
    
    // Performance metrics
    private final AtomicLong processedTransactions = new AtomicLong(0);
    private final AtomicLong parallelTransactions = new AtomicLong(0);
    private final AtomicLong averageProcessingTime = new AtomicLong(0);
    
    // Configuration
    private static final int VALIDATION_THREADS = 16;
    private static final int PROCESSING_THREADS = 32;
    private static final int COMPLETION_THREADS = 8;
    private static final int BATCH_SIZE = 100;
    private static final int HIGH_PRIORITY_THRESHOLD = 100000; // $100K
    
    // Processing queues
    private final BlockingQueue<BridgeTransaction> highPriorityQueue = new PriorityBlockingQueue<>();
    private final BlockingQueue<BridgeTransaction> normalPriorityQueue = new LinkedBlockingQueue<>();
    private final BlockingQueue<BatchProcessingRequest> batchQueue = new LinkedBlockingQueue<>();
    
    public void initialize() {
        logger.info("Initializing Parallel Bridge Processor...");
        
        // Initialize thread pools with custom thread factories
        validationPool = Executors.newFixedThreadPool(VALIDATION_THREADS, 
            createThreadFactory("BridgeValidator"));
        processingPool = Executors.newFixedThreadPool(PROCESSING_THREADS, 
            createThreadFactory("BridgeProcessor"));
        completionPool = Executors.newFixedThreadPool(COMPLETION_THREADS, 
            createThreadFactory("BridgeCompletion"));
        
        // Start background processing workers
        startProcessingWorkers();
        
        logger.info("Parallel Bridge Processor initialized with {} validation, {} processing, {} completion threads",
            VALIDATION_THREADS, PROCESSING_THREADS, COMPLETION_THREADS);
    }
    
    /**
     * Process multiple bridge transactions in parallel
     */
    public CompletableFuture<List<BridgeTransactionResult>> processBatchParallel(
            List<BridgeRequest> requests) {
        
        long startTime = System.currentTimeMillis();
        logger.info("Processing batch of {} bridge transactions in parallel", requests.size());
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Prioritize transactions
                List<BridgeRequest> prioritized = prioritizeRequests(requests);
                
                // Process in parallel using streams
                List<CompletableFuture<BridgeTransactionResult>> futures = prioritized.stream()
                    .map(this::processSingleTransactionAsync)
                    .collect(Collectors.toList());
                
                // Wait for all to complete
                CompletableFuture<Void> allOf = CompletableFuture.allOf(
                    futures.toArray(new CompletableFuture[0]));
                
                List<BridgeTransactionResult> results = allOf.thenApply(v ->
                    futures.stream()
                        .map(CompletableFuture::join)
                        .collect(Collectors.toList())
                ).get();
                
                long processingTime = System.currentTimeMillis() - startTime;
                updatePerformanceMetrics(requests.size(), processingTime);
                
                logger.info("Batch processing completed: {} transactions in {}ms (avg: {}ms per tx)", 
                    results.size(), processingTime, processingTime / results.size());
                
                return results;
                
            } catch (Exception e) {
                logger.error("Batch processing failed", e);
                throw new RuntimeException("Parallel batch processing failed", e);
            }
        }, processingPool);
    }
    
    /**
     * Process a single transaction asynchronously with parallel validation
     */
    public CompletableFuture<BridgeTransactionResult> processSingleTransactionAsync(
            BridgeRequest request) {
        
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.currentTimeMillis();
            String transactionId = generateTransactionId();
            
            try {
                logger.debug("Processing transaction {} in parallel pipeline", transactionId);
                
                // Stage 1: Parallel validation
                CompletableFuture<ValidationResult> validationFuture = 
                    CompletableFuture.supplyAsync(() -> validateRequest(request), validationPool);
                
                // Stage 2: Parallel security screening (if needed)
                CompletableFuture<SecurityResult> securityFuture = 
                    CompletableFuture.supplyAsync(() -> performSecurityCheck(request), validationPool);
                
                // Stage 3: Parallel liquidity check
                CompletableFuture<LiquidityResult> liquidityFuture = 
                    CompletableFuture.supplyAsync(() -> checkLiquidity(request), validationPool);
                
                // Wait for all validation stages
                CompletableFuture.allOf(validationFuture, securityFuture, liquidityFuture).get();
                
                ValidationResult validation = validationFuture.get();
                SecurityResult security = securityFuture.get();
                LiquidityResult liquidity = liquidityFuture.get();
                
                // Check all validations passed
                if (!validation.isValid() || !security.isValid() || !liquidity.isValid()) {
                    throw new RuntimeException("Transaction validation failed");
                }
                
                // Stage 4: Process transaction
                BridgeTransactionResult result = processValidatedTransaction(
                    transactionId, request, validation, security, liquidity);
                
                long processingTime = System.currentTimeMillis() - startTime;
                logger.debug("Transaction {} processed in {}ms", transactionId, processingTime);
                
                return result;
                
            } catch (Exception e) {
                logger.error("Transaction {} processing failed", transactionId, e);
                return BridgeTransactionResult.failure(transactionId, e.getMessage());
            }
        }, processingPool);
    }
    
    /**
     * Intelligent batch processing for high throughput
     */
    public CompletableFuture<BatchProcessingResult> processIntelligentBatch(
            List<BridgeRequest> requests) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Group by chain pairs for optimization
                var chainGroups = requests.stream()
                    .collect(Collectors.groupingBy(r -> r.getSourceChain() + "-" + r.getTargetChain()));
                
                logger.info("Processing intelligent batch: {} requests grouped into {} chain pairs", 
                    requests.size(), chainGroups.size());
                
                // Process each chain pair group in parallel
                List<CompletableFuture<List<BridgeTransactionResult>>> groupFutures = 
                    chainGroups.values().stream()
                        .map(group -> processChainGroupParallel(group))
                        .collect(Collectors.toList());
                
                // Collect results
                List<BridgeTransactionResult> allResults = groupFutures.stream()
                    .map(CompletableFuture::join)
                    .flatMap(List::stream)
                    .collect(Collectors.toList());
                
                return new BatchProcessingResult(allResults, 
                    calculateBatchMetrics(allResults));
                
            } catch (Exception e) {
                logger.error("Intelligent batch processing failed", e);
                throw new RuntimeException("Intelligent batch processing failed", e);
            }
        }, processingPool);
    }
    
    /**
     * Get real-time performance metrics
     */
    public ParallelProcessingMetrics getPerformanceMetrics() {
        return ParallelProcessingMetrics.builder()
            .totalProcessed(processedTransactions.get())
            .currentParallelTransactions(parallelTransactions.get())
            .averageProcessingTime(averageProcessingTime.get())
            .validationThreadsActive(getActiveThreadCount(validationPool))
            .processingThreadsActive(getActiveThreadCount(processingPool))
            .completionThreadsActive(getActiveThreadCount(completionPool))
            .highPriorityQueueSize(highPriorityQueue.size())
            .normalPriorityQueueSize(normalPriorityQueue.size())
            .batchQueueSize(batchQueue.size())
            .build();
    }
    
    /**
     * Dynamic scaling of thread pools based on load
     */
    public void scaleThreadPools(int load) {
        logger.info("Scaling thread pools based on load: {}", load);
        
        if (load > 80) { // High load
            // Scale up processing capacity
            expandThreadPool(processingPool, PROCESSING_THREADS * 2);
            logger.info("Scaled up processing threads due to high load");
        } else if (load < 20) { // Low load
            // Scale down to save resources
            contractThreadPool(processingPool, PROCESSING_THREADS);
            logger.info("Scaled down processing threads due to low load");
        }
    }
    
    // Helper methods
    
    private List<BridgeRequest> prioritizeRequests(List<BridgeRequest> requests) {
        return requests.stream()
            .sorted((r1, r2) -> {
                // High-value transactions get priority
                boolean r1HighValue = r1.getAmount().compareTo(new BigDecimal(HIGH_PRIORITY_THRESHOLD)) > 0;
                boolean r2HighValue = r2.getAmount().compareTo(new BigDecimal(HIGH_PRIORITY_THRESHOLD)) > 0;
                
                if (r1HighValue && !r2HighValue) return -1;
                if (!r1HighValue && r2HighValue) return 1;
                
                // Otherwise sort by amount (descending)
                return r2.getAmount().compareTo(r1.getAmount());
            })
            .collect(Collectors.toList());
    }
    
    private CompletableFuture<List<BridgeTransactionResult>> processChainGroupParallel(
            List<BridgeRequest> group) {
        
        return CompletableFuture.supplyAsync(() -> {
            logger.debug("Processing chain group with {} transactions", group.size());
            
            // Process group in smaller batches for optimal performance
            List<CompletableFuture<BridgeTransactionResult>> futures = group.stream()
                .map(this::processSingleTransactionAsync)
                .collect(Collectors.toList());
            
            return futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
        }, processingPool);
    }
    
    private ValidationResult validateRequest(BridgeRequest request) {
        // Parallel validation logic
        try {
            Thread.sleep(5); // Simulate validation time
            return new ValidationResult(true, "Validation passed");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new ValidationResult(false, "Validation interrupted");
        }
    }
    
    private SecurityResult performSecurityCheck(BridgeRequest request) {
        // Parallel security check logic
        try {
            Thread.sleep(10); // Simulate security check time
            return new SecurityResult(true, "Security check passed");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new SecurityResult(false, "Security check interrupted");
        }
    }
    
    private LiquidityResult checkLiquidity(BridgeRequest request) {
        // Parallel liquidity check logic
        try {
            Thread.sleep(3); // Simulate liquidity check time
            return new LiquidityResult(true, "Liquidity available");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new LiquidityResult(false, "Liquidity check interrupted");
        }
    }
    
    private BridgeTransactionResult processValidatedTransaction(
            String transactionId, BridgeRequest request, 
            ValidationResult validation, SecurityResult security, LiquidityResult liquidity) {
        
        // Process the validated transaction
        try {
            Thread.sleep(20); // Simulate processing time
            
            return BridgeTransactionResult.success(
                transactionId,
                BridgeStatus.PROCESSING,
                new BigDecimal("0.1"), // slippage
                25000L, // estimated time
                new BigDecimal("10") // fee
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return BridgeTransactionResult.failure(transactionId, "Processing interrupted");
        }
    }
    
    private BatchMetrics calculateBatchMetrics(List<BridgeTransactionResult> results) {
        long successful = results.stream()
            .filter(r -> r.getStatus() != BridgeStatus.FAILED)
            .count();
        
        return BatchMetrics.builder()
            .totalTransactions(results.size())
            .successfulTransactions((int) successful)
            .failedTransactions(results.size() - (int) successful)
            .successRate((double) successful / results.size() * 100)
            .build();
    }
    
    private void startProcessingWorkers() {
        // Start background workers for queue processing
        logger.info("Starting background processing workers");
    }
    
    private ThreadFactory createThreadFactory(String namePrefix) {
        return new ThreadFactory() {
            private int counter = 0;
            
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, namePrefix + "-" + counter++);
                thread.setDaemon(true);
                return thread;
            }
        };
    }
    
    private String generateTransactionId() {
        return "parallel-tx-" + System.currentTimeMillis() + "-" + 
               Thread.currentThread().getId();
    }
    
    private void updatePerformanceMetrics(int transactionCount, long processingTime) {
        processedTransactions.addAndGet(transactionCount);
        averageProcessingTime.set(processingTime / transactionCount);
    }
    
    private int getActiveThreadCount(ExecutorService executorService) {
        if (executorService instanceof ThreadPoolExecutor) {
            return ((ThreadPoolExecutor) executorService).getActiveCount();
        }
        return 0;
    }
    
    private void expandThreadPool(ExecutorService pool, int newSize) {
        // Thread pool expansion logic (simplified for demo)
        logger.debug("Expanding thread pool to size: {}", newSize);
    }
    
    private void contractThreadPool(ExecutorService pool, int newSize) {
        // Thread pool contraction logic (simplified for demo)
        logger.debug("Contracting thread pool to size: {}", newSize);
    }
    
    // Inner classes for results and metrics
    
    public static class ValidationResult {
        private final boolean valid;
        private final String message;
        
        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
        
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }
    
    public static class SecurityResult {
        private final boolean valid;
        private final String message;
        
        public SecurityResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
        
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }
    
    public static class LiquidityResult {
        private final boolean available;
        private final String message;
        
        public LiquidityResult(boolean available, String message) {
            this.available = available;
            this.message = message;
        }
        
        public boolean isValid() { return available; }
        public String getMessage() { return message; }
    }
    
    public static class BatchProcessingRequest {
        private final List<BridgeRequest> requests;
        private final String batchId;
        
        public BatchProcessingRequest(List<BridgeRequest> requests, String batchId) {
            this.requests = requests;
            this.batchId = batchId;
        }
        
        public List<BridgeRequest> getRequests() { return requests; }
        public String getBatchId() { return batchId; }
    }
    
    public static class BatchProcessingResult {
        private final List<BridgeTransactionResult> results;
        private final BatchMetrics metrics;
        
        public BatchProcessingResult(List<BridgeTransactionResult> results, BatchMetrics metrics) {
            this.results = results;
            this.metrics = metrics;
        }
        
        public List<BridgeTransactionResult> getResults() { return results; }
        public BatchMetrics getMetrics() { return metrics; }
    }
    
    public static class BatchMetrics {
        private final int totalTransactions;
        private final int successfulTransactions;
        private final int failedTransactions;
        private final double successRate;
        
        private BatchMetrics(Builder builder) {
            this.totalTransactions = builder.totalTransactions;
            this.successfulTransactions = builder.successfulTransactions;
            this.failedTransactions = builder.failedTransactions;
            this.successRate = builder.successRate;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        // Getters
        public int getTotalTransactions() { return totalTransactions; }
        public int getSuccessfulTransactions() { return successfulTransactions; }
        public int getFailedTransactions() { return failedTransactions; }
        public double getSuccessRate() { return successRate; }
        
        public static class Builder {
            private int totalTransactions;
            private int successfulTransactions;
            private int failedTransactions;
            private double successRate;
            
            public Builder totalTransactions(int totalTransactions) {
                this.totalTransactions = totalTransactions;
                return this;
            }
            
            public Builder successfulTransactions(int successfulTransactions) {
                this.successfulTransactions = successfulTransactions;
                return this;
            }
            
            public Builder failedTransactions(int failedTransactions) {
                this.failedTransactions = failedTransactions;
                return this;
            }
            
            public Builder successRate(double successRate) {
                this.successRate = successRate;
                return this;
            }
            
            public BatchMetrics build() {
                return new BatchMetrics(this);
            }
        }
    }
    
    public static class ParallelProcessingMetrics {
        private final long totalProcessed;
        private final long currentParallelTransactions;
        private final long averageProcessingTime;
        private final int validationThreadsActive;
        private final int processingThreadsActive;
        private final int completionThreadsActive;
        private final int highPriorityQueueSize;
        private final int normalPriorityQueueSize;
        private final int batchQueueSize;
        
        private ParallelProcessingMetrics(Builder builder) {
            this.totalProcessed = builder.totalProcessed;
            this.currentParallelTransactions = builder.currentParallelTransactions;
            this.averageProcessingTime = builder.averageProcessingTime;
            this.validationThreadsActive = builder.validationThreadsActive;
            this.processingThreadsActive = builder.processingThreadsActive;
            this.completionThreadsActive = builder.completionThreadsActive;
            this.highPriorityQueueSize = builder.highPriorityQueueSize;
            this.normalPriorityQueueSize = builder.normalPriorityQueueSize;
            this.batchQueueSize = builder.batchQueueSize;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        // Getters
        public long getTotalProcessed() { return totalProcessed; }
        public long getCurrentParallelTransactions() { return currentParallelTransactions; }
        public long getAverageProcessingTime() { return averageProcessingTime; }
        public int getValidationThreadsActive() { return validationThreadsActive; }
        public int getProcessingThreadsActive() { return processingThreadsActive; }
        public int getCompletionThreadsActive() { return completionThreadsActive; }
        public int getHighPriorityQueueSize() { return highPriorityQueueSize; }
        public int getNormalPriorityQueueSize() { return normalPriorityQueueSize; }
        public int getBatchQueueSize() { return batchQueueSize; }
        
        public static class Builder {
            private long totalProcessed;
            private long currentParallelTransactions;
            private long averageProcessingTime;
            private int validationThreadsActive;
            private int processingThreadsActive;
            private int completionThreadsActive;
            private int highPriorityQueueSize;
            private int normalPriorityQueueSize;
            private int batchQueueSize;
            
            public Builder totalProcessed(long totalProcessed) {
                this.totalProcessed = totalProcessed;
                return this;
            }
            
            public Builder currentParallelTransactions(long currentParallelTransactions) {
                this.currentParallelTransactions = currentParallelTransactions;
                return this;
            }
            
            public Builder averageProcessingTime(long averageProcessingTime) {
                this.averageProcessingTime = averageProcessingTime;
                return this;
            }
            
            public Builder validationThreadsActive(int validationThreadsActive) {
                this.validationThreadsActive = validationThreadsActive;
                return this;
            }
            
            public Builder processingThreadsActive(int processingThreadsActive) {
                this.processingThreadsActive = processingThreadsActive;
                return this;
            }
            
            public Builder completionThreadsActive(int completionThreadsActive) {
                this.completionThreadsActive = completionThreadsActive;
                return this;
            }
            
            public Builder highPriorityQueueSize(int highPriorityQueueSize) {
                this.highPriorityQueueSize = highPriorityQueueSize;
                return this;
            }
            
            public Builder normalPriorityQueueSize(int normalPriorityQueueSize) {
                this.normalPriorityQueueSize = normalPriorityQueueSize;
                return this;
            }
            
            public Builder batchQueueSize(int batchQueueSize) {
                this.batchQueueSize = batchQueueSize;
                return this;
            }
            
            public ParallelProcessingMetrics build() {
                return new ParallelProcessingMetrics(this);
            }
        }
    }
}