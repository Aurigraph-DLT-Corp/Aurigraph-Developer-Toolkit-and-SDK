# Aurigraph V12 gRPC API Documentation

## Overview

The Aurigraph V12 platform uses gRPC for high-performance internal service-to-service communication, achieving **50-70% throughput improvement** over traditional REST APIs. All internal communication between services uses HTTP/2 with Protocol Buffers for optimal performance.

**gRPC Server**: `localhost:9005` (internal) / `dlt.aurigraph.io:9005` (production)
**Protocol**: HTTP/2 with TLS 1.3
**Serialization**: Protocol Buffers (protobuf)
**Performance**: <2ms P50 latency, 776K+ TPS baseline

## Table of Contents

1. [gRPC Service Architecture](#grpc-service-architecture)
2. [Protocol Buffer Definitions](#protocol-buffer-definitions)
3. [Transaction Service](#transaction-service)
4. [Blockchain Service](#blockchain-service)
5. [Consensus Service](#consensus-service)
6. [Client Configuration](#client-configuration)
7. [Error Handling](#error-handling)
8. [Performance Optimization](#performance-optimization)

---

## gRPC Service Architecture

### Architecture Pattern: REST-to-gRPC Bridge

```
External Client (REST/JSON)
    ↓
REST API Gateway (TransactionResource)
    ↓
DTOConverter (JSON → Protobuf)
    ↓
gRPC Client (HTTP/2)
    ↓
gRPC Service (TransactionServiceImpl)
    ↓
Business Logic
    ↓
gRPC Response (Protobuf)
    ↓
DTOConverter (Protobuf → JSON)
    ↓
REST API Response (JSON)
```

### Performance Benefits

| Metric | REST (HTTP/1.1) | gRPC (HTTP/2) | Improvement |
|--------|----------------|---------------|-------------|
| Latency (P50) | ~15ms | <2ms | **87% faster** |
| Throughput | 500K TPS | 776K+ TPS | **55% higher** |
| Memory Usage | ~512MB | <256MB | **50% less** |
| Concurrent Streams | 1 per connection | 100+ per connection | **100x multiplexing** |

---

## Protocol Buffer Definitions

### Location

Protocol Buffer definitions are located in:
- `/src/main/proto/transaction.proto`
- `/src/main/proto/blockchain.proto`
- `/src/main/proto/consensus.proto`
- `/src/main/proto/common.proto`
- `/src/main/proto/core_types.proto`

### Package Declaration

```protobuf
syntax = "proto3";
package io.aurigraph.v11.proto;

option java_multiple_files = true;
option java_package = "io.aurigraph.v11.proto";
```

### Common Types

```protobuf
// Transaction status enumeration
enum TransactionStatus {
  QUEUED = 0;
  PENDING = 1;
  CONFIRMED = 2;
  FINALIZED = 3;
  FAILED = 4;
}

// Block status enumeration
enum BlockStatus {
  PENDING = 0;
  CONFIRMED = 1;
  FINALIZED = 2;
}

// Health status enumeration
enum HealthStatus {
  HEALTHY = 0;
  DEGRADED = 1;
  CRITICAL = 2;
}
```

---

## Transaction Service

### Service Definition

```protobuf
service TransactionService {
  // Single transaction submission
  rpc submitTransaction(SubmitTransactionRequest) returns (TransactionSubmissionResponse);

  // Batch transaction submission
  rpc batchSubmitTransactions(BatchTransactionSubmissionRequest) returns (BatchTransactionSubmissionResponse);

  // Transaction status query
  rpc getTransactionStatus(GetTransactionStatusRequest) returns (TransactionStatusResponse);

  // Transaction receipt
  rpc getTransactionReceipt(GetTransactionStatusRequest) returns (TransactionReceipt);

  // Cancel pending transaction
  rpc cancelTransaction(CancelTransactionRequest) returns (CancelTransactionResponse);

  // Resend transaction with higher gas
  rpc resendTransaction(ResendTransactionRequest) returns (ResendTransactionResponse);

  // Gas cost estimation
  rpc estimateGasCost(EstimateGasCostRequest) returns (GasEstimate);

  // Signature validation
  rpc validateTransactionSignature(ValidateTransactionSignatureRequest) returns (TransactionSignatureValidationResult);

  // Pending transactions query
  rpc getPendingTransactions(GetPendingTransactionsRequest) returns (PendingTransactionsResponse);

  // Transaction history
  rpc getTransactionHistory(GetTransactionHistoryRequest) returns (TransactionHistoryResponse);

  // Transaction pool size
  rpc getTxPoolSize(GetTxPoolSizeRequest) returns (TxPoolStatistics);

  // Real-time transaction stream (server-side streaming)
  rpc streamTransactionEvents(StreamTransactionEventsRequest) returns (stream TransactionEvent);
}
```

### Message Types

#### SubmitTransactionRequest

```protobuf
message SubmitTransactionRequest {
  Transaction transaction = 1;    // Transaction details
  bool prioritize = 2;            // High-priority flag
  int32 timeout_seconds = 3;      // Submission timeout
  string node_id = 4;             // Target node ID
}
```

#### Transaction

```protobuf
message Transaction {
  string transaction_hash = 1;
  string transaction_id = 2;
  string from_address = 3;
  string to_address = 4;
  string amount = 5;
  string gas_price = 6;
  int64 nonce = 7;
  string data = 8;
  string signature = 9;
  TransactionStatus status = 10;
  google.protobuf.Timestamp timestamp = 11;
}
```

#### TransactionSubmissionResponse

```protobuf
message TransactionSubmissionResponse {
  string transaction_hash = 1;
  TransactionStatus status = 2;
  google.protobuf.Timestamp timestamp = 3;
  string message = 4;
}
```

### Example: Submit Transaction (Java)

```java
// Create gRPC channel
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 9005)
    .usePlaintext()
    .build();

// Create blocking stub
TransactionServiceGrpc.TransactionServiceBlockingStub stub =
    TransactionServiceGrpc.newBlockingStub(channel);

// Build transaction
Transaction transaction = Transaction.newBuilder()
    .setTransactionHash("0x123abc...")
    .setFromAddress("0xabc123...")
    .setToAddress("0xdef456...")
    .setAmount("100.50")
    .setGasPrice("20")
    .setNonce(1)
    .build();

// Build request
SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
    .setTransaction(transaction)
    .setPrioritize(false)
    .setTimeoutSeconds(30)
    .build();

// Call gRPC method
TransactionSubmissionResponse response = stub.submitTransaction(request);

System.out.println("Transaction Hash: " + response.getTransactionHash());
System.out.println("Status: " + response.getStatus());

// Close channel
channel.shutdown();
```

### Example: Batch Submit (Java)

```java
// Build batch request
List<Transaction> transactions = new ArrayList<>();
for (int i = 0; i < 1000; i++) {
    transactions.add(Transaction.newBuilder()
        .setTransactionHash("0x" + i)
        .setFromAddress("0xabc" + i)
        .setToAddress("0xdef" + i)
        .setAmount(String.valueOf(100.0 + i))
        .build());
}

BatchTransactionSubmissionRequest batchRequest = BatchTransactionSubmissionRequest.newBuilder()
    .addAllTransactions(transactions)
    .setTimeoutSeconds(120)
    .setValidateBeforeSubmit(true)
    .build();

// Execute batch
BatchTransactionSubmissionResponse response = stub.batchSubmitTransactions(batchRequest);

System.out.println("Accepted: " + response.getAcceptedCount());
System.out.println("Rejected: " + response.getRejectedCount());
System.out.println("Batch ID: " + response.getBatchId());
```

### Example: Stream Transactions (Java)

```java
// Create async stub for streaming
TransactionServiceGrpc.TransactionServiceStub asyncStub =
    TransactionServiceGrpc.newStub(channel);

// Build stream request
StreamTransactionEventsRequest streamRequest = StreamTransactionEventsRequest.newBuilder()
    .setFilterAddress("0xabc123...")
    .setFilterStatus(TransactionStatus.CONFIRMED)
    .setIncludeFailed(false)
    .setStreamTimeoutSeconds(300)
    .build();

// Stream observer
StreamObserver<TransactionEvent> responseObserver = new StreamObserver<TransactionEvent>() {
    @Override
    public void onNext(TransactionEvent event) {
        System.out.println("Transaction Event: " + event.getTransaction().getTransactionHash());
        System.out.println("Status: " + event.getStatus());
    }

    @Override
    public void onError(Throwable t) {
        System.err.println("Stream error: " + t.getMessage());
    }

    @Override
    public void onCompleted() {
        System.out.println("Stream completed");
    }
};

// Start streaming
asyncStub.streamTransactionEvents(streamRequest, responseObserver);
```

---

## Blockchain Service

### Service Definition

```protobuf
service BlockchainService {
  // Create new block
  rpc createBlock(BlockCreationRequest) returns (BlockCreationResponse);

  // Validate block integrity
  rpc validateBlock(BlockValidationRequest) returns (BlockValidationResult);

  // Get block details
  rpc getBlockDetails(BlockDetailsRequest) returns (BlockDetailsResponse);

  // Execute transaction
  rpc executeTransaction(TransactionExecutionRequest) returns (TransactionExecutionResponse);

  // Verify transaction inclusion (Merkle proof)
  rpc verifyTransaction(TransactionVerificationRequest) returns (TransactionVerificationResult);

  // Get blockchain statistics
  rpc getBlockchainStatistics(BlockchainStatisticsRequest) returns (BlockchainStatistics);

  // Stream blocks (server-side streaming)
  rpc streamBlocks(BlockStreamRequest) returns (stream BlockStreamEvent);
}
```

### Message Types

#### BlockCreationRequest

```protobuf
message BlockCreationRequest {
  string block_id = 1;
  string state_root = 2;
  repeated Transaction transactions = 3;
  string transaction_root = 4;
  int32 validator_count = 5;
  repeated string validator_public_keys = 6;
  int32 timeout_seconds = 7;
  bool include_pending_transactions = 8;
}
```

#### Block

```protobuf
message Block {
  string block_hash = 1;
  int64 block_height = 2;
  string block_id = 3;
  string state_root = 4;
  string transaction_root = 5;
  string parent_hash = 6;
  google.protobuf.Timestamp created_at = 7;
  google.protobuf.Timestamp finalized_at = 8;
  BlockStatus status = 9;
  int32 transaction_count = 10;
  repeated string transaction_hashes = 11;
  int32 validator_count = 12;
  repeated string validator_signatures = 13;
  int64 processing_time_ms = 14;
  double gas_used = 15;
}
```

#### BlockchainStatistics

```protobuf
message BlockchainStatistics {
  int64 total_blocks = 1;
  int64 total_transactions = 2;
  double average_block_time_ms = 3;
  double average_transaction_size_bytes = 4;
  double transactions_per_second = 5;
  double peak_tps = 6;
  double average_tps = 7;
  int32 active_validators = 8;
  int32 sync_status_percent = 9;
  int32 healthy_nodes = 10;
  int64 pending_transactions = 11;
  int64 confirmed_transactions = 12;
  int64 failed_transactions = 13;
  string network_health_status = 14;
  double average_block_size_bytes = 15;
  google.protobuf.Timestamp measurement_start = 16;
  google.protobuf.Timestamp measurement_end = 17;
  int64 measurement_duration_seconds = 18;
}
```

### Example: Create Block (Java)

```java
// Create blocking stub
BlockchainServiceGrpc.BlockchainServiceBlockingStub stub =
    BlockchainServiceGrpc.newBlockingStub(channel);

// Build transactions
List<Transaction> transactions = Arrays.asList(
    Transaction.newBuilder()
        .setTransactionHash("0x1...")
        .setFromAddress("0xa...")
        .setToAddress("0xb...")
        .setAmount("100")
        .build()
);

// Build block creation request
BlockCreationRequest request = BlockCreationRequest.newBuilder()
    .setBlockId("block-12345")
    .setStateRoot("0xstate...")
    .addAllTransactions(transactions)
    .setTransactionRoot("0xtxroot...")
    .setValidatorCount(5)
    .addValidatorPublicKeys("0xval1...")
    .addValidatorPublicKeys("0xval2...")
    .setTimeoutSeconds(30)
    .setIncludePendingTransactions(true)
    .build();

// Create block
BlockCreationResponse response = stub.createBlock(request);

if (response.getSuccess()) {
    Block block = response.getBlock();
    System.out.println("Block created: " + block.getBlockHash());
    System.out.println("Block height: " + block.getBlockHeight());
    System.out.println("Transactions: " + block.getTransactionCount());
} else {
    System.err.println("Block creation failed: " + response.getErrorMessage());
}
```

### Example: Stream Blocks (Java)

```java
// Create async stub
BlockchainServiceGrpc.BlockchainServiceStub asyncStub =
    BlockchainServiceGrpc.newStub(channel);

// Build stream request
BlockStreamRequest request = BlockStreamRequest.newBuilder()
    .setStartFromHeight(12000)
    .setIncludeTransactions(1)  // Hashes only
    .setStreamTimeoutSeconds(300)
    .setOnlyNewBlocks(true)
    .build();

// Stream observer
StreamObserver<BlockStreamEvent> observer = new StreamObserver<BlockStreamEvent>() {
    @Override
    public void onNext(BlockStreamEvent event) {
        Block block = event.getBlock();
        System.out.println("New block: " + block.getBlockHeight());
        System.out.println("Hash: " + block.getBlockHash());
        System.out.println("Transactions: " + block.getTransactionCount());
    }

    @Override
    public void onError(Throwable t) {
        System.err.println("Stream error: " + t.getMessage());
    }

    @Override
    public void onCompleted() {
        System.out.println("Block stream completed");
    }
};

// Start streaming
asyncStub.streamBlocks(request, observer);
```

---

## Consensus Service

### Service Definition

```protobuf
service ConsensusService {
  // Get consensus statistics
  rpc getConsensusStats(ConsensusStatsRequest) returns (ConsensusStats);

  // Propose new leader
  rpc proposeLeader(ProposeLeaderRequest) returns (ProposeLeaderResponse);

  // Cast vote
  rpc castVote(CastVoteRequest) returns (CastVoteResponse);

  // Replicate log entry
  rpc replicateLogEntry(ReplicateLogRequest) returns (ReplicateLogResponse);

  // Get leader information
  rpc getLeaderInfo(GetLeaderInfoRequest) returns (LeaderInfo);

  // Stream consensus events (server-side streaming)
  rpc streamConsensusEvents(StreamConsensusEventsRequest) returns (stream ConsensusEvent);
}
```

### Message Types

#### ConsensusStats

```protobuf
message ConsensusStats {
  string node_id = 1;
  string node_state = 2;  // FOLLOWER, CANDIDATE, LEADER
  int64 current_term = 3;
  int64 commit_index = 4;
  int64 last_applied = 5;
  int32 votes_received = 6;
  int32 total_votes_needed = 7;
  string leader_node_id = 8;
  double average_consensus_latency_ms = 9;
  int64 consensus_rounds_completed = 10;
  double success_rate = 11;
  string algorithm = 12;  // HyperRAFT++
  google.protobuf.Timestamp timestamp = 13;
}
```

### Example: Get Consensus Stats (Java)

```java
// Create blocking stub
ConsensusServiceGrpc.ConsensusServiceBlockingStub stub =
    ConsensusServiceGrpc.newBlockingStub(channel);

// Build request
ConsensusStatsRequest request = ConsensusStatsRequest.newBuilder()
    .setNodeId("aurigraph-v11-xeon15-node-1")
    .setIncludeDetailedMetrics(true)
    .build();

// Get stats
ConsensusStats stats = stub.getConsensusStats(request);

System.out.println("Node State: " + stats.getNodeState());
System.out.println("Current Term: " + stats.getCurrentTerm());
System.out.println("Leader: " + stats.getLeaderNodeId());
System.out.println("Consensus Latency: " + stats.getAverageConsensusLatencyMs() + "ms");
System.out.println("Success Rate: " + (stats.getSuccessRate() * 100) + "%");
```

---

## Client Configuration

### Quarkus gRPC Client Configuration

**application.properties:**
```properties
# Transaction Service Client
quarkus.grpc.clients.transaction.host=localhost
quarkus.grpc.clients.transaction.port=9005
quarkus.grpc.clients.transaction.plain-text=true
quarkus.grpc.clients.transaction.use-quarkus-grpc-client=true
quarkus.grpc.clients.transaction.max-inbound-message-size=16777216
quarkus.grpc.clients.transaction.keep-alive-time=30
quarkus.grpc.clients.transaction.keep-alive-timeout=5

# Blockchain Service Client
quarkus.grpc.clients.blockchain.host=localhost
quarkus.grpc.clients.blockchain.port=9005
quarkus.grpc.clients.blockchain.plain-text=true
quarkus.grpc.clients.blockchain.use-quarkus-grpc-client=true
quarkus.grpc.clients.blockchain.max-inbound-message-size=16777216

# Consensus Service Client
quarkus.grpc.clients.consensus.host=localhost
quarkus.grpc.clients.consensus.port=9005
quarkus.grpc.clients.consensus.plain-text=true
quarkus.grpc.clients.consensus.use-quarkus-grpc-client=true
```

### Production TLS Configuration

**application.properties (Production):**
```properties
# Enable TLS
quarkus.grpc.clients.transaction.plain-text=false
quarkus.grpc.clients.transaction.ssl.certificate=classpath:certs/client.crt
quarkus.grpc.clients.transaction.ssl.key=classpath:certs/client.key
quarkus.grpc.clients.transaction.ssl.trust-store=classpath:certs/ca.crt

# Server TLS
quarkus.grpc.server.ssl.certificate=classpath:certs/server.crt
quarkus.grpc.server.ssl.key=classpath:certs/server.key
quarkus.grpc.server.ssl.client-auth=REQUIRED
```

### Java Client Example (Standalone)

```java
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;

public class AurigraphGrpcClient {

    private final ManagedChannel channel;
    private final TransactionServiceGrpc.TransactionServiceBlockingStub transactionStub;

    public AurigraphGrpcClient(String host, int port) {
        // Build channel with optimization
        this.channel = NettyChannelBuilder.forAddress(host, port)
            .usePlaintext()  // Use .useTransportSecurity() for TLS
            .maxInboundMessageSize(16 * 1024 * 1024)  // 16MB
            .keepAliveTime(30, TimeUnit.SECONDS)
            .keepAliveTimeout(5, TimeUnit.SECONDS)
            .build();

        // Create stub
        this.transactionStub = TransactionServiceGrpc.newBlockingStub(channel);
    }

    public void shutdown() throws InterruptedException {
        channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
    }

    public TransactionSubmissionResponse submitTransaction(Transaction tx) {
        SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
            .setTransaction(tx)
            .setTimeoutSeconds(30)
            .build();

        return transactionStub.submitTransaction(request);
    }
}
```

### Python Client Example

```python
import grpc
from generated import transaction_pb2
from generated import transaction_pb2_grpc

# Create channel
channel = grpc.insecure_channel('localhost:9005')

# Create stub
stub = transaction_pb2_grpc.TransactionServiceStub(channel)

# Build transaction
transaction = transaction_pb2.Transaction(
    transaction_hash="0x123abc...",
    from_address="0xabc123...",
    to_address="0xdef456...",
    amount="100.50",
    gas_price="20",
    nonce=1
)

# Build request
request = transaction_pb2.SubmitTransactionRequest(
    transaction=transaction,
    prioritize=False,
    timeout_seconds=30
)

# Call method
response = stub.submitTransaction(request)

print(f"Transaction Hash: {response.transaction_hash}")
print(f"Status: {response.status}")

# Close channel
channel.close()
```

### JavaScript/TypeScript Client Example

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Load proto definitions
const packageDefinition = protoLoader.loadSync('transaction.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const transactionService = protoDescriptor.io.aurigraph.v11.proto.TransactionService;

// Create client
const client = new transactionService('localhost:9005', grpc.credentials.createInsecure());

// Build request
const request = {
  transaction: {
    transaction_hash: "0x123abc...",
    from_address: "0xabc123...",
    to_address: "0xdef456...",
    amount: "100.50",
    gas_price: "20",
    nonce: 1
  },
  prioritize: false,
  timeout_seconds: 30
};

// Call method
client.submitTransaction(request, (error, response) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Transaction Hash:', response.transaction_hash);
    console.log('Status:', response.status);
  }
});
```

---

## Error Handling

### gRPC Status Codes

| gRPC Code | HTTP Equivalent | Description |
|-----------|----------------|-------------|
| `OK` | 200 | Success |
| `CANCELLED` | 499 | Request cancelled by client |
| `UNKNOWN` | 500 | Unknown error |
| `INVALID_ARGUMENT` | 400 | Invalid request parameters |
| `DEADLINE_EXCEEDED` | 504 | Request timeout |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `RESOURCE_EXHAUSTED` | 429 | Rate limit exceeded |
| `FAILED_PRECONDITION` | 400 | Precondition failed |
| `ABORTED` | 409 | Operation aborted |
| `OUT_OF_RANGE` | 400 | Value out of valid range |
| `UNIMPLEMENTED` | 501 | Method not implemented |
| `INTERNAL` | 500 | Internal server error |
| `UNAVAILABLE` | 503 | Service unavailable |
| `DATA_LOSS` | 500 | Data loss or corruption |
| `UNAUTHENTICATED` | 401 | Authentication required |

### Error Handling Example (Java)

```java
import io.grpc.Status;
import io.grpc.StatusRuntimeException;

try {
    TransactionSubmissionResponse response = stub.submitTransaction(request);
    System.out.println("Success: " + response.getTransactionHash());

} catch (StatusRuntimeException e) {
    Status.Code code = e.getStatus().getCode();
    String description = e.getStatus().getDescription();

    switch (code) {
        case UNAVAILABLE:
            System.err.println("Service unavailable, retrying...");
            // Implement retry logic
            break;

        case DEADLINE_EXCEEDED:
            System.err.println("Request timeout: " + description);
            break;

        case INVALID_ARGUMENT:
            System.err.println("Invalid request: " + description);
            break;

        case RESOURCE_EXHAUSTED:
            System.err.println("Rate limit exceeded");
            // Implement backoff
            break;

        default:
            System.err.println("gRPC error: " + code + " - " + description);
    }
}
```

### Retry Strategy

```java
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 9005)
    .usePlaintext()
    // Enable retries
    .enableRetry()
    .maxRetryAttempts(3)
    // Service config with retry policy
    .defaultServiceConfig(Map.of(
        "methodConfig", List.of(Map.of(
            "name", List.of(Map.of("service", "io.aurigraph.v11.proto.TransactionService")),
            "retryPolicy", Map.of(
                "maxAttempts", 3.0,
                "initialBackoff", "0.5s",
                "maxBackoff", "30s",
                "backoffMultiplier", 2.0,
                "retryableStatusCodes", List.of("UNAVAILABLE", "DEADLINE_EXCEEDED")
            )
        ))
    ))
    .build();
```

---

## Performance Optimization

### Connection Pooling

```java
// Reuse channels for better performance
private static final ManagedChannel SHARED_CHANNEL = ManagedChannelBuilder
    .forAddress("localhost", 9005)
    .usePlaintext()
    .maxInboundMessageSize(16 * 1024 * 1024)
    .build();

// Create stubs from shared channel
TransactionServiceGrpc.TransactionServiceBlockingStub stub1 =
    TransactionServiceGrpc.newBlockingStub(SHARED_CHANNEL);

TransactionServiceGrpc.TransactionServiceBlockingStub stub2 =
    TransactionServiceGrpc.newBlockingStub(SHARED_CHANNEL);
```

### Async/Non-Blocking Calls

```java
// Use async stub for non-blocking calls
TransactionServiceGrpc.TransactionServiceFutureStub asyncStub =
    TransactionServiceGrpc.newFutureStub(channel);

// Submit multiple requests concurrently
List<ListenableFuture<TransactionSubmissionResponse>> futures = new ArrayList<>();
for (Transaction tx : transactions) {
    SubmitTransactionRequest request = SubmitTransactionRequest.newBuilder()
        .setTransaction(tx)
        .build();

    futures.add(asyncStub.submitTransaction(request));
}

// Wait for all responses
List<TransactionSubmissionResponse> responses = Futures.allAsList(futures).get();
```

### Compression

```java
// Enable gzip compression for large payloads
TransactionServiceGrpc.TransactionServiceBlockingStub compressedStub =
    TransactionServiceGrpc.newBlockingStub(channel)
        .withCompression("gzip");

// Use compressed stub for batch operations
BatchTransactionSubmissionResponse response = compressedStub.batchSubmitTransactions(largeBatch);
```

### Metadata (Headers)

```java
import io.grpc.Metadata;
import io.grpc.stub.MetadataUtils;

// Add custom headers
Metadata metadata = new Metadata();
metadata.put(Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER),
    "Bearer " + jwtToken);
metadata.put(Metadata.Key.of("client-id", Metadata.ASCII_STRING_MARSHALLER),
    "client-12345");

// Attach metadata to stub
TransactionServiceGrpc.TransactionServiceBlockingStub stubWithAuth =
    TransactionServiceGrpc.newBlockingStub(channel)
        .withInterceptors(MetadataUtils.newAttachHeadersInterceptor(metadata));

// All calls will include metadata
TransactionSubmissionResponse response = stubWithAuth.submitTransaction(request);
```

### Deadline/Timeout

```java
import java.util.concurrent.TimeUnit;

// Set deadline for call
TransactionServiceGrpc.TransactionServiceBlockingStub stubWithDeadline =
    TransactionServiceGrpc.newBlockingStub(channel)
        .withDeadlineAfter(5, TimeUnit.SECONDS);

try {
    TransactionSubmissionResponse response = stubWithDeadline.submitTransaction(request);
} catch (StatusRuntimeException e) {
    if (e.getStatus().getCode() == Status.Code.DEADLINE_EXCEEDED) {
        System.err.println("Request timeout after 5 seconds");
    }
}
```

---

## Performance Metrics

### Achieved Performance (November 2025)

| Metric | Value |
|--------|-------|
| Baseline TPS | 776K |
| Target TPS | 2M+ |
| P50 Latency | <2ms |
| P95 Latency | <5ms |
| P99 Latency | <10ms |
| Memory Usage | <256MB |
| Concurrent Streams | 100+ per connection |

### Throughput Comparison

```
REST API (HTTP/1.1):
├─ Latency: ~15ms P50
├─ TPS: ~500K
└─ Connections: 1 stream per connection

gRPC API (HTTP/2):
├─ Latency: <2ms P50 (87% faster)
├─ TPS: 776K+ (55% higher)
└─ Connections: 100+ streams per connection (100x multiplexing)
```

---

## Support

For gRPC API support:
- **Documentation**: https://docs.aurigraph.io/grpc
- **Protocol Buffers**: `/src/main/proto/`
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Support Email**: grpc-support@aurigraph.io

---

**Last Updated**: November 25, 2025
**gRPC Version**: 1.60.0
**Protocol Buffers Version**: 3.24.4
**Document Version**: 1.0.0
