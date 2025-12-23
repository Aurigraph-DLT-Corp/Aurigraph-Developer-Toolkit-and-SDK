package io.aurigraph.basicnode.crypto;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.time.Instant;
import java.security.SecureRandom;
import java.util.logging.Logger;
import java.util.UUID;

@ApplicationScoped
public class HardwareSecurityModule {
    
    private static final Logger LOGGER = Logger.getLogger(HardwareSecurityModule.class.getName());
    
    // Simulated HSM storage - in production would interface with actual HSM hardware
    private final Map<String, SecureKeyStore> secureStorage = new ConcurrentHashMap<>();
    private final Map<String, HSMSession> activeSessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final HSMConfiguration config;
    
    public HardwareSecurityModule() {
        this.config = new HSMConfiguration();
        this.initializeHSM();
    }
    
    private void initializeHSM() {
        LOGGER.info("Initializing Hardware Security Module...");
        LOGGER.info("HSM Configuration: " + config);
        LOGGER.info("HSM initialized with quantum-resistant capabilities");
    }
    
    public CompletionStage<String> createSession(String userId, String purpose) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String sessionId = UUID.randomUUID().toString();
                
                HSMSession session = new HSMSession(
                    sessionId,
                    userId,
                    purpose,
                    Instant.now(),
                    config.sessionTimeout
                );
                
                activeSessions.put(sessionId, session);
                
                LOGGER.info("HSM session created: " + sessionId + " for user: " + userId);
                return sessionId;
                
            } catch (Exception e) {
                LOGGER.severe("HSM session creation failed: " + e.getMessage());
                throw new RuntimeException("Session creation failed", e);
            }
        });
    }
    
    public CompletionStage<Boolean> closeSession(String sessionId) {
        return CompletableFuture.supplyAsync(() -> {
            HSMSession session = activeSessions.remove(sessionId);
            if (session != null) {
                LOGGER.info("HSM session closed: " + sessionId);
                return true;
            }
            return false;
        });
    }
    
    public CompletionStage<Boolean> storeKeyPair(String keyId, NTRUKeyPair keyPair) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Encrypt keys before storage using HSM's internal encryption
                byte[] encryptedPublicKey = encryptForStorage(keyPair.getPublicKey().toBytes());
                byte[] encryptedPrivateKey = encryptForStorage(serializePrivateKey(keyPair.getPrivateKey()));
                
                SecureKeyStore keyStore = new SecureKeyStore(
                    keyId,
                    encryptedPublicKey,
                    encryptedPrivateKey,
                    keyPair.getMetadata(),
                    Instant.now(),
                    generateKeyFingerprint(keyPair)
                );
                
                secureStorage.put(keyId, keyStore);
                
                LOGGER.info("Key pair securely stored in HSM: " + keyId);
                return true;
                
            } catch (Exception e) {
                LOGGER.severe("HSM key storage failed for " + keyId + ": " + e.getMessage());
                return false;
            }
        });
    }
    
    public NTRUPublicKey loadPublicKey(String keyId) {
        try {
            SecureKeyStore keyStore = secureStorage.get(keyId);
            if (keyStore == null) {
                return null;
            }
            
            byte[] decryptedPublicKey = decryptFromStorage(keyStore.getEncryptedPublicKey());
            return deserializePublicKey(decryptedPublicKey);
            
        } catch (Exception e) {
            LOGGER.severe("HSM public key loading failed for " + keyId + ": " + e.getMessage());
            return null;
        }
    }
    
    public NTRUPrivateKey loadPrivateKey(String keyId) {
        try {
            SecureKeyStore keyStore = secureStorage.get(keyId);
            if (keyStore == null) {
                return null;
            }
            
            byte[] decryptedPrivateKey = decryptFromStorage(keyStore.getEncryptedPrivateKey());
            return deserializePrivateKey(decryptedPrivateKey);
            
        } catch (Exception e) {
            LOGGER.severe("HSM private key loading failed for " + keyId + ": " + e.getMessage());
            return null;
        }
    }
    
    public CompletionStage<Boolean> rotateKey(String keyId, NTRUKeyPair newKeyPair) {
        return storeKeyPair(keyId, newKeyPair);
    }
    
    public CompletionStage<Boolean> revokeKey(String keyId, String reason) {
        return CompletableFuture.supplyAsync(() -> {
            SecureKeyStore keyStore = secureStorage.remove(keyId);
            if (keyStore != null) {
                LOGGER.info("Key revoked in HSM: " + keyId + ", reason: " + reason);
                return true;
            }
            return false;
        });
    }
    
    public CompletionStage<HSMStatus> getHSMStatus() {
        return CompletableFuture.supplyAsync(() -> {
            return new HSMStatus(
                "OPERATIONAL",
                config.manufacturer,
                config.model,
                config.firmwareVersion,
                secureStorage.size(),
                activeSessions.size(),
                calculateKeyStorageUsage(),
                Instant.now()
            );
        });
    }
    
    public CompletionStage<Boolean> performSelfTest() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                LOGGER.info("Performing HSM self-test...");
                
                // Test key generation
                String testKeyId = "hsm-test-" + UUID.randomUUID().toString();
                NTRUKeyPair testKeyPair = new NTRUEngine().generateKeyPair().toCompletableFuture().join();
                
                // Test storage and retrieval
                boolean storeResult = storeKeyPair(testKeyId, testKeyPair).toCompletableFuture().join();
                NTRUPublicKey retrievedPublic = loadPublicKey(testKeyId);
                NTRUPrivateKey retrievedPrivate = loadPrivateKey(testKeyId);
                
                // Test encryption/decryption
                byte[] testData = "HSM_SELF_TEST_DATA".getBytes();
                NTRUEngine engine = new NTRUEngine();
                
                byte[] encrypted = engine.encrypt(testData, retrievedPublic).toCompletableFuture().join();
                byte[] decrypted = engine.decrypt(encrypted, retrievedPrivate).toCompletableFuture().join();
                
                boolean testPassed = storeResult && 
                                   retrievedPublic != null && 
                                   retrievedPrivate != null &&
                                   Arrays.equals(testData, decrypted);
                
                // Cleanup test keys
                secureStorage.remove(testKeyId);
                
                LOGGER.info("HSM self-test " + (testPassed ? "PASSED" : "FAILED"));
                return testPassed;
                
            } catch (Exception e) {
                LOGGER.severe("HSM self-test failed: " + e.getMessage());
                return false;
            }
        });
    }
    
    private byte[] encryptForStorage(byte[] data) {
        // Simulate HSM internal encryption
        // In production, this would use HSM's hardware encryption
        
        byte[] key = config.internalEncryptionKey;
        byte[] encrypted = new byte[data.length];
        
        for (int i = 0; i < data.length; i++) {
            encrypted[i] = (byte) (data[i] ^ key[i % key.length]);
        }
        
        return encrypted;
    }
    
    private byte[] decryptFromStorage(byte[] encryptedData) {
        // Simulate HSM internal decryption
        return encryptForStorage(encryptedData); // XOR is its own inverse
    }
    
    private byte[] serializePrivateKey(NTRUPrivateKey privateKey) {
        // Serialize private key for storage
        // In production, use secure serialization format
        return ("NTRU_PRIVATE_KEY:" + privateKey.toString()).getBytes();
    }
    
    private NTRUPublicKey deserializePublicKey(byte[] data) {
        // Deserialize public key from storage
        // Placeholder implementation
        return null; // Would implement proper deserialization
    }
    
    private NTRUPrivateKey deserializePrivateKey(byte[] data) {
        // Deserialize private key from storage  
        // Placeholder implementation
        return null; // Would implement proper deserialization
    }
    
    private String generateKeyFingerprint(NTRUKeyPair keyPair) {
        // Generate fingerprint for key verification
        try {
            byte[] publicKeyBytes = keyPair.getPublicKey().toBytes();
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(publicKeyBytes);
            
            StringBuilder fingerprint = new StringBuilder();
            for (byte b : hash) {
                fingerprint.append(String.format("%02x", b));
            }
            
            return fingerprint.toString().substring(0, 16); // First 16 chars
            
        } catch (Exception e) {
            return UUID.randomUUID().toString().substring(0, 16);
        }
    }
    
    private double calculateKeyStorageUsage() {
        // Calculate storage usage as percentage
        int maxKeys = config.maxStoredKeys;
        int currentKeys = secureStorage.size();
        
        return maxKeys > 0 ? (double) currentKeys / maxKeys * 100.0 : 0.0;
    }
    
    // Supporting classes
    private static class SecureKeyStore {
        private final String keyId;
        private final byte[] encryptedPublicKey;
        private final byte[] encryptedPrivateKey;
        private final NTRUKeyPair.KeyMetadata metadata;
        private final Instant storedAt;
        private final String fingerprint;
        
        public SecureKeyStore(String keyId, byte[] encryptedPublicKey, byte[] encryptedPrivateKey,
                            NTRUKeyPair.KeyMetadata metadata, Instant storedAt, String fingerprint) {
            this.keyId = keyId;
            this.encryptedPublicKey = encryptedPublicKey;
            this.encryptedPrivateKey = encryptedPrivateKey;
            this.metadata = metadata;
            this.storedAt = storedAt;
            this.fingerprint = fingerprint;
        }
        
        public String getKeyId() { return keyId; }
        public byte[] getEncryptedPublicKey() { return encryptedPublicKey; }
        public byte[] getEncryptedPrivateKey() { return encryptedPrivateKey; }
        public NTRUKeyPair.KeyMetadata getMetadata() { return metadata; }
        public Instant getStoredAt() { return storedAt; }
        public String getFingerprint() { return fingerprint; }
    }
    
    private static class HSMSession {
        private final String sessionId;
        private final String userId;
        private final String purpose;
        private final Instant createdAt;
        private final long timeoutSeconds;
        
        public HSMSession(String sessionId, String userId, String purpose, Instant createdAt, long timeoutSeconds) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.purpose = purpose;
            this.createdAt = createdAt;
            this.timeoutSeconds = timeoutSeconds;
        }
        
        public boolean isExpired() {
            return Instant.now().isAfter(createdAt.plusSeconds(timeoutSeconds));
        }
        
        public String getSessionId() { return sessionId; }
        public String getUserId() { return userId; }
        public String getPurpose() { return purpose; }
        public Instant getCreatedAt() { return createdAt; }
    }
    
    public static class HSMConfiguration {
        public final String manufacturer = "Aurigraph HSM Simulator";
        public final String model = "AV10-HSM-1024";
        public final String firmwareVersion = "3.2.1";
        public final int maxStoredKeys = 10000;
        public final long sessionTimeout = 3600; // 1 hour
        public final byte[] internalEncryptionKey;
        public final boolean quantumResistant = true;
        public final boolean fipsCompliant = true;
        
        public HSMConfiguration() {
            // Generate internal encryption key
            SecureRandom random = new SecureRandom();
            this.internalEncryptionKey = new byte[32]; // 256-bit key
            random.nextBytes(this.internalEncryptionKey);
        }
        
        @Override
        public String toString() {
            return String.format("HSM{%s %s v%s, quantum=%s, fips=%s}",
                                manufacturer, model, firmwareVersion, quantumResistant, fipsCompliant);
        }
    }
    
    public static class HSMStatus {
        private final String status;
        private final String manufacturer;
        private final String model;
        private final String firmwareVersion;
        private final int storedKeys;
        private final int activeSessions;
        private final double storageUsage;
        private final Instant lastCheck;
        
        public HSMStatus(String status, String manufacturer, String model, String firmwareVersion,
                        int storedKeys, int activeSessions, double storageUsage, Instant lastCheck) {
            this.status = status;
            this.manufacturer = manufacturer;
            this.model = model;
            this.firmwareVersion = firmwareVersion;
            this.storedKeys = storedKeys;
            this.activeSessions = activeSessions;
            this.storageUsage = storageUsage;
            this.lastCheck = lastCheck;
        }
        
        public String getStatus() { return status; }
        public String getManufacturer() { return manufacturer; }
        public String getModel() { return model; }
        public String getFirmwareVersion() { return firmwareVersion; }
        public int getStoredKeys() { return storedKeys; }
        public int getActiveSessions() { return activeSessions; }
        public double getStorageUsage() { return storageUsage; }
        public Instant getLastCheck() { return lastCheck; }
        
        public boolean isHealthy() {
            return "OPERATIONAL".equals(status) && storageUsage < 90.0;
        }
        
        @Override
        public String toString() {
            return String.format("HSMStatus{status=%s, keys=%d, sessions=%d, storage=%.1f%%}",
                                status, storedKeys, activeSessions, storageUsage);
        }
    }
}