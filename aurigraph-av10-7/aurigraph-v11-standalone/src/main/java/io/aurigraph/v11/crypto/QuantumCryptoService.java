package io.aurigraph.v11.crypto;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.pqc.jcajce.provider.BouncyCastlePQCProvider;
import org.jboss.logging.Logger;

import java.security.Security;
import java.security.SecureRandom;
import java.security.KeyPair;
import java.security.PublicKey;
import java.security.PrivateKey;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.time.Instant;
import java.time.Duration;

/**
 * Quantum-Resistant Cryptographic Service for Aurigraph V11
 * 
 * Provides post-quantum cryptographic operations including:
 * - CRYSTALS-Kyber key encapsulation (NIST Level 5)
 * - CRYSTALS-Dilithium digital signatures
 * - SPHINCS+ hash-based signatures
 * - Hardware Security Module integration
 * 
 * Performance Target: <10ms signature verification
 * Security Level: NIST Level 5 quantum resistance
 */
@ApplicationScoped
public class QuantumCryptoService {
    
    private static final Logger LOG = Logger.getLogger(QuantumCryptoService.class);
    
    // Post-quantum algorithm constants
    public static final String KYBER_1024 = "Kyber1024";
    public static final String DILITHIUM_5 = "Dilithium5";
    public static final String SPHINCS_PLUS_256f = "SPHINCS+-SHA2-256f-robust";
    
    // Performance monitoring
    private final ConcurrentHashMap<String, Long> operationMetrics = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, KeyPair> keyPairCache = new ConcurrentHashMap<>();
    
    // Injected services
    @Inject
    KyberKeyManager kyberKeyManager;
    
    @Inject
    DilithiumSignatureService dilithiumSignatureService;
    
    @Inject
    SphincsPlusService sphincsPlusService;
    
    @Inject
    HSMIntegration hsmIntegration;
    
    // Secure random generator
    private SecureRandom secureRandom;
    
    /**
     * Initialize quantum cryptographic providers and services
     */
    public void initialize() {
        long startTime = System.nanoTime();
        
        try {
            // Add BouncyCastle providers
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            if (Security.getProvider("BCPQC") == null) {
                Security.addProvider(new BouncyCastlePQCProvider());
            }
            
            // Initialize secure random with quantum entropy if available
            secureRandom = SecureRandom.getInstanceStrong();
            
            // Initialize component services
            kyberKeyManager.initialize();
            dilithiumSignatureService.initialize();
            sphincsPlusService.initialize();
            hsmIntegration.initialize();
            
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            LOG.info("QuantumCryptoService initialized in " + duration + "ms");
            
        } catch (Exception e) {
            LOG.error("Failed to initialize QuantumCryptoService", e);
            throw new RuntimeException("Quantum crypto initialization failed", e);
        }
    }
    
    /**
     * Generate a new quantum-resistant key pair for the specified algorithm
     * 
     * @param algorithm The post-quantum algorithm (KYBER_1024, DILITHIUM_5, SPHINCS_PLUS_256f)
     * @return CompletableFuture containing the generated key pair
     */
    public CompletableFuture<KeyPair> generateKeyPair(String algorithm) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                KeyPair keyPair;
                String cacheKey = algorithm + "_" + System.currentTimeMillis();
                
                switch (algorithm) {
                    case KYBER_1024:
                        keyPair = kyberKeyManager.generateKeyPair();
                        break;
                    case DILITHIUM_5:
                        keyPair = dilithiumSignatureService.generateKeyPair();
                        break;
                    case SPHINCS_PLUS_256f:
                        keyPair = sphincsPlusService.generateKeyPair();
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported quantum algorithm: " + algorithm);
                }
                
                // Cache the key pair for performance
                keyPairCache.put(cacheKey, keyPair);
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                recordMetric("keyGeneration_" + algorithm, duration);
                
                LOG.debug("Generated " + algorithm + " key pair in " + duration + "ms");
                return keyPair;
                
            } catch (Exception e) {
                LOG.error("Key pair generation failed for " + algorithm, e);
                throw new RuntimeException("Key generation failed", e);
            }
        });
    }
    
    /**
     * Sign data using quantum-resistant digital signature
     * 
     * @param data The data to sign
     * @param privateKey The private key for signing
     * @param algorithm The signature algorithm
     * @return CompletableFuture containing the signature
     */
    public CompletableFuture<byte[]> sign(byte[] data, PrivateKey privateKey, String algorithm) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                byte[] signature;
                
                switch (algorithm) {
                    case DILITHIUM_5:
                        signature = dilithiumSignatureService.sign(data, privateKey);
                        break;
                    case SPHINCS_PLUS_256f:
                        signature = sphincsPlusService.sign(data, privateKey);
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported signature algorithm: " + algorithm);
                }
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                recordMetric("signing_" + algorithm, duration);
                
                if (duration > 10) {
                    LOG.warn("Signing operation exceeded 10ms target: " + duration + "ms for " + algorithm);
                }
                
                LOG.debug("Signed data with " + algorithm + " in " + duration + "ms");
                return signature;
                
            } catch (Exception e) {
                LOG.error("Signing failed with " + algorithm, e);
                throw new RuntimeException("Signing operation failed", e);
            }
        });
    }
    
    /**
     * Verify quantum-resistant digital signature
     * 
     * @param data The original data
     * @param signature The signature to verify
     * @param publicKey The public key for verification
     * @param algorithm The signature algorithm
     * @return CompletableFuture containing verification result
     */
    public CompletableFuture<Boolean> verify(byte[] data, byte[] signature, PublicKey publicKey, String algorithm) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                boolean isValid;
                
                switch (algorithm) {
                    case DILITHIUM_5:
                        isValid = dilithiumSignatureService.verify(data, signature, publicKey);
                        break;
                    case SPHINCS_PLUS_256f:
                        isValid = sphincsPlusService.verify(data, signature, publicKey);
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported verification algorithm: " + algorithm);
                }
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                recordMetric("verification_" + algorithm, duration);
                
                if (duration > 10) {
                    LOG.warn("Verification exceeded 10ms target: " + duration + "ms for " + algorithm);
                }
                
                LOG.debug("Verified signature with " + algorithm + " in " + duration + "ms, result: " + isValid);
                return isValid;
                
            } catch (Exception e) {
                LOG.error("Signature verification failed with " + algorithm, e);
                return false;
            }
        });
    }
    
    /**
     * Perform key encapsulation using CRYSTALS-Kyber
     * 
     * @param publicKey The recipient's public key
     * @return CompletableFuture containing encapsulation result (ciphertext + shared secret)
     */
    public CompletableFuture<KyberEncapsulationResult> encapsulate(PublicKey publicKey) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                KyberEncapsulationResult result = kyberKeyManager.encapsulate(publicKey);
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                recordMetric("encapsulation_kyber", duration);
                
                LOG.debug("Key encapsulation completed in " + duration + "ms");
                return result;
                
            } catch (Exception e) {
                LOG.error("Key encapsulation failed", e);
                throw new RuntimeException("Encapsulation failed", e);
            }
        });
    }
    
    /**
     * Perform key decapsulation using CRYSTALS-Kyber
     * 
     * @param ciphertext The encapsulated key
     * @param privateKey The recipient's private key
     * @return CompletableFuture containing the shared secret
     */
    public CompletableFuture<byte[]> decapsulate(byte[] ciphertext, PrivateKey privateKey) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                byte[] sharedSecret = kyberKeyManager.decapsulate(ciphertext, privateKey);
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                recordMetric("decapsulation_kyber", duration);
                
                LOG.debug("Key decapsulation completed in " + duration + "ms");
                return sharedSecret;
                
            } catch (Exception e) {
                LOG.error("Key decapsulation failed", e);
                throw new RuntimeException("Decapsulation failed", e);
            }
        });
    }
    
    /**
     * Generate secure random bytes for cryptographic operations
     * 
     * @param size The number of random bytes to generate
     * @return Cryptographically secure random bytes
     */
    public byte[] generateSecureRandom(int size) {
        byte[] randomBytes = new byte[size];
        secureRandom.nextBytes(randomBytes);
        return randomBytes;
    }
    
    /**
     * Get cryptographic service metrics
     * 
     * @return Map of operation metrics
     */
    public Map<String, CryptoMetrics> getMetrics() {
        Map<String, CryptoMetrics> metrics = new ConcurrentHashMap<>();
        
        for (Map.Entry<String, Long> entry : operationMetrics.entrySet()) {
            String operation = entry.getKey();
            Long totalTime = entry.getValue();
            
            // Calculate average time (simplified - in production would track count)
            metrics.put(operation, new CryptoMetrics(
                operation,
                totalTime,
                1L, // count
                totalTime, // average time
                Instant.now()
            ));
        }
        
        return metrics;
    }
    
    /**
     * Check if HSM is available and operational
     * 
     * @return true if HSM is available
     */
    public boolean isHSMAvailable() {
        return hsmIntegration.isAvailable();
    }
    
    /**
     * Perform cryptographic operation using HSM if available
     * 
     * @param operation The HSM operation to perform
     * @param data The operation data
     * @return CompletableFuture containing the HSM operation result
     */
    public CompletableFuture<byte[]> performHSMOperation(String operation, byte[] data) {
        if (!isHSMAvailable()) {
            return CompletableFuture.failedFuture(new RuntimeException("HSM not available"));
        }
        
        return hsmIntegration.performOperation(operation, data);
    }
    
    /**
     * Clean up expired key pairs from cache
     */
    public void cleanupKeyPairCache() {
        int sizeBefore = keyPairCache.size();
        long cutoffTime = System.currentTimeMillis() - Duration.ofHours(24).toMillis();
        
        keyPairCache.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            try {
                long timestamp = Long.parseLong(key.substring(key.lastIndexOf('_') + 1));
                return timestamp < cutoffTime;
            } catch (NumberFormatException e) {
                return true; // Remove invalid entries
            }
        });
        
        int sizeAfter = keyPairCache.size();
        LOG.debug("Key pair cache cleanup: " + sizeBefore + " -> " + sizeAfter + " entries");
    }
    
    /**
     * Record performance metrics for operations
     */
    private void recordMetric(String operation, long duration) {
        operationMetrics.merge(operation, duration, Long::sum);
        
        // Log warning if operation exceeds performance targets
        if (operation.startsWith("verification_") && duration > 10) {
            LOG.warn("Verification operation exceeded 10ms target: " + duration + "ms for " + operation);
        } else if (operation.startsWith("signing_") && duration > 50) {
            LOG.warn("Signing operation took longer than expected: " + duration + "ms for " + operation);
        }
    }
    
    /**
     * Shutdown the quantum crypto service
     */
    public void shutdown() {
        try {
            kyberKeyManager.shutdown();
            dilithiumSignatureService.shutdown();
            sphincsPlusService.shutdown();
            hsmIntegration.shutdown();
            
            keyPairCache.clear();
            operationMetrics.clear();
            
            LOG.info("QuantumCryptoService shutdown completed");
            
        } catch (Exception e) {
            LOG.error("Error during QuantumCryptoService shutdown", e);
        }
    }
    
    /**
     * Cryptographic operation metrics
     */
    public static class CryptoMetrics {
        private final String operation;
        private final Long totalTime;
        private final Long count;
        private final Long averageTime;
        private final Instant timestamp;
        
        public CryptoMetrics(String operation, Long totalTime, Long count, Long averageTime, Instant timestamp) {
            this.operation = operation;
            this.totalTime = totalTime;
            this.count = count;
            this.averageTime = averageTime;
            this.timestamp = timestamp;
        }
        
        public String getOperation() { return operation; }
        public Long getTotalTime() { return totalTime; }
        public Long getCount() { return count; }
        public Long getAverageTime() { return averageTime; }
        public Instant getTimestamp() { return timestamp; }
    }
    
    /**
     * Kyber key encapsulation result
     */
    public static class KyberEncapsulationResult {
        private final byte[] ciphertext;
        private final byte[] sharedSecret;
        
        public KyberEncapsulationResult(byte[] ciphertext, byte[] sharedSecret) {
            this.ciphertext = ciphertext;
            this.sharedSecret = sharedSecret;
        }
        
        public byte[] getCiphertext() { return ciphertext; }
        public byte[] getSharedSecret() { return sharedSecret; }
    }
}