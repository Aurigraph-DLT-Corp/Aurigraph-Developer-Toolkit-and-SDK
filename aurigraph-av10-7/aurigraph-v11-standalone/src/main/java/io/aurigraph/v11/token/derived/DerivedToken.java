package io.aurigraph.v11.token.derived;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * DerivedToken - Abstract base class for all derived tokens
 *
 * Derived tokens represent specific financial instruments or rights
 * derived from primary assets. They provide:
 * - Parent-child relationship management with PrimaryTokens
 * - Revenue distribution configuration and tracking
 * - Oracle integration framework for real-time valuations
 * - Comprehensive lifecycle management
 *
 * Lifecycle: CREATED -> ACTIVE -> REDEEMED -> EXPIRED
 *
 * Subclasses:
 * - RealEstateDerivedToken (rental income, fractional shares, appreciation, mortgage)
 * - AgriculturalDerivedToken (crop yield, harvest revenue, carbon, water rights)
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 * @since Sprint 2 (Week 2)
 */
@Entity
@Table(name = "derived_tokens", indexes = {
    @Index(name = "idx_derived_token_id", columnList = "token_id", unique = true),
    @Index(name = "idx_derived_parent", columnList = "parent_token_id"),
    @Index(name = "idx_derived_type", columnList = "derived_type"),
    @Index(name = "idx_derived_status", columnList = "status"),
    @Index(name = "idx_derived_owner", columnList = "owner"),
    @Index(name = "idx_derived_oracle", columnList = "oracle_id")
})
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "token_category", discriminatorType = DiscriminatorType.STRING)
public abstract class DerivedToken extends PanacheEntity {

    // =============== CORE IDENTIFICATION ===============

    /**
     * Unique token identifier format: DT-{category}-{type}-{uuid}
     * Example: DT-RE-RENTAL_INCOME-a1b2c3d4
     */
    @Column(name = "token_id", nullable = false, unique = true, length = 80)
    @NotBlank(message = "Token ID cannot be blank")
    public String tokenId;

    /**
     * Reference to the parent primary token
     */
    @Column(name = "parent_token_id", nullable = false, length = 64)
    @NotBlank(message = "Parent token ID is required")
    public String parentTokenId;

    /**
     * Specific type of derived token (subclass-specific)
     */
    @Column(name = "derived_type", nullable = false, length = 50)
    @NotBlank(message = "Derived type is required")
    public String derivedType;

    // =============== OWNERSHIP ===============

    /**
     * Current owner of the derived token
     */
    @Column(name = "owner", nullable = false, length = 256)
    @NotBlank(message = "Owner address is required")
    public String owner;

    /**
     * Original issuer of the token
     */
    @Column(name = "issuer", length = 256)
    public String issuer;

    // =============== VALUATION ===============

    /**
     * Face value of the derived token
     */
    @Column(name = "face_value", nullable = false, precision = 38, scale = 18)
    @NotNull(message = "Face value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Face value must be positive")
    public BigDecimal faceValue;

    /**
     * Current market value (updated via oracle)
     */
    @Column(name = "current_value", precision = 38, scale = 18)
    public BigDecimal currentValue;

    /**
     * Currency denomination (ISO 4217)
     */
    @Column(name = "currency", length = 3)
    public String currency = "USD";

    // =============== REVENUE DISTRIBUTION ===============

    /**
     * Revenue share percentage for this token (0-100)
     */
    @Column(name = "revenue_share_percent", precision = 8, scale = 4)
    @DecimalMin(value = "0.0", message = "Revenue share must be non-negative")
    @DecimalMax(value = "100.0", message = "Revenue share cannot exceed 100%")
    public BigDecimal revenueSharePercent;

    /**
     * Distribution frequency
     */
    @Column(name = "distribution_frequency", length = 20)
    @Enumerated(EnumType.STRING)
    public DistributionFrequency distributionFrequency = DistributionFrequency.MONTHLY;

    /**
     * Total revenue distributed to date
     */
    @Column(name = "total_distributed", precision = 38, scale = 18)
    public BigDecimal totalDistributed = BigDecimal.ZERO;

    /**
     * Last distribution timestamp
     */
    @Column(name = "last_distribution_at")
    public Instant lastDistributionAt;

    /**
     * Next scheduled distribution timestamp
     */
    @Column(name = "next_distribution_at")
    public Instant nextDistributionAt;

    // =============== ORACLE INTEGRATION ===============

    /**
     * Oracle identifier for price/value feeds
     */
    @Column(name = "oracle_id", length = 128)
    public String oracleId;

    /**
     * Last oracle update timestamp
     */
    @Column(name = "oracle_updated_at")
    public Instant oracleUpdatedAt;

    /**
     * Oracle confidence score (0-100)
     */
    @Column(name = "oracle_confidence", precision = 5, scale = 2)
    public BigDecimal oracleConfidence;

    /**
     * Oracle data source URL
     */
    @Column(name = "oracle_source", length = 512)
    public String oracleSource;

    // =============== LIFECYCLE ===============

    /**
     * Current status of the token
     */
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    public DerivedTokenStatus status = DerivedTokenStatus.CREATED;

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

    // =============== METADATA ===============

    /**
     * Extended metadata (JSON)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    /**
     * Compliance metadata (JSON) - transfer restrictions, accreditation, etc.
     */
    @Column(name = "compliance_metadata", columnDefinition = "TEXT")
    public String complianceMetadata;

    /**
     * Transaction hash of token creation
     */
    @Column(name = "creation_tx_hash", length = 128)
    public String creationTxHash;

    /**
     * Merkle root for integrity verification
     */
    @Column(name = "merkle_root", length = 128)
    public String merkleRoot;

    /**
     * Version for optimistic locking
     */
    @Version
    public Long version = 0L;

    // =============== CONSTRUCTORS ===============

    protected DerivedToken() {
        this.createdAt = Instant.now();
        this.status = DerivedTokenStatus.CREATED;
        this.totalDistributed = BigDecimal.ZERO;
    }

    protected DerivedToken(String tokenId, String parentTokenId, String derivedType,
                          BigDecimal faceValue, String owner) {
        this();
        this.tokenId = tokenId;
        this.parentTokenId = parentTokenId;
        this.derivedType = derivedType;
        this.faceValue = faceValue;
        this.currentValue = faceValue;
        this.owner = owner;
    }

    // =============== ABSTRACT METHODS ===============

    /**
     * Get the category of derived token (e.g., "REAL_ESTATE", "AGRICULTURAL")
     */
    public abstract String getCategory();

    /**
     * Validate token-specific business rules
     */
    public abstract ValidationResult validateSpecific();

    /**
     * Calculate the token's yield based on current conditions
     */
    public abstract BigDecimal calculateYield();

    /**
     * Get oracle feed identifiers for this token type
     */
    public abstract List<String> getOracleFeeds();

    // =============== LIFECYCLE METHODS ===============

    /**
     * Activate the derived token (CREATED -> ACTIVE)
     */
    public boolean activate() {
        if (status != DerivedTokenStatus.CREATED) {
            throw new IllegalStateException("Cannot activate token with status: " + status);
        }

        ValidationResult validation = validate();
        if (!validation.isValid()) {
            throw new IllegalStateException("Validation failed: " + validation.getErrorMessage());
        }

        this.status = DerivedTokenStatus.ACTIVE;
        this.activatedAt = Instant.now();
        this.updatedAt = Instant.now();
        calculateNextDistribution();
        return true;
    }

    /**
     * Redeem the derived token (ACTIVE -> REDEEMED)
     */
    public boolean redeem() {
        if (status != DerivedTokenStatus.ACTIVE) {
            throw new IllegalStateException("Cannot redeem token with status: " + status);
        }
        this.status = DerivedTokenStatus.REDEEMED;
        this.redeemedAt = Instant.now();
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Expire the derived token (* -> EXPIRED)
     */
    public boolean expire() {
        if (status == DerivedTokenStatus.EXPIRED || status == DerivedTokenStatus.REDEEMED) {
            throw new IllegalStateException("Token already in terminal state: " + status);
        }
        this.status = DerivedTokenStatus.EXPIRED;
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Transfer token to new owner
     */
    public boolean transfer(String newOwner) {
        if (status != DerivedTokenStatus.ACTIVE) {
            throw new IllegalStateException("Cannot transfer token with status: " + status);
        }
        if (newOwner == null || newOwner.trim().isEmpty()) {
            throw new IllegalArgumentException("New owner address cannot be empty");
        }
        this.owner = newOwner;
        this.updatedAt = Instant.now();
        return true;
    }

    // =============== REVENUE DISTRIBUTION ===============

    /**
     * Record a revenue distribution
     */
    public void recordDistribution(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Distribution amount must be positive");
        }
        this.totalDistributed = this.totalDistributed.add(amount);
        this.lastDistributionAt = Instant.now();
        this.updatedAt = Instant.now();
        calculateNextDistribution();
    }

    /**
     * Calculate next distribution date
     */
    protected void calculateNextDistribution() {
        if (distributionFrequency == null || lastDistributionAt == null) {
            return;
        }
        this.nextDistributionAt = switch (distributionFrequency) {
            case DAILY -> lastDistributionAt.plusSeconds(86400);
            case WEEKLY -> lastDistributionAt.plusSeconds(604800);
            case BIWEEKLY -> lastDistributionAt.plusSeconds(1209600);
            case MONTHLY -> lastDistributionAt.plusSeconds(2592000);
            case QUARTERLY -> lastDistributionAt.plusSeconds(7776000);
            case SEMI_ANNUAL -> lastDistributionAt.plusSeconds(15552000);
            case ANNUAL -> lastDistributionAt.plusSeconds(31536000);
            case ON_DEMAND -> null;
        };
    }

    /**
     * Calculate distribution amount based on revenue
     */
    public BigDecimal calculateDistributionAmount(BigDecimal totalRevenue) {
        if (totalRevenue == null || revenueSharePercent == null) {
            return BigDecimal.ZERO;
        }
        return totalRevenue.multiply(revenueSharePercent)
                .divide(BigDecimal.valueOf(100), 18, RoundingMode.HALF_UP);
    }

    // =============== ORACLE INTEGRATION ===============

    /**
     * Update value from oracle
     */
    public void updateFromOracle(BigDecimal newValue, BigDecimal confidence, String source) {
        if (newValue == null || newValue.signum() <= 0) {
            throw new IllegalArgumentException("Oracle value must be positive");
        }
        this.currentValue = newValue;
        this.oracleConfidence = confidence;
        this.oracleSource = source;
        this.oracleUpdatedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Check if oracle data is stale
     */
    public boolean isOracleStale(long maxAgeSeconds) {
        if (oracleUpdatedAt == null) {
            return true;
        }
        return Instant.now().minusSeconds(maxAgeSeconds).isAfter(oracleUpdatedAt);
    }

    // =============== VALIDATION ===============

    /**
     * Validate the derived token
     */
    public ValidationResult validate() {
        ValidationResult result = new ValidationResult();

        // Validate token ID format
        if (tokenId == null || !tokenId.matches("DT-[A-Z]+-[A-Z_]+-[a-f0-9\\-]+")) {
            result.addError("Invalid token ID format. Expected: DT-{category}-{type}-{uuid}");
        }

        // Validate parent reference
        if (parentTokenId == null || parentTokenId.trim().isEmpty()) {
            result.addError("Parent token ID is required");
        }

        // Validate derived type
        if (derivedType == null || derivedType.trim().isEmpty()) {
            result.addError("Derived type is required");
        }

        // Validate face value
        if (faceValue == null || faceValue.signum() <= 0) {
            result.addError("Face value must be positive");
        }

        // Validate owner
        if (owner == null || owner.trim().isEmpty()) {
            result.addError("Owner address is required");
        }

        // Validate revenue share if set
        if (revenueSharePercent != null) {
            if (revenueSharePercent.compareTo(BigDecimal.ZERO) < 0 ||
                revenueSharePercent.compareTo(BigDecimal.valueOf(100)) > 0) {
                result.addError("Revenue share must be between 0 and 100");
            }
        }

        // Run subclass-specific validation
        ValidationResult specificResult = validateSpecific();
        result.addAll(specificResult);

        return result;
    }

    // =============== QUERY METHODS ===============

    public static DerivedToken findByTokenId(String tokenId) {
        return find("token_id", tokenId).firstResult();
    }

    public static List<DerivedToken> findByParentTokenId(String parentTokenId) {
        return find("parent_token_id", parentTokenId).list();
    }

    public static List<DerivedToken> findByOwner(String owner) {
        return find("owner", owner).list();
    }

    public static List<DerivedToken> findByStatus(DerivedTokenStatus status) {
        return find("status", status).list();
    }

    public static List<DerivedToken> findByDerivedType(String derivedType) {
        return find("derived_type", derivedType).list();
    }

    public static List<DerivedToken> findDueForDistribution() {
        return find("status = ?1 AND next_distribution_at <= ?2",
                DerivedTokenStatus.ACTIVE, Instant.now()).list();
    }

    // =============== INNER CLASSES ===============

    /**
     * Derived token lifecycle status
     */
    public enum DerivedTokenStatus {
        CREATED("Created", "Token created but not yet active"),
        ACTIVE("Active", "Token is active and generating value"),
        REDEEMED("Redeemed", "Token has been redeemed"),
        EXPIRED("Expired", "Token has expired");

        private final String displayName;
        private final String description;

        DerivedTokenStatus(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }

        public boolean isTerminal() {
            return this == REDEEMED || this == EXPIRED;
        }
    }

    /**
     * Distribution frequency options
     */
    public enum DistributionFrequency {
        DAILY("Daily", 1),
        WEEKLY("Weekly", 7),
        BIWEEKLY("Bi-weekly", 14),
        MONTHLY("Monthly", 30),
        QUARTERLY("Quarterly", 90),
        SEMI_ANNUAL("Semi-annual", 180),
        ANNUAL("Annual", 365),
        ON_DEMAND("On-demand", 0);

        private final String displayName;
        private final int intervalDays;

        DistributionFrequency(String displayName, int intervalDays) {
            this.displayName = displayName;
            this.intervalDays = intervalDays;
        }

        public String getDisplayName() { return displayName; }
        public int getIntervalDays() { return intervalDays; }
    }

    /**
     * Validation result container
     */
    public static class ValidationResult {
        private final List<String> errors = new ArrayList<>();
        private boolean valid = true;

        public void addError(String error) {
            errors.add(error);
            valid = false;
        }

        public void addAll(ValidationResult other) {
            if (other != null && !other.isValid()) {
                this.errors.addAll(other.getErrors());
                this.valid = false;
            }
        }

        public boolean isValid() { return valid; }
        public List<String> getErrors() { return Collections.unmodifiableList(errors); }
        public String getErrorMessage() { return String.join("; ", errors); }
    }

    // =============== UTILITY METHODS ===============

    @Override
    public String toString() {
        return getClass().getSimpleName() + "{" +
                "tokenId='" + tokenId + '\'' +
                ", parentTokenId='" + parentTokenId + '\'' +
                ", derivedType='" + derivedType + '\'' +
                ", faceValue=" + faceValue +
                ", currentValue=" + currentValue +
                ", owner='" + owner + '\'' +
                ", status=" + status +
                ", revenueSharePercent=" + revenueSharePercent +
                '}';
    }
}
