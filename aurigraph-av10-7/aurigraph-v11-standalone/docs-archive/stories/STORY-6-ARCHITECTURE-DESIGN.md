# Story 6 Architecture Design: Approval Execution & State Transitions
## AV11-601-06: Implementation Plan for Approval Execution Phase

**Document Version**: 1.0
**Sprint**: 1, Story 6
**Duration**: 4 days (Dec 30 - Jan 2)
**Story Points**: 5 SP
**Audience**: Development Team, Architects
**Status**: Ready for Implementation

---

## Executive Summary

Story 6 (AV11-601-06) implements the approval execution phase when VVB approvals are granted. This is the critical transition from "approval pending" to "token active" that completes the token lifecycle governance model. The architecture ensures atomicity, consistency, and reliability across state transitions while maintaining Byzantine Fault Tolerance guarantees.

### Key Objectives
- Execute state transitions when ApprovalEvent is fired
- Transition token versions from PENDING_VVB to ACTIVE in <500ms
- Integrate with token lifecycle state machine (Story 4)
- Handle approval failures and rollback scenarios
- Maintain audit trail of all state transitions
- Support cascade actions (retire previous versions)

---

## 1. Approval Execution Workflow

### 1.1 High-Level Flow

```
VVB Approval Complete (Story 5)
    ↓
ApprovalEvent fired (from VVBApprovalService)
    ↓
ApprovalExecutionService listens to ApprovalEvent
    ↓
Validate approval metadata and permissions
    ↓
TokenStateTransitionManager executes transition
    ↓
PENDING_VVB → ACTIVE state transition
    ↓
TokenActivatedEvent fired
    ↓
Revenue stream setup (event subscribers)
    ↓
Audit logging and metrics recording
    ↓
ApprovalExecutionCompleted event fired
```

### 1.2 Approval Request Data Structure

The approval request carries execution metadata:

```java
VVBApprovalRequest {
  requestId: UUID                    // Unique approval request ID
  tokenVersionId: UUID               // Token version being approved
  approvalThreshold: double          // Consensus threshold (66.67%)
  votingWindowEnd: LocalDateTime     // Voting deadline
  approvalCount: int                 // Number of YES votes
  rejectionCount: int                // Number of NO votes
  abstainCount: int                  // Number of ABSTAIN votes
  totalValidators: int               // Total eligible validators
  status: ApprovalStatus             // PENDING, APPROVED, REJECTED, EXPIRED
  createdAt: LocalDateTime
  updatedAt: LocalDateTime
}
```

### 1.3 State Transition Rules

**Valid Approval-Triggered Transition**:
```
PENDING_VVB → ACTIVE (upon ApprovalEvent)

Preconditions:
- Token version status is PENDING_VVB
- Approval consensus reached (>2/3 majority)
- No blocker holds (version locked, etc.)

Actions:
- Update version status to ACTIVE
- Set activatedAt timestamp
- Generate/finalize Merkle hash
- Update parent token status if needed
- Record approval metadata

Postconditions:
- Version is ACTIVE and can be used
- VersionActivatedEvent fired
- Audit trail recorded
```

### 1.4 Approval Metadata Storage

Extend `SecondaryTokenVersion` with approval tracking fields:

```sql
ALTER TABLE secondary_token_versions ADD COLUMN (
  approval_request_id UUID,                    -- Links to VVB approval
  approval_threshold_percentage DOUBLE,         -- 66.67, 75.0, etc.
  approved_by_count INT DEFAULT 0,             -- # of approvers
  approval_timestamp TIMESTAMP,                -- When approval reached
  approvers_list TEXT,                         -- JSON array of approver IDs
  approval_expiry_deadline TIMESTAMP,          -- When approval expires
  previous_version_retired_at TIMESTAMP        -- When old version was retired
);

-- Indexes for fast lookups
CREATE INDEX idx_approval_request_id ON secondary_token_versions(approval_request_id);
CREATE INDEX idx_approval_timestamp ON secondary_token_versions(approval_timestamp);
```

---

## 2. Event-Driven Execution Architecture

### 2.1 Event Flow: Approval → Activation → Revenue Setup

```
┌─────────────────────────────────────────────────────────────────┐
│ VVBApprovalService (Story 5) - APPROVAL CONSENSUS REACHED       │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                      ApprovalEvent
                    (requestId, versionId)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ ApprovalExecutionService - LISTENS TO ApprovalEvent             │
│ 1. Validate approval request exists and status
│ 2. Load token version from registry
│ 3. Check state machine allows transition
│ 4. Execute TokenStateTransitionManager
└─────────────────────────────────────────────────────────────────┘
                             ↓
                   TokenStateTransitionManager
              Executes: PENDING_VVB → ACTIVE
                             ↓
          ┌───────────────────────────────────┐
          │ Update Token Version Entity        │
          │ - Set status to ACTIVE            │
          │ - Record activatedAt timestamp    │
          │ - Store approval_request_id       │
          │ - Update parent tracking          │
          └───────────────────────────────────┘
                             ↓
                   VersionActivatedEvent
              (versionId, parentTokenId, hash)
                             ↓
          ┌───────────────────────────────────┐
          │ TokenActivatedEvent (for Revenue) │
          │ - Consumed by RevenueService      │
          │ - Initiate settlement flows       │
          │ - Setup revenue streams           │
          └───────────────────────────────────┘
                             ↓
              ┌─────────────────────────────┐
              │ Cascade Actions (Optional)  │
              │ - Retire previous version   │
              │ - Cleanup old token state   │
              │ - Archive superseded refs   │
              └─────────────────────────────┘
```

### 2.2 Event Handlers and Subscribers

**ApprovalExecutionService** subscribes to:
- `ApprovalEvent` - Triggers execution

**Fires Events**:
- `TokenStateTransitionEvent` - State change initiated
- `ApprovalExecutionCompleted` - Execution finished
- `ApprovalExecutionFailed` - Error occurred

**Event Ordering Guarantee**:
1. ApprovalEvent (from VVBApprovalService)
2. TokenStateTransitionEvent (from ApprovalExecutionService)
3. TokenActivatedEvent (from TokenStateTransitionManager)
4. ApprovalExecutionCompleted (from ApprovalExecutionService)

---

## 3. Integration with Token Lifecycle State Machine (Story 4)

### 3.1 State Machine Overview

The SecondaryTokenVersionStateMachine enforces valid transitions:

```
CREATED → {PENDING_VVB, ACTIVE, REJECTED, EXPIRED}
PENDING_VVB → {ACTIVE, REJECTED, EXPIRED}  ← Story 6 operates here
ACTIVE → {REPLACED, ARCHIVED, EXPIRED}
REPLACED → ARCHIVED
REJECTED → ARCHIVED
EXPIRED → ARCHIVED
ARCHIVED → (terminal)
```

### 3.2 Story 6 Integration Points

**Before Execution**:
- Verify current state is PENDING_VVB
- Call `stateMachine.getAllowedTransitions(PENDING_VVB)`
- Confirm ACTIVE is in allowed set

**During Execution**:
- Call `stateMachine.transitionState(version, ACTIVE)`
- Validate via `stateMachine.canTransition(PENDING_VVB, ACTIVE)`

**After Execution**:
- Verify version.status == ACTIVE
- Record state change in audit trail
- Execute entry actions for ACTIVE state

### 3.3 State Entry/Exit Actions

**Exit PENDING_VVB**:
```java
// In SecondaryTokenVersionStateMachine.executeStateExitAction()
case PENDING_VVB:
    // VVB approval decision made
    if (version.getVvbApprovedAt() == null) {
        version.setVvbApprovedAt(LocalDateTime.now());
    }
    log.debug("VVB approval workflow completed for version {}", version.getId());
    break;
```

**Enter ACTIVE**:
```java
// In SecondaryTokenVersionStateMachine.executeStateEntryAction()
case ACTIVE:
    // Version is now active
    // Generate Merkle hash if not present
    if (version.getMerkleHash() == null) {
        // Note: Hash generation done by service layer
        log.debug("Version {} activated, awaiting Merkle hash", version.getId());
    }
    log.info("Version {} is now ACTIVE", version.getId());
    break;
```

---

## 4. Error Handling & Failure Recovery

### 4.1 Error Scenarios & Recovery Strategies

#### Scenario 1: Version Not Found
```
Error: ApprovalEvent references non-existent version
Recovery:
  - Log error with approval request ID
  - Fire ApprovalExecutionFailed event
  - Manual intervention: check VVB approval registry
  - Retry with correct version ID
```

#### Scenario 2: Invalid State Transition
```
Error: State machine rejects PENDING_VVB → ACTIVE transition
Recovery:
  - Verify version is in PENDING_VVB (not already ACTIVE)
  - Check for concurrent state changes
  - Implement optimistic locking if needed
  - Log exception, fire ApprovalExecutionFailed
```

#### Scenario 3: Database Transaction Failure
```
Error: Failed to persist state change
Recovery:
  - Transaction rolled back automatically
  - Fire ApprovalExecutionFailed event
  - Retry with exponential backoff (3 attempts)
  - After 3 failures, manual review required
```

#### Scenario 4: Parent Token Update Fails
```
Error: Cannot update parent token status
Recovery:
  - Revert version to PENDING_VVB (compensating transaction)
  - Log error with parent token ID
  - Alert operations team
  - Retry after parent issue resolved
```

#### Scenario 5: Revenue Stream Setup Fails
```
Error: RevenueService cannot initialize settlement
Recovery:
  - Version already ACTIVE (separation of concerns)
  - Revenue setup is secondary operation
  - Log error, fire RevenueStreamSetupFailed event
  - Retry revenue setup without blocking activation
  - Manual intervention if persistent
```

### 4.2 Rollback Procedures

**Automatic Rollback Triggers**:
1. State transition rejects (state machine validation)
2. Database constraint violation
3. Parent token not found
4. Approval metadata inconsistency

**Rollback Implementation**:
```java
@Transactional
public void rollbackApprovalExecution(UUID versionId, String reason) {
    // 1. Load version
    SecondaryTokenVersion version = getVersion(versionId);

    // 2. Verify it's in ACTIVE (just transitioned)
    if (version.getStatus() != ACTIVE) {
        throw new IllegalStateException("Can only rollback ACTIVE versions");
    }

    // 3. Revert to PENDING_VVB using state machine
    stateMachine.transitionState(version, PENDING_VVB);

    // 4. Clear approval metadata
    version.setActivatedAt(null);
    version.setVvbApprovedAt(null);

    // 5. Persist and fire event
    versionRepository.persist(version);
    approvalExecutionRolledBackEvent.fire(
        new ApprovalExecutionRolledBack(versionId, reason)
    );

    log.warn("Rolled back approval execution for version {}: {}",
        versionId, reason);
}
```

**Manual Rollback Endpoint**:
```
POST /api/v12/approval-execution/{versionId}/rollback
Request: { "reason": "Parent token update failed" }
Response: {
    "versionId": UUID,
    "previousStatus": "ACTIVE",
    "newStatus": "PENDING_VVB",
    "timestamp": LocalDateTime
}
```

---

## 5. Cascade Actions: Version Retirement

### 5.1 Previous Version Retirement Strategy

When a new token version is approved and activated:

```
Old Token Version (v1)                New Token Version (v2)
Status: ACTIVE                        Status: PENDING_VVB
    ↓                                     ↓
    │                                Approval Consensus
    │                                     ↓
    │                            ApprovalEvent fired
    │                                     ↓
    └─→ Detect: v2 is child of v1   ←────┘
        (REPLACED cascade action)         │
            ↓                              │
        Check: countActiveByParent(v1)    │
            ↓                              │
            YES: Can retire v1 safely     │
            ↓                              │
        v1: ACTIVE → REPLACED → ARCHIVED  │
            ↓                              │
        Clear v1's dependent tokens       │
        Archive composite references      │
            ↓                              │
        Fire TokenVersionRetiredEvent     │
```

### 5.2 Cascade Configuration

```java
@Data
public class ApprovalExecutionConfig {
    // Enable automatic previous version retirement
    private boolean enableAutomaticRetirement = true;

    // Retention period before archive
    private Duration retentionDuration = Duration.ofDays(365);

    // Composite tokens referencing old version
    private RetentionPolicy compositeRetentionPolicy =
        RetentionPolicy.KEEP_ACTIVE;  // Don't cascade to composites

    // Maximum cascade depth (prevent runaway retirements)
    private int maxCascadeDepth = 3;

    // Timeout for cascade operations
    private Duration cascadeTimeout = Duration.ofSeconds(30);
}
```

### 5.3 Cascade Execution

```java
@Transactional
public void executeCascadeRetirement(UUID newVersionId,
                                      UUID previousVersionId) {
    // 1. Verify previous version exists and is ACTIVE
    SecondaryTokenVersion prevVersion = getVersion(previousVersionId);
    if (prevVersion.getStatus() != ACTIVE) {
        log.debug("Previous version not ACTIVE, skipping cascade");
        return;
    }

    // 2. Check if safe to retire (no active children)
    int activeChildCount = registry.countActiveByParent(previousVersionId);
    if (activeChildCount > 0) {
        log.warn("Cannot retire version {} - has {} active children",
            previousVersionId, activeChildCount);
        return;  // Don't retire, leave active for backwards compatibility
    }

    // 3. Transition previous version to REPLACED
    stateMachine.transitionState(prevVersion, REPLACED);
    prevVersion.setReplacedAt(LocalDateTime.now());
    prevVersion.setReplacedByVersionId(newVersionId);
    versionRepository.persist(prevVersion);

    // 4. Schedule archival after retention period
    scheduleArchival(previousVersionId, retentionDuration);

    // 5. Fire cascade event
    tokenVersionRetiredEvent.fire(
        new TokenVersionRetiredEvent(
            previousVersionId, newVersionId, LocalDateTime.now()
        )
    );

    log.info("Cascaded retirement: {} → REPLACED (by {})",
        previousVersionId, newVersionId);
}
```

---

## 6. Performance & Reliability Targets

### 6.1 Performance Requirements

| Operation | Target | Acceptable | Critical |
|-----------|--------|-----------|----------|
| Approval → ACTIVE transition | <100ms | <200ms | <500ms |
| State machine validation | <5ms | <10ms | <20ms |
| Approval metadata persistence | <50ms | <100ms | <200ms |
| Event firing & propagation | <10ms | <50ms | <100ms |
| Cascade retirement detection | <20ms | <50ms | <100ms |
| Total E2E approval execution | <300ms | <400ms | <500ms |

### 6.2 Reliability Guarantees

**Atomicity**: All-or-nothing state transitions
- Database transaction encompasses: load → validate → transition → persist
- Rollback on any failure (database constraint, validation error)
- No partial state updates

**Consistency**: State machine validation
- All transitions checked before execution
- Only valid state progressions allowed
- Timeout rules enforced

**Durability**: Database persistence
- PostgreSQL ACID guarantees
- Approval metadata stored permanently
- Audit trail immutable

**Isolation**: Concurrent execution safety
- ConcurrentHashMap for registry
- Optimistic locking on version entity
- Version.updatedAt prevents stale updates

### 6.3 Throughput Goals

- **Approval Executions per Second**: >100 (supports high-volume token governance)
- **Concurrent Approvals**: >50 (multiple VVB requests in parallel)
- **Registry Lookup Performance**: <5ms (approval → token version resolution)

---

## 7. Integration with Story 4 (Versioning) & Story 5 (VVB Voting)

### 7.1 Story 4 Integration: Versioning System

Story 4 provides:
- `SecondaryTokenVersion` entity with state machine
- `SecondaryTokenVersionStateMachine` for state transitions
- Version lifecycle management (CREATED → ACTIVE → ARCHIVED)

Story 6 consumes:
- State machine to validate PENDING_VVB → ACTIVE
- Version entity to update status and metadata
- Version repository for persistence

### 7.2 Story 5 Integration: VVB Approval Voting

Story 5 provides:
- `VVBApprovalService` for consensus calculation
- `VVBApprovalRegistry` for vote tracking
- `ApprovalEvent` when consensus reached

Story 6 consumes:
- ApprovalEvent as trigger for execution
- VVBApprovalRequest metadata for audit trail
- Approval threshold and vote counts

### 7.3 Data Flow Across Stories

```
Story 4 (Versioning)
  ↓
  Creates SecondaryTokenVersion
  Status: CREATED or PENDING_VVB
  ↓
Story 5 (VVB Voting)
  ↓
  Creates VVBApprovalRequest
  Collects validator votes
  Calculates consensus
  Fires ApprovalEvent
  ↓
Story 6 (Approval Execution)
  ↓
  Listens to ApprovalEvent
  Executes state transition
  Fires TokenActivatedEvent
  ↓
Revenue/Settlement Systems
  ↓
  Listen to TokenActivatedEvent
  Setup settlement flows
```

---

## 8. Database Schema Changes

### 8.1 New Columns for Secondary Token Versions

```sql
-- Track approval lifecycle
ALTER TABLE secondary_token_versions ADD COLUMN (
  approval_request_id UUID REFERENCES vvb_approval_requests(id),
  approval_threshold_percentage DECIMAL(5,2),
  approved_by_count INTEGER DEFAULT 0,
  approval_timestamp TIMESTAMP,
  approvers_list TEXT,  -- JSON: ["validator1", "validator2"]
  approval_expiry_deadline TIMESTAMP,
  previous_version_retired_at TIMESTAMP,
  replaced_by_version_id UUID REFERENCES secondary_token_versions(id),
  activated_at TIMESTAMP
);

-- Support cascade queries
CREATE INDEX idx_approval_request_id
  ON secondary_token_versions(approval_request_id);
CREATE INDEX idx_replaced_by_version_id
  ON secondary_token_versions(replaced_by_version_id);
CREATE INDEX idx_activated_at
  ON secondary_token_versions(activated_at);

-- Support performance queries
CREATE INDEX idx_status_activated
  ON secondary_token_versions(status, activated_at);
```

### 8.2 Audit Trail Table

```sql
CREATE TABLE approval_execution_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES secondary_token_versions(id),
  approval_request_id UUID REFERENCES vvb_approval_requests(id),
  execution_phase VARCHAR(50),  -- INITIATED, VALIDATED, TRANSITIONED, COMPLETED, FAILED, ROLLED_BACK
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  executed_by VARCHAR(100),  -- System or user ID
  execution_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT,
  metadata JSONB,

  CONSTRAINT execution_phase_check CHECK (
    execution_phase IN ('INITIATED', 'VALIDATED', 'TRANSITIONED',
                        'COMPLETED', 'FAILED', 'ROLLED_BACK')
  )
);

CREATE INDEX idx_version_id ON approval_execution_audit(version_id);
CREATE INDEX idx_approval_request_id ON approval_execution_audit(approval_request_id);
CREATE INDEX idx_execution_timestamp ON approval_execution_audit(execution_timestamp);
```

---

## 9. API Specification

### 9.1 REST Endpoints

#### Execute Approval (Automatic)
```
POST /api/v12/approval-execution/execute
Triggered automatically by ApprovalEvent (no manual call needed)

Response: 202 Accepted
{
  "executionId": UUID,
  "versionId": UUID,
  "approvalRequestId": UUID,
  "status": "INITIATED",
  "estimatedDuration": "300ms"
}
```

#### Manual Approval Execution (Fallback)
```
POST /api/v12/approval-execution/{versionId}/execute-manual
Request:
{
  "approvalRequestId": UUID,
  "executedBy": "admin@system.io",
  "reason": "Manual override - automatic execution stalled"
}

Response: 200 OK
{
  "versionId": UUID,
  "previousStatus": "PENDING_VVB",
  "newStatus": "ACTIVE",
  "timestamp": LocalDateTime,
  "executionDuration": "145ms"
}
```

#### Rollback Approval Execution
```
POST /api/v12/approval-execution/{versionId}/rollback
Request:
{
  "reason": "Revenue service failed - rolling back to pending",
  "executedBy": "ops@system.io"
}

Response: 200 OK
{
  "versionId": UUID,
  "previousStatus": "ACTIVE",
  "newStatus": "PENDING_VVB",
  "timestamp": LocalDateTime,
  "reason": "Revenue service failed - rolling back to pending"
}
```

#### Get Approval Execution Status
```
GET /api/v12/approval-execution/{versionId}/status

Response: 200 OK
{
  "versionId": UUID,
  "approvalRequestId": UUID,
  "currentStatus": "ACTIVE",
  "transitionedAt": LocalDateTime,
  "executionDuration": "145ms",
  "approverCount": 8,
  "approvalThreshold": 66.67,
  "auditTrail": [
    {
      "phase": "INITIATED",
      "timestamp": LocalDateTime,
      "details": "Execution started"
    },
    ...
  ]
}
```

#### Get Execution Audit Trail
```
GET /api/v12/approval-execution/{versionId}/audit

Response: 200 OK
{
  "versionId": UUID,
  "auditEntries": [
    {
      "id": UUID,
      "phase": "INITIATED",
      "previousStatus": "PENDING_VVB",
      "newStatus": null,
      "executedBy": "SYSTEM",
      "timestamp": LocalDateTime,
      "metadata": {...}
    },
    ...
  ]
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (25+ cases)
- Approval event parsing and validation
- State transition execution
- Cascade retirement logic
- Rollback scenarios

### 10.2 Integration Tests (15+ cases)
- Full approval → activation workflow
- Event firing and propagation
- Database persistence
- Concurrent approval executions

### 10.3 Performance Tests (5+ cases)
- Single approval execution <100ms
- 100 concurrent approvals
- State machine validation performance
- Registry lookup performance

### 10.4 Failure Recovery Tests (10+ cases)
- Version not found handling
- Invalid state transitions
- Database failures
- Cascade failures

---

## 11. Security & Compliance

### 11.1 Access Control
- Approval execution automatic (triggered by ApprovalEvent)
- Manual execution requires Admin role
- Rollback requires Admin + Ops roles

### 11.2 Audit Trail
- Every state transition logged
- Approval metadata captured
- Executor/approver IDs recorded
- Failure reasons documented

### 11.3 Data Integrity
- UUID primary keys (globally unique)
- Database constraints on valid statuses
- Optimistic locking on concurrent updates
- Immutable audit trail

---

## 12. Deployment & Rollout

### 12.1 Deployment Checklist
- [ ] Database migrations applied (approval metadata columns)
- [ ] ApprovalExecutionService deployed
- [ ] TokenStateTransitionManager deployed
- [ ] ApprovalExecutionResource endpoints tested
- [ ] Event subscribers registered
- [ ] Audit trail logging enabled
- [ ] Rollback procedures documented
- [ ] On-call team trained

### 12.2 Rollback Plan
- If ApprovalExecutionService fails: disable event listener
- Approvals revert to manual execution via REST API
- Existing PENDING_VVB approvals remain pending
- No data loss (all metadata persisted)

---

## 13. Monitoring & Observability

### 13.1 Metrics to Track
- Approval execution count (success/failure)
- Approval → ACTIVE transition latency (p50, p95, p99)
- State transition failures by reason
- Rollback frequency and causes
- Cascade retirement success rate
- Event propagation latency

### 13.2 Alerting Rules
- Approval execution failure rate > 1%
- Transition latency > 500ms (p95)
- Cascade retirement stalled (>1 hour)
- Rollback triggered (manual alert)

---

## 14. Glossary & References

| Term | Definition |
|------|-----------|
| ApprovalEvent | CDI event fired when VVB consensus reached |
| Story 4 | Secondary Token Versioning system |
| Story 5 | VVB Approval Voting system |
| Cascade Retirement | Automatic retirement of previous token version |
| State Machine | SecondaryTokenVersionStateMachine (enforces valid transitions) |
| Byzantine FT | Fault tolerance for >1/3 Byzantine nodes (>2/3 majority) |

---

**End of Story 6 Architecture Design Document**
