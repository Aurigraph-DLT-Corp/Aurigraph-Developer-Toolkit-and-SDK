package io.aurigraph.core;

/**
 * Transaction types supported by Aurigraph V11
 * Optimized for high-performance processing
 */
public enum TransactionType {
    /**
     * Standard token transfer
     */
    TRANSFER("TRANSFER", 1),
    
    /**
     * Smart contract deployment
     */
    CONTRACT_DEPLOYMENT("CONTRACT_DEPLOYMENT", 2),
    
    /**
     * Smart contract execution
     */
    CONTRACT_CALL("CONTRACT_CALL", 3),
    
    /**
     * Asset tokenization operation
     */
    ASSET_TOKENIZATION("ASSET_TOKENIZATION", 4),
    
    /**
     * Cross-chain bridge operation
     */
    CROSS_CHAIN_BRIDGE("CROSS_CHAIN_BRIDGE", 5),
    
    /**
     * AI task submission
     */
    AI_TASK("AI_TASK", 6),
    
    /**
     * Quantum cryptographic operation
     */
    QUANTUM_CRYPTO("QUANTUM_CRYPTO", 7),
    
    /**
     * Governance proposal
     */
    GOVERNANCE("GOVERNANCE", 8),
    
    /**
     * Staking operation
     */
    STAKING("STAKING", 9),
    
    /**
     * Validator registration/update
     */
    VALIDATOR_OPERATION("VALIDATOR_OPERATION", 10);

    private final String displayName;
    private final int typeId;

    TransactionType(String displayName, int typeId) {
        this.displayName = displayName;
        this.typeId = typeId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getTypeId() {
        return typeId;
    }

    /**
     * Get transaction type by ID for fast lookup
     */
    public static TransactionType fromTypeId(int typeId) {
        return switch (typeId) {
            case 1 -> TRANSFER;
            case 2 -> CONTRACT_DEPLOYMENT;
            case 3 -> CONTRACT_CALL;
            case 4 -> ASSET_TOKENIZATION;
            case 5 -> CROSS_CHAIN_BRIDGE;
            case 6 -> AI_TASK;
            case 7 -> QUANTUM_CRYPTO;
            case 8 -> GOVERNANCE;
            case 9 -> STAKING;
            case 10 -> VALIDATOR_OPERATION;
            default -> throw new IllegalArgumentException("Unknown transaction type ID: " + typeId);
        };
    }

    /**
     * Get base gas cost for this transaction type
     */
    public long getBaseGasCost() {
        return switch (this) {
            case TRANSFER -> 21000L;
            case CONTRACT_DEPLOYMENT -> 53000L;
            case CONTRACT_CALL -> 25000L;
            case ASSET_TOKENIZATION -> 150000L;
            case CROSS_CHAIN_BRIDGE -> 200000L;
            case AI_TASK -> 100000L;
            case QUANTUM_CRYPTO -> 75000L;
            case GOVERNANCE -> 50000L;
            case STAKING -> 40000L;
            case VALIDATOR_OPERATION -> 80000L;
        };
    }

    /**
     * Check if this transaction type requires special validation
     */
    public boolean requiresSpecialValidation() {
        return this == CONTRACT_DEPLOYMENT || 
               this == ASSET_TOKENIZATION || 
               this == CROSS_CHAIN_BRIDGE ||
               this == AI_TASK ||
               this == QUANTUM_CRYPTO ||
               this == VALIDATOR_OPERATION;
    }

    /**
     * Check if this transaction type supports batching
     */
    public boolean supportsBatching() {
        return this == TRANSFER || 
               this == CONTRACT_CALL || 
               this == STAKING;
    }
}