package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.aggregation.models.Distribution;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Distribution Calculation Engine
 * High-performance yield/dividend distribution calculation and execution
 *
 * Performance Targets:
 * - Calculation: <50ms for 10K+ holders
 * - Batching: <100ms for 10K+ holders
 * - Total distribution: <100ms for 10K+ holders
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation - Week 1-2
 */
@ApplicationScoped
public class DistributionCalculationEngine {

    @Inject
    MerkleTreeService merkleService;

    private static final int DEFAULT_BATCH_SIZE = 2000;
    private static final int MAX_BATCH_SIZE = 5000;

    // Distribution history (in-memory for Phase 1)
    private final Map<String, List<Distribution>> distributionHistory = new ConcurrentHashMap<>();

    /**
     * Calculate and execute distribution to pool holders
     *
     * @param poolAddress Pool address
     * @param totalAmount Total amount to distribute
     * @param holders Map of holder addresses to token balances
     * @param source Distribution source
     * @return Distribution execution result
     */
    public Uni<DistributionResult> distributeYield(
            String poolAddress,
            BigDecimal totalAmount,
            Map<String, BigDecimal> holders,
            String source) {

        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            // Phase 1: Calculation (<50ms target)
            long calcStart = System.nanoTime();
            Distribution distribution = calculateDistribution(
                poolAddress, totalAmount, holders, source);
            long calcEnd = System.nanoTime();

            // Phase 2: Batching (<100ms target)
            long batchStart = System.nanoTime();
            List<Distribution.DistributionBatch> batches = createDistributionBatches(
                distribution.getAllocations());
            distribution.setBatches(batches);
            long batchEnd = System.nanoTime();

            // Phase 3: Submission (parallel, <500ms target)
            long submitStart = System.nanoTime();
            submitDistributionBatches(batches);
            long submitEnd = System.nanoTime();

            // Phase 4: Settlement (<100ms target)
            long settleStart = System.nanoTime();
            settleDistribution(distribution);
            long settleEnd = System.nanoTime();

            long totalTime = System.nanoTime() - startTime;

            // Update metrics
            Distribution.ExecutionMetrics metrics = Distribution.ExecutionMetrics.builder()
                .calculationTimeNanos(calcEnd - calcStart)
                .batchingTimeNanos(batchEnd - batchStart)
                .submissionTimeNanos(submitEnd - submitStart)
                .settlementTimeNanos(settleEnd - settleStart)
                .totalTimeNanos(totalTime)
                .batchCount(batches.size())
                .avgBatchSize(holders.size() / batches.size())
                .build();

            distribution.setMetrics(metrics);
            distribution.setStatus(Distribution.DistributionStatus.COMPLETED);

            // Store in history
            distributionHistory.computeIfAbsent(poolAddress, k -> new ArrayList<>())
                .add(distribution);

            // Log performance
            logPerformance(distribution, metrics);

            return DistributionResult.builder()
                .success(true)
                .distribution(distribution)
                .metrics(metrics)
                .message(String.format("Distributed %s to %d holders",
                    totalAmount, holders.size()))
                .build();

        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Calculate distribution allocations
     */
    private Distribution calculateDistribution(
            String poolAddress,
            BigDecimal totalAmount,
            Map<String, BigDecimal> holders,
            String source) {

        // Calculate total token supply
        BigDecimal totalSupply = holders.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalSupply.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total token supply cannot be zero");
        }

        // Calculate per-token distribution amount
        BigDecimal perTokenAmount = totalAmount.divide(totalSupply, 8, RoundingMode.HALF_UP);

        // Create allocations (parallel for performance)
        List<Distribution.HolderAllocation> allocations = holders.entrySet()
            .parallelStream()
            .map(entry -> {
                String holderAddress = entry.getKey();
                BigDecimal tokenBalance = entry.getValue();

                BigDecimal allocationAmount = perTokenAmount.multiply(tokenBalance);

                BigDecimal ownershipPercentage = tokenBalance
                    .divide(totalSupply, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

                return Distribution.HolderAllocation.builder()
                    .holderAddress(holderAddress)
                    .tokenBalance(tokenBalance)
                    .allocationAmount(allocationAmount)
                    .ownershipPercentage(ownershipPercentage)
                    .executed(false)
                    .build();
            })
            .collect(Collectors.toList());

        return Distribution.builder()
            .distributionId(UUID.randomUUID().toString())
            .poolAddress(poolAddress)
            .totalAmount(totalAmount)
            .source(source)
            .distributionTimestamp(Instant.now())
            .calculatedAt(Instant.now())
            .holderCount(holders.size())
            .allocations(allocations)
            .status(Distribution.DistributionStatus.CALCULATING)
            .build();
    }

    /**
     * Create distribution batches for parallel processing
     */
    private List<Distribution.DistributionBatch> createDistributionBatches(
            List<Distribution.HolderAllocation> allocations) {

        List<Distribution.DistributionBatch> batches = new ArrayList<>();

        // Determine optimal batch size based on holder count
        int batchSize = calculateOptimalBatchSize(allocations.size());

        for (int i = 0; i < allocations.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, allocations.size());
            List<Distribution.HolderAllocation> batchHolders =
                allocations.subList(i, endIndex);

            // Generate batch Merkle root for verification
            String batchMerkleRoot = generateBatchMerkleRoot(batchHolders);

            Distribution.DistributionBatch batch = Distribution.DistributionBatch.builder()
                .batchId(batches.size())
                .startIndex(i)
                .endIndex(endIndex)
                .holders(batchHolders)
                .batchMerkleRoot(batchMerkleRoot)
                .status(Distribution.DistributionBatch.BatchStatus.PENDING)
                .build();

            batches.add(batch);
        }

        return batches;
    }

    /**
     * Calculate optimal batch size based on holder count
     */
    private int calculateOptimalBatchSize(int holderCount) {
        if (holderCount <= 1000) {
            return 500;
        } else if (holderCount <= 10000) {
            return 2000;
        } else if (holderCount <= 50000) {
            return 3000;
        } else {
            return 5000;
        }
    }

    /**
     * Generate Merkle root for batch verification
     */
    private String generateBatchMerkleRoot(List<Distribution.HolderAllocation> holders) {
        // Create deterministic representation of batch
        String batchData = holders.stream()
            .map(h -> h.getHolderAddress() + ":" + h.getAllocationAmount().toPlainString())
            .collect(Collectors.joining("|"));

        // Generate SHA3-256 hash
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA3-256");
            byte[] hashBytes = digest.digest(batchData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate batch Merkle root", e);
        }
    }

    /**
     * Submit distribution batches to consensus layer
     * (Parallel submission for performance)
     */
    private void submitDistributionBatches(List<Distribution.DistributionBatch> batches) {
        // Parallel submission using virtual threads
        batches.parallelStream().forEach(batch -> {
            batch.setSubmittedAt(Instant.now());
            batch.setStatus(Distribution.DistributionBatch.BatchStatus.SUBMITTED);

            // Simulate consensus submission
            // In real implementation: consensusService.submitBatch(batch)
            try {
                Thread.sleep(10); // Simulate network delay
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            batch.setConfirmedAt(Instant.now());
            batch.setStatus(Distribution.DistributionBatch.BatchStatus.CONFIRMED);
        });
    }

    /**
     * Settle distribution (mark allocations as executed)
     */
    private void settleDistribution(Distribution distribution) {
        distribution.getAllocations().forEach(allocation -> {
            allocation.setExecuted(true);
        });

        // Generate final Merkle root for entire distribution
        List<String> allocationHashes = distribution.getAllocations().stream()
            .map(a -> a.getHolderAddress() + ":" + a.getAllocationAmount().toPlainString())
            .collect(Collectors.toList());

        String merkleRoot = generateMerkleRootFromStrings(allocationHashes);
        distribution.setMerkleRoot(merkleRoot);
    }

    /**
     * Generate Merkle root from string list
     */
    private String generateMerkleRootFromStrings(List<String> data) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA3-256");
            String combined = String.join("|", data);
            byte[] hashBytes = digest.digest(combined.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate Merkle root", e);
        }
    }

    /**
     * Log distribution performance
     */
    private void logPerformance(Distribution distribution, Distribution.ExecutionMetrics metrics) {
        double totalTimeMs = metrics.getTotalTimeMs();
        double calcTimeMs = metrics.getCalculationTimeNanos() / 1_000_000.0;
        double batchTimeMs = metrics.getBatchingTimeNanos() / 1_000_000.0;
        double submitTimeMs = metrics.getSubmissionTimeNanos() / 1_000_000.0;
        double settleTimeMs = metrics.getSettlementTimeNanos() / 1_000_000.0;

        Log.infof("Distribution %s completed in %.2f ms (calc: %.2f ms, batch: %.2f ms, submit: %.2f ms, settle: %.2f ms)",
            distribution.getDistributionId(), totalTimeMs, calcTimeMs, batchTimeMs, submitTimeMs, settleTimeMs);

        if (totalTimeMs > 100.0 && distribution.getHolderCount() <= 10000) {
            Log.warnf("Distribution to %d holders took %.2f ms (target: <100ms)",
                distribution.getHolderCount(), totalTimeMs);
        }

        if (!metrics.meetsPerformanceTarget()) {
            Log.warnf("Distribution performance target not met: %.2f ms (target: <100ms)", totalTimeMs);
        }
    }

    /**
     * Get distribution history for pool
     */
    public Uni<List<Distribution>> getDistributionHistory(String poolAddress) {
        return Uni.createFrom().item(() ->
            distributionHistory.getOrDefault(poolAddress, new ArrayList<>())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get distribution statistics
     */
    public Uni<DistributionStatistics> getDistributionStatistics(String poolAddress) {
        return Uni.createFrom().item(() -> {
            List<Distribution> history = distributionHistory.getOrDefault(poolAddress, new ArrayList<>());

            if (history.isEmpty()) {
                return DistributionStatistics.builder()
                    .poolAddress(poolAddress)
                    .totalDistributions(0)
                    .totalAmountDistributed(BigDecimal.ZERO)
                    .build();
            }

            BigDecimal totalAmount = history.stream()
                .map(Distribution::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            double avgTime = history.stream()
                .map(d -> d.getMetrics().getTotalTimeMs())
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

            return DistributionStatistics.builder()
                .poolAddress(poolAddress)
                .totalDistributions(history.size())
                .totalAmountDistributed(totalAmount)
                .avgDistributionTimeMs(avgTime)
                .lastDistribution(history.get(history.size() - 1).getDistributionTimestamp())
                .build();

        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Helper methods

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    // Supporting classes

    /**
     * Distribution execution result
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DistributionResult {
        private boolean success;
        private Distribution distribution;
        private Distribution.ExecutionMetrics metrics;
        private String message;
    }

    /**
     * Distribution statistics
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DistributionStatistics {
        private String poolAddress;
        private int totalDistributions;
        private BigDecimal totalAmountDistributed;
        private double avgDistributionTimeMs;
        private Instant lastDistribution;
    }
}
