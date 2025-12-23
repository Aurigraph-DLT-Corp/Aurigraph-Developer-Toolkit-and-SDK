# Comprehensive Test Plan - Aurigraph V11

**Version**: 1.0.0
**Date**: October 10, 2025
**Status**: Active
**Coverage Target**: 95% code coverage, 100% critical path coverage

---

## 📋 Test Strategy

### Test Levels
1. **Unit Tests** - Individual component testing (JUnit 5)
2. **Integration Tests** - Service integration testing (TestContainers)
3. **API Tests** - REST endpoint testing (REST Assured)
4. **UI Tests** - Frontend testing (Playwright)
5. **E2E Tests** - Full workflow testing
6. **Performance Tests** - Load and stress testing (JMeter)
7. **Security Tests** - Penetration and vulnerability testing

### Test Types
- **Smoke Tests** - Critical path validation (run on every commit)
- **Regression Tests** - Full test suite (run on merge to main)
- **Sanity Tests** - Quick verification after deployment
- **Acceptance Tests** - Business requirement validation

---

## 🎯 Test Scope

### Backend Services (Java/Quarkus)

#### 1. Ricardian Contract Services
- **WorkflowConsensusService**
  - Consensus submission
  - Gas fee charging
  - Transaction hash generation
  - Block confirmation
  - Ledger logging

- **LedgerAuditService**
  - Audit trail creation
  - Filtering and querying
  - Compliance reporting (GDPR, SOX, HIPAA)
  - Integrity verification
  - JSON export

- **RicardianContractResource**
  - Document upload (PDF/DOC/DOCX/TXT)
  - Contract conversion
  - Party management
  - Signature collection
  - Contract activation
  - Audit trail queries

#### 2. Core Services
- **HyperRAFTConsensusService**
  - Leader election
  - Log replication
  - Consensus validation
  - Cluster health

- **TokenManagementService**
  - Token minting
  - Token burning
  - Token transfer
  - Balance queries
  - RWA tokenization

- **LevelDBService**
  - Put/Get operations
  - Batch writes
  - Range queries
  - Snapshots
  - Statistics

#### 3. Live Data Services
- **LiveValidatorService**
- **LiveConsensusService**
- **LiveChannelDataService**

### Frontend (React/TypeScript)

#### 1. Enterprise Portal
- **Dashboard**
  - Real-time metrics display
  - Chart rendering
  - Auto-refresh functionality

- **Validators Dashboard**
  - Validator list rendering
  - Status indicators
  - Performance metrics

- **Consensus Nodes Dashboard**
  - Node health monitoring
  - Cluster visualization
  - Throughput metrics

- **Channels Dashboard**
  - Channel list
  - Participant nodes
  - Channel metrics

- **Ricardian Contracts**
  - Document upload wizard
  - Party management
  - Signature workflow
  - Contract activation
  - Audit trail viewer

### API Endpoints (REST)

#### Ricardian Contract Endpoints
```
POST   /api/v11/contracts/ricardian/upload
GET    /api/v11/contracts/ricardian/{id}
POST   /api/v11/contracts/ricardian/{id}/parties
POST   /api/v11/contracts/ricardian/{id}/sign
POST   /api/v11/contracts/ricardian/{id}/activate
GET    /api/v11/contracts/ricardian/{id}/audit
GET    /api/v11/contracts/ricardian/{id}/compliance/{framework}
GET    /api/v11/contracts/ricardian/gas-fees
```

#### Core Platform Endpoints
```
GET    /api/v11/health
GET    /api/v11/info
GET    /api/v11/stats
GET    /api/v11/live/validators
GET    /api/v11/live/consensus
GET    /api/v11/live/channels
GET    /api/v11/live/channels/{id}
GET    /api/v11/live/channels/{id}/participants
```

---

## 🧪 Test Buckets

### Bucket 1: Smoke Tests (Critical Path)
**Duration**: ~5 minutes
**Trigger**: Every commit
**Must Pass**: 100%

**Tests**:
1. Health check endpoint
2. System info endpoint
3. Basic contract upload
4. Gas fee query
5. Audit trail creation
6. Dashboard loading
7. Live data endpoints

### Bucket 2: Regression Tests (Full Suite)
**Duration**: ~30 minutes
**Trigger**: Merge to main, nightly builds
**Must Pass**: 95%

**Tests**:
- All smoke tests
- All unit tests
- All integration tests
- All API tests
- All UI tests
- Performance baseline tests

### Bucket 3: Extended Tests (Performance & Security)
**Duration**: ~2 hours
**Trigger**: Release candidates, weekly
**Must Pass**: 90%

**Tests**:
- Load tests (2M+ TPS target)
- Stress tests (resource limits)
- Security scans
- Penetration tests
- Compliance validation

---

## 🔧 Test Tools

### Backend Testing
- **JUnit 5** - Unit testing framework
- **Mockito** - Mocking framework
- **REST Assured** - API testing
- **TestContainers** - Integration testing with containers
- **JMeter** - Performance testing
- **JaCoCo** - Code coverage

### Frontend Testing
- **Playwright** - E2E browser testing
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Axe** - Accessibility testing

### CI/CD
- **GitHub Actions** - Automated testing pipeline
- **SonarQube** - Code quality analysis
- **Allure** - Test reporting

---

## 📊 Coverage Requirements

### Code Coverage Targets
- **Overall**: 95% line coverage
- **Critical Modules**: 98% coverage
  - WorkflowConsensusService: 98%
  - LedgerAuditService: 98%
  - RicardianContractResource: 95%
  - TokenManagementService: 95%
  - HyperRAFTConsensusService: 98%

### Functional Coverage
- **API Endpoints**: 100% coverage
- **UI Components**: 90% coverage
- **Critical Workflows**: 100% coverage

---

## 🚦 Test Execution Strategy

### Pre-Commit (Local)
```bash
# Run unit tests
./mvnw test

# Run smoke tests
./run-smoke-tests.sh

# Check code coverage
./mvnw verify -Pcode-coverage
```

### On Commit (CI)
```bash
# Run smoke tests
./run-smoke-tests.sh

# Run API tests
./run-api-tests.sh

# Build and test native image (if applicable)
./mvnw verify -Pnative
```

### On Merge to Main (CI)
```bash
# Run full regression suite
./run-regression-tests.sh

# Run performance tests
./run-performance-tests.sh

# Generate coverage report
./generate-coverage-report.sh

# Security scan
./run-security-scan.sh
```

### Nightly (CI)
```bash
# Run extended test suite
./run-extended-tests.sh

# Run load tests
./run-load-tests.sh

# Run compliance tests
./run-compliance-tests.sh
```

---

## 📝 Test Case Template

### Test Case Format
```
TC-XXX: Test Case Name
Priority: [P0/P1/P2]
Type: [Smoke/Regression/Performance/Security]
Status: [Active/Deprecated]

Description:
  Brief description of what is being tested

Preconditions:
  - System state before test
  - Required data or setup

Test Steps:
  1. Step 1
  2. Step 2
  3. Step 3

Expected Result:
  What should happen

Actual Result:
  What actually happened (filled during execution)

Test Data:
  Input data required

Dependencies:
  - Other test cases or services

Automation Status:
  [Automated/Manual/Planned]
```

---

## 🔍 Test Case Inventory

### Ricardian Contract Workflow (TC-RC-001 to TC-RC-100)

**TC-RC-001**: Document Upload - Valid PDF
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Upload valid PDF document
  2. Verify conversion successful
  3. Verify consensus submission
  4. Verify audit trail entry
- **Expected**: Contract created, txHash returned

**TC-RC-002**: Document Upload - Invalid File Type
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Upload .exe file
  2. Verify rejection
- **Expected**: 400 Bad Request error

**TC-RC-003**: Document Upload - File Size Limit
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Upload 15MB PDF (exceeds 10MB limit)
  2. Verify rejection
- **Expected**: 400 Bad Request error

**TC-RC-004**: Add Party to Contract
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Create contract
  2. Add party with BUYER role
  3. Verify consensus submission
  4. Verify gas fee charged
- **Expected**: Party added, txHash returned

**TC-RC-005**: Sign Contract
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Create contract with 2 parties
  2. Submit signature from party 1
  3. Submit signature from party 2
  4. Verify isFullySigned = true
- **Expected**: All signatures collected

**TC-RC-006**: Activate Contract
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Create fully signed contract
  2. Activate contract
  3. Verify status = ACTIVE
  4. Verify consensus submission
- **Expected**: Contract activated, txHash returned

**TC-RC-007**: Activate Contract - Not Fully Signed
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Create contract with 2 parties
  2. Submit 1 signature only
  3. Attempt activation
- **Expected**: 400 Bad Request error

**TC-RC-008**: Audit Trail Query
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Create contract with multiple activities
  2. Query audit trail
  3. Verify all activities logged
- **Expected**: Complete audit trail returned

**TC-RC-009**: Compliance Report - GDPR
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Create contract
  2. Generate GDPR compliance report
  3. Verify compliance checks
- **Expected**: Compliance report with status

**TC-RC-010**: Gas Fee Query
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Query /api/v11/contracts/ricardian/gas-fees
  2. Verify all activity types present
- **Expected**: Gas fee structure returned

### Consensus Service (TC-CS-001 to TC-CS-050)

**TC-CS-001**: Submit Activity to Consensus
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Submit activity via WorkflowConsensusService
  2. Verify gas fee charged
  3. Verify consensus accepted
  4. Verify transaction hash generated
- **Expected**: ConsensusResult with success=true

**TC-CS-002**: Consensus Failure Handling
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Submit invalid activity
  2. Verify consensus rejection
  3. Verify error handling
- **Expected**: ConsensusResult with success=false

**TC-CS-003**: Gas Fee Calculation
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Submit each activity type
  2. Verify correct gas fee charged
- **Expected**: Gas fees match configured values

### Audit Service (TC-AS-001 to TC-AS-050)

**TC-AS-001**: Log Audit Entry
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Log audit entry
  2. Query by contract ID
  3. Verify entry present
- **Expected**: Audit entry retrieved

**TC-AS-002**: Filter by Time Range
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Create entries with different timestamps
  2. Query with time range filter
  3. Verify only matching entries returned
- **Expected**: Filtered results

**TC-AS-003**: Verify Audit Integrity
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Create audit trail
  2. Run integrity verification
  3. Verify intact status
- **Expected**: AuditIntegrityReport with isIntact=true

**TC-AS-004**: Compliance Report - SOX
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Create contract activities
  2. Generate SOX compliance report
  3. Verify compliance checks
- **Expected**: ComplianceReport with status

### API Endpoints (TC-API-001 to TC-API-100)

**TC-API-001**: Health Check
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. GET /api/v11/health
  2. Verify 200 OK
  3. Verify status: UP
- **Expected**: {"status": "UP"}

**TC-API-002**: System Info
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. GET /api/v11/info
  2. Verify version, platform info
- **Expected**: System information returned

**TC-API-003**: Live Validators
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. GET /api/v11/live/validators
  2. Verify 127 validators returned
  3. Verify real-time data
- **Expected**: Validator list with metrics

### UI Components (TC-UI-001 to TC-UI-100)

**TC-UI-001**: Dashboard Loading
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Navigate to /
  2. Verify dashboard loads
  3. Verify metrics display
- **Expected**: Dashboard rendered without errors

**TC-UI-002**: Ricardian Contract Upload Wizard
- **Priority**: P0
- **Type**: Smoke
- **Steps**:
  1. Navigate to Ricardian Contracts
  2. Click "Upload Contract"
  3. Complete 4-step wizard
  4. Verify contract created
- **Expected**: Successful contract creation

**TC-UI-003**: Validator Dashboard
- **Priority**: P1
- **Type**: Regression
- **Steps**:
  1. Navigate to Validators
  2. Verify 127 validators displayed
  3. Verify metrics update
- **Expected**: Live validator data displayed

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
      - name: Run Smoke Tests
        run: ./run-smoke-tests.sh

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
      - name: Run Unit Tests
        run: ./mvnw test

  api-tests:
    runs-on: ubuntu-latest
    needs: smoke-tests
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
      - name: Run API Tests
        run: ./run-api-tests.sh

  coverage:
    runs-on: ubuntu-latest
    needs: [unit-tests, api-tests]
    steps:
      - uses: actions/checkout@v3
      - name: Generate Coverage Report
        run: ./generate-coverage-report.sh
      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
```

---

## 📈 Test Metrics

### Success Criteria
- **Smoke Tests**: 100% pass rate
- **Regression Tests**: 95% pass rate
- **Code Coverage**: 95% overall
- **Performance**: 2M+ TPS sustained
- **Security**: 0 critical vulnerabilities

### Tracking
- Test execution time trends
- Flaky test identification
- Coverage trends
- Defect density
- Mean time to detect (MTTD)
- Mean time to resolve (MTTR)

---

## 🔄 Test Maintenance

### Review Cycle
- **Weekly**: Review failed tests
- **Bi-weekly**: Update test cases
- **Monthly**: Review coverage gaps
- **Quarterly**: Audit test suite effectiveness

### Test Deprecation
- Remove obsolete tests
- Update for API changes
- Refactor for maintainability

---

## 📚 Test Documentation

### Required Documentation
1. **Test Plan** (this document)
2. **Test Cases** (detailed specifications)
3. **Test Reports** (execution results)
4. **Coverage Reports** (JaCoCo)
5. **Performance Reports** (JMeter)
6. **Security Reports** (vulnerability scans)

### Reporting
- **Daily**: Smoke test results
- **Per Commit**: CI/CD test results
- **Weekly**: Regression test summary
- **Monthly**: Comprehensive test report

---

**Maintained By**: Aurigraph V11 Development Team
**Last Updated**: October 10, 2025
**Next Review**: October 17, 2025
