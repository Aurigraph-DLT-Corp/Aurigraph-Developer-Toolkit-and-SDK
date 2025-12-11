package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Primary Token - Represents the underlying real-world asset (ERC-721)
 *
 * The primary token is the foundational token in the composite token architecture.
 * It represents the actual asset (property, vehicle, commodity, etc.) and links
 * to its digital twin and VVB verification status.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-601-01
 */
public class PrimaryToken {
    private String tokenId;
    private String compositeId;
    private String assetId;
    private AssetType assetType;
    private String assetTypeString; // For backward compatibility
    private String ownerAddress;
    private String legalTitle;
    private String jurisdiction;
    private String coordinates;
    private boolean fractionalizable;
    private Instant createdAt;
    private Map<String, Object> metadata;

    // New fields per AV11-601-01
    private String digitalTwinReference;  // Reference to digital twin (IPFS/URL)
    private BigDecimal valuation;          // Current asset valuation
    private boolean vvbVerified;           // VVB verification status
    private String vvbVerifierId;          // ID of verifying VVB
    private Instant vvbVerifiedAt;         // When VVB verification completed
    private String merkleLeafHash;         // SHA256 hash for Merkle tree inclusion

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

        public Builder assetType(AssetType assetType) {
            token.assetType = assetType;
            token.assetTypeString = assetType != null ? assetType.name() : null;
            return this;
        }

        public Builder assetType(String assetType) {
            token.assetTypeString = assetType;
            try {
                token.assetType = AssetType.valueOf(assetType);
            } catch (Exception e) {
                token.assetType = AssetType.OTHER;
            }
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

        public Builder digitalTwinReference(String digitalTwinReference) {
            token.digitalTwinReference = digitalTwinReference;
            return this;
        }

        public Builder valuation(BigDecimal valuation) {
            token.valuation = valuation;
            return this;
        }

        public Builder vvbVerified(boolean vvbVerified) {
            token.vvbVerified = vvbVerified;
            return this;
        }

        public Builder vvbVerifierId(String vvbVerifierId) {
            token.vvbVerifierId = vvbVerifierId;
            return this;
        }

        public Builder vvbVerifiedAt(Instant vvbVerifiedAt) {
            token.vvbVerifiedAt = vvbVerifiedAt;
            return this;
        }

        public Builder merkleLeafHash(String merkleLeafHash) {
            token.merkleLeafHash = merkleLeafHash;
            return this;
        }

        public PrimaryToken build() {
            token.metadata = new HashMap<>();
            if (token.createdAt == null) {
                token.createdAt = Instant.now();
            }
            if (token.tokenId == null) {
                token.tokenId = generateTokenId(token.assetType, token.assetId);
            }
            return token;
        }

        private String generateTokenId(AssetType type, String assetId) {
            String prefix = type != null ? type.getPrefix() : "PT";
            String uuid = assetId != null ? assetId.substring(0, Math.min(8, assetId.length())) : UUID.randomUUID().toString().substring(0, 8);
            return prefix + "-" + uuid + "-" + System.currentTimeMillis() % 100000;
        }
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public String getCompositeId() { return compositeId; }
    public String getAssetId() { return assetId; }
    public AssetType getAssetType() { return assetType; }
    public String getAssetTypeString() { return assetTypeString; }
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    public String getLegalTitle() { return legalTitle; }
    public String getJurisdiction() { return jurisdiction; }
    public String getCoordinates() { return coordinates; }
    public boolean isFractionalizable() { return fractionalizable; }
    public Instant getCreatedAt() { return createdAt; }
    public Map<String, Object> getMetadata() { return metadata; }

    // New getters for AV11-601-01
    public String getDigitalTwinReference() { return digitalTwinReference; }
    public void setDigitalTwinReference(String digitalTwinReference) { this.digitalTwinReference = digitalTwinReference; }
    public BigDecimal getValuation() { return valuation; }
    public void setValuation(BigDecimal valuation) { this.valuation = valuation; }
    public boolean isVvbVerified() { return vvbVerified; }
    public void setVvbVerified(boolean vvbVerified) { this.vvbVerified = vvbVerified; }
    public String getVvbVerifierId() { return vvbVerifierId; }
    public void setVvbVerifierId(String vvbVerifierId) { this.vvbVerifierId = vvbVerifierId; }
    public Instant getVvbVerifiedAt() { return vvbVerifiedAt; }
    public void setVvbVerifiedAt(Instant vvbVerifiedAt) { this.vvbVerifiedAt = vvbVerifiedAt; }
    public String getMerkleLeafHash() { return merkleLeafHash; }
    public void setMerkleLeafHash(String merkleLeafHash) { this.merkleLeafHash = merkleLeafHash; }

    /**
     * Calculate the hash for Merkle tree inclusion
     */
    public String calculateHash() {
        StringBuilder sb = new StringBuilder();
        sb.append(tokenId != null ? tokenId : "");
        sb.append(assetId != null ? assetId : "");
        sb.append(assetType != null ? assetType.name() : "");
        sb.append(ownerAddress != null ? ownerAddress : "");
        sb.append(digitalTwinReference != null ? digitalTwinReference : "");
        sb.append(valuation != null ? valuation.toString() : "");
        sb.append(createdAt != null ? createdAt.toString() : "");

        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            this.merkleLeafHash = hexString.toString();
            return this.merkleLeafHash;
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}