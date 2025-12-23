package io.aurigraph.core;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * High-performance hashing utilities for Aurigraph V11
 * Optimized for GraalVM native image compilation
 */
public final class HashUtil {
    
    // Pre-create digest instances for better performance
    private static final ThreadLocal<MessageDigest> SHA256_DIGEST = 
        ThreadLocal.withInitial(() -> {
            try {
                return MessageDigest.getInstance("SHA-256");
            } catch (NoSuchAlgorithmException e) {
                throw new RuntimeException("SHA-256 algorithm not available", e);
            }
        });
    
    private static final ThreadLocal<MessageDigest> SHA3_256_DIGEST = 
        ThreadLocal.withInitial(() -> {
            try {
                return MessageDigest.getInstance("SHA3-256");
            } catch (NoSuchAlgorithmException e) {
                throw new RuntimeException("SHA3-256 algorithm not available", e);
            }
        });

    // HexFormat instance for efficient hex encoding
    private static final HexFormat HEX_FORMAT = HexFormat.of();

    private HashUtil() {
        // Utility class
    }

    /**
     * Calculate SHA-256 hash of a string and return as hex
     */
    public static String sha256Hex(String input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        MessageDigest digest = SHA256_DIGEST.get();
        digest.reset();
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HEX_FORMAT.formatHex(hash);
    }

    /**
     * Calculate SHA-256 hash of bytes and return as hex
     */
    public static String sha256Hex(byte[] input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        MessageDigest digest = SHA256_DIGEST.get();
        digest.reset();
        byte[] hash = digest.digest(input);
        return HEX_FORMAT.formatHex(hash);
    }

    /**
     * Calculate SHA-256 hash of a string and return as bytes
     */
    public static byte[] sha256(String input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        MessageDigest digest = SHA256_DIGEST.get();
        digest.reset();
        return digest.digest(input.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Calculate SHA-256 hash of bytes and return as bytes
     */
    public static byte[] sha256(byte[] input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        MessageDigest digest = SHA256_DIGEST.get();
        digest.reset();
        return digest.digest(input);
    }

    /**
     * Calculate SHA3-256 hash (more secure for blockchain use)
     */
    public static String sha3256Hex(String input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        MessageDigest digest = SHA3_256_DIGEST.get();
        digest.reset();
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HEX_FORMAT.formatHex(hash);
    }

    /**
     * Calculate SHA3-256 hash of bytes
     */
    public static byte[] sha3256(byte[] input) {
        if (input == null) {
            throw new IllegalArgumentException("Input cannot be null");
        }
        
        MessageDigest digest = SHA3_256_DIGEST.get();
        digest.reset();
        return digest.digest(input);
    }

    /**
     * Calculate double SHA-256 (Bitcoin-style)
     */
    public static String doubleSha256Hex(String input) {
        byte[] firstHash = sha256(input);
        byte[] secondHash = sha256(firstHash);
        return HEX_FORMAT.formatHex(secondHash);
    }

    /**
     * Combine multiple hashes using Merkle tree approach
     */
    public static String merkleRoot(String... hashes) {
        if (hashes == null || hashes.length == 0) {
            throw new IllegalArgumentException("At least one hash required");
        }
        
        if (hashes.length == 1) {
            return hashes[0];
        }
        
        // Build Merkle tree bottom-up
        var currentLevel = hashes.clone();
        
        while (currentLevel.length > 1) {
            var nextLevel = new String[(currentLevel.length + 1) / 2];
            
            for (int i = 0; i < nextLevel.length; i++) {
                String left = currentLevel[i * 2];
                String right = (i * 2 + 1 < currentLevel.length) ? 
                              currentLevel[i * 2 + 1] : left; // Duplicate last if odd
                
                nextLevel[i] = sha256Hex(left + right);
            }
            
            currentLevel = nextLevel;
        }
        
        return currentLevel[0];
    }

    /**
     * Verify hex string format
     */
    public static boolean isValidHex(String hex) {
        if (hex == null || hex.isEmpty() || hex.length() % 2 != 0) {
            return false;
        }
        
        try {
            HEX_FORMAT.parseHex(hex);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Convert hex string to bytes
     */
    public static byte[] hexToBytes(String hex) {
        if (!isValidHex(hex)) {
            throw new IllegalArgumentException("Invalid hex string: " + hex);
        }
        return HEX_FORMAT.parseHex(hex);
    }

    /**
     * Convert bytes to hex string
     */
    public static String bytesToHex(byte[] bytes) {
        if (bytes == null) {
            throw new IllegalArgumentException("Bytes cannot be null");
        }
        return HEX_FORMAT.formatHex(bytes);
    }
}