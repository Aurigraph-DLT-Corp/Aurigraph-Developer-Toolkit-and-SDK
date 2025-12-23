package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Asset Composition Validator
 * Validates asset lists for aggregation pool creation
 *
 * Validation Rules:
 * - 2-1000 assets per pool
 * - All assets must have positive valuations
 * - No duplicate assets
 * - All assets must be verified
 * - Custody information must be complete
 *
 * Performance Target: <1s per 100 assets
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation - Week 1-2
 */
@ApplicationScoped
public class AssetCompositionValidator {

    private static final int MIN_ASSETS = 2;
    private static final int MAX_ASSETS = 1000;
    private static final BigDecimal MIN_VALUATION = BigDecimal.valueOf(0.01);

    /**
     * Validate asset composition for pool creation
     *
     * @param assets List of assets to validate
     * @return Validation result with errors if any
     */
    public AggregationPoolService.AssetValidationResult validateAssetComposition(List<Asset> assets) {
        long startTime = System.nanoTime();
        List<String> errors = new ArrayList<>();

        // Validate asset count
        if (assets == null || assets.isEmpty()) {
            errors.add("Asset list cannot be null or empty");
            return new AggregationPoolService.AssetValidationResult(false, errors);
        }

        if (assets.size() < MIN_ASSETS) {
            errors.add(String.format("Minimum %d assets required, found %d", MIN_ASSETS, assets.size()));
        }

        if (assets.size() > MAX_ASSETS) {
            errors.add(String.format("Maximum %d assets allowed, found %d", MAX_ASSETS, assets.size()));
        }

        // Check for duplicates
        Set<String> assetIds = new HashSet<>();
        List<String> duplicates = assets.stream()
            .map(Asset::getAssetId)
            .filter(id -> !assetIds.add(id))
            .collect(Collectors.toList());

        if (!duplicates.isEmpty()) {
            errors.add("Duplicate assets found: " + String.join(", ", duplicates));
        }

        // Validate each asset (parallel processing for performance)
        List<String> assetErrors = assets.parallelStream()
            .flatMap(asset -> validateIndividualAsset(asset).stream())
            .collect(Collectors.toList());

        errors.addAll(assetErrors);

        long endTime = System.nanoTime();
        double timeMs = (endTime - startTime) / 1_000_000.0;

        boolean isValid = errors.isEmpty();

        if (isValid) {
            Log.infof("Asset composition validated successfully (%d assets) in %.2f ms", assets.size(), timeMs);
        } else {
            Log.warnf("Asset composition validation failed with %d errors in %.2f ms", errors.size(), timeMs);
        }

        return new AggregationPoolService.AssetValidationResult(isValid, errors);
    }

    /**
     * Validate individual asset
     */
    private List<String> validateIndividualAsset(Asset asset) {
        List<String> errors = new ArrayList<>();
        String assetId = asset.getAssetId();

        // Asset ID validation
        if (assetId == null || assetId.trim().isEmpty()) {
            errors.add("Asset ID cannot be null or empty");
            return errors;
        }

        // Asset type validation
        if (asset.getAssetType() == null || asset.getAssetType().trim().isEmpty()) {
            errors.add(String.format("Asset %s: Asset type cannot be null or empty", assetId));
        }

        // Valuation validation
        if (asset.getCurrentValuation() == null) {
            errors.add(String.format("Asset %s: Current valuation cannot be null", assetId));
        } else if (asset.getCurrentValuation().compareTo(MIN_VALUATION) < 0) {
            errors.add(String.format("Asset %s: Valuation must be at least %s", assetId, MIN_VALUATION));
        }

        if (asset.getInitialValuation() == null) {
            errors.add(String.format("Asset %s: Initial valuation cannot be null", assetId));
        } else if (asset.getInitialValuation().compareTo(MIN_VALUATION) < 0) {
            errors.add(String.format("Asset %s: Initial valuation must be at least %s", assetId, MIN_VALUATION));
        }

        // Verification status validation
        if (asset.getVerificationStatus() == null) {
            errors.add(String.format("Asset %s: Verification status cannot be null", assetId));
        } else if (asset.getVerificationStatus() != Asset.VerificationStatus.VERIFIED) {
            errors.add(String.format("Asset %s: Must be VERIFIED, current status: %s",
                assetId, asset.getVerificationStatus()));
        }

        // Custody information validation
        if (asset.getCustodyInfo() == null) {
            errors.add(String.format("Asset %s: Custody information is required", assetId));
        } else {
            validateCustodyInfo(asset, errors);
        }

        // Merkle proof validation (optional but recommended)
        if (asset.getMerkleProof() == null || asset.getMerkleProof().trim().isEmpty()) {
            Log.warnf("Asset %s: No Merkle proof provided (recommended for verification)", assetId);
        }

        return errors;
    }

    /**
     * Validate custody information
     */
    private void validateCustodyInfo(Asset asset, List<String> errors) {
        Asset.CustodyInfo custody = asset.getCustodyInfo();
        String assetId = asset.getAssetId();

        if (custody.getCustodianName() == null || custody.getCustodianName().trim().isEmpty()) {
            errors.add(String.format("Asset %s: Custodian name is required", assetId));
        }

        if (custody.getCustodianAddress() == null || custody.getCustodianAddress().trim().isEmpty()) {
            errors.add(String.format("Asset %s: Custodian address is required", assetId));
        }

        if (custody.getCustodialAgreementHash() == null || custody.getCustodialAgreementHash().trim().isEmpty()) {
            errors.add(String.format("Asset %s: Custodial agreement hash is required", assetId));
        }

        // Insurance validation (optional but recommended for high-value assets)
        if (asset.getCurrentValuation().compareTo(BigDecimal.valueOf(1_000_000)) > 0) {
            if (custody.getInsuranceProvider() == null || custody.getInsuranceProvider().trim().isEmpty()) {
                Log.warnf("Asset %s: High-value asset without insurance provider (recommended)", assetId);
            }
            if (custody.getInsuranceCoverage() == null ||
                custody.getInsuranceCoverage().compareTo(asset.getCurrentValuation()) < 0) {
                Log.warnf("Asset %s: Insurance coverage below asset value (recommended to match)", assetId);
            }
        }
    }

    /**
     * Validate rebalancing eligibility
     *
     * @param assets Current asset composition
     * @param newAssets Proposed new composition
     * @return Validation result
     */
    public AggregationPoolService.AssetValidationResult validateRebalancing(
            List<Asset> assets, List<Asset> newAssets) {

        List<String> errors = new ArrayList<>();

        // Validate new composition
        AggregationPoolService.AssetValidationResult newCompositionResult =
            validateAssetComposition(newAssets);

        if (!newCompositionResult.isValid()) {
            return newCompositionResult;
        }

        // Check for major composition changes (>50% turnover not recommended)
        Set<String> currentAssetIds = assets.stream()
            .map(Asset::getAssetId)
            .collect(Collectors.toSet());

        Set<String> newAssetIds = newAssets.stream()
            .map(Asset::getAssetId)
            .collect(Collectors.toSet());

        Set<String> retained = new HashSet<>(currentAssetIds);
        retained.retainAll(newAssetIds);

        double retentionRate = (double) retained.size() / currentAssetIds.size();

        if (retentionRate < 0.5) {
            errors.add(String.format(
                "Major composition change detected: %.1f%% retention rate (recommend >50%%)",
                retentionRate * 100));
        }

        boolean isValid = errors.isEmpty();

        return new AggregationPoolService.AssetValidationResult(isValid, errors);
    }

    /**
     * Validate asset for adding to existing pool
     */
    public AggregationPoolService.AssetValidationResult validateAssetAddition(
            Asset asset, List<Asset> currentAssets) {

        List<String> errors = new ArrayList<>();

        // Validate the individual asset
        errors.addAll(validateIndividualAsset(asset));

        // Check if asset already exists in pool
        boolean exists = currentAssets.stream()
            .anyMatch(a -> a.getAssetId().equals(asset.getAssetId()));

        if (exists) {
            errors.add(String.format("Asset %s already exists in pool", asset.getAssetId()));
        }

        // Check if adding asset would exceed max assets
        if (currentAssets.size() + 1 > MAX_ASSETS) {
            errors.add(String.format("Adding asset would exceed maximum pool size of %d", MAX_ASSETS));
        }

        boolean isValid = errors.isEmpty();

        return new AggregationPoolService.AssetValidationResult(isValid, errors);
    }
}
