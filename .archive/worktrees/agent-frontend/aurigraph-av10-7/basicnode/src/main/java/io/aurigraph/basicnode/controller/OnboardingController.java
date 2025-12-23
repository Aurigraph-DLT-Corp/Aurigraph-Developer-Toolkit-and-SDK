package io.aurigraph.basicnode.controller;

import io.aurigraph.basicnode.model.NodeConfig;
import io.aurigraph.basicnode.service.APIGatewayConnector;
import io.aurigraph.basicnode.service.NodeManager;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Onboarding Controller - Simplified setup wizard for new users
 */
@Path("/api/onboarding")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OnboardingController {
    
    private static final Logger logger = Logger.getLogger(OnboardingController.class.getName());
    
    @Inject
    NodeManager nodeManager;
    
    @Inject
    APIGatewayConnector apiConnector;
    
    /**
     * Start onboarding process
     */
    @POST
    @Path("/start")
    public Response startOnboarding(Map<String, Object> setupData) {
        try {
            logger.info("🎯 Starting onboarding process");
            
            String nodeName = (String) setupData.getOrDefault("nodeName", "My Basic Node");
            String networkMode = (String) setupData.getOrDefault("networkMode", "testnet");
            String platformUrl = (String) setupData.getOrDefault("platformUrl", "http://localhost:3018");
            
            // Validate platform connectivity
            boolean canConnect = testPlatformConnection(platformUrl);
            
            return Response.ok(Map.of(
                "step", 1,
                "message", "Onboarding started",
                "nodeName", nodeName,
                "networkMode", networkMode,
                "platformUrl", platformUrl,
                "platformAccessible", canConnect,
                "nextStep", canConnect ? "configure" : "troubleshoot"
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Onboarding start failed: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Onboarding failed", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Configure node with user settings
     */
    @POST
    @Path("/configure")
    public Response configureNode(Map<String, Object> configData) {
        try {
            logger.info("⚙️ Configuring node with user settings");
            
            // Create node configuration
            NodeConfig config = new NodeConfig();
            config.setNodeName((String) configData.getOrDefault("nodeName", "My Basic Node"));
            config.setNetworkMode((String) configData.getOrDefault("networkMode", "testnet"));
            config.setPlatformUrl((String) configData.getOrDefault("platformUrl", "http://localhost:3018"));
            config.setAutoUpdates((Boolean) configData.getOrDefault("autoUpdates", true));
            config.setEnableMonitoring((Boolean) configData.getOrDefault("enableMonitoring", true));
            
            // Validate configuration
            if (!config.isValid()) {
                return Response.status(400)
                    .entity(Map.of(
                        "error", "Invalid configuration", 
                        "details", config.getValidationErrors(),
                        "step", 2
                    )).build();
            }
            
            // Apply configuration
            nodeManager.updateConfig(config);
            
            return Response.ok(Map.of(
                "step", 3,
                "message", "Configuration applied successfully",
                "nextStep", "connect"
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Node configuration failed: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Configuration failed", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Connect to AV10-18 platform
     */
    @POST
    @Path("/connect")
    public Response connectToPlatform() {
        try {
            logger.info("🔗 Connecting to AV10-18 platform");
            
            String platformUrl = nodeManager.getNodeConfig().getPlatformUrl();
            boolean connected = apiConnector.connectToPlatform(platformUrl);
            
            if (connected) {
                return Response.ok(Map.of(
                    "step", 4,
                    "message", "Successfully connected to AV10-18 platform",
                    "connected", true,
                    "nextStep", "complete"
                )).build();
            } else {
                return Response.ok(Map.of(
                    "step", 4,
                    "message", "Could not connect to platform - node will run in standalone mode",
                    "connected", false,
                    "nextStep", "complete",
                    "warning", "Platform connection failed - check platform URL and availability"
                )).build();
            }
            
        } catch (Exception e) {
            logger.severe("❌ Platform connection failed: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Connection failed", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Complete onboarding process
     */
    @POST
    @Path("/complete")
    public Response completeOnboarding() {
        try {
            logger.info("🎉 Completing onboarding process");
            
            var status = nodeManager.getNodeStatus();
            var config = nodeManager.getNodeConfig();
            
            status.addNotification("Onboarding completed successfully");
            status.setStatus("RUNNING");
            
            return Response.ok(Map.of(
                "step", 5,
                "message", "Onboarding completed successfully!",
                "nodeId", config.getNodeId(),
                "nodeName", config.getNodeName(),
                "status", "RUNNING",
                "nextActions", Map.of(
                    "dashboard", "View real-time node metrics",
                    "monitoring", "Monitor resource usage",
                    "settings", "Adjust node configuration"
                )
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Onboarding completion failed: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Completion failed", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get onboarding status
     */
    @GET
    @Path("/status")
    public Response getOnboardingStatus() {
        try {
            var config = nodeManager.getNodeConfig();
            var status = nodeManager.getNodeStatus();
            
            boolean isConfigured = config != null && config.isValid();
            boolean isPlatformConnected = status.isPlatformConnected();
            boolean isRunning = "RUNNING".equals(status.getStatus());
            
            String currentStep;
            if (!isConfigured) {
                currentStep = "configure";
            } else if (!isPlatformConnected) {
                currentStep = "connect";
            } else if (!isRunning) {
                currentStep = "starting";
            } else {
                currentStep = "complete";
            }
            
            return Response.ok(Map.of(
                "configured", isConfigured,
                "platformConnected", isPlatformConnected,
                "running", isRunning,
                "currentStep", currentStep,
                "nodeId", config != null ? config.getNodeId() : "unknown",
                "onboardingComplete", isConfigured && isRunning
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error getting onboarding status: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get onboarding status", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Test platform connection
     */
    private boolean testPlatformConnection(String platformUrl) {
        try {
            // Simple connectivity test
            return apiConnector.connectToPlatform(platformUrl);
        } catch (Exception e) {
            logger.warning("⚠️ Platform connectivity test failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Reset onboarding (for re-configuration)
     */
    @POST
    @Path("/reset")
    public Response resetOnboarding() {
        try {
            logger.info("🔄 Resetting onboarding process");
            
            // Reset node to initial configuration
            var status = nodeManager.getNodeStatus();
            status.setStatus("INITIALIZING");
            status.addNotification("Onboarding reset - reconfiguration required");
            
            return Response.ok(Map.of(
                "message", "Onboarding reset successfully",
                "nextStep", "start"
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Onboarding reset failed: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Reset failed", "message", e.getMessage()))
                .build();
        }
    }
}