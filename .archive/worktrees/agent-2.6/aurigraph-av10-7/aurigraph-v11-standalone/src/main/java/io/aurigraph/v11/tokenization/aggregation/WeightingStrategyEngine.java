package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.aurigraph.v11.tokenization.aggregation.models.Token;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Weighting Strategy Engine
 * Calculates asset weights based on various strategies
 *
 * Supported Strategies:
 * 1. Equal Weight - Each asset weighted equally
 * 2. Market Cap Weight - Weight by asset valuation
 * 3. Volatility Adjusted - Weight by inverse volatility
 * 4. Custom - User-defined weights
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation - Week 1-2
 */
@ApplicationScoped
public class WeightingStrategyEngine {

    /**
     * Calculate asset weights based on strategy
     *
     * @param assets List of assets
     * @param strategy Weighting strategy
     * @return Assets with calculated weights
     */
    public List<Asset> calculateWeights(List<Asset> assets, Token.WeightingStrategy strategy) {
        long startTime = System.nanoTime();

        List<Asset> weightedAssets = switch (strategy) {
            case EQUAL_WEIGHT -> calculateEqualWeights(assets);
            case MARKET_CAP_WEIGHT -> calculateMarketCapWeights(assets);
            case VOLATILITY_ADJUSTED -> calculateVolatilityAdjustedWeights(assets);
            case CUSTOM -> calculateCustomWeights(assets);
        };

        // Validate weights sum to 100%
        BigDecimal totalWeight = weightedAssets.stream()
            .map(Asset::getWeight)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalWeight.compareTo(BigDecimal.valueOf(100)) != 0) {
            Log.warnf("Total weight is %.4f%%, expected 100.0000%%", totalWeight);
        }

        long endTime = System.nanoTime();
        double timeMs = (endTime - startTime) / 1_000_000.0;

        Log.infof("Calculated %s weights for %d assets in %.2f ms",
            strategy, assets.size(), timeMs);

        return weightedAssets;
    }

    /**
     * Equal weighting - each asset weighted equally
     */
    private List<Asset> calculateEqualWeights(List<Asset> assets) {
        BigDecimal equalWeight = BigDecimal.valueOf(100)
            .divide(BigDecimal.valueOf(assets.size()), 8, RoundingMode.HALF_UP);

        return assets.stream()
            .peek(asset -> asset.setWeight(equalWeight))
            .collect(Collectors.toList());
    }

    /**
     * Market cap weighting - weight by asset valuation
     */
    private List<Asset> calculateMarketCapWeights(List<Asset> assets) {
        // Calculate total market cap
        BigDecimal totalValue = assets.stream()
            .map(Asset::getCurrentValuation)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total asset value cannot be zero for market cap weighting");
        }

        // Calculate proportional weights
        return assets.stream()
            .peek(asset -> {
                BigDecimal weight = asset.getCurrentValuation()
                    .divide(totalValue, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
                asset.setWeight(weight);
            })
            .collect(Collectors.toList());
    }

    /**
     * Volatility-adjusted weighting
     * Lower volatility assets get higher weights
     *
     * Note: Requires historical price data in metadata
     */
    private List<Asset> calculateVolatilityAdjustedWeights(List<Asset> assets) {
        // Calculate volatility for each asset
        Map<String, BigDecimal> volatilities = assets.stream()
            .collect(Collectors.toMap(
                Asset::getAssetId,
                asset -> calculateVolatility(asset)
            ));

        // Calculate inverse volatility weights
        BigDecimal totalInverseVolatility = volatilities.values().stream()
            .map(v -> BigDecimal.ONE.divide(v, 8, RoundingMode.HALF_UP))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalInverseVolatility.compareTo(BigDecimal.ZERO) == 0) {
            Log.warn("Total inverse volatility is zero, falling back to equal weights");
            return calculateEqualWeights(assets);
        }

        return assets.stream()
            .peek(asset -> {
                BigDecimal volatility = volatilities.get(asset.getAssetId());
                BigDecimal inverseVolatility = BigDecimal.ONE.divide(volatility, 8, RoundingMode.HALF_UP);
                BigDecimal weight = inverseVolatility
                    .divide(totalInverseVolatility, 8, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
                asset.setWeight(weight);
            })
            .collect(Collectors.toList());
    }

    /**
     * Custom weighting - use pre-defined weights from metadata
     */
    private List<Asset> calculateCustomWeights(List<Asset> assets) {
        // Extract custom weights from metadata
        List<Asset> weightedAssets = new ArrayList<>();
        BigDecimal totalCustomWeight = BigDecimal.ZERO;

        for (Asset asset : assets) {
            Map<String, String> metadata = asset.getMetadata();
            if (metadata == null || !metadata.containsKey("custom_weight")) {
                throw new IllegalArgumentException(
                    "Custom weight not found for asset: " + asset.getAssetId());
            }

            try {
                BigDecimal customWeight = new BigDecimal(metadata.get("custom_weight"));
                asset.setWeight(customWeight);
                totalCustomWeight = totalCustomWeight.add(customWeight);
                weightedAssets.add(asset);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                    "Invalid custom weight for asset " + asset.getAssetId() + ": " + metadata.get("custom_weight"));
            }
        }

        // Normalize to 100%
        if (totalCustomWeight.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Total custom weights cannot be zero");
        }

        BigDecimal normalizationFactor = BigDecimal.valueOf(100)
            .divide(totalCustomWeight, 8, RoundingMode.HALF_UP);

        for (Asset asset : weightedAssets) {
            BigDecimal normalizedWeight = asset.getWeight().multiply(normalizationFactor);
            asset.setWeight(normalizedWeight);
        }

        return weightedAssets;
    }

    /**
     * Calculate asset volatility from historical data
     */
    private BigDecimal calculateVolatility(Asset asset) {
        // Check if volatility is pre-calculated in metadata
        Map<String, String> metadata = asset.getMetadata();
        if (metadata != null && metadata.containsKey("volatility")) {
            try {
                return new BigDecimal(metadata.get("volatility"));
            } catch (NumberFormatException e) {
                Log.warnf("Invalid volatility in metadata for asset %s", asset.getAssetId());
            }
        }

        // Calculate volatility from valuation change
        BigDecimal valuationChange = asset.calculateValuationChange().abs();

        // Default to 10% if no historical data
        if (valuationChange.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(10.0);
        }

        // Return absolute valuation change as proxy for volatility
        return valuationChange;
    }

    /**
     * Calculate rebalancing requirements
     *
     * @param currentAssets Current asset composition with weights
     * @param targetStrategy Target weighting strategy
     * @return Rebalancing report
     */
    public RebalancingReport calculateRebalancingNeeds(
            List<Asset> currentAssets,
            Token.WeightingStrategy targetStrategy) {

        // Calculate target weights
        List<Asset> targetAssets = calculateWeights(new ArrayList<>(currentAssets), targetStrategy);

        // Compare current vs target weights
        List<WeightDrift> drifts = new ArrayList<>();
        BigDecimal totalDrift = BigDecimal.ZERO;

        for (int i = 0; i < currentAssets.size(); i++) {
            Asset current = currentAssets.get(i);
            Asset target = targetAssets.get(i);

            BigDecimal drift = target.getWeight().subtract(current.getWeight()).abs();
            totalDrift = totalDrift.add(drift);

            drifts.add(WeightDrift.builder()
                .assetId(current.getAssetId())
                .currentWeight(current.getWeight())
                .targetWeight(target.getWeight())
                .drift(drift)
                .build());
        }

        BigDecimal avgDrift = totalDrift.divide(
            BigDecimal.valueOf(currentAssets.size()), 4, RoundingMode.HALF_UP);

        boolean rebalancingNeeded = avgDrift.compareTo(BigDecimal.valueOf(5.0)) > 0;

        return RebalancingReport.builder()
            .rebalancingNeeded(rebalancingNeeded)
            .totalDrift(totalDrift)
            .avgDrift(avgDrift)
            .weightDrifts(drifts)
            .targetStrategy(targetStrategy)
            .build();
    }

    // Supporting classes

    /**
     * Rebalancing report
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RebalancingReport {
        private boolean rebalancingNeeded;
        private BigDecimal totalDrift;
        private BigDecimal avgDrift;
        private List<WeightDrift> weightDrifts;
        private Token.WeightingStrategy targetStrategy;
    }

    /**
     * Weight drift for individual asset
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class WeightDrift {
        private String assetId;
        private BigDecimal currentWeight;
        private BigDecimal targetWeight;
        private BigDecimal drift;
    }
}
