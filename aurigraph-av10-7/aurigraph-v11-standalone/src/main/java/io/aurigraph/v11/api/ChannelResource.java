package io.aurigraph.v11.api;

import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;

/**
 * Channel Management API Resource
 *
 * REST API for real-time communication channels:
 * - Channel creation and management
 * - Real-time messaging
 * - Member management
 * - Channel metrics and analytics
 *
 * Security: @PermitAll to allow public access for demo purposes
 *
 * @version 11.0.0 (Priority #3 - Backend Development Agent)
 * @author Aurigraph V11 Development Team
 */
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Channel Management", description = "Real-time communication channel operations")
@PermitAll
public class ChannelResource {

    private static final Logger LOG = Logger.getLogger(ChannelResource.class);

    // In-memory storage for demo (will be replaced with ChannelManagementService + LevelDB)
    private static final Map<String, Map<String, Object>> CHANNELS = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, List<Map<String, Object>>> CHANNEL_MESSAGES = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, List<Map<String, Object>>> CHANNEL_MEMBERS = new java.util.concurrent.ConcurrentHashMap<>();

    // Static default channels for v11 API (frontend compatibility)
    private static final Map<String, NetworkChannel> NETWORK_CHANNELS = new java.util.concurrent.ConcurrentHashMap<>();

    static {
        initializeNetworkChannels();
    }

    private static void initializeNetworkChannels() {
        // Main Network
        NetworkChannel main = new NetworkChannel();
        main.id = "main";
        main.name = "Main Network";
        main.type = "public";
        main.status = "active";
        main.config = new NetworkChannelConfig("hyperraft", 10000, 2, 500, 1.0, 100, 2000000, "public", "ANY",
                new NetworkCryptoConfig("CRYSTALS-Dilithium", 256, true));
        main.metrics = new NetworkChannelMetrics(776000, 15234567, 98765, 12, 850000, 25, 42, 524288000);
        main.createdAt = "2024-01-01T00:00:00.000Z";
        main.updatedAt = Instant.now().toString();
        NETWORK_CHANNELS.put(main.id, main);

        // Enterprise Private
        NetworkChannel priv = new NetworkChannel();
        priv.id = "private-1";
        priv.name = "Enterprise Private";
        priv.type = "private";
        priv.status = "active";
        priv.config = new NetworkChannelConfig("pbft", 5000, 1, 100, 0.5, 10, 100000, "confidential", "MAJORITY",
                new NetworkCryptoConfig("CRYSTALS-Kyber", 512, true));
        priv.metrics = new NetworkChannelMetrics(85000, 523456, 12345, 8, 95000, 7, 15, 104857600);
        priv.createdAt = "2024-02-01T00:00:00.000Z";
        priv.updatedAt = Instant.now().toString();
        NETWORK_CHANNELS.put(priv.id, priv);

        // Supply Chain Consortium
        NetworkChannel cons = new NetworkChannel();
        cons.id = "consortium-1";
        cons.name = "Supply Chain Consortium";
        cons.type = "consortium";
        cons.status = "active";
        cons.config = new NetworkChannelConfig("raft", 2000, 3, 200, 2.0, 50, 50000, "private", "AND(Org1.member, Org2.member)",
                new NetworkCryptoConfig("Ed25519", 256, false));
        cons.metrics = new NetworkChannelMetrics(35000, 234567, 8765, 15, 40000, 12, 8, 78643200);
        cons.createdAt = "2024-03-01T00:00:00.000Z";
        cons.updatedAt = Instant.now().toString();
        NETWORK_CHANNELS.put(cons.id, cons);
    }

    // ==================== V11 API (Frontend Compatible) ====================

    /**
     * V11 API - List all network channels as array
     * GET /api/v11/channels
     * Returns array format for frontend ChannelService.ts compatibility
     */
    @GET
    @Path("/v11/channels")
    @Operation(summary = "List network channels (v11)", description = "Returns array of channels for frontend")
    public List<NetworkChannel> listNetworkChannels() {
        LOG.info("V11 API: Listing network channels");

        // Update metrics with slight variation for realism
        NETWORK_CHANNELS.values().forEach(ch -> {
            ch.metrics.tps = (int) (ch.metrics.tps + (Math.random() - 0.5) * 1000);
            ch.metrics.totalTransactions += (int) (Math.random() * 100);
            if (Math.random() > 0.9) ch.metrics.blockHeight++;
            ch.updatedAt = Instant.now().toString();
        });

        return new ArrayList<>(NETWORK_CHANNELS.values());
    }

    /**
     * V11 API - Get single network channel
     * GET /api/v11/channels/{id}
     */
    @GET
    @Path("/v11/channels/{id}")
    @Operation(summary = "Get network channel (v11)", description = "Get channel by ID")
    public Response getNetworkChannel(@PathParam("id") String id) {
        LOG.infof("V11 API: Getting channel: %s", id);
        NetworkChannel channel = NETWORK_CHANNELS.get(id);
        if (channel == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Channel not found: " + id))
                    .build();
        }
        return Response.ok(channel).build();
    }

    /**
     * V11 API - Get channel metrics
     * GET /api/v11/channels/{id}/metrics
     */
    @GET
    @Path("/v11/channels/{id}/metrics")
    @Operation(summary = "Get channel metrics (v11)", description = "Get metrics for a channel")
    public Response getNetworkChannelMetrics(@PathParam("id") String id) {
        LOG.infof("V11 API: Getting metrics for channel: %s", id);
        NetworkChannel channel = NETWORK_CHANNELS.get(id);
        if (channel == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Channel not found: " + id))
                    .build();
        }
        return Response.ok(channel.metrics).build();
    }

    // ==================== V12 CHANNEL OPERATIONS ====================

    /**
     * List all channels with pagination
     * GET /api/v12/channels
     */
    @GET
    @Path("/v12/channels")
    @Operation(summary = "List channels", description = "Retrieve list of channels with pagination")
    public Uni<Response> listChannels(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("type") String channelType,
            @QueryParam("status") String status
    ) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Listing channels: page=%d, size=%d, type=%s, status=%s",
                    page, size, channelType, status);

            List<Map<String, Object>> channels = new ArrayList<>(CHANNELS.values());

            // Apply filters
            if (channelType != null) {
                channels = channels.stream()
                        .filter(c -> channelType.equals(c.get("channelType")))
                        .toList();
            }
            if (status != null) {
                channels = channels.stream()
                        .filter(c -> status.equals(c.get("status")))
                        .toList();
            }

            // Pagination
            int start = page * size;
            int end = Math.min(start + size, channels.size());
            List<Map<String, Object>> paginatedChannels = start < channels.size() ?
                    channels.subList(start, end) : List.of();

            Map<String, Object> response = new HashMap<>();
            response.put("channels", paginatedChannels);
            response.put("page", page);
            response.put("size", size);
            response.put("totalChannels", channels.size());
            response.put("totalPages", (channels.size() + size - 1) / size);

            return Response.ok(response).build();
        });
    }

    /**
     * Get channel details
     * GET /api/v12/channels/{id}
     */
    @GET
    @Path("/v12/channels/{id}")
    @Operation(summary = "Get channel", description = "Get detailed information about a specific channel")
    public Uni<Response> getChannel(@PathParam("id") String channelId) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Getting channel: %s", channelId);

            Map<String, Object> channel = CHANNELS.get(channelId);
            if (channel == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            // Add member and message counts
            Map<String, Object> enrichedChannel = new HashMap<>(channel);
            enrichedChannel.put("memberCount", CHANNEL_MEMBERS.getOrDefault(channelId, List.of()).size());
            enrichedChannel.put("messageCount", CHANNEL_MESSAGES.getOrDefault(channelId, List.of()).size());

            return Response.ok(enrichedChannel).build();
        });
    }

    /**
     * Create new channel
     * POST /api/v12/channels
     */
    @POST
    @Path("/v12/channels")
    @Operation(summary = "Create channel", description = "Create a new communication channel")
    public Uni<Response> createChannel(ChannelCreateRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Creating channel: %s", request.name);

            String channelId = "CH_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

            Map<String, Object> channel = new HashMap<>();
            channel.put("channelId", channelId);
            channel.put("name", request.name);
            channel.put("channelType", request.channelType != null ? request.channelType : "GROUP");
            channel.put("ownerAddress", request.ownerAddress);
            channel.put("description", request.description);
            channel.put("topic", request.topic);
            channel.put("isPublic", request.isPublic != null ? request.isPublic : false);
            channel.put("isEncrypted", request.isEncrypted != null ? request.isEncrypted : false);
            channel.put("maxMembers", request.maxMembers != null ? request.maxMembers : 100);
            channel.put("status", "ACTIVE");
            channel.put("createdAt", Instant.now().toString());
            channel.put("memberCount", 1);
            channel.put("messageCount", 0);

            CHANNELS.put(channelId, channel);

            // Add owner as first member
            List<Map<String, Object>> members = new ArrayList<>();
            Map<String, Object> ownerMember = new HashMap<>();
            ownerMember.put("channelId", channelId);
            ownerMember.put("memberAddress", request.ownerAddress);
            ownerMember.put("role", "OWNER");
            ownerMember.put("status", "ACTIVE");
            ownerMember.put("joinedAt", Instant.now().toString());
            members.add(ownerMember);
            CHANNEL_MEMBERS.put(channelId, members);

            // Initialize empty message list
            CHANNEL_MESSAGES.put(channelId, new ArrayList<>());

            return Response.status(Response.Status.CREATED).entity(channel).build();
        });
    }

    /**
     * Close a channel
     * DELETE /api/v12/channels/{id}
     */
    @DELETE
    @Path("/v12/channels/{id}")
    @Operation(summary = "Close channel", description = "Close or archive a channel")
    public Uni<Response> closeChannel(
            @PathParam("id") String channelId,
            @QueryParam("closedBy") String closedBy
    ) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Closing channel: %s by %s", channelId, closedBy);

            Map<String, Object> channel = CHANNELS.get(channelId);
            if (channel == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            channel.put("status", "CLOSED");
            channel.put("closedAt", Instant.now().toString());
            channel.put("closedBy", closedBy);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("channelId", channelId);
            result.put("operation", "CLOSED");
            result.put("message", "Channel closed successfully");
            result.put("timestamp", Instant.now().toString());

            return Response.ok(result).build();
        });
    }

    // ==================== MESSAGING OPERATIONS ====================

    /**
     * Send message to channel
     * POST /api/v12/channels/{id}/messages
     */
    @POST
    @Path("/v12/channels/{id}/messages")
    @Operation(summary = "Send message", description = "Send a message to a channel")
    public Uni<Response> sendMessage(
            @PathParam("id") String channelId,
            MessageSendRequest request
    ) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Sending message to channel %s from %s", channelId, request.senderAddress);

            Map<String, Object> channel = CHANNELS.get(channelId);
            if (channel == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            String messageId = "MSG_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

            Map<String, Object> message = new HashMap<>();
            message.put("messageId", messageId);
            message.put("channelId", channelId);
            message.put("senderAddress", request.senderAddress);
            message.put("content", request.content);
            message.put("messageType", request.messageType != null ? request.messageType : "TEXT");
            message.put("status", "SENT");
            message.put("createdAt", Instant.now().toString());

            List<Map<String, Object>> messages = CHANNEL_MESSAGES.get(channelId);
            messages.add(message);

            // Update channel message count
            channel.put("messageCount", messages.size());
            channel.put("lastMessageAt", Instant.now().toString());

            return Response.status(Response.Status.CREATED).entity(message).build();
        });
    }

    /**
     * Get messages from channel
     * GET /api/v12/channels/{id}/messages
     */
    @GET
    @Path("/v12/channels/{id}/messages")
    @Operation(summary = "Get messages", description = "Retrieve messages from a channel")
    public Uni<Response> getMessages(
            @PathParam("id") String channelId,
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("before") String before
    ) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Getting messages from channel: %s (limit=%d)", channelId, limit);

            if (!CHANNELS.containsKey(channelId)) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            List<Map<String, Object>> messages = CHANNEL_MESSAGES.getOrDefault(channelId, List.of());
            List<Map<String, Object>> limitedMessages = messages.stream()
                    .limit(limit)
                    .toList();

            Map<String, Object> response = new HashMap<>();
            response.put("channelId", channelId);
            response.put("messages", limitedMessages);
            response.put("count", limitedMessages.size());
            response.put("totalMessages", messages.size());

            return Response.ok(response).build();
        });
    }

    // ==================== MEMBER OPERATIONS ====================

    /**
     * Get channel members
     * GET /api/v12/channels/{id}/members
     */
    @GET
    @Path("/v12/channels/{id}/members")
    @Operation(summary = "Get members", description = "Get list of channel members")
    public Uni<Response> getMembers(@PathParam("id") String channelId) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Getting members for channel: %s", channelId);

            if (!CHANNELS.containsKey(channelId)) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            List<Map<String, Object>> members = CHANNEL_MEMBERS.getOrDefault(channelId, List.of());

            Map<String, Object> response = new HashMap<>();
            response.put("channelId", channelId);
            response.put("members", members);
            response.put("totalMembers", members.size());
            response.put("activeMembers", members.stream()
                    .filter(m -> "ACTIVE".equals(m.get("status")))
                    .count());

            return Response.ok(response).build();
        });
    }

    /**
     * Join channel
     * POST /api/v12/channels/{id}/join
     */
    @POST
    @Path("/v12/channels/{id}/join")
    @Operation(summary = "Join channel", description = "Join a public channel or accept invitation")
    public Uni<Response> joinChannel(
            @PathParam("id") String channelId,
            @QueryParam("memberAddress") String memberAddress
    ) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Member %s joining channel %s", memberAddress, channelId);

            Map<String, Object> channel = CHANNELS.get(channelId);
            if (channel == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            List<Map<String, Object>> members = CHANNEL_MEMBERS.get(channelId);
            boolean alreadyMember = members.stream()
                    .anyMatch(m -> memberAddress.equals(m.get("memberAddress")));

            if (alreadyMember) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of("error", "Already a member of this channel"))
                        .build();
            }

            Map<String, Object> member = new HashMap<>();
            member.put("channelId", channelId);
            member.put("memberAddress", memberAddress);
            member.put("role", "MEMBER");
            member.put("status", "ACTIVE");
            member.put("joinedAt", Instant.now().toString());
            members.add(member);

            // Update channel member count
            channel.put("memberCount", members.size());

            return Response.status(Response.Status.CREATED).entity(member).build();
        });
    }

    // ==================== METRICS OPERATIONS ====================

    /**
     * Get channel metrics
     * GET /api/v12/channels/{id}/metrics
     */
    @GET
    @Path("/v12/channels/{id}/metrics")
    @Operation(summary = "Get channel metrics", description = "Get performance metrics and statistics for a channel")
    public Uni<Response> getChannelMetrics(@PathParam("id") String channelId) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Getting metrics for channel: %s", channelId);

            Map<String, Object> channel = CHANNELS.get(channelId);
            if (channel == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Channel not found: " + channelId))
                        .build();
            }

            List<Map<String, Object>> members = CHANNEL_MEMBERS.getOrDefault(channelId, List.of());
            List<Map<String, Object>> messages = CHANNEL_MESSAGES.getOrDefault(channelId, List.of());

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("channelId", channelId);
            metrics.put("name", channel.get("name"));
            metrics.put("status", channel.get("status"));
            metrics.put("totalMembers", members.size());
            metrics.put("activeMembers", members.stream()
                    .filter(m -> "ACTIVE".equals(m.get("status")))
                    .count());
            metrics.put("totalMessages", messages.size());
            metrics.put("messagesLast24h", messages.stream()
                    .filter(m -> {
                        Instant msgTime = Instant.parse((String) m.get("createdAt"));
                        return msgTime.isAfter(Instant.now().minusSeconds(86400));
                    })
                    .count());
            metrics.put("averageMessagesPerDay", messages.size());
            metrics.put("createdAt", channel.get("createdAt"));
            metrics.put("lastMessageAt", channel.get("lastMessageAt"));

            return Response.ok(metrics).build();
        });
    }

    // ==================== DATA MODELS ====================

    public static class ChannelCreateRequest {
        public String name;
        public String channelType;
        public String ownerAddress;
        public String description;
        public String topic;
        public Boolean isPublic;
        public Boolean isEncrypted;
        public Integer maxMembers;
    }

    public static class MessageSendRequest {
        public String senderAddress;
        public String content;
        public String messageType;
        public String threadId;
        public String replyToMessageId;
    }

    // ==================== V11 NETWORK CHANNEL DTOs ====================

    public static class NetworkChannel {
        public String id;
        public String name;
        public String type;
        public String status;
        public NetworkChannelConfig config;
        public NetworkChannelMetrics metrics;
        public String createdAt;
        public String updatedAt;
    }

    public static class NetworkChannelConfig {
        public String consensusType;
        public int blockSize;
        public int blockTimeout;
        public int maxMessageCount;
        public double batchTimeout;
        public int maxChannels;
        public int targetTps;
        public String privacyLevel;
        public String endorsementPolicy;
        public NetworkCryptoConfig cryptoConfig;

        public NetworkChannelConfig() {}

        public NetworkChannelConfig(String consensusType, int blockSize, int blockTimeout, int maxMessageCount,
                                    double batchTimeout, int maxChannels, int targetTps, String privacyLevel,
                                    String endorsementPolicy, NetworkCryptoConfig cryptoConfig) {
            this.consensusType = consensusType;
            this.blockSize = blockSize;
            this.blockTimeout = blockTimeout;
            this.maxMessageCount = maxMessageCount;
            this.batchTimeout = batchTimeout;
            this.maxChannels = maxChannels;
            this.targetTps = targetTps;
            this.privacyLevel = privacyLevel;
            this.endorsementPolicy = endorsementPolicy;
            this.cryptoConfig = cryptoConfig;
        }
    }

    public static class NetworkCryptoConfig {
        public String algorithm;
        public int keySize;
        public boolean quantumResistant;

        public NetworkCryptoConfig() {}

        public NetworkCryptoConfig(String algorithm, int keySize, boolean quantumResistant) {
            this.algorithm = algorithm;
            this.keySize = keySize;
            this.quantumResistant = quantumResistant;
        }
    }

    public static class NetworkChannelMetrics {
        public int tps;
        public long totalTransactions;
        public long blockHeight;
        public int latency;
        public int throughput;
        public int nodeCount;
        public int activeContracts;
        public long storageUsed;

        public NetworkChannelMetrics() {}

        public NetworkChannelMetrics(int tps, long totalTransactions, long blockHeight, int latency,
                                     int throughput, int nodeCount, int activeContracts, long storageUsed) {
            this.tps = tps;
            this.totalTransactions = totalTransactions;
            this.blockHeight = blockHeight;
            this.latency = latency;
            this.throughput = throughput;
            this.nodeCount = nodeCount;
            this.activeContracts = activeContracts;
            this.storageUsed = storageUsed;
        }
    }
}
