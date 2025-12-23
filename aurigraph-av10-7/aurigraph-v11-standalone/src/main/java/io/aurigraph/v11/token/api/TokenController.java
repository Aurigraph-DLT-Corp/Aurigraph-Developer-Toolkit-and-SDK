package io.aurigraph.v11.token.api;

import io.aurigraph.v11.contracts.models.AssetType;
import io.aurigraph.v11.token.api.TokenMarketService.*;
import io.aurigraph.v11.token.hybrid.HybridTokenService;
import io.aurigraph.v11.token.hybrid.HybridTokenService.*;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * TokenController - REST API endpoints for token operations.
 *
 * Provides comprehensive REST API for:
 * - Token CRUD operations
 * - Token transfers and burns
 * - Primary market offerings
 * - Secondary market trading
 * - Search, filter, sort, pagination
 *
 * Security:
 * - Rate limiting via @RateLimited annotation (when enabled)
 * - Authentication via JWT (when enabled)
 * - Input validation
 *
 * @author Aurigraph V12 Token Team
 * @version 1.0
 * @since Sprint 12-13
 */
@Path("/api/v12/tokens")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Token API", description = "Comprehensive token management endpoints")
public class TokenController {

    @Inject
    HybridTokenService hybridTokenService;

    @Inject
    TokenMarketService marketService;

    // ==========================================
    // TOKEN CRUD OPERATIONS
    // ==========================================

    @POST
    @Operation(summary = "Create a new hybrid token",
            description = "Create a new ERC-1400/3643 compliant hybrid token")
    @APIResponses({
            @APIResponse(responseCode = "201", description = "Token created successfully",
                    content = @Content(schema = @Schema(implementation = HybridToken.class))),
            @APIResponse(responseCode = "400", description = "Invalid request"),
            @APIResponse(responseCode = "409", description = "Token already exists")
    })
    public Uni<Response> createToken(@Valid CreateTokenRequest request) {
        Log.infof("POST /tokens - Creating token %s", request.symbol());

        return hybridTokenService.createToken(new CreateHybridTokenRequest(
                        request.name(),
                        request.symbol(),
                        request.description(),
                        request.decimals(),
                        request.assetType(),
                        TokenStandard.ERC_1400,  // Default standard
                        request.totalSupply(),
                        request.issuer(),
                        request.issuer(),  // Use issuer as issuerName
                        request.jurisdiction(),
                        request.complianceFramework(),
                        true,  // isMintable
                        true,  // isBurnable
                        false, // isPausable
                        false, // isControllable
                        false, // kycRequired
                        false, // accreditedOnly
                        null,  // maxHolders
                        request.metadata()
                ))
                .map(token -> Response.status(Response.Status.CREATED).entity(token).build())
                .onFailure().recoverWithItem(e -> {
                    Log.errorf(e, "Failed to create token");
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(Map.of("error", e.getMessage())).build();
                });
    }

    @GET
    @Path("/{tokenId}")
    @Operation(summary = "Get token by ID",
            description = "Retrieve detailed token information by token ID")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "Token found",
                    content = @Content(schema = @Schema(implementation = HybridToken.class))),
            @APIResponse(responseCode = "404", description = "Token not found")
    })
    public Uni<Response> getToken(
            @Parameter(description = "Token identifier", required = true)
            @PathParam("tokenId") String tokenId) {

        Log.debugf("GET /tokens/%s", tokenId);

        return hybridTokenService.getToken(tokenId)
                .map(optToken -> optToken
                        .map(token -> Response.ok(token).build())
                        .orElse(Response.status(Response.Status.NOT_FOUND)
                                .entity(Map.of("error", "Token not found: " + tokenId)).build()));
    }

    @GET
    @Operation(summary = "List all tokens",
            description = "List all tokens with optional pagination")
    public Uni<Response> listTokens(
            @Parameter(description = "Page number (0-based)")
            @QueryParam("page") @DefaultValue("0") @Min(0) int page,
            @Parameter(description = "Page size")
            @QueryParam("pageSize") @DefaultValue("20") @Min(1) int pageSize) {

        Log.debugf("GET /tokens - page=%d, pageSize=%d", page, pageSize);

        return hybridTokenService.getAllTokens()
                .map(tokens -> {
                    int start = page * pageSize;
                    int end = Math.min(start + pageSize, tokens.size());
                    List<HybridToken> paged = start < tokens.size() ?
                            tokens.subList(start, end) : List.of();

                    return Response.ok(Map.of(
                            "tokens", paged,
                            "totalCount", tokens.size(),
                            "page", page,
                            "pageSize", pageSize,
                            "totalPages", (int) Math.ceil((double) tokens.size() / pageSize)
                    )).build();
                });
    }

    @GET
    @Path("/search")
    @Operation(summary = "Search tokens",
            description = "Search tokens with filtering, sorting, and pagination")
    public Uni<Response> searchTokens(
            @Parameter(description = "Keyword to search in name/symbol")
            @QueryParam("keyword") String keyword,
            @Parameter(description = "Filter by asset types (comma-separated)")
            @QueryParam("assetTypes") String assetTypes,
            @Parameter(description = "Filter by statuses (comma-separated)")
            @QueryParam("statuses") String statuses,
            @Parameter(description = "Filter by jurisdiction")
            @QueryParam("jurisdiction") String jurisdiction,
            @Parameter(description = "Filter by issuer ID")
            @QueryParam("issuerId") String issuerId,
            @Parameter(description = "Sort field")
            @QueryParam("sortBy") @DefaultValue("CREATED_AT") TokenSortField sortBy,
            @Parameter(description = "Sort ascending")
            @QueryParam("ascending") @DefaultValue("false") boolean ascending,
            @Parameter(description = "Page number")
            @QueryParam("page") @DefaultValue("0") @Min(0) int page,
            @Parameter(description = "Page size")
            @QueryParam("pageSize") @DefaultValue("20") @Min(1) int pageSize) {

        Log.debugf("GET /tokens/search - keyword=%s, page=%d", keyword, page);

        List<AssetType> assetTypeList = assetTypes != null && !assetTypes.isEmpty() ?
                List.of(assetTypes.split(",")).stream()
                        .map(String::trim)
                        .map(AssetType::valueOf)
                        .toList() : null;

        List<TokenStatus> statusList = statuses != null && !statuses.isEmpty() ?
                List.of(statuses.split(",")).stream()
                        .map(String::trim)
                        .map(TokenStatus::valueOf)
                        .toList() : null;

        TokenSearchQuery query = new TokenSearchQuery(
                keyword,
                assetTypeList,
                statusList,
                jurisdiction,
                issuerId,
                null,
                sortBy,
                ascending,
                page,
                pageSize
        );

        return marketService.searchTokens(query)
                .map(result -> Response.ok(result).build());
    }

    // ==========================================
    // TOKEN TRANSFER OPERATIONS (DISABLED - methods not yet in HybridTokenService)
    // ==========================================
    // TODO: Implement transfer, mint, burn in HybridTokenService
    /*
    @POST
    @Path("/{tokenId}/transfer")
    ... (transfer method disabled)

    @POST
    @Path("/{tokenId}/mint")
    ... (mint method disabled)

    @POST
    @Path("/{tokenId}/burn")
    ... (burn method disabled)
    */

    // ==========================================
    // TOKEN STATUS OPERATIONS (DISABLED - methods not yet in HybridTokenService)
    // ==========================================
    // TODO: Implement pause, unpause in HybridTokenService
    /*
    @POST
    @Path("/{tokenId}/pause")
    ... (pause method disabled)

    @POST
    @Path("/{tokenId}/unpause")
    ... (unpause method disabled)
    */

    // ==========================================
    // BALANCE OPERATIONS (PARTIAL - getHolders disabled)
    // ==========================================

    @GET
    @Path("/{tokenId}/balance/{holder}")
    @Operation(summary = "Get token balance",
            description = "Get token balance for a specific holder")
    public Uni<Response> getBalance(
            @PathParam("tokenId") String tokenId,
            @PathParam("holder") String holder) {

        Log.debugf("GET /tokens/%s/balance/%s", tokenId, holder);

        return hybridTokenService.balanceOf(tokenId, holder)
                .map(balance -> Response.ok(Map.of(
                        "tokenId", tokenId,
                        "holder", holder,
                        "balance", balance
                )).build());
    }

    // TODO: Implement getHolders in HybridTokenService
    /*
    @GET
    @Path("/{tokenId}/holders")
    ... (getHolders method disabled - HolderBalance class missing)
    */

    // ==========================================
    // PRIMARY MARKET OPERATIONS
    // ==========================================

    @POST
    @Path("/offerings")
    @Operation(summary = "Create token offering",
            description = "Create a new primary market token offering")
    public Uni<Response> createOffering(@Valid CreateOfferingApiRequest request) {
        Log.infof("POST /tokens/offerings - %s for token %s", request.name(), request.tokenId());

        return marketService.createOffering(new CreateOfferingRequest(
                        request.tokenId(),
                        request.offeringType(),
                        request.name(),
                        request.description(),
                        request.pricePerToken(),
                        request.minInvestment(),
                        request.maxInvestment(),
                        request.softCap(),
                        request.hardCap(),
                        request.startDate(),
                        request.endDate(),
                        request.vestingSchedule(),
                        request.eligibilityCriteria(),
                        request.issuer(),
                        request.metadata()
                ))
                .map(offering -> Response.status(Response.Status.CREATED).entity(offering).build())
                .onFailure().recoverWithItem(e -> {
                    Log.errorf(e, "Failed to create offering");
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(Map.of("error", e.getMessage())).build();
                });
    }

    @POST
    @Path("/offerings/{offeringId}/activate")
    @Operation(summary = "Activate offering",
            description = "Activate a token offering to make it live")
    public Uni<Response> activateOffering(
            @PathParam("offeringId") String offeringId,
            @QueryParam("issuer") @NotBlank String issuer) {

        Log.infof("POST /tokens/offerings/%s/activate by %s", offeringId, issuer);

        return marketService.activateOffering(offeringId, issuer)
                .map(offering -> Response.ok(offering).build())
                .onFailure().recoverWithItem(e -> {
                    Log.errorf(e, "Failed to activate offering");
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(Map.of("error", e.getMessage())).build();
                });
    }

    @POST
    @Path("/offerings/{offeringId}/subscribe")
    @Operation(summary = "Subscribe to offering",
            description = "Subscribe to a primary market token offering")
    public Uni<Response> subscribeToOffering(
            @PathParam("offeringId") String offeringId,
            @Valid SubscribeRequest request) {

        Log.infof("POST /tokens/offerings/%s/subscribe - investor=%s, amount=%s",
                offeringId, request.investor(), request.amount());

        return marketService.subscribeToOffering(new SubscriptionRequest(
                        offeringId,
                        request.investor(),
                        request.amount()
                ))
                .map(subscription -> Response.ok(subscription).build())
                .onFailure().recoverWithItem(e -> {
                    Log.errorf(e, "Failed to subscribe");
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(Map.of("error", e.getMessage())).build();
                });
    }

    @GET
    @Path("/offerings")
    @Operation(summary = "Search offerings",
            description = "Search primary market offerings with filtering")
    public Uni<Response> searchOfferings(
            @QueryParam("tokenId") String tokenId,
            @QueryParam("statuses") String statuses,
            @QueryParam("issuerId") String issuerId,
            @QueryParam("sortBy") @DefaultValue("CREATED_AT") OfferingSortField sortBy,
            @QueryParam("ascending") @DefaultValue("false") boolean ascending,
            @QueryParam("page") @DefaultValue("0") @Min(0) int page,
            @QueryParam("pageSize") @DefaultValue("20") @Min(1) int pageSize) {

        Log.debugf("GET /tokens/offerings - tokenId=%s, page=%d", tokenId, page);

        List<OfferingStatus> statusList = statuses != null && !statuses.isEmpty() ?
                List.of(statuses.split(",")).stream()
                        .map(String::trim)
                        .map(OfferingStatus::valueOf)
                        .toList() : null;

        OfferingSearchQuery query = new OfferingSearchQuery(
                tokenId,
                statusList,
                null,
                issuerId,
                null,
                null,
                sortBy,
                ascending,
                page,
                pageSize
        );

        return marketService.searchOfferings(query)
                .map(result -> Response.ok(result).build());
    }

    // ==========================================
    // SECONDARY MARKET OPERATIONS
    // ==========================================

    @POST
    @Path("/{tokenId}/orders")
    @Operation(summary = "Place order",
            description = "Place a buy or sell order on the secondary market")
    public Uni<Response> placeOrder(
            @PathParam("tokenId") String tokenId,
            @Valid PlaceOrderApiRequest request) {

        Log.infof("POST /tokens/%s/orders - %s %s at %s",
                tokenId, request.orderSide(), request.quantity(), request.price());

        return marketService.placeOrder(new PlaceOrderRequest(
                        tokenId,
                        request.trader(),
                        request.orderType(),
                        request.orderSide(),
                        request.price(),
                        request.quantity(),
                        request.timeInForce(),
                        request.expiresAt()
                ))
                .map(order -> Response.status(Response.Status.CREATED).entity(order).build())
                .onFailure().recoverWithItem(e -> {
                    Log.errorf(e, "Failed to place order");
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(Map.of("error", e.getMessage())).build();
                });
    }

    @DELETE
    @Path("/orders/{orderId}")
    @Operation(summary = "Cancel order",
            description = "Cancel an open order")
    public Uni<Response> cancelOrder(
            @PathParam("orderId") String orderId,
            @QueryParam("trader") @NotBlank String trader) {

        Log.infof("DELETE /tokens/orders/%s by %s", orderId, trader);

        return marketService.cancelOrder(orderId, trader)
                .map(order -> Response.ok(order).build())
                .onFailure().recoverWithItem(e -> {
                    Log.errorf(e, "Failed to cancel order");
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(Map.of("error", e.getMessage())).build();
                });
    }

    @GET
    @Path("/{tokenId}/orderbook")
    @Operation(summary = "Get order book",
            description = "Get the order book for a token")
    public Uni<Response> getOrderBook(
            @PathParam("tokenId") String tokenId,
            @QueryParam("depth") @DefaultValue("10") @Min(1) int depth) {

        Log.debugf("GET /tokens/%s/orderbook - depth=%d", tokenId, depth);

        return marketService.getOrderBook(tokenId, depth)
                .map(book -> Response.ok(book).build());
    }

    @GET
    @Path("/{tokenId}/market")
    @Operation(summary = "Get market data",
            description = "Get market data for a token")
    public Uni<Response> getMarketData(@PathParam("tokenId") String tokenId) {
        Log.debugf("GET /tokens/%s/market", tokenId);

        return marketService.getMarketData(tokenId)
                .map(data -> Response.ok(data).build());
    }

    @GET
    @Path("/trades")
    @Operation(summary = "Search trades",
            description = "Search trade history with filtering")
    public Uni<Response> searchTrades(
            @QueryParam("tokenId") String tokenId,
            @QueryParam("traderId") String traderId,
            @QueryParam("fromDate") String fromDate,
            @QueryParam("toDate") String toDate,
            @QueryParam("minValue") BigDecimal minValue,
            @QueryParam("ascending") @DefaultValue("false") boolean ascending,
            @QueryParam("page") @DefaultValue("0") @Min(0) int page,
            @QueryParam("pageSize") @DefaultValue("50") @Min(1) int pageSize) {

        Log.debugf("GET /tokens/trades - tokenId=%s, traderId=%s, page=%d", tokenId, traderId, page);

        TradeSearchQuery query = new TradeSearchQuery(
                tokenId,
                traderId,
                fromDate != null ? Instant.parse(fromDate) : null,
                toDate != null ? Instant.parse(toDate) : null,
                minValue,
                ascending,
                page,
                pageSize
        );

        return marketService.searchTrades(query)
                .map(result -> Response.ok(result).build());
    }

    // ==========================================
    // REQUEST/RESPONSE RECORDS
    // ==========================================

    public record CreateTokenRequest(
            @NotBlank String name,
            @NotBlank String symbol,
            String description,
            @NotNull AssetType assetType,
            @NotNull BigDecimal totalSupply,
            int decimals,
            String jurisdiction,
            String complianceFramework,
            @NotBlank String issuer,
            Map<String, Object> metadata
    ) {}

    public record TransferRequest(
            @NotBlank String from,
            @NotBlank String to,
            @NotNull BigDecimal amount
    ) {}

    public record MintRequest(
            @NotBlank String to,
            @NotNull BigDecimal amount,
            @NotBlank String issuer
    ) {}

    public record BurnRequest(
            @NotBlank String from,
            @NotNull BigDecimal amount
    ) {}

    public record CreateOfferingApiRequest(
            @NotBlank String tokenId,
            @NotNull OfferingType offeringType,
            @NotBlank String name,
            String description,
            @NotNull BigDecimal pricePerToken,
            @NotNull BigDecimal minInvestment,
            @NotNull BigDecimal maxInvestment,
            @NotNull BigDecimal softCap,
            @NotNull BigDecimal hardCap,
            @NotNull Instant startDate,
            @NotNull Instant endDate,
            String vestingSchedule,
            String eligibilityCriteria,
            @NotBlank String issuer,
            Map<String, Object> metadata
    ) {}

    public record SubscribeRequest(
            @NotBlank String investor,
            @NotNull BigDecimal amount
    ) {}

    public record PlaceOrderApiRequest(
            @NotBlank String trader,
            @NotNull OrderType orderType,
            @NotNull OrderSide orderSide,
            @NotNull BigDecimal price,
            @NotNull BigDecimal quantity,
            TimeInForce timeInForce,
            Instant expiresAt
    ) {}
}
