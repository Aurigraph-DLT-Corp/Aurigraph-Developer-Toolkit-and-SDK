package io.aurigraph.v11.api;

import io.aurigraph.v11.token.secondary.SecondaryToken;
import io.aurigraph.v11.token.secondary.SecondaryTokenService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Secondary Token REST API - Sprint 1 Story 3 Implementation
 *
 * Provides REST endpoints for secondary token operations:
 * - Creation (income stream, collateral, royalty)
 * - Retrieval (by ID, by parent, by owner)
 * - Lifecycle (activate, redeem, transfer, expire)
 * - Bulk operations
 *
 * Base Path: /api/v12/secondary-tokens
 *
 * Performance:
 * - Single token creation: < 50ms
 * - Bulk creation (100 tokens): < 100ms
 * - Token retrieval: < 5ms
 *
 * @author Composite Token System - Sprint 1 Story 3
 * @version 1.0
 * @since Sprint 1 Story 3 (Week 2)
 */
@ApplicationScoped
@Path("/api/v12/secondary-tokens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Secondary Token API", description = "Secondary token creation, lifecycle, and management")
public class SecondaryTokenResource {

    @Inject
    SecondaryTokenService service;

    /**
     * Create an income stream token
     */
    @POST
    @Path("/income-stream")
    @Operation(summary = "Create income stream token",
               description = "Create a new income stream token from a parent primary token")
    public Uni<Response> createIncomeStreamToken(@Valid CreateIncomeStreamRequest request) {
        return service.createIncomeStreamToken(
                request.parentTokenId,
                request.faceValue,
                request.owner,
                request.revenueShare,
                request.frequency
        ).map(token -> Response.status(Response.Status.CREATED)
                .entity(new TokenResponse(token))
                .build());
    }

    /**
     * Create a collateral token
     */
    @POST
    @Path("/collateral")
    @Operation(summary = "Create collateral token",
               description = "Create a new collateral token from a parent primary token")
    public Uni<Response> createCollateralToken(@Valid CreateCollateralRequest request) {
        return service.createCollateralToken(
                request.parentTokenId,
                request.faceValue,
                request.owner,
                request.expiresAt
        ).map(token -> Response.status(Response.Status.CREATED)
                .entity(new TokenResponse(token))
                .build());
    }

    /**
     * Create a royalty token
     */
    @POST
    @Path("/royalty")
    @Operation(summary = "Create royalty token",
               description = "Create a new royalty token from a parent primary token")
    public Uni<Response> createRoyaltyToken(@Valid CreateRoyaltyRequest request) {
        return service.createRoyaltyToken(
                request.parentTokenId,
                request.faceValue,
                request.owner,
                request.revenueShare
        ).map(token -> Response.status(Response.Status.CREATED)
                .entity(new TokenResponse(token))
                .build());
    }

    /**
     * Get a secondary token by ID
     */
    @GET
    @Path("/{tokenId}")
    @Operation(summary = "Get secondary token",
               description = "Retrieve a secondary token by ID")
    public Uni<Response> getToken(@PathParam("tokenId") @NotBlank String tokenId) {
        return service.getToken(tokenId)
                .map(token -> Response.ok(new TokenResponse(token)).build())
                .onFailure().recoverWithItem(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Token not found: " + tokenId))
                        .build());
    }

    /**
     * Get all tokens by parent
     */
    @GET
    @Path("/parent/{parentId}")
    @Operation(summary = "Get tokens by parent",
               description = "Retrieve all secondary tokens for a parent primary token")
    public Uni<Response> getByParent(@PathParam("parentId") @NotBlank String parentId) {
        return service.getTokensByParent(parentId)
                .map(tokens -> {
                    List<TokenResponse> responses = tokens.stream()
                            .map(TokenResponse::new)
                            .toList();
                    return Response.ok(new TokenListResponse(responses)).build();
                });
    }

    /**
     * Activate a secondary token
     */
    @POST
    @Path("/{tokenId}/activate")
    @Operation(summary = "Activate token",
               description = "Transition token from CREATED to ACTIVE")
    public Uni<Response> activateToken(@PathParam("tokenId") @NotBlank String tokenId,
                                       @Valid ActivateRequest request) {
        return service.activateToken(tokenId, request.actor)
                .map(token -> Response.ok(new TokenResponse(token)).build())
                .onFailure().recoverWithItem(response ->
                        Response.status(Response.Status.BAD_REQUEST)
                                .entity(new ErrorResponse(response.getMessage()))
                                .build());
    }

    /**
     * Redeem a secondary token
     */
    @POST
    @Path("/{tokenId}/redeem")
    @Operation(summary = "Redeem token",
               description = "Transition token from ACTIVE to REDEEMED")
    public Uni<Response> redeemToken(@PathParam("tokenId") @NotBlank String tokenId,
                                     @Valid RedeemRequest request) {
        return service.redeemToken(tokenId, request.actor)
                .map(token -> Response.ok(new TokenResponse(token)).build())
                .onFailure().recoverWithItem(response ->
                        Response.status(Response.Status.BAD_REQUEST)
                                .entity(new ErrorResponse(response.getMessage()))
                                .build());
    }

    /**
     * Transfer a secondary token
     */
    @POST
    @Path("/{tokenId}/transfer")
    @Operation(summary = "Transfer token",
               description = "Transfer token ownership to a new owner")
    public Uni<Response> transferToken(@PathParam("tokenId") @NotBlank String tokenId,
                                       @Valid TransferRequest request) {
        return service.transferToken(tokenId, request.fromOwner, request.toOwner)
                .map(token -> Response.ok(new TokenResponse(token)).build())
                .onFailure().recoverWithItem(response ->
                        Response.status(Response.Status.BAD_REQUEST)
                                .entity(new ErrorResponse(response.getMessage()))
                                .build());
    }

    /**
     * Expire a secondary token
     */
    @POST
    @Path("/{tokenId}/expire")
    @Operation(summary = "Expire token",
               description = "Transition token from ACTIVE to EXPIRED")
    public Uni<Response> expireToken(@PathParam("tokenId") @NotBlank String tokenId,
                                     @Valid ExpireRequest request) {
        return service.expireToken(tokenId, request.reason)
                .map(token -> Response.ok(new TokenResponse(token)).build())
                .onFailure().recoverWithItem(response ->
                        Response.status(Response.Status.BAD_REQUEST)
                                .entity(new ErrorResponse(response.getMessage()))
                                .build());
    }

    /**
     * Bulk create secondary tokens
     */
    @POST
    @Path("/bulk-create")
    @Operation(summary = "Bulk create tokens",
               description = "Create multiple secondary tokens in a single operation")
    public Uni<Response> bulkCreate(@Valid BulkCreateRequest request) {
        return service.bulkCreate(request.requests)
                .map(result -> Response.status(Response.Status.CREATED)
                        .entity(new BulkOperationResponse(
                                result.successCount,
                                result.errorCount,
                                result.created.stream().map(TokenResponse::new).toList(),
                                result.errors
                        ))
                        .build());
    }

    // =============== REQUEST DTOs ===============

    public static class CreateIncomeStreamRequest {
        public String parentTokenId;
        public BigDecimal faceValue;
        public String owner;
        public BigDecimal revenueShare;
        public SecondaryToken.DistributionFrequency frequency;
    }

    public static class CreateCollateralRequest {
        public String parentTokenId;
        public BigDecimal faceValue;
        public String owner;
        public Instant expiresAt;
    }

    public static class CreateRoyaltyRequest {
        public String parentTokenId;
        public BigDecimal faceValue;
        public String owner;
        public BigDecimal revenueShare;
    }

    public static class ActivateRequest {
        public String actor;
    }

    public static class RedeemRequest {
        public String actor;
    }

    public static class TransferRequest {
        public String fromOwner;
        public String toOwner;
    }

    public static class ExpireRequest {
        public String reason;
    }

    public static class BulkCreateRequest {
        public List<SecondaryTokenService.CreateTokenRequest> requests;
    }

    // =============== RESPONSE DTOs ===============

    public static class TokenResponse {
        public String tokenId;
        public String parentTokenId;
        public String owner;
        public String tokenType;
        public String status;
        public BigDecimal faceValue;
        public Instant createdAt;

        public TokenResponse(SecondaryToken token) {
            this.tokenId = token.tokenId;
            this.parentTokenId = token.parentTokenId;
            this.owner = token.owner;
            this.tokenType = token.tokenType != null ? token.tokenType.toString() : null;
            this.status = token.status != null ? token.status.toString() : null;
            this.faceValue = token.faceValue;
            this.createdAt = token.createdAt;
        }
    }

    public static class TokenListResponse {
        public List<TokenResponse> tokens;
        public int count;

        public TokenListResponse(List<TokenResponse> tokens) {
            this.tokens = tokens;
            this.count = tokens.size();
        }
    }

    public static class BulkOperationResponse {
        public int successCount;
        public int errorCount;
        public List<TokenResponse> created;
        public List<String> errors;

        public BulkOperationResponse(int successCount, int errorCount,
                                    List<TokenResponse> created, List<String> errors) {
            this.successCount = successCount;
            this.errorCount = errorCount;
            this.created = created;
            this.errors = errors;
        }
    }

    public static class ErrorResponse {
        public String error;
        public long timestamp;

        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
