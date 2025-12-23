package io.aurigraph.v11.token.secondary;

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
 * Comprehensive Unit Tests for SecondaryTokenMerkleService
 *
 * Tests cover:
 * - Hash utility tests (12 tests) - includes parent relationship
 * - Tree construction tests (15 tests)
 * - Proof generation tests (15 tests)
 * - Proof verification tests (10 tests)
 * - Composite proof chain tests (8 tests) - hierarchical proofs
 *
 * Target: 60 unit tests with 95%+ line coverage
 *
 * @author Composite Token System - Sprint 1 Story 3
 * @version 1.0
 * @since Sprint 1 Story 3 (Week 2)
 */
@QuarkusTest
@DisplayName("Secondary Token Merkle Service Tests")
class SecondaryTokenMerkleServiceTest {

    @Inject
    SecondaryTokenMerkleService merkleService;

    private static final String TEST_TOKEN_ID = "ST-INCOME_STREAM-a1b2c3d4-e5f6-7g8h";
    private static final String TEST_PARENT_ID = "PT-REAL_ESTATE-p1q2r3s4-t5u6-7v8w";
    private static final String TEST_OWNER = "0x1234567890abcdef";
    private static final BigDecimal TEST_FACE_VALUE = new BigDecimal("10000.00");

    // =============== HELPER METHODS ===============

    private SecondaryToken createTestToken(int index) {
        SecondaryToken token = new SecondaryToken();
        token.tokenId = String.format("ST-INCOME_STREAM-token-%04d", index);
        token.parentTokenId = String.format("PT-REAL_ESTATE-parent-%04d", index / 10); // Multiple children per parent
        token.owner = String.format("0x%016x", index);
        token.tokenType = SecondaryToken.SecondaryTokenType.INCOME_STREAM;
        token.status = SecondaryToken.SecondaryTokenStatus.ACTIVE;
        token.faceValue = TEST_FACE_VALUE.add(BigDecimal.valueOf(index));
        return token;
    }

    private List<SecondaryToken> createTokenList(int count) {
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
        merkleService.clearCache();
    }

    // =============== HASH UTILITY TESTS (12 tests) ===============

    @Nested
    @DisplayName("Hash Utility Tests")
    class HashUtilityTests {

        @Test
        @DisplayName("Should hash secondary token deterministically")
        void testHashSecondaryTokenDeterminism() {
            SecondaryToken token = createTestToken(0);
            String hash1 = merkleService.hashSecondaryToken(token);
            String hash2 = merkleService.hashSecondaryToken(token);
            assertEquals(hash1, hash2, "Same token should produce same hash");
        }

        @Test
        @DisplayName("Should include tokenId in hash")
        void testHashIncludesTokenId() {
            SecondaryToken token1 = createTestToken(0);
            SecondaryToken token2 = createTestToken(0);
            token2.tokenId = "ST-INCOME_STREAM-different-id";

            String hash1 = merkleService.hashSecondaryToken(token1);
            String hash2 = merkleService.hashSecondaryToken(token2);
            assertNotEquals(hash1, hash2, "Different tokenIds should produce different hashes");
        }

        @Test
        @DisplayName("Should include parentTokenId in hash")
        void testHashIncludesParentTokenId() {
            SecondaryToken token1 = createTestToken(0);
            SecondaryToken token2 = createTestToken(0);
            token2.parentTokenId = "PT-REAL_ESTATE-different-parent";

            String hash1 = merkleService.hashSecondaryToken(token1);
            String hash2 = merkleService.hashSecondaryToken(token2);
            assertNotEquals(hash1, hash2, "Different parentTokenIds should produce different hashes");
        }

        @Test
        @DisplayName("Should include tokenType in hash")
        void testHashIncludesTokenType() {
            SecondaryToken token1 = createTestToken(0);
            SecondaryToken token2 = createTestToken(0);
            token2.tokenType = SecondaryToken.SecondaryTokenType.COLLATERAL;

            String hash1 = merkleService.hashSecondaryToken(token1);
            String hash2 = merkleService.hashSecondaryToken(token2);
            assertNotEquals(hash1, hash2, "Different tokenTypes should produce different hashes");
        }

        @Test
        @DisplayName("Should include faceValue in hash")
        void testHashIncludesFaceValue() {
            SecondaryToken token1 = createTestToken(0);
            SecondaryToken token2 = createTestToken(0);
            token2.faceValue = new BigDecimal("999999.99");

            String hash1 = merkleService.hashSecondaryToken(token1);
            String hash2 = merkleService.hashSecondaryToken(token2);
            assertNotEquals(hash1, hash2, "Different faceValues should produce different hashes");
        }

        @Test
        @DisplayName("Should include owner in hash")
        void testHashIncludesOwner() {
            SecondaryToken token1 = createTestToken(0);
            SecondaryToken token2 = createTestToken(0);
            token2.owner = "0xdifferentowner";

            String hash1 = merkleService.hashSecondaryToken(token1);
            String hash2 = merkleService.hashSecondaryToken(token2);
            assertNotEquals(hash1, hash2, "Different owners should produce different hashes");
        }

        @Test
        @DisplayName("Should include status in hash")
        void testHashIncludesStatus() {
            SecondaryToken token1 = createTestToken(0);
            SecondaryToken token2 = createTestToken(0);
            token2.status = SecondaryToken.SecondaryTokenStatus.REDEEMED;

            String hash1 = merkleService.hashSecondaryToken(token1);
            String hash2 = merkleService.hashSecondaryToken(token2);
            assertNotEquals(hash1, hash2, "Different statuses should produce different hashes");
        }

        @Test
        @DisplayName("Should handle null fields gracefully")
        void testHashNullFields() {
            SecondaryToken token = new SecondaryToken();
            assertDoesNotThrow(() -> merkleService.hashSecondaryToken(token));
        }

        @Test
        @DisplayName("Should reject null token")
        void testHashNullToken() {
            assertThrows(IllegalArgumentException.class,
                () -> merkleService.hashSecondaryToken(null));
        }

        @Test
        @DisplayName("Should return 64-character hex hash")
        void testHashFormat() {
            SecondaryToken token = createTestToken(0);
            String hash = merkleService.hashSecondaryToken(token);
            assertEquals(64, hash.length(), "SHA-256 hash should be 64 characters");
            assertTrue(hash.matches("[a-f0-9]{64}"), "Hash should be lowercase hex");
        }

        @Test
        @DisplayName("Should hash 1000 tokens in under 1000ms")
        void testHashPerformance() {
            List<SecondaryToken> tokens = createTokenList(1000);

            long duration = measureExecutionTime(() -> {
                tokens.forEach(merkleService::hashSecondaryToken);
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
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(new ArrayList<>());
            assertNotNull(tree);
            assertEquals("", tree.root);
            assertEquals(0, tree.leafCount);
        }

        @Test
        @DisplayName("Should build single token tree")
        void testBuildSingleTokenTree() {
            List<SecondaryToken> tokens = createTokenList(1);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertNotNull(tree);
            assertNotNull(tree.root);
            assertFalse(tree.root.isEmpty());
            assertEquals(1, tree.leafCount);
        }

        @Test
        @DisplayName("Should build tree with 2 tokens")
        void testBuildTwoTokensTree() {
            List<SecondaryToken> tokens = createTokenList(2);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(2, tree.leafCount);
            assertEquals(2, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 4 tokens")
        void testBuildFourTokensTree() {
            List<SecondaryToken> tokens = createTokenList(4);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(4, tree.leafCount);
            assertEquals(3, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 8 tokens")
        void testBuildEightTokensTree() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(8, tree.leafCount);
            assertEquals(4, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 16 tokens")
        void testBuildSixteenTokensTree() {
            List<SecondaryToken> tokens = createTokenList(16);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(16, tree.leafCount);
            assertEquals(5, tree.getDepth());
        }

        @Test
        @DisplayName("Should build tree with 1024 tokens")
        void testBuildLargeTree() {
            List<SecondaryToken> tokens = createTokenList(1024);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertNotNull(tree);
            assertEquals(1024, tree.leafCount);
            assertEquals(11, tree.getDepth());
        }

        @Test
        @DisplayName("Should handle power of two token count")
        void testTreePowerOfTwo() {
            List<SecondaryToken> tokens = createTokenList(32);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertEquals(32, tree.leafCount);
            assertEquals(6, tree.getDepth());
        }

        @Test
        @DisplayName("Should handle non-power of two token count")
        void testTreeNonPowerOfTwo() {
            List<SecondaryToken> tokens = createTokenList(7);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertEquals(7, tree.leafCount);
            assertEquals(4, tree.getDepth());
        }

        @Test
        @DisplayName("Should have correct tree structure with proper levels")
        void testTreeStructure() {
            List<SecondaryToken> tokens = createTokenList(4);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertEquals(3, tree.levels.size());
            assertEquals(4, tree.levels.get(0).size()); // 4 leaves
            assertEquals(2, tree.levels.get(1).size()); // 2 intermediate
            assertEquals(1, tree.levels.get(2).size()); // 1 root
        }

        @Test
        @DisplayName("Should verify all leaves are hashed tokens")
        void testTreeLeaves() {
            List<SecondaryToken> tokens = createTokenList(4);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            List<String> expectedLeaves = tokens.stream()
                    .map(merkleService::hashSecondaryToken)
                    .collect(Collectors.toList());

            assertEquals(expectedLeaves, tree.levels.get(0));
        }

        @Test
        @DisplayName("Should build tree in under 100ms for 1000 tokens")
        void testTreePerformance() {
            List<SecondaryToken> tokens = createTokenList(1000);

            long duration = measureExecutionTime(() -> {
                merkleService.buildSecondaryTokenTree(tokens);
            });

            assertTrue(duration < 100,
                String.format("Building tree with 1000 tokens took %dms, expected < 100ms", duration));
        }

        @Test
        @DisplayName("Should produce consistent root for same tokens")
        void testTreeRootConsistency() {
            List<SecondaryToken> tokens = createTokenList(10);
            SecondaryTokenMerkleService.MerkleTree tree1 = merkleService.buildSecondaryTokenTree(tokens);
            SecondaryTokenMerkleService.MerkleTree tree2 = merkleService.buildSecondaryTokenTree(tokens);

            assertEquals(tree1.root, tree2.root, "Same tokens should produce same root");
        }

        @Test
        @DisplayName("Should handle null token list")
        void testBuildNullTokenList() {
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(null);
            assertNotNull(tree);
            assertEquals("", tree.root);
            assertEquals(0, tree.leafCount);
        }

        @Test
        @DisplayName("Should provide meaningful toString")
        void testTreeToString() {
            List<SecondaryToken> tokens = createTokenList(10);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

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
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            assertNotNull(proof);
            assertEquals(0, proof.leafIndex);
            assertEquals(tree.root, proof.root);
        }

        @Test
        @DisplayName("Should generate proof for middle token")
        void testGenerateProofMiddleToken() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 4);
            assertNotNull(proof);
            assertEquals(4, proof.leafIndex);
        }

        @Test
        @DisplayName("Should generate proof for last token")
        void testGenerateProofLastToken() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 7);
            assertNotNull(proof);
            assertEquals(7, proof.leafIndex);
        }

        @Test
        @DisplayName("Should have proper proof structure with siblings")
        void testProofStructure() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            assertNotNull(proof.siblings);
            assertNotNull(proof.directions);
            assertEquals(proof.siblings.size(), proof.directions.size());
        }

        @Test
        @DisplayName("Should cache generated proof")
        void testProofCaching() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            merkleService.generateTokenProof(tree, 0);
            SecondaryTokenMerkleService.MerkleProof cached = merkleService.getCachedProof(tree.root, 0);
            assertNotNull(cached, "Proof should be cached");
        }

        @Test
        @DisplayName("Should generate proof for token by hash")
        void testGenerateProofByHash() {
            List<SecondaryToken> tokens = createTokenList(4);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            String tokenHash = merkleService.hashSecondaryToken(tokens.get(1));
            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateProofByTokenHash(tree, tokenHash);
            assertNotNull(proof);
            assertEquals(tokenHash, proof.leafHash);
        }

        @Test
        @DisplayName("Should return null proof for non-existent hash")
        void testGenerateProofNonExistentHash() {
            List<SecondaryToken> tokens = createTokenList(4);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateProofByTokenHash(tree, "nonexistenthash");
            assertNull(proof, "Proof should be null for non-existent hash");
        }

        @Test
        @DisplayName("Should reject invalid token index")
        void testGenerateProofInvalidIndex() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertThrows(IllegalArgumentException.class,
                () -> merkleService.generateTokenProof(tree, 10));
        }

        @Test
        @DisplayName("Should reject negative token index")
        void testGenerateProofNegativeIndex() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            assertThrows(IllegalArgumentException.class,
                () -> merkleService.generateTokenProof(tree, -1));
        }

        @Test
        @DisplayName("Should generate proof in under 50ms")
        void testProofGenerationPerformance() {
            List<SecondaryToken> tokens = createTokenList(1000);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            long duration = measureExecutionTime(() -> {
                merkleService.generateTokenProof(tree, 500);
            });

            assertTrue(duration < 50,
                String.format("Generating proof took %dms, expected < 50ms", duration));
        }

        @Test
        @DisplayName("Should provide meaningful proof toString")
        void testProofToString() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            String proofString = proof.toString();
            assertNotNull(proofString);
            assertTrue(proofString.contains("MerkleProof"));
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 2, 4, 7})
        @DisplayName("Should generate proof for various token indexes")
        void testGenerateProofVariousIndexes(int index) {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, index);
            assertNotNull(proof);
            assertEquals(index, proof.leafIndex);
        }

        @Test
        @DisplayName("Should have consistent proof for same token")
        void testProofConsistency() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof1 = merkleService.generateTokenProof(tree, 0);
            SecondaryTokenMerkleService.MerkleProof proof2 = merkleService.generateTokenProof(tree, 0);

            assertEquals(proof1.leafHash, proof2.leafHash);
            assertEquals(proof1.root, proof2.root);
        }
    }

    // =============== PROOF VERIFICATION TESTS (10 tests) ===============

    @Nested
    @DisplayName("Proof Verification Tests")
    class ProofVerificationTests {

        @Test
        @DisplayName("Should verify valid proof")
        void testVerifyValidProof() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            assertTrue(merkleService.verifyProof(proof), "Valid proof should verify");
        }

        @Test
        @DisplayName("Should reject null proof")
        void testVerifyNullProof() {
            assertFalse(merkleService.verifyProof(null), "Null proof should not verify");
        }

        @Test
        @DisplayName("Should verify token inclusion")
        void testVerifyTokenInclusion() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryToken token = tokens.get(0);
            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);

            assertTrue(merkleService.verifyTokenInclusion(token, proof), "Token should be included in tree");
        }

        @Test
        @DisplayName("Should reject modified proof")
        void testVerifyModifiedProof() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            // Modify the root
            SecondaryTokenMerkleService.MerkleProof modifiedProof = new SecondaryTokenMerkleService.MerkleProof(
                proof.leafHash, "modifiedroot", proof.siblings, proof.directions, proof.leafIndex);

            assertFalse(merkleService.verifyProof(modifiedProof), "Modified proof should not verify");
        }

        @Test
        @DisplayName("Should verify all tokens in tree")
        void testVerifyAllTokens() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            for (int i = 0; i < tokens.size(); i++) {
                SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, i);
                assertTrue(merkleService.verifyTokenInclusion(tokens.get(i), proof),
                    "Token at index " + i + " should verify");
            }
        }

        @Test
        @DisplayName("Should verify proof in under 10ms")
        void testVerificationPerformance() {
            List<SecondaryToken> tokens = createTokenList(1000);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);
            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 500);

            long duration = measureExecutionTime(() -> {
                merkleService.verifyProof(proof);
            });

            assertTrue(duration < 10,
                String.format("Verifying proof took %dms, expected < 10ms", duration));
        }

        @Test
        @DisplayName("Should verify proof multiple times consistently")
        void testVerificationConsistency() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);
            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);

            boolean result1 = merkleService.verifyProof(proof);
            boolean result2 = merkleService.verifyProof(proof);

            assertEquals(result1, result2, "Verification should be consistent");
        }

        @Test
        @DisplayName("Should detect tampered leaf hash")
        void testDetectTamperedLeaf() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof proof = merkleService.generateTokenProof(tree, 0);
            SecondaryTokenMerkleService.MerkleProof tamperedProof = new SecondaryTokenMerkleService.MerkleProof(
                "tampered", proof.root, proof.siblings, proof.directions, proof.leafIndex);

            assertFalse(merkleService.verifyProof(tamperedProof), "Tampered leaf should not verify");
        }
    }

    // =============== COMPOSITE PROOF CHAIN TESTS (8 tests) ===============

    @Nested
    @DisplayName("Composite Proof Chain Tests")
    class CompositeProofChainTests {

        @Test
        @DisplayName("Should generate composite proof with parent relationship")
        void testGenerateCompositeProof() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof secondaryProof = merkleService.generateTokenProof(tree, 0);
            SecondaryTokenMerkleService.CompositeMerkleProof composite = merkleService.generateCompositeProof(
                secondaryProof, tokens.get(0).tokenId, tokens.get(0).parentTokenId, "primary-merkle-root");

            assertNotNull(composite);
            assertEquals(tokens.get(0).tokenId, composite.secondaryTokenId);
            assertEquals(tokens.get(0).parentTokenId, composite.parentTokenId);
        }

        @Test
        @DisplayName("Should cache composite proof")
        void testCompositeProofCaching() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof secondaryProof = merkleService.generateTokenProof(tree, 0);
            merkleService.generateCompositeProof(
                secondaryProof, tokens.get(0).tokenId, tokens.get(0).parentTokenId, "primary-merkle-root");

            SecondaryTokenMerkleService.CompositeMerkleProof cached = merkleService.getCachedCompositeProof(
                tokens.get(0).parentTokenId, tokens.get(0).tokenId);
            assertNotNull(cached, "Composite proof should be cached");
        }

        @Test
        @DisplayName("Should verify composite proof with valid secondary proof")
        void testVerifyCompositeProofValid() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof secondaryProof = merkleService.generateTokenProof(tree, 0);
            SecondaryTokenMerkleService.CompositeMerkleProof composite = merkleService.generateCompositeProof(
                secondaryProof, tokens.get(0).tokenId, tokens.get(0).parentTokenId, "primary-merkle-root");

            assertTrue(merkleService.verifyCompositeProof(composite), "Valid composite proof should verify");
        }

        @Test
        @DisplayName("Should reject null composite proof")
        void testVerifyNullCompositeProof() {
            assertFalse(merkleService.verifyCompositeProof(null), "Null composite proof should not verify");
        }

        @Test
        @DisplayName("Should provide meaningful composite proof toString")
        void testCompositeProofToString() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            SecondaryTokenMerkleService.MerkleProof secondaryProof = merkleService.generateTokenProof(tree, 0);
            SecondaryTokenMerkleService.CompositeMerkleProof composite = merkleService.generateCompositeProof(
                secondaryProof, tokens.get(0).tokenId, tokens.get(0).parentTokenId, "primary-merkle-root");

            String compositeString = composite.toString();
            assertNotNull(compositeString);
            assertTrue(compositeString.contains("CompositeMerkleProof"));
        }

        @Test
        @DisplayName("Should generate composite proof for all tokens")
        void testGenerateCompositeForAllTokens() {
            List<SecondaryToken> tokens = createTokenList(8);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);

            for (int i = 0; i < tokens.size(); i++) {
                SecondaryTokenMerkleService.MerkleProof secondaryProof = merkleService.generateTokenProof(tree, i);
                SecondaryTokenMerkleService.CompositeMerkleProof composite = merkleService.generateCompositeProof(
                    secondaryProof, tokens.get(i).tokenId, tokens.get(i).parentTokenId, "primary-merkle-root");

                assertNotNull(composite);
                assertTrue(merkleService.verifyCompositeProof(composite));
            }
        }

        @Test
        @DisplayName("Should generate composite proof in under 100ms")
        void testCompositeProofPerformance() {
            List<SecondaryToken> tokens = createTokenList(1000);
            SecondaryTokenMerkleService.MerkleTree tree = merkleService.buildSecondaryTokenTree(tokens);
            SecondaryTokenMerkleService.MerkleProof secondaryProof = merkleService.generateTokenProof(tree, 500);

            long duration = measureExecutionTime(() -> {
                merkleService.generateCompositeProof(
                    secondaryProof, tokens.get(500).tokenId, tokens.get(500).parentTokenId, "primary-merkle-root");
            });

            assertTrue(duration < 100,
                String.format("Generating composite proof took %dms, expected < 100ms", duration));
        }
    }
}
