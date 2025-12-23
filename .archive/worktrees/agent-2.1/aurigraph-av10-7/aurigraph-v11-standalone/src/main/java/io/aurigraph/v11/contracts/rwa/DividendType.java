package io.aurigraph.v11.contracts.rwa;

/**
 * Types of dividend distributions
 */
public enum DividendType {
    REGULAR,        // Regular dividend payment
    SPECIAL,        // Special one-time dividend
    LIQUIDATING,    // Liquidating dividend
    STOCK,          // Stock dividend
    REINVESTMENT    // Dividend reinvestment
}