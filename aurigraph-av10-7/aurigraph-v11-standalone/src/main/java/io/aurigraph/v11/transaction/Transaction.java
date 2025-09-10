package io.aurigraph.v11.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Transaction representation for processing
 */
public class Transaction {
    private final String id;
    private final String fromAddress;
    private final String toAddress;
    private final BigDecimal amount;
    private final String assetId;
    private final Instant timestamp;
    private final Map<String, Object> metadata;
    private final TransactionStatus status;
    
    public enum TransactionStatus {
        PENDING,
        PROCESSING,
        CONFIRMED,
        FAILED
    }
    
    public Transaction(String id, String fromAddress, String toAddress, 
                      BigDecimal amount, String assetId, Map<String, Object> metadata) {
        this.id = id;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.assetId = assetId;
        this.timestamp = Instant.now();
        this.metadata = metadata;
        this.status = TransactionStatus.PENDING;
    }
    
    // Getters
    public String getId() { return id; }
    public String getFromAddress() { return fromAddress; }
    public String getToAddress() { return toAddress; }
    public BigDecimal getAmount() { return amount; }
    public String getAssetId() { return assetId; }
    public Instant getTimestamp() { return timestamp; }
    public Map<String, Object> getMetadata() { return metadata; }
    public TransactionStatus getStatus() { return status; }
}