# VVB Approval Workflow Architecture - Final Design
## Story AV11-601-05: Virtual Validator Board Multi-Signature Approval System

**Status**: Architecture Planning Complete
**Sprint**: Dec 24-29, 2025 (5 days)
**Story Points**: 8 SP
**Target Tests**: 120+ | Coverage: >95%
**Last Updated**: December 23, 2025

---

## 1. SYSTEM OVERVIEW & VISION

### 1.1 Purpose
The Virtual Validator Board (VVB) implements a **multi-signature approval workflow** for sensitive token lifecycle operations. It provides governance guardrails that:
- Enforce compliance for critical operations (token creation, retirement, suspension)
- Prevent orphaned tokens through cascade validation
- Maintain immutable audit trails
- Enable Byzantine-fault-tolerant consensus decisions

### 1.2 Key Principles
```
Security First    : Cryptographic voting with full auditability
Fault Tolerant    : Continue operation with minority voter failures
Decentralized     : No single point of approval authority
Efficient         : <100ms approval decisions at scale
Transparent       : Every decision logged immutably
```

### 1.3 Story Context
**Dependency Chain**:
```
Story 2: Primary Token Registry ✅
         ↓
Story 3: Secondary Token Versioning ✅
         ↓
Story 4: Secondary Token Versioning & State Management ⏳ (DEPLOYED)
         ↓
Story 5: VVB Approval Workflow (THIS STORY)
         ↓
Story 6: Composite Token Assembly
```

**Integration Points**:
- **Story 4 Systems**: SecondaryTokenVersioningService, SecondaryTokenRegistry
- **Story 3 Systems**: SecondaryTokenMerkleService, SecondaryTokenService
- **Story 2 Systems**: PrimaryTokenRegistry, PrimaryTokenMerkleService
- **All Stories**: TokenLifecycleGovernance (cross-cutting)

---

## 2. ARCHITECTURE DIAGRAMS

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AURIGRAPH TOKEN LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  Submitters      │
    │  (Users/Apps)    │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────────────────────────────────────────┐
    │         VVB REST API Layer                           │
    │  ┌────────────────────────────────────────────────┐  │
    │  │ VVBResource.java (400 LOC)                     │  │
    │  │  - POST /validate (submit for approval)        │  │
    │  │  - POST /{versionId}/approve                  │  │
    │  │  - POST /{versionId}/reject                   │  │
    │  │  - GET /pending (pending approvals)           │  │
    │  │  - GET /statistics (VVB metrics)              │  │
    │  │  - GET /governance/* (governance checks)      │  │
    │  └────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────┘
             │
             ├─────────────────┬──────────────────┬─────────────────┐
             ↓                 ↓                  ↓                 ↓
    ┌─────────────┐   ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
    │  VVB        │   │ Token        │  │ Token        │  │ Governance      │
    │  Validator  │   │ Lifecycle    │  │ Version      │  │ Enforcement     │
    │  (150 LOC)  │   │ Governance   │  │ Service      │  │ (200 LOC)       │
    │             │   │ (200 LOC)    │  │ (350 LOC)    │  │                 │
    │ - Rule      │   │              │  │              │  │ - Retirement    │
    │   Matching  │   │ - Retirement │  │ - Create     │  │   Validation    │
    │ - Role      │   │   Rules      │  │ - Update     │  │ - Suspension    │
    │   Checking  │   │ - Suspension │  │ - Lifecycle  │  │   Rules         │
    │ - State     │   │   Rules      │  │   Mgmt       │  │ - Reactivation  │
    │   Machine   │   │              │  │              │  │   Rules         │
    │             │   │              │  │              │  │                 │
    │ CONSENSUS   │   │              │  │              │  │                 │
    │ Algorithm:  │   │              │  │              │  │                 │
    │ Byzantine   │   │              │  │              │  │                 │
    │ FT (f<n/3)  │   │              │  │              │  │                 │
    └─────────────┘   └──────────────┘  └──────────────┘  └─────────────────┘
             │                 │                │                │
             └─────────────────┼────────────────┼────────────────┘
                               ↓
                    ┌────────────────────────────┐
                    │  CDI Events Layer          │
                    │  (Async Notification)      │
                    │                            │
                    │ - ApprovalInitiatedEvent   │
                    │ - ApprovalDecisionEvent    │
                    │ - CascadeEvent             │
                    │ - TimeoutEvent             │
                    └────────────────────────────┘
                               │
                   ┌───────────┼───────────┐
                   ↓           ↓           ↓
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Registry │ │  Token   │ │  Audit   │
            │ Updates  │ │ Services │ │  Trail   │
            │          │ │          │ │          │
            └──────────┘ └──────────┘ └──────────┘
                   │           │           │
                   └───────────┼───────────┘
                               ↓
                    ┌────────────────────────────┐
                    │  PostgreSQL Database       │
                    │                            │
                    │ - vvb_validators           │
                    │ - vvb_approval_rules       │
                    │ - vvb_approvals            │
                    │ - vvb_timeline             │
                    │ - token_versions           │
                    │ - token_registry           │
                    └────────────────────────────┘
```

### 2.2 State Machine Diagram (7-State Token Lifecycle)

```
┌─────────────────────────────────────────────────────────────────────┐
│               TOKEN VERSION STATE MACHINE (7 States)                 │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │ CREATED  │  ← Initial state: submitter creates token version
    └─────┬────┘
          │ submit()
          ↓
    ┌────────────────┐
    │ PENDING_VVB    │  ← Waiting for approvals
    │                │
    │ Rules:         │
    │ - Timeout:7d   │
    │ - Required:    │
    │   STANDARD=1   │
    │   ELEVATED=2   │
    │   CRITICAL=3   │
    └──┬────────────┬┘
       │            │
 approve()      reject()
       │            │
       ↓            ↓
  ┌─────────┐  ┌──────────┐
  │APPROVED │  │ REJECTED │
  └────┬────┘  └──────────┘
       │       │
       │       └─→ [Cascade to
       │            Child Tokens]
       │       │
       └─→ activate()
           │
           ↓
      ┌────────┐
      │ ACTIVE │ ← Token is live
      │        │
      │ Rules: │
      │ - Can be │
      │   used   │
      │ - Can be │
      │   retired│
      └────┬───┘
           │
           ├─→ redeem()    → REDEEMED
           ├─→ expire()    → EXPIRED
           ├─→ retire()    → RETIRED (requires VVB approval if primary)
           └─→ suspend()   → SUSPENDED

    ┌──────────┐
    │ TIMEOUT  │ ← VVB decision not reached within 7 days
    │          │ ← Auto-rejects; triggers cascade
    └──────────┘

    ┌──────────────┐  ┌──────────┐  ┌────────────┐
    │ REDEEMED     │  │ EXPIRED  │  │ SUSPENDED  │
    │              │  │          │  │            │
    │ (Terminal)   │  │ (Terminal)  │ (Reversible)
    └──────────────┘  └──────────┘  └────────────┘
```

### 2.3 Approval Workflow Data Flow

```
REQUEST FLOW:
═════════════════════════════════════════════════════════════════

1. SUBMISSION PHASE
   ┌──────────┐
   │Submitter │
   └────┬─────┘
        │ POST /api/v12/vvb/validate
        │ {changeType, description, metadata}
        ↓
   ┌──────────────────┐
   │VVBResource       │
   │validate()        │
   └────┬─────────────┘
        │
        ↓
   ┌──────────────────┐
   │VVBValidator      │
   │validateVersion() │
   │  • Determine     │
   │    approval type │
   │  • Check rules   │
   │  • Compute       │
   │    required      │
   │    approvers     │
   └────┬─────────────┘
        │
        ↓
   ┌──────────────────┐
   │VVB Database      │
   │  • Store in      │
   │    vvb_approvals │
   │  • Log in        │
   │    vvb_timeline  │
   └────┬─────────────┘
        │
        ↓
   ┌──────────────────┐
   │CDI Event         │
   │ApprovalInitiated │
   │Event fired       │
   └────┬─────────────┘
        │
        └──→ Notifications sent
             to approvers

2. VOTING PHASE
   ┌──────────┐
   │Approver  │
   └────┬─────┘
        │ POST /api/v12/vvb/{versionId}/approve
        │ {approverId, comments}
        ↓
   ┌──────────────────┐
   │VVBResource       │
   │approve()         │
   └────┬─────────────┘
        │
        ↓
   ┌──────────────────────┐
   │VVBValidator          │
   │recordApproval()      │
   │  • Verify authority  │
   │  • Check quorum      │
   │  • Compute consensus │
   │  • Detect finality   │
   └────┬─────────────────┘
        │
        ↓
   ┌──────────────────┐
   │Consensus Check   │
   │  Threshold met?  │
   └─┬──────────────┬─┘
     │              │
    YES            NO
     │              │
     ↓              ↓
   APPROVED    WAITING
     │
     ↓
   ┌──────────────────┐
   │CDI Event         │
   │ApprovalDecision  │
   │Event fired       │
   └─────────────────┘

3. ACTIVATION PHASE
   ┌──────────────────┐
   │ApprovalDecision  │
   │Event Listener    │
   └────┬─────────────┘
        │
        ↓
   ┌──────────────────┐
   │TokenVersioning   │
   │Service           │
   │  • Activate      │
   │  • Update state  │
   │  • Trigger       │
   │    downstream    │
   └─────────────────┘
```

### 2.4 Entity-Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       VVB DATABASE SCHEMA ERD                        │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │ vvb_validators      │
    ├─────────────────────┤
    │ id (UUID) [PK]      │
    │ name (VARCHAR)      │ ← Unique identifier
    │ role (VARCHAR)      │ ← VVB_VALIDATOR, VVB_ADMIN
    │ authority (VARCHAR) │ ← STANDARD, ELEVATED, CRITICAL
    │ active (BOOLEAN)    │
    │ created_at (TS)     │
    └──────────┬──────────┘
               │
               │ 1:N
               │
         ┌─────┴──────────┐
         │                │
         ↓                ↓
    ┌────────────────┐   ┌──────────────────┐
    │ vvb_approvals  │   │ vvb_approval_    │
    ├────────────────┤   │ rules            │
    │ id (UUID) [PK] │   ├──────────────────┤
    │ version_id (FK)├─┐ │ id (UUID) [PK]   │
    │ approver_id(FK)├─┼─┤ change_type (V)  │
    │ decision (V)   │ │ │ requires_vvb(B)  │
    │ comment (TEXT) │ │ │ role_required(V) │
    │ created_at(TS) │ │ │ approval_type(V) │
    │ UNIQUE(version │ │ └──────────────────┘
    │       ,approver)   │
    └────────────────┘   │
         │                │
         └────────────────┘
               │
               │
         ┌─────┴──────────────────────────┐
         │                                │
         │              ┌─────────────────┴────────┐
         │              │                          │
         ↓              ↓                          ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
    │ vvb_timeline │  │ token_        │  │ secondary_token_ │
    ├──────────────┤  │ versions      │  │ registry         │
    │ id (UUID)[PK]│  ├──────────────┤  ├──────────────────┤
    │ version_id   │  │ version_id   │  │ token_id (PK)    │
    │ (FK)         │  │ (UUID) (PK)  │  │ parent_token_id  │
    │ event_type   │  │ token_type   │  │ status (VARCHAR) │
    │ (VARCHAR)    │  │ status       │  │ owner (VARCHAR)  │
    │ details(JSON)│  │ change_type  │  │ token_type       │
    │ created_at   │  │ data (JSON)  │  │ created_at       │
    │ (TS)         │  │ created_at   │  └──────────────────┘
    └──────────────┘  │ (TS)         │
                      │ approvers    │
                      │ (JSON)       │
                      └──────────────┘
                           │
                           │ FK: version references
                           │     secondary_token_version_id
                           │
                      ┌────┴──────────────┐
                      │                   │
                      ↓                   ↓
                  ┌──────────┐      ┌──────────────┐
                  │ primary  │      │ registry     │
                  │ token_   │      │ primary      │
                  │ registry │      │ tokens       │
                  └──────────┘      └──────────────┘
```

---

## 3. CONSENSUS & APPROVAL ALGORITHM

### 3.1 Byzantine Fault Tolerant (BFT) Consensus

The VVB uses a **quorum-based Byzantine Fault Tolerant consensus** model:

```
CONSENSUS MODEL:
═════════════════════════════════════════════════════════════════

For n validators, tolerates f < n/3 faulty/malicious validators

Approval Types & Quorum Requirements:

1. STANDARD (Secondary Token Create)
   ├─ Required Approvers: 1 VVB_VALIDATOR
   ├─ Quorum: 1/1 (100%)
   ├─ Consensus Rule: Unanimous
   └─ Finality: Single approval required

2. ELEVATED (Secondary Token Retirement, Suspension)
   ├─ Required Approvers: 1 VVB_ADMIN + 1 VVB_VALIDATOR
   ├─ Quorum: 2/2 (100%)
   ├─ Consensus Rule: 2 different role types required
   └─ Finality: Both must approve

3. CRITICAL (Primary Token Retirement, Cross-chain Bridge)
   ├─ Required Approvers: 2 VVB_ADMIN + 1 VVB_VALIDATOR
   ├─ Quorum: 3/3 (100%)
   ├─ Consensus Rule: Supermajority (admin must consent)
   └─ Finality: All three must approve OR timeout triggers

Timeout Handling:
   ├─ Duration: 7 days (configurable)
   ├─ Action: Auto-reject + cascade
   └─ Notification: Escalation alert to all approvers

Byzantine Fault Tolerance:
   ├─ f = floor((n-1)/3) faulty nodes tolerated
   ├─ Example:
   │  n=3: f=0 (0 faults tolerated, unanimous required)
   │  n=4: f=1 (1 fault tolerated)
   │  n=5: f=1 (1 fault tolerated)
   │  n=7: f=2 (2 faults tolerated)
   └─ For CRITICAL: n=3, all must agree
```

### 3.2 Pseudo-Code: Byzantine Quorum Consensus

```
FUNCTION byzantine_consensus(versionId, approvalType) {
    // Get required approvers based on type
    required = get_required_approvers(approvalType)

    // Get votes received so far
    votes = query_vvb_approvals(versionId)

    // Filter by required roles
    valid_votes = filter_by_role_requirements(votes, required)

    // Compute quorum (f < n/3 BFT model)
    n_required = count(required)
    f = floor((n_required - 1) / 3)  // Byzantine tolerance
    min_needed = n_required - f       // Minimum for consensus

    // Check if consensus reached
    IF count(valid_votes WITH decision=APPROVED) >= min_needed {
        RETURN APPROVED
    }
    ELSE IF count(valid_votes WITH decision=REJECTED) > f {
        // More rejects than tolerance allows
        RETURN REJECTED
    }
    ELSE IF is_timed_out(versionId, days=7) {
        RETURN TIMEOUT
    }
    ELSE {
        RETURN PENDING
    }
}

FUNCTION can_approve(approver, approvalType) {
    // Verify approver has authority for type
    IF approvalType == STANDARD {
        RETURN approver.role IN [VVB_VALIDATOR, VVB_ADMIN]
    }
    ELSE IF approvalType == ELEVATED {
        RETURN approver.role IN [VVB_ADMIN]
    }
    ELSE IF approvalType == CRITICAL {
        RETURN approver.role IN [VVB_ADMIN]  // Only admins
    }
    RETURN FALSE
}

FUNCTION apply_approval(versionId, approverId, decision) {
    // 1. Verify approver authority
    approver = get_validator(approverId)
    rule = get_approval_rule(versionId)
    approval_type = rule.approval_type

    IF NOT can_approve(approver, approval_type) {
        THROW UnauthorizedException("Invalid role for approval type")
    }

    // 2. Store vote
    store_approval(versionId, approverId, decision)

    // 3. Check consensus
    consensus = byzantine_consensus(versionId, approval_type)

    // 4. Handle based on consensus result
    IF consensus == APPROVED {
        FIRE ApprovalDecisionEvent(APPROVED)
        // Downstream: activate token, update registry
    }
    ELSE IF consensus == REJECTED {
        FIRE ApprovalDecisionEvent(REJECTED)
        // Downstream: cascade reject to children
    }
    ELSE IF consensus == TIMEOUT {
        FIRE ApprovalDecisionEvent(TIMEOUT)
        // Downstream: expire and cascade
    }

    // 5. Log to audit trail
    log_to_vvb_timeline(versionId, "DECISION_RECORDED", {
        approver: approverId,
        decision: decision,
        consensus_reached: consensus,
        timestamp: now()
    })
}
```

### 3.3 Practical Consensus Examples

```
SCENARIO 1: STANDARD Approval
─────────────────────────────────────
Required: 1 VVB_VALIDATOR
Quorum: 1/1 (100%)

State:
  Approver: John_Smith (VVB_VALIDATOR)
  Decision: APPROVE

Action:
  ✓ Consensus reached immediately
  → Fire ApprovalDecisionEvent(APPROVED)
  → Activate token


SCENARIO 2: ELEVATED Approval
─────────────────────────────────────
Required: 1 VVB_ADMIN + 1 VVB_VALIDATOR
Quorum: 2/2 (100%)

State:
  Day 1:
    - Alice_Admin (VVB_ADMIN) votes APPROVE
    - Pending: John_Smith (VVB_VALIDATOR) vote

  Day 2:
    - John_Smith (VVB_VALIDATOR) votes APPROVE

Action:
  ✓ Consensus reached on Day 2
  → Fire ApprovalDecisionEvent(APPROVED)
  → Trigger retirement workflow


SCENARIO 3: CRITICAL Approval with Fault Tolerance
─────────────────────────────────────
Required: 2 VVB_ADMIN + 1 VVB_VALIDATOR
Quorum: 3/3 (100%)
BFT: f=0 (unanimous required)

State:
  Day 1:
    - Alice_Admin (VVB_ADMIN) votes APPROVE
    - Bob_Admin (VVB_ADMIN) votes APPROVE
    - Pending: John_Smith (VVB_VALIDATOR) vote

  Day 3:
    - John_Smith (VVB_VALIDATOR) votes REJECT

Action:
  ✗ Consensus NOT reached (1 rejection blocks)
  → State remains PENDING_VVB
  → Continue waiting or timeout

  Day 7:
    - No new approvals received
    → TIMEOUT triggered
    → Fire ApprovalDecisionEvent(TIMEOUT)
    → Cascade reject to dependent tokens


SCENARIO 4: Parallel Voting with Different Quorums
─────────────────────────────────────
Multiple STANDARD approvals in flight:

Event: Create 5 secondary tokens (5 STANDARD approvals needed)
  t=0:  Submit all 5 → All enter PENDING_VVB
  t=5:  John_Smith approves tokens 1,2,3 → 3 activate immediately
  t=10: Jane_Validator approves tokens 4,5 → 2 activate

Result: All 5 activated within 10ms
```

---

## 4. DATABASE SCHEMA DETAILS

### 4.1 VVB Validators Table

```sql
-- vvb_validators: Core voter registry
CREATE TABLE vvb_validators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('VVB_VALIDATOR', 'VVB_ADMIN')),
    approval_authority VARCHAR(50) NOT NULL CHECK (
        approval_authority IN ('STANDARD', 'ELEVATED', 'CRITICAL')
    ),
    keycloak_id VARCHAR(255),  -- Link to IAM/Keycloak user
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role_authority CHECK (
        (role = 'VVB_VALIDATOR' AND approval_authority = 'STANDARD') OR
        (role = 'VVB_ADMIN' AND approval_authority IN ('ELEVATED', 'CRITICAL'))
    )
);

CREATE INDEX idx_vvb_validators_name ON vvb_validators(name);
CREATE INDEX idx_vvb_validators_role ON vvb_validators(role);
CREATE INDEX idx_vvb_validators_active ON vvb_validators(active);
```

### 4.2 Approval Rules Table

```sql
-- vvb_approval_rules: Rules engine
CREATE TABLE vvb_approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_type VARCHAR(100) UNIQUE NOT NULL,
    -- Examples: SECONDARY_TOKEN_CREATE, SECONDARY_TOKEN_RETIRE, PRIMARY_TOKEN_RETIRE
    requires_vvb BOOLEAN DEFAULT TRUE,
    role_required VARCHAR(50) NOT NULL CHECK (role_required IN ('VVB_VALIDATOR', 'VVB_ADMIN')),
    approval_type VARCHAR(50) NOT NULL CHECK (
        approval_type IN ('STANDARD', 'ELEVATED', 'CRITICAL')
    ),
    timeout_days INTEGER DEFAULT 7 CHECK (timeout_days > 0),
    cascade_on_rejection BOOLEAN DEFAULT TRUE,  -- Reject children if parent rejected
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vvb_approval_rules_change_type ON vvb_approval_rules(change_type);
CREATE INDEX idx_vvb_approval_rules_approval_type ON vvb_approval_rules(approval_type);
```

### 4.3 Approvals Table

```sql
-- vvb_approvals: Vote ledger (immutable)
CREATE TABLE vvb_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL,  -- FK to token_versions
    approver_id VARCHAR(255) NOT NULL,  -- FK to vvb_validators.name
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'ABSTAIN')),
    reason TEXT,  -- Optional comment (required for REJECTED)
    signature BYTEA,  -- Cryptographic signature (future: blockchain signing)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_vote UNIQUE(version_id, approver_id),  -- One vote per approver
    FOREIGN KEY (approver_id) REFERENCES vvb_validators(name) ON DELETE RESTRICT,
    FOREIGN KEY (version_id) REFERENCES token_versions(version_id) ON DELETE CASCADE
);

CREATE INDEX idx_vvb_approvals_version_id ON vvb_approvals(version_id);
CREATE INDEX idx_vvb_approvals_approver_id ON vvb_approvals(approver_id);
CREATE INDEX idx_vvb_approvals_decision ON vvb_approvals(decision);
CREATE INDEX idx_vvb_approvals_created_at ON vvb_approvals(created_at);
```

### 4.4 Timeline (Audit Trail) Table

```sql
-- vvb_timeline: Immutable event log
CREATE TABLE vvb_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL,  -- FK to token_versions
    event_type VARCHAR(100) NOT NULL,
    -- Examples: SUBMITTED, APPROVED, REJECTED, TIMEOUT, CASCADE_REJECT, REACTIVATED
    actor_id VARCHAR(255),  -- User/system who triggered event
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB,  -- Flexible event metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (version_id) REFERENCES token_versions(version_id) ON DELETE CASCADE
);

CREATE INDEX idx_vvb_timeline_version_id ON vvb_timeline(version_id);
CREATE INDEX idx_vvb_timeline_event_type ON vvb_timeline(event_type);
CREATE INDEX idx_vvb_timeline_event_timestamp ON vvb_timeline(event_timestamp);
CREATE INDEX idx_vvb_timeline_actor_id ON vvb_timeline(actor_id);
```

### 4.5 Query Performance Indexes

```sql
-- Critical path queries (must be <5ms)

-- 1. Get pending approvals for a version
-- Query: SELECT * FROM vvb_approvals WHERE version_id = ? AND decision IS NULL
CREATE INDEX idx_vvb_approvals_version_decision ON vvb_approvals(version_id, decision);

-- 2. Get all pending versions
-- Query: SELECT version_id FROM token_versions WHERE status = 'PENDING_VVB'
CREATE INDEX idx_token_versions_status ON token_versions(status);

-- 3. Get approvers by role
-- Query: SELECT * FROM vvb_validators WHERE role = ? AND active = TRUE
CREATE INDEX idx_vvb_validators_role_active ON vvb_validators(role, active);

-- 4. Get timeline events for audit
-- Query: SELECT * FROM vvb_timeline WHERE version_id = ? ORDER BY event_timestamp DESC
CREATE INDEX idx_vvb_timeline_version_timestamp ON vvb_timeline(version_id, event_timestamp DESC);

-- 5. Get active child tokens by parent (for retirement validation)
-- Query: SELECT * FROM secondary_token_registry WHERE parent_token_id = ? AND status != 'REDEEMED'
CREATE INDEX idx_secondary_registry_parent_status ON secondary_token_registry(parent_token_id, status);
```

---

## 5. API SPECIFICATION OVERVIEW

### 5.1 REST Endpoints Summary (8 endpoints)

```
1. POST /api/v12/vvb/validate
   ├─ Purpose: Submit token for VVB approval
   ├─ Auth: Authenticated users
   ├─ Body: {changeType, description, submitterId, metadata}
   ├─ Returns: {versionId, status: PENDING_VVB, pendingApprovers}
   └─ Performance: <100ms

2. POST /api/v12/vvb/{versionId}/approve
   ├─ Purpose: Vote to approve
   ├─ Auth: VVB_VALIDATOR or VVB_ADMIN
   ├─ Body: {approverId, comments}
   ├─ Returns: {versionId, status, consensusReached}
   └─ Performance: <50ms

3. POST /api/v12/vvb/{versionId}/reject
   ├─ Purpose: Vote to reject
   ├─ Auth: VVB_VALIDATOR or VVB_ADMIN
   ├─ Body: {approverId, reason}
   ├─ Returns: {versionId, status: REJECTED, affectedTokens}
   └─ Performance: <50ms (excluding cascade)

4. GET /api/v12/vvb/{versionId}/details
   ├─ Purpose: Get approval details
   ├─ Auth: Authenticated
   ├─ Returns: {versionId, approvalType, votes, timeline}
   └─ Performance: <20ms

5. GET /api/v12/vvb/pending
   ├─ Purpose: List pending approvals for caller
   ├─ Auth: VVB_VALIDATOR or VVB_ADMIN
   ├─ Query: ?page=0&limit=50
   ├─ Returns: [{versionId, changeType, approvalType, pendingApprovers}]
   └─ Performance: <50ms

6. GET /api/v12/vvb/statistics
   ├─ Purpose: VVB metrics and statistics
   ├─ Auth: Any authenticated
   ├─ Query: ?startDate=2025-01-01&endDate=2025-01-31
   ├─ Returns: {approvedCount, rejectedCount, avgApprovalTime, approvalRate}
   └─ Performance: <100ms (cached)

7. GET /api/v12/vvb/governance/retirement-validation
   ├─ Purpose: Check if primary token can retire
   ├─ Auth: Any authenticated
   ├─ Query: ?primaryTokenId=...
   ├─ Returns: {tokenId, isValid, message, blockingTokens}
   └─ Performance: <5ms

8. GET /api/v12/vvb/governance/blocking-tokens
   ├─ Purpose: Get child tokens preventing retirement
   ├─ Auth: Any authenticated
   ├─ Query: ?primaryTokenId=...
   ├─ Returns: [secondaryTokenId, secondaryTokenId, ...]
   └─ Performance: <5ms
```

---

## 6. INTEGRATION WITH EXISTING SYSTEMS

### 6.1 Integration with Story 4 (Secondary Token Versioning)

**Connection Points**:

```
SecondaryTokenVersioningService (Story 4)
    │
    ├→ When creating new version:
    │   Call: VVBValidator.validateTokenVersion()
    │   Wait: ApprovalDecisionEvent
    │   Action: If APPROVED → update version status to ACTIVE
    │
    ├→ When retiring version:
    │   Call: VVBValidator.validateRetirement()
    │   Check: TokenLifecycleGovernance.canRetire()
    │   Wait: ApprovalDecisionEvent
    │
    └→ Events fired by VVB:
        ├─ ApprovalInitiatedEvent → Notify approvers
        ├─ ApprovalDecisionEvent → Trigger token activation
        └─ CascadeRejectionEvent → Mark children as REJECTED
```

**Data Dependencies**:

```
VVB reads from Story 4:
├─ token_versions table (change_type, current status)
├─ secondary_token_registry (parent-child relationships)
└─ SecondaryTokenVersioningService (state transitions)

VVB writes to Story 4:
├─ token_versions (status = PENDING_VVB → APPROVED/REJECTED)
└─ token_registry updates (via events)
```

### 6.2 Integration with Story 3 (Secondary Token Implementation)

**Connection Points**:

```
SecondaryTokenService (Story 3)
    │
    ├→ Token creation:
    │   Call: VVBValidator.validateTokenVersion(SECONDARY_TOKEN_CREATE)
    │   Wait: ApprovalDecisionEvent
    │   Action: Store token when APPROVED
    │
    ├→ Token lifecycle:
    │   Call: TokenLifecycleGovernance for validation
    │   Check: Can this operation proceed?
    │   Action: Proceed only if governance check passes
    │
    └→ Registry maintenance:
        ├─ Update SecondaryTokenRegistry on APPROVED
        └─ Query parent-child relationships on REJECTED
```

### 6.3 Integration with Story 2 (Primary Token Registry)

**Connection Points**:

```
PrimaryTokenRegistry (Story 2)
    │
    ├→ Retirement validation:
    │   Call: TokenLifecycleGovernance.canRetire(primaryTokenId)
    │   Check: countActiveSecondaryTokens() > 0?
    │   Block: Prevent retirement if children exist
    │
    ├→ Cross-story governance:
    │   Query: SecondaryTokenRegistry.getChildrenByParent()
    │   Action: Verify all children are REDEEMED/EXPIRED before retiring
    │
    └→ Data consistency:
        ├─ Primary token must be ACTIVE for secondary creation
        └─ Cannot retire primary with CREATED/ACTIVE secondaries
```

### 6.4 TokenLifecycleGovernance (Cross-Cutting Concern)

**Shared Validation Logic**:

```
TokenLifecycleGovernance.validateRetirement(tokenId) {
    token = lookup(tokenId)

    if (token is PRIMARY) {
        // Check for active secondary tokens
        activeChildren = SecondaryTokenRegistry.getActiveByParent(tokenId)
        if (activeChildren.count > 0) {
            return BLOCKED("Cannot retire: N active secondary tokens")
        }
    }

    if (token is SECONDARY) {
        // Check parent status
        parent = PrimaryTokenRegistry.lookup(token.parentTokenId)
        if (parent.status != ACTIVE) {
            return BLOCKED("Cannot retire: parent not active")
        }
    }

    return ALLOWED
}
```

---

## 7. PERFORMANCE TARGETS & OPTIMIZATIONS

### 7.1 Performance Targets

| Operation | Target | Optimizations |
|-----------|--------|---|
| Approval decision | <100ms | In-memory quorum calculation |
| Vote recording | <50ms | Async DB write with Mutiny |
| Lookup pending | <20ms | Indexed by version_id + status |
| Retirement validation | <5ms | Cached count query |
| Statistics calculation | <100ms | Daily aggregation cache |
| Cascade rejection | <500ms | Batch update operation |

### 7.2 Optimization Strategy

```
1. DATABASE LAYER
   ├─ Composite indexes on hot paths
   │   └─ (version_id, decision, created_at)
   ├─ Materialized views for statistics
   │   └─ vvb_approval_stats (updated nightly)
   └─ Connection pooling
       └─ Min: 5, Max: 20, Timeout: 3s

2. APPLICATION LAYER
   ├─ In-memory quorum calculator
   │   └─ Lightweight consensus computation
   ├─ Async CDI events
   │   └─ Non-blocking approval decision firing
   ├─ Caching strategy
   │   ├─ vvb_validators (TTL: 1h)
   │   ├─ approval_rules (TTL: 24h)
   │   └─ statistics (updated hourly)
   └─ Reactive streams
       └─ Mutiny for non-blocking I/O

3. NETWORK LAYER
   ├─ Response compression (gzip)
   ├─ HTTP/2 multiplexing
   └─ Connection keep-alive

4. QUERY OPTIMIZATION
   ├─ Avoid N+1 queries
   │   └─ Batch load approvers for version
   ├─ Lazy load relationships
   │   └─ Load children only when needed
   └─ Pagination on large result sets
       └─ Limit: 50 by default
```

---

## 8. SECURITY & THREAT ANALYSIS

### 8.1 Security Model

```
THREAT MATRIX:
═════════════════════════════════════════════════════════════════

Threat: Unauthorized Approval
├─ Attack: User without VVB role submits approval
├─ Defense: Role-based access control (RolesAllowed annotation)
│          + Keycloak integration for IAM
├─ Evidence: Signed JWT in Authorization header
└─ Impact: CRITICAL (prevent by validation)

Threat: Vote Tampering
├─ Attack: Attacker modifies vote in database
├─ Defense: Cryptographic signatures on votes
│          + Immutable audit trail
│          + Blockchain eventual consistency
├─ Evidence: vvb_approvals.signature field
└─ Impact: CRITICAL (prevent by cryptography)

Threat: Double Voting
├─ Attack: Same approver submits multiple approval decisions
├─ Defense: UNIQUE constraint (version_id, approver_id)
│          + Application-level check in VVBValidator
├─ Evidence: Constraint violation error
└─ Impact: HIGH (prevent by constraint)

Threat: Consensus Manipulation
├─ Attack: Attacker adds fake approvers to reach consensus
├─ Defense: Approvers must exist in vvb_validators table
│          + Role validation
│          + Keycloak integration
├─ Evidence: Foreign key constraint
└─ Impact: CRITICAL (prevent by constraint)

Threat: Cascade Attack
├─ Attack: Reject parent token to orphan all children
├─ Defense: Intentional design (security feature)
│          + Proper governance rules
│          + Audit trail of cascade
├─ Evidence: vvb_timeline cascade events logged
└─ Impact: MEDIUM (feature, not bug)

Threat: Denial of Service (DOS)
├─ Attack: Flood approval endpoint with requests
├─ Defense: Rate limiting (future)
│          + Authentication requirement
│          + Request throttling
├─ Evidence: X-RateLimit-* headers
└─ Impact: HIGH (prevent by rate limiting)

Threat: Timeout Exploitation
├─ Attack: Keep approval pending to delay operations
├─ Defense: 7-day timeout with auto-reject
│          + Escalation notifications
│          + Manual timeout endpoint (admin)
├─ Evidence: vvb_timeline TIMEOUT events
└─ Impact: MEDIUM (prevent by timeout)
```

### 8.2 Data Protection

```
ENCRYPTION & STORAGE:
────────────────────────────────────────────────────────────

1. In Transit
   ├─ TLS 1.3 for all APIs
   ├─ HTTPS only (no HTTP)
   └─ Certificate pinning for critical endpoints

2. At Rest
   ├─ PostgreSQL table encryption (pgcrypto or native)
   ├─ Application-level encryption for sensitive fields
   │   └─ reason (rejection reasons)
   │   └─ comments (approval comments)
   └─ Backup encryption (separate from production keys)

3. Audit Trail
   ├─ vvb_timeline immutable
   ├─ Application timestamp verification
   └─ Regular backup integrity checks
```

---

## 9. IMPLEMENTATION ROADMAP (5-Day Sprint)

### 9.1 Critical Path

```
DAY 1: Foundation & Schemas
├─ VVBValidator skeleton + schema
├─ VVBApprovalRule enum definitions
├─ Database migrations (V31, V32, V33)
└─ Checkpoint: Schemas verified

DAY 2: Core Service Implementation
├─ VVBValidator quorum algorithm
├─ TokenLifecycleGovernance rules
├─ VVBWorkflowService state machine
└─ Checkpoint: Unit tests passing

DAY 3: REST API & Integration
├─ VVBResource endpoints (8 endpoints)
├─ Story 4 integration (CDI events)
├─ Error handling & validation
└─ Checkpoint: Integration tests passing

DAY 4: Testing & Optimization
├─ 120+ comprehensive tests
├─ Performance validation
├─ Security validation
└─ Checkpoint: All tests passing, >95% coverage

DAY 5: Documentation & Release
├─ Javadoc completion
├─ API documentation
├─ Production readiness checklist
└─ Checkpoint: Ready for deployment
```

---

## 10. DEFINITION OF DONE CHECKLIST

```
CODE:
├─ [ ] 4 service classes fully implemented (1,200 LOC)
├─ [ ] All 8 REST endpoints functional
├─ [ ] All compilation errors resolved
└─ [ ] Code review passed (2 reviewers)

TESTING:
├─ [ ] 120+ tests written and passing
├─ [ ] >95% code coverage
├─ [ ] Integration tests with Story 4 passing
├─ [ ] Performance tests meeting targets
└─ [ ] E2E tests in Selenium/Playwright

DOCUMENTATION:
├─ [ ] Javadoc on all public methods
├─ [ ] API specification complete
├─ [ ] Architecture diagrams finalized
├─ [ ] README updated
└─ [ ] Deployment guide written

QUALITY:
├─ [ ] Static analysis (SpotBugs) passing
├─ [ ] Security scan (OWASP) passing
├─ [ ] Mutation testing score >85%
└─ [ ] Performance benchmarks documented

DEPLOYMENT:
├─ [ ] Build successful (JAR + Native)
├─ [ ] All tests passing in CI/CD
├─ [ ] Database migrations verified
├─ [ ] Production readiness sign-off
└─ [ ] Release notes prepared
```

---

## 11. RELATED DOCUMENTATION

- `VVB-DATABASE-SCHEMA-DETAILED.md` - Complete SQL schema
- `VVB-API-SPECIFICATION-COMPLETE.md` - Full API documentation
- `VVB-IMPLEMENTATION-CRITICAL-PATH.md` - Detailed implementation plan
- `COMPREHENSIVE-TEST-PLAN-V12.md` - Testing strategy
- `SecondaryTokenVersioningService.java` - Story 4 integration point

---

**Document Version**: 1.0
**Last Updated**: December 23, 2025 17:00 UTC
**Next Review**: December 24, 2025 (Sprint Kickoff)
