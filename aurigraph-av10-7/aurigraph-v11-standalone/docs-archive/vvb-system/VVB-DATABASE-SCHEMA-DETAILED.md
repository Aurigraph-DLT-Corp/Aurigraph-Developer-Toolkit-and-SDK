# VVB Database Schema - Detailed Specification
## Story AV11-601-05: Virtual Validator Board Multi-Signature Approval System

**Version**: 1.0
**Sprint**: Dec 24-29, 2025
**Status**: Architecture Planning
**Last Updated**: December 23, 2025

---

## 1. SCHEMA OVERVIEW

The VVB system requires **4 core tables** plus **5 integration tables** to implement the multi-signature approval workflow:

```
Core VVB Tables:
├─ vvb_validators (voter registry)
├─ vvb_approval_rules (rules engine)
├─ vvb_approvals (vote ledger)
└─ vvb_timeline (audit trail)

Integration Tables (from prior stories):
├─ token_versions (Story 4 - versioning data)
├─ token_registry (Stories 2-3 - token state)
├─ secondary_token_registry (Story 3 - hierarchy)
└─ primary_token_registry (Story 2 - asset tokens)
```

---

## 2. COMPLETE SQL SCHEMA

### 2.1 VVB Validators Table

```sql
-- Table: vvb_validators
-- Purpose: Registry of authorized approval voters
-- Rows: 4-10 (typically small governance group)
-- Access Pattern: By role (97%), by name (3%)
-- Updates: Infrequent (add/remove validators ~1/month)
-- Archival: Never (maintain history)

CREATE TABLE IF NOT EXISTS vvb_validators (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(255) UNIQUE NOT NULL,
    -- Examples: John_Smith, Alice_Johnson, Bob_Admin, Carol_SuperAdmin
    -- Used for audit trail and logs

    email VARCHAR(255),
    -- Contact information (nullable if using Keycloak)

    -- Authorization
    role VARCHAR(50) NOT NULL DEFAULT 'VVB_VALIDATOR',
    -- Values: 'VVB_VALIDATOR' (standard approver)
    --         'VVB_ADMIN' (elevated/critical approver)

    approval_authority VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    -- Values: 'STANDARD' (for STANDARD approvals)
    --         'ELEVATED' (for ELEVATED approvals)
    --         'CRITICAL' (for CRITICAL approvals)
    -- CHECK: VVB_VALIDATOR -> STANDARD only
    --        VVB_ADMIN -> ELEVATED or CRITICAL

    -- Integration
    keycloak_id VARCHAR(255),
    -- Foreign key to Keycloak/IAM user ID
    -- For future OAuth2 integration

    keycloak_realm VARCHAR(100) DEFAULT 'AWD',
    -- Keycloak realm: AWD, AurCarbonTrace, AurHydroPulse

    -- Status & Timestamps
    active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Inactive validators cannot approve new operations

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_role_authority CHECK (
        (role = 'VVB_VALIDATOR' AND approval_authority = 'STANDARD') OR
        (role = 'VVB_ADMIN' AND approval_authority IN ('ELEVATED', 'CRITICAL'))
    ),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        OR email IS NULL),
    CONSTRAINT valid_role CHECK (role IN ('VVB_VALIDATOR', 'VVB_ADMIN')),
    CONSTRAINT valid_authority CHECK (
        approval_authority IN ('STANDARD', 'ELEVATED', 'CRITICAL')
    )
);

-- Indexes for hot queries
CREATE INDEX idx_vvb_validators_name ON vvb_validators(name);
-- Used by: "SELECT FROM vvb_validators WHERE name = ?"
-- Expected: <1ms (unique index on name)

CREATE INDEX idx_vvb_validators_role ON vvb_validators(role);
-- Used by: "SELECT FROM vvb_validators WHERE role = ? AND active = TRUE"
-- Expected: <2ms (low cardinality index)

CREATE INDEX idx_vvb_validators_role_active ON vvb_validators(role, active);
-- Used by: Get active validators by role
-- Expected: <2ms (composite index on 2 columns)

CREATE INDEX idx_vvb_validators_keycloak_id ON vvb_validators(keycloak_id)
WHERE keycloak_id IS NOT NULL;
-- Used by: IAM integration lookups
-- Expected: <1ms (partial index, sparse data)

-- Sample Data
INSERT INTO vvb_validators (name, email, role, approval_authority, keycloak_id, active)
VALUES
    ('John_Smith', 'john@aurigraph.io', 'VVB_VALIDATOR', 'STANDARD', 'kc-john-123', TRUE),
    ('Alice_Johnson', 'alice@aurigraph.io', 'VVB_VALIDATOR', 'STANDARD', 'kc-alice-456', TRUE),
    ('Bob_Admin', 'bob@aurigraph.io', 'VVB_ADMIN', 'ELEVATED', 'kc-bob-789', TRUE),
    ('Carol_SuperAdmin', 'carol@aurigraph.io', 'VVB_ADMIN', 'CRITICAL', 'kc-carol-101', TRUE)
ON CONFLICT (name) DO NOTHING;
```

### 2.2 Approval Rules Table

```sql
-- Table: vvb_approval_rules
-- Purpose: Rules engine for determining approval requirements
-- Rows: 5-20 (one per change type)
-- Access Pattern: By change_type (99%), by approval_type (1%)
-- Updates: Moderate (add new rules ~1/sprint)
-- Archival: Keep history (change management)

CREATE TABLE IF NOT EXISTS vvb_approval_rules (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Rule Identity
    change_type VARCHAR(100) UNIQUE NOT NULL,
    -- Examples: 'SECONDARY_TOKEN_CREATE',
    --           'SECONDARY_TOKEN_RETIRE',
    --           'SECONDARY_TOKEN_SUSPEND',
    --           'PRIMARY_TOKEN_RETIRE',
    --           'PRIMARY_TOKEN_BURN'

    -- Approval Configuration
    requires_vvb BOOLEAN NOT NULL DEFAULT TRUE,
    -- Whether VVB approval is required

    role_required VARCHAR(50) NOT NULL DEFAULT 'VVB_VALIDATOR',
    -- Minimum role required
    -- Values: 'VVB_VALIDATOR' (anyone can approve)
    --         'VVB_ADMIN' (only admins)

    approval_type VARCHAR(50) NOT NULL,
    -- Values: 'STANDARD' (1 VVB_VALIDATOR required)
    --         'ELEVATED' (1 VVB_ADMIN + 1 VVB_VALIDATOR)
    --         'CRITICAL' (2 VVB_ADMIN + 1 VVB_VALIDATOR)

    timeout_days INTEGER NOT NULL DEFAULT 7 CHECK (timeout_days >= 1),
    -- Time limit for approval decision

    cascade_on_rejection BOOLEAN NOT NULL DEFAULT TRUE,
    -- If approved parent is rejected, reject dependent tokens

    max_parallel_approvals INTEGER DEFAULT 100,
    -- Limit concurrent approvals of this type

    -- Documentation
    description TEXT,
    -- Human-readable description of rule

    metadata JSONB,
    -- Flexible metadata for future extensions
    -- Examples: {"escalation_contacts": [...], "notification_channel": "slack"}

    -- Status
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_approval_type CHECK (
        approval_type IN ('STANDARD', 'ELEVATED', 'CRITICAL')
    ),
    CONSTRAINT valid_role CHECK (
        role_required IN ('VVB_VALIDATOR', 'VVB_ADMIN')
    ),
    CONSTRAINT valid_role_approval_match CHECK (
        (approval_type = 'STANDARD' AND role_required = 'VVB_VALIDATOR') OR
        (approval_type = 'ELEVATED' AND role_required = 'VVB_ADMIN') OR
        (approval_type = 'CRITICAL' AND role_required = 'VVB_ADMIN')
    )
);

-- Indexes
CREATE INDEX idx_vvb_approval_rules_change_type ON vvb_approval_rules(change_type);
-- Used by: "SELECT FROM vvb_approval_rules WHERE change_type = ?"
-- Expected: <1ms (unique index)

CREATE INDEX idx_vvb_approval_rules_approval_type ON vvb_approval_rules(approval_type);
-- Used by: Statistical queries
-- Expected: <2ms (low cardinality)

-- Sample Data
INSERT INTO vvb_approval_rules (change_type, requires_vvb, role_required, approval_type, description)
VALUES
    ('SECONDARY_TOKEN_CREATE', TRUE, 'VVB_VALIDATOR', 'STANDARD', 'Create new secondary token'),
    ('SECONDARY_TOKEN_RETIRE', TRUE, 'VVB_ADMIN', 'ELEVATED', 'Retire existing secondary token'),
    ('SECONDARY_TOKEN_SUSPEND', TRUE, 'VVB_ADMIN', 'ELEVATED', 'Suspend secondary token'),
    ('PRIMARY_TOKEN_RETIRE', TRUE, 'VVB_ADMIN', 'CRITICAL', 'Retire primary asset token')
ON CONFLICT (change_type) DO NOTHING;
```

### 2.3 Approvals Table (Vote Ledger)

```sql
-- Table: vvb_approvals
-- Purpose: Immutable vote ledger (one vote per approver per version)
-- Rows: ~1,000/day (high volume)
-- Access Pattern: By version_id (95%), by approver_id (3%), by decision (2%)
-- Updates: Insert only (immutable ledger)
-- Archival: Archive after 2 years

CREATE TABLE IF NOT EXISTS vvb_approvals (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    version_id UUID NOT NULL,
    -- References token_versions.version_id
    -- Links approval to token version under review

    approver_id VARCHAR(255) NOT NULL,
    -- References vvb_validators.name
    -- NOT a UUID to allow lookup by name in logs

    -- Vote Data
    decision VARCHAR(50) NOT NULL,
    -- Values: 'APPROVED' (vote yes)
    --         'REJECTED' (vote no)
    --         'ABSTAIN' (vote abstain/skip)

    reason TEXT,
    -- Optional justification, required for REJECTED

    comments TEXT,
    -- Additional comments from approver

    -- Security
    signature BYTEA,
    -- Cryptographic signature of vote (future)
    -- For blockchain verification

    ip_address INET,
    -- IP address of approver (audit trail)

    user_agent TEXT,
    -- Browser user agent (audit trail)

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- When vote was cast (UTC)

    -- Constraints
    CONSTRAINT unique_vote UNIQUE(version_id, approver_id),
    -- One vote per approver per version
    -- Re-voting not allowed (prevents vote manipulation)

    CONSTRAINT valid_decision CHECK (
        decision IN ('APPROVED', 'REJECTED', 'ABSTAIN')
    ),

    CONSTRAINT required_reason_for_rejection CHECK (
        (decision = 'REJECTED' AND reason IS NOT NULL) OR
        (decision != 'REJECTED')
    ),

    -- Foreign Keys
    FOREIGN KEY (approver_id) REFERENCES vvb_validators(name) ON DELETE RESTRICT,
    FOREIGN KEY (version_id) REFERENCES token_versions(version_id) ON DELETE CASCADE

    -- NOTE: version_id.status determines if vote is counted
    -- Votes on EXPIRED/TIMEOUT versions are not counted
);

-- Indexes for hot queries (critical path)
CREATE INDEX idx_vvb_approvals_version_id ON vvb_approvals(version_id);
-- Used by: "SELECT * FROM vvb_approvals WHERE version_id = ?"
-- Purpose: Count approvals for consensus check
-- Expected: <5ms (high cardinality, frequently accessed)

CREATE INDEX idx_vvb_approvals_version_decision ON vvb_approvals(version_id, decision);
-- Used by: "SELECT COUNT(*) FROM vvb_approvals WHERE version_id = ? AND decision = 'APPROVED'"
-- Purpose: Quorum calculation
-- Expected: <3ms (composite index, most selective)

CREATE INDEX idx_vvb_approvals_approver_id ON vvb_approvals(approver_id);
-- Used by: "SELECT * FROM vvb_approvals WHERE approver_id = ? ORDER BY created_at DESC"
-- Purpose: Get approver's voting history
-- Expected: <10ms (moderate cardinality)

CREATE INDEX idx_vvb_approvals_created_at ON vvb_approvals(created_at);
-- Used by: Time-based queries, statistics
-- Expected: <5ms (chronological scans)

CREATE INDEX idx_vvb_approvals_decision ON vvb_approvals(decision);
-- Used by: Statistical analysis
-- Expected: <5ms (very low cardinality, 3 values)

CREATE INDEX idx_vvb_approvals_version_approver ON vvb_approvals(version_id, approver_id);
-- Used by: Idempotency check before inserting vote
-- Expected: <1ms (unique constraint index)

-- Performance: Composite index for common query
CREATE INDEX idx_vvb_approvals_version_decision_created
ON vvb_approvals(version_id, decision, created_at DESC);
-- Used by: Get all votes for version, ordered by time
-- Expected: <5ms (optimal for quorum + timeline)
```

### 2.4 Timeline (Audit Trail) Table

```sql
-- Table: vvb_timeline
-- Purpose: Immutable event log for compliance and debugging
-- Rows: ~5,000/day (very high volume)
-- Access Pattern: By version_id (90%), by event_type (8%), by actor_id (2%)
-- Updates: Insert only (immutable audit trail)
-- Archival: Archive after 7 years (legal requirement)

CREATE TABLE IF NOT EXISTS vvb_timeline (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    version_id UUID NOT NULL,
    -- References token_versions.version_id

    -- Event Data
    event_type VARCHAR(100) NOT NULL,
    -- Values: 'SUBMITTED' (initial submission)
    --         'APPROVED' (individual approval recorded)
    --         'REJECTED' (individual rejection recorded)
    --         'CONSENSUS_REACHED' (quorum achieved)
    --         'CASCADE_REJECT' (child tokens rejected)
    --         'TIMEOUT' (7-day timeout triggered)
    --         'REACTIVATED' (approval reset)
    --         'MANUALLY_REJECTED' (admin override)

    actor_id VARCHAR(255),
    -- Who triggered event (approver_id or 'SYSTEM')
    -- NULL if system-generated

    -- Event Details
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- When event occurred (UTC)
    -- Separate from created_at for event time

    details JSONB,
    -- Flexible event metadata
    -- Examples:
    -- {"approval_type": "CRITICAL", "required_count": 3, "received_count": 3}
    -- {"reason": "Compliance check failed"}
    -- {"affected_tokens": ["secondary-001", "secondary-002"]}
    -- {"timeout_days": 7, "deadline": "2025-01-22T10:00:00Z"}

    severity VARCHAR(20) DEFAULT 'INFO',
    -- Values: 'INFO' (normal operation)
    --         'WARN' (timeout approaching)
    --         'ERROR' (rejection or failure)
    --         'CRITICAL' (security incident)

    -- Status & Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- When logged to database

    -- Constraints
    CONSTRAINT valid_event_type CHECK (
        event_type IN (
            'SUBMITTED', 'APPROVED', 'REJECTED', 'ABSTAIN',
            'CONSENSUS_REACHED', 'CASCADE_REJECT', 'TIMEOUT',
            'REACTIVATED', 'MANUALLY_REJECTED', 'ESCALATION_SENT'
        )
    ),

    CONSTRAINT valid_severity CHECK (
        severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')
    ),

    -- Foreign Keys
    FOREIGN KEY (version_id) REFERENCES token_versions(version_id) ON DELETE CASCADE
);

-- Indexes for audit trail queries
CREATE INDEX idx_vvb_timeline_version_id ON vvb_timeline(version_id);
-- Used by: "SELECT * FROM vvb_timeline WHERE version_id = ? ORDER BY event_timestamp DESC"
-- Purpose: Get full audit trail for a version
-- Expected: <10ms (high cardinality)

CREATE INDEX idx_vvb_timeline_event_type ON vvb_timeline(event_type);
-- Used by: Statistical queries, analysis
-- Expected: <10ms (low cardinality)

CREATE INDEX idx_vvb_timeline_event_timestamp ON vvb_timeline(event_timestamp);
-- Used by: Time-range queries, compliance reports
-- Expected: <10ms (chronological scans)

CREATE INDEX idx_vvb_timeline_actor_id ON vvb_timeline(actor_id);
-- Used by: "SELECT * FROM vvb_timeline WHERE actor_id = ?" (user audit trail)
-- Expected: <20ms (moderate cardinality)

CREATE INDEX idx_vvb_timeline_severity ON vvb_timeline(severity);
-- Used by: Alert filtering
-- Expected: <10ms (very low cardinality)

-- Composite index for common pattern
CREATE INDEX idx_vvb_timeline_version_timestamp
ON vvb_timeline(version_id, event_timestamp DESC);
-- Used by: Get timeline in reverse order
-- Expected: <5ms (optimal for audit retrieval)

-- Composite index for actor + time (user audit trail)
CREATE INDEX idx_vvb_timeline_actor_timestamp
ON vvb_timeline(actor_id, event_timestamp DESC);
-- Used by: Get actions by approver over time
-- Expected: <10ms
```

### 2.5 Integration with token_versions Table

```sql
-- Modification to existing token_versions table
-- Add columns for VVB tracking

ALTER TABLE token_versions ADD COLUMN IF NOT EXISTS (
    vvb_status VARCHAR(50) DEFAULT 'NOT_REQUIRED',
    -- Values: 'NOT_REQUIRED', 'PENDING_VVB', 'APPROVED', 'REJECTED', 'TIMEOUT'
    -- Mirrors approval status for quick lookup

    approval_type VARCHAR(50),
    -- Denormalized from vvb_approval_rules for performance
    -- Values: 'STANDARD', 'ELEVATED', 'CRITICAL'

    vvb_required_count INTEGER DEFAULT 0,
    -- Number of approvals required (depends on type)
    -- STANDARD=1, ELEVATED=2, CRITICAL=3

    vvb_approved_count INTEGER DEFAULT 0,
    -- Number of approvals received so far

    vvb_rejected_count INTEGER DEFAULT 0,
    -- Number of rejections received

    vvb_deadline TIMESTAMP,
    -- When approval expires (created_at + timeout_days)

    last_approver_id VARCHAR(255),
    -- Most recent approver (for notifications)

    approval_metadata JSONB
    -- Flexible metadata
    -- {"consensus_reached": true, "reached_at": "2025-01-15T..."}
);

-- Index for approval status queries
CREATE INDEX idx_token_versions_vvb_status ON token_versions(vvb_status);
-- Used by: "SELECT * FROM token_versions WHERE vvb_status = 'PENDING_VVB'"
-- Expected: <10ms

CREATE INDEX idx_token_versions_vvb_deadline ON token_versions(vvb_deadline);
-- Used by: Timeout scheduler
-- Expected: <10ms

CREATE INDEX idx_token_versions_approval_type ON token_versions(approval_type);
-- Used by: Get pending by type
-- Expected: <10ms
```

---

## 3. PERFORMANCE ANALYSIS

### 3.1 Query Performance Targets

| Query | Expected Time | Index | Notes |
|-------|---|---|---|
| Get approval count for version | <5ms | `idx_vvb_approvals_version_decision` | Critical path |
| Get pending approvals | <20ms | `idx_vvb_approvals_version_id` | Hot query |
| Get active validators by role | <2ms | `idx_vvb_validators_role_active` | Cache frequently |
| Get approval rule by change_type | <1ms | `idx_vvb_approval_rules_change_type` | Cache 24h |
| Get audit trail for version | <10ms | `idx_vvb_timeline_version_timestamp` | Read-heavy |
| Check vote existence | <1ms | UNIQUE constraint | Idempotency |
| Get approver's voting history | <10ms | `idx_vvb_approvals_approver_id` | Moderate load |
| Timeout scan | <50ms | `idx_token_versions_vvb_deadline` | Scheduled task |

### 3.2 Caching Strategy

```
CACHE LAYERS:
═════════════════════════════════════════════════════════════════

1. In-Memory Caches (Quarkus CacheControl)
   ├─ vvb_validators (TTL: 1 hour)
   │  └─ Invalidate on INSERT/UPDATE
   │  └─ Expected miss rate: <1%
   │
   ├─ vvb_approval_rules (TTL: 24 hours)
   │  └─ Invalidate on INSERT/UPDATE
   │  └─ Expected miss rate: <0.1%
   │
   └─ approval_statistics (TTL: 1 hour)
       └─ Invalidate nightly
       └─ Expected miss rate: <5%

2. Database Query Cache (PostgreSQL)
   ├─ Query plan caching
   ├─ Result set caching (future)
   └─ Expected improvement: 10-20% faster

3. Application-Level Caching
   ├─ Quorum calculation cache (5 minute TTL)
   │  └─ By version_id
   │  └─ Invalidate on new approval
   └─ Expected hit rate: >90%
```

### 3.3 Connection Pool Tuning

```properties
# application.properties for optimal performance

quarkus.datasource.max-size=20
# Maximum concurrent connections

quarkus.datasource.min-size=5
# Maintain minimum idle connections

quarkus.datasource.acquisition-timeout=3s
# Connection acquisition timeout

quarkus.datasource.idle-removal-interval=15m
# Idle connection cleanup

quarkus.datasource.leak-detection-interval=1m
# Connection leak detection

# For high concurrency (>500 req/s):
quarkus.datasource.max-size=50
quarkus.datasource.min-size=10
```

---

## 4. DATABASE MIGRATION STRATEGY (Flyway)

### 4.1 Migration Files

```
V31__create_vvb_validators.sql
├─ Creates vvb_validators table
├─ Creates 4 indexes
├─ Inserts 4 sample validators
└─ Execution time: <500ms

V32__create_vvb_approval_rules.sql
├─ Creates vvb_approval_rules table
├─ Creates 2 indexes
├─ Inserts 4 approval rules
└─ Execution time: <500ms

V33__create_vvb_approvals_timeline.sql
├─ Creates vvb_approvals table
├─ Creates vvb_timeline table
├─ Creates 7 indexes
├─ Creates foreign keys
└─ Execution time: <1s

V34__add_vvb_columns_to_token_versions.sql
├─ Adds 8 columns to existing token_versions
├─ Creates 3 indexes
├─ Sets default values
├─ Execution time: <2s (may require brief lock)
```

### 4.2 Migration Execution Order

```
Prerequisite: Stories 2-4 schemas must exist
├─ primary_token_registry (Story 2)
├─ secondary_token_registry (Story 3)
├─ token_versions (Story 4)
└─ token_registry (Story 2-3)

Execution:
1. V31 → vvb_validators created
2. V32 → vvb_approval_rules created
3. V33 → vvb_approvals + vvb_timeline created
4. V34 → token_versions enhanced

Rollback Strategy:
├─ Drop vvb_* tables in reverse order
├─ Remove columns from token_versions
└─ Restore to pre-V31 state
```

### 4.3 Migration Safety Checks

```sql
-- Before each migration, verify prerequisites

-- Check V31 (before executing)
SELECT COUNT(*) FROM vvb_validators;
-- Expected: 0 (table doesn't exist yet)

-- Check V32 (before executing)
SELECT COUNT(*) FROM vvb_approval_rules;
-- Expected: 0 (table doesn't exist yet)

-- Check V33 (before executing)
SELECT COUNT(*) FROM vvb_approvals;
-- Expected: 0 (table doesn't exist yet)

-- Check V34 (before executing)
SELECT column_name FROM information_schema.columns
WHERE table_name='token_versions' AND column_name='vvb_status';
-- Expected: NULL (column doesn't exist yet)
```

---

## 5. BACKUP & RECOVERY PROCEDURES

### 5.1 Backup Strategy

```
DAILY BACKUPS:
├─ Time: 02:00 UTC (off-peak)
├─ Type: Physical backup (pg_basebackup)
├─ Retention: 7 days
├─ Location: AWS S3 encrypted
└─ RTO: <1 hour

WEEKLY BACKUPS:
├─ Time: Sunday 03:00 UTC
├─ Type: Logical backup (pg_dump)
├─ Retention: 4 weeks
├─ Location: S3 + archive storage
└─ RTO: <4 hours

MONTHLY BACKUPS:
├─ Time: First Sunday 04:00 UTC
├─ Type: Full backup + verification
├─ Retention: 1 year
├─ Location: Off-site storage (Glacier)
└─ RTO: <24 hours
```

### 5.2 Recovery Procedures

```
SCENARIO 1: Data Corruption
├─ Restore from daily backup
├─ Apply transaction logs from failure point
├─ Verify vvb_timeline consistency
└─ Expected time: 30-60 minutes

SCENARIO 2: Accidental Data Deletion
├─ Restore from weekly logical backup
├─ Replay vvb_timeline from deletion point
├─ Verify approval state consistency
└─ Expected time: 1-4 hours

SCENARIO 3: Complete Database Loss
├─ Restore from monthly backup
├─ Replay all transaction logs
├─ Verify all constraints
├─ Run consistency checks
└─ Expected time: 4-24 hours

VERIFICATION AFTER RECOVERY:
├─ SELECT COUNT(*) FROM vvb_approvals; -- Should match backup count
├─ Check vvb_timeline completeness
├─ Verify foreign key integrity
├─ Run data consistency tests
└─ Confirm with business team
```

### 5.3 Point-in-Time Recovery (PITR)

```sql
-- Recover data to specific timestamp
-- PostgreSQL supports PITR with transaction logs

-- Example: Recover to Jan 15, 2025 10:00:00 UTC
-- 1. Stop application servers
-- 2. Restore base backup
-- 3. Apply transaction logs until target time
-- 4. Restart PostgreSQL
-- 5. Verify recovery
-- 6. Start application servers

-- Timeline can be reconstructed from vvb_timeline table:
SELECT * FROM vvb_timeline
WHERE event_timestamp >= '2025-01-15T10:00:00Z'
ORDER BY event_timestamp;
```

---

## 6. DATA CONSISTENCY & INTEGRITY

### 6.1 Constraints & Validation

```sql
-- VVB System Invariants (must never be violated)

-- 1. Approval Ledger Immutability
ALTER TABLE vvb_approvals ADD CONSTRAINT check_immutable
AFTER INSERT: Cannot modify/delete existing approvals

-- 2. Unique Voting
CONSTRAINT unique_vote UNIQUE(version_id, approver_id)
Prevents same approver voting twice on same version

-- 3. Role-Authority Mapping
vvb_validators:
CONSTRAINT valid_role_authority CHECK (...)
Ensures role and authority are aligned

-- 4. Approval Type Requirements
vvb_approval_rules:
CONSTRAINT valid_role_approval_match CHECK (...)
Ensures rule uses appropriate approval type for role

-- 5. Timeline Completeness
vvb_timeline.details must be valid JSON
Event types must match predefined set

-- 6. Version-Approval Link
Foreign key: vvb_approvals.version_id → token_versions.version_id
Ensures no orphaned approvals

-- 7. Validator-Approval Link
Foreign key: vvb_approvals.approver_id → vvb_validators.name
Ensures approver exists
```

### 6.2 Consistency Checks (Maintenance)

```sql
-- Run daily to verify data integrity

-- Check 1: No orphaned approvals
SELECT COUNT(*) FROM vvb_approvals a
WHERE NOT EXISTS (
    SELECT 1 FROM token_versions tv WHERE tv.version_id = a.version_id
);
-- Expected: 0

-- Check 2: No invalid approvers
SELECT COUNT(*) FROM vvb_approvals a
WHERE NOT EXISTS (
    SELECT 1 FROM vvb_validators v WHERE v.name = a.approver_id
);
-- Expected: 0

-- Check 3: Approval counts match reality
SELECT version_id,
    SUM(CASE WHEN decision='APPROVED' THEN 1 ELSE 0 END) AS approved_count,
    COUNT(*) AS total_votes
FROM vvb_approvals
GROUP BY version_id
HAVING approved_count != (
    SELECT vvb_approved_count FROM token_versions
    WHERE version_id = vvb_approvals.version_id
);
-- Expected: 0 rows (all counts match)

-- Check 4: Timeline continuity
SELECT version_id, COUNT(*)
FROM vvb_timeline
GROUP BY version_id
ORDER BY COUNT(*) DESC;
-- Expected: All versions have logical event sequences

-- Check 5: Validator consistency
SELECT v.id FROM vvb_validators v
WHERE NOT EXISTS (
    SELECT 1 FROM vvb_timeline WHERE actor_id = v.name
)
AND v.active = TRUE;
-- Expected: Some inactive validators (ok)
```

---

## 7. PERFORMANCE BENCHMARKS

### 7.1 Single-Operation Performance

```
Approval Flow:
├─ Submit for validation
│  ├─ Rule lookup: <1ms (indexed)
│  ├─ Insert version: <5ms
│  ├─ Fire CDI event: <2ms
│  └─ Total: <10ms
│
├─ Record approval vote
│  ├─ Validate approver: <1ms (indexed)
│  ├─ Check authority: <1ms (in-memory)
│  ├─ Insert approval: <3ms
│  ├─ Check consensus: <2ms (quorum calc)
│  ├─ Update token_versions: <2ms
│  ├─ Log to timeline: <1ms
│  └─ Fire CDI event: <1ms
│  └─ Total: <15ms (typical), <50ms (worst case)
│
├─ Get approval details
│  ├─ Fetch version: <1ms
│  ├─ Fetch approvals: <5ms (indexed)
│  ├─ Fetch timeline: <5ms
│  └─ Total: <15ms
│
└─ Rejection with cascade
   ├─ Record rejection: <5ms
   ├─ Find child tokens: <10ms
   ├─ Batch reject children: <50ms (100 children)
   ├─ Log cascades: <20ms
   └─ Total: <100ms (at scale)
```

### 7.2 Concurrent Load Performance

```
Expected throughput:
├─ Approvals/second: 100 (typical), 500 (peak)
├─ Concurrent users: 50 (typical), 200 (peak)
├─ Database connections: 10 (typical), 30 (peak)
├─ Memory per approval: ~2KB
├─ Total memory overhead: <100MB for 50K pending approvals

Under load (500 req/s):
├─ Approval latency: <100ms (p99)
├─ Database CPU: <30%
├─ Memory: <500MB
└─ Network: <50Mbps
```

### 7.3 Timeout Scan Performance

```
Scheduler runs every 6 hours:
├─ Query: SELECT * FROM token_versions WHERE vvb_deadline < NOW()
├─ Expected rows: 50-100 (out of 100K+)
├─ Query time: <100ms (with index on vvb_deadline)
├─ Processing time: <500ms (update all found rows)
├─ Fire events: <1s (50-100 events)
└─ Total: <2s (non-blocking, low impact)
```

---

## 8. DATA RETENTION & ARCHIVAL

### 8.1 Retention Policy

```
Table: vvb_validators
├─ Live: Indefinitely (small table, no archival)
└─ Backup: Full history

Table: vvb_approval_rules
├─ Live: Indefinitely (small table, versioning via updates)
└─ Backup: Full history

Table: vvb_approvals
├─ Live: 2 years (hot data)
├─ Archive: 2-7 years (cold storage)
├─ Deletion: After 7 years (legal hold expired)
└─ Estimated rows: ~365,000/year (1,000/day * 365)

Table: vvb_timeline
├─ Live: 2 years (hot audit trail)
├─ Archive: 2-7 years (cold audit storage)
├─ Deletion: After 7 years (legal requirement)
└─ Estimated rows: ~1,825,000/year (5,000/day * 365)
```

### 8.2 Archival Process

```sql
-- Run monthly to archive old data

-- Archive vvb_approvals older than 2 years
INSERT INTO vvb_approvals_archive
SELECT * FROM vvb_approvals
WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM vvb_approvals
WHERE created_at < NOW() - INTERVAL '2 years';

VACUUM ANALYZE vvb_approvals;

-- Archive vvb_timeline older than 2 years
INSERT INTO vvb_timeline_archive
SELECT * FROM vvb_timeline
WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM vvb_timeline
WHERE created_at < NOW() - INTERVAL '2 years';

VACUUM ANALYZE vvb_timeline;
```

---

## 9. MONITORING & MAINTENANCE

### 9.1 Health Checks

```sql
-- Run hourly via Prometheus

-- Check 1: VVB table sizes
SELECT
    'vvb_approvals' AS table_name,
    pg_size_pretty(pg_total_relation_size('vvb_approvals')) AS size
UNION ALL
SELECT
    'vvb_timeline' AS table_name,
    pg_size_pretty(pg_total_relation_size('vvb_timeline')) AS size;

-- Check 2: Index fragmentation
SELECT
    indexname,
    ROUND(100.0 * (pg_relation_size(idx) - pg_relation_size(idx, 'main')) /
        pg_relation_size(idx), 2) AS bloat_ratio
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_vvb%';
-- If bloat_ratio > 30%, run: REINDEX INDEX CONCURRENTLY idx_name;

-- Check 3: Pending approvals count
SELECT COUNT(*) AS pending_approvals
FROM token_versions
WHERE vvb_status = 'PENDING_VVB';
-- Alert if > 100 (unusual)

-- Check 4: Approval timeout candidates
SELECT COUNT(*) AS near_timeout
FROM token_versions
WHERE vvb_status = 'PENDING_VVB'
AND vvb_deadline < NOW() + INTERVAL '1 day';
-- Alert if > 10 (may need escalation)
```

### 9.2 Maintenance Windows

```
WEEKLY (Sunday 01:00-02:00 UTC):
├─ Run VACUUM ANALYZE on all VVB tables
├─ Reindex fragmented indexes (bloat >20%)
└─ Check constraint violations

MONTHLY (First Sunday 04:00-05:00 UTC):
├─ Run CLUSTER on frequently accessed tables
├─ Update table statistics (ANALYZE)
├─ Archive data older than 2 years
├─ Run full backup verification
└─ Review slow query log

QUARTERLY:
├─ Performance regression testing
├─ Capacity planning analysis
├─ Archive media verification
└─ Disaster recovery drill
```

---

## 10. RELATED DOCUMENTATION

- `VVB-ARCHITECTURE-FINAL-DESIGN.md` - Complete system architecture
- `VVB-API-SPECIFICATION-COMPLETE.md` - API endpoints and contracts
- `VVB-IMPLEMENTATION-CRITICAL-PATH.md` - Implementation timeline
- `COMPREHENSIVE-TEST-PLAN-V12.md` - Database testing strategy

---

**Schema Version**: 1.0
**Database**: PostgreSQL 16+
**Migrations**: V31-V34
**Last Updated**: December 23, 2025
