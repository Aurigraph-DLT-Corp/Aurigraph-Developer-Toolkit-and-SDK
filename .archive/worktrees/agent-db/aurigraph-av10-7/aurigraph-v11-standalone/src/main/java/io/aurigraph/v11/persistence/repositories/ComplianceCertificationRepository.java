package io.aurigraph.v11.persistence.repositories;

import io.aurigraph.v11.persistence.entities.ComplianceCertificationJpaEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Compliance Certification Repository
 *
 * Manages multi-level compliance certifications (Levels 1-5):
 * - Certificate issuance and renewal
 * - Expiry tracking and notifications
 * - Verification status management
 * - Regulatory framework filtering
 * - Risk assessment queries
 *
 * @since V11.4.4
 */
@ApplicationScoped
public class ComplianceCertificationRepository implements PanacheRepositoryBase<ComplianceCertificationJpaEntity, UUID> {

    public Optional<ComplianceCertificationJpaEntity> findByCertificateId(String certificateId) {
        return find("certificateId", certificateId).firstResultOptional();
    }

    public List<ComplianceCertificationJpaEntity> findByComplianceLevel(Integer level) {
        return find("complianceLevel", Sort.by("issuedAt").descending(), level).list();
    }

    public List<ComplianceCertificationJpaEntity> findByEntityId(String entityId) {
        return find("entityId", Sort.by("issuedAt").descending(), entityId).list();
    }

    public List<ComplianceCertificationJpaEntity> findByStatus(String status) {
        return find("status", Sort.by("updatedAt").descending(), status).list();
    }

    public List<ComplianceCertificationJpaEntity> findByRegulatoryFramework(String framework) {
        return find("regulatoryFramework", Sort.by("issuedAt").descending(), framework).list();
    }

    public List<ComplianceCertificationJpaEntity> findVerified() {
        return find("verified = true", Sort.by("verifiedAt").descending()).list();
    }

    public List<ComplianceCertificationJpaEntity> findExpiringBefore(Instant before) {
        return find("expiresAt <= ?1 and status = 'ACTIVE'", Sort.by("expiresAt"), before).list();
    }

    public List<ComplianceCertificationJpaEntity> findExpiringSoon(int days) {
        Instant cutoff = Instant.now().plusSeconds(days * 86400L);
        return find("expiresAt <= ?1 and expiresAt > ?2 and status = 'ACTIVE'",
                Sort.by("expiresAt"), cutoff, Instant.now()).list();
    }

    public List<ComplianceCertificationJpaEntity> findByRiskLevel(String riskLevel) {
        return find("riskLevel", Sort.by("issuedAt").descending(), riskLevel).list();
    }

    public List<ComplianceCertificationJpaEntity> findByIssuerId(String issuerId) {
        return find("issuerId", Sort.by("issuedAt").descending(), issuerId).list();
    }

    public List<ComplianceCertificationJpaEntity> findByTenantId(String tenantId) {
        return find("tenantId", Sort.by("issuedAt").descending(), tenantId).list();
    }

    public List<ComplianceCertificationJpaEntity> findRevoked() {
        return find("revoked = true", Sort.by("revokedAt").descending()).list();
    }

    public List<ComplianceCertificationJpaEntity> findSuspended() {
        return find("suspended = true", Sort.by("suspendedAt").descending()).list();
    }

    public boolean revokecertificate(UUID id, String revokedBy, String reason) {
        return update("revoked = true, revokedAt = ?1, revokedBy = ?2, revocationReason = ?3, status = 'REVOKED' where id = ?4",
                Instant.now(), revokedBy, reason, id) > 0;
    }

    public boolean suspendCertificate(UUID id, String reason) {
        return update("suspended = true, suspendedAt = ?1, suspensionReason = ?2, status = 'SUSPENDED' where id = ?3",
                Instant.now(), reason, id) > 0;
    }

    public boolean unsuspendCertificate(UUID id) {
        return update("suspended = false, suspendedAt = null, suspensionReason = null, status = 'ACTIVE' where id = ?1", id) > 0;
    }

    public long countByLevel(Integer level) {
        return count("complianceLevel", level);
    }

    public long countByStatus(String status) {
        return count("status", status);
    }

    public long countExpiringSoon(int days) {
        Instant cutoff = Instant.now().plusSeconds(days * 86400L);
        return count("expiresAt <= ?1 and expiresAt > ?2 and status = 'ACTIVE'", cutoff, Instant.now());
    }
}
