package io.aurigraph.v11.contracts;

/**
 * Enum representing the various states of a smart contract
 */
public enum ContractStatus {
    DRAFT,
    PENDING_APPROVAL,
    PENDING_SIGNATURES,
    ACTIVE,
    EXECUTED,
    COMPLETED,
    CANCELLED,
    EXPIRED,
    SUSPENDED,
    TERMINATED
}