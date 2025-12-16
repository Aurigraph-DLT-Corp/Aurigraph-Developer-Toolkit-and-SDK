# Aurigraph V12 Streaming Services Protocol Documentation

## Overview

This document describes the comprehensive Protocol Buffer definitions for Aurigraph V12's real-time streaming services. The streaming architecture provides high-performance, type-safe, bidirectional communication between the blockchain platform and client applications.

## Architecture

### Technology Stack
- **Protocol**: gRPC with Protocol Buffers (proto3)
- **Transport**: HTTP/2 with TLS 1.3
- **Client Support**: Native browser support via gRPC-Web
- **Performance**: 60-70% bandwidth reduction vs JSON/WebSocket
- **Scaling**: Supports 10,000+ concurrent subscribers

### Stream Types

1. **Transaction Stream** - Real-time transaction lifecycle events
2. **Validator Stream** - Validator status, performance, and rewards
3. **Consensus Stream** - HyperRAFT++ consensus round events
4. **Network Stream** - Network topology and peer connectivity
5. **Metrics Stream** - Performance metrics and analytics

## File Structure

```
src/main/proto/
├── streaming.proto              # Unified streaming service (NEW)
├── transaction.proto            # Transaction service definitions
├── validator-stream.proto       # Validator streaming
├── consensus-stream.proto       # Consensus streaming
├── network-stream.proto         # Network streaming
├── metrics-stream.proto         # Metrics streaming
├── common.proto                 # Shared types
├── blockchain.proto             # Blockchain types
├── consensus.proto              # Consensus types
├── network.proto                # Network types
└── core_types.proto             # Core type definitions
```

## Unified Streaming Service

The `streaming.proto` file provides a consolidated interface for all streaming services:

### Service Definition

```protobuf
service UnifiedStreamingService {
  // Transaction Streaming
  rpc StreamTransactions(TransactionStreamRequest)
    returns (stream TransactionEvent);

  // Validator Streaming
  rpc StreamValidators(ValidatorStreamRequest)
    returns (stream ValidatorEvent);

  // Consensus Streaming
  rpc StreamConsensus(ConsensusStreamRequest)
    returns (stream ConsensusEvent);

  // Network Streaming
  rpc StreamNetwork(NetworkStreamRequest)
    returns (stream NetworkEvent);

  // Metrics Streaming
  rpc StreamMetrics(MetricStreamRequest)
    returns (stream MetricEvent);

  // Multi-Stream Subscription
  rpc StreamMultiple(MultiStreamRequest)
    returns (stream UnifiedEvent);

  // Interactive Bidirectional Streaming
  rpc InteractiveStream(stream StreamCommand)
    returns (stream UnifiedEvent);
}
```

## Message Types

### 1. Transaction Events

#### TransactionEvent
Real-time transaction lifecycle events.

```protobuf
message TransactionEvent {
  string event_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  string transaction_hash = 3;
  string from_address = 4;
  string to_address = 5;
  string amount = 6;
  TransactionStatus status = 7;
  string event_type = 8;  // submitted, validated, confirmed, finalized, failed
  int64 block_height = 9;
  string block_hash = 10;
  int32 confirmations = 11;
  int64 processing_time_ms = 12;
  double gas_used = 13;
}
```

**Event Types:**
- `submitted` - Transaction submitted to mempool
- `validated` - Transaction validation complete
- `confirmed` - Included in block
- `finalized` - Block finalized
- `failed` - Transaction failed

**Performance:**
- Latency: <100ms from event to delivery
- Throughput: Supports 2M+ TPS
- Buffer: Client-configurable (default: 100 events)

### 2. Validator Events

#### ValidatorEvent
Validator status changes and performance updates.

```protobuf
message ValidatorEvent {
  string event_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  string validator_id = 3;
  string validator_address = 4;
  string event_type = 5;  // registered, activated, deactivated, slashed, reward, penalty
  ValidatorStatus status = 6;
  double stake = 7;
  double reputation = 8;
  int64 blocks_proposed = 9;
  int64 votes_cast = 10;
  double uptime_percent = 11;
}
```

**Event Types:**
- `registered` - New validator registered
- `activated` - Validator activated
- `deactivated` - Validator deactivated
- `slashed` - Validator slashed for misbehavior
- `reward` - Reward distributed
- `penalty` - Penalty applied

**Update Frequency:**
- Status changes: Real-time
- Performance metrics: Every 2 seconds
- Reputation updates: Every 5 minutes

### 3. Consensus Events

#### ConsensusEvent
HyperRAFT++ consensus round events.

```protobuf
message ConsensusEvent {
  string event_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  int64 round = 3;
  int64 term = 4;
  string phase = 5;  // election, proposal, voting, commitment, finalization
  string proposer_id = 6;
  string leader_id = 7;
  int32 votes_for = 8;
  int32 votes_against = 9;
  int32 votes_required = 10;
  string block_hash = 11;
  int64 block_height = 12;
  int64 round_duration_ms = 13;
  bool consensus_reached = 14;
  string result = 15;  // accepted, rejected, timeout
}
```

**Consensus Phases:**
1. `election` - Leader election phase
2. `proposal` - Block proposal phase
3. `voting` - Validator voting phase
4. `commitment` - Block commitment phase
5. `finalization` - Block finalization phase

**Update Frequency:**
- Phase transitions: Real-time
- Voting updates: Every 500ms
- Round completion: Real-time

### 4. Network Events

#### NetworkEvent
Network topology and connectivity events.

```protobuf
message NetworkEvent {
  string event_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  string event_type = 3;  // node_joined, node_left, peer_connected, peer_disconnected
  string node_id = 4;
  NodeStatus node_status = 5;
  int32 total_nodes = 6;
  int32 active_nodes = 7;
  int32 peer_connections = 8;
  double average_latency_ms = 9;
  double network_health_score = 10;
}
```

**Event Types:**
- `node_joined` - New node joined network
- `node_left` - Node left network
- `peer_connected` - Peer connection established
- `peer_disconnected` - Peer connection lost
- `status_change` - Node status changed

**Update Frequency:**
- Topology changes: Real-time
- Health metrics: Every 3 seconds
- Latency updates: Every 5 seconds

### 5. Metric Events

#### MetricEvent
Performance and analytics metrics.

```protobuf
message MetricEvent {
  string metric_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  string metric_name = 3;  // tps, latency, cpu_usage, memory_usage
  string metric_type = 4;  // gauge, counter, histogram
  double value = 5;
  string unit = 6;  // tps, ms, percent, bytes
  string node_id = 7;
  MetricStatistics statistics = 9;
}
```

**Metric Types:**
- **TPS Metrics**: Current TPS, averages, peaks
- **Latency Metrics**: P50, P95, P99 latencies
- **Resource Metrics**: CPU, memory, disk usage
- **Consensus Metrics**: Block time, voting time
- **Network Metrics**: Bandwidth, peer latency

**Update Frequency:**
- High-frequency metrics (TPS): Every 1 second
- Resource metrics: Every 5 seconds
- Aggregated metrics: Every 10 seconds

## Subscription Patterns

### 1. Single Stream Subscription

Subscribe to a specific stream type:

```java
// Client code example
TransactionStreamRequest request = TransactionStreamRequest.newBuilder()
    .setClientId("client-123")
    .setSessionToken("token-xyz")
    .addFilterAddresses("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
    .setUpdateIntervalMs(100)
    .setBufferSize(100)
    .build();

StreamObserver<TransactionEvent> observer = new StreamObserver<>() {
    @Override
    public void onNext(TransactionEvent event) {
        // Handle transaction event
        System.out.println("TX: " + event.getTransactionHash() +
                         " Status: " + event.getEventType());
    }
};

stub.streamTransactions(request, observer);
```

### 2. Multi-Stream Subscription

Subscribe to multiple streams simultaneously:

```java
MultiStreamRequest request = MultiStreamRequest.newBuilder()
    .setClientId("dashboard-1")
    .setSessionToken("token-xyz")
    .setIncludeTransactions(true)
    .setIncludeValidators(true)
    .setIncludeMetrics(true)
    .setGlobalBufferSize(200)
    .setEnableCompression(true)
    .build();

StreamObserver<UnifiedEvent> observer = new StreamObserver<>() {
    @Override
    public void onNext(UnifiedEvent event) {
        switch (event.getStreamType()) {
            case "transaction":
                handleTransaction(event.getTransaction());
                break;
            case "validator":
                handleValidator(event.getValidator());
                break;
            case "metric":
                handleMetric(event.getMetric());
                break;
        }
    }
};

stub.streamMultiple(request, observer);
```

### 3. Interactive Bidirectional Stream

Dynamic subscription control with commands:

```java
StreamObserver<UnifiedEvent> responseObserver = new StreamObserver<>() {
    @Override
    public void onNext(UnifiedEvent event) {
        // Handle events
    }
};

StreamObserver<StreamCommand> requestObserver =
    stub.interactiveStream(responseObserver);

// Subscribe to transactions
requestObserver.onNext(StreamCommand.newBuilder()
    .setCommand(CommandType.SUBSCRIBE)
    .setStreamType("transaction")
    .build());

// Pause the stream
requestObserver.onNext(StreamCommand.newBuilder()
    .setCommand(CommandType.PAUSE)
    .setStreamType("transaction")
    .build());

// Resume the stream
requestObserver.onNext(StreamCommand.newBuilder()
    .setCommand(CommandType.RESUME)
    .setStreamType("transaction")
    .build());
```

## Filtering and Configuration

### Transaction Stream Filters

```protobuf
message TransactionStreamRequest {
  // Filter by addresses
  repeated string filter_addresses = 3;

  // Filter by status
  repeated TransactionStatus filter_statuses = 4;

  // Include failed transactions
  bool include_failed = 5;

  // Buffer and rate limiting
  int32 buffer_size = 6;          // Default: 100
  int32 update_interval_ms = 7;   // Default: 100ms
}
```

### Validator Stream Filters

```protobuf
message ValidatorStreamRequest {
  // Filter specific validators
  repeated string validator_ids = 3;

  // Filter by status
  bool only_active = 4;

  // Filter by performance
  double min_reputation = 5;
  double min_stake = 6;

  // Update configuration
  int32 update_interval_ms = 7;   // Default: 2000ms
  bool include_performance = 8;
  bool include_health = 9;
}
```

### Metrics Stream Filters

```protobuf
message MetricStreamRequest {
  // Filter by metric type
  repeated string metric_types = 3;  // ["tps", "latency", "cpu"]

  // Filter by node
  repeated string node_ids = 4;

  // Time series configuration
  int32 update_interval_ms = 5;      // Default: 1000ms
  bool include_time_series = 6;
  int32 time_series_window_minutes = 7;  // Default: 5 minutes
}
```

## Performance Characteristics

### Bandwidth Usage

| Stream Type | JSON/WebSocket | Protobuf/gRPC | Reduction |
|------------|----------------|---------------|-----------|
| Transaction | ~2.5 KB/event | ~800 bytes | 68% |
| Validator | ~3.0 KB/event | ~1.0 KB | 67% |
| Consensus | ~2.0 KB/event | ~700 bytes | 65% |
| Network | ~1.5 KB/event | ~500 bytes | 67% |
| Metrics | ~2.0 KB/event | ~600 bytes | 70% |

### Latency

- **Event Generation to Delivery**: <100ms (P99)
- **Network Round-trip**: <50ms (P95)
- **Client Processing**: <10ms (P95)
- **Total End-to-End**: <200ms (P99)

### Throughput

- **Maximum Events/Second**: 100,000+ per stream
- **Maximum Concurrent Streams**: 10,000+
- **Maximum Subscribers**: 50,000+
- **Transaction Stream TPS**: 2M+ supported

### Resource Usage

Per active stream (server-side):
- **Memory**: ~2 MB
- **CPU**: ~0.1% (idle), ~2% (active)
- **Network**: ~50 KB/s (typical), ~500 KB/s (peak)

## Error Handling

### Stream Errors

```protobuf
message StreamError {
  string error_code = 1;
  string error_message = 2;
  google.protobuf.Timestamp timestamp = 3;
  bool retryable = 4;
  int32 retry_after_ms = 5;
  string recovery_action = 6;
}
```

**Error Codes:**
- `RATE_LIMIT_EXCEEDED` - Client exceeded rate limit
- `AUTHENTICATION_FAILED` - Invalid session token
- `STREAM_CLOSED` - Stream closed by server
- `INVALID_REQUEST` - Malformed request
- `RESOURCE_EXHAUSTED` - Server resource limit reached

**Recovery Strategies:**
1. **Retryable Errors**: Automatic retry with exponential backoff
2. **Rate Limiting**: Wait for `retry_after_ms` before reconnecting
3. **Authentication**: Re-authenticate and reconnect
4. **Resource Exhausted**: Reduce subscription scope or rate

## Client Implementation Guide

### Java Client

```java
// 1. Create gRPC channel
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("dlt.aurigraph.io", 9004)
    .useTransportSecurity()
    .build();

// 2. Create service stub
UnifiedStreamingServiceGrpc.UnifiedStreamingServiceStub stub =
    UnifiedStreamingServiceGrpc.newStub(channel);

// 3. Create request
TransactionStreamRequest request = TransactionStreamRequest.newBuilder()
    .setClientId("java-client-1")
    .setSessionToken("your-auth-token")
    .build();

// 4. Subscribe to stream
StreamObserver<TransactionEvent> observer = new StreamObserver<>() {
    @Override
    public void onNext(TransactionEvent event) {
        logger.info("Transaction: {}", event.getTransactionHash());
    }

    @Override
    public void onError(Throwable t) {
        logger.error("Stream error", t);
        // Implement reconnection logic
    }

    @Override
    public void onCompleted() {
        logger.info("Stream completed");
    }
};

stub.streamTransactions(request, observer);

// 5. Cleanup
channel.shutdown();
```

### TypeScript Client (gRPC-Web)

```typescript
import { UnifiedStreamingServiceClient } from './generated/streaming_grpc_web_pb';
import { TransactionStreamRequest } from './generated/streaming_pb';

// 1. Create client
const client = new UnifiedStreamingServiceClient(
  'https://dlt.aurigraph.io:9004'
);

// 2. Create request
const request = new TransactionStreamRequest();
request.setClientId('ts-client-1');
request.setSessionToken('your-auth-token');

// 3. Subscribe to stream
const stream = client.streamTransactions(request, {});

stream.on('data', (event: TransactionEvent) => {
  console.log('Transaction:', event.getTransactionHash());
});

stream.on('error', (error) => {
  console.error('Stream error:', error);
  // Implement reconnection logic
});

stream.on('end', () => {
  console.log('Stream ended');
});
```

### Python Client

```python
import grpc
from generated import streaming_pb2, streaming_pb2_grpc

# 1. Create channel
channel = grpc.secure_channel(
    'dlt.aurigraph.io:9004',
    grpc.ssl_channel_credentials()
)

# 2. Create stub
stub = streaming_pb2_grpc.UnifiedStreamingServiceStub(channel)

# 3. Create request
request = streaming_pb2.TransactionStreamRequest(
    client_id='python-client-1',
    session_token='your-auth-token'
)

# 4. Subscribe to stream
for event in stub.StreamTransactions(request):
    print(f"Transaction: {event.transaction_hash}")

# 5. Cleanup
channel.close()
```

## Build Configuration

### Maven Configuration

The project uses Quarkus gRPC extension for automatic proto compilation:

```xml
<dependencies>
    <!-- gRPC and Protocol Buffers -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-grpc</artifactId>
    </dependency>

    <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-netty-shaded</artifactId>
    </dependency>
</dependencies>
```

### Compilation

Proto files are automatically compiled during Maven build:

```bash
# Compile proto files
./mvnw compile

# Generated Java classes location
target/generated-sources/grpc/
```

### Generated Classes

The proto compilation generates the following Java classes:

- `StreamingProto.java` - Outer class container
- `TransactionEvent.java` - Transaction event message
- `ValidatorEvent.java` - Validator event message
- `ConsensusEvent.java` - Consensus event message
- `NetworkEvent.java` - Network event message
- `MetricEvent.java` - Metric event message
- `UnifiedStreamingServiceGrpc.java` - Service stubs

## Security

### Authentication

All streaming requests require authentication:

```protobuf
message TransactionStreamRequest {
  string client_id = 1;        // Client identifier
  string session_token = 2;    // JWT authentication token
  // ... other fields
}
```

### Authorization

Stream access is controlled by JWT claims:

- `stream:transactions:read` - Transaction stream access
- `stream:validators:read` - Validator stream access
- `stream:consensus:read` - Consensus stream access
- `stream:network:read` - Network stream access
- `stream:metrics:read` - Metrics stream access

### Encryption

All streams use TLS 1.3 encryption:

- **Transport**: HTTP/2 over TLS 1.3
- **Cipher Suites**: ECDHE-RSA-AES256-GCM-SHA384 (minimum)
- **Certificate**: Let's Encrypt wildcard certificate

## Monitoring and Observability

### Stream Health

```protobuf
message StreamHealthCheck {
  string subscription_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  bool healthy = 3;
  int64 events_delivered = 4;
  int64 events_dropped = 5;
  double delivery_rate_per_sec = 6;
  double avg_latency_ms = 7;
  int32 buffer_utilization_percent = 8;
}
```

### Metrics

Server exposes Prometheus metrics:

```
# Stream subscribers
aurigraph_stream_subscribers{stream_type="transaction"} 150

# Events delivered
aurigraph_stream_events_delivered{stream_type="transaction"} 2500000

# Events dropped
aurigraph_stream_events_dropped{stream_type="transaction"} 125

# Stream latency
aurigraph_stream_latency_ms{stream_type="transaction",quantile="0.95"} 45.2
```

## Best Practices

### 1. Buffer Sizing

- **High-frequency streams (TPS)**: 200-500 events
- **Medium-frequency streams (Validators)**: 100-200 events
- **Low-frequency streams (Network)**: 50-100 events

### 2. Update Intervals

- **Transaction stream**: 100-500ms
- **Validator stream**: 2000-5000ms
- **Consensus stream**: 500-1000ms
- **Network stream**: 3000-5000ms
- **Metrics stream**: 1000-5000ms

### 3. Filtering

- Always filter by specific addresses/nodes when possible
- Use status filters to reduce bandwidth
- Enable compression for multi-stream subscriptions

### 4. Reconnection

```java
// Implement exponential backoff
int retryDelay = 1000; // Start with 1 second
int maxRetries = 10;
int retryCount = 0;

while (retryCount < maxRetries) {
    try {
        connectToStream();
        break;
    } catch (Exception e) {
        Thread.sleep(retryDelay);
        retryDelay *= 2; // Exponential backoff
        retryCount++;
    }
}
```

### 5. Resource Management

```java
// Always close channels properly
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    try {
        channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
    } catch (InterruptedException e) {
        channel.shutdownNow();
    }
}));
```

## Troubleshooting

### Common Issues

1. **High Latency**
   - Increase `update_interval_ms`
   - Reduce `buffer_size`
   - Check network connectivity

2. **Dropped Events**
   - Increase `buffer_size`
   - Reduce subscription scope
   - Implement backpressure handling

3. **Connection Drops**
   - Implement reconnection logic
   - Check authentication token expiry
   - Verify TLS certificate validity

4. **High Bandwidth**
   - Enable compression
   - Reduce update frequency
   - Use specific filters

## Version History

- **v12.0.0** (December 2025) - Initial release
  - Unified streaming service
  - Support for 5 stream types
  - Multi-stream subscriptions
  - Interactive bidirectional streaming

## Support

For issues and questions:
- GitHub Issues: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- Documentation: https://docs.aurigraph.io
- Email: support@aurigraph.io
