package io.aurigraph.v11.bridge;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Status of a cross-chain transaction
 */
public class TransactionStatus {
    public enum TxStatus {
        UNKNOWN,
        PENDING,
        VALIDATING,
        PROCESSING,
        CONFIRMED,
        COMMITTED,
        FAILED,
        CANCELLED,
        TIMEOUT
    }
    
    private final String transactionId;
    private final TxStatus status;
    private final String message;
    private final Instant timestamp;
    private final Map<String, Object> metadata;
    
    public TransactionStatus(String transactionId, TxStatus status, String message, Map<String, Object> metadata) {
        this.transactionId = transactionId;
        this.status = status;
        this.message = message;
        this.timestamp = Instant.now();
        this.metadata = metadata;
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String transactionId;
        private TxStatus status = TxStatus.UNKNOWN;
        private String message;
        private Map<String, Object> metadata = new HashMap<>();
        
        public Builder transactionId(String transactionId) { this.transactionId = transactionId; return this; }
        public Builder status(TxStatus status) { this.status = status; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder metadata(Map<String, Object> metadata) { this.metadata = metadata; return this; }
        
        public TransactionStatus build() {
            return new TransactionStatus(transactionId, status, message, metadata);
        }
    }
    
    // Getters
    public String getTransactionId() { return transactionId; }
    public TxStatus getStatus() { return status; }
    public String getMessage() { return message; }
    public Instant getTimestamp() { return timestamp; }
    public Map<String, Object> getMetadata() { return metadata; }
}