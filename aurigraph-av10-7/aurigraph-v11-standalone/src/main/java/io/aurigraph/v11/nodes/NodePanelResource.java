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

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * NodePanelResource - REST API for Node Panel UI Components.
 *
 * Provides endpoints for:
 * - Node lifecycle management (create, start, stop, restart)
 * - Node status and health monitoring
 * - Node metrics collection
 * - Node topology visualization
 * - API Integration node management
 * - Weather API demonstration endpoints
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@Path("/api/v12/node-panel")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NodePanelResource {

    private static final Logger LOG = Logger.getLogger(NodePanelResource.class);

    @Inject
    NodeFactory nodeFactory;

    // ============================================
    // NODE MANAGEMENT ENDPOINTS
    // ============================================

    /**
     * List all registered nodes.
     */
    @GET
    public Response listNodes() {
        try {
            Map<String, Node> allNodes = nodeFactory.getAllNodes();

            List<NodeSummary> summaries = allNodes.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split(":");
                    Node node = entry.getValue();
                    return new NodeSummary(
                        node.getNodeId(),
                        parts[0],
                        node.getStatus().toString(),
                        node.isRunning(),
                        node.isHealthy()
                    );
                })
                .collect(Collectors.toList());

            return Response.ok(Map.of(
                "nodes", summaries,
                "count", summaries.size(),
                "timestamp", Instant.now()
            )).build();
        } catch (Exception e) {
            LOG.errorf(e, "Error listing nodes");
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get node types available for creation.
     */
    @GET
    @Path("/types")
    public Response getNodeTypes() {
        List<Map<String, Object>> types = Arrays.stream(NodeType.values())
            .map(type -> Map.<String, Object>of(
                "type", type.name(),
                "displayName", type.getDisplayName(),
                "description", type.getDescription(),
                "canValidate", type.canValidate(),
                "storesFullChain", type.storesFullChain()
            ))
            .collect(Collectors.toList());

        return Response.ok(Map.of("types", types)).build();
    }

    /**
     * Create a new node.
     */
    @POST
    public Response createNode(CreateNodeRequest request) {
        try {
            NodeType type = NodeType.valueOf(request.type.toUpperCase());
            String nodeId = request.nodeId != null ? request.nodeId : null;

            Node node;
            if (nodeId != null) {
                node = nodeFactory.createNode(type, nodeId);
            } else {
                node = nodeFactory.createNode(type);
            }

            return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "nodeId", node.getNodeId(),
                    "type", type.name(),
                    "status", node.getStatus().toString(),
                    "message", "Node created successfully"
                ))
                .build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        } catch (Exception e) {
            LOG.errorf(e, "Error creating node");
            return Response.serverError()
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get node details.
     */
    @GET
    @Path("/{nodeType}/{nodeId}")
    public Response getNode(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build();
            }

            return Response.ok(Map.of(
                "nodeId", node.getNodeId(),
                "type", type.name(),
                "status", node.getStatus().toString(),
                "running", node.isRunning(),
                "healthy", node.isHealthy()
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build();
        }
    }

    /**
     * Start a node.
     */
    @POST
    @Path("/{nodeType}/{nodeId}/start")
    public Uni<Response> startNode(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build());
            }

            return node.start().map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "nodeId", node.getNodeId(),
                        "status", node.getStatus().toString(),
                        "message", "Node started successfully"
                    )).build();
                } else {
                    return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of(
                            "nodeId", node.getNodeId(),
                            "status", node.getStatus().toString(),
                            "message", "Node already running or failed to start"
                        ))
                        .build();
                }
            });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build());
        }
    }

    /**
     * Stop a node.
     */
    @POST
    @Path("/{nodeType}/{nodeId}/stop")
    public Uni<Response> stopNode(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build());
            }

            return node.stop().map(success -> Response.ok(Map.of(
                "nodeId", node.getNodeId(),
                "status", node.getStatus().toString(),
                "message", success ? "Node stopped successfully" : "Node was already stopped"
            )).build());
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build());
        }
    }

    /**
     * Restart a node.
     */
    @POST
    @Path("/{nodeType}/{nodeId}/restart")
    public Uni<Response> restartNode(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build());
            }

            return node.restart().map(success -> Response.ok(Map.of(
                "nodeId", node.getNodeId(),
                "status", node.getStatus().toString(),
                "message", success ? "Node restarted successfully" : "Failed to restart node"
            )).build());
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build());
        }
    }

    /**
     * Delete a node.
     */
    @DELETE
    @Path("/{nodeType}/{nodeId}")
    public Uni<Response> deleteNode(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build());
            }

            // Stop node first if running
            Uni<Boolean> stopUni = node.isRunning() ? node.stop() : Uni.createFrom().item(true);

            return stopUni.map(stopped -> {
                nodeFactory.removeNode(type, nodeId);
                return Response.ok(Map.of(
                    "nodeId", nodeId,
                    "message", "Node deleted successfully"
                )).build();
            });
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build());
        }
    }

    // ============================================
    // HEALTH & METRICS ENDPOINTS
    // ============================================

    /**
     * Get node health.
     */
    @GET
    @Path("/{nodeType}/{nodeId}/health")
    public Uni<Response> getNodeHealth(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build());
            }

            return node.healthCheck().map(health -> Response.ok(Map.of(
                "nodeId", node.getNodeId(),
                "healthy", health.isHealthy(),
                "status", health.getStatus().toString(),
                "uptimeSeconds", health.getUptimeSeconds(),
                "lastCheckTime", health.getLastCheckTime(),
                "components", health.getComponentChecks()
            )).build());
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build());
        }
    }

    /**
     * Get node metrics.
     */
    @GET
    @Path("/{nodeType}/{nodeId}/metrics")
    public Uni<Response> getNodeMetrics(@PathParam("nodeType") String nodeType, @PathParam("nodeId") String nodeId) {
        try {
            NodeType type = NodeType.valueOf(nodeType.toUpperCase());
            Node node = nodeFactory.getNode(type, nodeId);

            if (node == null) {
                return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Node not found: " + nodeType + ":" + nodeId))
                    .build());
            }

            return node.getMetrics().map(metrics -> Response.ok(Map.of(
                "nodeId", node.getNodeId(),
                "timestamp", metrics.getTimestamp(),
                "uptimeSeconds", metrics.getUptimeSeconds(),
                "requestsPerSecond", metrics.getRequestsPerSecond(),
                "averageLatency", metrics.getAverageLatency(),
                "errorRate", metrics.getErrorRate(),
                "customMetrics", metrics.getCustomMetrics()
            )).build());
        } catch (IllegalArgumentException e) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid node type: " + nodeType))
                .build());
        }
    }

    /**
     * Get aggregated health for all nodes.
     */
    @GET
    @Path("/health")
    public Response getAllNodesHealth() {
        Map<String, Node> allNodes = nodeFactory.getAllNodes();

        int totalNodes = allNodes.size();
        long runningNodes = allNodes.values().stream().filter(Node::isRunning).count();
        long healthyNodes = allNodes.values().stream().filter(Node::isHealthy).count();

        return Response.ok(Map.of(
            "totalNodes", totalNodes,
            "runningNodes", runningNodes,
            "healthyNodes", healthyNodes,
            "overallHealthy", healthyNodes == runningNodes && runningNodes > 0,
            "timestamp", Instant.now()
        )).build();
    }

    // ============================================
    // API INTEGRATION NODE ENDPOINTS
    // ============================================

    /**
     * Get weather data (demonstration of API integration).
     */
    @GET
    @Path("/api-integration/{nodeId}/weather")
    public Uni<Response> getWeather(
            @PathParam("nodeId") String nodeId,
            @QueryParam("lat") Double latitude,
            @QueryParam("lon") Double longitude) {

        if (latitude == null || longitude == null) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "latitude (lat) and longitude (lon) are required"))
                .build());
        }

        Node node = nodeFactory.getNode(NodeType.API_INTEGRATION, nodeId);
        if (node == null) {
            return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "API Integration node not found: " + nodeId))
                .build());
        }

        if (!(node instanceof APIIntegrationNode)) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Node is not an API Integration node"))
                .build());
        }

        APIIntegrationNode apiNode = (APIIntegrationNode) node;

        return Uni.createFrom().completionStage(apiNode.getWeather(latitude, longitude))
            .map(weather -> Response.ok(Map.of(
                "nodeId", nodeId,
                "location", Map.of("latitude", latitude, "longitude", longitude),
                "weather", Map.of(
                    "temperature", weather.temperature,
                    "humidity", weather.humidity,
                    "windSpeed", weather.windSpeed,
                    "description", weather.description,
                    "timestamp", weather.timestamp
                )
            )).build())
            .onFailure().recoverWithItem(error -> Response.serverError()
                .entity(Map.of("error", error.getMessage()))
                .build());
    }

    /**
     * Get weather forecast (demonstration of API integration).
     */
    @GET
    @Path("/api-integration/{nodeId}/weather/forecast")
    public Uni<Response> getWeatherForecast(
            @PathParam("nodeId") String nodeId,
            @QueryParam("lat") Double latitude,
            @QueryParam("lon") Double longitude,
            @QueryParam("days") @DefaultValue("7") int days) {

        if (latitude == null || longitude == null) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "latitude (lat) and longitude (lon) are required"))
                .build());
        }

        Node node = nodeFactory.getNode(NodeType.API_INTEGRATION, nodeId);
        if (node == null) {
            return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "API Integration node not found: " + nodeId))
                .build());
        }

        if (!(node instanceof APIIntegrationNode)) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Node is not an API Integration node"))
                .build());
        }

        APIIntegrationNode apiNode = (APIIntegrationNode) node;

        return Uni.createFrom().completionStage(apiNode.getWeatherForecast(latitude, longitude, days))
            .map(forecasts -> {
                List<Map<String, Object>> forecastList = forecasts.stream()
                    .map(f -> Map.<String, Object>of(
                        "timestamp", f.timestamp,
                        "temperature", f.temperature,
                        "maxTemperature", f.maxTemperature,
                        "minTemperature", f.minTemperature,
                        "description", f.description
                    ))
                    .collect(Collectors.toList());

                return Response.ok(Map.of(
                    "nodeId", nodeId,
                    "location", Map.of("latitude", latitude, "longitude", longitude),
                    "forecastDays", days,
                    "forecasts", forecastList
                )).build();
            })
            .onFailure().recoverWithItem(error -> Response.serverError()
                .entity(Map.of("error", error.getMessage()))
                .build());
    }

    /**
     * Get API endpoints registered on a node.
     */
    @GET
    @Path("/api-integration/{nodeId}/endpoints")
    public Response getAPIEndpoints(@PathParam("nodeId") String nodeId) {
        Node node = nodeFactory.getNode(NodeType.API_INTEGRATION, nodeId);
        if (node == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "API Integration node not found: " + nodeId))
                .build();
        }

        if (!(node instanceof APIIntegrationNode)) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Node is not an API Integration node"))
                .build();
        }

        APIIntegrationNode apiNode = (APIIntegrationNode) node;
        Map<String, APIIntegrationNode.APIEndpoint> endpoints = apiNode.getEndpoints();

        List<Map<String, Object>> endpointList = endpoints.values().stream()
            .map(ep -> Map.<String, Object>of(
                "endpointId", ep.endpointId,
                "baseUrl", ep.baseUrl,
                "method", ep.method,
                "description", ep.description != null ? ep.description : "",
                "healthy", ep.healthy,
                "successCount", ep.successCount,
                "errorCount", ep.errorCount,
                "lastCalled", ep.lastCalled != null ? ep.lastCalled.toString() : "Never"
            ))
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "nodeId", nodeId,
            "endpoints", endpointList,
            "count", endpointList.size()
        )).build();
    }

    // ============================================
    // TOPOLOGY ENDPOINTS
    // ============================================

    /**
     * Get node topology for visualization.
     */
    @GET
    @Path("/topology")
    public Response getTopology() {
        Map<String, Node> allNodes = nodeFactory.getAllNodes();

        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> connections = new ArrayList<>();

        for (Map.Entry<String, Node> entry : allNodes.entrySet()) {
            String[] parts = entry.getKey().split(":");
            Node node = entry.getValue();

            nodes.add(Map.of(
                "id", node.getNodeId(),
                "type", parts[0],
                "status", node.getStatus().toString(),
                "running", node.isRunning(),
                "healthy", node.isHealthy()
            ));

            // Add connections based on node type relationships
            // Validators connect to each other
            // Business nodes connect to validators
            // API Integration nodes connect to business nodes
        }

        return Response.ok(Map.of(
            "nodes", nodes,
            "connections", connections,
            "timestamp", Instant.now()
        )).build();
    }

    // ============================================
    // DTOs
    // ============================================

    public static class CreateNodeRequest {
        public String type;
        public String nodeId;
    }

    public static class NodeSummary {
        public String nodeId;
        public String type;
        public String status;
        public boolean running;
        public boolean healthy;

        public NodeSummary(String nodeId, String type, String status, boolean running, boolean healthy) {
            this.nodeId = nodeId;
            this.type = type;
            this.status = status;
            this.running = running;
            this.healthy = healthy;
        }
    }
}
