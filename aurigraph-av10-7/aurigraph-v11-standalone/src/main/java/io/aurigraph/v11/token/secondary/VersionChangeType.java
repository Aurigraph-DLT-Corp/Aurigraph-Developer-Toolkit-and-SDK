package io.aurigraph.v11.token.secondary;

/**
 * VersionChangeType Enumeration
 *
 * Categorizes the type of change that triggered a new version creation
 * for SecondaryTokenVersion entities.
 *
 * Each change type has specific business rules and may require different
 * levels of approval (e.g., VVB verification, compliance checks).
 *
 * @author AV11-601 Secondary Token Versioning
 * @version 1.0
 * @since Sprint 1 (AV11-601)
 */
public enum VersionChangeType {

    /**
     * Ownership transfer
     * Triggered when token ownership changes hands
     * Requires: Identity verification, compliance checks
     * VVB Required: Typically yes for high-value assets
     */
    OWNERSHIP_CHANGE(
        "Ownership Change",
        "Token ownership has been transferred to a new holder",
        true
    ),

    /**
     * Metadata update
     * Triggered when token metadata is modified (description, attributes, etc.)
     * Requires: Standard validation
     * VVB Required: Only for material changes
     */
    METADATA_UPDATE(
        "Metadata Update",
        "Token metadata has been updated",
        false
    ),

    /**
     * Document addition
     * Triggered when new supporting documents are attached
     * Requires: Document validation, format checks
     * VVB Required: For legal or valuation documents
     */
    DOCUMENT_ADDITION(
        "Document Addition",
        "New supporting document has been added to the token",
        false
    ),

    /**
     * Damage report
     * Triggered when physical asset damage is reported
     * Requires: Inspection report, valuation impact
     * VVB Required: Yes, requires third-party verification
     */
    DAMAGE_REPORT(
        "Damage Report",
        "Physical asset damage has been reported and documented",
        true
    ),

    /**
     * Valuation update
     * Triggered when asset valuation changes
     * Requires: Appraisal documentation
     * VVB Required: Yes, requires professional valuation
     */
    VALUATION_UPDATE(
        "Valuation Update",
        "Asset valuation has been updated",
        true
    ),

    /**
     * Compliance update
     * Triggered when compliance status or requirements change
     * Requires: Regulatory documentation
     * VVB Required: Yes, requires compliance verification
     */
    COMPLIANCE_UPDATE(
        "Compliance Update",
        "Compliance status or requirements have been updated",
        true
    ),

    /**
     * Status change
     * Triggered when token status changes (active, suspended, etc.)
     * Requires: Business logic validation
     * VVB Required: For terminal state changes only
     */
    STATUS_CHANGE(
        "Status Change",
        "Token status has been changed",
        false
    ),

    /**
     * Revenue distribution
     * Triggered when revenue/income distribution occurs
     * Requires: Financial transaction records
     * VVB Required: For distributions above threshold
     */
    REVENUE_DISTRIBUTION(
        "Revenue Distribution",
        "Revenue distribution event has occurred",
        false
    ),

    /**
     * Collateral update
     * Triggered when collateral status or value changes
     * Requires: Collateral assessment
     * VVB Required: Yes, affects loan security
     */
    COLLATERAL_UPDATE(
        "Collateral Update",
        "Collateral status or value has been updated",
        true
    ),

    /**
     * Maintenance record
     * Triggered when asset maintenance is performed
     * Requires: Maintenance documentation
     * VVB Required: For major maintenance only
     */
    MAINTENANCE_RECORD(
        "Maintenance Record",
        "Asset maintenance has been recorded",
        false
    );

    private final String displayName;
    private final String description;
    private final boolean typicallyRequiresVVB;

    /**
     * Constructor
     *
     * @param displayName Human-readable name
     * @param description Detailed description
     * @param typicallyRequiresVVB Whether this change typically requires VVB approval
     */
    VersionChangeType(String displayName, String description, boolean typicallyRequiresVVB) {
        this.displayName = displayName;
        this.description = description;
        this.typicallyRequiresVVB = typicallyRequiresVVB;
    }

    /**
     * Get display name
     *
     * @return Human-readable name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get description
     *
     * @return Detailed description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Check if this change type typically requires VVB approval
     *
     * @return true if VVB approval typically required
     */
    public boolean typicallyRequiresVVB() {
        return typicallyRequiresVVB;
    }

    /**
     * Get change type by display name
     *
     * @param displayName Display name to search for
     * @return Matching VersionChangeType or null
     */
    public static VersionChangeType fromDisplayName(String displayName) {
        for (VersionChangeType type : values()) {
            if (type.displayName.equalsIgnoreCase(displayName)) {
                return type;
            }
        }
        return null;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
