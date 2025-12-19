package io.aurigraph.v11.storage.swift;

import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.*;
import java.util.LinkedHashMap;

/**
 * Object Storage REST API
 *
 * Provides unified object storage API with:
 * - Upload/download operations
 * - CDN URL generation
 * - Container management
 * - Quantum encryption support
 *
 * Backend: OpenStack Swift with CURBy quantum encryption
 *
 * @version 12.2.0
 * @since 2025-12-19
 */
@Path("/api/v12/object-storage")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@PermitAll
@Tag(name = "Object Storage", description = "Enterprise object storage with CDN and quantum encryption")
public class ObjectStorageResource {

    private static final Logger LOG = Logger.getLogger(ObjectStorageResource.class);

    @Inject
    SwiftObjectStorageService storageService;

    // ==================== OBJECT OPERATIONS ====================

    /**
     * Upload object to storage
     *
     * POST /api/v12/storage/objects/{container}/{object}
     */
    @POST
    @Path("/objects/{container}/{object}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Operation(summary = "Upload object", description = "Upload file to object storage with optional encryption")
    public Response uploadObject(
            @Parameter(description = "Container name") @PathParam("container") String container,
            @Parameter(description = "Object name/path") @PathParam("object") String objectName,
            @RestForm("file") FileUpload file,
            @RestForm("metadata") String metadataJson) {

        try {
            // Read file content
            byte[] data = Files.readAllBytes(file.uploadedFile());

            // Parse metadata (simplified)
            Map<String, String> metadata = new HashMap<>();
            metadata.put("originalFilename", file.fileName());
            metadata.put("contentType", file.contentType());
            metadata.put("uploadedAt", Instant.now().toString());

            // Store object
            var result = storageService.storeObject(container, objectName, data, metadata)
                .await().indefinitely();

            LOG.infof("Uploaded object: %s/%s (%d bytes)", container, objectName, data.length);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("container", result.containerName());
            response.put("object", result.objectName());
            response.put("size", result.originalSize());
            response.put("encrypted", result.encrypted());
            response.put("encryptionAlgorithm", result.encryptionAlgorithm() != null ? result.encryptionAlgorithm() : "none");
            response.put("cdnUrl", result.cdnUrl() != null ? result.cdnUrl() : "");
            response.put("etag", result.etag());
            response.put("sha256", result.sha256());
            response.put("latencyMs", result.latencyMs());
            response.put("timestamp", result.uploadTime().toString());

            return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();

        } catch (IOException e) {
            LOG.errorf("Failed to read uploaded file: %s", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("success", false, "error", "Failed to read file: " + e.getMessage()))
                .build();
        } catch (Exception e) {
            LOG.errorf("Failed to upload object: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * Upload object with JSON body (for programmatic uploads)
     *
     * PUT /api/v12/storage/objects/{container}/{object}
     */
    @PUT
    @Path("/objects/{container}/{object}")
    @Consumes(MediaType.APPLICATION_OCTET_STREAM)
    @Operation(summary = "Upload object (binary)", description = "Upload binary data directly")
    public Response uploadObjectBinary(
            @PathParam("container") String container,
            @PathParam("object") String objectName,
            @HeaderParam("X-Object-Meta") String metadataHeader,
            byte[] data) {

        try {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("uploadedAt", Instant.now().toString());

            var result = storageService.storeObject(container, objectName, data, metadata)
                .await().indefinitely();

            return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "container", result.containerName(),
                    "object", result.objectName(),
                    "size", result.originalSize(),
                    "encrypted", result.encrypted(),
                    "cdnUrl", result.cdnUrl() != null ? result.cdnUrl() : "",
                    "etag", result.etag()
                ))
                .build();

        } catch (Exception e) {
            LOG.errorf("Failed to upload object: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * Download object
     *
     * GET /api/v12/storage/objects/{container}/{object}
     */
    @GET
    @Path("/objects/{container}/{object}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @Operation(summary = "Download object", description = "Download and decrypt object from storage")
    public Response downloadObject(
            @PathParam("container") String container,
            @PathParam("object") String objectName) {

        try {
            byte[] data = storageService.getObject(container, objectName)
                .await().indefinitely();

            return Response.ok(data)
                .header("Content-Disposition", "attachment; filename=\"" + objectName + "\"")
                .header("Content-Length", data.length)
                .build();

        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return Response.status(Response.Status.NOT_FOUND)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(Map.of("success", false, "error", "Object not found"))
                    .build();
            }
            LOG.errorf("Failed to download object: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get object metadata
     *
     * HEAD /api/v12/storage/objects/{container}/{object}
     */
    @HEAD
    @Path("/objects/{container}/{object}")
    @Operation(summary = "Get object metadata", description = "Get object metadata without downloading content")
    public Response getObjectMetadata(
            @PathParam("container") String container,
            @PathParam("object") String objectName) {

        try {
            var metadata = storageService.getObjectMetadata(container, objectName)
                .await().indefinitely();

            if (metadata == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            return Response.ok()
                .header("Content-Length", metadata.originalSize())
                .header("ETag", metadata.etag())
                .header("X-Object-Encrypted", metadata.encrypted())
                .header("X-Object-CDN-URL", metadata.cdnUrl() != null ? metadata.cdnUrl() : "")
                .build();

        } catch (Exception e) {
            LOG.errorf("Failed to get object metadata: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete object
     *
     * DELETE /api/v12/storage/objects/{container}/{object}
     */
    @DELETE
    @Path("/objects/{container}/{object}")
    @Operation(summary = "Delete object", description = "Delete object from storage")
    public Response deleteObject(
            @PathParam("container") String container,
            @PathParam("object") String objectName) {

        try {
            boolean deleted = storageService.deleteObject(container, objectName)
                .await().indefinitely();

            if (deleted) {
                return Response.ok(Map.of(
                    "success", true,
                    "message", "Object deleted",
                    "container", container,
                    "object", objectName
                )).build();
            } else {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("success", false, "error", "Object not found"))
                    .build();
            }

        } catch (Exception e) {
            LOG.errorf("Failed to delete object: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    // ==================== CONTAINER OPERATIONS ====================

    /**
     * Create container
     *
     * POST /api/v12/storage/containers/{container}
     */
    @POST
    @Path("/containers/{container}")
    @Operation(summary = "Create container", description = "Create new storage container")
    public Response createContainer(
            @PathParam("container") String containerName,
            Map<String, String> metadata) {

        try {
            boolean created = storageService.createContainer(containerName, metadata)
                .await().indefinitely();

            return Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "container", containerName,
                    "created", created,
                    "timestamp", Instant.now().toString()
                ))
                .build();

        } catch (Exception e) {
            LOG.errorf("Failed to create container: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * List objects in container
     *
     * GET /api/v12/storage/containers/{container}
     */
    @GET
    @Path("/containers/{container}")
    @Operation(summary = "List objects", description = "List objects in container with optional prefix filter")
    public Response listObjects(
            @PathParam("container") String containerName,
            @QueryParam("prefix") String prefix,
            @QueryParam("limit") @DefaultValue("1000") int limit) {

        try {
            var objects = storageService.listObjects(containerName, prefix, limit)
                .await().indefinitely();

            return Response.ok(Map.of(
                "success", true,
                "container", containerName,
                "objects", objects,
                "count", objects.size(),
                "prefix", prefix != null ? prefix : "",
                "limit", limit
            )).build();

        } catch (Exception e) {
            LOG.errorf("Failed to list objects: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    // ==================== CDN OPERATIONS ====================

    /**
     * Get CDN URL for object
     *
     * GET /api/v12/storage/cdn/{container}/{object}
     */
    @GET
    @Path("/cdn/{container}/{object}")
    @Operation(summary = "Get CDN URL", description = "Get CDN URL for cached object access")
    public Response getCdnUrl(
            @PathParam("container") String container,
            @PathParam("object") String objectName) {

        String cdnUrl = storageService.getCdnUrl(container, objectName);

        if (cdnUrl == null) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of("success", false, "error", "CDN not enabled"))
                .build();
        }

        return Response.ok(Map.of(
            "success", true,
            "container", container,
            "object", objectName,
            "cdnUrl", cdnUrl,
            "cacheControl", "public, max-age=86400",
            "expires", Instant.now().plusSeconds(86400).toString()
        )).build();
    }

    /**
     * Generate temporary signed URL
     *
     * POST /api/v12/storage/temp-url
     */
    @POST
    @Path("/temp-url")
    @Operation(summary = "Generate temp URL", description = "Generate temporary signed URL for object access")
    public Response generateTempUrl(TempUrlRequest request) {
        try {
            String tempUrl = storageService.generateTempUrl(
                    request.container,
                    request.object,
                    request.validitySeconds != null ? request.validitySeconds : 3600,
                    request.method != null ? request.method : "GET"
                )
                .await().indefinitely();

            return Response.ok(Map.of(
                "success", true,
                "container", request.container,
                "object", request.object,
                "tempUrl", tempUrl,
                "validUntil", Instant.now().plusSeconds(
                    request.validitySeconds != null ? request.validitySeconds : 3600
                ).toString(),
                "method", request.method != null ? request.method : "GET"
            )).build();

        } catch (Exception e) {
            LOG.errorf("Failed to generate temp URL: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    /**
     * Purge CDN cache
     *
     * POST /api/v12/storage/cdn/purge
     */
    @POST
    @Path("/cdn/purge")
    @Operation(summary = "Purge CDN cache", description = "Purge CDN cache for specific object or prefix")
    public Response purgeCdnCache(CdnPurgeRequest request) {
        try {
            // In production, this would call CDN provider's purge API
            LOG.infof("CDN cache purge requested for: %s/%s", request.container, request.objectOrPrefix);

            return Response.ok(Map.of(
                "success", true,
                "message", "CDN cache purge initiated",
                "container", request.container,
                "target", request.objectOrPrefix != null ? request.objectOrPrefix : "*",
                "estimatedPropagation", "2-5 minutes"
            )).build();

        } catch (Exception e) {
            LOG.errorf("Failed to purge CDN cache: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("success", false, "error", e.getMessage()))
                .build();
        }
    }

    // ==================== STATUS & HEALTH ====================

    /**
     * Get storage service status
     *
     * GET /api/v12/storage/status
     */
    @GET
    @Path("/status")
    @Operation(summary = "Get status", description = "Get object storage service status and metrics")
    public Response getStatus() {
        var status = storageService.getStatus();

        return Response.ok(Map.of(
            "success", true,
            "backend", status.backend(),
            "ready", status.ready(),
            "storagePath", status.storagePath(),
            "quantumEncryption", status.quantumEncryption(),
            "cdnEnabled", status.cdnEnabled(),
            "metrics", Map.of(
                "totalUploads", status.totalUploads(),
                "totalDownloads", status.totalDownloads(),
                "totalBytes", status.totalBytes(),
                "containerCount", status.containerCount()
            ),
            "timestamp", status.timestamp().toString()
        )).build();
    }

    /**
     * Get detailed storage statistics
     *
     * GET /api/v12/storage/stats
     */
    @GET
    @Path("/stats")
    @Operation(summary = "Get statistics", description = "Get detailed storage statistics including per-container info")
    public Response getStorageStats() {
        return Response.ok(storageService.getStorageStats()).build();
    }

    /**
     * Health check
     *
     * GET /api/v12/storage/health
     */
    @GET
    @Path("/health")
    @Operation(summary = "Health check", description = "Check object storage service health")
    public Response health() {
        try {
            boolean healthy = storageService.healthCheck().await().indefinitely();

            return Response.ok(Map.of(
                "status", healthy ? "UP" : "DOWN",
                "service", "Object Storage (OpenStack Swift)",
                "version", "12.2.0",
                "timestamp", Instant.now().toString()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of(
                    "status", "DOWN",
                    "service", "Object Storage (OpenStack Swift)",
                    "error", e.getMessage(),
                    "timestamp", Instant.now().toString()
                ))
                .build();
        }
    }

    // ==================== REQUEST/RESPONSE CLASSES ====================

    public static class TempUrlRequest {
        public String container;
        public String object;
        public Integer validitySeconds;
        public String method;
    }

    public static class CdnPurgeRequest {
        public String container;
        public String objectOrPrefix;
    }
}
