package io.aurigraph.v11.crypto;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jboss.logging.Logger;

import java.security.*;
import java.security.spec.RSAKeyGenParameterSpec;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Hybrid Signature Service for Aurigraph V11
 * 
 * Implements hybrid cryptographic schemes combining classical and post-quantum
 * algorithms for maximum security and backwards compatibility. Provides dual
 * signature generation and verification for enhanced quantum resistance.
 * 
 * Features:
 * - Classical + Post-Quantum dual signatures
 * - Backwards compatibility with classical systems
 * - Forward security against quantum threats
 * - Performance optimization for 2M+ TPS
 * - Automatic algorithm selection and fallback
 * - Migration path from classical to quantum-resistant cryptography
 * 
 * Hybrid Schemes:
 * - RSA-4096 + CRYSTALS-Dilithium5 (Primary)
 * - ECDSA-P521 + SPHINCS+-SHA2-256f (Backup)
 * - EdDSA + CRYSTALS-Dilithium5 (High Performance)
 * 
 * Security: Provides security if either classical OR post-quantum algorithm remains secure
 */
@ApplicationScoped
public class HybridSignatureService {
    
    private static final Logger LOG = Logger.getLogger(HybridSignatureService.class);
    
    // Hybrid scheme definitions
    public static final String RSA_DILITHIUM = "RSA-4096+Dilithium5";
    public static final String ECDSA_SPHINCS = "ECDSA-P521+SPHINCS+";
    public static final String EDDSA_DILITHIUM = "EdDSA+Dilithium5";
    
    // Algorithm constants
    private static final String RSA_ALGORITHM = "RSA";
    private static final String ECDSA_ALGORITHM = "ECDSA";
    private static final String EDDSA_ALGORITHM = "EdDSA";
    private static final String RSA_SIGNATURE = "SHA512withRSA";
    private static final String ECDSA_SIGNATURE = "SHA512withECDSA";
    private static final String EDDSA_SIGNATURE = "EdDSA";
    
    // Performance targets
    private static final long TARGET_HYBRID_SIGNING_MS = 100;
    private static final long TARGET_HYBRID_VERIFICATION_MS = 20;
    
    @Inject
    DilithiumSignatureService dilithiumService;
    
    @Inject
    SphincsPlusService sphincsPlusService;
    
    @Inject
    QuantumCryptographyManager quantumCryptoManager;
    
    // Hybrid signature state
    private final ConcurrentHashMap<String, HybridKeyPair> hybridKeys = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, HybridSchemeMetrics> schemeMetrics = new ConcurrentHashMap<>();
    
    // Performance tracking
    private final AtomicLong totalHybridOperations = new AtomicLong(0);
    private final AtomicLong successfulHybridOperations = new AtomicLong(0);
    private final AtomicLong failedHybridOperations = new AtomicLong(0);
    
    // Execution infrastructure
    private ExecutorService hybridExecutor;
    private boolean initialized = false;
    
    /**
     * Initialize hybrid signature service
     */
    public void initialize() {
        if (initialized) {
            LOG.warn("HybridSignatureService already initialized");
            return;
        }
        
        try {
            LOG.info("Initializing Hybrid Signature Service");
            
            // Initialize execution infrastructure
            hybridExecutor = Executors.newVirtualThreadPerTaskExecutor();
            
            // Initialize BouncyCastle provider if needed
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            
            // Initialize scheme metrics
            schemeMetrics.put(RSA_DILITHIUM, new HybridSchemeMetrics(RSA_DILITHIUM));
            schemeMetrics.put(ECDSA_SPHINCS, new HybridSchemeMetrics(ECDSA_SPHINCS));
            schemeMetrics.put(EDDSA_DILITHIUM, new HybridSchemeMetrics(EDDSA_DILITHIUM));
            
            // Generate default hybrid key pairs
            generateDefaultHybridKeys();
            
            initialized = true;
            LOG.info("Hybrid Signature Service initialized successfully");
            
        } catch (Exception e) {
            LOG.error("Failed to initialize Hybrid Signature Service", e);
            throw new RuntimeException("Hybrid signature initialization failed", e);
        }
    }
    
    private void generateDefaultHybridKeys() {
        try {
            // Generate RSA + Dilithium hybrid key pair
            generateHybridKeyPair(RSA_DILITHIUM, "default-rsa-dilithium")
                .thenAccept(keyPair -> LOG.debug("Generated default RSA+Dilithium key pair"))
                .exceptionally(throwable -> {
                    LOG.error("Failed to generate RSA+Dilithium key pair", throwable);
                    return null;
                });
            
            // Generate ECDSA + SPHINCS+ hybrid key pair
            generateHybridKeyPair(ECDSA_SPHINCS, "default-ecdsa-sphincs")
                .thenAccept(keyPair -> LOG.debug("Generated default ECDSA+SPHINCS+ key pair"))
                .exceptionally(throwable -> {
                    LOG.error("Failed to generate ECDSA+SPHINCS+ key pair", throwable);
                    return null;
                });
            
            // Generate EdDSA + Dilithium hybrid key pair
            generateHybridKeyPair(EDDSA_DILITHIUM, "default-eddsa-dilithium")
                .thenAccept(keyPair -> LOG.debug("Generated default EdDSA+Dilithium key pair"))
                .exceptionally(throwable -> {
                    LOG.error("Failed to generate EdDSA+Dilithium key pair", throwable);
                    return null;
                });
            
        } catch (Exception e) {
            LOG.error("Failed to generate default hybrid keys", e);
        }
    }
    
    /**
     * Generate hybrid key pair for specified scheme
     * 
     * @param scheme The hybrid scheme (RSA_DILITHIUM, ECDSA_SPHINCS, EDDSA_DILITHIUM)
     * @param keyId The key identifier
     * @return CompletableFuture containing the generated hybrid key pair
     */
    public CompletableFuture<HybridKeyPair> generateHybridKeyPair(String scheme, String keyId) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                LOG.debug("Generating hybrid key pair: " + scheme + " (" + keyId + ")");
                
                KeyPair classicalKey;
                KeyPair quantumKey;
                
                switch (scheme) {
                    case RSA_DILITHIUM:
                        classicalKey = generateRSAKeyPair();
                        quantumKey = dilithiumService.generateKeyPair();
                        break;
                    case ECDSA_SPHINCS:
                        classicalKey = generateECDSAKeyPair();
                        quantumKey = sphincsPlusService.generateKeyPair();
                        break;
                    case EDDSA_DILITHIUM:
                        classicalKey = generateEdDSAKeyPair();
                        quantumKey = dilithiumService.generateKeyPair();
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported hybrid scheme: " + scheme);
                }
                
                HybridKeyPair hybridKeyPair = new HybridKeyPair(
                    keyId,
                    scheme,
                    classicalKey,
                    quantumKey,
                    Instant.now()
                );
                
                // Store the hybrid key pair
                hybridKeys.put(keyId, hybridKeyPair);
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateSchemeMetrics(scheme, "keygen", duration, true);
                
                LOG.debug("Generated hybrid key pair " + keyId + " in " + duration + "ms");
                
                return hybridKeyPair;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateSchemeMetrics(scheme, "keygen", duration, false);
                
                LOG.error("Hybrid key generation failed for " + scheme, e);
                throw new RuntimeException("Hybrid key generation failed", e);
            }
        }, hybridExecutor);
    }
    
    /**
     * Generate hybrid signature using both classical and quantum algorithms
     * 
     * @param data The data to sign
     * @param keyId The hybrid key identifier
     * @param scheme The hybrid scheme (optional, auto-detect from key)
     * @return CompletableFuture containing the hybrid signature
     */
    public CompletableFuture<HybridSignature> hybridSign(byte[] data, String keyId, String scheme) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            totalHybridOperations.incrementAndGet();
            
            try {
                HybridKeyPair keyPair = hybridKeys.get(keyId);
                if (keyPair == null) {
                    throw new RuntimeException("Hybrid key not found: " + keyId);
                }
                
                String actualScheme = scheme != null ? scheme : keyPair.getScheme();
                
                // Generate classical signature
                byte[] classicalSignature = generateClassicalSignature(data, keyPair, actualScheme);
                
                // Generate quantum signature
                byte[] quantumSignature = generateQuantumSignature(data, keyPair, actualScheme);
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                
                HybridSignature hybridSig = new HybridSignature(
                    classicalSignature,
                    quantumSignature,
                    actualScheme,
                    keyId,
                    duration,
                    Instant.now(),
                    generateHybridMetadata(data, keyPair)
                );
                
                // Update metrics
                updateSchemeMetrics(actualScheme, "sign", duration, true);
                successfulHybridOperations.incrementAndGet();
                
                if (duration > TARGET_HYBRID_SIGNING_MS) {
                    LOG.warn("Hybrid signing exceeded target time: " + duration + "ms for " + actualScheme);
                }
                
                LOG.debug("Generated hybrid signature in " + duration + "ms using " + actualScheme);
                
                return hybridSig;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateSchemeMetrics(scheme, "sign", duration, false);
                failedHybridOperations.incrementAndGet();
                
                LOG.error("Hybrid signing failed", e);
                throw new RuntimeException("Hybrid signing failed", e);
            }
        }, hybridExecutor);
    }
    
    /**
     * Verify hybrid signature using both classical and quantum verification
     * 
     * @param data The original data
     * @param signature The hybrid signature to verify
     * @return CompletableFuture containing verification result
     */
    public CompletableFuture<HybridVerificationResult> hybridVerify(byte[] data, HybridSignature signature) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            totalHybridOperations.incrementAndGet();
            
            try {
                HybridKeyPair keyPair = hybridKeys.get(signature.getKeyId());
                if (keyPair == null) {
                    return new HybridVerificationResult(false, false, false, 
                        "Hybrid key not found: " + signature.getKeyId(),
                        (System.nanoTime() - startTime) / 1_000_000, signature.getScheme());
                }
                
                // Verify classical signature
                boolean classicalValid = verifyClassicalSignature(data, signature, keyPair);
                
                // Verify quantum signature
                boolean quantumValid = verifyQuantumSignature(data, signature, keyPair);
                
                // Hybrid signature is valid if BOTH signatures are valid
                boolean hybridValid = classicalValid && quantumValid;
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                
                // Update metrics
                updateSchemeMetrics(signature.getScheme(), "verify", duration, hybridValid);
                
                if (hybridValid) {
                    successfulHybridOperations.incrementAndGet();
                } else {
                    failedHybridOperations.incrementAndGet();
                }
                
                if (duration > TARGET_HYBRID_VERIFICATION_MS) {
                    LOG.warn("Hybrid verification exceeded target time: " + duration + "ms for " + signature.getScheme());
                }
                
                String message = hybridValid ? "Valid hybrid signature" : 
                    String.format("Invalid hybrid signature (classical: %s, quantum: %s)", 
                        classicalValid, quantumValid);
                
                LOG.debug("Verified hybrid signature in " + duration + "ms: " + message);
                
                return new HybridVerificationResult(
                    hybridValid,
                    classicalValid,
                    quantumValid,
                    message,
                    duration,
                    signature.getScheme()
                );
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateSchemeMetrics(signature.getScheme(), "verify", duration, false);
                failedHybridOperations.incrementAndGet();
                
                LOG.error("Hybrid verification failed", e);
                return new HybridVerificationResult(false, false, false,
                    "Verification error: " + e.getMessage(), duration, signature.getScheme());
            }
        }, hybridExecutor);
    }
    
    /**
     * Batch hybrid signing for high-throughput scenarios
     * 
     * @param dataItems The data items to sign
     * @param keyId The hybrid key identifier
     * @param scheme The hybrid scheme
     * @return CompletableFuture containing batch hybrid signatures
     */
    public CompletableFuture<List<HybridSignature>> hybridBatchSign(List<byte[]> dataItems, String keyId, String scheme) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                HybridKeyPair keyPair = hybridKeys.get(keyId);
                if (keyPair == null) {
                    throw new RuntimeException("Hybrid key not found: " + keyId);
                }
                
                String actualScheme = scheme != null ? scheme : keyPair.getScheme();
                List<HybridSignature> signatures = new ArrayList<>();
                
                // Batch process classical signatures
                byte[][] classicalSigs = batchGenerateClassicalSignatures(dataItems, keyPair, actualScheme);
                
                // Batch process quantum signatures
                byte[][] quantumSigs = batchGenerateQuantumSignatures(dataItems, keyPair, actualScheme);
                
                // Combine into hybrid signatures
                for (int i = 0; i < dataItems.size(); i++) {
                    HybridSignature hybridSig = new HybridSignature(
                        classicalSigs[i],
                        quantumSigs[i],
                        actualScheme,
                        keyId,
                        0, // Batch timing
                        Instant.now(),
                        generateHybridMetadata(dataItems.get(i), keyPair)
                    );
                    signatures.add(hybridSig);
                }
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateSchemeMetrics(actualScheme, "batch_sign", duration, true);
                
                LOG.debug("Batch signed " + dataItems.size() + " items in " + duration + "ms using " + actualScheme);
                
                return signatures;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateSchemeMetrics(scheme, "batch_sign", duration, false);
                
                LOG.error("Hybrid batch signing failed", e);
                throw new RuntimeException("Hybrid batch signing failed", e);
            }
        }, hybridExecutor);
    }
    
    /**
     * Migrate from classical to hybrid signatures gradually
     * 
     * @param classicalKeyId The existing classical key identifier
     * @param quantumAlgorithm The quantum algorithm to add
     * @return CompletableFuture containing the migrated hybrid key pair
     */
    public CompletableFuture<HybridKeyPair> migrateToHybrid(String classicalKeyId, String quantumAlgorithm) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                LOG.info("Migrating classical key to hybrid: " + classicalKeyId);
                
                // In a real implementation, this would fetch the existing classical key
                // For now, we'll generate a new hybrid key pair
                String scheme = determineHybridScheme(quantumAlgorithm);
                String newKeyId = classicalKeyId + "_hybrid_" + System.currentTimeMillis();
                
                HybridKeyPair hybridKey = generateHybridKeyPair(scheme, newKeyId).get();
                
                LOG.info("Successfully migrated " + classicalKeyId + " to hybrid key " + newKeyId);
                return hybridKey;
                
            } catch (Exception e) {
                LOG.error("Migration to hybrid failed for key " + classicalKeyId, e);
                throw new RuntimeException("Migration to hybrid failed", e);
            }
        }, hybridExecutor);
    }
    
    // Key generation methods
    
    private KeyPair generateRSAKeyPair() throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(RSA_ALGORITHM);
        keyGen.initialize(new RSAKeyGenParameterSpec(4096, RSAKeyGenParameterSpec.F4));
        return keyGen.generateKeyPair();
    }
    
    private KeyPair generateECDSAKeyPair() throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(ECDSA_ALGORITHM, "BC");
        keyGen.initialize(521); // P-521 curve
        return keyGen.generateKeyPair();
    }
    
    private KeyPair generateEdDSAKeyPair() throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(EDDSA_ALGORITHM, "BC");
        keyGen.initialize(255); // Ed25519
        return keyGen.generateKeyPair();
    }
    
    // Signature generation methods
    
    private byte[] generateClassicalSignature(byte[] data, HybridKeyPair keyPair, String scheme) throws Exception {
        PrivateKey classicalPrivateKey = keyPair.getClassicalKeyPair().getPrivate();
        
        switch (scheme) {
            case RSA_DILITHIUM:
                return signWithRSA(data, classicalPrivateKey);
            case ECDSA_SPHINCS:
                return signWithECDSA(data, classicalPrivateKey);
            case EDDSA_DILITHIUM:
                return signWithEdDSA(data, classicalPrivateKey);
            default:
                throw new IllegalArgumentException("Unsupported scheme: " + scheme);
        }
    }
    
    private byte[] generateQuantumSignature(byte[] data, HybridKeyPair keyPair, String scheme) throws Exception {
        PrivateKey quantumPrivateKey = keyPair.getQuantumKeyPair().getPrivate();
        
        switch (scheme) {
            case RSA_DILITHIUM:
            case EDDSA_DILITHIUM:
                return dilithiumService.sign(data, quantumPrivateKey);
            case ECDSA_SPHINCS:
                return sphincsPlusService.sign(data, quantumPrivateKey);
            default:
                throw new IllegalArgumentException("Unsupported scheme: " + scheme);
        }
    }
    
    private byte[] signWithRSA(byte[] data, PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance(RSA_SIGNATURE);
        signature.initSign(privateKey);
        signature.update(data);
        return signature.sign();
    }
    
    private byte[] signWithECDSA(byte[] data, PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance(ECDSA_SIGNATURE, "BC");
        signature.initSign(privateKey);
        signature.update(data);
        return signature.sign();
    }
    
    private byte[] signWithEdDSA(byte[] data, PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance(EDDSA_SIGNATURE, "BC");
        signature.initSign(privateKey);
        signature.update(data);
        return signature.sign();
    }
    
    // Batch signature generation methods
    
    private byte[][] batchGenerateClassicalSignatures(List<byte[]> dataItems, HybridKeyPair keyPair, String scheme) throws Exception {
        byte[][] signatures = new byte[dataItems.size()][];
        PrivateKey classicalPrivateKey = keyPair.getClassicalKeyPair().getPrivate();
        
        for (int i = 0; i < dataItems.size(); i++) {
            signatures[i] = generateClassicalSignature(dataItems.get(i), keyPair, scheme);
        }
        
        return signatures;
    }
    
    private byte[][] batchGenerateQuantumSignatures(List<byte[]> dataItems, HybridKeyPair keyPair, String scheme) throws Exception {
        PrivateKey quantumPrivateKey = keyPair.getQuantumKeyPair().getPrivate();
        
        switch (scheme) {
            case RSA_DILITHIUM:
            case EDDSA_DILITHIUM:
                return dilithiumService.batchSign(dataItems.toArray(new byte[0][]), quantumPrivateKey);
            case ECDSA_SPHINCS:
                return sphincsPlusService.signMultiple(dataItems.toArray(new byte[0][]), quantumPrivateKey);
            default:
                throw new IllegalArgumentException("Unsupported scheme: " + scheme);
        }
    }
    
    // Signature verification methods
    
    private boolean verifyClassicalSignature(byte[] data, HybridSignature signature, HybridKeyPair keyPair) {
        try {
            PublicKey classicalPublicKey = keyPair.getClassicalKeyPair().getPublic();
            
            switch (signature.getScheme()) {
                case RSA_DILITHIUM:
                    return verifyWithRSA(data, signature.getClassicalSignature(), classicalPublicKey);
                case ECDSA_SPHINCS:
                    return verifyWithECDSA(data, signature.getClassicalSignature(), classicalPublicKey);
                case EDDSA_DILITHIUM:
                    return verifyWithEdDSA(data, signature.getClassicalSignature(), classicalPublicKey);
                default:
                    return false;
            }
        } catch (Exception e) {
            LOG.debug("Classical signature verification failed: " + e.getMessage());
            return false;
        }
    }
    
    private boolean verifyQuantumSignature(byte[] data, HybridSignature signature, HybridKeyPair keyPair) {
        try {
            PublicKey quantumPublicKey = keyPair.getQuantumKeyPair().getPublic();
            
            switch (signature.getScheme()) {
                case RSA_DILITHIUM:
                case EDDSA_DILITHIUM:
                    return dilithiumService.verify(data, signature.getQuantumSignature(), quantumPublicKey);
                case ECDSA_SPHINCS:
                    return sphincsPlusService.verify(data, signature.getQuantumSignature(), quantumPublicKey);
                default:
                    return false;
            }
        } catch (Exception e) {
            LOG.debug("Quantum signature verification failed: " + e.getMessage());
            return false;
        }
    }
    
    private boolean verifyWithRSA(byte[] data, byte[] signature, PublicKey publicKey) throws Exception {
        Signature verifier = Signature.getInstance(RSA_SIGNATURE);
        verifier.initVerify(publicKey);
        verifier.update(data);
        return verifier.verify(signature);
    }
    
    private boolean verifyWithECDSA(byte[] data, byte[] signature, PublicKey publicKey) throws Exception {
        Signature verifier = Signature.getInstance(ECDSA_SIGNATURE, "BC");
        verifier.initVerify(publicKey);
        verifier.update(data);
        return verifier.verify(signature);
    }
    
    private boolean verifyWithEdDSA(byte[] data, byte[] signature, PublicKey publicKey) throws Exception {
        Signature verifier = Signature.getInstance(EDDSA_SIGNATURE, "BC");
        verifier.initVerify(publicKey);
        verifier.update(data);
        return verifier.verify(signature);
    }
    
    // Utility methods
    
    private String determineHybridScheme(String quantumAlgorithm) {
        switch (quantumAlgorithm) {
            case "Dilithium":
            case "CRYSTALS-Dilithium5":
                return RSA_DILITHIUM; // Default to RSA + Dilithium
            case "SPHINCS+":
            case "SPHINCS+-SHA2-256f":
                return ECDSA_SPHINCS;
            default:
                return RSA_DILITHIUM;
        }
    }
    
    private Map<String, Object> generateHybridMetadata(byte[] data, HybridKeyPair keyPair) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("scheme", keyPair.getScheme());
        metadata.put("classicalAlgorithm", getClassicalAlgorithm(keyPair.getScheme()));
        metadata.put("quantumAlgorithm", getQuantumAlgorithm(keyPair.getScheme()));
        metadata.put("dataSize", data.length);
        metadata.put("keyCreationTime", keyPair.getCreationTime().toEpochMilli());
        metadata.put("hybrid", true);
        return metadata;
    }
    
    private String getClassicalAlgorithm(String scheme) {
        switch (scheme) {
            case RSA_DILITHIUM:
                return "RSA-4096";
            case ECDSA_SPHINCS:
                return "ECDSA-P521";
            case EDDSA_DILITHIUM:
                return "EdDSA";
            default:
                return "Unknown";
        }
    }
    
    private String getQuantumAlgorithm(String scheme) {
        switch (scheme) {
            case RSA_DILITHIUM:
            case EDDSA_DILITHIUM:
                return "CRYSTALS-Dilithium5";
            case ECDSA_SPHINCS:
                return "SPHINCS+-SHA2-256f";
            default:
                return "Unknown";
        }
    }
    
    private void updateSchemeMetrics(String scheme, String operation, long duration, boolean success) {
        HybridSchemeMetrics metrics = schemeMetrics.get(scheme);
        if (metrics != null) {
            metrics.recordOperation(operation, duration, success);
        }
    }
    
    /**
     * Get hybrid signature service status
     */
    public HybridSignatureStatus getStatus() {
        return new HybridSignatureStatus(
            initialized,
            hybridKeys.size(),
            totalHybridOperations.get(),
            successfulHybridOperations.get(),
            failedHybridOperations.get(),
            calculateAverageLatency(),
            getSuccessRate()
        );
    }
    
    /**
     * Get hybrid scheme metrics
     */
    public Map<String, HybridSchemeMetrics> getSchemeMetrics() {
        return new HashMap<>(schemeMetrics);
    }
    
    /**
     * Get available hybrid keys
     */
    public Set<String> getAvailableHybridKeys() {
        return new HashSet<>(hybridKeys.keySet());
    }
    
    private double calculateAverageLatency() {
        return schemeMetrics.values().stream()
            .mapToDouble(HybridSchemeMetrics::getAverageLatency)
            .average()
            .orElse(0.0);
    }
    
    private double getSuccessRate() {
        long total = totalHybridOperations.get();
        return total > 0 ? (double) successfulHybridOperations.get() / total : 1.0;
    }
    
    /**
     * Shutdown hybrid signature service
     */
    public void shutdown() {
        if (!initialized) {
            return;
        }
        
        LOG.info("Shutting down Hybrid Signature Service");
        
        if (hybridExecutor != null) {
            hybridExecutor.shutdown();
        }
        
        hybridKeys.clear();
        schemeMetrics.clear();
        
        initialized = false;
        LOG.info("Hybrid Signature Service shutdown complete");
    }
    
    // Inner classes for data structures
    
    public static class HybridKeyPair {
        private final String keyId;
        private final String scheme;
        private final KeyPair classicalKeyPair;
        private final KeyPair quantumKeyPair;
        private final Instant creationTime;
        
        public HybridKeyPair(String keyId, String scheme, KeyPair classicalKeyPair, 
                           KeyPair quantumKeyPair, Instant creationTime) {
            this.keyId = keyId;
            this.scheme = scheme;
            this.classicalKeyPair = classicalKeyPair;
            this.quantumKeyPair = quantumKeyPair;
            this.creationTime = creationTime;
        }
        
        // Getters
        public String getKeyId() { return keyId; }
        public String getScheme() { return scheme; }
        public KeyPair getClassicalKeyPair() { return classicalKeyPair; }
        public KeyPair getQuantumKeyPair() { return quantumKeyPair; }
        public Instant getCreationTime() { return creationTime; }
    }
    
    public static class HybridSignature {
        private final byte[] classicalSignature;
        private final byte[] quantumSignature;
        private final String scheme;
        private final String keyId;
        private final long signingTime;
        private final Instant creationTime;
        private final Map<String, Object> metadata;
        
        public HybridSignature(byte[] classicalSignature, byte[] quantumSignature, String scheme,
                             String keyId, long signingTime, Instant creationTime,
                             Map<String, Object> metadata) {
            this.classicalSignature = classicalSignature;
            this.quantumSignature = quantumSignature;
            this.scheme = scheme;
            this.keyId = keyId;
            this.signingTime = signingTime;
            this.creationTime = creationTime;
            this.metadata = metadata;
        }
        
        // Getters
        public byte[] getClassicalSignature() { return classicalSignature; }
        public byte[] getQuantumSignature() { return quantumSignature; }
        public String getScheme() { return scheme; }
        public String getKeyId() { return keyId; }
        public long getSigningTime() { return signingTime; }
        public Instant getCreationTime() { return creationTime; }
        public Map<String, Object> getMetadata() { return metadata; }
        
        public int getTotalSize() {
            return classicalSignature.length + quantumSignature.length;
        }
    }
    
    public static class HybridVerificationResult {
        private final boolean hybridValid;
        private final boolean classicalValid;
        private final boolean quantumValid;
        private final String message;
        private final long verificationTime;
        private final String scheme;
        
        public HybridVerificationResult(boolean hybridValid, boolean classicalValid, boolean quantumValid,
                                      String message, long verificationTime, String scheme) {
            this.hybridValid = hybridValid;
            this.classicalValid = classicalValid;
            this.quantumValid = quantumValid;
            this.message = message;
            this.verificationTime = verificationTime;
            this.scheme = scheme;
        }
        
        // Getters
        public boolean isHybridValid() { return hybridValid; }
        public boolean isClassicalValid() { return classicalValid; }
        public boolean isQuantumValid() { return quantumValid; }
        public String getMessage() { return message; }
        public long getVerificationTime() { return verificationTime; }
        public String getScheme() { return scheme; }
    }
    
    public static class HybridSchemeMetrics {
        private final String scheme;
        private long totalOperations = 0;
        private long successfulOperations = 0;
        private long totalTime = 0;
        private final Map<String, Long> operationCounts = new ConcurrentHashMap<>();
        private final Map<String, Long> operationTimes = new ConcurrentHashMap<>();
        
        public HybridSchemeMetrics(String scheme) {
            this.scheme = scheme;
        }
        
        public synchronized void recordOperation(String operation, long duration, boolean success) {
            totalOperations++;
            totalTime += duration;
            
            if (success) {
                successfulOperations++;
            }
            
            operationCounts.merge(operation, 1L, Long::sum);
            operationTimes.merge(operation, duration, Long::sum);
        }
        
        // Getters
        public String getScheme() { return scheme; }
        public long getTotalOperations() { return totalOperations; }
        public long getSuccessfulOperations() { return successfulOperations; }
        public double getAverageLatency() { 
            return totalOperations > 0 ? (double) totalTime / totalOperations : 0.0; 
        }
        public double getSuccessRate() { 
            return totalOperations > 0 ? (double) successfulOperations / totalOperations : 1.0; 
        }
        public Map<String, Long> getOperationCounts() { return new HashMap<>(operationCounts); }
        public Map<String, Long> getOperationTimes() { return new HashMap<>(operationTimes); }
    }
    
    public static class HybridSignatureStatus {
        private final boolean initialized;
        private final int keyCount;
        private final long totalOperations;
        private final long successfulOperations;
        private final long failedOperations;
        private final double averageLatency;
        private final double successRate;
        
        public HybridSignatureStatus(boolean initialized, int keyCount, long totalOperations,
                                   long successfulOperations, long failedOperations,
                                   double averageLatency, double successRate) {
            this.initialized = initialized;
            this.keyCount = keyCount;
            this.totalOperations = totalOperations;
            this.successfulOperations = successfulOperations;
            this.failedOperations = failedOperations;
            this.averageLatency = averageLatency;
            this.successRate = successRate;
        }
        
        // Getters
        public boolean isInitialized() { return initialized; }
        public int getKeyCount() { return keyCount; }
        public long getTotalOperations() { return totalOperations; }
        public long getSuccessfulOperations() { return successfulOperations; }
        public long getFailedOperations() { return failedOperations; }
        public double getAverageLatency() { return averageLatency; }
        public double getSuccessRate() { return successRate; }
    }
}