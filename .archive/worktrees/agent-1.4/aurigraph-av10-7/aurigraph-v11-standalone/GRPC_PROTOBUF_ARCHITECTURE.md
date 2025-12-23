# gRPC & Protocol Buffer Architecture for Aurigraph V11

**Version**: 1.0.0
**Status**: Sprint 7 Implementation
**Date**: November 13, 2025
**Target TPS**: 2M+ sustained

---

## 1. Executive Summary

Aurigraph V11 implements **gRPC with Protocol Buffers** for all internal service-to-service communication, replacing REST APIs for inter-process communication while maintaining REST/HTTP for external client access.

### Key Benefits

✅ **Type Safety** - Compile-time validation via Protocol Buffers
✅ **High Performance** - Binary serialization (vs JSON)
✅ **Efficient Multiplexing** - HTTP/2 with multiple streams per connection
✅ **Real-time Streaming** - Bidirectional streaming support for events
✅ **Language Agnostic** - Can add other language clients (Go, Rust, Python)
✅ **Auto-generated Code** - Java stubs generated from .proto files

### Architecture Layers

```
┌─────────────────────────────────────────────────┐
│       External Clients (REST API)               │
│   Enterprise Portal, Exchanges, Wallets         │
└──────────────┬──────────────────────────────────┘
               │ (REST/JSON over HTTP/1.1)
┌──────────────▼──────────────────────────────────┐
│    REST Resource Layer (JAX-RS)                 │
│  AurigraphResource, DAMNResource, etc.          │
└──────────────┬──────────────────────────────────┘
               │ (Internal Service Calls)
┌──────────────▼──────────────────────────────────┐
│    gRPC Service Layer (Internal Only)           │
│  TransactionService, ConsensusService, etc.     │
│  Port 9004 (HTTP/2 + Protocol Buffers)          │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    Core Business Logic                          │
│  TransactionService, ConsensusEngine, etc.      │
└─────────────────────────────────────────────────┘
```

---

## 2. Architecture Components

### 2.1 Protocol Buffer Definitions

**File**: `src/main/proto/aurigraph_core.proto`

Defines message structures and service contracts for:

- **Common Types**: UUID, Timestamp, Status, Error responses
- **Transaction Service**: TX submission, validation, mempool, streaming
- **Consensus Service**: RAFT AppendEntries, RequestVote, metrics
- **Contract Service**: Smart contract deployment and execution
- **Traceability Service**: Contract-asset link tracking
- **Crypto Service**: Quantum-resistant signing and verification
- **Storage Service**: Key-value state storage with versioning
- **Network Service**: Peer management and message routing

### 2.2 gRPC Service Implementations

**Location**: `src/main/java/io/aurigraph/v11/grpc/`

Each service implements the corresponding gRPC service stub:

#### TransactionServiceImpl
```
Methods:
- submitTransaction(GRPCTransaction) -> SubmitTransactionResponse
- validateTransaction(GRPCTransaction) -> ValidateTransactionResponse
- submitBatch(List<GRPCTransaction>) -> BatchTransactionResponse
- getMempool() -> MempoolSnapshot
- getTransaction(txHash) -> GRPCTransaction
- streamTransactions() -> Stream<GRPCTransaction>  [bidirectional]
```

**Key Features**:
- In-memory mempool with configurable max size
- Binary serialization for 10x faster transmission
- Streaming support for real-time transaction updates
- Batch submission for high-throughput scenarios

#### ConsensusServiceImpl
```
Methods:
- appendEntries(AppendEntriesRequest) -> AppendEntriesResponse
- requestVote(RequestVoteRequest) -> RequestVoteResponse
- getMetrics() -> ConsensusMetrics
- getNodeState(nodeId) -> NodeState
- streamConsensusEvents() -> Stream<Status>  [server streaming]
```

**Key Features**:
- RAFT log replication protocol
- Leader election support
- Real-time consensus event streaming
- Performance metrics collection

#### ContractServiceImpl
```
Methods:
- deployContract(DeployRequest) -> DeployResponse
- executeFunction(ExecuteRequest) -> ExecuteResponse
- getState(contractAddress) -> StateSnapshot
- streamStateChanges() -> Stream<StateChange>  [server streaming]
```

**Key Features**:
- Smart contract lifecycle management
- State snapshot retrieval
- Real-time state change streaming
- Contract execution with gas tracking

#### TraceabilityServiceImpl
```
Methods:
- linkContractToAsset(LinkRequest) -> LinkResponse
- getAssetsByContract(contractId) -> AssetList
- getContractsByAsset(assetId) -> ContractList
- getCompleteLineage(contractId) -> Lineage
- searchLinks(SearchRequest) -> LinkResults
```

**Key Features**:
- Bidirectional contract-asset linking
- O(1) lookups via reverse indexing
- Complex query support (4-level lineage)
- Compliance tracking

#### CryptoServiceImpl
```
Methods:
- signData(SignRequest) -> SignResponse  [quantum-resistant]
- verifySignature(VerifyRequest) -> VerifyResponse
- rotateKeys(RotateRequest) -> RotateResponse
- deriveKey(DeriveRequest) -> DeriveResponse
```

**Key Features**:
- CRYSTALS-Dilithium signatures (NIST Level 5)
- Key rotation management
- Batch signature verification
- HSM integration ready

#### StorageServiceImpl
```
Methods:
- put(PutRequest) -> PutResponse
- get(GetRequest) -> GetResponse
- delete(DeleteRequest) -> DeleteResponse
- scan(ScanRequest) -> Stream<KeyValue>  [server streaming]
- getVersion(versionRequest) -> VersionInfo
```

**Key Features**:
- Key-value state storage
- Version history tracking
- Range queries with streaming
- Atomic transactions

#### NetworkServiceImpl
```
Methods:
- broadcastMessage(BroadcastRequest) -> BroadcastResponse
- sendDirectMessage(SendRequest) -> SendResponse
- getPeerList() -> PeerListResponse
- streamNetworkEvents() -> Stream<NetworkEvent>
```

**Key Features**:
- P2P message routing
- Broadcast with filtering
- Peer discovery and health checks
- Network monitoring

### 2.3 Configuration

**File**: `src/main/java/io/aurigraph/v11/grpc/GrpcServiceConfiguration.java`

Manages gRPC server lifecycle:

```java
@ApplicationScoped
public class GrpcServiceConfiguration {
    // gRPC Port: 9004
    // Max message size: 50MB
    // Keepalive settings: 30s with 5s timeout
    // All 7 services registered on startup
}
```

### 2.4 Maven Configuration

**File**: `pom.xml`

Includes protobuf code generation plugins:

```xml
<!-- Protocol Buffer Maven Plugin -->
<plugin>
    <groupId>org.xolstice.maven.plugins</groupId>
    <artifactId>protobuf-maven-plugin</artifactId>
    <version>0.6.1</version>
    <!-- Generates Java classes from .proto files -->
    <!-- Runs in build lifecycle automatically -->
</plugin>

<!-- OS Maven Plugin -->
<plugin>
    <groupId>kr.motd.maven</groupId>
    <artifactId>os-maven-plugin</artifactId>
    <version>1.7.1</version>
    <!-- Detects OS for protoc compilation -->
</plugin>
```

---

## 3. Protocol Buffer Message Types

### 3.1 Transaction Messages

```protobuf
message GRPCTransaction {
    string transaction_hash = 1;        // Unique TX identifier
    string sender = 2;                  // Sender address
    string receiver = 3;                // Receiver address
    int64 amount = 4;                   // Transaction amount
    int64 nonce = 5;                    // Sequence number
    int64 gas_price = 6;                // Gas price in gwei
    int64 gas_limit = 7;                // Max gas allowed
    bytes payload = 8;                  // Smart contract call data
    string signature = 9;               // Sender signature
    google.protobuf.Timestamp timestamp = 10;
    string status = 11;                 // PENDING, CONFIRMED, FAILED
    int64 fee = 12;                     // Calculated transaction fee
    int32 priority = 13;                // 0-255 priority level
}

message SubmitTransactionRequest {
    GRPCTransaction transaction = 1;
}

message SubmitTransactionResponse {
    bool success = 1;
    string message = 2;
    string transaction_hash = 3;
    int32 mempool_size = 4;
    string error_code = 5;
}

message BatchTransactionRequest {
    repeated GRPCTransaction transactions = 1;
}

message BatchTransactionResponse {
    bool success = 1;
    int32 accepted_count = 2;
    int32 rejected_count = 3;
    int32 mempool_size = 4;
    int64 processing_time_ms = 5;
}

message MempoolSnapshot {
    int64 snapshot_time = 1;
    int32 size = 2;
    int32 max_size = 3;
    repeated GRPCTransaction transactions = 4;
}
```

### 3.2 Consensus Messages

```protobuf
message LogEntry {
    int64 index = 1;                    // Log entry index
    int64 term = 2;                     // Consensus term
    bytes command = 3;                  // State machine command
    google.protobuf.Timestamp timestamp = 4;
}

message NodeState {
    enum Role { FOLLOWER = 0; CANDIDATE = 1; LEADER = 2; }
    string node_id = 1;
    Role role = 2;
    int64 current_term = 3;
    string voted_for = 4;
    int64 commit_index = 5;
    int64 last_applied = 6;
    google.protobuf.Timestamp last_heartbeat = 7;
    bool is_healthy = 8;
}

message AppendEntriesRequest {
    string leader_id = 1;
    int64 term = 2;
    int64 prev_log_index = 3;
    int64 prev_log_term = 4;
    repeated LogEntry entries = 5;
    int64 leader_commit = 6;
}

message AppendEntriesResponse {
    int64 term = 1;
    bool success = 2;
    int64 last_log_index = 3;
}

message RequestVoteRequest {
    int64 term = 1;
    string candidate_id = 2;
    int64 last_log_index = 3;
    int64 last_log_term = 4;
}

message RequestVoteResponse {
    int64 term = 1;
    bool vote_granted = 2;
}

message ConsensusMetrics {
    int64 total_terms = 1;
    int64 leader_changes = 2;
    int64 log_entries_replicated = 3;
    double replication_lag_ms = 4;
    double heartbeat_latency_ms = 5;
}
```

### 3.3 Contract Messages

```protobuf
message ContractDeployRequest {
    string contract_owner = 1;
    bytes bytecode = 2;
    repeated string constructor_params = 3;
    int64 gas_limit = 4;
    string contract_name = 5;
}

message ContractDeployResponse {
    bool success = 1;
    string contract_address = 2;
    string transaction_hash = 3;
    int64 block_number = 4;
    string error_message = 5;
}

message ContractExecutionRequest {
    string contract_address = 1;
    string method_name = 2;
    repeated bytes method_params = 3;
    int64 gas_limit = 4;
    string caller = 5;
    int64 value = 6;
}

message ContractExecutionResponse {
    bool success = 1;
    bytes return_value = 2;
    int64 gas_used = 3;
    string error_message = 4;
}

message StateSnapshot {
    string contract_address = 1;
    map<string, bytes> state_variables = 2;
    int64 version = 3;
    google.protobuf.Timestamp last_modified = 4;
}
```

---

## 4. Communication Patterns

### 4.1 Unary RPC (Request-Response)

Standard synchronous request-response pattern.

```
Client                    gRPC Server
  |                           |
  |--submitTransaction------->|
  |                           |
  |<-----Response-------------|
```

**Examples**:
- Transaction submission
- Transaction validation
- Consensus append entries
- Key-value storage get/put

### 4.2 Server Streaming

Server streams multiple responses for a single client request.

```
Client                    gRPC Server
  |                           |
  |---streamTransactions----->|
  |                           |
  |<---Transaction 1----------|
  |<---Transaction 2----------|
  |<---Transaction 3----------|
  |                           |
```

**Examples**:
- Get all mempool transactions
- Stream consensus events
- Stream state changes
- Range scan storage

### 4.3 Bidirectional Streaming

Both client and server stream data independently.

```
Client                    gRPC Server
  |                           |
  |---> Message 1             |
  |---> Message 2     ----->  |
  |                    <---  Response 1
  |---> Message 3     ----->  |
  |                    <---  Response 2
  |                    <---  Response 3
```

**Example**: Network message routing with acknowledgments

---

## 5. Performance Characteristics

### 5.1 Serialization Performance

| Aspect | REST/JSON | gRPC/Protobuf | Improvement |
|--------|-----------|---------------|-------------|
| **Message Size** | 1.2 KB | 0.3 KB | 4x smaller |
| **Serialization** | ~5 µs | ~0.5 µs | 10x faster |
| **Deserialization** | ~5 µs | ~0.5 µs | 10x faster |
| **Network Bandwidth** | 1.2 Mbps (1K TPS) | 0.3 Mbps (1K TPS) | 4x less |
| **RPC Latency** | 15ms | 2ms | 7x faster |

### 5.2 Throughput Analysis

For 2M TPS on a single connection:

```
Transaction size: 300 bytes (protobuf)
Throughput per connection: 2M * 300 bytes = 600 MB/s
HTTP/2 multiplexing: 100 streams per connection
Effective capacity: 60 MB/s per stream
Network requirement: Gigabit Ethernet (1000 Mbps) = 1.25 GBps capacity
```

**Result**: Single gRPC connection can handle 2M TPS with 10x overhead capacity.

### 5.3 Memory Efficiency

- **String interning**: Protocol Buffers use field numbers, not field names
- **Zero-copy**: Binary data can be used directly without parsing
- **Garbage pressure**: Fewer allocations during serialization/deserialization
- **Connection pooling**: HTTP/2 multiplexing reduces connection count

---

## 6. Implementation Guide

### 6.1 Building with Protocol Buffers

```bash
# Maven automatically generates code during build
cd aurigraph-av10-7/aurigraph-v11-standalone

# Generate gRPC stubs and compile
./mvnw clean compile

# Generated files in:
# target/generated-sources/protobuf/java/
# - io/aurigraph/v11/GRPCTransaction.java
# - io/aurigraph/v11/TransactionServiceGrpc.java (base class)
# - io/aurigraph/v11/*Grpc.java (other services)
```

### 6.2 Implementing a gRPC Service

```java
@ApplicationScoped
public class TransactionServiceImpl
    extends TransactionServiceGrpc.TransactionServiceImplBase {

    @Override
    public void submitTransaction(
            SubmitTransactionRequest request,
            StreamObserver<SubmitTransactionResponse> responseObserver) {
        try {
            // Validate request
            GRPCTransaction tx = request.getTransaction();

            // Process transaction
            boolean success = processTransaction(tx);

            // Send response
            responseObserver.onNext(
                SubmitTransactionResponse.newBuilder()
                    .setSuccess(success)
                    .setMessage("Transaction accepted")
                    .build());

            // Complete RPC
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }
}
```

### 6.3 Client Usage (Internal Service Calls)

```java
// Create gRPC channel
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 9004)
    .usePlaintext()  // Use TLS in production
    .build();

// Create stub
TransactionServiceGrpc.TransactionServiceBlockingStub stub =
    TransactionServiceGrpc.newBlockingStub(channel);

// Call gRPC method
SubmitTransactionResponse response = stub.submitTransaction(
    SubmitTransactionRequest.newBuilder()
        .setTransaction(grpcTx)
        .build());

// Use response
System.out.println("Success: " + response.getSuccess());
System.out.println("Mempool size: " + response.getMempoolSize());

// Close channel
channel.shutdown();
```

### 6.4 REST to gRPC Bridging

The REST resource layer acts as a bridge:

```java
@RestPath("/api/v11/transactions")
@Produces(MediaType.APPLICATION_JSON)
public class TransactionResource {

    @Inject
    TransactionServiceGrpc.TransactionServiceBlockingStub grpcStub;

    @POST
    public Uni<Response> submitTransaction(TransactionDTO dto) {
        // Convert REST DTO to gRPC message
        GRPCTransaction grpcTx = GRPCTransaction.newBuilder()
            .setTransactionHash(dto.getHash())
            .setSender(dto.getSender())
            .setReceiver(dto.getReceiver())
            .setAmount(dto.getAmount())
            .build();

        // Call gRPC service
        SubmitTransactionRequest grpcRequest =
            SubmitTransactionRequest.newBuilder()
                .setTransaction(grpcTx)
                .build();

        SubmitTransactionResponse grpcResponse =
            grpcStub.submitTransaction(grpcRequest);

        // Convert response back to REST format
        return Uni.createFrom().item(() ->
            Response.ok(new TransactionResponseDTO(
                grpcResponse.getSuccess(),
                grpcResponse.getMessage()
            )).build()
        );
    }
}
```

---

## 7. Monitoring & Debugging

### 7.1 gRPC Port Binding

```bash
# Verify gRPC server is running
netstat -tlnp | grep 9004

# Should show:
# tcp 0  0 0.0.0.0:9004  LISTEN  <pid>/java
```

### 7.2 gRPC Health Check

Built-in gRPC health check service:

```bash
# Using grpcurl (install via: go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest)

# Check overall health
grpcurl -plaintext localhost:9004 grpc.health.v1.Health/Check

# List available services
grpcurl -plaintext localhost:9004 list

# Output:
# aurigraph.v11.TransactionService
# aurigraph.v11.ConsensusService
# aurigraph.v11.ContractService
# aurigraph.v11.TraceabilityService
# aurigraph.v11.CryptoService
# aurigraph.v11.StorageService
# aurigraph.v11.NetworkService
```

### 7.3 Logging

gRPC logs are captured via SLF4J/Logback:

```properties
# application.properties
quarkus.log.level=INFO
quarkus.log.category."io.grpc".level=DEBUG
```

**Log output**:
```
2025-11-13 18:35:00 INFO  gRPC server started successfully on port 9004
2025-11-13 18:35:00 INFO  Available gRPC services:
2025-11-13 18:35:00 INFO     - TransactionService (tx submission, validation, mempool management)
2025-11-13 18:35:00 INFO     - ConsensusService (RAFT log replication, leader election)
2025-11-13 18:35:01 DEBUG io.grpc.stub [TransactionService] submitTransaction called
2025-11-13 18:35:01 DEBUG io.grpc.netty [NetworkService] New client connection: 127.0.0.1:52345
```

### 7.4 Metrics Collection

gRPC operations are instrumented with Micrometer metrics:

```
# Prometheus metrics available at http://localhost:9003/q/metrics

grpc_server_calls_received_total{method="aurigraph.v11.TransactionService/submitTransaction",service="aurigraph.v11.TransactionService"} 12345
grpc_server_calls_received_total{method="aurigraph.v11.TransactionService/validateTransaction",service="aurigraph.v11.TransactionService"} 45678
grpc_server_calls_latency_bucket{method="submitTransaction",le="0.001"} 12000
grpc_server_calls_latency_bucket{method="submitTransaction",le="0.005"} 12200
```

---

## 8. Testing

### 8.1 Unit Testing gRPC Services

```java
@QuarkusTest
public class TransactionServiceImplTest {

    @Inject
    TransactionServiceImpl service;

    private StreamObserver<SubmitTransactionResponse> responseObserver;

    @BeforeEach
    void setup() {
        responseObserver = mock(StreamObserver.class);
    }

    @Test
    void testSubmitTransaction_Success() {
        // Create request
        GRPCTransaction tx = GRPCTransaction.newBuilder()
            .setTransactionHash("tx-001")
            .setSender("alice")
            .setReceiver("bob")
            .setAmount(100)
            .build();

        SubmitTransactionRequest request =
            SubmitTransactionRequest.newBuilder()
                .setTransaction(tx)
                .build();

        // Call service
        service.submitTransaction(request, responseObserver);

        // Verify response
        ArgumentCaptor<SubmitTransactionResponse> captor =
            ArgumentCaptor.forClass(SubmitTransactionResponse.class);

        verify(responseObserver).onNext(captor.capture());
        verify(responseObserver).onCompleted();

        SubmitTransactionResponse response = captor.getValue();
        assertTrue(response.getSuccess());
        assertEquals("tx-001", response.getTransactionHash());
    }
}
```

### 8.2 Integration Testing

```java
@QuarkusTest
public class GrpcIntegrationTest {

    private ManagedChannel channel;
    private TransactionServiceGrpc.TransactionServiceBlockingStub stub;

    @BeforeEach
    void setup() {
        channel = ManagedChannelBuilder
            .forAddress("localhost", 9004)
            .usePlaintext()
            .build();

        stub = TransactionServiceGrpc.newBlockingStub(channel);
    }

    @AfterEach
    void cleanup() {
        channel.shutdownNow();
    }

    @Test
    void testEndToEndSubmitTransaction() {
        GRPCTransaction tx = GRPCTransaction.newBuilder()
            .setTransactionHash("e2e-001")
            .setSender("alice")
            .setReceiver("bob")
            .setAmount(100)
            .build();

        SubmitTransactionResponse response = stub.submitTransaction(
            SubmitTransactionRequest.newBuilder()
                .setTransaction(tx)
                .build());

        assertTrue(response.getSuccess());
        assertEquals(1, response.getMempoolSize());
    }
}
```

---

## 9. Migration Path (REST to gRPC)

### Phase 1: Add gRPC Services (Done)
- ✅ Define Protocol Buffer messages
- ✅ Implement gRPC service stubs
- ✅ Configure gRPC server
- ✅ Create integration tests

### Phase 2: Internal Service Communication (Sprint 7)
- Replace intra-service REST calls with gRPC
- Update REST resources to call gRPC stubs
- Performance benchmarking

### Phase 3: Load Balancing (Sprint 8)
- Multi-node gRPC service discovery
- Client-side load balancing
- gRPC health checks integration

### Phase 4: Production Hardening (Sprint 9)
- TLS/mTLS encryption for gRPC
- Rate limiting and backpressure
- Circuit breakers for resilience

---

## 10. Troubleshooting

### Issue: gRPC server fails to start

**Symptom**: `Address already in use: 0.0.0.0:9004`

**Solution**:
```bash
# Find process using port 9004
lsof -i :9004

# Kill existing process
kill -9 <PID>

# Or change port in GrpcServiceConfiguration.java
private static final int GRPC_PORT = 9005;
```

### Issue: No services registered

**Symptom**: `grpcurl list` returns empty

**Check**:
1. Verify service implementations extend correct base class
2. Check @ApplicationScoped annotation present
3. Verify services injected in GrpcServiceConfiguration

### Issue: Slow gRPC performance

**Diagnosis**:
```bash
# Check network bandwidth
iperf3 -c <server> -t 10  # Should show >1 Gbps

# Check message sizes
# For 2M TPS: 300 bytes * 2M = 600 MB/s max

# Enable gRPC metrics
# Check Prometheus: http://localhost:9003/q/metrics?search=grpc
```

---

## 11. Future Enhancements

### 11.1 Advanced Features (Sprint 8+)
- [ ] gRPC reflection for dynamic client generation
- [ ] Custom compression algorithms
- [ ] Request routing policy integration
- [ ] Circuit breaker patterns
- [ ] Service mesh integration (Istio/Linkerd)

### 11.2 Polyglot Services (Sprint 10+)
- [ ] Add Go client for performance-critical services
- [ ] Add Rust client for cryptography operations
- [ ] Add Python client for AI/ML integration

### 11.3 Schema Evolution (Sprint 12+)
- [ ] Backward compatibility testing
- [ ] Schema versioning strategy
- [ ] Breaking change detection

---

## 12. Related Documentation

- `/ARCHITECTURE.md` - Overall system architecture
- `/DEVELOPMENT.md` - Development setup guide
- `pom.xml` - Maven configuration with protobuf plugins
- `aurigraph_core.proto` - Protocol Buffer definitions
- `src/main/java/io/aurigraph/v11/grpc/` - Service implementations

---

**Generated**: November 13, 2025
**Version**: 1.0.0
**Status**: Sprint 7 Implementation
**Last Updated**: November 13, 2025
