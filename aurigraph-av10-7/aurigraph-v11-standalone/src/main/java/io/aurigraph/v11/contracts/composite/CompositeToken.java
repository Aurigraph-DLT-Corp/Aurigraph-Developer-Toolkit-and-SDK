package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * Composite Token - Bundle of Primary and Secondary Tokens
 *
 * The composite token represents the complete tokenized asset bundle consisting of:
 * - One Primary Token (the underlying asset)
 * - Multiple Secondary Tokens (supporting documents, media, verifications)
 * - Merkle root hash for cryptographic proof
 * - VVB verification status
 *
 * The composite token is what gets bound to an Active Contract.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-602-01
 */
public class CompositeToken {
    private String compositeId;
    private String assetId;
    private AssetType assetType;
    private String assetTypeString;     // For backward compatibility
    private PrimaryToken primaryToken;
    private List<SecondaryToken> secondaryTokens;
    private List<DerivedToken> derivedTokens;
    private String ownerAddress;
    private String representativeAddress;  // Authorized representative
    private Instant createdAt;
    private Instant lastUpdated;
    private CompositeTokenStatus status;
    private VerificationLevel verificationLevel;
    private Map<String, Object> metadata;

    // New fields for AV11-602-01
    private String merkleRootHash;         // Root hash of all token hashes
    private List<String> merkleProof;      // Merkle proof for verification
    private boolean vvbVerified;           // Overall VVB verification status
    private int vvbApprovals;              // Number of VVB approvals
    private int vvbRequired;               // Required VVB approvals (default 3)
    private List<VVBVerification> vvbVerifications;  // Individual VVB verifications
    private String activeContractId;       // Link to bound Active Contract
    private BigDecimal totalValuation;     // Total asset valuation
    private String registryId;             // Which Merkle registry this belongs to

    // Builder pattern
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

        public Builder primaryToken(PrimaryToken primaryToken) {
            token.primaryToken = primaryToken;
            return this;
        }

        public Builder secondaryTokens(List<SecondaryToken> secondaryTokens) {
            token.secondaryTokens = new ArrayList<>(secondaryTokens);
            return this;
        }

        public Builder derivedTokens(List<DerivedToken> derivedTokens) {
            token.derivedTokens = new ArrayList<>(derivedTokens);
            return this;
        }

        public Builder ownerAddress(String ownerAddress) {
            token.ownerAddress = ownerAddress;
            return this;
        }

        public Builder representativeAddress(String representativeAddress) {
            token.representativeAddress = representativeAddress;
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

        public Builder vvbRequired(int vvbRequired) {
            token.vvbRequired = vvbRequired;
            return this;
        }

        public Builder totalValuation(BigDecimal totalValuation) {
            token.totalValuation = totalValuation;
            return this;
        }

        public Builder registryId(String registryId) {
            token.registryId = registryId;
            return this;
        }

        public CompositeToken build() {
            token.metadata = new HashMap<>();
            token.secondaryTokens = token.secondaryTokens != null ? token.secondaryTokens : new ArrayList<>();
            token.derivedTokens = token.derivedTokens != null ? token.derivedTokens : new ArrayList<>();
            token.vvbVerifications = new ArrayList<>();
            token.merkleProof = new ArrayList<>();
            token.vvbApprovals = 0;
            if (token.vvbRequired == 0) {
                token.vvbRequired = token.assetType != null ? token.assetType.getDefaultVVBRequirement() : 3;
            }
            if (token.createdAt == null) {
                token.createdAt = Instant.now();
            }
            token.lastUpdated = Instant.now();
            if (token.compositeId == null) {
                token.compositeId = generateCompositeId(token.assetType, token.assetId);
            }
            if (token.registryId == null && token.assetType != null) {
                token.registryId = token.assetType.getRegistryName();
            }
            return token;
        }

        private String generateCompositeId(AssetType type, String assetId) {
            String prefix = type != null ? type.getPrefix() : "CT";
            String uuid = assetId != null ? assetId.substring(0, Math.min(8, assetId.length())) : UUID.randomUUID().toString().substring(0, 8);
            return "CT-" + prefix + "-" + uuid + "-" + System.currentTimeMillis() % 100000;
        }
    }

    // Getters and setters
    public String getCompositeId() { return compositeId; }
    public String getAssetId() { return assetId; }
    public AssetType getAssetType() { return assetType; }
    public String getAssetTypeString() { return assetTypeString; }
    public PrimaryToken getPrimaryToken() { return primaryToken; }
    public List<SecondaryToken> getSecondaryTokens() { return secondaryTokens; }
    public List<DerivedToken> getDerivedTokens() { return derivedTokens; }
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    public String getRepresentativeAddress() { return representativeAddress; }
    public void setRepresentativeAddress(String representativeAddress) { this.representativeAddress = representativeAddress; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastUpdated() { return lastUpdated; }
    public CompositeTokenStatus getStatus() { return status; }
    public void setStatus(CompositeTokenStatus status) { this.status = status; this.lastUpdated = Instant.now(); }
    public VerificationLevel getVerificationLevel() { return verificationLevel; }
    public void setVerificationLevel(VerificationLevel verificationLevel) { this.verificationLevel = verificationLevel; }
    public Map<String, Object> getMetadata() { return metadata; }

    // New getters for AV11-602
    public String getMerkleRootHash() { return merkleRootHash; }
    public List<String> getMerkleProof() { return merkleProof; }
    public boolean isVvbVerified() { return vvbVerified; }
    public int getVvbApprovals() { return vvbApprovals; }
    public int getVvbRequired() { return vvbRequired; }
    public List<VVBVerification> getVvbVerifications() { return vvbVerifications; }
    public String getActiveContractId() { return activeContractId; }
    public void setActiveContractId(String activeContractId) { this.activeContractId = activeContractId; }
    public BigDecimal getTotalValuation() { return totalValuation; }
    public void setTotalValuation(BigDecimal totalValuation) { this.totalValuation = totalValuation; }
    public String getRegistryId() { return registryId; }

    /**
     * Add a secondary token to this composite
     */
    public void addSecondaryToken(SecondaryToken token) {
        if (secondaryTokens == null) {
            secondaryTokens = new ArrayList<>();
        }
        secondaryTokens.add(token);
        lastUpdated = Instant.now();
        recalculateMerkleRoot();
    }

    /**
     * Add a derived token
     */
    public void addDerivedToken(DerivedToken token) {
        if (derivedTokens == null) {
            derivedTokens = new ArrayList<>();
        }
        derivedTokens.add(token);
        lastUpdated = Instant.now();
    }

    /**
     * Record a VVB verification
     */
    public void addVVBVerification(VVBVerification verification) {
        if (vvbVerifications == null) {
            vvbVerifications = new ArrayList<>();
        }
        vvbVerifications.add(verification);
        if (verification.isApproved()) {
            vvbApprovals++;
        }
        // Check if we have reached consensus
        if (vvbApprovals >= vvbRequired) {
            vvbVerified = true;
            status = CompositeTokenStatus.VERIFIED;
        }
        lastUpdated = Instant.now();
    }

    /**
     * Calculate Merkle root hash from all token hashes
     */
    public String recalculateMerkleRoot() {
        List<String> hashes = new ArrayList<>();

        // Add primary token hash
        if (primaryToken != null) {
            String primaryHash = primaryToken.getMerkleLeafHash();
            if (primaryHash == null) {
                primaryHash = primaryToken.calculateHash();
            }
            hashes.add(primaryHash);
        }

        // Add secondary token hashes
        if (secondaryTokens != null) {
            for (SecondaryToken st : secondaryTokens) {
                String hash = calculateTokenHash(st);
                hashes.add(hash);
            }
        }

        // Calculate Merkle root
        this.merkleRootHash = calculateMerkleRoot(hashes);
        this.lastUpdated = Instant.now();
        return this.merkleRootHash;
    }

    /**
     * Calculate hash for a secondary token
     */
    private String calculateTokenHash(SecondaryToken token) {
        StringBuilder sb = new StringBuilder();
        sb.append(token.getTokenId());
        sb.append(token.getCompositeId());
        sb.append(token.getTokenType().name());
        sb.append(token.getCreatedAt().toString());

        return sha256(sb.toString());
    }

    /**
     * Calculate Merkle root from list of hashes
     */
    private String calculateMerkleRoot(List<String> hashes) {
        if (hashes.isEmpty()) {
            return sha256("");
        }
        if (hashes.size() == 1) {
            return hashes.get(0);
        }

        List<String> newLevel = new ArrayList<>();
        for (int i = 0; i < hashes.size(); i += 2) {
            String left = hashes.get(i);
            String right = (i + 1 < hashes.size()) ? hashes.get(i + 1) : left;
            newLevel.add(sha256(left + right));
        }

        return calculateMerkleRoot(newLevel);
    }

    /**
     * Generate Merkle proof for a specific token
     */
    public List<String> generateMerkleProof(String tokenHash) {
        // Implementation for generating proof for specific token
        List<String> proof = new ArrayList<>();
        // This would be expanded with full Merkle proof generation
        return proof;
    }

    /**
     * Verify a Merkle proof
     */
    public boolean verifyMerkleProof(String tokenHash, List<String> proof) {
        String computedRoot = tokenHash;
        for (String sibling : proof) {
            computedRoot = sha256(computedRoot + sibling);
        }
        return computedRoot.equals(merkleRootHash);
    }

    /**
     * SHA256 hash utility
     */
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * VVB Verification Record
     */
    public static class VVBVerification {
        private String verifierId;
        private String verifierName;
        private boolean approved;
        private String comments;
        private Instant verifiedAt;
        private Map<String, Object> details;

        public VVBVerification(String verifierId, String verifierName, boolean approved) {
            this.verifierId = verifierId;
            this.verifierName = verifierName;
            this.approved = approved;
            this.verifiedAt = Instant.now();
            this.details = new HashMap<>();
        }

        public String getVerifierId() { return verifierId; }
        public String getVerifierName() { return verifierName; }
        public boolean isApproved() { return approved; }
        public String getComments() { return comments; }
        public void setComments(String comments) { this.comments = comments; }
        public Instant getVerifiedAt() { return verifiedAt; }
        public Map<String, Object> getDetails() { return details; }
    }
}