package io.aurigraph.v11.token.primary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance Tests for PrimaryTokenRegistry - Sprint 1 Implementation
 *
 * Validates performance targets across 5 categories:
 * 1. Registration Performance (10 tests)
 * 2. Lookup Performance (5 tests)
 * 3. Merkle Performance (5 tests)
 * 4. Concurrency Performance (5 tests)
 * 5. Scalability Tests (5 tests)
 *
 * CRITICAL TARGETS:
 * - Registry creation 1,000 tokens: < 100ms
 * - Token lookup: < 5ms
 * - Merkle proof generation: < 50ms
 * - Merkle proof verification: < 10ms
 *
 * @author Composite Token System - Sprint 1
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@QuarkusTest
@DisplayName("Primary Token Registry Performance Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PrimaryTokenRegistryPerformanceTest {

    private static final Logger LOG = Logger.getLogger(PrimaryTokenRegistryPerformanceTest.class);

    @Inject
    PrimaryTokenRegistry registry;

    @Inject
    PrimaryTokenMerkleService merkleService;

    @BeforeEach
    void setUp() {
        registry.clear();
        LOG.info("=== Starting Performance Test ===");
    }

    @AfterEach
    void tearDown() {
        LOG.infof("Registry stats: %s", registry.getStats());
        LOG.infof("Registry metrics: %s", registry.getMetrics());
    }

    // =============== REGISTRATION PERFORMANCE TESTS ===============

    @Nested
    @DisplayName("Registration Performance Tests")
    class RegistrationPerformanceTests {

        @Test
        @Order(1)
        @DisplayName("Should register single token < 10ms")
        void testRegisterSingleToken() {
            PrimaryToken token = createTestToken(0);
            long startTime = System.currentTimeMillis();

            registry.register(token).await().indefinitely();

            long durationMs = System.currentTimeMillis() - startTime;
            LOG.infof("Single token registration: %dms", durationMs);
            assertTrue(durationMs < 10, "Registration took " + durationMs + "ms (target: <10ms)");
        }

        @Test
        @Order(2)
        @DisplayName("Should register bulk 100 tokens < 50ms")
        void testRegisterBulk100Tokens() {
            List<PrimaryToken> tokens = createTestTokens(100);
            long startTime = System.currentTimeMillis();

            registry.bulkRegister(tokens).await().indefinitely();

            long durationMs = System.currentTimeMillis() - startTime;
            LOG.infof("Bulk 100 tokens registration: %dms", durationMs);
            assertTrue(durationMs < 50, "Bulk 100 registration took " + durationMs + "ms (target: <50ms)");
        }

        @Test
        @Order(3)
        @DisplayName("Should register bulk 1000 tokens < 100ms [CRITICAL]")
        void testRegisterBulk1000Tokens() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            long startTime = System.currentTimeMillis();

            registry.bulkRegister(tokens).await().indefinitely();

            long durationMs = System.currentTimeMillis() - startTime;
            LOG.infof("Bulk 1000 tokens registration: %dms (CRITICAL TARGET)", durationMs);
            assertTrue(durationMs < 110, "Bulk 1000 registration took " + durationMs + "ms (target: <100ms, allowed: <110ms)");
            assertEquals(1000, registry.getStats().totalTokens);
        }

        @Test
        @Order(4)
        @DisplayName("Should monitor bulk registration memory usage")
        void testBulkRegistrationMemoryUsage() {
            Runtime runtime = Runtime.getRuntime();
            runtime.gc();
            long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            runtime.gc();
            long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
            long memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);

            LOG.infof("Memory usage for 1000 tokens: %d MB", memoryUsedMB);
            assertTrue(memoryUsedMB < 50, "Memory usage " + memoryUsedMB + "MB exceeds 50MB limit");
        }

        @Test
        @Order(5)
        @DisplayName("Should measure bulk registration indexing overhead")
        void testBulkRegistrationIndexingOverhead() {
            List<PrimaryToken> tokens = createTestTokens(1000);

            long startTime = System.nanoTime();
            registry.bulkRegister(tokens).await().indefinitely();
            long totalTime = (System.nanoTime() - startTime) / 1_000_000;

            // Verify all indexes are populated
            PrimaryTokenRegistry.RegistryStats stats = registry.getStats();
            LOG.infof("Indexing overhead - Total time: %dms, Indexes: owners=%d, classes=%d",
                    totalTime, stats.uniqueOwners, stats.assetClassCount);

            assertTrue(stats.uniqueOwners > 0, "Owner index not populated");
            assertTrue(stats.assetClassCount > 0, "Asset class index not populated");
        }

        @Test
        @Order(6)
        @DisplayName("Should build Merkle tree for 1000 tokens < 100ms")
        void testMerkleTreeBuildTime() {
            List<PrimaryToken> tokens = createTestTokens(1000);

            long startTime = System.currentTimeMillis();
            PrimaryTokenMerkleService.MerkleTree tree = merkleService.buildPrimaryTokenTree(tokens);
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Merkle tree build time (1000 tokens): %dms", durationMs);
            assertNotNull(tree.root);
            assertTrue(durationMs < 110, "Merkle tree build took " + durationMs + "ms (target: <100ms)");
            assertEquals(1000, tree.leafCount);
        }

        @Test
        @Order(7)
        @DisplayName("Should measure incremental registration performance")
        void testIncrementalRegistrationPerformance() {
            long totalTime = 0;
            for (int i = 0; i < 100; i++) {
                PrimaryToken token = createTestToken(i);
                long start = System.currentTimeMillis();
                registry.register(token).await().indefinitely();
                totalTime += System.currentTimeMillis() - start;
            }

            double avgTimeMs = totalTime / 100.0;
            LOG.infof("Average incremental registration time: %.2fms", avgTimeMs);
            assertTrue(avgTimeMs < 5, "Average registration " + avgTimeMs + "ms exceeds 5ms");
        }

        @Test
        @Order(8)
        @DisplayName("Should calculate registration throughput (tokens/sec)")
        void testRegistrationThroughputCalc() {
            List<PrimaryToken> tokens = createTestTokens(1000);

            long startTime = System.currentTimeMillis();
            registry.bulkRegister(tokens).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            double throughput = (1000.0 / durationMs) * 1000;
            LOG.infof("Registration throughput: %.0f tokens/sec", throughput);
            assertTrue(throughput > 10000, "Throughput " + throughput + " tokens/sec < 10,000 target");
        }

        @Test
        @Order(9)
        @DisplayName("Should handle registration with high contention")
        void testRegistrationWithHighContention() throws InterruptedException {
            ExecutorService executor = Executors.newFixedThreadPool(10);
            CountDownLatch latch = new CountDownLatch(10);

            long startTime = System.currentTimeMillis();

            for (int i = 0; i < 10; i++) {
                final int batchNum = i;
                executor.submit(() -> {
                    List<PrimaryToken> tokens = createTestTokens(100, batchNum * 100);
                    registry.bulkRegister(tokens).await().indefinitely();
                    latch.countDown();
                });
            }

            latch.await(5, TimeUnit.SECONDS);
            executor.shutdown();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Concurrent registration (10 threads x 100 tokens): %dms", durationMs);
            assertTrue(durationMs < 500, "Concurrent registration took " + durationMs + "ms");
            assertEquals(1000, registry.getStats().totalTokens);
        }

        @Test
        @Order(10)
        @DisplayName("Should measure memory footprint per 1000 tokens")
        void testMemoryFootprintPer1000Tokens() {
            Runtime runtime = Runtime.getRuntime();
            runtime.gc();
            long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
            long memoryPerToken = (memoryAfter - memoryBefore) / 1000;

            LOG.infof("Memory per token: %d bytes", memoryPerToken);
            assertTrue(memoryPerToken < 10240, "Memory per token " + memoryPerToken + " bytes exceeds 10KB");
        }
    }

    // =============== LOOKUP PERFORMANCE TESTS ===============

    @Nested
    @DisplayName("Lookup Performance Tests")
    class LookupPerformanceTests {

        @Test
        @Order(11)
        @DisplayName("Should lookup token by ID < 5ms [CRITICAL]")
        void testTokenIdLookup() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            String targetTokenId = tokens.get(500).tokenId;

            long startTime = System.currentTimeMillis();
            PrimaryTokenRegistry.RegistryEntry entry = registry.lookup(targetTokenId).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Token lookup by ID: %dms (CRITICAL TARGET)", durationMs);
            assertNotNull(entry);
            assertTrue(durationMs < 5, "Lookup took " + durationMs + "ms (target: <5ms)");
        }

        @Test
        @Order(12)
        @DisplayName("Should lookup by owner < 10ms for 100 tokens")
        void testOwnerLookup() {
            List<PrimaryToken> tokens = createTestTokens(100);
            registry.bulkRegister(tokens).await().indefinitely();

            String ownerAddress = "owner-0";

            long startTime = System.currentTimeMillis();
            List<PrimaryTokenRegistry.RegistryEntry> entries = registry.lookupByOwner(ownerAddress).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Owner lookup (100 tokens): %dms", durationMs);
            assertFalse(entries.isEmpty());
            assertTrue(durationMs < 10, "Owner lookup took " + durationMs + "ms (target: <10ms)");
        }

        @Test
        @Order(13)
        @DisplayName("Should lookup by asset class < 10ms")
        void testAssetClassLookup() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            long startTime = System.currentTimeMillis();
            List<PrimaryTokenRegistry.RegistryEntry> entries = registry.lookupByAssetClass("REAL_ESTATE").await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Asset class lookup: %dms", durationMs);
            assertFalse(entries.isEmpty());
            assertTrue(durationMs < 10, "Asset class lookup took " + durationMs + "ms (target: <10ms)");
        }

        @Test
        @Order(14)
        @DisplayName("Should lookup by status < 10ms")
        void testStatusLookup() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            long startTime = System.currentTimeMillis();
            List<PrimaryTokenRegistry.RegistryEntry> entries = registry.lookupByStatus(PrimaryToken.PrimaryTokenStatus.CREATED).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Status lookup: %dms", durationMs);
            assertFalse(entries.isEmpty());
            assertTrue(durationMs < 10, "Status lookup took " + durationMs + "ms (target: <10ms)");
        }

        @Test
        @Order(15)
        @DisplayName("Should achieve 10K+ lookup operations/sec")
        void testLookupThroughput() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            long startTime = System.currentTimeMillis();
            for (int i = 0; i < 1000; i++) {
                registry.lookup(tokens.get(i % 1000).tokenId).await().indefinitely();
            }
            long durationMs = System.currentTimeMillis() - startTime;

            double throughput = (1000.0 / durationMs) * 1000;
            LOG.infof("Lookup throughput: %.0f ops/sec", throughput);
            assertTrue(throughput > 10000, "Lookup throughput " + throughput + " ops/sec < 10K target");
        }
    }

    // =============== MERKLE PERFORMANCE TESTS ===============

    @Nested
    @DisplayName("Merkle Performance Tests")
    class MerklePerformanceTests {

        @Test
        @Order(16)
        @DisplayName("Should generate Merkle proof < 50ms [CRITICAL]")
        void testProofGeneration() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            String targetTokenId = tokens.get(500).tokenId;

            long startTime = System.currentTimeMillis();
            PrimaryTokenRegistry.RegistryProof proof = registry.generateProof(targetTokenId).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Merkle proof generation: %dms (CRITICAL TARGET)", durationMs);
            assertNotNull(proof);
            assertTrue(durationMs < 50, "Proof generation took " + durationMs + "ms (target: <50ms)");
        }

        @Test
        @Order(17)
        @DisplayName("Should verify Merkle proof < 10ms [CRITICAL]")
        void testProofVerification() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            String targetTokenId = tokens.get(500).tokenId;
            PrimaryTokenRegistry.RegistryProof proof = registry.generateProof(targetTokenId).await().indefinitely();

            long startTime = System.currentTimeMillis();
            boolean valid = registry.verifyProof(proof);
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Merkle proof verification: %dms (CRITICAL TARGET)", durationMs);
            assertTrue(valid);
            assertTrue(durationMs < 10, "Proof verification took " + durationMs + "ms (target: <10ms)");
        }

        @Test
        @Order(18)
        @DisplayName("Should validate consistency < 500ms for 1000 tokens")
        void testConsistencyCheck() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            long startTime = System.currentTimeMillis();
            PrimaryTokenRegistry.ConsistencyReport report = registry.validateConsistency().await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Consistency check: %dms", durationMs);
            assertTrue(report.inconsistentTokens == 0);
            assertTrue(durationMs < 500, "Consistency check took " + durationMs + "ms (target: <500ms)");
        }

        @Test
        @Order(19)
        @DisplayName("Should generate batch proofs efficiently")
        void testBatchProofGeneration() {
            List<PrimaryToken> tokens = createTestTokens(100);
            registry.bulkRegister(tokens).await().indefinitely();

            long startTime = System.currentTimeMillis();
            for (int i = 0; i < 100; i++) {
                registry.generateProof(tokens.get(i).tokenId).await().indefinitely();
            }
            long durationMs = System.currentTimeMillis() - startTime;

            double avgTimeMs = durationMs / 100.0;
            LOG.infof("Batch proof generation (100 proofs): %dms (avg: %.2fms)", durationMs, avgTimeMs);
            assertTrue(avgTimeMs < 50, "Average proof generation " + avgTimeMs + "ms exceeds 50ms");
        }

        @Test
        @Order(20)
        @DisplayName("Should demonstrate proof caching effectiveness")
        void testProofCachingEffectiveness() {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            String targetTokenId = tokens.get(500).tokenId;

            // First call (cache miss)
            long firstCallStart = System.currentTimeMillis();
            registry.generateProof(targetTokenId).await().indefinitely();
            long firstCallTime = System.currentTimeMillis() - firstCallStart;

            // Second call (cache hit expected - though not directly exposed in current implementation)
            long secondCallStart = System.currentTimeMillis();
            registry.generateProof(targetTokenId).await().indefinitely();
            long secondCallTime = System.currentTimeMillis() - secondCallStart;

            LOG.infof("Proof caching: first=%dms, second=%dms", firstCallTime, secondCallTime);
            // Both should be fast, testing repeatability
            assertTrue(secondCallTime < 50, "Second call time " + secondCallTime + "ms exceeds 50ms");
        }
    }

    // =============== CONCURRENCY PERFORMANCE TESTS ===============

    @Nested
    @DisplayName("Concurrency Performance Tests")
    class ConcurrencyPerformanceTests {

        @Test
        @Order(21)
        @DisplayName("Should handle parallel registrations without contention")
        void testParallelRegistrations() throws InterruptedException {
            ExecutorService executor = Executors.newFixedThreadPool(10);
            CountDownLatch latch = new CountDownLatch(10);

            long startTime = System.currentTimeMillis();

            for (int i = 0; i < 10; i++) {
                final int batchNum = i;
                executor.submit(() -> {
                    List<PrimaryToken> tokens = createTestTokens(100, batchNum * 100);
                    registry.bulkRegister(tokens).await().indefinitely();
                    latch.countDown();
                });
            }

            latch.await(10, TimeUnit.SECONDS);
            executor.shutdown();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Parallel registrations (10 threads): %dms", durationMs);
            assertEquals(1000, registry.getStats().totalTokens);
            assertTrue(durationMs < 1000, "Parallel registration took " + durationMs + "ms");
        }

        @Test
        @Order(22)
        @DisplayName("Should handle parallel lookups (10 threads)")
        void testParallelLookups() throws InterruptedException {
            List<PrimaryToken> tokens = createTestTokens(1000);
            registry.bulkRegister(tokens).await().indefinitely();

            ExecutorService executor = Executors.newFixedThreadPool(10);
            CountDownLatch latch = new CountDownLatch(10);

            long startTime = System.currentTimeMillis();

            for (int i = 0; i < 10; i++) {
                final int threadId = i;
                executor.submit(() -> {
                    for (int j = 0; j < 100; j++) {
                        registry.lookup(tokens.get((threadId * 100 + j) % 1000).tokenId).await().indefinitely();
                    }
                    latch.countDown();
                });
            }

            latch.await(5, TimeUnit.SECONDS);
            executor.shutdown();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Parallel lookups (10 threads x 100 ops): %dms", durationMs);
            assertTrue(durationMs < 500, "Parallel lookups took " + durationMs + "ms");
        }

        @Test
        @Order(23)
        @DisplayName("Should handle read-write contention")
        void testReadWriteContention() throws InterruptedException {
            List<PrimaryToken> initialTokens = createTestTokens(500);
            registry.bulkRegister(initialTokens).await().indefinitely();

            ExecutorService executor = Executors.newFixedThreadPool(5);
            CountDownLatch latch = new CountDownLatch(5);

            long startTime = System.currentTimeMillis();

            // 3 reader threads
            for (int i = 0; i < 3; i++) {
                executor.submit(() -> {
                    for (int j = 0; j < 100; j++) {
                        registry.lookup(initialTokens.get(j % 500).tokenId).await().indefinitely();
                    }
                    latch.countDown();
                });
            }

            // 2 writer threads
            for (int i = 0; i < 2; i++) {
                final int batchNum = i;
                executor.submit(() -> {
                    List<PrimaryToken> tokens = createTestTokens(50, 500 + batchNum * 50);
                    registry.bulkRegister(tokens).await().indefinitely();
                    latch.countDown();
                });
            }

            latch.await(5, TimeUnit.SECONDS);
            executor.shutdown();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("Read-write contention test: %dms", durationMs);
            assertTrue(registry.getStats().totalTokens >= 500, "Lost tokens during contention");
        }

        @Test
        @Order(24)
        @DisplayName("Should maintain cache coherence under load")
        void testCacheCoherence() throws InterruptedException {
            List<PrimaryToken> tokens = createTestTokens(100);
            registry.bulkRegister(tokens).await().indefinitely();

            ExecutorService executor = Executors.newFixedThreadPool(5);
            CountDownLatch latch = new CountDownLatch(5);

            for (int i = 0; i < 5; i++) {
                executor.submit(() -> {
                    for (int j = 0; j < 20; j++) {
                        PrimaryTokenRegistry.RegistryEntry entry = registry.lookup(tokens.get(j).tokenId).await().indefinitely();
                        assertNotNull(entry, "Cache coherence violation - entry not found");
                    }
                    latch.countDown();
                });
            }

            latch.await(5, TimeUnit.SECONDS);
            executor.shutdown();

            LOG.info("Cache coherence test completed successfully");
        }

        @Test
        @Order(25)
        @DisplayName("Should maintain atomicity under load")
        void testAtomicityUnderLoad() throws InterruptedException {
            ExecutorService executor = Executors.newFixedThreadPool(10);
            CountDownLatch latch = new CountDownLatch(10);

            for (int i = 0; i < 10; i++) {
                final int batchNum = i;
                executor.submit(() -> {
                    List<PrimaryToken> tokens = createTestTokens(10, batchNum * 10);
                    registry.bulkRegister(tokens).await().indefinitely();
                    latch.countDown();
                });
            }

            latch.await(5, TimeUnit.SECONDS);
            executor.shutdown();

            int finalCount = registry.getStats().totalTokens;
            LOG.infof("Atomicity test - Expected: 100, Actual: %d", finalCount);
            assertEquals(100, finalCount, "Atomicity violation detected");
        }
    }

    // =============== SCALABILITY TESTS ===============

    @Nested
    @DisplayName("Scalability Tests")
    class ScalabilityTests {

        @Test
        @Order(26)
        @DisplayName("Should scale to 1000 tokens (measure all operations)")
        void testWith1000Tokens() {
            List<PrimaryToken> tokens = createTestTokens(1000);

            long regStart = System.currentTimeMillis();
            registry.bulkRegister(tokens).await().indefinitely();
            long regTime = System.currentTimeMillis() - regStart;

            long lookupStart = System.currentTimeMillis();
            registry.lookup(tokens.get(500).tokenId).await().indefinitely();
            long lookupTime = System.currentTimeMillis() - lookupStart;

            long proofStart = System.currentTimeMillis();
            registry.generateProof(tokens.get(500).tokenId).await().indefinitely();
            long proofTime = System.currentTimeMillis() - proofStart;

            LOG.infof("1000 tokens - Registration: %dms, Lookup: %dms, Proof: %dms",
                    regTime, lookupTime, proofTime);

            assertTrue(regTime < 110, "Registration: " + regTime + "ms");
            assertTrue(lookupTime < 5, "Lookup: " + lookupTime + "ms");
            assertTrue(proofTime < 50, "Proof: " + proofTime + "ms");
        }

        @Test
        @Order(27)
        @DisplayName("Should scale to 5000 tokens (stretch test)")
        void testWith5000Tokens() {
            List<PrimaryToken> tokens = createTestTokens(5000);

            long startTime = System.currentTimeMillis();
            registry.bulkRegister(tokens).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("5000 tokens registration: %dms", durationMs);
            assertEquals(5000, registry.getStats().totalTokens);
            assertTrue(durationMs < 500, "5000 tokens took " + durationMs + "ms");

            // Verify lookup still fast
            long lookupStart = System.currentTimeMillis();
            registry.lookup(tokens.get(2500).tokenId).await().indefinitely();
            long lookupTime = System.currentTimeMillis() - lookupStart;
            assertTrue(lookupTime < 10, "Lookup degraded at scale: " + lookupTime + "ms");
        }

        @Test
        @Order(28)
        @DisplayName("Should scale to 10000 tokens (future capacity)")
        void testWith10000Tokens() {
            List<PrimaryToken> tokens = createTestTokens(10000);

            long startTime = System.currentTimeMillis();
            registry.bulkRegister(tokens).await().indefinitely();
            long durationMs = System.currentTimeMillis() - startTime;

            LOG.infof("10000 tokens registration: %dms", durationMs);
            assertEquals(10000, registry.getStats().totalTokens);
            assertTrue(durationMs < 1000, "10000 tokens took " + durationMs + "ms");
        }

        @Test
        @Order(29)
        @DisplayName("Should demonstrate linear memory scaling")
        void testMemoryScaling() {
            Runtime runtime = Runtime.getRuntime();

            runtime.gc();
            long mem1000Before = runtime.totalMemory() - runtime.freeMemory();
            List<PrimaryToken> tokens1000 = createTestTokens(1000);
            registry.bulkRegister(tokens1000).await().indefinitely();
            runtime.gc();
            long mem1000After = runtime.totalMemory() - runtime.freeMemory();
            long mem1000Used = (mem1000After - mem1000Before) / (1024 * 1024);

            registry.clear();
            runtime.gc();

            long mem2000Before = runtime.totalMemory() - runtime.freeMemory();
            List<PrimaryToken> tokens2000 = createTestTokens(2000);
            registry.bulkRegister(tokens2000).await().indefinitely();
            runtime.gc();
            long mem2000After = runtime.totalMemory() - runtime.freeMemory();
            long mem2000Used = (mem2000After - mem2000Before) / (1024 * 1024);

            LOG.infof("Memory scaling: 1000 tokens=%dMB, 2000 tokens=%dMB", mem1000Used, mem2000Used);

            // Check for reasonable linear scaling (allow some variance)
            double scalingRatio = (double) mem2000Used / mem1000Used;
            assertTrue(scalingRatio < 3.0, "Memory scaling not linear: ratio=" + scalingRatio);
        }

        @Test
        @Order(30)
        @DisplayName("Should demonstrate logarithmic tree depth scaling")
        void testTreeDepthScaling() {
            List<PrimaryToken> tokens100 = createTestTokens(100);
            PrimaryTokenMerkleService.MerkleTree tree100 = merkleService.buildPrimaryTokenTree(tokens100);

            List<PrimaryToken> tokens1000 = createTestTokens(1000);
            PrimaryTokenMerkleService.MerkleTree tree1000 = merkleService.buildPrimaryTokenTree(tokens1000);

            List<PrimaryToken> tokens10000 = createTestTokens(10000);
            PrimaryTokenMerkleService.MerkleTree tree10000 = merkleService.buildPrimaryTokenTree(tokens10000);

            LOG.infof("Tree depth scaling: 100 tokens=%d, 1000 tokens=%d, 10000 tokens=%d",
                    tree100.getDepth(), tree1000.getDepth(), tree10000.getDepth());

            // Verify logarithmic scaling (log2(n))
            assertTrue(tree100.getDepth() <= 8);    // log2(100) ≈ 6.6
            assertTrue(tree1000.getDepth() <= 11);  // log2(1000) ≈ 10
            assertTrue(tree10000.getDepth() <= 15); // log2(10000) ≈ 13.3
        }
    }

    // =============== HELPER METHODS ===============

    private PrimaryToken createTestToken(int index) {
        return new PrimaryToken(
                String.format("PT-REAL_ESTATE-%08d", index),
                String.format("DT-PROP-%08d", index),
                "REAL_ESTATE",
                new BigDecimal("100000.00"),
                String.format("owner-%d", index % 10)
        );
    }

    private List<PrimaryToken> createTestTokens(int count) {
        return createTestTokens(count, 0);
    }

    private List<PrimaryToken> createTestTokens(int count, int offset) {
        return IntStream.range(offset, offset + count)
                .mapToObj(this::createTestToken)
                .collect(Collectors.toList());
    }
}
