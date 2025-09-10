package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.models.ChainInfo;
import io.aurigraph.v11.bridge.models.ChainType;
import java.math.BigDecimal;
import java.util.List;

/**
 * Base implementation for chain adapters to reduce code duplication
 */
public abstract class BaseChainAdapter implements ChainAdapter {
    
    protected final String rpcUrl;
    protected final int confirmations;
    protected final boolean isActive;
    protected ChainInfo chainInfo;
    
    public BaseChainAdapter(String rpcUrl, int confirmations, boolean isActive) {
        this.rpcUrl = rpcUrl;
        this.confirmations = confirmations;
        this.isActive = isActive;
    }
    
    @Override
    public ChainInfo getChainInfo() {
        return chainInfo;
    }
    
    @Override
    public boolean isHealthy() {
        return isActive;
    }
    
    @Override
    public boolean performHealthCheck() {
        return Math.random() > 0.01; // 99% uptime simulation
    }
    
    @Override
    public double getNetworkHealth() {
        return isActive ? 0.99 : 0.0;
    }
    
    @Override
    public boolean isTransactionConfirmed(String txHash, int requiredConfirmations) {
        return true; // Simplified for demo
    }
    
    // Abstract methods that must be implemented by each chain
    protected abstract String getChainId();
    protected abstract String getChainName();
    protected abstract ChainType getChainType();
    protected abstract long getConfirmationTime();
    protected abstract List<String> getDefaultAssets();
    protected abstract long getBaseBlockHeight();
    protected abstract BigDecimal calculateFee(String asset, BigDecimal amount);
}