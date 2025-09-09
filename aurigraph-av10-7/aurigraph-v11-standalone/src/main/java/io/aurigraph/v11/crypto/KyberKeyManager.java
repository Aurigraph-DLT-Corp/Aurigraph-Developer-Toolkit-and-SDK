package io.aurigraph.v11.crypto;

import jakarta.enterprise.context.ApplicationScoped;
import org.bouncycastle.pqc.jcajce.provider.BouncyCastlePQCProvider;
import org.bouncycastle.pqc.jcajce.spec.KyberParameterSpec;
import org.bouncycastle.pqc.jcajce.KEMGenerator;
import org.bouncycastle.pqc.jcajce.KEMExtractor;
import org.bouncycastle.pqc.crypto.util.SecretWithEncapsulationImpl;
import org.jboss.logging.Logger;

import javax.crypto.spec.SecretKeySpec;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * CRYSTALS-Kyber Key Encapsulation Mechanism Manager
 * 
 * Implements NIST Level 5 post-quantum key encapsulation using CRYSTALS-Kyber-1024
 * Provides high-performance key generation, encapsulation, and decapsulation operations
 * for quantum-resistant secure communications.
 * 
 * CRYSTALS-Kyber is a lattice-based KEM selected by NIST for standardization
 * offering security against quantum computer attacks.
 */
@ApplicationScoped
public class KyberKeyManager {
    
    private static final Logger LOG = Logger.getLogger(KyberKeyManager.class);
    
    // CRYSTALS-Kyber algorithm constants
    public static final String KYBER_ALGORITHM = "Kyber";
    public static final String PROVIDER = "BCPQC";
    
    // Kyber-1024 parameters (NIST Level 5)
    private static final KyberParameterSpec KYBER_1024 = KyberParameterSpec.kyber1024;
    
    // Key generators and extractors
    private KeyPairGenerator keyPairGenerator;
    private KEMGenerator kemGenerator;
    private final ConcurrentHashMap<String, KeyPair> keyPairCache = new ConcurrentHashMap<>();
    
    // Performance metrics
    private long keyGenerationCount = 0;
    private long encapsulationCount = 0;
    private long decapsulationCount = 0;
    private long totalKeyGenTime = 0;
    private long totalEncapsulationTime = 0;
    private long totalDecapsulationTime = 0;
    
    /**
     * Initialize Kyber key manager with NIST Level 5 parameters
     */
    public void initialize() {
        try {
            // Ensure BouncyCastle PQC provider is available
            if (Security.getProvider(PROVIDER) == null) {
                Security.addProvider(new BouncyCastlePQCProvider());
            }
            
            // Initialize Kyber key pair generator with NIST Level 5 parameters
            keyPairGenerator = KeyPairGenerator.getInstance(KYBER_ALGORITHM, PROVIDER);
            keyPairGenerator.initialize(KYBER_1024, new SecureRandom());
            
            // Initialize KEM generator for encapsulation operations
            kemGenerator = KEMGenerator.getInstance(KYBER_ALGORITHM, PROVIDER);
            
            LOG.info("KyberKeyManager initialized with CRYSTALS-Kyber-1024 (NIST Level 5)");
            
        } catch (Exception e) {
            LOG.error("Failed to initialize KyberKeyManager", e);
            throw new RuntimeException("Kyber initialization failed", e);
        }
    }
    
    /**
     * Generate a new CRYSTALS-Kyber-1024 key pair
     * 
     * @return Generated key pair for Level 5 quantum resistance
     */
    public KeyPair generateKeyPair() {
        long startTime = System.nanoTime();
        
        try {
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            
            // Cache the key pair for potential reuse
            String keyId = generateKeyId();
            keyPairCache.put(keyId, keyPair);
            
            // Update performance metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000; // Convert to milliseconds
            synchronized (this) {
                keyGenerationCount++;
                totalKeyGenTime += duration;
            }
            
            LOG.debug("Generated Kyber-1024 key pair in " + duration + "ms (keyId: " + keyId + ")");
            
            // Log warning if key generation is slower than expected
            if (duration > 100) {
                LOG.warn("Kyber key generation took longer than expected: " + duration + "ms");
            }
            
            return keyPair;
            
        } catch (Exception e) {
            LOG.error("Kyber key pair generation failed", e);
            throw new RuntimeException("Key generation failed", e);
        }
    }
    
    /**
     * Encapsulate a shared secret using the recipient's public key
     * 
     * @param publicKey The recipient's Kyber public key
     * @return Encapsulation result containing ciphertext and shared secret
     */
    public QuantumCryptoService.KyberEncapsulationResult encapsulate(PublicKey publicKey) {
        long startTime = System.nanoTime();
        
        try {
            // Initialize KEM generator with the public key
            kemGenerator.init(publicKey);
            
            // Generate the shared secret and encapsulation
            SecretWithEncapsulationImpl secretWithEncapsulation = 
                (SecretWithEncapsulationImpl) kemGenerator.generateEncapsulated();
            
            byte[] sharedSecret = secretWithEncapsulation.getSecret();
            byte[] ciphertext = secretWithEncapsulation.getEncapsulation();
            
            // Update performance metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                encapsulationCount++;
                totalEncapsulationTime += duration;
            }
            
            LOG.debug("Kyber encapsulation completed in " + duration + "ms");
            
            if (duration > 10) {
                LOG.warn("Kyber encapsulation exceeded 10ms target: " + duration + "ms");
            }
            
            return new QuantumCryptoService.KyberEncapsulationResult(ciphertext, sharedSecret);
            
        } catch (Exception e) {
            LOG.error("Kyber encapsulation failed", e);
            throw new RuntimeException("Encapsulation failed", e);
        }
    }
    
    /**
     * Decapsulate the shared secret using the private key
     * 
     * @param ciphertext The encapsulated shared secret
     * @param privateKey The recipient's private key
     * @return The decapsulated shared secret
     */
    public byte[] decapsulate(byte[] ciphertext, PrivateKey privateKey) {
        long startTime = System.nanoTime();
        
        try {
            // Initialize KEM extractor with the private key
            KEMExtractor kemExtractor = KEMExtractor.getInstance(KYBER_ALGORITHM, PROVIDER);
            kemExtractor.init(privateKey);
            
            // Extract the shared secret from the ciphertext
            byte[] sharedSecret = kemExtractor.extractSecret(ciphertext);
            
            // Update performance metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                decapsulationCount++;
                totalDecapsulationTime += duration;
            }
            
            LOG.debug("Kyber decapsulation completed in " + duration + "ms");
            
            if (duration > 10) {
                LOG.warn("Kyber decapsulation exceeded 10ms target: " + duration + "ms");
            }
            
            return sharedSecret;
            
        } catch (Exception e) {
            LOG.error("Kyber decapsulation failed", e);
            throw new RuntimeException("Decapsulation failed", e);
        }
    }
    
    /**
     * Validate that a public key is a valid Kyber public key
     * 
     * @param publicKey The public key to validate
     * @return true if the key is a valid Kyber public key
     */
    public boolean validatePublicKey(PublicKey publicKey) {
        try {
            if (publicKey == null) {
                return false;
            }
            
            // Check algorithm
            if (!KYBER_ALGORITHM.equals(publicKey.getAlgorithm())) {
                return false;
            }
            
            // Try to encode and decode the key to validate its format
            byte[] encoded = publicKey.getEncoded();
            if (encoded == null || encoded.length == 0) {
                return false;
            }
            
            KeyFactory keyFactory = KeyFactory.getInstance(KYBER_ALGORITHM, PROVIDER);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(encoded);
            PublicKey reconstructed = keyFactory.generatePublic(keySpec);
            
            return reconstructed != null;
            
        } catch (Exception e) {
            LOG.debug("Public key validation failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Validate that a private key is a valid Kyber private key
     * 
     * @param privateKey The private key to validate
     * @return true if the key is a valid Kyber private key
     */
    public boolean validatePrivateKey(PrivateKey privateKey) {
        try {
            if (privateKey == null) {
                return false;
            }
            
            // Check algorithm
            if (!KYBER_ALGORITHM.equals(privateKey.getAlgorithm())) {
                return false;
            }
            
            // Try to encode and decode the key to validate its format
            byte[] encoded = privateKey.getEncoded();
            if (encoded == null || encoded.length == 0) {
                return false;
            }
            
            KeyFactory keyFactory = KeyFactory.getInstance(KYBER_ALGORITHM, PROVIDER);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(encoded);
            PrivateKey reconstructed = keyFactory.generatePrivate(keySpec);
            
            return reconstructed != null;
            
        } catch (Exception e) {
            LOG.debug("Private key validation failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Get Kyber key manager performance metrics
     * 
     * @return Performance metrics object
     */
    public KyberMetrics getMetrics() {
        synchronized (this) {
            return new KyberMetrics(
                keyGenerationCount,
                encapsulationCount,
                decapsulationCount,
                keyGenerationCount > 0 ? totalKeyGenTime / keyGenerationCount : 0,
                encapsulationCount > 0 ? totalEncapsulationTime / encapsulationCount : 0,
                decapsulationCount > 0 ? totalDecapsulationTime / decapsulationCount : 0,
                keyPairCache.size()
            );
        }
    }
    
    /**
     * Clear the key pair cache
     */
    public void clearCache() {
        int sizeBefore = keyPairCache.size();
        keyPairCache.clear();
        LOG.debug("Kyber key pair cache cleared: " + sizeBefore + " entries removed");
    }
    
    /**
     * Generate a unique key identifier
     */
    private String generateKeyId() {
        return "kyber_" + System.currentTimeMillis() + "_" + 
               ThreadLocalRandom.current().nextInt(10000, 99999);
    }
    
    /**
     * Shutdown the Kyber key manager
     */
    public void shutdown() {
        try {
            clearCache();
            keyPairGenerator = null;
            kemGenerator = null;
            
            LOG.info("KyberKeyManager shutdown completed");
            
        } catch (Exception e) {
            LOG.error("Error during KyberKeyManager shutdown", e);
        }
    }
    
    /**
     * Kyber performance metrics
     */
    public static class KyberMetrics {
        private final long keyGenerationCount;
        private final long encapsulationCount;
        private final long decapsulationCount;
        private final long avgKeyGenTime;
        private final long avgEncapsulationTime;
        private final long avgDecapsulationTime;
        private final int cacheSize;
        
        public KyberMetrics(long keyGenerationCount, long encapsulationCount, long decapsulationCount,
                           long avgKeyGenTime, long avgEncapsulationTime, long avgDecapsulationTime,
                           int cacheSize) {
            this.keyGenerationCount = keyGenerationCount;
            this.encapsulationCount = encapsulationCount;
            this.decapsulationCount = decapsulationCount;
            this.avgKeyGenTime = avgKeyGenTime;
            this.avgEncapsulationTime = avgEncapsulationTime;
            this.avgDecapsulationTime = avgDecapsulationTime;
            this.cacheSize = cacheSize;
        }
        
        // Getters
        public long getKeyGenerationCount() { return keyGenerationCount; }
        public long getEncapsulationCount() { return encapsulationCount; }
        public long getDecapsulationCount() { return decapsulationCount; }
        public long getAvgKeyGenTime() { return avgKeyGenTime; }
        public long getAvgEncapsulationTime() { return avgEncapsulationTime; }
        public long getAvgDecapsulationTime() { return avgDecapsulationTime; }
        public int getCacheSize() { return cacheSize; }
        
        @Override
        public String toString() {
            return "KyberMetrics{" +
                   "keyGen=" + keyGenerationCount + " (" + avgKeyGenTime + "ms avg), " +
                   "encaps=" + encapsulationCount + " (" + avgEncapsulationTime + "ms avg), " +
                   "decaps=" + decapsulationCount + " (" + avgDecapsulationTime + "ms avg), " +
                   "cache=" + cacheSize + "}";
        }
    }
}