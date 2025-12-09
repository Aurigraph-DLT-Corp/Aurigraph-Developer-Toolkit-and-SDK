package io.aurigraph.v11;

import io.aurigraph.v11.dto.topology.*;
import io.aurigraph.v11.dto.topology.NodeTopologyDTO.NodeType;
import io.aurigraph.v11.service.NodeTopologyService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

/**
 * REST API for Enhanced Node Topology
 * Provides endpoints for node topology, metrics, and active contracts
 *
 * GitHub Issue: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues/11
 */
@Path("/api/v11/topology")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Node Topology", description = "Enhanced node topology with real-time metrics and active contracts")
public class NodeTopologyResource {

    private static final Logger LOG = Logger.getLogger(NodeTopologyResource.class);

    @Inject
    NodeTopologyService nodeTopologyService;

    /**
     * Get full network topology
     */
    @GET
    @Operation(summary = "Get full network topology",
               description = "Returns the complete topology update with all nodes and network metrics")
    @APIResponse(responseCode = "200", description = "Topology retrieved successfully",
                 content = @Content(schema = @Schema(implementation = TopologyUpdateDTO.class)))
    public Response getTopology(
            @QueryParam("channel") String channelId,
            @QueryParam("type") String nodeType) {
        try {
            NodeType type = nodeType != null ? parseNodeType(nodeType) : null;
            TopologyUpdateDTO topology = nodeTopologyService.buildTopologyUpdate(channelId, type);

            return Response.ok(topology).build();
        } catch (Exception e) {
            LOG.error("Error getting topology", e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get all nodes with metrics
     */
    @GET
    @Path("/nodes")
    @Operation(summary = "Get all nodes with metrics",
               description = "Returns all nodes with their complete topology information")
    @APIResponse(responseCode = "200", description = "Nodes retrieved successfully")
    public Response getAllNodes(
            @QueryParam("type") String nodeType,
            @QueryParam("channel") String channelId,
            @QueryParam("includeContracts") @DefaultValue("true") boolean includeContracts) {
        try {
            List<NodeTopologyDTO> nodes;

            if (nodeType != null) {
                NodeType type = parseNodeType(nodeType);
                nodes = nodeTopologyService.getNodesByType(type);
            } else if (channelId != null) {
                nodes = nodeTopologyService.getNodesInChannel(channelId);
            } else {
                nodes = nodeTopologyService.getAllNodes();
            }

            return Response.ok(Map.of(
                "nodes", nodes,
                "count", nodes.size(),
                "timestamp", java.time.Instant.now()
            )).build();
        } catch (Exception e) {
            LOG.error("Error getting nodes", e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get specific node details
     */
    @GET
    @Path("/nodes/{nodeId}")
    @Operation(summary = "Get specific node details",
               description = "Returns detailed topology information for a specific node")
    @APIResponse(responseCode = "200", description = "Node retrieved successfully")
    @APIResponse(responseCode = "404", description = "Node not found")
    public Response getNode(@PathParam("nodeId") String nodeId) {
        try {
            return nodeTopologyService.getNode(nodeId)
                .map(node -> Response.ok(node).build())
                .orElse(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeId))
                    .build());
        } catch (Exception e) {
            LOG.error("Error getting node: " + nodeId, e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get nodes in a channel
     */
    @GET
    @Path("/channels/{channelId}")
    @Operation(summary = "Get nodes in a channel",
               description = "Returns all nodes that belong to a specific channel")
    @APIResponse(responseCode = "200", description = "Channel nodes retrieved successfully")
    public Response getChannelNodes(@PathParam("channelId") String channelId) {
        try {
            List<NodeTopologyDTO> nodes = nodeTopologyService.getNodesInChannel(channelId);
            double channelTps = nodes.stream().mapToDouble(NodeTopologyDTO::currentTps).sum();

            return Response.ok(Map.of(
                "channelId", channelId,
                "nodes", nodes,
                "nodeCount", nodes.size(),
                "channelTps", channelTps,
                "timestamp", java.time.Instant.now()
            )).build();
        } catch (Exception e) {
            LOG.error("Error getting channel nodes: " + channelId, e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get list of all channels
     */
    @GET
    @Path("/channels")
    @Operation(summary = "Get list of all channels",
               description = "Returns all unique channel IDs in the network")
    @APIResponse(responseCode = "200", description = "Channels retrieved successfully")
    public Response getChannels() {
        try {
            List<String> channels = nodeTopologyService.getChannelIds();

            return Response.ok(Map.of(
                "channels", channels,
                "count", channels.size()
            )).build();
        } catch (Exception e) {
            LOG.error("Error getting channels", e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get active contracts across all nodes
     */
    @GET
    @Path("/contracts")
    @Operation(summary = "Get active contracts across all nodes",
               description = "Returns all active smart contracts in the network")
    @APIResponse(responseCode = "200", description = "Contracts retrieved successfully")
    public Response getActiveContracts() {
        try {
            List<ActiveContractDTO> contracts = nodeTopologyService.getAllActiveContracts();

            return Response.ok(Map.of(
                "contracts", contracts,
                "count", contracts.size(),
                "timestamp", java.time.Instant.now()
            )).build();
        } catch (Exception e) {
            LOG.error("Error getting contracts", e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get contracts for a specific node
     */
    @GET
    @Path("/nodes/{nodeId}/contracts")
    @Operation(summary = "Get contracts for a specific node",
               description = "Returns all active contracts running on a specific node")
    @APIResponse(responseCode = "200", description = "Node contracts retrieved successfully")
    public Response getNodeContracts(@PathParam("nodeId") String nodeId) {
        try {
            List<ActiveContractDTO> contracts = nodeTopologyService.getNodeContracts(nodeId);

            return Response.ok(Map.of(
                "nodeId", nodeId,
                "contracts", contracts,
                "count", contracts.size()
            )).build();
        } catch (Exception e) {
            LOG.error("Error getting node contracts: " + nodeId, e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get topology statistics
     */
    @GET
    @Path("/stats")
    @Operation(summary = "Get topology statistics",
               description = "Returns aggregated statistics for the network topology")
    @APIResponse(responseCode = "200", description = "Statistics retrieved successfully",
                 content = @Content(schema = @Schema(implementation = TopologyStatsDTO.class)))
    public Response getTopologyStats() {
        try {
            TopologyStatsDTO stats = nodeTopologyService.getTopologyStats();
            return Response.ok(stats).build();
        } catch (Exception e) {
            LOG.error("Error getting topology stats", e);
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Helper method to parse node type string
     */
    private NodeType parseNodeType(String typeStr) {
        return switch (typeStr.toUpperCase()) {
            case "V", "VALIDATOR" -> NodeType.VALIDATOR;
            case "B", "BUSINESS" -> NodeType.BUSINESS;
            case "S", "SLIM" -> NodeType.SLIM;
            case "C", "CHANNEL" -> NodeType.CHANNEL;
            default -> throw new IllegalArgumentException("Unknown node type: " + typeStr);
        };
    }
}
