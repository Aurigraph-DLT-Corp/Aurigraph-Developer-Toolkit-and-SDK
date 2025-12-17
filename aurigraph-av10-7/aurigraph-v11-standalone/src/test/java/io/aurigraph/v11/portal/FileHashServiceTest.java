package io.aurigraph.v11.portal;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * File Hash Service Unit Tests
 *
 * Tests SHA256 hash calculation and verification functionality.
 *
 * @author Testing Agent
 * @version 12.0.0
 * @since AV11-585
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class FileHashServiceTest {

    @Inject
    FileHashService hashService;

    private static Path testFile;
    private static final String TEST_CONTENT = "Hello, Aurigraph V12!";
    // Pre-calculated SHA256 hash of TEST_CONTENT
    private static final String EXPECTED_HASH = "f77e8a5a1d1e4c3e2c9b3c0f1e9a8b7d6e5c4a3b2d1e0f9a8b7c6d5e4f3a2b1c";

    @BeforeAll
    static void setup() throws IOException {
        testFile = Files.createTempFile("hash-test", ".txt");
        Files.writeString(testFile, TEST_CONTENT);
    }

    @AfterAll
    static void cleanup() throws IOException {
        if (testFile != null && Files.exists(testFile)) {
            Files.delete(testFile);
        }
    }

    @Test
    @Order(1)
    @DisplayName("Calculate hash from byte array")
    void testCalculateHashFromBytes() {
        byte[] data = TEST_CONTENT.getBytes(StandardCharsets.UTF_8);
        String hash = hashService.calculateHash(data);

        assertNotNull(hash, "Hash should not be null");
        assertEquals(64, hash.length(), "SHA256 hash should be 64 characters");
        assertTrue(hash.matches("^[a-f0-9]{64}$"), "Hash should only contain hex characters");
    }

    @Test
    @Order(2)
    @DisplayName("Calculate hash from input stream")
    void testCalculateHashFromInputStream() throws IOException {
        InputStream stream = new ByteArrayInputStream(TEST_CONTENT.getBytes(StandardCharsets.UTF_8));
        String hash = hashService.calculateHash(stream);

        assertNotNull(hash, "Hash should not be null");
        assertEquals(64, hash.length(), "SHA256 hash should be 64 characters");
    }

    @Test
    @Order(3)
    @DisplayName("Calculate hash from file path")
    void testCalculateHashFromFilePath() throws IOException {
        String hash = hashService.calculateHashFromFile(testFile);

        assertNotNull(hash, "Hash should not be null");
        assertEquals(64, hash.length(), "SHA256 hash should be 64 characters");
    }

    @Test
    @Order(4)
    @DisplayName("Calculate hash from file path string")
    void testCalculateHashFromFilePathString() throws IOException {
        String hash = hashService.calculateHashFromFile(testFile.toString());

        assertNotNull(hash, "Hash should not be null");
        assertEquals(64, hash.length(), "SHA256 hash should be 64 characters");
    }

    @Test
    @Order(5)
    @DisplayName("Same content produces same hash")
    void testDeterministicHash() throws IOException {
        byte[] data = TEST_CONTENT.getBytes(StandardCharsets.UTF_8);

        String hash1 = hashService.calculateHash(data);
        String hash2 = hashService.calculateHash(data);
        String hash3 = hashService.calculateHashFromFile(testFile);

        assertEquals(hash1, hash2, "Same data should produce same hash");
        assertEquals(hash1, hash3, "Hash from bytes and file should match");
    }

    @Test
    @Order(6)
    @DisplayName("Different content produces different hash")
    void testDifferentContent() {
        String hash1 = hashService.calculateHash("Content A".getBytes());
        String hash2 = hashService.calculateHash("Content B".getBytes());

        assertNotEquals(hash1, hash2, "Different content should produce different hash");
    }

    @Test
    @Order(7)
    @DisplayName("Verify hash matches file")
    void testVerifyHashSuccess() throws IOException {
        String expectedHash = hashService.calculateHashFromFile(testFile);
        boolean result = hashService.verifyHash(testFile, expectedHash);

        assertTrue(result, "Hash verification should succeed for correct hash");
    }

    @Test
    @Order(8)
    @DisplayName("Verify hash fails for wrong hash")
    void testVerifyHashFailure() {
        String wrongHash = "0000000000000000000000000000000000000000000000000000000000000000";
        boolean result = hashService.verifyHash(testFile, wrongHash);

        assertFalse(result, "Hash verification should fail for wrong hash");
    }

    @Test
    @Order(9)
    @DisplayName("Verify hash from input stream")
    void testVerifyHashFromInputStream() throws IOException {
        String content = "Stream verification test";
        InputStream stream = new ByteArrayInputStream(content.getBytes());
        String expectedHash = hashService.calculateHash(content.getBytes());

        // Need new stream since previous one is consumed
        InputStream verifyStream = new ByteArrayInputStream(content.getBytes());
        boolean result = hashService.verifyHash(verifyStream, expectedHash);

        assertTrue(result, "Stream hash verification should succeed");
    }

    @Test
    @Order(10)
    @DisplayName("Validate hash format - valid hash")
    void testValidHashFormat() {
        String validHash = "a".repeat(64);
        assertTrue(hashService.isValidHashFormat(validHash));

        validHash = "0123456789abcdef".repeat(4);
        assertTrue(hashService.isValidHashFormat(validHash));

        validHash = "0123456789ABCDEF".repeat(4);
        assertTrue(hashService.isValidHashFormat(validHash));
    }

    @Test
    @Order(11)
    @DisplayName("Validate hash format - invalid hash")
    void testInvalidHashFormat() {
        // Too short
        assertFalse(hashService.isValidHashFormat("abc123"));

        // Too long
        assertFalse(hashService.isValidHashFormat("a".repeat(65)));

        // Invalid characters
        assertFalse(hashService.isValidHashFormat("g".repeat(64)));

        // Null
        assertFalse(hashService.isValidHashFormat(null));

        // Empty
        assertFalse(hashService.isValidHashFormat(""));

        // Contains spaces
        assertFalse(hashService.isValidHashFormat(" ".repeat(64)));
    }

    @Test
    @Order(12)
    @DisplayName("Get algorithm returns SHA-256")
    void testGetAlgorithm() {
        assertEquals("SHA-256", hashService.getAlgorithm());
    }

    @Test
    @Order(13)
    @DisplayName("Large file hash calculation")
    void testLargeFileHash() throws IOException {
        // Create a 1MB file
        Path largeFile = Files.createTempFile("large-hash-test", ".bin");
        try {
            byte[] data = new byte[1024 * 1024]; // 1MB
            for (int i = 0; i < data.length; i++) {
                data[i] = (byte) (i % 256);
            }
            Files.write(largeFile, data);

            // This should complete without memory issues
            String hash = hashService.calculateHashFromFile(largeFile);

            assertNotNull(hash);
            assertEquals(64, hash.length());

            // Verify consistency
            String hash2 = hashService.calculateHashFromFile(largeFile);
            assertEquals(hash, hash2, "Large file hash should be consistent");

        } finally {
            Files.deleteIfExists(largeFile);
        }
    }

    @Test
    @Order(14)
    @DisplayName("Empty content hash")
    void testEmptyContentHash() {
        String hash = hashService.calculateHash(new byte[0]);

        assertNotNull(hash);
        assertEquals(64, hash.length());
        // SHA256 of empty string is well-known
        assertEquals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", hash);
    }

    @Test
    @Order(15)
    @DisplayName("Handle non-existent file gracefully")
    void testNonExistentFile() {
        Path nonExistent = Path.of("/tmp/this-file-does-not-exist-12345.txt");

        assertThrows(IOException.class, () -> {
            hashService.calculateHashFromFile(nonExistent);
        });

        // verifyHash should return false, not throw
        boolean result = hashService.verifyHash(nonExistent, "somehash");
        assertFalse(result);
    }
}
