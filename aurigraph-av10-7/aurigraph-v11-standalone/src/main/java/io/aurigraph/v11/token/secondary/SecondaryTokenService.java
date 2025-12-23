package io.aurigraph.v11.token.secondary;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.aurigraph.v11.token.primary.PrimaryTokenRegistry;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Secondary Token Service - Sprint 1 Story 3 Implementation
 *
 * High-level transactional service integrating:
 * - SecondaryTokenFactory (creation with builder)
 * - SecondaryTokenRegistry (indexing and lookups)
 * - SecondaryTokenMerkleService (proof generation)
 * - CDI Events (revenue distribution hooks)
 *
 * Provides:
 * - Creation operations with validation
 * - Lifecycle management (activate, redeem, expire, transfer)
 * - Bulk operations with transaction management
 * - Parent token validation with cascade support
 * - Revenue distribution event hooks
 *
 * CDI Events:
 * - TokenActivatedEvent (when token becomes ACTIVE)
 * - TokenRedeemedEvent (when token becomes REDEEMED)
 * - TokenTransferredEvent (when token ownership changes)
 *
 * Performance:
 * - Single token creation: < 50ms
 * - Bulk creation (100 tokens): < 100ms
 *
 * @author Composite Token System - Sprint 1 Story 3
 * @version 1.0
 * @since Sprint 1 Story 3 (Week 2)
 */
@ApplicationScoped
public class SecondaryTokenService {

    private static final Logger LOG = Logger.getLogger(SecondaryTokenService.class);

    @Inject
    SecondaryTokenFactory factory;

    @Inject
    SecondaryTokenRegistry registry;

    @Inject
    SecondaryTokenMerkleService merkleService;

    @Inject
    PrimaryTokenRegistry primaryRegistry;

    // CDI event sources for revenue distribution hooks
    @Inject
    Event<TokenActivatedEvent> tokenActivatedEvent;

    @Inject
    Event<TokenRedeemedEvent> tokenRedeemedEvent;

    @Inject
    Event<TokenTransferredEvent> tokenTransferredEvent;

    /**
     * Create an income stream token
     *
     * @param parentTokenId Parent primary token ID
     * @param faceValue Face value of the token
     * @param owner Owner address
     * @param revenueShare Revenue share percentage
     * @param frequency Distribution frequency
     * @return Uni containing the created secondary token
     */
    @Transactional
    public Uni<SecondaryToken> createIncomeStreamToken(String parentTokenId, BigDecimal faceValue,
                                                        String owner, BigDecimal revenueShare,
                                                        SecondaryToken.DistributionFrequency frequency) {
        return Uni.createFrom().item(() -> {
            validateParentToken(parentTokenId).await().indefinitely();
            validateOwner(owner);

            // Create using factory
            SecondaryToken token = factory.createIncomeStreamToken(
                    parentTokenId, faceValue, owner, revenueShare, frequency
            );

            // Register in registry
            registry.register(token).await().indefinitely();

            LOG.infof("Created income stream token: %s (parent: %s, value: %s)",
                    token.tokenId, parentTokenId, faceValue);

            return token;
        });
    }

    /**
     * Create a collateral token
     *
     * @param parentTokenId Parent primary token ID
     * @param faceValue Face value of the token
     * @param owner Owner address
     * @param expiresAt Expiration instant
     * @return Uni containing the created secondary token
     */
    @Transactional
    public Uni<SecondaryToken> createCollateralToken(String parentTokenId, BigDecimal faceValue,
                                                      String owner, Instant expiresAt) {
        return Uni.createFrom().item(() -> {
            validateParentToken(parentTokenId).await().indefinitely();
            validateOwner(owner);

            SecondaryToken token = factory.createCollateralToken(
                    parentTokenId, faceValue, owner, expiresAt
            );

            registry.register(token).await().indefinitely();

            LOG.infof("Created collateral token: %s (parent: %s, expires: %s)",
                    token.tokenId, parentTokenId, expiresAt);

            return token;
        });
    }

    /**
     * Create a royalty token
     *
     * @param parentTokenId Parent primary token ID
     * @param faceValue Face value of the token
     * @param owner Owner address
     * @param revenueShare Revenue share percentage
     * @return Uni containing the created secondary token
     */
    @Transactional
    public Uni<SecondaryToken> createRoyaltyToken(String parentTokenId, BigDecimal faceValue,
                                                   String owner, BigDecimal revenueShare) {
        return Uni.createFrom().item(() -> {
            validateParentToken(parentTokenId).await().indefinitely();
            validateOwner(owner);

            SecondaryToken token = factory.createRoyaltyToken(
                    parentTokenId, faceValue, owner, revenueShare
            );

            registry.register(token).await().indefinitely();

            LOG.infof("Created royalty token: %s (parent: %s, value: %s)",
                    token.tokenId, parentTokenId, faceValue);

            return token;
        });
    }

    /**
     * Activate a secondary token (CREATED → ACTIVE)
     * Fires TokenActivatedEvent for revenue distribution
     *
     * @param tokenId Token ID to activate
     * @param actor Actor performing the activation
     * @return Uni containing the updated token
     */
    @Transactional
    public Uni<SecondaryToken> activateToken(String tokenId, String actor) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup(tokenId).await().indefinitely();
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            if (entry.status != SecondaryToken.SecondaryTokenStatus.CREATED) {
                throw new IllegalStateException("Cannot activate token in status: " + entry.status);
            }

            // Update status in registry
            registry.updateStatus(tokenId, SecondaryToken.SecondaryTokenStatus.ACTIVE).await().indefinitely();

            // Retrieve updated token
            SecondaryToken token = SecondaryToken.findByTokenId(tokenId);

            // Fire event for revenue distribution observers
            tokenActivatedEvent.fire(new TokenActivatedEvent(tokenId, entry.parentTokenId, actor, Instant.now()));

            LOG.infof("Activated secondary token: %s by %s", tokenId, actor);

            return token;
        });
    }

    /**
     * Redeem a secondary token (ACTIVE → REDEEMED)
     * Fires TokenRedeemedEvent for settlement processing
     *
     * @param tokenId Token ID to redeem
     * @param actor Actor performing the redemption
     * @return Uni containing the updated token
     */
    @Transactional
    public Uni<SecondaryToken> redeemToken(String tokenId, String actor) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup(tokenId).await().indefinitely();
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            if (entry.status != SecondaryToken.SecondaryTokenStatus.ACTIVE) {
                throw new IllegalStateException("Can only redeem ACTIVE tokens, current status: " + entry.status);
            }

            // Update status in registry
            registry.updateStatus(tokenId, SecondaryToken.SecondaryTokenStatus.REDEEMED).await().indefinitely();

            SecondaryToken token = SecondaryToken.findByTokenId(tokenId);

            // Fire event for settlement
            tokenRedeemedEvent.fire(new TokenRedeemedEvent(tokenId, entry.parentTokenId, actor, Instant.now()));

            LOG.infof("Redeemed secondary token: %s by %s", tokenId, actor);

            return token;
        });
    }

    /**
     * Expire a secondary token (ACTIVE → EXPIRED)
     *
     * @param tokenId Token ID to expire
     * @param reason Reason for expiration
     * @return Uni containing the updated token
     */
    @Transactional
    public Uni<SecondaryToken> expireToken(String tokenId, String reason) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup(tokenId).await().indefinitely();
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            registry.updateStatus(tokenId, SecondaryToken.SecondaryTokenStatus.EXPIRED).await().indefinitely();

            SecondaryToken token = SecondaryToken.findByTokenId(tokenId);

            LOG.infof("Expired secondary token: %s (reason: %s)", tokenId, reason);

            return token;
        });
    }

    /**
     * Transfer a secondary token to a new owner
     * Fires TokenTransferredEvent for audit trail
     *
     * @param tokenId Token ID to transfer
     * @param fromOwner Current owner
     * @param toOwner New owner
     * @return Uni containing the updated token
     */
    @Transactional
    public Uni<SecondaryToken> transferToken(String tokenId, String fromOwner, String toOwner) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenRegistry.RegistryEntry entry = registry.lookup(tokenId).await().indefinitely();
            if (entry == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }

            if (!entry.owner.equals(fromOwner)) {
                throw new IllegalArgumentException("Token owner mismatch");
            }

            validateOwner(toOwner);

            registry.updateOwner(tokenId, toOwner).await().indefinitely();

            SecondaryToken token = SecondaryToken.findByTokenId(tokenId);

            // Fire event for audit trail
            tokenTransferredEvent.fire(new TokenTransferredEvent(tokenId, fromOwner, toOwner, Instant.now()));

            LOG.infof("Transferred secondary token: %s from %s to %s", tokenId, fromOwner, toOwner);

            return token;
        });
    }

    /**
     * Bulk create secondary tokens
     *
     * @param requests List of creation requests
     * @return Uni containing bulk operation result
     */
    @Transactional
    public Uni<BulkOperationResult> bulkCreate(List<CreateTokenRequest> requests) {
        return Uni.createFrom().item(() -> {
            List<SecondaryToken> created = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (CreateTokenRequest req : requests) {
                try {
                    validateParentToken(req.parentTokenId).await().indefinitely();
                    validateOwner(req.owner);

                    SecondaryToken token;
                    if ("INCOME_STREAM".equals(req.tokenType)) {
                        token = factory.createIncomeStreamToken(
                                req.parentTokenId, req.faceValue, req.owner,
                                req.revenueShare, req.frequency
                        );
                    } else if ("COLLATERAL".equals(req.tokenType)) {
                        token = factory.createCollateralToken(
                                req.parentTokenId, req.faceValue, req.owner, req.expiresAt
                        );
                    } else if ("ROYALTY".equals(req.tokenType)) {
                        token = factory.createRoyaltyToken(
                                req.parentTokenId, req.faceValue, req.owner, req.revenueShare
                        );
                    } else {
                        throw new IllegalArgumentException("Unknown token type: " + req.tokenType);
                    }

                    registry.register(token).await().indefinitely();
                    created.add(token);
                } catch (Exception e) {
                    errors.add("Failed to create " + req.tokenType + ": " + e.getMessage());
                    LOG.warnf("Bulk create error: %s", e.getMessage());
                }
            }

            return new BulkOperationResult(created.size(), errors.size(), created, errors);
        });
    }

    /**
     * Get a secondary token by ID
     *
     * @param tokenId Token ID to retrieve
     * @return Uni containing the token
     */
    public Uni<SecondaryToken> getToken(String tokenId) {
        return Uni.createFrom().item(() -> {
            SecondaryToken token = SecondaryToken.findByTokenId(tokenId);
            if (token == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }
            return token;
        });
    }

    /**
     * Get all tokens of a parent
     *
     * @param parentTokenId Parent token ID
     * @return Uni containing list of tokens
     */
    public Uni<List<SecondaryToken>> getTokensByParent(String parentTokenId) {
        return Uni.createFrom().item(() -> {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByParent(parentTokenId)
                    .await().indefinitely();

            return entries.stream()
                    .map(entry -> SecondaryToken.findByTokenId(entry.tokenId))
                    .filter(t -> t != null)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Get all tokens owned by an owner
     *
     * @param owner Owner address
     * @return Uni containing list of tokens
     */
    public Uni<List<SecondaryToken>> getTokensByOwner(String owner) {
        return Uni.createFrom().item(() -> {
            List<SecondaryTokenRegistry.RegistryEntry> entries = registry.lookupByOwner(owner)
                    .await().indefinitely();

            return entries.stream()
                    .map(entry -> SecondaryToken.findByTokenId(entry.tokenId))
                    .filter(t -> t != null)
                    .collect(Collectors.toList());
        });
    }

    /**
     * Validate parent token exists
     */
    private Uni<Void> validateParentToken(String parentTokenId) {
        return Uni.createFrom().item(() -> {
            // Check in primary registry
            PrimaryTokenRegistry.RegistryEntry primaryEntry = primaryRegistry.lookup(parentTokenId)
                    .await().indefinitely();
            if (primaryEntry == null) {
                throw new IllegalArgumentException("Parent token not found: " + parentTokenId);
            }
            if (primaryEntry.status == PrimaryToken.PrimaryTokenStatus.RETIRED) {
                throw new IllegalArgumentException("Cannot create secondary from retired primary: " + parentTokenId);
            }
            return null;
        });
    }

    /**
     * Validate owner address
     */
    private void validateOwner(String owner) {
        if (owner == null || owner.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner cannot be null or empty");
        }
    }

    /**
     * CDI Event: Token Activated
     */
    public static class TokenActivatedEvent {
        public final String tokenId;
        public final String parentTokenId;
        public final String actor;
        public final Instant timestamp;

        public TokenActivatedEvent(String tokenId, String parentTokenId, String actor, Instant timestamp) {
            this.tokenId = tokenId;
            this.parentTokenId = parentTokenId;
            this.actor = actor;
            this.timestamp = timestamp;
        }
    }

    /**
     * CDI Event: Token Redeemed
     */
    public static class TokenRedeemedEvent {
        public final String tokenId;
        public final String parentTokenId;
        public final String actor;
        public final Instant timestamp;

        public TokenRedeemedEvent(String tokenId, String parentTokenId, String actor, Instant timestamp) {
            this.tokenId = tokenId;
            this.parentTokenId = parentTokenId;
            this.actor = actor;
            this.timestamp = timestamp;
        }
    }

    /**
     * CDI Event: Token Transferred
     */
    public static class TokenTransferredEvent {
        public final String tokenId;
        public final String fromOwner;
        public final String toOwner;
        public final Instant timestamp;

        public TokenTransferredEvent(String tokenId, String fromOwner, String toOwner, Instant timestamp) {
            this.tokenId = tokenId;
            this.fromOwner = fromOwner;
            this.toOwner = toOwner;
            this.timestamp = timestamp;
        }
    }

    /**
     * Bulk operation result
     */
    public static class BulkOperationResult {
        public final int successCount;
        public final int errorCount;
        public final List<SecondaryToken> created;
        public final List<String> errors;

        public BulkOperationResult(int successCount, int errorCount,
                                  List<SecondaryToken> created, List<String> errors) {
            this.successCount = successCount;
            this.errorCount = errorCount;
            this.created = created;
            this.errors = errors;
        }

        @Override
        public String toString() {
            return String.format("BulkOperationResult{success=%d, errors=%d}", successCount, errorCount);
        }
    }

    /**
     * Token creation request
     */
    public static class CreateTokenRequest {
        public String parentTokenId;
        public String tokenType;
        public BigDecimal faceValue;
        public String owner;
        public BigDecimal revenueShare;
        public SecondaryToken.DistributionFrequency frequency;
        public Instant expiresAt;

        public CreateTokenRequest(String parentTokenId, String tokenType, BigDecimal faceValue, String owner) {
            this.parentTokenId = parentTokenId;
            this.tokenType = tokenType;
            this.faceValue = faceValue;
            this.owner = owner;
        }
    }
}
