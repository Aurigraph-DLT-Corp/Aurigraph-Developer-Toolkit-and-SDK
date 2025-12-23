package io.aurigraph.v11.tokenization.registry;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.quarkus.logging.Log;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.math.BigDecimal;
import java.util.*;

/**
 * REST Controller for Multi-Asset Class Registry Operations.
 *
 * <p>Provides REST API endpoints for token registration, retrieval, Merkle proofs,
 * and registry analytics. All endpoints follow RESTful conventions and return
 * JSON responses.</p>
 *
 * <h2>Endpoint Categories:</h2>
 * <ul>
 *   <li>Token Registration - Register single and batch tokens</li>
 *   <li>Token Retrieval - Get tokens by ID, class, or owner</li>
 *   <li>Merkle Operations - Generate and verify proofs</li>
 *   <li>Analytics - Registry statistics and distribution metrics</li>
 * </ul>
 *
 * @author Aurigraph DLT Platform - Sprint 8-9
 * @version 12.0.0
 * @since 2025-12-23
 */
@Path("/api/v12/registry")
@Tag(name = "Asset Registry", description = "Multi-Asset Class Registry Operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
public class RegistryController {

    @Inject
    AssetClassRegistry registry;

    @Inject
    RegistryAnalyticsAggregator analytics;

    /**
     * DTO for token registration requests.
     */
    public static class TokenRegistrationRequest {
        public String tokenId;
        public String assetClass;
        public String assetId;
        public BigDecimal valuation;
        public String ownerAddress;
        public Map<String, String> metadata;
    }

    /**
     * DTO for batch registration requests.
     */
    public static class BatchRegistrationRequest {
        public List<TokenRegistrationRequest> tokens;
    }

    /**
     * DTO for proof verification requests.
     */
    public static class ProofVerificationRequest {
        public String tokenId;
        public List<String> proof;
        public String expectedRoot;
    }

    // ==================== Token Registration Endpoints ====================

    /**
     * Registers a new token in the registry.
     */
    @POST
    @Path("/tokens")
    @Operation(summary = "Register Token", description = "Registers a new token in the specified asset class registry")
    @APIResponses({
        @APIResponse(responseCode = "201", description = "Token registered successfully"),
        @APIResponse(responseCode = "400", description = "Invalid token data"),
        @APIResponse(responseCode = "409", description = "Token already exists")
    })
    public Response registerToken(TokenRegistrationRequest request) {
        Log.infof("Registering token: %s", request.tokenId);

        try {
            // Parse asset class
            Optional<AssetClassRegistry.AssetClass> assetClassOpt =
                    AssetClassRegistry.AssetClass.fromCode(request.assetClass);

            if (assetClassOpt.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Invalid asset class: " + request.assetClass))
                        .build();
            }

            AssetClassRegistry.RegisteredToken token = new AssetClassRegistry.RegisteredToken(
                    request.tokenId,
                    assetClassOpt.get(),
                    request.assetId,
                    request.valuation,
                    request.ownerAddress,
                    request.metadata
            );

            AssetClassRegistry.RegistrationResult result = registry.registerToken(token);

            if (result.isSuccess()) {
                analytics.recordRegistration();
                return Response.status(Response.Status.CREATED)
                        .entity(Map.of(
                                "tokenId", result.getTokenId(),
                                "merkleRoot", result.getMerkleRoot(),
                                "processingTimeMs", result.getProcessingTimeMs(),
                                "message", result.getMessage()
                        ))
                        .build();
            } else {
                return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of("error", result.getMessage()))
                        .build();
            }

        } catch (Exception e) {
            Log.errorf("Error registering token: %s", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    /**
     * Registers multiple tokens in a batch operation.
     */
    @POST
    @Path("/tokens/batch")
    @Operation(summary = "Batch Register Tokens", description = "Registers multiple tokens in a single batch operation")
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Batch registration completed"),
        @APIResponse(responseCode = "400", description = "Invalid request data")
    })
    public Response registerTokenBatch(BatchRegistrationRequest request) {
        Log.infof("Batch registering %d tokens", request.tokens.size());

        try {
            List<AssetClassRegistry.RegisteredToken> tokens = new ArrayList<>();

            for (TokenRegistrationRequest req : request.tokens) {
                Optional<AssetClassRegistry.AssetClass> assetClassOpt =
                        AssetClassRegistry.AssetClass.fromCode(req.assetClass);

                if (assetClassOpt.isEmpty()) {
                    continue; // Skip invalid entries
                }

                tokens.add(new AssetClassRegistry.RegisteredToken(
                        req.tokenId, assetClassOpt.get(), req.assetId,
                        req.valuation, req.ownerAddress, req.metadata
                ));
            }

            List<AssetClassRegistry.RegistrationResult> results = registry.registerTokenBatch(tokens);

            long successCount = results.stream().filter(AssetClassRegistry.RegistrationResult::isSuccess).count();

            return Response.ok(Map.of(
                    "totalRequested", request.tokens.size(),
                    "successful", successCount,
                    "failed", results.size() - successCount,
                    "results", results.stream().map(r -> Map.of(
                            "tokenId", r.getTokenId() != null ? r.getTokenId() : "N/A",
                            "success", r.isSuccess(),
                            "message", r.getMessage()
                    )).toList()
            )).build();

        } catch (Exception e) {
            Log.errorf("Error in batch registration: %s", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    // ==================== Token Retrieval Endpoints ====================

    /**
     * Retrieves a token by ID.
     */
    @GET
    @Path("/tokens/{tokenId}")
    @Operation(summary = "Get Token", description = "Retrieves a token by its unique identifier")
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Token found"),
        @APIResponse(responseCode = "404", description = "Token not found")
    })
    public Response getToken(
            @Parameter(description = "Token identifier") @PathParam("tokenId") String tokenId) {

        Optional<AssetClassRegistry.RegisteredToken> tokenOpt = registry.getToken(tokenId);

        if (tokenOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Token not found: " + tokenId))
                    .build();
        }

        AssetClassRegistry.RegisteredToken token = tokenOpt.get();
        return Response.ok(tokenToMap(token)).build();
    }

    /**
     * Retrieves all tokens in an asset class.
     */
    @GET
    @Path("/classes/{assetClass}/tokens")
    @Operation(summary = "Get Tokens by Class", description = "Retrieves all tokens in a specific asset class")
    public Response getTokensByClass(
            @Parameter(description = "Asset class code") @PathParam("assetClass") String assetClass) {

        Optional<AssetClassRegistry.AssetClass> classOpt =
                AssetClassRegistry.AssetClass.fromCode(assetClass);

        if (classOpt.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid asset class: " + assetClass))
                    .build();
        }

        Collection<AssetClassRegistry.RegisteredToken> tokens = registry.getTokensByClass(classOpt.get());

        return Response.ok(Map.of(
                "assetClass", assetClass,
                "count", tokens.size(),
                "tokens", tokens.stream().map(this::tokenToMap).toList()
        )).build();
    }

    /**
     * Retrieves tokens by owner address.
     */
    @GET
    @Path("/owners/{ownerAddress}/tokens")
    @Operation(summary = "Get Tokens by Owner", description = "Retrieves all tokens owned by a specific address")
    public Response getTokensByOwner(
            @Parameter(description = "Owner blockchain address") @PathParam("ownerAddress") String ownerAddress) {

        List<AssetClassRegistry.RegisteredToken> tokens = registry.getTokensByOwner(ownerAddress);

        return Response.ok(Map.of(
                "ownerAddress", ownerAddress,
                "count", tokens.size(),
                "tokens", tokens.stream().map(this::tokenToMap).toList()
        )).build();
    }

    // ==================== Merkle Operations Endpoints ====================

    /**
     * Generates a Merkle proof for a token.
     */
    @GET
    @Path("/tokens/{tokenId}/proof")
    @Operation(summary = "Generate Merkle Proof", description = "Generates a Merkle proof for token inclusion")
    @APIResponses({
        @APIResponse(responseCode = "200", description = "Proof generated"),
        @APIResponse(responseCode = "404", description = "Token not found")
    })
    public Response getMerkleProof(
            @Parameter(description = "Token identifier") @PathParam("tokenId") String tokenId) {

        Optional<List<String>> proofOpt = registry.getMerkleProof(tokenId);

        if (proofOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Token not found: " + tokenId))
                    .build();
        }

        Optional<AssetClassRegistry.RegisteredToken> tokenOpt = registry.getToken(tokenId);
        String merkleRoot = tokenOpt.map(t -> registry.getMerkleRoot(t.getAssetClass())).orElse("");

        return Response.ok(Map.of(
                "tokenId", tokenId,
                "proof", proofOpt.get(),
                "merkleRoot", merkleRoot,
                "proofSize", proofOpt.get().size()
        )).build();
    }

    /**
     * Verifies a Merkle proof.
     */
    @POST
    @Path("/verify-proof")
    @Operation(summary = "Verify Merkle Proof", description = "Verifies a Merkle proof for token inclusion")
    public Response verifyMerkleProof(ProofVerificationRequest request) {
        boolean isValid = registry.verifyMerkleProof(request.tokenId, request.proof);

        return Response.ok(Map.of(
                "tokenId", request.tokenId,
                "valid", isValid,
                "message", isValid ? "Proof verified successfully" : "Proof verification failed"
        )).build();
    }

    /**
     * Gets the Merkle root for an asset class.
     */
    @GET
    @Path("/classes/{assetClass}/merkle-root")
    @Operation(summary = "Get Merkle Root", description = "Returns the current Merkle root for an asset class")
    public Response getMerkleRoot(
            @Parameter(description = "Asset class code") @PathParam("assetClass") String assetClass) {

        Optional<AssetClassRegistry.AssetClass> classOpt =
                AssetClassRegistry.AssetClass.fromCode(assetClass);

        if (classOpt.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid asset class: " + assetClass))
                    .build();
        }

        return Response.ok(Map.of(
                "assetClass", assetClass,
                "merkleRoot", registry.getMerkleRoot(classOpt.get()),
                "tokenCount", registry.getTokenCount(classOpt.get())
        )).build();
    }

    // ==================== Analytics Endpoints ====================

    /**
     * Returns comprehensive registry analytics.
     */
    @GET
    @Path("/analytics")
    @Operation(summary = "Get Analytics", description = "Returns comprehensive analytics for all registries")
    public Response getAnalytics(
            @Parameter(description = "Force cache refresh") @QueryParam("refresh") @DefaultValue("false") boolean refresh) {

        RegistryAnalyticsAggregator.RegistryAnalyticsSnapshot snapshot = analytics.computeAnalytics(refresh);

        return Response.ok(Map.of(
                "timestamp", snapshot.getTimestamp().toString(),
                "totalTokens", snapshot.getTotalTokens(),
                "totalValueLocked", snapshot.getTotalValueLocked(),
                "computationTimeMs", snapshot.getComputationTimeMs(),
                "classAnalytics", snapshot.getClassAnalytics(),
                "distribution", snapshot.getDistribution(),
                "health", snapshot.getHealth()
        )).build();
    }

    /**
     * Returns registry statistics.
     */
    @GET
    @Path("/stats")
    @Operation(summary = "Get Statistics", description = "Returns summary statistics for all registries")
    public Response getStatistics() {
        Map<AssetClassRegistry.AssetClass, AssetClassRegistry.RegistryStatistics> stats = registry.getStatistics();

        return Response.ok(Map.of(
                "totalTokens", registry.getTotalTokenCount(),
                "totalValueLocked", registry.getTotalValueLocked(),
                "assetClasses", stats.entrySet().stream().map(e -> Map.of(
                        "class", e.getKey().name(),
                        "code", e.getKey().getCode(),
                        "tokenCount", e.getValue().getTokenCount(),
                        "totalValue", e.getValue().getTotalValue(),
                        "merkleRoot", e.getValue().getMerkleRoot()
                )).toList()
        )).build();
    }

    /**
     * Lists all supported asset classes.
     */
    @GET
    @Path("/classes")
    @Operation(summary = "List Asset Classes", description = "Returns all supported asset classes")
    public Response listAssetClasses() {
        return Response.ok(Map.of(
                "assetClasses", Arrays.stream(AssetClassRegistry.AssetClass.values())
                        .map(ac -> Map.of(
                                "name", ac.name(),
                                "code", ac.getCode(),
                                "displayName", ac.getDisplayName(),
                                "baseTransactionFee", ac.getBaseTransactionFee()
                        )).toList()
        )).build();
    }

    // ==================== Helper Methods ====================

    private Map<String, Object> tokenToMap(AssetClassRegistry.RegisteredToken token) {
        Map<String, Object> map = new HashMap<>();
        map.put("tokenId", token.getTokenId());
        map.put("assetClass", token.getAssetClass().name());
        map.put("assetId", token.getAssetId());
        map.put("valuation", token.getValuation());
        map.put("ownerAddress", token.getOwnerAddress());
        map.put("registrationTime", token.getRegistrationTime().toString());
        map.put("merkleLeafHash", token.getMerkleLeafHash());
        map.put("verified", token.isVerified());
        map.put("metadata", token.getMetadata());
        return map;
    }
}
