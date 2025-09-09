package io.aurigraph.v11.consensus;

import io.aurigraph.v11.consensus.ConsensusModels.*;
import io.smallrye.mutiny.Uni;
import org.jboss.logging.Logger;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.Instant;
import java.util.*;

/**
 * REST API for HyperRAFT++ Consensus Service
 * 
 * Provides endpoints for:
 * - Consensus status monitoring
 * - Performance metrics
 * - Transaction submission
 * - Leader election management
 */
@Path("/consensus")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConsensusResource {
    
    private static final Logger LOG = Logger.getLogger(ConsensusResource.class);
    
    @Inject
    HyperRAFTConsensusService consensusService;

    /**
     * Get current consensus status
     */
    @GET
    @Path("/status")
    public Response getConsensusStatus() {
        try {
            ConsensusStatus status = consensusService.getStatus();
            return Response.ok(status).build();
        } catch (Exception e) {
            LOG.error("Failed to get consensus status", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get performance metrics
     */
    @GET
    @Path("/metrics")
    public Response getPerformanceMetrics() {
        try {
            PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
            
            Map<String, Object> response = Map.of(
                "performance", metrics,
                "timestamp", Instant.now().toEpochMilli(),
                "target_tps", 2_000_000,
                "performance_grade", calculatePerformanceGrade(metrics)
            );
            
            return Response.ok(response).build();
        } catch (Exception e) {
            LOG.error("Failed to get performance metrics", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Submit transaction batch for processing
     */
    @POST
    @Path("/transactions")
    public Uni<Response> submitTransactionBatch(TransactionBatchRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                // Validate request
                if (request.getTransactions() == null || request.getTransactions().isEmpty()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Transaction list cannot be empty"))
                        .build();
                }

                if (request.getTransactions().size() > 100000) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Batch size too large (max 100,000 transactions)"))
                        .build();
                }

                LOG.info("Processing transaction batch with " + request.getTransactions().size() + " transactions");
                
                return null; // Will be replaced by actual processing
            } catch (Exception e) {
                LOG.error("Failed to submit transaction batch", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        }).chain(validationResult -> {
            if (validationResult != null) {
                return Uni.createFrom().item(validationResult);
            }
            
            // Convert request transactions to consensus transactions
            List<Transaction> transactions = request.getTransactions().stream()
                .map(this::convertToConsensusTransaction)
                .toList();

            // Process through consensus service
            return consensusService.processTransactionBatch(transactions)
                .map(block -> {
                    Map<String, Object> response = Map.of(
                        "block", Map.of(
                            "height", block.getHeight(),
                            "hash", block.getHash(),
                            "transaction_count", block.getTransactions().size(),
                            "timestamp", block.getTimestamp().toEpochMilli(),
                            "validator", block.getValidator()
                        ),
                        "processing_time_ms", System.currentTimeMillis() - request.getTimestamp(),
                        "status", "success"
                    );
                    return Response.ok(response).build();
                })
                .onFailure().recoverWithItem(failure -> {
                    LOG.error("Transaction batch processing failed", failure);
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(Map.of(
                            "error", "Processing failed: " + failure.getMessage(),
                            "status", "failed"
                        ))
                        .build();
                });
        });
    }

    /**
     * Trigger leader election
     */
    @POST
    @Path("/election/trigger")
    public Response triggerElection() {
        try {
            consensusService.triggerElection();
            
            Map<String, Object> response = Map.of(
                "message", "Leader election triggered",
                "timestamp", Instant.now().toEpochMilli()
            );
            
            return Response.accepted(response).build();
        } catch (Exception e) {
            LOG.error("Failed to trigger election", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get comprehensive system health including consensus status
     */
    @GET
    @Path("/health")
    public Response getConsensusHealth() {
        try {
            ConsensusStatus status = consensusService.getStatus();
            PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
            
            boolean isHealthy = metrics.getSuccessRate() >= 95.0 && 
                               metrics.getCurrentTps() >= 0 &&
                               status.getState() != null;
            
            Map<String, Object> health = Map.of(
                "status", isHealthy ? "UP" : "DOWN",
                "consensus_state", status.getState().toString(),
                "current_term", status.getTerm(),
                "current_leader", status.getLeader() != null ? status.getLeader() : "none",
                "success_rate", metrics.getSuccessRate(),
                "current_tps", metrics.getCurrentTps(),
                "peak_tps", metrics.getPeakTps(),
                "total_processed", metrics.getTotalProcessed(),
                "validator_count", status.getValidatorCount(),
                "timestamp", Instant.now().toEpochMilli()
            );
            
            return Response.ok(health).build();
        } catch (Exception e) {
            LOG.error("Failed to get consensus health", e);
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of(
                    "status", "DOWN",
                    "error", e.getMessage(),
                    "timestamp", Instant.now().toEpochMilli()
                ))
                .build();
        }
    }

    /**
     * Get detailed performance statistics
     */
    @GET
    @Path("/statistics")
    public Response getDetailedStatistics() {
        try {
            ConsensusStatus status = consensusService.getStatus();
            PerformanceMetrics metrics = consensusService.getPerformanceMetrics();
            
            // Calculate additional statistics
            double efficiency = metrics.getTotalProcessed() > 0 ? 
                (double) metrics.getTotalSuccessful() / metrics.getTotalProcessed() * 100 : 100.0;
            
            long uptime = System.currentTimeMillis() - getServiceStartTime();
            
            Map<String, Object> statistics = Map.of(
                "consensus", Map.of(
                    "state", status.getState().toString(),
                    "term", status.getTerm(),
                    "leader", status.getLeader() != null ? status.getLeader() : "none",
                    "commit_index", status.getCommitIndex(),
                    "last_applied", status.getLastApplied(),
                    "validator_count", status.getValidatorCount()
                ),
                "performance", Map.of(
                    "current_tps", metrics.getCurrentTps(),
                    "peak_tps", metrics.getPeakTps(),
                    "average_latency_ms", metrics.getAvgLatency(),
                    "success_rate", metrics.getSuccessRate(),
                    "efficiency", efficiency
                ),
                "throughput", Map.of(
                    "total_processed", metrics.getTotalProcessed(),
                    "total_successful", metrics.getTotalSuccessful(),
                    "total_failed", metrics.getTotalProcessed() - metrics.getTotalSuccessful()
                ),
                "system", Map.of(
                    "uptime_ms", uptime,
                    "target_tps", 2_000_000,
                    "performance_grade", calculatePerformanceGrade(metrics),
                    "timestamp", Instant.now().toEpochMilli()
                )
            );
            
            return Response.ok(statistics).build();
        } catch (Exception e) {
            LOG.error("Failed to get detailed statistics", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // Helper methods

    private Transaction convertToConsensusTransaction(TransactionRequest request) {
        return new Transaction(
            request.getId() != null ? request.getId() : UUID.randomUUID().toString(),
            request.getHash() != null ? request.getHash() : generateTransactionHash(request),
            request.getData(),
            System.currentTimeMillis(),
            request.getFrom(),
            request.getTo(),
            request.getAmount(),
            null, // ZK proof will be generated in pipeline
            request.getSignature()
        );
    }

    private String generateTransactionHash(TransactionRequest request) {
        // Simple hash generation (would use proper cryptographic hash in production)
        String data = String.format("%s:%s:%s:%s", 
            request.getFrom(), request.getTo(), request.getAmount(), request.getData());
        return "hash_" + Math.abs(data.hashCode());
    }

    private String calculatePerformanceGrade(PerformanceMetrics metrics) {
        double tps = metrics.getCurrentTps();
        double successRate = metrics.getSuccessRate();
        
        if (tps >= 1_000_000 && successRate >= 99.5) {
            return "A+";
        } else if (tps >= 500_000 && successRate >= 99.0) {
            return "A";
        } else if (tps >= 100_000 && successRate >= 98.0) {
            return "B+";
        } else if (tps >= 50_000 && successRate >= 97.0) {
            return "B";
        } else if (tps >= 10_000 && successRate >= 95.0) {
            return "C";
        } else {
            return "D";
        }
    }

    private long getServiceStartTime() {
        // Would track actual service start time in production
        return System.currentTimeMillis() - (60 * 1000); // Mock: 1 minute ago
    }

    // Request/Response DTOs

    public static class TransactionBatchRequest {
        private List<TransactionRequest> transactions;
        private long timestamp = System.currentTimeMillis();

        // Constructors
        public TransactionBatchRequest() {}
        
        public TransactionBatchRequest(List<TransactionRequest> transactions) {
            this.transactions = transactions;
        }

        // Getters and setters
        public List<TransactionRequest> getTransactions() { return transactions; }
        public void setTransactions(List<TransactionRequest> transactions) { this.transactions = transactions; }
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    }

    public static class TransactionRequest {
        private String id;
        private String hash;
        private Object data;
        private String from;
        private String to;
        private Long amount;
        private String signature;

        // Constructors
        public TransactionRequest() {}

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getHash() { return hash; }
        public void setHash(String hash) { this.hash = hash; }
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public Long getAmount() { return amount; }
        public void setAmount(Long amount) { this.amount = amount; }
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
    }
}