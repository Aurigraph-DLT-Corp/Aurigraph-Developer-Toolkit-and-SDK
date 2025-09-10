package io.aurigraph.v11.bridge;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Cross-chain transaction request
 */
public class TransactionRequest {
    private final String id;
    private final String sourceChain;
    private final String targetChain;
    private final String fromAddress;
    private final String toAddress;
    private final String assetId;
    private final BigDecimal amount;
    private final BigDecimal gasPrice;
    private final long gasLimit;
    private final Instant timestamp;
    private final Map<String, Object> metadata;
    
    public TransactionRequest(String id, String sourceChain, String targetChain,
                             String fromAddress, String toAddress, String assetId,
                             BigDecimal amount, BigDecimal gasPrice, long gasLimit,
                             Map<String, Object> metadata) {
        this.id = id;
        this.sourceChain = sourceChain;
        this.targetChain = targetChain;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.assetId = assetId;
        this.amount = amount;
        this.gasPrice = gasPrice;
        this.gasLimit = gasLimit;
        this.timestamp = Instant.now();
        this.metadata = metadata;
    }
    
    // Getters
    public String getId() { return id; }
    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getFromAddress() { return fromAddress; }
    public String getToAddress() { return toAddress; }
    public String getAssetId() { return assetId; }
    public String getAsset() { return assetId; } // Alias for getAssetId
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getGasPrice() { return gasPrice; }
    public long getGasLimit() { return gasLimit; }
    public Instant getTimestamp() { return timestamp; }
    public Map<String, Object> getMetadata() { return metadata; }
}