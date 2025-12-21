package io.aurigraph.v11.nodes;

import io.aurigraph.v11.demo.nodes.Node;
import io.aurigraph.v11.demo.models.NodeHealth;
import io.aurigraph.v11.demo.models.NodeMetrics;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.stream.Collectors;

/**
 * NodeManagementResource - Unified REST API for managing all Aurigraph V12 nodes.
 *
 * Provides a consolidated API for:
 * - Node lifecycle management (create, start, stop, restart, delete)
 * - Health monitoring across all node types
 * - Metrics collection and aggregation
 * - Node type enumeration and discovery
 *
 * Base path: /api/v12/nodes
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@Path("/api/v12/nodes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NodeManagementResource {

    private static final Logger LOG = Logger.getLogger(NodeManagementResource.class);

    @Inject
    NodeFactory nodeFactory;

    // ============================================
    // NODE TYPE DISCOVERY
    // ============================================

    /**
     * List all available node types
     */
    @GET
    @Path("/types")
    public Response getNodeTypes() {
        List<Map<String, Object>> types = Arrays.stream(NodeType.values())
            .map(type -> {
                Map<String, Object> info = new LinkedHashMap<>();
                info.put("type", type.name());
                info.put("displayName", type.getDisplayName());
                info.put("description", type.getDescription());
                info.put("canValidate", type.canValidate());
                info.put("storesFullChain", type.storesFullChain());
                info.put("isConsensusNode", type.isConsensusNode());
                return info;
            })
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "types", types,
            "count", types.size()
        )).build();
    }

    /**
     * Get node type details
     */
    @GET
    @Path("/types/{type}")
    public Response getNodeType(@PathParam("type") String typeName) {
        try {
            NodeType type = NodeType.valueOf(typeName.toUpperCase());
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("type", type.name());
            info.put("displayName", type.getDisplayName());
            info.put("description", type.getDescription());
            info.put("canValidate", type.canValidate());
            info.put("storesFullChain", type.storesFullChain());
            info.put("isConsensusNode", type.isConsensusNode());
            info.put("isBusinessNode", type.isBusinessNode());
            info.put("isChannelNode", type.isChannelNode());
            info.put("isExternalIntegration", type.isExternalIntegration());
            return Response.ok(info).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Unknown node type: " + typeName))
                .build();
        }
    }

    // ============================================
    // NODE LIFECYCLE MANAGEMENT
    // ============================================

    /**
     * Create a new node
     */
    @POST
    public Uni<Response> createNode(CreateNodeRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                NodeType type = NodeType.valueOf(request.type.toUpperCase());
                String nodeId = request.nodeId != null ? request.nodeId : null;

                Node node;
                if (nodeId != null) {
                    node = nodeFactory.createNode(type, nodeId);
                } else {
                    node = nodeFactory.createNode(type);
                }

                LOG.infof("Created node: %s of type %s", node.getNodeId(), type);

                return Response.status(Response.Status.CREATED)
                    .entity(buildNodeInfo(node, type))
                    .build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * List all nodes
     */
    @GET
    public Response listNodes(@QueryParam("type") String typeFilter) {
        Map<String, Node> nodes = nodeFactory.getAllNodes();

        List<Map<String, Object>> nodeList = nodes.entrySet().stream()
            .filter(entry -> {
                if (typeFilter == null) return true;
                String key = entry.getKey();
                return key.startsWith(typeFilter.toUpperCase() + ":");
            })
            .map(entry -> {
                String[] parts = entry.getKey().split(":");
                NodeType type = NodeType.valueOf(parts[0]);
                return buildNodeInfo(entry.getValue(), type);
            })
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "nodes", nodeList,
            "count", nodeList.size(),
            "totalCached", nodes.size()
        )).build();
    }

    /**
     * Get node by type and ID
     */
    @GET
    @Path("/{type}/{nodeId}")
    public Response getNode(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(typeName.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeId))
                    .build();
            }

            return Response.ok(buildNodeInfo(node, type)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + typeName))
                .build();
        }
    }

    /**
     * Start a node
     */
    @POST
    @Path("/{type}/{nodeId}/start")
    public Uni<Response> startNode(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        return Uni.createFrom().item(() -> {
            try {
                NodeType type = NodeType.valueOf(typeName.toUpperCase());
                Node node = nodeFactory.getNode(type, nodeId);

                if (node == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Node not found: " + nodeId))
                        .build();
                }

                node.start();
                LOG.infof("Started node: %s", nodeId);

                return Response.ok(Map.of(
                    "nodeId", nodeId,
                    "type", type.name(),
                    "status", "started",
                    "running", node.isRunning()
                )).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Stop a node
     */
    @POST
    @Path("/{type}/{nodeId}/stop")
    public Uni<Response> stopNode(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        return Uni.createFrom().item(() -> {
            try {
                NodeType type = NodeType.valueOf(typeName.toUpperCase());
                Node node = nodeFactory.getNode(type, nodeId);

                if (node == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Node not found: " + nodeId))
                        .build();
                }

                node.stop();
                LOG.infof("Stopped node: %s", nodeId);

                return Response.ok(Map.of(
                    "nodeId", nodeId,
                    "type", type.name(),
                    "status", "stopped",
                    "running", node.isRunning()
                )).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Restart a node
     */
    @POST
    @Path("/{type}/{nodeId}/restart")
    public Uni<Response> restartNode(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        return Uni.createFrom().item(() -> {
            try {
                NodeType type = NodeType.valueOf(typeName.toUpperCase());
                Node node = nodeFactory.getNode(type, nodeId);

                if (node == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Node not found: " + nodeId))
                        .build();
                }

                node.restart();
                LOG.infof("Restarted node: %s", nodeId);

                return Response.ok(Map.of(
                    "nodeId", nodeId,
                    "type", type.name(),
                    "status", "restarted",
                    "running", node.isRunning()
                )).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Delete a node
     */
    @DELETE
    @Path("/{type}/{nodeId}")
    public Response deleteNode(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(typeName.toUpperCase());
            Node node = nodeFactory.removeNode(type, nodeId);

            if (node == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeId))
                    .build();
            }

            if (node.isRunning()) {
                node.stop();
            }

            LOG.infof("Deleted node: %s", nodeId);

            return Response.ok(Map.of(
                "nodeId", nodeId,
                "type", type.name(),
                "deleted", true
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // ============================================
    // HEALTH & METRICS
    // ============================================

    /**
     * Get node health
     */
    @GET
    @Path("/{type}/{nodeId}/health")
    public Response getNodeHealth(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(typeName.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeId))
                    .build();
            }

            NodeHealth health = node.healthCheck();
            return Response.ok(Map.of(
                "nodeId", nodeId,
                "type", type.name(),
                "health", Map.of(
                    "status", health.status().name(),
                    "healthy", health.healthy(),
                    "uptimeSeconds", health.uptimeSeconds(),
                    "components", health.components()
                )
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get node metrics
     */
    @GET
    @Path("/{type}/{nodeId}/metrics")
    public Response getNodeMetrics(@PathParam("type") String typeName, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(typeName.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeId))
                    .build();
            }

            NodeMetrics metrics = node.getMetrics();
            return Response.ok(Map.of(
                "nodeId", nodeId,
                "type", type.name(),
                "metrics", Map.of(
                    "tps", metrics.tps(),
                    "latencyMs", metrics.latencyMs(),
                    "cpuUsage", metrics.cpuUsage(),
                    "memoryUsage", metrics.memoryUsage(),
                    "custom", metrics.customMetrics()
                )
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get health status for all nodes
     */
    @GET
    @Path("/health")
    public Response getAllNodesHealth() {
        Map<String, Node> nodes = nodeFactory.getAllNodes();

        List<Map<String, Object>> healthList = nodes.entrySet().stream()
            .map(entry -> {
                String[] parts = entry.getKey().split(":");
                Node node = entry.getValue();
                NodeHealth health = node.healthCheck();

                Map<String, Object> info = new LinkedHashMap<>();
                info.put("nodeId", node.getNodeId());
                info.put("type", parts[0]);
                info.put("status", health.status().name());
                info.put("healthy", health.healthy());
                info.put("running", node.isRunning());
                return info;
            })
            .collect(Collectors.toList());

        long healthyCount = healthList.stream()
            .filter(h -> Boolean.TRUE.equals(h.get("healthy")))
            .count();

        return Response.ok(Map.of(
            "nodes", healthList,
            "summary", Map.of(
                "total", healthList.size(),
                "healthy", healthyCount,
                "unhealthy", healthList.size() - healthyCount
            )
        )).build();
    }

    /**
     * Get metrics for all nodes
     */
    @GET
    @Path("/metrics")
    public Response getAllNodesMetrics() {
        Map<String, Node> nodes = nodeFactory.getAllNodes();

        List<Map<String, Object>> metricsList = nodes.entrySet().stream()
            .map(entry -> {
                String[] parts = entry.getKey().split(":");
                Node node = entry.getValue();
                NodeMetrics metrics = node.getMetrics();

                Map<String, Object> info = new LinkedHashMap<>();
                info.put("nodeId", node.getNodeId());
                info.put("type", parts[0]);
                info.put("tps", metrics.tps());
                info.put("latencyMs", metrics.latencyMs());
                return info;
            })
            .collect(Collectors.toList());

        // Aggregate metrics
        double totalTps = metricsList.stream()
            .mapToDouble(m -> ((Number) m.get("tps")).doubleValue())
            .sum();
        double avgLatency = metricsList.stream()
            .mapToDouble(m -> ((Number) m.get("latencyMs")).doubleValue())
            .average()
            .orElse(0);

        return Response.ok(Map.of(
            "nodes", metricsList,
            "aggregate", Map.of(
                "totalTps", totalTps,
                "averageLatencyMs", avgLatency,
                "nodeCount", metricsList.size()
            )
        )).build();
    }

    // ============================================
    // BULK OPERATIONS
    // ============================================

    /**
     * Start all nodes of a type
     */
    @POST
    @Path("/{type}/start-all")
    public Uni<Response> startAllNodesOfType(@PathParam("type") String typeName) {
        return Uni.createFrom().item(() -> {
            try {
                NodeType type = NodeType.valueOf(typeName.toUpperCase());
                Map<String, Node> nodes = nodeFactory.getAllNodes();

                int started = 0;
                for (Map.Entry<String, Node> entry : nodes.entrySet()) {
                    if (entry.getKey().startsWith(type.name() + ":")) {
                        Node node = entry.getValue();
                        if (!node.isRunning()) {
                            node.start();
                            started++;
                        }
                    }
                }

                return Response.ok(Map.of(
                    "type", type.name(),
                    "action", "start-all",
                    "nodesStarted", started
                )).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Stop all nodes of a type
     */
    @POST
    @Path("/{type}/stop-all")
    public Uni<Response> stopAllNodesOfType(@PathParam("type") String typeName) {
        return Uni.createFrom().item(() -> {
            try {
                NodeType type = NodeType.valueOf(typeName.toUpperCase());
                Map<String, Node> nodes = nodeFactory.getAllNodes();

                int stopped = 0;
                for (Map.Entry<String, Node> entry : nodes.entrySet()) {
                    if (entry.getKey().startsWith(type.name() + ":")) {
                        Node node = entry.getValue();
                        if (node.isRunning()) {
                            node.stop();
                            stopped++;
                        }
                    }
                }

                return Response.ok(Map.of(
                    "type", type.name(),
                    "action", "stop-all",
                    "nodesStopped", stopped
                )).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
            }
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Build node info response
     */
    private Map<String, Object> buildNodeInfo(Node node, NodeType type) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("nodeId", node.getNodeId());
        info.put("type", type.name());
        info.put("typeDisplayName", type.getDisplayName());
        info.put("running", node.isRunning());
        info.put("healthy", node.isHealthy());

        if (node instanceof ValidatorNode validator) {
            info.put("isLeader", validator.isLeader());
            info.put("blockHeight", validator.getCurrentBlockHeight());
            info.put("validatedTransactions", validator.getValidatedTransactions());
            info.put("connectedPeers", validator.getConnectedPeers().size());
            info.put("stakedAmount", validator.getStakedAmount().toString());
        } else if (node instanceof BusinessNode business) {
            NodeMetrics metrics = business.getMetrics();
            info.put("customMetrics", metrics.customMetrics());
        }

        return info;
    }

    // ============================================
    // REQUEST/RESPONSE CLASSES
    // ============================================

    public static class CreateNodeRequest {
        public String type;
        public String nodeId;
        public Map<String, Object> config;
    }
}
