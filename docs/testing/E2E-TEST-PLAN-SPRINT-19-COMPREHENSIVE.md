# End-to-End (E2E) Test Plan - Sprint 19 & Beyond

**Version**: 2.0  
**Date**: November 2025  
**Coverage**: REST-to-gRPC Gateway, Traffic Migration, Data Sync, Feature Parity

---

## 1. Test Scope

### 1.1 In Scope

✅ **REST-to-gRPC Gateway**:
- All 50+ REST endpoints through gateway
- Protocol conversion (REST JSON ↔ gRPC Protobuf)
- Request/response marshalling fidelity
- Error handling and status codes
- Authentication and authorization
- Rate limiting and circuit breaker

✅ **Traffic Migration**:
- V10/V11 traffic splitting (1% → 100%)
- Health check-based rollback
- No request loss during weight changes
- Metrics accuracy and dashboard updates
- Error rate comparison between versions

✅ **Data Synchronization**:
- V10↔V11 transaction sync
- Consensus state replication
- Conflict detection and resolution
- Consistency validation (99.99% SLA)

✅ **Feature Parity**:
- WebSocket subscriptions (real-time)
- Smart contract execution
- RWA registry with oracle data

### 1.2 Out of Scope

❌ Performance benchmarking (Sprint 21)  
❌ Multi-cloud deployment (Sprint 22)  
❌ Load testing >100K TPS (separate load test suite)  
❌ Chaos engineering for infrastructure (separate chaos suite)

---

## 2. Test Strategy

### 2.1 Test Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  (50 tests, 10% of suite)
        │  User journeys  │  ~30-45 minutes
        ├─────────────────┤
        │ Integration     │  (150 tests, 30% of suite)
        │  API contracts  │  ~45-60 minutes
        ├─────────────────┤
        │ Unit Tests      │  (300 tests, 60% of suite)
        │  Code logic     │  ~15-20 minutes
        └─────────────────┘
```

**Total Test Coverage**: 500+ test cases  
**Execution Time**: ~2-3 hours (parallel execution)  
**Coverage Target**: 95% code coverage

### 2.2 Test Execution Environments

**Local Development** (Developer machines):
- H2 in-memory database
- Mock gRPC services
- ~50 second execution

**CI/CD Pipeline** (GitHub Actions):
- Docker Compose with PostgreSQL, Redis, Kafka
- Full integration test suite
- ~5-10 minute execution

**Staging Environment** (Pre-production):
- AWS EC2 instances
- Production-like infrastructure
- ~30-45 minute execution
- Monthly execution before production releases

---

## 3. Detailed Test Cases

### 3.1 REST-to-gRPC Gateway Tests

#### Test Suite 1: Protocol Conversion (40 tests)

**TC-1.1**: Transaction submission via REST gateway
```gherkin
Given REST client connected to /api/v11/transactions
When client submits {"tx_id": "tx-123", "payload": "...", "gas_price": 1000}
Then response status: 200
And response body matches V10 API format exactly
And gRPC backend receives equivalent SubmitTransactionRequest
And transaction visible in PostgreSQL within 100ms
```

**TC-1.2**: Consensus voting endpoint conversion
```gherkin
Given V11 gRPC VotingService running
And REST gateway configured for consensus endpoints
When REST client calls GET /api/v11/consensus/voting/{voting_round_id}
Then response includes {"voting_round_id": "...", "votes": [...], "status": "..."}
And all 4 nodes' votes included in response
And response matches V10 API format
```

**TC-1.3**: Error code translation
```gherkin
When gRPC service returns INVALID_ARGUMENT (status code 3)
Then REST gateway translates to HTTP 400
And response body includes original gRPC error message
And error codes consistent with V10 API
```

#### Test Suite 2: Marshalling & Data Fidelity (30 tests)

**TC-2.1**: JSON to Protobuf conversion
```gherkin
Given JSON request: {"transaction_id": "tx-abc", "gas_price": 5000, "priority": "HIGH"}
When gateway converts to Protobuf message
Then Protobuf fields match JSON 100%
And numeric types preserved (gas_price: int64)
And enum values correct (priority: enum)
```

**TC-2.2**: Nested object marshalling
```gherkin
Given JSON with nested: {"asset": {"id": "...", "value": {...}}}
When gateway processes nested structures
Then all fields preserved in Protobuf
And nested types handled correctly
```

### 3.2 Traffic Migration & Canary Tests

#### Test Suite 3: Weight Adjustment (25 tests)

**TC-3.1**: Dynamic traffic split without restart
```gherkin
Given NGINX running with V10 upstream pool
When operator updates NGINX config to 5% V11 traffic
And NGINX reloads without restart (inotify triggers)
Then approximately 5% of requests go to V11 nodes
And 95% go to V10 nodes (±2% tolerance)
And no requests are dropped during reload
```

**TC-3.2**: Progressive weight increase
```gherkin
When operator increases V11 weight: 1% → 5% → 10% → 50% → 100%
And each increase waits 1 hour
Then metrics show smooth transition
And error rates remain stable (<0.1%)
And response times consistent with baseline
```

#### Test Suite 4: Automatic Rollback (20 tests)

**TC-4.1**: Error rate-based rollback
```gherkin
Given V11 weight at 10%
When V11 nodes start returning 500 errors (network partition simulated)
And error rate exceeds 5% threshold
Then AlertManager triggers rollback script
And NGINX weight automatically drops to 0% V11
And all traffic returns to V10
And alert sent to on-call team
```

**TC-4.2**: Health check failure triggers rollback
```gherkin
Given V11 weight at 25%
When V11 node health check fails (503 Service Unavailable)
And multiple failed health checks detected
Then NGINX marks V11 upstream as "down"
And traffic weight automatically shifts to V10
And metrics show graceful degradation
```

### 3.3 Data Synchronization Tests

#### Test Suite 5: Transaction Sync (35 tests)

**TC-5.1**: Transaction replicated from V10 to V11 within SLA
```gherkin
Given transaction submitted to V10
When transaction committed in V10
Then transaction appears in V11 PostgreSQL within 5 seconds
And all fields (id, payload, gas_price, status) match exactly
And transaction can be queried via V11 API
```

**TC-5.2**: Consensus state replication
```gherkin
Given V10 voting round completes with 4 validators
When voting results finalized in V10
Then voting records replicated to V11 within 2 seconds
And all voter signatures verified in V11
And consensus state consistent between systems
```

#### Test Suite 6: Conflict Resolution (25 tests)

**TC-6.1**: Detect conflicting transaction statuses
```gherkin
Given transaction status "PENDING" in V10
When simultaneous status update "CONFIRMED" attempted in V11
Then conflict detection identifies divergence
And automated resolution applies (V10-primary or V11-primary per strategy)
And resolution logged for audit trail
And systems converge to same state within 10 seconds
```

**TC-6.2**: Resolve concurrent asset registry updates
```gherkin
Given asset in V10 with value $1000
And same asset in V11 with value $1050 (oracle update)
Then conflict detection identifies discrepancy
And resolution uses timestamp or strategy rule
And final state is consistent across both systems
```

#### Test Suite 7: Consistency Validation (20 tests)

**TC-7.1**: Daily reconciliation passes
```gherkin
When reconciliation script runs
Then all 100M+ transactions match between V10 and V11
And all consensus records consistent
And asset registry reconciliation >99.99%
And report generated with pass/fail per entity type
```

---

## 4. Load & Performance Tests

### 4.1 Gateway Performance (Sprint 19)

**Test: REST-to-gRPC Latency Overhead**
```
Setup:
  - 1000 concurrent REST clients
  - Direct gRPC baseline: 5ms p99 latency
  - Through gateway: <5.25ms p99 latency (5% overhead limit)

Acceptance Criteria:
  ✅ Overhead <5% (5.25ms)
  ✅ No timeouts
  ✅ No errors
  ✅ Consistent performance over 10 minute test
```

**Test: Traffic Split Load Distribution**
```
Setup:
  - 50K concurrent requests
  - V10 weight: 50%, V11 weight: 50%
  - Measure distribution

Acceptance Criteria:
  ✅ V10 receives 50% ±5% of requests
  ✅ V11 receives 50% ±5% of requests
  ✅ No request queueing
  ✅ Latency consistent for both pools
```

### 4.2 Data Sync Performance (Sprint 19)

**Test: Sync Throughput**
```
Setup:
  - 10K transactions/sec generated
  - Measure time to appear in V11

Acceptance Criteria:
  ✅ 99% of transactions synced within 5 seconds
  ✅ 99.9% within 10 seconds
  ✅ No data loss
  ✅ Consistent latency (no spikes)
```

---

## 5. Failure & Edge Case Tests

### 5.1 Network Failures

**TC-F1**: Network partition between V10 and gateway
```gherkin
Given gateway connected to V10 backend
When network partition created (iptables rule)
Then requests fail with 503 Service Unavailable
And circuit breaker activates after 5 consecutive failures
And automatic retry kicks in after 100ms
```

**TC-F2**: V11 node down during traffic migration
```gherkin
Given 10% traffic routed to V11
When V11 node crashes
Then health check detects within 10 seconds
And traffic automatically shifts to remaining V11 nodes
And if all V11 nodes down, fallback to V10
```

### 5.2 Data Consistency Edge Cases

**TC-F3**: Transaction committed in V10 but not yet in V11
```gherkin
Given transaction confirmed in V10
And sync pipeline processing delay
When client queries both systems immediately
Then V10 shows committed, V11 shows pending (eventual consistency)
And within 5 seconds, both show same status
```

**TC-F4**: Consensus split (Byzantine scenario)
```gherkin
Given 10-node cluster with 2 Byzantine nodes
When Byzantine nodes attempt different voting
Then system detects Byzantine behavior
And consensus still finalizes (8/10 quorum > 2/3)
And Byzantine nodes isolated
```

---

## 6. User Journey Tests

### 6.1 Complete V10 Client Workflow

**Journey: V10 Client submits transaction through REST gateway**
```
1. Client auth: POST /api/v11/auth with credentials → JWT token
2. Submit tx: POST /api/v11/transactions with JWT → tx_id
3. Poll status: GET /api/v11/transactions/{tx_id} → status: PENDING
4. Wait for consensus: Poll every 100ms
5. Finality: GET returns status: FINALIZED within 500ms
6. Verify: Transaction visible in ledger
7. Cleanup: DELETE /api/v11/transactions/{tx_id} (optional)
```

**Success Criteria**:
- ✅ All steps complete within 1 second
- ✅ No errors or exceptions
- ✅ JWT token valid and not expired
- ✅ Transaction appears in both V10 and V11 systems

### 6.2 Canary Migration Workflow

```
1. Day 1: 1% traffic to V11
   - Monitor error rate <0.1%
   - Monitor latency p99 <500ms
   - Review logs for anomalies

2. Day 2: 5% traffic to V11
   - Repeat monitoring
   - Verify data consistency reconciliation

3. Day 3-4: 10% traffic
   - Load distribution validated
   - Performance metrics stable

4. Day 5-6: 25% traffic
   - Extended monitoring period
   - Prepare for higher loads

5. Day 7-9: 50% traffic
   - Both systems equally burdened
   - Full validation suite runs

6. Day 10+: 100% traffic
   - V10 becomes fallback
   - Preparation for V10 decommissioning
```

---

## 7. Test Execution Plan

### 7.1 Weekly Test Runs (Development)

**Monday**:
- Unit tests (300 tests) - 20 minutes
- Integration tests (150 tests) - 45 minutes
- E2E smoke tests (20 critical journeys) - 30 minutes

**Wednesday**:
- Full regression suite (all 500 tests) - 2 hours
- Performance benchmarks - 30 minutes

**Friday**:
- Data consistency tests - 45 minutes
- Security tests (input validation, auth) - 30 minutes

### 7.2 Pre-Release Test Cycle (Staging)

**Day 1**: Full E2E test suite (2-3 hours)  
**Day 2**: Load tests and performance validation (1-2 hours)  
**Day 3**: Chaos engineering tests (1 hour)  
**Day 4**: Final regression and sign-off  

### 7.3 Production Release Process

**Day 0 (Go/No-Go)**:
- All tests pass
- Staging environment mirrors production
- Rollback procedures tested
- Team on-call verified

**Release Day**:
- Canary deployment: 1% traffic
- Continuous monitoring: 2 hours
- If all metrics OK → 5% traffic
- Continue escalation based on 24-hour gates

---

## 8. Test Automation & Tools

**Framework**: JUnit 5 + REST Assured + Testcontainers  
**CI/CD**: GitHub Actions with automated test runs  
**Reporting**: JUnit XML → Dashboard with failure analytics  
**Coverage**: JaCoCo code coverage (target >95%)

```yaml
# GitHub Actions Workflow
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '21'
      - run: mvn test -DfailIfNoTests=false
      - uses: codecov/codecov-action@v3
```

---

## 9. Known Limitations & Risks

**Limitation 1**: Data sync latency 5 seconds (eventual consistency)
- Mitigation: Monitor sync queue depth, alert if >1000 entries

**Limitation 2**: REST gateway overhead 5% (vs direct gRPC)
- Mitigation: Use gRPC directly for performance-critical paths

**Limitation 3**: Canary migration takes 10+ days
- Mitigation: Speed up to 5 days if metrics consistently pass thresholds

**Risk 1**: Byzantine node detection false positives
- Mitigation: Require 3+ suspicious indicators before isolation

**Risk 2**: Consensus failure during traffic split
- Mitigation: Automatic failback to 100% V10 if quorum lost

---

## 10. Success Criteria

✅ **All test cases pass** (500+ tests)  
✅ **Code coverage ≥95%**  
✅ **No data loss** (consistency SLA met)  
✅ **Performance overhead <5%**  
✅ **Automated rollback working** (tested 5+ times)  
✅ **Production readiness confirmed**  

---

**Test Plan Version**: 2.0  
**Status**: APPROVED  
**Next Review**: Post-Sprint 19 (2025-12-21)
