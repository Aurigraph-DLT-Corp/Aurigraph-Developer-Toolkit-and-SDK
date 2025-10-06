package io.aurigraph.v11.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Token Metadata Entity
 *
 * Stores detailed metadata for individual tokens (NFTs) or token types.
 * Particularly important for ERC721 and ERC1155 tokens where each token
 * can have unique metadata, images, and attributes.
 *
 * Features:
 * - IPFS-based metadata storage
 * - NFT attributes and properties
 * - Real-world asset data integration
 * - Verification and validation tracking
 * - Multi-format media support (images, videos, 3D models)
 *
 * Part of Sprint 12 - Token & RWA APIs (AV11-058)
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 12
 */
@Entity
@Table(name = "token_metadata", indexes = {
    @Index(name = "idx_metadata_token_id", columnList = "token_id"),
    @Index(name = "idx_metadata_token_registry", columnList = "token_registry_id"),
    @Index(name = "idx_metadata_uri", columnList = "metadata_uri"),
    @Index(name = "idx_metadata_ipfs", columnList = "ipfs_hash"),
    @Index(name = "idx_metadata_verification", columnList = "verification_status"),
    @Index(name = "idx_metadata_created", columnList = "created_at")
})
public class TokenMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Token ID (for ERC721/ERC1155)
     * For ERC20, this will be null as metadata applies to all tokens
     */
    @Column(name = "token_id", length = 100)
    private String tokenId;

    /**
     * Reference to the token registry
     * Many-to-One relationship: multiple metadata entries can belong to one token
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token_registry_id", nullable = false)
    private TokenRegistry tokenRegistry;

    /**
     * Metadata URI (URL or IPFS path)
     * Example: "ipfs://QmHash...", "https://api.example.com/metadata/123"
     */
    @Column(name = "metadata_uri", length = 512)
    private String metadataUri;

    /**
     * Token name (can differ from registry name for individual NFTs)
     * Example: "Bored Ape #1234", "Carbon Credit Certificate #5678"
     */
    @Column(name = "name", length = 255)
    private String name;

    /**
     * Detailed description of the token
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Primary image URL or IPFS hash
     * Example: "ipfs://QmImageHash", "https://cdn.example.com/nft/1234.png"
     */
    @Column(name = "image", length = 512)
    private String image;

    /**
     * Image IPFS hash (redundant storage for reliability)
     */
    @Column(name = "image_ipfs_hash", length = 64)
    private String imageIpfsHash;

    /**
     * Animation/video URL for animated NFTs
     */
    @Column(name = "animation_url", length = 512)
    private String animationUrl;

    /**
     * External URL to project/asset website
     */
    @Column(name = "external_url", length = 512)
    private String externalUrl;

    /**
     * Background color (for NFT display)
     * Hex format: "FFFFFF"
     */
    @Column(name = "background_color", length = 6)
    private String backgroundColor;

    /**
     * Token attributes in JSON format
     * OpenSea-compatible format:
     * [
     *   {"trait_type": "Color", "value": "Blue"},
     *   {"trait_type": "Rarity", "value": "Legendary"}
     * ]
     */
    @Column(name = "attributes", columnDefinition = "TEXT")
    private String attributes;

    /**
     * Additional properties in JSON format
     * Custom fields specific to the token type
     */
    @Column(name = "properties", columnDefinition = "TEXT")
    private String properties;

    /**
     * RWA-specific data in JSON format
     * For real-world asset tokens, includes:
     * - Asset location
     * - Asset valuation
     * - Certification details
     * - Ownership documents
     * - Legal compliance data
     */
    @Column(name = "rwa_data", columnDefinition = "TEXT")
    private String rwaData;

    /**
     * IPFS hash of the complete metadata JSON
     */
    @Column(name = "ipfs_hash", length = 64)
    private String ipfsHash;

    /**
     * Metadata verification status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    private MetadataVerificationStatus verificationStatus = MetadataVerificationStatus.UNVERIFIED;

    /**
     * Verifier address (who verified this metadata)
     */
    @Column(name = "verifier_address", length = 66)
    private String verifierAddress;

    /**
     * Verification timestamp
     */
    @Column(name = "verified_at")
    private Instant verifiedAt;

    /**
     * Content hash for integrity verification
     * SHA3-256 hash of all metadata fields
     */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    /**
     * Flag indicating if metadata is frozen (immutable)
     */
    @Column(name = "is_frozen", nullable = false)
    private Boolean isFrozen = false;

    /**
     * Timestamp when metadata was frozen
     */
    @Column(name = "frozen_at")
    private Instant frozenAt;

    /**
     * Media type classification
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 20)
    private MediaType mediaType = MediaType.IMAGE;

    /**
     * File format/MIME type
     * Example: "image/png", "video/mp4", "model/gltf-binary"
     */
    @Column(name = "file_format", length = 50)
    private String fileFormat;

    /**
     * File size in bytes
     */
    @Column(name = "file_size")
    private Long fileSize;

    /**
     * Image dimensions (if applicable)
     * Format: "1920x1080"
     */
    @Column(name = "dimensions", length = 20)
    private String dimensions;

    /**
     * Duration in seconds (for video/audio)
     */
    @Column(name = "duration")
    private Integer duration;

    /**
     * Creator/artist name
     */
    @Column(name = "creator_name", length = 255)
    private String creatorName;

    /**
     * Creator address
     */
    @Column(name = "creator_address", length = 66)
    private String creatorAddress;

    /**
     * Royalty percentage (for NFT resales)
     * Stored as basis points (100 = 1%)
     */
    @Column(name = "royalty_percentage")
    private Integer royaltyPercentage = 0;

    /**
     * Royalty recipient address
     */
    @Column(name = "royalty_recipient", length = 66)
    private String royaltyRecipient;

    /**
     * Category/collection name
     */
    @Column(name = "category", length = 100)
    private String category;

    /**
     * Tags for searchability (comma-separated)
     */
    @Column(name = "tags", length = 500)
    private String tags;

    /**
     * Rarity score (0-100, calculated from attributes)
     */
    @Column(name = "rarity_score")
    private Double rarityScore;

    /**
     * Metadata version (for tracking updates)
     */
    @Column(name = "version")
    private Integer version = 1;

    /**
     * Previous metadata ID (for version tracking)
     */
    @Column(name = "previous_metadata_id")
    private UUID previousMetadataId;

    /**
     * Metadata creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Last update timestamp
     */
    @Column(name = "updated_at")
    private Instant updatedAt;

    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();

        // Generate content hash if not set
        if (contentHash == null) {
            contentHash = generateContentHash();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (!isFrozen) {
            updatedAt = Instant.now();
            // Regenerate content hash on update
            contentHash = generateContentHash();
        } else {
            throw new IllegalStateException("Cannot update frozen metadata");
        }
    }

    // Constructors

    public TokenMetadata() {
    }

    public TokenMetadata(TokenRegistry tokenRegistry, String name, String description) {
        this.tokenRegistry = tokenRegistry;
        this.name = name;
        this.description = description;
        this.verificationStatus = MetadataVerificationStatus.UNVERIFIED;
    }

    // Helper methods

    /**
     * Generate content hash from all metadata fields
     */
    private String generateContentHash() {
        // Simple implementation - in production, use proper SHA3-256 hashing
        StringBuilder content = new StringBuilder();
        if (name != null) content.append(name);
        if (description != null) content.append(description);
        if (image != null) content.append(image);
        if (attributes != null) content.append(attributes);
        if (rwaData != null) content.append(rwaData);

        return UUID.nameUUIDFromBytes(content.toString().getBytes()).toString();
    }

    /**
     * Freeze metadata (make immutable)
     */
    public void freeze() {
        this.isFrozen = true;
        this.frozenAt = Instant.now();
    }

    /**
     * Verify metadata
     */
    public void verify(String verifierAddress) {
        this.verificationStatus = MetadataVerificationStatus.VERIFIED;
        this.verifierAddress = verifierAddress;
        this.verifiedAt = Instant.now();
    }

    /**
     * Reject metadata verification
     */
    public void reject(String verifierAddress) {
        this.verificationStatus = MetadataVerificationStatus.REJECTED;
        this.verifierAddress = verifierAddress;
        this.verifiedAt = Instant.now();
    }

    /**
     * Check if metadata is verified
     */
    public boolean isVerified() {
        return verificationStatus == MetadataVerificationStatus.VERIFIED;
    }

    /**
     * Check if this is RWA metadata
     */
    public boolean hasRWAData() {
        return rwaData != null && !rwaData.trim().isEmpty();
    }

    /**
     * Calculate rarity score from attributes
     */
    public void calculateRarityScore() {
        // Simple implementation - in production, use actual rarity calculation
        // based on attribute frequency in the collection
        if (attributes != null && !attributes.trim().isEmpty()) {
            // Count number of attributes (simple JSON array count)
            int attrCount = attributes.split("\\{").length - 1;
            this.rarityScore = Math.min(100.0, attrCount * 10.0);
        } else {
            this.rarityScore = 0.0;
        }
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTokenId() {
        return tokenId;
    }

    public void setTokenId(String tokenId) {
        this.tokenId = tokenId;
    }

    public TokenRegistry getTokenRegistry() {
        return tokenRegistry;
    }

    public void setTokenRegistry(TokenRegistry tokenRegistry) {
        this.tokenRegistry = tokenRegistry;
    }

    public String getMetadataUri() {
        return metadataUri;
    }

    public void setMetadataUri(String metadataUri) {
        this.metadataUri = metadataUri;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getImageIpfsHash() {
        return imageIpfsHash;
    }

    public void setImageIpfsHash(String imageIpfsHash) {
        this.imageIpfsHash = imageIpfsHash;
    }

    public String getAnimationUrl() {
        return animationUrl;
    }

    public void setAnimationUrl(String animationUrl) {
        this.animationUrl = animationUrl;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public String getAttributes() {
        return attributes;
    }

    public void setAttributes(String attributes) {
        this.attributes = attributes;
    }

    public String getProperties() {
        return properties;
    }

    public void setProperties(String properties) {
        this.properties = properties;
    }

    public String getRwaData() {
        return rwaData;
    }

    public void setRwaData(String rwaData) {
        this.rwaData = rwaData;
    }

    public String getIpfsHash() {
        return ipfsHash;
    }

    public void setIpfsHash(String ipfsHash) {
        this.ipfsHash = ipfsHash;
    }

    public MetadataVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(MetadataVerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getVerifierAddress() {
        return verifierAddress;
    }

    public void setVerifierAddress(String verifierAddress) {
        this.verifierAddress = verifierAddress;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public Boolean getIsFrozen() {
        return isFrozen;
    }

    public void setIsFrozen(Boolean isFrozen) {
        this.isFrozen = isFrozen;
    }

    public Instant getFrozenAt() {
        return frozenAt;
    }

    public void setFrozenAt(Instant frozenAt) {
        this.frozenAt = frozenAt;
    }

    public MediaType getMediaType() {
        return mediaType;
    }

    public void setMediaType(MediaType mediaType) {
        this.mediaType = mediaType;
    }

    public String getFileFormat() {
        return fileFormat;
    }

    public void setFileFormat(String fileFormat) {
        this.fileFormat = fileFormat;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getDimensions() {
        return dimensions;
    }

    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getCreatorAddress() {
        return creatorAddress;
    }

    public void setCreatorAddress(String creatorAddress) {
        this.creatorAddress = creatorAddress;
    }

    public Integer getRoyaltyPercentage() {
        return royaltyPercentage;
    }

    public void setRoyaltyPercentage(Integer royaltyPercentage) {
        this.royaltyPercentage = royaltyPercentage;
    }

    public String getRoyaltyRecipient() {
        return royaltyRecipient;
    }

    public void setRoyaltyRecipient(String royaltyRecipient) {
        this.royaltyRecipient = royaltyRecipient;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Double getRarityScore() {
        return rarityScore;
    }

    public void setRarityScore(Double rarityScore) {
        this.rarityScore = rarityScore;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public UUID getPreviousMetadataId() {
        return previousMetadataId;
    }

    public void setPreviousMetadataId(UUID previousMetadataId) {
        this.previousMetadataId = previousMetadataId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    @Override
    public String toString() {
        return "TokenMetadata{" +
                "id=" + id +
                ", tokenId='" + tokenId + '\'' +
                ", name='" + name + '\'' +
                ", verificationStatus=" + verificationStatus +
                ", mediaType=" + mediaType +
                ", isFrozen=" + isFrozen +
                '}';
    }
}

/**
 * Metadata Verification Status Enumeration
 */
enum MetadataVerificationStatus {
    /**
     * Metadata not yet verified
     */
    UNVERIFIED,

    /**
     * Metadata under verification
     */
    PENDING,

    /**
     * Metadata verified and approved
     */
    VERIFIED,

    /**
     * Metadata verification rejected
     */
    REJECTED,

    /**
     * Metadata flagged for review
     */
    FLAGGED
}

/**
 * Media Type Enumeration
 */
enum MediaType {
    /**
     * Static image
     */
    IMAGE,

    /**
     * Video/animation
     */
    VIDEO,

    /**
     * Audio file
     */
    AUDIO,

    /**
     * 3D model
     */
    MODEL_3D,

    /**
     * Document/PDF
     */
    DOCUMENT,

    /**
     * Other/mixed media
     */
    OTHER
}
