package io.aurigraph.v11.bridge.models;

import java.math.BigDecimal;
import java.util.Set;

public class BridgeTransactionStatus {
    private String transactionId;
    private BridgeStatus status;
    private String sourceChain;
    private String targetChain;
    private String asset;
    private BigDecimal amount;
    private int progress;
    private long estimatedCompletionTime;
    private BigDecimal actualSlippage;
    private BigDecimal fees;
    private AtomicSwapStatus atomicSwapStatus;
    private Set<String> validatorSignatures;
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private BridgeTransactionStatus status = new BridgeTransactionStatus();
        
        public Builder transactionId(String transactionId) { status.transactionId = transactionId; return this; }
        public Builder status(BridgeStatus bridgeStatus) { status.status = bridgeStatus; return this; }
        public Builder sourceChain(String sourceChain) { status.sourceChain = sourceChain; return this; }
        public Builder targetChain(String targetChain) { status.targetChain = targetChain; return this; }
        public Builder asset(String asset) { status.asset = asset; return this; }
        public Builder amount(BigDecimal amount) { status.amount = amount; return this; }
        public Builder progress(int progress) { status.progress = progress; return this; }
        public Builder estimatedCompletionTime(long time) { status.estimatedCompletionTime = time; return this; }
        public Builder actualSlippage(BigDecimal slippage) { status.actualSlippage = slippage; return this; }
        public Builder fees(BigDecimal fees) { status.fees = fees; return this; }
        public Builder atomicSwapStatus(AtomicSwapStatus swapStatus) { status.atomicSwapStatus = swapStatus; return this; }
        public Builder validatorSignatures(Set<String> signatures) { status.validatorSignatures = signatures; return this; }
        
        public BridgeTransactionStatus build() { return status; }
    }
    
    // Getters
    public String getTransactionId() { return transactionId; }
    public BridgeStatus getStatus() { return status; }
    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getAsset() { return asset; }
    public BigDecimal getAmount() { return amount; }
    public int getProgress() { return progress; }
    public long getEstimatedCompletionTime() { return estimatedCompletionTime; }
    public BigDecimal getActualSlippage() { return actualSlippage; }
    public BigDecimal getFees() { return fees; }
    public AtomicSwapStatus getAtomicSwapStatus() { return atomicSwapStatus; }
    public Set<String> getValidatorSignatures() { return validatorSignatures; }
}