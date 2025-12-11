package io.aurigraph.v11.api;

import io.aurigraph.v11.contracts.composite.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.quarkus.logging.Log;

import java.util.*;

/**
 * Token Topology REST API
 *
 * Provides endpoints for visualizing token relationships in a graph structure.
 * Designed for use with D3.js, vis-network, or similar visualization libraries.
 *
 * Endpoints:
 * - GET /api/v11/topology/{compositeId} - Get topology for composite token
 * - GET /api/v11/topology/contract/{contractId} - Get topology for active contract
 * - GET /api/v11/topology/{id}/node/{nodeId} - Get specific node details
 * - GET /api/v11/topology/{id}/stats - Get topology statistics
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-605-01
 */
@Path("/api/v11/topology")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TokenTopologyResource {

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    @Inject
    TopologyService topologyService;

    /**
     * Get topology for a composite token
     *
     * GET /api/v11/topology/{compositeId}
     */
    @GET
    @Path("/{compositeId}")
    public Uni<Response> getTopologyForCompositeToken(
            @PathParam("compositeId") String compositeId,
            @QueryParam("depth") @DefaultValue("3") int depth,
            @QueryParam("includeVerifiers") @DefaultValue("false") boolean includeVerifiers) {

        Log.infof("Getting topology for composite token: %s (depth=%d)", compositeId, depth);

        return topologyService.getTopologyForCompositeToken(compositeId, depth, includeVerifiers)
            .map(topology -> {
                if (topology != null) {
                    return Response.ok(buildTopologyResponse(topology)).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Composite token not found: " + compositeId))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                Log.errorf("Failed to get topology: %s", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get topology for an active contract
     *
     * GET /api/v11/topology/contract/{contractId}
     */
    @GET
    @Path("/contract/{contractId}")
    public Uni<Response> getTopologyForContract(
            @PathParam("contractId") String contractId,
            @QueryParam("depth") @DefaultValue("4") int depth) {

        Log.infof("Getting topology for contract: %s", contractId);

        return topologyService.getTopologyForContract(contractId, depth)
            .map(topology -> {
                if (topology != null) {
                    return Response.ok(buildTopologyResponse(topology)).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Contract not found: " + contractId))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                Log.errorf("Failed to get contract topology: %s", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get specific node details from topology
     *
     * GET /api/v11/topology/{compositeId}/node/{nodeId}
     */
    @GET
    @Path("/{compositeId}/node/{nodeId}")
    public Uni<Response> getNodeDetails(
            @PathParam("compositeId") String compositeId,
            @PathParam("nodeId") String nodeId) {

        Log.infof("Getting node details: %s in topology %s", nodeId, compositeId);

        return topologyService.getNodeDetails(compositeId, nodeId)
            .map(nodeDetails -> {
                if (nodeDetails != null) {
                    return Response.ok(nodeDetails).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Node not found: " + nodeId))
                        .build();
                }
            });
    }

    /**
     * Get topology statistics
     *
     * GET /api/v11/topology/{compositeId}/stats
     */
    @GET
    @Path("/{compositeId}/stats")
    public Uni<Response> getTopologyStats(@PathParam("compositeId") String compositeId) {
        Log.infof("Getting topology stats for: %s", compositeId);

        return topologyService.getTopologyForCompositeToken(compositeId, 5, false)
            .map(topology -> {
                if (topology != null) {
                    Map<String, Object> stats = topology.getStats();
                    stats.put("compositeId", compositeId);
                    stats.put("generatedAt", topology.getGeneratedAt().toString());
                    return Response.ok(stats).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Composite token not found"))
                        .build();
                }
            });
    }

    /**
     * Get edges for a specific node
     *
     * GET /api/v11/topology/{compositeId}/node/{nodeId}/edges
     */
    @GET
    @Path("/{compositeId}/node/{nodeId}/edges")
    public Uni<Response> getNodeEdges(
            @PathParam("compositeId") String compositeId,
            @PathParam("nodeId") String nodeId) {

        return topologyService.getTopologyForCompositeToken(compositeId, 3, false)
            .map(topology -> {
                if (topology != null) {
                    List<TokenTopology.TopologyEdge> edges = topology.getEdgesForNode(nodeId);
                    return Response.ok(Map.of(
                        "nodeId", nodeId,
                        "edges", edges,
                        "count", edges.size()
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Topology not found"))
                        .build();
                }
            });
    }

    /**
     * Get child nodes of a specific node
     *
     * GET /api/v11/topology/{compositeId}/node/{nodeId}/children
     */
    @GET
    @Path("/{compositeId}/node/{nodeId}/children")
    public Uni<Response> getChildNodes(
            @PathParam("compositeId") String compositeId,
            @PathParam("nodeId") String nodeId) {

        return topologyService.getTopologyForCompositeToken(compositeId, 3, false)
            .map(topology -> {
                if (topology != null) {
                    List<TokenTopology.TopologyNode> children = topology.getChildNodes(nodeId);
                    return Response.ok(Map.of(
                        "parentId", nodeId,
                        "children", children,
                        "count", children.size()
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Topology not found"))
                        .build();
                }
            });
    }

    /**
     * Generate D3.js compatible format
     *
     * GET /api/v11/topology/{compositeId}/d3
     */
    @GET
    @Path("/{compositeId}/d3")
    public Uni<Response> getD3Format(@PathParam("compositeId") String compositeId) {
        Log.infof("Getting D3 format topology for: %s", compositeId);

        return topologyService.getTopologyForCompositeToken(compositeId, 4, true)
            .map(topology -> {
                if (topology != null) {
                    return Response.ok(buildD3Response(topology)).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Composite token not found"))
                        .build();
                }
            });
    }

    /**
     * Generate vis-network compatible format
     *
     * GET /api/v11/topology/{compositeId}/vis-network
     */
    @GET
    @Path("/{compositeId}/vis-network")
    public Uni<Response> getVisNetworkFormat(@PathParam("compositeId") String compositeId) {
        Log.infof("Getting vis-network format topology for: %s", compositeId);

        return topologyService.getTopologyForCompositeToken(compositeId, 4, true)
            .map(topology -> {
                if (topology != null) {
                    return Response.ok(buildVisNetworkResponse(topology)).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Composite token not found"))
                        .build();
                }
            });
    }

    /**
     * Get navigation path from one node to another
     *
     * GET /api/v11/topology/{compositeId}/path
     */
    @GET
    @Path("/{compositeId}/path")
    public Uni<Response> getNavigationPath(
            @PathParam("compositeId") String compositeId,
            @QueryParam("from") String fromNode,
            @QueryParam("to") String toNode) {

        if (fromNode == null || toNode == null) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Both 'from' and 'to' query parameters are required"))
                    .build()
            );
        }

        return topologyService.findPath(compositeId, fromNode, toNode)
            .map(path -> Response.ok(Map.of(
                "from", fromNode,
                "to", toNode,
                "path", path,
                "pathLength", path.size()
            )).build())
            .onFailure().recoverWithItem(error ->
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Path not found: " + error.getMessage()))
                    .build()
            );
    }

    /**
     * Get all topologies for an owner
     *
     * GET /api/v11/topology/by-owner/{ownerAddress}
     */
    @GET
    @Path("/by-owner/{ownerAddress}")
    public Uni<Response> getTopologiesByOwner(@PathParam("ownerAddress") String ownerAddress) {
        return topologyService.getTopologiesByOwner(ownerAddress)
            .map(topologies -> Response.ok(Map.of(
                "ownerAddress", ownerAddress,
                "topologies", topologies.stream().map(t -> Map.of(
                    "topologyId", t.getTopologyId(),
                    "rootId", t.getRootId(),
                    "type", t.getType().name(),
                    "nodeCount", t.getNodes().size(),
                    "edgeCount", t.getEdges().size()
                )).toList(),
                "count", topologies.size()
            )).build());
    }

    /**
     * Health check
     */
    @GET
    @Path("/health")
    public Response health() {
        return Response.ok(Map.of(
            "status", "healthy",
            "service", "Token Topology API",
            "version", "12.1.0"
        )).build();
    }

    // ==================== Helper Methods ====================

    /**
     * Build standard topology response
     */
    private Map<String, Object> buildTopologyResponse(TokenTopology topology) {
        Map<String, Object> response = new HashMap<>();
        response.put("topologyId", topology.getTopologyId());
        response.put("rootId", topology.getRootId());
        response.put("type", topology.getType().name());
        response.put("depth", topology.getDepth());
        response.put("generatedAt", topology.getGeneratedAt().toString());
        response.put("nodes", topology.getNodes());
        response.put("edges", topology.getEdges());
        response.put("stats", topology.getStats());
        return response;
    }

    /**
     * Build D3.js force-directed graph format
     */
    private Map<String, Object> buildD3Response(TokenTopology topology) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();

        // Convert nodes to D3 format
        for (TokenTopology.TopologyNode node : topology.getNodes()) {
            Map<String, Object> d3Node = new HashMap<>();
            d3Node.put("id", node.getId());
            d3Node.put("label", node.getLabel());
            d3Node.put("group", node.getType().name());
            d3Node.put("color", node.getStyle().getColor());
            d3Node.put("size", node.getStyle().getSize());
            d3Node.put("verified", node.isVerified());
            d3Node.put("status", node.getStatus());
            d3Node.put("data", node.getData());
            nodes.add(d3Node);
        }

        // Convert edges to D3 links format
        for (TokenTopology.TopologyEdge edge : topology.getEdges()) {
            Map<String, Object> d3Link = new HashMap<>();
            d3Link.put("source", edge.getSource());
            d3Link.put("target", edge.getTarget());
            d3Link.put("type", edge.getType().name());
            d3Link.put("label", edge.getLabel());
            d3Link.put("color", edge.getStyle().getColor());
            d3Link.put("width", edge.getStyle().getWidth());
            d3Link.put("style", edge.getStyle().getLineStyle());
            links.add(d3Link);
        }

        return Map.of(
            "nodes", nodes,
            "links", links,
            "metadata", Map.of(
                "topologyId", topology.getTopologyId(),
                "type", topology.getType().name(),
                "generatedAt", topology.getGeneratedAt().toString()
            )
        );
    }

    /**
     * Build vis-network format
     */
    private Map<String, Object> buildVisNetworkResponse(TokenTopology topology) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        // Convert nodes to vis-network format
        for (TokenTopology.TopologyNode node : topology.getNodes()) {
            Map<String, Object> visNode = new HashMap<>();
            visNode.put("id", node.getId());
            visNode.put("label", node.getLabel());
            visNode.put("title", buildNodeTooltip(node));
            visNode.put("group", node.getType().name());
            visNode.put("shape", node.getStyle().getShape());
            visNode.put("color", Map.of(
                "background", node.getStyle().getColor(),
                "border", node.getStyle().getBorderColor()
            ));
            visNode.put("size", node.getStyle().getSize());
            visNode.put("borderWidth", node.getStyle().getBorderWidth());
            if (node.isVerified()) {
                visNode.put("icon", Map.of("code", "\uf058", "color", "#10B981"));
            }
            nodes.add(visNode);
        }

        // Convert edges to vis-network format
        for (TokenTopology.TopologyEdge edge : topology.getEdges()) {
            Map<String, Object> visEdge = new HashMap<>();
            visEdge.put("id", edge.getId());
            visEdge.put("from", edge.getSource());
            visEdge.put("to", edge.getTarget());
            visEdge.put("label", edge.getLabel());
            visEdge.put("title", edge.getType().getDescription());
            visEdge.put("color", Map.of("color", edge.getStyle().getColor()));
            visEdge.put("width", edge.getStyle().getWidth());
            visEdge.put("dashes", edge.getStyle().getLineStyle().equals("dashed"));
            visEdge.put("arrows", edge.getStyle().getArrowType().equals("arrow") ? "to" : "");
            edges.add(visEdge);
        }

        return Map.of(
            "nodes", nodes,
            "edges", edges,
            "options", buildVisNetworkOptions()
        );
    }

    /**
     * Build node tooltip content
     */
    private String buildNodeTooltip(TokenTopology.TopologyNode node) {
        StringBuilder tooltip = new StringBuilder();
        tooltip.append("<b>").append(node.getLabel()).append("</b><br>");
        tooltip.append("Type: ").append(node.getType().name()).append("<br>");
        if (node.getStatus() != null) {
            tooltip.append("Status: ").append(node.getStatus()).append("<br>");
        }
        tooltip.append("Verified: ").append(node.isVerified() ? "Yes" : "No");
        return tooltip.toString();
    }

    /**
     * Build vis-network default options
     */
    private Map<String, Object> buildVisNetworkOptions() {
        return Map.of(
            "layout", Map.of(
                "hierarchical", Map.of(
                    "enabled", true,
                    "direction", "UD",
                    "sortMethod", "directed",
                    "levelSeparation", 100,
                    "nodeSpacing", 150
                )
            ),
            "physics", Map.of(
                "enabled", true,
                "hierarchicalRepulsion", Map.of(
                    "nodeDistance", 150,
                    "springLength", 150
                )
            ),
            "interaction", Map.of(
                "hover", true,
                "tooltipDelay", 200,
                "zoomView", true
            ),
            "nodes", Map.of(
                "font", Map.of("size", 14),
                "borderWidth", 2
            ),
            "edges", Map.of(
                "font", Map.of("size", 12, "align", "middle"),
                "smooth", Map.of("type", "cubicBezier")
            )
        );
    }
}
