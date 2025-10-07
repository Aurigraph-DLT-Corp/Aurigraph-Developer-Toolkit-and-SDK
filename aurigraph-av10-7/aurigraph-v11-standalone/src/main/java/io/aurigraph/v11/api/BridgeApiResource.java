package io.aurigraph.v11.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import io.aurigraph.v11.bridge.CrossChainBridgeService;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Cross-Chain Bridge API Resource
 *
 * Extracted from V11ApiResource as part of V3.7.3 Phase 1 refactoring.
 * Provides cross-chain bridge operations:
 * - Bridge statistics and monitoring
 * - Cross-chain asset transfers
 * - Multi-chain interoperability
 *
 * @version 3.7.3
 * @author Aurigraph V11 Team
 */
@Path("/api/v11/bridge")
@ApplicationScoped
@Tag(name = "Cross-Chain Bridge API", description = "Cross-chain bridge and interoperability operations")
public class BridgeApiResource {

    private static final Logger LOG = Logger.getLogger(BridgeApiResource.class);

    @Inject
    CrossChainBridgeService bridgeService;

    // ==================== BRIDGE APIs ====================

    @GET
    @Path("/stats")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get cross-chain bridge statistics", description = "Returns cross-chain bridge performance statistics")
    @APIResponse(responseCode = "200", description = "Bridge stats retrieved successfully")
    public Uni<Object> getBridgeStats() {
        return bridgeService.getBridgeStats().map(stats -> (Object) stats);
    }

    @POST
    @Path("/transfer")
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

    // ==================== DATA MODELS ====================

    /**
     * Cross-chain transfer request model
     */
    public record CrossChainTransferRequest(
        String sourceChain,
        String targetChain,
        String asset,
        BigDecimal amount,
        String recipient
    ) {}
}
