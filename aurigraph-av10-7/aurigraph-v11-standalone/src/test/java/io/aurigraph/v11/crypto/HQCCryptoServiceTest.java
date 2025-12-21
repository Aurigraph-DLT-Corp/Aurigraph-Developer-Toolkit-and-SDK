package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HQCCryptoService
 *
 * Tests HQC (Hamming Quasi-Cyclic) cryptography operations:
 * - Key generation
 * - Key encapsulation
 * - Key decapsulation
 * - Algorithm switching
 * - Status and metrics
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 */
@QuarkusTest
@TestMethodOrder(OrderAnnotation.class)
class HQCCryptoServiceTest {

    @Inject
    HQCCryptoService hqcService;

    private static String generatedKeyId;

    @Test
    @Order(1)
    @DisplayName("HQC service should be available")
    void testServiceAvailable() {
        assertTrue(hqcService.isHQCAvailable());

        HQCCryptoService.HQCServiceStatus status = hqcService.getStatus();
        assertTrue(status.enabled());
    }

    @Test
    @Order(2)
    @DisplayName("Should generate HQC key pair")
    void testKeyPairGeneration() {
        generatedKeyId = "test-key-" + UUID.randomUUID();

        HQCCryptoService.HQCKeyGenerationResult result = hqcService.generateKeyPair(generatedKeyId);

        assertTrue(result.success());
        assertEquals(generatedKeyId, result.keyId());
        assertNotNull(result.publicKey());
        assertNotNull(result.privateKey());
        assertTrue(result.publicKeySize() > 0);
        assertTrue(result.privateKeySize() > 0);
        assertTrue(result.latencyMs() >= 0);
        assertEquals("SUCCESS", result.status());
    }

    @Test
    @Order(3)
    @DisplayName("Should encapsulate shared secret")
    void testEncapsulation() {
        // Use the key generated in previous test
        if (generatedKeyId == null) {
            generatedKeyId = "test-key-encap-" + UUID.randomUUID();
            hqcService.generateKeyPair(generatedKeyId);
        }

        HQCCryptoService.HQCEncapsulationResult result = hqcService.encapsulate(generatedKeyId);

        assertTrue(result.success());
        assertNotNull(result.ciphertext());
        assertNotNull(result.sharedSecret());
        assertTrue(result.latencyMs() >= 0);
        assertEquals("SUCCESS", result.status());
    }

    @Test
    @Order(4)
    @DisplayName("Should decapsulate to recover shared secret")
    void testDecapsulation() {
        // Generate key and encapsulate
        String keyId = "test-key-decap-" + UUID.randomUUID();
        hqcService.generateKeyPair(keyId);

        HQCCryptoService.HQCEncapsulationResult encapResult = hqcService.encapsulate(keyId);
        assertTrue(encapResult.success());

        // Decapsulate
        HQCCryptoService.HQCDecapsulationResult decapResult =
            hqcService.decapsulate(keyId, encapResult.ciphertext());

        assertTrue(decapResult.success());
        assertNotNull(decapResult.sharedSecret());
        assertEquals("SUCCESS", decapResult.status());
    }

    @Test
    @Order(5)
    @DisplayName("Encapsulation and decapsulation should produce same shared secret")
    void testSharedSecretConsistency() {
        String keyId = "test-key-consistency-" + UUID.randomUUID();
        hqcService.generateKeyPair(keyId);

        HQCCryptoService.HQCEncapsulationResult encapResult = hqcService.encapsulate(keyId);
        HQCCryptoService.HQCDecapsulationResult decapResult =
            hqcService.decapsulate(keyId, encapResult.ciphertext());

        // Both operations should succeed
        assertTrue(encapResult.success());
        assertTrue(decapResult.success());

        // Shared secrets should match
        assertEquals(encapResult.sharedSecret(), decapResult.sharedSecret());
    }

    @Test
    @Order(6)
    @DisplayName("Should fail encapsulation for non-existent key")
    void testEncapsulationNonExistentKey() {
        HQCCryptoService.HQCEncapsulationResult result =
            hqcService.encapsulate("non-existent-key-12345");

        assertFalse(result.success());
        assertNull(result.ciphertext());
        assertTrue(result.status().contains("Key not found"));
    }

    @Test
    @Order(7)
    @DisplayName("Should fail decapsulation for non-existent key")
    void testDecapsulationNonExistentKey() {
        HQCCryptoService.HQCDecapsulationResult result =
            hqcService.decapsulate("non-existent-key-67890", "someBase64Ciphertext==");

        assertFalse(result.success());
        assertNull(result.sharedSecret());
        assertTrue(result.status().contains("Key not found"));
    }

    @Test
    @Order(8)
    @DisplayName("Current algorithm should be ML-KEM by default")
    void testDefaultAlgorithm() {
        String algorithm = hqcService.getCurrentAlgorithm();
        assertEquals("ML-KEM", algorithm);
    }

    @Test
    @Order(9)
    @DisplayName("Should switch to HQC algorithm")
    void testSwitchToHQC() {
        boolean switched = hqcService.switchAlgorithm("HQC");

        assertTrue(switched);
        assertEquals("HQC", hqcService.getCurrentAlgorithm());

        // Switch back
        hqcService.switchAlgorithm("ML-KEM");
    }

    @Test
    @Order(10)
    @DisplayName("Should switch back to ML-KEM algorithm")
    void testSwitchToMLKEM() {
        hqcService.switchAlgorithm("HQC"); // First switch to HQC
        boolean switched = hqcService.switchAlgorithm("ML-KEM");

        assertTrue(switched);
        assertEquals("ML-KEM", hqcService.getCurrentAlgorithm());
    }

    @Test
    @Order(11)
    @DisplayName("Should reject invalid algorithm selection")
    void testInvalidAlgorithmSelection() {
        boolean switched = hqcService.switchAlgorithm("INVALID_ALGO");

        assertFalse(switched);
        // Algorithm should remain unchanged
        assertNotEquals("INVALID_ALGO", hqcService.getCurrentAlgorithm());
    }

    @Test
    @Order(12)
    @DisplayName("Service status should contain metrics")
    void testServiceStatusMetrics() {
        // Generate some keys to create metrics
        for (int i = 0; i < 3; i++) {
            hqcService.generateKeyPair("metrics-key-" + i);
        }

        HQCCryptoService.HQCServiceStatus status = hqcService.getStatus();

        assertTrue(status.enabled());
        assertTrue(status.keyGenerations() >= 3);
        assertTrue(status.storedKeys() >= 3);
        assertTrue(status.totalOperations() > 0);
    }

    @Test
    @Order(13)
    @DisplayName("Supported algorithms should be listed")
    void testSupportedAlgorithms() {
        HQCCryptoService.SupportedAlgorithms algorithms = hqcService.getSupportedAlgorithms();

        assertNotNull(algorithms);
        assertNotNull(algorithms.algorithms());
        assertFalse(algorithms.algorithms().isEmpty());

        // Should include ML-KEM
        assertTrue(algorithms.algorithms().stream()
            .anyMatch(a -> "ML-KEM".equals(a.name())));

        // Should include HQC
        assertTrue(algorithms.algorithms().stream()
            .anyMatch(a -> "HQC".equals(a.name())));

        assertNotNull(algorithms.currentSelection());
    }

    @Test
    @Order(14)
    @DisplayName("Key generation should update stored keys count")
    void testStoredKeysCount() {
        HQCCryptoService.HQCServiceStatus before = hqcService.getStatus();
        int beforeCount = before.storedKeys();

        hqcService.generateKeyPair("count-test-key-" + UUID.randomUUID());

        HQCCryptoService.HQCServiceStatus after = hqcService.getStatus();
        assertEquals(beforeCount + 1, after.storedKeys());
    }

    @Test
    @Order(15)
    @DisplayName("Key generation result should include latency")
    void testKeyGenerationLatency() {
        HQCCryptoService.HQCKeyGenerationResult result =
            hqcService.generateKeyPair("latency-test-" + UUID.randomUUID());

        assertTrue(result.success());
        assertTrue(result.latencyMs() >= 0);
    }

    @Test
    @Order(16)
    @DisplayName("Encapsulation result should include latency")
    void testEncapsulationLatency() {
        String keyId = "encap-latency-" + UUID.randomUUID();
        hqcService.generateKeyPair(keyId);

        HQCCryptoService.HQCEncapsulationResult result = hqcService.encapsulate(keyId);

        assertTrue(result.success());
        assertTrue(result.latencyMs() >= 0);
    }

    @Test
    @Order(17)
    @DisplayName("Decapsulation result should include latency")
    void testDecapsulationLatency() {
        String keyId = "decap-latency-" + UUID.randomUUID();
        hqcService.generateKeyPair(keyId);

        HQCCryptoService.HQCEncapsulationResult encap = hqcService.encapsulate(keyId);
        HQCCryptoService.HQCDecapsulationResult decap = hqcService.decapsulate(keyId, encap.ciphertext());

        assertTrue(decap.success());
        assertTrue(decap.latencyMs() >= 0);
    }

    @Test
    @Order(18)
    @DisplayName("Generated public key should have expected size")
    void testPublicKeySize() {
        HQCCryptoService.HQCKeyGenerationResult result =
            hqcService.generateKeyPair("size-test-" + UUID.randomUUID());

        assertTrue(result.success());
        // HQC-256 public key is approximately 7245 bytes
        assertTrue(result.publicKeySize() > 2000); // At minimum HQC-128 size
    }

    @Test
    @Order(19)
    @DisplayName("Generated private key should have expected size")
    void testPrivateKeySize() {
        HQCCryptoService.HQCKeyGenerationResult result =
            hqcService.generateKeyPair("priv-size-test-" + UUID.randomUUID());

        assertTrue(result.success());
        // HQC-256 private key is approximately 7317 bytes
        assertTrue(result.privateKeySize() > 2000); // At minimum HQC-128 size
    }

    @Test
    @Order(20)
    @DisplayName("Algorithm info should have correct structure")
    void testAlgorithmInfo() {
        HQCCryptoService.SupportedAlgorithms algorithms = hqcService.getSupportedAlgorithms();

        for (HQCCryptoService.AlgorithmInfo algo : algorithms.algorithms()) {
            assertNotNull(algo.name());
            assertNotNull(algo.variant());
            assertNotNull(algo.description());
            // enabled and available are booleans, always have values
        }
    }

    @Test
    @Order(21)
    @DisplayName("Multiple key pairs should be independently usable")
    void testMultipleKeyPairs() {
        String keyId1 = "multi-1-" + UUID.randomUUID();
        String keyId2 = "multi-2-" + UUID.randomUUID();

        hqcService.generateKeyPair(keyId1);
        hqcService.generateKeyPair(keyId2);

        // Encapsulate with each key
        HQCCryptoService.HQCEncapsulationResult encap1 = hqcService.encapsulate(keyId1);
        HQCCryptoService.HQCEncapsulationResult encap2 = hqcService.encapsulate(keyId2);

        assertTrue(encap1.success());
        assertTrue(encap2.success());

        // Shared secrets should be different
        assertNotEquals(encap1.sharedSecret(), encap2.sharedSecret());

        // Decapsulation should work independently
        HQCCryptoService.HQCDecapsulationResult decap1 = hqcService.decapsulate(keyId1, encap1.ciphertext());
        HQCCryptoService.HQCDecapsulationResult decap2 = hqcService.decapsulate(keyId2, encap2.ciphertext());

        assertTrue(decap1.success());
        assertTrue(decap2.success());
        assertEquals(encap1.sharedSecret(), decap1.sharedSecret());
        assertEquals(encap2.sharedSecret(), decap2.sharedSecret());
    }
}
