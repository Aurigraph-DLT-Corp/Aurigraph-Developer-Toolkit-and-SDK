package io.aurigraph.v11.contracts.erc3643;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ERC-3643 Token Registry
 *
 * Separate registry for ERC-3643 compliant security tokens.
 * This registry manages security tokens that implement the T-REX (Token for Regulated EXchanges) standard.
 *
 * Key Features:
 * - Token registration with compliance requirements
 * - Token-to-IdentityRegistry linkage
 * - Transfer restriction management
 * - Compliance module integration
 * - Token lifecycle management (issuance, freeze, pause)
 *
 * ERC-3643 Standard Components:
 * 1. Identity Registry (ONCHAINID) - Links wallets to identities
 * 2. Claim Topics Registry - Required claims for token holders
 * 3. Trusted Issuers Registry - Authorized claim issuers
 * 4. Compliance Module - Transfer validation rules
 *
 * @version 1.0.0
 * @since 2025-12-08
 */
@ApplicationScoped
public class ERC3643TokenRegistry {

    private static final Logger LOG = LoggerFactory.getLogger(ERC3643TokenRegistry.class);

    @Inject
    IdentityRegistry identityRegistry;

    // Token storage: tokenId -> SecurityToken
    private final Map<String, SecurityToken> tokens = new ConcurrentHashMap<>();

    // Token balances: tokenId -> (walletAddress -> balance)
    private final Map<String, Map<String, BigDecimal>> balances = new ConcurrentHashMap<>();

    // Frozen addresses: tokenId -> Set<walletAddress>
    private final Map<String, Set<String>> frozenAddresses = new ConcurrentHashMap<>();

    // Token compliance modules: tokenId -> ComplianceConfig
    private final Map<String, ComplianceConfig> complianceConfigs = new ConcurrentHashMap<>();

    // ========== Token Registration ==========

    /**
     * Register a new ERC-3643 compliant security token
     */
    public Uni<SecurityToken> registerToken(TokenRegistrationRequest request) {
        return Uni.createFrom().item(() -> {
            String tokenId = generateTokenId(request);

            SecurityToken token = SecurityToken.builder()
                .tokenId(tokenId)
                .name(request.name())
                .symbol(request.symbol())
                .decimals(request.decimals())
                .totalSupply(BigDecimal.ZERO)
                .maxSupply(request.maxSupply())
                .issuer(request.issuer())
                .jurisdiction(request.jurisdiction())
                .securityType(request.securityType())
                .status(TokenStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

            // Initialize compliance config
            ComplianceConfig compliance = new ComplianceConfig(
                tokenId,
                request.requiredClaimTopics(),
                request.restrictedCountries(),
                request.maxHolders(),
                request.minHoldingPeriod(),
                request.transferRestrictions()
            );

            tokens.put(tokenId, token);
            balances.put(tokenId, new ConcurrentHashMap<>());
            frozenAddresses.put(tokenId, ConcurrentHashMap.newKeySet());
            complianceConfigs.put(tokenId, compliance);

            LOG.info("Registered ERC-3643 token: {} ({}) by issuer {}",
                token.getName(), token.getSymbol(), token.getIssuer());

            return token;
        });
    }

    /**
     * Get token by ID
     */
    public Uni<SecurityToken> getToken(String tokenId) {
        return Uni.createFrom().item(() -> tokens.get(tokenId));
    }

    /**
     * Get all registered tokens
     */
    public Uni<List<SecurityToken>> getAllTokens() {
        return Uni.createFrom().item(() -> new ArrayList<>(tokens.values()));
    }

    /**
     * Get tokens by issuer
     */
    public Uni<List<SecurityToken>> getTokensByIssuer(String issuer) {
        return Uni.createFrom().item(() ->
            tokens.values().stream()
                .filter(t -> t.getIssuer().equals(issuer))
                .toList()
        );
    }

    // ========== Token Operations ==========

    /**
     * Mint new tokens (only by authorized issuer)
     */
    public Uni<MintResult> mint(String tokenId, String recipient, BigDecimal amount, String issuer) {
        return canReceive(tokenId, recipient)
            .flatMap(canReceiveResult -> {
                if (!canReceiveResult.allowed()) {
                    return Uni.createFrom().item(new MintResult(false,
                        "Recipient not eligible: " + canReceiveResult.reason(), null));
                }

                return Uni.createFrom().item(() -> {
                    SecurityToken token = tokens.get(tokenId);
                    if (token == null) {
                        return new MintResult(false, "Token not found", null);
                    }

                    if (!token.getIssuer().equals(issuer)) {
                        return new MintResult(false, "Only issuer can mint", null);
                    }

                    if (token.getStatus() != TokenStatus.ACTIVE) {
                        return new MintResult(false, "Token is not active", null);
                    }

                    // Check max supply
                    BigDecimal newSupply = token.getTotalSupply().add(amount);
                    if (token.getMaxSupply() != null && newSupply.compareTo(token.getMaxSupply()) > 0) {
                        return new MintResult(false, "Would exceed max supply", null);
                    }

                    // Mint tokens
                    token.setTotalSupply(newSupply);
                    Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
                    tokenBalances.merge(recipient, amount, BigDecimal::add);

                    LOG.info("Minted {} {} to {}", amount, token.getSymbol(), recipient);

                    return new MintResult(true, "Tokens minted successfully",
                        new TransferEvent(tokenId, null, recipient, amount, Instant.now()));
                });
            });
    }

    /**
     * Burn tokens (redemption)
     */
    public Uni<BurnResult> burn(String tokenId, String holder, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            SecurityToken token = tokens.get(tokenId);
            if (token == null) {
                return new BurnResult(false, "Token not found");
            }

            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal currentBalance = tokenBalances.getOrDefault(holder, BigDecimal.ZERO);

            if (currentBalance.compareTo(amount) < 0) {
                return new BurnResult(false, "Insufficient balance");
            }

            // Burn tokens
            tokenBalances.put(holder, currentBalance.subtract(amount));
            token.setTotalSupply(token.getTotalSupply().subtract(amount));

            LOG.info("Burned {} {} from {}", amount, token.getSymbol(), holder);

            return new BurnResult(true, "Tokens burned successfully");
        });
    }

    /**
     * Transfer tokens with ERC-3643 compliance checks
     */
    public Uni<TransferResult> transfer(String tokenId, String from, String to, BigDecimal amount) {
        return canTransfer(tokenId, from, to, amount)
            .flatMap(canTransferResult -> {
                if (!canTransferResult.allowed()) {
                    return Uni.createFrom().item(new TransferResult(false,
                        canTransferResult.reason(), null));
                }

                return Uni.createFrom().item(() -> {
                    Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
                    BigDecimal fromBalance = tokenBalances.getOrDefault(from, BigDecimal.ZERO);

                    if (fromBalance.compareTo(amount) < 0) {
                        return new TransferResult(false, "Insufficient balance", null);
                    }

                    // Execute transfer
                    tokenBalances.put(from, fromBalance.subtract(amount));
                    tokenBalances.merge(to, amount, BigDecimal::add);

                    SecurityToken token = tokens.get(tokenId);
                    LOG.info("Transferred {} {} from {} to {}", amount, token.getSymbol(), from, to);

                    return new TransferResult(true, "Transfer successful",
                        new TransferEvent(tokenId, from, to, amount, Instant.now()));
                });
            });
    }

    // ========== ERC-3643 Compliance Checks ==========

    /**
     * Check if transfer is allowed (core ERC-3643 compliance)
     */
    public Uni<ComplianceResult> canTransfer(String tokenId, String from, String to, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            SecurityToken token = tokens.get(tokenId);
            if (token == null) {
                return new ComplianceResult(false, "Token not found", List.of("INVALID_TOKEN"));
            }

            ComplianceConfig config = complianceConfigs.get(tokenId);
            List<String> violations = new ArrayList<>();

            // Check 1: Token status
            if (token.getStatus() == TokenStatus.PAUSED) {
                violations.add("TOKEN_PAUSED");
            }

            // Check 2: Frozen addresses
            Set<String> frozen = frozenAddresses.get(tokenId);
            if (frozen.contains(from)) {
                violations.add("SENDER_FROZEN");
            }
            if (frozen.contains(to)) {
                violations.add("RECIPIENT_FROZEN");
            }

            // Check 3: Sender balance
            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal fromBalance = tokenBalances.getOrDefault(from, BigDecimal.ZERO);
            if (fromBalance.compareTo(amount) < 0) {
                violations.add("INSUFFICIENT_BALANCE");
            }

            if (!violations.isEmpty()) {
                return new ComplianceResult(false, String.join(", ", violations), violations);
            }

            return new ComplianceResult(true, "Transfer allowed", List.of());
        }).flatMap(basicResult -> {
            if (!basicResult.allowed()) {
                return Uni.createFrom().item(basicResult);
            }

            // Check identity registry compliance
            return checkIdentityCompliance(tokenId, from, to);
        });
    }

    /**
     * Check identity registry compliance for both parties
     */
    private Uni<ComplianceResult> checkIdentityCompliance(String tokenId, String from, String to) {
        ComplianceConfig config = complianceConfigs.get(tokenId);

        // Check sender identity
        return identityRegistry.isVerified(from)
            .flatMap(senderVerified -> {
                if (!Boolean.TRUE.equals(senderVerified)) {
                    return Uni.createFrom().item(new ComplianceResult(false,
                        "Sender not verified", List.of("SENDER_NOT_VERIFIED")));
                }

                // Check recipient identity - chain to ComplianceResult
                return identityRegistry.isVerified(to)
                    .flatMap(recipientVerified -> {
                        if (!Boolean.TRUE.equals(recipientVerified)) {
                            return Uni.createFrom().item(new ComplianceResult(false,
                                "Recipient not verified", List.of("RECIPIENT_NOT_VERIFIED")));
                        }

                        // Check required claims for recipient
                        return checkRequiredClaims(to, config.requiredClaimTopics());
                    });
            })
            .flatMap(claimsResult -> {
                if (!claimsResult.allowed()) {
                    return Uni.createFrom().item(claimsResult);
                }

                // Check country restrictions
                return checkCountryRestrictions(to, config.restrictedCountries());
            });
    }

    /**
     * Check if recipient has all required claims
     */
    private Uni<ComplianceResult> checkRequiredClaims(String wallet,
            Set<IdentityRegistry.ClaimTopic> requiredTopics) {
        if (requiredTopics == null || requiredTopics.isEmpty()) {
            return Uni.createFrom().item(new ComplianceResult(true, "No claims required", List.of()));
        }

        return identityRegistry.getValidClaims(wallet)
            .map(claims -> {
                Set<IdentityRegistry.ClaimTopic> haveClaims = new HashSet<>();
                for (IdentityRegistry.Claim claim : claims) {
                    haveClaims.add(claim.topic());
                }

                List<String> missingClaims = new ArrayList<>();
                for (IdentityRegistry.ClaimTopic required : requiredTopics) {
                    if (!haveClaims.contains(required)) {
                        missingClaims.add("MISSING_" + required.name());
                    }
                }

                if (!missingClaims.isEmpty()) {
                    return new ComplianceResult(false,
                        "Missing required claims: " + missingClaims, missingClaims);
                }

                return new ComplianceResult(true, "All claims present", List.of());
            });
    }

    /**
     * Check country restrictions
     */
    private Uni<ComplianceResult> checkCountryRestrictions(String wallet, Set<String> restrictedCountries) {
        if (restrictedCountries == null || restrictedCountries.isEmpty()) {
            return Uni.createFrom().item(new ComplianceResult(true, "No country restrictions", List.of()));
        }

        return identityRegistry.getCountry(wallet)
            .map(country -> {
                if (country != null && restrictedCountries.contains(country)) {
                    return new ComplianceResult(false,
                        "Country restricted: " + country, List.of("COUNTRY_RESTRICTED"));
                }
                return new ComplianceResult(true, "Country allowed", List.of());
            });
    }

    /**
     * Check if address can receive tokens
     */
    public Uni<ComplianceResult> canReceive(String tokenId, String wallet) {
        ComplianceConfig config = complianceConfigs.get(tokenId);
        if (config == null) {
            return Uni.createFrom().item(new ComplianceResult(false, "Token not found", List.of("INVALID_TOKEN")));
        }

        // Check frozen
        Set<String> frozen = frozenAddresses.get(tokenId);
        if (frozen != null && frozen.contains(wallet)) {
            return Uni.createFrom().item(new ComplianceResult(false, "Address frozen", List.of("ADDRESS_FROZEN")));
        }

        // Check max holders
        if (config.maxHolders() > 0) {
            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            long currentHolders = tokenBalances.values().stream()
                .filter(b -> b.compareTo(BigDecimal.ZERO) > 0)
                .count();
            BigDecimal walletBalance = tokenBalances.getOrDefault(wallet, BigDecimal.ZERO);

            if (walletBalance.compareTo(BigDecimal.ZERO) == 0 && currentHolders >= config.maxHolders()) {
                return Uni.createFrom().item(new ComplianceResult(false,
                    "Max holders reached", List.of("MAX_HOLDERS_REACHED")));
            }
        }

        // Check identity and claims
        return identityRegistry.isVerified(wallet)
            .flatMap(verified -> {
                if (!verified) {
                    return Uni.createFrom().item(new ComplianceResult(false,
                        "Wallet not verified", List.of("NOT_VERIFIED")));
                }
                return checkRequiredClaims(wallet, config.requiredClaimTopics());
            })
            .flatMap(claimsResult -> {
                if (!claimsResult.allowed()) {
                    return Uni.createFrom().item(claimsResult);
                }
                return checkCountryRestrictions(wallet, config.restrictedCountries());
            });
    }

    // ========== Token Administration ==========

    /**
     * Freeze an address (compliance action)
     */
    public Uni<Boolean> freezeAddress(String tokenId, String wallet, String reason) {
        return Uni.createFrom().item(() -> {
            Set<String> frozen = frozenAddresses.get(tokenId);
            if (frozen == null) return false;

            frozen.add(wallet);
            LOG.warn("Froze address {} for token {}: {}", wallet, tokenId, reason);
            return true;
        });
    }

    /**
     * Unfreeze an address
     */
    public Uni<Boolean> unfreezeAddress(String tokenId, String wallet) {
        return Uni.createFrom().item(() -> {
            Set<String> frozen = frozenAddresses.get(tokenId);
            if (frozen == null) return false;

            frozen.remove(wallet);
            LOG.info("Unfroze address {} for token {}", wallet, tokenId);
            return true;
        });
    }

    /**
     * Pause token (halt all transfers)
     */
    public Uni<Boolean> pauseToken(String tokenId, String reason) {
        return Uni.createFrom().item(() -> {
            SecurityToken token = tokens.get(tokenId);
            if (token == null) return false;

            token.setStatus(TokenStatus.PAUSED);
            LOG.warn("Paused token {}: {}", tokenId, reason);
            return true;
        });
    }

    /**
     * Unpause token
     */
    public Uni<Boolean> unpauseToken(String tokenId) {
        return Uni.createFrom().item(() -> {
            SecurityToken token = tokens.get(tokenId);
            if (token == null) return false;

            token.setStatus(TokenStatus.ACTIVE);
            LOG.info("Unpaused token {}", tokenId);
            return true;
        });
    }

    /**
     * Force transfer (regulatory action - bypasses compliance)
     */
    public Uni<TransferResult> forceTransfer(String tokenId, String from, String to,
            BigDecimal amount, String authorizer, String reason) {
        return Uni.createFrom().item(() -> {
            SecurityToken token = tokens.get(tokenId);
            if (token == null) {
                return new TransferResult(false, "Token not found", null);
            }

            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            BigDecimal fromBalance = tokenBalances.getOrDefault(from, BigDecimal.ZERO);

            if (fromBalance.compareTo(amount) < 0) {
                return new TransferResult(false, "Insufficient balance", null);
            }

            // Execute forced transfer
            tokenBalances.put(from, fromBalance.subtract(amount));
            tokenBalances.merge(to, amount, BigDecimal::add);

            LOG.warn("FORCED TRANSFER: {} {} from {} to {} by {} - Reason: {}",
                amount, token.getSymbol(), from, to, authorizer, reason);

            return new TransferResult(true, "Forced transfer executed",
                new TransferEvent(tokenId, from, to, amount, Instant.now()));
        });
    }

    // ========== Query Methods ==========

    /**
     * Get balance for wallet
     */
    public Uni<BigDecimal> balanceOf(String tokenId, String wallet) {
        return Uni.createFrom().item(() -> {
            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            if (tokenBalances == null) return BigDecimal.ZERO;
            return tokenBalances.getOrDefault(wallet, BigDecimal.ZERO);
        });
    }

    /**
     * Get all holders of a token
     */
    public Uni<List<TokenHolder>> getHolders(String tokenId) {
        return Uni.createFrom().item(() -> {
            Map<String, BigDecimal> tokenBalances = balances.get(tokenId);
            if (tokenBalances == null) return List.of();

            return tokenBalances.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new TokenHolder(e.getKey(), e.getValue()))
                .toList();
        });
    }

    /**
     * Get compliance config for token
     */
    public Uni<ComplianceConfig> getComplianceConfig(String tokenId) {
        return Uni.createFrom().item(() -> complianceConfigs.get(tokenId));
    }

    /**
     * Update compliance config
     */
    public Uni<Boolean> updateComplianceConfig(String tokenId, ComplianceConfig newConfig) {
        return Uni.createFrom().item(() -> {
            if (!tokens.containsKey(tokenId)) return false;
            complianceConfigs.put(tokenId, newConfig);
            LOG.info("Updated compliance config for token {}", tokenId);
            return true;
        });
    }

    /**
     * Get registry statistics
     */
    public Uni<RegistryStats> getStats() {
        return Uni.createFrom().item(() -> {
            int totalTokens = tokens.size();
            int activeTokens = (int) tokens.values().stream()
                .filter(t -> t.getStatus() == TokenStatus.ACTIVE)
                .count();
            int pausedTokens = (int) tokens.values().stream()
                .filter(t -> t.getStatus() == TokenStatus.PAUSED)
                .count();

            BigDecimal totalSupply = tokens.values().stream()
                .map(SecurityToken::getTotalSupply)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            int totalHolders = balances.values().stream()
                .mapToInt(m -> (int) m.values().stream()
                    .filter(b -> b.compareTo(BigDecimal.ZERO) > 0)
                    .count())
                .sum();

            int frozenAddressCount = frozenAddresses.values().stream()
                .mapToInt(Set::size)
                .sum();

            return new RegistryStats(totalTokens, activeTokens, pausedTokens,
                totalSupply, totalHolders, frozenAddressCount);
        });
    }

    // ========== Utility Methods ==========

    private String generateTokenId(TokenRegistrationRequest request) {
        return "ERC3643-" + request.symbol().toUpperCase() + "-" + System.currentTimeMillis() % 100000;
    }

    // ========== Inner Classes ==========

    /**
     * ERC-3643 Security Token
     */
    public static class SecurityToken {
        private String tokenId;
        private String name;
        private String symbol;
        private int decimals;
        private BigDecimal totalSupply;
        private BigDecimal maxSupply;
        private String issuer;
        private String jurisdiction;
        private SecurityType securityType;
        private TokenStatus status;
        private Instant createdAt;
        private Instant updatedAt;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final SecurityToken token = new SecurityToken();

            public Builder tokenId(String id) { token.tokenId = id; return this; }
            public Builder name(String name) { token.name = name; return this; }
            public Builder symbol(String symbol) { token.symbol = symbol; return this; }
            public Builder decimals(int decimals) { token.decimals = decimals; return this; }
            public Builder totalSupply(BigDecimal supply) { token.totalSupply = supply; return this; }
            public Builder maxSupply(BigDecimal max) { token.maxSupply = max; return this; }
            public Builder issuer(String issuer) { token.issuer = issuer; return this; }
            public Builder jurisdiction(String jurisdiction) { token.jurisdiction = jurisdiction; return this; }
            public Builder securityType(SecurityType type) { token.securityType = type; return this; }
            public Builder status(TokenStatus status) { token.status = status; return this; }
            public Builder createdAt(Instant createdAt) { token.createdAt = createdAt; return this; }

            public SecurityToken build() { return token; }
        }

        // Getters and setters
        public String getTokenId() { return tokenId; }
        public String getName() { return name; }
        public String getSymbol() { return symbol; }
        public int getDecimals() { return decimals; }
        public BigDecimal getTotalSupply() { return totalSupply; }
        public void setTotalSupply(BigDecimal supply) { this.totalSupply = supply; this.updatedAt = Instant.now(); }
        public BigDecimal getMaxSupply() { return maxSupply; }
        public String getIssuer() { return issuer; }
        public String getJurisdiction() { return jurisdiction; }
        public SecurityType getSecurityType() { return securityType; }
        public TokenStatus getStatus() { return status; }
        public void setStatus(TokenStatus status) { this.status = status; this.updatedAt = Instant.now(); }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getUpdatedAt() { return updatedAt; }
    }

    /**
     * Security Type Classification
     */
    public enum SecurityType {
        EQUITY,              // Stock/shares
        DEBT,                // Bonds/notes
        FUND,                // Fund units
        REAL_ESTATE,         // Real estate securities
        DERIVATIVE,          // Options/futures
        HYBRID,              // Convertible instruments
        REVENUE_SHARE,       // Revenue participation
        ASSET_BACKED         // Asset-backed securities
    }

    /**
     * Token Status
     */
    public enum TokenStatus {
        ACTIVE,
        PAUSED,
        DEPRECATED,
        TERMINATED
    }

    /**
     * Token Registration Request
     */
    public record TokenRegistrationRequest(
        String name,
        String symbol,
        int decimals,
        BigDecimal maxSupply,
        String issuer,
        String jurisdiction,
        SecurityType securityType,
        Set<IdentityRegistry.ClaimTopic> requiredClaimTopics,
        Set<String> restrictedCountries,
        int maxHolders,
        long minHoldingPeriod,
        TransferRestrictions transferRestrictions
    ) {}

    /**
     * Compliance Configuration
     */
    public record ComplianceConfig(
        String tokenId,
        Set<IdentityRegistry.ClaimTopic> requiredClaimTopics,
        Set<String> restrictedCountries,
        int maxHolders,
        long minHoldingPeriod,
        TransferRestrictions transferRestrictions
    ) {}

    /**
     * Transfer Restrictions
     */
    public record TransferRestrictions(
        boolean accreditedOnly,
        boolean institutionalOnly,
        BigDecimal minTransferAmount,
        BigDecimal maxTransferAmount,
        int dailyTransferLimit,
        boolean lockupEnforced,
        Instant lockupEndDate
    ) {}

    /**
     * Compliance Check Result
     */
    public record ComplianceResult(
        boolean allowed,
        String reason,
        List<String> violations
    ) {}

    /**
     * Transfer Result
     */
    public record TransferResult(
        boolean success,
        String message,
        TransferEvent event
    ) {}

    /**
     * Mint Result
     */
    public record MintResult(
        boolean success,
        String message,
        TransferEvent event
    ) {}

    /**
     * Burn Result
     */
    public record BurnResult(
        boolean success,
        String message
    ) {}

    /**
     * Transfer Event
     */
    public record TransferEvent(
        String tokenId,
        String from,
        String to,
        BigDecimal amount,
        Instant timestamp
    ) {}

    /**
     * Token Holder
     */
    public record TokenHolder(
        String wallet,
        BigDecimal balance
    ) {}

    /**
     * Registry Statistics
     */
    public record RegistryStats(
        int totalTokens,
        int activeTokens,
        int pausedTokens,
        BigDecimal totalSupply,
        int totalHolders,
        int frozenAddresses
    ) {}
}
