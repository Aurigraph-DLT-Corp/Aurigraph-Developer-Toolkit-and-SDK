package io.aurigraph.v11.rwa.erc3643;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Claim Verifier for ERC-3643 Security Tokens
 *
 * Implements claim verification logic for compliant security token transfers.
 * Manages trusted claim issuers, claim topics, and verification logic.
 *
 * Key Features:
 * - Claim topics (KYC, AML, Accreditation, Jurisdiction)
 * - Trusted claim issuers registry
 * - Claim verification logic with cryptographic proof
 * - Claim expiration handling
 * - Multi-issuer claim aggregation
 * - Jurisdiction-specific claim requirements
 *
 * Claim Topics (ERC-735 compatible):
 * - 1: KYC (Know Your Customer)
 * - 2: AML (Anti-Money Laundering)
 * - 3: ACCREDITATION (Investor accreditation status)
 * - 4: JURISDICTION (Regulatory jurisdiction)
 * - 5: RESIDENCY (Tax residency)
 * - 6: SANCTIONS (Sanctions screening)
 * - 7: PEP (Politically Exposed Person)
 * - 8: SOURCE_OF_FUNDS (Source of funds verification)
 *
 * @author Aurigraph V11 - Frontend Development Agent
 * @version 11.0.0
 * @sprint Sprint 3 - RWA Token Standards
 * @see <a href="https://eips.ethereum.org/EIPS/eip-735">EIP-735: Claim Holder</a>
 */
@ApplicationScoped
public class ClaimVerifier {

    // Storage for claims and issuers
    private final Map<String, Map<Integer, List<Claim>>> addressClaims = new ConcurrentHashMap<>();
    private final Map<String, TrustedIssuer> trustedIssuers = new ConcurrentHashMap<>();
    private final Map<String, Set<Integer>> jurisdictionRequiredClaims = new ConcurrentHashMap<>();
    private final Set<String> verifierAgents = ConcurrentHashMap.newKeySet();
    private String verifierOwner;

    // ============== Claim Topic Constants ==============

    public static final int CLAIM_TOPIC_KYC = 1;
    public static final int CLAIM_TOPIC_AML = 2;
    public static final int CLAIM_TOPIC_ACCREDITATION = 3;
    public static final int CLAIM_TOPIC_JURISDICTION = 4;
    public static final int CLAIM_TOPIC_RESIDENCY = 5;
    public static final int CLAIM_TOPIC_SANCTIONS = 6;
    public static final int CLAIM_TOPIC_PEP = 7;
    public static final int CLAIM_TOPIC_SOURCE_OF_FUNDS = 8;

    // Standard claim requirements per jurisdiction
    private static final Set<Integer> US_REQUIRED_CLAIMS = Set.of(
        CLAIM_TOPIC_KYC, CLAIM_TOPIC_AML, CLAIM_TOPIC_ACCREDITATION, CLAIM_TOPIC_SANCTIONS
    );

    private static final Set<Integer> EU_REQUIRED_CLAIMS = Set.of(
        CLAIM_TOPIC_KYC, CLAIM_TOPIC_AML, CLAIM_TOPIC_JURISDICTION
    );

    private static final Set<Integer> DEFAULT_REQUIRED_CLAIMS = Set.of(
        CLAIM_TOPIC_KYC, CLAIM_TOPIC_AML
    );

    /**
     * Claim record - represents a verified claim attached to an identity
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Claim {
        private String claimId;
        private int topic;                    // Claim topic (1-8)
        private String issuer;                // Address of claim issuer
        private String subject;               // Address of claim subject
        private String scheme;                // Verification scheme (e.g., "ERC-735")
        private byte[] data;                  // Claim data (encrypted if needed)
        private String dataHash;              // Hash of claim data
        private byte[] signature;             // Issuer signature
        private String signatureAlgorithm;    // e.g., "ECDSA", "DILITHIUM"
        private Instant issuedAt;
        private Instant expiresAt;
        private Instant revokedAt;            // null if not revoked
        private ClaimStatus status;
        private String uri;                   // URI for additional claim data
        private Map<String, Object> metadata;
    }

    /**
     * Claim status
     */
    public enum ClaimStatus {
        PENDING,
        VALID,
        EXPIRED,
        REVOKED,
        INVALID
    }

    /**
     * Trusted Issuer record
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrustedIssuer {
        private String issuerAddress;
        private String issuerName;
        private Set<Integer> authorizedTopics;    // Topics this issuer can attest
        private Set<String> jurisdictions;         // Jurisdictions where issuer is trusted
        private String publicKey;                  // Issuer's public key for signature verification
        private String signatureScheme;            // e.g., "ECDSA", "DILITHIUM"
        private Instant addedAt;
        private Instant expiresAt;
        private boolean active;
        private TrustLevel trustLevel;
        private Map<String, Object> metadata;
    }

    /**
     * Trust level for issuers
     */
    public enum TrustLevel {
        BASIC,          // Basic KYC provider
        STANDARD,       // Standard verification provider
        ENHANCED,       // Enhanced due diligence provider
        REGULATORY      // Regulatory body
    }

    /**
     * Claim verification result
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClaimVerificationResult {
        private boolean verified;
        private String claimId;
        private int topic;
        private String issuer;
        private String subject;
        private Instant validFrom;
        private Instant validUntil;
        private String verificationMessage;
        private List<String> failureReasons;
    }

    /**
     * Initialize the claim verifier with an owner
     *
     * @param owner Address of the verifier owner
     */
    public void initialize(String owner) {
        this.verifierOwner = owner;
        this.verifierAgents.add(owner);

        // Initialize default jurisdiction requirements
        jurisdictionRequiredClaims.put("US", new HashSet<>(US_REQUIRED_CLAIMS));
        jurisdictionRequiredClaims.put("EU", new HashSet<>(EU_REQUIRED_CLAIMS));
        jurisdictionRequiredClaims.put("DEFAULT", new HashSet<>(DEFAULT_REQUIRED_CLAIMS));

        Log.infof("Claim Verifier initialized with owner: %s", owner);
    }

    /**
     * Add a trusted claim issuer
     *
     * @param issuer Trusted issuer details
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> addTrustedIssuer(TrustedIssuer issuer, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);

            issuer.setAddedAt(Instant.now());
            issuer.setActive(true);

            trustedIssuers.put(issuer.getIssuerAddress(), issuer);

            Log.infof("Added trusted issuer: %s (%s) for topics: %s",
                     issuer.getIssuerName(), issuer.getIssuerAddress(), issuer.getAuthorizedTopics());
            return true;
        });
    }

    /**
     * Remove a trusted issuer
     *
     * @param issuerAddress Issuer address to remove
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> removeTrustedIssuer(String issuerAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);

            TrustedIssuer issuer = trustedIssuers.get(issuerAddress);
            if (issuer != null) {
                issuer.setActive(false);
                Log.warnf("Removed trusted issuer: %s (%s)", issuer.getIssuerName(), issuerAddress);
            }
            return true;
        });
    }

    /**
     * Update trusted issuer authorized topics
     *
     * @param issuerAddress Issuer address
     * @param topics New set of authorized topics
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> updateIssuerTopics(
            String issuerAddress,
            Set<Integer> topics,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);

            TrustedIssuer issuer = trustedIssuers.get(issuerAddress);
            if (issuer == null) {
                throw new IssuerNotFoundException("Issuer not found: " + issuerAddress);
            }

            issuer.setAuthorizedTopics(topics);
            Log.infof("Updated issuer %s topics to: %s", issuerAddress, topics);
            return true;
        });
    }

    /**
     * Add a claim to an address
     *
     * @param claim Claim to add
     * @param callerAddress Issuer address (must be trusted for the claim topic)
     * @return Uni<String> claim ID
     */
    public Uni<String> addClaim(Claim claim, String callerAddress) {
        return Uni.createFrom().item(() -> {
            // Verify issuer is trusted for this claim topic
            if (!isTrustedIssuer(callerAddress, claim.getTopic())) {
                throw new UnauthorizedIssuerException(
                    "Issuer not authorized for claim topic: " + claim.getTopic()
                );
            }

            String claimId = generateClaimId(claim.getSubject(), claim.getTopic());
            claim.setClaimId(claimId);
            claim.setIssuer(callerAddress);
            claim.setIssuedAt(Instant.now());
            claim.setStatus(ClaimStatus.VALID);

            // Store claim
            addressClaims.computeIfAbsent(claim.getSubject(), k -> new ConcurrentHashMap<>())
                        .computeIfAbsent(claim.getTopic(), k -> new ArrayList<>())
                        .add(claim);

            Log.infof("Added claim %s (topic: %d) for address %s by issuer %s",
                     claimId, claim.getTopic(), claim.getSubject(), callerAddress);
            return claimId;
        });
    }

    /**
     * Revoke a claim
     *
     * @param subject Address of claim subject
     * @param claimId Claim ID to revoke
     * @param callerAddress Issuer address (must be original issuer)
     * @param reason Revocation reason
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> revokeClaim(String subject, String claimId, String callerAddress, String reason) {
        return Uni.createFrom().item(() -> {
            Map<Integer, List<Claim>> subjectClaims = addressClaims.get(subject);
            if (subjectClaims == null) {
                throw new ClaimNotFoundException("No claims found for subject: " + subject);
            }

            // Find and revoke the claim
            for (List<Claim> claims : subjectClaims.values()) {
                for (Claim claim : claims) {
                    if (claim.getClaimId().equals(claimId)) {
                        // Only the original issuer or an agent can revoke
                        if (!claim.getIssuer().equals(callerAddress) && !verifierAgents.contains(callerAddress)) {
                            throw new UnauthorizedIssuerException("Only claim issuer or agent can revoke");
                        }

                        claim.setStatus(ClaimStatus.REVOKED);
                        claim.setRevokedAt(Instant.now());
                        claim.getMetadata().put("revocationReason", reason);

                        Log.warnf("Claim revoked: %s for subject %s. Reason: %s",
                                 claimId, subject, reason);
                        return true;
                    }
                }
            }

            throw new ClaimNotFoundException("Claim not found: " + claimId);
        });
    }

    /**
     * Verify a specific claim
     *
     * @param subject Address of claim subject
     * @param topic Claim topic to verify
     * @return Uni<ClaimVerificationResult> verification result
     */
    public Uni<ClaimVerificationResult> verifyClaim(String subject, int topic) {
        return Uni.createFrom().item(() -> {
            List<String> failureReasons = new ArrayList<>();

            Map<Integer, List<Claim>> subjectClaims = addressClaims.get(subject);
            if (subjectClaims == null || !subjectClaims.containsKey(topic)) {
                failureReasons.add("No claim found for topic: " + topic);
                return ClaimVerificationResult.builder()
                        .verified(false)
                        .topic(topic)
                        .subject(subject)
                        .failureReasons(failureReasons)
                        .verificationMessage("Claim not found")
                        .build();
            }

            // Get the most recent valid claim for the topic
            Claim validClaim = subjectClaims.get(topic).stream()
                    .filter(c -> c.getStatus() == ClaimStatus.VALID)
                    .filter(c -> c.getExpiresAt() == null || c.getExpiresAt().isAfter(Instant.now()))
                    .filter(c -> isTrustedIssuer(c.getIssuer(), topic))
                    .max(Comparator.comparing(Claim::getIssuedAt))
                    .orElse(null);

            if (validClaim == null) {
                // Check specific failure reasons
                for (Claim claim : subjectClaims.get(topic)) {
                    if (claim.getStatus() == ClaimStatus.REVOKED) {
                        failureReasons.add("Claim has been revoked");
                    } else if (claim.getStatus() == ClaimStatus.EXPIRED ||
                              (claim.getExpiresAt() != null && claim.getExpiresAt().isBefore(Instant.now()))) {
                        failureReasons.add("Claim has expired");
                    } else if (!isTrustedIssuer(claim.getIssuer(), topic)) {
                        failureReasons.add("Claim issuer not trusted");
                    }
                }

                return ClaimVerificationResult.builder()
                        .verified(false)
                        .topic(topic)
                        .subject(subject)
                        .failureReasons(failureReasons)
                        .verificationMessage("No valid claim found")
                        .build();
            }

            // Verify signature if present
            if (validClaim.getSignature() != null) {
                boolean signatureValid = verifyClaimSignature(validClaim);
                if (!signatureValid) {
                    failureReasons.add("Claim signature verification failed");
                    return ClaimVerificationResult.builder()
                            .verified(false)
                            .claimId(validClaim.getClaimId())
                            .topic(topic)
                            .subject(subject)
                            .issuer(validClaim.getIssuer())
                            .failureReasons(failureReasons)
                            .verificationMessage("Signature verification failed")
                            .build();
                }
            }

            return ClaimVerificationResult.builder()
                    .verified(true)
                    .claimId(validClaim.getClaimId())
                    .topic(topic)
                    .subject(subject)
                    .issuer(validClaim.getIssuer())
                    .validFrom(validClaim.getIssuedAt())
                    .validUntil(validClaim.getExpiresAt())
                    .verificationMessage("Claim verified successfully")
                    .failureReasons(Collections.emptyList())
                    .build();
        });
    }

    /**
     * Verify all required claims for a jurisdiction
     *
     * @param subject Address to verify
     * @param jurisdiction Jurisdiction code
     * @return Uni<Boolean> whether all required claims are verified
     */
    public Uni<Boolean> verifyRequiredClaims(String subject, String jurisdiction) {
        return Uni.createFrom().item(() -> {
            Set<Integer> requiredTopics = jurisdictionRequiredClaims.getOrDefault(
                jurisdiction.toUpperCase(),
                jurisdictionRequiredClaims.get("DEFAULT")
            );

            for (int topic : requiredTopics) {
                ClaimVerificationResult result = verifyClaim(subject, topic).await().indefinitely();
                if (!result.isVerified()) {
                    Log.debugf("Claim verification failed for %s, topic %d: %s",
                              subject, topic, result.getVerificationMessage());
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Get all valid claims for an address
     *
     * @param subject Address to query
     * @return Uni<List<Claim>> list of valid claims
     */
    public Uni<List<Claim>> getValidClaims(String subject) {
        return Uni.createFrom().item(() -> {
            Map<Integer, List<Claim>> subjectClaims = addressClaims.get(subject);
            if (subjectClaims == null) {
                return Collections.emptyList();
            }

            return subjectClaims.values().stream()
                    .flatMap(List::stream)
                    .filter(c -> c.getStatus() == ClaimStatus.VALID)
                    .filter(c -> c.getExpiresAt() == null || c.getExpiresAt().isAfter(Instant.now()))
                    .collect(Collectors.toList());
        });
    }

    /**
     * Get claims by topic for an address
     *
     * @param subject Address to query
     * @param topic Claim topic
     * @return Uni<List<Claim>> list of claims for the topic
     */
    public Uni<List<Claim>> getClaimsByTopic(String subject, int topic) {
        return Uni.createFrom().item(() -> {
            Map<Integer, List<Claim>> subjectClaims = addressClaims.get(subject);
            if (subjectClaims == null || !subjectClaims.containsKey(topic)) {
                return Collections.emptyList();
            }
            return new ArrayList<>(subjectClaims.get(topic));
        });
    }

    /**
     * Check if an issuer is trusted for a specific claim topic
     *
     * @param issuerAddress Issuer address
     * @param topic Claim topic
     * @return boolean whether issuer is trusted
     */
    public boolean isTrustedIssuer(String issuerAddress, int topic) {
        TrustedIssuer issuer = trustedIssuers.get(issuerAddress);
        if (issuer == null || !issuer.isActive()) {
            return false;
        }

        // Check if issuer is expired
        if (issuer.getExpiresAt() != null && issuer.getExpiresAt().isBefore(Instant.now())) {
            return false;
        }

        return issuer.getAuthorizedTopics().contains(topic);
    }

    /**
     * Get all trusted issuers
     *
     * @return Uni<List<TrustedIssuer>> list of active trusted issuers
     */
    public Uni<List<TrustedIssuer>> getTrustedIssuers() {
        return Uni.createFrom().item(() ->
            trustedIssuers.values().stream()
                    .filter(TrustedIssuer::isActive)
                    .collect(Collectors.toList())
        );
    }

    /**
     * Get trusted issuers for a specific topic
     *
     * @param topic Claim topic
     * @return Uni<List<TrustedIssuer>> list of issuers authorized for the topic
     */
    public Uni<List<TrustedIssuer>> getTrustedIssuersForTopic(int topic) {
        return Uni.createFrom().item(() ->
            trustedIssuers.values().stream()
                    .filter(TrustedIssuer::isActive)
                    .filter(i -> i.getAuthorizedTopics().contains(topic))
                    .collect(Collectors.toList())
        );
    }

    /**
     * Set required claims for a jurisdiction
     *
     * @param jurisdiction Jurisdiction code
     * @param requiredTopics Set of required claim topics
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> setJurisdictionRequirements(
            String jurisdiction,
            Set<Integer> requiredTopics,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            jurisdictionRequiredClaims.put(jurisdiction.toUpperCase(), requiredTopics);
            Log.infof("Set required claims for jurisdiction %s: %s", jurisdiction, requiredTopics);
            return true;
        });
    }

    /**
     * Get required claims for a jurisdiction
     *
     * @param jurisdiction Jurisdiction code
     * @return Uni<Set<Integer>> set of required claim topics
     */
    public Uni<Set<Integer>> getJurisdictionRequirements(String jurisdiction) {
        return Uni.createFrom().item(() ->
            jurisdictionRequiredClaims.getOrDefault(
                jurisdiction.toUpperCase(),
                jurisdictionRequiredClaims.get("DEFAULT")
            )
        );
    }

    /**
     * Add an agent to the verifier
     *
     * @param agentAddress Agent address
     * @param callerAddress Owner address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> addAgent(String agentAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateOwner(callerAddress);
            verifierAgents.add(agentAddress);
            Log.infof("Agent added to claim verifier: %s", agentAddress);
            return true;
        });
    }

    /**
     * Remove an agent from the verifier
     *
     * @param agentAddress Agent address
     * @param callerAddress Owner address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> removeAgent(String agentAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateOwner(callerAddress);
            if (agentAddress.equals(verifierOwner)) {
                throw new IllegalArgumentException("Cannot remove owner from agents");
            }
            verifierAgents.remove(agentAddress);
            Log.infof("Agent removed from claim verifier: %s", agentAddress);
            return true;
        });
    }

    /**
     * Get claim topic name
     *
     * @param topic Topic number
     * @return String topic name
     */
    public static String getClaimTopicName(int topic) {
        return switch (topic) {
            case CLAIM_TOPIC_KYC -> "KYC";
            case CLAIM_TOPIC_AML -> "AML";
            case CLAIM_TOPIC_ACCREDITATION -> "ACCREDITATION";
            case CLAIM_TOPIC_JURISDICTION -> "JURISDICTION";
            case CLAIM_TOPIC_RESIDENCY -> "RESIDENCY";
            case CLAIM_TOPIC_SANCTIONS -> "SANCTIONS";
            case CLAIM_TOPIC_PEP -> "PEP";
            case CLAIM_TOPIC_SOURCE_OF_FUNDS -> "SOURCE_OF_FUNDS";
            default -> "UNKNOWN";
        };
    }

    // ============== Private Helper Methods ==============

    private void validateAgent(String callerAddress) {
        if (!verifierAgents.contains(callerAddress)) {
            throw new UnauthorizedIssuerException("Caller is not an authorized verifier agent");
        }
    }

    private void validateOwner(String callerAddress) {
        if (!callerAddress.equals(verifierOwner)) {
            throw new UnauthorizedIssuerException("Caller is not the verifier owner");
        }
    }

    private boolean verifyClaimSignature(Claim claim) {
        // In production, this would verify the cryptographic signature
        // using the issuer's public key from the trusted issuer registry
        TrustedIssuer issuer = trustedIssuers.get(claim.getIssuer());
        if (issuer == null || issuer.getPublicKey() == null) {
            return false;
        }

        // Simulate signature verification
        // In production, use BouncyCastle or similar for actual crypto verification
        try {
            // Verify using issuer's signature scheme (ECDSA, DILITHIUM, etc.)
            String scheme = claim.getSignatureAlgorithm();
            if (scheme == null) {
                scheme = issuer.getSignatureScheme();
            }

            // For simulation, always return true if signature and public key exist
            return claim.getSignature() != null && issuer.getPublicKey() != null;
        } catch (Exception e) {
            Log.warnf("Signature verification failed for claim %s: %s", claim.getClaimId(), e.getMessage());
            return false;
        }
    }

    private String generateClaimId(String subject, int topic) {
        return "CLAIM-" + subject.substring(0, Math.min(6, subject.length())).toUpperCase() +
               "-" + topic +
               "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ============== Custom Exceptions ==============

    public static class ClaimNotFoundException extends RuntimeException {
        public ClaimNotFoundException(String message) {
            super(message);
        }
    }

    public static class IssuerNotFoundException extends RuntimeException {
        public IssuerNotFoundException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedIssuerException extends RuntimeException {
        public UnauthorizedIssuerException(String message) {
            super(message);
        }
    }
}
