package io.aurigraph.v11.bridge;

import io.aurigraph.v11.bridge.models.*;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * REST API Endpoints for Aurigraph V11 Cross-Chain Bridge
 * 
 * Provides comprehensive APIs for:
 * - Asset bridging between chains
 * - Atomic swaps
 * - Transaction status tracking
 * - Bridge metrics and health monitoring
 * - Liquidity pool information
 */
@Path("/api/v11/bridge")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BridgeResource {

    private static final Logger logger = LoggerFactory.getLogger(BridgeResource.class);

    @Inject
    CrossChainBridgeService bridgeService;

    /**
     * Bridge assets between chains
     * POST /api/v11/bridge/transfer
     */
    @POST
    @Path("/transfer")
    public CompletableFuture<Response> bridgeAsset(BridgeRequest request) {
        return bridgeService.bridgeAsset(request)
            .thenApply(result -> {
                if (result.isSuccess()) {
                    return Response.ok(result).build();
                } else {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(result)
                        .build();
                }
            })
            .exceptionally(throwable -> {
                logger.error("Bridge transfer failed", throwable);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Bridge transfer failed: " + throwable.getMessage())
                    .build();
            });
    }

    /**
     * Perform atomic swap
     * POST /api/v11/bridge/swap
     */
    @POST
    @Path("/swap")
    public CompletableFuture<Response> performAtomicSwap(AtomicSwapRequest request) {
        return bridgeService.performAtomicSwap(request)
            .thenApply(result -> Response.ok(result).build())
            .exceptionally(throwable -> {
                logger.error("Atomic swap failed", throwable);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Atomic swap failed: " + throwable.getMessage())
                    .build();
            });
    }

    /**
     * Get transaction status
     * GET /api/v11/bridge/transaction/{transactionId}
     */
    @GET
    @Path("/transaction/{transactionId}")
    public Response getTransactionStatus(@PathParam("transactionId") String transactionId) {
        Optional<BridgeTransactionStatus> status = bridgeService.getTransactionStatus(transactionId);
        
        if (status.isPresent()) {
            return Response.ok(status.get()).build();
        } else {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Transaction not found: " + transactionId)
                .build();
        }
    }

    /**
     * Get supported chains
     * GET /api/v11/bridge/chains
     */
    @GET
    @Path("/chains")
    public Response getSupportedChains() {
        List<ChainInfo> chains = bridgeService.getSupportedChains();
        return Response.ok(chains).build();
    }

    /**
     * Get bridge metrics
     * GET /api/v11/bridge/metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics() {
        BridgeMetrics metrics = bridgeService.getMetrics();
        return Response.ok(metrics).build();
    }

    /**
     * Estimate bridge cost and time
     * GET /api/v11/bridge/estimate
     */
    @GET
    @Path("/estimate")
    public Response estimateBridge(@QueryParam("sourceChain") String sourceChain,
                                  @QueryParam("targetChain") String targetChain,
                                  @QueryParam("asset") String asset,
                                  @QueryParam("amount") String amount) {
        
        try {
            if (sourceChain == null || targetChain == null || asset == null || amount == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Missing required parameters: sourceChain, targetChain, asset, amount")
                    .build();
            }
            
            BigDecimal bridgeAmount = new BigDecimal(amount);
            BridgeEstimate estimate = bridgeService.estimateBridge(sourceChain, targetChain, asset, bridgeAmount);
            
            return Response.ok(estimate).build();
            
        } catch (NumberFormatException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Invalid amount format: " + amount)
                .build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(e.getMessage())
                .build();
        } catch (Exception e) {
            logger.error("Bridge estimation failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Estimation failed: " + e.getMessage())
                .build();
        }
    }

    /**
     * Get liquidity pool status (simplified for demo)
     * GET /api/v11/bridge/liquidity/{sourceChain}/{targetChain}
     */
    @GET
    @Path("/liquidity/{sourceChain}/{targetChain}")
    public Response getLiquidityPool(@PathParam("sourceChain") String sourceChain,
                                   @PathParam("targetChain") String targetChain) {
        try {
            // Simplified liquidity status for demo
            return Response.ok(
                "Liquidity pool status for " + sourceChain + " -> " + targetChain + ": Available"
            ).build();
        } catch (Exception e) {
            logger.error("Failed to get liquidity pool status", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Failed to get liquidity pool status: " + e.getMessage())
                .build();
        }
    }

    /**
     * Health check endpoint
     * GET /api/v11/bridge/health
     */
    @GET
    @Path("/health")
    public Response healthCheck() {
        try {
            BridgeMetrics metrics = bridgeService.getMetrics();
            
            HealthCheckResponse health = HealthCheckResponse.builder()
                .status("healthy")
                .supportedChains(metrics.getSupportedChains())
                .activeTransactions(metrics.getActiveTransactions())
                .successRate(metrics.getCurrentSuccessRate())
                .isPaused(metrics.isPaused())
                .timestamp(System.currentTimeMillis())
                .build();
            
            return Response.ok(health).build();
            
        } catch (Exception e) {
            logger.error("Health check failed", e);
            
            HealthCheckResponse health = HealthCheckResponse.builder()
                .status("unhealthy")
                .errorMessage(e.getMessage())
                .timestamp(System.currentTimeMillis())
                .build();
            
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(health)
                .build();
        }
    }

    /**
     * Emergency pause (admin only)
     * POST /api/v11/bridge/admin/pause
     */
    @POST
    @Path("/admin/pause")
    public Response emergencyPause(@QueryParam("reason") String reason) {
        try {
            if (reason == null || reason.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Reason is required for emergency pause")
                    .build();
            }
            
            bridgeService.emergencyPause(reason);
            
            return Response.ok()
                .entity("Bridge operations paused: " + reason)
                .build();
                
        } catch (Exception e) {
            logger.error("Emergency pause failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Emergency pause failed: " + e.getMessage())
                .build();
        }
    }

    /**
     * Resume operations (admin only)
     * POST /api/v11/bridge/admin/resume
     */
    @POST
    @Path("/admin/resume")
    public Response resumeOperations() {
        try {
            bridgeService.resumeOperations();
            
            return Response.ok()
                .entity("Bridge operations resumed")
                .build();
                
        } catch (Exception e) {
            logger.error("Resume operations failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Resume operations failed: " + e.getMessage())
                .build();
        }
    }

    // Inner class for health check response
    public static class HealthCheckResponse {
        private String status;
        private int supportedChains;
        private int activeTransactions;
        private double successRate;
        private boolean isPaused;
        private String errorMessage;
        private long timestamp;
        
        public static Builder builder() {
            return new Builder();
        }
        
        public static class Builder {
            private HealthCheckResponse response = new HealthCheckResponse();
            
            public Builder status(String status) { response.status = status; return this; }
            public Builder supportedChains(int chains) { response.supportedChains = chains; return this; }
            public Builder activeTransactions(int transactions) { response.activeTransactions = transactions; return this; }
            public Builder successRate(double rate) { response.successRate = rate; return this; }
            public Builder isPaused(boolean paused) { response.isPaused = paused; return this; }
            public Builder errorMessage(String message) { response.errorMessage = message; return this; }
            public Builder timestamp(long timestamp) { response.timestamp = timestamp; return this; }
            
            public HealthCheckResponse build() { return response; }
        }
        
        // Getters
        public String getStatus() { return status; }
        public int getSupportedChains() { return supportedChains; }
        public int getActiveTransactions() { return activeTransactions; }
        public double getSuccessRate() { return successRate; }
        public boolean isPaused() { return isPaused; }
        public String getErrorMessage() { return errorMessage; }
        public long getTimestamp() { return timestamp; }
    }
}