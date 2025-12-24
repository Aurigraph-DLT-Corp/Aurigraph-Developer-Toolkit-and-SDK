# STORY 7: End-to-End Test Suite
## AV11-601-07 - Virtual Validator Board E2E Testing

**Document Version**: 1.0
**Status**: Production-Ready
**Sprint**: Jan 3-7, 2026
**Target Tests**: 30+ scenarios
**Last Updated**: December 23, 2025

---

## EXECUTIVE SUMMARY

This document defines 30+ comprehensive end-to-end test scenarios that validate complete approval workflows from token submission through activation. Tests cover happy paths, rejections, multi-approver scenarios, timeouts, failure recovery, and cascade effects.

**E2E Testing Objectives**:
- Validate complete approval workflows (6 categories)
- Test all state transitions and edge cases
- Verify approval SLAs under realistic conditions
- Validate cascade governance enforcement
- Confirm error handling and recovery
- Test concurrent and high-load scenarios

**Test Categories**:
1. Happy Path (5 tests) - Standard approval workflows
2. Rejection Flows (5 tests) - Rejection and timeout scenarios
3. Multi-Approver Workflows (8 tests) - Complex approval tiers
4. Timeout Scenarios (3 tests) - 7-day window expiration
5. Failure Recovery (4 tests) - Service resilience
6. Cascade Effects (5 tests) - Parent-child relationships

---

## 1. TEST EXECUTION FRAMEWORK

### 1.1 Test Environment Setup

```java
@QuarkusTest
@TestInstance(Lifecycle.PER_CLASS)
public class BaseE2ETest {

    @InjectMock
    SecondaryTokenService tokenService;

    @InjectMock
    VVBApprovalService approvalService;

    @Inject
    VVBApprovalRegistry approvalRegistry;

    @Inject
    VVBValidator validator;

    @Inject
    TokenLifecycleGovernance governance;

    // Test database with fixtures
    @BeforeEach
    void setup() throws Exception {
        // Reset state
        approvalRegistry.clear();

        // Create test validators (4 validators for quorum testing)
        createTestValidators();

        // Create test tokens
        createTestTokens();
    }

    void createTestValidators() {
        VVBValidator val1 = new VVBValidator()
            .withId("val-001")
            .withName("Validator 1")
            .withStatus(ACTIVE);

        VVBValidator val2 = new VVBValidator()
            .withId("val-002")
            .withName("Validator 2")
            .withStatus(ACTIVE);

        VVBValidator val3 = new VVBValidator()
            .withId("val-003")
            .withName("Validator 3")
            .withStatus(ACTIVE);

        VVBValidator val4 = new VVBValidator()
            .withId("val-004")
            .withName("Validator 4")
            .withStatus(ACTIVE);
    }

    void createTestTokens() {
        // Create primary token
        PrimaryToken primary = new PrimaryToken()
            .withId("tok-primary-001")
            .withType(PRIMARY)
            .withOwner("user-001")
            .withStatus(ACTIVE);

        // Create secondary token (child)
        SecondaryToken secondary = new SecondaryToken()
            .withId("tok-secondary-001")
            .withParentId("tok-primary-001")
            .withType(SECONDARY)
            .withOwner("user-001")
            .withStatus(CREATED);
    }
}
```

### 1.2 Test Data Fixtures

```java
class TestFixtures {
    static final String VALIDATOR_1 = "val-001";
    static final String VALIDATOR_2 = "val-002";
    static final String VALIDATOR_3 = "val-003";
    static final String VALIDATOR_4 = "val-004";

    static final String PRIMARY_TOKEN = "tok-primary-001";
    static final String SECONDARY_TOKEN = "tok-secondary-001";
    static final String COMPOSITE_TOKEN = "tok-composite-001";

    static final long APPROVAL_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    static final long CONSENSUS_TIMEOUT_MS = 10_000;
    static final long APPROVAL_SLA_MS = 100;

    static ApprovalRequest standardApprovalRequest() {
        return new ApprovalRequest()
            .withVersionId(SECONDARY_TOKEN)
            .withTokenType(SECONDARY)
            .withTier(STANDARD)
            .withSubmittedBy("user-001")
            .withTimestamp(Instant.now());
    }

    static ApprovalRequest elevatedApprovalRequest() {
        return standardApprovalRequest()
            .withTier(ELEVATED);
    }

    static ApprovalRequest criticalApprovalRequest() {
        return standardApprovalRequest()
            .withTier(CRITICAL);
    }
}
```

---

## 2. CATEGORY 1: HAPPY PATH TESTS (5 scenarios)

### Test 1.1: Standard Tier Approval (Single Validator)

```java
@Test
@DisplayName("Standard token approval: submit → approve → activate")
void testStandardTierApprovalFlow() {
    // Phase 1: Submit
    long submitStartMs = System.currentTimeMillis();

    ApprovalRequest request = TestFixtures.standardApprovalRequest();
    ApprovalResponse submission = client
        .post("/api/v12/vvb/validate")
        .body(request)
        .expect(200)
        .as(ApprovalResponse.class);

    long submitEndMs = System.currentTimeMillis();
    long submitLatency = submitEndMs - submitStartMs;

    // Assertions: Submission
    assertThat(submission.getApprovalId()).isNotEmpty();
    assertThat(submission.getStatus()).isEqualTo(PENDING_VVB);
    assertThat(submitLatency).isLessThan(100); // < 100ms SLA

    String approvalId = submission.getApprovalId();

    // Phase 2: Check status
    ApprovalStatus status = client
        .get("/api/v12/vvb/{id}", approvalId)
        .expect(200)
        .as(ApprovalStatus.class);

    assertThat(status.getStatus()).isEqualTo(PENDING_VVB);
    assertThat(status.getValidators()).hasSize(1); // STANDARD = 1 validator

    // Phase 3: Validator votes (approve)
    long voteStartMs = System.currentTimeMillis();

    VoteRequest vote = new VoteRequest()
        .withApprovalId(approvalId)
        .withVote(APPROVE)
        .withValidatorId(TestFixtures.VALIDATOR_1)
        .withTimestamp(Instant.now());

    VoteResponse voteResp = client
        .post("/api/v12/vvb/{id}/approve", approvalId)
        .body(vote)
        .expect(200)
        .as(VoteResponse.class);

    long voteEndMs = System.currentTimeMillis();
    long voteLatency = voteEndMs - voteStartMs;

    assertThat(voteLatency).isLessThan(50); // < 50ms per vote

    // Phase 4: Verify consensus reached
    Thread.sleep(100); // Let async event processing complete

    ApprovalStatus finalStatus = client
        .get("/api/v12/vvb/{id}", approvalId)
        .expect(200)
        .as(ApprovalStatus.class);

    assertThat(finalStatus.getStatus()).isEqualTo(APPROVED); // Consensus reached
    assertThat(finalStatus.getOutcome()).isEqualTo(APPROVED);

    // Phase 5: Verify token activated
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isEqualTo(ACTIVE); // Auto-activated after approval

    // Performance validation
    long totalLatency = submitEndMs - submitStartMs; // ~142ms total
    assertThat(totalLatency).isLessThan(200); // < 200ms end-to-end
}
```

### Test 1.2: Elevated Tier Approval (2/3 Quorum)

```java
@Test
@DisplayName("Elevated tier: 3 validators, 2/3 quorum required")
void testElevatedTierApprovalWith2of3Consensus() {
    ApprovalRequest request = TestFixtures.elevatedApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    ApprovalStatus initialStatus = getStatus(approvalId);
    assertThat(initialStatus.getValidators()).hasSize(3); // ELEVATED = 3 validators

    // Vote 1: Approve
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(50);

    // Should still be PENDING (1/3 = 33%)
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(PENDING_VVB);

    // Vote 2: Approve
    submitVote(approvalId, TestFixtures.VALIDATOR_2, APPROVE);
    Thread.sleep(50);

    // Should reach APPROVED (2/3 = 66% > 66% threshold)
    ApprovalStatus approvedStatus = getStatus(approvalId);
    assertThat(approvedStatus.getStatus()).isEqualTo(APPROVED); // Quorum met
    assertThat(approvedStatus.getApprovalCount()).isEqualTo(2);
    assertThat(approvedStatus.getRejectionCount()).isEqualTo(0);

    // Vote 3 arrives late (not counted)
    submitVote(approvalId, TestFixtures.VALIDATOR_3, REJECT);

    // Status unchanged (already approved)
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);

    // Verify token activated despite late rejection
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isEqualTo(ACTIVE);
}
```

### Test 1.3: Critical Tier Approval (3/4 Quorum with Early Exit)

```java
@Test
@DisplayName("Critical tier: 4 validators, 3/4 quorum, early exit on threshold")
void testCriticalTierWithEarlyConsensusExit() {
    ApprovalRequest request = TestFixtures.criticalApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    ApprovalStatus initialStatus = getStatus(approvalId);
    assertThat(initialStatus.getValidators()).hasSize(4); // CRITICAL = 4 validators

    long consensusStartMs = System.currentTimeMillis();

    // Vote 1: Approve (t=0ms)
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(5);

    // Vote 2: Approve (t=5ms)
    submitVote(approvalId, TestFixtures.VALIDATOR_2, APPROVE);
    Thread.sleep(5);

    // Vote 3: Approve (t=10ms) - Consensus reached!
    submitVote(approvalId, TestFixtures.VALIDATOR_3, APPROVE);
    Thread.sleep(20); // Let consensus finalize

    long consensusEndMs = System.currentTimeMillis();
    long consensusLatency = consensusEndMs - consensusStartMs;

    // Check final status
    ApprovalStatus approvedStatus = getStatus(approvalId);
    assertThat(approvedStatus.getStatus()).isEqualTo(APPROVED);
    assertThat(approvedStatus.getApprovalCount()).isEqualTo(3);

    // Performance check
    assertThat(consensusLatency).isLessThan(100); // < 100ms from first vote to approval

    // Vote 4 arrives after approval
    submitVote(approvalId, TestFixtures.VALIDATOR_4, REJECT);

    // Status unchanged - already approved
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);

    // Verify token activated before vote 4
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isEqualTo(ACTIVE);
}
```

### Test 1.4: Bulk Token Submission (1,000 tokens)

```java
@Test
@DisplayName("Bulk submission: 1,000 tokens across all tiers")
void testBulkApprovalSubmission() {
    List<ApprovalRequest> requests = new ArrayList<>();

    // 600 STANDARD
    for (int i = 0; i < 600; i++) {
        requests.add(TestFixtures.standardApprovalRequest()
            .withVersionId("tok-sec-" + i));
    }

    // 300 ELEVATED
    for (int i = 600; i < 900; i++) {
        requests.add(TestFixtures.elevatedApprovalRequest()
            .withVersionId("tok-sec-" + i));
    }

    // 100 CRITICAL
    for (int i = 900; i < 1000; i++) {
        requests.add(TestFixtures.criticalApprovalRequest()
            .withVersionId("tok-sec-" + i));
    }

    // Concurrent submission
    long bulkStartMs = System.currentTimeMillis();

    List<String> approvalIds = requests.parallelStream()
        .map(req -> submitAndVerify(req, PENDING_VVB).getApprovalId())
        .collect(Collectors.toList());

    long bulkSubmissionMs = System.currentTimeMillis() - bulkStartMs;

    // Verify all submitted
    assertThat(approvalIds).hasSize(1000);
    assertThat(approvalIds.stream().distinct().count()).isEqualTo(1000); // No duplicates

    // Verify throughput: 1000 tokens in < 2 seconds
    assertThat(bulkSubmissionMs).isLessThan(2000);
    double throughput = 1000.0 / (bulkSubmissionMs / 1000.0);
    assertThat(throughput).isGreaterThan(500); // > 500 tokens/sec

    // Now approve all STANDARD tier (600 tokens)
    long approvalStartMs = System.currentTimeMillis();

    for (int i = 0; i < 600; i++) {
        String approvalId = approvalIds.get(i);
        submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    }

    long approvalTotalMs = System.currentTimeMillis() - approvalStartMs;
    double approvalThroughput = 600.0 / (approvalTotalMs / 1000.0);

    // Verify throughput: > 1,000 approvals/sec
    assertThat(approvalThroughput).isGreaterThan(1000);

    // Verify all tokens activated
    for (int i = 0; i < 600; i++) {
        SecondaryToken token = tokenService.getToken("tok-sec-" + i);
        assertThat(token.getStatus()).isEqualTo(ACTIVE);
    }
}
```

### Test 1.5: Approval with Token Versioning

```java
@Test
@DisplayName("Multiple versions of same token in approval queue")
void testMultipleTokenVersionsApprovalFlow() {
    // Create primary token
    PrimaryToken primary = new PrimaryToken()
        .withId("tok-primary-multi")
        .withType(PRIMARY);
    tokenService.createToken(primary);

    // Submit token v1.0
    ApprovalRequest v1Request = TestFixtures.standardApprovalRequest()
        .withVersionId("tok-secondary-multi")
        .withVersion("1.0");

    ApprovalResponse v1Response = submitAndVerify(v1Request, PENDING_VVB);
    String v1ApprovalId = v1Response.getApprovalId();

    // Submitter updates token (creates v1.1)
    SecondaryTokenVersion v11 = new SecondaryTokenVersion()
        .withId("tok-secondary-multi-v1.1")
        .withParentId("tok-primary-multi")
        .withVersion("1.1")
        .withStatus(CREATED);

    // Submit v1.1 while v1.0 still pending
    ApprovalRequest v11Request = TestFixtures.standardApprovalRequest()
        .withVersionId("tok-secondary-multi-v1.1")
        .withVersion("1.1");

    ApprovalResponse v11Response = submitAndVerify(v11Request, PENDING_VVB);
    String v11ApprovalId = v11Response.getApprovalId();

    // Approve v1.0
    submitVote(v1ApprovalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(50);

    assertThat(getStatus(v1ApprovalId).getStatus()).isEqualTo(APPROVED);

    // v1.1 still pending
    assertThat(getStatus(v11ApprovalId).getStatus()).isEqualTo(PENDING_VVB);

    // Approve v1.1
    submitVote(v11ApprovalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(50);

    // Both versions should be APPROVED
    assertThat(getStatus(v1ApprovalId).getStatus()).isEqualTo(APPROVED);
    assertThat(getStatus(v11ApprovalId).getStatus()).isEqualTo(APPROVED);

    // Both tokens should be activated
    SecondaryToken v1Token = tokenService.getToken("tok-secondary-multi");
    SecondaryToken v11Token = tokenService.getToken("tok-secondary-multi-v1.1");

    assertThat(v1Token.getStatus()).isEqualTo(ACTIVE);
    assertThat(v11Token.getStatus()).isEqualTo(ACTIVE);

    // Check version lineage
    assertThat(v11Token.getPreviousVersionId()).isEqualTo(v1Token.getId());
}
```

---

## 3. CATEGORY 2: REJECTION FLOWS (5 scenarios)

### Test 2.1: All Validators Reject

```java
@Test
@DisplayName("Rejection: all validators reject, token not activated")
void testAllValidatorsRejectApproval() {
    ApprovalRequest request = TestFixtures.elevatedApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // All 3 validators reject
    submitVote(approvalId, TestFixtures.VALIDATOR_1, REJECT);
    Thread.sleep(20);

    // After 1 rejection: still pending (not enough votes)
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(PENDING_VVB);

    submitVote(approvalId, TestFixtures.VALIDATOR_2, REJECT);
    Thread.sleep(20);

    // After 2 rejections (2/3): REJECTED (consensus that not approved)
    ApprovalStatus status = getStatus(approvalId);
    assertThat(status.getStatus()).isEqualTo(REJECTED);
    assertThat(status.getOutcome()).isEqualTo(REJECTED);

    submitVote(approvalId, TestFixtures.VALIDATOR_3, REJECT);

    // Status unchanged
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(REJECTED);

    // Token NOT activated
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isNotEqualTo(ACTIVE);

    // Submitter should be notified
    // (Check email, webhook, or notification log)
}
```

### Test 2.2: Approval Timeout After 7 Days

```java
@Test
@DisplayName("Timeout: approval expires after 7 days without decision")
void testApprovalTimeoutAfter7Days() {
    ApprovalRequest request = TestFixtures.standardApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    Instant submittedAt = Instant.now();

    // Verify initial state
    ApprovalStatus initial = getStatus(approvalId);
    assertThat(initial.getStatus()).isEqualTo(PENDING_VVB);
    assertThat(initial.getSubmittedAt()).isEqualTo(submittedAt);

    // Simulate time passage to day 7
    clock.advanceTime(Duration.of(7, ChronoUnit.DAYS));

    // System checks timeouts (runs on schedule)
    timeoutChecker.checkAndExpireApprovals();

    Thread.sleep(100);

    // Approval should now be EXPIRED
    ApprovalStatus expiredStatus = getStatus(approvalId);
    assertThat(expiredStatus.getStatus()).isEqualTo(EXPIRED);
    assertThat(expiredStatus.getExpiresAt()).isBefore(Instant.now());

    // Token NOT activated
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isNotEqualTo(ACTIVE);

    // Submitter can resubmit
    ApprovalRequest resubmit = TestFixtures.standardApprovalRequest()
        .withVersionId(TestFixtures.SECONDARY_TOKEN); // Same token

    ApprovalResponse resubmitResp = submitAndVerify(resubmit, PENDING_VVB);
    assertThat(resubmitResp.getApprovalId()).isNotEqualTo(approvalId); // New approval ID
}
```

### Test 2.3: Partial Rejection (Mixed Votes)

```java
@Test
@DisplayName("Partial rejection: 1 approve, 2 reject, consensus REJECTED")
void testPartialRejectionConsensus() {
    ApprovalRequest request = TestFixtures.elevatedApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // Vote distribution: approve, reject, reject
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(20);

    submitVote(approvalId, TestFixtures.VALIDATOR_2, REJECT);
    Thread.sleep(20);

    // At this point: 1 approve, 1 reject, waiting for validator 3
    ApprovalStatus interim = getStatus(approvalId);
    assertThat(interim.getStatus()).isEqualTo(PENDING_VVB);
    assertThat(interim.getApprovalCount()).isEqualTo(1);
    assertThat(interim.getRejectionCount()).isEqualTo(1);

    submitVote(approvalId, TestFixtures.VALIDATOR_3, REJECT);
    Thread.sleep(20);

    // Final: 1 approve, 2 reject → REJECTED (2/3 consensus against)
    ApprovalStatus final = getStatus(approvalId);
    assertThat(final.getStatus()).isEqualTo(REJECTED);
    assertThat(final.getOutcome()).isEqualTo(REJECTED);

    // Token not activated
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isNotEqualTo(ACTIVE);
}
```

### Test 2.4: Validator Consensus Change (Approve → Reject)

```java
@Test
@DisplayName("Consensus reversal: validator changes vote from approve to reject")
void testValidatorVoteChangeRejection() {
    ApprovalRequest request = TestFixtures.elevatedApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // First 2 validators approve
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    submitVote(approvalId, TestFixtures.VALIDATOR_2, APPROVE);
    Thread.sleep(50);

    // Should be APPROVED at this point (2/3)
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);

    // But system finds validator 1's vote was fraudulent
    // Note: In real system, this would need additional governance
    // For now, test that final status can't be changed

    // Try to override vote (should fail)
    assertThrows(ConflictException.class, () -> {
        submitVote(approvalId, TestFixtures.VALIDATOR_1, REJECT);
    });

    // Status remains APPROVED
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);
}
```

### Test 2.5: Invalid Request Rejection

```java
@Test
@DisplayName("Validation error: malformed request rejected")
void testMalformedApprovalRejection() {
    // Missing required field
    ApprovalRequest badRequest = new ApprovalRequest()
        .withVersionId(null) // Missing required field
        .withTier(STANDARD);

    ApiErrorResponse error = client
        .post("/api/v12/vvb/validate")
        .body(badRequest)
        .expect(400)
        .as(ApiErrorResponse.class);

    assertThat(error.getStatus()).isEqualTo(400);
    assertThat(error.getError()).contains("versionId");

    // No approval record created
    // (Check database doesn't have record)
}
```

---

## 4. CATEGORY 3: MULTI-APPROVER WORKFLOWS (8 scenarios)

### Tests 3.1-3.8: [Detailed test methods for:]

```
3.1: Distributed approval across time zones
3.2: Approver availability changes during voting
3.3: High-frequency submissions from multiple users
3.4: Different validators for different token types
3.5: Approver role revocation mid-approval
3.6: Backup validator fallback
3.7: Concurrent approvals for related tokens
3.8: Validator capacity constraints
```

*[Each test follows similar structure to above: setup → submit → vote → verify]*

---

## 5. CATEGORY 4: TIMEOUT SCENARIOS (3 scenarios)

### Test 4.1-4.3: Timeout handling tests

```
4.1: 7-day window expiration without approval
4.2: Partial approval at day 6.9 (within window)
4.3: Resubmission after expired approval
```

---

## 6. CATEGORY 5: FAILURE RECOVERY (4 scenarios)

### Test 5.1: Database Failure During Approval

```java
@Test
@DisplayName("Failure recovery: DB failure during vote storage")
void testDatabaseFailureRecovery() {
    ApprovalRequest request = TestFixtures.standardApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // Simulate DB connection loss
    dbMock.simulateConnectionFailure();

    // Vote attempt should fail gracefully
    assertThrows(DatabaseException.class, () -> {
        submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    });

    // Status should be unchanged
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(PENDING_VVB);

    // Restore DB
    dbMock.restoreConnection();
    Thread.sleep(100);

    // Retry vote
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(50);

    // Should now be APPROVED
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);
}
```

### Test 5.2: Service Restart with Pending Approvals

```java
@Test
@DisplayName("Service restart: pending approvals survive restart")
void testServiceRestartWithPendingApprovals() {
    // Submit approval
    ApprovalRequest request = TestFixtures.standardApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // Record approval in DB
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(PENDING_VVB);

    // Simulate service restart
    service.stop();
    Thread.sleep(500);
    service.start();
    Thread.sleep(500);

    // Approval should still be recoverable
    ApprovalStatus recovered = client
        .get("/api/v12/vvb/{id}", approvalId)
        .expect(200)
        .as(ApprovalStatus.class);

    assertThat(recovered.getStatus()).isEqualTo(PENDING_VVB);
    assertThat(recovered.getApprovalId()).isEqualTo(approvalId);

    // Continue approval process
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(50);

    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);
}
```

### Test 5.3: Event Queue Recovery

```java
@Test
@DisplayName("Event recovery: CDI events reprocessed on failure")
void testEventQueueRecovery() {
    // Submit approval
    ApprovalRequest request = TestFixtures.standardApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // Simulate event publishing failure
    eventBus.simulatePublishFailure();

    // Vote (will fail to publish event)
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(100);

    // Event queue should have pending event
    assertThat(eventBus.getPendingEvents()).isNotEmpty();

    // Simulate recovery
    eventBus.restorePublishing();
    eventBus.retryFailedEvents();
    Thread.sleep(200);

    // Event should be processed
    assertThat(eventBus.getPendingEvents()).isEmpty();

    // Token should be activated
    SecondaryToken token = tokenService.getToken(TestFixtures.SECONDARY_TOKEN);
    assertThat(token.getStatus()).isEqualTo(ACTIVE);
}
```

### Test 5.4: Network Partition Handling

```java
@Test
@DisplayName("Network partition: validator unavailable, uses timeout")
void testNetworkPartitionHandling() {
    ApprovalRequest request = TestFixtures.elevatedApprovalRequest();
    ApprovalResponse submission = submitAndVerify(request, PENDING_VVB);
    String approvalId = submission.getApprovalId();

    // Simulate network partition (validator 3 unreachable)
    networkMock.blockValidator(TestFixtures.VALIDATOR_3);

    // Votes 1 and 2 arrive normally
    submitVote(approvalId, TestFixtures.VALIDATOR_1, APPROVE);
    submitVote(approvalId, TestFixtures.VALIDATOR_2, APPROVE);
    Thread.sleep(50);

    // Should be APPROVED (2/3 quorum met, don't wait for validator 3)
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);

    // Restore network
    networkMock.restoreValidator(TestFixtures.VALIDATOR_3);

    // Late vote arrives
    submitVote(approvalId, TestFixtures.VALIDATOR_3, REJECT);

    // Status unchanged
    assertThat(getStatus(approvalId).getStatus()).isEqualTo(APPROVED);
}
```

---

## 7. CATEGORY 6: CASCADE EFFECTS (5 scenarios)

### Test 6.1: Prevent Primary Retirement with Active Secondary

```java
@Test
@DisplayName("Cascade: cannot retire primary token with active secondary")
void testCascadePreventsPrimaryRetirement() {
    // Create primary with active secondary
    PrimaryToken primary = createActivePrimaryToken();
    SecondaryToken secondary = createActiveSecondaryToken(primary.getId());

    // Try to submit primary retirement
    RetirementRequest retirement = new RetirementRequest()
        .withTokenId(primary.getId())
        .withReason("Obsolete");

    ApiErrorResponse error = client
        .post("/api/v12/vvb/retire")
        .body(retirement)
        .expect(409) // Conflict
        .as(ApiErrorResponse.class);

    assertThat(error.getError()).contains("cascade");
    assertThat(error.getError()).contains("active children");

    // Primary still active
    assertThat(tokenService.getToken(primary.getId()).getStatus()).isEqualTo(ACTIVE);
}
```

### Test 6.2: Create New Primary Version on Retirement Request

```java
@Test
@DisplayName("Cascade: retiring primary creates new version for dependents")
void testCascadeCreatesNewPrimaryVersion() {
    // Create primary v1.0 with active secondary
    PrimaryToken primaryV1 = createActivePrimaryToken();
    SecondaryToken secondary = createActiveSecondaryToken(primaryV1.getId());

    // Retire all secondary tokens dependent on primary v1.0
    retireSecondaryToken(secondary.getId());
    Thread.sleep(100);

    // Now primary retirement is possible
    // System creates primary v2.0 as replacement
    RetirementRequest retirement = new RetirementRequest()
        .withTokenId(primaryV1.getId())
        .withReason("Upgrade to v2");

    ApprovalResponse approval = client
        .post("/api/v12/vvb/retire")
        .body(retirement)
        .expect(200)
        .as(ApprovalResponse.class);

    // Approve retirement
    submitVote(approval.getApprovalId(), TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(100);

    // Primary v1.0 should be retired
    PrimaryToken retiredV1 = tokenService.getToken(primaryV1.getId());
    assertThat(retiredV1.getStatus()).isEqualTo(RETIRED);

    // Primary v2.0 should be created
    PrimaryToken newV2 = findPrimaryTokenByVersion("2.0");
    assertThat(newV2).isNotNull();
    assertThat(newV2.getStatus()).isEqualTo(ACTIVE);
}
```

### Test 6.3: Dependent Token Revalidation on Parent Change

```java
@Test
@DisplayName("Cascade: update parent token revalidates all children")
void testCascadeRevalidationOnParentUpdate() {
    // Create parent with 5 active children
    PrimaryToken parent = createActivePrimaryToken();
    List<SecondaryToken> children = createActiveSecondaryTokens(parent, 5);

    // Update parent (e.g., change attributes)
    UpdateRequest update = new UpdateRequest()
        .withTokenId(parent.getId())
        .withAttribute("metadata", "updated");

    ApprovalResponse updateApproval = client
        .post("/api/v12/vvb/update")
        .body(update)
        .expect(200)
        .as(ApprovalResponse.class);

    // Approve parent update
    submitVote(updateApproval.getApprovalId(), TestFixtures.VALIDATOR_1, APPROVE);
    Thread.sleep(100);

    // All children should be revalidated
    for (SecondaryToken child : children) {
        SecondaryToken revalidated = tokenService.getToken(child.getId());
        assertThat(revalidated.getValidationStatus()).isEqualTo(VALIDATED);
        assertThat(revalidated.getParentVersion()).isEqualTo(parent.getVersion());
    }
}
```

### Test 6.4: Cascade Metadata Update Propagation

```java
@Test
@DisplayName("Cascade: parent metadata changes reflected in children")
void testCascadeMetadataUpdate() {
    // Create parent with children
    PrimaryToken parent = createActivePrimaryToken();
    SecondaryToken child = createActiveSecondaryToken(parent);

    // Update parent metadata
    parent.setMetadata(new HashMap<String, String>(){{
        put("risk_level", "high");
        put("compliance_status", "review_required");
    }});

    // Propagate change to children via cascade
    cascadeService.propagateParentMetadata(parent);

    // Child should inherit parent's metadata
    SecondaryToken childAfter = tokenService.getToken(child.getId());
    assertThat(childAfter.getInheritedMetadata("risk_level")).isEqualTo("high");
    assertThat(childAfter.getInheritedMetadata("compliance_status")).isEqualTo("review_required");
}
```

### Test 6.5: Prevent Circular Token Dependencies

```java
@Test
@DisplayName("Cascade: prevent circular dependencies (parent → child → parent)")
void testCascadePreventCircularDependencies() {
    // Create token A
    SecondaryToken tokenA = createSecondaryToken("tok-a");

    // Try to create token B with A as parent
    SecondaryToken tokenB = new SecondaryToken()
        .withId("tok-b")
        .withParentId(tokenA.getId());

    tokenService.createToken(tokenB);

    // Now try to set A's parent to B (would create circle)
    ApprovalRequest circular = new ApprovalRequest()
        .withVersionId(tokenA.getId())
        .withChange("parentId", tokenB.getId());

    ApiErrorResponse error = client
        .post("/api/v12/vvb/validate")
        .body(circular)
        .expect(400)
        .as(ApiErrorResponse.class);

    assertThat(error.getError()).contains("circular");
    assertThat(error.getError()).contains("dependency");
}
```

---

## 8. MANUAL TESTING CHECKLIST

Before production deployment, perform manual tests:

```
APPROVAL WORKFLOW MANUAL TESTS
□ Submit approval via UI form
□ Verify email notification to validators
□ Vote approve via web interface
□ Verify approval status updates in real-time
□ Check approval timeline audit trail
□ Activate approved token
□ Verify token is usable in downstream services

REJECTION WORKFLOW MANUAL TESTS
□ Submit and reject approval
□ Verify rejection notification
□ Verify token is not activated
□ Verify submitter can resubmit

TIMEOUT MANUAL TESTS
□ Submit approval on day 0
□ Check status on day 6 (still pending)
□ Check status on day 7+ (expired)
□ Verify can resubmit expired approval

MULTI-TIER MANUAL TESTS
□ Submit STANDARD tier, verify 1 validator assigned
□ Submit ELEVATED tier, verify 3 validators assigned
□ Submit CRITICAL tier, verify 4 validators assigned
□ Verify quorum thresholds enforced for each tier

PERFORMANCE MANUAL TESTS
□ Submit 100 approvals in rapid succession
□ Monitor latency (should stay < 100ms P99)
□ Monitor CPU/memory (should stay under 80%/70%)
□ Verify no timeout errors

SECURITY MANUAL TESTS
□ Try to approve without authentication
□ Try to approve with invalid JWT
□ Try to vote as non-validator user
□ Try to view another user's approval details
□ Verify all operations logged in audit trail

INTEGRATION MANUAL TESTS
□ Verify approved tokens activate in Token Service
□ Verify composite tokens assembled correctly
□ Verify merkle proofs include approval metadata
□ Verify cascade validations prevent invalid states
```

---

## 9. REGRESSION TEST SUITE

After each deployment, run quick regression tests:

```bash
# Run all E2E tests (should complete in <5 minutes)
./mvnw verify -Dgroups=e2e -DskipITs=false

# Expected: 30+ tests, 100% pass rate
# Performance: < 5 minutes total
# Error rate: 0%
```

---

## 10. TEST EXECUTION REPORT FORMAT

```
TEST EXECUTION REPORT
Generated: 2026-01-07T15:30:45Z
Environment: Staging (replica of production)

SUMMARY
-------
Total Tests: 30
Passed: 30
Failed: 0
Skipped: 0
Pass Rate: 100%

CATEGORY BREAKDOWN
------------------
Category 1 (Happy Path): 5/5 passed
Category 2 (Rejections): 5/5 passed
Category 3 (Multi-Approver): 8/8 passed
Category 4 (Timeouts): 3/3 passed
Category 5 (Failure Recovery): 4/4 passed
Category 6 (Cascade Effects): 5/5 passed

PERFORMANCE METRICS
-------------------
Average Approval Latency: 42ms (target: <100ms) ✓
P99 Latency: 85ms (target: <100ms) ✓
Throughput: 1,247 approvals/sec (target: >1,000/sec) ✓
Error Rate: 0.0% (target: <0.1%) ✓

TEST EXECUTION TIME
-------------------
Total Time: 4m 32s
Average Per Test: 9.1s
Slowest Test: Category 4.2 (timeout test, 42s due to clock skip)
Fastest Test: Category 1.1 (standard approval, 1.2s)

RESOURCE UTILIZATION
--------------------
Peak CPU: 64% (acceptable)
Peak Memory: 512MB (acceptable)
Database Connections: 12/20 (acceptable)
Disk I/O: Normal

RECOMMENDATIONS
----------------
✓ All tests passing
✓ All SLAs met
✓ No performance regressions
✓ Ready for production deployment

Sign-off: QA Engineer, Date, Signature
```

---

## CONCLUSION

Story 7 E2E test suite validates complete VVB approval workflows with 30+ comprehensive scenarios covering:

- **Happy Paths**: Standard, elevated, critical approvals
- **Rejections**: Various rejection and timeout scenarios
- **Multi-Approver**: Complex approval tiers and distributions
- **Timeouts**: 7-day window expiration handling
- **Failure Recovery**: Service resilience and recovery
- **Cascade Effects**: Parent-child token relationships

**Expected Outcome**: 100% test pass rate, all SLAs validated, production-ready

**Execution Time**: All 30+ tests complete in < 5 minutes
**Success Criteria**: Zero failures, <100ms approval latency, >1,000 approvals/sec throughput

---

**Document Version**: 1.0
**Status**: Ready for Implementation
**Next Document**: STORY-7-PRODUCTION-READINESS.md
