package io.aurigraph.v11.registry;

/**
 * Lifecycle status for registered assets.
 * Defines the state machine for asset registration to sale.
 *
 * Status Flow:
 * DRAFT -> SUBMITTED -> VERIFIED -> LISTED -> SOLD
 *                    -> REJECTED -> DRAFT (resubmit)
 * Any -> ARCHIVED (terminal state)
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public enum AssetStatus {

    /**
     * Initial state - asset is being created/edited by owner.
     */
    DRAFT("Draft", "Asset is being created or edited", false),

    /**
     * Submitted for verification by a third-party verifier.
     */
    SUBMITTED("Submitted", "Awaiting verification", false),

    /**
     * Asset has been verified by an authorized verifier.
     */
    VERIFIED("Verified", "Asset verified and ready for listing", false),

    /**
     * Verification was rejected - needs revision.
     */
    REJECTED("Rejected", "Verification rejected - needs revision", false),

    /**
     * Asset is listed for sale on the marketplace.
     */
    LISTED("Listed", "Asset is listed for sale", false),

    /**
     * Asset has been sold to a buyer.
     */
    SOLD("Sold", "Asset has been sold", true),

    /**
     * Asset has been archived (removed from active listing).
     */
    ARCHIVED("Archived", "Asset is archived", true);

    private final String displayName;
    private final String description;
    private final boolean terminal;

    AssetStatus(String displayName, String description, boolean terminal) {
        this.displayName = displayName;
        this.description = description;
        this.terminal = terminal;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Returns true if this is a terminal state (no further transitions allowed).
     */
    public boolean isTerminal() {
        return terminal;
    }

    /**
     * Check if transition from current status to target status is allowed.
     */
    public boolean canTransitionTo(AssetStatus target) {
        if (this.terminal) {
            return false; // Cannot transition from terminal states
        }

        return switch (this) {
            case DRAFT -> target == SUBMITTED || target == ARCHIVED;
            case SUBMITTED -> target == VERIFIED || target == REJECTED || target == ARCHIVED;
            case VERIFIED -> target == LISTED || target == ARCHIVED;
            case REJECTED -> target == DRAFT || target == ARCHIVED;
            case LISTED -> target == SOLD || target == ARCHIVED;
            case SOLD, ARCHIVED -> false;
        };
    }
}
