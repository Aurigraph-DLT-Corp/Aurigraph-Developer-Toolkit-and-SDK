package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;

/**
 * Bridge Transaction Result
 */
public class BridgeTransactionResult {
    private final String transactionId;
    private final BridgeStatus status;
    private final BigDecimal actualSlippage;
    private final Long estimatedTime;
    private final BigDecimal totalFees;
    private final String errorMessage;
    private final boolean success;
    
    private BridgeTransactionResult(String transactionId, BridgeStatus status, 
                                  BigDecimal actualSlippage, Long estimatedTime, 
                                  BigDecimal totalFees, String errorMessage, boolean success) {
        this.transactionId = transactionId;
        this.status = status;
        this.actualSlippage = actualSlippage;
        this.estimatedTime = estimatedTime;
        this.totalFees = totalFees;
        this.errorMessage = errorMessage;
        this.success = success;
    }
    
    public static BridgeTransactionResult success(String transactionId, BridgeStatus status,
                                                BigDecimal slippage, Long estimatedTime, BigDecimal fees) {
        return new BridgeTransactionResult(transactionId, status, slippage, estimatedTime, fees, null, true);
    }
    
    public static BridgeTransactionResult failure(String transactionId, String errorMessage) {
        return new BridgeTransactionResult(transactionId, BridgeStatus.FAILED, null, null, null, errorMessage, false);
    }
    
    // Getters
    public String getTransactionId() { return transactionId; }
    public BridgeStatus getStatus() { return status; }
    public BigDecimal getActualSlippage() { return actualSlippage; }
    public Long getEstimatedTime() { return estimatedTime; }
    public BigDecimal getTotalFees() { return totalFees; }
    public String getErrorMessage() { return errorMessage; }
    public boolean isSuccess() { return success; }
}