# End-to-End Test Plan
## AV11-601: Secondary Token Versioning with VVB Integration

**Document**: E2E Test Execution Plan
**Sprint**: 4 (Week 7-8, February 17 - March 3, 2026)
**Version**: 1.0
**Status**: Ready for Implementation

---

## 1. TEST OVERVIEW

### Purpose
Validate complete secondary token versioning system through comprehensive end-to-end workflows covering:
- Version creation and lifecycle
- VVB approval/rejection workflows
- Audit trail completeness and integrity
- Multi-occurrence token support
- Real-world use case scenarios
- Performance under load

### Scope
- **20 E2E Test Flows** covering 5 use case groups
- **Test Framework**: Quarkus Test (integration testing)
- **HTTP Client**: REST Assured for API calls
- **Database**: Test PostgreSQL with Docker
- **Duration**: 4-6 hours total execution
- **Coverage**: 100% of critical user paths

### Success Criteria
- ✅ All 20 flows pass
- ✅ Average flow time < 2 seconds
- ✅ Zero data integrity issues
- ✅ Audit trail 100% accurate
- ✅ VVB validation working correctly
- ✅ Performance targets achieved

---

## 2. TEST ENVIRONMENT SETUP

### Infrastructure

```yaml
Services:
  - Aurigraph V12 Service: localhost:9003
  - PostgreSQL Database: localhost:5432
  - Test Data Setup: Pre-populated fixture
  - Monitoring: Prometheus + Grafana (optional)

Docker Compose:
  version: '3.8'
  services:
    postgres:
      image: postgres:15
      environment:
        POSTGRES_DB: aurigraph_test
        POSTGRES_USER: testuser
        POSTGRES_PASSWORD: testpass
      ports:
        - "5432:5432"

    aurigraph:
      image: aurigraph:latest
      environment:
        QUARKUS_DATASOURCE_JDBC_URL: jdbc:postgresql://postgres:5432/aurigraph_test
        QUARKUS_HTTP_PORT: 9003
      ports:
        - "9003:9003"
      depends_on:
        - postgres
```

### Test Data Fixtures

**Primary Tokens**:
- ASSET-2025-PROPERTY: Real estate asset
- ASSET-2024-VEHICLE: Vehicle asset
- ASSET-2023-OWNERSHIP: Generic ownership asset

**Secondary Tokens** (Pre-created):
- OWNERSHIP-DOCS (for ownership flow tests)
- TAX-RECEIPTS (for tax documentation flow tests)
- PROPERTY-PHOTOS (for photo versioning flow tests)

### Test User Accounts

```json
{
  "users": [
    {
      "id": "owner1",
      "name": "John Doe",
      "role": "asset_owner"
    },
    {
      "id": "owner2",
      "name": "Jane Smith",
      "role": "asset_owner"
    },
    {
      "id": "vvb_validator",
      "name": "VVB Validator",
      "role": "verifier"
    },
    {
      "id": "admin",
      "name": "System Admin",
      "role": "administrator"
    }
  ]
}
```

---

## 3. TEST FLOWS MATRIX

### Group 1: Ownership Change Flows (5 flows)

#### **Flow 1.1: Simple Ownership Transfer**
**Scenario**: Property owner changes from John Doe to Jane Smith

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary token (property asset) | primaryTokenId = ASSET-PROP-001 | ✓ Created |
| 2 | Create initial ownership token (v1: John Doe) | versionId = OWN-v1, status = ACTIVE | ✓ v1 Active |
| 3 | Request new ownership version (v2: Jane Smith) | versionId = OWN-v2, status = CREATED | ✓ v2 Created |
| 4 | Submit to VVB validation | status = PENDING_VVB | ✓ Awaiting VVB |
| 5 | VVB validator approves | status = APPROVED | ✓ VVB Approved |
| 6 | System transitions v2 to ACTIVE, v1 to REPLACED | v2 = ACTIVE, v1 = REPLACED | ✓ State updated |
| 7 | Retrieve audit trail | Events: CREATED, PENDING_VVB, APPROVED, REPLACED | ✓ 4 events logged |
| 8 | Query active version | Returns v2 (Jane Smith) | ✓ Correct owner |
| 9 | Query version chain | Returns [v1, v2] ordered | ✓ Correct order |

**Assertions**:
- Version numbers sequential (1, 2)
- Status transitions valid
- Timestamps chronological
- Actor recorded (owner1 → owner2)
- VVB hash present and valid
- Merkle proof chain valid

**Expected Duration**: < 2 seconds

**Failure Modes**:
- VVB approval timeout → Retry mechanism
- Concurrent v2 requests → Last-write-wins with conflict log
- Database connection loss → Transactional rollback

---

#### **Flow 1.2: Multiple Ownership Changes (Succession)**
**Scenario**: Property transfers through 3 generations

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-2 | Setup: Create primary, create v1 (Owner A) | Primary + v1 Active | ✓ Baseline |
| 3 | Create v2 (Owner B, inheritance) | v2 Created, v1 Active | ✓ v2 Created |
| 4 | VVB approve v2 | v2 Approved | ✓ VVB OK |
| 5 | Transition to Active | v2 Active, v1 Replaced | ✓ State updated |
| 6 | Create v3 (Owner C, gift) | v3 Created, v2 Active | ✓ v3 Created |
| 7 | VVB approve v3 | v3 Approved | ✓ VVB OK |
| 8 | Transition to Active | v3 Active, v2 Replaced | ✓ State updated |
| 9 | Verify full chain | [v1→REPLACED, v2→REPLACED, v3→ACTIVE] | ✓ Chain valid |
| 10 | Generate compliance report | 3 ownership changes documented | ✓ Report complete |

**Assertions**:
- All 3 versions present
- State transitions correct
- Merkle chain includes all versions
- Audit trail shows all changes with actors
- No orphaned versions

**Expected Duration**: < 3 seconds

---

#### **Flow 1.3: Concurrent Ownership Requests (Race Condition)**
**Scenario**: Two ownership change requests submitted simultaneously

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Initial state: v1 Active (Owner A) | v1 Active | ✓ Baseline |
| 2 | Thread 1: Create v2 (Owner B) | v2-thread1 Created | ✓ v2-t1 created |
| 3 | Thread 2: Create v2 (Owner C) [concurrent] | v2-thread2 Created | ✓ v2-t2 created |
| 4 | Both request VVB validation | Both PENDING_VVB | ✓ Both pending |
| 5 | Thread 1 VVB approves | v2-thread1 Approved | ✓ t1 approved |
| 6 | Thread 1 transitions to Active | v2-t1 Active, v1 Replaced | ✓ t1 active |
| 7 | Thread 2 VVB approves | v2-thread2 Approved | ✓ t2 approved |
| 8 | Thread 2 transition attempt | Rejected (v1 already replaced) | ✓ Conflict handled |
| 9 | Audit trail | Conflict event logged | ✓ Logged |
| 10 | Query active version | v2-t1 (first one) | ✓ Correct winner |

**Assertions**:
- Optimistic locking prevents conflict
- Both attempts recorded in audit
- One clear winner
- System stable after

**Expected Duration**: < 2 seconds

---

#### **Flow 1.4: Ownership Rejection and Retry**
**Scenario**: VVB rejects ownership change, user corrects and retries

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-3 | Setup: v1 Active (Owner A) | v1 Active | ✓ Baseline |
| 4 | Create v2 (Owner B, wrong info) | v2 Created | ✓ v2 created |
| 5 | Submit to VVB | v2 Pending | ✓ Pending |
| 6 | VVB rejects (invalid auth docs) | v2 Rejected, reason logged | ✓ Rejected |
| 7 | Create v2-corrected (new content) | v2-corrected Created | ✓ v2-corrected |
| 8 | Resubmit to VVB | v2-corrected Pending | ✓ Pending |
| 9 | VVB approves | v2-corrected Approved | ✓ Approved |
| 10 | Transition to Active | v2-corrected Active | ✓ Active |
| 11 | Audit trail | Shows: v2 rejected, v2-corrected approved | ✓ Full history |

**Assertions**:
- Rejection reason clear
- Retry doesn't create duplicate
- Audit shows full context
- Final state correct

---

#### **Flow 1.5: Full Audit Trail for Ownership Chain**
**Scenario**: Verify complete audit trail for ownership changes

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Execute Flow 1.2 (3 ownership changes) | 3 versions created | ✓ Complete |
| 2 | Query audit trail for primary token | All events related to ownership | ✓ Events found |
| 3 | Verify event structure | Fields: timestamp, actor, action, from_state, to_state, hash | ✓ All fields |
| 4 | Verify integrity hash | Hash matches computed value | ✓ Integrity OK |
| 5 | Replay state to T0 (initial) | Shows Owner A | ✓ T0 correct |
| 6 | Replay state to T1 (after v2) | Shows Owner B | ✓ T1 correct |
| 7 | Replay state to T2 (after v3) | Shows Owner C | ✓ T2 correct |
| 8 | Generate report (PDF) | Contains all 3 changes, audit trail | ✓ Report OK |
| 9 | Export to CSV | Importable to Excel/analytics | ✓ CSV OK |

**Assertions**:
- Event count = version count × transitions
- All events cryptographically linked
- Replay accuracy: 100%
- Reports complete and accurate

---

### Group 2: Tax Receipt Versioning (4 flows)

#### **Flow 2.1: Multi-Year Tax Receipts**
**Scenario**: Organization maintains tax receipts for years 2020-2025

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary token (Tax Org) | primaryTokenId = TAX-ORG-001 | ✓ Created |
| 2-7 | Create versions for years 2020-2025 | 6 versions created (v1-v6) | ✓ All created |
| 8 | Mark 2023 as active (IRS focus year) | v4 (2023) = Active | ✓ v4 Active |
| 9 | Query all versions | Returns [v1-2020, v2-2021, ..., v6-2025] | ✓ All versions |
| 10 | Query active | Returns 2023 only | ✓ v4 only |
| 11 | Audit trail per year | Each year shows creation timestamp | ✓ Timestamps OK |
| 12 | Generate IRS report (2023) | Contains only v4 data | ✓ v4 report |

**Assertions**:
- All 6 versions present
- Version order = year order
- Active version configurable
- Report generation correct

**Expected Duration**: < 1.5 seconds

---

#### **Flow 2.2: Tax Receipt Amendment**
**Scenario**: Correct error in 2024 tax receipt, create amended version

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-8 | Setup: Create 2020-2025 versions | v1-v6 created, v4 active | ✓ Setup |
| 9 | Create v5-amended (corrected 2024) | New version for 2024 correction | ✓ Created |
| 10 | Mark original v5 as "SUPERSEDED" | v5 status = Superseded | ✓ Marked |
| 11 | Mark v5-amended as active | v5-amended = Active | ✓ Active |
| 12 | Audit trail for 2024 | Shows: original v5, correction timestamp, approval | ✓ Correct |
| 13 | Generate amendment report | Notes correction, links to original | ✓ Report OK |

**Assertions**:
- Amendment clearly documented
- Superseded version preserved
- Audit trail shows correction chain
- Reports can distinguish versions

---

#### **Flow 2.3: Missing Year Backfill**
**Scenario**: Missing 2021 tax data discovered years later, add backfill version

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-8 | Setup: Versions 2020, 2022-2025 (missing 2021) | 5 versions created | ✓ Setup |
| 9 | Insert v2-2021-backfill | Inserted into correct position | ✓ Inserted |
| 10 | Reorder chain | System reorders by year, not creation time | ✓ Reordered |
| 11 | Query versions | Returns [2020, 2021-backfill, 2022, 2023, 2024, 2025] | ✓ Correct order |
| 12 | Audit trail | Shows backfill timestamp years after original years | ✓ Logged |
| 13 | Compliance report | Includes backfill with notation "added YYYY-MM-DD" | ✓ Reported |

**Assertions**:
- Backfill doesn't break chronology
- Can be added out-of-order
- Audit trail shows true timestamps
- Reports handle gaps gracefully

---

#### **Flow 2.4: Compliance Report Generation**
**Scenario**: Generate compliance report covering 6 years of taxes

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-8 | Setup: 6 years of tax data | v1-v6 complete, some amended | ✓ Setup |
| 2 | Generate PDF report | 15-20 page document | ✓ Generated |
| 3 | Verify PDF contains | Covers 2020-2025, amendments noted | ✓ Content OK |
| 4 | Export to CSV | 6 rows (one per year), all fields | ✓ CSV OK |
| 5 | Export to JSON | Structured data, includes metadata | ✓ JSON OK |
| 6 | Verify audit trail attachment | Report includes full audit trail | ✓ Attached |
| 7 | Verify digital signature | PDF/JSON cryptographically signed | ✓ Signed |
| 8 | Test IRS import | CSV importable to IRS systems | ✓ IRS compatible |

**Assertions**:
- All export formats valid
- No data loss in conversion
- Signatures verify
- Format compatibility confirmed

---

### Group 3: Property Photo Management (4 flows)

#### **Flow 3.1: Photo Versioning Over Years**
**Scenario**: Track property condition through photos from 2020-2025

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary token (Property) | Property asset | ✓ Created |
| 2-7 | Create photo versions (one per year) | 6 versions (v1-v6) | ✓ Created |
| 8 | Metadata per version | Year, date, condition_notes | ✓ Metadata OK |
| 9 | Query photos by year | Filter to specific year | ✓ Filtered |
| 10 | Show condition progression | Display all photos in order | ✓ Display OK |
| 11 | Audit trail per photo | Shows upload actor, timestamp | ✓ Logged |

**Expected Duration**: < 1.5 seconds

---

#### **Flow 3.2: Damage Documentation**
**Scenario**: Replace photo when damage is documented

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Initial state: v1 (property good condition) | v1 Active | ✓ Baseline |
| 2 | Create v2 (damage documented) | v2 Created with damage notes | ✓ v2 created |
| 3 | Submit to VVB (insurance verification) | v2 Pending | ✓ Pending |
| 4 | VVB approves (damage verified) | v2 Approved | ✓ Approved |
| 5 | Activate v2 | v2 Active, v1 Replaced | ✓ Active |
| 6 | Query damage history | Shows before (v1) and after (v2) | ✓ Comparison OK |
| 7 | Audit trail | Shows VVB approval for insurance claim | ✓ Logged |

---

#### **Flow 3.3: Batch Photo Update**
**Scenario**: Upload multiple property photos in one operation

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary token (Building complex) | Building token | ✓ Created |
| 2 | Batch create 10 photo versions | All 10 created with version numbers | ✓ Batch OK |
| 3 | Submit all to VVB [async] | All marked Pending | ✓ Pending |
| 4 | VVB processes in parallel | All approved within 50ms | ✓ <50ms |
| 5 | Bulk activate | All transition to Active | ✓ Active |
| 6 | Query all versions | Returns 10 in order | ✓ All returned |
| 7 | Performance metric | Batch < 100ms for 10 photos | ✓ <100ms |

---

#### **Flow 3.4: Photo Archival**
**Scenario**: Move old photos to cold storage after retention period

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-7 | Setup: 50 photo versions created over years | All in hot storage | ✓ Created |
| 2 | Set retention policy | 3_YEARS | ✓ Policy set |
| 3 | Run archival job | Photos > 3 years → cold storage | ✓ Archived |
| 4 | Query hot storage | Only recent 3 years | ✓ Recent only |
| 5 | Query cold storage | Years 1-2 present in archive | ✓ Archived |
| 6 | Restore old photo | Can retrieve from cold storage | ✓ Restored |
| 7 | Verify audit trail | Archival event logged | ✓ Logged |

---

### Group 4: Cross-Component Flows (4 flows)

#### **Flow 4.1: Primary Token Retirement with Active Secondary Versions**
**Scenario**: Attempt to retire primary token with active secondary versions

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary token | Primary created | ✓ Created |
| 2 | Create secondary version (ownership) | v1 Active | ✓ v1 Active |
| 3 | Create secondary version (photos) | v1 Active | ✓ v1 Active |
| 4 | Attempt to retire primary | Rejected: active secondary versions | ✓ Rejected |
| 5 | Error message clear | "Cannot retire: 2 active secondary versions" | ✓ Clear |
| 6 | Retire secondaries | Mark both as Expired | ✓ Both expired |
| 7 | Retry primary retirement | Now succeeds | ✓ Retired |
| 8 | Verify cascade | All related tokens marked retired | ✓ Cascade OK |

---

#### **Flow 4.2: Composite Token Versioning Impact**
**Scenario**: Secondary version changes propagate to composite tokens

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary, secondary, composite | All created | ✓ All created |
| 2 | Create secondary v2 | v2 Created | ✓ v2 created |
| 3 | Activate secondary v2 | v2 Active, v1 Replaced | ✓ v2 active |
| 4 | Verify composite impact | Composite merkle proof updates | ✓ Merkle updated |
| 5 | Query composite | References v2 (not v1) | ✓ v2 referenced |
| 6 | Verify no duplicate | Only one composite proof | ✓ No duplicates |

---

#### **Flow 4.3: Merkle Proof Chain Validation**
**Scenario**: Validate complete chain from secondary through primary to composite

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1-3 | Setup: Primary → Secondary → Composite | All tokens created | ✓ Setup |
| 2 | Create secondary v1, v2, v3 | 3 versions | ✓ Created |
| 3 | Activate v2 | v2 Active | ✓ v2 Active |
| 4 | Generate proof for secondary v2 | Includes: v2 hash, v1→v2 chain, primary hash, composite root | ✓ Full chain |
| 5 | Verify proof | Signature valid, chain intact | ✓ Verified |
| 6 | Validate performance | Proof generation < 100ms | ✓ <100ms |

---

#### **Flow 4.4: Cascade Operations**
**Scenario**: When primary token is updated, propagate to all secondary versions

| Step | Action | Expected | Validation |
|------|--------|----------|-----------|
| 1 | Create primary, 3 secondary versions | All created | ✓ Created |
| 2 | Update primary metadata | Status changed | ✓ Updated |
| 3 | Verify cascade | All 3 secondaries receive cascade event | ✓ Events fired |
| 4 | Audit trail | Shows cascade origin | ✓ Logged |
| 5 | Check merkle impact | All merkle hashes updated | ✓ Updated |

---

### Group 5: Performance & Load (3 flows)

#### **Flow 5.1: Concurrent Version Creations (100 concurrent)**
**Scenario**: 100 clients create versions simultaneously

**Setup**:
- Primary token: PERF-TEST-001
- Secondary token: PERF-SEC-001
- 100 concurrent threads

**Execution**:
```
T0: All 100 threads start creating v2, v3, ..., v101
T1-2s: All threads complete
```

**Assertions**:
- All 100 versions created
- No conflicts (all version numbers unique)
- Total time < 2 seconds
- Database intact (no corrupted rows)
- Audit trail complete (100 events)

**Metrics**:
- Throughput: > 50 versions/second
- P99 latency: < 50ms per create
- Error rate: 0%

---

#### **Flow 5.2: Sequential Version Changes (1000 sequential)**
**Scenario**: Single client creates, activates, archives 1000 versions sequentially

**Setup**:
- Primary: PERF-TEST-002
- Secondary: PERF-SEC-002
- Sequential operations

**Execution**:
```
Loop 1000x:
  1. Create version (CREATED)
  2. Activate version (ACTIVE)
  3. Create next version
  4. Transition previous to REPLACED
```

**Assertions**:
- All 1000 versions created
- State transitions correct
- No memory leaks
- Database remains responsive

**Metrics**:
- Total time: < 30 seconds
- Average per version: < 30ms
- Database size growth linear

---

#### **Flow 5.3: Audit Trail Query Under Load**
**Scenario**: Query 10,000 audit trail events

**Setup**:
- Flow 5.2 creates 3000 events (3 per version)
- Additional 7000 synthetic events
- Total: 10,000 events

**Queries**:
1. Query all events for token: < 100ms
2. Query by date range (30 days): < 50ms
3. Query by actor: < 75ms
4. Replay state to specific timestamp: < 200ms
5. Generate export (PDF): < 30s for 10k events

**Assertions**:
- Query latency within targets
- No data loss
- Export formats valid

---

## 4. TEST INFRASTRUCTURE

### Test Fixtures

```java
@QuarkusTest
class E2ETestBase {

    @BeforeEach
    void setupFixture() {
        // Create primary tokens
        primaryTokens = createPrimaryTokens(3);

        // Create secondary tokens (empty versions)
        secondaryTokens = createSecondaryTokens(primaryTokens);

        // Pre-populate VVB validator context
        vvbContext.setValidator("vvb_validator");
        vvbContext.setMode(VVBMode.ASYNC);
    }

    private List<PrimaryToken> createPrimaryTokens(int count) {
        // Implementation
    }
}
```

### Helper Methods

```java
// Version operations
Version createVersion(String secondaryTokenId, String content)
Version approveVersion(String versionId)
Version rejectVersion(String versionId, String reason)
Version activateVersion(String versionId)

// Query operations
List<Version> getVersionChain(String secondaryTokenId)
Version getActiveVersion(String secondaryTokenId)
List<AuditEvent> getAuditTrail(String secondaryTokenId)

// Performance metrics
long measureCreationTime(Callable<Version> operation)
void assertPerformance(long actualMs, long targetMs)
```

### Assertion Helpers

```java
// Workflow assertions
assertVersionStateTransition(v1, v2, REPLACED_TO_ACTIVE)
assertAuditEventLogged(tokenId, EventType.VERSION_ACTIVATED)
assertMerkleProofValid(version)
assertNoDataLoss(token)

// Performance assertions
assertP99Latency(operations, targetMs)
assertThroughput(operations, minOps/s)
```

---

## 5. TEST EXECUTION STRATEGY

### Phase 1: Unit Testing (Sprint 1-3)
- All 200+ unit tests complete
- Coverage 85%+
- All components tested in isolation

### Phase 2: Integration Testing (Sprint 4, Week 1)
- VVB + Versioning integration (Sprint 2)
- Audit + Versioning integration (Sprint 3)
- Combined system testing

### Phase 3: E2E Testing (Sprint 4, Week 2)
- 20 complete workflows
- Real user scenarios
- Full database integration

### Phase 4: Performance Validation (Sprint 4, Week 2)
- Load testing (concurrent, sequential)
- Benchmark against targets
- Identify bottlenecks

### Phase 5: Regression Testing (Sprint 4, Week 2)
- Run full test suite
- Verify no regressions
- Production readiness

---

## 6. SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Pass Rate | 100% | All 20 flows passing |
| Code Coverage | 85%+ | Coverage report |
| Performance (p99) | <2s per flow | Average: 1.5s |
| VVB Success Rate | 95%+ | 95 of 100 validations approve |
| Audit Trail Completeness | 100% | All events logged |
| Data Integrity | 0% loss | All data verified |
| Regression Bugs | 0 | No previously working features broken |

---

## 7. ROLLBACK & CONTINGENCY

**If Tests Fail**:
1. Identify root cause (code, test, environment)
2. Sprint 4 continues: Fix issues, re-test
3. If major issue: Escalate to tech lead
4. Rollback to last stable state if needed

**If Performance Targets Missed**:
1. Profile to identify bottleneck
2. Optimize hot paths
3. Re-benchmark
4. If still failing: Document trade-offs, escalate decision

**If VVB Integration Fails**:
1. Verify VVBVerificationService operational
2. Check timeout configuration
3. Test synchronously first
4. Enable detailed VVB logging

---

## 8. DELIVERABLES

**Test Code**:
- [ ] E2ETestBase class (base fixtures)
- [ ] OwnershipFlows (5 test flows, 150 LOC)
- [ ] TaxReceiptFlows (4 test flows, 120 LOC)
- [ ] PhotoFlows (4 test flows, 120 LOC)
- [ ] CrossComponentFlows (4 test flows, 120 LOC)
- [ ] PerformanceFlows (3 test flows, 100 LOC)
- **Total**: ~800 LOC test code

**Metrics & Reports**:
- [ ] Test execution report (HTML)
- [ ] Performance benchmark results (CSV + charts)
- [ ] Code coverage report
- [ ] Regression test results

**Documentation**:
- [ ] E2E test run procedures
- [ ] How to reproduce specific flows
- [ ] Known issues / workarounds

