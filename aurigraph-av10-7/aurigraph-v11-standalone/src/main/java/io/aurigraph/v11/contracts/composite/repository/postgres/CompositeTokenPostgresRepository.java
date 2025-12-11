package io.aurigraph.v11.contracts.composite.repository.postgres;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.contracts.composite.*;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * PostgreSQL Repository for CompositeToken persistence
 *
 * Provides full CRUD operations with reactive Uni<T> wrappers
 * for compatibility with the existing LevelDB repository interface.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class CompositeTokenPostgresRepository implements PanacheRepository<CompositeTokenEntity> {

    @Inject
    ObjectMapper objectMapper;

    // ==================== PERSIST OPERATIONS ====================

    @Transactional
    public Uni<CompositeToken> persistToken(CompositeToken token) {
        return Uni.createFrom().item(() -> {
            try {
                CompositeTokenEntity entity = toEntity(token);
                persist(entity);
                return token;
            } catch (Exception e) {
                throw new RuntimeException("Failed to persist composite token", e);
            }
        });
    }

    @Transactional
    public Uni<CompositeToken> updateToken(CompositeToken token) {
        return Uni.createFrom().item(() -> {
            try {
                CompositeTokenEntity entity = find("compositeId", token.getCompositeId())
                    .firstResult();
                if (entity != null) {
                    updateEntity(entity, token);
                    persist(entity);
                }
                return token;
            } catch (Exception e) {
                throw new RuntimeException("Failed to update composite token", e);
            }
        });
    }

    // ==================== FIND OPERATIONS ====================

    public Uni<Optional<CompositeToken>> findByCompositeId(String compositeId) {
        return Uni.createFrom().item(() -> {
            CompositeTokenEntity entity = find("compositeId", compositeId).firstResult();
            if (entity == null) {
                return Optional.empty();
            }
            return Optional.of(fromEntity(entity));
        });
    }

    public Uni<Boolean> existsByCompositeId(String compositeId) {
        return Uni.createFrom().item(() ->
            find("compositeId", compositeId).count() > 0
        );
    }

    public Uni<List<CompositeToken>> findByOwner(String ownerAddress) {
        return Uni.createFrom().item(() ->
            find("ownerAddress", ownerAddress)
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> findByAssetType(String assetType) {
        return Uni.createFrom().item(() ->
            find("assetType", assetType)
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> findByStatus(CompositeTokenStatus status) {
        return Uni.createFrom().item(() ->
            find("status", status.name())
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> findByVerificationLevel(VerificationLevel level) {
        return Uni.createFrom().item(() ->
            find("verificationLevel", level.name())
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> findByOwnerAndStatus(String ownerAddress, CompositeTokenStatus status) {
        return Uni.createFrom().item(() ->
            find("ownerAddress = ?1 and status = ?2", ownerAddress, status.name())
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> findCreatedAfter(Instant after) {
        return Uni.createFrom().item(() ->
            find("createdAt > ?1", after)
                .stream()
                .map(this::fromEntity)
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> findRecent(int limit) {
        return Uni.createFrom().item(() ->
            find("ORDER BY createdAt DESC")
                .page(0, limit)
                .stream()
                .map(this::fromEntity)
                .collect(Collectors.toList())
        );
    }

    public Uni<List<CompositeToken>> listAllTokens() {
        return Uni.createFrom().item(() ->
            listAll().stream()
                .map(this::fromEntity)
                .collect(Collectors.toList())
        );
    }

    // ==================== DELETE OPERATIONS ====================

    @Transactional
    public Uni<Void> deleteByCompositeId(String compositeId) {
        return Uni.createFrom().item(() -> {
            delete("compositeId", compositeId);
            return null;
        });
    }

    @Transactional
    public Uni<Void> deleteByOwner(String ownerAddress) {
        return Uni.createFrom().item(() -> {
            delete("ownerAddress", ownerAddress);
            return null;
        });
    }

    // ==================== COUNT OPERATIONS ====================

    public Uni<Long> countByStatus(CompositeTokenStatus status) {
        return Uni.createFrom().item(() ->
            count("status", status.name())
        );
    }

    public Uni<Long> countByAssetType(String assetType) {
        return Uni.createFrom().item(() ->
            count("assetType", assetType)
        );
    }

    public Uni<Long> countAll() {
        return Uni.createFrom().item(this::count);
    }

    // ==================== STATISTICS ====================

    public Uni<Map<String, Object>> getStatistics() {
        return listAllTokens().map(tokens -> {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTokens", (long) tokens.size());

            Map<String, Long> byAssetType = tokens.stream()
                .collect(Collectors.groupingBy(CompositeToken::getAssetTypeString, Collectors.counting()));
            stats.put("byAssetType", byAssetType);

            Map<String, Long> byStatus = tokens.stream()
                .collect(Collectors.groupingBy(t -> t.getStatus().name(), Collectors.counting()));
            stats.put("byStatus", byStatus);

            Map<String, Long> byVerificationLevel = tokens.stream()
                .filter(t -> t.getVerificationLevel() != null)
                .collect(Collectors.groupingBy(t -> t.getVerificationLevel().name(), Collectors.counting()));
            stats.put("byVerificationLevel", byVerificationLevel);

            long pendingVerification = byStatus.getOrDefault("PENDING_VERIFICATION", 0L);
            long verified = byStatus.getOrDefault("VERIFIED", 0L);
            long rejected = byStatus.getOrDefault("REJECTED", 0L);

            stats.put("pendingVerification", pendingVerification);
            stats.put("verified", verified);
            stats.put("rejected", rejected);

            return stats;
        });
    }

    // ==================== ENTITY MAPPING ====================

    private CompositeTokenEntity toEntity(CompositeToken token) {
        CompositeTokenEntity entity = new CompositeTokenEntity();
        updateEntity(entity, token);
        return entity;
    }

    private void updateEntity(CompositeTokenEntity entity, CompositeToken token) {
        entity.compositeId = token.getCompositeId();
        entity.assetId = token.getAssetId();
        entity.assetType = token.getAssetTypeString();
        entity.ownerAddress = token.getOwnerAddress();
        entity.status = token.getStatus().name();
        entity.verificationLevel = token.getVerificationLevel() != null
            ? token.getVerificationLevel().name() : null;
        entity.createdAt = token.getCreatedAt();
        entity.updatedAt = Instant.now();

        // Get primary token ID if available
        if (token.getPrimaryToken() != null) {
            entity.primaryTokenId = token.getPrimaryToken().getTokenId();
        }

        // Serialize metadata to JSON
        try {
            if (token.getMetadata() != null) {
                entity.metadata = objectMapper.writeValueAsString(token.getMetadata());
            }
        } catch (Exception e) {
            entity.metadata = "{}";
        }
    }

    private CompositeToken fromEntity(CompositeTokenEntity entity) {
        CompositeToken.Builder builder = CompositeToken.builder()
            .compositeId(entity.compositeId)
            .assetId(entity.assetId)
            .assetType(entity.assetType)
            .ownerAddress(entity.ownerAddress)
            .status(CompositeTokenStatus.valueOf(entity.status))
            .createdAt(entity.createdAt);

        if (entity.verificationLevel != null) {
            builder.verificationLevel(VerificationLevel.valueOf(entity.verificationLevel));
        }

        CompositeToken token = builder.build();

        // Set mutable fields after build
        if (entity.verificationLevel != null) {
            token.setVerificationLevel(VerificationLevel.valueOf(entity.verificationLevel));
        }

        return token;
    }
}
