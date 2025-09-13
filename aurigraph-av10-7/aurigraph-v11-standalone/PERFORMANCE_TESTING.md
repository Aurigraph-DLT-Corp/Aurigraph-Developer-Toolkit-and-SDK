# Aurigraph V11 Performance Testing Framework

## Overview

This document describes the comprehensive performance testing framework for **Aurigraph V11** that validates the **AV11-4002** requirement of **2M+ TPS sustained performance**. The framework includes advanced testing capabilities for consensus algorithms, network performance, load testing, and detailed performance reporting.

## 🎯 Performance Targets (AV11-4002)

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Transactions Per Second (TPS)** | 2,000,000+ | Load testing with graduated increases |
| **P50 Latency** | <10ms | HdrHistogram percentile analysis |
| **P95 Latency** | <50ms | Statistical latency distribution |
| **P99 Latency** | <100ms | High percentile performance validation |
| **Leader Election** | <500ms | HyperRAFT++ consensus timing |
| **Concurrent Connections** | 10,000+ | Network scalability testing |
| **Memory Usage** | <256MB | Resource utilization monitoring |

## 🏗️ Framework Architecture

### Core Components

```
src/test/java/io/aurigraph/v11/performance/
├── PerformanceBenchmarkSuite.java      # Main test suite coordinator
├── ConsensusTestHarness.java           # HyperRAFT++ consensus testing
├── LoadTestRunner.java                 # JMeter-integrated load testing
├── NetworkPerformanceTest.java         # gRPC and network validation
└── PerformanceReporter.java            # Comprehensive reporting system
```

### Test Categories

1. **System Warmup and Baseline** - Establishes performance baseline
2. **Graduated Load Testing** - Progressive load increases (1K → 2M TPS)
3. **Peak Performance Validation** - 2M+ TPS target validation
4. **Consensus Performance Testing** - HyperRAFT++ algorithm validation
5. **Network Performance Testing** - gRPC and connection scalability
6. **Stress Testing** - Beyond-capacity testing (150% load)
7. **Endurance Testing** - Sustained performance (10-minute duration)

## 🚀 Quick Start

### Prerequisites

- **Java 21+** (with Virtual Threads support)
- **Maven 3.8+**
- **8GB+ RAM** (recommended for peak performance tests)
- **4+ CPU cores**
- **Linux/macOS** (Windows supported with limitations)

### Running Tests

#### Option 1: Automated Script (Recommended)

```bash
# Run all performance tests with default configuration
./run-performance-tests.sh

# Run with specific profile
./run-performance-tests.sh --profile prod

# Run with custom timeout (in seconds)
./run-performance-tests.sh --timeout 3600

# Show help
./run-performance-tests.sh --help
```

#### Option 2: Maven Direct Execution

```bash
# Run all performance tests
mvn test -Dtest="io.aurigraph.v11.performance.*"

# Run specific test category
mvn test -Dtest="PerformanceBenchmarkSuite#testPeakPerformance"

# Run with specific profile
mvn test -Dtest="PerformanceBenchmarkSuite" -Dquarkus.profile=prod
```

#### Option 3: Individual Test Execution

```bash
# Peak performance validation
mvn test -Dtest="PerformanceBenchmarkSuite#testPeakPerformance"

# Consensus performance
mvn test -Dtest="PerformanceBenchmarkSuite#testConsensusPerformance"

# Network performance
mvn test -Dtest="PerformanceBenchmarkSuite#testNetworkPerformance"
```

## 📊 Performance Test Details

### 1. Graduated Load Testing

Progressive load increases to identify system capacity:

```java
int[] loadLevels = {1_000, 10_000, 100_000, 500_000, 1_000_000, 2_000_000};
```

- **Duration**: 30 seconds per level
- **Ramp-up**: 30 seconds
- **Validation**: 90%+ of target TPS achievement
- **Metrics**: TPS, latency distribution, success rate

### 2. Peak Performance Validation

Critical test for AV11-4002 compliance:

- **Target**: 2,000,000+ TPS sustained
- **Duration**: 60 seconds
- **Validation**: All performance targets must be met
- **Critical Assertions**:
  ```java
  assertTrue(actualTps >= TARGET_TPS);
  assertTrue(p99LatencyMs <= TARGET_P99_LATENCY_MS);
  assertTrue(memoryUsageMb <= TARGET_MEMORY_USAGE_MB);
  ```

### 3. Consensus Performance Testing

HyperRAFT++ algorithm validation:

- **Leader Election**: <500ms convergence time
- **Consensus TPS**: 100,000+ transactions through consensus
- **Byzantine Fault Tolerance**: 33% malicious nodes
- **Validator Support**: 100+ validators
- **Block Finalization**: Average finalization time
- **Validation Pipeline**: 99.99%+ success rate

### 4. Network Performance Testing

gRPC and network infrastructure validation:

- **Concurrent Connections**: 10,000+ simultaneous
- **Connection Establishment**: <100ms average
- **gRPC Latency**: P99 <200ms
- **Network Throughput**: 1GB/s+ data transfer
- **HTTP/2 Multiplexing**: 100 concurrent streams
- **Connection Pooling**: Efficient resource utilization

### 5. Stress Testing

Beyond-capacity testing:

- **Load**: 150% of target capacity (3M TPS)
- **Duration**: 30 seconds
- **Validation**: System stability maintenance
- **Success Criteria**: >95% success rate under stress

### 6. Endurance Testing

Sustained performance validation:

- **Load**: 80% of peak capacity (1.6M TPS)
- **Duration**: 10 minutes (10 x 1-minute intervals)
- **Validation**: Performance stability over time
- **Degradation Threshold**: <5% TPS reduction

## 📈 Performance Monitoring

### Real-time Metrics

The framework collects comprehensive real-time metrics:

```java
// Performance tracking with HdrHistogram
private final Histogram latencyHistogram = new Histogram(1, TimeUnit.MINUTES.toMicros(1), 3);

// Thread-safe counters
private final AtomicLong totalTransactions = new AtomicLong(0);
private final AtomicLong successfulTransactions = new AtomicLong(0);
private final AtomicReference<Double> currentTps = new AtomicReference<>(0.0);
```

### Key Performance Indicators

- **Throughput**: Current and peak TPS
- **Latency**: P50, P95, P99, P99.9 percentiles
- **Success Rate**: Transaction success percentage
- **Resource Usage**: Memory, CPU, network utilization
- **Consensus Metrics**: Leader election time, block finalization
- **Network Metrics**: Connection counts, data transfer rates

## 📋 Test Configuration

### Environment Profiles

#### Development Profile (`dev`)
```properties
%dev.performance.target.tps=100000
%dev.test.benchmark.duration.seconds=30
%dev.test.endurance.duration.minutes=2
```

#### Test Profile (`test`)
```properties
%test.performance.target.tps=500000
%test.test.benchmark.duration.seconds=45
%test.test.endurance.duration.minutes=5
```

#### Production Profile (`prod`)
```properties
%prod.performance.target.tps=2000000
%prod.test.benchmark.duration.seconds=120
%prod.test.endurance.duration.minutes=30
```

### JVM Optimization

Recommended JVM settings for performance testing:

```bash
JAVA_OPTS="-Xmx4g -Xms2g -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+OptimizeStringConcat"
```

### System Optimizations

```bash
# Increase file descriptor limits
ulimit -n 65536

# Enable virtual thread optimization
-Djdk.virtualThreadScheduler.parallelism=256
```

## 📊 Reporting System

### Report Types Generated

1. **Executive Summary** (`executive-summary.txt`)
   - High-level pass/fail status
   - Target achievement summary
   - Compliance assessment

2. **HTML Dashboard** (`performance-dashboard.html`)
   - Interactive performance metrics
   - Visual charts and graphs
   - Detailed test results

3. **JSON Metrics** (`metrics-data.json`)
   - Raw performance data
   - Machine-readable format
   - Integration with monitoring tools

4. **CSV Data Export** (`performance-data.csv`)
   - Spreadsheet-compatible format
   - Statistical analysis ready
   - Time-series data

### Sample Report Output

```
AURIGRAPH V11 PERFORMANCE TEST EXECUTIVE SUMMARY
================================================================================

Performance Targets Assessment:
TPS Target (2M+):      ✅ ACHIEVED (2,150,000 TPS achieved)
P50 Latency (<10ms):   ✅ ACHIEVED (8.2ms)
P95 Latency (<50ms):   ✅ ACHIEVED (42.1ms)
P99 Latency (<100ms):  ✅ ACHIEVED (89.3ms)
Memory Usage (<256MB): ✅ ACHIEVED (234MB)
Leader Election (<500ms): ✅ ACHIEVED (387ms)
Concurrent Connections (10K+): ✅ ACHIEVED (12,500)

Overall Assessment: ✅ COMPLIANT
Recommendation: System meets all performance requirements for production deployment.
```

## 🔧 Advanced Configuration

### Custom Test Scenarios

Create custom test scenarios by extending the base test classes:

```java
@Test
public void testCustomLoadPattern() {
    LoadTestConfig config = LoadTestConfig.builder()
        .targetTps(1_500_000)
        .duration(Duration.ofMinutes(5))
        .testType(LoadTestType.CUSTOM)
        .build();
    
    LoadTestResult result = loadTestRunner.runLoadTest(config);
    // Custom validation logic
}
```

### JMeter Integration

The framework integrates with Apache JMeter for professional-grade load testing:

```java
// Custom JMeter sampler for Aurigraph transactions
public class AurigraphTransactionSampler implements JavaSamplerClient {
    @Override
    public SampleResult runTest(JavaSamplerContext context) {
        // Custom transaction processing logic
    }
}
```

### Consensus Testing Customization

Configure consensus testing parameters:

```properties
consensus.test.validator.count=100
consensus.test.byzantine.node.percentage=33
consensus.test.throughput.batches=100
consensus.test.batch.size=1000
```

## 🐛 Troubleshooting

### Common Issues

#### Out of Memory Errors
```bash
# Increase heap size
export JAVA_OPTS="-Xmx8g -Xms4g"

# Enable G1GC for better memory management
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
```

#### File Descriptor Limits
```bash
# Check current limits
ulimit -n

# Increase for current session
ulimit -n 65536

# Permanent increase (add to /etc/security/limits.conf)
* soft nofile 65536
* hard nofile 65536
```

#### Test Timeouts
```bash
# Increase test timeout
./run-performance-tests.sh --timeout 3600

# Or set environment variable
export TEST_TIMEOUT=3600
```

### Performance Debugging

Enable detailed logging:

```properties
quarkus.log.level=DEBUG
quarkus.log.category."io.aurigraph.v11.performance".level=TRACE
```

Monitor JVM performance:

```bash
# Enable JFR recording
-XX:+FlightRecorder -XX:StartFlightRecording=duration=300s,filename=performance.jfr

# GC logging
-Xlog:gc*:gc.log:time
```

## 📝 Test Results Interpretation

### Pass Criteria

A test **PASSES** if:
- All performance targets are met or exceeded
- No critical errors occur
- Success rate ≥ 99.5%
- Memory usage within limits
- System stability maintained

### Fail Criteria

A test **FAILS** if:
- Any performance target is not met
- Critical system errors occur
- Success rate < 99.5%
- Memory usage exceeds limits
- System becomes unstable

### Performance Analysis

Key metrics for analysis:

1. **Throughput Trends**: Look for performance plateaus or degradation
2. **Latency Distribution**: Identify outliers and consistency
3. **Resource Utilization**: Monitor CPU, memory, and network usage
4. **Error Patterns**: Analyze failure modes and frequencies
5. **Scalability Characteristics**: Understand system limits

## 🔄 Continuous Integration

### Jenkins Pipeline Integration

```groovy
pipeline {
    stages {
        stage('Performance Testing') {
            steps {
                sh './run-performance-tests.sh --profile prod --timeout 3600'
                publishHTML([
                    reportDir: 'target/performance-reports',
                    reportFiles: 'performance-dashboard.html',
                    reportName: 'Performance Report'
                ])
            }
        }
    }
}
```

### GitHub Actions Integration

```yaml
- name: Run Performance Tests
  run: |
    chmod +x run-performance-tests.sh
    ./run-performance-tests.sh --profile test
    
- name: Upload Performance Reports
  uses: actions/upload-artifact@v3
  with:
    name: performance-reports
    path: target/performance-reports/
```

## 📚 References

- [AV11-4002 Performance Requirements](../docs/AV11-4002-PERFORMANCE-SPEC.md)
- [HyperRAFT++ Consensus Algorithm](../docs/HYPERRAFT-CONSENSUS.md)
- [Aurigraph V11 Architecture](../docs/AURIGRAPH-V11-ARCHITECTURE.md)
- [JMeter Documentation](https://jmeter.apache.org/usermanual/)
- [Quarkus Performance Guide](https://quarkus.io/guides/performance-measure)

## 🤝 Contributing

To contribute to the performance testing framework:

1. Follow the existing code structure and patterns
2. Add comprehensive test coverage for new features
3. Update documentation for configuration changes
4. Ensure all tests pass before submitting PRs
5. Include performance impact analysis for changes

## 📄 License

This performance testing framework is part of the Aurigraph V11 project and follows the same licensing terms.

---

**🚀 Happy Performance Testing!**

*Aurigraph V11 - Delivering 2M+ TPS Blockchain Performance*