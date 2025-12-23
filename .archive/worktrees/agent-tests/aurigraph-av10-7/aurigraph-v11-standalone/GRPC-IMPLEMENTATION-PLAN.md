# gRPC Service Layer Implementation Plan
## HTTP/2 Multiplexing Architecture for Aurigraph V11

**Date**: November 13, 2025
**Target**: HTTP/2 gRPC for all V11 services
**Timeline**: 4-6 weeks
**Expected Performance Impact**: +300-500K TPS from protocol optimization

---

## 📋 Executive Summary

### Current State
- ✅ Proto files cleaned up (no duplicate definitions)
- ✅ Protobuf compilation working (10 service stubs generated)
- ✅ Service stub implementations started (7 services)
- ✅ pom.xml correctly configured (single-pass protobuf compilation)

### What We're Building
- HTTP/2 multiplexing: 100+ concurrent streams per connection
- Binary Protobuf serialization: 4-10x more efficient than JSON
- HyperRAFT++ consensus over gRPC
- Real-time bidirectional streaming for blockchain events
- Automatic fallback to REST API

### Performance Impact
- **Protocol Efficiency**: 4-10x smaller message size
- **Multiplexing**: 100x more concurrent streams
- **Latency**: 20-30% reduction from HTTP/1.1
- **Throughput**: +300-500K TPS estimated

---

## 🏗️ Architecture Overview

### Current V11 Stack
```
┌─────────────────────────────────────────────────┐
│         Portal v4.6.0 (React)                  │
│  RWAT | Merkle Tree | Compliance Dashboard    │
└─────────────────────────────────────────────────┘
                    ▼
        ┌─────────────────────────┐
        │  NGINX API Gateway      │
        │  :80, :443 (TLS 1.3)    │
        └─────────────────────────┘
                    ▼
        ┌─────────────────────────────────────────┐
        │   V11 Core Services (Java/Quarkus)     │
        │   Port 9003: REST API (HTTP/1.1)       │
        │   Port 9004: gRPC (HTTP/2) - PLANNED   │
        └─────────────────────────────────────────┘
                    ▼
        ┌─────────────────────────┐
        │   PostgreSQL + RocksDB  │
        │   Cache Layer (Redis)   │
        └─────────────────────────┘
```

### Planned gRPC Services
```
├── NetworkService (Port 9004/network)
│   ├── GetNetworkStatus() → NetworkStatus
│   ├── GetPeerList() → PeerList
│   ├── BroadcastMessage() → BroadcastResult
│   └── SubscribeNetworkEvents() → stream NetworkEvent
│
├── BlockchainService (Port 9004/blockchain)
│   ├── GetBlock() → Block
│   ├── GetBlockByHeight() → Block
│   ├── SubmitBlock() → BlockResult
│   ├── StreamBlocks() → stream Block
│   └── ValidateBlock() → ValidationResult
│
├── TransactionService (Port 9004/transaction)
│   ├── SubmitTransaction() → TransactionReceipt
│   ├── BatchSubmitTransactions() → TransactionBatch
│   ├── GetTransactionStatus() → TransactionStatus
│   └── StreamTransactions() → stream Transaction
│
├── ConsensusService (Port 9004/consensus)
│   ├── ProposeBlock() → ProposalResult
│   ├── VoteOnBlock() → VoteResult
│   ├── CommitBlock() → CommitResult
│   ├── AppendLogEntry() → LogResult
│   └── GetConsensusState() → ConsensusState
│
├── TraceabilityService (Port 9004/traceability)
│   ├── GetAssetTrace() → AssetTrace
│   ├── RecordTransaction() → TraceResult
│   └── StreamAssetEvents() → stream AssetEvent
│
└── StorageService (Port 9004/storage)
    ├── GetData() → Data
    ├── PutData() → PutResult
    └── DeleteData() → DeleteResult
```

---

## 🔧 Proto File Structure

### Active Proto Files (No Duplicates)
```
src/main/proto/
├── blockchain.proto              ✅ Ready
│   ├── BlockchainService
│   ├── Block, BlockMetadata, BlockCreation*
│   └── Imports: google.protobuf, common
│
├── consensus.proto               ✅ Ready
│   ├── ConsensusService
│   ├── LogEntry, NodeState, Raft messages
│   └── Imports: blockchain, common
│
├── transaction.proto             ✅ Ready
│   ├── TransactionService
│   ├── SubmitTransactionRequest, TransactionReceipt*
│   └── Imports: blockchain, common
│
├── common.proto                  ✅ Ready
│   ├── TransactionStatus enum
│   ├── Common request/response types
│   └── Shared message definitions
│
├── network.proto                 🔴 NEW
│   ├── NetworkService
│   ├── NetworkStatus, PeerInfo, Message*
│   └── Imports: common
│
├── traceability.proto            🔴 NEW
│   ├── TraceabilityService
│   ├── AssetTrace, TraceEvent*
│   └── Imports: blockchain, common
│
├── storage.proto                 🔴 NEW
│   ├── StorageService
│   ├── StorageRequest, StorageResponse*
│   └── Imports: common
│
└── google/protobuf/             ✅ Includes
    ├── empty.proto
    ├── timestamp.proto
    └── wrappers.proto
```

### Disabled Proto Files (Legacy)
```
src/main/proto/
├── aurigraph_core.proto.disabled     (duplicate definitions removed)
├── aurigraph-v11.proto.disabled      (conflicting package names)
└── [others as needed]
```

---

## 📝 Implementation Phases

### Phase 1: gRPC Server & Infrastructure (Week 1)
**Goal**: Set up gRPC server and core infrastructure

#### Tasks
1. **Create GrpcServerConfiguration.java**
   - Initialize gRPC server on port 9004
   - Configure HTTP/2 settings
   - Enable TLS 1.3 for production
   - Configure interceptors for logging/metrics

2. **Create gRPC Interceptors**
   - AuthorizationInterceptor: JWT validation
   - LoggingInterceptor: Request/response logging
   - MetricsInterceptor: Prometheus metrics
   - ExceptionInterceptor: Error handling

3. **Update pom.xml**
   - ✅ Already has grpc-java plugin
   - Add runtime dependencies: grpc-netty-shaded, grpc-protobuf
   - Configure protobuf-maven-plugin for gRPC code generation

4. **Proto File Generation**
   - Run `mvn clean compile` to generate Java code
   - Verify all service stubs generated
   - Check GrpcStub classes created

**Acceptance Criteria**:
- gRPC server starts on port 9004 ✅
- Health check endpoint working ✅
- Metrics endpoint exposed ✅
- TLS configured for production ✅

---

### Phase 2: NetworkService Implementation (Week 1-2)
**Goal**: Implement first gRPC service with peer management

#### NetworkService Methods
1. **GetNetworkStatus()** - Synchronous RPC
   - Returns current network health
   - Input: Empty
   - Output: NetworkStatus (peers, sync status, latency)

2. **GetPeerList()** - Synchronous RPC
   - Returns list of connected peers
   - Input: Empty
   - Output: PeerList (peer addresses, versions, latencies)

3. **BroadcastMessage()** - Synchronous RPC
   - Broadcast message to network
   - Input: Message (data, type)
   - Output: BroadcastResult (success, recipients)

4. **SubscribeNetworkEvents()** - Server streaming RPC
   - Subscribe to network events (peer join/leave, latency changes)
   - Input: Empty
   - Output: stream NetworkEvent

#### Implementation Files
```java
src/main/java/io/aurigraph/v11/grpc/
├── GrpcServerConfiguration.java       (500 lines)
│   ├── Initialize gRPC server
│   ├── Register services
│   ├── Configure interceptors
│   └── Health check setup
│
├── NetworkServiceImpl.java             (250 lines)
│   ├── GetNetworkStatus()
│   ├── GetPeerList()
│   ├── BroadcastMessage()
│   └── SubscribeNetworkEvents()
│
├── interceptors/
│   ├── AuthorizationInterceptor.java  (100 lines)
│   ├── LoggingInterceptor.java        (80 lines)
│   ├── MetricsInterceptor.java        (120 lines)
│   └── ExceptionInterceptor.java      (100 lines)
│
└── utils/
    ├── GrpcUtils.java                 (80 lines)
    └── ProtoConverters.java           (150 lines)
```

**Proto Definition** (network.proto - 120 lines)
```protobuf
syntax = "proto3";

package io.aurigraph.v11.proto;

import "google/protobuf/empty.proto";
import "common.proto";

service NetworkService {
  rpc GetNetworkStatus(google.protobuf.Empty) returns (NetworkStatus);
  rpc GetPeerList(google.protobuf.Empty) returns (PeerList);
  rpc BroadcastMessage(Message) returns (BroadcastResult);
  rpc SubscribeNetworkEvents(google.protobuf.Empty) returns (stream NetworkEvent);
}

message NetworkStatus {
  int32 peer_count = 1;
  int32 connected_peers = 2;
  int64 uptime_seconds = 3;
  double avg_latency_ms = 4;
  string network_version = 5;
}

message PeerInfo {
  string peer_id = 1;
  string address = 2;
  int32 port = 3;
  int64 last_seen = 4;
  double latency_ms = 5;
  string version = 6;
}

message PeerList {
  repeated PeerInfo peers = 1;
}

message Message {
  string type = 1;
  bytes data = 2;
  int64 timestamp = 3;
}

message BroadcastResult {
  bool success = 1;
  int32 recipients = 2;
  string error_message = 3;
}

message NetworkEvent {
  enum EventType {
    PEER_JOINED = 0;
    PEER_LEFT = 1;
    LATENCY_CHANGED = 2;
    NETWORK_PARTITION = 3;
  }
  EventType type = 1;
  PeerInfo peer = 2;
  int64 timestamp = 3;
}
```

**Acceptance Criteria**:
- NetworkServiceImpl compiles without errors ✅
- All 4 methods implemented ✅
- gRPC tests pass (target: 100%) ✅
- Metrics exposed via Prometheus ✅

---

### Phase 3: BlockchainService Implementation (Week 2-3)
**Goal**: Implement blockchain operations over gRPC

#### BlockchainService Methods
1. **GetBlock()** - Synchronous RPC
   - Retrieve block by hash
   - Input: GetBlockRequest (block_hash)
   - Output: Block

2. **GetBlockByHeight()** - Synchronous RPC
   - Retrieve block by height
   - Input: GetBlockRequest (block_height)
   - Output: Block

3. **SubmitBlock()** - Synchronous RPC
   - Submit new block for processing
   - Input: Block
   - Output: BlockResult (success, block_hash)

4. **StreamBlocks()** - Server streaming RPC
   - Stream blocks as they're created
   - Input: StreamBlocksRequest (start_height, batch_size)
   - Output: stream Block

5. **ValidateBlock()** - Synchronous RPC
   - Validate block structure and content
   - Input: Block
   - Output: ValidationResult (valid, errors)

**Acceptance Criteria**:
- All 5 methods implemented ✅
- Merkle tree validation working ✅
- Streaming working correctly ✅
- Performance: <100ms per operation ✅

---

### Phase 4: TransactionService Implementation (Week 3-4)
**Goal**: High-throughput transaction processing over gRPC

#### TransactionService Methods
1. **SubmitTransaction()** - Synchronous RPC
   - Single transaction submission
   - Input: SubmitTransactionRequest
   - Output: TransactionReceipt

2. **BatchSubmitTransactions()** - Synchronous RPC
   - Batch transaction submission (100-1000 txs)
   - Input: BatchTransactionSubmissionRequest
   - Output: TransactionBatch (receipts, success_count)

3. **GetTransactionStatus()** - Synchronous RPC
   - Query transaction status
   - Input: GetTransactionStatusRequest (tx_hash)
   - Output: TransactionStatus

4. **StreamTransactions()** - Server streaming RPC
   - Stream confirmed transactions
   - Input: StreamTransactionsRequest (filter)
   - Output: stream Transaction

**Performance Targets**:
- Single transaction: <50ms
- Batch (100 txs): <100ms
- Streaming throughput: 100K+ tx/sec

**Acceptance Criteria**:
- Batch support working (100-1000 txs) ✅
- Streaming sustainable for 100K tx/sec ✅
- Error handling for invalid transactions ✅
- Transaction validation complete ✅

---

### Phase 5: ConsensusService Implementation (Week 4-5)
**Goal**: HyperRAFT++ consensus protocol over gRPC

#### ConsensusService Methods
1. **ProposeBlock()** - Synchronous RPC
   - Propose block for consensus
   - Input: ProposeBlockRequest (block)
   - Output: ProposalResult (accepted, leader)

2. **VoteOnBlock()** - Synchronous RPC
   - Vote on proposed block
   - Input: VoteOnBlockRequest (block_hash, vote)
   - Output: VoteResult (recorded, consensus_progress)

3. **CommitBlock()** - Synchronous RPC
   - Commit block to ledger
   - Input: CommitBlockRequest (block_hash)
   - Output: CommitResult (confirmed, finality)

4. **AppendLogEntry()** - Synchronous RPC
   - Append entry to Raft log
   - Input: AppendLogEntryRequest (entry)
   - Output: LogResult (term, match_index)

5. **GetConsensusState()** - Synchronous RPC
   - Get current consensus state
   - Input: Empty
   - Output: ConsensusState (leader, term, log_index)

**Performance Targets**:
- Block proposal: <10ms
- Consensus finality: <500ms (current), <100ms (target)
- Support 100+ concurrent streams

**Acceptance Criteria**:
- HyperRAFT++ consensus working ✅
- Leader election functional ✅
- Finality <500ms ✅
- 100+ concurrent connections ✅

---

### Phase 6: TraceabilityService & StorageService (Week 5-6)
**Goal**: Complete remaining services

#### TraceabilityService
- GetAssetTrace()
- RecordTransaction()
- StreamAssetEvents()

#### StorageService
- GetData()
- PutData()
- DeleteData()

**Acceptance Criteria**:
- All methods implemented ✅
- Integration tests passing ✅
- Performance targets met ✅

---

## 🧪 Testing Strategy

### Unit Tests (for each service)
```java
// NetworkServiceTest.java
@Test
public void testGetNetworkStatus() { ... }

@Test
public void testBroadcastMessage() { ... }

@Test
public void testSubscribeNetworkEvents() { ... }
```

**Target**: 100% method coverage, 95%+ line coverage

### Integration Tests
```java
// GrpcIntegrationTest.java
@Test
public void testNetworkAndBlockchainIntegration() { ... }

@Test
public void testTransactionSubmissionFlow() { ... }

@Test
public void testConsensusWithMultiplePeers() { ... }
```

**Target**: All critical paths tested, 100% pass rate

### Performance Tests
```java
// GrpcPerformanceBenchmark.java
@Test
public void benchmarkSingleTransaction() { ... }

@Test
public void benchmarkBatchTransactions(int batchSize) { ... }

@Test
public void benchmarkStreamingThroughput() { ... }
```

**Target**: 
- Single transaction: <50ms ✅
- Batch (100 txs): <100ms ✅
- Streaming: 100K+ tx/sec ✅

---

## 📊 Proto File Generation

### Maven Configuration (pom.xml)
```xml
<plugin>
  <groupId>org.xolstice.maven.plugins</groupId>
  <artifactId>protobuf-maven-plugin</artifactId>
  <version>0.6.1</version>
  <configuration>
    <protocArtifact>com.google.protobuf:protoc:3.23.4:exe:${os.detected.classifier}</protocArtifact>
    <pluginId>grpc-java</pluginId>
    <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.58.0:exe:${os.detected.classifier}</pluginArtifact>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>compile</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

### Generated Classes
```
target/generated-sources/protobuf/java/io/aurigraph/v11/proto/
├── BlockchainServiceGrpc.java      (auto-generated)
├── Block.java                       (auto-generated)
├── NetworkServiceGrpc.java          (auto-generated)
├── NetworkStatus.java               (auto-generated)
├── ConsensusServiceGrpc.java        (auto-generated)
└── [40+ other generated classes]
```

**Note**: All proto files generate Java code automatically via protobuf-maven-plugin

---

## 🚀 Deployment Strategy

### Local Development (Port 9004)
1. Start V11 service: `./mvnw quarkus:dev`
2. gRPC server starts on 9004 automatically
3. REST API still available on 9003 for backward compatibility

### Production (Port 9004 + TLS)
```bash
# Build with gRPC support
./mvnw clean package -Pnative

# Run with TLS configuration
java -Dquarkus.grpc.server.port=9004 \
     -Dquarkus.grpc.server.use-separate-server=true \
     -Dquarkus.grpc.server.enable-keep-alive=true \
     -jar target/quarkus-app/quarkus-run.jar
```

### NGINX Configuration
```nginx
upstream grpc_backend {
    server localhost:9004;
}

server {
    listen 443 ssl http2;
    server_name api.aurigraph.io;
    
    location /io.aurigraph.v11.proto.NetworkService/ {
        grpc_pass grpc://grpc_backend;
    }
    
    location /io.aurigraph.v11.proto.BlockchainService/ {
        grpc_pass grpc://grpc_backend;
    }
    
    # ... more services
}
```

---

## 📈 Performance Metrics

### Expected Improvements Over REST
| Metric | REST (HTTP/1.1) | gRPC (HTTP/2) | Improvement |
|--------|-----------------|---------------|-------------|
| Message Size | 500B (JSON) | 50B (Protobuf) | 10x smaller |
| Concurrent Connections | 6 per client | 100+ per client | 16x more |
| Latency | 50ms (avg) | 35ms (avg) | 30% faster |
| Throughput | 1M TPS | 1.3-1.5M TPS | +30-50% |

### Projected TPS Impact
- Current REST baseline: 5.09M TPS
- Protocol optimization alone: +300-500K TPS
- Combined with GPU acceleration: +910K TPS additional
- **Total target**: 6.0M+ TPS (by end of Phase 3)

---

## 📋 Deliverables Checklist

### Code
- [ ] GrpcServerConfiguration.java (500 lines)
- [ ] NetworkServiceImpl.java (250 lines)
- [ ] BlockchainServiceImpl.java (300 lines)
- [ ] TransactionServiceImpl.java (350 lines)
- [ ] ConsensusServiceImpl.java (400 lines)
- [ ] TraceabilityServiceImpl.java (200 lines)
- [ ] StorageServiceImpl.java (200 lines)
- [ ] gRPC interceptors (400 lines total)
- [ ] Proto files: network.proto, traceability.proto, storage.proto (400 lines total)

**Total Code**: ~2,500 lines

### Tests
- [ ] Unit tests for each service (50+ test cases, 500 lines)
- [ ] Integration tests (20+ test cases, 300 lines)
- [ ] Performance benchmarks (10 benchmarks, 200 lines)

**Total Tests**: 80+ test cases, ~1,000 lines

### Documentation
- [ ] gRPC Service Documentation (300 lines)
- [ ] Integration Guide (200 lines)
- [ ] Performance Benchmarks Report (200 lines)
- [ ] Troubleshooting Guide (150 lines)

**Total Documentation**: ~850 lines

---

## 🎯 Success Criteria

### Functional
- ✅ All 6 gRPC services implemented
- ✅ 100% of RPC methods functional
- ✅ Bidirectional streaming working
- ✅ Error handling complete

### Performance
- ✅ Single transaction <50ms
- ✅ Batch transaction (100) <100ms
- ✅ Streaming throughput 100K+ tx/sec
- ✅ Latency reduction 20-30%

### Quality
- ✅ Unit test coverage 95%+
- ✅ Integration test pass rate 100%
- ✅ Performance tests meet targets
- ✅ Zero memory leaks

### Deployment
- ✅ Production JAR builds successfully
- ✅ Native compilation (GraalVM) succeeds
- ✅ Backward compatible with REST API
- ✅ TLS 1.3 configured

---

## 📅 Timeline

| Phase | Duration | Status | Completion |
|-------|----------|--------|-----------|
| Phase 1: Infrastructure | 1 week | ⏳ Pending | Nov 20 |
| Phase 2: NetworkService | 1 week | ⏳ Pending | Nov 27 |
| Phase 3: BlockchainService | 1 week | ⏳ Pending | Dec 4 |
| Phase 4: TransactionService | 1 week | ⏳ Pending | Dec 11 |
| Phase 5: ConsensusService | 1 week | ⏳ Pending | Dec 18 |
| Phase 6: Other Services | 1 week | ⏳ Pending | Dec 25 |
| **Total** | **6 weeks** | ⏳ Ready | **By Dec 25** |

---

## 🔗 Dependencies & Resources

### Java Libraries (in pom.xml)
- grpc-netty-shaded:1.58.0
- grpc-protobuf:1.58.0
- grpc-stub:1.58.0
- protobuf-java:3.23.4
- protobuf-java-util:3.23.4

### Tools
- Protocol Buffer Compiler 3.23.4+
- Maven Protobuf Plugin 0.6.1+
- Quarkus 3.26.2+
- Java 21+

### Documentation
- [gRPC Java Official Docs](https://grpc.io/docs/languages/java/)
- [Quarkus gRPC Guide](https://quarkus.io/guides/grpc)
- [Protocol Buffers Reference](https://developers.google.com/protocol-buffers)

---

**Plan Prepared By**: Claude Code AI
**Date**: November 13, 2025
**Status**: ✅ Ready for Phase 1 Implementation

🚀 **Next Action**: Begin Phase 1 - gRPC Server Infrastructure Setup
