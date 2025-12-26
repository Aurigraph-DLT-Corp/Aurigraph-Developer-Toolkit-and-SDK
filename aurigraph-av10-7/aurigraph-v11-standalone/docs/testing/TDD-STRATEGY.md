# Test-Driven Development Strategy for Aurigraph DLT V11

## Executive Summary

This document defines the comprehensive Test-Driven Development (TDD) strategy for Aurigraph DLT V11, a high-performance blockchain platform targeting 2M+ TPS with quantum-resistant cryptography. The strategy addresses the current test coverage gap (33 test files for 789 source files, 4.2% coverage) and provides a phased approach to achieving 95% coverage over 3 weeks.

**Current Status (December 26, 2025)**:
- Build: ✅ SUCCESS (0 compilation errors)
- Existing Tests: 33 test files
- Target Coverage: 95% line, 90% branch (JaCoCo enforced)
- Priority 1-2 Target: 80%+ coverage for GraphQL APIs and VVB workflow

---

## 1. TDD Principles for Quarkus/Reactive Architecture

### 1.1 Red-Green-Refactor Cycle (Adapted for Reactive)

The traditional TDD cycle requires adaptation for Quarkus and reactive streams:

**PHASE 1: RED** - Write Failing Reactive Test
```java
@Test
@DisplayName("GraphQL Query: get approval by ID")
void testGetApprovalById_ReturnsApprovalDTO() {
    // GIVEN: Approval exists in registry
    UUID approvalId = UUID.randomUUID();
    VVBApprovalRequest mockApproval = createTestApproval(approvalId);

    when(approvalRegistry.findByRequestId(approvalId))
        .thenReturn(Uni.createFrom().item(mockApproval));

    // WHEN: Execute GraphQL query (reactive)
    Uni<ApprovalDTO> result = approvalGraphQLAPI.getApproval(approvalId.toString());

    // THEN: Reactive assertion
    result.await().indefinitely() // Block until result ready
        .assertThat()
        .isNotNull()
        .extracting(ApprovalDTO::getId)
        .isEqualTo(approvalId.toString());
}
// TEST FAILS: ApprovalGraphQLAPI not yet implemented
```

**PHASE 2: GREEN** - Implement Minimal Reactive Code
```java
@Query("approval")
public Uni<ApprovalDTO> getApproval(@Name("id") String approvalId) {
    // Minimal implementation to make test pass
    return Uni.createFrom().item(() -> {
        VVBApprovalRequest approval = approvalRegistry.findByRequestId(UUID.fromString(approvalId));
        if (approval == null) {
            throw new IllegalArgumentException("Approval not found: " + approvalId);
        }
        return new ApprovalDTO(approval);
    });
}
// TEST PASSES
```

**PHASE 3: REFACTOR** - Optimize for Performance & Maintainability
```java
@Query("approval")
public Uni<ApprovalDTO> getApproval(@Name("id") String approvalId) {
    // Optimized: Better error handling, logging, performance
    Log.infof("GraphQL Query: get approval %s", approvalId);
    return Uni.createFrom().item(() -> {
        UUID id = UUID.fromString(approvalId);
        VVBApprovalRequest approval = approvalRegistry.findByRequestId(id);
        if (approval == null) {
            throw new WebApplicationException("Approval not found", Response.Status.NOT_FOUND);
        }
        return new ApprovalDTO(approval);
    })
    .onFailure().invoke(e -> Log.errorf("Failed to get approval: %s", e.getMessage()));
}
// TEST STILL PASSES, code improved
```

### 1.2 When to Write Tests First vs. After

**✅ WRITE TESTS FIRST (TDD)** - For these scenarios:
- New public APIs (REST, GraphQL, gRPC)
- Bug fixes (prevent regressions)
- Complex business logic (consensus, crypto, state machines)
- Security-sensitive code
- Critical path workflows

**✅ WRITE TESTS AFTER (Characterization)** - For these scenarios:
- Legacy code migrations (V10 → V11)
- Exploratory code/spikes
- Performance optimizations (baseline then optimize)
- Auto-generated code

**❌ NEVER SKIP TESTS** - For these components:
- Public API endpoints (100% test coverage required)
- Approval workflow (critical for blockchain correctness)
- Consensus algorithm (Byzantine FT requires exhaustive testing)
- Cryptographic operations (security-critical)

---

## 2. Test Categorization & Test Pyramid

Aurigraph V11 follows a **70/20/5/3/2 split** for test distribution:

### 2.1 Unit Tests (70% of all tests)

**Purpose**: Test individual components in isolation
**Speed**: <10ms per test
**Dependencies**: All mocked with Mockito
**Database**: In-memory H2 or completely mocked
**Pattern**: Given-When-Then with clean assertions

**Example**: Test ApprovalDTO field mapping
```java
@QuarkusTest
class ApprovalDTOTest {

    @Test
    @DisplayName("ApprovalDTO - should map all fields from VVBApprovalRequest")
    void testFieldMapping() {
        // GIVEN: VVBApprovalRequest with all fields
        VVBApprovalRequest request = new VVBApprovalRequest();
        request.requestId = UUID.randomUUID();
        request.status = ApprovalStatus.PENDING;
        request.totalValidators = 5;
        request.createdAt = LocalDateTime.now();

        // WHEN: Convert to DTO
        ApprovalDTO dto = new ApprovalDTO(request);

        // THEN: All fields mapped correctly
        assertThat(dto)
            .isNotNull()
            .hasFieldOrPropertyWithValue("id", request.requestId.toString())
            .hasFieldOrPropertyWithValue("status", ApprovalStatus.PENDING)
            .hasFieldOrPropertyWithValue("totalValidators", 5);
    }
}
```

### 2.2 Integration Tests (20% of all tests)

**Purpose**: Test component interactions with real infrastructure
**Speed**: 100ms - 5 seconds per test
**Dependencies**: Real PostgreSQL, Kafka, Redis (Testcontainers)
**Pattern**: End-to-end workflow testing

**Example**: Test approval submission with real database
```java
@Testcontainers
@QuarkusTest
class ApprovalWorkflowIntegrationTest extends AbstractIntegrationTest {

    @Inject
    VVBApprovalService approvalService;

    @Inject
    VVBApprovalRegistry approvalRegistry;

    @Test
    @DisplayName("Approval Workflow - create request, submit votes, reach consensus")
    void testApprovalWorkflow() throws Exception {
        // GIVEN: New approval request
        UUID tokenVersionId = UUID.randomUUID();
        List<String> validators = List.of("validator-1", "validator-2", "validator-3");

        // WHEN: Create approval request
        VVBApprovalRequest request = approvalService.createApprovalRequest(
            tokenVersionId,
            validators,
            7 * 24 * 3600  // 7 day voting window
        ).await().indefinitely();

        // AND: Submit approving votes
        approvalService.submitVote(request.requestId, "validator-1", VoteChoice.YES)
            .await().indefinitely();
        approvalService.submitVote(request.requestId, "validator-2", VoteChoice.YES)
            .await().indefinitely();

        // THEN: Consensus reached (2/3 majority)
        VVBApprovalRequest updated = approvalRegistry.findByRequestId(request.requestId);
        assertThat(updated.status).isEqualTo(ApprovalStatus.APPROVED);
    }
}
```

### 2.3 Contract Tests (5% of all tests)

**Purpose**: Verify API schema compliance
**Tools**: REST Assured, gRPC stub validation
**Scope**: Every public API endpoint

**Example**: Test GraphQL SDL schema
```java
@QuarkusTest
class ApprovalGraphQLSchemaTest {

    @Test
    @DisplayName("GraphQL Schema - approval query should match SDL definition")
    void testApprovalQuerySchema() {
        // Verify query signature matches schema
        String schema = given()
            .when()
            .get("/graphql/schema.graphql")
            .then()
            .extract()
            .asString();

        assertThat(schema)
            .contains("type Query")
            .contains("approval(id: String!): ApprovalDTO")
            .contains("approvals(status: ApprovalStatus, limit: Int, offset: Int): [ApprovalDTO!]!");
    }
}
```

### 2.4 Performance Tests (3% of all tests)

**Purpose**: Validate TPS and latency SLOs
**Framework**: JMH (Java Microbenchmark Harness) + HdrHistogram
**Metrics**: Throughput, p50/p95/p99 latency, memory usage

**Example**: Benchmark approval processing
```java
@Fork(value = 3)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
public class ApprovalBenchmarks {

    @Benchmark
    public void benchmarkApprovalSubmission(BenchmarkState state) {
        state.approvalService.submitVote(
            state.requestId,
            state.validatorId,
            VoteChoice.YES
        ).await().indefinitely();
    }
}
// Target: >1,000 approvals/second (p99 latency <100ms)
```

### 2.5 E2E Tests (2% of all tests)

**Purpose**: Test complete user workflows
**Duration**: 5-60 seconds per test
**Scope**: Docker Compose full stack

**Example**: Complete approval → execution → webhook workflow
```java
public class ApprovalE2ETest {

    @Test
    @DisplayName("End-to-End - token approval through execution and webhook")
    @Timeout(60)
    void testCompleteApprovalWorkflow() {
        // Subscribe to webhook delivery
        AtomicReference<WebhookEvent> deliveredEvent = new AtomicReference<>();
        mockWebhookServer.onDelivery(event -> deliveredEvent.set(event));

        // 1. Submit token for approval
        UUID versionId = submitTokenVersion();

        // 2. Validators approve
        submitValidatorApprovals(versionId, 3); // 3/4 validators

        // 3. Wait for consensus and execution
        await().atMost(5, SECONDS).until(() ->
            versionService.getVersion(versionId).status == ACTIVE
        );

        // 4. Verify webhook delivery
        assertThat(deliveredEvent.get())
            .isNotNull()
            .hasFieldOrPropertyWithValue("event", "APPROVAL_EXECUTED");
    }
}
```

---

## 3. Reactive Testing Patterns

### 3.1 Testing Uni<T> (Single Async Values)

```java
// Pattern 1: Using await().indefinitely()
@Test
void testUniCompletion() {
    Uni<String> result = service.fetchData();

    String value = result
        .await().indefinitely();

    assertThat(value).isEqualTo("expected");
}

// Pattern 2: Using assertSubscriber
@Test
void testUniWithAssertSubscriber() {
    Uni<String> result = service.fetchData();

    result
        .subscribe().withSubscriber(AssertSubscriber.create())
        .awaitItem(Duration.ofSeconds(1))
        .assertItem("expected")
        .assertCompleted();
}

// Pattern 3: Error handling
@Test
void testUniFailure() {
    Uni<String> result = service.fetchInvalidData();

    AssertSubscriber<String> subscriber = result
        .subscribe().withSubscriber(AssertSubscriber.create());

    subscriber
        .awaitFailure(Duration.ofSeconds(1))
        .assertFailedWith(IllegalArgumentException.class);
}
```

### 3.2 Testing Multi<T> (Reactive Streams)

```java
// Pattern 1: Using CountDownLatch for multiple items
@Test
void testMultipleItems() throws Exception {
    CountDownLatch itemsReceived = new CountDownLatch(3);
    List<String> items = new CopyOnWriteArrayList<>();

    Multi<String> stream = service.streamData();

    stream.subscribe().with(
        item -> {
            items.add(item);
            itemsReceived.countDown();
        },
        failure -> fail("Stream failed: " + failure)
    );

    assertTrue(itemsReceived.await(5, TimeUnit.SECONDS));
    assertThat(items).hasSize(3).contains("item1", "item2", "item3");
}

// Pattern 2: Using AssertSubscriber (recommended)
@Test
void testMultiWithAssertSubscriber() {
    Multi<String> stream = service.streamData();

    AssertSubscriber<String> subscriber = stream
        .subscribe().withSubscriber(AssertSubscriber.create(3));

    subscriber
        .awaitItems(3, Duration.ofSeconds(5))
        .assertCompleted()
        .assertItems("item1", "item2", "item3");
}

// Pattern 3: Testing stream operations
@Test
void testStreamTransform() {
    Multi<Integer> stream = service.streamNumbers()
        .map(n -> n * 2)
        .filter(n -> n > 10);

    stream
        .subscribe().withSubscriber(AssertSubscriber.create(2))
        .awaitItems(2, Duration.ofSeconds(5))
        .assertCompleted()
        .assertItems(12, 14);  // Filtered and transformed values
}
```

### 3.3 Testing Reactive Subscriptions (GraphQL)

```java
@Test
void testGraphQLSubscription() throws Exception {
    // Create subscription holder
    AssertSubscriber<ApprovalDTO> subscriber = approvalGraphQLAPI
        .approvalStatusChanged("approval-1")
        .subscribe().withSubscriber(AssertSubscriber.create(2));

    // Emit updates
    subscriptionManager.broadcastApprovalStatusChange("approval-1", ApprovalStatus.PENDING);
    subscriptionManager.broadcastApprovalStatusChange("approval-1", ApprovalStatus.APPROVED);

    // Assert received items
    subscriber
        .awaitItems(2, Duration.ofSeconds(2))
        .assertCompleted()
        .assertItems(
            new ApprovalDTO("approval-1", ApprovalStatus.PENDING),
            new ApprovalDTO("approval-1", ApprovalStatus.APPROVED)
        );
}
```

---

## 4. Test Data Builders (Fluent API)

For complex test scenarios, use builder pattern to reduce boilerplate and improve readability:

```java
// Builder example
public class ApprovalRequestTestBuilder {
    private UUID requestId = UUID.randomUUID();
    private UUID tokenVersionId = UUID.randomUUID();
    private ApprovalStatus status = ApprovalStatus.PENDING;
    private Integer totalValidators = 5;
    private Double approvalThreshold = 66.67;  // >2/3 majority
    private LocalDateTime votingWindowEnd = LocalDateTime.now().plusDays(7);

    public static ApprovalRequestTestBuilder anApprovalRequest() {
        return new ApprovalRequestTestBuilder();
    }

    public ApprovalRequestTestBuilder approved() {
        this.status = ApprovalStatus.APPROVED;
        return this;
    }

    public ApprovalRequestTestBuilder rejected() {
        this.status = ApprovalStatus.REJECTED;
        return this;
    }

    public ApprovalRequestTestBuilder withValidators(int count) {
        this.totalValidators = count;
        return this;
    }

    public ApprovalRequestTestBuilder expiredAt(LocalDateTime when) {
        this.votingWindowEnd = when;
        return this;
    }

    public VVBApprovalRequest build() {
        VVBApprovalRequest request = new VVBApprovalRequest();
        request.requestId = requestId;
        request.tokenVersionId = tokenVersionId;
        request.status = status;
        request.totalValidators = totalValidators;
        request.approvalThreshold = approvalThreshold;
        request.votingWindowEnd = votingWindowEnd;
        return request;
    }
}

// Usage (much cleaner than constructor calls)
VVBApprovalRequest approval = anApprovalRequest()
    .approved()
    .withValidators(7)
    .expiredAt(LocalDateTime.now().minusDays(1))
    .build();
```

---

## 5. Mocking Strategy

### 5.1 When to Mock

**✅ MOCK** - For unit tests:
- External service calls (HTTP, gRPC)
- Database queries (use `@InjectMock` with `when().thenReturn()`)
- Message queue operations
- Cache operations

**❌ NO MOCK** - For integration tests:
- Database operations (use real PostgreSQL via Testcontainers)
- Event streaming (use real Kafka)
- Cache (use real Redis)

### 5.2 Mocking Pattern

```java
@QuarkusTest
class ApprovalGraphQLAPITest {

    @InjectMock
    VVBApprovalRegistry approvalRegistry;

    @InjectMock
    ApprovalExecutionService executionService;

    @Inject
    ApprovalGraphQLAPI graphQLAPI;

    @Test
    void testGetApproval_ValidId_ReturnsApproval() {
        // Setup mocks
        UUID approvalId = UUID.randomUUID();
        VVBApprovalRequest mockRequest = createMockApproval(approvalId);

        when(approvalRegistry.findByRequestId(approvalId))
            .thenReturn(Uni.createFrom().item(mockRequest));

        // Test
        ApprovalDTO result = graphQLAPI.getApproval(approvalId.toString())
            .await().indefinitely();

        // Verify
        assertThat(result.getId()).isEqualTo(approvalId.toString());
        verify(approvalRegistry).findByRequestId(approvalId);
    }
}
```

---

## 6. Coverage Goals & Metrics

### 6.1 Overall Coverage Targets

| Component Type | Line Coverage | Branch Coverage | Rationale |
|---|---|---|---|
| Public APIs | 95% | 90% | User-facing, critical paths |
| Business Logic | 95% | 90% | Complex, behavior-critical |
| Infrastructure | 85% | 80% | Supporting code, well-tested patterns |
| Utils/Helpers | 80% | 75% | Simple functions, less risky |
| **PROJECT OVERALL** | **95%** | **90%** | **JaCoCo enforced** |

### 6.2 Phase-by-Phase Coverage Roadmap

| Phase | Timeline | Components | Target Coverage | Test Count |
|---|---|---|---|---|
| **Phase 1** | Week 1 | P1-2 (GraphQL + VVB) | 80% | 130 |
| **Phase 2** | Week 2 | P3-4 (gRPC + Core) | 70% | 150 |
| **Phase 3** | Week 3 | P5-6 (Security + WebSocket) | 98% | 180+ |
| **Overall Goal** | Sprint 20 | All components | 95% | 300+ |

### 6.3 Critical Path Testing

Ensure 100% coverage for these critical components:
1. **Approval Workflow**: Create → Vote → Consensus → Execute
2. **Consensus Algorithm**: Leader election, log replication, snapshots
3. **Cryptographic Operations**: CRYSTALS-Dilithium, Kyber, SPHINCS+
4. **Byzantine Fault Tolerance**: >2/3 majority calculations
5. **State Transitions**: Version lifecycle management

---

## 7. Quality Gates & Enforcement

### 7.1 Pre-commit Hook

**File**: `.git/hooks/pre-commit`

```bash
#!/bin/bash
# Run fast unit tests only (no integration tests)
./mvnw test -q -Dtest='*Test,!*IntegrationTest' -DskipITs

if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed. Fix before committing."
  exit 1
fi

echo "✅ Pre-commit tests passed."
```

**Make executable**: `chmod +x .git/hooks/pre-commit`

### 7.2 PR Quality Gates

**GitHub Actions Workflow**:
```yaml
name: Test Quality Gates
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # Unit tests
      - run: ./mvnw test -q
        if: failure()
        run: echo "❌ Unit tests failed"

      # Coverage
      - run: ./mvnw verify -DskipITs
      - name: Check JaCoCo Coverage
        run: |
          LINE_PCT=$(python3 -c "
            import xml.etree.ElementTree as ET
            tree = ET.parse('target/jacoco-report/jacoco.xml')
            for counter in tree.getroot().findall('.//counter[@type=\"LINE\"]'):
              covered = int(counter.get('covered', 0))
              total = int(counter.get('missed', 0)) + covered
              pct = (covered / total * 100) if total > 0 else 0
              print(int(pct))
          ")
          if [ $LINE_PCT -lt 95 ]; then
            echo "❌ Coverage $LINE_PCT% < 95% required"
            exit 1
          fi
          echo "✅ Coverage $LINE_PCT% >= 95%"
```

### 7.3 CI/CD Pipeline Stages

1. **Compile**: `./mvnw clean compile`
2. **Unit Tests**: `./mvnw test`
3. **Integration Tests**: `./mvnw verify`
4. **Coverage Check**: JaCoCo 95% enforced
5. **Performance Validation**: Benchmark p99 latencies
6. **Artifact Build**: JAR + Docker image

---

## 8. Team Practices & Culture

### 8.1 Code Review Checklist for Tests

- [ ] **Coverage**: Test covers main path + at least 2 edge cases
- [ ] **Isolation**: Test passes independently, no shared state
- [ ] **Speed**: Unit test <10ms, integration test <5s
- [ ] **Clarity**: Test name describes what is being tested
- [ ] **Naming**: Follows Given-When-Then structure
- [ ] **Mocking**: Appropriate mocking (not over-mocked)
- [ ] **Assertions**: Clear, specific assertions (not generic)
- [ ] **Error Cases**: Tests error conditions and edge cases
- [ ] **Comments**: Complex test logic is documented
- [ ] **No Secrets**: No hardcoded credentials or sensitive data

### 8.2 TDD Culture Adoption (3-Month Plan)

**Month 1: Foundation**
- Team TDD workshop (4 hours)
- Establish test champions (2 per team)
- Define code review checklist
- Publish test templates

**Month 2: Metrics & Gamification**
- Weekly coverage reports
- Leaderboard for test count contributions
- Reward "test of the week"
- Share learnings in team meetings

**Month 3: Advanced Practices**
- Mutation testing (PIT - Pitest)
- Property-based testing (QuickTheories)
- Performance regression testing
- Advanced reactive testing patterns

---

## 9. Testing Tools & Configuration

### 9.1 Maven Dependencies (Already in pom.xml)

```xml
<!-- Testing Frameworks -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5</artifactId>
    <scope>test</scope>
</dependency>

<!-- Assertion Libraries -->
<dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.25.3</version>
    <scope>test</scope>
</dependency>

<!-- Mocking -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5-mockito</artifactId>
    <scope>test</scope>
</dependency>

<!-- REST Testing -->
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
</dependency>

<!-- Testcontainers -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.7</version>
    <scope>test</scope>
</dependency>

<!-- Performance Testing -->
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.37</version>
    <scope>test</scope>
</dependency>
```

### 9.2 Maven Profiles

```xml
<profiles>
    <!-- Fast unit tests only -->
    <profile>
        <id>unit-tests-only</id>
        <properties>
            <skipITs>true</skipITs>
        </properties>
        <build>
            <plugins>
                <plugin>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <configuration>
                        <includes>
                            <include>**/*Test.java</include>
                        </includes>
                        <excludes>
                            <exclude>**/*IntegrationTest.java</exclude>
                        </excludes>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>

    <!-- Full test suite -->
    <profile>
        <id>full-test-suite</id>
        <build>
            <plugins>
                <plugin>
                    <artifactId>maven-failsafe-plugin</artifactId>
                    <executions>
                        <execution>
                            <goals>
                                <goal>integration-test</goal>
                                <goal>verify</goal>
                            </goals>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

---

## 10. Continuous Improvement

### 10.1 Mutation Testing (PIT - Pitest)

Detects weak tests by mutating source code:

```bash
./mvnw org.pitest:pitest-maven:mutationCoverage
# Target: >80% mutations killed
```

### 10.2 Performance Regression Detection

```bash
# Baseline
./mvnw clean verify -Pbenchmarks
python3 scripts/save-benchmark-baseline.py

# After changes
./mvnw verify -Pbenchmarks
python3 scripts/compare-benchmarks.py --threshold 0.95
# Fails if regression >5%
```

### 10.3 Code Coverage Trends

Track coverage over time:
```bash
# Monthly coverage report
./mvnw verify
./mvnw jacoco:report
git add docs/testing/coverage-monthly-report.md
git commit -m "docs: Monthly coverage report $(date +%Y-%m)"
```

---

## Summary

This TDD strategy provides the foundation for achieving 95% test coverage across Aurigraph DLT V11. Key principles:

1. **Red-Green-Refactor**: Always write tests first for new features
2. **Test Pyramid**: 70% unit, 20% integration, 5% contract, 3% performance, 2% E2E
3. **Reactive Testing**: Master Uni<T> and Multi<T> patterns
4. **Quality Gates**: Pre-commit hooks + CI/CD enforcement
5. **Culture**: Build TDD practices through team workshops and metrics
6. **Continuous Improvement**: Mutation testing, regression detection, trend analysis

**Next Steps**:
1. Create test templates (TEST-TEMPLATES.md)
2. Implement test data builders
3. Begin Priority 1 tests (GraphQL APIs)
4. Expand to Priority 2-5 components
5. Reach 95% coverage target by Sprint 20

---

## Appendix: Quick Reference

### Running Tests
```bash
./mvnw test                                    # Unit tests only
./mvnw verify                                  # All tests + coverage
./mvnw test -Dtest=ApprovalGraphQLAPITest     # Single test class
./mvnw test -Dtest=*GraphQL*                  # Pattern matching
```

### Coverage Reports
```bash
open target/site/jacoco/index.html             # Line coverage
open target/site/jacoco-it/index.html          # Integration test coverage
```

### Performance Benchmarks
```bash
./mvnw verify -Pbenchmarks
open target/results/benchmark-results.json
```

**Last Updated**: December 26, 2025
**Status**: ✅ Active and enforced in CI/CD pipeline
**Review Cycle**: Quarterly (every 3 months)
