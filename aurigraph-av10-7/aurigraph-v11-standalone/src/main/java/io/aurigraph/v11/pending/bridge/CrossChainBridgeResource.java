package io.aurigraph.v11.pending.bridge;

import io.aurigraph.v11.pending.bridge.models.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Cross-Chain Bridge REST API Resource
 * 
 * Comprehensive REST API endpoints for the Aurigraph V11 cross-chain bridge system.
 * Provides high-performance endpoints for bridge operations, atomic swaps, and monitoring.
 * 
 * Features:
 * - Bridge transaction lifecycle management
 * - Atomic swap operations
 * - Token registry and pair management
 * - Validator consensus monitoring
 * - Performance metrics and health checks
 * - Emergency controls
 * - Real-time status tracking
 * 
 * Performance Target: 100K+ bridge operations per second
 * Designed for reactive programming with Mutiny
 */
@Path("/api/v11/bridge")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CrossChainBridgeResource {

    private static final Logger LOG = Logger.getLogger(CrossChainBridgeResource.class);

    @Inject
    BridgeValidator bridgeValidator;

    @Inject
    BridgeTokenRegistry tokenRegistry;

    @Inject
    AtomicSwapManager atomicSwapManager;

    // ========== Bridge Transaction Endpoints ==========

    /**
     * Initiate a cross-chain bridge transaction
     */
    @POST
    @Path("/transfer")
    public Uni<Response> initiateBridgeTransfer(BridgeTransferRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Initiating bridge transfer: %s %s from %s to %s", 
                     request.amount(), request.tokenSymbol(), request.sourceChain(), request.targetChain());

            // Create bridge transaction
            BridgeTransaction transaction = BridgeTransaction.builder()
                .transactionId("bridge-" + java.util.UUID.randomUUID().toString().substring(0, 12))
                .sourceChain(request.sourceChain())
                .targetChain(request.targetChain())
                .sourceAddress(request.sourceAddress())
                .targetAddress(request.targetAddress())
                .tokenSymbol(request.tokenSymbol())
                .amount(request.amount())
                .type(request.transferType() != null ? request.transferType() : BridgeTransactionType.LOCK_AND_MINT)
                .status(BridgeTransactionStatus.INITIATED)
                .build();

            return transaction;
        }).chain(transaction -> 
            // Validate transfer
            tokenRegistry.validateTransfer(
                transaction.getSourceChain(), 
                transaction.getTargetChain(),
                transaction.getSourceChain() + ":" + transaction.getTokenSymbol(),
                transaction.getTargetChain() + ":" + transaction.getTokenSymbol(),
                transaction.getAmount()
            ).chain(validation -> {
                if (!validation.isValid()) {
                    BridgeTransferResponse errorResponse = new BridgeTransferResponse(
                        null, false, validation.message(), null, null, null, null, null
                    );
                    return Uni.createFrom().item(Response.status(400).entity(errorResponse).build());
                }

                // Submit for validator consensus
                return bridgeValidator.submitForConsensus(transaction)
                    .map(consensus -> {
                        if (consensus.success()) {
                            BridgeTransferResponse response = new BridgeTransferResponse(
                                transaction.getTransactionId(),
                                true,
                                "Bridge transfer initiated successfully",
                                transaction.getStatus(),
                                consensus.approvals(),
                                consensus.totalValidators(),
                                null, // Will be calculated separately
                                consensus.consensusTimeMs()
                            );
                            return Response.ok(response).build();
                        } else {
                            BridgeTransferResponse errorResponse = new BridgeTransferResponse(
                                transaction.getTransactionId(), false, consensus.message(), 
                                BridgeTransactionStatus.REJECTED, consensus.approvals(), 
                                consensus.totalValidators(), null, consensus.consensusTimeMs()
                            );
                            return Response.status(400).entity(errorResponse).build();
                        }
                    });
            })
        ).onFailure().recoverWithItem(error -> {
            LOG.errorf("Error initiating bridge transfer: %s", error.getMessage());
            BridgeTransferResponse errorResponse = new BridgeTransferResponse(
                null, false, "Internal error: " + error.getMessage(), 
                null, null, null, null, null
            );
            return Response.status(500).entity(errorResponse).build();
        });
    }

    /**
     * Get bridge transaction status
     */
    @GET
    @Path("/transfer/{transactionId}/status")
    public Uni<Response> getBridgeTransactionStatus(@PathParam("transactionId") String transactionId) {
        return bridgeValidator.getConsensusStatus(transactionId)
            .map(consensusOpt -> {
                if (consensusOpt.isEmpty()) {
                    return Response.status(404)
                        .entity(new BridgeStatusResponse(transactionId, false, "Transaction not found"))
                        .build();
                }

                BridgeValidator.ConsensusStatus consensus = consensusOpt.get();
                BridgeStatusResponse response = new BridgeStatusResponse(
                    transactionId,
                    true,
                    "Transaction found",
                    consensus.hasConsensus() ? BridgeTransactionStatus.CONSENSUS : BridgeTransactionStatus.VALIDATING,
                    consensus.currentApprovals(),
                    consensus.requiredApprovals(),
                    consensus.isCompleted(),
                    System.currentTimeMillis() - consensus.startTime()
                );

                return Response.ok(response).build();
            });
    }

    /**
     * Estimate bridge transfer fees
     */
    @POST
    @Path("/estimate-fee")
    public Uni<Response> estimateBridgeFee(FeeEstimateRequest request) {
        return tokenRegistry.calculateFees(
            request.sourceChain(),
            request.targetChain(),
            request.sourceChain() + ":" + request.tokenSymbol(),
            request.targetChain() + ":" + request.tokenSymbol(),
            request.amount()
        ).map(feeCalc -> {
            if (feeCalc.totalFee().equals(BigDecimal.ZERO) && feeCalc.message().contains("not supported")) {
                return Response.status(400)
                    .entity(new FeeEstimateResponse(false, null, null, null, feeCalc.message()))
                    .build();
            }

            FeeEstimateResponse response = new FeeEstimateResponse(
                true,
                feeCalc.bridgeFee(),
                feeCalc.gasFee(),
                feeCalc.totalFee(),
                "Fee calculation successful"
            );

            return Response.ok(response).build();
        });
    }

    // ========== Atomic Swap Endpoints ==========

    /**
     * Initiate an atomic swap
     */
    @POST
    @Path("/atomic-swap")
    public Uni<Response> initiateAtomicSwap(AtomicSwapRequest request) {
        return atomicSwapManager.initiateSwap(
            request.sourceChain(),
            request.targetChain(),
            request.sourceAddress(),
            request.targetAddress(),
            request.tokenSymbol(),
            request.amount()
        ).map(swapResult -> {
            if (swapResult.isSuccess()) {
                AtomicSwapResponse response = new AtomicSwapResponse(
                    swapResult.swapId(),
                    true,
                    "Atomic swap initiated successfully",
                    swapResult.status(),
                    swapResult.estimatedTime(),
                    java.util.Base64.getEncoder().encodeToString(swapResult.hashLock()),
                    swapResult.sourceTransactionHash(),
                    swapResult.targetTransactionHash()
                );
                return Response.ok(response).build();
            } else {
                AtomicSwapResponse errorResponse = new AtomicSwapResponse(
                    swapResult.swapId(), false, swapResult.errorMessage(), 
                    swapResult.status(), 0, null, null, null
                );
                return Response.status(400).entity(errorResponse).build();
            }
        }).onFailure().recoverWithItem(error -> {
            LOG.errorf("Error initiating atomic swap: %s", error.getMessage());
            AtomicSwapResponse errorResponse = new AtomicSwapResponse(
                null, false, "Internal error: " + error.getMessage(), 
                null, 0, null, null, null
            );
            return Response.status(500).entity(errorResponse).build();
        });
    }

    /**
     * Get atomic swap status
     */
    @GET
    @Path("/atomic-swap/{swapId}/status")
    public Uni<Response> getAtomicSwapStatus(@PathParam("swapId") String swapId) {
        return atomicSwapManager.getSwapStatus(swapId)
            .map(statusOpt -> {
                if (statusOpt.isEmpty()) {
                    return Response.status(404)
                        .entity(new AtomicSwapStatusResponse(swapId, false, "Atomic swap not found"))
                        .build();
                }

                AtomicSwapManager.AtomicSwapStatus status = statusOpt.get();
                AtomicSwapStatusResponse response = new AtomicSwapStatusResponse(
                    swapId,
                    true,
                    "Atomic swap found",
                    status.status(),
                    status.sourceChain(),
                    status.targetChain(),
                    status.amount(),
                    status.tokenSymbol(),
                    status.timeRemainingSeconds(),
                    status.createdAt().toString()
                );

                return Response.ok(response).build();
            });
    }

    /**
     * Reveal secret to complete atomic swap
     */
    @POST
    @Path("/atomic-swap/{swapId}/reveal")
    public Uni<Response> revealSwapSecret(@PathParam("swapId") String swapId, SecretRevealRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                byte[] secret = java.util.Base64.getDecoder().decode(request.secret());
                return secret;
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid secret format");
            }
        }).chain(secret ->
            atomicSwapManager.revealSecret(swapId, secret)
                .map(revealed -> {
                    if (revealed) {
                        return Response.ok(new SecretRevealResponse(true, "Secret revealed successfully")).build();
                    } else {
                        return Response.status(400)
                            .entity(new SecretRevealResponse(false, "Invalid secret or swap not found"))
                            .build();
                    }
                })
        ).onFailure().recoverWithItem(error -> {
            return Response.status(400)
                .entity(new SecretRevealResponse(false, "Error: " + error.getMessage()))
                .build();
        });
    }

    /**
     * Get all active atomic swaps
     */
    @GET
    @Path("/atomic-swap/active")
    public Uni<Response> getActiveAtomicSwaps() {
        return atomicSwapManager.getActiveSwaps()
            .map(swaps -> {
                ActiveSwapsResponse response = new ActiveSwapsResponse(
                    swaps.size(),
                    swaps
                );
                return Response.ok(response).build();
            });
    }

    // ========== Token Registry Endpoints ==========

    /**
     * Get all supported chains
     */
    @GET
    @Path("/chains")
    public Uni<Response> getSupportedChains() {
        return Uni.createFrom().item(() -> {
            // In a real implementation, would get from chain adapter registry
            List<ChainInfo> chains = List.of(
                ChainInfo.builder().chainId("ethereum").name("Ethereum").networkId(1).nativeCurrency("ETH").decimals(18).isActive(true).build(),
                ChainInfo.builder().chainId("polygon").name("Polygon").networkId(137).nativeCurrency("MATIC").decimals(18).isActive(true).build(),
                ChainInfo.builder().chainId("bsc").name("Binance Smart Chain").networkId(56).nativeCurrency("BNB").decimals(18).isActive(true).build(),
                ChainInfo.builder().chainId("avalanche").name("Avalanche").networkId(43114).nativeCurrency("AVAX").decimals(18).isActive(true).build(),
                ChainInfo.builder().chainId("solana").name("Solana").networkId(101).nativeCurrency("SOL").decimals(9).isActive(true).build()
            );

            SupportedChainsResponse response = new SupportedChainsResponse(
                chains.size(),
                chains
            );
            return Response.ok(response).build();
        });
    }

    /**
     * Get supported tokens on a specific chain
     */
    @GET
    @Path("/chains/{chainId}/tokens")
    public Uni<Response> getChainTokens(@PathParam("chainId") String chainId) {
        return tokenRegistry.getTokensOnChain(chainId)
            .map(tokens -> {
                ChainTokensResponse response = new ChainTokensResponse(
                    chainId,
                    tokens.size(),
                    tokens
                );
                return Response.ok(response).build();
            });
    }

    /**
     * Get supported bridge pairs
     */
    @GET
    @Path("/pairs")
    public Uni<Response> getSupportedPairs() {
        return tokenRegistry.getSupportedPairs()
            .map(pairs -> {
                BridgePairsResponse response = new BridgePairsResponse(
                    pairs.size(),
                    pairs
                );
                return Response.ok(response).build();
            });
    }

    // ========== Monitoring and Statistics Endpoints ==========

    /**
     * Get comprehensive bridge statistics
     */
    @GET
    @Path("/stats")
    public Uni<Response> getBridgeStats() {
        return Uni.combine().all().unis(
            Uni.createFrom().item(bridgeValidator.getNetworkStats()),
            Uni.createFrom().item(tokenRegistry.getStats()),
            Uni.createFrom().item(atomicSwapManager.getStats())
        ).asTuple().map(tuple -> {
            BridgeValidator.ValidatorNetworkStats validatorStats = tuple.getItem1();
            BridgeTokenRegistry.RegistryStats registryStats = tuple.getItem2();
            AtomicSwapManager.AtomicSwapStats swapStats = tuple.getItem3();

            ComprehensiveStatsResponse response = new ComprehensiveStatsResponse(
                validatorStats,
                registryStats,
                swapStats,
                System.currentTimeMillis()
            );

            return Response.ok(response).build();
        });
    }

    /**
     * Get bridge health status
     */
    @GET
    @Path("/health")
    public Uni<Response> getBridgeHealth() {
        return Uni.createFrom().item(() -> {
            BridgeValidator.ValidatorNetworkStats stats = bridgeValidator.getNetworkStats();
            
            boolean isHealthy = stats.healthyValidators() >= 18 && // At least 18/21 validators healthy
                               !stats.isEmergencyPaused() &&
                               stats.successRate() >= 95.0;

            BridgeHealthResponse response = new BridgeHealthResponse(
                isHealthy,
                isHealthy ? "Healthy" : "Degraded",
                stats.healthyValidators(),
                stats.totalValidators(),
                stats.isEmergencyPaused(),
                stats.successRate(),
                System.currentTimeMillis()
            );

            return Response.ok(response).build();
        });
    }

    // ========== Emergency Control Endpoints ==========

    /**
     * Emergency pause bridge operations (admin only)
     */
    @POST
    @Path("/emergency/pause")
    public Uni<Response> emergencyPause(EmergencyActionRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                bridgeValidator.emergencyPause(request.reason());
                
                EmergencyActionResponse response = new EmergencyActionResponse(
                    true,
                    "Bridge operations paused successfully",
                    request.reason(),
                    System.currentTimeMillis()
                );
                
                LOG.warnf("Bridge emergency pause activated: %s", request.reason());
                return Response.ok(response).build();
                
            } catch (Exception e) {
                LOG.errorf("Error during emergency pause: %s", e.getMessage());
                EmergencyActionResponse errorResponse = new EmergencyActionResponse(
                    false,
                    "Failed to pause: " + e.getMessage(),
                    request.reason(),
                    System.currentTimeMillis()
                );
                return Response.status(500).entity(errorResponse).build();
            }
        });
    }

    /**
     * Resume bridge operations (admin only)
     */
    @POST
    @Path("/emergency/resume")
    public Uni<Response> resumeOperations() {
        return Uni.createFrom().item(() -> {
            try {
                bridgeValidator.resumeOperations();
                
                EmergencyActionResponse response = new EmergencyActionResponse(
                    true,
                    "Bridge operations resumed successfully",
                    "Manual resume",
                    System.currentTimeMillis()
                );
                
                LOG.infof("Bridge operations resumed");
                return Response.ok(response).build();
                
            } catch (Exception e) {
                LOG.errorf("Error during resume: %s", e.getMessage());
                EmergencyActionResponse errorResponse = new EmergencyActionResponse(
                    false,
                    "Failed to resume: " + e.getMessage(),
                    "Manual resume",
                    System.currentTimeMillis()
                );
                return Response.status(500).entity(errorResponse).build();
            }
        });
    }

    // ========== Request/Response DTOs ==========

    public record BridgeTransferRequest(
        String sourceChain,
        String targetChain,
        String sourceAddress,
        String targetAddress,
        String tokenSymbol,
        BigDecimal amount,
        BridgeTransactionType transferType
    ) {}

    public record BridgeTransferResponse(
        String transactionId,
        boolean success,
        String message,
        BridgeTransactionStatus status,
        Integer validatorApprovals,
        Integer totalValidators,
        BigDecimal estimatedFee,
        Long consensusTimeMs
    ) {}

    public record BridgeStatusResponse(
        String transactionId,
        boolean found,
        String message,
        BridgeTransactionStatus status,
        Integer currentApprovals,
        Integer requiredApprovals,
        Boolean isCompleted,
        Long elapsedTimeMs
    ) {
        public BridgeStatusResponse(String transactionId, boolean found, String message) {
            this(transactionId, found, message, null, null, null, null, null);
        }
    }

    public record FeeEstimateRequest(
        String sourceChain,
        String targetChain,
        String tokenSymbol,
        BigDecimal amount
    ) {}

    public record FeeEstimateResponse(
        boolean success,
        BigDecimal bridgeFee,
        BigDecimal gasFee,
        BigDecimal totalFee,
        String message
    ) {}

    public record AtomicSwapRequest(
        String sourceChain,
        String targetChain,
        String sourceAddress,
        String targetAddress,
        String tokenSymbol,
        BigDecimal amount
    ) {}

    public record AtomicSwapResponse(
        String swapId,
        boolean success,
        String message,
        AtomicSwapManager.SwapStatus status,
        int estimatedTimeMs,
        String hashLock,
        String sourceTransactionHash,
        String targetTransactionHash
    ) {}

    public record AtomicSwapStatusResponse(
        String swapId,
        boolean found,
        String message,
        AtomicSwapManager.SwapStatus status,
        String sourceChain,
        String targetChain,
        BigDecimal amount,
        String tokenSymbol,
        Long timeRemainingSeconds,
        String createdAt
    ) {
        public AtomicSwapStatusResponse(String swapId, boolean found, String message) {
            this(swapId, found, message, null, null, null, null, null, null, null);
        }
    }

    public record SecretRevealRequest(String secret) {}
    public record SecretRevealResponse(boolean success, String message) {}

    public record ActiveSwapsResponse(int count, List<AtomicSwapManager.AtomicSwapStatus> swaps) {}

    public record SupportedChainsResponse(int count, List<ChainInfo> chains) {}

    public record ChainTokensResponse(String chainId, int count, List<BridgeTokenRegistry.TokenInfo> tokens) {}

    public record BridgePairsResponse(int count, List<BridgeTokenRegistry.BridgePairInfo> pairs) {}

    public record ComprehensiveStatsResponse(
        BridgeValidator.ValidatorNetworkStats validatorStats,
        BridgeTokenRegistry.RegistryStats registryStats,
        AtomicSwapManager.AtomicSwapStats atomicSwapStats,
        long timestamp
    ) {}

    public record BridgeHealthResponse(
        boolean isHealthy,
        String status,
        int healthyValidators,
        int totalValidators,
        boolean isEmergencyPaused,
        double successRate,
        long timestamp
    ) {}

    public record EmergencyActionRequest(String reason) {}

    public record EmergencyActionResponse(
        boolean success,
        String message,
        String reason,
        long timestamp
    ) {}
}