package io.aurigraph.v11.token.secondary;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Secondary Token Versioning Service - Sprint 1 Task 1.3 Implementation
 * AV11-601: Secondary Token Versioning Initiative
 *
 * Manages secondary token versioning with transactional boundaries, state transitions,
 * and VVB integration. Provides version lifecycle management with full audit trail.
 *
 * Core Responsibilities:
 * - Version creation with automatic merkle hashing
 * - Version retrieval (active, chain, history)
 * - Lifecycle management (activate, replace, archive)
 * - Integrity validation
 * - VVB approval workflow
 *
 * Performance Targets:
 * - Create version: < 50ms
 * - Get active version: < 5ms
 * - Get version chain (100 versions): < 50ms
 * - Version integrity check: < 10ms
 *
 * CDI Events:
 * - VersionCreatedEvent: Fired when new version created
 * - VersionActivatedEvent: Fired when version becomes active
 * - VersionReplacedEvent: Fired when version is replaced
 * - VersionArchivedEvent: Fired when version archived
 *
 * @author Aurigraph Team - Sprint 1 Task 1.3
 * @version 1.0
 * @since Sprint 1 (Week 1-2)
 */
@ApplicationScoped
public class SecondaryTokenVersioningService {

    private static final Logger LOG = Logger.getLogger(SecondaryTokenVersioningService.class);

    @Inject
    SecondaryTokenVersionRepository versionRepository;

    @Inject
    SecondaryTokenMerkleService merkleService;

    @Inject
    Event<VersionCreatedEvent> versionCreatedEvent;

    @Inject
    Event<VersionActivatedEvent> versionActivatedEvent;

    @Inject
    Event<VersionReplacedEvent> versionReplacedEvent;

    @Inject
    Event<VersionArchivedEvent> versionArchivedEvent;

    // Performance metrics
    private long createVersionCount = 0;
    private long totalCreateVersionTime = 0;

    /**
     * Create a new version of a secondary token
     *
     * Creates version, calculates merkleHash, determines VVB requirement based on changeType,
     * and fires VersionCreatedEvent.
     *
     * VVB is required for: OWNERSHIP_CHANGE
     *
     * @param secondaryTokenId The secondary token ID
     * @param content Version content as flexible map
     * @param createdBy Creator identifier
     * @param changeType Type of change (determines VVB requirement)
     * @return Uni containing the created version
     */
    @Transactional
    public Uni<SecondaryTokenVersion> createVersion(UUID secondaryTokenId, Map<String, Object> content,
                                                     String createdBy, VersionChangeType changeType) {
        long startTime = System.nanoTime();

        return Uni.createFrom().item(() -> {
            // Validate inputs
            validateCreateVersionInputs(secondaryTokenId, content, createdBy, changeType);

            // Get next version number
            Integer nextVersionNumber = versionRepository.findMaxVersionNumberByTokenId(secondaryTokenId)
                    .orElse(0) + 1;

            // Create version entity
            SecondaryTokenVersion version = new SecondaryTokenVersion();
            version.id = UUID.randomUUID();
            version.secondaryTokenId = secondaryTokenId;
            version.versionNumber = nextVersionNumber;
            version.content = new HashMap<>(content);
            version.createdBy = createdBy;
            version.createdAt = ZonedDateTime.now();
            version.changeType = changeType;

            // Determine VVB requirement and initial status
            boolean vvbRequired = changeType.typicallyRequiresVVB();
            version.vvbRequired = vvbRequired;
            if (vvbRequired) {
                version.status = SecondaryTokenVersionStatus.PENDING_VVB;
                version.vvbStatus = VVBStatus.PENDING;
            } else {
                version.status = SecondaryTokenVersionStatus.ACTIVE;
                version.vvbStatus = VVBStatus.NOT_REQUIRED;
            }

            // Calculate merkle hash
            version.merkleHash = calculateMerkleHash(version);

            // Persist
            versionRepository.persist(version);

            // Fire CDI event
            versionCreatedEvent.fire(new VersionCreatedEvent(
                    version.id,
                    secondaryTokenId,
                    nextVersionNumber,
                    changeType,
                    createdBy,
                    Instant.now()
            ));

            // Update metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            updateCreateMetrics(duration);

            LOG.infof("Created version %d for token %s (changeType=%s, vvbRequired=%s, %dms)",
                    nextVersionNumber, secondaryTokenId, changeType, vvbRequired, duration);

            return version;
        });
    }

    /**
     * Get the currently active version of a secondary token
     *
     * Returns version with status=ACTIVE or PENDING_VVB
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing the active version
     */
    public Uni<SecondaryTokenVersion> getActiveVersion(UUID secondaryTokenId) {
        return Uni.createFrom().item(() -> {
            // Try ACTIVE first
            Optional<SecondaryTokenVersion> active = versionRepository.findByTokenIdAndStatus(
                    secondaryTokenId, SecondaryTokenVersionStatus.ACTIVE);

            if (active.isPresent()) {
                return active.get();
            }

            // Fallback to PENDING_VVB
            Optional<SecondaryTokenVersion> pending = versionRepository.findByTokenIdAndStatus(
                    secondaryTokenId, SecondaryTokenVersionStatus.PENDING_VVB);

            if (pending.isPresent()) {
                return pending.get();
            }

            throw new IllegalArgumentException("No active version found for token: " + secondaryTokenId);
        });
    }

    /**
     * Get all versions of a secondary token in chronological order (oldest to newest)
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing ordered list of versions
     */
    public Uni<List<SecondaryTokenVersion>> getVersionChain(UUID secondaryTokenId) {
        return Uni.createFrom().item(() -> {
            return versionRepository.findByTokenIdOrderByVersionNumber(secondaryTokenId);
        });
    }

    /**
     * Activate a version (transition PENDING_VVB -> ACTIVE)
     *
     * Fires VersionActivatedEvent upon successful activation.
     *
     * @param versionId The version ID to activate
     * @return Uni containing the activated version
     */
    @Transactional
    public Uni<SecondaryTokenVersion> activateVersion(UUID versionId) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenVersion version = versionRepository.findByIdOptional(versionId)
                    .orElseThrow(() -> new IllegalArgumentException("Version not found: " + versionId));

            // Validate state transition
            if (version.status != SecondaryTokenVersionStatus.PENDING_VVB) {
                throw new IllegalStateException(
                        "Cannot activate version with status: " + version.status + ", must be PENDING_VVB");
            }

            // Transition to ACTIVE
            version.status = SecondaryTokenVersionStatus.ACTIVE;
            version.activatedAt = ZonedDateTime.now();

            versionRepository.persist(version);

            // Fire event
            versionActivatedEvent.fire(new VersionActivatedEvent(
                    versionId,
                    version.secondaryTokenId,
                    Instant.now()
            ));

            LOG.infof("Activated version %s (token=%s)", versionId, version.secondaryTokenId);

            return version;
        });
    }

    /**
     * Replace an existing version with new content
     *
     * Archives old version, creates new version with reference to old, fires VersionReplacedEvent.
     *
     * @param oldVersionId The version to replace
     * @param newVersionContent Content for new version
     * @param changeType Type of change
     * @param replacedBy Actor performing replacement
     * @return Uni containing the new version
     */
    @Transactional
    public Uni<SecondaryTokenVersion> replaceVersion(UUID oldVersionId, Map<String, Object> newVersionContent,
                                                      VersionChangeType changeType, String replacedBy) {
        return Uni.createFrom().item(() -> {
            // Get old version
            SecondaryTokenVersion oldVersion = versionRepository.findByIdOptional(oldVersionId)
                    .orElseThrow(() -> new IllegalArgumentException("Old version not found: " + oldVersionId));

            // Archive old version
            oldVersion.status = SecondaryTokenVersionStatus.REPLACED;
            oldVersion.replacedAt = ZonedDateTime.now();

            // Create new version
            Integer nextVersionNumber = versionRepository.findMaxVersionNumberByTokenId(oldVersion.secondaryTokenId)
                    .orElse(0) + 1;

            SecondaryTokenVersion newVersion = new SecondaryTokenVersion();
            newVersion.id = UUID.randomUUID();
            newVersion.secondaryTokenId = oldVersion.secondaryTokenId;
            newVersion.versionNumber = nextVersionNumber;
            newVersion.content = new HashMap<>(newVersionContent);
            newVersion.createdBy = replacedBy;
            newVersion.createdAt = ZonedDateTime.now();
            newVersion.previousVersionId = oldVersionId;
            newVersion.changeType = changeType;

            // Determine VVB requirement
            boolean vvbRequired = changeType.typicallyRequiresVVB();
            newVersion.vvbRequired = vvbRequired;
            if (vvbRequired) {
                newVersion.status = SecondaryTokenVersionStatus.PENDING_VVB;
                newVersion.vvbStatus = VVBStatus.PENDING;
            } else {
                newVersion.status = SecondaryTokenVersionStatus.ACTIVE;
                newVersion.vvbStatus = VVBStatus.NOT_REQUIRED;
            }

            // Calculate merkle hash
            newVersion.merkleHash = calculateMerkleHash(newVersion);

            // Set replaced reference on old version
            oldVersion.replacedBy = newVersion.id;

            versionRepository.persist(oldVersion);
            versionRepository.persist(newVersion);

            // Fire event
            versionReplacedEvent.fire(new VersionReplacedEvent(
                    oldVersionId,
                    newVersion.id,
                    oldVersion.versionNumber,
                    nextVersionNumber,
                    replacedBy,
                    Instant.now()
            ));

            LOG.infof("Replaced version %d with version %d for token %s",
                    oldVersion.versionNumber, nextVersionNumber, oldVersion.secondaryTokenId);

            return newVersion;
        });
    }

    /**
     * Archive a version (set status=ARCHIVED, set archivedAt)
     *
     * Fires VersionArchivedEvent.
     *
     * @param versionId The version ID to archive
     * @param reason Archive reason
     * @return Uni<Void>
     */
    @Transactional
    public Uni<Void> archiveVersion(UUID versionId, String reason) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenVersion version = versionRepository.findByIdOptional(versionId)
                    .orElseThrow(() -> new IllegalArgumentException("Version not found: " + versionId));

            // Can only archive non-active versions
            if (version.status == SecondaryTokenVersionStatus.ACTIVE) {
                throw new IllegalStateException("Cannot archive active version: " + versionId);
            }

            version.status = SecondaryTokenVersionStatus.ARCHIVED;
            version.archivedAt = ZonedDateTime.now();

            versionRepository.persist(version);

            // Fire event
            versionArchivedEvent.fire(new VersionArchivedEvent(
                    versionId,
                    version.secondaryTokenId,
                    reason,
                    Instant.now()
            ));

            LOG.infof("Archived version %s (reason: %s)", versionId, reason);

            return null;
        });
    }

    /**
     * Get all versions with a specific status
     *
     * @param secondaryTokenId The secondary token ID
     * @param status The status to filter by
     * @return Uni containing filtered list of versions
     */
    public Uni<List<SecondaryTokenVersion>> getVersionsByStatus(UUID secondaryTokenId, SecondaryTokenVersionStatus status) {
        return Uni.createFrom().item(() -> {
            return versionRepository.findAllByTokenIdAndStatus(secondaryTokenId, status);
        });
    }

    /**
     * Validate version integrity by verifying merkle hash
     *
     * Recomputes hash and compares with stored hash.
     *
     * @param versionId The version ID to validate
     * @return Uni containing true if valid, false otherwise
     */
    public Uni<Boolean> validateVersionIntegrity(UUID versionId) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenVersion version = versionRepository.findByIdOptional(versionId)
                    .orElseThrow(() -> new IllegalArgumentException("Version not found: " + versionId));

            String computedHash = calculateMerkleHash(version);
            boolean valid = computedHash.equals(version.merkleHash);

            LOG.debugf("Version %s integrity check: %s (computed=%s, stored=%s)",
                    versionId, valid ? "VALID" : "INVALID", computedHash, version.merkleHash);

            return valid;
        });
    }

    /**
     * Get version history with audit trail
     *
     * Returns chronological history with timestamps, creators, change types.
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing list of history entries
     */
    public Uni<List<VersionHistoryEntry>> getVersionHistory(UUID secondaryTokenId) {
        return Uni.createFrom().item(() -> {
            List<SecondaryTokenVersion> versions = versionRepository
                    .findByTokenIdOrderByVersionNumber(secondaryTokenId);

            return versions.stream()
                    .map(v -> new VersionHistoryEntry(
                            v.versionNumber,
                            v.createdAt != null ? v.createdAt.toInstant() : Instant.now(),
                            v.createdBy,
                            inferChangeType(v),
                            v.status,
                            v.previousVersionId
                    ))
                    .collect(Collectors.toList());
        });
    }

    /**
     * Count versions by token
     *
     * @param secondaryTokenId The secondary token ID
     * @return Uni containing version count
     */
    public Uni<Long> countVersionsByToken(UUID secondaryTokenId) {
        return Uni.createFrom().item(() -> {
            return versionRepository.countByTokenId(secondaryTokenId);
        });
    }

    /**
     * Get all versions needing VVB approval (status=PENDING_VVB)
     *
     * Used for batch VVB processing.
     *
     * @return Uni containing list of versions pending VVB
     */
    public Uni<List<SecondaryTokenVersion>> getVersionsNeedingVVB() {
        return Uni.createFrom().item(() -> {
            return versionRepository.findByVVBStatus(VVBStatus.PENDING);
        });
    }

    /**
     * Mark a version as VVB approved
     *
     * Sets vvbApprovedAt, vvbApprovedBy, transitions to ACTIVE if conditions met.
     *
     * @param versionId The version ID
     * @param approvedBy Approver identifier
     * @return Uni containing the updated version
     */
    @Transactional
    public Uni<SecondaryTokenVersion> markVVBApproved(UUID versionId, String approvedBy) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenVersion version = versionRepository.findByIdOptional(versionId)
                    .orElseThrow(() -> new IllegalArgumentException("Version not found: " + versionId));

            if (version.vvbStatus != VVBStatus.PENDING) {
                throw new IllegalStateException("Version is not pending VVB approval: " + versionId);
            }

            version.vvbStatus = VVBStatus.APPROVED;
            version.vvbApprovedAt = ZonedDateTime.now();
            version.vvbApprovedBy = approvedBy;

            // Transition to ACTIVE if currently PENDING_VVB
            if (version.status == SecondaryTokenVersionStatus.PENDING_VVB) {
                version.status = SecondaryTokenVersionStatus.ACTIVE;
                version.activatedAt = ZonedDateTime.now();

                // Fire activation event
                versionActivatedEvent.fire(new VersionActivatedEvent(
                        versionId,
                        version.secondaryTokenId,
                        Instant.now()
                ));
            }

            versionRepository.persist(version);

            LOG.infof("VVB approved version %s by %s", versionId, approvedBy);

            return version;
        });
    }

    // =============== HELPER METHODS ===============

    private void validateCreateVersionInputs(UUID secondaryTokenId, Map<String, Object> content,
                                            String createdBy, VersionChangeType changeType) {
        if (secondaryTokenId == null) {
            throw new IllegalArgumentException("secondaryTokenId cannot be null");
        }
        if (content == null || content.isEmpty()) {
            throw new IllegalArgumentException("content cannot be null or empty");
        }
        if (createdBy == null || createdBy.trim().isEmpty()) {
            throw new IllegalArgumentException("createdBy cannot be null or empty");
        }
        if (changeType == null) {
            throw new IllegalArgumentException("changeType cannot be null");
        }
    }

    private String calculateMerkleHash(SecondaryTokenVersion version) {
        // Hash format: id|tokenId|versionNumber|content|status|createdAt
        String data = String.format("%s|%s|%d|%s|%s|%s",
                version.id,
                version.secondaryTokenId,
                version.versionNumber,
                version.content != null ? version.content.toString() : "",
                version.status,
                version.createdAt != null ? version.createdAt : ""
        );
        return merkleService.sha256Hash(data);
    }

    private VersionChangeType inferChangeType(SecondaryTokenVersion version) {
        // Infer from changeType if available in entity, or from VVB status
        if (version.changeType != null) {
            return version.changeType;
        }
        // Fallback: if VVB was required, it was likely ownership change
        if (version.vvbRequired != null && version.vvbRequired) {
            return VersionChangeType.OWNERSHIP_CHANGE;
        }
        return VersionChangeType.METADATA_UPDATE;
    }

    private synchronized void updateCreateMetrics(long durationMs) {
        createVersionCount++;
        totalCreateVersionTime += durationMs;
    }

    public VersioningMetrics getMetrics() {
        synchronized (this) {
            long avgCreateTime = createVersionCount > 0 ? totalCreateVersionTime / createVersionCount : 0;
            return new VersioningMetrics(createVersionCount, avgCreateTime);
        }
    }

    // =============== INNER CLASSES ===============

    /**
     * Version history entry for audit trail
     */
    public static class VersionHistoryEntry {
        public final Integer versionNumber;
        public final Instant createdAt;
        public final String createdBy;
        public final VersionChangeType changeType;
        public final SecondaryTokenVersionStatus status;
        public final UUID previousVersionId;

        public VersionHistoryEntry(Integer versionNumber, Instant createdAt, String createdBy,
                                  VersionChangeType changeType, SecondaryTokenVersionStatus status,
                                  UUID previousVersionId) {
            this.versionNumber = versionNumber;
            this.createdAt = createdAt;
            this.createdBy = createdBy;
            this.changeType = changeType;
            this.status = status;
            this.previousVersionId = previousVersionId;
        }

        @Override
        public String toString() {
            return String.format("VersionHistoryEntry{v%d, %s, by=%s, status=%s}",
                    versionNumber, changeType, createdBy, status);
        }
    }

    /**
     * CDI Event: Version Created
     */
    public static class VersionCreatedEvent {
        public final UUID versionId;
        public final UUID tokenId;
        public final Integer versionNumber;
        public final VersionChangeType changeType;
        public final String createdBy;
        public final Instant timestamp;

        public VersionCreatedEvent(UUID versionId, UUID tokenId, Integer versionNumber,
                                  VersionChangeType changeType, String createdBy, Instant timestamp) {
            this.versionId = versionId;
            this.tokenId = tokenId;
            this.versionNumber = versionNumber;
            this.changeType = changeType;
            this.createdBy = createdBy;
            this.timestamp = timestamp;
        }
    }

    /**
     * CDI Event: Version Activated
     */
    public static class VersionActivatedEvent {
        public final UUID versionId;
        public final UUID tokenId;
        public final Instant timestamp;

        public VersionActivatedEvent(UUID versionId, UUID tokenId, Instant timestamp) {
            this.versionId = versionId;
            this.tokenId = tokenId;
            this.timestamp = timestamp;
        }
    }

    /**
     * CDI Event: Version Replaced
     */
    public static class VersionReplacedEvent {
        public final UUID oldVersionId;
        public final UUID newVersionId;
        public final Integer oldVersionNumber;
        public final Integer newVersionNumber;
        public final String actor;
        public final Instant timestamp;

        public VersionReplacedEvent(UUID oldVersionId, UUID newVersionId,
                                   Integer oldVersionNumber, Integer newVersionNumber,
                                   String actor, Instant timestamp) {
            this.oldVersionId = oldVersionId;
            this.newVersionId = newVersionId;
            this.oldVersionNumber = oldVersionNumber;
            this.newVersionNumber = newVersionNumber;
            this.actor = actor;
            this.timestamp = timestamp;
        }
    }

    /**
     * CDI Event: Version Archived
     */
    public static class VersionArchivedEvent {
        public final UUID versionId;
        public final UUID tokenId;
        public final String reason;
        public final Instant timestamp;

        public VersionArchivedEvent(UUID versionId, UUID tokenId, String reason, Instant timestamp) {
            this.versionId = versionId;
            this.tokenId = tokenId;
            this.reason = reason;
            this.timestamp = timestamp;
        }
    }

    /**
     * Service performance metrics
     */
    public static class VersioningMetrics {
        public final long createVersionCount;
        public final long avgCreateTimeMs;

        public VersioningMetrics(long createVersionCount, long avgCreateTimeMs) {
            this.createVersionCount = createVersionCount;
            this.avgCreateTimeMs = avgCreateTimeMs;
        }

        @Override
        public String toString() {
            return String.format("VersioningMetrics{created=%d, avgCreateTime=%dms}",
                    createVersionCount, avgCreateTimeMs);
        }
    }

}
