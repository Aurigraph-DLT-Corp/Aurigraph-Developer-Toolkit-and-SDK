# gRPC REST-to-gRPC Migration Guide for V11

**Version**: 1.0.0
**Status**: Sprint 7-8 Migration Implementation
**Date**: November 13, 2025
**Target**: Complete REST ↔ gRPC bridging for 2M+ TPS

---

## Overview

This guide documents the **migration from REST to gRPC for internal V11 service communication**. The key principle is:

- **External APIs** (9003): Remain as REST/HTTP 1.1 for client compatibility
- **Internal APIs** (9004): Migrate to gRPC/HTTP/2 for performance

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│         External Clients                         │
│  (Portal, Exchanges, Wallets, Validators)       │
└──────────────┬──────────────────────────────────┘
               │
    REST/JSON (HTTP/1.1)
    Port 9003
               │
┌──────────────▼──────────────────────────────────┐
│    REST Resource Layer (JAX-RS)                 │
│    PortalAPIGateway, AurigraphResource          │
│    (DTO conversion, validation, auth)           │
└──────────────┬──────────────────────────────────┘
               │
  gRPC calls (HTTP/2)
  Port 9004 (Internal only)
               │
┌──────────────▼──────────────────────────────────┐
│    gRPC Service Implementations                 │
│    TransactionServiceImpl, ConsensusServiceImpl   │
│    ContractServiceImpl, etc.                     │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│    Core Business Logic                          │
│    TransactionService, ConsensusEngine          │
│    QuantumCryptoService, etc.                   │
└─────────────────────────────────────────────────┘
```

---

## Phase 1: TransactionService Migration

### Step 1: Create gRPC Service Client Factory

Create a **singleton gRPC client factory** to manage channels and stubs:

```java
package io.aurigraph.v11.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Singleton;
import java.util.concurrent.TimeUnit;

/**
 * Manages gRPC channels and stubs for V11 services
 * Singleton pattern ensures connection pooling and resource efficiency
 */
@ApplicationScoped
@Singleton
public class GrpcClientFactory {

    private static final String GRPC_HOST = "localhost";
    private static final int GRPC_PORT = 9004;
    private static final long CHANNEL_TIMEOUT_SECONDS = 60;

    private ManagedChannel transactionChannel;
    private ManagedChannel consensusChannel;
    private ManagedChannel contractChannel;

    private TransactionServiceGrpc.TransactionServiceBlockingStub txStub;
    private TransactionServiceGrpc.TransactionServiceAsyncStub txAsyncStub;

    /**
     * Initialize gRPC channels on startup
     */
    public void initialize() {
        try {
            Log.infof("Initializing gRPC client channels to %s:%d", GRPC_HOST, GRPC_PORT);

            // Shared channel for transaction service
            transactionChannel = ManagedChannelBuilder
                .forAddress(GRPC_HOST, GRPC_PORT)
                .usePlaintext() // Use TLS in production
                .keepAliveWithoutCalls(true)
                .keepAliveTime(30, TimeUnit.SECONDS)
                .keepAliveTimeout(5, TimeUnit.SECONDS)
                .build();

            // Create blocking stub (for synchronous calls)
            txStub = TransactionServiceGrpc
                .newBlockingStub(transactionChannel)
                .withCompression("gzip")
                .withDeadlineAfter(CHANNEL_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Create async stub (for non-blocking calls)
            txAsyncStub = TransactionServiceGrpc
                .newAsyncStub(transactionChannel)
                .withCompression("gzip");

            Log.info("gRPC client channels initialized successfully");
        } catch (Exception e) {
            Log.errorf("Failed to initialize gRPC channels: %s", e.getMessage());
            throw new RuntimeException("gRPC client initialization failed", e);
        }
    }

    /**
     * Get blocking stub for synchronous RPC calls
     */
    public TransactionServiceGrpc.TransactionServiceBlockingStub getTransactionStub() {
        if (txStub == null) {
            initialize();
        }
        return txStub;
    }

    /**
     * Get async stub for asynchronous/streaming RPC calls
     */
    public TransactionServiceGrpc.TransactionServiceAsyncStub getTransactionAsyncStub() {
        if (txAsyncStub == null) {
            initialize();
        }
        return txAsyncStub;
    }

    /**
     * Shutdown all channels on application termination
     */
    public void shutdown() {
        try {
            Log.info("Shutting down gRPC client channels...");

            if (transactionChannel != null && !transactionChannel.isShutdown()) {
                transactionChannel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
                if (!transactionChannel.isTerminated()) {
                    transactionChannel.shutdownNow();
                }
            }

            Log.info("gRPC client channels shut down successfully");
        } catch (InterruptedException e) {
            Log.error("Interrupted while shutting down gRPC channels", e);
        }
    }
}
```

### Step 2: Update REST Resource Layer

Modify **AurigraphResource.java** to call gRPC instead of REST:

```java
package io.aurigraph.v11;

import io.aurigraph.v11.grpc.GrpcClientFactory;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import io.quarkus.logging.Log;

@Path("/api/v11/transactions")
@ApplicationScoped
public class TransactionResource {

    @Inject
    GrpcClientFactory grpcClientFactory;

    /**
     * Submit transaction via REST
     * Internally calls gRPC service for performance
     */
    @POST
    @Path("/submit")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Uni<Response> submitTransaction(TransactionDTO dto) {
        return Uni.createFrom().item(() -> {
            try {
                // Convert REST DTO to gRPC message
                GRPCTransaction grpcTx = GRPCTransaction.newBuilder()
                    .setTransactionHash(dto.getHash())
                    .setSender(dto.getSender())
                    .setReceiver(dto.getReceiver())
                    .setAmount(dto.getAmount())
                    .setNonce(dto.getNonce())
                    .setGasPrice(dto.getGasPrice())
                    .setGasLimit(dto.getGasLimit())
                    .setPayload(com.google.protobuf.ByteString.copyFromUtf8(
                        dto.getPayload() != null ? dto.getPayload() : ""))
                    .setSignature(dto.getSignature())
                    .setTimestamp(com.google.protobuf.Timestamp.newBuilder()
                        .setSeconds(System.currentTimeMillis() / 1000)
                        .build())
                    .build();

                // Call gRPC service
                SubmitTransactionRequest grpcRequest =
                    SubmitTransactionRequest.newBuilder()
                        .setTransaction(grpcTx)
                        .build();

                SubmitTransactionResponse grpcResponse =
                    grpcClientFactory.getTransactionStub()
                        .submitTransaction(grpcRequest);

                // Convert response back to REST DTO
                TransactionResponseDTO responseDto = new TransactionResponseDTO(
                    grpcResponse.getSuccess(),
                    grpcResponse.getMessage(),
                    grpcResponse.getTransactionHash(),
                    grpcResponse.getMempoolSize()
                );

                int statusCode = grpcResponse.getSuccess() ? 200 : 400;
                return Response.status(statusCode)
                    .entity(responseDto)
                    .build();

            } catch (Exception e) {
                Log.errorf("Error submitting transaction: %s", e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponseDTO("Transaction submission failed", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Get mempool snapshot via REST
     * Internally calls gRPC service
     */
    @GET
    @Path("/mempool")
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<Response> getMempool() {
        return Uni.createFrom().item(() -> {
            try {
                // Call gRPC service with empty request
                MempoolSnapshot grpcMempool =
                    grpcClientFactory.getTransactionStub()
                        .getMempool(com.google.protobuf.Empty.newBuilder().build());

                // Convert to REST response
                MempoolDTO mempoolDto = new MempoolDTO(
                    grpcMempool.getSize(),
                    grpcMempool.getMaxSize(),
                    grpcMempool.getTransactionsList().size(),
                    grpcMempool.getSnapshotTime()
                );

                return Response.ok(mempoolDto).build();

            } catch (Exception e) {
                Log.errorf("Error retrieving mempool: %s", e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponseDTO("Mempool retrieval failed", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Validate transaction via REST
     * Internally calls gRPC service
     */
    @POST
    @Path("/validate")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Uni<Response> validateTransaction(TransactionDTO dto) {
        return Uni.createFrom().item(() -> {
            try {
                // Convert to gRPC message
                GRPCTransaction grpcTx = GRPCTransaction.newBuilder()
                    .setTransactionHash(dto.getHash())
                    .setSender(dto.getSender())
                    .setReceiver(dto.getReceiver())
                    .setAmount(dto.getAmount())
                    .setNonce(dto.getNonce())
                    .setGasPrice(dto.getGasPrice())
                    .setGasLimit(dto.getGasLimit())
                    .build();

                // Call gRPC validate method
                ValidateTransactionResponse response =
                    grpcClientFactory.getTransactionStub()
                        .validateTransaction(
                            ValidateTransactionRequest.newBuilder()
                                .setTransaction(grpcTx)
                                .build());

                // Convert back to REST
                ValidationResultDTO resultDto = new ValidationResultDTO(
                    response.getValid(),
                    response.getMessage(),
                    response.getValidationTimeMs()
                );

                return Response.ok(resultDto).build();

            } catch (Exception e) {
                Log.errorf("Error validating transaction: %s", e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponseDTO("Validation failed", e.getMessage()))
                    .build();
            }
        });
    }

    /**
     * Batch submit transactions via REST
     * Internally calls gRPC batch service
     */
    @POST
    @Path("/batch")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Uni<Response> batchSubmit(List<TransactionDTO> dtos) {
        return Uni.createFrom().item(() -> {
            try {
                // Convert all DTOs to gRPC messages
                List<GRPCTransaction> grpcTxList = dtos.stream()
                    .map(dto -> GRPCTransaction.newBuilder()
                        .setTransactionHash(dto.getHash())
                        .setSender(dto.getSender())
                        .setReceiver(dto.getReceiver())
                        .setAmount(dto.getAmount())
                        .setNonce(dto.getNonce())
                        .setGasPrice(dto.getGasPrice())
                        .setGasLimit(dto.getGasLimit())
                        .build())
                    .collect(Collectors.toList());

                // Call gRPC batch method
                BatchTransactionResponse grpcResponse =
                    grpcClientFactory.getTransactionStub()
                        .submitBatch(
                            BatchTransactionRequest.newBuilder()
                                .addAllTransactions(grpcTxList)
                                .build());

                // Convert response
                BatchResultDTO resultDto = new BatchResultDTO(
                    grpcResponse.getSuccess(),
                    grpcResponse.getAcceptedCount(),
                    grpcResponse.getRejectedCount(),
                    grpcResponse.getMempoolSize(),
                    grpcResponse.getProcessingTimeMs()
                );

                int statusCode = grpcResponse.getSuccess() ? 200 : 400;
                return Response.status(statusCode)
                    .entity(resultDto)
                    .build();

            } catch (Exception e) {
                Log.errorf("Error in batch submission: %s", e.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponseDTO("Batch submission failed", e.getMessage()))
                    .build();
            }
        });
    }
}
```

### Step 3: Define DTO Classes for REST Conversion

```java
package io.aurigraph.v11.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// Request DTOs
public class TransactionDTO {
    @JsonProperty("hash")
    public String hash;

    @JsonProperty("sender")
    public String sender;

    @JsonProperty("receiver")
    public String receiver;

    @JsonProperty("amount")
    public long amount;

    @JsonProperty("nonce")
    public long nonce;

    @JsonProperty("gas_price")
    public long gasPrice;

    @JsonProperty("gas_limit")
    public long gasLimit;

    @JsonProperty("payload")
    public String payload;

    @JsonProperty("signature")
    public String signature;

    // Getters/Setters omitted for brevity
}

// Response DTOs
public class TransactionResponseDTO {
    @JsonProperty("success")
    public boolean success;

    @JsonProperty("message")
    public String message;

    @JsonProperty("transaction_hash")
    public String transactionHash;

    @JsonProperty("mempool_size")
    public int mempoolSize;

    public TransactionResponseDTO(boolean success, String message,
                                 String hash, int mempoolSize) {
        this.success = success;
        this.message = message;
        this.transactionHash = hash;
        this.mempoolSize = mempoolSize;
    }
}

public class MempoolDTO {
    @JsonProperty("size")
    public int size;

    @JsonProperty("max_size")
    public int maxSize;

    @JsonProperty("transaction_count")
    public int transactionCount;

    @JsonProperty("snapshot_time")
    public long snapshotTime;
}

public class ValidationResultDTO {
    @JsonProperty("valid")
    public boolean valid;

    @JsonProperty("message")
    public String message;

    @JsonProperty("validation_time_ms")
    public long validationTimeMs;
}

public class BatchResultDTO {
    @JsonProperty("success")
    public boolean success;

    @JsonProperty("accepted_count")
    public int acceptedCount;

    @JsonProperty("rejected_count")
    public int rejectedCount;

    @JsonProperty("mempool_size")
    public int mempoolSize;

    @JsonProperty("processing_time_ms")
    public long processingTimeMs;
}

public class ErrorResponseDTO {
    @JsonProperty("error")
    public String error;

    @JsonProperty("details")
    public String details;

    public ErrorResponseDTO(String error, String details) {
        this.error = error;
        this.details = details;
    }
}
```

---

## Phase 2: ConsensusService Migration (Sprint 8)

Similar pattern as TransactionService:

```java
// 1. Add to GrpcClientFactory
private ManagedChannel consensusChannel;
private ConsensusServiceGrpc.ConsensusServiceBlockingStub consensusStub;

// 2. Create ConsensusResource.java
@Path("/api/v11/consensus")
public class ConsensusResource {
    @Inject
    GrpcClientFactory grpcClientFactory;

    @POST
    @Path("/append-entries")
    public Uni<Response> appendEntries(AppendEntriesDTO dto) {
        // Convert DTO → gRPC → Business logic
        // Similar pattern to TransactionResource
    }
}

// 3. Implement ConsensusServiceImpl
@ApplicationScoped
public class ConsensusServiceImpl
    extends ConsensusServiceGrpc.ConsensusServiceImplBase {

    @Inject
    HyperRAFTConsensusEngine consensusEngine;

    @Override
    public void appendEntries(
            AppendEntriesRequest request,
            StreamObserver<AppendEntriesResponse> responseObserver) {
        // Implementation calls consensusEngine
    }
}
```

---

## Performance Testing & Migration Validation

### Benchmark REST vs gRPC

```bash
# Test REST endpoint
ab -n 10000 -c 100 http://localhost:9003/api/v11/transactions/submit

# Test gRPC endpoint (via REST bridge)
ab -n 10000 -c 100 http://localhost:9003/api/v11/transactions/submit

# Expected improvement: 4-7x faster response times
```

### Load Testing

```bash
# Use JMeter or custom load test to validate:
# - 2M TPS throughput
# - <10ms P50 latency
# - <100ms P99 latency
# - <5% memory overhead vs REST
```

---

## Error Handling & Resilience

### Retry Pattern

```java
public static <T> T callWithRetry(
        Supplier<T> grpcCall,
        int maxRetries) {
    for (int i = 0; i < maxRetries; i++) {
        try {
            return grpcCall.get();
        } catch (io.grpc.StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.UNAVAILABLE && i < maxRetries - 1) {
                try {
                    Thread.sleep(100 * (i + 1));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            } else {
                throw e;
            }
        }
    }
    throw new RuntimeException("Max retries exceeded");
}
```

### Circuit Breaker Pattern

```java
@ApplicationScoped
public class GrpcCircuitBreaker {
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final int threshold = 5;
    private volatile boolean open = false;

    public <T> T execute(Supplier<T> call) {
        if (open) {
            throw new RuntimeException("Circuit breaker is open");
        }

        try {
            T result = call.get();
            failureCount.set(0);
            return result;
        } catch (Exception e) {
            if (failureCount.incrementAndGet() >= threshold) {
                open = true;
            }
            throw e;
        }
    }
}
```

---

## Migration Checklist

- [ ] Create GrpcClientFactory
- [ ] Add GrpcClientFactory injection to REST Resources
- [ ] Implement gRPC service
- [ ] Create DTO conversion layer
- [ ] Update REST endpoints to call gRPC
- [ ] Add error handling and retries
- [ ] Performance testing (benchmark REST vs gRPC)
- [ ] Load testing (validate 2M TPS)
- [ ] Integration testing (existing tests still pass)
- [ ] Documentation
- [ ] Deploy and monitor in production

---

## Deployment & Rollback

### Blue-Green Deployment

```bash
# Deploy new version with gRPC migration
# Run parallel tests with old and new versions
# If new version succeeds: switch traffic
# If new version fails: rollback immediately

# Metrics to monitor:
# - Response times (should decrease 4-7x)
# - Error rates (should stay same)
# - CPU usage (should decrease with gRPC)
# - Memory usage (should stay similar)
# - TPS throughput (should increase)
```

---

**Status**: Ready for Sprint 7-8 Implementation
**Next Step**: Implement GrpcClientFactory and start TransactionService migration
