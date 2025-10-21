package io.aurigraph.v11.hms.models;

/**
 * Healthcare asset types supported by HMS
 */
public enum AssetType {
    MEDICAL_RECORD("Medical Record"),
    PRESCRIPTION("Prescription"),
    DIAGNOSTIC_REPORT("Diagnostic Report"),
    LAB_RESULT("Lab Result"),
    IMAGING_SCAN("Imaging Scan"),
    INSURANCE_CLAIM("Insurance Claim"),
    TREATMENT_PLAN("Treatment Plan");

    private final String displayName;

    AssetType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
