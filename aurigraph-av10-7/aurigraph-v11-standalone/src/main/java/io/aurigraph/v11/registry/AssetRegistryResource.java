package io.aurigraph.v11.registry;

import io.aurigraph.v11.registry.dto.AssetRegistrationRequest;
import io.aurigraph.v11.registry.dto.AssetUpdateRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.util.*;

/**
 * REST API for Asset Registry operations.
 * Provides endpoints for registering, managing, and querying assets.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
@Path("/api/v11/registry")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Asset Registry", description = "Asset registration and lifecycle management")
public class AssetRegistryResource {

    private static final Logger LOG = Logger.getLogger(AssetRegistryResource.class);

    @Inject
    AssetRegistryService registryService;

    /**
     * Register a new asset.
     */
    @POST
    @Path("/assets")
    @Operation(summary = "Register new asset", description = "Register a new asset for tokenization")
    @APIResponse(responseCode = "201", description = "Asset registered successfully")
    @APIResponse(responseCode = "400", description = "Invalid request")
    public Response registerAsset(@Valid AssetRegistrationRequest request) {
        LOG.infof("Registering asset: %s", request.name);

        try {
            RegisteredAsset asset = registryService.registerAsset(
                    request.name,
                    request.description,
                    request.category,
                    request.ownerId,
                    request.ownerName,
                    request.estimatedValue,
                    request.currency,
                    request.location,
                    request.countryCode,
                    request.metadata
            );

            return Response.status(Response.Status.CREATED)
                    .entity(Map.of(
                            "success", true,
                            "message", "Asset registered successfully",
                            "asset", toDTO(asset)
                    ))
                    .build();
        } catch (Exception e) {
            LOG.errorf("Failed to register asset: %s", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Get asset by ID.
     */
    @GET
    @Path("/assets/{id}")
    @Operation(summary = "Get asset by ID", description = "Retrieve asset details by UUID")
    @APIResponse(responseCode = "200", description = "Asset found")
    @APIResponse(responseCode = "404", description = "Asset not found")
    public Response getAsset(
            @PathParam("id") @Parameter(description = "Asset UUID") UUID id) {

        return registryService.getAssetById(id)
                .map(asset -> Response.ok(Map.of(
                        "success", true,
                        "asset", toDTO(asset)
                )).build())
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("success", false, "error", "Asset not found"))
                        .build());
    }

    /**
     * Update an existing asset.
     */
    @PUT
    @Path("/assets/{id}")
    @Operation(summary = "Update asset", description = "Update an existing asset (only in DRAFT or REJECTED status)")
    @APIResponse(responseCode = "200", description = "Asset updated")
    @APIResponse(responseCode = "400", description = "Cannot update asset in current status")
    @APIResponse(responseCode = "404", description = "Asset not found")
    public Response updateAsset(
            @PathParam("id") UUID id,
            @Valid AssetUpdateRequest request) {

        try {
            RegisteredAsset asset = registryService.updateAsset(
                    id,
                    request.name,
                    request.description,
                    request.estimatedValue,
                    request.location,
                    request.countryCode,
                    request.metadata
            );

            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset updated successfully",
                    "asset", toDTO(asset)
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Delete (soft) an asset.
     */
    @DELETE
    @Path("/assets/{id}")
    @Operation(summary = "Delete asset", description = "Soft delete an asset")
    @APIResponse(responseCode = "200", description = "Asset deleted")
    @APIResponse(responseCode = "404", description = "Asset not found")
    public Response deleteAsset(@PathParam("id") UUID id) {
        try {
            registryService.deleteAsset(id);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset deleted successfully"
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * List assets with filters and pagination.
     */
    @GET
    @Path("/assets")
    @Operation(summary = "List assets", description = "List assets with optional filters and pagination")
    @APIResponse(responseCode = "200", description = "List of assets")
    public Response listAssets(
            @QueryParam("category") @Parameter(description = "Filter by category") AssetCategory category,
            @QueryParam("status") @Parameter(description = "Filter by status") AssetStatus status,
            @QueryParam("ownerId") @Parameter(description = "Filter by owner") String ownerId,
            @QueryParam("page") @DefaultValue("0") @Parameter(description = "Page number") int page,
            @QueryParam("size") @DefaultValue("20") @Parameter(description = "Page size") int size) {

        List<RegisteredAsset> assets = registryService.listAssets(category, status, ownerId, page, size);
        long total = registryService.countAssets(category, status, ownerId);

        List<Map<String, Object>> dtos = assets.stream()
                .map(this::toDTO)
                .toList();

        return Response.ok(Map.of(
                "success", true,
                "assets", dtos,
                "total", total,
                "page", page,
                "size", size,
                "totalPages", (total + size - 1) / size
        )).build();
    }

    /**
     * Get assets for current owner.
     */
    @GET
    @Path("/my-assets")
    @Operation(summary = "Get my assets", description = "Get assets owned by specified user")
    @APIResponse(responseCode = "200", description = "List of owned assets")
    public Response getMyAssets(
            @QueryParam("ownerId") @Parameter(description = "Owner ID") String ownerId,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        if (ownerId == null || ownerId.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", "Owner ID is required"))
                    .build();
        }

        List<RegisteredAsset> assets = registryService.getAssetsByOwner(ownerId, page, size);
        long total = RegisteredAsset.countByOwner(ownerId);

        return Response.ok(Map.of(
                "success", true,
                "assets", assets.stream().map(this::toDTO).toList(),
                "total", total
        )).build();
    }

    /**
     * Get all asset categories.
     */
    @GET
    @Path("/categories")
    @Operation(summary = "List categories", description = "Get all available asset categories")
    @APIResponse(responseCode = "200", description = "List of categories")
    public Response getCategories() {
        List<Map<String, String>> categories = Arrays.stream(AssetCategory.values())
                .map(c -> Map.of(
                        "name", c.name(),
                        "displayName", c.getDisplayName(),
                        "description", c.getDescription(),
                        "code", c.getCode()
                ))
                .toList();

        return Response.ok(Map.of(
                "success", true,
                "categories", categories
        )).build();
    }

    /**
     * Get all asset statuses.
     */
    @GET
    @Path("/statuses")
    @Operation(summary = "List statuses", description = "Get all asset lifecycle statuses")
    @APIResponse(responseCode = "200", description = "List of statuses")
    public Response getStatuses() {
        List<Map<String, Object>> statuses = Arrays.stream(AssetStatus.values())
                .map(s -> Map.<String, Object>of(
                        "name", s.name(),
                        "displayName", s.getDisplayName(),
                        "description", s.getDescription(),
                        "terminal", s.isTerminal()
                ))
                .toList();

        return Response.ok(Map.of(
                "success", true,
                "statuses", statuses
        )).build();
    }

    /**
     * Submit asset for verification.
     */
    @POST
    @Path("/assets/{id}/submit")
    @Operation(summary = "Submit for verification", description = "Submit asset for third-party verification")
    @APIResponse(responseCode = "200", description = "Asset submitted")
    @APIResponse(responseCode = "400", description = "Cannot submit from current status")
    public Response submitForVerification(@PathParam("id") UUID id) {
        try {
            RegisteredAsset asset = registryService.submitForVerification(id);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset submitted for verification",
                    "asset", toDTO(asset)
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Mark asset as verified.
     */
    @POST
    @Path("/assets/{id}/verify")
    @Operation(summary = "Verify asset", description = "Mark asset as verified by verifier")
    @APIResponse(responseCode = "200", description = "Asset verified")
    public Response verifyAsset(
            @PathParam("id") UUID id,
            @QueryParam("verifierId") String verifierId) {
        try {
            RegisteredAsset asset = registryService.markVerified(id, verifierId);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset verified successfully",
                    "asset", toDTO(asset)
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Reject asset verification.
     */
    @POST
    @Path("/assets/{id}/reject")
    @Operation(summary = "Reject verification", description = "Reject asset verification with reason")
    @APIResponse(responseCode = "200", description = "Asset rejected")
    public Response rejectVerification(
            @PathParam("id") UUID id,
            @QueryParam("verifierId") String verifierId,
            @QueryParam("reason") String reason) {
        try {
            RegisteredAsset asset = registryService.rejectVerification(id, verifierId, reason);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset verification rejected",
                    "asset", toDTO(asset)
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * List asset for sale.
     */
    @POST
    @Path("/assets/{id}/list")
    @Operation(summary = "List for sale", description = "List verified asset for sale on marketplace")
    @APIResponse(responseCode = "200", description = "Asset listed")
    public Response listForSale(
            @PathParam("id") UUID id,
            @QueryParam("price") BigDecimal price) {
        try {
            RegisteredAsset asset = registryService.listForSale(id, price);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset listed for sale",
                    "asset", toDTO(asset)
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Mark asset as sold.
     */
    @POST
    @Path("/assets/{id}/sell")
    @Operation(summary = "Mark as sold", description = "Mark listed asset as sold")
    @APIResponse(responseCode = "200", description = "Asset marked as sold")
    public Response markSold(
            @PathParam("id") UUID id,
            @QueryParam("buyerId") String buyerId,
            @QueryParam("price") BigDecimal price) {
        try {
            RegisteredAsset asset = registryService.markSold(id, buyerId, price);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset sold successfully",
                    "asset", toDTO(asset)
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Archive an asset.
     */
    @POST
    @Path("/assets/{id}/archive")
    @Operation(summary = "Archive asset", description = "Archive an asset")
    @APIResponse(responseCode = "200", description = "Asset archived")
    public Response archiveAsset(@PathParam("id") UUID id) {
        try {
            RegisteredAsset asset = registryService.archive(id);
            return Response.ok(Map.of(
                    "success", true,
                    "message", "Asset archived",
                    "asset", toDTO(asset)
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Get registry statistics.
     */
    @GET
    @Path("/stats")
    @Operation(summary = "Get statistics", description = "Get asset registry statistics")
    @APIResponse(responseCode = "200", description = "Registry statistics")
    public Response getStats() {
        return Response.ok(Map.of(
                "success", true,
                "byCategory", registryService.getStatsByCategory(),
                "byStatus", registryService.getStatsByStatus()
        )).build();
    }

    /**
     * Convert entity to DTO map.
     */
    private Map<String, Object> toDTO(RegisteredAsset asset) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", asset.id.toString());
        dto.put("name", asset.name);
        dto.put("description", asset.description);
        dto.put("category", asset.category.name());
        dto.put("categoryDisplayName", asset.category.getDisplayName());
        dto.put("status", asset.status.name());
        dto.put("statusDisplayName", asset.status.getDisplayName());
        dto.put("ownerId", asset.ownerId);
        dto.put("ownerName", asset.ownerName);
        dto.put("estimatedValue", asset.estimatedValue);
        dto.put("currency", asset.currency);
        dto.put("location", asset.location);
        dto.put("countryCode", asset.countryCode);
        dto.put("metadata", asset.metadata);
        dto.put("tokenId", asset.tokenId);
        dto.put("contractId", asset.contractId);
        dto.put("transactionId", asset.transactionId);
        dto.put("verifierId", asset.verifierId);
        dto.put("verifiedAt", asset.verifiedAt);
        dto.put("listedAt", asset.listedAt);
        dto.put("listingPrice", asset.listingPrice);
        dto.put("soldAt", asset.soldAt);
        dto.put("buyerId", asset.buyerId);
        dto.put("salePrice", asset.salePrice);
        dto.put("documentCount", asset.documentCount);
        dto.put("imageCount", asset.imageCount);
        dto.put("createdAt", asset.createdAt);
        dto.put("updatedAt", asset.updatedAt);
        return dto;
    }
}
