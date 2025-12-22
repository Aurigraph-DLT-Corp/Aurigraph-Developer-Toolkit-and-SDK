package io.aurigraph.v11.token.primary;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.logging.Logger;

/**
 * Primary Token Factory - Responsible for creating and validating primary tokens
 *
 * Uses the Factory pattern with Builder for flexible token construction.
 * Ensures all created tokens pass validation before persistence.
 *
 * @author Composite Token System
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@ApplicationScoped
public class PrimaryTokenFactory {

    private static final Logger logger = Logger.getLogger(PrimaryTokenFactory.class.getName());

    @Inject
    PrimaryTokenRepository repository;

    /**
     * Create a new primary token using the builder pattern
     *
     * @return TokenBuilder for fluent API construction
     */
    public TokenBuilder builder() {
        return new TokenBuilder();
    }

    /**
     * Create a primary token with minimal required fields
     * Generates UUID automatically
     *
     * @param digitalTwinId Reference to the digital twin
     * @param assetClass Asset classification
     * @param faceValue Token face value
     * @param owner Token owner/holder
     * @return Created and persisted PrimaryToken
     * @throws IllegalArgumentException if validation fails
     */
    public PrimaryToken create(String digitalTwinId, String assetClass,
                               BigDecimal faceValue, String owner) {
        return builder()
                .digitalTwinId(digitalTwinId)
                .assetClass(assetClass)
                .faceValue(faceValue)
                .owner(owner)
                .build();
    }

    /**
     * Create a primary token with explicit token ID
     *
     * @param tokenId Explicit token ID (must follow format: PT-{assetClass}-{uuid})
     * @param digitalTwinId Reference to the digital twin
     * @param assetClass Asset classification
     * @param faceValue Token face value
     * @param owner Token owner/holder
     * @return Created and persisted PrimaryToken
     * @throws IllegalArgumentException if validation fails
     */
    public PrimaryToken create(String tokenId, String digitalTwinId, String assetClass,
                               BigDecimal faceValue, String owner) {
        return builder()
                .tokenId(tokenId)
                .digitalTwinId(digitalTwinId)
                .assetClass(assetClass)
                .faceValue(faceValue)
                .owner(owner)
                .build();
    }

    /**
     * Builder class for fluent API token creation
     * Handles validation and default values
     */
    public class TokenBuilder {
        private String tokenId;
        private String digitalTwinId;
        private String assetClass;
        private BigDecimal faceValue;
        private String owner;

        /**
         * Set explicit token ID (optional)
         * If not set, will be auto-generated from asset class and UUID
         */
        public TokenBuilder tokenId(String tokenId) {
            this.tokenId = tokenId;
            return this;
        }

        /**
         * Set digital twin reference (required)
         */
        public TokenBuilder digitalTwinId(String digitalTwinId) {
            this.digitalTwinId = digitalTwinId;
            return this;
        }

        /**
         * Set asset class (required)
         */
        public TokenBuilder assetClass(String assetClass) {
            this.assetClass = assetClass;
            return this;
        }

        /**
         * Set token face value (required)
         */
        public TokenBuilder faceValue(BigDecimal faceValue) {
            this.faceValue = faceValue;
            return this;
        }

        /**
         * Set token owner (required)
         */
        public TokenBuilder owner(String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Build and persist the primary token
         * Validates all required fields and performs business rule validation
         *
         * @return Created and persisted PrimaryToken
         * @throws IllegalArgumentException if any required field is missing or invalid
         */
        public PrimaryToken build() {
            // Validate required fields
            if (digitalTwinId == null || digitalTwinId.trim().isEmpty()) {
                throw new IllegalArgumentException("digitalTwinId is required");
            }
            if (assetClass == null || assetClass.trim().isEmpty()) {
                throw new IllegalArgumentException("assetClass is required");
            }
            if (faceValue == null || faceValue.signum() <= 0) {
                throw new IllegalArgumentException("faceValue must be positive");
            }
            if (owner == null || owner.trim().isEmpty()) {
                throw new IllegalArgumentException("owner is required");
            }

            // Generate token ID if not provided
            if (tokenId == null || tokenId.trim().isEmpty()) {
                tokenId = generateTokenId(assetClass);
            }

            // Create token instance
            PrimaryToken token = new PrimaryToken(
                    tokenId,
                    digitalTwinId,
                    assetClass,
                    faceValue,
                    owner
            );

            // Validate token
            PrimaryToken.ValidationResult validationResult = token.validate();
            if (!validationResult.isValid()) {
                logger.severe("Token validation failed: " + validationResult.getErrorMessage());
                throw new IllegalArgumentException(
                        "Token validation failed: " + validationResult.getErrorMessage()
                );
            }

            // Check for duplicate token ID
            if (PrimaryToken.findByTokenId(tokenId) != null) {
                throw new IllegalArgumentException(
                        "Token with ID " + tokenId + " already exists"
                );
            }

            // Persist token
            repository.persist(token);
            logger.info("Primary token created: " + tokenId);

            return token;
        }

        /**
         * Generate a unique token ID following the format: PT-{assetClass}-{uuid}
         *
         * @param assetClass The asset class for the token
         * @return Generated token ID
         */
        private String generateTokenId(String assetClass) {
            String uuid = UUID.randomUUID().toString();
            return String.format("PT-%s-%s", assetClass, uuid);
        }
    }

    /**
     * Repository interface for PrimaryToken persistence operations
     */
    @jakarta.enterprise.context.ApplicationScoped
    public static class PrimaryTokenRepository
            implements PanacheRepositoryBase<PrimaryToken, Long> {

        /**
         * Find token by token ID
         */
        public PrimaryToken findByTokenId(String tokenId) {
            return find("token_id", tokenId).firstResult();
        }

        /**
         * Count total primary tokens
         */
        public long countTotal() {
            return count();
        }

        /**
         * Count tokens by status
         */
        public long countByStatus(PrimaryToken.PrimaryTokenStatus status) {
            return count("status", status);
        }

        /**
         * Count tokens by asset class
         */
        public long countByAssetClass(String assetClass) {
            return count("asset_class", assetClass);
        }
    }
}
