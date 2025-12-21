package io.aurigraph.v11.rest;

import io.aurigraph.v11.contracts.TokenBindingService;
import io.aurigraph.v11.contracts.TokenBindingService.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Token Binding REST API Resource
 *
 * Provides REST endpoints for managing token bindings to ActiveContracts:
 * - Primary asset token bindings
 * - Secondary token bindings (revenue shares, royalties)
 * - Composite token bindings
 * - Token ownership verification
 * - Token locking and release operations
 *
 * @version 12.0.0
 * @since 2025-12-21
 */
@Path("/api/v12/token-bindings")
@ApplicationScoped
@Tag(name = "Token Binding API", description = "Token binding operations for ActiveContracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TokenBindingResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(TokenBindingResource.class);

    @Inject
    TokenBindingService tokenBindingService;

    // ==================== BIND TOKEN TO CONTRACT ====================

    /**
     * Bind a token to a contract
     *
     * POST /api/v12/token-bindings/contract/{contractId}/bind
     *
     * @param contractId Contract ID
     * @param request Bind request containing token details
     * @return TokenBinding result
     */
    @POST
    @Path("/contract/{contractId}/bind")
    @Operation(
        summary = "Bind token to contract",
        description = "Bind a primary or secondary token to an ActiveContract. For primary tokens, ownership percentage is 100%. For secondary tokens, specify the percentage share."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Token bound successfully",
            content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = TokenBinding.class))
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request - missing required fields or invalid percentage"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found"
        )
    })
    public Uni<Response> bindTokenToContract(
            @Parameter(description = "Contract ID to bind the token to", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(description = "Token binding request", required = true)
            BindTokenRequest request
    ) {
        LOGGER.info("REST: Bind token to contract {} - token: {}, type: {}",
            contractId, request.tokenId(), request.tokenType());

        if (request.tokenId() == null || request.tokenId().trim().isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Token ID is required"))
                .build());
        }

        TokenType tokenType = parseTokenType(request.tokenType());

        return switch (tokenType) {
            case PRIMARY -> tokenBindingService.bindPrimaryToken(
                    contractId, request.tokenId(), request.stakeholder())
                .map(binding -> Response.ok(buildBindingResponse(binding)).build())
                .onFailure().recoverWithItem(error -> handleError("Bind primary token failed", error));

            case SECONDARY -> {
                BigDecimal percentage = request.percentage() != null ? request.percentage() : BigDecimal.valueOf(10);
                yield tokenBindingService.bindSecondaryToken(
                        contractId, request.tokenId(), request.stakeholder(), percentage)
                    .map(binding -> Response.ok(buildBindingResponse(binding)).build())
                    .onFailure().recoverWithItem(error -> handleError("Bind secondary token failed", error));
            }

            default -> tokenBindingService.bindPrimaryToken(
                    contractId, request.tokenId(), request.stakeholder())
                .map(binding -> Response.ok(buildBindingResponse(binding)).build())
                .onFailure().recoverWithItem(error -> handleError("Bind token failed", error));
        };
    }

    // ==================== GET BINDINGS FOR CONTRACT ====================

    /**
     * Get all token bindings for a contract
     *
     * GET /api/v12/token-bindings/contract/{contractId}
     *
     * @param contractId Contract ID
     * @param tokenType Optional filter by token type
     * @return List of token bindings
     */
    @GET
    @Path("/contract/{contractId}")
    @Operation(
        summary = "Get token bindings for contract",
        description = "Retrieve all token bindings associated with a specific contract. Optionally filter by token type."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Token bindings retrieved successfully"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found"
        )
    })
    public Uni<Response> getContractBindings(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @Parameter(description = "Filter by token type (PRIMARY, SECONDARY, COMPOSITE, GOVERNANCE, UTILITY, SECURITY)")
            @QueryParam("type") String tokenType
    ) {
        LOGGER.info("REST: Get bindings for contract {} - type filter: {}", contractId, tokenType);

        Uni<List<TokenBinding>> bindingsUni;

        if (tokenType != null && !tokenType.isEmpty()) {
            TokenType type = parseTokenType(tokenType);
            bindingsUni = tokenBindingService.getTokenBindingsByType(contractId, type);
        } else {
            bindingsUni = tokenBindingService.getTokenBindings(contractId);
        }

        return bindingsUni
            .map(bindings -> Response.ok(Map.of(
                "contractId", contractId,
                "bindings", bindings.stream().map(this::buildBindingResponse).collect(Collectors.toList()),
                "count", bindings.size(),
                "timestamp", Instant.now().toString()
            )).build())
            .onFailure().recoverWithItem(error -> handleError("Get contract bindings failed", error));
    }

    // ==================== UNBIND TOKEN FROM CONTRACT ====================

    /**
     * Unbind a token from a contract
     *
     * DELETE /api/v12/token-bindings/contract/{contractId}/token/{tokenId}
     *
     * @param contractId Contract ID
     * @param tokenId Token ID to unbind
     * @return Success response
     */
    @DELETE
    @Path("/contract/{contractId}/token/{tokenId}")
    @Operation(
        summary = "Unbind token from contract",
        description = "Remove a token binding from an ActiveContract. Token must not be locked."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Token unbound successfully"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Cannot unbind locked token"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Binding not found"
        )
    })
    public Uni<Response> unbindToken(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @Parameter(description = "Token ID to unbind", required = true)
            @PathParam("tokenId") String tokenId
    ) {
        LOGGER.info("REST: Unbind token {} from contract {}", tokenId, contractId);

        // Get bindings and filter out the specified token
        return tokenBindingService.getTokenBindings(contractId)
            .map(bindings -> {
                // Find the binding to remove
                TokenBinding bindingToRemove = bindings.stream()
                    .filter(b -> tokenId.equals(b.getTokenId()))
                    .findFirst()
                    .orElse(null);

                if (bindingToRemove == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Token binding not found"))
                        .build();
                }

                if (bindingToRemove.getStatus() == BindingStatus.LOCKED) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Cannot unbind locked token"))
                        .build();
                }

                // Mark as revoked
                bindingToRemove.setStatus(BindingStatus.REVOKED);
                bindingToRemove.setUpdatedAt(Instant.now());

                return Response.ok(Map.of(
                    "success", true,
                    "message", "Token unbound successfully",
                    "contractId", contractId,
                    "tokenId", tokenId,
                    "timestamp", Instant.now().toString()
                )).build();
            })
            .onFailure().recoverWithItem(error -> handleError("Unbind token failed", error));
    }

    // ==================== GET CONTRACTS BOUND TO TOKEN ====================

    /**
     * Get all contracts bound to a specific token
     *
     * GET /api/v12/token-bindings/token/{tokenId}
     *
     * @param tokenId Token ID
     * @return List of contracts with this token binding
     */
    @GET
    @Path("/token/{tokenId}")
    @Operation(
        summary = "Get contracts bound to token",
        description = "Retrieve all contracts that have a binding to the specified token"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Contract list retrieved successfully"
        )
    })
    public Uni<Response> getTokenContracts(
            @Parameter(description = "Token ID", required = true)
            @PathParam("tokenId") String tokenId
    ) {
        LOGGER.info("REST: Get contracts for token {}", tokenId);

        // This would require a reverse lookup - for now, return the token info
        // In production, implement a secondary index for token -> contracts
        Map<String, Object> response = new HashMap<>();
        response.put("tokenId", tokenId);
        response.put("contracts", List.of()); // Would be populated from reverse index
        response.put("message", "Token reverse lookup - implement secondary index for production");
        response.put("timestamp", Instant.now().toString());

        return Uni.createFrom().item(Response.ok(response).build());
    }

    // ==================== CREATE COMPOSITE BINDING ====================

    /**
     * Create a composite token binding
     *
     * POST /api/v12/token-bindings/contract/{contractId}/composite
     *
     * @param contractId Contract ID
     * @param request Composite binding request
     * @return TokenBinding result
     */
    @POST
    @Path("/contract/{contractId}/composite")
    @Operation(
        summary = "Create composite token binding",
        description = "Bind a composite token (bundle of multiple tokens) to an ActiveContract"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Composite token bound successfully",
            content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = TokenBinding.class))
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request - missing required fields or empty component list"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found"
        )
    })
    public Uni<Response> createCompositeBinding(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(description = "Composite binding request", required = true)
            CompositeBindRequest request
    ) {
        LOGGER.info("REST: Create composite binding for contract {} - token: {}, components: {}",
            contractId, request.compositeTokenId(),
            request.componentTokens() != null ? request.componentTokens().size() : 0);

        if (request.compositeTokenId() == null || request.compositeTokenId().trim().isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Composite token ID is required"))
                .build());
        }

        if (request.componentTokens() == null || request.componentTokens().isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Component tokens list is required and cannot be empty"))
                .build());
        }

        return tokenBindingService.bindCompositeToken(
                contractId, request.compositeTokenId(), request.componentTokens())
            .map(binding -> Response.ok(buildBindingResponse(binding)).build())
            .onFailure().recoverWithItem(error -> handleError("Create composite binding failed", error));
    }

    // ==================== VERIFY TOKEN OWNERSHIP ====================

    /**
     * Verify token ownership for a contract party
     *
     * POST /api/v12/token-bindings/contract/{contractId}/verify
     *
     * @param contractId Contract ID
     * @param request Verification request
     * @return Ownership verification result
     */
    @POST
    @Path("/contract/{contractId}/verify")
    @Operation(
        summary = "Verify token ownership",
        description = "Verify that a party owns the required tokens for a contract"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Verification completed"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request"
        )
    })
    public Uni<Response> verifyOwnership(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId,
            @RequestBody(description = "Verification request", required = true)
            VerifyOwnershipRequest request
    ) {
        LOGGER.info("REST: Verify ownership for party {} in contract {}", request.partyId(), contractId);

        if (request.partyId() == null || request.partyId().trim().isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Party ID is required"))
                .build());
        }

        return tokenBindingService.verifyTokenOwnership(contractId, request.partyId())
            .map(verification -> Response.ok(Map.of(
                "contractId", verification.contractId(),
                "partyId", verification.partyId(),
                "verified", verification.verified(),
                "message", verification.message(),
                "tokenResults", verification.tokenResults(),
                "timestamp", verification.timestamp().toString()
            )).build())
            .onFailure().recoverWithItem(error -> handleError("Verify ownership failed", error));
    }

    // ==================== LOCK TOKENS ====================

    /**
     * Lock all tokens bound to a contract
     *
     * POST /api/v12/token-bindings/contract/{contractId}/lock
     *
     * @param contractId Contract ID
     * @return Lock result
     */
    @POST
    @Path("/contract/{contractId}/lock")
    @Operation(
        summary = "Lock contract tokens",
        description = "Lock all tokens bound to a contract for contract execution"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Tokens locked successfully"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Lock operation failed"
        )
    })
    public Uni<Response> lockTokens(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId
    ) {
        LOGGER.info("REST: Lock tokens for contract {}", contractId);

        return tokenBindingService.lockTokens(contractId)
            .map(result -> Response.ok(Map.of(
                "contractId", result.contractId(),
                "success", result.success(),
                "message", result.message(),
                "lockedTokenIds", result.lockedTokenIds(),
                "timestamp", result.timestamp().toString()
            )).build())
            .onFailure().recoverWithItem(error -> handleError("Lock tokens failed", error));
    }

    // ==================== RELEASE TOKENS ====================

    /**
     * Release all locked tokens for a contract
     *
     * POST /api/v12/token-bindings/contract/{contractId}/release
     *
     * @param contractId Contract ID
     * @return Release result
     */
    @POST
    @Path("/contract/{contractId}/release")
    @Operation(
        summary = "Release contract tokens",
        description = "Release all locked tokens for a contract after execution"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Tokens released successfully"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Release operation failed"
        )
    })
    public Uni<Response> releaseTokens(
            @Parameter(description = "Contract ID", required = true)
            @PathParam("contractId") String contractId
    ) {
        LOGGER.info("REST: Release tokens for contract {}", contractId);

        return tokenBindingService.releaseTokens(contractId)
            .map(result -> Response.ok(Map.of(
                "contractId", result.contractId(),
                "success", result.success(),
                "message", result.message(),
                "releasedTokenIds", result.releasedTokenIds(),
                "timestamp", result.timestamp().toString()
            )).build())
            .onFailure().recoverWithItem(error -> handleError("Release tokens failed", error));
    }

    // ==================== BINDING STATISTICS ====================

    /**
     * Get token binding statistics
     *
     * GET /api/v12/token-bindings/status
     *
     * @return Binding statistics and metrics
     */
    @GET
    @Path("/status")
    @Operation(
        summary = "Get binding statistics",
        description = "Retrieve token binding service statistics and metrics"
    )
    @APIResponse(
        responseCode = "200",
        description = "Statistics retrieved successfully"
    )
    public Response getBindingStatus() {
        LOGGER.info("REST: Get token binding status");

        Map<String, Object> metrics = tokenBindingService.getMetrics();

        Map<String, Object> response = new HashMap<>();
        response.put("status", "OPERATIONAL");
        response.put("version", "12.0.0");
        response.put("service", "TokenBindingService");
        response.put("metrics", metrics);
        response.put("supportedTokenTypes", List.of(
            "PRIMARY", "SECONDARY", "COMPOSITE", "GOVERNANCE", "UTILITY", "SECURITY"
        ));
        response.put("supportedBindingStatuses", List.of(
            "PENDING", "ACTIVE", "LOCKED", "RELEASED", "REVOKED"
        ));
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    // ==================== HEALTH CHECK ====================

    /**
     * Health check endpoint
     *
     * GET /api/v12/token-bindings/health
     *
     * @return Health status
     */
    @GET
    @Path("/health")
    @Operation(
        summary = "Health check",
        description = "Check the health status of the Token Binding service"
    )
    @APIResponse(
        responseCode = "200",
        description = "Service is healthy"
    )
    public Response healthCheck() {
        LOGGER.debug("REST: Health check");

        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "TokenBindingResource");
        health.put("version", "12.0.0");
        health.put("timestamp", Instant.now().toString());

        return Response.ok(health).build();
    }

    // ==================== HELPER METHODS ====================

    private TokenType parseTokenType(String type) {
        if (type == null || type.isEmpty()) {
            return TokenType.PRIMARY;
        }
        try {
            return TokenType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            LOGGER.warn("Unknown token type: {}, defaulting to PRIMARY", type);
            return TokenType.PRIMARY;
        }
    }

    private Map<String, Object> buildBindingResponse(TokenBinding binding) {
        Map<String, Object> response = new HashMap<>();
        response.put("bindingId", binding.getBindingId());
        response.put("contractId", binding.getContractId());
        response.put("tokenId", binding.getTokenId());
        response.put("tokenType", binding.getTokenType().name());
        response.put("stakeholder", binding.getStakeholder());
        response.put("percentage", binding.getPercentage());
        response.put("status", binding.getStatus().name());
        response.put("createdAt", binding.getCreatedAt() != null ? binding.getCreatedAt().toString() : null);
        response.put("updatedAt", binding.getUpdatedAt() != null ? binding.getUpdatedAt().toString() : null);

        if (binding.getComponentTokens() != null && !binding.getComponentTokens().isEmpty()) {
            response.put("componentTokens", binding.getComponentTokens());
        }

        if (binding.getLockedAt() != null) {
            response.put("lockedAt", binding.getLockedAt().toString());
        }

        if (binding.getReleasedAt() != null) {
            response.put("releasedAt", binding.getReleasedAt().toString());
        }

        return response;
    }

    private Response handleError(String operation, Throwable error) {
        LOGGER.error("{}: {}", operation, error.getMessage());

        if (error instanceof TokenBindingException) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of(
                    "error", error.getMessage(),
                    "operation", operation,
                    "timestamp", Instant.now().toString()
                ))
                .build();
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(Map.of(
                "error", "Internal server error: " + error.getMessage(),
                "operation", operation,
                "timestamp", Instant.now().toString()
            ))
            .build();
    }

    // ==================== REQUEST/RESPONSE RECORDS ====================

    /**
     * Bind token request
     */
    public record BindTokenRequest(
        String tokenId,
        String tokenType,
        String stakeholder,
        BigDecimal percentage
    ) {}
}
