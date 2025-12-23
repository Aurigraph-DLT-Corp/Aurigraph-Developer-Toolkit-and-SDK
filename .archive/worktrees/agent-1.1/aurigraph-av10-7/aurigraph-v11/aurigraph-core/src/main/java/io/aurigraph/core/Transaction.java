package io.aurigraph.core;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Core Transaction data structure for Aurigraph V11
 * High-performance immutable transaction representation
 */
public record Transaction(
    @JsonProperty("id") String id,
    @JsonProperty("from") String from,
    @JsonProperty("to") String to,
    @JsonProperty("amount") double amount,
    @JsonProperty("nonce") long nonce,
    @JsonProperty("gasPrice") double gasPrice,
    @JsonProperty("gasLimit") long gasLimit,
    @JsonProperty("data") byte[] data,
    @JsonProperty("signature") byte[] signature,
    @JsonProperty("timestamp") Instant timestamp,
    @JsonProperty("type") TransactionType type,
    @JsonProperty("metadata") Map<String, String> metadata
) {
    
    @JsonCreator
    public Transaction(
            @JsonProperty("id") String id,
            @JsonProperty("from") String from,
            @JsonProperty("to") String to,
            @JsonProperty("amount") double amount,
            @JsonProperty("nonce") long nonce,
            @JsonProperty("gasPrice") double gasPrice,
            @JsonProperty("gasLimit") long gasLimit,
            @JsonProperty("data") byte[] data,
            @JsonProperty("signature") byte[] signature,
            @JsonProperty("timestamp") Instant timestamp,
            @JsonProperty("type") TransactionType type,
            @JsonProperty("metadata") Map<String, String> metadata) {
        
        this.id = Objects.requireNonNull(id, "Transaction ID cannot be null");
        this.from = Objects.requireNonNull(from, "From address cannot be null");
        this.to = Objects.requireNonNull(to, "To address cannot be null");
        this.amount = amount;
        this.nonce = nonce;
        this.gasPrice = gasPrice;
        this.gasLimit = gasLimit;
        this.data = data != null ? data.clone() : new byte[0];
        this.signature = signature != null ? signature.clone() : new byte[0];
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.type = type != null ? type : TransactionType.TRANSFER;
        this.metadata = metadata != null ? Map.copyOf(metadata) : Map.of();
        
        validateTransaction();
    }

    /**
     * Validate transaction parameters
     */
    private void validateTransaction() {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Transaction ID cannot be empty");
        }
        if (from == null || from.trim().isEmpty()) {
            throw new IllegalArgumentException("From address cannot be empty");
        }
        if (to == null || to.trim().isEmpty()) {
            throw new IllegalArgumentException("To address cannot be empty");
        }
        if (amount < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
        if (gasPrice < 0) {
            throw new IllegalArgumentException("Gas price cannot be negative");
        }
        if (gasLimit <= 0) {
            throw new IllegalArgumentException("Gas limit must be positive");
        }
    }

    /**
     * Calculate transaction hash for identification
     */
    public String calculateHash() {
        // Implementation for high-performance hashing
        var content = String.format("%s:%s:%s:%.8f:%d:%.8f:%d:%s",
            id, from, to, amount, nonce, gasPrice, gasLimit, 
            timestamp.toEpochMilli());
        
        return HashUtil.sha256Hex(content);
    }

    /**
     * Calculate transaction size in bytes for fee calculation
     */
    public int getSize() {
        return id.length() + from.length() + to.length() + 
               data.length + signature.length + 
               metadata.toString().length() + 100; // overhead
    }

    /**
     * Check if transaction has valid signature
     */
    public boolean hasValidSignature() {
        return signature.length > 0;
    }

    /**
     * Get estimated gas usage
     */
    public long getEstimatedGasUsage() {
        long baseGas = 21000; // Base transaction cost
        long dataGas = data.length * 68; // Data cost
        return Math.min(baseGas + dataGas, gasLimit);
    }

    /**
     * Override equals for array comparison
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        Transaction other = (Transaction) obj;
        return Objects.equals(id, other.id) &&
               Objects.equals(from, other.from) &&
               Objects.equals(to, other.to) &&
               Double.compare(other.amount, amount) == 0 &&
               nonce == other.nonce &&
               Double.compare(other.gasPrice, gasPrice) == 0 &&
               gasLimit == other.gasLimit &&
               java.util.Arrays.equals(data, other.data) &&
               java.util.Arrays.equals(signature, other.signature) &&
               Objects.equals(timestamp, other.timestamp) &&
               type == other.type &&
               Objects.equals(metadata, other.metadata);
    }

    /**
     * Override hashCode for array handling
     */
    @Override
    public int hashCode() {
        return Objects.hash(id, from, to, amount, nonce, gasPrice, gasLimit,
                          java.util.Arrays.hashCode(data),
                          java.util.Arrays.hashCode(signature),
                          timestamp, type, metadata);
    }

    /**
     * Create a new transaction builder
     */
    public static TransactionBuilder builder() {
        return new TransactionBuilder();
    }

    /**
     * Builder class for easy transaction construction
     */
    public static class TransactionBuilder {
        private String id;
        private String from;
        private String to;
        private double amount;
        private long nonce;
        private double gasPrice = 20.0;
        private long gasLimit = 21000;
        private byte[] data = new byte[0];
        private byte[] signature = new byte[0];
        private Instant timestamp = Instant.now();
        private TransactionType type = TransactionType.TRANSFER;
        private Map<String, String> metadata = Map.of();

        public TransactionBuilder id(String id) { this.id = id; return this; }
        public TransactionBuilder from(String from) { this.from = from; return this; }
        public TransactionBuilder to(String to) { this.to = to; return this; }
        public TransactionBuilder amount(double amount) { this.amount = amount; return this; }
        public TransactionBuilder nonce(long nonce) { this.nonce = nonce; return this; }
        public TransactionBuilder gasPrice(double gasPrice) { this.gasPrice = gasPrice; return this; }
        public TransactionBuilder gasLimit(long gasLimit) { this.gasLimit = gasLimit; return this; }
        public TransactionBuilder data(byte[] data) { this.data = data; return this; }
        public TransactionBuilder signature(byte[] signature) { this.signature = signature; return this; }
        public TransactionBuilder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }
        public TransactionBuilder type(TransactionType type) { this.type = type; return this; }
        public TransactionBuilder metadata(Map<String, String> metadata) { this.metadata = metadata; return this; }

        public Transaction build() {
            return new Transaction(id, from, to, amount, nonce, gasPrice, gasLimit,
                                 data, signature, timestamp, type, metadata);
        }
    }
}