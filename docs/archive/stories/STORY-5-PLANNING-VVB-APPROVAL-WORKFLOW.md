# Story 5 Planning - VVB Approval Workflow Implementation

**JIRA**: AV11-601-05 (Secondary Token Versioning Epic - Story 5)
**Sprint**: Sprint 1 (AV11-601)
**Story Points**: Estimated 8 SP
**Status**: 📋 Planning Phase
**Created**: December 23, 2025
**Dependencies**: Story 4 (AV11-601-04) ✅ Complete

---

## 📌 Story Overview

### What is Story 5?

**VVB (Virtual Validator Board) Approval Workflow** is the governance layer that approves or rejects secondary token version changes before they become active in the network.

Think of it as a multi-signature approval system:
- A token version is created and waits for VVB approval
- Validators vote on whether to approve
- Once threshold reached (e.g., 2/3 consensus), version becomes active
- If rejected, version is archived and user is notified

### Why It Matters

- **Security**: Prevents unauthorized token version changes
- **Governance**: Brings token lifecycle under decentralized control
- **Transparency**: All version changes require validator consensus
- **Auditability**: Complete history of approvals and rejections

---

## 🎯 Objectives

By end of Story 5:

1. ✅ **VVB Approval Service** - Multi-signature logic
2. ✅ **Approval Voting System** - Validator vote tracking
3. ✅ **Approval Events** - CDI events for approval workflow
4. ✅ **REST API** - Endpoints for voting and approval
5. ✅ **State Machine Integration** - Connect to token version states
6. ✅ **Approval Thresholds** - Configurable consensus rules
7. ✅ **Comprehensive Tests** - 120+ tests covering all scenarios
8. ✅ **Full Documentation** - Architecture, API, deployment guides

---

## 🏗️ Architecture Design

### High-Level Architecture

```
Secondary Token Version Request
          ↓
    [CREATED State]
          ↓
    VVB Approval Workflow
          ↓
    +─────────────────+
    │  VVBApprovalService (NEW)
    │  ├─ createApprovalRequest()
    │  ├─ submitValidatorVote()
    │  ├─ calculateConsensus()
    │  ├─ executeApproval()
    │  └─ executeRejection()
    +─────────────────+
          ↓
    Vote Collection (1-60 seconds)
          ↓
    +-────────────────────────────+
    │ Validator Voting (N validators)
    │ ├─ Validator-1: YES (signed)
    │ ├─ Validator-2: YES (signed)
    │ └─ Validator-3: NO  (signed)
    +-────────────────────────────+
          ↓
    Consensus Check (2/3 required)
          ↓
    +──────────────────────────┐
    │ Threshold Reached?       │
    │ YES → APPROVED           │
    │ NO  → TIMEOUT/REJECTED   │
    └──────────────────────────┘
          ↓
    [PENDING_VVB → ACTIVE/ARCHIVED]
```

### Core Services (New Files)

```
src/main/java/io/aurigraph/v11/token/secondary/
├── VVBApprovalRequest.java (entity)
│   ├─ requestId: UUID
│   ├─ tokenVersionId: String
│   ├─ createdAt: Instant
│   ├─ votingWindow: Instant
│   ├─ status: enum (PENDING, APPROVED, REJECTED, EXPIRED)
│   ├─ approvalThreshold: int (e.g., 67 for 2/3)
│   ├─ approvalCount: int
│   ├─ totalVoters: int
│   └─ merkleProof: String
│
├── ValidatorVote.java (entity)
│   ├─ voteId: UUID
│   ├─ approvalRequestId: UUID
│   ├─ validatorId: String
│   ├─ vote: enum (YES, NO, ABSTAIN)
│   ├─ signature: String (signed vote)
│   ├─ votedAt: Instant
│   └─ reason: String (optional)
│
├── VVBApprovalService.java (230 LOC)
│   ├─ createApprovalRequest(tokenVersionId, validators)
│   ├─ submitValidatorVote(requestId, validatorId, vote, signature)
│   ├─ calculateConsensus(requestId) → ConsensusResult
│   ├─ executeApproval(requestId) → approves version
│   ├─ executeRejection(requestId) → archives version
│   ├─ checkApprovalThreshold(approvalCount, totalVoters) → boolean
│   └─ getApprovalStatus(requestId) → ApprovalStatus
│
├── VVBApprovalRegistry.java (180 LOC)
│   ├─ Index by: requestId, tokenVersionId, validatorId, status
│   ├─ countApprovals(requestId) → int
│   ├─ countRejections(requestId) → int
│   ├─ getValidatorVote(requestId, validatorId) → Optional<ValidatorVote>
│   └─ getApprovalStats() → ApprovalStats
│
├── VVBApprovalResource.java (280 LOC)
│   ├─ POST /api/v12/secondary-tokens/{tokenId}/versions/{versionId}/submit-vvb
│   ├─ POST /api/v12/vvb/approvals/{requestId}/vote
│   ├─ GET  /api/v12/vvb/approvals/{requestId}
│   ├─ GET  /api/v12/vvb/approvals
│   ├─ PUT  /api/v12/vvb/approvals/{requestId}/execute
│   └─ DELETE /api/v12/vvb/approvals/{requestId}/cancel
│
├── ApprovalRequestEvent.java (30 LOC)
├── ApprovalEvent.java (30 LOC)
├── RejectionEvent.java (30 LOC)
└── ConsensusReachedEvent.java (30 LOC)
```

### Database Schema (Flyway Migration)

```sql
-- VVB Approval Requests
CREATE TABLE vvb_approval_requests (
    request_id UUID PRIMARY KEY,
    token_version_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    voting_window TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    approval_threshold INT NOT NULL,
    approval_count INT DEFAULT 0,
    total_voters INT NOT NULL,
    merkle_proof TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_version_id) REFERENCES secondary_token_versions(version_id)
);

-- Validator Votes
CREATE TABLE validator_votes (
    vote_id UUID PRIMARY KEY,
    approval_request_id UUID NOT NULL,
    validator_id VARCHAR(255) NOT NULL,
    vote VARCHAR(50) NOT NULL,
    signature VARCHAR(1024),
    voted_at TIMESTAMP NOT NULL,
    reason TEXT,
    FOREIGN KEY (approval_request_id) REFERENCES vvb_approval_requests(request_id),
    UNIQUE(approval_request_id, validator_id)
);

-- Indexes
CREATE INDEX idx_approval_token_version ON vvb_approval_requests(token_version_id);
CREATE INDEX idx_approval_status ON vvb_approval_requests(status);
CREATE INDEX idx_vote_request ON validator_votes(approval_request_id);
CREATE INDEX idx_vote_validator ON validator_votes(validator_id);
```

---

## 📊 Feature Breakdown

### Feature 1: Approval Request Creation
- **Trigger**: When version moves to PENDING_VVB state
- **Input**: TokenVersionId, list of validator addresses, voting window (seconds)
- **Output**: ApprovalRequestId (UUID)
- **Validation**: At least 3 validators required
- **Consensus Rule**: Configurable (default: 2/3 majority)

### Feature 2: Validator Voting
- **Endpoint**: `POST /api/v12/vvb/approvals/{requestId}/vote`
- **Vote Options**: YES, NO, ABSTAIN
- **Signature**: Validator must sign their vote (for audit trail)
- **Idempotency**: Re-voting updates previous vote
- **Time Window**: Must occur within voting window

### Feature 3: Consensus Calculation
- **Criteria**: `approvalCount / totalVoters >= threshold`
- **Default Threshold**: 0.67 (2/3)
- **Early Termination**: If impossible to reach threshold, reject early
- **Timeout**: After voting window, execute result

### Feature 4: Approval Execution
- **On Approval**:
  - Move token version to ACTIVE state
  - Fire ApprovalEvent
  - Update version metadata with approval timestamp
  - Create audit log entry

- **On Rejection**:
  - Move token version to ARCHIVED state
  - Fire RejectionEvent
  - Notify token owner
  - Archive approval request

### Feature 5: Audit Trail
- Every vote signed and stored
- Approval request immutable once finalized
- All state transitions logged
- Merkle proof chain for cryptographic verification

---

## 🧪 Test Coverage Plan (120+ Tests)

### Test Distribution

```
VVBApprovalServiceTest.java (50 tests)
├─ Approval request creation (8 tests)
│  ├─ Valid request creation
│  ├─ Minimum validators validation
│  ├─ Voting window validation
│  ├─ Threshold configuration
│  ├─ Duplicate request prevention
│  ├─ Token version state validation
│  └─ Event firing verification
│
├─ Validator voting (15 tests)
│  ├─ Valid votes (YES, NO, ABSTAIN)
│  ├─ Signature validation
│  ├─ Duplicate vote prevention
│  ├─ Vote window validation
│  ├─ Invalid validator detection
│  ├─ Idempotent updates
│  ├─ Event firing on vote
│  └─ Unauthorized voter rejection
│
├─ Consensus calculation (12 tests)
│  ├─ 2/3 majority calculation
│  ├─ Unanimous approval
│  ├─ Unanimous rejection
│  ├─ Edge cases (n=1, n=2, etc.)
│  ├─ Customizable thresholds
│  ├─ Early termination logic
│  ├─ Abstain vote handling
│  └─ Rounding edge cases
│
├─ Approval execution (10 tests)
│  ├─ Version state transition
│  ├─ Metadata updates
│  ├─ Event firing
│  ├─ Merkle proof generation
│  ├─ Audit trail creation
│  ├─ Approval idempotency
│  └─ Integration with VersioningService
│
└─ Rejection handling (5 tests)
   ├─ Version archival
   ├─ Owner notification
   ├─ Event firing
   └─ Audit logging

VVBApprovalRegistryTest.java (35 tests)
├─ Index operations (20 tests)
│  ├─ Request lookup by requestId
│  ├─ Request lookup by tokenVersionId
│  ├─ Vote lookup by validator
│  ├─ Status filtering
│  ├─ Time range queries
│  ├─ Bulk operations
│  └─ Performance (<5ms)
│
├─ Statistics (10 tests)
│  ├─ Approval count calculation
│  ├─ Rejection count calculation
│  ├─ Pending request count
│  ├─ Success rate calculation
│  └─ Time-to-approval metrics
│
└─ Data consistency (5 tests)
   ├─ Index synchronization
   ├─ Vote-request relationship
   └─ Status consistency

VVBApprovalResourceTest.java (25 tests)
├─ REST API endpoints (15 tests)
│  ├─ POST /submit-vvb validation
│  ├─ POST /vote validation
│  ├─ GET /approvals/{requestId}
│  ├─ GET /approvals filtering
│  ├─ PUT /execute success path
│  ├─ DELETE /cancel
│  ├─ Error handling
│  └─ Authorization checks
│
└─ DTO validation (10 tests)
   ├─ Request DTO marshaling
   ├─ Vote DTO marshaling
   ├─ Status DTO marshaling
   └─ Error response DTOs

VVBApprovalStateMachineTest.java (10 tests)
├─ State transitions (7 tests)
│  ├─ PENDING → APPROVED
│  ├─ PENDING → REJECTED
│  ├─ PENDING → EXPIRED
│  ├─ Invalid transitions blocked
│  └─ State consistency
│
└─ Event firing (3 tests)
   ├─ Events fired on state change
   └─ Event content validation
```

---

## 📅 Implementation Plan

### Day 1-2: Core Services (16 hours)
1. **Entity Models** (2 hours)
   - VVBApprovalRequest.java (80 LOC)
   - ValidatorVote.java (60 LOC)
   - Database migration (V31__vvb_approval.sql)

2. **Approval Service** (6 hours)
   - VVBApprovalService.java (230 LOC)
   - VVBApprovalRegistry.java (180 LOC)
   - CDI event classes

3. **REST API** (4 hours)
   - VVBApprovalResource.java (280 LOC)
   - Request/Response DTOs (150 LOC)
   - Validation logic

4. **Integration** (4 hours)
   - Hook VVBApprovalService into SecondaryTokenVersioningService
   - State machine transitions
   - Event firing

### Day 3-4: Testing (24 hours)
1. **Unit Tests** (16 hours)
   - Write 120 tests covering all scenarios
   - Mock validators and signatures
   - Test consensus logic edge cases

2. **Integration Tests** (8 hours)
   - End-to-end approval flow
   - State machine integration
   - Database persistence

### Day 5: Documentation & Polish (8 hours)
1. **Documentation** (5 hours)
   - Architecture guide
   - API reference
   - Deployment guide

2. **Code Review & Optimization** (3 hours)
   - Performance validation
   - Security review
   - Error handling verification

---

## 🔑 Key Design Decisions

### Decision 1: Voting Strategy
**Choice**: Synchronous vote collection with configurable timeout
**Rationale**: Faster approval decisions; validators respond within voting window

### Decision 2: Consensus Algorithm
**Choice**: Weighted majority (default 2/3)
**Rationale**: Byzantine fault tolerance; tolerate 1/3 malicious validators

### Decision 3: Signature Requirement
**Choice**: Cryptographic signatures (Ed25519) on all votes
**Rationale**: Non-repudiation; immutable audit trail

### Decision 4: Early Termination
**Choice**: Reject if impossible to reach threshold before voting window ends
**Rationale**: Faster rejection decisions; saves resources

---

## 📈 Success Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| **Test Coverage** | >95% | Code coverage tools |
| **Approval Latency** | <2s | Average time to consensus |
| **Rejection Latency** | <1s | Average time to reject |
| **Vote Throughput** | >1,000 votes/sec | Load test with 1,000 validators |
| **Registry Query** | <5ms | Lookup by requestId |
| **Consensus Accuracy** | 100% | Test all edge cases |

---

## 🚀 Launch Readiness

Before starting implementation:

- [ ] Confirm Story 4 deployed successfully
- [ ] JIRA tickets updated to "Done"
- [ ] Team alignment on VVB consensus rules
- [ ] Validator address list available
- [ ] Signature scheme finalized (Ed25519)
- [ ] Voting window defaults (30-60 seconds)
- [ ] Testing infrastructure ready (Testcontainers, etc.)

---

## 📞 Questions & Decisions Needed

1. **Voting Window**: How many seconds should validators have to vote? (30-60s recommended)
2. **Approval Threshold**: Always 2/3, or configurable per token type?
3. **Timeout Behavior**: Reject or pend if voting window expires?
4. **Signature Algorithm**: Ed25519 (recommended) or ECDSA?
5. **Validator List**: Fixed set or dynamic (queried from blockchain)?
6. **Audit Logging**: Log to database + blockchain, or just database?

---

## 📚 Documentation References

- **Story 4 Handoff**: STORY-4-TO-STORY-5-HANDOFF.md (already prepared)
- **API Design**: RESTful endpoints following Story 4 pattern
- **Testing Pattern**: Use existing SecondaryTokenVersionTest pattern
- **Integration**: CDI events pattern from SecondaryTokenService

---

## 🎯 Next Steps

1. **Get approval** to proceed with Story 5 planning
2. **Answer key questions** above
3. **Finalize design** with team
4. **Launch 4-5 day sprint** starting December 24, 2025
5. **Target completion**: December 29, 2025 (End of Sprint 1)

---

**Created**: December 23, 2025
**Status**: Ready for Team Review & Approval
**Epic**: AV11-601 (Secondary Token Versioning)
**Sprint**: Sprint 1
**Estimate**: 8 Story Points
