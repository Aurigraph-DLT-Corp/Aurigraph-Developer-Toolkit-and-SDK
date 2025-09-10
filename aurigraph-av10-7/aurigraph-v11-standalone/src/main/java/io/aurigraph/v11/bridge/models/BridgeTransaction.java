package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Bridge Transaction Model
 */
public class BridgeTransaction {
    private String id;
    private String sourceChain;
    private String targetChain;
    private String asset;
    private BigDecimal amount;
    private String sender;
    private String recipient;
    private BridgeStatus status;
    private long createdAt;
    private long completedAt;
    private String atomicSwapId;
    private BigDecimal estimatedSlippage;
    private BigDecimal actualSlippage;
    private BigDecimal estimatedFee;
    private BigDecimal actualFees;
    private boolean isHighValue;
    private String errorMessage;
    private Set<String> validatorSignatures;
    private String sourceTransactionHash;
    private String targetTransactionHash;
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private BridgeTransaction transaction = new BridgeTransaction();
        
        public Builder id(String id) { transaction.id = id; return this; }
        public Builder sourceChain(String sourceChain) { transaction.sourceChain = sourceChain; return this; }
        public Builder targetChain(String targetChain) { transaction.targetChain = targetChain; return this; }
        public Builder asset(String asset) { transaction.asset = asset; return this; }
        public Builder amount(BigDecimal amount) { transaction.amount = amount; return this; }
        public Builder sender(String sender) { transaction.sender = sender; return this; }
        public Builder recipient(String recipient) { transaction.recipient = recipient; return this; }
        public Builder status(BridgeStatus status) { transaction.status = status; return this; }
        public Builder createdAt(long createdAt) { transaction.createdAt = createdAt; return this; }
        public Builder estimatedSlippage(BigDecimal slippage) { transaction.estimatedSlippage = slippage; return this; }
        public Builder estimatedFee(BigDecimal fee) { transaction.estimatedFee = fee; return this; }
        public Builder isHighValue(boolean isHighValue) { transaction.isHighValue = isHighValue; return this; }
        
        public BridgeTransaction build() { return transaction; }
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
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
    
    public BridgeStatus getStatus() { return status; }
    public void setStatus(BridgeStatus status) { this.status = status; }
    
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
    
    public long getCompletedAt() { return completedAt; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
    
    public String getAtomicSwapId() { return atomicSwapId; }
    public void setAtomicSwapId(String atomicSwapId) { this.atomicSwapId = atomicSwapId; }
    
    public BigDecimal getEstimatedSlippage() { return estimatedSlippage; }
    public void setEstimatedSlippage(BigDecimal estimatedSlippage) { this.estimatedSlippage = estimatedSlippage; }
    
    public BigDecimal getActualSlippage() { return actualSlippage; }
    public void setActualSlippage(BigDecimal actualSlippage) { this.actualSlippage = actualSlippage; }
    
    public BigDecimal getEstimatedFee() { return estimatedFee; }
    public void setEstimatedFee(BigDecimal estimatedFee) { this.estimatedFee = estimatedFee; }
    
    public BigDecimal getActualFees() { return actualFees; }
    public void setActualFees(BigDecimal actualFees) { this.actualFees = actualFees; }
    
    public boolean isHighValue() { return isHighValue; }
    public void setHighValue(boolean isHighValue) { this.isHighValue = isHighValue; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public Set<String> getValidatorSignatures() { return validatorSignatures; }
    public void setValidatorSignatures(Set<String> validatorSignatures) { this.validatorSignatures = validatorSignatures; }
    
    public String getSourceTransactionHash() { return sourceTransactionHash; }
    public void setSourceTransactionHash(String sourceTransactionHash) { this.sourceTransactionHash = sourceTransactionHash; }
    
    public String getTargetTransactionHash() { return targetTransactionHash; }
    public void setTargetTransactionHash(String targetTransactionHash) { this.targetTransactionHash = targetTransactionHash; }
}