package io.aurigraph.v11;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Liveness;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

/**
 * Aurigraph V11 Primary REST Resource
 * High-performance Java/Quarkus implementation
 */
@Path("/api/v11")
@ApplicationScoped
public class AurigraphResource {

    private static final Logger LOG = Logger.getLogger(AurigraphResource.class);
    
    private final AtomicLong requestCounter = new AtomicLong(0);
    private final Instant startupTime = Instant.now();
    
    @ConfigProperty(name = "aurigraph.performance.target-tps", defaultValue = "2000000")
    long targetTPS;

    @Inject
    TransactionService transactionService;
    
    // Phase 3 Service Integrations
    @Inject
    io.aurigraph.v11.consensus.HyperRAFTConsensusService consensusService;
    
    @Inject
    io.aurigraph.v11.crypto.QuantumCryptoService quantumCryptoService;
    
    @Inject
    io.aurigraph.v11.bridge.CrossChainBridgeService bridgeService;
    
    @Inject
    io.aurigraph.v11.hms.HMSIntegrationService hmsService;
    
    @Inject
    io.aurigraph.v11.ai.AIOptimizationServiceStub aiOptimizationService;

    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    public HealthStatus health() {
        long uptime = Instant.now().getEpochSecond() - startupTime.getEpochSecond();
        long requests = requestCounter.incrementAndGet();
        
        LOG.infof("Health check requested - Uptime: %ds, Requests: %d", uptime, requests);
        
        return new HealthStatus(
            "HEALTHY",
            "11.0.0-standalone",
            uptime,
            requests,
            "Java/Quarkus/GraalVM"
        );
    }

    @GET
    @Path("/info")
    @Produces(MediaType.APPLICATION_JSON)
    public SystemInfo info() {
        return new SystemInfo(
            "Aurigraph V11 Java Nexus",
            "11.0.0",
            "Java " + System.getProperty("java.version"),
            "Quarkus Native Ready",
            System.getProperty("os.name"),
            System.getProperty("os.arch")
        );
    }

    @GET
    @Path("/performance")
    @Produces(MediaType.APPLICATION_JSON)
    public PerformanceStats performanceTest(@DefaultValue("100000") @QueryParam("iterations") int iterations,
                                          @DefaultValue("1") @QueryParam("threads") int threadCount) {
        long startTime = System.nanoTime();
        
        // Enhanced parallel processing with virtual threads
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        int transactionsPerThread = iterations / threadCount;
        
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                for (int i = 0; i < transactionsPerThread; i++) {
                    String txId = "tx_perf_t" + threadId + "_" + i;
                    transactionService.processTransaction(txId, Math.random() * 1000);
                }
            }, r -> Thread.startVirtualThread(r));
            futures.add(future);
        }
        
        // Wait for all threads to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        long endTime = System.nanoTime();
        long durationNs = endTime - startTime;
        double durationMs = durationNs / 1_000_000.0;
        double tps = (iterations * 1000.0) / durationMs;
        boolean targetAchieved = tps >= targetTPS;
        
        LOG.infof("Performance test: %d transactions in %.2fms (%.0f TPS) - Target: %d TPS %s", 
                 iterations, durationMs, tps, targetTPS, targetAchieved ? "ACHIEVED" : "NOT ACHIEVED");
        
        return new PerformanceStats(
            iterations,
            durationMs,
            tps,
            durationNs / iterations, // ns per transaction
            "Java/Quarkus + Virtual Threads",
            threadCount,
            targetTPS,
            targetAchieved
        );
    }
    
    @GET
    @Path("/performance/reactive")
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<PerformanceStats> reactivePerformanceTest(@DefaultValue("100000") @QueryParam("iterations") int iterations) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            
            // Use reactive streams for better performance
            List<TransactionService.TransactionRequest> requests = new ArrayList<>();
            for (int i = 0; i < iterations; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "tx_reactive_" + i, Math.random() * 1000));
            }
            
            // Process reactively
            List<String> results = transactionService.batchProcessTransactions(requests)
                .collect().asList()
                .await().atMost(java.time.Duration.ofSeconds(30));
            
            long endTime = System.nanoTime();
            long durationNs = endTime - startTime;
            double durationMs = durationNs / 1_000_000.0;
            double tps = (iterations * 1000.0) / durationMs;
            boolean targetAchieved = tps >= targetTPS;
            
            LOG.infof("Reactive performance test: %d transactions in %.2fms (%.0f TPS) - Results: %d", 
                     iterations, durationMs, tps, results.size());
            
            return new PerformanceStats(
                iterations,
                durationMs,
                tps,
                durationNs / iterations,
                "Reactive Streams + Virtual Threads",
                1, // reactive single stream
                targetTPS,
                targetAchieved
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    @GET
    @Path("/stats")
    @Produces(MediaType.APPLICATION_JSON)
    public TransactionService.EnhancedProcessingStats getTransactionStats() {
        return transactionService.getStats();
    }
    
    /**
     * Comprehensive system status including all V11 services
     */
    @GET
    @Path("/system/status")
    @Produces(MediaType.APPLICATION_JSON)
    public SystemStatus getSystemStatus() {
        // Collect status from all services
        var txStats = transactionService.getStats();
        var consensusStatus = consensusService.getStats().await().indefinitely();
        var cryptoStatus = quantumCryptoService.getStatus();
        var bridgeStats = bridgeService.getBridgeStats().await().indefinitely();
        var hmsStats = hmsService.getStats().await().indefinitely();
        var aiStats = aiOptimizationService.getOptimizationStats();
        
        return new SystemStatus(
            "Aurigraph V11 Platform",
            "11.0.0",
            System.currentTimeMillis() - startupTime.getEpochSecond() * 1000,
            true, // Overall health
            txStats,
            consensusStatus,
            cryptoStatus,
            bridgeStats,
            hmsStats,
            aiStats,
            System.currentTimeMillis()
        );
    }
    
    /**
     * Ultra-High-Throughput Performance Test - Targeting 3M+ TPS
     * Advanced performance test with optimized batch processing
     */
    @POST
    @Path("/performance/ultra-throughput")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<UltraHighThroughputStats> runUltraHighThroughputTest(UltraHighThroughputRequest request) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            int iterations = Math.max(1000, Math.min(1_000_000, request.iterations()));
            
            LOG.infof("🚀 Starting Ultra-High-Throughput Test: %d transactions (Target: 3M+ TPS)", iterations);
            
            try {
                // Create test transaction requests
                List<TransactionService.TransactionRequest> testRequests = new ArrayList<>(iterations);
                for (int i = 0; i < iterations; i++) {
                    testRequests.add(new TransactionService.TransactionRequest(
                        "ultra-test-" + i, 
                        100.0 + (i * 0.01)
                    ));
                }
                
                // Execute ultra-high-throughput batch processing
                var batchResult = transactionService.processUltraHighThroughputBatch(testRequests).get();
                
                long endTime = System.nanoTime();
                double durationMs = (endTime - startTime) / 1_000_000.0;
                double tps = iterations / (durationMs / 1000.0);
                double nsPerTransaction = (double) (endTime - startTime) / iterations;
                
                // Performance achievement check
                boolean ultraHighTarget = tps >= 3_000_000; // 3M+ TPS
                boolean highTarget = tps >= 2_000_000;      // 2M+ TPS
                boolean baseTarget = tps >= 1_000_000;      // 1M+ TPS
                
                String performanceGrade;
                if (ultraHighTarget) {
                    performanceGrade = "EXCEPTIONAL (3M+ TPS)";
                } else if (highTarget) {
                    performanceGrade = "EXCELLENT (2M+ TPS)";
                } else if (baseTarget) {
                    performanceGrade = "VERY GOOD (1M+ TPS)";
                } else {
                    performanceGrade = "BASELINE (" + Math.round(tps) + " TPS)";
                }
                
                // Get current system stats for context
                var currentStats = transactionService.getStats();
                
                LOG.infof("🏆 Ultra-High-Throughput Test Complete: %.0f TPS - %s", tps, performanceGrade);
                
                return new UltraHighThroughputStats(
                    iterations,
                    durationMs,
                    tps,
                    nsPerTransaction,
                    performanceGrade,
                    ultraHighTarget,
                    highTarget,
                    baseTarget,
                    "Virtual Threads + Lock-Free + Cache-Optimized + Adaptive Batching",
                    batchResult.size(),
                    currentStats.currentThroughputMeasurement(),
                    currentStats.adaptiveBatchSizeMultiplier(),
                    currentStats.getThroughputEfficiency(),
                    System.currentTimeMillis()
                );
                
            } catch (Exception e) {
                LOG.errorf(e, "Ultra-high-throughput test failed");
                return new UltraHighThroughputStats(
                    0, 0.0, 0.0, 0.0,
                    "FAILED: " + e.getMessage(),
                    false, false, false,
                    "Test failed", 0, 0.0, 0.0, 0.0,
                    System.currentTimeMillis()
                );
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Health Check for Quarkus
    @Liveness
    @ApplicationScoped
    static class LivenessCheck implements HealthCheck {
        @Override
        public HealthCheckResponse call() {
            return HealthCheckResponse.up("Aurigraph V11 is running");
        }
    }

    // Data classes for responses
    public record HealthStatus(
        String status,
        String version,
        long uptimeSeconds,
        long totalRequests,
        String platform
    ) {}

    public record SystemInfo(
        String name,
        String version,
        String javaVersion,
        String framework,
        String osName,
        String osArch
    ) {}

    public record PerformanceStats(
        int iterations,
        double durationMs,
        double transactionsPerSecond,
        double nsPerTransaction,
        String optimizations,
        int threadCount,
        long targetTPS,
        boolean targetAchieved
    ) {}
    
    /**
     * SIMD-Optimized Bulk Processing Test for 2M+ TPS
     */
    @POST
    @Path("/performance/simd-batch")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<SIMDBatchStats> runSIMDOptimizedBatchTest(SIMDBatchRequest request) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            int batchSize = Math.max(1000, Math.min(500_000, request.batchSize()));
            
            LOG.infof("⚡ Starting SIMD-Optimized Batch Test: %d transactions", batchSize);
            
            // Create test batch
            List<TransactionService.TransactionRequest> batch = new ArrayList<>(batchSize);
            for (int i = 0; i < batchSize; i++) {
                batch.add(new TransactionService.TransactionRequest(
                    "simd-" + System.nanoTime() + "-" + i,
                    Math.random() * 1000
                ));
            }
            
            try {
                // Execute SIMD-optimized processing
                List<String> results = transactionService.processSIMDOptimizedBatch(batch)
                    .collect().asList()
                    .await().atMost(java.time.Duration.ofMinutes(5));
                
                long endTime = System.nanoTime();
                double durationMs = (endTime - startTime) / 1_000_000.0;
                double tps = batchSize / (durationMs / 1000.0);
                
                String grade = tps >= 2_500_000 ? "EXCELLENT (2.5M+ TPS)" :
                              tps >= 2_000_000 ? "OUTSTANDING (2M+ TPS)" :
                              tps >= 1_000_000 ? "VERY GOOD (1M+ TPS)" :
                              "OPTIMIZING (" + Math.round(tps) + " TPS)";
                
                LOG.infof("⚡ SIMD Batch Complete: %.0f TPS - %s", tps, grade);
                
                return new SIMDBatchStats(
                    batchSize,
                    results.size(),
                    durationMs,
                    tps,
                    grade,
                    tps >= 2_000_000,
                    System.currentTimeMillis()
                );
            } catch (Exception e) {
                LOG.error("SIMD batch test failed: " + e.getMessage());
                return new SIMDBatchStats(0, 0, 0.0, 0.0, "FAILED", false, System.currentTimeMillis());
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    /**
     * Adaptive Batch Processing Test with Performance Feedback
     */
    @POST
    @Path("/performance/adaptive-batch")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<AdaptiveBatchStats> runAdaptiveBatchTest(AdaptiveBatchRequest request) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            int requestCount = Math.max(1000, Math.min(1_000_000, request.requestCount()));
            
            LOG.infof("🎯 Starting Adaptive Batch Test: %d requests", requestCount);
            
            // Create requests
            List<TransactionService.TransactionRequest> requests = new ArrayList<>(requestCount);
            for (int i = 0; i < requestCount; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "adaptive-" + System.nanoTime() + "-" + i,
                    10.0 + (i * 0.001)
                ));
            }
            
            try {
                // Execute adaptive batch processing
                var result = transactionService.processAdaptiveBatch(requests).get();
                
                long endTime = System.nanoTime();
                double totalDuration = (endTime - startTime) / 1_000_000.0;
                
                LOG.infof("🎯 Adaptive Batch Complete: %.0f TPS - %s", 
                         result.achievedTPS(), result.getPerformanceStatus());
                
                return new AdaptiveBatchStats(
                    requestCount,
                    result.results().size(),
                    totalDuration,
                    result.achievedTPS(),
                    result.getPerformanceStatus(),
                    result.chunkSize(),
                    result.batchMultiplier(),
                    result.ultraHighPerformanceAchieved(),
                    System.currentTimeMillis()
                );
            } catch (Exception e) {
                LOG.error("Adaptive batch test failed: " + e.getMessage());
                return new AdaptiveBatchStats(0, 0, 0.0, 0.0, "FAILED", 0, 0.0, false, System.currentTimeMillis());
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Request for ultra-high-throughput performance test
     */
    public record UltraHighThroughputRequest(
        int iterations
    ) {}
    
    /**
     * Ultra-high-throughput performance test results
     */
    public record UltraHighThroughputStats(
        int iterations,
        double durationMs,
        double transactionsPerSecond,
        double nsPerTransaction,
        String performanceGrade,
        boolean ultraHighTarget,      // 3M+ TPS
        boolean highTarget,           // 2M+ TPS 
        boolean baseTarget,           // 1M+ TPS
        String optimizations,
        int processedTransactions,
        double currentSystemThroughput,
        double adaptiveBatchMultiplier,
        double throughputEfficiency,
        long timestamp
    ) {
        
        public String getPerformanceSummary() {
            return String.format("%.0f TPS - %s (Efficiency: %.1f%%)", 
                               transactionsPerSecond, performanceGrade, throughputEfficiency * 100);
        }
        
        public boolean isExceptionalPerformance() {
            return ultraHighTarget;
        }
    }
    
    // SIMD Batch Testing Records
    public record SIMDBatchRequest(int batchSize) {}
    
    public record SIMDBatchStats(
        int requestedBatch,
        int processedCount,
        double durationMs,
        double transactionsPerSecond,
        String performanceGrade,
        boolean achievedTarget,
        long timestamp
    ) {}
    
    // Adaptive Batch Testing Records
    public record AdaptiveBatchRequest(int requestCount) {}
    
    public record AdaptiveBatchStats(
        int requestCount,
        int processedCount,
        double durationMs,
        double transactionsPerSecond,
        String performanceGrade,
        int optimalChunkSize,
        double batchMultiplier,
        boolean ultraHighPerformanceAchieved,
        long timestamp
    ) {}
    
    /**
     * Comprehensive system status for all V11 services
     */
    public record SystemStatus(
        String platformName,
        String version,
        long uptimeMs,
        boolean healthy,
        TransactionService.EnhancedProcessingStats transactionStats,
        io.aurigraph.v11.consensus.HyperRAFTConsensusService.ConsensusStats consensusStatus,
        io.aurigraph.v11.crypto.QuantumCryptoService.CryptoStatus cryptoStatus,
        io.aurigraph.v11.bridge.models.BridgeStats bridgeStats,
        io.aurigraph.v11.hms.HMSIntegrationService.HMSStats hmsStats,
        io.aurigraph.v11.ai.AIOptimizationServiceStub.AIOptimizationStats aiStats,
        long timestamp
    ) {}
}
