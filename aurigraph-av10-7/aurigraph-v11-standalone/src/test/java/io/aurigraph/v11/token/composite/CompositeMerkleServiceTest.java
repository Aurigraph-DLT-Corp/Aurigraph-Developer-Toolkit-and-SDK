package io.aurigraph.v11.token.composite;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for CompositeMerkleService
 *
 * Tests cover:
 * - Merkle tree construction
 * - Proof generation and verification
 * - Composite 4-level tree structure
 * - Consistency proofs
 * - Performance validation
 *
 * Target: 60+ tests for Merkle verification
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class CompositeMerkleServiceTest {

    @Inject
    CompositeMerkleService merkleService;

    // ==================== HASH UTILITY TESTS ====================

    @Test
    @Order(1)
    @DisplayName("Test 1: SHA-256 hash produces correct length")
    void testSha256HashLength() {
        String hash = merkleService.sha256Hash("test data");

        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: SHA-256 hash is deterministic")
    void testSha256HashDeterministic() {
        String data = "test data " + UUID.randomUUID();

        String hash1 = merkleService.sha256Hash(data);
        String hash2 = merkleService.sha256Hash(data);

        assertEquals(hash1, hash2);
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Different inputs produce different hashes")
    void testSha256DifferentInputsDifferentHashes() {
        String hash1 = merkleService.sha256Hash("input 1");
        String hash2 = merkleService.sha256Hash("input 2");

        assertNotEquals(hash1, hash2);
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: SHA-256 hash of bytes")
    void testSha256HashBytes() {
        byte[] data = "test bytes".getBytes();

        String hash = merkleService.sha256Hash(data);

        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    @Order(5)
    @DisplayName("Test 5: Empty string produces valid hash")
    void testSha256EmptyString() {
        String hash = merkleService.sha256Hash("");

        assertNotNull(hash);
        assertEquals(64, hash.length());
        // SHA-256 of empty string is well-known
        assertEquals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", hash);
    }

    // ==================== MERKLE TREE CONSTRUCTION TESTS ====================

    @Test
    @Order(10)
    @DisplayName("Test 10: Build tree with single leaf")
    void testBuildTreeSingleLeaf() {
        List<String> leaves = List.of("leaf1");

        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        assertNotNull(tree);
        assertNotNull(tree.root);
        assertEquals(1, tree.leafCount);
        assertEquals(1, tree.getDepth());
    }

    @Test
    @Order(11)
    @DisplayName("Test 11: Build tree with two leaves")
    void testBuildTreeTwoLeaves() {
        List<String> leaves = List.of("leaf1", "leaf2");

        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        assertNotNull(tree);
        assertEquals(2, tree.leafCount);
        assertEquals(2, tree.getDepth()); // 2 leaves -> 2 levels
    }

    @Test
    @Order(12)
    @DisplayName("Test 12: Build tree with power of two leaves")
    void testBuildTreePowerOfTwo() {
        List<String> leaves = List.of("a", "b", "c", "d");

        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        assertNotNull(tree);
        assertEquals(4, tree.leafCount);
        assertEquals(3, tree.getDepth()); // 4 leaves -> 3 levels
    }

    @Test
    @Order(13)
    @DisplayName("Test 13: Build tree with non-power of two leaves")
    void testBuildTreeNonPowerOfTwo() {
        List<String> leaves = List.of("a", "b", "c", "d", "e");

        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        assertNotNull(tree);
        assertEquals(5, tree.leafCount);
    }

    @Test
    @Order(14)
    @DisplayName("Test 14: Build tree with empty list")
    void testBuildTreeEmptyList() {
        List<String> leaves = new ArrayList<>();

        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        assertNotNull(tree);
        assertEquals("", tree.root);
        assertEquals(0, tree.leafCount);
    }

    @Test
    @Order(15)
    @DisplayName("Test 15: Tree root is deterministic")
    void testTreeRootDeterministic() {
        List<String> leaves = List.of("a", "b", "c", "d");

        CompositeMerkleService.MerkleTree tree1 = merkleService.buildMerkleTree(leaves);
        CompositeMerkleService.MerkleTree tree2 = merkleService.buildMerkleTree(leaves);

        assertEquals(tree1.root, tree2.root);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5, 8, 10, 16, 32, 100})
    @Order(16)
    @DisplayName("Test 16: Build trees of various sizes")
    void testBuildTreeVariousSizes(int leafCount) {
        List<String> leaves = new ArrayList<>();
        for (int i = 0; i < leafCount; i++) {
            leaves.add("leaf-" + i);
        }

        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        assertNotNull(tree);
        assertEquals(leafCount, tree.leafCount);
        assertNotNull(tree.root);
        assertFalse(tree.root.isEmpty());
    }

    // ==================== COMPOSITE TREE TESTS ====================

    @Test
    @Order(20)
    @DisplayName("Test 20: Build composite tree - no secondaries")
    void testBuildCompositeTreeNoSecondaries() {
        String primaryHash = merkleService.sha256Hash("primary-token");

        CompositeMerkleService.MerkleTree tree = merkleService.buildCompositeTree(
                primaryHash, null, null
        );

        assertNotNull(tree);
        assertNotNull(tree.root);
        assertEquals(3, tree.getDepth()); // 4-level becomes 3 levels with structure
    }

    @Test
    @Order(21)
    @DisplayName("Test 21: Build composite tree - with secondaries")
    void testBuildCompositeTreeWithSecondaries() {
        String primaryHash = merkleService.sha256Hash("primary-token");
        List<String> secondaryHashes = List.of(
                merkleService.sha256Hash("secondary-1"),
                merkleService.sha256Hash("secondary-2"),
                merkleService.sha256Hash("secondary-3")
        );

        CompositeMerkleService.MerkleTree tree = merkleService.buildCompositeTree(
                primaryHash, secondaryHashes, null
        );

        assertNotNull(tree);
        assertNotNull(tree.root);
    }

    @Test
    @Order(22)
    @DisplayName("Test 22: Build composite tree - with binding")
    void testBuildCompositeTreeWithBinding() {
        String primaryHash = merkleService.sha256Hash("primary-token");
        List<String> secondaryHashes = List.of(merkleService.sha256Hash("secondary-1"));
        String bindingHash = merkleService.sha256Hash("contract-binding");

        CompositeMerkleService.MerkleTree tree = merkleService.buildCompositeTree(
                primaryHash, secondaryHashes, bindingHash
        );

        assertNotNull(tree);
        assertNotNull(tree.root);
    }

    @Test
    @Order(23)
    @DisplayName("Test 23: Composite tree root changes with different binding")
    void testCompositeTreeDifferentBinding() {
        String primaryHash = merkleService.sha256Hash("primary-token");
        List<String> secondaryHashes = List.of(merkleService.sha256Hash("secondary-1"));

        CompositeMerkleService.MerkleTree tree1 = merkleService.buildCompositeTree(
                primaryHash, secondaryHashes, null
        );
        CompositeMerkleService.MerkleTree tree2 = merkleService.buildCompositeTree(
                primaryHash, secondaryHashes, merkleService.sha256Hash("binding")
        );

        assertNotEquals(tree1.root, tree2.root);
    }

    // ==================== PROOF GENERATION TESTS ====================

    @Test
    @Order(30)
    @DisplayName("Test 30: Generate proof for first leaf")
    void testGenerateProofFirstLeaf() {
        List<String> leaves = List.of("a", "b", "c", "d");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 0);

        assertNotNull(proof);
        assertEquals(tree.root, proof.root);
        assertEquals(0, proof.leafIndex);
        assertFalse(proof.siblings.isEmpty());
    }

    @Test
    @Order(31)
    @DisplayName("Test 31: Generate proof for last leaf")
    void testGenerateProofLastLeaf() {
        List<String> leaves = List.of("a", "b", "c", "d");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 3);

        assertNotNull(proof);
        assertEquals(3, proof.leafIndex);
    }

    @Test
    @Order(32)
    @DisplayName("Test 32: Generate proof for middle leaf")
    void testGenerateProofMiddleLeaf() {
        List<String> leaves = List.of("a", "b", "c", "d", "e", "f", "g", "h");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 4);

        assertNotNull(proof);
        assertEquals(4, proof.leafIndex);
    }

    @Test
    @Order(33)
    @DisplayName("Test 33: Proof has correct number of siblings")
    void testProofSiblingCount() {
        List<String> leaves = List.of("a", "b", "c", "d"); // 4 leaves = log2(4) = 2 levels
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 0);

        // For 4 leaves, we need 2 siblings (depth - 1)
        assertEquals(2, proof.getProofLength());
    }

    @Test
    @Order(34)
    @DisplayName("Test 34: Invalid tree throws exception")
    void testGenerateProofInvalidTree() {
        assertThrows(IllegalArgumentException.class, () -> {
            merkleService.generateProof(null, 0);
        });
    }

    // ==================== PROOF VERIFICATION TESTS ====================

    @Test
    @Order(40)
    @DisplayName("Test 40: Verify valid proof")
    void testVerifyValidProof() {
        List<String> leaves = List.of("a", "b", "c", "d");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 0);

        boolean valid = merkleService.verifyProof(proof);

        assertTrue(valid);
    }

    @Test
    @Order(41)
    @DisplayName("Test 41: Verify proof for all leaves")
    void testVerifyProofAllLeaves() {
        List<String> leaves = List.of("a", "b", "c", "d", "e", "f", "g", "h");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        for (int i = 0; i < leaves.size(); i++) {
            CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, i);
            assertTrue(merkleService.verifyProof(proof), "Proof for leaf " + i + " should be valid");
        }
    }

    @Test
    @Order(42)
    @DisplayName("Test 42: Verify null proof returns false")
    void testVerifyNullProof() {
        assertFalse(merkleService.verifyProof(null));
    }

    @Test
    @Order(43)
    @DisplayName("Test 43: Verify leaf inclusion")
    void testVerifyLeafInclusion() {
        List<String> leaves = List.of("data1", "data2", "data3", "data4");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 0);

        boolean included = merkleService.verifyLeafInclusion("data1", proof);

        assertTrue(included);
    }

    @Test
    @Order(44)
    @DisplayName("Test 44: Verify wrong data fails inclusion check")
    void testVerifyWrongDataFailsInclusion() {
        List<String> leaves = List.of("data1", "data2", "data3", "data4");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 0);

        boolean included = merkleService.verifyLeafInclusion("wrong-data", proof);

        assertFalse(included);
    }

    // ==================== CONSISTENCY PROOF TESTS ====================

    @Test
    @Order(50)
    @DisplayName("Test 50: Generate consistency proof for consistent trees")
    void testConsistencyProofConsistent() {
        List<String> oldLeaves = List.of("a", "b");
        List<String> newLeaves = List.of("a", "b", "c", "d");

        CompositeMerkleService.MerkleTree oldTree = merkleService.buildMerkleTree(oldLeaves);
        CompositeMerkleService.MerkleTree newTree = merkleService.buildMerkleTree(newLeaves);

        CompositeMerkleService.ConsistencyProof proof = merkleService.generateConsistencyProof(oldTree, newTree);

        assertNotNull(proof);
        assertTrue(proof.consistent);
        assertEquals(2, proof.oldSize);
        assertEquals(4, proof.newSize);
    }

    @Test
    @Order(51)
    @DisplayName("Test 51: Generate consistency proof for inconsistent trees")
    void testConsistencyProofInconsistent() {
        List<String> oldLeaves = List.of("a", "b");
        List<String> newLeaves = List.of("x", "y", "c", "d"); // Different first leaves

        CompositeMerkleService.MerkleTree oldTree = merkleService.buildMerkleTree(oldLeaves);
        CompositeMerkleService.MerkleTree newTree = merkleService.buildMerkleTree(newLeaves);

        CompositeMerkleService.ConsistencyProof proof = merkleService.generateConsistencyProof(oldTree, newTree);

        assertNotNull(proof);
        assertFalse(proof.consistent);
    }

    @Test
    @Order(52)
    @DisplayName("Test 52: Consistency proof rejects old > new")
    void testConsistencyProofRejectsOldGreaterNew() {
        List<String> oldLeaves = List.of("a", "b", "c", "d");
        List<String> newLeaves = List.of("a", "b");

        CompositeMerkleService.MerkleTree oldTree = merkleService.buildMerkleTree(oldLeaves);
        CompositeMerkleService.MerkleTree newTree = merkleService.buildMerkleTree(newLeaves);

        assertThrows(IllegalArgumentException.class, () -> {
            merkleService.generateConsistencyProof(oldTree, newTree);
        });
    }

    // ==================== CACHING TESTS ====================

    @Test
    @Order(60)
    @DisplayName("Test 60: Cache and retrieve tree")
    void testCacheTree() {
        List<String> leaves = List.of("a", "b", "c", "d");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        String treeId = "test-tree-" + UUID.randomUUID();

        merkleService.cacheTree(treeId, tree);
        CompositeMerkleService.MerkleTree cached = merkleService.getCachedTree(treeId);

        assertNotNull(cached);
        assertEquals(tree.root, cached.root);
    }

    @Test
    @Order(61)
    @DisplayName("Test 61: Get non-existent cached tree returns null")
    void testGetNonExistentCachedTree() {
        CompositeMerkleService.MerkleTree cached = merkleService.getCachedTree("non-existent");

        assertNull(cached);
    }

    @Test
    @Order(62)
    @DisplayName("Test 62: Clear caches")
    void testClearCaches() {
        List<String> leaves = List.of("a", "b");
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        merkleService.cacheTree("clear-test", tree);

        merkleService.clearCaches();

        assertNull(merkleService.getCachedTree("clear-test"));
    }

    // ==================== METRICS TESTS ====================

    @Test
    @Order(70)
    @DisplayName("Test 70: Get Merkle metrics")
    void testGetMerkleMetrics() {
        CompositeMerkleService.MerkleMetrics metrics = merkleService.getMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.treeCount >= 0);
        assertTrue(metrics.proofCount >= 0);
        assertTrue(metrics.verifyCount >= 0);
    }

    @Test
    @Order(71)
    @DisplayName("Test 71: Metrics toString format")
    void testMetricsToString() {
        CompositeMerkleService.MerkleMetrics metrics = merkleService.getMetrics();

        String str = metrics.toString();
        assertNotNull(str);
        assertTrue(str.contains("MerkleMetrics"));
    }

    // ==================== PERFORMANCE TESTS ====================

    @Test
    @Order(80)
    @DisplayName("Test 80: Tree construction performance - 1000 leaves")
    @Timeout(5)
    void testTreeConstructionPerformance() {
        List<String> leaves = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            leaves.add("leaf-" + i);
        }

        long startTime = System.currentTimeMillis();
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        long duration = System.currentTimeMillis() - startTime;

        assertNotNull(tree);
        assertEquals(1000, tree.leafCount);
        assertTrue(duration < 100, "Tree construction should be < 100ms, was " + duration + "ms");
    }

    @Test
    @Order(81)
    @DisplayName("Test 81: Proof generation performance")
    @Timeout(1)
    void testProofGenerationPerformance() {
        List<String> leaves = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            leaves.add("leaf-" + i);
        }
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);

        long startTime = System.currentTimeMillis();
        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 500);
        long duration = System.currentTimeMillis() - startTime;

        assertNotNull(proof);
        assertTrue(duration < 50, "Proof generation should be < 50ms, was " + duration + "ms");
    }

    @Test
    @Order(82)
    @DisplayName("Test 82: Proof verification performance")
    @Timeout(1)
    void testProofVerificationPerformance() {
        List<String> leaves = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            leaves.add("leaf-" + i);
        }
        CompositeMerkleService.MerkleTree tree = merkleService.buildMerkleTree(leaves);
        CompositeMerkleService.MerkleProof proof = merkleService.generateProof(tree, 500);

        long startTime = System.currentTimeMillis();
        boolean valid = merkleService.verifyProof(proof);
        long duration = System.currentTimeMillis() - startTime;

        assertTrue(valid);
        assertTrue(duration < 10, "Proof verification should be < 10ms, was " + duration + "ms");
    }
}
