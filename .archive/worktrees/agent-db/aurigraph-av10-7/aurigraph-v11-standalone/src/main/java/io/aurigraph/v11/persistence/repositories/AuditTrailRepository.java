package io.aurigraph.v11.persistence.repositories;

import io.aurigraph.v11.persistence.entities.AuditTrailEntryJpaEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Audit Trail Repository
 *
 * Immutable audit log for all asset operations:
 * - CRUD operation tracking
 * - Ownership transfer history
 * - Status transition logging
 * - Compliance audit trails
 * - User action attribution
 *
 * Note: This is an append-only repository.
 * No update or delete operations are supported.
 *
 * @since V11.4.4
 */
@ApplicationScoped
public class AuditTrailRepository implements PanacheRepositoryBase<AuditTrailEntryJpaEntity, UUID> {

    public List<AuditTrailEntryJpaEntity> findByEntityId(String entityId) {
        return find("entityId", Sort.by("timestamp").descending(), entityId).list();
    }

    public List<AuditTrailEntryJpaEntity> findByEntityType(String entityType) {
        return find("entityType", Sort.by("timestamp").descending(), entityType).list();
    }

    public List<AuditTrailEntryJpaEntity> findByActionType(String actionType) {
        return find("actionType", Sort.by("timestamp").descending(), actionType).list();
    }

    public List<AuditTrailEntryJpaEntity> findByUserId(String userId) {
        return find("userId", Sort.by("timestamp").descending(), userId).list();
    }

    public List<AuditTrailEntryJpaEntity> findBySeverity(String severity) {
        return find("severity", Sort.by("timestamp").descending(), severity).list();
    }

    public List<AuditTrailEntryJpaEntity> findBySuccess(Boolean success) {
        return find("success", Sort.by("timestamp").descending(), success).list();
    }

    public List<AuditTrailEntryJpaEntity> findByTimestampRange(Instant start, Instant end) {
        return find("timestamp >= ?1 and timestamp <= ?2", Sort.by("timestamp").descending(), start, end).list();
    }

    public List<AuditTrailEntryJpaEntity> findByTenantId(String tenantId) {
        return find("tenantId", Sort.by("timestamp").descending(), tenantId).list();
    }

    public List<AuditTrailEntryJpaEntity> findVerified() {
        return find("verified = true", Sort.by("verifiedAt").descending()).list();
    }

    public List<AuditTrailEntryJpaEntity> findUnverified() {
        return find("verified = false", Sort.by("timestamp").descending()).list();
    }

    public List<AuditTrailEntryJpaEntity> findFailures() {
        return find("success = false", Sort.by("timestamp").descending()).list();
    }

    public List<AuditTrailEntryJpaEntity> findRecentEntries(int hours) {
        Instant cutoff = Instant.now().minusSeconds(hours * 3600L);
        return find("timestamp >= ?1", Sort.by("timestamp").descending(), cutoff).list();
    }

    public long countByActionType(String actionType) {
        return count("actionType", actionType);
    }

    public long countByUserId(String userId) {
        return count("userId", userId);
    }

    public long countFailures() {
        return count("success = false");
    }

    public long countByEntityId(String entityId) {
        return count("entityId", entityId);
    }

    // Note: Audit trail entries should never be deleted or updated
    // This is enforced at the service layer, but adding explicit methods here for clarity

    @Override
    @Deprecated
    public void delete(AuditTrailEntryJpaEntity entity) {
        throw new UnsupportedOperationException("Audit trail entries cannot be deleted");
    }

    @Override
    @Deprecated
    public boolean deleteById(UUID id) {
        throw new UnsupportedOperationException("Audit trail entries cannot be deleted");
    }

    @Override
    @Deprecated
    public long deleteAll() {
        throw new UnsupportedOperationException("Audit trail entries cannot be deleted");
    }
}
