# Composite Token Architecture - JIRA Tickets

## Project: AV11
## Epic Structure

---

## EPIC: AV11-600 - Composite Token Architecture

### Description
Implement comprehensive composite token system with primary/secondary token binding, VVB verification, Active Contract registry, and token topology visualization.

### Acceptance Criteria
- Primary tokens represent underlying assets with digital twin
- Secondary tokens validate and enhance primary tokens
- Composite tokens bundle primary + secondary with Merkle proof
- Active Contracts bind to composite tokens with workflow/RBAC
- Token topology map with owner-approved access
- Full traceability across all registries

---

## EPIC 1: AV11-601 - Token Architecture Foundation

### AV11-601-01: Primary Token Data Model
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Define and implement the Primary Token data model representing underlying assets.

**Acceptance Criteria**:
- [ ] PrimaryToken entity with fields: tokenId, assetId, assetType, ownerAddress, digitalTwinRef, valuation, vvbVerified, createdAt
- [ ] Support for asset types: REAL_ESTATE, VEHICLE, COMMODITY, IP, FINANCIAL
- [ ] Digital twin reference linking
- [ ] JPA/Panache entity with indexes

**Technical Notes**:
```java
@Entity
public class PrimaryToken extends PanacheEntity {
    String tokenId;
    String assetId;
    AssetType assetType;
    String ownerAddress;
    String digitalTwinReference;
    BigDecimal valuation;
    boolean vvbVerified;
    Instant createdAt;
}
```

---

### AV11-601-02: Primary Token Factory & Registry
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Implement Primary Token factory for token creation and registry for storage/retrieval.

**Acceptance Criteria**:
- [ ] PrimaryTokenFactory with createToken(), mintToken() methods
- [ ] PrimaryTokenRegistry with CRUD operations
- [ ] Token ID generation (PT-{assetType}-{uuid})
- [ ] Event emission on token creation

---

### AV11-601-03: Secondary Token Types
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Define secondary token types for supporting documents and artifacts.

**Acceptance Criteria**:
- [ ] SecondaryTokenType enum: TITLE_DEED, OWNER_KYC, TAX_RECEIPT, PHOTO_GALLERY, VIDEO_TOUR, APPRAISAL, INSURANCE, SURVEY
- [ ] SecondaryToken entity linking to primary
- [ ] SHA256 hash storage for document verification
- [ ] File attachment integration

---

### AV11-601-04: Secondary Token Factory
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement factory for creating secondary tokens from documents/artifacts.

**Acceptance Criteria**:
- [ ] Document-to-token conversion
- [ ] Media (photo/video) token creation
- [ ] KYC token integration
- [ ] Automatic hash calculation

---

### AV11-601-05: Derived Token System
**Type**: Story | **Points**: 8 | **Priority**: Medium

**Description**:
Implement derived tokens that can be created from primary tokens with independent value.

**Acceptance Criteria**:
- [ ] DerivedToken entity with parent reference
- [ ] Derivation types: FRACTIONAL_SHARE, RENTAL_INCOME, COLLATERAL
- [ ] Independent transferability
- [ ] Value calculation rules

---

## EPIC 2: AV11-602 - Composite Token Assembly

### AV11-602-01: Composite Token Core Model
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Design and implement the core Composite Token model.

**Acceptance Criteria**:
- [ ] CompositeToken entity with compositeId, primaryTokenRef, secondaryTokenList
- [ ] Merkle root hash for token bundle
- [ ] Verification status tracking
- [ ] Metadata support

---

### AV11-602-02: Primary-Secondary Binding
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Implement binding mechanism between primary and secondary tokens.

**Acceptance Criteria**:
- [ ] One-to-many relationship (1 primary : N secondary)
- [ ] Binding validation rules
- [ ] Unbinding with approval workflow
- [ ] Binding event emission

---

### AV11-602-03: Merkle Tree Construction
**Type**: Story | **Points**: 8 | **Priority**: High

**Description**:
Implement Merkle tree construction for composite token bundles.

**Acceptance Criteria**:
- [ ] Merkle tree builder for token bundle
- [ ] Leaf node generation from token hashes
- [ ] Root hash calculation
- [ ] Proof generation for individual tokens
- [ ] Proof verification

---

### AV11-602-04: VVB Verification Workflow
**Type**: Story | **Points**: 8 | **Priority**: Highest

**Description**:
Integrate VVB (Validation & Verification Body) verification for composite tokens.

**Acceptance Criteria**:
- [ ] Multi-verifier assignment (3 VVBs required)
- [ ] Consensus mechanism (2/3 approval)
- [ ] Verification result recording
- [ ] Fee payment integration
- [ ] Status: PENDING, IN_PROGRESS, VERIFIED, REJECTED

---

### AV11-602-05: Composite Token Registry
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement composite token registry with search and analytics.

**Acceptance Criteria**:
- [ ] Registry CRUD operations
- [ ] Search by asset type, owner, status
- [ ] Pagination support
- [ ] Analytics endpoints

---

## EPIC 3: AV11-603 - Active Contract System

### AV11-603-01: Active Contract Data Model
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Define Active Contract entity that binds to composite tokens.

**Acceptance Criteria**:
- [ ] ActiveContract entity: contractId, compositeTokenRef, ownerAddress, representativeAddress
- [ ] Contract status lifecycle
- [ ] Version tracking
- [ ] Effective dates

---

### AV11-603-02: Contract-Composite Binding
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Implement binding between Active Contract and Composite Token.

**Acceptance Criteria**:
- [ ] One-to-one binding
- [ ] Owner/representative authorization required
- [ ] VVB verification of binding
- [ ] Traceability link creation

---

### AV11-603-03: Workflow Engine
**Type**: Story | **Points**: 13 | **Priority**: High

**Description**:
Implement workflow engine for Active Contract state management.

**Acceptance Criteria**:
- [ ] State machine: DRAFT, PENDING_APPROVAL, ACTIVE, SUSPENDED, TERMINATED
- [ ] Transition rules and guards
- [ ] Event hooks for state changes
- [ ] Workflow templates per asset class
- [ ] Workflow history

```
DRAFT → PENDING_APPROVAL → ACTIVE → TERMINATED
                          ↓ ↑
                       SUSPENDED
```

---

### AV11-603-04: Business Rules Engine
**Type**: Story | **Points**: 13 | **Priority**: High

**Description**:
Implement business rules engine for Active Contracts.

**Acceptance Criteria**:
- [ ] Rule types: VALIDATION, CONDITION, ACTION
- [ ] Rule evaluation engine
- [ ] Asset-class specific rule templates
- [ ] Rule versioning
- [ ] Rule chaining

---

### AV11-603-05: RBAC System
**Type**: Story | **Points**: 8 | **Priority**: High

**Description**:
Implement Role-Based Access Control for Active Contracts.

**Acceptance Criteria**:
- [ ] Roles: OWNER, REPRESENTATIVE, VERIFIER, VIEWER, ADMIN
- [ ] Permission matrix per role
- [ ] Role assignment operations
- [ ] Permission inheritance
- [ ] Access audit logging

---

### AV11-603-06: Active Contract Registry
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement Active Contract registry with listing and navigation.

**Acceptance Criteria**:
- [ ] Registry with CRUD
- [ ] Contract listing with filters
- [ ] Traceability navigation (AC → CT → PT)
- [ ] Search by contract ID, asset, owner

---

## EPIC 4: AV11-604 - Registry Infrastructure

### AV11-604-01: Merkle Tree Registry Per Asset Class
**Type**: Story | **Points**: 8 | **Priority**: High

**Description**:
Implement separate Merkle tree registries for each asset class.

**Acceptance Criteria**:
- [ ] Registry per asset type (Real Estate, Vehicle, etc.)
- [ ] Tree structure with configurable depth
- [ ] Proof generation/verification
- [ ] Tree update operations
- [ ] Registry root publication

---

### AV11-604-02: Cross-Registry Navigation
**Type**: Story | **Points**: 5 | **Priority**: Medium

**Description**:
Implement navigation between registries.

**Acceptance Criteria**:
- [ ] Forward navigation: AC → CT → PT → Secondary
- [ ] Backward navigation: Secondary → PT → CT → AC
- [ ] Breadcrumb generation
- [ ] Deep linking support

---

### AV11-604-03: Registry Analytics
**Type**: Story | **Points**: 5 | **Priority**: Medium

**Description**:
Add analytics capabilities to registries.

**Acceptance Criteria**:
- [ ] Token count by type/status
- [ ] Verification success rate
- [ ] Active contract metrics
- [ ] Time-series data

---

## EPIC 5: AV11-605 - Token Topology Visualization

### AV11-605-01: Topology Data Model
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Define topology data structure for visualization.

**Acceptance Criteria**:
- [ ] Node types: PRIMARY, SECONDARY, DERIVED, COMPOSITE, CONTRACT
- [ ] Edge types: BINDS_TO, DERIVES_FROM, VERIFIES, CONTAINS
- [ ] Node attributes for rendering
- [ ] Graph serialization format

---

### AV11-605-02: Topology API Endpoint
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement API endpoint to fetch topology data.

**Acceptance Criteria**:
- [ ] GET /api/v11/topology/{compositeId}
- [ ] GET /api/v11/topology/contract/{contractId}
- [ ] Include all related nodes and edges
- [ ] Support depth parameter

---

### AV11-605-03: Topology Graph Component
**Type**: Story | **Points**: 13 | **Priority**: High

**Description**:
Create React component for topology visualization.

**Acceptance Criteria**:
- [ ] Interactive graph using D3.js or vis-network
- [ ] Node color coding by type
- [ ] Edge labels
- [ ] Zoom/pan controls
- [ ] Responsive design

---

### AV11-605-04: Click-to-Expand Detail
**Type**: Story | **Points**: 8 | **Priority**: Medium

**Description**:
Implement click behavior to show detailed topology.

**Acceptance Criteria**:
- [ ] Click Active Contract shows expanded topology
- [ ] Detail panel with token information
- [ ] Expandable/collapsible nodes
- [ ] Link to token details page

---

### AV11-605-05: Owner Approval Workflow
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement access control for topology viewing.

**Acceptance Criteria**:
- [ ] Owner must approve topology access
- [ ] Representative delegation support
- [ ] Time-limited access grants
- [ ] Access audit trail

---

## EPIC 6: AV11-606 - Traceability System

### AV11-606-01: Traceability Core
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement core traceability functionality.

**Acceptance Criteria**:
- [ ] Trace chain recording
- [ ] Timestamp verification
- [ ] Immutable trace log
- [ ] Hash chain integrity

---

### AV11-606-02: Registry Navigation API
**Type**: Story | **Points**: 5 | **Priority**: Medium

**Description**:
Implement navigation API across registries.

**Acceptance Criteria**:
- [ ] Navigate from any token to related tokens
- [ ] Cross-registry links
- [ ] Navigation history

---

### AV11-606-03: Compliance Reporting
**Type**: Story | **Points**: 8 | **Priority**: Medium

**Description**:
Implement compliance and audit reporting.

**Acceptance Criteria**:
- [ ] Audit event queries
- [ ] Compliance report generation
- [ ] Export to PDF/CSV
- [ ] Regulatory templates

---

## EPIC 7: AV11-607 - API Layer

### AV11-607-01: Primary/Secondary Token APIs
**Type**: Story | **Points**: 5 | **Priority**: Highest

**Description**:
Implement REST APIs for primary and secondary tokens.

**Acceptance Criteria**:
- [ ] POST /api/v11/tokens/primary - Create primary token
- [ ] POST /api/v11/tokens/secondary - Create secondary token
- [ ] GET /api/v11/tokens/{tokenId}
- [ ] PUT /api/v11/tokens/{tokenId}
- [ ] DELETE /api/v11/tokens/{tokenId}

---

### AV11-607-02: Active Contract APIs
**Type**: Story | **Points**: 5 | **Priority**: High

**Description**:
Implement REST APIs for Active Contracts.

**Acceptance Criteria**:
- [ ] POST /api/v11/contracts - Create contract
- [ ] POST /api/v11/contracts/{id}/bind - Bind to composite
- [ ] GET /api/v11/contracts/{id}/topology
- [ ] PUT /api/v11/contracts/{id}/workflow/transition

---

### AV11-607-03: WebSocket Events
**Type**: Story | **Points**: 5 | **Priority**: Medium

**Description**:
Implement real-time events via WebSocket.

**Acceptance Criteria**:
- [ ] Token creation events
- [ ] Verification status updates
- [ ] Contract state changes
- [ ] Registry updates

---

## EPIC 8: AV11-608 - Testing

### AV11-608-01: Unit Tests
**Type**: Story | **Points**: 8 | **Priority**: High

**Description**:
Implement comprehensive unit tests.

**Acceptance Criteria**:
- [ ] 95% coverage for token models
- [ ] Registry operation tests
- [ ] Merkle tree tests
- [ ] RBAC tests

---

### AV11-608-02: Integration Tests
**Type**: Story | **Points**: 8 | **Priority**: High

**Description**:
Implement integration tests.

**Acceptance Criteria**:
- [ ] End-to-end token flow
- [ ] Registry navigation
- [ ] VVB verification flow
- [ ] Contract binding flow

---

### AV11-608-03: E2E Tests (Playwright)
**Type**: Story | **Points**: 8 | **Priority**: Medium

**Description**:
Implement E2E tests for UI components.

**Acceptance Criteria**:
- [ ] Asset tokenization flow
- [ ] Topology visualization
- [ ] Contract management
- [ ] Access control

---

## Summary

| Epic | Stories | Total Points |
|------|---------|--------------|
| AV11-601: Token Architecture | 5 | 28 |
| AV11-602: Composite Assembly | 5 | 31 |
| AV11-603: Active Contract | 6 | 49 |
| AV11-604: Registry Infrastructure | 3 | 18 |
| AV11-605: Topology Visualization | 5 | 36 |
| AV11-606: Traceability | 3 | 18 |
| AV11-607: API Layer | 3 | 15 |
| AV11-608: Testing | 3 | 24 |
| **TOTAL** | **33** | **219** |

---

## Sprint Planning Suggestion

### Sprint 14 (Current)
- AV11-601-01: Primary Token Data Model (5)
- AV11-601-02: Primary Token Factory & Registry (5)
- AV11-601-03: Secondary Token Types (5)
- **Total: 15 points**

### Sprint 15
- AV11-601-04: Secondary Token Factory (5)
- AV11-602-01: Composite Token Core Model (5)
- AV11-602-02: Primary-Secondary Binding (5)
- **Total: 15 points**

### Sprint 16
- AV11-602-03: Merkle Tree Construction (8)
- AV11-602-04: VVB Verification Workflow (8)
- **Total: 16 points**

### Sprint 17
- AV11-603-01: Active Contract Data Model (5)
- AV11-603-02: Contract-Composite Binding (5)
- AV11-603-03: Workflow Engine (13)
- **Total: 23 points** (stretch)

---

*Document Version: 1.0*
*Created: December 11, 2025*
*Author: J4C Development Agent*
