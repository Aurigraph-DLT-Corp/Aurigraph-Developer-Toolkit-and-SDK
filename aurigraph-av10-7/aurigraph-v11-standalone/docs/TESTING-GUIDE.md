# Aurigraph V11 Testing Guide

## Overview

This guide provides comprehensive instructions for running tests, writing new tests, and maintaining test coverage in the Aurigraph V11 platform using the Test-Driven Development (TDD) strategy.

**Current Status**: Phase 5-6 Complete
- ✅ Maven profiles configured and validated
- ✅ Pre-commit hooks enforcing quality gates
- ✅ 212+ unit tests operational
- ✅ JaCoCo coverage gates configured (95% lines, 90% branches)

---

## Quick Start

### Running Tests

```bash
# Unit tests only (recommended for local development) - ~30 seconds
./mvnw test -Punit-tests-only

# Integration tests (requires Docker) - ~2-5 minutes
./mvnw test -Pintegration-tests

# Full test suite (comprehensive) - ~10-15 minutes
./mvnw verify -Pfull-test-suite

# Check coverage
open target/site/jacoco/index.html
```

### Development Setup

```bash
# One-command setup with all dependencies
bash scripts/setup-dev-environment.sh

# Or manually:
./mvnw clean compile
./mvnw quarkus:dev  # Start in hot-reload mode
```

---

## Test Organization

### Directory Structure

```
src/test/java/io/aurigraph/v11/
├── graphql/
│   ├── ApprovalGraphQLAPITest.java          (GraphQL queries/mutations/subscriptions)
│   └── ApprovalSubscriptionManagerTest.java  (GraphQL subscriptions & broadcasts)
├── token/
│   └── secondary/
│       ├── VVBApprovalServiceTest.java      (VVB consensus & approval workflow)
│       ├── ApprovalExecutionServiceTest.java (Execution state transitions)
│       ├── ApprovalStateValidatorTest.java.skip (Temporarily excluded)
│       ├── ApprovalWebhookServiceTest.java.skip (Temporarily excluded)
│       └── SecondaryTokenVersioningServiceTest.java.skip (Temporarily excluded)
├── integration/
│   ├── AbstractIntegrationTest.java          (Base class for integration tests)
│   ├── ApprovalGraphQLIntegrationTest.java   (E2E GraphQL workflows)
│   └── VVBApprovalWorkflowIntegrationTest.java (E2E VVB workflow)
└── testing/
    └── builders/                              (Test data builders)
        ├── ApprovalRequestTestBuilder.java
        ├── ValidatorVoteTestBuilder.java
        └── SecondaryTokenVersionTestBuilder.java
```

### Test Categories

#### Unit Tests (Priority)
- **Location**: `src/test/java/io/aurigraph/v11/graphql/`, `src/test/java/io/aurigraph/v11/token/secondary/`
- **Execution**: `./mvnw test -Punit-tests-only`
- **Timeout**: <30 seconds
- **Coverage Target**: 80%+ for priority 1-2 components
- **Execution**: Pre-commit hook validates these automatically

#### Integration Tests
- **Location**: `src/test/java/io/aurigraph/v11/integration/`
- **Execution**: `./mvnw test -Pintegration-tests`
- **Timeout**: 2-5 minutes
- **Infrastructure**: Testcontainers (PostgreSQL, Kafka, Redis)
- **Coverage Target**: 70%+ for critical paths
- **Execution**: Runs in CI/CD pipeline only (requires Docker)

#### Performance Tests
- **Location**: Tests with `PerformanceTest` suffix
- **Execution**: `./mvnw test -Pperformance-tests`
- **Timeout**: Up to 180 seconds per test
- **Metrics**: TPS baseline (currently 776K, target 2M+)

---

## Writing Tests

### Using Test Builders (Recommended)

Test builders provide fluent APIs for creating complex test objects:

```java
// Create approval request with builder
ApprovalRequest approval = new ApprovalRequestTestBuilder()
    .withTokenId(tokenId)
    .withTotalValidators(5)
    .withApprovalThreshold(3)
    .withVotingWindowMinutes(30)
    .build();

// Create validator vote with builder
ValidatorVote vote = new ValidatorVoteTestBuilder()
    .withValidatorId("validator-1")
    .withChoice(VoteChoice.YES)
    .withTimestamp(LocalDateTime.now())
    .build();
```

### Test Template - GraphQL Query

```java
@Test
@DisplayName("Query returns approval with correct status")
void testQueryApproval_ReturnsApprovalWithStatus() {
    // Arrange
    UUID approvalId = UUID.randomUUID();
    ApprovalDTO expected = new ApprovalDTO(approvalId, "PENDING", ...);
    
    // Act
    ApprovalDTO result = graphqlAPI.getApproval(approvalId.toString())
        .await().indefinitely();
    
    // Assert
    assertNotNull(result);
    assertEquals(expected.getStatus(), result.getStatus());
}
```

### Test Template - Reactive Service

```java
@Test
@DisplayName("Service handles async execution correctly")
void testExecuteApprovalAsync_HandlesAsyncCorrectly() {
    // Arrange
    UUID requestId = UUID.randomUUID();
    
    // Act
    Uni<ExecutionResult> resultUni = executionService.executeApproval(requestId);
    ExecutionResult result = resultUni.await().indefinitely();
    
    // Assert
    assertNotNull(result);
    assertEquals("SUCCESS", result.status);
}
```

### Test Template - Integration (with Testcontainers)

```java
@QuarkusTest
class VVBApprovalWorkflowIntegrationTest extends AbstractIntegrationTest {
    
    @Test
    @DisplayName("Complete VVB workflow executes successfully")
    void testCompleteVVBWorkflow_ExecutesSuccessfully() {
        // Arrange: Containers already started by AbstractIntegrationTest
        UUID tokenId = UUID.randomUUID();
        
        // Act: Create → Vote → Consensus → Execute
        VVBApprovalRequest approval = vvbService.createApprovalRequest(
            tokenId, 5, 3, Duration.ofMinutes(30))
            .await().indefinitely();
            
        // Assert: Workflow progressed
        assertEquals(ApprovalStatus.PENDING, approval.status);
    }
}
```

---

## Test Data Builders

### ApprovalRequestTestBuilder

```java
ApprovalRequest approval = new ApprovalRequestTestBuilder()
    .withTokenId(UUID.randomUUID())
    .withTotalValidators(7)
    .withApprovalThreshold(5)       // >2/3 of 7
    .withVotingWindowMinutes(30)
    .build();
```

### ValidatorVoteTestBuilder

```java
ValidatorVote vote = new ValidatorVoteTestBuilder()
    .withValidatorId("validator-1")
    .withChoice(VoteChoice.YES)
    .withTimestamp(LocalDateTime.now())
    .build();
```

### SecondaryTokenVersionTestBuilder

```java
SecondaryTokenVersion version = new SecondaryTokenVersionTestBuilder()
    .withTokenId(tokenId)
    .withContent("updated content")
    .withVVBRequired(true)
    .withPreviousVersionId(previousVersionId)
    .build();
```

---

## Maven Profiles

### Unit Tests Only (`unit-tests-only`)

```bash
./mvnw test -Punit-tests-only
```

**What it does:**
- Runs all `*Test.java` files
- Excludes `*IntegrationTest.java`, `*PerformanceTest.java`
- Excludes temporarily skipped tests (ApprovalStateValidatorTest, etc.)
- Executes in parallel (2 forks)
- Completes in <30 seconds
- **Used by**: Pre-commit hook, local development

**Configuration** (pom.xml):
```xml
<profile>
    <id>unit-tests-only</id>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <includes>
                        <include>**/*Test.java</include>
                    </includes>
                    <excludes>
                        <exclude>**/*IntegrationTest.java</exclude>
                        <!-- ... -->
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</profile>
```

### Integration Tests (`integration-tests`)

```bash
./mvnw test -Pintegration-tests
```

**What it does:**
- Runs `*IntegrationTest.java` files using Failsafe
- Starts Testcontainers (PostgreSQL, Kafka, Redis)
- Executes end-to-end workflows
- Completes in 2-5 minutes
- **Used by**: CI/CD pipeline

### Full Test Suite (`full-test-suite`)

```bash
./mvnw verify -Pfull-test-suite
```

**What it does:**
- Runs unit + integration + performance tests
- Generates JaCoCo coverage reports
- Enforces coverage gates (95% lines, 90% branches)
- Completes in 10-15 minutes
- **Used by**: Pre-release verification, CI/CD final gate

---

## Coverage Requirements

### Coverage Targets

| Component | Target | Type |
|-----------|--------|------|
| **Overall** | 80%+ | Lines + Branches |
| **Crypto Module** | 98%+ | High security priority |
| **Consensus Module** | 95%+ | Critical algorithm |
| **VVB Workflow** | 85%+ | P1 feature |
| **GraphQL API** | 85%+ | P1 feature |
| **Other Services** | 70%+ | Standard coverage |

### Checking Coverage

```bash
# Generate coverage report
./mvnw jacoco:report

# View in browser
open target/site/jacoco/index.html
```

**Coverage Report Location**: `target/site/jacoco/index.html`

**Key Metrics**:
- Line coverage (red/yellow/green bars)
- Branch coverage (method complexity)
- Missed lines (clickable to see uncovered code)

---

## Pre-Commit Hooks

The project includes a pre-commit hook that validates code before committing.

### What It Checks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Runs unit tests automatically
./mvnw test -q -Punit-tests-only

if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed. Fix before committing."
    exit 1
fi
```

### Bypassing (Not Recommended)

```bash
# Only if absolutely necessary
git commit --no-verify -m "message"
```

---

## Common Test Patterns

### Arrange-Act-Assert Pattern

All tests follow this pattern for clarity:

```java
@Test
void testSomething() {
    // ARRANGE: Set up test data
    UUID id = UUID.randomUUID();
    
    // ACT: Perform the action
    Result result = service.doSomething(id);
    
    // ASSERT: Verify the outcome
    assertEquals(expected, result);
}
```

### Testing Reactive Uni<T>

```java
// Blocking on Uni
Uni<SomeResult> resultUni = service.asyncOperation();
SomeResult result = resultUni.await().indefinitely();

assertNotNull(result);
assertEquals(expected, result.getValue());
```

### Testing Reactive Multi<T>

```java
// Collect items from stream
Multi<String> stream = subscriptionManager.subscribeToEvents();
List<String> items = stream
    .toList()
    .await().indefinitely();

assertTrue(items.size() > 0);
```

### Testing with Mocks

```java
@QuarkusTest
class ServiceTest {
    @Inject
    MyService service;
    
    @InjectMock
    DependencyService dependency;
    
    @Test
    void testWithMock() {
        // Mock behavior
        Mockito.when(dependency.getValue())
            .thenReturn("mocked");
            
        // Test service
        String result = service.usesDependency();
        assertEquals("processed: mocked", result);
    }
}
```

---

## Troubleshooting

### Tests Not Running

```bash
# Check test discovery
./mvnw test -DdryRun

# Run specific test class
./mvnw test -Dtest=ApprovalExecutionServiceTest

# Run specific test method
./mvnw test -Dtest=ApprovalExecutionServiceTest#testSomething
```

### ClassLoader Issues

If you see "Test class was loaded with unexpected classloader":
```bash
# Clean and rebuild
./mvnw clean
./mvnw clean compile
./mvnw test -Punit-tests-only
```

### Docker/Testcontainer Issues

For integration tests:
```bash
# Ensure Docker is running
docker ps

# Check Docker has sufficient resources
docker info | grep Memory

# Run only unit tests if Docker unavailable
./mvnw test -Punit-tests-only
```

### Coverage Report Not Generating

```bash
# Run full suite with coverage
./mvnw clean verify -Pfull-test-suite

# Check report was created
ls -lh target/site/jacoco/

# Open in browser
open target/site/jacoco/index.html
```

---

## CI/CD Integration

The project includes GitHub Actions workflow for automated testing:

**Workflow File**: `.github/workflows/test-quality-gates.yml`

**Jobs**:
1. `unit-tests` - Runs in <30s
2. `integration-tests` - Runs in 2-5min (requires Docker)
3. `coverage-check` - Validates 95% threshold
4. `code-quality` - Runs SonarQube analysis
5. `quality-gate-summary` - Reports final status

**Self-Hosted Runner Support**: Yes (uses `runs-on: [self-hosted]` for integration tests)

---

## Best Practices

1. **Write tests FIRST** - Test-Driven Development
2. **Use descriptive names** - `testCreateApproval_WithValidInput_ReturnsNewApproval()`
3. **Follow Arrange-Act-Assert** - Clear test structure
4. **Use test builders** - Cleaner test data setup
5. **Keep tests small** - One assertion per test when possible
6. **Test behavior, not implementation** - Focus on what it does, not how
7. **Make tests independent** - No shared state between tests
8. **Run locally before committing** - Pre-commit hook has you covered

---

## Next Steps

### Phase 3-4 Test Refactoring

The following test files are temporarily excluded and need refactoring:

- `ApprovalStateValidatorTest.java.skip` - Needs ValidationContext/ValidationResult classes
- `ApprovalWebhookServiceTest.java.skip` - Method signature alignment needed
- `SecondaryTokenVersioningServiceTest.java.skip` - Method signature alignment needed

To re-enable:
```bash
# Rename files back to .java
mv src/test/java/io/aurigraph/v11/token/secondary/ApprovalStateValidatorTest.java.skip \
   src/test/java/io/aurigraph/v11/token/secondary/ApprovalStateValidatorTest.java

# Update tests to match actual service APIs
# Run: ./mvnw test -Punit-tests-only
```

### Expanding Coverage

- Phase 7: Cross-chain bridge tests
- Phase 8: AI optimization service tests
- Phase 9: Quantum cryptography tests
- Phase 10: Performance benchmarks (2M+ TPS)

---

## Resources

- **Maven Configuration**: `pom.xml` (lines 1265+)
- **Pre-Commit Hook**: `.git/hooks/pre-commit`
- **CI/CD Workflow**: `.github/workflows/test-quality-gates.yml`
- **Development Scripts**: `scripts/run-tests.sh`, `scripts/setup-dev-environment.sh`
- **TDD Strategy**: `docs/TDD-STRATEGY.md`

---

**Generated**: 2025-12-26  
**Version**: Phase 6 Complete  
**Status**: Production Ready ✅
