package io.aurigraph.v11.contracts.composite;

import java.time.Instant;
import java.util.*;

/**
 * Media Token (ERC-1155) - Manages rich media content for tokenized assets
 * Part of composite token package - wAUR-MEDIA-{ID}[]
 * Integrates with IPFS for decentralized storage
 */
public class MediaToken extends SecondaryToken {
    private List<MediaContent> mediaList;
    private Map<String, AccessLevel> accessControls;
    private String ipfsGateway;
    private boolean encryptionEnabled;
    private Map<MediaType, Integer> mediaTypeCounts;

    public MediaToken(String tokenId, String compositeId, List<MediaContent> mediaList) {
        super(tokenId, compositeId, SecondaryTokenType.MEDIA);
        this.mediaList = new ArrayList<>(mediaList);
        this.accessControls = new HashMap<>();
        this.ipfsGateway = "https://ipfs.aurigraph.io";
        this.encryptionEnabled = false;
        this.mediaTypeCounts = new HashMap<>();
        updateMediaTypeCounts();
    }

    /**
     * Add new media content to the token
     */
    public String addMediaContent(MediaContent content) {
        // Generate unique content ID
        String contentId = generateContentId(content);
        content.setContentId(contentId);
        content.setUploadedAt(Instant.now());
        
        // Add to media list
        mediaList.add(content);
        
        // Update type counts
        updateMediaTypeCounts();
        
        // Set default access level
        accessControls.put(contentId, AccessLevel.OWNER_ONLY);
        
        setLastUpdated(Instant.now());
        return contentId;
    }

    /**
     * Remove media content
     */
    public boolean removeMediaContent(String contentId) {
        boolean removed = mediaList.removeIf(content -> contentId.equals(content.getContentId()));
        if (removed) {
            accessControls.remove(contentId);
            updateMediaTypeCounts();
            setLastUpdated(Instant.now());
        }
        return removed;
    }

    /**
     * Update media content metadata
     */
    public boolean updateMediaContent(String contentId, Map<String, Object> metadata) {
        for (MediaContent content : mediaList) {
            if (contentId.equals(content.getContentId())) {
                content.updateMetadata(metadata);
                setLastUpdated(Instant.now());
                return true;
            }
        }
        return false;
    }

    /**
     * Get media content by ID
     */
    public Optional<MediaContent> getMediaContent(String contentId) {
        return mediaList.stream()
            .filter(content -> contentId.equals(content.getContentId()))
            .findFirst();
    }

    /**
     * Get media content by type
     */
    public List<MediaContent> getMediaByType(MediaType mediaType) {
        return mediaList.stream()
            .filter(content -> content.getMediaType() == mediaType)
            .toList();
    }

    /**
     * Set access level for specific content
     */
    public void setAccessLevel(String contentId, AccessLevel accessLevel) {
        accessControls.put(contentId, accessLevel);
        setLastUpdated(Instant.now());
    }

    /**
     * Check if user can access specific content
     */
    public boolean canAccess(String contentId, String userAddress, String ownerAddress, boolean isVerifier) {
        AccessLevel level = accessControls.getOrDefault(contentId, AccessLevel.OWNER_ONLY);
        
        return switch (level) {
            case PUBLIC -> true;
            case OWNER_ONLY -> userAddress.equals(ownerAddress);
            case VERIFIER_ONLY -> isVerifier || userAddress.equals(ownerAddress);
            case RESTRICTED -> userAddress.equals(ownerAddress); // Could add more sophisticated logic
        };
    }

    /**
     * Get IPFS URL for content
     */
    public String getContentUrl(String contentId) {
        Optional<MediaContent> content = getMediaContent(contentId);
        if (content.isPresent()) {
            return ipfsGateway + "/ipfs/" + content.get().getIpfsHash();
        }
        return null;
    }

    /**
     * Verify media authenticity using fingerprinting
     */
    public boolean verifyAuthenticity(String contentId) {
        Optional<MediaContent> content = getMediaContent(contentId);
        if (content.isEmpty()) {
            return false;
        }
        
        // Simulate fingerprint verification
        MediaContent mediaContent = content.get();
        return mediaContent.getFingerprint() != null && 
               mediaContent.getFingerprint().length() == 64; // SHA-256 length
    }

    /**
     * Get media statistics
     */
    public MediaStats getMediaStats() {
        long totalSize = mediaList.stream()
            .mapToLong(MediaContent::getFileSize)
            .sum();
        
        return new MediaStats(
            mediaList.size(),
            totalSize,
            new HashMap<>(mediaTypeCounts),
            getPublicContentCount(),
            getEncryptedContentCount()
        );
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        if (updateData.containsKey("ipfsGateway")) {
            this.ipfsGateway = (String) updateData.get("ipfsGateway");
        }
        if (updateData.containsKey("encryptionEnabled")) {
            this.encryptionEnabled = (Boolean) updateData.get("encryptionEnabled");
        }
        setLastUpdated(Instant.now());
    }

    // Private helper methods
    private String generateContentId(MediaContent content) {
        return String.format("media-%s-%s-%d", 
            content.getMediaType().name().toLowerCase(),
            content.getIpfsHash().substring(0, 8),
            System.nanoTime());
    }

    private void updateMediaTypeCounts() {
        mediaTypeCounts.clear();
        for (MediaContent content : mediaList) {
            mediaTypeCounts.merge(content.getMediaType(), 1, Integer::sum);
        }
    }

    private int getPublicContentCount() {
        return (int) accessControls.values().stream()
            .filter(level -> level == AccessLevel.PUBLIC)
            .count();
    }

    private int getEncryptedContentCount() {
        return (int) mediaList.stream()
            .filter(MediaContent::isEncrypted)
            .count();
    }

    // Getters
    public List<MediaContent> getMediaList() { return List.copyOf(mediaList); }
    public Map<String, AccessLevel> getAccessControls() { return Map.copyOf(accessControls); }
    public String getIpfsGateway() { return ipfsGateway; }
    public boolean isEncryptionEnabled() { return encryptionEnabled; }
    public Map<MediaType, Integer> getMediaTypeCounts() { return Map.copyOf(mediaTypeCounts); }

    // Setters
    public void setIpfsGateway(String ipfsGateway) { this.ipfsGateway = ipfsGateway; }
    public void setEncryptionEnabled(boolean encryptionEnabled) { this.encryptionEnabled = encryptionEnabled; }
}

/**
 * Represents individual media content item
 */
class MediaContent {
    private String contentId;
    private MediaType mediaType;
    private String filename;
    private String ipfsHash;
    private long fileSize;
    private String mimeType;
    private String fingerprint; // For authenticity verification
    private Map<String, Object> metadata;
    private boolean encrypted;
    private Instant uploadedAt;
    private String description;
    private List<String> tags;

    public MediaContent(MediaType mediaType, String filename, String ipfsHash, 
                       long fileSize, String mimeType) {
        this.mediaType = mediaType;
        this.filename = filename;
        this.ipfsHash = ipfsHash;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.metadata = new HashMap<>();
        this.encrypted = false;
        this.tags = new ArrayList<>();
    }

    public void updateMetadata(Map<String, Object> newMetadata) {
        this.metadata.putAll(newMetadata);
    }

    // Getters and setters
    public String getContentId() { return contentId; }
    public void setContentId(String contentId) { this.contentId = contentId; }
    
    public MediaType getMediaType() { return mediaType; }
    public String getFilename() { return filename; }
    public String getIpfsHash() { return ipfsHash; }
    public long getFileSize() { return fileSize; }
    public String getMimeType() { return mimeType; }
    public String getFingerprint() { return fingerprint; }
    public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }
    
    public Map<String, Object> getMetadata() { return Map.copyOf(metadata); }
    public boolean isEncrypted() { return encrypted; }
    public void setEncrypted(boolean encrypted) { this.encrypted = encrypted; }
    
    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<String> getTags() { return List.copyOf(tags); }
    public void setTags(List<String> tags) { this.tags = new ArrayList<>(tags); }
}

/**
 * Media content types supported
 */
enum MediaType {
    IMAGE,          // High-resolution photos
    VIDEO,          // Property videos, virtual tours
    DOCUMENT,       // Legal documents, contracts
    MODEL_3D,       // 3D models and digital twins
    AUDIO,          // Audio recordings
    VIRTUAL_TOUR,   // 360° virtual tours
    FLOOR_PLAN,     // Architectural drawings
    INSPECTION_REPORT, // Professional inspection reports
    IOT_DATA        // Real-time sensor data feeds
}

/**
 * Access control levels for media content
 */
enum AccessLevel {
    PUBLIC,         // Publicly accessible
    OWNER_ONLY,     // Only owner can access
    VERIFIER_ONLY,  // Only verifiers and owner
    RESTRICTED      // Custom access rules
}

/**
 * Media statistics
 */
class MediaStats {
    private final int totalContentItems;
    private final long totalSizeBytes;
    private final Map<MediaType, Integer> typeDistribution;
    private final int publicContentCount;
    private final int encryptedContentCount;

    public MediaStats(int totalContentItems, long totalSizeBytes, 
                     Map<MediaType, Integer> typeDistribution, 
                     int publicContentCount, int encryptedContentCount) {
        this.totalContentItems = totalContentItems;
        this.totalSizeBytes = totalSizeBytes;
        this.typeDistribution = typeDistribution;
        this.publicContentCount = publicContentCount;
        this.encryptedContentCount = encryptedContentCount;
    }

    // Getters
    public int getTotalContentItems() { return totalContentItems; }
    public long getTotalSizeBytes() { return totalSizeBytes; }
    public Map<MediaType, Integer> getTypeDistribution() { return typeDistribution; }
    public int getPublicContentCount() { return publicContentCount; }
    public int getEncryptedContentCount() { return encryptedContentCount; }
}