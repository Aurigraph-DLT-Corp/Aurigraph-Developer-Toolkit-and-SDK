package io.aurigraph.v11.persistence.repositories;

import io.aurigraph.v11.persistence.entities.AssetTraceJpaEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Asset Trace Repository
 *
 * Panache-based repository providing 20+ query methods for asset traceability:
 *
 * Core Operations:
 * - CRUD operations with UUID primary keys
 * - Asset lookup by ID, type, status, owner
 * - Location-based queries (geospatial)
 * - Batch and serial number searches
 * - Compliance and verification queries
 *
 * Advanced Features:
 * - Multi-criteria filtering
 * - Pagination and sorting support
 * - Tenant isolation
 * - Archive management
 * - Performance-optimized queries
 *
 * Performance Targets:
 * - Single record query: <50ms
 * - List queries: <100ms for 100 records
 * - Bulk operations: 1000+ records/second
 *
 * @since V11.4.4
 */
@ApplicationScoped
public class AssetTraceRepository implements PanacheRepositoryBase<AssetTraceJpaEntity, UUID> {

    // ==================== BASIC CRUD ====================

    /**
     * Find asset by asset ID (business identifier)
     */
    public Optional<AssetTraceJpaEntity> findByAssetId(String assetId) {
        return find("assetId", assetId).firstResultOptional();
    }

    /**
     * Find asset by serial number
     */
    public Optional<AssetTraceJpaEntity> findBySerialNumber(String serialNumber) {
        return find("serialNumber", serialNumber).firstResultOptional();
    }

    /**
     * Find asset by blockchain transaction hash
     */
    public Optional<AssetTraceJpaEntity> findByBlockchainTxHash(String txHash) {
        return find("blockchainTxHash", txHash).firstResultOptional();
    }

    // ==================== FILTERING QUERIES ====================

    /**
     * Find all assets by type
     */
    public List<AssetTraceJpaEntity> findByAssetType(String assetType) {
        return find("assetType", Sort.by("createdAt").descending(), assetType).list();
    }

    /**
     * Find all assets with specific status
     */
    public List<AssetTraceJpaEntity> findByStatus(String status) {
        return find("status", Sort.by("updatedAt").descending(), status).list();
    }

    /**
     * Find all assets owned by a specific owner
     */
    public List<AssetTraceJpaEntity> findByCurrentOwnerId(String ownerId) {
        return find("currentOwnerId", Sort.by("createdAt").descending(), ownerId).list();
    }

    /**
     * Find all assets in a specific batch
     */
    public List<AssetTraceJpaEntity> findByBatchId(String batchId) {
        return find("batchId", Sort.by("createdAt"), batchId).list();
    }

    /**
     * Find all assets by manufacturer
     */
    public List<AssetTraceJpaEntity> findByManufacturer(String manufacturer) {
        return find("manufacturer", Sort.by("manufactureDate").descending(), manufacturer).list();
    }

    // ==================== LOCATION QUERIES ====================

    /**
     * Find all assets at a specific location
     */
    public List<AssetTraceJpaEntity> findByLocation(String location) {
        return find("currentLocation", Sort.by("updatedAt").descending(), location).list();
    }

    /**
     * Find assets within a bounding box (geospatial query)
     */
    public List<AssetTraceJpaEntity> findByLocationBounds(
            BigDecimal minLat, BigDecimal maxLat,
            BigDecimal minLon, BigDecimal maxLon) {
        return find("latitude >= ?1 and latitude <= ?2 and longitude >= ?3 and longitude <= ?4",
                minLat, maxLat, minLon, maxLon).list();
    }

    // ==================== COMPLIANCE QUERIES ====================

    /**
     * Find all assets with verified chain of custody
     */
    public List<AssetTraceJpaEntity> findVerifiedChainOfCustody() {
        return find("chainOfCustodyVerified = true", Sort.by("updatedAt").descending()).list();
    }

    /**
     * Find all assets by compliance status
     */
    public List<AssetTraceJpaEntity> findByComplianceStatus(String complianceStatus) {
        return find("complianceStatus", Sort.by("updatedAt").descending(), complianceStatus).list();
    }

    /**
     * Find all assets under a specific regulatory framework
     */
    public List<AssetTraceJpaEntity> findByRegulatoryFramework(String framework) {
        return find("regulatoryFramework", Sort.by("createdAt").descending(), framework).list();
    }

    // ==================== TIME-BASED QUERIES ====================

    /**
     * Find assets created after a specific date
     */
    public List<AssetTraceJpaEntity> findCreatedAfter(Instant after) {
        return find("createdAt > ?1", Sort.by("createdAt").descending(), after).list();
    }

    /**
     * Find assets updated within a time range
     */
    public List<AssetTraceJpaEntity> findUpdatedBetween(Instant start, Instant end) {
        return find("updatedAt >= ?1 and updatedAt <= ?2", Sort.by("updatedAt").descending(), start, end).list();
    }

    /**
     * Find assets expiring within a time window
     */
    public List<AssetTraceJpaEntity> findExpiringBetween(Instant start, Instant end) {
        return find("expiryDate >= ?1 and expiryDate <= ?2", Sort.by("expiryDate"), start, end).list();
    }

    // ==================== MULTI-TENANT QUERIES ====================

    /**
     * Find all assets for a specific tenant
     */
    public List<AssetTraceJpaEntity> findByTenantId(String tenantId) {
        return find("tenantId", Sort.by("createdAt").descending(), tenantId).list();
    }

    /**
     * Find non-archived assets for a tenant
     */
    public List<AssetTraceJpaEntity> findActiveByTenantId(String tenantId) {
        return find("tenantId = ?1 and archived = false", Sort.by("createdAt").descending(), tenantId).list();
    }

    // ==================== ARCHIVE MANAGEMENT ====================

    /**
     * Find all archived assets
     */
    public List<AssetTraceJpaEntity> findArchived() {
        return find("archived = true", Sort.by("archivedAt").descending()).list();
    }

    /**
     * Archive an asset by ID
     */
    public boolean archiveAsset(UUID id) {
        return update("archived = true, archivedAt = ?1 where id = ?2", Instant.now(), id) > 0;
    }

    /**
     * Restore an archived asset
     */
    public boolean restoreAsset(UUID id) {
        return update("archived = false, archivedAt = null where id = ?1", id) > 0;
    }

    // ==================== COMPLEX QUERIES ====================

    /**
     * Search assets by multiple criteria
     */
    public List<AssetTraceJpaEntity> searchAssets(
            String assetType,
            String status,
            String ownerId,
            String location,
            Boolean archived) {
        StringBuilder query = new StringBuilder("1=1");
        Object[] params = new Object[5];
        int paramIndex = 0;

        if (assetType != null && !assetType.isEmpty()) {
            query.append(" and assetType = ?").append(++paramIndex);
            params[paramIndex - 1] = assetType;
        }
        if (status != null && !status.isEmpty()) {
            query.append(" and status = ?").append(++paramIndex);
            params[paramIndex - 1] = status;
        }
        if (ownerId != null && !ownerId.isEmpty()) {
            query.append(" and currentOwnerId = ?").append(++paramIndex);
            params[paramIndex - 1] = ownerId;
        }
        if (location != null && !location.isEmpty()) {
            query.append(" and currentLocation = ?").append(++paramIndex);
            params[paramIndex - 1] = location;
        }
        if (archived != null) {
            query.append(" and archived = ?").append(++paramIndex);
            params[paramIndex - 1] = archived;
        }

        Object[] actualParams = new Object[paramIndex];
        System.arraycopy(params, 0, actualParams, 0, paramIndex);

        return find(query.toString(), Sort.by("createdAt").descending(), actualParams).list();
    }

    /**
     * Count assets by type
     */
    public long countByAssetType(String assetType) {
        return count("assetType", assetType);
    }

    /**
     * Count assets by status
     */
    public long countByStatus(String status) {
        return count("status", status);
    }

    /**
     * Count assets by owner
     */
    public long countByOwnerId(String ownerId) {
        return count("currentOwnerId", ownerId);
    }

    /**
     * Find recently updated assets (last N days)
     */
    public List<AssetTraceJpaEntity> findRecentlyUpdated(int days) {
        Instant cutoff = Instant.now().minusSeconds(days * 86400L);
        return find("updatedAt >= ?1", Sort.by("updatedAt").descending(), cutoff).list();
    }
}
