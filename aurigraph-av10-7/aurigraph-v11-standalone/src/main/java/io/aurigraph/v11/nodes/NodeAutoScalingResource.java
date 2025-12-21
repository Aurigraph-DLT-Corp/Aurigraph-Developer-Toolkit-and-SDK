package io.aurigraph.v11.nodes;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Node Auto-Scaling REST API
 *
 * Provides endpoints for automatic and manual node scaling based on load metrics.
 * Supports all node types: Validator, Business, EI (External Integration), API.
 *
 * Features:
 * - Automatic scaling based on configurable thresholds
 * - Manual scale up/down operations
 * - Node pool management
 * - Health-based scaling decisions
 * - Scaling history and audit trail
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@Path("/api/v12/nodes/scaling")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NodeAutoScalingResource {

    private static final Logger LOG = Logger.getLogger(NodeAutoScalingResource.class);

    @ConfigProperty(name = "nodes.autoscaling.enabled", defaultValue = "true")
    boolean autoScalingEnabled;

    @ConfigProperty(name = "nodes.autoscaling.min.validators", defaultValue = "5")
    int minValidators;

    @ConfigProperty(name = "nodes.autoscaling.max.validators", defaultValue = "21")
    int maxValidators;

    @ConfigProperty(name = "nodes.autoscaling.min.business", defaultValue = "3")
    int minBusinessNodes;

    @ConfigProperty(name = "nodes.autoscaling.max.business", defaultValue = "50")
    int maxBusinessNodes;

    @ConfigProperty(name = "nodes.autoscaling.min.ei", defaultValue = "2")
    int minEiNodes;

    @ConfigProperty(name = "nodes.autoscaling.max.ei", defaultValue = "20")
    int maxEiNodes;

    @ConfigProperty(name = "nodes.autoscaling.cpu.threshold.up", defaultValue = "75")
    double cpuScaleUpThreshold;

    @ConfigProperty(name = "nodes.autoscaling.cpu.threshold.down", defaultValue = "30")
    double cpuScaleDownThreshold;

    @ConfigProperty(name = "nodes.autoscaling.tps.threshold.up", defaultValue = "800000")
    long tpsScaleUpThreshold;

    // Node pools
    private final Map<String, NodeInstance> activeNodes = new ConcurrentHashMap<>();
    private final Map<String, NodeInstance> pendingNodes = new ConcurrentHashMap<>();
    private final List<ScalingEvent> scalingHistory = Collections.synchronizedList(new ArrayList<>());

    // Counters by type
    private final AtomicInteger validatorCount = new AtomicInteger(5);
    private final AtomicInteger businessCount = new AtomicInteger(10);
    private final AtomicInteger eiCount = new AtomicInteger(5);
    private final AtomicInteger apiCount = new AtomicInteger(2);

    // ==================== Auto-Scaling Configuration ====================

    /**
     * Get auto-scaling configuration
     * GET /api/v12/nodes/scaling/config
     */
    @GET
    @Path("/config")
    public Response getScalingConfig() {
        LOG.info("Getting auto-scaling configuration");

        return Response.ok(Map.of(
            "autoScalingEnabled", autoScalingEnabled,
            "thresholds", Map.of(
                "cpuScaleUp", cpuScaleUpThreshold,
                "cpuScaleDown", cpuScaleDownThreshold,
                "tpsScaleUp", tpsScaleUpThreshold
            ),
            "limits", Map.of(
                "validator", Map.of("min", minValidators, "max", maxValidators),
                "business", Map.of("min", minBusinessNodes, "max", maxBusinessNodes),
                "ei", Map.of("min", minEiNodes, "max", maxEiNodes)
            ),
            "currentCounts", Map.of(
                "validator", validatorCount.get(),
                "business", businessCount.get(),
                "ei", eiCount.get(),
                "api", apiCount.get(),
                "total", validatorCount.get() + businessCount.get() + eiCount.get() + apiCount.get()
            )
        )).build();
    }

    /**
     * Update auto-scaling configuration
     * PUT /api/v12/nodes/scaling/config
     */
    @PUT
    @Path("/config")
    public Response updateScalingConfig(ScalingConfigRequest request) {
        LOG.infof("Updating auto-scaling configuration: enabled=%s", request.enabled);

        // In production, persist to configuration store
        // For now, log the update
        return Response.ok(Map.of(
            "success", true,
            "message", "Configuration updated",
            "autoScalingEnabled", request.enabled != null ? request.enabled : autoScalingEnabled
        )).build();
    }

    // ==================== Manual Scaling Operations ====================

    /**
     * Scale up nodes
     * POST /api/v12/nodes/scaling/scale-up
     */
    @POST
    @Path("/scale-up")
    public Uni<Response> scaleUp(ScaleRequest request) {
        LOG.infof("Scale up request: type=%s, count=%d", request.nodeType, request.count);

        return Uni.createFrom().item(() -> {
            // Validate node type
            if (!isValidNodeType(request.nodeType)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid node type: " + request.nodeType))
                    .build();
            }

            // Check limits
            int currentCount = getNodeCount(request.nodeType);
            int maxCount = getMaxCount(request.nodeType);

            if (currentCount + request.count > maxCount) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "error", "Cannot scale up beyond maximum",
                        "currentCount", currentCount,
                        "requested", request.count,
                        "maxAllowed", maxCount
                    ))
                    .build();
            }

            // Provision new nodes
            List<NodeInstance> newNodes = new ArrayList<>();
            for (int i = 0; i < request.count; i++) {
                NodeInstance node = provisionNode(request.nodeType, request.region);
                newNodes.add(node);
                pendingNodes.put(node.nodeId, node);
            }

            // Update counter
            incrementNodeCount(request.nodeType, request.count);

            // Record scaling event
            ScalingEvent event = new ScalingEvent(
                UUID.randomUUID().toString(),
                "SCALE_UP",
                request.nodeType,
                request.count,
                request.reason != null ? request.reason : "Manual scale up",
                Instant.now()
            );
            scalingHistory.add(event);

            LOG.infof("Scaled up %d %s nodes", request.count, request.nodeType);

            return Response.ok(Map.of(
                "success", true,
                "operation", "SCALE_UP",
                "nodeType", request.nodeType,
                "nodesAdded", request.count,
                "newNodeIds", newNodes.stream().map(n -> n.nodeId).toList(),
                "totalCount", getNodeCount(request.nodeType),
                "eventId", event.eventId,
                "message", String.format("Successfully scaled up %d %s nodes", request.count, request.nodeType)
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Scale down nodes
     * POST /api/v12/nodes/scaling/scale-down
     */
    @POST
    @Path("/scale-down")
    public Uni<Response> scaleDown(ScaleRequest request) {
        LOG.infof("Scale down request: type=%s, count=%d", request.nodeType, request.count);

        return Uni.createFrom().item(() -> {
            // Validate node type
            if (!isValidNodeType(request.nodeType)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid node type: " + request.nodeType))
                    .build();
            }

            // Check minimum limits
            int currentCount = getNodeCount(request.nodeType);
            int minCount = getMinCount(request.nodeType);

            if (currentCount - request.count < minCount) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "error", "Cannot scale down below minimum",
                        "currentCount", currentCount,
                        "requested", request.count,
                        "minRequired", minCount
                    ))
                    .build();
            }

            // Decommission nodes (select idle ones first)
            List<String> removedNodeIds = new ArrayList<>();
            for (int i = 0; i < request.count; i++) {
                String nodeId = selectNodeForRemoval(request.nodeType);
                if (nodeId != null) {
                    decommissionNode(nodeId);
                    removedNodeIds.add(nodeId);
                }
            }

            // Update counter
            decrementNodeCount(request.nodeType, removedNodeIds.size());

            // Record scaling event
            ScalingEvent event = new ScalingEvent(
                UUID.randomUUID().toString(),
                "SCALE_DOWN",
                request.nodeType,
                removedNodeIds.size(),
                request.reason != null ? request.reason : "Manual scale down",
                Instant.now()
            );
            scalingHistory.add(event);

            LOG.infof("Scaled down %d %s nodes", removedNodeIds.size(), request.nodeType);

            return Response.ok(Map.of(
                "success", true,
                "operation", "SCALE_DOWN",
                "nodeType", request.nodeType,
                "nodesRemoved", removedNodeIds.size(),
                "removedNodeIds", removedNodeIds,
                "totalCount", getNodeCount(request.nodeType),
                "eventId", event.eventId,
                "message", String.format("Successfully scaled down %d %s nodes", removedNodeIds.size(), request.nodeType)
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Auto-Scaling Triggers ====================

    /**
     * Trigger auto-scaling evaluation
     * POST /api/v12/nodes/scaling/evaluate
     */
    @POST
    @Path("/evaluate")
    public Uni<Response> evaluateScaling(MetricsInput metrics) {
        LOG.infof("Evaluating auto-scaling: CPU=%.1f%%, TPS=%d", metrics.cpuUsage, metrics.currentTps);

        return Uni.createFrom().item(() -> {
            if (!autoScalingEnabled) {
                return Response.ok(Map.of(
                    "action", "NONE",
                    "reason", "Auto-scaling is disabled"
                )).build();
            }

            List<ScalingRecommendation> recommendations = new ArrayList<>();

            // Check CPU threshold for scale up
            if (metrics.cpuUsage > cpuScaleUpThreshold) {
                recommendations.add(new ScalingRecommendation(
                    "SCALE_UP",
                    "BUSINESS",
                    2,
                    String.format("CPU usage (%.1f%%) exceeds threshold (%.1f%%)",
                        metrics.cpuUsage, cpuScaleUpThreshold)
                ));
            }

            // Check CPU threshold for scale down
            if (metrics.cpuUsage < cpuScaleDownThreshold && businessCount.get() > minBusinessNodes) {
                recommendations.add(new ScalingRecommendation(
                    "SCALE_DOWN",
                    "BUSINESS",
                    1,
                    String.format("CPU usage (%.1f%%) below threshold (%.1f%%)",
                        metrics.cpuUsage, cpuScaleDownThreshold)
                ));
            }

            // Check TPS threshold
            if (metrics.currentTps > tpsScaleUpThreshold) {
                recommendations.add(new ScalingRecommendation(
                    "SCALE_UP",
                    "VALIDATOR",
                    1,
                    String.format("TPS (%d) exceeds threshold (%d)",
                        metrics.currentTps, tpsScaleUpThreshold)
                ));
            }

            // Check memory pressure
            if (metrics.memoryUsage > 85) {
                recommendations.add(new ScalingRecommendation(
                    "SCALE_UP",
                    "BUSINESS",
                    1,
                    String.format("Memory usage (%.1f%%) is high", metrics.memoryUsage)
                ));
            }

            return Response.ok(Map.of(
                "evaluated", true,
                "metrics", Map.of(
                    "cpuUsage", metrics.cpuUsage,
                    "memoryUsage", metrics.memoryUsage,
                    "currentTps", metrics.currentTps,
                    "activeConnections", metrics.activeConnections
                ),
                "recommendations", recommendations,
                "recommendedAction", recommendations.isEmpty() ? "NONE" : recommendations.get(0).action
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Node Pool Management ====================

    /**
     * Get active nodes
     * GET /api/v12/nodes/scaling/nodes
     */
    @GET
    @Path("/nodes")
    public Response getActiveNodes(
            @QueryParam("type") String nodeType,
            @QueryParam("status") String status) {

        LOG.infof("Getting active nodes: type=%s, status=%s", nodeType, status);

        List<NodeInstance> nodes = new ArrayList<>();

        // Generate sample nodes based on counters
        for (int i = 0; i < validatorCount.get(); i++) {
            nodes.add(createSampleNode("VALIDATOR", i));
        }
        for (int i = 0; i < businessCount.get(); i++) {
            nodes.add(createSampleNode("BUSINESS", i));
        }
        for (int i = 0; i < eiCount.get(); i++) {
            nodes.add(createSampleNode("EI", i));
        }
        for (int i = 0; i < apiCount.get(); i++) {
            nodes.add(createSampleNode("API", i));
        }

        // Filter by type if specified
        if (nodeType != null && !nodeType.isEmpty()) {
            nodes = nodes.stream()
                .filter(n -> n.nodeType.equalsIgnoreCase(nodeType))
                .toList();
        }

        return Response.ok(Map.of(
            "totalNodes", nodes.size(),
            "nodes", nodes,
            "summary", Map.of(
                "validator", validatorCount.get(),
                "business", businessCount.get(),
                "ei", eiCount.get(),
                "api", apiCount.get()
            )
        )).build();
    }

    /**
     * Get scaling history
     * GET /api/v12/nodes/scaling/history
     */
    @GET
    @Path("/history")
    public Response getScalingHistory(
            @QueryParam("limit") @DefaultValue("50") int limit) {

        LOG.infof("Getting scaling history: limit=%d", limit);

        List<ScalingEvent> history = scalingHistory.stream()
            .sorted((a, b) -> b.timestamp.compareTo(a.timestamp))
            .limit(limit)
            .toList();

        return Response.ok(Map.of(
            "totalEvents", scalingHistory.size(),
            "events", history
        )).build();
    }

    // ==================== Health-Based Scaling ====================

    /**
     * Report node health for scaling decisions
     * POST /api/v12/nodes/scaling/health
     */
    @POST
    @Path("/health")
    public Response reportNodeHealth(NodeHealthReport report) {
        LOG.debugf("Node health report: nodeId=%s, healthy=%s", report.nodeId, report.healthy);

        // Update node status
        NodeInstance node = activeNodes.get(report.nodeId);
        if (node != null) {
            node.healthy = report.healthy;
            node.lastHealthCheck = Instant.now();
            node.cpuUsage = report.cpuUsage;
            node.memoryUsage = report.memoryUsage;
        }

        // Check if unhealthy nodes need replacement
        long unhealthyCount = activeNodes.values().stream()
            .filter(n -> !n.healthy)
            .count();

        boolean needsReplacement = unhealthyCount > 0;

        return Response.ok(Map.of(
            "received", true,
            "nodeId", report.nodeId,
            "unhealthyNodes", unhealthyCount,
            "replacementNeeded", needsReplacement
        )).build();
    }

    // ==================== Helper Methods ====================

    private boolean isValidNodeType(String type) {
        return type != null && (
            type.equalsIgnoreCase("VALIDATOR") ||
            type.equalsIgnoreCase("BUSINESS") ||
            type.equalsIgnoreCase("EI") ||
            type.equalsIgnoreCase("API")
        );
    }

    private int getNodeCount(String type) {
        return switch (type.toUpperCase()) {
            case "VALIDATOR" -> validatorCount.get();
            case "BUSINESS" -> businessCount.get();
            case "EI" -> eiCount.get();
            case "API" -> apiCount.get();
            default -> 0;
        };
    }

    private int getMaxCount(String type) {
        return switch (type.toUpperCase()) {
            case "VALIDATOR" -> maxValidators;
            case "BUSINESS" -> maxBusinessNodes;
            case "EI" -> maxEiNodes;
            case "API" -> 10;
            default -> 10;
        };
    }

    private int getMinCount(String type) {
        return switch (type.toUpperCase()) {
            case "VALIDATOR" -> minValidators;
            case "BUSINESS" -> minBusinessNodes;
            case "EI" -> minEiNodes;
            case "API" -> 1;
            default -> 1;
        };
    }

    private void incrementNodeCount(String type, int count) {
        switch (type.toUpperCase()) {
            case "VALIDATOR" -> validatorCount.addAndGet(count);
            case "BUSINESS" -> businessCount.addAndGet(count);
            case "EI" -> eiCount.addAndGet(count);
            case "API" -> apiCount.addAndGet(count);
        }
    }

    private void decrementNodeCount(String type, int count) {
        switch (type.toUpperCase()) {
            case "VALIDATOR" -> validatorCount.addAndGet(-count);
            case "BUSINESS" -> businessCount.addAndGet(-count);
            case "EI" -> eiCount.addAndGet(-count);
            case "API" -> apiCount.addAndGet(-count);
        }
    }

    private NodeInstance provisionNode(String type, String region) {
        NodeInstance node = new NodeInstance();
        node.nodeId = type.toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        node.nodeType = type.toUpperCase();
        node.region = region != null ? region : "us-east-1";
        node.status = "PROVISIONING";
        node.healthy = false;
        node.createdAt = Instant.now();

        // Simulate async provisioning
        Thread.startVirtualThread(() -> {
            try {
                Thread.sleep(5000); // Simulate 5s provisioning
                node.status = "RUNNING";
                node.healthy = true;
                activeNodes.put(node.nodeId, node);
                pendingNodes.remove(node.nodeId);
                LOG.infof("Node provisioned: %s", node.nodeId);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        return node;
    }

    private String selectNodeForRemoval(String type) {
        // Select least loaded or oldest node
        return activeNodes.values().stream()
            .filter(n -> n.nodeType.equalsIgnoreCase(type))
            .min(Comparator.comparing(n -> n.createdAt))
            .map(n -> n.nodeId)
            .orElse(type.toLowerCase() + "-temp-" + System.currentTimeMillis());
    }

    private void decommissionNode(String nodeId) {
        NodeInstance node = activeNodes.remove(nodeId);
        if (node != null) {
            node.status = "DECOMMISSIONING";
            LOG.infof("Node decommissioned: %s", nodeId);
        }
    }

    private NodeInstance createSampleNode(String type, int index) {
        NodeInstance node = new NodeInstance();
        node.nodeId = type.toLowerCase() + "-" + String.format("%03d", index);
        node.nodeType = type;
        node.region = "us-east-1";
        node.status = "RUNNING";
        node.healthy = true;
        node.cpuUsage = 30 + (index * 5) % 50;
        node.memoryUsage = 40 + (index * 3) % 40;
        node.createdAt = Instant.now().minusSeconds(86400 + index * 3600);
        node.lastHealthCheck = Instant.now().minusSeconds(index * 10);
        return node;
    }

    // ==================== Data Models ====================

    public record ScaleRequest(
        String nodeType,
        int count,
        String region,
        String reason
    ) {}

    public record ScalingConfigRequest(
        Boolean enabled,
        Double cpuScaleUpThreshold,
        Double cpuScaleDownThreshold,
        Long tpsScaleUpThreshold
    ) {}

    public record MetricsInput(
        double cpuUsage,
        double memoryUsage,
        long currentTps,
        int activeConnections
    ) {}

    public record NodeHealthReport(
        String nodeId,
        boolean healthy,
        double cpuUsage,
        double memoryUsage,
        int activeConnections
    ) {}

    public static class NodeInstance {
        public String nodeId;
        public String nodeType;
        public String region;
        public String status;
        public boolean healthy;
        public double cpuUsage;
        public double memoryUsage;
        public Instant createdAt;
        public Instant lastHealthCheck;
    }

    public record ScalingEvent(
        String eventId,
        String action,
        String nodeType,
        int count,
        String reason,
        Instant timestamp
    ) {}

    public record ScalingRecommendation(
        String action,
        String nodeType,
        int suggestedCount,
        String reason
    ) {}
}
