# V11 Test Infrastructure Guide

**Created**: October 7, 2025
**Version**: 3.7.3 (Phase 1)
**Status**: ✅ **COMPLETE**

---

## Overview

Comprehensive test infrastructure for Aurigraph V11 supporting unit, integration, and performance testing with 50%+ coverage targets.

---

## Quick Start

### Run All Tests
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test
```

### Run Specific Test Categories
```bash
# Unit tests only
./mvnw test -Dtest="io.aurigraph.v11.unit.**"

# Integration tests only
./mvnw test -Dtest="io.aurigraph.v11.integration.**"

# Performance tests only
./mvnw test -Dtest="io.aurigraph.v11.performance.**"

# Single test class
./mvnw test -Dtest=TransactionServiceTest

# Single test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughputPerformance
```

### Generate Coverage Report
```bash
# Run tests and generate coverage
./mvnw clean test jacoco:report

# View HTML report
open target/site/jacoco/index.html

# Verify coverage thresholds
./mvnw verify
```

---

## Test Infrastructure Components

### 1. JaCoCo Code Coverage (✅ Configured)

**Version**: 0.8.11 (latest)
**Configuration**: Enhanced in `pom.xml` lines 542-644

**Coverage Thresholds**:
- Overall project: **50% line**, **45% branch**
- Crypto package: **98% line**, **95% branch** (most critical)
- Consensus package: **95% line**, **90% branch** (critical)

**Output Formats**:
- HTML: `target/site/jacoco/index.html`
- XML: `target/site/jacoco/jacoco.xml` (for CI/CD)
- CSV: `target/site/jacoco/jacoco.csv`

**Exclusions**:
- Generated code: `**/*_generated/**`, `**/generated/**`
- Simple models: `**/models/**/*Record.java`
- Configuration: `**/*Config.java`

### 2. TestContainers (✅ Configured)

**Version**: Managed by Quarkus BOM
**Dependencies**: `pom.xml` lines 278-293

**Available Modules**:
- `testcontainers` - Base container support
- `junit-jupiter` - JUnit 5 integration
- `postgresql` - PostgreSQL database for integration tests

**Usage Example**:
```java
@QuarkusTest
@TestcontainersResource
class MyIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("aurigraph_test")
        .withUsername("test")
        .withPassword("test");

    @Test
    void testWithDatabase() {
        // Test code using containerized PostgreSQL
    }
}
```

### 3. Mockito (✅ Configured)

**Version**: Managed by Quarkus BOM
**Dependencies**: `pom.xml` lines 92-100

**Available Libraries**:
- `quarkus-junit5-mockito` - Quarkus integration
- `mockito-core` - Core mocking framework

**Usage Example**:
```java
@QuarkusTest
class MyServiceTest {

    @InjectMock
    MyDependency mockDependency;

    @Inject
    MyService serviceUnderTest;

    @Test
    void testWithMock() {
        when(mockDependency.someMethod()).thenReturn("mocked");
        String result = serviceUnderTest.process();
        assertEquals("expected", result);
    }
}
```

### 4. REST Assured (✅ Configured)

**Version**: Managed by Quarkus BOM
**Dependency**: `pom.xml` lines 86-89

**Usage Example**:
```java
@QuarkusTest
class ApiResourceTest {

    @Test
    void testEndpoint() {
        given()
            .when().get("/api/v11/health")
            .then()
                .statusCode(200)
                .body("status", equalTo("UP"));
    }
}
```

### 5. AssertJ (✅ Configured)

**Version**: 3.25.3
**Dependency**: `pom.xml` lines 303-309

**Usage Example**:
```java
import static org.assertj.core.api.Assertions.*;

@Test
void testWithFluentAssertions() {
    List<String> results = service.process();

    assertThat(results)
        .isNotEmpty()
        .hasSize(10)
        .contains("expected")
        .allMatch(s -> s.startsWith("PROCESSED"));
}
```

### 6. JMH (Java Microbenchmark Harness) (✅ Configured)

**Version**: 1.37
**Dependencies**: `pom.xml` lines 311-323

**Usage**: For precise performance benchmarking

### 7. JMeter Integration (✅ Configured)

**Version**: 5.6.3
**Dependencies**: `pom.xml` lines 123-134

**Usage**: For load testing and stress testing

---

## Test Directory Structure

```
src/test/java/io/aurigraph/v11/
├── unit/                           # Unit tests (fast, isolated)
│   ├── TransactionServiceTest.java    ✅ COMPLETE (19 tests)
│   ├── ConsensusServiceTest.java      🚧 TODO
│   ├── CryptoServiceTest.java         🚧 TODO
│   └── BridgeServiceTest.java         🚧 TODO
│
├── integration/                    # Integration tests (with containers)
│   ├── DatabaseIntegrationTest.java   🚧 TODO
│   ├── GrpcIntegrationTest.java       🚧 TODO
│   └── CrossServiceTest.java          🚧 TODO
│
├── performance/                    # Performance tests (long-running)
│   ├── ThroughputTest.java            🚧 TODO
│   ├── LatencyTest.java               🚧 TODO
│   └── ConcurrencyTest.java           🚧 TODO
│
└── utils/                         # Test utilities and helpers
    ├── TestDataBuilder.java           🚧 TODO
    ├── PerformanceMetrics.java        🚧 TODO
    └── MockFactory.java               🚧 TODO
```

---

## Writing Tests

### Unit Test Template

```java
package io.aurigraph.v11.unit;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MyServiceTest {

    @Inject
    MyService service;

    @BeforeEach
    void setUp() {
        // Setup before each test
    }

    @Test
    @Order(1)
    @DisplayName("Should perform basic functionality")
    void testBasicFunctionality() {
        // Arrange
        String input = "test";

        // Act
        String result = service.process(input);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("expected"));
    }

    @AfterAll
    static void tearDown() {
        System.out.println("✅ All tests completed");
    }
}
```

### Performance Test Template

```java
package io.aurigraph.v11.performance;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.*;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@QuarkusTest
class MyPerformanceTest {

    @Test
    @Timeout(value = 120, unit = TimeUnit.SECONDS)
    @DisplayName("Should achieve target throughput")
    void testThroughput() {
        // Arrange
        int iterations = 1_000_000;

        // Act
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            service.process("item-" + i);
        }
        long duration = System.currentTimeMillis() - startTime;

        // Assert
        double tps = (iterations * 1000.0) / duration;
        assertTrue(tps >= 1_000_000,
            String.format("TPS %.0f below target", tps));

        System.out.printf("✅ Throughput: %.0f TPS%n", tps);
    }
}
```

### Integration Test Template

```java
package io.aurigraph.v11.integration;

import io.quarkus.test.junit.QuarkusTest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.junit.jupiter.api.Test;

@QuarkusTest
@Testcontainers
class MyIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");

    @Test
    void testWithDatabase() {
        // Test code with real database
    }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow (✅ Configured)

**Location**: `.github/workflows/v11-ci-cd.yml`

**Pipeline Stages**:
1. **Build & Test**: Compiles code, runs all tests, generates coverage
2. **Code Quality**: Checks coverage thresholds, TODOs, file sizes
3. **Performance Test**: Runs performance benchmarks
4. **Security Scan**: OWASP dependency check, Snyk scan
5. **Native Build**: GraalVM native image (main branch only)
6. **Deploy**: Deployment to dev4 (main branch only)

**Triggers**:
- Push to `main`, `develop`, `feature/aurigraph-v11-*`
- Pull requests to `main`, `develop`

**Quality Gates**:
- ✅ All tests must pass
- ✅ Coverage ≥ 50% line, ≥ 45% branch
- ✅ Crypto coverage ≥ 98% line, ≥ 95% branch
- ✅ Consensus coverage ≥ 95% line, ≥ 90% branch
- ⚠️  TODO count should not increase
- ⚠️  Files should be ≤ 500 lines

### Running CI/CD Locally

```bash
# Simulate CI/CD pipeline locally
./mvnw clean verify

# This runs:
# 1. Clean build
# 2. Compile
# 3. Run all tests
# 4. Generate coverage report
# 5. Verify coverage thresholds
```

---

## Coverage Reports

### Viewing Coverage

```bash
# Generate and view HTML report
./mvnw jacoco:report && open target/site/jacoco/index.html
```

### Understanding Coverage Metrics

- **Line Coverage**: % of code lines executed
- **Branch Coverage**: % of conditional branches taken
- **Method Coverage**: % of methods called
- **Complexity**: Cyclomatic complexity of code

### Coverage Targets by Phase

| Phase | Target Date | Line Coverage | Branch Coverage |
|-------|-------------|---------------|-----------------|
| V3.7.2 (Baseline) | Oct 7 | ~20% | ~15% |
| **V3.7.3 (Phase 1)** | **Oct 21** | **50%** | **45%** |
| V3.8.0 (Phase 2) | Nov 4 | 80% | 75% |
| V3.9.0 (Phase 3) | Nov 18 | 90% | 85% |
| V4.0.0 (Production) | Dec 2 | 95% | 90% |

---

## Common Testing Scenarios

### Testing Reactive Code

```java
@Test
void testReactiveProcessing() {
    // Arrange
    String input = "test";

    // Act
    String result = service.processReactive(input)
        .await().atMost(Duration.ofSeconds(5));

    // Assert
    assertNotNull(result);
    assertTrue(result.contains("PROCESSED"));
}
```

### Testing Virtual Threads

```java
@Test
void testConcurrency() throws InterruptedException {
    int threadCount = 1000;
    CountDownLatch latch = new CountDownLatch(threadCount);
    Set<String> results = ConcurrentHashMap.newKeySet();

    for (int i = 0; i < threadCount; i++) {
        final int id = i;
        Thread.startVirtualThread(() -> {
            try {
                String result = service.process("item-" + id);
                results.add(result);
            } finally {
                latch.countDown();
            }
        });
    }

    assertTrue(latch.await(60, TimeUnit.SECONDS));
    assertEquals(threadCount, results.size());
}
```

### Testing Error Handling

```java
@Test
void testErrorRecovery() {
    // Cause an error
    assertThrows(IllegalArgumentException.class, () ->
        service.process(null));

    // Verify service still works
    String result = service.process("valid");
    assertNotNull(result);
}
```

---

## Performance Testing

### TPS (Transactions Per Second) Testing

```java
@Test
@Timeout(value = 120, unit = TimeUnit.SECONDS)
void testThroughput() {
    int iterations = 1_000_000;
    List<Request> requests = generateRequests(iterations);

    long startTime = System.currentTimeMillis();
    List<String> results = service.batchProcess(requests)
        .collect().asList()
        .await().atMost(Duration.ofMinutes(2));
    long duration = System.currentTimeMillis() - startTime;

    double tps = (iterations * 1000.0) / duration;

    assertTrue(tps >= 1_000_000,
        String.format("TPS %.0f below 1M target", tps));

    System.out.printf("✅ Achieved: %.0f TPS%n", tps);
}
```

### Latency Testing

```java
@Test
void testLatency() {
    List<Long> latencies = new ArrayList<>();

    for (int i = 0; i < 10_000; i++) {
        long start = System.nanoTime();
        service.process("item-" + i);
        long latency = System.nanoTime() - start;
        latencies.add(latency);
    }

    // Calculate percentiles
    Collections.sort(latencies);
    long p50 = latencies.get(latencies.size() / 2);
    long p99 = latencies.get((int) (latencies.size() * 0.99));

    // Assert targets
    assertTrue(p50 < 1_000_000, "P50 latency > 1ms");
    assertTrue(p99 < 10_000_000, "P99 latency > 10ms");

    System.out.printf("✅ P50: %dus, P99: %dus%n",
        p50 / 1000, p99 / 1000);
}
```

---

## Troubleshooting

### Test Failures

```bash
# Run with verbose output
./mvnw test -X

# Run single test to isolate issue
./mvnw test -Dtest=MyTest#specificMethod

# Skip flaky tests temporarily
./mvnw test -Dtest=!FlakyTest
```

### Coverage Issues

```bash
# Check what's not covered
./mvnw jacoco:report
open target/site/jacoco/index.html
# Look for red/yellow sections

# Increase logging
./mvnw test -Dquarkus.log.level=DEBUG
```

### Performance Test Timeouts

```bash
# Increase timeout
@Timeout(value = 300, unit = TimeUnit.SECONDS)

# Or run with more resources
export MAVEN_OPTS="-Xmx8g"
./mvnw test
```

---

## Best Practices

### ✅ DO

1. **Write tests first**: Test-driven development
2. **Keep tests fast**: Unit tests < 1s, integration < 10s
3. **Use descriptive names**: `testProcessTransactionWithValidInput`
4. **Test edge cases**: null, empty, large values
5. **Isolate tests**: No shared state between tests
6. **Mock external dependencies**: Use Mockito
7. **Use assertions**: Multiple assertions per test is OK
8. **Clean up resources**: Use @AfterEach, @AfterAll

### ❌ DON'T

1. **Don't skip tests**: Fix failing tests immediately
2. **Don't test implementation**: Test behavior, not internals
3. **Don't use random data**: Reproducible tests only
4. **Don't ignore warnings**: Fix test warnings promptly
5. **Don't write huge tests**: Split into smaller tests
6. **Don't test framework code**: Test your code only
7. **Don't depend on test order**: Tests should be independent
8. **Don't commit failing tests**: All tests must pass

---

## Resources

### Documentation
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Quarkus Testing Guide](https://quarkus.io/guides/getting-started-testing)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/)
- [TestContainers Guide](https://www.testcontainers.org/)
- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)

### Internal Documentation
- [CODE-REVIEW-AND-REFACTORING-PLAN.md](../../CODE-REVIEW-AND-REFACTORING-PLAN.md)
- [V3.7.3-PHASE1-IMPLEMENTATION-PLAN.md](../../V3.7.3-PHASE1-IMPLEMENTATION-PLAN.md)
- [REFACTORING-SESSION-SUMMARY.md](../../REFACTORING-SESSION-SUMMARY.md)

---

## Next Steps (Phase 1)

### This Week (Oct 7-13)
1. ✅ Complete test infrastructure setup
2. 🚧 Add ConsensusService tests (15+ tests)
3. 🚧 Add CryptoService tests (18+ tests)
4. 🚧 Add BridgeService tests (12+ tests)

### Next Week (Oct 14-20)
1. Extract BlockchainApiResource
2. Extract ConsensusApiResource
3. Extract CryptoApiResource
4. Fix 15 critical TODOs

### Success Criteria
- ✅ Test infrastructure complete
- 🎯 50% line coverage achieved
- 🎯 100+ test methods added
- 🎯 CI/CD pipeline running

---

**Status**: ✅ **TEST INFRASTRUCTURE COMPLETE**
**Ready For**: Phase 1 test development
**Next Milestone**: October 21, 2025 (V3.7.3 Release)

---

*For questions or issues, refer to the V3.7.3 Phase 1 Implementation Plan or contact the Test Lead.*
