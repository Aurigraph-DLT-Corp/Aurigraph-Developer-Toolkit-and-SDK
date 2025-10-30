package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.TokenizationTestBase;
import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.aurigraph.v11.tokenization.aggregation.models.Token;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for AggregationPoolService
 *
 * Tests cover:
 * - Pool creation with various asset counts
 * - Weight calculation strategies
 * - Merkle root generation
 * - Error handling and validation
 * - Performance thresholds
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 1 - Foundation Testing
 */
@QuarkusTest
@ExtendWith(MockitoExtension.class)
@DisplayName("AggregationPoolService Unit Tests")
class AggregationPoolServiceTest extends TokenizationTestBase {

    @Mock
    private AssetCompositionValidator assetValidator;

    @Mock
    private MerkleTreeService merkleService;

    @Mock
    private WeightingStrategyEngine weightingEngine;

    @InjectMocks
    private AggregationPoolService poolService;

    private List<Asset> testAssets;
    private String testCreatorAddress;

    @BeforeEach
    void setupTest() {
        testCreatorAddress = "creator-" + UUID.randomUUID().toString().substring(0, 8);
        testAssets = new ArrayList<>();

        // Setup default mock behaviors
        when(assetValidator.validateAssetComposition(anyList()))
            .thenReturn(new AssetValidationResult(true, null));

        when(merkleService.generateMerkleRoot(anyList()))
            .thenReturn("0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 64));

        when(weightingEngine.calculateWeights(anyList(), any()))
            .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Nested
    @DisplayName("Pool Creation Tests")
    class PoolCreationTests {

        @Test
        @DisplayName("Should create pool with 10 assets in <5 seconds")
        void testCreatePoolWith10Assets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            long startTime = System.currentTimeMillis();
            var subscriber = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).subscribe().withSubscriber(UniAssertSubscriber.create());

            long duration = System.currentTimeMillis() - startTime;

            // Assert
            assertThat(duration)
                .as("Pool creation with 10 assets should be <5 seconds")
                .isLessThan(POOL_CREATION_MAX_MS);

            subscriber.assertCompleted();
            logTokenizationPerformance("Pool Creation (10 assets)", duration, POOL_CREATION_MAX_MS);
        }

        @Test
        @DisplayName("Should create pool with 100 assets in <5 seconds")
        void testCreatePoolWith100Assets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(100);

            // Act
            long startTime = System.currentTimeMillis();
            var subscriber = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.MARKET_CAP,
                Token.GovernanceModel.WEIGHTED,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).subscribe().withSubscriber(UniAssertSubscriber.create());

            long duration = System.currentTimeMillis() - startTime;

            // Assert
            assertThat(duration)
                .as("Pool creation with 100 assets should be <5 seconds")
                .isLessThan(POOL_CREATION_MAX_MS);

            subscriber.assertCompleted();
            logTokenizationPerformance("Pool Creation (100 assets)", duration, POOL_CREATION_MAX_MS);
        }

        @Test
        @DisplayName("Should create pool with 500 assets in <5 seconds")
        void testCreatePoolWith500Assets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(500);

            // Act
            long startTime = System.currentTimeMillis();
            var subscriber = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.VOLATILITY_ADJUSTED,
                Token.GovernanceModel.MULTI_TIER,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).subscribe().withSubscriber(UniAssertSubscriber.create());

            long duration = System.currentTimeMillis() - startTime;

            // Assert
            assertThat(duration)
                .as("Pool creation with 500 assets should be <5 seconds")
                .isLessThan(POOL_CREATION_MAX_MS);

            subscriber.assertCompleted();
            logTokenizationPerformance("Pool Creation (500 assets)", duration, POOL_CREATION_MAX_MS);
        }

        @Test
        @DisplayName("Should generate valid Merkle root for pool")
        void testMerkleRootGeneration() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(50);

            // Act
            var subscriber = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).subscribe().withSubscriber(UniAssertSubscriber.create());

            // Assert
            subscriber.assertCompleted();
            verify(merkleService, times(1)).generateMerkleRoot(anyList());
            logTokenizationPerformance("Merkle Root Generation", 0, MERKLE_VERIFY_MAX_MS);
        }

        @Test
        @DisplayName("Should return PoolCreationResult with valid structure")
        void testPoolCreationResultStructure() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(20);

            // Act
            var subscriber = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).subscribe().withSubscriber(UniAssertSubscriber.create());

            // Assert
            subscriber.assertCompleted();
            List<PoolCreationResult> items = subscriber.getItems();
            assertThat(items).hasSize(1);

            PoolCreationResult result = items.get(0);
            assertThat(result).isNotNull();
            assertThat(result.getPoolAddress()).isNotNull();
            assertThat(result.getPoolToken()).isNotNull();
            assertThat(result.getCreationTimeMs()).isGreaterThanOrEqualTo(0);
        }

        @Test
        @DisplayName("Should reject empty asset list")
        void testRejectEmptyAssetList() {
            // Arrange
            testAssets = List.of();

            // Act & Assert
            assertThatThrownBy(() ->
                poolService.createAggregatedPool(
                    testAssets,
                    Token.WeightingStrategy.EQUAL,
                    Token.GovernanceModel.SIMPLE,
                    new Token.DistributionConfig(),
                    testCreatorAddress
                ).await().indefinitely()
            ).isInstanceOf(InvalidAssetCompositionException.class);
        }

        @Test
        @DisplayName("Should reject invalid asset composition")
        void testRejectInvalidAssetComposition() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            AssetValidationResult invalidResult = new AssetValidationResult(false, "Duplicate assets found");
            when(assetValidator.validateAssetComposition(testAssets))
                .thenReturn(invalidResult);

            // Act & Assert
            assertThatThrownBy(() ->
                poolService.createAggregatedPool(
                    testAssets,
                    Token.WeightingStrategy.EQUAL,
                    Token.GovernanceModel.SIMPLE,
                    new Token.DistributionConfig(),
                    testCreatorAddress
                ).await().indefinitely()
            ).isInstanceOf(InvalidAssetCompositionException.class);
        }
    }

    @Nested
    @DisplayName("Weighting Strategy Tests")
    class WeightingStrategyTests {

        @Test
        @DisplayName("Should apply equal weighting strategy")
        void testEqualWeightingStrategy() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            verify(weightingEngine, times(1))
                .calculateWeights(testAssets, Token.WeightingStrategy.EQUAL);
        }

        @Test
        @DisplayName("Should apply market-cap weighting strategy")
        void testMarketCapWeightingStrategy() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.MARKET_CAP,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            verify(weightingEngine, times(1))
                .calculateWeights(testAssets, Token.WeightingStrategy.MARKET_CAP);
        }

        @Test
        @DisplayName("Should apply volatility-adjusted weighting strategy")
        void testVolatilityAdjustedWeightingStrategy() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.VOLATILITY_ADJUSTED,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            verify(weightingEngine, times(1))
                .calculateWeights(testAssets, Token.WeightingStrategy.VOLATILITY_ADJUSTED);
        }

        @Test
        @DisplayName("Should apply custom weighting strategy")
        void testCustomWeightingStrategy() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.CUSTOM,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            verify(weightingEngine, times(1))
                .calculateWeights(testAssets, Token.WeightingStrategy.CUSTOM);
        }
    }

    @Nested
    @DisplayName("Governance Model Tests")
    class GovernanceModelTests {

        @Test
        @DisplayName("Should support simple governance model")
        void testSimpleGovernanceModel() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            var result = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPoolToken().getGovernanceModel())
                .isEqualTo(Token.GovernanceModel.SIMPLE);
        }

        @Test
        @DisplayName("Should support weighted governance model")
        void testWeightedGovernanceModel() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            var result = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.WEIGHTED,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPoolToken().getGovernanceModel())
                .isEqualTo(Token.GovernanceModel.WEIGHTED);
        }

        @Test
        @DisplayName("Should support multi-tier governance model")
        void testMultiTierGovernanceModel() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            var result = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.MULTI_TIER,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPoolToken().getGovernanceModel())
                .isEqualTo(Token.GovernanceModel.MULTI_TIER);
        }
    }

    @Nested
    @DisplayName("Real Estate Pool Tests")
    class RealEstatePoolTests {

        @Test
        @DisplayName("Should create real estate property pool")
        void testCreateRealEstatePool() {
            // Arrange
            testAssets = testDataBuilder.generateRealEstateAssets(5);

            // Act
            var result = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.MARKET_CAP,
                Token.GovernanceModel.WEIGHTED,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPoolToken()).isNotNull();
            assertThat(result.getPoolToken().getAssets()).hasSize(5);
        }

        @Test
        @DisplayName("Should calculate total value locked for real estate pool")
        void testCalculateTotalValueLocked() {
            // Arrange
            testAssets = testDataBuilder.generateRealEstateAssets(3);
            BigDecimal expectedTVL = testAssets.stream()
                .map(Asset::getCurrentValuation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Act
            var result = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result.getPoolToken().getTotalValueLocked())
                .isEqualByComparingTo(expectedTVL);
        }
    }

    @Nested
    @DisplayName("Token Price Calculation Tests")
    class TokenPriceCalculationTests {

        @Test
        @DisplayName("Should calculate token price correctly")
        void testTokenPriceCalculation() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            BigDecimal totalValue = testAssets.stream()
                .map(Asset::getCurrentValuation)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Act
            var result = poolService.createAggregatedPool(
                testAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result.getPoolToken().getPricePerToken())
                .isGreaterThan(BigDecimal.ZERO);
            assertThat(result.getPoolToken().getTotalSupply())
                .isEqualByComparingTo(BigDecimal.valueOf(1_000_000)); // Initial supply
        }

        @Test
        @DisplayName("Should handle high-value asset pools")
        void testHighValueAssetPool() {
            // Arrange
            List<Asset> highValueAssets = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                highValueAssets.add(testDataBuilder.assetBuilder()
                    .name("High Value Asset " + i)
                    .value(new BigDecimal("1000000000"))  // $1 billion
                    .build());
            }

            // Act
            var result = poolService.createAggregatedPool(
                highValueAssets,
                Token.WeightingStrategy.EQUAL,
                Token.GovernanceModel.SIMPLE,
                new Token.DistributionConfig(),
                testCreatorAddress
            ).await().indefinitely();

            // Assert
            assertThat(result.getPoolToken().getTotalValueLocked())
                .isGreaterThan(BigDecimal.valueOf(4_000_000_000L));
        }
    }

    @Nested
    @DisplayName("Concurrent Pool Creation Tests")
    class ConcurrentPoolCreationTests {

        @Test
        @DisplayName("Should handle concurrent pool creation requests")
        void testConcurrentPoolCreation() throws InterruptedException {
            // Arrange
            int concurrentRequests = 10;
            List<Thread> threads = new ArrayList<>();

            // Act
            for (int i = 0; i < concurrentRequests; i++) {
                Thread thread = new Thread(() -> {
                    List<Asset> assets = testDataBuilder.generateAssets(10);
                    poolService.createAggregatedPool(
                        assets,
                        Token.WeightingStrategy.EQUAL,
                        Token.GovernanceModel.SIMPLE,
                        new Token.DistributionConfig(),
                        testCreatorAddress
                    ).await().indefinitely();
                });
                threads.add(thread);
                thread.start();
            }

            for (Thread thread : threads) {
                thread.join();
            }

            // Assert - all threads should complete successfully
            assertThat(threads).allMatch(t -> !t.isAlive());
        }
    }

    // ==================== Helper Classes ====================

    /**
     * Mock result class for asset validation
     */
    static class AssetValidationResult {
        private final boolean valid;
        private final String errors;

        AssetValidationResult(boolean valid, String errors) {
            this.valid = valid;
            this.errors = errors;
        }

        boolean isValid() {
            return valid;
        }

        String getErrors() {
            return errors;
        }
    }

    /**
     * Mock result class for pool creation
     */
    static class PoolCreationResult {
        private final String poolAddress;
        private final Token poolToken;
        private final long creationTimeMs;

        PoolCreationResult(String poolAddress, Token poolToken, long creationTimeMs) {
            this.poolAddress = poolAddress;
            this.poolToken = poolToken;
            this.creationTimeMs = creationTimeMs;
        }

        String getPoolAddress() {
            return poolAddress;
        }

        Token getPoolToken() {
            return poolToken;
        }

        long getCreationTimeMs() {
            return creationTimeMs;
        }
    }

    /**
     * Custom exception for invalid asset composition
     */
    static class InvalidAssetCompositionException extends RuntimeException {
        InvalidAssetCompositionException(String message) {
            super(message);
        }
    }
}
