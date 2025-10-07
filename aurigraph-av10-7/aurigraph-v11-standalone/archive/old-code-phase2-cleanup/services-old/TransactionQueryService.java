package io.aurigraph.v11.services;

import io.aurigraph.v11.models.Transaction;
import io.aurigraph.v11.models.TransactionStatus;
import io.aurigraph.v11.models.TransactionType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Transaction Query Service
 *
 * Provides complex query operations for transactions including:
 * - Pagination and filtering
 * - Status and type filtering
 * - Address-based queries
 * - Time-range queries
 *
 * Part of Sprint 9 - Story 1 (AV11-051)
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@ApplicationScoped
public class TransactionQueryService {

    @Inject
    EntityManager entityManager;

    /**
     * Query Parameters for transaction filtering
     */
    public static class TransactionQueryParams {
        private Integer limit = 50;
        private Integer offset = 0;
        private TransactionStatus status;
        private TransactionType type;
        private String address;
        private Instant startTime;
        private Instant endTime;
        private String sortBy = "timestamp";
        private String sortOrder = "DESC";

        // Getters and Setters
        public Integer getLimit() { return limit; }
        public void setLimit(Integer limit) { this.limit = limit; }

        public Integer getOffset() { return offset; }
        public void setOffset(Integer offset) { this.offset = offset; }

        public TransactionStatus getStatus() { return status; }
        public void setStatus(TransactionStatus status) { this.status = status; }

        public TransactionType getType() { return type; }
        public void setType(TransactionType type) { this.type = type; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public Instant getStartTime() { return startTime; }
        public void setStartTime(Instant startTime) { this.startTime = startTime; }

        public Instant getEndTime() { return endTime; }
        public void setEndTime(Instant endTime) { this.endTime = endTime; }

        public String getSortBy() { return sortBy; }
        public void setSortBy(String sortBy) { this.sortBy = sortBy; }

        public String getSortOrder() { return sortOrder; }
        public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }
    }

    /**
     * Query Result with pagination metadata
     */
    public static class TransactionQueryResult {
        private List<Transaction> transactions;
        private long totalCount;
        private int limit;
        private int offset;
        private boolean hasMore;

        public TransactionQueryResult(List<Transaction> transactions, long totalCount, int limit, int offset) {
            this.transactions = transactions;
            this.totalCount = totalCount;
            this.limit = limit;
            this.offset = offset;
            this.hasMore = (offset + limit) < totalCount;
        }

        // Getters
        public List<Transaction> getTransactions() { return transactions; }
        public long getTotalCount() { return totalCount; }
        public int getLimit() { return limit; }
        public int getOffset() { return offset; }
        public boolean isHasMore() { return hasMore; }
    }

    /**
     * Query transactions with advanced filtering and pagination
     *
     * @param params Query parameters including filters, pagination, and sorting
     * @return TransactionQueryResult with transactions and metadata
     */
    public TransactionQueryResult queryTransactions(TransactionQueryParams params) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Count query for total results
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Transaction> countRoot = countQuery.from(Transaction.class);
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, params);
        countQuery.select(cb.count(countRoot));
        if (!countPredicates.isEmpty()) {
            countQuery.where(countPredicates.toArray(new Predicate[0]));
        }
        long totalCount = entityManager.createQuery(countQuery).getSingleResult();

        // Data query with pagination
        CriteriaQuery<Transaction> dataQuery = cb.createQuery(Transaction.class);
        Root<Transaction> dataRoot = dataQuery.from(Transaction.class);
        List<Predicate> dataPredicates = buildPredicates(cb, dataRoot, params);

        dataQuery.select(dataRoot);
        if (!dataPredicates.isEmpty()) {
            dataQuery.where(dataPredicates.toArray(new Predicate[0]));
        }

        // Sorting
        Order order = params.getSortOrder().equalsIgnoreCase("DESC")
            ? cb.desc(dataRoot.get(params.getSortBy()))
            : cb.asc(dataRoot.get(params.getSortBy()));
        dataQuery.orderBy(order);

        // Execute query with pagination
        TypedQuery<Transaction> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult(params.getOffset());
        typedQuery.setMaxResults(params.getLimit());
        List<Transaction> transactions = typedQuery.getResultList();

        return new TransactionQueryResult(transactions, totalCount, params.getLimit(), params.getOffset());
    }

    /**
     * Build predicates for filtering transactions
     */
    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<Transaction> root, TransactionQueryParams params) {
        List<Predicate> predicates = new ArrayList<>();

        // Filter by status
        if (params.getStatus() != null) {
            predicates.add(cb.equal(root.get("status"), params.getStatus()));
        }

        // Filter by type
        if (params.getType() != null) {
            predicates.add(cb.equal(root.get("type"), params.getType()));
        }

        // Filter by address (sender or receiver)
        if (params.getAddress() != null && !params.getAddress().isEmpty()) {
            Predicate senderMatch = cb.equal(root.get("sender"), params.getAddress());
            Predicate receiverMatch = cb.equal(root.get("receiver"), params.getAddress());
            predicates.add(cb.or(senderMatch, receiverMatch));
        }

        // Filter by time range
        if (params.getStartTime() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), params.getStartTime()));
        }
        if (params.getEndTime() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), params.getEndTime()));
        }

        return predicates;
    }

    /**
     * Get transactions by address (sender or receiver)
     *
     * @param address Wallet address
     * @param limit Maximum results
     * @param offset Pagination offset
     * @return List of transactions involving the address
     */
    public List<Transaction> getTransactionsByAddress(String address, int limit, int offset) {
        TransactionQueryParams params = new TransactionQueryParams();
        params.setAddress(address);
        params.setLimit(limit);
        params.setOffset(offset);
        return queryTransactions(params).getTransactions();
    }

    /**
     * Get pending transactions
     *
     * @param limit Maximum results
     * @return List of pending transactions
     */
    public List<Transaction> getPendingTransactions(int limit) {
        TransactionQueryParams params = new TransactionQueryParams();
        params.setStatus(TransactionStatus.PENDING);
        params.setLimit(limit);
        params.setOffset(0);
        params.setSortBy("timestamp");
        params.setSortOrder("ASC"); // Oldest pending first
        return queryTransactions(params).getTransactions();
    }

    /**
     * Get recent transactions
     *
     * @param limit Maximum results
     * @return List of recent transactions
     */
    public List<Transaction> getRecentTransactions(int limit) {
        TransactionQueryParams params = new TransactionQueryParams();
        params.setLimit(limit);
        params.setOffset(0);
        params.setSortBy("timestamp");
        params.setSortOrder("DESC");
        return queryTransactions(params).getTransactions();
    }

    /**
     * Get transactions by type
     *
     * @param type Transaction type
     * @param limit Maximum results
     * @param offset Pagination offset
     * @return List of transactions of specified type
     */
    public List<Transaction> getTransactionsByType(TransactionType type, int limit, int offset) {
        TransactionQueryParams params = new TransactionQueryParams();
        params.setType(type);
        params.setLimit(limit);
        params.setOffset(offset);
        return queryTransactions(params).getTransactions();
    }

    /**
     * Get transactions within time range
     *
     * @param startTime Start of time range
     * @param endTime End of time range
     * @param limit Maximum results
     * @param offset Pagination offset
     * @return List of transactions within time range
     */
    public List<Transaction> getTransactionsByTimeRange(Instant startTime, Instant endTime, int limit, int offset) {
        TransactionQueryParams params = new TransactionQueryParams();
        params.setStartTime(startTime);
        params.setEndTime(endTime);
        params.setLimit(limit);
        params.setOffset(offset);
        return queryTransactions(params).getTransactions();
    }

    /**
     * Count transactions by status
     *
     * @param status Transaction status
     * @return Count of transactions with specified status
     */
    public long countTransactionsByStatus(TransactionStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Transaction> root = query.from(Transaction.class);

        query.select(cb.count(root));
        query.where(cb.equal(root.get("status"), status));

        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Get transaction statistics
     *
     * @return Transaction statistics object
     */
    public TransactionStats getTransactionStats() {
        long totalCount = entityManager.createQuery("SELECT COUNT(t) FROM Transaction t", Long.class)
                .getSingleResult();
        long pendingCount = countTransactionsByStatus(TransactionStatus.PENDING);
        long confirmedCount = countTransactionsByStatus(TransactionStatus.CONFIRMED);
        long failedCount = countTransactionsByStatus(TransactionStatus.FAILED);

        return new TransactionStats(totalCount, pendingCount, confirmedCount, failedCount);
    }

    /**
     * Transaction Statistics
     */
    public static class TransactionStats {
        private long totalCount;
        private long pendingCount;
        private long confirmedCount;
        private long failedCount;

        public TransactionStats(long totalCount, long pendingCount, long confirmedCount, long failedCount) {
            this.totalCount = totalCount;
            this.pendingCount = pendingCount;
            this.confirmedCount = confirmedCount;
            this.failedCount = failedCount;
        }

        // Getters
        public long getTotalCount() { return totalCount; }
        public long getPendingCount() { return pendingCount; }
        public long getConfirmedCount() { return confirmedCount; }
        public long getFailedCount() { return failedCount; }
    }
}
