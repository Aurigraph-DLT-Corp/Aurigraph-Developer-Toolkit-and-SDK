package io.aurigraph.v11.bridge.models;

import java.util.List;

public class ChainInfo {
    private String chainId;
    private String name;
    private ChainType type;
    private boolean isActive;
    private long averageConfirmationTime;
    private List<String> supportedAssets;
    private long currentBlockHeight;
    private double networkHealth;
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private ChainInfo info = new ChainInfo();
        
        public Builder chainId(String chainId) { info.chainId = chainId; return this; }
        public Builder name(String name) { info.name = name; return this; }
        public Builder type(ChainType type) { info.type = type; return this; }
        public Builder isActive(boolean isActive) { info.isActive = isActive; return this; }
        public Builder averageConfirmationTime(long time) { info.averageConfirmationTime = time; return this; }
        public Builder supportedAssets(List<String> assets) { info.supportedAssets = assets; return this; }
        public Builder currentBlockHeight(long height) { info.currentBlockHeight = height; return this; }
        public Builder networkHealth(double health) { info.networkHealth = health; return this; }
        
        public ChainInfo build() { return info; }
    }
    
    // Getters
    public String getChainId() { return chainId; }
    public String getName() { return name; }
    public ChainType getType() { return type; }
    public boolean isActive() { return isActive; }
    public long getAverageConfirmationTime() { return averageConfirmationTime; }
    public List<String> getSupportedAssets() { return supportedAssets; }
    public long getCurrentBlockHeight() { return currentBlockHeight; }
    public double getNetworkHealth() { return networkHealth; }
}