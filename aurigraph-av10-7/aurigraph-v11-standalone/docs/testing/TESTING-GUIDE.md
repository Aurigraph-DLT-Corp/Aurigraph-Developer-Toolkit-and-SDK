# Testing Guide - Aurigraph DLT V11

**Comprehensive guide for running, writing, and debugging tests in Aurigraph DLT V11**

---

## Quick Start

### Run Unit Tests Only (Fast - ~30 seconds)

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test
```

### Run All Tests with Coverage (Full Suite - ~2 minutes)

```bash
./mvnw verify
```

### View Coverage Report

```bash
open target/site/jacoco/index.html
```

---

## Test Commands Reference

### Running Tests

| Command | Purpose | Speed | Output |
|---------|---------|-------|--------|
| `./mvnw test` | Unit tests only | ~30s | Summary + test results |
| `./mvnw verify` | All tests + coverage | ~2m | Full report with JaCoCo |
| `./mvnw test -Dtest=*GraphQL*` | Tests matching pattern | ~10s | Only matching tests |
| `./mvnw test -Dtest=ApprovalGraphQLAPITest` | Single test class | ~3s | One class output |
| `./mvnw test -Dtest=ApprovalGraphQLAPITest#testGetApproval_ValidId_ReturnsApprovalDTO` | Single test method | ~1s | One method output |
| `./mvnw test -DskipTests` | Skip all tests | ~20s | Build only |
| `./mvnw test -q` | Quiet mode (minimal output) | ~30s | Minimal output |
| `./mvnw test -X` | Debug mode (verbose) | ~30s | Detailed debug info |

### Integration Tests

```bash
# Run only integration tests (slow - ~5 minutes)
./mvnw verify -DskipUnitTests

# Run integration tests for specific class
./mvnw verify -Dtest=*IntegrationTest -DskipUnitTests

# Run with live database (Testcontainers)
./mvnw verify -DskipUnitTests -Dgroups=integration
```

### Performance Tests

```bash
# Run performance/benchmark tests
./mvnw test -Dtest=*Performance*,*Benchmark*

# Run with JMH benchmarks
./mvnw test -Dtest=*Benchmark

# Run full benchmark suite (10+ minutes)
./mvnw verify -Pbenchmark
```

### Coverage Reports

```bash
# Generate coverage report only (no tests)
./mvnw jacoco:report

# Generate with exclusions
./mvnw verify -DskipUnitTests -Djacoco.skip=false

# View coverage in browser
open target/site/jacoco/index.html
open target/site/jacoco-it/index.html  # Integration test coverage
```

### Continuous Testing (Watch Mode)

```bash
# Auto-rerun tests on file changes (requires FSNotifier)
./mvnw test -Dwatch

# Or in IDE:
# IntelliJ: Ctrl+Shift+F10 (Run tests with coverage)
# VS Code: CodeLens "Run Test" above each @Test method
```

---

## Writing New Tests

### 1. Understand Test Types

**Unit Tests** (~70% of all tests)
- Test isolated components with mocked dependencies
- Fast: <10ms per test
- Location: `src/test/java/io/aurigraph/v11/**/*Test.java`

**Integration Tests** (~20% of all tests)
- Test component interactions with real database/Kafka/Redis
- Slower: 100ms - 5s per test
- Location: `src/test/java/io/aurigraph/v11/**/*IntegrationTest.java`
- Extend `AbstractIntegrationTest`

**Performance Tests** (~3% of all tests)
- Measure TPS, latency, throughput
- Slower: 10s - 60s per test
- Location: `src/test/java/io/aurigraph/v11/**/*PerformanceTest.java`

### 2. Use Test Templates

All templates are available in `docs/testing/TEST-TEMPLATES.md`:

**Unit Test Template**
```java
@QuarkusTest
@DisplayName("ApprovalGraphQLAPI - GraphQL Query Tests")
class ApprovalGraphQLAPITest {

    @InjectMock
    VVBApprovalService approvalService;

    @Inject
    ApprovalGraphQLAPI graphQLAPI;

    @Test
    @DisplayName("Query: getApproval returns approval for valid ID")
    void testGetApproval_ValidId_ReturnsApprovalDTO() {
        // Arrange: Set up test data
        UUID approvalId = UUID.randomUUID();
        when(approvalService.getApprovalById(approvalId))
            .thenReturn(Uni.createFrom().item(testApproval));

        // Act: Execute the operation
        ApprovalDTO result = graphQLAPI
            .getApproval(approvalId.toString())
            .await().indefinitely();

        // Assert: Verify results
        assertThat(result).isNotNull();
        verify(approvalService).getApprovalById(approvalId);
    }
}
```

**Integration Test Template**
```java
@QuarkusTest
class ApprovalDatabaseIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("Integration: Create approval persists to database")
    void testCreateApproval_SavesToDatabaseAndRetrievable() {
        // Arrange: Create request
        ApprovalRequest request = new ApprovalRequest(...);

        // Act: POST to API
        String approvalId = given(spec)
            .body(request)
            .post("/api/v11/approvals")
            .then()
            .statusCode(201)
            .extract()
            .path("id");

        // Assert: Verify in database
        given(spec)
            .get("/api/v11/approvals/" + approvalId)
            .then()
            .statusCode(200)
            .body("status", equalTo("PENDING"));
    }
}
```

### 3. Use Test Data Builders

Instead of complex constructor calls, use fluent builders:

```java
// BAD: Hard to read constructor
VVBApprovalRequest approval = new VVBApprovalRequest(
    UUID.randomUUID(),
    UUID.randomUUID(),
    ApprovalStatus.PENDING,
    List.of("v1", "v2", "v3"),
    66.67,
    LocalDateTime.now(),
    null
);

// GOOD: Fluent builder, self-documenting
VVBApprovalRequest approval = new ApprovalRequestTestBuilder()
    .approved()
    .withValidators("validator-1", "validator-2", "validator-3")
    .build();
```

Available builders in `src/test/java/io/aurigraph/v11/testing/builders/`:
- `ApprovalRequestTestBuilder` - VVB approval objects
- `ValidatorVoteTestBuilder` - Validator vote objects
- Add more as needed!

### 4. Name Tests Clearly

Use the pattern: `testSubject_Condition_ExpectedResult()`

```java
// GOOD
void testGetApproval_ValidId_ReturnsApprovalDTO()
void testSubmitVote_ValidVote_UpdatesVotingRecord()
void testByzantineConsensus_MoreThanTwoThirdsApprove_ConsensusReached()

// BAD
void testApproval()
void testVote()
void testConsensus()
```

### 5. Test Async/Reactive Code

**For Uni<T> (single value)**
```java
@Test
void testUniBlocking() {
    Uni<String> result = service.fetchData();
    String value = result.await().indefinitely();
    assertThat(value).isEqualTo("expected");
}
```

**For Multi<T> (stream)**
```java
@Test
void testMultiStream() throws InterruptedException {
    Multi<String> stream = service.streamData();
    CountDownLatch latch = new CountDownLatch(3);
    List<String> items = new CopyOnWriteArrayList<>();
    
    stream.subscribe().with(
        item -> {
            items.add(item);
            latch.countDown();
        }
    );
    
    assertTrue(latch.await(5, TimeUnit.SECONDS));
    assertThat(items).hasSize(3);
}
```

**For GraphQL Subscriptions**
```java
@Test
void testGraphQLSubscription() throws InterruptedException {
    Multi<ApprovalEventDTO> subscription = 
        graphQLAPI.approvalStatusChanged("approval-1");
    
    AtomicReference<ApprovalEventDTO> event = new AtomicReference<>();
    CountDownLatch received = new CountDownLatch(1);
    
    subscription.subscribe().with(e -> {
        event.set(e);
        received.countDown();
    });
    
    // Emit event
    subscriptionManager.broadcastApprovalStatusChange(
        "approval-1", 
        ApprovalStatus.APPROVED
    );
    
    assertTrue(received.await(5, TimeUnit.SECONDS));
    assertThat(event.get()).isNotNull();
}
```

### 6. Mocking Strategy

**When to Mock** (Unit Tests):
- External service calls (HTTP, gRPC)
- Database queries (use `@InjectMock`)
- Message queues (Kafka)
- Cache operations (Redis)

**When NOT to Mock** (Integration Tests):
- Database operations (use real PostgreSQL)
- Message brokers (use real Kafka)
- Cache (use real Redis)

```java
@QuarkusTest
class ApprovalServiceTest {

    @InjectMock
    VVBApprovalRegistry approvalRegistry;  // Mock database

    @InjectMock
    ApprovalWebhookService webhookService;  // Mock external service

    @Inject
    VVBApprovalService service;  // Real service under test

    @Test
    void testSubmitVote() {
        // Setup mocks
        when(approvalRegistry.findByRequestId(approvalId))
            .thenReturn(Uni.createFrom().item(mockApproval));
        
        doNothing().when(webhookService)
            .deliverWebhook(any(), any());

        // Test
        service.submitVote(approvalId, vote).await().indefinitely();

        // Verify interactions
        verify(approvalRegistry).findByRequestId(approvalId);
        verify(webhookService).deliverWebhook(any(), any());
    }
}
```

---

## Understanding Coverage Reports

### View Coverage Reports

```bash
# After running tests
./mvnw verify

# Open the report
open target/site/jacoco/index.html
```

### Interpret the Report

**Coverage Metrics**:
- **Line Coverage**: Percentage of source code lines executed
  - Green: >95% (excellent)
  - Yellow: 80-95% (good)
  - Red: <80% (needs improvement)

- **Branch Coverage**: Percentage of if/else branches tested
  - Green: >90% (excellent)
  - Yellow: 70-90% (good)
  - Red: <70% (needs improvement)

### Navigate the Report

1. **Summary Page**: Overall project coverage
   - Click package names to drill down
   
2. **Package Level**: Coverage per package
   - `io.aurigraph.v11.token.secondary` - GraphQL APIs
   - `io.aurigraph.v11.consensus` - Consensus algorithm
   - `io.aurigraph.v11.crypto` - Cryptographic operations

3. **Class Level**: Coverage per class
   - Red lines = Not covered (needs test)
   - Green lines = Covered
   - Yellow lines = Partially covered (some branches not tested)

### Coverage by Component

| Component | Target | Priority | Status |
|-----------|--------|----------|--------|
| GraphQL APIs | 95% | P1 | In Progress |
| VVB Approval | 95% | P1 | In Progress |
| Consensus | 95% | P2 | Pending |
| Cryptography | 98% | P1 | Pending |
| Utilities | 80% | P3 | Pending |

---

## Common Test Failures & Troubleshooting

### Issue: Test Timeout (>30 seconds)

**Cause**: Long-running integration test or deadlock

**Solution**:
```java
// Add timeout annotation
@Test
@Timeout(10)  // Timeout after 10 seconds
void testWithTimeout() {
    // Test code
}

// Or increase default timeout
./mvnw test -Dsurefire.timeout=300
```

### Issue: "Mocked object returned null"

**Cause**: Mock not properly configured

**Solution**:
```java
// WRONG: Mock not returning value
when(mockService.getData()).thenReturn(null);

// CORRECT: Return reactive value
when(mockService.getData())
    .thenReturn(Uni.createFrom().item(testData));

// CORRECT: Return empty for void methods
doNothing().when(mockService).doSomething();
```

### Issue: "Port Already in Use" (Port 9003)

**Cause**: Previous test process didn't clean up

**Solution**:
```bash
# Find process on port 9003
lsof -i :9003

# Kill process
kill -9 <PID>

# Or kill all Java processes
killall java

# Try again
./mvnw test
```

### Issue: "Database Connection Refused"

**Cause**: Testcontainers PostgreSQL not running

**Solution**:
```bash
# Ensure Docker is running
docker ps

# Clean Docker containers
docker-compose down -v

# Check Docker logs
docker logs $(docker ps -q)

# Try again
./mvnw verify
```

### Issue: "Test passes locally, fails in CI"

**Cause**: Environment differences (timezone, locale, paths)

**Solution**:
```java
// Use UTC for all timestamps
LocalDateTime now = LocalDateTime.now(ZoneId.of("UTC"));

// Use System.getProperty instead of hard-coded paths
String tmpDir = System.getProperty("java.io.tmpdir");

// Don't assume locale
String formatted = String.format(Locale.ROOT, "Value: %d", 123);

// Use cross-platform file paths
Path file = Paths.get("src", "test", "resources", "data.json");
```

### Issue: "Module not found in test context"

**Cause**: Test dependency not in pom.xml

**Solution**:
```bash
# Check if dependency is marked as test scope
./mvnw dependency:tree | grep -A5 "testScope"

# Add to pom.xml
<dependency>
    <groupId>org.example</groupId>
    <artifactId>needed-library</artifactId>
    <version>1.0</version>
    <scope>test</scope>
</dependency>
```

### Issue: "Assertion Failed: expected <X> but was <null>"

**Cause**: Test assertion too strict or missing setup

**Solution**:
```java
// Use specific assertions
assertThat(result).isNotNull();  // Check not null first
assertThat(result).hasSize(3);
assertThat(result).contains("expected");

// Check mock was called
verify(mockService, times(1)).getData();
verify(mockService, never()).deleteData();
```

---

## Test Execution Checklist

Before committing tests:

- [ ] Test name clearly describes what is being tested
- [ ] Test runs independently (no shared state with other tests)
- [ ] Unit tests run in <10ms, integration tests in <5s
- [ ] All dependencies are mocked (unit) or real (integration)
- [ ] Test covers main success path
- [ ] Test covers at least 2 error/edge cases
- [ ] Assertions are specific (not generic)
- [ ] No hardcoded sensitive data or credentials
- [ ] Test uses builders for complex objects
- [ ] Test follows Arrange-Act-Assert pattern

---

## CI/CD Integration

### Pre-commit Hook

```bash
# Install pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run fast unit tests before committing
./mvnw test -q -DskipITs

if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Fix before committing."
  exit 1
fi

echo "✅ Pre-commit tests passed."
EOF

chmod +x .git/hooks/pre-commit
```

### GitHub Actions (CI/CD Pipeline)

Coverage gates are automatically enforced:

1. **Unit Tests**: Must pass
2. **Integration Tests**: Must pass
3. **Coverage**: Must reach 95% line, 90% branch
4. **Performance**: Regression <5%

See `.github/workflows/test-quality-gates.yml` for full CI configuration.

---

## Performance Testing

### Measure TPS (Transactions Per Second)

```bash
# Run benchmark suite
./mvnw test -Dtest=*PerformanceTest

# Results in: target/benchmark-results.json
```

### Interpret Results

```json
{
  "approvalSubmissionThroughput": {
    "mode": "Throughput",
    "score": 1250.5,
    "unit": "ops/s",
    "p50": 0.8,
    "p95": 2.1,
    "p99": 3.5
  }
}
```

- **score**: Throughput in operations/second
- **p50**: 50th percentile latency (median)
- **p95**: 95th percentile latency (most requests faster)
- **p99**: 99th percentile latency (worst case)

**Targets**:
- Approval submission: >1,000 TPS (p99 <100ms)
- Consensus check: >2,000 TPS (p99 <50ms)
- Vote processing: >5,000 TPS (p99 <20ms)

---

## Test Coverage Trends

Track coverage over time:

```bash
# Weekly coverage reports
./mvnw verify
cp target/jacoco-report/jacoco.csv docs/testing/coverage-weekly-$(date +%Y-%m-%d).csv

# Compare with previous week
diff docs/testing/coverage-weekly-2025-12-19.csv \
     docs/testing/coverage-weekly-2025-12-26.csv
```

**Goals**:
- Week 1: 50% coverage (P1-2 components)
- Week 2: 75% coverage (P1-4 components)
- Week 3: 95% coverage (all components)

---

## Advanced Topics

### Mutation Testing (PIT - Pitest)

Detect weak tests by mutating source code:

```bash
./mvnw org.pitest:pitest-maven:mutationCoverage

# View results
open target/pit-reports/index.html
```

**Target**: >80% mutations killed (tests are effective)

### Property-Based Testing (QuickTheories)

Generate random test data automatically:

```java
@Test
void testApprovalWithRandomData() {
    qt()
        .forAll(integers().allPositive())
        .asProperty()
        .check(validatorCount -> {
            // Test with random validatorCount
            VVBApprovalRequest approval = 
                new ApprovalRequestTestBuilder()
                    .withValidators(validatorCount)
                    .build();
            
            assertThat(approval.getValidators()).hasSize(validatorCount);
        });
}
```

### Contract Testing (Pact)

Ensure API contracts between services:

```bash
# Generate contract tests
./mvnw test -Dtest=*ContractTest

# View pacts (consumer-provider contracts)
ls target/pacts/
```

---

## Quick Reference Commands

```bash
# Unit tests only (30s)
./mvnw test

# All tests with coverage (2m)
./mvnw verify

# Specific test pattern (10s)
./mvnw test -Dtest=*GraphQL*

# Single test method (1s)
./mvnw test -Dtest=ApprovalServiceTest#testSubmitVote_ValidVote_UpdatesVotingRecord

# Performance benchmarks (5m)
./mvnw test -Dtest=*Benchmark

# View coverage report
open target/site/jacoco/index.html

# Clean and rebuild
./mvnw clean test

# Quiet mode
./mvnw test -q

# Debug mode
./mvnw test -X

# Skip tests (build only)
./mvnw package -DskipTests

# Run integration tests only
./mvnw verify -DskipUnitTests

# Mutation testing
./mvnw org.pitest:pitest-maven:mutationCoverage
```

---

## Support & Resources

- **TDD Strategy**: `docs/testing/TDD-STRATEGY.md`
- **Test Templates**: `docs/testing/TEST-TEMPLATES.md`
- **Coverage Metrics**: `docs/testing/COVERAGE-REPORT.md`
- **Quarkus Testing**: https://quarkus.io/guides/getting-started-testing
- **JUnit 5**: https://junit.org/junit5/docs/current/user-guide/
- **AssertJ**: https://assertj.github.io/assertj-core-features-highlight.html
- **Mockito**: https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html

---

**Last Updated**: December 26, 2025  
**Status**: Active and maintained  
**Audience**: Aurigraph DLT V11 development team
