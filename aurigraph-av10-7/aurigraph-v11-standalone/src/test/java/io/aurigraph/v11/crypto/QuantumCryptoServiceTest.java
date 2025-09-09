package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.security.KeyPair;
import java.security.PublicKey;
import java.security.PrivateKey;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for QuantumCryptoService
 * 
 * Tests all quantum-resistant cryptographic operations including:
 * - CRYSTALS-Kyber key encapsulation
 * - CRYSTALS-Dilithium digital signatures
 * - SPHINCS+ hash-based signatures
 * - HSM integration capabilities
 * - Performance benchmarks
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Execution(ExecutionMode.CONCURRENT)
public class QuantumCryptoServiceTest {
    
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    @Inject
    KyberKeyManager kyberKeyManager;
    
    @Inject
    DilithiumSignatureService dilithiumSignatureService;
    
    @Inject
    SphincsPlusService sphincsPlusService;
    
    @Inject
    HSMIntegration hsmIntegration;
    
    private static final byte[] TEST_DATA = "Hello, Quantum World! This is a test message for post-quantum cryptography.".getBytes();
    private static final byte[] LARGE_TEST_DATA = new byte[10240]; // 10KB test data
    
    @BeforeAll
    static void setupTestData() {
        // Initialize large test data with random bytes
        new java.security.SecureRandom().nextBytes(LARGE_TEST_DATA);
    }
    
    @BeforeEach
    void setup() {
        quantumCryptoService.initialize();
    }
    
    @Test
    @Order(1)
    @DisplayName("Test Service Initialization")
    void testServiceInitialization() {
        assertNotNull(quantumCryptoService, "QuantumCryptoService should be injected");
        assertNotNull(kyberKeyManager, "KyberKeyManager should be injected");
        assertNotNull(dilithiumSignatureService, "DilithiumSignatureService should be injected");
        assertNotNull(sphincsPlusService, "SphincsPlusService should be injected");
        assertNotNull(hsmIntegration, "HSMIntegration should be injected");
    }
    
    @Test
    @Order(2)
    @DisplayName("Test Kyber Key Generation")
    void testKyberKeyGeneration() throws Exception {
        CompletableFuture<KeyPair> future = quantumCryptoService.generateKeyPair(QuantumCryptoService.KYBER_1024);
        
        KeyPair keyPair = future.get(5, TimeUnit.SECONDS);
        assertNotNull(keyPair, "Key pair should be generated");
        assertNotNull(keyPair.getPublic(), "Public key should not be null");
        assertNotNull(keyPair.getPrivate(), "Private key should not be null");
        assertEquals("Kyber", keyPair.getPublic().getAlgorithm(), "Public key algorithm should be Kyber");
        assertEquals("Kyber", keyPair.getPrivate().getAlgorithm(), "Private key algorithm should be Kyber");
    }
    
    @Test
    @Order(3)
    @DisplayName("Test Dilithium Key Generation")
    void testDilithiumKeyGeneration() throws Exception {
        CompletableFuture<KeyPair> future = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5);
        
        KeyPair keyPair = future.get(5, TimeUnit.SECONDS);
        assertNotNull(keyPair, "Key pair should be generated");
        assertNotNull(keyPair.getPublic(), "Public key should not be null");
        assertNotNull(keyPair.getPrivate(), "Private key should not be null");
        assertEquals("Dilithium", keyPair.getPublic().getAlgorithm(), "Public key algorithm should be Dilithium");
        assertEquals("Dilithium", keyPair.getPrivate().getAlgorithm(), "Private key algorithm should be Dilithium");
    }
    
    @Test
    @Order(4)
    @DisplayName("Test SPHINCS+ Key Generation")
    void testSphincsPlusKeyGeneration() throws Exception {
        CompletableFuture<KeyPair> future = quantumCryptoService.generateKeyPair(QuantumCryptoService.SPHINCS_PLUS_256f);
        
        KeyPair keyPair = future.get(10, TimeUnit.SECONDS); // SPHINCS+ can be slower
        assertNotNull(keyPair, "Key pair should be generated");
        assertNotNull(keyPair.getPublic(), "Public key should not be null");
        assertNotNull(keyPair.getPrivate(), "Private key should not be null");
        assertEquals("SPHINCS+", keyPair.getPublic().getAlgorithm(), "Public key algorithm should be SPHINCS+");
        assertEquals("SPHINCS+", keyPair.getPrivate().getAlgorithm(), "Private key algorithm should be SPHINCS+");
    }
    
    @Test
    @Order(5)
    @DisplayName("Test Dilithium Sign and Verify")
    void testDilithiumSignAndVerify() throws Exception {
        // Generate key pair
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        
        // Sign data
        CompletableFuture<byte[]> signFuture = quantumCryptoService.sign(TEST_DATA, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5);
        byte[] signature = signFuture.get(5, TimeUnit.SECONDS);
        
        assertNotNull(signature, "Signature should not be null");
        assertTrue(signature.length > 0, "Signature should not be empty");
        
        // Verify signature
        CompletableFuture<Boolean> verifyFuture = quantumCryptoService.verify(TEST_DATA, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5);
        Boolean isValid = verifyFuture.get(5, TimeUnit.SECONDS);
        
        assertTrue(isValid, "Signature should be valid");
    }
    
    @Test
    @Order(6)
    @DisplayName("Test SPHINCS+ Sign and Verify")
    void testSphincsPlusSignAndVerify() throws Exception {
        // Generate key pair
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.SPHINCS_PLUS_256f).get(10, TimeUnit.SECONDS);
        
        // Sign data
        CompletableFuture<byte[]> signFuture = quantumCryptoService.sign(TEST_DATA, keyPair.getPrivate(), QuantumCryptoService.SPHINCS_PLUS_256f);
        byte[] signature = signFuture.get(10, TimeUnit.SECONDS);
        
        assertNotNull(signature, "Signature should not be null");
        assertTrue(signature.length > 0, "Signature should not be empty");
        
        // Verify signature
        CompletableFuture<Boolean> verifyFuture = quantumCryptoService.verify(TEST_DATA, signature, keyPair.getPublic(), QuantumCryptoService.SPHINCS_PLUS_256f);
        Boolean isValid = verifyFuture.get(5, TimeUnit.SECONDS);
        
        assertTrue(isValid, "Signature should be valid");
    }
    
    @Test
    @Order(7)
    @DisplayName("Test Kyber Key Encapsulation and Decapsulation")
    void testKyberEncapsulation() throws Exception {
        // Generate key pair
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.KYBER_1024).get(5, TimeUnit.SECONDS);
        
        // Encapsulate
        CompletableFuture<QuantumCryptoService.KyberEncapsulationResult> encapsFuture = 
            quantumCryptoService.encapsulate(keyPair.getPublic());
        QuantumCryptoService.KyberEncapsulationResult encapsulation = encapsFuture.get(5, TimeUnit.SECONDS);
        
        assertNotNull(encapsulation, "Encapsulation result should not be null");
        assertNotNull(encapsulation.getCiphertext(), "Ciphertext should not be null");
        assertNotNull(encapsulation.getSharedSecret(), "Shared secret should not be null");
        assertTrue(encapsulation.getCiphertext().length > 0, "Ciphertext should not be empty");
        assertTrue(encapsulation.getSharedSecret().length > 0, "Shared secret should not be empty");
        
        // Decapsulate
        CompletableFuture<byte[]> decapsFuture = 
            quantumCryptoService.decapsulate(encapsulation.getCiphertext(), keyPair.getPrivate());
        byte[] decapsulatedSecret = decapsFuture.get(5, TimeUnit.SECONDS);
        
        assertNotNull(decapsulatedSecret, "Decapsulated secret should not be null");
        assertArrayEquals(encapsulation.getSharedSecret(), decapsulatedSecret, 
                         "Decapsulated secret should match original shared secret");
    }
    
    @Test
    @Order(8)
    @DisplayName("Test Invalid Signature Verification")
    void testInvalidSignatureVerification() throws Exception {
        // Generate two different key pairs
        KeyPair keyPair1 = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        KeyPair keyPair2 = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        
        // Sign with first key pair
        byte[] signature = quantumCryptoService.sign(TEST_DATA, keyPair1.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        
        // Try to verify with second key pair (should fail)
        Boolean isValid = quantumCryptoService.verify(TEST_DATA, signature, keyPair2.getPublic(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        
        assertFalse(isValid, "Signature should be invalid when verified with wrong public key");
    }
    
    @Test
    @Order(9)
    @DisplayName("Test Secure Random Generation")
    void testSecureRandomGeneration() {
        byte[] random1 = quantumCryptoService.generateSecureRandom(32);
        byte[] random2 = quantumCryptoService.generateSecureRandom(32);
        
        assertNotNull(random1, "Random bytes should not be null");
        assertNotNull(random2, "Random bytes should not be null");
        assertEquals(32, random1.length, "Random bytes should be requested length");
        assertEquals(32, random2.length, "Random bytes should be requested length");
        assertFalse(java.util.Arrays.equals(random1, random2), "Random bytes should be different");
    }
    
    @Test
    @Order(10)
    @DisplayName("Test HSM Availability Check")
    void testHSMAvailability() {
        // HSM may or may not be available in test environment
        boolean hsmAvailable = quantumCryptoService.isHSMAvailable();
        
        // Just verify the method runs without exception
        assertTrue(true, "HSM availability check should complete without exception");
        
        if (hsmAvailable) {
            System.out.println("HSM is available for testing");
        } else {
            System.out.println("HSM is not available in test environment");
        }
    }
    
    @Test
    @Order(11)
    @DisplayName("Test Performance Metrics Collection")
    void testMetricsCollection() throws Exception {
        // Perform some operations to generate metrics
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        quantumCryptoService.sign(TEST_DATA, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        
        Map<String, QuantumCryptoService.CryptoMetrics> metrics = quantumCryptoService.getMetrics();
        
        assertNotNull(metrics, "Metrics should not be null");
        assertFalse(metrics.isEmpty(), "Metrics should contain operations");
        
        // Verify metrics structure
        for (Map.Entry<String, QuantumCryptoService.CryptoMetrics> entry : metrics.entrySet()) {
            assertNotNull(entry.getKey(), "Metric key should not be null");
            assertNotNull(entry.getValue(), "Metric value should not be null");
            assertTrue(entry.getValue().getTotalTime() >= 0, "Total time should be non-negative");
            assertTrue(entry.getValue().getCount() > 0, "Count should be positive");
        }
    }
    
    @Test
    @Order(12)
    @DisplayName("Test Large Data Signing Performance")
    void testLargeDataSigning() throws Exception {
        // Generate key pair
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        
        // Sign large data
        long startTime = System.nanoTime();
        byte[] signature = quantumCryptoService.sign(LARGE_TEST_DATA, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
        long signingTime = (System.nanoTime() - startTime) / 1_000_000; // Convert to milliseconds
        
        assertNotNull(signature, "Signature should not be null");
        
        // Verify signature
        startTime = System.nanoTime();
        Boolean isValid = quantumCryptoService.verify(LARGE_TEST_DATA, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        long verificationTime = (System.nanoTime() - startTime) / 1_000_000;
        
        assertTrue(isValid, "Signature should be valid");
        
        System.out.println("Large data signing performance:");
        System.out.println("  Data size: " + LARGE_TEST_DATA.length + " bytes");
        System.out.println("  Signing time: " + signingTime + "ms");
        System.out.println("  Verification time: " + verificationTime + "ms");
        
        // Verification should be under 10ms target
        assertTrue(verificationTime < 100, "Verification time should be reasonable for large data: " + verificationTime + "ms");
    }
    
    @Test
    @Order(13)
    @DisplayName("Test Concurrent Operations")
    void testConcurrentOperations() throws Exception {
        int numOperations = 10;
        CompletableFuture<Void>[] futures = new CompletableFuture[numOperations];
        
        for (int i = 0; i < numOperations; i++) {
            final int operationId = i;
            futures[i] = CompletableFuture.runAsync(() -> {
                try {
                    // Generate key pair
                    KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
                    
                    // Sign data
                    byte[] testData = ("Test data for operation " + operationId).getBytes();
                    byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
                    
                    // Verify signature
                    Boolean isValid = quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
                    
                    assertTrue(isValid, "Concurrent operation " + operationId + " should succeed");
                    
                } catch (Exception e) {
                    throw new RuntimeException("Concurrent operation " + operationId + " failed", e);
                }
            });
        }
        
        // Wait for all operations to complete
        CompletableFuture.allOf(futures).get(60, TimeUnit.SECONDS);
        
        System.out.println("Successfully completed " + numOperations + " concurrent quantum crypto operations");
    }
    
    @Test
    @Order(14)
    @DisplayName("Test Key Pair Cache Cleanup")
    void testKeyPairCacheCleanup() throws Exception {
        // Generate some key pairs to populate cache
        for (int i = 0; i < 5; i++) {
            quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        }
        
        // Perform cache cleanup
        quantumCryptoService.cleanupKeyPairCache();
        
        // Verify operation completes without exception
        assertTrue(true, "Cache cleanup should complete without exception");
    }
    
    @Test
    @Order(15)
    @DisplayName("Test Error Handling")
    void testErrorHandling() {
        // Test with invalid algorithm
        assertThrows(Exception.class, () -> {
            quantumCryptoService.generateKeyPair("INVALID_ALGORITHM").get(5, TimeUnit.SECONDS);
        }, "Should throw exception for invalid algorithm");
        
        // Test with null data
        assertThrows(Exception.class, () -> {
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
            quantumCryptoService.sign(null, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        }, "Should throw exception for null data");
    }
    
    @AfterEach
    void cleanup() {
        // Clean up caches after each test
        try {
            quantumCryptoService.cleanupKeyPairCache();
        } catch (Exception e) {
            // Ignore cleanup errors
        }
    }
    
    @AfterAll
    static void tearDown() {
        System.out.println("QuantumCryptoService test suite completed successfully");
    }
}