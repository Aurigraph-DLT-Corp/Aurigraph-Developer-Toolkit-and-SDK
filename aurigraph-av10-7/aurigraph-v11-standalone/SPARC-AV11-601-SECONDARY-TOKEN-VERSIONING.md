# SPARC Framework: Secondary Token Versioning with VVB Integration
## AV11-601 Implementation Strategy

**Date**: December 23, 2025
**Status**: Planning Phase
**Target Completion**: 8 weeks (4 sprints of 2 weeks each)

---

## SITUATION

### Current State
The Aurigraph V12 platform currently supports secondary tokens with basic lifecycle management:
- **Single instance per type**: One income stream token, one collateral token, one royalty token per primary token
- **Static lifecycle**: CREATED → ACTIVE → REDEEMED/EXPIRED
- **Limited audit capability**: No comprehensive change tracking
- **No versioning**: Changes to tokens are direct state transitions without version history

### Business Requirements
Real-world assets require **multi-occurrence secondary tokens**:
1. **Ownership Documents**: Multiple owners over time (inheritance, marriage, divorce, business transfers)
2. **Tax Receipts**: Different years, cumulative changes, amendment workflows
3. **Property Photos**: Multiple dates, damage documentation, condition changes
4. **Regulatory Compliance**: Each change must be validated and auditable for regulatory bodies

### Current Gap
- **Single-instance limitation**: Cannot represent multiple years of tax data or ownership chains
- **No audit trail**: Cannot prove who changed what, when, why
- **No versioning**: Modifications are destructive (no history preservation)
- **No VVB integration for secondary**: Only primary tokens have VVB validation

### Market Context
- Regulatory requirements (GDPR, SOX, tax law) mandate immutable audit trails
- Real-world asset tokenization requires version chains (ownership → possession → condition)
- Compliance frameworks demand "right to audit" capabilities

---

## PROBLEM

### Core Challenge
**How to extend secondary tokens to support multiple versions of the same type while maintaining cryptographic integrity, regulatory compliance, and performance targets?**

### Sub-Problems

#### 1. Multi-Occurrence Storage Problem
- **Issue**: Current database schema assumes one secondary token per type per parent
- **Impact**: Cannot store multiple tax receipts for different years
- **Constraint**: Must maintain O(1) lookup for "active" version while supporting history queries
- **Solution Approach**: Version-based indexing with (parentTokenId, tokenType, versionNumber)

#### 2. VVB Integration Problem
- **Issue**: Secondary token changes currently bypass VVB validation
- **Impact**: No guarantee that replacements are legitimate (e.g., ownership transfer without proper authorization)
- **Constraint**: VVB process must not block non-critical updates (photos) but must block critical ones (ownership)
- **Solution Approach**: Tiered validation (critical vs. informational)

#### 3. Audit Trail Problem
- **Issue**: No immutable record of who changed what
- **Impact**: Non-compliant with regulatory audit requirements
- **Constraint**: Audit trail must be append-only (no deletions, immutable timestamps)
- **Solution Approach**: Separate audit database with cryptographic hashing

#### 4. Version Chain Integrity Problem
- **Issue**: How to prove v1 was properly replaced by v2, and v2 by v3?
- **Impact**: Cannot prove continuity of ownership/compliance
- **Constraint**: Merkle proofs must chain across versions
- **Solution Approach**: Hierarchical Merkle chains (v1 → v2 → v3 with parent hash references)

#### 5. Performance Problem
- **Issue**: Versioning + VVB + audit trail could degrade performance
- **Impact**: System cannot meet <100ms creation target if all processes are synchronous
- **Constraint**: <50ms for VVB validation, <10ms for audit logging
- **Solution Approach**: Async processing with reactive streams (Mutiny Uni)

#### 6. Backward Compatibility Problem
- **Issue**: Existing primary/secondary/composite tokens use current schema
- **Impact**: Schema migration could break existing workflows
- **Constraint**: Must support legacy tokens during transition period
- **Solution Approach**: Version-aware queries with fallback logic

---

## ACTION

### Implementation Strategy

#### Phase 1: Core Infrastructure (Sprint 1-2, 14 days)

**Step 1: Domain Model Extension**
- Create `SecondaryTokenVersion` entity representing each version
- Each version is immutable once created
- Version chain: v1 → v2 → v3 (linked by parentSecondaryTokenId)
- State machine: CREATED → ACTIVE → REPLACED → ARCHIVED

**Step 2: Versioning Service**
- `SecondaryTokenVersioningService` manages version chains
- Create new version: stores content, assigns version number
- Replace version: create new version, update active pointer, trigger audit
- Query version chain: retrieve all versions sorted by version number

**Step 3: Database Schema**
```sql
-- New table for versions
CREATE TABLE secondary_token_versions (
    id UUID PRIMARY KEY,
    secondary_token_id UUID NOT NULL,  -- Parent secondary token
    version_number INT NOT NULL,
    content JSONB,                     -- Token content (flexible)
    status VARCHAR(50),                -- CREATED, ACTIVE, REPLACED, ARCHIVED
    created_by VARCHAR(255),
    created_at TIMESTAMP,
    replaced_by UUID,                  -- Reference to replacing version
    merkle_hash VARCHAR(64),
    vvb_status VARCHAR(50),            -- PENDING, APPROVED, REJECTED
    vvb_result_hash VARCHAR(64),

    UNIQUE (secondary_token_id, version_number),
    INDEX (secondary_token_id, status),
    INDEX (status, created_at)
);
```

---

#### Phase 2: VVB Integration (Sprint 2-3, 14 days)

**Step 4: VVB Validation for Secondary Tokens**
- Integrate with `VVBVerificationService` (already exists for primary tokens)
- Classification of changes:
  - **Critical** (requires VVB approval): Ownership changes, authorization updates
  - **Informational** (logged but not blocking): Photo updates, status notes
  - **Metadata** (background validation): Tax receipt updates, document references

**Step 5: Version Transition Workflow**
```
User creates new version
    ↓
Version stored with status=CREATED
    ↓
If CRITICAL: Trigger async VVB validation
    ├─ VVB Approved → Update status=ACTIVE, create audit event
    └─ VVB Rejected → Update status=REJECTED, notify user, create audit event

If INFORMATIONAL: Immediately set status=ACTIVE, create audit event
```

**Step 6: Merkle Chain Updates**
- Hash each version: `H(versionId | versionNumber | content | previousHash)`
- Chain hashes: new version hash includes previous version hash
- Proof generation: `proof(v2) = [v2Hash, v1Hash, merkleRoot(primary)]`
- Verification: Validate entire chain in <100ms

---

#### Phase 3: Audit Trail System (Sprint 3, 10 days)

**Step 7: Immutable Audit Trail**
```sql
CREATE TABLE secondary_token_audit_trail (
    id UUID PRIMARY KEY,
    secondary_token_id UUID NOT NULL,
    version_id UUID NOT NULL,
    event_type VARCHAR(50),           -- CREATED, ACTIVATED, REPLACED, REJECTED, ARCHIVED
    actor VARCHAR(255),               -- Who made the change
    timestamp TIMESTAMP NOT NULL,
    from_state VARCHAR(50),           -- Previous state
    to_state VARCHAR(50),             -- New state
    reason TEXT,                      -- Why (required for REJECTED)
    metadata JSONB,                   -- Additional context
    hash VARCHAR(64),                 -- Event integrity hash

    INDEX (secondary_token_id),
    INDEX (version_id),
    INDEX (timestamp),
    INDEX (actor)
);
```

**Step 8: Audit Service Capabilities**
- Append-only logging: Every version change creates one or more audit events
- Event types: CREATED, ACTIVATED, REPLACED, REJECTED, ARCHIVED, VVB_APPROVED, VVB_REJECTED
- Query capabilities: By token, by date range, by actor, by event type
- Replay: Reconstruct full state at any point in time

**Step 9: Compliance Features**
- Retention policies: PERMANENT, 7_YEARS (EU), 5_YEARS (GDPR), 3_YEARS (standard)
- Archival: Move old events to cold storage, keep hot index for recent events
- Export: PDF (compliance report), CSV (data analysis), JSON (integration)

---

#### Phase 4: REST API & Integration (Sprint 4, 10 days)

**Step 10: Versioning REST API**
```
Endpoints:
POST   /api/v12/secondary-tokens/{tokenId}/versions
GET    /api/v12/secondary-tokens/{tokenId}/versions
GET    /api/v12/secondary-tokens/{tokenId}/versions/{versionId}
POST   /api/v12/secondary-tokens/{tokenId}/versions/{versionId}/replace
GET    /api/v12/secondary-tokens/{tokenId}/audit-trail
```

**Step 11: Enhanced Registry Queries**
- `lookupByTypeAndVersion(parentTokenId, type, versionNumber)` → specific version
- `getVersionChain(parentTokenId, type)` → all versions of one type
- `getActiveVersion(parentTokenId, type)` → current active version
- `getVersionHistory(parentTokenId, type, startDate, endDate)` → time-range query

**Step 12: Cross-Component Integration**
- PrimaryToken: Cannot retire if active secondary versions exist → moved to Story 4
- CompositeToken: Version propagation from secondary → composite
- Merkle system: Full chain validation including all secondary versions

---

#### Phase 5: Testing & Deployment (Sprint 4, 7 days)

**Step 13: E2E Test Scenarios**
- 20 comprehensive workflows covering:
  - Multi-owner succession (v1→v2→v3)
  - Multi-year tax receipts
  - Photo versioning
  - VVB approval/rejection cycles
  - Concurrent updates
  - Audit trail verification

**Step 14: Performance Validation**
- < 100ms: Bulk create 1000 versions
- < 50ms: VVB validation
- < 10ms: Audit logging
- < 50ms: Query 100-version chain

**Step 15: Documentation & Handoff**
- Architecture guides
- API documentation (OpenAPI)
- Operational runbooks
- Release notes

---

### Detailed Action Plan by Sprint

#### Sprint 1: Infrastructure Foundation (Days 1-10)
**Goal**: Establish versioning core + database schema

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Domain model design | SecondaryTokenVersion entity (250 LOC) |
| 2-3 | Database schema & migration | SQL scripts, Liquibase changesets |
| 3-4 | SecondaryTokenVersioningService | Version CRUD, chain management (400 LOC) |
| 4-5 | Version state machine | State transitions, validation (200 LOC) |
| 5-6 | Registry index updates | New lookups + performance optimization |
| 6-7 | Unit tests | 50 tests, 80% coverage |
| 7-8 | Integration & review | Code review, merge to main |
| 8-10 | Documentation | Architecture guide, API specs |

**Sprint Velocity**: 35 SP

---

#### Sprint 2: VVB Integration (Days 11-20)
**Goal**: Full VVB validation + Merkle chain updates

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | VVBVersionValidator | Integration with VVBVerificationService (300 LOC) |
| 2-3 | VersionTransitionWorkflow | Approval/rejection handling (250 LOC) |
| 3-4 | Merkle chain updates | Hash chaining, proof generation (250 LOC) |
| 4-5 | Rejection handling | Rollback, notifications (150 LOC) |
| 5-6 | Async processing setup | Reactive streams with Mutiny |
| 6-7 | Integration tests | 60 tests, 85% coverage |
| 7-8 | Performance tuning | Profile, optimize hot paths |
| 8-10 | Documentation | VVB workflow diagrams, API updates |

**Sprint Velocity**: 10 SP

---

#### Sprint 3: Audit Trail + API (Days 21-30)
**Goal**: Immutable audit system + REST API

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | AuditTrailEvent entity | Schema + Panache entity (200 LOC) |
| 2-3 | AuditTrailService | Logging, query, replay (300 LOC) |
| 3-4 | Query capabilities | Time-range, actor, event-type filtering |
| 4-5 | SecondaryTokenVersionResource | 12 REST endpoints (400 LOC) |
| 5-6 | Request/Response DTOs | 6 DTOs (500 LOC) |
| 6-7 | Unit + integration tests | 120 tests, 80% coverage |
| 7-8 | Compliance features | Retention, export, archival |
| 8-10 | API documentation | OpenAPI spec, Swagger UI |

**Sprint Velocity**: 21 SP

---

#### Sprint 4: E2E + Release (Days 31-42)
**Goal**: Full system validation + production readiness

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-3 | E2E test scenarios | 20 comprehensive workflows (800 LOC tests) |
| 3-4 | Performance benchmarks | Load testing, optimization |
| 4-5 | Cross-component integration | Primary, Composite, Merkle system |
| 5-6 | Bug fixes | Regression, edge case fixes |
| 6-7 | Documentation | Runbooks, migration guide |
| 7 | Release preparation | Build, release notes, deployment plan |

**Sprint Velocity**: 8 SP

---

## RESULT

### Immediate Outcomes (Week 8)

1. **Fully Functional Secondary Token Versioning**
   - Support multiple secondary tokens of the same type
   - Version chains with full history
   - 200+ tests passing, 85%+ code coverage

2. **VVB-Integrated Workflow**
   - All secondary token changes validated by VVB
   - Approval/rejection handling
   - Async processing with < 50ms target

3. **Immutable Audit Trail**
   - Every change logged with actor, timestamp, reason
   - Compliance reporting (GDPR, SOX, tax)
   - Time-range query and replay capabilities

4. **REST API for Versioning**
   - 12 endpoints covering all operations
   - OpenAPI documentation
   - Request/response validation

5. **Performance Targets Met**
   - < 100ms: Create 1000 versions
   - < 50ms: VVB validation
   - < 10ms: Audit logging

### Measurable Deliverables

| Metric | Target | Method |
|--------|--------|--------|
| Test Coverage | 85%+ | Code coverage reports |
| API Availability | 99.9% | Synthetic monitoring |
| Audit Trail Integrity | 100% | Cryptographic verification |
| Performance (p99) | <100ms version creation | Benchmarking suite |
| VVB Success Rate | 95%+ | Test scenarios |
| Regulatory Compliance | Full | Audit trail export verification |

---

## CONSEQUENCE

### Long-term Impact

#### Positive Outcomes

1. **Regulatory Compliance**
   - GDPR-compliant audit trails for personal data
   - SOX-compliant for financial records
   - Tax authority ready (multiple years support)
   - HIPAA-compatible (immutable health records)

2. **Business Expansion**
   - Support for multi-year asset management (real estate, vehicles, IP)
   - Succession planning (ownership transfers)
   - Compliance-first product offering
   - New use cases: tax receipts, insurance claims, health records

3. **Technical Excellence**
   - Reusable versioning pattern for other token types
   - VVB integration best practices
   - Audit trail framework (applicable to primary tokens)
   - Performance optimization knowledge

4. **Market Differentiation**
   - Only blockchain platform with versioned secondary tokens
   - Audit-trail-first approach (vs. competitors)
   - Regulatory-first design philosophy
   - Trust & transparency story for institutions

#### Risk Mitigation

1. **Data Integrity Risks**
   - Cryptographic hashing of audit events
   - Merkle tree verification across versions
   - Immutable database constraints
   - **Mitigation**: 100% verification coverage

2. **Performance Risks**
   - Async processing separates logging from API response
   - Caching strategies for version chains
   - Index optimization for queries
   - **Mitigation**: <100ms targets with performance tests

3. **Regulatory Risks**
   - Audit trail proves compliance
   - Retention policies configurable
   - Export capabilities for audits
   - **Mitigation**: Pre-emptive compliance design

---

## IMPLEMENTATION ROADMAP

```
Week 1-2:   Core Infrastructure (versioning, database)
            ↓
Week 3-4:   VVB Integration (validation, workflows)
            ↓
Week 5:     Audit Trail (immutable logging, queries)
            ↓
Week 6-7:   REST API (endpoints, DTOs, integration)
            ↓
Week 8:     E2E Testing & Release
            ↓
PRODUCTION: Secondary Token Versioning v1.0 Ready
```

---

## SUCCESS CRITERIA

**Technical**:
- [ ] All 200+ tests passing
- [ ] Code coverage 85%+
- [ ] Performance targets met (<100ms, <50ms, <10ms)
- [ ] Zero critical bugs in E2E testing
- [ ] Regulatory audit trail fully functional

**Business**:
- [ ] Can support 3+ years of tax receipts
- [ ] Ownership succession workflows operational
- [ ] Compliance reporting available
- [ ] Documentation ready for customer deployment

**Operational**:
- [ ] Database migrations tested
- [ ] Rollback procedures documented
- [ ] Monitoring/alerting configured
- [ ] Support documentation complete

---

## DECISION GATES

| Gate | Timing | Criteria | Owner |
|------|--------|----------|-------|
| **Gate 1**: Core Infrastructure | End Sprint 1 | 50 tests passing, schema validated | Tech Lead |
| **Gate 2**: VVB Integration | End Sprint 2 | 60 tests passing, <50ms target met | Arch Lead |
| **Gate 3**: Audit Trail | End Sprint 3 | 120 tests passing, compliance verified | QA Lead |
| **Gate 4**: Production Ready | End Sprint 4 | E2E passing, documentation complete | PM |

