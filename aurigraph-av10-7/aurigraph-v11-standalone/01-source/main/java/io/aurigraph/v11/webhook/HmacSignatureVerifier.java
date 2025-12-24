package io.aurigraph.v11.webhook;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.security.MessageDigest;
import java.util.logging.Logger;

/**
 * Story 8, Phase 3: HMAC Signature Verification Utility
 *
 * Provides HMAC-SHA256 signature generation and verification for webhook payloads.
 *
 * Security Features:
 * - HMAC-SHA256 signing (NIST recommended)
 * - Constant-time comparison (prevents timing attacks)
 * - Base64 encoding for transport
 * - Support for algorithm versioning
 *
 * Usage:
 * 1. Client generates signature: HmacSignatureVerifier.generate(secret, payload)
 * 2. Client sends: payload + X-Signature: sha256=<signature>
 * 3. Server verifies: HmacSignatureVerifier.verify(secret, payload, clientSignature)
 *
 * Performance:
 * - Generation: <1ms for typical payloads
 * - Verification: <1ms with constant-time comparison
 * - No external dependencies (Java crypto built-in)
 *
 * Best Practices:
 * - Store webhook secrets securely (encrypted in database)
 * - Rotate secrets periodically (90-day rotation)
 * - Use TLS 1.3 for transport (already enforced)
 * - Validate timestamp in payload (optional, prevents replay)
 */
public class HmacSignatureVerifier {

    private static final Logger LOG = Logger.getLogger(HmacSignatureVerifier.class.getName());

    private static final String ALGORITHM = "HmacSHA256";
    private static final String ENCODING = "UTF-8";

    /**
     * Generate HMAC-SHA256 signature for payload
     *
     * @param secret Webhook secret (UUID from database)
     * @param payload Binary payload to sign
     * @return Base64-encoded signature
     */
    public static String generate(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                secret.getBytes(ENCODING),
                0,
                secret.getBytes(ENCODING).length,
                ALGORITHM
            );
            mac.init(keySpec);

            byte[] signature = mac.doFinal(payload);
            return Base64.getEncoder().encodeToString(signature);

        } catch (Exception e) {
            LOG.severe("Error generating HMAC signature: " + e.getMessage());
            throw new RuntimeException("HMAC generation failed", e);
        }
    }

    /**
     * Verify HMAC-SHA256 signature
     *
     * Uses constant-time comparison to prevent timing attacks.
     *
     * @param secret Webhook secret
     * @param payload Binary payload
     * @param clientSignature Base64-encoded signature from client
     * @return true if signature is valid, false otherwise
     */
    public static boolean verify(String secret, byte[] payload, String clientSignature) {
        try {
            String serverSignature = generate(secret, payload);
            return constantTimeEquals(serverSignature, clientSignature);

        } catch (Exception e) {
            LOG.warning("Error verifying HMAC signature: " + e.getMessage());
            return false;
        }
    }

    /**
     * Verify signature with prefixed algorithm (e.g., "sha256=...")
     *
     * Extracts algorithm and signature from header format.
     *
     * @param secret Webhook secret
     * @param payload Binary payload
     * @param headerValue Header value (e.g., "sha256=abc123def456...")
     * @return true if signature is valid, false otherwise
     */
    public static boolean verifyHeader(String secret, byte[] payload, String headerValue) {
        try {
            if (headerValue == null || !headerValue.contains("=")) {
                LOG.warning("Invalid signature header format");
                return false;
            }

            String[] parts = headerValue.split("=", 2);
            String algorithm = parts[0].toLowerCase();
            String clientSignature = parts[1];

            if (!algorithm.equals("sha256")) {
                LOG.warning("Unsupported signature algorithm: " + algorithm);
                return false;
            }

            return verify(secret, payload, clientSignature);

        } catch (Exception e) {
            LOG.warning("Error verifying header signature: " + e.getMessage());
            return false;
        }
    }

    /**
     * Constant-time string comparison
     *
     * Prevents timing attacks where attacker infers signature byte-by-byte.
     * Compares all bytes even if first byte doesn't match.
     *
     * @param expected Expected value
     * @param actual Actual value
     * @return true if values are equal, false otherwise
     */
    public static boolean constantTimeEquals(String expected, String actual) {
        if (expected == null || actual == null) {
            return expected == actual;
        }

        byte[] expectedBytes = expected.getBytes(ENCODING);
        byte[] actualBytes = actual.getBytes(ENCODING);

        return constantTimeEquals(expectedBytes, actualBytes);
    }

    /**
     * Constant-time byte array comparison
     *
     * @param expected Expected byte array
     * @param actual Actual byte array
     * @return true if arrays are equal, false otherwise
     */
    public static boolean constantTimeEquals(byte[] expected, byte[] actual) {
        if (expected == null || actual == null) {
            return expected == actual;
        }

        if (expected.length != actual.length) {
            return false; // Length mismatch is safe to reveal
        }

        int result = 0;
        for (int i = 0; i < expected.length; i++) {
            result |= expected[i] ^ actual[i];
        }

        return result == 0;
    }

    /**
     * Generate SHA256 hash for payload (for integrity checking)
     *
     * @param payload Payload to hash
     * @return Hex-encoded hash
     */
    public static String sha256(byte[] payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload);
            return toHexString(hash);

        } catch (Exception e) {
            LOG.severe("Error generating SHA256 hash: " + e.getMessage());
            throw new RuntimeException("SHA256 generation failed", e);
        }
    }

    /**
     * Convert byte array to hex string
     */
    private static String toHexString(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
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
     * Validate webhook signature and timestamp (anti-replay)
     *
     * @param secret Webhook secret
     * @param payload Binary payload
     * @param signature Signature header value
     * @param timestamp Timestamp from payload (ISO 8601)
     * @param maxAgeSeconds Maximum age of webhook (600 = 10 minutes)
     * @return true if signature and timestamp valid, false otherwise
     */
    public static boolean verifyWithTimestamp(String secret, byte[] payload, String signature,
                                             String timestamp, long maxAgeSeconds) {
        try {
            // Verify signature first
            if (!verifyHeader(secret, payload, signature)) {
                LOG.warning("Invalid webhook signature");
                return false;
            }

            // Verify timestamp is recent (anti-replay)
            if (timestamp == null || timestamp.isEmpty()) {
                LOG.warning("Missing timestamp in webhook");
                return false;
            }

            long payloadTime = java.time.Instant.parse(timestamp).toEpochMilli();
            long currentTime = System.currentTimeMillis();
            long ageMs = currentTime - payloadTime;

            if (ageMs < 0 || ageMs > (maxAgeSeconds * 1000)) {
                LOG.warning("Webhook timestamp out of range: " + ageMs + "ms");
                return false;
            }

            return true;

        } catch (Exception e) {
            LOG.warning("Error in timestamp verification: " + e.getMessage());
            return false;
        }
    }
}
