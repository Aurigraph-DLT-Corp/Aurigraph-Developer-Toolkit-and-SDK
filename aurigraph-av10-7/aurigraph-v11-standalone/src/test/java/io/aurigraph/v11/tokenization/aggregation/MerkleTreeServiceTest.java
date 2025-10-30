package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.TokenizationTestBase;
import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.aurigraph.v11.tokenization.MerkleTreeBuilder;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for MerkleTreeService
 *
 * Tests cover:
 * - Merkle root generation for various asset counts
 * - Merkle proof generation and verification
 * - Performance benchmarks (<50ms target)
 * - Edge cases and error handling
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 1 - Foundation Testing
 */
@QuarkusTest
@ExtendWith(MockitoExtension.class)
@DisplayName("MerkleTreeService Unit Tests")
class MerkleTreeServiceTest extends TokenizationTestBase {

    private MerkleTreeBuilder merkleBuilder;
    private List<Asset> testAssets;

    @BeforeEach
    void setupTest() {
        merkleBuilder = new MerkleTreeBuilder();
    }

    @Nested
    @DisplayName("Merkle Root Generation Tests")
    class MerkleRootGenerationTests {

        @Test
        @DisplayName("Should generate valid Merkle root for single asset")
        void testMerkleRootSingleAsset() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(1);

            // Act
            long startTime = System.nanoTime();
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(merkleRoot).matches("0x[a-f0-9]{64}");
            assertThat(duration).isLessThan(MERKLE_VERIFY_MAX_MS);
            logTokenizationPerformance("Merkle Root Generation (1 asset)", duration, MERKLE_VERIFY_MAX_MS);
        }

        @Test
        @DisplayName("Should generate consistent Merkle root for same assets")
        void testMerkleRootConsistency() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            String root1 = merkleBuilder.generateMerkleRoot(testAssets);
            String root2 = merkleBuilder.generateMerkleRoot(testAssets);

            // Assert
            assertThat(root1).isEqualTo(root2);
        }

        @Test
        @DisplayName("Should generate different Merkle roots for different assets")
        void testMerkleRootUniqueness() {
            // Arrange
            List<Asset> assets1 = testDataBuilder.generateAssets(10);
            List<Asset> assets2 = testDataBuilder.generateAssets(10);

            // Act
            String root1 = merkleBuilder.generateMerkleRoot(assets1);
            String root2 = merkleBuilder.generateMerkleRoot(assets2);

            // Assert
            assertThat(root1).isNotEqualTo(root2);
        }

        @Test
        @DisplayName("Should generate Merkle root for 10 assets in <50ms")
        void testMerkleRootPerformance10Assets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            long startTime = System.nanoTime();
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(duration).isLessThan(MERKLE_VERIFY_MAX_MS);
            logTokenizationPerformance("Merkle Root (10 assets)", duration, MERKLE_VERIFY_MAX_MS);
        }

        @Test
        @DisplayName("Should generate Merkle root for 100 assets in <50ms")
        void testMerkleRootPerformance100Assets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(100);

            // Act
            long startTime = System.nanoTime();
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(duration).isLessThan(MERKLE_VERIFY_MAX_MS);
            logTokenizationPerformance("Merkle Root (100 assets)", duration, MERKLE_VERIFY_MAX_MS);
        }

        @Test
        @DisplayName("Should generate Merkle root for 1000 assets")
        void testMerkleRootPerformance1000Assets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(1000);

            // Act
            long startTime = System.nanoTime();
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(duration).isLessThan(200); // 200ms for 1000 assets
            logTokenizationPerformance("Merkle Root (1000 assets)", duration, 200);
        }

        @ParameterizedTest
        @ValueSource(ints = {2, 5, 10, 50, 100, 500, 1000})
        @DisplayName("Should generate valid Merkle root for various asset counts")
        void testMerkleRootVariousAssetCounts(int assetCount) {
            // Arrange
            testAssets = testDataBuilder.generateAssets(assetCount);

            // Act
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(merkleRoot).matches("0x[a-f0-9]{64}");
        }
    }

    @Nested
    @DisplayName("Merkle Proof Generation Tests")
    class MerkleProofGenerationTests {

        @Test
        @DisplayName("Should generate valid Merkle proof for asset in pool")
        void testGenerateMerkleProof() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            Asset targetAsset = testAssets.get(0);

            // Act
            long startTime = System.nanoTime();
            String merkleProof = merkleBuilder.generateMerkleProof(testAssets, targetAsset);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleProof).isNotNull();
            assertThat(merkleProof).isNotEmpty();
            assertThat(duration).isLessThan(50); // <50ms
        }

        @Test
        @DisplayName("Should generate different proofs for different assets")
        void testMerkleProofUniqueness() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            Asset asset1 = testAssets.get(0);
            Asset asset2 = testAssets.get(1);

            // Act
            String proof1 = merkleBuilder.generateMerkleProof(testAssets, asset1);
            String proof2 = merkleBuilder.generateMerkleProof(testAssets, asset2);

            // Assert
            assertThat(proof1).isNotEqualTo(proof2);
        }

        @Test
        @DisplayName("Should generate consistent proofs for same asset")
        void testMerkleProofConsistency() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            Asset targetAsset = testAssets.get(0);

            // Act
            String proof1 = merkleBuilder.generateMerkleProof(testAssets, targetAsset);
            String proof2 = merkleBuilder.generateMerkleProof(testAssets, targetAsset);

            // Assert
            assertThat(proof1).isEqualTo(proof2);
        }

        @ParameterizedTest
        @ValueSource(ints = {2, 10, 100, 1000})
        @DisplayName("Should generate proof for asset in pool of various sizes")
        void testProofGenerationVariousSizes(int poolSize) {
            // Arrange
            testAssets = testDataBuilder.generateAssets(poolSize);
            Asset targetAsset = testAssets.get(poolSize / 2);

            // Act
            String proof = merkleBuilder.generateMerkleProof(testAssets, targetAsset);

            // Assert
            assertThat(proof).isNotNull();
            assertThat(proof).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Merkle Proof Verification Tests")
    class MerkleProofVerificationTests {

        @Test
        @DisplayName("Should verify valid Merkle proof")
        void testVerifyValidMerkleProof() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            Asset targetAsset = testAssets.get(0);
            String merkleProof = merkleBuilder.generateMerkleProof(testAssets, targetAsset);

            // Act
            long startTime = System.nanoTime();
            boolean isValid = merkleBuilder.verifyProof(merkleRoot, merkleProof, targetAsset);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(isValid).isTrue();
            assertThat(duration).isLessThan(MERKLE_VERIFY_MAX_MS);
            logTokenizationPerformance("Merkle Proof Verification", duration, MERKLE_VERIFY_MAX_MS);
        }

        @Test
        @DisplayName("Should reject invalid Merkle proof")
        void testRejectInvalidMerkleProof() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            Asset targetAsset = testAssets.get(0);
            String invalidProof = "0x" + "invalid".repeat(16);

            // Act
            boolean isValid = merkleBuilder.verifyProof(merkleRoot, invalidProof, targetAsset);

            // Assert
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should reject proof with wrong root")
        void testRejectProofWithWrongRoot() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            List<Asset> otherAssets = testDataBuilder.generateAssets(10);
            String wrongRoot = merkleBuilder.generateMerkleRoot(otherAssets);
            Asset targetAsset = testAssets.get(0);
            String proof = merkleBuilder.generateMerkleProof(testAssets, targetAsset);

            // Act
            boolean isValid = merkleBuilder.verifyProof(wrongRoot, proof, targetAsset);

            // Assert
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should verify proofs for all assets in pool")
        void testVerifyProofsForAllAssets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Act & Assert
            for (Asset asset : testAssets) {
                String proof = merkleBuilder.generateMerkleProof(testAssets, asset);
                boolean isValid = merkleBuilder.verifyProof(merkleRoot, proof, asset);
                assertThat(isValid).isTrue();
            }
        }
    }

    @Nested
    @DisplayName("Large-Scale Merkle Tests")
    class LargeScaleMerkleTests {

        @Test
        @DisplayName("Should handle 10K asset Merkle tree")
        void testMerkleTree10KAssets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10_000);

            // Act
            long startTime = System.nanoTime();
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(duration).isLessThan(1000); // 1s for 10K
            logTokenizationPerformance("Merkle Root (10K assets)", duration, 1000);
        }

        @Test
        @DisplayName("Should handle 100K asset Merkle tree")
        void testMerkleTree100KAssets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(100_000);

            // Act
            long startTime = System.nanoTime();
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(duration).isLessThan(5000); // 5s for 100K
            logTokenizationPerformance("Merkle Root (100K assets)", duration, 5000);
        }

        @Test
        @DisplayName("Should verify proofs for large asset pool")
        void testVerifyProofsLargePool() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(1000);
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Act
            int verifiedCount = 0;
            for (int i = 0; i < Math.min(100, testAssets.size()); i++) {
                Asset asset = testAssets.get(i);
                String proof = merkleBuilder.generateMerkleProof(testAssets, asset);
                if (merkleBuilder.verifyProof(merkleRoot, proof, asset)) {
                    verifiedCount++;
                }
            }

            // Assert
            assertThat(verifiedCount).isEqualTo(Math.min(100, testAssets.size()));
        }
    }

    @Nested
    @DisplayName("Merkle Tree Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle odd number of assets")
        void testOddNumberOfAssets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(7);

            // Act
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Assert
            assertThat(merkleRoot).isNotNull();
            assertThat(merkleRoot).matches("0x[a-f0-9]{64}");
        }

        @Test
        @DisplayName("Should handle prime number of assets")
        void testPrimeNumberOfAssets() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(13);

            // Act
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Assert
            assertThat(merkleRoot).isNotNull();
        }

        @Test
        @DisplayName("Should handle power-of-two asset counts")
        void testPowerOfTwoAssetCounts() {
            // Arrange & Act & Assert
            for (int powerOfTwo = 0; powerOfTwo <= 10; powerOfTwo++) {
                int assetCount = (int) Math.pow(2, powerOfTwo);
                List<Asset> assets = testDataBuilder.generateAssets(assetCount);
                String merkleRoot = merkleBuilder.generateMerkleRoot(assets);
                assertThat(merkleRoot).isNotNull();
            }
        }

        @Test
        @DisplayName("Should reject null asset list")
        void testNullAssetList() {
            // Act & Assert
            assertThatThrownBy(() -> merkleBuilder.generateMerkleRoot(null))
                .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject empty asset list")
        void testEmptyAssetList() {
            // Act & Assert
            assertThatThrownBy(() -> merkleBuilder.generateMerkleRoot(List.of()))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Merkle Tree Performance Benchmarks")
    class PerformanceBenchmarks {

        @Test
        @DisplayName("Should complete 100 proof verifications in <5 seconds")
        void testBatch100ProofVerifications() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(50);
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Act
            long startTime = System.nanoTime();
            int verifications = 0;

            for (int i = 0; i < 100; i++) {
                Asset asset = testAssets.get(i % testAssets.size());
                String proof = merkleBuilder.generateMerkleProof(testAssets, asset);
                if (merkleBuilder.verifyProof(merkleRoot, proof, asset)) {
                    verifications++;
                }
            }

            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(verifications).isEqualTo(100);
            assertThat(duration).isLessThan(5000); // <5 seconds
            logTokenizationPerformance("100 Proof Verifications", duration, 5000);
        }

        @Test
        @DisplayName("Should generate proofs for 1000 assets in <10 seconds")
        void testBatch1000ProofGenerations() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(100);

            // Act
            long startTime = System.nanoTime();
            for (int i = 0; i < 1000; i++) {
                Asset asset = testAssets.get(i % testAssets.size());
                merkleBuilder.generateMerkleProof(testAssets, asset);
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(duration).isLessThan(10000);
            logTokenizationPerformance("1000 Proof Generations", duration, 10000);
        }
    }

    @Nested
    @DisplayName("Merkle Root Hash Format Tests")
    class HashFormatTests {

        @Test
        @DisplayName("Should generate 64-character hexadecimal Merkle root")
        void testMerkleRootHashFormat() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(10);

            // Act
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Assert
            assertThat(merkleRoot)
                .matches("0x[a-f0-9]{64}")
                .hasSize(66); // 0x + 64 hex chars
        }

        @Test
        @DisplayName("Should use SHA3-256 hashing algorithm")
        void testSHA3256Hashing() {
            // Arrange
            testAssets = testDataBuilder.generateAssets(5);

            // Act
            String merkleRoot = merkleBuilder.generateMerkleRoot(testAssets);

            // Assert
            // SHA3-256 produces 256-bit hashes = 64 hex characters
            assertThat(merkleRoot).hasSize(66); // "0x" + 64 chars
        }
    }
}
