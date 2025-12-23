package io.aurigraph.v11.tokenization.registry;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for AssetClassRegistry.
 *
 * <p>Test coverage includes:</p>
 * <ul>
 *   <li>Token registration (single and batch)</li>
 *   <li>Token retrieval by ID, class, and owner</li>
 *   <li>Merkle proof generation and verification</li>
 *   <li>Statistics and analytics</li>
 *   <li>Performance validation</li>
 *   <li>Concurrent operation handling</li>
 * </ul>
 *
 * @author Aurigraph DLT Platform - Sprint 8-9 QA
 * @version 12.0.0
 * @since 2025-12-23
 */
@QuarkusTest
@DisplayName("AssetClassRegistry Unit Tests")
class AssetClassRegistryTest {

    private AssetClassRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new AssetClassRegistry();
    }

    // ==================== Asset Class Tests ====================

    @Nested
    @DisplayName("Asset Class Enumeration Tests")
    class AssetClassTests {

        @Test
        @DisplayName("Should have 5 asset classes defined")
        void shouldHave5AssetClasses() {
            assertThat(AssetClassRegistry.AssetClass.values()).hasSize(5);
        }

        @ParameterizedTest
        @EnumSource(AssetClassRegistry.AssetClass.class)
        @DisplayName("Each asset class should have valid code and name")
        void eachAssetClassShouldHaveValidCodeAndName(AssetClassRegistry.AssetClass assetClass) {
            assertThat(assetClass.getCode()).isNotBlank();
            assertThat(assetClass.getDisplayName()).isNotBlank();
            assertThat(assetClass.getBaseTransactionFee()).isPositive();
        }

        @Test
        @DisplayName("Should find asset class by code")
        void shouldFindAssetClassByCode() {
            assertThat(AssetClassRegistry.AssetClass.fromCode("RE"))
                    .isPresent()
                    .hasValue(AssetClassRegistry.AssetClass.REAL_ESTATE);

            assertThat(AssetClassRegistry.AssetClass.fromCode("VH"))
                    .isPresent()
                    .hasValue(AssetClassRegistry.AssetClass.VEHICLE);

            assertThat(AssetClassRegistry.AssetClass.fromCode("CM"))
                    .isPresent()
                    .hasValue(AssetClassRegistry.AssetClass.COMMODITY);

            assertThat(AssetClassRegistry.AssetClass.fromCode("IP"))
                    .isPresent()
                    .hasValue(AssetClassRegistry.AssetClass.INTELLECTUAL_PROPERTY);

            assertThat(AssetClassRegistry.AssetClass.fromCode("FN"))
                    .isPresent()
                    .hasValue(AssetClassRegistry.AssetClass.FINANCIAL);
        }

        @Test
        @DisplayName("Should return empty for invalid code")
        void shouldReturnEmptyForInvalidCode() {
            assertThat(AssetClassRegistry.AssetClass.fromCode("INVALID")).isEmpty();
            assertThat(AssetClassRegistry.AssetClass.fromCode("")).isEmpty();
        }
    }

    // ==================== Token Registration Tests ====================

    @Nested
    @DisplayName("Single Token Registration Tests")
    class SingleRegistrationTests {

        @Test
        @DisplayName("Should register token successfully")
        void shouldRegisterTokenSuccessfully() {
            AssetClassRegistry.RegisteredToken token = createToken("TOKEN-001",
                    AssetClassRegistry.AssetClass.REAL_ESTATE, BigDecimal.valueOf(100000));

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getTokenId()).isEqualTo("TOKEN-001");
            assertThat(result.getMerkleRoot()).isNotBlank();
            assertThat(result.getProcessingTimeMs()).isGreaterThanOrEqualTo(0);
        }

        @Test
        @DisplayName("Should reject duplicate token registration")
        void shouldRejectDuplicateToken() {
            AssetClassRegistry.RegisteredToken token = createToken("TOKEN-DUP",
                    AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(50000));

            registry.registerToken(token);
            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getMessage()).contains("already registered");
        }

        @Test
        @DisplayName("Should reject null token")
        void shouldRejectNullToken() {
            assertThatThrownBy(() -> registry.registerToken(null))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("Should reject token with null tokenId")
        void shouldRejectTokenWithNullTokenId() {
            assertThatThrownBy(() -> new AssetClassRegistry.RegisteredToken(
                    null, AssetClassRegistry.AssetClass.COMMODITY,
                    "ASSET-001", BigDecimal.valueOf(1000),
                    "0x123", null))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("Should reject token with null valuation")
        void shouldRejectTokenWithNullValuation() {
            assertThatThrownBy(() -> new AssetClassRegistry.RegisteredToken(
                    "TOKEN-001", AssetClassRegistry.AssetClass.FINANCIAL,
                    "ASSET-001", null,
                    "0x123", null))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("Should reject token with zero valuation")
        void shouldRejectTokenWithZeroValuation() {
            AssetClassRegistry.RegisteredToken token = createToken("TOKEN-ZERO",
                    AssetClassRegistry.AssetClass.REAL_ESTATE, BigDecimal.ZERO);

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getMessage()).contains("validation failed");
        }

        @Test
        @DisplayName("Should reject token with negative valuation")
        void shouldRejectTokenWithNegativeValuation() {
            AssetClassRegistry.RegisteredToken token = createToken("TOKEN-NEG",
                    AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(-1000));

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isFalse();
        }

        @ParameterizedTest
        @EnumSource(AssetClassRegistry.AssetClass.class)
        @DisplayName("Should register tokens in all asset classes")
        void shouldRegisterTokensInAllAssetClasses(AssetClassRegistry.AssetClass assetClass) {
            AssetClassRegistry.RegisteredToken token = createToken(
                    "TOKEN-" + assetClass.getCode(),
                    assetClass, BigDecimal.valueOf(10000));

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isTrue();
            assertThat(registry.getTokenCount(assetClass)).isEqualTo(1);
        }
    }

    // ==================== Batch Registration Tests ====================

    @Nested
    @DisplayName("Batch Token Registration Tests")
    class BatchRegistrationTests {

        @Test
        @DisplayName("Should register batch of tokens successfully")
        void shouldRegisterBatchSuccessfully() {
            List<AssetClassRegistry.RegisteredToken> tokens = IntStream.range(0, 10)
                    .mapToObj(i -> createToken("BATCH-" + i,
                            AssetClassRegistry.AssetClass.REAL_ESTATE,
                            BigDecimal.valueOf(10000 + i * 1000)))
                    .toList();

            List<AssetClassRegistry.RegistrationResult> results = registry.registerTokenBatch(tokens);

            assertThat(results).hasSize(10);
            assertThat(results).allMatch(AssetClassRegistry.RegistrationResult::isSuccess);
        }

        @Test
        @DisplayName("Should handle empty batch")
        void shouldHandleEmptyBatch() {
            List<AssetClassRegistry.RegistrationResult> results = registry.registerTokenBatch(new ArrayList<>());

            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Should handle batch with mixed asset classes")
        void shouldHandleBatchWithMixedAssetClasses() {
            List<AssetClassRegistry.RegisteredToken> tokens = new ArrayList<>();
            for (AssetClassRegistry.AssetClass assetClass : AssetClassRegistry.AssetClass.values()) {
                tokens.add(createToken("MIX-" + assetClass.getCode(), assetClass, BigDecimal.valueOf(5000)));
            }

            List<AssetClassRegistry.RegistrationResult> results = registry.registerTokenBatch(tokens);

            assertThat(results).hasSize(5);
            assertThat(results).allMatch(AssetClassRegistry.RegistrationResult::isSuccess);
        }

        @Test
        @DisplayName("Should handle batch with some invalid tokens")
        void shouldHandleBatchWithInvalidTokens() {
            List<AssetClassRegistry.RegisteredToken> tokens = List.of(
                    createToken("VALID-1", AssetClassRegistry.AssetClass.COMMODITY, BigDecimal.valueOf(1000)),
                    createToken("INVALID", AssetClassRegistry.AssetClass.FINANCIAL, BigDecimal.ZERO),
                    createToken("VALID-2", AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(2000))
            );

            List<AssetClassRegistry.RegistrationResult> results = registry.registerTokenBatch(tokens);

            long successCount = results.stream().filter(AssetClassRegistry.RegistrationResult::isSuccess).count();
            assertThat(successCount).isEqualTo(2);
        }

        @Test
        @DisplayName("Should reject null batch list")
        void shouldRejectNullBatchList() {
            assertThatThrownBy(() -> registry.registerTokenBatch(null))
                    .isInstanceOf(NullPointerException.class);
        }
    }

    // ==================== Token Retrieval Tests ====================

    @Nested
    @DisplayName("Token Retrieval Tests")
    class TokenRetrievalTests {

        @Test
        @DisplayName("Should retrieve token by ID")
        void shouldRetrieveTokenById() {
            AssetClassRegistry.RegisteredToken token = createToken("FIND-001",
                    AssetClassRegistry.AssetClass.INTELLECTUAL_PROPERTY, BigDecimal.valueOf(25000));
            registry.registerToken(token);

            Optional<AssetClassRegistry.RegisteredToken> found = registry.getToken("FIND-001");

            assertThat(found).isPresent();
            assertThat(found.get().getTokenId()).isEqualTo("FIND-001");
            assertThat(found.get().getValuation()).isEqualByComparingTo(BigDecimal.valueOf(25000));
        }

        @Test
        @DisplayName("Should return empty for non-existent token")
        void shouldReturnEmptyForNonExistentToken() {
            Optional<AssetClassRegistry.RegisteredToken> found = registry.getToken("NON-EXISTENT");

            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("Should retrieve token by class and ID")
        void shouldRetrieveTokenByClassAndId() {
            AssetClassRegistry.RegisteredToken token = createToken("CLASS-001",
                    AssetClassRegistry.AssetClass.FINANCIAL, BigDecimal.valueOf(15000));
            registry.registerToken(token);

            Optional<AssetClassRegistry.RegisteredToken> found = registry.getToken(
                    AssetClassRegistry.AssetClass.FINANCIAL, "CLASS-001");

            assertThat(found).isPresent();
        }

        @Test
        @DisplayName("Should retrieve tokens by asset class")
        void shouldRetrieveTokensByAssetClass() {
            for (int i = 0; i < 5; i++) {
                registry.registerToken(createToken("VEHICLE-" + i,
                        AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(10000 + i)));
            }

            Collection<AssetClassRegistry.RegisteredToken> tokens =
                    registry.getTokensByClass(AssetClassRegistry.AssetClass.VEHICLE);

            assertThat(tokens).hasSize(5);
        }

        @Test
        @DisplayName("Should retrieve tokens by owner")
        void shouldRetrieveTokensByOwner() {
            String owner = "0xOwnerAddress123";
            for (int i = 0; i < 3; i++) {
                registry.registerToken(new AssetClassRegistry.RegisteredToken(
                        "OWNER-TOKEN-" + i, AssetClassRegistry.AssetClass.COMMODITY,
                        "ASSET-" + i, BigDecimal.valueOf(5000), owner, null));
            }

            List<AssetClassRegistry.RegisteredToken> tokens = registry.getTokensByOwner(owner);

            assertThat(tokens).hasSize(3);
            assertThat(tokens).allMatch(t -> t.getOwnerAddress().equals(owner));
        }

        @Test
        @DisplayName("Should return empty list for owner with no tokens")
        void shouldReturnEmptyListForOwnerWithNoTokens() {
            List<AssetClassRegistry.RegisteredToken> tokens = registry.getTokensByOwner("0xNonExistentOwner");

            assertThat(tokens).isEmpty();
        }
    }

    // ==================== Merkle Proof Tests ====================

    @Nested
    @DisplayName("Merkle Proof Tests")
    class MerkleProofTests {

        @Test
        @DisplayName("Should generate Merkle proof for registered token")
        void shouldGenerateMerkleProof() {
            registry.registerToken(createToken("PROOF-001",
                    AssetClassRegistry.AssetClass.REAL_ESTATE, BigDecimal.valueOf(100000)));

            Optional<List<String>> proof = registry.getMerkleProof("PROOF-001");

            assertThat(proof).isPresent();
        }

        @Test
        @DisplayName("Should return empty for non-existent token proof")
        void shouldReturnEmptyForNonExistentTokenProof() {
            Optional<List<String>> proof = registry.getMerkleProof("NON-EXISTENT");

            assertThat(proof).isEmpty();
        }

        @Test
        @DisplayName("Should verify valid Merkle proof")
        void shouldVerifyValidMerkleProof() {
            registry.registerToken(createToken("VERIFY-001",
                    AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(50000)));

            Optional<List<String>> proofOpt = registry.getMerkleProof("VERIFY-001");
            assertThat(proofOpt).isPresent();

            boolean isValid = registry.verifyMerkleProof("VERIFY-001", proofOpt.get());

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Should reject invalid Merkle proof")
        void shouldRejectInvalidMerkleProof() {
            registry.registerToken(createToken("INVALID-PROOF",
                    AssetClassRegistry.AssetClass.COMMODITY, BigDecimal.valueOf(25000)));

            List<String> invalidProof = List.of("R:invalid_hash_1", "L:invalid_hash_2");
            boolean isValid = registry.verifyMerkleProof("INVALID-PROOF", invalidProof);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should get Merkle root for asset class")
        void shouldGetMerkleRootForAssetClass() {
            registry.registerToken(createToken("ROOT-001",
                    AssetClassRegistry.AssetClass.FINANCIAL, BigDecimal.valueOf(75000)));

            String root = registry.getMerkleRoot(AssetClassRegistry.AssetClass.FINANCIAL);

            assertThat(root).isNotBlank();
            assertThat(root).hasSize(64); // SHA-256 hex string
        }
    }

    // ==================== Statistics Tests ====================

    @Nested
    @DisplayName("Statistics Tests")
    class StatisticsTests {

        @Test
        @DisplayName("Should return correct token count per class")
        void shouldReturnCorrectTokenCountPerClass() {
            for (int i = 0; i < 5; i++) {
                registry.registerToken(createToken("RE-" + i,
                        AssetClassRegistry.AssetClass.REAL_ESTATE, BigDecimal.valueOf(10000)));
            }

            assertThat(registry.getTokenCount(AssetClassRegistry.AssetClass.REAL_ESTATE)).isEqualTo(5);
            assertThat(registry.getTokenCount(AssetClassRegistry.AssetClass.VEHICLE)).isZero();
        }

        @Test
        @DisplayName("Should return correct total token count")
        void shouldReturnCorrectTotalTokenCount() {
            for (AssetClassRegistry.AssetClass ac : AssetClassRegistry.AssetClass.values()) {
                registry.registerToken(createToken("TOTAL-" + ac.getCode(), ac, BigDecimal.valueOf(1000)));
            }

            assertThat(registry.getTotalTokenCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should calculate total value locked")
        void shouldCalculateTotalValueLocked() {
            registry.registerToken(createToken("TVL-1",
                    AssetClassRegistry.AssetClass.REAL_ESTATE, BigDecimal.valueOf(100000)));
            registry.registerToken(createToken("TVL-2",
                    AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(50000)));

            BigDecimal tvl = registry.getTotalValueLocked();

            assertThat(tvl).isEqualByComparingTo(BigDecimal.valueOf(150000));
        }

        @Test
        @DisplayName("Should calculate value locked by class")
        void shouldCalculateValueLockedByClass() {
            registry.registerToken(createToken("VLC-1",
                    AssetClassRegistry.AssetClass.COMMODITY, BigDecimal.valueOf(10000)));
            registry.registerToken(createToken("VLC-2",
                    AssetClassRegistry.AssetClass.COMMODITY, BigDecimal.valueOf(20000)));

            BigDecimal value = registry.getValueLockedByClass(AssetClassRegistry.AssetClass.COMMODITY);

            assertThat(value).isEqualByComparingTo(BigDecimal.valueOf(30000));
        }

        @Test
        @DisplayName("Should return statistics for all classes")
        void shouldReturnStatisticsForAllClasses() {
            registry.registerToken(createToken("STATS-1",
                    AssetClassRegistry.AssetClass.FINANCIAL, BigDecimal.valueOf(5000)));

            Map<AssetClassRegistry.AssetClass, AssetClassRegistry.RegistryStatistics> stats =
                    registry.getStatistics();

            assertThat(stats).hasSize(5);
            assertThat(stats.get(AssetClassRegistry.AssetClass.FINANCIAL).getTokenCount()).isEqualTo(1);
        }
    }

    // ==================== Performance Tests ====================

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Should register 1000 tokens in less than 100ms")
        void shouldRegister1000TokensQuickly() {
            List<AssetClassRegistry.RegisteredToken> tokens = IntStream.range(0, 1000)
                    .mapToObj(i -> createToken("PERF-" + i,
                            AssetClassRegistry.AssetClass.values()[i % 5],
                            BigDecimal.valueOf(1000 + i)))
                    .toList();

            long startTime = System.currentTimeMillis();
            registry.registerTokenBatch(tokens);
            long duration = System.currentTimeMillis() - startTime;

            assertThat(duration).isLessThan(100);
            assertThat(registry.getTotalTokenCount()).isEqualTo(1000);
        }

        @ParameterizedTest
        @ValueSource(ints = {100, 500, 1000})
        @DisplayName("Should scale linearly with token count")
        void shouldScaleLinearly(int count) {
            List<AssetClassRegistry.RegisteredToken> tokens = IntStream.range(0, count)
                    .mapToObj(i -> createToken("SCALE-" + count + "-" + i,
                            AssetClassRegistry.AssetClass.REAL_ESTATE,
                            BigDecimal.valueOf(1000)))
                    .toList();

            long startTime = System.nanoTime();
            registry.registerTokenBatch(tokens);
            long durationNs = System.nanoTime() - startTime;

            // Should be less than 1ms per 10 tokens
            long maxExpectedNs = count * 100_000L;
            assertThat(durationNs).isLessThan(maxExpectedNs);
        }

        @Test
        @DisplayName("Should generate proof quickly")
        void shouldGenerateProofQuickly() {
            // Register 1000 tokens
            for (int i = 0; i < 1000; i++) {
                registry.registerToken(createToken("PROOF-PERF-" + i,
                        AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(1000)));
            }

            long startTime = System.nanoTime();
            registry.getMerkleProof("PROOF-PERF-500");
            long durationNs = System.nanoTime() - startTime;

            // Should be less than 1ms
            assertThat(durationNs).isLessThan(1_000_000);
        }
    }

    // ==================== Concurrent Operation Tests ====================

    @Nested
    @DisplayName("Concurrent Operation Tests")
    class ConcurrentOperationTests {

        @Test
        @DisplayName("Should handle concurrent registrations")
        void shouldHandleConcurrentRegistrations() throws InterruptedException, ExecutionException {
            int threadCount = 10;
            int tokensPerThread = 100;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);

            List<Future<Integer>> futures = new ArrayList<>();

            for (int t = 0; t < threadCount; t++) {
                final int threadId = t;
                futures.add(executor.submit(() -> {
                    int successCount = 0;
                    for (int i = 0; i < tokensPerThread; i++) {
                        AssetClassRegistry.RegisteredToken token = createToken(
                                "CONCURRENT-" + threadId + "-" + i,
                                AssetClassRegistry.AssetClass.values()[i % 5],
                                BigDecimal.valueOf(1000 + i));
                        if (registry.registerToken(token).isSuccess()) {
                            successCount++;
                        }
                    }
                    return successCount;
                }));
            }

            executor.shutdown();
            executor.awaitTermination(30, TimeUnit.SECONDS);

            int totalSuccess = futures.stream().mapToInt(f -> {
                try {
                    return f.get();
                } catch (Exception e) {
                    return 0;
                }
            }).sum();

            assertThat(totalSuccess).isEqualTo(threadCount * tokensPerThread);
            assertThat(registry.getTotalTokenCount()).isEqualTo(threadCount * tokensPerThread);
        }

        @Test
        @DisplayName("Should handle concurrent reads and writes")
        void shouldHandleConcurrentReadsAndWrites() throws InterruptedException {
            // Pre-populate with some tokens
            for (int i = 0; i < 100; i++) {
                registry.registerToken(createToken("PRE-" + i,
                        AssetClassRegistry.AssetClass.COMMODITY, BigDecimal.valueOf(1000)));
            }

            int readerCount = 5;
            int writerCount = 3;
            ExecutorService executor = Executors.newFixedThreadPool(readerCount + writerCount);
            CountDownLatch latch = new CountDownLatch(readerCount + writerCount);

            // Writers
            for (int w = 0; w < writerCount; w++) {
                final int writerId = w;
                executor.submit(() -> {
                    try {
                        for (int i = 0; i < 50; i++) {
                            registry.registerToken(createToken("WRITE-" + writerId + "-" + i,
                                    AssetClassRegistry.AssetClass.FINANCIAL, BigDecimal.valueOf(500)));
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }

            // Readers
            for (int r = 0; r < readerCount; r++) {
                executor.submit(() -> {
                    try {
                        for (int i = 0; i < 100; i++) {
                            registry.getToken("PRE-" + (i % 100));
                            registry.getTokenCount(AssetClassRegistry.AssetClass.COMMODITY);
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await(30, TimeUnit.SECONDS);
            executor.shutdown();

            // Verify no data corruption
            assertThat(registry.getTotalTokenCount())
                    .isGreaterThanOrEqualTo(100); // At least the pre-populated tokens
        }
    }

    // ==================== Edge Case Tests ====================

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle very large valuations")
        void shouldHandleVeryLargeValuations() {
            BigDecimal largeValue = new BigDecimal("999999999999999999999");
            AssetClassRegistry.RegisteredToken token = createToken("LARGE-VAL",
                    AssetClassRegistry.AssetClass.REAL_ESTATE, largeValue);

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isTrue();
            assertThat(registry.getToken("LARGE-VAL").get().getValuation())
                    .isEqualByComparingTo(largeValue);
        }

        @Test
        @DisplayName("Should handle fractional valuations")
        void shouldHandleFractionalValuations() {
            BigDecimal fractionalValue = new BigDecimal("100.123456789");
            AssetClassRegistry.RegisteredToken token = createToken("FRAC-VAL",
                    AssetClassRegistry.AssetClass.COMMODITY, fractionalValue);

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isTrue();
        }

        @Test
        @DisplayName("Should handle special characters in token ID")
        void shouldHandleSpecialCharactersInTokenId() {
            AssetClassRegistry.RegisteredToken token = createToken("TOKEN-!@#$%^&*()_+",
                    AssetClassRegistry.AssetClass.VEHICLE, BigDecimal.valueOf(10000));

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            assertThat(result.isSuccess()).isTrue();
        }

        @Test
        @DisplayName("Should handle metadata correctly")
        void shouldHandleMetadataCorrectly() {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("location", "New York");
            metadata.put("type", "Commercial");
            metadata.put("year", "2024");

            AssetClassRegistry.RegisteredToken token = new AssetClassRegistry.RegisteredToken(
                    "META-001", AssetClassRegistry.AssetClass.REAL_ESTATE,
                    "ASSET-001", BigDecimal.valueOf(1000000),
                    "0xOwner", metadata);

            registry.registerToken(token);

            Optional<AssetClassRegistry.RegisteredToken> found = registry.getToken("META-001");
            assertThat(found).isPresent();
            assertThat(found.get().getMetadata()).containsEntry("location", "New York");
        }
    }

    // ==================== Helper Methods ====================

    private AssetClassRegistry.RegisteredToken createToken(String tokenId,
                                                           AssetClassRegistry.AssetClass assetClass,
                                                           BigDecimal valuation) {
        return new AssetClassRegistry.RegisteredToken(
                tokenId, assetClass, "ASSET-" + tokenId, valuation,
                "0xDefaultOwner", null);
    }
}
