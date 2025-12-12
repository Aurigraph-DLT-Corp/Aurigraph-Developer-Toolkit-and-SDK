package io.aurigraph.v11.contracts.erc3643;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Set;

/**
 * ERC-3643 REST API Resource
 *
 * REST endpoints for ERC-3643 (T-REX) compliant security token operations.
 *
 * Base URL: /api/v12/erc3643
 *
 * Features:
 * - Security token registration and management
 * - Identity registration and verification
 * - Compliance checking (canTransfer hook)
 * - Token transfers with compliance validation
 * - Trusted issuer management
 *
 * @version 1.0.0
 * @since 2025-12-08
 */
@Path("/api/v12/erc3643")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ERC3643Resource {

    private static final Logger LOG = Logger.getLogger(ERC3643Resource.class);

    @Inject
    ERC3643TokenRegistry tokenRegistry;

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ERC3643ComplianceModule complianceModule;

    // ==========================================================================
    // Token Management
    // ==========================================================================

    /**
     * Register a new ERC-3643 security token
     * POST /api/v12/erc3643/tokens
     */
    @POST
    @Path("/tokens")
    public Uni<Response> registerToken(RegisterTokenRequest request) {
        LOG.infof("Registering ERC-3643 token: %s (%s)", request.name, request.symbol);

        ERC3643TokenRegistry.TokenRegistrationRequest registrationRequest =
            new ERC3643TokenRegistry.TokenRegistrationRequest(
                request.name,
                request.symbol,
                request.decimals != null ? request.decimals : 18,
                request.maxSupply,
                request.issuer,
                request.jurisdiction,
                request.securityType != null ? request.securityType : ERC3643TokenRegistry.SecurityType.EQUITY,
                request.requiredClaimTopics,
                request.restrictedCountries,
                request.maxHolders != null ? request.maxHolders : 0,
                request.minHoldingPeriod != null ? request.minHoldingPeriod : 0,
                request.transferRestrictions
            );

        return tokenRegistry.registerToken(registrationRequest)
            .map(token -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "message", "Security token registered successfully",
                    "token", Map.of(
                        "tokenId", token.getTokenId(),
                        "name", token.getName(),
                        "symbol", token.getSymbol(),
                        "decimals", token.getDecimals(),
                        "issuer", token.getIssuer(),
                        "jurisdiction", token.getJurisdiction(),
                        "securityType", token.getSecurityType().name(),
                        "status", token.getStatus().name(),
                        "createdAt", token.getCreatedAt().toString()
                    )
                ))
                .build())
            .onFailure().recoverWithItem(error -> Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", error.getMessage()))
                .build());
    }

    /**
     * Get all registered tokens
     * GET /api/v12/erc3643/tokens
     */
    @GET
    @Path("/tokens")
    public Uni<Response> getAllTokens() {
        return tokenRegistry.getAllTokens()
            .map(tokens -> Response.ok(Map.of(
                "tokens", tokens.stream().map(this::tokenToMap).toList(),
                "total", tokens.size()
            )).build());
    }

    /**
     * Get token by ID
     * GET /api/v12/erc3643/tokens/{tokenId}
     */
    @GET
    @Path("/tokens/{tokenId}")
    public Uni<Response> getToken(@PathParam("tokenId") String tokenId) {
        return tokenRegistry.getToken(tokenId)
            .map(token -> {
                if (token == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Token not found: " + tokenId))
                        .build();
                }
                return Response.ok(tokenToMap(token)).build();
            });
    }

    /**
     * Mint tokens
     * POST /api/v12/erc3643/tokens/{tokenId}/mint
     */
    @POST
    @Path("/tokens/{tokenId}/mint")
    public Uni<Response> mintTokens(@PathParam("tokenId") String tokenId, MintRequest request) {
        LOG.infof("Minting %s tokens of %s to %s", request.amount, tokenId, request.recipient);

        return tokenRegistry.mint(tokenId, request.recipient, request.amount, request.issuer)
            .map(result -> {
                if (result.success()) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", result.message(),
                        "event", result.event()
                    )).build();
                } else {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "error", result.message()))
                        .build();
                }
            });
    }

    /**
     * Transfer tokens with compliance check
     * POST /api/v12/erc3643/tokens/{tokenId}/transfer
     */
    @POST
    @Path("/tokens/{tokenId}/transfer")
    public Uni<Response> transferTokens(@PathParam("tokenId") String tokenId, TransferRequest request) {
        LOG.infof("Transfer request: %s -> %s (%s of %s)", request.from, request.to, request.amount, tokenId);

        return tokenRegistry.transfer(tokenId, request.from, request.to, request.amount)
            .map(result -> {
                if (result.success()) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", result.message(),
                        "event", result.event()
                    )).build();
                } else {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("success", false, "error", result.message()))
                        .build();
                }
            });
    }

    /**
     * Check if transfer is allowed (canTransfer hook)
     * POST /api/v12/erc3643/tokens/{tokenId}/can-transfer
     */
    @POST
    @Path("/tokens/{tokenId}/can-transfer")
    public Uni<Response> canTransfer(@PathParam("tokenId") String tokenId, CanTransferRequest request) {
        LOG.debugf("Checking canTransfer: %s -> %s (%s)", request.from, request.to, request.amount);

        ERC3643ComplianceModule.TransferRequest complianceRequest =
            new ERC3643ComplianceModule.TransferRequest(
                tokenId, request.from, request.to, request.amount, null
            );

        return complianceModule.canTransfer(complianceRequest)
            .map(result -> Response.ok(Map.of(
                "allowed", result.allowed(),
                "message", result.message(),
                "passedChecks", result.passedChecks(),
                "failedChecks", result.failedChecks(),
                "checkDurationMs", result.checkDurationMs(),
                "timestamp", result.timestamp().toString()
            )).build());
    }

    /**
     * Get token holders
     * GET /api/v12/erc3643/tokens/{tokenId}/holders
     */
    @GET
    @Path("/tokens/{tokenId}/holders")
    public Uni<Response> getHolders(@PathParam("tokenId") String tokenId) {
        return tokenRegistry.getHolders(tokenId)
            .map(holders -> Response.ok(Map.of(
                "tokenId", tokenId,
                "holders", holders,
                "total", holders.size()
            )).build());
    }

    /**
     * Get balance for wallet
     * GET /api/v12/erc3643/tokens/{tokenId}/balance/{wallet}
     */
    @GET
    @Path("/tokens/{tokenId}/balance/{wallet}")
    public Uni<Response> getBalance(@PathParam("tokenId") String tokenId, @PathParam("wallet") String wallet) {
        return tokenRegistry.balanceOf(tokenId, wallet)
            .map(balance -> Response.ok(Map.of(
                "tokenId", tokenId,
                "wallet", wallet,
                "balance", balance
            )).build());
    }

    /**
     * Pause token
     * POST /api/v12/erc3643/tokens/{tokenId}/pause
     */
    @POST
    @Path("/tokens/{tokenId}/pause")
    public Uni<Response> pauseToken(@PathParam("tokenId") String tokenId, PauseRequest request) {
        LOG.warnf("Pausing token %s: %s", tokenId, request.reason);

        return tokenRegistry.pauseToken(tokenId, request.reason)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "Token paused",
                        "tokenId", tokenId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Token not found"))
                        .build();
                }
            });
    }

    /**
     * Unpause token
     * POST /api/v12/erc3643/tokens/{tokenId}/unpause
     */
    @POST
    @Path("/tokens/{tokenId}/unpause")
    public Uni<Response> unpauseToken(@PathParam("tokenId") String tokenId) {
        LOG.infof("Unpausing token %s", tokenId);

        return tokenRegistry.unpauseToken(tokenId)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "Token unpaused",
                        "tokenId", tokenId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Token not found"))
                        .build();
                }
            });
    }

    // ==========================================================================
    // Identity Management
    // ==========================================================================

    /**
     * Register an identity
     * POST /api/v12/erc3643/identities
     */
    @POST
    @Path("/identities")
    public Uni<Response> registerIdentity(RegisterIdentityRequest request) {
        LOG.infof("Registering identity for wallet: %s", request.walletAddress);

        IdentityRegistry.IdentityRegistrationRequest registrationRequest =
            new IdentityRegistry.IdentityRegistrationRequest(
                request.country,
                request.investorType != null ? request.investorType : IdentityRegistry.InvestorType.RETAIL,
                request.metadata
            );

        return identityRegistry.registerIdentity(request.walletAddress, registrationRequest)
            .map(identity -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "message", "Identity registered successfully",
                    "identity", Map.of(
                        "identityId", identity.getIdentityId(),
                        "walletAddress", identity.getWalletAddress(),
                        "country", identity.getCountry() != null ? identity.getCountry() : "",
                        "investorType", identity.getInvestorType().name(),
                        "verificationStatus", identity.getVerificationStatus().name(),
                        "createdAt", identity.getCreatedAt().toString()
                    )
                ))
                .build())
            .onFailure().recoverWithItem(error -> Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", error.getMessage()))
                .build());
    }

    /**
     * Get identity for wallet
     * GET /api/v12/erc3643/identities/{wallet}
     */
    @GET
    @Path("/identities/{wallet}")
    public Uni<Response> getIdentity(@PathParam("wallet") String wallet) {
        return identityRegistry.getIdentity(wallet)
            .map(identity -> {
                if (identity == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Identity not found for wallet: " + wallet))
                        .build();
                }
                return Response.ok(identityToMap(identity)).build();
            });
    }

    /**
     * Verify an identity (update status to VERIFIED)
     * POST /api/v12/erc3643/identities/{wallet}/verify
     */
    @POST
    @Path("/identities/{wallet}/verify")
    public Uni<Response> verifyIdentity(@PathParam("wallet") String wallet) {
        LOG.infof("Verifying identity for wallet: %s", wallet);

        return identityRegistry.updateVerificationStatus(wallet, IdentityRegistry.VerificationStatus.VERIFIED)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "Identity verified",
                        "wallet", wallet
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Identity not found"))
                        .build();
                }
            });
    }

    /**
     * Add claim to identity
     * POST /api/v12/erc3643/identities/{wallet}/claims
     */
    @POST
    @Path("/identities/{wallet}/claims")
    public Uni<Response> addClaim(@PathParam("wallet") String wallet, AddClaimRequest request) {
        LOG.infof("Adding claim %s to wallet %s", request.topic, wallet);

        IdentityRegistry.Claim claim = new IdentityRegistry.Claim(
            "CLAIM-" + System.currentTimeMillis(),
            request.topic,
            request.issuerId,
            request.issuerName,
            null, // signature
            request.data,
            Instant.now(),
            request.expiresAt,
            true
        );

        return identityRegistry.addClaim(wallet, claim)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "Claim added",
                        "claimId", claim.claimId()
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Identity not found"))
                        .build();
                }
            });
    }

    /**
     * Get claims for wallet
     * GET /api/v12/erc3643/identities/{wallet}/claims
     */
    @GET
    @Path("/identities/{wallet}/claims")
    public Uni<Response> getClaims(@PathParam("wallet") String wallet) {
        return identityRegistry.getValidClaims(wallet)
            .map(claims -> Response.ok(Map.of(
                "wallet", wallet,
                "claims", claims.stream().map(c -> Map.of(
                    "claimId", c.claimId(),
                    "topic", c.topic().name(),
                    "issuerId", c.issuerId(),
                    "issuerName", c.issuerName(),
                    "issuedAt", c.issuedAt().toString(),
                    "expiresAt", c.expiresAt() != null ? c.expiresAt().toString() : "never",
                    "valid", c.isValid()
                )).toList(),
                "total", claims.size()
            )).build());
    }

    // ==========================================================================
    // Compliance & Statistics
    // ==========================================================================

    /**
     * Get compliance statistics
     * GET /api/v12/erc3643/compliance/stats
     */
    @GET
    @Path("/compliance/stats")
    public Uni<Response> getComplianceStats() {
        return complianceModule.getComplianceStats()
            .map(stats -> Response.ok(Map.of(
                "totalTransfers", stats.totalTransfers(),
                "allowedTransfers", stats.allowedTransfers(),
                "blockedTransfers", stats.blockedTransfers(),
                "blockReasonCounts", stats.blockReasonCounts()
            )).build());
    }

    /**
     * Get registry statistics
     * GET /api/v12/erc3643/stats
     */
    @GET
    @Path("/stats")
    public Uni<Response> getStats() {
        return tokenRegistry.getStats()
            .flatMap(tokenStats -> identityRegistry.getStats()
                .map(identityStats -> Response.ok(Map.of(
                    "tokens", Map.of(
                        "total", tokenStats.totalTokens(),
                        "active", tokenStats.activeTokens(),
                        "paused", tokenStats.pausedTokens(),
                        "totalSupply", tokenStats.totalSupply(),
                        "totalHolders", tokenStats.totalHolders(),
                        "frozenAddresses", tokenStats.frozenAddresses()
                    ),
                    "identities", Map.of(
                        "total", identityStats.totalIdentities(),
                        "verified", identityStats.verifiedIdentities(),
                        "pending", identityStats.pendingIdentities(),
                        "byInvestorType", identityStats.byInvestorType(),
                        "byCountry", identityStats.byCountry()
                    )
                )).build())
            );
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private Map<String, Object> tokenToMap(ERC3643TokenRegistry.SecurityToken token) {
        java.util.HashMap<String, Object> map = new java.util.HashMap<>();
        map.put("tokenId", token.getTokenId());
        map.put("name", token.getName());
        map.put("symbol", token.getSymbol());
        map.put("decimals", token.getDecimals());
        map.put("totalSupply", token.getTotalSupply());
        map.put("maxSupply", token.getMaxSupply() != null ? token.getMaxSupply() : "unlimited");
        map.put("issuer", token.getIssuer());
        map.put("jurisdiction", token.getJurisdiction() != null ? token.getJurisdiction() : "");
        map.put("securityType", token.getSecurityType().name());
        map.put("status", token.getStatus().name());
        map.put("createdAt", token.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> identityToMap(IdentityRegistry.Identity identity) {
        return Map.of(
            "identityId", identity.getIdentityId(),
            "walletAddress", identity.getWalletAddress(),
            "country", identity.getCountry() != null ? identity.getCountry() : "",
            "investorType", identity.getInvestorType().name(),
            "verificationStatus", identity.getVerificationStatus().name(),
            "createdAt", identity.getCreatedAt().toString(),
            "claimCount", identity.getClaims() != null ? identity.getClaims().size() : 0
        );
    }

    // ==========================================================================
    // Request DTOs
    // ==========================================================================

    public static class RegisterTokenRequest {
        public String name;
        public String symbol;
        public Integer decimals;
        public BigDecimal maxSupply;
        public String issuer;
        public String jurisdiction;
        public ERC3643TokenRegistry.SecurityType securityType;
        public Set<IdentityRegistry.ClaimTopic> requiredClaimTopics;
        public Set<String> restrictedCountries;
        public Integer maxHolders;
        public Long minHoldingPeriod;
        public ERC3643TokenRegistry.TransferRestrictions transferRestrictions;
    }

    public static class MintRequest {
        public String recipient;
        public BigDecimal amount;
        public String issuer;
    }

    public static class TransferRequest {
        public String from;
        public String to;
        public BigDecimal amount;
    }

    public static class CanTransferRequest {
        public String from;
        public String to;
        public BigDecimal amount;
    }

    public static class PauseRequest {
        public String reason;
    }

    public static class RegisterIdentityRequest {
        public String walletAddress;
        public String country;
        public IdentityRegistry.InvestorType investorType;
        public Map<String, String> metadata;
    }

    public static class AddClaimRequest {
        public IdentityRegistry.ClaimTopic topic;
        public String issuerId;
        public String issuerName;
        public Map<String, Object> data;
        public Instant expiresAt;
    }
}
