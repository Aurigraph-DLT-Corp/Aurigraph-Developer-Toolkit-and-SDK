package io.aurigraph.v11.repository;

import io.aurigraph.v11.entity.TransactionEntity;
import io.aurigraph.v11.entity.TransactionEntity.TransactionStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Transaction Repository
 *
 * Provides data access methods for transaction persistence using Panache ORM.
 * Includes custom queries for common transaction operations and pagination support.
 *
 * @author J4C Database Agent
 * @version 12.0.0
 */
@ApplicationScoped
public class TransactionRepository implements PanacheRepository<TransactionEntity> {

    /**
     * Find transaction by hash
     *
     * @param hash Transaction hash
     * @return Optional containing the transaction if found
     */
    public Optional<TransactionEntity> findByHash(String hash) {
        return find("hash", hash).firstResultOptional();
    }

    /**
     * Find transaction by transaction ID
     *
     * @param transactionId Transaction ID
     * @return Optional containing the transaction if found
     */
    public Optional<TransactionEntity> findByTransactionId(String transactionId) {
        return find("transactionId", transactionId).firstResultOptional();
    }

    /**
     * Find all transactions by sender address with pagination
     *
     * @param fromAddress Sender address
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return List of transactions
     */
    public List<TransactionEntity> findByFromAddress(String fromAddress, int page, int size) {
        return find("fromAddress", Sort.descending("createdAt"), fromAddress)
                .page(Page.of(page, size))
                .list();
    }

    /**
     * Find all transactions by recipient address with pagination
     *
     * @param toAddress Recipient address
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return List of transactions
     */
    public List<TransactionEntity> findByToAddress(String toAddress, int page, int size) {
        return find("toAddress", Sort.descending("createdAt"), toAddress)
                .page(Page.of(page, size))
                .list();
    }

    /**
     * Find all transactions involving an address (sender or recipient)
     *
     * @param address Address to search for
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return List of transactions
     */
    public List<TransactionEntity> findByAddress(String address, int page, int size) {
        return find("fromAddress = ?1 or toAddress = ?1", Sort.descending("createdAt"), address)
                .page(Page.of(page, size))
                .list();
    }

    /**
     * Find all transactions by status
     *
     * @param status Transaction status
     * @return List of transactions
     */
    public List<TransactionEntity> findByStatus(TransactionStatus status) {
        return find("status", Sort.descending("createdAt"), status).list();
    }

    /**
     * Find pending transactions with pagination
     *
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return List of pending transactions
     */
    public List<TransactionEntity> findPendingTransactions(int page, int size) {
        return find("status", Sort.descending("gasPrice", "createdAt"), TransactionStatus.PENDING)
                .page(Page.of(page, size))
                .list();
    }

    /**
     * Find pending transactions sorted by gas price (for mempool)
     *
     * @param limit Maximum number of transactions to return
     * @return List of pending transactions sorted by gas price (descending)
     */
    public List<TransactionEntity> findPendingByGasPrice(int limit) {
        return find("status", Sort.descending("gasPrice"), TransactionStatus.PENDING)
                .page(Page.ofSize(limit))
                .list();
    }

    /**
     * Find all transactions in a specific block
     *
     * @param blockNumber Block number
     * @return List of transactions in the block
     */
    public List<TransactionEntity> findByBlockNumber(Long blockNumber) {
        return find("blockNumber", Sort.ascending("nonce"), blockNumber).list();
    }

    /**
     * Find transactions by block hash
     *
     * @param blockHash Block hash
     * @return List of transactions in the block
     */
    public List<TransactionEntity> findByBlockHash(String blockHash) {
        return find("blockHash", Sort.ascending("nonce"), blockHash).list();
    }

    /**
     * Count pending transactions
     *
     * @return Number of pending transactions
     */
    public long countPending() {
        return count("status", TransactionStatus.PENDING);
    }

    /**
     * Count transactions by status
     *
     * @param status Transaction status
     * @return Number of transactions with the given status
     */
    public long countByStatus(TransactionStatus status) {
        return count("status", status);
    }

    /**
     * Count transactions for an address
     *
     * @param address Address to count transactions for
     * @return Number of transactions
     */
    public long countByAddress(String address) {
        return count("fromAddress = ?1 or toAddress = ?1", address);
    }

    /**
     * Find recent transactions (last N transactions)
     *
     * @param limit Maximum number of transactions to return
     * @return List of recent transactions
     */
    public List<TransactionEntity> findRecent(int limit) {
        return find("ORDER BY createdAt DESC")
                .page(Page.ofSize(limit))
                .list();
    }

    /**
     * Find transactions created after a specific time
     *
     * @param after Timestamp to search after
     * @return List of transactions
     */
    public List<TransactionEntity> findCreatedAfter(Instant after) {
        return find("createdAt > ?1", Sort.ascending("createdAt"), after).list();
    }

    /**
     * Find transactions confirmed between two timestamps
     *
     * @param start Start timestamp
     * @param end End timestamp
     * @return List of confirmed transactions
     */
    public List<TransactionEntity> findConfirmedBetween(Instant start, Instant end) {
        return find("status = ?1 and confirmedAt >= ?2 and confirmedAt < ?3",
                Sort.ascending("confirmedAt"),
                TransactionStatus.CONFIRMED, start, end).list();
    }

    /**
     * Update transaction status
     *
     * @param hash Transaction hash
     * @param status New status
     * @return Number of updated records
     */
    @Transactional
    public int updateStatus(String hash, TransactionStatus status) {
        return update("status = ?1, confirmedAt = ?2 where hash = ?3",
                status,
                status == TransactionStatus.CONFIRMED ? Instant.now() : null,
                hash);
    }

    /**
     * Update transaction with block information
     *
     * @param hash Transaction hash
     * @param blockHash Block hash
     * @param blockNumber Block number
     * @return Number of updated records
     */
    @Transactional
    public int updateBlockInfo(String hash, String blockHash, Long blockNumber) {
        return update("blockHash = ?1, blockNumber = ?2, status = ?3, confirmedAt = ?4 where hash = ?5",
                blockHash, blockNumber, TransactionStatus.CONFIRMED, Instant.now(), hash);
    }

    /**
     * Delete old transactions (for cleanup/archival)
     *
     * @param before Delete transactions created before this timestamp
     * @return Number of deleted records
     */
    @Transactional
    public long deleteOldTransactions(Instant before) {
        return delete("createdAt < ?1 and status = ?2", before, TransactionStatus.CONFIRMED);
    }

    /**
     * Find failed transactions for retry/analysis
     *
     * @param limit Maximum number of transactions to return
     * @return List of failed transactions
     */
    public List<TransactionEntity> findFailedTransactions(int limit) {
        return find("status", Sort.descending("createdAt"), TransactionStatus.FAILED)
                .page(Page.ofSize(limit))
                .list();
    }
}
