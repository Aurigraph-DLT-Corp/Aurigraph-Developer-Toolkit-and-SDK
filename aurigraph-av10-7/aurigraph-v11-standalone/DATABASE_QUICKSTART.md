# Aurigraph V12 Database Quick Start Guide

## Overview
This guide will help you set up and verify the Aurigraph V12 database schema using Flyway migrations.

**Created**: 2025-12-16
**Database**: PostgreSQL 13+
**Migration Tool**: Flyway
**Total Migrations**: 7 files (V20-V26)

---

## Prerequisites

### 1. Install PostgreSQL
```bash
# macOS (using Homebrew)
brew install postgresql@13
brew services start postgresql@13

# Ubuntu/Debian
sudo apt-get install postgresql-13

# Verify installation
psql --version
```

### 2. Create Database
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE aurigraph_production;
CREATE USER aurigraph WITH PASSWORD 'aurigraph-prod-secure-2025';
GRANT ALL PRIVILEGES ON DATABASE aurigraph_production TO aurigraph;

# Exit psql
\q
```

### 3. Verify Java and Maven
```bash
# Check Java version (requires 21+)
java -version

# Check Maven
mvn --version
```

---

## Quick Start (3 Steps)

### Step 1: Configure Database Connection
Edit `src/main/resources/application.properties`:

```properties
# Database Configuration
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph
quarkus.datasource.password=aurigraph-prod-secure-2025
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph_production

# Flyway Configuration
quarkus.flyway.migrate-at-start=true
quarkus.flyway.baseline-on-migrate=true
quarkus.flyway.repair-at-start=true
quarkus.flyway.validate-on-migrate=false
```

### Step 2: Run Migrations
```bash
# Navigate to project directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Option A: Run via Quarkus Dev Mode (migrations run automatically)
./mvnw quarkus:dev

# Option B: Run migrations only
./mvnw flyway:migrate

# Option C: Run via production JAR
./mvnw clean package
java -jar target/quarkus-app/quarkus-run.jar
```

### Step 3: Verify Schema
```bash
# Connect to database
psql -U aurigraph -d aurigraph_production

# Run verification script
\i verify-database-schema.sql

# Or manually check tables
\dt

# Check Flyway history
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank DESC;

# Exit psql
\q
```

---

## Migration Files

| Version | File | Description | Lines |
|---------|------|-------------|-------|
| V20 | `V20__create_transactions.sql` | Core transaction table | 88 |
| V21 | `V21__create_blocks.sql` | Blockchain blocks | 73 |
| V22 | `V22__create_validators.sql` | Validator information | 103 |
| V23 | `V23__create_consensus_rounds.sql` | Consensus history | 142 |
| V24 | `V24__create_quantum_keys.sql` | Quantum key management | 207 |
| V25 | `V25__add_indexes.sql` | Indexes & relationships | 328 |
| V26 | `V26__insert_sample_data.sql` | Sample data (optional) | 355 |
| **Total** | - | - | **1,296** |

---

## What Gets Created

### Tables (5)
1. **`transactions`** - Blockchain transactions with quantum signatures
2. **`blocks`** - Blocks produced via HyperRAFT++ consensus
3. **`validators`** - Validator nodes and performance metrics
4. **`consensus_rounds`** - Consensus round history and voting
5. **`quantum_keys`** - Quantum-resistant key lifecycle management

### Indexes (70+)
- Primary indexes for fast lookups
- Composite indexes for join optimization
- Partial indexes for specific use cases
- Covering indexes to avoid table lookups
- GIN indexes for JSONB queries

### Materialized Views (3)
1. **`mv_daily_transaction_stats`** - Daily transaction analytics
2. **`mv_validator_performance`** - Validator metrics and leaderboard
3. **`mv_blockchain_health`** - Real-time blockchain health (24h window)

### Functions (5)
1. **`update_validators_updated_at()`** - Auto-update timestamp trigger
2. **`update_expired_quantum_keys()`** - Mark expired keys
3. **`consensus_round_duration()`** - Calculate round duration
4. **`refresh_analytics_views()`** - Refresh materialized views
5. **`archive_old_transactions()`** - Archive old data

### Views (3)
1. **`active_consensus_rounds`** - In-progress rounds with metrics
2. **`quantum_keys_rotation_required`** - Keys expiring within 30 days
3. **`quantum_keys_rotation_chains`** - Recursive key rotation history

---

## Sample Data (Optional)

If you want to test with sample data, V26 migration is automatically applied:

**Sample Data Includes**:
- 5 validators (3 active, 1 inactive, 1 jailed)
- 4 blocks (including genesis block)
- 4 transactions (2 confirmed, 1 pending, 1 failed)
- 4 consensus rounds (2 finalized, 1 voting, 1 failed)
- 5 quantum keys (3 active, 1 expired, 1 revoked)

**To Skip Sample Data**:
Delete or rename `V26__insert_sample_data.sql` before running migrations.

---

## Verification Checklist

After running migrations, verify:

- [ ] 5 tables created (`\dt` in psql)
- [ ] 70+ indexes created (check verification script section 3)
- [ ] 3 materialized views created (`\dm` in psql)
- [ ] 5 functions created (check verification script section 6)
- [ ] 3 views created (`\dv` in psql)
- [ ] Flyway history shows V20-V26 as successful
- [ ] Sample data loaded (if V26 was run)

**Quick Verification Command**:
```bash
psql -U aurigraph -d aurigraph_production -f verify-database-schema.sql | less
```

---

## Common Operations

### 1. Query Active Validators
```sql
SELECT address, stake_amount, uptime, blocks_produced, rewards_earned
FROM validators
WHERE status = 'ACTIVE'
ORDER BY blocks_produced DESC
LIMIT 10;
```

### 2. Query Recent Blocks
```sql
SELECT block_number, hash, validator_id, timestamp, transaction_count
FROM blocks
ORDER BY block_number DESC
LIMIT 20;
```

### 3. Query Transaction History
```sql
SELECT transaction_id, from_address, to_address, amount, status, created_at
FROM transactions
WHERE from_address = '0x...'
ORDER BY created_at DESC;
```

### 4. Monitor Active Consensus Rounds
```sql
SELECT * FROM active_consensus_rounds;
```

### 5. Check Keys Requiring Rotation
```sql
SELECT * FROM quantum_keys_rotation_required
ORDER BY days_until_expiry ASC;
```

### 6. Refresh Analytics Views
```sql
SELECT refresh_analytics_views();
```

### 7. View Daily Statistics
```sql
SELECT * FROM mv_daily_transaction_stats
ORDER BY date DESC
LIMIT 7;
```

---

## Maintenance Tasks

### Daily Tasks
```sql
-- Mark expired quantum keys
SELECT update_expired_quantum_keys();

-- Check for failed consensus rounds
SELECT * FROM consensus_rounds
WHERE result = 'FAILED'
  AND started_at >= CURRENT_DATE
ORDER BY started_at DESC;
```

### Weekly Tasks
```sql
-- Refresh analytics views (or run via cron every 5-10 minutes)
SELECT refresh_analytics_views();

-- Update database statistics
ANALYZE transactions;
ANALYZE blocks;
ANALYZE validators;
ANALYZE consensus_rounds;
ANALYZE quantum_keys;
```

### Monthly Tasks
```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Review index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Troubleshooting

### Issue 1: Migration Fails with "relation already exists"
```bash
# Check Flyway status
./mvnw flyway:info

# Repair Flyway metadata
./mvnw flyway:repair

# Retry migration
./mvnw flyway:migrate
```

### Issue 2: Connection Refused
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (macOS)
brew services start postgresql@13

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

### Issue 3: Authentication Failed
```bash
# Check PostgreSQL auth config
cat /etc/postgresql/13/main/pg_hba.conf  # Linux
cat /usr/local/var/postgresql@13/pg_hba.conf  # macOS

# Ensure this line exists for local connections:
# host    all    all    127.0.0.1/32    md5

# Restart PostgreSQL after changes
sudo systemctl restart postgresql  # Linux
brew services restart postgresql@13  # macOS
```

### Issue 4: Slow Queries
```sql
-- Enable query logging
ALTER DATABASE aurigraph_production SET log_statement = 'all';
ALTER DATABASE aurigraph_production SET log_min_duration_statement = 1000;

-- View slow queries (in PostgreSQL logs)
-- Check indexes are being used
EXPLAIN ANALYZE SELECT * FROM transactions WHERE from_address = '0x...';
```

---

## Advanced Configuration

### Enable Foreign Keys (Production)
After initial data load, enable referential integrity:

```sql
-- Edit V25__add_indexes.sql and uncomment foreign key constraints
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_block
    FOREIGN KEY (block_hash) REFERENCES blocks(hash) ON DELETE SET NULL;

ALTER TABLE blocks ADD CONSTRAINT fk_blocks_validator
    FOREIGN KEY (validator_id) REFERENCES validators(address) ON DELETE RESTRICT;

ALTER TABLE consensus_rounds ADD CONSTRAINT fk_consensus_rounds_proposer
    FOREIGN KEY (proposer_id) REFERENCES validators(address) ON DELETE RESTRICT;

ALTER TABLE consensus_rounds ADD CONSTRAINT fk_consensus_rounds_block
    FOREIGN KEY (block_hash) REFERENCES blocks(hash) ON DELETE SET NULL;

ALTER TABLE quantum_keys ADD CONSTRAINT fk_quantum_keys_owner
    FOREIGN KEY (owner_address) REFERENCES validators(address) ON DELETE SET NULL;
```

### Setup Scheduled Jobs (Cron)
```bash
# Edit crontab
crontab -e

# Add scheduled maintenance tasks
# Refresh analytics every 5 minutes
*/5 * * * * psql -U aurigraph -d aurigraph_production -c "SELECT refresh_analytics_views();"

# Mark expired keys daily at 2 AM
0 2 * * * psql -U aurigraph -d aurigraph_production -c "SELECT update_expired_quantum_keys();"

# Analyze tables weekly on Sunday at 3 AM
0 3 * * 0 psql -U aurigraph -d aurigraph_production -c "ANALYZE;"
```

### Connection Pool Tuning
Edit `application.properties`:

```properties
# Connection Pool (for high-load production)
quarkus.datasource.jdbc.max-size=50
quarkus.datasource.jdbc.min-size=10
quarkus.datasource.jdbc.acquisition-timeout=10
quarkus.datasource.jdbc.background-validation-interval=2M
quarkus.datasource.jdbc.max-lifetime=PT30M
```

---

## Performance Testing

### Insert Test Data
```sql
-- Test transaction inserts (10K records)
INSERT INTO transactions (transaction_id, hash, from_address, to_address, amount, status, gas_price)
SELECT
    '0x' || md5(random()::text),
    '0x' || md5(random()::text),
    '0x' || md5(random()::text),
    '0x' || md5(random()::text),
    (random() * 1000000000000000000)::NUMERIC,
    'CONFIRMED',
    50000000000
FROM generate_series(1, 10000);
```

### Query Performance Test
```sql
-- Test query performance with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE from_address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'
  AND status = 'CONFIRMED'
ORDER BY created_at DESC
LIMIT 100;

-- Expected: <5ms with index usage
```

---

## Resources

- **Full Documentation**: `DATABASE_SCHEMA_V12.md`
- **Verification Script**: `verify-database-schema.sql`
- **Migration Files**: `src/main/resources/db/migration/V20__*.sql` through `V26__*.sql`
- **Application Config**: `src/main/resources/application.properties`

---

## Support

For issues or questions:
1. Check verification script output
2. Review Flyway migration history
3. Check PostgreSQL logs
4. Consult `DATABASE_SCHEMA_V12.md` for detailed documentation

**Agent**: J4C Database Agent
**Version**: V12.0.0
**Status**: Production Ready ✅

---

**End of Quick Start Guide**
