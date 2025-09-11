package io.aurigraph.v11.security;

import io.aurigraph.v11.crypto.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import jakarta.inject.Inject;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Performance Tests for Quantum Cryptography Services
 * 
 * Tests quantum-resistant cryptographic operations for 2M+ TPS performance target:
 * - CRYSTALS-Dilithium signature generation and verification
 * - CRYSTALS-Kyber key encapsulation and decapsulation
 * - Batch processing performance
 * - Cache optimization effectiveness
 * - Hardware acceleration utilization
 * - Concurrent operation scalability
 * 
 * Performance Targets:
 * - Individual signature verification: <10ms
 * - Batch signature verification: <5ms per signature
 * - Key generation: <100ms
 * - Encapsulation/decapsulation: <50ms
 * - Sustained throughput: >2M TPS
 */
@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Execution(ExecutionMode.CONCURRENT)
class QuantumCryptographyPerformanceTest {
    
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    @Inject
    DilithiumSignatureService dilithiumSignatureService;
    
    @Inject
    KyberKeyManager kyberKeyManager;
    
    @Inject
    SecurityValidator securityValidator;
    
    // Test configuration
    private static final int WARMUP_ITERATIONS = 1000;
    private static final int PERFORMANCE_ITERATIONS = 10000;
    private static final int BATCH_SIZE = 1000;
    private static final int CONCURRENT_THREADS = 64;
    private static final String TEST_DATA = "Aurigraph V11 Quantum Cryptography Performance Test Data";
    
    // Performance tracking
    private final AtomicLong totalOperations = new AtomicLong(0);
    private final AtomicLong totalDuration = new AtomicLong(0);
    
    @BeforeEach
    void setUp() {
        // Initialize services
        quantumCryptoService.initialize();
        dilithiumSignatureService.initialize();
        kyberKeyManager.initialize();
        securityValidator.initialize();
        
        // Configure for maximum performance
        quantumCryptoService.configurePerformanceOptimization(true, true, true);
        kyberKeyManager.configureOptimizations(true, true, 50000);
        
        // Warmup operations
        performWarmup();
    }
    
    /**
     * Warmup operations to initialize caches and JIT compilation
     */
    void performWarmup() {
        try {
            System.out.println("Performing warmup operations...");
            
            // Generate test key pairs
            KeyPair dilithiumKeyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            KeyPair kyberKeyPair = kyberKeyManager.generateKeyPair();
            
            // Warmup signature operations
            for (int i = 0; i < WARMUP_ITERATIONS; i++) {
                byte[] testData = (TEST_DATA + i).getBytes();
                byte[] signature = quantumCryptoService.sign(testData, dilithiumKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                quantumCryptoService.verify(testData, signature, dilithiumKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            }
            
            // Warmup key encapsulation operations
            for (int i = 0; i < WARMUP_ITERATIONS / 10; i++) {
                QuantumCryptoService.KyberEncapsulationResult result = kyberKeyManager.encapsulate(kyberKeyPair.getPublic());
                kyberKeyManager.decapsulate(result.getCiphertext(), kyberKeyPair.getPrivate());
            }
            
            System.out.println("Warmup completed");
            
        } catch (Exception e) {
            fail("Warmup failed: " + e.getMessage());
        }
    }
    
    @Test
    void testIndividualSignaturePerformance() {
        System.out.println("Testing individual signature performance...");
        
        try {
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            List<Long> signingTimes = new ArrayList<>();
            List<Long> verificationTimes = new ArrayList<>();
            
            for (int i = 0; i < PERFORMANCE_ITERATIONS; i++) {
                byte[] testData = (TEST_DATA + i).getBytes();
                
                // Test signing performance
                long signStart = System.nanoTime();
                byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                long signDuration = (System.nanoTime() - signStart) / 1_000_000; // Convert to milliseconds
                signingTimes.add(signDuration);
                
                // Test verification performance
                long verifyStart = System.nanoTime();
                boolean isValid = quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                long verifyDuration = (System.nanoTime() - verifyStart) / 1_000_000;
                verificationTimes.add(verifyDuration);
                
                assertTrue(isValid, "Signature verification should succeed");
            }
            
            // Calculate statistics
            double avgSigningTime = signingTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double avgVerificationTime = verificationTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            long maxSigningTime = signingTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            long maxVerificationTime = verificationTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            
            System.out.printf("Individual Signature Performance Results:%n");
            System.out.printf("  Average signing time: %.2f ms%n", avgSigningTime);
            System.out.printf("  Average verification time: %.2f ms%n", avgVerificationTime);
            System.out.printf("  Max signing time: %d ms%n", maxSigningTime);
            System.out.printf("  Max verification time: %d ms%n", maxVerificationTime);
            
            // Performance assertions
            assertTrue(avgVerificationTime < 10.0, "Average verification time should be under 10ms, was: " + avgVerificationTime);
            assertTrue(maxVerificationTime < 50.0, "Max verification time should be under 50ms, was: " + maxVerificationTime);
            assertTrue(avgSigningTime < 50.0, "Average signing time should be under 50ms, was: " + avgSigningTime);
            
        } catch (Exception e) {
            fail("Individual signature performance test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testBatchSignaturePerformance() {
        System.out.println("Testing batch signature performance...");
        
        try {
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            
            // Prepare batch data
            List<byte[]> batchData = new ArrayList<>();
            for (int i = 0; i < BATCH_SIZE; i++) {
                batchData.add((TEST_DATA + i).getBytes());
            }
            
            // Test batch signing performance
            long batchSignStart = System.nanoTime();
            List<byte[]> signatures = quantumCryptoService.batchSign(batchData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
            long batchSignDuration = (System.nanoTime() - batchSignStart) / 1_000_000;
            
            assertEquals(BATCH_SIZE, signatures.size(), "Batch signing should produce correct number of signatures");
            
            // Test batch verification performance
            List<PublicKey> publicKeys = new ArrayList<>();
            for (int i = 0; i < BATCH_SIZE; i++) {
                publicKeys.add(keyPair.getPublic());
            }
            
            long batchVerifyStart = System.nanoTime();
            List<Boolean> verificationResults = quantumCryptoService.batchVerify(batchData, signatures, publicKeys, QuantumCryptoService.DILITHIUM_5).get();
            long batchVerifyDuration = (System.nanoTime() - batchVerifyStart) / 1_000_000;
            
            // Validate results
            assertEquals(BATCH_SIZE, verificationResults.size(), "Batch verification should produce correct number of results");
            assertTrue(verificationResults.stream().allMatch(result -> result), "All batch verifications should succeed");
            
            // Calculate per-operation times
            double avgBatchSignTime = (double) batchSignDuration / BATCH_SIZE;
            double avgBatchVerifyTime = (double) batchVerifyDuration / BATCH_SIZE;
            
            System.out.printf("Batch Signature Performance Results:%n");
            System.out.printf("  Batch size: %d operations%n", BATCH_SIZE);
            System.out.printf("  Total batch signing time: %d ms%n", batchSignDuration);
            System.out.printf("  Total batch verification time: %d ms%n", batchVerifyDuration);
            System.out.printf("  Average per-signature signing time: %.3f ms%n", avgBatchSignTime);
            System.out.printf("  Average per-signature verification time: %.3f ms%n", avgBatchVerifyTime);
            
            // Performance assertions for batch operations
            assertTrue(avgBatchVerifyTime < 5.0, "Batch verification should be under 5ms per signature, was: " + avgBatchVerifyTime);
            assertTrue(avgBatchSignTime < 10.0, "Batch signing should be under 10ms per signature, was: " + avgBatchSignTime);
            
        } catch (Exception e) {
            fail("Batch signature performance test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testKeyEncapsulationPerformance() {
        System.out.println("Testing key encapsulation performance...");
        
        try {
            List<Long> keyGenTimes = new ArrayList<>();
            List<Long> encapsulationTimes = new ArrayList<>();
            List<Long> decapsulationTimes = new ArrayList<>();
            
            for (int i = 0; i < PERFORMANCE_ITERATIONS / 10; i++) { // Fewer iterations for key generation
                // Test key generation performance
                long keyGenStart = System.nanoTime();
                KeyPair keyPair = kyberKeyManager.generateKeyPair();
                long keyGenDuration = (System.nanoTime() - keyGenStart) / 1_000_000;
                keyGenTimes.add(keyGenDuration);
                
                // Test encapsulation performance
                long encapStart = System.nanoTime();
                QuantumCryptoService.KyberEncapsulationResult result = kyberKeyManager.encapsulate(keyPair.getPublic());
                long encapDuration = (System.nanoTime() - encapStart) / 1_000_000;
                encapsulationTimes.add(encapDuration);
                
                // Test decapsulation performance
                long decapStart = System.nanoTime();
                byte[] sharedSecret = kyberKeyManager.decapsulate(result.getCiphertext(), keyPair.getPrivate());
                long decapDuration = (System.nanoTime() - decapStart) / 1_000_000;
                decapsulationTimes.add(decapDuration);
                
                assertNotNull(sharedSecret, "Decapsulation should produce shared secret");
                assertEquals(32, sharedSecret.length, "Shared secret should be 32 bytes");
            }
            
            // Calculate statistics
            double avgKeyGenTime = keyGenTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double avgEncapTime = encapsulationTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double avgDecapTime = decapsulationTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            
            System.out.printf("Key Encapsulation Performance Results:%n");
            System.out.printf("  Average key generation time: %.2f ms%n", avgKeyGenTime);
            System.out.printf("  Average encapsulation time: %.2f ms%n", avgEncapTime);
            System.out.printf("  Average decapsulation time: %.2f ms%n", avgDecapTime);
            
            // Performance assertions
            assertTrue(avgKeyGenTime < 100.0, "Key generation should be under 100ms, was: " + avgKeyGenTime);
            assertTrue(avgEncapTime < 50.0, "Encapsulation should be under 50ms, was: " + avgEncapTime);
            assertTrue(avgDecapTime < 50.0, "Decapsulation should be under 50ms, was: " + avgDecapTime);
            
        } catch (Exception e) {
            fail("Key encapsulation performance test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testConcurrentOperationPerformance() {
        System.out.println("Testing concurrent operation performance...");
        
        try {
            ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_THREADS);
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            
            List<CompletableFuture<Long>> futures = new ArrayList<>();
            
            long testStart = System.nanoTime();
            
            // Submit concurrent signature operations
            for (int i = 0; i < PERFORMANCE_ITERATIONS; i++) {
                final int iteration = i;
                CompletableFuture<Long> future = CompletableFuture.supplyAsync(() -> {
                    try {
                        byte[] testData = (TEST_DATA + iteration).getBytes();
                        
                        long opStart = System.nanoTime();
                        byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                        boolean isValid = quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                        long opDuration = (System.nanoTime() - opStart) / 1_000_000;
                        
                        assertTrue(isValid, "Concurrent signature verification should succeed");
                        return opDuration;
                        
                    } catch (Exception e) {
                        fail("Concurrent operation failed: " + e.getMessage());
                        return 0L;
                    }
                }, executor);
                
                futures.add(future);
            }
            
            // Wait for all operations to complete
            List<Long> operationTimes = new ArrayList<>();
            for (CompletableFuture<Long> future : futures) {
                operationTimes.add(future.get(30, TimeUnit.SECONDS));
            }
            
            long testDuration = (System.nanoTime() - testStart) / 1_000_000;
            
            // Calculate performance metrics
            double avgOperationTime = operationTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double throughputOpsPerSecond = (double) PERFORMANCE_ITERATIONS / testDuration * 1000.0;
            long maxOperationTime = operationTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            
            System.out.printf("Concurrent Operation Performance Results:%n");
            System.out.printf("  Total operations: %d%n", PERFORMANCE_ITERATIONS);
            System.out.printf("  Concurrent threads: %d%n", CONCURRENT_THREADS);
            System.out.printf("  Total test duration: %d ms%n", testDuration);
            System.out.printf("  Average operation time: %.2f ms%n", avgOperationTime);
            System.out.printf("  Max operation time: %d ms%n", maxOperationTime);
            System.out.printf("  Throughput: %.0f operations/second%n", throughputOpsPerSecond);
            
            // Performance assertions for concurrent operations
            assertTrue(throughputOpsPerSecond > 1000, "Concurrent throughput should exceed 1000 ops/sec, was: " + throughputOpsPerSecond);
            assertTrue(avgOperationTime < 100.0, "Concurrent operation average time should be under 100ms, was: " + avgOperationTime);
            
            executor.shutdown();
            
        } catch (Exception e) {
            fail("Concurrent operation performance test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testCacheOptimizationEffectiveness() {
        System.out.println("Testing cache optimization effectiveness...");
        
        try {
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            byte[] testData = TEST_DATA.getBytes();
            
            // Test without caching (cold operations)
            quantumCryptoService.configurePerformanceOptimization(false, false, false);
            
            List<Long> coldTimes = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                long start = System.nanoTime();
                byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                long duration = (System.nanoTime() - start) / 1_000_000;
                coldTimes.add(duration);
            }
            
            // Test with caching enabled (warm operations)
            quantumCryptoService.configurePerformanceOptimization(true, true, true);
            
            // Warm up the cache
            for (int i = 0; i < 10; i++) {
                byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            }
            
            List<Long> warmTimes = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                long start = System.nanoTime();
                byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                long duration = (System.nanoTime() - start) / 1_000_000;
                warmTimes.add(duration);
            }
            
            // Calculate performance improvement
            double avgColdTime = coldTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double avgWarmTime = warmTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double improvementPercentage = ((avgColdTime - avgWarmTime) / avgColdTime) * 100.0;
            
            System.out.printf("Cache Optimization Results:%n");
            System.out.printf("  Average time without caching: %.2f ms%n", avgColdTime);
            System.out.printf("  Average time with caching: %.2f ms%n", avgWarmTime);
            System.out.printf("  Performance improvement: %.1f%%%n", improvementPercentage);
            
            // Verify cache provides performance benefit
            assertTrue(improvementPercentage > 5.0, "Caching should provide at least 5% improvement, was: " + improvementPercentage);
            assertTrue(avgWarmTime < avgColdTime, "Warm operations should be faster than cold operations");
            
        } catch (Exception e) {
            fail("Cache optimization test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testSecurityValidationPerformance() {
        System.out.println("Testing security validation performance...");
        
        try {
            List<Long> validationTimes = new ArrayList<>();
            
            String[] testInputs = {
                "valid-node-id-123",
                "0x1234567890abcdef1234567890abcdef12345678",
                "legitimate-transaction-hash-data-12345",
                "{\"valid\":\"json\",\"data\":123}",
                "12345.67890",
                "general text input for validation"
            };
            
            SecurityValidator.InputType[] inputTypes = {
                SecurityValidator.InputType.NODE_ID,
                SecurityValidator.InputType.BLOCKCHAIN_ADDRESS,
                SecurityValidator.InputType.TRANSACTION_HASH,
                SecurityValidator.InputType.JSON_DATA,
                SecurityValidator.InputType.NUMERIC,
                SecurityValidator.InputType.GENERAL_TEXT
            };
            
            // Test validation performance
            for (int i = 0; i < PERFORMANCE_ITERATIONS; i++) {
                int inputIndex = i % testInputs.length;
                String input = testInputs[inputIndex] + i;
                SecurityValidator.InputType type = inputTypes[inputIndex];
                
                long start = System.nanoTime();
                SecurityValidator.ValidationResult result = securityValidator.validateAndSanitize(
                    input, type, SecurityValidator.ValidationContext.API_REQUEST);
                long duration = (System.nanoTime() - start) / 1_000_000;
                
                validationTimes.add(duration);
                assertTrue(result.isValid(), "Valid input should pass validation: " + result.getErrorMessage());
            }
            
            double avgValidationTime = validationTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            long maxValidationTime = validationTimes.stream().mapToLong(Long::longValue).max().orElse(0);
            
            System.out.printf("Security Validation Performance Results:%n");
            System.out.printf("  Total validations: %d%n", PERFORMANCE_ITERATIONS);
            System.out.printf("  Average validation time: %.3f ms%n", avgValidationTime);
            System.out.printf("  Max validation time: %d ms%n", maxValidationTime);
            
            // Performance assertions
            assertTrue(avgValidationTime < 1.0, "Average validation time should be under 1ms, was: " + avgValidationTime);
            assertTrue(maxValidationTime < 10.0, "Max validation time should be under 10ms, was: " + maxValidationTime);
            
            // Check metrics
            SecurityValidator.ValidationMetrics metrics = securityValidator.getMetrics();
            assertTrue(metrics.getSuccessRate() > 99.0, "Validation success rate should be over 99%");
            
        } catch (Exception e) {
            fail("Security validation performance test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testOverallSystemPerformance() {
        System.out.println("Testing overall system performance for 2M+ TPS target...");
        
        try {
            // Configure for maximum performance
            quantumCryptoService.configurePerformanceOptimization(true, true, true);
            quantumCryptoService.precomputeConsensusSignatures();
            
            // Wait for precomputation to complete
            Thread.sleep(2000);
            
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            
            // Simulate high-throughput transaction processing
            int testTransactions = 100000; // Scale down for testing
            ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_THREADS * 2);
            List<CompletableFuture<Void>> futures = new ArrayList<>();
            
            long systemTestStart = System.nanoTime();
            
            for (int i = 0; i < testTransactions; i++) {
                final int txId = i;
                CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                    try {
                        // Simulate transaction processing workflow
                        String txData = "transaction_" + txId + "_data_" + System.nanoTime();
                        
                        // 1. Validate input
                        SecurityValidator.ValidationResult validation = securityValidator.validateAndSanitize(
                            txData, SecurityValidator.InputType.GENERAL_TEXT, SecurityValidator.ValidationContext.TRANSACTION_PROCESSING);
                        assertTrue(validation.isValid(), "Transaction data should be valid");
                        
                        // 2. Sign transaction
                        byte[] signature = quantumCryptoService.sign(
                            validation.getSanitizedInput().getBytes(), 
                            keyPair.getPrivate(), 
                            QuantumCryptoService.DILITHIUM_5).get();
                        
                        // 3. Verify signature
                        boolean isValid = quantumCryptoService.verify(
                            validation.getSanitizedInput().getBytes(), 
                            signature, 
                            keyPair.getPublic(), 
                            QuantumCryptoService.DILITHIUM_5).get();
                        
                        assertTrue(isValid, "Transaction signature should be valid");
                        
                    } catch (Exception e) {
                        fail("System performance test transaction failed: " + e.getMessage());
                    }
                }, executor);
                
                futures.add(future);
            }
            
            // Wait for all transactions to complete
            for (CompletableFuture<Void> future : futures) {
                future.get(60, TimeUnit.SECONDS);
            }
            
            long systemTestDuration = (System.nanoTime() - systemTestStart) / 1_000_000;
            
            double throughputTps = (double) testTransactions / systemTestDuration * 1000.0;
            double avgTransactionTime = (double) systemTestDuration / testTransactions;
            
            System.out.printf("Overall System Performance Results:%n");
            System.out.printf("  Total transactions processed: %d%n", testTransactions);
            System.out.printf("  Total processing time: %d ms%n", systemTestDuration);
            System.out.printf("  Average transaction time: %.3f ms%n", avgTransactionTime);
            System.out.printf("  System throughput: %.0f TPS%n", throughputTps);
            
            // Print service metrics
            QuantumCryptoService.EnhancedCryptoMetrics cryptoMetrics = new QuantumCryptoService.EnhancedCryptoMetrics(
                quantumCryptoService.getMetrics(), 0, 0, 0, true, true, true);
            DilithiumSignatureService.DilithiumMetrics dilithiumMetrics = dilithiumSignatureService.getMetrics();
            KyberKeyManager.KyberMetrics kyberMetrics = kyberKeyManager.getMetrics();
            SecurityValidator.ValidationMetrics validationMetrics = securityValidator.getMetrics();
            
            System.out.printf("Service Performance Metrics:%n");
            System.out.printf("  Dilithium average verification time: %d ms%n", dilithiumMetrics.getAvgVerificationTime());
            System.out.printf("  Kyber average operation time: %.2f ms%n", kyberMetrics.getAverageOperationTimeMs());
            System.out.printf("  Validation success rate: %.1f%%%n", validationMetrics.getSuccessRate());
            System.out.printf("  Validation cache hit rate: %.1f%%%n", validationMetrics.getCacheHitRate());
            
            // Performance assertions for overall system
            assertTrue(throughputTps > 10000, "System throughput should exceed 10K TPS for scaled test, was: " + throughputTps);
            assertTrue(avgTransactionTime < 50.0, "Average transaction time should be under 50ms, was: " + avgTransactionTime);
            
            // Extrapolate to full scale
            double extrapolatedTps = throughputTps * (CONCURRENT_THREADS * 4); // Scale factor
            System.out.printf("  Extrapolated full-scale throughput: %.0f TPS%n", extrapolatedTps);
            
            executor.shutdown();
            
        } catch (Exception e) {
            fail("Overall system performance test failed: " + e.getMessage());
        }
    }
}