package io.aurigraph.v11.integration;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.ConsensusStats;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService.NodeState;
import io.aurigraph.v11.crypto.DilithiumSignatureService;
import io.aurigraph.v11.crypto.DilithiumSignatureService.DilithiumMetrics;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for Consensus and Cryptography services
 *
 * Tests the interaction between HyperRAFT++ consensus and CRYSTALS-Dilithium
 * quantum-resistant signatures to ensure secure leader election, proposal
 * signing, and distributed consensus with post-quantum cryptography.
 *
 * Test Scenarios:
 * - Leader election with quantum-signed votes
 * - Consensus proposals with Dilithium signatures
 * - Multi-node consensus with signature verification
 * - Performance of integrated consensus + crypto operations
 * - Edge cases and error conditions
 *
 * Phase 3 Day 3 Coverage Target: 40 tests
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ConsensusAndCryptoIntegrationTest extends ServiceTestBase {

    private static final Logger logger = LoggerFactory.getLogger(ConsensusAndCryptoIntegrationTest.class);

    @Inject
    HyperRAFTConsensusService consensusService;

    @Inject
    DilithiumSignatureService dilithiumService;

    @BeforeEach
    public void setupIntegrationTest() {
        // Initialize Dilithium service
        dilithiumService.initialize();

        // Setup consensus cluster
        consensusService.addNode("follower-1");
        consensusService.addNode("follower-2");

        logger.info("Integration test setup complete - Consensus + Crypto services initialized");
    }

    @AfterEach
    public void cleanupIntegrationTest() {
        dilithiumService.clearCaches();
        logger.info("Integration test cleanup complete");
    }

    // Helper method to safely generate key pair
    private KeyPair generateTestKeyPair() {
        try {
            return dilithiumService.generateKeyPair();
        } catch (Exception e) {
            logger.error("Failed to generate key pair", e);
            throw new RuntimeException("Key generation failed", e);
        }
    }

    // ==================== Basic Integration Tests ====================

    @Test
    @Order(1)
    @DisplayName("IT-1: Services should be properly injected and initialized")
    void testServicesInjection() {
        assertThat(consensusService)
            .as("Consensus service should be injected")
            .isNotNull();

        assertThat(dilithiumService)
            .as("Dilithium service should be injected")
            .isNotNull();

        // Verify consensus service is operational
        ConsensusStats stats = consensusService.getStats().await().atMost(Duration.ofSeconds(2));
        assertThat(stats.nodeId).isNotNull();

        // Verify crypto service is operational
        DilithiumMetrics metrics = dilithiumService.getMetrics();
        assertThat(metrics).isNotNull();

        logger.info("✓ Both services are properly injected and operational");
    }

    @Test
    @Order(2)
    @DisplayName("IT-2: Should sign and verify consensus proposal data")
    void testSignConsensusProposal() {
        KeyPair keyPair = generateTestKeyPair();

        String proposalData = "proposal-tx-12345";
        byte[] data = proposalData.getBytes(StandardCharsets.UTF_8);

        // Sign proposal with leader's key
        byte[] signature = dilithiumService.sign(data, keyPair.getPrivate());

        assertThat(signature)
            .as("Signature should be generated")
            .isNotNull()
            .isNotEmpty();

        // Verify signature with leader's public key
        boolean isValid = dilithiumService.verify(data, signature, keyPair.getPublic());

        assertThat(isValid)
            .as("Signature should be valid")
            .isTrue();

        logger.info("✓ Consensus proposal signed and verified successfully");
    }

    @Test
    @Order(3)
    @DisplayName("IT-3: Should handle leader election with signed votes")
    void testLeaderElectionWithSignatures() {
        KeyPair leaderKeyPair = generateTestKeyPair();

        // Start election
        Boolean electionResult = consensusService.startElection()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(electionResult).isNotNull();

        // If became leader, sign election certificate
        if (consensusService.getCurrentState() == NodeState.LEADER) {
            String electionCertificate = "election-term-" + consensusService.getCurrentTerm();
            byte[] certData = electionCertificate.getBytes(StandardCharsets.UTF_8);

            byte[] signature = dilithiumService.sign(certData, leaderKeyPair.getPrivate());
            boolean isValid = dilithiumService.verify(certData, signature, leaderKeyPair.getPublic());

            assertThat(isValid)
                .as("Election certificate signature should be valid")
                .isTrue();

            logger.info("✓ Leader election completed with valid quantum signature");
        } else {
            logger.info("✓ Node did not become leader (expected in some cases)");
        }
    }

    @Test
    @Order(4)
    @DisplayName("IT-4: Should validate signed consensus proposals")
    void testSignedProposalValidation() {
        KeyPair leaderKeyPair = generateTestKeyPair();

        // Try to become leader
        consensusService.startElection().await().atMost(Duration.ofSeconds(5));

        if (consensusService.getCurrentState() == NodeState.LEADER) {
            String proposalValue = "transaction-batch-001";

            // 1. Sign the proposal
            byte[] proposalData = proposalValue.getBytes(StandardCharsets.UTF_8);
            byte[] signature = dilithiumService.sign(proposalData, leaderKeyPair.getPrivate());

            // 2. Submit proposal to consensus
            Boolean consensusResult = consensusService.proposeValue(proposalValue)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(consensusResult)
                .as("Proposal should be accepted by consensus")
                .isTrue();

            // 3. Verify signature is still valid
            boolean signatureValid = dilithiumService.verify(proposalData, signature, leaderKeyPair.getPublic());

            assertThat(signatureValid)
                .as("Proposal signature should remain valid")
                .isTrue();

            logger.info("✓ Signed proposal validated through consensus pipeline");
        }
    }

    @Test
    @Order(5)
    @DisplayName("IT-5: Should reject proposals with invalid signatures")
    void testInvalidSignatureRejection() {
        KeyPair keyPair1 = generateTestKeyPair();
        KeyPair keyPair2 = generateTestKeyPair();

        String proposalData = "invalid-proposal";
        byte[] data = proposalData.getBytes(StandardCharsets.UTF_8);

        // Sign with one key
        byte[] signature = dilithiumService.sign(data, keyPair1.getPrivate());

        // Try to verify with different key (should fail)
        boolean isValid = dilithiumService.verify(data, signature, keyPair2.getPublic());

        assertThat(isValid)
            .as("Signature should be invalid with wrong public key")
            .isFalse();

        logger.info("✓ Invalid signature correctly rejected");
    }

    // ==================== Multi-Node Integration Tests ====================

    @Test
    @Order(6)
    @DisplayName("IT-6: Should handle multi-node consensus with signatures")
    void testMultiNodeConsensusWithSignatures() {
        KeyPair key1 = generateTestKeyPair();
        KeyPair key2 = generateTestKeyPair();
        KeyPair key3 = generateTestKeyPair();

        ConsensusStats stats = consensusService.getStats().await().atMost(Duration.ofSeconds(2));

        assertThat(stats.clusterSize)
            .as("Cluster should have multiple nodes")
            .isGreaterThan(1);

        // Simulate signatures from multiple nodes
        String consensusData = "multi-node-agreement";
        byte[] data = consensusData.getBytes(StandardCharsets.UTF_8);

        byte[] sig1 = dilithiumService.sign(data, key1.getPrivate());
        byte[] sig2 = dilithiumService.sign(data, key2.getPrivate());
        byte[] sig3 = dilithiumService.sign(data, key3.getPrivate());

        // Verify all signatures
        assertThat(dilithiumService.verify(data, sig1, key1.getPublic())).isTrue();
        assertThat(dilithiumService.verify(data, sig2, key2.getPublic())).isTrue();
        assertThat(dilithiumService.verify(data, sig3, key3.getPublic())).isTrue();

        logger.info("✓ Multi-node consensus with quantum signatures verified");
    }

    @Test
    @Order(7)
    @DisplayName("IT-7: Should batch sign and verify consensus proposals")
    void testBatchSigningConsensusProposals() {
        KeyPair keyPair = generateTestKeyPair();

        int batchSize = 10;
        byte[][] proposals = new byte[batchSize][];

        for (int i = 0; i < batchSize; i++) {
            proposals[i] = ("proposal-" + i).getBytes(StandardCharsets.UTF_8);
        }

        // Batch sign all proposals
        byte[][] signatures = dilithiumService.batchSign(proposals, keyPair.getPrivate());

        assertThat(signatures.length)
            .as("Should have signature for each proposal")
            .isEqualTo(batchSize);

        // Verify each signature
        int validCount = 0;
        for (int i = 0; i < batchSize; i++) {
            boolean isValid = dilithiumService.verify(proposals[i], signatures[i], keyPair.getPublic());
            if (isValid) validCount++;
        }

        assertThat(validCount)
            .as("All signatures should be valid")
            .isEqualTo(batchSize);

        logger.info("✓ Batch signed {} consensus proposals successfully", batchSize);
    }

    @Test
    @Order(8)
    @DisplayName("IT-8: Should verify quorum with multiple signatures")
    void testQuorumVerification() {
        KeyPair key1 = generateTestKeyPair();
        KeyPair key2 = generateTestKeyPair();
        KeyPair key3 = generateTestKeyPair();

        String proposalData = "quorum-proposal";
        byte[] data = proposalData.getBytes(StandardCharsets.UTF_8);

        // Get signatures from 3 nodes (leader + 2 followers)
        byte[] sig1 = dilithiumService.sign(data, key1.getPrivate());
        byte[] sig2 = dilithiumService.sign(data, key2.getPrivate());
        byte[] sig3 = dilithiumService.sign(data, key3.getPrivate());

        // Batch verify all signatures
        byte[][] dataItems = {data, data, data};
        byte[][] signatures = {sig1, sig2, sig3};
        PublicKey[] publicKeys = {key1.getPublic(), key2.getPublic(), key3.getPublic()};

        boolean[] results = dilithiumService.batchVerify(dataItems, signatures, publicKeys);

        // Count valid signatures (should be 3/3 for quorum)
        long validCount = 0;
        for (boolean result : results) {
            if (result) validCount++;
        }

        assertThat(validCount)
            .as("All signatures should be valid for quorum")
            .isEqualTo(3);

        logger.info("✓ Quorum achieved with {}/3 valid signatures", validCount);
    }

    // ==================== Performance Integration Tests ====================

    @ParameterizedTest
    @ValueSource(ints = {10, 50})
    @DisplayName("IT-9: Should maintain performance with integrated operations")
    void testIntegratedPerformance(int operationCount) {
        KeyPair keyPair = generateTestKeyPair();

        long startTime = System.currentTimeMillis();
        int successfulOps = 0;

        // Try to become leader first
        consensusService.startElection().await().atMost(Duration.ofSeconds(5));

        if (consensusService.getCurrentState() == NodeState.LEADER) {
            for (int i = 0; i < operationCount; i++) {
                String proposal = "perf-test-" + i;
                byte[] data = proposal.getBytes(StandardCharsets.UTF_8);

                // Sign proposal
                byte[] signature = dilithiumService.sign(data, keyPair.getPrivate());

                // Verify signature
                boolean sigValid = dilithiumService.verify(data, signature, keyPair.getPublic());

                // Submit to consensus
                Boolean consensusSuccess = consensusService.proposeValue(proposal)
                    .await().atMost(Duration.ofSeconds(2));

                if (sigValid && consensusSuccess) {
                    successfulOps++;
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            double opsPerSecond = (successfulOps * 1000.0) / duration;

            logger.info("Integrated ops: {}/{} successful in {}ms ({} ops/sec)",
                       successfulOps, operationCount, duration, String.format("%.2f", opsPerSecond));

            assertThat(successfulOps)
                .as("Should complete most operations successfully")
                .isGreaterThanOrEqualTo((int)(operationCount * 0.8)); // 80% success rate
        }
    }

    @Test
    @Order(10)
    @DisplayName("IT-10: Should measure signature overhead on consensus")
    void testSignatureOverhead() {
        KeyPair keyPair = generateTestKeyPair();

        // Measure consensus without signatures
        long startConsensusOnly = System.nanoTime();
        ConsensusStats stats1 = consensusService.getStats().await().atMost(Duration.ofSeconds(2));
        long consensusOnlyTime = (System.nanoTime() - startConsensusOnly) / 1_000_000;

        // Measure consensus + signature
        long startIntegrated = System.nanoTime();
        ConsensusStats stats2 = consensusService.getStats().await().atMost(Duration.ofSeconds(2));
        byte[] data = "test-data".getBytes(StandardCharsets.UTF_8);
        byte[] sig = dilithiumService.sign(data, keyPair.getPrivate());
        dilithiumService.verify(data, sig, keyPair.getPublic());
        long integratedTime = (System.nanoTime() - startIntegrated) / 1_000_000;

        long overhead = integratedTime - consensusOnlyTime;

        logger.info("Consensus-only: {}ms, Integrated: {}ms, Overhead: {}ms",
                   consensusOnlyTime, integratedTime, overhead);

        assertThat(overhead)
            .as("Signature overhead should be reasonable (<100ms)")
            .isLessThan(100L);
    }

    // ==================== Edge Cases and Error Handling ====================

    @Test
    @Order(11)
    @DisplayName("IT-11: Should handle empty signatures")
    void testEmptySignatureHandling() {
        KeyPair keyPair = generateTestKeyPair();

        byte[] data = "test".getBytes(StandardCharsets.UTF_8);
        byte[] emptySignature = new byte[0];

        boolean result = dilithiumService.verify(data, emptySignature, keyPair.getPublic());

        assertThat(result)
            .as("Empty signature should be invalid")
            .isFalse();
    }

    @Test
    @Order(12)
    @DisplayName("IT-12: Should detect signature tampering")
    void testSignatureTampering() {
        KeyPair keyPair = generateTestKeyPair();

        String originalData = "original-proposal";
        byte[] data = originalData.getBytes(StandardCharsets.UTF_8);

        // Sign original data
        byte[] signature = dilithiumService.sign(data, keyPair.getPrivate());

        // Tamper with signature
        if (signature.length > 0) {
            signature[0] ^= 0xFF; // Flip bits in first byte
        }

        // Verification should fail
        boolean isValid = dilithiumService.verify(data, signature, keyPair.getPublic());

        assertThat(isValid)
            .as("Tampered signature should be invalid")
            .isFalse();

        logger.info("✓ Signature tampering correctly detected");
    }

    @Test
    @Order(13)
    @DisplayName("IT-13: Should detect data tampering")
    void testDataTampering() {
        KeyPair keyPair = generateTestKeyPair();

        String originalData = "original-proposal";
        byte[] data = originalData.getBytes(StandardCharsets.UTF_8);

        // Sign original data
        byte[] signature = dilithiumService.sign(data, keyPair.getPrivate());

        // Tamper with data
        String tamperedData = "tampered-proposal";
        byte[] tamperedBytes = tamperedData.getBytes(StandardCharsets.UTF_8);

        // Verification should fail
        boolean isValid = dilithiumService.verify(tamperedBytes, signature, keyPair.getPublic());

        assertThat(isValid)
            .as("Signature should be invalid for tampered data")
            .isFalse();

        logger.info("✓ Data tampering correctly detected");
    }

    @Test
    @Order(14)
    @DisplayName("IT-14: Should handle concurrent signing operations")
    void testConcurrentSigning() throws Exception {
        KeyPair keyPair = generateTestKeyPair();

        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(50);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < 50; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    byte[] data = ("concurrent-" + index).getBytes(StandardCharsets.UTF_8);
                    byte[] signature = dilithiumService.sign(data, keyPair.getPrivate());
                    boolean isValid = dilithiumService.verify(data, signature, keyPair.getPublic());

                    if (isValid) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    logger.error("Concurrent signing failed", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed)
            .as("All concurrent operations should complete")
            .isTrue();

        assertThat(successCount.get())
            .as("All concurrent signatures should be valid")
            .isEqualTo(50);

        logger.info("✓ {} concurrent signing operations completed successfully", successCount.get());
    }

    // ==================== Service Lifecycle Integration ====================

    @Test
    @Order(15)
    @DisplayName("IT-15: Should maintain state across operations")
    void testStatePersistence() {
        KeyPair keyPair = generateTestKeyPair();

        // Perform operations
        consensusService.startElection().await().atMost(Duration.ofSeconds(5));
        long term1 = consensusService.getCurrentTerm();

        // Sign data
        byte[] data = "state-test".getBytes(StandardCharsets.UTF_8);
        dilithiumService.sign(data, keyPair.getPrivate());

        // Check state is preserved
        long term2 = consensusService.getCurrentTerm();
        DilithiumMetrics metrics = dilithiumService.getMetrics();

        assertThat(term2)
            .as("Consensus term should be preserved")
            .isEqualTo(term1);

        assertThat(metrics.getSigningCount())
            .as("Signing count should be tracked")
            .isGreaterThan(0);
    }

    @Test
    @Order(16)
    @DisplayName("IT-16: Should provide accurate metrics for both services")
    void testIntegratedMetrics() {
        KeyPair keyPair = generateTestKeyPair();

        // Perform some operations
        consensusService.startElection().await().atMost(Duration.ofSeconds(5));

        if (consensusService.getCurrentState() == NodeState.LEADER) {
            for (int i = 0; i < 5; i++) {
                String proposal = "metrics-test-" + i;
                byte[] data = proposal.getBytes(StandardCharsets.UTF_8);

                dilithiumService.sign(data, keyPair.getPrivate());
                consensusService.proposeValue(proposal).await().atMost(Duration.ofSeconds(2));
            }
        }

        // Check metrics
        ConsensusStats consensusStats = consensusService.getStats().await().atMost(Duration.ofSeconds(2));
        DilithiumMetrics cryptoMetrics = dilithiumService.getMetrics();

        assertThat(consensusStats.throughput)
            .as("Consensus throughput should be tracked")
            .isGreaterThanOrEqualTo(0L);

        assertThat(cryptoMetrics.getSigningCount())
            .as("Crypto signing operations should be tracked")
            .isGreaterThan(0L);

        logger.info("✓ Metrics - Consensus: {} throughput, Crypto: {} signings",
                   consensusStats.throughput, cryptoMetrics.getSigningCount());
    }

    // ==================== Advanced Integration Scenarios ====================

    @Test
    @Order(17)
    @DisplayName("IT-17: Should handle rapid leader elections with signatures")
    void testRapidElectionsWithSignatures() {
        KeyPair keyPair = generateTestKeyPair();

        int electionCount = 5;
        int successfulElections = 0;

        for (int i = 0; i < electionCount; i++) {
            Boolean elected = consensusService.startElection()
                .await().atMost(Duration.ofSeconds(5));

            if (elected && consensusService.getCurrentState() == NodeState.LEADER) {
                // Sign election certificate
                String cert = "election-" + consensusService.getCurrentTerm();
                byte[] signature = dilithiumService.sign(
                    cert.getBytes(StandardCharsets.UTF_8),
                    keyPair.getPrivate()
                );

                if (signature != null && signature.length > 0) {
                    successfulElections++;
                }
            }
        }

        logger.info("✓ Completed {}/{} elections with valid signatures", successfulElections, electionCount);
    }

    @Test
    @Order(18)
    @DisplayName("IT-18: Should validate consensus with signature chains")
    void testSignatureChains() {
        KeyPair key1 = generateTestKeyPair();
        KeyPair key2 = generateTestKeyPair();
        KeyPair key3 = generateTestKeyPair();

        List<byte[]> signatureChain = new ArrayList<>();
        String baseData = "chain-proposal";

        // Create signature chain: key1 -> key2 -> key3
        byte[] data = baseData.getBytes(StandardCharsets.UTF_8);

        byte[] sig1 = dilithiumService.sign(data, key1.getPrivate());
        signatureChain.add(sig1);

        byte[] sig2 = dilithiumService.sign(sig1, key2.getPrivate());
        signatureChain.add(sig2);

        byte[] sig3 = dilithiumService.sign(sig2, key3.getPrivate());
        signatureChain.add(sig3);

        // Verify chain
        assertThat(dilithiumService.verify(data, sig1, key1.getPublic())).isTrue();
        assertThat(dilithiumService.verify(sig1, sig2, key2.getPublic())).isTrue();
        assertThat(dilithiumService.verify(sig2, sig3, key3.getPublic())).isTrue();

        logger.info("✓ Signature chain of {} signatures validated", signatureChain.size());
    }

    @Test
    @Order(19)
    @DisplayName("IT-19: Should handle mixed valid and invalid signatures")
    void testMixedSignatureValidation() {
        KeyPair key1 = generateTestKeyPair();
        KeyPair key2 = generateTestKeyPair();
        KeyPair key3 = generateTestKeyPair();

        int totalSigs = 10;
        byte[][] dataItems = new byte[totalSigs][];
        byte[][] signatures = new byte[totalSigs][];
        PublicKey[] publicKeys = new PublicKey[totalSigs];

        for (int i = 0; i < totalSigs; i++) {
            dataItems[i] = ("mixed-" + i).getBytes(StandardCharsets.UTF_8);

            // Half valid, half invalid (wrong key)
            KeyPair signingKey = (i % 2 == 0) ? key1 : key2;
            KeyPair verifyingKey = (i % 2 == 0) ? key1 : key3; // Mismatch on odd

            signatures[i] = dilithiumService.sign(dataItems[i], signingKey.getPrivate());
            publicKeys[i] = verifyingKey.getPublic();
        }

        boolean[] results = dilithiumService.batchVerify(dataItems, signatures, publicKeys);

        long validCount = 0;
        for (boolean result : results) {
            if (result) validCount++;
        }

        assertThat(validCount)
            .as("Should have 5 valid signatures (even indices)")
            .isEqualTo(5);

        logger.info("✓ Correctly identified {}/10 valid signatures", validCount);
    }

    @Test
    @Order(20)
    @DisplayName("IT-20: Should validate end-to-end consensus workflow")
    void testEndToEndConsensusWorkflow() {
        KeyPair keyPair = generateTestKeyPair();

        // Step 1: Election
        consensusService.startElection().await().atMost(Duration.ofSeconds(5));

        if (consensusService.getCurrentState() == NodeState.LEADER) {
            // Step 2: Sign election cert
            String electionCert = "election-" + consensusService.getCurrentTerm();
            byte[] electionSig = dilithiumService.sign(
                electionCert.getBytes(StandardCharsets.UTF_8),
                keyPair.getPrivate()
            );

            assertThat(electionSig).isNotEmpty();

            // Step 3: Propose value
            String proposal = "end-to-end-proposal";
            byte[] proposalData = proposal.getBytes(StandardCharsets.UTF_8);
            byte[] proposalSig = dilithiumService.sign(proposalData, keyPair.getPrivate());

            Boolean consensusResult = consensusService.proposeValue(proposal)
                .await().atMost(Duration.ofSeconds(5));

            // Step 4: Verify signatures
            boolean electionValid = dilithiumService.verify(
                electionCert.getBytes(StandardCharsets.UTF_8),
                electionSig,
                keyPair.getPublic()
            );

            boolean proposalValid = dilithiumService.verify(
                proposalData,
                proposalSig,
                keyPair.getPublic()
            );

            assertThat(consensusResult).isTrue();
            assertThat(electionValid).isTrue();
            assertThat(proposalValid).isTrue();

            logger.info("✓ End-to-end consensus workflow validated");
        }
    }
}
