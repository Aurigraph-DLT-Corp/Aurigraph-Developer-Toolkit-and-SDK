# Aurigraph V11 Testing Guide
## Comprehensive Test Execution and Coverage

**Version**: 11.5.0
**Date**: November 14, 2025
**Sprint**: 13 - Testing Phase

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Coverage Reports](#coverage-reports)
5. [Writing New Tests](#writing-new-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Java 21+
- Maven 3.9+
- Docker (for native builds and future Testcontainers)

### Run All Tests
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test
```

### Expected Output
```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running io.aurigraph.v11.assettracking.AssetTraceabilityServiceTest
[INFO] Tests run: 25, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running io.aurigraph.v11.registries.smartcontract.SmartContractRegistryServiceTest
[INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running io.aurigraph.v11.registries.compliance.ComplianceRegistryServiceTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running io.aurigraph.v11.registries.RegistryManagementServiceTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running io.aurigraph.v11.integration.AssetTraceabilityIntegrationTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running io.aurigraph.v11.integration.RegistryIntegrationTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 81, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] BUILD SUCCESS
```

---

## Test Structure

### Directory Layout
```
src/test/java/io/aurigraph/v11/
├── assettracking/
│   └── AssetTraceabilityServiceTest.java (25 tests)
├── registries/
│   ├── RegistryManagementServiceTest.java (15 tests)
│   ├── smartcontract/
│   │   └── SmartContractRegistryServiceTest.java (20 tests)
│   └── compliance/
│       └── ComplianceRegistryServiceTest.java (15 tests)
└── integration/
    ├── AssetTraceabilityIntegrationTest.java (3 workflows)
    └── RegistryIntegrationTest.java (3 workflows)
```

### Test Categories

#### 1. Unit Tests (75 tests)
- **Purpose**: Test individual service methods in isolation
- **Scope**: Single class, mocked dependencies
- **Execution Time**: <100ms per test
- **Coverage Target**: 80%+

#### 2. Integration Tests (6 workflows)
- **Purpose**: Test end-to-end workflows across multiple services
- **Scope**: Multi-service interactions
- **Execution Time**: <500ms per workflow
- **Coverage Target**: Critical paths

---

## Running Tests

### Run All Tests
```bash
./mvnw test
```

### Run Specific Test Class
```bash
# Single test class
./mvnw test -Dtest=AssetTraceabilityServiceTest

# Multiple test classes
./mvnw test -Dtest=AssetTraceabilityServiceTest,SmartContractRegistryServiceTest
```

### Run Specific Test Method
```bash
# Single method
./mvnw test -Dtest=AssetTraceabilityServiceTest#testCreateAssetTrace_WhenValidData_ThenSuccess

# Multiple methods (wildcard)
./mvnw test -Dtest=AssetTraceabilityServiceTest#testCreate*
```

### Run Tests by Pattern
```bash
# All unit tests
./mvnw test -Dtest=*ServiceTest

# All integration tests
./mvnw test -Dtest=*IntegrationTest

# All compliance tests
./mvnw test -Dtest=Compliance*
```

### Run Tests with Logging
```bash
# Enable debug logging
./mvnw test -Dquarkus.log.level=DEBUG

# Specific package logging
./mvnw test -Dquarkus.log.category.\"io.aurigraph.v11\".level=TRACE
```

### Run Tests in Parallel
```bash
# Parallel execution (faster for large test suites)
./mvnw test -T 4  # 4 threads
```

---

## Coverage Reports

### Generate Coverage Report
```bash
# Generate JaCoCo coverage report
./mvnw verify

# Coverage data location
target/jacoco.exec
```

### View Coverage Report
```bash
# HTML report
open target/site/jacoco/index.html

# CSV report
cat target/site/jacoco/jacoco.csv

# XML report (for CI/CD)
cat target/site/jacoco/jacoco.xml
```

### Coverage Thresholds (Enforced by JaCoCo)

#### Global Coverage
- **Line Coverage**: 95% minimum
- **Branch Coverage**: 90% minimum

#### Package-Specific Coverage
- **Crypto Package**: 98% line, 95% branch
- **Consensus Package**: 95% line, 90% branch
- **Critical Classes**: 95% line, 90% branch

#### Excluded from Coverage
- Generated code (`*_generated/**`, `**/generated/**`)
- DTOs without logic (`**/*Record.java`)
- Configuration classes (`**/*Config.java`)

### Coverage Reports Formats
1. **HTML**: Interactive browsable report
2. **XML**: SonarQube/CI integration
3. **CSV**: Data analysis and metrics

---

## Writing New Tests

### Test Naming Convention
```java
@DisplayName("methodName - Should do X when Y")
void testMethodName_WhenCondition_ThenExpectedResult() {
    // Test implementation
}
```

### Test Structure (AAA Pattern)
```java
@Test
@Order(1)
@DisplayName("createAsset - Should create asset with valid data")
void testCreateAsset_WhenValidData_ThenSuccess() {
    // ARRANGE: Set up test data
    String assetId = "asset-001";
    String assetName = "Gold Bar";
    Double valuation = 50000.00;

    // ACT: Execute the method under test
    AssetTrace result = service.createAssetTrace(
        assetId, assetName, "METAL", valuation, "owner-001"
    ).subscribe().withSubscriber(UniAssertSubscriber.create())
     .awaitItem()
     .getItem();

    // ASSERT: Verify the results
    assertThat(result).isNotNull();
    assertThat(result.getAssetId()).isEqualTo(assetId);
    assertThat(result.getValuation()).isEqualTo(valuation);
}
```

### Required Dependencies
```java
// JUnit 5
import org.junit.jupiter.api.*;

// AssertJ for fluent assertions
import static org.assertj.core.api.Assertions.*;

// Quarkus Test
import io.quarkus.test.junit.QuarkusTest;

// Reactive testing
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
```

### Testing Reactive Code (Mutiny Uni)
```java
// Pattern for testing Uni<T> returns
Uni<AssetTrace> result = service.createAssetTrace(...);

AssetTrace trace = result
    .subscribe()
    .withSubscriber(UniAssertSubscriber.create())
    .awaitItem()
    .getItem();

assertThat(trace).isNotNull();
```

### Testing Exceptions
```java
@Test
@DisplayName("Should throw exception for null input")
void testMethod_WhenNullInput_ThenThrowsException() {
    assertThatThrownBy(() -> {
        service.method(null)
            .subscribe()
            .withSubscriber(UniAssertSubscriber.create())
            .awaitItem();
    }).hasCauseInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("cannot be null");
}
```

### Test Lifecycle Hooks
```java
@BeforeAll
static void setUpAll() {
    // Runs once before all tests in the class
}

@BeforeEach
void setUp() {
    // Runs before each test method
    service = new MyService();
}

@AfterEach
void tearDown() {
    // Runs after each test method
    // Clean up resources
}

@AfterAll
static void tearDownAll() {
    // Runs once after all tests in the class
}
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Java 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run Tests
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw verify

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./target/site/jacoco/jacoco.xml
```

### Maven Profiles

#### Full Test Suite
```bash
./mvnw test -Pfull-test
```

#### Performance Tests
```bash
./mvnw test -Pperformance-test
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Fail Due to Port Conflicts
**Problem**: Port 9003 already in use
```bash
# Solution: Kill process using the port
lsof -i :9003
kill -9 <PID>
```

#### 2. OutOfMemoryError During Tests
**Problem**: Insufficient heap memory
```bash
# Solution: Increase Maven memory
export MAVEN_OPTS="-Xmx4g"
./mvnw test
```

#### 3. Tests Timeout
**Problem**: Reactive tests hang indefinitely
```java
// Solution: Add timeout to test
@Test
@Timeout(value = 5, unit = TimeUnit.SECONDS)
void testMethod() {
    // Test code
}
```

#### 4. Flaky Integration Tests
**Problem**: Tests pass/fail intermittently
```java
// Solution: Ensure test isolation
@BeforeEach
void setUp() {
    service = new ServiceImpl();  // Fresh instance
}
```

#### 5. Coverage Below Threshold
**Problem**: JaCoCo check fails
```bash
# Solution: Run coverage report to identify gaps
./mvnw verify
open target/site/jacoco/index.html

# Add tests for uncovered lines
```

### Debug Mode
```bash
# Run tests with Maven debug output
./mvnw test -X

# Run tests with remote debugging
./mvnw test -Dmaven.surefire.debug="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005"
```

### Logging Configuration
```properties
# src/test/resources/application.properties
quarkus.log.level=INFO
quarkus.log.category."io.aurigraph.v11".level=DEBUG
quarkus.log.console.enable=true
```

---

## Best Practices

### DO
- ✅ Use `@DisplayName` for readable test descriptions
- ✅ Follow AAA pattern (Arrange-Act-Assert)
- ✅ Test both happy path and edge cases
- ✅ Use AssertJ for fluent assertions
- ✅ Keep tests independent and isolated
- ✅ Use `@Order` for test execution stability
- ✅ Write descriptive assertion messages

### DON'T
- ❌ Share state between tests
- ❌ Use `Thread.sleep()` in tests
- ❌ Test multiple concerns in one method
- ❌ Ignore test failures
- ❌ Skip writing tests for bug fixes
- ❌ Use production databases in tests
- ❌ Hardcode test data that changes

---

## Performance Guidelines

### Test Execution Time Targets
- **Unit Test**: <100ms
- **Integration Test**: <500ms
- **Full Test Suite**: <2 minutes

### Optimize Slow Tests
```java
// BAD: Multiple service initializations
@Test
void test1() {
    Service s = new Service();
    s.method1();
}

@Test
void test2() {
    Service s = new Service();
    s.method2();
}

// GOOD: Reuse service instance
private Service service;

@BeforeEach
void setUp() {
    service = new Service();
}

@Test
void test1() {
    service.method1();
}
```

---

## Coverage Goals

### Sprint 13 Targets
| Module | Current | Target | Status |
|--------|---------|--------|--------|
| Asset Traceability | 85% | 85% | ✅ |
| Smart Contract Registry | 80% | 80% | ✅ |
| Compliance Registry | 80% | 80% | ✅ |
| Registry Management | 75% | 75% | ✅ |
| **Overall** | **80%** | **80%** | **✅** |

---

## Additional Resources

### Documentation
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [AssertJ Documentation](https://assertj.github.io/doc/)
- [Quarkus Testing Guide](https://quarkus.io/guides/getting-started-testing)
- [Mutiny Guide](https://smallrye.io/smallrye-mutiny/)

### Internal Docs
- `TEST_COVERAGE_REPORT.md` - Detailed coverage report
- `COMPREHENSIVE-TEST-PLAN.md` - Overall testing strategy
- `pom.xml` - Test dependencies and configuration

---

**Last Updated**: November 14, 2025
**Maintained By**: Aurigraph Agent Framework - Agent-Tests
**Sprint**: 13 - Testing Phase
