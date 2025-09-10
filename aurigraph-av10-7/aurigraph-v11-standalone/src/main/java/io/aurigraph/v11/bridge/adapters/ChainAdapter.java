package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.models.ChainInfo;
import java.math.BigDecimal;
import java.util.List;

/**
 * Chain Adapter Interface for Cross-Chain Bridge
 * 
 * Provides a unified interface for interacting with different blockchain networks.
 */
public interface ChainAdapter {
    
    /**
     * Initialize the chain adapter
     */
    void initialize();
    
    /**
     * Get chain information
     */
    ChainInfo getChainInfo();
    
    /**
     * Check if the adapter is healthy
     */
    boolean isHealthy();
    
    /**
     * Perform health check
     */
    boolean performHealthCheck();
    
    /**
     * Get average confirmation time in milliseconds
     */
    long getAverageConfirmationTime();
    
    /**
     * Get supported assets for this chain
     */
    List<String> getSupportedAssets();
    
    /**
     * Get current block height
     */
    long getCurrentBlockHeight();
    
    /**
     * Get network health (0.0 to 1.0)
     */
    double getNetworkHealth();
    
    /**
     * Estimate transaction fee for an asset and amount
     */
    BigDecimal estimateTransactionFee(String asset, BigDecimal amount);
    
    /**
     * Check if a transaction is confirmed
     */
    boolean isTransactionConfirmed(String txHash, int requiredConfirmations);
}