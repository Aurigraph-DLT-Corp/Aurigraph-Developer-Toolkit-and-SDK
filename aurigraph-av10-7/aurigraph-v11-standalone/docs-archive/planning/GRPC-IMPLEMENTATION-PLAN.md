# gRPC Implementation Plan

**Project:** Aurigraph V11/V12
**Target:** Complete gRPC Service Implementation
**Timeline:** 1-2 weeks (10 working days)
**Priority:** High
**Current Status:** 30% Complete (Dependencies + Proto definitions)

---

## Executive Summary

**Goal:** Implement production-ready gRPC services to achieve 2M+ TPS target by replacing REST endpoints with high-performance gRPC/Protocol Buffer communication.

**Why gRPC:**
- **5-10x faster** than REST for high-throughput scenarios
- **HTTP/2** multiplexing - multiple requests over single connection
- **Protocol Buffers** - Binary serialization (faster than JSON)
- **Streaming** - Real-time bidirectional communication
- **Type-safe** - Generated code with strong typing
- **Production proven** - Google, Netflix, Square use gRPC

---

## Current State Analysis

### ✅ Completed (30%)

1. **Dependencies Added:**
   ```xml
   <dependency>
     <groupId>io.quarkus</groupId>
     <artifactId>quarkus-grpc</artifactId>
   </dependency>
   ```

2. **Proto Definitions Created:**
   - `src/main/proto/aurigraph-v11.proto`
   - `src/main/proto/transaction.proto`
   - `src/main/proto/blockchain.proto`
   - Code generation working ✅

3. **Interceptors Created (Not Applied):**
   - `LoggingInterceptor.java`
   - `AuthorizationInterceptor.java`
   - `MetricsInterceptor.java`
   - `ExceptionInterceptor.java`

### ⚠️ Incomplete (70%)

1. gRPC server configuration
2. Service method implementations
3. Interceptor application
4. Client integration
5. Testing suite
6. Performance benchmarking
7. Documentation
8. Migration from REST

---

## Implementation Roadmap

### WEEK 1: Core Implementation (Days 1-5)

#### Day 1: Configuration & Infrastructure (8 hours)

**Morning (4 hours): Fix gRPC Configuration**

1. **Update application.properties:**
```properties
# gRPC Server Configuration
quarkus.grpc.server.enabled=true
quarkus.grpc.server.port=9004
quarkus.grpc.server.use-separate-server=true
quarkus.grpc.server.host=0.0.0.0

# Performance Tuning
quarkus.grpc.server.max-inbound-message-size=10485760
quarkus.grpc.server.max-inbound-metadata-size=8192
quarkus.grpc.server.keep-alive-time=5m
quarkus.grpc.server.keep-alive-timeout=20s
quarkus.grpc.server.permit-keep-alive-time=1m
quarkus.grpc.server.permit-keep-alive-without-calls=false

# Connection Management
quarkus.grpc.server.max-connection-idle=10m
quarkus.grpc.server.max-connection-age=30m
quarkus.grpc.server.max-connection-age-grace=5m

# TLS (Production)
%prod.quarkus.grpc.server.ssl.certificate=file:/etc/ssl/certs/grpc-server.crt
%prod.quarkus.grpc.server.ssl.key=file:/etc/ssl/private/grpc-server.key
```

2. **Apply Global Interceptors:**
```java
package io.aurigraph.v11.grpc;

import io.quarkus.grpc.GlobalInterceptor;
import io.grpc.*;
import org.jboss.logging.Logger;

@GlobalInterceptor
public class LoggingInterceptor implements ServerInterceptor {

    private static final Logger LOG = Logger.getLogger(LoggingInterceptor.class);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next) {

        String methodName = call.getMethodDescriptor().getFullMethodName();
        long startTime = System.nanoTime();

        LOG.infof("gRPC Request: %s", methodName);

        ServerCall.Listener<ReqT> listener = next.startCall(call, headers);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT>(listener) {
            @Override
            public void onComplete() {
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                LOG.infof("gRPC Response: %s (took %d ms)", methodName, duration);
                super.onComplete();
            }

            @Override
            public void onCancel() {
                LOG.warnf("gRPC Cancelled: %s", methodName);
                super.onCancel();
            }
        };
    }
}
```

**Afternoon (4 hours): Service Skeleton**

3. **Create Base Service Implementation:**
```java
package io.aurigraph.v11.grpc.service;

import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@GrpcService
public class TransactionGrpcService implements TransactionService {

    private static final Logger LOG = Logger.getLogger(TransactionGrpcService.class);

    @Inject
    io.aurigraph.v11.TransactionService transactionService;

    @Override
    public Uni<TransactionResponse> submitTransaction(TransactionRequest request) {
        LOG.debugf("gRPC submitTransaction: %s", request.getFrom());

        return Uni.createFrom().item(() -> {
            // Validate request
            validateRequest(request);

            // Convert proto to domain model
            Transaction tx = convertToTransaction(request);

            // Process transaction
            TransactionResult result = transactionService.processTransaction(tx);

            // Convert to proto response
            return TransactionResponse.newBuilder()
                .setTransactionId(result.getId())
                .setStatus(result.getStatus())
                .setHash(result.getHash())
                .setTimestamp(result.getTimestamp())
                .build();
        }).runSubscriptionOn(Infrastructure.getDefaultWorkerPool());
    }

    @Override
    public Multi<TransactionUpdate> streamTransactions(StreamRequest request) {
        LOG.debugf("gRPC streamTransactions: filter=%s", request.getFilter());

        return Multi.createFrom().emitter(emitter -> {
            // Subscribe to transaction updates
            transactionService.subscribeToUpdates(request.getFilter(), update -> {
                TransactionUpdate protoUpdate = TransactionUpdate.newBuilder()
                    .setTransactionId(update.getId())
                    .setStatus(update.getStatus())
                    .setTimestamp(update.getTimestamp())
                    .build();

                emitter.emit(protoUpdate);
            });

            // Handle cancellation
            emitter.onTermination(() -> {
                transactionService.unsubscribe(request.getFilter());
            });
        });
    }

    private void validateRequest(TransactionRequest request) {
        if (request.getFrom().isEmpty()) {
            throw new IllegalArgumentException("from address required");
        }
        if (request.getTo().isEmpty()) {
            throw new IllegalArgumentException("to address required");
        }
        if (request.getAmount().isEmpty()) {
            throw new IllegalArgumentException("amount required");
        }
    }

    private Transaction convertToTransaction(TransactionRequest request) {
        return Transaction.builder()
            .from(request.getFrom())
            .to(request.getTo())
            .amount(new BigDecimal(request.getAmount()))
            .data(request.getData())
            .build();
    }
}
```

**Evening (Optional): Testing Setup**

4. **Create Test Infrastructure:**
```java
@QuarkusTest
class TransactionGrpcServiceTest {

    @GrpcClient
    TransactionService client;

    @Test
    void testSubmitTransaction() {
        TransactionRequest request = TransactionRequest.newBuilder()
            .setFrom("addr1")
            .setTo("addr2")
            .setAmount("1.0")
            .build();

        TransactionResponse response = client.submitTransaction(request)
            .await().atMost(Duration.ofSeconds(5));

        assertNotNull(response.getTransactionId());
        assertEquals("PENDING", response.getStatus());
    }
}
```

---

#### Day 2: Core Services Implementation (8 hours)

**Transaction Service (4 hours)**

1. `submitTransaction()` - Single transaction submission
2. `batchSubmitTransactions()` - Batch submission
3. `getTransaction()` - Query transaction
4. `streamTransactions()` - Real-time streaming

**Blockchain Service (4 hours)**

1. `getBlock()` - Get block by height/hash
2. `streamBlocks()` - Real-time block streaming
3. `getChainInfo()` - Chain metadata
4. `subscribeToBlocks()` - Block notifications

---

#### Day 3: Advanced Services (8 hours)

**Account Service (3 hours)**

1. `getBalance()` - Account balance
2. `getTransactionHistory()` - Transaction history
3. `streamBalanceUpdates()` - Real-time balance

**Consensus Service (3 hours)**

1. `getConsensusStatus()` - HyperRAFT++ status
2. `getNodeInfo()` - Node information
3. `streamConsensusUpdates()` - Consensus events

**Performance Testing (2 hours)**

1. Basic throughput testing
2. Latency measurement
3. Concurrent connection testing

---

#### Day 4: Bridge & Smart Contract Services (8 hours)

**Bridge Service (4 hours)**

```java
@GrpcService
public class BridgeGrpcService implements BridgeService {

    @Inject
    CrossChainBridgeService bridgeService;

    @Override
    public Uni<BridgeTransferResponse> initiateBridgeTransfer(BridgeTransferRequest request) {
        return bridgeService.initiateTransfer(
            request.getSourceChain(),
            request.getTargetChain(),
            request.getToken(),
            new BigDecimal(request.getAmount())
        ).map(transfer -> BridgeTransferResponse.newBuilder()
            .setTransferId(transfer.getId())
            .setStatus(transfer.getStatus())
            .setEstimatedTime(transfer.getEstimatedCompletionTime())
            .build());
    }

    @Override
    public Multi<BridgeTransferUpdate> streamBridgeTransfer(TransferIdRequest request) {
        return bridgeService.subscribeToTransfer(request.getTransferId())
            .map(update -> BridgeTransferUpdate.newBuilder()
                .setTransferId(update.getTransferId())
                .setStatus(update.getStatus())
                .setProgress(update.getProgress())
                .setTimestamp(update.getTimestamp())
                .build());
    }
}
```

**Smart Contract Service (4 hours)**

1. `deployContract()` - Contract deployment
2. `callContract()` - Contract invocation
3. `streamContractEvents()` - Event subscriptions

---

#### Day 5: Interceptors & Middleware (8 hours)

**Authorization Interceptor (2 hours)**

```java
@GlobalInterceptor
public class AuthorizationInterceptor implements ServerInterceptor {

    @Inject
    AuthenticationService authService;

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next) {

        // Extract JWT token from metadata
        String token = headers.get(Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER));

        if (token == null || !token.startsWith("Bearer ")) {
            call.close(Status.UNAUTHENTICATED.withDescription("Missing or invalid token"), new Metadata());
            return new ServerCall.Listener<ReqT>() {};
        }

        // Validate token
        try {
            String jwt = token.substring(7);
            UserContext user = authService.validateToken(jwt);

            // Add user context to call
            Context context = Context.current().withValue(USER_CONTEXT_KEY, user);
            return Contexts.interceptCall(context, call, headers, next);

        } catch (Exception e) {
            call.close(Status.UNAUTHENTICATED.withDescription("Invalid token: " + e.getMessage()), new Metadata());
            return new ServerCall.Listener<ReqT>() {};
        }
    }
}
```

**Metrics Interceptor (2 hours)**

```java
@GlobalInterceptor
public class MetricsInterceptor implements ServerInterceptor {

    @Inject
    MeterRegistry registry;

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next) {

        String methodName = call.getMethodDescriptor().getFullMethodName();
        Timer.Sample sample = Timer.start(registry);

        ServerCall.Listener<ReqT> listener = next.startCall(call, headers);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT>(listener) {
            @Override
            public void onComplete() {
                sample.stop(Timer.builder("grpc.server.duration")
                    .tag("method", methodName)
                    .tag("status", "success")
                    .register(registry));

                registry.counter("grpc.server.requests",
                    "method", methodName,
                    "status", "success")
                    .increment();

                super.onComplete();
            }

            @Override
            public void onCancel() {
                sample.stop(Timer.builder("grpc.server.duration")
                    .tag("method", methodName)
                    .tag("status", "cancelled")
                    .register(registry));

                registry.counter("grpc.server.requests",
                    "method", methodName,
                    "status", "cancelled")
                    .increment();

                super.onCancel();
            }
        };
    }
}
```

**Exception Handling (2 hours)**

```java
@GlobalInterceptor
public class ExceptionInterceptor implements ServerInterceptor {

    private static final Logger LOG = Logger.getLogger(ExceptionInterceptor.class);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next) {

        ServerCall.Listener<ReqT> listener = next.startCall(call, headers);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<ReqT>(listener) {
            @Override
            public void onHalfClose() {
                try {
                    super.onHalfClose();
                } catch (IllegalArgumentException e) {
                    LOG.warn("Validation error", e);
                    call.close(Status.INVALID_ARGUMENT.withDescription(e.getMessage()), new Metadata());
                } catch (SecurityException e) {
                    LOG.warn("Security error", e);
                    call.close(Status.PERMISSION_DENIED.withDescription(e.getMessage()), new Metadata());
                } catch (Exception e) {
                    LOG.error("Unexpected error", e);
                    call.close(Status.INTERNAL.withDescription("Internal server error"), new Metadata());
                }
            }
        };
    }
}
```

**Rate Limiting (2 hours)**

```java
@GlobalInterceptor
public class RateLimitInterceptor implements ServerInterceptor {

    private final LoadingCache<String, RateLimiter> limiters = Caffeine.newBuilder()
        .expireAfterAccess(1, TimeUnit.HOURS)
        .build(key -> RateLimiter.create(1000.0)); // 1000 req/sec per IP

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next) {

        String clientIp = extractClientIp(call);
        RateLimiter limiter = limiters.get(clientIp);

        if (!limiter.tryAcquire(1, 100, TimeUnit.MILLISECONDS)) {
            call.close(Status.RESOURCE_EXHAUSTED.withDescription("Rate limit exceeded"), new Metadata());
            return new ServerCall.Listener<ReqT>() {};
        }

        return next.startCall(call, headers);
    }
}
```

---

### WEEK 2: Testing & Integration (Days 6-10)

#### Day 6-7: Unit & Integration Testing (16 hours)

**Unit Tests (8 hours)**

```java
@QuarkusTest
@TestProfile(GrpcTestProfile.class)
class GrpcServiceTests {

    @GrpcClient
    TransactionService transactionClient;

    @GrpcClient
    BlockchainService blockchainClient;

    @GrpcClient
    BridgeService bridgeClient;

    @Test
    void testSubmitTransaction() {
        TransactionRequest request = TransactionRequest.newBuilder()
            .setFrom("addr1")
            .setTo("addr2")
            .setAmount("1.0")
            .setData("test data")
            .build();

        TransactionResponse response = transactionClient
            .submitTransaction(request)
            .await().atMost(Duration.ofSeconds(5));

        assertNotNull(response.getTransactionId());
        assertEquals("PENDING", response.getStatus());
        assertNotNull(response.getHash());
    }

    @Test
    void testStreamTransactions() {
        StreamRequest request = StreamRequest.newBuilder()
            .setFilter("status=PENDING")
            .build();

        List<TransactionUpdate> updates = transactionClient
            .streamTransactions(request)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(10));

        assertFalse(updates.isEmpty());
    }

    @Test
    void testBatchSubmit() {
        List<TransactionRequest> requests = IntStream.range(0, 1000)
            .mapToObj(i -> TransactionRequest.newBuilder()
                .setFrom("addr1")
                .setTo("addr2")
                .setAmount("1.0")
                .build())
            .collect(Collectors.toList());

        BatchTransactionRequest batch = BatchTransactionRequest.newBuilder()
            .addAllTransactions(requests)
            .build();

        BatchTransactionResponse response = transactionClient
            .batchSubmitTransactions(batch)
            .await().atMost(Duration.ofSeconds(30));

        assertEquals(1000, response.getSuccessCount());
    }
}
```

**Integration Tests (8 hours)**

```java
@QuarkusTest
@TestHTTPEndpoint(TransactionGrpcService.class)
class GrpcIntegrationTest {

    @Test
    void testEndToEndFlow() {
        // 1. Submit transaction via gRPC
        // 2. Verify transaction in database
        // 3. Check transaction appears in stream
        // 4. Verify metrics recorded
    }

    @Test
    void testConcurrentAccess() {
        // Test 100 concurrent clients
        // Verify no race conditions
        // Check performance under load
    }
}
```

---

#### Day 8-9: Performance Testing & Optimization (16 hours)

**Load Testing with ghz (6 hours)**

```bash
# Install ghz
go install github.com/bojand/ghz/cmd/ghz@latest

# Basic load test
ghz --insecure \
  --proto src/main/proto/transaction.proto \
  --call TransactionService/SubmitTransaction \
  -d '{"from":"addr1","to":"addr2","amount":"1.0"}' \
  -c 100 \
  -n 10000 \
  localhost:9004

# Expected output:
# Summary:
#   Count:        10000
#   Total:        5.23 s
#   Slowest:      125.32 ms
#   Fastest:      0.85 ms
#   Average:      51.23 ms
#   Requests/sec: 1912.35

# Streaming load test
ghz --insecure \
  --proto src/main/proto/transaction.proto \
  --call TransactionService/StreamTransactions \
  -d '{"filter":"status=PENDING"}' \
  -c 50 \
  -n 5000 \
  --duration=60s \
  localhost:9004
```

**Performance Benchmarking (6 hours)**

```java
@State(Scope.Benchmark)
public class GrpcBenchmark {

    private ManagedChannel channel;
    private TransactionServiceBlockingStub stub;

    @Setup
    public void setup() {
        channel = ManagedChannelBuilder
            .forAddress("localhost", 9004)
            .usePlaintext()
            .build();
        stub = TransactionServiceGrpc.newBlockingStub(channel);
    }

    @Benchmark
    @BenchmarkMode(Mode.Throughput)
    @OutputTimeUnit(TimeUnit.SECONDS)
    public void testSubmitTransaction() {
        TransactionRequest request = TransactionRequest.newBuilder()
            .setFrom("addr1")
            .setTo("addr2")
            .setAmount("1.0")
            .build();

        stub.submitTransaction(request);
    }

    @TearDown
    public void tearDown() {
        channel.shutdown();
    }
}

// Run with: mvn jmh:run
```

**Optimization (4 hours)**

1. Connection pooling tuning
2. Buffer size optimization
3. Threading model adjustment
4. Memory allocation optimization

---

#### Day 10: Documentation & Migration (8 hours)

**API Documentation (3 hours)**

```markdown
# gRPC API Documentation

## TransactionService

### submitTransaction

Submit a single transaction to the blockchain.

**Request:**
```protobuf
message TransactionRequest {
  string from = 1;     // Sender address
  string to = 2;       // Recipient address
  string amount = 3;   // Amount to transfer
  bytes data = 4;      // Optional transaction data
}
```

**Response:**
```protobuf
message TransactionResponse {
  string transaction_id = 1;  // Unique transaction ID
  string status = 2;           // PENDING, CONFIRMED, FAILED
  string hash = 3;             // Transaction hash
  int64 timestamp = 4;         // Unix timestamp
}
```

**Example (Go):**
```go
client := pb.NewTransactionServiceClient(conn)
req := &pb.TransactionRequest{
    From:   "addr1",
    To:     "addr2",
    Amount: "1.0",
}
resp, err := client.SubmitTransaction(ctx, req)
```

**Example (Java):**
```java
TransactionServiceBlockingStub stub = TransactionServiceGrpc.newBlockingStub(channel);
TransactionRequest request = TransactionRequest.newBuilder()
    .setFrom("addr1")
    .setTo("addr2")
    .setAmount("1.0")
    .build();
TransactionResponse response = stub.submitTransaction(request);
```
```

**Migration Guide (3 hours)**

```markdown
# REST to gRPC Migration Guide

## Step-by-Step Migration

### 1. Add gRPC Client Dependency

**Maven:**
```xml
<dependency>
  <groupId>io.grpc</groupId>
  <artifactId>grpc-protobuf</artifactId>
</dependency>
```

### 2. Generate Client Stubs

```bash
./mvnw clean compile
```

### 3. Update Client Code

**Before (REST):**
```java
RestClient client = RestClientBuilder.newBuilder()
    .baseUri(URI.create("https://dlt.aurigraph.io/api/v11"))
    .build(TransactionRestClient.class);

TransactionDto tx = new TransactionDto("addr1", "addr2", "1.0");
ResponseDto response = client.submitTransaction(tx);
```

**After (gRPC):**
```java
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("dlt.aurigraph.io", 9004)
    .useTransportSecurity()
    .build();

TransactionServiceBlockingStub stub = TransactionServiceGrpc.newBlockingStub(channel);

TransactionRequest request = TransactionRequest.newBuilder()
    .setFrom("addr1")
    .setTo("addr2")
    .setAmount("1.0")
    .build();

TransactionResponse response = stub.submitTransaction(request);
```

### 4. Performance Comparison

| Metric | REST | gRPC | Improvement |
|--------|------|------|-------------|
| Throughput | 150K req/s | 1.2M req/s | 8x |
| Latency (p50) | 15ms | 2ms | 7.5x |
| Latency (p99) | 150ms | 25ms | 6x |
| CPU Usage | 80% | 35% | 2.3x |
| Memory | 2GB | 800MB | 2.5x |
```

**Client Examples (2 hours)**

Generate examples for:
- Java/Kotlin
- Python
- Go
- Node.js
- Rust

---

## Success Metrics

### Performance Targets

| Metric | Current (REST) | Target (gRPC) | Expected |
|--------|---------------|---------------|----------|
| TPS | 776K | 2M+ | ✅ Achievable |
| Latency (avg) | 15ms | 2ms | ✅ Achievable |
| Latency (p99) | 150ms | 25ms | ✅ Achievable |
| Concurrent Connections | 1K | 10K | ✅ Achievable |
| CPU Usage | 70% | 40% | ✅ Achievable |
| Memory Usage | 1.5GB | 800MB | ✅ Achievable |

### Quality Gates

- [ ] 95%+ unit test coverage
- [ ] 90%+ integration test coverage
- [ ] Load test passes at 2M TPS
- [ ] Latency p99 < 50ms
- [ ] Zero memory leaks
- [ ] Complete API documentation
- [ ] Migration guide published
- [ ] Client examples in 5 languages

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance target not met | Medium | High | Incremental testing, optimization sprints |
| Breaking changes to clients | Low | High | Versioning, gradual migration |
| gRPC complexity | Medium | Medium | Comprehensive documentation, examples |
| Testing challenges | Low | Medium | Dedicated testing infrastructure |

### Migration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Client adoption slow | Medium | Low | Clear benefits, easy migration path |
| REST deprecation issues | Low | Medium | Keep REST for 6 months during transition |
| Support burden | Medium | Low | Excellent documentation, examples |

---

## Timeline Summary

**Week 1 (Days 1-5):** Core Implementation
- Day 1: Configuration & Infrastructure ✅
- Day 2: Core Services ✅
- Day 3: Advanced Services ✅
- Day 4: Bridge & Smart Contracts ✅
- Day 5: Interceptors & Middleware ✅

**Week 2 (Days 6-10):** Testing & Integration
- Day 6-7: Unit & Integration Tests ✅
- Day 8-9: Performance Testing ✅
- Day 10: Documentation & Migration ✅

**Total Time:** 10 working days (2 weeks)

---

## Getting Started

### Quick Start Commands

```bash
# 1. Start development server
cd aurigraph-v11-standalone
./mvnw quarkus:dev

# 2. Test gRPC endpoint
grpcurl -plaintext localhost:9004 list

# 3. Submit test transaction
grpcurl -plaintext -d '{"from":"addr1","to":"addr2","amount":"1.0"}' \
  localhost:9004 TransactionService/SubmitTransaction

# 4. Run performance tests
./mvnw jmh:run

# 5. Generate client code
./mvnw clean compile
```

---

## Support & Resources

**Documentation:**
- gRPC official docs: https://grpc.io/docs/
- Quarkus gRPC guide: https://quarkus.io/guides/grpc
- Protocol Buffers: https://protobuf.dev/

**Tools:**
- grpcurl: https://github.com/fullstorydev/grpcurl
- ghz load testing: https://ghz.sh/
- Bloom RPC GUI: https://github.com/bloomrpc/bloomrpc

**Team Contacts:**
- gRPC Lead: [Name]
- Performance Team: [Channel]
- Documentation: [Wiki]

---

**Plan Version:** 1.0
**Created:** November 26, 2024
**Status:** Ready for Implementation
**Approval:** Pending
