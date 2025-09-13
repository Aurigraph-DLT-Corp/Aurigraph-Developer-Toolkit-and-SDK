package io.aurigraph.v11.bridge.models;

/**
 * Bridge Transaction Status Enumeration
 * 
 * Represents the various states a cross-chain bridge transaction can be in
 * throughout its lifecycle from initiation to completion or failure.
 */
public enum BridgeTransactionStatus {
    
    /**
     * Transaction has been created but not yet submitted to the source chain
     */
    INITIATED("Transaction initiated", 0),
    
    /**
     * Transaction is pending validation and security screening
     */
    VALIDATING("Validating transaction", 10),
    
    /**
     * Transaction has been submitted to the source chain and is being processed
     */
    PENDING("Transaction pending", 20),
    
    /**
     * Transaction is being confirmed on the source chain
     */
    CONFIRMING("Confirming on source chain", 30),
    
    /**
     * Source chain transaction is confirmed, preparing target chain transaction
     */
    LOCKED("Assets locked on source", 50),
    
    /**
     * Validator consensus is being achieved for cross-chain execution
     */
    CONSENSUS("Achieving validator consensus", 60),
    
    /**
     * Creating transaction on target chain
     */
    MINTING("Minting on target chain", 70),
    
    /**
     * Finalizing cross-chain transaction
     */
    FINALIZING("Finalizing transaction", 85),
    
    /**
     * Transaction completed successfully
     */
    COMPLETED("Transaction completed", 100),
    
    /**
     * Transaction failed due to an error
     */
    FAILED("Transaction failed", 0),
    
    /**
     * Transaction was rejected (e.g., failed security screening)
     */
    REJECTED("Transaction rejected", 0),
    
    /**
     * Transaction was cancelled by user or system
     */
    CANCELLED("Transaction cancelled", 0),
    
    /**
     * Transaction timed out
     */
    TIMEOUT("Transaction timed out", 0);
    
    private final String description;
    private final int progressPercentage;
    
    BridgeTransactionStatus(String description, int progressPercentage) {
        this.description = description;
        this.progressPercentage = progressPercentage;
    }
    
    public String getDescription() {
        return description;
    }
    
    public int getProgressPercentage() {
        return progressPercentage;
    }
    
    public boolean isTerminal() {
        return this == COMPLETED || this == FAILED || this == REJECTED || 
               this == CANCELLED || this == TIMEOUT;
    }
    
    public boolean isSuccessful() {
        return this == COMPLETED;
    }
    
    public boolean isFailure() {
        return this == FAILED || this == REJECTED || this == CANCELLED || this == TIMEOUT;
    }
    
    public boolean isActive() {
        return !isTerminal();
    }
}