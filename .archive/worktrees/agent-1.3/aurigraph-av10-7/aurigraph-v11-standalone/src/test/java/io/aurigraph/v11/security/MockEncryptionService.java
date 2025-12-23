package io.aurigraph.v11.security;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import jakarta.annotation.Priority;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Mock Encryption Service for Testing
 *
 * Provides a test-safe implementation of EncryptionService that:
 * - Avoids actual encryption/decryption overhead in tests
 * - Bypasses key management and HSM initialization
 * - Returns predictable test data
 * - Tracks operations for verification
 * - Allows complete test isolation from security configuration
 *
 * This mock is automatically used during tests via @Alternative annotation.
 * The mock has higher priority (@Priority) than production implementation.
 * Production code uses the real EncryptionService.
 */
@ApplicationScoped
@Alternative
@Priority(100)
public class MockEncryptionService {
    private static final Logger logger = LoggerFactory.getLogger(MockEncryptionService.class);

    // Encryption layer types (must match real service)
    public enum EncryptionLayer {
        TRANSACTION("transaction-encryption-v1", 30),
        BRIDGE("bridge-encryption-v1", 7),
        CONTRACT("contract-encryption-v1", 30),
        STORAGE("storage-encryption-v1", 90);

        private final String context;
        private final int rotationDays;

        EncryptionLayer(String context, int rotationDays) {
            this.context = context;
            this.rotationDays = rotationDays;
        }

        public String getContext() { return context; }
        public int getRotationDays() { return rotationDays; }
    }

    // Mock statistics
    private final AtomicLong totalEncryptions = new AtomicLong(0);
    private final AtomicLong totalDecryptions = new AtomicLong(0);
    private final AtomicLong totalBytesEncrypted = new AtomicLong(0);
    private final AtomicLong totalBytesDecrypted = new AtomicLong(0);
    private final AtomicLong encryptionErrors = new AtomicLong(0);
    private final AtomicLong decryptionErrors = new AtomicLong(0);

    public MockEncryptionService() {
        logger.info("MockEncryptionService initialized for testing");
    }

    /**
     * Mock encrypt operation - returns plaintext with mock header
     * In tests, we don't need actual encryption, just data transformation
     */
    public Uni<byte[]> encrypt(byte[] plaintext, EncryptionLayer layer) {
        return Uni.createFrom().item(() -> {
            try {
                totalEncryptions.incrementAndGet();
                totalBytesEncrypted.addAndGet(plaintext != null ? plaintext.length : 0);

                if (plaintext == null || plaintext.length == 0) {
                    return new byte[0];
                }

                // Create mock encrypted data: [version][layer_id][plaintext]
                // This allows us to track operations and verify they occurred
                ByteBuffer buffer = ByteBuffer.allocate(plaintext.length + 2);
                buffer.put((byte) 0x01); // Version
                buffer.put((byte) layer.ordinal()); // Layer ID
                buffer.put(plaintext);

                logger.debug("Mock encrypted {} bytes for layer {}", plaintext.length, layer);
                return buffer.array();
            } catch (Exception e) {
                encryptionErrors.incrementAndGet();
                logger.error("Mock encryption failed", e);
                throw new RuntimeException("Mock encryption failed", e);
            }
        });
    }

    /**
     * Mock decrypt operation - recovers plaintext from mock header
     */
    public Uni<byte[]> decrypt(byte[] encrypted, EncryptionLayer layer) {
        return Uni.createFrom().item(() -> {
            try {
                totalDecryptions.incrementAndGet();

                if (encrypted == null || encrypted.length < 2) {
                    return new byte[0];
                }

                totalBytesDecrypted.addAndGet(encrypted.length - 2);

                // Extract plaintext: skip version and layer ID
                ByteBuffer buffer = ByteBuffer.wrap(encrypted);
                byte version = buffer.get();
                byte layerId = buffer.get();

                // Verify layer matches (sanity check)
                if (layerId != layer.ordinal()) {
                    logger.warn("Layer mismatch in mock decryption: expected {}, got {}",
                               layer.ordinal(), layerId);
                }

                // Extract remaining data as plaintext
                byte[] plaintext = new byte[buffer.remaining()];
                buffer.get(plaintext);

                logger.debug("Mock decrypted {} bytes for layer {}", plaintext.length, layer);
                return plaintext;
            } catch (Exception e) {
                decryptionErrors.incrementAndGet();
                logger.error("Mock decryption failed", e);
                throw new RuntimeException("Mock decryption failed", e);
            }
        });
    }

    /**
     * Mock rotate layer key - no-op in tests
     */
    public Uni<Void> rotateLayerKey(EncryptionLayer layer) {
        return Uni.createFrom().item(() -> {
            logger.debug("Mock rotating key for layer {}", layer);
            return null;
        });
    }

    /**
     * Get mock statistics
     */
    public EncryptionStats getStats() {
        return new EncryptionStats(
            totalEncryptions.get(),
            totalDecryptions.get(),
            totalBytesEncrypted.get(),
            totalBytesDecrypted.get(),
            encryptionErrors.get(),
            decryptionErrors.get(),
            (double) totalEncryptions.get() > 0 ?
                (double) totalBytesEncrypted.get() / totalEncryptions.get() : 0.0,
            totalEncryptions.get() > 0 ? 0.001 : 0.0  // Mock: 1 microsecond per encryption
        );
    }

    /**
     * Mock encryption statistics record
     */
    public record EncryptionStats(
        long totalEncryptions,
        long totalDecryptions,
        long totalBytesEncrypted,
        long totalBytesDecrypted,
        long encryptionErrors,
        long decryptionErrors,
        double avgBytesPerEncryption,
        double avgEncryptionTimeMicros
    ) {
        public double getAvgEncryptionTimeMicros() {
            return avgEncryptionTimeMicros;
        }

        public double getEncryptionThroughputMBps() {
            return totalEncryptions > 0 ?
                (totalBytesEncrypted / 1_000_000.0) / (totalEncryptions * avgEncryptionTimeMicros / 1_000_000.0) : 0.0;
        }
    }

    /**
     * Provide test summary
     */
    public String getTestSummary() {
        EncryptionStats stats = getStats();
        return String.format(
            "Mock Encryption Stats: %d encryptions, %d decryptions, %d errors, %d MB encrypted",
            stats.totalEncryptions(),
            stats.totalDecryptions(),
            stats.encryptionErrors() + stats.decryptionErrors(),
            stats.totalBytesEncrypted() / (1024 * 1024)
        );
    }
}
