package io.aurigraph.v11.contracts.composite;

/**
 * Types of secondary tokens in composite packages
 *
 * Secondary tokens validate and enhance the primary token by providing
 * supporting documentation, verification, and value-add services.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-601-03
 */
public enum SecondaryTokenType {
    // Existing types
    OWNER("OWN", "Owner Token", "ERC-721 owner identity token"),
    COLLATERAL("COL", "Collateral Token", "ERC-1155 collateral position"),
    MEDIA("MED", "Media Token", "ERC-1155 photos/videos collection"),
    VERIFICATION("VER", "Verification Token", "ERC-721 VVB verification"),
    VALUATION("VAL", "Valuation Token", "ERC-20 valuation certificate"),
    COMPLIANCE("CMP", "Compliance Token", "ERC-721 compliance attestation"),

    // Document-based secondary tokens (per WBS AV11-601-03)
    TITLE_DEED("TTL", "Title Deed Token", "Property title document"),
    OWNER_KYC("KYC", "Owner KYC Token", "KYC verification document"),
    TAX_RECEIPT("TAX", "Tax Receipt Token", "Property/asset tax receipts"),
    PHOTO_GALLERY("PHO", "Photo Gallery Token", "Asset photo documentation"),
    VIDEO_TOUR("VID", "Video Tour Token", "Asset video documentation"),
    APPRAISAL("APR", "Appraisal Token", "Professional valuation appraisal"),
    INSURANCE("INS", "Insurance Token", "Insurance policy document"),
    SURVEY("SRV", "Survey Token", "Land/property survey document"),

    // Additional document types
    CERTIFICATE("CRT", "Certificate Token", "Official certificate document"),
    LICENSE("LIC", "License Token", "License or permit document"),
    AGREEMENT("AGR", "Agreement Token", "Legal agreement document"),
    INSPECTION("INP", "Inspection Token", "Inspection report document"),
    PERMIT("PRM", "Permit Token", "Building/regulatory permit"),
    WARRANTY("WRN", "Warranty Token", "Warranty document"),
    ENVIRONMENTAL("ENV", "Environmental Token", "Environmental assessment"),

    // Financial documents
    AUDIT("AUD", "Audit Token", "Financial audit document"),
    FINANCIAL_STATEMENT("FIN", "Financial Statement Token", "Financial statements"),
    PROOF_OF_FUNDS("POF", "Proof of Funds Token", "Proof of funds document");

    private final String prefix;
    private final String displayName;
    private final String description;

    SecondaryTokenType(String prefix, String displayName, String description) {
        this.prefix = prefix;
        this.displayName = displayName;
        this.description = description;
    }

    public String getPrefix() {
        return prefix;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if this token type is document-based (requires file attachment)
     */
    public boolean isDocumentBased() {
        return switch (this) {
            case TITLE_DEED, OWNER_KYC, TAX_RECEIPT, APPRAISAL, INSURANCE, SURVEY,
                 CERTIFICATE, LICENSE, AGREEMENT, INSPECTION, PERMIT, WARRANTY,
                 ENVIRONMENTAL, AUDIT, FINANCIAL_STATEMENT, PROOF_OF_FUNDS -> true;
            default -> false;
        };
    }

    /**
     * Check if this token type is media-based
     */
    public boolean isMediaBased() {
        return switch (this) {
            case MEDIA, PHOTO_GALLERY, VIDEO_TOUR -> true;
            default -> false;
        };
    }

    /**
     * Check if this token type requires VVB verification
     */
    public boolean requiresVVBVerification() {
        return switch (this) {
            case VERIFICATION, VALUATION, APPRAISAL, TITLE_DEED, OWNER_KYC -> true;
            default -> false;
        };
    }

    /**
     * Generate token ID for this type
     */
    public String generateTokenId(String compositeId) {
        return "ST-" + prefix + "-" + compositeId.substring(0, Math.min(8, compositeId.length())) +
               "-" + System.currentTimeMillis() % 100000;
    }

    /**
     * Find type by prefix
     */
    public static SecondaryTokenType fromPrefix(String prefix) {
        for (SecondaryTokenType type : values()) {
            if (type.prefix.equals(prefix)) {
                return type;
            }
        }
        return MEDIA; // Default
    }
}