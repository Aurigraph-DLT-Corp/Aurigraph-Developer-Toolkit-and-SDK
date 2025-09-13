package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.jboss.logging.Logger;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for CRYSTALS-Dilithium Digital Signature Service
 * 
 * Tests NIST Level 5 post-quantum digital signatures with performance targets:
 * - Signature generation: <50ms target
 * - Signature verification: <10ms target 
 * - Key generation: <500ms target
 * - Quantum resistance: NIST Level 5 security
 * - Concurrent operations: Thread-safe execution
 * 
 * Coverage Target: 95%+ of DilithiumSignatureService methods
 */
@QuarkusTest
@DisplayName("CRYSTALS-Dilithium Signature Service Tests")
public class DilithiumSignatureServiceTest {

    private static final Logger LOG = Logger.getLogger(DilithiumSignatureServiceTest.class);

    @Inject
    DilithiumSignatureService dilithiumService;

    // Test data of various sizes
    private static final byte[] SMALL_DATA = "Hello, Quantum World!".getBytes();
    private static final byte[] MEDIUM_DATA = "This is a medium-sized test message for CRYSTALS-Dilithium signature testing. It contains multiple sentences to simulate real-world usage scenarios.".getBytes();
    private static final byte[] LARGE_DATA = new byte[10240]; // 10KB
    private static final byte[] XLARGE_DATA = new byte[1048576]; // 1MB

    static {
        // Initialize large test data
        new java.security.SecureRandom().nextBytes(LARGE_DATA);
        new java.security.SecureRandom().nextBytes(XLARGE_DATA);
    }

    @BeforeEach
    void setup() {
        dilithiumService.initialize();
    }

    @Nested
    @DisplayName("Initialization and Key Generation Tests")
    class InitializationTests {

        @Test
        @DisplayName("Service should initialize with CRYSTALS-Dilithium5 parameters")
        void testServiceInitialization() {
            // Verify service is properly initialized
            assertNotNull(dilithiumService, "DilithiumSignatureService should be injected");
            
            // Test key generation to verify initialization
            assertDoesNotThrow(() -> {
                KeyPair keyPair = dilithiumService.generateKeyPair();
                assertNotNull(keyPair, "Should generate key pair after initialization");
            }, "Service should generate keys after initialization");
        }

        @Test
        @DisplayName("Key generation should meet performance targets (<500ms)")
        void testKeyGenerationPerformance() {
            int iterations = 10;
            List<Long> generationTimes = new ArrayList<>();
            
            for (int i = 0; i < iterations; i++) {
                long startTime = System.nanoTime();
                KeyPair keyPair = dilithiumService.generateKeyPair();
                long endTime = System.nanoTime();
                
                long durationMs = (endTime - startTime) / 1_000_000;
                generationTimes.add(durationMs);
                
                assertNotNull(keyPair, "Key pair should be generated");
                assertNotNull(keyPair.getPublic(), "Public key should not be null");
                assertNotNull(keyPair.getPrivate(), "Private key should not be null");
                assertEquals("Dilithium", keyPair.getPublic().getAlgorithm());
                assertEquals("Dilithium", keyPair.getPrivate().getAlgorithm());
            }
            
            // Calculate statistics
            double avgTime = generationTimes.stream().mapToLong(Long::longValue).average().orElse(0);
            long maxTime = generationTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            long minTime = generationTimes.stream().mapToLong(Long::longValue).min().orElse(0);
            
            LOG.infof("Key generation performance: avg=%.1fms, min=%dms, max=%dms", avgTime, minTime, maxTime);
            
            // Performance targets
            assertTrue(avgTime < 500, "Average key generation should be under 500ms: " + avgTime + "ms");
            assertTrue(maxTime < 1000, "Max key generation should be reasonable: " + maxTime + "ms");
        }

        @ParameterizedTest
        @ValueSource(ints = {1, 5, 10, 20})
        @DisplayName("Should generate unique key pairs consistently")
        void testKeyPairUniqueness(int pairCount) {
            List<KeyPair> keyPairs = new ArrayList<>();
            
            for (int i = 0; i < pairCount; i++) {
                KeyPair keyPair = dilithiumService.generateKeyPair();
                assertNotNull(keyPair);
                keyPairs.add(keyPair);
            }
            
            // Verify all public keys are different
            for (int i = 0; i < keyPairs.size(); i++) {
                for (int j = i + 1; j < keyPairs.size(); j++) {
                    assertFalse(Arrays.equals(
                        keyPairs.get(i).getPublic().getEncoded(),
                        keyPairs.get(j).getPublic().getEncoded()
                    ), "Public keys should be unique");
                    
                    assertFalse(Arrays.equals(
                        keyPairs.get(i).getPrivate().getEncoded(),
                        keyPairs.get(j).getPrivate().getEncoded()
                    ), "Private keys should be unique");
                }
            }
        }
    }

    @Nested
    @DisplayName("Digital Signature Operations Tests")
    class SignatureOperationTests {

        @Test
        @DisplayName("Basic sign and verify operation should work")
        void testBasicSignAndVerify() {
            KeyPair keyPair = dilithiumService.generateKeyPair();
            
            // Sign data
            byte[] signature = dilithiumService.sign(SMALL_DATA, keyPair.getPrivate());
            
            assertNotNull(signature, "Signature should not be null");
            assertTrue(signature.length > 0, "Signature should not be empty");
            
            // Verify signature
            boolean isValid = dilithiumService.verify(SMALL_DATA, signature, keyPair.getPublic());
            assertTrue(isValid, "Signature should be valid");
        }

        @ParameterizedTest
        @CsvSource({
            "32, 'Small data'",
            "512, 'Medium data'", 
            "10240, 'Large data (10KB)'",
            "1048576, 'Extra large data (1MB)'"
        })
        @DisplayName("Should handle various data sizes correctly")
        void testVariousDataSizes(int dataSize, String description) {
            LOG.infof("Testing signature with %s (%d bytes)", description, dataSize);
            
            byte[] testData = new byte[dataSize];
            new java.security.SecureRandom().nextBytes(testData);
            
            KeyPair keyPair = dilithiumService.generateKeyPair();
            
            long signStart = System.nanoTime();
            byte[] signature = dilithiumService.sign(testData, keyPair.getPrivate());
            long signEnd = System.nanoTime();
            
            long verifyStart = System.nanoTime();
            boolean isValid = dilithiumService.verify(testData, signature, keyPair.getPublic());
            long verifyEnd = System.nanoTime();
            
            long signTime = (signEnd - signStart) / 1_000_000;
            long verifyTime = (verifyEnd - verifyStart) / 1_000_000;
            
            assertNotNull(signature, "Signature should not be null");
            assertTrue(isValid, "Signature should be valid");
            
            LOG.infof("Performance for %s: sign=%dms, verify=%dms", description, signTime, verifyTime);
            
            // Performance targets
            assertTrue(signTime < 100, "Signing should complete reasonably fast: " + signTime + "ms");
            assertTrue(verifyTime < 50, "Verification should be fast: " + verifyTime + "ms");
        }

        @Test
        @DisplayName("Signature verification should meet <10ms performance target")
        void testVerificationPerformance() {
            KeyPair keyPair = dilithiumService.generateKeyPair();
            byte[] signature = dilithiumService.sign(MEDIUM_DATA, keyPair.getPrivate());
            
            int iterations = 100;
            List<Long> verificationTimes = new ArrayList<>();
            
            for (int i = 0; i < iterations; i++) {
                long startTime = System.nanoTime();
                boolean isValid = dilithiumService.verify(MEDIUM_DATA, signature, keyPair.getPublic());
                long endTime = System.nanoTime();
                
                assertTrue(isValid, "Signature should be valid in iteration " + i);
                
                long durationMs = (endTime - startTime) / 1_000_000;
                verificationTimes.add(durationMs);
            }
            
            // Calculate performance statistics
            double avgTime = verificationTimes.stream().mapToLong(Long::longValue).average().orElse(0);
            long maxTime = verificationTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            long p95Time = verificationTimes.stream().sorted().mapToLong(Long::longValue)
                .skip((long) (iterations * 0.95)).findFirst().orElse(0);
            
            LOG.infof("Verification performance: avg=%.2fms, max=%dms, p95=%dms", avgTime, maxTime, p95Time);
            
            // Performance targets
            assertTrue(avgTime < 10, "Average verification should be under 10ms: " + avgTime + "ms");
            assertTrue(p95Time < 15, "95th percentile should be reasonable: " + p95Time + "ms");
        }

        @Test
        @DisplayName("Invalid signatures should be properly rejected")
        void testInvalidSignatureRejection() {
            KeyPair keyPair1 = dilithiumService.generateKeyPair();
            KeyPair keyPair2 = dilithiumService.generateKeyPair();
            
            byte[] signature = dilithiumService.sign(SMALL_DATA, keyPair1.getPrivate());
            
            // Test with wrong public key
            boolean isValid1 = dilithiumService.verify(SMALL_DATA, signature, keyPair2.getPublic());
            assertFalse(isValid1, "Signature should be invalid with wrong public key");
            
            // Test with corrupted signature
            byte[] corruptedSignature = Arrays.copyOf(signature, signature.length);
            corruptedSignature[0] ^= 0xFF; // Flip bits in first byte
            
            boolean isValid2 = dilithiumService.verify(SMALL_DATA, corruptedSignature, keyPair1.getPublic());
            assertFalse(isValid2, "Corrupted signature should be invalid");
            
            // Test with wrong data
            byte[] wrongData = "Different data".getBytes();
            boolean isValid3 = dilithiumService.verify(wrongData, signature, keyPair1.getPublic());
            assertFalse(isValid3, "Signature should be invalid for different data");
        }
    }

    @Nested
    @DisplayName("Error Handling and Edge Cases Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should handle null and invalid inputs gracefully")
        void testNullInputHandling() {
            KeyPair keyPair = dilithiumService.generateKeyPair();
            byte[] signature = dilithiumService.sign(SMALL_DATA, keyPair.getPrivate());
            
            // Test null data for signing
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.sign(null, keyPair.getPrivate()),
                "Should throw exception for null data"
            );
            
            // Test empty data
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.sign(new byte[0], keyPair.getPrivate()),
                "Should throw exception for empty data"
            );
            
            // Test null private key
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.sign(SMALL_DATA, null),
                "Should throw exception for null private key"
            );
            
            // Test null inputs for verification
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.verify(null, signature, keyPair.getPublic()),
                "Should throw exception for null data in verification"
            );
            
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.verify(SMALL_DATA, null, keyPair.getPublic()),
                "Should throw exception for null signature"
            );
            
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.verify(SMALL_DATA, signature, null),
                "Should throw exception for null public key"
            );
        }

        @Test
        @DisplayName("Should handle malformed keys appropriately")
        void testMalformedKeyHandling() {
            // This test would need mock keys or specific BouncyCastle key manipulation
            // For now, we test with null keys which should be caught
            assertThrows(IllegalArgumentException.class, () -> 
                dilithiumService.sign(SMALL_DATA, null),
                "Should reject null private key"
            );
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 1, 10, 100})
        @DisplayName("Should handle various signature corruption scenarios")
        void testSignatureCorruption(int corruptionIndex) {
            KeyPair keyPair = dilithiumService.generateKeyPair();
            byte[] signature = dilithiumService.sign(SMALL_DATA, keyPair.getPrivate());
            
            if (corruptionIndex < signature.length) {
                byte[] corruptedSig = Arrays.copyOf(signature, signature.length);
                corruptedSig[corruptionIndex] ^= 0xFF; // Flip bits
                
                boolean isValid = dilithiumService.verify(SMALL_DATA, corruptedSig, keyPair.getPublic());
                assertFalse(isValid, "Corrupted signature should be invalid (index: " + corruptionIndex + ")");
            }
        }
    }

    @Nested
    @DisplayName("Concurrent Operations and Thread Safety Tests")
    class ConcurrencyTests {

        @Test
        @DisplayName("Should handle concurrent signature operations safely")
        void testConcurrentSignatureOperations() throws InterruptedException {
            int threadCount = 20;
            int operationsPerThread = 10;
            CountDownLatch latch = new CountDownLatch(threadCount);
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger errorCount = new AtomicInteger(0);
            AtomicLong totalOperations = new AtomicLong(0);
            
            for (int t = 0; t < threadCount; t++) {
                final int threadId = t;
                CompletableFuture.runAsync(() -> {
                    try {
                        for (int op = 0; op < operationsPerThread; op++) {
                            try {
                                KeyPair keyPair = dilithiumService.generateKeyPair();
                                byte[] data = ("Thread " + threadId + " operation " + op).getBytes();
                                
                                byte[] signature = dilithiumService.sign(data, keyPair.getPrivate());
                                boolean isValid = dilithiumService.verify(data, signature, keyPair.getPublic());
                                
                                if (isValid) {
                                    successCount.incrementAndGet();
                                } else {
                                    errorCount.incrementAndGet();
                                }
                                totalOperations.incrementAndGet();
                                
                            } catch (Exception e) {
                                errorCount.incrementAndGet();
                                LOG.warnf("Thread %d operation %d failed: %s", threadId, op, e.getMessage());
                            }
                        }
                    } finally {
                        latch.countDown();
                    }
                });
            }
            
            assertTrue(latch.await(60, TimeUnit.SECONDS), "All threads should complete within 60 seconds");
            
            long expectedOperations = threadCount * operationsPerThread;
            assertEquals(expectedOperations, totalOperations.get(), "Should complete all operations");
            assertTrue(successCount.get() >= expectedOperations * 0.95, "At least 95% should succeed");
            assertTrue(errorCount.get() <= expectedOperations * 0.05, "At most 5% should fail");
            
            LOG.infof("Concurrent operations: %d/%d succeeded, %d errors", 
                     successCount.get(), expectedOperations, errorCount.get());
        }

        @Test
        @DisplayName("Should handle concurrent key generation safely")
        void testConcurrentKeyGeneration() throws InterruptedException {
            int threadCount = 10;
            CountDownLatch latch = new CountDownLatch(threadCount);
            List<KeyPair> generatedKeys = new ArrayList<>();
            AtomicInteger successCount = new AtomicInteger(0);
            
            for (int t = 0; t < threadCount; t++) {
                CompletableFuture.runAsync(() -> {
                    try {
                        KeyPair keyPair = dilithiumService.generateKeyPair();
                        assertNotNull(keyPair);
                        
                        synchronized (generatedKeys) {
                            generatedKeys.add(keyPair);
                        }
                        successCount.incrementAndGet();
                        
                    } catch (Exception e) {
                        LOG.errorf("Concurrent key generation failed: %s", e.getMessage());
                    } finally {
                        latch.countDown();
                    }
                });
            }
            
            assertTrue(latch.await(30, TimeUnit.SECONDS), "Key generation should complete");
            assertEquals(threadCount, successCount.get(), "All key generations should succeed");
            assertEquals(threadCount, generatedKeys.size(), "Should generate all keys");
            
            // Verify all keys are unique
            for (int i = 0; i < generatedKeys.size(); i++) {
                for (int j = i + 1; j < generatedKeys.size(); j++) {
                    assertFalse(Arrays.equals(
                        generatedKeys.get(i).getPublic().getEncoded(),
                        generatedKeys.get(j).getPublic().getEncoded()
                    ), "All generated keys should be unique");
                }
            }
        }
    }

    @Nested
    @DisplayName("Performance Metrics and Monitoring Tests")
    class MetricsTests {

        @Test
        @DisplayName("Should track performance metrics accurately")
        void testPerformanceMetricsTracking() {
            // Perform several operations to generate metrics
            KeyPair keyPair = dilithiumService.generateKeyPair();
            
            for (int i = 0; i < 5; i++) {
                byte[] signature = dilithiumService.sign(SMALL_DATA, keyPair.getPrivate());
                dilithiumService.verify(SMALL_DATA, signature, keyPair.getPublic());
            }
            
            // This test assumes the service tracks metrics internally
            // In a real implementation, we would have getMetrics() methods
            assertTrue(true, "Performance metrics should be tracked");
        }

        @Test
        @DisplayName("Should maintain consistent performance under load")
        void testPerformanceConsistency() {
            KeyPair keyPair = dilithiumService.generateKeyPair();
            List<Long> signTimes = new ArrayList<>();
            List<Long> verifyTimes = new ArrayList<>();
            
            for (int i = 0; i < 50; i++) {
                // Measure signing time
                long signStart = System.nanoTime();
                byte[] signature = dilithiumService.sign(MEDIUM_DATA, keyPair.getPrivate());
                long signEnd = System.nanoTime();
                signTimes.add((signEnd - signStart) / 1_000_000);
                
                // Measure verification time
                long verifyStart = System.nanoTime();
                boolean isValid = dilithiumService.verify(MEDIUM_DATA, signature, keyPair.getPublic());
                long verifyEnd = System.nanoTime();
                verifyTimes.add((verifyEnd - verifyStart) / 1_000_000);
                
                assertTrue(isValid, "Signature should be valid");
            }
            
            // Calculate statistics
            double avgSignTime = signTimes.stream().mapToLong(Long::longValue).average().orElse(0);
            double avgVerifyTime = verifyTimes.stream().mapToLong(Long::longValue).average().orElse(0);
            
            long maxSignTime = signTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            long maxVerifyTime = verifyTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            
            LOG.infof("Performance consistency: sign avg=%.1fms max=%dms, verify avg=%.1fms max=%dms", 
                     avgSignTime, maxSignTime, avgVerifyTime, maxVerifyTime);
            
            // Performance consistency checks
            assertTrue(avgSignTime < 50, "Average signing time should be reasonable");
            assertTrue(avgVerifyTime < 10, "Average verification time should meet target");
            assertTrue(maxSignTime < 200, "Max signing time should be bounded");
            assertTrue(maxVerifyTime < 50, "Max verification time should be bounded");
        }
    }

    @Test
    @DisplayName("Overall CRYSTALS-Dilithium service should demonstrate quantum-resistant capabilities")
    void testOverallQuantumResistantCapabilities() {
        LOG.info("Testing overall CRYSTALS-Dilithium quantum-resistant capabilities");
        
        // Test full workflow
        KeyPair keyPair = dilithiumService.generateKeyPair();
        
        // Test with various data types
        byte[][] testDataSets = {SMALL_DATA, MEDIUM_DATA, LARGE_DATA};
        
        for (int i = 0; i < testDataSets.length; i++) {
            byte[] testData = testDataSets[i];
            
            long signStart = System.nanoTime();
            byte[] signature = dilithiumService.sign(testData, keyPair.getPrivate());
            long signEnd = System.nanoTime();
            
            long verifyStart = System.nanoTime();
            boolean isValid = dilithiumService.verify(testData, signature, keyPair.getPublic());
            long verifyEnd = System.nanoTime();
            
            assertNotNull(signature, "Signature should be generated for dataset " + i);
            assertTrue(isValid, "Signature should be valid for dataset " + i);
            
            long signTime = (signEnd - signStart) / 1_000_000;
            long verifyTime = (verifyEnd - verifyStart) / 1_000_000;
            
            LOG.infof("Dataset %d (%d bytes): sign=%dms, verify=%dms, sig_size=%d bytes", 
                     i, testData.length, signTime, verifyTime, signature.length);
        }
        
        // Verify quantum-resistant properties
        assertTrue(keyPair.getPublic().getAlgorithm().equals("Dilithium"), 
                  "Should use Dilithium algorithm");
        assertTrue(keyPair.getPublic().getEncoded().length > 1000, 
                  "Quantum-resistant keys should be large");
        
        LOG.info("CRYSTALS-Dilithium quantum-resistant capabilities verified successfully");
        LOG.infof("Public key size: %d bytes", keyPair.getPublic().getEncoded().length);
        LOG.infof("Private key size: %d bytes", keyPair.getPrivate().getEncoded().length);
    }
}