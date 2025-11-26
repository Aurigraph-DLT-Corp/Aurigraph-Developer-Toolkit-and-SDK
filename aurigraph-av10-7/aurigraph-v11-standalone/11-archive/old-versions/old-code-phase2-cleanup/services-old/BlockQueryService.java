package io.aurigraph.v11.services;

import io.aurigraph.v11.models.Block;
import io.aurigraph.v11.models.BlockStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Block Query Service
 *
 * Provides complex query operations for blocks including:
 * - Pagination and filtering
 * - Status and validator filtering
 * - Time-range queries
 * - Channel-specific queries
 *
 * Part of Sprint 9 - Story 2 (AV11-052)
 *
 * @author Claude Code
 * @version 11.0.0
 * @since Sprint 9
 */
@ApplicationScoped
public class BlockQueryService {

    @Inject
    EntityManager entityManager;

    /**
     * Query Parameters for block filtering
     */
    public static class BlockQueryParams {
        private Integer limit = 50;
        private Integer offset = 0;
        private BlockStatus status;
        private String validatorAddress;
        private String channelId;
        private Instant startTime;
        private Instant endTime;
        private Long minHeight;
        private Long maxHeight;
        private String sortBy = "height";
        private String sortOrder = "DESC";

        // Getters and Setters
        public Integer getLimit() { return limit; }
        public void setLimit(Integer limit) { this.limit = limit; }

        public Integer getOffset() { return offset; }
        public void setOffset(Integer offset) { this.offset = offset; }

        public BlockStatus getStatus() { return status; }
        public void setStatus(BlockStatus status) { this.status = status; }

        public String getValidatorAddress() { return validatorAddress; }
        public void setValidatorAddress(String validatorAddress) { this.validatorAddress = validatorAddress; }

        public String getChannelId() { return channelId; }
        public void setChannelId(String channelId) { this.channelId = channelId; }

        public Instant getStartTime() { return startTime; }
        public void setStartTime(Instant startTime) { this.startTime = startTime; }

        public Instant getEndTime() { return endTime; }
        public void setEndTime(Instant endTime) { this.endTime = endTime; }

        public Long getMinHeight() { return minHeight; }
        public void setMinHeight(Long minHeight) { this.minHeight = minHeight; }

        public Long getMaxHeight() { return maxHeight; }
        public void setMaxHeight(Long maxHeight) { this.maxHeight = maxHeight; }

        public String getSortBy() { return sortBy; }
        public void setSortBy(String sortBy) { this.sortBy = sortBy; }

        public String getSortOrder() { return sortOrder; }
        public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }
    }

    /**
     * Query Result with pagination metadata
     */
    public static class BlockQueryResult {
        private List<Block> blocks;
        private long totalCount;
        private int limit;
        private int offset;
        private boolean hasMore;

        public BlockQueryResult(List<Block> blocks, long totalCount, int limit, int offset) {
            this.blocks = blocks;
            this.totalCount = totalCount;
            this.limit = limit;
            this.offset = offset;
            this.hasMore = (offset + limit) < totalCount;
        }

        // Getters
        public List<Block> getBlocks() { return blocks; }
        public long getTotalCount() { return totalCount; }
        public int getLimit() { return limit; }
        public int getOffset() { return offset; }
        public boolean isHasMore() { return hasMore; }
    }

    /**
     * Query blocks with advanced filtering and pagination
     *
     * @param params Query parameters including filters, pagination, and sorting
     * @return BlockQueryResult with blocks and metadata
     */
    public BlockQueryResult queryBlocks(BlockQueryParams params) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Count query for total results
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Block> countRoot = countQuery.from(Block.class);
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, params);
        countQuery.select(cb.count(countRoot));
        if (!countPredicates.isEmpty()) {
            countQuery.where(countPredicates.toArray(new Predicate[0]));
        }
        long totalCount = entityManager.createQuery(countQuery).getSingleResult();

        // Data query with pagination
        CriteriaQuery<Block> dataQuery = cb.createQuery(Block.class);
        Root<Block> dataRoot = dataQuery.from(Block.class);
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
        TypedQuery<Block> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult(params.getOffset());
        typedQuery.setMaxResults(params.getLimit());
        List<Block> blocks = typedQuery.getResultList();

        return new BlockQueryResult(blocks, totalCount, params.getLimit(), params.getOffset());
    }

    /**
     * Build predicates for filtering blocks
     */
    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<Block> root, BlockQueryParams params) {
        List<Predicate> predicates = new ArrayList<>();

        // Filter by status
        if (params.getStatus() != null) {
            predicates.add(cb.equal(root.get("status"), params.getStatus()));
        }

        // Filter by validator address
        if (params.getValidatorAddress() != null && !params.getValidatorAddress().isEmpty()) {
            predicates.add(cb.equal(root.get("validatorAddress"), params.getValidatorAddress()));
        }

        // Filter by channel
        if (params.getChannelId() != null && !params.getChannelId().isEmpty()) {
            predicates.add(cb.equal(root.get("channelId"), params.getChannelId()));
        }

        // Filter by time range
        if (params.getStartTime() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), params.getStartTime()));
        }
        if (params.getEndTime() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), params.getEndTime()));
        }

        // Filter by height range
        if (params.getMinHeight() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("height"), params.getMinHeight()));
        }
        if (params.getMaxHeight() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("height"), params.getMaxHeight()));
        }

        return predicates;
    }

    /**
     * Get blocks by validator
     *
     * @param validatorAddress Validator address
     * @param limit Maximum results
     * @param offset Pagination offset
     * @return List of blocks validated by specified validator
     */
    public List<Block> getBlocksByValidator(String validatorAddress, int limit, int offset) {
        BlockQueryParams params = new BlockQueryParams();
        params.setValidatorAddress(validatorAddress);
        params.setLimit(limit);
        params.setOffset(offset);
        return queryBlocks(params).getBlocks();
    }

    /**
     * Get blocks by height range
     *
     * @param minHeight Minimum height
     * @param maxHeight Maximum height
     * @return List of blocks in specified height range
     */
    public List<Block> getBlocksByHeightRange(Long minHeight, Long maxHeight) {
        BlockQueryParams params = new BlockQueryParams();
        params.setMinHeight(minHeight);
        params.setMaxHeight(maxHeight);
        params.setLimit(Integer.MAX_VALUE); // Get all in range
        params.setSortBy("height");
        params.setSortOrder("ASC");
        return queryBlocks(params).getBlocks();
    }

    /**
     * Get blocks by time range
     *
     * @param startTime Start of time range
     * @param endTime End of time range
     * @param limit Maximum results
     * @param offset Pagination offset
     * @return List of blocks within time range
     */
    public List<Block> getBlocksByTimeRange(Instant startTime, Instant endTime, int limit, int offset) {
        BlockQueryParams params = new BlockQueryParams();
        params.setStartTime(startTime);
        params.setEndTime(endTime);
        params.setLimit(limit);
        params.setOffset(offset);
        return queryBlocks(params).getBlocks();
    }

    /**
     * Get pending blocks
     *
     * @param limit Maximum results
     * @return List of pending blocks
     */
    public List<Block> getPendingBlocks(int limit) {
        BlockQueryParams params = new BlockQueryParams();
        params.setStatus(BlockStatus.PENDING);
        params.setLimit(limit);
        params.setOffset(0);
        params.setSortBy("height");
        params.setSortOrder("ASC"); // Oldest pending first
        return queryBlocks(params).getBlocks();
    }

    /**
     * Get recent blocks
     *
     * @param limit Maximum results
     * @return List of recent blocks
     */
    public List<Block> getRecentBlocks(int limit) {
        BlockQueryParams params = new BlockQueryParams();
        params.setLimit(limit);
        params.setOffset(0);
        params.setSortBy("height");
        params.setSortOrder("DESC");
        return queryBlocks(params).getBlocks();
    }

    /**
     * Get blocks by channel
     *
     * @param channelId Channel ID
     * @param limit Maximum results
     * @param offset Pagination offset
     * @return List of blocks for specified channel
     */
    public List<Block> getBlocksByChannel(String channelId, int limit, int offset) {
        BlockQueryParams params = new BlockQueryParams();
        params.setChannelId(channelId);
        params.setLimit(limit);
        params.setOffset(offset);
        return queryBlocks(params).getBlocks();
    }

    /**
     * Count blocks by validator
     *
     * @param validatorAddress Validator address
     * @return Count of blocks validated by specified validator
     */
    public long countBlocksByValidator(String validatorAddress) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Block> root = query.from(Block.class);

        query.select(cb.count(root));
        query.where(cb.equal(root.get("validatorAddress"), validatorAddress));

        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Count blocks by status
     *
     * @param status Block status
     * @return Count of blocks with specified status
     */
    public long countBlocksByStatus(BlockStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Block> root = query.from(Block.class);

        query.select(cb.count(root));
        query.where(cb.equal(root.get("status"), status));

        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Get block statistics by channel
     *
     * @param channelId Channel ID
     * @return Block statistics for channel
     */
    public ChannelBlockStats getChannelBlockStats(String channelId) {
        long totalBlocks = countBlocksByChannel(channelId);
        long pendingBlocks = countBlocksByChannelAndStatus(channelId, BlockStatus.PENDING);
        long confirmedBlocks = countBlocksByChannelAndStatus(channelId, BlockStatus.CONFIRMED);
        long finalizedBlocks = countBlocksByChannelAndStatus(channelId, BlockStatus.FINALIZED);

        return new ChannelBlockStats(channelId, totalBlocks, pendingBlocks, confirmedBlocks, finalizedBlocks);
    }

    /**
     * Count blocks by channel
     */
    private long countBlocksByChannel(String channelId) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Block> root = query.from(Block.class);

        query.select(cb.count(root));
        query.where(cb.equal(root.get("channelId"), channelId));

        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Count blocks by channel and status
     */
    private long countBlocksByChannelAndStatus(String channelId, BlockStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<Block> root = query.from(Block.class);

        query.select(cb.count(root));
        query.where(
            cb.and(
                cb.equal(root.get("channelId"), channelId),
                cb.equal(root.get("status"), status)
            )
        );

        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Channel Block Statistics
     */
    public static class ChannelBlockStats {
        private String channelId;
        private long totalBlocks;
        private long pendingBlocks;
        private long confirmedBlocks;
        private long finalizedBlocks;

        public ChannelBlockStats(String channelId, long totalBlocks, long pendingBlocks,
                                 long confirmedBlocks, long finalizedBlocks) {
            this.channelId = channelId;
            this.totalBlocks = totalBlocks;
            this.pendingBlocks = pendingBlocks;
            this.confirmedBlocks = confirmedBlocks;
            this.finalizedBlocks = finalizedBlocks;
        }

        // Getters
        public String getChannelId() { return channelId; }
        public long getTotalBlocks() { return totalBlocks; }
        public long getPendingBlocks() { return pendingBlocks; }
        public long getConfirmedBlocks() { return confirmedBlocks; }
        public long getFinalizedBlocks() { return finalizedBlocks; }
    }
}
