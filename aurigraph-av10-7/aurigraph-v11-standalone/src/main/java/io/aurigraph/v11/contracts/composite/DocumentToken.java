package io.aurigraph.v11.contracts.composite;

import java.time.Instant;
import java.util.*;

/**
 * Document Token - Secondary token for document-based artifacts
 *
 * Represents documents that validate the primary token such as:
 * - Title Deeds
 * - KYC Documents
 * - Tax Receipts
 * - Appraisals
 * - Insurance Policies
 * - Surveys
 *
 * Each document is hashed (SHA256) and linked to the file attachment system.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-601-03
 */
public class DocumentToken extends SecondaryToken {

    private String documentId;          // Unique document identifier
    private String documentName;        // Original document name
    private String documentType;        // MIME type
    private String sha256Hash;          // SHA256 hash of document content
    private String fileAttachmentId;    // Link to FileAttachment entity
    private String storageUrl;          // Storage URL (IPFS/S3/local)
    private long fileSize;              // File size in bytes
    private String issuer;              // Document issuing authority
    private Instant issuedDate;         // When document was issued
    private Instant expiryDate;         // Document expiry date (if applicable)
    private boolean verified;           // VVB verification status
    private String verifierId;          // VVB that verified this document
    private Instant verifiedAt;         // When verification completed
    private String jurisdiction;        // Legal jurisdiction
    private Map<String, String> extractedData; // AI-extracted data fields

    /**
     * Create a new DocumentToken
     */
    public DocumentToken(String tokenId, String compositeId, SecondaryTokenType tokenType,
                        String documentId, String documentName, String sha256Hash) {
        super(tokenId, compositeId, tokenType);
        this.documentId = documentId;
        this.documentName = documentName;
        this.sha256Hash = sha256Hash;
        this.extractedData = new HashMap<>();
        this.verified = false;
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        this.lastUpdated = Instant.now();
        this.data.putAll(updateData);

        // Handle specific fields
        if (updateData.containsKey("verified")) {
            this.verified = (Boolean) updateData.get("verified");
        }
        if (updateData.containsKey("verifierId")) {
            this.verifierId = (String) updateData.get("verifierId");
            this.verifiedAt = Instant.now();
        }
    }

    /**
     * Mark document as verified by VVB
     */
    public void markVerified(String verifierId) {
        this.verified = true;
        this.verifierId = verifierId;
        this.verifiedAt = Instant.now();
        this.lastUpdated = Instant.now();
    }

    /**
     * Add extracted data field
     */
    public void addExtractedField(String key, String value) {
        this.extractedData.put(key, value);
        this.lastUpdated = Instant.now();
    }

    /**
     * Calculate the hash for Merkle tree inclusion
     */
    public String calculateMerkleHash() {
        StringBuilder sb = new StringBuilder();
        sb.append(tokenId);
        sb.append(documentId);
        sb.append(sha256Hash);
        sb.append(tokenType.name());
        sb.append(createdAt.toString());

        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // Getters and Setters
    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }
    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }
    public String getFileAttachmentId() { return fileAttachmentId; }
    public void setFileAttachmentId(String fileAttachmentId) { this.fileAttachmentId = fileAttachmentId; }
    public String getStorageUrl() { return storageUrl; }
    public void setStorageUrl(String storageUrl) { this.storageUrl = storageUrl; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
    public Instant getIssuedDate() { return issuedDate; }
    public void setIssuedDate(Instant issuedDate) { this.issuedDate = issuedDate; }
    public Instant getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Instant expiryDate) { this.expiryDate = expiryDate; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public String getVerifierId() { return verifierId; }
    public void setVerifierId(String verifierId) { this.verifierId = verifierId; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
    public Map<String, String> getExtractedData() { return extractedData; }

    /**
     * Builder for DocumentToken
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String tokenId;
        private String compositeId;
        private SecondaryTokenType tokenType;
        private String documentId;
        private String documentName;
        private String sha256Hash;
        private String documentType;
        private String fileAttachmentId;
        private String storageUrl;
        private long fileSize;
        private String issuer;
        private Instant issuedDate;
        private Instant expiryDate;
        private String jurisdiction;

        public Builder tokenId(String tokenId) { this.tokenId = tokenId; return this; }
        public Builder compositeId(String compositeId) { this.compositeId = compositeId; return this; }
        public Builder tokenType(SecondaryTokenType tokenType) { this.tokenType = tokenType; return this; }
        public Builder documentId(String documentId) { this.documentId = documentId; return this; }
        public Builder documentName(String documentName) { this.documentName = documentName; return this; }
        public Builder sha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; return this; }
        public Builder documentType(String documentType) { this.documentType = documentType; return this; }
        public Builder fileAttachmentId(String fileAttachmentId) { this.fileAttachmentId = fileAttachmentId; return this; }
        public Builder storageUrl(String storageUrl) { this.storageUrl = storageUrl; return this; }
        public Builder fileSize(long fileSize) { this.fileSize = fileSize; return this; }
        public Builder issuer(String issuer) { this.issuer = issuer; return this; }
        public Builder issuedDate(Instant issuedDate) { this.issuedDate = issuedDate; return this; }
        public Builder expiryDate(Instant expiryDate) { this.expiryDate = expiryDate; return this; }
        public Builder jurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; return this; }

        public DocumentToken build() {
            if (tokenId == null) {
                tokenId = tokenType.generateTokenId(compositeId != null ? compositeId : UUID.randomUUID().toString());
            }
            if (documentId == null) {
                documentId = UUID.randomUUID().toString();
            }

            DocumentToken token = new DocumentToken(tokenId, compositeId, tokenType, documentId, documentName, sha256Hash);
            token.setDocumentType(documentType);
            token.setFileAttachmentId(fileAttachmentId);
            token.setStorageUrl(storageUrl);
            token.setFileSize(fileSize);
            token.setIssuer(issuer);
            token.setIssuedDate(issuedDate);
            token.setExpiryDate(expiryDate);
            token.setJurisdiction(jurisdiction);
            return token;
        }
    }
}
