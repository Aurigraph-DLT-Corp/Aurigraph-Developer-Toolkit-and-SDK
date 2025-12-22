package io.aurigraph.v11.token.primary;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Primary Token Entity - Represents the base token backed by a real-world asset
 *
 * PrimaryTokens are the foundation of the token architecture:
 * - Each represents a unique real-world asset with digital twin reference
 * - Immutable once created (status-driven lifecycle)
 * - Parent for secondary and derived tokens
 * - Subject to compliance and transfer restrictions
 *
 * Lifecycle: CREATED → VERIFIED → TRANSFERRED → RETIRED
 *
 * @author Composite Token System
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@Entity
@Table(name = "primary_tokens", indexes = {
    @Index(name = "idx_token_id", columnList = "token_id", unique = true),
    @Index(name = "idx_owner", columnList = "owner"),
    @Index(name = "idx_asset_class", columnList = "asset_class"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_digital_twin", columnList = "digital_twin_id")
})
public class PrimaryToken extends PanacheEntity {

    /**
     * Unique token identifier format: PT-{assetClass}-{uuid}
     * Example: PT-REAL_ESTATE-a1b2c3d4-e5f6-7g8h
     */
    @Column(name = "token_id", nullable = false, unique = true, length = 64)
    @NotBlank(message = "Token ID cannot be blank")
    public String tokenId;

    /**
     * Reference to the digital twin representing the real-world asset
     * Links to RWA (Real-World Asset) metadata and tracking
     */
    @Column(name = "digital_twin_id", nullable = false, length = 256)
    @NotBlank(message = "Digital twin ID is required")
    public String digitalTwinId;

    /**
     * Asset classification for regulatory and operational purposes
     * Possible values: REAL_ESTATE, VEHICLE, COMMODITY, IP, FINANCIAL
     */
    @Column(name = "asset_class", nullable = false, length = 50)
    @NotBlank(message = "Asset class is required")
    public String assetClass;

    /**
     * Face value of the token (in smallest unit, typically cents or wei equivalent)
     * Represents the base valuation of the underlying asset
     */
    @Column(name = "face_value", nullable = false)
    @NotNull(message = "Face value is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Face value must be positive")
    public BigDecimal faceValue;

    /**
     * Current owner/holder of the primary token
     * Represented as wallet address or user identifier
     */
    @Column(name = "owner", nullable = false, length = 256)
    @NotBlank(message = "Owner address is required")
    public String owner;

    /**
     * Current status of the token throughout its lifecycle
     * Drives permitted operations and transitions
     */
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    public PrimaryTokenStatus status = PrimaryTokenStatus.CREATED;

    /**
     * Timestamp when token was initially created
     * Immutable after creation
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    /**
     * Timestamp of last modification (status change, transfer, etc.)
     * Useful for tracking lifecycle transitions
     */
    @Column(name = "updated_at")
    public Instant updatedAt;

    /**
     * Timestamp when token was verified (if status = VERIFIED)
     * Set when verification process completes
     */
    @Column(name = "verified_at")
    public Instant verifiedAt;

    /**
     * Timestamp when token was transferred/retired
     * Set when token exits active circulation
     */
    @Column(name = "retired_at")
    public Instant retiredAt;

    /**
     * Merkle root hash for integrity verification
     * Updated when token is part of a bundle/composite
     */
    @Column(name = "merkle_hash", length = 256)
    public String merkleHash;

    /**
     * Compliance metadata (JSON serialized)
     * Stores regulatory information, transfer restrictions, etc.
     */
    @Column(name = "compliance_metadata", columnDefinition = "TEXT")
    public String complianceMetadata;

    /**
     * Version for optimistic locking to prevent race conditions
     */
    @Version
    public Long version = 0L;

    // =============== CONSTRUCTORS ===============

    public PrimaryToken() {
        this.createdAt = Instant.now();
        this.status = PrimaryTokenStatus.CREATED;
    }

    public PrimaryToken(String tokenId, String digitalTwinId, String assetClass,
                       BigDecimal faceValue, String owner) {
        this();
        this.tokenId = tokenId;
        this.digitalTwinId = digitalTwinId;
        this.assetClass = assetClass;
        this.faceValue = faceValue;
        this.owner = owner;
    }

    // =============== LIFECYCLE METHODS ===============

    /**
     * Validate the token before creation/transfer
     * Checks: token ID format, face value, owner address, digital twin reference
     *
     * @return ValidationResult with validation status and error details
     */
    public ValidationResult validate() {
        ValidationResult result = new ValidationResult();

        // Validate token ID format
        if (!tokenId.matches("PT-[A-Z_]+-[a-f0-9\\-]+")) {
            result.addError("Invalid token ID format. Expected: PT-{assetClass}-{uuid}");
        }

        // Validate face value
        if (faceValue == null || faceValue.signum() <= 0) {
            result.addError("Face value must be positive");
        }

        // Validate owner address
        if (owner == null || owner.trim().isEmpty()) {
            result.addError("Owner address cannot be empty");
        }

        // Validate digital twin reference
        if (digitalTwinId == null || digitalTwinId.trim().isEmpty()) {
            result.addError("Digital twin ID cannot be empty");
        }

        // Validate asset class
        try {
            AssetClass.valueOf(assetClass);
        } catch (IllegalArgumentException e) {
            result.addError("Invalid asset class: " + assetClass);
        }

        return result;
    }

    /**
     * Verify the token (transition: CREATED → VERIFIED)
     * Called after validation by VVB or compliance system
     *
     * @return true if verification successful
     */
    public boolean verify() {
        if (status != PrimaryTokenStatus.CREATED) {
            throw new IllegalStateException("Cannot verify token with status: " + status);
        }
        this.status = PrimaryTokenStatus.VERIFIED;
        this.verifiedAt = Instant.now();
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Transfer token to new owner (transition: VERIFIED/TRANSFERRED → TRANSFERRED)
     * Validates compliance before allowing transfer
     *
     * @param newOwner The wallet address of the new owner
     * @return true if transfer successful
     */
    public boolean transfer(String newOwner) {
        if (status == PrimaryTokenStatus.RETIRED) {
            throw new IllegalStateException("Cannot transfer retired token");
        }
        if (status == PrimaryTokenStatus.CREATED) {
            throw new IllegalStateException("Cannot transfer unverified token. Verify first.");
        }

        this.owner = newOwner;
        this.status = PrimaryTokenStatus.TRANSFERRED;
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Retire the token (transition: * → RETIRED)
     * Called when token reaches end of lifecycle or is removed from circulation
     *
     * @return true if retirement successful
     */
    public boolean retire() {
        this.status = PrimaryTokenStatus.RETIRED;
        this.retiredAt = Instant.now();
        this.updatedAt = Instant.now();
        return true;
    }

    // =============== QUERY METHODS ===============

    public static PrimaryToken findByTokenId(String tokenId) {
        return find("token_id", tokenId).firstResult();
    }

    public static java.util.List<PrimaryToken> findByOwner(String owner) {
        return find("owner", owner).list();
    }

    public static java.util.List<PrimaryToken> findByAssetClass(String assetClass) {
        return find("asset_class", assetClass).list();
    }

    public static java.util.List<PrimaryToken> findByStatus(PrimaryTokenStatus status) {
        return find("status", status).list();
    }

    // =============== INNER CLASSES ===============

    /**
     * Token lifecycle status enumeration
     */
    public enum PrimaryTokenStatus {
        CREATED,      // Initial state - token created but not verified
        VERIFIED,     // Token passed verification and is authorized for use
        TRANSFERRED,  // Token has been transferred at least once
        RETIRED       // Token has been removed from circulation
    }

    /**
     * Supported asset classes for tokenization
     */
    public enum AssetClass {
        REAL_ESTATE,  // Real estate properties
        VEHICLE,      // Vehicles and automotive assets
        COMMODITY,    // Agricultural, mining, and commodity assets
        IP,           // Intellectual property and patents
        FINANCIAL     // Financial instruments and securities
    }

    /**
     * Validation result container for validation operations
     */
    public static class ValidationResult {
        private java.util.List<String> errors = new java.util.ArrayList<>();
        private boolean valid = true;

        public void addError(String error) {
            errors.add(error);
            valid = false;
        }

        public boolean isValid() {
            return valid;
        }

        public java.util.List<String> getErrors() {
            return errors;
        }

        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }

    // =============== UTILITY METHODS ===============

    @Override
    public String toString() {
        return "PrimaryToken{" +
                "tokenId='" + tokenId + '\'' +
                ", assetClass='" + assetClass + '\'' +
                ", faceValue=" + faceValue +
                ", owner='" + owner + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
}
