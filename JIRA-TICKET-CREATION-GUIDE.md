# JIRA Ticket Creation Guide - Composite Token System
**Date**: December 23, 2025
**Status**: Ready for Manual or Automated Creation
**Target**: Create 8 Epics + 41 Stories (246 SP total)

---

## 📋 OVERVIEW

This guide provides instructions for creating all JIRA tickets required for the Composite Token + Enhanced Derived Token System across 13 sprints.

**Method 1**: Automated script (requires working JIRA API)
**Method 2**: Manual creation via JIRA UI (recommended, 20-30 minutes)
**Method 3**: CSV bulk import (alternative, 10-15 minutes)

---

## 🎯 EPICS TO CREATE (8 Total)

All Epics belong to project **AV11** (Aurigraph).

### Epic 1: AV11-601 - Token Architecture Foundation
- **Story Points**: 55 SP
- **Sprint**: Sprint 1-2 (Week 1-5)
- **Stories**: 13 stories
- **Description**:
  - Implement primary, secondary, and enhanced derived token systems
  - Support 4 asset classes: Real Estate, Agricultural, Mining, Carbon Credits
  - Implement revenue distribution engine (70/25/5 split)
  - Integrate with external oracles for valuation

**Acceptance Criteria**:
- [ ] All 5 token entity types implemented (Primary, Secondary, Derived, + 2 asset-specific)
- [ ] Token factories and registries operational
- [ ] Merkle tree construction and proof generation working
- [ ] 300+ tests passing with 98% coverage
- [ ] Performance: <1ms token creation, 100K/s throughput
- [ ] Revenue distribution tested for all 4 asset classes

---

### Epic 2: AV11-602 - Composite Token Assembly
- **Story Points**: 31 SP
- **Sprint**: Sprint 3-4 (Week 6-9)
- **Stories**: 5 stories
- **Description**:
  - Bundle primary + secondary tokens into composite units
  - Implement VVB (3-of-N) multi-verifier consensus
  - Create Merkle-tree-based registry for composites
  - Support immutable traceability

**Acceptance Criteria**:
- [ ] Composite token binding service operational
- [ ] VVB consensus workflow tested (3 verifier approval)
- [ ] Merkle proof generation <50ms
- [ ] 250 tests passing
- [ ] Immutability guarantees verified

---

### Epic 3: AV11-603 - Active Contract System
- **Story Points**: 49 SP
- **Sprint**: Sprint 5-7 (Week 10-14)
- **Stories**: 6 stories
- **Description**:
  - Implement contract lifecycle management (DRAFT → PENDING → ACTIVE → SUSPENDED → TERMINATED)
  - Create workflow engine with state machine
  - Implement business rules engine with DSL support
  - Implement RBAC (5 roles × 8 permissions)

**Acceptance Criteria**:
- [ ] Workflow engine handles all state transitions
- [ ] 40+ workflow transition tests passing
- [ ] 35+ business rule scenarios tested
- [ ] RBAC matrix enforced (5 roles × 8 permissions)
- [ ] 250 tests passing
- [ ] Rule evaluation <50ms

---

### Epic 4: AV11-604 - Registry Infrastructure
- **Story Points**: 18 SP
- **Sprint**: Sprint 8-9 (Week 15-16)
- **Stories**: 3 stories
- **Description**:
  - Build registries for 5 asset classes (REAL_ESTATE, VEHICLE, COMMODITY, IP, FINANCIAL)
  - Implement optimized Merkle tree builder (incremental updates)
  - Create analytics aggregator for cross-registry statistics

**Acceptance Criteria**:
- [ ] 5 asset class registries operational
- [ ] 1K token registration in <100ms
- [ ] Analytics queries on 1M tokens in <200ms
- [ ] 150 tests passing
- [ ] Incremental Merkle updates proven

---

### Epic 5: AV11-605 - Token Topology Visualization
- **Story Points**: 36 SP
- **Sprint**: Sprint 10-11 (Week 17-20)
- **Stories**: 5 stories
- **Description**:
  - Create interactive graph visualization of token relationships
  - Implement D3.js force-directed graph visualization
  - Build real-time topology updates
  - Support 500+ node graphs with sub-2 second render

**Acceptance Criteria**:
- [ ] React + D3.js topology UI deployed
- [ ] 500-node graph renders in <2 seconds
- [ ] Node filtering by type working (5 types)
- [ ] 76 Playwright E2E tests passing
- [ ] 75 Pytest backend tests passing
- [ ] Real-time event streaming via WebSocket

---

### Epic 6: AV11-606 - Traceability System
- **Story Points**: 18 SP
- **Sprint**: Sprint 12-13 (Week 21-25)
- **Stories**: 3 stories
- **Description**:
  - Implement comprehensive asset traceability with audit trails
  - Hash chain for immutable transaction history
  - Blockchain anchoring for verification
  - Compliance reporting (SEC Form D, EU MiCA)

**Acceptance Criteria**:
- [ ] Full traceability from creation to redemption
- [ ] Audit trail with 100% accuracy
- [ ] Blockchain anchoring for proofs
- [ ] Compliance reports generated in <1 second
- [ ] 100 tests passing

---

### Epic 7: AV11-607 - API Layer
- **Story Points**: 15 SP
- **Sprint**: Sprint 12-13 (Week 21-25)
- **Stories**: 3 stories
- **Description**:
  - Expose REST APIs for tokens, contracts, registries
  - Implement WebSocket event streaming
  - Support search, filter, pagination across all resources
  - Rate limiting and security

**Acceptance Criteria**:
- [ ] 15+ REST endpoints operational
- [ ] WebSocket support for 10K concurrent connections
- [ ] API latency (p95): <200ms
- [ ] All endpoints secured with authentication
- [ ] 200 tests passing

---

### Epic 8: AV11-608 - Testing & Quality Assurance
- **Story Points**: 24 SP
- **Sprint**: Sprint 12-13 (Week 21-25)
- **Stories**: 3 stories
- **Description**:
  - Implement unit, integration, and E2E tests with 95% coverage
  - Performance testing and benchmarking
  - Security and compliance testing
  - Production readiness validation

**Acceptance Criteria**:
- [ ] 95%+ line coverage across all modules
- [ ] 1,400+ tests passing
- [ ] Performance benchmarks verified
- [ ] Security audit completed
- [ ] Production deployment checklist signed off

---

## 📝 STORIES TO CREATE (41 Total)

### Under Epic AV11-601: Token Architecture Foundation (13 Stories)

#### Story 1: AV11-601-01 - Primary Token Data Model (5 SP)
**Description**: Define and implement the PrimaryToken entity class
- Implement `PrimaryToken.java` (200 lines)
- Fields: tokenId, digitalTwinRef, owner, assetClass, faceValue, status
- Lifecycle: CREATED → VERIFIED → TRANSFERRED → RETIRED
- Methods: validate(), transfer(), serialize()

**Acceptance Criteria**:
- [ ] PrimaryToken entity created with all fields
- [ ] Validation logic implemented (token ID format, owner, value)
- [ ] Serialization/deserialization working
- [ ] 40 unit tests passing (98% coverage)
- [ ] Code review completed

---

#### Story 2: AV11-601-02 - Primary Token Factory & Registry (5 SP)
**Description**: Implement factory pattern and registry for primary tokens
- Implement `PrimaryTokenFactory.java` with builder pattern
- Implement `PrimaryTokenRegistry.java` with Merkle tree tracking
- Support 1,000+ token registration

**Acceptance Criteria**:
- [ ] Factory creates tokens correctly with all validations
- [ ] Registry maintains Merkle root for integrity
- [ ] 1K token registration in <100ms
- [ ] 45 unit tests passing
- [ ] Code review completed

---

#### Story 3: AV11-601-03 - Secondary Token Types (5 SP)
**Description**: Define secondary token hierarchy and types
- Implement `SecondaryToken.java` abstract base class
- Create concrete types: IncomeStreamToken, CollateralToken, RoyaltyToken
- Support parent-child relationships with primary tokens

**Acceptance Criteria**:
- [ ] SecondaryToken base class with abstract methods
- [ ] 3 concrete implementations with specific validation rules
- [ ] Parent-child relationships working
- [ ] 100 unit tests passing
- [ ] Code review completed

---

#### Story 4: AV11-601-04 - Secondary Token Factory (5 SP)
**Description**: Implement factory for creating secondary token types
- `SecondaryTokenFactory.java` with type-specific builders
- Validation before creation

**Acceptance Criteria**:
- [ ] Factory creates secondary tokens by type
- [ ] Type-specific validation enforced
- [ ] 30 unit tests passing
- [ ] Code review completed

---

#### Story 5: AV11-601-05A - Derived Token Core Architecture (8 SP) ⭐ **CRITICAL**
**Description**: Foundation for all derived token types
- Implement `DerivedToken.java` abstract base class (400 lines)
- Parent-child relationship management
- Revenue distribution configuration
- Oracle data source integration
- Lifecycle: CREATED → ACTIVE → REDEEMED → EXPIRED

**Acceptance Criteria**:
- [ ] DerivedToken with parent reference and derivation rules
- [ ] Revenue distribution engine (70% investors, 25% manager, 5% platform)
- [ ] Oracle integration framework
- [ ] 65 unit tests passing (98% coverage)
- [ ] Yield calculation engine working
- [ ] Code review completed

---

#### Story 6: AV11-601-05B - Real Estate Derived Tokens (5 SP)
**Description**: Real estate-based token derivatives
- 4 types: RENTAL_INCOME, FRACTIONAL_SHARE, PROPERTY_APPRECIATION, MORTGAGE_COLLATERAL
- Property valuation oracle integration
- Monthly rental income distribution

**Acceptance Criteria**:
- [ ] 4 real estate derivation types implemented
- [ ] Property valuation oracle integration working
- [ ] Rental income distribution tested
- [ ] 55 tests passing
- [ ] Code review completed

---

#### Story 7: AV11-601-05C - Agricultural Derived Tokens (5 SP)
**Description**: Agricultural asset token derivatives
- 4 types: CROP_YIELD, HARVEST_REVENUE, CARBON_SEQUESTRATION, WATER_RIGHTS
- USDA yield data integration
- Seasonal scheduling support

**Acceptance Criteria**:
- [ ] 4 agricultural derivation types implemented
- [ ] USDA oracle API integration
- [ ] Seasonal scheduling working
- [ ] 55 tests passing
- [ ] Code review completed

---

#### Story 8: AV11-601-05D - Mining & Commodity Derived Tokens (5 SP)
**Description**: Mining and commodity extraction token derivatives
- 4 types: ORE_EXTRACTION, COMMODITY_OUTPUT, ROYALTY_SHARE, RESOURCE_DEPLETION
- Commodity price feed integration
- Reserve estimation modeling

**Acceptance Criteria**:
- [ ] 4 mining/commodity types implemented
- [ ] Commodity price oracle working
- [ ] Resource depletion calculations
- [ ] 55 tests passing
- [ ] Code review completed

---

#### Story 9: AV11-601-05E - Carbon Credit Derived Tokens (3 SP)
**Description**: Environmental sustainability token derivatives
- 3 types: CARBON_SEQUESTRATION, RENEWABLE_ENERGY, CARBON_OFFSET
- Verra VCS, Gold Standard registry integration
- Paris Agreement Article 6.2 compliance

**Acceptance Criteria**:
- [ ] 3 carbon credit types implemented
- [ ] Registry integration (Verra, Gold Standard, ACR)
- [ ] Double-counting prevention
- [ ] 40 tests passing
- [ ] Code review completed

---

#### Story 10: AV11-601-05F - Revenue Distribution Engine (5 SP)
**Description**: Automated multi-party payment distribution
- Distribution rules engine (70/25/5 split)
- Payment schedule management (daily, weekly, monthly, quarterly)
- Escrow service integration
- Distribution history tracking

**Acceptance Criteria**:
- [ ] Multi-party distribution rules engine
- [ ] Payment scheduling working
- [ ] Escrow integration tested
- [ ] 50 tests passing
- [ ] Code review completed

---

#### Story 11: AV11-601-05G - Oracle Integration Layer (2 SP)
**Description**: External data feed integration for valuation
- Property management API integration
- USDA crop data API
- Commodity price feeds (Bloomberg, CME)
- Carbon registry APIs (Verra, Gold Standard)

**Acceptance Criteria**:
- [ ] 4 oracle data sources integrated
- [ ] Caching implemented for feed data
- [ ] Fallback values for offline scenarios
- [ ] 30 tests passing
- [ ] Code review completed

---

#### Story 12: AV11-601-05H - Derived Token Marketplace (2 SP)
**Description**: Secondary market for derived token trading
- Order book for derived token trading
- Price discovery mechanism
- Compliance-aware matching (KYC/AML)
- Settlement integration

**Acceptance Criteria**:
- [ ] Order book implementation
- [ ] Price matching algorithm
- [ ] Settlement integration
- [ ] 25 tests passing
- [ ] Code review completed

---

#### Story 13: AV11-601-13 - Token Module Integration Testing (3 SP)
**Description**: Comprehensive integration testing for all token types
- Integration tests across primary, secondary, derived tokens
- End-to-end token creation to valuation flow
- Performance benchmarking

**Acceptance Criteria**:
- [ ] 50+ integration tests passing
- [ ] Token creation flow verified
- [ ] Performance: <1ms creation, 100K/s throughput
- [ ] Code review completed

---

### Under Epic AV11-602: Composite Token Assembly (5 Stories)

#### Story 1: AV11-602-01 - Composite Token Binding (6 SP)
#### Story 2: AV11-602-02 - Merkle Tree Verification (6 SP)
#### Story 3: AV11-602-03 - VVB Consensus Workflow (7 SP)
#### Story 4: AV11-602-04 - Composite Registry (6 SP)
#### Story 5: AV11-602-05 - Composite Token Integration Tests (6 SP)

---

### Under Epic AV11-603: Active Contract System (6 Stories)

#### Story 1: AV11-603-01 - Workflow State Machine (9 SP)
#### Story 2: AV11-603-02 - Business Rules Engine (9 SP)
#### Story 3: AV11-603-03 - RBAC Service Implementation (9 SP)
#### Story 4: AV11-603-04 - Contract Registry (8 SP)
#### Story 5: AV11-603-05 - Compliance & Transition Rules (8 SP)
#### Story 6: AV11-603-06 - Contract Integration Tests (6 SP)

---

### Under Epic AV11-604: Registry Infrastructure (3 Stories)

#### Story 1: AV11-604-01 - Multi-Asset Class Registry (7 SP)
#### Story 2: AV11-604-02 - Optimized Merkle Tree Updates (6 SP)
#### Story 3: AV11-604-03 - Registry Analytics & Reporting (5 SP)

---

### Under Epic AV11-605: Token Topology Visualization (5 Stories)

#### Story 1: AV11-605-01 - D3.js Force-Directed Graph (8 SP)
#### Story 2: AV11-605-02 - Node Detail Panel (6 SP)
#### Story 3: AV11-605-03 - Topology Controls & Filtering (6 SP)
#### Story 4: AV11-605-04 - WebSocket Event Streaming (8 SP)
#### Story 5: AV11-605-05 - Topology E2E Tests (8 SP)

---

### Under Epic AV11-606: Traceability System (3 Stories)

#### Story 1: AV11-606-01 - Asset Traceability Service (6 SP)
#### Story 2: AV11-606-02 - Blockchain Anchoring (6 SP)
#### Story 3: AV11-606-03 - Compliance Report Generation (6 SP)

---

### Under Epic AV11-607: API Layer (3 Stories)

#### Story 1: AV11-607-01 - Token REST APIs (5 SP)
#### Story 2: AV11-607-02 - WebSocket & Real-Time Events (5 SP)
#### Story 3: AV11-607-03 - Compliance & Traceability APIs (5 SP)

---

### Under Epic AV11-608: Testing & QA (3 Stories)

#### Story 1: AV11-608-01 - Unit & Integration Test Suite (8 SP)
#### Story 2: AV11-608-02 - E2E & Performance Testing (8 SP)
#### Story 3: AV11-608-03 - Production Readiness Validation (8 SP)

---

## 🔧 METHOD 1: AUTOMATED JIRA CREATION (SCRIPT)

### Prerequisites:
- JIRA API token (active, from credentials)
- JIRA project AV11 exists
- cURL installed on system

### Command:
```bash
export JIRA_EMAIL="subbu@aurigraph.io"
export JIRA_API_TOKEN="<your-active-token>"
bash create-composite-token-tickets.sh
```

### Expected Output:
```
✅ Phase 1: Closing 15 completed tickets
✅ Phase 2: Creating 8 Epics
✅ Phase 3: Creating 41 Stories
✅ Phase 4: Linking stories to epics
✅ Phase 5: Assigning to sprints

Total Created: 8 Epics + 41 Stories = 49 Issues
Total Story Points: 246 SP
```

---

## 🖱️ METHOD 2: MANUAL JIRA CREATION (RECOMMENDED)

### Step 1: Create 8 Epics (5-10 minutes)

1. Open JIRA: https://aurigraphdlt.atlassian.net/
2. Navigate to Project AV11
3. Click "Create" → "Epic"
4. Fill in for each epic:

**Epic 1**:
- Summary: `Token Architecture Foundation`
- Epic Key: `AV11-601`
- Description: [From guide above]
- Story Points: 55
- Sprint: Sprint 1-2

[Repeat for 7 more epics...]

### Step 2: Create 41 Stories (15-20 minutes)

1. Click "Create" → "Story"
2. Fill in for each story:

**Story Example**:
- Summary: `Primary Token Data Model`
- Epic: `AV11-601`
- Story Points: 5
- Sprint: Sprint 1
- Description: [From guide above]
- Acceptance Criteria:
  ```
  - [ ] PrimaryToken entity created with all fields
  - [ ] Validation logic implemented
  - [ ] 40 unit tests passing
  - [ ] Code review completed
  ```

[Repeat for all 41 stories...]

### Step 3: Verify Creation

- [ ] 8 Epics visible on board
- [ ] 41 Stories linked to epics
- [ ] Total story points: 246 SP
- [ ] Sprints assigned correctly

---

## 📊 METHOD 3: CSV BULK IMPORT

### Step 1: Create CSV file

```csv
Summary,Description,Issue Type,Epic,Story Points,Sprint
"Primary Token Data Model","Implement PrimaryToken entity class","Story","AV11-601",5,"Sprint 1"
"Primary Token Factory & Registry","Factory pattern and registry","Story","AV11-601",5,"Sprint 1"
...
```

### Step 2: Bulk Import in JIRA

1. Tools → External Import → CSV
2. Upload file
3. Verify mappings
4. Import

### Step 3: Verify

- [ ] All 41 stories created
- [ ] Epic links verified
- [ ] Story points correct
- [ ] Sprints assigned

---

## ✅ POST-CREATION VERIFICATION

### Checklist:
- [ ] 8 Epics exist (AV11-601 through AV11-608)
- [ ] 41 Stories created
- [ ] All stories linked to correct epic
- [ ] Total story points = 246 SP
- [ ] Sprints 1-13 created in JIRA
- [ ] Stories assigned to correct sprint
- [ ] Board shows all issues

### Command to Verify (if API works):
```bash
curl -u "subbu@aurigraph.io:$JIRA_API_TOKEN" \
  "https://aurigraphdlt.atlassian.net/rest/api/3/projects/AV11/issues?maxResults=100&jql=type=Epic" | jq '.issues | length'
```

Expected: `8`

---

## 📋 RELATED DOCUMENTS

- `COMPOSITE-TOKEN-SPRINT-ROADMAP.md` - Complete sprint execution plan
- `COMPOSITE_TOKEN_JIRA_TICKETS.md` - Original ticket specifications
- `COMPOSITE-TOKEN-JIRA-CREATION-STATUS.md` - Previous session status
- `JIRA-TICKET-CREATION-SUMMARY.md` - Summary of all work done

---

## 🚀 NEXT STEPS

1. ✅ Create 8 Epics in JIRA
2. ✅ Create 41 Stories in JIRA
3. ✅ Assign stories to Sprints
4. ⏳ **Begin Sprint 1 Implementation**
   - Set up development environment
   - Create initial file structure
   - Begin token entity implementation
   - Set up test infrastructure

---

**Status**: ✅ Ready for JIRA creation
**Method Recommended**: Method 2 (Manual) - 20-30 minutes, most reliable
**Alternative**: Method 1 (Script) - if JIRA API working
**Fallback**: Method 3 (CSV Import) - bulk alternative

---

**Document Created**: December 23, 2025
**Owner**: Composite Token Program Manager
**Version**: 1.0
