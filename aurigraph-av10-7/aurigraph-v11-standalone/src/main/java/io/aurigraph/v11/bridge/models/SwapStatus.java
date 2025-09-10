package io.aurigraph.v11.bridge.models;

public enum SwapStatus {
    INITIATED,
    HTLC_DEPLOYED,
    CLAIMED,
    COMPLETED,
    REFUNDED,
    FAILED,
    CLAIM_FAILED,
    REFUND_FAILED,
    TIMEOUT
}