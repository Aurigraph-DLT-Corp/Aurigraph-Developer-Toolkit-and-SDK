package io.aurigraph.v11.registry;

import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing registered assets in the tokenization platform.
 * Provides CRUD operations, search, and lifecycle management.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@ApplicationScoped
public class AssetRegistryService {

    private static final Logger LOG = Logger.getLogger(AssetRegistryService.class);

    /**
     * Register a new asset.
     */
    @Transactional
    public RegisteredAsset registerAsset(
            String name,
            String description,
            AssetCategory category,
            String ownerId,
            String ownerName,
            BigDecimal estimatedValue,
            String currency,
            String location,
            String countryCode,
            Map<String, Object> metadata) {

        LOG.infof("Registering new asset: %s, category: %s, owner: %s", name, category, ownerId);

        RegisteredAsset asset = new RegisteredAsset();
        asset.name = name;
        asset.description = description;
        asset.category = category;
        asset.status = AssetStatus.DRAFT;
        asset.ownerId = ownerId;
        asset.ownerName = ownerName;
        asset.estimatedValue = estimatedValue;
        asset.currency = currency != null ? currency : "USD";
        asset.location = location;
        asset.countryCode = countryCode;
        asset.metadata = metadata;
        asset.createdBy = ownerId;
        asset.deleted = false;
        asset.documentCount = 0;
        asset.imageCount = 0;

        asset.persist();

        LOG.infof("Asset registered successfully: %s", asset.id);
        return asset;
    }

    /**
     * Update an existing asset.
     */
    @Transactional
    public RegisteredAsset updateAsset(
            UUID id,
            String name,
            String description,
            BigDecimal estimatedValue,
            String location,
            String countryCode,
            Map<String, Object> metadata) {

        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (asset.status != AssetStatus.DRAFT && asset.status != AssetStatus.REJECTED) {
            throw new IllegalStateException("Cannot update asset in status: " + asset.status);
        }

        if (name != null) asset.name = name;
        if (description != null) asset.description = description;
        if (estimatedValue != null) asset.estimatedValue = estimatedValue;
        if (location != null) asset.location = location;
        if (countryCode != null) asset.countryCode = countryCode;
        if (metadata != null) asset.metadata = metadata;

        LOG.infof("Asset updated: %s", id);
        return asset;
    }

    /**
     * Get asset by ID.
     */
    public Optional<RegisteredAsset> getAssetById(UUID id) {
        return Optional.ofNullable(RegisteredAsset.findByIdNotDeleted(id));
    }

    /**
     * Soft delete an asset.
     */
    @Transactional
    public void deleteAsset(UUID id) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        asset.deleted = true;
        LOG.infof("Asset soft deleted: %s", id);
    }

    /**
     * List assets with filters and pagination.
     */
    public List<RegisteredAsset> listAssets(
            AssetCategory category,
            AssetStatus status,
            String ownerId,
            int page,
            int size) {

        StringBuilder query = new StringBuilder("deleted = false");

        if (category != null) {
            query.append(" and category = '").append(category.name()).append("'");
        }
        if (status != null) {
            query.append(" and status = '").append(status.name()).append("'");
        }
        if (ownerId != null && !ownerId.isEmpty()) {
            query.append(" and ownerId = '").append(ownerId).append("'");
        }

        return RegisteredAsset.find(query.toString(), Sort.by("createdAt").descending())
                .page(Page.of(page, size))
                .list();
    }

    /**
     * Count assets by filters.
     */
    public long countAssets(AssetCategory category, AssetStatus status, String ownerId) {
        StringBuilder query = new StringBuilder("deleted = false");

        if (category != null) {
            query.append(" and category = '").append(category.name()).append("'");
        }
        if (status != null) {
            query.append(" and status = '").append(status.name()).append("'");
        }
        if (ownerId != null && !ownerId.isEmpty()) {
            query.append(" and ownerId = '").append(ownerId).append("'");
        }

        return RegisteredAsset.count(query.toString());
    }

    /**
     * Get assets by owner.
     */
    public List<RegisteredAsset> getAssetsByOwner(String ownerId, int page, int size) {
        return listAssets(null, null, ownerId, page, size);
    }

    /**
     * Submit asset for verification.
     */
    @Transactional
    public RegisteredAsset submitForVerification(UUID id) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (!asset.status.canTransitionTo(AssetStatus.SUBMITTED)) {
            throw new IllegalStateException("Cannot submit asset in status: " + asset.status);
        }

        asset.status = AssetStatus.SUBMITTED;
        LOG.infof("Asset submitted for verification: %s", id);
        return asset;
    }

    /**
     * Mark asset as verified.
     */
    @Transactional
    public RegisteredAsset markVerified(UUID id, String verifierId) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (!asset.status.canTransitionTo(AssetStatus.VERIFIED)) {
            throw new IllegalStateException("Cannot verify asset in status: " + asset.status);
        }

        asset.status = AssetStatus.VERIFIED;
        asset.verifierId = verifierId;
        asset.verifiedAt = Instant.now();

        LOG.infof("Asset verified: %s by %s", id, verifierId);
        return asset;
    }

    /**
     * Reject asset verification.
     */
    @Transactional
    public RegisteredAsset rejectVerification(UUID id, String verifierId, String reason) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (!asset.status.canTransitionTo(AssetStatus.REJECTED)) {
            throw new IllegalStateException("Cannot reject asset in status: " + asset.status);
        }

        asset.status = AssetStatus.REJECTED;
        asset.verifierId = verifierId;

        // Store rejection reason in metadata
        if (asset.metadata == null) {
            asset.metadata = Map.of("rejectionReason", reason);
        } else {
            asset.metadata.put("rejectionReason", reason);
        }

        LOG.infof("Asset verification rejected: %s, reason: %s", id, reason);
        return asset;
    }

    /**
     * List asset for sale.
     */
    @Transactional
    public RegisteredAsset listForSale(UUID id, BigDecimal listingPrice) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (!asset.status.canTransitionTo(AssetStatus.LISTED)) {
            throw new IllegalStateException("Cannot list asset in status: " + asset.status);
        }

        asset.status = AssetStatus.LISTED;
        asset.listingPrice = listingPrice;
        asset.listedAt = Instant.now();

        LOG.infof("Asset listed for sale: %s at %s %s", id, listingPrice, asset.currency);
        return asset;
    }

    /**
     * Mark asset as sold.
     */
    @Transactional
    public RegisteredAsset markSold(UUID id, String buyerId, BigDecimal salePrice) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (!asset.status.canTransitionTo(AssetStatus.SOLD)) {
            throw new IllegalStateException("Cannot mark sold asset in status: " + asset.status);
        }

        asset.status = AssetStatus.SOLD;
        asset.buyerId = buyerId;
        asset.salePrice = salePrice;
        asset.soldAt = Instant.now();

        LOG.infof("Asset sold: %s to %s for %s %s", id, buyerId, salePrice, asset.currency);
        return asset;
    }

    /**
     * Archive an asset.
     */
    @Transactional
    public RegisteredAsset archive(UUID id) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        if (!asset.status.canTransitionTo(AssetStatus.ARCHIVED)) {
            throw new IllegalStateException("Cannot archive asset in status: " + asset.status);
        }

        asset.status = AssetStatus.ARCHIVED;
        LOG.infof("Asset archived: %s", id);
        return asset;
    }

    /**
     * Link asset to token.
     */
    @Transactional
    public RegisteredAsset linkToToken(UUID id, String tokenId, String contractId, String transactionId) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        asset.tokenId = tokenId;
        asset.contractId = contractId;
        asset.transactionId = transactionId;

        LOG.infof("Asset linked to token: %s -> %s", id, tokenId);
        return asset;
    }

    /**
     * Update document and image counts.
     */
    @Transactional
    public void updateAttachmentCounts(UUID id, int documentCount, int imageCount) {
        RegisteredAsset asset = getAssetById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + id));

        asset.documentCount = documentCount;
        asset.imageCount = imageCount;
    }

    /**
     * Get statistics by category.
     */
    public Map<String, Long> getStatsByCategory() {
        return Map.ofEntries(
            Map.entry("REAL_ESTATE", RegisteredAsset.countByCategory(AssetCategory.REAL_ESTATE)),
            Map.entry("CARBON_CREDITS", RegisteredAsset.countByCategory(AssetCategory.CARBON_CREDITS)),
            Map.entry("INTELLECTUAL_PROPERTY", RegisteredAsset.countByCategory(AssetCategory.INTELLECTUAL_PROPERTY)),
            Map.entry("FINANCIAL_SECURITIES", RegisteredAsset.countByCategory(AssetCategory.FINANCIAL_SECURITIES)),
            Map.entry("ART_COLLECTIBLES", RegisteredAsset.countByCategory(AssetCategory.ART_COLLECTIBLES)),
            Map.entry("COMMODITIES", RegisteredAsset.countByCategory(AssetCategory.COMMODITIES)),
            Map.entry("SUPPLY_CHAIN", RegisteredAsset.countByCategory(AssetCategory.SUPPLY_CHAIN)),
            Map.entry("INFRASTRUCTURE", RegisteredAsset.countByCategory(AssetCategory.INFRASTRUCTURE)),
            Map.entry("ENERGY_ASSETS", RegisteredAsset.countByCategory(AssetCategory.ENERGY_ASSETS)),
            Map.entry("AGRICULTURAL", RegisteredAsset.countByCategory(AssetCategory.AGRICULTURAL)),
            Map.entry("INSURANCE_PRODUCTS", RegisteredAsset.countByCategory(AssetCategory.INSURANCE_PRODUCTS)),
            Map.entry("RECEIVABLES", RegisteredAsset.countByCategory(AssetCategory.RECEIVABLES))
        );
    }

    /**
     * Get statistics by status.
     */
    public Map<String, Long> getStatsByStatus() {
        return Map.of(
            "DRAFT", RegisteredAsset.countByStatus(AssetStatus.DRAFT),
            "SUBMITTED", RegisteredAsset.countByStatus(AssetStatus.SUBMITTED),
            "VERIFIED", RegisteredAsset.countByStatus(AssetStatus.VERIFIED),
            "REJECTED", RegisteredAsset.countByStatus(AssetStatus.REJECTED),
            "LISTED", RegisteredAsset.countByStatus(AssetStatus.LISTED),
            "SOLD", RegisteredAsset.countByStatus(AssetStatus.SOLD),
            "ARCHIVED", RegisteredAsset.countByStatus(AssetStatus.ARCHIVED)
        );
    }
}
