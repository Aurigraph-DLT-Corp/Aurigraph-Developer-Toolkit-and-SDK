package io.aurigraph.v11.hms.models;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Base class for all healthcare assets
 */
public abstract class HealthcareAsset {
    private String assetId;
    private AssetType assetType;
    private Instant createdAt;
    private Instant updatedAt;
    private String owner;
    private Map<String, String> metadata;
    private boolean encrypted;
    private String encryptionKeyId;
    private ComplianceInfo complianceInfo;

    protected HealthcareAsset(AssetType assetType) {
        this.assetId = UUID.randomUUID().toString();
        this.assetType = assetType;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.metadata = new HashMap<>();
        this.encrypted = false;
        this.complianceInfo = new ComplianceInfo();
    }

    protected HealthcareAsset(String assetId, AssetType assetType) {
        this.assetId = assetId;
        this.assetType = assetType;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.metadata = new HashMap<>();
        this.encrypted = false;
        this.complianceInfo = new ComplianceInfo();
    }

    // Getters and Setters
    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public AssetType getAssetType() {
        return assetType;
    }

    public void setAssetType(AssetType assetType) {
        this.assetType = assetType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public void addMetadata(String key, String value) {
        this.metadata.put(key, value);
    }

    public boolean isEncrypted() {
        return encrypted;
    }

    public void setEncrypted(boolean encrypted) {
        this.encrypted = encrypted;
    }

    public String getEncryptionKeyId() {
        return encryptionKeyId;
    }

    public void setEncryptionKeyId(String encryptionKeyId) {
        this.encryptionKeyId = encryptionKeyId;
    }

    public ComplianceInfo getComplianceInfo() {
        return complianceInfo;
    }

    public void setComplianceInfo(ComplianceInfo complianceInfo) {
        this.complianceInfo = complianceInfo;
    }

    public void updateTimestamp() {
        this.updatedAt = Instant.now();
    }
}
