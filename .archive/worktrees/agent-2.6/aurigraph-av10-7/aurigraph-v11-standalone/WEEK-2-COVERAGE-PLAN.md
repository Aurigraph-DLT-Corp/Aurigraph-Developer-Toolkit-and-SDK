# Week 2 Coverage Expansion Plan
## EnterprisePortalService & SystemMonitoringService (33%/39% → 95%)

**Created**: October 12, 2025
**Status**: 🚧 IN PROGRESS
**Target**: Achieve 95% coverage for both services

---

## Progress Summary

### ✅ Completed (Week 1)
- EthereumBridgeService: 15% → 95% (58 tests, +28 new)
- CI/CD Pipeline: Configured with 95% enforcement
- JaCoCo Integration: Automated coverage reporting

### 🚧 In Progress (Week 2)
- EnterprisePortalService: 33% → 95% (target)
- SystemMonitoringService: 39% → 95% (target)

---

## EnterprisePortalService Analysis

### Current Coverage: 33%

### Coverage Gaps Identified:

#### 1. WebSocket Lifecycle (Not Covered)
```java
@OnOpen - onOpen(Session session)
@OnClose - onClose(Session session)
@OnMessage - onMessage(String message, Session session)
```

#### 2. Request Handling (Partially Covered)
- handleRequest() - switch statement paths
- getAnalytics() - Full analytics data retrieval
- getValidators() - Validator list retrieval
- getTransactions() - Transaction filtering
- getUsers() - User management access
- updateConfiguration() - Config updates

#### 3. Dashboard Metrics (Not Covered)
- getCurrentTPS()
- getTotalTransactions()
- getMemoryUsage()
- getCPUUsage()
- getTransactionsByHour()
- getValidatorList()

#### 4. User Management (Not Covered)
- authenticate()
- hasPermission() - RBAC logic
- User role checks (ADMIN, OPERATOR, VIEWER)

#### 5. Configuration Manager (Not Covered)
- updateConfig()
- getConfig()
- getAllConfigurations()

#### 6. Alert Manager (Not Covered)
- addAlert()
- getActiveAlerts()
- clearAlert()

### Test Strategy for 95% Coverage:

**Inner Class Testing** (can test without WebSocket mocking):
- ✅ DashboardMetrics: Unit tests for all metric methods
- ✅ UserManagement: Authentication and RBAC tests
- ✅ ConfigurationManager: Config CRUD tests
- ✅ AlertManager: Alert lifecycle tests

**WebSocket Integration** (mock Session):
- ✅ onOpen/onClose lifecycle
- ✅ onMessage request handling
- ✅ sendToSession/broadcastToAll

**Estimated Tests Needed**: 35-40 new comprehensive tests

---

## SystemMonitoringService Analysis

### Current Coverage: 39%

### Coverage Gaps Identified:

#### 1. Monitoring Lifecycle (Partially Covered)
- startMonitoring() - Scheduling all tasks
- stopMonitoring() - Task cancellation (FIXED in previous session)
- Concurrent start/stop scenarios

#### 2. Metrics Collection (Not Covered)
- collectMetrics() - All metric recording
- recordMetric() - Time series updates
- getMetricHistory() - Historical data

#### 3. Health Checks (Not Covered)
- performHealthChecks()
- HealthChecker.performChecks()
- Unhealthy scenario handling

#### 4. Alert Engine (Not Covered)
- checkAlerts()
- triggerAlert()
- Alert threshold evaluation
- Alert history tracking

#### 5. Performance Analysis (Not Covered)
- analyzePerformance()
- PerformanceMonitor methods
- Performance degradation detection

#### 6. Prometheus Metrics (Not Covered)
- getPrometheusMetrics()
- Metric export formatting
- Time series aggregation

### Test Strategy for 95% Coverage:

**Monitoring Lifecycle Tests**:
- ✅ Start monitoring and verify all scheduled tasks
- ✅ Stop monitoring and verify task cancellation
- ✅ Multiple start/stop cycles
- ✅ Concurrent start attempts

**Metrics Collection Tests**:
- ✅ collectMetrics() invocation
- ✅ All metric types recorded (system + app)
- ✅ Metric time series accumulation
- ✅ Metric retrieval by name/time range

**Health Check Tests**:
- ✅ Healthy state verification
- ✅ Unhealthy state detection
- ✅ Alert triggering on health failure
- ✅ Recovery detection

**Alert Engine Tests**:
- ✅ Alert creation with different levels
- ✅ Alert history tracking
- ✅ Alert threshold evaluation
- ✅ Alert clearing

**Performance Monitor Tests**:
- ✅ Performance baseline establishment
- ✅ Degradation detection
- ✅ Performance improvement tracking

**Estimated Tests Needed**: 30-35 new comprehensive tests

---

## Implementation Plan

### Phase 1: EnterprisePortalService (Day 1-2)

**Priority 1: Inner Classes** (easiest, high impact)
1. DashboardMetrics tests (10 tests)
   - All getter methods
   - Memory/CPU calculation
   - Validator list generation

2. UserManagement tests (8 tests)
   - authenticate() scenarios
   - hasPermission() RBAC logic
   - Admin/Operator/Viewer roles

3. ConfigurationManager tests (6 tests)
   - updateConfig() success/failure
   - getConfig() retrieval
   - getAllConfigurations()

4. AlertManager tests (6 tests)
   - addAlert() with different levels
   - getActiveAlerts()
   - clearAlert()

**Priority 2: Request Handling** (medium difficulty)
5. handleRequest() tests (10 tests)
   - All request types (analytics, validators, transactions, users, config)
   - Unknown request type handling
   - Error scenarios

**Priority 3: WebSocket** (if time permits)
6. Mock Session tests (5 tests)
   - onOpen/onClose
   - onMessage processing
   - broadcast scenarios

**Expected Coverage**: 33% → 95%+

### Phase 2: SystemMonitoringService (Day 2-3)

**Priority 1: Monitoring Lifecycle** (highest impact)
1. Lifecycle tests (8 tests)
   - startMonitoring() verification
   - stopMonitoring() verification
   - Multiple start/stop cycles
   - Concurrent scenarios

**Priority 2: Metrics Collection**
2. Metrics tests (10 tests)
   - collectMetrics() invocation
   - All metric types
   - Time series recording
   - Historical data retrieval

**Priority 3: Health & Alerts**
3. Health check tests (6 tests)
   - Healthy/unhealthy states
   - Alert triggering
   - Recovery detection

4. Alert engine tests (6 tests)
   - Alert creation/clearing
   - Threshold evaluation
   - Alert history

**Priority 4: Performance Monitoring**
5. Performance tests (5 tests)
   - Baseline establishment
   - Degradation detection
   - Performance trends

**Expected Coverage**: 39% → 95%+

---

## Success Criteria

### For EnterprisePortalService:
- ✅ Coverage: 33% → 95%+
- ✅ All inner classes have 95%+ coverage
- ✅ All request types tested
- ✅ RBAC logic fully verified
- ✅ Configuration management tested
- ✅ Alert management tested

### For SystemMonitoringService:
- ✅ Coverage: 39% → 95%+
- ✅ Lifecycle management thoroughly tested
- ✅ All metric collection paths covered
- ✅ Health checks verified
- ✅ Alert engine tested
- ✅ Performance monitoring validated

### Overall Week 2 Success:
- ✅ Both services at 95%+ coverage
- ✅ All tests passing (0 failures)
- ✅ CI/CD pipeline validates coverage
- ✅ Build fails if coverage < 95%

---

## Timeline

**Day 1** (Oct 12):
- ✅ EthereumBridgeService completed (Week 1)
- 🚧 EnterprisePortalService inner class tests (Priority 1)
- 🚧 EnterprisePortalService request handling tests (Priority 2)

**Day 2** (Oct 13):
- 📋 Complete EnterprisePortalService (Priority 3 if needed)
- 📋 SystemMonitoringService lifecycle tests (Priority 1)
- 📋 SystemMonitoringService metrics tests (Priority 2)

**Day 3** (Oct 14):
- 📋 SystemMonitoringService health/alerts (Priority 3)
- 📋 SystemMonitoringService performance (Priority 4)
- 📋 Coverage verification and commit

---

## Notes

- **WebSocket Testing**: May require more complex mocking, deprioritized
- **Inner Classes**: Can be tested directly without mocking - HIGH ROI
- **Lifecycle Management**: Critical for SystemMonitoringService reliability
- **CI/CD Integration**: Tests will run automatically on push

---

## Risks & Mitigations

### Risk 1: WebSocket Testing Complexity
**Mitigation**: Focus on inner classes first, WebSocket can be integration tested later

### Risk 2: Time Constraints
**Mitigation**: Prioritize inner classes and core methods, skip WebSocket if needed

### Risk 3: Test Execution Time
**Mitigation**: Run tests in parallel where possible, let CI/CD validate

---

**Status**: 🚧 IN PROGRESS
**Next**: Focus on EnterprisePortalService inner class tests

---

*Document Version: 1.0*
*Last Updated: October 12, 2025*
