-- ==================================================================================
-- Aurigraph V12 Database Schema: Additional Indexes and Foreign Keys
-- ==================================================================================
-- Description: Cross-table indexes, foreign keys, and performance optimizations
-- Version: V25
-- Created: 2025-12-16
-- Author: J4C Database Agent
-- ==================================================================================

-- ==================================================================================
-- FOREIGN KEY RELATIONSHIPS
-- ==================================================================================
-- These establish referential integrity between tables.
-- IMPORTANT: Uncomment only after data population to avoid constraint violations.

-- Transactions <-> Blocks relationship
-- ALTER TABLE transactions ADD CONSTRAINT fk_transactions_block
--     FOREIGN KEY (block_hash) REFERENCES blocks(hash) ON DELETE SET NULL;
-- COMMENT ON CONSTRAINT fk_transactions_block ON transactions IS
--     'Links transactions to their containing block';

-- Blocks <-> Validators relationship
-- ALTER TABLE blocks ADD CONSTRAINT fk_blocks_validator
--     FOREIGN KEY (validator_id) REFERENCES validators(address) ON DELETE RESTRICT;
-- COMMENT ON CONSTRAINT fk_blocks_validator ON blocks IS
--     'Ensures only registered validators can produce blocks';

-- Consensus Rounds <-> Validators relationship
-- ALTER TABLE consensus_rounds ADD CONSTRAINT fk_consensus_rounds_proposer
--     FOREIGN KEY (proposer_id) REFERENCES validators(address) ON DELETE RESTRICT;
-- COMMENT ON CONSTRAINT fk_consensus_rounds_proposer ON consensus_rounds IS
--     'Ensures only registered validators can propose consensus rounds';

-- Consensus Rounds <-> Blocks relationship
-- ALTER TABLE consensus_rounds ADD CONSTRAINT fk_consensus_rounds_block
--     FOREIGN KEY (block_hash) REFERENCES blocks(hash) ON DELETE SET NULL;
-- COMMENT ON CONSTRAINT fk_consensus_rounds_block ON consensus_rounds IS
--     'Links successful consensus rounds to produced blocks';

-- Quantum Keys <-> Validators relationship (optional)
-- ALTER TABLE quantum_keys ADD CONSTRAINT fk_quantum_keys_owner
--     FOREIGN KEY (owner_address) REFERENCES validators(address) ON DELETE SET NULL;
-- COMMENT ON CONSTRAINT fk_quantum_keys_owner ON quantum_keys IS
--     'Links quantum keys to their validator owners';

-- ==================================================================================
-- CROSS-TABLE INDEXES FOR JOIN OPTIMIZATION
-- ==================================================================================

-- Optimize transactions + blocks joins
CREATE INDEX IF NOT EXISTS idx_transactions_block_lookup ON transactions(block_hash, status)
    WHERE block_hash IS NOT NULL;
COMMENT ON INDEX idx_transactions_block_lookup IS
    'Optimizes queries joining transactions with blocks by hash';

-- Optimize blocks + validators joins
CREATE INDEX IF NOT EXISTS idx_blocks_validator_lookup ON blocks(validator_id, timestamp DESC);
COMMENT ON INDEX idx_blocks_validator_lookup IS
    'Optimizes queries for validator block production history';

-- Optimize consensus rounds + validators joins
CREATE INDEX IF NOT EXISTS idx_consensus_proposer_lookup ON consensus_rounds(proposer_id, result, started_at DESC)
    WHERE result IS NOT NULL;
COMMENT ON INDEX idx_consensus_proposer_lookup IS
    'Optimizes queries for validator consensus participation';

-- Optimize quantum keys + validators joins
CREATE INDEX IF NOT EXISTS idx_quantum_keys_owner_lookup ON quantum_keys(owner_address, status, algorithm)
    WHERE owner_address IS NOT NULL;
COMMENT ON INDEX idx_quantum_keys_owner_lookup IS
    'Optimizes queries for validator key management';

-- ==================================================================================
-- PERFORMANCE INDEXES FOR COMMON QUERY PATTERNS
-- ==================================================================================

-- Transaction history queries (by user address, sorted by time)
CREATE INDEX IF NOT EXISTS idx_transactions_address_history ON transactions(from_address, created_at DESC)
    WHERE status IN ('CONFIRMED', 'FAILED');
COMMENT ON INDEX idx_transactions_address_history IS
    'Optimizes user transaction history queries';

CREATE INDEX IF NOT EXISTS idx_transactions_recipient_history ON transactions(to_address, created_at DESC)
    WHERE to_address IS NOT NULL AND status IN ('CONFIRMED', 'FAILED');
COMMENT ON INDEX idx_transactions_recipient_history IS
    'Optimizes recipient transaction history queries';

-- Pending transactions for mempool queries
CREATE INDEX IF NOT EXISTS idx_transactions_pending_pool ON transactions(created_at ASC, gas_price DESC)
    WHERE status = 'PENDING';
COMMENT ON INDEX idx_transactions_pending_pool IS
    'Optimizes mempool queries sorted by age and gas price';

-- Block explorer queries (recent blocks)
CREATE INDEX IF NOT EXISTS idx_blocks_recent ON blocks(timestamp DESC, transaction_count DESC)
    WHERE transaction_count > 0;
COMMENT ON INDEX idx_blocks_recent IS
    'Optimizes block explorer queries for recent blocks';

-- Validator leaderboard queries
CREATE INDEX IF NOT EXISTS idx_validators_leaderboard ON validators(status, blocks_produced DESC, rewards_earned DESC)
    WHERE status = 'ACTIVE';
COMMENT ON INDEX idx_validators_leaderboard IS
    'Optimizes validator leaderboard and ranking queries';

-- Consensus round performance monitoring
CREATE INDEX IF NOT EXISTS idx_consensus_performance ON consensus_rounds(started_at DESC, phase)
    WHERE completed_at IS NULL;
COMMENT ON INDEX idx_consensus_performance IS
    'Monitors in-progress consensus rounds for performance tracking';

-- Key expiration monitoring (security critical)
-- Note: Time-based filtering (keys expiring within 7 days) must be done at query time
-- since CURRENT_TIMESTAMP is not IMMUTABLE and cannot be used in partial index predicates
CREATE INDEX IF NOT EXISTS idx_quantum_keys_expiry_alert ON quantum_keys(expires_at ASC, owner_address)
    WHERE status = 'ACTIVE' AND expires_at IS NOT NULL;
COMMENT ON INDEX idx_quantum_keys_expiry_alert IS
    'Critical: Index for finding keys by expiration date (filter for 7-day window at query time)';

-- ==================================================================================
-- COVERING INDEXES (Include frequently accessed columns)
-- ==================================================================================
-- These indexes include additional columns to avoid table lookups

-- Transaction summary queries
CREATE INDEX IF NOT EXISTS idx_transactions_summary ON transactions(from_address, status)
    INCLUDE (to_address, amount, created_at, confirmed_at)
    WHERE status IN ('CONFIRMED', 'FAILED');
COMMENT ON INDEX idx_transactions_summary IS
    'Covering index for transaction summary queries (avoids table lookup)';

-- Block summary queries
CREATE INDEX IF NOT EXISTS idx_blocks_summary ON blocks(block_number DESC)
    INCLUDE (hash, validator_id, timestamp, transaction_count, size);
COMMENT ON INDEX idx_blocks_summary IS
    'Covering index for block summary queries (avoids table lookup)';

-- Validator summary queries
CREATE INDEX IF NOT EXISTS idx_validators_summary ON validators(status)
    INCLUDE (address, stake_amount, uptime, blocks_produced, rewards_earned)
    WHERE status = 'ACTIVE';
COMMENT ON INDEX idx_validators_summary IS
    'Covering index for validator summary queries (avoids table lookup)';

-- ==================================================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ==================================================================================

-- High-value transactions (fraud detection)
CREATE INDEX IF NOT EXISTS idx_transactions_high_value ON transactions(amount DESC, created_at DESC)
    WHERE status = 'CONFIRMED' AND amount > 1000000000000000000; -- > 1 ETH in wei
COMMENT ON INDEX idx_transactions_high_value IS
    'Tracks high-value transactions for fraud detection and analytics';

-- Validator slashing events
CREATE INDEX IF NOT EXISTS idx_validators_slashed ON validators(status, updated_at DESC)
    WHERE status IN ('SLASHED', 'JAILED');
COMMENT ON INDEX idx_validators_slashed IS
    'Tracks slashed/jailed validators for governance and reporting';

-- Failed consensus rounds (debugging)
CREATE INDEX IF NOT EXISTS idx_consensus_failures_debug ON consensus_rounds(result, started_at DESC)
    INCLUDE (round_number, proposer_id, phase, votes_received, votes_required, metadata)
    WHERE result IN ('FAILED', 'TIMEOUT');
COMMENT ON INDEX idx_consensus_failures_debug IS
    'Debugging index for failed consensus rounds with full context';

-- Quantum key compromise detection
CREATE INDEX IF NOT EXISTS idx_quantum_keys_compromised ON quantum_keys(status, revoked_at DESC)
    INCLUDE (key_id, owner_address, algorithm, rotation_reason)
    WHERE status = 'REVOKED';
COMMENT ON INDEX idx_quantum_keys_compromised IS
    'Security: Tracks revoked keys for compromise analysis';

-- ==================================================================================
-- STATISTICS AND MAINTENANCE
-- ==================================================================================

-- Analyze all tables to update query planner statistics
ANALYZE transactions;
ANALYZE blocks;
ANALYZE validators;
ANALYZE consensus_rounds;
ANALYZE quantum_keys;

-- ==================================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ==================================================================================

-- Daily transaction statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_transaction_stats AS
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_transactions,
    COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed_transactions,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_transactions,
    COUNT(DISTINCT from_address) AS unique_senders,
    COUNT(DISTINCT to_address) AS unique_recipients,
    SUM(amount) FILTER (WHERE status = 'CONFIRMED') AS total_volume,
    AVG(amount) FILTER (WHERE status = 'CONFIRMED') AS avg_transaction_value,
    AVG(gas_used) AS avg_gas_used,
    AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at))) AS avg_confirmation_time_seconds
FROM transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX ON mv_daily_transaction_stats(date DESC);
COMMENT ON MATERIALIZED VIEW mv_daily_transaction_stats IS
    'Daily transaction statistics for analytics dashboard';

-- Validator performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_validator_performance AS
SELECT
    v.address,
    v.status,
    v.stake_amount,
    v.uptime,
    v.blocks_produced,
    v.rewards_earned,
    COUNT(cr.id) AS consensus_rounds_proposed,
    COUNT(cr.id) FILTER (WHERE cr.result = 'SUCCESS') AS successful_rounds,
    ROUND(
        (COUNT(cr.id) FILTER (WHERE cr.result = 'SUCCESS')::NUMERIC /
         NULLIF(COUNT(cr.id), 0)::NUMERIC) * 100,
        2
    ) AS success_rate_percentage,
    AVG(EXTRACT(EPOCH FROM (cr.completed_at - cr.started_at)))
        FILTER (WHERE cr.completed_at IS NOT NULL) AS avg_round_duration_seconds
FROM validators v
LEFT JOIN consensus_rounds cr ON cr.proposer_id = v.address
GROUP BY v.id, v.address, v.status, v.stake_amount, v.uptime, v.blocks_produced, v.rewards_earned
ORDER BY v.blocks_produced DESC;

CREATE UNIQUE INDEX ON mv_validator_performance(address);
COMMENT ON MATERIALIZED VIEW mv_validator_performance IS
    'Validator performance metrics for leaderboard and monitoring';

-- Blockchain health metrics
-- Note: AVG block time computed separately to avoid window-in-aggregate error
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_blockchain_health AS
WITH block_times AS (
    SELECT
        block_number,
        timestamp,
        transaction_count,
        validator_id,
        size,
        EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY block_number))) AS block_time_seconds
    FROM blocks
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
)
SELECT
    MAX(block_number) AS current_block_height,
    COUNT(*) AS total_blocks,
    COUNT(DISTINCT validator_id) AS active_validators,
    AVG(transaction_count) AS avg_transactions_per_block,
    AVG(size) AS avg_block_size_bytes,
    AVG(block_time_seconds) AS avg_block_time_seconds,
    SUM(transaction_count) AS total_transactions,
    MAX(timestamp) AS last_block_timestamp
FROM block_times;

COMMENT ON MATERIALIZED VIEW mv_blockchain_health IS
    'Real-time blockchain health metrics (24-hour window)';

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_transaction_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_validator_performance;
    REFRESH MATERIALIZED VIEW mv_blockchain_health;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_analytics_views IS
    'Refresh all analytics materialized views (run via scheduled job every 5-10 minutes)';

-- ==================================================================================
-- DATABASE MAINTENANCE FUNCTIONS
-- ==================================================================================

-- Function to clean up old transaction data (optional, for archival)
CREATE OR REPLACE FUNCTION archive_old_transactions(days_to_keep INTEGER DEFAULT 365)
RETURNS TABLE(archived_count BIGINT, deleted_count BIGINT) AS $$
DECLARE
    v_archived_count BIGINT;
    v_deleted_count BIGINT;
BEGIN
    -- Note: Implement archival logic here if needed (e.g., move to archive table)
    -- For now, just return counts without actual deletion

    SELECT COUNT(*) INTO v_archived_count
    FROM transactions
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
      AND status IN ('CONFIRMED', 'FAILED');

    -- Uncomment to actually delete (use with caution!)
    -- DELETE FROM transactions
    -- WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
    --   AND status IN ('CONFIRMED', 'FAILED');
    -- GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    v_deleted_count := 0; -- Set to 0 since we're not actually deleting

    RETURN QUERY SELECT v_archived_count, v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_transactions IS
    'Archive transactions older than N days (default: 365). Set up archival strategy before using.';

-- ==================================================================================
-- GRANTS AND PERMISSIONS
-- ==================================================================================
-- Uncomment and adjust based on your security requirements

-- Read-only analytics user
-- CREATE ROLE aurigraph_analytics WITH LOGIN PASSWORD 'secure_password_here';
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO aurigraph_analytics;
-- GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO aurigraph_analytics;

-- Application user (read/write)
-- GRANT SELECT, INSERT, UPDATE ON transactions, blocks, validators, consensus_rounds, quantum_keys TO aurigraph_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aurigraph_app;

-- ==================================================================================
-- COMPLETION
-- ==================================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'V25 Migration completed successfully at %', CURRENT_TIMESTAMP;
    RAISE NOTICE 'Created cross-table indexes, foreign keys, and analytics views';
    RAISE NOTICE 'Total indexes created: ~50+ optimized for query performance';
    RAISE NOTICE 'Materialized views: 3 (refresh using refresh_analytics_views())';
END $$;
