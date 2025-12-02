package io.aurigraph.v11.websocket;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stream Subscription Entity (formerly WebSocketSubscription)
 *
 * Stores user subscription preferences for gRPC/HTTP2 streaming channels.
 * Migrated from WebSocket to gRPC/Protobuf/HTTP2 architecture.
 *
 * Features:
 * - User-channel mapping with priority
 * - Protocol support (GRPC, GRPC_WEB, HTTP2, SSE, WEBSOCKET_LEGACY)
 * - Stream type categorization
 * - Subscription lifecycle tracking
 * - Rate limiting per subscription
 * - Backpressure configuration
 * - Audit trail (created/updated timestamps)
 *
 * @author Claude Code Agent
 * @since V12.0.0 (Sprint 17 - gRPC Migration)
 */
@Entity
@Table(name = "stream_subscriptions", indexes = {
    @Index(name = "idx_stream_user_id", columnList = "user_id"),
    @Index(name = "idx_stream_channel", columnList = "channel"),
    @Index(name = "idx_stream_user_channel", columnList = "user_id, channel", unique = true),
    @Index(name = "idx_stream_status", columnList = "status"),
    @Index(name = "idx_stream_protocol", columnList = "protocol"),
    @Index(name = "idx_stream_type", columnList = "stream_type")
})
public class WebSocketSubscription {

    @Id
    @Column(name = "subscription_id", length = 36, nullable = false)
    public String subscriptionId;

    @Column(name = "user_id", length = 100, nullable = false)
    public String userId;

    @Column(name = "channel", length = 100, nullable = false)
    public String channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    public SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(name = "priority", nullable = false)
    public int priority = 0;

    @Column(name = "rate_limit", nullable = false)
    public int rateLimit = 100; // messages per minute

    @Column(name = "message_count", nullable = false)
    public long messageCount = 0;

    @Column(name = "last_message_at")
    public LocalDateTime lastMessageAt;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @Column(name = "expires_at")
    public LocalDateTime expiresAt;

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    // ========== gRPC/HTTP2 Specific Fields ==========

    @Enumerated(EnumType.STRING)
    @Column(name = "protocol", length = 20, nullable = false)
    public Protocol protocol = Protocol.GRPC;

    @Column(name = "stream_type", length = 50)
    public String streamType;

    @Column(name = "client_id", length = 100)
    public String clientId;

    @Column(name = "session_token", length = 500)
    public String sessionToken;

    @Column(name = "buffer_size", nullable = false)
    public int bufferSize = 50;

    @Column(name = "update_interval_ms", nullable = false)
    public int updateIntervalMs = 1000;

    @Column(name = "filters", columnDefinition = "TEXT")
    public String filters; // JSON format

    @Column(name = "last_event_id", length = 100)
    public String lastEventId;

    @Column(name = "bytes_transferred", nullable = false)
    public long bytesTransferred = 0;

    /**
     * Subscription Status
     */
    public enum SubscriptionStatus {
        ACTIVE,      // Actively receiving messages
        PAUSED,      // Temporarily paused
        SUSPENDED,   // Suspended due to rate limit violation
        EXPIRED      // Expired subscription
    }

    /**
     * Connection Protocol
     */
    public enum Protocol {
        GRPC,              // Native gRPC
        GRPC_WEB,          // gRPC-Web for browser clients
        HTTP2,             // HTTP/2 Server-Sent Events
        SSE,               // Server-Sent Events
        WEBSOCKET_LEGACY   // Legacy WebSocket (deprecated)
    }

    /**
     * Default constructor for JPA
     */
    public WebSocketSubscription() {
        this.subscriptionId = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Create new subscription
     *
     * @param userId User ID
     * @param channel Channel name
     */
    public WebSocketSubscription(String userId, String channel) {
        this();
        this.userId = userId;
        this.channel = channel;
        this.streamType = mapChannelToStreamType(channel);
    }

    /**
     * Create new subscription with priority
     *
     * @param userId User ID
     * @param channel Channel name
     * @param priority Message priority
     */
    public WebSocketSubscription(String userId, String channel, int priority) {
        this(userId, channel);
        this.priority = priority;
    }

    /**
     * Create new gRPC subscription with full configuration
     *
     * @param userId User ID
     * @param channel Channel name
     * @param protocol Connection protocol
     * @param streamType Stream type
     */
    public WebSocketSubscription(String userId, String channel, Protocol protocol, String streamType) {
        this(userId, channel);
        this.protocol = protocol;
        this.streamType = streamType;
    }

    /**
     * Map channel name to stream type
     */
    private String mapChannelToStreamType(String channel) {
        if (channel == null) return "GENERAL_STREAM";
        return switch (channel.toLowerCase()) {
            case "transactions" -> "TRANSACTION_STREAM";
            case "consensus" -> "CONSENSUS_STREAM";
            case "metrics" -> "METRICS_STREAM";
            case "network" -> "NETWORK_STREAM";
            case "validators" -> "VALIDATOR_STREAM";
            case "channels" -> "CHANNEL_STREAM";
            case "analytics" -> "ANALYTICS_STREAM";
            default -> "GENERAL_STREAM";
        };
    }

    /**
     * Update timestamp on any modification
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Increment message count
     */
    public void incrementMessageCount() {
        this.messageCount++;
        this.lastMessageAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Record bytes transferred
     */
    public void addBytesTransferred(long bytes) {
        this.bytesTransferred += bytes;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Update last event ID for resumable streams
     */
    public void updateLastEventId(String eventId) {
        this.lastEventId = eventId;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Check if subscription is active
     */
    public boolean isActive() {
        if (status != SubscriptionStatus.ACTIVE) {
            return false;
        }
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) {
            status = SubscriptionStatus.EXPIRED;
            return false;
        }
        return true;
    }

    /**
     * Check if using gRPC protocol
     */
    public boolean isGrpcProtocol() {
        return protocol == Protocol.GRPC || protocol == Protocol.GRPC_WEB;
    }

    /**
     * Pause subscription
     */
    public void pause() {
        this.status = SubscriptionStatus.PAUSED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Resume subscription
     */
    public void resume() {
        if (status == SubscriptionStatus.PAUSED || status == SubscriptionStatus.SUSPENDED) {
            this.status = SubscriptionStatus.ACTIVE;
            this.updatedAt = LocalDateTime.now();
        }
    }

    /**
     * Suspend subscription (rate limit violation)
     */
    public void suspend() {
        this.status = SubscriptionStatus.SUSPENDED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Check if rate limit is exceeded
     *
     * @param messagesInWindow Number of messages in time window
     * @return true if rate limit exceeded
     */
    public boolean isRateLimitExceeded(int messagesInWindow) {
        return messagesInWindow > rateLimit;
    }

    /**
     * Set expiration time
     *
     * @param hours Hours until expiration
     */
    public void setExpiration(int hours) {
        this.expiresAt = LocalDateTime.now().plusHours(hours);
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Configure for gRPC streaming
     */
    public void configureForGrpc(String clientId, int bufferSize, int updateIntervalMs) {
        this.protocol = Protocol.GRPC;
        this.clientId = clientId;
        this.bufferSize = bufferSize;
        this.updateIntervalMs = updateIntervalMs;
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "StreamSubscription{" +
                "subscriptionId='" + subscriptionId + '\'' +
                ", userId='" + userId + '\'' +
                ", channel='" + channel + '\'' +
                ", protocol=" + protocol +
                ", streamType='" + streamType + '\'' +
                ", status=" + status +
                ", priority=" + priority +
                ", messageCount=" + messageCount +
                ", createdAt=" + createdAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WebSocketSubscription)) return false;
        WebSocketSubscription that = (WebSocketSubscription) o;
        return subscriptionId != null && subscriptionId.equals(that.subscriptionId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
