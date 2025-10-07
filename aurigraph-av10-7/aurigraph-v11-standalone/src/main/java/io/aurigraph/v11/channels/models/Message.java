package io.aurigraph.v11.channels.models;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Message Entity
 *
 * Represents a message in a channel.
 * Supports text, attachments, reactions, and threading.
 *
 * @version 3.8.0 (Phase 2 Day 11)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_message_id", columnList = "messageId", unique = true),
    @Index(name = "idx_message_channel", columnList = "channelId"),
    @Index(name = "idx_message_sender", columnList = "senderAddress"),
    @Index(name = "idx_message_created_at", columnList = "createdAt"),
    @Index(name = "idx_message_thread", columnList = "threadId")
})
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "messageId", nullable = false, unique = true, length = 66)
    private String messageId;

    @Column(name = "channelId", nullable = false, length = 66)
    private String channelId;

    @Column(name = "senderAddress", nullable = false, length = 66)
    private String senderAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "messageType", nullable = false, length = 30)
    private MessageType messageType;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "contentHash", length = 66)
    private String contentHash;

    // Threading
    @Column(name = "threadId", length = 66)
    private String threadId;

    @Column(name = "replyToMessageId", length = 66)
    private String replyToMessageId;

    // Attachments
    @Column(name = "hasAttachments", nullable = false)
    private Boolean hasAttachments = false;

    @Column(name = "attachmentUrls", columnDefinition = "TEXT")
    private String attachmentUrls;

    @Column(name = "attachmentCount", nullable = false)
    private Integer attachmentCount = 0;

    // Reactions
    @Column(name = "reactions", columnDefinition = "TEXT")
    private String reactions;

    @Column(name = "reactionCount", nullable = false)
    private Integer reactionCount = 0;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private MessageStatus status;

    @Column(name = "isEdited", nullable = false)
    private Boolean isEdited = false;

    @Column(name = "isDeleted", nullable = false)
    private Boolean isDeleted = false;

    // Timestamps
    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "editedAt")
    private Instant editedAt;

    @Column(name = "deletedAt")
    private Instant deletedAt;

    @Column(name = "readAt")
    private Instant readAt;

    // Metadata
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "mentions", columnDefinition = "TEXT")
    private String mentions;

    // Encryption
    @Column(name = "isEncrypted", nullable = false)
    private Boolean isEncrypted = false;

    @Column(name = "encryptionKey", length = 255)
    private String encryptionKey;

    // ==================== CONSTRUCTORS ====================

    public Message() {
        this.createdAt = Instant.now();
        this.status = MessageStatus.SENT;
        this.hasAttachments = false;
        this.attachmentCount = 0;
        this.reactionCount = 0;
        this.isEdited = false;
        this.isDeleted = false;
        this.isEncrypted = false;
    }

    public Message(String messageId, String channelId, String senderAddress, String content) {
        this();
        this.messageId = messageId;
        this.channelId = channelId;
        this.senderAddress = senderAddress;
        this.content = content;
        this.messageType = MessageType.TEXT;
    }

    // ==================== LIFECYCLE METHODS ====================

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /**
     * Mark message as read
     */
    public void markAsRead() {
        if (status == MessageStatus.SENT) {
            this.status = MessageStatus.READ;
            this.readAt = Instant.now();
        }
    }

    /**
     * Edit message content
     */
    public void edit(String newContent) {
        if (isDeleted) {
            throw new IllegalStateException("Cannot edit a deleted message");
        }
        this.content = newContent;
        this.isEdited = true;
        this.editedAt = Instant.now();
    }

    /**
     * Delete message
     */
    public void delete() {
        if (isDeleted) {
            throw new IllegalStateException("Message is already deleted");
        }
        this.isDeleted = true;
        this.deletedAt = Instant.now();
        this.status = MessageStatus.DELETED;
    }

    /**
     * Add reaction
     */
    public void addReaction(String reaction) {
        this.reactionCount++;
        String currentReactions = this.reactions != null ? this.reactions : "";
        this.reactions = currentReactions.isEmpty() ? reaction : currentReactions + "," + reaction;
    }

    /**
     * Remove reaction
     */
    public void removeReaction() {
        if (this.reactionCount > 0) {
            this.reactionCount--;
        }
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getChannelId() { return channelId; }
    public void setChannelId(String channelId) { this.channelId = channelId; }

    public String getSenderAddress() { return senderAddress; }
    public void setSenderAddress(String senderAddress) { this.senderAddress = senderAddress; }

    public MessageType getMessageType() { return messageType; }
    public void setMessageType(MessageType messageType) { this.messageType = messageType; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public String getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(String replyToMessageId) { this.replyToMessageId = replyToMessageId; }

    public Boolean getHasAttachments() { return hasAttachments; }
    public void setHasAttachments(Boolean hasAttachments) { this.hasAttachments = hasAttachments; }

    public String getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(String attachmentUrls) { this.attachmentUrls = attachmentUrls; }

    public Integer getAttachmentCount() { return attachmentCount; }
    public void setAttachmentCount(Integer attachmentCount) { this.attachmentCount = attachmentCount; }

    public String getReactions() { return reactions; }
    public void setReactions(String reactions) { this.reactions = reactions; }

    public Integer getReactionCount() { return reactionCount; }
    public void setReactionCount(Integer reactionCount) { this.reactionCount = reactionCount; }

    public MessageStatus getStatus() { return status; }
    public void setStatus(MessageStatus status) { this.status = status; }

    public Boolean getIsEdited() { return isEdited; }
    public void setIsEdited(Boolean isEdited) { this.isEdited = isEdited; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getMentions() { return mentions; }
    public void setMentions(String mentions) { this.mentions = mentions; }

    public Boolean getIsEncrypted() { return isEncrypted; }
    public void setIsEncrypted(Boolean isEncrypted) { this.isEncrypted = isEncrypted; }

    public String getEncryptionKey() { return encryptionKey; }
    public void setEncryptionKey(String encryptionKey) { this.encryptionKey = encryptionKey; }

    // ==================== ENUM DEFINITIONS ====================

    public enum MessageType {
        TEXT,           // Plain text message
        IMAGE,          // Image message
        FILE,           // File attachment
        VOICE,          // Voice message
        VIDEO,          // Video message
        SYSTEM,         // System notification
        COMMAND,        // Bot command
        REACTION        // Reaction to another message
    }

    public enum MessageStatus {
        SENT,           // Message sent
        DELIVERED,      // Message delivered
        READ,           // Message read
        FAILED,         // Message failed to send
        DELETED         // Message deleted
    }

    @Override
    public String toString() {
        return String.format("Message{id=%d, messageId='%s', channelId='%s', sender='%s', type=%s, status=%s}",
                id, messageId, channelId, senderAddress, messageType, status);
    }
}
