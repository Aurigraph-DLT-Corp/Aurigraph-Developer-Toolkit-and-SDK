package io.aurigraph.v11.bridge.models;

/**
 * Bridge Transaction Status Enumeration
 */
public enum BridgeStatus {
    INITIATED,
    VALIDATING, 
    SWAP_INITIATED,
    CONSENSUS_REACHED,
    PROCESSING,
    CONFIRMING,
    COMPLETED,
    FAILED,
    CONSENSUS_FAILED,
    TIMEOUT,
    REFUNDED
}