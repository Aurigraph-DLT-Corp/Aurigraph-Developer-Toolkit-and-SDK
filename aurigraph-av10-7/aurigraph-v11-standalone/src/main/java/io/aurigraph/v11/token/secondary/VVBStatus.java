package io.aurigraph.v11.token.secondary;

/**
 * VVB (Verified Valuator Board) Status Enumeration
 * AV11-601: Secondary Token Versioning Initiative
 *
 * Represents the VVB approval status for a secondary token version.
 *
 * @author Aurigraph Team - Sprint 1
 * @version 1.0
 * @since Sprint 1 (Week 1-2)
 */
public enum VVBStatus {
    /**
     * No VVB approval needed for this version
     */
    NOT_REQUIRED,

    /**
     * Awaiting VVB validation/approval
     */
    PENDING,

    /**
     * VVB has approved this version
     */
    APPROVED,

    /**
     * VVB has rejected this version
     */
    REJECTED,

    /**
     * VVB validation timed out
     */
    TIMEOUT
}
