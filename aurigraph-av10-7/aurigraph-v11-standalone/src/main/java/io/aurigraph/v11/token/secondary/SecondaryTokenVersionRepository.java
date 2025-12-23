package io.aurigraph.v11.token.secondary;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Secondary Token Version Repository - Sprint 1 Task 1.3
 * AV11-601: Secondary Token Versioning Initiative
 *
 * Provides database access methods for SecondaryTokenVersion entities
 * using Quarkus Panache pattern.
 *
 * Key Features:
 * - Version number queries (max, range)
 * - Status-based filtering
 * - VVB status queries
 * - Token-based lookups
 *
 * Performance:
 * - All queries indexed for O(1) or O(log n) lookups
 * - Batch operations supported
 *
 * @author Aurigraph Team - Sprint 1 Task 1.3
 * @version 1.0
 * @since Sprint 1 (Week 1-2)
 */
@ApplicationScoped
public class SecondaryTokenVersionRepository implements PanacheRepository<SecondaryTokenVersion> {

    /**
     * Find a version by UUID ID
     * Override to properly handle UUID-based lookups
     *
     * @param id The version UUID
     * @return Optional containing the version if found
     */
    public Optional<SecondaryTokenVersion> findByIdOptional(UUID id) {
        return find("id = ?1", id).firstResultOptional();
    }

    /**
     * Find maximum version number for a token
     * Used to determine next version number when creating new versions
     *
     * @param tokenId The secondary token ID
     * @return Optional containing max version number, empty if no versions exist
     */
    public Optional<Integer> findMaxVersionNumberByTokenId(UUID tokenId) {
        Integer max = find("SELECT MAX(v.versionNumber) FROM SecondaryTokenVersion v WHERE v.secondaryTokenId = ?1", tokenId)
                .project(Integer.class)
                .firstResult();
        return Optional.ofNullable(max);
    }

    /**
     * Find all versions for a token, ordered by version number ascending (oldest to newest)
     *
     * @param tokenId The secondary token ID
     * @return List of versions in chronological order
     */
    public List<SecondaryTokenVersion> findByTokenIdOrderByVersionNumber(UUID tokenId) {
        return find("secondaryTokenId = ?1 ORDER BY versionNumber ASC", tokenId).list();
    }

    /**
     * Find a specific version by token ID and status
     *
     * @param tokenId The secondary token ID
     * @param status The status to filter by
     * @return Optional containing matching version
     */
    public Optional<SecondaryTokenVersion> findByTokenIdAndStatus(UUID tokenId, SecondaryTokenVersionStatus status) {
        return find("secondaryTokenId = ?1 AND status = ?2", tokenId, status).firstResultOptional();
    }

    /**
     * Find all versions by token ID and status
     *
     * @param tokenId The secondary token ID
     * @param status The status to filter by
     * @return List of matching versions
     */
    public List<SecondaryTokenVersion> findAllByTokenIdAndStatus(UUID tokenId, SecondaryTokenVersionStatus status) {
        return find("secondaryTokenId = ?1 AND status = ?2", tokenId, status).list();
    }

    /**
     * Find all versions with a specific VVB status
     * Used for batch VVB processing
     *
     * @param vvbStatus The VVB status to filter by
     * @return List of matching versions
     */
    public List<SecondaryTokenVersion> findByVVBStatus(VVBStatus vvbStatus) {
        return find("vvbRequired = true AND vvbApprovedAt IS NULL ORDER BY createdAt ASC").list();
    }

    /**
     * Count total versions for a token
     *
     * @param tokenId The secondary token ID
     * @return Number of versions
     */
    public long countByTokenId(UUID tokenId) {
        return count("secondaryTokenId = ?1", tokenId);
    }

    /**
     * Find versions by creator
     *
     * @param createdBy Creator identifier
     * @return List of versions created by this user/system
     */
    public List<SecondaryTokenVersion> findByCreatedBy(String createdBy) {
        return find("createdBy = ?1 ORDER BY createdAt DESC", createdBy).list();
    }

    /**
     * Find the latest version for a token
     *
     * @param tokenId The secondary token ID
     * @return Optional containing the latest version
     */
    public Optional<SecondaryTokenVersion> findLatestByTokenId(UUID tokenId) {
        return find("secondaryTokenId = ?1 ORDER BY versionNumber DESC", tokenId)
                .firstResultOptional();
    }

    /**
     * Find active (non-archived) versions for a token
     *
     * @param tokenId The secondary token ID
     * @return List of active versions
     */
    public List<SecondaryTokenVersion> findActiveByTokenId(UUID tokenId) {
        return find("secondaryTokenId = ?1 AND archivedAt IS NULL ORDER BY versionNumber DESC", tokenId)
                .list();
    }

    /**
     * Find versions by change type
     *
     * @param changeType The change type to filter by
     * @return List of matching versions
     */
    public List<SecondaryTokenVersion> findByChangeType(VersionChangeType changeType) {
        return find("changeType = ?1 ORDER BY createdAt DESC", changeType).list();
    }

    /**
     * Find versions requiring VVB approval (pending)
     *
     * @return List of versions awaiting VVB approval
     */
    public List<SecondaryTokenVersion> findPendingVVBApproval() {
        return find("vvbRequired = true AND vvbApprovedAt IS NULL ORDER BY createdAt ASC").list();
    }

    /**
     * Find versions created within a time range
     *
     * @param startTime Start of time range
     * @param endTime End of time range
     * @return List of versions created in the range
     */
    public List<SecondaryTokenVersion> findByCreatedAtBetween(java.time.Instant startTime, java.time.Instant endTime) {
        return find("createdAt >= ?1 AND createdAt <= ?2 ORDER BY createdAt DESC",
                java.time.ZonedDateTime.ofInstant(startTime, java.time.ZoneOffset.UTC),
                java.time.ZonedDateTime.ofInstant(endTime, java.time.ZoneOffset.UTC))
                .list();
    }

    /**
     * Delete all versions for a token (cascade delete)
     * WARNING: This is a destructive operation
     *
     * @param tokenId The secondary token ID
     * @return Number of versions deleted
     */
    public long deleteByTokenId(UUID tokenId) {
        return delete("secondaryTokenId = ?1", tokenId);
    }
}
