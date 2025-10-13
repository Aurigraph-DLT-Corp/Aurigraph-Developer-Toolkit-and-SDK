package io.aurigraph.v11.registry;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * RWAT Registry Service
 *
 * Public registry for Real-World Asset Tokens.
 * Provides searchability, discoverability, and analytics for tokenized assets.
 *
 * @version 11.4.0
 * @since 2025-10-13
 */
@ApplicationScoped
public class RWATRegistryService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RWATRegistryService.class);

    // In-memory storage (will be migrated to database)
    private final Map<String, RWATRegistry> rwats = new ConcurrentHashMap<>();

    /**
     * Register a new RWAT
     */
    public Uni<RWATRegistry> registerRWAT(RWATRegistry rwat) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Registering RWAT: {}", rwat.getAssetName());

            // Generate RWAT ID
            rwat.setRwatId("RWAT-" + UUID.randomUUID().toString());
            rwat.setListedAt(Instant.now());
            rwat.setActive(true);

            // Calculate completeness score
            rwat.setCompletenessScore(calculateCompletenessScore(rwat));

            // Store RWAT
            rwats.put(rwat.getRwatId(), rwat);

            LOGGER.info("RWAT registered: {}", rwat.getRwatId());
            return rwat;
        });
    }

    /**
     * Get RWAT by ID
     */
    public Uni<RWATRegistry> getRWAT(String rwatId) {
        return Uni.createFrom().item(() -> {
            RWATRegistry rwat = rwats.get(rwatId);
            if (rwat == null) {
                throw new RWATNotFoundException("RWAT not found: " + rwatId);
            }
            return rwat;
        });
    }

    /**
     * Search RWATs by keyword
     */
    public Uni<List<RWATRegistry>> searchRWATs(String keyword) {
        return Uni.createFrom().item(() ->
                rwats.values().stream()
                        .filter(r -> matchesKeyword(r, keyword))
                        .collect(Collectors.toList())
        );
    }

    /**
     * List RWATs by asset type
     */
    public Uni<List<RWATRegistry>> listByAssetType(RWATRegistry.AssetType assetType) {
        return Uni.createFrom().item(() ->
                rwats.values().stream()
                        .filter(r -> r.getAssetType() == assetType)
                        .collect(Collectors.toList())
        );
    }

    /**
     * List verified RWATs
     */
    public Uni<List<RWATRegistry>> listVerifiedRWATs() {
        return Uni.createFrom().item(() ->
                rwats.values().stream()
                        .filter(r -> r.getVerificationStatus() == RWATRegistry.VerificationStatus.VERIFIED)
                        .collect(Collectors.toList())
        );
    }

    /**
     * List RWATs by location
     */
    public Uni<List<RWATRegistry>> listByLocation(String location) {
        return Uni.createFrom().item(() ->
                rwats.values().stream()
                        .filter(r -> r.getLocation() != null && r.getLocation().contains(location))
                        .collect(Collectors.toList())
        );
    }

    /**
     * List recently listed RWATs
     */
    public Uni<List<RWATRegistry>> listRecentRWATs(int limit) {
        return Uni.createFrom().item(() ->
                rwats.values().stream()
                        .sorted((a, b) -> b.getListedAt().compareTo(a.getListedAt()))
                        .limit(limit)
                        .collect(Collectors.toList())
        );
    }

    /**
     * List top RWATs by trading volume
     */
    public Uni<List<RWATRegistry>> listTopByVolume(int limit) {
        return Uni.createFrom().item(() ->
                rwats.values().stream()
                        .sorted((a, b) -> Double.compare(b.getTradingVolume(), a.getTradingVolume()))
                        .limit(limit)
                        .collect(Collectors.toList())
        );
    }

    /**
     * Update RWAT verification status
     */
    public Uni<RWATRegistry> updateVerificationStatus(
            String rwatId,
            RWATRegistry.VerificationStatus status,
            String verifierId
    ) {
        return getRWAT(rwatId).map(rwat -> {
            rwat.setVerificationStatus(status);
            rwat.setVerifiedBy(verifierId);
            rwat.setVerifiedAt(Instant.now());
            rwats.put(rwatId, rwat);
            LOGGER.info("RWAT verification updated: {} - {}", rwatId, status);
            return rwat;
        });
    }

    /**
     * Record trading activity
     */
    public Uni<RWATRegistry> recordTransaction(String rwatId, double transactionValue) {
        return getRWAT(rwatId).map(rwat -> {
            rwat.setTradingVolume(rwat.getTradingVolume() + transactionValue);
            rwat.setTransactionCount(rwat.getTransactionCount() + 1);
            rwats.put(rwatId, rwat);
            return rwat;
        });
    }

    /**
     * Get registry statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalRWATs", rwats.size());
        stats.put("activeRWATs", rwats.values().stream().filter(RWATRegistry::isActive).count());
        stats.put("verifiedRWATs", rwats.values().stream()
                .filter(r -> r.getVerificationStatus() == RWATRegistry.VerificationStatus.VERIFIED).count());

        // Total value locked (TVL)
        double tvl = rwats.values().stream()
                .mapToDouble(RWATRegistry::getTotalValue)
                .sum();
        stats.put("totalValueLocked", tvl);

        // Total trading volume
        double totalVolume = rwats.values().stream()
                .mapToDouble(RWATRegistry::getTradingVolume)
                .sum();
        stats.put("totalTradingVolume", totalVolume);

        // Count by asset type
        Map<String, Long> byType = rwats.values().stream()
                .collect(Collectors.groupingBy(
                        r -> r.getAssetType().name(),
                        Collectors.counting()
                ));
        stats.put("assetsByType", byType);

        // Average completeness score
        double avgCompleteness = rwats.values().stream()
                .mapToDouble(RWATRegistry::getCompletenessScore)
                .average()
                .orElse(0.0);
        stats.put("averageCompletenessScore", avgCompleteness);

        return stats;
    }

    // Helper methods
    private boolean matchesKeyword(RWATRegistry rwat, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return true;
        }

        String lowerKeyword = keyword.toLowerCase();

        return (rwat.getAssetName() != null && rwat.getAssetName().toLowerCase().contains(lowerKeyword)) ||
                (rwat.getTokenSymbol() != null && rwat.getTokenSymbol().toLowerCase().contains(lowerKeyword)) ||
                (rwat.getLocation() != null && rwat.getLocation().toLowerCase().contains(lowerKeyword)) ||
                (rwat.getAssetCategory() != null && rwat.getAssetCategory().toLowerCase().contains(lowerKeyword));
    }

    private double calculateCompletenessScore(RWATRegistry rwat) {
        double score = 0.0;

        // Basic information (30%)
        if (rwat.getAssetName() != null && !rwat.getAssetName().isEmpty()) score += 0.1;
        if (rwat.getAssetType() != null) score += 0.1;
        if (rwat.getLocation() != null && !rwat.getLocation().isEmpty()) score += 0.1;

        // Documentation (40%)
        if (rwat.getDocumentCount() > 0) score += 0.2;
        if (rwat.getDocumentCount() >= 3) score += 0.1;
        if (rwat.getDocumentCount() >= 5) score += 0.1;

        // Media (30%)
        if (rwat.getPhotoCount() > 0) score += 0.15;
        if (rwat.getVideoCount() > 0) score += 0.15;

        return Math.min(score, 1.0);
    }

    // Custom Exception
    public static class RWATNotFoundException extends RuntimeException {
        public RWATNotFoundException(String message) {
            super(message);
        }
    }
}
