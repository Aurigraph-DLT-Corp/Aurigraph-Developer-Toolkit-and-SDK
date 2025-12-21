package io.aurigraph.v11.rwa.erc3643;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Identity Registry for ERC-3643 Security Tokens
 *
 * Implements on-chain identity storage for compliant security token transfers.
 * Links wallet addresses to verified identities and manages KYC/AML status.
 *
 * Key Features:
 * - On-chain identity storage with ONCHAINID compatibility
 * - Link wallet addresses to verified identities
 * - Country/jurisdiction tracking
 * - KYC status management
 * - Identity update and revocation
 * - Multi-address per identity support
 * - Investor classification (accredited, retail, institutional)
 *
 * @author Aurigraph V11 - Frontend Development Agent
 * @version 11.0.0
 * @sprint Sprint 3 - RWA Token Standards
 * @see <a href="https://eips.ethereum.org/EIPS/eip-3643">EIP-3643</a>
 */
@ApplicationScoped
public class IdentityRegistry {

    @Inject
    ClaimVerifier claimVerifier;

    // Core storage maps
    private final Map<String, Identity> identities = new ConcurrentHashMap<>();
    private final Map<String, String> addressToIdentity = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> identityToAddresses = new ConcurrentHashMap<>();
    private final Map<String, InvestorClassification> addressClassifications = new ConcurrentHashMap<>();
    private final Set<String> registryAgents = ConcurrentHashMap.newKeySet();
    private String registryOwner;

    /**
     * Identity record - represents a verified identity in the registry
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Identity {
        private String identityId;
        private String countryCode;           // ISO 3166-1 alpha-2
        private String jurisdiction;          // Specific regulatory jurisdiction
        private VerificationStatus kycStatus;
        private VerificationStatus amlStatus;
        private InvestorType investorType;
        private AccreditationStatus accreditationStatus;
        private Instant verifiedAt;
        private Instant expiresAt;
        private Instant lastUpdated;
        private String verificationProvider;
        private String verificationHash;      // Hash of verification documents
        private Set<String> linkedAddresses;
        private Map<String, Object> additionalData;
        private boolean active;
    }

    /**
     * Verification status for KYC/AML
     */
    public enum VerificationStatus {
        NOT_VERIFIED,
        PENDING,
        VERIFIED,
        EXPIRED,
        REJECTED,
        SUSPENDED
    }

    /**
     * Investor type classification
     */
    public enum InvestorType {
        RETAIL,              // Individual retail investor
        ACCREDITED,          // Accredited individual investor
        QUALIFIED,           // Qualified purchaser
        INSTITUTIONAL,       // Institutional investor
        SOVEREIGN,           // Sovereign wealth fund
        EXEMPT               // Exempt under regulation
    }

    /**
     * Accreditation status for investor classification
     */
    public enum AccreditationStatus {
        NOT_APPLICABLE,
        PENDING_VERIFICATION,
        ACCREDITED,
        NOT_ACCREDITED,
        EXPIRED
    }

    /**
     * Investor classification with jurisdiction-specific details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvestorClassification {
        private InvestorType type;
        private AccreditationStatus accreditationStatus;
        private String jurisdiction;
        private BigDecimalWrapper netWorth;
        private BigDecimalWrapper annualIncome;
        private boolean professionalClient;
        private Instant verifiedAt;
        private Instant expiresAt;
    }

    /**
     * Wrapper for BigDecimal to work with Lombok
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BigDecimalWrapper {
        private java.math.BigDecimal value;
    }

    /**
     * Identity registration request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IdentityRegistrationRequest {
        private String walletAddress;
        private String countryCode;
        private String jurisdiction;
        private InvestorType investorType;
        private String verificationProvider;
        private String verificationHash;
        private Map<String, Object> additionalData;
    }

    /**
     * Initialize the registry with an owner
     *
     * @param owner Address of the registry owner
     */
    public void initialize(String owner) {
        this.registryOwner = owner;
        this.registryAgents.add(owner);
        Log.infof("Identity Registry initialized with owner: %s", owner);
    }

    /**
     * Register a new identity in the registry
     *
     * @param request Registration request details
     * @param callerAddress Address of the agent performing registration
     * @return Uni containing the identity ID
     */
    public Uni<String> registerIdentity(IdentityRegistrationRequest request, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);

            String identityId = generateIdentityId(request.getWalletAddress());

            // Check if address already registered
            if (addressToIdentity.containsKey(request.getWalletAddress())) {
                throw new IdentityAlreadyExistsException(
                    "Address already linked to identity: " + addressToIdentity.get(request.getWalletAddress())
                );
            }

            Identity identity = Identity.builder()
                    .identityId(identityId)
                    .countryCode(request.getCountryCode())
                    .jurisdiction(request.getJurisdiction())
                    .kycStatus(VerificationStatus.PENDING)
                    .amlStatus(VerificationStatus.PENDING)
                    .investorType(request.getInvestorType())
                    .accreditationStatus(AccreditationStatus.PENDING_VERIFICATION)
                    .verifiedAt(null)
                    .expiresAt(null)
                    .lastUpdated(Instant.now())
                    .verificationProvider(request.getVerificationProvider())
                    .verificationHash(request.getVerificationHash())
                    .linkedAddresses(new HashSet<>(Collections.singletonList(request.getWalletAddress())))
                    .additionalData(request.getAdditionalData() != null ?
                                   request.getAdditionalData() : new HashMap<>())
                    .active(true)
                    .build();

            identities.put(identityId, identity);
            addressToIdentity.put(request.getWalletAddress(), identityId);
            identityToAddresses.put(identityId, new HashSet<>(Collections.singletonList(request.getWalletAddress())));

            Log.infof("Registered new identity: %s for address: %s in jurisdiction: %s",
                     identityId, request.getWalletAddress(), request.getJurisdiction());

            return identityId;
        });
    }

    /**
     * Update KYC verification status
     *
     * @param identityId Identity to update
     * @param status New KYC status
     * @param callerAddress Agent address
     * @param expirationDate Verification expiration date
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> updateKYCStatus(
            String identityId,
            VerificationStatus status,
            String callerAddress,
            Instant expirationDate
    ) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            Identity identity = getIdentityOrThrow(identityId);

            identity.setKycStatus(status);
            if (status == VerificationStatus.VERIFIED) {
                identity.setVerifiedAt(Instant.now());
                identity.setExpiresAt(expirationDate);
            }
            identity.setLastUpdated(Instant.now());

            Log.infof("Updated KYC status for identity %s to %s", identityId, status);
            return true;
        });
    }

    /**
     * Update AML screening status
     *
     * @param identityId Identity to update
     * @param status New AML status
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> updateAMLStatus(String identityId, VerificationStatus status, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            Identity identity = getIdentityOrThrow(identityId);

            identity.setAmlStatus(status);
            identity.setLastUpdated(Instant.now());

            Log.infof("Updated AML status for identity %s to %s", identityId, status);
            return true;
        });
    }

    /**
     * Update investor classification/accreditation
     *
     * @param identityId Identity to update
     * @param classification New classification
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> updateInvestorClassification(
            String identityId,
            InvestorClassification classification,
            String callerAddress
    ) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            Identity identity = getIdentityOrThrow(identityId);

            identity.setInvestorType(classification.getType());
            identity.setAccreditationStatus(classification.getAccreditationStatus());
            identity.setLastUpdated(Instant.now());

            // Store detailed classification for each linked address
            for (String address : identity.getLinkedAddresses()) {
                addressClassifications.put(address, classification);
            }

            Log.infof("Updated investor classification for identity %s: type=%s, accreditation=%s",
                     identityId, classification.getType(), classification.getAccreditationStatus());
            return true;
        });
    }

    /**
     * Link an additional address to an existing identity
     *
     * @param identityId Identity to link to
     * @param newAddress New address to link
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> linkAddress(String identityId, String newAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);

            if (addressToIdentity.containsKey(newAddress)) {
                throw new IdentityAlreadyExistsException("Address already linked to another identity");
            }

            Identity identity = getIdentityOrThrow(identityId);

            identity.getLinkedAddresses().add(newAddress);
            addressToIdentity.put(newAddress, identityId);
            identityToAddresses.get(identityId).add(newAddress);
            identity.setLastUpdated(Instant.now());

            // Copy classification if exists
            String primaryAddress = identity.getLinkedAddresses().iterator().next();
            InvestorClassification classification = addressClassifications.get(primaryAddress);
            if (classification != null) {
                addressClassifications.put(newAddress, classification);
            }

            Log.infof("Linked new address %s to identity %s", newAddress, identityId);
            return true;
        });
    }

    /**
     * Unlink an address from an identity
     *
     * @param identityId Identity to unlink from
     * @param addressToUnlink Address to remove
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> unlinkAddress(String identityId, String addressToUnlink, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            Identity identity = getIdentityOrThrow(identityId);

            if (identity.getLinkedAddresses().size() <= 1) {
                throw new IllegalStateException("Cannot unlink last address from identity");
            }

            if (!identity.getLinkedAddresses().contains(addressToUnlink)) {
                throw new IllegalArgumentException("Address not linked to this identity");
            }

            identity.getLinkedAddresses().remove(addressToUnlink);
            addressToIdentity.remove(addressToUnlink);
            identityToAddresses.get(identityId).remove(addressToUnlink);
            addressClassifications.remove(addressToUnlink);
            identity.setLastUpdated(Instant.now());

            Log.infof("Unlinked address %s from identity %s", addressToUnlink, identityId);
            return true;
        });
    }

    /**
     * Revoke an identity (mark as inactive)
     *
     * @param identityId Identity to revoke
     * @param callerAddress Agent address
     * @param reason Reason for revocation
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> revokeIdentity(String identityId, String callerAddress, String reason) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            Identity identity = getIdentityOrThrow(identityId);

            identity.setActive(false);
            identity.setKycStatus(VerificationStatus.SUSPENDED);
            identity.setAmlStatus(VerificationStatus.SUSPENDED);
            identity.setLastUpdated(Instant.now());
            identity.getAdditionalData().put("revocationReason", reason);
            identity.getAdditionalData().put("revokedAt", Instant.now().toString());
            identity.getAdditionalData().put("revokedBy", callerAddress);

            Log.warnf("IDENTITY REVOKED: %s by %s. Reason: %s", identityId, callerAddress, reason);
            return true;
        });
    }

    /**
     * Reinstate a revoked identity
     *
     * @param identityId Identity to reinstate
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> reinstateIdentity(String identityId, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateAgent(callerAddress);
            Identity identity = getIdentityOrThrow(identityId);

            identity.setActive(true);
            identity.setKycStatus(VerificationStatus.PENDING);
            identity.setAmlStatus(VerificationStatus.PENDING);
            identity.setLastUpdated(Instant.now());
            identity.getAdditionalData().put("reinstatedAt", Instant.now().toString());
            identity.getAdditionalData().put("reinstatedBy", callerAddress);

            Log.infof("Identity reinstated: %s by %s", identityId, callerAddress);
            return true;
        });
    }

    /**
     * Check if an address has a verified identity
     *
     * @param address Wallet address to check
     * @return Uni<Boolean> verification status
     */
    public Uni<Boolean> isVerified(String address) {
        return Uni.createFrom().item(() -> {
            String identityId = addressToIdentity.get(address);
            if (identityId == null) {
                return false;
            }

            Identity identity = identities.get(identityId);
            if (identity == null || !identity.isActive()) {
                return false;
            }

            // Check KYC status
            if (identity.getKycStatus() != VerificationStatus.VERIFIED) {
                return false;
            }

            // Check if verification is expired
            if (identity.getExpiresAt() != null && Instant.now().isAfter(identity.getExpiresAt())) {
                return false;
            }

            // Check AML status is not rejected/suspended
            if (identity.getAmlStatus() == VerificationStatus.REJECTED ||
                identity.getAmlStatus() == VerificationStatus.SUSPENDED) {
                return false;
            }

            return true;
        });
    }

    /**
     * Get the identity ID linked to an address
     *
     * @param address Wallet address
     * @return Uni<String> identity ID or null
     */
    public Uni<String> getIdentityId(String address) {
        return Uni.createFrom().item(() -> addressToIdentity.get(address));
    }

    /**
     * Get full identity details
     *
     * @param identityId Identity ID
     * @return Uni<Identity> identity details
     */
    public Uni<Identity> getIdentity(String identityId) {
        return Uni.createFrom().item(() -> identities.get(identityId));
    }

    /**
     * Get identity by wallet address
     *
     * @param address Wallet address
     * @return Uni<Identity> identity details or null
     */
    public Uni<Identity> getIdentityByAddress(String address) {
        return Uni.createFrom().item(() -> {
            String identityId = addressToIdentity.get(address);
            return identityId != null ? identities.get(identityId) : null;
        });
    }

    /**
     * Get all addresses linked to an identity
     *
     * @param identityId Identity ID
     * @return Uni<Set<String>> set of linked addresses
     */
    public Uni<Set<String>> getLinkedAddresses(String identityId) {
        return Uni.createFrom().item(() -> {
            Set<String> addresses = identityToAddresses.get(identityId);
            return addresses != null ? new HashSet<>(addresses) : Collections.emptySet();
        });
    }

    /**
     * Get country code for an address
     *
     * @param address Wallet address
     * @return Uni<String> country code or null
     */
    public Uni<String> getCountryCode(String address) {
        return getIdentityByAddress(address)
                .map(identity -> identity != null ? identity.getCountryCode() : null);
    }

    /**
     * Get investor type for an address
     *
     * @param address Wallet address
     * @return Uni<InvestorType> investor type or null
     */
    public Uni<InvestorType> getInvestorType(String address) {
        return getIdentityByAddress(address)
                .map(identity -> identity != null ? identity.getInvestorType() : null);
    }

    /**
     * Check if address is from a specific country
     *
     * @param address Wallet address
     * @param countryCode ISO country code to check
     * @return Uni<Boolean> whether address is from that country
     */
    public Uni<Boolean> isFromCountry(String address, String countryCode) {
        return getCountryCode(address)
                .map(code -> code != null && code.equalsIgnoreCase(countryCode));
    }

    /**
     * Check if address is accredited investor
     *
     * @param address Wallet address
     * @return Uni<Boolean> accreditation status
     */
    public Uni<Boolean> isAccreditedInvestor(String address) {
        return getIdentityByAddress(address)
                .map(identity -> identity != null &&
                     (identity.getInvestorType() == InvestorType.ACCREDITED ||
                      identity.getInvestorType() == InvestorType.QUALIFIED ||
                      identity.getInvestorType() == InvestorType.INSTITUTIONAL ||
                      identity.getAccreditationStatus() == AccreditationStatus.ACCREDITED));
    }

    /**
     * Get all verified identities in a jurisdiction
     *
     * @param jurisdiction Jurisdiction to filter by
     * @return Uni<List<Identity>> list of verified identities
     */
    public Uni<List<Identity>> getVerifiedIdentitiesInJurisdiction(String jurisdiction) {
        return Uni.createFrom().item(() ->
            identities.values().stream()
                .filter(i -> i.isActive() &&
                            i.getKycStatus() == VerificationStatus.VERIFIED &&
                            jurisdiction.equalsIgnoreCase(i.getJurisdiction()))
                .collect(Collectors.toList())
        );
    }

    /**
     * Get count of verified investors by country
     *
     * @return Uni<Map<String, Long>> country code to count mapping
     */
    public Uni<Map<String, Long>> getInvestorCountByCountry() {
        return Uni.createFrom().item(() ->
            identities.values().stream()
                .filter(i -> i.isActive() && i.getKycStatus() == VerificationStatus.VERIFIED)
                .collect(Collectors.groupingBy(Identity::getCountryCode, Collectors.counting()))
        );
    }

    /**
     * Add an agent to the registry
     *
     * @param agentAddress Agent address to add
     * @param callerAddress Owner address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> addAgent(String agentAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateOwner(callerAddress);
            registryAgents.add(agentAddress);
            Log.infof("Agent added to identity registry: %s", agentAddress);
            return true;
        });
    }

    /**
     * Remove an agent from the registry
     *
     * @param agentAddress Agent address to remove
     * @param callerAddress Owner address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> removeAgent(String agentAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            validateOwner(callerAddress);
            if (agentAddress.equals(registryOwner)) {
                throw new IllegalArgumentException("Cannot remove owner from agents");
            }
            registryAgents.remove(agentAddress);
            Log.infof("Agent removed from identity registry: %s", agentAddress);
            return true;
        });
    }

    /**
     * Check if address is a registry agent
     *
     * @param address Address to check
     * @return Uni<Boolean> agent status
     */
    public Uni<Boolean> isAgent(String address) {
        return Uni.createFrom().item(() -> registryAgents.contains(address));
    }

    // ============== Private Helper Methods ==============

    private void validateAgent(String callerAddress) {
        if (!registryAgents.contains(callerAddress)) {
            throw new UnauthorizedAgentException("Caller is not an authorized registry agent");
        }
    }

    private void validateOwner(String callerAddress) {
        if (!callerAddress.equals(registryOwner)) {
            throw new UnauthorizedAgentException("Caller is not the registry owner");
        }
    }

    private Identity getIdentityOrThrow(String identityId) {
        Identity identity = identities.get(identityId);
        if (identity == null) {
            throw new IdentityNotFoundException("Identity not found: " + identityId);
        }
        return identity;
    }

    private String generateIdentityId(String address) {
        return "IDENTITY-" + address.substring(0, Math.min(8, address.length())).toUpperCase() +
               "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ============== Custom Exceptions ==============

    public static class IdentityNotFoundException extends RuntimeException {
        public IdentityNotFoundException(String message) {
            super(message);
        }
    }

    public static class IdentityAlreadyExistsException extends RuntimeException {
        public IdentityAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedAgentException extends RuntimeException {
        public UnauthorizedAgentException(String message) {
            super(message);
        }
    }
}
