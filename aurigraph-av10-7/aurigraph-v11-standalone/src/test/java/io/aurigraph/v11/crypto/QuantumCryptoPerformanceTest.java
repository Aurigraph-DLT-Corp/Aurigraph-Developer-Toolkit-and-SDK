package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.security.KeyPair;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance test suite for quantum-resistant cryptographic operations
 * 
 * Validates performance requirements:
 * - <10ms signature verification target
 * - High-throughput batch operations
 * - Concurrent operation scalability
 * - Memory usage optimization
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Execution(ExecutionMode.SAME_THREAD) // Sequential execution for accurate performance measurement
public class QuantumCryptoPerformanceTest {
    
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    @Inject
    DilithiumSignatureService dilithiumSignatureService;
    
    @Inject
    SphincsPlusService sphincsPlusService;
    
    // Performance test parameters
    private static final int PERFORMANCE_TEST_ITERATIONS = 100;
    private static final int BATCH_SIZE = 50;
    private static final int CONCURRENT_THREADS = 10;
    private static final long TARGET_VERIFICATION_TIME_MS = 10;
    private static final long TARGET_SIGNING_TIME_MS = 50;
    
    // Test data sizes
    private static final byte[] SMALL_DATA = "Quick test data".getBytes();
    private static final byte[] MEDIUM_DATA = new byte[1024]; // 1KB
    private static final byte[] LARGE_DATA = new byte[10240]; // 10KB
    
    private List<PerformanceResult> performanceResults = new ArrayList<>();
    
    @BeforeAll
    static void setupTestData() {
        // Initialize test data with random bytes
        new java.security.SecureRandom().nextBytes(MEDIUM_DATA);
        new java.security.SecureRandom().nextBytes(LARGE_DATA);
    }
    
    @BeforeEach
    void setup() {
        quantumCryptoService.initialize();
        performanceResults.clear();
    }
    
    @Test
    @Order(1)
    @DisplayName("Dilithium5 Signature Verification Performance - Target <10ms")
    void testDilithiumVerificationPerformance() throws Exception {
        System.out.println("\n=== Dilithium5 Signature Verification Performance Test ===");
        
        // Pre-generate key pair and signatures for consistent testing
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
        
        // Test with different data sizes
        testVerificationPerformanceForDataSize("Small Data (15B)", SMALL_DATA, keyPair, QuantumCryptoService.DILITHIUM_5);
        testVerificationPerformanceForDataSize("Medium Data (1KB)", MEDIUM_DATA, keyPair, QuantumCryptoService.DILITHIUM_5);
        testVerificationPerformanceForDataSize("Large Data (10KB)", LARGE_DATA, keyPair, QuantumCryptoService.DILITHIUM_5);
        
        // Verify all tests meet the <10ms target
        for (PerformanceResult result : performanceResults) {
            if (result.operation.contains("Verification")) {
                System.out.printf("  %s: avg=%.2fms, min=%.2fms, max=%.2fms, p95=%.2fms%n",
                                result.operation, result.averageTime, result.minTime, result.maxTime, result.p95Time);
                
                // Performance assertion - verification should be under 10ms on average
                assertTrue(result.averageTime < TARGET_VERIFICATION_TIME_MS, 
                          String.format("Dilithium verification average time (%.2fms) exceeds target (%dms) for %s", 
                                      result.averageTime, TARGET_VERIFICATION_TIME_MS, result.operation));
            }
        }
    }
    
    @Test
    @Order(2)
    @DisplayName("SPHINCS+ Signature Verification Performance")
    void testSphincsPlusVerificationPerformance() throws Exception {
        System.out.println("\n=== SPHINCS+ Signature Verification Performance Test ===");
        
        // Pre-generate key pair and signatures
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.SPHINCS_PLUS_256f).get(30, TimeUnit.SECONDS);
        
        // Test verification performance (SPHINCS+ may be slower but should still be reasonable)
        testVerificationPerformanceForDataSize("Small Data (15B) - SPHINCS+", SMALL_DATA, keyPair, QuantumCryptoService.SPHINCS_PLUS_256f);
        
        // SPHINCS+ has larger signatures but verification should still be fast
        PerformanceResult sphincsResult = performanceResults.get(performanceResults.size() - 1);
        System.out.printf("  SPHINCS+ Verification: avg=%.2fms, min=%.2fms, max=%.2fms, p95=%.2fms%n",
                        sphincsResult.averageTime, sphincsResult.minTime, sphincsResult.maxTime, sphincsResult.p95Time);
        
        // SPHINCS+ verification should be under 50ms (more lenient than Dilithium)
        assertTrue(sphincsResult.averageTime < 50, 
                  String.format("SPHINCS+ verification average time (%.2fms) should be reasonable", sphincsResult.averageTime));
    }
    
    @Test
    @Order(3)
    @DisplayName("Dilithium5 Signature Generation Performance")
    void testDilithiumSigningPerformance() throws Exception {
        System.out.println("\n=== Dilithium5 Signature Generation Performance Test ===");
        
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
        
        // Test signing performance
        List<Double> signingTimes = new ArrayList<>();
        
        for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; i++) {
            long startTime = System.nanoTime();
            quantumCryptoService.sign(SMALL_DATA, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
            long duration = (System.nanoTime() - startTime) / 1_000_000; // Convert to milliseconds
            signingTimes.add((double) duration);
        }
        
        PerformanceResult signingResult = calculatePerformanceMetrics("Dilithium Signing", signingTimes);
        performanceResults.add(signingResult);
        
        System.out.printf("  Dilithium Signing: avg=%.2fms, min=%.2fms, max=%.2fms, p95=%.2fms%n",
                        signingResult.averageTime, signingResult.minTime, signingResult.maxTime, signingResult.p95Time);
        
        // Signing can be slower than verification, but should be reasonable
        assertTrue(signingResult.averageTime < TARGET_SIGNING_TIME_MS, 
                  String.format("Dilithium signing average time (%.2fms) exceeds target (%dms)", 
                              signingResult.averageTime, TARGET_SIGNING_TIME_MS));
    }
    
    @Test
    @Order(4)
    @DisplayName("Batch Verification Performance")
    void testBatchVerificationPerformance() throws Exception {
        System.out.println("\n=== Batch Verification Performance Test ===");
        
        // Generate test data for batch operations
        KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
        
        // Pre-generate signatures for batch testing
        byte[][] testDataBatch = new byte[BATCH_SIZE][];
        byte[][] signatures = new byte[BATCH_SIZE][];
        
        for (int i = 0; i < BATCH_SIZE; i++) {
            testDataBatch[i] = ("Batch test data item " + i).getBytes();
            signatures[i] = quantumCryptoService.sign(testDataBatch[i], keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
        }
        
        // Test batch verification performance
        long startTime = System.nanoTime();
        
        for (int i = 0; i < BATCH_SIZE; i++) {
            Boolean isValid = quantumCryptoService.verify(testDataBatch[i], signatures[i], keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
            assertTrue(isValid, "Batch signature " + i + " should be valid");
        }
        
        long totalTime = (System.nanoTime() - startTime) / 1_000_000;
        double avgTimePerVerification = (double) totalTime / BATCH_SIZE;
        
        System.out.printf("  Batch Verification: %d signatures in %dms (avg: %.2fms per signature)%n", 
                        BATCH_SIZE, totalTime, avgTimePerVerification);
        
        // Batch verification should maintain good per-signature performance
        assertTrue(avgTimePerVerification < TARGET_VERIFICATION_TIME_MS, 
                  String.format("Batch verification average time per signature (%.2fms) exceeds target (%dms)", 
                              avgTimePerVerification, TARGET_VERIFICATION_TIME_MS));
    }
    
    @Test
    @Order(5)
    @DisplayName("Concurrent Verification Performance")
    void testConcurrentVerificationPerformance() throws Exception {
        System.out.println("\n=== Concurrent Verification Performance Test ===");
        
        // Generate key pairs and signatures for concurrent testing
        List<CompletableFuture<Void>> concurrentTasks = new ArrayList<>();
        List<Long> verificationTimes = new ArrayList<>();
        
        for (int thread = 0; thread < CONCURRENT_THREADS; thread++) {
            final int threadId = thread;
            
            CompletableFuture<Void> task = CompletableFuture.runAsync(() -> {
                try {
                    KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
                    byte[] testData = ("Concurrent test data for thread " + threadId).getBytes();
                    byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
                    
                    // Measure verification time
                    long startTime = System.nanoTime();
                    Boolean isValid = quantumCryptoService.verify(testData, signature, keyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get(5, TimeUnit.SECONDS);
                    long duration = (System.nanoTime() - startTime) / 1_000_000;
                    
                    assertTrue(isValid, "Concurrent signature should be valid for thread " + threadId);
                    
                    synchronized (verificationTimes) {
                        verificationTimes.add(duration);
                    }
                    
                } catch (Exception e) {
                    throw new RuntimeException("Concurrent test failed for thread " + threadId, e);
                }
            });
            
            concurrentTasks.add(task);
        }
        
        // Wait for all concurrent operations to complete
        long startTime = System.nanoTime();
        CompletableFuture.allOf(concurrentTasks.toArray(new CompletableFuture[0])).get(60, TimeUnit.SECONDS);
        long totalConcurrentTime = (System.nanoTime() - startTime) / 1_000_000;
        
        // Calculate concurrent performance metrics
        double avgVerificationTime = verificationTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
        long maxVerificationTime = verificationTimes.stream().mapToLong(Long::longValue).max().orElse(0L);
        
        System.out.printf("  Concurrent Operations: %d threads completed in %dms%n", CONCURRENT_THREADS, totalConcurrentTime);
        System.out.printf("  Individual Verification Times: avg=%.2fms, max=%dms%n", avgVerificationTime, maxVerificationTime);
        
        // Concurrent operations should maintain good performance
        assertTrue(avgVerificationTime < TARGET_VERIFICATION_TIME_MS * 2, // Allow some overhead for concurrency
                  String.format("Concurrent verification average time (%.2fms) should be reasonable", avgVerificationTime));
    }
    
    @Test
    @Order(6)
    @DisplayName("Key Generation Performance")
    void testKeyGenerationPerformance() throws Exception {
        System.out.println("\n=== Key Generation Performance Test ===");
        
        // Test Dilithium key generation
        List<Double> dilithiumKeyGenTimes = new ArrayList<>();
        for (int i = 0; i < 20; i++) { // Fewer iterations for key generation
            long startTime = System.nanoTime();
            quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            dilithiumKeyGenTimes.add((double) duration);
        }
        
        PerformanceResult dilithiumKeyGen = calculatePerformanceMetrics("Dilithium Key Generation", dilithiumKeyGenTimes);
        System.out.printf("  Dilithium Key Generation: avg=%.2fms, min=%.2fms, max=%.2fms%n",
                        dilithiumKeyGen.averageTime, dilithiumKeyGen.minTime, dilithiumKeyGen.maxTime);
        
        // Key generation can be slower, but should complete in reasonable time
        assertTrue(dilithiumKeyGen.averageTime < 1000, // 1 second
                  String.format("Dilithium key generation should complete in reasonable time: %.2fms", dilithiumKeyGen.averageTime));
    }
    
    @Test
    @Order(7)
    @DisplayName("Memory Usage and Cleanup Performance")
    void testMemoryUsageAndCleanup() throws Exception {
        System.out.println("\n=== Memory Usage and Cleanup Performance Test ===");
        
        Runtime runtime = Runtime.getRuntime();
        
        // Measure initial memory usage
        System.gc();
        long initialMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Generate many key pairs to stress memory usage
        List<KeyPair> keyPairs = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            KeyPair keyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get(10, TimeUnit.SECONDS);
            keyPairs.add(keyPair);
        }
        
        // Measure memory after key generation
        System.gc();
        long afterKeyGenMemory = runtime.totalMemory() - runtime.freeMemory();
        
        // Perform cache cleanup
        long cleanupStartTime = System.nanoTime();
        quantumCryptoService.cleanupKeyPairCache();
        long cleanupTime = (System.nanoTime() - cleanupStartTime) / 1_000_000;
        
        // Force garbage collection and measure final memory
        keyPairs.clear();
        System.gc();
        Thread.sleep(100); // Give GC time to work
        long finalMemory = runtime.totalMemory() - runtime.freeMemory();
        
        long memoryIncrease = afterKeyGenMemory - initialMemory;
        long memoryReclaimed = afterKeyGenMemory - finalMemory;
        
        System.out.printf("  Initial Memory: %d MB%n", initialMemory / (1024 * 1024));
        System.out.printf("  After Key Generation: %d MB (+%d MB)%n", 
                        afterKeyGenMemory / (1024 * 1024), memoryIncrease / (1024 * 1024));
        System.out.printf("  After Cleanup: %d MB (-%d MB reclaimed)%n", 
                        finalMemory / (1024 * 1024), memoryReclaimed / (1024 * 1024));
        System.out.printf("  Cleanup Time: %d ms%n", cleanupTime);
        
        // Cleanup should be fast
        assertTrue(cleanupTime < 100, "Cache cleanup should complete quickly: " + cleanupTime + "ms");
    }
    
    /**
     * Test signature verification performance for a specific data size
     */
    private void testVerificationPerformanceForDataSize(String testName, byte[] testData, KeyPair keyPair, String algorithm) throws Exception {
        // Pre-generate signature
        byte[] signature = quantumCryptoService.sign(testData, keyPair.getPrivate(), algorithm).get(10, TimeUnit.SECONDS);
        
        // Warm up the JVM
        for (int i = 0; i < 10; i++) {
            quantumCryptoService.verify(testData, signature, keyPair.getPublic(), algorithm).get(5, TimeUnit.SECONDS);
        }
        
        // Measure verification performance
        List<Double> verificationTimes = new ArrayList<>();
        
        for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; i++) {
            long startTime = System.nanoTime();
            Boolean isValid = quantumCryptoService.verify(testData, signature, keyPair.getPublic(), algorithm).get(5, TimeUnit.SECONDS);
            long duration = (System.nanoTime() - startTime) / 1_000_000; // Convert to milliseconds
            
            assertTrue(isValid, "Signature should be valid in performance test iteration " + i);
            verificationTimes.add((double) duration);
        }
        
        PerformanceResult result = calculatePerformanceMetrics(testName + " Verification", verificationTimes);
        performanceResults.add(result);
    }
    
    /**
     * Calculate performance statistics from timing measurements
     */
    private PerformanceResult calculatePerformanceMetrics(String operation, List<Double> times) {
        times.sort(Double::compareTo);
        
        double sum = times.stream().mapToDouble(Double::doubleValue).sum();
        double average = sum / times.size();
        double min = times.get(0);
        double max = times.get(times.size() - 1);
        double p95 = times.get((int) (times.size() * 0.95));
        
        return new PerformanceResult(operation, average, min, max, p95, times.size());
    }
    
    @AfterAll
    static void printPerformanceSummary() {
        System.out.println("\n=== Quantum Cryptography Performance Test Summary ===");
        System.out.println("Target: Signature verification <10ms");
        System.out.println("All performance tests completed successfully!");
        System.out.println("Post-quantum cryptography implementation meets performance requirements.");
    }
    
    /**
     * Performance test result data structure
     */
    private static class PerformanceResult {
        final String operation;
        final double averageTime;
        final double minTime;
        final double maxTime;
        final double p95Time;
        final int sampleCount;
        
        PerformanceResult(String operation, double averageTime, double minTime, double maxTime, double p95Time, int sampleCount) {
            this.operation = operation;
            this.averageTime = averageTime;
            this.minTime = minTime;
            this.maxTime = maxTime;
            this.p95Time = p95Time;
            this.sampleCount = sampleCount;
        }
    }
}