package io.aurigraph.v11.tokenization;

import io.aurigraph.v11.BaseTest;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for MerkleTreeBuilder test utility.
 *
 * Validates:
 * - Merkle tree construction
 * - Root generation
 * - Proof generation and verification
 * - Performance at scale (100K+ leaves)
 *
 * Target Coverage: 95%+ lines, 90%+ branches
 *
 * @author Quality Assurance Agent (QAA)
 * @version 1.0
 * @since Phase 1 - Foundation Testing
 */
@QuarkusTest
@DisplayName("MerkleTreeBuilder Tests")
public class MerkleTreeBuilderTest extends BaseTest {

    private final MerkleTreeBuilder builder = new MerkleTreeBuilder();
    private final TestDataBuilder testDataBuilder = new TestDataBuilder();

    // ==================== Basic Construction Tests ====================

    @Test
    @DisplayName("Should build Merkle tree with single leaf")
    void testSingleLeafTree() {
        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaf("single-asset")
            .build();

        assertThat(tree).isNotNull();
        assertThat(tree.getRoot()).isNotNull().isNotEmpty();
        assertThat(tree.getLeafCount()).isEqualTo(1);
        assertThat(tree.getDepth()).isEqualTo(1);

        logger.info("Single leaf tree root: {}", tree.getRoot());
    }

    @Test
    @DisplayName("Should build Merkle tree with two leaves")
    void testTwoLeafTree() {
        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaf("asset-1")
            .addLeaf("asset-2")
            .build();

        assertThat(tree).isNotNull();
        assertThat(tree.getRoot()).isNotNull().isNotEmpty();
        assertThat(tree.getLeafCount()).isEqualTo(2);
        assertThat(tree.getDepth()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should build Merkle tree with multiple leaves")
    void testMultipleLeafTree() {
        List<String> leaves = List.of("asset-1", "asset-2", "asset-3", "asset-4");

        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaves(leaves)
            .build();

        assertThat(tree).isNotNull();
        assertThat(tree.getRoot()).isNotNull().isNotEmpty();
        assertThat(tree.getLeafCount()).isEqualTo(4);
        assertThat(tree.getDepth()).isEqualTo(3); // 4 leaves -> 2 levels + root
    }

    @Test
    @DisplayName("Should throw exception when building tree with no leaves")
    void testEmptyTreeThrowsException() {
        assertThatThrownBy(() -> builder.build())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot build Merkle tree with no leaves");
    }

    // ==================== Asset Integration Tests ====================

    @Test
    @DisplayName("Should build Merkle tree from asset list")
    void testBuildTreeFromAssets() {
        List<TestDataBuilder.Asset> assets = testDataBuilder.generateRealEstateAssets(10);

        MerkleTreeBuilder.MerkleTree tree = builder
            .addAssets(assets)
            .build();

        assertThat(tree).isNotNull();
        assertThat(tree.getLeafCount()).isEqualTo(10);
        assertThat(tree.getRoot()).isNotNull().isNotEmpty();

        logger.info("Generated Merkle root for 10 assets: {}", tree.getRoot());
    }

    @Test
    @DisplayName("Should build Merkle tree from token holders")
    void testBuildTreeFromHolders() {
        List<TestDataBuilder.TokenHolder> holders = testDataBuilder.generateHolders(100);

        MerkleTreeBuilder.MerkleTree tree = builder
            .addHolders(holders)
            .build();

        assertThat(tree).isNotNull();
        assertThat(tree.getLeafCount()).isEqualTo(100);
    }

    // ==================== Proof Generation Tests ====================

    @Test
    @DisplayName("Should generate valid Merkle proof for existing leaf")
    void testGenerateProof() {
        List<String> leaves = List.of("asset-1", "asset-2", "asset-3", "asset-4");

        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaves(leaves)
            .build();

        MerkleTreeBuilder.MerkleProof proof = tree.generateProof("asset-1");

        assertThat(proof).isNotNull();
        assertThat(proof.getLeaf()).isEqualTo("asset-1");
        assertThat(proof.getRoot()).isEqualTo(tree.getRoot());
        assertThat(proof.getPath()).isNotEmpty();

        logger.info("Generated proof for asset-1: {} siblings", proof.getProofLength());
    }

    @Test
    @DisplayName("Should throw exception for non-existent leaf")
    void testGenerateProofForNonExistentLeaf() {
        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaf("asset-1")
            .build();

        assertThatThrownBy(() -> tree.generateProof("non-existent"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Leaf not found in tree");
    }

    // ==================== Proof Verification Tests ====================

    @Test
    @DisplayName("Should verify valid Merkle proof")
    void testVerifyValidProof() {
        List<String> leaves = List.of("asset-1", "asset-2", "asset-3", "asset-4");

        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaves(leaves)
            .build();

        MerkleTreeBuilder.MerkleProof proof = tree.generateProof("asset-2");

        boolean isValid = tree.verifyProof(proof);

        assertThat(isValid).isTrue();
        logger.info("✓ Proof verified successfully for asset-2");
    }

    @Test
    @DisplayName("Should reject proof with wrong root")
    void testVerifyProofWithWrongRoot() {
        MerkleTreeBuilder.MerkleTree tree1 = new MerkleTreeBuilder()
            .addLeaf("asset-1")
            .addLeaf("asset-2")
            .build();

        MerkleTreeBuilder.MerkleTree tree2 = new MerkleTreeBuilder()
            .addLeaf("asset-3")
            .addLeaf("asset-4")
            .build();

        MerkleTreeBuilder.MerkleProof proof = tree1.generateProof("asset-1");

        // Verify proof from tree1 against tree2 (should fail)
        boolean isValid = tree2.verifyProof(proof);

        assertThat(isValid).isFalse();
        logger.info("✗ Proof correctly rejected for wrong root");
    }

    // ==================== Performance Tests ====================

    @ParameterizedTest
    @ValueSource(ints = {100, 1_000, 10_000, 100_000})
    @DisplayName("Should build Merkle tree at scale and verify performance")
    void testMerkleTreePerformance(int leafCount) {
        // Generate leaves
        List<String> leaves = IntStream.range(0, leafCount)
            .mapToObj(i -> "asset-" + i)
            .toList();

        // Build tree and measure time
        long buildDuration = measureExecutionTime(() -> {
            builder.clear().addLeaves(leaves).build();
        });

        // Rebuild for proof generation (builder state was cleared)
        MerkleTreeBuilder.MerkleTree tree = new MerkleTreeBuilder()
            .addLeaves(leaves)
            .build();

        // Generate proof and measure time
        long proofDuration = measureExecutionTime(() -> {
            tree.generateProof("asset-0");
        });

        // Verify proof and measure time
        MerkleTreeBuilder.MerkleProof proof = tree.generateProof("asset-0");
        long verifyDuration = measureExecutionTime(() -> {
            tree.verifyProof(proof);
        });

        // Performance assertions
        assertExecutionTime(buildDuration, 5000,
            String.format("Merkle tree build with %d leaves", leafCount));

        assertExecutionTime(proofDuration, MERKLE_VERIFY_MAX_MS,
            String.format("Merkle proof generation for %d leaves", leafCount));

        assertExecutionTime(verifyDuration, MERKLE_VERIFY_MAX_MS,
            String.format("Merkle proof verification for %d leaves", leafCount));

        logger.info("Merkle performance ({} leaves): build {} ms, proof gen {} ms, verify {} ms",
            leafCount, buildDuration, proofDuration, verifyDuration);
    }

    @Test
    @DisplayName("Should generate consistent root for same data")
    void testConsistentRootGeneration() {
        List<String> leaves = List.of("asset-1", "asset-2", "asset-3");

        String root1 = new MerkleTreeBuilder().addLeaves(leaves).buildRoot();
        String root2 = new MerkleTreeBuilder().addLeaves(leaves).buildRoot();
        String root3 = new MerkleTreeBuilder().addLeaves(leaves).buildRoot();

        assertThat(root1).isEqualTo(root2).isEqualTo(root3);
        logger.info("✓ Root generation is consistent: {}", root1);
    }

    @Test
    @DisplayName("Should generate different roots for different data")
    void testDifferentRootsForDifferentData() {
        List<String> leaves1 = List.of("asset-1", "asset-2", "asset-3");
        List<String> leaves2 = List.of("asset-4", "asset-5", "asset-6");

        String root1 = new MerkleTreeBuilder().addLeaves(leaves1).buildRoot();
        String root2 = new MerkleTreeBuilder().addLeaves(leaves2).buildRoot();

        assertThat(root1).isNotEqualTo(root2);
        logger.info("✓ Different data produces different roots");
    }

    // ==================== Edge Cases ====================

    @Test
    @DisplayName("Should handle odd number of leaves correctly")
    void testOddNumberOfLeaves() {
        List<String> leaves = List.of("asset-1", "asset-2", "asset-3");

        MerkleTreeBuilder.MerkleTree tree = builder
            .addLeaves(leaves)
            .build();

        assertThat(tree).isNotNull();
        assertThat(tree.getLeafCount()).isEqualTo(3);

        // Verify proofs for all leaves
        for (String leaf : leaves) {
            MerkleTreeBuilder.MerkleProof proof = tree.generateProof(leaf);
            assertThat(tree.verifyProof(proof)).isTrue();
        }
    }

    @Test
    @DisplayName("Should handle large prime number of leaves")
    void testPrimeNumberOfLeaves() {
        int primeLeafCount = 997; // Large prime number
        List<String> leaves = IntStream.range(0, primeLeafCount)
            .mapToObj(i -> "leaf-" + i)
            .toList();

        MerkleTreeBuilder.MerkleTree tree = new MerkleTreeBuilder()
            .addLeaves(leaves)
            .build();

        assertThat(tree.getLeafCount()).isEqualTo(primeLeafCount);

        // Spot-check proof generation
        MerkleTreeBuilder.MerkleProof proof = tree.generateProof("leaf-500");
        assertThat(tree.verifyProof(proof)).isTrue();
    }
}
