# Story 6 Execution Workflow: Approval Execution Deep Dive
## AV11-601-06: Complete Flow Diagrams and Usage Patterns

**Document Version**: 1.0
**Sprint**: 1, Story 6
**Audience**: Development Team, Operations, QA
**Status**: Ready for Implementation

---

## 1. Complete Approval Execution Flow Diagram

### 1.1 High-Level Flow (Happy Path)

```
┌──────────────────────────────────────────────────────────────────┐
│ VVB VOTING COMPLETE (Story 5)                                    │
│ Consensus: 8/12 validators approved (>66.67%)                   │
│ Request Status: APPROVED                                         │
└──────────────────────────────────────────────────────────────────┘
                             ↓
                     [ApprovalEvent]
                   requestId: UUID
                   versionId: UUID
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ ApprovalExecutionService (@Observes ApprovalEvent)               │
│ 1. Load approval request from VVBApprovalRegistry                │
│ 2. Validate request exists and status = APPROVED                 │
│ 3. Load token version from SecondaryTokenVersionRepository       │
└──────────────────────────────────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Validation Phase (Duration: <10ms)    │
        │ ✓ Version found                       │
        │ ✓ Status = PENDING_VVB                │
        │ ✓ No blocker holds                    │
        │ ✓ Approval not expired                │
        └───────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│ TokenStateTransitionManager.executeTransition()                  │
│ Transition: PENDING_VVB → ACTIVE                                 │
│ Duration: <50ms                                                  │
│ @Transactional wrapper ensures atomicity                         │
└──────────────────────────────────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ State Machine Validation               │
        │ (SecondaryTokenVersionStateMachine)   │
        │ canTransition(PENDING_VVB, ACTIVE)    │
        │ = true ✓                              │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Execute State Exit Actions             │
        │ PENDING_VVB → exit                    │
        │ Set vvbApprovedAt if not set          │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Update Token Version Entity            │
        │ status = ACTIVE                        │
        │ activatedAt = now()                    │
        │ approval_request_id = requestId        │
        │ approval_timestamp = now()             │
        │ approved_by_count = 8                  │
        │ Updated: version.updatedAt = now()     │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Execute State Entry Actions            │
        │ ACTIVE → enter                         │
        │ Generate Merkle hash (if needed)       │
        │ Set merkleHash = SHA256(content)       │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Persist to Database (Duration: <50ms) │
        │ INSERT/UPDATE secondary_token_versions │
        │ Commit transaction                     │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Audit Trail Recording (Duration: <5ms)│
        │ INSERT approval_execution_audit        │
        │ phase: INITIATED                       │
        │ phase: VALIDATED                       │
        │ phase: TRANSITIONED                    │
        │ phase: COMPLETED                       │
        │ executedBy: SYSTEM                     │
        └───────────────────────────────────────┘
                             ↓
           [TokenStateTransitionEvent]
        (versionId, PENDING_VVB → ACTIVE)
                             ↓
           [TokenActivatedEvent] ← This triggers revenue setup!
        (versionId, parentTokenId, merkleHash)
                             ↓
        ┌───────────────────────────────────────┐
        │ Revenue Service Subscriber             │
        │ (Separate from approval execution)     │
        │ Listens to TokenActivatedEvent         │
        │ Setup settlement flows                 │
        │ Initialize revenue streams             │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ Check: Should Cascade Retire Old Ver? │
        │ if previousVersionId != null:          │
        │   executeCascadeRetirement(...)        │
        │ else:                                  │
        │   skip (first version)                 │
        └───────────────────────────────────────┘
                             ↓
        ┌───────────────────────────────────────┐
        │ CASCADE RETIREMENT (if applicable)     │
        │ Load previous version from registry    │
        │ Check: countActiveByParent(prevId)    │
        │ if 0:                                  │
        │   prevVersion: ACTIVE → REPLACED       │
        │   Schedule archival (365 days)         │
        │ else:                                  │
        │   Leave active (has dependent tokens)  │
        └───────────────────────────────────────┘
                             ↓
        [ApprovalExecutionCompleted] Event
                    (versionId, ACTIVE)
                             ↓
        ┌───────────────────────────────────────┐
        │ EXECUTION COMPLETE                     │
        │ Total Duration: <500ms                 │
        │ Version Status: ACTIVE ✓              │
        │ Approval Status: APPROVED ✓           │
        │ Metadata Persisted: YES ✓             │
        │ Audit Trail Recorded: YES ✓           │
        └───────────────────────────────────────┘
```

---

## 2. Detailed Phase Breakdown

### 2.1 Phase 1: INITIATED

**What Happens**:
- ApprovalEvent received by ApprovalExecutionService
- Approval request loaded from registry
- Audit entry created with phase = INITIATED

**Duration**: <1ms
**Failure Modes**: Event parsing error, registry failure
**Recovery**: Retry immediately (CDI events are synchronous)

**Audit Entry**:
```json
{
  "phase": "INITIATED",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "approvalRequestId": "550e8400-e29b-41d4-a716-446655440001",
  "executedBy": "SYSTEM",
  "timestamp": "2025-01-02T14:30:00.000Z",
  "metadata": {
    "approvalCount": 8,
    "rejectionCount": 3,
    "abstainCount": 1,
    "totalValidators": 12
  }
}
```

### 2.2 Phase 2: VALIDATED

**What Happens**:
- Version loaded from repository
- State machine validation: PENDING_VVB → ACTIVE allowed? YES
- Approval metadata integrity check
- Parent token accessibility check
- Audit entry updated with phase = VALIDATED

**Duration**: <10ms
**Failure Modes**:
- Version not found (404 from repository)
- Invalid state transition (state machine rejects)
- Approval expired (voting window closed)
- Parent token locked or deleted

**Validation Checks**:
```
✓ version != null
✓ version.status == PENDING_VVB
✓ approvalRequest.status == APPROVED
✓ approvalRequest.votingWindowEnd >= now()
✓ version.parentTokenId == null OR parentToken.exists()
✓ No lock holds on version (optimistic locking check)
```

**Audit Entry**:
```json
{
  "phase": "VALIDATED",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "PENDING_VVB",
  "newStatus": null,  // Not yet transitioned
  "executedBy": "SYSTEM",
  "timestamp": "2025-01-02T14:30:00.010Z",
  "metadata": {
    "validationsPassed": 6,
    "stateTransitionAllowed": true
  }
}
```

### 2.3 Phase 3: TRANSITIONED

**What Happens**:
- State machine executes transition
- Exit actions for PENDING_VVB executed
- Entry actions for ACTIVE executed
- Version status set to ACTIVE
- Activation timestamp recorded
- Approval metadata stored (approval_request_id, approved_by_count, etc)
- Database persistence
- Audit entry updated with phase = TRANSITIONED

**Duration**: <50ms
**Failure Modes**:
- Database constraint violation (unique key, foreign key)
- Transaction deadlock (concurrent updates)
- Disk full / I/O error

**State Transitions**:
```
PENDING_VVB
  ↓ executeStateExitAction()
  - Set vvbApprovedAt = now() (if null)
  - Log VVB approval completion
  ↓
  [Status Update: ACTIVE]
  ↓ executeStateEntryAction()
  - Generate Merkle hash
  - Log activation
  ↓
ACTIVE
```

**Audit Entry**:
```json
{
  "phase": "TRANSITIONED",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "PENDING_VVB",
  "newStatus": "ACTIVE",
  "executedBy": "SYSTEM",
  "timestamp": "2025-01-02T14:30:00.045Z",
  "metadata": {
    "durationMs": 45,
    "merkleHash": "a1b2c3d4e5f6...",
    "parentTokenId": null,
    "previousVersionId": null
  }
}
```

### 2.4 Phase 4: COMPLETED

**What Happens**:
- Events fired (TokenStateTransitionEvent, TokenActivatedEvent, ApprovalExecutionCompleted)
- Cascade retirement logic executed (if applicable)
- Metrics recorded
- Audit entry finalized with phase = COMPLETED

**Duration**: <50ms
**Failure Modes**:
- Revenue service timeout
- Cascade retirement failure
- Event publishing timeout

**Events Fired**:
1. `TokenStateTransitionEvent` (synchronous)
   - Metadata: versionId, fromStatus, toStatus, timestamp
   - Subscribers: Logging service, metrics collection

2. `TokenActivatedEvent` (synchronous)
   - Metadata: versionId, parentTokenId, merkleHash, timestamp
   - Subscribers: Revenue service, settlement system

3. `ApprovalExecutionCompleted` (synchronous)
   - Metadata: versionId, approvalRequestId, duration, metrics
   - Subscribers: Metrics service, notification service

**Cascade Retirement (if applicable)**:
```
previousVersionId != null AND status = ACTIVE
  ↓ countActiveByParent(previousVersionId) == 0
  ↓
  previousVersion: ACTIVE → REPLACED
  ↓
  replaced_by_version_id = newVersionId
  ↓
  Schedule archival (365 days)
  ↓
  Fire TokenVersionRetiredEvent
  ↓
  Log "Cascaded retirement: X → REPLACED (by Y)"
```

**Audit Entry**:
```json
{
  "phase": "COMPLETED",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "PENDING_VVB",
  "newStatus": "ACTIVE",
  "executedBy": "SYSTEM",
  "timestamp": "2025-01-02T14:30:00.095Z",
  "metadata": {
    "totalDurationMs": 95,
    "phaseDurations": {
      "initiated": 1,
      "validated": 10,
      "transitioned": 45,
      "completed": 39
    },
    "eventsfired": 3,
    "cascadeRetirementExecuted": false,
    "approvalCount": 8,
    "approvers": ["validator1", "validator2", "validator3", "validator4",
                  "validator5", "validator6", "validator7", "validator8"]
  }
}
```

---

## 3. Error Path Workflows

### 3.1 Error Path: Version Not Found

```
ApprovalEvent Received
  ↓
Load Version from Repository
  ↓ ERROR: Version not found (404)
  ↓
[INITIATED] phase logged
  ↓
[VALIDATED] phase with error status
  ↓
[FAILED] phase logged
  │ errorMessage: "SecondaryTokenVersion not found: <versionId>"
  │ metadata: { errorType: "EntityNotFoundException" }
  ↓
Fire ApprovalExecutionFailed event
  │ cause: VERSION_NOT_FOUND
  │ versionId: UUID
  │ approvalRequestId: UUID
  ↓
Log Error (ERROR level)
  │ "Failed to execute approval: version not found"
  ↓
Manual Intervention Required:
  - Check if version was deleted
  - Verify approval request links correct version
  - Manual approval execution with correct versionId
```

**Audit Trail** (FAILED phase):
```json
{
  "phase": "FAILED",
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "errorMessage": "SecondaryTokenVersion not found: 550e8400-e29b-41d4-a716-446655440000",
  "executedBy": "SYSTEM",
  "timestamp": "2025-01-02T14:30:00.003Z",
  "metadata": {
    "errorType": "EntityNotFoundException",
    "failurePhase": "VALIDATED",
    "durationMs": 3
  }
}
```

### 3.2 Error Path: Invalid State Transition

```
ApprovalEvent Received
  ↓
Load Version (Success)
  ↓
Validation Phase
  ↓ State Machine Check: canTransition(PENDING_VVB, ACTIVE)?
  ↓ ERROR: Version status is ACTIVE (already transitioned!)
  ↓
[INITIATED] → [VALIDATED] phases logged
  ↓
Validation Fails:
  │ errorMessage: "Invalid transition: ACTIVE → ACTIVE"
  │ stateMachine.canTransition(ACTIVE, ACTIVE) = false
  ↓
[FAILED] phase logged
  ↓
Fire ApprovalExecutionFailed event
  ↓
Log Warning (WARN level)
  │ "State machine violation: ACTIVE → ACTIVE"
  ↓
Possible Causes:
  - Duplicate ApprovalEvent fired
  - Concurrent approval execution
  - Race condition with manual execution
  ↓
Recovery Options:
  1. Check version status (likely already ACTIVE)
  2. Verify revenue setup (may need manual trigger)
  3. Check audit trail for duplicate execution
```

### 3.3 Error Path: Database Failure

```
ApprovalEvent Received
  ↓
Validation Passes ✓
  ↓
[INITIATED] → [VALIDATED] phases logged
  ↓
State Transition Execution
  ↓ Database UPDATE: SET status = ACTIVE ...
  ↓ ERROR: Unique constraint violation
  │ OR: Deadlock detected
  │ OR: Connection timeout
  ↓
Transaction Automatically Rolled Back
  │ @Transactional boundary ensures atomicity
  │ No partial updates
  ↓
[TRANSITIONED] phase NOT logged (rolled back)
  ↓
[FAILED] phase logged with database error
  ↓
Exception Propagated to ApprovalExecutionService
  ↓
Retry Logic (Exponential Backoff):
  │ Attempt 1: Immediately (0ms delay)
  │ Attempt 2: 100ms delay
  │ Attempt 3: 500ms delay
  │ Max 3 attempts
  ↓
If All Retries Fail:
  │ Fire ApprovalExecutionFailed event
  │ Log Error (ERROR level)
  │ Alert Operations Team
  ↓
Manual Recovery:
  - DBA checks database status
  - Identifies constraint/deadlock cause
  - Resolves underlying issue
  - Retry manual approval execution
```

### 3.4 Error Path: Cascade Retirement Failure

```
Approval Execution Succeeds
  ↓
Version: PENDING_VVB → ACTIVE ✓
  ↓
TokenActivatedEvent Fired
  ↓
Check: Should Cascade Retire?
  │ previousVersionId = "550e8400-e29b-41d4-a716-446655440001"
  │ countActiveByParent(previousVersionId) = 0 ✓
  ↓
Start Cascade Retirement
  │ previousVersion: ACTIVE → REPLACED
  ↓ ERROR: Previous version not found
  │ OR: Lock hold on previous version
  │ OR: Database error
  ↓
[COMPLETED] phase still logged (separation of concerns)
  │ metadata.cascadeRetirementExecuted = false
  │ metadata.cascadeError = "..."
  ↓
Fire ApprovalExecutionCompleted (with cascade_failed flag)
  ↓
Fire TokenVersionRetiredFailed event (separate)
  ↓
Log Warning (WARN level)
  │ "Cascade retirement failed for version X"
  ↓
Recovery:
  - Check previous version status
  - Manual retire if needed
  - Revenue setup unaffected (already executed)
```

---

## 4. Approval Record Usage & Audit Trail

### 4.1 Approval Metadata Storage

When approval is executed, the token version is enriched with approval metadata:

```java
SecondaryTokenVersion {
  // Core fields
  id: UUID = "550e8400-e29b-41d4-a716-446655440000"
  secondaryTokenId: UUID
  status: ACTIVE  // Changed from PENDING_VVB

  // Approval metadata (NEW in Story 6)
  approval_request_id: UUID = "550e8400-e29b-41d4-a716-446655440001"
  approval_threshold_percentage: 66.67
  approved_by_count: 8
  approval_timestamp: 2025-01-02T14:30:00.000Z
  approvers_list: ["validator1", "validator2", ..., "validator8"]  // JSON
  approval_expiry_deadline: 2025-01-09T14:30:00.000Z  // 7 days from voting window end

  // Activation metadata
  activated_at: 2025-01-02T14:30:00.095Z
  updated_at: 2025-01-02T14:30:00.095Z

  // Previous version tracking (for cascade)
  previous_version_retired_at: null  // Set if old version was retired
  replaced_by_version_id: null  // Set if this version replaces another
}
```

### 4.2 Complete Audit Trail

The `approval_execution_audit` table maintains complete execution history:

```sql
SELECT * FROM approval_execution_audit
WHERE version_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY execution_timestamp ASC;

Result:
┌────┬──────────┬──────────────┬─────────────┬──────────────┬───────────┬──────────────┬─────────────────────────────────┐
│ id │ phase    │ prev_status  │ new_status  │ executed_by  │ timestamp │ error_msg    │ metadata                        │
├────┼──────────┼──────────────┼──────────────┼──────────────┼───────────┼──────────────┼─────────────────────────────────┤
│ 1  │ INITIATED│ NULL         │ NULL        │ SYSTEM       │ 14:30:00  │ NULL         │ {...approval counts...}         │
│ 2  │VALIDATED │ NULL         │ NULL        │ SYSTEM       │ 14:30:00  │ NULL         │ {...validation checks...}       │
│ 3  │TRANSITIONED│ PENDING_VVB │ ACTIVE      │ SYSTEM       │ 14:30:00  │ NULL         │ {...hash, duration...}          │
│ 4  │ COMPLETED│ PENDING_VVB  │ ACTIVE      │ SYSTEM       │ 14:30:00  │ NULL         │ {...events, cascade, metrics...}│
└────┴──────────┴──────────────┴──────────────┴──────────────┴───────────┴──────────────┴─────────────────────────────────┘

Timestamp ordering verified: INITIATED < VALIDATED < TRANSITIONED < COMPLETED
Duration breakdown: Each phase duration recorded
Events fired: Count and types of events (TokenStateTransitionEvent, TokenActivatedEvent, etc)
Cascade status: Whether cascade retirement executed or not
```

---

## 5. Automatic vs Manual Execution

### 5.1 Automatic Execution (Default)

**When**: Whenever ApprovalEvent is fired by VVBApprovalService
**Who**: System/Spring CDI
**Trigger**: Consensus reached during voting (Story 5)

```
Workflow:
1. VVB consensus reached (>2/3 majority) → Story 5
2. VVBApprovalService.executeApproval() fires ApprovalEvent
3. ApprovalExecutionService @Observes ApprovalEvent
4. Automatic execution: PENDING_VVB → ACTIVE
5. Success: TokenActivatedEvent → Revenue setup
6. Failure: ApprovalExecutionFailed → Alert ops team

Advantages:
- No manual intervention needed
- Immediate activation (fastest path)
- Audit trail automatically recorded
- Scalable to high-volume approvals

Disadvantages:
- If service crashes, approvals may not execute
- Requires careful error handling
```

### 5.2 Manual Execution (Fallback)

**When**: Automatic execution fails or is disabled
**Who**: Administrator / Operator
**Trigger**: Manual REST API call

```
Endpoint:
POST /api/v12/approval-execution/{versionId}/execute-manual

Request:
{
  "approvalRequestId": "550e8400-e29b-41d4-a716-446655440001",
  "executedBy": "admin@aurigraph.io",
  "reason": "Automatic execution failed - manual override"
}

Response: 200 OK
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "PENDING_VVB",
  "newStatus": "ACTIVE",
  "timestamp": "2025-01-02T14:45:00.000Z",
  "executionDuration": "145ms",
  "metadata": {
    "executedManually": true,
    "executedBy": "admin@aurigraph.io"
  }
}

Workflow:
1. Admin checks approval status via API
2. Admin verifies approval is APPROVED
3. Admin calls manual execution endpoint
4. Manual execution: PENDING_VVB → ACTIVE
5. Success: TokenActivatedEvent → Revenue setup
6. Failure: Clear error response, manual retry

Advantages:
- Works even if automatic system fails
- Operator can verify before execution
- Good for debugging and manual testing

Disadvantages:
- Requires manual intervention
- Slower than automatic
- Audit trail shows "manual execution" (for compliance tracking)
```

---

## 6. Approval Expiry & Timeout Handling

### 6.1 Approval Expiry Window

**Expiry Rules**:
- Approval valid for 7 days from voting window end
- Expiry deadline: votingWindowEnd + 7 days
- After expiry: approval becomes stale, cannot be executed

**Execution Timeline**:
```
Voting Starts
│
V [Voting Window: 7 days]
│
├─ Day 0: Validators vote, consensus reached at 2 PM
│         ApprovalEvent fired
│         Approval execution at 2:01 PM (automatic)
│         Status: ACTIVE
│
├─ Day 7: Voting window closes at 2 PM
│         Approval still valid (7 days from this point)
│
├─ Day 14: Approval expires at 2 PM
│          Cannot execute now
│          Attempting execution → ERROR: "Approval expired"
│
└─ Day 15: Manual retry still fails
           Must request new approval vote
```

### 6.2 Timeout Handling

**Automatic Timeout Processing**:
- Scheduled task: ApprovalExecutionMaintenanceTask
- Frequency: Every 1 hour
- Finds: All expiring approvals (within 1 day of expiry)
- Action: Automatically transition to ARCHIVED (after 7 days)

**Code**:
```java
@Scheduled(cron = "0 0 * * * *")  // Every hour
@Transactional
public void processExpiredApprovals() {
    LocalDateTime expiryThreshold = LocalDateTime.now().minusDays(7);

    List<SecondaryTokenVersion> expired = versionRepository
        .findByStatusAndApprovalTimestampBefore(
            PENDING_VVB,  // Still pending (not executed)
            expiryThreshold
        );

    for (SecondaryTokenVersion version : expired) {
        try {
            // Transition: PENDING_VVB → EXPIRED → ARCHIVED
            stateMachine.transitionState(version, EXPIRED);
            versionRepository.persist(version);

            auditService.logPhase(version.getId(), "EXPIRED",
                "Approval window closed without execution");

            // Schedule immediate archival
            stateMachine.transitionState(version, ARCHIVED);
            versionRepository.persist(version);

            log.info("Expired approval archived: {}", version.getId());

            // Fire event for cleanup
            approvalExpiredEvent.fire(
                new ApprovalExpiredEvent(version.getId(),
                    version.getApprovalRequestId())
            );
        } catch (Exception e) {
            log.error("Failed to expire approval: {}", version.getId(), e);
        }
    }
}
```

---

## 7. Bulk Approval Execution

### 7.1 Bulk API Endpoint

**Use Case**: Execute multiple approvals in a single request (batch processing)

```
Endpoint:
POST /api/v12/approval-execution/bulk-execute

Request:
{
  "approvalRequestIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ],
  "executedBy": "batch-system@aurigraph.io"
}

Response: 200 OK
{
  "totalRequests": 3,
  "successCount": 2,
  "failureCount": 1,
  "results": [
    {
      "approvalRequestId": "550e8400-e29b-41d4-a716-446655440001",
      "status": "SUCCESS",
      "versionId": "...",
      "newStatus": "ACTIVE",
      "duration": "145ms"
    },
    {
      "approvalRequestId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "SUCCESS",
      "versionId": "...",
      "newStatus": "ACTIVE",
      "duration": "158ms"
    },
    {
      "approvalRequestId": "550e8400-e29b-41d4-a716-446655440003",
      "status": "FAILED",
      "errorCode": "VERSION_NOT_FOUND",
      "errorMessage": "Token version not found for approval",
      "duration": "12ms"
    }
  ]
}
```

### 7.2 Bulk Implementation

**Strategy**: Parallel execution with partial failure tolerance

```java
@POST
@Path("/bulk-execute")
@Transactional
public Response bulkExecuteApprovals(BulkExecutionRequest request) {
    List<BulkExecutionResult> results = request.getApprovalRequestIds()
        .parallelStream()  // Parallel for performance
        .map(requestId -> {
            try {
                long start = System.nanoTime();

                // Execute individual approval
                ApprovalExecutionService.ExecutionResult result =
                    approvalService.executeApproval(requestId);

                long duration = (System.nanoTime() - start) / 1_000_000;

                return BulkExecutionResult.success(
                    requestId, result.versionId, duration
                );
            } catch (Exception e) {
                return BulkExecutionResult.failure(
                    requestId, e.getClass().getSimpleName(), e.getMessage()
                );
            }
        })
        .collect(Collectors.toList());

    // Summarize results
    long successCount = results.stream()
        .filter(r -> r.getStatus() == SUCCESS)
        .count();

    BulkExecutionResponse response = new BulkExecutionResponse();
    response.setTotalRequests(request.getApprovalRequestIds().size());
    response.setSuccessCount(successCount);
    response.setFailureCount(results.size() - successCount);
    response.setResults(results);

    return Response.ok(response).build();
}
```

**Performance Target**: <1s for 100 approvals (parallel execution)

---

## 8. Integration with Revenue Stream Setup

### 8.1 Event-Driven Revenue Initialization

**Flow**:
```
TokenActivatedEvent
  (versionId, parentTokenId, merkleHash, timestamp)
       ↓
RevenueStreamService @Observes TokenActivatedEvent
       ↓
Load token details (amount, recipient, type)
       ↓
Create revenue stream entry
  - settlementId: UUID
  - tokenVersionId: UUID
  - amount: Decimal
  - status: PENDING_SETTLEMENT
  - createdAt: timestamp
       ↓
Initialize settlement flow:
  1. Allocate funds from token issuer account
  2. Create settlement request
  3. Queue for settlement processor
       ↓
Fire RevenueStreamInitiatedEvent
  (settlementId, tokenVersionId, amount)
       ↓
Settlement Processor (background job)
  - Process payment
  - Update status to SETTLED
  - Fire SettlementCompletedEvent
```

**Key Decoupling**:
- Approval execution and revenue setup are independent
- If revenue setup fails, approval already ACTIVE
- Revenue can be retried separately without re-executing approval
- Event-driven allows for flexible settlement implementations

---

## 9. Operational Runbook: Common Scenarios

### 9.1 Check Approval Status

```bash
# Query via REST API
curl -s http://localhost:9003/api/v12/approval-execution/{versionId}/status | jq '.'

Response:
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "approvalRequestId": "550e8400-e29b-41d4-a716-446655440001",
  "currentStatus": "ACTIVE",
  "transitionedAt": "2025-01-02T14:30:00.095Z",
  "executionDuration": "95ms",
  "approverCount": 8,
  "approvalThreshold": 66.67
}

# Or query directly from database
SELECT version_id, status, activated_at, approval_timestamp
FROM secondary_token_versions
WHERE version_id = '550e8400-e29b-41d4-a716-446655440000';
```

### 9.2 Manually Execute Stalled Approval

```bash
# Identify stalled approval (PENDING_VVB for >1 hour)
SELECT version_id, created_at, status
FROM secondary_token_versions
WHERE status = 'PENDING_VVB'
AND created_at < now() - interval '1 hour';

# Manual execution via API
curl -X POST http://localhost:9003/api/v12/approval-execution/{versionId}/execute-manual \
  -H "Content-Type: application/json" \
  -d '{
    "approvalRequestId": "550e8400-e29b-41d4-a716-446655440001",
    "executedBy": "ops@aurigraph.io",
    "reason": "Approval service was down for 45 minutes"
  }' | jq '.'

Response:
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "PENDING_VVB",
  "newStatus": "ACTIVE",
  "timestamp": "2025-01-02T15:30:00.000Z",
  "executionDuration": "148ms"
}
```

### 9.3 Rollback Mistaken Approval

```bash
# IF version was accidentally approved and activated:
curl -X POST http://localhost:9003/api/v12/approval-execution/{versionId}/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Approval issued to wrong version - will re-vote",
    "executedBy": "ops@aurigraph.io"
  }' | jq '.'

Response:
{
  "versionId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "ACTIVE",
  "newStatus": "PENDING_VVB",
  "timestamp": "2025-01-02T15:35:00.000Z",
  "reason": "Approval issued to wrong version - will re-vote"
}

# Verify rollback
SELECT status, activated_at FROM secondary_token_versions
WHERE version_id = '550e8400-e29b-41d4-a716-446655440000';
# Result: status = PENDING_VVB, activated_at = NULL
```

### 9.4 View Complete Audit Trail

```bash
# Get full audit history
curl -s http://localhost:9003/api/v12/approval-execution/{versionId}/audit | jq '.auditEntries'

Response:
[
  {
    "id": "uuid-1",
    "phase": "INITIATED",
    "timestamp": "2025-01-02T14:30:00.000Z",
    "executedBy": "SYSTEM",
    "metadata": { "approvalCount": 8, ... }
  },
  {
    "id": "uuid-2",
    "phase": "VALIDATED",
    "timestamp": "2025-01-02T14:30:00.010Z",
    "executedBy": "SYSTEM",
    "metadata": { "validationsPassed": 6 }
  },
  {
    "id": "uuid-3",
    "phase": "TRANSITIONED",
    "previousStatus": "PENDING_VVB",
    "newStatus": "ACTIVE",
    "timestamp": "2025-01-02T14:30:00.045Z",
    "metadata": { "durationMs": 45, "merkleHash": "..." }
  },
  {
    "id": "uuid-4",
    "phase": "COMPLETED",
    "previousStatus": "PENDING_VVB",
    "newStatus": "ACTIVE",
    "timestamp": "2025-01-02T14:30:00.095Z",
    "metadata": { "totalDurationMs": 95, "eventsFired": 3 }
  }
]
```

---

## 10. Metrics & Monitoring

### 10.1 Key Metrics to Track

| Metric | Unit | Target | Alert |
|--------|------|--------|-------|
| Approval Executions/sec | count/s | >100 | <50 |
| Execution Latency (p50) | ms | <50 | >100 |
| Execution Latency (p95) | ms | <150 | >250 |
| Execution Latency (p99) | ms | <200 | >350 |
| Success Rate | % | 99.9% | <99% |
| Rollback Frequency | count/day | 0 | >1 |
| Cascade Failures | count/day | 0 | >0 |

### 10.2 Alert Rules

```
Rule 1: High Failure Rate
IF approval_execution_failures > 1% in last 5m THEN alert(CRITICAL)

Rule 2: High Latency
IF execution_latency_p95 > 250ms in last 5m THEN alert(WARNING)

Rule 3: Cascade Failure
IF cascade_retirement_failed THEN alert(CRITICAL)

Rule 4: Unexpected Rollback
IF rollback_count > 0 THEN alert(CRITICAL)

Rule 5: Stalled Approvals
IF pending_vvb_count > created_at < now() - interval '1 hour'
THEN alert(WARNING)
```

---

**End of Story 6 Execution Workflow Document**
