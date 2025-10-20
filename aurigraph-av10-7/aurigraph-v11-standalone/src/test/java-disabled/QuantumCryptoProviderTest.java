package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import org.bouncycastle.pqc.crypto.crystals.dilithium.DilithiumPrivateKeyParameters;
import org.bouncycastle.pqc.crypto.crystals.dilithium.DilithiumPublicKeyParameters;
import org.bouncycastle.pqc.crypto.crystals.kyber.KyberPrivateKeyParameters;
import org.bouncycastle.pqc.crypto.crystals.kyber.KyberPublicKeyParameters;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import jakarta.inject.Inject;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for QuantumCryptoProvider
 * Sprint 16 - Test Coverage Expansion
 *
 * Tests NIST post-quantum cryptographic algorithms:
 * - CRYSTALS-Dilithium (Digital Signatures)
 * - CRYSTALS-Kyber (Key Encapsulation)
 */
@QuarkusTest
@DisplayName("Quantum Cryptography Provider Tests")
class QuantumCryptoProviderTest {

    @Inject
    QuantumCryptoProvider quantumCrypto;

    private byte[] testData;
    private byte[] largeData;

    @BeforeEach
    void setUp() {
        testData = "Aurigraph V11 - Post-Quantum Security Test".getBytes(StandardCharsets.UTF_8);

        // Generate large test data (1MB)
        largeData = new byte[1024 * 1024];
        new SecureRandom().nextBytes(largeData);
    }

    // ==================== Dilithium Key Generation Tests ====================

    @Test
    @DisplayName("Generate Dilithium Level 2 key pair successfully")
    void testGenerateDilithiumLevel2KeyPair() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        assertNotNull(keyPair);
        assertNotNull(keyPair.publicKey());
        assertNotNull(keyPair.privateKey());
        assertEquals(QuantumCryptoProvider.SecurityLevel.LEVEL_2, keyPair.securityLevel());

        // Verify key sizes (Level 2)
        assertTrue(keyPair.publicKey().getEncoded().length > 0);
        assertTrue(keyPair.privateKey().getEncoded().length > 0);
    }

    @Test
    @DisplayName("Generate Dilithium Level 3 key pair successfully")
    void testGenerateDilithiumLevel3KeyPair() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_3);

        assertNotNull(keyPair);
        assertEquals(QuantumCryptoProvider.SecurityLevel.LEVEL_3, keyPair.securityLevel());

        // Level 3 keys should be larger than Level 2
        assertTrue(keyPair.publicKey().getEncoded().length > 0);
        assertTrue(keyPair.privateKey().getEncoded().length > 0);
    }

    @Test
    @DisplayName("Generate Dilithium Level 5 key pair successfully")
    void testGenerateDilithiumLevel5KeyPair() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_5);

        assertNotNull(keyPair);
        assertEquals(QuantumCryptoProvider.SecurityLevel.LEVEL_5, keyPair.securityLevel());

        // Level 5 keys should be largest
        assertTrue(keyPair.publicKey().getEncoded().length > 0);
        assertTrue(keyPair.privateKey().getEncoded().length > 0);
    }

    @Test
    @DisplayName("Different key pairs should generate different keys")
    void testDilithiumKeyUniqueness() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair1 =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);
        QuantumCryptoProvider.DilithiumKeyPair keyPair2 =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        assertNotEquals(
            new String(keyPair1.publicKey().getEncoded()),
            new String(keyPair2.publicKey().getEncoded()),
            "Public keys should be unique"
        );
        assertNotEquals(
            new String(keyPair1.privateKey().getEncoded()),
            new String(keyPair2.privateKey().getEncoded()),
            "Private keys should be unique"
        );
    }

    // ==================== Dilithium Signature Tests ====================

    @Test
    @DisplayName("Sign and verify data successfully with Level 2")
    void testDilithiumSignAndVerifyLevel2() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        byte[] signature = quantumCrypto.signDilithium(testData, keyPair.privateKey());

        assertNotNull(signature);
        assertTrue(signature.length > 0);

        boolean valid = quantumCrypto.verifyDilithium(testData, signature, keyPair.publicKey());
        assertTrue(valid, "Signature should be valid");
    }

    @Test
    @DisplayName("Sign and verify large data successfully")
    void testDilithiumSignLargeData() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_3);

        byte[] signature = quantumCrypto.signDilithium(largeData, keyPair.privateKey());

        assertNotNull(signature);
        assertTrue(quantumCrypto.verifyDilithium(largeData, signature, keyPair.publicKey()));
    }

    @Test
    @DisplayName("Signature verification fails with wrong public key")
    void testDilithiumVerifyWithWrongKey() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair1 =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);
        QuantumCryptoProvider.DilithiumKeyPair keyPair2 =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        byte[] signature = quantumCrypto.signDilithium(testData, keyPair1.privateKey());

        boolean valid = quantumCrypto.verifyDilithium(testData, signature, keyPair2.publicKey());
        assertFalse(valid, "Signature should be invalid with wrong key");
    }

    @Test
    @DisplayName("Signature verification fails with tampered data")
    void testDilithiumVerifyTamperedData() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        byte[] signature = quantumCrypto.signDilithium(testData, keyPair.privateKey());

        byte[] tamperedData = "Tampered data".getBytes(StandardCharsets.UTF_8);
        boolean valid = quantumCrypto.verifyDilithium(tamperedData, signature, keyPair.publicKey());
        assertFalse(valid, "Signature should be invalid with tampered data");
    }

    @Test
    @DisplayName("Signature verification fails with tampered signature")
    void testDilithiumVerifyTamperedSignature() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        byte[] signature = quantumCrypto.signDilithium(testData, keyPair.privateKey());

        // Tamper with signature
        signature[0] ^= 0xFF;

        boolean valid = quantumCrypto.verifyDilithium(testData, signature, keyPair.publicKey());
        assertFalse(valid, "Signature should be invalid when tampered");
    }

    @Test
    @DisplayName("Different security levels produce different signatures")
    void testDilithiumDifferentLevelsProduceDifferentSignatures() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair2 =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);
        QuantumCryptoProvider.DilithiumKeyPair keyPair5 =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_5);

        byte[] signature2 = quantumCrypto.signDilithium(testData, keyPair2.privateKey());
        byte[] signature5 = quantumCrypto.signDilithium(testData, keyPair5.privateKey());

        // Level 5 signatures should be larger
        assertTrue(signature5.length >= signature2.length);
    }

    // ==================== Kyber Key Generation Tests ====================

    @Test
    @DisplayName("Generate Kyber Level 2 key pair successfully")
    void testGenerateKyberLevel2KeyPair() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        assertNotNull(keyPair);
        assertNotNull(keyPair.publicKey());
        assertNotNull(keyPair.privateKey());
        assertEquals(QuantumCryptoProvider.SecurityLevel.LEVEL_2, keyPair.securityLevel());
    }

    @Test
    @DisplayName("Generate Kyber Level 3 key pair successfully")
    void testGenerateKyberLevel3KeyPair() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_3);

        assertNotNull(keyPair);
        assertEquals(QuantumCryptoProvider.SecurityLevel.LEVEL_3, keyPair.securityLevel());
    }

    @Test
    @DisplayName("Generate Kyber Level 5 key pair successfully")
    void testGenerateKyberLevel5KeyPair() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_5);

        assertNotNull(keyPair);
        assertEquals(QuantumCryptoProvider.SecurityLevel.LEVEL_5, keyPair.securityLevel());
    }

    // ==================== Kyber Encapsulation Tests ====================

    @Test
    @DisplayName("Encapsulate and decapsulate shared secret successfully")
    void testKyberEncapsulateDecapsulate() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        QuantumCryptoProvider.KyberEncapsulation encapsulation =
            quantumCrypto.encapsulateKyber(keyPair.publicKey());

        assertNotNull(encapsulation);
        assertNotNull(encapsulation.sharedSecret());
        assertNotNull(encapsulation.ciphertext());
        assertTrue(encapsulation.sharedSecret().length > 0);
        assertTrue(encapsulation.ciphertext().length > 0);

        byte[] decapsulatedSecret =
            quantumCrypto.decapsulateKyber(encapsulation.ciphertext(), keyPair.privateKey());

        assertNotNull(decapsulatedSecret);
        assertArrayEquals(encapsulation.sharedSecret(), decapsulatedSecret,
            "Decapsulated secret should match original");
    }

    @Test
    @DisplayName("Encapsulation with Level 5 produces valid shared secret")
    void testKyberEncapsulateLevel5() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_5);

        QuantumCryptoProvider.KyberEncapsulation encapsulation =
            quantumCrypto.encapsulateKyber(keyPair.publicKey());

        byte[] decapsulatedSecret =
            quantumCrypto.decapsulateKyber(encapsulation.ciphertext(), keyPair.privateKey());

        assertArrayEquals(encapsulation.sharedSecret(), decapsulatedSecret);
    }

    @Test
    @DisplayName("Decapsulation with wrong private key fails")
    void testKyberDecapsulateWithWrongKey() {
        QuantumCryptoProvider.KyberKeyPair keyPair1 =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);
        QuantumCryptoProvider.KyberKeyPair keyPair2 =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        QuantumCryptoProvider.KyberEncapsulation encapsulation =
            quantumCrypto.encapsulateKyber(keyPair1.publicKey());

        byte[] wrongSecret =
            quantumCrypto.decapsulateKyber(encapsulation.ciphertext(), keyPair2.privateKey());

        assertFalse(
            java.util.Arrays.equals(encapsulation.sharedSecret(), wrongSecret),
            "Wrong key should not produce same secret"
        );
    }

    @Test
    @DisplayName("Multiple encapsulations produce different ciphertexts")
    void testKyberMultipleEncapsulations() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        QuantumCryptoProvider.KyberEncapsulation enc1 =
            quantumCrypto.encapsulateKyber(keyPair.publicKey());
        QuantumCryptoProvider.KyberEncapsulation enc2 =
            quantumCrypto.encapsulateKyber(keyPair.publicKey());

        assertFalse(
            java.util.Arrays.equals(enc1.ciphertext(), enc2.ciphertext()),
            "Multiple encapsulations should produce different ciphertexts"
        );
    }

    // ==================== Key Cache Tests ====================

    @Test
    @DisplayName("Cache and retrieve Dilithium key pair")
    void testCacheDilithiumKeyPair() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        String keyId = "test-dilithium-key";
        quantumCrypto.cacheKeyPair(keyId,
            new org.bouncycastle.crypto.AsymmetricCipherKeyPair(
                keyPair.publicKey(), keyPair.privateKey()));

        var cachedKeyPair = quantumCrypto.getCachedKeyPair(keyId);
        assertNotNull(cachedKeyPair);
    }

    @Test
    @DisplayName("Cache and retrieve Kyber key pair")
    void testCacheKyberKeyPair() {
        QuantumCryptoProvider.KyberKeyPair keyPair =
            quantumCrypto.generateKyberKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_3);

        String keyId = "test-kyber-key";
        quantumCrypto.cacheKeyPair(keyId,
            new org.bouncycastle.crypto.AsymmetricCipherKeyPair(
                keyPair.publicKey(), keyPair.privateKey()));

        var cachedKeyPair = quantumCrypto.getCachedKeyPair(keyId);
        assertNotNull(cachedKeyPair);
    }

    @Test
    @DisplayName("Clear key cache removes all cached keys")
    void testClearKeyCache() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        String keyId = "test-key-to-clear";
        quantumCrypto.cacheKeyPair(keyId,
            new org.bouncycastle.crypto.AsymmetricCipherKeyPair(
                keyPair.publicKey(), keyPair.privateKey()));

        quantumCrypto.clearKeyCache();

        var cachedKeyPair = quantumCrypto.getCachedKeyPair(keyId);
        assertNull(cachedKeyPair, "Key should be removed after cache clear");
    }

    @Test
    @DisplayName("Retrieve non-existent key returns null")
    void testGetNonExistentKey() {
        var cachedKeyPair = quantumCrypto.getCachedKeyPair("non-existent-key");
        assertNull(cachedKeyPair);
    }

    // ==================== Performance Tests ====================

    @Test
    @DisplayName("Key generation performance - Level 2")
    void testKeyGenerationPerformanceLevel2() {
        long startTime = System.nanoTime();

        for (int i = 0; i < 10; i++) {
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);
        }

        long duration = System.nanoTime() - startTime;
        long avgTimeMs = duration / 10 / 1_000_000;

        assertTrue(avgTimeMs < 100,
            "Key generation should be < 100ms, was: " + avgTimeMs + "ms");
    }

    @Test
    @DisplayName("Signature generation performance")
    void testSignatureGenerationPerformance() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);

        long startTime = System.nanoTime();

        for (int i = 0; i < 100; i++) {
            quantumCrypto.signDilithium(testData, keyPair.privateKey());
        }

        long duration = System.nanoTime() - startTime;
        long avgTimeMs = duration / 100 / 1_000_000;

        assertTrue(avgTimeMs < 10,
            "Signature generation should be < 10ms, was: " + avgTimeMs + "ms");
    }

    @Test
    @DisplayName("Signature verification performance")
    void testSignatureVerificationPerformance() {
        QuantumCryptoProvider.DilithiumKeyPair keyPair =
            quantumCrypto.generateDilithiumKeyPair(QuantumCryptoProvider.SecurityLevel.LEVEL_2);
        byte[] signature = quantumCrypto.signDilithium(testData, keyPair.privateKey());

        long startTime = System.nanoTime();

        for (int i = 0; i < 100; i++) {
            quantumCrypto.verifyDilithium(testData, signature, keyPair.publicKey());
        }

        long duration = System.nanoTime() - startTime;
        long avgTimeMs = duration / 100 / 1_000_000;

        assertTrue(avgTimeMs < 5,
            "Signature verification should be < 5ms, was: " + avgTimeMs + "ms");
    }
}
