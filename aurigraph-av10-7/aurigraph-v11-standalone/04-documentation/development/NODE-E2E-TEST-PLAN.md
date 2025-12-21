# Aurigraph V12 Node E2E Test Plan

**Version:** 12.0.0
**Last Updated:** December 2025
**Status:** Active
**Coverage Target:** 95%

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Node Type Test Suites](#node-type-test-suites)
4. [Integration Tests](#integration-tests)
5. [Performance Tests](#performance-tests)
6. [LevelDB Storage Tests](#leveldb-storage-tests)
7. [Failure & Recovery Tests](#failure--recovery-tests)
8. [Test Automation](#test-automation)

---

## Overview

This document defines the comprehensive E2E test plan for all 11 Aurigraph V12 node types, ensuring complete functionality coverage and production readiness.

### Test Categories

| Category | Tests | Priority |
|----------|-------|----------|
| Unit Tests | 150+ | P0 |
| Integration Tests | 75+ | P0 |
| E2E Tests | 50+ | P0 |
| Performance Tests | 25+ | P1 |
| Chaos/Failure Tests | 20+ | P1 |
| Security Tests | 30+ | P0 |

### Test Environments

| Environment | Purpose | Nodes |
|-------------|---------|-------|
| Local | Development | 1-3 |
| CI/CD | Automated testing | 5-10 |
| Staging | Pre-production | 21 |
| Production | Live testing | 100+ |

---

## Test Environment Setup

### Prerequisites

```bash
# Java 21
java --version  # Should be 21+

# Maven
./mvnw --version

# Docker
docker --version
docker-compose --version

# LevelDB data directory
mkdir -p /opt/aurigraph-v11/data/leveldb
```

### Test Configuration

```properties
# test/resources/application-test.properties
quarkus.http.port=9003
leveldb.data.path=/tmp/aurigraph-test/leveldb
leveldb.cache.size.mb=64
leveldb.write.buffer.mb=16
leveldb.compression.enabled=true
```

### Starting Test Nodes

```bash
# Start test environment
./mvnw quarkus:test

# Run specific test suite
./mvnw test -Dtest=ValidatorNodeTest
./mvnw test -Dtest=BusinessNodeTest
./mvnw test -Dtest=EINodeTest

# Run all node tests
./mvnw test -Dtest="*Node*Test"
```

---

## Node Type Test Suites

### 1. ValidatorNode Tests

#### 1.1 Lifecycle Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| VAL-001 | testNodeCreation | Create ValidatorNode | Node created with STOPPED status |
| VAL-002 | testNodeStart | Start ValidatorNode | Status changes to RUNNING |
| VAL-003 | testNodeStop | Stop running node | Status changes to STOPPED |
| VAL-004 | testNodeRestart | Restart node | Node restarts successfully |
| VAL-005 | testMultipleNodes | Create 10 validators | All nodes created independently |

```java
@Test
void testNodeCreation() {
    ValidatorNode node = new ValidatorNode("val-test-001");
    assertNotNull(node);
    assertEquals("val-test-001", node.getNodeId());
    assertFalse(node.isRunning());
}

@Test
void testNodeStart() {
    ValidatorNode node = new ValidatorNode("val-test-002");
    node.start();
    assertTrue(node.isRunning());
    assertTrue(node.isHealthy());
}
```

#### 1.2 Consensus Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| VAL-010 | testLeaderElection | Elect leader from validators | One leader elected |
| VAL-011 | testBlockProposal | Leader proposes block | Block proposed successfully |
| VAL-012 | testBlockValidation | Validate proposed block | Block validated |
| VAL-013 | testQuorumVoting | Vote reaches 67% quorum | Quorum achieved |
| VAL-014 | testConsensusRound | Complete consensus round | Block finalized |

```java
@Test
void testLeaderElection() {
    ValidatorNodeService service = new ValidatorNodeService();

    // Create 3 validators with stakes
    ValidatorNode v1 = service.createAndRegister("val-1").await().indefinitely();
    ValidatorNode v2 = service.createAndRegister("val-2").await().indefinitely();
    ValidatorNode v3 = service.createAndRegister("val-3").await().indefinitely();

    v1.stake(new BigDecimal("1000"));
    v2.stake(new BigDecimal("2000"));  // Highest stake
    v3.stake(new BigDecimal("500"));

    service.start("val-1").await().indefinitely();
    service.start("val-2").await().indefinitely();
    service.start("val-3").await().indefinitely();

    String leaderId = service.electLeader().await().indefinitely();
    assertEquals("val-2", leaderId);  // Highest stake wins
}

@Test
void testQuorumVoting() {
    ValidatorNode leader = new ValidatorNode("leader");
    leader.start();
    leader.becomeLeader();

    // Add 2 more peers (total 3 validators)
    leader.connectPeer("peer-1");
    leader.connectPeer("peer-2");

    // Vote on block (need 67% = 2 of 3)
    leader.voteOnBlock(1, "leader", true);
    assertFalse(leader.hasQuorum(1));  // 1/3 = 33%

    leader.voteOnBlock(1, "peer-1", true);
    assertTrue(leader.hasQuorum(1));   // 2/3 = 67%
}
```

#### 1.3 Mempool Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| VAL-020 | testAddToMempool | Add transactions to mempool | Transactions queued |
| VAL-021 | testMempoolCapacity | Test 1M tx capacity | All transactions added |
| VAL-022 | testMempoolOverflow | Exceed capacity | Oldest dropped |
| VAL-023 | testMempoolDrain | Drain mempool to block | Mempool emptied |

#### 1.4 Staking Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| VAL-030 | testStake | Stake tokens | Balance updated |
| VAL-031 | testUnstake | Unstake tokens | Balance reduced |
| VAL-032 | testStakeExceed | Unstake more than staked | Operation rejected |
| VAL-033 | testTotalStaked | Aggregate stake across network | Sum correct |

---

### 2. BusinessNode Tests

#### 2.1 Transaction Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| BIZ-001 | testSubmitTransaction | Submit single transaction | Transaction processed |
| BIZ-002 | testConcurrentTransactions | Submit 10K concurrent | All processed |
| BIZ-003 | testTransactionValidation | Submit invalid transaction | Rejected with error |
| BIZ-004 | testTransactionTimeout | Long-running transaction | Times out gracefully |
| BIZ-005 | testTransactionQueue | Queue at capacity | Overflow rejected |

```java
@Test
void testSubmitTransaction() {
    BusinessNode node = new BusinessNode("biz-test-001");
    node.start();

    TransactionRequest request = new TransactionRequest(
        "tx-001",
        null,
        Map.of("action", "transfer", "amount", 100),
        Map.of("balance", 900),
        21000
    );

    CompletableFuture<TransactionResult> future = node.submitTransaction(request);
    TransactionResult result = future.get(5, TimeUnit.SECONDS);

    assertTrue(result.isSuccess());
    assertEquals("tx-001", result.getTransactionId());
    assertTrue(result.getGasUsed() > 0);
}

@Test
void testConcurrentTransactions() throws Exception {
    BusinessNode node = new BusinessNode("biz-concurrent");
    node.start();

    List<CompletableFuture<TransactionResult>> futures = new ArrayList<>();

    for (int i = 0; i < 10000; i++) {
        TransactionRequest request = new TransactionRequest(
            "tx-" + i, null, Map.of("i", i), null, 21000
        );
        futures.add(node.submitTransaction(request));
    }

    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
        .get(60, TimeUnit.SECONDS);

    long successCount = futures.stream()
        .map(f -> f.join())
        .filter(TransactionResult::isSuccess)
        .count();

    assertEquals(10000, successCount);
}
```

#### 2.2 Contract Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| BIZ-010 | testRegisterContract | Register smart contract | Contract stored |
| BIZ-011 | testExecuteContract | Execute contract | State updated |
| BIZ-012 | testContractGas | Gas consumption | Gas tracked |
| BIZ-013 | testContractState | Get contract state | State returned |
| BIZ-014 | testContractNotFound | Execute missing contract | Error returned |

```java
@Test
void testRegisterAndExecuteContract() {
    BusinessNode node = new BusinessNode("biz-contract");
    node.start();

    // Register contract
    node.registerContract(
        "token-contract",
        "function transfer(from, to, amount) {...}",
        Map.of("totalSupply", 1000000)
    );

    // Execute contract
    long gasUsed = node.executeContract(
        "token-contract",
        Map.of("action", "transfer", "from", "A", "to", "B", "amount", 100)
    );

    assertTrue(gasUsed > 0);
    assertTrue(gasUsed <= 10_000_000);  // Within gas limit

    // Verify state
    Map<String, Object> state = node.getContractState("token-contract");
    assertNotNull(state);
    assertEquals("transfer", state.get("action"));
}
```

#### 2.3 Workflow Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| BIZ-020 | testStartWorkflow | Start new workflow | Workflow created |
| BIZ-021 | testCompleteStep | Complete workflow step | Step recorded |
| BIZ-022 | testWorkflowStatus | Get workflow status | Status returned |
| BIZ-023 | testMultiStepWorkflow | Complete 5-step workflow | All steps done |

#### 2.4 Audit Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| BIZ-030 | testAuditLogging | Transaction creates audit | Entry logged |
| BIZ-031 | testAuditRetrieval | Get audit entries | Entries returned |
| BIZ-032 | testAuditCapacity | 10K audit entries | Oldest pruned |

---

### 3. EINode Tests

#### 3.1 Exchange Connectivity Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| EI-001 | testConnectExchange | Connect to exchange | Connection established |
| EI-002 | testExchangeRequest | Send request to exchange | Response received |
| EI-003 | testExchangeDisconnect | Disconnect from exchange | Connection closed |
| EI-004 | testMaxConnections | Connect 100 exchanges | All connected |
| EI-005 | testExchangeOverflow | Exceed 100 connections | Rejected |

```java
@Test
void testConnectExchange() {
    EINode node = new EINode("ei-test-001");
    node.start();

    boolean connected = node.connectExchange(
        "binance",
        "wss://stream.binance.com:9443/ws",
        Map.of("apiKey", "test-key")
    );

    assertTrue(connected);

    ExchangeConnection conn = node.getExchange("binance");
    assertNotNull(conn);
    assertTrue(conn.connected);
}

@Test
void testExchangeRequest() throws Exception {
    EINode node = new EINode("ei-request");
    node.start();
    node.connectExchange("test-exchange", "https://api.test.com", Map.of());

    CompletableFuture<ExchangeResponse> future = node.sendExchangeRequest(
        "test-exchange",
        "getPrice",
        Map.of("symbol", "BTC/USD")
    );

    ExchangeResponse response = future.get(5, TimeUnit.SECONDS);
    assertTrue(response.success);
}
```

#### 3.2 Data Feed Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| EI-010 | testSubscribeFeed | Subscribe to data feed | Subscription active |
| EI-011 | testFeedPolling | Poll feed data | Data received |
| EI-012 | testUnsubscribeFeed | Unsubscribe from feed | Subscription removed |
| EI-013 | testMaxFeeds | Subscribe to 500 feeds | All active |
| EI-014 | testFeedOverflow | Exceed 500 feeds | Rejected |

```java
@Test
void testDataFeedSubscription() throws Exception {
    EINode node = new EINode("ei-feed");
    node.start();

    boolean subscribed = node.subscribeToFeed(
        "btc-price",
        "binance",
        "ticker",
        1000  // 1 second interval
    );

    assertTrue(subscribed);

    // Wait for polling
    Thread.sleep(2000);

    Object data = node.getFeedData("btc-price");
    assertNotNull(data);
}
```

#### 3.3 Circuit Breaker Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| EI-020 | testCircuitClosed | Normal operation | Circuit closed |
| EI-021 | testCircuitOpen | 5 failures | Circuit opens |
| EI-022 | testCircuitHalfOpen | After 60s reset | Circuit half-open |
| EI-023 | testCircuitReset | Success in half-open | Circuit closes |

```java
@Test
void testCircuitBreakerOpens() {
    EINode node = new EINode("ei-circuit");
    node.start();
    node.connectExchange("failing-exchange", "https://fail.test", Map.of());

    // Simulate 5 failures (mocked)
    for (int i = 0; i < 5; i++) {
        try {
            node.sendExchangeRequest("failing-exchange", "test", Map.of())
                .get(1, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Expected failure
        }
    }

    // 6th request should fail immediately with circuit open
    try {
        node.sendExchangeRequest("failing-exchange", "test", Map.of())
            .get(1, TimeUnit.SECONDS);
        fail("Should have thrown circuit open exception");
    } catch (Exception e) {
        assertTrue(e.getMessage().contains("Circuit breaker open"));
    }
}
```

#### 3.4 API Gateway Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| EI-030 | testRegisterEndpoint | Register API endpoint | Endpoint registered |
| EI-031 | testCallAPI | Call registered endpoint | Response received |
| EI-032 | testAPIRetry | Retry on failure | Retries up to 3x |
| EI-033 | testAPINotFound | Call missing endpoint | Error returned |

---

## Integration Tests

### 4.1 Multi-Node Consensus Tests

| Test ID | Test Name | Description | Nodes | Expected Result |
|---------|-----------|-------------|-------|-----------------|
| INT-001 | testThreeNodeConsensus | 3-node consensus | 3 VAL | Block finalized |
| INT-002 | testSevenNodeConsensus | 7-node consensus | 7 VAL | Block finalized |
| INT-003 | testTwentyOneNodeConsensus | 21-node consensus | 21 VAL | Block finalized |
| INT-004 | testValidatorBusiness | Validator + Business | 3+3 | TX processed |
| INT-005 | testFullNetwork | All node types | 11 | Network operational |

```java
@Test
void testThreeNodeConsensus() {
    ValidatorNodeService service = new ValidatorNodeService();

    // Create 3 validators
    for (int i = 1; i <= 3; i++) {
        ValidatorNode node = service.createAndRegister("val-" + i)
            .await().indefinitely();
        node.stake(new BigDecimal(i * 1000));
    }

    // Start all
    service.start("val-1").await().indefinitely();
    service.start("val-2").await().indefinitely();
    service.start("val-3").await().indefinitely();

    // Connect peers
    service.connectAllPeers().await().indefinitely();

    // Elect leader
    String leaderId = service.electLeader().await().indefinitely();
    assertNotNull(leaderId);

    // Propose block
    List<String> txs = List.of("tx-1", "tx-2", "tx-3");
    boolean validated = service.proposeBlock(txs).await().indefinitely();
    assertTrue(validated);

    // Vote
    boolean quorum = service.voteOnBlock(1, true).await().indefinitely();
    assertTrue(quorum);
}
```

### 4.2 Cross-Service Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| INT-010 | testValidatorToBusinessFlow | Validator validates, Business executes | TX complete |
| INT-011 | testEIToBusinessFlow | EI receives, Business processes | Data processed |
| INT-012 | testBridgeValidation | Bridge validates cross-chain TX | TX validated |

---

## Performance Tests

### 5.1 TPS Tests

| Test ID | Test Name | Target TPS | Duration | Expected Result |
|---------|-----------|------------|----------|-----------------|
| PERF-001 | testValidatorTPS | 50,000 | 60s | TPS ≥ 50K |
| PERF-002 | testBusinessTPS | 100,000 | 60s | TPS ≥ 100K |
| PERF-003 | testNetworkTPS | 500,000 | 60s | TPS ≥ 500K |
| PERF-004 | testPeakTPS | 2,000,000 | 60s | TPS ≥ 2M |

```java
@Test
void testBusinessNodeTPS() {
    BusinessNode node = new BusinessNode("biz-perf");
    node.start();

    long startTime = System.currentTimeMillis();
    AtomicLong successCount = new AtomicLong(0);
    int targetTPS = 100_000;
    int durationSeconds = 60;
    int totalTransactions = targetTPS * durationSeconds;

    ExecutorService executor = Executors.newFixedThreadPool(100);
    List<CompletableFuture<Void>> futures = new ArrayList<>();

    for (int i = 0; i < totalTransactions; i++) {
        final int txId = i;
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            TransactionRequest request = new TransactionRequest(
                "perf-tx-" + txId, null, Map.of("i", txId), null, 21000
            );
            try {
                TransactionResult result = node.submitTransaction(request)
                    .get(5, TimeUnit.SECONDS);
                if (result.isSuccess()) {
                    successCount.incrementAndGet();
                }
            } catch (Exception e) {
                // Count as failure
            }
        }, executor);
        futures.add(future);
    }

    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
        .join();

    long duration = System.currentTimeMillis() - startTime;
    double actualTPS = (successCount.get() * 1000.0) / duration;

    assertTrue(actualTPS >= targetTPS * 0.95,
        "Expected TPS >= " + (targetTPS * 0.95) + ", got " + actualTPS);
}
```

### 5.2 Latency Tests

| Test ID | Test Name | Target Latency | Percentile | Expected Result |
|---------|-----------|----------------|------------|-----------------|
| PERF-010 | testP50Latency | <10ms | P50 | Latency < 10ms |
| PERF-011 | testP95Latency | <50ms | P95 | Latency < 50ms |
| PERF-012 | testP99Latency | <100ms | P99 | Latency < 100ms |

---

## LevelDB Storage Tests

### 6.1 Persistence Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| DB-001 | testSaveNodeState | Save node state | State persisted |
| DB-002 | testGetNodeState | Retrieve node state | State retrieved |
| DB-003 | testStoreTransaction | Store transaction | TX persisted |
| DB-004 | testStoreBlock | Store block | Block persisted |
| DB-005 | testStoreContractState | Store contract state | State persisted |

```java
@Inject
NodeStorageService storageService;

@Test
void testNodeStatePersistence() {
    String nodeId = "storage-test-001";

    // Save state
    storageService.saveNodeState(nodeId, "blockHeight", "12345")
        .await().indefinitely();

    // Retrieve state
    String value = storageService.getNodeState(nodeId, "blockHeight")
        .await().indefinitely();

    assertEquals("12345", value);
}

@Test
void testBlockStorage() {
    String nodeId = "block-test-001";
    String blockData = "{\"height\":100,\"hash\":\"0xabc\",\"txCount\":50}";

    // Store block
    storageService.storeBlock(nodeId, 100, blockData)
        .await().indefinitely();

    // Retrieve block
    String retrieved = storageService.getBlock(nodeId, 100)
        .await().indefinitely();

    assertEquals(blockData, retrieved);

    // Get latest height
    long height = storageService.getLatestBlockHeight(nodeId)
        .await().indefinitely();

    assertEquals(100, height);
}
```

### 6.2 Batch & Replication Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| DB-010 | testBatchWrite | Batch write 1000 entries | All written |
| DB-011 | testNodeReplication | Replicate data between nodes | Data copied |
| DB-012 | testClearNodeData | Clear all node data | Data cleared |

---

## Failure & Recovery Tests

### 7.1 Node Failure Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| FAIL-001 | testValidatorCrash | Validator crashes | Network continues |
| FAIL-002 | testLeaderCrash | Leader crashes | New leader elected |
| FAIL-003 | testMajorityCrash | 34% validators crash | Network halts |
| FAIL-004 | testBusinessNodeCrash | Business node crashes | TX rerouted |
| FAIL-005 | testEINodeCrash | EI node crashes | Failover succeeds |

```java
@Test
void testLeaderCrashRecovery() {
    ValidatorNodeService service = new ValidatorNodeService();

    // Create 5 validators
    for (int i = 1; i <= 5; i++) {
        ValidatorNode node = service.createAndRegister("val-" + i)
            .await().indefinitely();
        node.stake(new BigDecimal(i * 1000));
        service.start("val-" + i).await().indefinitely();
    }
    service.connectAllPeers().await().indefinitely();

    // Elect leader (val-5 has highest stake)
    String leaderId = service.electLeader().await().indefinitely();
    assertEquals("val-5", leaderId);

    // Crash leader
    service.stop("val-5").await().indefinitely();

    // Elect new leader
    String newLeaderId = service.electLeader().await().indefinitely();
    assertEquals("val-4", newLeaderId);  // Next highest stake

    // Verify network continues
    List<String> txs = List.of("recovery-tx-1");
    boolean validated = service.proposeBlock(txs).await().indefinitely();
    assertTrue(validated);
}
```

### 7.2 Network Partition Tests

| Test ID | Test Name | Description | Expected Result |
|---------|-----------|-------------|-----------------|
| FAIL-010 | testNetworkPartition | Split network 50/50 | Both halves halt |
| FAIL-011 | testPartitionHealing | Heal partition | Network resumes |
| FAIL-012 | testAsymmetricPartition | 67/33 split | Majority continues |

---

## Test Automation

### CI/CD Integration

```yaml
# .github/workflows/node-tests.yml
name: Node E2E Tests

on:
  push:
    branches: [main, V12]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run Unit Tests
        run: ./mvnw test -Dtest="*Node*Test"

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run Integration Tests
        run: ./mvnw verify -Pit

  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run Performance Tests
        run: ./mvnw test -Dtest="*Perf*Test" -DskipUnitTests
```

### Test Reporting

```bash
# Generate test report
./mvnw surefire-report:report

# Generate coverage report
./mvnw jacoco:report

# View reports
open target/site/surefire-report.html
open target/site/jacoco/index.html
```

---

## Appendix: Test Data

### Sample Transaction Request

```json
{
  "transactionId": "tx-test-001",
  "contractId": "token-contract",
  "payload": {
    "action": "transfer",
    "from": "0x1234",
    "to": "0x5678",
    "amount": 1000
  },
  "stateUpdates": {
    "lastTransfer": "2025-12-21T10:00:00Z"
  },
  "gasLimit": 21000
}
```

### Sample Block Data

```json
{
  "height": 100,
  "hash": "0xabc123...",
  "previousHash": "0xdef456...",
  "timestamp": "2025-12-21T10:00:00Z",
  "proposer": "val-001",
  "transactions": ["tx-1", "tx-2", "tx-3"],
  "stateRoot": "0x789..."
}
```

---

*Document maintained by Aurigraph V12 QA Team*
