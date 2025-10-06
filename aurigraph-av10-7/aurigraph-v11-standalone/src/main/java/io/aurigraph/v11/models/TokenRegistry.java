package io.aurigraph.v11.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Token Registry Entity
 *
 * Central registry for all tokens created on the Aurigraph V11 platform.
 * Supports ERC20, ERC721, and ERC1155 token standards with RWA integration.
 *
 * Features:
 * - Multi-standard token support (ERC20/721/1155)
 * - Real-world asset (RWA) tokenization tracking
 * - IPFS metadata storage
 * - Deployment transaction tracking
 * - Supply and circulation management
 *
 * Part of Sprint 12 - Token & RWA APIs (AV11-058)
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 12
 */
@Entity
@Table(name = "token_registry", indexes = {
    @Index(name = "idx_token_address", columnList = "token_address", unique = true),
    @Index(name = "idx_token_type", columnList = "token_type"),
    @Index(name = "idx_token_symbol", columnList = "symbol"),
    @Index(name = "idx_token_rwa", columnList = "is_rwa"),
    @Index(name = "idx_token_created", columnList = "created_at"),
    @Index(name = "idx_token_contract", columnList = "contract_address"),
    @Index(name = "idx_token_deployment", columnList = "deployment_tx_hash")
})
public class TokenRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Unique token address on Aurigraph network
     * Format: 0x[64 hex chars] (SHA3-256 hash)
     */
    @Column(name = "token_address", nullable = false, unique = true, length = 66)
    private String tokenAddress;

    /**
     * Token standard type
     * ERC20: Fungible tokens
     * ERC721: Non-fungible tokens (NFTs)
     * ERC1155: Multi-token standard
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 20)
    private TokenType tokenType;

    /**
     * Human-readable token name
     * Example: "Aurigraph Wrapped Gold", "Carbon Credit Token"
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Token ticker symbol
     * Example: "wAUG", "CCT", "RWA-GOLD"
     */
    @Column(name = "symbol", nullable = false, length = 20)
    private String symbol;

    /**
     * Decimal precision for token amounts
     * Standard: 18 for ERC20, 0 for ERC721, variable for ERC1155
     */
    @Column(name = "decimals", nullable = false)
    private Integer decimals = 18;

    /**
     * Total supply of tokens
     * For ERC721: number of minted NFTs
     * For ERC20: total fungible tokens
     * For ERC1155: sum of all token types
     */
    @Column(name = "total_supply", precision = 36, scale = 0)
    private BigDecimal totalSupply = BigDecimal.ZERO;

    /**
     * Circulating supply (total supply minus burned/locked tokens)
     */
    @Column(name = "circulating_supply", precision = 36, scale = 0)
    private BigDecimal circulatingSupply = BigDecimal.ZERO;

    /**
     * Smart contract address if deployed via contract factory
     */
    @Column(name = "contract_address", length = 66)
    private String contractAddress;

    /**
     * Transaction hash of the deployment transaction
     */
    @Column(name = "deployment_tx_hash", length = 66)
    private String deploymentTxHash;

    /**
     * Block number where token was deployed
     */
    @Column(name = "deployment_block")
    private Long deploymentBlock;

    /**
     * Flag indicating if this token represents a Real-World Asset
     */
    @Column(name = "is_rwa", nullable = false)
    private Boolean isRWA = false;

    /**
     * Reference to RWA asset ID (if isRWA = true)
     * Links to external RWA tokenization system
     */
    @Column(name = "rwa_asset_id", length = 100)
    private String rwaAssetId;

    /**
     * Token metadata in JSON format
     * Contains custom properties, descriptions, images, etc.
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * IPFS hash for metadata storage
     * Used for decentralized metadata hosting
     */
    @Column(name = "ipfs_hash", length = 64)
    private String ipfsHash;

    /**
     * Token creator/deployer address
     */
    @Column(name = "creator_address", nullable = false, length = 66)
    private String creatorAddress;

    /**
     * Current token owner/controller address (for admin functions)
     */
    @Column(name = "owner_address", nullable = false, length = 66)
    private String ownerAddress;

    /**
     * Flag indicating if token is mintable after creation
     */
    @Column(name = "is_mintable", nullable = false)
    private Boolean isMintable = false;

    /**
     * Flag indicating if token is burnable
     */
    @Column(name = "is_burnable", nullable = false)
    private Boolean isBurnable = false;

    /**
     * Flag indicating if token is pausable
     */
    @Column(name = "is_pausable", nullable = false)
    private Boolean isPausable = false;

    /**
     * Current pause state
     */
    @Column(name = "is_paused", nullable = false)
    private Boolean isPaused = false;

    /**
     * Token verification status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    /**
     * Token listing status (for DEX/exchanges)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "listing_status", length = 20)
    private ListingStatus listingStatus = ListingStatus.UNLISTED;

    /**
     * Current market price in AUR (if listed)
     */
    @Column(name = "market_price", precision = 36, scale = 18)
    private BigDecimal marketPrice;

    /**
     * 24-hour trading volume
     */
    @Column(name = "volume_24h", precision = 36, scale = 18)
    private BigDecimal volume24h = BigDecimal.ZERO;

    /**
     * Market capitalization (total supply * market price)
     */
    @Column(name = "market_cap", precision = 36, scale = 18)
    private BigDecimal marketCap;

    /**
     * Total number of unique holders
     */
    @Column(name = "holder_count")
    private Long holderCount = 0L;

    /**
     * Total number of transfers
     */
    @Column(name = "transfer_count")
    private Long transferCount = 0L;

    /**
     * Website URL for token project
     */
    @Column(name = "website_url", length = 255)
    private String websiteUrl;

    /**
     * Social media links (JSON array)
     */
    @Column(name = "social_links", columnDefinition = "TEXT")
    private String socialLinks;

    /**
     * Audit report URL/hash
     */
    @Column(name = "audit_report", length = 255)
    private String auditReport;

    /**
     * Compliance certifications (JSON array)
     */
    @Column(name = "compliance_certs", columnDefinition = "TEXT")
    private String complianceCerts;

    /**
     * Token category/tags (comma-separated)
     * Examples: "DeFi,Stablecoin", "NFT,Gaming", "RWA,Carbon"
     */
    @Column(name = "categories", length = 255)
    private String categories;

    /**
     * Risk score (1-10, calculated by AI)
     * 1 = Very Low Risk, 10 = Very High Risk
     */
    @Column(name = "risk_score")
    private Integer riskScore = 5;

    /**
     * Liquidity score (0-100, calculated by AI)
     * 0 = No liquidity, 100 = Highly liquid
     */
    @Column(name = "liquidity_score")
    private Double liquidityScore = 0.0;

    /**
     * Last price update timestamp
     */
    @Column(name = "last_price_update")
    private Instant lastPriceUpdate;

    /**
     * Token creation timestamp
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

    /**
     * Deletion timestamp
     */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();

        // Auto-generate token address if not set
        if (tokenAddress == null) {
            tokenAddress = generateTokenAddress();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();

        // Auto-calculate market cap if price is available
        if (marketPrice != null && totalSupply != null) {
            marketCap = marketPrice.multiply(totalSupply);
        }
    }

    // Constructors

    public TokenRegistry() {
    }

    public TokenRegistry(String name, String symbol, TokenType tokenType, String creatorAddress) {
        this.name = name;
        this.symbol = symbol;
        this.tokenType = tokenType;
        this.creatorAddress = creatorAddress;
        this.ownerAddress = creatorAddress;
        this.verificationStatus = VerificationStatus.PENDING;
        this.listingStatus = ListingStatus.UNLISTED;
    }

    // Helper methods

    /**
     * Generate unique token address using UUID
     */
    private String generateTokenAddress() {
        return "0x" + UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Calculate market capitalization
     */
    public BigDecimal calculateMarketCap() {
        if (marketPrice != null && circulatingSupply != null) {
            return marketPrice.multiply(circulatingSupply);
        }
        return BigDecimal.ZERO;
    }

    /**
     * Check if token is active and tradeable
     */
    public boolean isTradeable() {
        return verificationStatus == VerificationStatus.VERIFIED
            && listingStatus == ListingStatus.LISTED
            && !isPaused
            && !isDeleted;
    }

    /**
     * Check if token is an RWA token
     */
    public boolean isRealWorldAsset() {
        return isRWA != null && isRWA && rwaAssetId != null;
    }

    /**
     * Increment holder count
     */
    public void incrementHolderCount() {
        this.holderCount = (this.holderCount != null ? this.holderCount : 0L) + 1;
    }

    /**
     * Decrement holder count
     */
    public void decrementHolderCount() {
        this.holderCount = Math.max(0, (this.holderCount != null ? this.holderCount : 0L) - 1);
    }

    /**
     * Increment transfer count
     */
    public void incrementTransferCount() {
        this.transferCount = (this.transferCount != null ? this.transferCount : 0L) + 1;
    }

    /**
     * Update market price and volume
     */
    public void updateMarketData(BigDecimal newPrice, BigDecimal tradingVolume) {
        this.marketPrice = newPrice;
        this.volume24h = tradingVolume;
        this.lastPriceUpdate = Instant.now();
        this.marketCap = calculateMarketCap();
    }

    /**
     * Mint new tokens (increase total supply)
     */
    public void mint(BigDecimal amount) {
        if (!isMintable) {
            throw new IllegalStateException("Token is not mintable");
        }
        this.totalSupply = this.totalSupply.add(amount);
        this.circulatingSupply = this.circulatingSupply.add(amount);
    }

    /**
     * Burn tokens (decrease total supply)
     */
    public void burn(BigDecimal amount) {
        if (!isBurnable) {
            throw new IllegalStateException("Token is not burnable");
        }
        if (this.totalSupply.compareTo(amount) < 0) {
            throw new IllegalArgumentException("Burn amount exceeds total supply");
        }
        this.totalSupply = this.totalSupply.subtract(amount);
        this.circulatingSupply = this.circulatingSupply.subtract(amount);
    }

    /**
     * Pause token transfers
     */
    public void pause() {
        if (!isPausable) {
            throw new IllegalStateException("Token is not pausable");
        }
        this.isPaused = true;
    }

    /**
     * Unpause token transfers
     */
    public void unpause() {
        if (!isPausable) {
            throw new IllegalStateException("Token is not pausable");
        }
        this.isPaused = false;
    }

    /**
     * Verify token
     */
    public void verify() {
        this.verificationStatus = VerificationStatus.VERIFIED;
    }

    /**
     * List token on exchange
     */
    public void list() {
        if (verificationStatus != VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Token must be verified before listing");
        }
        this.listingStatus = ListingStatus.LISTED;
    }

    /**
     * Soft delete token
     */
    public void softDelete() {
        this.isDeleted = true;
        this.deletedAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTokenAddress() {
        return tokenAddress;
    }

    public void setTokenAddress(String tokenAddress) {
        this.tokenAddress = tokenAddress;
    }

    public TokenType getTokenType() {
        return tokenType;
    }

    public void setTokenType(TokenType tokenType) {
        this.tokenType = tokenType;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Integer getDecimals() {
        return decimals;
    }

    public void setDecimals(Integer decimals) {
        this.decimals = decimals;
    }

    public BigDecimal getTotalSupply() {
        return totalSupply;
    }

    public void setTotalSupply(BigDecimal totalSupply) {
        this.totalSupply = totalSupply;
    }

    public BigDecimal getCirculatingSupply() {
        return circulatingSupply;
    }

    public void setCirculatingSupply(BigDecimal circulatingSupply) {
        this.circulatingSupply = circulatingSupply;
    }

    public String getContractAddress() {
        return contractAddress;
    }

    public void setContractAddress(String contractAddress) {
        this.contractAddress = contractAddress;
    }

    public String getDeploymentTxHash() {
        return deploymentTxHash;
    }

    public void setDeploymentTxHash(String deploymentTxHash) {
        this.deploymentTxHash = deploymentTxHash;
    }

    public Long getDeploymentBlock() {
        return deploymentBlock;
    }

    public void setDeploymentBlock(Long deploymentBlock) {
        this.deploymentBlock = deploymentBlock;
    }

    public Boolean getIsRWA() {
        return isRWA;
    }

    public void setIsRWA(Boolean isRWA) {
        this.isRWA = isRWA;
    }

    public String getRwaAssetId() {
        return rwaAssetId;
    }

    public void setRwaAssetId(String rwaAssetId) {
        this.rwaAssetId = rwaAssetId;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public String getIpfsHash() {
        return ipfsHash;
    }

    public void setIpfsHash(String ipfsHash) {
        this.ipfsHash = ipfsHash;
    }

    public String getCreatorAddress() {
        return creatorAddress;
    }

    public void setCreatorAddress(String creatorAddress) {
        this.creatorAddress = creatorAddress;
    }

    public String getOwnerAddress() {
        return ownerAddress;
    }

    public void setOwnerAddress(String ownerAddress) {
        this.ownerAddress = ownerAddress;
    }

    public Boolean getIsMintable() {
        return isMintable;
    }

    public void setIsMintable(Boolean isMintable) {
        this.isMintable = isMintable;
    }

    public Boolean getIsBurnable() {
        return isBurnable;
    }

    public void setIsBurnable(Boolean isBurnable) {
        this.isBurnable = isBurnable;
    }

    public Boolean getIsPausable() {
        return isPausable;
    }

    public void setIsPausable(Boolean isPausable) {
        this.isPausable = isPausable;
    }

    public Boolean getIsPaused() {
        return isPaused;
    }

    public void setIsPaused(Boolean isPaused) {
        this.isPaused = isPaused;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public ListingStatus getListingStatus() {
        return listingStatus;
    }

    public void setListingStatus(ListingStatus listingStatus) {
        this.listingStatus = listingStatus;
    }

    public BigDecimal getMarketPrice() {
        return marketPrice;
    }

    public void setMarketPrice(BigDecimal marketPrice) {
        this.marketPrice = marketPrice;
    }

    public BigDecimal getVolume24h() {
        return volume24h;
    }

    public void setVolume24h(BigDecimal volume24h) {
        this.volume24h = volume24h;
    }

    public BigDecimal getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(BigDecimal marketCap) {
        this.marketCap = marketCap;
    }

    public Long getHolderCount() {
        return holderCount;
    }

    public void setHolderCount(Long holderCount) {
        this.holderCount = holderCount;
    }

    public Long getTransferCount() {
        return transferCount;
    }

    public void setTransferCount(Long transferCount) {
        this.transferCount = transferCount;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    public String getSocialLinks() {
        return socialLinks;
    }

    public void setSocialLinks(String socialLinks) {
        this.socialLinks = socialLinks;
    }

    public String getAuditReport() {
        return auditReport;
    }

    public void setAuditReport(String auditReport) {
        this.auditReport = auditReport;
    }

    public String getComplianceCerts() {
        return complianceCerts;
    }

    public void setComplianceCerts(String complianceCerts) {
        this.complianceCerts = complianceCerts;
    }

    public String getCategories() {
        return categories;
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public Double getLiquidityScore() {
        return liquidityScore;
    }

    public void setLiquidityScore(Double liquidityScore) {
        this.liquidityScore = liquidityScore;
    }

    public Instant getLastPriceUpdate() {
        return lastPriceUpdate;
    }

    public void setLastPriceUpdate(Instant lastPriceUpdate) {
        this.lastPriceUpdate = lastPriceUpdate;
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

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    @Override
    public String toString() {
        return "TokenRegistry{" +
                "id=" + id +
                ", tokenAddress='" + tokenAddress + '\'' +
                ", tokenType=" + tokenType +
                ", name='" + name + '\'' +
                ", symbol='" + symbol + '\'' +
                ", totalSupply=" + totalSupply +
                ", verificationStatus=" + verificationStatus +
                ", listingStatus=" + listingStatus +
                ", isRWA=" + isRWA +
                '}';
    }
}

/**
 * Token Type Enumeration
 */
enum TokenType {
    /**
     * ERC20 - Fungible token standard
     */
    ERC20,

    /**
     * ERC721 - Non-fungible token (NFT) standard
     */
    ERC721,

    /**
     * ERC1155 - Multi-token standard (fungible + non-fungible)
     */
    ERC1155
}

/**
 * Verification Status Enumeration
 */
enum VerificationStatus {
    /**
     * Token verification pending
     */
    PENDING,

    /**
     * Token under review
     */
    IN_REVIEW,

    /**
     * Token verified and approved
     */
    VERIFIED,

    /**
     * Token verification rejected
     */
    REJECTED,

    /**
     * Token suspended due to compliance issues
     */
    SUSPENDED
}

/**
 * Listing Status Enumeration
 */
enum ListingStatus {
    /**
     * Token not listed on any exchange
     */
    UNLISTED,

    /**
     * Token listed on exchange(s)
     */
    LISTED,

    /**
     * Token listing suspended
     */
    DELISTED
}
