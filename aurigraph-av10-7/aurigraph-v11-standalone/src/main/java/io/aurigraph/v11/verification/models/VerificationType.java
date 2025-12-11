package io.aurigraph.v11.verification.models;

/**
 * Types of external verification services supported.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public enum VerificationType {

    /**
     * KYC - Know Your Customer verification for user identity.
     */
    KYC("KYC Verification", "Identity verification for users", "kyc"),

    /**
     * Land Registry - Property ownership verification.
     */
    LAND_REGISTRY("Land Registry", "Property ownership and deed verification", "land"),

    /**
     * VVB - Validation and Verification Body for carbon credits.
     */
    VVB("VVB Verification", "Carbon credit validation by independent VVB", "vvb"),

    /**
     * SEC - Securities verification for financial assets.
     */
    SEC_FILING("SEC Filing", "Securities registration verification", "sec"),

    /**
     * IP Registry - Intellectual property verification.
     */
    IP_REGISTRY("IP Registry", "Patent and trademark verification", "ip"),

    /**
     * Manual - Human verification for demo/override purposes.
     */
    MANUAL("Manual Verification", "Human-verified by authorized verifier", "manual");

    private final String displayName;
    private final String description;
    private final String code;

    VerificationType(String displayName, String description, String code) {
        this.displayName = displayName;
        this.description = description;
        this.code = code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getCode() {
        return code;
    }

    public static VerificationType fromCode(String code) {
        for (VerificationType type : values()) {
            if (type.code.equalsIgnoreCase(code)) {
                return type;
            }
        }
        return null;
    }
}
