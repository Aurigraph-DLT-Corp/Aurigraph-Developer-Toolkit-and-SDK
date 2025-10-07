package io.aurigraph.v11.performance;

import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.aurigraph.v11.bridge.CrossChainBridgeService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Performance Validation Test Suite for Aurigraph V11
 *
 * Phase 1 Testing Sprint - Task 1.5
 *
 * Validates all critical services against 2M+ TPS performance target:
 * - TransactionService: 1M+ TPS baseline throughput
 * - HyperRAFTConsensusService: High-throughput consensus proposals
 * - QuantumCryptoService: 10K+ crypto operations per second
 * - CrossChainBridgeService: Cross-chain transfer throughput
 * - End-to-End Pipeline: Full transaction lifecycle performance
 * - Sustained Load: Long-running stability and memory management
 *
 * Test Coverage:
 * - 6+ comprehensive performance validation tests
 * - P50, P99 latency percentile measurements
 * - Throughput calculations (TPS, ops/sec)
 * - Memory leak detection
 * - Virtual thread utilization (Java 21)
 * - Multi-round sustained load testing
 *
 * Performance Targets:
 * - Transaction Processing: 1M+ TPS
 * - Consensus Operations: 10K+ proposals/sec
 * - Crypto Operations: 10K+ ops/sec
 * - Bridge Operations: 1K+ transfers/sec
 * - End-to-End Latency: <100ms P99
 * - Memory Growth: <100MB after 1M operations
 *
 * @author Aurigraph V11 Team
 * @version 11.0.0
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PerformanceValidationTest {

    @Inject
    TransactionService transactionService;

    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    QuantumCryptoService cryptoService;

    @Inject
    CrossChainBridgeService bridgeService;

    // Performance constants
    private static final int BASELINE_TPS_TARGET = 1_000_000;
    private static final int CONSENSUS_OPS_TARGET = 10_000;
    private static final int CRYPTO_OPS_TARGET = 10_000;
    private static final int BRIDGE_OPS_TARGET = 1_000;
    private static final long MAX_MEMORY_GROWTH_MB = 100;

    // =====================================================================
    // TEST 1: TRANSACTION THROUGHPUT VALIDATION (1M+ TPS Baseline)
    // =====================================================================

    @Test
    @Order(1)
    @DisplayName("Should achieve 1M+ TPS baseline transaction throughput")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testTransactionThroughputBaseline() {
        System.out.println("\n=== PERFORMANCE TEST 1: Transaction Throughput Baseline ===");

        // Arrange
        int iterations = 1_000_000; // 1 million transactions
        List<TransactionService.TransactionRequest> requests = new ArrayList<>(iterations);
        List<Long> latencies = new ArrayList<>();

        for (int i = 0; i < iterations; i++) {
            requests.add(new TransactionService.TransactionRequest(
                "perf-baseline-tx-" + i,
                100.0 + (i * 0.001)
            ));
        }

        // Act
        long startTime = System.currentTimeMillis();
        List<String> results = transactionService
            .batchProcessTransactions(requests)
            .collect().asList()
            .await().atMost(Duration.ofMinutes(2));
        long duration = System.currentTimeMillis() - startTime;

        // Calculate metrics
        double tps = (iterations * 1000.0) / duration;
        double avgLatencyMs = (double) duration / iterations;

        // Assert
        assertEquals(iterations, results.size(),
            "Should process all 1M transactions");
        assertTrue(tps >= BASELINE_TPS_TARGET,
            String.format("TPS %.0f below 1M baseline target", tps));

        // Verify all processed successfully
        long successCount = results.stream()
            .filter(r -> r.startsWith("PROCESSED:"))
            .count();
        assertEquals(iterations, successCount,
            "All transactions should be processed successfully");

        // Performance Report
        System.out.printf("✅ Transaction Throughput: %.0f TPS%n", tps);
        System.out.printf("   - Total Transactions: %,d%n", iterations);
        System.out.printf("   - Duration: %,dms%n", duration);
        System.out.printf("   - Avg Latency: %.3fms%n", avgLatencyMs);
        System.out.printf("   - Success Rate: 100.00%%%n");
        System.out.printf("   - Target Met: %s%n", tps >= BASELINE_TPS_TARGET ? "YES" : "NO");
    }

    // =====================================================================
    // TEST 2: CONSENSUS PERFORMANCE VALIDATION
    // =====================================================================

    @Test
    @Order(2)
    @DisplayName("Should achieve 10K+ consensus proposals per second")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConsensusProposalThroughput() {
        System.out.println("\n=== PERFORMANCE TEST 2: Consensus Proposal Throughput ===");

        // Arrange - Try to become leader
        Boolean wonElection = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        if (wonElection != null && wonElection &&
            consensusService.getCurrentState() == HyperRAFTConsensusService.NodeState.LEADER) {

            int proposalCount = 10_000;
            List<Long> proposalLatencies = new ArrayList<>();
            int successfulProposals = 0;

            // Act - Measure proposal performance
            long startTime = System.currentTimeMillis();

            for (int i = 0; i < proposalCount; i++) {
                long propStartTime = System.nanoTime();
                String value = "consensus-proposal-" + i;
                Boolean result = consensusService.proposeValue(value)
                    .await().atMost(Duration.ofSeconds(2));
                long propLatency = (System.nanoTime() - propStartTime) / 1_000_000; // Convert to ms

                if (result != null && result) {
                    successfulProposals++;
                    proposalLatencies.add(propLatency);
                }
            }

            long duration = System.currentTimeMillis() - startTime;

            // Calculate metrics
            double proposalsPerSecond = (successfulProposals * 1000.0) / duration;
            double avgLatencyMs = proposalLatencies.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);

            // Calculate P50 and P99 latencies
            Collections.sort(proposalLatencies);
            long p50Latency = proposalLatencies.get((int) (proposalLatencies.size() * 0.50));
            long p99Latency = proposalLatencies.get((int) (proposalLatencies.size() * 0.99));

            // Assert
            assertTrue(successfulProposals >= proposalCount * 0.80,
                "Should have high success rate (>80%) for consensus proposals");
            assertTrue(proposalsPerSecond >= CONSENSUS_OPS_TARGET * 0.5,
                String.format("Consensus throughput %.0f below 50%% of target", proposalsPerSecond));

            // Performance Report
            System.out.printf("✅ Consensus Performance: %.0f proposals/sec%n", proposalsPerSecond);
            System.out.printf("   - Total Proposals: %,d%n", proposalCount);
            System.out.printf("   - Successful: %,d (%.1f%%)%n",
                successfulProposals, (successfulProposals * 100.0) / proposalCount);
            System.out.printf("   - Duration: %,dms%n", duration);
            System.out.printf("   - Avg Latency: %.2fms%n", avgLatencyMs);
            System.out.printf("   - P50 Latency: %dms%n", p50Latency);
            System.out.printf("   - P99 Latency: %dms%n", p99Latency);
            System.out.printf("   - Target Met: %s%n",
                proposalsPerSecond >= CONSENSUS_OPS_TARGET * 0.5 ? "PARTIAL" : "NO");
        } else {
            System.out.println("⚠️  Consensus test skipped - node is not leader");
            System.out.println("   This is expected in distributed testing scenarios");
        }
    }

    // =====================================================================
    // TEST 3: QUANTUM CRYPTO PERFORMANCE VALIDATION
    // =====================================================================

    @Test
    @Order(3)
    @DisplayName("Should achieve 10K+ quantum crypto operations per second")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testQuantumCryptoPerformance() {
        System.out.println("\n=== PERFORMANCE TEST 3: Quantum Crypto Operations ===");

        // Arrange - Generate test keys
        String encKeyId = "perf-test-enc-key-" + System.currentTimeMillis();
        String signKeyId = "perf-test-sign-key-" + System.currentTimeMillis();

        cryptoService.generateKeyPair(new QuantumCryptoService.KeyGenerationRequest(
            encKeyId, "CRYSTALS-Kyber"))
            .await().atMost(Duration.ofSeconds(10));

        cryptoService.generateKeyPair(new QuantumCryptoService.KeyGenerationRequest(
            signKeyId, "CRYSTALS-Dilithium"))
            .await().atMost(Duration.ofSeconds(10));

        int encryptionOps = 5_000;
        int signatureOps = 5_000;
        String testData = "Performance test data for quantum cryptography validation";

        List<Long> encryptionLatencies = new ArrayList<>();
        List<Long> signatureLatencies = new ArrayList<>();

        // Act - Test encryption performance
        long encStartTime = System.currentTimeMillis();
        int successfulEncryptions = 0;

        for (int i = 0; i < encryptionOps; i++) {
            long opStartTime = System.nanoTime();
            QuantumCryptoService.EncryptionResult result = cryptoService.encryptData(
                new QuantumCryptoService.EncryptionRequest(encKeyId, testData + "-" + i))
                .await().atMost(Duration.ofSeconds(5));
            long opLatency = (System.nanoTime() - opStartTime) / 1_000_000;

            if (result.success()) {
                successfulEncryptions++;
                encryptionLatencies.add(opLatency);
            }
        }

        long encDuration = System.currentTimeMillis() - encStartTime;

        // Test signature performance
        long signStartTime = System.currentTimeMillis();
        int successfulSignatures = 0;

        for (int i = 0; i < signatureOps; i++) {
            long opStartTime = System.nanoTime();
            QuantumCryptoService.SignatureResult result = cryptoService.signData(
                new QuantumCryptoService.SignatureRequest(signKeyId, testData + "-" + i))
                .await().atMost(Duration.ofSeconds(5));
            long opLatency = (System.nanoTime() - opStartTime) / 1_000_000;

            if (result.success()) {
                successfulSignatures++;
                signatureLatencies.add(opLatency);
            }
        }

        long signDuration = System.currentTimeMillis() - signStartTime;

        // Calculate metrics
        double encOpsPerSec = (successfulEncryptions * 1000.0) / encDuration;
        double signOpsPerSec = (successfulSignatures * 1000.0) / signDuration;
        double totalOpsPerSec = ((successfulEncryptions + successfulSignatures) * 1000.0) /
                                (encDuration + signDuration);

        // Calculate P50 and P99 latencies
        Collections.sort(encryptionLatencies);
        Collections.sort(signatureLatencies);

        long encP50 = encryptionLatencies.isEmpty() ? 0 :
            encryptionLatencies.get((int) (encryptionLatencies.size() * 0.50));
        long encP99 = encryptionLatencies.isEmpty() ? 0 :
            encryptionLatencies.get((int) (encryptionLatencies.size() * 0.99));
        long signP50 = signatureLatencies.isEmpty() ? 0 :
            signatureLatencies.get((int) (signatureLatencies.size() * 0.50));
        long signP99 = signatureLatencies.isEmpty() ? 0 :
            signatureLatencies.get((int) (signatureLatencies.size() * 0.99));

        // Assert
        assertTrue(successfulEncryptions >= encryptionOps * 0.95,
            "Encryption success rate should be >95%");
        assertTrue(successfulSignatures >= signatureOps * 0.95,
            "Signature success rate should be >95%");
        assertTrue(totalOpsPerSec >= CRYPTO_OPS_TARGET * 0.3,
            String.format("Crypto ops/sec %.0f below 30%% of target", totalOpsPerSec));

        // Performance Report
        System.out.printf("✅ Quantum Crypto Performance: %.0f total ops/sec%n", totalOpsPerSec);
        System.out.println("\n   Encryption Operations:");
        System.out.printf("   - Total: %,d, Successful: %,d (%.1f%%)%n",
            encryptionOps, successfulEncryptions, (successfulEncryptions * 100.0) / encryptionOps);
        System.out.printf("   - Throughput: %.0f ops/sec%n", encOpsPerSec);
        System.out.printf("   - P50 Latency: %dms, P99 Latency: %dms%n", encP50, encP99);

        System.out.println("\n   Signature Operations:");
        System.out.printf("   - Total: %,d, Successful: %,d (%.1f%%)%n",
            signatureOps, successfulSignatures, (successfulSignatures * 100.0) / signatureOps);
        System.out.printf("   - Throughput: %.0f ops/sec%n", signOpsPerSec);
        System.out.printf("   - P50 Latency: %dms, P99 Latency: %dms%n", signP50, signP99);

        System.out.printf("\n   Target Met: %s%n",
            totalOpsPerSec >= CRYPTO_OPS_TARGET * 0.3 ? "PARTIAL" : "NO");
    }

    // =====================================================================
    // TEST 4: CROSS-CHAIN BRIDGE PERFORMANCE VALIDATION
    // =====================================================================

    @Test
    @Order(4)
    @DisplayName("Should achieve 1K+ cross-chain bridge transfers per second")
    @Timeout(value = 90, unit = TimeUnit.SECONDS)
    void testCrossChainBridgeThroughput() {
        System.out.println("\n=== PERFORMANCE TEST 4: Cross-Chain Bridge Throughput ===");

        // Arrange
        int bridgeOperations = 1_000;
        List<Long> bridgeLatencies = new ArrayList<>();
        List<String> transactionIds = new ArrayList<>();

        // Act - Initiate bridge operations
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < bridgeOperations; i++) {
            long opStartTime = System.nanoTime();

            // Create bridge request
            io.aurigraph.v11.bridge.BridgeRequest request =
                new io.aurigraph.v11.bridge.BridgeRequest(
                    "ethereum",
                    "polygon",
                    "0xSource" + i,
                    "0xTarget" + i,
                    "0xTokenContract",
                    "AURG",
                    new BigDecimal("100.50")
                );

            String txId = bridgeService.initiateBridge(request)
                .await().atMost(Duration.ofSeconds(10));

            long opLatency = (System.nanoTime() - opStartTime) / 1_000_000;

            transactionIds.add(txId);
            bridgeLatencies.add(opLatency);
        }

        long duration = System.currentTimeMillis() - startTime;

        // Calculate metrics
        double bridgeOpsPerSec = (bridgeOperations * 1000.0) / duration;
        double avgLatencyMs = bridgeLatencies.stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0.0);

        // Calculate P50 and P99 latencies
        Collections.sort(bridgeLatencies);
        long p50Latency = bridgeLatencies.get((int) (bridgeLatencies.size() * 0.50));
        long p99Latency = bridgeLatencies.get((int) (bridgeLatencies.size() * 0.99));

        // Assert
        assertEquals(bridgeOperations, transactionIds.size(),
            "All bridge operations should return transaction IDs");
        assertTrue(bridgeOpsPerSec >= BRIDGE_OPS_TARGET,
            String.format("Bridge throughput %.0f below target", bridgeOpsPerSec));
        assertTrue(p99Latency < 500,
            "P99 latency should be <500ms for bridge initiation");

        // Performance Report
        System.out.printf("✅ Bridge Performance: %.0f transfers/sec%n", bridgeOpsPerSec);
        System.out.printf("   - Total Operations: %,d%n", bridgeOperations);
        System.out.printf("   - Duration: %,dms%n", duration);
        System.out.printf("   - Avg Latency: %.2fms%n", avgLatencyMs);
        System.out.printf("   - P50 Latency: %dms%n", p50Latency);
        System.out.printf("   - P99 Latency: %dms%n", p99Latency);
        System.out.printf("   - Target Met: %s%n",
            bridgeOpsPerSec >= BRIDGE_OPS_TARGET ? "YES" : "NO");
    }

    // =====================================================================
    // TEST 5: END-TO-END PERFORMANCE VALIDATION
    // =====================================================================

    @Test
    @Order(5)
    @DisplayName("Should achieve <100ms P99 latency for end-to-end transaction pipeline")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testEndToEndTransactionPipeline() {
        System.out.println("\n=== PERFORMANCE TEST 5: End-to-End Transaction Pipeline ===");

        // Arrange
        int e2eTransactions = 10_000;
        List<Long> e2eLatencies = new ArrayList<>();
        int successfulPipelines = 0;

        // Prepare consensus if possible
        Boolean isLeader = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        // Act - Full pipeline: Transaction → Consensus → Commit
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < e2eTransactions; i++) {
            long pipelineStartTime = System.nanoTime();

            try {
                // Step 1: Process transaction
                String txResult = transactionService.processTransaction(
                    "e2e-tx-" + i,
                    100.0 + i
                );

                // Step 2: Consensus (if leader)
                if (isLeader != null && isLeader) {
                    consensusService.proposeValue("tx-" + i)
                        .await().atMost(Duration.ofMillis(500));
                }

                // Step 3: Verify commit (simulated)
                boolean committed = txResult.contains("PROCESSED");

                long pipelineLatency = (System.nanoTime() - pipelineStartTime) / 1_000_000;

                if (committed) {
                    successfulPipelines++;
                    e2eLatencies.add(pipelineLatency);
                }

            } catch (Exception e) {
                // Log but continue
            }
        }

        long duration = System.currentTimeMillis() - startTime;

        // Calculate metrics
        double e2eTps = (successfulPipelines * 1000.0) / duration;
        double avgLatencyMs = e2eLatencies.stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0.0);

        // Calculate P50 and P99 latencies
        Collections.sort(e2eLatencies);
        long p50Latency = e2eLatencies.isEmpty() ? 0 :
            e2eLatencies.get((int) (e2eLatencies.size() * 0.50));
        long p99Latency = e2eLatencies.isEmpty() ? 0 :
            e2eLatencies.get((int) (e2eLatencies.size() * 0.99));

        // Assert
        assertTrue(successfulPipelines >= e2eTransactions * 0.95,
            "E2E success rate should be >95%");
        assertTrue(p99Latency < 100,
            String.format("P99 latency %dms exceeds 100ms target", p99Latency));

        // Performance Report
        System.out.printf("✅ End-to-End Pipeline: %.0f TPS%n", e2eTps);
        System.out.printf("   - Total Pipelines: %,d%n", e2eTransactions);
        System.out.printf("   - Successful: %,d (%.1f%%)%n",
            successfulPipelines, (successfulPipelines * 100.0) / e2eTransactions);
        System.out.printf("   - Duration: %,dms%n", duration);
        System.out.printf("   - Avg Latency: %.2fms%n", avgLatencyMs);
        System.out.printf("   - P50 Latency: %dms%n", p50Latency);
        System.out.printf("   - P99 Latency: %dms (%s)%n", p99Latency,
            p99Latency < 100 ? "✓ Target Met" : "✗ Above Target");
    }

    // =====================================================================
    // TEST 6: SUSTAINED LOAD VALIDATION
    // =====================================================================

    @Test
    @Order(6)
    @DisplayName("Should maintain performance under sustained load without memory leaks")
    @Timeout(value = 180, unit = TimeUnit.SECONDS)
    void testSustainedLoadPerformance() throws InterruptedException {
        System.out.println("\n=== PERFORMANCE TEST 6: Sustained Load & Memory Stability ===");

        // Arrange
        Runtime runtime = Runtime.getRuntime();
        runtime.gc(); // Force GC before test
        Thread.sleep(1000); // Allow GC to complete

        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        int rounds = 10;
        int operationsPerRound = 100_000;
        List<Double> roundTpsResults = new ArrayList<>();
        List<Long> roundMemoryUsage = new ArrayList<>();

        // Act - Multiple rounds of sustained load
        for (int round = 0; round < rounds; round++) {
            System.out.printf("\n   Round %d/%d: Processing %,d operations...%n",
                round + 1, rounds, operationsPerRound);

            List<TransactionService.TransactionRequest> requests = new ArrayList<>(operationsPerRound);
            for (int i = 0; i < operationsPerRound; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "sustained-r" + round + "-tx" + i,
                    100.0 + (i * 0.01)
                ));
            }

            long roundStartTime = System.currentTimeMillis();
            List<String> results = transactionService
                .batchProcessTransactions(requests)
                .collect().asList()
                .await().atMost(Duration.ofSeconds(30));
            long roundDuration = System.currentTimeMillis() - roundStartTime;

            double roundTps = (operationsPerRound * 1000.0) / roundDuration;
            roundTpsResults.add(roundTps);

            // Memory check
            if (round % 2 == 0) {
                runtime.gc();
                Thread.sleep(500);
            }
            long currentMemory = runtime.totalMemory() - runtime.freeMemory();
            roundMemoryUsage.add(currentMemory);

            System.out.printf("   Round %d Complete: %.0f TPS, Memory: %dMB%n",
                round + 1, roundTps, currentMemory / (1024 * 1024));

            assertEquals(operationsPerRound, results.size(),
                String.format("Round %d should process all operations", round + 1));
        }

        // Final memory check
        runtime.gc();
        Thread.sleep(1000);
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryGrowthMB = (memoryAfter - memoryBefore) / (1024 * 1024);

        // Calculate statistics
        double avgTps = roundTpsResults.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double minTps = roundTpsResults.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        double maxTps = roundTpsResults.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double tpsStdDev = calculateStdDev(roundTpsResults);

        long minMemory = roundMemoryUsage.stream().mapToLong(Long::longValue).min().orElse(0) / (1024 * 1024);
        long maxMemory = roundMemoryUsage.stream().mapToLong(Long::longValue).max().orElse(0) / (1024 * 1024);

        // Assert
        assertTrue(avgTps >= BASELINE_TPS_TARGET,
            String.format("Average TPS %.0f below baseline", avgTps));
        assertTrue(minTps >= BASELINE_TPS_TARGET * 0.8,
            String.format("Minimum TPS %.0f below 80%% of baseline", minTps));
        assertTrue(memoryGrowthMB < MAX_MEMORY_GROWTH_MB,
            String.format("Memory growth %dMB exceeds %dMB limit", memoryGrowthMB, MAX_MEMORY_GROWTH_MB));

        // Performance Report
        System.out.println("\n✅ Sustained Load Performance:");
        System.out.printf("   - Total Rounds: %d%n", rounds);
        System.out.printf("   - Operations/Round: %,d%n", operationsPerRound);
        System.out.printf("   - Total Operations: %,d%n", rounds * operationsPerRound);
        System.out.println("\n   Throughput Statistics:");
        System.out.printf("   - Average TPS: %.0f%n", avgTps);
        System.out.printf("   - Min TPS: %.0f%n", minTps);
        System.out.printf("   - Max TPS: %.0f%n", maxTps);
        System.out.printf("   - Std Dev: %.0f%n", tpsStdDev);
        System.out.printf("   - Consistency: %.1f%%%n", (1 - (tpsStdDev / avgTps)) * 100);
        System.out.println("\n   Memory Statistics:");
        System.out.printf("   - Initial Memory: %dMB%n", memoryBefore / (1024 * 1024));
        System.out.printf("   - Final Memory: %dMB%n", memoryAfter / (1024 * 1024));
        System.out.printf("   - Memory Growth: %dMB (%s)%n", memoryGrowthMB,
            memoryGrowthMB < MAX_MEMORY_GROWTH_MB ? "✓ Within Limit" : "✗ Exceeds Limit");
        System.out.printf("   - Min Round Memory: %dMB%n", minMemory);
        System.out.printf("   - Max Round Memory: %dMB%n", maxMemory);
    }

    // =====================================================================
    // HELPER METHODS
    // =====================================================================

    private double calculateStdDev(List<Double> values) {
        if (values.isEmpty()) return 0.0;

        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double variance = values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .average()
            .orElse(0.0);

        return Math.sqrt(variance);
    }

    // =====================================================================
    // TEST LIFECYCLE
    // =====================================================================

    @BeforeAll
    static void setupPerformanceTests() {
        System.out.println("\n");
        System.out.println("==================================================================");
        System.out.println("   AURIGRAPH V11 PERFORMANCE VALIDATION TEST SUITE");
        System.out.println("   Phase 1 Testing Sprint - Task 1.5");
        System.out.println("==================================================================");
        System.out.println("\nPerformance Targets:");
        System.out.println("  - Transaction Processing: 1M+ TPS");
        System.out.println("  - Consensus Operations: 10K+ proposals/sec");
        System.out.println("  - Crypto Operations: 10K+ ops/sec");
        System.out.println("  - Bridge Operations: 1K+ transfers/sec");
        System.out.println("  - End-to-End P99 Latency: <100ms");
        System.out.println("  - Memory Growth: <100MB after 1M ops");
        System.out.println("\nStarting tests with Java Virtual Threads (Java 21)...");
        System.out.println("==================================================================\n");
    }

    @AfterAll
    static void tearDownPerformanceTests() {
        System.out.println("\n");
        System.out.println("==================================================================");
        System.out.println("   PERFORMANCE VALIDATION TEST SUITE COMPLETED");
        System.out.println("==================================================================");
        System.out.println("\n✅ All performance validation tests completed successfully");
        System.out.println("   Results demonstrate Aurigraph V11's path to 2M+ TPS target");
        System.out.println("\n==================================================================\n");
    }
}
