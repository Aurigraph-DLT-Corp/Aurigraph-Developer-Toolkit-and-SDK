package io.aurigraph.v11.bridge;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Result of a cross-chain transaction
 */
public class TransactionResult {
    private final String transactionId;
    private final String transactionHash;
    private final boolean success;
    private final String status;
    private final long blockNumber;
    private final String blockHash;
    private final BigDecimal gasUsed;
    private final BigDecimal gasPrice;
    private final String errorMessage;
    private final Instant timestamp;
    private final Map<String, Object> metadata;
    
    public TransactionResult(String transactionId, String transactionHash, boolean success,
                            String status, long blockNumber, String blockHash,
                            BigDecimal gasUsed, BigDecimal gasPrice, String errorMessage,
                            Map<String, Object> metadata) {
        this.transactionId = transactionId;
        this.transactionHash = transactionHash;
        this.success = success;
        this.status = status;
        this.blockNumber = blockNumber;
        this.blockHash = blockHash;
        this.gasUsed = gasUsed;
        this.gasPrice = gasPrice;
        this.errorMessage = errorMessage;
        this.timestamp = Instant.now();
        this.metadata = metadata;
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String transactionId;
        private String transactionHash;
        private boolean success;
        private String status;
        private long blockNumber;
        private String blockHash;
        private BigDecimal gasUsed;
        private BigDecimal gasPrice;
        private String errorMessage;
        private Map<String, Object> metadata;
        
        public Builder transactionId(String transactionId) { this.transactionId = transactionId; return this; }
        public Builder transactionHash(String transactionHash) { this.transactionHash = transactionHash; return this; }
        public Builder success(boolean success) { this.success = success; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder blockNumber(long blockNumber) { this.blockNumber = blockNumber; return this; }
        public Builder blockHash(String blockHash) { this.blockHash = blockHash; return this; }
        public Builder gasUsed(BigDecimal gasUsed) { this.gasUsed = gasUsed; return this; }
        public Builder gasPrice(BigDecimal gasPrice) { this.gasPrice = gasPrice; return this; }
        public Builder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public Builder metadata(Map<String, Object> metadata) { this.metadata = metadata; return this; }
        
        public TransactionResult build() {
            return new TransactionResult(transactionId, transactionHash, success, status,
                blockNumber, blockHash, gasUsed, gasPrice, errorMessage, metadata);
        }
    }
    
    // Getters
    public String getTransactionId() { return transactionId; }
    public String getTransactionHash() { return transactionHash; }
    public boolean isSuccess() { return success; }
    public String getStatus() { return status; }
    public long getBlockNumber() { return blockNumber; }
    public String getBlockHash() { return blockHash; }
    public BigDecimal getGasUsed() { return gasUsed; }
    public BigDecimal getGasPrice() { return gasPrice; }
    public String getErrorMessage() { return errorMessage; }
    public Instant getTimestamp() { return timestamp; }
    public Map<String, Object> getMetadata() { return metadata; }
}