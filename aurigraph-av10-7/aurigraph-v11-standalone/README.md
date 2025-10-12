# Aurigraph V11 Standalone

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.28.2-blue.svg)](https://quarkus.io/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/Coverage-Phase%201%20Target%2050%25-yellow.svg)]()

High-performance blockchain platform targeting 2M+ TPS with quantum-resistant cryptography and AI-driven consensus.

**Current Version**: 11.0.0 (V3.7.3 Phase 1)
**Framework**: Quarkus - the Supersonic Subatomic Java Framework
**Runtime**: GraalVM Native with Java 21 Virtual Threads

If you want to learn more about Quarkus, please visit its website: <https://quarkus.io/>.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
./mvnw compile quarkus:dev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell script
./mvnw package
```

It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

The application is now runnable using `java -jar target/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell script
./mvnw package -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar target/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell script
./mvnw package -Dnative
```

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell script
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/aurigraph-v11-standalone-11.0.0-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Related Guides

- SmallRye Health ([guide](https://quarkus.io/guides/smallrye-health)): Monitor service health
- REST Jackson ([guide](https://quarkus.io/guides/rest#json-serialisation)): Jackson serialization support for Quarkus REST. This extension is not compatible with the quarkus-resteasy extension, or any of the extensions that depend on it
- Micrometer Registry Prometheus ([guide](https://quarkus.io/guides/micrometer)): Enable Prometheus support for Micrometer

## Provided Code

### REST

Easily start your REST Web Services

[Related guide section...](https://quarkus.io/guides/getting-started-reactive#reactive-jax-rs-resources)

### SmallRye Health

Monitor your application's health using SmallRye Health

[Related guide section...](https://quarkus.io/guides/smallrye-health)

## 📊 Test Coverage

Aurigraph V11 uses [JaCoCo](https://www.jacoco.org/) for comprehensive code coverage analysis.

### Generate Coverage Report

```bash
# Quick method - generates HTML, XML, and CSV reports
./generate-coverage-report.sh

# Manual method
./mvnw clean test jacoco:report

# View report
open target/site/jacoco/index.html  # macOS
# or navigate to target/site/jacoco/index.html in browser
```

### Coverage Targets (V3.7.3 Phase 1)

| Package | Line Coverage | Branch Coverage | Status |
|---------|--------------|-----------------|--------|
| **Overall Project** | ≥50% | ≥45% | 🎯 Target |
| **Crypto** (`io.aurigraph.v11.crypto.*`) | ≥98% | ≥95% | 🔴 Critical |
| **Consensus** (`io.aurigraph.v11.consensus.*`) | ≥95% | ≥90% | 🔴 Critical |
| **Bridge** (`io.aurigraph.v11.bridge.*`) | ≥85% | ≥80% | 🟡 High |

### Coverage Reports Location

- **HTML Report**: `target/site/jacoco/index.html` (interactive, detailed)
- **XML Report**: `target/site/jacoco/jacoco.xml` (CI/CD integration)
- **CSV Report**: `target/site/jacoco/jacoco.csv` (data analysis)
- **Execution Data**: `target/jacoco.exec` (binary coverage data)

### Phase 1 Testing Progress

**Week 1** (✅ Complete):
- ✅ Test infrastructure setup (JaCoCo, Mockito, TestContainers)
- ✅ ConsensusService tests (19 test methods)
- ✅ CryptoService tests (18 test methods)
- ✅ BridgeService tests (20 test methods)
- ✅ Performance validation tests (6 benchmark tests)

**Week 2** (🚧 In Progress):
- ✅ API resource extraction (4 modular resources)
- 🚧 JaCoCo coverage configuration
- 📋 High-priority TODO fixes

**Total Test Methods**: 63+  
**Test Execution**: Pending Quarkus test framework fix

## 🧪 Running Tests

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=TransactionServiceTest

# Run specific test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# Run with coverage
./mvnw clean test jacoco:report

# Skip tests during build
./mvnw package -DskipTests
```

### Test Categories

```
src/test/java/
├── io/aurigraph/v11/
│   ├── unit/                    # Unit tests (fast, isolated)
│   │   ├── TransactionServiceTest.java
│   │   ├── ConsensusServiceTest.java
│   │   ├── CryptoServiceTest.java
│   │   └── BridgeServiceTest.java
│   ├── integration/             # Integration tests (slower, dependencies)
│   └── performance/             # Performance benchmarks
│       └── PerformanceValidationTest.java
```

