package io.aurigraph.v11.storage;

import javax.crypto.SecretKey;

/**
 * Node Encryption Keys
 *
 * Holds all cryptographic keys for a node's LevelDB encryption:
 * - dataEncryptionKey: AES-256 key for data encryption
 * - signingKeyId: Reference to Dilithium signing key
 * - kyberPublicKey: Public key for Kyber authentication
 *
 * @version 1.0.0 (Dec 8, 2025)
 */
public record NodeEncryptionKeys(
    String nodeId,
    SecretKey dataEncryptionKey,
    String signingKeyId,
    String kyberPublicKey,
    long createdAt,
    long expiresAt
) {
    /**
     * Check if keys have expired
     */
    public boolean isExpired() {
        return System.currentTimeMillis() > expiresAt;
    }

    /**
     * Get remaining validity time in milliseconds
     */
    public long remainingValidityMs() {
        return Math.max(0, expiresAt - System.currentTimeMillis());
    }

    /**
     * Get remaining validity time in days
     */
    public int remainingValidityDays() {
        return (int) (remainingValidityMs() / (24 * 60 * 60 * 1000));
    }
}
