package io.aurigraph.v11.pending.bridge.models;

/**
 * Bridge Transaction Type Enumeration
 * 
 * Defines the different mechanisms used for cross-chain asset transfers
 * in the Aurigraph bridge system.
 */
public enum BridgeTransactionType {
    
    /**
     * Lock and Mint mechanism
     * - Assets are locked on source chain
     * - Equivalent assets are minted on target chain
     * - Most common for ERC-20 token bridges
     */
    LOCK_AND_MINT("Lock and Mint", "Assets locked on source, minted on target"),
    
    /**
     * Burn and Mint mechanism
     * - Assets are burned on source chain
     * - New assets are minted on target chain
     * - Used for native token transfers
     */
    BURN_AND_MINT("Burn and Mint", "Assets burned on source, minted on target"),
    
    /**
     * Atomic Swap using Hash Time-Locked Contracts (HTLC)
     * - Trustless exchange using cryptographic hashes
     * - Time-locked contracts on both chains
     * - Used for direct token swaps
     */
    ATOMIC_SWAP("Atomic Swap", "Trustless swap using HTLC"),
    
    /**
     * Liquidity Pool Swap
     * - Uses liquidity pools on both chains
     * - Market-making mechanism
     * - Subject to slippage
     */
    LIQUIDITY_SWAP("Liquidity Swap", "Swap through liquidity pools"),
    
    /**
     * Wrapped Asset Transfer
     * - Creates wrapped representation on target chain
     * - 1:1 backing with original asset
     * - Used for Bitcoin, Ethereum wrapping
     */
    WRAPPED_TRANSFER("Wrapped Transfer", "Create wrapped asset representation"),
    
    /**
     * Native Asset Transfer
     * - Direct transfer of native chain assets
     * - No wrapping or minting required
     * - Used for same-chain transfers through bridge
     */
    NATIVE_TRANSFER("Native Transfer", "Direct native asset transfer");
    
    private final String displayName;
    private final String description;
    
    BridgeTransactionType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public boolean requiresLocking() {
        return this == LOCK_AND_MINT || this == WRAPPED_TRANSFER;
    }
    
    public boolean requiresBurning() {
        return this == BURN_AND_MINT;
    }
    
    public boolean requiresMinting() {
        return this == LOCK_AND_MINT || this == BURN_AND_MINT || this == WRAPPED_TRANSFER;
    }
    
    public boolean isAtomicSwap() {
        return this == ATOMIC_SWAP;
    }
    
    public boolean usesLiquidity() {
        return this == LIQUIDITY_SWAP;
    }
}