package io.aurigraph.v11.models;

/**
 * Transaction Status Enumeration
 *
 * Represents the lifecycle status of a transaction in the Aurigraph platform.
 * Maps to TransactionStatus enum in aurigraph-v11.proto
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
public enum TransactionStatus {
    /**
     * Unknown or uninitialized status
     */
    UNKNOWN,

    /**
     * Transaction submitted and waiting to be processed
     */
    PENDING,

    /**
     * Transaction is being validated
     */
    VALIDATING,

    /**
     * Transaction is being processed
     */
    PROCESSING,

    /**
     * Transaction has been committed to the blockchain
     */
    COMMITTED,

    /**
     * Transaction confirmed on the blockchain
     */
    CONFIRMED,

    /**
     * Transaction processing failed
     */
    FAILED,

    /**
     * Transaction expired before being processed
     */
    EXPIRED,

    /**
     * Transaction was rejected due to validation failure
     */
    REJECTED;

    /**
     * Check if transaction is in a final state
     */
    public boolean isFinal() {
        return this == COMMITTED ||
               this == CONFIRMED ||
               this == FAILED ||
               this == EXPIRED ||
               this == REJECTED;
    }

    /**
     * Check if transaction is still being processed
     */
    public boolean isProcessing() {
        return this == PENDING ||
               this == VALIDATING ||
               this == PROCESSING;
    }
}
