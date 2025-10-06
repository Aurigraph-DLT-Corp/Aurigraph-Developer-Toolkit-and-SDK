package io.aurigraph.v11.models;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Block Entity
 *
 * Represents a block in the Aurigraph V11 blockchain.
 * Contains block header information, transactions, and Merkle root.
 *
 * Part of Sprint 9 - Story 2 (AV11-052)
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@Entity
@Table(name = "blocks", indexes = {
    @Index(name = "idx_block_height", columnList = "height"),
    @Index(name = "idx_block_hash", columnList = "hash"),
    @Index(name = "idx_block_timestamp", columnList = "timestamp"),
    @Index(name = "idx_block_channel", columnList = "channel_id")
})
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private Long height;

    @Column(nullable = false, unique = true, length = 64)
    private String hash;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "merkle_root", nullable = false, length = 64)
    private String merkleRoot;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "block_size", nullable = false)
    private Long blockSize;

    @Column(name = "transaction_count", nullable = false)
    private Integer transactionCount;

    @Column(name = "validator_address", nullable = false)
    private String validatorAddress;

    @Column(name = "validator_signature", length = 1024)
    private String validatorSignature;

    @Column(name = "consensus_algorithm", length = 50)
    private String consensusAlgorithm = "HyperRAFT++";

    @Column(name = "channel_id")
    private String channelId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BlockStatus status = BlockStatus.PENDING;

    @Column(name = "difficulty")
    private Double difficulty;

    @Column(name = "nonce")
    private Long nonce;

    @Column(name = "gas_used")
    private Long gasUsed;

    @Column(name = "gas_limit")
    private Long gasLimit;

    @Column(name = "state_root", length = 64)
    private String stateRoot;

    @Column(name = "receipts_root", length = 64)
    private String receiptsRoot;

    @Column(name = "extra_data", columnDefinition = "TEXT")
    private String extraData;

    @OneToMany(mappedBy = "block", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> transactions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Constructors
    public Block() {
    }

    public Block(Long height, String hash, String previousHash, String merkleRoot,
                 Instant timestamp, String validatorAddress) {
        this.height = height;
        this.hash = hash;
        this.previousHash = previousHash;
        this.merkleRoot = merkleRoot;
        this.timestamp = timestamp;
        this.validatorAddress = validatorAddress;
        this.status = BlockStatus.PENDING;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getHeight() {
        return height;
    }

    public void setHeight(Long height) {
        this.height = height;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getMerkleRoot() {
        return merkleRoot;
    }

    public void setMerkleRoot(String merkleRoot) {
        this.merkleRoot = merkleRoot;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Long getBlockSize() {
        return blockSize;
    }

    public void setBlockSize(Long blockSize) {
        this.blockSize = blockSize;
    }

    public Integer getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Integer transactionCount) {
        this.transactionCount = transactionCount;
    }

    public String getValidatorAddress() {
        return validatorAddress;
    }

    public void setValidatorAddress(String validatorAddress) {
        this.validatorAddress = validatorAddress;
    }

    public String getValidatorSignature() {
        return validatorSignature;
    }

    public void setValidatorSignature(String validatorSignature) {
        this.validatorSignature = validatorSignature;
    }

    public String getConsensusAlgorithm() {
        return consensusAlgorithm;
    }

    public void setConsensusAlgorithm(String consensusAlgorithm) {
        this.consensusAlgorithm = consensusAlgorithm;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public BlockStatus getStatus() {
        return status;
    }

    public void setStatus(BlockStatus status) {
        this.status = status;
    }

    public Double getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Double difficulty) {
        this.difficulty = difficulty;
    }

    public Long getNonce() {
        return nonce;
    }

    public void setNonce(Long nonce) {
        this.nonce = nonce;
    }

    public Long getGasUsed() {
        return gasUsed;
    }

    public void setGasUsed(Long gasUsed) {
        this.gasUsed = gasUsed;
    }

    public Long getGasLimit() {
        return gasLimit;
    }

    public void setGasLimit(Long gasLimit) {
        this.gasLimit = gasLimit;
    }

    public String getStateRoot() {
        return stateRoot;
    }

    public void setStateRoot(String stateRoot) {
        this.stateRoot = stateRoot;
    }

    public String getReceiptsRoot() {
        return receiptsRoot;
    }

    public void setReceiptsRoot(String receiptsRoot) {
        this.receiptsRoot = receiptsRoot;
    }

    public String getExtraData() {
        return extraData;
    }

    public void setExtraData(String extraData) {
        this.extraData = extraData;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Helper: Add transaction to block
     */
    public void addTransaction(Transaction transaction) {
        transactions.add(transaction);
        transaction.setBlock(this);
        transactionCount = transactions.size();
    }

    /**
     * Helper: Remove transaction from block
     */
    public void removeTransaction(Transaction transaction) {
        transactions.remove(transaction);
        transaction.setBlock(null);
        transactionCount = transactions.size();
    }

    /**
     * Helper: Verify Merkle root
     */
    public boolean verifyMerkleRoot() {
        // TODO: Implement Merkle tree verification
        // Calculate Merkle root from transactions and compare
        return true;
    }

    /**
     * Helper: Check if block is finalized
     */
    public boolean isFinalized() {
        return status == BlockStatus.FINALIZED;
    }

    /**
     * Helper: Check if block is confirmed
     */
    public boolean isConfirmed() {
        return status == BlockStatus.CONFIRMED || status == BlockStatus.FINALIZED;
    }

    @Override
    public String toString() {
        return "Block{" +
                "id='" + id + '\'' +
                ", height=" + height +
                ", hash='" + hash + '\'' +
                ", previousHash='" + previousHash + '\'' +
                ", merkleRoot='" + merkleRoot + '\'' +
                ", timestamp=" + timestamp +
                ", transactionCount=" + transactionCount +
                ", validatorAddress='" + validatorAddress + '\'' +
                ", status=" + status +
                '}';
    }
}
