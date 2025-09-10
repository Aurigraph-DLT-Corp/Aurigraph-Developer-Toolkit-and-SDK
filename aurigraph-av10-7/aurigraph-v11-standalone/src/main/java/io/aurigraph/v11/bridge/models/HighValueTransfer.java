package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

public class HighValueTransfer {
    private String transactionId;
    private BridgeRequest request;
    private SecurityScreeningResult screening;
    private long createdAt;
    private boolean requiresAdditionalScreening;
    
    public HighValueTransfer(String transactionId, BridgeRequest request, SecurityScreeningResult screening) {
        this.transactionId = transactionId;
        this.request = request;
        this.screening = screening;
        this.createdAt = System.currentTimeMillis();
        this.requiresAdditionalScreening = request.getAmount().compareTo(new BigDecimal("1000000")) > 0; // $1M+
    }
    
    // Getters
    public String getTransactionId() { return transactionId; }
    public BridgeRequest getRequest() { return request; }
    public SecurityScreeningResult getScreening() { return screening; }
    public long getCreatedAt() { return createdAt; }
    public boolean requiresAdditionalScreening() { return requiresAdditionalScreening; }
}