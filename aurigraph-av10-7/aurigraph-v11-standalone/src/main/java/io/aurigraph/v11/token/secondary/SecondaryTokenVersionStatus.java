package io.aurigraph.v11.token.secondary;

/**
 * Secondary Token Version Status Enumeration
 *
 * Defines the lifecycle states for SecondaryTokenVersion entities.
 * Each status represents a stage in the version approval and activation workflow.
 *
 * State Flow:
 * <pre>
 * CREATED → PENDING_VVB → APPROVED → ACTIVE → REPLACED → ARCHIVED
 *                ↓                              ↓
 *              REJECTED                     EXPIRED
 * </pre>
 *
 * Terminal States: REJECTED, ARCHIVED
 *
 * @author AV11-601 Secondary Token Versioning - Task 1.4
 * @version 1.0
 * @since Sprint 1 Task 1.4
 */
public enum SecondaryTokenVersionStatus {

    /**
     * Version created, pending submission for verification
     * Initial state after version creation
     * Timeout: 30 days → Auto-archive
     */
    CREATED("Created", "Version created, pending submission"),

    /**
     * Submitted for VVB (Verified Valuator Board) verification
     * Awaiting third-party approval
     * Timeout: 7 days → Auto-reject
     */
    PENDING_VVB("Pending VVB", "Submitted for VVB verification"),

    /**
     * VVB verification approved
     * Ready for activation
     * No timeout
     */
    APPROVED("Approved", "VVB verification approved"),

    /**
     * Version is currently active
     * The current operational version of the token
     * No timeout (unless parent token expires)
     */
    ACTIVE("Active", "Version is currently active"),

    /**
     * Superseded by newer version
     * Inactive but retained for history
     * Can transition to ARCHIVED
     */
    REPLACED("Replaced", "Superseded by newer version"),

    /**
     * Version expired due to timeout or parent expiration
     * Inactive but retained for history
     * Can transition to ARCHIVED
     */
    EXPIRED("Expired", "Version expired"),

    /**
     * VVB verification rejected
     * Terminal state - no further transitions
     */
    REJECTED("Rejected", "VVB verification rejected"),

    /**
     * Version archived and no longer in use
     * Terminal state - no further transitions
     * Long-term storage for compliance
     */
    ARCHIVED("Archived", "Version archived");

    private final String displayName;
    private final String description;

    /**
     * Constructor
     *
     * @param displayName Human-readable name
     * @param description Detailed description
     */
    SecondaryTokenVersionStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
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
     * Check if this is a terminal state
     *
     * @return true if no further transitions allowed
     */
    public boolean isTerminal() {
        return this == REJECTED || this == ARCHIVED;
    }

    /**
     * Check if this status indicates an active version
     *
     * @return true if version is operationally active
     */
    public boolean isActive() {
        return this == ACTIVE;
    }

    /**
     * Get status by display name
     *
     * @param displayName Display name to search for
     * @return Matching SecondaryTokenVersionStatus or null
     */
    public static SecondaryTokenVersionStatus fromDisplayName(String displayName) {
        for (SecondaryTokenVersionStatus status : values()) {
            if (status.displayName.equalsIgnoreCase(displayName)) {
                return status;
            }
        }
        return null;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
