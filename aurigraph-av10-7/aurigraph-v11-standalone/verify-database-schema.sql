-- ==================================================================================
-- Aurigraph V12 Database Schema Verification Script
-- ==================================================================================
-- Description: Verify database schema after migration
-- Usage: psql -U aurigraph -d aurigraph_production -f verify-database-schema.sql
-- Created: 2025-12-16
-- ==================================================================================

\echo '======================================================================'
\echo 'Aurigraph V12 Database Schema Verification'
\echo '======================================================================'
\echo ''

-- Check Flyway migration history
\echo '1. FLYWAY MIGRATION HISTORY'
\echo '---------------------------------------------------------------------'
SELECT
    installed_rank,
    version,
    description,
    type,
    script,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history
WHERE version IN ('20', '21', '22', '23', '24', '25', '26')
ORDER BY installed_rank;

\echo ''
\echo '2. TABLE VERIFICATION'
\echo '---------------------------------------------------------------------'
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('transactions', 'blocks', 'validators', 'consensus_rounds', 'quantum_keys')
ORDER BY table_name;

\echo ''
\echo '3. INDEX VERIFICATION'
\echo '---------------------------------------------------------------------'
SELECT
    schemaname,
    tablename,
    COUNT(*) AS index_count,
    STRING_AGG(indexname, ', ' ORDER BY indexname) AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'blocks', 'validators', 'consensus_rounds', 'quantum_keys')
GROUP BY schemaname, tablename
ORDER BY index_count DESC;

\echo ''
\echo '4. CONSTRAINT VERIFICATION'
\echo '---------------------------------------------------------------------'
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('transactions', 'blocks', 'validators', 'consensus_rounds', 'quantum_keys')
ORDER BY tc.table_name, tc.constraint_type;

\echo ''
\echo '5. MATERIALIZED VIEW VERIFICATION'
\echo '---------------------------------------------------------------------'
SELECT
    schemaname,
    matviewname,
    hasindexes,
    ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname LIKE 'mv_%'
ORDER BY matviewname;

\echo ''
\echo '6. FUNCTION VERIFICATION'
\echo '---------------------------------------------------------------------'
SELECT
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
      'update_validators_updated_at',
      'update_expired_quantum_keys',
      'consensus_round_duration',
      'refresh_analytics_views',
      'archive_old_transactions'
  )
ORDER BY routine_name;

\echo ''
\echo '7. VIEW VERIFICATION'
\echo '---------------------------------------------------------------------'
SELECT
    table_name AS view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
      'active_consensus_rounds',
      'quantum_keys_rotation_required',
      'quantum_keys_rotation_chains'
  )
ORDER BY table_name;

\echo ''
\echo '8. DATA VERIFICATION (if sample data was loaded)'
\echo '---------------------------------------------------------------------'
SELECT 'validators' AS table_name, COUNT(*) AS record_count FROM validators
UNION ALL
SELECT 'blocks', COUNT(*) FROM blocks
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'consensus_rounds', COUNT(*) FROM consensus_rounds
UNION ALL
SELECT 'quantum_keys', COUNT(*) FROM quantum_keys
ORDER BY table_name;

\echo ''
\echo '9. INDEX USAGE STATISTICS (if data exists)'
\echo '---------------------------------------------------------------------'
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'blocks', 'validators', 'consensus_rounds', 'quantum_keys')
ORDER BY idx_scan DESC
LIMIT 20;

\echo ''
\echo '10. TABLE SIZE STATISTICS'
\echo '---------------------------------------------------------------------'
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'blocks', 'validators', 'consensus_rounds', 'quantum_keys')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''
\echo '11. FOREIGN KEY CONSTRAINTS (if enabled)'
\echo '---------------------------------------------------------------------'
SELECT
    tc.constraint_name,
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('transactions', 'blocks', 'validators', 'consensus_rounds', 'quantum_keys')
ORDER BY tc.table_name;

\echo ''
\echo '12. SAMPLE DATA QUERIES (if V26 was run)'
\echo '---------------------------------------------------------------------'
\echo 'Active Validators:'
SELECT address, status, stake_amount, blocks_produced, uptime
FROM validators
WHERE status = 'ACTIVE'
ORDER BY blocks_produced DESC
LIMIT 5;

\echo ''
\echo 'Recent Blocks:'
SELECT block_number, hash, validator_id, timestamp, transaction_count
FROM blocks
ORDER BY block_number DESC
LIMIT 5;

\echo ''
\echo 'Transaction Status Summary:'
SELECT status, COUNT(*) AS count, SUM(amount) AS total_volume
FROM transactions
GROUP BY status
ORDER BY count DESC;

\echo ''
\echo 'Consensus Round Results:'
SELECT result, COUNT(*) AS count
FROM consensus_rounds
WHERE result IS NOT NULL
GROUP BY result
ORDER BY count DESC;

\echo ''
\echo 'Quantum Key Statistics:'
SELECT algorithm, status, COUNT(*) AS count
FROM quantum_keys
GROUP BY algorithm, status
ORDER BY count DESC;

\echo ''
\echo '======================================================================'
\echo 'Verification Complete!'
\echo '======================================================================'
\echo ''
\echo 'Expected Results:'
\echo '  - 5 tables created (transactions, blocks, validators, consensus_rounds, quantum_keys)'
\echo '  - 70+ indexes created across all tables'
\echo '  - 3 materialized views (mv_daily_transaction_stats, mv_validator_performance, mv_blockchain_health)'
\echo '  - 5 functions created (update triggers, analytics refresh, archival)'
\echo '  - 3 views (active_consensus_rounds, quantum_keys_rotation_required, quantum_keys_rotation_chains)'
\echo ''
\echo 'If sample data was loaded (V26):'
\echo '  - 5 validators'
\echo '  - 4 blocks (including genesis)'
\echo '  - 4 transactions'
\echo '  - 4 consensus rounds'
\echo '  - 5 quantum keys'
\echo ''
\echo 'Next Steps:'
\echo '  1. Review migration history (section 1)'
\echo '  2. Verify all tables exist (section 2)'
\echo '  3. Confirm indexes are created (section 3)'
\echo '  4. Check materialized views (section 5)'
\echo '  5. Test queries on sample data (section 12)'
\echo '  6. Enable foreign keys if needed (see V25__add_indexes.sql)'
\echo ''
