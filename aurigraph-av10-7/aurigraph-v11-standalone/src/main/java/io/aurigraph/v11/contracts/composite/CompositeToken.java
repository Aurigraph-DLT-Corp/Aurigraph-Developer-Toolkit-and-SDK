package io.aurigraph.v11.contracts.composite;

import java.time.Instant;
import java.util.List;

/**
 * Composite Token - Main container for complete asset tokenization package
 * Links primary asset token with all secondary tokens
 */
public class CompositeToken {
    private String compositeId;
    private String assetId;
    private String assetType;
    private PrimaryToken primaryToken;
    private List<SecondaryToken> secondaryTokens;
    private String ownerAddress;
    private Instant createdAt;
    private CompositeTokenStatus status;
    private VerificationLevel verificationLevel;

    // Private constructor - use builder pattern
    private CompositeToken() {}

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private CompositeToken token = new CompositeToken();

        public Builder compositeId(String compositeId) {
            token.compositeId = compositeId;
            return this;
        }

        public Builder assetId(String assetId) {
            token.assetId = assetId;
            return this;
        }

        public Builder assetType(String assetType) {
            token.assetType = assetType;
            return this;
        }

        public Builder primaryToken(PrimaryToken primaryToken) {
            token.primaryToken = primaryToken;
            return this;
        }

        public Builder secondaryTokens(List<SecondaryToken> secondaryTokens) {
            token.secondaryTokens = secondaryTokens;
            return this;
        }

        public Builder ownerAddress(String ownerAddress) {
            token.ownerAddress = ownerAddress;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            token.createdAt = createdAt;
            return this;
        }

        public Builder status(CompositeTokenStatus status) {
            token.status = status;
            return this;
        }

        public Builder verificationLevel(VerificationLevel verificationLevel) {
            token.verificationLevel = verificationLevel;
            return this;
        }

        public CompositeToken build() {
            return token;
        }
    }

    // Getters and setters
    public String getCompositeId() { return compositeId; }
    public String getAssetId() { return assetId; }
    public String getAssetType() { return assetType; }
    public PrimaryToken getPrimaryToken() { return primaryToken; }
    public List<SecondaryToken> getSecondaryTokens() { return secondaryTokens; }
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    public Instant getCreatedAt() { return createdAt; }
    public CompositeTokenStatus getStatus() { return status; }
    public void setStatus(CompositeTokenStatus status) { this.status = status; }
    public VerificationLevel getVerificationLevel() { return verificationLevel; }
    public void setVerificationLevel(VerificationLevel verificationLevel) { this.verificationLevel = verificationLevel; }
}

/**
 * Primary Token - ERC-721 unique asset token
 */
class PrimaryToken {
    private String tokenId;
    private String compositeId;
    private String assetId;
    private String assetType;
    private String ownerAddress;
    private String legalTitle;
    private String jurisdiction;
    private String coordinates;
    private boolean fractionalizable;
    private Instant createdAt;

    // Private constructor - use builder pattern
    private PrimaryToken() {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private PrimaryToken token = new PrimaryToken();

        public Builder tokenId(String tokenId) {
            token.tokenId = tokenId;
            return this;
        }

        public Builder compositeId(String compositeId) {
            token.compositeId = compositeId;
            return this;
        }

        public Builder assetId(String assetId) {
            token.assetId = assetId;
            return this;
        }

        public Builder assetType(String assetType) {
            token.assetType = assetType;
            return this;
        }

        public Builder ownerAddress(String ownerAddress) {
            token.ownerAddress = ownerAddress;
            return this;
        }

        public Builder legalTitle(String legalTitle) {
            token.legalTitle = legalTitle;
            return this;
        }

        public Builder jurisdiction(String jurisdiction) {
            token.jurisdiction = jurisdiction;
            return this;
        }

        public Builder coordinates(String coordinates) {
            token.coordinates = coordinates;
            return this;
        }

        public Builder fractionalizable(boolean fractionalizable) {
            token.fractionalizable = fractionalizable;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            token.createdAt = createdAt;
            return this;
        }

        public PrimaryToken build() {
            return token;
        }
    }

    // Getters and setters
    public String getTokenId() { return tokenId; }
    public String getCompositeId() { return compositeId; }
    public String getAssetId() { return assetId; }
    public String getAssetType() { return assetType; }
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    public String getLegalTitle() { return legalTitle; }
    public String getJurisdiction() { return jurisdiction; }
    public String getCoordinates() { return coordinates; }
    public boolean isFractionalizable() { return fractionalizable; }
    public Instant getCreatedAt() { return createdAt; }
}

/**
 * Composite token status enumeration
 */
enum CompositeTokenStatus {
    PENDING_VERIFICATION,  // Awaiting third-party verification
    VERIFIED,             // Successfully verified by consensus
    VERIFICATION_FAILED,  // Verification consensus failed
    ACTIVE,              // Active and tradeable
    SUSPENDED,           // Temporarily suspended
    LIQUIDATING,         // In liquidation process
    EXPIRED              // Expired or inactive
}