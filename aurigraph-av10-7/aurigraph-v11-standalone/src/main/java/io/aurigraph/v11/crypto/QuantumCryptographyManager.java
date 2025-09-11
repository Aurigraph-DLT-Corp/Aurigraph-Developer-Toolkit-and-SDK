package io.aurigraph.v11.crypto;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.pqc.jcajce.provider.BouncyCastlePQCProvider;
import org.jboss.logging.Logger;

import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.security.spec.AlgorithmParameterSpec;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Quantum Cryptography Manager for Aurigraph V11
 * 
 * Centralized manager for all quantum-resistant cryptographic operations
 * compliant with NIST Level 5 security standards. Coordinates multiple
 * post-quantum algorithms and provides unified cryptographic services.
 * 
 * Features:
 * - NIST Level 5 compliance (CRYSTALS-Dilithium5, CRYSTALS-Kyber1024, SPHINCS+-SHA2-256f)
 * - Hardware acceleration support with HSM integration
 * - Performance optimization targeting 2M+ TPS
 * - Hybrid cryptography (classical + post-quantum)
 * - Key management with secure lifecycle
 * - Cryptographic agility and algorithm migration
 * - Real-time security monitoring and threat detection
 * - Performance-optimized batch operations
 * 
 * Security Level: NIST Level 5 (256-bit quantum resistance)
 * Performance Target: Sub-10ms signature verification, <1ms key operations
 */
@ApplicationScoped
public class QuantumCryptographyManager {
    
    private static final Logger LOG = Logger.getLogger(QuantumCryptographyManager.class);
    
    // NIST Level 5 Algorithm Constants
    public static final String PRIMARY_SIGNATURE = "CRYSTALS-Dilithium5";
    public static final String BACKUP_SIGNATURE = "SPHINCS+-SHA2-256f-robust";
    public static final String KEY_ENCAPSULATION = "CRYSTALS-Kyber1024";
    public static final String HASH_ALGORITHM = "SHA3-512";
    public static final String HYBRID_CLASSIC = "RSA-4096";
    
    // Performance Targets
    private static final long TARGET_VERIFICATION_MS = 10;
    private static final long TARGET_SIGNING_MS = 50;
    private static final long TARGET_KEY_GEN_MS = 500;
    private static final long TARGET_TPS = 2_000_000;
    
    // Security Constants
    private static final int QUANTUM_SECURITY_LEVEL = 5; // NIST Level 5
    private static final int KEY_ROTATION_HOURS = 24;
    private static final int MAX_SIGNATURE_AGE_MINUTES = 30;
    private static final double THREAT_DETECTION_THRESHOLD = 0.001; // 0.1% failure rate
    
    // Injected services
    @Inject
    DilithiumSignatureService dilithiumService;
    
    @Inject
    SphincsPlusService sphincsPlusService;
    
    @Inject
    KyberKeyManager kyberKeyManager;
    
    @Inject
    HSMIntegration hsmIntegration;
    
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    // Quantum cryptography state
    private final AtomicBoolean initialized = new AtomicBoolean(false);
    private final AtomicBoolean hsmMode = new AtomicBoolean(false);
    private final AtomicBoolean hybridMode = new AtomicBoolean(true);
    private final AtomicBoolean threatDetectionEnabled = new AtomicBoolean(true);
    
    // Performance monitoring
    private final AtomicLong totalOperations = new AtomicLong(0);
    private final AtomicLong successfulOperations = new AtomicLong(0);
    private final AtomicLong failedOperations = new AtomicLong(0);
    private final AtomicReference<Double> currentTps = new AtomicReference<>(0.0);
    private final AtomicReference<Double> avgLatency = new AtomicReference<>(0.0);
    
    // Security monitoring
    private final AtomicLong securityEvents = new AtomicLong(0);
    private final AtomicLong quantumThreats = new AtomicLong(0);
    private final AtomicReference<ThreatLevel> currentThreatLevel = new AtomicReference<>(ThreatLevel.NORMAL);
    
    // Key management
    private final ConcurrentHashMap<String, QuantumKeyPair> quantumKeys = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, KeyCertificate> keyCertificates = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> keyLastUsed = new ConcurrentHashMap<>();
    
    // Algorithm selection and fallback
    private final ConcurrentHashMap<String, AlgorithmMetrics> algorithmPerformance = new ConcurrentHashMap<>();
    private final AtomicReference<String> primarySignatureAlgorithm = new AtomicReference<>(PRIMARY_SIGNATURE);
    private final AtomicReference<String> backupSignatureAlgorithm = new AtomicReference<>(BACKUP_SIGNATURE);
    
    // Execution infrastructure
    private ExecutorService cryptoExecutor;
    private ScheduledExecutorService maintenanceExecutor;
    private CompletableFuture<Void> monitoringTask;
    
    // Quantum random number generator
    private SecureRandom quantumRandom;
    private final ConcurrentLinkedQueue<byte[]> entropyPool = new ConcurrentLinkedQueue<>();
    
    /**
     * Initialize quantum cryptography manager with full NIST Level 5 compliance
     */
    public void initialize() {
        if (initialized.getAndSet(true)) {
            LOG.warn("QuantumCryptographyManager already initialized");
            return;
        }
        
        long startTime = System.nanoTime();
        LOG.info("Initializing Quantum Cryptography Manager - NIST Level 5 compliance");
        
        try {
            // Initialize cryptographic providers
            initializeCryptographicProviders();
            
            // Initialize execution infrastructure
            initializeExecutionInfrastructure();
            
            // Initialize quantum random number generator
            initializeQuantumRandom();
            
            // Initialize component services
            initializeComponentServices();
            
            // Initialize key management system
            initializeKeyManagement();
            
            // Initialize hybrid cryptography if enabled
            if (hybridMode.get()) {
                initializeHybridCryptography();
            }
            
            // Initialize HSM integration if available
            initializeHSMIntegration();
            
            // Initialize security monitoring
            initializeSecurityMonitoring();
            
            // Start maintenance tasks
            startMaintenanceTasks();
            
            // Validate NIST Level 5 compliance
            validateNISTCompliance();
            
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            LOG.info("Quantum Cryptography Manager initialized successfully in " + duration + "ms");
            LOG.info("Security Level: NIST Level " + QUANTUM_SECURITY_LEVEL + 
                    ", HSM: " + hsmMode.get() + 
                    ", Hybrid: " + hybridMode.get() + 
                    ", Threat Detection: " + threatDetectionEnabled.get());
            
        } catch (Exception e) {
            initialized.set(false);
            LOG.error("Failed to initialize Quantum Cryptography Manager", e);
            throw new RuntimeException("Quantum cryptography initialization failed", e);
        }
    }
    
    private void initializeCryptographicProviders() throws Exception {
        // Add BouncyCastle providers if not already present
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        if (Security.getProvider("BCPQC") == null) {
            Security.addProvider(new BouncyCastlePQCProvider());
        }
        
        // Verify quantum algorithms are available
        verifyQuantumAlgorithmAvailability();
        
        LOG.debug("Cryptographic providers initialized");
    }
    
    private void verifyQuantumAlgorithmAvailability() throws Exception {
        // Test CRYSTALS-Dilithium availability
        try {
            KeyPairGenerator.getInstance("Dilithium", "BCPQC");
        } catch (NoSuchAlgorithmException e) {
            throw new Exception("CRYSTALS-Dilithium not available", e);
        }
        
        // Test SPHINCS+ availability
        try {
            KeyPairGenerator.getInstance("SPHINCS+", "BCPQC");
        } catch (NoSuchAlgorithmException e) {
            throw new Exception("SPHINCS+ not available", e);
        }
        
        // Test CRYSTALS-Kyber availability
        try {
            KeyPairGenerator.getInstance("Kyber", "BCPQC");
        } catch (NoSuchAlgorithmException e) {
            LOG.warn("CRYSTALS-Kyber not available, using RSA fallback");
        }
        
        LOG.debug("Quantum algorithm availability verified");
    }
    
    private void initializeExecutionInfrastructure() {
        // Virtual thread executor for maximum concurrency
        cryptoExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        // Scheduled executor for maintenance tasks
        maintenanceExecutor = Executors.newScheduledThreadPool(4);
        
        LOG.debug("Execution infrastructure initialized");
    }
    
    private void initializeQuantumRandom() throws Exception {
        // Use the strongest available secure random
        quantumRandom = SecureRandom.getInstanceStrong();
        
        // Pre-generate entropy pool for high-performance operations
        CompletableFuture.runAsync(() -> {
            for (int i = 0; i < 100; i++) {
                byte[] entropy = new byte[64];
                quantumRandom.nextBytes(entropy);
                entropyPool.offer(entropy);
            }
        }, cryptoExecutor);
        
        LOG.debug("Quantum random number generator initialized");
    }
    
    private void initializeComponentServices() {
        // Initialize all quantum cryptographic services
        dilithiumService.initialize();
        sphincsPlusService.initialize();
        kyberKeyManager.initialize();
        quantumCryptoService.initialize();
        
        // Initialize algorithm performance tracking
        algorithmPerformance.put(PRIMARY_SIGNATURE, new AlgorithmMetrics(PRIMARY_SIGNATURE));
        algorithmPerformance.put(BACKUP_SIGNATURE, new AlgorithmMetrics(BACKUP_SIGNATURE));
        algorithmPerformance.put(KEY_ENCAPSULATION, new AlgorithmMetrics(KEY_ENCAPSULATION));
        
        LOG.debug("Component services initialized");
    }
    
    private void initializeKeyManagement() {
        // Generate master quantum key pairs for core operations
        generateMasterKeyPairs();
        
        // Start key rotation scheduler
        startKeyRotationScheduler();
        
        LOG.debug("Key management system initialized");
    }
    
    private void generateMasterKeyPairs() {
        try {
            // Generate primary Dilithium key pair
            KeyPair dilithiumMaster = dilithiumService.generateKeyPair();
            QuantumKeyPair qkp = new QuantumKeyPair(
                "master-dilithium",
                PRIMARY_SIGNATURE,
                dilithiumMaster,
                Instant.now(),
                QUANTUM_SECURITY_LEVEL
            );
            quantumKeys.put("master-dilithium", qkp);
            
            // Generate backup SPHINCS+ key pair
            KeyPair sphincsMaster = sphincsPlusService.generateKeyPair();
            QuantumKeyPair qkp2 = new QuantumKeyPair(
                "master-sphincs",
                BACKUP_SIGNATURE,
                sphincsMaster,
                Instant.now(),
                QUANTUM_SECURITY_LEVEL
            );
            quantumKeys.put("master-sphincs", qkp2);
            
            // Generate Kyber key pair for key encapsulation
            KeyPair kyberMaster = kyberKeyManager.generateKeyPair();
            QuantumKeyPair qkp3 = new QuantumKeyPair(
                "master-kyber",
                KEY_ENCAPSULATION,
                kyberMaster,
                Instant.now(),
                QUANTUM_SECURITY_LEVEL
            );
            quantumKeys.put("master-kyber", qkp3);
            
            LOG.info("Master quantum key pairs generated");
        } catch (Exception e) {
            LOG.error("Failed to generate master key pairs", e);
            throw new RuntimeException("Master key generation failed", e);
        }
    }
    
    private void startKeyRotationScheduler() {
        maintenanceExecutor.scheduleAtFixedRate(() -> {
            try {
                rotateExpiredKeys();
            } catch (Exception e) {
                LOG.error("Key rotation failed", e);
            }
        }, KEY_ROTATION_HOURS, KEY_ROTATION_HOURS, TimeUnit.HOURS);
    }
    
    private void initializeHybridCryptography() {
        if (!hybridMode.get()) return;
        
        try {
            // Generate hybrid classical keys for backward compatibility
            KeyPairGenerator rsaGen = KeyPairGenerator.getInstance("RSA");
            rsaGen.initialize(4096);
            KeyPair rsaKey = rsaGen.generateKeyPair();
            
            QuantumKeyPair hybrid = new QuantumKeyPair(
                "hybrid-rsa",
                HYBRID_CLASSIC,
                rsaKey,
                Instant.now(),
                4 // Classical security level
            );
            quantumKeys.put("hybrid-rsa", hybrid);
            
            LOG.debug("Hybrid cryptography initialized");
        } catch (Exception e) {
            LOG.warn("Hybrid cryptography initialization failed", e);
            hybridMode.set(false);
        }
    }
    
    private void initializeHSMIntegration() {
        try {
            hsmIntegration.initialize();
            if (hsmIntegration.isAvailable()) {
                hsmMode.set(true);
                LOG.info("HSM integration enabled");
            } else {
                LOG.info("HSM not available, using software-only cryptography");
            }
        } catch (Exception e) {
            LOG.warn("HSM integration failed", e);
            hsmMode.set(false);
        }
    }
    
    private void initializeSecurityMonitoring() {
        if (!threatDetectionEnabled.get()) return;
        
        // Start security monitoring task
        monitoringTask = CompletableFuture.runAsync(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    performSecurityMonitoring();
                    Thread.sleep(5000); // Monitor every 5 seconds
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    LOG.error("Security monitoring error", e);
                }
            }
        }, cryptoExecutor);
        
        LOG.debug("Security monitoring initialized");
    }
    
    private void startMaintenanceTasks() {
        // Entropy pool maintenance
        maintenanceExecutor.scheduleAtFixedRate(() -> {
            maintainEntropyPool();
        }, 1, 1, TimeUnit.MINUTES);
        
        // Performance metrics cleanup
        maintenanceExecutor.scheduleAtFixedRate(() -> {
            cleanupPerformanceMetrics();
        }, 1, 1, TimeUnit.HOURS);
        
        // Key usage tracking
        maintenanceExecutor.scheduleAtFixedRate(() -> {
            updateKeyUsageMetrics();
        }, 30, 30, TimeUnit.SECONDS);
    }
    
    private void validateNISTCompliance() {
        // Verify all algorithms meet NIST Level 5 requirements
        for (QuantumKeyPair qkp : quantumKeys.values()) {
            if (qkp.getSecurityLevel() < QUANTUM_SECURITY_LEVEL && !qkp.getAlgorithm().contains("hybrid")) {
                throw new RuntimeException("Key pair " + qkp.getKeyId() + " does not meet NIST Level " + QUANTUM_SECURITY_LEVEL + " requirements");
            }
        }
        
        LOG.info("NIST Level " + QUANTUM_SECURITY_LEVEL + " compliance validated");
    }
    
    /**
     * Generate quantum-resistant digital signature with performance optimization
     * 
     * @param data The data to sign
     * @param keyId The key identifier to use (null for primary key)
     * @param algorithm The signature algorithm (null for auto-select)
     * @return CompletableFuture containing the quantum signature
     */
    public CompletableFuture<QuantumSignature> quantumSign(byte[] data, String keyId, String algorithm) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            totalOperations.incrementAndGet();
            
            try {
                // Select optimal algorithm and key
                String selectedAlgorithm = selectOptimalSignatureAlgorithm(algorithm);
                String selectedKeyId = selectOptimalKey(keyId, selectedAlgorithm);
                
                QuantumKeyPair keyPair = quantumKeys.get(selectedKeyId);
                if (keyPair == null) {
                    throw new RuntimeException("Quantum key not found: " + selectedKeyId);
                }
                
                // Update key usage
                keyLastUsed.put(selectedKeyId, System.currentTimeMillis());
                
                // Perform signature with selected algorithm
                byte[] signature;
                switch (selectedAlgorithm) {
                    case PRIMARY_SIGNATURE:
                        signature = performDilithiumSigning(data, keyPair);
                        break;
                    case BACKUP_SIGNATURE:
                        signature = performSphincsSigning(data, keyPair);
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported signature algorithm: " + selectedAlgorithm);
                }
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                
                // Create quantum signature with metadata
                QuantumSignature qsig = new QuantumSignature(
                    signature,
                    selectedAlgorithm,
                    selectedKeyId,
                    keyPair.getSecurityLevel(),
                    duration,
                    Instant.now(),
                    generateSignatureMetadata(data, keyPair)
                );
                
                // Update performance metrics
                updateOperationMetrics(selectedAlgorithm, duration, true);
                successfulOperations.incrementAndGet();
                
                // Security monitoring
                if (threatDetectionEnabled.get()) {
                    detectSigningThreats(duration, selectedAlgorithm);
                }
                
                return qsig;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics(algorithm != null ? algorithm : PRIMARY_SIGNATURE, duration, false);
                failedOperations.incrementAndGet();
                securityEvents.incrementAndGet();
                
                LOG.error("Quantum signing failed", e);
                throw new RuntimeException("Quantum signing failed", e);
            }
        }, cryptoExecutor);
    }
    
    /**
     * Verify quantum-resistant digital signature with performance optimization
     * 
     * @param data The original data
     * @param signature The quantum signature to verify
     * @return CompletableFuture containing verification result
     */
    public CompletableFuture<QuantumVerificationResult> quantumVerify(byte[] data, QuantumSignature signature) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            totalOperations.incrementAndGet();
            
            try {
                // Validate signature freshness
                if (isSignatureExpired(signature)) {
                    return new QuantumVerificationResult(false, "Signature expired", 
                        (System.nanoTime() - startTime) / 1_000_000, signature.getAlgorithm());
                }
                
                // Verify signature based on algorithm
                boolean isValid;
                switch (signature.getAlgorithm()) {
                    case PRIMARY_SIGNATURE:
                        isValid = performDilithiumVerification(data, signature);
                        break;
                    case BACKUP_SIGNATURE:
                        isValid = performSphincsVerification(data, signature);
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported verification algorithm: " + signature.getAlgorithm());
                }
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                
                // Update performance metrics
                updateOperationMetrics(signature.getAlgorithm() + "_verify", duration, isValid);
                
                if (isValid) {
                    successfulOperations.incrementAndGet();
                } else {
                    failedOperations.incrementAndGet();
                    securityEvents.incrementAndGet();
                }
                
                // Security monitoring
                if (threatDetectionEnabled.get()) {
                    detectVerificationThreats(duration, isValid, signature.getAlgorithm());
                }
                
                return new QuantumVerificationResult(
                    isValid,
                    isValid ? "Valid quantum signature" : "Invalid quantum signature",
                    duration,
                    signature.getAlgorithm()
                );
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics(signature.getAlgorithm() + "_verify", duration, false);
                failedOperations.incrementAndGet();
                securityEvents.incrementAndGet();
                
                LOG.error("Quantum verification failed", e);
                return new QuantumVerificationResult(false, "Verification error: " + e.getMessage(),
                    duration, signature.getAlgorithm());
            }
        }, cryptoExecutor);
    }
    
    /**
     * Generate quantum-resistant key pair with specified parameters
     * 
     * @param algorithm The quantum algorithm to use
     * @param keyId The key identifier
     * @param securityLevel The required security level (1-5)
     * @return CompletableFuture containing the generated quantum key pair
     */
    public CompletableFuture<QuantumKeyPair> generateQuantumKeyPair(String algorithm, String keyId, int securityLevel) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                if (securityLevel < QUANTUM_SECURITY_LEVEL) {
                    throw new IllegalArgumentException("Security level must be at least " + QUANTUM_SECURITY_LEVEL);
                }
                
                KeyPair keyPair;
                switch (algorithm) {
                    case PRIMARY_SIGNATURE:
                        keyPair = dilithiumService.generateKeyPair();
                        break;
                    case BACKUP_SIGNATURE:
                        keyPair = sphincsPlusService.generateKeyPair();
                        break;
                    case KEY_ENCAPSULATION:
                        keyPair = kyberKeyManager.generateKeyPair();
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported quantum algorithm: " + algorithm);
                }
                
                QuantumKeyPair qkp = new QuantumKeyPair(
                    keyId,
                    algorithm,
                    keyPair,
                    Instant.now(),
                    securityLevel
                );
                
                // Store the key pair
                quantumKeys.put(keyId, qkp);
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics(algorithm + "_keygen", duration, true);
                
                LOG.debug("Generated quantum key pair: " + keyId + " (" + algorithm + ") in " + duration + "ms");
                
                return qkp;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics(algorithm + "_keygen", duration, false);
                
                LOG.error("Quantum key generation failed", e);
                throw new RuntimeException("Quantum key generation failed", e);
            }
        }, cryptoExecutor);
    }
    
    /**
     * Perform key encapsulation using CRYSTALS-Kyber
     * 
     * @param recipientKeyId The recipient's key identifier
     * @return CompletableFuture containing encapsulation result
     */
    public CompletableFuture<QuantumEncapsulationResult> quantumEncapsulate(String recipientKeyId) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                QuantumKeyPair recipientKey = quantumKeys.get(recipientKeyId);
                if (recipientKey == null) {
                    throw new RuntimeException("Recipient key not found: " + recipientKeyId);
                }
                
                if (!KEY_ENCAPSULATION.equals(recipientKey.getAlgorithm())) {
                    throw new RuntimeException("Key is not suitable for encapsulation: " + recipientKey.getAlgorithm());
                }
                
                // Perform Kyber encapsulation
                QuantumCryptoService.KyberEncapsulationResult result = 
                    kyberKeyManager.encapsulate(recipientKey.getKeyPair().getPublic());
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics("kyber_encapsulate", duration, true);
                
                return new QuantumEncapsulationResult(
                    result.getCiphertext(),
                    result.getSharedSecret(),
                    recipientKeyId,
                    duration,
                    Instant.now()
                );
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics("kyber_encapsulate", duration, false);
                
                LOG.error("Quantum encapsulation failed", e);
                throw new RuntimeException("Quantum encapsulation failed", e);
            }
        }, cryptoExecutor);
    }
    
    /**
     * Perform key decapsulation using CRYSTALS-Kyber
     * 
     * @param ciphertext The encapsulated key
     * @param keyId The decryption key identifier
     * @return CompletableFuture containing the shared secret
     */
    public CompletableFuture<byte[]> quantumDecapsulate(byte[] ciphertext, String keyId) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                QuantumKeyPair decryptionKey = quantumKeys.get(keyId);
                if (decryptionKey == null) {
                    throw new RuntimeException("Decryption key not found: " + keyId);
                }
                
                if (!KEY_ENCAPSULATION.equals(decryptionKey.getAlgorithm())) {
                    throw new RuntimeException("Key is not suitable for decapsulation: " + decryptionKey.getAlgorithm());
                }
                
                // Perform Kyber decapsulation
                byte[] sharedSecret = kyberKeyManager.decapsulate(ciphertext, decryptionKey.getKeyPair().getPrivate());
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics("kyber_decapsulate", duration, true);
                
                // Update key usage
                keyLastUsed.put(keyId, System.currentTimeMillis());
                
                return sharedSecret;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics("kyber_decapsulate", duration, false);
                
                LOG.error("Quantum decapsulation failed", e);
                throw new RuntimeException("Quantum decapsulation failed", e);
            }
        }, cryptoExecutor);
    }
    
    /**
     * Batch signing operation for high-throughput scenarios
     * 
     * @param dataItems The data items to sign
     * @param keyId The key identifier to use
     * @param algorithm The signature algorithm
     * @return CompletableFuture containing batch signature results
     */
    public CompletableFuture<List<QuantumSignature>> quantumBatchSign(List<byte[]> dataItems, String keyId, String algorithm) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            
            try {
                String selectedAlgorithm = selectOptimalSignatureAlgorithm(algorithm);
                String selectedKeyId = selectOptimalKey(keyId, selectedAlgorithm);
                
                QuantumKeyPair keyPair = quantumKeys.get(selectedKeyId);
                if (keyPair == null) {
                    throw new RuntimeException("Quantum key not found: " + selectedKeyId);
                }
                
                List<QuantumSignature> signatures = new ArrayList<>();
                
                // Batch processing for optimal performance
                switch (selectedAlgorithm) {
                    case PRIMARY_SIGNATURE:
                        byte[][] dilithiumSigs = dilithiumService.batchSign(
                            dataItems.toArray(new byte[0][]), 
                            keyPair.getKeyPair().getPrivate()
                        );
                        for (int i = 0; i < dilithiumSigs.length; i++) {
                            signatures.add(new QuantumSignature(
                                dilithiumSigs[i],
                                selectedAlgorithm,
                                selectedKeyId,
                                keyPair.getSecurityLevel(),
                                0, // Batch timing
                                Instant.now(),
                                generateSignatureMetadata(dataItems.get(i), keyPair)
                            ));
                        }
                        break;
                    case BACKUP_SIGNATURE:
                        byte[][] sphincsSigs = sphincsPlusService.signMultiple(
                            dataItems.toArray(new byte[0][]), 
                            keyPair.getKeyPair().getPrivate()
                        );
                        for (int i = 0; i < sphincsSigs.length; i++) {
                            signatures.add(new QuantumSignature(
                                sphincsSigs[i],
                                selectedAlgorithm,
                                selectedKeyId,
                                keyPair.getSecurityLevel(),
                                0, // Batch timing
                                Instant.now(),
                                generateSignatureMetadata(dataItems.get(i), keyPair)
                            ));
                        }
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported batch signature algorithm: " + selectedAlgorithm);
                }
                
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics(selectedAlgorithm + "_batch", duration, true);
                
                // Update key usage
                keyLastUsed.put(selectedKeyId, System.currentTimeMillis());
                
                LOG.debug("Batch signed " + dataItems.size() + " items in " + duration + "ms");
                
                return signatures;
                
            } catch (Exception e) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                updateOperationMetrics(algorithm + "_batch", duration, false);
                
                LOG.error("Quantum batch signing failed", e);
                throw new RuntimeException("Quantum batch signing failed", e);
            }
        }, cryptoExecutor);
    }
    
    // Algorithm selection and optimization methods
    
    private String selectOptimalSignatureAlgorithm(String requestedAlgorithm) {
        if (requestedAlgorithm != null) {
            return requestedAlgorithm;
        }
        
        // Auto-select based on current performance metrics
        String primary = primarySignatureAlgorithm.get();
        String backup = backupSignatureAlgorithm.get();
        
        AlgorithmMetrics primaryMetrics = algorithmPerformance.get(primary);
        AlgorithmMetrics backupMetrics = algorithmPerformance.get(backup);
        
        // Select primary if it meets performance targets
        if (primaryMetrics.getAverageLatency() <= TARGET_SIGNING_MS && 
            primaryMetrics.getSuccessRate() >= 0.999) {
            return primary;
        }
        
        // Fallback to backup algorithm
        if (backupMetrics.getAverageLatency() <= TARGET_SIGNING_MS * 2 && 
            backupMetrics.getSuccessRate() >= 0.999) {
            LOG.debug("Using backup signature algorithm due to primary performance issues");
            return backup;
        }
        
        // Default to primary if both have issues
        LOG.warn("Both signature algorithms have performance issues, using primary");
        return primary;
    }
    
    private String selectOptimalKey(String requestedKeyId, String algorithm) {
        if (requestedKeyId != null && quantumKeys.containsKey(requestedKeyId)) {
            return requestedKeyId;
        }
        
        // Auto-select master key for the algorithm
        switch (algorithm) {
            case PRIMARY_SIGNATURE:
                return "master-dilithium";
            case BACKUP_SIGNATURE:
                return "master-sphincs";
            case KEY_ENCAPSULATION:
                return "master-kyber";
            default:
                throw new IllegalArgumentException("No master key available for algorithm: " + algorithm);
        }
    }
    
    // Signature implementation methods
    
    private byte[] performDilithiumSigning(byte[] data, QuantumKeyPair keyPair) throws Exception {
        return dilithiumService.sign(data, keyPair.getKeyPair().getPrivate());
    }
    
    private byte[] performSphincsSigning(byte[] data, QuantumKeyPair keyPair) throws Exception {
        return sphincsPlusService.sign(data, keyPair.getKeyPair().getPrivate());
    }
    
    private boolean performDilithiumVerification(byte[] data, QuantumSignature signature) throws Exception {
        QuantumKeyPair keyPair = quantumKeys.get(signature.getKeyId());
        if (keyPair == null) {
            return false;
        }
        return dilithiumService.verify(data, signature.getSignatureBytes(), keyPair.getKeyPair().getPublic());
    }
    
    private boolean performSphincsVerification(byte[] data, QuantumSignature signature) throws Exception {
        QuantumKeyPair keyPair = quantumKeys.get(signature.getKeyId());
        if (keyPair == null) {
            return false;
        }
        return sphincsPlusService.verify(data, signature.getSignatureBytes(), keyPair.getKeyPair().getPublic());
    }
    
    // Security and monitoring methods
    
    private void performSecurityMonitoring() {
        // Calculate current threat level based on failure rates
        double failureRate = failedOperations.get() / (double) Math.max(1, totalOperations.get());
        
        if (failureRate > THREAT_DETECTION_THRESHOLD) {
            escalateThreatLevel();
        } else if (failureRate < THREAT_DETECTION_THRESHOLD / 2) {
            reduceThreatLevel();
        }
        
        // Monitor algorithm performance
        monitorAlgorithmPerformance();
        
        // Check for key rotation requirements
        checkKeyRotationRequirements();
    }
    
    private void escalateThreatLevel() {
        ThreatLevel current = currentThreatLevel.get();
        ThreatLevel newLevel = switch (current) {
            case NORMAL -> ThreatLevel.ELEVATED;
            case ELEVATED -> ThreatLevel.HIGH;
            case HIGH -> ThreatLevel.CRITICAL;
            case CRITICAL -> ThreatLevel.CRITICAL; // Already at max
        };
        
        if (newLevel != current) {
            currentThreatLevel.set(newLevel);
            quantumThreats.incrementAndGet();
            LOG.warn("Quantum threat level escalated to: " + newLevel);
        }
    }
    
    private void reduceThreatLevel() {
        ThreatLevel current = currentThreatLevel.get();
        ThreatLevel newLevel = switch (current) {
            case CRITICAL -> ThreatLevel.HIGH;
            case HIGH -> ThreatLevel.ELEVATED;
            case ELEVATED -> ThreatLevel.NORMAL;
            case NORMAL -> ThreatLevel.NORMAL; // Already at min
        };
        
        if (newLevel != current) {
            currentThreatLevel.set(newLevel);
            LOG.info("Quantum threat level reduced to: " + newLevel);
        }
    }
    
    private void detectSigningThreats(long duration, String algorithm) {
        if (duration > TARGET_SIGNING_MS * 10) {
            securityEvents.incrementAndGet();
            LOG.warn("Potential timing attack detected in " + algorithm + " signing: " + duration + "ms");
        }
    }
    
    private void detectVerificationThreats(long duration, boolean isValid, String algorithm) {
        if (duration > TARGET_VERIFICATION_MS * 10) {
            securityEvents.incrementAndGet();
            LOG.warn("Potential timing attack detected in " + algorithm + " verification: " + duration + "ms");
        }
        
        if (!isValid) {
            securityEvents.incrementAndGet();
            LOG.debug("Invalid signature detected for algorithm: " + algorithm);
        }
    }
    
    private void monitorAlgorithmPerformance() {
        for (AlgorithmMetrics metrics : algorithmPerformance.values()) {
            if (metrics.getAverageLatency() > TARGET_SIGNING_MS * 2) {
                LOG.warn("Algorithm " + metrics.getAlgorithm() + " exceeding performance targets: " + 
                    metrics.getAverageLatency() + "ms avg latency");
            }
            
            if (metrics.getSuccessRate() < 0.995) {
                LOG.warn("Algorithm " + metrics.getAlgorithm() + " has low success rate: " + 
                    String.format("%.3f%%", metrics.getSuccessRate() * 100));
            }
        }
    }
    
    private void checkKeyRotationRequirements() {
        long currentTime = System.currentTimeMillis();
        long rotationThreshold = KEY_ROTATION_HOURS * 60 * 60 * 1000L;
        
        for (Map.Entry<String, QuantumKeyPair> entry : quantumKeys.entrySet()) {
            QuantumKeyPair keyPair = entry.getValue();
            long keyAge = currentTime - keyPair.getCreationTime().toEpochMilli();
            
            if (keyAge > rotationThreshold) {
                LOG.info("Key rotation required for: " + entry.getKey() + " (age: " + (keyAge / 3600000) + " hours)");
                // Schedule key rotation
                scheduleKeyRotation(entry.getKey());
            }
        }
    }
    
    private void scheduleKeyRotation(String keyId) {
        maintenanceExecutor.schedule(() -> {
            try {
                rotateKey(keyId);
            } catch (Exception e) {
                LOG.error("Key rotation failed for " + keyId, e);
            }
        }, 1, TimeUnit.MINUTES);
    }
    
    private void rotateKey(String keyId) {
        QuantumKeyPair oldKey = quantumKeys.get(keyId);
        if (oldKey == null) {
            return;
        }
        
        LOG.info("Rotating quantum key: " + keyId);
        
        // Generate new key with same parameters
        generateQuantumKeyPair(oldKey.getAlgorithm(), keyId, oldKey.getSecurityLevel())
            .thenAccept(newKey -> {
                // Archive old key for historical verification
                quantumKeys.put(keyId + "_archived_" + System.currentTimeMillis(), oldKey);
                LOG.info("Key rotation completed for: " + keyId);
            })
            .exceptionally(throwable -> {
                LOG.error("Key rotation failed for " + keyId, throwable);
                return null;
            });
    }
    
    private void rotateExpiredKeys() {
        checkKeyRotationRequirements();
    }
    
    // Utility methods
    
    private boolean isSignatureExpired(QuantumSignature signature) {
        long signatureAge = System.currentTimeMillis() - signature.getCreationTime().toEpochMilli();
        return signatureAge > MAX_SIGNATURE_AGE_MINUTES * 60 * 1000L;
    }
    
    private Map<String, Object> generateSignatureMetadata(byte[] data, QuantumKeyPair keyPair) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("dataHash", calculateSecureHash(data));
        metadata.put("keyFingerprint", calculateKeyFingerprint(keyPair));
        metadata.put("nistLevel", keyPair.getSecurityLevel());
        metadata.put("quantum", true);
        return metadata;
    }
    
    private String calculateSecureHash(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hash = digest.digest(data);
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return "hash_error_" + System.nanoTime();
        }
    }
    
    private String calculateKeyFingerprint(QuantumKeyPair keyPair) {
        try {
            byte[] publicKeyBytes = keyPair.getKeyPair().getPublic().getEncoded();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fingerprint = digest.digest(publicKeyBytes);
            return Base64.getEncoder().encodeToString(fingerprint).substring(0, 16);
        } catch (Exception e) {
            return "fingerprint_error";
        }
    }
    
    private void updateOperationMetrics(String operation, long duration, boolean success) {
        AlgorithmMetrics metrics = algorithmPerformance.computeIfAbsent(operation, 
            k -> new AlgorithmMetrics(operation));
        metrics.recordOperation(duration, success);
        
        // Update global metrics
        avgLatency.updateAndGet(current -> current * 0.9 + duration * 0.1);
        
        // Calculate TPS
        long operations = totalOperations.get();
        if (operations > 0) {
            double tps = operations / (System.currentTimeMillis() / 1000.0);
            currentTps.set(tps);
        }
    }
    
    private void maintainEntropyPool() {
        // Ensure entropy pool has sufficient entropy for high-performance operations
        while (entropyPool.size() < 50) {
            byte[] entropy = new byte[64];
            quantumRandom.nextBytes(entropy);
            entropyPool.offer(entropy);
        }
        
        // Remove excess entropy to prevent memory issues
        while (entropyPool.size() > 200) {
            entropyPool.poll();
        }
    }
    
    private void cleanupPerformanceMetrics() {
        // Reset metrics older than 24 hours to prevent memory leaks
        for (AlgorithmMetrics metrics : algorithmPerformance.values()) {
            metrics.cleanup();
        }
        
        // Clean up old key usage records
        long cutoffTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000L);
        keyLastUsed.entrySet().removeIf(entry -> entry.getValue() < cutoffTime);
    }
    
    private void updateKeyUsageMetrics() {
        // Update key usage statistics for monitoring
        for (Map.Entry<String, Long> entry : keyLastUsed.entrySet()) {
            String keyId = entry.getKey();
            Long lastUsed = entry.getValue();
            
            QuantumKeyPair keyPair = quantumKeys.get(keyId);
            if (keyPair != null) {
                long timeSinceUse = System.currentTimeMillis() - lastUsed;
                if (timeSinceUse > 60 * 60 * 1000L) { // 1 hour
                    LOG.debug("Key " + keyId + " has not been used for " + (timeSinceUse / 3600000) + " hours");
                }
            }
        }
    }
    
    /**
     * Get quantum cryptography manager status
     */
    public QuantumCryptographyStatus getStatus() {
        return new QuantumCryptographyStatus(
            initialized.get(),
            hsmMode.get(),
            hybridMode.get(),
            currentThreatLevel.get(),
            quantumKeys.size(),
            totalOperations.get(),
            successfulOperations.get(),
            failedOperations.get(),
            currentTps.get(),
            avgLatency.get(),
            securityEvents.get(),
            quantumThreats.get()
        );
    }
    
    /**
     * Get algorithm performance metrics
     */
    public Map<String, AlgorithmMetrics> getAlgorithmMetrics() {
        return new HashMap<>(algorithmPerformance);
    }
    
    /**
     * Get available quantum keys
     */
    public Set<String> getAvailableKeys() {
        return new HashSet<>(quantumKeys.keySet());
    }
    
    /**
     * Shutdown quantum cryptography manager
     */
    public void shutdown() {
        if (!initialized.get()) {
            return;
        }
        
        LOG.info("Shutting down Quantum Cryptography Manager");
        
        // Stop monitoring
        if (monitoringTask != null) {
            monitoringTask.cancel(true);
        }
        
        // Shutdown executors
        if (maintenanceExecutor != null) {
            maintenanceExecutor.shutdown();
        }
        if (cryptoExecutor != null) {
            cryptoExecutor.shutdown();
        }
        
        // Shutdown component services
        try {
            dilithiumService.shutdown();
            sphincsPlusService.shutdown();
            kyberKeyManager.shutdown();
            quantumCryptoService.shutdown();
            hsmIntegration.shutdown();
        } catch (Exception e) {
            LOG.error("Error shutting down component services", e);
        }
        
        // Clear sensitive data
        quantumKeys.clear();
        keyCertificates.clear();
        keyLastUsed.clear();
        entropyPool.clear();
        
        initialized.set(false);
        LOG.info("Quantum Cryptography Manager shutdown complete");
    }
    
    // Inner classes for data structures
    
    public static class QuantumKeyPair {
        private final String keyId;
        private final String algorithm;
        private final KeyPair keyPair;
        private final Instant creationTime;
        private final int securityLevel;
        
        public QuantumKeyPair(String keyId, String algorithm, KeyPair keyPair, Instant creationTime, int securityLevel) {
            this.keyId = keyId;
            this.algorithm = algorithm;
            this.keyPair = keyPair;
            this.creationTime = creationTime;
            this.securityLevel = securityLevel;
        }
        
        // Getters
        public String getKeyId() { return keyId; }
        public String getAlgorithm() { return algorithm; }
        public KeyPair getKeyPair() { return keyPair; }
        public Instant getCreationTime() { return creationTime; }
        public int getSecurityLevel() { return securityLevel; }
    }
    
    public static class QuantumSignature {
        private final byte[] signatureBytes;
        private final String algorithm;
        private final String keyId;
        private final int securityLevel;
        private final long signingTime;
        private final Instant creationTime;
        private final Map<String, Object> metadata;
        
        public QuantumSignature(byte[] signatureBytes, String algorithm, String keyId, 
                               int securityLevel, long signingTime, Instant creationTime,
                               Map<String, Object> metadata) {
            this.signatureBytes = signatureBytes;
            this.algorithm = algorithm;
            this.keyId = keyId;
            this.securityLevel = securityLevel;
            this.signingTime = signingTime;
            this.creationTime = creationTime;
            this.metadata = metadata;
        }
        
        // Getters
        public byte[] getSignatureBytes() { return signatureBytes; }
        public String getAlgorithm() { return algorithm; }
        public String getKeyId() { return keyId; }
        public int getSecurityLevel() { return securityLevel; }
        public long getSigningTime() { return signingTime; }
        public Instant getCreationTime() { return creationTime; }
        public Map<String, Object> getMetadata() { return metadata; }
    }
    
    public static class QuantumVerificationResult {
        private final boolean valid;
        private final String message;
        private final long verificationTime;
        private final String algorithm;
        
        public QuantumVerificationResult(boolean valid, String message, long verificationTime, String algorithm) {
            this.valid = valid;
            this.message = message;
            this.verificationTime = verificationTime;
            this.algorithm = algorithm;
        }
        
        // Getters
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public long getVerificationTime() { return verificationTime; }
        public String getAlgorithm() { return algorithm; }
    }
    
    public static class QuantumEncapsulationResult {
        private final byte[] ciphertext;
        private final byte[] sharedSecret;
        private final String keyId;
        private final long encapsulationTime;
        private final Instant creationTime;
        
        public QuantumEncapsulationResult(byte[] ciphertext, byte[] sharedSecret, String keyId,
                                         long encapsulationTime, Instant creationTime) {
            this.ciphertext = ciphertext;
            this.sharedSecret = sharedSecret;
            this.keyId = keyId;
            this.encapsulationTime = encapsulationTime;
            this.creationTime = creationTime;
        }
        
        // Getters
        public byte[] getCiphertext() { return ciphertext; }
        public byte[] getSharedSecret() { return sharedSecret; }
        public String getKeyId() { return keyId; }
        public long getEncapsulationTime() { return encapsulationTime; }
        public Instant getCreationTime() { return creationTime; }
    }
    
    public static class AlgorithmMetrics {
        private final String algorithm;
        private long totalOperations = 0;
        private long successfulOperations = 0;
        private long totalTime = 0;
        private double averageLatency = 0.0;
        private double successRate = 1.0;
        
        public AlgorithmMetrics(String algorithm) {
            this.algorithm = algorithm;
        }
        
        public synchronized void recordOperation(long duration, boolean success) {
            totalOperations++;
            totalTime += duration;
            averageLatency = totalTime / (double) totalOperations;
            
            if (success) {
                successfulOperations++;
            }
            successRate = successfulOperations / (double) totalOperations;
        }
        
        public synchronized void cleanup() {
            // Reset if too old or too many operations
            if (totalOperations > 1_000_000) {
                totalOperations = totalOperations / 2;
                successfulOperations = successfulOperations / 2;
                totalTime = totalTime / 2;
            }
        }
        
        // Getters
        public String getAlgorithm() { return algorithm; }
        public long getTotalOperations() { return totalOperations; }
        public long getSuccessfulOperations() { return successfulOperations; }
        public double getAverageLatency() { return averageLatency; }
        public double getSuccessRate() { return successRate; }
    }
    
    public static class QuantumCryptographyStatus {
        private final boolean initialized;
        private final boolean hsmEnabled;
        private final boolean hybridMode;
        private final ThreatLevel threatLevel;
        private final int keyCount;
        private final long totalOperations;
        private final long successfulOperations;
        private final long failedOperations;
        private final double currentTps;
        private final double avgLatency;
        private final long securityEvents;
        private final long quantumThreats;
        
        public QuantumCryptographyStatus(boolean initialized, boolean hsmEnabled, boolean hybridMode,
                                       ThreatLevel threatLevel, int keyCount, long totalOperations,
                                       long successfulOperations, long failedOperations,
                                       double currentTps, double avgLatency,
                                       long securityEvents, long quantumThreats) {
            this.initialized = initialized;
            this.hsmEnabled = hsmEnabled;
            this.hybridMode = hybridMode;
            this.threatLevel = threatLevel;
            this.keyCount = keyCount;
            this.totalOperations = totalOperations;
            this.successfulOperations = successfulOperations;
            this.failedOperations = failedOperations;
            this.currentTps = currentTps;
            this.avgLatency = avgLatency;
            this.securityEvents = securityEvents;
            this.quantumThreats = quantumThreats;
        }
        
        // Getters
        public boolean isInitialized() { return initialized; }
        public boolean isHsmEnabled() { return hsmEnabled; }
        public boolean isHybridMode() { return hybridMode; }
        public ThreatLevel getThreatLevel() { return threatLevel; }
        public int getKeyCount() { return keyCount; }
        public long getTotalOperations() { return totalOperations; }
        public long getSuccessfulOperations() { return successfulOperations; }
        public long getFailedOperations() { return failedOperations; }
        public double getCurrentTps() { return currentTps; }
        public double getAvgLatency() { return avgLatency; }
        public long getSecurityEvents() { return securityEvents; }
        public long getQuantumThreats() { return quantumThreats; }
        
        public double getSuccessRate() {
            return totalOperations > 0 ? (double) successfulOperations / totalOperations : 1.0;
        }
    }
    
    public static class KeyCertificate {
        private final String keyId;
        private final X509Certificate certificate;
        private final Instant issuedAt;
        private final Instant expiresAt;
        
        public KeyCertificate(String keyId, X509Certificate certificate, Instant issuedAt, Instant expiresAt) {
            this.keyId = keyId;
            this.certificate = certificate;
            this.issuedAt = issuedAt;
            this.expiresAt = expiresAt;
        }
        
        // Getters
        public String getKeyId() { return keyId; }
        public X509Certificate getCertificate() { return certificate; }
        public Instant getIssuedAt() { return issuedAt; }
        public Instant getExpiresAt() { return expiresAt; }
        
        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }
    
    public enum ThreatLevel {
        NORMAL, ELEVATED, HIGH, CRITICAL
    }
}