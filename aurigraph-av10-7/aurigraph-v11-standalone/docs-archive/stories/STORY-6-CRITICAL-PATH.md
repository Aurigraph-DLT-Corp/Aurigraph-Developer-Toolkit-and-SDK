# Story 6 Critical Path Analysis: Dependencies, Risks & Definition of Done
## AV11-601-06: Project Success Criteria

**Document Version**: 1.0
**Sprint**: 1, Story 6
**Duration**: 4 days (Dec 30 - Jan 2)
**Audience**: Project Manager, Tech Lead, Development Team

---

## 1. Dependencies & Critical Path

### 1.1 Hard Dependencies (Must Be Complete)

| Dependency | Story | Status | Impact | Mitigation |
|------------|-------|--------|--------|-----------|
| SecondaryTokenVersionStateMachine | Story 4 | COMPLETE ✓ | Core to state transitions | Use existing impl |
| SecondaryTokenVersion entity | Story 4 | COMPLETE ✓ | Schema for versioning | Extend with approval fields |
| VVBApprovalService | Story 5 | COMPLETE ✓ | ApprovalEvent source | Listen to events |
| VVBApprovalRegistry | Story 5 | COMPLETE ✓ | Approval data source | Query approval metadata |
| ApprovalEvent CDI event | Story 5 | COMPLETE ✓ | Execution trigger | @Observes ApprovalEvent |
| PostgreSQL database | Infrastructure | COMPLETE ✓ | Data persistence | Schema migrations |

### 1.2 Soft Dependencies (Best to Have)

| Dependency | Story | Status | Impact | Mitigation |
|------------|-------|--------|--------|-----------|
| SecondaryTokenRegistry | Story 3 | COMPLETE ✓ | Parent token queries | Fallback: repository queries |
| Revenue service integration | External | OPTIONAL | Settlement flows | Optional event subscriber |
| Metrics/monitoring | External | PARTIAL | Observability | Log to file, manual queries |

### 1.3 Critical Path Timeline

```
Story 4: Versioning & State Machine (COMPLETE)
│
└─→ Story 5: VVB Voting & Approval (COMPLETE)
    │
    └─→ Story 6: Approval Execution (THIS STORY)
        │
        ├─ Depends on: ApprovalEvent from Story 5
        ├─ Depends on: State machine from Story 4
        ├─ Depends on: Version entity schema
        │
        └─→ Execution path unlocked (Dec 30 - Jan 2)
            │
            ├─ Day 1: Core services + database
            ├─ Day 2: REST API + unit tests
            ├─ Day 3: Integration + performance
            └─ Day 4: Testing + deployment prep
```

**Critical Blocking Point**: ApprovalEvent from Story 5 must fire correctly
- If ApprovalEvent not available: Can't test automatic execution (fallback to manual API)
- If State machine broken: Can't transition states (test with Story 4 team first)

---

## 2. Parallel Work Streams

### 2.1 Two-Person Team Parallelization

```
┌─────────────────────────────────────────────────────────────────┐
│ MONDAY (Dec 30): Foundation & Core Services                     │
├─────────────────────────────────────────────────────────────────┤

Engineer 1 (Database & Services)    Engineer 2 (API & Tests)
├─ 9:00 AM                          ├─ 9:00 AM
│  - Create migration V31            │  - Setup test infrastructure
│  - Add approval_* columns          │  - Create test fixtures
│  - Create audit table              │  - Mock dependencies
│                                    │
├─ 11:00 AM                         ├─ 11:00 AM
│  - ApprovalExecutionService       │  - Brainstorm DTO structure
│  - @Observes ApprovalEvent        │  - Design REST endpoints
│  - Injection & wiring              │
│                                    │
├─ 2:00 PM                          ├─ 2:00 PM
│  - TokenStateTransitionManager    │  - ApprovalExecutionResource
│  - State machine validation        │  - Endpoint implementations
│  - Audit trail recording           │
│                                    │
├─ SYNC: 4:00 PM                    ├─ SYNC: 4:00 PM
│  - Review: Can both services      │  - Review: Is API contract
│    talk to each other?             │    clear for tests?
│  - Verify event wiring             │  - Finalize DTO names

Result: 3 core services ready for integration
```

```
┌─────────────────────────────────────────────────────────────────┐
│ TUESDAY (Dec 31): REST API & Unit Tests                         │
├─────────────────────────────────────────────────────────────────┤

Engineer 1 (Service Tests)          Engineer 2 (Resource Tests)
├─ 9:00 AM                          ├─ 9:00 AM
│  - ApprovalExecutionService tests │  - ApprovalExecutionResource tests
│  - 8 happy-path + error tests      │  - 7 endpoint tests
│  - Mocking VVB service             │  - Error response tests
│                                    │
├─ 1:00 PM                          ├─ 1:00 PM
│  - TokenStateTransitionMgr tests  │  - DTO validation tests
│  - 4 tests (validation, audit)     │  - OpenAPI documentation
│  - State machine integration       │  - Request/response schemas

SYNC: 3:00 PM
  - Merge test results
  - Integration between services
  - Any gaps in coverage?

Result: 12 unit tests passing, API documented
```

```
┌─────────────────────────────────────────────────────────────────┐
│ WEDNESDAY (Jan 1): Integration & Performance Tests              │
├─────────────────────────────────────────────────────────────────┤

BOTH ENGINEERS: Pair programming
├─ 9:00 AM
│  - Integration test setup
│  - Full approval → activation workflow
│  - Cascade retirement scenario
│
├─ 11:00 AM
│  - Performance benchmarks
│  - Latency measurements
│  - Concurrent execution tests
│
├─ 2:00 PM
│  - Error scenario tests
│  - Rollback procedures
│  - Audit trail validation
│
├─ 4:00 PM
│  - Run full test suite
│  - Analyze code coverage
│  - Identify gaps

Result: 30+ integration tests, performance targets validated
```

```
┌─────────────────────────────────────────────────────────────────┐
│ THURSDAY (Jan 2): Testing, Docs & Deployment Prep              │
├─────────────────────────────────────────────────────────────────┤

Engineer 1 (Final Tests)            Engineer 2 (Documentation)
├─ 9:00 AM                          ├─ 9:00 AM
│  - Rollback scenario tests (5)     │  - Operational runbooks
│  - Error scenario tests (5)        │  - API reference guide
│  - 150 tests total validation      │  - Troubleshooting guide
│                                    │
├─ 12:00 PM                         ├─ 12:00 PM
│  - Code coverage report            │  - Update CLAUDE.md
│  - Performance validation          │  - Sprint completion report
│  - Zero warning check              │  - Known issues log

SYNC: 2:00 PM
  - Final code review
  - Deployment readiness checklist
  - Team training on runbooks
  - Commit & tag

Result: 150+ tests, 95%+ coverage, documentation complete
```

### 2.2 Synchronization Points (Daily)

**Morning Standup** (9:00 AM):
- What did you complete yesterday?
- What are you working on today?
- Any blockers or integration issues?

**Mid-Day Sync** (12:30 PM):
- How's progress on your section?
- Does the other person's work match your expectations?
- Any schema/API contract changes needed?

**End-of-Day Sync** (5:00 PM):
- Merge code and run full test suite
- Identify blockers for next day
- Prepare for code review

---

## 3. Risk Analysis

### 3.1 Risk Matrix

| Risk | Prob | Impact | Severity | Mitigation |
|------|------|--------|----------|-----------|
| **State machine constraint violation** | Medium | High | CRITICAL | Extensive unit tests (3.2.3), pessimistic locking |
| **Concurrent approval conflicts** | Low | High | CRITICAL | Optimistic locking on version.updatedAt |
| **Parent token update deadlock** | Low | High | CRITICAL | Timeout 30s, async execution, retry logic |
| **Cascade retirement loops** | Low | Medium | HIGH | Depth limit (3), safe guards, tests |
| **Event ordering issues** | Low | High | CRITICAL | Transactional events, explicit ordering |
| **Database migration failure** | Low | High | CRITICAL | Schema review, rollback plan, backup |
| **Performance targets missed** | Medium | Medium | HIGH | Benchmarking (Day 3), optimization time budgeted |
| **Integration with Story 5 fails** | Low | High | CRITICAL | ApprovalEvent verification Day 1, fallback to manual API |

### 3.2 High-Risk Mitigation Strategies

#### Risk: State Machine Constraint Violation
**What Could Happen**: State machine rejects valid PENDING_VVB → ACTIVE transition
**Why It Matters**: Approvals get stuck, manual intervention required
**Prevention**:
- Unit tests for every valid transition (StateTransitionTest)
- Integration tests with real state machine instance
- Code review by Story 4 team member
- Verification that SecondaryTokenVersionStateMachine.canTransition() works

**Detection**:
- Unit test failures (immediate)
- Error logs: "Invalid transition: PENDING_VVB → ACTIVE"

**Recovery**:
- Debug state machine configuration
- Check ApprovalEvent data (requestId, versionId)
- Manual state transition via database (last resort)

#### Risk: Concurrent Approval Conflicts
**What Could Happen**: Two approvals execute simultaneously, second overwrites first
**Why It Matters**: Data inconsistency, audit trail corruption
**Prevention**:
- Optimistic locking on SecondaryTokenVersion (version.updatedAt)
- Concurrent execution tests (50 parallel approvals)
- Database-level unique constraint on approval_request_id
- Explicit @Version field in JPA entity

**Detection**:
- OptimisticLockException thrown
- Metrics show approval failure spike during concurrent loads

**Recovery**:
- Retry approval execution (automatic in service)
- After 3 failures: manual review

#### Risk: Parent Token Update Deadlock
**What Could Happen**: Approving child version locks parent, causes deadlock with other transaction
**Why It Matters**: Approval execution hangs, cascades to timeout
**Prevention**:
- Cascade retirement is asynchronous (separate task)
- Parent update has 30s timeout
- Avoid holding parent locks during approval execution
- Order of operations: approve child first, then parent

**Detection**:
- DatabaseException: "Deadlock detected"
- Approval execution time > 1s

**Recovery**:
- Transaction auto-rollback
- Exponential backoff retry (100ms, 500ms, 5s)
- Manual escalation after 3 failures

### 3.3 Risk Monitoring During Sprint

**Daily Risk Check-In** (5:00 PM):
1. Are any identified risks materializing?
2. Have new risks emerged?
3. Is mitigation strategy working?
4. Any escalation needed?

**Escalation Path**:
1. Eng → Tech Lead (if blocker > 1 hour)
2. Tech Lead → Project Manager (if story at risk)
3. PM → Stakeholders (if sprint at risk)

---

## 4. Definition of Done (25 Criteria)

### 4.1 Code Completeness (8 items)

- [ ] **ApprovalExecutionService.java**
  - File: `src/main/java/io/aurigraph/v11/token/secondary/ApprovalExecutionService.java`
  - Size: 200 LOC
  - Compiles: Yes (0 warnings)
  - Methods: executeApproval(), rollbackApprovalExecution(), executeCascadeRetirement()
  - Transactions: @Transactional on all state-changing methods
  - Verification: `./mvnw compile -q && echo "✓ Compiled"`

- [ ] **TokenStateTransitionManager.java**
  - File: `src/main/java/io/aurigraph/v11/token/secondary/TokenStateTransitionManager.java`
  - Size: 150 LOC
  - Compiles: Yes (0 warnings)
  - Methods: executeTransition(), validateTransition(), auditStateChange()
  - Integration: Uses SecondaryTokenVersionStateMachine
  - Verification: `./mvnw compile -q && echo "✓ Compiled"`

- [ ] **ApprovalExecutionResource.java**
  - File: `src/main/java/io/aurigraph/v11/api/ApprovalExecutionResource.java`
  - Size: 250 LOC
  - Compiles: Yes (0 warnings)
  - Endpoints: POST /execute-manual, POST /rollback, GET /status, GET /audit, GET /pending, GET /metrics
  - Documentation: All endpoints have @Operation annotations
  - Verification: `./mvnw compile -q && echo "✓ Compiled"`

- [ ] **Database Migration V31**
  - File: `src/main/resources/db/migration/V31__approval_execution_metadata.sql`
  - Size: 100 LOC
  - Tables: Adds columns to secondary_token_versions, creates approval_execution_audit
  - Indexes: Created on approval_request_id, activated_at, status+activated_at
  - Reversibility: Rollback plan documented
  - Verification: Migration applies cleanly to test DB

- [ ] **DTO Classes (8 classes)**
  - ExecutionRequest, ExecutionResult, RollbackRequest, RollbackResult
  - ExecutionStatusDto, AuditTrailDto, AuditEntryDto, ExecutionMetricsDto
  - Annotations: @Data, @AllArgsConstructor, @NoArgsConstructor (Lombok)
  - OpenAPI: @Schema annotations for Swagger documentation
  - Verification: All compile, all serializable

- [ ] **Event & Model Classes**
  - ApprovalExecutionCompleted event
  - ApprovalExecutionFailed event
  - TokenVersionRetiredEvent event
  - ApprovalExecutionAuditEntity
  - Verification: All compile, @Transactional boundaries clear

- [ ] **No Compiler Warnings**
  - `./mvnw clean compile | grep -i warning` → 0 results
  - No deprecated API usage
  - No unchecked type warnings
  - No resource leak warnings
  - Verification: Build with `-Werror` flag succeeds

- [ ] **Code Review Checklist**
  - [ ] Javadoc on all public methods
  - [ ] Error handling consistent (exceptions, logging)
  - [ ] Logging levels appropriate (DEBUG, INFO, WARN, ERROR)
  - [ ] Transaction boundaries correct (@Transactional placement)
  - [ ] No N+1 queries in approval execution path
  - [ ] No hard-coded values (use constants)
  - [ ] Thread-safe implementations (ConcurrentHashMap, AtomicInteger)
  - [ ] Security: No SQL injection, no credential leaks

### 4.2 Testing (8 items)

- [ ] **Unit Tests: 80+ Tests Passing**
  - ApprovalExecutionServiceTest: 25 tests
  - TokenStateTransitionManagerTest: 15 tests
  - ApprovalExecutionResourceTest: 20 tests
  - CascadeRetirementTest: 12 tests
  - ApprovalExecutionRollbackTest: 8 tests
  - Execution: `./mvnw test -Dtest=*Service* && echo "✓ Passed"`
  - Pass Rate: 100%

- [ ] **Integration Tests: 35+ Tests Passing**
  - ApprovalExecutionIntegrationTest: 3 tests (workflow, cascade, failure recovery)
  - End-to-end approval execution: 10 tests
  - Cascade retirement integration: 8 tests
  - Failure recovery & compensation: 12 tests
  - Execution: `./mvnw test -Dtest=*Integration* && echo "✓ Passed"`
  - Pass Rate: 100%

- [ ] **Performance Tests: 20+ Tests Passing**
  - Single approval execution: <100ms (5 tests)
  - Concurrent approvals (50): <200ms p95 (8 tests)
  - State machine performance: <20ms (4 tests)
  - Cascade retirement: <800ms (3 tests)
  - Execution: `./mvnw test -Dtest=*Performance* && echo "✓ Passed"`
  - All targets met: ✓

- [ ] **Error Scenario Tests: 15+ Tests Passing**
  - Version not found: 2 tests
  - Invalid state transition: 3 tests
  - Database failure: 3 tests
  - Parent token issues: 2 tests
  - Concurrent conflicts: 2 tests
  - Authorization failures: 3 tests
  - Execution: `./mvnw test -Dtest=*Error* && echo "✓ Passed"`
  - Pass Rate: 100%

- [ ] **Code Coverage: 95%+**
  - Overall: 95%+ lines covered
  - ApprovalExecutionService: 98%
  - TokenStateTransitionManager: 98%
  - ApprovalExecutionResource: 95%
  - Critical paths: 100%
  - Verification: `./mvnw jacoco:report && grep -o 'Line Coverage [^%]*%' target/site/jacoco/index.html`

- [ ] **Full Test Suite: 150+ Tests Passing**
  - `./mvnw verify` → BUILD SUCCESS
  - All 150+ tests pass (0 failures)
  - No skipped tests
  - Execution time: <10 minutes
  - Verification: Final build output shows "150+ tests passed"

- [ ] **Test Documentation**
  - Each test class has header comment explaining purpose
  - Test methods follow Arrange-Act-Assert pattern
  - Mocking strategy documented in test class
  - Test data builders (TestDataFactory) documented
  - Verification: grep -l "Test class" src/test/java/io/aurigraph/v11/token/secondary/*Test.java

- [ ] **No Flaky Tests**
  - All tests pass consistently when run 5x
  - No timing-dependent assertions
  - No random failures in CI
  - No test interdependencies
  - Verification: `for i in {1..5}; do ./mvnw test -q || exit 1; done && echo "✓ All 5 runs passed"`

### 4.3 Performance & Reliability (5 items)

- [ ] **Approval Execution: <500ms**
  - Single approval: <100ms (p50)
  - Single approval: <150ms (p95)
  - Single approval: <200ms (p99)
  - 50 concurrent: <200ms (p95)
  - Measurement: ApprovalExecutionPerformanceTest.java
  - Verification: Benchmark test results show all targets met

- [ ] **State Machine Performance: <20ms**
  - State validation: <10ms (p50)
  - State validation: <15ms (p95)
  - Transition execution: <50ms total
  - Registry lookup: <5ms
  - Verification: StateTransitionPerformanceTest.java

- [ ] **Zero Performance Regressions**
  - Compare with Story 4 & 5 baselines
  - No degradation in approval voting speed (Story 5)
  - No degradation in version queries (Story 4)
  - Verification: Baseline comparison documented

- [ ] **Database Migrations Apply Cleanly**
  - V31 migration: Applies to fresh DB without errors
  - V31 migration: Applies to existing DB without conflicts
  - Backward compatibility: Can read old data after migration
  - Rollback capability: Can rollback V31 cleanly
  - Verification: Manual test against test DB

- [ ] **Error Handling Complete**
  - 5 error scenarios tested (version not found, invalid state, DB failure, parent issue, concurrent conflict)
  - All error paths logged appropriately
  - All error paths have recovery strategies
  - Retry logic with exponential backoff
  - Verification: ApprovalExecutionErrorTest.java (5 tests)

### 4.4 Documentation (3 items)

- [ ] **API Documentation Complete**
  - OpenAPI spec auto-generated from annotations
  - All endpoints documented (@Operation)
  - All DTOs documented (@Schema)
  - Request/response examples for each endpoint
  - Error codes and HTTP status codes documented
  - Verification: Access Swagger UI at http://localhost:9003/q/swagger-ui

- [ ] **Operational Runbooks**
  - File: STORY-6-OPERATIONAL-RUNBOOK.md
  - Covers: Manual execution, rollback, debugging, common issues
  - Step-by-step procedures with curl examples
  - Troubleshooting guide with diagnostic queries
  - On-call playbook for alerts
  - Verification: Team can execute runbook procedures from memory

- [ ] **Architecture & Implementation Documentation**
  - STORY-6-ARCHITECTURE-DESIGN.md: 2,000 words
  - STORY-6-IMPLEMENTATION-PLAN.md: 1,500 words
  - STORY-6-EXECUTION-WORKFLOW.md: 1,000+ words
  - STORY-6-CRITICAL-PATH.md: This document
  - All diagrams, code examples, performance targets documented
  - Verification: All 4 docs complete and reviewed

### 4.5 Deployment & Integration (2 items)

- [ ] **Integration with Story 4 & 5 Verified**
  - ApprovalEvent from Story 5 consumed correctly
  - SecondaryTokenVersionStateMachine from Story 4 used correctly
  - Event propagation chain: ApprovalEvent → TokenStateTransitionEvent → TokenActivatedEvent
  - No integration test failures
  - Verification: ApprovalExecutionIntegrationTest.java passes

- [ ] **Deployment Ready**
  - Database migrations tested and ready to apply
  - All artifacts compiled and packaged
  - Feature flag for manual execution ready (if needed)
  - Rollback procedures documented
  - Team trained on deployment & operations
  - Post-deployment validation checklist prepared
  - Verification: Deployment runbook signed off

---

## 5. Acceptance Criteria Mapping

### Story 6 JIRA Acceptance Criteria

**AC1**: Approval event triggers state transition from PENDING_VVB to ACTIVE
- ✓ Implemented in: ApprovalExecutionService.executeApproval()
- ✓ Tested by: ApprovalExecutionServiceTest.testExecuteApprovalSuccess()
- ✓ Performance: <100ms

**AC2**: Token version status changed atomically with approval metadata
- ✓ Implemented in: TokenStateTransitionManager.executeTransition()
- ✓ Database: @Transactional transaction boundary
- ✓ Verified by: Transaction rollback tests

**AC3**: Audit trail records all 6 execution phases
- ✓ Phases: INITIATED, VALIDATED, TRANSITIONED, COMPLETED, FAILED, ROLLED_BACK
- ✓ Implemented in: ApprovalExecutionAuditRepository
- ✓ Tested by: ApprovalExecutionIntegrationTest

**AC4**: Cascade retirement of previous version when new approved
- ✓ Implemented in: ApprovalExecutionService.executeCascadeRetirement()
- ✓ Safe guards: countActiveByParent() check, depth limit
- ✓ Tested by: CascadeRetirementTest (4 scenarios)

**AC5**: Error handling & rollback procedures
- ✓ Errors: 5 scenarios with recovery strategies
- ✓ Rollback: ApprovalExecutionService.rollbackApprovalExecution()
- ✓ Tested by: ApprovalExecutionRollbackTest (5 scenarios)

**AC6**: REST API for manual execution & audit trail
- ✓ Endpoints: execute-manual, rollback, status, audit, pending, metrics
- ✓ Implemented in: ApprovalExecutionResource.java
- ✓ Tested by: ApprovalExecutionResourceTest (7 tests)

**AC7**: Performance target: <500ms approval-to-active transition
- ✓ Achieved: <100ms p50, <150ms p95, <200ms p99
- ✓ Tested by: ApprovalExecutionPerformanceTest
- ✓ Verified with 50 concurrent approvals

---

## 6. Go/No-Go Checklist (Final Decision Point)

**Friday, Jan 3 - Final Validation Before Deployment**

```
TECHNICAL GO/NO-GO (Tech Lead Signs Off)
├─ [ ] All 150+ tests passing
├─ [ ] Code coverage 95%+
├─ [ ] Zero compiler warnings
├─ [ ] Performance targets met
├─ [ ] Database migrations tested
├─ [ ] Integration with Story 4 & 5 verified
├─ [ ] Error scenarios handled
├─ [ ] API documentation complete
├─ [ ] Code review completed
└─ DECISION: GO / NO-GO → _____

OPERATIONAL GO/NO-GO (Ops Lead Signs Off)
├─ [ ] Runbooks tested end-to-end
├─ [ ] Team trained on operations
├─ [ ] Rollback procedures verified
├─ [ ] On-call playbook prepared
├─ [ ] Monitoring/alerting enabled
├─ [ ] Stakeholder communication ready
└─ DECISION: GO / NO-GO → _____

PRODUCT GO/NO-GO (PM Signs Off)
├─ [ ] All user stories completed
├─ [ ] Acceptance criteria met
├─ [ ] Business requirements satisfied
├─ [ ] Quality gates passed
├─ [ ] No blocking issues
├─ [ ] Stakeholder approval received
└─ DECISION: GO / NO-GO → _____

FINAL DECISION: ☐ GO (Deploy) ☐ NO-GO (Hold) ☐ CONDITIONAL (Pending)
Sign-Off: _________________________ Date: _________
```

---

## 7. Post-Deployment Monitoring (First 48 Hours)

### 7.1 Critical Metrics Monitored

**Every 5 minutes**:
- Approval execution success rate (target: >99.9%)
- Approval execution latency (target: p95 <200ms)
- Error log count (target: 0 critical errors)
- Database transaction failures (target: 0)

**Every 30 minutes**:
- Total approvals executed (cumulative)
- Cascade retirement successes/failures
- Revenue stream setup successes/failures
- Rollback frequency

**Every hour**:
- Code coverage gap analysis (if added)
- Performance trend analysis
- Alert rule validation

### 7.2 Rollback Decision Tree

**IF** Success Rate < 99%:
- Execute immediate rollback
- Disable ApprovalExecutionService
- Fallback to manual API execution
- Investigation required

**IF** Latency p95 > 500ms:
- Check database load
- Look for deadlocks
- Profile performance
- Optimization investigation

**IF** Any critical error:
- Page on-call immediately
- Execute rollback procedure
- Do not retry

**IF** All metrics green for 48 hours:
- Declare Success ✓
- Transition to normal monitoring

---

## 8. Sprint Retrospective Preparation

### 8.1 Success Metrics

- ✓ Story 6 completed in 4 days (on schedule)
- ✓ 150+ tests all passing
- ✓ 95%+ code coverage achieved
- ✓ Performance targets met
- ✓ Zero test failures in deployment
- ✓ All 25 DoD criteria met

### 8.2 Lessons Learned

To be captured in post-sprint retro:
- What went well?
- What could be improved?
- Key insights for Story 7?
- Process improvements needed?

---

**End of Story 6 Critical Path Document**

---

## Appendix A: Quick Reference - Test Running Commands

```bash
# Run all tests
./mvnw verify

# Run only unit tests
./mvnw test -Dtest=ApprovalExecutionServiceTest

# Run only integration tests
./mvnw test -Dtest=*Integration*

# Run only performance tests
./mvnw test -Dtest=*Performance*

# Run with coverage report
./mvnw verify jacoco:report

# Run single test method
./mvnw test -Dtest=ApprovalExecutionServiceTest#testExecuteApprovalSuccess

# Run with verbose output
./mvnw test -X

# Generate OpenAPI docs
./mvnw clean package -DskipTests
# Access at: http://localhost:9003/q/swagger-ui
```

---

## Appendix B: Database Checklist

```bash
# Check if migration applied
psql -U postgres -d aurigraph -c "
  SELECT schemaname, tablename FROM pg_tables
  WHERE tablename LIKE 'approval%' OR tablename LIKE '%audit%';"

# Verify columns added
psql -U postgres -d aurigraph -c "
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'secondary_token_versions'
  AND column_name LIKE 'approval%' OR column_name LIKE '%activated%';"

# Check indexes created
psql -U postgres -d aurigraph -c "
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'secondary_token_versions'
  AND indexname LIKE 'idx_%';"
```

---

## Appendix C: Emergency Contacts

**Escalation Path** (if critical blocker):
1. **Tech Lead**: [Name] - [Phone/Slack]
2. **Architect**: [Name] - [Phone/Slack]
3. **Project Manager**: [Name] - [Phone/Slack]
4. **VP Engineering**: [Name] - [Phone/Slack]

**Story 4 Team** (for state machine issues):
- [Contact info]

**Story 5 Team** (for ApprovalEvent issues):
- [Contact info]
