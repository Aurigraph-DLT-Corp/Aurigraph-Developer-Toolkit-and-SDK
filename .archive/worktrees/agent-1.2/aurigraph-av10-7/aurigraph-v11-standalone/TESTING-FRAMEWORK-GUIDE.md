# Aurigraph V11 Testing Framework Guide

## Overview

The Aurigraph V11 testing framework provides comprehensive testing capabilities including unit tests, integration tests, and performance tests targeting **2M+ TPS sustained performance** (AV11-4002).

## Quick Start Commands

### Standard Tests (Unit Tests Only)
```bash
./mvnw test
```

### Performance Testing Profile
```bash
# Run performance tests with 10-minute timeout and coverage reporting
./mvnw test -Pperformance-test

# Run performance tests with integration tests
./mvnw verify -Pperformance-test
```

### Full Test Suite (Unit + Integration + Performance)
```bash
# Complete test suite with coverage
./mvnw verify -Pfull-test

# Full test suite with detailed reporting
./mvnw clean verify -Pfull-test
```

### Performance Test Scripts
```bash
# Automated performance testing (recommended)
./run-performance-tests.sh

# Individual performance test scripts
./performance-benchmark.sh              # Comprehensive benchmark
./test-2m-tps-performance.sh           # 2M TPS validation
./test-ai-optimizations.sh             # AI optimization tests
./test-native-optimization.sh          # Native compilation performance
./test-ultra-throughput.sh             # Ultra throughput testing
```

## Testing Profiles

### 1. `performance-test` Profile

**Purpose**: Dedicated performance testing with JaCoCo coverage and integration with shell scripts

**Features**:
- 10-minute test timeout
- JaCoCo coverage reporting (80% minimum)
- Automatic execution of `run-performance-tests.sh` during integration-test phase
- 4GB heap with G1GC optimization
- Includes all unit and performance tests

**Usage**:
```bash
./mvnw clean verify -Pperformance-test
```

**Output**:
- Test results in `target/surefire-reports/`
- Coverage reports in `target/site/jacoco/`
- Performance test logs in console

### 2. `full-test` Profile

**Purpose**: Complete test suite for CI/CD pipelines

**Features**:
- All unit tests (`**/*Test.java`)
- All integration tests (`**/*IT.java`)
- JaCoCo coverage reporting
- 4GB heap with G1GC

**Usage**:
```bash
./mvnw clean verify -Pfull-test
```

**CI/CD Integration**:
```yaml
# GitHub Actions example
- name: Run Full Test Suite
  run: ./mvnw clean verify -Pfull-test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./target/site/jacoco/jacoco.xml
```

### 3. Native Build Profiles (Existing)

- `native`: Standard optimized native build
- `native-fast`: Fast development native build (~2 min)
- `native-ultra`: Ultra-optimized production build (~30 min)

## Test Categories

### Unit Tests
Located in `src/test/java/io/aurigraph/v11/`

```bash
# Run specific test class
./mvnw test -Dtest=AurigraphResourceTest

# Run specific test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# Run all unit tests
./mvnw test
```

### Integration Tests
Located in `src/test/java/io/aurigraph/v11/integration/`

```bash
# Run all integration tests
./mvnw verify -Dtest=*IT

# Skip unit tests, run only integration tests
./mvnw verify -DskipTests -Dtest=*IT
```

### Performance Tests
Located in `src/test/java/io/aurigraph/v11/performance/`

```bash
# Performance test suite (Maven)
./mvnw test -Dtest="io.aurigraph.v11.performance.*"

# Performance benchmark scripts
./run-performance-tests.sh
./performance-benchmark.sh
```

## Performance Test Targets (AV11-4002)

| Metric | Target | Validation |
|--------|--------|------------|
| **TPS** | 2,000,000+ | Load testing with graduated increases |
| **P50 Latency** | <10ms | HdrHistogram percentile analysis |
| **P95 Latency** | <50ms | Statistical distribution |
| **P99 Latency** | <100ms | High percentile validation |
| **Leader Election** | <500ms | HyperRAFT++ consensus timing |
| **Connections** | 10,000+ | Network scalability |
| **Memory** | <256MB | Resource monitoring |

## Test Coverage Requirements

### Target Coverage
- **Overall**: 95% line coverage, 90% function coverage
- **Critical Modules**:
  - `crypto/`: 98% (quantum cryptography)
  - `consensus/`: 95% (HyperRAFT++)
  - `grpc/`: 90% (gRPC services)

### Current Coverage
```bash
# Generate coverage report
./mvnw clean verify -Pfull-test

# View coverage report
open target/site/jacoco/index.html
```

### Coverage Check
```bash
# Run coverage validation (fails if below 80%)
./mvnw verify -Pperformance-test jacoco:check
```

## Build + Test Workflows

### Development Workflow
```bash
# 1. Quick unit test during development
./mvnw test

# 2. Validate with performance tests before commit
./mvnw verify -Pperformance-test

# 3. Full validation before PR
./mvnw clean verify -Pfull-test
```

### CI/CD Workflow
```bash
# 1. Build
./mvnw clean package -DskipTests

# 2. Run full test suite
./mvnw verify -Pfull-test

# 3. Build native (if tests pass)
./mvnw package -Pnative-fast

# 4. Validate native performance
./performance-benchmark.sh
```

### Pre-Deployment Workflow
```bash
# 1. Clean build with tests
./mvnw clean verify -Pfull-test

# 2. Build production native
./mvnw clean package -Pnative-ultra

# 3. Run ultra throughput test
./test-ultra-throughput.sh

# 4. Validate 2M TPS target
./test-2m-tps-performance.sh
```

## Test Script Reference

### `run-performance-tests.sh`
Comprehensive performance testing suite

**Usage**:
```bash
./run-performance-tests.sh [OPTIONS]

Options:
  --profile PROFILE   Quarkus profile (dev/prod)
  --timeout SECONDS   Test timeout (default: 600)
  --help             Show help
```

### `performance-benchmark.sh`
JMeter-integrated load testing

**Features**:
- Graduated load testing (1K → 2M TPS)
- HdrHistogram latency analysis
- Peak performance validation

### `test-2m-tps-performance.sh`
Validates 2M+ TPS target achievement

### `test-ai-optimizations.sh`
Tests ML-based consensus optimization

### `test-native-optimization.sh`
Validates native compilation performance

### `test-ultra-throughput.sh`
Stress testing beyond capacity (150% load)

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout in pom.xml or via command line
./mvnw test -Dsurefire.timeout=1200
```

### Out of Memory Errors
```bash
# Increase heap size
./mvnw test -DargLine="-Xmx8g -XX:+UseG1GC"
```

### Performance Tests Fail
```bash
# Check system resources
# Ensure 8GB+ RAM, 4+ CPU cores available
# Verify no other heavy processes running

# Run with debug logging
./run-performance-tests.sh --profile dev
```

### Coverage Reports Missing
```bash
# Ensure JaCoCo plugin is active
./mvnw clean verify -Pperformance-test
open target/site/jacoco/index.html
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Test Suite

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

      - name: Run Full Test Suite
        run: ./mvnw clean verify -Pfull-test

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./target/site/jacoco/jacoco.xml
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh './mvnw clean package -DskipTests'
            }
        }
        stage('Test') {
            steps {
                sh './mvnw verify -Pfull-test'
            }
        }
        stage('Performance') {
            steps {
                sh './run-performance-tests.sh'
            }
        }
    }
}
```

## Best Practices

### Before Committing
1. Run unit tests: `./mvnw test`
2. Validate performance: `./mvnw verify -Pperformance-test`
3. Check coverage: View `target/site/jacoco/index.html`

### Before Creating PR
1. Run full test suite: `./mvnw clean verify -Pfull-test`
2. Run performance scripts: `./performance-benchmark.sh`
3. Verify all tests pass

### Before Deployment
1. Clean build with tests: `./mvnw clean verify -Pfull-test`
2. Build native: `./mvnw package -Pnative-ultra`
3. Validate performance: `./test-2m-tps-performance.sh`
4. Verify metrics meet targets

## Continuous Improvement

### Adding New Tests
1. Create test class in appropriate package
2. Follow naming convention: `*Test.java` (unit), `*IT.java` (integration)
3. Ensure tests are idempotent and isolated
4. Update this guide if new test categories added

### Performance Baselines
Update performance baselines in `PERFORMANCE_TESTING.md` when:
- New optimizations improve TPS
- Infrastructure changes affect performance
- New features impact throughput

---

**Version**: 11.3.0
**Last Updated**: October 14, 2025
**Status**: Production Ready
**Performance**: 1.82M TPS (91% of 2M target)
