package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

/**
 * Bridge Request Model for Cross-Chain Transfers
 */
public class BridgeRequest {
    private String sourceChain;
    private String targetChain;
    private String asset;
    private BigDecimal amount;
    private String sender;
    private String recipient;
    private BigDecimal maxSlippage;
    private long timeoutSeconds;
    
    // Constructors
    public BridgeRequest() {}
    
    public BridgeRequest(String sourceChain, String targetChain, String asset, 
                        BigDecimal amount, String sender, String recipient) {
        this.sourceChain = sourceChain;
        this.targetChain = targetChain;
        this.asset = asset;
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.maxSlippage = new BigDecimal("0.5"); // 0.5% default
        this.timeoutSeconds = 1800; // 30 minutes default
    }
    
    // Getters and Setters
    public String getSourceChain() { return sourceChain; }
    public void setSourceChain(String sourceChain) { this.sourceChain = sourceChain; }
    
    public String getTargetChain() { return targetChain; }
    public void setTargetChain(String targetChain) { this.targetChain = targetChain; }
    
    public String getAsset() { return asset; }
    public void setAsset(String asset) { this.asset = asset; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    
    public BigDecimal getMaxSlippage() { return maxSlippage; }
    public void setMaxSlippage(BigDecimal maxSlippage) { this.maxSlippage = maxSlippage; }
    
    public long getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(long timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
}