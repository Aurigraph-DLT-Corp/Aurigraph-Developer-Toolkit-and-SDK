package io.aurigraph.v11.contracts.composite.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.aurigraph.v11.contracts.composite.*;
import io.aurigraph.v11.storage.LevelDBService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Secondary Token Repository - LevelDB Implementation
 *
 * Provides per-node embedded storage for SecondaryToken entities using LevelDB.
 * Supports polymorphic storage of all secondary token types (Owner, Verification,
 * Valuation, Collateral, Media, Compliance).
 *
 * Key structure: secondary-token:{compositeId}:{tokenType}
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: LevelDB Persistence)
 * @author Aurigraph V12 Development Team
 */
@ApplicationScoped
public class SecondaryTokenRepositoryLevelDB {

    private static final String KEY_PREFIX = "secondary-token:";

    @Inject
    LevelDBService levelDB;

    @Inject
    ObjectMapper objectMapper;

    // ==================== PERSIST OPERATIONS ====================

    /**
     * Persist a secondary token
     */
    public Uni<SecondaryToken> persist(SecondaryToken token) {
        // Prepare serialization synchronously
        return Uni.createFrom().item(() -> {
            try {
                String key = buildKey(token.getCompositeId(), token.getTokenType());
                SecondaryTokenWrapper wrapper = new SecondaryTokenWrapper(token);
                String value = objectMapper.writeValueAsString(wrapper);
                return Map.entry(key, value);
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize secondary token: " + e.getMessage(), e);
            }
        }).flatMap(entry ->
            // Chain the LevelDB write as a proper Uni operation
            levelDB.put(entry.getKey(), entry.getValue())
                .replaceWith(token)
                .onFailure().transform(e ->
                    new RuntimeException("Failed to persist secondary token to LevelDB: " + e.getMessage(), e))
        );
    }

    /**
     * Persist all secondary tokens for a composite token
     */
    public Uni<List<SecondaryToken>> persistAll(String compositeId, List<SecondaryToken> tokens) {
        // Prepare data synchronously first
        return Uni.createFrom().item(() -> {
            try {
                Map<String, String> puts = new HashMap<>();
                for (SecondaryToken token : tokens) {
                    String key = buildKey(compositeId, token.getTokenType());
                    SecondaryTokenWrapper wrapper = new SecondaryTokenWrapper(token);
                    puts.put(key, objectMapper.writeValueAsString(wrapper));
                }
                return puts;
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize secondary tokens: " + e.getMessage(), e);
            }
        }).flatMap(puts ->
            // Chain the LevelDB write as a proper Uni operation
            levelDB.batchWrite(puts, null)
                .replaceWith(tokens)
                .onFailure().transform(e ->
                    new RuntimeException("Failed to persist secondary tokens to LevelDB: " + e.getMessage(), e))
        );
    }

    // ==================== FIND OPERATIONS ====================

    /**
     * Find a specific secondary token by composite ID and type
     */
    public Uni<Optional<SecondaryToken>> findByCompositeIdAndType(String compositeId,
                                                                   SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() -> {
            try {
                String key = buildKey(compositeId, tokenType);
                String value = levelDB.get(key).await().indefinitely();
                if (value == null) {
                    return Optional.empty();
                }
                SecondaryTokenWrapper wrapper = objectMapper.readValue(value, SecondaryTokenWrapper.class);
                return Optional.of(wrapper.unwrap());
            } catch (Exception e) {
                throw new RuntimeException("Failed to find secondary token", e);
            }
        });
    }

    /**
     * Find all secondary tokens for a composite token
     */
    public Uni<List<SecondaryToken>> findByCompositeId(String compositeId) {
        return Uni.createFrom().item(() -> {
            try {
                String prefix = KEY_PREFIX + compositeId + ":";
                Map<String, String> entries = levelDB.scanByPrefix(prefix).await().indefinitely();

                List<SecondaryToken> tokens = new ArrayList<>();
                for (String value : entries.values()) {
                    SecondaryTokenWrapper wrapper = objectMapper.readValue(value, SecondaryTokenWrapper.class);
                    tokens.add(wrapper.unwrap());
                }
                return tokens;
            } catch (Exception e) {
                throw new RuntimeException("Failed to find secondary tokens by composite ID", e);
            }
        });
    }

    /**
     * Find all secondary tokens of a specific type
     */
    public Uni<List<SecondaryToken>> findByType(SecondaryTokenType tokenType) {
        return listAll().map(tokens -> tokens.stream()
                .filter(t -> t.getTokenType() == tokenType)
                .collect(Collectors.toList()));
    }

    /**
     * List all secondary tokens
     */
    public Uni<List<SecondaryToken>> listAll() {
        return Uni.createFrom().item(() -> {
            try {
                Map<String, String> entries = levelDB.scanByPrefix(KEY_PREFIX).await().indefinitely();

                List<SecondaryToken> tokens = new ArrayList<>();
                for (String value : entries.values()) {
                    SecondaryTokenWrapper wrapper = objectMapper.readValue(value, SecondaryTokenWrapper.class);
                    tokens.add(wrapper.unwrap());
                }
                return tokens;
            } catch (Exception e) {
                throw new RuntimeException("Failed to list all secondary tokens", e);
            }
        });
    }

    // ==================== TYPED FIND OPERATIONS ====================

    /**
     * Find OwnerToken for a composite token
     */
    public Uni<Optional<OwnerToken>> findOwnerToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.OWNER)
                .map(opt -> opt.map(t -> (OwnerToken) t));
    }

    /**
     * Find VerificationToken for a composite token
     */
    public Uni<Optional<VerificationToken>> findVerificationToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.VERIFICATION)
                .map(opt -> opt.map(t -> (VerificationToken) t));
    }

    /**
     * Find ValuationToken for a composite token
     */
    public Uni<Optional<ValuationToken>> findValuationToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.VALUATION)
                .map(opt -> opt.map(t -> (ValuationToken) t));
    }

    /**
     * Find CollateralToken for a composite token
     */
    public Uni<Optional<CollateralToken>> findCollateralToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.COLLATERAL)
                .map(opt -> opt.map(t -> (CollateralToken) t));
    }

    /**
     * Find MediaToken for a composite token
     */
    public Uni<Optional<MediaToken>> findMediaToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.MEDIA)
                .map(opt -> opt.map(t -> (MediaToken) t));
    }

    /**
     * Find ComplianceToken for a composite token
     */
    public Uni<Optional<ComplianceToken>> findComplianceToken(String compositeId) {
        return findByCompositeIdAndType(compositeId, SecondaryTokenType.COMPLIANCE)
                .map(opt -> opt.map(t -> (ComplianceToken) t));
    }

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete a specific secondary token
     */
    public Uni<Void> delete(String compositeId, SecondaryTokenType tokenType) {
        return Uni.createFrom().item(() -> {
            try {
                String key = buildKey(compositeId, tokenType);
                levelDB.delete(key).await().indefinitely();
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete secondary token", e);
            }
        });
    }

    /**
     * Delete all secondary tokens for a composite token
     */
    public Uni<Void> deleteByCompositeId(String compositeId) {
        return Uni.createFrom().item(() -> {
            try {
                String prefix = KEY_PREFIX + compositeId + ":";
                List<String> keys = levelDB.getKeysByPrefix(prefix).await().indefinitely();
                levelDB.batchWrite(null, keys).await().indefinitely();
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete secondary tokens", e);
            }
        });
    }

    // ==================== COUNT OPERATIONS ====================

    /**
     * Count secondary tokens by type
     */
    public Uni<Long> countByType(SecondaryTokenType tokenType) {
        return findByType(tokenType).map(list -> (long) list.size());
    }

    /**
     * Count secondary tokens for a composite token
     */
    public Uni<Long> countByCompositeId(String compositeId) {
        return findByCompositeId(compositeId).map(list -> (long) list.size());
    }

    // ==================== HELPER METHODS ====================

    private String buildKey(String compositeId, SecondaryTokenType tokenType) {
        return KEY_PREFIX + compositeId + ":" + tokenType.name();
    }

    // ==================== WRAPPER FOR POLYMORPHIC SERIALIZATION ====================

    /**
     * Wrapper class to handle polymorphic serialization of SecondaryToken subtypes
     */
    public static class SecondaryTokenWrapper {
        private SecondaryTokenType type;
        private String tokenId;
        private String compositeId;
        private Instant createdAt;
        private Instant lastUpdated;
        private Map<String, Object> data;

        // Type-specific fields stored as JSON
        private Map<String, Object> typeData;

        public SecondaryTokenWrapper() {}

        public SecondaryTokenWrapper(SecondaryToken token) {
            this.type = token.getTokenType();
            this.tokenId = token.getTokenId();
            this.compositeId = token.getCompositeId();
            this.createdAt = token.getCreatedAt();
            this.lastUpdated = token.getLastUpdated();
            this.data = token.getData();
            this.typeData = extractTypeData(token);
        }

        public SecondaryToken unwrap() {
            return switch (type) {
                case OWNER -> unwrapOwnerToken();
                case VERIFICATION -> unwrapVerificationToken();
                case VALUATION -> unwrapValuationToken();
                case COLLATERAL -> unwrapCollateralToken();
                case MEDIA, PHOTO_GALLERY, VIDEO_TOUR -> unwrapMediaToken();
                case COMPLIANCE -> unwrapComplianceToken();
                // Document-based secondary tokens
                case TITLE_DEED, OWNER_KYC, TAX_RECEIPT, APPRAISAL, INSURANCE, SURVEY,
                     CERTIFICATE, LICENSE, AGREEMENT, INSPECTION, PERMIT, WARRANTY,
                     ENVIRONMENTAL, AUDIT, FINANCIAL_STATEMENT, PROOF_OF_FUNDS -> unwrapDocumentToken();
            };
        }

        private Map<String, Object> extractTypeData(SecondaryToken token) {
            Map<String, Object> typeData = new HashMap<>();

            switch (token.getTokenType()) {
                case OWNER -> {
                    OwnerToken ot = (OwnerToken) token;
                    typeData.put("ownerAddress", ot.getOwnerAddress());
                    typeData.put("ownershipPercentage", ot.getOwnershipPercentage());
                    typeData.put("transferHistory", ot.getTransferHistory());
                }
                case VERIFICATION -> {
                    VerificationToken vt = (VerificationToken) token;
                    typeData.put("requiredLevel", vt.getRequiredLevel().name());
                    typeData.put("verificationResults", vt.getVerificationResults());
                }
                case VALUATION -> {
                    ValuationToken vt = (ValuationToken) token;
                    typeData.put("currentValue", vt.getCurrentValue());
                    typeData.put("priceHistory", vt.getPriceHistory());
                }
                case COLLATERAL -> {
                    CollateralToken ct = (CollateralToken) token;
                    typeData.put("collateralAssets", ct.getCollateralAssets());
                }
                case MEDIA, PHOTO_GALLERY, VIDEO_TOUR -> {
                    MediaToken mt = (MediaToken) token;
                    typeData.put("mediaAssets", mt.getMediaAssets());
                }
                case COMPLIANCE -> {
                    ComplianceToken ct = (ComplianceToken) token;
                    typeData.put("complianceStatus", ct.getComplianceStatus().name());
                    typeData.put("complianceData", ct.getComplianceData());
                }
                // Document-based secondary tokens
                case TITLE_DEED, OWNER_KYC, TAX_RECEIPT, APPRAISAL, INSURANCE, SURVEY,
                     CERTIFICATE, LICENSE, AGREEMENT, INSPECTION, PERMIT, WARRANTY,
                     ENVIRONMENTAL, AUDIT, FINANCIAL_STATEMENT, PROOF_OF_FUNDS -> {
                    DocumentToken dt = (DocumentToken) token;
                    typeData.put("documentId", dt.getDocumentId());
                    typeData.put("documentName", dt.getDocumentName());
                    typeData.put("documentType", dt.getDocumentType());
                    typeData.put("sha256Hash", dt.getSha256Hash());
                    typeData.put("fileAttachmentId", dt.getFileAttachmentId());
                    typeData.put("storageUrl", dt.getStorageUrl());
                    typeData.put("fileSize", dt.getFileSize());
                    typeData.put("issuer", dt.getIssuer());
                    typeData.put("issuedDate", dt.getIssuedDate());
                    typeData.put("expiryDate", dt.getExpiryDate());
                    typeData.put("verified", dt.isVerified());
                    typeData.put("verifierId", dt.getVerifierId());
                    typeData.put("jurisdiction", dt.getJurisdiction());
                    typeData.put("extractedData", dt.getExtractedData());
                }
            }

            return typeData;
        }

        @SuppressWarnings("unchecked")
        private OwnerToken unwrapOwnerToken() {
            return new OwnerToken(
                tokenId,
                compositeId,
                (String) typeData.get("ownerAddress"),
                new java.math.BigDecimal(typeData.get("ownershipPercentage").toString()),
                (List<OwnerToken.OwnershipTransfer>) typeData.getOrDefault("transferHistory", new ArrayList<>())
            );
        }

        @SuppressWarnings("unchecked")
        private VerificationToken unwrapVerificationToken() {
            VerificationLevel level = VerificationLevel.valueOf((String) typeData.get("requiredLevel"));
            return new VerificationToken(
                tokenId,
                compositeId,
                level,
                (List<VerificationResult>) typeData.getOrDefault("verificationResults", new ArrayList<>())
            );
        }

        @SuppressWarnings("unchecked")
        private ValuationToken unwrapValuationToken() {
            return new ValuationToken(
                tokenId,
                compositeId,
                new java.math.BigDecimal(typeData.get("currentValue").toString()),
                (List<ValuationToken.PricePoint>) typeData.getOrDefault("priceHistory", new ArrayList<>())
            );
        }

        @SuppressWarnings("unchecked")
        private CollateralToken unwrapCollateralToken() {
            return new CollateralToken(
                tokenId,
                compositeId,
                (List<CollateralToken.CollateralAsset>) typeData.getOrDefault("collateralAssets", new ArrayList<>())
            );
        }

        @SuppressWarnings("unchecked")
        private MediaToken unwrapMediaToken() {
            return new MediaToken(
                tokenId,
                compositeId,
                (List<MediaToken.MediaAsset>) typeData.getOrDefault("mediaAssets", new ArrayList<>())
            );
        }

        @SuppressWarnings("unchecked")
        private ComplianceToken unwrapComplianceToken() {
            ComplianceStatus status = ComplianceStatus.valueOf((String) typeData.get("complianceStatus"));
            return new ComplianceToken(
                tokenId,
                compositeId,
                status,
                (Map<String, Object>) typeData.getOrDefault("complianceData", new HashMap<>())
            );
        }

        @SuppressWarnings("unchecked")
        private DocumentToken unwrapDocumentToken() {
            DocumentToken token = new DocumentToken(
                tokenId,
                compositeId,
                type,
                (String) typeData.get("documentId"),
                (String) typeData.get("documentName"),
                (String) typeData.get("sha256Hash")
            );
            token.setDocumentType((String) typeData.get("documentType"));
            token.setFileAttachmentId((String) typeData.get("fileAttachmentId"));
            token.setStorageUrl((String) typeData.get("storageUrl"));
            if (typeData.get("fileSize") != null) {
                token.setFileSize(((Number) typeData.get("fileSize")).longValue());
            }
            token.setIssuer((String) typeData.get("issuer"));
            if (typeData.get("issuedDate") != null) {
                token.setIssuedDate((Instant) typeData.get("issuedDate"));
            }
            if (typeData.get("expiryDate") != null) {
                token.setExpiryDate((Instant) typeData.get("expiryDate"));
            }
            if (typeData.get("verified") != null) {
                token.setVerified((Boolean) typeData.get("verified"));
            }
            token.setVerifierId((String) typeData.get("verifierId"));
            token.setJurisdiction((String) typeData.get("jurisdiction"));
            return token;
        }

        // Getters and setters for Jackson
        public SecondaryTokenType getType() { return type; }
        public void setType(SecondaryTokenType type) { this.type = type; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public String getCompositeId() { return compositeId; }
        public void setCompositeId(String compositeId) { this.compositeId = compositeId; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
        public Map<String, Object> getTypeData() { return typeData; }
        public void setTypeData(Map<String, Object> typeData) { this.typeData = typeData; }
    }
}
