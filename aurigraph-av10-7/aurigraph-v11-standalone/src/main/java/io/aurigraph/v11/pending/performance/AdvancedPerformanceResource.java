package io.aurigraph.v11.pending.performance;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.Multi;
import org.jboss.logging.Logger;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;

/**
 * REST endpoints for advanced performance service
 * Provides benchmarking, monitoring, and control endpoints
 */
@Path("/api/v11/performance/advanced")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdvancedPerformanceResource {
    
    private static final Logger LOG = Logger.getLogger(AdvancedPerformanceResource.class);
    
    @Inject
    AdvancedPerformanceService performanceService;
    
    /**
     * Start the advanced performance service
     */
    @POST
    @Path("/start")
    public Uni<Response> start() {
        return Uni.createFrom().item(() -> {
            try {
                performanceService.start();
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "started");
                response.put("message", "Advanced performance service started successfully");
                response.put("timestamp", System.currentTimeMillis());
                
                LOG.info("Advanced performance service started via REST API");
                
                return Response.ok(response).build();
                
            } catch (Exception e) {
                LOG.error("Failed to start advanced performance service: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Failed to start service: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(500).entity(error).build();
            }
        });
    }
    
    /**
     * Stop the advanced performance service
     */
    @POST
    @Path("/stop")
    public Uni<Response> stop() {
        return Uni.createFrom().item(() -> {
            try {
                performanceService.stop();
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "stopped");
                response.put("message", "Advanced performance service stopped successfully");
                response.put("timestamp", System.currentTimeMillis());
                
                LOG.info("Advanced performance service stopped via REST API");
                
                return Response.ok(response).build();
                
            } catch (Exception e) {
                LOG.error("Failed to stop advanced performance service: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Failed to stop service: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(500).entity(error).build();
            }
        });
    }
    
    /**
     * Get current performance metrics
     */
    @GET
    @Path("/metrics")
    public Uni<Response> getMetrics() {
        return Uni.createFrom().item(() -> {
            try {
                AdvancedPerformanceService.PerformanceSnapshot metrics = 
                    performanceService.getCurrentMetrics();
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("metrics", metrics);
                response.put("timestamp", System.currentTimeMillis());
                
                return Response.ok(response).build();
                
            } catch (Exception e) {
                LOG.error("Failed to get performance metrics: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Failed to get metrics: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(500).entity(error).build();
            }
        });
    }
    
    /**
     * Submit single transaction for processing
     */
    @POST
    @Path("/transaction")
    public Uni<Response> submitTransaction(Map<String, Object> request) {
        return Uni.createFrom().item(() -> {
            try {
                // Extract transaction data
                String data = (String) request.get("data");
                if (data == null) {
                    data = "sample_transaction_" + System.currentTimeMillis();
                }
                
                byte[] transactionData = data.getBytes();
                
                return performanceService.submitTransaction(transactionData)
                    .onItem().transform(result -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "success");
                        response.put("result", result);
                        response.put("timestamp", System.currentTimeMillis());
                        
                        return Response.ok(response).build();
                    })
                    .onFailure().recoverWithItem(throwable -> {
                        LOG.error("Failed to submit transaction: " + throwable.getMessage());
                        
                        Map<String, Object> error = new HashMap<>();
                        error.put("status", "error");
                        error.put("message", "Failed to submit transaction: " + throwable.getMessage());
                        error.put("timestamp", System.currentTimeMillis());
                        
                        return Response.status(500).entity(error).build();
                    })
                    .await().indefinitely();
                
            } catch (Exception e) {
                LOG.error("Request processing failed: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Request processing failed: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(400).entity(error).build();
            }
        });
    }
    
    /**
     * Submit batch of transactions
     */
    @POST
    @Path("/batch")
    public Uni<Response> submitBatch(Map<String, Object> request) {
        return Uni.createFrom().item(() -> {
            try {
                // Extract batch parameters
                Integer batchSize = (Integer) request.getOrDefault("size", 1000);
                String dataPrefix = (String) request.getOrDefault("dataPrefix", "batch_tx");
                
                // Generate batch data
                List<byte[]> transactions = new ArrayList<>();
                for (int i = 0; i < batchSize; i++) {
                    String txData = dataPrefix + "_" + i + "_" + System.currentTimeMillis();
                    transactions.add(txData.getBytes());
                }
                
                // Submit batch and collect results
                return performanceService.submitBatch(transactions)
                    .collect().asList()
                    .onItem().transform(results -> {
                        long successful = results.stream().mapToLong(r -> r.success() ? 1 : 0).sum();
                        
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "success");
                        response.put("batchSize", batchSize);
                        response.put("successful", successful);
                        response.put("failed", batchSize - successful);
                        response.put("successRate", (double) successful / batchSize);
                        response.put("results", results);
                        response.put("timestamp", System.currentTimeMillis());
                        
                        return Response.ok(response).build();
                    })
                    .onFailure().recoverWithItem(throwable -> {
                        LOG.error("Failed to submit batch: " + throwable.getMessage());
                        
                        Map<String, Object> error = new HashMap<>();
                        error.put("status", "error");
                        error.put("message", "Failed to submit batch: " + throwable.getMessage());
                        error.put("timestamp", System.currentTimeMillis());
                        
                        return Response.status(500).entity(error).build();
                    })
                    .await().indefinitely();
                
            } catch (Exception e) {
                LOG.error("Batch request processing failed: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Batch request processing failed: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(400).entity(error).build();
            }
        });
    }
    
    /**
     * Run performance benchmark
     */
    @POST
    @Path("/benchmark")
    public Uni<Response> runBenchmark(Map<String, Object> request) {
        return Uni.createFrom().item(() -> {
            try {
                // Extract benchmark parameters
                Integer duration = (Integer) request.getOrDefault("duration", 60); // seconds
                Long targetTPS = ((Number) request.getOrDefault("targetTPS", 2_000_000L)).longValue();
                
                LOG.info("Starting benchmark: " + targetTPS + " TPS for " + duration + " seconds");
                
                return performanceService.runBenchmark(duration, targetTPS)
                    .onItem().transform(result -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "completed");
                        response.put("benchmark", result);
                        response.put("timestamp", System.currentTimeMillis());
                        
                        // Add achievement status
                        boolean targetAchieved = result.achievedTPS() >= targetTPS * 0.95; // 95% of target
                        response.put("targetAchieved", targetAchieved);
                        response.put("achievementRate", (double) result.achievedTPS() / targetTPS);
                        
                        LOG.info("Benchmark completed: " + result.achievedTPS() + " TPS achieved (target: " + targetTPS + ")");
                        
                        return Response.ok(response).build();
                    })
                    .onFailure().recoverWithItem(throwable -> {
                        LOG.error("Benchmark failed: " + throwable.getMessage());
                        
                        Map<String, Object> error = new HashMap<>();
                        error.put("status", "error");
                        error.put("message", "Benchmark failed: " + throwable.getMessage());
                        error.put("timestamp", System.currentTimeMillis());
                        
                        return Response.status(500).entity(error).build();
                    })
                    .await().indefinitely();
                
            } catch (Exception e) {
                LOG.error("Benchmark request processing failed: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Benchmark request processing failed: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(400).entity(error).build();
            }
        });
    }
    
    /**
     * Get system status and health
     */
    @GET
    @Path("/status")
    public Uni<Response> getStatus() {
        return Uni.createFrom().item(() -> {
            try {
                AdvancedPerformanceService.PerformanceSnapshot metrics = 
                    performanceService.getCurrentMetrics();
                
                // Determine health status
                boolean healthy = metrics.currentTPS() > 0 && 
                                 metrics.totalTransactions() > 0;
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", healthy ? "healthy" : "degraded");
                response.put("currentTPS", metrics.currentTPS());
                response.put("peakTPS", metrics.peakTPS());
                response.put("totalTransactions", metrics.totalTransactions());
                response.put("processedTransactions", metrics.processedTransactions());
                response.put("memoryUsage", metrics.memoryUsage());
                response.put("timestamp", System.currentTimeMillis());
                
                // System information
                Runtime runtime = Runtime.getRuntime();
                Map<String, Object> system = new HashMap<>();
                system.put("availableProcessors", runtime.availableProcessors());
                system.put("maxMemory", runtime.maxMemory());
                system.put("totalMemory", runtime.totalMemory());
                system.put("freeMemory", runtime.freeMemory());
                system.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());
                
                response.put("system", system);
                
                return Response.ok(response).build();
                
            } catch (Exception e) {
                LOG.error("Failed to get system status: " + e.getMessage());
                
                Map<String, Object> error = new HashMap<>();
                error.put("status", "error");
                error.put("message", "Failed to get system status: " + e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(500).entity(error).build();
            }
        });
    }
    
    /**
     * Health check endpoint
     */
    @GET
    @Path("/health")
    public Uni<Response> healthCheck() {
        return Uni.createFrom().item(() -> {
            try {
                AdvancedPerformanceService.PerformanceSnapshot metrics = 
                    performanceService.getCurrentMetrics();
                
                boolean healthy = metrics != null && metrics.currentTPS() >= 0;
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", healthy ? "UP" : "DOWN");
                response.put("timestamp", System.currentTimeMillis());
                
                if (healthy) {
                    response.put("currentTPS", metrics.currentTPS());
                    response.put("peakTPS", metrics.peakTPS());
                }
                
                return Response.ok(response).build();
                
            } catch (Exception e) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", "DOWN");
                error.put("error", e.getMessage());
                error.put("timestamp", System.currentTimeMillis());
                
                return Response.status(503).entity(error).build();
            }
        });
    }
}