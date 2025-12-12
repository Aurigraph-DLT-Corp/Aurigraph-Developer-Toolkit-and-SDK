package io.aurigraph.v11.portal;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * File Attachment Resource with Transaction ID and SHA256 Hashing
 *
 * Enhanced file upload API that:
 * - Links files to blockchain transaction IDs
 * - Calculates and stores SHA256 hashes
 * - Organizes files by transaction ID
 * - Provides hash verification
 *
 * Storage structure:
 *   data/attachments/
 *     └── {transactionId}/
 *         └── {hash}_{filename}
 *
 * @author J4C Deployment Agent
 * @version 12.0.0
 * @since AV11-583
 */
@Path("/api/v11/attachments")
@ApplicationScoped
@PermitAll
public class FileAttachmentResource {

    private static final Logger LOG = Logger.getLogger(FileAttachmentResource.class);

    @ConfigProperty(name = "aurigraph.attachments.path", defaultValue = "data/attachments")
    String attachmentsPath;

    @ConfigProperty(name = "aurigraph.attachments.max-size-mb", defaultValue = "100")
    int maxSizeMb;

    @Inject
    FileHashService hashService;

    @Inject
    MinioStorageService minioStorage;

    private java.nio.file.Path attachmentsRoot;

    // Allowed file extensions
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "pdf", "doc", "docx", "txt", "rtf", "odt",  // Documents
        "png", "jpg", "jpeg", "gif", "svg", "webp", // Images
        "json", "csv", "xml", "yaml", "yml"          // Data
    );

    @PostConstruct
    void init() {
        try {
            this.attachmentsRoot = Paths.get(attachmentsPath);
            Files.createDirectories(attachmentsRoot);
            LOG.infof("File attachment resource initialized at: %s", attachmentsRoot.toAbsolutePath());
        } catch (IOException e) {
            LOG.errorf(e, "Failed to initialize attachment directories");
            throw new RuntimeException("Cannot initialize attachment storage", e);
        }
    }

    /**
     * Upload a file with transaction ID linking
     *
     * @param transactionId The blockchain transaction ID to link to
     * @param file The file to upload
     * @param category File category (documents, images, data, assets, contracts)
     * @param description Optional description
     * @return Upload response with file ID, hash, and metadata
     */
    @POST
    @Path("/{transactionId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadWithTransaction(
            @PathParam("transactionId") String transactionId,
            @RestForm("file") FileUpload file,
            @RestForm("category") @DefaultValue("documents") String category,
            @RestForm("description") String description) {

        LOG.infof("Upload request for transaction: %s, category: %s", transactionId, category);

        try {
            // Validate transaction ID
            if (transactionId == null || transactionId.isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Transaction ID is required"))
                    .build();
            }

            // Validate file
            if (file == null || file.filePath() == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No file provided"))
                    .build();
            }

            String originalName = file.fileName();
            String extension = getFileExtension(originalName).toLowerCase();

            // Validate extension
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "error", "File type not allowed",
                        "allowed", ALLOWED_EXTENSIONS
                    ))
                    .build();
            }

            // Validate file size
            long fileSize = Files.size(file.filePath());
            long maxSize = (long) maxSizeMb * 1024 * 1024;
            if (fileSize > maxSize) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "error", "File too large",
                        "maxSizeMb", maxSizeMb,
                        "actualSizeMb", fileSize / (1024 * 1024)
                    ))
                    .build();
            }

            // Calculate SHA256 hash
            String sha256Hash = hashService.calculateHashFromFile(file.filePath());
            LOG.infof("Calculated hash for %s: %s", originalName, sha256Hash);

            // Check for duplicate hash
            FileAttachment existing = FileAttachment.findByHash(sha256Hash);
            if (existing != null) {
                LOG.infof("File with same hash already exists: %s", existing.fileId);
                // Link existing file to this transaction if not already
                if (existing.transactionId == null || existing.transactionId.isBlank()) {
                    existing.linkToTransaction(transactionId);
                }
                return Response.ok(buildResponse(existing, "File already exists, linked to transaction"))
                    .build();
            }

            // Generate file ID and stored name
            String fileId = UUID.randomUUID().toString();
            String storedName = sha256Hash.substring(0, 8) + "_" + sanitizeFilename(originalName);

            // Create transaction directory
            java.nio.file.Path txDir = attachmentsRoot.resolve(transactionId);
            Files.createDirectories(txDir);

            // Copy file to local storage as fallback
            java.nio.file.Path targetPath = txDir.resolve(storedName);
            Files.copy(file.filePath(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            LOG.infof("File stored locally at: %s", targetPath);

            // Upload to MinIO CDN
            String cdnUrl = null;
            String mimeType = Files.probeContentType(targetPath);
            if (minioStorage.isAvailable()) {
                var cdnResult = minioStorage.uploadFile(targetPath, storedName, category, mimeType);
                if (cdnResult.isPresent()) {
                    cdnUrl = cdnResult.get();
                    LOG.infof("File uploaded to CDN: %s", cdnUrl);
                }
            }

            // Create entity
            FileAttachment attachment = new FileAttachment();
            attachment.fileId = fileId;
            attachment.originalName = originalName;
            attachment.storedName = storedName;
            attachment.transactionId = transactionId;
            attachment.category = category;
            attachment.fileSize = fileSize;
            attachment.sha256Hash = sha256Hash;
            attachment.mimeType = mimeType;
            attachment.storagePath = targetPath.toString();
            attachment.cdnUrl = cdnUrl;
            attachment.description = description;
            attachment.verified = true; // Hash verified during upload
            attachment.persist();

            LOG.infof("Attachment saved: fileId=%s, hash=%s, txId=%s, cdn=%s", fileId, sha256Hash, transactionId, cdnUrl != null ? "yes" : "no");

            return Response.status(Response.Status.CREATED)
                .entity(buildResponse(attachment, "File uploaded successfully"))
                .build();

        } catch (IOException e) {
            LOG.errorf(e, "Failed to upload file");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", "Failed to upload file: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Upload a file without transaction ID (can be linked later)
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadWithoutTransaction(
            @RestForm("file") FileUpload file,
            @RestForm("category") @DefaultValue("documents") String category,
            @RestForm("description") String description) {

        LOG.info("Upload request without transaction ID");

        try {
            if (file == null || file.filePath() == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No file provided"))
                    .build();
            }

            String originalName = file.fileName();
            String extension = getFileExtension(originalName).toLowerCase();

            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "File type not allowed"))
                    .build();
            }

            long fileSize = Files.size(file.filePath());
            long maxSize = (long) maxSizeMb * 1024 * 1024;
            if (fileSize > maxSize) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "File too large"))
                    .build();
            }

            String sha256Hash = hashService.calculateHashFromFile(file.filePath());

            // Check for duplicate
            FileAttachment existing = FileAttachment.findByHash(sha256Hash);
            if (existing != null) {
                return Response.ok(buildResponse(existing, "File already exists"))
                    .build();
            }

            String fileId = UUID.randomUUID().toString();
            String storedName = sha256Hash.substring(0, 8) + "_" + sanitizeFilename(originalName);

            // Store in "pending" directory for files without transaction
            java.nio.file.Path pendingDir = attachmentsRoot.resolve("pending");
            Files.createDirectories(pendingDir);
            java.nio.file.Path targetPath = pendingDir.resolve(storedName);
            Files.copy(file.filePath(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Upload to MinIO CDN
            String cdnUrl = null;
            String mimeType = Files.probeContentType(targetPath);
            if (minioStorage.isAvailable()) {
                var cdnResult = minioStorage.uploadFile(targetPath, storedName, category, mimeType);
                if (cdnResult.isPresent()) {
                    cdnUrl = cdnResult.get();
                    LOG.infof("File uploaded to CDN: %s", cdnUrl);
                }
            }

            FileAttachment attachment = new FileAttachment();
            attachment.fileId = fileId;
            attachment.originalName = originalName;
            attachment.storedName = storedName;
            attachment.category = category;
            attachment.fileSize = fileSize;
            attachment.sha256Hash = sha256Hash;
            attachment.mimeType = mimeType;
            attachment.storagePath = targetPath.toString();
            attachment.cdnUrl = cdnUrl;
            attachment.description = description;
            attachment.verified = true;
            attachment.persist();

            return Response.status(Response.Status.CREATED)
                .entity(buildResponse(attachment, "File uploaded, pending transaction link"))
                .build();

        } catch (IOException e) {
            LOG.errorf(e, "Failed to upload file");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", "Failed to upload file"))
                .build();
        }
    }

    /**
     * Get all attachments for a transaction
     */
    @GET
    @Path("/transaction/{transactionId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getByTransaction(@PathParam("transactionId") String transactionId) {
        List<FileAttachment> attachments = FileAttachment.findByTransactionId(transactionId);
        List<Map<String, Object>> response = attachments.stream()
            .map(a -> buildResponse(a, null))
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "transactionId", transactionId,
            "count", attachments.size(),
            "attachments", response
        )).build();
    }

    /**
     * Get attachment metadata by file ID
     */
    @GET
    @Path("/{fileId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getByFileId(@PathParam("fileId") String fileId) {
        FileAttachment attachment = FileAttachment.findByFileId(fileId);
        if (attachment == null || attachment.deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Attachment not found"))
                .build();
        }
        return Response.ok(buildResponse(attachment, null)).build();
    }

    /**
     * Verify file hash integrity
     */
    @POST
    @Path("/{fileId}/verify")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response verifyHash(@PathParam("fileId") String fileId) {
        FileAttachment attachment = FileAttachment.findByFileId(fileId);
        if (attachment == null || attachment.deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Attachment not found"))
                .build();
        }

        boolean valid = hashService.verifyHash(attachment.storagePath, attachment.sha256Hash);
        attachment.verified = valid;
        attachment.persist();

        return Response.ok(Map.of(
            "fileId", fileId,
            "verified", valid,
            "expectedHash", attachment.sha256Hash,
            "message", valid ? "Hash verification successful" : "Hash verification failed - file may be corrupted"
        )).build();
    }

    /**
     * Download attachment file
     */
    @GET
    @Path("/{fileId}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadFile(@PathParam("fileId") String fileId) {
        FileAttachment attachment = FileAttachment.findByFileId(fileId);
        if (attachment == null || attachment.deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Attachment not found")
                .build();
        }

        try {
            java.nio.file.Path filePath = Paths.get(attachment.storagePath);
            if (!Files.exists(filePath)) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity("File not found on disk")
                    .build();
            }

            return Response.ok(Files.readAllBytes(filePath))
                .header("Content-Disposition", "attachment; filename=\"" + attachment.originalName + "\"")
                .header("X-SHA256-Hash", attachment.sha256Hash)
                .build();

        } catch (IOException e) {
            LOG.errorf(e, "Failed to download file: %s", fileId);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Failed to download file")
                .build();
        }
    }

    /**
     * Link an existing attachment to a transaction
     */
    @POST
    @Path("/{fileId}/link/{transactionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response linkToTransaction(
            @PathParam("fileId") String fileId,
            @PathParam("transactionId") String transactionId) {

        FileAttachment attachment = FileAttachment.findByFileId(fileId);
        if (attachment == null || attachment.deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Attachment not found"))
                .build();
        }

        // Move file to transaction directory if currently in pending
        if (attachment.storagePath.contains("/pending/")) {
            try {
                java.nio.file.Path txDir = attachmentsRoot.resolve(transactionId);
                Files.createDirectories(txDir);
                java.nio.file.Path newPath = txDir.resolve(attachment.storedName);
                Files.move(Paths.get(attachment.storagePath), newPath, StandardCopyOption.REPLACE_EXISTING);
                attachment.storagePath = newPath.toString();
            } catch (IOException e) {
                LOG.errorf(e, "Failed to move file to transaction directory");
            }
        }

        attachment.linkToTransaction(transactionId);

        return Response.ok(Map.of(
            "fileId", fileId,
            "transactionId", transactionId,
            "message", "Attachment linked to transaction"
        )).build();
    }

    /**
     * Soft delete an attachment
     */
    @DELETE
    @Path("/{fileId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response deleteAttachment(@PathParam("fileId") String fileId) {
        FileAttachment attachment = FileAttachment.findByFileId(fileId);
        if (attachment == null || attachment.deleted) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Attachment not found"))
                .build();
        }

        attachment.softDelete();

        return Response.ok(Map.of(
            "fileId", fileId,
            "deleted", true,
            "message", "Attachment soft deleted"
        )).build();
    }

    // Helper methods

    private Map<String, Object> buildResponse(FileAttachment attachment, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("fileId", attachment.fileId);
        response.put("originalName", attachment.originalName);
        response.put("sha256Hash", attachment.sha256Hash);
        response.put("transactionId", attachment.transactionId);
        response.put("tokenId", attachment.tokenId);
        response.put("category", attachment.category);
        response.put("fileSize", attachment.fileSize);
        response.put("mimeType", attachment.mimeType);
        response.put("uploadedAt", attachment.uploadedAt != null ? attachment.uploadedAt.toString() : null);
        response.put("verified", attachment.verified);
        // Include CDN URL if available (primary download source)
        if (attachment.cdnUrl != null) {
            response.put("cdnUrl", attachment.cdnUrl);
            response.put("downloadUrl", attachment.cdnUrl); // Convenience field
        } else {
            // Fallback to local download endpoint
            response.put("downloadUrl", "/api/v11/attachments/" + attachment.fileId + "/download");
        }
        if (message != null) {
            response.put("message", message);
        }
        return response;
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }

    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
