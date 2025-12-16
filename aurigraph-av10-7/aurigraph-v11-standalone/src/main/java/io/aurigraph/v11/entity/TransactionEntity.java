package io.aurigraph.v11.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Transaction Entity for persistent storage
 *
 * Stores all transaction data in PostgreSQL for the Aurigraph V12 blockchain.
 * Uses Panache ORM for simplified data access patterns.
 *
 * @author J4C Database Agent
 * @version 12.0.0
 */
@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transaction_hash", columnList = "hash", unique = true),
    @Index(name = "idx_transaction_from", columnList = "fromAddress"),
    @Index(name = "idx_transaction_to", columnList = "toAddress"),
    @Index(name = "idx_transaction_status", columnList = "status"),
    @Index(name = "idx_transaction_block", columnList = "blockNumber"),
    @Index(name = "idx_transaction_created", columnList = "createdAt")
})
public class TransactionEntity extends PanacheEntity {

    /**
     * Unique transaction identifier (UUID)
     */
    @Column(nullable = false, unique = true, length = 66)
    public String transactionId;

    /**
     * Transaction hash (SHA-256 or xxHash based on config)
     */
    @Column(nullable = false, unique = true, length = 66)
    public String hash;

    /**
     * Sender address
     */
    @Column(nullable = false, length = 66)
    public String fromAddress;

    /**
     * Recipient address
     */
    @Column(nullable = false, length = 66)
    public String toAddress;

    /**
     * Transaction amount (supports high precision for crypto amounts)
     */
    @Column(nullable = false, precision = 38, scale = 18)
    public BigDecimal amount;

    /**
     * Transaction status: PENDING, CONFIRMED, FAILED
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    public TransactionStatus status;

    /**
     * Digital signature (quantum-resistant CRYSTALS-Dilithium)
     */
    @Column(nullable = false, length = 4096)
    public String signature;

    /**
     * Block hash (null for pending transactions)
     */
    @Column(length = 66)
    public String blockHash;

    /**
     * Block number (null for pending transactions)
     */
    @Column
    public Long blockNumber;

    /**
     * Timestamp when transaction was created
     */
    @Column(nullable = false)
    public Instant createdAt;

    /**
     * Timestamp when transaction was confirmed (null for pending)
     */
    @Column
    public Instant confirmedAt;

    /**
     * Additional metadata as JSON (gas price, nonce, data, etc.)
     */
    @Column(columnDefinition = "TEXT")
    public String metadata;

    /**
     * Gas price for transaction prioritization
     */
    @Column(precision = 18, scale = 9)
    public BigDecimal gasPrice;

    /**
     * Gas limit
     */
    @Column
    public Long gasLimit;

    /**
     * Actual gas used (null until confirmed)
     */
    @Column
    public Long gasUsed;

    /**
     * Transaction nonce
     */
    @Column
    public Long nonce;

    /**
     * Transaction data payload (smart contract calls, etc.)
     */
    @Column(columnDefinition = "TEXT")
    public String data;

    /**
     * Error message if transaction failed
     */
    @Column(columnDefinition = "TEXT")
    public String errorMessage;

    /**
     * Default constructor
     */
    public TransactionEntity() {
        this.createdAt = Instant.now();
        this.status = TransactionStatus.PENDING;
    }

    /**
     * Transaction status enum
     */
    public enum TransactionStatus {
        PENDING,    // Transaction submitted but not yet confirmed
        CONFIRMED,  // Transaction confirmed in a block
        FAILED      // Transaction failed during execution
    }

    /**
     * Pre-persist callback to set default values
     */
    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null) {
            this.status = TransactionStatus.PENDING;
        }
    }

    /**
     * Pre-update callback to update confirmation timestamp
     */
    @PreUpdate
    public void preUpdate() {
        if (this.status == TransactionStatus.CONFIRMED && this.confirmedAt == null) {
            this.confirmedAt = Instant.now();
        }
    }

    @Override
    public String toString() {
        return "TransactionEntity{" +
                "id=" + id +
                ", transactionId='" + transactionId + '\'' +
                ", hash='" + hash + '\'' +
                ", from='" + fromAddress + '\'' +
                ", to='" + toAddress + '\'' +
                ", amount=" + amount +
                ", status=" + status +
                ", blockNumber=" + blockNumber +
                ", createdAt=" + createdAt +
                '}';
    }
}
