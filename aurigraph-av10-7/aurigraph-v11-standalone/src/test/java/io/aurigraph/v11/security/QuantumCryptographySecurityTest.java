package io.aurigraph.v11.security;

import io.aurigraph.v11.crypto.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import jakarta.inject.Inject;
import java.security.KeyPair;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Security Tests for Quantum Cryptography Implementation
 * 
 * Validates security properties of quantum-resistant cryptographic operations:
 * - CRYSTALS-Dilithium signature security and authenticity
 * - CRYSTALS-Kyber key encapsulation security
 * - Input validation and sanitization effectiveness
 * - Rate limiting and DDoS protection mechanisms
 * - Threat detection capabilities
 * - Cryptographic attack resistance
 * 
 * Security Requirements:
 * - NIST Level 5 quantum resistance
 * - Zero false positives in signature verification
 * - Comprehensive input validation coverage
 * - Resistance to timing attacks
 * - Protection against malicious inputs
 */
@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class QuantumCryptographySecurityTest {
    
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    @Inject
    DilithiumSignatureService dilithiumSignatureService;
    
    @Inject
    KyberKeyManager kyberKeyManager;
    
    @Inject
    SecurityValidator securityValidator;
    
    @Inject
    SecurityConfiguration securityConfiguration;
    
    private KeyPair testKeyPair;
    private KeyPair kyberKeyPair;
    private static final String TEST_DATA = "Aurigraph V11 Security Test Data";
    private static final int SECURITY_TEST_ITERATIONS = 1000;
    
    @BeforeEach
    void setUp() {
        try {
            // Initialize all security services
            quantumCryptoService.initialize();
            dilithiumSignatureService.initialize();
            kyberKeyManager.initialize();
            securityValidator.initialize();
            
            // Generate test key pairs
            testKeyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            kyberKeyPair = kyberKeyManager.generateKeyPair();
            
            assertNotNull(testKeyPair, "Test key pair should be generated");
            assertNotNull(kyberKeyPair, "Kyber key pair should be generated");
            
        } catch (Exception e) {
            fail("Security test setup failed: " + e.getMessage());
        }
    }
    
    @Test
    void testSignatureAuthenticity() {
        System.out.println("Testing signature authenticity and non-repudiation...");
        
        try {
            byte[] testData = TEST_DATA.getBytes();
            
            // Generate signature
            byte[] signature = quantumCryptoService.sign(testData, testKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
            assertNotNull(signature, "Signature should be generated");
            assertTrue(signature.length > 0, "Signature should not be empty");
            
            // Verify authentic signature
            boolean isValid = quantumCryptoService.verify(testData, signature, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            assertTrue(isValid, "Authentic signature should verify successfully");
            
            // Test signature uniqueness - same data should produce different signatures
            byte[] signature2 = quantumCryptoService.sign(testData, testKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
            assertFalse(Arrays.equals(signature, signature2), "Signatures should be unique due to randomness");
            
            // Both signatures should still verify
            boolean isValid2 = quantumCryptoService.verify(testData, signature2, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            assertTrue(isValid2, "Second signature should also verify successfully");
            
        } catch (Exception e) {
            fail("Signature authenticity test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testSignatureTampering() {
        System.out.println("Testing signature tampering detection...");
        
        try {
            byte[] originalData = TEST_DATA.getBytes();
            byte[] signature = quantumCryptoService.sign(originalData, testKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
            
            // Test 1: Modified data should fail verification
            byte[] modifiedData = (TEST_DATA + "_modified").getBytes();
            boolean isValidModified = quantumCryptoService.verify(modifiedData, signature, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            assertFalse(isValidModified, "Modified data should fail signature verification");
            
            // Test 2: Corrupted signature should fail verification
            byte[] corruptedSignature = signature.clone();
            corruptedSignature[corruptedSignature.length / 2] ^= 0xFF; // Flip bits in middle
            boolean isValidCorrupted = quantumCryptoService.verify(originalData, corruptedSignature, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            assertFalse(isValidCorrupted, "Corrupted signature should fail verification");
            
            // Test 3: Wrong public key should fail verification
            KeyPair wrongKeyPair = quantumCryptoService.generateKeyPair(QuantumCryptoService.DILITHIUM_5).get();
            boolean isValidWrongKey = quantumCryptoService.verify(originalData, signature, wrongKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
            assertFalse(isValidWrongKey, "Wrong public key should fail signature verification");
            
            // Test 4: Multiple bit flips in signature
            for (int i = 0; i < 10; i++) {
                byte[] multiCorrupted = signature.clone();
                for (int j = 0; j < 5; j++) {
                    int index = ThreadLocalRandom.current().nextInt(multiCorrupted.length);
                    multiCorrupted[index] ^= (byte) ThreadLocalRandom.current().nextInt(256);
                }
                
                boolean isValidMultiCorrupted = quantumCryptoService.verify(originalData, multiCorrupted, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                assertFalse(isValidMultiCorrupted, "Multi-bit corrupted signature should fail verification");
            }
            
        } catch (Exception e) {
            fail("Signature tampering test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testKeyEncapsulationSecurity() {
        System.out.println("Testing key encapsulation security properties...");
        
        try {
            // Test 1: Encapsulation should produce different results for same key
            QuantumCryptoService.KyberEncapsulationResult result1 = kyberKeyManager.encapsulate(kyberKeyPair.getPublic());
            QuantumCryptoService.KyberEncapsulationResult result2 = kyberKeyManager.encapsulate(kyberKeyPair.getPublic());
            
            assertNotNull(result1.getCiphertext(), "First encapsulation ciphertext should not be null");
            assertNotNull(result2.getCiphertext(), "Second encapsulation ciphertext should not be null");
            assertFalse(Arrays.equals(result1.getCiphertext(), result2.getCiphertext()), 
                       "Encapsulation should produce different ciphertexts");
            assertFalse(Arrays.equals(result1.getSharedSecret(), result2.getSharedSecret()), 
                       "Encapsulation should produce different shared secrets");
            
            // Test 2: Decapsulation should recover correct shared secrets
            byte[] recoveredSecret1 = kyberKeyManager.decapsulate(result1.getCiphertext(), kyberKeyPair.getPrivate());
            byte[] recoveredSecret2 = kyberKeyManager.decapsulate(result2.getCiphertext(), kyberKeyPair.getPrivate());
            
            assertTrue(Arrays.equals(result1.getSharedSecret(), recoveredSecret1), 
                      "First shared secret should be correctly recovered");
            assertTrue(Arrays.equals(result2.getSharedSecret(), recoveredSecret2), 
                      "Second shared secret should be correctly recovered");
            
            // Test 3: Wrong private key should not recover shared secret
            KeyPair wrongKeyPair = kyberKeyManager.generateKeyPair();
            byte[] wrongRecovered = kyberKeyManager.decapsulate(result1.getCiphertext(), wrongKeyPair.getPrivate());
            assertFalse(Arrays.equals(result1.getSharedSecret(), wrongRecovered), 
                       "Wrong private key should not recover correct shared secret");
            
            // Test 4: Corrupted ciphertext should not recover shared secret
            byte[] corruptedCiphertext = result1.getCiphertext().clone();
            corruptedCiphertext[corruptedCiphertext.length / 2] ^= 0xFF;
            byte[] corruptedRecovered = kyberKeyManager.decapsulate(corruptedCiphertext, kyberKeyPair.getPrivate());
            assertFalse(Arrays.equals(result1.getSharedSecret(), corruptedRecovered), 
                       "Corrupted ciphertext should not recover correct shared secret");
            
        } catch (Exception e) {
            fail("Key encapsulation security test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testInputValidationSecurity() {
        System.out.println("Testing input validation security mechanisms...");
        
        // Test malicious SQL injection patterns
        String[] sqlInjectionInputs = {
            "'; DROP TABLE users; --",
            "1 OR 1=1",
            "UNION SELECT * FROM passwords",
            "'; EXEC xp_cmdshell('rm -rf /'); --"
        };
        
        for (String maliciousInput : sqlInjectionInputs) {
            SecurityValidator.ValidationResult result = securityValidator.validateAndSanitize(
                maliciousInput, SecurityValidator.InputType.GENERAL_TEXT, SecurityValidator.ValidationContext.API_REQUEST);
            assertFalse(result.isValid(), "SQL injection pattern should be detected: " + maliciousInput);
            assertTrue(result.isThreatDetected(), "Threat should be detected for: " + maliciousInput);
        }
        
        // Test XSS patterns
        String[] xssInputs = {
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "onload=\"alert('xss')\"",
            "<iframe src=\"javascript:alert('xss')\"></iframe>"
        };
        
        for (String xssInput : xssInputs) {
            SecurityValidator.ValidationResult result = securityValidator.validateAndSanitize(
                xssInput, SecurityValidator.InputType.GENERAL_TEXT, SecurityValidator.ValidationContext.API_REQUEST);
            assertFalse(result.isValid(), "XSS pattern should be detected: " + xssInput);
            assertTrue(result.isThreatDetected(), "Threat should be detected for: " + xssInput);
        }
        
        // Test command injection patterns
        String[] commandInjectionInputs = {
            "; cat /etc/passwd",
            "| rm -rf /",
            "&& shutdown -h now",
            "`whoami`",
            "$(cat /etc/shadow)"
        };
        
        for (String cmdInput : commandInjectionInputs) {
            SecurityValidator.ValidationResult result = securityValidator.validateAndSanitize(
                cmdInput, SecurityValidator.InputType.GENERAL_TEXT, SecurityValidator.ValidationContext.API_REQUEST);
            assertFalse(result.isValid(), "Command injection pattern should be detected: " + cmdInput);
            assertTrue(result.isThreatDetected(), "Threat should be detected for: " + cmdInput);
        }
    }
    
    @Test
    void testRateLimitingSecurity() {
        System.out.println("Testing rate limiting and DDoS protection...");
        
        String testIP = "192.168.1.100";
        String testEndpoint = "/api/v11/test";
        
        // Test normal operation within limits
        for (int i = 0; i < 100; i++) {
            boolean isRateLimited = securityConfiguration.isRateLimited(testIP, testEndpoint);
            if (i < 50) {
                assertFalse(isRateLimited, "Normal requests should not be rate limited");
            }
        }
        
        // Test rate limiting kicks in for excessive requests
        int consecutiveBlocked = 0;
        for (int i = 0; i < 1000; i++) {
            boolean isRateLimited = securityConfiguration.isRateLimited(testIP, testEndpoint);
            if (isRateLimited) {
                consecutiveBlocked++;
            }
        }
        
        assertTrue(consecutiveBlocked > 100, "Rate limiting should block excessive requests");
        
        // Test different IPs are handled independently
        String differentIP = "192.168.1.101";
        boolean isDifferentIPLimited = securityConfiguration.isRateLimited(differentIP, testEndpoint);
        assertFalse(isDifferentIPLimited, "Different IP should not be affected by other IP's rate limit");
    }
    
    @Test
    void testCryptographicRandomness() {
        System.out.println("Testing cryptographic randomness quality...");
        
        try {
            List<byte[]> signatures = new ArrayList<>();
            List<byte[]> sharedSecrets = new ArrayList<>();
            
            // Generate multiple signatures and shared secrets
            for (int i = 0; i < SECURITY_TEST_ITERATIONS; i++) {
                // Test signature randomness
                byte[] signature = quantumCryptoService.sign(TEST_DATA.getBytes(), testKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
                signatures.add(signature);
                
                // Test key encapsulation randomness
                QuantumCryptoService.KyberEncapsulationResult result = kyberKeyManager.encapsulate(kyberKeyPair.getPublic());
                sharedSecrets.add(result.getSharedSecret());
            }
            
            // Test signature uniqueness
            for (int i = 0; i < signatures.size(); i++) {
                for (int j = i + 1; j < signatures.size(); j++) {
                    assertFalse(Arrays.equals(signatures.get(i), signatures.get(j)), 
                               "Signatures should be unique due to cryptographic randomness");
                }
            }
            
            // Test shared secret uniqueness
            for (int i = 0; i < sharedSecrets.size(); i++) {
                for (int j = i + 1; j < sharedSecrets.size(); j++) {
                    assertFalse(Arrays.equals(sharedSecrets.get(i), sharedSecrets.get(j)), 
                               "Shared secrets should be unique due to cryptographic randomness");
                }
            }
            
            // Test entropy of generated data
            byte[] combinedData = new byte[sharedSecrets.size() * 32];
            for (int i = 0; i < sharedSecrets.size(); i++) {
                System.arraycopy(sharedSecrets.get(i), 0, combinedData, i * 32, 32);
            }
            
            double entropy = calculateShannonEntropy(combinedData);
            assertTrue(entropy > 7.0, "Cryptographic randomness should have high entropy: " + entropy);
            
        } catch (Exception e) {
            fail("Cryptographic randomness test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testTimingAttackResistance() {
        System.out.println("Testing timing attack resistance...");
        
        try {
            byte[] validData = TEST_DATA.getBytes();
            byte[] invalidData = (TEST_DATA + "_invalid").getBytes();
            byte[] signature = quantumCryptoService.sign(validData, testKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
            
            List<Long> validTimes = new ArrayList<>();
            List<Long> invalidTimes = new ArrayList<>();
            
            // Measure verification times for valid signatures
            for (int i = 0; i < 100; i++) {
                long start = System.nanoTime();
                quantumCryptoService.verify(validData, signature, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                long duration = System.nanoTime() - start;
                validTimes.add(duration);
            }
            
            // Measure verification times for invalid signatures
            for (int i = 0; i < 100; i++) {
                long start = System.nanoTime();
                quantumCryptoService.verify(invalidData, signature, testKeyPair.getPublic(), QuantumCryptoService.DILITHIUM_5).get();
                long duration = System.nanoTime() - start;
                invalidTimes.add(duration);
            }
            
            // Calculate timing statistics
            double avgValidTime = validTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double avgInvalidTime = invalidTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
            double timingDifference = Math.abs(avgValidTime - avgInvalidTime) / Math.max(avgValidTime, avgInvalidTime);
            
            System.out.printf("Timing Analysis Results:%n");
            System.out.printf("  Average valid verification time: %.2f ns%n", avgValidTime);
            System.out.printf("  Average invalid verification time: %.2f ns%n", avgInvalidTime);
            System.out.printf("  Timing difference percentage: %.2f%%%n", timingDifference * 100);
            
            // Timing difference should be minimal to prevent timing attacks
            assertTrue(timingDifference < 0.1, "Timing difference should be less than 10% to resist timing attacks");
            
        } catch (Exception e) {
            fail("Timing attack resistance test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testKeyValidationSecurity() {
        System.out.println("Testing key validation security...");
        
        try {
            // Test null key handling
            assertFalse(dilithiumSignatureService.validatePublicKey(null), "Null public key should be invalid");
            assertFalse(dilithiumSignatureService.validatePrivateKey(null), "Null private key should be invalid");
            
            // Test valid key validation
            assertTrue(dilithiumSignatureService.validatePublicKey(testKeyPair.getPublic()), "Valid public key should pass validation");
            assertTrue(dilithiumSignatureService.validatePrivateKey(testKeyPair.getPrivate()), "Valid private key should pass validation");
            
            // Test key format validation
            KeyPair validKeyPair = dilithiumSignatureService.generateKeyPair();
            assertTrue(dilithiumSignatureService.validatePublicKey(validKeyPair.getPublic()), "Generated public key should be valid");
            assertTrue(dilithiumSignatureService.validatePrivateKey(validKeyPair.getPrivate()), "Generated private key should be valid");
            
        } catch (Exception e) {
            fail("Key validation security test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testBatchOperationSecurity() {
        System.out.println("Testing batch operation security...");
        
        try {
            // Prepare batch test data
            List<byte[]> batchData = new ArrayList<>();
            for (int i = 0; i < 100; i++) {
                batchData.add((TEST_DATA + "_batch_" + i).getBytes());
            }
            
            // Test batch signing security
            List<byte[]> signatures = quantumCryptoService.batchSign(batchData, testKeyPair.getPrivate(), QuantumCryptoService.DILITHIUM_5).get();
            assertEquals(batchData.size(), signatures.size(), "Batch signing should produce correct number of signatures");
            
            // Verify all signatures are unique
            for (int i = 0; i < signatures.size(); i++) {
                for (int j = i + 1; j < signatures.size(); j++) {
                    assertFalse(Arrays.equals(signatures.get(i), signatures.get(j)), 
                               "Batch signatures should be unique");
                }
            }
            
            // Test batch verification security
            List<Boolean> verificationResults = quantumCryptoService.batchVerify(
                batchData, signatures, 
                batchData.stream().map(data -> testKeyPair.getPublic()).toList(), 
                QuantumCryptoService.DILITHIUM_5).get();
            
            assertTrue(verificationResults.stream().allMatch(result -> result), 
                      "All batch signatures should verify successfully");
            
            // Test batch verification with tampered data
            List<byte[]> tamperedData = new ArrayList<>(batchData);
            tamperedData.set(50, (TEST_DATA + "_tampered").getBytes()); // Tamper with one item
            
            List<Boolean> tamperedResults = quantumCryptoService.batchVerify(
                tamperedData, signatures,
                tamperedData.stream().map(data -> testKeyPair.getPublic()).toList(),
                QuantumCryptoService.DILITHIUM_5).get();
            
            // Tampered item should fail verification
            assertFalse(tamperedResults.get(50), "Tampered data item should fail verification");
            
            // Other items should still pass
            for (int i = 0; i < tamperedResults.size(); i++) {
                if (i != 50) {
                    assertTrue(tamperedResults.get(i), "Non-tampered items should still verify successfully");
                }
            }
            
        } catch (Exception e) {
            fail("Batch operation security test failed: " + e.getMessage());
        }
    }
    
    @Test
    void testSecurityMetricsValidation() {
        System.out.println("Testing security metrics and monitoring...");
        
        try {
            // Generate some activity for metrics
            for (int i = 0; i < 50; i++) {
                // Valid operations
                securityValidator.validateAndSanitize("valid-input-" + i, 
                    SecurityValidator.InputType.GENERAL_TEXT, SecurityValidator.ValidationContext.API_REQUEST);
                
                // Some malicious inputs
                if (i % 10 == 0) {
                    securityValidator.validateAndSanitize("<script>alert('xss')</script>", 
                        SecurityValidator.InputType.GENERAL_TEXT, SecurityValidator.ValidationContext.API_REQUEST);
                }
            }
            
            // Check security metrics
            SecurityValidator.ValidationMetrics metrics = securityValidator.getMetrics();
            assertTrue(metrics.totalValidations() > 0, "Total validations should be tracked");
            assertTrue(metrics.threatDetections() > 0, "Threat detections should be recorded");
            assertTrue(metrics.getSuccessRate() > 0, "Success rate should be calculated");
            assertTrue(metrics.getThreatDetectionRate() >= 0, "Threat detection rate should be calculated");
            
            String securityStatus = metrics.getSecurityStatus();
            assertNotNull(securityStatus, "Security status should be determined");
            assertTrue(List.of("excellent", "good", "fair", "critical").contains(securityStatus), 
                      "Security status should be valid: " + securityStatus);
            
            // Check quantum crypto service health
            String cryptoHealth = quantumCryptoService.getHealthStatus();
            assertNotNull(cryptoHealth, "Crypto health status should be available");
            assertTrue(List.of("excellent", "good", "warning", "critical").contains(cryptoHealth), 
                      "Crypto health should be valid: " + cryptoHealth);
            
        } catch (Exception e) {
            fail("Security metrics validation test failed: " + e.getMessage());
        }
    }
    
    /**
     * Calculate Shannon entropy of byte array
     */
    private double calculateShannonEntropy(byte[] data) {
        int[] frequency = new int[256];
        for (byte b : data) {
            frequency[b & 0xFF]++;
        }
        
        double entropy = 0.0;
        int length = data.length;
        
        for (int freq : frequency) {
            if (freq > 0) {
                double probability = (double) freq / length;
                entropy -= probability * Math.log(probability) / Math.log(2);
            }
        }
        
        return entropy;
    }
}