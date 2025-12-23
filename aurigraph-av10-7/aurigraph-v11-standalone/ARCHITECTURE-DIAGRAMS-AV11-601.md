# Architecture Diagrams: Secondary Token Versioning System
## AV11-601 Visual Architecture & Design Patterns

**Document**: Architecture Visualization & Component Diagrams
**Date**: December 23, 2025
**Format**: PlantUML + ASCII diagrams

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     REST API Layer                              │
│  SecondaryTokenVersionResource (7 endpoints)                    │
│  ├─ POST /versions                                              │
│  ├─ GET /versions                                               │
│  ├─ GET /versions/{versionId}                                   │
│  ├─ POST /versions/{versionId}/replace                          │
│  ├─ GET /audit-trail                                            │
│  └─ GET /audit-trail/report                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Versioning   │  │ VVB Validation   │  │ Audit Trail      │
│ Service      │  │ Layer            │  │ Service          │
│              │  │                  │  │                  │
│ • Create     │  │ • Classify       │  │ • Log events     │
│ • Activate   │  │ • Validate       │  │ • Query          │
│ • Replace    │  │ • Approve/       │  │ • Replay         │
│ • Archive    │  │   Reject         │  │ • Export         │
└──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Secondary    │  │ Merkle Service   │  │ Registry         │
│ Token        │  │                  │  │                  │
│ Version      │  │ • Hash chains    │  │ • Index queries  │
│ Entity       │  │ • Proof gen      │  │ • Version lookup │
│              │  │ • Chain verify   │  │ • Type filtering │
└──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
       │                   │                     │
       └───────────────────┼─────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  PostgreSQL    │
                  │  Database      │
                  │  • Versions    │
                  │  • Audit Trail │
                  └────────────────┘
```

---

## 2. VERSION CHAIN ARCHITECTURE

### Version Lifecycle State Machine

```
                    ┌─────────────┐
                    │   CREATED   │
                    └──────┬──────┘
                           │
                    User creates version
                           │
                    ┌──────▼──────┐
                    │  PENDING_   │
                    │   VVB       │
                    └──────┬──────┘
                           │
                   VVB processing
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
           ┌──────────────┐ ┌──────────┐
           │   APPROVED   │ │ REJECTED │
           └──────┬───────┘ └────┬─────┘
                  │              │
        Activate  │              └─ Notify, allow retry
                  │
                  ▼
           ┌──────────────┐
           │    ACTIVE    │
           └──────┬───────┘
                  │
        New version created
                  │
                  ▼
           ┌──────────────┐
           │   REPLACED   │
           └──────┬───────┘
                  │
        User archives
                  │
                  ▼
           ┌──────────────┐
           │   ARCHIVED   │
           └──────────────┘
```

### Version Chain Example (Ownership)

```
Initial State: Property owned by John Doe
    │
    ├─ v1: ACTIVE (John Doe, created 2025-01-15)
    │

After v2 created & approved (Jane Smith inheritance):
    │
    ├─ v1: REPLACED (John Doe, created 2025-01-15, replaced 2025-02-10)
    │
    ├─ v2: ACTIVE (Jane Smith, created 2025-02-10, vvb_approved 2025-02-10)
    │

After v3 created & approved (Bob Smith gift):
    │
    ├─ v1: REPLACED (John Doe, 2025-01-15 → 2025-02-10)
    │
    ├─ v2: REPLACED (Jane Smith, 2025-02-10 → 2025-03-15)
    │
    └─ v3: ACTIVE (Bob Smith, created 2025-03-15, vvb_approved 2025-03-15)
```

---

## 3. MERKLE PROOF CHAIN ARCHITECTURE

### Hierarchical Proof Chain

```
Composite Token (Top Level)
    │
    └─ CompositeHash = H(composite_data | SecondaryProof)
                           │
                           └─ SecondaryProof = [v3_hash, v2_hash, v1_hash, chain_root]
                                   │
                                   ├─ v3 (ACTIVE): H(v3_id | content | v2_hash)
                                   │
                                   ├─ v2 (REPLACED): H(v2_id | content | v1_hash)
                                   │
                                   └─ v1 (REPLACED): H(v1_id | content | 0x00...)
                                           │
                                           └─ Merkle Root for version chain


Primary Token (Bottom Level)
    │
    └─ PrimaryHash = H(primary_data)
```

### Merkle Tree for Version Chain

```
                        ├─────────────────┐
                        │   Merkle Root   │ (all 3 versions)
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼──────┐           ┌─────▼──────┐
              │  H(v1,v2)  │           │  H(v3)     │
              └─────┬──────┘           └─────┬──────┘
                    │                        │
            ┌───────┴────────┐               │
            │                │               │
        ┌───▼──┐        ┌───▼──┐       ┌───▼──┐
        │ H(v1)│        │ H(v2)│       │ H(v3)│
        └──────┘        └──────┘       └──────┘
        v1 Hash        v2 Hash        v3 Hash


Proof for v2: [H(v1), H(v3), Root]
Verification: H(H(H(v1) || H(v2)) || H(v3)) == Root ✓
```

---

## 4. AUDIT TRAIL ARCHITECTURE

### Event Flow Diagram

```
User Action (Create/Replace/Approve)
    │
    ▼
┌─────────────────────────────────┐
│ SecondaryTokenVersioningService │
│ (Business Logic)                │
└────────────┬────────────────────┘
             │
             ├─ Update Version State
             │
             ├─ Call VVB Validator [if critical]
             │
             └─ Fire AuditTrailService.logEvent()
                         │
                         ▼
              ┌─────────────────────────────────┐
              │   AuditTrailService             │
              │ (Append-Only Logging)           │
              │                                 │
              │ • Create AuditTrailEvent        │
              │ • Compute integrity hash        │
              │ • Insert (no updates allowed)   │
              │ • Fire event observers          │
              └────────────┬────────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ PostgreSQL DB    │
                  │ audit_trail      │
                  │ (immutable)      │
                  └──────────────────┘
                           │
                           ├─ Hot Index: Recent events
                           │
                           └─ Cold Storage: Archived after retention
```

### Audit Event Structure

```
┌─────────────────────────────────────────────────┐
│ AuditTrailEvent                                 │
├─────────────────────────────────────────────────┤
│ id: UUID                                        │
│ secondary_token_id: UUID                        │
│ version_id: UUID                                │
│ event_type: CREATED|ACTIVATED|REPLACED|...     │
│ actor: "user@example.com"                       │
│ timestamp: 2025-02-10T14:30:00Z                │
│ from_state: "CREATED"                          │
│ to_state: "ACTIVE"                             │
│ reason: "Ownership transfer approved by VVB"   │
│ metadata: {                                     │
│   "vvb_approval_hash": "0x123abc...",          │
│   "merkle_root_before": "0x456def...",         │
│   "merkle_root_after": "0x789ghi..."           │
│ }                                               │
│ hash: SHA256(event_id|timestamp|actor|action) │
└─────────────────────────────────────────────────┘
```

---

## 5. REST API LAYER ARCHITECTURE

### Request/Response Flow

```
Client Request
    │
    ├─ POST /api/v12/secondary-tokens/{tokenId}/versions
    │         with CreateVersionRequest JSON
    │
    ▼
┌──────────────────────────────────┐
│ SecondaryTokenVersionResource    │
│ Request Validation               │
│ (Jakarta Bean Validation)        │
└────────────┬─────────────────────┘
             │
    ┌────────▼────────┐
    │                 │
    ▼                 ▼
Invalid          Valid
    │                │
    ▼                ▼
400 Error      SecondaryTokenService
              .createVersion()
                     │
                     ├─ Validate parent
                     ├─ Create version
                     ├─ Register in DB
                     └─ Log audit event
                     │
                     ▼
              SecondaryToken returned
                     │
                     ▼
         ┌──────────────────────────┐
         │ ResponseDTO              │
         │ ├─ tokenId               │
         │ ├─ versionId             │
         │ ├─ status                │
         │ ├─ faceValue             │
         │ └─ createdAt             │
         └──────────────────────────┘
                     │
                     ▼
            201 Created (JSON)
                     │
                     ▼
              Client receives response
```

---

## 6. DATABASE SCHEMA ARCHITECTURE

### Table Relationships

```
┌─────────────────────────┐
│  secondary_tokens       │ (existing)
│  ──────────────────────│
│  id (PK)                │
│  parent_primary_id (FK) │
│  owner                  │
│  status                 │
└───────────┬─────────────┘
            │
            │ 1:N (one token → many versions)
            │
            ▼
┌──────────────────────────────────┐
│ secondary_token_versions (NEW)   │
│ ──────────────────────────────── │
│ id (PK)                          │
│ secondary_token_id (FK)          │◄─ UNIQUE(token_id, version_number)
│ version_number                   │
│ content (JSONB)                  │
│ status                           │
│ created_by                       │
│ created_at                       │
│ replaced_by                      │
│ merkle_hash                      │
│ vvb_status                       │
│ vvb_result_hash                  │
└────────────┬─────────────────────┘
             │
             │ Generates events for
             │
             ▼
┌──────────────────────────────────┐
│ secondary_token_audit_trail(NEW) │
│ ──────────────────────────────── │
│ id (PK, unique event ID)         │
│ secondary_token_id (FK)          │
│ version_id (FK)                  │
│ event_type                       │
│ actor                            │
│ timestamp                        │
│ from_state                       │
│ to_state                         │
│ reason                           │
│ metadata (JSONB)                 │
│ hash (immutable)                 │
└──────────────────────────────────┘
```

### Indexes for Performance

```
secondary_token_versions:
├─ PK: id
├─ UNIQUE: (secondary_token_id, version_number)
├─ INDEX: (secondary_token_id, status)
├─ INDEX: (status, created_at)
└─ INDEX: (vvb_status)

secondary_token_audit_trail:
├─ PK: id
├─ INDEX: (secondary_token_id) ◄─ Query all events for token
├─ INDEX: (version_id)          ◄─ Events for specific version
├─ INDEX: (timestamp)            ◄─ Date range queries
├─ INDEX: (actor)                ◄─ Events by user
└─ INDEX: (event_type)           ◄─ Events by type
```

---

## 7. COMPONENT INTERACTION DIAGRAM

### Creation Flow

```
User Interface
    │
    └─ POST /secondary-tokens/{tokenId}/versions
                    │
                    ▼
    SecondaryTokenVersionResource
    ├─ Validate input (DTOs)
    └─ Call service.createVersion()
                    │
                    ▼
    SecondaryTokenVersioningService
    ├─ Validate parent exists (PrimaryTokenRegistry)
    ├─ Create SecondaryTokenVersion entity
    ├─ Assign version number
    ├─ Set status = CREATED
    ├─ Persist to database
    └─ Call merkleService.hashVersion()
                    │
                    ▼
    SecondaryTokenMerkleService
    ├─ Compute hash: H(versionId | version# | content | parentHash)
    ├─ Link to previous version
    └─ Update merkle tree
                    │
                    ▼
    SecondaryTokenVersioningService (continued)
    └─ Call auditService.logEvent()
                    │
                    ▼
    AuditTrailService
    ├─ Create AuditTrailEvent
    ├─ Set event_type = CREATED
    ├─ Compute integrity hash
    └─ Insert (append-only)
                    │
                    ▼
    Response to Client
    ├─ Status 201 Created
    ├─ Return TokenResponse DTO
    └─ Include versionId, status, createdAt
```

### Replacement Flow (Critical: Requires VVB)

```
User Interface
    │
    └─ POST /secondary-tokens/{tokenId}/versions/{versionId}/replace
                    │
                    ▼
    SecondaryTokenVersionResource
    ├─ Validate input
    └─ Call service.replaceVersion()
                    │
                    ▼
    SecondaryTokenVersioningService
    ├─ Get active version (v1)
    ├─ Create new version (v2)
    ├─ Set status = CREATED
    ├─ Classify change: CRITICAL (ownership)
    └─ Trigger VVB validation
                    │
                    ▼
    VVBVersionValidator
    ├─ Extract content
    ├─ Call VVBVerificationService.validate()
    ├─ Set status = PENDING_VVB
    └─ Async callback on approval/rejection
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼ APPROVED              ▼ REJECTED
    AuditTrailService       AuditTrailService
    ├─ Log APPROVED         ├─ Log REJECTED
    │                       │
    └─ Transition v2       └─ Keep v2 in
      from CREATED to          REJECTED state
      ACTIVE, v1 to           Notify user
      REPLACED
        │
        ▼
    SecondaryTokenMerkleService
    ├─ Update proof chain
    └─ Link v1→v2 hashes
        │
        ▼
    Response to Client
    ├─ Status 200 OK
    └─ Return updated version state
```

---

## 8. VVB INTEGRATION ARCHITECTURE

### VVB Validation Workflow

```
┌──────────────────────────────────────────┐
│ VersionTransitionWorkflow                │
│ (Manages VVB validation process)         │
└────────────┬─────────────────────────────┘
             │
    ┌────────▼────────┐
    │                 │
    ▼                 ▼
CRITICAL        INFORMATIONAL
    │                 │
    │                 ├─ Status = ACTIVE immediately
    │                 │
    │                 └─ Async VVB logging
    │
    ├─ Ownership change
    ├─ Authorization update
    │
    ▼
BLOCKING MODE
    │
    ├─ Status = PENDING_VVB
    │
    └─ Call VVBVerificationService.validate(token)
             │
             ├─ Timeout: 60s (configurable)
             │
             ├─ Result: APPROVED or REJECTED
             │
             ▼ APPROVED
             ├─ Update v2 status = ACTIVE
             ├─ Update v1 status = REPLACED
             └─ Log audit event

             ▼ REJECTED
             ├─ Keep v2 status = REJECTED
             ├─ Log rejection reason
             └─ Notify user (email, webhook)
```

### Async Approval Callback

```
VVB Validator (External Service)
    │
    ├─ Processes v2 content (async)
    │
    ├─ Approves: Calls callback
    │
    │       POST /api/v12/internal/vvb-callback
    │       {
    │         "version_id": "uuid",
    │         "status": "APPROVED",
    │         "approval_hash": "0x123abc...",
    │         "timestamp": "2025-02-10T14:30:00Z"
    │       }
    │
    └─ Updates version state in database
```

---

## 9. SCALABILITY & PERFORMANCE ARCHITECTURE

### Caching Strategy

```
┌─────────────────────────────────┐
│ In-Memory Cache (Spring Cache)  │
│ (per-instance, distributed OK)  │
├─────────────────────────────────┤
│ versionHash[versionId]          │ ◄─ Merkle hash lookup (O(1))
│ versionChain[tokenId]           │ ◄─ All versions for token
│ activeVersion[tokenId]          │ ◄─ Current active version
│ merkleProof[versionId]          │ ◄─ Cached proof
└────────────┬────────────────────┘
             │
    Cache TTL: 1 hour
    Invalidation: On version change
             │
             ▼
    If miss: Query PostgreSQL
    If hit: Return cached (O(1))
```

### Query Performance Targets

```
Operation                          Target      Method
──────────────────────────────────────────────────────
Create version                     < 50ms      Single insert + hash
Retrieve active version            < 5ms       Index lookup
Get version chain (100 versions)   < 50ms      Batch query + cache
VVB validation                     < 50ms      Async (non-blocking)
Audit logging                      < 10ms      Append-only insert
Generate merkle proof              < 100ms     Incremental update
Bulk create (100 versions)         < 100ms     Batch insert
Bulk create (1000 versions)        < 1000ms    Transaction management
Query 10k audit events             < 100ms     Indexed range scan
Compliance report generation       < 30s       Stream export
```

---

## 10. DEPLOYMENT ARCHITECTURE

### Docker Deployment

```
┌────────────────────────────────────────────────┐
│            Kubernetes Cluster                  │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │        Aurigraph V12 Pod                │  │
│  ├─────────────────────────────────────────┤  │
│  │                                         │  │
│  │  ┌────────────────────────────────┐    │  │
│  │  │ Java Application (Quarkus)     │    │  │
│  │  │ • Versioning Service           │    │  │
│  │  │ • REST API (port 9003)         │    │  │
│  │  │ • VVB Integration              │    │  │
│  │  │ • Audit Trail Logging          │    │  │
│  │  │ • Merkle Proof Generation      │    │  │
│  │  └────────────────────────────────┘    │  │
│  │                 │                      │  │
│  └─────────────────┼──────────────────────┘  │
│                    │                         │
│  ┌─────────────────▼──────────────────────┐  │
│  │    PostgreSQL Database Pod             │  │
│  │  ├─ secondary_token_versions           │  │
│  │  ├─ secondary_token_audit_trail        │  │
│  │  └─ Persistent Volume (data)           │  │
│  └────────────────────────────────────────┘  │
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │  Monitoring & Logging                  │   │
│  │  • Prometheus metrics                  │   │
│  │  • ELK stack (logs)                    │   │
│  │  • Grafana dashboards                  │   │
│  └────────────────────────────────────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 11. SEQUENCE DIAGRAMS

### Ownership Change Sequence

```
User        API         Service      VVB         DB         Audit
│           │           │            │           │           │
├──POST──────>          │            │           │           │
│ /replace   │          │            │           │           │
│           │──CREATE──>│            │           │           │
│           │ Version   │──VALIDATE─>│           │           │
│           │           │            │           │           │
│           │ (wait)    │ (wait)     │ (process) │           │
│           │           │            │           │           │
│           │ <APPROVED─┤<───────────┤           │           │
│           │           │            │           │           │
│           │ <UPDATE───┤           │           │ <PERSIST─┤
│           │ STATUS    │           │           │  Versions │
│           │           │           │           │           │
│           │           │           │           │ <APPEND──┤
│           │           │           │           │  Audit    │
│           │           │           │           │  Event    │
│           │<──201─────┤           │           │           │
│<─RESPONSE─┤           │           │           │           │
│           │           │           │           │           │
```

---

## 12. COMPONENT COUPLING DIAGRAM

### Dependency Graph

```
┌──────────────────────────────────────────────────────┐
│ REST API Layer                                       │
│ SecondaryTokenVersionResource                        │
└───────────────┬──────────────────────────────────────┘
                │ depends on
                ▼
┌──────────────────────────────────────────────────────┐
│ Service Layer                                        │
│ ├─ SecondaryTokenVersioningService                   │
│ ├─ VVBVersionValidator                               │
│ ├─ VersionTransitionWorkflow                         │
│ └─ AuditTrailService                                 │
└───────────────┬──────────────────────────────────────┘
                │ depends on
        ┌───────┼────────┬──────────┐
        │       │        │          │
        ▼       ▼        ▼          ▼
    ┌────┐ ┌────┐ ┌────┐ ┌────────────┐
    │DB  │ │VVB │ │Cache│ │Merkle      │
    │    │ │Svc │ │Mgr  │ │Service     │
    └────┘ └────┘ └────┘ └────────────┘

Coupling: LOOSE (services communicate via interfaces)
Dependency Injection: CDI (for testability)
```

---

## KEY ARCHITECTURAL PRINCIPLES

### 1. Separation of Concerns
- **REST Layer**: Request validation, response formatting
- **Service Layer**: Business logic, orchestration
- **Persistence Layer**: Database operations
- **Audit Layer**: Immutable event logging
- **Merkle Layer**: Cryptographic integrity

### 2. Single Responsibility
- SecondaryTokenVersioningService: Version lifecycle management
- VVBVersionValidator: VVB validation only
- AuditTrailService: Immutable logging only
- SecondaryTokenMerkleService: Merkle proofs only

### 3. Immutability
- Audit trail: Append-only (no updates, no deletes)
- SecondaryTokenVersion: Status transitions, never modified
- Merkle hashes: Recomputed, never stored incorrectly

### 4. Scalability
- Indexes on all query paths (<5ms target)
- Caching for frequently accessed data
- Async VVB processing (non-blocking)
- Batch operations for bulk creation

### 5. Testability
- Dependency injection (CDI) for mocking
- Service methods return Uni<T> (testable async)
- @Nested test classes for organization
- Clear test names (@DisplayName)

---

This document provides comprehensive architectural visualization for the secondary token versioning system, enabling stakeholders to understand component interactions, data flow, and design patterns.

