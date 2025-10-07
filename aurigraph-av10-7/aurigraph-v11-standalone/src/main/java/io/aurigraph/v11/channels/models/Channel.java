package io.aurigraph.v11.channels.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Channel Entity
 *
 * Represents a communication channel for multi-party messaging.
 * Supports real-time messaging, member management, and message history.
 *
 * @version 3.8.0 (Phase 2 Day 11)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "channels", indexes = {
    @Index(name = "idx_channel_id", columnList = "channelId", unique = true),
    @Index(name = "idx_channel_type", columnList = "channelType"),
    @Index(name = "idx_channel_owner", columnList = "ownerAddress"),
    @Index(name = "idx_channel_status", columnList = "status"),
    @Index(name = "idx_channel_created_at", columnList = "createdAt")
})
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "channelId", nullable = false, unique = true, length = 66)
    private String channelId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "channelType", nullable = false, length = 30)
    private ChannelType channelType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ChannelStatus status;

    @Column(name = "ownerAddress", nullable = false, length = 66)
    private String ownerAddress;

    // Channel configuration
    @Column(name = "isPublic", nullable = false)
    private Boolean isPublic = false;

    @Column(name = "isEncrypted", nullable = false)
    private Boolean isEncrypted = false;

    @Column(name = "maxMembers", nullable = false)
    private Integer maxMembers = 100;

    @Column(name = "allowGuestAccess", nullable = false)
    private Boolean allowGuestAccess = false;

    // Timestamps
    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "updatedAt")
    private Instant updatedAt;

    @Column(name = "lastMessageAt")
    private Instant lastMessageAt;

    @Column(name = "closedAt")
    private Instant closedAt;

    // Statistics
    @Column(name = "memberCount", nullable = false)
    private Integer memberCount = 0;

    @Column(name = "messageCount", nullable = false)
    private Long messageCount = 0L;

    @Column(name = "activeMembers", nullable = false)
    private Integer activeMembers = 0;

    // Metadata
    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "topic", length = 500)
    private String topic;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @ElementCollection
    @CollectionTable(name = "channel_tags", joinColumns = @JoinColumn(name = "channel_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    // ==================== CONSTRUCTORS ====================

    public Channel() {
        this.createdAt = Instant.now();
        this.status = ChannelStatus.ACTIVE;
        this.memberCount = 0;
        this.messageCount = 0L;
        this.activeMembers = 0;
    }

    public Channel(String channelId, String name, String ownerAddress, ChannelType channelType) {
        this();
        this.channelId = channelId;
        this.name = name;
        this.ownerAddress = ownerAddress;
        this.channelType = channelType;
    }

    // ==================== LIFECYCLE METHODS ====================

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Close the channel
     */
    public void close() {
        if (status == ChannelStatus.CLOSED) {
            throw new IllegalStateException("Channel is already closed");
        }
        this.status = ChannelStatus.CLOSED;
        this.closedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Archive the channel
     */
    public void archive() {
        if (status == ChannelStatus.CLOSED) {
            throw new IllegalStateException("Cannot archive a closed channel");
        }
        this.status = ChannelStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }

    /**
     * Reactivate an archived channel
     */
    public void reactivate() {
        if (status != ChannelStatus.ARCHIVED) {
            throw new IllegalStateException("Only archived channels can be reactivated");
        }
        this.status = ChannelStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }

    /**
     * Record a new message
     */
    public void recordMessage() {
        this.messageCount++;
        this.lastMessageAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Update member count
     */
    public void updateMemberCount(int count) {
        this.memberCount = count;
        this.updatedAt = Instant.now();
    }

    /**
     * Update active member count
     */
    public void updateActiveMembers(int count) {
        this.activeMembers = count;
        this.updatedAt = Instant.now();
    }

    /**
     * Check if channel is full
     */
    public boolean isFull() {
        return memberCount >= maxMembers;
    }

    /**
     * Check if channel is active
     */
    public boolean isActive() {
        return status == ChannelStatus.ACTIVE;
    }

    /**
     * Add tag
     */
    public void addTag(String tag) {
        if (!this.tags.contains(tag)) {
            this.tags.add(tag);
        }
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getChannelId() { return channelId; }
    public void setChannelId(String channelId) { this.channelId = channelId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ChannelType getChannelType() { return channelType; }
    public void setChannelType(ChannelType channelType) { this.channelType = channelType; }

    public ChannelStatus getStatus() { return status; }
    public void setStatus(ChannelStatus status) { this.status = status; }

    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public Boolean getIsEncrypted() { return isEncrypted; }
    public void setIsEncrypted(Boolean isEncrypted) { this.isEncrypted = isEncrypted; }

    public Integer getMaxMembers() { return maxMembers; }
    public void setMaxMembers(Integer maxMembers) { this.maxMembers = maxMembers; }

    public Boolean getAllowGuestAccess() { return allowGuestAccess; }
    public void setAllowGuestAccess(Boolean allowGuestAccess) { this.allowGuestAccess = allowGuestAccess; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public Integer getMemberCount() { return memberCount; }
    public void setMemberCount(Integer memberCount) { this.memberCount = memberCount; }

    public Long getMessageCount() { return messageCount; }
    public void setMessageCount(Long messageCount) { this.messageCount = messageCount; }

    public Integer getActiveMembers() { return activeMembers; }
    public void setActiveMembers(Integer activeMembers) { this.activeMembers = activeMembers; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    // ==================== ENUM DEFINITIONS ====================

    public enum ChannelType {
        PUBLIC,         // Public channel, anyone can join
        PRIVATE,        // Private channel, invite only
        DIRECT,         // Direct message channel (1-on-1)
        GROUP,          // Group channel (multiple members)
        BROADCAST,      // Broadcast channel (one-to-many)
        SUPPORT,        // Customer support channel
        NOTIFICATION    // Notification channel (read-only for members)
    }

    public enum ChannelStatus {
        ACTIVE,         // Channel is active
        ARCHIVED,       // Channel is archived but can be reactivated
        CLOSED          // Channel is permanently closed
    }

    @Override
    public String toString() {
        return String.format("Channel{id=%d, channelId='%s', name='%s', type=%s, status=%s, members=%d}",
                id, channelId, name, channelType, status, memberCount);
    }
}
