package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

public class AtomicSwapRequest {
    private String chainA;
    private String chainB;
    private String assetA;
    private BigDecimal amountA;
    private String partyA;
    private String partyB;
    private long timeoutSeconds;
    
    // Constructors
    public AtomicSwapRequest() {}
    
    public AtomicSwapRequest(String chainA, String chainB, String assetA, 
                           BigDecimal amountA, String partyA, String partyB) {
        this.chainA = chainA;
        this.chainB = chainB;
        this.assetA = assetA;
        this.amountA = amountA;
        this.partyA = partyA;
        this.partyB = partyB;
        this.timeoutSeconds = 1800; // 30 minutes default
    }
    
    // Getters and Setters
    public String getChainA() { return chainA; }
    public void setChainA(String chainA) { this.chainA = chainA; }
    
    public String getChainB() { return chainB; }
    public void setChainB(String chainB) { this.chainB = chainB; }
    
    public String getAssetA() { return assetA; }
    public void setAssetA(String assetA) { this.assetA = assetA; }
    
    public BigDecimal getAmountA() { return amountA; }
    public void setAmountA(BigDecimal amountA) { this.amountA = amountA; }
    
    public String getPartyA() { return partyA; }
    public void setPartyA(String partyA) { this.partyA = partyA; }
    
    public String getPartyB() { return partyB; }
    public void setPartyB(String partyB) { this.partyB = partyB; }
    
    public long getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(long timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
}