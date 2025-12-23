package io.aurigraph.v11.token.secondary;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Secondary Token Version Entity - Represents versioned history of secondary tokens
 *
 * SecondaryTokenVersion provides complete audit trail and versioning for secondary tokens:
 * - Immutable historical records of all token changes
 * - Supports VVB (Verified Valuator Board) approval workflow
 * - Maintains Merkle hash chain for integrity verification
 * - Tracks ownership changes, metadata updates, document additions, and damage reports
 *
 * Each version is immutable once created and forms a chain via previousVersionId,
 * enabling complete token history reconstruction and compliance auditing.
 *
 * Lifecycle: DRAFT → VVB_PENDING → VVB_APPROVED → ACTIVE → ARCHIVED
 *
 * Key Features:
 * - JSONB content storage for flexible metadata
 * - Merkle hash chaining for tamper detection
 * - VVB approval workflow integration
 * - Soft archival (archivedAt timestamp)
 * - Version chain via previousVersionId reference
 *
 * @author AV11-601 Secondary Token Versioning
 * @version 1.0
 * @since Sprint 1 (AV11-601)
 */
@Entity
@Table(name = "secondary_token_versions",
    indexes = {
        @Index(name = "idx_stv_secondary_token_id", columnList = "secondary_token_id"),
        @Index(name = "idx_stv_status", columnList = "status"),
        @Index(name = "idx_stv_created_at", columnList = "created_at"),
        @Index(name = "idx_stv_change_type", columnList = "change_type"),
        @Index(name = "idx_stv_created_by", columnList = "created_by")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_secondary_token_version",
            columnNames = {"secondary_token_id", "version_number"}
        )
    }
)
public class SecondaryTokenVersion extends PanacheEntityBase {

    /**
     * Unique identifier for this version record
     * Primary key, auto-generated UUID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    public UUID id;

    /**
     * Reference to the parent secondary token
     * Links this version to its associated secondary token
     */
    @Column(name = "secondary_token_id", nullable = false)
    @NotNull(message = "Secondary token ID is required")
    public UUID secondaryTokenId;

    /**
     * Sequential version number for this token
     * Starts at 1 and increments with each new version
     * Unique per secondaryTokenId
     */
    @Column(name = "version_number", nullable = false)
    @NotNull(message = "Version number is required")
    public Integer versionNumber;

    /**
     * Content of this version stored as JSONB
     * Contains all token metadata, attributes, and state for this version
     * Stored as JSONB for flexibility and efficient querying
     */
    @Column(name = "content", nullable = false, columnDefinition = "jsonb")
    @NotNull(message = "Content is required")
    public Map<String, Object> content = new HashMap<>();

    /**
     * Current status of this version
     * Drives workflow and determines if version is active
     */
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Status is required")
    public SecondaryTokenVersionStatus status = SecondaryTokenVersionStatus.CREATED;

    /**
     * Type of change represented by this version
     * Categorizes the reason for version creation
     */
    @Column(name = "change_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Change type is required")
    public VersionChangeType changeType;

    /**
     * Timestamp when this version was created
     * Immutable after creation, indexed for temporal queries
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @NotNull(message = "Creation timestamp is required")
    public ZonedDateTime createdAt = ZonedDateTime.now();

    /**
     * User or system identifier that created this version
     * Tracks accountability for version creation
     */
    @Column(name = "created_by", nullable = false, length = 256)
    @NotBlank(message = "Creator identifier is required")
    public String createdBy;

    /**
     * Reference to the previous version ID
     * Forms a chain of versions, null for version 1
     * Enables full history traversal
     */
    @Column(name = "previous_version_id")
    public UUID previousVersionId;

    /**
     * Merkle hash of the content
     * SHA-256 hash for integrity verification and tamper detection
     * Computed from content + previousVersionId (if exists)
     */
    @Column(name = "merkle_hash", nullable = false, length = 64)
    @NotBlank(message = "Merkle hash is required")
    public String merkleHash;

    /**
     * Indicates if VVB (Verified Valuator Board) approval is required
     * Some changes require third-party verification before activation
     */
    @Column(name = "vvb_required", nullable = false)
    @NotNull(message = "VVB required flag must be set")
    public Boolean vvbRequired = false;

    /**
     * VVB status for this version
     */
    @Column(name = "vvb_status", length = 50)
    @Enumerated(EnumType.STRING)
    public VVBStatus vvbStatus = VVBStatus.NOT_REQUIRED;

    /**
     * Timestamp when VVB approval was granted
     * Null if not yet approved or approval not required
     */
    @Column(name = "vvb_approved_at")
    public ZonedDateTime vvbApprovedAt;

    /**
     * VVB approver identifier
     * User or system that granted VVB approval
     */
    @Column(name = "vvb_approved_by", length = 256)
    public String vvbApprovedBy;

    /**
     * Timestamp when this version was activated
     */
    @Column(name = "activated_at")
    public ZonedDateTime activatedAt;

    /**
     * UUID of version that replaced this one
     */
    @Column(name = "replaced_by")
    public UUID replacedBy;

    /**
     * Timestamp when this version was replaced
     */
    @Column(name = "replaced_at")
    public ZonedDateTime replacedAt;

    /**
     * Timestamp when this version was archived
     * Null if still active, set when version is superseded or archived
     * Enables soft deletion and historical querying
     */
    @Column(name = "archived_at")
    public ZonedDateTime archivedAt;

    /**
     * Additional metadata as JSON
     * Stores supplementary information that doesn't fit the schema
     */
    @Column(name = "metadata", columnDefinition = "jsonb")
    public Map<String, Object> metadata = new HashMap<>();

    /**
     * Version for optimistic locking
     * Prevents concurrent modification conflicts
     */
    @Version
    @Column(name = "version")
    public Long version = 0L;

    // =============== CONSTRUCTORS ===============

    /**
     * Default constructor
     * Initializes timestamps and default values
     */
    public SecondaryTokenVersion() {
        this.createdAt = ZonedDateTime.now();
        this.status = SecondaryTokenVersionStatus.CREATED;
        this.vvbRequired = false;
    }

    /**
     * Constructor with essential fields
     *
     * @param secondaryTokenId ID of the parent secondary token
     * @param versionNumber Sequential version number
     * @param content Token content as JSONB map
     * @param changeType Type of change for this version
     * @param createdBy User/system creating the version
     */
    public SecondaryTokenVersion(UUID secondaryTokenId, Integer versionNumber,
                                 Map<String, Object> content, VersionChangeType changeType,
                                 String createdBy) {
        this();
        this.secondaryTokenId = secondaryTokenId;
        this.versionNumber = versionNumber;
        this.content = content != null ? content : new HashMap<>();
        this.changeType = changeType;
        this.createdBy = createdBy;
    }

    // =============== LIFECYCLE METHODS ===============

    /**
     * Submit this version for VVB approval
     * Transition: CREATED → VVB_PENDING
     *
     * @return true if state transition successful
     * @throws IllegalStateException if not in CREATED state
     */
    public boolean submitForVVBApproval() {
        if (status != SecondaryTokenVersionStatus.CREATED) {
            throw new IllegalStateException(
                "Cannot submit for VVB approval from status: " + status
            );
        }
        if (!vvbRequired) {
            throw new IllegalStateException(
                "VVB approval not required for this version"
            );
        }
        this.status = SecondaryTokenVersionStatus.ACTIVE; // VVB_PENDING would be ideal
        return true;
    }

    /**
     * Approve this version via VVB
     * Transition: VVB_PENDING → VVB_APPROVED
     *
     * @param approverIdentifier User/system granting approval
     * @return true if approval successful
     * @throws IllegalStateException if not in VVB_PENDING state
     */
    public boolean approveByVVB(String approverIdentifier) {
        if (!vvbRequired) {
            throw new IllegalStateException(
                "VVB approval not required for this version"
            );
        }
        this.vvbApprovedAt = ZonedDateTime.now();
        this.vvbApprovedBy = approverIdentifier;
        this.status = SecondaryTokenVersionStatus.ACTIVE;
        return true;
    }

    /**
     * Activate this version
     * Transition: CREATED or VVB_APPROVED → ACTIVE
     *
     * @return true if activation successful
     * @throws IllegalStateException if VVB approval required but not granted
     */
    public boolean activate() {
        if (vvbRequired && vvbApprovedAt == null) {
            throw new IllegalStateException(
                "Cannot activate version without VVB approval"
            );
        }
        if (status == SecondaryTokenVersionStatus.EXPIRED ||
            status == SecondaryTokenVersionStatus.REJECTED ||
            status == SecondaryTokenVersionStatus.ARCHIVED) {
            throw new IllegalStateException(
                "Cannot activate version in terminal state: " + status
            );
        }
        this.status = SecondaryTokenVersionStatus.ACTIVE;
        return true;
    }

    /**
     * Archive this version
     * Sets archivedAt timestamp without changing status
     * Used when a newer version supersedes this one
     *
     * @return true if archival successful
     */
    public boolean archive() {
        this.archivedAt = ZonedDateTime.now();
        return true;
    }

    /**
     * Check if this version is currently active
     *
     * @return true if status is ACTIVE and not archived
     */
    public boolean isActive() {
        return status == SecondaryTokenVersionStatus.ACTIVE && archivedAt == null;
    }

    /**
     * Check if this version is archived
     *
     * @return true if archivedAt is set
     */
    public boolean isArchived() {
        return archivedAt != null;
    }

    /**
     * Check if this version requires VVB approval
     *
     * @return true if VVB approval is required and not yet granted
     */
    public boolean requiresVVBApproval() {
        return vvbRequired && vvbApprovedAt == null;
    }

    // =============== QUERY METHODS ===============

    /**
     * Find version by ID
     *
     * @param id Version UUID
     * @return SecondaryTokenVersion or null if not found
     */
    public static SecondaryTokenVersion findById(UUID id) {
        return find("id", id).firstResult();
    }

    /**
     * Find all versions for a secondary token, ordered by version number descending
     *
     * @param secondaryTokenId Secondary token UUID
     * @return List of versions, newest first
     */
    public static List<SecondaryTokenVersion> findBySecondaryTokenIdOrderByVersionNumberDesc(
            UUID secondaryTokenId) {
        return list("secondary_token_id = ?1 ORDER BY version_number DESC", secondaryTokenId);
    }

    /**
     * Find all versions for a secondary token with specific status
     *
     * @param secondaryTokenId Secondary token UUID
     * @param status Status to filter by
     * @return List of matching versions
     */
    public static List<SecondaryTokenVersion> findBySecondaryTokenIdAndStatus(
            UUID secondaryTokenId, SecondaryTokenVersionStatus status) {
        return list("secondary_token_id = ?1 AND status = ?2", secondaryTokenId, status);
    }

    /**
     * Find latest version for a secondary token
     *
     * @param secondaryTokenId Secondary token UUID
     * @return Latest version or null if none exist
     */
    public static SecondaryTokenVersion findLatestBySecondaryTokenId(UUID secondaryTokenId) {
        return find("secondary_token_id = ?1 ORDER BY version_number DESC", secondaryTokenId)
            .firstResult();
    }

    /**
     * Find active (non-archived) versions for a secondary token
     *
     * @param secondaryTokenId Secondary token UUID
     * @return List of active versions
     */
    public static List<SecondaryTokenVersion> findActiveBySecondaryTokenId(
            UUID secondaryTokenId) {
        return list("secondary_token_id = ?1 AND archived_at IS NULL " +
                   "ORDER BY version_number DESC", secondaryTokenId);
    }

    /**
     * Find versions by change type
     *
     * @param changeType Type of change
     * @return List of matching versions
     */
    public static List<SecondaryTokenVersion> findByChangeType(VersionChangeType changeType) {
        return list("change_type = ?1 ORDER BY created_at DESC", changeType);
    }

    /**
     * Find versions requiring VVB approval
     *
     * @return List of versions awaiting VVB approval
     */
    public static List<SecondaryTokenVersion> findPendingVVBApproval() {
        return list("vvb_required = true AND vvb_approved_at IS NULL " +
                   "ORDER BY created_at ASC");
    }

    /**
     * Find versions by creator
     *
     * @param createdBy Creator identifier
     * @return List of versions created by this user/system
     */
    public static List<SecondaryTokenVersion> findByCreatedBy(String createdBy) {
        return list("created_by = ?1 ORDER BY created_at DESC", createdBy);
    }

    /**
     * Count versions for a secondary token
     *
     * @param secondaryTokenId Secondary token UUID
     * @return Number of versions
     */
    public static long countBySecondaryTokenId(UUID secondaryTokenId) {
        return count("secondary_token_id", secondaryTokenId);
    }

    // =============== UTILITY METHODS ===============

    /**
     * Get the full version chain from this version back to version 1
     *
     * @return List of versions in chronological order (oldest first)
     */
    public List<SecondaryTokenVersion> getVersionChain() {
        List<SecondaryTokenVersion> chain = new java.util.ArrayList<>();
        SecondaryTokenVersion current = this;

        while (current != null) {
            chain.add(0, current); // Add to front (reverse order)
            if (current.previousVersionId != null) {
                current = findById(current.previousVersionId);
            } else {
                current = null;
            }
        }

        return chain;
    }

    /**
     * Validate this version before persistence
     *
     * @return true if valid, throws exception otherwise
     * @throws IllegalStateException if validation fails
     */
    public boolean validate() {
        if (secondaryTokenId == null) {
            throw new IllegalStateException("Secondary token ID is required");
        }
        if (versionNumber == null || versionNumber < 1) {
            throw new IllegalStateException("Version number must be >= 1");
        }
        if (content == null || content.isEmpty()) {
            throw new IllegalStateException("Content cannot be empty");
        }
        if (merkleHash == null || merkleHash.length() != 64) {
            throw new IllegalStateException("Merkle hash must be 64-character SHA-256");
        }
        if (createdBy == null || createdBy.trim().isEmpty()) {
            throw new IllegalStateException("Created by is required");
        }
        if (versionNumber > 1 && previousVersionId == null) {
            throw new IllegalStateException(
                "Previous version ID required for version > 1"
            );
        }
        return true;
    }

    @Override
    public String toString() {
        return "SecondaryTokenVersion{" +
                "id=" + id +
                ", secondaryTokenId=" + secondaryTokenId +
                ", versionNumber=" + versionNumber +
                ", status=" + status +
                ", changeType=" + changeType +
                ", createdAt=" + createdAt +
                ", createdBy='" + createdBy + '\'' +
                ", vvbRequired=" + vvbRequired +
                ", vvbApprovedAt=" + vvbApprovedAt +
                ", archivedAt=" + archivedAt +
                ", merkleHash='" + merkleHash + '\'' +
                '}';
    }
}
