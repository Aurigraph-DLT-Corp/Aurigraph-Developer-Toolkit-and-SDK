package io.aurigraph.v11.storage;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

/**
 * REST API for Quantum-Encrypted LevelDB Service
 *
 * Provides endpoints for:
 * - Node database initialization
 * - Data operations (get, put, delete)
 * - Authentication token management
 * - Service status and metrics
 *
 * All data operations require node authentication using Kyber-based tokens.
 *
 * @version 1.0.0 (Dec 8, 2025)
 */
@Path("/api/v11/storage")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LevelDBResource {

    private static final Logger LOG = Logger.getLogger(LevelDBResource.class);

    @Inject
    QuantumLevelDBService levelDbService;

    @Inject
    LevelDBKeyManager keyManager;

    // ==========================================================================
    // Node Management
    // ==========================================================================

    /**
     * Initialize a new node database
     */
    @POST
    @Path("/nodes/{nodeId}/init")
    public Uni<Response> initializeNode(
            @PathParam("nodeId") String nodeId,
            @HeaderParam("X-Auth-Token") String authTokenHeader) {

        LOG.infof("Initializing database for node: %s", nodeId);

        // Generate auth token if not provided (first-time init)
        QuantumLevelDBService.NodeAuthToken authToken;
        if (authTokenHeader == null || authTokenHeader.isEmpty()) {
            // Generate initial keys and token
            keyManager.generateNodeKeys(nodeId);
            authToken = keyManager.generateAuthToken(nodeId);
        } else {
            authToken = parseAuthToken(authTokenHeader, nodeId);
        }

        return levelDbService.initializeNodeDatabase(nodeId, authToken)
            .map(info -> Response.ok(new InitResponse(
                true,
                info.nodeId(),
                info.path(),
                encodeAuthToken(keyManager.generateAuthToken(nodeId)),
                "Database initialized successfully"
            )).build())
            .onFailure().recoverWithItem(e -> {
                LOG.error("Failed to initialize node: " + nodeId, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("INIT_FAILED", e.getMessage()))
                    .build();
            });
    }

    /**
     * Get node database info
     */
    @GET
    @Path("/nodes/{nodeId}/info")
    public Response getNodeInfo(@PathParam("nodeId") String nodeId) {
        var info = levelDbService.getNodeInfo(nodeId);
        if (info == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("NODE_NOT_FOUND", "Node not initialized: " + nodeId))
                .build();
        }
        return Response.ok(info).build();
    }

    /**
     * List all initialized nodes
     */
    @GET
    @Path("/nodes")
    public Response listNodes() {
        List<String> nodes = levelDbService.listNodes();
        return Response.ok(new NodeListResponse(nodes, nodes.size())).build();
    }

    // ==========================================================================
    // Data Operations
    // ==========================================================================

    /**
     * Put data into node database
     */
    @PUT
    @Path("/nodes/{nodeId}/data/{key}")
    public Uni<Response> putData(
            @PathParam("nodeId") String nodeId,
            @PathParam("key") String key,
            @HeaderParam("X-Auth-Token") String authTokenHeader,
            DataRequest request) {

        if (authTokenHeader == null || authTokenHeader.isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("AUTH_REQUIRED", "X-Auth-Token header required"))
                .build());
        }

        QuantumLevelDBService.NodeAuthToken authToken = parseAuthToken(authTokenHeader, nodeId);
        byte[] data = Base64.getDecoder().decode(request.dataBase64());

        return levelDbService.put(nodeId, key, data, authToken)
            .map(result -> {
                if (result.success()) {
                    return Response.ok(new WriteResponse(
                        result.success(),
                        result.nodeId(),
                        result.key(),
                        result.originalSize(),
                        result.encryptedSize(),
                        result.latencyMs()
                    )).build();
                } else {
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("WRITE_FAILED", "Failed to write data"))
                        .build();
                }
            })
            .onFailure().recoverWithItem(e -> {
                if (e instanceof SecurityException) {
                    return Response.status(Response.Status.FORBIDDEN)
                        .entity(new ErrorResponse("AUTH_FAILED", e.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("WRITE_ERROR", e.getMessage()))
                    .build();
            });
    }

    /**
     * Get data from node database
     */
    @GET
    @Path("/nodes/{nodeId}/data/{key}")
    public Uni<Response> getData(
            @PathParam("nodeId") String nodeId,
            @PathParam("key") String key,
            @HeaderParam("X-Auth-Token") String authTokenHeader) {

        if (authTokenHeader == null || authTokenHeader.isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("AUTH_REQUIRED", "X-Auth-Token header required"))
                .build());
        }

        QuantumLevelDBService.NodeAuthToken authToken = parseAuthToken(authTokenHeader, nodeId);

        return levelDbService.get(nodeId, key, authToken)
            .map(result -> {
                if (result.success()) {
                    String dataBase64 = Base64.getEncoder().encodeToString(result.data());
                    return Response.ok(new ReadResponse(
                        result.success(),
                        result.nodeId(),
                        result.key(),
                        dataBase64,
                        result.latencyMs()
                    )).build();
                } else {
                    if ("KEY_NOT_FOUND".equals(result.status())) {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity(new ErrorResponse("KEY_NOT_FOUND", "Key not found: " + key))
                            .build();
                    }
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("READ_FAILED", result.status()))
                        .build();
                }
            })
            .onFailure().recoverWithItem(e -> {
                if (e instanceof SecurityException) {
                    return Response.status(Response.Status.FORBIDDEN)
                        .entity(new ErrorResponse("AUTH_FAILED", e.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("READ_ERROR", e.getMessage()))
                    .build();
            });
    }

    /**
     * Delete data from node database
     */
    @DELETE
    @Path("/nodes/{nodeId}/data/{key}")
    public Uni<Response> deleteData(
            @PathParam("nodeId") String nodeId,
            @PathParam("key") String key,
            @HeaderParam("X-Auth-Token") String authTokenHeader) {

        if (authTokenHeader == null || authTokenHeader.isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("AUTH_REQUIRED", "X-Auth-Token header required"))
                .build());
        }

        QuantumLevelDBService.NodeAuthToken authToken = parseAuthToken(authTokenHeader, nodeId);

        return levelDbService.delete(nodeId, key, authToken)
            .map(result -> Response.ok(new DeleteResponse(
                result.existed(),
                result.nodeId(),
                result.key(),
                result.latencyMs()
            )).build())
            .onFailure().recoverWithItem(e -> {
                if (e instanceof SecurityException) {
                    return Response.status(Response.Status.FORBIDDEN)
                        .entity(new ErrorResponse("AUTH_FAILED", e.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("DELETE_ERROR", e.getMessage()))
                    .build();
            });
    }

    /**
     * List all keys in node database
     */
    @GET
    @Path("/nodes/{nodeId}/keys")
    public Uni<Response> listKeys(
            @PathParam("nodeId") String nodeId,
            @HeaderParam("X-Auth-Token") String authTokenHeader) {

        if (authTokenHeader == null || authTokenHeader.isEmpty()) {
            return Uni.createFrom().item(Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("AUTH_REQUIRED", "X-Auth-Token header required"))
                .build());
        }

        QuantumLevelDBService.NodeAuthToken authToken = parseAuthToken(authTokenHeader, nodeId);

        return levelDbService.listKeys(nodeId, authToken)
            .map(result -> Response.ok(result).build())
            .onFailure().recoverWithItem(e -> {
                if (e instanceof SecurityException) {
                    return Response.status(Response.Status.FORBIDDEN)
                        .entity(new ErrorResponse("AUTH_FAILED", e.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("LIST_ERROR", e.getMessage()))
                    .build();
            });
    }

    // ==========================================================================
    // Authentication
    // ==========================================================================

    /**
     * Generate new authentication token
     */
    @POST
    @Path("/nodes/{nodeId}/auth/token")
    public Response generateToken(@PathParam("nodeId") String nodeId) {
        if (!keyManager.hasNodeKeys(nodeId)) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("NODE_NOT_INITIALIZED",
                    "Node must be initialized first: " + nodeId))
                .build();
        }

        try {
            QuantumLevelDBService.NodeAuthToken token = keyManager.generateAuthToken(nodeId);
            return Response.ok(new TokenResponse(
                nodeId,
                encodeAuthToken(token),
                token.expiresAt(),
                "Token generated successfully"
            )).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("TOKEN_ERROR", e.getMessage()))
                .build();
        }
    }

    /**
     * Verify authentication token
     */
    @POST
    @Path("/nodes/{nodeId}/auth/verify")
    public Response verifyToken(
            @PathParam("nodeId") String nodeId,
            @HeaderParam("X-Auth-Token") String authTokenHeader) {

        if (authTokenHeader == null || authTokenHeader.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("TOKEN_REQUIRED", "X-Auth-Token header required"))
                .build();
        }

        try {
            QuantumLevelDBService.NodeAuthToken token = parseAuthToken(authTokenHeader, nodeId);
            boolean valid = keyManager.verifyAuthToken(token);

            return Response.ok(new VerifyResponse(valid, nodeId,
                valid ? "Token is valid" : "Token is invalid")).build();
        } catch (Exception e) {
            return Response.ok(new VerifyResponse(false, nodeId,
                "Token verification failed: " + e.getMessage())).build();
        }
    }

    // ==========================================================================
    // Service Status
    // ==========================================================================

    /**
     * Get service status
     */
    @GET
    @Path("/status")
    public Response getStatus() {
        return Response.ok(levelDbService.getStatus()).build();
    }

    /**
     * Get key manager metrics
     */
    @GET
    @Path("/keys/metrics")
    public Response getKeyMetrics() {
        return Response.ok(keyManager.getMetrics()).build();
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private QuantumLevelDBService.NodeAuthToken parseAuthToken(String encoded, String expectedNodeId) {
        try {
            String decoded = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 5) {
                throw new IllegalArgumentException("Invalid token format");
            }

            return new QuantumLevelDBService.NodeAuthToken(
                parts[0], // nodeId
                parts[1], // encapsulatedKey
                parts[2], // tokenSignature
                Long.parseLong(parts[3]), // createdAt
                Long.parseLong(parts[4])  // expiresAt
            );
        } catch (Exception e) {
            // Return a minimal token that will fail verification
            return new QuantumLevelDBService.NodeAuthToken(
                expectedNodeId, "", "", 0, 0
            );
        }
    }

    private String encodeAuthToken(QuantumLevelDBService.NodeAuthToken token) {
        String tokenStr = String.join(":",
            token.nodeId(),
            token.encapsulatedKey(),
            token.tokenSignature(),
            String.valueOf(token.createdAt()),
            String.valueOf(token.expiresAt())
        );
        return Base64.getEncoder().encodeToString(tokenStr.getBytes(StandardCharsets.UTF_8));
    }

    // ==========================================================================
    // Request/Response DTOs
    // ==========================================================================

    public record DataRequest(String dataBase64) {}

    public record InitResponse(
        boolean success,
        String nodeId,
        String path,
        String authToken,
        String message
    ) {}

    public record WriteResponse(
        boolean success,
        String nodeId,
        String key,
        int originalSize,
        int encryptedSize,
        double latencyMs
    ) {}

    public record ReadResponse(
        boolean success,
        String nodeId,
        String key,
        String dataBase64,
        double latencyMs
    ) {}

    public record DeleteResponse(
        boolean deleted,
        String nodeId,
        String key,
        double latencyMs
    ) {}

    public record NodeListResponse(List<String> nodes, int count) {}

    public record TokenResponse(
        String nodeId,
        String token,
        long expiresAt,
        String message
    ) {}

    public record VerifyResponse(boolean valid, String nodeId, String message) {}

    public record ErrorResponse(String code, String message) {}
}
