package io.aurigraph.v11.registry;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Registered Asset entity representing assets in the tokenization platform.
 * Supports 12 asset categories with lifecycle management from draft to sale.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@Entity
@Table(name = "registered_assets", indexes = {
    @Index(name = "idx_registered_assets_category", columnList = "category"),
    @Index(name = "idx_registered_assets_status", columnList = "status"),
    @Index(name = "idx_registered_assets_owner", columnList = "owner_id"),
    @Index(name = "idx_registered_assets_created", columnList = "created_at")
})
public class RegisteredAsset extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    public UUID id;

    /**
     * Human-readable name for the asset.
     */
    @Column(name = "name", nullable = false, length = 255)
    public String name;

    /**
     * Detailed description of the asset.
     */
    @Column(name = "description", columnDefinition = "TEXT")
    public String description;

    /**
     * Category of the asset (REAL_ESTATE, CARBON_CREDITS, etc.).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    public AssetCategory category;

    /**
     * Current lifecycle status of the asset.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    public AssetStatus status = AssetStatus.DRAFT;

    /**
     * Owner's user ID (from authentication system).
     */
    @Column(name = "owner_id", nullable = false, length = 100)
    public String ownerId;

    /**
     * Owner's display name.
     */
    @Column(name = "owner_name", length = 255)
    public String ownerName;

    /**
     * Estimated value of the asset in USD.
     */
    @Column(name = "estimated_value", precision = 20, scale = 2)
    public BigDecimal estimatedValue;

    /**
     * Currency for the estimated value (default: USD).
     */
    @Column(name = "currency", length = 10)
    public String currency = "USD";

    /**
     * Physical location or jurisdiction of the asset.
     */
    @Column(name = "location", length = 255)
    public String location;

    /**
     * Country code (ISO 3166-1 alpha-2).
     */
    @Column(name = "country_code", length = 2)
    public String countryCode;

    /**
     * Flexible metadata stored as JSONB.
     * Contains category-specific fields and custom attributes.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    public Map<String, Object> metadata;

    /**
     * Token ID if the asset has been tokenized.
     */
    @Column(name = "token_id", length = 66)
    public String tokenId;

    /**
     * Smart contract ID linked to this asset.
     */
    @Column(name = "contract_id", length = 66)
    public String contractId;

    /**
     * Transaction ID of the tokenization transaction.
     */
    @Column(name = "transaction_id", length = 66)
    public String transactionId;

    /**
     * Verifier ID who verified this asset.
     */
    @Column(name = "verifier_id", length = 100)
    public String verifierId;

    /**
     * Timestamp when the asset was verified.
     */
    @Column(name = "verified_at")
    public Instant verifiedAt;

    /**
     * Timestamp when the asset was listed for sale.
     */
    @Column(name = "listed_at")
    public Instant listedAt;

    /**
     * Listing price when put on marketplace.
     */
    @Column(name = "listing_price", precision = 20, scale = 2)
    public BigDecimal listingPrice;

    /**
     * Timestamp when the asset was sold.
     */
    @Column(name = "sold_at")
    public Instant soldAt;

    /**
     * Buyer ID if sold.
     */
    @Column(name = "buyer_id", length = 100)
    public String buyerId;

    /**
     * Final sale price.
     */
    @Column(name = "sale_price", precision = 20, scale = 2)
    public BigDecimal salePrice;

    /**
     * Number of attached documents.
     */
    @Column(name = "document_count")
    public Integer documentCount = 0;

    /**
     * Number of attached images.
     */
    @Column(name = "image_count")
    public Integer imageCount = 0;

    /**
     * External reference ID (for jurisdiction APIs).
     */
    @Column(name = "external_ref", length = 255)
    public String externalRef;

    /**
     * Soft delete flag.
     */
    @Column(name = "deleted", nullable = false)
    public Boolean deleted = false;

    /**
     * Timestamp when created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    /**
     * Timestamp when last updated.
     */
    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;

    /**
     * User who created this record.
     */
    @Column(name = "created_by", length = 100)
    public String createdBy;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) {
            status = AssetStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Panache query methods

    public static RegisteredAsset findByIdNotDeleted(UUID id) {
        return find("id = ?1 and deleted = false", id).firstResult();
    }

    public static long countByCategory(AssetCategory category) {
        return count("category = ?1 and deleted = false", category);
    }

    public static long countByStatus(AssetStatus status) {
        return count("status = ?1 and deleted = false", status);
    }

    public static long countByOwner(String ownerId) {
        return count("ownerId = ?1 and deleted = false", ownerId);
    }
}
