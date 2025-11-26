# Quick Start Testing Guide - Sprint 18 Test Suite

## Overview

**1,333 test methods** ready for implementation across **21 test files**

---

## File Structure

```
21 Test Files (1,333 Total Tests):

CONSENSUS LAYER (5 files, ~135 tests)
├── LeaderElectionTest.java (15)          → Leader election validation
├── LogReplicationTest.java (20)          → Log replication & consistency
├── RaftStateTest.java (15)               → State management
├── TransactionProcessingTest.java (20)   → Transaction ordering
└── HyperRAFTConsensusServiceTest.java    → Consensus integration

SECURITY & CRYPTOGRAPHY (3 files, ~110 tests)
├── TransactionEncryptionTest.java (15)   → Transaction payload encryption
├── BridgeEncryptionTest.java (12)        → Cross-chain bridge encryption
└── SecurityAdversarialTest.java (50+)    → Attack prevention, crypto validation

INFRASTRUCTURE (3 files, ~100+ tests)
├── P2PNetworkTest.java (50)              → Peer discovery, routing, partitions
├── StoragePersistenceTest.java (50)      → ACID compliance, replication
└── PerformanceLoadTest.java (50)         → Throughput, latency, scaling

BLOCKCHAIN CORE (5 files, ~330 tests)
├── BlockchainOperationsTest.java (65)    → Block operations, chain management
├── SmartContractTest.java (60)           → Contract deployment & execution
├── TransactionLifecycleTest.java (65)    → Transaction state machine
├── StateManagementTest.java (65)         → Ledger state, consistency
└── AssetManagementTest.java (70)         → Asset lifecycle, transfers

ADVANCED FEATURES (5 files, ~310 tests)
├── DeFiProtocolTest.java (65)            → Liquidity, swaps, lending, staking
├── CrossChainBridgeTest.java (60)        → Bridge validation, state sync
├── GovernanceOperationsTest.java (60)    → Voting, proposals, treasury
├── RWATokenizationTest.java (65)         → Asset tokenization, compliance
└── OracleIntegrationTest.java (65)       → Price feeds, data validation

INTEGRATION & COMPLIANCE (5 files, ~300 tests)
├── EndToEndTest.java (65)                → Full workflow validation
├── ErrorHandlingTest.java (55+)          → Edge cases, error paths
├── APIEndpointTest.java (65+)            → REST/gRPC endpoints
├── ProtocolComplianceTest.java (75+)     → JSON-RPC, HTTP/2, TLS, standards
└── UpgradeScenarioTest.java (60)         → Upgrade paths, compatibility
```

---

## Quick Setup (5 minutes)

### 1. Verify Project Structure
```bash
cd aurigraph-v11-standalone

# Check all test files exist
find src/test/java/io/aurigraph/v11 -name "*Test.java" -type f | wc -l
# Should output: 21
```

### 2. Compile All Tests
```bash
./mvnw clean test-compile

# Expected output:
# [INFO] Compiling 24 source files with javac...
# [INFO] BUILD SUCCESS
```

### 3. Count Total Tests
```bash
find src/test/java -name "*Test.java" | xargs grep -c "void test" | \
  awk -F: '{sum+=$2} END {print "Total tests:", sum}'

# Expected output:
# Total tests: 1333
```

### 4. List All Test Files
```bash
find src/test/java/io/aurigraph/v11 -name "*Test.java" -type f | \
  sort | \
  xargs -I {} basename {} | \
  sed 's/Test.java//' | \
  awk '{print NR ". " $0}'
```

---

## Running Tests

### Run All Tests
```bash
./mvnw test
```

### Run Specific Test File
```bash
./mvnw test -Dtest=LeaderElectionTest
./mvnw test -Dtest=SecurityAdversarialTest
./mvnw test -Dtest=DeFiProtocolTest
```

### Run Specific Test Method
```bash
./mvnw test -Dtest=LeaderElectionTest#testLeaderElection
```

### Run with Tags (when @Tag annotations added)
```bash
./mvnw test -Dgroups=consensus
./mvnw test -Dgroups=security
./mvnw test -Dgroups=integration
```

### Run with Coverage
```bash
./mvnw clean test jacoco:report
open target/site/jacoco/index.html
```

---

## Implementation Priority

### PHASE 1: Days 1-2 (HIGH PRIORITY)
Start with these 50 tests:
```
LeaderElectionTest.java             (15 tests)
LogReplicationTest.java             (20 tests)
TransactionProcessingTest.java      (15 tests)
```

**Why**: These are foundational - all other tests depend on them

**Example**:
```java
@Test
void testLeaderElection() {
    // Setup cluster
    RaftCluster cluster = new RaftCluster(5);

    // Trigger election
    cluster.triggerElectionTimeout();

    // Verify leader elected
    assertNotNull(cluster.getLeader());
}
```

### PHASE 2: Days 3-4 (HIGH PRIORITY)
Next 100 tests:
```
SecurityAdversarialTest.java        (50 tests)
TransactionLifecycleTest.java       (65 tests)
ErrorHandlingTest.java              (50 tests)
```

**Why**: Security must be validated early; foundational patterns

### PHASE 3: Days 5-6 (MEDIUM PRIORITY)
Next 150 tests:
```
StoragePersistenceTest.java         (50 tests)
StateManagementTest.java            (65 tests)
BlockchainOperationsTest.java       (65 tests)
```

**Why**: Data layer validation; foundation for advanced features

### PHASE 4: Days 7-8 (MEDIUM PRIORITY)
Next 200 tests:
```
DeFiProtocolTest.java               (65 tests)
CrossChainBridgeTest.java           (60 tests)
EndToEndTest.java                   (65 tests)
APIEndpointTest.java                (65 tests)
```

### PHASE 5: Days 9-10 (FINAL)
Remaining tests & optimization:
```
All remaining tests
Performance optimization
Coverage to 95%
Quality gates validation
```

---

## Common Test Templates

### Template 1: Simple Unit Test
```java
@Test
@DisplayName("Should verify basic operation")
void testBasicOperation() {
    // Arrange
    Input input = createInput();

    // Act
    Output output = operation(input);

    // Assert
    assertEquals(expected, output);
}
```

### Template 2: Async Operation Test
```java
@Test
@Timeout(value = 5, unit = TimeUnit.SECONDS)
void testAsyncOperation() {
    // Arrange
    Async<Result> async = asyncOperation();

    // Act
    async.execute();

    // Assert
    Awaitility.await()
        .atMost(Duration.ofSeconds(5))
        .until(() -> async.isDone());

    assertTrue(async.isSuccessful());
}
```

### Template 3: Exception Test
```java
@Test
void testExceptionHandling() {
    assertThrows(IllegalArgumentException.class, () -> {
        operation(invalidInput);
    });
}
```

### Template 4: Integration Test
```java
@Test
@DisplayName("Should integrate multiple components")
void testIntegration() {
    // Setup multi-component environment
    ComponentA a = new ComponentA();
    ComponentB b = new ComponentB();

    // Execute workflow
    a.doSomething();
    b.processResult(a.getResult());

    // Verify end-to-end
    assertEquals(expectedFinalState, system.getState());
}
```

### Template 5: Parameterized Test
```java
@ParameterizedTest
@ValueSource(strings = {"input1", "input2", "input3"})
void testWithMultipleValues(String input) {
    Result result = process(input);
    assertTrue(result.isValid());
}
```

---

## Key Test Fixtures

### TransactionBuilder
```java
Transaction tx = new TransactionBuilder()
    .withFrom(senderAddress)
    .withTo(recipientAddress)
    .withValue(amount)
    .withGas(gasLimit)
    .withGasPrice(gasPrice)
    .signWith(senderPrivateKey)
    .build();
```

### BlockBuilder
```java
Block block = new BlockBuilder()
    .withHeight(blockNumber)
    .withTransactions(transactions)
    .withPreviousHash(parentBlockHash)
    .signWith(minerPrivateKey)
    .build();
```

### StateBuilder
```java
State state = new StateBuilder()
    .withAccount(address, balance)
    .withStorage(contractAddress, storageMap)
    .withNonce(address, nonceValue)
    .build();
```

---

## Troubleshooting

### Test Won't Compile
```bash
# Clean and rebuild
./mvnw clean compile

# Check for syntax errors
./mvnw test-compile -X  # Verbose output
```

### Test Hangs
```bash
# Add timeout to test
@Test
@Timeout(value = 5, unit = TimeUnit.SECONDS)
void testWithTimeout() { ... }

# Or run with timeout
./mvnw test -Dtest.timeout=300
```

### Test Fails Intermittently (Flaky)
```bash
# Run test multiple times
for i in {1..10}; do ./mvnw test -Dtest=TestName; done

# Increase timeout
@Timeout(value = 10, unit = TimeUnit.SECONDS)

# Use Awaitility for async ops
Awaitility.await().atMost(Duration.ofSeconds(5))
```

### Coverage Too Low
```bash
# Check coverage report
./mvnw jacoco:report
open target/site/jacoco/index.html

# Find uncovered lines and add tests for them
# Priority: Exception paths, edge cases, boundary conditions
```

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
- name: Run Tests
  run: ./mvnw clean test

- name: Generate Coverage
  run: ./mvnw jacoco:report

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hook
```bash
#!/bin/bash
./mvnw clean test || exit 1
./mvnw jacoco:report || exit 1
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Methods | 1,040+ | **1,333** ✅ |
| Test Files | 15+ | **21** ✅ |
| Code Coverage | 95% | TBD |
| Build Time | <5 min | TBD |
| Execution Time | <10 min | TBD |
| Flaky Tests | 0% | TBD |

---

## Next Steps

1. **Choose Priority Test** (e.g., LeaderElectionTest)
2. **Implement Test Logic** (replace `assertTrue(true)`)
3. **Add Test Fixtures** (builders, mocks)
4. **Run Test** (`./mvnw test -Dtest=TestName`)
5. **Verify Passes** (green checkmark)
6. **Repeat** for all 1,333 tests

---

## Resources

- [Test Files Directory](src/test/java/io/aurigraph/v11/)
- [Implementation Guide](TEST_IMPLEMENTATION_GUIDE.md)
- [JUnit 5 Documentation](https://junit.org/junit5/)
- [Quarkus Testing](https://quarkus.io/guides/getting-started-testing)

---

## Support

For questions during test implementation:
1. Check TEST_IMPLEMENTATION_GUIDE.md section 9-11
2. Review similar test files for patterns
3. Check JUnit 5 documentation
4. Ask in team Slack channel

---

**Status**: Ready for Development
**Total Tests**: 1,333 methods across 21 files
**Estimated Implementation Time**: 20-30 developer-days
**Target Completion**: End of Sprint 18

Last Updated: 2025-11-08
Created By: Claude Code
