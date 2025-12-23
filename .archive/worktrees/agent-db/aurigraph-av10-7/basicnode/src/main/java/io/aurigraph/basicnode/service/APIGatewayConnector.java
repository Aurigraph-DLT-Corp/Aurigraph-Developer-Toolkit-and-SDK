package io.aurigraph.basicnode.service;

import io.aurigraph.basicnode.model.NodeStatus;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.annotation.PostConstruct;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;
import java.util.logging.Logger;

/**
 * API Gateway Connector - Integration with AV10-18 platform
 */
@ApplicationScoped
public class APIGatewayConnector {
    
    private static final Logger logger = Logger.getLogger(APIGatewayConnector.class.getName());
    
    @ConfigProperty(name = "aurigraph.platform.url", defaultValue = "http://localhost:3018")
    String platformUrl;
    
    @ConfigProperty(name = "aurigraph.api.timeout", defaultValue = "5000")
    int apiTimeout;
    
    private Client httpClient;
    private boolean connected = false;
    private String apiKey;
    
    @PostConstruct
    public void initialize() {
        this.httpClient = ClientBuilder.newBuilder()
            .connectTimeout(apiTimeout, java.util.concurrent.TimeUnit.MILLISECONDS)
            .readTimeout(apiTimeout, java.util.concurrent.TimeUnit.MILLISECONDS)
            .build();
            
        logger.info("🔌 API Gateway Connector initialized");
    }
    
    public boolean connectToPlatform(String platformUrl) {
        try {
            logger.info("🔗 Connecting to AV10-18 platform: " + platformUrl);
            
            // Test platform connectivity
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/status")
                .request(MediaType.APPLICATION_JSON)
                .get();
                
            if (response.getStatus() == 200) {
                connected = true;
                logger.info("✅ Successfully connected to AV10-18 platform");
                
                // Register this basic node
                registerNode();
                return true;
            } else {
                logger.warning("⚠️ Platform connection failed: HTTP " + response.getStatus());
                return false;
            }
            
        } catch (Exception e) {
            logger.warning("❌ Failed to connect to platform: " + e.getMessage());
            connected = false;
            return false;
        }
    }
    
    private void registerNode() {
        try {
            var registrationData = Map.of(
                "nodeType", "BASIC_NODE",
                "version", "10.19.0",
                "capabilities", Map.of(
                    "maxMemoryMB", 512,
                    "maxCores", 2,
                    "containerized", true,
                    "userFriendly", true
                )
            );
            
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/nodes/register")
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.json(registrationData));
                
            if (response.getStatus() == 201 || response.getStatus() == 200) {
                var result = response.readEntity(Map.class);
                this.apiKey = (String) result.get("apiKey");
                logger.info("🎯 Node registered successfully with API key");
            } else {
                logger.warning("⚠️ Node registration failed: HTTP " + response.getStatus());
            }
            
        } catch (Exception e) {
            logger.warning("❌ Node registration error: " + e.getMessage());
        }
    }
    
    public void sendNodeStatus(NodeStatus status) {
        if (!connected || apiKey == null) return;
        
        try {
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/nodes/status")
                .request(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + apiKey)
                .post(Entity.json(status));
                
            if (response.getStatus() != 200) {
                logger.warning("⚠️ Failed to send node status: HTTP " + response.getStatus());
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error sending node status: " + e.getMessage());
        }
    }
    
    public Map<String, Object> getPlatformStatus() {
        if (!connected) return null;
        
        try {
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/status")
                .request(MediaType.APPLICATION_JSON)
                .get();
                
            if (response.getStatus() == 200) {
                return response.readEntity(Map.class);
            } else {
                logger.warning("⚠️ Failed to get platform status: HTTP " + response.getStatus());
                return null;
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error getting platform status: " + e.getMessage());
            return null;
        }
    }
    
    public boolean isConnected() {
        return connected;
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public Map<String, Object> discoverChannels() {
        if (!connected) return null;
        
        try {
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/channels/discover")
                .request(MediaType.APPLICATION_JSON)
                .get();
                
            if (response.getStatus() == 200) {
                return response.readEntity(Map.class);
            } else {
                logger.warning("⚠️ Failed to discover channels: HTTP " + response.getStatus());
                return null;
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error discovering channels: " + e.getMessage());
            return null;
        }
    }
    
    public boolean joinChannel(String channelId, String nodeId) {
        if (!connected || apiKey == null) return false;
        
        try {
            var joinData = Map.of(
                "channelId", channelId,
                "nodeId", nodeId,
                "nodeType", "BASIC_NODE"
            );
            
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/channels/" + channelId + "/join")
                .request(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + apiKey)
                .post(Entity.json(joinData));
                
            if (response.getStatus() == 200 || response.getStatus() == 201) {
                logger.info("✅ Successfully joined channel: " + channelId);
                return true;
            } else {
                logger.warning("⚠️ Failed to join channel " + channelId + ": HTTP " + response.getStatus());
                return false;
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error joining channel " + channelId + ": " + e.getMessage());
            return false;
        }
    }
    
    public boolean leaveChannel(String channelId, String nodeId) {
        if (!connected || apiKey == null) return false;
        
        try {
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/channels/" + channelId + "/leave")
                .queryParam("nodeId", nodeId)
                .request(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + apiKey)
                .delete();
                
            if (response.getStatus() == 200 || response.getStatus() == 204) {
                logger.info("✅ Successfully left channel: " + channelId);
                return true;
            } else {
                logger.warning("⚠️ Failed to leave channel " + channelId + ": HTTP " + response.getStatus());
                return false;
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error leaving channel " + channelId + ": " + e.getMessage());
            return false;
        }
    }
    
    public boolean checkChannelHealth(String channelId) {
        if (!connected) return false;
        
        try {
            Response response = httpClient
                .target(platformUrl)
                .path("/api/v18/channels/" + channelId + "/health")
                .request(MediaType.APPLICATION_JSON)
                .get();
                
            if (response.getStatus() == 200) {
                var healthData = response.readEntity(Map.class);
                return "healthy".equals(healthData.get("status"));
            } else {
                return false;
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error checking channel health " + channelId + ": " + e.getMessage());
            return false;
        }
    }
    
    public void disconnect() {
        connected = false;
        if (httpClient != null) {
            httpClient.close();
        }
        logger.info("🔌 Disconnected from platform");
    }
}