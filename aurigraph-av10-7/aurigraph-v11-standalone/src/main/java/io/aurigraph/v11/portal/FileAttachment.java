package io.aurigraph.v11.portal;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * File Attachment Entity for persistent storage
 *
 * Represents a file attachment linked to a blockchain transaction with:
 * - SHA256 hash for integrity verification
 * - Transaction ID linking for audit trail
 * - Filesystem storage path
 *
 * @author J4C Deployment Agent
 * @version 12.0.0
 * @since AV11-580
 */
@Entity
@Table(name = "file_attachments", indexes = {
    @Index(name = "idx_file_id", columnList = "file_id", unique = true),
    @Index(name = "idx_transaction_id", columnList = "transaction_id"),
    @Index(name = "idx_token_id", columnList = "token_id"),
    @Index(name = "idx_sha256_hash", columnList = "sha256_hash"),
    @Index(name = "idx_uploaded_at", columnList = "uploaded_at"),
    @Index(name = "idx_category", columnList = "category")
})
public class FileAttachment extends PanacheEntity {

    /**
     * Unique file identifier (UUID format)
     * Primary business key for tracking attachments
     */
    @NotBlank
    @Column(name = "file_id", nullable = false, unique = true, length = 64)
    public String fileId;

    /**
     * Original filename as uploaded by user
     */
    @NotBlank
    @Column(name = "original_name", nullable = false, length = 255)
    public String originalName;

    /**
     * Stored filename on filesystem (with hash prefix)
     */
    @NotBlank
    @Column(name = "stored_name", nullable = false, length = 255)
    public String storedName;

    /**
     * Blockchain transaction ID this file is linked to
     * Can be null for files uploaded before transaction creation
     */
    @Column(name = "transaction_id", length = 66)
    public String transactionId;

    /**
     * Token ID if file is linked to a specific token
     */
    @Column(name = "token_id", length = 66)
    public String tokenId;

    /**
     * File category (documents, images, data, assets)
     */
    @NotBlank
    @Column(name = "category", nullable = false, length = 50)
    public String category = "documents";

    /**
     * File size in bytes
     */
    @NotNull
    @Positive
    @Column(name = "file_size", nullable = false)
    public Long fileSize;

    /**
     * SHA256 hash of file content
     * Used for integrity verification
     */
    @NotBlank
    @Column(name = "sha256_hash", nullable = false, length = 64)
    public String sha256Hash;

    /**
     * MIME type of the file
     */
    @Column(name = "mime_type", length = 100)
    public String mimeType;

    /**
     * Full storage path on filesystem (local fallback)
     */
    @Column(name = "storage_path", length = 500)
    public String storagePath;

    /**
     * CDN URL for MinIO-hosted files
     * Example: https://dlt.aurigraph.io/cdn/attachments/abc123_file.pdf
     */
    @Column(name = "cdn_url", length = 500)
    public String cdnUrl;

    /**
     * Upload timestamp
     */
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false)
    public Instant uploadedAt;

    /**
     * User ID who uploaded the file
     */
    @Column(name = "uploaded_by", length = 100)
    public String uploadedBy;

    /**
     * Optional description of the file
     */
    @Column(name = "description", columnDefinition = "TEXT")
    public String description;

    /**
     * Whether the hash has been verified post-upload
     */
    @Column(name = "verified", nullable = false)
    public Boolean verified = false;

    /**
     * Soft delete flag
     */
    @Column(name = "deleted", nullable = false)
    public Boolean deleted = false;

    /**
     * Deletion timestamp (for soft delete)
     */
    @Column(name = "deleted_at")
    public Instant deletedAt;

    // Static query methods using Panache

    public static FileAttachment findByFileId(String fileId) {
        return find("fileId", fileId).firstResult();
    }

    public static java.util.List<FileAttachment> findByTransactionId(String transactionId) {
        return list("transactionId = ?1 and deleted = false", transactionId);
    }

    public static java.util.List<FileAttachment> findByTokenId(String tokenId) {
        return list("tokenId = ?1 and deleted = false", tokenId);
    }

    public static FileAttachment findByHash(String sha256Hash) {
        return find("sha256Hash = ?1 and deleted = false", sha256Hash).firstResult();
    }

    public static java.util.List<FileAttachment> findByCategory(String category) {
        return list("category = ?1 and deleted = false", category);
    }

    public static long countByTransactionId(String transactionId) {
        return count("transactionId = ?1 and deleted = false", transactionId);
    }

    /**
     * Soft delete the attachment
     */
    public void softDelete() {
        this.deleted = true;
        this.deletedAt = Instant.now();
        this.persist();
    }

    /**
     * Mark as verified after hash validation
     */
    public void markVerified() {
        this.verified = true;
        this.persist();
    }

    /**
     * Link to transaction after creation
     */
    public void linkToTransaction(String transactionId) {
        this.transactionId = transactionId;
        this.persist();
    }

    /**
     * Link to token
     */
    public void linkToToken(String tokenId) {
        this.tokenId = tokenId;
        this.persist();
    }
}
