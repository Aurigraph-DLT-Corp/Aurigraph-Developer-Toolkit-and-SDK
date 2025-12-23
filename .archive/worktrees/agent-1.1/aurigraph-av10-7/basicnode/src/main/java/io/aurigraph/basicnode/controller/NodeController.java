package io.aurigraph.basicnode.controller;

import io.aurigraph.basicnode.model.NodeConfig;
import io.aurigraph.basicnode.model.NodeStatus;
import io.aurigraph.basicnode.service.NodeManager;
import io.aurigraph.basicnode.service.ResourceMonitor;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Node Controller - REST API endpoints for node management
 */
@Path("/api/node")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NodeController {
    
    private static final Logger logger = Logger.getLogger(NodeController.class.getName());
    
    @Inject
    NodeManager nodeManager;
    
    @Inject
    ResourceMonitor resourceMonitor;
    
    /**
     * Get current node status
     */
    @GET
    @Path("/status")
    public Response getNodeStatus() {
        try {
            NodeStatus status = nodeManager.getNodeStatus();
            return Response.ok(status).build();
        } catch (Exception e) {
            logger.severe("❌ Error getting node status: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get node status", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get node configuration
     */
    @GET
    @Path("/config")
    public Response getNodeConfig() {
        try {
            NodeConfig config = nodeManager.getNodeConfig();
            return Response.ok(config).build();
        } catch (Exception e) {
            logger.severe("❌ Error getting node config: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get node config", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Update node configuration
     */
    @PUT
    @Path("/config")
    public Response updateNodeConfig(NodeConfig newConfig) {
        try {
            if (!newConfig.isValid()) {
                return Response.status(400)
                    .entity(Map.of("error", "Invalid configuration", "details", newConfig.getValidationErrors()))
                    .build();
            }
            
            nodeManager.updateConfig(newConfig);
            logger.info("⚙️ Node configuration updated via API");
            
            return Response.ok(Map.of("message", "Configuration updated successfully")).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error updating node config: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to update config", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get current resource metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics() {
        try {
            var metrics = resourceMonitor.getCurrentMetrics();
            return Response.ok(metrics).build();
        } catch (Exception e) {
            logger.severe("❌ Error getting metrics: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get metrics", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get performance report
     */
    @GET
    @Path("/performance")
    public Response getPerformanceReport() {
        try {
            String report = resourceMonitor.getPerformanceReport();
            boolean withinLimits = resourceMonitor.isWithinLimits();
            
            return Response.ok(Map.of(
                "report", report,
                "withinLimits", withinLimits,
                "grade", resourceMonitor.getCurrentMetrics().getPerformanceGrade(),
                "efficiency", resourceMonitor.getCurrentMetrics().getEfficiencyScore()
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error getting performance report: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get performance report", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Restart node (graceful restart)
     */
    @POST
    @Path("/restart")
    public Response restartNode() {
        try {
            logger.info("🔄 Node restart requested via API");
            
            // In a real implementation, this would trigger a graceful restart
            // For now, we'll just reset the node status
            var status = nodeManager.getNodeStatus();
            status.setStatus("RESTARTING");
            status.addNotification("Node restart initiated via API");
            
            return Response.ok(Map.of("message", "Node restart initiated")).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error restarting node: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to restart node", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get node information summary
     */
    @GET
    @Path("/info")
    public Response getNodeInfo() {
        try {
            var config = nodeManager.getNodeConfig();
            var status = nodeManager.getNodeStatus();
            var metrics = resourceMonitor.getCurrentMetrics();
            
            return Response.ok(Map.of(
                "nodeId", config.getNodeId(),
                "nodeName", config.getNodeName(),
                "version", "10.19.0",
                "status", status.getStatus(),
                "uptime", status.getUptime(),
                "platformConnected", status.isPlatformConnected(),
                "memoryUsage", String.format("%.1f MB", metrics.getMemoryUsageMB()),
                "cpuUsage", String.format("%.1f%%", metrics.getCpuUsagePercent()),
                "performanceGrade", metrics.getPerformanceGrade(),
                "healthy", status.isHealthy()
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error getting node info: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get node info", "message", e.getMessage()))
                .build();
        }
    }
}