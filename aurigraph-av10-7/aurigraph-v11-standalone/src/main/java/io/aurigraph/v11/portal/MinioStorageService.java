package io.aurigraph.v11.portal;

import io.minio.*;
import io.minio.errors.*;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

/**
 * MinIO Storage Service for CDN file uploads
 *
 * Handles file uploads to MinIO object storage and returns CDN URLs.
 * Files are accessible via nginx CDN proxy at /cdn/{bucket}/{object}
 *
 * CDN URL patterns:
 * - Attachments: https://dlt.aurigraph.io/cdn/attachments/{hash}_{filename}
 * - Documents:   https://dlt.aurigraph.io/cdn/documents/{hash}_{filename}
 * - Assets:      https://dlt.aurigraph.io/cdn/assets/{hash}_{filename}
 *
 * @author J4C Deployment Agent
 * @version 12.0.0
 * @since AV11-590
 */
@ApplicationScoped
public class MinioStorageService {

    private static final Logger LOG = Logger.getLogger(MinioStorageService.class);

    @ConfigProperty(name = "aurigraph.minio.endpoint", defaultValue = "http://localhost:9000")
    String minioEndpoint;

    @ConfigProperty(name = "aurigraph.minio.access-key", defaultValue = "aurigraph")
    String accessKey;

    @ConfigProperty(name = "aurigraph.minio.secret-key", defaultValue = "Aurigraph2025CDN")
    String secretKey;

    @ConfigProperty(name = "aurigraph.minio.bucket.attachments", defaultValue = "attachments")
    String attachmentsBucket;

    @ConfigProperty(name = "aurigraph.minio.bucket.documents", defaultValue = "documents")
    String documentsBucket;

    @ConfigProperty(name = "aurigraph.minio.bucket.assets", defaultValue = "assets")
    String assetsBucket;

    @ConfigProperty(name = "aurigraph.cdn.base-url", defaultValue = "https://dlt.aurigraph.io/cdn")
    String cdnBaseUrl;

    @ConfigProperty(name = "aurigraph.minio.enabled", defaultValue = "true")
    boolean minioEnabled;

    private MinioClient minioClient;
    private boolean initialized = false;

    @PostConstruct
    void init() {
        if (!minioEnabled) {
            LOG.info("MinIO storage is disabled, using local filesystem");
            return;
        }

        try {
            minioClient = MinioClient.builder()
                    .endpoint(minioEndpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // Ensure buckets exist
            ensureBucketExists(attachmentsBucket);
            ensureBucketExists(documentsBucket);
            ensureBucketExists(assetsBucket);

            initialized = true;
            LOG.infof("MinIO storage service initialized at %s", minioEndpoint);
        } catch (Exception e) {
            LOG.warnf(e, "Failed to initialize MinIO client, falling back to local storage");
            initialized = false;
        }
    }

    private void ensureBucketExists(String bucketName) {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                LOG.infof("Created MinIO bucket: %s", bucketName);
            }
        } catch (Exception e) {
            LOG.warnf(e, "Failed to check/create bucket: %s", bucketName);
        }
    }

    /**
     * Check if MinIO storage is available
     */
    public boolean isAvailable() {
        return minioEnabled && initialized && minioClient != null;
    }

    /**
     * Upload a file to MinIO and return the CDN URL
     *
     * @param filePath Local file path to upload
     * @param objectName Name of the object in MinIO (e.g., "abc123_document.pdf")
     * @param category File category (attachments, documents, assets)
     * @param contentType MIME type of the file
     * @return CDN URL or empty if upload failed
     */
    public Optional<String> uploadFile(Path filePath, String objectName, String category, String contentType) {
        if (!isAvailable()) {
            LOG.warn("MinIO not available, skipping upload");
            return Optional.empty();
        }

        String bucket = getBucketForCategory(category);

        try {
            minioClient.uploadObject(UploadObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .filename(filePath.toString())
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build());

            String cdnUrl = buildCdnUrl(bucket, objectName);
            LOG.infof("File uploaded to MinIO: %s -> %s", objectName, cdnUrl);
            return Optional.of(cdnUrl);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to upload file to MinIO: %s", objectName);
            return Optional.empty();
        }
    }

    /**
     * Upload a file from InputStream to MinIO
     *
     * @param inputStream File input stream
     * @param objectName Name of the object in MinIO
     * @param category File category
     * @param contentType MIME type
     * @param size File size in bytes
     * @return CDN URL or empty if upload failed
     */
    public Optional<String> uploadStream(InputStream inputStream, String objectName,
                                         String category, String contentType, long size) {
        if (!isAvailable()) {
            LOG.warn("MinIO not available, skipping stream upload");
            return Optional.empty();
        }

        String bucket = getBucketForCategory(category);

        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(inputStream, size, -1)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build());

            String cdnUrl = buildCdnUrl(bucket, objectName);
            LOG.infof("Stream uploaded to MinIO: %s -> %s", objectName, cdnUrl);
            return Optional.of(cdnUrl);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to upload stream to MinIO: %s", objectName);
            return Optional.empty();
        }
    }

    /**
     * Delete a file from MinIO
     *
     * @param objectName Name of the object to delete
     * @param category File category
     * @return true if deleted successfully
     */
    public boolean deleteFile(String objectName, String category) {
        if (!isAvailable()) {
            return false;
        }

        String bucket = getBucketForCategory(category);

        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
            LOG.infof("File deleted from MinIO: %s/%s", bucket, objectName);
            return true;
        } catch (Exception e) {
            LOG.errorf(e, "Failed to delete file from MinIO: %s/%s", bucket, objectName);
            return false;
        }
    }

    /**
     * Check if an object exists in MinIO
     *
     * @param objectName Object name to check
     * @param category File category
     * @return true if object exists
     */
    public boolean objectExists(String objectName, String category) {
        if (!isAvailable()) {
            return false;
        }

        String bucket = getBucketForCategory(category);

        try {
            minioClient.statObject(StatObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
            return true;
        } catch (ErrorResponseException e) {
            if (e.errorResponse().code().equals("NoSuchKey")) {
                return false;
            }
            LOG.warnf(e, "Error checking object existence: %s/%s", bucket, objectName);
            return false;
        } catch (Exception e) {
            LOG.warnf(e, "Error checking object existence: %s/%s", bucket, objectName);
            return false;
        }
    }

    /**
     * Get the appropriate bucket for a file category
     */
    private String getBucketForCategory(String category) {
        if (category == null) {
            return attachmentsBucket;
        }

        return switch (category.toLowerCase()) {
            case "documents", "contracts", "legal" -> documentsBucket;
            case "assets", "images", "media" -> assetsBucket;
            default -> attachmentsBucket;
        };
    }

    /**
     * Build the CDN URL for an object
     */
    public String buildCdnUrl(String bucket, String objectName) {
        return String.format("%s/%s/%s", cdnBaseUrl, bucket, objectName);
    }

    /**
     * Get CDN URL for an existing attachment
     *
     * @param storedName The stored filename
     * @param category File category
     * @return CDN URL
     */
    public String getCdnUrl(String storedName, String category) {
        String bucket = getBucketForCategory(category);
        return buildCdnUrl(bucket, storedName);
    }
}
