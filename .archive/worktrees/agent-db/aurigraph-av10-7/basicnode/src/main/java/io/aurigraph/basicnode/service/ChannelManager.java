package io.aurigraph.basicnode.service;

import io.aurigraph.basicnode.model.ChannelConfig;
import io.aurigraph.basicnode.model.NodeConfig;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * Channel Manager - Handles channel discovery, joining, and management
 */
@ApplicationScoped
public class ChannelManager {
    
    private static final Logger logger = Logger.getLogger(ChannelManager.class.getName());
    
    @Inject
    APIGatewayConnector apiConnector;
    
    @Inject
    NodeManager nodeManager;
    
    private final Map<String, ChannelConfig> availableChannels = new ConcurrentHashMap<>();
    private final Map<String, ChannelConfig> joinedChannels = new ConcurrentHashMap<>();
    private final Map<String, Boolean> channelHealthStatus = new ConcurrentHashMap<>();
    
    private ScheduledExecutorService scheduler;
    private boolean initialized = false;
    
    public void initialize() {
        if (initialized) return;
        
        this.scheduler = Executors.newScheduledThreadPool(2);
        
        // Start channel discovery
        startChannelDiscovery();
        
        // Start channel health monitoring
        startChannelHealthMonitoring();
        
        this.initialized = true;
        logger.info("🎯 Channel Manager initialized");
    }
    
    private void startChannelDiscovery() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                discoverAvailableChannels();
            } catch (Exception e) {
                logger.warning("❌ Channel discovery failed: " + e.getMessage());
            }
        }, 10, 60, TimeUnit.SECONDS); // Every 60 seconds
    }
    
    private void startChannelHealthMonitoring() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                monitorChannelHealth();
            } catch (Exception e) {
                logger.warning("❌ Channel health monitoring failed: " + e.getMessage());
            }
        }, 30, 30, TimeUnit.SECONDS); // Every 30 seconds
    }
    
    public void discoverAvailableChannels() {
        if (!apiConnector.isConnected()) return;
        
        try {
            // Discover channels from AV10-18 platform
            Map<String, Object> channelData = apiConnector.discoverChannels();
            
            if (channelData != null && channelData.containsKey("channels")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> channels = (List<Map<String, Object>>) channelData.get("channels");
                
                for (Map<String, Object> channelInfo : channels) {
                    String channelId = (String) channelInfo.get("channelId");
                    String channelName = (String) channelInfo.get("name");
                    String typeStr = (String) channelInfo.get("type");
                    
                    ChannelConfig.ChannelType type = ChannelConfig.ChannelType.valueOf(typeStr);
                    ChannelConfig config = new ChannelConfig(channelId, channelName, type);
                    
                    // Set additional properties
                    if (channelInfo.containsKey("securityLevel")) {
                        String secLevel = (String) channelInfo.get("securityLevel");
                        config.setSecurityLevel(ChannelConfig.SecurityLevel.valueOf(secLevel));
                    }
                    
                    if (channelInfo.containsKey("region")) {
                        config.setRegion((String) channelInfo.get("region"));
                    }
                    
                    if (channelInfo.containsKey("specialization")) {
                        config.setSpecialization((String) channelInfo.get("specialization"));
                    }
                    
                    if (channelInfo.containsKey("maxNodes")) {
                        config.setMaxNodes((Integer) channelInfo.get("maxNodes"));
                    }
                    
                    if (channelInfo.containsKey("minNodes")) {
                        config.setMinNodes((Integer) channelInfo.get("minNodes"));
                    }
                    
                    availableChannels.put(channelId, config);
                }
                
                logger.fine("🔍 Discovered " + channels.size() + " available channels");
                
                // Auto-join compatible channels if enabled
                autoJoinCompatibleChannels();
            }
            
        } catch (Exception e) {
            logger.warning("❌ Error discovering channels: " + e.getMessage());
        }
    }
    
    private void autoJoinCompatibleChannels() {
        NodeConfig nodeConfig = nodeManager.getNodeConfig();
        
        for (ChannelConfig channel : availableChannels.values()) {
            if (channel.isAutoJoin() && 
                !joinedChannels.containsKey(channel.getChannelId()) &&
                channel.isCompatibleWith(nodeConfig)) {
                
                joinChannel(channel.getChannelId());
            }
        }
    }
    
    public boolean joinChannel(String channelId) {
        ChannelConfig channel = availableChannels.get(channelId);
        if (channel == null) {
            logger.warning("❌ Channel not found: " + channelId);
            return false;
        }
        
        try {
            logger.info("🔗 Joining channel: " + channel.getChannelName() + " (" + channelId + ")");
            
            // Check compatibility
            NodeConfig nodeConfig = nodeManager.getNodeConfig();
            if (!channel.isCompatibleWith(nodeConfig)) {
                logger.warning("⚠️ Node not compatible with channel: " + channelId);
                return false;
            }
            
            // Join channel via API
            boolean joined = apiConnector.joinChannel(channelId, nodeConfig.getNodeId());
            
            if (joined) {
                joinedChannels.put(channelId, channel);
                channelHealthStatus.put(channelId, true);
                
                logger.info("✅ Successfully joined channel: " + channel.getChannelName());
                
                // Update node status
                var nodeStatus = nodeManager.getNodeStatus();
                nodeStatus.addNotification("Joined channel: " + channel.getChannelName());
                
                return true;
            } else {
                logger.warning("❌ Failed to join channel: " + channelId);
                return false;
            }
            
        } catch (Exception e) {
            logger.severe("❌ Error joining channel " + channelId + ": " + e.getMessage());
            return false;
        }
    }
    
    public boolean leaveChannel(String channelId) {
        if (!joinedChannels.containsKey(channelId)) {
            logger.warning("⚠️ Not a member of channel: " + channelId);
            return false;
        }
        
        try {
            ChannelConfig channel = joinedChannels.get(channelId);
            logger.info("👋 Leaving channel: " + channel.getChannelName() + " (" + channelId + ")");
            
            // Leave channel via API
            boolean left = apiConnector.leaveChannel(channelId, nodeManager.getNodeConfig().getNodeId());
            
            if (left) {
                joinedChannels.remove(channelId);
                channelHealthStatus.remove(channelId);
                
                logger.info("✅ Successfully left channel: " + channel.getChannelName());
                
                // Update node status
                var nodeStatus = nodeManager.getNodeStatus();
                nodeStatus.addNotification("Left channel: " + channel.getChannelName());
                
                return true;
            } else {
                logger.warning("❌ Failed to leave channel: " + channelId);
                return false;
            }
            
        } catch (Exception e) {
            logger.severe("❌ Error leaving channel " + channelId + ": " + e.getMessage());
            return false;
        }
    }
    
    private void monitorChannelHealth() {
        for (String channelId : joinedChannels.keySet()) {
            try {
                boolean healthy = apiConnector.checkChannelHealth(channelId);
                boolean wasHealthy = channelHealthStatus.getOrDefault(channelId, true);
                
                channelHealthStatus.put(channelId, healthy);
                
                if (!healthy && wasHealthy) {
                    ChannelConfig channel = joinedChannels.get(channelId);
                    logger.warning("⚠️ Channel unhealthy: " + channel.getChannelName());
                    
                    // Attempt to rejoin
                    if (channel.isAutoJoin()) {
                        logger.info("🔄 Attempting to rejoin channel: " + channelId);
                        joinChannel(channelId);
                    }
                }
                
            } catch (Exception e) {
                logger.warning("❌ Error checking health for channel " + channelId + ": " + e.getMessage());
                channelHealthStatus.put(channelId, false);
            }
        }
    }
    
    public List<ChannelConfig> getAvailableChannels() {
        return new ArrayList<>(availableChannels.values());
    }
    
    public List<ChannelConfig> getJoinedChannels() {
        return new ArrayList<>(joinedChannels.values());
    }
    
    public Map<String, Boolean> getChannelHealthStatus() {
        return new HashMap<>(channelHealthStatus);
    }
    
    public List<ChannelConfig> getChannelsByType(ChannelConfig.ChannelType type) {
        return availableChannels.values().stream()
            .filter(channel -> channel.getType() == type)
            .sorted(Comparator.comparing(ChannelConfig::getPriority).reversed())
            .toList();
    }
    
    public List<ChannelConfig> getChannelsByRegion(String region) {
        return availableChannels.values().stream()
            .filter(channel -> region.equals(channel.getRegion()))
            .sorted(Comparator.comparing(ChannelConfig::getPriority).reversed())
            .toList();
    }
    
    public boolean isChannelMember(String channelId) {
        return joinedChannels.containsKey(channelId);
    }
    
    public int getJoinedChannelCount() {
        return joinedChannels.size();
    }
    
    public String getChannelSummary() {
        return String.format("Channels: %d joined / %d available", 
            joinedChannels.size(), availableChannels.size());
    }
    
    public void shutdown() {
        if (scheduler != null) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
            }
        }
        
        logger.info("🔌 Channel Manager shutdown complete");
    }
}