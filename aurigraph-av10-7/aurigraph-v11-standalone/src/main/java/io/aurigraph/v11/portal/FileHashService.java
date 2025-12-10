package io.aurigraph.v11.portal;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * File Hash Service for SHA256 hash calculation and verification
 *
 * Provides:
 * - SHA256 hash calculation for files
 * - Streaming hash calculation for large files
 * - Hash verification
 *
 * @author J4C Deployment Agent
 * @version 12.0.0
 * @since AV11-582
 */
@ApplicationScoped
public class FileHashService {

    private static final Logger LOG = Logger.getLogger(FileHashService.class);
    private static final String ALGORITHM = "SHA-256";
    private static final int BUFFER_SIZE = 8192; // 8KB buffer for streaming

    /**
     * Calculate SHA256 hash from an InputStream
     * Uses streaming to handle large files efficiently
     *
     * @param inputStream The input stream to hash
     * @return The SHA256 hash as a lowercase hex string
     * @throws IOException If an I/O error occurs
     */
    public String calculateHash(InputStream inputStream) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }

            return bytesToHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            LOG.error("SHA-256 algorithm not available", e);
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Calculate SHA256 hash from a byte array
     *
     * @param data The byte array to hash
     * @return The SHA256 hash as a lowercase hex string
     */
    public String calculateHash(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] hash = digest.digest(data);
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            LOG.error("SHA-256 algorithm not available", e);
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Calculate SHA256 hash from a file path
     *
     * @param filePath The path to the file
     * @return The SHA256 hash as a lowercase hex string
     * @throws IOException If an I/O error occurs
     */
    public String calculateHashFromFile(Path filePath) throws IOException {
        try (InputStream is = Files.newInputStream(filePath)) {
            return calculateHash(is);
        }
    }

    /**
     * Calculate SHA256 hash from a file path string
     *
     * @param filePath The path string to the file
     * @return The SHA256 hash as a lowercase hex string
     * @throws IOException If an I/O error occurs
     */
    public String calculateHashFromFile(String filePath) throws IOException {
        return calculateHashFromFile(Path.of(filePath));
    }

    /**
     * Verify that a file matches the expected hash
     *
     * @param filePath The path to the file
     * @param expectedHash The expected SHA256 hash
     * @return true if the hash matches, false otherwise
     */
    public boolean verifyHash(Path filePath, String expectedHash) {
        try {
            String actualHash = calculateHashFromFile(filePath);
            boolean matches = actualHash.equalsIgnoreCase(expectedHash);

            if (matches) {
                LOG.debugf("Hash verification successful for file: %s", filePath);
            } else {
                LOG.warnf("Hash verification failed for file: %s. Expected: %s, Actual: %s",
                    filePath, expectedHash, actualHash);
            }

            return matches;
        } catch (IOException e) {
            LOG.errorf(e, "Failed to verify hash for file: %s", filePath);
            return false;
        }
    }

    /**
     * Verify that a file matches the expected hash
     *
     * @param filePath The path string to the file
     * @param expectedHash The expected SHA256 hash
     * @return true if the hash matches, false otherwise
     */
    public boolean verifyHash(String filePath, String expectedHash) {
        return verifyHash(Path.of(filePath), expectedHash);
    }

    /**
     * Verify that an InputStream content matches the expected hash
     * Note: This consumes the input stream
     *
     * @param inputStream The input stream to verify
     * @param expectedHash The expected SHA256 hash
     * @return true if the hash matches, false otherwise
     * @throws IOException If an I/O error occurs
     */
    public boolean verifyHash(InputStream inputStream, String expectedHash) throws IOException {
        String actualHash = calculateHash(inputStream);
        return actualHash.equalsIgnoreCase(expectedHash);
    }

    /**
     * Convert byte array to hexadecimal string
     *
     * @param bytes The byte array to convert
     * @return The lowercase hexadecimal string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Validate a hash string format
     *
     * @param hash The hash string to validate
     * @return true if the hash is a valid SHA256 hex string (64 characters)
     */
    public boolean isValidHashFormat(String hash) {
        if (hash == null || hash.length() != 64) {
            return false;
        }
        return hash.matches("^[a-fA-F0-9]{64}$");
    }

    /**
     * Get the hash algorithm name
     *
     * @return The algorithm name (SHA-256)
     */
    public String getAlgorithm() {
        return ALGORITHM;
    }
}
