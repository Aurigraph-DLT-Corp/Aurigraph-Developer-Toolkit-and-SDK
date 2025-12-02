package io.aurigraph.v11.marketplace;

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
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Asset Tokenization Marketplace REST API
 *
 * Implements AV11-520: Marketplace Listing & Discovery
 *
 * Provides endpoints for:
 * - Asset browsing and search
 * - Category-based filtering
 * - Favorites/watchlist management
 * - Marketplace statistics
 *
 * @author Backend Development Agent (BDA)
 * @ticket AV11-520
 * @version 11.0.0
 */
@Path("/api/v11/marketplace")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Asset Marketplace API", description = "Real-World Asset tokenization marketplace endpoints")
public class AssetMarketplaceResource {

    private static final Logger LOG = Logger.getLogger(AssetMarketplaceResource.class);

    @Inject
    MarketplaceService marketplaceService;

    // ==================== Search & Browse ====================

    /**
     * Search marketplace assets with filters
     * GET /api/v11/marketplace/assets/search
     */
    @GET
    @Path("/assets/search")
    @Operation(
        summary = "Search marketplace assets",
        description = "Search and filter tokenized assets with keyword, category, price range, and more"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Search results returned successfully",
            content = @Content(schema = @Schema(implementation = MarketplaceService.MarketplaceSearchResponse.class))
        ),
        @APIResponse(responseCode = "400", description = "Invalid search parameters")
    })
    public Uni<MarketplaceService.MarketplaceSearchResponse> searchAssets(
            @QueryParam("keyword") @Parameter(description = "Search keyword") String keyword,
            @QueryParam("category") @Parameter(description = "Asset category filter") String category,
            @QueryParam("minPrice") @Parameter(description = "Minimum price filter") BigDecimal minPrice,
            @QueryParam("maxPrice") @Parameter(description = "Maximum price filter") BigDecimal maxPrice,
            @QueryParam("verification") @Parameter(description = "Verification status: verified, pending, unverified") String verification,
            @QueryParam("location") @Parameter(description = "Location filter") String location,
            @QueryParam("sortBy") @DefaultValue("newest") @Parameter(description = "Sort by: newest, price, popularity, rating") String sortBy,
            @QueryParam("sortOrder") @DefaultValue("desc") @Parameter(description = "Sort order: asc, desc") String sortOrder,
            @QueryParam("offset") @DefaultValue("0") @Parameter(description = "Pagination offset") Integer offset,
            @QueryParam("limit") @DefaultValue("20") @Parameter(description = "Results limit (max 100)") Integer limit,
            @QueryParam("userId") @Parameter(description = "User ID for favorites status") String userId) {

        LOG.infof("GET /api/v11/marketplace/assets/search - keyword=%s, category=%s, minPrice=%s, maxPrice=%s",
                keyword, category, minPrice, maxPrice);

        MarketplaceService.MarketplaceSearchRequest request = new MarketplaceService.MarketplaceSearchRequest();
        request.setKeyword(keyword);
        request.setCategory(category);
        request.setMinPrice(minPrice);
        request.setMaxPrice(maxPrice);
        request.setVerificationStatus(verification);
        request.setLocation(location);
        request.setSortBy(sortBy);
        request.setSortOrder(sortOrder);
        request.setOffset(offset);
        request.setLimit(Math.min(limit, 100));
        request.setUserId(userId);

        return marketplaceService.searchAssets(request);
    }

    /**
     * Get asset details by ID
     * GET /api/v11/marketplace/assets/{assetId}
     */
    @GET
    @Path("/assets/{assetId}")
    @Operation(
        summary = "Get asset details",
        description = "Retrieve detailed information about a specific tokenized asset"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Asset details returned successfully",
            content = @Content(schema = @Schema(implementation = MarketplaceService.AssetListing.class))
        ),
        @APIResponse(responseCode = "404", description = "Asset not found")
    })
    public Uni<Response> getAssetById(
            @PathParam("assetId") @Parameter(description = "Asset ID", required = true) String assetId,
            @QueryParam("userId") @Parameter(description = "User ID for favorites status") String userId) {

        LOG.infof("GET /api/v11/marketplace/assets/%s", assetId);

        return marketplaceService.getAssetById(assetId, userId)
                .map(asset -> {
                    if (asset == null) {
                        return Response.status(Response.Status.NOT_FOUND)
                                .entity(Map.of("error", "Asset not found", "assetId", assetId))
                                .build();
                    }
                    return Response.ok(asset).build();
                });
    }

    /**
     * Get assets by category
     * GET /api/v11/marketplace/assets/category/{category}
     */
    @GET
    @Path("/assets/category/{category}")
    @Operation(
        summary = "Get assets by category",
        description = "Retrieve tokenized assets filtered by category"
    )
    @APIResponse(
        responseCode = "200",
        description = "Category assets returned successfully"
    )
    public Uni<List<MarketplaceService.AssetListing>> getAssetsByCategory(
            @PathParam("category") @Parameter(description = "Category name", required = true) String category,
            @QueryParam("limit") @DefaultValue("20") int limit) {

        LOG.infof("GET /api/v11/marketplace/assets/category/%s (limit=%d)", category, limit);

        return marketplaceService.getAssetsByCategory(category, Math.min(limit, 100));
    }

    /**
     * Get featured/trending assets
     * GET /api/v11/marketplace/assets/featured
     */
    @GET
    @Path("/assets/featured")
    @Operation(
        summary = "Get featured assets",
        description = "Retrieve trending and featured tokenized assets"
    )
    @APIResponse(
        responseCode = "200",
        description = "Featured assets returned successfully"
    )
    public Uni<List<MarketplaceService.AssetListing>> getFeaturedAssets(
            @QueryParam("limit") @DefaultValue("10") int limit) {

        LOG.infof("GET /api/v11/marketplace/assets/featured (limit=%d)", limit);

        return marketplaceService.getFeaturedAssets(Math.min(limit, 50));
    }

    // ==================== Categories ====================

    /**
     * Get all available categories
     * GET /api/v11/marketplace/categories
     */
    @GET
    @Path("/categories")
    @Operation(
        summary = "Get marketplace categories",
        description = "Retrieve all available asset categories with counts"
    )
    @APIResponse(
        responseCode = "200",
        description = "Categories returned successfully"
    )
    public Uni<List<MarketplaceService.CategoryInfo>> getCategories() {
        LOG.info("GET /api/v11/marketplace/categories");
        return marketplaceService.getCategories();
    }

    // ==================== Favorites/Watchlist ====================

    /**
     * Get user's favorite assets
     * GET /api/v11/marketplace/favorites
     */
    @GET
    @Path("/favorites")
    @Operation(
        summary = "Get user favorites",
        description = "Retrieve user's favorited/watchlisted assets"
    )
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Favorites returned successfully"),
        @APIResponse(responseCode = "400", description = "User ID required")
    })
    public Uni<Response> getUserFavorites(
            @QueryParam("userId") @Parameter(description = "User ID", required = true) String userId) {

        LOG.infof("GET /api/v11/marketplace/favorites - userId=%s", userId);

        if (userId == null || userId.isBlank()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "userId parameter is required"))
                    .build()
            );
        }

        return marketplaceService.getUserFavorites(userId)
                .map(favorites -> Response.ok(favorites).build());
    }

    /**
     * Add asset to favorites
     * POST /api/v11/marketplace/favorites/{assetId}
     */
    @POST
    @Path("/favorites/{assetId}")
    @Operation(
        summary = "Add to favorites",
        description = "Add an asset to user's favorites/watchlist"
    )
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Asset added to favorites"),
        @APIResponse(responseCode = "400", description = "Invalid request"),
        @APIResponse(responseCode = "404", description = "Asset not found")
    })
    public Uni<Response> addToFavorites(
            @PathParam("assetId") @Parameter(description = "Asset ID", required = true) String assetId,
            @QueryParam("userId") @Parameter(description = "User ID", required = true) String userId) {

        LOG.infof("POST /api/v11/marketplace/favorites/%s - userId=%s", assetId, userId);

        if (userId == null || userId.isBlank()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "userId parameter is required"))
                    .build()
            );
        }

        return marketplaceService.addToFavorites(userId, assetId)
                .map(success -> {
                    if (success) {
                        return Response.ok(Map.of(
                            "status", "success",
                            "message", "Asset added to favorites",
                            "assetId", assetId
                        )).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity(Map.of("error", "Asset not found", "assetId", assetId))
                            .build();
                    }
                });
    }

    /**
     * Remove asset from favorites
     * DELETE /api/v11/marketplace/favorites/{assetId}
     */
    @DELETE
    @Path("/favorites/{assetId}")
    @Operation(
        summary = "Remove from favorites",
        description = "Remove an asset from user's favorites/watchlist"
    )
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Asset removed from favorites"),
        @APIResponse(responseCode = "400", description = "Invalid request"),
        @APIResponse(responseCode = "404", description = "Asset not in favorites")
    })
    public Uni<Response> removeFromFavorites(
            @PathParam("assetId") @Parameter(description = "Asset ID", required = true) String assetId,
            @QueryParam("userId") @Parameter(description = "User ID", required = true) String userId) {

        LOG.infof("DELETE /api/v11/marketplace/favorites/%s - userId=%s", assetId, userId);

        if (userId == null || userId.isBlank()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "userId parameter is required"))
                    .build()
            );
        }

        return marketplaceService.removeFromFavorites(userId, assetId)
                .map(success -> {
                    if (success) {
                        return Response.ok(Map.of(
                            "status", "success",
                            "message", "Asset removed from favorites",
                            "assetId", assetId
                        )).build();
                    } else {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity(Map.of("error", "Asset not in favorites", "assetId", assetId))
                            .build();
                    }
                });
    }

    // ==================== Statistics ====================

    /**
     * Get marketplace statistics
     * GET /api/v11/marketplace/stats
     */
    @GET
    @Path("/stats")
    @Operation(
        summary = "Get marketplace statistics",
        description = "Retrieve overall marketplace statistics and metrics"
    )
    @APIResponse(
        responseCode = "200",
        description = "Statistics returned successfully",
        content = @Content(schema = @Schema(implementation = MarketplaceService.MarketplaceStats.class))
    )
    public Uni<MarketplaceService.MarketplaceStats> getMarketplaceStats() {
        LOG.info("GET /api/v11/marketplace/stats");
        return marketplaceService.getMarketplaceStats();
    }

    // ==================== Health Check ====================

    /**
     * Marketplace API health check
     * GET /api/v11/marketplace/health
     */
    @GET
    @Path("/health")
    @Operation(
        summary = "Marketplace health check",
        description = "Check the health status of the marketplace API"
    )
    public Uni<Response> healthCheck() {
        return marketplaceService.getMarketplaceStats()
                .map(stats -> Response.ok(Map.of(
                    "status", "UP",
                    "service", "Asset Marketplace API",
                    "totalAssets", stats.getTotalAssets(),
                    "timestamp", stats.getTimestamp()
                )).build())
                .onFailure()
                .recoverWithItem(throwable -> Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of(
                        "status", "DOWN",
                        "service", "Asset Marketplace API",
                        "error", throwable.getMessage()
                    ))
                    .build());
    }
}
