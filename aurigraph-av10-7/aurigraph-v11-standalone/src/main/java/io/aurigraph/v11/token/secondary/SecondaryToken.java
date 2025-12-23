package io.aurigraph.v11.token.secondary;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Secondary Token Entity - Represents tokens derived from primary tokens
 *
 * SecondaryTokens are created from PrimaryTokens and represent specific rights:
 * - Income stream rights (rental income, dividends)
 * - Collateral positions (mortgage backing, loan security)
 * - Royalty streams (IP licensing, usage fees)
 *
 * Each SecondaryToken maintains a link to its parent PrimaryToken and
 * tracks its own lifecycle independently.
 *
 * Lifecycle: CREATED -> ACTIVE -> REDEEMED -> EXPIRED
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 * @since Sprint 2 (Week 2)
 */
@Entity
@Table(name = "secondary_tokens", indexes = {
    @Index(name = "idx_secondary_token_id", columnList = "token_id", unique = true),
    @Index(name = "idx_secondary_parent", columnList = "parent_token_id"),
    @Index(name = "idx_secondary_type", columnList = "token_type"),
    @Index(name = "idx_secondary_status", columnList = "status"),
    @Index(name = "idx_secondary_owner", columnList = "owner")
})
public class SecondaryToken extends PanacheEntity {

    /**
     * Unique token identifier format: ST-{type}-{uuid}
     * Example: ST-INCOME_STREAM-a1b2c3d4-e5f6-7g8h
     */
    @Column(name = "token_id", nullable = false, unique = true, length = 64)
    @NotBlank(message = "Token ID cannot be blank")
    public String tokenId;

    /**
     * Reference to the parent primary token
     */
    @Column(name = "parent_token_id", nullable = false, length = 64)
    @NotBlank(message = "Parent token ID is required")
    public String parentTokenId;

    /**
     * Type of secondary token
     */
    @Column(name = "token_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Token type is required")
    public SecondaryTokenType tokenType;

    /**
     * Face value of the secondary token
     */
    @Column(name = "face_value", nullable = false)
    @NotNull(message = "Face value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Face value must be positive")
    public BigDecimal faceValue;

    /**
     * Current owner of the secondary token
     */
    @Column(name = "owner", nullable = false, length = 256)
    @NotBlank(message = "Owner address is required")
    public String owner;

    /**
     * Current status of the token
     */
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    public SecondaryTokenStatus status = SecondaryTokenStatus.CREATED;

    /**
     * Revenue share percentage (0-100)
     */
    @Column(name = "revenue_share_percent")
    @DecimalMin(value = "0.0", message = "Revenue share must be non-negative")
    @DecimalMax(value = "100.0", message = "Revenue share cannot exceed 100%")
    public BigDecimal revenueSharePercent;

    /**
     * Distribution frequency for income tokens
     */
    @Column(name = "distribution_frequency", length = 50)
    @Enumerated(EnumType.STRING)
    public DistributionFrequency distributionFrequency;

    /**
     * Creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    /**
     * Last update timestamp
     */
    @Column(name = "updated_at")
    public Instant updatedAt;

    /**
     * Activation timestamp
     */
    @Column(name = "activated_at")
    public Instant activatedAt;

    /**
     * Expiration timestamp
     */
    @Column(name = "expires_at")
    public Instant expiresAt;

    /**
     * Redemption timestamp
     */
    @Column(name = "redeemed_at")
    public Instant redeemedAt;

    /**
     * Extended metadata (JSON)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    /**
     * Version for optimistic locking
     */
    @Version
    public Long version = 0L;

    // =============== CONSTRUCTORS ===============

    public SecondaryToken() {
        this.createdAt = Instant.now();
        this.status = SecondaryTokenStatus.CREATED;
    }

    public SecondaryToken(String tokenId, String parentTokenId, SecondaryTokenType tokenType,
                         BigDecimal faceValue, String owner) {
        this();
        this.tokenId = tokenId;
        this.parentTokenId = parentTokenId;
        this.tokenType = tokenType;
        this.faceValue = faceValue;
        this.owner = owner;
    }

    // =============== LIFECYCLE METHODS ===============

    /**
     * Activate the secondary token
     */
    public boolean activate() {
        if (status != SecondaryTokenStatus.CREATED) {
            throw new IllegalStateException("Cannot activate token with status: " + status);
        }
        this.status = SecondaryTokenStatus.ACTIVE;
        this.activatedAt = Instant.now();
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Redeem the secondary token
     */
    public boolean redeem() {
        if (status != SecondaryTokenStatus.ACTIVE) {
            throw new IllegalStateException("Cannot redeem token with status: " + status);
        }
        this.status = SecondaryTokenStatus.REDEEMED;
        this.redeemedAt = Instant.now();
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Expire the secondary token
     */
    public boolean expire() {
        if (status == SecondaryTokenStatus.EXPIRED || status == SecondaryTokenStatus.REDEEMED) {
            throw new IllegalStateException("Token already terminal: " + status);
        }
        this.status = SecondaryTokenStatus.EXPIRED;
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Transfer to new owner
     */
    public boolean transfer(String newOwner) {
        if (status != SecondaryTokenStatus.ACTIVE) {
            throw new IllegalStateException("Cannot transfer token with status: " + status);
        }
        this.owner = newOwner;
        this.updatedAt = Instant.now();
        return true;
    }

    // =============== QUERY METHODS ===============

    public static SecondaryToken findByTokenId(String tokenId) {
        return find("token_id", tokenId).firstResult();
    }

    public static List<SecondaryToken> findByParentTokenId(String parentTokenId) {
        return find("parent_token_id", parentTokenId).list();
    }

    public static List<SecondaryToken> findByOwner(String owner) {
        return find("owner", owner).list();
    }

    public static List<SecondaryToken> findByType(SecondaryTokenType tokenType) {
        return find("token_type", tokenType).list();
    }

    public static List<SecondaryToken> findByStatus(SecondaryTokenStatus status) {
        return find("status", status).list();
    }

    // =============== ENUMS ===============

    /**
     * Types of secondary tokens
     */
    public enum SecondaryTokenType {
        INCOME_STREAM("Income Stream", "Rights to ongoing income from the asset"),
        COLLATERAL("Collateral", "Asset pledged as loan security"),
        ROYALTY("Royalty", "Rights to royalty payments from asset usage");

        private final String displayName;
        private final String description;

        SecondaryTokenType(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    /**
     * Secondary token lifecycle status
     */
    public enum SecondaryTokenStatus {
        CREATED,   // Initial state
        ACTIVE,    // Token is active and generating value
        REDEEMED,  // Token has been redeemed
        EXPIRED    // Token has expired
    }

    /**
     * Distribution frequency for income tokens
     */
    public enum DistributionFrequency {
        DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL, ON_DEMAND
    }

    @Override
    public String toString() {
        return "SecondaryToken{" +
                "tokenId='" + tokenId + '\'' +
                ", parentTokenId='" + parentTokenId + '\'' +
                ", tokenType=" + tokenType +
                ", faceValue=" + faceValue +
                ", owner='" + owner + '\'' +
                ", status=" + status +
                '}';
    }
}
