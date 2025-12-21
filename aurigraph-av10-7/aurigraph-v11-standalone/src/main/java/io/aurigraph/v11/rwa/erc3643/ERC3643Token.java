package io.aurigraph.v11.rwa.erc3643;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ERC-3643 (T-REX) Security Token Implementation
 *
 * Full implementation of ERC-3643 standard for compliant security tokens.
 * Provides transfer restrictions based on identity claims, compliance checks,
 * and regulatory controls.
 *
 * Key Features:
 * - Transfer restrictions based on identity verification
 * - Compliance check before every transfer
 * - Forced transfer capability for regulators
 * - Freeze/unfreeze functionality
 * - Recovery mechanism for lost tokens
 * - On-chain identity registry integration
 * - Claim-based access control
 *
 * @author Aurigraph V11 - Frontend Development Agent
 * @version 11.0.0
 * @sprint Sprint 3 - RWA Token Standards
 * @see <a href="https://eips.ethereum.org/EIPS/eip-3643">EIP-3643</a>
 */
@ApplicationScoped
public class ERC3643Token {

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ClaimVerifier claimVerifier;

    @Inject
    ComplianceRulesEngine complianceRulesEngine;

    // Token state storage
    private final Map<String, TokenState> tokens = new ConcurrentHashMap<>();
    private final Map<String, Map<String, BigDecimal>> balances = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Map<String, BigDecimal>>> allowances = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> frozenAddresses = new ConcurrentHashMap<>();
    private final Map<String, Boolean> pausedTokens = new ConcurrentHashMap<>();

    /**
     * Token State - holds all metadata for an ERC-3643 token
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenState {
        private String tokenId;
        private String name;
        private String symbol;
        private int decimals;
        private BigDecimal totalSupply;
        private String issuer;
        private String complianceContract;
        private String identityRegistryAddress;
        private Set<String> agents;
        private Instant createdAt;
        private Instant updatedAt;
        private boolean paused;
        private String jurisdiction;
        private String assetType;
        private Map<String, Object> metadata;
    }

    /**
     * Transfer Event - emitted on successful transfers
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransferEvent {
        private String tokenId;
        private String from;
        private String to;
        private BigDecimal amount;
        private String transactionId;
        private Instant timestamp;
        private TransferType type;
        private String initiatedBy;
        private String reason;
    }

    /**
     * Transfer types for ERC-3643 compliance
     */
    public enum TransferType {
        STANDARD,          // Normal transfer between holders
        FORCED,            // Regulator-forced transfer
        RECOVERY,          // Token recovery for lost keys
        MINT,              // New token issuance
        BURN,              // Token destruction
        REDEMPTION         // Token redemption
    }

    /**
     * Deploy a new ERC-3643 compliant security token
     *
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals Token decimals (typically 18)
     * @param issuer Address of the token issuer
     * @param identityRegistryAddress Address of the identity registry
     * @param complianceAddress Address of the compliance contract
     * @param jurisdiction Jurisdiction for regulatory compliance
     * @param assetType Type of underlying asset
     * @return Uni containing the deployed token ID
     */
    public Uni<String> deployToken(
            String name,
            String symbol,
            int decimals,
            String issuer,
            String identityRegistryAddress,
            String complianceAddress,
            String jurisdiction,
            String assetType
    ) {
        return Uni.createFrom().item(() -> {
            String tokenId = generateTokenId(name, symbol);

            Log.infof("Deploying ERC-3643 token: %s (%s) by issuer %s", name, symbol, issuer);

            TokenState state = TokenState.builder()
                    .tokenId(tokenId)
                    .name(name)
                    .symbol(symbol)
                    .decimals(decimals)
                    .totalSupply(BigDecimal.ZERO)
                    .issuer(issuer)
                    .complianceContract(complianceAddress)
                    .identityRegistryAddress(identityRegistryAddress)
                    .agents(new HashSet<>(Collections.singletonList(issuer)))
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .paused(false)
                    .jurisdiction(jurisdiction)
                    .assetType(assetType)
                    .metadata(new HashMap<>())
                    .build();

            tokens.put(tokenId, state);
            balances.put(tokenId, new ConcurrentHashMap<>());
            allowances.put(tokenId, new ConcurrentHashMap<>());
            frozenAddresses.put(tokenId, ConcurrentHashMap.newKeySet());
            pausedTokens.put(tokenId, false);

            Log.infof("ERC-3643 token deployed successfully: %s", tokenId);
            return tokenId;
        });
    }

    /**
     * Mint new tokens to an address after compliance verification
     *
     * @param tokenId Token identifier
     * @param to Recipient address
     * @param amount Amount to mint
     * @param callerAddress Address of the caller (must be agent)
     * @return Uni containing transfer event
     */
    public Uni<TransferEvent> mint(String tokenId, String to, BigDecimal amount, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            // Verify caller is an agent
            if (!state.getAgents().contains(callerAddress)) {
                throw new SecurityException("Only agents can mint tokens");
            }

            // Verify recipient has verified identity
            if (!identityRegistry.isVerified(to).await().indefinitely()) {
                throw new ComplianceException("Recipient identity not verified in identity registry");
            }

            // Verify recipient passes compliance checks
            if (!complianceRulesEngine.canReceive(tokenId, to, amount).await().indefinitely()) {
                throw new ComplianceException("Recipient fails compliance requirements");
            }

            // Mint tokens
            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal currentBalance = tokenBalances.getOrDefault(to, BigDecimal.ZERO);
            tokenBalances.put(to, currentBalance.add(amount));

            // Update total supply
            state.setTotalSupply(state.getTotalSupply().add(amount));
            state.setUpdatedAt(Instant.now());

            TransferEvent event = TransferEvent.builder()
                    .tokenId(tokenId)
                    .from("0x0")
                    .to(to)
                    .amount(amount)
                    .transactionId(generateTransactionId())
                    .timestamp(Instant.now())
                    .type(TransferType.MINT)
                    .initiatedBy(callerAddress)
                    .reason("Token minting")
                    .build();

            Log.infof("Minted %s tokens to %s for token %s", amount, to, tokenId);
            return event;
        });
    }

    /**
     * Burn tokens from an address
     *
     * @param tokenId Token identifier
     * @param from Address to burn from
     * @param amount Amount to burn
     * @param callerAddress Address of the caller
     * @return Uni containing transfer event
     */
    public Uni<TransferEvent> burn(String tokenId, String from, BigDecimal amount, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            // Only the token holder or an agent can burn
            boolean isAgent = state.getAgents().contains(callerAddress);
            boolean isOwner = callerAddress.equals(from);

            if (!isAgent && !isOwner) {
                throw new SecurityException("Only token holder or agents can burn tokens");
            }

            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal currentBalance = tokenBalances.getOrDefault(from, BigDecimal.ZERO);

            if (currentBalance.compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient balance to burn");
            }

            tokenBalances.put(from, currentBalance.subtract(amount));
            state.setTotalSupply(state.getTotalSupply().subtract(amount));
            state.setUpdatedAt(Instant.now());

            TransferEvent event = TransferEvent.builder()
                    .tokenId(tokenId)
                    .from(from)
                    .to("0x0")
                    .amount(amount)
                    .transactionId(generateTransactionId())
                    .timestamp(Instant.now())
                    .type(TransferType.BURN)
                    .initiatedBy(callerAddress)
                    .reason("Token burning")
                    .build();

            Log.infof("Burned %s tokens from %s for token %s", amount, from, tokenId);
            return event;
        });
    }

    /**
     * Transfer tokens with full compliance checks
     *
     * @param tokenId Token identifier
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return Uni containing transfer event
     */
    public Uni<TransferEvent> transfer(String tokenId, String from, String to, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            // Pre-transfer compliance check
            validateTransfer(tokenId, from, to, amount);

            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal senderBalance = tokenBalances.getOrDefault(from, BigDecimal.ZERO);

            if (senderBalance.compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient balance for transfer");
            }

            // Execute transfer
            tokenBalances.put(from, senderBalance.subtract(amount));
            BigDecimal recipientBalance = tokenBalances.getOrDefault(to, BigDecimal.ZERO);
            tokenBalances.put(to, recipientBalance.add(amount));

            TokenState state = tokens.get(tokenId);
            state.setUpdatedAt(Instant.now());

            TransferEvent event = TransferEvent.builder()
                    .tokenId(tokenId)
                    .from(from)
                    .to(to)
                    .amount(amount)
                    .transactionId(generateTransactionId())
                    .timestamp(Instant.now())
                    .type(TransferType.STANDARD)
                    .initiatedBy(from)
                    .reason("Standard transfer")
                    .build();

            Log.infof("Transferred %s tokens from %s to %s for token %s", amount, from, to, tokenId);
            return event;
        });
    }

    /**
     * Forced transfer by regulator/agent for compliance enforcement
     *
     * @param tokenId Token identifier
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     * @param callerAddress Agent/regulator address
     * @param reason Reason for forced transfer
     * @return Uni containing transfer event
     */
    public Uni<TransferEvent> forcedTransfer(
            String tokenId,
            String from,
            String to,
            BigDecimal amount,
            String callerAddress,
            String reason
    ) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            // Only agents can perform forced transfers
            if (!state.getAgents().contains(callerAddress)) {
                throw new SecurityException("Only agents can perform forced transfers");
            }

            // Verify recipient identity (but skip sender check for forced transfers)
            if (!identityRegistry.isVerified(to).await().indefinitely()) {
                throw new ComplianceException("Recipient identity not verified");
            }

            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal senderBalance = tokenBalances.getOrDefault(from, BigDecimal.ZERO);

            if (senderBalance.compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient balance for forced transfer");
            }

            // Execute forced transfer
            tokenBalances.put(from, senderBalance.subtract(amount));
            BigDecimal recipientBalance = tokenBalances.getOrDefault(to, BigDecimal.ZERO);
            tokenBalances.put(to, recipientBalance.add(amount));

            state.setUpdatedAt(Instant.now());

            TransferEvent event = TransferEvent.builder()
                    .tokenId(tokenId)
                    .from(from)
                    .to(to)
                    .amount(amount)
                    .transactionId(generateTransactionId())
                    .timestamp(Instant.now())
                    .type(TransferType.FORCED)
                    .initiatedBy(callerAddress)
                    .reason(reason)
                    .build();

            Log.warnf("FORCED TRANSFER: %s tokens from %s to %s by agent %s. Reason: %s",
                     amount, from, to, callerAddress, reason);
            return event;
        });
    }

    /**
     * Recover tokens from a lost address to a new verified address
     *
     * @param tokenId Token identifier
     * @param lostAddress The lost/compromised address
     * @param newAddress The new verified address
     * @param callerAddress Agent address performing recovery
     * @param identityId Identity ID linking both addresses
     * @return Uni containing transfer event
     */
    public Uni<TransferEvent> recoverTokens(
            String tokenId,
            String lostAddress,
            String newAddress,
            String callerAddress,
            String identityId
    ) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            // Only agents can perform recovery
            if (!state.getAgents().contains(callerAddress)) {
                throw new SecurityException("Only agents can perform token recovery");
            }

            // Verify both addresses belong to the same identity
            String lostIdentity = identityRegistry.getIdentityId(lostAddress).await().indefinitely();
            String newIdentity = identityRegistry.getIdentityId(newAddress).await().indefinitely();

            if (lostIdentity == null || !lostIdentity.equals(identityId)) {
                throw new ComplianceException("Lost address not linked to provided identity");
            }

            if (newIdentity == null || !newIdentity.equals(identityId)) {
                throw new ComplianceException("New address not linked to provided identity");
            }

            // Verify new address is verified
            if (!identityRegistry.isVerified(newAddress).await().indefinitely()) {
                throw new ComplianceException("New address identity not verified");
            }

            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal lostBalance = tokenBalances.getOrDefault(lostAddress, BigDecimal.ZERO);

            if (lostBalance.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("No tokens to recover from lost address");
            }

            // Transfer all tokens from lost address to new address
            tokenBalances.put(lostAddress, BigDecimal.ZERO);
            BigDecimal newBalance = tokenBalances.getOrDefault(newAddress, BigDecimal.ZERO);
            tokenBalances.put(newAddress, newBalance.add(lostBalance));

            // Freeze the lost address permanently
            frozenAddresses.get(tokenId).add(lostAddress);

            state.setUpdatedAt(Instant.now());

            TransferEvent event = TransferEvent.builder()
                    .tokenId(tokenId)
                    .from(lostAddress)
                    .to(newAddress)
                    .amount(lostBalance)
                    .transactionId(generateTransactionId())
                    .timestamp(Instant.now())
                    .type(TransferType.RECOVERY)
                    .initiatedBy(callerAddress)
                    .reason("Token recovery for identity: " + identityId)
                    .build();

            Log.warnf("TOKEN RECOVERY: %s tokens recovered from %s to %s for identity %s",
                     lostBalance, lostAddress, newAddress, identityId);
            return event;
        });
    }

    /**
     * Freeze an address - prevent all transfers to/from this address
     *
     * @param tokenId Token identifier
     * @param addressToFreeze Address to freeze
     * @param callerAddress Agent address
     * @param reason Reason for freezing
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> freezeAddress(String tokenId, String addressToFreeze, String callerAddress, String reason) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            if (!state.getAgents().contains(callerAddress)) {
                throw new SecurityException("Only agents can freeze addresses");
            }

            frozenAddresses.get(tokenId).add(addressToFreeze);
            state.setUpdatedAt(Instant.now());

            Log.warnf("ADDRESS FROZEN: %s for token %s by agent %s. Reason: %s",
                     addressToFreeze, tokenId, callerAddress, reason);
            return true;
        });
    }

    /**
     * Unfreeze an address - allow transfers again
     *
     * @param tokenId Token identifier
     * @param addressToUnfreeze Address to unfreeze
     * @param callerAddress Agent address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> unfreezeAddress(String tokenId, String addressToUnfreeze, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            if (!state.getAgents().contains(callerAddress)) {
                throw new SecurityException("Only agents can unfreeze addresses");
            }

            frozenAddresses.get(tokenId).remove(addressToUnfreeze);
            state.setUpdatedAt(Instant.now());

            Log.infof("ADDRESS UNFROZEN: %s for token %s by agent %s", addressToUnfreeze, tokenId, callerAddress);
            return true;
        });
    }

    /**
     * Check if an address is frozen
     *
     * @param tokenId Token identifier
     * @param address Address to check
     * @return Uni<Boolean> frozen status
     */
    public Uni<Boolean> isFrozen(String tokenId, String address) {
        return Uni.createFrom().item(() -> {
            Set<String> frozen = frozenAddresses.get(tokenId);
            return frozen != null && frozen.contains(address);
        });
    }

    /**
     * Pause all transfers for a token
     *
     * @param tokenId Token identifier
     * @param callerAddress Agent/issuer address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> pause(String tokenId, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            if (!state.getAgents().contains(callerAddress) && !state.getIssuer().equals(callerAddress)) {
                throw new SecurityException("Only issuer or agents can pause token");
            }

            pausedTokens.put(tokenId, true);
            state.setPaused(true);
            state.setUpdatedAt(Instant.now());

            Log.warnf("TOKEN PAUSED: %s by %s", tokenId, callerAddress);
            return true;
        });
    }

    /**
     * Unpause a token
     *
     * @param tokenId Token identifier
     * @param callerAddress Agent/issuer address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> unpause(String tokenId, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            if (!state.getAgents().contains(callerAddress) && !state.getIssuer().equals(callerAddress)) {
                throw new SecurityException("Only issuer or agents can unpause token");
            }

            pausedTokens.put(tokenId, false);
            state.setPaused(false);
            state.setUpdatedAt(Instant.now());

            Log.infof("TOKEN UNPAUSED: %s by %s", tokenId, callerAddress);
            return true;
        });
    }

    /**
     * Add an agent to the token
     *
     * @param tokenId Token identifier
     * @param agentAddress New agent address
     * @param callerAddress Issuer address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> addAgent(String tokenId, String agentAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            if (!state.getIssuer().equals(callerAddress)) {
                throw new SecurityException("Only issuer can add agents");
            }

            state.getAgents().add(agentAddress);
            state.setUpdatedAt(Instant.now());

            Log.infof("Agent added: %s to token %s", agentAddress, tokenId);
            return true;
        });
    }

    /**
     * Remove an agent from the token
     *
     * @param tokenId Token identifier
     * @param agentAddress Agent address to remove
     * @param callerAddress Issuer address
     * @return Uni<Boolean> success status
     */
    public Uni<Boolean> removeAgent(String tokenId, String agentAddress, String callerAddress) {
        return Uni.createFrom().item(() -> {
            TokenState state = getTokenStateOrThrow(tokenId);

            if (!state.getIssuer().equals(callerAddress)) {
                throw new SecurityException("Only issuer can remove agents");
            }

            if (agentAddress.equals(state.getIssuer())) {
                throw new IllegalArgumentException("Cannot remove issuer from agents");
            }

            state.getAgents().remove(agentAddress);
            state.setUpdatedAt(Instant.now());

            Log.infof("Agent removed: %s from token %s", agentAddress, tokenId);
            return true;
        });
    }

    /**
     * Check if a transfer can be executed (pre-validation)
     *
     * @param tokenId Token identifier
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     * @return Uni<Boolean> whether transfer is allowed
     */
    public Uni<Boolean> canTransfer(String tokenId, String from, String to, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            try {
                validateTransfer(tokenId, from, to, amount);
                return true;
            } catch (Exception e) {
                Log.debugf("Transfer validation failed: %s", e.getMessage());
                return false;
            }
        });
    }

    /**
     * Get balance of an address
     *
     * @param tokenId Token identifier
     * @param address Address to query
     * @return Uni<BigDecimal> balance
     */
    public Uni<BigDecimal> balanceOf(String tokenId, String address) {
        return Uni.createFrom().item(() -> {
            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            if (tokenBalances == null) {
                throw new IllegalArgumentException("Token not found: " + tokenId);
            }
            return tokenBalances.getOrDefault(address, BigDecimal.ZERO);
        });
    }

    /**
     * Get token information
     *
     * @param tokenId Token identifier
     * @return Uni<TokenState> token state
     */
    public Uni<TokenState> getTokenInfo(String tokenId) {
        return Uni.createFrom().item(() -> getTokenStateOrThrow(tokenId));
    }

    /**
     * Get total supply of a token
     *
     * @param tokenId Token identifier
     * @return Uni<BigDecimal> total supply
     */
    public Uni<BigDecimal> totalSupply(String tokenId) {
        return Uni.createFrom().item(() -> getTokenStateOrThrow(tokenId).getTotalSupply());
    }

    // ============== Private Helper Methods ==============

    private void validateTransfer(String tokenId, String from, String to, BigDecimal amount) {
        TokenState state = getTokenStateOrThrow(tokenId);

        // Check if token is paused
        if (Boolean.TRUE.equals(pausedTokens.get(tokenId))) {
            throw new TokenPausedException("Token transfers are paused");
        }

        // Check if sender is frozen
        if (frozenAddresses.get(tokenId).contains(from)) {
            throw new AddressFrozenException("Sender address is frozen: " + from);
        }

        // Check if recipient is frozen
        if (frozenAddresses.get(tokenId).contains(to)) {
            throw new AddressFrozenException("Recipient address is frozen: " + to);
        }

        // Verify sender identity
        if (!identityRegistry.isVerified(from).await().indefinitely()) {
            throw new ComplianceException("Sender identity not verified");
        }

        // Verify recipient identity
        if (!identityRegistry.isVerified(to).await().indefinitely()) {
            throw new ComplianceException("Recipient identity not verified");
        }

        // Run compliance rules
        if (!complianceRulesEngine.canTransfer(tokenId, from, to, amount).await().indefinitely()) {
            throw new ComplianceException("Transfer fails compliance rules");
        }

        // Verify claims
        if (!claimVerifier.verifyRequiredClaims(to, state.getJurisdiction()).await().indefinitely()) {
            throw new ComplianceException("Recipient missing required claims");
        }
    }

    private TokenState getTokenStateOrThrow(String tokenId) {
        TokenState state = tokens.get(tokenId);
        if (state == null) {
            throw new IllegalArgumentException("Token not found: " + tokenId);
        }
        return state;
    }

    private String generateTokenId(String name, String symbol) {
        return "ERC3643-" + symbol.toUpperCase() + "-" +
               UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateTransactionId() {
        return "TX-" + System.currentTimeMillis() + "-" +
               UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ============== Custom Exceptions ==============

    public static class ComplianceException extends RuntimeException {
        public ComplianceException(String message) {
            super(message);
        }
    }

    public static class InsufficientBalanceException extends RuntimeException {
        public InsufficientBalanceException(String message) {
            super(message);
        }
    }

    public static class TokenPausedException extends RuntimeException {
        public TokenPausedException(String message) {
            super(message);
        }
    }

    public static class AddressFrozenException extends RuntimeException {
        public AddressFrozenException(String message) {
            super(message);
        }
    }
}
