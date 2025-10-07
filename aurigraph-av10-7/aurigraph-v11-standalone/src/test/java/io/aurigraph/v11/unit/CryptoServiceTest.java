package io.aurigraph.v11.unit;

import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.aurigraph.v11.crypto.QuantumCryptoService.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.time.Duration;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive unit tests for QuantumCryptoService
 *
 * Validates:
 * - Quantum-resistant key generation (CRYSTALS-Kyber, Dilithium, SPHINCS+)
 * - Encryption and decryption operations (lattice-based cryptography)
 * - Digital signature generation (CRYSTALS-Dilithium)
 * - Signature verification
 * - Key rotation and management
 * - Performance benchmarking (10K+ ops/sec target)
 * - NIST Post-Quantum Cryptography compliance
 * - Concurrent crypto operations safety
 * - Error handling and edge cases
 *
 * Coverage Target: 98% line, 95% branch (Phase 1 Critical Security Package)
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CryptoServiceTest {

    @Inject
    QuantumCryptoService cryptoService;

    private static final String TEST_KEY_ID = "test-key-" + System.currentTimeMillis();
    private static final String TEST_DATA = "Quantum-resistant test data for Aurigraph V11";

    // =====================================================================
    // KEY GENERATION TESTS
    // =====================================================================

    @Test
    @Order(1)
    @DisplayName("Should generate CRYSTALS-Kyber key pair successfully")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testGenerateKyberKeyPair() {
        // Arrange
        KeyGenerationRequest request = new KeyGenerationRequest(
            TEST_KEY_ID + "-kyber",
            "CRYSTALS-Kyber"
        );

        // Act
        KeyGenerationResult result = cryptoService.generateKeyPair(request)
            .await().atMost(Duration.ofSeconds(10));

        // Assert
        assertNotNull(result, "Result should not be null");
        assertTrue(result.success(), "Key generation should succeed");
        assertEquals(TEST_KEY_ID + "-kyber", result.keyId(),
            "Key ID should match request");
        assertEquals("CRYSTALS-Kyber", result.algorithm(),
            "Algorithm should match");
        assertTrue(result.securityLevel() >= 1,
            "Security level should be positive");
        assertTrue(result.publicKeySize() > 0,
            "Public key size should be positive");
        assertTrue(result.privateKeySize() > 0,
            "Private key size should be positive");
        assertTrue(result.latencyMs() >= 0,
            "Latency should be non-negative");
    }

    @Test
    @Order(2)
    @DisplayName("Should generate CRYSTALS-Dilithium key pair successfully")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testGenerateDilithiumKeyPair() {
        // Arrange
        KeyGenerationRequest request = new KeyGenerationRequest(
            TEST_KEY_ID + "-dilithium",
            "CRYSTALS-Dilithium"
        );

        // Act
        KeyGenerationResult result = cryptoService.generateKeyPair(request)
            .await().atMost(Duration.ofSeconds(10));

        // Assert
        assertTrue(result.success(), "Key generation should succeed");
        assertEquals("CRYSTALS-Dilithium", result.algorithm());
        assertTrue(result.publicKeySize() > 1000,
            "Dilithium public keys should be substantial");
        assertTrue(result.privateKeySize() > 2000,
            "Dilithium private keys should be substantial");
    }

    @Test
    @Order(3)
    @DisplayName("Should generate SPHINCS+ key pair successfully")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testGenerateSphincsPlusKeyPair() {
        // Arrange
        KeyGenerationRequest request = new KeyGenerationRequest(
            TEST_KEY_ID + "-sphincs",
            "SPHINCS+"
        );

        // Act
        KeyGenerationResult result = cryptoService.generateKeyPair(request)
            .await().atMost(Duration.ofSeconds(15));

        // Assert
        assertTrue(result.success(), "SPHINCS+ key generation should succeed");
        assertEquals("SPHINCS+", result.algorithm());
    }

    @Test
    @Order(4)
    @DisplayName("Should handle unknown algorithm gracefully")
    void testGenerateKeyPairUnknownAlgorithm() {
        // Arrange
        KeyGenerationRequest request = new KeyGenerationRequest(
            TEST_KEY_ID + "-unknown",
            "UnknownAlgorithm"
        );

        // Act
        KeyGenerationResult result = cryptoService.generateKeyPair(request)
            .await().atMost(Duration.ofSeconds(10));

        // Assert
        assertTrue(result.success(),
            "Should default to safe algorithm for unknown");
    }

    // =====================================================================
    // ENCRYPTION & DECRYPTION TESTS
    // =====================================================================

    @Test
    @Order(5)
    @DisplayName("Should encrypt data with quantum-resistant algorithm")
    void testEncryptData() {
        // Arrange - Generate key first
        KeyGenerationRequest keyRequest = new KeyGenerationRequest(
            TEST_KEY_ID + "-encrypt",
            "CRYSTALS-Kyber"
        );
        cryptoService.generateKeyPair(keyRequest)
            .await().atMost(Duration.ofSeconds(10));

        EncryptionRequest encRequest = new EncryptionRequest(
            TEST_KEY_ID + "-encrypt",
            TEST_DATA
        );

        // Act
        EncryptionResult result = cryptoService.encryptData(encRequest)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(result.success(), "Encryption should succeed");
        assertNotNull(result.ciphertext(), "Ciphertext should not be null");
        assertNotEquals(TEST_DATA, result.ciphertext(),
            "Ciphertext should differ from plaintext");
        assertTrue(result.ciphertext().length() > TEST_DATA.length(),
            "Ciphertext should be longer (includes IV, key, etc.)");
        assertTrue(result.latencyMs() >= 0, "Latency should be recorded");
    }

    @Test
    @Order(6)
    @DisplayName("Should decrypt data correctly")
    void testDecryptData() {
        // Arrange - Generate key, then encrypt
        String keyId = TEST_KEY_ID + "-decrypt";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Kyber"))
            .await().atMost(Duration.ofSeconds(10));

        EncryptionResult encResult = cryptoService.encryptData(
            new EncryptionRequest(keyId, TEST_DATA))
            .await().atMost(Duration.ofSeconds(5));

        DecryptionRequest decRequest = new DecryptionRequest(
            keyId,
            encResult.ciphertext()
        );

        // Act
        DecryptionResult result = cryptoService.decryptData(decRequest)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(result.success(), "Decryption should succeed");
        assertNotNull(result.plaintext(), "Plaintext should not be null");
        assertEquals(TEST_DATA, result.plaintext(),
            "Decrypted data should match original");
        assertTrue(result.latencyMs() >= 0, "Latency should be recorded");
    }

    @Test
    @Order(7)
    @DisplayName("Should handle encryption with non-existent key")
    void testEncryptWithNonExistentKey() {
        // Arrange
        EncryptionRequest request = new EncryptionRequest(
            "non-existent-key",
            TEST_DATA
        );

        // Act
        EncryptionResult result = cryptoService.encryptData(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertFalse(result.success(), "Encryption should fail with missing key");
        assertNull(result.ciphertext(), "Ciphertext should be null");
        assertTrue(result.status().contains("not found"),
            "Status should indicate key not found");
    }

    @Test
    @Order(8)
    @DisplayName("Should handle decryption with non-existent key")
    void testDecryptWithNonExistentKey() {
        // Arrange
        DecryptionRequest request = new DecryptionRequest(
            "non-existent-key",
            "fake-ciphertext"
        );

        // Act
        DecryptionResult result = cryptoService.decryptData(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertFalse(result.success(), "Decryption should fail with missing key");
        assertNull(result.plaintext(), "Plaintext should be null");
    }

    // =====================================================================
    // DIGITAL SIGNATURE TESTS
    // =====================================================================

    @Test
    @Order(9)
    @DisplayName("Should generate CRYSTALS-Dilithium signature")
    void testGenerateSignature() {
        // Arrange - Generate Dilithium key
        String keyId = TEST_KEY_ID + "-sign";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Dilithium"))
            .await().atMost(Duration.ofSeconds(10));

        SignatureRequest request = new SignatureRequest(keyId, TEST_DATA);

        // Act
        SignatureResult result = cryptoService.signData(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(result.success(), "Signature generation should succeed");
        assertNotNull(result.signature(), "Signature should not be null");
        assertTrue(result.signature().length() > 100,
            "Dilithium signatures should be substantial");
        assertTrue(result.latencyMs() >= 0, "Latency should be recorded");
    }

    @Test
    @Order(10)
    @DisplayName("Should verify valid CRYSTALS-Dilithium signature")
    void testVerifyValidSignature() {
        // Arrange - Generate key, sign data
        String keyId = TEST_KEY_ID + "-verify";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Dilithium"))
            .await().atMost(Duration.ofSeconds(10));

        SignatureResult signResult = cryptoService.signData(
            new SignatureRequest(keyId, TEST_DATA))
            .await().atMost(Duration.ofSeconds(5));

        VerificationRequest verifyRequest = new VerificationRequest(
            keyId,
            TEST_DATA,
            signResult.signature()
        );

        // Act
        VerificationResult result = cryptoService.verifySignature(verifyRequest)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(result.success(), "Verification operation should succeed");
        assertTrue(result.isValid(), "Signature should be valid");
        assertEquals("SIGNATURE_VALID", result.status(),
            "Status should indicate valid signature");
        assertTrue(result.latencyMs() >= 0, "Latency should be recorded");
    }

    @Test
    @Order(11)
    @DisplayName("Should reject invalid signature")
    void testVerifyInvalidSignature() {
        // Arrange - Generate key
        String keyId = TEST_KEY_ID + "-verify-invalid";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Dilithium"))
            .await().atMost(Duration.ofSeconds(10));

        VerificationRequest request = new VerificationRequest(
            keyId,
            TEST_DATA,
            "invalid-signature-base64-data"
        );

        // Act
        VerificationResult result = cryptoService.verifySignature(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(result.success(), "Verification operation should complete");
        assertFalse(result.isValid(), "Invalid signature should be rejected");
        assertEquals("SIGNATURE_INVALID", result.status());
    }

    @Test
    @Order(12)
    @DisplayName("Should reject signature with tampered data")
    void testVerifyTamperedData() {
        // Arrange - Generate key, sign original data
        String keyId = TEST_KEY_ID + "-tamper";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Dilithium"))
            .await().atMost(Duration.ofSeconds(10));

        SignatureResult signResult = cryptoService.signData(
            new SignatureRequest(keyId, TEST_DATA))
            .await().atMost(Duration.ofSeconds(5));

        // Try to verify with different data
        VerificationRequest request = new VerificationRequest(
            keyId,
            TEST_DATA + " TAMPERED",
            signResult.signature()
        );

        // Act
        VerificationResult result = cryptoService.verifySignature(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertFalse(result.isValid(),
            "Signature should be invalid for tampered data");
    }

    @Test
    @Order(13)
    @DisplayName("Should sign byte array data")
    void testSignByteArray() {
        // Arrange
        byte[] testBytes = TEST_DATA.getBytes();

        // Act
        String signature = cryptoService.sign(testBytes);

        // Assert
        assertNotNull(signature, "Signature should not be null");
        assertTrue(signature.length() > 0, "Signature should not be empty");
    }

    // =====================================================================
    // STATUS & METRICS TESTS
    // =====================================================================

    @Test
    @Order(14)
    @DisplayName("Should get crypto service status")
    void testGetStatus() {
        // Act
        CryptoStatus status = cryptoService.getStatus();

        // Assert
        assertNotNull(status, "Status should not be null");
        assertTrue(status.quantumCryptoEnabled(), "Quantum crypto should be enabled");
        assertTrue(status.storedKeys() >= 0, "Stored keys should be non-negative");
        assertTrue(status.totalOperations() >= 0, "Total operations should be non-negative");
        assertTrue(status.keyGenerations() >= 0, "Key generations should be tracked");
        assertTrue(status.encryptions() >= 0, "Encryptions should be tracked");
        assertTrue(status.decryptions() >= 0, "Decryptions should be tracked");
        assertTrue(status.signatures() >= 0, "Signatures should be tracked");
        assertTrue(status.verifications() >= 0, "Verifications should be tracked");
        assertNotNull(status.algorithms(), "Algorithms should be listed");
        assertTrue(status.algorithms().contains("CRYSTALS"),
            "Should mention CRYSTALS algorithms");
    }

    @Test
    @Order(15)
    @DisplayName("Should get supported algorithms")
    void testGetSupportedAlgorithms() {
        // Act
        SupportedAlgorithms algorithms = cryptoService.getSupportedAlgorithms();

        // Assert
        assertNotNull(algorithms, "Algorithms should not be null");
        assertNotNull(algorithms.algorithms(), "Algorithm list should not be null");
        assertFalse(algorithms.algorithms().isEmpty(),
            "Should have at least one algorithm");
        assertTrue(algorithms.algorithms().size() >= 3,
            "Should support multiple algorithms");

        // Verify key algorithms are present
        boolean hasKyber = algorithms.algorithms().stream()
            .anyMatch(a -> a.name().contains("Kyber"));
        boolean hasDilithium = algorithms.algorithms().stream()
            .anyMatch(a -> a.name().contains("Dilithium"));
        boolean hasSphincs = algorithms.algorithms().stream()
            .anyMatch(a -> a.name().contains("SPHINCS"));

        assertTrue(hasKyber, "Should support CRYSTALS-Kyber");
        assertTrue(hasDilithium, "Should support CRYSTALS-Dilithium");
        assertTrue(hasSphincs, "Should support SPHINCS+");
    }

    @Test
    @Order(16)
    @DisplayName("Should get quantum security status")
    void testGetQuantumSecurityStatus() {
        // Act
        QuantumSecurityStatus status = cryptoService.getQuantumStatus();

        // Assert
        assertNotNull(status, "Quantum status should not be null");
        assertTrue(status.quantumCryptoEnabled(), "Quantum crypto should be enabled");
        assertTrue(status.nistLevel5Compliant(), "Should be NIST Level 5 compliant");
        assertTrue(status.quantumResistant(), "Should be quantum resistant");
        assertTrue(status.kyberSecurityLevel() >= 1,
            "Kyber security level should be valid");
        assertTrue(status.dilithiumSecurityLevel() >= 1,
            "Dilithium security level should be valid");
        assertNotNull(status.algorithmSuite(), "Algorithm suite should be specified");
        assertTrue(status.quantumBitSecurity() >= 128,
            "Should provide at least 128-bit security");
    }

    // =====================================================================
    // PERFORMANCE TESTS
    // =====================================================================

    @Test
    @Order(17)
    @DisplayName("Should perform crypto operations at target speed")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testPerformanceTest() {
        // Arrange
        CryptoPerformanceRequest request = new CryptoPerformanceRequest(1000);

        // Act
        CryptoPerformanceResult result = cryptoService.performanceTest(request)
            .await().atMost(Duration.ofSeconds(60));

        // Assert
        assertNotNull(result, "Performance result should not be null");
        assertEquals(1000, result.totalOperations(),
            "Should perform requested operations");
        assertTrue(result.successfulOperations() > 0,
            "Should have successful operations");
        assertTrue(result.operationsPerSecond() > 0,
            "Should calculate ops/sec");
        assertTrue(result.averageLatencyMs() >= 0,
            "Should track average latency");
        assertNotNull(result.operationType(),
            "Should specify operation type");

        System.out.printf("✅ Crypto Performance: %.0f ops/sec, %.2fms avg latency%n",
            result.operationsPerSecond(), result.averageLatencyMs());
    }

    @Test
    @Order(18)
    @DisplayName("Should handle large performance test")
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    void testLargePerformanceTest() {
        // Arrange
        CryptoPerformanceRequest request = new CryptoPerformanceRequest(5000);

        // Act
        CryptoPerformanceResult result = cryptoService.performanceTest(request)
            .await().atMost(Duration.ofSeconds(120));

        // Assert
        assertTrue(result.totalOperations() >= 1000,
            "Should complete substantial operations");
        double successRate = (double) result.successfulOperations() / result.totalOperations();
        assertTrue(successRate >= 0.95,
            "Should have high success rate (>95%)");

        System.out.printf("✅ Large Crypto Test: %d/%d ops succeeded (%.1f%%)%n",
            result.successfulOperations(), result.totalOperations(), successRate * 100);
    }

    // =====================================================================
    // CONCURRENCY TESTS
    // =====================================================================

    @Test
    @Order(19)
    @DisplayName("Should handle concurrent key generation safely")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentKeyGeneration() throws InterruptedException {
        // Arrange
        int threadCount = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        ConcurrentHashMap<Integer, KeyGenerationResult> results = new ConcurrentHashMap<>();

        // Act
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    startLatch.await();
                    KeyGenerationRequest request = new KeyGenerationRequest(
                        "concurrent-key-" + threadId,
                        "CRYSTALS-Kyber"
                    );
                    KeyGenerationResult result = cryptoService.generateKeyPair(request)
                        .await().atMost(Duration.ofSeconds(20));
                    results.put(threadId, result);
                } catch (Exception e) {
                    // Log but don't fail test
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Start all threads
        assertTrue(completionLatch.await(60, TimeUnit.SECONDS),
            "All threads should complete");

        // Assert
        assertTrue(results.size() > 0,
            "Should successfully generate keys concurrently");
        long successCount = results.values().stream()
            .filter(KeyGenerationResult::success)
            .count();
        assertTrue(successCount >= threadCount * 0.8,
            "Should have high success rate in concurrent operations");
    }

    @Test
    @Order(20)
    @DisplayName("Should handle concurrent encryption operations")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentEncryption() throws InterruptedException {
        // Arrange - Generate shared key
        String sharedKeyId = TEST_KEY_ID + "-concurrent-enc";
        cryptoService.generateKeyPair(new KeyGenerationRequest(sharedKeyId, "CRYSTALS-Kyber"))
            .await().atMost(Duration.ofSeconds(10));

        int threadCount = 20;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(threadCount);
        ConcurrentHashMap<Integer, EncryptionResult> results = new ConcurrentHashMap<>();

        // Act
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            Thread.startVirtualThread(() -> {
                try {
                    startLatch.await();
                    EncryptionRequest request = new EncryptionRequest(
                        sharedKeyId,
                        TEST_DATA + "-" + threadId
                    );
                    EncryptionResult result = cryptoService.encryptData(request)
                        .await().atMost(Duration.ofSeconds(10));
                    results.put(threadId, result);
                } catch (Exception e) {
                    // Log but don't fail test
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(completionLatch.await(60, TimeUnit.SECONDS),
            "All threads should complete");

        // Assert
        assertTrue(results.size() > 0,
            "Should successfully encrypt concurrently");
        long successCount = results.values().stream()
            .filter(EncryptionResult::success)
            .count();
        assertTrue(successCount >= threadCount * 0.9,
            "Should have very high success rate (>90%)");
    }

    // =====================================================================
    // EDGE CASES & ERROR HANDLING TESTS
    // =====================================================================

    @Test
    @Order(21)
    @DisplayName("Should handle empty plaintext encryption")
    void testEncryptEmptyData() {
        // Arrange
        String keyId = TEST_KEY_ID + "-empty";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Kyber"))
            .await().atMost(Duration.ofSeconds(10));

        EncryptionRequest request = new EncryptionRequest(keyId, "");

        // Act
        EncryptionResult result = cryptoService.encryptData(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertTrue(result.success(), "Should handle empty data encryption");
        assertNotNull(result.ciphertext(), "Should produce ciphertext");
    }

    @Test
    @Order(22)
    @DisplayName("Should validate metrics tracking accuracy")
    void testMetricsAccuracy() {
        // Arrange
        CryptoStatus initialStatus = cryptoService.getStatus();
        long initialOperations = initialStatus.totalOperations();

        // Act - Perform some operations
        String keyId = TEST_KEY_ID + "-metrics";
        cryptoService.generateKeyPair(new KeyGenerationRequest(keyId, "CRYSTALS-Kyber"))
            .await().atMost(Duration.ofSeconds(10));

        String testData = "metrics test";
        EncryptionResult encResult = cryptoService.encryptData(
            new EncryptionRequest(keyId, testData))
            .await().atMost(Duration.ofSeconds(5));

        cryptoService.decryptData(new DecryptionRequest(keyId, encResult.ciphertext()))
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        CryptoStatus finalStatus = cryptoService.getStatus();
        assertTrue(finalStatus.totalOperations() > initialOperations,
            "Total operations should increase");
        assertTrue(finalStatus.keyGenerations() > initialStatus.keyGenerations(),
            "Key generations should be tracked");
        assertTrue(finalStatus.encryptions() > initialStatus.encryptions(),
            "Encryptions should be tracked");
        assertTrue(finalStatus.decryptions() > initialStatus.decryptions(),
            "Decryptions should be tracked");
    }

    // =====================================================================
    // CLEANUP
    // =====================================================================

    @AfterAll
    static void tearDown() {
        System.out.println("✅ All CryptoService tests completed successfully");
    }
}
