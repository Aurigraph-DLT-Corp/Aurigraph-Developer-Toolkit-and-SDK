# Work Breakdown Structure (WBS)
## AV11-601: Secondary Token Types, Registry & Versioning with VVB Integration

**Project**: Aurigraph V12 Composite Token System
**Component**: Secondary Token System with Multi-Occurrence Support
**Date**: December 23, 2025
**Scope Level**: Project (Epic-level breakdown)

---

## 1. PROJECT OVERVIEW

### Purpose
Enable secondary tokens to support multiple occurrences of the same type (e.g., multiple owners, multi-year tax receipts, multiple property photos), with full VVB validation and immutable audit trails for all state changes.

### Key Constraints
- All changes must go through VVB process (Verification Via Blockchain)
- Audit trail is immutable and comprehensive
- Version chains must maintain cryptographic integrity
- Backward compatibility with existing primary token system
- Performance targets: <100ms creation, <50ms VVB validation, <10ms audit logging

---

## 2. WORK BREAKDOWN STRUCTURE

```
AV11-601: Secondary Token Versioning & VVB Integration (EPIC)
│
├─ AV11-601-1: Core Versioning Infrastructure (Story, 8 SP)
│  ├─ AV11-601-1.1: SecondaryTokenVersion entity & database schema
│  ├─ AV11-601-1.2: SecondaryTokenVersioningService (chain management)
│  ├─ AV11-601-1.3: Version state machine (CREATED → ACTIVE → REPLACED → ARCHIVED)
│  └─ AV11-601-1.4: Tests (50 tests, 80% coverage)
│
├─ AV11-601-2: VVB Integration Layer (Story, 10 SP)
│  ├─ AV11-601-2.1: VVBValidationService integration
│  ├─ AV11-601-2.2: Version transition validation workflow
│  ├─ AV11-601-2.3: Merkle proof chaining through versions
│  ├─ AV11-601-2.4: VVB rejection handling & rollback
│  └─ AV11-601-2.5: Tests (60 tests, 85% coverage)
│
├─ AV11-601-3: Audit Trail System (Story, 8 SP)
│  ├─ AV11-601-3.1: AuditTrailEvent entity & indexing
│  ├─ AV11-601-3.2: AuditTrailService (immutable logging)
│  ├─ AV11-601-3.3: Audit retention policies (configurable)
│  ├─ AV11-601-3.4: Audit query & replay capabilities
│  └─ AV11-601-3.5: Tests (45 tests, 80% coverage)
│
├─ AV11-601-4: REST API for Versioning (Story, 7 SP)
│  ├─ AV11-601-4.1: SecondaryTokenVersionResource endpoints
│  ├─ AV11-601-4.2: Request DTOs (create version, request replacement, etc)
│  ├─ AV11-601-4.3: Response DTOs (version info, audit trail)
│  ├─ AV11-601-4.4: OpenAPI documentation
│  └─ AV11-601-4.5: Tests (35 tests, 80% coverage)
│
├─ AV11-601-5: Multi-Type Registry Updates (Story, 6 SP)
│  ├─ AV11-601-5.1: SecondaryTokenRegistry enhancements (multi-occurrence)
│  ├─ AV11-601-5.2: New indexes for version chains
│  ├─ AV11-601-5.3: Type-based version filtering
│  ├─ AV11-601-5.4: Version history queries
│  └─ AV11-601-5.5: Tests (40 tests, 80% coverage)
│
├─ AV11-601-6: Cross-Component Integration (Story, 5 SP)
│  ├─ AV11-601-6.1: PrimaryToken cascade operations
│  ├─ AV11-601-6.2: CompositeToken version propagation
│  ├─ AV11-601-6.3: Merkle proof chain updates
│  └─ AV11-601-6.4: Tests (30 tests, 75% coverage)
│
├─ AV11-601-7: E2E Testing & Validation (Story, 8 SP)
│  ├─ AV11-601-7.1: E2E test scenarios (20 flows)
│  ├─ AV11-601-7.2: VVB workflow testing
│  ├─ AV11-601-7.3: Audit trail verification
│  ├─ AV11-601-7.4: Performance benchmarking
│  └─ AV11-601-7.5: Load testing (concurrent versions)
│
└─ AV11-601-8: Documentation & Handoff (Story, 4 SP)
   ├─ AV11-601-8.1: Architecture documentation
   ├─ AV11-601-8.2: API documentation (OpenAPI + Swagger)
   ├─ AV11-601-8.3: Operational runbooks
   └─ AV11-601-8.4: Release notes & migration guide
```

**Total Story Points**: 56 SP
**Total Tasks**: 35 discrete work items
**Estimated Duration**: 4 sprints (2-week sprints = 8 weeks)

---

## 3. DETAILED TASK BREAKDOWN

### Phase 1: Core Versioning Infrastructure (Sprint 1-2)

#### AV11-601-1.1: SecondaryTokenVersion Entity
**Deliverables**:
- SecondaryTokenVersion.java (Panache entity, 250 LOC)
  - Fields: versionId, parentSecondaryTokenId, versionNumber, status, createdAt, updatedAt, replacedAt, replacedBy
  - State transitions: CREATED → ACTIVE → REPLACED → ARCHIVED
  - Indexes: (parentSecondaryTokenId, versionNumber), (status, createdAt)
- Database schema with proper constraints
- Javadoc (100% coverage)

**Effort**: 5 days

#### AV11-601-1.2: SecondaryTokenVersioningService
**Deliverables**:
- SecondaryTokenVersioningService.java (400 LOC)
  - `createVersion(parentSecondaryTokenId, content)` → returns new version
  - `replaceVersion(activeVersionId, newContent)` → initiates replacement
  - `getVersionChain(parentSecondaryTokenId)` → returns all versions
  - `getActiveVersion(parentSecondaryTokenId)` → returns current active
  - `archiveVersion(versionId)` → marks as archived
- Transaction boundaries with rollback support
- CDI events: VersionCreatedEvent, VersionReplacedEvent, VersionArchivedEvent

**Effort**: 6 days

#### AV11-601-1.3: Version State Machine
**Deliverables**:
- VersionStateMachine.java (200 LOC)
  - Valid transitions: CREATED → ACTIVE → REPLACED → ARCHIVED
  - Validate transitions before state changes
- Tests for all valid/invalid transitions
- Timeout handling (versions cannot stay CREATED > 30 days)

**Effort**: 4 days

#### AV11-601-1.4: Unit Tests (50 tests, ~400 LOC)
**Coverage**:
- Entity lifecycle (10 tests)
- Versioning service operations (20 tests)
- Version chain management (10 tests)
- State machine transitions (10 tests)

**Effort**: 5 days

---

### Phase 2: VVB Integration (Sprint 2-3)

#### AV11-601-2.1: VVBValidationService Integration
**Deliverables**:
- VVBVersionValidator.java (300 LOC)
  - Integrate with existing VVBVerificationService
  - Validate version content against VVB rules
  - Support blocking (synchronous) and non-blocking (async) modes
  - Timeout handling (default 60s, configurable)

**Effort**: 5 days

#### AV11-601-2.2: Version Transition Validation Workflow
**Deliverables**:
- VersionTransitionWorkflow.java (250 LOC)
  - Initiate VVB validation on version replacement
  - Handle VVB approval → transition to ACTIVE
  - Handle VVB rejection → transition to REJECTED (audit event)
  - Retry logic with exponential backoff

**Effort**: 6 days

#### AV11-601-2.3: Merkle Proof Chaining Through Versions
**Deliverables**:
- VersionMerkleChain.java (250 LOC)
  - Link version hashes: previousVersion → currentVersion → nextVersion
  - Proof generation including full chain (SECONDARY_v1 → SECONDARY_v2 → PRIMARY)
  - Incremental tree updates on version changes
  - Performance: < 100ms for chains up to 100 versions

**Effort**: 5 days

#### AV11-601-2.4: VVB Rejection Handling
**Deliverables**:
- RejectionHandler.java (150 LOC)
  - Automatic rollback on VVB rejection
  - Notification system (email, webhook)
  - Retry requests with updated content
  - Manual override capability (audit logged)

**Effort**: 4 days

#### AV11-601-2.5: Integration Tests (60 tests, ~450 LOC)
**Coverage**:
- VVB validation workflows (15 tests)
- Approval/rejection scenarios (10 tests)
- Version state transitions with VVB (15 tests)
- Merkle chain integrity (10 tests)
- Performance under load (10 tests)

**Effort**: 6 days

---

### Phase 3: Audit Trail System (Sprint 3)

#### AV11-601-3.1: AuditTrailEvent Entity
**Deliverables**:
- AuditTrailEvent.java (300 LOC)
  - Fields: eventId, timestamp, actor, tokenId, versionId, action, previousState, newState, versionChangeHash, metadata
  - Immutable (no updates, only inserts)
  - Indexes: (tokenId), (versionId), (timestamp), (actor)
- Database schema with retention policies

**Effort**: 5 days

#### AV11-601-3.2: AuditTrailService
**Deliverables**:
- AuditTrailService.java (300 LOC)
  - `logEvent(action, actor, tokenId, fromState, toState)` → immutable log
  - `getTokenAuditTrail(tokenId)` → full history
  - `queryEvents(filters)` → date range, actor, action
  - `replayEvents(tokenId)` → reconstruct state at any point in time
  - Performance: < 10ms logging, < 50ms query

**Effort**: 6 days

#### AV11-601-3.3: Audit Retention Policies
**Deliverables**:
- RetentionPolicy.java (150 LOC)
  - Configurable retention: PERMANENT, 7_YEARS, 5_YEARS, 3_YEARS
  - Archival to cold storage (S3/GCS)
  - GDPR compliance (right to be forgotten with audit trail preservation)

**Effort**: 4 days

#### AV11-601-3.4: Audit Query Capabilities
**Deliverables**:
- AuditQueryService.java (250 LOC)
  - Replay state at specific timestamp
  - Diff states between two points
  - Generate compliance reports
  - Export audit trail (PDF, CSV, JSON)

**Effort**: 5 days

#### AV11-601-3.5: Tests (45 tests, ~350 LOC)
**Coverage**:
- Event logging (10 tests)
- Immutability guarantees (8 tests)
- Query operations (12 tests)
- Replay functionality (10 tests)
- Performance under load (5 tests)

**Effort**: 5 days

---

### Phase 4: REST API & Registry (Sprint 3-4)

#### AV11-601-4.1: SecondaryTokenVersionResource
**Deliverables**:
- SecondaryTokenVersionResource.java (400 LOC)
  - POST `/api/v12/secondary-tokens/{tokenId}/versions` → create new version
  - GET `/api/v12/secondary-tokens/{tokenId}/versions` → list all versions
  - GET `/api/v12/secondary-tokens/{tokenId}/versions/{versionId}` → get specific version
  - POST `/api/v12/secondary-tokens/{tokenId}/versions/{versionId}/replace` → initiate replacement
  - POST `/api/v12/secondary-tokens/{tokenId}/versions/{versionId}/archive` → mark archived
  - GET `/api/v12/secondary-tokens/{tokenId}/audit-trail` → audit trail

**Effort**: 6 days

#### AV11-601-4.2-4.3: Request/Response DTOs
**Deliverables**:
- CreateVersionRequest (150 LOC)
- ReplaceVersionRequest (100 LOC)
- VersionResponse (150 LOC)
- VersionListResponse (100 LOC)
- AuditEventResponse (120 LOC)
- VVBValidationRequest/Response (100 LOC)

**Effort**: 4 days

#### AV11-601-4.5: API Tests (35 tests, ~300 LOC)
**Coverage**:
- CRUD operations (8 tests)
- Version replacement workflows (8 tests)
- Audit trail endpoints (8 tests)
- Validation & error handling (8 tests)
- OpenAPI compliance (3 tests)

**Effort**: 4 days

---

#### AV11-601-5: Multi-Type Registry Updates
**Deliverables**:
- Enhanced SecondaryTokenRegistry (200 LOC additions)
  - New indexes: (parentTokenId, tokenType, versionNumber), (parentTokenId, status, type)
  - `lookupByTypeAndVersion(parentTokenId, type, versionNumber)`
  - `getVersionChain(parentTokenId, type)` → ordered by versionNumber
  - `getActiveVersions(parentTokenId)` → one per type
- Tests (40 tests)

**Effort**: 5 days

---

### Phase 5: E2E Testing & Integration (Sprint 4)

#### AV11-601-7: End-to-End Test Scenarios
**Deliverables**:
20 comprehensive E2E test flows:
1. **Ownership Change Flow** (5 tests)
   - Owner v1 → VVB approval → v2 (new owner)
   - Multiple ownership changes in sequence
   - Concurrent ownership change requests
   - Rejection and retry

2. **Tax Receipt Versioning** (4 tests)
   - Multi-year tax receipts
   - Year-over-year changes
   - Audit trail reconstruction
   - Compliance reporting

3. **Property Photo Management** (4 tests)
   - Multiple photo uploads (same property, different years)
   - Photo replacement workflows
   - Version deduplication
   - Archival & retention

4. **Cross-Component Flows** (4 tests)
   - Primary token retirement with active secondary versions
   - Composite token versioning impact
   - Merkle proof chain integrity
   - Cascade operations

5. **Performance & Load** (3 tests)
   - 100 concurrent version creations
   - 1000 sequential version changes
   - Audit trail under load

**Effort**: 8 days

---

## 4. IMPLEMENTATION DEPENDENCIES

```
Phase 1 (Core)
├─ SecondaryTokenVersion entity
├─ SecondaryTokenVersioningService
├─ Version state machine
└─ [Tests: 50 tests]

Phase 2 (VVB Integration) - depends on Phase 1
├─ VVBVersionValidator
├─ VersionTransitionWorkflow
├─ Merkle chain updates
└─ [Tests: 60 tests]

Phase 3 (Audit) - parallel with Phase 2
├─ AuditTrailEvent entity
├─ AuditTrailService
├─ Query capabilities
└─ [Tests: 45 tests]

Phase 4 (API) - depends on Phases 1-3
├─ SecondaryTokenVersionResource
├─ DTOs
├─ Registry updates
└─ [Tests: 75 tests]

Phase 5 (E2E) - depends on Phases 1-4
└─ 20 comprehensive E2E flows
```

---

## 5. RESOURCE ALLOCATION

### Team Composition
- **Backend Developer (Lead)**: Core versioning + VVB integration
- **Database Engineer**: Schema design, indexing, optimization
- **QA Engineer**: Test planning, E2E automation
- **DevOps**: Performance monitoring, load testing setup

### Sprint Allocation (4 x 2-week sprints)

**Sprint 1 (Days 1-10)**
- Core infrastructure (versioning, state machine)
- Database setup
- 50 unit tests
- Effort: 35 SP

**Sprint 2 (Days 11-20)**
- VVB integration
- Merkle chain updates
- 60 integration tests
- Effort: 10 SP

**Sprint 3 (Days 21-30)**
- Audit trail system
- REST API
- Registry updates
- 120 unit + integration tests
- Effort: 21 SP

**Sprint 4 (Days 31-42)**
- E2E test scenarios
- Performance validation
- Documentation
- Release preparation
- Effort: 8 SP

---

## 6. RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| VVB validation timeout | Medium | High | Async mode with retry, configurable timeout |
| Audit trail performance degradation | Medium | High | Separate audit DB, archival strategy |
| Merkle chain complexity | High | Medium | Incremental updates, caching, profiling |
| Concurrent version conflicts | Medium | High | Optimistic locking with version numbers |
| Database schema migration | Low | High | Blue-green deployment, rollback plan |

---

## 7. SUCCESS CRITERIA

- ✅ All 200+ tests passing (85%+ coverage)
- ✅ Performance targets met: <100ms creation, <50ms VVB, <10ms audit
- ✅ VVB integration fully functional with 100% approval rate for valid versions
- ✅ Audit trail immutability verified (no unauthorized modifications)
- ✅ E2E flows demonstrating multi-year tax receipts, ownership changes, photo versioning
- ✅ Documentation complete (architecture, API, operational guides)
- ✅ Zero data loss in test scenarios

---

## 8. DELIVERABLES CHECKLIST

### Code
- [ ] SecondaryTokenVersion.java + schema
- [ ] SecondaryTokenVersioningService.java
- [ ] VVBVersionValidator.java
- [ ] VersionTransitionWorkflow.java
- [ ] AuditTrailEvent.java + AuditTrailService.java
- [ ] SecondaryTokenVersionResource.java
- [ ] Enhanced SecondaryTokenRegistry.java
- [ ] 200+ tests across all components

### Documentation
- [ ] SPARC framework document
- [ ] Sprint plans (4 x 2-week sprints)
- [ ] E2E test plan
- [ ] Architecture diagrams
- [ ] API documentation (OpenAPI)
- [ ] Operational runbooks
- [ ] Migration guide

### Deployment
- [ ] Build validation
- [ ] Integration testing
- [ ] Performance benchmarks
- [ ] Release notes

