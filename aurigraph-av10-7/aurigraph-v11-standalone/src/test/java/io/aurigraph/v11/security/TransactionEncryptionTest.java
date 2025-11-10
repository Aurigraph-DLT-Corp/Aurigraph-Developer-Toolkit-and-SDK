package io.aurigraph.v11.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.Disabled;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Transaction Encryption Service
 * Tests encryption/decryption, batch operations, and security properties
 *
 * NOTE: Disabled during development - requires proper key management setup (HSM/filesystem)
 * Re-enable when encryption infrastructure is fully initialized for test environment.
 */
@QuarkusTest
@DisplayName("Transaction Encryption Tests")
@Disabled("Encryption key management not initialized - requires HSM/filesystem setup")
class TransactionEncryptionTest {

    @Inject
    TransactionEncryptionService transactionEncryptionService;

    private byte[] testPayload;
    private String testPayloadString;

    @BeforeEach
    void setUp() {
        testPayload = "test-transaction-payload-12345".getBytes(StandardCharsets.UTF_8);
        testPayloadString = "json-transaction-data-{\"amount\":1000}";
    }

    @Test
    @DisplayName("Should encrypt transaction payload successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptTransactionPayload() {
        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).isNotEqualTo(testPayload);
        assertThat(encrypted.length).isGreaterThan(testPayload.length); // Has IV + tag
    }

    @Test
    @DisplayName("Should decrypt transaction payload successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testDecryptTransactionPayload() {
        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted = transactionEncryptionService.decryptTransactionPayload(encrypted)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(testPayload);
    }

    @Test
    @DisplayName("Should handle string encryption")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptTransactionPayloadString() {
        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(testPayloadString)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted.length).isGreaterThan(0);
    }

    @Test
    @DisplayName("Should decrypt to string successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testDecryptTransactionPayloadToString() {
        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(testPayloadString)
            .await().atMost(java.time.Duration.ofSeconds(5));

        String decrypted = transactionEncryptionService.decryptTransactionPayloadToString(encrypted)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(testPayloadString);
    }

    @Test
    @DisplayName("Should detect encrypted transaction payload")
    void testIsEncrypted() {
        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertTrue(transactionEncryptionService.isEncrypted(encrypted));
        assertFalse(transactionEncryptionService.isEncrypted(testPayload));
    }

    @Test
    @DisplayName("Should encrypt batch of transactions")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testEncryptBatch() {
        List<byte[]> payloads = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            payloads.add(("transaction-" + i).getBytes(StandardCharsets.UTF_8));
        }

        List<byte[]> encrypted = transactionEncryptionService.encryptBatch(payloads)
            .await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(encrypted).hasSize(10);
        assertThat(encrypted).allMatch(e -> e != null && e.length > 0);
    }

    @Test
    @DisplayName("Should decrypt batch of transactions")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testDecryptBatch() {
        List<byte[]> payloads = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            payloads.add(("transaction-" + i).getBytes(StandardCharsets.UTF_8));
        }

        List<byte[]> encrypted = transactionEncryptionService.encryptBatch(payloads)
            .await().atMost(java.time.Duration.ofSeconds(10));

        List<byte[]> decrypted = transactionEncryptionService.decryptBatch(encrypted)
            .await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(decrypted).hasSize(payloads.size());
        for (int i = 0; i < payloads.size(); i++) {
            assertThat(decrypted.get(i)).isEqualTo(payloads.get(i));
        }
    }

    @Test
    @DisplayName("Should encrypt transaction metadata")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptTransactionMetadata() {
        String metadata = "sender:alice,receiver:bob,amount:100";
        byte[] encrypted = transactionEncryptionService.encryptTransactionMetadata(metadata)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted.length).isGreaterThan(0);
    }

    @Test
    @DisplayName("Should rotate transaction encryption key")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testRotateTransactionKey() {
        // Encrypt before rotation
        byte[] encrypted1 = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        // Rotate key
        transactionEncryptionService.rotateTransactionKey()
            .await().atMost(java.time.Duration.ofSeconds(5));

        // Encrypt after rotation (new encryption with rotated key)
        byte[] encrypted2 = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        // Both should decrypt to original
        byte[] decrypted1 = transactionEncryptionService.decryptTransactionPayload(encrypted1)
            .await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted2 = transactionEncryptionService.decryptTransactionPayload(encrypted2)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted1).isEqualTo(testPayload);
        assertThat(decrypted2).isEqualTo(testPayload);
    }

    @Test
    @DisplayName("Should provide encryption statistics")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testGetStats() {
        // Perform some operations
        transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        TransactionEncryptionService.TransactionEncryptionStats stats =
            transactionEncryptionService.getStats();

        assertThat(stats).isNotNull();
        assertThat(stats.transactionsEncrypted()).isGreaterThanOrEqualTo(1L);
    }

    @Test
    @DisplayName("Should handle null payloads gracefully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptNullPayload() {
        String decrypted = transactionEncryptionService.decryptTransactionPayloadToString(null)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isNull();
    }

    @Test
    @DisplayName("Should ensure encryption is deterministic with same key")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testEncryptionConsistency() {
        byte[] encrypted1 = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        byte[] encrypted2 = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        // Different IVs mean different ciphertexts (this is expected for security)
        // But both should decrypt to same plaintext
        byte[] decrypted1 = transactionEncryptionService.decryptTransactionPayload(encrypted1)
            .await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted2 = transactionEncryptionService.decryptTransactionPayload(encrypted2)
            .await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted1).isEqualTo(decrypted2);
        assertThat(decrypted1).isEqualTo(testPayload);
    }

    @Test
    @DisplayName("Should reject tampered ciphertext")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testTamperDetection() {
        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(testPayload)
            .await().atMost(java.time.Duration.ofSeconds(5));

        // Tamper with encrypted data (flip a bit)
        if (encrypted.length > 0) {
            encrypted[0] ^= 0xFF;
        }

        // Decryption should fail or return corrupted data
        assertThrows(Exception.class, () -> {
            transactionEncryptionService.decryptTransactionPayload(encrypted)
                .await().atMost(java.time.Duration.ofSeconds(5));
        });
    }

    @Test
    @DisplayName("Should handle large transaction payloads")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testLargePayloadEncryption() {
        // Create 1MB payload
        byte[] largePayload = new byte[1024 * 1024];
        for (int i = 0; i < largePayload.length; i++) {
            largePayload[i] = (byte) (i % 256);
        }

        byte[] encrypted = transactionEncryptionService.encryptTransactionPayload(largePayload)
            .await().atMost(java.time.Duration.ofSeconds(10));

        byte[] decrypted = transactionEncryptionService.decryptTransactionPayload(encrypted)
            .await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(decrypted).isEqualTo(largePayload);
    }
}
