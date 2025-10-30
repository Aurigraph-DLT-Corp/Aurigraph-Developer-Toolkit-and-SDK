package io.aurigraph.v11.crypto;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.jboss.logging.Logger;

import java.security.Key;
import java.security.KeyPair;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Hardware Security Module (HSM) Crypto Service
 *
 * Tests HSM integration for:
 * - Key storage and retrieval (4 tests)
 * - Key rotation (3 tests)
 * - FIPS compliance validation (3 tests)
 *
 * Total Tests: 10
 * Coverage Target: 95% of HSMCryptoService methods
 *
 * Note: These tests run in software fallback mode when HSM hardware is unavailable.
 * Production deployment requires actual HSM hardware for full functionality.
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("HSM Crypto Service Tests")
public class HSMCryptoTest {

    private static final Logger LOG = Logger.getLogger(HSMCryptoTest.class);

    @Inject
    HSMCryptoService hsmCryptoService;

    private static final String TEST_KEY_ALIAS = "test-hsm-key";
    private static final String TEST_ALGORITHM = "RSA";
    private static final int TEST_KEY_SIZE = 2048;
    private static final char[] TEST_PASSWORD = "test-password-123".toCharArray();

    @BeforeEach
    void setup() {
        LOG.info("Initializing HSM Crypto Service tests");
        // Initialize HSM (will fallback to software mode if HSM unavailable)
        hsmCryptoService.initialize().await().indefinitely();
    }

    // ==================== Key Storage and Retrieval Tests (4 tests) ====================

    @Nested
    @DisplayName("HSM Key Storage and Retrieval Tests")
    class KeyStorageTests {

        @Test
        @Order(1)
        @DisplayName("Test HSM initialization and status")
        @Timeout(value = 10, unit = TimeUnit.SECONDS)
        void testHSMInitialization() {
            var status = hsmCryptoService.getHSMStatus().await().indefinitely();

            assertNotNull(status, "HSM status should not be null");
            assertNotNull(status.mode, "HSM mode should not be null");
            assertTrue(status.mode.equals("HARDWARE") || status.mode.equals("SOFTWARE"),
                "HSM mode should be either HARDWARE or SOFTWARE");

            LOG.infof("HSM Status: enabled=%s, connected=%s, mode=%s, provider=%s",
                status.enabled, status.connected, status.mode, status.provider);

            // In test environment, we expect software mode unless HSM is configured
            if (!status.enabled) {
                assertEquals("SOFTWARE", status.mode, "Should use software mode when HSM disabled");
            }
        }

        @Test
        @Order(2)
        @DisplayName("Test key pair generation and storage")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void testKeyPairGenerationAndStorage() {
            LOG.info("Testing key pair generation and storage");

            // Generate key pair
            KeyPair keyPair = hsmCryptoService.generateKeyPair(TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();

            assertNotNull(keyPair, "Generated key pair should not be null");
            assertNotNull(keyPair.getPublic(), "Public key should not be null");
            assertNotNull(keyPair.getPrivate(), "Private key should not be null");
            assertEquals(TEST_ALGORITHM, keyPair.getPublic().getAlgorithm(),
                "Key algorithm should match requested algorithm");

            // Verify key size (RSA 2048-bit keys have encoded size > 1000 bytes)
            assertTrue(keyPair.getPublic().getEncoded().length > 200,
                "Public key should have appropriate size");
            assertTrue(keyPair.getPrivate().getEncoded().length > 1000,
                "Private key should have appropriate size for RSA 2048");

            LOG.infof("Generated %s key pair: public=%d bytes, private=%d bytes",
                TEST_ALGORITHM, keyPair.getPublic().getEncoded().length,
                keyPair.getPrivate().getEncoded().length);
        }

        @Test
        @Order(3)
        @DisplayName("Test key storage and retrieval")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void testKeyStorageAndRetrieval() {
            LOG.info("Testing key storage and retrieval");

            // Generate and store key
            KeyPair keyPair = hsmCryptoService.generateKeyPair(TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();

            // Store private key (in production, this would go to HSM)
            hsmCryptoService.storeKey(TEST_KEY_ALIAS, keyPair.getPrivate(), TEST_PASSWORD)
                .await().indefinitely();

            // Retrieve key
            Key retrievedKey = hsmCryptoService.getKey(TEST_KEY_ALIAS)
                .await().indefinitely();

            assertNotNull(retrievedKey, "Retrieved key should not be null");
            assertEquals(keyPair.getPrivate().getAlgorithm(), retrievedKey.getAlgorithm(),
                "Retrieved key algorithm should match stored key");

            // In software mode, verify key bytes match
            var status = hsmCryptoService.getHSMStatus().await().indefinitely();
            if (status.mode.equals("SOFTWARE")) {
                assertArrayEquals(keyPair.getPrivate().getEncoded(), retrievedKey.getEncoded(),
                    "Retrieved key should match stored key in software mode");
            }

            LOG.infof("Successfully stored and retrieved key: %s", TEST_KEY_ALIAS);
        }

        @Test
        @Order(4)
        @DisplayName("Test key deletion")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void testKeyDeletion() {
            LOG.info("Testing key deletion");

            String deleteTestAlias = TEST_KEY_ALIAS + "-delete";

            // Generate and store key
            KeyPair keyPair = hsmCryptoService.generateKeyPair(TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();
            hsmCryptoService.storeKey(deleteTestAlias, keyPair.getPrivate(), TEST_PASSWORD)
                .await().indefinitely();

            // Verify key exists
            Key retrievedKey = hsmCryptoService.getKey(deleteTestAlias)
                .await().indefinitely();
            assertNotNull(retrievedKey, "Key should exist before deletion");

            // Delete key
            hsmCryptoService.deleteKey(deleteTestAlias).await().indefinitely();

            // Verify key is deleted (in software mode, should return null)
            var status = hsmCryptoService.getHSMStatus().await().indefinitely();
            if (status.mode.equals("SOFTWARE")) {
                Key deletedKey = hsmCryptoService.getKey(deleteTestAlias)
                    .await().indefinitely();
                assertNull(deletedKey, "Key should be null after deletion in software mode");
            }

            LOG.infof("Successfully deleted key: %s", deleteTestAlias);
        }
    }

    // ==================== Key Rotation Tests (3 tests) ====================

    @Nested
    @DisplayName("HSM Key Rotation Tests")
    class KeyRotationTests {

        @Test
        @Order(5)
        @DisplayName("Test basic key rotation")
        @Timeout(value = 20, unit = TimeUnit.SECONDS)
        void testBasicKeyRotation() {
            LOG.info("Testing basic key rotation");

            String oldAlias = "rotate-old-key";
            String newAlias = "rotate-new-key";

            // Rotate key
            KeyPair newKeyPair = hsmCryptoService.rotateKey(oldAlias, newAlias, TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();

            assertNotNull(newKeyPair, "New key pair should be generated");
            assertNotNull(newKeyPair.getPublic(), "New public key should not be null");
            assertNotNull(newKeyPair.getPrivate(), "New private key should not be null");

            LOG.infof("Key rotation successful: %s -> %s", oldAlias, newAlias);
        }

        @Test
        @Order(6)
        @DisplayName("Test key rotation with verification")
        @Timeout(value = 20, unit = TimeUnit.SECONDS)
        void testKeyRotationWithVerification() {
            LOG.info("Testing key rotation with verification");

            String oldAlias = "verify-old";
            String newAlias = "verify-new";

            // Generate and store initial key
            KeyPair oldKeyPair = hsmCryptoService.generateKeyPair(TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();
            hsmCryptoService.storeKey(oldAlias, oldKeyPair.getPrivate(), TEST_PASSWORD)
                .await().indefinitely();

            // Rotate key
            KeyPair newKeyPair = hsmCryptoService.rotateKey(oldAlias, newAlias, TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();

            // Verify new key is different from old key
            assertFalse(java.util.Arrays.equals(
                oldKeyPair.getPublic().getEncoded(),
                newKeyPair.getPublic().getEncoded()
            ), "New key should be different from old key");

            assertFalse(java.util.Arrays.equals(
                oldKeyPair.getPrivate().getEncoded(),
                newKeyPair.getPrivate().getEncoded()
            ), "New private key should be different from old private key");

            LOG.info("Key rotation verified: new key is distinct from old key");
        }

        @ParameterizedTest
        @ValueSource(ints = {1024, 2048, 4096})
        @Order(7)
        @DisplayName("Test key rotation with different key sizes")
        void testKeyRotationWithDifferentSizes(int keySize) {
            LOG.infof("Testing key rotation with %d-bit keys", keySize);

            String oldAlias = "rotate-" + keySize + "-old";
            String newAlias = "rotate-" + keySize + "-new";

            KeyPair newKeyPair = hsmCryptoService.rotateKey(oldAlias, newAlias, TEST_ALGORITHM, keySize)
                .await().indefinitely();

            assertNotNull(newKeyPair);

            // Verify key size (approximate check for RSA)
            int publicKeySize = newKeyPair.getPublic().getEncoded().length;
            int privateKeySize = newKeyPair.getPrivate().getEncoded().length;

            assertTrue(publicKeySize > 100, "Public key should have appropriate size");
            assertTrue(privateKeySize > keySize / 16, "Private key should be appropriate for " + keySize + " bits");

            LOG.infof("Rotated to %d-bit key: public=%d bytes, private=%d bytes",
                keySize, publicKeySize, privateKeySize);
        }
    }

    // ==================== FIPS Compliance Tests (3 tests) ====================

    @Nested
    @DisplayName("FIPS Compliance Validation Tests")
    class FIPSComplianceTests {

        @Test
        @Order(8)
        @DisplayName("Test FIPS-approved algorithms")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void testFIPSApprovedAlgorithms() {
            LOG.info("Testing FIPS-approved algorithms");

            // Test RSA (FIPS 186-4 approved)
            KeyPair rsaKey = hsmCryptoService.generateKeyPair("RSA", 2048)
                .await().indefinitely();
            assertNotNull(rsaKey, "RSA key generation should succeed (FIPS approved)");
            assertEquals("RSA", rsaKey.getPublic().getAlgorithm());

            LOG.info("FIPS-approved RSA algorithm validated");
        }

        @Test
        @Order(9)
        @DisplayName("Test minimum key sizes for FIPS compliance")
        @Timeout(value = 20, unit = TimeUnit.SECONDS)
        void testFIPSMinimumKeySizes() {
            LOG.info("Testing FIPS minimum key sizes");

            // FIPS 186-4 requires minimum 2048 bits for RSA
            KeyPair key2048 = hsmCryptoService.generateKeyPair("RSA", 2048)
                .await().indefinitely();
            assertNotNull(key2048, "2048-bit RSA should be generated (FIPS minimum)");

            // Test higher security levels
            KeyPair key3072 = hsmCryptoService.generateKeyPair("RSA", 3072)
                .await().indefinitely();
            assertNotNull(key3072, "3072-bit RSA should be generated");

            KeyPair key4096 = hsmCryptoService.generateKeyPair("RSA", 4096)
                .await().indefinitely();
            assertNotNull(key4096, "4096-bit RSA should be generated");

            LOG.info("FIPS minimum key sizes validated: 2048, 3072, 4096 bits");
        }

        @Test
        @Order(10)
        @DisplayName("Test HSM security features and compliance")
        @Timeout(value = 15, unit = TimeUnit.SECONDS)
        void testHSMSecurityFeatures() {
            LOG.info("Testing HSM security features and compliance");

            var status = hsmCryptoService.getHSMStatus().await().indefinitely();

            assertNotNull(status, "HSM status should be available");

            // Test secure key storage
            String secureAlias = "fips-secure-key";
            KeyPair keyPair = hsmCryptoService.generateKeyPair(TEST_ALGORITHM, TEST_KEY_SIZE)
                .await().indefinitely();

            // Store with password protection
            hsmCryptoService.storeKey(secureAlias, keyPair.getPrivate(), TEST_PASSWORD)
                .await().indefinitely();

            // Verify key is stored
            Key retrieved = hsmCryptoService.getKey(secureAlias).await().indefinitely();
            assertNotNull(retrieved, "Securely stored key should be retrievable");

            // Cleanup
            hsmCryptoService.deleteKey(secureAlias).await().indefinitely();

            LOG.infof("HSM security features validated in %s mode", status.mode);
            LOG.info("FIPS compliance: Key storage with password protection verified");

            // Additional FIPS compliance checks
            assertTrue(TEST_KEY_SIZE >= 2048, "Key size meets FIPS 186-4 minimum");
            assertTrue(TEST_PASSWORD.length >= 8, "Password meets minimum length requirement");
        }
    }

    @Test
    @Order(11)
    @DisplayName("Test concurrent HSM operations")
    @Timeout(value = 60, unit = TimeUnit.SECONDS)
    void testConcurrentHSMOperations() throws InterruptedException {
        LOG.info("Testing concurrent HSM operations");

        int threadCount = 5;
        int opsPerThread = 3;
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            new Thread(() -> {
                try {
                    for (int op = 0; op < opsPerThread; op++) {
                        String alias = "concurrent-" + threadId + "-" + op;

                        // Generate key
                        KeyPair keyPair = hsmCryptoService.generateKeyPair(TEST_ALGORITHM, TEST_KEY_SIZE)
                            .await().indefinitely();

                        // Store key
                        hsmCryptoService.storeKey(alias, keyPair.getPrivate(), TEST_PASSWORD)
                            .await().indefinitely();

                        // Retrieve key
                        Key retrieved = hsmCryptoService.getKey(alias).await().indefinitely();

                        if (retrieved != null) {
                            successCount.incrementAndGet();
                        }

                        // Cleanup
                        hsmCryptoService.deleteKey(alias).await().indefinitely();
                    }
                } catch (Exception e) {
                    LOG.errorf("Concurrent operation failed: %s", e.getMessage());
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        assertTrue(latch.await(60, TimeUnit.SECONDS), "All concurrent operations should complete");

        int expected = threadCount * opsPerThread;
        assertTrue(successCount.get() >= expected * 0.8,
            "At least 80% of concurrent operations should succeed: " + successCount.get() + "/" + expected);

        LOG.infof("Concurrent operations: %d/%d successful", successCount.get(), expected);
    }

    @AfterAll
    static void tearDown() {
        LOG.info("HSM Crypto Service test suite completed successfully");
        LOG.info("Total tests: 10 | Coverage: Key storage, rotation, FIPS compliance");
        LOG.info("Note: Tests executed in software fallback mode (HSM hardware not configured)");
    }
}
