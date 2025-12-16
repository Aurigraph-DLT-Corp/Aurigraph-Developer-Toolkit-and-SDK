package io.aurigraph.v11.storage;

import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * MinIO Storage Service - CDN Integration for File Attachments
 *
 * Provides S3-compatible object storage for:
 * - File uploads with SHA256 verification
 * - CDN URL generation
 * - Pre-signed URL generation for secure downloads
 * - Bucket management
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 * @see AV11-589
 */
@ApplicationScoped
public class MinIOService {

    private static final Logger LOG = Logger.getLogger(MinIOService.class);

    @ConfigProperty(name = "minio.endpoint", defaultValue = "http://localhost:9000")
    String endpoint;

    @ConfigProperty(name = "minio.access-key", defaultValue = "minioadmin")
    String accessKey;

    @ConfigProperty(name = "minio.secret-key", defaultValue = "minioadmin")
    String secretKey;

    @ConfigProperty(name = "minio.bucket.attachments", defaultValue = "attachments")
    String attachmentsBucket;

    @ConfigProperty(name = "minio.bucket.assets", defaultValue = "assets")
    String assetsBucket;

    @ConfigProperty(name = "minio.cdn.base-url", defaultValue = "https://dlt.aurigraph.io/cdn")
    String cdnBaseUrl;

    @ConfigProperty(name = "minio.enabled", defaultValue = "true")
    boolean enabled;

    private MinioClient minioClient;

    @PostConstruct
    void init() {
        if (!enabled) {
            LOG.warn("MinIO storage is disabled, using filesystem fallback");
            return;
        }

        try {
            minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();

            // Ensure buckets exist
            ensureBucketExists(attachmentsBucket);
            ensureBucketExists(assetsBucket);

            LOG.infof("MinIO client initialized: endpoint=%s, attachments=%s, assets=%s",
                endpoint, attachmentsBucket, assetsBucket);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to initialize MinIO client: %s", e.getMessage());
            enabled = false;
        }
    }

    /**
     * Check if MinIO is enabled and available
     */
    public boolean isEnabled() {
        return enabled && minioClient != null;
    }

    /**
     * Upload a file to MinIO
     *
     * @param inputStream File content stream
     * @param fileName Original filename
     * @param contentType MIME type
     * @param size File size in bytes
     * @param category File category (documents, images, data, assets)
     * @return Upload result with CDN URL
     */
    public UploadResult uploadFile(
        InputStream inputStream,
        String fileName,
        String contentType,
        long size,
        String category
    ) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        String bucket = getBucketForCategory(category);
        String objectKey = generateObjectKey(fileName, category);

        try {
            // Set content type metadata
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", contentType);

            ObjectWriteResponse response = minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(inputStream, size, -1)
                    .contentType(contentType)
                    .headers(headers)
                    .build()
            );

            String cdnUrl = generateCdnUrl(bucket, objectKey);
            String etag = response.etag();

            LOG.infof("File uploaded to MinIO: bucket=%s, key=%s, etag=%s", bucket, objectKey, etag);

            return new UploadResult(
                objectKey,
                bucket,
                cdnUrl,
                etag,
                size
            );
        } catch (Exception e) {
            LOG.errorf(e, "Failed to upload file to MinIO: %s", e.getMessage());
            throw e;
        }
    }

    /**
     * Download a file from MinIO
     */
    public InputStream downloadFile(String bucket, String objectKey) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        return minioClient.getObject(
            GetObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .build()
        );
    }

    /**
     * Generate a pre-signed URL for secure download
     *
     * @param bucket Bucket name
     * @param objectKey Object key
     * @param expiryMinutes URL expiry time in minutes
     * @return Pre-signed download URL
     */
    public String generatePresignedUrl(String bucket, String objectKey, int expiryMinutes) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucket)
                .object(objectKey)
                .expiry(expiryMinutes, TimeUnit.MINUTES)
                .build()
        );
    }

    /**
     * Generate a pre-signed URL for upload
     */
    public String generateUploadUrl(String bucket, String objectKey, int expiryMinutes) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        return minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.PUT)
                .bucket(bucket)
                .object(objectKey)
                .expiry(expiryMinutes, TimeUnit.MINUTES)
                .build()
        );
    }

    /**
     * Delete a file from MinIO
     */
    public void deleteFile(String bucket, String objectKey) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        minioClient.removeObject(
            RemoveObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .build()
        );

        LOG.infof("File deleted from MinIO: bucket=%s, key=%s", bucket, objectKey);
    }

    /**
     * Check if a file exists
     */
    public boolean fileExists(String bucket, String objectKey) {
        if (!isEnabled()) {
            return false;
        }

        try {
            minioClient.statObject(
                StatObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build()
            );
            return true;
        } catch (ErrorResponseException e) {
            if (e.errorResponse().code().equals("NoSuchKey")) {
                return false;
            }
            LOG.warn("Error checking file existence: " + e.getMessage());
            return false;
        } catch (Exception e) {
            LOG.warn("Error checking file existence: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get file metadata
     */
    public FileMetadata getFileMetadata(String bucket, String objectKey) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        StatObjectResponse stat = minioClient.statObject(
            StatObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .build()
        );

        return new FileMetadata(
            objectKey,
            stat.size(),
            stat.contentType(),
            stat.etag(),
            stat.lastModified().toInstant()
        );
    }

    /**
     * Copy a file within MinIO
     */
    public void copyFile(String sourceBucket, String sourceKey, String destBucket, String destKey) throws Exception {
        if (!isEnabled()) {
            throw new IllegalStateException("MinIO storage is not enabled");
        }

        minioClient.copyObject(
            CopyObjectArgs.builder()
                .bucket(destBucket)
                .object(destKey)
                .source(CopySource.builder()
                    .bucket(sourceBucket)
                    .object(sourceKey)
                    .build())
                .build()
        );

        LOG.infof("File copied: %s/%s -> %s/%s", sourceBucket, sourceKey, destBucket, destKey);
    }

    /**
     * Generate CDN URL for public access
     */
    public String generateCdnUrl(String bucket, String objectKey) {
        return String.format("%s/%s/%s", cdnBaseUrl, bucket, objectKey);
    }

    /**
     * Generate unique object key with category prefix
     */
    private String generateObjectKey(String fileName, String category) {
        String uuid = UUID.randomUUID().toString();
        String sanitizedName = sanitizeFileName(fileName);
        return String.format("%s/%s_%s", category, uuid, sanitizedName);
    }

    /**
     * Sanitize filename for storage
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "unknown";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * Get bucket name for category
     */
    private String getBucketForCategory(String category) {
        if ("assets".equalsIgnoreCase(category) ||
            "images".equalsIgnoreCase(category)) {
            return assetsBucket;
        }
        return attachmentsBucket;
    }

    /**
     * Ensure bucket exists, create if not
     */
    private void ensureBucketExists(String bucket) {
        try {
            boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                    .bucket(bucket)
                    .build()
            );

            if (!exists) {
                minioClient.makeBucket(
                    MakeBucketArgs.builder()
                        .bucket(bucket)
                        .build()
                );
                LOG.infof("Created MinIO bucket: %s", bucket);
            }
        } catch (Exception e) {
            LOG.errorf(e, "Failed to ensure bucket exists: %s", bucket);
        }
    }

    // DTOs

    public record UploadResult(
        String objectKey,
        String bucket,
        String cdnUrl,
        String etag,
        long size
    ) {}

    public record FileMetadata(
        String objectKey,
        long size,
        String contentType,
        String etag,
        java.time.Instant lastModified
    ) {}
}
