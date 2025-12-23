# 95% Coverage Action Plan - Sprint 14-20 Services

**Current Coverage**: 35% average (717/2,051 lines)
**Target Coverage**: 95% average (1,848/2,051 lines)
**Gap**: 60 percentage points (1,131 additional lines)
**Timeline**: 2-3 weeks with focused effort

---

## Executive Summary

This action plan outlines a systematic approach to increasing Sprint 14-20 test coverage from 35% to 95%. The plan is divided into three phases, with specific tasks, owners, and success criteria for each service.

**Key Metrics**:
- Lines to Cover: 1,131 additional lines
- Test Cases to Write: ~150-200 additional tests
- Estimated Effort: 80-120 person-hours
- Risk Level: MEDIUM (some complex integration scenarios)

---

## Current Coverage Breakdown

| Service | Current Coverage | Target Coverage | Gap | Priority |
|---------|------------------|-----------------|-----|----------|
| **ParallelTransactionExecutor** | 89% ✅ | 95% | 6% | LOW |
| **EnterprisePortalService** | 33% | 95% | 62% | HIGH |
| **SystemMonitoringService** | 39% | 95% | 56% | HIGH |
| **EthereumBridgeService** | 15% | 95% | 80% | CRITICAL |
| **QuantumCryptoProvider** | 4%* | 95% | N/A** | LOW* |

*QuantumCryptoProvider: Low coverage is expected due to external BouncyCastle library. Focus on wrapper code coverage.

**Gap is N/A because the 4% represents wrapper code only. The actual cryptographic operations are in BouncyCastle and don't count toward our coverage metrics.

---

## Phase 1: Critical Priorities (Week 1) - EthereumBridgeService

**Goal**: Increase Bridge coverage from 15% → 70%

**Gap Analysis**: 555 lines uncovered (820 total, 133 currently covered)

### Tasks

#### Task 1.1: Web3j Integration Tests (2 days)
**Owner**: Integration Test Engineer
**Lines to Cover**: ~200 lines

**Test Scenarios**:
1. ✅ Mock Ethereum node with Web3j TestChain
2. ✅ Test transaction signing and submission
3. ✅ Test event listening and parsing
4. ✅ Test gas estimation and fee calculation
5. ✅ Test RPC error handling

**Test Code**:
```java
@QuarkusTest
class EthereumIntegrationTest {

    @Inject
    EthereumBridgeService bridgeService;

    private Web3j web3j;
    private Credentials credentials;

    @BeforeEach
    void setUp() {
        // Use Ganache or Hardhat local node
        web3j = Web3j.build(new HttpService("http://localhost:8545"));
        credentials = Credentials.create("0x...");
    }

    @Test
    @DisplayName("Submit bridge transaction to Ethereum")
    void testSubmitToEthereum() {
        BridgeTransactionResult result = bridgeService.initiateToEthereum(
            "aurigraph-addr-123",
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            BigInteger.valueOf(1000000),
            "AUR"
        );

        assertEquals(BridgeStatus.PENDING_SIGNATURES, result.status());
        assertNotNull(result.transactionId());

        // Verify transaction submitted to Ethereum
        TransactionReceipt receipt = web3j.ethGetTransactionReceipt(
            result.transactionId()
        ).send().getTransactionReceipt().get();

        assertTrue(receipt.isStatusOK());
    }
}
```

**Success Criteria**:
- ✅ 10+ integration tests passing
- ✅ Web3j mock interactions validated
- ✅ Coverage increases to 40%+

#### Task 1.2: Multi-Signature Validation Tests (1.5 days)
**Owner**: Security Test Engineer
**Lines to Cover**: ~150 lines

**Test Scenarios**:
1. ✅ Test 2/3 majority validator signature collection
2. ✅ Test signature verification with valid/invalid keys
3. ✅ Test Byzantine validator behavior (conflicting signatures)
4. ✅ Test signature timeout scenarios
5. ✅ Test replay attack prevention

**Test Code**:
```java
@Test
@DisplayName("Require 2/3 validator signatures for bridge completion")
void testMultiSignatureValidation() {
    // Create bridge transaction
    String txId = bridgeService.initiateToEthereum(...).transactionId();

    // Collect signatures from validators
    List<ValidatorSignature> signatures = new ArrayList<>();
    for (int i = 0; i < 7; i++) { // 7 out of 10 validators
        ValidatorSignature sig = validatorNetwork.signTransaction(txId, "validator-" + i);
        signatures.add(sig);
    }

    // Process signatures
    bridgeService.processValidatorSignatures(txId, signatures);

    // Verify transaction completed
    BridgeTransactionResult result = bridgeService.getTransactionStatus(txId);
    assertEquals(BridgeStatus.COMPLETED, result.status());
}

@Test
@DisplayName("Reject transaction with insufficient signatures")
void testInsufficientSignatures() {
    String txId = bridgeService.initiateToEthereum(...).transactionId();

    // Only 5 out of 10 validators (< 2/3)
    List<ValidatorSignature> signatures = collectSignatures(5);

    bridgeService.processValidatorSignatures(txId, signatures);

    BridgeTransactionResult result = bridgeService.getTransactionStatus(txId);
    assertEquals(BridgeStatus.PENDING_SIGNATURES, result.status());
}
```

**Success Criteria**:
- ✅ 15+ multi-sig tests passing
- ✅ All Byzantine scenarios covered
- ✅ Coverage increases to 60%+

#### Task 1.3: Fraud Detection & Asset Locking Tests (1.5 days)
**Owner**: Security Test Engineer
**Lines to Cover**: ~120 lines

**Test Scenarios**:
1. ✅ Test suspicious pattern detection
2. ✅ Test address blacklisting
3. ✅ Test amount-based fraud flags
4. ✅ Test asset locking state transitions
5. ✅ Test unlock on transaction completion
6. ✅ Test refund on transaction failure

**Test Code**:
```java
@Test
@DisplayName("Detect and block suspicious high-frequency transactions")
void testFraudDetection() {
    String suspiciousAddress = "aurigraph-addr-suspicious";

    // Attempt 51 transactions in quick succession (threshold = 50)
    for (int i = 0; i < 51; i++) {
        BridgeTransactionResult result = bridgeService.initiateToEthereum(
            suspiciousAddress,
            "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            BigInteger.valueOf(1000),
            "AUR"
        );

        if (i < 50) {
            assertEquals(BridgeStatus.PENDING_SIGNATURES, result.status());
        } else {
            // 51st transaction should be blocked
            assertEquals(BridgeStatus.BLOCKED, result.status());
            assertTrue(result.message().contains("Fraud detection"));
        }
    }
}

@Test
@DisplayName("Lock and unlock assets for bridge transactions")
void testAssetLocking() {
    BigInteger amount = BigInteger.valueOf(1000000);
    String address = "aurigraph-addr-123";

    // Check initial balance
    BigInteger initialBalance = ledger.getBalance(address);

    // Initiate bridge transaction
    BridgeTransactionResult result = bridgeService.initiateToEthereum(
        address, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", amount, "AUR"
    );

    // Verify assets are locked
    BigInteger balanceAfterLock = ledger.getBalance(address);
    assertEquals(initialBalance.subtract(amount), balanceAfterLock);

    LockedAsset locked = bridgeService.getLockedAsset(result.transactionId());
    assertNotNull(locked);
    assertEquals(amount, locked.amount());

    // Complete bridge transaction
    bridgeService.completeBridgeTransaction(result.transactionId());

    // Verify assets are released
    LockedAsset unlocked = bridgeService.getLockedAsset(result.transactionId());
    assertNull(unlocked);
}
```

**Success Criteria**:
- ✅ 12+ fraud detection tests passing
- ✅ All asset state transitions validated
- ✅ Coverage increases to 70%+

#### Task 1.4: Error Handling & Edge Cases (1 day)
**Owner**: QA Engineer
**Lines to Cover**: ~85 lines

**Test Scenarios**:
1. ✅ Test invalid addresses
2. ✅ Test zero/negative amounts
3. ✅ Test unsupported asset types
4. ✅ Test transaction not found
5. ✅ Test network timeout scenarios
6. ✅ Test concurrent transaction conflicts

**Expected Coverage After Phase 1**: EthereumBridgeService → **70%** ✅

---

## Phase 2: High Priorities (Week 2) - Portal & Monitoring

**Goal**: Increase Portal (33% → 75%) and Monitoring (39% → 75%)

### Service 2.1: EnterprisePortalService (33% → 75%)

**Gap Analysis**: 192 lines uncovered (455 total, 263 currently covered... but wait, the report shows only 45 lines covered out of 165. Let me recalculate based on the actual coverage report data).

Actually, looking at the coverage report:
- **EnterprisePortalService**: 45 lines covered out of 165 total (27% line coverage, reported as 33% instruction coverage)
- **Gap**: 120 lines to cover to reach 75%

#### Task 2.1.1: WebSocket Integration Tests (2 days)
**Owner**: Frontend Integration Engineer
**Lines to Cover**: ~60 lines

**Test Scenarios**:
1. ✅ Test WebSocket connection lifecycle
2. ✅ Test message broadcasting to all clients
3. ✅ Test selective message routing
4. ✅ Test connection error handling
5. ✅ Test reconnection logic

**Test Code**:
```java
@QuarkusTest
class EnterprisePortalWebSocketTest {

    private WebSocketClient client;

    @BeforeEach
    void setUp() {
        client = new WebSocketClient(URI.create("ws://localhost:8081/api/v11/portal/websocket"));
    }

    @Test
    @DisplayName("Connect to WebSocket and receive initial data")
    void testWebSocketConnection() throws Exception {
        CountDownLatch messageLatch = new CountDownLatch(1);
        AtomicReference<String> receivedMessage = new AtomicReference<>();

        client.setMessageHandler(message -> {
            receivedMessage.set(message);
            messageLatch.countDown();
        });

        client.connect();

        // Wait for initial data
        assertTrue(messageLatch.await(5, TimeUnit.SECONDS));

        String message = receivedMessage.get();
        assertTrue(message.contains("initial_data"));
        assertTrue(message.contains("currentTPS"));
    }

    @Test
    @DisplayName("Receive real-time metrics updates")
    void testRealtimeMetrics() throws Exception {
        CountDownLatch metricsLatch = new CountDownLatch(2); // Expect 2 updates
        List<String> messages = new CopyOnWriteArrayList<>();

        client.setMessageHandler(message -> {
            if (message.contains("realtime_metrics")) {
                messages.add(message);
                metricsLatch.countDown();
            }
        });

        client.connect();

        // Wait for 2 metrics updates (broadcast every second)
        assertTrue(metricsLatch.await(3, TimeUnit.SECONDS));
        assertEquals(2, messages.size());
    }
}
```

**Success Criteria**:
- ✅ 15+ WebSocket tests passing
- ✅ Real-time updates validated
- ✅ Coverage increases to 50%+

#### Task 2.1.2: RBAC & User Management Tests (1.5 days)
**Owner**: Security Test Engineer
**Lines to Cover**: ~40 lines

**Test Scenarios**:
1. ✅ Test admin role permissions
2. ✅ Test operator role permissions
3. ✅ Test viewer role permissions
4. ✅ Test permission denial
5. ✅ Test user authentication

**Success Criteria**:
- ✅ 10+ RBAC tests passing
- ✅ All roles validated
- ✅ Coverage increases to 65%+

#### Task 2.1.3: Configuration Management Tests (1 day)
**Owner**: QA Engineer
**Lines to Cover**: ~20 lines

**Test Scenarios**:
1. ✅ Test configuration updates
2. ✅ Test invalid configuration rejection
3. ✅ Test configuration persistence

**Expected Coverage After Task 2.1**: EnterprisePortalService → **75%** ✅

### Service 2.2: SystemMonitoringService (39% → 75%)

**Gap Analysis**: 136 lines uncovered (367 total, 231 currently covered)

#### Task 2.2.1: Prometheus Integration Tests (1.5 days)
**Owner**: DevOps Engineer
**Lines to Cover**: ~60 lines

**Test Scenarios**:
1. ✅ Test metrics endpoint exposure
2. ✅ Test Prometheus scraping
3. ✅ Test custom metrics registration
4. ✅ Test metric aggregation
5. ✅ Test metric cardinality limits

**Test Code**:
```java
@QuarkusTest
class PrometheusIntegrationTest {

    @Test
    @DisplayName("Expose metrics in Prometheus format")
    void testPrometheusMetrics() {
        given()
            .when().get("/q/metrics")
            .then()
                .statusCode(200)
                .contentType("text/plain")
                .body(containsString("aurigraph_tps_current"))
                .body(containsString("aurigraph_memory_usage_percent"))
                .body(containsString("aurigraph_cpu_usage_percent"));
    }

    @Test
    @DisplayName("Register custom application metrics")
    void testCustomMetrics() {
        monitoringService.recordCustomMetric("custom_metric", 42.0);

        String metrics = given()
            .when().get("/q/metrics")
            .then()
                .statusCode(200)
                .extract().asString();

        assertTrue(metrics.contains("custom_metric 42.0"));
    }
}
```

**Success Criteria**:
- ✅ 8+ Prometheus tests passing
- ✅ Metrics endpoint validated
- ✅ Coverage increases to 55%+

#### Task 2.2.2: Alert System Tests (1.5 days)
**Owner**: SRE Engineer
**Lines to Cover**: ~50 lines

**Test Scenarios**:
1. ✅ Test alert triggering on threshold breach
2. ✅ Test alert severity levels
3. ✅ Test alert suppression
4. ✅ Test alert aggregation
5. ✅ Test alert notification

**Success Criteria**:
- ✅ 10+ alert tests passing
- ✅ All alert levels validated
- ✅ Coverage increases to 68%+

#### Task 2.2.3: JMX Bean Tests (1 day)
**Owner**: DevOps Engineer
**Lines to Cover**: ~26 lines

**Test Scenarios**:
1. ✅ Test JMX bean registration
2. ✅ Test JMX attribute access
3. ✅ Test JMX operation invocation

**Expected Coverage After Task 2.2**: SystemMonitoringService → **75%** ✅

---

## Phase 3: Final Push (Week 3) - 75% → 95% Across All Services

**Goal**: Achieve 95% coverage across all Sprint 14-20 services

### Task 3.1: EthereumBridgeService (70% → 95%)
**Time**: 2 days
**Focus**: Edge cases and error paths

**Scenarios to Add**:
1. ✅ Cross-chain transaction rollback
2. ✅ Orphaned transaction cleanup
3. ✅ State recovery after crash
4. ✅ Concurrent transaction handling
5. ✅ Performance under load

**Lines to Cover**: ~100 lines

### Task 3.2: EnterprisePortalService (75% → 95%)
**Time**: 1.5 days
**Focus**: Alert management and edge cases

**Scenarios to Add**:
1. ✅ Alert lifecycle management
2. ✅ Dashboard data caching
3. ✅ Concurrent user sessions
4. ✅ Rate limiting
5. ✅ Error recovery

**Lines to Cover**: ~40 lines

### Task 3.3: SystemMonitoringService (75% → 95%)
**Time**: 1.5 days
**Focus**: Performance sampling and reporting

**Scenarios to Add**:
1. ✅ Performance report generation
2. ✅ Historical metrics analysis
3. ✅ Trend detection
4. ✅ Anomaly detection
5. ✅ Resource exhaustion handling

**Lines to Cover**: ~60 lines

### Task 3.4: ParallelTransactionExecutor (89% → 95%)
**Time**: 1 day
**Focus**: Error handling and edge cases

**Scenarios to Add**:
1. ✅ Timeout handling
2. ✅ Partial failure recovery
3. ✅ Transaction retry logic
4. ✅ Conflict resolution edge cases
5. ✅ Performance degradation handling

**Lines to Cover**: ~12 lines

### Task 3.5: QuantumCryptoProvider (Wrapper Coverage)
**Time**: 0.5 days
**Focus**: Wrapper code edge cases

**Scenarios to Add**:
1. ✅ Invalid key handling
2. ✅ Signature verification failures
3. ✅ Key cache eviction
4. ✅ Security level validation

**Lines to Cover**: ~8 lines (wrapper code only)

---

## Coverage Validation Strategy

### Continuous Validation

**Tools**:
- JaCoCo Maven Plugin for coverage reports
- SonarQube for quality gates
- GitHub Actions for CI/CD integration

**Quality Gates**:
- ✅ 95% line coverage (minimum)
- ✅ 90% branch coverage (minimum)
- ✅ 0 critical bugs
- ✅ 0 security vulnerabilities

### Test Quality Metrics

**Metrics to Track**:
1. **Code Coverage**: Line, branch, method coverage
2. **Test Effectiveness**: Mutation testing score (> 80%)
3. **Test Maintainability**: Cyclomatic complexity < 10
4. **Test Performance**: Test suite execution < 5 minutes

### Coverage Report Format

```bash
# Generate detailed coverage report
./mvnw clean test jacoco:report

# View HTML report
open target/site/jacoco/index.html

# Export to SonarQube
./mvnw sonar:sonar \
  -Dsonar.projectKey=aurigraph-v11 \
  -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

---

## Resource Allocation

### Team Assignment

| Role | Tasks | Time Allocation |
|------|-------|-----------------|
| **Integration Test Engineer** | Web3j, WebSocket tests | 40% (Week 1-2) |
| **Security Test Engineer** | Multi-sig, fraud, RBAC tests | 50% (Week 1-2) |
| **QA Engineer** | Edge cases, error handling | 30% (Week 1-3) |
| **DevOps Engineer** | Prometheus, JMX tests | 30% (Week 2) |
| **SRE Engineer** | Alert system tests | 20% (Week 2) |
| **Performance Engineer** | Load tests, benchmarks | 20% (Week 3) |

**Total Effort**: ~100 person-hours across 3 weeks

### Timeline

```
Week 1: EthereumBridgeService (15% → 70%)
├─ Mon-Tue: Web3j integration tests
├─ Wed-Thu: Multi-sig validation tests
├─ Thu-Fri: Fraud detection & asset locking tests
└─ Fri: Error handling & edge cases

Week 2: Portal & Monitoring (33%/39% → 75%/75%)
├─ Mon-Tue: WebSocket integration + Prometheus
├─ Wed-Thu: RBAC + Alert system
├─ Thu-Fri: Configuration + JMX bean tests
└─ Fri: Review and adjustment

Week 3: Final Push (70-75% → 95%)
├─ Mon-Tue: Bridge edge cases
├─ Wed: Portal edge cases
├─ Thu: Monitoring edge cases
├─ Fri: Parallel executor & crypto wrapper
└─ Weekend: Buffer for adjustments
```

---

## Risk Management

### Risk 1: Integration Test Complexity
**Impact**: HIGH
**Probability**: MEDIUM

**Mitigation**:
- Use TestContainers for Ethereum node
- Mock complex Web3j interactions
- Implement retry logic for flaky tests

### Risk 2: Coverage Target Not Achievable
**Impact**: MEDIUM
**Probability**: LOW

**Mitigation**:
- Negotiate realistic targets (90% acceptable)
- Exclude generated code from coverage
- Focus on critical business logic

### Risk 3: Test Suite Performance Degradation
**Impact**: MEDIUM
**Probability**: MEDIUM

**Mitigation**:
- Parallelize test execution
- Use in-memory databases for integration tests
- Implement test categorization (@Tag)

---

## Success Criteria

### Overall Success

- ✅ 95% line coverage across all Sprint 14-20 services
- ✅ 90% branch coverage
- ✅ All tests passing (0 failures)
- ✅ Test execution time < 5 minutes
- ✅ 0 critical bugs
- ✅ 0 security vulnerabilities

### Per-Service Success

| Service | Target | Success Criteria |
|---------|--------|------------------|
| ParallelTransactionExecutor | 95% | ✅ 89% → 95% (+6%) |
| EnterprisePortalService | 95% | ✅ 33% → 95% (+62%) |
| SystemMonitoringService | 95% | ✅ 39% → 95% (+56%) |
| EthereumBridgeService | 95% | ✅ 15% → 95% (+80%) |
| QuantumCryptoProvider | N/A* | ✅ Wrapper code validated |

*Coverage not applicable due to external library dependency

---

## Deliverables

### Week 1 Deliverables

- ✅ EthereumBridgeService at 70% coverage
- ✅ 45+ integration tests implemented
- ✅ Coverage report showing progress
- ✅ Documentation of test scenarios

### Week 2 Deliverables

- ✅ EnterprisePortalService at 75% coverage
- ✅ SystemMonitoringService at 75% coverage
- ✅ 50+ additional tests implemented
- ✅ Prometheus integration validated

### Week 3 Deliverables

- ✅ All services at 95% coverage
- ✅ Comprehensive test suite (300+ tests)
- ✅ Coverage report meeting all quality gates
- ✅ Test documentation complete
- ✅ Handoff to CI/CD pipeline

---

## Next Steps

### Immediate Actions (Today)

1. ✅ Review and approve this action plan
2. ✅ Assign team members to tasks
3. ✅ Set up TestContainers and Web3j environment
4. ✅ Configure JaCoCo quality gates in pom.xml

### Week 1 Kickoff (Monday)

1. ✅ Team briefing on coverage goals
2. ✅ Environment setup verification
3. ✅ Start Task 1.1 (Web3j integration tests)
4. ✅ Daily standup to track progress

### Weekly Reviews

- **End of Week 1**: Review EthereumBridgeService coverage
- **End of Week 2**: Review Portal and Monitoring coverage
- **End of Week 3**: Final coverage validation and sign-off

---

**Document Status**: FINAL
**Approval Required**: Tech Lead, QA Lead
**Implementation Start**: 2025-10-14
**Target Completion**: 2025-10-31

---

**Notes**:
- This plan assumes full-time allocation of engineers
- Adjust timeline if engineers are shared across projects
- Buffer time included for unexpected complexities
- Regular sync with stakeholders recommended

---

**Success Definition**: When all Sprint 14-20 services consistently maintain 95%+ coverage with high-quality, maintainable tests that validate both happy paths and edge cases.
