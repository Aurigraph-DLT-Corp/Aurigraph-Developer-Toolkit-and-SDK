package io.aurigraph.v11.api;

import io.aurigraph.v11.contracts.composite.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.quarkus.logging.Log;

import java.time.Instant;
import java.util.*;

/**
 * Topology Controller - REST API for Token Topology Visualization
 *
 * Sprint 10-11 Implementation (AV11-605-03)
 * Provides comprehensive endpoints for the D3.js force-directed graph visualization.
 *
 * Endpoints:
 * <ul>
 *   <li>GET /api/v11/topology/graph - Get full topology graph data</li>
 *   <li>GET /api/v11/topology/node/{id} - Get specific node details</li>
 *   <li>GET /api/v11/topology/stats - Get topology statistics</li>
 *   <li>GET /api/v11/topology/search - Search nodes</li>
 *   <li>GET /api/v11/topology/filter - Get filtered topology</li>
 * </ul>
 *
 * @author J4C Development Agent
 * @version 12.2.0
 * @since AV11-605-03
 */
@Path("/api/v11/topology")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TopologyController {

    @Inject
    TopologyService topologyService;

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    /**
     * Get full topology graph data.
     * Optimized for D3.js force-directed graph with 500+ nodes support.
     *
     * @param compositeId Optional composite token ID for specific topology
     * @param depth Maximum depth of traversal (default: 4)
     * @param nodeTypes Comma-separated list of node types to include
     * @param includeVerifiers Whether to include VVB verifier nodes
     * @return Topology graph data in D3.js compatible format
     */
    @GET
    @Path("/graph")
    public Uni<Response> getTopologyGraph(
            @QueryParam("compositeId") String compositeId,
            @QueryParam("depth") @DefaultValue("4") int depth,
            @QueryParam("nodeTypes") String nodeTypes,
            @QueryParam("includeVerifiers") @DefaultValue("true") boolean includeVerifiers) {

        Log.infof("Getting topology graph: compositeId=%s, depth=%d, includeVerifiers=%b",
                compositeId, depth, includeVerifiers);

        // Parse node type filters
        Set<String> typeFilters = parseNodeTypes(nodeTypes);

        if (compositeId != null && !compositeId.isEmpty()) {
            // Get topology for specific composite token
            return topologyService.getTopologyForCompositeToken(compositeId, depth, includeVerifiers)
                .map(topology -> {
                    if (topology == null) {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity(Map.of("error", "Composite token not found", "compositeId", compositeId))
                            .build();
                    }
                    return Response.ok(buildGraphResponse(topology, typeFilters)).build();
                })
                .onFailure().recoverWithItem(error -> {
                    Log.errorf("Failed to get topology graph: %s", error.getMessage());
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                });
        }

        // Get aggregated topology for all tokens (limited for performance)
        return getAggregatedTopology(depth, typeFilters, includeVerifiers);
    }

    /**
     * Get specific node details by ID.
     *
     * @param nodeId The node identifier
     * @param compositeId Optional composite token context
     * @return Detailed node information
     */
    @GET
    @Path("/node/{nodeId}")
    public Uni<Response> getNodeDetails(
            @PathParam("nodeId") String nodeId,
            @QueryParam("compositeId") String compositeId) {

        Log.infof("Getting node details: nodeId=%s, compositeId=%s", nodeId, compositeId);

        if (compositeId == null || compositeId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "compositeId query parameter is required"))
                    .build()
            );
        }

        return topologyService.getNodeDetails(compositeId, nodeId)
            .map(details -> {
                if (details == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Node not found", "nodeId", nodeId))
                        .build();
                }
                return Response.ok(details).build();
            })
            .onFailure().recoverWithItem(error -> {
                Log.errorf("Failed to get node details: %s", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get topology statistics.
     *
     * @param compositeId Optional composite token ID
     * @return Statistics about the topology
     */
    @GET
    @Path("/stats")
    public Uni<Response> getTopologyStats(
            @QueryParam("compositeId") String compositeId) {

        Log.infof("Getting topology stats: compositeId=%s", compositeId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("timestamp", Instant.now().toString());
        stats.put("serviceStats", topologyService.getStats());

        if (compositeId != null && !compositeId.isEmpty()) {
            return topologyService.getTopologyForCompositeToken(compositeId, 5, true)
                .map(topology -> {
                    if (topology != null) {
                        stats.put("topologyStats", topology.getStats());
                        stats.put("compositeId", compositeId);
                    }
                    return Response.ok(stats).build();
                });
        }

        return Uni.createFrom().item(Response.ok(stats).build());
    }

    /**
     * Search nodes across topologies.
     *
     * @param query Search query (ID, label, or type)
     * @param compositeId Optional composite token context
     * @param limit Maximum results (default: 50)
     * @return List of matching nodes
     */
    @GET
    @Path("/search")
    public Uni<Response> searchNodes(
            @QueryParam("q") String query,
            @QueryParam("compositeId") String compositeId,
            @QueryParam("limit") @DefaultValue("50") int limit) {

        if (query == null || query.trim().isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Query parameter 'q' is required"))
                    .build()
            );
        }

        Log.infof("Searching nodes: query=%s, compositeId=%s, limit=%d", query, compositeId, limit);

        if (compositeId == null || compositeId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "compositeId is required for search"))
                    .build()
            );
        }

        return topologyService.getTopologyForCompositeToken(compositeId, 5, true)
            .map(topology -> {
                if (topology == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Topology not found"))
                        .build();
                }

                String lowerQuery = query.toLowerCase();
                List<Map<String, Object>> results = topology.getNodes().stream()
                    .filter(node ->
                        node.getId().toLowerCase().contains(lowerQuery) ||
                        (node.getLabel() != null && node.getLabel().toLowerCase().contains(lowerQuery)) ||
                        node.getType().name().toLowerCase().contains(lowerQuery))
                    .limit(limit)
                    .map(node -> Map.<String, Object>of(
                        "id", node.getId(),
                        "label", node.getLabel() != null ? node.getLabel() : "",
                        "type", node.getType().name(),
                        "verified", node.isVerified(),
                        "status", node.getStatus() != null ? node.getStatus() : ""
                    ))
                    .toList();

                return Response.ok(Map.of(
                    "query", query,
                    "results", results,
                    "count", results.size()
                )).build();
            });
    }

    /**
     * Get filtered topology based on node types.
     *
     * @param compositeId Composite token ID
     * @param nodeTypes Comma-separated list of node types
     * @param verifiedOnly Only include verified nodes
     * @return Filtered topology
     */
    @GET
    @Path("/filter")
    public Uni<Response> getFilteredTopology(
            @QueryParam("compositeId") String compositeId,
            @QueryParam("nodeTypes") String nodeTypes,
            @QueryParam("verifiedOnly") @DefaultValue("false") boolean verifiedOnly) {

        if (compositeId == null || compositeId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "compositeId is required"))
                    .build()
            );
        }

        Set<String> typeFilters = parseNodeTypes(nodeTypes);

        return topologyService.getTopologyForCompositeToken(compositeId, 4, true)
            .map(topology -> {
                if (topology == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Topology not found"))
                        .build();
                }

                // Apply filters
                List<TokenTopology.TopologyNode> filteredNodes = topology.getNodes().stream()
                    .filter(node -> {
                        if (!typeFilters.isEmpty() && !typeFilters.contains(node.getType().name())) {
                            return false;
                        }
                        if (verifiedOnly && !node.isVerified()) {
                            return false;
                        }
                        return true;
                    })
                    .toList();

                Set<String> nodeIds = new HashSet<>();
                filteredNodes.forEach(n -> nodeIds.add(n.getId()));

                List<TokenTopology.TopologyEdge> filteredEdges = topology.getEdges().stream()
                    .filter(edge -> nodeIds.contains(edge.getSource()) && nodeIds.contains(edge.getTarget()))
                    .toList();

                return Response.ok(Map.of(
                    "nodes", filteredNodes,
                    "edges", filteredEdges,
                    "filters", Map.of(
                        "nodeTypes", typeFilters,
                        "verifiedOnly", verifiedOnly
                    ),
                    "stats", Map.of(
                        "nodeCount", filteredNodes.size(),
                        "edgeCount", filteredEdges.size()
                    )
                )).build();
            });
    }

    /**
     * Health check for topology service.
     *
     * @return Health status
     */
    @GET
    @Path("/health")
    public Response healthCheck() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "healthy");
        health.put("service", "Topology Controller");
        health.put("version", "12.2.0");
        health.put("timestamp", Instant.now().toString());
        health.put("stats", topologyService.getStats());

        return Response.ok(health).build();
    }

    // ==================== Helper Methods ====================

    /**
     * Parse comma-separated node types into a set.
     */
    private Set<String> parseNodeTypes(String nodeTypes) {
        if (nodeTypes == null || nodeTypes.trim().isEmpty()) {
            return Collections.emptySet();
        }
        return new HashSet<>(Arrays.asList(nodeTypes.toUpperCase().split(",")));
    }

    /**
     * Build D3.js compatible graph response with optional type filtering.
     */
    private Map<String, Object> buildGraphResponse(TokenTopology topology, Set<String> typeFilters) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();

        // Filter and convert nodes
        Set<String> includedNodeIds = new HashSet<>();

        for (TokenTopology.TopologyNode node : topology.getNodes()) {
            if (!typeFilters.isEmpty() && !typeFilters.contains(node.getType().name())) {
                continue;
            }

            includedNodeIds.add(node.getId());

            Map<String, Object> d3Node = new LinkedHashMap<>();
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

        // Filter and convert edges
        for (TokenTopology.TopologyEdge edge : topology.getEdges()) {
            if (!includedNodeIds.contains(edge.getSource()) || !includedNodeIds.contains(edge.getTarget())) {
                continue;
            }

            Map<String, Object> d3Link = new LinkedHashMap<>();
            d3Link.put("source", edge.getSource());
            d3Link.put("target", edge.getTarget());
            d3Link.put("type", edge.getType().name());
            d3Link.put("label", edge.getLabel());
            d3Link.put("color", edge.getStyle().getColor());
            d3Link.put("width", edge.getStyle().getWidth());
            d3Link.put("style", edge.getStyle().getLineStyle());
            links.add(d3Link);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("nodes", nodes);
        response.put("links", links);
        response.put("metadata", Map.of(
            "topologyId", topology.getTopologyId(),
            "rootId", topology.getRootId(),
            "type", topology.getType().name(),
            "depth", topology.getDepth(),
            "generatedAt", topology.getGeneratedAt().toString()
        ));
        response.put("stats", Map.of(
            "nodeCount", nodes.size(),
            "linkCount", links.size()
        ));

        return response;
    }

    /**
     * Get aggregated topology from all composite tokens (with limits for performance).
     */
    private Uni<Response> getAggregatedTopology(int depth, Set<String> typeFilters, boolean includeVerifiers) {
        // Return demo/empty topology when no specific token is requested
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("nodes", List.of());
        response.put("links", List.of());
        response.put("metadata", Map.of(
            "type", "AGGREGATED",
            "message", "Provide compositeId parameter for specific topology",
            "generatedAt", Instant.now().toString()
        ));
        response.put("stats", Map.of(
            "nodeCount", 0,
            "linkCount", 0
        ));

        return Uni.createFrom().item(Response.ok(response).build());
    }
}
