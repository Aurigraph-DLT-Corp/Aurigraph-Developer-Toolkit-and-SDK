package io.aurigraph.v11.channels.models;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Channel Member Entity
 *
 * Represents a member's participation in a channel.
 * Tracks membership status, role, and activity.
 *
 * @version 3.8.0 (Phase 2 Day 11)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "channel_members", indexes = {
    @Index(name = "idx_member_channel_address", columnList = "channelId, memberAddress", unique = true),
    @Index(name = "idx_member_channel", columnList = "channelId"),
    @Index(name = "idx_member_address", columnList = "memberAddress"),
    @Index(name = "idx_member_status", columnList = "status"),
    @Index(name = "idx_member_joined_at", columnList = "joinedAt")
})
public class ChannelMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "channelId", nullable = false, length = 66)
    private String channelId;

    @Column(name = "memberAddress", nullable = false, length = 66)
    private String memberAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private MemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private MemberStatus status;

    // Permissions
    @Column(name = "canPost", nullable = false)
    private Boolean canPost = true;

    @Column(name = "canRead", nullable = false)
    private Boolean canRead = true;

    @Column(name = "canInvite", nullable = false)
    private Boolean canInvite = false;

    @Column(name = "canManage", nullable = false)
    private Boolean canManage = false;

    // Activity tracking
    @Column(name = "lastActiveAt")
    private Instant lastActiveAt;

    @Column(name = "lastReadMessageId", length = 66)
    private String lastReadMessageId;

    @Column(name = "unreadCount", nullable = false)
    private Integer unreadCount = 0;

    // Timestamps
    @Column(name = "joinedAt", nullable = false)
    private Instant joinedAt;

    @Column(name = "leftAt")
    private Instant leftAt;

    @Column(name = "invitedBy", length = 66)
    private String invitedBy;

    @Column(name = "invitedAt")
    private Instant invitedAt;

    @Column(name = "updatedAt")
    private Instant updatedAt;

    // Notifications
    @Column(name = "notificationsEnabled", nullable = false)
    private Boolean notificationsEnabled = true;

    @Column(name = "mutedUntil")
    private Instant mutedUntil;

    // Metadata
    @Column(name = "nickname", length = 255)
    private String nickname;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // ==================== CONSTRUCTORS ====================

    public ChannelMember() {
        this.joinedAt = Instant.now();
        this.role = MemberRole.MEMBER;
        this.status = MemberStatus.ACTIVE;
        this.canPost = true;
        this.canRead = true;
        this.canInvite = false;
        this.canManage = false;
        this.unreadCount = 0;
        this.notificationsEnabled = true;
    }

    public ChannelMember(String channelId, String memberAddress, MemberRole role) {
        this();
        this.channelId = channelId;
        this.memberAddress = memberAddress;
        this.role = role;

        // Set permissions based on role
        if (role == MemberRole.OWNER || role == MemberRole.ADMIN) {
            this.canInvite = true;
            this.canManage = true;
        } else if (role == MemberRole.MODERATOR) {
            this.canInvite = true;
        }
    }

    // ==================== LIFECYCLE METHODS ====================

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Update last active timestamp
     */
    public void updateActivity() {
        this.lastActiveAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Mark message as read
     */
    public void markAsRead(String messageId) {
        this.lastReadMessageId = messageId;
        this.unreadCount = 0;
        this.lastActiveAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Increment unread count
     */
    public void incrementUnreadCount() {
        this.unreadCount++;
        this.updatedAt = Instant.now();
    }

    /**
     * Leave channel
     */
    public void leave() {
        if (status == MemberStatus.LEFT) {
            throw new IllegalStateException("Member has already left");
        }
        this.status = MemberStatus.LEFT;
        this.leftAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Ban member
     */
    public void ban() {
        if (status == MemberStatus.BANNED) {
            throw new IllegalStateException("Member is already banned");
        }
        this.status = MemberStatus.BANNED;
        this.leftAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Mute member
     */
    public void mute(long durationSeconds) {
        this.mutedUntil = Instant.now().plusSeconds(durationSeconds);
        this.updatedAt = Instant.now();
    }

    /**
     * Unmute member
     */
    public void unmute() {
        this.mutedUntil = null;
        this.updatedAt = Instant.now();
    }

    /**
     * Check if member is muted
     */
    public boolean isMuted() {
        return mutedUntil != null && Instant.now().isBefore(mutedUntil);
    }

    /**
     * Check if member is active
     */
    public boolean isActive() {
        return status == MemberStatus.ACTIVE;
    }

    /**
     * Promote member to higher role
     */
    public void promote() {
        switch (role) {
            case MEMBER -> {
                this.role = MemberRole.MODERATOR;
                this.canInvite = true;
            }
            case MODERATOR -> {
                this.role = MemberRole.ADMIN;
                this.canManage = true;
            }
            case ADMIN -> this.role = MemberRole.OWNER;
            default -> throw new IllegalStateException("Cannot promote " + role);
        }
        this.updatedAt = Instant.now();
    }

    /**
     * Demote member to lower role
     */
    public void demote() {
        switch (role) {
            case OWNER -> {
                this.role = MemberRole.ADMIN;
            }
            case ADMIN -> {
                this.role = MemberRole.MODERATOR;
                this.canManage = false;
            }
            case MODERATOR -> {
                this.role = MemberRole.MEMBER;
                this.canInvite = false;
            }
            default -> throw new IllegalStateException("Cannot demote " + role);
        }
        this.updatedAt = Instant.now();
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getChannelId() { return channelId; }
    public void setChannelId(String channelId) { this.channelId = channelId; }

    public String getMemberAddress() { return memberAddress; }
    public void setMemberAddress(String memberAddress) { this.memberAddress = memberAddress; }

    public MemberRole getRole() { return role; }
    public void setRole(MemberRole role) { this.role = role; }

    public MemberStatus getStatus() { return status; }
    public void setStatus(MemberStatus status) { this.status = status; }

    public Boolean getCanPost() { return canPost; }
    public void setCanPost(Boolean canPost) { this.canPost = canPost; }

    public Boolean getCanRead() { return canRead; }
    public void setCanRead(Boolean canRead) { this.canRead = canRead; }

    public Boolean getCanInvite() { return canInvite; }
    public void setCanInvite(Boolean canInvite) { this.canInvite = canInvite; }

    public Boolean getCanManage() { return canManage; }
    public void setCanManage(Boolean canManage) { this.canManage = canManage; }

    public Instant getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(Instant lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public String getLastReadMessageId() { return lastReadMessageId; }
    public void setLastReadMessageId(String lastReadMessageId) { this.lastReadMessageId = lastReadMessageId; }

    public Integer getUnreadCount() { return unreadCount; }
    public void setUnreadCount(Integer unreadCount) { this.unreadCount = unreadCount; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public Instant getLeftAt() { return leftAt; }
    public void setLeftAt(Instant leftAt) { this.leftAt = leftAt; }

    public String getInvitedBy() { return invitedBy; }
    public void setInvitedBy(String invitedBy) { this.invitedBy = invitedBy; }

    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(Boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }

    public Instant getMutedUntil() { return mutedUntil; }
    public void setMutedUntil(Instant mutedUntil) { this.mutedUntil = mutedUntil; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    // ==================== ENUM DEFINITIONS ====================

    public enum MemberRole {
        OWNER,          // Channel owner (full permissions)
        ADMIN,          // Administrator (manage members, settings)
        MODERATOR,      // Moderator (invite members, moderate content)
        MEMBER,         // Regular member
        GUEST           // Guest (limited permissions)
    }

    public enum MemberStatus {
        ACTIVE,         // Active member
        INACTIVE,       // Inactive but still member
        LEFT,           // Left the channel
        BANNED,         // Banned from channel
        INVITED         // Invited but not yet joined
    }

    @Override
    public String toString() {
        return String.format("ChannelMember{id=%d, channelId='%s', member='%s', role=%s, status=%s}",
                id, channelId, memberAddress, role, status);
    }
}
