package io.aurigraph.v11.contracts.composite.repository;

import io.aurigraph.v11.contracts.composite.*;
import io.aurigraph.v11.storage.LevelDBRepository;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Composite Token Repository - LevelDB Implementation
 *
 * Provides per-node embedded storage for CompositeToken entities using LevelDB.
 * Implements full persistence for composite token packages including primary
 * and secondary tokens.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: LevelDB Persistence)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class CompositeTokenRepositoryLevelDB extends LevelDBRepository<CompositeToken, String> {

    @Override
    protected Class<CompositeToken> getEntityClass() {
        return CompositeToken.class;
    }

    @Override
    protected String getKeyPrefix() {
        return "composite-token:";
    }

    @Override
    protected String getId(CompositeToken entity) {
        return entity.getCompositeId();
    }

    // ==================== BASIC QUERIES ====================

    public Uni<Optional<CompositeToken>> findByCompositeId(String compositeId) {
        return findById(compositeId);
    }

    public Uni<Boolean> existsByCompositeId(String compositeId) {
        return existsById(compositeId);
    }

    public Uni<List<CompositeToken>> findByOwner(String ownerAddress) {
        return findBy(ct -> ownerAddress.equals(ct.getOwnerAddress()))
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    // ==================== ASSET TYPE QUERIES ====================

    public Uni<List<CompositeToken>> findByAssetType(String assetType) {
        return findBy(ct -> assetType.equals(ct.getAssetType()))
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    public Uni<Long> countByAssetType(String assetType) {
        return countBy(ct -> assetType.equals(ct.getAssetType()));
    }

    public Uni<Optional<CompositeToken>> findByAssetId(String assetId) {
        return findFirstBy(ct -> assetId.equals(ct.getAssetId()));
    }

    // ==================== STATUS QUERIES ====================

    public Uni<List<CompositeToken>> findByStatus(CompositeTokenStatus status) {
        return findBy(ct -> ct.getStatus() == status)
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    public Uni<Long> countByStatus(CompositeTokenStatus status) {
        return countBy(ct -> ct.getStatus() == status);
    }

    public Uni<List<CompositeToken>> findPendingVerification() {
        return findByStatus(CompositeTokenStatus.PENDING_VERIFICATION);
    }

    public Uni<List<CompositeToken>> findVerified() {
        return findByStatus(CompositeTokenStatus.VERIFIED);
    }

    public Uni<List<CompositeToken>> findRejected() {
        return findByStatus(CompositeTokenStatus.REJECTED);
    }

    // ==================== VERIFICATION LEVEL QUERIES ====================

    public Uni<List<CompositeToken>> findByVerificationLevel(VerificationLevel level) {
        return findBy(ct -> ct.getVerificationLevel() == level)
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    public Uni<List<CompositeToken>> findWithMinimumVerificationLevel(VerificationLevel minLevel) {
        return findBy(ct -> ct.getVerificationLevel() != null &&
                           ct.getVerificationLevel().ordinal() >= minLevel.ordinal())
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(ct -> ct.getVerificationLevel().ordinal(),
                                Comparator.reverseOrder()))
                        .collect(Collectors.toList()));
    }

    // ==================== TIME-BASED QUERIES ====================

    public Uni<List<CompositeToken>> findCreatedAfter(Instant after) {
        return findBy(ct -> ct.getCreatedAt() != null && ct.getCreatedAt().isAfter(after))
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    public Uni<List<CompositeToken>> findCreatedBetween(Instant start, Instant end) {
        return findBy(ct -> {
            Instant created = ct.getCreatedAt();
            return created != null &&
                   !created.isBefore(start) &&
                   !created.isAfter(end);
        }).map(list -> list.stream()
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .collect(Collectors.toList()));
    }

    public Uni<List<CompositeToken>> findRecent(int limit) {
        return listAll().map(list -> list.stream()
                .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                .limit(limit)
                .collect(Collectors.toList()));
    }

    // ==================== COMBINED QUERIES ====================

    public Uni<List<CompositeToken>> findByOwnerAndStatus(String ownerAddress, CompositeTokenStatus status) {
        return findBy(ct -> ownerAddress.equals(ct.getOwnerAddress()) && ct.getStatus() == status)
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    public Uni<List<CompositeToken>> findByAssetTypeAndStatus(String assetType, CompositeTokenStatus status) {
        return findBy(ct -> assetType.equals(ct.getAssetType()) && ct.getStatus() == status)
                .map(list -> list.stream()
                        .sorted(Comparator.comparing(CompositeToken::getCreatedAt).reversed())
                        .collect(Collectors.toList()));
    }

    public Uni<List<CompositeToken>> findVerifiedByOwner(String ownerAddress) {
        return findByOwnerAndStatus(ownerAddress, CompositeTokenStatus.VERIFIED);
    }

    // ==================== STATISTICS ====================

    public Uni<CompositeTokenStatistics> getStatistics() {
        return listAll().map(tokens -> {
            long total = tokens.size();

            Map<String, Long> byAssetType = tokens.stream()
                    .collect(Collectors.groupingBy(
                            CompositeToken::getAssetType,
                            Collectors.counting()
                    ));

            Map<CompositeTokenStatus, Long> byStatus = tokens.stream()
                    .collect(Collectors.groupingBy(
                            CompositeToken::getStatus,
                            Collectors.counting()
                    ));

            Map<VerificationLevel, Long> byVerificationLevel = tokens.stream()
                    .filter(ct -> ct.getVerificationLevel() != null)
                    .collect(Collectors.groupingBy(
                            CompositeToken::getVerificationLevel,
                            Collectors.counting()
                    ));

            long pendingVerification = byStatus.getOrDefault(CompositeTokenStatus.PENDING_VERIFICATION, 0L);
            long verified = byStatus.getOrDefault(CompositeTokenStatus.VERIFIED, 0L);
            long rejected = byStatus.getOrDefault(CompositeTokenStatus.REJECTED, 0L);

            return new CompositeTokenStatistics(
                    total,
                    pendingVerification,
                    verified,
                    rejected,
                    byAssetType,
                    byStatus,
                    byVerificationLevel
            );
        });
    }

    // ==================== BULK OPERATIONS ====================

    public Uni<List<CompositeToken>> findByCompositeIds(List<String> compositeIds) {
        return listAll().map(list -> list.stream()
                .filter(ct -> compositeIds.contains(ct.getCompositeId()))
                .collect(Collectors.toList()));
    }

    public Uni<Void> deleteByOwner(String ownerAddress) {
        return findByOwner(ownerAddress)
                .flatMap(tokens -> {
                    List<String> ids = tokens.stream()
                            .map(CompositeToken::getCompositeId)
                            .collect(Collectors.toList());
                    return deleteByIds(ids);
                });
    }

    public Uni<Void> deleteByIds(List<String> ids) {
        return Uni.createFrom().item(() -> {
            for (String id : ids) {
                deleteById(id).await().indefinitely();
            }
            return null;
        });
    }

    // ==================== DATA MODELS ====================

    public record CompositeTokenStatistics(
            long totalTokens,
            long pendingVerification,
            long verified,
            long rejected,
            Map<String, Long> byAssetType,
            Map<CompositeTokenStatus, Long> byStatus,
            Map<VerificationLevel, Long> byVerificationLevel
    ) {}
}
