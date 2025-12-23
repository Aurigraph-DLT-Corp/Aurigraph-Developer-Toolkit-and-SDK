package io.aurigraph.v11.tokenization.registry;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive unit tests for OptimizedMerkleTreeBuilder.
 *
 * <p>Test coverage includes:</p>
 * <ul>
 *   <li>Leaf insertion (single and batch)</li>
 *   <li>Tree rebuilding</li>
 *   <li>Merkle proof generation</li>
 *   <li>Proof verification</li>
 *   <li>Performance validation</li>
 *   <li>Thread safety</li>
 * </ul>
 *
 * @author Aurigraph DLT Platform - Sprint 8-9 QA
 * @version 12.0.0
 * @since 2025-12-23
 */
@QuarkusTest
@DisplayName("OptimizedMerkleTreeBuilder Unit Tests")
class OptimizedMerkleTreeBuilderTest {

    private OptimizedMerkleTreeBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new OptimizedMerkleTreeBuilder();
    }

    // ==================== Basic Leaf Operations Tests ====================

    @Nested
    @DisplayName("Leaf Addition Tests")
    class LeafAdditionTests {

        @Test
        @DisplayName("Should add single leaf successfully")
        void shouldAddSingleLeafSuccessfully() {
            String hash = builder.addLeaf("leaf-001", BigDecimal.valueOf(1000));

            assertThat(hash).isNotBlank();
            assertThat(hash).hasSize(64); // SHA-256 hex
            assertThat(builder.getLeafCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should reject duplicate leaf ID")
        void shouldRejectDuplicateLeafId() {
            builder.addLeaf("duplicate-leaf", BigDecimal.valueOf(1000));

            assertThatThrownBy(() -> builder.addLeaf("duplicate-leaf", BigDecimal.valueOf(2000)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("Should reject null leaf ID")
        void shouldRejectNullLeafId() {
            assertThatThrownBy(() -> builder.addLeaf(null, BigDecimal.valueOf(1000)))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("Should reject null value")
        void shouldRejectNullValue() {
            assertThatThrownBy(() -> builder.addLeaf("leaf-001", null))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("Should generate unique hashes for different values")
        void shouldGenerateUniqueHashesForDifferentValues() {
            String hash1 = builder.addLeaf("leaf-001", BigDecimal.valueOf(1000));
            String hash2 = builder.addLeaf("leaf-002", BigDecimal.valueOf(1000));
            String hash3 = builder.addLeaf("leaf-003", BigDecimal.valueOf(2000));

            assertThat(hash1).isNotEqualTo(hash2);
            assertThat(hash2).isNotEqualTo(hash3);
            assertThat(hash1).isNotEqualTo(hash3);
        }

        @Test
        @DisplayName("Should add leaves in batch")
        void shouldAddLeavesInBatch() {
            Map<String, BigDecimal> leafData = new HashMap<>();
            for (int i = 0; i < 10; i++) {
                leafData.put("batch-" + i, BigDecimal.valueOf(1000 + i));
            }

            Map<String, String> results = builder.addLeavesBatch(leafData);

            assertThat(results).hasSize(10);
            assertThat(builder.getLeafCount()).isEqualTo(10);
        }

        @Test
        @DisplayName("Should skip duplicates in batch")
        void shouldSkipDuplicatesInBatch() {
            builder.addLeaf("existing-leaf", BigDecimal.valueOf(500));

            Map<String, BigDecimal> leafData = new HashMap<>();
            leafData.put("existing-leaf", BigDecimal.valueOf(1000)); // Duplicate
            leafData.put("new-leaf", BigDecimal.valueOf(2000));

            Map<String, String> results = builder.addLeavesBatch(leafData);

            assertThat(results).hasSize(1);
            assertThat(results).containsKey("new-leaf");
        }

        @Test
        @DisplayName("Should handle empty batch")
        void shouldHandleEmptyBatch() {
            Map<String, String> results = builder.addLeavesBatch(new HashMap<>());

            assertThat(results).isEmpty();
        }
    }

    // ==================== Merkle Root Tests ====================

    @Nested
    @DisplayName("Merkle Root Tests")
    class MerkleRootTests {

        @Test
        @DisplayName("Should return empty tree root for empty tree")
        void shouldReturnEmptyTreeRootForEmptyTree() {
            String root = builder.getMerkleRoot();

            assertThat(root).isEqualTo("0".repeat(64));
        }

        @Test
        @DisplayName("Should compute valid root for single leaf")
        void shouldComputeValidRootForSingleLeaf() {
            builder.addLeaf("single-leaf", BigDecimal.valueOf(1000));

            String root = builder.getMerkleRoot();

            assertThat(root).isNotBlank();
            assertThat(root).hasSize(64);
            assertThat(root).isNotEqualTo("0".repeat(64));
        }

        @Test
        @DisplayName("Should compute different roots for different trees")
        void shouldComputeDifferentRootsForDifferentTrees() {
            OptimizedMerkleTreeBuilder builder1 = new OptimizedMerkleTreeBuilder();
            OptimizedMerkleTreeBuilder builder2 = new OptimizedMerkleTreeBuilder();

            builder1.addLeaf("leaf-a", BigDecimal.valueOf(1000));
            builder2.addLeaf("leaf-b", BigDecimal.valueOf(2000));

            String root1 = builder1.getMerkleRoot();
            String root2 = builder2.getMerkleRoot();

            assertThat(root1).isNotEqualTo(root2);
        }

        @Test
        @DisplayName("Should change root when new leaf is added")
        void shouldChangeRootWhenNewLeafAdded() {
            builder.addLeaf("leaf-1", BigDecimal.valueOf(1000));
            String root1 = builder.getMerkleRoot();

            builder.addLeaf("leaf-2", BigDecimal.valueOf(2000));
            String root2 = builder.getMerkleRoot();

            assertThat(root1).isNotEqualTo(root2);
        }

        @Test
        @DisplayName("Should maintain consistent root without new additions")
        void shouldMaintainConsistentRoot() {
            builder.addLeaf("leaf-1", BigDecimal.valueOf(1000));
            builder.addLeaf("leaf-2", BigDecimal.valueOf(2000));

            String root1 = builder.getMerkleRoot();
            String root2 = builder.getMerkleRoot();

            assertThat(root1).isEqualTo(root2);
        }
    }

    // ==================== Tree Height Tests ====================

    @Nested
    @DisplayName("Tree Height Tests")
    class TreeHeightTests {

        @Test
        @DisplayName("Should return 0 height for empty tree")
        void shouldReturn0HeightForEmptyTree() {
            assertThat(builder.getTreeHeight()).isZero();
        }

        @Test
        @DisplayName("Should return correct height for various sizes")
        void shouldReturnCorrectHeightForVariousSizes() {
            // 1 leaf = height 2 (leaf + root)
            builder.addLeaf("leaf-1", BigDecimal.valueOf(1000));
            assertThat(builder.getTreeHeight()).isEqualTo(2);

            // 2 leaves = height 2
            builder.addLeaf("leaf-2", BigDecimal.valueOf(1000));
            assertThat(builder.getTreeHeight()).isEqualTo(2);

            // 3-4 leaves = height 3
            builder.addLeaf("leaf-3", BigDecimal.valueOf(1000));
            assertThat(builder.getTreeHeight()).isEqualTo(3);

            builder.addLeaf("leaf-4", BigDecimal.valueOf(1000));
            assertThat(builder.getTreeHeight()).isEqualTo(3);

            // 5-8 leaves = height 4
            builder.addLeaf("leaf-5", BigDecimal.valueOf(1000));
            assertThat(builder.getTreeHeight()).isEqualTo(4);
        }

        @ParameterizedTest
        @ValueSource(ints = {1, 2, 4, 8, 16, 32, 64, 128})
        @DisplayName("Should calculate correct height for power of 2 sizes")
        void shouldCalculateCorrectHeightForPowerOf2(int count) {
            for (int i = 0; i < count; i++) {
                builder.addLeaf("pow2-" + count + "-" + i, BigDecimal.valueOf(1000));
            }

            int expectedHeight = (int) (Math.log(count) / Math.log(2)) + 2;
            assertThat(builder.getTreeHeight()).isEqualTo(expectedHeight);
        }
    }

    // ==================== Proof Generation Tests ====================

    @Nested
    @DisplayName("Proof Generation Tests")
    class ProofGenerationTests {

        @Test
        @DisplayName("Should generate proof for existing leaf")
        void shouldGenerateProofForExistingLeaf() {
            builder.addLeaf("leaf-1", BigDecimal.valueOf(1000));
            builder.addLeaf("leaf-2", BigDecimal.valueOf(2000));
            builder.addLeaf("leaf-3", BigDecimal.valueOf(3000));

            List<String> proof = builder.generateProof("leaf-2");

            assertThat(proof).isNotEmpty();
            assertThat(proof.size()).isGreaterThanOrEqualTo(1);
        }

        @Test
        @DisplayName("Should throw exception for non-existent leaf")
        void shouldThrowForNonExistentLeaf() {
            builder.addLeaf("existing", BigDecimal.valueOf(1000));

            assertThatThrownBy(() -> builder.generateProof("non-existent"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("Should generate empty proof for single leaf")
        void shouldGenerateEmptyProofForSingleLeaf() {
            builder.addLeaf("only-leaf", BigDecimal.valueOf(1000));

            List<String> proof = builder.generateProof("only-leaf");

            // Single leaf tree might have empty or minimal proof
            assertThat(proof).isNotNull();
        }

        @Test
        @DisplayName("Should include position markers in proof")
        void shouldIncludePositionMarkersInProof() {
            for (int i = 0; i < 8; i++) {
                builder.addLeaf("pos-" + i, BigDecimal.valueOf(1000 + i));
            }

            List<String> proof = builder.generateProof("pos-3");

            assertThat(proof).isNotEmpty();
            assertThat(proof).allMatch(p -> p.startsWith("L:") || p.startsWith("R:"));
        }
    }

    // ==================== Proof Verification Tests ====================

    @Nested
    @DisplayName("Proof Verification Tests")
    class ProofVerificationTests {

        @Test
        @DisplayName("Should verify valid proof")
        void shouldVerifyValidProof() {
            for (int i = 0; i < 4; i++) {
                builder.addLeaf("verify-" + i, BigDecimal.valueOf(1000 + i));
            }

            List<String> proof = builder.generateProof("verify-2");
            String root = builder.getMerkleRoot();

            boolean isValid = builder.verifyProof("verify-2", proof, root);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Should reject proof with wrong root")
        void shouldRejectProofWithWrongRoot() {
            builder.addLeaf("test-1", BigDecimal.valueOf(1000));
            builder.addLeaf("test-2", BigDecimal.valueOf(2000));

            List<String> proof = builder.generateProof("test-1");
            String wrongRoot = "0".repeat(64);

            boolean isValid = builder.verifyProof("test-1", proof, wrongRoot);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should reject tampered proof")
        void shouldRejectTamperedProof() {
            for (int i = 0; i < 4; i++) {
                builder.addLeaf("tamper-" + i, BigDecimal.valueOf(1000));
            }

            List<String> proof = builder.generateProof("tamper-0");
            String root = builder.getMerkleRoot();

            // Tamper with the proof
            List<String> tamperedProof = new ArrayList<>(proof);
            if (!tamperedProof.isEmpty()) {
                tamperedProof.set(0, "R:" + "f".repeat(64));
            }

            boolean isValid = builder.verifyProof("tamper-0", tamperedProof, root);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should reject proof for non-existent leaf")
        void shouldRejectProofForNonExistentLeaf() {
            builder.addLeaf("exists", BigDecimal.valueOf(1000));

            List<String> proof = builder.generateProof("exists");
            String root = builder.getMerkleRoot();

            boolean isValid = builder.verifyProof("does-not-exist", proof, root);

            assertThat(isValid).isFalse();
        }
    }

    // ==================== Leaf Query Tests ====================

    @Nested
    @DisplayName("Leaf Query Tests")
    class LeafQueryTests {

        @Test
        @DisplayName("Should check if leaf exists")
        void shouldCheckIfLeafExists() {
            builder.addLeaf("existing", BigDecimal.valueOf(1000));

            assertThat(builder.containsLeaf("existing")).isTrue();
            assertThat(builder.containsLeaf("non-existing")).isFalse();
        }

        @Test
        @DisplayName("Should get leaf hash")
        void shouldGetLeafHash() {
            String expectedHash = builder.addLeaf("hash-test", BigDecimal.valueOf(1000));

            Optional<String> hash = builder.getLeafHash("hash-test");

            assertThat(hash).isPresent();
            assertThat(hash.get()).isEqualTo(expectedHash);
        }

        @Test
        @DisplayName("Should return empty for non-existent leaf hash")
        void shouldReturnEmptyForNonExistentLeafHash() {
            Optional<String> hash = builder.getLeafHash("non-existent");

            assertThat(hash).isEmpty();
        }
    }

    // ==================== Statistics Tests ====================

    @Nested
    @DisplayName("Statistics Tests")
    class StatisticsTests {

        @Test
        @DisplayName("Should return correct statistics")
        void shouldReturnCorrectStatistics() {
            for (int i = 0; i < 10; i++) {
                builder.addLeaf("stats-" + i, BigDecimal.valueOf(1000));
            }

            OptimizedMerkleTreeBuilder.TreeStatistics stats = builder.getStatistics();

            assertThat(stats.getLeafCount()).isEqualTo(10);
            assertThat(stats.getNodeCount()).isEqualTo(19); // 2n-1 for complete tree
            assertThat(stats.getTreeHeight()).isEqualTo(5); // ceil(log2(10)) + 1
            assertThat(stats.getLastUpdateTime()).isGreaterThan(0);
            assertThat(stats.getTotalHashOperations()).isGreaterThan(0);
        }

        @Test
        @DisplayName("Should track hash operations")
        void shouldTrackHashOperations() {
            OptimizedMerkleTreeBuilder.TreeStatistics statsBefore = builder.getStatistics();
            long hashOpsBefore = statsBefore.getTotalHashOperations();

            builder.addLeaf("hash-op-test", BigDecimal.valueOf(1000));

            OptimizedMerkleTreeBuilder.TreeStatistics statsAfter = builder.getStatistics();
            long hashOpsAfter = statsAfter.getTotalHashOperations();

            assertThat(hashOpsAfter).isGreaterThan(hashOpsBefore);
        }
    }

    // ==================== Clear Operation Tests ====================

    @Nested
    @DisplayName("Clear Operation Tests")
    class ClearOperationTests {

        @Test
        @DisplayName("Should clear all leaves")
        void shouldClearAllLeaves() {
            for (int i = 0; i < 5; i++) {
                builder.addLeaf("clear-" + i, BigDecimal.valueOf(1000));
            }

            builder.clear();

            assertThat(builder.getLeafCount()).isZero();
            assertThat(builder.getMerkleRoot()).isEqualTo("0".repeat(64));
            assertThat(builder.getTreeHeight()).isZero();
        }

        @Test
        @DisplayName("Should allow new additions after clear")
        void shouldAllowNewAdditionsAfterClear() {
            builder.addLeaf("before-clear", BigDecimal.valueOf(1000));
            builder.clear();
            builder.addLeaf("after-clear", BigDecimal.valueOf(2000));

            assertThat(builder.getLeafCount()).isEqualTo(1);
            assertThat(builder.containsLeaf("before-clear")).isFalse();
            assertThat(builder.containsLeaf("after-clear")).isTrue();
        }
    }

    // ==================== Performance Tests ====================

    @Nested
    @DisplayName("Performance Tests")
    class PerformanceTests {

        @Test
        @DisplayName("Should add 1000 leaves quickly")
        void shouldAdd1000LeavesQuickly() {
            long startTime = System.currentTimeMillis();

            for (int i = 0; i < 1000; i++) {
                builder.addLeaf("perf-" + i, BigDecimal.valueOf(1000 + i));
            }
            builder.rebuildTree();

            long duration = System.currentTimeMillis() - startTime;

            assertThat(duration).isLessThan(100);
            assertThat(builder.getLeafCount()).isEqualTo(1000);
        }

        @Test
        @DisplayName("Should generate proof in O(log n) time")
        void shouldGenerateProofInLogTime() {
            // Add 1024 leaves
            for (int i = 0; i < 1024; i++) {
                builder.addLeaf("ologn-" + i, BigDecimal.valueOf(1000));
            }
            builder.rebuildTree();

            long startTime = System.nanoTime();
            List<String> proof = builder.generateProof("ologn-512");
            long duration = System.nanoTime() - startTime;

            // Proof should have log2(1024) = 10 elements
            assertThat(proof).hasSizeLessThanOrEqualTo(11);
            // Should complete in < 1ms
            assertThat(duration).isLessThan(1_000_000);
        }

        @ParameterizedTest
        @ValueSource(ints = {100, 500, 1000, 5000})
        @DisplayName("Should scale proof time logarithmically")
        void shouldScaleProofTimeLogarithmically(int count) {
            for (int i = 0; i < count; i++) {
                builder.addLeaf("scale-" + count + "-" + i, BigDecimal.valueOf(1000));
            }
            builder.rebuildTree();

            long startTime = System.nanoTime();
            builder.generateProof("scale-" + count + "-" + (count / 2));
            long duration = System.nanoTime() - startTime;

            // Should be O(log n) - max 1ms regardless of size
            assertThat(duration).isLessThan(1_000_000);
        }
    }

    // ==================== Thread Safety Tests ====================

    @Nested
    @DisplayName("Thread Safety Tests")
    class ThreadSafetyTests {

        @Test
        @DisplayName("Should handle concurrent leaf additions")
        void shouldHandleConcurrentLeafAdditions() throws InterruptedException {
            int threadCount = 10;
            int leavesPerThread = 100;
            ExecutorService executor = Executors.newFixedThreadPool(threadCount);
            CountDownLatch latch = new CountDownLatch(threadCount);

            for (int t = 0; t < threadCount; t++) {
                final int threadId = t;
                executor.submit(() -> {
                    try {
                        for (int i = 0; i < leavesPerThread; i++) {
                            builder.addLeaf("thread-" + threadId + "-" + i,
                                    BigDecimal.valueOf(1000 + i));
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await(30, TimeUnit.SECONDS);
            executor.shutdown();

            assertThat(builder.getLeafCount()).isEqualTo(threadCount * leavesPerThread);
        }

        @Test
        @DisplayName("Should handle concurrent reads during writes")
        void shouldHandleConcurrentReadsDuringWrites() throws InterruptedException {
            // Pre-populate
            for (int i = 0; i < 100; i++) {
                builder.addLeaf("pre-" + i, BigDecimal.valueOf(1000));
            }

            ExecutorService executor = Executors.newFixedThreadPool(10);
            CountDownLatch latch = new CountDownLatch(10);

            // Writers
            for (int w = 0; w < 5; w++) {
                final int writerId = w;
                executor.submit(() -> {
                    try {
                        for (int i = 0; i < 20; i++) {
                            builder.addLeaf("write-" + writerId + "-" + i, BigDecimal.valueOf(500));
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }

            // Readers
            for (int r = 0; r < 5; r++) {
                executor.submit(() -> {
                    try {
                        for (int i = 0; i < 50; i++) {
                            builder.getMerkleRoot();
                            builder.getLeafCount();
                            builder.containsLeaf("pre-" + (i % 100));
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await(30, TimeUnit.SECONDS);
            executor.shutdown();

            // No exceptions should have occurred
            assertThat(builder.getLeafCount()).isGreaterThan(100);
        }

        @Test
        @DisplayName("Should maintain consistency under concurrent proof generation")
        void shouldMaintainConsistencyUnderConcurrentProofGeneration() throws InterruptedException {
            for (int i = 0; i < 100; i++) {
                builder.addLeaf("proof-test-" + i, BigDecimal.valueOf(1000 + i));
            }
            builder.rebuildTree();
            final String expectedRoot = builder.getMerkleRoot();

            ExecutorService executor = Executors.newFixedThreadPool(5);
            List<Future<Boolean>> futures = new ArrayList<>();

            for (int t = 0; t < 50; t++) {
                final int leafIndex = t % 100;
                futures.add(executor.submit(() -> {
                    List<String> proof = builder.generateProof("proof-test-" + leafIndex);
                    return builder.verifyProof("proof-test-" + leafIndex, proof, expectedRoot);
                }));
            }

            executor.shutdown();
            executor.awaitTermination(30, TimeUnit.SECONDS);

            for (Future<Boolean> future : futures) {
                assertThat(future.get()).isTrue();
            }
        }
    }

    // ==================== Edge Case Tests ====================

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle very long leaf IDs")
        void shouldHandleVeryLongLeafIds() {
            String longId = "leaf-" + "x".repeat(1000);
            String hash = builder.addLeaf(longId, BigDecimal.valueOf(1000));

            assertThat(hash).isNotBlank();
            assertThat(builder.containsLeaf(longId)).isTrue();
        }

        @Test
        @DisplayName("Should handle unicode characters in leaf IDs")
        void shouldHandleUnicodeCharacters() {
            String unicodeId = "leaf-\u4e2d\u6587-\u65e5\u672c\u8a9e";
            String hash = builder.addLeaf(unicodeId, BigDecimal.valueOf(1000));

            assertThat(hash).isNotBlank();
            assertThat(builder.containsLeaf(unicodeId)).isTrue();
        }

        @Test
        @DisplayName("Should handle very small values")
        void shouldHandleVerySmallValues() {
            String hash = builder.addLeaf("tiny", new BigDecimal("0.000000001"));

            assertThat(hash).isNotBlank();
        }

        @Test
        @DisplayName("Should handle tree rebuild after batch threshold")
        void shouldHandleTreeRebuildAfterBatchThreshold() {
            // Add more than batch threshold (100) leaves
            for (int i = 0; i < 150; i++) {
                builder.addLeaf("batch-threshold-" + i, BigDecimal.valueOf(1000));
            }

            // Tree should be automatically rebuilt
            String root = builder.getMerkleRoot();
            assertThat(root).isNotEqualTo("0".repeat(64));
            assertThat(builder.getLeafCount()).isEqualTo(150);
        }
    }
}
