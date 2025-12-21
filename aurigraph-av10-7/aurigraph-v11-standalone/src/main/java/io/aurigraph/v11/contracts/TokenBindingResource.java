package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.TokenBindingService.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * Token Binding REST API for ActiveContracts
 *
 * Provides REST endpoints for managing token bindings to contracts:
 * - Primary token binding (main asset)
 * - Secondary token binding (revenue shares, rights)
 * - Composite token binding (token bundles)
 * - Token ownership verification
 * - Token locking and release
 *
 * Base Path: /api/v12/contracts/{id}/tokens
 *
 * @version 12.0.0
 * @since 2025-12-21
 */
@Path("/api/v12/contracts/{contractId}/tokens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TokenBindingResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(TokenBindingResource.class);

    @Inject
    TokenBindingService tokenBindingService;

    // ==================== TOKEN BINDINGS LIST ====================

    /**
     * List all token bindings for a contract
     *
     * GET /api/v12/contracts/{id}/tokens
     *
     * @param contractId Contract ID
     * @param type Optional filter by token type (PRIMARY, SECONDARY, COMPOSITE, GOVERNANCE, UTILITY, SECURITY)
     * @return List of token bindings
     */
    @GET
    public Uni<Response> getTokenBindings(
            @PathParam("contractId") String contractId,
            @QueryParam("type") String type
    ) {
        LOGGER.info("REST: Get token bindings for contract {} (type={})", contractId, type);

        Uni<List<TokenBinding>> bindingsUni;

        if (type != null && !type.isEmpty()) {
            try {
                TokenBindingService.TokenType tokenType = TokenBindingService.TokenType.valueOf(type.toUpperCase());
                bindingsUni = tokenBindingService.getTokenBindingsByType(contractId, tokenType);
            } catch (IllegalArgumentException e) {
                return Uni.createFrom().item(
                    Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of(
                            "error", "Invalid token type: " + type,
                            "validTypes", List.of("PRIMARY", "SECONDARY", "COMPOSITE", "GOVERNANCE", "UTILITY", "SECURITY")
                        ))
                        .build()
                );
            }
        } else {
            bindingsUni = tokenBindingService.getTokenBindings(contractId);
        }

        return bindingsUni
            .map(bindings -> Response.ok(Map.of(
                "contractId", contractId,
                "bindings", bindings,
                "count", bindings.size()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get token bindings failed: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== PRIMARY TOKEN BINDING ====================

    /**
     * Bind a primary token to a contract
     *
     * POST /api/v12/contracts/{id}/tokens/primary
     *
     * Request body:
     * {
     *   "tokenId": "TOKEN_123",
     *   "stakeholder": "0x1234..."
     * }
     *
     * @param contractId Contract ID
     * @param request Primary bind request
     * @return TokenBinding result
     */
    @POST
    @Path("/primary")
    public Uni<Response> bindPrimaryToken(
            @PathParam("contractId") String contractId,
            PrimaryBindRequest request
    ) {
        LOGGER.info("REST: Bind primary token {} to contract {} for {}",
            request.tokenId(), contractId, request.stakeholder());

        return tokenBindingService.bindPrimaryToken(
                contractId,
                request.tokenId(),
                request.stakeholder()
            )
            .map(binding -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "message", "Primary token bound successfully",
                    "binding", binding
                ))
                .build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Bind primary token failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== SECONDARY TOKEN BINDING ====================

    /**
     * Bind a secondary token to a contract (revenue share, rights, etc.)
     *
     * POST /api/v12/contracts/{id}/tokens/secondary
     *
     * Request body:
     * {
     *   "tokenId": "TOKEN_456",
     *   "stakeholder": "0x5678...",
     *   "percentage": 25.5
     * }
     *
     * @param contractId Contract ID
     * @param request Secondary bind request
     * @return TokenBinding result
     */
    @POST
    @Path("/secondary")
    public Uni<Response> bindSecondaryToken(
            @PathParam("contractId") String contractId,
            SecondaryBindRequest request
    ) {
        LOGGER.info("REST: Bind secondary token {} to contract {} for {} with {}%",
            request.tokenId(), contractId, request.stakeholder(), request.percentage());

        return tokenBindingService.bindSecondaryToken(
                contractId,
                request.tokenId(),
                request.stakeholder(),
                request.percentage()
            )
            .map(binding -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "message", "Secondary token bound successfully",
                    "binding", binding
                ))
                .build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Bind secondary token failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== COMPOSITE TOKEN BINDING ====================

    /**
     * Bind a composite token bundle to a contract
     *
     * POST /api/v12/contracts/{id}/tokens/composite
     *
     * Request body:
     * {
     *   "compositeTokenId": "COMPOSITE_789",
     *   "componentTokens": ["TOKEN_1", "TOKEN_2", "TOKEN_3"]
     * }
     *
     * @param contractId Contract ID
     * @param request Composite bind request
     * @return TokenBinding result
     */
    @POST
    @Path("/composite")
    public Uni<Response> bindCompositeToken(
            @PathParam("contractId") String contractId,
            CompositeBindRequest request
    ) {
        LOGGER.info("REST: Bind composite token {} with {} components to contract {}",
            request.compositeTokenId(), request.componentTokens().size(), contractId);

        return tokenBindingService.bindCompositeToken(
                contractId,
                request.compositeTokenId(),
                request.componentTokens()
            )
            .map(binding -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "message", "Composite token bound successfully",
                    "binding", binding
                ))
                .build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Bind composite token failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== TOKEN OWNERSHIP VERIFICATION ====================

    /**
     * Verify token ownership for a party in a contract
     *
     * POST /api/v12/contracts/{id}/tokens/verify
     *
     * Request body:
     * {
     *   "partyId": "0x1234..."
     * }
     *
     * @param contractId Contract ID
     * @param request Verify ownership request
     * @return OwnershipVerification result
     */
    @POST
    @Path("/verify")
    public Uni<Response> verifyTokenOwnership(
            @PathParam("contractId") String contractId,
            VerifyOwnershipRequest request
    ) {
        LOGGER.info("REST: Verify token ownership for party {} in contract {}",
            request.partyId(), contractId);

        return tokenBindingService.verifyTokenOwnership(contractId, request.partyId())
            .map(verification -> Response.ok(Map.of(
                "message", verification.verified() ? "Ownership verified" : "Verification failed",
                "verification", verification
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Verify ownership failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== TOKEN LOCKING ====================

    /**
     * Lock all tokens bound to a contract for contract execution
     *
     * POST /api/v12/contracts/{id}/tokens/lock
     *
     * @param contractId Contract ID
     * @return LockResult
     */
    @POST
    @Path("/lock")
    public Uni<Response> lockTokens(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Lock tokens for contract {}", contractId);

        return tokenBindingService.lockTokens(contractId)
            .map(result -> {
                if (result.success()) {
                    return Response.ok(Map.of(
                        "message", "Tokens locked successfully",
                        "result", result
                    )).build();
                } else {
                    return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of(
                            "message", "Token locking partially failed",
                            "result", result
                        ))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Lock tokens failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== TOKEN RELEASE ====================

    /**
     * Release all locked tokens for a contract
     *
     * POST /api/v12/contracts/{id}/tokens/release
     *
     * @param contractId Contract ID
     * @return ReleaseResult
     */
    @POST
    @Path("/release")
    public Uni<Response> releaseTokens(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Release tokens for contract {}", contractId);

        return tokenBindingService.releaseTokens(contractId)
            .map(result -> {
                if (result.success()) {
                    return Response.ok(Map.of(
                        "message", "Tokens released successfully",
                        "result", result
                    )).build();
                } else {
                    return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of(
                            "message", "Token release partially failed",
                            "result", result
                        ))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Release tokens failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    // ==================== METRICS ====================

    /**
     * Get token binding service metrics
     *
     * GET /api/v12/contracts/{id}/tokens/metrics
     *
     * @param contractId Contract ID (used for context, returns global metrics)
     * @return Service metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get token binding metrics");

        Map<String, Object> metrics = tokenBindingService.getMetrics();
        metrics.put("contractId", contractId);

        return Response.ok(metrics).build();
    }

    // ==================== API INFO ====================

    /**
     * Get token binding API information
     *
     * GET /api/v12/contracts/{id}/tokens/info
     *
     * @param contractId Contract ID
     * @return API information
     */
    @GET
    @Path("/info")
    public Response getInfo(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get token binding API info");

        return Response.ok(Map.of(
            "service", "Token Binding Service",
            "version", "12.0.0",
            "description", "Manages token bindings for ActiveContracts",
            "contractId", contractId,
            "supportedTokenTypes", List.of(
                "PRIMARY - Main asset token",
                "SECONDARY - Revenue shares, royalties, rights",
                "COMPOSITE - Bundle of multiple tokens",
                "GOVERNANCE - Voting/governance tokens",
                "UTILITY - Access/utility tokens",
                "SECURITY - Securities-backed tokens"
            ),
            "endpoints", List.of(
                "GET /api/v12/contracts/{id}/tokens - List token bindings",
                "POST /api/v12/contracts/{id}/tokens/primary - Bind primary token",
                "POST /api/v12/contracts/{id}/tokens/secondary - Bind secondary token",
                "POST /api/v12/contracts/{id}/tokens/composite - Bind composite token",
                "POST /api/v12/contracts/{id}/tokens/verify - Verify ownership",
                "POST /api/v12/contracts/{id}/tokens/lock - Lock tokens",
                "POST /api/v12/contracts/{id}/tokens/release - Release tokens",
                "GET /api/v12/contracts/{id}/tokens/metrics - Service metrics"
            )
        )).build();
    }
}
