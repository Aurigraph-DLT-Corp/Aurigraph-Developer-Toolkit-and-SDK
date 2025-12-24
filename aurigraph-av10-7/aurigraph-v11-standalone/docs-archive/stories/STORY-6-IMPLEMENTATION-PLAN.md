# Story 6 Implementation Plan: Approval Execution & State Transitions
## AV11-601-06: Day-by-Day Development Roadmap

**Document Version**: 1.0
**Sprint**: 1, Story 6
**Duration**: 4 days (Dec 30 - Jan 2)
**Story Points**: 5 SP
**Team Size**: 2 engineers
**Estimated LOC**: 600 core + 400 tests = 1,000 LOC
**Audience**: Development Team

---

## 1. Overview & Deliverables

### 1.1 Three Core Components to Implement

| Component | LOC | Responsibility | Tests | Days |
|-----------|-----|-----------------|-------|------|
| ApprovalExecutionService | 200 | Orchestrates approval execution | 60 | 1-2 |
| TokenStateTransitionManager | 150 | Manages state machine transitions | 40 | 1 |
| ApprovalExecutionResource | 250 | REST API endpoints | 50 | 2-3 |
| Database migrations | 100 | Schema changes | - | 1 |
| **Total** | **700** | **Integration & Testing** | **150** | **4** |

### 1.2 Final Deliverables

By EOD Jan 2, 2025:
- [ ] ApprovalExecutionService.java (200 LOC, compiled)
- [ ] TokenStateTransitionManager.java (150 LOC, compiled)
- [ ] ApprovalExecutionResource.java (250 LOC, compiled)
- [ ] Migration: V31__approval_execution_metadata.sql (100 LOC)
- [ ] 150 comprehensive tests (100% passing)
- [ ] Full integration with Story 5 (ApprovalEvent)
- [ ] Performance validation (<500ms approval → active)
- [ ] Audit trail operational

---

## 2. Day-by-Day Breakdown

### DAY 1: Monday, Dec 30 - Foundation & Core Services

**Goal**: Implement core services and database schema

#### Morning Session (8:00 - 12:00)

**Task 1.1**: Database Migration & Schema Design (30 min)
```bash
Location: src/main/resources/db/migration/V31__approval_execution_metadata.sql
Subtask:
  - Add approval_request_id UUID column (FK to vvb_approval_requests)
  - Add approval_threshold_percentage DECIMAL
  - Add approved_by_count INT
  - Add approval_timestamp TIMESTAMP
  - Add approvers_list TEXT (JSON)
  - Add activated_at TIMESTAMP
  - Add replaced_by_version_id UUID
  - Create indexes on approval_request_id, activated_at, status+activated_at
  - Create approval_execution_audit table
  - Create indexes on audit table

Dependencies: Story 4 schema (secondary_token_versions table exists)
Verification: ./mvnw db:migrate (no errors)
```

**Task 1.2**: TokenStateTransitionManager (90 min)
```bash
Location: src/main/java/io/aurigraph/v11/token/secondary/TokenStateTransitionManager.java
Subtask:
  - Create @ApplicationScoped service
  - Inject SecondaryTokenVersionStateMachine
  - Inject SecondaryTokenVersionRepository
  - Inject ApprovalExecutionAuditRepository (new)
  - Implement executeTransition(versionId, fromStatus, toStatus)
  - Implement validateTransition(version)
  - Implement auditStateChange(version, fromStatus, toStatus, metadata)
  - Implement getTransitionPath(versionId)
  - Handle state machine validation errors
  - Fire TokenStateTransitionEvent

Size: 150 LOC
Interfaces:
  - executeTransition(UUID versionId, Status from, Status to): Uni<SecondaryTokenVersion>
  - validateTransition(SecondaryTokenVersion): boolean
  - auditStateChange(...): void
  - rollbackTransition(UUID versionId): Uni<SecondaryTokenVersion>

Performance target: <20ms validation, <50ms persistence
```

**Task 1.3**: ApprovalExecutionService - Part 1 (90 min)
```bash
Location: src/main/java/io/aurigraph/v11/token/secondary/ApprovalExecutionService.java
Subtask:
  - Create @ApplicationScoped service
  - Inject VVBApprovalService (Story 5)
  - Inject TokenStateTransitionManager (just created)
  - Inject SecondaryTokenVersionRepository
  - Inject Event<ApprovalEvent> listener
  - Implement @Observes ApprovalEvent method
  - Implement executeApproval(approvalRequestId): Uni<ExecutionResult>
  - Implement validateApprovalMetadata(request): void
  - Implement loadTokenVersion(versionId): SecondaryTokenVersion
  - Error handling: version not found, invalid state, concurrent update

Size: 100 LOC (partial, continued in afternoon)
Performance target: <100ms approval → active transition
```

#### Afternoon Session (13:00 - 17:00)

**Task 1.4**: ApprovalExecutionService - Part 2 (120 min)
```bash
Continuation of Task 1.3 + additional methods
Subtask:
  - Implement @Transactional executeApproval method
  - Execute TokenStateTransitionManager.executeTransition()
  - Update approval metadata fields (approval_request_id, approval_timestamp, etc)
  - Fire ApprovalExecutionCompleted event
  - Implement rollbackApprovalExecution(versionId, reason)
  - Implement executeCascadeRetirement(newVersionId, previousVersionId)
  - Cascade logic: check if safe to retire, execute retirement, schedule archival
  - Handle partial failures gracefully

Size: 100 LOC (completing 200 LOC total)
Key methods:
  - executeApproval(UUID requestId): Uni<ExecutionResult>
  - rollbackApprovalExecution(UUID versionId, String reason): void
  - executeCascadeRetirement(UUID newVersionId, UUID prevVersionId): void

Transaction boundaries: Each approval execution wrapped in @Transactional
Error scenarios: version not found, state invalid, parent update fails, revenue setup fails
```

**Task 1.5**: Integration Tests Setup (30 min)
```bash
Create test infrastructure:
  - ApprovalExecutionServiceTest.java (test class, 0 tests for now)
  - Inject ApprovalExecutionService
  - Inject TestData builder
  - Setup @QuarkusTest fixture
  - Mock VVBApprovalService responses
  - Setup event listeners for testing

This enables Day 2 test writing.
```

**Day 1 Completion Criteria**:
- [ ] V31 migration compiles (mvn validate)
- [ ] TokenStateTransitionManager compiles (0 warnings)
- [ ] ApprovalExecutionService compiles (0 warnings)
- [ ] Test infrastructure in place
- [ ] All 3 services integrated with Story 4 state machine

---

### DAY 2: Tuesday, Dec 31 - REST API & Unit Tests

**Goal**: Complete REST API and write comprehensive unit tests

#### Morning Session (8:00 - 12:00)

**Task 2.1**: ApprovalExecutionResource - Part 1 (90 min)
```bash
Location: src/main/java/io/aurigraph/v11/api/ApprovalExecutionResource.java
Subtask:
  - Create @Path("/api/v12/approval-execution") resource
  - Inject ApprovalExecutionService
  - Implement REST endpoints (3 endpoints):
    1. POST /execute-manual/{versionId}
       - Manual fallback approval execution
       - Request: { approvalRequestId, executedBy, reason }
       - Response: 200 with ExecutionResult

    2. POST /{versionId}/rollback
       - Rollback approval execution
       - Request: { reason, executedBy }
       - Response: 200 with RollbackResult

    3. GET /{versionId}/status
       - Get execution status and audit trail
       - Response: 200 with ExecutionStatusDto (versionId, status, auditEntries)

Size: 100 LOC (partial, continued afternoon)
API Pattern: Follow VVBResource pattern (RequestDto, ResponseDto, error handling)
```

**Task 2.2**: ApprovalExecutionResource - Part 2 (90 min)
```bash
Continuation of Task 2.1 + additional endpoints
Subtask:
  - Implement audit trail endpoint
    4. GET /{versionId}/audit
       - Full execution audit trail
       - Response: 200 with AuditTrailDto (phases, timestamps, metadata)

  - Implement query endpoints
    5. GET /pending-executions
       - List all pending approval executions
       - Response: 200 with List<PendingExecutionDto>

    6. GET /execution-metrics
       - Approval execution metrics (success rate, latency, etc)
       - Response: 200 with ExecutionMetricsDto

  - Add error handling (400 Bad Request, 404 Not Found, 500 Server Error)
  - Add OpenAPI annotations (@Operation, @Parameter, etc)
  - Add request/response validation

Size: 150 LOC (completing 250 LOC total with Task 2.1)
```

**Task 2.3**: DTO Classes (60 min)
```bash
Location: src/main/java/io/aurigraph/v11/api/dto/
Subtask:
  - ExecutionRequest.java (10 LOC)
  - ExecutionResult.java (10 LOC)
  - RollbackRequest.java (8 LOC)
  - RollbackResult.java (10 LOC)
  - ExecutionStatusDto.java (15 LOC)
  - AuditTrailDto.java (15 LOC)
  - AuditEntryDto.java (12 LOC)
  - ExecutionMetricsDto.java (10 LOC)

Total: 90 LOC
Use Lombok (@Data, @AllArgsConstructor, @NoArgsConstructor)
Include OpenAPI annotations for Swagger docs
```

#### Afternoon Session (13:00 - 17:00)

**Task 2.4**: ApprovalExecutionService Unit Tests (120 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/ApprovalExecutionServiceTest.java
Subtask:
  - Test 1: testExecuteApprovalSuccess (20 LOC)
    Verify: version PENDING_VVB → ACTIVE, timestamp recorded, event fired

  - Test 2: testExecuteApprovalVersionNotFound (10 LOC)
    Verify: exception thrown, ApprovalExecutionFailed event fired

  - Test 3: testExecuteApprovalInvalidStateTransition (15 LOC)
    Verify: state machine rejects, error logged, compensation triggered

  - Test 4: testExecuteApprovalConcurrentUpdates (25 LOC)
    Verify: optimistic locking prevents stale updates

  - Test 5: testExecuteApprovalWithCascadeRetirement (30 LOC)
    Verify: old version → REPLACED, new version → ACTIVE

  - Test 6: testExecuteApprovalWithParentToken (20 LOC)
    Verify: parent token status updated correctly

  - Test 7: testRollbackApprovalExecution (25 LOC)
    Verify: ACTIVE → PENDING_VVB, approval metadata cleared

  - Test 8: testExecuteApprovalDatabaseFailure (15 LOC)
    Verify: transaction rolled back, retry logic, failure event

Size: 160 LOC, 8 tests
Coverage: Happy path, error scenarios, cascade, rollback, concurrency
Mocks: VVBApprovalService, SecondaryTokenVersionRepository, event publishers
```

**Task 2.5**: TokenStateTransitionManager Unit Tests (60 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/TokenStateTransitionManagerTest.java
Subtask:
  - Test 1: testExecuteValidTransition (15 LOC)
    PENDING_VVB → ACTIVE

  - Test 2: testRejectInvalidTransition (10 LOC)
    State machine validation

  - Test 3: testAuditTrailRecording (20 LOC)
    Verify audit entry created with metadata

  - Test 4: testRollbackTransition (15 LOC)
    ACTIVE → PENDING_VVB

Size: 60 LOC, 4 tests
Mocks: SecondaryTokenVersionStateMachine, Repository, ApprovalExecutionAuditRepository
```

**Day 2 Completion Criteria**:
- [ ] ApprovalExecutionResource compiles (0 warnings)
- [ ] 12 unit tests passing (ApprovalExecutionServiceTest + TokenStateTransitionManagerTest)
- [ ] DTOs validated with constraints
- [ ] OpenAPI documentation generated

---

### DAY 3: Wednesday, Jan 1 - Integration Tests & Performance

**Goal**: Complete integration tests and validate performance

#### Morning Session (8:00 - 12:00)

**Task 3.1**: ApprovalExecutionResource Unit Tests (90 min)
```bash
Location: src/test/java/io/aurigraph/v11/api/ApprovalExecutionResourceTest.java
Subtask:
  - Test 1: testExecuteManualApproval (20 LOC)
    POST /approve-execution/{versionId}/execute-manual
    Verify: 200 response, ExecutionResult returned

  - Test 2: testExecuteManualApprovalNotFound (10 LOC)
    POST with invalid versionId
    Verify: 404 Not Found

  - Test 3: testRollbackApproval (20 LOC)
    POST /approval-execution/{versionId}/rollback
    Verify: 200 response, RollbackResult returned

  - Test 4: testGetExecutionStatus (15 LOC)
    GET /approval-execution/{versionId}/status
    Verify: 200 response with ExecutionStatusDto

  - Test 5: testGetAuditTrail (20 LOC)
    GET /approval-execution/{versionId}/audit
    Verify: 200 response with complete audit entries

  - Test 6: testGetPendingExecutions (10 LOC)
    GET /approval-execution/pending-executions
    Verify: 200 response with List<PendingExecutionDto>

  - Test 7: testGetExecutionMetrics (15 LOC)
    GET /approval-execution/execution-metrics
    Verify: 200 response with ExecutionMetricsDto

Size: 110 LOC, 7 tests
Testing: REST Assured, JSON validation, error responses
```

**Task 3.2**: Integration Tests - Event-Driven Workflow (90 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/ApprovalExecutionIntegrationTest.java
Subtask:
  - Test 1: testApprovalEventToActivationWorkflow (40 LOC)
    - Create SecondaryTokenVersion (PENDING_VVB)
    - Create VVBApprovalRequest
    - Fire ApprovalEvent
    - Verify: event caught by ApprovalExecutionService
    - Verify: version transitioned to ACTIVE
    - Verify: TokenActivatedEvent fired
    - Verify: metadata persisted
    Performance assertion: <500ms total

  - Test 2: testApprovalWithCascadeRetirement (50 LOC)
    - Create v1 (ACTIVE)
    - Create v2 (PENDING_VVB, parentVersionId = v1)
    - Fire ApprovalEvent for v2
    - Verify: v2 → ACTIVE
    - Verify: v1 → REPLACED
    - Verify: TokenVersionRetiredEvent fired
    Performance assertion: <800ms total

  - Test 3: testApprovalFailureRecovery (40 LOC)
    - Create version with constraints
    - Fire ApprovalEvent
    - Revenue service throws exception
    - Verify: version still ACTIVE (separation of concerns)
    - Verify: RevenueStreamSetupFailed event fired
    - Verify: Audit trail shows phases

Size: 130 LOC, 3 tests
Setup: @QuarkusTest with TestResource, in-memory DB, event subscribers
```

#### Afternoon Session (13:00 - 17:00)

**Task 3.3**: Performance Benchmark Tests (60 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/ApprovalExecutionPerformanceTest.java
Subtask:
  - Test 1: testSingleApprovalExecution (25 LOC)
    - Execute 1 approval
    - Measure: approval → ACTIVE transition time
    - Assert: <100ms
    - P95: <150ms, P99: <200ms

  - Test 2: testConcurrentApprovalExecutions (35 LOC)
    - Execute 50 concurrent approvals
    - Measure: throughput, latency distribution
    - Assert: >100 approvals/second
    - Assert: P95 <200ms

  - Test 3: testStateTransitionPerformance (20 LOC)
    - Execute 1000 state transitions
    - Measure: state machine validation + persistence
    - Assert: <20ms validation, <50ms total

Size: 80 LOC, 3 tests (performance benchmarks)
Tools: System.nanoTime(), quantiles, throughput calculations
```

**Task 3.4**: Cascade Retirement Tests (60 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/CascadeRetirementTest.java
Subtask:
  - Test 1: testSimpleCascadeRetirement (25 LOC)
    - v1 ACTIVE, v2 PENDING_VVB (child of v1)
    - Execute v2 approval
    - Verify: v1 → REPLACED → ARCHIVED (scheduled)

  - Test 2: testCascadeWithActiveChildren (20 LOC)
    - v1 ACTIVE with v2, v3 (children, also ACTIVE)
    - Try to retire v1
    - Verify: retirement blocked (safe guard)

  - Test 3: testMultipleLevelCascade (25 LOC)
    - v1 → v2 → v3 hierarchy
    - Execute v3 approval
    - Verify: v2 → REPLACED, v1 remains ACTIVE (depth limit)

  - Test 4: testCascadeTimeout (15 LOC)
    - Cascade takes >30s
    - Verify: timeout handler stops cascade
    - Verify: error logged, alert fired

Size: 85 LOC, 4 tests
```

**Task 3.5**: Audit Trail Validation (30 min)
```bash
Location: Same test file, additional test methods
Subtask:
  - Verify all 6 phases logged:
    INITIATED, VALIDATED, TRANSITIONED, COMPLETED, FAILED, ROLLED_BACK
  - Verify metadata captured (executor, approval count, threshold, etc)
  - Verify timestamps precise and ordered
  - Verify immutability (no updates to audit entries)

Additional: 20 LOC in test methods
```

**Day 3 Completion Criteria**:
- [ ] 30+ integration tests passing
- [ ] Performance targets validated (<500ms approval execution)
- [ ] Cascade retirement tested (4 scenarios)
- [ ] Audit trail recording verified
- [ ] All services integrated and working end-to-end

---

### DAY 4: Thursday, Jan 2 - Testing, Documentation, & Deployment Prep

**Goal**: Complete all tests, documentation, and prepare for deployment

#### Morning Session (8:00 - 12:00)

**Task 4.1**: Rollback Scenario Tests (90 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/ApprovalExecutionRollbackTest.java
Subtask:
  - Test 1: testManualRollbackFromActive (20 LOC)
    - Version in ACTIVE
    - Call rollback()
    - Verify: ACTIVE → PENDING_VVB
    - Verify: approval metadata cleared
    - Verify: ApprovalExecutionRolledBack event fired

  - Test 2: testRollbackWithParentUpdate (25 LOC)
    - v1 ACTIVE, v2 transitioned to ACTIVE
    - Parent update fails
    - Verify: rollback triggered automatically
    - Verify: v2 → PENDING_VVB
    - Verify: parent unchanged

  - Test 3: testRollbackCascadeRecovery (20 LOC)
    - v1 → REPLACED, v2 ACTIVE
    - Revenue service fails
    - Verify: v1 restored from REPLACED → ACTIVE
    - Verify: v2 rolled back to PENDING_VVB

  - Test 4: testRollbackAuditTrail (15 LOC)
    - Verify ROLLED_BACK phase recorded
    - Verify reason captured
    - Verify previous/current status logged

  - Test 5: testRollbackAuthorization (10 LOC)
    - Non-admin tries rollback
    - Verify: 403 Forbidden

Size: 90 LOC, 5 tests
```

**Task 4.2**: Error Scenario Tests (60 min)
```bash
Location: src/test/java/io/aurigraph/v11/token/secondary/ApprovalExecutionErrorTest.java
Subtask:
  - Test 1: testVersionNotFound (10 LOC)
  - Test 2: testInvalidStateTransition (10 LOC)
  - Test 3: testDatabaseFailure (15 LOC)
  - Test 4: testParentTokenNotFound (10 LOC)
  - Test 5: testConcurrentApprovalConflict (15 LOC)

Size: 60 LOC, 5 tests
Coverage: All 5 error scenarios from architecture
```

**Task 4.3**: Finalize & Review (30 min)
```bash
Subtask:
  - Run full test suite: ./mvnw verify
  - Verify: 150+ tests passing
  - Check code coverage: target 95%+
  - Fix any lint issues
  - Code review checklist:
    [ ] All methods documented (Javadoc)
    [ ] Error handling consistent
    [ ] Logging levels appropriate
    [ ] Transaction boundaries correct
    [ ] No N+1 queries
    [ ] No hard-coded values

Result: Zero test failures, zero compiler warnings
```

#### Afternoon Session (13:00 - 17:00)

**Task 4.4**: Documentation & Runbooks (90 min)
```bash
Documents to create/update:
  1. STORY-6-OPERATIONAL-RUNBOOK.md (new)
     - How to manually execute approval
     - How to rollback an approval
     - How to investigate failures
     - Troubleshooting guide

  2. STORY-6-API-REFERENCE.md (new)
     - All endpoints documented
     - Request/response examples
     - Error codes and recovery

  3. Update TODO.md
     - Mark Story 6 as COMPLETE
     - Highlight completion metrics
     - Document known issues (if any)

  4. Update SPRINT-1-EXECUTION-REPORT.md
     - Add Story 6 completion details
     - Performance metrics
     - Test coverage results

Size: 150 LOC documentation
```

**Task 4.5**: Pre-Deployment Validation (60 min)
```bash
Checklist:
  [ ] Database migrations tested (V31 applies cleanly)
  [ ] All 150+ tests passing
  [ ] Code compiles with 0 warnings
  [ ] Performance targets met:
      - Single approval <100ms ✓
      - 50 concurrent <200ms p95 ✓
      - Cascade <800ms ✓
  [ ] Audit trail complete (6 phases)
  [ ] Event integration verified
  [ ] Error handling comprehensive
  [ ] Security validation:
      - No SQL injection
      - No credential leaks
      - RBAC enforced
  [ ] Documentation complete
  [ ] Team trained on runbooks

Result: Green light for deployment
```

**Task 4.6**: Commit & Tag (30 min)
```bash
Git operations:
  - Stage all new files: git add .
  - Commit message:
    "feat(AV11-601-06): Approval execution & state transitions

    Implement approval execution phase that transitions token versions
    from PENDING_VVB to ACTIVE when VVB consensus is reached.

    - ApprovalExecutionService: CDI event listener + orchestration
    - TokenStateTransitionManager: state machine integration
    - ApprovalExecutionResource: REST API (execute, rollback, audit)
    - Cascade retirement: automatic retirement of old versions
    - Comprehensive error handling & rollback procedures
    - 150+ tests with 95%+ coverage
    - Performance: <500ms approval to active transition
    - Audit trail: 6-phase execution tracking
    - Integration with Story 4 (versioning) & Story 5 (VVB voting)

    Tests: 150 passing (ApprovalExecutionService, TokenStateTransition,
    Resource, Integration, Performance, Cascade, Rollback, Error scenarios)
    Coverage: 95%+
    Performance: Approval execution <100ms, concurrent 50/sec, cascade <800ms"

  - Tag: git tag -a v12.0.0-story6-complete -m "Story 6 complete"
  - Push: git push origin main && git push origin v12.0.0-story6-complete
```

**Day 4 Completion Criteria**:
- [ ] 150+ tests passing (100%)
- [ ] Code coverage 95%+
- [ ] Zero compiler warnings
- [ ] All documentation complete
- [ ] Performance targets validated
- [ ] Committed and tagged
- [ ] Ready for deployment

---

## 3. Testing Matrix: 150+ Tests Breakdown

### Unit Tests (80 tests)
| Component | Tests | Coverage |
|-----------|-------|----------|
| ApprovalExecutionService | 25 | Happy path, errors, cascade, rollback |
| TokenStateTransitionManager | 15 | Transitions, audit, rollback |
| ApprovalExecutionResource | 20 | All endpoints, error responses |
| Cascade Retirement | 12 | Simple, complex, timeout |
| Rollback Scenarios | 8 | Manual, auto, recovery |

### Integration Tests (35 tests)
| Scenario | Tests |
|----------|-------|
| Event-driven workflow | 5 |
| End-to-end approval execution | 10 |
| Cascade retirement integration | 8 |
| Failure recovery & compensation | 12 |

### Performance Tests (20 tests)
| Benchmark | Tests |
|-----------|-------|
| Single approval execution | 5 |
| Concurrent approvals | 8 |
| State machine performance | 4 |
| Cascade performance | 3 |

### Error Scenario Tests (15 tests)
| Error | Tests |
|-------|-------|
| Version not found | 2 |
| Invalid state transition | 3 |
| Database failures | 3 |
| Parent token issues | 2 |
| Concurrent conflicts | 2 |
| Authorization failures | 3 |

**Total**: 80 + 35 + 20 + 15 = **150 tests**

---

## 4. Code Quality Targets

### Coverage Targets
- **Overall**: 95%+
- **ApprovalExecutionService**: 98%
- **TokenStateTransitionManager**: 98%
- **ApprovalExecutionResource**: 95%
- **Critical paths**: 100%

### Performance Targets
| Operation | Target | P95 | P99 |
|-----------|--------|-----|-----|
| Approval execution | <100ms | <150ms | <200ms |
| State validation | <20ms | <30ms | <50ms |
| Concurrent (50) | <200ms | <250ms | <300ms |

### Code Standards
- Zero compiler warnings
- Javadoc on all public methods
- Consistent error handling
- Proper transaction boundaries
- No N+1 queries
- No hard-coded values
- Thread-safe implementations

---

## 5. Risk Mitigation

### High-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| State machine constraint violation | Medium | High | Extensive unit tests, pessimistic locking |
| Concurrent approval conflicts | Low | High | Optimistic locking, version.updatedAt |
| Parent token update deadlock | Low | High | Timeout, async execution, retry logic |
| Cascade retirement cascades too far | Low | Medium | Depth limit (3 levels), safe guards |
| Event ordering issues | Low | High | Transactional events, explicit ordering |

### Mitigation Strategies
1. Comprehensive test coverage (150 tests)
2. Performance validation under load
3. Error scenario testing
4. Manual rollback procedures (on-call runbook)
5. Feature flag deployment (disable if critical issues)

---

## 6. Dependencies & Prerequisites

### Internal Dependencies
- Story 4 (SecondaryTokenVersioningService, SecondaryTokenVersionStateMachine)
- Story 5 (VVBApprovalService, ApprovalEvent)
- Secondary Token Registry (from Story 3)

### External Dependencies
- Jakarta EE (CDI, JPA, REST)
- Quarkus 3.26.2
- PostgreSQL database
- REST Assured (testing)
- JUnit 5

### Data Dependencies
- VVBApprovalRequest table (from Story 5)
- SecondaryTokenVersion table (from Story 4)
- Validators list (from Story 5)

---

## 7. Team Allocation

### 2-Person Team Structure

**Engineer 1 (Days 1-2)**:
- Database migration (V31)
- ApprovalExecutionService implementation
- TokenStateTransitionManager implementation
- Unit test infrastructure

**Engineer 2 (Days 1-2)**:
- ApprovalExecutionResource implementation
- DTO classes
- Integration test setup
- OpenAPI documentation

**Both (Days 3-4)**:
- Integration testing
- Performance benchmarking
- Error scenario testing
- Documentation & deployment prep
- Code review & merge

---

## 8. Success Criteria

By EOD Jan 2, 2025:

- [ ] All 3 services implemented (700 LOC core)
- [ ] 150+ tests passing (100% pass rate)
- [ ] Code coverage 95%+
- [ ] Zero compiler warnings
- [ ] Performance targets met (<500ms approval execution)
- [ ] Database migrations applied successfully
- [ ] Event integration verified (ApprovalEvent consumed)
- [ ] Audit trail operational (all 6 phases logged)
- [ ] Error scenarios handled (5 scenarios tested)
- [ ] Rollback procedures validated
- [ ] Cascade retirement tested (4 scenarios)
- [ ] Documentation complete (runbooks, API reference)
- [ ] Code committed and tagged
- [ ] Team trained and ready for deployment
- [ ] Story 6 marked COMPLETE in JIRA

---

## 9. Appendix: Test Checklist Template

```java
// Example test structure for reference
@QuarkusTest
public class ApprovalExecutionServiceTest {

    @Inject
    ApprovalExecutionService service;

    @Inject
    SecondaryTokenVersionRepository repository;

    @Inject
    VVBApprovalService vvbService;

    @BeforeEach
    void setup() {
        // Reset registry, mocks, test data
    }

    @Test
    void testExecuteApprovalSuccess() {
        // ARRANGE: Create version, approval request
        UUID versionId = createTestVersion(PENDING_VVB);
        UUID requestId = createTestApproval(versionId, APPROVED);

        // ACT: Execute approval
        long startTime = System.nanoTime();
        service.executeApproval(requestId);
        long duration = (System.nanoTime() - startTime) / 1_000_000;

        // ASSERT: Verify transition
        SecondaryTokenVersion version = repository.findById(versionId);
        assertEquals(ACTIVE, version.getStatus());
        assertTrue(duration < 100, "Execution took " + duration + "ms");
        assertNotNull(version.getActivatedAt());
    }

    // ... more tests following same pattern
}
```

---

**End of Story 6 Implementation Plan**
