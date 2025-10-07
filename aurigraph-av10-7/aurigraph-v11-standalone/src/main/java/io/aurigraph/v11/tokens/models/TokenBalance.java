package io.aurigraph.v11.tokens.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Token Balance Entity
 *
 * Tracks token balances for each address.
 * Supports fungible and non-fungible token tracking.
 *
 * @version 3.8.0 (Phase 2 Day 8)
 * @author Aurigraph V11 Development Team
 */
@Entity
@Table(name = "token_balances", indexes = {
    @Index(name = "idx_token_address", columnList = "tokenId, address", unique = true),
    @Index(name = "idx_address", columnList = "address"),
    @Index(name = "idx_token_id", columnList = "tokenId")
})
public class TokenBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tokenId", nullable = false, length = 66)
    private String tokenId;

    @Column(name = "address", nullable = false, length = 66)
    private String address;

    @Column(name = "balance", precision = 36, scale = 18, nullable = false)
    private BigDecimal balance;

    @Column(name = "lockedBalance", precision = 36, scale = 18, nullable = false)
    private BigDecimal lockedBalance = BigDecimal.ZERO;

    @Column(name = "lastTransferAt")
    private Instant lastTransferAt;

    @Column(name = "updatedAt", nullable = false)
    private Instant updatedAt;

    // ==================== CONSTRUCTORS ====================

    public TokenBalance() {
        this.balance = BigDecimal.ZERO;
        this.lockedBalance = BigDecimal.ZERO;
        this.updatedAt = Instant.now();
    }

    public TokenBalance(String tokenId, String address, BigDecimal balance) {
        this();
        this.tokenId = tokenId;
        this.address = address;
        this.balance = balance;
    }

    // ==================== LIFECYCLE METHODS ====================

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Add to balance
     */
    public void add(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        this.balance = this.balance.add(amount);
        this.lastTransferAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Subtract from balance
     */
    public void subtract(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient available balance");
        }
        this.balance = this.balance.subtract(amount);
        this.lastTransferAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Lock balance
     */
    public void lock(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient available balance to lock");
        }
        this.lockedBalance = this.lockedBalance.add(amount);
        this.updatedAt = Instant.now();
    }

    /**
     * Unlock balance
     */
    public void unlock(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (this.lockedBalance.compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient locked balance to unlock");
        }
        this.lockedBalance = this.lockedBalance.subtract(amount);
        this.updatedAt = Instant.now();
    }

    /**
     * Get available (unlocked) balance
     */
    public BigDecimal getAvailableBalance() {
        return balance.subtract(lockedBalance);
    }

    /**
     * Check if balance is zero
     */
    public boolean isZero() {
        return balance.compareTo(BigDecimal.ZERO) == 0;
    }

    // ==================== GETTERS AND SETTERS ====================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public BigDecimal getLockedBalance() { return lockedBalance; }
    public void setLockedBalance(BigDecimal lockedBalance) { this.lockedBalance = lockedBalance; }

    public Instant getLastTransferAt() { return lastTransferAt; }
    public void setLastTransferAt(Instant lastTransferAt) { this.lastTransferAt = lastTransferAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return String.format("TokenBalance{tokenId='%s', address='%s', balance=%s, locked=%s}",
                tokenId, address, balance, lockedBalance);
    }
}
