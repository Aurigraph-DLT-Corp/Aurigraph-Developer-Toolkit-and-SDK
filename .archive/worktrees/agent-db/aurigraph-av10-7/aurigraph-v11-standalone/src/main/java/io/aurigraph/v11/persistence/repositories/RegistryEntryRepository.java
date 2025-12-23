package io.aurigraph.v11.persistence.repositories;

import io.aurigraph.v11.persistence.entities.RegistryEntryJpaEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Registry Entry Repository
 *
 * Generic registry for blockchain artifacts:
 * - Smart contract registrations
 * - Token contract metadata
 * - Oracle endpoints
 * - Configuration entries
 * - Feature flags
 *
 * @since V11.4.4
 */
@ApplicationScoped
public class RegistryEntryRepository implements PanacheRepositoryBase<RegistryEntryJpaEntity, UUID> {

    public Optional<RegistryEntryJpaEntity> findByKey(String key) {
        return find("registryKey", key).firstResultOptional();
    }

    public List<RegistryEntryJpaEntity> findByEntryType(String entryType) {
        return find("entryType", Sort.by("priority").descending(), entryType).list();
    }

    public List<RegistryEntryJpaEntity> findByCategory(String category) {
        return find("category", Sort.by("createdAt").descending(), category).list();
    }

    public List<RegistryEntryJpaEntity> findByStatus(String status) {
        return find("status", Sort.by("updatedAt").descending(), status).list();
    }

    public List<RegistryEntryJpaEntity> findByParentId(UUID parentId) {
        return find("parentId", Sort.by("priority"), parentId).list();
    }

    public List<RegistryEntryJpaEntity> findByBlockchainAddress(String address) {
        return find("blockchainAddress", Sort.by("createdAt").descending(), address).list();
    }

    public List<RegistryEntryJpaEntity> findByTenantId(String tenantId) {
        return find("tenantId", Sort.by("createdAt").descending(), tenantId).list();
    }

    public List<RegistryEntryJpaEntity> findActive() {
        return find("archived = false and status = 'ACTIVE'", Sort.by("priority").descending()).list();
    }

    public List<RegistryEntryJpaEntity> findArchived() {
        return find("archived = true", Sort.by("archivedAt").descending()).list();
    }

    public boolean archiveEntry(UUID id) {
        return update("archived = true, archivedAt = ?1, status = 'ARCHIVED' where id = ?2",
                java.time.Instant.now(), id) > 0;
    }

    public boolean restoreEntry(UUID id) {
        return update("archived = false, archivedAt = null, status = 'ACTIVE' where id = ?1", id) > 0;
    }

    public boolean updateVersion(UUID id, Integer newVersion) {
        return update("version = ?1, updatedAt = ?2 where id = ?3",
                newVersion, java.time.Instant.now(), id) > 0;
    }

    public long countByType(String entryType) {
        return count("entryType", entryType);
    }

    public long countByCategory(String category) {
        return count("category", category);
    }

    public long countActive() {
        return count("archived = false and status = 'ACTIVE'");
    }
}
