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

import io.aurigraph.v11.consensus.HyperRAFTConsensusService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Consensus API Resource
 *
 * Extracted from V11ApiResource as part of V3.7.3 Phase 1 refactoring.
 * Provides consensus algorithm operations:
 * - HyperRAFT++ consensus status
 * - Proposal submission
 * - Consensus node information
 *
 * @version 3.7.3
 * @author Aurigraph V11 Team
 */
@Path("/api/v11/consensus")
@ApplicationScoped
@Tag(name = "Consensus API", description = "HyperRAFT++ consensus algorithm operations")
public class ConsensusApiResource {

    private static final Logger LOG = Logger.getLogger(ConsensusApiResource.class);

    @Inject
    HyperRAFTConsensusService consensusService;

    // ==================== CONSENSUS APIs ====================

    @GET
    @Path("/status")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get consensus status", description = "Returns HyperRAFT++ consensus algorithm status")
    @APIResponse(responseCode = "200", description = "Consensus status retrieved successfully")
    public Uni<Object> getConsensusStatus() {
        return consensusService.getStats().map(stats -> (Object) stats);
    }

    @POST
    @Path("/propose")
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

    @GET
    @Path("/nodes")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get consensus nodes", description = "Retrieve consensus node information")
    @APIResponse(responseCode = "200", description = "Consensus nodes retrieved successfully")
    public Uni<Response> getConsensusNodes() {
        return Uni.createFrom().item(() -> {
            // TODO: Use SystemStatusService when implemented
            List<Map<String, Object>> nodes = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                nodes.add(Map.of(
                    "nodeId", "NODE-" + i,
                    "role", i == 0 ? "LEADER" : "FOLLOWER",
                    "status", "ACTIVE",
                    "uptime", "99.98%",
                    "blockHeight", 1_234_567 + i,
                    "lastSeen", System.currentTimeMillis()
                ));
            }
            return Response.ok(Map.of(
                "nodes", nodes,
                "totalNodes", nodes.size(),
                "leaderNode", "NODE-0",
                "consensusHealth", "HEALTHY"
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== DATA MODELS ====================

    /**
     * Consensus proposal model
     */
    public record ConsensusProposal(String proposalId, String data) {}
}
