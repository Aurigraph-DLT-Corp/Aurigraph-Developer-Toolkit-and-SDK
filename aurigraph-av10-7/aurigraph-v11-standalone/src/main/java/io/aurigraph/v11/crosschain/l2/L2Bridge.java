package io.aurigraph.v11.crosschain.l2;

import java.time.Duration;

/**
 * L2 Bridge Interface for Aurigraph V12
 *
 * Common interface for all Layer 2 bridge implementations.
 * Provides standardized methods for cross-layer communication.
 *
 * @author Aurigraph V12 Integration Team
 * @version 12.0.0
 * @since 2025-01-01
 */
public interface L2Bridge {

    /**
     * Get the bridge name
     */
    String getBridgeName();

    /**
     * Get the L2 chain ID
     */
    long getL2ChainId();

    /**
     * Get the L1 chain ID (usually Ethereum Mainnet)
     */
    long getL1ChainId();

    /**
     * Get the challenge/dispute period duration for withdrawals
     */
    Duration getChallengePeriod();

    /**
     * Check if the bridge is currently active
     */
    boolean isActive();
}
