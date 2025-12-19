package io.aurigraph.v11.registries.secondary;

import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import io.quarkus.logging.Log;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * Secondary Token Registry REST API
 *
 * Provides endpoints for registering and managing secondary tokens (fractional shares).
 * Secondary tokens derive from primary tokens and represent fractional ownership
 * or specific aspects of the underlying asset.
 *
 * Token Types:
 * - VALUATION: Market value representation
 * - COMPLIANCE: Regulatory compliance status
 * - OWNERSHIP: Fractional ownership shares
 * - YIELD: Revenue/dividend distribution
 * - COLLATERAL: Collateralization status
 *
 * Base Path: /api/v12/registries/secondary
 *
 * @version 12.0.0
 * @since 2025-12-18
 */
@Path("/api/v12/registries/secondary")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@PermitAll
@Tag(name = "Secondary Token Registry", description = "Secondary token registration and fractional share management")
public class SecondaryTokenRegistryResource {

    @ConfigProperty(name = "aurigraph.rwa.verification.mode", defaultValue = "OPTIONAL")
    String verificationMode;

    // In-memory registry for secondary tokens (production would use persistent storage)
    private static final Map<String, SecondaryTokenEntry> secondaryTokenRegistry = new HashMap<>();

    /**
     * Register a new secondary token
     *
     * POST /api/v12/registries/secondary/register
     */
    @POST
    @Path("/register")
    @Operation(
        summary = "Register secondary token",
        description = "Register a new secondary token (fractional share) linked to a primary token"
    )
    @APIResponse(responseCode = "201", description = "Secondary token registered successfully")
    @APIResponse(responseCode = "400", description = "Invalid request or primary token not found")
    public Response registerSecondaryToken(SecondaryTokenRegistrationRequest request) {
        Log.infof("Registering secondary token for primary: %s", request.primaryTokenId);

        try {
            // Validate request
            if (request.primaryTokenId == null || request.primaryTokenId.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", "Primary token ID is required"))
                    .build();
            }

            if (request.tokenType == null || request.tokenType.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("success", false, "error", "Token type is required"))
                    .build();
            }

            // Check verification mode - verification is OPTIONAL by default
            boolean requiresVerification = "MANDATORY".equalsIgnoreCase(verificationMode);

            if (requiresVerification && !request.isVerified) {
                Log.warnf("Verification required but not provided for secondary token registration");
                // Still allow registration but flag as unverified
            }

            // Generate token ID
            String tokenId = generateSecondaryTokenId(request.primaryTokenId, request.tokenType);

            // Create secondary token entry
            SecondaryTokenEntry entry = new SecondaryTokenEntry(
                tokenId,
                request.primaryTokenId,
                request.compositeTokenId,
                request.tokenType,
                request.name,
                request.description,
                request.totalShares != null ? request.totalShares : 100,
                request.sharePrice != null ? request.sharePrice : BigDecimal.ZERO,
                request.ownerId,
                request.metadata != null ? request.metadata : new HashMap<>(),
                request.isVerified,
                verificationMode
            );

            // Store in registry
            secondaryTokenRegistry.put(tokenId, entry);

            Log.infof("✅ Secondary token registered: %s (type: %s, verification: %s)",
                tokenId, request.tokenType, verificationMode);

            return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "message", "Secondary token registered successfully",
                    "tokenId", tokenId,
                    "primaryTokenId", request.primaryTokenId,
                    "tokenType", request.tokenType,
                    "verificationMode", verificationMode,
                    "isVerified", request.isVerified,
                    "registeredAt", Instant.now().toString()
                ))
                .build();

        } catch (Exception e) {
            Log.errorf("Failed to register secondary token: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get secondary token by ID
     *
     * GET /api/v12/registries/secondary/{tokenId}
     */
    @GET
    @Path("/{tokenId}")
    @Operation(summary = "Get secondary token", description = "Retrieve secondary token details by ID")
    @APIResponse(responseCode = "200", description = "Secondary token found")
    @APIResponse(responseCode = "404", description = "Secondary token not found")
    public Response getSecondaryToken(
            @PathParam("tokenId") @Parameter(description = "Secondary token ID") String tokenId) {

        SecondaryTokenEntry entry = secondaryTokenRegistry.get(tokenId);

        if (entry == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("success", false, "error", "Secondary token not found: " + tokenId))
                .build();
        }

        return Response.ok(Map.of(
            "success", true,
            "token", entry.toMap()
        )).build();
    }

    /**
     * List secondary tokens for a primary token
     *
     * GET /api/v12/registries/secondary/by-primary/{primaryTokenId}
     */
    @GET
    @Path("/by-primary/{primaryTokenId}")
    @Operation(summary = "List secondary tokens", description = "List all secondary tokens for a primary token")
    @APIResponse(responseCode = "200", description = "List of secondary tokens")
    public Response listByPrimaryToken(
            @PathParam("primaryTokenId") String primaryTokenId,
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset) {

        List<Map<String, Object>> tokens = secondaryTokenRegistry.values().stream()
            .filter(e -> e.primaryTokenId.equals(primaryTokenId))
            .skip(offset)
            .limit(limit)
            .map(SecondaryTokenEntry::toMap)
            .toList();

        return Response.ok(Map.of(
            "success", true,
            "primaryTokenId", primaryTokenId,
            "tokens", tokens,
            "count", tokens.size(),
            "limit", limit,
            "offset", offset
        )).build();
    }

    /**
     * List secondary tokens by type
     *
     * GET /api/v12/registries/secondary/by-type/{tokenType}
     */
    @GET
    @Path("/by-type/{tokenType}")
    @Operation(summary = "List by type", description = "List secondary tokens by token type")
    @APIResponse(responseCode = "200", description = "List of secondary tokens")
    public Response listByType(
            @PathParam("tokenType") String tokenType,
            @QueryParam("limit") @DefaultValue("50") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset) {

        List<Map<String, Object>> tokens = secondaryTokenRegistry.values().stream()
            .filter(e -> e.tokenType.equalsIgnoreCase(tokenType))
            .skip(offset)
            .limit(limit)
            .map(SecondaryTokenEntry::toMap)
            .toList();

        return Response.ok(Map.of(
            "success", true,
            "tokenType", tokenType,
            "tokens", tokens,
            "count", tokens.size()
        )).build();
    }

    /**
     * Update secondary token
     *
     * PUT /api/v12/registries/secondary/{tokenId}
     */
    @PUT
    @Path("/{tokenId}")
    @Operation(summary = "Update secondary token", description = "Update secondary token details")
    @APIResponse(responseCode = "200", description = "Token updated")
    @APIResponse(responseCode = "404", description = "Token not found")
    public Response updateSecondaryToken(
            @PathParam("tokenId") String tokenId,
            Map<String, Object> updates) {

        SecondaryTokenEntry entry = secondaryTokenRegistry.get(tokenId);

        if (entry == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("success", false, "error", "Secondary token not found"))
                .build();
        }

        // Apply updates to metadata
        if (updates != null) {
            entry.metadata.putAll(updates);
            entry.updatedAt = Instant.now();
        }

        Log.infof("✅ Secondary token updated: %s", tokenId);

        return Response.ok(Map.of(
            "success", true,
            "message", "Secondary token updated",
            "tokenId", tokenId,
            "updatedAt", entry.updatedAt.toString()
        )).build();
    }

    /**
     * Transfer secondary token shares
     *
     * POST /api/v12/registries/secondary/{tokenId}/transfer
     */
    @POST
    @Path("/{tokenId}/transfer")
    @Operation(summary = "Transfer shares", description = "Transfer secondary token shares to another owner")
    @APIResponse(responseCode = "200", description = "Shares transferred")
    public Response transferShares(
            @PathParam("tokenId") String tokenId,
            ShareTransferRequest request) {

        SecondaryTokenEntry entry = secondaryTokenRegistry.get(tokenId);

        if (entry == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("success", false, "error", "Secondary token not found"))
                .build();
        }

        // Validate transfer
        if (request.shares <= 0 || request.shares > entry.totalShares) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("success", false, "error", "Invalid share amount"))
                .build();
        }

        // Record transfer (in production, this would update ownership ledger)
        String transferId = "TXF-" + UUID.randomUUID().toString().substring(0, 8);

        Log.infof("✅ Share transfer: %d shares from %s to %s (token: %s)",
            request.shares, request.fromAddress, request.toAddress, tokenId);

        return Response.ok(Map.of(
            "success", true,
            "message", "Shares transferred successfully",
            "transferId", transferId,
            "tokenId", tokenId,
            "shares", request.shares,
            "fromAddress", request.fromAddress,
            "toAddress", request.toAddress,
            "timestamp", Instant.now().toString()
        )).build();
    }

    /**
     * Get secondary token types
     *
     * GET /api/v12/registries/secondary/types
     */
    @GET
    @Path("/types")
    @Operation(summary = "Get token types", description = "List available secondary token types")
    @APIResponse(responseCode = "200", description = "List of token types")
    public Response getTokenTypes() {
        List<Map<String, String>> types = List.of(
            Map.of("id", "VALUATION", "name", "Valuation Token", "description", "Represents market value"),
            Map.of("id", "COMPLIANCE", "name", "Compliance Token", "description", "Regulatory compliance status"),
            Map.of("id", "OWNERSHIP", "name", "Ownership Token", "description", "Fractional ownership shares"),
            Map.of("id", "YIELD", "name", "Yield Token", "description", "Revenue/dividend distribution"),
            Map.of("id", "COLLATERAL", "name", "Collateral Token", "description", "Collateralization status"),
            Map.of("id", "VERIFICATION", "name", "Verification Token", "description", "Third-party verification status"),
            Map.of("id", "MEDIA", "name", "Media Token", "description", "Associated media and documents"),
            Map.of("id", "LEGAL", "name", "Legal Token", "description", "Legal agreements and terms")
        );

        return Response.ok(Map.of(
            "success", true,
            "types", types,
            "count", types.size()
        )).build();
    }

    /**
     * Get registry statistics
     *
     * GET /api/v12/registries/secondary/stats
     */
    @GET
    @Path("/stats")
    @Operation(summary = "Get statistics", description = "Get secondary token registry statistics")
    @APIResponse(responseCode = "200", description = "Registry statistics")
    public Response getStats() {
        Map<String, Long> byType = new HashMap<>();
        long totalVerified = 0;
        long totalUnverified = 0;

        for (SecondaryTokenEntry entry : secondaryTokenRegistry.values()) {
            byType.merge(entry.tokenType, 1L, Long::sum);
            if (entry.isVerified) {
                totalVerified++;
            } else {
                totalUnverified++;
            }
        }

        return Response.ok(Map.of(
            "success", true,
            "totalTokens", secondaryTokenRegistry.size(),
            "byType", byType,
            "verified", totalVerified,
            "unverified", totalUnverified,
            "verificationMode", verificationMode
        )).build();
    }

    /**
     * Health check
     *
     * GET /api/v12/registries/secondary/health
     */
    @GET
    @Path("/health")
    @Operation(summary = "Health check", description = "Check secondary token registry health")
    @APIResponse(responseCode = "200", description = "Service is healthy")
    public Response health() {
        return Response.ok(Map.of(
            "status", "UP",
            "service", "Secondary Token Registry",
            "version", "12.0.0",
            "verificationMode", verificationMode,
            "totalTokens", secondaryTokenRegistry.size()
        )).build();
    }

    // ==================== Helper Methods ====================

    private String generateSecondaryTokenId(String primaryTokenId, String tokenType) {
        String uniquePart = UUID.randomUUID().toString().substring(0, 8);
        return String.format("SEC-%s-%s-%s",
            primaryTokenId.substring(Math.max(0, primaryTokenId.length() - 6)),
            tokenType.substring(0, Math.min(3, tokenType.length())).toUpperCase(),
            uniquePart
        );
    }

    // ==================== Data Classes ====================

    /**
     * Secondary token registration request
     */
    public static class SecondaryTokenRegistrationRequest {
        public String primaryTokenId;
        public String compositeTokenId;
        public String tokenType;
        public String name;
        public String description;
        public Integer totalShares;
        public BigDecimal sharePrice;
        public String ownerId;
        public Map<String, Object> metadata;
        public boolean isVerified = false;
    }

    /**
     * Share transfer request
     */
    public static class ShareTransferRequest {
        public String fromAddress;
        public String toAddress;
        public int shares;
    }

    /**
     * Secondary token registry entry
     */
    public static class SecondaryTokenEntry {
        public final String tokenId;
        public final String primaryTokenId;
        public final String compositeTokenId;
        public final String tokenType;
        public final String name;
        public final String description;
        public final int totalShares;
        public final BigDecimal sharePrice;
        public final String ownerId;
        public final Map<String, Object> metadata;
        public final boolean isVerified;
        public final String verificationMode;
        public final Instant createdAt;
        public Instant updatedAt;

        public SecondaryTokenEntry(
                String tokenId,
                String primaryTokenId,
                String compositeTokenId,
                String tokenType,
                String name,
                String description,
                int totalShares,
                BigDecimal sharePrice,
                String ownerId,
                Map<String, Object> metadata,
                boolean isVerified,
                String verificationMode) {
            this.tokenId = tokenId;
            this.primaryTokenId = primaryTokenId;
            this.compositeTokenId = compositeTokenId;
            this.tokenType = tokenType;
            this.name = name;
            this.description = description;
            this.totalShares = totalShares;
            this.sharePrice = sharePrice;
            this.ownerId = ownerId;
            this.metadata = metadata;
            this.isVerified = isVerified;
            this.verificationMode = verificationMode;
            this.createdAt = Instant.now();
            this.updatedAt = Instant.now();
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("tokenId", tokenId);
            map.put("primaryTokenId", primaryTokenId);
            map.put("compositeTokenId", compositeTokenId);
            map.put("tokenType", tokenType);
            map.put("name", name);
            map.put("description", description);
            map.put("totalShares", totalShares);
            map.put("sharePrice", sharePrice);
            map.put("ownerId", ownerId);
            map.put("metadata", metadata);
            map.put("isVerified", isVerified);
            map.put("verificationMode", verificationMode);
            map.put("createdAt", createdAt.toString());
            map.put("updatedAt", updatedAt.toString());
            return map;
        }
    }
}
