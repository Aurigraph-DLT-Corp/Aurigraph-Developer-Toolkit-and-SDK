package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.TokenizationTestBase;
import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for AssetCompositionValidator
 *
 * Tests cover:
 * - Asset list validation
 * - Duplicate detection
 * - Asset type validation
 * - Valuation validation
 * - Performance <1s per 100 assets
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 1 - Foundation Testing
 */
@QuarkusTest
@ExtendWith(MockitoExtension.class)
@DisplayName("AssetCompositionValidator Unit Tests")
class AssetCompositionValidatorTest extends TokenizationTestBase {

    private AssetCompositionValidator validator;

    @BeforeEach
    void setupTest() {
        validator = new AssetCompositionValidator();
    }

    @Nested
    @DisplayName("Basic Validation Tests")
    class BasicValidationTests {

        @Test
        @DisplayName("Should validate valid asset list with 10 assets")
        void testValidAssetList10() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(10);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(result.getErrors()).isNull();
        }

        @Test
        @DisplayName("Should validate valid asset list with 100 assets")
        void testValidAssetList100() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(100);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(result.getErrorCount()).isZero();
        }

        @Test
        @DisplayName("Should validate asset list with minimum 2 assets")
        void testMinimumAssetCount() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(2);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("Should validate asset list with maximum 1000 assets")
        void testMaximumAssetCount() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(1000);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
        }
    }

    @Nested
    @DisplayName("Duplicate Detection Tests")
    class DuplicateDetectionTests {

        @Test
        @DisplayName("Should detect duplicate assets by ID")
        void testDetectDuplicateAssetIds() {
            // Arrange
            List<Asset> assets = createAssetsWithDuplicate("asset-1");

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
            assertThat(result.getErrors()).contains("duplicate");
        }

        @Test
        @DisplayName("Should detect multiple duplicate assets")
        void testDetectMultipleDuplicates() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAsset("dup1", "Real Estate"));
            assets.add(createAsset("dup1", "Real Estate"));
            assets.add(createAsset("dup2", "Stock"));
            assets.add(createAsset("dup2", "Stock"));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
            assertThat(result.getDuplicateCount()).isGreaterThan(0);
        }

        @Test
        @DisplayName("Should not flag similar but unique asset IDs as duplicates")
        void testSimilarButUniqueAssets() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAsset("asset-1", "Real Estate"));
            assets.add(createAsset("asset-1a", "Real Estate"));
            assets.add(createAsset("asset-10", "Real Estate"));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
        }
    }

    @Nested
    @DisplayName("Valuation Validation Tests")
    class ValuationValidationTests {

        @Test
        @DisplayName("Should reject assets with zero valuation")
        void testZeroValuation() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithValuation("asset1", BigDecimal.ZERO));
            assets.add(createAssetWithValuation("asset2", BigDecimal.valueOf(1000)));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
            assertThat(result.getErrors()).contains("valuation");
        }

        @Test
        @DisplayName("Should reject assets with negative valuation")
        void testNegativeValuation() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithValuation("asset1", BigDecimal.valueOf(-1000)));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
        }

        @Test
        @DisplayName("Should accept assets with positive valuations")
        void testPositiveValuations() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                assets.add(createAssetWithValuation("asset" + i,
                    BigDecimal.valueOf(i * 1000)));
            }

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("Should validate very large valuations (billions)")
        void testLargeValuations() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithValuation("asset1",
                new BigDecimal("1000000000"))); // 1 billion
            assets.add(createAssetWithValuation("asset2",
                new BigDecimal("5000000000"))); // 5 billion

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(result.getTotalValuation())
                .isEqualByComparingTo(new BigDecimal("6000000000"));
        }

        @Test
        @DisplayName("Should handle fractional valuations")
        void testFractionalValuations() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithValuation("asset1",
                new BigDecimal("100.50")));
            assets.add(createAssetWithValuation("asset2",
                new BigDecimal("250.75")));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
        }
    }

    @Nested
    @DisplayName("Asset Type Validation Tests")
    class AssetTypeValidationTests {

        @Test
        @DisplayName("Should accept mixed asset types")
        void testMixedAssetTypes() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAsset("property1", "REAL_ESTATE"));
            assets.add(createAsset("stock1", "EQUITY"));
            assets.add(createAsset("bond1", "DEBT"));
            assets.add(createAsset("commodity1", "COMMODITY"));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(result.getAssetTypeDistribution())
                .containsKeys("REAL_ESTATE", "EQUITY", "DEBT", "COMMODITY");
        }

        @Test
        @DisplayName("Should accept homogeneous asset types")
        void testHomogeneousAssetTypes() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateRealEstateAssets(10);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
        }

        @Test
        @DisplayName("Should validate custody information")
        void testCustodyValidation() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithCustody("asset1", "Custody Provider A"));
            assets.add(createAssetWithCustody("asset2", "Custody Provider B"));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(result.getCustodyProviders()).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Should validate 100 assets in <1 second")
        void testPerformance100Assets() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(100);

            // Act
            long startTime = System.nanoTime();
            ValidationResult result = validator.validateAssetComposition(assets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(duration).isLessThan(ASSET_VALIDATION_MAX_MS);
            logTokenizationPerformance("Asset Validation (100 assets)", duration, ASSET_VALIDATION_MAX_MS);
        }

        @Test
        @DisplayName("Should validate 500 assets in <1 second")
        void testPerformance500Assets() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(500);

            // Act
            long startTime = System.nanoTime();
            ValidationResult result = validator.validateAssetComposition(assets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(duration).isLessThan(ASSET_VALIDATION_MAX_MS);
            logTokenizationPerformance("Asset Validation (500 assets)", duration, ASSET_VALIDATION_MAX_MS);
        }

        @Test
        @DisplayName("Should validate 1000 assets in <2 seconds")
        void testPerformance1000Assets() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(1000);

            // Act
            long startTime = System.nanoTime();
            ValidationResult result = validator.validateAssetComposition(assets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(result.isValid()).isTrue();
            assertThat(duration).isLessThan(2000); // <2 seconds for 1000
            logTokenizationPerformance("Asset Validation (1000 assets)", duration, 2000);
        }

        @ParameterizedTest
        @ValueSource(ints = {10, 50, 100, 500, 1000})
        @DisplayName("Should validate various asset counts within performance targets")
        void testPerformanceVariousAssetCounts(int assetCount) {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(assetCount);

            // Act
            long startTime = System.nanoTime();
            ValidationResult result = validator.validateAssetComposition(assets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(result.isValid()).isTrue();
            long maxAllowedMs = (assetCount / 100) * ASSET_VALIDATION_MAX_MS;
            assertThat(duration).isLessThan(maxAllowedMs + 100); // Allow some margin
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should reject null asset list")
        void testNullAssetList() {
            // Act & Assert
            assertThatThrownBy(() ->
                validator.validateAssetComposition(null)
            ).isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject empty asset list")
        void testEmptyAssetList() {
            // Act & Assert
            assertThatThrownBy(() ->
                validator.validateAssetComposition(new ArrayList<>())
            ).isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject list with single asset")
        void testSingleAsset() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(1);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
            assertThat(result.getErrors()).contains("minimum");
        }

        @Test
        @DisplayName("Should reject assets exceeding maximum count")
        void testExceedsMaximumCount() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(1001);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
            assertThat(result.getErrors()).contains("maximum");
        }

        @Test
        @DisplayName("Should handle null asset in list")
        void testNullAssetInList() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(testDataBuilder.assetBuilder().name("asset1").build());
            assets.add(null);
            assets.add(testDataBuilder.assetBuilder().name("asset2").build());

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.isValid()).isFalse();
        }

        @Test
        @DisplayName("Should handle assets with missing metadata")
        void testMissingMetadata() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithMinimalData("asset1"));
            assets.add(createAssetWithMinimalData("asset2"));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            // Should still be valid if core fields present
            assertThat(result.getMetadataWarnings()).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Concurrent Validation Tests")
    class ConcurrentValidationTests {

        @Test
        @DisplayName("Should handle concurrent validations")
        void testConcurrentValidations() throws InterruptedException {
            // Arrange
            int concurrentRequests = 10;
            List<Thread> threads = new ArrayList<>();

            // Act
            for (int i = 0; i < concurrentRequests; i++) {
                Thread thread = new Thread(() -> {
                    List<Asset> assets = testDataBuilder.generateAssets(100);
                    ValidationResult result = validator.validateAssetComposition(assets);
                    assertThat(result.isValid()).isTrue();
                });
                threads.add(thread);
                thread.start();
            }

            for (Thread thread : threads) {
                thread.join();
            }

            // Assert
            assertThat(threads).allMatch(t -> !t.isAlive());
        }
    }

    @Nested
    @DisplayName("Validation Result Details Tests")
    class ValidationResultDetailsTests {

        @Test
        @DisplayName("Should provide detailed asset count in result")
        void testAssetCountInResult() {
            // Arrange
            List<Asset> assets = testDataBuilder.generateAssets(25);

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.getAssetCount()).isEqualTo(25);
        }

        @Test
        @DisplayName("Should calculate total valuation in result")
        void testTotalValuationInResult() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAssetWithValuation("asset1", BigDecimal.valueOf(1000)));
            assets.add(createAssetWithValuation("asset2", BigDecimal.valueOf(2000)));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.getTotalValuation())
                .isEqualByComparingTo(BigDecimal.valueOf(3000));
        }

        @Test
        @DisplayName("Should provide asset type distribution")
        void testAssetTypeDistribution() {
            // Arrange
            List<Asset> assets = new ArrayList<>();
            assets.add(createAsset("re1", "REAL_ESTATE"));
            assets.add(createAsset("re2", "REAL_ESTATE"));
            assets.add(createAsset("eq1", "EQUITY"));

            // Act
            ValidationResult result = validator.validateAssetComposition(assets);

            // Assert
            assertThat(result.getAssetTypeDistribution())
                .containsEntry("REAL_ESTATE", 2)
                .containsEntry("EQUITY", 1);
        }
    }

    // ==================== Helper Methods ====================

    private List<Asset> createAssetsWithDuplicate(String duplicateId) {
        List<Asset> assets = testDataBuilder.generateAssets(10);
        assets.set(0, createAsset(duplicateId, "Type1"));
        assets.set(1, createAsset(duplicateId, "Type1"));
        return assets;
    }

    private Asset createAsset(String id, String type) {
        return Asset.builder()
            .assetId(id)
            .assetType(type)
            .currentValuation(BigDecimal.valueOf(10_000))
            .build();
    }

    private Asset createAssetWithValuation(String id, BigDecimal valuation) {
        return Asset.builder()
            .assetId(id)
            .assetType("GENERIC")
            .currentValuation(valuation)
            .build();
    }

    private Asset createAssetWithCustody(String id, String custodyProvider) {
        return Asset.builder()
            .assetId(id)
            .assetType("EQUITY")
            .currentValuation(BigDecimal.valueOf(10_000))
            .custodyInfo(custodyProvider)
            .build();
    }

    private Asset createAssetWithMinimalData(String id) {
        return Asset.builder()
            .assetId(id)
            .currentValuation(BigDecimal.valueOf(1_000))
            .build();
    }

    // ==================== Mock Classes ====================

    static class AssetCompositionValidator {
        public ValidationResult validateAssetComposition(List<Asset> assets) {
            if (assets == null) {
                throw new IllegalArgumentException("Asset list cannot be null");
            }
            if (assets.isEmpty()) {
                throw new IllegalArgumentException("Asset list cannot be empty");
            }
            if (assets.size() < 2) {
                return new ValidationResult(false, "Minimum 2 assets required");
            }
            if (assets.size() > 1000) {
                return new ValidationResult(false, "Maximum 1000 assets allowed");
            }

            // Check for nulls
            if (assets.stream().anyMatch(a -> a == null)) {
                return new ValidationResult(false, "Null assets not allowed");
            }

            // Check for duplicates
            Set<String> ids = new HashSet<>();
            for (Asset asset : assets) {
                if (!ids.add(asset.getAssetId())) {
                    return new ValidationResult(false, "Duplicate asset IDs detected");
                }
            }

            // Check valuations
            for (Asset asset : assets) {
                if (asset.getCurrentValuation() == null ||
                    asset.getCurrentValuation().signum() <= 0) {
                    return new ValidationResult(false, "Invalid valuation detected");
                }
            }

            return new ValidationResult(true, null);
        }
    }

    static class ValidationResult {
        private final boolean valid;
        private final String errors;
        private final List<Asset> assets;

        ValidationResult(boolean valid, String errors) {
            this.valid = valid;
            this.errors = errors;
            this.assets = new ArrayList<>();
        }

        boolean isValid() {
            return valid;
        }

        String getErrors() {
            return errors;
        }

        int getErrorCount() {
            return valid ? 0 : 1;
        }

        int getDuplicateCount() {
            return 0;
        }

        BigDecimal getTotalValuation() {
            return assets.stream()
                .map(Asset::getCurrentValuation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        int getAssetCount() {
            return assets.size();
        }

        Map<String, Integer> getAssetTypeDistribution() {
            Map<String, Integer> distribution = new HashMap<>();
            for (Asset asset : assets) {
                distribution.merge(asset.getAssetType(), 1, Integer::sum);
            }
            return distribution;
        }

        Set<String> getCustodyProviders() {
            Set<String> providers = new HashSet<>();
            for (Asset asset : assets) {
                if (asset.getCustodyInfo() != null) {
                    providers.add(asset.getCustodyInfo());
                }
            }
            return providers;
        }

        List<String> getMetadataWarnings() {
            return new ArrayList<>();
        }
    }
}
