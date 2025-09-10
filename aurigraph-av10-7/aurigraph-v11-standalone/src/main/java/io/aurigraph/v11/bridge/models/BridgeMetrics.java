package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

/**
 * Bridge Performance Metrics
 */
public class BridgeMetrics {
    private long totalTransactions;
    private long successfulTransactions;
    private long failedTransactions;
    private BigDecimal totalVolume;
    private double currentSuccessRate;
    private long averageProcessingTime;
    private int activeTransactions;
    private int supportedChains;
    private int supportedPairs;
    private int highValueTransfers;
    private int validatorCount;
    private boolean isPaused;
    
    public BridgeMetrics() {
        this.totalVolume = BigDecimal.ZERO;
        this.currentSuccessRate = 99.5;
    }
    
    public void incrementTotalTransactions() { this.totalTransactions++; }
    public void incrementSuccessfulTransactions() { this.successfulTransactions++; }
    public void incrementFailedTransactions() { this.failedTransactions++; }
    public void addTotalVolume(BigDecimal amount) { this.totalVolume = this.totalVolume.add(amount); }
    
    public void updateSuccessRate() {
        if (totalTransactions > 0) {
            this.currentSuccessRate = (double) successfulTransactions / totalTransactions * 100.0;
        }
    }
    
    public void updateAverageProcessingTime(long processingTime) {
        if (successfulTransactions > 0) {
            this.averageProcessingTime = (this.averageProcessingTime * (successfulTransactions - 1) + processingTime) / successfulTransactions;
        } else {
            this.averageProcessingTime = processingTime;
        }
    }
    
    // Getters and Setters
    public long getTotalTransactions() { return totalTransactions; }
    public long getSuccessfulTransactions() { return successfulTransactions; }
    public long getFailedTransactions() { return failedTransactions; }
    public BigDecimal getTotalVolume() { return totalVolume; }
    public double getCurrentSuccessRate() { return currentSuccessRate; }
    public long getAverageProcessingTime() { return averageProcessingTime; }
    
    public int getActiveTransactions() { return activeTransactions; }
    public void setActiveTransactions(int activeTransactions) { this.activeTransactions = activeTransactions; }
    
    public int getSupportedChains() { return supportedChains; }
    public void setSupportedChains(int supportedChains) { this.supportedChains = supportedChains; }
    
    public int getSupportedPairs() { return supportedPairs; }
    public void setSupportedPairs(int supportedPairs) { this.supportedPairs = supportedPairs; }
    
    public int getHighValueTransfers() { return highValueTransfers; }
    public void setHighValueTransfers(int highValueTransfers) { this.highValueTransfers = highValueTransfers; }
    
    public int getValidatorCount() { return validatorCount; }
    public void setValidatorCount(int validatorCount) { this.validatorCount = validatorCount; }
    
    public boolean isPaused() { return isPaused; }
    public void setPaused(boolean isPaused) { this.isPaused = isPaused; }
    
    public void setAverageProcessingTime(long averageProcessingTime) { 
        this.averageProcessingTime = averageProcessingTime; 
    }
    
    public void setCurrentSuccessRate(double currentSuccessRate) { 
        this.currentSuccessRate = currentSuccessRate; 
    }
}