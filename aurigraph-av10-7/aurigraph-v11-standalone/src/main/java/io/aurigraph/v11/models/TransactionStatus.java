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
     * Transaction is in the mempool waiting for processing
     * Added for BUG-005 fix
     */
    IN_MEMPOOL,

    /**
     * Transaction has been committed to the blockchain
     */
    COMMITTED,

    /**
     * Transaction confirmed on the blockchain
     */
    CONFIRMED,

    /**
     * Transaction has been finalized and cannot be reverted
     * Added for BUG-005 fix
     */
    FINALIZED,

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
    REJECTED,

    /**
     * Transaction is queued for processing
     * Added for AV11-360 fix - aligns with proto TransactionStatus.TRANSACTION_QUEUED
     */
    QUEUED;

    /**
     * Check if transaction is in a final state
     */
    public boolean isFinal() {
        return this == COMMITTED ||
               this == CONFIRMED ||
               this == FINALIZED ||
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
               this == IN_MEMPOOL ||
               this == PROCESSING ||
               this == QUEUED;
    }

    /**
     * Convert from proto TransactionStatus to Java TransactionStatus
     * Added for AV11-360 fix - ensures proper mapping between proto and Java enums
     */
    public static TransactionStatus fromProto(io.aurigraph.v11.proto.TransactionStatus protoStatus) {
        if (protoStatus == null) {
            return UNKNOWN;
        }
        return switch (protoStatus) {
            case TRANSACTION_UNKNOWN -> UNKNOWN;
            case TRANSACTION_PENDING -> PENDING;
            case TRANSACTION_VALIDATING -> VALIDATING;
            case TRANSACTION_PROCESSING -> PROCESSING;
            case TRANSACTION_IN_MEMPOOL -> IN_MEMPOOL;
            case TRANSACTION_COMMITTED -> COMMITTED;
            case TRANSACTION_CONFIRMED -> CONFIRMED;
            case TRANSACTION_FINALIZED -> FINALIZED;
            case TRANSACTION_FAILED -> FAILED;
            case TRANSACTION_EXPIRED -> EXPIRED;
            case TRANSACTION_REJECTED -> REJECTED;
            case TRANSACTION_QUEUED -> QUEUED;
            default -> UNKNOWN;
        };
    }

    /**
     * Convert from Java TransactionStatus to proto TransactionStatus
     * Added for AV11-360 fix - ensures proper mapping between Java and proto enums
     */
    public io.aurigraph.v11.proto.TransactionStatus toProto() {
        return switch (this) {
            case UNKNOWN -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_UNKNOWN;
            case PENDING -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_PENDING;
            case VALIDATING -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_VALIDATING;
            case PROCESSING -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_PROCESSING;
            case IN_MEMPOOL -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_IN_MEMPOOL;
            case COMMITTED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_COMMITTED;
            case CONFIRMED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_CONFIRMED;
            case FINALIZED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_FINALIZED;
            case FAILED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_FAILED;
            case EXPIRED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_EXPIRED;
            case REJECTED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_REJECTED;
            case QUEUED -> io.aurigraph.v11.proto.TransactionStatus.TRANSACTION_QUEUED;
        };
    }
}
