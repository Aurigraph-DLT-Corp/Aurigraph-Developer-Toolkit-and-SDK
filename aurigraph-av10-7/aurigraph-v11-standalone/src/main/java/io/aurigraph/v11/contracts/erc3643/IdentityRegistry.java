package io.aurigraph.v11.contracts.erc3643;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ERC-3643 Identity Registry (ONCHAINID equivalent)
 *
 * Links wallet addresses to verified investor identities.
 * This is the core component of ERC-3643 compliance.
 *
 * Key Features:
 * - Identity registration and verification
 * - Claim management per identity
 * - Investor classification (accredited, retail, institutional)
 * - Country/jurisdiction tracking for transfer restrictions
 *
 * @version 1.0.0
 * @since 2025-12-08
 */
@ApplicationScoped
public class IdentityRegistry {

    private static final Logger LOG = LoggerFactory.getLogger(IdentityRegistry.class);

    // Identity storage: wallet address -> Identity
    private final Map<String, Identity> identities = new ConcurrentHashMap<>();

    // Reverse lookup: identity ID -> wallet addresses
    private final Map<String, Set<String>> identityWallets = new ConcurrentHashMap<>();

    /**
     * Register a new identity for a wallet address
     */
    public Uni<Identity> registerIdentity(String walletAddress, IdentityRegistrationRequest request) {
        return Uni.createFrom().item(() -> {
            String identityId = generateIdentityId(walletAddress, request);

            Identity identity = Identity.builder()
                .identityId(identityId)
                .walletAddress(walletAddress)
                .country(request.country())
                .investorType(request.investorType())
                .claims(new HashMap<>())
                .verificationStatus(VerificationStatus.PENDING)
                .createdAt(Instant.now())
                .build();

            identities.put(walletAddress, identity);
            identityWallets.computeIfAbsent(identityId, k -> ConcurrentHashMap.newKeySet())
                .add(walletAddress);

            LOG.info("Registered identity {} for wallet {}", identityId, walletAddress);
            return identity;
        });
    }

    /**
     * Add a claim to an identity (KYC, accreditation, etc.)
     */
    public Uni<Boolean> addClaim(String walletAddress, Claim claim) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            if (identity == null) {
                LOG.warn("No identity found for wallet: {}", walletAddress);
                return false;
            }

            identity.getClaims().put(claim.topic(), claim);
            identity.setUpdatedAt(Instant.now());

            LOG.info("Added claim {} to identity {}", claim.topic(), identity.getIdentityId());
            return true;
        });
    }

    /**
     * Check if identity has a specific claim
     */
    public Uni<Boolean> hasClaim(String walletAddress, ClaimTopic topic) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            if (identity == null) return false;

            Claim claim = identity.getClaims().get(topic);
            if (claim == null) return false;

            // Check if claim is valid and not expired
            return claim.isValid() && !claim.isExpired();
        });
    }

    /**
     * Get all valid claims for a wallet
     */
    public Uni<List<Claim>> getValidClaims(String walletAddress) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            if (identity == null) return List.of();

            return identity.getClaims().values().stream()
                .filter(Claim::isValid)
                .filter(c -> !c.isExpired())
                .toList();
        });
    }

    /**
     * Check if wallet is registered
     */
    public Uni<Boolean> isRegistered(String walletAddress) {
        return Uni.createFrom().item(() -> identities.containsKey(walletAddress));
    }

    /**
     * Check if wallet is verified (has completed KYC)
     */
    public Uni<Boolean> isVerified(String walletAddress) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            return identity != null &&
                   identity.getVerificationStatus() == VerificationStatus.VERIFIED;
        });
    }

    /**
     * Get identity for a wallet
     */
    public Uni<Identity> getIdentity(String walletAddress) {
        return Uni.createFrom().item(() -> identities.get(walletAddress));
    }

    /**
     * Get investor type for a wallet
     */
    public Uni<InvestorType> getInvestorType(String walletAddress) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            return identity != null ? identity.getInvestorType() : InvestorType.UNKNOWN;
        });
    }

    /**
     * Get country for a wallet
     */
    public Uni<String> getCountry(String walletAddress) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            return identity != null ? identity.getCountry() : null;
        });
    }

    /**
     * Update verification status
     */
    public Uni<Boolean> updateVerificationStatus(String walletAddress, VerificationStatus status) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            if (identity == null) return false;

            identity.setVerificationStatus(status);
            identity.setUpdatedAt(Instant.now());

            LOG.info("Updated verification status for {} to {}", walletAddress, status);
            return true;
        });
    }

    /**
     * Link additional wallet to existing identity
     */
    public Uni<Boolean> linkWallet(String existingWallet, String newWallet) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(existingWallet);
            if (identity == null) return false;

            identities.put(newWallet, identity);
            identityWallets.get(identity.getIdentityId()).add(newWallet);

            LOG.info("Linked wallet {} to identity {}", newWallet, identity.getIdentityId());
            return true;
        });
    }

    /**
     * Revoke identity registration
     */
    public Uni<Boolean> revokeIdentity(String walletAddress, String reason) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(walletAddress);
            if (identity == null) return false;

            identity.setVerificationStatus(VerificationStatus.REVOKED);
            identity.setRevokedAt(Instant.now());
            identity.setRevocationReason(reason);

            LOG.warn("Revoked identity for wallet {}: {}", walletAddress, reason);
            return true;
        });
    }

    /**
     * Get registry statistics
     */
    public Uni<RegistryStats> getStats() {
        return Uni.createFrom().item(() -> {
            long total = identities.size();
            long verified = identities.values().stream()
                .filter(i -> i.getVerificationStatus() == VerificationStatus.VERIFIED)
                .count();
            long pending = identities.values().stream()
                .filter(i -> i.getVerificationStatus() == VerificationStatus.PENDING)
                .count();

            Map<InvestorType, Long> byType = new HashMap<>();
            for (Identity identity : identities.values()) {
                byType.merge(identity.getInvestorType(), 1L, Long::sum);
            }

            Map<String, Long> byCountry = new HashMap<>();
            for (Identity identity : identities.values()) {
                if (identity.getCountry() != null) {
                    byCountry.merge(identity.getCountry(), 1L, Long::sum);
                }
            }

            return new RegistryStats(total, verified, pending, byType, byCountry);
        });
    }

    private String generateIdentityId(String walletAddress, IdentityRegistrationRequest request) {
        return "IDENTITY-" + walletAddress.substring(0, Math.min(8, walletAddress.length())).toUpperCase()
            + "-" + System.currentTimeMillis() % 100000;
    }

    // ========== Inner Classes ==========

    /**
     * Investor Identity
     */
    public static class Identity {
        private String identityId;
        private String walletAddress;
        private String country;
        private InvestorType investorType;
        private Map<ClaimTopic, Claim> claims;
        private VerificationStatus verificationStatus;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant revokedAt;
        private String revocationReason;

        // Builder pattern
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final Identity identity = new Identity();

            public Builder identityId(String id) { identity.identityId = id; return this; }
            public Builder walletAddress(String addr) { identity.walletAddress = addr; return this; }
            public Builder country(String country) { identity.country = country; return this; }
            public Builder investorType(InvestorType type) { identity.investorType = type; return this; }
            public Builder claims(Map<ClaimTopic, Claim> claims) { identity.claims = claims; return this; }
            public Builder verificationStatus(VerificationStatus status) { identity.verificationStatus = status; return this; }
            public Builder createdAt(Instant createdAt) { identity.createdAt = createdAt; return this; }

            public Identity build() { return identity; }
        }

        // Getters and setters
        public String getIdentityId() { return identityId; }
        public String getWalletAddress() { return walletAddress; }
        public String getCountry() { return country; }
        public InvestorType getInvestorType() { return investorType; }
        public Map<ClaimTopic, Claim> getClaims() { return claims; }
        public VerificationStatus getVerificationStatus() { return verificationStatus; }
        public void setVerificationStatus(VerificationStatus status) { this.verificationStatus = status; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
        public Instant getRevokedAt() { return revokedAt; }
        public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
        public String getRevocationReason() { return revocationReason; }
        public void setRevocationReason(String reason) { this.revocationReason = reason; }
    }

    /**
     * Claim Topics (ERC-3643 standard)
     */
    public enum ClaimTopic {
        KYC,                    // Know Your Customer verification
        AML,                    // Anti-Money Laundering check
        ACCREDITED_INVESTOR,    // Accredited investor status (US)
        QUALIFIED_INVESTOR,     // Qualified investor status (EU)
        INSTITUTIONAL,          // Institutional investor
        COUNTRY_RESIDENCE,      // Country of residence verification
        TAX_ID,                 // Tax identification
        SANCTIONS_CHECK,        // OFAC/sanctions screening
        PEP_CHECK,              // Politically Exposed Person check
        WEALTH_SOURCE           // Source of wealth verification
    }

    /**
     * Identity Claim
     */
    public record Claim(
        String claimId,
        ClaimTopic topic,
        String issuerId,
        String issuerName,
        byte[] signature,
        Map<String, Object> data,
        Instant issuedAt,
        Instant expiresAt,
        boolean valid
    ) {
        public boolean isValid() { return valid; }
        public boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }
    }

    /**
     * Investor Type Classification
     */
    public enum InvestorType {
        UNKNOWN,
        RETAIL,
        ACCREDITED,
        QUALIFIED,
        INSTITUTIONAL,
        PROFESSIONAL
    }

    /**
     * Verification Status
     */
    public enum VerificationStatus {
        PENDING,
        IN_PROGRESS,
        VERIFIED,
        REJECTED,
        REVOKED,
        EXPIRED
    }

    /**
     * Registration Request
     */
    public record IdentityRegistrationRequest(
        String country,
        InvestorType investorType,
        Map<String, String> metadata
    ) {}

    /**
     * Registry Statistics
     */
    public record RegistryStats(
        long totalIdentities,
        long verifiedIdentities,
        long pendingIdentities,
        Map<InvestorType, Long> byInvestorType,
        Map<String, Long> byCountry
    ) {}
}
