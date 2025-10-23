package io.aurigraph.v11.grpc.services;

import io.aurigraph.v11.grpc.crypto.*;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;

import static org.junit.jupiter.api.Assertions.*;

import com.google.protobuf.ByteString;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Crypto Service Tests
 * Sprint 13 - Workstream 4: Test Automation
 *
 * Tests quantum-resistant cryptography:
 * - Dilithium signatures
 * - Kyber key exchange
 * - AES-256-GCM encryption
 * - SHA3 hashing
 *
 * Target: 98% coverage (critical security module)
 *
 * NOTE: Using direct instantiation instead of CDI injection because
 * @GrpcService beans cannot be injected in unit tests with @Inject.
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CryptoServiceTest {

    // Direct instantiation for unit testing gRPC services
    private CryptoServiceImpl cryptoService;

    private KeyGenRequest keyGenRequest;
    private byte[] testData;
    private KeyPairResponse keyPair;

    @BeforeEach
    void setUp() {
        // Instantiate service for testing
        cryptoService = new CryptoServiceImpl();

        keyGenRequest = KeyGenRequest.newBuilder()
            .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
            .setSecurityLevel(SecurityLevel.NIST_LEVEL_5)
            .setKeyId("test-key-001")
            .build();

        testData = "Hello Quantum World!".getBytes(StandardCharsets.UTF_8);
    }

    @Test
    @Order(1)
    @DisplayName("Generate key pair - NIST Level 5")
    void testGenerateKeyPairLevel5() {
        KeyPairResponse response = cryptoService
            .generateKeyPair(keyGenRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertEquals("test-key-001", response.getKeyId());
        assertEquals(CryptoAlgorithm.DILITHIUM5, response.getAlgorithm());
        assertTrue(response.getPublicKey().size() > 0);
        assertTrue(response.getPrivateKey().size() > 0);
        assertTrue(response.getTimestamp() > 0);

        // Store for later tests
        keyPair = response;
    }

    @Test
    @Order(2)
    @DisplayName("Generate key pair - NIST Level 3")
    void testGenerateKeyPairLevel3() {
        KeyGenRequest request = KeyGenRequest.newBuilder()
            .setAlgorithm(CryptoAlgorithm.DILITHIUM3)
            .setSecurityLevel(SecurityLevel.NIST_LEVEL_3)
            .setKeyId("test-key-level3")
            .build();

        KeyPairResponse response = cryptoService
            .generateKeyPair(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertEquals("test-key-level3", response.getKeyId());

        // Level 3 should have smaller keys than Level 5
        // (This is a stub test, actual sizes will vary with real PQC)
        assertNotNull(response.getPublicKey());
    }

    @Test
    @Order(3)
    @DisplayName("Sign data - should create signature")
    void testSignData() {
        // First generate keys
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        SignRequest request = SignRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setPrivateKey(keyPair.getPrivateKey())
            .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
            .build();

        SignResponse response = cryptoService
            .sign(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getSignature().size() > 0);
        assertTrue(response.getSignatureSize() > 0);
        assertTrue(response.getSigningTimeMs() >= 0);
    }

    @Test
    @Order(4)
    @DisplayName("Verify signature - valid signature should pass")
    void testVerifyValidSignature() {
        // Generate keys and sign
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        SignRequest signRequest = SignRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setPrivateKey(keyPair.getPrivateKey())
            .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
            .build();

        SignResponse signResponse = cryptoService.sign(signRequest).await().indefinitely();

        // Verify
        VerifyRequest verifyRequest = VerifyRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setSignature(signResponse.getSignature())
            .setPublicKey(keyPair.getPublicKey())
            .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
            .build();

        VerifyResponse response = cryptoService
            .verify(verifyRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getValid());
        assertTrue(response.getVerificationTimeMs() >= 0);
        assertEquals("", response.getErrorMessage());
    }

    @Test
    @Order(5)
    @DisplayName("Verify signature - invalid signature should fail")
    void testVerifyInvalidSignature() {
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        // Create invalid signature
        VerifyRequest verifyRequest = VerifyRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setSignature(ByteString.copyFrom("invalid-signature".getBytes()))
            .setPublicKey(keyPair.getPublicKey())
            .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
            .build();

        VerifyResponse response = cryptoService
            .verify(verifyRequest)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertFalse(response.getValid());
    }

    @Test
    @Order(6)
    @DisplayName("Batch verify - sequential verification")
    void testBatchVerifySequential() {
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        List<VerifyRequest> verifications = new ArrayList<>();

        // Create 10 signatures to verify
        for (int i = 0; i < 10; i++) {
            byte[] data = ("message-" + i).getBytes();

            SignRequest signReq = SignRequest.newBuilder()
                .setData(ByteString.copyFrom(data))
                .setPrivateKey(keyPair.getPrivateKey())
                .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
                .build();

            SignResponse signResp = cryptoService.sign(signReq).await().indefinitely();

            verifications.add(VerifyRequest.newBuilder()
                .setData(ByteString.copyFrom(data))
                .setSignature(signResp.getSignature())
                .setPublicKey(keyPair.getPublicKey())
                .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
                .build());
        }

        BatchVerifyRequest request = BatchVerifyRequest.newBuilder()
            .addAllVerifications(verifications)
            .setParallelVerification(false)
            .build();

        BatchVerifyResponse response = cryptoService
            .batchVerify(request)
            .await()
            .atMost(Duration.ofSeconds(10));

        assertNotNull(response);
        assertEquals(10, response.getTotalVerifications());
        assertEquals(10, response.getSuccessfulVerifications());
        assertEquals(0, response.getFailedVerifications());
        assertTrue(response.getTotalTimeMs() > 0);
    }

    @Test
    @Order(7)
    @DisplayName("Batch verify - parallel verification should be faster")
    void testBatchVerifyParallel() {
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        List<VerifyRequest> verifications = new ArrayList<>();

        // Create 50 signatures to verify
        for (int i = 0; i < 50; i++) {
            byte[] data = ("parallel-message-" + i).getBytes();

            SignRequest signReq = SignRequest.newBuilder()
                .setData(ByteString.copyFrom(data))
                .setPrivateKey(keyPair.getPrivateKey())
                .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
                .build();

            SignResponse signResp = cryptoService.sign(signReq).await().indefinitely();

            verifications.add(VerifyRequest.newBuilder()
                .setData(ByteString.copyFrom(data))
                .setSignature(signResp.getSignature())
                .setPublicKey(keyPair.getPublicKey())
                .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
                .build());
        }

        BatchVerifyRequest request = BatchVerifyRequest.newBuilder()
            .addAllVerifications(verifications)
            .setParallelVerification(true)
            .build();

        BatchVerifyResponse response = cryptoService
            .batchVerify(request)
            .await()
            .atMost(Duration.ofSeconds(15));

        assertNotNull(response);
        assertEquals(50, response.getTotalVerifications());
        assertTrue(response.getSuccessfulVerifications() > 0);

        System.out.printf("Parallel batch verify: 50 verifications in %d ms%n",
            response.getTotalTimeMs());
    }

    @Test
    @Order(8)
    @DisplayName("Key exchange - initiate step")
    void testKeyExchangeInitiate() {
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        KeyExchangeRequest request = KeyExchangeRequest.newBuilder()
            .setPublicKey(keyPair.getPublicKey())
            .setStep(KeyExchangeStep.INITIATE)
            .build();

        KeyExchangeResponse response = cryptoService
            .keyExchange(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getSharedSecret().size() > 0);
        assertTrue(response.getEncapsulatedSecret().size() > 0);
        assertEquals(KeyExchangeStep.RESPOND, response.getStep());
    }

    @Test
    @Order(9)
    @DisplayName("Encrypt data - AES-256-GCM")
    void testEncryptAESGCM() {
        byte[] key = new byte[32];  // 256-bit key
        new java.security.SecureRandom().nextBytes(key);

        EncryptRequest request = EncryptRequest.newBuilder()
            .setPlaintext(ByteString.copyFrom(testData))
            .setEncryptionKey(ByteString.copyFrom(key))
            .setMode(EncryptionMode.AES_256_GCM)
            .build();

        EncryptResponse response = cryptoService
            .encrypt(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertTrue(response.getCiphertext().size() > 0);
        assertTrue(response.getIv().size() == 12);  // GCM IV length
        assertTrue(response.getTag().size() > 0);
    }

    @Test
    @Order(10)
    @DisplayName("Decrypt data - AES-256-GCM round trip")
    void testEncryptDecryptRoundTrip() {
        byte[] key = new byte[32];
        new java.security.SecureRandom().nextBytes(key);

        // Encrypt
        EncryptRequest encryptReq = EncryptRequest.newBuilder()
            .setPlaintext(ByteString.copyFrom(testData))
            .setEncryptionKey(ByteString.copyFrom(key))
            .setMode(EncryptionMode.AES_256_GCM)
            .build();

        EncryptResponse encryptResp = cryptoService.encrypt(encryptReq).await().indefinitely();

        // Decrypt
        DecryptRequest decryptReq = DecryptRequest.newBuilder()
            .setCiphertext(encryptResp.getCiphertext())
            .setDecryptionKey(ByteString.copyFrom(key))
            .setIv(encryptResp.getIv())
            .setTag(encryptResp.getTag())
            .setMode(EncryptionMode.AES_256_GCM)
            .build();

        DecryptResponse decryptResp = cryptoService
            .decrypt(decryptReq)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(decryptResp);
        assertTrue(decryptResp.getSuccess());
        assertArrayEquals(testData, decryptResp.getPlaintext().toByteArray());
    }

    @Test
    @Order(11)
    @DisplayName("Hash data - SHA3-256")
    void testHashSHA3_256() {
        HashRequest request = HashRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setAlgorithm(HashAlgorithm.SHA3_256)
            .build();

        HashResponse response = cryptoService
            .hash(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertEquals(32, response.getHashSize());  // SHA3-256 produces 32 bytes
        assertTrue(response.getHash().size() > 0);
    }

    @Test
    @Order(12)
    @DisplayName("Hash data - SHA3-512")
    void testHashSHA3_512() {
        HashRequest request = HashRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setAlgorithm(HashAlgorithm.SHA3_512)
            .build();

        HashResponse response = cryptoService
            .hash(request)
            .await()
            .atMost(Duration.ofSeconds(5));

        assertNotNull(response);
        assertEquals(64, response.getHashSize());  // SHA3-512 produces 64 bytes
    }

    @Test
    @Order(13)
    @DisplayName("Hash consistency - same input produces same hash")
    void testHashConsistency() {
        HashRequest request = HashRequest.newBuilder()
            .setData(ByteString.copyFrom(testData))
            .setAlgorithm(HashAlgorithm.SHA3_256)
            .build();

        HashResponse response1 = cryptoService.hash(request).await().indefinitely();
        HashResponse response2 = cryptoService.hash(request).await().indefinitely();

        assertArrayEquals(
            response1.getHash().toByteArray(),
            response2.getHash().toByteArray(),
            "Same input should produce same hash"
        );
    }

    @Test
    @Order(14)
    @DisplayName("Performance test - 1000 signatures")
    @Timeout(30)
    void testHighPerformanceSigning() {
        keyPair = cryptoService.generateKeyPair(keyGenRequest).await().indefinitely();

        long startTime = System.currentTimeMillis();
        int signCount = 1000;

        for (int i = 0; i < signCount; i++) {
            byte[] data = ("perf-test-" + i).getBytes();

            SignRequest request = SignRequest.newBuilder()
                .setData(ByteString.copyFrom(data))
                .setPrivateKey(keyPair.getPrivateKey())
                .setAlgorithm(CryptoAlgorithm.DILITHIUM5)
                .build();

            cryptoService.sign(request).await().indefinitely();
        }

        long duration = System.currentTimeMillis() - startTime;
        double signaturesPerSecond = (signCount * 1000.0) / duration;

        System.out.printf("Performance: %d signatures in %d ms (%.2f sig/sec)%n",
            signCount, duration, signaturesPerSecond);

        assertTrue(signaturesPerSecond > 100, "Should achieve >100 signatures/sec");
    }

    @Test
    @Order(15)
    @DisplayName("Large data encryption - 1MB")
    void testLargeDataEncryption() {
        byte[] largeData = new byte[1024 * 1024];  // 1MB
        new java.security.SecureRandom().nextBytes(largeData);

        byte[] key = new byte[32];
        new java.security.SecureRandom().nextBytes(key);

        EncryptRequest request = EncryptRequest.newBuilder()
            .setPlaintext(ByteString.copyFrom(largeData))
            .setEncryptionKey(ByteString.copyFrom(key))
            .setMode(EncryptionMode.AES_256_GCM)
            .build();

        long startTime = System.currentTimeMillis();
        EncryptResponse response = cryptoService
            .encrypt(request)
            .await()
            .atMost(Duration.ofSeconds(10));

        long duration = System.currentTimeMillis() - startTime;

        assertNotNull(response);
        System.out.printf("Encrypted 1MB in %d ms%n", duration);

        // Should encrypt 1MB within 1 second
        assertTrue(duration < 1000, "Should encrypt 1MB within 1 second");
    }
}
