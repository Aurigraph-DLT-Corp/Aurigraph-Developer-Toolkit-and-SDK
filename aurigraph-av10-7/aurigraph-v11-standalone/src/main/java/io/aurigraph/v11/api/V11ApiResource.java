package io.aurigraph.v11.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.aurigraph.v11.bridge.CrossChainBridgeService;
import io.aurigraph.v11.hms.HMSIntegrationService;
import io.aurigraph.v11.ai.AIOptimizationServiceStub;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

/**
 * Aurigraph V11 Complete REST API Resource
 * Production-ready APIs with comprehensive OpenAPI documentation
 * Targeting 2M+ TPS with real-time monitoring capabilities
 */
@Path("/api/v11")
@ApplicationScoped
@Tag(name = "Aurigraph V11 Platform API", description = "High-performance blockchain platform APIs for 2M+ TPS")
public class V11ApiResource {

    private static final Logger LOG = Logger.getLogger(V11ApiResource.class);
    
    private final AtomicLong requestCounter = new AtomicLong(0);
    private final Instant startupTime = Instant.now();
    
    @ConfigProperty(name = "aurigraph.performance.target-tps", defaultValue = "2000000")
    long targetTPS;
    
    @ConfigProperty(name = "aurigraph.api.version", defaultValue = "11.0.0")
    String apiVersion;

    @Inject
    TransactionService transactionService;
    
    @Inject
    HyperRAFTConsensusService consensusService;
    
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    @Inject
    CrossChainBridgeService bridgeService;
    
    @Inject
    HMSIntegrationService hmsService;
    
    @Inject
    AIOptimizationServiceStub aiOptimizationService;

    // ==================== PLATFORM STATUS APIs ====================

    @GET
    @Path("/status")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get platform status", description = "Returns comprehensive platform health and status information")
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Platform status retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PlatformStatus.class))),
        @APIResponse(responseCode = "503", description = "Platform is unhealthy")
    })
    public Uni<PlatformStatus> getPlatformStatus() {
        return Uni.createFrom().item(() -> {
            long uptime = Instant.now().getEpochSecond() - startupTime.getEpochSecond();
            long requests = requestCounter.incrementAndGet();
            
            LOG.infof("Platform status check - Uptime: %ds, Requests: %d", uptime, requests);
            
            return new PlatformStatus(
                "HEALTHY",
                apiVersion,
                uptime,
                requests,
                "Java 21 + Quarkus + GraalVM Native",
                targetTPS,
                System.currentTimeMillis()
            );
        });
    }

    @GET
    @Path("/info")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get system information", description = "Returns detailed system and runtime information")
    @APIResponse(responseCode = "200", description = "System information retrieved successfully",
                content = @Content(mediaType = "application/json", schema = @Schema(implementation = SystemInfo.class)))
    public SystemInfo getSystemInfo() {
        return new SystemInfo(
            "Aurigraph V11 High-Performance Platform",
            apiVersion,
            "Java " + System.getProperty("java.version"),
            "Quarkus " + System.getProperty("quarkus.version", "3.26.2"),
            System.getProperty("os.name"),
            System.getProperty("os.arch"),
            Runtime.getRuntime().availableProcessors(),
            Runtime.getRuntime().maxMemory() / (1024 * 1024), // MB
            System.currentTimeMillis()
        );
    }

    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Health check endpoint", description = "Quick health check for load balancers")
    @APIResponse(responseCode = "200", description = "Service is healthy")
    public Response healthCheck() {
        return Response.ok(Map.of(
            "status", "UP",
            "timestamp", System.currentTimeMillis(),
            "version", apiVersion
        )).build();
    }

    // ==================== TRANSACTION APIs ====================

    @POST
    @Path("/transactions")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Process a transaction", description = "Submit a transaction for processing")
    @APIResponses({
        @APIResponse(responseCode = "201", description = "Transaction processed successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TransactionResponse.class))),
        @APIResponse(responseCode = "400", description = "Invalid transaction data"),
        @APIResponse(responseCode = "503", description = "Service temporarily unavailable")
    })
    public Uni<Response> processTransaction(
        @Parameter(description = "Transaction data", required = true)
        TransactionRequest request) {
        
        return Uni.createFrom().item(() -> {
            try {
                String txId = transactionService.processTransaction(request.transactionId(), request.amount());
                
                TransactionResponse response = new TransactionResponse(
                    txId,
                    "PROCESSED",
                    request.amount(),
                    System.currentTimeMillis(),
                    "Transaction processed successfully"
                );
                
                return Response.status(Response.Status.CREATED).entity(response).build();
            } catch (Exception e) {
                LOG.errorf(e, "Transaction processing failed for ID: %s", request.transactionId());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage())).build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    @POST
    @Path("/transactions/batch")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Process batch transactions", description = "Submit multiple transactions for batch processing")
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Batch processed successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = BatchTransactionResponse.class))),
        @APIResponse(responseCode = "400", description = "Invalid batch data")
    })
    public Uni<BatchTransactionResponse> processBatchTransactions(
        @Parameter(description = "Batch transaction requests", required = true)
        BatchTransactionRequest batchRequest) {
        
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            
            List<TransactionService.TransactionRequest> requests = batchRequest.transactions().stream()
                .map(tx -> new TransactionService.TransactionRequest(tx.transactionId(), tx.amount()))
                .toList();
            
            try {
                List<String> results = transactionService.batchProcessTransactions(requests)
                    .collect().asList()
                    .await().atMost(java.time.Duration.ofSeconds(30));
                
                long endTime = System.nanoTime();
                double durationMs = (endTime - startTime) / 1_000_000.0;
                double tps = requests.size() / (durationMs / 1000.0);
                
                return new BatchTransactionResponse(
                    requests.size(),
                    results.size(),
                    durationMs,
                    tps,
                    "COMPLETED",
                    System.currentTimeMillis()
                );
            } catch (Exception e) {
                LOG.errorf(e, "Batch transaction processing failed");
                return new BatchTransactionResponse(
                    requests.size(), 0, 0.0, 0.0, "FAILED: " + e.getMessage(), System.currentTimeMillis()
                );
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    @GET
    @Path("/transactions/stats")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get transaction statistics", description = "Returns current transaction processing statistics")
    @APIResponse(responseCode = "200", description = "Statistics retrieved successfully",
                content = @Content(mediaType = "application/json"))
    public Uni<TransactionService.EnhancedProcessingStats> getTransactionStats() {
        return Uni.createFrom().item(() -> transactionService.getStats());
    }

    // ==================== PERFORMANCE APIs ====================

    @POST
    @Path("/performance/test")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Run performance test", description = "Execute high-throughput performance test")
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Performance test completed",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PerformanceTestResult.class))),
        @APIResponse(responseCode = "400", description = "Invalid test parameters")
    })
    public Uni<PerformanceTestResult> runPerformanceTest(
        @Parameter(description = "Performance test configuration", required = true)
        PerformanceTestRequest testRequest) {
        
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            int iterations = Math.max(1000, Math.min(1_000_000, testRequest.iterations()));
            int threads = Math.max(1, Math.min(256, testRequest.threadCount()));
            
            LOG.infof("Starting performance test: %d iterations, %d threads", iterations, threads);
            
            try {
                List<CompletableFuture<Void>> futures = new java.util.ArrayList<>();
                int transactionsPerThread = iterations / threads;
                
                for (int t = 0; t < threads; t++) {
                    final int threadId = t;
                    CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                        for (int i = 0; i < transactionsPerThread; i++) {
                            String txId = "perf_test_t" + threadId + "_" + i;
                            transactionService.processTransaction(txId, Math.random() * 1000);
                        }
                    }, r -> Thread.startVirtualThread(r));
                    futures.add(future);
                }
                
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                
                long endTime = System.nanoTime();
                double durationMs = (endTime - startTime) / 1_000_000.0;
                double tps = iterations / (durationMs / 1000.0);
                
                String performanceGrade = getPerformanceGrade(tps);
                boolean targetAchieved = tps >= targetTPS;
                
                LOG.infof("Performance test completed: %.0f TPS - %s", tps, performanceGrade);
                
                return new PerformanceTestResult(
                    iterations,
                    threads,
                    durationMs,
                    tps,
                    performanceGrade,
                    targetAchieved,
                    targetTPS,
                    System.currentTimeMillis()
                );
                
            } catch (Exception e) {
                LOG.errorf(e, "Performance test failed");
                return new PerformanceTestResult(
                    0, 0, 0.0, 0.0, "FAILED: " + e.getMessage(), false, targetTPS, System.currentTimeMillis()
                );
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    @GET
    @Path("/performance/metrics")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get performance metrics", description = "Returns real-time performance metrics")
    @APIResponse(responseCode = "200", description = "Metrics retrieved successfully")
    public Uni<PerformanceMetrics> getPerformanceMetrics() {
        return Uni.createFrom().item(() -> {
            var txStats = transactionService.getStats();
            Runtime runtime = Runtime.getRuntime();
            
            return new PerformanceMetrics(
                txStats.currentThroughputMeasurement(),
                txStats.totalProcessed(),
                txStats.getThroughputEfficiency(),
                runtime.totalMemory() - runtime.freeMemory(), // Used memory
                runtime.maxMemory(),
                Thread.activeCount(),
                System.currentTimeMillis() - startupTime.getEpochSecond() * 1000,
                System.currentTimeMillis()
            );
        });
    }

    // ==================== CONSENSUS APIs ====================

    @GET
    @Path("/consensus/status")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get consensus status", description = "Returns HyperRAFT++ consensus algorithm status")
    @APIResponse(responseCode = "200", description = "Consensus status retrieved successfully")
    public Uni<Object> getConsensusStatus() {
        return consensusService.getStats().map(stats -> (Object) stats);
    }

    @POST
    @Path("/consensus/propose")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Propose consensus entry", description = "Submit a proposal to the consensus algorithm")
    @APIResponse(responseCode = "200", description = "Proposal submitted successfully")
    public Uni<Response> proposeConsensusEntry(ConsensusProposal proposal) {
        return Uni.createFrom().item(() -> {
            try {
                // Implementation would depend on consensus service interface
                return Response.ok(Map.of(
                    "status", "PROPOSED",
                    "proposalId", proposal.proposalId(),
                    "timestamp", System.currentTimeMillis()
                )).build();
            } catch (Exception e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage())).build();
            }
        });
    }

    // ==================== SECURITY APIs ====================

    @GET
    @Path("/crypto/status")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get quantum cryptography status", description = "Returns post-quantum cryptography system status")
    @APIResponse(responseCode = "200", description = "Crypto status retrieved successfully")
    public Object getCryptoStatus() {
        return quantumCryptoService.getStatus();
    }

    @POST
    @Path("/crypto/sign")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Sign data with quantum-resistant cryptography", description = "Sign data using post-quantum digital signatures")
    @APIResponse(responseCode = "200", description = "Data signed successfully")
    public Uni<Response> signData(SigningRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                // Implementation would use quantum crypto service
                return Response.ok(Map.of(
                    "signature", "quantum_signature_placeholder",
                    "algorithm", "CRYSTALS-Dilithium",
                    "timestamp", System.currentTimeMillis()
                )).build();
            } catch (Exception e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage())).build();
            }
        });
    }

    // ==================== BRIDGE APIs ====================

    @GET
    @Path("/bridge/stats")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get cross-chain bridge statistics", description = "Returns cross-chain bridge performance statistics")
    @APIResponse(responseCode = "200", description = "Bridge stats retrieved successfully")
    public Uni<Object> getBridgeStats() {
        return bridgeService.getBridgeStats().map(stats -> (Object) stats);
    }

    @POST
    @Path("/bridge/transfer")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Initiate cross-chain transfer", description = "Start a cross-chain asset transfer")
    @APIResponse(responseCode = "200", description = "Transfer initiated successfully")
    public Uni<Response> initiateCrossChainTransfer(CrossChainTransferRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                // Implementation would use bridge service
                return Response.ok(Map.of(
                    "transferId", "bridge_" + System.currentTimeMillis(),
                    "status", "INITIATED",
                    "sourceChain", request.sourceChain(),
                    "targetChain", request.targetChain(),
                    "timestamp", System.currentTimeMillis()
                )).build();
            } catch (Exception e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage())).build();
            }
        });
    }

    // ==================== HMS APIs ====================

    @GET
    @Path("/hms/stats")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get HMS integration statistics", description = "Returns Healthcare Management System integration statistics")
    @APIResponse(responseCode = "200", description = "HMS stats retrieved successfully")
    public Uni<Object> getHMSStats() {
        return hmsService.getStats().map(stats -> (Object) stats);
    }

    // ==================== AI OPTIMIZATION APIs ====================

    @GET
    @Path("/ai/stats")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get AI optimization statistics", description = "Returns AI/ML optimization system statistics")
    @APIResponse(responseCode = "200", description = "AI stats retrieved successfully")
    public Object getAIStats() {
        return aiOptimizationService.getOptimizationStats();
    }

    @POST
    @Path("/ai/optimize")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Trigger AI optimization", description = "Manually trigger AI-based system optimization")
    @APIResponse(responseCode = "200", description = "Optimization triggered successfully")
    public Uni<Response> triggerAIOptimization(AIOptimizationRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                // Implementation would use AI optimization service
                return Response.ok(Map.of(
                    "optimizationId", "ai_opt_" + System.currentTimeMillis(),
                    "status", "TRIGGERED",
                    "type", request.optimizationType(),
                    "timestamp", System.currentTimeMillis()
                )).build();
            } catch (Exception e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage())).build();
            }
        });
    }

    // ==================== UTILITY METHODS ====================

    private String getPerformanceGrade(double tps) {
        if (tps >= 3_000_000) return "EXCEPTIONAL (3M+ TPS)";
        if (tps >= 2_000_000) return "EXCELLENT (2M+ TPS)";
        if (tps >= 1_000_000) return "VERY GOOD (1M+ TPS)";
        if (tps >= 500_000) return "GOOD (500K+ TPS)";
        return "BASELINE (" + Math.round(tps) + " TPS)";
    }

    // ==================== DATA MODELS ====================

    public record PlatformStatus(
        String status,
        String version,
        long uptimeSeconds,
        long totalRequests,
        String platform,
        long targetTPS,
        long timestamp
    ) {}

    public record SystemInfo(
        String name,
        String version,
        String javaVersion,
        String framework,
        String osName,
        String osArch,
        int availableProcessors,
        long maxMemoryMB,
        long timestamp
    ) {}

    public record TransactionRequest(String transactionId, double amount) {}

    public record TransactionResponse(
        String transactionId,
        String status,
        double amount,
        long timestamp,
        String message
    ) {}

    public record BatchTransactionRequest(List<TransactionRequest> transactions) {}

    public record BatchTransactionResponse(
        int requestedCount,
        int processedCount,
        double durationMs,
        double transactionsPerSecond,
        String status,
        long timestamp
    ) {}

    public record PerformanceTestRequest(int iterations, int threadCount) {}

    public record PerformanceTestResult(
        int iterations,
        int threadCount,
        double durationMs,
        double transactionsPerSecond,
        String performanceGrade,
        boolean targetAchieved,
        long targetTPS,
        long timestamp
    ) {}

    public record PerformanceMetrics(
        double currentTPS,
        long totalTransactions,
        double throughputEfficiency,
        long usedMemoryBytes,
        long maxMemoryBytes,
        int activeThreads,
        long uptimeMs,
        long timestamp
    ) {}

    public record ConsensusProposal(String proposalId, String data) {}

    public record SigningRequest(String data, String algorithm) {}

    public record CrossChainTransferRequest(
        String sourceChain,
        String targetChain,
        String asset,
        double amount,
        String recipient
    ) {}

    public record AIOptimizationRequest(String optimizationType, Map<String, Object> parameters) {}
}