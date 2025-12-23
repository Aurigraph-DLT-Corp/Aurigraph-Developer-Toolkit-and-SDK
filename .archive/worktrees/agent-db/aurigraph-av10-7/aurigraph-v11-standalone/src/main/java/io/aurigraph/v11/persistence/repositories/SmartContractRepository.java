package io.aurigraph.v11.persistence.repositories;

import io.aurigraph.v11.persistence.entities.SmartContractJpaEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Smart Contract Repository
 *
 * Provides contract lifecycle management and queries including:
 * - Contract registration and deployment
 * - Version tracking and upgrades
 * - Asset linking and relationship management
 * - Verification and audit status
 * - Network and type filtering
 *
 * @since V11.4.4
 */
@ApplicationScoped
public class SmartContractRepository implements PanacheRepositoryBase<SmartContractJpaEntity, UUID> {

    public Optional<SmartContractJpaEntity> findByContractAddress(String contractAddress) {
        return find("contractAddress", contractAddress).firstResultOptional();
    }

    public List<SmartContractJpaEntity> findByContractType(String contractType) {
        return find("contractType", Sort.by("deployedAt").descending(), contractType).list();
    }

    public List<SmartContractJpaEntity> findByBlockchainNetwork(String network) {
        return find("blockchainNetwork", Sort.by("deployedAt").descending(), network).list();
    }

    public List<SmartContractJpaEntity> findByStatus(String status) {
        return find("status", Sort.by("updatedAt").descending(), status).list();
    }

    public List<SmartContractJpaEntity> findByOwnerId(String ownerId) {
        return find("ownerId", Sort.by("deployedAt").descending(), ownerId).list();
    }

    public List<SmartContractJpaEntity> findVerified() {
        return find("verified = true", Sort.by("verifiedAt").descending()).list();
    }

    public List<SmartContractJpaEntity> findUpgradeable() {
        return find("isUpgradeable = true", Sort.by("deployedAt").descending()).list();
    }

    public List<SmartContractJpaEntity> findByVersion(String version) {
        return find("version", Sort.by("deployedAt").descending(), version).list();
    }

    public List<SmartContractJpaEntity> findDeployedAfter(Instant after) {
        return find("deployedAt > ?1", Sort.by("deployedAt").descending(), after).list();
    }

    public List<SmartContractJpaEntity> findByTenantId(String tenantId) {
        return find("tenantId", Sort.by("deployedAt").descending(), tenantId).list();
    }

    public List<SmartContractJpaEntity> findPaused() {
        return find("paused = true", Sort.by("pausedAt").descending()).list();
    }

    public List<SmartContractJpaEntity> findActive() {
        return find("deactivated = false and paused = false", Sort.by("deployedAt").descending()).list();
    }

    public boolean pauseContract(UUID id, String pausedBy) {
        return update("paused = true, pausedAt = ?1, pausedBy = ?2 where id = ?3",
                Instant.now(), pausedBy, id) > 0;
    }

    public boolean unpauseContract(UUID id) {
        return update("paused = false, pausedAt = null, pausedBy = null where id = ?1", id) > 0;
    }

    public boolean deactivateContract(UUID id, String reason) {
        return update("deactivated = true, deactivatedAt = ?1, deactivationReason = ?2 where id = ?3",
                Instant.now(), reason, id) > 0;
    }

    public long countByContractType(String contractType) {
        return count("contractType", contractType);
    }

    public long countByNetwork(String network) {
        return count("blockchainNetwork", network);
    }

    public long countVerified() {
        return count("verified = true");
    }
}
