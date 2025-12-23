package io.aurigraph.v11.token.primary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Unit Tests for PrimaryTokenMerkleService
 *
 * Tests cover:
 * - Hash utility tests (10 tests)
 * - Tree construction tests (15 tests)
 * - Proof generation tests (15 tests)
 * - Proof verification tests (10 tests)
 * - Incremental update tests (10 tests)
 *
 * Target: 60 unit tests with 95%+ line coverage
 *
 * @author Composite Token System
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@QuarkusTest
@DisplayName("Primary Token Merkle Service Tests")
class PrimaryTokenMerkleServiceTest {

    @Inject
    PrimaryTokenMerkleService merkleService;

    private static final String TEST_TOKEN_ID = "PT-REAL_ESTATE-a1b2c3d4-e5f6-7g8h";
    private static final String TEST_DIGITAL_TWIN_ID = "DT-PROPERTY-12345";
    private static final String TEST_ASSET_CLASS = "REAL_ESTATE";
    private static final BigDecimal TEST_FACE_VALUE = new BigDecimal("100000.00");
    private static final String TEST_OWNER = "0x1234567890abcdef";

    // =============== HELPER METHODS ===============

    private PrimaryToken createTestToken(int index) {
        return new PrimaryToken(
                String.format("PT-REAL_ESTATE-token-%04d", index),
                String.format("DT-PROPERTY-%04d", index),
                TEST_ASSET_CLASS,
                TEST_FACE_VALUE.add(BigDecimal.valueOf(index)),
                String.format("0x%016x", index)
        );
    }

    private List<PrimaryToken> createTokenList(int count) {
        return IntStream.range(0, count)
                .mapToObj(this::createTestToken)
                .collect(Collectors.toList());
    }

    private long measureExecutionTime(Runnable task) {
        long start = System.nanoTime();
        task.run();
        return (System.nanoTime() - start) / 1_000_000; // Convert to milliseconds
    }

    @BeforeEach
    void setUp() {
        // Clear caches before each test
        merkleService.clearTokenTreeCache();
    }

    // =============== HASH UTILITY TESTS (10 tests) ===============

    @Nested
    @DisplayName("Hash Utility Tests")
    class HashUtilityTests {

        @Test
        @DisplayName("Should hash primary token deterministically")
        void testHashPrimaryTokenDeterminism() {
            PrimaryToken token = createTestToken(0);
            String hash1 = merkleService.hashPrimaryToken(token);
            String hash2 = merkleService.hashPrimaryToken(token);
            assertEquals(hash1, hash2, "Same token should produce same hash");
        }

        @Test
        @DisplayName("Should include tokenId in hash")
        void testHashIncludesTokenId() {
            PrimaryToken token1 = createTestToken(0);
            PrimaryToken token2 = createTestToken(0);
            token2.tokenId = "PT-REAL_ESTATE-different-id";

            String hash1 = merkleService.hashPrimaryToken(token1);
            String hash2 = merkleService.hashPrimaryToken(token2);
            assertNotEquals(hash1, hash2, "Different tokenIds should produce different hashes");
        }

        @Test
        @DisplayName("Should include faceValue in hash")
        void testHashIncludesFaceValue() {
            PrimaryToken token1 = createTestToken(0);
            PrimaryToken token2 = createTestToken(0);
            token2.faceValue = new BigDecimal("999999.99");

            String hash1 = merkleService.hashPrimaryToken(token1);
            String hash2 = merkleService.hashPrimaryToken(token2);
            assertNotEquals(hash1, hash2, "Different faceValues should produce different hashes");
        }

        @Test
        @DisplayName("Should include owner in hash")
        void testHashIncludesOwner() {
            PrimaryToken token1 = createTestToken(0);
            PrimaryToken token2 = createTestToken(0);
            token2.owner = "0xdifferentowner";

            String hash1 = merkleService.hashPrimaryToken(token1);
            String hash2 = merkleService.hashPrimaryToken(token2);
            assertNotEquals(hash1, hash2, "Different owners should produce different hashes");
        }

        @Test
        @DisplayName("Should include assetClass in hash")
        void testHashIncludesAssetClass() {
            PrimaryToken token1 = createTestToken(0);
            PrimaryToken token2 = createTestToken(0);
            token2.assetClass = "VEHICLE";

            String hash1 = merkleService.hashPrimaryToken(token1);
            String hash2 = merkleService.hashPrimaryToken(token2);
            assertNotEquals(hash1, hash2, "Different asset classes should produce different hashes");
        }

        @Test
        @DisplayName("Should handle null fields gracefully")
        void testHashNullFields() {
            PrimaryToken token = new PrimaryToken();
            assertDoesNotThrow(() -> merkleService.hashPrimaryToken(token));
        }

        @Test
        @DisplayName("Should reject null token")
        void testHashNullToken() {
            assertThrows(IllegalArgumentException.class,
                () -> merkleService.hashPrimaryToken(null));
        }

        @Test
        @DisplayName("Should handle special characters in owner")
        void testHashSpecialCharacters() {
            PrimaryToken token = createTestToken(0);
            token.owner = "0x!@#$%^&*()_+-={}[]|\\:;\"'<>,.?/";
            assertDoesNotThrow(() -> merkleService.hashPrimaryToken(token));
        }

        @Test
        @DisplayName("Should return 64-character hex hash")
        void testHashFormat() {
            PrimaryToken token = createTestToken(0);
            String hash = merkleService.hashPrimaryToken(token);
            assertEquals(64, hash.length(), "SHA-256 hash should be 64 characters");
            assertTrue(hash.matches("[a-f0-9]{64}"), "Hash should be lowercase hex");
        }

        @Test
        @DisplayName("Should hash 1000 tokens in under 1000ms")
        void testHashPerformance() {
            List<PrimaryToken> tokens = createTokenList(1000);

            long duration = measureExecutionTime(() -> {
                tokens.forEach(merkleService::hashPrimaryToken);
            });

            assertTrue(duration < 1000,
                String.format("Hashing 1000 tokens took %dms, expected < 1000ms", duration));
        }
    }

    // =============== TREE CONSTRUCTION TESTS (15 tests) ===============

    @Nested
    @DisplayName("Tree Construction Tests")
    class TreeConstructionTests {

        @Test
        @DisplayName("Should build empty tree")
        void testBuildEmptyTree() {
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(new ArrayList<>());
            assertNotNull(tree);
            assertEquals("", tree.root);
            assertEquals(0, tree.leafCount);
        }

        @Test
        @DisplayName("Should build single token tree")
        void testBuildSingleTokenTree() {
            List<PrimaryToken> tokens = createTokenList(1);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertNotNull(tree);
            assertNotNull(tree.root);
            assertFalse(tree.root.isEmpty());
            assertEquals(1, tree.leafCount);
        }

        @Test
        @DisplayName("Should build tree with 2 tokens")
        void testBuildTwoTokensTree() {
            List<PrimaryToken> tokens = createTokenList(2);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(2, tree.leafCount);
            assertEquals(2, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 4 tokens")
        void testBuildFourTokensTree() {
            List<PrimaryToken> tokens = createTokenList(4);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(4, tree.leafCount);
            assertEquals(3, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 8 tokens")
        void testBuildEightTokensTree() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(8, tree.leafCount);
            assertEquals(4, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 16 tokens")
        void testBuildSixteenTokensTree() {
            List<PrimaryToken> tokens = createTokenList(16);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(16, tree.leafCount);
            assertEquals(5, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 1024 tokens")
        void testBuildLargeTree() {
            List<PrimaryToken> tokens = createTokenList(1024);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(1024, tree.leafCount);
            assertEquals(11, tree.getDepth());
        }

        @Test
        @DisplayName("Should handle power of two token count")
        void testTreePowerOfTwo() {
            List<PrimaryToken> tokens = createTokenList(32);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertEquals(32, tree.leafCount);
            assertEquals(6, tree.getDepth());
        }

        @Test
        @DisplayName("Should handle non-power of two token count")
        void testTreeNonPowerOfTwo() {
            List<PrimaryToken> tokens = createTokenList(7);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertEquals(7, tree.leafCount);
            assertEquals(4, tree.getDepth()); // Ceil(log2(7)) + 1 = 4
        }

        @Test
        @DisplayName("Should have correct tree structure with proper levels")
        void testTreeStructure() {
            List<PrimaryToken> tokens = createTokenList(4);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertEquals(3, tree.levels.size());
            assertEquals(4, tree.levels.get(0).size()); // 4 leaves
            assertEquals(2, tree.levels.get(1).size()); // 2 intermediate
            assertEquals(1, tree.levels.get(2).size()); // 1 root
        }

        @Test
        @DisplayName("Should verify all leaves are hashed tokens")
        void testTreeLeaves() {
            List<PrimaryToken> tokens = createTokenList(4);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            List<String> expectedLeaves = tokens.stream()
                    .map(merkleService::hashPrimaryToken)
                    .collect(Collectors.toList());

            assertEquals(expectedLeaves, tree.levels.get(0));
        }

        @Test
        @DisplayName("Should build tree in under 100ms for 1000 tokens")
        void testTreePerformance() {
            List<PrimaryToken> tokens = createTokenList(1000);

            long duration = measureExecutionTime(() -> {
                merkleService.buildPrimaryTokenTree(tokens);
            });

            assertTrue(duration < 100,
                String.format("Building tree with 1000 tokens took %dms, expected < 100ms", duration));
        }

        @Test
        @DisplayName("Should produce consistent root for same tokens")
        void testTreeRootConsistency() {
            List<PrimaryToken> tokens = createTokenList(10);
            PrimaryTokenMerkleService.MerkleTree tree1 = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleTree tree2 = merkleService.buildPrimaryTokenTree(tokens);

            assertEquals(tree1.root, tree2.root, "Same tokens should produce same root");
        }

        @Test
        @DisplayName("Should handle null token list")
        void testBuildNullTokenList() {
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(null);
            assertNotNull(tree);
            assertEquals("", tree.root);
            assertEquals(0, tree.leafCount);
        }

        @Test
        @DisplayName("Should provide meaningful toString")
        void testTreeToString() {
            List<PrimaryToken> tokens = createTokenList(10);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            String treeString = tree.toString();
            assertNotNull(treeString);
            assertTrue(treeString.contains("MerkleTree"));
            assertTrue(treeString.contains("tokens=10"));
        }
    }

    // =============== PROOF GENERATION TESTS (15 tests) ===============

    @Nested
    @DisplayName("Proof Generation Tests")
    class ProofGenerationTests {

        @Test
        @DisplayName("Should generate proof for first token")
        void testGenerateProofFirstToken() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            assertNotNull(proof);
            assertEquals(0, proof.leafIndex);
            assertEquals(tree.root, proof.root);
        }

        @Test
        @DisplayName("Should generate proof for middle token")
        void testGenerateProofMiddleToken() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 4);
            assertNotNull(proof);
            assertEquals(4, proof.leafIndex);
        }

        @Test
        @DisplayName("Should generate proof for last token")
        void testGenerateProofLastToken() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 7);
            assertNotNull(proof);
            assertEquals(7, proof.leafIndex);
        }

        @Test
        @DisplayName("Should have proper proof structure with siblings")
        void testProofStructure() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);
            assertNotNull(proof.siblings);
            assertNotNull(proof.directions);
            assertEquals(proof.siblings.size(), proof.directions.size());
        }

        @Test
        @DisplayName("Should have correct number of siblings")
        void testProofLength() {
            List<PrimaryToken> tokens = createTokenList(16);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 5);
            // For 16 tokens (depth=5), proof should have 4 siblings
            assertEquals(4, proof.getProofLength());
        }

        @Test
        @DisplayName("Should generate proof in under 50ms")
        void testProofPerformance() {
            List<PrimaryToken> tokens = createTokenList(1000);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            long duration = measureExecutionTime(() -> {
                merkleService.generateTokenProof(tree, 500);
            });

            assertTrue(duration < 50,
                String.format("Proof generation took %dms, expected < 50ms", duration));
        }

        @Test
        @DisplayName("Should return null for non-existent token index")
        void testProofForInvalidIndex() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertThrows(IllegalArgumentException.class,
                () -> merkleService.generateTokenProof(tree, 100));
        }

        @Test
        @DisplayName("Should return null for negative index")
        void testProofForNegativeIndex() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertThrows(IllegalArgumentException.class,
                () -> merkleService.generateTokenProof(tree, -1));
        }

        @Test
        @DisplayName("Should cache generated proofs")
        void testProofCaching() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof1 = merkleService.generateTokenProof(tree, 3);
            PrimaryTokenMerkleService.MerkleProof proof2 = merkleService.getCachedProof(tree.root, 3);

            assertNotNull(proof2);
            assertEquals(proof1.leafHash, proof2.leafHash);
        }

        @Test
        @DisplayName("Should generate proof by token hash")
        void testGenerateProofByTokenHash() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            String tokenHash = merkleService.hashPrimaryToken(tokens.get(5));
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateProofByTokenHash(tree, tokenHash);

            assertNotNull(proof);
            assertEquals(tokenHash, proof.leafHash);
            assertEquals(5, proof.leafIndex);
        }

        @Test
        @DisplayName("Should return null for non-existent token hash")
        void testProofForNonExistentHash() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            String nonExistentHash = merkleService.sha256Hash("non-existent-token");
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateProofByTokenHash(tree, nonExistentHash);

            assertNull(proof);
        }

        @Test
        @DisplayName("Should generate proofs with varying tree sizes")
        void testProofWithVaryingSizes() {
            for (int size : Arrays.asList(1, 2, 4, 8, 16, 32, 64)) {
                List<PrimaryToken> tokens = createTokenList(size);
                PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

                PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
                assertNotNull(proof);
            }
        }

        @Test
        @DisplayName("Should reject null tree")
        void testProofForNullTree() {
            assertThrows(IllegalArgumentException.class,
                () -> merkleService.generateTokenProof(null, 0));
        }

        @Test
        @DisplayName("Should have consistent leaf hash in proof")
        void testProofLeafHash() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            String expectedLeaf = tree.levels.get(0).get(3);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            assertEquals(expectedLeaf, proof.leafHash);
        }

        @Test
        @DisplayName("Should provide meaningful proof toString")
        void testProofToString() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);
            String proofString = proof.toString();

            assertNotNull(proofString);
            assertTrue(proofString.contains("MerkleProof"));
            assertTrue(proofString.contains("token=3"));
        }
    }

    // =============== PROOF VERIFICATION TESTS (10 tests) ===============

    @Nested
    @DisplayName("Proof Verification Tests")
    class ProofVerificationTests {

        @Test
        @DisplayName("Should verify valid proof returns true")
        void testVerifyValidProof() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            assertTrue(merkleService.verifyProof(proof));
        }

        @Test
        @DisplayName("Should verify invalid proof returns false")
        void testVerifyInvalidProof() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            // Create invalid proof with wrong root
            PrimaryTokenMerkleService.MerkleProof invalidProof = new PrimaryTokenMerkleService.MerkleProof(
                proof.leafHash,
                "invalid_root_hash",
                proof.siblings,
                proof.directions,
                proof.leafIndex
            );

            assertFalse(merkleService.verifyProof(invalidProof));
        }

        @Test
        @DisplayName("Should fail verification with mutated leaf")
        void testVerifyMutatedLeaf() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            // Create proof with mutated leaf
            PrimaryTokenMerkleService.MerkleProof mutatedProof = new PrimaryTokenMerkleService.MerkleProof(
                "mutated_leaf_hash",
                proof.root,
                proof.siblings,
                proof.directions,
                proof.leafIndex
            );

            assertFalse(merkleService.verifyProof(mutatedProof));
        }

        @Test
        @DisplayName("Should fail verification with mutated sibling")
        void testVerifyMutatedSibling() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            // Mutate sibling
            List<String> mutatedSiblings = new ArrayList<>(proof.siblings);
            mutatedSiblings.set(0, "mutated_sibling");

            PrimaryTokenMerkleService.MerkleProof mutatedProof = new PrimaryTokenMerkleService.MerkleProof(
                proof.leafHash,
                proof.root,
                mutatedSiblings,
                proof.directions,
                proof.leafIndex
            );

            assertFalse(merkleService.verifyProof(mutatedProof));
        }

        @Test
        @DisplayName("Should verify in under 10ms")
        void testVerifyPerformance() {
            List<PrimaryToken> tokens = createTokenList(1000);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 500);

            long duration = measureExecutionTime(() -> {
                merkleService.verifyProof(proof);
            });

            assertTrue(duration < 10,
                String.format("Proof verification took %dms, expected < 10ms", duration));
        }

        @Test
        @DisplayName("Should verify token inclusion matches")
        void testVerifyTokenInclusionMatches() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryToken token = tokens.get(3);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            assertTrue(merkleService.verifyTokenInclusion(token, proof));
        }

        @Test
        @DisplayName("Should fail token inclusion with wrong token")
        void testVerifyTokenInclusionMismatch() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryToken wrongToken = createTestToken(999);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 3);

            assertFalse(merkleService.verifyTokenInclusion(wrongToken, proof));
        }

        @Test
        @DisplayName("Should handle null proof verification")
        void testVerifyNullProof() {
            assertFalse(merkleService.verifyProof(null));
        }

        @Test
        @DisplayName("Should verify all tokens in tree")
        void testVerifyAllTokens() {
            List<PrimaryToken> tokens = createTokenList(16);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            for (int i = 0; i < tokens.size(); i++) {
                PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, i);
                assertTrue(merkleService.verifyProof(proof), "Token " + i + " proof should be valid");
            }
        }

        @Test
        @DisplayName("Should verify proof for single token tree")
        void testVerifySingleTokenTree() {
            List<PrimaryToken> tokens = createTokenList(1);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            PrimaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);

            assertTrue(merkleService.verifyProof(proof));
        }
    }

    // =============== INCREMENTAL UPDATE TESTS (10 tests) ===============

    @Nested
    @DisplayName("Incremental Update Tests")
    class IncrementalUpdateTests {

        @Test
        @DisplayName("Should add token to tree and change root")
        void testAddTokenToTree() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree originalTree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryToken newToken = createTestToken(999);
            PrimaryTokenMerkleService.MerkleTree updatedTree = merkleService.addTokenToTree(originalTree, newToken);

            assertNotEquals(originalTree.root, updatedTree.root);
            assertEquals(9, updatedTree.leafCount);
        }

        @Test
        @DisplayName("Should add multiple tokens sequentially")
        void testAddMultipleTokens() {
            List<PrimaryToken> tokens = createTokenList(4);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            for (int i = 0; i < 4; i++) {
                PrimaryToken newToken = createTestToken(100 + i);
                tree = merkleService.addTokenToTree(tree, newToken);
            }

            assertEquals(8, tree.leafCount);
        }

        @Test
        @DisplayName("Should add token to null tree")
        void testAddTokenToNullTree() {
            PrimaryToken token = createTestToken(0);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.addTokenToTree(null, token);

            assertNotNull(tree);
            assertEquals(1, tree.leafCount);
        }

        @Test
        @DisplayName("Should remove token from tree and change root")
        void testRemoveTokenFromTree() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree originalTree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleTree updatedTree = merkleService.removeTokenFromTree(originalTree, 3);

            assertNotEquals(originalTree.root, updatedTree.root);
            assertEquals(7, updatedTree.leafCount);
        }

        @Test
        @DisplayName("Should remove multiple tokens sequentially")
        void testRemoveMultipleTokens() {
            List<PrimaryToken> tokens = createTokenList(10);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            // Remove tokens from the end
            tree = merkleService.removeTokenFromTree(tree, 9);
            tree = merkleService.removeTokenFromTree(tree, 8);
            tree = merkleService.removeTokenFromTree(tree, 7);

            assertEquals(7, tree.leafCount);
        }

        @Test
        @DisplayName("Should return empty tree when removing last token")
        void testRemoveLastToken() {
            List<PrimaryToken> tokens = createTokenList(1);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleTree emptyTree = merkleService.removeTokenFromTree(tree, 0);

            assertEquals("", emptyTree.root);
            assertEquals(0, emptyTree.leafCount);
        }

        @Test
        @DisplayName("Should throw exception for invalid remove index")
        void testRemoveInvalidIndex() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            assertThrows(IllegalArgumentException.class,
                () -> merkleService.removeTokenFromTree(tree, 100));
        }

        @Test
        @DisplayName("Should rebuild after updates for consistency")
        void testRebuildAfterUpdates() {
            List<PrimaryToken> tokens = createTokenList(8);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            // Add and remove tokens
            tree = merkleService.addTokenToTree(tree, createTestToken(100));
            tree = merkleService.removeTokenFromTree(tree, 4);
            tree = merkleService.addTokenToTree(tree, createTestToken(101));

            // Rebuild from scratch with same leaves
            PrimaryTokenMerkleService.MerkleTree rebuiltTree = merkleService.buildPrimaryTokenTree(
                tree.levels.get(0).stream()
                    .map(hash -> {
                        PrimaryToken t = createTestToken(0);
                        t.tokenId = hash; // Use hash as surrogate
                        return t;
                    })
                    .collect(Collectors.toList())
            );

            // Both should have same structure
            assertEquals(tree.leafCount, rebuiltTree.leafCount);
        }

        @Test
        @DisplayName("Should perform incremental add in reasonable time")
        void testIncrementalAddPerformance() {
            List<PrimaryToken> tokens = createTokenList(100);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            long duration = measureExecutionTime(() -> {
                for (int i = 0; i < 10; i++) {
                    merkleService.addTokenToTree(tree, createTestToken(200 + i));
                }
            });

            assertTrue(duration < 100,
                String.format("10 incremental adds took %dms, expected < 100ms", duration));
        }

        @Test
        @DisplayName("Should perform incremental remove in reasonable time")
        void testIncrementalRemovePerformance() {
            List<PrimaryToken> tokens = createTokenList(100);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            long duration = measureExecutionTime(() -> {
                PrimaryTokenMerkleService.MerkleTree tempTree = tree;
                for (int i = 0; i < 10; i++) {
                    tempTree = merkleService.removeTokenFromTree(tempTree, 0);
                }
            });

            assertTrue(duration < 100,
                String.format("10 incremental removes took %dms, expected < 100ms", duration));
        }
    }

    // =============== ADDITIONAL SERVICE TESTS ===============

    @Nested
    @DisplayName("Service Metrics and Cache Tests")
    class ServiceTests {

        @Test
        @DisplayName("Should get service metrics")
        void testGetMetrics() {
            List<PrimaryToken> tokens = createTokenList(10);
            merkleService.buildPrimaryTokenTree(tokens);

            PrimaryTokenMerkleService.MerkleMetrics metrics = merkleService.getMetrics();
            assertNotNull(metrics);
            assertTrue(metrics.treeCount > 0);
        }

        @Test
        @DisplayName("Should cache token tree")
        void testCacheTokenTree() {
            List<PrimaryToken> tokens = createTokenList(10);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            merkleService.cacheTokenTree("test-registry", tree);
            PrimaryTokenMerkleService.MerkleTree cached = merkleService.getCachedTokenTree("test-registry");

            assertNotNull(cached);
            assertEquals(tree.root, cached.root);
        }

        @Test
        @DisplayName("Should clear token tree cache")
        void testClearCache() {
            List<PrimaryToken> tokens = createTokenList(10);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            merkleService.cacheTokenTree("test-registry", tree);

            merkleService.clearTokenTreeCache();

            assertNull(merkleService.getCachedTokenTree("test-registry"));
        }

        @Test
        @DisplayName("Should validate registry integrity with valid root")
        void testValidateRegistryIntegrityValid() {
            List<PrimaryToken> tokens = createTokenList(10);
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);

            merkleService.validateRegistryIntegrity(tokens, tree.root)
                .subscribe().with(result -> {
                    assertTrue(result.valid);
                    assertTrue(result.issues.isEmpty());
                });
        }

        @Test
        @DisplayName("Should validate registry integrity with invalid root")
        void testValidateRegistryIntegrityInvalid() {
            List<PrimaryToken> tokens = createTokenList(10);

            merkleService.validateRegistryIntegrity(tokens, "invalid_root")
                .subscribe().with(result -> {
                    assertFalse(result.valid);
                    assertFalse(result.issues.isEmpty());
                });
        }
    }
}
