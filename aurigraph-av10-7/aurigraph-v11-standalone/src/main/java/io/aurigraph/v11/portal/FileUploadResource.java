package io.aurigraph.v11.portal;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * File Upload Resource
 *
 * Handles file uploads for the Enterprise Portal, storing files on the filesystem.
 * Supports multiple file types including documents, images, and data files.
 *
 * Storage structure:
 *   data/uploads/
 *     ├── documents/    - PDF, DOC, TXT files
 *     ├── images/       - PNG, JPG, SVG files
 *     ├── data/         - JSON, CSV, XML files
 *     └── assets/       - Token-related asset files
 *
 * @version 1.0.0 (Dec 8, 2025)
 * @author Backend Development Agent (BDA)
 */
@jakarta.ws.rs.Path("/api/v12/uploads")
@ApplicationScoped
@PermitAll
public class FileUploadResource {

    private static final Logger LOG = Logger.getLogger(FileUploadResource.class);

    @ConfigProperty(name = "aurigraph.uploads.path", defaultValue = "data/uploads")
    String uploadsPath;

    @ConfigProperty(name = "aurigraph.uploads.max-size-mb", defaultValue = "50")
    int maxSizeMb;

    private Path uploadsRoot;
    private Path documentsPath;
    private Path imagesPath;
    private Path dataPath;
    private Path assetsPath;

    // Allowed file extensions by category
    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of("pdf", "doc", "docx", "txt", "rtf", "odt");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "svg", "webp");
    private static final Set<String> DATA_EXTENSIONS = Set.of("json", "csv", "xml", "yaml", "yml");
    private static final Set<String> ASSET_EXTENSIONS = Set.of("pdf", "png", "jpg", "jpeg", "json");

    @PostConstruct
    void init() {
        try {
            this.uploadsRoot = Paths.get(uploadsPath);
            this.documentsPath = uploadsRoot.resolve("documents");
            this.imagesPath = uploadsRoot.resolve("images");
            this.dataPath = uploadsRoot.resolve("data");
            this.assetsPath = uploadsRoot.resolve("assets");

            // Create directories if they don't exist
            Files.createDirectories(documentsPath);
            Files.createDirectories(imagesPath);
            Files.createDirectories(dataPath);
            Files.createDirectories(assetsPath);

            LOG.infof("File upload resource initialized at: %s", uploadsRoot.toAbsolutePath());
        } catch (IOException e) {
            LOG.errorf(e, "Failed to initialize file upload directories");
            throw new RuntimeException("Cannot initialize upload storage", e);
        }
    }

    /**
     * Upload a file to the filesystem
     *
     * POST /api/v12/uploads
     * Content-Type: multipart/form-data
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response uploadFile(
            @RestForm("file") FileUpload file,
            @RestForm("category") @DefaultValue("documents") String category,
            @RestForm("description") String description) {

        try {
            if (file == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("No file provided"))
                    .build();
            }

            String originalName = file.fileName();
            String extension = getExtension(originalName);

            // Validate file extension
            if (!isAllowedExtension(extension, category)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("File type not allowed for category: " + category))
                    .build();
            }

            // Validate file size
            long fileSize = file.size();
            long maxSize = maxSizeMb * 1024L * 1024L;
            if (fileSize > maxSize) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("File too large. Max size: " + maxSizeMb + "MB"))
                    .build();
            }

            // Generate unique filename
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String safeOriginalName = sanitizeFilename(originalName);
            String newFilename = String.format("%s_%s_%s", timestamp, uniqueId, safeOriginalName);

            // Get target directory based on category
            Path targetDir = getCategoryPath(category);
            Path targetPath = targetDir.resolve(newFilename);

            // Copy file to target location
            Files.copy(file.filePath(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            LOG.infof("✅ File uploaded: %s -> %s (category: %s, size: %d bytes)",
                originalName, newFilename, category, fileSize);

            // Return upload result
            FileUploadResponse response = new FileUploadResponse(
                uniqueId,
                originalName,
                newFilename,
                category,
                fileSize,
                extension,
                targetPath.toString(),
                description,
                Instant.now().toString()
            );

            return Response.ok(response).build();

        } catch (IOException e) {
            LOG.errorf(e, "File upload failed");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("File upload failed: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Upload asset files for token/RWAT operations
     *
     * POST /api/v12/uploads/assets
     */
    @POST
    @jakarta.ws.rs.Path("/assets")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response uploadAsset(
            @RestForm("file") FileUpload file,
            @RestForm("tokenId") String tokenId,
            @RestForm("assetType") @DefaultValue("document") String assetType,
            @RestForm("description") String description) {

        try {
            if (file == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("No file provided"))
                    .build();
            }

            String originalName = file.fileName();
            String extension = getExtension(originalName);

            // Validate file extension for assets
            if (!ASSET_EXTENSIONS.contains(extension.toLowerCase())) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Asset file type not allowed: " + extension))
                    .build();
            }

            // Generate unique filename with token ID prefix
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String tokenPrefix = tokenId != null ? tokenId + "_" : "";
            String safeOriginalName = sanitizeFilename(originalName);
            String newFilename = String.format("%s%s_%s_%s", tokenPrefix, timestamp, uniqueId, safeOriginalName);

            // Create token-specific subdirectory if tokenId provided
            Path targetDir = tokenId != null
                ? assetsPath.resolve(sanitizeFilename(tokenId))
                : assetsPath;
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(newFilename);

            // Copy file to target location
            Files.copy(file.filePath(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            LOG.infof("✅ Asset uploaded: %s -> %s (tokenId: %s, type: %s)",
                originalName, newFilename, tokenId, assetType);

            // Return upload result
            AssetUploadResponse response = new AssetUploadResponse(
                uniqueId,
                originalName,
                newFilename,
                tokenId,
                assetType,
                file.size(),
                extension,
                targetPath.toString(),
                description,
                Instant.now().toString()
            );

            return Response.ok(response).build();

        } catch (IOException e) {
            LOG.errorf(e, "Asset upload failed");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Asset upload failed: " + e.getMessage()))
                .build();
        }
    }

    /**
     * List uploaded files
     *
     * GET /api/v12/uploads
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response listFiles(
            @QueryParam("category") String category,
            @QueryParam("limit") @DefaultValue("100") int limit) {

        try {
            Path searchPath = category != null ? getCategoryPath(category) : uploadsRoot;

            List<FileInfo> files = new ArrayList<>();

            if (Files.exists(searchPath)) {
                try (Stream<Path> pathStream = Files.walk(searchPath, 2)) {
                    files = pathStream
                        .filter(Files::isRegularFile)
                        .limit(limit)
                        .map(this::toFileInfo)
                        .collect(Collectors.toList());
                }
            }

            return Response.ok(new FileListResponse(files, files.size())).build();

        } catch (IOException e) {
            LOG.errorf(e, "Failed to list files");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Failed to list files: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Get file info
     *
     * GET /api/v12/uploads/{category}/{filename}
     */
    @GET
    @jakarta.ws.rs.Path("/{category}/{filename}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getFileInfo(
            @PathParam("category") String category,
            @PathParam("filename") String filename) {

        try {
            Path filePath = getCategoryPath(category).resolve(sanitizeFilename(filename));

            if (!Files.exists(filePath)) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("File not found"))
                    .build();
            }

            FileInfo info = toFileInfo(filePath);
            return Response.ok(info).build();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to get file info");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Failed to get file info: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Download a file
     *
     * GET /api/v12/uploads/{category}/{filename}/download
     */
    @GET
    @jakarta.ws.rs.Path("/{category}/{filename}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response downloadFile(
            @PathParam("category") String category,
            @PathParam("filename") String filename) {

        try {
            Path filePath = getCategoryPath(category).resolve(sanitizeFilename(filename));

            if (!Files.exists(filePath)) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity("File not found")
                    .build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);

            return Response.ok(fileContent)
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Length", fileContent.length)
                .build();

        } catch (IOException e) {
            LOG.errorf(e, "Failed to download file");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity("Failed to download file: " + e.getMessage())
                .build();
        }
    }

    /**
     * Delete a file
     *
     * DELETE /api/v12/uploads/{category}/{filename}
     */
    @DELETE
    @jakarta.ws.rs.Path("/{category}/{filename}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteFile(
            @PathParam("category") String category,
            @PathParam("filename") String filename) {

        try {
            Path filePath = getCategoryPath(category).resolve(sanitizeFilename(filename));

            if (!Files.exists(filePath)) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("File not found"))
                    .build();
            }

            Files.delete(filePath);
            LOG.infof("✅ File deleted: %s/%s", category, filename);

            return Response.ok(new SuccessResponse("File deleted successfully")).build();

        } catch (IOException e) {
            LOG.errorf(e, "Failed to delete file");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Failed to delete file: " + e.getMessage()))
                .build();
        }
    }

    // ==================== Helper Methods ====================

    private String getExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }

    private String sanitizeFilename(String filename) {
        // Remove potentially dangerous characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private boolean isAllowedExtension(String extension, String category) {
        String ext = extension.toLowerCase();
        return switch (category.toLowerCase()) {
            case "documents" -> DOCUMENT_EXTENSIONS.contains(ext);
            case "images" -> IMAGE_EXTENSIONS.contains(ext);
            case "data" -> DATA_EXTENSIONS.contains(ext);
            case "assets" -> ASSET_EXTENSIONS.contains(ext);
            default -> DOCUMENT_EXTENSIONS.contains(ext) || IMAGE_EXTENSIONS.contains(ext)
                || DATA_EXTENSIONS.contains(ext);
        };
    }

    private Path getCategoryPath(String category) {
        return switch (category.toLowerCase()) {
            case "documents" -> documentsPath;
            case "images" -> imagesPath;
            case "data" -> dataPath;
            case "assets" -> assetsPath;
            default -> documentsPath;
        };
    }

    private FileInfo toFileInfo(Path path) {
        try {
            return new FileInfo(
                path.getFileName().toString(),
                Files.size(path),
                getExtension(path.getFileName().toString()),
                getCategoryFromPath(path),
                Files.getLastModifiedTime(path).toInstant().toString()
            );
        } catch (IOException e) {
            return new FileInfo(path.getFileName().toString(), 0, "", "", "");
        }
    }

    private String getCategoryFromPath(Path path) {
        String pathStr = path.toString();
        if (pathStr.contains("/documents/")) return "documents";
        if (pathStr.contains("/images/")) return "images";
        if (pathStr.contains("/data/")) return "data";
        if (pathStr.contains("/assets/")) return "assets";
        return "unknown";
    }

    // ==================== Response DTOs ====================

    public record FileUploadResponse(
        String id,
        String originalName,
        String storedName,
        String category,
        long size,
        String extension,
        String path,
        String description,
        String uploadedAt
    ) {}

    public record AssetUploadResponse(
        String id,
        String originalName,
        String storedName,
        String tokenId,
        String assetType,
        long size,
        String extension,
        String path,
        String description,
        String uploadedAt
    ) {}

    public record FileInfo(
        String name,
        long size,
        String extension,
        String category,
        String modifiedAt
    ) {}

    public record FileListResponse(
        List<FileInfo> files,
        int total
    ) {}

    public record ErrorResponse(String error) {}

    public record SuccessResponse(String message) {}
}
