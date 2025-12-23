package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.TransactionRequest;
import io.aurigraph.v11.bridge.TransactionResult;
import io.aurigraph.v11.bridge.TransactionStatus;
import io.aurigraph.v11.bridge.models.ChainInfo;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Interface for blockchain adapter implementations
 */
public interface ChainAdapter {
    
    /**
     * Initialize the adapter
     */
    void initialize();
    
    /**
     * Get chain information
     */
    ChainInfo getChainInfo();
    
    /**
     * Get supported assets
     */
    List<String> getSupportedAssets();
    
    /**
     * Estimate transaction fee
     */
    BigDecimal estimateTransactionFee(String assetId, BigDecimal amount);
    
    /**
     * Get average confirmation time
     */
    long getAverageConfirmationTime();
    
    /**
     * Get current block height
     */
    long getCurrentBlockHeight();
    
    /**
     * Check if adapter is healthy
     */
    boolean isHealthy();
    
    /**
     * Get network health score
     */
    double getNetworkHealth();
    
    /**
     * Send a transaction
     */
    CompletableFuture<TransactionResult> sendTransaction(TransactionRequest request);
    
    /**
     * Get transaction status
     */
    CompletableFuture<TransactionStatus> getTransactionStatus(String transactionId);
}