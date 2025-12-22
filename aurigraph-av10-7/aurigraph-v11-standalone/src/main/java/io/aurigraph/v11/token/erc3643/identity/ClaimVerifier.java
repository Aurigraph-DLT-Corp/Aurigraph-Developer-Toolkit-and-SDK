package io.aurigraph.v11.token.erc3643.identity;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Claim Verifier for ONCHAINID Claims in ERC-3643 T-REX.
 *
 * Provides:
 * - ONCHAINID claim verification
 * - Claim topic definitions
 * - Trusted claim issuers registry
 * - Signature verification
 *
 * Based on ERC-735 (Claim Holder) and ERC-725 (Proxy Identity) standards.
 *
 * @see <a href="https://eips.ethereum.org/EIPS/eip-735">EIP-735</a>
 * @see <a href="https://eips.ethereum.org/EIPS/eip-725">EIP-725</a>
 */
@ApplicationScoped
public class ClaimVerifier {

    // Trusted claim issuers registry
    private final Map<String, TrustedIssuer> trustedIssuers = new ConcurrentHashMap<>();

    // Claims storage (wallet -> topic -> claims)
    private final Map<String, Map<ClaimTopic, List<Claim>>> walletClaims = new ConcurrentHashMap<>();

    // Event listeners
    private final List<ClaimEventListener> eventListeners = new CopyOnWriteArrayList<>();

    // ==================== Claim Topic Enum ====================

    /**
     * Standard claim topics based on ONCHAINID specifications.
     * Topics are categorized for different compliance requirements.
     */
    public enum ClaimTopic {
        // Identity Topics (1-99)
        BIOMETRIC(1, "Biometric verification", true),
        RESIDENCE(2, "Proof of residence", true),
        REGISTRY(3, "National registry verification", true),
        COUNTRY(10, "Country of residence", true),

        // KYC Topics (100-199)
        KYC_BASIC(100, "Basic KYC verification", true),
        KYC_ENHANCED(101, "Enhanced KYC verification", true),
        KYC_INSTITUTIONAL(102, "Institutional KYC verification", true),

        // AML Topics (200-299)
        AML_VERIFIED(200, "AML/CFT compliance verified", true),
        AML_ENHANCED(201, "Enhanced due diligence completed", true),
        PEP_SCREENING(210, "Politically Exposed Person screening", true),
        SANCTIONS_SCREENING(211, "Sanctions list screening", true),

        // Investor Status Topics (300-399)
        ACCREDITED_INVESTOR(300, "Accredited investor status", true),
        QUALIFIED_PURCHASER(301, "Qualified purchaser status", true),
        PROFESSIONAL_INVESTOR(302, "Professional investor status (MiFID II)", true),
        INSTITUTIONAL_INVESTOR(303, "Institutional investor status", true),
        RETAIL_INVESTOR(304, "Retail investor status", false),

        // Regulatory Topics (400-499)
        REG_D_506B(400, "SEC Regulation D 506(b) compliant", true),
        REG_D_506C(401, "SEC Regulation D 506(c) compliant", true),
        REG_S(402, "SEC Regulation S compliant", true),
        REG_A(403, "SEC Regulation A compliant", true),
        MIFID_II(410, "MiFID II compliant", true),
        AIFMD(411, "AIFMD compliant", true),
        UCITS(412, "UCITS compliant", true),

        // Asset-Specific Topics (500-599)
        REAL_ESTATE_ELIGIBLE(500, "Eligible for real estate tokens", false),
        PRIVATE_EQUITY_ELIGIBLE(501, "Eligible for private equity tokens", false),
        DEBT_SECURITIES_ELIGIBLE(502, "Eligible for debt securities", false),
        EQUITY_SECURITIES_ELIGIBLE(503, "Eligible for equity securities", false),

        // Geographic Topics (600-699)
        US_PERSON(600, "US Person status", true),
        EU_RESIDENT(601, "EU resident status", true),
        UK_RESIDENT(602, "UK resident status", true),
        APAC_RESIDENT(603, "APAC resident status", true),

        // Tax Topics (700-799)
        TAX_ID_VERIFIED(700, "Tax identification verified", true),
        FATCA_COMPLIANT(701, "FATCA compliance verified", true),
        CRS_COMPLIANT(702, "CRS compliance verified", true),

        // Custom Topics (1000+)
        CUSTOM_CLAIM(1000, "Custom claim type", false);

        private final int topicId;
        private final String description;
        private final boolean requiresTrustedIssuer;

        ClaimTopic(int topicId, String description, boolean requiresTrustedIssuer) {
            this.topicId = topicId;
            this.description = description;
            this.requiresTrustedIssuer = requiresTrustedIssuer;
        }

        public int getTopicId() { return topicId; }
        public String getDescription() { return description; }
        public boolean requiresTrustedIssuer() { return requiresTrustedIssuer; }

        public static Optional<ClaimTopic> fromTopicId(int topicId) {
            for (ClaimTopic topic : values()) {
                if (topic.topicId == topicId) {
                    return Optional.of(topic);
                }
            }
            return Optional.empty();
        }
    }

    // ==================== Records ====================

    /**
     * Trusted claim issuer record
     */
    public record TrustedIssuer(
        String issuerId,
        String name,
        String publicKey,
        Set<ClaimTopic> authorizedTopics,
        String jurisdiction,
        Instant registeredAt,
        Instant expiresAt,
        boolean isActive
    ) {
        public boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }

        public boolean canIssueClaim(ClaimTopic topic) {
            return isActive && !isExpired() && authorizedTopics.contains(topic);
        }
    }

    /**
     * Claim record following ERC-735 structure
     */
    public record Claim(
        String claimId,
        ClaimTopic topic,
        String scheme,           // Signature scheme (e.g., "ECDSA", "RSA")
        String issuer,           // Issuer ID
        String signature,        // Signed claim data
        String data,             // Claim data
        String uri,              // URI to claim data
        Instant issuedAt,
        Instant expiresAt
    ) {
        public boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }

        public boolean isValid() {
            return !isExpired();
        }
    }

    /**
     * Claim verification result record
     */
    public record ClaimVerificationResult(
        String claimId,
        ClaimTopic topic,
        boolean verified,
        VerificationFailureReason failureReason,
        String details
    ) {}

    /**
     * Batch verification result record
     */
    public record BatchVerificationResult(
        boolean allVerified,
        int verifiedCount,
        int failedCount,
        List<ClaimTopic> failedClaims,
        List<ClaimVerificationResult> results
    ) {}

    /**
     * Claim event record
     */
    public record ClaimEvent(
        String transactionId,
        String wallet,
        ClaimTopic topic,
        ClaimAction action,
        String details,
        Instant timestamp
    ) {}

    // ==================== Enums ====================

    public enum VerificationFailureReason {
        CLAIM_NOT_FOUND,
        CLAIM_EXPIRED,
        ISSUER_NOT_TRUSTED,
        ISSUER_NOT_AUTHORIZED,
        ISSUER_EXPIRED,
        SIGNATURE_INVALID,
        DATA_CORRUPTED,
        REVOKED
    }

    public enum ClaimAction {
        ADDED,
        UPDATED,
        REVOKED,
        EXPIRED,
        VERIFIED,
        VERIFICATION_FAILED
    }

    // ==================== Event Listener Interface ====================

    public interface ClaimEventListener {
        void onClaimEvent(ClaimEvent event);
    }

    // ==================== Trusted Issuer Management ====================

    /**
     * Register a trusted claim issuer
     */
    public Uni<Boolean> registerTrustedIssuer(
            String issuerId,
            String name,
            String publicKey,
            Set<ClaimTopic> authorizedTopics,
            String jurisdiction,
            int validityDays
    ) {
        return Uni.createFrom().item(() -> {
            if (trustedIssuers.containsKey(issuerId)) {
                Log.warnf("Trusted issuer already registered: %s", issuerId);
                return false;
            }

            TrustedIssuer issuer = new TrustedIssuer(
                    issuerId,
                    name,
                    publicKey,
                    authorizedTopics,
                    jurisdiction,
                    Instant.now(),
                    Instant.now().plus(validityDays, ChronoUnit.DAYS),
                    true
            );

            trustedIssuers.put(issuerId, issuer);
            Log.infof("Trusted issuer registered: id=%s, name=%s, topics=%d, jurisdiction=%s",
                    issuerId, name, authorizedTopics.size(), jurisdiction);
            return true;
        });
    }

    /**
     * Update trusted issuer authorized topics
     */
    public Uni<Boolean> updateIssuerTopics(String issuerId, Set<ClaimTopic> newTopics) {
        return Uni.createFrom().item(() -> {
            TrustedIssuer existing = trustedIssuers.get(issuerId);
            if (existing == null) {
                Log.warnf("Trusted issuer not found: %s", issuerId);
                return false;
            }

            TrustedIssuer updated = new TrustedIssuer(
                    existing.issuerId(),
                    existing.name(),
                    existing.publicKey(),
                    newTopics,
                    existing.jurisdiction(),
                    existing.registeredAt(),
                    existing.expiresAt(),
                    existing.isActive()
            );

            trustedIssuers.put(issuerId, updated);
            Log.infof("Trusted issuer topics updated: id=%s, newTopicsCount=%d", issuerId, newTopics.size());
            return true;
        });
    }

    /**
     * Revoke a trusted issuer
     */
    public Uni<Boolean> revokeTrustedIssuer(String issuerId) {
        return Uni.createFrom().item(() -> {
            TrustedIssuer existing = trustedIssuers.get(issuerId);
            if (existing == null) {
                Log.warnf("Trusted issuer not found: %s", issuerId);
                return false;
            }

            TrustedIssuer revoked = new TrustedIssuer(
                    existing.issuerId(),
                    existing.name(),
                    existing.publicKey(),
                    existing.authorizedTopics(),
                    existing.jurisdiction(),
                    existing.registeredAt(),
                    existing.expiresAt(),
                    false
            );

            trustedIssuers.put(issuerId, revoked);
            Log.infof("Trusted issuer revoked: id=%s", issuerId);
            return true;
        });
    }

    /**
     * Get trusted issuer by ID
     */
    public Optional<TrustedIssuer> getTrustedIssuer(String issuerId) {
        return Optional.ofNullable(trustedIssuers.get(issuerId));
    }

    /**
     * Get all trusted issuers for a specific topic
     */
    public List<TrustedIssuer> getTrustedIssuersForTopic(ClaimTopic topic) {
        return trustedIssuers.values().stream()
                .filter(issuer -> issuer.canIssueClaim(topic))
                .toList();
    }

    /**
     * Check if issuer is trusted for a topic
     */
    public boolean isIssuerTrusted(String issuerId, ClaimTopic topic) {
        TrustedIssuer issuer = trustedIssuers.get(issuerId);
        return issuer != null && issuer.canIssueClaim(topic);
    }

    // ==================== Claim Management ====================

    /**
     * Add a claim for a wallet
     */
    public Uni<Boolean> addClaim(String wallet, Claim claim) {
        return Uni.createFrom().item(() -> {
            String walletLower = wallet.toLowerCase();

            // Verify issuer is trusted for this topic
            if (claim.topic().requiresTrustedIssuer()) {
                if (!isIssuerTrusted(claim.issuer(), claim.topic())) {
                    Log.warnf("Claim rejected: issuer not trusted for topic. issuer=%s, topic=%s",
                            claim.issuer(), claim.topic());
                    return false;
                }
            }

            // Verify signature
            if (!verifyClaimSignature(claim)) {
                Log.warnf("Claim rejected: invalid signature. claimId=%s", claim.claimId());
                return false;
            }

            // Store claim
            walletClaims.computeIfAbsent(walletLower, k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(claim.topic(), k -> new CopyOnWriteArrayList<>())
                    .add(claim);

            emitEvent(new ClaimEvent(
                    generateTransactionId(),
                    walletLower,
                    claim.topic(),
                    ClaimAction.ADDED,
                    String.format("Issuer: %s, Expires: %s", claim.issuer(), claim.expiresAt()),
                    Instant.now()
            ));

            Log.infof("Claim added: wallet=%s, topic=%s, issuer=%s", walletLower, claim.topic(), claim.issuer());
            return true;
        });
    }

    /**
     * Revoke a claim
     */
    public Uni<Boolean> revokeClaim(String wallet, String claimId) {
        return Uni.createFrom().item(() -> {
            String walletLower = wallet.toLowerCase();
            Map<ClaimTopic, List<Claim>> claims = walletClaims.get(walletLower);

            if (claims == null) {
                Log.warnf("Claim revocation failed: no claims found for wallet. wallet=%s", walletLower);
                return false;
            }

            for (Map.Entry<ClaimTopic, List<Claim>> entry : claims.entrySet()) {
                List<Claim> topicClaims = entry.getValue();
                Optional<Claim> claimToRemove = topicClaims.stream()
                        .filter(c -> c.claimId().equals(claimId))
                        .findFirst();

                if (claimToRemove.isPresent()) {
                    topicClaims.remove(claimToRemove.get());

                    emitEvent(new ClaimEvent(
                            generateTransactionId(),
                            walletLower,
                            claimToRemove.get().topic(),
                            ClaimAction.REVOKED,
                            String.format("ClaimId: %s", claimId),
                            Instant.now()
                    ));

                    Log.infof("Claim revoked: wallet=%s, claimId=%s", walletLower, claimId);
                    return true;
                }
            }

            Log.warnf("Claim revocation failed: claim not found. wallet=%s, claimId=%s", walletLower, claimId);
            return false;
        });
    }

    /**
     * Get all claims for a wallet
     */
    public Uni<Map<ClaimTopic, List<Claim>>> getWalletClaims(String wallet) {
        return Uni.createFrom().item(() -> {
            Map<ClaimTopic, List<Claim>> claims = walletClaims.get(wallet.toLowerCase());
            return claims != null ? Map.copyOf(claims) : Map.of();
        });
    }

    /**
     * Get claims for a specific topic
     */
    public Uni<List<Claim>> getClaimsByTopic(String wallet, ClaimTopic topic) {
        return Uni.createFrom().item(() -> {
            Map<ClaimTopic, List<Claim>> claims = walletClaims.get(wallet.toLowerCase());
            if (claims == null) return List.of();
            List<Claim> topicClaims = claims.get(topic);
            return topicClaims != null ? List.copyOf(topicClaims) : List.of();
        });
    }

    // ==================== Verification Functions ====================

    /**
     * Verify a single claim
     */
    public Uni<ClaimVerificationResult> verifyClaim(String wallet, ClaimTopic topic) {
        return getClaimsByTopic(wallet, topic)
                .map(claims -> {
                    if (claims.isEmpty()) {
                        return new ClaimVerificationResult(
                                null, topic, false,
                                VerificationFailureReason.CLAIM_NOT_FOUND,
                                "No claims found for topic"
                        );
                    }

                    // Find the most recent valid claim
                    Optional<Claim> validClaim = claims.stream()
                            .filter(Claim::isValid)
                            .max((c1, c2) -> c1.issuedAt().compareTo(c2.issuedAt()));

                    if (validClaim.isEmpty()) {
                        return new ClaimVerificationResult(
                                claims.get(0).claimId(), topic, false,
                                VerificationFailureReason.CLAIM_EXPIRED,
                                "All claims for topic have expired"
                        );
                    }

                    Claim claim = validClaim.get();

                    // Verify issuer is still trusted
                    if (topic.requiresTrustedIssuer()) {
                        TrustedIssuer issuer = trustedIssuers.get(claim.issuer());
                        if (issuer == null || !issuer.canIssueClaim(topic)) {
                            VerificationFailureReason reason = issuer == null ?
                                    VerificationFailureReason.ISSUER_NOT_TRUSTED :
                                    (issuer.isExpired() ?
                                            VerificationFailureReason.ISSUER_EXPIRED :
                                            VerificationFailureReason.ISSUER_NOT_AUTHORIZED);

                            return new ClaimVerificationResult(
                                    claim.claimId(), topic, false, reason,
                                    "Issuer verification failed: " + claim.issuer()
                            );
                        }
                    }

                    // Verify signature
                    if (!verifyClaimSignature(claim)) {
                        return new ClaimVerificationResult(
                                claim.claimId(), topic, false,
                                VerificationFailureReason.SIGNATURE_INVALID,
                                "Claim signature verification failed"
                        );
                    }

                    emitEvent(new ClaimEvent(
                            generateTransactionId(),
                            wallet.toLowerCase(),
                            topic,
                            ClaimAction.VERIFIED,
                            String.format("ClaimId: %s, Issuer: %s", claim.claimId(), claim.issuer()),
                            Instant.now()
                    ));

                    return new ClaimVerificationResult(
                            claim.claimId(), topic, true, null,
                            "Claim verified successfully"
                    );
                });
    }

    /**
     * Verify multiple claims for a wallet
     */
    public Uni<BatchVerificationResult> verifyClaimsForWallet(String wallet, Set<ClaimTopic> requiredTopics) {
        return Multi.createFrom().iterable(requiredTopics)
                .onItem().transformToUniAndMerge(topic -> verifyClaim(wallet, topic))
                .collect().asList()
                .map(results -> {
                    int verified = (int) results.stream().filter(ClaimVerificationResult::verified).count();
                    int failed = results.size() - verified;
                    List<ClaimTopic> failedTopics = results.stream()
                            .filter(r -> !r.verified())
                            .map(ClaimVerificationResult::topic)
                            .toList();

                    Log.debugf("Batch verification completed: wallet=%s, verified=%d, failed=%d",
                            wallet, verified, failed);

                    return new BatchVerificationResult(
                            failed == 0,
                            verified,
                            failed,
                            failedTopics,
                            results
                    );
                });
    }

    /**
     * Check if wallet has valid claim for a topic
     */
    public Uni<Boolean> hasValidClaim(String wallet, ClaimTopic topic) {
        return verifyClaim(wallet, topic).map(ClaimVerificationResult::verified);
    }

    /**
     * Check if wallet meets a set of claim requirements
     */
    public Uni<Boolean> meetsClaimRequirements(String wallet, Set<ClaimTopic> requiredTopics) {
        return verifyClaimsForWallet(wallet, requiredTopics)
                .map(BatchVerificationResult::allVerified);
    }

    // ==================== Signature Verification ====================

    /**
     * Verify claim signature
     * This is a simplified implementation. In production, use proper cryptographic verification.
     */
    private boolean verifyClaimSignature(Claim claim) {
        try {
            // Get issuer's public key
            TrustedIssuer issuer = trustedIssuers.get(claim.issuer());
            if (issuer == null) {
                // For non-trusted issuer claims, verify using claim's embedded signature scheme
                return verifySignatureWithScheme(claim);
            }

            // Verify signature using issuer's public key
            String dataToVerify = buildSignatureData(claim);
            return verifySignature(dataToVerify, claim.signature(), issuer.publicKey(), claim.scheme());

        } catch (Exception e) {
            Log.errorf(e, "Signature verification error for claim: %s", claim.claimId());
            return false;
        }
    }

    private String buildSignatureData(Claim claim) {
        return String.format("%s:%s:%s:%s:%s",
                claim.topic().getTopicId(),
                claim.issuer(),
                claim.data(),
                claim.issuedAt().toEpochMilli(),
                claim.expiresAt() != null ? claim.expiresAt().toEpochMilli() : "0"
        );
    }

    private boolean verifySignatureWithScheme(Claim claim) {
        // Simplified verification for claims without trusted issuers
        // In production, implement proper scheme-based verification
        return claim.signature() != null && !claim.signature().isEmpty();
    }

    private boolean verifySignature(String data, String signature, String publicKey, String scheme) {
        // Simplified signature verification
        // In production, implement proper cryptographic verification based on scheme
        switch (scheme.toUpperCase()) {
            case "ECDSA":
                return verifyECDSA(data, signature, publicKey);
            case "RSA":
                return verifyRSA(data, signature, publicKey);
            case "ED25519":
                return verifyEd25519(data, signature, publicKey);
            default:
                Log.warnf("Unknown signature scheme: %s", scheme);
                return false;
        }
    }

    private boolean verifyECDSA(String data, String signature, String publicKey) {
        // Simplified ECDSA verification
        // In production, use proper ECDSA verification with secp256k1 or secp256r1
        try {
            String expectedHash = computeHash(data + publicKey);
            return signature.startsWith(expectedHash.substring(0, 8));
        } catch (Exception e) {
            Log.errorf(e, "ECDSA verification failed");
            return false;
        }
    }

    private boolean verifyRSA(String data, String signature, String publicKey) {
        // Simplified RSA verification
        // In production, use proper RSA verification
        try {
            String expectedHash = computeHash(data + publicKey);
            return signature.startsWith(expectedHash.substring(0, 8));
        } catch (Exception e) {
            Log.errorf(e, "RSA verification failed");
            return false;
        }
    }

    private boolean verifyEd25519(String data, String signature, String publicKey) {
        // Simplified Ed25519 verification
        // In production, use proper Ed25519 verification
        try {
            String expectedHash = computeHash(data + publicKey);
            return signature.startsWith(expectedHash.substring(0, 8));
        } catch (Exception e) {
            Log.errorf(e, "Ed25519 verification failed");
            return false;
        }
    }

    private String computeHash(String input) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    // ==================== Utility Functions ====================

    /**
     * Create a new claim with proper formatting
     */
    public Claim createClaim(
            ClaimTopic topic,
            String issuer,
            String data,
            String uri,
            int validityDays
    ) {
        Instant now = Instant.now();
        String claimId = generateClaimId(topic, issuer, now);

        return new Claim(
                claimId,
                topic,
                "ECDSA",  // Default scheme
                issuer,
                "",       // Signature to be added by issuer
                data,
                uri,
                now,
                now.plus(validityDays, ChronoUnit.DAYS)
        );
    }

    /**
     * Sign a claim (for trusted issuers)
     */
    public Uni<Claim> signClaim(Claim claim, String privateKey) {
        return Uni.createFrom().item(() -> {
            try {
                String dataToSign = buildSignatureData(claim);
                String signature = generateSignature(dataToSign, privateKey, claim.scheme());

                return new Claim(
                        claim.claimId(),
                        claim.topic(),
                        claim.scheme(),
                        claim.issuer(),
                        signature,
                        claim.data(),
                        claim.uri(),
                        claim.issuedAt(),
                        claim.expiresAt()
                );
            } catch (Exception e) {
                Log.errorf(e, "Failed to sign claim: %s", claim.claimId());
                throw new RuntimeException("Claim signing failed", e);
            }
        });
    }

    private String generateSignature(String data, String privateKey, String scheme) throws NoSuchAlgorithmException {
        // Simplified signature generation
        // In production, implement proper cryptographic signing
        String hash = computeHash(data + privateKey);
        return hash.substring(0, 64);  // 256-bit signature
    }

    private String generateClaimId(ClaimTopic topic, String issuer, Instant timestamp) {
        try {
            String input = String.format("%s:%s:%d", topic.getTopicId(), issuer, timestamp.toEpochMilli());
            return "claim-" + computeHash(input).substring(0, 16);
        } catch (Exception e) {
            return "claim-" + java.util.UUID.randomUUID().toString().substring(0, 16);
        }
    }

    // ==================== Statistics ====================

    /**
     * Get total trusted issuers count
     */
    public int getTrustedIssuersCount() {
        return trustedIssuers.size();
    }

    /**
     * Get active trusted issuers count
     */
    public int getActiveTrustedIssuersCount() {
        return (int) trustedIssuers.values().stream()
                .filter(i -> i.isActive() && !i.isExpired())
                .count();
    }

    /**
     * Get total claims count
     */
    public int getTotalClaimsCount() {
        return walletClaims.values().stream()
                .flatMap(m -> m.values().stream())
                .mapToInt(List::size)
                .sum();
    }

    // ==================== Event Management ====================

    /**
     * Register an event listener
     */
    public void addEventListener(ClaimEventListener listener) {
        eventListeners.add(listener);
        Log.debugf("Claim event listener added: %s", listener.getClass().getSimpleName());
    }

    /**
     * Remove an event listener
     */
    public void removeEventListener(ClaimEventListener listener) {
        eventListeners.remove(listener);
        Log.debugf("Claim event listener removed: %s", listener.getClass().getSimpleName());
    }

    private void emitEvent(ClaimEvent event) {
        for (ClaimEventListener listener : eventListeners) {
            try {
                listener.onClaimEvent(event);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying claim event listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    private String generateTransactionId() {
        return "cv-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }
}
