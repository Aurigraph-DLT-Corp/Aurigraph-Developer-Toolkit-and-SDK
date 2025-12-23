package io.aurigraph.v11.token.secondary;

import io.quarkus.hibernate.reactive.panache.common.runtime.ReactiveTransactional;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Secondary Token Versioning Service
 *
 * Manages complete lifecycle of token versions including:
 * - Version creation with content validation
 * - VVB approval workflow integration
 * - State transitions with validation
 * - Merkle hash generation and verification
 * - Event publishing for subscribers
 *
 * Reactive Strategy:
 * - Uses Uni<T> for non-blocking operations
 * - Database operations are async via Panache
 * - Event firing is non-blocking
 * - No blocking calls in reactive chain
 *
 * @version 12.0.0
 * @since December 23, 2025
 */
@ApplicationScoped
@Slf4j
public class SecondaryTokenVersioningService {

    @Inject
    SecondaryTokenVersionRepository versionRepository;

    @Inject
    SecondaryTokenVersionStateMachine stateMachine;

    @Inject
    Event<VersionCreatedEvent> versionCreatedEvent;

    @Inject
    Event<VersionActivatedEvent> versionActivatedEvent;

    @Inject
    Event<VersionRejectedEvent> versionRejectedEvent;

    @Inject
    Event<VersionArchivedEvent> versionArchivedEvent;

    // =========================================================================
    // Version Creation
    // =========================================================================

    /**
     * Create a new version for a secondary token
     *
     * @param tokenId The secondary token ID
     * @param content Version content (JSON)
     * @param vvbRequired Whether VVB approval is required
     * @param previousVersionId ID of previous version (for chaining)
     * @return Uni with created version
     */
    @ReactiveTransactional
    public Uni<SecondaryTokenVersion> createVersion(
            UUID tokenId,
            String content,
            boolean vvbRequired,
            UUID previousVersionId) {

        log.info("Creating new version for token {}", tokenId);

        return Uni.createFrom().item(() -> {
            SecondaryTokenVersion version = new SecondaryTokenVersion();
            version.setId(UUID.randomUUID());
            version.setSecondaryTokenId(tokenId);
            version.setContent(content);
            version.setVvbRequired(vvbRequired);
            version.setPreviousVersionId(previousVersionId);
            version.setCreatedAt(LocalDateTime.now());
            version.setUpdatedAt(LocalDateTime.now());

            // Determine initial status
            if (vvbRequired) {
                version.setStatus(SecondaryTokenVersionStatus.CREATED);
            } else {
                version.setStatus(SecondaryTokenVersionStatus.CREATED);
            }

            // Set version number
            Integer nextNum = SecondaryTokenVersion.getNextVersionNumber(tokenId);
            version.setVersionNumber(nextNum);

            // Validate
            version.validate();

            return version;
        })
                .flatMap(version -> versionRepository.persist(version)
                        .map(v -> {
                            // Fire creation event
                            fireVersionCreatedEvent(version);
                            log.info("Version {} created for token {}", version.getVersionNumber(), tokenId);
                            return version;
                        }));
    }

    // =========================================================================
    // Version Activation
    // =========================================================================

    /**
     * Activate a version (transition to ACTIVE status)
     * Generates Merkle hash and replaces previous active version
     *
     * @param versionId The version ID to activate
     * @return Uni with activated version
     */
    @ReactiveTransactional
    public Uni<SecondaryTokenVersion> activateVersion(UUID versionId) {
        log.info("Activating version {}", versionId);

        return versionRepository.findById(versionId)
                .onItem().ifNull().failWith(() ->
                        new IllegalArgumentException("Version not found: " + versionId))
                .flatMap(version -> {
                    // Generate Merkle hash
                    String merkleHash = generateMerkleHash(version.getContent());
                    version.setMerkleHash(merkleHash);

                    // Transition to ACTIVE
                    stateMachine.transitionState(version, SecondaryTokenVersionStatus.ACTIVE);
                    version.setUpdatedAt(LocalDateTime.now());

                    return versionRepository.persist(version)
                            .flatMap(v -> {
                                // Replace previous active version
                                return replacePreviousActiveVersion(version.getSecondaryTokenId(), versionId)
                                        .map(replaced -> {
                                            fireVersionActivatedEvent(version);
                                            log.info("Version {} activated", versionId);
                                            return version;
                                        });
                            });
                });
    }

    /**
     * Replace previous active version with REPLACED status
     *
     * @param tokenId Token ID
     * @param newActiveVersionId New active version ID
     * @return Uni with void
     */
    @ReactiveTransactional
    private Uni<Void> replacePreviousActiveVersion(UUID tokenId, UUID newActiveVersionId) {
        return Uni.createFrom().item(() -> SecondaryTokenVersion.findActiveVersion(tokenId))
                .flatMap(previousActive -> {
                    if (previousActive != null && !previousActive.getId().equals(newActiveVersionId)) {
                        stateMachine.transitionState(previousActive, SecondaryTokenVersionStatus.REPLACED);
                        previousActive.setReplacedAt(LocalDateTime.now());
                        previousActive.setReplacedByVersionId(newActiveVersionId);
                        previousActive.setUpdatedAt(LocalDateTime.now());
                        return versionRepository.persist(previousActive)
                                .replaceWithVoid();
                    }
                    return Uni.createFrom().voidItem();
                });
    }

    // =========================================================================
    // VVB Approval Workflow
    // =========================================================================

    /**
     * Submit version for VVB approval
     * Transitions from CREATED to PENDING_VVB
     *
     * @param versionId Version to submit
     * @return Uni with submitted version
     */
    @ReactiveTransactional
    public Uni<SecondaryTokenVersion> submitForVVBApproval(UUID versionId) {
        log.info("Submitting version {} for VVB approval", versionId);

        return versionRepository.findById(versionId)
                .onItem().ifNull().failWith(() ->
                        new IllegalArgumentException("Version not found: " + versionId))
                .flatMap(version -> {
                    if (!Boolean.TRUE.equals(version.getVvbRequired())) {
                        return Uni.createFrom().failure(
                                new IllegalStateException("VVB approval not required for this version"));
                    }

                    stateMachine.transitionState(version, SecondaryTokenVersionStatus.PENDING_VVB);
                    version.setUpdatedAt(LocalDateTime.now());

                    return versionRepository.persist(version)
                            .map(v -> {
                                log.info("Version {} submitted to VVB", versionId);
                                return version;
                            });
                });
    }

    /**
     * Approve version (VVB approval)
     * Transitions from PENDING_VVB to ACTIVE
     *
     * @param versionId Version to approve
     * @param approver Approver identifier
     * @return Uni with approved version
     */
    @ReactiveTransactional
    public Uni<SecondaryTokenVersion> approveWithVVB(UUID versionId, String approver) {
        log.info("VVB approving version {} by {}", versionId, approver);

        return versionRepository.findById(versionId)
                .onItem().ifNull().failWith(() ->
                        new IllegalArgumentException("Version not found: " + versionId))
                .flatMap(version -> {
                    if (version.getStatus() != SecondaryTokenVersionStatus.PENDING_VVB) {
                        return Uni.createFrom().failure(
                                new IllegalStateException("Version is not in PENDING_VVB status"));
                    }

                    version.setVvbApprovedAt(LocalDateTime.now());
                    version.setVvbApprovedBy(approver);

                    // Activate after approval
                    return activateVersion(version.getId());
                });
    }

    /**
     * Reject version (VVB rejection)
     * Transitions from PENDING_VVB to REJECTED
     *
     * @param versionId Version to reject
     * @param reason Rejection reason
     * @param rejector Rejector identifier
     * @return Uni with rejected version
     */
    @ReactiveTransactional
    public Uni<SecondaryTokenVersion> rejectVersion(UUID versionId, String reason, String rejector) {
        log.warn("Rejecting version {} with reason: {}", versionId, reason);

        return versionRepository.findById(versionId)
                .onItem().ifNull().failWith(() ->
                        new IllegalArgumentException("Version not found: " + versionId))
                .flatMap(version -> {
                    if (version.getStatus() != SecondaryTokenVersionStatus.PENDING_VVB &&
                        version.getStatus() != SecondaryTokenVersionStatus.CREATED) {
                        return Uni.createFrom().failure(
                                new IllegalStateException("Cannot reject version in status: " + version.getStatus()));
                    }

                    version.setRejectionReason(reason);
                    stateMachine.transitionState(version, SecondaryTokenVersionStatus.REJECTED);
                    version.setUpdatedAt(LocalDateTime.now());

                    return versionRepository.persist(version)
                            .map(v -> {
                                fireVersionRejectedEvent(version, rejector);
                                log.warn("Version {} rejected", versionId);
                                return version;
                            });
                });
    }

    // =========================================================================
    // Version Queries
    // =========================================================================

    /**
     * Get active version for a token
     *
     * @param tokenId Token ID
     * @return Uni with active version or empty
     */
    public Uni<SecondaryTokenVersion> getActiveVersion(UUID tokenId) {
        return Uni.createFrom().item(() -> SecondaryTokenVersion.findActiveVersion(tokenId));
    }

    /**
     * Get complete version history for a token
     *
     * @param tokenId Token ID
     * @return Uni with list of versions
     */
    public Uni<List<SecondaryTokenVersion>> getVersionHistory(UUID tokenId) {
        return Uni.createFrom().item(() -> SecondaryTokenVersion.findBySecondaryTokenId(tokenId));
    }

    /**
     * Get version chain (linked versions)
     *
     * @param tokenId Token ID
     * @return Uni with version chain
     */
    public Uni<List<SecondaryTokenVersion>> getVersionChain(UUID tokenId) {
        return Uni.createFrom().item(() -> SecondaryTokenVersion.findVersionChain(tokenId));
    }

    /**
     * Get specific version by ID
     *
     * @param versionId Version ID
     * @return Uni with version or empty
     */
    public Uni<Optional<SecondaryTokenVersion>> getVersion(UUID versionId) {
        return versionRepository.findByIdOptional(versionId);
    }

    // =========================================================================
    // Merkle Hash Management
    // =========================================================================

    /**
     * Generate SHA-256 hash of content
     *
     * @param content Version content
     * @return SHA-256 hash as hex string
     */
    public String generateMerkleHash(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes());
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate Merkle hash", e);
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Verify version integrity against hash
     *
     * @param version Version to verify
     * @return Uni with boolean result
     */
    @ReactiveTransactional
    public Uni<Boolean> verifyVersionIntegrity(SecondaryTokenVersion version) {
        return Uni.createFrom().item(() -> {
            if (version.getMerkleHash() == null) {
                return false;
            }
            String calculatedHash = generateMerkleHash(version.getContent());
            boolean valid = version.getMerkleHash().equals(calculatedHash);
            log.debug("Version {} integrity check: {}", version.getId(), valid ? "VALID" : "INVALID");
            return valid;
        });
    }

    // =========================================================================
    // Archival
    // =========================================================================

    /**
     * Archive a version (move to ARCHIVED status)
     *
     * @param versionId Version to archive
     * @return Uni with archived version
     */
    @ReactiveTransactional
    public Uni<SecondaryTokenVersion> archiveVersion(UUID versionId) {
        log.info("Archiving version {}", versionId);

        return versionRepository.findById(versionId)
                .onItem().ifNull().failWith(() ->
                        new IllegalArgumentException("Version not found: " + versionId))
                .flatMap(version -> {
                    String previousStatus = version.getStatus().name();
                    stateMachine.transitionState(version, SecondaryTokenVersionStatus.ARCHIVED);
                    version.setUpdatedAt(LocalDateTime.now());

                    return versionRepository.persist(version)
                            .map(v -> {
                                fireVersionArchivedEvent(version, previousStatus);
                                log.info("Version {} archived", versionId);
                                return version;
                            });
                });
    }

    // =========================================================================
    // Event Publishing
    // =========================================================================

    private void fireVersionCreatedEvent(SecondaryTokenVersion version) {
        versionCreatedEvent.fire(new VersionCreatedEvent(
                version.getId(),
                version.getSecondaryTokenId(),
                version.getVersionNumber(),
                version.getContent(),
                version.getCreatedAt()
        ));
    }

    private void fireVersionActivatedEvent(SecondaryTokenVersion version) {
        versionActivatedEvent.fire(new VersionActivatedEvent(
                version.getId(),
                version.getSecondaryTokenId(),
                version.getVersionNumber(),
                version.getMerkleHash(),
                LocalDateTime.now()
        ));
    }

    private void fireVersionRejectedEvent(SecondaryTokenVersion version, String rejector) {
        versionRejectedEvent.fire(new VersionRejectedEvent(
                version.getId(),
                version.getSecondaryTokenId(),
                version.getVersionNumber(),
                version.getRejectionReason(),
                rejector,
                LocalDateTime.now()
        ));
    }

    private void fireVersionArchivedEvent(SecondaryTokenVersion version, String previousStatus) {
        versionArchivedEvent.fire(new VersionArchivedEvent(
                version.getId(),
                version.getSecondaryTokenId(),
                version.getVersionNumber(),
                previousStatus,
                version.getArchivedAt()
        ));
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    private String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
