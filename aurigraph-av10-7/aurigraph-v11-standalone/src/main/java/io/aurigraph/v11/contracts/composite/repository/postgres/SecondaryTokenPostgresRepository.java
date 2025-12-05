package io.aurigraph.v11.contracts.composite.repository.postgres;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.contracts.composite.*;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * PostgreSQL Repository for SecondaryToken persistence
 *
 * Provides polymorphic storage for all SecondaryToken types
 * (Owner, Verification, Valuation, Collateral, Media, Compliance).
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class SecondaryTokenPostgresRepository implements PanacheRepository<SecondaryTokenEntity> {

    @Inject
    ObjectMapper objectMapper;

    // ==================== PERSIST OPERATIONS ====================

    @Transactional
    public Uni<SecondaryToken> persistToken(SecondaryToken token) {
        return Uni.createFrom().item(() -> {
            try {
                SecondaryTokenEntity entity = toEntity(token);
                persist(entity);
                return token;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist secondary token", e);
            }
        });
    }

    @Transactional
    public Uni<List<SecondaryToken>> persistAllTokens(String compositeId, List<SecondaryToken> tokens) {
        return Uni.createFrom().item(() -> {
            try {
                for (SecondaryToken token : tokens) {
                    SecondaryTokenEntity entity = toEntity(token);
                    persist(entity);
                }
                return tokens;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist secondary tokens", e);
            }
        });
    }

    @Transactional
    public Uni<SecondaryToken> updateToken(SecondaryToken token) {
        return Uni.createFrom().item(() -> {
            try {
                SecondaryTokenEntity entity = find("compositeId = ?1 and tokenType = ?2",
                    token.getCompositeId(), token.getTokenType().name()).firstResult();
                if (entity != null) {
                    updateEntity(entity, token);
                    persist(entity);
                }
                return token;
            } catch (Exception e) {
                throw new RuntimeException("Failed to update secondary token", e);
            }
        });
    }

    // ==================== FIND OPERATIONS ====================

    public Uni<Optional<SecondaryToken>> findByCompositeIdAndType(String compositeId,
                                                                   SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() -> {
            SecondaryTokenEntity entity = find("compositeId = ?1 and tokenType = ?2",
                compositeId, tokenType.name()).firstResult();
            if (entity == null) {
                return Optional.empty();
            }
            return Optional.of(fromEntity(entity));
        });
    }

    public Uni<List<SecondaryToken>> findByCompositeId(String compositeId) {
        return Uni.createFrom().item(() ->
            find("compositeId", compositeId)
                .stream()
                .map(this::fromEntity)
                .collect(Collectors.toList())
        );
    }

    public Uni<List<SecondaryToken>> findByType(SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() ->
            find("tokenType", tokenType.name())
                .stream()
                .map(this::fromEntity)
                .collect(Collectors.toList())
        );
    }

    public Uni<List<SecondaryToken>> listAllTokens() {
        return Uni.createFrom().item(() ->
            listAll().stream()
                .map(this::fromEntity)
                .collect(Collectors.toList())
        );
    }

    // ==================== TYPED FIND OPERATIONS ====================

    public Uni<Optional<OwnerToken>> findOwnerToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.OWNER)
            .map(opt -> opt.map(t -> (OwnerToken) t));
    }

    public Uni<Optional<VerificationToken>> findVerificationToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.VERIFICATION)
            .map(opt -> opt.map(t -> (VerificationToken) t));
    }

    public Uni<Optional<ValuationToken>> findValuationToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.VALUATION)
            .map(opt -> opt.map(t -> (ValuationToken) t));
    }

    public Uni<Optional<CollateralToken>> findCollateralToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.COLLATERAL)
            .map(opt -> opt.map(t -> (CollateralToken) t));
    }

    public Uni<Optional<MediaToken>> findMediaToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.MEDIA)
            .map(opt -> opt.map(t -> (MediaToken) t));
    }

    public Uni<Optional<ComplianceToken>> findComplianceToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.COMPLIANCE)
            .map(opt -> opt.map(t -> (ComplianceToken) t));
    }

    // ==================== DELETE OPERATIONS ====================

    @Transactional
    public Uni<Void> deleteToken(String compositeId, SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() -> {
            delete("compositeId = ?1 and tokenType = ?2", compositeId, tokenType.name());
            return null;
        });
    }

    @Transactional
    public Uni<Void> deleteByCompositeId(String compositeId) {
        return Uni.createFrom().item(() -> {
            delete("compositeId", compositeId);
            return null;
        });
    }

    // ==================== COUNT OPERATIONS ====================

    public Uni<Long> countByType(SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() ->
            count("tokenType", tokenType.name())
        );
    }

    public Uni<Long> countByCompositeId(String compositeId) {
        return Uni.createFrom().item(() ->
            count("compositeId", compositeId)
        );
    }

    // ==================== ENTITY MAPPING ====================

    private SecondaryTokenEntity toEntity(SecondaryToken token) {
        SecondaryTokenEntity entity = new SecondaryTokenEntity();
        updateEntity(entity, token);
        return entity;
    }

    private void updateEntity(SecondaryTokenEntity entity, SecondaryToken token) {
        entity.tokenId = token.getTokenId();
        entity.compositeId = token.getCompositeId();
        entity.tokenType = token.getTokenType().name();
        entity.createdAt = token.getCreatedAt();
        entity.lastUpdated = Instant.now();

        try {
            // Serialize generic data
            if (token.getData() != null) {
                entity.data = objectMapper.writeValueAsString(token.getData());
            }

            // Serialize type-specific data
            entity.typeData = objectMapper.writeValueAsString(extractTypeData(token));
        } catch (Exception e) {
            entity.data = "{}";
            entity.typeData = "{}";
        }
    }

    private Map<String, Object> extractTypeData(SecondaryToken token) {
        Map<String, Object> typeData = new HashMap<>();

        switch (token.getTokenType()) {
            case OWNER -> {
                OwnerToken ot = (OwnerToken) token;
                typeData.put("ownerAddress", ot.getOwnerAddress());
                typeData.put("ownershipPercentage", ot.getOwnershipPercentage());
                typeData.put("transferHistory", ot.getTransferHistory());
            }
            case VERIFICATION -> {
                VerificationToken vt = (VerificationToken) token;
                typeData.put("requiredLevel", vt.getRequiredLevel().name());
                typeData.put("verificationResults", vt.getVerificationResults());
            }
            case VALUATION -> {
                ValuationToken vt = (ValuationToken) token;
                typeData.put("currentValue", vt.getCurrentValue());
                typeData.put("priceHistory", vt.getPriceHistory());
            }
            case COLLATERAL -> {
                CollateralToken ct = (CollateralToken) token;
                typeData.put("collateralAssets", ct.getCollateralAssets());
            }
            case MEDIA -> {
                MediaToken mt = (MediaToken) token;
                typeData.put("mediaAssets", mt.getMediaAssets());
            }
            case COMPLIANCE -> {
                ComplianceToken ct = (ComplianceToken) token;
                typeData.put("complianceStatus", ct.getComplianceStatus().name());
                typeData.put("complianceData", ct.getComplianceData());
            }
        }

        return typeData;
    }

    @SuppressWarnings("unchecked")
    private SecondaryToken fromEntity(SecondaryTokenEntity entity) {
        try {
            SecondaryTokenType type = SecondaryTokenType.valueOf(entity.tokenType);
            Map<String, Object> typeData = objectMapper.readValue(entity.typeData, Map.class);

            return switch (type) {
                case OWNER -> unwrapOwnerToken(entity, typeData);
                case VERIFICATION -> unwrapVerificationToken(entity, typeData);
                case VALUATION -> unwrapValuationToken(entity, typeData);
                case COLLATERAL -> unwrapCollateralToken(entity, typeData);
                case MEDIA -> unwrapMediaToken(entity, typeData);
                case COMPLIANCE -> unwrapComplianceToken(entity, typeData);
            };
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize secondary token", e);
        }
    }

    @SuppressWarnings("unchecked")
    private OwnerToken unwrapOwnerToken(SecondaryTokenEntity entity, Map<String, Object> typeData) {
        return new OwnerToken(
            entity.tokenId,
            entity.compositeId,
            (String) typeData.get("ownerAddress"),
            new BigDecimal(typeData.get("ownershipPercentage").toString()),
            (List<OwnerToken.OwnershipTransfer>) typeData.getOrDefault("transferHistory", new ArrayList<>())
        );
    }

    @SuppressWarnings("unchecked")
    private VerificationToken unwrapVerificationToken(SecondaryTokenEntity entity, Map<String, Object> typeData) {
        VerificationLevel level = VerificationLevel.valueOf((String) typeData.get("requiredLevel"));
        return new VerificationToken(
            entity.tokenId,
            entity.compositeId,
            level,
            (List<VerificationResult>) typeData.getOrDefault("verificationResults", new ArrayList<>())
        );
    }

    @SuppressWarnings("unchecked")
    private ValuationToken unwrapValuationToken(SecondaryTokenEntity entity, Map<String, Object> typeData) {
        return new ValuationToken(
            entity.tokenId,
            entity.compositeId,
            new BigDecimal(typeData.get("currentValue").toString()),
            (List<ValuationToken.PricePoint>) typeData.getOrDefault("priceHistory", new ArrayList<>())
        );
    }

    @SuppressWarnings("unchecked")
    private CollateralToken unwrapCollateralToken(SecondaryTokenEntity entity, Map<String, Object> typeData) {
        return new CollateralToken(
            entity.tokenId,
            entity.compositeId,
            (List<CollateralToken.CollateralAsset>) typeData.getOrDefault("collateralAssets", new ArrayList<>())
        );
    }

    @SuppressWarnings("unchecked")
    private MediaToken unwrapMediaToken(SecondaryTokenEntity entity, Map<String, Object> typeData) {
        return new MediaToken(
            entity.tokenId,
            entity.compositeId,
            (List<MediaToken.MediaAsset>) typeData.getOrDefault("mediaAssets", new ArrayList<>())
        );
    }

    @SuppressWarnings("unchecked")
    private ComplianceToken unwrapComplianceToken(SecondaryTokenEntity entity, Map<String, Object> typeData) {
        ComplianceStatus status = ComplianceStatus.valueOf((String) typeData.get("complianceStatus"));
        return new ComplianceToken(
            entity.tokenId,
            entity.compositeId,
            status,
            (Map<String, Object>) typeData.getOrDefault("complianceData", new HashMap<>())
        );
    }
}
