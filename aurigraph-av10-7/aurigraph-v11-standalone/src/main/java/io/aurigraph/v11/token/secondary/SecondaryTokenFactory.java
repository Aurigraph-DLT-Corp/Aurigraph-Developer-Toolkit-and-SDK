package io.aurigraph.v11.token.secondary;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.aurigraph.v11.token.secondary.SecondaryToken.*;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.logging.Logger;

/**
 * Secondary Token Factory - Creates and manages secondary tokens
 *
 * This factory provides:
 * - Builder pattern for flexible token construction
 * - Support for IncomeStreamToken, CollateralToken, RoyaltyToken
 * - Validation against parent primary token
 * - Automatic token ID generation
 *
 * @author Composite Token System - Sprint 2
 * @version 1.0
 * @since Sprint 2 (Week 2)
 */
@ApplicationScoped
public class SecondaryTokenFactory {

    private static final Logger logger = Logger.getLogger(SecondaryTokenFactory.class.getName());

    @Inject
    SecondaryTokenRepository repository;

    /**
     * Create a builder for fluent token construction
     */
    public TokenBuilder builder() {
        return new TokenBuilder();
    }

    /**
     * Create an income stream token
     */
    public SecondaryToken createIncomeStreamToken(String parentTokenId, BigDecimal faceValue,
                                                   String owner, BigDecimal revenueShare,
                                                   DistributionFrequency frequency) {
        return builder()
                .parentTokenId(parentTokenId)
                .tokenType(SecondaryTokenType.INCOME_STREAM)
                .faceValue(faceValue)
                .owner(owner)
                .revenueSharePercent(revenueShare)
                .distributionFrequency(frequency)
                .build();
    }

    /**
     * Create a collateral token
     */
    public SecondaryToken createCollateralToken(String parentTokenId, BigDecimal faceValue,
                                                 String owner, Instant expiresAt) {
        return builder()
                .parentTokenId(parentTokenId)
                .tokenType(SecondaryTokenType.COLLATERAL)
                .faceValue(faceValue)
                .owner(owner)
                .expiresAt(expiresAt)
                .build();
    }

    /**
     * Create a royalty token
     */
    public SecondaryToken createRoyaltyToken(String parentTokenId, BigDecimal faceValue,
                                              String owner, BigDecimal revenueShare) {
        return builder()
                .parentTokenId(parentTokenId)
                .tokenType(SecondaryTokenType.ROYALTY)
                .faceValue(faceValue)
                .owner(owner)
                .revenueSharePercent(revenueShare)
                .build();
    }

    /**
     * Builder class for secondary token construction
     */
    public class TokenBuilder {
        private String tokenId;
        private String parentTokenId;
        private SecondaryTokenType tokenType;
        private BigDecimal faceValue;
        private String owner;
        private BigDecimal revenueSharePercent;
        private DistributionFrequency distributionFrequency;
        private Instant expiresAt;
        private String metadata;

        public TokenBuilder tokenId(String tokenId) {
            this.tokenId = tokenId;
            return this;
        }

        public TokenBuilder parentTokenId(String parentTokenId) {
            this.parentTokenId = parentTokenId;
            return this;
        }

        public TokenBuilder tokenType(SecondaryTokenType tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public TokenBuilder faceValue(BigDecimal faceValue) {
            this.faceValue = faceValue;
            return this;
        }

        public TokenBuilder owner(String owner) {
            this.owner = owner;
            return this;
        }

        public TokenBuilder revenueSharePercent(BigDecimal revenueSharePercent) {
            this.revenueSharePercent = revenueSharePercent;
            return this;
        }

        public TokenBuilder distributionFrequency(DistributionFrequency frequency) {
            this.distributionFrequency = frequency;
            return this;
        }

        public TokenBuilder expiresAt(Instant expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }

        public TokenBuilder metadata(String metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Build and persist the secondary token
         * NOTE: @Transactional removed - use service-level transactions instead (CDI rule: no interceptor bindings in inner classes)
         */
        public SecondaryToken build() {
            // Validate required fields
            validateRequiredFields();

            // Validate parent token exists and is valid
            validateParentToken();

            // Generate token ID if not provided
            if (tokenId == null || tokenId.trim().isEmpty()) {
                tokenId = generateTokenId(tokenType);
            }

            // Check for duplicate
            if (SecondaryToken.findByTokenId(tokenId) != null) {
                throw new IllegalArgumentException("Token with ID " + tokenId + " already exists");
            }

            // Create token
            SecondaryToken token = new SecondaryToken(
                    tokenId, parentTokenId, tokenType, faceValue, owner
            );
            token.revenueSharePercent = revenueSharePercent;
            token.distributionFrequency = distributionFrequency;
            token.expiresAt = expiresAt;
            token.metadata = metadata;

            // Persist
            repository.persist(token);
            logger.info("Secondary token created: " + tokenId + " (type: " + tokenType + ")");

            return token;
        }

        private void validateRequiredFields() {
            if (parentTokenId == null || parentTokenId.trim().isEmpty()) {
                throw new IllegalArgumentException("parentTokenId is required");
            }
            if (tokenType == null) {
                throw new IllegalArgumentException("tokenType is required");
            }
            if (faceValue == null || faceValue.signum() <= 0) {
                throw new IllegalArgumentException("faceValue must be positive");
            }
            if (owner == null || owner.trim().isEmpty()) {
                throw new IllegalArgumentException("owner is required");
            }
        }

        private void validateParentToken() {
            PrimaryToken parent = PrimaryToken.findByTokenId(parentTokenId);
            if (parent == null) {
                throw new IllegalArgumentException("Parent token not found: " + parentTokenId);
            }
            if (parent.status == PrimaryToken.PrimaryTokenStatus.RETIRED) {
                throw new IllegalArgumentException("Cannot create secondary token from retired primary");
            }
        }

        private String generateTokenId(SecondaryTokenType type) {
            String uuid = UUID.randomUUID().toString();
            return String.format("ST-%s-%s", type.name(), uuid);
        }
    }

    /**
     * Repository for SecondaryToken persistence
     */
    @ApplicationScoped
    public static class SecondaryTokenRepository
            implements PanacheRepositoryBase<SecondaryToken, Long> {

        public SecondaryToken findByTokenId(String tokenId) {
            return find("token_id", tokenId).firstResult();
        }

        public long countByParent(String parentTokenId) {
            return count("parent_token_id", parentTokenId);
        }

        public long countByType(SecondaryTokenType type) {
            return count("token_type", type);
        }
    }
}
