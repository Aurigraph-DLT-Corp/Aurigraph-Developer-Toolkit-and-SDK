package io.aurigraph.basicnode.crypto;

import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.security.SecureRandom;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.time.Instant;
import java.util.logging.Logger;

@ApplicationScoped
@Startup
public class PostQuantumCryptoService {
    
    private static final Logger LOGGER = Logger.getLogger(PostQuantumCryptoService.class.getName());
    
    @Inject
    NTRUEngine ntruEngine;
    
    @Inject
    KeyManagementService keyManager;
    
    @Inject
    HardwareSecurityModule hsm;
    
    private final Map<String, PerformanceMetrics> metrics = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    
    public CompletionStage<EncryptedData> encryptData(byte[] data, String recipientId) {
        long startTime = System.nanoTime();
        
        return keyManager.getPublicKey(recipientId)
            .thenCompose(publicKey -> {
                if (publicKey == null) {
                    throw new RuntimeException("Public key not found for recipient: " + recipientId);
                }
                return ntruEngine.encrypt(data, publicKey);
            })
            .thenApply(encryptedBytes -> {
                long duration = System.nanoTime() - startTime;
                updateMetrics("encryption", duration, data.length);
                
                return new EncryptedData(
                    encryptedBytes,
                    recipientId,
                    generateEncryptionMetadata(data.length, duration)
                );
            })
            .exceptionally(throwable -> {
                LOGGER.severe("Encryption failed for recipient " + recipientId + ": " + throwable.getMessage());
                throw new RuntimeException("Encryption failed", throwable);
            });
    }
    
    public CompletionStage<byte[]> decryptData(EncryptedData encryptedData, String privateKeyId) {
        long startTime = System.nanoTime();
        
        return keyManager.getPrivateKey(privateKeyId)
            .thenCompose(privateKey -> {
                if (privateKey == null) {
                    throw new RuntimeException("Private key not found: " + privateKeyId);
                }
                return ntruEngine.decrypt(encryptedData.getData(), privateKey);
            })
            .thenApply(decryptedBytes -> {
                long duration = System.nanoTime() - startTime;
                updateMetrics("decryption", duration, decryptedBytes.length);
                
                return decryptedBytes;
            })
            .exceptionally(throwable -> {
                LOGGER.severe("Decryption failed for key " + privateKeyId + ": " + throwable.getMessage());
                throw new RuntimeException("Decryption failed", throwable);
            });
    }
    
    public CompletionStage<DigitalSignature> signData(byte[] data, String signerKeyId) {
        long startTime = System.nanoTime();
        
        return keyManager.getSigningKey(signerKeyId)
            .thenCompose(signingKey -> {
                if (signingKey == null) {
                    throw new RuntimeException("Signing key not found: " + signerKeyId);
                }
                return ntruEngine.sign(data, signingKey);
            })
            .thenApply(signatureBytes -> {
                long duration = System.nanoTime() - startTime;
                updateMetrics("signing", duration, data.length);
                
                return new DigitalSignature(
                    signatureBytes,
                    signerKeyId,
                    generateSignatureMetadata(data.length, duration)
                );
            })
            .exceptionally(throwable -> {
                LOGGER.severe("Signing failed for key " + signerKeyId + ": " + throwable.getMessage());
                throw new RuntimeException("Signing failed", throwable);
            });
    }
    
    public CompletionStage<Boolean> verifySignature(byte[] data, DigitalSignature signature, String verificationKeyId) {
        long startTime = System.nanoTime();
        
        return keyManager.getVerificationKey(verificationKeyId)
            .thenCompose(verificationKey -> {
                if (verificationKey == null) {
                    throw new RuntimeException("Verification key not found: " + verificationKeyId);
                }
                return ntruEngine.verify(data, signature.getSignature(), verificationKey);
            })
            .thenApply(isValid -> {
                long duration = System.nanoTime() - startTime;
                updateMetrics("verification", duration, data.length);
                
                return isValid;
            })
            .exceptionally(throwable -> {
                LOGGER.severe("Signature verification failed: " + throwable.getMessage());
                return false;
            });
    }
    
    public CompletionStage<KeyExchangeResult> performKeyExchange(String initiatorId, String responderId) {
        long startTime = System.nanoTime();
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Generate ephemeral key pair for initiator
                NTRUKeyPair initiatorKeyPair = ntruEngine.generateKeyPair();
                
                // Get responder's public key
                return keyManager.getPublicKey(responderId)
                    .thenCompose(responderPublicKey -> {
                        if (responderPublicKey == null) {
                            throw new RuntimeException("Responder public key not found: " + responderId);
                        }
                        
                        // Perform NTRU key exchange
                        return ntruEngine.keyExchange(initiatorKeyPair, responderPublicKey);
                    })
                    .thenApply(sharedSecret -> {
                        long duration = System.nanoTime() - startTime;
                        updateMetrics("keyExchange", duration, sharedSecret.length);
                        
                        return new KeyExchangeResult(
                            sharedSecret,
                            initiatorId,
                            responderId,
                            generateKeyExchangeMetadata(duration)
                        );
                    });
                    
            } catch (Exception e) {
                LOGGER.severe("Key exchange failed: " + e.getMessage());
                throw new RuntimeException("Key exchange failed", e);
            }
        }).thenCompose(result -> result);
    }
    
    public CompletionStage<HybridEncryptionResult> hybridEncrypt(byte[] data, String recipientId) {
        // Combine NTRU with AES-256 for performance
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Generate random AES key
                byte[] aesKey = new byte[32]; // 256-bit
                secureRandom.nextBytes(aesKey);
                
                // Encrypt data with AES
                byte[] aesEncryptedData = AESUtil.encrypt(data, aesKey);
                
                // Encrypt AES key with NTRU
                return encryptData(aesKey, recipientId)
                    .thenApply(encryptedAESKey -> {
                        return new HybridEncryptionResult(
                            aesEncryptedData,
                            encryptedAESKey,
                            recipientId,
                            "NTRU-AES256"
                        );
                    });
                    
            } catch (Exception e) {
                LOGGER.severe("Hybrid encryption failed: " + e.getMessage());
                throw new RuntimeException("Hybrid encryption failed", e);
            }
        }).thenCompose(result -> result);
    }
    
    public CompletionStage<byte[]> hybridDecrypt(HybridEncryptionResult encryptedResult, String privateKeyId) {
        // Decrypt AES key with NTRU, then decrypt data with AES
        return decryptData(encryptedResult.getEncryptedKey(), privateKeyId)
            .thenApply(aesKey -> {
                try {
                    return AESUtil.decrypt(encryptedResult.getEncryptedData(), aesKey);
                } catch (Exception e) {
                    LOGGER.severe("Hybrid decryption failed: " + e.getMessage());
                    throw new RuntimeException("Hybrid decryption failed", e);
                }
            });
    }
    
    public CompletionStage<Boolean> validateQuantumResistance(String keyId) {
        return keyManager.getKeyMetadata(keyId)
            .thenApply(metadata -> {
                if (metadata == null) {
                    return false;
                }
                
                // Check NTRU parameters meet quantum resistance requirements
                boolean hasCorrectKeySize = metadata.getKeySize() >= 1024;
                boolean hasCorrectSecurityLevel = metadata.getSecurityLevel() >= 256;
                boolean isNTRUBased = "NTRU".equals(metadata.getAlgorithm());
                boolean meetsNISTStandards = metadata.isNISTCompliant();
                
                return hasCorrectKeySize && hasCorrectSecurityLevel && 
                       isNTRUBased && meetsNISTStandards;
            });
    }
    
    public PerformanceMetrics getPerformanceMetrics() {
        return new PerformanceMetrics(
            calculateAverageMetric("encryption"),
            calculateAverageMetric("decryption"), 
            calculateAverageMetric("signing"),
            calculateAverageMetric("verification"),
            calculateAverageMetric("keyExchange"),
            getTotalOperations(),
            getErrorRate()
        );
    }
    
    private void updateMetrics(String operation, long durationNanos, int dataSize) {
        String key = operation + "_" + (dataSize / 1024) + "KB";
        metrics.compute(key, (k, existing) -> {
            if (existing == null) {
                return new PerformanceMetrics.OperationMetric(operation, 1, durationNanos, dataSize);
            } else {
                existing.addSample(durationNanos, dataSize);
                return existing;
            }
        });
    }
    
    private double calculateAverageMetric(String operation) {
        return metrics.entrySet().stream()
            .filter(entry -> entry.getKey().startsWith(operation))
            .mapToDouble(entry -> entry.getValue().getAverageDuration())
            .average()
            .orElse(0.0);
    }
    
    private long getTotalOperations() {
        return metrics.values().stream()
            .mapToLong(metric -> metric.getOperationCount())
            .sum();
    }
    
    private double getErrorRate() {
        // Calculate error rate from failed operations
        return 0.001; // Placeholder - would track actual errors
    }
    
    private EncryptionMetadata generateEncryptionMetadata(int dataSize, long duration) {
        return new EncryptionMetadata(
            Instant.now(),
            "NTRU-1024",
            dataSize,
            duration / 1_000_000, // Convert to milliseconds
            generateSecurityLevel()
        );
    }
    
    private SignatureMetadata generateSignatureMetadata(int dataSize, long duration) {
        return new SignatureMetadata(
            Instant.now(),
            "NTRU-SIGN",
            dataSize,
            duration / 1_000_000,
            generateSecurityLevel()
        );
    }
    
    private KeyExchangeMetadata generateKeyExchangeMetadata(long duration) {
        return new KeyExchangeMetadata(
            Instant.now(),
            "NTRU-ECDH",
            duration / 1_000_000,
            generateSecurityLevel()
        );
    }
    
    private int generateSecurityLevel() {
        // NTRU provides 256-bit equivalent security
        return 256;
    }
    
    // Data classes
    public static class EncryptedData {
        private final byte[] data;
        private final String recipientId;
        private final EncryptionMetadata metadata;
        
        public EncryptedData(byte[] data, String recipientId, EncryptionMetadata metadata) {
            this.data = data;
            this.recipientId = recipientId;
            this.metadata = metadata;
        }
        
        public byte[] getData() { return data; }
        public String getRecipientId() { return recipientId; }
        public EncryptionMetadata getMetadata() { return metadata; }
    }
    
    public static class DigitalSignature {
        private final byte[] signature;
        private final String signerId;
        private final SignatureMetadata metadata;
        
        public DigitalSignature(byte[] signature, String signerId, SignatureMetadata metadata) {
            this.signature = signature;
            this.signerId = signerId;
            this.metadata = metadata;
        }
        
        public byte[] getSignature() { return signature; }
        public String getSignerId() { return signerId; }
        public SignatureMetadata getMetadata() { return metadata; }
    }
    
    public static class KeyExchangeResult {
        private final byte[] sharedSecret;
        private final String initiatorId;
        private final String responderId;
        private final KeyExchangeMetadata metadata;
        
        public KeyExchangeResult(byte[] sharedSecret, String initiatorId, String responderId, KeyExchangeMetadata metadata) {
            this.sharedSecret = sharedSecret;
            this.initiatorId = initiatorId;
            this.responderId = responderId;
            this.metadata = metadata;
        }
        
        public byte[] getSharedSecret() { return sharedSecret; }
        public String getInitiatorId() { return initiatorId; }
        public String getResponderId() { return responderId; }
        public KeyExchangeMetadata getMetadata() { return metadata; }
    }
    
    public static class HybridEncryptionResult {
        private final byte[] encryptedData;
        private final EncryptedData encryptedKey;
        private final String recipientId;
        private final String algorithm;
        
        public HybridEncryptionResult(byte[] encryptedData, EncryptedData encryptedKey, String recipientId, String algorithm) {
            this.encryptedData = encryptedData;
            this.encryptedKey = encryptedKey;
            this.recipientId = recipientId;
            this.algorithm = algorithm;
        }
        
        public byte[] getEncryptedData() { return encryptedData; }
        public EncryptedData getEncryptedKey() { return encryptedKey; }
        public String getRecipientId() { return recipientId; }
        public String getAlgorithm() { return algorithm; }
    }
    
    // Metadata classes
    public static class EncryptionMetadata {
        private final Instant timestamp;
        private final String algorithm;
        private final int dataSize;
        private final long durationMs;
        private final int securityLevel;
        
        public EncryptionMetadata(Instant timestamp, String algorithm, int dataSize, long durationMs, int securityLevel) {
            this.timestamp = timestamp;
            this.algorithm = algorithm;
            this.dataSize = dataSize;
            this.durationMs = durationMs;
            this.securityLevel = securityLevel;
        }
        
        public Instant getTimestamp() { return timestamp; }
        public String getAlgorithm() { return algorithm; }
        public int getDataSize() { return dataSize; }
        public long getDurationMs() { return durationMs; }
        public int getSecurityLevel() { return securityLevel; }
    }
    
    public static class SignatureMetadata {
        private final Instant timestamp;
        private final String algorithm;
        private final int dataSize;
        private final long durationMs;
        private final int securityLevel;
        
        public SignatureMetadata(Instant timestamp, String algorithm, int dataSize, long durationMs, int securityLevel) {
            this.timestamp = timestamp;
            this.algorithm = algorithm;
            this.dataSize = dataSize;
            this.durationMs = durationMs;
            this.securityLevel = securityLevel;
        }
        
        public Instant getTimestamp() { return timestamp; }
        public String getAlgorithm() { return algorithm; }
        public int getDataSize() { return dataSize; }
        public long getDurationMs() { return durationMs; }
        public int getSecurityLevel() { return securityLevel; }
    }
    
    public static class KeyExchangeMetadata {
        private final Instant timestamp;
        private final String protocol;
        private final long durationMs;
        private final int securityLevel;
        
        public KeyExchangeMetadata(Instant timestamp, String protocol, long durationMs, int securityLevel) {
            this.timestamp = timestamp;
            this.protocol = protocol;
            this.durationMs = durationMs;
            this.securityLevel = securityLevel;
        }
        
        public Instant getTimestamp() { return timestamp; }
        public String getProtocol() { return protocol; }
        public long getDurationMs() { return durationMs; }
        public int getSecurityLevel() { return securityLevel; }
    }
    
    public static class PerformanceMetrics {
        private final double averageEncryptionTime;
        private final double averageDecryptionTime;
        private final double averageSigningTime;
        private final double averageVerificationTime;
        private final double averageKeyExchangeTime;
        private final long totalOperations;
        private final double errorRate;
        
        public PerformanceMetrics(double averageEncryptionTime, double averageDecryptionTime, 
                                double averageSigningTime, double averageVerificationTime,
                                double averageKeyExchangeTime, long totalOperations, double errorRate) {
            this.averageEncryptionTime = averageEncryptionTime;
            this.averageDecryptionTime = averageDecryptionTime;
            this.averageSigningTime = averageSigningTime;
            this.averageVerificationTime = averageVerificationTime;
            this.averageKeyExchangeTime = averageKeyExchangeTime;
            this.totalOperations = totalOperations;
            this.errorRate = errorRate;
        }
        
        public double getAverageEncryptionTime() { return averageEncryptionTime; }
        public double getAverageDecryptionTime() { return averageDecryptionTime; }
        public double getAverageSigningTime() { return averageSigningTime; }
        public double getAverageVerificationTime() { return averageVerificationTime; }
        public double getAverageKeyExchangeTime() { return averageKeyExchangeTime; }
        public long getTotalOperations() { return totalOperations; }
        public double getErrorRate() { return errorRate; }
        
        public static class OperationMetric {
            private final String operation;
            private long operationCount;
            private long totalDuration;
            private long totalDataSize;
            
            public OperationMetric(String operation, long count, long duration, int dataSize) {
                this.operation = operation;
                this.operationCount = count;
                this.totalDuration = duration;
                this.totalDataSize = dataSize;
            }
            
            public void addSample(long duration, int dataSize) {
                this.operationCount++;
                this.totalDuration += duration;
                this.totalDataSize += dataSize;
            }
            
            public double getAverageDuration() {
                return operationCount > 0 ? (double) totalDuration / operationCount / 1_000_000 : 0.0; // ms
            }
            
            public long getOperationCount() { return operationCount; }
            public String getOperation() { return operation; }
        }
    }
}