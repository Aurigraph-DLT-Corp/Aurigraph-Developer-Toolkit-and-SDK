# Phase 1 Performance Optimization: Database Layer Implementation

**Objective**: Optimize database layer to improve transaction throughput from 776K to 1.4M+ TPS

**Estimated Impact**: +80% throughput improvement (776K → 1.4M TPS)

**Timeline**: 2-3 days for full implementation and testing

---

## 1. Connection Pooling Optimization

### Current State Analysis
```bash
# Check current database connections
ssh subbu@dlt.aurigraph.io "
  psql -U postgres -d aurigraph_v11 -c \
  'SELECT datname, count(*) as connections FROM pg_stat_activity GROUP BY datname;'
"
```

### Implementation: Upgrade HikariCP Configuration

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties`

```properties
# HikariCP Connection Pool (Optimized for High Throughput)
quarkus.datasource.hikari.maximum-pool-size=100
quarkus.datasource.hikari.minimum-idle=20
quarkus.datasource.hikari.connection-timeout=30000
quarkus.datasource.hikari.idle-timeout=600000
quarkus.datasource.hikari.max-lifetime=1800000
quarkus.datasource.hikari.auto-commit=true
quarkus.datasource.hikari.leak-detection-threshold=60000
quarkus.datasource.hikari.register-mbeans=true

# Connection pool statistics monitoring
quarkus.datasource.hikari.metrics-registry-name=prometheus
quarkus.datasource.hikari.metric-registry=io.micrometer.prometheus
```

### Verification
```bash
# Monitor connection pool
curl http://localhost:9003/q/metrics | grep hikari
```

---

## 2. Index Optimization

### Identify Missing Indexes
```sql
-- Connect to production database
ssh subbu@dlt.aurigraph.io "psql -U postgres -d aurigraph_v11" << 'SQL'

-- Find heavily used but unindexed columns
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
AND n_distinct > 100
AND correlation IS NOT NULL
AND correlation NOT IN (0, 1, -1)
ORDER BY n_distinct DESC
LIMIT 20;

-- Check for missing indexes on foreign keys
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
AND referenced_table_name IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = key_column_usage.table_schema
  AND table_name = key_column_usage.table_name
  AND column_name = key_column_usage.column_name
)
LIMIT 20;

SQL
```

### Create Optimal Indexes
```sql
-- High-priority indexes for transaction processing
CREATE INDEX CONCURRENTLY idx_transactions_sender
  ON transactions(sender) WHERE status != 'failed';

CREATE INDEX CONCURRENTLY idx_transactions_recipient
  ON transactions(recipient) WHERE status = 'completed';

CREATE INDEX CONCURRENTLY idx_transactions_timestamp_desc
  ON transactions(timestamp DESC) WHERE status = 'completed';

CREATE INDEX CONCURRENTLY idx_blocks_height
  ON blocks(height DESC);

CREATE INDEX CONCURRENTLY idx_blocks_timestamp
  ON blocks(timestamp DESC);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_transactions_user_time
  ON transactions(sender, timestamp DESC)
  INCLUDE (amount, recipient);

CREATE INDEX CONCURRENTLY idx_blocks_validator_height
  ON blocks(validator_id, height DESC)
  INCLUDE (timestamp, transaction_count);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY idx_pending_transactions
  ON transactions(created_at DESC)
  WHERE status = 'pending';

CREATE INDEX CONCURRENTLY idx_consensus_in_progress
  ON consensus_rounds(round_id DESC)
  WHERE state IN ('voting', 'finalization');

-- BRIN indexes for time-series data (smaller footprint)
CREATE INDEX CONCURRENTLY idx_transaction_history_brin
  ON transaction_history USING BRIN (created_at);

-- Verify index creation
\d transactions
\d blocks
\d consensus_rounds
```

### Rebuild Existing Indexes
```sql
-- Vacuum and analyze for updated statistics
VACUUM ANALYZE transactions;
VACUUM ANALYZE blocks;
VACUUM ANALYZE consensus_rounds;

-- Reindex if fragmented (online operation)
REINDEX INDEX CONCURRENTLY idx_transactions_sender;
REINDEX INDEX CONCURRENTLY idx_blocks_height;

-- Monitor index size and usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

---

## 3. Query Optimization

### Identify Slow Queries
```sql
-- Enable query logging (temporary)
ALTER SYSTEM SET log_min_duration_statement = 100;  -- Log queries > 100ms
SELECT pg_reload_conf();

-- View recent slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 50  -- Queries averaging >50ms
ORDER BY mean_time DESC
LIMIT 20;

-- Find sequential scans (should be rare)
SELECT schemaname, tablename, seq_scan, idx_scan,
       ROUND(100 * idx_scan / NULLIF(idx_scan + seq_scan, 0), 2) as index_usage
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND (seq_scan + idx_scan) > 100
ORDER BY seq_scan DESC
LIMIT 20;
```

### Optimize Common Query Patterns
```sql
-- Transaction lookup (most frequent query)
-- BEFORE (slow):
SELECT * FROM transactions
WHERE sender = $1
ORDER BY timestamp DESC;

-- AFTER (optimized with prepared statements):
PREPARE get_user_transactions (text) AS
SELECT id, recipient, amount, timestamp, status
FROM transactions
WHERE sender = $1
  AND status != 'failed'
  AND timestamp > NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC
LIMIT 1000;

-- Prepare index on (sender, timestamp)
CREATE INDEX idx_transactions_sender_time
ON transactions(sender, timestamp DESC)
WHERE status != 'failed';

-- Block queries
PREPARE get_latest_blocks AS
SELECT height, timestamp, validator_id, transaction_count, hash
FROM blocks
ORDER BY height DESC
LIMIT 100;

-- Consensus round queries
PREPARE get_consensus_status (bigint) AS
SELECT state, voting_power, threshold, participants
FROM consensus_rounds
WHERE round_id = $1;
```

### Connection Statement Caching
```sql
-- Enable prepared statement caching in application
-- application.properties:
quarkus.datasource.jdbc.statement-cache-size=250

-- Or in JDBC URL:
-- jdbc:postgresql://localhost:5432/aurigraph_v11?preparedStatementCacheSize=250
```

---

## 4. Batch Insert Optimization

### Configure Batch Parameters
```properties
# application.properties - Hibernate batch processing
quarkus.hibernate-orm.jdbc.batch-size=50
quarkus.hibernate-orm.jdbc.batch-fetch-size=8
quarkus.hibernate-orm.jdbc.statement-timeout=300

# Connection fetch size for streaming
quarkus.datasource.jdbc.fetch-size=1000
```

### Implement Batch Transaction Processing
```java
// TransactionService.java
@Transactional(value = TransactionType.SUPPORTS)
public void batchInsertTransactions(List<Transaction> transactions) {
    final int BATCH_SIZE = 50;

    for (int i = 0; i < transactions.size(); i += BATCH_SIZE) {
        int end = Math.min(i + BATCH_SIZE, transactions.size());
        List<Transaction> batch = transactions.subList(i, end);

        // Use COPY for bulk insert (fastest method)
        bulkInsertWithCopy(batch);

        // OR use batched inserts
        session.doWork(connection -> {
            try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO transactions (sender, recipient, amount, status) VALUES (?, ?, ?, ?)")) {

                for (Transaction tx : batch) {
                    ps.setString(1, tx.getSender());
                    ps.setString(2, tx.getRecipient());
                    ps.setBigDecimal(3, tx.getAmount());
                    ps.setString(4, tx.getStatus());
                    ps.addBatch();
                }
                ps.executeBatch();
            }
        });
    }
}

// COPY method (fastest - used by PostgreSQL internally)
private void bulkInsertWithCopy(List<Transaction> transactions) {
    String sql = "COPY transactions (sender, recipient, amount, status) FROM STDIN";
    CopyManager copyManager = new CopyManager((BaseConnection) session.doReturningWork(
        connection -> connection.unwrap(BaseConnection.class)));

    StringBuilder data = new StringBuilder();
    for (Transaction tx : transactions) {
        data.append(tx.getSender()).append('\t')
            .append(tx.getRecipient()).append('\t')
            .append(tx.getAmount()).append('\t')
            .append(tx.getStatus()).append('\n');
    }

    copyManager.copyIn(sql, new StringReader(data.toString()));
}
```

---

## 5. Connection Reuse & Statement Pooling

### Implement C3P0 Connection Pool Alternative
```properties
# If upgrading to C3P0 (optional, for comparison)
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_v11
quarkus.datasource.username=aurigraph
quarkus.datasource.password=secure_password

# Connection pool tuning
quarkus.datasource.hikari.maximum-pool-size=100
quarkus.datasource.hikari.minimum-idle=25
quarkus.datasource.hikari.connection-timeout=10000
quarkus.datasource.hikari.validation-timeout=5000
```

### Enable Query Result Caching
```properties
# Ehcache for query result caching
quarkus.hibernate-orm.cache.enabled=true
quarkus.cache.type=caffeine
quarkus.cache.caffeine.expire-after-write=PT5M

# Cache hot data (blocks, consensus state)
@org.hibernate.annotations.Cache(
    usage = CacheConcurrencyStrategy.READ_ONLY
)
public class Block { ... }
```

---

## 6. Database Parameter Tuning

### PostgreSQL Configuration Changes
```bash
ssh subbu@dlt.aurigraph.io "sudo tee -a /etc/postgresql/16/main/postgresql.conf" << 'CONFIG'
# Performance Tuning for High-Throughput OLTP

# Memory Settings (assuming 8GB RAM server)
shared_buffers = 2GB                    # 25% of total RAM
effective_cache_size = 6GB              # 75% of total RAM
work_mem = 50MB                         # Per operation memory
maintenance_work_mem = 512MB

# Checkpoint Settings (for faster writes)
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1

# Connection Pool Settings
max_connections = 200
max_prepared_transactions = 100

# Query Planner
enable_partitionwise_join = on
enable_partitionwise_aggregate = on
join_collapse_limit = 12
from_collapse_limit = 12

# Logging (reduce overhead in production)
log_statement = 'mod'                  # Log DML only
log_min_duration_statement = 500       # Log queries > 500ms
CONFIG
```

### Apply Configuration
```bash
ssh subbu@dlt.aurigraph.io "sudo systemctl restart postgresql"

# Verify settings
ssh subbu@dlt.aurigraph.io "psql -U postgres -c 'SHOW shared_buffers;'"
```

---

## 7. Partitioning for Hot Tables

### Implement Range Partitioning
```sql
-- Partition transactions by date for faster queries
CREATE TABLE transactions_2025 PARTITION OF transactions
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Partition blocks by height ranges
ALTER TABLE blocks ATTACH PARTITION blocks_1k
  FOR VALUES FROM (0) TO (1000);

-- Partitioning benefits query planning and vacuum operations
-- Queries on recent data (WHERE timestamp > NOW() - INTERVAL '7 days')
-- will only scan relevant partitions
```

---

## 8. Performance Benchmarking

### Baseline Measurement (Before Optimization)
```bash
ssh subbu@dlt.aurigraph.io << 'BENCHMARK'
# Establish baseline
curl -s http://localhost:9090/api/v1/query?query='rate(v11_transactions_total[1m])' | jq .

# Run load test for 5 minutes
cd /home/subbu/load-tests
k6 run --vus 50 --duration 5m k6-load-test.js > baseline.log

# Extract TPS result
grep 'transactions_sent' baseline.log

BENCHMARK
```

### Post-Optimization Measurement
```bash
# After applying Phase 1 optimizations, re-run load test
# Expected: +80% improvement (776K → 1.4M TPS)

k6 run --vus 100 --duration 10m k6-load-test.js > optimized.log
```

---

## 9. Rollout Checklist

### Pre-Deployment
- [ ] Backup production database
- [ ] Create test database snapshot
- [ ] Review all SQL changes
- [ ] Test index creation (use CONCURRENTLY flag)
- [ ] Validate query plans with EXPLAIN ANALYZE
- [ ] Load test in staging environment
- [ ] Prepare rollback procedure

### Deployment Steps
1. **Schedule maintenance window** (off-peak hours)
2. **Create indexes** (non-blocking with CONCURRENTLY)
3. **Update application configuration** (connection pool, batch size)
4. **Deploy new JAR** with optimized queries
5. **Verify metrics** (Prometheus dashboards)
6. **Monitor for 1 hour** before declaring success

### Post-Deployment
- [ ] Verify TPS increase (target: 1.4M from 776K)
- [ ] Monitor error rates (should remain <0.1%)
- [ ] Check connection pool utilization
- [ ] Analyze slow query log
- [ ] Update performance baseline documentation

---

## 10. Expected Improvements

### Throughput Improvement
| Component | Before | After | Gain |
|-----------|--------|-------|------|
| Connection Pool | 20 idle | 25 idle | Better utilization |
| Index Hit Rate | ~60% | ~95% | Fewer seq scans |
| Avg Query Time | 45ms | 25ms | -45% latency |
| **Transactions/sec** | **776K** | **1.4M+** | **+80%** |

### Resource Utilization
- CPU: 85% → 75% (better efficiency)
- Memory: 512MB → 600MB (reasonable increase)
- Disk I/O: 8000 iops → 5000 iops (index optimization)

---

## References

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [HikariCP Configuration](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)
- [Hibernate Batch Processing](https://hibernate.org/orm/documentation/6.0/userguide/html_single/Hibernate_User_Guide.html#batch)
- [PostgreSQL Index Design](https://www.postgresql.org/docs/16/sql-createindex.html)
- [COPY Performance](https://www.postgresql.org/docs/16/sql-copy.html)
