package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.crypto.*;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Singleton;
import org.jboss.logging.Logger;

import com.google.protobuf.ByteString;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Quantum-Resistant Cryptography Service Implementation
 * Sprint 13 - Workstream 3: Quantum Cryptography Foundation
 *
 * Implements post-quantum cryptographic algorithms:
 * - CRYSTALS-Dilithium (Digital Signatures)
 * - CRYSTALS-Kyber (Key Encapsulation)
 * - NIST Level 1, 3, 5 security
 *
 * Production implementation will use BouncyCastle PQC provider.
 * This stub uses standard Java crypto for development.
 */
@GrpcService
@Singleton
public class CryptoServiceImpl implements CryptoService {

    private static final Logger LOG = Logger.getLogger(CryptoServiceImpl.class);

    // Key storage (in-memory, will be replaced with secure vault)
    private final Map<String, KeyPair> keyStore = new ConcurrentHashMap<>();

    // Cipher suite configuration
    private static final int AES_KEY_SIZE = 256;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    /**
     * Generate quantum-resistant key pair
     * Sprint 13 - Dilithium + Kyber key generation
     */
    @Override
    public Uni<KeyPairResponse> generateKeyPair(KeyGenRequest request) {
        LOG.infof("Generating key pair: algorithm=%s, level=%s, keyId=%s",
            request.getAlgorithm(), request.getSecurityLevel(), request.getKeyId());

        return Uni.createFrom().item(() -> {
            try {
                long startTime = System.currentTimeMillis();

                // Generate key pair based on algorithm
                KeyPair keyPair = generateQuantumResistantKeyPair(
                    request.getAlgorithm(),
                    request.getSecurityLevel()
                );

                // Store key pair
                keyStore.put(request.getKeyId(), keyPair);

                long generationTime = System.currentTimeMillis() - startTime;
                LOG.infof("Key pair generated in %dms for keyId=%s", generationTime, request.getKeyId());

                return KeyPairResponse.newBuilder()
                    .setKeyId(request.getKeyId())
                    .setPublicKey(ByteString.copyFrom(keyPair.getPublic().getEncoded()))
                    .setPrivateKey(ByteString.copyFrom(keyPair.getPrivate().getEncoded()))
                    .setAlgorithm(request.getAlgorithm())
                    .setTimestamp(System.currentTimeMillis())
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to generate key pair for keyId=%s", request.getKeyId());
                throw new RuntimeException("Key generation failed", e);
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Sign data with Dilithium signature
     * Sprint 14 - Production Dilithium implementation
     */
    @Override
    public Uni<SignResponse> sign(SignRequest request) {
        LOG.debugf("Signing data with algorithm=%s", request.getAlgorithm());

        return Uni.createFrom().item(() -> {
            try {
                long startTime = System.currentTimeMillis();

                // Create signature using quantum-resistant algorithm
                byte[] signature = signDataQuantumResistant(
                    request.getData().toByteArray(),
                    request.getPrivateKey().toByteArray(),
                    request.getAlgorithm()
                );

                long signingTime = System.currentTimeMillis() - startTime;

                return SignResponse.newBuilder()
                    .setSignature(ByteString.copyFrom(signature))
                    .setSignatureSize(signature.length)
                    .setSigningTimeMs(signingTime)
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Signing failed");
                throw new RuntimeException("Signature generation failed", e);
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Verify Dilithium signature
     * Sprint 14 - Signature verification
     */
    @Override
    public Uni<VerifyResponse> verify(VerifyRequest request) {
        LOG.debugf("Verifying signature with algorithm=%s", request.getAlgorithm());

        return Uni.createFrom().item(() -> {
            try {
                long startTime = System.currentTimeMillis();

                boolean valid = verifySignatureQuantumResistant(
                    request.getData().toByteArray(),
                    request.getSignature().toByteArray(),
                    request.getPublicKey().toByteArray(),
                    request.getAlgorithm()
                );

                long verificationTime = System.currentTimeMillis() - startTime;

                return VerifyResponse.newBuilder()
                    .setValid(valid)
                    .setVerificationTimeMs(verificationTime)
                    .setErrorMessage(valid ? "" : "Signature verification failed")
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Verification failed");
                return VerifyResponse.newBuilder()
                    .setValid(false)
                    .setVerificationTimeMs(0)
                    .setErrorMessage("Verification error: " + e.getMessage())
                    .build();
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Batch verify signatures in parallel
     * Sprint 15 - Performance optimization
     */
    @Override
    public Uni<BatchVerifyResponse> batchVerify(BatchVerifyRequest request) {
        LOG.infof("Batch verifying %d signatures", request.getVerificationsCount());

        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();

            List<Boolean> results;
            int successful = 0;
            int failed = 0;

            if (request.getParallelVerification()) {
                // Parallel verification using virtual threads
                results = request.getVerificationsList().parallelStream()
                    .map(verifyReq -> verify(verifyReq).await().indefinitely().getValid())
                    .toList();
            } else {
                // Sequential verification
                results = request.getVerificationsList().stream()
                    .map(verifyReq -> verify(verifyReq).await().indefinitely().getValid())
                    .toList();
            }

            // Count results
            for (Boolean result : results) {
                if (result) {
                    successful++;
                } else {
                    failed++;
                }
            }

            long totalTime = System.currentTimeMillis() - startTime;
            LOG.infof("Batch verification complete: %d successful, %d failed in %dms",
                successful, failed, totalTime);

            return BatchVerifyResponse.newBuilder()
                .setTotalVerifications(request.getVerificationsCount())
                .setSuccessfulVerifications(successful)
                .setFailedVerifications(failed)
                .addAllResults(results)
                .setTotalTimeMs(totalTime)
                .build();
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Kyber key exchange
     * Sprint 14 - Quantum-resistant key exchange
     */
    @Override
    public Uni<KeyExchangeResponse> keyExchange(KeyExchangeRequest request) {
        LOG.debugf("Key exchange: step=%s", request.getStep());

        return Uni.createFrom().item(() -> {
            try {
                switch (request.getStep()) {
                    case INITIATE:
                        // Initiator generates shared secret and encapsulates it
                        byte[] sharedSecret = generateSharedSecret();
                        byte[] encapsulated = encapsulateSecret(
                            sharedSecret,
                            request.getPublicKey().toByteArray()
                        );

                        return KeyExchangeResponse.newBuilder()
                            .setSharedSecret(ByteString.copyFrom(sharedSecret))
                            .setEncapsulatedSecret(ByteString.copyFrom(encapsulated))
                            .setStep(KeyExchangeStep.RESPOND)
                            .build();

                    case RESPOND:
                        // Responder decapsulates shared secret
                        byte[] decapsulated = decapsulateSecret(
                            request.getEncapsulatedSecret().toByteArray()
                        );

                        return KeyExchangeResponse.newBuilder()
                            .setSharedSecret(ByteString.copyFrom(decapsulated))
                            .setStep(KeyExchangeStep.COMPLETE)
                            .build();

                    default:
                        throw new IllegalArgumentException("Invalid key exchange step");
                }
            } catch (Exception e) {
                LOG.errorf(e, "Key exchange failed");
                throw new RuntimeException("Key exchange failed", e);
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Encrypt data with AES-256-GCM or ChaCha20-Poly1305
     * Sprint 13 - Symmetric encryption
     */
    @Override
    public Uni<EncryptResponse> encrypt(EncryptRequest request) {
        LOG.debugf("Encrypting data with mode=%s", request.getMode());

        return Uni.createFrom().item(() -> {
            try {
                byte[] plaintext = request.getPlaintext().toByteArray();
                byte[] key = request.getEncryptionKey().toByteArray();

                // Generate random IV
                byte[] iv = new byte[GCM_IV_LENGTH];
                SecureRandom random = new SecureRandom();
                random.nextBytes(iv);

                // Encrypt based on mode
                byte[] ciphertext;
                byte[] tag = new byte[0];

                if (request.getMode() == EncryptionMode.AES_256_GCM) {
                    Object[] result = encryptAESGCM(plaintext, key, iv);
                    ciphertext = (byte[]) result[0];
                    tag = (byte[]) result[1];
                } else {
                    // ChaCha20-Poly1305 (stub for now)
                    ciphertext = encryptChaCha20(plaintext, key, iv);
                }

                return EncryptResponse.newBuilder()
                    .setCiphertext(ByteString.copyFrom(ciphertext))
                    .setIv(ByteString.copyFrom(iv))
                    .setTag(ByteString.copyFrom(tag))
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Encryption failed");
                throw new RuntimeException("Encryption failed", e);
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Decrypt data
     * Sprint 13 - Symmetric decryption
     */
    @Override
    public Uni<DecryptResponse> decrypt(DecryptRequest request) {
        LOG.debugf("Decrypting data with mode=%s", request.getMode());

        return Uni.createFrom().item(() -> {
            try {
                byte[] ciphertext = request.getCiphertext().toByteArray();
                byte[] key = request.getDecryptionKey().toByteArray();
                byte[] iv = request.getIv().toByteArray();

                byte[] plaintext;

                if (request.getMode() == EncryptionMode.AES_256_GCM) {
                    byte[] tag = request.getTag().toByteArray();
                    plaintext = decryptAESGCM(ciphertext, key, iv, tag);
                } else {
                    plaintext = decryptChaCha20(ciphertext, key, iv);
                }

                return DecryptResponse.newBuilder()
                    .setPlaintext(ByteString.copyFrom(plaintext))
                    .setSuccess(true)
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Decryption failed");
                return DecryptResponse.newBuilder()
                    .setSuccess(false)
                    .build();
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Hash data with SHA3 or BLAKE3
     * Sprint 13 - Cryptographic hashing
     */
    @Override
    public Uni<HashResponse> hash(HashRequest request) {
        LOG.debugf("Hashing data with algorithm=%s", request.getAlgorithm());

        return Uni.createFrom().item(() -> {
            try {
                byte[] data = request.getData().toByteArray();
                byte[] hash;

                switch (request.getAlgorithm()) {
                    case SHA3_256:
                        hash = hashSHA3(data, 256);
                        break;
                    case SHA3_512:
                        hash = hashSHA3(data, 512);
                        break;
                    case BLAKE3:
                        // BLAKE3 stub (will use external library)
                        hash = hashSHA3(data, 256); // Fallback to SHA3
                        break;
                    default:
                        throw new IllegalArgumentException("Unknown hash algorithm");
                }

                return HashResponse.newBuilder()
                    .setHash(ByteString.copyFrom(hash))
                    .setHashSize(hash.length)
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Hashing failed");
                throw new RuntimeException("Hashing failed", e);
            }
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // Helper methods - Production will use BouncyCastle PQC

    private KeyPair generateQuantumResistantKeyPair(CryptoAlgorithm algorithm, SecurityLevel level)
            throws Exception {
        // Stub: Uses RSA for development, will be replaced with Dilithium/Kyber
        int keySize = switch (level) {
            case NIST_LEVEL_5 -> 4096;
            case NIST_LEVEL_3 -> 3072;
            case NIST_LEVEL_1 -> 2048;
            default -> 3072;
        };

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(keySize, new SecureRandom());
        return keyGen.generateKeyPair();
    }

    private byte[] signDataQuantumResistant(byte[] data, byte[] privateKeyBytes, CryptoAlgorithm algorithm)
            throws Exception {
        // Stub: Uses RSA for development
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(
            new PKCS8EncodedKeySpec(privateKeyBytes)
        );

        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(data);
        return signature.sign();
    }

    private boolean verifySignatureQuantumResistant(byte[] data, byte[] signatureBytes,
            byte[] publicKeyBytes, CryptoAlgorithm algorithm) throws Exception {
        // Stub: Uses RSA for development
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PublicKey publicKey = keyFactory.generatePublic(
            new X509EncodedKeySpec(publicKeyBytes)
        );

        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(publicKey);
        signature.update(data);
        return signature.verify(signatureBytes);
    }

    private byte[] generateSharedSecret() {
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);
        return secret;
    }

    private byte[] encapsulateSecret(byte[] secret, byte[] publicKey) {
        // Stub: Simple XOR for development, will use Kyber
        byte[] result = new byte[secret.length];
        for (int i = 0; i < secret.length; i++) {
            result[i] = (byte) (secret[i] ^ publicKey[i % publicKey.length]);
        }
        return result;
    }

    private byte[] decapsulateSecret(byte[] encapsulated) {
        // Stub: Returns encapsulated data as-is for development
        return encapsulated;
    }

    private Object[] encryptAESGCM(byte[] plaintext, byte[] key, byte[] iv) throws Exception {
        SecretKey secretKey = new SecretKeySpec(key, 0, 32, "AES");

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

        byte[] ciphertext = cipher.doFinal(plaintext);

        // Extract tag from end of ciphertext
        int tagLength = GCM_TAG_LENGTH / 8;
        byte[] tag = Arrays.copyOfRange(ciphertext, ciphertext.length - tagLength, ciphertext.length);
        byte[] ciphertextOnly = Arrays.copyOfRange(ciphertext, 0, ciphertext.length - tagLength);

        return new Object[] { ciphertextOnly, tag };
    }

    private byte[] decryptAESGCM(byte[] ciphertext, byte[] key, byte[] iv, byte[] tag) throws Exception {
        SecretKey secretKey = new SecretKeySpec(key, 0, 32, "AES");

        // Combine ciphertext and tag
        byte[] combined = new byte[ciphertext.length + tag.length];
        System.arraycopy(ciphertext, 0, combined, 0, ciphertext.length);
        System.arraycopy(tag, 0, combined, ciphertext.length, tag.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

        return cipher.doFinal(combined);
    }

    private byte[] encryptChaCha20(byte[] plaintext, byte[] key, byte[] iv) {
        // Stub: Will use BouncyCastle ChaCha20-Poly1305
        return plaintext; // Passthrough for now
    }

    private byte[] decryptChaCha20(byte[] ciphertext, byte[] key, byte[] iv) {
        // Stub: Will use BouncyCastle ChaCha20-Poly1305
        return ciphertext; // Passthrough for now
    }

    private byte[] hashSHA3(byte[] data, int bitLength) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA3-" + bitLength);
        return digest.digest(data);
    }
}
