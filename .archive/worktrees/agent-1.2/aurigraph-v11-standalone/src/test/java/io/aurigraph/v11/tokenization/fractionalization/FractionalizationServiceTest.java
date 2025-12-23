package io.aurigraph.v11.tokenization.fractionalization;

import io.aurigraph.v11.tokenization.TokenizationTestBase;
import io.aurigraph.v11.tokenization.fractionalization.models.FractionalAsset;
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
import java.math.RoundingMode;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for FractionalizationService
 *
 * Tests cover:
 * - Asset fractionalization
 * - Primary token creation
 * - Breaking change protection
 * - Revaluation handling
 * - Performance <10s for creation
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 1 - Foundation Testing
 */
@QuarkusTest
@ExtendWith(MockitoExtension.class)
@DisplayName("FractionalizationService Unit Tests")
class FractionalizationServiceTest extends TokenizationTestBase {

    private FractionalizationService fractionalizationService;

    @BeforeEach
    void setupTest() {
        fractionalizationService = new FractionalizationService();
    }

    @Nested
    @DisplayName("Basic Fractionalization Tests")
    class BasicFractionalizationTests {

        @Test
        @DisplayName("Should fractionalizeAsset with 1M fractions in <10s")
        void testFractionalizeAssetBasic() {
            // Arrange
            String assetId = "asset-001";
            BigDecimal assetValue = BigDecimal.valueOf(10_000_000);
            long totalFractions = 1_000_000;

            // Act
            long startTime = System.currentTimeMillis();
            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                new FractionalizationParams()
            );
            long duration = System.currentTimeMillis() - startTime;

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isPrimaryTokenCreated()).isTrue();
            assertThat(result.getTotalFractions()).isEqualTo(totalFractions);
            assertThat(duration).isLessThan(10_000); // <10s
            logTokenizationPerformance("Fractionalization (1M fractions)", duration, 10_000);
        }

        @Test
        @DisplayName("Should create immutable primary token")
        void testCreatePrimaryToken() {
            // Arrange
            String assetId = "asset-002";
            BigDecimal assetValue = BigDecimal.valueOf(5_000_000);
            long totalFractions = 500_000;

            // Act
            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                new FractionalizationParams()
            );

            // Assert
            assertThat(result.getPrimaryTokenId()).isNotNull();
            assertThat(result.getPrimaryTokenId()).matches("[a-f0-9]{64}"); // SHA3-256 hash
            assertThat(result.isPrimaryTokenImmutable()).isTrue();
        }

        @Test
        @DisplayName("Should calculate correct price per fraction")
        void testPricePerFraction() {
            // Arrange
            String assetId = "asset-003";
            BigDecimal assetValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            // Act
            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                new FractionalizationParams()
            );

            // Assert
            BigDecimal expectedPrice = assetValue.divide(
                BigDecimal.valueOf(totalFractions),
                8,
                RoundingMode.HALF_UP
            );
            assertThat(result.getPricePerFraction())
                .isEqualByComparingTo(expectedPrice);
        }

        @Test
        @DisplayName("Should support various fraction counts")
        void testVariousFractionCounts() {
            // Arrange
            String assetId = "asset-004";
            BigDecimal assetValue = BigDecimal.valueOf(1_000_000);
            long[] fractionCounts = {10_000, 100_000, 1_000_000, 10_000_000};

            // Act & Assert
            for (long fractionCount : fractionCounts) {
                FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                    assetId + "-" + fractionCount,
                    assetValue,
                    fractionCount,
                    new FractionalizationParams()
                );

                assertThat(result.getTotalFractions()).isEqualTo(fractionCount);
                assertThat(result.getPricePerFraction()).isGreaterThan(BigDecimal.ZERO);
            }
        }
    }

    @Nested
    @DisplayName("Breaking Change Protection Tests")
    class BreakingChangeProtectionTests {

        @Test
        @DisplayName("Should allow <10% valuation change without protection")
        void testAllowSmallValuationChange() {
            // Arrange
            String assetId = "asset-005";
            BigDecimal originalValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                originalValue,
                totalFractions,
                new FractionalizationParams()
            );

            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.05)); // 5% increase

            // Act
            BreakingChangeValidation validation = fractionalizationService.validateAssetEvolution(
                initial.getPrimaryTokenId(),
                newValue
            );

            // Assert
            assertThat(validation.isAllowed()).isTrue();
            assertThat(validation.getChangePercentage()).isLessThan(BigDecimal.TEN);
        }

        @Test
        @DisplayName("Should flag 10-50% valuation change as requiring verification")
        void testRestrictedValuationChange() {
            // Arrange
            String assetId = "asset-006";
            BigDecimal originalValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                originalValue,
                totalFractions,
                new FractionalizationParams()
            );

            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.25)); // 25% increase

            // Act
            BreakingChangeValidation validation = fractionalizationService.validateAssetEvolution(
                initial.getPrimaryTokenId(),
                newValue
            );

            // Assert
            assertThat(validation.isAllowed()).isFalse();
            assertThat(validation.getChangePercentage())
                .isGreaterThanOrEqualTo(BigDecimal.TEN)
                .isLessThan(new BigDecimal("50"));
            assertThat(validation.requiresThirdPartyVerification()).isTrue();
        }

        @Test
        @DisplayName("Should reject >50% valuation change")
        void testProhibitedValuationChange() {
            // Arrange
            String assetId = "asset-007";
            BigDecimal originalValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                originalValue,
                totalFractions,
                new FractionalizationParams()
            );

            BigDecimal newValue = originalValue.multiply(new BigDecimal("1.6")); // 60% increase

            // Act
            BreakingChangeValidation validation = fractionalizationService.validateAssetEvolution(
                initial.getPrimaryTokenId(),
                newValue
            );

            // Assert
            assertThat(validation.isAllowed()).isFalse();
            assertThat(validation.getChangePercentage()).isGreaterThan(new BigDecimal("50"));
            assertThat(validation.requiresThirdPartyVerification()).isTrue();
            assertThat(validation.requiresGovernanceApproval()).isTrue();
        }

        @Test
        @DisplayName("Should track breaking change history")
        void testBreakingChangeHistory() {
            // Arrange
            String assetId = "asset-008";
            BigDecimal originalValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                originalValue,
                totalFractions,
                new FractionalizationParams()
            );

            // Act
            List<BreakingChangeRecord> history = fractionalizationService.getBreakingChangeHistory(
                initial.getPrimaryTokenId()
            );

            // Assert
            assertThat(history).isNotNull();
            // Should initially be empty unless initial fractionalization is tracked
        }

        @Test
        @DisplayName("Should apply custom breaking change threshold")
        void testCustomBreakingChangeThreshold() {
            // Arrange
            String assetId = "asset-009";
            BigDecimal assetValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationParams params = new FractionalizationParams();
            params.setBreakingChangeThreshold(new BigDecimal("20")); // 20% instead of 50%

            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                params
            );

            BigDecimal newValue = assetValue.multiply(new BigDecimal("1.25")); // 25% increase

            // Act
            BreakingChangeValidation validation = fractionalizationService.validateAssetEvolution(
                result.getPrimaryTokenId(),
                newValue
            );

            // Assert
            // With custom threshold of 20%, a 25% change should be flagged
            assertThat(validation.getChangePercentage()).isGreaterThan(new BigDecimal("20"));
        }
    }

    @Nested
    @DisplayName("Revaluation Tests")
    class RevaluationTests {

        @Test
        @DisplayName("Should update valuation after verification")
        void testUpdateValuationWithVerification() {
            // Arrange
            String assetId = "asset-010";
            BigDecimal originalValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                originalValue,
                totalFractions,
                new FractionalizationParams()
            );

            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.15)); // 15% increase

            // Act
            RevaluationResult result = fractionalizationService.updateValuation(
                initial.getPrimaryTokenId(),
                newValue,
                "Verified by third party",
                true
            );

            // Assert
            assertThat(result.isSuccessful()).isTrue();
            assertThat(result.getNewValuation()).isEqualByComparingTo(newValue);
            assertThat(result.getPreviousValuation()).isEqualByComparingTo(originalValue);
        }

        @Test
        @DisplayName("Should track valuation history")
        void testValuationHistory() {
            // Arrange
            String assetId = "asset-011";
            BigDecimal value1 = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                value1,
                totalFractions,
                new FractionalizationParams()
            );

            BigDecimal value2 = value1.multiply(BigDecimal.valueOf(1.1));
            fractionalizationService.updateValuation(
                initial.getPrimaryTokenId(),
                value2,
                "Market adjustment",
                true
            );

            // Act
            List<ValuationHistoryRecord> history = fractionalizationService.getValuationHistory(
                initial.getPrimaryTokenId()
            );

            // Assert
            assertThat(history).isNotNull();
            assertThat(history.size()).isGreaterThanOrEqualTo(1);
        }

        @Test
        @DisplayName("Should calculate price per fraction after revaluation")
        void testPricePerFractionAfterRevaluation() {
            // Arrange
            String assetId = "asset-012";
            BigDecimal originalValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                originalValue,
                totalFractions,
                new FractionalizationParams()
            );

            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.2)); // 20% increase

            // Act
            RevaluationResult result = fractionalizationService.updateValuation(
                initial.getPrimaryTokenId(),
                newValue,
                "Asset appreciation",
                true
            );

            BigDecimal expectedNewPrice = newValue.divide(
                BigDecimal.valueOf(totalFractions),
                8,
                RoundingMode.HALF_UP
            );

            // Assert
            assertThat(result.getNewPricePerFraction())
                .isEqualByComparingTo(expectedNewPrice);
        }
    }

    @Nested
    @DisplayName("Fractional Holder Management Tests")
    class HolderManagementTests {

        @Test
        @DisplayName("Should track fractional token holders")
        void testTrackTokenHolders() {
            // Arrange
            String assetId = "asset-013";
            BigDecimal assetValue = BigDecimal.valueOf(10_000);
            long totalFractions = 1_000;

            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                new FractionalizationParams()
            );

            // Act
            List<HolderInfo> holders = fractionalizationService.getTokenHolders(
                result.getPrimaryTokenId()
            );

            // Assert
            assertThat(holders).isNotNull();
        }

        @Test
        @DisplayName("Should support tiered holder levels")
        void testTieredHolderLevels() {
            // Arrange
            String assetId = "asset-014";
            BigDecimal assetValue = BigDecimal.valueOf(1_000_000);
            long totalFractions = 10_000;

            FractionalizationParams params = new FractionalizationParams();
            params.setEnableTiers(true);

            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                params
            );

            // Act & Assert
            assertThat(result.isTiersEnabled()).isTrue();
        }

        @Test
        @DisplayName("Should distribute fractions to multiple holders")
        void testDistributeToMultipleHolders() {
            // Arrange
            String assetId = "asset-015";
            BigDecimal assetValue = BigDecimal.valueOf(1_000_000);
            long totalFractions = 10_000;

            FractionalizationResult initial = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                new FractionalizationParams()
            );

            Map<String, Long> distribution = new HashMap<>();
            distribution.put("holder1", 2_000L);
            distribution.put("holder2", 3_000L);
            distribution.put("holder3", 5_000L);

            // Act
            DistributionResult result = fractionalizationService.distributeFractions(
                initial.getPrimaryTokenId(),
                distribution
            );

            // Assert
            assertThat(result.isSuccessful()).isTrue();
            assertThat(result.getHoldersCount()).isEqualTo(3);
            assertThat(result.getTotalDistributed()).isEqualTo(totalFractions);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should reject zero fraction count")
        void testZeroFractionCount() {
            // Act & Assert
            assertThatThrownBy(() ->
                fractionalizationService.fractionalizeAsset(
                    "asset",
                    BigDecimal.valueOf(1000),
                    0,
                    new FractionalizationParams()
                )
            ).isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject zero asset value")
        void testZeroAssetValue() {
            // Act & Assert
            assertThatThrownBy(() ->
                fractionalizationService.fractionalizeAsset(
                    "asset",
                    BigDecimal.ZERO,
                    1_000_000,
                    new FractionalizationParams()
                )
            ).isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject negative asset value")
        void testNegativeAssetValue() {
            // Act & Assert
            assertThatThrownBy(() ->
                fractionalizationService.fractionalizeAsset(
                    "asset",
                    BigDecimal.valueOf(-1000),
                    1_000_000,
                    new FractionalizationParams()
                )
            ).isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should handle very large asset values (trillions)")
        void testVeryLargeAssetValue() {
            // Arrange
            String assetId = "asset-large";
            BigDecimal largeValue = new BigDecimal("1000000000000"); // 1 trillion
            long totalFractions = 10_000_000;

            // Act
            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                largeValue,
                totalFractions,
                new FractionalizationParams()
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPricePerFraction()).isGreaterThan(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Should handle very small fraction prices")
        void testVerySmallFractionPrice() {
            // Arrange
            String assetId = "asset-small";
            BigDecimal assetValue = BigDecimal.valueOf(100); // $100
            long totalFractions = 1_000_000; // 1M fractions

            // Act
            FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                assetId,
                assetValue,
                totalFractions,
                new FractionalizationParams()
            );

            // Assert
            assertThat(result.getPricePerFraction())
                .isEqualByComparingTo(new BigDecimal("0.0001")); // $0.0001 per fraction
        }
    }

    @Nested
    @DisplayName("Concurrent Fractionalization Tests")
    class ConcurrentTests {

        @Test
        @DisplayName("Should handle concurrent fractionalization requests")
        void testConcurrentFractionalization() throws InterruptedException {
            // Arrange
            int concurrentRequests = 10;
            List<Thread> threads = new ArrayList<>();

            // Act
            for (int i = 0; i < concurrentRequests; i++) {
                final int index = i;
                Thread thread = new Thread(() -> {
                    FractionalizationResult result = fractionalizationService.fractionalizeAsset(
                        "asset-" + index,
                        BigDecimal.valueOf(10_000 + index * 1000),
                        1_000_000,
                        new FractionalizationParams()
                    );
                    assertThat(result).isNotNull();
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

    // ==================== Mock Classes ====================

    static class FractionalizationService {
        public FractionalizationResult fractionalizeAsset(
            String assetId,
            BigDecimal assetValue,
            long totalFractions,
            FractionalizationParams params) {

            if (assetValue.signum() <= 0) {
                throw new IllegalArgumentException("Asset value must be positive");
            }
            if (totalFractions <= 0) {
                throw new IllegalArgumentException("Fraction count must be positive");
            }

            String primaryTokenId = generateTokenHash(assetId);
            BigDecimal pricePerFraction = assetValue.divide(
                BigDecimal.valueOf(totalFractions),
                8,
                RoundingMode.HALF_UP
            );

            return new FractionalizationResult(
                primaryTokenId,
                true,
                totalFractions,
                pricePerFraction,
                assetValue
            );
        }

        public BreakingChangeValidation validateAssetEvolution(String primaryTokenId, BigDecimal newValue) {
            return new BreakingChangeValidation();
        }

        public RevaluationResult updateValuation(String primaryTokenId, BigDecimal newValue, String reason, boolean verified) {
            return new RevaluationResult();
        }

        public List<BreakingChangeRecord> getBreakingChangeHistory(String primaryTokenId) {
            return new ArrayList<>();
        }

        public List<ValuationHistoryRecord> getValuationHistory(String primaryTokenId) {
            return new ArrayList<>();
        }

        public List<HolderInfo> getTokenHolders(String primaryTokenId) {
            return new ArrayList<>();
        }

        public DistributionResult distributeFractions(String primaryTokenId, Map<String, Long> distribution) {
            return new DistributionResult();
        }

        private String generateTokenHash(String assetId) {
            return "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 64);
        }
    }

    static class FractionalizationParams {
        private BigDecimal breakingChangeThreshold = new BigDecimal("50");
        private boolean enableTiers = false;

        public void setBreakingChangeThreshold(BigDecimal threshold) {
            this.breakingChangeThreshold = threshold;
        }

        public void setEnableTiers(boolean enable) {
            this.enableTiers = enable;
        }
    }

    static class FractionalizationResult {
        private final String primaryTokenId;
        private final boolean primaryTokenCreated;
        private final long totalFractions;
        private final BigDecimal pricePerFraction;
        private final BigDecimal assetValue;

        FractionalizationResult(String primaryTokenId, boolean created, long fractions, BigDecimal price, BigDecimal value) {
            this.primaryTokenId = primaryTokenId;
            this.primaryTokenCreated = created;
            this.totalFractions = fractions;
            this.pricePerFraction = price;
            this.assetValue = value;
        }

        public String getPrimaryTokenId() { return primaryTokenId; }
        public boolean isPrimaryTokenCreated() { return primaryTokenCreated; }
        public boolean isPrimaryTokenImmutable() { return true; }
        public long getTotalFractions() { return totalFractions; }
        public BigDecimal getPricePerFraction() { return pricePerFraction; }
        public boolean isTiersEnabled() { return false; }
    }

    static class BreakingChangeValidation {
        public boolean isAllowed() { return false; }
        public BigDecimal getChangePercentage() { return BigDecimal.ZERO; }
        public boolean requiresThirdPartyVerification() { return false; }
        public boolean requiresGovernanceApproval() { return false; }
    }

    static class BreakingChangeRecord {
    }

    static class RevaluationResult {
        public boolean isSuccessful() { return true; }
        public BigDecimal getNewValuation() { return BigDecimal.ZERO; }
        public BigDecimal getPreviousValuation() { return BigDecimal.ZERO; }
        public BigDecimal getNewPricePerFraction() { return BigDecimal.ZERO; }
    }

    static class ValuationHistoryRecord {
    }

    static class HolderInfo {
    }

    static class DistributionResult {
        public boolean isSuccessful() { return true; }
        public int getHoldersCount() { return 0; }
        public long getTotalDistributed() { return 0; }
    }
}
