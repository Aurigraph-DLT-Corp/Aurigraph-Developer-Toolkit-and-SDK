package io.aurigraph.v11.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Transaction Model
 *
 * Represents a transaction in the Aurigraph V11 platform.
 * Maps to Transaction message in aurigraph-v11.proto
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_tx_hash", columnList = "hash", unique = true),
    @Index(name = "idx_tx_from", columnList = "from_address"),
    @Index(name = "idx_tx_to", columnList = "to_address"),
    @Index(name = "idx_tx_status", columnList = "status"),
    @Index(name = "idx_tx_timestamp", columnList = "timestamp"),
    @Index(name = "idx_tx_type", columnList = "type")
})
public class Transaction {

    @Id
    @Column(name = "id", nullable = false, unique = true, length = 64)
    private String id;

    @Lob
    @Column(name = "payload", columnDefinition = "BLOB")
    private byte[] payload;

    @Column(name = "priority", nullable = false)
    private int priority = 0;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50)
    private TransactionType type = TransactionType.TRANSFER;

    @Column(name = "from_address", nullable = false, length = 128)
    private String fromAddress;

    @Column(name = "to_address", length = 128)
    private String toAddress;

    @Column(name = "amount", nullable = false)
    private long amount = 0L;

    @Column(name = "gas_price", nullable = false)
    private long gasPrice = 0L;

    @Column(name = "gas_limit", nullable = false)
    private long gasLimit = 0L;

    @Lob
    @Column(name = "signature", columnDefinition = "BLOB")
    private byte[] signature;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "transaction_metadata",
                    joinColumns = @JoinColumn(name = "transaction_id"))
    @MapKeyColumn(name = "metadata_key", length = 100)
    @Column(name = "metadata_value", length = 500)
    private Map<String, String> metadata = new HashMap<>();

    @Column(name = "hash", nullable = false, unique = true, length = 64)
    private String hash;

    @Column(name = "from_alias", length = 128)
    private String from;

    @Column(name = "to_alias", length = 128)
    private String to;

    @Lob
    @Column(name = "zk_proof", columnDefinition = "BLOB")
    private byte[] zkProof;

    @Column(name = "block_height")
    private Long blockHeight;

    @Column(name = "block_hash", length = 64)
    private String blockHash;

    @Column(name = "confirmations")
    private int confirmations = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id")
    private Block block;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
        if (status == null) {
            status = TransactionStatus.PENDING;
        }
        if (type == null) {
            type = TransactionType.TRANSFER;
        }
    }

    // Constructors
    public Transaction() {
    }

    public Transaction(String id, String fromAddress, String toAddress, long amount) {
        this.id = id;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Instant.now();
        this.status = TransactionStatus.PENDING;
        this.type = TransactionType.TRANSFER;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public byte[] getPayload() {
        return payload;
    }

    public void setPayload(byte[] payload) {
        this.payload = payload;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public String getFromAddress() {
        return fromAddress;
    }

    public void setFromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
    }

    public String getToAddress() {
        return toAddress;
    }

    public void setToAddress(String toAddress) {
        this.toAddress = toAddress;
    }

    public long getAmount() {
        return amount;
    }

    public void setAmount(long amount) {
        this.amount = amount;
    }

    public long getGasPrice() {
        return gasPrice;
    }

    public void setGasPrice(long gasPrice) {
        this.gasPrice = gasPrice;
    }

    public long getGasLimit() {
        return gasLimit;
    }

    public void setGasLimit(long gasLimit) {
        this.gasLimit = gasLimit;
    }

    public byte[] getSignature() {
        return signature;
    }

    public void setSignature(byte[] signature) {
        this.signature = signature;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public byte[] getZkProof() {
        return zkProof;
    }

    public void setZkProof(byte[] zkProof) {
        this.zkProof = zkProof;
    }

    public Long getBlockHeight() {
        return blockHeight;
    }

    public void setBlockHeight(Long blockHeight) {
        this.blockHeight = blockHeight;
    }

    public String getBlockHash() {
        return blockHash;
    }

    public void setBlockHash(String blockHash) {
        this.blockHash = blockHash;
    }

    public int getConfirmations() {
        return confirmations;
    }

    public void setConfirmations(int confirmations) {
        this.confirmations = confirmations;
    }

    public Block getBlock() {
        return block;
    }

    public void setBlock(Block block) {
        this.block = block;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Transaction that = (Transaction) o;
        return Objects.equals(id, that.id) && Objects.equals(hash, that.hash);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, hash);
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "id='" + id + '\'' +
                ", fromAddress='" + fromAddress + '\'' +
                ", toAddress='" + toAddress + '\'' +
                ", amount=" + amount +
                ", status=" + status +
                ", type=" + type +
                ", timestamp=" + timestamp +
                ", hash='" + hash + '\'' +
                '}';
    }
}
