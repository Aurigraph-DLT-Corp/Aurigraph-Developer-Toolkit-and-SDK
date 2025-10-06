package io.aurigraph.v11.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Triple-Entry Ledger Entity - Implements triple-entry accounting with blockchain receipts
 *
 * Triple-Entry Accounting Principles:
 * - Every transaction has a debit, credit, AND blockchain receipt
 * - All entries are cryptographically signed and immutable
 * - Third entry is the blockchain hash/receipt providing independent verification
 * - Enables real-time reconciliation with blockchain state
 *
 * Features:
 * - Cryptographic proof of transactions via blockchain receipts
 * - Multi-currency support
 * - Account balance tracking and validation
 * - Blockchain reconciliation
 * - Audit trail with complete history
 * - Support for complex accounting scenarios
 *
 * @version 1.0.0
 * @since Sprint 13 (AV11-060)
 */
@Entity
@Table(name = "triple_entry_ledger", indexes = {
    @Index(name = "idx_transaction_id", columnList = "transactionId"),
    @Index(name = "idx_receipt_hash", columnList = "receiptHash", unique = true),
    @Index(name = "idx_debit_account", columnList = "debitAccount"),
    @Index(name = "idx_credit_account", columnList = "creditAccount"),
    @Index(name = "idx_timestamp", columnList = "timestamp"),
    @Index(name = "idx_entry_date", columnList = "entryDate"),
    @Index(name = "idx_contract_id", columnList = "contractId"),
    @Index(name = "idx_reconciliation", columnList = "reconciled")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripleEntryLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JsonProperty("id")
    private UUID id;

    /**
     * Transaction reference - links all related ledger entries
     */
    @Column(name = "transactionId", nullable = false, length = 128)
    @JsonProperty("transactionId")
    private String transactionId;

    /**
     * Blockchain receipt hash - the third entry providing cryptographic proof
     */
    @Column(name = "receiptHash", nullable = false, unique = true, length = 128)
    @JsonProperty("receiptHash")
    private String receiptHash;

    /**
     * Debit account (source of funds)
     */
    @Column(name = "debitAccount", nullable = false, length = 128)
    @JsonProperty("debitAccount")
    private String debitAccount;

    /**
     * Credit account (destination of funds)
     */
    @Column(name = "creditAccount", nullable = false, length = 128)
    @JsonProperty("creditAccount")
    private String creditAccount;

    /**
     * Amount transferred
     */
    @Column(name = "amount", nullable = false, precision = 36, scale = 18)
    @JsonProperty("amount")
    private BigDecimal amount;

    /**
     * Currency code
     */
    @Column(name = "currency", nullable = false, length = 16)
    @JsonProperty("currency")
    @Builder.Default
    private String currency = "USD";

    /**
     * Exchange rate if multi-currency
     */
    @Column(name = "exchangeRate", precision = 18, scale = 8)
    @JsonProperty("exchangeRate")
    private BigDecimal exchangeRate;

    /**
     * Converted amount in base currency
     */
    @Column(name = "baseAmount", precision = 36, scale = 18)
    @JsonProperty("baseAmount")
    private BigDecimal baseAmount;

    @Column(name = "baseCurrency", length = 16)
    @JsonProperty("baseCurrency")
    private String baseCurrency;

    /**
     * Timestamps
     */
    @Column(name = "timestamp", nullable = false)
    @JsonProperty("timestamp")
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(name = "entryDate", nullable = false)
    @JsonProperty("entryDate")
    @Builder.Default
    private LocalDate entryDate = LocalDate.now();

    @Column(name = "valueDate")
    @JsonProperty("valueDate")
    private LocalDate valueDate;

    /**
     * Entry type classification
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entryType", nullable = false, length = 32)
    @JsonProperty("entryType")
    @Builder.Default
    private EntryType entryType = EntryType.NORMAL;

    /**
     * Description and narrative
     */
    @Column(name = "description", columnDefinition = "TEXT")
    @JsonProperty("description")
    private String description;

    @Column(name = "narrative", columnDefinition = "TEXT")
    @JsonProperty("narrative")
    private String narrative;

    /**
     * Reference to contract if applicable
     */
    @Column(name = "contractId", length = 128)
    @JsonProperty("contractId")
    private String contractId;

    /**
     * Blockchain details
     */
    @Column(name = "blockchainNetwork", length = 64)
    @JsonProperty("blockchainNetwork")
    @Builder.Default
    private String blockchainNetwork = "Aurigraph";

    @Column(name = "blockNumber")
    @JsonProperty("blockNumber")
    private Long blockNumber;

    @Column(name = "blockHash", length = 128)
    @JsonProperty("blockHash")
    private String blockHash;

    @Column(name = "transactionIndex")
    @JsonProperty("transactionIndex")
    private Integer transactionIndex;

    /**
     * Reconciliation status
     */
    @Column(name = "reconciled")
    @JsonProperty("reconciled")
    @Builder.Default
    private boolean reconciled = false;

    @Column(name = "reconciledAt")
    @JsonProperty("reconciledAt")
    private Instant reconciledAt;

    @Column(name = "reconciledBy", length = 128)
    @JsonProperty("reconciledBy")
    private String reconciledBy;

    /**
     * Verification and validation
     */
    @Column(name = "verified")
    @JsonProperty("verified")
    @Builder.Default
    private boolean verified = false;

    @Column(name = "verifiedAt")
    @JsonProperty("verifiedAt")
    private Instant verifiedAt;

    @Column(name = "verificationSignature", length = 512)
    @JsonProperty("verificationSignature")
    private String verificationSignature;

    /**
     * Cryptographic signature of the entry
     */
    @Column(name = "entrySignature", columnDefinition = "TEXT")
    @JsonProperty("entrySignature")
    private String entrySignature;

    @Column(name = "publicKey", columnDefinition = "TEXT")
    @JsonProperty("publicKey")
    private String publicKey;

    /**
     * Account balances after this entry (for quick lookup)
     */
    @Column(name = "debitAccountBalance", precision = 36, scale = 18)
    @JsonProperty("debitAccountBalance")
    private BigDecimal debitAccountBalance;

    @Column(name = "creditAccountBalance", precision = 36, scale = 18)
    @JsonProperty("creditAccountBalance")
    private BigDecimal creditAccountBalance;

    /**
     * Status and flags
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @JsonProperty("status")
    @Builder.Default
    private EntryStatus status = EntryStatus.PENDING;

    @Column(name = "reversed")
    @JsonProperty("reversed")
    @Builder.Default
    private boolean reversed = false;

    @Column(name = "reversalEntryId")
    @JsonProperty("reversalEntryId")
    private UUID reversalEntryId;

    @Column(name = "reversedAt")
    @JsonProperty("reversedAt")
    private Instant reversedAt;

    /**
     * Audit and compliance
     */
    @Column(name = "createdBy", length = 128)
    @JsonProperty("createdBy")
    private String createdBy;

    @Column(name = "approvedBy", length = 128)
    @JsonProperty("approvedBy")
    private String approvedBy;

    @Column(name = "approvedAt")
    @JsonProperty("approvedAt")
    private Instant approvedAt;

    @Column(name = "fiscalPeriod", length = 32)
    @JsonProperty("fiscalPeriod")
    private String fiscalPeriod; // e.g., "2025-Q1"

    /**
     * Additional metadata (JSON)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    @JsonProperty("metadata")
    @Builder.Default
    private String metadata = "{}"; // JSON object

    /**
     * Tags for categorization (JSON array)
     */
    @Column(name = "tags", columnDefinition = "TEXT")
    @JsonProperty("tags")
    @Builder.Default
    private String tags = "[]"; // JSON array

    /**
     * Related entries (for complex transactions)
     */
    @Column(name = "relatedEntries", columnDefinition = "TEXT")
    @JsonProperty("relatedEntries")
    @Builder.Default
    private String relatedEntries = "[]"; // JSON array of entry IDs

    /**
     * Lifecycle methods
     */
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
        if (entryDate == null) {
            entryDate = LocalDate.now();
        }
        if (status == null) {
            status = EntryStatus.PENDING;
        }
    }

    /**
     * Validation methods
     */
    public boolean isValid() {
        return amount != null &&
               amount.compareTo(BigDecimal.ZERO) > 0 &&
               debitAccount != null && !debitAccount.isEmpty() &&
               creditAccount != null && !creditAccount.isEmpty() &&
               receiptHash != null && !receiptHash.isEmpty();
    }

    public boolean isBalanced() {
        // In triple-entry, amounts must always match
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    public boolean requiresReconciliation() {
        return !reconciled && status == EntryStatus.POSTED;
    }

    /**
     * Business logic methods
     */
    public void markAsReconciled(String reconciledBy) {
        this.reconciled = true;
        this.reconciledAt = Instant.now();
        this.reconciledBy = reconciledBy;
    }

    public void markAsVerified(String signature) {
        this.verified = true;
        this.verifiedAt = Instant.now();
        this.verificationSignature = signature;
    }

    public void approve(String approver) {
        this.status = EntryStatus.APPROVED;
        this.approvedBy = approver;
        this.approvedAt = Instant.now();
    }

    public void post() {
        if (status == EntryStatus.APPROVED || status == EntryStatus.PENDING) {
            this.status = EntryStatus.POSTED;
        }
    }

    public void reverse(UUID reversalId) {
        this.reversed = true;
        this.reversalEntryId = reversalId;
        this.reversedAt = Instant.now();
        this.status = EntryStatus.REVERSED;
    }

    public void reject(String reason) {
        this.status = EntryStatus.REJECTED;
        // Store reason in metadata
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TripleEntryLedger that = (TripleEntryLedger) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(receiptHash, that.receiptHash);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, receiptHash);
    }

    @Override
    public String toString() {
        return String.format("TripleEntryLedger{id=%s, txId='%s', debit='%s', credit='%s', amount=%s %s, receipt='%s', status=%s}",
            id, transactionId, debitAccount, creditAccount, amount, currency,
            receiptHash != null ? receiptHash.substring(0, Math.min(16, receiptHash.length())) + "..." : "none",
            status);
    }
}

/**
 * Entry Type Enum
 */
enum EntryType {
    NORMAL,          // Regular transaction
    OPENING,         // Opening balance
    CLOSING,         // Closing balance
    ADJUSTMENT,      // Adjustment entry
    REVERSAL,        // Reversal of previous entry
    ACCRUAL,         // Accrual entry
    PREPAYMENT,      // Prepayment
    PROVISION,       // Provision entry
    REVALUATION      // Currency revaluation
}

/**
 * Entry Status Enum
 */
enum EntryStatus {
    PENDING,         // Awaiting approval
    APPROVED,        // Approved but not posted
    POSTED,          // Posted to ledger
    RECONCILED,      // Reconciled with blockchain
    REVERSED,        // Reversed
    REJECTED,        // Rejected
    ARCHIVED         // Archived
}
