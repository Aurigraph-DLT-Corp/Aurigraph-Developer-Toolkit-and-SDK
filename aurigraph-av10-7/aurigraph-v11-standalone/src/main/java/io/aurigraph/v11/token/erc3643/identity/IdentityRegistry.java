package io.aurigraph.v11.token.erc3643.identity;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Identity Registry for ERC-3643 T-REX Security Tokens.
 *
 * Manages wallet-to-identity mappings with:
 * - Country codes (ISO 3166-1)
 * - Claim topics verification
 * - KYC/AML verification status
 * - Expiry and renewal
 * - Bulk identity management
 *
 * @see <a href="https://eips.ethereum.org/EIPS/eip-3643">EIP-3643</a>
 */
@ApplicationScoped
public class IdentityRegistry {

    // Storage maps
    private final Map<String, Identity> identities = new ConcurrentHashMap<>();
    private final Map<String, String> walletToInvestor = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> investorToWallets = new ConcurrentHashMap<>();
    private final Set<String> registryAgents = ConcurrentHashMap.newKeySet();

    // Event listeners
    private final List<IdentityEventListener> eventListeners = new CopyOnWriteArrayList<>();

    @Inject
    ClaimVerifier claimVerifier;

    // ==================== Records ====================

    /**
     * Full identity record
     */
    public record Identity(
        String investorId,
        String countryCode,
        Set<ClaimVerifier.ClaimTopic> verifiedClaims,
        VerificationStatus kycStatus,
        VerificationStatus amlStatus,
        Instant createdAt,
        Instant expiresAt,
        Instant lastUpdated,
        IdentityMetadata metadata
    ) {
        public boolean isExpired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }

        public boolean isFullyVerified() {
            return kycStatus == VerificationStatus.VERIFIED &&
                   amlStatus == VerificationStatus.VERIFIED &&
                   !isExpired();
        }
    }

    /**
     * Identity metadata record
     */
    public record IdentityMetadata(
        String legalName,
        String entityType,
        Optional<String> accreditationLevel,
        Optional<String> investorCategory,
        Map<String, String> additionalData
    ) {}

    /**
     * Registration request record
     */
    public record RegistrationRequest(
        String wallet,
        String investorId,
        String countryCode,
        Set<ClaimVerifier.ClaimTopic> claimTopics,
        IdentityMetadata metadata,
        int validityDays
    ) {}

    /**
     * Bulk registration result record
     */
    public record BulkRegistrationResult(
        int successful,
        int failed,
        List<RegistrationResult> results
    ) {}

    /**
     * Individual registration result record
     */
    public record RegistrationResult(
        String wallet,
        boolean success,
        String message
    ) {}

    /**
     * Identity update request record
     */
    public record UpdateRequest(
        String wallet,
        Optional<String> countryCode,
        Optional<Set<ClaimVerifier.ClaimTopic>> claimTopics,
        Optional<VerificationStatus> kycStatus,
        Optional<VerificationStatus> amlStatus,
        Optional<Integer> extensionDays
    ) {}

    /**
     * Identity event record
     */
    public record IdentityEvent(
        String transactionId,
        String wallet,
        String investorId,
        IdentityAction action,
        String details,
        Instant timestamp
    ) {}

    // ==================== Enums ====================

    public enum VerificationStatus {
        PENDING,
        IN_REVIEW,
        VERIFIED,
        REJECTED,
        EXPIRED,
        SUSPENDED
    }

    public enum IdentityAction {
        REGISTERED,
        UPDATED,
        RENEWED,
        REVOKED,
        SUSPENDED,
        REACTIVATED,
        CLAIM_ADDED,
        CLAIM_REMOVED,
        WALLET_LINKED,
        WALLET_UNLINKED
    }

    // ==================== Event Listener Interface ====================

    public interface IdentityEventListener {
        void onIdentityEvent(IdentityEvent event);
    }

    // ==================== Agent Management ====================

    /**
     * Add a registry agent
     */
    public void addAgent(String agent) {
        registryAgents.add(agent.toLowerCase());
        Log.infof("Registry agent added: %s", agent);
    }

    /**
     * Remove a registry agent
     */
    public void removeAgent(String agent) {
        registryAgents.remove(agent.toLowerCase());
        Log.infof("Registry agent removed: %s", agent);
    }

    /**
     * Check if address is a registry agent
     */
    public boolean isAgent(String address) {
        return registryAgents.contains(address.toLowerCase());
    }

    // ==================== Registration Functions ====================

    /**
     * Register a new identity
     */
    public Uni<Boolean> registerIdentity(String agent, RegistrationRequest request) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Registration rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = request.wallet().toLowerCase();

            // Check if wallet already registered
            if (identities.containsKey(walletLower)) {
                Log.warnf("Registration rejected: wallet already registered. wallet=%s", walletLower);
                return false;
            }

            // Verify claims through ClaimVerifier
            return true;
        }).flatMap(canProceed -> {
            if (!canProceed) return Uni.createFrom().item(false);

            return claimVerifier.verifyClaimsForWallet(request.wallet(), request.claimTopics())
                    .map(verificationResult -> {
                        if (!verificationResult.allVerified()) {
                            Log.warnf("Registration rejected: claims verification failed. wallet=%s, failures=%s",
                                    request.wallet(), verificationResult.failedClaims());
                            return false;
                        }

                        String walletLower = request.wallet().toLowerCase();
                        Instant now = Instant.now();
                        Instant expiresAt = now.plus(request.validityDays(), ChronoUnit.DAYS);

                        Identity identity = new Identity(
                                request.investorId(),
                                request.countryCode().toUpperCase(),
                                request.claimTopics(),
                                VerificationStatus.PENDING,
                                VerificationStatus.PENDING,
                                now,
                                expiresAt,
                                now,
                                request.metadata()
                        );

                        identities.put(walletLower, identity);
                        walletToInvestor.put(walletLower, request.investorId());
                        investorToWallets.computeIfAbsent(request.investorId(), k -> ConcurrentHashMap.newKeySet())
                                .add(walletLower);

                        emitEvent(new IdentityEvent(
                                generateTransactionId(),
                                walletLower,
                                request.investorId(),
                                IdentityAction.REGISTERED,
                                String.format("Country: %s, Validity: %d days", request.countryCode(), request.validityDays()),
                                now
                        ));

                        Log.infof("Identity registered: wallet=%s, investorId=%s, country=%s, expiresAt=%s",
                                walletLower, request.investorId(), request.countryCode(), expiresAt);
                        return true;
                    });
        });
    }

    /**
     * Bulk register identities
     */
    public Uni<BulkRegistrationResult> bulkRegisterIdentities(String agent, List<RegistrationRequest> requests) {
        return Multi.createFrom().iterable(requests)
                .onItem().transformToUniAndMerge(request ->
                        registerIdentity(agent, request)
                                .map(success -> new RegistrationResult(
                                        request.wallet(),
                                        success,
                                        success ? "Registered successfully" : "Registration failed"
                                ))
                )
                .collect().asList()
                .map(results -> {
                    int successful = (int) results.stream().filter(RegistrationResult::success).count();
                    int failed = results.size() - successful;
                    Log.infof("Bulk registration completed: successful=%d, failed=%d", successful, failed);
                    return new BulkRegistrationResult(successful, failed, results);
                });
    }

    // ==================== Update Functions ====================

    /**
     * Update an identity
     */
    public Uni<Boolean> updateIdentity(String agent, UpdateRequest request) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Update rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = request.wallet().toLowerCase();
            Identity existing = identities.get(walletLower);

            if (existing == null) {
                Log.warnf("Update rejected: identity not found. wallet=%s", walletLower);
                return false;
            }

            Instant now = Instant.now();
            Instant newExpiry = existing.expiresAt();
            if (request.extensionDays().isPresent()) {
                newExpiry = existing.expiresAt().plus(request.extensionDays().get(), ChronoUnit.DAYS);
            }

            Identity updated = new Identity(
                    existing.investorId(),
                    request.countryCode().orElse(existing.countryCode()),
                    request.claimTopics().orElse(existing.verifiedClaims()),
                    request.kycStatus().orElse(existing.kycStatus()),
                    request.amlStatus().orElse(existing.amlStatus()),
                    existing.createdAt(),
                    newExpiry,
                    now,
                    existing.metadata()
            );

            identities.put(walletLower, updated);

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    walletLower,
                    existing.investorId(),
                    IdentityAction.UPDATED,
                    "Identity updated",
                    now
            ));

            Log.infof("Identity updated: wallet=%s", walletLower);
            return true;
        });
    }

    /**
     * Set KYC verification status
     */
    public Uni<Boolean> setKycStatus(String agent, String wallet, VerificationStatus status) {
        return updateIdentity(agent, new UpdateRequest(
                wallet,
                Optional.empty(),
                Optional.empty(),
                Optional.of(status),
                Optional.empty(),
                Optional.empty()
        ));
    }

    /**
     * Set AML verification status
     */
    public Uni<Boolean> setAmlStatus(String agent, String wallet, VerificationStatus status) {
        return updateIdentity(agent, new UpdateRequest(
                wallet,
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.of(status),
                Optional.empty()
        ));
    }

    /**
     * Renew identity validity
     */
    public Uni<Boolean> renewIdentity(String agent, String wallet, int extensionDays) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Renewal rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            Identity existing = identities.get(walletLower);

            if (existing == null) {
                Log.warnf("Renewal rejected: identity not found. wallet=%s", walletLower);
                return false;
            }

            Instant now = Instant.now();
            Instant baseTime = existing.isExpired() ? now : existing.expiresAt();
            Instant newExpiry = baseTime.plus(extensionDays, ChronoUnit.DAYS);

            Identity renewed = new Identity(
                    existing.investorId(),
                    existing.countryCode(),
                    existing.verifiedClaims(),
                    existing.kycStatus() == VerificationStatus.EXPIRED ? VerificationStatus.VERIFIED : existing.kycStatus(),
                    existing.amlStatus() == VerificationStatus.EXPIRED ? VerificationStatus.VERIFIED : existing.amlStatus(),
                    existing.createdAt(),
                    newExpiry,
                    now,
                    existing.metadata()
            );

            identities.put(walletLower, renewed);

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    walletLower,
                    existing.investorId(),
                    IdentityAction.RENEWED,
                    String.format("Extended by %d days, new expiry: %s", extensionDays, newExpiry),
                    now
            ));

            Log.infof("Identity renewed: wallet=%s, newExpiry=%s", walletLower, newExpiry);
            return true;
        });
    }

    // ==================== Revocation Functions ====================

    /**
     * Revoke an identity
     */
    public Uni<Boolean> revokeIdentity(String agent, String wallet, String reason) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Revocation rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            Identity existing = identities.get(walletLower);

            if (existing == null) {
                Log.warnf("Revocation rejected: identity not found. wallet=%s", walletLower);
                return false;
            }

            // Remove identity
            identities.remove(walletLower);
            String investorId = walletToInvestor.remove(walletLower);
            if (investorId != null) {
                Set<String> wallets = investorToWallets.get(investorId);
                if (wallets != null) {
                    wallets.remove(walletLower);
                    if (wallets.isEmpty()) {
                        investorToWallets.remove(investorId);
                    }
                }
            }

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    walletLower,
                    existing.investorId(),
                    IdentityAction.REVOKED,
                    reason,
                    Instant.now()
            ));

            Log.infof("Identity revoked: wallet=%s, reason=%s", walletLower, reason);
            return true;
        });
    }

    /**
     * Suspend an identity temporarily
     */
    public Uni<Boolean> suspendIdentity(String agent, String wallet, String reason) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Suspension rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            Identity existing = identities.get(walletLower);

            if (existing == null) {
                Log.warnf("Suspension rejected: identity not found. wallet=%s", walletLower);
                return false;
            }

            Identity suspended = new Identity(
                    existing.investorId(),
                    existing.countryCode(),
                    existing.verifiedClaims(),
                    VerificationStatus.SUSPENDED,
                    VerificationStatus.SUSPENDED,
                    existing.createdAt(),
                    existing.expiresAt(),
                    Instant.now(),
                    existing.metadata()
            );

            identities.put(walletLower, suspended);

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    walletLower,
                    existing.investorId(),
                    IdentityAction.SUSPENDED,
                    reason,
                    Instant.now()
            ));

            Log.infof("Identity suspended: wallet=%s, reason=%s", walletLower, reason);
            return true;
        });
    }

    /**
     * Reactivate a suspended identity
     */
    public Uni<Boolean> reactivateIdentity(String agent, String wallet) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Reactivation rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            Identity existing = identities.get(walletLower);

            if (existing == null) {
                Log.warnf("Reactivation rejected: identity not found. wallet=%s", walletLower);
                return false;
            }

            if (existing.kycStatus() != VerificationStatus.SUSPENDED) {
                Log.warnf("Reactivation rejected: identity is not suspended. wallet=%s, status=%s",
                        walletLower, existing.kycStatus());
                return false;
            }

            Identity reactivated = new Identity(
                    existing.investorId(),
                    existing.countryCode(),
                    existing.verifiedClaims(),
                    VerificationStatus.VERIFIED,
                    VerificationStatus.VERIFIED,
                    existing.createdAt(),
                    existing.expiresAt(),
                    Instant.now(),
                    existing.metadata()
            );

            identities.put(walletLower, reactivated);

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    walletLower,
                    existing.investorId(),
                    IdentityAction.REACTIVATED,
                    "Identity reactivated",
                    Instant.now()
            ));

            Log.infof("Identity reactivated: wallet=%s", walletLower);
            return true;
        });
    }

    // ==================== Wallet Linking ====================

    /**
     * Link additional wallet to existing investor
     */
    public Uni<Boolean> linkWallet(String agent, String existingWallet, String newWallet) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Wallet linking rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String existingLower = existingWallet.toLowerCase();
            String newLower = newWallet.toLowerCase();

            Identity existing = identities.get(existingLower);
            if (existing == null) {
                Log.warnf("Wallet linking rejected: existing wallet identity not found. wallet=%s", existingLower);
                return false;
            }

            if (identities.containsKey(newLower)) {
                Log.warnf("Wallet linking rejected: new wallet already registered. wallet=%s", newLower);
                return false;
            }

            // Create identity for new wallet with same investor ID
            Identity newIdentity = new Identity(
                    existing.investorId(),
                    existing.countryCode(),
                    existing.verifiedClaims(),
                    existing.kycStatus(),
                    existing.amlStatus(),
                    Instant.now(),
                    existing.expiresAt(),
                    Instant.now(),
                    existing.metadata()
            );

            identities.put(newLower, newIdentity);
            walletToInvestor.put(newLower, existing.investorId());
            investorToWallets.get(existing.investorId()).add(newLower);

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    newLower,
                    existing.investorId(),
                    IdentityAction.WALLET_LINKED,
                    String.format("Linked to existing wallet: %s", existingLower),
                    Instant.now()
            ));

            Log.infof("Wallet linked: newWallet=%s, existingWallet=%s, investorId=%s",
                    newLower, existingLower, existing.investorId());
            return true;
        });
    }

    /**
     * Unlink a wallet from an investor
     */
    public Uni<Boolean> unlinkWallet(String agent, String wallet) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Wallet unlinking rejected: caller is not a registry agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            Identity existing = identities.get(walletLower);

            if (existing == null) {
                Log.warnf("Wallet unlinking rejected: wallet not found. wallet=%s", walletLower);
                return false;
            }

            String investorId = existing.investorId();
            Set<String> wallets = investorToWallets.get(investorId);

            if (wallets != null && wallets.size() == 1) {
                Log.warnf("Wallet unlinking rejected: cannot unlink last wallet for investor. wallet=%s, investorId=%s",
                        walletLower, investorId);
                return false;
            }

            identities.remove(walletLower);
            walletToInvestor.remove(walletLower);
            if (wallets != null) {
                wallets.remove(walletLower);
            }

            emitEvent(new IdentityEvent(
                    generateTransactionId(),
                    walletLower,
                    investorId,
                    IdentityAction.WALLET_UNLINKED,
                    "Wallet unlinked from investor",
                    Instant.now()
            ));

            Log.infof("Wallet unlinked: wallet=%s, investorId=%s", walletLower, investorId);
            return true;
        });
    }

    // ==================== Query Functions ====================

    /**
     * Check if a wallet is verified for transfers
     */
    public Uni<Boolean> isVerified(String wallet) {
        return Uni.createFrom().item(() -> {
            String walletLower = wallet.toLowerCase();
            Identity identity = identities.get(walletLower);

            if (identity == null) {
                Log.debugf("Verification check: wallet not registered. wallet=%s", walletLower);
                return false;
            }

            boolean verified = identity.isFullyVerified();
            Log.debugf("Verification check: wallet=%s, verified=%s, kyc=%s, aml=%s, expired=%s",
                    walletLower, verified, identity.kycStatus(), identity.amlStatus(), identity.isExpired());
            return verified;
        });
    }

    /**
     * Get identity for a wallet
     */
    public Uni<Optional<Identity>> getIdentity(String wallet) {
        return Uni.createFrom().item(() ->
                Optional.ofNullable(identities.get(wallet.toLowerCase()))
        );
    }

    /**
     * Get country code for a wallet
     */
    public Uni<String> getCountryCode(String wallet) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(wallet.toLowerCase());
            return identity != null ? identity.countryCode() : null;
        });
    }

    /**
     * Get investor ID for a wallet
     */
    public Uni<String> getInvestorId(String wallet) {
        return Uni.createFrom().item(() ->
                walletToInvestor.get(wallet.toLowerCase())
        );
    }

    /**
     * Get all wallets for an investor
     */
    public Uni<Set<String>> getInvestorWallets(String investorId) {
        return Uni.createFrom().item(() ->
                Set.copyOf(investorToWallets.getOrDefault(investorId, Set.of()))
        );
    }

    /**
     * Check if wallet has specific claim
     */
    public Uni<Boolean> hasClaim(String wallet, ClaimVerifier.ClaimTopic claim) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(wallet.toLowerCase());
            return identity != null && identity.verifiedClaims().contains(claim);
        });
    }

    /**
     * Get verified claims for a wallet
     */
    public Uni<Set<ClaimVerifier.ClaimTopic>> getVerifiedClaims(String wallet) {
        return Uni.createFrom().item(() -> {
            Identity identity = identities.get(wallet.toLowerCase());
            return identity != null ? Set.copyOf(identity.verifiedClaims()) : Set.of();
        });
    }

    /**
     * Check if wallets belong to same investor
     */
    public Uni<Boolean> isSameInvestor(String wallet1, String wallet2) {
        return Uni.createFrom().item(() -> {
            String investorId1 = walletToInvestor.get(wallet1.toLowerCase());
            String investorId2 = walletToInvestor.get(wallet2.toLowerCase());
            return investorId1 != null && investorId1.equals(investorId2);
        });
    }

    /**
     * Get all registered wallets count
     */
    public int getRegisteredWalletsCount() {
        return identities.size();
    }

    /**
     * Get all registered investors count
     */
    public int getRegisteredInvestorsCount() {
        return investorToWallets.size();
    }

    /**
     * Get wallets by country
     */
    public Uni<List<String>> getWalletsByCountry(String countryCode) {
        return Uni.createFrom().item(() ->
                identities.entrySet().stream()
                        .filter(e -> e.getValue().countryCode().equalsIgnoreCase(countryCode))
                        .map(Map.Entry::getKey)
                        .toList()
        );
    }

    /**
     * Get expired identities
     */
    public Uni<List<String>> getExpiredIdentities() {
        return Uni.createFrom().item(() ->
                identities.entrySet().stream()
                        .filter(e -> e.getValue().isExpired())
                        .map(Map.Entry::getKey)
                        .toList()
        );
    }

    // ==================== Event Management ====================

    /**
     * Register an event listener
     */
    public void addEventListener(IdentityEventListener listener) {
        eventListeners.add(listener);
        Log.debugf("Identity event listener added: %s", listener.getClass().getSimpleName());
    }

    /**
     * Remove an event listener
     */
    public void removeEventListener(IdentityEventListener listener) {
        eventListeners.remove(listener);
        Log.debugf("Identity event listener removed: %s", listener.getClass().getSimpleName());
    }

    private void emitEvent(IdentityEvent event) {
        for (IdentityEventListener listener : eventListeners) {
            try {
                listener.onIdentityEvent(event);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying identity event listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    private String generateTransactionId() {
        return "id-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }
}
