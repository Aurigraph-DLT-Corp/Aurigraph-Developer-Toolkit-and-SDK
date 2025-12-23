package io.aurigraph.basicnode.crypto;

import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.time.Instant;
import java.security.SecureRandom;
import java.util.logging.Logger;
import java.util.UUID;

@ApplicationScoped
@Startup
public class KeyManagementService {
    
    private static final Logger LOGGER = Logger.getLogger(KeyManagementService.class.getName());
    
    @Inject
    HardwareSecurityModule hsm;
    
    @Inject
    NTRUEngine ntruEngine;
    
    private final Map<String, NTRUPublicKey> publicKeys = new ConcurrentHashMap<>();
    private final Map<String, NTRUPrivateKey> privateKeys = new ConcurrentHashMap<>();
    private final Map<String, NTRUKeyPair.KeyMetadata> keyMetadata = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    
    public CompletionStage<String> generateKeyPair(String keyId, KeyGenerationParams params) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                LOGGER.info("Generating NTRU key pair for: " + keyId);
                
                // Generate key pair using NTRU engine
                NTRUKeyPair keyPair = ntruEngine.generateKeyPair().toCompletableFuture().join();
                
                // Store keys securely
                String actualKeyId = keyId != null ? keyId : UUID.randomUUID().toString();
                
                publicKeys.put(actualKeyId, keyPair.getPublicKey());
                privateKeys.put(actualKeyId, keyPair.getPrivateKey());
                keyMetadata.put(actualKeyId, keyPair.getMetadata());
                
                // Store in HSM if available
                if (hsm != null && params.useHSM) {
                    hsm.storeKeyPair(actualKeyId, keyPair);
                }
                
                LOGGER.info("NTRU key pair generated and stored for: " + actualKeyId);
                return actualKeyId;
                
            } catch (Exception e) {
                LOGGER.severe("Key generation failed for " + keyId + ": " + e.getMessage());
                throw new RuntimeException("Key generation failed", e);
            }
        });
    }
    
    public CompletionStage<NTRUPublicKey> getPublicKey(String keyId) {
        return CompletableFuture.supplyAsync(() -> {
            NTRUPublicKey publicKey = publicKeys.get(keyId);
            
            if (publicKey == null && hsm != null) {
                // Try to load from HSM
                publicKey = hsm.loadPublicKey(keyId);
                if (publicKey != null) {
                    publicKeys.put(keyId, publicKey);
                }
            }
            
            return publicKey;
        });
    }
    
    public CompletionStage<NTRUPrivateKey> getPrivateKey(String keyId) {
        return CompletableFuture.supplyAsync(() -> {
            NTRUPrivateKey privateKey = privateKeys.get(keyId);
            
            if (privateKey == null && hsm != null) {
                // Try to load from HSM
                privateKey = hsm.loadPrivateKey(keyId);
                if (privateKey != null) {
                    privateKeys.put(keyId, privateKey);
                }
            }
            
            return privateKey;
        });
    }
    
    public CompletionStage<NTRUPrivateKey> getSigningKey(String keyId) {
        // For NTRU, signing keys are the same as private keys
        return getPrivateKey(keyId);
    }
    
    public CompletionStage<NTRUPublicKey> getVerificationKey(String keyId) {
        // For NTRU, verification keys are the same as public keys
        return getPublicKey(keyId);
    }
    
    public CompletionStage<NTRUKeyPair.KeyMetadata> getKeyMetadata(String keyId) {
        return CompletableFuture.supplyAsync(() -> {
            return keyMetadata.get(keyId);
        });
    }
    
    public CompletionStage<Boolean> rotateKey(String keyId, KeyRotationParams params) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                LOGGER.info("Rotating key: " + keyId);
                
                // Generate new key pair
                NTRUKeyPair newKeyPair = ntruEngine.generateKeyPair().toCompletableFuture().join();
                
                // Store old key as backup if requested
                if (params.backupOldKey) {
                    String backupKeyId = keyId + "_backup_" + Instant.now().getEpochSecond();
                    publicKeys.put(backupKeyId, publicKeys.get(keyId));
                    privateKeys.put(backupKeyId, privateKeys.get(keyId));
                }
                
                // Replace with new keys
                publicKeys.put(keyId, newKeyPair.getPublicKey());
                privateKeys.put(keyId, newKeyPair.getPrivateKey());
                keyMetadata.put(keyId, newKeyPair.getMetadata());
                
                // Update HSM if being used
                if (hsm != null && params.updateHSM) {
                    hsm.rotateKey(keyId, newKeyPair);
                }
                
                LOGGER.info("Key rotation completed for: " + keyId);
                return true;
                
            } catch (Exception e) {
                LOGGER.severe("Key rotation failed for " + keyId + ": " + e.getMessage());
                return false;
            }
        });
    }
    
    public CompletionStage<Boolean> revokeKey(String keyId, String reason) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                LOGGER.info("Revoking key: " + keyId + ", reason: " + reason);
                
                // Remove from active storage
                publicKeys.remove(keyId);
                privateKeys.remove(keyId);
                
                // Update metadata to mark as revoked
                NTRUKeyPair.KeyMetadata metadata = keyMetadata.get(keyId);
                if (metadata != null) {
                    // In a full implementation, would create new metadata with revoked status
                    keyMetadata.remove(keyId);
                }
                
                // Revoke in HSM if being used
                if (hsm != null) {
                    hsm.revokeKey(keyId, reason);
                }
                
                LOGGER.info("Key revoked successfully: " + keyId);
                return true;
                
            } catch (Exception e) {
                LOGGER.severe("Key revocation failed for " + keyId + ": " + e.getMessage());
                return false;
            }
        });
    }
    
    public CompletionStage<String[]> listKeys(KeyListParams params) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return publicKeys.keySet().stream()
                    .filter(keyId -> {
                        if (params.includeExpired) {
                            return true;
                        }
                        
                        NTRUKeyPair.KeyMetadata metadata = keyMetadata.get(keyId);
                        return metadata == null || metadata.getExpiresAt() == null || 
                               Instant.now().isBefore(metadata.getExpiresAt());
                    })
                    .filter(keyId -> {
                        if (params.algorithm == null) {
                            return true;
                        }
                        
                        NTRUKeyPair.KeyMetadata metadata = keyMetadata.get(keyId);
                        return metadata != null && params.algorithm.equals(metadata.getAlgorithm());
                    })
                    .filter(keyId -> {
                        if (params.minSecurityLevel <= 0) {
                            return true;
                        }
                        
                        NTRUKeyPair.KeyMetadata metadata = keyMetadata.get(keyId);
                        return metadata != null && metadata.getSecurityLevel() >= params.minSecurityLevel;
                    })
                    .toArray(String[]::new);
                    
            } catch (Exception e) {
                LOGGER.severe("Key listing failed: " + e.getMessage());
                return new String[0];
            }
        });
    }
    
    public CompletionStage<Boolean> validateKeyIntegrity(String keyId) {
        return getPublicKey(keyId)
            .thenCombine(getPrivateKey(keyId), (publicKey, privateKey) -> {
                if (publicKey == null || privateKey == null) {
                    return false;
                }
                
                try {
                    // Test encryption/decryption cycle
                    byte[] testData = "NTRU_INTEGRITY_TEST".getBytes();
                    
                    byte[] encrypted = ntruEngine.encrypt(testData, publicKey)
                        .toCompletableFuture().join();
                    byte[] decrypted = ntruEngine.decrypt(encrypted, privateKey)
                        .toCompletableFuture().join();
                    
                    boolean integrity = Arrays.equals(testData, decrypted);
                    
                    LOGGER.info("Key integrity check for " + keyId + ": " + 
                               (integrity ? "PASSED" : "FAILED"));
                    
                    return integrity;
                    
                } catch (Exception e) {
                    LOGGER.warning("Key integrity test failed for " + keyId + ": " + e.getMessage());
                    return false;
                }
            });
    }
    
    public CompletionStage<KeyStatistics> getKeyStatistics() {
        return CompletableFuture.supplyAsync(() -> {
            int totalKeys = publicKeys.size();
            int quantumResistantKeys = 0;
            int nistCompliantKeys = 0;
            int expiredKeys = 0;
            
            Instant now = Instant.now();
            
            for (NTRUKeyPair.KeyMetadata metadata : keyMetadata.values()) {
                if (metadata.isQuantumResistant()) {
                    quantumResistantKeys++;
                }
                if (metadata.isNISTCompliant()) {
                    nistCompliantKeys++;
                }
                if (metadata.getExpiresAt() != null && now.isAfter(metadata.getExpiresAt())) {
                    expiredKeys++;
                }
            }
            
            return new KeyStatistics(
                totalKeys,
                quantumResistantKeys,
                nistCompliantKeys,
                expiredKeys,
                totalKeys - expiredKeys, // active keys
                calculateAverageSecurityLevel()
            );
        });
    }
    
    private int calculateAverageSecurityLevel() {
        return keyMetadata.values().stream()
            .mapToInt(NTRUKeyPair.KeyMetadata::getSecurityLevel)
            .average()
            .orElse(0.0)
            .intValue();
    }
    
    // Parameter classes
    public static class KeyGenerationParams {
        public final boolean useHSM;
        public final String purpose;
        public final Instant expiresAt;
        public final boolean allowBackup;
        
        public KeyGenerationParams(boolean useHSM, String purpose, Instant expiresAt, boolean allowBackup) {
            this.useHSM = useHSM;
            this.purpose = purpose;
            this.expiresAt = expiresAt;
            this.allowBackup = allowBackup;
        }
        
        public static KeyGenerationParams defaultParams() {
            return new KeyGenerationParams(true, "GENERAL", null, true);
        }
    }
    
    public static class KeyRotationParams {
        public final boolean backupOldKey;
        public final boolean updateHSM;
        public final String reason;
        
        public KeyRotationParams(boolean backupOldKey, boolean updateHSM, String reason) {
            this.backupOldKey = backupOldKey;
            this.updateHSM = updateHSM;
            this.reason = reason;
        }
        
        public static KeyRotationParams defaultParams() {
            return new KeyRotationParams(true, true, "ROUTINE_ROTATION");
        }
    }
    
    public static class KeyListParams {
        public final boolean includeExpired;
        public final String algorithm;
        public final int minSecurityLevel;
        
        public KeyListParams(boolean includeExpired, String algorithm, int minSecurityLevel) {
            this.includeExpired = includeExpired;
            this.algorithm = algorithm;
            this.minSecurityLevel = minSecurityLevel;
        }
        
        public static KeyListParams allKeys() {
            return new KeyListParams(true, null, 0);
        }
        
        public static KeyListParams activeQuantumResistant() {
            return new KeyListParams(false, "NTRU", 256);
        }
    }
    
    public static class KeyStatistics {
        private final int totalKeys;
        private final int quantumResistantKeys;
        private final int nistCompliantKeys;
        private final int expiredKeys;
        private final int activeKeys;
        private final int averageSecurityLevel;
        
        public KeyStatistics(int totalKeys, int quantumResistantKeys, int nistCompliantKeys,
                           int expiredKeys, int activeKeys, int averageSecurityLevel) {
            this.totalKeys = totalKeys;
            this.quantumResistantKeys = quantumResistantKeys;
            this.nistCompliantKeys = nistCompliantKeys;
            this.expiredKeys = expiredKeys;
            this.activeKeys = activeKeys;
            this.averageSecurityLevel = averageSecurityLevel;
        }
        
        public int getTotalKeys() { return totalKeys; }
        public int getQuantumResistantKeys() { return quantumResistantKeys; }
        public int getNistCompliantKeys() { return nistCompliantKeys; }
        public int getExpiredKeys() { return expiredKeys; }
        public int getActiveKeys() { return activeKeys; }
        public int getAverageSecurityLevel() { return averageSecurityLevel; }
        
        public double getQuantumResistanceRate() {
            return totalKeys > 0 ? (double) quantumResistantKeys / totalKeys * 100.0 : 0.0;
        }
        
        public double getComplianceRate() {
            return totalKeys > 0 ? (double) nistCompliantKeys / totalKeys * 100.0 : 0.0;
        }
        
        @Override
        public String toString() {
            return String.format("KeyStatistics{total=%d, quantum=%d (%.1f%%), nist=%d (%.1f%%), active=%d}",
                               totalKeys, quantumResistantKeys, getQuantumResistanceRate(),
                               nistCompliantKeys, getComplianceRate(), activeKeys);
        }
    }
}