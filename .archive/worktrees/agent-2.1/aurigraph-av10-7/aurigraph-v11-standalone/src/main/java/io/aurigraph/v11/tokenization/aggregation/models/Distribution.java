package io.aurigraph.v11.tokenization.aggregation.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Represents a yield/dividend distribution event
 * Tracks distribution calculations and execution
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Distribution {

    /**
     * Unique distribution identifier
     */
    private String distributionId;

    /**
     * Pool address receiving distribution
     */
    private String poolAddress;

    /**
     * Total amount to distribute (in base currency)
     */
    private BigDecimal totalAmount;

    /**
     * Distribution source (e.g., "rental_income", "dividends", "yield")
     */
    private String source;

    /**
     * Distribution timestamp
     */
    private Instant distributionTimestamp;

    /**
     * Calculation timestamp
     */
    private Instant calculatedAt;

    /**
     * Number of eligible holders
     */
    private int holderCount;

    /**
     * Per-holder allocations
     */
    private List<HolderAllocation> allocations;

    /**
     * Merkle root of distribution batch
     */
    private String merkleRoot;

    /**
     * Distribution status
     */
    private DistributionStatus status;

    /**
     * Execution performance metrics
     */
    private ExecutionMetrics metrics;

    /**
     * Batch information for parallel distribution
     */
    private List<DistributionBatch> batches;

    /**
     * Holder allocation record
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HolderAllocation {
        private String holderAddress;
        private BigDecimal tokenBalance;
        private BigDecimal allocationAmount;
        private BigDecimal ownershipPercentage;
        private String merkleProof;
        private boolean executed;
    }

    /**
     * Distribution batch for parallel processing
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributionBatch {
        private int batchId;
        private int startIndex;
        private int endIndex;
        private List<HolderAllocation> holders;
        private String batchMerkleRoot;
        private Instant submittedAt;
        private Instant confirmedAt;
        private BatchStatus status;

        public enum BatchStatus {
            PENDING,
            SUBMITTED,
            CONFIRMED,
            FAILED
        }
    }

    /**
     * Execution performance metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionMetrics {
        private long calculationTimeNanos;
        private long batchingTimeNanos;
        private long submissionTimeNanos;
        private long settlementTimeNanos;
        private long totalTimeNanos;
        private int batchCount;
        private int avgBatchSize;

        /**
         * Get total time in milliseconds
         */
        public double getTotalTimeMs() {
            return totalTimeNanos / 1_000_000.0;
        }

        /**
         * Check if performance meets target (<100ms for 10K holders)
         */
        public boolean meetsPerformanceTarget() {
            return getTotalTimeMs() < 100.0;
        }
    }

    /**
     * Distribution status
     */
    public enum DistributionStatus {
        CALCULATING,
        BATCHING,
        SUBMITTING,
        SETTLING,
        COMPLETED,
        FAILED
    }

    /**
     * Calculate distribution statistics
     */
    public DistributionStatistics getStatistics() {
        BigDecimal totalDistributed = allocations.stream()
            .map(HolderAllocation::getAllocationAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgAllocation = holderCount > 0 ?
            totalDistributed.divide(BigDecimal.valueOf(holderCount), 8, java.math.RoundingMode.HALF_UP) :
            BigDecimal.ZERO;

        BigDecimal maxAllocation = allocations.stream()
            .map(HolderAllocation::getAllocationAmount)
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);

        BigDecimal minAllocation = allocations.stream()
            .map(HolderAllocation::getAllocationAmount)
            .min(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);

        return DistributionStatistics.builder()
            .totalDistributed(totalDistributed)
            .avgAllocation(avgAllocation)
            .maxAllocation(maxAllocation)
            .minAllocation(minAllocation)
            .holderCount(holderCount)
            .build();
    }

    /**
     * Distribution statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributionStatistics {
        private BigDecimal totalDistributed;
        private BigDecimal avgAllocation;
        private BigDecimal maxAllocation;
        private BigDecimal minAllocation;
        private int holderCount;
    }
}
