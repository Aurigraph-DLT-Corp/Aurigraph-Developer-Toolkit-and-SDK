# Story 8: GraphQL API & gRPC/HTTP2 Real-Time Streaming - REVISED PLAN

**Version**: 2.0 (Revised - NO WebSockets)
**Date**: December 24, 2025
**Status**: REVISED & APPROVED
**Estimated Duration**: 5-7 business days
**Dependencies**: Story 5-7 (v11.0.0 baseline) - COMPLETE ✅

---

## 🎯 CRITICAL ARCHITECTURAL CHANGE

### Removed
- ❌ WebSocket endpoints (`/ws/approvals/{id}`)
- ❌ WebSocket session management
- ❌ HTML5 WebSocket protocol

### Added (gRPC/HTTP2 Native)
- ✅ gRPC services with Protocol Buffers
- ✅ Bidirectional streaming (HTTP/2 Server Push)
- ✅ Protocol Buffer serialization
- ✅ HTTP/2 multiplexing
- ✅ Superior performance for 2M+ TPS target

---

## 📐 ARCHITECTURE DESIGN - gRPC FOCUSED

### Protocol Buffer Definitions

**`approvals.proto`** - Core approval operations
```protobuf
syntax = "proto3";
package io.aurigraph.v11.grpc;

service ApprovalService {
  // Query single approval
  rpc GetApproval(ApprovalRequest) returns (ApprovalResponse);

  // List approvals with filtering
  rpc ListApprovals(ListApprovalsRequest) returns (ListApprovalsResponse);

  // Get statistics
  rpc GetApprovalStats(StatsRequest) returns (ApprovalStatsResponse);

  // Stream approval events (Server Push / Bidirectional)
  rpc StreamApprovalEvents(StreamRequest) returns (stream ApprovalEvent);

  // Submit vote (via gRPC instead of REST)
  rpc SubmitVote(VoteRequest) returns (VoteResponse);

  // Execute approved action
  rpc ExecuteApproval(ExecutionRequest) returns (ExecutionResponse);
}

message ApprovalRequest {
  string approval_id = 1;
}

message ApprovalResponse {
  string id = 1;
  ApprovalStatus status = 2;
  string token_version_id = 3;
  int32 total_validators = 4;
  int64 voting_window_end_ms = 5;
  repeated ValidatorVote votes = 6;
  int64 consensus_reached_at_ms = 7;
  int64 executed_at_ms = 8;
  int64 rejected_at_ms = 9;
}

enum ApprovalStatus {
  PENDING = 0;
  APPROVED = 1;
  REJECTED = 2;
  EXPIRED = 3;
}

message ValidatorVote {
  string validator_id = 1;
  VoteChoice choice = 2;
  int64 submitted_at_ms = 3;
}

enum VoteChoice {
  APPROVE = 0;
  REJECT = 1;
  ABSTAIN = 2;
}

message ListApprovalsRequest {
  ApprovalStatus status = 1;  // Optional filter
  int32 limit = 2;
  int32 offset = 3;
}

message ListApprovalsResponse {
  repeated ApprovalResponse approvals = 1;
  int32 total = 2;
}

message StatsRequest {}

message ApprovalStatsResponse {
  int32 total_approvals = 1;
  int32 pending = 2;
  int32 approved = 3;
  int32 rejected = 4;
  int32 expired = 5;
  double average_consensus_time_seconds = 6;
  int64 timestamp_ms = 7;
}

message StreamRequest {
  string approval_id = 1;
  repeated string event_types = 2;  // VOTE_SUBMITTED, CONSENSUS_REACHED, etc.
}

message ApprovalEvent {
  string approval_id = 1;
  string event_type = 2;
  int64 timestamp_ms = 3;
  google.protobuf.Struct event_data = 4;  // Dynamic JSON data
}

message VoteRequest {
  string approval_id = 1;
  string validator_id = 2;
  VoteChoice choice = 3;
}

message VoteResponse {
  bool success = 1;
  string message = 2;
  ValidatorVote vote = 3;
}

message ExecutionRequest {
  string approval_id = 1;
}

message ExecutionResponse {
  bool success = 1;
  string message = 2;
  string execution_id = 3;
}
```

**`webhooks.proto`** - Webhook registry (gRPC-based)
```protobuf
syntax = "proto3";
package io.aurigraph.v11.grpc;

service WebhookService {
  rpc RegisterWebhook(RegisterRequest) returns (RegisterResponse);
  rpc UnregisterWebhook(UnregisterRequest) returns (UnregisterResponse);
  rpc ListWebhooks(ListRequest) returns (ListResponse);
  rpc GetWebhookStatus(StatusRequest) returns (StatusResponse);
  rpc StreamWebhookEvents(StreamRequest) returns (stream WebhookEvent);
}

message RegisterRequest {
  string url = 1;
  repeated string events = 2;
}

message RegisterResponse {
  bool success = 1;
  string webhook_id = 2;
  string secret_key = 3;
}

message UnregisterRequest {
  string webhook_id = 1;
}

message UnregisterResponse {
  bool success = 1;
}

message ListRequest {
  bool active_only = 1;
}

message ListResponse {
  repeated WebhookInfo webhooks = 1;
}

message WebhookInfo {
  string webhook_id = 1;
  string url = 2;
  repeated string events = 3;
  bool is_active = 4;
  int64 created_at_ms = 5;
  int64 last_delivery_at_ms = 6;
  int32 success_count = 7;
  int32 failure_count = 8;
}

message StatusRequest {
  string webhook_id = 1;
}

message StatusResponse {
  string webhook_id = 1;
  bool is_active = 2;
  WebhookDeliveryStats stats = 3;
}

message WebhookDeliveryStats {
  int32 total_attempts = 1;
  int32 successful = 2;
  int32 failed = 3;
  double success_rate = 4;
  int32 average_response_time_ms = 5;
}

message StreamRequest {
  string webhook_id = 1;
}

message WebhookEvent {
  string webhook_id = 1;
  string event_type = 2;
  int32 http_status = 3;
  int32 response_time_ms = 4;
  int64 timestamp_ms = 5;
}
```

---

## 🛠️ IMPLEMENTATION TASKS - gRPC FOCUSED

### Phase 1: Protocol Buffer Definitions (1 day)

**Files to Create:**
- `src/main/proto/approvals.proto` (150 lines)
- `src/main/proto/webhooks.proto` (100 lines)
- `src/main/proto/common.proto` (common types shared)

**Maven Configuration:**
```xml
<plugin>
  <groupId>org.xolstice.maven.plugins</groupId>
  <artifactId>protobuf-maven-plugin</artifactId>
  <version>0.6.1</version>
  <configuration>
    <protocArtifact>com.google.protobuf:protoc:4.25.1:exe:${os.detected.classifier}</protocArtifact>
    <pluginId>grpc-java</pluginId>
    <pluginArtifact>io.grpc:protoc-gen-grpc-java:1.59.0:exe:${os.detected.classifier}</pluginArtifact>
  </configuration>
</plugin>
```

---

### Phase 2: gRPC Service Implementation (2 days)

**Files to Create:**

1. **ApprovalGrpcService.java** (200 lines)
```java
@GrpcService
public class ApprovalGrpcService extends ApprovalServiceGrpc.ApprovalServiceImplBase {

  @Inject VVBApprovalService approvalService;
  @Inject ApprovalSubscriptionManager subscriptionManager;

  @Override
  public void getApproval(ApprovalRequest request,
                          StreamObserver<ApprovalResponse> responseObserver) {
    // Unary RPC - single request/response
  }

  @Override
  public void listApprovals(ListApprovalsRequest request,
                           StreamObserver<ApprovalResponse> responseObserver) {
    // Server streaming - single request, multiple responses
  }

  @Override
  public void streamApprovalEvents(StreamRequest request,
                                   StreamObserver<ApprovalEvent> responseObserver) {
    // Bidirectional streaming - real-time event push
    // Replaces WebSocket functionality
  }

  @Override
  public void submitVote(VoteRequest request,
                        StreamObserver<VoteResponse> responseObserver) {
    // Unary RPC - replaces REST endpoint
  }
}
```

2. **WebhookGrpcService.java** (150 lines)
```java
@GrpcService
public class WebhookGrpcService extends WebhookServiceGrpc.WebhookServiceImplBase {

  @Inject ApprovalWebhookService webhookService;
  @Inject WebhookRegistrationRepository webhookRepo;

  @Override
  public void registerWebhook(RegisterRequest request,
                             StreamObserver<RegisterResponse> responseObserver) {
    // Database-backed webhook registration via gRPC
  }

  @Override
  public void streamWebhookEvents(StreamRequest request,
                                  StreamObserver<WebhookEvent> responseObserver) {
    // Real-time webhook delivery status streaming
  }
}
```

3. **ApprovalProtoConverter.java** (100 lines)
   - Converts between domain models and Protocol Buffers
   - Handles timestamp conversion (LocalDateTime ↔ millis)
   - Manages enum conversions

**Key Features:**
- ✅ gRPC Unary RPC for simple get/set operations
- ✅ Server Streaming for list operations
- ✅ Bidirectional Streaming for real-time events (replaces WebSocket)
- ✅ Protocol Buffer serialization (efficient binary format)
- ✅ HTTP/2 multiplexing (multiple streams on single connection)
- ✅ Automatic backpressure handling
- ✅ Built-in keepalive and health checks

---

### Phase 3: Webhook Registry Migration (1.5 days)

**Database Schema:**
```sql
CREATE TABLE approval_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(2048) NOT NULL UNIQUE,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret_key VARCHAR(256) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_delivery_at TIMESTAMP,
  delivery_success_count INT DEFAULT 0,
  delivery_failure_count INT DEFAULT 0
);

CREATE TABLE webhook_delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES approval_webhooks(id),
  event_type VARCHAR(100) NOT NULL,
  approval_id VARCHAR(255),
  http_status INT,
  response_time_ms INT,
  attempt_number INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON approval_webhooks(is_active);
CREATE INDEX ON webhook_delivery_attempts(webhook_id, created_at);
```

**JPA Entities:**
- `WebhookRegistration.java`
- `WebhookDeliveryAttempt.java`
- `WebhookRegistrationRepository.java`

---

### Phase 4: GraphQL over gRPC (1 day)

**Update ApprovalGraphQLAPI.java:**
- ✅ Keep existing GraphQL queries and mutations
- ✅ Use gRPC client to communicate with ApprovalGrpcService
- ✅ Subscriptions now backed by gRPC Server Push (bidirectional streaming)
- ✅ Maintains GraphQL flexibility while leveraging gRPC performance

**New ApprovalGrpcClient.java:**
```java
@ApplicationScoped
public class ApprovalGrpcClient {
  @Inject
  ApprovalServiceGrpc.ApprovalServiceBlockingStub blockingStub;

  @Inject
  ApprovalServiceGrpc.ApprovalServiceStub asyncStub;

  public ApprovalResponse getApproval(String approvalId) { }
  public Iterator<ApprovalResponse> listApprovals(int limit, int offset) { }
  public void streamApprovalEvents(String approvalId, StreamObserver observer) { }
}
```

---

### Phase 5: Testing & Validation (1.5 days)

**Unit Tests:**
- gRPC service method tests (unary, server streaming, bidirectional)
- Protocol Buffer conversion tests
- Error handling tests

**Integration Tests:**
- gRPC channel creation and management
- Real-time event streaming over gRPC
- Webhook registry CRUD operations
- Database migration validation

**Performance Tests:**
- gRPC call latency <100ms (vs GraphQL HTTP <1s baseline)
- Bidirectional streaming throughput >10k events/sec
- Memory usage for 1000+ concurrent streams

---

## 📦 KEY FILES TO CREATE

### Protocol Buffers (2 files)
1. `src/main/proto/approvals.proto`
2. `src/main/proto/webhooks.proto`

### gRPC Services (2 files)
1. `ApprovalGrpcService.java` - Approval operations
2. `WebhookGrpcService.java` - Webhook management

### Utilities (2 files)
1. `ApprovalProtoConverter.java` - Proto ↔ Domain model conversion
2. `ApprovalGrpcClient.java` - gRPC client for GraphQL

### Tests (3 files)
1. `ApprovalGrpcServiceTest.java` - Unit tests
2. `ApprovalGrpcStreamingE2ETest.java` - Streaming tests
3. `WebhookGrpcServiceTest.java` - Webhook tests

### Database (1 file)
1. `V33__create_webhook_registry.sql` - Migration

---

## 🧪 TESTING STRATEGY

### Unit Tests (15+ tests)
- Protocol Buffer marshaling/unmarshaling
- gRPC stub creation
- Domain model conversion
- Error handling

### Integration Tests (10+ tests)
- gRPC unary RPC call flow
- Server streaming list operations
- Bidirectional streaming with real-time events
- Webhook CRUD operations

### Performance Tests
- gRPC call latency <100ms ✅
- Streaming throughput >10k events/sec ✅
- Connection overhead <10ms ✅

### E2E Tests
- GraphQL → gRPC client → gRPC server flow
- Real-time subscription delivery via gRPC
- Webhook registration and delivery tracking

---

## 📊 PERFORMANCE CHARACTERISTICS

### gRPC/HTTP2 vs WebSocket vs REST

| Metric | REST | WebSocket | gRPC/HTTP2 |
|--------|------|-----------|-----------|
| **Latency** | 50-100ms | 20-50ms | 10-20ms |
| **Throughput** | 1k msgs/s | 5k msgs/s | 50k msgs/s |
| **Protocol Overhead** | HTTP 1.1 headers | WS frame overhead | HTTP/2 compression |
| **Multiplexing** | ❌ | ❌ | ✅ (native) |
| **Binary Format** | JSON | JSON | ✅ Protobuf |
| **Streaming** | Polling | ✅ Bidirectional | ✅ Bidirectional |
| **TPS Target** | 1M | 2M* | **2M+** ✅ |

*gRPC/HTTP2 is the ideal choice for 2M+ TPS target*

---

## 🔄 GRAPHQL COMPATIBILITY

### GraphQL Queries (unchanged)
```graphql
query {
  approvals(status: PENDING, limit: 10) { id status }
}
```
↓ (uses gRPC client internally)
→ ApprovalGrpcService.ListApprovals()

### GraphQL Subscriptions (gRPC-backed)
```graphql
subscription {
  approvalStatusChanged(id: "abc-123") { approvalId timestamp }
}
```
↓ (uses bidirectional gRPC stream)
→ ApprovalGrpcService.StreamApprovalEvents()

**Result**: Users can use familiar GraphQL syntax while leveraging gRPC performance internally

---

## 🚀 TIMELINE

**Sprint: 5-7 Business Days**

| Day | Phase | Deliverables |
|-----|-------|--------------|
| 1 | Phase 1 | Protobuf definitions, Maven config |
| 2-3 | Phase 2 | gRPC service implementations, converters |
| 4 | Phase 3 | Database schema, JPA entities, migrations |
| 5 | Phase 4 | GraphQL client integration, GraphQL updates |
| 6-7 | Phase 5 | Unit tests, E2E tests, performance validation |

---

## 🎓 ARCHITECTURAL ADVANTAGES

### gRPC/HTTP2 Benefits for 2M+ TPS

1. **Multiplexing**: Multiple streams on single TCP connection
   - Reduces connection overhead
   - Better resource utilization

2. **Binary Protocol (Protobuf)**:
   - 5-10x smaller than JSON
   - Faster serialization/deserialization
   - Type-safe schema

3. **Bidirectional Streaming**:
   - True server push (no polling)
   - Lower latency (<20ms)
   - Native HTTP/2 feature

4. **Header Compression**:
   - HTTP/2 HPACK compression
   - Reduces overhead for high-frequency calls

5. **Backward Compatibility**:
   - GraphQL queries still work
   - gRPC underneath as transport layer
   - REST API remains unchanged

---

## ⚠️ MIGRATION STRATEGY

### Phase 0: Keep Existing Code
- ✅ REST API remains operational
- ✅ GraphQL HTTP endpoint remains
- ✅ No breaking changes

### Phase 1-5: Add gRPC Services
- ✅ New gRPC services parallel to existing REST
- ✅ GraphQL client switches to gRPC backend
- ✅ Gradual migration path for consumers

### Future: Optional REST Deprecation
- Metrics show gRPC usage rate
- REST endpoints remain for compatibility
- Document gRPC as preferred transport

---

## 📋 SPARC FRAMEWORK UPDATES

**Situation**: High-performance approval system requires <20ms latency for real-time updates

**Problem**: WebSockets insufficient for 2M+ TPS target; gRPC/HTTP2 provides 5x throughput

**Action**: Implement gRPC services with bidirectional streaming, Protocol Buffers

**Result**: Achieves 2M+ TPS with sub-20ms latency, multiplexed streams, binary encoding

**Consequence**: Positions Aurigraph for enterprise-scale DLT operations with superior performance

---

## 📚 DOCUMENTATION

### API Documentation
1. **gRPC Service Definition**: Protocol Buffers (self-documenting)
2. **gRPC Usage Guide**: Client connection, streaming patterns
3. **GraphQL→gRPC Mapping**: How queries translate to gRPC calls
4. **Performance Guide**: Optimization tips, benchmarking

### Code Examples

**Java Client (blocking)**:
```java
ManagedChannel channel = ManagedChannelBuilder
  .forAddress("localhost", 9004)
  .usePlaintext()
  .build();

ApprovalServiceBlockingStub stub = ApprovalServiceGrpc.newBlockingStub(channel);

ApprovalResponse resp = stub.getApproval(
  ApprovalRequest.newBuilder()
    .setApprovalId("abc-123")
    .build()
);
```

**Java Streaming (async)**:
```java
ApprovalServiceStub asyncStub = ApprovalServiceGrpc.newStub(channel);

asyncStub.streamApprovalEvents(
  StreamRequest.newBuilder().setApprovalId("abc-123").build(),
  new StreamObserver<ApprovalEvent>() {
    public void onNext(ApprovalEvent event) {
      System.out.println("Event: " + event.getEventType());
    }
    public void onError(Throwable t) { }
    public void onCompleted() { }
  }
);
```

---

## ✅ SUCCESS CRITERIA

- [ ] Protocol Buffer definitions complete and validated
- [ ] ApprovalGrpcService fully functional (unary + streaming)
- [ ] WebhookGrpcService fully functional
- [ ] Database-backed webhook registry migrated
- [ ] GraphQL queries/subscriptions backed by gRPC
- [ ] 15+ unit tests passing
- [ ] 10+ integration tests passing
- [ ] Performance benchmarks: gRPC latency <100ms
- [ ] Bidirectional streaming throughput >10k events/sec
- [ ] Code coverage ≥80%
- [ ] Documentation complete
- [ ] CI/CD pipeline updated

---

## 🔗 RELATED STORIES

- **Story 9**: Full gRPC Protocol Support (extends Story 8)
- **Story 10**: Cross-chain Bridge via gRPC (depends on Story 8)
- **Story 11**: AI Optimization over gRPC Streaming (depends on Story 8)

---

*Generated*: December 24, 2025
*Status*: APPROVED - NO WebSockets, gRPC/HTTP2 Only
*Version*: 2.0 (Revised)
*Dependencies*: Story 5-7 Complete ✅
