package io.aurigraph.v11.tokenization.aggregation.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Represents an individual asset in an aggregation pool
 * Core data model for asset composition tracking
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Asset {

    /**
     * Unique asset identifier (globally unique across platform)
     */
    private String assetId;

    /**
     * Asset type (e.g., REAL_ESTATE, CARBON_CREDIT, COMMODITY)
     */
    private String assetType;

    /**
     * Current valuation in base currency (USD)
     */
    private BigDecimal currentValuation;

    /**
     * Initial valuation when added to pool
     */
    private BigDecimal initialValuation;

    /**
     * Historical price feed reference (oracle or data source)
     */
    private String priceFeedSource;

    /**
     * Custody information (who holds the asset)
     */
    private CustodyInfo custodyInfo;

    /**
     * Timestamp when asset was added to pool
     */
    private Instant addedTimestamp;

    /**
     * Last valuation update timestamp
     */
    private Instant lastValuationUpdate;

    /**
     * Asset metadata (flexible key-value pairs)
     */
    private Map<String, String> metadata;

    /**
     * Weight in the aggregation pool (calculated based on strategy)
     */
    private BigDecimal weight;

    /**
     * Asset verification status
     */
    private VerificationStatus verificationStatus;

    /**
     * Merkle proof for asset ownership/custody
     */
    private String merkleProof;

    /**
     * Calculate percentage change from initial valuation
     */
    public BigDecimal calculateValuationChange() {
        if (initialValuation == null || initialValuation.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentValuation.subtract(initialValuation)
            .divide(initialValuation, 4, java.math.RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }

    /**
     * Check if asset requires revaluation based on staleness threshold
     */
    public boolean requiresRevaluation(long maxStaleMinutes) {
        if (lastValuationUpdate == null) {
            return true;
        }
        Instant threshold = Instant.now().minusSeconds(maxStaleMinutes * 60);
        return lastValuationUpdate.isBefore(threshold);
    }

    /**
     * Custody information for asset
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustodyInfo {
        private String custodianName;
        private String custodianAddress;
        private String custodialAgreementHash;
        private String insuranceProvider;
        private BigDecimal insuranceCoverage;
    }

    /**
     * Asset verification status
     */
    public enum VerificationStatus {
        PENDING,
        VERIFIED,
        REJECTED,
        REQUIRES_REVALIDATION
    }
}
