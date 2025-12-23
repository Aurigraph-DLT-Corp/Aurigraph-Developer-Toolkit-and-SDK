package io.aurigraph.basicnode.controller;

import io.aurigraph.basicnode.model.ChannelConfig;
import io.aurigraph.basicnode.service.ChannelManager;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Channel Controller - REST API for channel management
 */
@Path("/api/channels")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ChannelController {
    
    private static final Logger logger = Logger.getLogger(ChannelController.class.getName());
    
    @Inject
    ChannelManager channelManager;
    
    /**
     * Get all available channels
     */
    @GET
    @Path("/available")
    public Response getAvailableChannels() {
        try {
            var channels = channelManager.getAvailableChannels();
            return Response.ok(Map.of(
                "channels", channels,
                "count", channels.size()
            )).build();
        } catch (Exception e) {
            logger.severe("❌ Error getting available channels: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get available channels", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get joined channels
     */
    @GET
    @Path("/joined")
    public Response getJoinedChannels() {
        try {
            var channels = channelManager.getJoinedChannels();
            var healthStatus = channelManager.getChannelHealthStatus();
            
            return Response.ok(Map.of(
                "channels", channels,
                "count", channels.size(),
                "healthStatus", healthStatus,
                "summary", channelManager.getChannelSummary()
            )).build();
        } catch (Exception e) {
            logger.severe("❌ Error getting joined channels: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get joined channels", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Join a specific channel
     */
    @POST
    @Path("/{channelId}/join")
    public Response joinChannel(@PathParam("channelId") String channelId) {
        try {
            logger.info("🔗 API request to join channel: " + channelId);
            
            if (channelManager.isChannelMember(channelId)) {
                return Response.status(409)
                    .entity(Map.of("error", "Already a member of channel", "channelId", channelId))
                    .build();
            }
            
            boolean joined = channelManager.joinChannel(channelId);
            
            if (joined) {
                return Response.ok(Map.of(
                    "message", "Successfully joined channel",
                    "channelId", channelId,
                    "status", "joined"
                )).build();
            } else {
                return Response.status(400)
                    .entity(Map.of("error", "Failed to join channel", "channelId", channelId))
                    .build();
            }
            
        } catch (Exception e) {
            logger.severe("❌ Error joining channel " + channelId + ": " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Join channel failed", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Leave a specific channel
     */
    @DELETE
    @Path("/{channelId}/leave")
    public Response leaveChannel(@PathParam("channelId") String channelId) {
        try {
            logger.info("👋 API request to leave channel: " + channelId);
            
            if (!channelManager.isChannelMember(channelId)) {
                return Response.status(404)
                    .entity(Map.of("error", "Not a member of channel", "channelId", channelId))
                    .build();
            }
            
            boolean left = channelManager.leaveChannel(channelId);
            
            if (left) {
                return Response.ok(Map.of(
                    "message", "Successfully left channel",
                    "channelId", channelId,
                    "status", "left"
                )).build();
            } else {
                return Response.status(400)
                    .entity(Map.of("error", "Failed to leave channel", "channelId", channelId))
                    .build();
            }
            
        } catch (Exception e) {
            logger.severe("❌ Error leaving channel " + channelId + ": " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Leave channel failed", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get channels by type
     */
    @GET
    @Path("/type/{type}")
    public Response getChannelsByType(@PathParam("type") String type) {
        try {
            ChannelConfig.ChannelType channelType = ChannelConfig.ChannelType.valueOf(type.toUpperCase());
            var channels = channelManager.getChannelsByType(channelType);
            
            return Response.ok(Map.of(
                "channels", channels,
                "type", type,
                "count", channels.size()
            )).build();
            
        } catch (IllegalArgumentException e) {
            return Response.status(400)
                .entity(Map.of("error", "Invalid channel type", "type", type))
                .build();
        } catch (Exception e) {
            logger.severe("❌ Error getting channels by type: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get channels by type", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get channels by region
     */
    @GET
    @Path("/region/{region}")
    public Response getChannelsByRegion(@PathParam("region") String region) {
        try {
            var channels = channelManager.getChannelsByRegion(region);
            
            return Response.ok(Map.of(
                "channels", channels,
                "region", region,
                "count", channels.size()
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error getting channels by region: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get channels by region", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get channel health status
     */
    @GET
    @Path("/health")
    public Response getChannelHealth() {
        try {
            var healthStatus = channelManager.getChannelHealthStatus();
            var joinedChannels = channelManager.getJoinedChannels();
            
            int healthyCount = (int) healthStatus.values().stream().mapToInt(healthy -> healthy ? 1 : 0).sum();
            int totalCount = joinedChannels.size();
            
            return Response.ok(Map.of(
                "healthStatus", healthStatus,
                "summary", Map.of(
                    "healthy", healthyCount,
                    "total", totalCount,
                    "percentage", totalCount > 0 ? (healthyCount * 100.0 / totalCount) : 0
                )
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error getting channel health: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get channel health", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Refresh channel discovery
     */
    @POST
    @Path("/refresh")
    public Response refreshChannels() {
        try {
            logger.info("🔄 Manual channel discovery refresh requested");
            channelManager.discoverAvailableChannels();
            
            return Response.ok(Map.of(
                "message", "Channel discovery refreshed",
                "availableChannels", channelManager.getAvailableChannels().size(),
                "joinedChannels", channelManager.getJoinedChannels().size()
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error refreshing channels: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to refresh channels", "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get channel summary
     */
    @GET
    @Path("/summary")
    public Response getChannelSummary() {
        try {
            var availableChannels = channelManager.getAvailableChannels();
            var joinedChannels = channelManager.getJoinedChannels();
            var healthStatus = channelManager.getChannelHealthStatus();
            
            // Group channels by type
            Map<ChannelConfig.ChannelType, Long> channelsByType = availableChannels.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    ChannelConfig::getType,
                    java.util.stream.Collectors.counting()
                ));
            
            return Response.ok(Map.of(
                "summary", channelManager.getChannelSummary(),
                "available", availableChannels.size(),
                "joined", joinedChannels.size(),
                "healthy", healthStatus.values().stream().mapToInt(h -> h ? 1 : 0).sum(),
                "byType", channelsByType
            )).build();
            
        } catch (Exception e) {
            logger.severe("❌ Error getting channel summary: " + e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to get channel summary", "message", e.getMessage()))
                .build();
        }
    }
}